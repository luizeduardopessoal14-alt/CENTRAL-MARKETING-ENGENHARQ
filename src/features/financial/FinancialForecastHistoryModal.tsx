import React, { useEffect, useState } from 'react';
import {
  FinancialRecord,
  FinancialForecastHistory,
} from '../../types/financeiro';
import { financialService } from '../../services/financialService';
import { X, History, ArrowRight } from 'lucide-react';

interface FinancialForecastHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinancialRecord | null;
}

export const FinancialForecastHistoryModal: React.FC<FinancialForecastHistoryModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [history, setHistory] = useState<FinancialForecastHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (record && isOpen) {
      setIsLoading(true);
      financialService
        .getForecastHistory(record.id)
        .then(setHistory)
        .catch((err) => console.error('Erro ao buscar histórico:', err))
        .finally(() => setIsLoading(false));
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const formatDate = (d?: string | null) => {
    if (!d) return 'Sem previsão anterior';
    const [year, month, day] = d.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-bold text-[#373535]">Histórico de Previsões</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900">{record.supplier}</h4>
            <p className="text-xs text-gray-500 truncate">{record.description}</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Carregando histórico...
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
              Nenhuma alteração de previsão registrada para esta cobrança.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-medium">
                    <div className="flex items-center gap-1.5 text-[#373535]">
                      <span className="text-gray-400">{formatDate(h.old_forecast_date)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-blue-600">{formatDate(h.new_forecast_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-200/60">
                    <span>Por: <strong className="text-gray-600">{h.changed_by_name}</strong></span>
                    <span>
                      {new Date(h.changed_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

