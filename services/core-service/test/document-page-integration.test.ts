import {randomUUID} from "node:crypto";
import sharp from "sharp";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {DocumentService} from "../src/application/document/document-service.js";
import {DocumentPageService} from "../src/application/document/document-page-service.js";
import type {FileStorage} from "../src/application/document/file-storage.js";

const url=process.env.DATABASE_URL,run=url?describe:describe.skip;
class MemoryStorage implements FileStorage{
 objects=new Map<string,Buffer>();deleted:string[]=[];failAfterPut:"source"|"processed"|undefined;
 async putObject(input:any){this.objects.set(input.key,input.body);if(this.failAfterPut&&input.key.includes(`/${this.failAfterPut}/`)){this.failAfterPut=undefined;throw new Error("ambiguous storage failure");}return {provider:"local" as const,bucket:"page-test",key:input.key,sizeBytes:input.body.length};}
 async getObject({key}:{key:string}){const value=this.objects.get(key);if(!value)throw new Error("missing");return value;}
 async deleteObject({key}:{key:string}){this.deleted.push(key);this.objects.delete(key);}
 async headObject({key}:{key:string}){const value=this.objects.get(key);return value?{sizeBytes:value.length}:undefined;}
}
run("Document page PostgreSQL integration",()=>{
 const pool=new Pool({connectionString:url}),storage=new MemoryStorage(),documents=new DocumentService(pool,storage,1024*1024),pages=new DocumentPageService(pool,storage);
 const actor={id:"00000000-0000-4000-8000-000000000011",tenantId:"00000000-0000-4000-8000-000000000001",permissions:["documents.read","documents.upload","documents.download","documents.update","documents.process"],correlationId:randomUUID()};
 const other={...actor,id:"00000000-0000-4000-8000-000000000015",tenantId:"00000000-0000-4000-8000-000000000002"};
 let image:Buffer;
 beforeAll(async()=>{image=await sharp({create:{width:32,height:24,channels:3,background:"#cab090"}}).png().toBuffer();});
 afterAll(()=>pool.end());
 it("adds, processes, serves, reorders, deletes and preserves contiguous numbering",async()=>{
  let document=await documents.upload(actor,{title:"Multi page",documentType:"receipt"},{filename:"base.png",mimetype:"image/png",bytes:image});
  const first=await pages.add(actor,document.id,document.version,{filename:"page-1.png",mimetype:"image/png",bytes:image});
  document=await documents.get(actor,document.id);
  const second=await pages.add(actor,document.id,document.version,{filename:"page-2.png",mimetype:"image/png",bytes:image});
  document=await documents.get(actor,document.id);expect(document.pageCount).toBe(2);
  const processed=await pages.process(actor,document.id,first.id,{expectedVersion:first.version,rotationDegrees:90,enhancementPreset:"document_color"});
  expect(processed).toMatchObject({processingStatus:"completed",widthPixels:24,heightPixels:32,originalWidthPixels:32,originalHeightPixels:24});
  const content=await pages.content(actor,document.id,first.id);expect(content.mimeType).toBe("image/jpeg");expect(content.contentVariant).toBe("processed");expect((await sharp(content.bytes).metadata()).format).toBe("jpeg");
  await expect(pages.get(other,document.id,first.id)).rejects.toMatchObject({code:"NOT_FOUND"});
  const reordered=await pages.reorder(actor,document.id,{expectedDocumentVersion:document.version,pageIds:[second.id,first.id]});expect(reordered.map(x=>[x.id,x.pageNumber])).toEqual([[second.id,1],[first.id,2]]);
  document=await documents.get(actor,document.id);
  const currentSecond=reordered.find(x=>x.id===second.id)!;
  await pages.delete(actor,document.id,second.id,{expectedVersion:currentSecond.version,expectedDocumentVersion:document.version});
  expect((await pages.list(actor,document.id)).map(x=>x.pageNumber)).toEqual([1]);
  expect((await documents.get(actor,document.id)).pageCount).toBe(1);
 });
 it("compensates ambiguous source and processed upload failures exactly once",async()=>{
  let document=await documents.upload(actor,{title:"Storage failures"},{filename:"base.png",mimetype:"image/png",bytes:image});
  let deleted=storage.deleted.length;storage.failAfterPut="source";
  await expect(pages.add(actor,document.id,document.version,{filename:"source.png",mimetype:"image/png",bytes:image})).rejects.toThrow("ambiguous storage failure");
  expect(storage.deleted.length).toBe(deleted+1);
  const page=await pages.add(actor,document.id,document.version,{filename:"page.png",mimetype:"image/png",bytes:image});deleted=storage.deleted.length;storage.failAfterPut="processed";
  await expect(pages.process(actor,document.id,page.id,{expectedVersion:page.version,rotationDegrees:0,enhancementPreset:"original"})).rejects.toThrow("ambiguous storage failure");
  expect(storage.deleted.length).toBe(deleted+1);expect((await pages.get(actor,document.id,page.id)).processingStatus).toBe("failed");
 });
 it("rejects stale and concurrent processing requests",async()=>{
  let document=await documents.upload(actor,{title:"Locking"},{filename:"base.png",mimetype:"image/png",bytes:image});
  const page=await pages.add(actor,document.id,document.version,{filename:"page.png",mimetype:"image/png",bytes:image});
  await expect(pages.process(actor,document.id,page.id,{expectedVersion:page.version+1,rotationDegrees:0,enhancementPreset:"original"})).rejects.toMatchObject({code:"VERSION_CONFLICT"});
  await pool.query(`UPDATE document_pages SET processing_status='processing' WHERE tenant_id=$1 AND id=$2`,[actor.tenantId,page.id]);
  await expect(pages.process(actor,document.id,page.id,{expectedVersion:page.version,rotationDegrees:0,enhancementPreset:"original"})).rejects.toMatchObject({code:"VERSION_CONFLICT"});
  await pool.query(`UPDATE document_pages SET processing_status='pending' WHERE tenant_id=$1 AND id=$2`,[actor.tenantId,page.id]);
 });
 it("deletes an uploaded processed object when audit causes the completion transaction to roll back",async()=>{
  let document=await documents.upload(actor,{title:"Compensation"},{filename:"base.png",mimetype:"image/png",bytes:image});
  const page=await pages.add(actor,document.id,document.version,{filename:"page.png",mimetype:"image/png",bytes:image}),deleted=storage.deleted.length;
  await pool.query(`CREATE OR REPLACE FUNCTION page_test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='document.page_processed' THEN RAISE EXCEPTION 'forced page audit failure'; END IF; RETURN NEW; END $$; DROP TRIGGER IF EXISTS page_test_fail_audit ON audit_logs; CREATE TRIGGER page_test_fail_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION page_test_fail_audit()`);
  try{
   await expect(pages.process(actor,document.id,page.id,{expectedVersion:page.version,rotationDegrees:0,enhancementPreset:"original"})).rejects.toThrow("forced page audit failure");
   expect(storage.deleted.length).toBe(deleted+1);expect((await pages.get(actor,document.id,page.id)).processingStatus).toBe("failed");
  }finally{await pool.query("DROP TRIGGER IF EXISTS page_test_fail_audit ON audit_logs; DROP FUNCTION IF EXISTS page_test_fail_audit()");}
 });
});
