# Construction Knowledge & Engineering Norms Engine

## Authority boundary

This bounded context owns verified, manufacturer-independent construction knowledge and parameterized engineering demand rules. Scanner owns geometry; Work Scope owns construction intent; Technology owns execution method; this engine owns governing engineering rules and effort requirements. Material Catalog owns product identity and matching. Estimate owns money.

The engine never stores product, manufacturer, supplier, procurement, price, or commercial-cost fields. `material_requirement` demand records describe engineering requirements by stable requirement code; they do not select a catalog product.

## Authoritative flow

1. An engineer creates a country/region-scoped knowledge record containing methods, constraints, compatibility, environment, substrate, quality, inspection, acceptance, safety, and regulation statements.
2. A human reviewer submits and approves the immutable knowledge version.
3. A norm is created against an approved Technology version and approved Knowledge version for a work type, execution stage, and effective period.
4. Engineers define parameters, ordered layers, drying/inspection gates, and material-requirement, labor, and machine demand formulas.
5. Readiness requires a layer system and all three demand dimensions. Formula references must resolve to declared parameters.
6. A human approver creates an immutable authoritative snapshot.
7. Evaluation reads only an effective approved snapshot. Generic formulas use coefficients stored in that snapshot; business code contains no construction coefficients.

## Parameter and formula model

Parameters support decimal, integer, boolean, and enumerated values with required/default semantics and approved range constraints. V1 formulas are explicit linear formulas: `base + Σ(parameter × coefficient)`, optionally multiplied by the caller-supplied verified work quantity. Formula structure is code; all engineering values and coefficients are governed data.

## International isolation

Knowledge and norms use ISO alpha-2 country codes plus an optional region code. A norm may only reference approved knowledge from the identical country/region. No country behavior is hardcoded.

## Security and integrity

All eight tables use tenant-scoped foreign keys, row-level policies, and `FORCE ROW LEVEL SECURITY`. Draft content is mutable only through optimistic version checks. Approved knowledge, norm content, and snapshots are database-protected against update/delete. Approval permission is assigned only to tenant administrators and project managers and additionally requires a human actor. Every authority-changing action is audited.

## AI and OMNIRO

The analysis endpoint reports incomplete demand dimensions and invalid formula references without mutation. AI/OMNIRO can recommend and explain, but cannot create authoritative content or approve it. Weather comparison remains a downstream Construction Assistant responsibility; this engine exposes environmental rules for that future integration.

## Compatibility

The earlier `construction_norms` material-consumption catalog remains unchanged for existing Estimate workflows. It is not authoritative for this bounded context and should be migrated by a future compatibility project; silently reinterpreting its product-linked rows would violate ownership and snapshot guarantees.
