import {describe,expect,it} from "vitest";
import {validateMaterialCategoryCreate,validateMaterialCategoryUpdate,validateMaterialCreate,validateMaterialUpdate} from "../src/domain/material-catalog/material-catalog-rules.js";
describe("material catalog rules",()=>{
 it("normalizes stable codes and text",()=>{expect(validateMaterialCategoryCreate({code:" binders ",displayName:" Binders ",sortOrder:1}).code).toBe("BINDERS");expect(validateMaterialCreate({code:" cement ",displayName:" Cement ",categoryId:"c",measurementUnitId:"u"}).displayName).toBe("Cement");});
 it("rejects invalid codes, names and sort order",()=>{expect(()=>validateMaterialCategoryCreate({code:"bad-code",displayName:"Root",sortOrder:1})).toThrow();expect(()=>validateMaterialCategoryUpdate({displayName:" "})).toThrow();expect(()=>validateMaterialCategoryUpdate({sortOrder:-1})).toThrow();});
 it("requires JSON object metadata",()=>{expect(validateMaterialCreate({code:"GOOD",displayName:"Good",categoryId:"c",measurementUnitId:"u"}).technicalData).toEqual({});expect(()=>validateMaterialCreate({code:"GOOD",displayName:"Good",categoryId:"c",measurementUnitId:"u",technicalData:[] as any})).toThrow();expect(()=>validateMaterialUpdate({technicalData:null as any})).toThrow();});
});
