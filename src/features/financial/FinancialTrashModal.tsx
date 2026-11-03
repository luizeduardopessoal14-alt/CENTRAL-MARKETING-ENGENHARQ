import React, { useEffect, useState, useCallback } from 'react';
import { FinancialRecord } from '../../types/financeiro';
import { financialService } from '../../services/financialService';
import { X, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface FinancialTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const FinancialTrashModal: React.FC<FinancialTrashModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [trashRecords, setTrashRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await financialService.getRecords({ showTrash: true });
      setTrashRecords(records);
    } catch (err) {
      console.error('Erro ao carregar lixeira:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTrash();
    }
  }, [isOpen, loadTrash]);

  if (!isOpen) return null;

  const handleRestore = async (r: FinancialRecord) => {
    try {
      await financialService.restoreRecord(r.id);
      onSuccess(`Cobrança de ${r.supplier} restaurada com sucesso!`);
      await loadTrash();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao restaurar.');
    }
  };

  const handlePermanentDelete = async (r: FinancialRecord) => {
    if (
      !window.confirm(
        `ATENÇÃO: Deseja apagar definitivamente a cobrança de "${r.supplier}" (${r.description})? Esta ação é irreversível!`
      )
    ) {
      return;
    }

    try {
      await financialService.permanentDeleteRecord(r.id);
      onSuccess('Registro excluído definitivamente.');
      await loadTrash();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir definitivamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-bold text-[#373535]">Lixeira do Financeiro</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Carregando registros excluídos...
            </div>
          ) : trashRecords.length === 0 ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
              A lixeira está vazia. Nenhum registro excluído.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {trashRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-[#373535]">{r.supplier}</div>
                    <div className="text-xs text-gray-500 truncate">{r.description}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} &bull;{' '}
                      Excluído em:{' '}
                      {r.deleted_at
                        ? new Date(r.deleted_at).toLocaleDateString('pt-BR', {
                            timeZone: 'America/Sao_Paulo',
                          })
                        : '-'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Excluir Definitivo</span>
                    </button>
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

