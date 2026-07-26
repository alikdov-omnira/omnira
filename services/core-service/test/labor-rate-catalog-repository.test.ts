import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {LaborRateCatalogService,type LaborRateActor} from "../src/application/labor-rate-catalog/labor-rate-catalog-service.js";
import {ResolveLaborRateService} from "../src/application/labor-rate-catalog/resolve-labor-rate-service.js";
import type {CreateLaborRate,LaborRateResolutionParams} from "../src/domain/labor-rate-catalog/labor-rate-types.js";
import {LaborRateCatalogRepository} from "../src/infrastructure/labor-rate-catalog/labor-rate-catalog-repository.js";

const url=process.env.DATABASE_URL,run=url?describe:describe.skip;
run("labor rate catalog global system-default PostgreSQL integration",()=>{
 const pool=new Pool({connectionString:url}),repository=new LaborRateCatalogRepository(pool);
 const tenantA="00000000-0000-4000-8000-000000000001",tenantB="00000000-0000-4000-8000-000000000002";
 const actorA="00000000-0000-4000-8000-000000000011",actorB="00000000-0000-4000-8000-000000000015";
 const permissions=["labor_rates.read","labor_rates.create","labor_rates.update","labor_rates.activate","labor_rates.deactivate","labor_rates.system_defaults.read","labor_rates.system_defaults.manage"];
 const tenantActor:LaborRateActor={id:actorA,tenantId:tenantA,permissions,correlationId:randomUUID()};
 const systemActor:LaborRateActor={...tenantActor,systemContextAllowed:true};
 let workA="",unitA="",workB="",unitB="";
 const input=(tenant:string,x:Partial<CreateLaborRate>={}):CreateLaborRate=>({workId:tenant===tenantA?workA:workB,countryCode:"PL",region:"Global Test",currency:"EUR",unitId:tenant===tenantA?unitA:unitB,rateAmount:"100.0000",effectiveFrom:"2050-01-01",effectiveTo:"2050-12-31",sourceType:"tenant",notes:null,...x});
 const params=(tenant:string,x:Partial<LaborRateResolutionParams>={}):LaborRateResolutionParams=>({tenantId:tenant,workId:tenant===tenantA?workA:workB,countryCode:"PL",region:"Global Test",currency:"EUR",unitId:tenant===tenantA?unitA:unitB,onDate:"2050-06-01",...x});
 const createTenant=(tenant:string,actor:string,x:Partial<CreateLaborRate>={})=>repository.transaction(tenant,r=>r.create(tenant,actor,randomUUID(),input(tenant,x)));
 const createSystem=(x:Partial<CreateLaborRate>={})=>new LaborRateCatalogService(repository).create(systemActor,input(tenantA,{sourceType:"system_default",...x}));

 beforeAll(async()=>{
  await pool.query("DELETE FROM audit_logs WHERE entity_type='labor_rate'");
  await pool.query("DELETE FROM labor_rates");
  await pool.query("DELETE FROM labor_rate_system_defaults");
  const fixture=async(tenant:string,actor:string)=>{
   const category=(await pool.query<{id:string}>("INSERT INTO work_categories(tenant_id,code,display_name,hierarchy_level,status,is_system,created_by,updated_by) VALUES($1,'LABOR_RATE_TEST','Labor Rate Test',0,'active',false,$2,$2) ON CONFLICT(tenant_id,code) DO UPDATE SET display_name=excluded.display_name RETURNING id",[tenant,actor])).rows[0].id;
   const unit=(await pool.query<{id:string}>("INSERT INTO measurement_units(tenant_id,code,symbol,display_name,dimension,unit_system,status,decimal_precision,is_system,created_by,updated_by) VALUES($1,'LABOR_RATE_UNIT','lru','Labor Rate Unit','custom','custom','active',4,false,$2,$2) ON CONFLICT(tenant_id,code) DO UPDATE SET display_name=excluded.display_name RETURNING id",[tenant,actor])).rows[0].id;
   const work=(await pool.query<{id:string}>("INSERT INTO work_items(tenant_id,code,display_name,category_id,measurement_unit_id,status,is_system,quantity_precision,created_by,updated_by) VALUES($1,'LABOR_RATE_WORK','Labor Rate Work',$2,$3,'active',false,4,$4,$4) ON CONFLICT(tenant_id,code) DO UPDATE SET display_name=excluded.display_name RETURNING id",[tenant,category,unit,actor])).rows[0].id;
   return {work,unit};
  };
  ({work:workA,unit:unitA}=await fixture(tenantA,actorA));
  ({work:workB,unit:unitB}=await fixture(tenantB,actorB));
 });
 afterAll(()=>pool.end());

 it("applies forced RLS to tenant and global tables",async()=>{
  for(const table of ["labor_rates","labor_rate_system_defaults"]){const row=(await pool.query<{relrowsecurity:boolean;relforcerowsecurity:boolean}>("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=$1::regclass",[table])).rows[0];expect(row).toEqual({relrowsecurity:true,relforcerowsecurity:true});}
 });
 it("allows only system application context to create a system default",async()=>{
  expect(()=>new LaborRateCatalogService(repository).create(tenantActor,input(tenantA,{sourceType:"system_default"}))).toThrow(expect.objectContaining({code:"FORBIDDEN"}));
  const rate=await createSystem();
  expect(rate).toMatchObject({sourceType:"system_default",tenantId:tenantA,workId:workA,unitId:unitA,rateAmount:"100.0000"});
 });
 it("makes one global default visible and resolvable by both tenants",async()=>{
  const service=new ResolveLaborRateService(repository);
  const a=await service.resolve(params(tenantA)),b=await service.resolve(params(tenantB));
  expect(a.id).toBe(b.id);expect(a.sourceType).toBe("system_default");
  expect(a.workId).toBe(workA);expect(b.workId).toBe(workB);
 });
 it("keeps tenant rates isolated and above global fallback",async()=>{
  const own=await createTenant(tenantA,actorA,{rateAmount:"120.0000"});
  const service=new ResolveLaborRateService(repository);
  expect((await service.resolve(params(tenantA))).id).toBe(own.id);
  expect((await service.resolve(params(tenantB))).sourceType).toBe("system_default");
  expect(await repository.transaction(tenantB,r=>r.findById(tenantB,own.id))).toBeUndefined();
  await expect(new LaborRateCatalogService(repository).update(systemActor,own.id,{expectedVersion:own.version,rateAmount:"121"})).rejects.toMatchObject({code:"FORBIDDEN"});
 });
 it("applies exact/global priority independently of SQL row order",async()=>{
  await createSystem({region:null,rateAmount:"80.0000"});
  const exact=await createSystem({region:"Other Region",rateAmount:"90.0000"});
  const resolver=new ResolveLaborRateService(repository);
  expect((await resolver.resolve(params(tenantB,{region:"Other Region"}))).id).toBe(exact.id);
  expect((await resolver.resolve(params(tenantB,{region:"No Exact"}))).region).toBeNull();
 });
 it("blocks tenant mutation and permits optimistic system mutation lifecycle",async()=>{
  const current=await new ResolveLaborRateService(repository).resolve(params(tenantB,{region:"Other Region"}));
  const tenantBActor:LaborRateActor={id:actorB,tenantId:tenantB,permissions,correlationId:randomUUID()};
  const tenantService=new LaborRateCatalogService(repository);
  await expect(tenantService.update(tenantBActor,current.id,{expectedVersion:current.version,rateAmount:"91"})).rejects.toMatchObject({code:"FORBIDDEN"});
  await expect(tenantService.deactivate(tenantBActor,current.id,{expectedVersion:current.version})).rejects.toMatchObject({code:"FORBIDDEN"});
  const systemService=new LaborRateCatalogService(repository);
  const updated=await systemService.update(systemActor,current.id,{expectedVersion:current.version,rateAmount:"91"});
  const off=await systemService.deactivate(systemActor,current.id,{expectedVersion:updated.version});
  await expect(tenantService.activate(tenantBActor,current.id,{expectedVersion:off.version})).rejects.toMatchObject({code:"FORBIDDEN"});
  const on=await systemService.activate(systemActor,current.id,{expectedVersion:off.version});
  expect(on).toMatchObject({isActive:true,rateAmount:"91.0000",version:4});
  expect((await pool.query("SELECT metadata FROM audit_logs WHERE entity_id=$1 ORDER BY occurred_at DESC LIMIT 1",[current.id])).rows[0].metadata).toMatchObject({systemContext:true,newVersion:4});
 });
 it("enforces global overlap while allowing tenant and global periods to coincide",async()=>{
  await expect(repository.transaction(tenantA,r=>r.create(tenantA,actorA,randomUUID(),input(tenantA,{sourceType:"system_default",region:null,rateAmount:"82.0000"})),true)).rejects.toMatchObject({code:"DUPLICATE_RECORD",details:{kind:"ACTIVE_PERIOD_OVERLAP"}});
  await expect(createTenant(tenantB,actorB,{region:null,rateAmount:"130.0000"})).resolves.toMatchObject({sourceType:"tenant"});
  await expect(createTenant(tenantA,actorA,{region:null,rateAmount:"140.0000"})).resolves.toMatchObject({sourceType:"tenant"});
  await expect(createTenant(tenantB,actorB,{region:null,rateAmount:"150.0000"})).rejects.toMatchObject({code:"DUPLICATE_RECORD"});
  expect((await new ResolveLaborRateService(repository).resolve(params(tenantB,{region:"No Exact"}))).rateAmount).toBe("130.0000");
 });
 it("rolls back system mutation and audit atomically",async()=>{
  const id=randomUUID();
  await expect(repository.transaction(tenantA,async r=>{await r.create(tenantA,actorA,id,input(tenantA,{sourceType:"system_default",region:"Rollback"}));await r.audit({tenantId:tenantA,actorId:actorA,action:"labor_rate.created",entityType:"labor_rate",entityId:id,correlationId:randomUUID(),metadata:{systemContext:true}});throw new Error("rollback");},true)).rejects.toThrow("rollback");
  expect(Number((await pool.query("SELECT count(*) FROM labor_rate_system_defaults WHERE id=$1",[id])).rows[0].count)).toBe(0);
  expect(Number((await pool.query("SELECT count(*) FROM audit_logs WHERE entity_id=$1",[id])).rows[0].count)).toBe(0);
 });
 it("keeps global defaults read-only for an ordinary database role",async()=>{
  await pool.query("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='labor_rate_repo_test') THEN CREATE ROLE labor_rate_repo_test LOGIN PASSWORD 'labor_rate_repo_test'; END IF; END $$");
  await pool.query("GRANT USAGE ON SCHEMA public TO labor_rate_repo_test");
  await pool.query("GRANT SELECT,INSERT,UPDATE,DELETE ON labor_rates,labor_rate_system_defaults TO labor_rate_repo_test");
  await pool.query("GRANT SELECT ON work_items,measurement_units TO labor_rate_repo_test");
  const roleUrl=new URL(url!);roleUrl.username="labor_rate_repo_test";roleUrl.password="labor_rate_repo_test";
  const restrictedPool=new Pool({connectionString:roleUrl.toString()}),restricted=new LaborRateCatalogRepository(restrictedPool);
  expect((await restricted.transaction(tenantA,r=>r.findResolutionCandidates(params(tenantA)))).some(x=>x.sourceType==="system_default")).toBe(true);
  expect((await restricted.transaction(tenantB,r=>r.findResolutionCandidates(params(tenantB)))).some(x=>x.sourceType==="system_default")).toBe(true);
  await expect(restricted.transaction(tenantA,r=>r.create(tenantA,actorA,randomUUID(),input(tenantA,{sourceType:"system_default"})),true)).rejects.toMatchObject({code:"42501"});
  await restrictedPool.query("SELECT set_config('app.system_context','true',false)");
  expect((await restrictedPool.query("UPDATE labor_rate_system_defaults SET notes='forbidden'")).rowCount).toBe(0);
  expect(Number((await restrictedPool.query("SELECT count(*) FROM labor_rate_system_defaults")).rows[0].count)).toBe(0);
  await restrictedPool.end();
 });
});
