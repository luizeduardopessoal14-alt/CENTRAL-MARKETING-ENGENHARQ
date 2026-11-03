export type CVCRMStatus = 'desconectado' | 'conectado' | 'erro';

export interface CVCRMIntegrationConfig {
  id: string;
  base_url: string;
  email: string | null;
  token: string | null;
  status: CVCRMStatus;
  last_sync_at: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RealEstateAgency {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  cvcrm_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AgencyMetricsMonthly {
  id: string;
  agency_id: string;
  period_month: string; // 'YYYY-MM-01'
  leads_received: number;
  in_attendance: number;
  visits: number;
  proposals: number;
  sales: number;
  conversion_rate?: number; // Calculated: (sales / leads_received) * 100
  synced_at: string;
  created_at: string;
  updated_at: string;
  agency?: RealEstateAgency;
}

export interface AgencySummaryRow {
  agency: RealEstateAgency;
  leads_received: number;
  in_attendance: number;
  visits: number;
  proposals: number;
  sales: number;
  conversion_rate: number;
  visits_rate: number;
}

