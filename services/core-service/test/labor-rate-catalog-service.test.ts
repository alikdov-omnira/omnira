import {describe,expect,it} from "vitest";
import {LaborRateCatalogService,type LaborRateActor} from "../src/application/labor-rate-catalog/labor-rate-catalog-service.js";
import type {LaborRateAuditEvent,LaborRateCatalogRepository,LaborRateOverlapCandidate} from "../src/application/labor-rate-catalog/labor-rate-catalog-repository.js";
import {ResolveLaborRateService} from "../src/application/labor-rate-catalog/resolve-labor-rate-service.js";
import type {CreateLaborRate,LaborRate,LaborRateResolutionParams,UpdateLaborRate} from "../src/domain/labor-rate-catalog/labor-rate-types.js";

const actor:LaborRateActor={id:"00000000-0000-4000-8000-000000000011",tenantId:"tenant",permissions:["labor_rates.read","labor_rates.create","labor_rates.update","labor_rates.activate","labor_rates.deactivate","labor_rates.system_defaults.read","labor_rates.system_defaults.manage"],correlationId:"00000000-0000-4000-8000-000000000099"};
const input=(x:Partial<CreateLaborRate>={}):CreateLaborRate=>({workId:"work",countryCode:"pl",region:" North ",currency:"eur",unitId:"unit",rateAmount:"100",effectiveFrom:"2026-01-01",effectiveTo:"2026-12-31",sourceType:"tenant",...x});
const rate=(x:Partial<LaborRate>={}):LaborRate=>({id:"rate",tenantId:"tenant",workId:"work",countryCode:"PL",region:"North",currency:"EUR",unitId:"unit",rateAmount:"100.0000",effectiveFrom:"2026-01-01",effectiveTo:"2026-12-31",sourceType:"tenant",isActive:true,notes:null,version:1,createdAt:"2026-01-01",createdBy:actor.id,updatedAt:"2026-01-01",updatedBy:actor.id,...x});
class FakeRepository implements LaborRateCatalogRepository{
 calls:string[]=[];audits:LaborRateAuditEvent[]=[];overlaps:LaborRate[]=[];candidates:LaborRate[]=[];current:LaborRate|undefined=rate();createInput?:CreateLaborRate;updateInput?:UpdateLaborRate;overlapExclude?:string;resolutionInput?:LaborRateResolutionParams;created:LaborRate|undefined=rate();updated:LaborRate|undefined=rate({version:2});activeResult:LaborRate|undefined=rate({version:2});throwCreate=false;inTransaction=false;auditInTransaction=false;
 async transaction<T>(_tenant:string,operation:(r:LaborRateCatalogRepository)=>Promise<T>){this.calls.push("transaction.begin");this.inTransaction=true;try{const result=await operation(this);this.calls.push("transaction.commit");return result;}catch(error){this.calls.push("transaction.rollback");throw error;}finally{this.inTransaction=false;}}
 async findById(){this.calls.push("findById");return this.current;}
 async findOverlapping(_t:string,_c:LaborRateOverlapCandidate,exclude?:string){this.calls.push("findOverlapping");this.overlapExclude=exclude;return this.overlaps;}
 async findResolutionCandidates(params:LaborRateResolutionParams){this.calls.push("findResolutionCandidates");this.resolutionInput=params;return this.candidates;}
 async list(){return {items:this.candidates,pagination:{page:1,pageSize:25,total:this.candidates.length,totalPages:this.candidates.length?1:0}};}
 async isSystemActor(){return true;}
 async resolveCatalogCodes(){return {workId:"work",unitId:"unit"};}
 async create(_t:string,_a:string,_id:string,value:CreateLaborRate){this.calls.push("create");this.createInput=value;if(this.throwCreate)throw new Error("create failed");return this.created!;}
 async update(_t:string,_a:string,_id:string,value:UpdateLaborRate){this.calls.push("update");this.updateInput=value;return this.updated;}
 async setActive(_t:string,_a:string,_id:string,active:boolean,version:number){this.calls.push(`setActive:${active}:${version}`);return this.activeResult;}
 async audit(event:LaborRateAuditEvent){this.calls.push("audit");this.auditInTransaction=this.inTransaction;this.audits.push(event);}
}
const error=async(p:Promise<unknown>)=>{try{await p;throw new Error("expected error");}catch(e:any){return e;}};

