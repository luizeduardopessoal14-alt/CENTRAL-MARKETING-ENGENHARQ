-- Migration: 20261102000006_imobiliarias.sql
-- Descrição: Módulo de Leads e Imobiliárias (Integração CVCRM, Imobiliárias Parceiras e Métricas de Conversão)

-- 1. Tabela de Configuração da Integração CVCRM
CREATE TABLE IF NOT EXISTS public.cvcrm_integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_url TEXT DEFAULT 'https://engenharq.cvcrm.com.br',
    email TEXT,
    token TEXT,
    status TEXT NOT NULL CHECK (status IN ('desconectado', 'conectado', 'erro')) DEFAULT 'desconectado',
    last_sync_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Inserir registro único de configuração caso não exista
INSERT INTO public.cvcrm_integration_config (status)
SELECT 'desconectado'
WHERE NOT EXISTS (SELECT 1 FROM public.cvcrm_integration_config);

-- 2. Tabela de Imobiliárias Parceiras
CREATE TABLE IF NOT EXISTS public.real_estate_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    cvcrm_id TEXT, -- Identificador da imobiliária no CVCRM
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agencies_name ON public.real_estate_agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_active ON public.real_estate_agencies(is_active);

-- 3. Tabela de Métricas Consolidadas por Imobiliária (CVCRM)
CREATE TABLE IF NOT EXISTS public.agency_metrics_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.real_estate_agencies(id) ON DELETE CASCADE,
    period_month DATE NOT NULL, -- Primeiro dia do mês correspondente (ex: '2026-11-01')
    leads_received INTEGER NOT NULL DEFAULT 0,
    in_attendance INTEGER NOT NULL DEFAULT 0,
    visits INTEGER NOT NULL DEFAULT 0,
    proposals INTEGER NOT NULL DEFAULT 0,
    sales INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_agency_month UNIQUE (agency_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_agency_metrics_month ON public.agency_metrics_monthly(period_month DESC);
CREATE INDEX IF NOT EXISTS idx_agency_metrics_agency ON public.agency_metrics_monthly(agency_id);

-- 4. Triggers para updated_at
CREATE OR REPLACE FUNCTION public.trg_cvcrm_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvcrm_config_updated_at ON public.cvcrm_integration_config;
CREATE TRIGGER trg_cvcrm_config_updated_at
BEFORE UPDATE ON public.cvcrm_integration_config
FOR EACH ROW
EXECUTE FUNCTION public.trg_cvcrm_config_updated_at();

CREATE OR REPLACE FUNCTION public.trg_agencies_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON public.real_estate_agencies;
CREATE TRIGGER trg_agencies_updated_at
BEFORE UPDATE ON public.real_estate_agencies
FOR EACH ROW
EXECUTE FUNCTION public.trg_agencies_updated_at();

CREATE OR REPLACE FUNCTION public.trg_agency_metrics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agency_metrics_updated_at ON public.agency_metrics_monthly;
CREATE TRIGGER trg_agency_metrics_updated_at
BEFORE UPDATE ON public.agency_metrics_monthly
FOR EACH ROW
EXECUTE FUNCTION public.trg_agency_metrics_updated_at();

-- 5. Row Level Security (RLS) Idempotente
ALTER TABLE public.cvcrm_integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_metrics_monthly ENABLE ROW LEVEL SECURITY;

-- Políticas para cvcrm_integration_config
DROP POLICY IF EXISTS "Consulta de config CVCRM para usuarios com acesso" ON public.cvcrm_integration_config;
CREATE POLICY "Consulta de config CVCRM para usuarios com acesso"
ON public.cvcrm_integration_config FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'consulta')
    )
);

DROP POLICY IF EXISTS "Atualizacao de config CVCRM para Superadmin ou edicao" ON public.cvcrm_integration_config;
CREATE POLICY "Atualizacao de config CVCRM para Superadmin ou edicao"
ON public.cvcrm_integration_config FOR UPDATE
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'edicao')
    )
)
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'edicao')
    )
);

-- Políticas para real_estate_agencies
DROP POLICY IF EXISTS "Consulta de imobiliarias para usuarios autorizados" ON public.real_estate_agencies;
CREATE POLICY "Consulta de imobiliarias para usuarios autorizados"
ON public.real_estate_agencies FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'consulta')
    )
);

DROP POLICY IF EXISTS "Modificacao de imobiliarias para Superadmin ou edicao" ON public.real_estate_agencies;
CREATE POLICY "Modificacao de imobiliarias para Superadmin ou edicao"
ON public.real_estate_agencies FOR ALL
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'edicao')
    )
);

-- Políticas para agency_metrics_monthly
DROP POLICY IF EXISTS "Consulta de metricas mensais de imobiliarias" ON public.agency_metrics_monthly;
CREATE POLICY "Consulta de metricas mensais de imobiliarias"
ON public.agency_metrics_monthly FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'consulta')
    )
);

DROP POLICY IF EXISTS "Modificacao de metricas para Superadmin ou edicao" ON public.agency_metrics_monthly;
CREATE POLICY "Modificacao de metricas para Superadmin ou edicao"
ON public.agency_metrics_monthly FOR ALL
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'edicao')
    )
);

-- 6. Inserir Imobiliárias Iniciais de Exemplo caso a tabela esteja vazia
INSERT INTO public.real_estate_agencies (name, contact_name, phone, email, notes)
SELECT 'Imobiliária Prime', 'Carlos Silva', '(11) 98888-1111', 'contato@prime.com.br', 'Foco em lançamentos de alto padrão'
WHERE NOT EXISTS (SELECT 1 FROM public.real_estate_agencies);

INSERT INTO public.real_estate_agencies (name, contact_name, phone, email, notes)
SELECT 'Lopes Consultoria', 'Fernanda Souza', '(11) 97777-2222', 'contato@lopes.com.br', 'Parceira de vendas comerciais'
WHERE NOT EXISTS (SELECT 1 FROM public.real_estate_agencies WHERE name = 'Lopes Consultoria');

INSERT INTO public.real_estate_agencies (name, contact_name, phone, email, notes)
SELECT 'Nova Aliança Imóveis', 'Roberto Lima', '(11) 96666-3333', 'roberto@novaalianca.com.br', 'Zona Sul e Região Metropolitana'
WHERE NOT EXISTS (SELECT 1 FROM public.real_estate_agencies WHERE name = 'Nova Aliança Imóveis');

