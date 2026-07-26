import type{PoolClient}from"pg";
export type DocumentAnalysisAuditActor={tenantId:string;id:string;correlationId:string};
export interface DocumentAnalysisRepositoryPort{
 transaction<T>(tenantId:string,work:(db:PoolClient)=>Promise<T>):Promise<T>;
 document(db:PoolClient,tenantId:string,id:string):Promise<any>;
 pageCount(db:PoolClient,tenantId:string,documentId:string):Promise<number>;
 pages(db:PoolClient,tenantId:string,documentId:string,asOf?:Date|string):Promise<any[]>;
 job(db:PoolClient,tenantId:string,id:string):Promise<any>;
 classification(db:PoolClient,tenantId:string,documentId:string):Promise<any>;
 extraction(db:PoolClient,tenantId:string,documentId:string):Promise<any>;
 audit(db:PoolClient,actor:DocumentAnalysisAuditActor,action:string,documentId:string,metadata:Record<string,unknown>):Promise<void>;
}
