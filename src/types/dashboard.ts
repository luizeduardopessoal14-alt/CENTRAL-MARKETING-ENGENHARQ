import { AppArea } from './auth';

export type DashboardPeriodMode =
  | 'este_mes'
  | 'mes_passado'
  | 'ultimos_30'
  | 'ultimos_90'
  | 'ano_atual'
  | 'todo_periodo'
  | 'personalizado';

export interface DashboardDateRange {
  startDate: string; // YYYY-MM-DD ou ''
  endDate: string;   // YYYY-MM-DD ou ''
  prevStartDate: string;
  prevEndDate: string;
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface KpiCardDetail {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  unit?: string;
  subtitle: string;
  deltaPercent: number | null;
  deltaType: 'positive' | 'negative' | 'neutral';
  sparkline: SparklinePoint[];
  targetValue?: number;
  targetDescription?: string;
  tooltip: string;
  accentColor: string;
}

export interface HeroPerformanceDataPoint {
  date: string;
  dateLabel: string;
  leads: number;
  qualificados: number;
  reservas: number;
  vendas: number;
}

export interface FunnelStageItem {
  stageKey: string;
  stageName: string;
  count: number;
  percentageFromTop: number;
  dropOffCount: number;
  dropOffPercent: number;
  isBottleneck: boolean;
  color: string;
}

export interface ChannelPerformanceItem {
  channel: string;
  label: string;
  count: number;
  sharePercent: number;
  qualifiedCount: number;
  qualificationRate: number;
  salesCount: number;
  conversionRate: number;
  color: string;
}

export interface AgencyPerformanceRow {
  agencyId: string;
  agencyName: string;
  leadsCount: number;
  inServiceCount: number;
  qualifiedCount: number;
  reservasCount: number;
  vendasCount: number;
  conversionRate: number; // %
  shareOfLeads: number; // %
  statusBadge: 'top' | 'regular' | 'atencao';
}

export interface FinancialAnalyticsData {
  totalPaid: number;
  totalCommitted: number;
  totalNoForecast: number;
  totalRecordsCount: number;
  paidRecordsCount: number;
  prevTotalPaid: number;
  paidDiffPercent: number | null;
  
  monthlyTrend: Array<{
    monthKey: string;
    monthLabel: string;
    pago: number;
    previsto: number;
    total: number;
  }>;

  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: number;
    count: number;
    color: string;
  }>;

  statusBreakdown: Array<{
    status: string;
    label: string;
    total: number;
    count: number;
    color: string;
  }>;

  topSuppliers: Array<{
    supplier: string;
    total: number;
    count: number;
    percentage: number;
  }>;
}

export interface ManagerialAlertItem {
  id: string;
  severity: 'critico' | 'atencao' | 'oportunidade' | 'info';
  category: 'financeiro' | 'crm' | 'imobiliaria' | 'meta' | 'conteudo';
  title: string;
  description: string;
  metricBadge?: string;
  targetTab?: AppArea;
  actionText?: string;
}

export interface OperationalQuickData {
  contentInProduction: number;
  contentInApproval: number;
  contentOverdue: number;
  meetingsThisWeek: number;
  eventsThisMonth: number;
  nextEventTitle: string | null;
  nextEventDate: string | null;
}

export interface DashboardFullData {
  periodMode: DashboardPeriodMode;
  dateRange: DashboardDateRange;
  kpis: {
    investedTotal: KpiCardDetail;
    leadsReceived: KpiCardDetail;
    cplReal: KpiCardDetail;
    leadsQualified: KpiCardDetail;
    reservas: KpiCardDetail;
    vendas: KpiCardDetail;
    conversionRate: KpiCardDetail;
    cacReal: KpiCardDetail;
  };
  heroPerformance: HeroPerformanceDataPoint[];
  funnelStages: FunnelStageItem[];
  channels: ChannelPerformanceItem[];
  agencies: AgencyPerformanceRow[];
  financial: FinancialAnalyticsData;
  alerts: ManagerialAlertItem[];
  operational: OperationalQuickData;
  updatedAt: string;
}
