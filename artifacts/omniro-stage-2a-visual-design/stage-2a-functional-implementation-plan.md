# OMNIRO Stage 2A — Complete Functional Implementation Plan

Status: **FUNCTIONAL IMPLEMENTATION APPROVED / BASELINE FROZEN**
Visual source of truth: approved A2–L2 plus `design-review-refinement.md`.
Production scope: authenticated Building Command Center shell over currently connected sources only.

## 0. Non-negotiable boundary

Stage 2A connects Project, Room Scanner, Technical Assignment and Design Project. Documents and Tasks remain contextual destinations. Work Scope, Technology, Engineering Norms, Material Consumption, Regional Pricing and Commercial Estimate are registered but `UNAVAILABLE`.

There will be no new backend endpoint, workflow engine, approval authority, database change, generative reasoning, or Stage 2B integration. A visible payload is either grounded in current records and labeled `DERIVED`, or absent. The approved Estimate causality geometry remains an unavailable semantic contract until later data sources are explicitly approved.

## 1. Existing production components reused exactly

| Existing production code | Reuse |
|---|---|
| `App`, `Login`, `Brand` — `apps/web/src/app.tsx` | Session validation, sign-in/out, company loading, route ownership. |
| `api`, `auth`, existing DTOs — `apps/web/src/api.ts` | Sole REST/auth transport; no parallel client. |
| `ProjectWorkspace`, `WorkspaceTab`, `StatusBadge`, `LoadingState`, `ErrorState`, `EmptyState`, `hasPermission` — `apps/web/src/construction-ui.tsx` | Secure workspace destinations, semantic states, permission checks. |
| `RoomScannerCommercial` — `apps/web/src/room-scanner-ui.tsx` | Existing Scanner operation and approval UI. The Command Center does not duplicate mutations. |
| `SpatialRoomScanner` — `apps/web/src/spatial-room-scanner-ui.tsx` | Existing real spatial evidence editor/viewer inside Scanner workspace content. |
| `LocalOrchestratorInterpreter` — `apps/web/src/omniro-interpreter.ts` | Existing deterministic command interpretation. |
| speech adapters — `apps/web/src/omniro-speech.ts` | Existing browser capability/fallback boundary. |
| stable graph IDs and record composition — `apps/web/src/omniro-model.ts` | Input to the new registry runtime projection. |
| deterministic presentation and renderer-mode functions — `apps/web/src/omniro-scene-model.ts` | Extended into common interaction state, not replaced by hidden inference. |
| `EarthRendererBoundary` pattern — `apps/web/src/living-earth.tsx` | Renderer failure containment; Living Earth itself is not the project topology. |
| frozen `OmniroStageScene` export | Read-only continuity reference at the authentication transition only; never operational truth. |

## 2. Five separated architectural concerns

```text
ModuleDefinition registry       What capabilities exist
          ↓
ModuleRuntime adapter           What this project currently says
          ↓
FlowDefinition + FlowRuntime    What relationship is supported now
          ↓
Common spatial/DOM renderer     How state, focus, payload and gates appear
          ↓
Workspace registry              What real module UI is opened in the shared frame
```

Business workspaces cannot import or command the global renderer. They return domain UI and structured adapter results. The renderer consumes only shared contracts. Runtime state cannot modify the static registry. Flow state is computed from registered relationships plus loaded authoritative data; it is not an event log.

## 3. Reusable module contract

Create `apps/web/src/omniro-module-contract.ts` with compile-time contracts equivalent to:

```ts
type OmniroTruth = "REAL" | "DERIVED" | "PARTIAL" | "UNAVAILABLE";
type OmniroLifecycle =
  | "IDLE" | "APPROACH" | "FOCUS" | "RECEIVE" | "PROCESS"
  | "OUTPUT" | "WAIT" | "APPROVAL_REQUIRED" | "APPROVED"
  | "COMPLETE" | "CONFLICT" | "BLOCKED";

interface OmniroModuleDefinition<TRaw, TState> {
  id: string;
  label: string;
  entityType: string;
  visual: OmniroVisualIdentity;          // geometry/glyph/depth, not business code
  defaultTruth: OmniroTruth;
  permissions: { read: string[]; enter?: string[]; approve?: string[] };
  inputs: OmniroPortDefinition[];
  outputs: OmniroPortDefinition[];
  runtime: OmniroModuleRuntimeAdapter<TRaw, TState>;
  workspace?: OmniroWorkspaceReference;
  approval?: OmniroApprovalAdapter<TState>;
  explain?: OmniroExplanationAdapter<TState>;
  processingVisual?: OmniroMicroAnimationKey;
  mobile: OmniroMobileRepresentation;
  accessibility: OmniroAccessibilityDefinition;
}
```

