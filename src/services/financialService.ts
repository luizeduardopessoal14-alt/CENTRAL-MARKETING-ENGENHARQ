import { supabase } from '../lib/supabase';
import {
  FinancialRecord,
  FinancialForecastHistory,
  FinancialTotals,
  getTodaySaoPaulo,
  isForecastOverdue,
} from '../types/financeiro';

export interface FilterOptions {
  search?: string;
  category?: string;
  statusFilter?: string; // 'all' | 'a_encaminhar' | 'aguardando_previsao' | 'pagamento_previsto' | 'ultrapassado' | 'pago'
  consultFinanceOnly?: boolean;
  selectedMonth?: string; // 'YYYY-MM'
  showTrash?: boolean;
}

export const financialService = {
  // Carrega listagem com filtros aplicados
  async getRecords(filters: FilterOptions = {}): Promise<FinancialRecord[]> {
    let query = supabase
      .from('financial_records')
      .select('*')
      .order('receipt_date', { ascending: false });

    if (filters.showTrash) {
      query = query.eq('is_deleted', true);
    } else {
      query = query.eq('is_deleted', false);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.selectedMonth) {
      const startOfMonth = `${filters.selectedMonth}-01`;
      const [year, month] = filters.selectedMonth.split('-').map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const endOfMonth = nextMonthDate.toISOString().slice(0, 10);
      query = query.gte('receipt_date', startOfMonth).lt('receipt_date', endOfMonth);
    }

    const { data, error } = await query;
    if (error) throw error;

    let records = (data || []) as FinancialRecord[];

    // Filtros em memória (Busca textual, Status avançado e "Consultar com o Financeiro")
    if (filters.search?.trim()) {
      const term = filters.search.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.supplier.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          (r.invoice_number && r.invoice_number.toLowerCase().includes(term)) ||
          (r.authorized_by && r.authorized_by.toLowerCase().includes(term))
      );
    }

    if (filters.consultFinanceOnly) {
      records = records.filter(
        (r) => r.status === 'aguardando_previsao' || isForecastOverdue(r)
      );
    } else if (filters.statusFilter && filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'ultrapassado') {
        records = records.filter((r) => isForecastOverdue(r));
      } else {
        records = records.filter((r) => r.status === filters.statusFilter);
      }
    }

    return records;
  },

  // Calcula totais oficiais e consistentes
  async getTotals(): Promise<FinancialTotals> {
    const { data, error } = await supabase
      .from('financial_records')
      .select('amount, status, payment_forecast_date, payment_actual_date')
      .eq('is_deleted', false);

    if (error) throw error;

    const records = (data || []) as FinancialRecord[];
    const today = getTodaySaoPaulo();

    // Determinar início e fim da semana corrente (Segunda a Domingo)
    const todayDate = new Date(today + 'T00:00:00');
    const dayOfWeek = todayDate.getDay(); // 0 = Domingo, 1 = Segunda
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    const currentMonthPrefix = today.slice(0, 7); // 'YYYY-MM'

    let totalOpen = 0;
    let totalNoForecast = 0;
    let totalWeekForecast = 0;
    let totalPaidMonth = 0;
    let countConsultFinance = 0;

    for (const r of records) {
      const amount = Number(r.amount) || 0;

      // 1. Em aberto: registros não pagos
      if (r.status !== 'pago') {
        totalOpen += amount;

        // Subconjunto sem previsão
        if (r.status === 'a_encaminhar' || r.status === 'aguardando_previsao') {
          totalNoForecast += amount;
        }

        // Previstos para a semana
        if (
          r.status === 'pagamento_previsto' &&
          r.payment_forecast_date &&
          r.payment_forecast_date >= mondayStr &&
          r.payment_forecast_date <= sundayStr
        ) {
          totalWeekForecast += amount;
        }

        // Consultar com o financeiro: sem previsão ou com previsão vencida
        if (r.status === 'aguardando_previsao' || isForecastOverdue(r)) {
          countConsultFinance++;
        }
      }

      // 2. Pago no mês corrente (usa a data efetiva de pagamento)
      if (
        r.status === 'pago' &&
        r.payment_actual_date &&
        r.payment_actual_date.startsWith(currentMonthPrefix)
      ) {
        totalPaidMonth += amount;
      }
    }

    return {
      totalOpen,
      totalNoForecast,
      totalWeekForecast,
      totalPaidMonth,
      countConsultFinance,
    };
  },

  // Criação de Cobrança
  async createRecord(
    payload: Omit<FinancialRecord, 'id' | 'status' | 'is_deleted' | 'created_at' | 'updated_at'>,
    userId?: string
  ): Promise<FinancialRecord> {
    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        ...payload,
        created_by: userId || null,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FinancialRecord;
  },

  // Edição Geral
  async updateRecord(id: string, payload: Partial<FinancialRecord>): Promise<FinancialRecord> {
    const { data, error } = await supabase
      .from('financial_records')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialRecord;
  },

  // Enviar para Lixeira (Exclusão Lógica)
  async softDeleteRecord(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('financial_records')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Restaurar da Lixeira (Superadmin)
  async restoreRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_records')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Excluir Definitivamente (Superadmin)
  async permanentDeleteRecord(id: string): Promise<void> {
    const { error } = await supabase.from('financial_records').delete().eq('id', id);
    if (error) throw error;
  },

  // Upload de Anexo para o Storage privado
  async uploadAttachment(file: File): Promise<{ path: string; name: string }> {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}_${cleanFileName}`;

    const { error } = await supabase.storage
      .from('financial-attachments')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return { path, name: file.name };
  },

  // Obter URL assinada temporária para visualização do anexo
  async getAttachmentUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('financial-attachments')
      .createSignedUrl(path, 300); // 5 minutos de validade

    if (error || !data) throw error || new Error('Não foi possível gerar link do anexo.');
    return data.signedUrl;
  },

  // Histórico de Mudanças de Previsão
  async getForecastHistory(recordId: string): Promise<FinancialForecastHistory[]> {
    const { data, error } = await supabase
      .from('financial_forecast_history')
      .select('*')
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FinancialForecastHistory[];
  },
};

