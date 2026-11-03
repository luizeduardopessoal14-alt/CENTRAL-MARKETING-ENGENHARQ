import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserPermission, AppArea, AccessLevel } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  permissions: Record<AppArea, AccessLevel>;
  isLoading: boolean;
  hasAccess: (area: AppArea, minLevel?: 'consulta' | 'edicao') => boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const defaultPermissions: Record<AppArea, AccessLevel> = {
  visao_geral: 'consulta',
  financeiro: 'sem_acesso',
  conteudos: 'sem_acesso',
  calendario: 'sem_acesso',
  midia: 'sem_acesso',
  imobiliarias: 'sem_acesso',
  relatorios: 'sem_acesso',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Record<AppArea, AccessLevel>>(defaultPermissions);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // 1. Carregar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Erro ao carregar perfil:', profileError);
        await supabase.auth.signOut();
        setUser(null);
        setPermissions(defaultPermissions);
        return;
      }

      // Bloqueio imediato se o usuário estiver desativado
      if (!profile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setPermissions(defaultPermissions);
        return;
      }

      setUser(profile as UserProfile);

      // 2. Se for Superadministrador, tem acesso total em todas as abas
      if (profile.role === 'superadmin') {
        setPermissions({
          visao_geral: 'edicao',
          financeiro: 'edicao',
          conteudos: 'edicao',
          calendario: 'edicao',
          midia: 'edicao',
          imobiliarias: 'edicao',
          relatorios: 'edicao',
        });
        return;
      }

      // 3. Se for usuário comum, buscar permissões específicas
      const { data: permsData, error: permsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (permsError) {
        console.error('Erro ao carregar permissões:', permsError);
      }

      const userPerms: Record<AppArea, AccessLevel> = { ...defaultPermissions };
      if (permsData) {
        permsData.forEach((p: UserPermission) => {
          if (p.area in userPerms) {
            userPerms[p.area] = p.access_level;
          }
        });
      }

      setPermissions(userPerms);
    } catch (err) {
      console.error('Falha geral ao buscar dados do usuário:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await fetchUserData(data.session.user.id);
    } else {
      setUser(null);
      setPermissions(defaultPermissions);
      setIsLoading(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    // Inicialização da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Ouvir alterações de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPermissions(defaultPermissions);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const hasAccess = useCallback(
    (area: AppArea, minLevel: 'consulta' | 'edicao' = 'consulta'): boolean => {
      if (!user || !user.is_active) return false;
      if (user.role === 'superadmin') return true;

      if (area === 'visao_geral') return true;

      const level = permissions[area] || 'sem_acesso';
      if (level === 'sem_acesso') return false;
      if (minLevel === 'consulta') return level === 'consulta' || level === 'edicao';
      if (minLevel === 'edicao') return level === 'edicao';
      return false;
    },
    [user, permissions]
  );

  const login = async (username: string, password: string) => {
    try {
      const cleanUsername = username.trim();
      if (!cleanUsername || !password) {
        return { success: false, error: 'Informe o nome de usuário e a senha.' };
      }

      let emailToAuth: string | null = null;

      // Se o usuário digitou um email diretamente
      if (cleanUsername.includes('@')) {
        emailToAuth = cleanUsername;
      } else {
        // 1. Resolver identificador seguro no backend pelo nome de usuário
        const { data: identifier, error: rpcError } = await supabase.rpc(
          'resolve_login_identifier',
          { p_username: cleanUsername }
        );

        if (rpcError) {
          console.error('Erro RPC resolve_login_identifier:', rpcError);
          const isNetworkError = rpcError.message?.toLowerCase().includes('fetch') || 
                                 rpcError.message?.toLowerCase().includes('network');
          if (isNetworkError) {
            return { success: false, error: 'Falha de conexão com o servidor. Verifique a internet e tente novamente.' };
          }
        }

        emailToAuth = identifier;
      }

      if (!emailToAuth) {
        return { success: false, error: 'Nome de usuário ou senha incorretos.' };
      }

      // 2. Autenticar com o Supabase Auth oficial
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password,
      });

      if (authError || !data.user) {
        console.error('Erro auth signInWithPassword:', authError);
        const errMsg = authError?.message || '';
        if (errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('fetch')) {
          return { success: false, error: 'Falha de conexão com o servidor. Tente novamente.' };
        }
        return { success: false, error: 'Nome de usuário ou senha incorretos.' };
      }

      // 3. Carregar dados do perfil e verificar se a conta está ativa
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr) {
        console.error('Erro ao verificar perfil:', profileErr);
      }

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Esta conta está desativada. Entre em contato com o administrador.',
        };
      }

      await fetchUserData(data.user.id);
      return { success: true };
    } catch (err: unknown) {
      console.error('Erro inesperado no login:', err);
      const isFetchErr = err instanceof Error && err.message?.toLowerCase().includes('fetch');
      return { 
        success: false, 
        error: isFetchErr 
          ? 'Não foi possível conectar ao servidor. Verifique se o endereço do Supabase está correto.' 
          : 'Erro ao processar login. Tente novamente.' 
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPermissions(defaultPermissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        hasAccess,
        login,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
