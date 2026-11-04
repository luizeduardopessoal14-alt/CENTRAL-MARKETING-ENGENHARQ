import React from 'react';
import { OperationalQuickData } from '../../types/dashboard';
import {
  Kanban,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface OperationalQuickSectionProps {
  data: OperationalQuickData;
  onNavigateToContent: () => void;
  onNavigateToCalendar: () => void;
}

export const OperationalQuickSection: React.FC<OperationalQuickSectionProps> = ({
  data,
  onNavigateToContent,
  onNavigateToCalendar,
}) => {
  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return iso.split('-').reverse().slice(0, 2).join('/');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Visão Operacional & Rotina de Marketing
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Kanban de Conteúdos */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Kanban className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Pautas e Produção de Conteúdo
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Redes Sociais
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Em Produção
                </span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {data.contentInProduction}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-600 block">
                  Em Aprovação
                </span>
                <span className="text-lg font-black text-purple-700 tabular-nums">
                  {data.contentInApproval}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-center">
                <span className="text-[10px] uppercase font-bold text-red-600 block">
                  Atrasados
                </span>
                <span
                  className={`text-lg font-black tabular-nums ${
                    data.contentOverdue > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {data.contentOverdue}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToContent}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#B21010] hover:text-[#8F0D0D] transition-colors cursor-pointer group"
          >
            <span>Ver Quadro Kanban</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card Calendário de Eventos */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Calendário de Reuniões & Lançamentos
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Agenda Oficial
              </span>
            </div>

            <div className="space-y-2.5 my-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Próximo compromisso:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]" title={data.nextEventTitle || ''}>
                  {data.nextEventTitle
                    ? `${data.nextEventTitle} (${formatDate(data.nextEventDate)})`
                    : 'Nenhum agendado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                  <span className="text-blue-700 font-medium text-[11px]">Reuniões (Semana):</span>
                  <span className="font-bold text-blue-900 tabular-nums">{data.meetingsThisWeek}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                  <span className="text-amber-700 font-medium text-[11px]">Eventos (Mês):</span>
                  <span className="font-bold text-amber-900 tabular-nums">{data.eventsThisMonth}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToCalendar}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#B21010] hover:text-[#8F0D0D] transition-colors cursor-pointer group"
          >
            <span>Ver Calendário Completo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
