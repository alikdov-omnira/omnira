# OMNIRO Three-Layer Operating Environment

Status: implementation foundation, awaiting human visual and functional acceptance.

This decision extends the protected Stage 2 architecture. It does not replace the Module Registry, Flow Registry, Workspace Registry, approval adapters, Orchestrator adapters, interaction lifecycle, project deep links, fallback renderer, or truth classification.

## Constitution

OMNIRO is an operating environment with three spatially continuous projections:

1. **OMNIRO Universe** presents authenticated corporate reality as a conceptual Earth, the Orchestrator presence, and registered Product Worlds.
2. **Product World** presents one product ecosystem. OMNIRO Building is the first REAL Product World and projects the existing Building Module and Flow registries.
3. **Role Workspace** presents the same authorities through a role-specific information hierarchy. A role is a permission-aware projection for the authenticated actor; it is never a substitute identity.

Navigation is additive. Existing `#omniro/project/:projectId/...` routes remain the authoritative Focus/System and Agent Workspace deep links. New layer routes are:

- `#omniro/universe`
- `#omniro/building`
- `#omniro/role/director`

## Registry boundaries

- **Product Registry** describes Product Worlds and resolves their truth from connected runtime sources. Building is REAL when a readable project context exists. Other registered worlds remain UNAVAILABLE.
- **Role Registry** describes reusable role projections and resolves access from existing session permissions. Director/Owner is the first implementation.
- **Canonical Data Flow Visual Registry** permanently assigns numbers and colors to Financial, Project, Document, Communication, Compliance, Analytics, Procurement, and People flows.

The canonical visual registry is not a new event bus and does not invent activity. A lane becomes active only when mapped Module Registry authorities or Flow Registry relationships exist in the loaded runtime. Parallel lanes remain visually distinct.

## Truth and authority

REAL, DERIVED, PARTIAL, and UNAVAILABLE remain mandatory. Product, role, intelligence, communication, and assistant projections must state limitations. No financial metric, communication event, AI action, or operational count may be fabricated for presentation.

Human authority continues to be implemented by existing approval adapters and workspaces. The new shells do not gain mutation rights and do not introduce authentication, RBAC, RLS, audit, or approval contracts.

## Performance and accessibility

The foundation uses the existing semantic SVG Earth and CSS/SVG flow renderer. It adds no heavy 3D dependency. Earth and active flow motion stop under `prefers-reduced-motion`. All nodes are native buttons with focus-visible treatment, disabled semantics, text truth labels, and accessible descriptions. Mobile is a separate composition with reduced node density and persistent layer navigation rather than a scaled desktop canvas.

## Extension contract

A future Product World should primarily require product registration, a real runtime adapter, flow mappings, and lazy workspace registration. A future role should require role registration plus a permission-aware projection. Neither extension should require rebuilding the Command Center, generic flow renderer, approval presentation, Orchestrator UI, mobile shell, or route architecture.

Production delivery remains governed by [OMNIRO Production Delivery Policy](./omniro-production-delivery-policy.md). This foundation must not be deployed without the separate exact deployment authorization.
