import React from 'react';
import { MediaCrossAnalyticsData } from '../../types/dashboard';
import {
  Megaphone,
  Target,
  FileCheck,
  Award,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

interface MediaEfficiencySectionProps {
  data: MediaCrossAnalyticsData;
  onNavigateToMedia: () => void;
}

export const MediaEfficiencySection: React.FC<MediaEfficiencySectionProps> = ({
  data,
  onNavigateToMedia,
}) => {
  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Inteligência de Mídia & Custo de Aquisição (CAC / CPL)
            </h3>
            <p className="text-xs text-slate-400">
              Cruzamento analítico do investimento de anúncios com resultados convertidos no CVCRM
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToMedia}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B21010] hover:text-[#8F0D0D] transition-colors cursor-pointer group"
        >
          <span>Abrir Mídia e Campanhas</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid de 4 Cards de Eficiência Cruzada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Investimento Total em Tráfego */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Verba de Anúncios Alocada
              </span>
              <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(data.totalSpend)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Base financeira oficial da categoria Mídia Paga
          </p>
        </div>

        {/* Card 2: CPL Real */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CPL Real (Mídia / CVCRM)
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600 tabular-nums">
              {formatCurrency(data.cplReal)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Custo efetivo por lead registrado na esteira
          </p>
        </div>

        {/* Card 3: Custo por Reserva */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Custo por Reserva de Imóvel
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-700 tabular-nums">
              {formatCurrency(data.costPerReservation)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Investimento proporcional por pasta reservada
          </p>
        </div>

        {/* Card 4: CAC de Venda */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CAC Real (Custo por Contrato)
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(data.costPerSale)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Custo total de marketing por venda fechada
          </p>
        </div>
      </div>
    </div>
  );
};
