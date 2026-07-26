import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {DocumentService} from "../src/application/document/document-service.js";
import type {FileStorage} from "../src/application/document/file-storage.js";

const url=process.env.DATABASE_URL,run=url?describe:describe.skip;
class MemoryStorage implements FileStorage{
 objects=new Map<string,Buffer>();deleted:string[]=[];failPut=false;
 async putObject(input:any){if(this.failPut)throw new Error("storage unavailable");this.objects.set(input.key,input.body);return {provider:"local" as const,bucket:"scanner-test",key:input.key,sizeBytes:input.body.length};}
 async getObject({key}:{key:string}){const value=this.objects.get(key);if(!value)throw new Error("missing object");return value;}
 async deleteObject({key}:{key:string}){this.deleted.push(key);this.objects.delete(key);}
 async headObject({key}:{key:string}){const value=this.objects.get(key);return value?{sizeBytes:value.length}:undefined;}
}
run("Scanner document PostgreSQL integration",()=>{
 const pool=new Pool({connectionString:url}),storage=new MemoryStorage(),service=new DocumentService(pool,storage,1024);
 const actor={id:"00000000-0000-4000-8000-000000000011",tenantId:"00000000-0000-4000-8000-000000000001",permissions:["documents.read","documents.upload","documents.download","documents.update"],correlationId:randomUUID()};
 const other={...actor,id:"00000000-0000-4000-8000-000000000015",tenantId:"00000000-0000-4000-8000-000000000002"};
 const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
 afterAll(()=>pool.end());
 it("uploads one file object/version, generates the key, filters, downloads and locks updates",async()=>{
  const before=Number((await pool.query("SELECT count(*) FROM file_objects")).rows[0].count);
  let document=await service.upload(actor,{title:"Site receipt",documentType:"receipt"},{filename:"../receipt.png",mimetype:"image/png",bytes:png});
  expect(document.currentVersion.originalFilename).toBe("receipt.png");
  expect(document.currentVersion.storageKey).toMatch(new RegExp(`^tenants/${actor.tenantId}/documents/${document.id}/versions/`));
  expect(Number((await pool.query("SELECT count(*) FROM file_objects")).rows[0].count)).toBe(before+1);
  expect((await service.list(actor,{page:1,pageSize:10,documentType:"receipt",mimeType:"image/png",ocrStatus:"not_requested",sortBy:"title",sortOrder:"asc"})).items.some((x:any)=>x.id===document.id)).toBe(true);
  expect((await service.download(actor,document.id)).bytes).toEqual(png);
  await expect(service.get(other,document.id)).rejects.toMatchObject({code:"NOT_FOUND"});
  await expect(service.download(other,document.id)).rejects.toMatchObject({code:"NOT_FOUND"});
  document=await service.update(actor,document.id,{expectedVersion:document.version,title:"Updated receipt",documentType:"invoice"});
  expect(document.version).toBe(2);
  await expect(service.update(actor,document.id,{expectedVersion:1,title:"stale"})).rejects.toMatchObject({code:"VERSION_CONFLICT"});
 });
 it("does not create metadata on storage failure",async()=>{
  const before=Number((await pool.query("SELECT count(*) FROM documents")).rows[0].count);storage.failPut=true;
  await expect(service.upload(actor,{title:"Unavailable"},{filename:"x.png",mimetype:"image/png",bytes:png})).rejects.toThrow("storage unavailable");
  storage.failPut=false;expect(Number((await pool.query("SELECT count(*) FROM documents")).rows[0].count)).toBe(before);
 });
 it("compensates the stored object when the database/audit transaction fails",async()=>{
  const marker=randomUUID();await pool.query(`CREATE OR REPLACE FUNCTION scanner_test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='document.uploaded' AND NEW.metadata->>'documentType'='estimate' THEN RAISE EXCEPTION 'scanner forced audit failure'; END IF; RETURN NEW; END $$; DROP TRIGGER IF EXISTS scanner_test_fail_audit ON audit_logs; CREATE TRIGGER scanner_test_fail_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION scanner_test_fail_audit()`);
  const deleted=storage.deleted.length;
  try{await expect(service.upload({...actor,correlationId:marker},{title:"Estimate",documentType:"estimate"},{filename:"estimate.pdf",mimetype:"application/pdf",bytes:Buffer.from("%PDF-1.7\n")})).rejects.toThrow("scanner forced audit failure");expect(storage.deleted.length).toBe(deleted+1);}
  finally{await pool.query("DROP TRIGGER IF EXISTS scanner_test_fail_audit ON audit_logs; DROP FUNCTION IF EXISTS scanner_test_fail_audit()");}
 });
 it("forces tenant RLS on file objects",async()=>{
  const row=(await pool.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE relname='file_objects'")).rows[0];
  expect(row).toEqual({relrowsecurity:true,relforcerowsecurity:true});
 });
});
