# OMNIRO Director / Owner Workspace V1

Status: implementation candidate; awaiting human acceptance.

This slice fills Layer 3 of the approved OMNIRO Three-Layer Operating Environment. It does not create a new dashboard, identity, authorization system, approval authority, event bus, or backend API.

## Role projection contract

The Role Workspace Registry describes a reusable projection through:

- `roleId`, label, and category;
- required existing permissions;
- available registered modules;
- primary actions and attention sources;
- assistant and communication capabilities with explicit truth;
- temporary-assignment support;
- implementation status.

`role != actor` is constitutional. The authenticated session actor remains the actor for navigation and every mutation performed inside an existing domain workspace. The Director projection cannot impersonate another user, bypass RBAC, or approve outside an existing module Approval Adapter.

Director / Owner is the first active role workspace. Future roles are registered as `UNAVAILABLE`, which preserves an extension path without implying implementation.

## Grounded sources

The Director projection uses existing authenticated sources only:

- Projects and project manager responsibility;
- Tasks, due dates, assignees, blocked/overdue lifecycle;
- Documents and failed OCR/analysis lifecycle;
- recipient-scoped internal Notifications;
- tenant-scoped Users available under existing RBAC;
- project Finance summaries;
- the Building Module Registry, Flow Registry, Workspace Registry, runtime adapters, evidence references, and Approval Adapters;
- Company Price Book and Commercial Estimate project authorities already loaded by the Command Center.

Priority actions state what, why, where, urgency, responsibility when authoritative, and provenance. A missing assignment remains explicit. Decisions are projected only when an existing Approval Adapter detects a permitted approval requirement; the decision opens that existing workspace and never implements generic approval.

## Truth boundaries

- Portfolio counts, task/document state, notifications, users, finance summaries, and module lifecycle records are `REAL` when loaded.
- Cross-source counts and deterministic briefings are `DERIVED`.
- Task/project deadlines form a `PARTIAL` calendar; no complete Calendar backend exists.
- The Economic Analyst may describe an explicit project Commercial Estimate calculation. It cannot claim company accounting profit.
- Contract/permit documents are visible, and backend audit enforcement remains in place. No Director audit-log reader or verified external legal-intelligence source exists, so legal/compliance intelligence is `PARTIAL`.
- OMNIRO Internal notifications may be `REAL`. Email, WhatsApp, Telegram, and voice remain `UNAVAILABLE` until real providers exist.
- Temporary access remains `UNAVAILABLE` until a backend authority can bind user, project/workspace, permission scope, and time interval with audit.

No synthetic KPI, executive revenue, cash position, margin, event, assistant reasoning, communication, or legal update is used as fallback.

## Navigation and accessibility

Director actions reuse the existing route model. Module actions retain exact project context and enter the existing Focus/System or lazy Agent Workspace. Task, document, finance, reports, notifications, projects, Scanner, Company Price Book, and Commercial Estimate reuse their current application surfaces.

The approved canonical flow IDs/colors, Universe, Product World, mobile shell, reduced-motion behavior, native button semantics, truth labels, and keyboard focus remain intact. Mobile prioritizes actions and decisions before lower-priority organizational context.

Production delivery remains governed by [OMNIRO Production Delivery Policy](./omniro-production-delivery-policy.md). This slice must not be deployed without separate explicit authorization.
