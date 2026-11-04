import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ChannelPerformanceItem } from '../../types/dashboard';
import { Megaphone, ExternalLink } from 'lucide-react';

interface LeadOriginAnalyticsProps {
  channels: ChannelPerformanceItem[];
  onNavigateToMedia?: () => void;
}

export const LeadOriginAnalytics: React.FC<LeadOriginAnalyticsProps> = ({ channels, onNavigateToMedia }) => {
  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR').format(val);

  // Tooltip customizado para o Donut
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-dropdown border border-slate-800 text-xs">
          <p className="font-bold text-slate-200">{p.name}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-white tabular-nums">
              {formatNumber(p.value)} leads
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              ({p.payload.sharePercent}%)
            </span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
            <div>Qualificados: <strong className="text-slate-200">{p.payload.qualificationRate}%</strong></div>
            <div>Conversão em vendas: <strong className="text-emerald-400">{p.payload.conversionRate}%</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalLeads = channels.reduce((acc, cur) => acc + cur.count, 0);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Topo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Origem & Canais de Aquisição
              </h3>
              <p className="text-xs text-slate-400">
                Participação de mídia paga, orgânico e conversão por canal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
              Total: {formatNumber(totalLeads)} leads
            </span>
            {onNavigateToMedia && (
              <button
                onClick={onNavigateToMedia}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#B21010] transition-colors cursor-pointer"
                title="Acessar Módulo de Mídia"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gráfico Donut de Canais */}
        <div className="h-44 w-full relative flex items-center justify-center">
          {channels.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">Nenhum canal no período</div>
          )}
        </div>

        {/* Lista Analítica de Canais */}
        <div className="mt-4 space-y-2">
          {channels.map((ch) => (
            <div
              key={ch.channel}
              className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-[200px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  <span className="font-bold text-slate-800 truncate">
                    {ch.channel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatNumber(ch.count)} leads
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded tabular-nums">
                    {ch.sharePercent}%
                  </span>
                </div>
              </div>

              {/* Métricas do Canal */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pl-4.5 pt-0.5 border-t border-slate-200/40">
                <span>
                  Qualificação: <strong className="text-slate-700">{ch.qualificationRate}%</strong> ({ch.qualifiedCount})
                </span>
                <span>
                  Vendas: <strong className="text-emerald-700">{ch.salesCount}</strong> ({ch.conversionRate}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
        Canais mapeados automaticamente a partir dos metadados de mídia do CVCRM
      </div>
    </div>
  );
};
