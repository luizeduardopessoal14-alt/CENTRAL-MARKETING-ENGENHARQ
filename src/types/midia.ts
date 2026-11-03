export type MetaIntegrationStatus = 'desconectado' | 'conectado' | 'erro';

export interface MetaIntegrationConfig {
  id: string;
  ad_account_id: string | null;
  instagram_business_id: string | null;
  facebook_page_id: string | null;
  status: MetaIntegrationStatus;
  last_sync_at: string | null;
  last_error_message: string | null;
  updated_at: string;
}

export type CampaignObjective = 'cadastros' | 'reconhecimento' | 'visitas_perfil' | 'outro';

export interface MetaCampaignInsight {
  id: string;
  campaign_id: string;
  campaign_name: string;
  objective: CampaignObjective;
  status: string;
  period_start: string;
  period_end: string;
  spend: number;
  leads: number;
  cost_per_lead: number | null;
  reach: number;
  impressions: number;
  clicks: number;
  cpm: number | null;
  frequency: number;
  synced_at: string;
}

export interface InstagramInsight {
  id: string;
  period_date: string;
  followers_count: number;
  reach: number;
  impressions: number;
  profile_views: number;
  interactions: number;
  synced_at: string;
}

export type MetaPeriodFilter = 'este_mes' | 'mes_anterior' | 'ultimos_30_dias' | 'ultimos_90_dias';
export type CampaignObjectiveFilter = 'todos' | 'cadastros' | 'reconhecimento' | 'visitas_perfil';

export interface MetaOverviewTotals {
  totalSpend: number;
  totalLeads: number;
  avgCostPerLead: number | null;
  totalReach: number;
  totalImpressions: number;
  avgCpm: number | null;
  prevPeriodSpend: number;
  prevPeriodLeads: number;
  prevPeriodCpl: number | null;
}

export const CAMPAIGN_OBJECTIVES: { id: CampaignObjectiveFilter; label: string; description: string }[] = [
  { id: 'todos', label: 'Todos os Objetivos', description: 'Visão agregada de todas as campanhas' },
  { id: 'cadastros', label: 'Geração de Cadastros (Leads)', description: 'Formulários nativos Meta para captação de clientes' },
  { id: 'reconhecimento', label: 'Reconhecimento de Marca', description: 'Alcance, frequência e impressões institucionais' },
  { id: 'visitas_perfil', label: 'Visitas ao Perfil', description: 'Tráfego direcionado para o Instagram oficial' },
];

