import React, { useState, useEffect } from 'react';
import { CalendarEvent, EVENT_TYPES } from '../../types/calendario';
import { calendarService } from '../../services/calendarService';
import { Trash2, RotateCcw, X, Calendar } from 'lucide-react';

interface CalendarTrashModalProps {
  isOpen: boolean;
  isSuperadmin: boolean;
  onClose: () => void;
  onEventRestored: () => void;
}

export const CalendarTrashModal: React.FC<CalendarTrashModalProps> = ({
  isOpen,
  isSuperadmin,
  onClose,
  onEventRestored,
}) => {
  const [deletedEvents, setDeletedEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadDeleted = async () => {
    setIsLoading(true);
    const res = await calendarService.fetchDeletedEvents();
    setDeletedEvents(res.data || []);
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
    const res = await calendarService.restoreEvent(id);
    setActionLoadingId(null);
    if (res.success) {
      loadDeleted();
      onEventRestored();
    } else {
      alert(res.error || 'Erro ao restaurar compromisso.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Deseja excluir definitivamente este compromisso? Esta ação não pode ser desfeita.')) {
      return;
    }
    setActionLoadingId(id);
    const res = await calendarService.permanentDeleteEvent(id);
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
              <h3 className="text-sm font-bold text-[#373535]">Lixeira do Calendário</h3>
              <p className="text-[11px] text-gray-500">
                Compromissos excluídos podem ser restaurados ou removidos definitivamente
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
          ) : deletedEvents.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">A lixeira está vazia.</p>
              <p className="text-[11px] text-gray-400">
                Nenhum compromisso foi enviado para a lixeira.
              </p>
            </div>
          ) : (
            deletedEvents.map((evt) => {
              const typeInfo = EVENT_TYPES.find((t) => t.id === evt.type);
              const formattedDate = evt.event_date ? evt.event_date.split('-').reverse().join('/') : '-';
              return (
                <div
                  key={evt.id}
                  className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#373535] truncate">
                        {evt.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                          typeInfo?.badgeClass || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {typeInfo?.label || evt.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                      <span>Data: {formattedDate}</span>
                      {evt.start_time && (
                        <span>&bull; Horário: {evt.start_time.slice(0, 5)}</span>
                      )}
                      {evt.location && <span>&bull; Local: {evt.location}</span>}
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={actionLoadingId === evt.id}
                      onClick={() => handleRestore(evt.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Restaurar</span>
                    </button>

                    {isSuperadmin && (
                      <button
                        type="button"
                        disabled={actionLoadingId === evt.id}
                        onClick={() => handlePermanentDelete(evt.id)}
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
          <span>{deletedEvents.length} compromisso(s) na lixeira</span>
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

