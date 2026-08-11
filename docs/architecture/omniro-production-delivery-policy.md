# OMNIRO — Production Delivery Policy

Status: **PERMANENT REPOSITORY GOVERNANCE RULE**

Current approved baselines:

- Stage 1: `omniro-stage-1-approved`
- Stage 2A: `omniro-stage-2a-approved` at `cd20d8734c4d3e39ef63ce35faad9a2cbc0e38d3`

## 1. Fundamental rule

Never deploy a feature merely because its Stage was approved.

These are two different approval gates:

```text
APPROVED STAGE X
```

and

```text
APPROVED FOR DEPLOYMENT
```

They must never be treated as equivalent.

## 2. `APPROVED STAGE X`

`APPROVED STAGE X` means:

- the reviewed stage is accepted;
- run final verification;
- freeze the accepted implementation;
- commit the approved implementation;
- create or update the approved baseline tag where requested;
- keep the approved implementation off production;
- stop after baseline reporting.

`APPROVED STAGE X` does not authorize:

- merge to the production branch;
- push intended for production;
- Vercel production deployment;
- production-domain changes;
- production environment changes.

## 3. Only exact production authorization

Only the exact separate command:

```text
APPROVED FOR DEPLOYMENT
```

authorizes any preview, staging, or production deployment sequence. Stage approval and baseline commit/tag never authorize website deployment.

Never interpret any of the following as production authorization:

- `APPROVED`
- `APPROVED STAGE X`
- `looks good`
- `continue`
- `ship it`
- `go ahead`
- `publish it`
- `looks ready`
- `finish it`
- `proceed`

If there is ambiguity, stop and ask for the exact production authorization.

## 4. Production delivery sequence

After the exact command `APPROVED FOR DEPLOYMENT`:

1. Identify the exact approved baseline or tag being promoted.
2. Confirm the working tree is clean.
3. Confirm no unapproved commits exist between the approved baseline and the candidate production state.
4. Run the complete production regression suite.
5. Verify typecheck, lint, unit and integration suites, critical E2E, authentication, deep links, mobile, fallback and reduced motion, accessibility, production build, and `git diff --check`.
6. Merge only the approved baseline into the production branch.
7. Push the production branch to the connected Git repository.
8. Allow or trigger the configured Vercel production deployment.
9. Wait for deployment completion.
10. Verify the actual production deployment.
11. Open the production URL in Chromium.
12. Compare production rendering and behavior against the approved review artifacts.
13. Verify the public Stage 1 experience, authentication, authenticated Command Center, Operational View, Focus/System View, Agent Workspace, mobile, and fallback path.
14. Verify that production is running the expected commit SHA.
15. Report the approved baseline or tag, merged commit SHA, production branch, push result, Vercel deployment status, production URL verification result, critical-route verification, and production commit SHA.

## 5. Failure policy

If any production verification fails:

- do not silently patch production;
- do not create an unreviewed hotfix;
- do not alter the approved baseline;
- do not continue deployment work.

Report:

- the exact failure;
- the affected route or component;
- the expected result;
- the actual result;
- available logs or evidence;
- whether rollback is required.

Then stop. A correction requires a new reviewed change and approval gate.

## 6. Rollback safety

Before production promotion, identify the previously approved production baseline.

If deployment is unhealthy and rollback is required, roll back only to a known approved baseline. Never roll back to an arbitrary commit. Report the rollback target and resulting production SHA.

## 7. Approved baseline immutability

Approved tags are immutable review baselines.

Never rewrite, move, or silently recreate:

- `omniro-stage-1-approved`
- `omniro-stage-2a-approved`
- future approved-stage tags

If an approved stage later changes, create a new reviewed commit and tag. Do not mutate historical approval evidence.

## 8. Future development flow

```text
CODEX IMPLEMENTS
↓
tests + screenshots + video
↓
STOP
↓
HUMAN REVIEW
↓
APPROVED STAGE X
↓
stage commit/tag
↓
STOP
↓
APPROVED FOR DEPLOYMENT
↓
final production regression
↓
merge approved baseline
↓
push Git repository
↓
Vercel production deploy
↓
production verification
↓
report
↓
STOP
```

## 9. Extensibility safety

Production delivery must preserve the frozen Stage 2A architecture:

- Module Registry;
- Flow Registry;
- Workspace Registry;
- Approval Adapter;
- Orchestrator Adapter;
- common interaction lifecycle;
- Operational / Focus / Agent Workspace model;
- deep-link model;
- WebGL / fallback equivalence;
- truth classification system.

A deployment step must never become an excuse to refactor or clean up these systems. Production promotion is delivery only. No feature development is permitted during promotion.

## 10. Repository discovery rule

This policy must remain referenced from the main OMNIRO working and architecture documentation so future Codex sessions discover it before any deployment work.
