# Regional Pricing and Commercial Estimate Engine

This bounded context is the first OMNIRA module that owns money. It does not own geometry, construction intent, execution methods, engineering demand, product selection, or material quantities. Those facts enter only through approved, immutable snapshots.

## Authority chain

`Scanner → Work Scope → Technology → Knowledge → Norm → Material Consumption → Material Catalog → Regional Pricing → Commercial Estimate`

Regional Pricing owns effective, sourced labor, material, equipment, subcontractor, transport, and disposal rates. A pricing revision is scoped by country, optional region and city, customer category, commercial profile, currency, and effective period. It also owns explicit overhead, tax, margin, discount, and regional adjustment rules.

Commercial Estimate consumes one approved material-consumption snapshot and one approved pricing snapshot. It evaluates labor and equipment demand from the pinned approved engineering norm using the scanner-derived work quantity and evaluated parameters preserved by Material Consumption. Material quantities and selected product identities come only from the material-consumption snapshot.

## Calculation

For each component the calculation trace records the price-entry identity, source reference, unit, quantity, rate type, and unit price. Direct costs are labor, material, equipment, subcontractor, transport, and disposal. Applicable regional adjustments and overhead produce internal cost. Margin produces client price, discounts reduce net price, and the selected standard, reduced, zero, or reverse-charge tax mode produces VAT and gross price.

Manual margin or discount overrides require a reason and a human actor. OMNIRO analysis can report completeness, source snapshot identities, and negative profitability; it cannot mutate, review, or approve commercial data.

## Lifecycle and integrity

Both aggregates use `draft → review_required/ready_for_approval → approved`. Approvals create immutable fingerprinted snapshots. Estimate revisions supersede, but never rewrite, prior approved revisions; approved snapshots support revision comparison and future PDF, spreadsheet, offer, contract, procurement, purchasing, invoicing, and profitability projections.

All tables use tenant-keyed foreign keys, row-level security with `FORCE ROW LEVEL SECURITY`, optimistic revision versions, audit-log events, and database triggers that reject mutation or deletion of approved/superseded content and approved snapshots.

The older generic price-list and estimate tables remain unchanged for compatibility. They are not authoritative inputs to this bounded context.
