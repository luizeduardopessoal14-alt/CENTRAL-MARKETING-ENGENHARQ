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
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Em Aberto (Geral)
          </span>
          <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-[#373535]">
            {isLoading ? '...' : formatCurrency(totals.totalOpen)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Total de cobranças ativas não pagas
          </p>
        </div>
      </div>

      {/* 2. Sem Previsão (Subconjunto) */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Sem Previsão
          </span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-amber-700">
            {isLoading ? '...' : formatCurrency(totals.totalNoForecast)}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-0.5">
            A encaminhar ou aguardando retorno
          </p>
        </div>
      </div>

      {/* 3. Previstos para a Semana */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Previstos p/ a Semana
          </span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-blue-800">
            {isLoading ? '...' : formatCurrency(totals.totalWeekForecast)}
          </div>
          <p className="text-[11px] text-blue-500 mt-0.5">
            Previsão do Sienge para esta semana
          </p>
        </div>
      </div>

      {/* 4. Pagos no Mês */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Pagos no Mês
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-emerald-700">
            {isLoading ? '...' : formatCurrency(totals.totalPaidMonth)}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">
            Confirmados manualmente no Sienge
          </p>
        </div>
      </div>
    </div>
  );
};

