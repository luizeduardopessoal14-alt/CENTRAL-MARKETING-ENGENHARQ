-- Migration: 20261102000002_financeiro.sql
-- Descrição: Estrutura completa do módulo Financeiro (Cobranças, Histórico de Previsão, Lixeira, Storage e RLS)

-- 1. Categorias padronizadas do Marketing
-- 'Midia Paga & Anuncios', 'Grafica & Comunicacao Visual', 'Eventos & Feiroes',
-- 'Brindes & Uniformes', 'Producao Audiovisual & 3D', 'Servicos Tecnicos & Taxas', 'Outros'

-- 2. Tabela de Cobranças / Pagamentos do Financeiro
CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    receipt_date DATE NOT NULL,
    authorized_by TEXT, -- Hugo, Adriano, Flavia, etc.
    invoice_number TEXT,
    attachment_path TEXT,
    attachment_name TEXT,
    
    -- Datas do fluxo com o financeiro / Sienge
    forwarded_to_finance_date DATE,
    payment_forecast_date DATE,
    payment_actual_date DATE,
    notes TEXT,

    -- Situação da jornada: 'a_encaminhar', 'aguardando_previsao', 'pagamento_previsto', 'pago'
    status TEXT GENERATED ALWAYS AS (
        CASE
            WHEN payment_actual_date IS NOT NULL THEN 'pago'
            WHEN payment_forecast_date IS NOT NULL THEN 'pagamento_previsto'
            WHEN forwarded_to_finance_date IS NOT NULL THEN 'aguardando_previsao'
            ELSE 'a_encaminhar'
        END
    ) STORED,

    -- Lixeira (Exclusão Lógica)
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Metadados e Auditoria de Criação
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para filtros e cálculos rápidos
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON public.financial_records(status) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_financial_records_receipt_date ON public.financial_records(receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_forecast_date ON public.financial_records(payment_forecast_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_actual_date ON public.financial_records(payment_actual_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_supplier ON public.financial_records(supplier);
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON public.financial_records(category);
CREATE INDEX IF NOT EXISTS idx_financial_records_is_deleted ON public.financial_records(is_deleted);

-- 3. Histórico de Mudanças de Previsão de Pagamento
-- Conforme regra de negócio: guarda o histórico de quem e quando alterou a previsão informada pelo financeiro
CREATE TABLE IF NOT EXISTS public.financial_forecast_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES public.financial_records(id) ON DELETE CASCADE,
    old_forecast_date DATE,
    new_forecast_date DATE NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecast_history_record ON public.financial_forecast_history(record_id, changed_at DESC);

-- 4. Trigger Atômico no PostgreSQL para registrar histórico de previsão
CREATE OR REPLACE FUNCTION public.trg_track_payment_forecast_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_name TEXT := 'Sistema';
BEGIN
    -- Se a data de previsão foi preenchida ou alterada
    IF (TG_OP = 'INSERT' AND NEW.payment_forecast_date IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND (NEW.payment_forecast_date IS DISTINCT FROM OLD.payment_forecast_date) AND NEW.payment_forecast_date IS NOT NULL) THEN
        
        IF auth.uid() IS NOT NULL THEN
            SELECT coalesce(full_name, username) INTO v_user_name
            FROM public.profiles
            WHERE id = auth.uid();
        END IF;

        INSERT INTO public.financial_forecast_history (
            record_id,
            old_forecast_date,
            new_forecast_date,
            changed_by,
            changed_by_name,
            changed_at
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.payment_forecast_date ELSE NULL END,
            NEW.payment_forecast_date,
            auth.uid(),
            coalesce(v_user_name, 'Sistema'),
            now()
        );
    END IF;

    -- Atualiza updated_at automaticamente
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_forecast ON public.financial_records;
CREATE TRIGGER trg_financial_forecast
BEFORE INSERT OR UPDATE ON public.financial_records
FOR EACH ROW
EXECUTE FUNCTION public.trg_track_payment_forecast_changes();

-- 5. Configuração de Row Level Security (RLS)
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_forecast_history ENABLE ROW LEVEL SECURITY;

-- Políticas para financial_records:
-- 1. SELECT: Usuários com permissão 'consulta' ou 'edicao' na aba 'financeiro'
--    Usuários normais só veem registros NÃO excluídos (is_deleted = false).
--    Superadministrador vê tudo (inclusive itens da lixeira para restauração).
CREATE POLICY "Visualizar registros financeiros"
ON public.financial_records FOR SELECT
TO authenticated
USING (
    public.has_area_permission(auth.uid(), 'financeiro', 'consulta') AND (
        is_deleted = false OR public.is_superadmin(auth.uid())
    )
);

-- 2. INSERT: Apenas usuários com permissão 'edicao' na aba 'financeiro'
CREATE POLICY "Criar registros financeiros"
ON public.financial_records FOR INSERT
TO authenticated
WITH CHECK (
    public.has_area_permission(auth.uid(), 'financeiro', 'edicao')
);

-- 3. UPDATE: Usuários com permissão 'edicao' podem alterar campos e mover para a lixeira
--    Restaurar da lixeira é exclusivo do Superadministrador
CREATE POLICY "Editar registros financeiros"
ON public.financial_records FOR UPDATE
TO authenticated
USING (
    public.has_area_permission(auth.uid(), 'financeiro', 'edicao') AND (
        is_deleted = false OR public.is_superadmin(auth.uid())
    )
)
WITH CHECK (
    public.has_area_permission(auth.uid(), 'financeiro', 'edicao') AND (
        -- Se estiver restaurando da lixeira (is_deleted mudando de true para false), exige superadmin
        (is_deleted = false AND NOT public.is_superadmin(auth.uid()) AND (SELECT is_deleted FROM public.financial_records WHERE id = financial_records.id) = false)
        OR public.is_superadmin(auth.uid())
        OR is_deleted = true -- Pode enviar para a lixeira
    )
);

-- 4. DELETE: Exclusão definitiva permanente exclusiva do Superadministrador
CREATE POLICY "Excluir definitivamente registros financeiros"
ON public.financial_records FOR DELETE
TO authenticated
USING (
    public.is_superadmin(auth.uid())
);

-- Políticas para financial_forecast_history:
-- Visualização por quem tem acesso à aba de financeiro
CREATE POLICY "Visualizar historico de previsoes"
ON public.financial_forecast_history FOR SELECT
TO authenticated
USING (
    public.has_area_permission(auth.uid(), 'financeiro', 'consulta')
);

-- 6. Configuração do Bucket Privado de Anexos no Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'financial-attachments',
    'financial-attachments',
    false,
    10485760, -- 10MB máximo
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Políticas de Storage para o bucket financial-attachments:
CREATE POLICY "Visualizar anexos financeiros"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'financial-attachments' AND
    public.has_area_permission(auth.uid(), 'financeiro', 'consulta')
);

CREATE POLICY "Fazer upload de anexos financeiros"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'financial-attachments' AND
    public.has_area_permission(auth.uid(), 'financeiro', 'edicao')
);

CREATE POLICY "Excluir anexos financeiros"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'financial-attachments' AND
    public.has_area_permission(auth.uid(), 'financeiro', 'edicao')
);

