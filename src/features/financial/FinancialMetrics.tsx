import React from 'react';
import { FinancialTotals } from '../../types/financeiro';
import { DollarSign, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

interface FinancialMetricsProps {
  totals: FinancialTotals;
  isLoading: boolean;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ totals, isLoading }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Em Aberto (Geral) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Em Aberto (Geral)
          </span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {isLoading ? '...' : formatCurrency(totals.totalOpen)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Total de cobranças ativas não pagas
          </p>
        </div>
      </div>

      {/* 2. Sem Previsão (Subconjunto) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Sem Previsão
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-700 tabular-nums">
            {isLoading ? '...' : formatCurrency(totals.totalNoForecast)}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-0.5 font-medium">
            A encaminhar ou aguardando retorno
          </p>
        </div>
      </div>

      {/* 3. Previstos para a Semana */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Previstos p/ a Semana
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-blue-800 tabular-nums">
            {isLoading ? '...' : formatCurrency(totals.totalWeekForecast)}
          </div>
          <p className="text-[11px] text-blue-500 mt-0.5 font-medium">
            Previsão do Sienge para esta semana
          </p>
        </div>
      </div>

      {/* 4. Pagos no Mês */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Pagos no Mês
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-700 tabular-nums">
            {isLoading ? '...' : formatCurrency(totals.totalPaidMonth)}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">
            Confirmados manualmente no Sienge
          </p>
        </div>
      </div>
    </div>
  );
};
