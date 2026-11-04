import React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { KpiCardDetail } from '../../types/dashboard';
import {
  DollarSign,
  Users,
  Target,
  FileCheck,
  Award,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
} from 'lucide-react';

interface ExecutiveKpiGridProps {
  kpis: {
    investedTotal: KpiCardDetail;
    leadsReceived: KpiCardDetail;
    cplReal: KpiCardDetail;
    leadsQualified: KpiCardDetail;
    reservas: KpiCardDetail;
    vendas: KpiCardDetail;
    conversionRate: KpiCardDetail;
    cacReal: KpiCardDetail;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  investedTotal: DollarSign,
  leadsReceived: Users,
  cplReal: Target,
  leadsQualified: Layers,
  reservas: FileCheck,
  vendas: Award,
  conversionRate: TrendingUp,
  cacReal: DollarSign,
};

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({ kpis }) => {
  const kpiList = Object.values(kpis);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpiList.map((card) => {
        const IconComponent = iconMap[card.id] || TrendingUp;
        const hasSparkline = card.sparkline && card.sparkline.length > 2;

        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group relative"
          >
            {/* Topo do Card: Título, Ícone e Tooltip */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate max-w-[180px]">
                  {card.title}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Tooltip Nativo Acessível */}
                  <div className="relative group/tip cursor-help">
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors" />
                    <div className="absolute right-0 bottom-full mb-1.5 w-52 p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-dropdown z-50 pointer-events-none leading-relaxed">
                      {card.tooltip}
                    </div>
                  </div>

                  {/* Ícone */}
                  <div
                    className="p-1.5 rounded-xl transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${card.accentColor}12`,
                      color: card.accentColor,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Big Number */}
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                  {card.formattedValue}
                </span>
                {card.unit && (
                  <span className="text-xs font-semibold text-slate-400">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Subtítulo / Contexto */}
              <p className="text-[11px] text-slate-400 font-medium">
                {card.subtitle}
              </p>
            </div>

            {/* Micro Sparkline (quando houver dados suficientes) */}
            {hasSparkline && (
              <div className="h-9 w-full my-1.5 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.sparkline}>
                    <defs>
                      <linearGradient id={`grad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.accentColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={card.accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={card.accentColor}
                      strokeWidth={1.8}
                      fill={`url(#grad-${card.id})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rodapé: Variação Delta ou Meta */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
              {card.deltaPercent !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    card.deltaPercent >= 0
                      ? card.deltaType === 'positive'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                      : card.deltaType === 'positive'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                  title="Variação vs período anterior equivalente"
                >
                  {card.deltaPercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(card.deltaPercent).toFixed(1)}% vs anterior
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  Período ativo
                </span>
              )}

              {card.targetDescription && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {card.targetDescription}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
