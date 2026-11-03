-- Migration: 20261102000001_initial_schema.sql
-- Descrição: Estrutura inicial de Perfis, Permissões por Aba, Auditoria, RLS e Funções Administrativas

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabela de Perfis de Usuário (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    lower_username TEXT GENERATED ALWAYS AS (lower(trim(username))) STORED UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'user')) DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_lower_username ON public.profiles(lower_username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 3. Tabela de Permissões por Aba
-- Áreas aprovadas: financeiro, conteudos, calendario, midia, imobiliarias, relatorios
-- Níveis: sem_acesso, consulta, edicao
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    area TEXT NOT NULL CHECK (area IN ('financeiro', 'conteudos', 'calendario', 'midia', 'imobiliarias', 'relatorios')),
    access_level TEXT NOT NULL CHECK (access_level IN ('sem_acesso', 'consulta', 'edicao')) DEFAULT 'sem_acesso',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_area UNIQUE (user_id, area)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_area ON public.user_permissions(user_id, area);

-- 4. Tabela de Auditoria e Histórico Geral
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 5. Funções Auxiliares de Segurança e RLS
CREATE OR REPLACE FUNCTION public.is_user_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND role = 'superadmin' AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.has_area_permission(p_user_id UUID, p_area TEXT, p_required_level TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_role TEXT;
    v_level TEXT;
BEGIN
    SELECT is_active, role INTO v_is_active, v_role
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_is_active IS NOT TRUE THEN
        RETURN FALSE;
    END IF;

    -- Superadministrador tem permissão total em tudo
    IF v_role = 'superadmin' THEN
        RETURN TRUE;
    END IF;

    SELECT access_level INTO v_level
    FROM public.user_permissions
    WHERE user_id = p_user_id AND area = p_area;

    IF v_level IS NULL OR v_level = 'sem_acesso' THEN
        RETURN FALSE;
    END IF;

    IF p_required_level = 'consulta' THEN
        RETURN v_level IN ('consulta', 'edicao');
    ELSIF p_required_level = 'edicao' THEN
        RETURN v_level = 'edicao';
    END IF;

    RETURN FALSE;
END;
$$;

-- 6. Resolver Nome de Usuário para Identificador Interno do Supabase Auth
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT u.email INTO v_email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.lower_username = lower(trim(p_username))
      AND p.is_active = true
    LIMIT 1;

    IF v_email IS NOT NULL THEN
        RETURN v_email;
    ELSE
        RETURN 'synthetic_' || md5(coalesce(p_username, '')) || '@auth.engenharq.internal';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_identifier(TEXT) TO anon, authenticated;

-- 7. Configuração de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizar perfis ativos"
ON public.profiles FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        is_active = true OR public.is_superadmin(auth.uid())
    )
);

CREATE POLICY "Superadmin edita perfis"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Visualizar permissoes"
ON public.user_permissions FOR SELECT
TO authenticated
USING (
    public.is_user_active(auth.uid()) AND (
        user_id = auth.uid() OR public.is_superadmin(auth.uid())
    )
);

CREATE POLICY "Superadmin gerencia permissoes INSERT"
ON public.user_permissions FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin gerencia permissoes UPDATE"
ON public.user_permissions FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin gerencia permissoes DELETE"
ON public.user_permissions FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin visualiza auditoria"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Inserir logs de auditoria"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_user_active(auth.uid()));

-- 8. Procedimentos Administrativos (Criar Usuário, Redefinir Senha, Desativar)
CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_username TEXT,
    p_full_name TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'user',
    p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_new_user_id UUID;
    v_internal_email TEXT;
    v_clean_username TEXT;
    v_encrypted_pw TEXT;
    v_area TEXT;
    v_level TEXT;
