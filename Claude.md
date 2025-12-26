# Claude Master Context: Builder Lead Engine

## Project Essence
A specialized SaaS MVP for **Develop Coaching**. It bridges the gap between public UK planning data (`planit.org.uk`) and GoHighLevel (GHL) CRM.

## Core Personas
1. **Coach Admin**: Global management of builders (clients), GHL API keys, and sync health.
2. **Client Portal**: A high-fidelity "Planning Pipe" inspired dashboard where builders filter and view their specific local leads.

## Technical Anchor
- **Framework**: React 19 (ESM via esm.sh).
- **Styling**: Tailwind CSS + Source Sans Pro.
- **Data**: LocalStorage-based `MockDB` (transitioning to Postgres in Phase 2).
- **Services**: 
    - `PlanItService`: Scrapes planning apps with rate-limiting and pagination logic.
    - `GHLService`: Pushes leads to specific pipelines/stages using REST API.
    - `SyncEngine`: The orchestrator handling lookback windows and de-duplication.

## Brand Guardrails
- **Colors**: Blue (#0069b1), Gold (#fdce36), Orange (#fbaa35), Dark Grey (#414042).
- **Vibe**: Professional, high-density data, "Institutional" feel for Admins, "SaaS Dashboard" feel for Clients.

## Current State
Phase 1 MVP is feature-complete with mock data seeding for 3 test builders. Manual sync triggers are functional in the UI.
