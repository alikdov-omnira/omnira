import type {PoolClient} from "pg";
import type {DocumentActor} from "../../authorization/document-policy.js";

export interface DocumentPageRepositoryPort{
 document(db:PoolClient,tenantId:string,documentId:string):Promise<any|undefined>;
 page(db:PoolClient,tenantId:string,documentId:string,pageId:string):Promise<any|undefined>;
 pages(db:PoolClient,tenantId:string,documentId:string):Promise<any[]>;
 file(db:PoolClient,tenantId:string,fileObjectId:string):Promise<any|undefined>;
 audit(db:PoolClient,actor:DocumentActor,action:string,documentId:string,metadata:Record<string,unknown>):Promise<void>;
}
