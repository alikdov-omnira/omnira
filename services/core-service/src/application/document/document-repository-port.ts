import type {PoolClient} from "pg";
import type {DocumentActor} from "../../authorization/document-policy.js";

export interface DocumentRepositoryPort{
 document(db:PoolClient,tenantId:string,id:string):Promise<any|undefined>;
 versions(db:PoolClient,tenantId:string,id:string):Promise<any[]>;
 list(db:PoolClient,tenantId:string,query:unknown):Promise<{items:any[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>;
 audit(db:PoolClient,actor:DocumentActor,action:string,id:string,metadata:Record<string,unknown>):Promise<void>;
}