The definition includes ID, label, entity/domain type, truth default, lifecycle mapper, typed inputs/outputs, permissions, data-source adapter, topology ports, workspace reference, optional approval and explanation adapters, optional processing micro-animation, mobile treatment and accessibility semantics.

`OmniroModuleRuntimeAdapter` owns permission-aware loading/selection and maps raw records to the common runtime state:

```ts
interface OmniroModuleRuntimeState<TState = unknown> {
  moduleId: string;
  projectId: string;
  truth: OmniroTruth;
  lifecycle: OmniroLifecycle;
  availability: "available" | "partial" | "unavailable";
  recordRef?: { entityType: string; entityId: string; version?: number };
  observedState?: TState;
  reason: string;
  evidence: OmniroEvidenceRef[];
  updatedAt?: string;
}
```

No module receives direct Three.js objects or CSS selectors.

## 4. Common interaction lifecycle

The shared visual state machine is:

```text
IDLE → APPROACH → FOCUS → RECEIVE → PROCESS → OUTPUT
                     └→ WAIT → APPROVAL_REQUIRED → APPROVED → COMPLETE
                              ├→ BLOCKED
                              └→ CONFLICT
```

Transitions are presentation transitions driven by current registered runtime state or explicit UI selection. They do not claim server execution.

Common rendering owns breathing, repositioning, selection scale, payload arrival/absorption, suspension, gate activation, downstream dimming, conflict treatment and completion settling. A module may select a registered micro-animation key such as `scanner-evidence-sweep`, `rule-validation`, `calculation-convergence`, `document-reading` or `insight-formation`. Micro-animations receive lifecycle progress and quality tier only; they cannot mutate data or create flows.

Stage 2A registers only Scanner’s evidence sweep as a live-capability visual. Future animation keys may exist as types, but unavailable modules do not animate processing.

## 5. Module registry architecture

Create `apps/web/src/omniro-module-registry.ts` as a generic immutable registry with validation for duplicate IDs, missing ports, unknown workspace references and missing accessibility labels.

Create `apps/web/src/omniro-building-modules.ts` containing declarative registrations:

- `project` — REAL nucleus source;
- `room-scanner` — REAL when permitted/source available;
- `technical-assignment` — REAL when permitted/source available;
- `design-project` — REAL when permitted/source available;
- `work-scope`, `technology`, `engineering-norms`, `material-consumption`, `regional-pricing`, `commercial-estimate` — UNAVAILABLE registrations with no data loader/workspace action;
- `analytics` is not promoted to an authority-chain module in Stage 2A unless an already loaded, specifically approved source can ground it; otherwise UNAVAILABLE;
- Documents and Tasks are registered as `context` affordances, not engineering authority nodes.

Registry order supplies the engineering chain; renderer placement uses topology metadata, not module-specific JSX branches.

## 6. Declarative semantic flow registry

Create `apps/web/src/omniro-flow-contract.ts`:

```ts
interface OmniroFlowDefinition<TPayload = unknown> {
  id: string;
  source: { moduleId: string; output: string };
  destination: { moduleId: string; input: string };
  relation: "authority" | "dependency" | "derivation" | "context";
  payloadType: string;
  defaultTruth: OmniroTruth;
  resolve: OmniroFlowRuntimeAdapter<TPayload>;
  approvalBoundary?: OmniroApprovalBoundaryReference;
  explain: OmniroFlowExplanationAdapter;
}

interface OmniroFlowRuntimeState {
  flowId: string;
  truth: OmniroTruth;
  state: "idle" | "available" | "selected" | "traveling" | "suspended" | "blocked";
  payload?: { type: string; recordRefs: OmniroEvidenceRef[] };
  reason: string;
  evidence: OmniroEvidenceRef[];
}
```

