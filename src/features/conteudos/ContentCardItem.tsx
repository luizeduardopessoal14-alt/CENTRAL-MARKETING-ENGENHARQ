import React from 'react';
import { ContentCard, calculateDueDateAlert, KANBAN_COLUMNS, ContentColumnStatus } from '../../types/conteudos';
import { Calendar, User, Clock, MoreVertical, Edit3, Trash2, ArrowRight } from 'lucide-react';

interface ContentCardItemProps {
  card: ContentCard;
  canEdit: boolean;
  onCardClick: (card: ContentCard) => void;
  onQuickMove: (card: ContentCard, targetStatus: ContentColumnStatus) => void;
  onDeleteClick: (card: ContentCard) => void;
  onDragStart: (e: React.DragEvent, card: ContentCard) => void;
}

export const ContentCardItem: React.FC<ContentCardItemProps> = ({
  card,
  canEdit,
  onCardClick,
  onQuickMove,
  onDeleteClick,
  onDragStart,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const alertInfo = calculateDueDateAlert(card.due_date, card.column_status);

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Formatação de data brasileira (DD/MM)
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const isIdea = card.column_status === 'ideias';
  const displayTitle =
    card.title?.trim() ||
    (isIdea
      ? card.description.slice(0, 60) + (card.description.length > 60 ? '...' : '')
      : 'Sem título');

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, card)}
      onClick={() => onCardClick(card)}
      className={`group relative bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-md transition-all select-none ${
        canEdit ? 'cursor-grab active:cursor-grabbing hover:border-gray-300' : 'cursor-pointer'
      }`}
    >
      {/* Topo do Cartão: Título, Botão Excluir Rápido e Menu */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-semibold text-[#373535] leading-snug line-clamp-2">
          {displayTitle}
        </h4>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Botão de Excluir Direto no Card (visível no hover) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onDeleteClick(card)}
              className="p-1 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Excluir conteúdo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Menu de Ações do Cartão */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Opções do cartão"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-6 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCardClick(card);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  <span>{canEdit ? 'Editar detalhes' : 'Ver detalhes'}</span>
                </button>

                {canEdit && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Mover para:
                    </div>
                    {KANBAN_COLUMNS.filter((col) => col.id !== card.column_status).map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onQuickMove(card, col.id);
                        }}
                        className="w-full px-3 py-1 text-left text-xs text-gray-600 hover:bg-gray-50 hover:text-[#B21010] flex items-center justify-between cursor-pointer"
                      >
                        <span>{col.title}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                      </button>
                    ))}

                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteClick(card);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Excluir conteúdo</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Descrição resumida (se for diferente do título) */}
      {card.title && card.description && (
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Alerta de Prazo com destaque visual */}
      {alertInfo.type !== 'nenhum' && (
        <div className="mt-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${alertInfo.badgeClass}`}
          >
            <Clock className="w-2.5 h-2.5" />
            {alertInfo.label}
          </span>
        </div>
      )}

      {/* Rodapé do Cartão: Responsável e Data */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        {/* Responsável */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
            {card.assigned_name ? (
              card.assigned_name.slice(0, 2).toUpperCase()
            ) : (
              <User className="w-3 h-3 text-gray-400" />
            )}
          </div>
          <span className="truncate text-gray-700 font-medium">
            {card.assigned_name || (isIdea ? 'Sem responsável' : 'Não atribuído')}
          </span>
        </div>

        {/* Data de Entrega */}
        {card.due_date && (
          <div
            className={`flex items-center gap-1 text-[10px] ${
              alertInfo.type === 'atrasado'
                ? 'text-red-600 font-semibold'
                : 'text-gray-500'
            }`}
            title={`Data de entrega: ${formatDueDate(card.due_date)}`}
          >
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{formatDueDate(card.due_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
