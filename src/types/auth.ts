export type UserRole = 'superadmin' | 'user';

export type AccessLevel = 'sem_acesso' | 'consulta' | 'edicao';

export type AppArea =
  | 'visao_geral'
  | 'financeiro'
  | 'conteudos'
  | 'calendario'
  | 'midia'
  | 'imobiliarias'
  | 'relatorios';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  area: AppArea;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
