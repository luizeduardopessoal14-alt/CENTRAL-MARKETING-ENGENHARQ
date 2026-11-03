import { supabase } from '../lib/supabase';
import { CalendarEvent, CalendarOverviewMetrics } from '../types/calendario';

export const calendarService = {
  /**
   * Busca compromissos ativos (não excluídos), com filtro opcional de intervalo de datas
   */
  async fetchEvents(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: CalendarEvent[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('is_deleted', false)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar eventos do calendário:', error);
        return { data: null, error: error.message };
      }

      return { data: (data as CalendarEvent[]) || [], error: null };
    } catch (err) {
      console.error('Exceção ao buscar compromissos:', err);
      return { data: null, error: 'Falha de conexão ao carregar calendário.' };
    }
  },

  /**
   * Busca compromissos na lixeira
   */
  async fetchDeletedEvents(): Promise<{ data: CalendarEvent[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data as CalendarEvent[]) || [], error: null };
    } catch {
      return { data: null, error: 'Falha ao buscar itens da lixeira.' };
    }
  },

  /**
   * Cadastro de novo compromisso
   */
  async createEvent(payload: {
    title: string;
    type: 'reuniao' | 'evento';
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    description?: string | null;
    created_by: string;
  }): Promise<{ data: CalendarEvent | null; error: string | null }> {
    try {
      const cleanTitle = payload.title.trim();
      if (!cleanTitle) {
        return { data: null, error: 'O título do compromisso é obrigatório.' };
      }
      if (!payload.event_date) {
        return { data: null, error: 'A data do compromisso é obrigatória.' };
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: cleanTitle,
          type: payload.type,
          event_date: payload.event_date,
          start_time: payload.start_time || null,
          end_time: payload.end_time || null,
          location: payload.location?.trim() || null,
          description: payload.description?.trim() || null,
          created_by: payload.created_by,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as CalendarEvent, error: null };
    } catch {
      return { data: null, error: 'Erro ao cadastrar compromisso na agenda.' };
    }
  },

  /**
   * Atualização de compromisso
   */
  async updateEvent(
    id: string,
    updates: Partial<CalendarEvent>
  ): Promise<{ data: CalendarEvent | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as CalendarEvent, error: null };
    } catch {
      return { data: null, error: 'Erro ao atualizar compromisso.' };
    }
  },

  /**
   * Exclusão lógica (envio para lixeira)
   */
  async softDeleteEvent(
    id: string,
    deletedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao enviar compromisso para a lixeira.' };
    }
  },

  /**
   * Restauração da lixeira
   */
  async restoreEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao restaurar compromisso.' };
    }
  },

  /**
   * Exclusão permanente (apenas Superadmin)
   */
  async permanentDeleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao excluir definitivamente o compromisso.' };
    }
  },

  /**
   * Métricas para o Dashboard de Visão Geral
   */
  async getOverviewMetrics(): Promise<CalendarOverviewMetrics> {
    try {
      const now = new Date();
      const todayYMD = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      // Início e fim do mês atual
      const [currYear, currMonth] = todayYMD.split('-').map(Number);
      const startOfMonth = `${currYear}-${String(currMonth).padStart(2, '0')}-01`;
      const endOfMonthDate = new Date(currYear, currMonth, 0).getDate();
      const endOfMonth = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(endOfMonthDate).padStart(2, '0')}`;

      // Início e fim da semana atual (Domingo a Sábado)
      const dayOfWeek = now.getDay(); // 0 = Domingo
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (6 - dayOfWeek));

      const startOfWeekYMD = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(sunday);

      const endOfWeekYMD = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(saturday);

      // Buscar todos os eventos do mês e futuros
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('is_deleted', false)
        .gte('event_date', startOfMonth)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });

      const events = (data as CalendarEvent[]) || [];

      // 1. Próximos compromissos (a partir de hoje)
      const upcoming = events.filter((e) => e.event_date >= todayYMD);
      const nextEvents = upcoming.slice(0, 3);

      // 2. Reuniões esta semana
      const meetingsThisWeekCount = events.filter(
        (e) =>
          e.type === 'reuniao' &&
          e.event_date >= startOfWeekYMD &&
          e.event_date <= endOfWeekYMD
      ).length;

      // 3. Eventos do mês
      const eventsThisMonthCount = events.filter(
        (e) =>
          e.type === 'evento' &&
          e.event_date >= startOfMonth &&
          e.event_date <= endOfMonth
      ).length;

      return {
        nextEvents,
        meetingsThisWeekCount,
        eventsThisMonthCount,
      };
    } catch {
      return {
        nextEvents: [],
        meetingsThisWeekCount: 0,
        eventsThisMonthCount: 0,
      };
    }
  },
};

