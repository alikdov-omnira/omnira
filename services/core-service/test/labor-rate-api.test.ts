import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {buildServer} from "../src/server.js";

const url=process.env.DATABASE_URL,run=url?describe:describe.skip;
run("labor rate catalog REST API",()=>{
 const pool=new Pool({connectionString:url}),app=buildServer();
 const tenantA="00000000-0000-4000-8000-000000000001",tenantB="00000000-0000-4000-8000-000000000002",actorA="00000000-0000-4000-8000-000000000011",actorB="00000000-0000-4000-8000-000000000015",employeeId="00000000-0000-4000-8000-000000000013";
 let admin="",employee="",second="",workA="",unitA="",workB="",unitB="",tenantRate:any,systemExact:any;
 const request=(method:any,path:string,token=admin,payload?:any,headers:Record<string,string>={}):any=>app.inject({method,url:path,headers:{authorization:`Bearer ${token}`,...headers},payload});
 const tenantBody=(x:Record<string,unknown>={})=>({workId:workA,countryCode:"pl",region:" Mazowieckie ",currency:"eur",unitId:unitA,rateAmount:"125.5000",effectiveFrom:"2060-01-01",effectiveTo:"2060-12-31",notes:"API rate",...x});
 const systemBody=(x:Record<string,unknown>={})=>({workCode:"LABOR_RATE_API_WORK",countryCode:"PL",region:"Mazowieckie",currency:"EUR",unitCode:"LABOR_RATE_API_UNIT",rateAmount:"90.0000",effectiveFrom:"2060-01-01",effectiveTo:"2060-12-31",...x});
 beforeAll(async()=>{
  await pool.query("DELETE FROM audit_logs WHERE entity_type='labor_rate'");
  await pool.query("DELETE FROM labor_rates");
  await pool.query("DELETE FROM labor_rate_system_defaults");
  await pool.query("DELETE FROM labor_rate_system_actors");
  const fixture=async(tenant:string,actor:string)=>{
   const category=(await pool.query<{id:string}>("INSERT INTO work_categories(tenant_id,code,display_name,hierarchy_level,status,is_system,created_by,updated_by) VALUES($1,'LABOR_RATE_API','Labor Rate API',0,'active',false,$2,$2) ON CONFLICT(tenant_id,code) DO UPDATE SET status='active' RETURNING id",[tenant,actor])).rows[0].id;
   const unit=(await pool.query<{id:string}>("INSERT INTO measurement_units(tenant_id,code,symbol,display_name,dimension,unit_system,status,decimal_precision,is_system,created_by,updated_by) VALUES($1,'LABOR_RATE_API_UNIT','lrau','Labor Rate API Unit','custom','custom','active',4,false,$2,$2) ON CONFLICT(tenant_id,code) DO UPDATE SET status='active' RETURNING id",[tenant,actor])).rows[0].id;
   const work=(await pool.query<{id:string}>("INSERT INTO work_items(tenant_id,code,display_name,category_id,measurement_unit_id,status,is_system,quantity_precision,created_by,updated_by) VALUES($1,'LABOR_RATE_API_WORK','Labor Rate API Work',$2,$3,'active',false,4,$4,$4) ON CONFLICT(tenant_id,code) DO UPDATE SET status='active',measurement_unit_id=excluded.measurement_unit_id RETURNING id",[tenant,category,unit,actor])).rows[0].id;
   return {work,unit};
  };
  ({work:workA,unit:unitA}=await fixture(tenantA,actorA));({work:workB,unit:unitB}=await fixture(tenantB,actorB));
  await pool.query("INSERT INTO labor_rate_system_actors(user_id,created_by) VALUES($1,$1),($2,$1)",[actorA,employeeId]);
  await pool.query("INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='labor_rates.system_defaults.manage' WHERE r.code='tenant_admin' ON CONFLICT DO NOTHING");
  const login=async(slug:string,email:string)=>(await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{tenantSlug:slug,email,password:"DemoPassword!2026"}})).json().data.accessToken;
  admin=await login("demo","admin@demo.odls");employee=await login("demo","employee@demo.odls");second=await login("second","admin@second.odls");
 });
 afterAll(async()=>{await app.close();await pool.end();});

 it("enforces tenant create contract, permissions, normalization and isolation",async()=>{
  expect((await request("POST","/api/v1/labor-rates",admin,{...tenantBody(),tenantId:tenantB})).statusCode).toBe(400);
  expect((await request("POST","/api/v1/labor-rates",admin,{...tenantBody(),actorId:actorB})).statusCode).toBe(400);
  expect((await request("POST","/api/v1/labor-rates",admin,{...tenantBody(),sourceType:"system_default"})).statusCode).toBe(400);
  expect((await request("POST","/api/v1/labor-rates",employee,tenantBody({region:"Employee"}))).statusCode).toBe(403);
  const response=await request("POST","/api/v1/labor-rates",admin,tenantBody());
  expect(response.statusCode).toBe(201);tenantRate=response.json().data;
  expect(tenantRate).toMatchObject({tenantId:tenantA,sourceType:"tenant",countryCode:"PL",currency:"EUR",region:"Mazowieckie",rateAmount:"125.5000"});
  expect(typeof tenantRate.rateAmount).toBe("string");
  expect((await request("GET",`/api/v1/labor-rates/${tenantRate.id}`)).statusCode).toBe(200);
  expect((await request("GET",`/api/v1/labor-rates/${tenantRate.id}`,second)).statusCode).toBe(404);
 });
 it("updates optimistically, audits, and forbids ownership/source injection",async()=>{
  let response=await request("PATCH",`/api/v1/labor-rates/${tenantRate.id}`,admin,{expectedVersion:tenantRate.version,rateAmount:"130.2500"});
  expect(response.statusCode).toBe(200);tenantRate=response.json().data;expect(tenantRate.version).toBe(2);
  expect((await request("PATCH",`/api/v1/labor-rates/${tenantRate.id}`,admin,{expectedVersion:1,rateAmount:"1"})).statusCode).toBe(409);
  expect((await request("PATCH",`/api/v1/labor-rates/${tenantRate.id}`,admin,{expectedVersion:tenantRate.version,sourceType:"system_default"})).statusCode).toBe(400);
  expect((await request("PATCH",`/api/v1/labor-rates/${tenantRate.id}`,second,{expectedVersion:tenantRate.version,rateAmount:"2"})).statusCode).toBe(404);
  expect(Number((await pool.query("SELECT count(*) FROM audit_logs WHERE entity_id=$1 AND action='labor_rate.updated'",[tenantRate.id])).rows[0].count)).toBe(1);
 });
 it("enforces lifecycle, versions, and activation overlap",async()=>{
  let response=await request("POST",`/api/v1/labor-rates/${tenantRate.id}/deactivate`,admin,{expectedVersion:tenantRate.version});expect(response.statusCode).toBe(200);tenantRate=response.json().data;
  expect((await request("POST",`/api/v1/labor-rates/${tenantRate.id}/deactivate`,admin,{expectedVersion:tenantRate.version})).statusCode).toBe(422);
  response=await request("POST",`/api/v1/labor-rates/${tenantRate.id}/activate`,admin,{expectedVersion:tenantRate.version});expect(response.statusCode).toBe(200);tenantRate=response.json().data;
  const other=(await request("POST","/api/v1/labor-rates",admin,tenantBody({effectiveFrom:"2061-01-01",effectiveTo:"2061-12-31",rateAmount:"10"}))).json().data;
  const off=(await request("POST",`/api/v1/labor-rates/${other.id}/deactivate`,admin,{expectedVersion:other.version})).json().data;
  const changed=(await request("PATCH",`/api/v1/labor-rates/${other.id}`,admin,{expectedVersion:off.version,effectiveFrom:"2060-06-01",effectiveTo:"2060-08-01"})).json().data;
  expect((await request("POST",`/api/v1/labor-rates/${other.id}/activate`,admin,{expectedVersion:changed.version})).statusCode).toBe(409);
 });
 it("requires permission plus server-side system actor and validates catalog codes",async()=>{
  expect((await request("POST","/api/v1/system/labor-rate-defaults",second,systemBody(),{"x-system-context":"true"})).statusCode).toBe(403);
  expect((await request("POST","/api/v1/system/labor-rate-defaults",employee,systemBody())).statusCode).toBe(403);
  expect((await request("POST","/api/v1/system/labor-rate-defaults",admin,{...systemBody(),tenantId:tenantA})).statusCode).toBe(400);
  expect((await request("POST","/api/v1/system/labor-rate-defaults",admin,systemBody({workCode:"UNKNOWN"}))).statusCode).toBe(404);
  expect((await request("POST","/api/v1/system/labor-rate-defaults",admin,systemBody({unitCode:"UNKNOWN"}))).statusCode).toBe(404);
  const response=await request("POST","/api/v1/system/labor-rate-defaults",admin,systemBody(),{"x-system-context":"true"});
  expect(response.statusCode).toBe(201);systemExact=response.json().data;expect(systemExact.sourceType).toBe("system_default");
 });
 it("supports global CRUD while tenant endpoints keep defaults read-only",async()=>{
  expect((await request("PATCH",`/api/v1/labor-rates/${systemExact.id}`,admin,{expectedVersion:systemExact.version,rateAmount:"1"})).statusCode).toBe(403);
  let response=await request("PATCH",`/api/v1/system/labor-rate-defaults/${systemExact.id}`,admin,{expectedVersion:systemExact.version,rateAmount:"95.0000"});expect(response.statusCode).toBe(200);systemExact=response.json().data;
  response=await request("POST",`/api/v1/system/labor-rate-defaults/${systemExact.id}/deactivate`,admin,{expectedVersion:systemExact.version});expect(response.statusCode).toBe(200);systemExact=response.json().data;
  response=await request("POST",`/api/v1/system/labor-rate-defaults/${systemExact.id}/activate`,admin,{expectedVersion:systemExact.version});expect(response.statusCode).toBe(200);systemExact=response.json().data;
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE entity_id=$1 ORDER BY occurred_at DESC LIMIT 1",[systemExact.id])).rows[0].metadata.systemContext).toBe(true);
 });
 it("resolves tenant and cross-tenant system priorities without numeric coercion",async()=>{
  await request("POST","/api/v1/system/labor-rate-defaults",admin,systemBody({region:null,rateAmount:"75.0000"}));
  const resolve=(token:string,workId:string,unitId:string,region:string)=>request("POST","/api/v1/labor-rates/resolve",token,{workId,countryCode:"PL",region,currency:"EUR",unitId,onDate:"2060-06-01"});
  let response=await resolve(admin,workA,unitA,"Mazowieckie");expect(response.json().data.laborRate.id).toBe(tenantRate.id);
  response=await resolve(second,workB,unitB,"Mazowieckie");expect(response.json().data.selectedSourceType).toBe("system_default");expect(response.json().data.rateAmount).toBe("95.0000");
  response=await resolve(second,workB,unitB,"Other");expect(response.json().data.rateAmount).toBe("75.0000");expect(typeof response.json().data.rateAmount).toBe("string");
  response=await request("POST","/api/v1/labor-rates/resolve",second,{workId:workB,countryCode:"DE",currency:"EUR",unitId:unitB,onDate:"2060-06-01"});expect(response.statusCode).toBe(404);expect(response.json().error.details.kind).toBe("NO_APPLICABLE_RATE");
 });
 it("paginates, filters, sorts stably, and rejects injection-shaped sort fields",async()=>{
  let response=await request("GET","/api/v1/labor-rates?page=1&pageSize=1&sourceType=system_default&effectiveOn=2060-06-01&sortBy=rateAmount&sortOrder=asc");
  expect(response.statusCode).toBe(200);expect(response.json().data).toHaveLength(1);expect(response.json().pagination.total).toBeGreaterThanOrEqual(2);expect(response.json().data[0].sourceType).toBe("system_default");
  response=await request("GET","/api/v1/labor-rates?sortBy=rate_amount%3BDROP%20TABLE%20labor_rates");expect(response.statusCode).toBe(400);expect(response.body).not.toContain("labor_rates_active_period_exclusion");expect(response.body).not.toContain("SELECT ");
  response=await request("GET","/api/v1/labor-rates?pageSize=100",second);expect(response.json().data.some((item:any)=>item.tenantId===tenantA&&item.sourceType==="tenant")).toBe(false);expect(response.json().data.some((item:any)=>item.sourceType==="system_default")).toBe(true);
  response=await request("GET","/api/v1/system/labor-rate-defaults?pageSize=100",admin);expect(response.json().data.every((item:any)=>item.sourceType==="system_default")).toBe(true);
 });
 it.each([
  ["country",{countryCode:"POL"}],["currency",{currency:"EU"}],["date",{effectiveFrom:"2060-99-01"}],["period",{effectiveTo:"2059-01-01"}],["zero",{rateAmount:"0"}],["negative",{rateAmount:"-1"}],["precision",{rateAmount:"1.00001"}],["version",{expectedVersion:0}]
 ])("rejects invalid %s",async(name,change)=>{
  const update=name==="version";
  const response=update?await request("PATCH",`/api/v1/labor-rates/${tenantRate.id}`,admin,{expectedVersion:tenantRate.version,...change}):await request("POST","/api/v1/labor-rates",admin,tenantBody(change));
  expect(response.statusCode).toBe(400);
 });
});
