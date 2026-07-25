import {describe,expect,it} from "vitest";import {nextUnitSort} from "./app.js";
describe("measurement unit Web state",()=>{it("starts new sorts ascending and toggles active direction",()=>{expect(nextUnitSort("code","asc","displayName")).toEqual({sortBy:"displayName",sortOrder:"asc"});expect(nextUnitSort("code","asc","code")).toEqual({sortBy:"code",sortOrder:"desc"});});});
