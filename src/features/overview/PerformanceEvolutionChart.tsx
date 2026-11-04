import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HeroPerformanceDataPoint } from '../../types/dashboard';
import { TrendingUp } from 'lucide-react';

interface PerformanceEvolutionChartProps {
  data: HeroPerformanceDataPoint[];
}

type MetricTab = 'todos' | 'leads' | 'qualificados' | 'reservas' | 'vendas';

export const PerformanceEvolutionChart: React.FC<PerformanceEvolutionChartProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<MetricTab>('todos');

  // Tooltip customizado dark slate estilo Stripe/Vercel
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-dropdown border border-slate-800 text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-300 flex items-center justify-between">
            <span>Data: {label}</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs: Array<{ id: MetricTab; label: string; color: string }> = [
    { id: 'todos', label: 'Visão Geral (Todos)', color: '#0F172A' },
    { id: 'leads', label: 'Leads Recebidos', color: '#B21010' },
    { id: 'qualificados', label: 'Qualificados', color: '#2563EB' },
    { id: 'reservas', label: 'Reservas', color: '#7C3AED' },
    { id: 'vendas', label: 'Vendas', color: '#059669' },
  ];

  // Métricas de resumo no rodapé
  const totalLeads = data.reduce((acc, cur) => acc + cur.leads, 0);
  const totalQualif = data.reduce((acc, cur) => acc + cur.qualificados, 0);
  const totalReservas = data.reduce((acc, cur) => acc + cur.reservas, 0);
  const totalVendas = data.reduce((acc, cur) => acc + cur.vendas, 0);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Topo: Título e Seletor de Métrica (Tabs estilo Linear) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Evolução de Performance & Ritmo Comercial
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comportamento diário e semanal de atração, qualificação e conversão da fila
          </p>
        </div>

        {/* Tabs de Filtro de Métrica */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gráfico Principal Hero */}
      <div className="h-72 sm:h-80 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="heroGradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B21010" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#B21010" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="heroGradQualif" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="heroGradReservas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="heroGradVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} iconType="circle" />

              {(activeTab === 'todos' || activeTab === 'leads') && (
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads Recebidos"
                  stroke="#B21010"
                  strokeWidth={2}
                  fill="url(#heroGradLeads)"
                />
              )}

              {(activeTab === 'todos' || activeTab === 'qualificados') && (
                <Area
                  type="monotone"
                  dataKey="qualificados"
                  name="Qualificados"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#heroGradQualif)"
                />
              )}

              {(activeTab === 'todos' || activeTab === 'reservas') && (
                <Area
                  type="monotone"
                  dataKey="reservas"
                  name="Reservas"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#heroGradReservas)"
                />
              )}

              {(activeTab === 'todos' || activeTab === 'vendas') && (
                <Area
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas Concluídas"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#heroGradVendas)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Nenhum dado temporal registrado para o intervalo selecionado.
          </div>
        )}
      </div>

      {/* Rodapé com Balanço do Período */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium block">Total Leads Capturados:</span>
          <span className="font-bold text-slate-900 text-sm tabular-nums">{totalLeads} leads</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Total Qualificados:</span>
          <span className="font-bold text-blue-700 text-sm tabular-nums">{totalQualif} qualificados</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Total Reservas Geradas:</span>
          <span className="font-bold text-purple-700 text-sm tabular-nums">{totalReservas} reservas</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Total Vendas Fechadas:</span>
          <span className="font-bold text-emerald-700 text-sm tabular-nums">{totalVendas} contratos</span>
        </div>
      </div>
    </div>
  );
};
