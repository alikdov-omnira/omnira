# OMNIRA public experience

## Purpose and boundary

The public website is the unauthenticated first layer of OMNIRA. It introduces OMNIRO and OMNIRO Building without reading tenant data. `/#login` enters the existing authentication flow; authenticated hash routes and permissions remain owned by the operational application. Representative public values are isolated, labelled illustrative data.

## Architecture and content governance

`public-registry.ts` is the authority for capability maturity, repository evidence, Building stages, learning entries, semantic energy flows, future galaxies and investor statements. Presentation components consume that registry. Product states are `available`, `foundation`, `in_development`, `planned`, `vision` and `unavailable`.

A capability may be published as “OMNIRO learned…” only when all of these are true:

1. Repository code and tests demonstrate the behavior.
2. The registry entry has evidence references.
3. Its status is `available` or `foundation`.
4. A learning entry names the related capability and release/commit reference.
5. Product authority approves the public wording.
6. Registry and browser tests pass in the same commit.

Planned, vision and unavailable entries use future language and cannot pass `capabilityCanBeLearned`.

## Visual identity and hierarchy

OMNIRO is the central orchestrator/star and remains visibly present. OMNIRA is the complete platform/universe. OMNIRO Building is the first active commercial galaxy. Building modules are capabilities inside that galaxy. Legal, Finance, Manufacturing, Logistics, Healthcare, Agriculture and Energy are distant vision galaxies, not operational products.

OMNIRO has no human face, mascot or autonomous authority. Motion can be disabled; textual equivalents remain.

## Energy-stream semantics

Every registered stream has an origin, destination, semantic type, state, explanation and related capability. Types distinguish verified data, commands, recommendations, approval requests, completed calculations, warnings, unavailable dependencies and governed transitions. Illustrative streams never claim live processing. Unavailable dependencies are paused and explicitly explained.

## Sound and visitor control

Sound never autoplays. The birth sequence offers Start with sound and Start silently. Generated symbolic tones contain no recorded voice or infant audio. Mute, captions, pause/resume, replay, skip and static experience controls are available. Sound is unnecessary to understand any content.

## Accessibility and responsive behavior

The experience uses semantic landmarks, headings, native disclosure controls, visible focus, textual maturity labels and accessible flow descriptions. `prefers-reduced-motion` initializes static mode. The experience works without sound, WebGL, canvas or GPU features. Mobile controls support touch and safe responsive layouts; installation is optional.

## Entry and PWA behavior

Desktop and mobile enter the same responsive authenticated web application. No native app or deep-link scheme is claimed. The manifest and service worker enable a lightweight PWA shell in production. Install guidance directs users to browser-provided installation only. No token or tenant state is placed in URLs or QR codes.

## Investor and privacy policy

`#investor` explains the problem, current product, reusable core, commercial chain, expansion model, moat and next milestone. It contains no confidential projections, invented customers, traction or dates. Contact uses the existing mail action. No analytics provider is connected; optional analytics preference is off by default and collects nothing.

## Performance and known limits

The cinematic layer uses CSS and semantic HTML with no video, WebGL or bitmap payload. Production builds currently warn that the combined operational application chunk exceeds 500 kB minified. Route-level separation of the public and authenticated application is the recommended performance slice. The service worker caches only the shell and local brand assets.

## Content update workflow

Update capability evidence and maturity in `public-registry.ts`, add or revise associated Building/flow/learning/investor records, update translations, run registry tests, web checks and Chromium E2E twice, then obtain product approval. Never edit animation code merely to change a product claim.
