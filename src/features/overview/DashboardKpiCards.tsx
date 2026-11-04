import React from 'react';
import {
  DollarSign,
  Users,
  Target,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';
import {
  FinancialAnalyticsData,
  LeadsAnalyticsData,
  MediaCrossAnalyticsData,
} from '../../types/dashboard';

interface DashboardKpiCardsProps {
  financial: FinancialAnalyticsData;
  leads: LeadsAnalyticsData;
  media: MediaCrossAnalyticsData;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  financial,
  leads,
  media,
}) => {
  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR').format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Gasto Total Realizado */}
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Gasto Realizado (Pago)
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-[#DE3A39] group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-[#373535] tracking-tight">
            {formatCurrency(financial.totalPaid)}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
          <span className="text-gray-400 font-medium">
            {financial.paidRecordsCount} despesa(s)
          </span>
          {financial.paidDiffPercent !== null && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                financial.paidDiffPercent > 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
              title="Variação em relação ao período anterior correspondente"
            >
              {financial.paidDiffPercent > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(financial.paidDiffPercent).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Leads da Fila TOP 5 */}
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Leads Recebidos (Fila)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-[#373535] tracking-tight">
            {formatNumber(leads.totalLeads)} <span className="text-sm font-semibold text-gray-400">leads</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
          <span className="text-gray-400 font-medium truncate">
            CVCRM - Fila TOP 5
          </span>
          {leads.leadsDiffPercent !== null && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                leads.leadsDiffPercent >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
              title="Variação de volume em relação ao período anterior"
            >
              {leads.leadsDiffPercent >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(leads.leadsDiffPercent).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Card 3: CPL Real (Mídia x CVCRM) */}
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Custo por Lead Real
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-[#373535] tracking-tight">
            {media.cplReal !== null ? formatCurrency(media.cplReal) : '-'}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
          <span className="text-gray-400 font-medium">
            Mídia: {formatCurrency(media.totalSpend)}
          </span>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            CPL Real
          </span>
        </div>
      </div>

      {/* Card 4: Pastas com Reserva */}
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Pastas com Reserva
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-[#373535] tracking-tight">
            {formatNumber(leads.totalReservas)} <span className="text-sm font-semibold text-gray-400">reservas</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
          <span className="text-gray-400 font-medium">
            Qualificação: {leads.qualificationRate}%
          </span>
          {media.costPerReservation !== null && (
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              {formatCurrency(media.costPerReservation)}/res
            </span>
          )}
        </div>
      </div>

      {/* Card 5: Vendas / Conversão Final */}
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Vendas Concluídas
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-600 tracking-tight flex items-baseline gap-2">
            <span>{formatNumber(leads.totalVendas)}</span>
            <span className="text-xs font-bold text-gray-400">({leads.conversionRate}%)</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-3">
          <span className="text-gray-400 font-medium">
            {media.costPerSale !== null ? `CAC: ${formatCurrency(media.costPerSale)}` : 'Conversão final'}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            Meta: &gt; 2%
          </span>
        </div>
      </div>
    </div>
  );
};
