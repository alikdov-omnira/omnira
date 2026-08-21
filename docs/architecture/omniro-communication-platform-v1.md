# OMNIRO Communication Platform V1

## Authority boundary

Communication Hub is the shared human-conversation authority for every Product World and role. It is not Notifications: Notifications project system events to authenticated recipients; Communication stores governed conversations and human-reviewed messages.

The platform chain is `User → AI Secretary → Orchestrator → Communication Agent → Communication Hub → Provider Adapter`. Inbound processing reverses that chain only after sender, tenant, client and project context are resolved. Ambiguous context remains unresolved and requires a human decision.

## Truth and providers

Telegram, Email, WhatsApp and future SMS implement one provider port. A configured and authenticated adapter may be `REAL`; a contract without authorization is `PARTIAL`; an absent operational connection is `UNAVAILABLE`. V1 ships no credentials and no sending provider, so every external channel is `UNAVAILABLE`. The Hub never fabricates provider IDs or reports `SENT` before a real adapter accepts a message.

Email envelopes reserve `to`, `cc`, `subject`, `body`, Documents attachment IDs and thread references. Telegram and WhatsApp map the same canonical envelope. Official providers can be added without changing Hub lifecycle or persistence.

## Human authority

All external outbound messages follow `DRAFT → READY_FOR_REVIEW → APPROVED_TO_SEND → SENT → DELIVERED`, with `FAILED` from approved/sent states. AI Secretary may create only a `DRAFT`. A permitted human performs review and approval. Sending requires separate authority and a `REAL` provider. Optimistic versions and provider idempotency keys prevent stale or duplicate actions.

## Isolation, provenance and attachments

Forced tenant RLS protects every table. Application access additionally requires project authority or active client-project membership. Clients receive only conversations for permitted projects; role permissions bound read/create/review/send/inbound resolution. Every state-changing action writes `audit_logs` without secrets. Provenance retains AI command, source references, human approval and provider state.

Attachments reference existing Documents records through composite tenant foreign keys. The Hub has no file store. Translation is a port; original text remains immutable and any translated representation is stored separately.

## Voice policy

Voice is not a communication provider. Future ephemeral voice input may produce text for the same command model. OMNIRO does not record, store or archive conversation audio as a platform principle. Text communication is stored separately.

## Visual status

The current Communication Center is a safe functional shell for threads, messages, channel truth, lifecycle, errors and linked context. **FINAL VISUAL = OWNER APPROVAL REQUIRED.**
