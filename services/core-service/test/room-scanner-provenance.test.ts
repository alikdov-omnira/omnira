import{describe,expect,it}from"vitest";
import{ApprovedScanQuantitySetService,type ApprovedRoomScanSnapshotBoundary}from"../src/application/room-scanner/scanner-estimate-boundary.js";

const snapshot=(dependencies:ApprovedRoomScanSnapshotBoundary["content"]["quantities"][number]["inputReferences"]):ApprovedRoomScanSnapshotBoundary=>({
 id:"00000000-0000-4000-8000-000000000951",tenantId:"00000000-0000-4000-8000-000000000001",scanId:"00000000-0000-4000-8000-000000000952",propertyId:"00000000-0000-4000-8000-000000000953",projectId:null,status:"approved",contentFingerprint:"b".repeat(64),
 content:{quantities:[{id:"q",roomId:"r",type:"floor_area",value:12,unit:"m2",formulaId:"rectangle.area",inputReferences:dependencies,calculationVersion:"room-geometry-v1"}],completeness:{status:"complete",issues:[]}}
});
describe("approved quantity provenance",()=>{
 it("preserves canonical source versions and captured validity",async()=>{const x=snapshot([{id:"m-2",entityType:"measurement",version:3},{id:"m-1",entityType:"measurement",version:2}]),service=new ApprovedScanQuantitySetService({findApproved:async()=>x}),result=await service.build(x.tenantId,x.id),quantity=result.quantitySet!.quantities[0];expect(quantity.capturedValidity).toBe("valid");expect(quantity.sourceVersions).toEqual([{sourceType:"measurement",sourceId:"m-1",sourceVersion:2,sourceOrder:0},{sourceType:"measurement",sourceId:"m-2",sourceVersion:3,sourceOrder:1}]);});
 it("returns a structured issue for malformed provenance",async()=>{const x=snapshot([{id:"",entityType:"measurement",version:0}]),result=await new ApprovedScanQuantitySetService({findApproved:async()=>x}).build(x.tenantId,x.id);expect(result.quantitySet).toBeUndefined();expect(result.issues[0].code).toBe("SNAPSHOT_DEPENDENCY_INVALID");});
});
