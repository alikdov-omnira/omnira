import { describe, expect, it } from "vitest";
import { lifecycleFor, scannerApproval, unavailableAdapter } from "./omniro-building-adapters.js";
import type { OmniroModuleRuntimeState } from "./omniro-module-contract.js";

const approvalState: OmniroModuleRuntimeState = {
  moduleId: "room-scanner",
  projectId: "project-1",
  truth: "REAL",
  lifecycle: "APPROVAL_REQUIRED",
  availability: "available",
  status: "ready_for_approval",
  reason: "Authoritative Room Scan record is ready for approval.",
  evidence: [{ entityType: "room-scan", entityId: "scan-1", version: 3, label: "Room Scan version 3" }],
};

describe("OMNIRO building adapters", () => {
  it.each([
    ["approved", "APPROVED"],
    ["ready_for_approval", "APPROVAL_REQUIRED"],
    ["review_required", "WAIT"],
    ["capturing", "PROCESS"],
    ["failed", "CONFLICT"],
    ["cancelled", "BLOCKED"],
  ])("maps %s into the common lifecycle", (status, expected) => {
    expect(lifecycleFor(status)).toBe(expected);
  });

  it("projects approval authority without executing a mutation", () => {
    const approval = scannerApproval.detect(approvalState, {
      accessToken: "redacted",
      refreshToken: "redacted",
      user: { id: "user-1", displayName: "Reviewer", email: "reviewer@example.test" },
      permissions: ["room_scans.approve"],
    });
    expect(approval).toMatchObject({ permitted: true, permission: "room_scans.approve", openWorkspaceId: "room-scanner" });
    expect(approval).not.toHaveProperty("approve");
  });

  it("keeps Stage 2B modules explicitly unavailable", () => {
    const state = unavailableAdapter("commercial-estimate", "Commercial Estimate").resolve({
      projectId: "project-1",
      session: {} as never,
      sources: {},
    });
    expect(state).toMatchObject({ truth: "UNAVAILABLE", availability: "unavailable", status: "unavailable" });
  });
});
