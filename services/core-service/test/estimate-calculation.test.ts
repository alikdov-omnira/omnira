import {describe,expect,it} from "vitest";
import {EstimateCalculationService} from "../src/application/estimate-engine/estimate-calculation-service.js";

describe("estimate calculation service",()=>{
 const service=new EstimateCalculationService();
 it("derives material quantities and prices entirely from norm and price data",()=>{
  expect(service.calculate("10",[{materialId:"m",measurementUnitId:"u",quantity:"0.5",wastePercent:"10",unitPrice:"8",priceListId:"p"}])).toEqual([
   {materialId:"m",measurementUnitId:"u",quantity:"5.500000",wastePercent:"10",unitPrice:"8",priceListId:"p",totalPrice:"44.0000"}
  ]);
 });
 it("aggregates labor and material totals deterministically",()=>{
  expect(service.totals(["100.0000","25.5000"],["44.0000","6.2500"])).toEqual({totalLabor:"125.5000",totalMaterials:"50.2500",totalCost:"175.7500"});
 });
});
