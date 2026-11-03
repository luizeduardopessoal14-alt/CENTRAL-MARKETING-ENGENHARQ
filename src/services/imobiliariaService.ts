import { supabase } from '../lib/supabase';
import {
  CVCRMIntegrationConfig,
  RealEstateAgency,
  CVCRMLeadItem,
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

  // 2. Imobiliárias Parceiras da Fila TOP 5
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

  // 4. Buscar Leads com Filtro de Data Flexível (Data A até Data B ou Todo o Período)
  async getFilteredLeads(filters: {
    startDate?: string; // 'YYYY-MM-DD'
    endDate?: string;   // 'YYYY-MM-DD'
    agencyId?: string;
  }): Promise<CVCRMLeadItem[]> {
    let query = supabase.from('cvcrm_leads_cache').select('*');

    if (filters.startDate) {
      query = query.gte('data_cad', `${filters.startDate}T00:00:00-03:00`);
    }
    if (filters.endDate) {
      query = query.lte('data_cad', `${filters.endDate}T23:59:59-03:00`);
    }
    if (filters.agencyId && filters.agencyId !== 'all') {
      query = query.eq('agency_id', filters.agencyId);
    }

    query = query.order('data_cad', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('Tabela cvcrm_leads_cache não encontrada ou vazia:', error.message);
      return [];
    }
    return data || [];
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

      // 2. Buscar páginas de leads da API do CVCRM para capturar todo o histórico da fila (1.805+ leads)
      const leadsToCache: CVCRMLeadItem[] = [];
      let offset = 0;
      const limit = 500;

      while (offset < 2500) {
        const leadsUrl = `${config.base_url.replace(/\/$/, '')}/api/v1/comercial/leads?limit=${limit}&offset=${offset}`;
        const leadsRes = await fetch(leadsUrl, { headers });
        if (!leadsRes.ok) break;

        const leadsJson = await leadsRes.json();
        const rawLeads: Array<{
          idlead: number;
          imobiliaria?: { id: number; nome: string };
          data_cad?: string;
          origem?: string;
          midia_principal?: string;
          situacao?: { id?: number; nome?: string };
          qtde_simulacoes_associadas?: number;
          qtde_reservas_associadas?: number;
        }> = leadsJson.leads || [];

        if (rawLeads.length === 0) break;

        for (const l of rawLeads) {
          if (!l.idlead || !l.imobiliaria?.id || !l.data_cad) continue;
          const cvId = String(l.imobiliaria.id);
          if (!allowedCvIds.includes(cvId)) continue; // Apenas imobiliárias da fila oficial

          const agencyId = agencyDbMap.get(cvId);
          if (!agencyId) continue;

          leadsToCache.push({
            idlead: l.idlead,
            agency_id: agencyId,
            agency_name: l.imobiliaria.nome,
            agency_cvcrm_id: cvId,
            data_cad: l.data_cad.replace(' ', 'T') + '-03:00',
            situacao_id: l.situacao?.id || null,
            situacao_nome: l.situacao?.nome?.trim() || 'Aguardando Atendimento',
            origem: l.origem || 'Facebook',
            midia_principal: l.midia_principal || 'Facebook',
            qtde_simulacoes: l.qtde_simulacoes_associadas || 0,
            qtde_reservas: l.qtde_reservas_associadas || 0,
          });
        }

        if (rawLeads.length < limit || leadsToCache.length >= 1805) {
          break;
        }
        offset += limit;
      }

      // Salvar em lotes de 200 no cache do banco para consultas ultra-rápidas
      for (let i = 0; i < leadsToCache.length; i += 200) {
        const batch = leadsToCache.slice(i, i + 200);
        await supabase
          .from('cvcrm_leads_cache')
          .upsert(batch, { onConflict: 'idlead' });
      }

      // Atualizar status e última sincronização
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
        leadsCount: leadsToCache.length,
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
