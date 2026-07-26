import type {CreateLaborRate,LaborRate,LaborRatePage,LaborRateQuery,LaborRateResolutionParams,LaborRateScope,UpdateLaborRate} from "../../domain/labor-rate-catalog/labor-rate-types.js";

export type LaborRateAuditEvent={
 tenantId:string;actorId:string;action:string;entityType:"labor_rate";entityId:string;
 correlationId:string;metadata:Record<string,unknown>;
};
export type LaborRateOverlapCandidate=LaborRateScope&{
 effectiveFrom:string;effectiveTo:string|null;isActive:boolean;
};
export interface LaborRateCatalogRepository{
 transaction<T>(tenantId:string,operation:(repository:LaborRateCatalogRepository)=>Promise<T>,systemContext?:boolean):Promise<T>;
 findById(tenantId:string,id:string):Promise<LaborRate|undefined>;
 findOverlapping(tenantId:string,candidate:LaborRateOverlapCandidate,excludeId?:string):Promise<LaborRate[]>;
 findResolutionCandidates(params:LaborRateResolutionParams):Promise<LaborRate[]>;
 list(tenantId:string,query:LaborRateQuery,systemOnly?:boolean):Promise<LaborRatePage>;
 isSystemActor(actorId:string):Promise<boolean>;
 resolveCatalogCodes(tenantId:string,workCode:string,unitCode:string):Promise<{workId:string;unitId:string}|undefined>;
 create(tenantId:string,actorId:string,id:string,input:CreateLaborRate):Promise<LaborRate>;
 update(tenantId:string,actorId:string,id:string,input:UpdateLaborRate):Promise<LaborRate|undefined>;
 setActive(tenantId:string,actorId:string,id:string,isActive:boolean,expectedVersion:number,sourceType?:LaborRate["sourceType"]):Promise<LaborRate|undefined>;
 audit(event:LaborRateAuditEvent):Promise<void>;
}
