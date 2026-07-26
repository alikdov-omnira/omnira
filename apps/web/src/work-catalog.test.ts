import {describe,expect,it} from "vitest";
import {flattenCategoryTree,nextWorkItemSort} from "./app.js";
describe("work catalog Web state",()=>{
 it("flattens a hierarchical response without duplicating nodes",()=>{const child:any={id:"c",children:[]},root:any={id:"r",children:[child]};expect(flattenCategoryTree([root]).map(x=>x.id)).toEqual(["r","c"]);});
 it("toggles work-item sorting deterministically",()=>{expect(nextWorkItemSort("code","asc","code")).toEqual({sortBy:"code",sortOrder:"desc"});expect(nextWorkItemSort("code","desc","category")).toEqual({sortBy:"category",sortOrder:"asc"});});
});
