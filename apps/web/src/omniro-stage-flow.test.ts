import{describe,expect,it}from"vitest";
import{flowStateLabel,stageFlows}from"./omniro-stage-flow.js";

describe("OMNIRO Stage 1 semantic flows",()=>{
 it("preserves complete routing metadata and honest demonstration classification",()=>{for(const flow of stageFlows){expect(flow.origin).toBeTruthy();expect(flow.destination).toBeTruthy();expect(flow.semanticType).toBeTruthy();expect(flow.explanation).toBeTruthy();expect(flow.capabilitySource).toBeTruthy();expect(flow.demonstration).toBe(true)}});
 it("represents every required motion state",()=>{expect(new Set(Object.keys(flowStateLabel))).toEqual(new Set(["idle","processing","waiting","human_approval_required","confirmed","conflict","complete"]));for(const state of Object.keys(flowStateLabel))expect(stageFlows.some(flow=>flow.state===state)||state==="confirmed").toBe(true)});
 it("stops scanner geometry at the human gate",()=>{expect(stageFlows.find(flow=>flow.id==="scanner-passport")).toMatchObject({origin:"scanner",destination:"passport",state:"human_approval_required",semanticType:"Verified room geometry"})});
});
