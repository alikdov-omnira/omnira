import {describe,expect,it} from "vitest";
import {flattenMaterialCategoryTree,parseTechnicalData} from "./app.js";
describe("material catalog Web state",()=>{it("flattens category trees",()=>{const child:any={id:"c",children:[]},root:any={id:"r",children:[child]};expect(flattenMaterialCategoryTree([root]).map(x=>x.id)).toEqual(["r","c"]);});it("accepts only JSON objects",()=>{expect(parseTechnicalData('{"grade":"A"}')).toEqual({grade:"A"});expect(()=>parseTechnicalData("[]")).toThrow();});});
