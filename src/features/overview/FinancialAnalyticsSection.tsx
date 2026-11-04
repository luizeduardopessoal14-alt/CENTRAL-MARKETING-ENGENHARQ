import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FinancialAnalyticsData } from '../../types/dashboard';
import {
  DollarSign,
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  Building,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FinancialAnalyticsSectionProps {
  data: FinancialAnalyticsData;
  onNavigateToFinancial: () => void;
}

export const FinancialAnalyticsSection: React.FC<FinancialAnalyticsSectionProps> = ({
  data,
  onNavigateToFinancial,
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatShortCurrency = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  // Tooltip customizado para o gráfico de evolução
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-xl shadow-lg border border-gray-800 text-xs space-y-1.5">
          <p className="font-bold border-b border-gray-800 pb-1 text-gray-300">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip customizado para o gráfico donut
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-gray-900 text-white p-2.5 rounded-xl shadow-lg border border-gray-800 text-xs">
          <p className="font-bold text-gray-200">{p.name}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-white">
              {formatCurrency(p.value)}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              ({p.payload.percentage}%)
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {p.payload.count} lançamento(s)
          </span>
        </div>
      );
    }
    return null;
  };

  const totalCommittedAndPaid = data.totalPaid + data.totalCommitted;

  return (
    <div className="space-y-6">
      {/* Título da Seção Analítica */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DE3A39] flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#373535]">
              Performance Financeira & Custos de Marketing
            </h3>
            <p className="text-xs text-gray-400">
              Análise de despesas consolidadas, liquidez com o Sienge e centros de custo
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToFinancial}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DE3A39] hover:text-red-700 transition-colors cursor-pointer group"
        >
          <span>Abrir Módulo Financeiro</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid Principal: Gráfico de Evolução + Gráfico Donut de Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Evolução Mensal de Gastos (Ocupa 2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#DE3A39]" />
              <h4 className="text-sm font-bold text-[#373535]">
                Evolução Mensal de Despesas
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              Histórico Pago vs Previsto
            </span>
          </div>

          <div className="h-64 w-full">
            {data.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyTrend}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatShortCurrency}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="pago"
                    name="Pago"
                    fill="#DE3A39"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="previsto"
                    name="Previsto / Aberto"
                    fill="#93C5FD"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Nenhuma despesa registrada para o período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria (Centro de Custo) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-[#373535]">
                Distribuição por Categoria
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              Centro de Custo
            </span>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {data.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400">Sem categorias no período</div>
            )}
          </div>

          {/* Mini legenda com percentuais */}
          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {data.categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between text-xs py-0.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-gray-600 truncate font-medium text-[11px]">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-gray-800 text-[11px]">
                    {formatCurrency(cat.total)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold w-9 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Secundário: Controle de Liquidez/Status + Top Fornecedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controle de Liquidez e Status de Pagamento */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#373535] flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Jornada com o Financeiro
              </h4>
              <span className="text-[11px] font-bold text-gray-400">
                Total: {formatCurrency(totalCommittedAndPaid)}
              </span>
            </div>

            {/* Barra de progresso multi-status */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex mb-4">
              {data.statusBreakdown.map((st) => {
                const pct =
                  totalCommittedAndPaid > 0
                    ? (st.total / totalCommittedAndPaid) * 100
                    : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={st.status}
                    style={{ width: `${pct}%`, backgroundColor: st.color }}
                    title={`${st.label}: ${formatCurrency(st.total)} (${pct.toFixed(1)}%)`}
                    className="h-full transition-all duration-500"
                  />
                );
              })}
            </div>

            {/* Lista dos 4 Status */}
            <div className="space-y-2.5">
              {data.statusBreakdown.map((st) => (
                <div
                  key={st.status}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="font-medium text-gray-700">{st.label}</span>
                    <span className="text-[10px] text-gray-400">({st.count})</span>
                  </div>
                  <span className="font-bold text-[#373535]">
                    {formatCurrency(st.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerta de Contas sem previsão */}
          {data.totalNoForecast > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">Atenção ao fluxo: </span>
                {formatCurrency(data.totalNoForecast)} sem data de previsão informada pelo financeiro.
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Fornecedores com Maior Volume Financeiro (Ocupa 2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-bold text-[#373535]">
                Top Fornecedores por Volume Financeiro
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              Maiores Contas do Período
            </span>
          </div>

          <div className="space-y-3">
            {data.topSuppliers.length > 0 ? (
              data.topSuppliers.map((sup, idx) => (
                <div key={sup.supplier} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 truncate max-w-[260px] sm:max-w-md">
                        {sup.supplier}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({sup.count} doc{sup.count > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#373535]">
                        {formatCurrency(sup.total)}
                      </span>
                      <span className="text-[11px] text-gray-400 font-bold w-10 text-right">
                        {sup.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de volume proporcional */}
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DE3A39] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, sup.percentage * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">
                Nenhum fornecedor registrado no período filtrado.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Classificação gerada a partir das notas fiscais e recibos ativos</span>
            <span className="font-semibold text-gray-600">
              {data.paidRecordsCount} despesa(s) quitada(s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
