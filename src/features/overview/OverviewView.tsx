import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import { FinancialTotals } from '../../types/financeiro';
import { financialService } from '../../services/financialService';
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

  useEffect(() => {
    if (hasAccess('financeiro', 'consulta')) {
      financialService
        .getTotals()
        .then(setFinancialTotals)
        .catch((err) => console.error('Erro ao buscar totais financeiros na visão geral:', err));
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
                  <span className="text-sm font-bold text-[#373535]">0</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Em aprovação (Flávia):</span>
                  <span className="text-xs font-semibold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Alertas de atraso:</span>
                  <span className="text-xs font-semibold text-emerald-600">Nenhum atrasado</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Abrir Kanban</span>
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
                  Agenda Geral
                </span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Próximos compromissos:</p>
                <div className="p-2.5 rounded-lg bg-gray-50 text-xs text-gray-500 text-center">
                  Nenhuma reunião ou evento agendado para hoje.
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Ver Calendário</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Mídia e Campanhas (Meta) */}
        {hasAccess('midia') && (
          <div
            onClick={() => onNavigate('midia')}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Mídia & Anúncios Meta
                </span>
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Status da conexão:</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    Aguardando Etapa 5
                  </span>
                </div>
                <p className="text-xs text-gray-400 italic">
                  Integração com Instagram e Meta Ads será configurada no módulo dedicado.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#DE3A39]">
              <span>Ver Mídia</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card: Leads e Imobiliárias (CVCRM) */}
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
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Integração CVCRM:</span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                    Aguardando Etapa 6
                  </span>
                </div>
                <p className="text-xs text-gray-400 italic">
                  Distribuição de leads e conversão de imobiliárias parceiras.
                </p>
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
