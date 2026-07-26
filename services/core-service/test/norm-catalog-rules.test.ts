import {describe,expect,it} from "vitest";
import {validateNormCreate,validateNormItemCreate,validateNormItemUpdate} from "../src/domain/norm-catalog/norm-catalog-rules.js";
describe("norm catalog rules",()=>{
 it("normalizes codes, text, quantities, and waste",()=>{expect(validateNormCreate({code:" paint_norm ",displayName:" Paint ",workId:"w"})).toMatchObject({code:"PAINT_NORM",displayName:"Paint"});expect(validateNormItemCreate({normId:"n",materialId:"m",measurementUnitId:"u",quantity:"1.25",wastePercent:"5"})).toMatchObject({quantity:"1.250000",wastePercent:"5.0000"});});
 it("requires positive quantities and bounded waste",()=>{expect(()=>validateNormItemCreate({normId:"n",materialId:"m",measurementUnitId:"u",quantity:"0",wastePercent:"5"})).toThrow();expect(()=>validateNormItemCreate({normId:"n",materialId:"m",measurementUnitId:"u",quantity:"1",wastePercent:"101"})).toThrow();});
 it("validates partial item changes",()=>{expect(validateNormItemUpdate({expectedVersion:1,quantity:"2"}).quantity).toBe("2.000000");expect(()=>validateNormItemUpdate({expectedVersion:1,wastePercent:"-1"})).toThrow();});
});