Create `apps/web/src/omniro-building-flows.ts` for declarative relationships. Stage 2A may activate only relationships provable from loaded Scanner/Technical Assignment/Design Project snapshot references. Other chain connections remain registered with `UNAVAILABLE` truth and no payload. A flow is never presented as a persisted runtime event; derived relationships display `DERIVED FROM CURRENT RECORDS`.

Adding a future flow requires a definition and adapter, not renderer edits.

## 7. Workspace registry architecture

Create `apps/web/src/omniro-workspace-contract.ts` and `apps/web/src/omniro-workspace-registry.ts`:

```ts
interface OmniroWorkspaceDefinition<TContext = unknown> {
  id: string;
  moduleId: string;
  routeSegment: string;
  requiredPermissions: string[];
  load: () => Promise<{ default: React.ComponentType<OmniroWorkspaceProps<TContext>> }>;
  deriveContext: (runtime: OmniroRuntimeSnapshot) => TContext;
  title: (context: TContext) => string;
}
```

The common `OmniroFocusFrame` owns zoom/reposition/expand/collapse, project context, close/back behavior, history, mobile sheet/fullscreen treatment, Orchestrator presence and focus restoration. Workspace components own only unique content.

Stage 2A workspace registrations lazily delegate to existing project tabs/components:

- Scanner → `RoomScannerCommercial` / `SpatialRoomScanner` through the existing project workspace context;
- Technical Assignment → existing `ProjectWorkspace` technical-assignment tab;
- Design Project → existing `ProjectWorkspace` design-project tab.

No large centered modal is introduced.

## 8. Approval adapter architecture

Create `apps/web/src/omniro-approval-contract.ts`:

```ts
interface OmniroApprovalAdapter<TState> {
  detect(state: TState, session: Session): OmniroApprovalProjection | undefined;
  openTarget: OmniroWorkspaceReference;
}

interface OmniroApprovalProjection {
  source: OmniroEvidenceRef;
  version?: number;
  readiness: string;
  consequence: string;
  permitted: boolean;
  permission: string;
  downstreamModuleId?: string;
  conflictPolicy: "reload-in-workspace";
}
```

The common renderer owns the gate, suspended payload, downstream blocked geometry and permission-aware CTA. The adapter detects and describes an existing domain approval state, then routes to the real workspace. It does not invoke an endpoint. `RoomScannerCommercial` retains the existing `room_scans.approve` call, optimistic version, confirmation and conflict handling. Thus OMNIRO adds no second authority model.

## 9. Orchestrator adapter architecture

Create `apps/web/src/omniro-orchestrator-contract.ts`:

```ts
interface OmniroExplanationProjection {
  currentModule: OmniroEntityRef;
  source?: OmniroEntityRef;
  destination?: OmniroEntityRef;
  reason: string;
  evidence: OmniroEvidenceRef[];
  waitingReason?: string;
  humanAction?: OmniroHumanAction;
  nextAction?: OmniroNextAction;
  classification: "authoritative" | "derived" | "unavailable";
  highlight: { moduleIds: string[]; flowIds: string[] };
}
```

Module and flow adapters expose projections. The shared Orchestrator UI renders them and highlights registered topology IDs before text unfolds. The local interpreter chooses among supported projections; it does not contain module UI logic, mutate records or reveal chain-of-thought. Unsupported questions return explicit unavailability.

## 10. Three-level view model

```text
OPERATIONAL_VIEW
  project nucleus + whole registered topology + attention
        ↓ select/focus
FOCUS_SYSTEM_VIEW
  selected agent enlarged; relevant topology/path retained; Core repositioned
        ↓ enter
AGENT_WORKSPACE
  common focus frame + lazy unique workspace content
        ↓ close/back
FOCUS_SYSTEM_VIEW → OPERATIONAL_VIEW
```

Create `OmniroViewState` as a discriminated union in `omniro-interaction-model.ts`. A reducer owns `APPROACH`, focus, workspace expansion and collapse. URL state selects the stable level; hover and animation progress remain ephemeral. The L2 enlarged Core is a Focus/System state, never the default Operational View.

## 11. Exact production files

### Create

