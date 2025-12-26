
export interface Client {
  id: string;
  company_name: string;
  contact_email: string;
  ghl_api_key: string;
  ghl_location_id: string;
  ghl_pipeline_id: string;
  ghl_stage_id: string;
  active: boolean;
  created_at: string;
}

export interface ClientCriteria {
  id: string;
  client_id: string;
  postcode: string;
  radius_km: number;
  application_types: string[];
  keywords: string[];
  schedule_day: number; // 0-6 (Sunday-Saturday)
  last_run_at: string | null;
}

export interface Lead {
  id: string;
  client_id: string;
  planit_reference: string;
  address: string;
  postcode: string;
  description: string;
  application_type: string;
  authority_name: string;
  agent_name: string | null;
  agent_address: string | null;
  source_url: string;
  ghl_contact_id: string | null;
  created_at: string;
  synced_at: string | null;
  estimated_value?: string;
  stage?: string;
}

export interface SyncLog {
  id: string;
  client_id: string;
  run_date: string;
  leads_found: number;
  leads_new: number;
  leads_sent: number;
  errors: string[];
  duration_ms: number;
}

export enum SyncStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
