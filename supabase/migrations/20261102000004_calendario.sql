-- Migration: 20261102000004_calendario.sql
-- Descrição: Estrutura do módulo de Calendário Geral (Reuniões e Eventos da Construtora, Lixeira e RLS)

-- 1. Tabela Principal de Compromissos do Calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reuniao', 'evento')),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT, -- Local físico (ex: 'Sala de Reuniões') ou link online (ex: 'meet.google.com/...')
    description TEXT, -- Pauta ou detalhes adicionais opcionais

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
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(type) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_deleted ON public.calendar_events(is_deleted);

-- 2. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.trg_calendar_events_updated_at()
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

DROP TRIGGER IF EXISTS trg_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trg_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.trg_calendar_events_updated_at();

-- 3. Configuração de Row Level Security (RLS) Idempotente
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao de consulta para compromissos do calendario" ON public.calendar_events;
CREATE POLICY "Permissao de consulta para compromissos do calendario"
ON public.calendar_events FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'calendario', 'consulta')
    )
);

DROP POLICY IF EXISTS "Permissao de insercao para compromissos do calendario" ON public.calendar_events;
CREATE POLICY "Permissao de insercao para compromissos do calendario"
ON public.calendar_events FOR INSERT
TO authenticated
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'calendario', 'edicao')
    )
);

DROP POLICY IF EXISTS "Permissao de atualizacao para compromissos do calendario" ON public.calendar_events;
CREATE POLICY "Permissao de atualizacao para compromissos do calendario"
ON public.calendar_events FOR UPDATE
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'calendario', 'edicao')
    )
)
WITH CHECK (
    public.is_user_active(auth.uid()) AND (
        public.is_superadmin(auth.uid()) OR
        public.has_area_permission(auth.uid(), 'calendario', 'edicao')
    )
);

DROP POLICY IF EXISTS "Permissao de exclusao fisica apenas para Superadmin" ON public.calendar_events;
CREATE POLICY "Permissao de exclusao fisica apenas para Superadmin" 
ON public.calendar_events FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

