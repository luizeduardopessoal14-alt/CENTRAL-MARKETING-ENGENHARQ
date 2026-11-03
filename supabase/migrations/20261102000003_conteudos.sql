-- Migration: 20261102000003_conteudos.sql
-- Descrição: Estrutura do módulo de Conteúdos (Kanban de Redes Sociais, Alertas de Prazo, Histórico e RLS)

-- 1. Tabela Principal de Cartões de Conteúdo (Quadro Kanban)
CREATE TABLE IF NOT EXISTS public.content_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT, -- Opcional na coluna 'ideias', obrigatório para avançar
    description TEXT NOT NULL, -- Descrição livre da ideia / briefing
    column_status TEXT NOT NULL CHECK (
        column_status IN ('ideias', 'a_produzir', 'em_producao', 'em_aprovacao', 'pronto_publicar', 'publicado')
    ) DEFAULT 'ideias',
    order_index NUMERIC NOT NULL DEFAULT 1000,
    
    -- Responsável e Prazos
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_name TEXT,
    due_date DATE, -- Data de entrega (produção, ajustes e aprovação)
    published_at TIMESTAMPTZ, -- Data em que foi movido para 'publicado'

    -- Lixeira (Exclusão Lógica)
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Metadados de Auditoria e Criação
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca, filtros e ordenação rápida
CREATE INDEX IF NOT EXISTS idx_content_cards_status_order ON public.content_cards(column_status, order_index) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_content_cards_due_date ON public.content_cards(due_date) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_content_cards_assigned_to ON public.content_cards(assigned_to) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_content_cards_is_deleted ON public.content_cards(is_deleted);

-- 2. Tabela de Histórico de Movimentações e Alterações dos Cartões
CREATE TABLE IF NOT EXISTS public.content_card_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.content_cards(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'criacao', 'movimentacao', 'alteracao_prazo', 'edicao', 'restaurado'
    from_status TEXT,
    to_status TEXT,
    old_due_date DATE,
    new_due_date DATE,
    details JSONB DEFAULT '{}'::jsonb,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_history_card ON public.content_card_history(card_id, created_at DESC);

-- 3. Trigger BEFORE UPDATE para datas automáticas (updated_at e published_at)
CREATE OR REPLACE FUNCTION public.trg_content_cards_before_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();

    IF NEW.column_status = 'publicado' AND (OLD.column_status IS DISTINCT FROM 'publicado') THEN
        NEW.published_at := coalesce(NEW.published_at, now());
    ELSIF NEW.column_status != 'publicado' AND OLD.column_status = 'publicado' THEN
        NEW.published_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_cards_before_update ON public.content_cards;
CREATE TRIGGER trg_content_cards_before_update
BEFORE UPDATE ON public.content_cards
FOR EACH ROW
EXECUTE FUNCTION public.trg_content_cards_before_update();

-- 4. Trigger AFTER INSERT OR UPDATE para registrar histórico (após o cartão já existir no banco)
CREATE OR REPLACE FUNCTION public.trg_content_cards_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_name TEXT := 'Sistema';
BEGIN
    IF auth.uid() IS NOT NULL THEN
        SELECT coalesce(full_name, username) INTO v_user_name
        FROM public.profiles
        WHERE id = auth.uid();
    END IF;

    -- Criação inicial
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.content_card_history (
            card_id,
            action,
            to_status,
            new_due_date,
            changed_by,
            changed_by_name
        ) VALUES (
            NEW.id,
            'criacao',
            NEW.column_status,
            NEW.due_date,
            auth.uid(),
            coalesce(v_user_name, 'Sistema')
        );
        RETURN NEW;
    END IF;

    -- Alteração de coluna (movimentação no Kanban)
    IF TG_OP = 'UPDATE' AND (NEW.column_status IS DISTINCT FROM OLD.column_status) THEN
        INSERT INTO public.content_card_history (
            card_id,
            action,
            from_status,
            to_status,
            old_due_date,
            new_due_date,
            changed_by,
            changed_by_name
        ) VALUES (
            NEW.id,
            'movimentacao',
            OLD.column_status,
            NEW.column_status,
            OLD.due_date,
            NEW.due_date,
            auth.uid(),
            coalesce(v_user_name, 'Sistema')
        );
    END IF;

    -- Alteração de data de entrega
    IF TG_OP = 'UPDATE' AND (NEW.due_date IS DISTINCT FROM OLD.due_date) AND (NEW.column_status = OLD.column_status) THEN
        INSERT INTO public.content_card_history (
            card_id,
            action,
            from_status,
            to_status,
            old_due_date,
            new_due_date,
            changed_by,
            changed_by_name
        ) VALUES (
            NEW.id,
            'alteracao_prazo',
            NEW.column_status,
            NEW.column_status,
            OLD.due_date,
            NEW.due_date,
            auth.uid(),
            coalesce(v_user_name, 'Sistema')
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_cards_audit ON public.content_cards;
DROP TRIGGER IF EXISTS trg_content_cards_after_change ON public.content_cards;
CREATE TRIGGER trg_content_cards_after_change
AFTER INSERT OR UPDATE ON public.content_cards
FOR EACH ROW
EXECUTE FUNCTION public.trg_content_cards_after_change();

-- 5. Configuração de Row Level Security (RLS) Idempotente
ALTER TABLE public.content_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_card_history ENABLE ROW LEVEL SECURITY;

-- Políticas para content_cards
DROP POLICY IF EXISTS "Permissao de consulta para cartoes de conteudo" ON public.content_cards;
CREATE POLICY "Permissao de consulta para cartoes de conteudo"
ON public.content_cards FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'consulta')
    )
);

DROP POLICY IF EXISTS "Permissao de insercao para cartoes de conteudo" ON public.content_cards;
CREATE POLICY "Permissao de insercao para cartoes de conteudo"
ON public.content_cards FOR INSERT
TO authenticated
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'edicao')
    )
);

DROP POLICY IF EXISTS "Permissao de atualizacao para cartoes de conteudo" ON public.content_cards;
CREATE POLICY "Permissao de atualizacao para cartoes de conteudo"
ON public.content_cards FOR UPDATE
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'edicao')
    )
)
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'edicao')
    )
);

DROP POLICY IF EXISTS "Permissao de exclusao fisica apenas para Superadmin" ON public.content_cards;
CREATE POLICY "Permissao de exclusao fisica apenas para Superadmin"
ON public.content_cards FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Políticas para content_card_history
DROP POLICY IF EXISTS "Permissao de consulta ao historico de cartoes" ON public.content_card_history;
CREATE POLICY "Permissao de consulta ao historico de cartoes"
ON public.content_card_history FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'consulta')
    )
);

DROP POLICY IF EXISTS "Insercao no historico de cartoes via trigger ou usuario com edicao" ON public.content_card_history;
CREATE POLICY "Insercao no historico de cartoes via trigger ou usuario com edicao"
ON public.content_card_history FOR INSERT
TO authenticated
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'conteudos', 'edicao')
    )
);
