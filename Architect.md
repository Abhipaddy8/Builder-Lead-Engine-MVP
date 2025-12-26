# Architectural Log & Structural Breakdown

## Directory Structure
- `/services`: Infrastructure logic (External APIs).
- `/store`: Data persistence (currently `db.ts` using LocalStorage).
- `/types.ts`: Shared interfaces (The single source of truth for data shapes).
- `App.tsx`: The main UI orchestrator (Persona routing).

## Service Logic
### 1. `SyncEngine.ts`
The "Brain" of the operation.
- **Input**: `clientId`.
- **Process**: 
    1. Check `last_run_at`.
    2. Fetch from `PlanItService`.
    3. Filter by `ClientCriteria` (Postcode/Radius/Keywords).
    4. Fetch deep Agent data for matching apps.
    5. Push to `GHLService`.
- **Output**: `SyncLog`.

### 2. `MockDB` (Persistence)
- Uses `localStorage` with a prefixed key `builder_engine_`.
- Auto-seeds on instantiation if no clients are found.
- Supports `Client`, `Criteria`, `Lead`, and `SyncLog` entities.

## Decision Log
- **2025-05-20**: Implemented Persona Gateway. Decision: Treat them as two separate React apps within one file to maintain simple MVP state management before moving to a Router.
- **2025-05-20**: UI Overhaul. Decision: Adopted "Planning Pipe" yellow-header table style to match user expectations of industry tools.
- **2025-05-20**: Lead De-duplication. Decision: Unique constraint enforced on `planit_reference` per client.
