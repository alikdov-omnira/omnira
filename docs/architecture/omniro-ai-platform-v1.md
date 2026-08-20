# OMNIRO AI Platform V1

## One platform authority boundary

OMNIRO uses one shared chain for every role and Product World:

`authenticated actor → AI Secretary → Orchestrator routing → registered specialist agent → existing authority adapter → grounded result → existing human authority`

The AI Secretary is the text interface and the future ephemeral voice interface. Both use the same command model. Voice is currently `UNAVAILABLE`: no provider is connected, and voice audio is never recorded, stored or archived. Role workspaces do not own separate AI systems.

The Orchestrator routes a command; it does not grant permissions or create authority. The actor's tenant, user, project and permission context is preserved through execution. Registered agents may only find, explain, analyze, draft, recommend or prepare an action. They cannot send, approve, reject, sign, pay, change price/scope, make a final legal commitment, or make a final engineering decision.

## Agent Registry

The shared registry contains Project Analyst, Document, Finance, Legal, Engineering, Communication, Support and Calendar/Notes agents. Definitions declare capabilities, required permissions and truth. They are never cloned per role. `Calendar / Notes` remains `UNAVAILABLE`. Communication is `PARTIAL`: a draft can be prepared, but Email, WhatsApp and Telegram providers are not connected. Legal is `PARTIAL`: grounded drafting is supported, external legal intelligence and autonomous legal authority are not.

## Grounding and documents

Every stored command records project context, selected agent, intent, truth state, permission context and source references. Source references include entity type/id, version, status, timestamp and provenance where available. Document resolution is project-linked, permission-bound and current-version aware. Requests for an approved document require approved review data; Client access is additionally restricted to explicitly published project documents. A missing source produces `Insufficient data` rather than inference.

Contract and message output is stored only as a non-authoritative AI action draft with `requires_human_approval = true`. No send or generic approval endpoint exists. Editing/finalization must use an existing authoritative UI and its own permission/approval model. Original documents and immutable snapshots are never mutated by the AI platform.

## Security, audit and UI

Forced RLS scopes commands and drafts to the requesting tenant/user. Composite tenant foreign keys bind users, projects and commands. Application execution runs in a user-scoped tenant transaction. AI permissions do not replace the downstream authority permission; Client project membership and publication are checked explicitly.

Each processed command adds an `audit_logs` record containing actor, selected agent, intent, referenced entity/version identifiers, created draft identifier and `humanConfirmation: false`. Request text is stored for audit; voice audio cannot be logged because it is never accepted or stored.

The Web integration is one functional panel opened from the existing Operating Environment header. Grounded results open existing Documents, Finance or registered module workspaces through existing callbacks/deep links. No new arbitrary page or final visual shell is introduced. `FINAL VISUAL = OWNER APPROVAL REQUIRED`.

## Truth state

- `REAL`: deterministic access to existing Project, Document, Finance and authority records.
- `DERIVED`: explanations and attention summaries derived only from referenced records.
- `PARTIAL`: contract/message drafts and legal/communication assistance that require missing providers or human review.
- `UNAVAILABLE`: voice provider, Calendar, Notes, Email, WhatsApp and Telegram.

Weather remains source-bound through the existing Construction Assistant. The AI platform never fabricates weather and does not claim forecasts unless an existing verified source is present.
