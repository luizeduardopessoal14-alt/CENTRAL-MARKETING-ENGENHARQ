import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  DollarSign,
  Clock,
  AlertCircle,
  ChevronRight,
  PieChart as PieIcon,
  Calendar,
  Building,
} from 'lucide-react';
import { FinancialAnalyticsData } from '../../types/dashboard';

interface FinancialPerformanceBlockProps {
  data: FinancialAnalyticsData;
  onNavigateToFinancial: () => void;
}

const fmtCurrency = (val: number): string =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtCompactCurrency = (val: number): string => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toFixed(0)}`;
};

export const FinancialPerformanceBlock: React.FC<FinancialPerformanceBlockProps> = ({
  data,
  onNavigateToFinancial,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const grandTotal = data.totalPaid + data.totalCommitted + data.totalNoForecast;
  const paidPercent = grandTotal > 0 ? ((data.totalPaid / grandTotal) * 100).toFixed(1) : '0';
  const committedPercent = grandTotal > 0 ? ((data.totalCommitted / grandTotal) * 100).toFixed(1) : '0';
  const noForecastPercent = grandTotal > 0 ? ((data.totalNoForecast / grandTotal) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-6">
      {/* Cabeçalho */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
              <DollarSign className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B21010]">
              Seção 06 • Inteligência Financeira
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Performance Financeira & Orçamento de Marketing
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Despesas realizadas, valores previstos e acompanhamento orçamentário integrado ao Sienge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToFinancial}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <span>Gerenciar Despesas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Realizado / Pago */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Despesas Realizadas
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1.5 tabular-nums">
            {fmtCurrency(data.totalPaid)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-bold">{paidPercent}%</span>
            <span>do orçamento consolidado</span>
          </div>
        </div>

        {/* Valores Previstos / Comprometidos */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Valores Previstos
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1.5 tabular-nums">
            {fmtCurrency(data.totalCommitted)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <Clock className="w-3 h-3 text-amber-600" />
            <span className="text-amber-700 font-bold">{committedPercent}%</span>
            <span>comprometido c/ data</span>
          </div>
        </div>

        {/* Sem Previsão / Encaminhado */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Aguardando Previsão
            </span>
            <span className="w-2 h-2 rounded-full bg-[#B21010]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1.5 tabular-nums">
            {fmtCurrency(data.totalNoForecast)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <AlertCircle className="w-3 h-3 text-[#B21010]" />
            <span className="text-red-700 font-bold">{noForecastPercent}%</span>
            <span>encaminhado s/ vencimento</span>
          </div>
        </div>

        {/* Total Consolidado */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Registrado
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1.5 tabular-nums">
            {fmtCurrency(grandTotal)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <span>{data.totalRecordsCount} lançamentos</span>
            <span className="text-slate-400">({data.paidRecordsCount} pagos)</span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Liquidez / Status */}
      <div className="px-5 sm:px-6">
        <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Composição do Fluxo de Caixa</span>
            <span className="text-slate-500 text-[11px]">Sincronização Sienge</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${paidPercent}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Pago: ${paidPercent}%`}
            />
            <div
              style={{ width: `${committedPercent}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Previsto: ${committedPercent}%`}
            />
            <div
              style={{ width: `${noForecastPercent}%` }}
              className="bg-[#B21010] transition-all duration-500"
              title={`Sem Previsão: ${noForecastPercent}%`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Realizado ({paidPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Previsto ({committedPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B21010]" />
              Sem Previsão ({noForecastPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos Principais: Evolução Mensal + Distribuição por Categoria */}
      <div className="px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução Mensal (BarChart Recharts) */}
        <div className="lg:col-span-7 bg-slate-50/40 p-4 sm:p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  Evolução Mensal de Despesas
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Pago vs. Previsto
              </span>
            </div>

            <div className="h-64 w-full">
              {data.monthlyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sem dados para a série temporal mensal.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthlyTrend}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="monthLabel"
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtCompactCurrency}
                      tick={{ fontSize: 10, fill: '#64748B' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pago = Number(payload.find((p) => p.dataKey === 'pago')?.value || 0);
                        const previsto = Number(payload.find((p) => p.dataKey === 'previsto')?.value || 0);
                        const total = pago + previsto;

                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[160px]">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                              {label}
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                              <span>Realizado (Pago):</span>
                              <strong className="tabular-nums">{fmtCurrency(pago)}</strong>
                            </div>
                            <div className="flex justify-between items-center text-amber-300">
                              <span>Previsto:</span>
                              <strong className="tabular-nums">{fmtCurrency(previsto)}</strong>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-300 font-bold">
                              <span>Total:</span>
                              <strong className="tabular-nums">{fmtCurrency(total)}</strong>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="pago"
                      name="Realizado"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="previsto"
                      name="Previsto"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Realizado / Pago
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              Comprometido / Previsto
            </span>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Categoria (Donut Recharts + Lista) */}
        <div className="lg:col-span-5 bg-slate-50/40 p-4 sm:p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  Despesas por Categoria
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {data.categoryBreakdown.length} categorias
              </span>
            </div>

            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <div className="font-bold">{d.category}</div>
                          <div className="text-emerald-400 font-semibold">{fmtCurrency(d.total)}</div>
                          <div className="text-slate-400 text-[10px]">{d.percentage}% do total • {d.count} lançamentos</div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="total"
                    onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeCategoryIndex === null || activeCategoryIndex === index ? 1 : 0.4}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Realizado
                </span>
                <span className="text-xs font-black text-slate-900">
                  {fmtCompactCurrency(data.totalPaid)}
                </span>
              </div>
            </div>

            {/* Lista de Categorias com cores */}
            <div className="space-y-1.5 mt-3 max-h-40 overflow-y-auto pr-1">
              {data.categoryBreakdown.map((cat, idx) => (
                <div
                  key={cat.category}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  onMouseLeave={() => setActiveCategoryIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-default ${
                    activeCategoryIndex === idx ? 'bg-slate-100' : 'hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-slate-700 font-medium">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-slate-900 tabular-nums">
                      {fmtCurrency(cat.total)}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Fornecedores / Favorecidos */}
      {data.topSuppliers && data.topSuppliers.length > 0 && (
        <div className="px-5 sm:px-6 pb-6">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Maiores Fornecedores & Favorecidos
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Top {data.topSuppliers.length} no período
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.topSuppliers.map((supplier) => (
                <div
                  key={supplier.supplier}
                  className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-1"
                >
                  <div className="text-xs font-bold text-slate-900 truncate" title={supplier.supplier}>
                    {supplier.supplier}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-700 tabular-nums">
                      {fmtCurrency(supplier.total)}
                    </span>
                    <span className="text-slate-400">
                      {supplier.count} {supplier.count === 1 ? 'doc' : 'docs'} ({supplier.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
