import type{PoolClient}from"pg";import type{DocumentActor}from"../../authorization/document-policy.js";
export interface DocumentReviewRepositoryPort{
 transaction<T>(tenantId:string,work:(db:PoolClient)=>Promise<T>):Promise<T>;
 document(db:PoolClient,tenantId:string,id:string):Promise<any>;
 analysis(db:PoolClient,tenantId:string,documentId:string):Promise<any>;
 base(db:PoolClient,tenantId:string,sessionId:string):Promise<any>;
 session(db:PoolClient,tenantId:string,id:string):Promise<any>;
 current(db:PoolClient,tenantId:string,documentId:string):Promise<any>;
 fieldChanges(db:PoolClient,tenantId:string,sessionId:string):Promise<any[]>;
 classificationChanges(db:PoolClient,tenantId:string,sessionId:string):Promise<any[]>;
 approved(db:PoolClient,tenantId:string,documentId:string):Promise<any>;
 suggestions(db:PoolClient,tenantId:string,sessionId:string):Promise<any[]>;
 suggestion(db:PoolClient,tenantId:string,id:string):Promise<any>;
 audit(db:PoolClient,actor:Pick<DocumentActor,"tenantId"|"id"|"correlationId">,action:string,documentId:string,metadata:Record<string,unknown>):Promise<void>;
}
