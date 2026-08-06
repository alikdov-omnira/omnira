# Material Consumption Engine

## Authority boundary

Material Consumption converts an approved Engineering Norm material requirement into approved quantities and governed packages. It never creates work, recalculates Scanner geometry, changes Technology or Norms, chooses a product automatically, stores prices, or creates an Estimate.

## Source chain

Each run pins an immutable approved Work Scope snapshot and approved Engineering Norm snapshot. The selected Work Scope item must be human-confirmed; its work type and approved Technology version must match the norm. Work quantity is copied from that item’s Scanner-origin quantity mapping. Norm parameters and coefficients are evaluated from the approved norm snapshot.

The approved Technology and Construction Knowledge versions referenced by the norm are also pinned on the run. Environmental requirements are copied from the approved Knowledge version and validated against the selected material's governed `environmentalLimits`; product limits must cover the required operating envelope.

The resulting draft initially contains only manufacturer-independent requirement lines. No product is assigned by creation or OMNIRO.

## Human selection and compatibility

A human selects an active Material Catalog entry. Its governed `technicalData` must declare:

- `engineeringRequirementCodes`
- `countryCodes`
- `compatibleTechnologyVersionIds`
- every engineering constraint required by the norm demand
- `packaging`: `type`, `size`, `unitCode`, `roundingRuleCode`, and `roundingRuleVersion`

Minimum constraints require product values at or above the norm; maximum constraints require values at or below it. Other values must match. Material and package units must equal the demand unit. This is validation of a human choice, not product ranking.

A substitution supplies the currently selected material as `substitutesMaterialId`, a different compatible replacement, and a human reason. The final plan approval authorizes the substitution.

## Quantity model

The engine preserves the net norm demand, then separately calculates:

- waste: engineering, cutting, and packaging percentages;
- reserve: transport, project, regional, and customer percentages;
- total: net + waste + reserve;
- remaining: total − referenced available quantity, floored at zero;
- package count and remainder using the governed package rule.

V1 supports `CEIL_FULL_PACKAGE`; both rule code and version are stored. Percentages and package metadata are governed inputs, never hardcoded construction values. Non-zero availability requires a source reference.

## Approval, security, and AI

Runs use optimistic revision versions and human-only selection/approval. Approved content and snapshots are database-immutable. All four tables use tenant policies and `FORCE ROW LEVEL SECURITY`; approval is limited to tenant administrators and project managers. Authority changes are audited.

OMNIRO reports missing selections, waste, reserves, remaining demand, and readiness risks. It never mutates a run or selects/substitutes a material. Pricing, suppliers, procurement, and commercial totals remain downstream concerns.
