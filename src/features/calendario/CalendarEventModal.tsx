import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarEventType, EVENT_TYPES } from '../../types/calendario';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface CalendarEventModalProps {
  isOpen: boolean;
  event: CalendarEvent | null; // Se null, é criação
  initialDate?: string;
  canEdit: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    type: CalendarEventType;
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    description?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (eventId: string) => void;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  event,
  initialDate,
  canEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('reuniao');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setType(event.type);
      setEventDate(event.event_date || '');
      setStartTime(event.start_time ? event.start_time.slice(0, 5) : '');
      setEndTime(event.end_time ? event.end_time.slice(0, 5) : '');
      setLocation(event.location || '');
      setDescription(event.description || '');
      setError(null);
    } else {
      // Criação nova
      setTitle('');
      setType('reuniao');
      setEventDate(
        initialDate ||
          new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date())
      );
      setStartTime('');
      setEndTime('');
      setLocation('');
      setDescription('');
      setError(null);
    }
  }, [event, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Informe o título do compromisso.');
      return;
    }
    if (!eventDate) {
      setError('Informe a data do compromisso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave({
        title: cleanTitle,
        type,
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location.trim() || null,
        description: description.trim() || null,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Erro ao salvar compromisso.');
      }
    } catch {
      setError('Falha de conexão ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      if (confirm(`Deseja enviar o compromisso "${event.title}" para a lixeira?`)) {
        onDelete(event.id);
        onClose();
      }
    }
  };

  const isLink = location.startsWith('http://') || location.startsWith('https://');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Topo do Modal */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                type === 'evento' ? 'bg-red-50 text-[#DE3A39]' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373535]">
                {event ? (canEdit ? 'Editar Compromisso' : 'Detalhes do Compromisso') : 'Novo Compromisso'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Agenda compartilhada da Central de Marketing EngenhArq
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

          <form id="eventForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Compromisso */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tipo de Compromisso <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {EVENT_TYPES.map((t) => {
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setType(t.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? t.id === 'evento'
                            ? 'bg-red-50/80 border-[#DE3A39] text-[#DE3A39] ring-2 ring-[#DE3A39]/20'
                            : 'bg-blue-50/80 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100/70'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Título do Compromisso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'reuniao'
                    ? 'Ex: Alinhamento de Campanha com a Diretoria'
                    : 'Ex: Lançamento do Residencial Horizonte no Stand'
                }
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
              />
            </div>

            {/* Data e Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={!canEdit}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Início</span>
                </label>
                <input
                  type="time"
                  disabled={!canEdit}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Término</span>
                </label>
                <input
                  type="time"
                  disabled={!canEdit}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Local ou Link */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span>Local ou Link de Reunião Online</span>
                </span>
                {isLink && (
                  <a
                    href={location}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Abrir link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sala de Reuniões 02 ou https://meet.google.com/xyz"
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all disabled:opacity-70"
              />
            </div>

            {/* Descrição / Pauta */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-400" />
                <span>Pauta ou Descrição (opcional)</span>
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os tópicos a serem alinhados, participantes ou detalhes do evento..."
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all resize-none disabled:opacity-70"
              />
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            {canEdit && event && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
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
                form="eventForm"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? 'Salvando...' : event ? 'Salvar Alterações' : 'Criar Compromisso'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

