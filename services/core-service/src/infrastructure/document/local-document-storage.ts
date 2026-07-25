import {mkdir,open,readFile,rename,rm} from "node:fs/promises";
import {join,resolve} from "node:path";
import {randomUUID} from "node:crypto";
export class LocalDocumentStorage{
 constructor(private root=process.env.DOCUMENT_STORAGE_ROOT??"/tmp/odls-documents"){}
 private path(tenant:string,key:string){if(!/^[0-9a-f-]{36}$/i.test(tenant)||!/^[0-9a-f-]{36}$/i.test(key))throw new Error("Invalid storage key");const path=resolve(this.root,tenant,key);if(!path.startsWith(resolve(this.root)+"/"))throw new Error("Invalid storage path");return path;}
 async write(tenant:string,bytes:Buffer){const key=randomUUID(),target=this.path(tenant,key),temp=`${target}.tmp-${randomUUID()}`;await mkdir(join(this.root,tenant),{recursive:true,mode:0o700});const handle=await open(temp,"wx",0o600);try{await handle.writeFile(bytes);await handle.sync();await handle.close();await rename(temp,target);return key;}catch(e){await handle.close().catch(()=>{});await rm(temp,{force:true});throw e;}}
 read(tenant:string,key:string){return readFile(this.path(tenant,key));}
 remove(tenant:string,key:string){return rm(this.path(tenant,key),{force:true});}
}
