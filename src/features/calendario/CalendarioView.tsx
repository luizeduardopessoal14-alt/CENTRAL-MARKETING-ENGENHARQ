import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarEvent, CalendarEventType } from '../../types/calendario';
import { calendarService } from '../../services/calendarService';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarTrashModal } from './CalendarTrashModal';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Clock,
  MapPin,
  ExternalLink,
  LayoutGrid,
  List,
  AlertCircle,
  Video,
} from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const CalendarioView: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const canEdit = hasAccess('calendario', 'edicao');
  const isSuperadmin = user?.role === 'superadmin';

  // Data atual de referência no fuso local
  const todayYMD = useMemo(() => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const [currentYear, setCurrentYear] = useState<number>(() => Number(todayYMD.split('-')[0]));
  const [currentMonth, setCurrentMonth] = useState<number>(() => Number(todayYMD.split('-')[1]) - 1); // 0-indexed

  // Estados principais
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros e Visualização
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  // Carregar eventos
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Buscar intervalo do mês selecionado (com margem para dias visíveis do mês anterior/posterior)
      const res = await calendarService.fetchEvents();
      if (res.error) {
        setError(res.error);
      } else {
        setEvents(res.data || []);
      }
    } catch {
      setError('Erro ao carregar os compromissos do calendário.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Navegação de mês
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const [y, m] = todayYMD.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  // Métricas do Mês / Semana
  const metrics = useMemo(() => {
    const startOfMonthYMD = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const endOfMonthYMD = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    let totalThisMonth = 0;
    let meetingsThisMonth = 0;
    let eventsThisMonth = 0;

    events.forEach((evt) => {
      if (evt.event_date >= startOfMonthYMD && evt.event_date <= endOfMonthYMD) {
        totalThisMonth++;
        if (evt.type === 'reuniao') meetingsThisMonth++;
        if (evt.type === 'evento') eventsThisMonth++;
      }
    });

    const upcomingEvents = events
      .filter((e) => e.event_date >= todayYMD)
      .slice(0, 3);

    return { totalThisMonth, meetingsThisMonth, eventsThisMonth, upcomingEvents };
  }, [events, currentYear, currentMonth, todayYMD]);

  // Filtragem dos eventos
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (typeFilter !== 'todos' && evt.type !== typeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchLoc = evt.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [events, typeFilter, searchTerm]);

  // Construção dos dias da grade do mês
  const calendarDays = useMemo(() => {
    const days: {
      dateYMD: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }[] = [];

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Domingo
    const lastDateCurrent = new Date(currentYear, currentMonth + 1, 0).getDate();
    const lastDatePrev = new Date(currentYear, currentMonth, 0).getDate();

    // Dias do mês anterior para preencher a primeira semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = lastDatePrev - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateYMD = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvts = filteredEvents.filter((e) => e.event_date === dateYMD);
      days.push({
        dateYMD,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateYMD === todayYMD,
        events: dayEvts,
      });
    }

    // Dias do mês atual
    for (let dayNum = 1; dayNum <= lastDateCurrent; dayNum++) {
      const dateYMD = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvts = filteredEvents.filter((e) => e.event_date === dateYMD);
      days.push({
        dateYMD,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateYMD === todayYMD,
        events: dayEvts,
      });
    }

    // Dias do mês seguinte para completar as semanas (múltiplo de 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingDays; dayNum++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateYMD = `${nextY}-${String(nextM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvts = filteredEvents.filter((e) => e.event_date === dateYMD);
      days.push({
        dateYMD,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateYMD === todayYMD,
        events: dayEvts,
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents, todayYMD]);

  // Ações de Salvar / Criar
  const handleSaveEvent = async (payload: {
    title: string;
    type: CalendarEventType;
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    description?: string | null;
  }) => {
    if (selectedEvent) {
      // Atualização
      const res = await calendarService.updateEvent(selectedEvent.id, payload);
      if (res.data) {
        setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? res.data! : e)));
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro ao atualizar compromisso' };
    } else {
      // Criação
      const res = await calendarService.createEvent({
        ...payload,
        created_by: user?.id || '',
      });
      if (res.data) {
        setEvents((prev) => [...prev, res.data!]);
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro ao criar compromisso' };
    }
  };

  // Exclusão
  const handleDeleteEvent = async (eventId: string) => {
    const res = await calendarService.softDeleteEvent(eventId, user?.id || '');
    if (res.success) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } else {
      alert(res.error || 'Erro ao enviar compromisso para a lixeira');
    }
  };

  const handleOpenNewOnDate = (dateYMD: string) => {
    if (!canEdit) return;
    setSelectedEvent(null);
    setSelectedDateForNew(dateYMD);
    setIsEventModalOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEvent(evt);
    setSelectedDateForNew(undefined);
    setIsEventModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA]">
      {/* 1. Header do Calendário */}
      <div className="bg-white border-b border-gray-200/80 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DE3A39] flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-[#373535]">Calendário Geral</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Agenda compartilhada da construtora para alinhamentos estratégicos e eventos de lançamento
            </p>
          </div>

          {/* Cards de Métricas do Mês */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/60 text-xs">
              <span className="text-gray-400 block text-[10px] font-medium uppercase">
                Compromissos no Mês
              </span>
              <span className="font-bold text-[#373535]">{metrics.totalThisMonth}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs">
              <span className="text-blue-700 block text-[10px] font-medium uppercase">
                Reuniões
              </span>
              <span className="font-bold text-blue-900">{metrics.meetingsThisMonth}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-red-50/70 border border-red-200/60 text-xs">
              <span className="text-[#DE3A39] block text-[10px] font-medium uppercase">
                Eventos
              </span>
              <span className="font-bold text-red-900">{metrics.eventsThisMonth}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTrashOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              title="Lixeira do calendário"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedDateForNew(undefined);
                  setIsEventModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Compromisso</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Barra de Navegação de Mês, Filtros e Alternador de Visão */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          {/* Navegação de Mês */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white transition-all cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-[#373535] min-w-[130px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white transition-all cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl justify-end">
            {/* Campo de Busca */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar compromisso..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all"
              />
            </div>

            {/* Filtro por Tipo */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('todos')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  typeFilter === 'todos'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('reuniao')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'reuniao'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Reuniões</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('evento')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'evento'
                    ? 'bg-white text-[#DE3A39] shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#DE3A39]" />
                <span>Eventos</span>
              </button>
            </div>

            {/* Alternador de Modo de Visualização */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Visão Grade Mensal"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Visão Lista de Agenda"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Área de Conteúdo do Calendário */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-16">
            <div className="w-8 h-8 border-2 border-[#DE3A39]/30 border-t-[#DE3A39] rounded-full animate-spin" />
            <p className="text-xs">Carregando calendário...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 mt-8">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Erro ao carregar o calendário:</p>
              <p className="mt-1">{error}</p>
              <button
                onClick={loadEvents}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* =================== MODO GRADE (CALENDÁRIO MENSAL) =================== */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            {/* Linha dos Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 text-center py-2.5">
              {WEEKDAYS.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`text-[11px] font-bold tracking-wider uppercase ${
                    idx === 0 || idx === 6 ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid dos Dias do Mês */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200/70">
              {calendarDays.map((day, idx) => {
                return (
                  <div
                    key={`${day.dateYMD}-${idx}`}
                    onClick={() => handleOpenNewOnDate(day.dateYMD)}
                    className={`min-h-[110px] p-2 flex flex-col transition-colors group relative ${
                      day.isCurrentMonth
                        ? 'bg-white hover:bg-gray-50/60'
                        : 'bg-gray-50/40 text-gray-400'
                    } ${canEdit ? 'cursor-pointer' : ''}`}
                  >
                    {/* Topo da Célula: Número do Dia */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          day.isToday
                            ? 'bg-[#DE3A39] text-white font-bold shadow-xs'
                            : day.isCurrentMonth
                            ? 'text-[#373535]'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {canEdit && day.isCurrentMonth && (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 hover:text-[#DE3A39] p-0.5 transition-opacity">
                          <Plus className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Lista de Badges dos Compromissos no Dia */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                      {day.events.map((evt) => {
                        const isReuniao = evt.type === 'reuniao';
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => handleOpenEdit(evt, e)}
                            className={`px-1.5 py-1 rounded-md text-[10px] font-medium border truncate transition-all cursor-pointer ${
                              isReuniao
                                ? 'bg-blue-50/90 text-blue-800 border-blue-200 hover:bg-blue-100'
                                : 'bg-red-50/90 text-[#DE3A39] border-red-200 hover:bg-red-100'
                            }`}
                            title={`${evt.title} ${evt.start_time ? `(${evt.start_time.slice(0, 5)})` : ''}`}
                          >
                            <span className="font-semibold mr-1">
                              {evt.start_time ? evt.start_time.slice(0, 5) : ''}
                            </span>
                            <span>{evt.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =================== MODO LISTA (AGENDA CRONOLÓGICA) =================== */
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
                <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-bold text-[#373535]">Nenhum compromisso encontrado</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Não há reuniões ou eventos cadastrados para os filtros selecionados.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      setSelectedDateForNew(undefined);
                      setIsEventModalOpen(true);
                    }}
                    className="mt-2 px-4 py-2 bg-[#DE3A39] text-white rounded-lg text-xs font-semibold hover:bg-[#C52B2A] transition-colors cursor-pointer"
                  >
                    + Criar Novo Compromisso
                  </button>
                )}
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isReuniao = evt.type === 'reuniao';
                const formattedDate = evt.event_date.split('-').reverse().join('/');
                const isLink = evt.location?.startsWith('http://') || evt.location?.startsWith('https://');

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleOpenEdit(evt)}
                    className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Ícone Indicador de Tipo */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isReuniao
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-red-50 text-[#DE3A39]'
                        }`}
                      >
                        {isReuniao ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <CalendarIcon className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                              isReuniao
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-[#DE3A39] border-red-200'
                            }`}
                          >
                            {isReuniao ? 'Reunião' : 'Evento'}
                          </span>
                          <h4 className="text-xs font-bold text-[#373535] group-hover:text-[#DE3A39] transition-colors truncate">
                            {evt.title}
                          </h4>
                        </div>

                        {/* Metadados: Data, Horário e Local */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                            {formattedDate}
                          </span>

                          {evt.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {evt.start_time.slice(0, 5)}
                              {evt.end_time ? ` às ${evt.end_time.slice(0, 5)}` : ''}
                            </span>
                          )}

                          {evt.location && (
                            <span
                              className="flex items-center gap-1 max-w-xs truncate"
                              onClick={(e) => {
                                if (isLink) e.stopPropagation();
                              }}
                            >
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              {isLink ? (
                                <a
                                  href={evt.location}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  <span className="truncate">{evt.location}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="truncate">{evt.location}</span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Descrição */}
                        {evt.description && (
                          <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botão de Excluir Rápido */}
                    {canEdit && (
                      <div
                        className="flex items-center justify-end flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja excluir o compromisso "${evt.title}"?`)) {
                              handleDeleteEvent(evt.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Excluir compromisso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Modais */}
      {/* Modal de Criação / Edição */}
      <CalendarEventModal
        isOpen={isEventModalOpen}
        event={selectedEvent}
        initialDate={selectedDateForNew}
        canEdit={canEdit}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Modal de Lixeira */}
      <CalendarTrashModal
        isOpen={isTrashOpen}
        isSuperadmin={isSuperadmin}
        onClose={() => setIsTrashOpen(false)}
        onEventRestored={loadEvents}
      />
    </div>
  );
};
