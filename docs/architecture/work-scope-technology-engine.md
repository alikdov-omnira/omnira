# Work Scope and Technology Engine

## Ownership

The engine answers two questions only: **what work will be performed** and **how the approved work will be executed**. Scanner remains authoritative for existing geometry and quantities. Norms will own material and labor requirements, Material Catalog owns products, Pricing owns regional prices, Estimate owns commercial totals, and OMNIRO owns explainable analysis.

The approved boundary therefore contains no product selection, material-consumption coefficient, package count, labor rate, tax, margin, price, or cost. It never updates Scanner records.

## Authoritative flow

1. A human defines a versioned technology containing execution method, ordered layers, optional thickness, drying stages, quality rules, inspections and safety notes.
2. A reviewer submits the technology for review; a human approver produces an approved technology version.
3. A Work Scope revision pins one or more immutable approved Spatial Room Passport snapshots and their fingerprints.
4. A human adds construction work intent to a verified target and selects an approved technology version.
5. A reviewer confirms or rejects each item. Nothing is assigned automatically.
6. Each geometry-dependent item maps to an allowed quantity type already present in its pinned Scanner snapshot. The Scanner value, unit, formula and calculator version are retained unchanged.
7. Dependencies define finish-to-start, drying, inspection or safety order. Readiness rejects missing targets, missing mappings, unconfirmed intent, wrong order and cycles.
8. A human approver creates the immutable `work-scope-v1` snapshot.

## Target model

Targets support project, building, building floor, apartment, room, wall, ceiling, floor, door, window, opening, column, beam and custom element. Room, wall, ceiling, floor, door, window and opening references must exist in a pinned approved room passport. Wider building targets are stable external references until a dedicated building-element registry is introduced.

## Quantity mapping

Mappings are explicit and allow-listed. Examples include painting to verified wall/ceiling paint area, wallpaper to wallpaper area, tile to verified tile area, flooring systems to flooring area, plaster systems to their net wall areas, waterproofing to verified wall/floor waterproofing area, and drywall to verified drywall/suspended-ceiling area. Work such as demolition or cleaning may exist without a Scanner quantity until a reviewed measurement source is defined.

No formula runs in this context. A mapping persists the exact approved Scanner value and provenance so downstream Norms can later calculate requirements reproducibly.

## Dependency graph

The graph is directed and deterministic. Every dependency must reference two active items in the same revision. Self-dependencies, missing nodes, circular paths and predecessor sequences that do not precede successors are blocking errors. The approved output includes the topologically resolved execution sequence plus the original dependency edges.

## Security and audit

Migration 030 introduces forced tenant RLS on all technology, scope, dependency, mapping and snapshot tables. Mutations run in tenant-scoped transactions and require optimistic revision versions. Approval is restricted to human actors with `work_scopes.approve`. Creation, review, mapping, readiness and approval emit audit records. Approved snapshots and approved revision content are immutable by database trigger.

## AI and OMNIRO boundary

AI and OMNIRO may later recommend missing work, mismatched technology, incomplete scope or sequence changes. Recommendations must be stored separately as proposals. They cannot create, confirm, map, order or approve a scope item. This V1 exposes no automatic-assignment endpoint.

## Current limitations

- Technology authoring is project-independent and tenant-owned; jurisdiction/company-standard variants are future version metadata.
- Building, apartment, column and beam references are not yet backed by a dedicated building-element registry.
- Successor revisions and technology supersession are represented in the schema lifecycle but are not exposed by V1 REST routes.
- Norm, consumption, material, commercial and scheduling execution are intentionally outside this slice.
