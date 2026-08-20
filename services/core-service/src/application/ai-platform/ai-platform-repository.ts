import type{PoolClient}from"pg";
export type AiActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export type SourceReference={entityType:string;entityId:string;version?:number;label:string;status?:string;timestamp?:string;provenance?:Record<string,unknown>};
export interface AiPlatformRepository{
 project(db:PoolClient,actor:AiActor,projectId:string):Promise<any|undefined>;
 clientProjectAccess(db:PoolClient,actor:AiActor,projectId:string):Promise<boolean>;
 findClient(db:PoolClient,actor:AiActor,projectId:string,query:string):Promise<any|undefined>;
 findDocument(db:PoolClient,actor:AiActor,projectId:string,query:{type?:string;search:string;approved:boolean}):Promise<any|undefined>;
 invoices(db:PoolClient,actor:AiActor,projectId:string):Promise<any[]>;
 estimate(db:PoolClient,actor:AiActor,projectId:string):Promise<any|undefined>;
 attention(db:PoolClient,actor:AiActor,projectId:string):Promise<any[]>;
 weather(db:PoolClient,actor:AiActor,projectId:string):Promise<any[]>;
 createCommand(db:PoolClient,actor:AiActor,input:any):Promise<string>;
 createDraft(db:PoolClient,actor:AiActor,input:any):Promise<any>;
 history(db:PoolClient,actor:AiActor):Promise<any[]>;
 audit(db:PoolClient,actor:AiActor,action:string,entityId:string,metadata:Record<string,unknown>):Promise<void>;
}
