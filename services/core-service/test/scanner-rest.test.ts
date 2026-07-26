import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {FastifyInstance} from "fastify";

const run=process.env.DATABASE_URL?describe:describe.skip;
run("Scanner REST API",()=>{
 let app:FastifyInstance,token="",root="";
 beforeAll(async()=>{
  root=await mkdtemp(join(tmpdir(),"scanner-rest-"));process.env.DOCUMENT_STORAGE_ROOT=root;
  app=(await import("../src/server.js")).buildServer();
  const login=await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{tenantSlug:"demo",email:"admin@demo.odls",password:"DemoPassword!2026"}});
  token=login.json().data.accessToken;
 });
 afterAll(async()=>{await app.close();await rm(root,{recursive:true,force:true});});
 function multipart(fields:Record<string,string>,filename:string,mime:string,bytes:Buffer){
  const boundary="----omnira-scanner-boundary",parts:Buffer[]=[];
  for(const [name,value] of Object.entries(fields))parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--\r\n`));
  return {body:Buffer.concat(parts),headers:{authorization:`Bearer ${token}`,"content-type":`multipart/form-data; boundary=${boundary}`}};
 }
 it("uploads, lists, reads, updates and downloads private content",async()=>{
  const upload=await app.inject({method:"POST",url:"/api/v1/documents",...multipart({title:"REST scan",documentType:"receipt"},"receipt.png","image/png",Buffer.from([137,80,78,71,13,10,26,10,0]))});
  expect(upload.statusCode,upload.body).toBe(201);const document=upload.json().data;
  expect(document).toMatchObject({title:"REST scan",documentType:"receipt",ocrStatus:"not_requested",aiProcessingStatus:"not_requested"});
  expect((await app.inject({method:"GET",url:"/api/v1/documents?documentType=receipt&mimeType=image%2Fpng",headers:{authorization:`Bearer ${token}`}})).statusCode).toBe(200);
  expect((await app.inject({method:"GET",url:`/api/v1/documents/${document.id}`,headers:{authorization:`Bearer ${token}`}})).statusCode).toBe(200);
  const update=await app.inject({method:"PATCH",url:`/api/v1/documents/${document.id}`,headers:{authorization:`Bearer ${token}`},payload:{title:"REST updated",documentType:"invoice",expectedVersion:document.version}});
  expect(update.statusCode).toBe(200);expect(update.json().data.version).toBe(document.version+1);
  const content=await app.inject({method:"GET",url:`/api/v1/documents/${document.id}/content`,headers:{authorization:`Bearer ${token}`}});
  expect(content.statusCode).toBe(200);expect(content.headers["content-type"]).toContain("image/png");expect(content.headers["cache-control"]).toBe("private, no-store");
 });
 it("rejects unsupported content and an injected sort field",async()=>{
  const bad=await app.inject({method:"POST",url:"/api/v1/documents",...multipart({title:"SVG"},"x.svg","image/svg+xml",Buffer.from("<svg/>"))});
  expect(bad.statusCode).toBe(400);expect(bad.body).not.toContain("OBJECT_STORAGE_SECRET_KEY");
  expect((await app.inject({method:"GET",url:"/api/v1/documents?sortBy=updated_at%3BDROP%20TABLE%20documents",headers:{authorization:`Bearer ${token}`}})).statusCode).toBe(400);
 });
});
