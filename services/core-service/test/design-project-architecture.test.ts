import{describe,expect,it}from"vitest";import{readFileSync,readdirSync}from"node:fs";import{join}from"node:path";
const root=join(import.meta.dirname,"../src"),files=(dir:string)=>readdirSync(join(root,dir),{recursive:true}).filter(x=>String(x).endsWith(".ts")).map(x=>join(root,dir,String(x))),text=(xs:string[])=>xs.map(x=>readFileSync(x,"utf8")).join("\n");
describe("design project architecture boundary",()=>{
 it("domain has no infrastructure or transport dependencies",()=>expect(text(files("domain/design-project"))).not.toMatch(/from["'](?:pg|fastify|.*infrastructure|.*room-scanner|.*technical-assignment|.*estimate-engine)/));
 it("does not import cross-context repositories",()=>expect(text(files("application/design-project"))).not.toMatch(/infrastructure\/(?:room-scanner|technical-assignment)|(?:RoomScan|TechnicalAssignment|Estimate).*Repository/));
 it.each(["technology","norm-catalog","price-list","estimate-engine","work-scope"])("does not depend on %s",name=>expect(text(files("application/design-project"))).not.toContain(`/${name}/`));
 it("does not calculate geometry or commercial results",()=>expect(text(files("domain/design-project").concat(files("application/design-project")))).not.toMatch(/calculate(?:Area|Volume|Price|Labor|Material|Estimate)/));
 it("boundary output has no Scanner quantities",()=>expect(text(files("domain/design-project"))).not.toContain("ApprovedScanQuantitySet"));
 it("migration references immutable source identities only",()=>{const sql=readFileSync(join(import.meta.dirname,"../migrations/025_design_project_foundation.sql"),"utf8");expect(sql).toContain("technical_assignment_fingerprint");expect(sql).toContain("room_scan_fingerprint");expect(sql).not.toContain("lidar");});
});
