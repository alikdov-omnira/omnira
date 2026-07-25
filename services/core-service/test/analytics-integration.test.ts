import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {buildServer} from "../src/server.js";

const enabled=Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)("analytics PostgreSQL integration",()=>{
 const app=buildServer();let admin="",employee="",second="";
 beforeAll(async()=>{const login=async(tenantSlug:string,email:string)=>(await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{tenantSlug,email,password:"DemoPassword!2026"}})).json().data.accessToken;admin=await login("demo","admin@demo.odls");employee=await login("demo","employee@demo.odls");second=await login("second","admin@second.odls");});
 afterAll(()=>app.close());
 const get=(url:string,token=admin)=>app.inject({method:"GET",url,headers:{authorization:`Bearer ${token}`}});
 it("returns executive, health and all report models without 5xx",async()=>{for(const url of ["/api/v1/dashboard/executive?range=7","/api/v1/dashboard/project-health","/api/v1/reports/accounts-receivable?overdue=true","/api/v1/reports/revenue?groupBy=client","/api/v1/reports/expenses?groupBy=project","/api/v1/reports/profitability","/api/v1/reports/tasks","/api/v1/reports/deadlines","/api/v1/reports/workload","/api/v1/reports/documents","/api/v1/reports/activity"]){const response=await get(url);expect(response.statusCode,url).toBe(200);}});
 it("enforces underlying role visibility and export authorization",async()=>{expect((await get("/api/v1/reports/documents",employee)).statusCode).toBe(200);expect((await get("/api/v1/reports/accounts-receivable",employee)).statusCode).toBe(403);expect((await get("/api/v1/reports/documents/export",employee)).statusCode).toBe(403);const exportResponse=await get("/api/v1/reports/workload/export");expect(exportResponse.statusCode).toBe(200);expect(exportResponse.headers["content-type"]).toContain("text/csv");expect(exportResponse.body.charCodeAt(0)).toBe(0xfeff);});
 it("keeps tenant report rows isolated",async()=>{const demo=(await get("/api/v1/dashboard/project-health")).json().data,other=(await get("/api/v1/dashboard/project-health",second)).json().data,ids=new Set(demo.map((x:any)=>x.id));expect(other.some((x:any)=>ids.has(x.id))).toBe(false);});
});
