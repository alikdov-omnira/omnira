import {describe,expect,it} from "vitest";
import {validateCategoryCreate,validateCategoryUpdate,validateWorkItemCreate,validateWorkItemUpdate} from "../src/domain/work-catalog/work-catalog-rules.js";
describe("work catalog rules",()=>{
 it("normalizes stable category and work-item codes",()=>{expect(validateCategoryCreate({code:" custom_root ",displayName:"Root",sortOrder:1}).code).toBe("CUSTOM_ROOT");expect(validateWorkItemCreate({code:" wall_work ",displayName:"Wall",quantityPrecision:2}).code).toBe("WALL_WORK");});
 it("rejects invalid codes and empty names",()=>{expect(()=>validateCategoryCreate({code:"bad-code",displayName:"Root",sortOrder:1})).toThrow();expect(()=>validateWorkItemCreate({code:"GOOD",displayName:" ",quantityPrecision:2})).toThrow();});
 it("rejects invalid sort order",()=>expect(()=>validateCategoryUpdate({sortOrder:-1})).toThrow());
 it("rejects invalid quantity precision",()=>{expect(()=>validateWorkItemCreate({code:"GOOD",displayName:"Good",quantityPrecision:13})).toThrow();expect(()=>validateWorkItemUpdate({quantityPrecision:-1})).toThrow();});
});
