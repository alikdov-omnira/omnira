import { describe, expect, it } from "vitest";
import { lifecycleFor, scannerApproval, technologyAdapter, technologyApproval, unavailableAdapter, workScopeAdapter, workScopeApproval } from "./omniro-building-adapters.js";
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

  it("maps Technology review and Work Scope readiness to independent authority gates",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions:["work_scopes.read","work_scopes.approve"]};
    const sources={project:{id:"p"},scans:[],assignments:[],designs:[],sourceFailures:[],technologies:[{id:"t",code:"PAINT",name:"Paint",version:1,versionId:"tv",versionNumber:3,status:"review_required",executionMethod:"spray",requiredLayers:[{name:"primer",order:1}],dryingStages:[],qualityRules:["opacity"],inspectionRequirements:["finish"],safetyNotes:[],technologyVersion:4}],workScopes:[{id:"w",projectId:"p",code:"WS",name:"Scope",revisionId:"wr",revisionNumber:2,status:"ready_for_approval",version:5,items:[],mappings:[],sources:[]}]};
    const technology=technologyAdapter.resolve({projectId:"p",session,sources:sources as never}),scope=workScopeAdapter.resolve({projectId:"p",session,sources:sources as never});
    expect(technology).toMatchObject({truth:"REAL",lifecycle:"APPROVAL_REQUIRED"});expect(scope).toMatchObject({truth:"REAL",lifecycle:"APPROVAL_REQUIRED"});
    expect(technologyApproval.detect(technology,session)?.consequence).toMatch(/Work Scope reference/);expect(workScopeApproval.detect(scope,session)?.consequence).toMatch(/immutable approved snapshot/);
  });
});
