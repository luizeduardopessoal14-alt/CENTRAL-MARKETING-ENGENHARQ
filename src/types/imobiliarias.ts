export type CVCRMStatus = 'desconectado' | 'conectado' | 'erro';

export interface CVCRMIntegrationConfig {
  id: string;
  base_url: string;
  email: string | null;
  token: string | null;
  status: CVCRMStatus;
  last_sync_at: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RealEstateAgency {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  cvcrm_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AgencyMetricsMonthly {
  id: string;
  agency_id: string;
  period_month: string;
  leads_received: number;
  in_attendance: number;
  visits: number;
  proposals: number;
  sales: number;
  conversion_rate?: number;
  synced_at: string;
  created_at: string;
  updated_at: string;
  agency?: RealEstateAgency;
}

export interface CVCRMLeadItem {
  idlead: number;
  agency_id: string;
  agency_name: string;
  agency_cvcrm_id: string;
  data_cad: string;
  situacao_id: number | null;
  situacao_nome: string;
  origem: string | null;
  midia_principal: string | null;
  qtde_simulacoes: number;
  qtde_reservas: number;
}

export interface EsteiraMetric {
  nome: string;
  count: number;
  percentage: number;
  isWonStage: boolean; // ex: 'Com Reserva' / 'Venda'
  isLostStage: boolean; // ex: 'Congela' / 'Perdido'
}

export interface AgencyEsteiraRow {
  agency: RealEstateAgency;
  total_leads: number;
  esteiras: Record<string, number>;
  reservas_vendas: number;
  conversion_rate: number;
}

export type PeriodFilterMode =
  | 'este_mes'
  | 'mes_passado'
  | 'ultimos_30'
  | 'ultimos_90'
  | 'todo_periodo'
  | 'personalizado';
