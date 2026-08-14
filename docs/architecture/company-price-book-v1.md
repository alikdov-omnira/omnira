# ADR: Company Price Book V1 authority boundary

## Status

Accepted for the Company Price Book V1 backend foundation.

## Decision

OMNIRO separates three commercial authorities:

1. **Regional Pricing** is external or regional reference context. It may be compared with company policy, but it never overwrites it.
2. **Company Price Book** is tenant-owned, human-approved company cost and selling policy.
3. **Commercial Estimate** is a project, client, and transaction-specific calculation result.

Legacy `price_lists` remain a compatibility material-price input for Estimate Engine V1. Labor Rates remain an independent estimating/reference source. Neither is the canonical Company Price Book authority, and migrations `013`, `016`, and `033` are not rewritten.

V1 supports manually maintained labor/work and material entries. Each entry stores internal cost and selling price. Margin amount and margin percentage are deterministic projections and are never independently editable.

Company Price Book revisions use `draft → review_required | ready_for_approval → approved`, with later revisions superseding earlier approved revisions. Cancellation is terminal for a draft/review revision. Only an authorized human may approve. Approved content and fingerprinted snapshots are immutable.

AI recommendations, imports, mappings, and regional comparisons are non-authoritative until an authorized human explicitly accepts and approves a Company Price Book revision. V1 does not implement import or AI price setting.

Commercial Estimate V1 remains unchanged. A later version may consume an explicitly selected approved Company Price Book snapshot. Historical estimates must continue to retain the exact authority, snapshot fingerprint, entry provenance, and calculation version originally used.

## Consequences

- Regional comparison is read-only and has no fallback or mutation path.
- Missing company prices fail explicitly; Regional Pricing is not an automatic fallback.
- Work, Material, and Measurement Unit catalogs remain identity/normalization authorities, not price owners.
- Client, project, and estimate-specific overrides are deferred and must later be separate, traceable records rather than mutations of base company prices.
