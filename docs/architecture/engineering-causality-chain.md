# Engineering Causality Chain (ECC)

ECC is a constitutional platform rule: OMNIRA never presents an engineering value without explaining why it exists.

## Authority chain

`Original evidence → Scanner measurements → Digital Room Passport → Work Scope → Technology → Construction Knowledge → Engineering Norm → Material Consumption → Regional Pricing → Commercial Estimate`

Module ownership is unchanged. ECC does not calculate geometry, demand, quantities, prices, schedules, or risk. It records and verifies the causal chain produced by those authorities.

## Stored value lineage

Approval of a commercial estimate atomically records a lineage row for every monetary field on every estimate line. The estimate approval fails when the chain cannot reach approved scanner/passport, work-scope, technology, knowledge, norm, consumption, and pricing authorities.

Each row stores the output object and value path, value and unit/currency, formula, dependency snapshot identifiers, confidence, revision, timestamp, operator, and an ordered array of source objects. Every source records its module, object identity, version, snapshot and fingerprint where applicable, approval identity and time, formula or rule, dependencies, confidence, revision, timestamp, and operator. The row is fingerprinted and append-only.

The explanation endpoint returns “This value exists because …” followed by the complete ordered chain. A missing value-lineage record is an error rather than an unexplained fallback.

## Change propagation

Database triggers observe new approved revisions of Spatial Room Passports, Work Scopes, Engineering Norms, Material Consumption, Regional Pricing, and Commercial Estimates. When a prior approved snapshot exists, ECC atomically records:

- the complete old and new approved content;
- the reason and operator;
- affected downstream modules and registered estimate values;
- affected material identities where present;
- schedule and risk reassessment requirements;
- an explicit human approval requirement.

Impact reports are honest dependency reports. `recalculation_required` means the owning downstream engine must create a new revision; ECC never silently mutates an approved result.

## Security and immutability

ECC tables use tenant-keyed relationships, RLS with `FORCE ROW LEVEL SECURITY`, audit-compatible human identities, SHA-256 fingerprints, and triggers rejecting update or deletion. OMNIRO and other readers may explain and analyze the chain but cannot create authority, change values, or approve revisions.

The current API exposes estimate-value explanations and project-filtered impact reports. The same registry is designed for later schedule, risk, recommendation, procurement, invoice, and profitability values without changing its constitutional rules.
