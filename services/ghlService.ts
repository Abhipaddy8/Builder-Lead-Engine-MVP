
import { Lead, Client } from '../types';

export class GHLService {
  /**
   * Pushes a lead to GHL CRM following PRD Rule 7.
   */
  static async pushLead(client: Client, lead: Lead) {
    const url = `https://services.leadconnectorhq.com/contacts/`;
    const headers = {
      'Authorization': `Bearer ${client.ghl_api_key}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    };

    const now = new Date();
    const weekYearTag = `${now.getFullYear()}/${this.getWeekNumber(now)}`;

    const payload = {
      name: lead.agent_name || "Planning Application", // Fallback per Rule 7
      address1: lead.address,
      postalCode: lead.postcode,
      locationId: client.ghl_location_id,
      pipelineId: client.ghl_pipeline_id,
      stageId: client.ghl_stage_id,
      tags: [
        'planit',
        lead.application_type.toLowerCase().replace(/\s+/g, '-'),
        weekYearTag
      ],
      customFields: [
        { key: 'planning_reference', value: lead.planit_reference },
        { key: 'authority', value: lead.authority_name },
        { key: 'application_type', value: lead.application_type }, // Specific field per Rule 7
        { key: 'source_url', value: lead.source_url }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`GHL API Error: ${errData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.contact.id;
    } catch (error) {
      console.error('GHL Push failed', error);
      throw error;
    }
  }

  static async testConnection(client: Client) {
    const url = `https://services.leadconnectorhq.com/locations/${client.ghl_location_id}`;
    const headers = {
      'Authorization': `Bearer ${client.ghl_api_key}`,
      'Version': '2021-07-28'
    };

    try {
      const response = await fetch(url, { headers });
      return response.ok;
    } catch {
      return false;
    }
  }

  private static getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }
}
