# ODLS Platform

Production-oriented monorepo skeleton for the ODLS service-business operating system. It contains architectural boundaries and runtime foundations only; no business-domain implementation is included.

## Applications

- `apps/api-gateway`: public API edge, authentication boundary, correlation, logging, and service routing.
- `services/core-service`: domain-service template with dependency injection, configuration, health checks, and API module boundary.
- `apps/web`: React web application shell.
- `apps/mobile`: Expo/React Native mobile application shell.
- `packages/contracts`: shared, dependency-free API contracts.
- `packages/platform`: shared configuration, logging, DI, and authentication abstractions.

## Local use

1. Copy `.env.example` to `.env` and set real secrets outside source control.
2. Run `npm install`.
3. Run `npm run typecheck` and `npm test`.
4. Start `npm run dev:core`, `npm run dev:gateway`, or `npm run dev:web`.

The gateway exposes `GET /health`, `GET /ready`, and the versioned API root `/public/v1`. Core service exposes health routes and a placeholder `/internal/v1` module boundary.

## Guardrails

- Domain modules own their data and are added as isolated services/packages; never bypass an API boundary with shared database access.
- Authentication and authorization are enforced at both the gateway and service layer.
- Structured logs, correlation IDs, and configuration validation are mandatory at startup.
- Secrets are references/configuration injected at runtime, never committed to the repository.
