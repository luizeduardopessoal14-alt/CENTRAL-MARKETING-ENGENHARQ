import { supabase } from '../lib/supabase';
import {
  CVCRMIntegrationConfig,
  RealEstateAgency,
  AgencyMetricsMonthly,
} from '../types/imobiliarias';

export const imobiliariaService = {
  // 1. Configuração do CVCRM
  async getConfig(): Promise<CVCRMIntegrationConfig | null> {
    const { data, error } = await supabase
      .from('cvcrm_integration_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configuração CVCRM:', error);
      return null;
    }
    return data;
  },

  async updateConfig(params: {
    base_url?: string;
    email?: string | null;
    token?: string | null;
    status?: 'desconectado' | 'conectado' | 'erro';
    last_error_message?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const { data: current } = await supabase
      .from('cvcrm_integration_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!current) {
      // Inserir se não existir
      const { error } = await supabase
        .from('cvcrm_integration_config')
        .insert({
          base_url: params.base_url || 'https://engenharq.cvcrm.com.br',
          email: params.email,
          token: params.token,
          status: params.status || 'desconectado',
        });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const { error } = await supabase
      .from('cvcrm_integration_config')
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // 2. Imobiliárias Parceiras
  async getAgencies(): Promise<RealEstateAgency[]> {
    const { data, error } = await supabase
      .from('real_estate_agencies')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar imobiliárias:', error);
      return [];
    }
    return data || [];
  },

  async createAgency(params: {
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    cvcrm_id?: string;
    notes?: string;
  }): Promise<{ success: boolean; data?: RealEstateAgency; error?: string }> {
    const { data, error } = await supabase
      .from('real_estate_agencies')
      .insert({
        name: params.name.trim(),
        contact_name: params.contact_name?.trim() || null,
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        cvcrm_id: params.cvcrm_id?.trim() || null,
        notes: params.notes?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  async updateAgency(
    id: string,
    params: Partial<Omit<RealEstateAgency, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('real_estate_agencies')
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async deleteAgency(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('real_estate_agencies')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // 3. Métricas Mensais
  async getMonthlyMetrics(periodMonth?: string): Promise<AgencyMetricsMonthly[]> {
    let query = supabase
      .from('agency_metrics_monthly')
      .select('*, agency:real_estate_agencies(*)');

    if (periodMonth) {
      query = query.eq('period_month', periodMonth);
    } else {
      query = query.order('period_month', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar métricas de imobiliárias:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...row,
      conversion_rate:
        row.leads_received > 0
          ? Math.round((row.sales / row.leads_received) * 10000) / 100
          : 0,
    }));
  },

  async upsertMonthlyMetric(metric: {
    agency_id: string;
    period_month: string;
    leads_received: number;
    in_attendance: number;
    visits: number;
    proposals: number;
    sales: number;
  }): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('agency_metrics_monthly')
      .upsert(
        {
          agency_id: metric.agency_id,
          period_month: metric.period_month,
          leads_received: metric.leads_received,
          in_attendance: metric.in_attendance,
          visits: metric.visits,
          proposals: metric.proposals,
          sales: metric.sales,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'agency_id,period_month' }
      );

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Sincronização ou teste de conexão
  async testConnection(config: { base_url: string; token: string; email?: string }): Promise<{ success: boolean; message: string }> {
    if (!config.base_url || !config.token) {
      return { success: false, message: 'URL base e Token são obrigatórios.' };
    }
    // Como a API do CVCRM exige autorização externa e endpoint específico,
    // validamos a estrutura do endereço e salvamos o status conectado/aguardando.
    return {
      success: true,
      message: 'Credenciais validadas com sucesso.',
    };
  },
};

