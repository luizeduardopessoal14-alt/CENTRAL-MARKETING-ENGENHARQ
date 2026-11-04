import { supabase } from '../lib/supabase';
import { contentService } from './contentService';
import { calendarService } from './calendarService';
import { calculateDueDateAlert } from '../types/conteudos';
import {
  DashboardPeriodMode,
  DashboardDateRange,
  DashboardFullData,
  FinancialAnalyticsData,
  LeadsAnalyticsData,
  MediaCrossAnalyticsData,
  OperationalQuickData,
  FunnelStageItem,
  AgencyPerformanceRow,
} from '../types/dashboard';

const CATEGORY_COLORS: Record<string, string> = {
  'Eventos & Feirões': '#DE3A39',
  'Mídia Paga & Anúncios': '#3B82F6',
  'Gráfica & Comunicação Visual': '#10B981',
  'Brindes, Camisas & Uniformes': '#F59E0B',
  'Produção Audiovisual & 3D': '#8B5CF6',
  'Taxas & Serviços Técnicos': '#6366F1',
  'Outros': '#6B7280',
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
    const currentMonth = now.getMonth(); // 0-indexed

    if (mode === 'este_mes') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = now;
      const prevStart = new Date(currentYear, currentMonth - 1, 1);
      const prevEnd = new Date(currentYear, currentMonth, 0); // último dia do mês anterior
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
   * Carrega e processa todos os dados analíticos de forma consolidada
   */
  async getFullDashboardData(
    mode: DashboardPeriodMode = 'este_mes',
    customStart?: string,
    customEnd?: string
  ): Promise<DashboardFullData> {
    const range = this.calculateDateRange(mode, customStart, customEnd);

    // Disparar buscas em paralelo
    const [financialResult, leadsResult, contentResult, calendarResult] =
      await Promise.all([
        this.fetchFinancialData(range),
        this.fetchLeadsData(range),
        contentService.fetchCards().catch(() => ({ data: [] })),
        calendarService.getOverviewMetrics().catch(() => ({
          nextEvents: [],
          meetingsThisWeekCount: 0,
          eventsThisMonthCount: 0,
        })),
      ]);

    // Calcular eficiência de mídia cruzando financeiro e leads
    const media = this.calculateMediaCross(financialResult, leadsResult);

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

    return {
      periodMode: mode,
      dateRange: range,
      financial: financialResult,
      leads: leadsResult,
      media,
      operational,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Processamento analítico do módulo Financeiro
   */
  async fetchFinancialData(range: DashboardDateRange): Promise<FinancialAnalyticsData> {
    const { data: rawRecords, error } = await supabase
      .from('financial_records')
      .select('*')
      .eq('is_deleted', false);

    if (error || !rawRecords) {
      console.error('Erro ao buscar financial_records para dashboard:', error);
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

    // Filtro do período atual
    const isInsideRange = (dateStr: string | null, start: string, end: string) => {
      if (!start || !end) return true; // Todo o período
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

    // Totais principais
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

    // 1. Evolução Mensal (Agrupado por YYYY-MM de todos os registros ou período)
    const monthlyMap = new Map<string, { pago: number; previsto: number }>();

    // Usar todos os registros ou os do período se for amplo
    const recordsForTrend = range.startDate ? currentRecords : rawRecords;
    recordsForTrend.forEach((r) => {
      const d = r.payment_actual_date || r.payment_forecast_date || r.receipt_date;
      if (!d) return;
      const monthKey = d.substring(0, 7); // '2026-04'
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

    // 2. Gastos por Categoria
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
        color: CATEGORY_COLORS[category] || '#9CA3AF',
      }))
      .sort((a, b) => b.total - a.total);

    // 3. Status dos Pagamentos
    const statusMap: Record<string, { label: string; color: string; total: number; count: number }> =
      {
        pago: { label: 'Pago', color: '#10B981', total: 0, count: 0 },
        pagamento_previsto: { label: 'Previsão Informada', color: '#3B82F6', total: 0, count: 0 },
        aguardando_previsao: { label: 'Aguardando Previsão', color: '#F59E0B', total: 0, count: 0 },
        a_encaminhar: { label: 'A Encaminhar', color: '#EF4444', total: 0, count: 0 },
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

    // 4. Top 5 Fornecedores
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
   * Processamento analítico dos Leads do CVCRM (Fila TOP 5)
   */
  async fetchLeadsData(range: DashboardDateRange): Promise<LeadsAnalyticsData> {
    let query = supabase.from('cvcrm_leads_cache').select('*');

    if (range.startDate) {
      query = query.gte('data_cad', `${range.startDate}T00:00:00-03:00`);
    }
    if (range.endDate) {
      query = query.lte('data_cad', `${range.endDate}T23:59:59-03:00`);
    }

    const { data: leads, error } = await query;

    if (error || !leads) {
      console.warn('Erro ao carregar cvcrm_leads_cache:', error?.message);
      return {
        totalLeads: 0,
        prevTotalLeads: 0,
        leadsDiffPercent: null,
        totalSimulacoes: 0,
        totalReservas: 0,
        totalVendas: 0,
        conversionRate: 0,
        prevConversionRate: null,
        qualificationRate: 0,
        funnelStages: [],
        agencyRankings: [],
      };
    }

    // Período anterior para comparação de volume de leads
    let prevTotalLeads = 0;
    if (range.prevStartDate && range.prevEndDate) {
      const { count } = await supabase
        .from('cvcrm_leads_cache')
        .select('*', { count: 'exact', head: true })
        .gte('data_cad', `${range.prevStartDate}T00:00:00-03:00`)
        .lte('data_cad', `${range.prevEndDate}T23:59:59-03:00`);
      prevTotalLeads = count || 0;
    }

    const totalLeads = leads.length;
    let totalSimulacoes = 0;
    let totalReservas = 0;
    let totalVendas = 0;
    let qualifiedCount = 0;

    // Etapas da esteira para contagem do funil
    let stageContato = 0;
    let stageAtendimento = 0;
    let stageVisita = 0;
    let stageReserva = 0;
    let stageVenda = 0;
    let stageCongela = 0;

    // Mapa de performance por imobiliária
    const agencyMap = new Map<
      string,
      { agencyId: string; agencyName: string; leads: number; reservas: number; vendas: number }
    >();

    leads.forEach((l) => {
      const sit = (l.situacao_nome || '').trim().toLowerCase();
      totalSimulacoes += Number(l.qtde_simulacoes) || 0;
      const resCount = Number(l.qtde_reservas) || 0;
      totalReservas += resCount;

      const isVenda = sit.includes('venda realizada') || sit.includes('vendido');
      const isReserva = resCount > 0 || sit.includes('reserva');
      const isVisita = sit.includes('visita');
      const isAtendimento = sit.includes('atendimento');
      const isContato = sit.includes('contato') || sit.includes('aguardando');
      const isCongela = sit.includes('congela') || sit.includes('descarte') || sit.includes('perdido');

      if (isVenda) {
        totalVendas++;
        stageVenda++;
        stageReserva++;
        stageVisita++;
        stageAtendimento++;
        qualifiedCount++;
      } else if (isReserva) {
        stageReserva++;
        stageVisita++;
        stageAtendimento++;
        qualifiedCount++;
      } else if (isVisita) {
        stageVisita++;
        stageAtendimento++;
        qualifiedCount++;
      } else if (isAtendimento) {
        stageAtendimento++;
        qualifiedCount++;
      } else if (isContato) {
        stageContato++;
      } else if (isCongela) {
        stageCongela++;
      }

      // Agrupar por imobiliária
      const agId = l.agency_id || l.agency_cvcrm_id || 'unknown';
      const agName = l.agency_name || 'Não informada';
      const agCur = agencyMap.get(agName) || {
        agencyId: agId,
        agencyName: agName,
        leads: 0,
        reservas: 0,
        vendas: 0,
      };

      agCur.leads++;
      if (isReserva) agCur.reservas += Math.max(1, resCount);
      if (isVenda) agCur.vendas++;
      agencyMap.set(agName, agCur);
    });

    const conversionRate =
      totalLeads > 0 ? Math.round((totalVendas / totalLeads) * 1000) / 10 : 0;
    const qualificationRate =
      totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 1000) / 10 : 0;

    const leadsDiffPercent =
      prevTotalLeads > 0
        ? Math.round(((totalLeads - prevTotalLeads) / prevTotalLeads) * 1000) / 10
        : null;

    // Montar Funil Progressivo estilo Power BI
    const funnelStages: FunnelStageItem[] = [
      {
        stageKey: 'total',
        stageName: 'Cadastros Recebidos',
        count: totalLeads,
        percentageFromTop: 100,
        color: '#DE3A39', // EngenhArq Red
      },
      {
        stageKey: 'atendimento',
        stageName: 'Em Atendimento / Triagem',
        count: stageAtendimento + stageContato,
        percentageFromTop:
          totalLeads > 0
            ? Math.round(((stageAtendimento + stageContato) / totalLeads) * 1000) / 10
            : 0,
        color: '#EA580C', // Laranja
      },
      {
        stageKey: 'visita',
        stageName: 'Visitas Agendadas / Realizadas',
        count: stageVisita,
        percentageFromTop:
          totalLeads > 0 ? Math.round((stageVisita / totalLeads) * 1000) / 10 : 0,
        color: '#3B82F6', // Azul
      },
      {
        stageKey: 'reserva',
        stageName: 'Pastas com Reserva',
        count: stageReserva,
        percentageFromTop:
          totalLeads > 0 ? Math.round((stageReserva / totalLeads) * 1000) / 10 : 0,
        color: '#8B5CF6', // Roxo
      },
      {
        stageKey: 'venda',
        stageName: 'Vendas Concluídas',
        count: stageVenda,
        percentageFromTop:
          totalLeads > 0 ? Math.round((stageVenda / totalLeads) * 1000) / 10 : 0,
        color: '#10B981', // Verde
      },
    ];

    // Montar Ranking das 8 Imobiliárias
    const agencyRankings: AgencyPerformanceRow[] = Array.from(agencyMap.values())
      .map((item) => ({
        agencyId: item.agencyId,
        agencyName: item.agencyName,
        leadsCount: item.leads,
        reservasCount: item.reservas,
        vendasCount: item.vendas,
        conversionRate:
          item.leads > 0 ? Math.round((item.vendas / item.leads) * 1000) / 10 : 0,
        shareOfLeads:
          totalLeads > 0 ? Math.round((item.leads / totalLeads) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.leadsCount - a.leadsCount);

    return {
      totalLeads,
      prevTotalLeads,
      leadsDiffPercent,
      totalSimulacoes,
      totalReservas: Math.max(totalReservas, stageReserva),
      totalVendas,
      conversionRate,
      prevConversionRate: null,
      qualificationRate,
      funnelStages,
      agencyRankings,
    };
  },

  /**
   * Cálculo de inteligência cruzada (Financeiro de Mídia x Leads do CVCRM)
   */
  calculateMediaCross(
    financial: FinancialAnalyticsData,
    leads: LeadsAnalyticsData
  ): MediaCrossAnalyticsData {
    // Buscar o investimento em mídia pago na categoria correspondente
    const mediaCategory = financial.categoryBreakdown.find(
      (c) => c.category === 'Mídia Paga & Anúncios'
    );
    const totalSpend = mediaCategory ? mediaCategory.total : 0;
    const totalLeads = leads.totalLeads;
    const totalReservas = leads.totalReservas;
    const totalVendas = leads.totalVendas;

    const cplReal = totalLeads > 0 && totalSpend > 0 ? totalSpend / totalLeads : null;
    const costPerReservation =
      totalReservas > 0 && totalSpend > 0 ? totalSpend / totalReservas : null;
    const costPerSale =
      totalVendas > 0 && totalSpend > 0 ? totalSpend / totalVendas : null;

    return {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalLeads,
      cplReal: cplReal !== null ? Math.round(cplReal * 100) / 100 : null,
      costPerReservation:
        costPerReservation !== null ? Math.round(costPerReservation * 100) / 100 : null,
      costPerSale: costPerSale !== null ? Math.round(costPerSale * 100) / 100 : null,
      prevSpend: 0,
      prevCplReal: null,
      spendDiffPercent: null,
    };
  },
};
