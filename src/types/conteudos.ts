export type ContentColumnStatus =
  | 'ideias'
  | 'a_produzir'
  | 'em_producao'
  | 'em_aprovacao'
  | 'pronto_publicar'
  | 'publicado';

export interface ColumnDefinition {
  id: ContentColumnStatus;
  title: string;
  description: string;
  color: string;
}

export const KANBAN_COLUMNS: ColumnDefinition[] = [
  {
    id: 'ideias',
    title: 'Ideias',
    description: 'Sugestões livres sem exigência inicial de título ou prazo',
    color: '#64748B',
  },
  {
    id: 'a_produzir',
    title: 'A produzir',
    description: 'Demandas aprovadas com título, responsável e data de entrega',
    color: '#3B82F6',
  },
  {
    id: 'em_producao',
    title: 'Em produção',
    description: 'Conteúdos em criação de arte, cópia ou gravação',
    color: '#EAB308',
  },
  {
    id: 'em_aprovacao',
    title: 'Em aprovação',
    description: 'Aguardando validação final de Marketing (Flávia)',
    color: '#A855F7',
  },
  {
    id: 'pronto_publicar',
    title: 'Pronto para publicar',
    description: 'Aprovados e finalizados, aguardando momento de postagem',
    color: '#06B6D4',
  },
  {
    id: 'publicado',
    title: 'Publicado',
    description: 'Conteúdos já postados nas redes sociais oficiais',
    color: '#10B981',
  },
];

export interface ContentCard {
  id: string;
  title: string | null;
  description: string;
  column_status: ContentColumnStatus;
  order_index: number;
  assigned_to: string | null;
  assigned_name: string | null;
  due_date: string | null;
  published_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentCardHistoryItem {
  id: string;
  card_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  old_due_date: string | null;
  new_due_date: string | null;
  details: Record<string, unknown>;
  changed_by: string | null;
  changed_by_name: string;
  created_at: string;
}

export type DueDateAlertType = 'nenhum' | 'amanha' | 'hoje' | 'atrasado';

export interface DueDateAlertInfo {
  type: DueDateAlertType;
  label: string;
  badgeClass: string;
  daysOverdue?: number;
}

/**
 * Calcula o alerta de prazo conforme regra da Central de Marketing EngenhArq:
 * - Em 'pronto_publicar' ou 'publicado', os alertas param (não geram atraso).
 * - Sem data de entrega, não gera alerta.
 * - Fuso America/Sao_Paulo (datas no formato YYYY-MM-DD).
 */
export function calculateDueDateAlert(
  dueDateStr: string | null,
  columnStatus: ContentColumnStatus
): DueDateAlertInfo {
  if (
    !dueDateStr ||
    columnStatus === 'ideias' ||
    columnStatus === 'pronto_publicar' ||
    columnStatus === 'publicado'
  ) {
    return {
      type: 'nenhum',
      label: '',
      badgeClass: '',
    };
  }

  // Pega data de hoje no fuso local em YYYY-MM-DD
  const now = new Date();
  const todayYMD = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const [tY, tM, tD] = todayYMD.split('-').map(Number);
  const [dY, dM, dD] = dueDateStr.split('-').map(Number);

  // Normalizar para meia-noite UTC para calcular diferença em dias
  const todayDate = Date.UTC(tY, tM - 1, tD);
  const targetDate = Date.UTC(dY, dM - 1, dD);

  const diffDays = Math.round((targetDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      type: 'hoje',
      label: 'Entrega hoje',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    };
  } else if (diffDays === 1) {
    return {
      type: 'amanha',
      label: 'Entrega amanhã',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  } else if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      type: 'atrasado',
      label: `Atrasado há ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}`,
      badgeClass: 'bg-red-100 text-red-700 border-red-200 font-semibold',
      daysOverdue,
    };
  }

  return {
    type: 'nenhum',
    label: '',
    badgeClass: '',
  };
}

