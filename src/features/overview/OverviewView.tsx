import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import { DashboardPeriodMode, DashboardFullData } from '../../types/dashboard';
import { dashboardAnalyticsService } from '../../services/dashboardAnalyticsService';
import { DashboardFilters } from './DashboardFilters';
import { DashboardKpiCards } from './DashboardKpiCards';
import { FinancialAnalyticsSection } from './FinancialAnalyticsSection';
import { LeadsAnalyticsSection } from './LeadsAnalyticsSection';
import { MediaEfficiencySection } from './MediaEfficiencySection';
import { OperationalQuickSection } from './OperationalQuickSection';
import { AlertCircle } from 'lucide-react';

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

  // Carregar dados
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
      console.error('Erro ao carregar métricas do dashboard:', err);
      setError('Falha ao processar dados do painel analítico.');
    } finally {
      setIsLoading(false);
    }
  }, [periodMode, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Banner de Cabeçalho Executivo */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B21010] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#B21010]">
              Painel Analítico Executivo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Central de Marketing <span className="text-[#B21010]">in Control</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Indicadores de performance financeira, esteiras de leads do CVCRM e eficiência de campanhas em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
            Fuso: <strong>São Paulo (BRT)</strong>
          </div>
        </div>
      </div>

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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-[#B21010] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado de Carregamento com Esqueleto */}
      {isLoading && !dashboardData ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-slate-100 rounded-2xl" />
            <div className="h-72 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      ) : dashboardData ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Faixa Superior: 5 KPI Cards Estilo Power BI */}
          <DashboardKpiCards
            financial={dashboardData.financial}
            leads={dashboardData.leads}
            media={dashboardData.media}
          />

          {/* Bloco 1: Performance Financeira Analítica */}
          {canViewFinancial ? (
            <FinancialAnalyticsSection
              data={dashboardData.financial}
              onNavigateToFinancial={() => onNavigate('financeiro')}
            />
          ) : (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Módulo Financeiro restrito às suas permissões de acesso.
            </div>
          )}

          {/* Bloco 2: Leads & Funil Comercial do CVCRM (Fila TOP 5) */}
          {canViewLeads ? (
            <LeadsAnalyticsSection
              data={dashboardData.leads}
              onNavigateToLeads={() => onNavigate('imobiliarias')}
            />
          ) : (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              Módulo de Leads e Imobiliárias restrito às suas permissões de acesso.
            </div>
          )}

          {/* Bloco 3: Eficiência de Mídia e Custo de Aquisição (CPL / CAC) */}
          {canViewMedia && (
            <MediaEfficiencySection
              data={dashboardData.media}
              onNavigateToMedia={() => onNavigate('midia')}
            />
          )}

          {/* Bloco 4: Visão Operacional (Pautas de Conteúdo & Calendário Oficial) */}
          {(canViewContent || canViewCalendar) && (
            <OperationalQuickSection
              data={dashboardData.operational}
              onNavigateToContent={() => onNavigate('conteudos')}
              onNavigateToCalendar={() => onNavigate('calendario')}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};
