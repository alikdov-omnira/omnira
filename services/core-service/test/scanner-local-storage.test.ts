import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {afterEach,describe,expect,it} from "vitest";
import {LocalDocumentStorage} from "../src/infrastructure/document/local-document-storage.js";

describe("Scanner local object storage",()=>{
 let root:string|undefined;
 afterEach(async()=>{if(root)await rm(root,{recursive:true,force:true});root=undefined;});
 it("puts, heads, gets and deletes a private server-generated key",async()=>{
  root=await mkdtemp(join(tmpdir(),"scanner-storage-"));const storage=new LocalDocumentStorage(root),key="tenants/00000000-0000-4000-8000-000000000001/documents/00000000-0000-4000-8000-000000000101/versions/00000000-0000-4000-8000-000000000201/scan.pdf",body=Buffer.from("%PDF-1.7");
  const result=await storage.putObject({key,body,contentType:"application/pdf",checksumSha256:"0".repeat(64)});
  expect(result).toMatchObject({provider:"local",bucket:"documents",key,sizeBytes:8});
  expect(await storage.headObject({key})).toEqual({sizeBytes:8});
  expect(await storage.getObject({key})).toEqual(body);
  await storage.deleteObject({key});
  expect(await storage.headObject({key})).toBeUndefined();
 });
 it("rejects traversal and keys outside the tenant document structure",async()=>{
  root=await mkdtemp(join(tmpdir(),"scanner-storage-"));const storage=new LocalDocumentStorage(root);
  await expect(storage.putObject({key:"../../secret",body:Buffer.from("x"),contentType:"x",checksumSha256:"0"})).rejects.toThrow("Invalid storage key");
 });
});
