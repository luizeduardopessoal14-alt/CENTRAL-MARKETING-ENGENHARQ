export type CalendarEventType = 'reuniao' | 'evento';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  event_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS ou HH:MM
  end_time: string | null;
  location: string | null;
  description: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarOverviewMetrics {
  nextEvents: CalendarEvent[];
  meetingsThisWeekCount: number;
  eventsThisMonthCount: number;
}

export const EVENT_TYPES: { id: CalendarEventType; label: string; color: string; badgeClass: string }[] = [
  {
    id: 'reuniao',
    label: 'Reunião',
    color: '#3B82F6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'evento',
    label: 'Evento',
    color: '#DE3A39',
    badgeClass: 'bg-red-50 text-[#DE3A39] border-red-200',
  },
];

