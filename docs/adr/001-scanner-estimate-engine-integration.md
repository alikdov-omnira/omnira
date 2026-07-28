# ADR 001: Scanner and Estimate Engine Integration

Status: Accepted for foundation.

## Context

Room Scanner and Estimate Engine are parts of one workflow but own different decisions. The existing Estimate Engine V1 directly combines work quantities, construction norms and price-list items. It must be evolved without introducing a parallel estimate aggregate or breaking current REST behavior.

## Decision

- Scanner owns verified facts about the property. It does not select technology, norms, resources, suppliers or prices.
- Technical Assignment owns requested outcomes.
- Technology Engine owns execution methods, sequencing, alternatives and contextual thresholds.
- Norm Catalog owns versioned consumption and productivity rules.
- Pricing Engine owns contextual, regional and company prices. Prices remain external to source code, technology templates and norm definitions.
- Estimate Engine owns the explainable, versioned composition and commercial document.
- Only an immutable `ApprovedRoomScanSnapshot` may produce an `ApprovedScanQuantitySet` for final estimating.
- Draft scans, raw LiDAR/device payloads, photographs and unreviewed AI proposals cannot cross the boundary.
- Approved estimate versions must retain immutable references or snapshots of scan, assignment, technology, norm and price versions.
- Company overrides preserve the base value, reason, approver and effective period.
- AI may propose classifications, scope or technology but cannot approve technical or commercial decisions.
- Universal construction thresholds must not be hardcoded. They belong to versioned, jurisdiction-aware technology rules.
- Missing prices produce `price_pending`; they do not remove quantity lines or block a quantity estimate.

## Boundary

`ApprovedRoomScanSnapshot → ApprovedScanQuantitySet → ResolvedWorkScope → TechnologyDecisionSet → QuantityEstimate → PricedEstimate`.

Scanner never calls `PriceResolverPort` or `EstimateDraftGeneratorPort`, and never creates Estimate, material, labor or equipment records.

## Migration path

Keep Estimate Engine V1 operational. Add future `EstimateVersion`, resolved-scope, technology-decision and requirement models in separate reviewed stages. Adapt existing norm and price-list records behind the new resolver ports, then migrate current estimate items without changing verified behavior.

## Consequences

The pipeline remains reproducible and explainable. Quantity calculation can succeed without prices. Technology, norms and prices can evolve independently while previously approved estimate versions remain unchanged.
