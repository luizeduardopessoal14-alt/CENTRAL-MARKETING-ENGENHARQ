import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  Info,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { AppArea } from '../../types/auth';
import { ManagerialAlertItem } from '../../types/dashboard';

interface ManagerialAlertsPanelProps {
  alerts: ManagerialAlertItem[];
  onNavigate: (tab: AppArea) => void;
}

type SeverityFilter = 'all' | 'priority' | 'opportunity';

export const ManagerialAlertsPanel: React.FC<ManagerialAlertsPanelProps> = ({
  alerts,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filteredAlerts = alerts.filter((item) => {
    if (filter === 'priority') return item.severity === 'critico' || item.severity === 'atencao';
    if (filter === 'opportunity') return item.severity === 'oportunidade' || item.severity === 'info';
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critico').length;
  const warningCount = alerts.filter((a) => a.severity === 'atencao').length;
  const opportunityCount = alerts.filter((a) => a.severity === 'oportunidade').length;

  const getSeverityStyle = (severity: ManagerialAlertItem['severity']) => {
    switch (severity) {
      case 'critico':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-[#B21010]" />,
          border: 'border-l-4 border-l-[#B21010] border-slate-200/80',
          badgeBg: 'bg-red-50 text-[#B21010] border-red-200',
          label: 'Crítico',
        };
      case 'atencao':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          border: 'border-l-4 border-l-amber-500 border-slate-200/80',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Atenção',
        };
      case 'oportunidade':
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
          border: 'border-l-4 border-l-emerald-500 border-slate-200/80',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Oportunidade',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-600" />,
          border: 'border-l-4 border-l-blue-500 border-slate-200/80',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Informativo',
        };
    }
  };

  const getCategoryLabel = (cat: ManagerialAlertItem['category']) => {
    switch (cat) {
      case 'financeiro':
        return 'Financeiro / Sienge';
      case 'crm':
        return 'Funil CVCRM';
      case 'imobiliaria':
        return 'Fila TOP 5';
      case 'meta':
        return 'Metas & CPL';
      case 'conteudo':
        return 'Operações & Pautas';
      default:
        return 'Geral';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B21010]">
              Seção 07 • Inteligência Acionável
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Alertas & Diagnósticos Gerenciais
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gargalos operacionais, anomalias e destaques de performance detectados em tempo real nos dados.
          </p>
        </div>

        {/* Filtros de Severidade */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('priority')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === 'priority'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Urgentes</span>
              {(criticalCount + warningCount) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-[#B21010] font-bold">
                  {criticalCount + warningCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('opportunity')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === 'opportunity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Oportunidades</span>
              {opportunityCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {opportunityCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="p-5 sm:p-6 space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Nenhuma ocorrência identificada no filtro selecionado.
            </p>
            <p className="text-[11px] text-slate-400">
              Os processos e fluxos operacionais estão rodando dentro dos limites esperados.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredAlerts.map((alert, idx) => {
              const style = getSeverityStyle(alert.severity);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className={`p-4 rounded-xl bg-white border ${style.border} shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      {style.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${style.badgeBg}`}>
                          {style.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {getCategoryLabel(alert.category)}
                        </span>
                        {alert.metricBadge && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800">
                            {alert.metricBadge}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {alert.targetTab && alert.actionText && (
                    <div className="flex-shrink-0 self-end md:self-center">
                      <button
                        onClick={() => onNavigate(alert.targetTab!)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>{alert.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Rodapé explicativo */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Algoritmo de diagnóstico contínuo sobre bases do Sienge, CVCRM e Meta Ads.</span>
        </div>
        <span className="text-slate-400 hidden sm:inline">
          Sem dados fictícios • Validação em tempo real
        </span>
      </div>
    </div>
  );
};

