import React from 'react';
import { LeadsAnalyticsData } from '../../types/dashboard';
import {
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface LeadsAnalyticsSectionProps {
  data: LeadsAnalyticsData;
  onNavigateToLeads: () => void;
}

export const LeadsAnalyticsSection: React.FC<LeadsAnalyticsSectionProps> = ({
  data,
  onNavigateToLeads,
}) => {
  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR').format(val);

  return (
    <div className="space-y-6">
      {/* Título da Seção Analítica */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Funil Comercial & Desempenho de Imobiliárias (CVCRM)
            </h3>
            <p className="text-xs text-slate-400">
              Fila oficial "DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB" e esteiras reais de conversão
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToLeads}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B21010] hover:text-[#8F0D0D] transition-colors cursor-pointer group"
        >
          <span>Abrir Módulo de Imobiliárias</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid: Funil da Esteira Real + Matriz de Performance das Imobiliárias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Funil de Conversão em Cascata */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Funil da Esteira Comercial CVCRM
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full tabular-nums">
                Conversão Global: {data.conversionRate}%
              </span>
            </div>

            {/* Etapas do Funil */}
            <div className="space-y-3.5">
              {data.funnelStages.map((stage, idx) => (
                <div key={stage.stageKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {stage.stageName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatNumber(stage.count)} leads
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 w-12 text-right tabular-nums">
                        {stage.percentageFromTop}%
                      </span>
                    </div>
                  </div>

                  {/* Barra do Funil */}
                  <div className="h-3 w-full bg-slate-100 rounded-lg overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{
                        width: `${Math.max(4, stage.percentageFromTop)}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-800">
              <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>
                <strong>Taxa de Qualificação:</strong> {data.qualificationRate}% dos leads avançaram para contato ativo ou posterior.
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Matriz de Eficiência das 8 Imobiliárias */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Ranking das Imobiliárias Parceiras
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Fila TOP 5
              </span>
            </div>

            {/* Tabela Matriz */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-2.5 font-bold">Imobiliária</th>
                    <th className="pb-2.5 text-center font-bold">Leads</th>
                    <th className="pb-2.5 text-center font-bold">Reservas</th>
                    <th className="pb-2.5 text-center font-bold">Vendas</th>
                    <th className="pb-2.5 text-right font-bold">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.agencyRankings.map((ag, index) => {
                    return (
                      <tr
                        key={ag.agencyName}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-2.5 font-semibold text-slate-800 flex items-center gap-2 max-w-[160px] truncate">
                          <span className="w-4 h-4 rounded bg-slate-100 text-slate-500 font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="truncate font-medium text-slate-800" title={ag.agencyName}>
                            {ag.agencyName}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {ag.leadsCount}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium tabular-nums">
                            {ag.shareOfLeads}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] tabular-nums">
                            {ag.reservasCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] tabular-nums">
                            {ag.vendasCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-700 tabular-nums">
                          <span
                            className={
                              ag.conversionRate > 0
                                ? 'text-emerald-600 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {ag.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dados sincronizados em tempo real do CVCRM</span>
            <span className="font-semibold text-slate-600">
              {data.agencyRankings.length} imobiliárias monitoradas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
