# OMNIRO Project Manager Workspace V1

## Decision

Project Manager is a REAL Layer 3 role projection inside the approved OMNIRO Operating Environment. It is not a new backend authority and does not replace the authenticated actor.

The route is `#omniro/role/project-manager?project=<project-id>`. The project query selects an existing tenant-scoped Project context; role switching and project switching preserve the same actor and existing deep-link architecture.

## Source authorities

The projection reads only existing REST/RBAC-backed records:

- Project and Project Manager assignment;
- project Tasks, assignees, lifecycle and deadlines;
- explicitly linked Documents/OCR versions and processing state;
- Room Scanner, Work Scope, Engineering Norms, Material Consumption, Regional Pricing comparison, Company Price Book and Commercial Estimate runtime adapters;
- existing domain approval adapters;
- project financial summary;
- recipient-scoped internal Notifications and Users.

No value is derived from filenames. No completion percentage, company profit, cash position, budget variance, construction approval or live-market state is synthesized.

## Operational projection

Attention is deterministic and project-scoped. Each item answers WHAT, WHY, WHERE when known, WHO or `UNASSIGNED`, deadline or `Not available`, lifecycle status, target and exact provenance. Task, document and module attention identifiers use the underlying entity ID and version. A required decision opens the existing permitted authority workspace; when the actor lacks that authority, the same item is marked `DIRECTOR DECISION REQUIRED`. The workspace creates no duplicate approval.

Work Scope, materials, commercial calculation and finance retain their own authority boundaries. Regional Pricing remains comparison-only where declared by the Commercial Estimate contract. Company Price Book remains the tenant-owned commercial pricing authority. The role workspace does not mutate these records.

## Truth and assistance

- Orchestrator: `DERIVED`, deterministic from current records and registered flows.
- Project Assistant: `PARTIAL`, grounded briefing only; no autonomous execution.
- Change awareness: `PARTIAL`, record versions/timestamps only; no complete event-history reader.
- Drawing intelligence: `UNAVAILABLE`.
- OMNIRO Internal notifications: `REAL` when permitted.
- Email, WhatsApp, Telegram and Voice: `UNAVAILABLE`.

## Security

The workspace reuses backend RBAC, tenant RLS, audit, optimistic locking and approval adapters. It introduces no endpoint, migration, permission or authority. Temporary delegation is not implemented. `role != actor` is shown in the UI and all mutations continue through existing actor-attributed paths.

## Responsive and accessibility contract

The existing Layer 3 shell, canonical Data Flow IDs/colors, keyboard semantics, reduced-motion behavior and responsive composition are preserved. Desktop uses task-first operational columns; tablet/mobile collapse to a single readable flow without horizontal application overflow.
