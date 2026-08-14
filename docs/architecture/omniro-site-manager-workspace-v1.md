# OMNIRO Site Manager / Foreman Workspace V1

## Boundary

The Site Manager Workspace is a field-first projection over existing OMNIRO authorities. It introduces no backend, schema, permission, issue, approval, procurement, Scanner, weather, communication or AI authority. The typed Role Workspace Registry remains the single role extension point.

`role != actor`: opening the workspace never impersonates a foreman. Every mutation continues through the authenticated actor and existing backend RBAC, tenant RLS, audit and optimistic locking.

## Grounded sources

- Project context and project-aware deep links reuse the Project Manager route contract.
- TODAY, OVERDUE, BLOCKED, DONE and UPCOMING are deterministic projections of project-scoped Task records. Location is displayed only when explicitly encoded in the current task description; otherwise it is `Not available`. Missing assignees remain `UNASSIGNED`.
- Work rows reuse Work Scope items and scanner quantity mappings with scope/item/snapshot/formula provenance. No second scope engine is introduced.
- People reuse task assignees, Users and the project manager reference. Worker Workspace remains registered and `UNAVAILABLE`.
- Documents are included only through explicit project links. Version, processing state, filename and checksum remain visible. Approval for construction and drawing intelligence are `UNAVAILABLE`.
- Scanner uses the existing Module Registry runtime and workspace route unchanged.
- Materials reuse Material Consumption lines, quantities, units, waste, reserve and selection state. Procurement is not performed.
- Site attention reuses task state, document failures and module lifecycle. Escalation opens the same entity/version/provenance through Project Manager or existing Director authority; it creates no duplicate problem or approval.

## Assistance and communication truth

Orchestrator briefing is deterministic. Site Assistant and Engineering Assistant are `PARTIAL`; they explain loaded state but do not execute work or invent events. OMNIRO internal recipient-scoped notifications are `REAL` when permitted. Email, WhatsApp, Telegram and Voice Bridge remain `UNAVAILABLE`. Voice Bridge is documented as a future global multilingual SaaS capability; it is not implemented and calls are not stored.

Operational weather intelligence is documented only. A future authority may combine project location, planned work and weather conditions. No decorative weather widget or weather warning is fabricated in V1.

## Canonical flows

The global flow registry remains unchanged: `01 Financial`, `02 Project`, `03 Document`, `04 Communication`, `05 Compliance`, `06 Analytics`, `07 Procurement`, `08 People`. The field workspace emphasizes `02`, `03`, `04`, `05`, `07` and `08`, while runtime truth continues to determine which flows are active.
