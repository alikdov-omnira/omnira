import{describe,expect,it}from"vitest";
import{livingSequence}from"./omniro-living-sequence.js";
describe("OMNIRO living sequence",()=>{
 it("defines the locked acceptance sequence in deterministic order",()=>{expect(livingSequence.map(x=>x.id)).toEqual(Array.from({length:30},(_,i)=>String(i).padStart(2,"0")))});
 it("physically stops at human approval before resuming",()=>{const gate=livingSequence.findIndex(x=>x.mode==="gate"),suspended=livingSequence.findIndex(x=>x.mode==="suspended"),resume=livingSequence.findIndex(x=>x.mode==="resume");expect(gate).toBeGreaterThan(0);expect(suspended).toBe(gate+1);expect(resume).toBe(gate+3);expect(livingSequence[gate].duration).toBe(0);expect(livingSequence[suspended].duration).toBe(0)});
 it("covers scanning, transport, validation, computation, insight, routing and workspace entry",()=>{const modes=new Set(livingSequence.map(x=>x.mode));for(const mode of["idle","evidence","scan","created","depart","transport","receive","gate","suspended","resume","validate","compute","insight","route","explain","workspace","workspace_ready"])expect(modes.has(mode as never)).toBe(true)})
});
