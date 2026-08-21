# OMNIRO Telegram Provider V1

Telegram is an adapter of the shared Communication Hub. It does not own conversations, messages, attachments, approval, audit, tenant context, or AI authority.

## Boundaries

- Outbound follows the existing `DRAFT → READY_FOR_REVIEW → APPROVED_TO_SEND → SENT / FAILED` lifecycle. The adapter is called only from `APPROVED_TO_SEND`; `SENT` requires a real Bot API `message_id`.
- Telegram does not provide a dependable delivered/read receipt contract, so OMNIRO never fabricates `DELIVERED` or read state for outbound Telegram messages.
- Inbound updates use the official webhook secret header and `update_id` idempotency. Only an exact, verified tenant-aware user/chat identity mapping can attach a message to an actor, client, or project. Unknown and ambiguous identities remain unresolved and are not guessed.
- Attachments are downloaded from Telegram only after verified routing and stored through the existing Documents authority. No Telegram file store is introduced.
- AI Secretary may prepare a Telegram draft through the existing Communication Agent and Hub. It cannot approve or send it.
- Audit, RBAC, RLS, provenance, optimistic versioning, and project/client authority remain owned by existing platform services.

## Truth

The adapter is `PARTIAL` unless `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` are configured and `TELEGRAM_PROVIDER_VERIFIED=true` after owner verification of real outbound, inbound, reply, attachment, and failure behavior. Configuration alone must not be presented as `REAL`.

## Provider configuration

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_PROVIDER_VERIFIED=false`

The provider webhook is `POST /api/v1/communications/providers/telegram/webhook`. Telegram must be configured to send `X-Telegram-Bot-Api-Secret-Token` with the exact secret. Secrets must remain in environment/secret storage.

Telegram identity mappings are created pending and explicitly verified by an actor holding `communications.inbound.manage`. They bind exact Telegram user and chat identifiers to an existing tenant-owned actor or client, optionally scoped to an existing project.
