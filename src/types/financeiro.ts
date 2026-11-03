export type FinancialStatus =
  | 'a_encaminhar'
  | 'aguardando_previsao'
  | 'pagamento_previsto'
  | 'pago';

export const FINANCIAL_CATEGORIES = [
  'Mídia Paga & Anúncios',
  'Gráfica & Comunicação Visual',
  'Eventos & Feirões',
  'Brindes, Camisas & Uniformes',
  'Produção Audiovisual & 3D',
  'Taxas & Serviços Técnicos',
  'Outros',
] as const;

export type FinancialCategory = (typeof FINANCIAL_CATEGORIES)[number];

export interface FinancialRecord {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  category: string;
  receipt_date: string; // YYYY-MM-DD
  authorized_by?: string | null;
  invoice_number?: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
  forwarded_to_finance_date?: string | null;
  payment_forecast_date?: string | null;
  payment_actual_date?: string | null;
  notes?: string | null;
  status: FinancialStatus;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialForecastHistory {
  id: string;
  record_id: string;
  old_forecast_date: string | null;
  new_forecast_date: string;
  reason?: string | null;
  changed_by?: string | null;
  changed_by_name: string;
  changed_at: string;
}

export interface FinancialTotals {
  totalOpen: number; // Em aberto geral (não pago e não excluído)
  totalNoForecast: number; // Sem previsão (subconjunto de aberto)
  totalWeekForecast: number; // Previstos para a semana
  totalPaidMonth: number; // Pagos no mês corrente
  countConsultFinance: number; // Contagem de itens para consultar com financeiro
}

// Retorna a data atual no fuso de São Paulo em formato YYYY-MM-DD
export function getTodaySaoPaulo(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Ex: '2026-11-02'
}

// Verifica se a previsão foi ultrapassada
export function isForecastOverdue(record: FinancialRecord): boolean {
  if (record.status !== 'pagamento_previsto' || !record.payment_forecast_date) {
    return false;
  }
  const today = getTodaySaoPaulo();
  return record.payment_forecast_date < today;
}

// Calcula dias corridos de previsão ultrapassada
export function getOverdueDays(record: FinancialRecord): number {
  if (!isForecastOverdue(record) || !record.payment_forecast_date) return 0;
  const today = new Date(getTodaySaoPaulo() + 'T00:00:00');
  const forecast = new Date(record.payment_forecast_date + 'T00:00:00');
  const diffTime = today.getTime() - forecast.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

