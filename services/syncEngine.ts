
import { db } from '../store/db';
import { PlanItService } from './planitService';
import { GHLService } from './ghlService';
import { SyncLog, Lead } from '../types';

export class SyncEngine {
  /**
   * Runs the full sync process for a single client.
   * Isolated per client (PRD Rule 8).
   */
  static async runClientSync(clientId: string) {
    const startTime = Date.now();
    const client = db.getClients().find(c => c.id === clientId);
    const criteria = db.getCriteria(clientId);

    if (!client || !criteria || !client.active) return null;

    const errors: string[] = [];
    let found = 0;
    let created = 0;
    let sent = 0;

    try {
      // 1. Calculate lookback window
      // PRD logic: sync recent data since last run
      const lastRun = criteria.last_run_at ? new Date(criteria.last_run_at) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const daysSince = Math.max(1, Math.ceil((Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24)));

      // 2. Fetch from PlanIt (handles 429 and pagination per PRD Rule 3)
      const applications = await PlanItService.fetchApplications(criteria, daysSince);
      found = applications.length;

      // 3. De-duplicate using PlanIt Reference (PRD Rule 6)
      const existingLeads = db.getLeads(clientId);
      const existingRefs = new Set(existingLeads.map(l => l.planit_reference));

      for (const app of applications) {
        // Skip existing
        if (existingRefs.has(app.app_ref)) continue;

        // Apply keyword filtering (case-insensitive)
        if (criteria.keywords.length > 0) {
          const content = `${app.description} ${app.address}`.toLowerCase();
          const matches = criteria.keywords.some(k => content.includes(k.toLowerCase()));
          if (!matches) continue;
        }

        created++;

        // 4. Ingest and Build Lead Entity
        const newLead: Lead = {
          id: Math.random().toString(36).substr(2, 9),
          client_id: clientId,
          planit_reference: app.app_ref,
          address: app.address,
          postcode: app.postcode || app.pc_district || "N/A",
          description: app.description,
          application_type: app.applic,
          authority_name: app.authority,
          agent_name: null,
          agent_address: null,
          source_url: app.url,
          ghl_contact_id: null,
          created_at: new Date().toISOString(),
          synced_at: null
        };

        // Fetch deep details for Agent info (PRD Rule Rule 6/Deliverable 5)
        // Note: fetchDetails also respects 45s query limit by fetching specific ID
        const details = await PlanItService.fetchDetails(app.doc_id);
        if (details) {
          newLead.agent_name = details.agent?.name || null;
          newLead.agent_address = details.agent?.address || null;
        }

        // 5. Synchronize with GHL (PRD Rule 7)
        try {
          // Rule 7: Failures here must not crash the batch.
          const contactId = await GHLService.pushLead(client, newLead);
          newLead.ghl_contact_id = contactId;
          newLead.synced_at = new Date().toISOString();
          sent++;
          
          // Save to local DB after successful push
          db.saveLead(newLead);
        } catch (e: any) {
          errors.push(`GHL Sync Failed for ${app.app_ref}: ${e.message}`);
          // Still save locally so we don't keep trying failed ones repeatedly next time
          db.saveLead(newLead);
        }
        
        // Rate Governing: Staggered execution (Rule 8)
        // 500ms delay between GHL pushes to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 6. Finalize Run Status
      criteria.last_run_at = new Date().toISOString();
      db.saveCriteria(criteria);

    } catch (e: any) {
      errors.push(`Engine Critical Error: ${e.message}`);
    }

    const log: SyncLog = {
      id: Math.random().toString(36).substr(2, 9),
      client_id: clientId,
      run_date: new Date().toISOString(),
      leads_found: found,
      leads_new: created,
      leads_sent: sent,
      errors: errors,
      duration_ms: Date.now() - startTime
    };

    db.addSyncLog(log);
    return log;
  }
}
