import{readFileSync,readdirSync}from"node:fs";import{join}from"node:path";import{describe,expect,it}from"vitest";
const root=join(import.meta.dirname,"../src/application/room-scanner"),text=readdirSync(root).filter(x=>x.endsWith(".ts")).map(x=>readFileSync(join(root,x),"utf8")).join("\n");
describe("Room Scanner Phase 0 architecture",()=>{
 it("keeps PostgreSQL and raw SQL outside the application layer",()=>{expect(text).not.toMatch(/from["']pg["']|PoolClient|\.query\(|\bSELECT\b|\bINSERT INTO\b|\bUPDATE room_scan_/);});
 it("uses typed behavioral persistence commands",()=>{expect(text).toContain("RoomScanPersistencePort");expect(text).toContain("CreateRoomScanCommand");expect(text).not.toMatch(/input:any|q:any/);});
});
