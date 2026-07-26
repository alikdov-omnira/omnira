import {mkdir,open,readFile,rename,rm,stat} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {randomUUID} from "node:crypto";
import type {FileStorage} from "../../application/document/file-storage.js";
export class LocalDocumentStorage implements FileStorage{
 constructor(private root=process.env.DOCUMENT_STORAGE_ROOT??"/tmp/odls-documents"){}
 private path(key:string){if(!/^tenants\/[0-9a-f-]{36}\/documents\/[0-9a-f-]{36}\/(?:versions\/[0-9a-f-]{36}\/[^/]+|pages\/[0-9a-f-]{36}\/(?:source\/[^/]+|processed\/[0-9a-f-]{36}\.jpg))$/i.test(key))throw new Error("Invalid storage key");const path=resolve(this.root,key);if(!path.startsWith(resolve(this.root)+"/"))throw new Error("Invalid storage path");return path;}
 async putObject(input:{key:string;body:Buffer;contentType:string;checksumSha256:string}){const target=this.path(input.key),temp=`${target}.tmp-${randomUUID()}`;await mkdir(resolve(target,".."),{recursive:true,mode:0o700});const handle=await open(temp,"wx",0o600);try{await handle.writeFile(input.body);await handle.sync();await handle.close();await rename(temp,target);return {provider:"local" as const,bucket:"documents",key:input.key,sizeBytes:input.body.length};}catch(e){await handle.close().catch(()=>{});await rm(temp,{force:true});throw e;}}
 getObject(input:{key:string}){return readFile(this.path(input.key));}
 async deleteObject(input:{key:string}){const target=this.path(input.key);await rm(target,{force:true});await rm(dirname(target),{recursive:true,force:true});await rm(dirname(dirname(target)),{force:true}).catch(()=>{});}
 async headObject(input:{key:string}){try{return {sizeBytes:(await stat(this.path(input.key))).size};}catch(e:any){if(e?.code==="ENOENT")return undefined;throw e;}}
 private legacyPath(tenant:string,key:string){if(!/^[0-9a-f-]{36}$/i.test(tenant)||!/^[0-9a-f-]{36}$/i.test(key))throw new Error("Invalid storage key");return resolve(this.root,tenant,key);}
 async write(tenant:string,bytes:Buffer){const key=randomUUID(),target=this.legacyPath(tenant,key),temp=`${target}.tmp-${randomUUID()}`;await mkdir(join(this.root,tenant),{recursive:true,mode:0o700});const handle=await open(temp,"wx",0o600);try{await handle.writeFile(bytes);await handle.sync();await handle.close();await rename(temp,target);return key;}catch(e){await handle.close().catch(()=>{});await rm(temp,{force:true});throw e;}}
 read(tenant:string,key:string){return readFile(this.legacyPath(tenant,key));}
 remove(tenant:string,key:string){return rm(this.legacyPath(tenant,key),{force:true});}
}
