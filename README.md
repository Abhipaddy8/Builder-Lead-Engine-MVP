
# Builder Lead Engine - Phase 1 MVP

This is an internal admin system for automating UK planning lead ingestion into GoHighLevel (GHL).

## Setup
1. Define your clients in the **Clients** tab.
2. Ensure each client has a valid **GHL API Key** and **Location ID**.
3. Set specific **Pipeline** and **Stage** IDs for where leads should land.
4. Define search criteria (Postcode, Radius, Keywords).

## How Sync Works
- **PlanIt Scraper**: Queries `planit.org.uk` using the specified radius and postcode.
- **Filtering**: Filters results by keywords and application types.
- **De-duplication**: Uses the unique planning reference to ensure no duplicate leads are sent to GHL.
- **GHL Push**: Creates a contact in GHL with the planning details, tags (by week/year), and moves them to the specified pipeline stage.
- **Scheduling**: In a production environment, a cron job calls `SyncEngine.runClientSync()` weekly per client. This MVP supports manual triggers via the **Dashboard**.

## Deployment
- Frontend is a static React application.
- State is persisted in `localStorage` for this demo.
- In Phase 2, the `MockDB` would be swapped for a PostgreSQL connection.
