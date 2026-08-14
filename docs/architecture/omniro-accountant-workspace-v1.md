# OMNIRO Accountant Workspace V1

Status: implementation candidate; awaiting human acceptance.

Accountant is the second active role projection in Layer 3. It reuses the approved Three-Layer Operating Environment, Role Workspace Registry, canonical Data Flow registry, existing application routes, and authenticated APIs. It creates no new accounting authority, backend API, schema, identity, or approval mechanism.

## Role and authority contract

The workspace is available only when the authenticated actor holds `finance.read`. `role != actor` remains invariant: switching from Director to Accountant changes the projection and deep link, never the session identity. Any mutation opened from the workspace remains subject to the existing Finance or module permission policy, optimistic version contract, audit behavior, RLS, and approval adapter.

The projection does not grant invoice issue, payment allocation/reversal, expense approval, Company Price Book approval, or Commercial Estimate approval. It links to the existing owning workspace only when the authenticated actor already has access.

## Grounded sources

The accounting projection consumes existing Command Center sources:

- invoices, lifecycle status, issue/due dates, amounts, client/project identifiers, and versions;
- payments, allocation balance, payment date, status, and versions;
- expenses, supplier/project identity, amount, lifecycle, and versions;
- project financial summaries returned by the Finance API;
- invoice/receipt Documents, OCR/analysis lifecycle, explicit entity links, and file versions;
- Tasks and dates;
- recipient-scoped internal Notifications;
- registered module lifecycle, evidence, and existing Approval Adapters.

The accounting inbox includes only records with a deterministic actionable condition: draft invoices, overdue issued/partially-paid invoices, received payments with an unallocated amount, draft expenses, failed processing for accounting documents, and permitted existing domain approvals. Each entry retains source entity/version provenance.

Document matching is `REAL` only for explicit document entity links. Filenames, titles, and OCR text are not used to invent a match.

## Truth and integration boundaries

- Loaded Finance/Documents/Tasks/Notifications records are `REAL` according to their source state.
- Counts, ordering, and briefing text are deterministic `DERIVED` projections.
- Accounting Assistant is `PARTIAL`: it prioritizes grounded records but cannot post, approve, reconcile, file, or provide tax advice.
- Payments are real internal records, but bank connectivity is `UNAVAILABLE`.
- KSeF, email, external messaging, voice, verified tax-law intelligence, and legal advice are `UNAVAILABLE`.
- Company balance, cash position, statutory tax position, filings, and external submission status are never inferred.

## Navigation, accessibility, and responsiveness

The route is `#omniro/role/accountant`. Active role buttons switch between Director and Accountant without a page-level identity change. Finance, Documents/OCR, Tasks, Notifications, Company Price Book, Commercial Estimate, and existing approval workspaces retain their existing route and permission behavior.

Native controls, headings, truth labels, keyboard focus, canonical flow identifiers/colors, reduced-motion behavior, and desktop/tablet/mobile composition remain inherited from the protected operating environment. Mobile prioritizes the accounting inbox, project financial state, and operational registers.

Production delivery remains governed by [OMNIRO Production Delivery Policy](./omniro-production-delivery-policy.md). This slice must not be deployed without separate explicit authorization.
