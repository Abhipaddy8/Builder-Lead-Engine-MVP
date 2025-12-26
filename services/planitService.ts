
import { ClientCriteria } from '../types';

const BASE_URL = 'https://www.planit.org.uk';

export class PlanItService {
  /**
   * Fetches applications from PlanIt based on client criteria.
   * Implements pagination, rate limiting handling, and filtering.
   */
  static async fetchApplications(criteria: ClientCriteria, daysSinceLastRun: number = 7) {
    const pg_sz = 300;
    let page = 1;
    let allApplics: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        pg_sz: pg_sz.toString(),
        page: page.toString(),
        postcode: criteria.postcode,
        radius: criteria.radius_km.toString(),
        recent: daysSinceLastRun.toString(),
        compress: 'on'
      });

      // Add application types if specified
      if (criteria.application_types.length > 0) {
        params.append('applic', criteria.application_types.join(','));
      }

      const url = `${BASE_URL}/api/applics/json?${params.toString()}`;

      try {
        const response = await fetch(url);
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry this page
        }

        if (!response.ok) {
          throw new Error(`PlanIt API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const records = data.records || [];
        allApplics = [...allApplics, ...records];

        // Pagination Check: PlanIt returns "count" and "to" in JSON
        if (data.to >= data.count || records.length === 0 || allApplics.length >= 5000) {
          hasMore = false;
        } else {
          page++;
        }

        // Throttle slightly to be safe
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to fetch page', page, error);
        hasMore = false; // Stop on error but keep what we have
      }
    }

    return allApplics;
  }

  /**
   * Fetches full application details including agent information.
   */
  static async fetchDetails(appId: string) {
    const url = `${BASE_URL}/planapplic/${appId}/json?compress=on`;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch details for ${appId}`, error);
      return null;
    }
  }
}