describe("LaborRateCatalogService application",()=>{
 it("1 creates a tenant rate",async()=>expect((await new LaborRateCatalogService(new FakeRepository()).create(actor,input())).id).toBe("rate"));
 it("2 normalizes input before create",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.createInput).toMatchObject({countryCode:"PL",currency:"EUR",region:"North",rateAmount:"100.0000"});});
 it("3 creates inside transaction",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.calls.indexOf("transaction.begin")).toBeLessThan(r.calls.indexOf("create"));});
 it("4 checks overlap before create",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.calls.indexOf("findOverlapping")).toBeLessThan(r.calls.indexOf("create"));});
 it("5 rejects overlapping create",async()=>{const r=new FakeRepository();r.overlaps=[rate()];expect((await error(new LaborRateCatalogService(r).create(actor,input()))).code).toBe("DUPLICATE_RECORD");});
 it("6 does not create on overlap",async()=>{const r=new FakeRepository();r.overlaps=[rate()];await error(new LaborRateCatalogService(r).create(actor,input()));expect(r.calls).not.toContain("create");});
 it("7 forbids system default for tenant",()=>{try{new LaborRateCatalogService(new FakeRepository()).create(actor,input({sourceType:"system_default"}));throw new Error("expected error");}catch(e:any){expect(e.code).toBe("FORBIDDEN");}});
 it("8 allows system default for system context",async()=>{const r=new FakeRepository();r.created=rate({sourceType:"system_default"});expect((await new LaborRateCatalogService(r).create({...actor,systemContextAllowed:true},input({sourceType:"system_default"}))).sourceType).toBe("system_default");});
 it("8a prevents system context from creating a tenant rate",()=>{expect(()=>new LaborRateCatalogService(new FakeRepository()).create({...actor,systemContextAllowed:true},input())).toThrow(expect.objectContaining({code:"FORBIDDEN"}));});
 it("9 audits successful create",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.audits[0].action).toBe("labor_rate.created");});
 it("10 does not audit failed create",async()=>{const r=new FakeRepository();r.throwCreate=true;await error(new LaborRateCatalogService(r).create(actor,input()));expect(r.audits).toHaveLength(0);});
 it("11 create audit carries identity, correlation and version",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.audits[0]).toMatchObject({tenantId:actor.tenantId,actorId:actor.id,entityId:"rate",correlationId:actor.correlationId,metadata:{newVersion:1}});});
 it("12 updates an existing rate",async()=>expect((await new LaborRateCatalogService(new FakeRepository()).update(actor,"rate",{expectedVersion:1,rateAmount:"120"})).version).toBe(2));
 it("13 returns not found on missing update",async()=>{const r=new FakeRepository();r.current=undefined;expect((await error(new LaborRateCatalogService(r).update(actor,"x",{expectedVersion:1}))).code).toBe("NOT_FOUND");});
 it("14 returns version conflict",async()=>expect((await error(new LaborRateCatalogService(new FakeRepository()).update(actor,"rate",{expectedVersion:2}))).code).toBe("VERSION_CONFLICT"));
 it("15 skips update on version mismatch",async()=>{const r=new FakeRepository();await error(new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:2}));expect(r.calls).not.toContain("update");});
 it("16 excludes current ID from overlap check",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1,rateAmount:"120"});expect(r.overlapExclude).toBe("rate");});
 it("17 rejects overlapping update",async()=>{const r=new FakeRepository();r.overlaps=[rate({id:"other"})];expect((await error(new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1}))).code).toBe("DUPLICATE_RECORD");});
 it("18 passes optimistic version to update",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1});expect(r.updateInput?.expectedVersion).toBe(1);});
 it("19 maps empty update to version conflict",async()=>{const r=new FakeRepository();r.updated=undefined;expect((await error(new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1}))).code).toBe("VERSION_CONFLICT");});
 it("20 audits successful update",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1});expect(r.audits[0].action).toBe("labor_rate.updated");});
 it("21 update audit has previous and new versions",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).update(actor,"rate",{expectedVersion:1});expect(r.audits[0].metadata).toMatchObject({previousVersion:1,newVersion:2});});
 it("22 forbids changing source to system default",async()=>expect((await error(new LaborRateCatalogService(new FakeRepository()).update(actor,"rate",{expectedVersion:1,sourceType:"system_default"}))).code).toBe("FORBIDDEN"));
 it("23 activates an inactive rate",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});r.activeResult=rate({isActive:true,version:2});expect((await new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1})).isActive).toBe(true);});
 it("24 rejects already active lifecycle",async()=>expect((await error(new LaborRateCatalogService(new FakeRepository()).activate(actor,"rate",{expectedVersion:1}))).code).toBe("INVALID_STATUS_TRANSITION"));
 it("25 checks overlap on activation",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});await new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1});expect(r.calls).toContain("findOverlapping");});
 it("26 rejects activation overlap",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});r.overlaps=[rate({id:"other"})];expect((await error(new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1}))).code).toBe("DUPLICATE_RECORD");});
 it("27 activation passes expected version",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});await new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1});expect(r.calls).toContain("setActive:true:1");});
 it("28 maps empty activation mutation to conflict",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});r.activeResult=undefined;expect((await error(new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1}))).code).toBe("VERSION_CONFLICT");});
 it("29 audits successful activation",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});await new LaborRateCatalogService(r).activate(actor,"rate",{expectedVersion:1});expect(r.audits[0].action).toBe("labor_rate.activated");});
 it("30 deactivates an active rate",async()=>{const r=new FakeRepository();r.activeResult=rate({isActive:false,version:2});expect((await new LaborRateCatalogService(r).deactivate(actor,"rate",{expectedVersion:1})).isActive).toBe(false);});
 it("31 rejects already inactive lifecycle",async()=>{const r=new FakeRepository();r.current=rate({isActive:false});expect((await error(new LaborRateCatalogService(r).deactivate(actor,"rate",{expectedVersion:1}))).code).toBe("INVALID_STATUS_TRANSITION");});
 it("32 checks version on deactivate",async()=>expect((await error(new LaborRateCatalogService(new FakeRepository()).deactivate(actor,"rate",{expectedVersion:2}))).code).toBe("VERSION_CONFLICT"));
 it("33 audits successful deactivation",async()=>{const r=new FakeRepository();r.activeResult=rate({isActive:false,version:2});await new LaborRateCatalogService(r).deactivate(actor,"rate",{expectedVersion:1});expect(r.audits[0].action).toBe("labor_rate.deactivated");});
 it("34 does not audit failed deactivation mutation",async()=>{const r=new FakeRepository();r.activeResult=undefined;await error(new LaborRateCatalogService(r).deactivate(actor,"rate",{expectedVersion:1}));expect(r.audits).toHaveLength(0);});
 it("35 runs every mutation in a transaction",async()=>{for(const action of ["create","update","activate","deactivate"] as const){const r=new FakeRepository();if(action==="activate")r.current=rate({isActive:false});if(action==="deactivate")r.activeResult=rate({isActive:false});const s=new LaborRateCatalogService(r);await(action==="create"?s.create(actor,input()):action==="update"?s.update(actor,"rate",{expectedVersion:1}):action==="activate"?s.activate(actor,"rate",{expectedVersion:1}):s.deactivate(actor,"rate",{expectedVersion:1}));expect(r.calls[0]).toBe("transaction.begin");expect(r.calls.at(-1)).toBe("transaction.commit");}});
 it("36 rolls back failed transaction result",async()=>{const r=new FakeRepository();r.throwCreate=true;await error(new LaborRateCatalogService(r).create(actor,input()));expect(r.calls.at(-1)).toBe("transaction.rollback");});
 it("37 audits inside the same transaction",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create(actor,input());expect(r.auditInTransaction).toBe(true);expect(r.calls.indexOf("audit")).toBeLessThan(r.calls.indexOf("transaction.commit"));});
 it("uses project correlation fallback for invalid input",async()=>{const r=new FakeRepository();await new LaborRateCatalogService(r).create({...actor,correlationId:"bad"},input());expect(r.audits[0].correlationId).toMatch(/^[0-9a-f-]{36}$/i);});
});