- `apps/web/src/omniro-module-contract.ts`
- `apps/web/src/omniro-module-registry.ts`
- `apps/web/src/omniro-flow-contract.ts`
- `apps/web/src/omniro-flow-registry.ts`
- `apps/web/src/omniro-workspace-contract.ts`
- `apps/web/src/omniro-workspace-registry.ts`
- `apps/web/src/omniro-approval-contract.ts`
- `apps/web/src/omniro-orchestrator-contract.ts`
- `apps/web/src/omniro-interaction-model.ts`
- `apps/web/src/omniro-building-modules.ts`
- `apps/web/src/omniro-building-flows.ts`
- `apps/web/src/omniro-building-adapters.ts`
- `apps/web/src/omniro-building-workspaces.tsx`
- `apps/web/src/omniro-command-center-data.ts`
- `apps/web/src/omniro-command-center-route.ts`
- `apps/web/src/omniro-command-center-shell.tsx`
- `apps/web/src/omniro-operational-scene.tsx`
- `apps/web/src/omniro-operational-graph.tsx`
- `apps/web/src/omniro-focus-frame.tsx`
- `apps/web/src/omniro-authority-boundary.tsx`
- `apps/web/src/omniro-orchestrator-layer.tsx`
- `apps/web/src/omniro-causality-trace.tsx`
- `apps/web/src/omniro-command-center.css`
- focused unit/component test files matching the modules above;
- `e2e/omniro-stage-2a.spec.ts`
- `e2e/omniro-stage-2a-visual.spec.ts`.

### Change

- `apps/web/src/app.tsx` — Stage 2A route parsing, auth return target, full-height Command Center host outside the legacy sidebar presentation.
- `apps/web/src/main.tsx` — import the new isolated stylesheet.
- `apps/web/src/omniro-command-center.tsx` — controller/composition root only.
- `apps/web/src/omniro-model.ts` — use shared truth/runtime contracts while retaining stable IDs.
- `apps/web/src/omniro-scene-model.ts` — common renderer/view state derivation.
- `apps/web/src/omniro-interpreter.ts` — generic registry-backed supported explanation intents only.
- `apps/web/src/omniro.test.tsx` and `e2e/omniro.spec.ts` — preserve existing truth tests and update Stage 2A behavior.

No backend, contract, migration, seed, repository or permission file changes.

## 12. Frozen files

Untouched Stage 1 production/test files:

- `apps/web/src/omniro-stage-hero.tsx`
- `apps/web/src/omniro-stage-scene.tsx`
- `apps/web/src/omniro-stage.css`
- `apps/web/src/omniro-living-sequence.ts`
- `apps/web/src/omniro-living-sequence.test.ts`
- `apps/web/src/omniro-stage-flow.ts`
- `apps/web/src/omniro-stage-flow.test.ts`
- `e2e/omniro-stage-1-visual.spec.ts`
- `e2e/public-experience.spec.ts`
- every `artifacts/omniro-stage-1*` file.

Approved A2–L2 and `design-review-refinement.md` are frozen visual references and remain byte-identical.

## 13. Authenticated transition

1. Stage 1 remains mounted after Building/sign-in intent.
2. The requested same-origin OMNIRO hash is retained as an auth return target.
3. Existing `Login`/`api.login` authenticates; no auth redesign.
4. A transition host keeps a static Stage 1 Core while `api.me`, `api.company` and initial Project data resolve.
5. That same visual center changes role to Operational Presence; project rings and registry nodes resolve from loaded state.
6. Partial failures map affected adapters to `PARTIAL`/`UNAVAILABLE`; nothing is inferred.
7. Refresh failure returns to login while retaining a safe same-origin target.

This is presentation continuity, not a claim of server-side process execution.

## 14. Project Nucleus sources

| Field | Existing source | Truth |
|---|---|---|
| ID, name, project number, lifecycle, currency, dates | `GET /projects` | REAL |
| client | `GET /clients/:clientId` with permission | REAL or UNAVAILABLE |
| property/address/region | `GET /properties/:propertyId` with permission | REAL or UNAVAILABLE |
| company/session | `GET /company`, `GET /auth/me` | REAL |
| latest Scanner revision/status/version | project-linked `GET /room-scans` | REAL |
| approved Scanner fingerprint/schema | applicable `GET /room-scans/:id/approved-snapshot` | REAL or UNAVAILABLE |
| Technical Assignment revision/status | project-filtered `GET /technical-assignments` | REAL |
| Design Project revision/status/source fingerprints | project-filtered `GET /design-projects` | REAL |
| attention order, selected relationship | deterministic registered projection | DERIVED |

