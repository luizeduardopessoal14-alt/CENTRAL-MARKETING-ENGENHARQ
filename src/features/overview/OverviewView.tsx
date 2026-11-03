import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import { FinancialTotals } from '../../types/financeiro';
import { financialService } from '../../services/financialService';
import { contentService } from '../../services/contentService';
import { calendarService } from '../../services/calendarService';
import { calculateDueDateAlert } from '../../types/conteudos';
import { CalendarOverviewMetrics } from '../../types/calendario';
import {
  DollarSign,
  Kanban,
  Calendar,
  Megaphone,
  Building2,
  ArrowRight,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (tab: AppArea) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { hasAccess } = useAuth();
  const [financialTotals, setFinancialTotals] = useState<FinancialTotals>({
    totalOpen: 0,
    totalNoForecast: 0,
    totalWeekForecast: 0,
    totalPaidMonth: 0,
    countConsultFinance: 0,
  });

  const [contentTotals, setContentTotals] = useState({
    inProduction: 0,
    inApproval: 0,
    overdueCount: 0,
  });

  const [calendarMetrics, setCalendarMetrics] = useState<CalendarOverviewMetrics>({
    nextEvents: [],
    meetingsThisWeekCount: 0,
    eventsThisMonthCount: 0,
  });

  useEffect(() => {
    if (hasAccess('financeiro', 'consulta')) {
      financialService
        .getTotals()
        .then(setFinancialTotals)
        .catch((err) => console.error('Erro ao buscar totais financeiros na visão geral:', err));
    }

    if (hasAccess('conteudos', 'consulta')) {
      contentService.fetchCards().then((res) => {
        if (res.data) {
          let inProduction = 0;
          let inApproval = 0;
          let overdueCount = 0;

          res.data.forEach((card) => {
            if (card.column_status === 'em_producao') inProduction++;
            if (card.column_status === 'em_aprovacao') inApproval++;
            const alert = calculateDueDateAlert(card.due_date, card.column_status);
            if (alert.type === 'atrasado') overdueCount++;
          });

          setContentTotals({ inProduction, inApproval, overdueCount });
        }
      });
    }

    if (hasAccess('calendario', 'consulta')) {
      calendarService.getOverviewMetrics().then(setCalendarMetrics);
    }
  }, [hasAccess]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Banner de Boas-vindas */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#DE3A39]">
            Painel Executivo
          </span>
          <h2 className="text-2xl font-bold text-[#373535] mt-0.5">
            Central de Marketing EngenhArq
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento centralizado de despesas, pautas, eventos e resultados da construtora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
            Fuso: <strong>São Paulo (BRT)</strong>
          </div>
        </div>
      </div>

      {/* Grid de Cards Resumo (Mostra apenas áreas com acesso) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Financeiro */}
        {hasAccess('financeiro') && (
          <div
            onClick={() => onNavigate('financeiro')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Financeiro
                </span>
                <div className="p-2 bg-red-50 text-[#DE3A39] rounded-lg group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Em aberto (geral):</span>
                  <span className="text-sm font-bold text-[#373535]">
                    {formatCurrency(financialTotals.totalOpen)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Sem previsão:</span>
                  <span className="text-xs font-semibold text-amber-600">
                    {formatCurrency(financialTotals.totalNoForecast)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Pago no mês:</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {formatCurrency(financialTotals.totalPaidMonth)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Abrir Financeiro</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Conteúdos (Kanban) */}
        {hasAccess('conteudos') && (
          <div
            onClick={() => onNavigate('conteudos')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Conteúdos (Redes Sociais)
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Kanban className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Em produção:</span>
                  <span className="text-sm font-bold text-[#373535]">
                    {contentTotals.inProduction}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Em aprovação (Flávia):</span>
                  <span className="text-xs font-semibold text-purple-600">
                    {contentTotals.inApproval}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Alertas de atraso:</span>
                  <span
                    className={`text-xs font-semibold ${
                      contentTotals.overdueCount > 0
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {contentTotals.overdueCount > 0
                      ? `${contentTotals.overdueCount} atrasado(s)`
                      : 'Nenhum atrasado'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Abrir Quadro de Conteúdos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Calendário Geral */}
        {hasAccess('calendario') && (
          <div
            onClick={() => onNavigate('calendario')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Calendário Geral
                </span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Próximo compromisso:</span>
                  <span className="text-xs font-bold text-[#373535] truncate max-w-[170px]" title={calendarMetrics.nextEvents[0]?.title}>
                    {calendarMetrics.nextEvents.length > 0
                      ? `${calendarMetrics.nextEvents[0].title} (${calendarMetrics.nextEvents[0].event_date.split('-').reverse().slice(0, 2).join('/')})`
                      : 'Nenhum agendado'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Reuniões esta semana:</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {calendarMetrics.meetingsThisWeekCount}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Eventos no mês:</span>
                  <span className="text-xs font-semibold text-[#DE3A39]">
                    {calendarMetrics.eventsThisMonthCount}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Abrir Calendário</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Mídia e Campanhas */}
        {hasAccess('midia') && (
          <div
            onClick={() => onNavigate('midia')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Mídia & Campanhas
                </span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Investimento (Meta):</span>
                  <span className="text-xs font-medium text-gray-400">Sem conexão</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Cadastros gerados:</span>
                  <span className="text-xs font-medium text-gray-400">Dados indisponíveis</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Custo por lead (CPL):</span>
                  <span className="text-xs font-medium text-gray-400">-</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Ver Campanhas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Leads e Imobiliárias */}
        {hasAccess('imobiliarias') && (
          <div
            onClick={() => onNavigate('imobiliarias')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Leads & Imobiliárias
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Integração CVCRM:</span>
                  <span className="text-xs font-medium text-gray-400">Aguardando etapa</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Leads distribuídos:</span>
                  <span className="text-xs font-medium text-gray-400">-</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Conversão em vendas:</span>
                  <span className="text-xs font-medium text-gray-400">-</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Ver Imobiliárias</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
