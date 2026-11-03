import React, { useState, useEffect } from 'react';
import { ContentCard, ContentColumnStatus, KANBAN_COLUMNS, calculateDueDateAlert } from '../../types/conteudos';
import {
  X,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ContentCardModalProps {
  isOpen: boolean;
  card: ContentCard | null;
  targetColumnForPromotion?: ContentColumnStatus | null; // Quando está sendo movido de ideias para execução
  canEdit: boolean;
  users: { id: string; name: string }[];
  onClose: () => void;
  onSave: (cardId: string, updates: Partial<ContentCard>) => Promise<{ success: boolean; error?: string }>;
  onPromoteAndMove?: (
    cardId: string,
    data: { title: string; assigned_to: string; assigned_name: string; due_date: string; column_status: ContentColumnStatus }
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (card: ContentCard) => void;
}

export const ContentCardModal: React.FC<ContentCardModalProps> = ({
  isOpen,
  card,
  targetColumnForPromotion,
  canEdit,
  users,
  onClose,
  onSave,
  onPromoteAndMove,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnStatus, setColumnStatus] = useState<ContentColumnStatus>('ideias');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPromotionMode = Boolean(targetColumnForPromotion && targetColumnForPromotion !== 'ideias');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setColumnStatus(targetColumnForPromotion || card.column_status);
      setAssignedTo(card.assigned_to || '');
      setDueDate(card.due_date || '');
      setError(null);
    }
  }, [card, targetColumnForPromotion]);

  if (!isOpen || !card) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (!cleanDesc) {
      setError('A descrição do conteúdo é obrigatória.');
      return;
    }

    // Validação estrita para execução (qualquer coluna diferente de 'ideias')
    const finalColumn = targetColumnForPromotion || columnStatus;
    if (finalColumn !== 'ideias') {
      if (!cleanTitle) {
        setError('O título é obrigatório para conteúdos em produção.');
        return;
      }
      if (!assignedTo) {
        setError('O responsável é obrigatório para conteúdos em produção.');
        return;
      }
      if (!dueDate) {
        setError('A data de entrega é obrigatória para conteúdos em produção.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedUser = users.find((u) => u.id === assignedTo);
      const assignedName = selectedUser ? selectedUser.name : (assignedTo ? card.assigned_name : null);

      if (isPromotionMode && onPromoteAndMove) {
        const res = await onPromoteAndMove(card.id, {
          title: cleanTitle,
          assigned_to: assignedTo,
          assigned_name: assignedName || 'Responsável',
          due_date: dueDate,
          column_status: targetColumnForPromotion!,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Erro ao promover cartão.');
        }
      } else {
        const res = await onSave(card.id, {
          title: cleanTitle || null,
          description: cleanDesc,
          column_status: finalColumn,
          assigned_to: assignedTo || null,
          assigned_name: assignedName || null,
          due_date: dueDate || null,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Erro ao salvar alterações.');
        }
      }
    } catch {
      setError('Falha ao processar alterações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFromModal = () => {
    if (onDelete && card) {
      onDelete(card);
      onClose();
    }
  };

  const alertInfo = calculateDueDateAlert(card.due_date, card.column_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Topo com Título */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DE3A39] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373535]">
                {isPromotionMode
                  ? 'Definir Dados para Avançar à Produção'
                  : canEdit
                  ? 'Detalhes do Conteúdo'
                  : 'Visualização de Conteúdo'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isPromotionMode
                  ? 'Para avançar a ideia para execução, preencha o título, responsável e prazo'
                  : `Coluna atual: ${KANBAN_COLUMNS.find((c) => c.id === card.column_status)?.title}`}
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

        {/* Formulário com Scroll */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form id="cardForm" onSubmit={handleSubmit} className="space-y-4">
            {isPromotionMode && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Avanço para produção:</span> Conforme a regra da construtora, ideias só entram no fluxo de produção com título de referência, responsável definido e prazo de entrega.
                </div>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Título do Conteúdo{' '}
                {(targetColumnForPromotion || columnStatus) !== 'ideias' && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reels: 5 diferenciais do acabamento EngenhArq"
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:border-transparent transition-all disabled:opacity-70"
              />
            </div>

            {/* Descrição / Briefing Original */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Descrição da Ideia / Briefing <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a pauta, tópicos ou objetivo da postagem..."
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:border-transparent transition-all resize-none disabled:opacity-70"
              />
            </div>

            {/* Grid: Coluna, Responsável e Prazo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Coluna / Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Coluna no Kanban
                </label>
                <select
                  disabled={!canEdit || isPromotionMode}
                  value={columnStatus}
                  onChange={(e) => setColumnStatus(e.target.value as ContentColumnStatus)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                >
                  {KANBAN_COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Responsável{' '}
                  {(targetColumnForPromotion || columnStatus) !== 'ideias' && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <select
                    disabled={!canEdit}
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                  >
                    <option value="">Selecione o responsável</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data de Entrega */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Data de Entrega{' '}
                  {(targetColumnForPromotion || columnStatus) !== 'ideias' && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Alerta de Prazo Atual */}
            {alertInfo.type !== 'nenhum' && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${alertInfo.badgeClass}`}>
                <Clock className="w-4 h-4" />
                <span>
                  Situação do prazo: <strong>{alertInfo.label}</strong> (entrega prevista para{' '}
                  {dueDate ? dueDate.split('-').reverse().join('/') : '-'})
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Rodapé com Botão Excluir na esquerda e Salvar na direita */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            {canEdit && onDelete && !isPromotionMode && (
              <button
                type="button"
                onClick={handleDeleteFromModal}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {canEdit ? 'Cancelar' : 'Fechar'}
            </button>
            {canEdit && (
              <button
                type="submit"
                form="cardForm"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? 'Salvando...' : isPromotionMode ? 'Avançar para Produção' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
