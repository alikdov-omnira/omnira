# OMNIRO Worker Workspace V1

Worker is an active Role Workspace projected through the existing Role Workspace Registry. It does not impersonate an actor and does not introduce a second task, document, scanner, material, communication or approval authority.

## Real authority

- `tasks` remains the lifecycle authority. An assigned actor with `tasks.self_update` may start/resume and submit only their own task. `tasks.review` is the independent foreman authority for accept/return. Every mutation is optimistic, audited and tenant-scoped.
- `documents` remains the proof authority. Evidence is uploaded and read through task links.
- `task_field_reports` is the minimal task-owned field-problem record required to route real blockers and missing-material reports. It has composite tenant foreign keys, forced RLS, optimistic versions, audit/outbox events and no procurement semantics.
- Room Scanner remains the single shared OMNIRO platform service. Worker access is only an integration state governed by existing permissions, project/task context and existing routes/deep links; a Worker-specific Scanner must never be created.

## Truth boundaries

- Object location is `PARTIAL`: the workspace extracts an existing location/room/zone statement from the task instruction. No geometry is invented.
- Materials are `PARTIAL`: project Material Consumption exists, but no authoritative task-to-requirement or issue/receipt mapping exists. Prices, margin, suppliers and procurement terms are never exposed.
- Correspondence, shared Notes and QR/barcode decoding are `UNAVAILABLE`. Live multilingual voice translation integration is currently `UNAVAILABLE`, but recording is not a missing capability: OMNIRO voice conversation is an ephemeral live stream by platform policy. Conversation audio is never recorded, persisted or archived. Text correspondence is stored separately through its own authority.
- AI Secretary integration is `PARTIAL` and deterministic. Worker does not own a separate AI system: the shared Orchestrator / AI Secretary receives role context, project context, permissions and provenance, and cannot accept work, change commercial values or exercise foreman authority.

## Visual status

The mobile-first shell extends the existing Worker frontend slice and the approved dark OMNIRO visual language. It does not use Hero, OMNIRO Core demo, public/demo-root or arbitrary legacy surfaces. No repository-backed binding Worker visual reference was found, so the current safe functional shell is preserved and `FINAL VISUAL = OWNER APPROVAL REQUIRED`.
