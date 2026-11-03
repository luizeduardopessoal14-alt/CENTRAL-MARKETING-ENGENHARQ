-- Migration: 20261102000005_midia_campanhas.sql
-- Descrição: Estrutura do módulo de Mídia e Campanhas (Meta Ads & Instagram Insights, Configuração de Conexão e RLS)

-- 1. Tabela de Configuração e Status da Integração Meta
CREATE TABLE IF NOT EXISTS public.meta_integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id TEXT, -- Ex: 'act_1234567890'
    instagram_business_id TEXT, -- Ex: '17841400000000000'
    facebook_page_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('desconectado', 'conectado', 'erro')) DEFAULT 'desconectado',
    last_sync_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Inserir registro único de configuração caso não exista
INSERT INTO public.meta_integration_config (status)
SELECT 'desconectado'
WHERE NOT EXISTS (SELECT 1 FROM public.meta_integration_config);

-- 2. Tabela de Métricas Agregadas de Campanhas (Meta Ads)
CREATE TABLE IF NOT EXISTS public.meta_campaign_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    objective TEXT NOT NULL DEFAULT 'cadastros', -- 'cadastros', 'reconhecimento', 'visitas_perfil', 'outro'
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'ARCHIVED'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    spend NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Investimento em R$
    leads INTEGER NOT NULL DEFAULT 0, -- Cadastros de formulário nativo Meta
    cost_per_lead NUMERIC(12, 2), -- CPL
    reach INTEGER NOT NULL DEFAULT 0, -- Alcance
    impressions INTEGER NOT NULL DEFAULT 0, -- Impressões
    clicks INTEGER NOT NULL DEFAULT 0, -- Cliques no link
    cpm NUMERIC(12, 2), -- Custo por mil impressões
    frequency NUMERIC(6, 2) DEFAULT 1.0, -- Frequência média
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_campaign_period UNIQUE (campaign_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_meta_insights_period ON public.meta_campaign_insights(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_meta_insights_objective ON public.meta_campaign_insights(objective);

-- 3. Tabela de Métricas do Perfil do Instagram
CREATE TABLE IF NOT EXISTS public.instagram_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_date DATE NOT NULL UNIQUE,
    followers_count INTEGER NOT NULL DEFAULT 0,
    reach INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    profile_views INTEGER NOT NULL DEFAULT 0,
    interactions INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_insights_date ON public.instagram_insights(period_date DESC);

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.trg_meta_config_updated_at()
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

DROP TRIGGER IF EXISTS trg_meta_config_updated_at ON public.meta_integration_config;
CREATE TRIGGER trg_meta_config_updated_at
BEFORE UPDATE ON public.meta_integration_config
FOR EACH ROW
EXECUTE FUNCTION public.trg_meta_config_updated_at();

-- 5. Row Level Security (RLS) Idempotente
ALTER TABLE public.meta_integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_insights ENABLE ROW LEVEL SECURITY;

-- Políticas para meta_integration_config
DROP POLICY IF EXISTS "Consulta de config de midia para usuarios com acesso" ON public.meta_integration_config;
CREATE POLICY "Consulta de config de midia para usuarios com acesso"
ON public.meta_integration_config FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'consulta')
    )
);

DROP POLICY IF EXISTS "Atualizacao de config de midia apenas para Superadmin ou edicao" ON public.meta_integration_config;
CREATE POLICY "Atualizacao de config de midia apenas para Superadmin ou edicao"
ON public.meta_integration_config FOR UPDATE
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'edicao')
    )
)
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'edicao')
    )
);

-- Políticas para meta_campaign_insights
DROP POLICY IF EXISTS "Consulta de metricas de campanhas para usuarios autorizados" ON public.meta_campaign_insights;
CREATE POLICY "Consulta de metricas de campanhas para usuarios autorizados"
ON public.meta_campaign_insights FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'consulta')
    )
);

DROP POLICY IF EXISTS "Insercao e atualizacao de metricas apenas com edicao ou Superadmin" ON public.meta_campaign_insights;
CREATE POLICY "Insercao e atualizacao de metricas apenas com edicao ou Superadmin"
ON public.meta_campaign_insights FOR ALL
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'edicao')
    )
);

-- Políticas para instagram_insights
DROP POLICY IF EXISTS "Consulta de metricas do Instagram para usuarios autorizados" ON public.instagram_insights;
CREATE POLICY "Consulta de metricas do Instagram para usuarios autorizados"
ON public.instagram_insights FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'consulta')
    )
);

DROP POLICY IF EXISTS "Insercao e atualizacao de metricas do Instagram" ON public.instagram_insights;
CREATE POLICY "Insercao e atualizacao de metricas do Instagram"
ON public.instagram_insights FOR ALL
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'midia', 'edicao')
    )
);

