import React from 'react';
import { FunnelStageItem } from '../../types/dashboard';
import { Layers, AlertTriangle, CheckCircle2, TrendingDown, ExternalLink } from 'lucide-react';

interface ConversionFunnelInteractiveProps {
  stages: FunnelStageItem[];
  conversionRate?: number;
  qualificationRate?: number;
  onNavigateToCrm?: () => void;
}

export const ConversionFunnelInteractive: React.FC<ConversionFunnelInteractiveProps> = ({
  stages,
  conversionRate,
  qualificationRate,
  onNavigateToCrm,
}) => {
  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR').format(val);

  const topStageCount = stages[0]?.count || 0;
  const lastStageCount = stages[stages.length - 1]?.count || 0;
  const qualifStage = stages.find((s) => s.stageKey === 'atendimento' || s.stageKey === 'visita') || stages[1];

  const calcConversionRate =
    conversionRate !== undefined
      ? conversionRate
      : topStageCount > 0
      ? Math.round((lastStageCount / topStageCount) * 1000) / 10
      : 0;

  const calcQualificationRate =
    qualificationRate !== undefined
      ? qualificationRate
      : topStageCount > 0 && qualifStage
      ? Math.round((qualifStage.count / topStageCount) * 1000) / 10
      : 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Topo */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Funil de Conversão da Esteira CRM
              </h3>
              <p className="text-xs text-slate-400">
                Aproveitamento passo a passo e identificação de evasão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
              Conversão Geral: <strong>{calcConversionRate}%</strong>
            </span>
            {onNavigateToCrm && (
              <button
                onClick={onNavigateToCrm}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                title="Acessar Esteira CRM"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Etapas do Funil com Drop-offs */}
        <div className="space-y-3.5">
          {stages.map((stage, idx) => (
            <div key={stage.stageKey} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 truncate">
                    {stage.stageName}
                  </span>
                  {stage.isBottleneck && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Gargalo Crítico
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-black text-slate-900 tabular-nums">
                    {formatNumber(stage.count)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">leads</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 w-12 text-right tabular-nums">
                    {stage.percentageFromTop}%
                  </span>
                </div>
              </div>

              {/* Barra do Funil */}
              <div className="h-3 w-full bg-slate-100 rounded-lg overflow-hidden p-0.5 flex">
                <div
                  className="h-full rounded-md transition-all duration-700"
                  style={{
                    width: `${Math.max(3, stage.percentageFromTop)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>

              {/* Indicador de Drop-off (Perda em relação à etapa anterior) */}
              {idx > 0 && stage.dropOffPercent > 0 && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-6 pr-1 font-medium">
                  <span className="flex items-center gap-1 text-slate-400">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    Perda na transição: <strong className="text-slate-600">-{stage.dropOffPercent}%</strong> ({stage.dropOffCount} leads não avançaram)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumo da Eficiência do Funil */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Qualificação da Esteira:</strong> {calcQualificationRate}% dos contatos entram em negociação ativa.
          </span>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Mapeamento em tempo real do CVCRM
        </span>
      </div>
    </div>
  );
};
