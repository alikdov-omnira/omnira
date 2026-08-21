# OMNIRO Voice Bridge V1

Voice Bridge is one platform-level, provider-neutral, stateless live voice service. It is not owned by Building, a role, Telegram, WhatsApp, Communication Hub, or an agent.

## Pipeline and authority

`Audio Input → SpeechRecognitionProvider → language context → TranslationProvider → SpeechSynthesisProvider → Audio Output`.

Voice Command reuses the same recognition port and passes only recognized text to the existing AI Secretary. The Orchestrator, permissions, provenance, and human-confirmation boundaries remain authoritative. Voice never grants additional rights.

## Privacy constitution

Recording is **PROHIBITED BY ARCHITECTURE**, not a future unavailable feature. Raw input, waveform, reconstructed output, translated audio, and ephemeral transcripts are never written to PostgreSQL, Documents, Communication Hub, logs, audit metadata, backups, or training stores. A bounded audio chunk exists in process memory only for one turn and is zero-filled in `finally`. The response audio is returned to the active client and is not retained by Voice Bridge.

Only action metadata is audited: session id, mode, participant count, languages, provider identifiers, project id when supplied, state transition, and technical counters. Conversation content is excluded. Session metadata is held only in process memory and removed on end; V1 adds no session table. Sessions expire after 15 minutes and accept at most 1,000 bounded chunks.

Text becomes durable only when the user explicitly invokes an existing authority such as Communication Hub draft, task, note, decision, or protocol. Those authorities apply their own lifecycle and approval rules.

## Providers and truth

The registry exposes independent recognition, translation, and synthesis ports. The first official adapter uses Azure Speech and Azure Translator REST APIs because they jointly cover real-time-oriented speech recognition, Polish/Russian multilingual translation, synthesis, and web/server/mobile deployment. OpenAI Realtime and native Apple adapters can be added later behind the same ports.

Architecture and tested pipeline: **REAL**. Azure adapter, live recognition, translation, and synthesis: **PARTIAL** until credentials and owner device verification are complete. Missing providers: **UNAVAILABLE**. Recording/storage: **PROHIBITED BY ARCHITECTURE**.

Required secrets: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`. `AZURE_VOICE_PROVIDER_VERIFIED=true` is set only after real two-way desktop and phone verification. Secrets and audio must never be logged.

## Access and future licensing

Permissions are `voice.use`, `voice.translate`, and `voice.command`. Every conversation participant is resolved through the existing tenant-aware `users` authority inside the normal RLS transaction; a missing, disabled, deleted, or cross-tenant participant is rejected. The `VoiceEntitlementPort` is distinct from permission checks and is the extension point for future Constructor/licensing/trial support; V1 does not create a parallel entitlement store.

## Clients

The web foundation requests the microphone only after an explicit Start action, supports start/stop, mute, language override, truthful states, and immediate playback. The mobile foundation defines a single platform audio adapter contract with permission, streaming input, playback, recovery state, and disposal. A native adapter must guarantee no file-backed recording before live mobile status can become REAL.

Machine translation is never presented as legal, engineering, commercial, or payment authority. Critical translated content must enter the existing structured proposal and human approval flow.
