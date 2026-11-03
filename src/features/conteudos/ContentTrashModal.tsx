import React, { useState, useEffect } from 'react';
import { ContentCard, KANBAN_COLUMNS } from '../../types/conteudos';
import { contentService } from '../../services/contentService';
import { Trash2, RotateCcw, X } from 'lucide-react';

interface ContentTrashModalProps {
  isOpen: boolean;
  isSuperadmin: boolean;
  onClose: () => void;
  onCardRestored: () => void;
}

export const ContentTrashModal: React.FC<ContentTrashModalProps> = ({
  isOpen,
  isSuperadmin,
  onClose,
  onCardRestored,
}) => {
  const [deletedCards, setDeletedCards] = useState<ContentCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadDeleted = async () => {
    setIsLoading(true);
    const res = await contentService.fetchDeletedCards();
    setDeletedCards(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadDeleted();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    setActionLoadingId(id);
    const res = await contentService.restoreCard(id);
    setActionLoadingId(null);
    if (res.success) {
      loadDeleted();
      onCardRestored();
    } else {
      alert(res.error || 'Erro ao restaurar conteúdo.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Deseja excluir definitivamente este conteúdo? Esta ação não pode ser desfeita.')) {
      return;
    }
    setActionLoadingId(id);
    const res = await contentService.permanentDeleteCard(id);
    setActionLoadingId(null);
    if (res.success) {
      loadDeleted();
    } else {
      alert(res.error || 'Erro ao excluir permanentemente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Topo */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373535]">Lixeira de Conteúdos</h3>
              <p className="text-[11px] text-gray-500">
                Itens excluídos podem ser restaurados ou removidos definitivamente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Carregando itens da lixeira...
            </div>
          ) : deletedCards.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Trash2 className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">A lixeira está vazia.</p>
              <p className="text-[11px] text-gray-400">
                Nenhum cartão de conteúdo foi enviado para exclusão.
              </p>
            </div>
          ) : (
            deletedCards.map((card) => {
              const colTitle = KANBAN_COLUMNS.find((c) => c.id === card.column_status)?.title;
              return (
                <div
                  key={card.id}
                  className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#373535] truncate">
                        {card.title || card.description.slice(0, 50)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-medium">
                        {colTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                      {card.description}
                    </p>
                    <div className="text-[10px] text-gray-400 mt-1.5">
                      Responsável: {card.assigned_name || 'Não atribuído'} &bull; Excluído em:{' '}
                      {card.deleted_at ? new Date(card.deleted_at).toLocaleString('pt-BR') : '-'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={actionLoadingId === card.id}
                      onClick={() => handleRestore(card.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Restaurar</span>
                    </button>

                    {isSuperadmin && (
                      <button
                        type="button"
                        disabled={actionLoadingId === card.id}
                        onClick={() => handlePermanentDelete(card.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Excluir definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
          <span>{deletedCards.length} item(ns) na lixeira</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

