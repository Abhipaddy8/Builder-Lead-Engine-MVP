
import { Client, ClientCriteria, Lead, SyncLog } from '../types';

class MockDB {
  private key(type: string) { return `builder_engine_${type}`; }

  constructor() {
    this.seedIfEmpty();
  }

  private seedIfEmpty() {
    if (this.getClients().length === 0) {
      console.log("Seeding comprehensive mock data for visualization...");
      
      const mockClients: Client[] = [
        {
          id: 'c1',
          company_name: 'Premium Extensions Ltd',
          contact_email: 'hello@premiumextensions.com',
          ghl_api_key: 'ghl_live_88293048',
          ghl_location_id: 'LOC_8821',
          ghl_pipeline_id: 'PI_992',
          ghl_stage_id: 'ST_01',
          active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'c2',
          company_name: 'The Loft Specialists',
          contact_email: 'info@loftspecialists.co.uk',
          ghl_api_key: 'ghl_live_11233445',
          ghl_location_id: 'LOC_4422',
          ghl_pipeline_id: 'PI_773',
          ghl_stage_id: 'ST_02',
          active: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockCriteria: ClientCriteria[] = [
        {
          id: 'crit1',
          client_id: 'c1',
          postcode: 'SW1A 1AA',
          radius_km: 15,
          application_types: ['Extension', 'Refurbishment'],
          keywords: ['kitchen', 'double-storey'],
          schedule_day: 1,
          last_run_at: new Date().toISOString()
        },
        {
          id: 'crit2',
          client_id: 'c2',
          postcode: 'N1 9GU',
          radius_km: 10,
          application_types: ['Loft'],
          keywords: ['conversion'],
          schedule_day: 3,
          last_run_at: new Date().toISOString()
        }
      ];

      const mockLeads: Lead[] = [
        {
          id: 'l1', client_id: 'c1', planit_reference: 'PA/2024/1001', address: '12 Downing St, London', postcode: 'SW1A 2AA',
          description: 'Conversion to Dwelling',
          application_type: 'Full Planning', authority_name: 'Liverpool', agent_name: 'Arch Design Ltd',
          agent_address: '1 High St, London', source_url: '#', ghl_contact_id: 'ghl_991', created_at: '2025-12-26T10:00:00Z', synced_at: new Date().toISOString(),
          stage: 'Detailed Plans Submitted', estimated_value: '£0 - £100K'
        },
        {
          id: 'l2', client_id: 'c1', planit_reference: 'PA/2024/1082', address: '45 Chelsea Square, London', postcode: 'SW3 5LF',
          description: 'One Storey Extension',
          application_type: 'Householder', authority_name: 'Blackburn', agent_name: 'Vogue Architects',
          agent_address: 'Park Lane, London', source_url: '#', ghl_contact_id: null, created_at: '2025-12-26T11:00:00Z', synced_at: null,
          stage: 'Detailed Plans Submitted', estimated_value: '£0 - £100K'
        },
        {
          id: 'l3', client_id: 'c1', planit_reference: 'PA/2024/1099', address: 'Shrewsbury Road', postcode: 'SY1 1AA',
          description: 'One Storey Extension',
          application_type: 'Householder', authority_name: 'Shrewsbury', agent_name: 'Local Build',
          agent_address: 'Shrewsbury', source_url: '#', ghl_contact_id: 'ghl_995', created_at: '2025-12-26T12:00:00Z', synced_at: new Date().toISOString(),
          stage: 'Detailed Plans Submitted', estimated_value: '£0 - £100K'
        },
        {
          id: 'l4', client_id: 'c1', planit_reference: 'PA/2024/2022', address: 'Bolton Park', postcode: 'BL1 1AA',
          description: 'Padel Court',
          application_type: 'Full Planning', authority_name: 'South East London', agent_name: 'Sport Design',
          agent_address: 'London', source_url: '#', ghl_contact_id: null, created_at: '2025-12-26T13:00:00Z', synced_at: null,
          stage: 'Detailed Plans Submitted', estimated_value: '£200K - £300K'
        },
        {
          id: 'l5', client_id: 'c1', planit_reference: 'PA/2024/3033', address: 'Reading Gateway', postcode: 'RG1 1AA',
          description: 'Mixed Use Development (2380 Units)',
          application_type: 'Major Planning', authority_name: 'Wiltshire', agent_name: 'Masterplan Ltd',
          agent_address: 'Bristol', source_url: '#', ghl_contact_id: 'ghl_999', created_at: '2025-12-26T14:00:00Z', synced_at: new Date().toISOString(),
          stage: 'Detailed Plans Submitted', estimated_value: '£240.0M - £250.0M'
        }
      ];

      const mockLogs: SyncLog[] = [
        { id: 'log1', client_id: 'c1', run_date: new Date().toISOString(), leads_found: 42, leads_new: 5, leads_sent: 5, errors: [], duration_ms: 1240 }
      ];

      localStorage.setItem(this.key('clients'), JSON.stringify(mockClients));
      localStorage.setItem(this.key('criteria'), JSON.stringify(mockCriteria));
      localStorage.setItem(this.key('leads'), JSON.stringify(mockLeads));
      localStorage.setItem(this.key('sync_logs'), JSON.stringify(mockLogs));
    }
  }

  getClients(): Client[] {
    const data = localStorage.getItem(this.key('clients'));
    return data ? JSON.parse(data) : [];
  }

  saveClient(client: Client) {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx >= 0) clients[idx] = client;
    else clients.push(client);
    localStorage.setItem(this.key('clients'), JSON.stringify(clients));
  }

  deleteClient(id: string) {
    const clients = this.getClients().filter(c => c.id !== id);
    localStorage.setItem(this.key('clients'), JSON.stringify(clients));
  }

  getCriteria(clientId: string): ClientCriteria | null {
    const data = localStorage.getItem(this.key('criteria'));
    const all: ClientCriteria[] = data ? JSON.parse(data) : [];
    return all.find(c => c.client_id === clientId) || null;
  }

  saveCriteria(criteria: ClientCriteria) {
    const data = localStorage.getItem(this.key('criteria'));
    let all: ClientCriteria[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(c => c.client_id === criteria.client_id);
    if (idx >= 0) all[idx] = criteria;
    else all.push(criteria);
    localStorage.setItem(this.key('criteria'), JSON.stringify(all));
  }

  getLeads(clientId: string): Lead[] {
    const data = localStorage.getItem(this.key('leads'));
    const all: Lead[] = data ? JSON.parse(data) : [];
    return all.filter(l => l.client_id === clientId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  saveLead(lead: Lead) {
    const data = localStorage.getItem(this.key('leads'));
    let all: Lead[] = data ? JSON.parse(data) : [];
    all.push(lead);
    localStorage.setItem(this.key('leads'), JSON.stringify(all));
  }

  getSyncLogs(clientId?: string): SyncLog[] {
    const data = localStorage.getItem(this.key('sync_logs'));
    const all: SyncLog[] = data ? JSON.parse(data) : [];
    if (clientId) return all.filter(l => l.client_id === clientId);
    return all.sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime());
  }

  addSyncLog(log: SyncLog) {
    const data = localStorage.getItem(this.key('sync_logs'));
    let all: SyncLog[] = data ? JSON.parse(data) : [];
    all.push(log);
    localStorage.setItem(this.key('sync_logs'), JSON.stringify(all));
  }
}

export const db = new MockDB();
