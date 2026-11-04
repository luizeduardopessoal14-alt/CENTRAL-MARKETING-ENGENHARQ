import { supabase } from '../lib/supabase';
import { contentService } from './contentService';
import { calendarService } from './calendarService';
import { calculateDueDateAlert } from '../types/conteudos';
import {
  DashboardPeriodMode,
  DashboardDateRange,
  DashboardFullData,
  FinancialAnalyticsData,
  HeroPerformanceDataPoint,
  FunnelStageItem,
  ChannelPerformanceItem,
  AgencyPerformanceRow,
  ManagerialAlertItem,
  OperationalQuickData,
  KpiCardDetail,
  SparklinePoint,
} from '../types/dashboard';

const CATEGORY_COLORS: Record<string, string> = {
  'Eventos & Feirões': '#B21010',
  'Mídia Paga & Anúncios': '#3B82F6',
  'Gráfica & Comunicação Visual': '#10B981',
  'Brindes, Camisas & Uniformes': '#F59E0B',
  'Produção Audiovisual & 3D': '#8B5CF6',
  'Taxas & Serviços Técnicos': '#6366F1',
  'Outros': '#64748B',
};

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

export interface ProcessedLeadsResult {
  totalLeads: number;
  prevLeadsCount: number;
  totalReservas: number;
  totalVendas: number;
  qualifiedCount: number;
  conversionRate: number;
  qualificationRate: number;
  funnelStages: FunnelStageItem[];
  agencies: AgencyPerformanceRow[];
  channels: ChannelPerformanceItem[];
}

