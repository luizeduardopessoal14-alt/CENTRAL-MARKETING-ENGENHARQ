import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import { DashboardPeriodMode, DashboardFullData } from '../../types/dashboard';
import { dashboardAnalyticsService } from '../../services/dashboardAnalyticsService';
import { DashboardFilters } from './DashboardFilters';
import { ExecutiveKpiGrid } from './ExecutiveKpiGrid';
import { PerformanceEvolutionChart } from './PerformanceEvolutionChart';
import { ConversionFunnelInteractive } from './ConversionFunnelInteractive';
import { LeadOriginAnalytics } from './LeadOriginAnalytics';
import { AgencyPerformanceMatrix } from './AgencyPerformanceMatrix';
import { FinancialPerformanceBlock } from './FinancialPerformanceBlock';
import { ManagerialAlertsPanel } from './ManagerialAlertsPanel';
import { OperationalQuickSection } from './OperationalQuickSection';
import { AlertCircle, RefreshCw, BarChart3, ShieldCheck } from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (tab: AppArea) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { hasAccess, user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // Permissões por área
  const canViewFinancial = isSuperadmin || hasAccess('financeiro', 'consulta');
  const canViewLeads = isSuperadmin || hasAccess('imobiliarias', 'consulta');
  const canViewMedia = isSuperadmin || hasAccess('midia', 'consulta');
  const canViewContent = isSuperadmin || hasAccess('conteudos', 'consulta');
  const canViewCalendar = isSuperadmin || hasAccess('calendario', 'consulta');

  // Estados dos Slicers / Filtros Globais
  const [periodMode, setPeriodMode] = useState<DashboardPeriodMode>('este_mes');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dados do Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardFullData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar datas conforme o modo
  useEffect(() => {
    const range = dashboardAnalyticsService.calculateDateRange(periodMode, startDate, endDate);
    if (periodMode !== 'personalizado') {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, [periodMode]);

  // Carregar dados analíticos
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardAnalyticsService.getFullDashboardData(
        periodMode,
        startDate,
        endDate
      );
      setDashboardData(data);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Falha ao processar dados do painel analítico. Tente atualizar a página.');
    } finally {
      setIsLoading(false);
    }
  }, [periodMode, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 bg-[#F8F9FB] min-h-screen">
      {/* Banner de Cabeçalho Executivo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B21010] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#B21010]">
              Marketing Intelligence Suite
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Central Marketing <span className="text-[#B21010]">in Control</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Painel analítico integrado: Sienge (orçamento), CVCRM (esteira comercial e TOP 5) e Meta Ads (eficiência de mídia).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados Reais e Auditados</span>
          </div>
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 tabular-nums">
            Horário de Brasília (BRT)
          </div>
        </div>
      </motion.div>

      {/* Segmentador de Dados Global (Slicers estilo Power BI) */}
      <DashboardFilters
        periodMode={periodMode}
        onPeriodModeChange={(m) => setPeriodMode(m)}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(d) => setStartDate(d)}
        onEndDateChange={(d) => setEndDate(d)}
        isLoading={isLoading}
        onRefresh={loadData}
        lastUpdated={dashboardData?.updatedAt || ''}
      />

      {/* Tratamento de Erro */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-[#B21010] flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 rounded-lg text-[#B21010] font-semibold hover:bg-red-50 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado de Carregamento com Skeleton UI */}
      {isLoading && !dashboardData ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-7 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-40 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Skeleton Hero Chart */}
          <div className="h-88 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-100 rounded-xl" />
          </div>

          {/* Skeleton Grid 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-96 bg-white rounded-2xl border border-slate-200/80" />
            <div className="lg:col-span-5 h-96 bg-white rounded-2xl border border-slate-200/80" />
          </div>
        </div>
      ) : dashboardData ? (
        <div className="space-y-8">
          {/* SEÇÃO 1 — VISÃO EXECUTIVA (8 Bento Cards com Sparklines & Deltas) */}
          <ExecutiveKpiGrid kpis={dashboardData.kpis} />

          {/* SEÇÃO 2 — EVOLUÇÃO DE PERFORMANCE (Hero Recharts Area Chart) */}
          <PerformanceEvolutionChart data={dashboardData.heroPerformance} />

          {/* SEÇÕES 3 & 4 — FUNIL DE CONVERSÃO + ORIGEM DOS LEADS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SEÇÃO 3 — FUNIL DO CVCRM */}
            <div className="lg:col-span-7">
              <ConversionFunnelInteractive
                stages={dashboardData.funnelStages}
                onNavigateToCrm={canViewLeads ? () => onNavigate('imobiliarias') : undefined}
              />
            </div>

            {/* SEÇÃO 4 — ORIGEM DOS LEADS */}
            <div className="lg:col-span-5">
              <LeadOriginAnalytics
                channels={dashboardData.channels}
                onNavigateToMedia={canViewMedia ? () => onNavigate('midia') : undefined}
              />
            </div>
          </div>

          {/* SEÇÃO 5 — PERFORMANCE DAS IMOBILIÁRIAS (Fila TOP 5 CVCRM) */}
          {canViewLeads ? (
            <AgencyPerformanceMatrix
              agencies={dashboardData.agencies}
              onNavigateToAgencies={() => onNavigate('imobiliarias')}
            />
          ) : (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Acesso ao módulo de Imobiliárias restrito às suas permissões.
            </div>
          )}

          {/* SEÇÃO 6 — PERFORMANCE FINANCEIRA (Sienge Orçamento & Fluxo) */}
          {canViewFinancial ? (
            <FinancialPerformanceBlock
              data={dashboardData.financial}
              onNavigateToFinancial={() => onNavigate('financeiro')}
            />
          ) : (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Acesso ao módulo Financeiro restrito às suas permissões.
            </div>
          )}

          {/* SEÇÃO 7 — ALERTAS GERENCIAIS & DIAGNÓSTICO ACIONÁVEL */}
          <ManagerialAlertsPanel
            alerts={dashboardData.alerts}
            onNavigate={onNavigate}
          />

          {/* OPERAÇÕES RÁPIDAS (Kanban de Conteúdos & Calendário Oficial) */}
          {(canViewContent || canViewCalendar) && (
            <OperationalQuickSection
              data={dashboardData.operational}
              onNavigateToContent={() => onNavigate('conteudos')}
              onNavigateToCalendar={() => onNavigate('calendario')}
            />
          )}

          {/* Rodapé Executivo */}
          <div className="pt-4 pb-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>
                EngenhArq Marketing Intelligence • Versão 2.4 Enterprise
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Atualizado em: <strong className="text-slate-600">{dashboardData.updatedAt}</strong></span>
              <span>•</span>
              <button
                onClick={loadData}
                className="hover:text-slate-700 underline cursor-pointer"
              >
                Atualizar dados agora
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
