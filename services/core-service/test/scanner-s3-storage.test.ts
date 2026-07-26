import {afterEach,describe,expect,it,vi} from "vitest";
import {S3CompatibleDocumentStorage} from "../src/infrastructure/document/s3-compatible-document-storage.js";

describe("S3-compatible document storage",()=>{
 afterEach(()=>vi.unstubAllGlobals());
 const config={endpoint:"http://minio.test:9000",region:"eu-central-1",bucket:"private-documents",accessKey:"test-access",secretKey:"test-secret",forcePathStyle:true};
 it("uses private signed S3-compatible requests without exposing credentials in errors",async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(null,{status:200,headers:{"content-length":"3"}}));vi.stubGlobal("fetch",fetchMock);
  const storage=new S3CompatibleDocumentStorage(config),key="tenants/00000000-0000-4000-8000-000000000001/documents/00000000-0000-4000-8000-000000000101/versions/00000000-0000-4000-8000-000000000201/x.pdf";
  await storage.putObject({key,body:Buffer.from("pdf"),contentType:"application/pdf",checksumSha256:"0".repeat(64)});
  const [url,init]=fetchMock.mock.calls[0];expect(String(url)).toContain("/private-documents/tenants/");expect(init.headers.authorization).toContain("AWS4-HMAC-SHA256");expect(init.headers).not.toHaveProperty("x-amz-acl");
 });
 it("maps missing objects and redacts endpoint/secret from failures",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:404})));const storage=new S3CompatibleDocumentStorage(config);
  expect(await storage.headObject({key:"missing"})).toBeUndefined();
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:503})));
  await expect(storage.getObject({key:"missing"})).rejects.toThrow("Object storage request failed (503)");
  await expect(storage.getObject({key:"missing"})).rejects.not.toThrow("test-secret");
 });
});
