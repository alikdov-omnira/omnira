# Engineering Document Intelligence Boundary

This note reserves a future, separately approved capability. It does not declare current drawing intelligence.

## Current truth

`UNAVAILABLE`: the repository has document upload/version/checksum, OCR, structured extraction and manual review foundations, but no approved authority for drawing comparison, construction-change detection, drawing-to-scope mutation, or cross-project learning.

## Required future boundary

Any future implementation must:

- remain tenant-scoped under existing RLS and permission checks;
- use explicit project/document/version/snapshot references;
- preserve immutable evidence and human approval;
- distinguish observation from recommendation and authority;
- never learn across tenants or reuse customer content without an explicit approved contract;
- never mutate Work Scope, Engineering Norms, Material Consumption or Commercial Estimate silently;
- expose confidence and incomplete-source truth without fabricating conclusions.

Implementation requires a separate approved architecture, data-retention policy, permission model, tests and migration review.
