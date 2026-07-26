import {describe,expect,it} from "vitest";
import {validateEstimateCreate,validateEstimateItemCreate,validateEstimateMaterialUpdate} from "../src/domain/estimate-engine/estimate-engine-rules.js";

describe("estimate engine rules",()=>{
 it("normalizes estimate identity and monetary inputs",()=>{
  expect(validateEstimateCreate({projectId:"p",code:" apartment_1 ",displayName:" Apartment ",currency:"eur"})).toMatchObject({code:"APARTMENT_1",displayName:"Apartment",currency:"EUR"});
  expect(validateEstimateItemCreate({quantity:"2.5",laborCost:"125"})).toMatchObject({quantity:"2.500000",laborCost:"125.0000"});
 });
 it("requires positive work and material quantities",()=>{
  expect(()=>validateEstimateItemCreate({quantity:"0",laborCost:"0"})).toThrow();
  expect(()=>validateEstimateMaterialUpdate({expectedVersion:1,quantity:"0"})).toThrow();
 });
 it("rejects invalid currency and negative money",()=>{
  expect(()=>validateEstimateCreate({code:"EST",displayName:"Estimate",currency:"EU"})).toThrow();
  expect(()=>validateEstimateItemCreate({quantity:"1",laborCost:"-1"})).toThrow();
 });
});
