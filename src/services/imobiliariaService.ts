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

  // 2. Imobiliárias Parceiras (Somente as da fila TOP 5)
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

  // 4. Sincronização Estrita da Fila de Distribuição: "DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB"
  async syncCVCRMData(): Promise<{
    success: boolean;
    message: string;
    agenciesCount?: number;
    leadsCount?: number;
  }> {
    const config = await this.getConfig();
    if (!config || !config.token || !config.base_url) {
      return { success: false, message: 'Configuração do CVCRM incompleta. Token ou URL ausentes.' };
    }

    try {
      const headers = {
        email: config.email || '',
        token: config.token,
        Accept: 'application/json',
      };

      // 1. Consultar a Fila de Distribuição exata
      const filaUrl = `${config.base_url.replace(/\/$/, '')}/api/v1/comercial/filas-distribuicao-leads`;
      const filaRes = await fetch(filaUrl, { headers });
      if (!filaRes.ok) {
        throw new Error(`Falha ao obter filas do CVCRM (${filaRes.status})`);
      }

      const filaJson = await filaRes.json();
      const targetQueue = (filaJson.filas || []).find((f: { nome?: string }) =>
        f.nome && f.nome.toUpperCase().includes('TOP 5')
      );

      if (!targetQueue) {
        throw new Error('Fila "DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB" não encontrada no CVCRM.');
      }

      // Imobiliárias permitidas pertencentes exclusivamente à fila
      const allowedAgencies: Array<{ id: string; name: string; posicao?: string }> = (
        targetQueue.corretores_e_imobiliarias || []
      ).map((item: { idimobiliaria: number; nome_imobiliaria: string; posicao?: string }) => ({
        id: String(item.idimobiliaria),
        name: item.nome_imobiliaria.trim(),
        posicao: item.posicao,
      }));

      const allowedCvIds = allowedAgencies.map((a) => a.id);

      // Limpar imobiliárias fora da fila
      await supabase
        .from('real_estate_agencies')
        .delete()
        .not('cvcrm_id', 'in', `(${allowedCvIds.join(',')})`);

      // Upsert das imobiliárias da fila
      for (const ag of allowedAgencies) {
        const { data: exist } = await supabase
          .from('real_estate_agencies')
          .select('id')
          .eq('cvcrm_id', ag.id)
          .maybeSingle();

        if (!exist) {
          await supabase.from('real_estate_agencies').insert({
            name: ag.name,
            cvcrm_id: ag.id,
            notes: ag.posicao ? `Posição na fila: ${ag.posicao}` : null,
            is_active: true,
          });
        } else if (ag.posicao) {
          await supabase
            .from('real_estate_agencies')
            .update({ notes: `Posição na fila: ${ag.posicao}` })
            .eq('id', exist.id);
        }
      }

      const { data: dbAgencies } = await supabase.from('real_estate_agencies').select('id, cvcrm_id');
      const agencyDbMap = new Map((dbAgencies || []).map((a) => [a.cvcrm_id, a.id]));

      // 2. Buscar leads e filtrar estritamente Facebook / Instagram da Fila
      const leadsUrl = `${config.base_url.replace(/\/$/, '')}/api/v1/comercial/leads?limit=500`;
      const leadsRes = await fetch(leadsUrl, { headers });
      if (!leadsRes.ok) {
        throw new Error(`Falha ao obter leads (${leadsRes.status})`);
      }

      const leadsJson = await leadsRes.json();
      const leads: Array<{
        imobiliaria?: { id: number; nome: string };
        data_cad?: string;
        origem?: string;
        midia_principal?: string;
        midias?: string[];
        situacao?: { nome: string };
        qtde_simulacoes_associadas?: number;
        qtde_reservas_associadas?: number;
      }> = leadsJson.leads || [];

      interface MetricAggregate {
        agency_id: string;
        period_month: string;
        leads_received: number;
        in_attendance: number;
        visits: number;
        proposals: number;
        sales: number;
      }
      const metricsAgg: Record<string, MetricAggregate> = {};
      let totalFilteredLeads = 0;

      for (const l of leads) {
        if (!l.imobiliaria?.id || !l.data_cad) continue;
        const cvId = String(l.imobiliaria.id);
        if (!allowedCvIds.includes(cvId)) continue; // Ignora imobiliárias fora da fila

        const orig = (l.origem || '').toLowerCase();
        const mid = (l.midia_principal || '').toLowerCase();
        const mids = (l.midias || []).join(' ').toLowerCase();

        // Filtra estritamente Facebook e Instagram
        const isMeta =
          orig.includes('facebook') ||
          orig.includes('instagram') ||
          orig.includes('meta') ||
          mid.includes('facebook') ||
          mid.includes('instagram') ||
          mid.includes('meta') ||
          mids.includes('facebook') ||
          mids.includes('instagram');

        if (!isMeta) continue; // Ignora leads que não sejam Facebook / Instagram

        totalFilteredLeads++;
        const agencyId = agencyDbMap.get(cvId);
        if (!agencyId) continue;

        const month = `${l.data_cad.substring(0, 7)}-01`;
        const key = `${agencyId}_${month}`;

        if (!metricsAgg[key]) {
          metricsAgg[key] = {
            agency_id: agencyId,
            period_month: month,
            leads_received: 0,
            in_attendance: 0,
            visits: 0,
            proposals: 0,
            sales: 0,
          };
        }

        const m = metricsAgg[key];
        m.leads_received++;

        const sit = (l.situacao?.nome || '').toLowerCase();
        if (sit.includes('atendimento') || sit.includes('contato')) {
          m.in_attendance++;
        }
        if (sit.includes('visita')) {
          m.visits++;
        }
        if ((l.qtde_simulacoes_associadas || 0) > 0 || sit.includes('simulação') || sit.includes('proposta')) {
          m.proposals++;
        }
        if (sit.includes('reserva') || sit.includes('venda') || sit.includes('ganho') || (l.qtde_reservas_associadas || 0) > 0) {
          m.sales++;
        }
      }

      // Limpar métricas de imobiliárias antigas/fora da fila
      const dbIds = (dbAgencies || []).map((a) => a.id);
      if (dbIds.length > 0) {
        await supabase
          .from('agency_metrics_monthly')
          .delete()
          .not('agency_id', 'in', `(${dbIds.join(',')})`);
      }

      // Upsert das métricas consolidadas da fila
      for (const item of Object.values(metricsAgg)) {
        await supabase
          .from('agency_metrics_monthly')
          .upsert(item, { onConflict: 'agency_id,period_month' });
      }

      await supabase
        .from('cvcrm_integration_config')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'conectado',
          last_error_message: null,
        })
        .eq('id', config.id);

      return {
        success: true,
        message: 'Fila "DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB" sincronizada com sucesso!',
        agenciesCount: allowedAgencies.length,
        leadsCount: totalFilteredLeads,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await supabase
        .from('cvcrm_integration_config')
        .update({
          last_error_message: errorMsg,
        })
        .eq('id', config.id);

      return { success: false, message: `Falha na sincronização: ${errorMsg}` };
    }
  },
};
