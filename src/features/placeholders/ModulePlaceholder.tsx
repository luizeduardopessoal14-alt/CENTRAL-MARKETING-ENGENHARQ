import React from 'react';
import { AppArea } from '../../types/auth';
import { Wrench, ArrowLeft, ShieldAlert } from 'lucide-react';

interface ModulePlaceholderProps {
  area: AppArea;
  title: string;
  stepNumber: number;
  description: string;
  onBack: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  stepNumber,
  description,
  onBack,
}) => {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto animate-fadeIn">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#B21010] mb-6 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Voltar para a Visão Geral</span>
      </button>

      <div className="bg-white rounded-3xl p-10 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDF2F2] border border-red-100 flex items-center justify-center text-[#B21010]">
          <Wrench className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 mb-2">
            Etapa {stepNumber} do Projeto
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="pt-4 max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Base de banco de dados, login e regras de permissão da <strong>Etapa 1</strong> já estão concluídas e ativas para este módulo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
