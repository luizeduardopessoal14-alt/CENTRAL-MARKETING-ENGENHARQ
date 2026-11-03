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
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#DE3A39] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para a Visão Geral</span>
      </button>

      <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-[#DE3A39]">
          <Wrench className="w-7 h-7" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mb-2">
            Etapa {stepNumber} do Projeto
          </span>
          <h2 className="text-xl font-bold text-[#373535]">{title}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 max-w-md mx-auto">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Base de banco de dados, login e regras de permissão da <strong>Etapa 1</strong> já estão concluídas e ativas para este módulo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