export const dashboardAnalyticsService = {
  /**
   * Calcula os limites de datas para o período atual e o período anterior equivalente
   */
  calculateDateRange(
    mode: DashboardPeriodMode,
    customStart?: string,
    customEnd?: string
  ): DashboardDateRange {
    const now = new Date();
    const formatIso = (d: Date) => d.toISOString().split('T')[0];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (mode === 'este_mes') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = now;
      const prevStart = new Date(currentYear, currentMonth - 1, 1);
      const prevEnd = new Date(currentYear, currentMonth, 0);
      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    if (mode === 'mes_passado') {
      const start = new Date(currentYear, currentMonth - 1, 1);
      const end = new Date(currentYear, currentMonth, 0);
      const prevStart = new Date(currentYear, currentMonth - 2, 1);
      const prevEnd = new Date(currentYear, currentMonth - 1, 0);
      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    if (mode === 'ultimos_30') {
      const end = now;
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 30);
      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    if (mode === 'ultimos_90') {
      const end = now;
      const start = new Date(now);
      start.setDate(now.getDate() - 90);
      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 90);
      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    if (mode === 'ano_atual') {
      const start = new Date(currentYear, 0, 1);
      const end = now;
      const prevStart = new Date(currentYear - 1, 0, 1);
      const prevEnd = new Date(currentYear - 1, 11, 31);
      return {
        startDate: formatIso(start),
        endDate: formatIso(end),
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    if (mode === 'personalizado' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - diffDays);

      return {
        startDate: customStart,
        endDate: customEnd,
        prevStartDate: formatIso(prevStart),
        prevEndDate: formatIso(prevEnd),
      };
    }

    // 'todo_periodo'
    return {
      startDate: '',
      endDate: '',
      prevStartDate: '',
      prevEndDate: '',
    };
  },

  /**
   * Carrega e processa todos os dados analíticos de forma consolidada para as 7 seções
   */
  async getFullDashboardData(
    mode: DashboardPeriodMode = 'este_mes',
    customStart?: string,
    customEnd?: string
  ): Promise<DashboardFullData> {
    const range = this.calculateDateRange(mode, customStart, customEnd);

    // Disparar buscas em paralelo
    const [financialResult, rawLeadsResult, contentResult, calendarResult] =
      await Promise.all([
        this.fetchFinancialData(range),
        this.fetchRawLeadsData(range),
        contentService.fetchCards().catch(() => ({ data: [] })),
        calendarService.getOverviewMetrics().catch(() => ({
          nextEvents: [],
          meetingsThisWeekCount: 0,
          eventsThisMonthCount: 0,
        })),
      ]);

    // Métricas operacionais
    let contentInProduction = 0;
    let contentInApproval = 0;
    let contentOverdue = 0;

    (contentResult.data || []).forEach((c) => {
      if (c.column_status === 'em_producao') contentInProduction++;
      if (c.column_status === 'em_aprovacao') contentInApproval++;
      const alert = calculateDueDateAlert(c.due_date, c.column_status);
      if (alert.type === 'atrasado') contentOverdue++;
    });

    const operational: OperationalQuickData = {
      contentInProduction,
      contentInApproval,
      contentOverdue,
      meetingsThisWeek: calendarResult.meetingsThisWeekCount,
      eventsThisMonth: calendarResult.eventsThisMonthCount,
      nextEventTitle: calendarResult.nextEvents[0]?.title || null,
      nextEventDate: calendarResult.nextEvents[0]?.event_date || null,
    };

    // Processamento analítico dos Leads
    const leadsAnalysis = this.processLeadsData(rawLeadsResult.currentLeads, rawLeadsResult.prevLeadsCount);

    // Série temporal do gráfico Hero
    const heroPerformance = this.generateHeroPerformanceSeries(rawLeadsResult.currentLeads, range);

    // 8 KPI Cards Executivos com Sparklines
    const kpis = this.calculateExecutiveKpis(financialResult, leadsAnalysis, heroPerformance);

    // Alertas Gerenciais & Insights de Decisão
    const alerts = this.generateManagerialAlerts(financialResult, leadsAnalysis, operational);

    return {
      periodMode: mode,
      dateRange: range,
      kpis,
      heroPerformance,
      funnelStages: leadsAnalysis.funnelStages,
      channels: leadsAnalysis.channels,
      agencies: leadsAnalysis.agencies,
      financial: financialResult,
      alerts,
      operational,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Busca registros do Financeiro
   */
  async fetchFinancialData(range: DashboardDateRange): Promise<FinancialAnalyticsData> {
    const { data: rawRecords, error } = await supabase
      .from('financial_records')
      .select('*')
      .eq('is_deleted', false);

    if (error || !rawRecords) {
      console.error('Erro ao buscar financial_records:', error);
      return {
        totalPaid: 0,
        totalCommitted: 0,
        totalNoForecast: 0,
        totalRecordsCount: 0,
        paidRecordsCount: 0,
        prevTotalPaid: 0,
        paidDiffPercent: null,
        monthlyTrend: [],
        categoryBreakdown: [],
        statusBreakdown: [],
        topSuppliers: [],
      };
    }

    const isInsideRange = (dateStr: string | null, start: string, end: string) => {
      if (!start || !end) return true;
      if (!dateStr) return false;
      return dateStr >= start && dateStr <= end;
    };

    const currentRecords = rawRecords.filter((r) => {
      const targetDate = r.payment_actual_date || r.receipt_date;
      return isInsideRange(targetDate, range.startDate, range.endDate);
    });

    const prevRecords = rawRecords.filter((r) => {
      if (!range.prevStartDate || !range.prevEndDate) return false;
      const targetDate = r.payment_actual_date || r.receipt_date;
      return isInsideRange(targetDate, range.prevStartDate, range.prevEndDate);
    });

    let totalPaid = 0;
    let totalCommitted = 0;
    let totalNoForecast = 0;
    let paidRecordsCount = 0;

    currentRecords.forEach((r) => {
      const amt = Number(r.amount) || 0;
      if (r.status === 'pago') {
        totalPaid += amt;
        paidRecordsCount++;
      } else {
        totalCommitted += amt;
        if (r.status === 'aguardando_previsao' || r.status === 'a_encaminhar') {
          totalNoForecast += amt;
        }
      }
    });

    let prevTotalPaid = 0;
    prevRecords.forEach((r) => {
      if (r.status === 'pago') {
        prevTotalPaid += Number(r.amount) || 0;
      }
    });

    const paidDiffPercent =
      prevTotalPaid > 0 ? ((totalPaid - prevTotalPaid) / prevTotalPaid) * 100 : null;

    // Evolução Mensal
    const monthlyMap = new Map<string, { pago: number; previsto: number }>();
    const recordsForTrend = range.startDate ? currentRecords : rawRecords;
    recordsForTrend.forEach((r) => {
      const d = r.payment_actual_date || r.payment_forecast_date || r.receipt_date;
      if (!d) return;
      const monthKey = d.substring(0, 7);
      const amt = Number(r.amount) || 0;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { pago: 0, previsto: 0 });
      }
      const entry = monthlyMap.get(monthKey)!;
      if (r.status === 'pago') {
        entry.pago += amt;
      } else {
        entry.previsto += amt;
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, val]) => {
        const [y, m] = monthKey.split('-');
        const shortYear = y.substring(2);
        const monthLabel = `${MONTH_NAMES_PT[m] || m}/${shortYear}`;
        return {
          monthKey,
          monthLabel,
          pago: Math.round(val.pago * 100) / 100,
          previsto: Math.round(val.previsto * 100) / 100,
          total: Math.round((val.pago + val.previsto) * 100) / 100,
        };
      });

    // Gastos por Categoria
    const categoryMap = new Map<string, { total: number; count: number }>();
    const totalCurrentExpense = totalPaid + totalCommitted;

    currentRecords.forEach((r) => {
      const cat = r.category || 'Outros';
      const amt = Number(r.amount) || 0;
      const cur = categoryMap.get(cat) || { total: 0, count: 0 };
      categoryMap.set(cat, { total: cur.total + amt, count: cur.count + 1 });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, val]) => ({
        category,
        total: Math.round(val.total * 100) / 100,
        percentage:
          totalCurrentExpense > 0
            ? Math.round((val.total / totalCurrentExpense) * 1000) / 10
            : 0,
        count: val.count,
        color: CATEGORY_COLORS[category] || '#64748B',
      }))
      .sort((a, b) => b.total - a.total);

    // Status dos Pagamentos
    const statusMap: Record<string, { label: string; color: string; total: number; count: number }> =
      {
        pago: { label: 'Pago', color: '#059669', total: 0, count: 0 },
        pagamento_previsto: { label: 'Previsão Informada', color: '#2563EB', total: 0, count: 0 },
        aguardando_previsao: { label: 'Aguardando Previsão', color: '#D97706', total: 0, count: 0 },
        a_encaminhar: { label: 'A Encaminhar', color: '#E11D48', total: 0, count: 0 },
      };

    currentRecords.forEach((r) => {
      const st = r.status || 'a_encaminhar';
      if (statusMap[st]) {
        statusMap[st].total += Number(r.amount) || 0;
        statusMap[st].count += 1;
      }
    });

    const statusBreakdown = Object.entries(statusMap).map(([status, item]) => ({
      status,
      label: item.label,
      total: Math.round(item.total * 100) / 100,
      count: item.count,
      color: item.color,
    }));

    // Top 5 Fornecedores
    const supplierMap = new Map<string, { total: number; count: number }>();
    currentRecords.forEach((r) => {
      const sup = r.supplier ? r.supplier.trim() : 'Não informado';
      const amt = Number(r.amount) || 0;
      const cur = supplierMap.get(sup) || { total: 0, count: 0 };
      supplierMap.set(sup, { total: cur.total + amt, count: cur.count + 1 });
    });

    const topSuppliers = Array.from(supplierMap.entries())
      .map(([supplier, val]) => ({
        supplier,
        total: Math.round(val.total * 100) / 100,
        count: val.count,
        percentage:
          totalCurrentExpense > 0
            ? Math.round((val.total / totalCurrentExpense) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalCommitted: Math.round(totalCommitted * 100) / 100,
      totalNoForecast: Math.round(totalNoForecast * 100) / 100,
      totalRecordsCount: currentRecords.length,
      paidRecordsCount,
      prevTotalPaid: Math.round(prevTotalPaid * 100) / 100,
      paidDiffPercent: paidDiffPercent !== null ? Math.round(paidDiffPercent * 10) / 10 : null,
      monthlyTrend,
      categoryBreakdown,
      statusBreakdown,
      topSuppliers,
    };
  },

  /**
   * Busca os leads brutos do CVCRM para análise
   */
  async fetchRawLeadsData(range: DashboardDateRange): Promise<{ currentLeads: any[]; prevLeadsCount: number }> {
    let query = supabase.from('cvcrm_leads_cache').select('*');

    if (range.startDate) {
      query = query.gte('data_cad', `${range.startDate}T00:00:00-03:00`);
    }
    if (range.endDate) {
      query = query.lte('data_cad', `${range.endDate}T23:59:59-03:00`);
    }

    const { data: leads, error } = await query;
    if (error || !leads) {
      console.warn('Erro ao carregar leads:', error?.message);
      return { currentLeads: [], prevLeadsCount: 0 };
    }

    let prevCount = 0;
    if (range.prevStartDate && range.prevEndDate) {
      const { count } = await supabase
        .from('cvcrm_leads_cache')
        .select('*', { count: 'exact', head: true })
        .gte('data_cad', `${range.prevStartDate}T00:00:00-03:00`)
        .lte('data_cad', `${range.prevEndDate}T23:59:59-03:00`);
      prevCount = count || 0;
    }

    return { currentLeads: leads, prevLeadsCount: prevCount };
  },

  /**
   * Processamento analítico profundo dos leads (funil, canais, imobiliárias)
   */
  processLeadsData(leads: any[], prevLeadsCount: number): ProcessedLeadsResult {
    const totalLeads = leads.length;
    let totalReservas = 0;
    let totalVendas = 0;
    let qualifiedCount = 0;

    let stageContato = 0;
    let stageAtendimento = 0;
    let stageVisita = 0;
    let stageReserva = 0;
    let stageVenda = 0;

    const agencyMap = new Map<string, {
      agencyId: string;
      agencyName: string;
      leads: number;
      inService: number;
      qualified: number;
      reservas: number;
      vendas: number;
    }>();

    const channelMap = new Map<string, {
      channel: string;
      label: string;
      count: number;
      qualified: number;
      sales: number;
    }>();

    leads.forEach((l) => {
      const sit = (l.situacao_nome || '').trim().toLowerCase();
      const resCount = Number(l.qtde_reservas) || 0;
      totalReservas += resCount;

      const isVenda = sit.includes('venda realizada') || sit.includes('vendido');
      const isReserva = resCount > 0 || sit.includes('reserva');
      const isVisita = sit.includes('visita');
      const isAtendimento = sit.includes('atendimento');
      const isContato = sit.includes('contato') || sit.includes('aguardando');

      const isQualified = isVenda || isReserva || isVisita || isAtendimento;
      if (isQualified) qualifiedCount++;

      if (isVenda) {
        totalVendas++;
        stageVenda++;
        stageReserva++;
        stageVisita++;
        stageAtendimento++;
      } else if (isReserva) {
        stageReserva++;
        stageVisita++;
        stageAtendimento++;
      } else if (isVisita) {
        stageVisita++;
        stageAtendimento++;
      } else if (isAtendimento) {
        stageAtendimento++;
      } else if (isContato) {
        stageContato++;
      }

      // 1. Agrupar por Imobiliária
      const agId = l.agency_id || l.agency_cvcrm_id || 'unknown';
      const agName = l.agency_name ? l.agency_name.trim() : 'Não informada';
      const agEntry = agencyMap.get(agName) || {
        agencyId: agId,
        agencyName: agName,
        leads: 0,
        inService: 0,
        qualified: 0,
        reservas: 0,
        vendas: 0,
      };

      agEntry.leads++;
      if (isAtendimento) agEntry.inService++;
      if (isQualified) agEntry.qualified++;
      if (isReserva) agEntry.reservas += Math.max(1, resCount);
      if (isVenda) agEntry.vendas++;
      agencyMap.set(agName, agEntry);

      // 2. Agrupar por Canal / Origem
      const rawOrigin = (l.midia_principal || l.origem || 'Meta Ads').trim();
      let normalizedChannel = 'Meta Ads';
      let channelLabel = 'Meta Ads (Facebook/Instagram)';
      const originLower = rawOrigin.toLowerCase();

      if (originLower.includes('google')) {
        normalizedChannel = 'Google Ads';
        channelLabel = 'Google Ads (Pesquisa & Display)';
      } else if (originLower.includes('organico') || originLower.includes('direto')) {
        normalizedChannel = 'Orgânico / Direto';
        channelLabel = 'Tráfego Orgânico & Direto';
      } else if (originLower.includes('portal') || originLower.includes('imovelweb') || originLower.includes('zap')) {
        normalizedChannel = 'Portais Imobiliários';
        channelLabel = 'Portais (ZAP / VivaReal)';
      }

      const chanEntry = channelMap.get(normalizedChannel) || {
        channel: normalizedChannel,
        label: channelLabel,
        count: 0,
        qualified: 0,
        sales: 0,
      };

      chanEntry.count++;
      if (isQualified) chanEntry.qualified++;
      if (isVenda) chanEntry.sales++;
      channelMap.set(normalizedChannel, chanEntry);
    });

    const conversionRate = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;
    const qualificationRate = totalLeads > 0 ? (qualifiedCount / totalLeads) * 100 : 0;

    // Etapas do Funil com Drop-off Real e Detecção de Gargalo
    const rawStages = [
      { key: 'entrada', name: 'Cadastros Recebidos', count: totalLeads, color: '#B21010' },
      { key: 'contato', name: 'Contato / Triagem', count: stageAtendimento + stageContato, color: '#EA580C' },
      { key: 'atendimento', name: 'Em Atendimento Ativo', count: stageAtendimento, color: '#2563EB' },
      { key: 'visita', name: 'Visitas Agendadas / Realizadas', count: stageVisita, color: '#3B82F6' },
      { key: 'reserva', name: 'Pastas com Reserva', count: stageReserva, color: '#7C3AED' },
      { key: 'venda', name: 'Vendas Concluídas', count: stageVenda, color: '#059669' },
    ];

    let maxDropOffPercent = -1;
    let bottleneckKey = '';

    const funnelStages: FunnelStageItem[] = rawStages.map((st, idx) => {
      const prevCount = idx === 0 ? st.count : rawStages[idx - 1].count;
      const dropOffCount = idx === 0 ? 0 : Math.max(0, prevCount - st.count);
      const dropOffPercent = idx === 0 || prevCount === 0 ? 0 : Math.round((dropOffCount / prevCount) * 1000) / 10;
      const percentageFromTop = totalLeads > 0 ? Math.round((st.count / totalLeads) * 1000) / 10 : 0;

      if (idx > 0 && dropOffPercent > maxDropOffPercent && prevCount > 5) {
        maxDropOffPercent = dropOffPercent;
        bottleneckKey = st.key;
      }

      return {
        stageKey: st.key,
        stageName: st.name,
        count: st.count,
        percentageFromTop,
        dropOffCount,
        dropOffPercent,
        isBottleneck: false,
        color: st.color,
      };
    });

    // Marcar o gargalo com a maior taxa de perda
    funnelStages.forEach((st) => {
      if (st.stageKey === bottleneckKey) {
        st.isBottleneck = true;
      }
    });

    // Ranking de Imobiliárias (Fila TOP 5)
    const agencies: AgencyPerformanceRow[] = Array.from(agencyMap.values())
      .map((ag) => {
        const conv = ag.leads > 0 ? Math.round((ag.vendas / ag.leads) * 1000) / 10 : 0;
        const share = totalLeads > 0 ? Math.round((ag.leads / totalLeads) * 1000) / 10 : 0;

        let statusBadge: 'top' | 'regular' | 'atencao' = 'regular';
        if (conv >= 3.0 || ag.vendas > 0) statusBadge = 'top';
        else if (ag.leads >= 25 && ag.reservas === 0) statusBadge = 'atencao';

        return {
          agencyId: ag.agencyId,
          agencyName: ag.agencyName,
          leadsCount: ag.leads,
          inServiceCount: ag.inService,
          qualifiedCount: ag.qualified,
          reservasCount: ag.reservas,
          vendasCount: ag.vendas,
          conversionRate: conv,
          shareOfLeads: share,
          statusBadge,
        };
      })
      .sort((a, b) => b.leadsCount - a.leadsCount);

    // Canais e Origem
    const channelColors: Record<string, string> = {
      'Meta Ads': '#B21010',
      'Google Ads': '#2563EB',
      'Orgânico / Direto': '#059669',
      'Portais Imobiliários': '#7C3AED',
    };

    const channels: ChannelPerformanceItem[] = Array.from(channelMap.values())
      .map((ch) => ({
        channel: ch.channel,
        label: ch.label,
        count: ch.count,
        sharePercent: totalLeads > 0 ? Math.round((ch.count / totalLeads) * 1000) / 10 : 0,
        qualifiedCount: ch.qualified,
        qualificationRate: ch.count > 0 ? Math.round((ch.qualified / ch.count) * 1000) / 10 : 0,
        salesCount: ch.sales,
        conversionRate: ch.count > 0 ? Math.round((ch.sales / ch.count) * 1000) / 10 : 0,
        color: channelColors[ch.channel] || '#64748B',
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLeads,
      prevLeadsCount,
      totalReservas: Math.max(totalReservas, stageReserva),
      totalVendas,
      qualifiedCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      qualificationRate: Math.round(qualificationRate * 100) / 100,
      funnelStages,
      agencies,
      channels,
    };
  },

  /**
   * Gera a série temporal contínua para o gráfico Hero Recharts
   */
  generateHeroPerformanceSeries(leads: any[], _range: DashboardDateRange): HeroPerformanceDataPoint[] {
    if (leads.length === 0) return [];

    // Agrupar por data (YYYY-MM-DD ou YYYY-MM)
    const pointsMap = new Map<string, { leads: number; qualificados: number; reservas: number; vendas: number }>();

    leads.forEach((l) => {
      if (!l.data_cad) return;
      const datePart = l.data_cad.split('T')[0];
      const sit = (l.situacao_nome || '').toLowerCase();
      const isVenda = sit.includes('venda realizada') || sit.includes('vendido');
      const isReserva = (Number(l.qtde_reservas) || 0) > 0 || sit.includes('reserva');
      const isQualif = isVenda || isReserva || sit.includes('visita') || sit.includes('atendimento');

      const cur = pointsMap.get(datePart) || { leads: 0, qualificados: 0, reservas: 0, vendas: 0 };
      cur.leads++;
      if (isQualif) cur.qualificados++;
      if (isReserva) cur.reservas++;
      if (isVenda) cur.vendas++;
      pointsMap.set(datePart, cur);
    });

    const sortedDates = Array.from(pointsMap.keys()).sort();

    // Se houver mais de 60 datas distintas, agrupar por semana ou mês
    return sortedDates.map((d) => {
      const [, m, day] = d.split('-');
      const val = pointsMap.get(d)!;
      return {
        date: d,
        dateLabel: `${day}/${m}`,
        leads: val.leads,
        qualificados: val.qualificados,
        reservas: val.reservas,
        vendas: val.vendas,
      };
    });
  },

  /**
   * Constrói os 8 KPI Cards Executivos com sparklines e deltas
   */
  calculateExecutiveKpis(
    financial: FinancialAnalyticsData,
    leadsData: ProcessedLeadsResult,
    heroSeries: HeroPerformanceDataPoint[]
  ) {
    const fmtCurrency = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const fmtNumber = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

    // Mídia Paga
    const mediaCategory = financial.categoryBreakdown.find((c) => c.category === 'Mídia Paga & Anúncios');
    const mediaSpend = mediaCategory ? mediaCategory.total : 0;

    const totalLeads = leadsData.totalLeads;
    const totalReservas = leadsData.totalReservas;
    const totalVendas = leadsData.totalVendas;

    const cplReal = totalLeads > 0 && mediaSpend > 0 ? mediaSpend / totalLeads : null;
    const cacReal = totalVendas > 0 && mediaSpend > 0 ? mediaSpend / totalVendas : null;

    // Sparklines a partir do heroSeries
    const sparkLeads: SparklinePoint[] = heroSeries.slice(-14).map((h) => ({ date: h.date, value: h.leads }));
    const sparkQualif: SparklinePoint[] = heroSeries.slice(-14).map((h) => ({ date: h.date, value: h.qualificados }));
    const sparkReservas: SparklinePoint[] = heroSeries.slice(-14).map((h) => ({ date: h.date, value: h.reservas }));
    const sparkVendas: SparklinePoint[] = heroSeries.slice(-14).map((h) => ({ date: h.date, value: h.vendas }));

    // Sparkline financeiro a partir da tendência mensal
    const sparkFin: SparklinePoint[] = financial.monthlyTrend.slice(-6).map((m) => ({ date: m.monthKey, value: m.pago }));

    const leadsDelta = leadsData.prevLeadsCount > 0
      ? Math.round(((totalLeads - leadsData.prevLeadsCount) / leadsData.prevLeadsCount) * 1000) / 10
      : null;

    return {
      // 1. Investimento Total Realizado
      investedTotal: {
        id: 'investedTotal',
        title: 'Investimento Total Pago',
        value: financial.totalPaid,
        formattedValue: fmtCurrency(financial.totalPaid),
        subtitle: `${financial.paidRecordsCount} despesas quitadas`,
        deltaPercent: financial.paidDiffPercent,
        deltaType: (financial.paidDiffPercent || 0) <= 0 ? 'positive' : 'negative',
        sparkline: sparkFin,
        tooltip: 'Soma total de cobranças com pagamento efetivado no período selecionado.',
        accentColor: '#B21010',
      } as KpiCardDetail,

      // 2. Leads Recebidos (Fila TOP 5)
      leadsReceived: {
        id: 'leadsReceived',
        title: 'Leads na Fila TOP 5',
        value: totalLeads,
        formattedValue: `${fmtNumber(totalLeads)}`,
        unit: 'leads',
        subtitle: 'Distribuição comercial Meta',
        deltaPercent: leadsDelta,
        deltaType: (leadsDelta || 0) >= 0 ? 'positive' : 'negative',
        sparkline: sparkLeads,
        tooltip: 'Total de leads capturados na fila comercial oficial do Facebook e distribuídos.',
        accentColor: '#2563EB',
      } as KpiCardDetail,

      // 3. CPL Real (Mídia / Leads)
      cplReal: {
        id: 'cplReal',
        title: 'CPL Real (Mídia / CRM)',
        value: cplReal || 0,
        formattedValue: cplReal !== null ? fmtCurrency(cplReal) : '-',
        subtitle: `Verba Mídia: ${fmtCurrency(mediaSpend)}`,
        deltaPercent: null,
        deltaType: (cplReal || 0) <= 30 ? 'positive' : 'negative',
        targetValue: 30,
        targetDescription: 'Meta de mercado: até R$ 30,00',
        sparkline: sparkLeads,
        tooltip: 'Investimento na categoria Mídia Paga dividido pela quantidade total de leads registrados no CRM.',
        accentColor: '#059669',
      } as KpiCardDetail,

      // 4. Leads Qualificados
      leadsQualified: {
        id: 'leadsQualified',
        title: 'Leads Qualificados',
        value: leadsData.qualifiedCount,
        formattedValue: `${fmtNumber(leadsData.qualifiedCount)}`,
        unit: 'leads',
        subtitle: `${leadsData.qualificationRate}% do total capturado`,
        deltaPercent: null,
        deltaType: 'positive',
        targetValue: 40,
        targetDescription: 'Meta de qualificação: > 40%',
        sparkline: sparkQualif,
        tooltip: 'Interessados que avançaram além do contato inicial (Atendimento, Visita, Reserva ou Venda).',
        accentColor: '#7C3AED',
      } as KpiCardDetail,

      // 5. Pastas com Reserva
      reservas: {
        id: 'reservas',
        title: 'Pastas com Reserva',
        value: totalReservas,
        formattedValue: `${fmtNumber(totalReservas)}`,
        unit: 'reservas',
        subtitle: mediaSpend > 0 && totalReservas > 0 ? `${fmtCurrency(mediaSpend / totalReservas)}/res` : 'Garantia de compra',
        deltaPercent: null,
        deltaType: 'positive',
        sparkline: sparkReservas,
        tooltip: 'Clientes com unidade e pasta de financiamento reservadas formalmente no CVCRM.',
        accentColor: '#D97706',
      } as KpiCardDetail,

      // 6. Vendas Concluídas
      vendas: {
        id: 'vendas',
        title: 'Vendas Concluídas',
        value: totalVendas,
        formattedValue: `${fmtNumber(totalVendas)}`,
        unit: 'contratos',
        subtitle: 'Contratos fechados no período',
        deltaPercent: null,
        deltaType: 'positive',
        targetValue: 8,
        targetDescription: 'Meta do ciclo: 8 vendas',
        sparkline: sparkVendas,
        tooltip: 'Contratos formalizados e vendas concretizadas pelas imobiliárias da fila.',
        accentColor: '#059669',
      } as KpiCardDetail,

      // 7. Taxa de Conversão Geral
      conversionRate: {
        id: 'conversionRate',
        title: 'Taxa de Conversão Final',
        value: leadsData.conversionRate,
        formattedValue: `${leadsData.conversionRate.toFixed(2)}%`,
        subtitle: `1 venda a cada ${totalVendas > 0 ? (totalLeads / totalVendas).toFixed(0) : '-'} leads`,
        deltaPercent: null,
        deltaType: leadsData.conversionRate >= 2.0 ? 'positive' : 'neutral',
        targetValue: 2.0,
        targetDescription: 'Benchmark imobiliário: 2.0%',
        sparkline: sparkVendas,
        tooltip: 'Percentual de leads recebidos na fila que foram convertidos em contrato de venda.',
        accentColor: '#B21010',
      } as KpiCardDetail,

      // 8. CAC Real por Contrato
      cacReal: {
        id: 'cacReal',
        title: 'CAC Real de Mídia',
        value: cacReal || 0,
        formattedValue: cacReal !== null ? fmtCurrency(cacReal) : '-',
        subtitle: totalVendas > 0 ? `${totalVendas} vendas geradas` : 'Aguardando vendas',
        deltaPercent: null,
        deltaType: 'neutral',
        sparkline: sparkVendas,
        tooltip: 'Custo de Aquisição de Cliente: investimento de mídia dividido pelas vendas concretizadas.',
        accentColor: '#0F172A',
      } as KpiCardDetail,
    };
  },

  /**
   * Motor de Alertas Gerenciais & Insights Reais (Sem dados fictícios)
   */
  generateManagerialAlerts(
    financial: FinancialAnalyticsData,
    leadsData: ProcessedLeadsResult,
    operational: OperationalQuickData
  ): ManagerialAlertItem[] {
    const alerts: ManagerialAlertItem[] = [];
    const fmtCurrency = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

    // 1. Alerta Financeiro: Contas sem previsão no Sienge
    if (financial.totalNoForecast > 0) {
      alerts.push({
        id: 'fin-no-forecast',
        severity: 'atencao',
        category: 'financeiro',
        title: 'Gargalo no Fluxo Sienge',
        description: `Existem ${fmtCurrency(financial.totalNoForecast)} em cobranças encaminhadas ao financeiro que ainda aguardam retorno de data de previsão.`,
        metricBadge: fmtCurrency(financial.totalNoForecast),
        targetTab: 'financeiro',
        actionText: 'Ver no Financeiro',
      });
    }

    // 2. Alerta Comercial: Gargalo na Esteira do CVCRM
    const bottleneckStage = leadsData.funnelStages.find((s: FunnelStageItem) => s.isBottleneck);
    if (bottleneckStage && bottleneckStage.dropOffPercent > 50) {
      alerts.push({
        id: 'crm-bottleneck',
        severity: 'critico',
        category: 'crm',
        title: `Ponto Crítico no Funil: ${bottleneckStage.stageName}`,
        description: `Queda de ${bottleneckStage.dropOffPercent}% de perda (${bottleneckStage.dropOffCount} leads) na transição para "${bottleneckStage.stageName}". Ações de retargeting e qualificação recomendadas.`,
        metricBadge: `-${bottleneckStage.dropOffPercent}% perda`,
        targetTab: 'imobiliarias',
        actionText: 'Analisar Esteira',
      });
    }

    // 3. Alerta de Performance das Imobiliárias
    const topAgency = leadsData.agencies.find((a: AgencyPerformanceRow) => a.vendasCount > 0);
    if (topAgency) {
      alerts.push({
        id: 'imob-top',
        severity: 'oportunidade',
        category: 'imobiliaria',
        title: `Imobiliária Destaque: ${topAgency.agencyName}`,
        description: `Liderança com ${topAgency.vendasCount} vendas e ${topAgency.conversionRate}% de conversão sobre ${topAgency.leadsCount} leads distribuídos.`,
        metricBadge: `${topAgency.conversionRate}% conv.`,
        targetTab: 'imobiliarias',
        actionText: 'Ver Ranking',
      });
    }

    const underperformingAgency = leadsData.agencies.find((a: AgencyPerformanceRow) => a.leadsCount >= 30 && a.reservasCount === 0);
    if (underperformingAgency) {
      alerts.push({
        id: 'imob-underperform',
        severity: 'atencao',
        category: 'imobiliaria',
        title: `Atenção à Fila: ${underperformingAgency.agencyName}`,
        description: `Recebeu ${underperformingAgency.leadsCount} leads na fila TOP 5 sem gerar reservas ou vendas. Sugerido alinhamento com a coordenação de corretores.`,
        metricBadge: `0 reservas (${underperformingAgency.leadsCount} leads)`,
        targetTab: 'imobiliarias',
        actionText: 'Auditar Distribuição',
      });
    }

    // 4. Alerta Operacional: Pautas atrasadas
    if (operational.contentOverdue > 0) {
      alerts.push({
        id: 'content-overdue',
        severity: 'atencao',
        category: 'conteudo',
        title: 'Pautas em Atraso no Kanban',
        description: `Existem ${operational.contentOverdue} cartão(ões) de conteúdo com prazo ultrapassado aguardando produção ou aprovação.`,
        metricBadge: `${operational.contentOverdue} atrasado(s)`,
        targetTab: 'conteudos',
        actionText: 'Ver Kanban',
      });
    }

    return alerts;
  },
};
