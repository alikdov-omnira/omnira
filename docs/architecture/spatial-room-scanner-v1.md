# Spatial Room Scanner V1

## Verified scope

This slice adds a provider-neutral, human-confirmed room-geometry workflow beside the existing manual Commercial V1 scanner. It does not replace or silently upgrade manual facts. The production build supports manual coordinates and externally verified laser readings. Browser camera, WebXR depth, ARKit, ARCore and LiDAR modes are reported as unavailable because this repository has no calibrated production adapter and no real-device evidence for them. The test adapter is accepted only when `NODE_ENV=test`.

## Trust boundary

Measurement providers can only propose coordinates, distance, uncertainty, confidence, tracking quality and calibration state through `SpatialMeasurementProviderPort`. They cannot confirm facts, construct approved geometry, calculate commercial prices, select products, approve a room or publish an estimate. `SpatialRecognitionProviderPort` is an explicit future proposal-only boundary; V1 performs no recognition.

Every point begins as `proposed` and must be confirmed or rejected by an authorized user. Geometry can only use confirmed, same-coordinate-system points. Validation rejects duplicate points, zero-length edges, non-simple/self-intersecting contours, unsupported height and limits above 64 points/walls. An opening belongs to one persisted wall; a database trigger enforces wall/revision ownership, wall bounds and non-overlap under tenant RLS.

## Persistence, concurrency and isolation

Migration 029 introduces spatial sessions, points, distances, geometry revisions, walls, openings, conflicts, work quantities and approved room snapshots. All tables use forced PostgreSQL row-level security keyed by `app.tenant_id`. Foreign keys retain scan/room/session ownership. Mutations lock their aggregate records and require optimistic scan plus entity/session/revision versions. The existing manual scanner tables and migrations are unchanged.

Approved spatial snapshots are immutable by trigger. A snapshot includes only confirmed geometry, reviewed walls/openings, deterministic work quantities, formula/input/calculator provenance, calculation version and a SHA-256 content fingerprint. Raw provider payloads, device identifiers and location are deliberately excluded.

## Geometry and work quantities

The deterministic `spatial-geometry-v1` calculator derives wall lengths, floor and ceiling areas, perimeter, volume, gross/opening/net wall areas, reveal area, skirting length and corner lengths. It emits 21 neutral work quantities for plaster/render/paint/primer/filler/wallpaper/tile/drywall/insulation/waterproofing, floor and ceiling work, skirting, reveals and corners.

These records are quantity facts only. They contain no product, brand, package count, material-consumption coefficient, labor rate, tax, margin or price. Estimate/Materials contexts may consume only an approved immutable snapshot; provisional spatial workspace data is not an authoritative downstream contract.

## Conflicts, accuracy and approval blockers

Each measurement persists its provider, accuracy class and uncertainty. Conflicting measurements create an explicit conflict record and require a human resolution. Approximate measurements, open conflicts and unsynced capture block spatial validation/approval. Unsupported providers return a stable 422 response with `external_laser` and `manual` fallback modes. Invalid openings return stable validation responses.

## Web UX and accessibility

The existing manual workflow remains available. Two additive tabs expose spatial capture and the approved room passport. The spatial page states device/build limitations before capture, shows uncertainty on proposals, requires explicit confirmation/rejection, renders an SVG plan, wall elevations, revision state, formula provenance and approval controls. The passport remains unavailable until calculation, review and approval complete. Controls are keyboard-native, labels are explicit, SVG has an accessible name and mobile layout collapses to one column.

## Offline, limits and privacy

The authoritative server accepts a per-mutation unsynced flag and blocks approval if a session is unsynced. The current web surface does not claim offline background synchronization; its existing manual form-draft behavior remains local, and server mutations require connectivity. Limits are 64 points, 64 walls, 32 openings per wall and a 256 KiB client draft budget. Capture is scoped to room geometry; the approved payload excludes raw camera/provider data and location.

## Verification matrix

Automated domain/contract coverage verifies provider normalization, calibration/tracking rejection, point-to-point distance, contour validation, geometry, opening bounds/overlap, work quantity provenance and truthful capability reporting. REST coverage verifies unsupported fallback and the create → propose → confirm → close → calculate → review → approve → snapshot journey. Migration and RLS tests cover fresh application, tenant isolation and immutable snapshots. Web type checks and browser tests cover the additive manual fallback and passport surfaces.

## Known production limitations

- No calibrated browser/native camera provider is shipped or real-device verified.
- External laser transport/pairing is a provider boundary, not a bundled hardware integration.
- V1 has no server-managed background sync queue or camera overlay/reticle, because presenting either without a calibrated spatial provider would imply false measurement capability.
- Opening authoring is available at the API/domain boundary; the first web surface prioritizes point contour, review and passport visualization.
