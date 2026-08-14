import { describe, expect, it } from "vitest";
import { commercialEstimateAdapter, commercialEstimateApproval, engineeringNormAdapter, engineeringNormApproval, lifecycleFor, materialConsumptionAdapter, materialConsumptionApproval, regionalPricingAdapter, regionalPricingApproval, scannerApproval, technologyAdapter, technologyApproval, unavailableAdapter, workScopeAdapter, workScopeApproval } from "./omniro-building-adapters.js";
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

  it("maps Engineering Norm readiness to its own human authority boundary",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions:["engineering_norms.read","engineering_norms.approve"]};
    const sources={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],sourceFailures:[],engineeringNorms:[{id:"n",code:"N-1",title:"Painting norm",countryCode:"PL",discipline:"finishes",workType:"painting",revisionId:"nr",revisionNumber:1,status:"ready_for_approval",authoritative:false,version:3}]};
    const norm=engineeringNormAdapter.resolve({projectId:"p",session,sources:sources as never});
    expect(norm).toMatchObject({truth:"REAL",lifecycle:"APPROVAL_REQUIRED"});
    expect(engineeringNormApproval.detect(norm,session)).toMatchObject({permission:"engineering_norms.approve",downstreamModuleId:"material-consumption"});
    expect(engineeringNormApproval.detect(norm,session)?.consequence).toMatch(/Technology and Work Scope approvals are not changed/);
  });

  it("maps real Material Consumption data and its independent approval authority",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions:["material_consumption.read","material_consumption.approve"]};
    const consumption={id:"c",projectId:"p",code:"MC",title:"Demand",revisionId:"cr",revisionNumber:1,status:"ready_for_approval",version:3,workScopeSnapshotId:"ws",normSnapshotId:"ns",knowledgeVersionId:"kv",technologyVersionId:"tv",workItemId:"wi",evaluatedParameters:{},workQuantity:20,workQuantityUnit:"m2",lines:[]};
    const sources={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],engineeringNorms:[],materialConsumptions:[consumption],sourceFailures:[]};
    const state=materialConsumptionAdapter.resolve({projectId:"p",session,sources:sources as never});
    expect(state).toMatchObject({truth:"REAL",availability:"available",lifecycle:"APPROVAL_REQUIRED",record:{entityId:"c",version:3}});
    expect(state.evidence.map(x=>x.entityType)).toEqual(expect.arrayContaining(["approved-work-scope-snapshot","approved-engineering-norm-snapshot"]));
    expect(materialConsumptionApproval.detect(state,session)).toMatchObject({permitted:true,permission:"material_consumption.approve",openWorkspaceId:"material-consumption"});
  });

  it("keeps Material Consumption truthfully available when empty and partial on API failure",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reader"},permissions:["material_consumption.read"]},base={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],engineeringNorms:[],materialConsumptions:[]};
    expect(materialConsumptionAdapter.resolve({projectId:"p",session,sources:{...base,sourceFailures:[]}as never})).toMatchObject({truth:"REAL",availability:"available",status:"not_started"});
    expect(materialConsumptionAdapter.resolve({projectId:"p",session,sources:{...base,sourceFailures:["material-consumption"]}as never})).toMatchObject({truth:"PARTIAL",availability:"partial"});
    expect(materialConsumptionAdapter.resolve({projectId:"p",session:{...session,permissions:[]},sources:{...base,sourceFailures:[]}as never})).toMatchObject({truth:"UNAVAILABLE",availability:"unavailable"});
  });

  it("maps real Regional Pricing lifecycle and immutable approval evidence",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions:["regional_pricing.read","regional_pricing.approve"]};
    const pricing={id:"rp",code:"PL-WAW",title:"Warsaw rates",revisionId:"rpr",revisionNumber:2,status:"ready_for_approval",version:4,currency:"PLN",countryCode:"PL",regionCode:"mazowieckie",city:"Warsaw",effectiveFrom:"2026-01-01",effectiveTo:"2026-12-31",customerCategory:"commercial",commercialProfile:"standard",priceSource:"Verified quotes",overheadRules:[],marginRules:[],discountRules:[],adjustmentRules:[],calculationVersion:"regional-pricing-v1",entries:[]};
    const sources={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],engineeringNorms:[],materialConsumptions:[],regionalPricings:[pricing],sourceFailures:[]};
    const state=regionalPricingAdapter.resolve({projectId:"p",session,sources:sources as never});
    expect(state).toMatchObject({truth:"REAL",availability:"available",lifecycle:"APPROVAL_REQUIRED",record:{entityId:"rp",version:4}});
    expect(regionalPricingApproval.detect(state,session)).toMatchObject({permitted:true,permission:"regional_pricing.approve",downstreamModuleId:"commercial-estimate"});
    const approved={...pricing,status:"approved",approvedSnapshot:{id:"rps",contentFingerprint:"a".repeat(64)}};
    const approvedState=regionalPricingAdapter.resolve({projectId:"p",session,sources:{...sources,regionalPricings:[approved]}as never});
    expect(approvedState.evidence).toContainEqual(expect.objectContaining({entityType:"approved-regional-pricing-snapshot",entityId:"rps"}));
  });

  it("keeps Regional Pricing truthful for empty, failed, and unauthorized sources",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reader"},permissions:["regional_pricing.read"]},base={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],engineeringNorms:[],materialConsumptions:[],regionalPricings:[]};
    expect(regionalPricingAdapter.resolve({projectId:"p",session,sources:{...base,sourceFailures:[]}as never})).toMatchObject({truth:"REAL",status:"not_started"});
    expect(regionalPricingAdapter.resolve({projectId:"p",session,sources:{...base,sourceFailures:["regional-pricing"]}as never})).toMatchObject({truth:"PARTIAL"});
    expect(regionalPricingAdapter.resolve({projectId:"p",session:{...session,permissions:[]},sources:{...base,sourceFailures:[]}as never})).toMatchObject({truth:"UNAVAILABLE"});
  });

  it("maps Commercial Estimate lifecycle, source authorities, approval RBAC, and immutable output",()=>{
    const session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"Reviewer"},permissions:["commercial_estimates.read","commercial_estimates.approve"]},estimate={id:"ce",projectId:"p",code:"CE-1",title:"Offer",revisionId:"cer",revisionNumber:1,status:"ready_for_approval",mode:"tender",currency:"PLN",totals:{grossTotal:123},version:2,lines:[],analysis:{sourceSnapshots:{materialConsumptionSnapshotId:"mcs",pricingSnapshotId:"rps"}}},base={project:{id:"p"},scans:[],assignments:[],designs:[],technologies:[],workScopes:[],engineeringNorms:[],materialConsumptions:[],regionalPricings:[],commercialEstimates:[estimate],sourceFailures:[]};
    const state=commercialEstimateAdapter.resolve({projectId:"p",session,sources:base as never});
    expect(state).toMatchObject({truth:"REAL",lifecycle:"APPROVAL_REQUIRED",record:{entityId:"ce",version:2}});
    expect(state.evidence.map(x=>x.entityId)).toEqual(["cer","mcs","rps"]);
    expect(commercialEstimateApproval.detect(state,session)).toMatchObject({permitted:true,permission:"commercial_estimates.approve",openWorkspaceId:"commercial-estimate"});
    const approved=commercialEstimateAdapter.resolve({projectId:"p",session,sources:{...base,commercialEstimates:[{...estimate,status:"approved",approvedSnapshot:{id:"ces",contentFingerprint:"f"}}]}as never});
    expect(approved.evidence).toContainEqual(expect.objectContaining({entityType:"approved-commercial-estimate-snapshot",entityId:"ces"}));
    expect(commercialEstimateAdapter.resolve({projectId:"p",session:{...session,permissions:[]},sources:base as never})).toMatchObject({truth:"UNAVAILABLE"});
  });
});
