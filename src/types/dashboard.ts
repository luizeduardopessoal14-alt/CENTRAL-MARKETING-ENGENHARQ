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

export interface FinancialAnalyticsData {
  totalPaid: number;
  totalCommitted: number;
  totalNoForecast: number;
  totalRecordsCount: number;
  paidRecordsCount: number;
  prevTotalPaid: number;
  paidDiffPercent: number | null;
  
  monthlyTrend: Array<{
    monthKey: string; // '2026-04'
    monthLabel: string; // 'Abr/26'
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

export interface FunnelStageItem {
  stageKey: string;
  stageName: string;
  count: number;
  percentageFromTop: number;
  color: string;
}

export interface AgencyPerformanceRow {
  agencyId: string;
  agencyName: string;
  leadsCount: number;
  reservasCount: number;
  vendasCount: number;
  conversionRate: number; // %
  shareOfLeads: number; // %
}

export interface LeadsAnalyticsData {
  totalLeads: number;
  prevTotalLeads: number;
  leadsDiffPercent: number | null;
  totalSimulacoes: number;
  totalReservas: number;
  totalVendas: number;
  conversionRate: number;
  prevConversionRate: number | null;
  qualificationRate: number; // leads que avançaram além do contato inicial

  funnelStages: FunnelStageItem[];
  agencyRankings: AgencyPerformanceRow[];
}

export interface MediaCrossAnalyticsData {
  totalSpend: number;
  totalLeads: number;
  cplReal: number | null;
  costPerReservation: number | null;
  costPerSale: number | null;
  prevSpend: number;
  prevCplReal: number | null;
  spendDiffPercent: number | null;
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
  financial: FinancialAnalyticsData;
  leads: LeadsAnalyticsData;
  media: MediaCrossAnalyticsData;
  operational: OperationalQuickData;
  updatedAt: string;
}
