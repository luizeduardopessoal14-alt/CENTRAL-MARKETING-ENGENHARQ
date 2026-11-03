import React, { useState, useEffect } from 'react';
import {
  FinancialRecord,
  getTodaySaoPaulo,
} from '../../types/financeiro';
import { financialService } from '../../services/financialService';
import { X, Send, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface FinancialStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  record: FinancialRecord | null;
}

export const FinancialStatusModal: React.FC<FinancialStatusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const [forwardedDate, setForwardedDate] = useState('');
  const [forecastDate, setForecastDate] = useState('');
  const [actualDate, setActualDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setForwardedDate(record.forwarded_to_finance_date || getTodaySaoPaulo());
      setForecastDate(record.payment_forecast_date || '');
      setActualDate(record.payment_actual_date || getTodaySaoPaulo());
    }
    setErrorMessage(null);
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  // 1. Ação: Registrar envio ao financeiro
  const handleForwardToFinance = async () => {
    if (!forwardedDate) {
      setErrorMessage('Informe a data de encaminhamento ao financeiro.');
      return;
    }
    setIsSubmitting(true);
    try {
      await financialService.updateRecord(record.id, {
        forwarded_to_finance_date: forwardedDate,
      });
      onSuccess('Envio ao financeiro registrado com sucesso! Situação: Aguardando previsão.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar envio.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Ação: Informar / Alterar Previsão do Sienge
  const handleSaveForecast = async () => {
    if (!forecastDate) {
      setErrorMessage('Informe a data de previsão de pagamento.');
      return;
    }
    setIsSubmitting(true);
    try {
      await financialService.updateRecord(record.id, {
        payment_forecast_date: forecastDate,
        // Garante que a data de encaminhamento esteja preenchida
        forwarded_to_finance_date: record.forwarded_to_finance_date || forwardedDate || getTodaySaoPaulo(),
      });
      onSuccess('Previsão de pagamento atualizada! O histórico foi registrado.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar previsão.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Ação: Confirmar Pagamento no Sienge
  const handleConfirmPayment = async () => {
    if (!actualDate) {
      setErrorMessage('Informe a data em que o pagamento foi efetivado.');
      return;
    }
    setIsSubmitting(true);
    try {
      await financialService.updateRecord(record.id, {
        payment_actual_date: actualDate,
      });
      onSuccess('Pagamento confirmado com sucesso! Situação: Pago.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar pagamento.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#373535]">Atualizar Situação & Previsão</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {record.supplier} &bull; R$ {Number(record.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Etapa 1: Enviar ao Financeiro */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <Send className="w-4 h-4 text-amber-600" />
              <span>1. Encaminhamento ao Financeiro</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Registra o envio da nota para o setor financeiro cadastrar no Sienge.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                value={forwardedDate}
                onChange={(e) => setForwardedDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg flex-1"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleForwardToFinance}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Salvar Envio
              </button>
            </div>
          </div>

          {/* Etapa 2: Previsão de Pagamento */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>2. Previsão de Pagamento (Sienge)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Informe a data de previsão passada pelo financeiro. Toda mudança de data é salva no histórico automaticamente.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                value={forecastDate}
                onChange={(e) => setForecastDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg flex-1"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveForecast}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Salvar Previsão
              </button>
            </div>
          </div>

          {/* Etapa 3: Confirmação de Pagamento Efetivo */}
          <div className="p-4 rounded-xl border border-gray-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>3. Confirmar Pagamento Efetuado</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Após confirmar a quitação com o financeiro ou no Sienge, informe a data efetiva para marcar como <strong>Pago</strong>.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg flex-1"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
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
