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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#373535]">
              Inteligência de Mídia & Custo de Aquisição (CAC / CPL)
            </h3>
            <p className="text-xs text-gray-400">
              Cruzamento analítico do investimento de anúncios com resultados convertidos no CVCRM
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToMedia}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DE3A39] hover:text-red-700 transition-colors cursor-pointer group"
        >
          <span>Abrir Mídia e Campanhas</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid de 4 Cards de Eficiência Cruzada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Investimento Total em Tráfego */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Verba de Anúncios Alocada
              </span>
              <div className="p-1.5 rounded-lg bg-gray-50 text-gray-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#373535]">
              {formatCurrency(data.totalSpend)}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Base financeira oficial da categoria Mídia Paga
          </p>
        </div>

        {/* Card 2: CPL Real */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                CPL Real (Mídia / CVCRM)
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600">
              {formatCurrency(data.cplReal)}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Custo efetivo por lead registrado na esteira
          </p>
        </div>

        {/* Card 3: Custo por Reserva */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Custo por Reserva de Imóvel
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-700">
              {formatCurrency(data.costPerReservation)}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Investimento proporcional por pasta reservada
          </p>
        </div>

        {/* Card 4: CAC de Venda */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                CAC Real (Custo por Contrato)
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-amber-700">
              {formatCurrency(data.costPerSale)}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Custo total de marketing por venda fechada
          </p>
        </div>
      </div>
    </div>
  );
};