Absent region, fingerprint, approval readiness or dependency evidence remains unavailable.

## 15. Real Stage 2A sources

- Room Scanner list/detail/workspace/snapshot and existing commercial/spatial workspace, governed by existing `room_scans.*` permissions.
- Technical Assignment list/detail and existing workspace, governed by `technical_assignments.read` and existing action permissions inside that workspace.
- Design Project list/detail and existing workspace, governed by `design_projects.read` and existing action permissions inside that workspace.
- Documents and Tasks as existing contextual pages, not invented topology dependencies.
- Local deterministic Orchestrator projections over loaded data only.

Construction Assistant recommendations remain in their current permission-controlled panel and are not elevated to topology truth in Stage 2A.

## 16. URL, deep link and history

Canonical hashes:

- `#omniro`
- `#omniro/project/:projectId`
- `#omniro/project/:projectId/focus/:moduleId`
- `#omniro/project/:projectId/workspace/:moduleId`
- optional registered entity suffix `/:entityId` only where the workspace adapter supports it.

The route parser validates module/workspace IDs against registries. Invalid or unauthorized links render an honest unavailable state and return action. Existing `#project/:id/:tab` routes remain supported. Back/forward restores Operational/Focus/Workspace level, project and module; close uses history when possible and deterministic parent route otherwise. Hover, payload progress and expanded explanation are not URL state.

## 17. Accessibility

- WebGL is `aria-hidden`; a complete DOM graph is always rendered.
- Registry accessibility metadata supplies labels, descriptions, relationships and consequences.
- Nodes are buttons in registered chain order; arrow keys traverse connected nodes, Enter/Space focuses/opens, Escape collapses one view level.
- Focus moves to workspace heading and returns to the originating node.
- Live regions announce selected flow, suspended gate and view transition without narrating decorative motion.
- Approval exposes source, version, readiness, consequence, permission and next state.
- Geometry, icon, line style and text reinforce color classifications.
- 200% zoom, keyboard-only, high contrast and 44×44 mobile targets are required.

## 18. WebGL, reduced motion and fallback

- Use existing Three.js directly; do not add React Three Fiber.
- One operational renderer consumes registry snapshots; DOM owns controls/text.
- Shared geometry/material/particle buffers; module identity is configuration plus optional registered micro-animation.
- Enhanced DPR cap 2; balanced cap about 1.5 with fewer particles; reduced/static eliminates continuous travel and rotation.
- `prefers-reduced-motion` uses discrete selected paths and state changes.
- Pause when hidden; ResizeObserver sizing; dispose every renderer resource on unmount.
- Renderer errors swap to CSS/SVG spatial fallback with the same DOM graph, routes, approval link and Orchestrator.
- A future module never edits renderer internals unless it introduces an optional new generic micro-animation plugin.

## 19. Performance and bundle strategy

- Lazy-load operational Three.js after authenticated Command Center entry.
- Lazy-load each workspace from its registry entry.
- Keep contracts, registries, route parser and DOM graph in the light authenticated chunk.
- Initial list sources load once; project detail/snapshots load after selection; abort stale project requests.
- Memoize runtime graph by registry version plus record IDs/versions.
- Never update React state per animation frame.
- Validate no duplicate Three.js chunk, no mobile horizontal overflow, no hidden-tab animation work, and useful balanced performance around 30 fps minimum.

## 20. Testing strategy

### Contract/registry tests

- duplicate module/flow/workspace IDs fail;
- unknown ports/modules/workspaces fail;
- missing permissions/accessibility definitions fail;
- registry order and topology are deterministic;
- unavailable modules cannot emit payloads or open workspaces;
- adding a fixture module requires no renderer/shell changes.

### Runtime/model tests

- source permission and partial failure mappings;
- lifecycle mapping into the common lifecycle;
- authority gate only from supported real status;
- no time-based/event inference;
- flow evidence/truth classification;
- Orchestrator projections cite registered IDs and evidence;
- route round-trip and history parents.

