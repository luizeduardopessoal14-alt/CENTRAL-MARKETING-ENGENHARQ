import { supabase } from '../lib/supabase';
import {
  MetaIntegrationConfig,
  MetaCampaignInsight,
  InstagramInsight,
  MetaPeriodFilter,
  CampaignObjectiveFilter,
  MetaOverviewTotals,
} from '../types/midia';

export const midiaService = {
  /**
   * Busca a configuração atual da integração da Meta
   */
  async getConfig(): Promise<{ data: MetaIntegrationConfig | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('meta_integration_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configuração da Meta:', error);
        return { data: null, error: error.message };
      }

      return { data: (data as MetaIntegrationConfig) || null, error: null };
    } catch {
      return { data: null, error: 'Falha ao consultar configuração da Meta.' };
    }
  },

  /**
   * Salva os IDs de conta (Ad Account e Instagram Business)
   */
  async updateConfig(payload: {
    ad_account_id?: string | null;
    instagram_business_id?: string | null;
    facebook_page_id?: string | null;
    updated_by: string;
  }): Promise<{ data: MetaIntegrationConfig | null; error: string | null }> {
    try {
      const { data: existing } = await supabase
        .from('meta_integration_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      let res;
      if (existing) {
        res = await supabase
          .from('meta_integration_config')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        res = await supabase
          .from('meta_integration_config')
          .insert({
            ...payload,
            status: 'desconectado',
          })
          .select()
          .single();
      }

      if (res.error) {
        return { data: null, error: res.error.message };
      }

      return { data: res.data as MetaIntegrationConfig, error: null };
    } catch {
      return { data: null, error: 'Erro ao atualizar dados de conexão da Meta.' };
    }
  },

  /**
   * Retorna as datas de início e fim no fuso local conforme o filtro selecionado
   */
  getPeriodDates(filter: MetaPeriodFilter): { start: string; end: string; prevStart: string; prevEnd: string } {
    const now = new Date();
    const todayYMD = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [currY, currM, currD] = todayYMD.split('-').map(Number);

    if (filter === 'este_mes') {
      const start = `${currY}-${String(currM).padStart(2, '0')}-01`;
      const end = todayYMD;

      // Mesmo intervalo do mês anterior (conforme item 164 das diretrizes: "Mês em curso versus mesmo intervalo do anterior")
      const prevM = currM === 1 ? 12 : currM - 1;
      const prevY = currM === 1 ? currY - 1 : currY;
      const maxDaysPrev = new Date(prevY, prevM, 0).getDate();
      const prevD = Math.min(currD, maxDaysPrev);

      const prevStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      const prevEnd = `${prevY}-${String(prevM).padStart(2, '0')}-${String(prevD).padStart(2, '0')}`;

      return { start, end, prevStart, prevEnd };
    }

    if (filter === 'mes_anterior') {
      const prevM = currM === 1 ? 12 : currM - 1;
      const prevY = currM === 1 ? currY - 1 : currY;
      const daysInPrev = new Date(prevY, prevM, 0).getDate();

      const start = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      const end = `${prevY}-${String(prevM).padStart(2, '0')}-${String(daysInPrev).padStart(2, '0')}`;

      // 2 meses atrás
      const prev2M = prevM === 1 ? 12 : prevM - 1;
      const prev2Y = prevM === 1 ? prevY - 1 : prevY;
      const daysInPrev2 = new Date(prev2Y, prev2M, 0).getDate();

      const prevStart = `${prev2Y}-${String(prev2M).padStart(2, '0')}-01`;
      const prevEnd = `${prev2Y}-${String(prev2M).padStart(2, '0')}-${String(daysInPrev2).padStart(2, '0')}`;

      return { start, end, prevStart, prevEnd };
    }

    // Últimos 30 dias
    const past30 = new Date(now);
    past30.setDate(now.getDate() - 30);
    const start30 = past30.toISOString().split('T')[0];

    const past60 = new Date(now);
    past60.setDate(now.getDate() - 60);
    const start60 = past60.toISOString().split('T')[0];

    return {
      start: start30,
      end: todayYMD,
      prevStart: start60,
      prevEnd: start30,
    };
  },

  /**
   * Busca métricas de campanhas
   */
  async getCampaignInsights(
    periodFilter: MetaPeriodFilter,
    objectiveFilter: CampaignObjectiveFilter
  ): Promise<{ data: MetaCampaignInsight[]; prevData: MetaCampaignInsight[]; error: string | null }> {
    try {
      const { start, end, prevStart, prevEnd } = this.getPeriodDates(periodFilter);

      let query = supabase
        .from('meta_campaign_insights')
        .select('*')
        .gte('period_start', start)
        .lte('period_end', end);

      if (objectiveFilter !== 'todos') {
        query = query.eq('objective', objectiveFilter);
      }

      let prevQuery = supabase
        .from('meta_campaign_insights')
        .select('*')
        .gte('period_start', prevStart)
        .lte('period_end', prevEnd);

      if (objectiveFilter !== 'todos') {
        prevQuery = prevQuery.eq('objective', objectiveFilter);
      }

      const [resCurrent, resPrev] = await Promise.all([query, prevQuery]);

      if (resCurrent.error) {
        return { data: [], prevData: [], error: resCurrent.error.message };
      }

      return {
        data: (resCurrent.data as MetaCampaignInsight[]) || [],
        prevData: (resPrev.data as MetaCampaignInsight[]) || [],
        error: null,
      };
    } catch {
      return { data: [], prevData: [], error: 'Falha ao consultar campanhas.' };
    }
  },

  /**
   * Busca métricas agregadas do Instagram
   */
  async getInstagramInsights(
    periodFilter: MetaPeriodFilter
  ): Promise<{ data: InstagramInsight[]; latest: InstagramInsight | null; error: string | null }> {
    try {
      const { start, end } = this.getPeriodDates(periodFilter);

      const { data, error } = await supabase
        .from('instagram_insights')
        .select('*')
        .gte('period_date', start)
        .lte('period_date', end)
        .order('period_date', { ascending: false });

      if (error) {
        return { data: [], latest: null, error: error.message };
      }

      const list = (data as InstagramInsight[]) || [];
      return { data: list, latest: list[0] || null, error: null };
    } catch {
      return { data: [], latest: null, error: 'Falha ao consultar métricas do Instagram.' };
    }
  },

  /**
   * Calcula totais e comparações
   */
  calculateTotals(
    currentCampaigns: MetaCampaignInsight[],
    prevCampaigns: MetaCampaignInsight[]
  ): MetaOverviewTotals {
    let totalSpend = 0;
    let totalLeads = 0;
    let totalReach = 0;
    let totalImpressions = 0;

    currentCampaigns.forEach((c) => {
      totalSpend += Number(c.spend) || 0;
      totalLeads += Number(c.leads) || 0;
      totalReach += Number(c.reach) || 0;
      totalImpressions += Number(c.impressions) || 0;
    });

    const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : null;
    const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null;

    let prevPeriodSpend = 0;
    let prevPeriodLeads = 0;

    prevCampaigns.forEach((c) => {
      prevPeriodSpend += Number(c.spend) || 0;
      prevPeriodLeads += Number(c.leads) || 0;
    });

    const prevPeriodCpl = prevPeriodLeads > 0 ? prevPeriodSpend / prevPeriodLeads : null;

    return {
      totalSpend,
      totalLeads,
      avgCostPerLead,
      totalReach,
      totalImpressions,
      avgCpm,
      prevPeriodSpend,
      prevPeriodLeads,
      prevPeriodCpl,
    };
  },
};