BEGIN
    IF NOT public.is_superadmin(v_admin_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas o Superadministrador pode cadastrar usuários.';
    END IF;

    v_clean_username := trim(p_username);
    IF length(v_clean_username) < 3 THEN
        RAISE EXCEPTION 'O nome de usuário deve ter pelo menos 3 caracteres.';
    END IF;

    IF length(p_password) < 6 THEN
        RAISE EXCEPTION 'A senha deve ter pelo menos 6 caracteres.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.profiles WHERE lower_username = lower(v_clean_username)) THEN
        RAISE EXCEPTION 'Já existe um usuário cadastrado com esse nome de usuário.';
    END IF;

    v_new_user_id := gen_random_uuid();
    v_internal_email := 'user_' || replace(v_new_user_id::text, '-', '') || '@auth.engenharq.internal';
    v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        reauthentication_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_new_user_id,
        'authenticated',
        'authenticated',
        v_internal_email,
        v_encrypted_pw,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', v_clean_username, 'full_name', p_full_name, 'email_verified', true),
        now(),
        now(),
        '',
        '',
        '',
        '',
        ''
    );

    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_new_user_id,
        jsonb_build_object('sub', v_new_user_id::text, 'email', v_internal_email, 'email_verified', true, 'phone_verified', false),
        'email',
        v_new_user_id::text,
        now(),
        now(),
        now()
    );

    INSERT INTO public.profiles (
        id,
        username,
        full_name,
        role,
        is_active
    ) VALUES (
        v_new_user_id,
        v_clean_username,
        trim(p_full_name),
        CASE WHEN p_role = 'superadmin' THEN 'superadmin' ELSE 'user' END,
        true
    );

    FOREACH v_area IN ARRAY ARRAY['financeiro', 'conteudos', 'calendario', 'midia', 'imobiliarias', 'relatorios']
    LOOP
        v_level := coalesce(p_permissions->>v_area, 'sem_acesso');
        IF v_level NOT IN ('sem_acesso', 'consulta', 'edicao') THEN
            v_level := 'sem_acesso';
        END IF;

        INSERT INTO public.user_permissions (user_id, area, access_level)
        VALUES (v_new_user_id, v_area, v_level)
        ON CONFLICT (user_id, area) DO UPDATE SET access_level = EXCLUDED.access_level;
    END LOOP;

    RETURN v_new_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    p_target_user_id UUID,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_superadmin(v_admin_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas o Superadministrador pode redefinir senhas.';
    END IF;

    IF length(p_new_password) < 6 THEN
        RAISE EXCEPTION 'A nova senha deve ter pelo menos 6 caracteres.';
    END IF;

    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
        updated_at = now()
    WHERE id = p_target_user_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_active_status(
    p_target_user_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_target_role TEXT;
    v_superadmin_count INT;
BEGIN
    IF NOT public.is_superadmin(v_admin_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas o Superadministrador pode alterar status de usuários.';
    END IF;

    SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user_id;

    IF v_target_role = 'superadmin' AND p_is_active IS FALSE THEN
        SELECT count(*) INTO v_superadmin_count FROM public.profiles WHERE role = 'superadmin' AND is_active = true;
        IF v_superadmin_count <= 1 THEN
            RAISE EXCEPTION 'Não é permitido desativar o único Superadministrador ativo do sistema.';
        END IF;
    END IF;

    UPDATE public.profiles
    SET is_active = p_is_active,
        updated_at = now()
    WHERE id = p_target_user_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_permission(
    p_target_user_id UUID,
    p_area TEXT,
    p_access_level TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_superadmin(v_admin_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas o Superadministrador pode alterar permissões.';
    END IF;

    IF p_access_level NOT IN ('sem_acesso', 'consulta', 'edicao') THEN
        RAISE EXCEPTION 'Nível de acesso inválido.';
    END IF;

    INSERT INTO public.user_permissions (user_id, area, access_level, updated_at)
    VALUES (p_target_user_id, p_area, p_access_level, now())
    ON CONFLICT (user_id, area) DO UPDATE 
    SET access_level = EXCLUDED.access_level,
        updated_at = now();

    RETURN TRUE;
END;
$$;
