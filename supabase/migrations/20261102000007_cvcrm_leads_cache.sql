-- Migration: 20261102000007_cvcrm_leads_cache.sql
-- Descrição: Tabela de cache de leads do CVCRM (Fila TOP 5 e Meta) para consultas de período flexível (Data A à B, Todo o Período) e métricas por esteira

CREATE TABLE IF NOT EXISTS public.cvcrm_leads_cache (
    idlead BIGINT PRIMARY KEY,
    agency_id UUID REFERENCES public.real_estate_agencies(id) ON DELETE CASCADE,
    agency_name TEXT NOT NULL,
    agency_cvcrm_id TEXT NOT NULL,
    data_cad TIMESTAMPTZ NOT NULL,
    situacao_id INTEGER,
    situacao_nome TEXT NOT NULL,
    origem TEXT,
    midia_principal TEXT,
    qtde_simulacoes INTEGER DEFAULT 0,
    qtde_reservas INTEGER DEFAULT 0,
    synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvcrm_leads_data_cad ON public.cvcrm_leads_cache(data_cad DESC);
CREATE INDEX IF NOT EXISTS idx_cvcrm_leads_agency ON public.cvcrm_leads_cache(agency_id);
CREATE INDEX IF NOT EXISTS idx_cvcrm_leads_situacao ON public.cvcrm_leads_cache(situacao_nome);

ALTER TABLE public.cvcrm_leads_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consulta de leads cvcrm para usuarios com acesso" ON public.cvcrm_leads_cache;
CREATE POLICY "Consulta de leads cvcrm para usuarios com acesso"
ON public.cvcrm_leads_cache FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'consulta')
    )
);

DROP POLICY IF EXISTS "Modificacao de leads cvcrm apenas para Superadmin ou edicao" ON public.cvcrm_leads_cache;
CREATE POLICY "Modificacao de leads cvcrm apenas para Superadmin ou edicao"
ON public.cvcrm_leads_cache FOR ALL
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'imobiliarias', 'edicao')
    )
);

