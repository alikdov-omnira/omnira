import {describe,expect,it} from "vitest";
import {CreateEstimateItemRequestSchema,CreateEstimateRequestSchema,EstimateQuerySchema,UpdateEstimateMaterialRequestSchema} from "@odls/contracts";

describe("estimate engine Web contracts",()=>{
 it("validates project-backed estimates and filters",()=>{
  expect(CreateEstimateRequestSchema.parse({projectId:"00000000-0000-4000-8000-000000000071",code:"EST_1",displayName:"Estimate",currency:"eur"}).currency).toBe("EUR");
  expect(EstimateQuerySchema.parse({status:"draft"}).status).toBe("draft");
 });
 it("accepts data-driven item and material inputs",()=>{
  expect(CreateEstimateItemRequestSchema.parse({estimateId:"00000000-0000-4000-8000-000000000001",workId:"00000000-0000-4000-8000-000000000002",measurementUnitId:"00000000-0000-4000-8000-000000000003",priceListId:"00000000-0000-4000-8000-000000000004",quantity:"2.000000",laborCost:"100.0000"}).quantity).toBe("2.000000");
  expect(UpdateEstimateMaterialRequestSchema.parse({expectedVersion:1,unitPrice:"12.5000"}).unitPrice).toBe("12.5000");
 });
});
