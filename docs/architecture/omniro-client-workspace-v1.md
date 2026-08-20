# OMNIRO Building — Client Workspace V1

## Discovery and reuse

The existing repository already owns Client records, Client → Property → Project relationships, Projects and Tasks, Documents, Finance invoices and payments, Commercial Estimates, Notifications, audit logs, optimistic versions, tenant RBAC, forced tenant RLS, project deep links, and the Role Workspace Registry. Client Workspace does not replace any of those authorities.

V1 adds only the missing access boundary and workflow records: authenticated user → client/project membership, explicit publication of existing Documents, project-scoped client requests, and version-aware client decisions. Client-facing reads are dedicated projections because the administrative list APIs are tenant-wide by design and must not be exposed to a client actor.

## Authority and access model

- `role != actor`: Client is resolved through the existing Role Workspace Registry and the authenticated actor keeps their real identity.
- A client actor sees only projects in an active `client_project_memberships` row for that actor.
- The backend re-checks membership for every project detail, request, and decision operation. The UI is not an authorization boundary.
- Client-visible Documents are existing Document records explicitly published through `client_project_documents`.
- Client estimates are only approved `approved_client` Commercial Estimate revisions. Their projection includes client totals and excludes internal cost, profit, margin, source rates, and company price-book internals.
- Invoice projection is constrained by tenant, client, project, membership, and non-deleted state. It exposes amount, dates, and payment status, not company accounting.
- A change request never mutates Work Scope. It becomes a project-scoped request for the responsible human authority.
- Client approval decisions are explicit, audited, optimistic-version protected, and tied to a concrete entity. AI cannot decide.

## Truth classification

REAL: assigned project list, project/task status projection, explicitly published Documents/evidence, approved client estimates, permitted invoices, client requests, client decisions, and recipient-scoped internal Notifications.

DERIVED: progress percentage, calculated deterministically from completed versus available project tasks. It is absent when there is no task basis.

PARTIAL: common Orchestrator / AI Secretary integration point. It may explain and open already permitted objects, but free-form or voice execution is not connected.

UNAVAILABLE: verified project correspondence, shared Calendar, shared Notes, weather provider, external Email/WhatsApp/Telegram adapters, online payment provider, and ephemeral multilingual Voice Bridge. No local Client substitute is created.

Scanner remains the common OMNIRO platform service. Client access can only be enabled through existing Scanner permissions, project context, and deep links; there is no Client Scanner implementation.

Voice conversation is an ephemeral platform stream by policy. OMNIRO does not record, store, or create an archive of voice conversations. Text correspondence, when a real shared provider exists, is a separate retained record.

## Visual boundary

V1 deliberately uses a safe responsive functional shell. It does not use Hero/demo/Core surfaces and does not claim to be the final Client composition.

**FINAL VISUAL = OWNER APPROVAL REQUIRED.**

## Future platform-wide dependencies

Shared correspondence, Calendar, Notes, Voice Bridge/translation, external communication providers, payment execution, and weather intelligence must be implemented once at platform level. They must preserve permissions, tenant/project context, provenance, audit, and explicit human authority.
