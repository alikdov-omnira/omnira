import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import sharp from "sharp";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {FastifyInstance} from "fastify";

const run=process.env.DATABASE_URL?describe:describe.skip;
run("Document page REST API",()=>{
 let app:FastifyInstance,token="",root="",image:Buffer;
 beforeAll(async()=>{
  root=await mkdtemp(join(tmpdir(),"document-pages-rest-"));process.env.DOCUMENT_STORAGE_ROOT=root;
  app=(await import("../src/server.js")).buildServer();image=await sharp({create:{width:20,height:30,channels:3,background:"#eeeeee"}}).png().toBuffer();
  const login=await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{tenantSlug:"demo",email:"admin@demo.odls",password:"DemoPassword!2026"}});token=login.json().data.accessToken;
 });
 afterAll(async()=>{await app.close();await rm(root,{recursive:true,force:true});});
 const headers=()=>({authorization:`Bearer ${token}`});
 function multipart(fields:Record<string,string>,filename:string,mime:string,bytes:Buffer){
  const boundary="----omnira-pages-boundary",parts:Buffer[]=[];
  for(const [name,value] of Object.entries(fields))parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--\r\n`));
  return {body:Buffer.concat(parts),headers:{...headers(),"content-type":`multipart/form-data; boundary=${boundary}`}};
 }
 it("adds, lists, gets, processes, serves, reorders and deletes a page",async()=>{
  const documentResponse=await app.inject({method:"POST",url:"/api/v1/documents",...multipart({title:"Page routes"},"base.png","image/png",image)}),document=documentResponse.json().data;
  const addedResponse=await app.inject({method:"POST",url:`/api/v1/documents/${document.id}/pages`,...multipart({expectedDocumentVersion:String(document.version)},"page.png","image/png",image)});
  expect(addedResponse.statusCode,addedResponse.body).toBe(201);const page=addedResponse.json().data;
  expect((await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/pages`,headers:headers()})).json().data).toHaveLength(1);
  expect((await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/pages/${page.id}`,headers:headers()})).statusCode).toBe(200);
  const sourceContent=await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/pages/${page.id}/content`,headers:headers()});expect(sourceContent.headers["x-document-page-content"]).toBe("source");expect(sourceContent.headers["content-type"]).toContain("image/png");
  const processed=await app.inject({method:"POST",url:`/api/v1/documents/${document.id}/pages/${page.id}/process`,headers:headers(),payload:{expectedVersion:page.version,rotationDegrees:90,enhancementPreset:"document_grayscale"}});
  expect(processed.statusCode,processed.body).toBe(200);const processedPage=processed.json().data;
  const content=await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/pages/${page.id}/content`,headers:headers()});expect(content.statusCode).toBe(200);expect(content.headers["content-type"]).toContain("image/jpeg");expect(content.headers["x-document-page-content"]).toBe("processed");expect(content.headers["cache-control"]).toBe("private, no-store");expect(content.headers["x-content-type-options"]).toBe("nosniff");
  const currentDocument=(await app.inject({method:"GET",url:`/api/v1/documents/${document.id}`,headers:headers()})).json().data;
  expect((await app.inject({method:"PATCH",url:`/api/v1/documents/${document.id}/pages/reorder`,headers:headers(),payload:{expectedDocumentVersion:currentDocument.version,pageIds:[page.id]}})).statusCode).toBe(200);
  const afterReorder=(await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/pages/${page.id}`,headers:headers()})).json().data;
  const afterReorderDocument=(await app.inject({method:"GET",url:`/api/v1/documents/${document.id}`,headers:headers()})).json().data;
  expect((await app.inject({method:"DELETE",url:`/api/v1/documents/${document.id}/pages/${page.id}`,headers:headers(),payload:{expectedVersion:afterReorder.version,expectedDocumentVersion:afterReorderDocument.version}})).statusCode).toBe(200);
  expect(processedPage.processingStatus).toBe("completed");
 });
 it("rejects invalid identifiers, transformations, and unknown fields",async()=>{
  expect((await app.inject({method:"GET",url:"/api/v1/documents/not-a-uuid/pages/not-a-uuid",headers:headers()})).statusCode).toBe(400);
  const response=await app.inject({method:"POST",url:`/api/v1/documents/${crypto.randomUUID()}/pages/${crypto.randomUUID()}/process`,headers:headers(),payload:{expectedVersion:1,rotationDegrees:45,enhancementPreset:"original",unexpected:true}});
  expect(response.statusCode).toBe(400);
 });
});