const params=(x:Partial<LaborRateResolutionParams>={}):LaborRateResolutionParams=>({tenantId:"tenant",workId:"work",countryCode:"pl",region:" North ",currency:"eur",unitId:"unit",onDate:"2026-06-01",...x});
const resolve=async(candidates:LaborRate[],p=params())=>{const r=new FakeRepository();r.candidates=candidates;return {result:await new ResolveLaborRateService(r).resolve(p),repo:r};};
describe("ResolveLaborRateService application",()=>{
 it("38 selects tenant exact region",async()=>expect((await resolve([rate()])).result.id).toBe("rate"));
 it("39 tenant region beats tenant without region",async()=>expect((await resolve([rate({id:"none",region:null}),rate({id:"exact"})])).result.id).toBe("exact"));
 it("40 tenant without region beats system region",async()=>expect((await resolve([rate({id:"system",tenantId:"system",sourceType:"system_default"}),rate({id:"tenant",region:null})])).result.id).toBe("tenant"));
 it("41 system region beats system without region",async()=>expect((await resolve([rate({id:"none",tenantId:"system",sourceType:"system_default",region:null}),rate({id:"exact",tenantId:"system",sourceType:"system_default"})])).result.id).toBe("exact"));
 it("42 uses system default without region",async()=>expect((await resolve([rate({id:"system",tenantId:"system",sourceType:"system_default",region:null})])).result.id).toBe("system"));
 it("43 ignores another region",async()=>expect((await error(new ResolveLaborRateService(Object.assign(new FakeRepository(),{candidates:[rate({region:"South"})]})).resolve(params()))).details.kind).toBe("NO_APPLICABLE_RATE"));
 it.each([["44 country",{countryCode:"DE"}],["45 work",{workId:"other"}],["46 currency",{currency:"PLN"}],["47 unit",{unitId:"other"}],["48 inactive",{isActive:false}],["49 before",{effectiveFrom:"2026-07-01"}],["50 after",{effectiveTo:"2026-05-31"}],["53 zero",{rateAmount:"0.0000"}],["54 negative",{rateAmount:"-1"}],["55 invalid",{rateAmount:"NaN"}]] as const)("%s candidate is ignored",async(_name,change)=>{const r=new FakeRepository();r.candidates=[rate(change)];expect((await error(new ResolveLaborRateService(r).resolve(params()))).details.kind).toBe("NO_APPLICABLE_RATE");});
 it("51 includes start date",async()=>expect((await resolve([rate()],params({onDate:"2026-01-01"}))).result.id).toBe("rate"));
 it("52 includes end date",async()=>expect((await resolve([rate()],params({onDate:"2026-12-31"}))).result.id).toBe("rate"));
 it("56 returns explicit no applicable error",async()=>{const r=new FakeRepository();const e=await error(new ResolveLaborRateService(r).resolve(params()));expect(e.code).toBe("NOT_FOUND");expect(e.details.kind).toBe("NO_APPLICABLE_RATE");});
 it("57 normalizes country currency and region",async()=>expect((await resolve([rate()])).repo.resolutionInput).toMatchObject({countryCode:"PL",currency:"EUR",region:"North"}));
 it("58 repository receives normalized parameters",async()=>{const x=await resolve([rate()]);expect(x.repo.calls).toContain("findResolutionCandidates");expect(x.repo.resolutionInput?.countryCode).toBe("PL");});
 it("59 priority result is independent of repository order",async()=>{const a=rate({id:"tenant",region:null}),b=rate({id:"system",tenantId:"system",sourceType:"system_default"});expect((await resolve([b,a])).result.id).toBe("tenant");expect((await resolve([a,b])).result.id).toBe("tenant");});
 it("60 rejects ambiguous candidates in one priority",async()=>{const r=new FakeRepository();r.candidates=[rate({id:"a"}),rate({id:"b"})];const e=await error(new ResolveLaborRateService(r).resolve(params()));expect(e.code).toBe("DUPLICATE_RECORD");expect(e.details.kind).toBe("AMBIGUOUS_LABOR_RATE");});
});
