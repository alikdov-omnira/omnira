import{describe,expect,it}from"vitest";
import{allowedScannerQuantities,executionSequence,validateQuantityMapping,validateScopeReadiness,type ScopeItem}from"../src/domain/work-scope/work-scope-rules.js";
const item=(id:string,workType:any,sequence:number):ScopeItem=>({id,workType,sequence,targetType:"wall",targetReference:"wall-1",technologyVersionId:`technology-${id}`,reviewState:"confirmed"});
describe("Work Scope rules",()=>{
 it("maps work intent to allowed scanner quantities without recalculating geometry",()=>{expect(allowedScannerQuantities("painting")).toEqual(["painting_wall_area","painting_ceiling_area"]);expect(()=>validateQuantityMapping("painting","flooring_area")).toThrow(/MAPPING_INVALID/)});
 it("produces deterministic dependency order",()=>expect(executionSequence([item("repair","concrete_repair",1),item("primer","primer",2),item("paint","painting",3)],[{predecessorId:"repair",successorId:"primer",kind:"finish_to_start"},{predecessorId:"primer",successorId:"paint",kind:"drying"}]).map(x=>x.id)).toEqual(["repair","primer","paint"]));
 it("rejects wrong order and circular dependencies",()=>{expect(()=>executionSequence([item("paint","painting",1),item("primer","primer",2)],[{predecessorId:"primer",successorId:"paint",kind:"finish_to_start"}])).toThrow(/WRONG_SEQUENCE/);expect(()=>executionSequence([item("a","primer",1)],[{predecessorId:"a",successorId:"a",kind:"finish_to_start"}])).toThrow(/CIRCULAR/)});
 it("blocks approval for unconfirmed or unmapped quantity work",()=>expect(validateScopeReadiness([{...item("paint","painting",1),reviewState:"pending"}],[],new Set())).toEqual(expect.arrayContaining([{code:"WORK_SCOPE_ITEM_UNCONFIRMED",itemId:"paint"},{code:"WORK_SCOPE_QUANTITY_MAPPING_MISSING",itemId:"paint"}])));
 it("contains no product, consumption or commercial output",()=>expect(JSON.stringify(executionSequence([item("paint","painting",1)],[]))).not.toMatch(/price|product|coefficient|cost|margin/i));
});
