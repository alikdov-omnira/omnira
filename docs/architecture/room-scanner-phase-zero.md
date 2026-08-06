# Room Scanner Phase 0 foundation

Status: foundation hardened; not commercially ready.

## Boundary

```text
HTTP + shared Zod contracts
        |
typed application commands -> RoomScanService (authorization/orchestration)
        |
RoomScanPersistencePort
        |
PostgreSQL repositories/unit of work -> tenant transaction, audit, outbox
        |
Room Scanner tables with forced RLS and tenant-aware foreign keys
```

Domain geometry and review rules do not depend on HTTP, PostgreSQL, storage, devices, or AI. The application directory contains no SQL or PostgreSQL row types. Infrastructure maps persistence records and owns queries, locking, inserts, updates, and batching concerns.

## Ownership rules

- A scan belongs to one tenant and property. If it references a project, `projects.property_id` is the authoritative relationship and must equal the scan property.
- A room belongs to exactly one scan and tenant.
- A surface belongs to exactly one room, scan, and tenant.
- Openings must reference a surface in their own room and scan.
- Measurements and observations may reference only entities in their scan. Database ownership triggers cover nullable entity references.
- A quantity room or surface must be in the quantity's tenant and scan. Quantity provenance validation and approved-snapshot immutability remain in force.
- A Scanner attachment is an explicit association among tenant, scan, file, and optional room. The file must already be linked through the Documents domain to the scan property or project. An active file can belong to only one scan. Association and removal are audited. Raw media never enters the approved Estimate boundary.

## Processing state model

`room_scan_processing_requests` persists `queued`, `processing`, `completed`, and `failed` states with the requested scan version, idempotency key, requester, attempt count, timestamps, safe failure code, and safe result metadata. Completion uses a scan-version guard, preventing a stale result from being accepted after the scan changes.

The current `complete-capture` endpoint still executes deterministic rectangular geometry synchronously for REST compatibility. It now records the durable request state and guards completion, but **there is no Scanner worker yet**. A later worker slice must claim queued requests, calculate outside long transactions, batch persistence, retry safely, and expose progress. Phase 0 does not claim asynchronous durability.

## Migration 026 assumptions

- Existing `room_scan_sessions.project_id` values already correspond to `room_scan_sessions.property_id` through `projects.property_id`.
- Existing quantity room/surface references are valid before constraints are validated.
- Existing direct measurement/observation file references remain readable. New or changed references require an active Scanner attachment association.
- Previous migrations are immutable; all Phase 0 schema changes live in migration 026.

## Known limitations

- Rectangular geometry remains the production calculation model.
- No camera, photo UI, offline capture, LiDAR, ARKit, or recognition provider is implemented.
- Processing execution remains synchronous pending the dedicated worker slice.
- Approved snapshot API still returns the latest snapshot only.
- No visible commercial capture workflow is included.

## Exact next task

**Commercial Manual-Assisted Scanner V1 UI and workflow.**
