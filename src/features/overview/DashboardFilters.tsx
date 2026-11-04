import React from 'react';
import { DashboardPeriodMode } from '../../types/dashboard';
import { Calendar, RefreshCw, Filter, Clock } from 'lucide-react';

interface DashboardFiltersProps {
  periodMode: DashboardPeriodMode;
  onPeriodModeChange: (mode: DashboardPeriodMode) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: string;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  periodMode,
  onPeriodModeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isLoading,
  onRefresh,
  lastUpdated,
}) => {
  const modes: Array<{ id: DashboardPeriodMode; label: string }> = [
    { id: 'este_mes', label: 'Este Mês' },
    { id: 'mes_passado', label: 'Mês Passado' },
    { id: 'ultimos_30', label: 'Últimos 30d' },
    { id: 'ultimos_90', label: 'Últimos 90d' },
    { id: 'ano_atual', label: 'Ano 2026' },
    { id: 'todo_periodo', label: 'Todo o Período' },
    { id: 'personalizado', label: 'Personalizado' },
  ];

  const formatPeriodBadge = () => {
    if (periodMode === 'todo_periodo') return 'Histórico Consolidado Completo';
    if (!startDate && !endDate) return 'Todo o período';
    const fmt = (d: string) => (d ? d.split('-').reverse().join('/') : '');
    return `${fmt(startDate)} até ${fmt(endDate)}`;
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificador de Slicer Power BI */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2F2] text-[#B21010] flex items-center justify-center font-bold">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Segmentador de Dados
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatPeriodBadge()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtro analítico unificado para Financeiro, Leads e Campanhas
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações e Última Atualização */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          {lastUpdated && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              Atualizado às {formatTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            title="Recarregar métricas analíticas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#B21010]' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Slicers de Período (Estilo Power BI Buttons) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        {modes.map((m) => {
          const isActive = periodMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onPeriodModeChange(m.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                isActive
                  ? 'bg-[#B21010] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Seletores de Data para modo Personalizado */}
      {periodMode === 'personalizado' && (
        <div className="pt-2 flex flex-wrap items-center gap-3 p-3 bg-red-50/30 rounded-xl border border-red-100 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B21010]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B21010]"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Defina o intervalo personalizado para recalcular os gráficos.
          </span>
        </div>
      )}
    </div>
  );
};