### Component/accessibility tests

- Operational → Focus → Workspace → collapse;
- keyboard graph traversal/focus restoration;
- Scanner workspace delegation;
- approval CTA opens existing workspace and performs no mutation itself;
- Orchestrator highlights topology first;
- reduced-motion/static/fallback equivalence;
- mobile single-flow behavior and no overflow.

### E2E/regression

- Stage 1 → login → retained Command Center target;
- authenticated/unauthenticated deep links and reload;
- real Scanner/Assignment/Design focus/workspaces;
- real approval-required Scanner gate;
- partial API failures;
- assert no Work Scope/Technology/Norm/Consumption/Pricing/Estimate requests;
- browser history through all three view levels;
- desktop 1440×900 and mobile 390×844 visual regression;
- full public, frozen Stage 1, construction UI and Scanner regressions.

Run repository-standard diff check, typecheck, lint, unit/integration suites, full Chromium E2E and production build.

## 21. Extensibility acceptance test — add PROCUREMENT tomorrow

Expected production changes:

1. Add `procurement` registration in `omniro-building-modules.ts` (or a dedicated feature registration imported there).
2. Add its typed data/API adapter in the Procurement feature boundary; add API method only if the backend capability already exists and is approved.
3. Declare permissions and lifecycle mapping in that registration/adapter.
4. Declare input/output ports and Procurement flows in `omniro-building-flows.ts`.
5. Add the unique Procurement workspace component and one lazy workspace registration in `omniro-building-workspaces.tsx`.
6. Optionally register a Procurement-specific processing micro-animation plugin; otherwise use common lifecycle visuals.
7. Add Procurement adapter/registry/workspace tests and its functional E2E.

Must not change:

- Command Center shell;
- Core/Project Nucleus;
- spatial topology and flow renderer;
- payload renderer;
- Focus View/state reducer;
- authority-gate renderer;
- common Orchestrator UI;
- URL parser architecture;
- mobile shell;
- accessibility graph engine;
- reduced-motion/fallback engine.

The registry validation fixture will prove a synthetic Procurement module can be added and rendered/navigated with no edits to those core components.

## 22. Exact functional acceptance criteria

Stage 2A passes only if:

1. Authenticated Building is the approved spatial system, not a conventional dashboard.
2. Operational, Focus/System and Agent Workspace views form one continuous interaction with correct collapse/history.
3. Project identity and authoritative context are visibly integrated with Core and use only sourced facts.
4. Scanner, Technical Assignment and Design Project runtime states come from existing REST records and permissions.
5. Later-chain modules remain registered, visible and explicitly UNAVAILABLE with no requests or actions.
6. Modules are rendered from the typed registry; no unrelated per-module branches exist in the shell/renderer.
7. Flows are rendered from the flow registry; no manual path implementation is required per future relationship.
8. REAL/DERIVED/PARTIAL/UNAVAILABLE is exposed through text and non-color geometry.
9. A derived flow is labeled as current-record derivation, never a live backend event.
10. Scanner focus expands from its node; Core/topology remain present; the existing real workspace supplies content.
11. A real approval state produces a stopped payload/gate and routes to existing permission-controlled approval behavior.
12. Command Center introduces no approval mutation, authority model or workflow endpoint.
13. Orchestrator projections highlight registered modules/flows, cite evidence and remain read-only/deterministic.
14. Estimate causality order is preserved as an unavailable contract without fabricated values.
15. Deep links/reload/history restore project, module and view level safely.
16. WebGL failure and reduced motion retain identical authoritative navigation and semantics.
17. Keyboard, screen-reader, high-contrast, zoom and mobile acceptance tests pass.
18. Workspace bundles are lazy, renderer resources are disposed, hidden animation pauses and Three.js is not duplicated.
19. The Procurement extensibility fixture passes without changes to shell, renderer, focus, approval, Orchestrator, navigation or mobile core.
20. Frozen Stage 1 files and approved A2–L2 visual references remain byte-identical.
21. No backend, contract, migration, seed, permission or Stage 2B integration is introduced.
22. All required checks, tests, E2E and production build pass.

Implementation must not begin before the exact command:

`APPROVED STAGE 2A IMPLEMENTATION PLAN`
