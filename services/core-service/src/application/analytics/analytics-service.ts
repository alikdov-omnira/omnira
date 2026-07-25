import type {Pool} from "pg";
import {AnalyticsRepository} from "../../infrastructure/analytics/analytics-repository.js";
import {csv,projectHealth,reportRange} from "../../domain/analytics/analytics-rules.js";
import type {AnalyticsActor,AnalyticsQuery,ReportName} from "../../domain/analytics/analytics-types.js";
import {requireDashboard,requireReport} from "../../authorization/analytics-policy.js";

const exportHeaders:Partial<Record<ReportName,string[]>>={
 "accounts-receivable":["invoiceNumber","clientName","projectName","issueDate","dueDate","currencyCode","gross","paid","outstanding","daysOverdue","status"],
 profitability:["projectName","currencyCode","budget","invoiced","paid","expenses","margin","marginPercentage","overdueReceivables"],
 workload:["userId","displayName","isDisabled","openCount","inProgressCount","blockedCount","overdueCount","dueSoonCount"],
 deadlines:["id","title","status","dueDate","bucket","projectId","projectName"],
 documents:["id","filename","category","uploaderName","linkedEntityTypes","createdAt"]
};
export class AnalyticsService{
 private readonly repo:AnalyticsRepository;
 constructor(pool:Pool,private readonly clock=()=>new Date(),repo?:AnalyticsRepository){this.repo=repo??new AnalyticsRepository(pool);}
 query(raw:any):AnalyticsQuery{const range=reportRange(raw,this.clock());return {...raw,...range,page:raw.page??1,pageSize:raw.pageSize??25,sortOrder:raw.sortOrder??"desc"};}
 private async timed<T>(actor:AnalyticsActor,name:string,operation:()=>Promise<T>):Promise<T>{const started=Date.now();const result=await operation();const rows=Array.isArray(result)?result.length:1,durationMs=Date.now()-started;console.info(JSON.stringify({event:"analytics.query",report:name,durationMs,rows,correlationId:actor.correlationId,slow:durationMs>1000}));return result;}
 async executive(actor:AnalyticsActor,raw:any){requireDashboard(actor);const q=this.query(raw);const data=await this.timed(actor,"executive",()=>this.repo.executive(actor,q,actor.permissions.includes("operational_metrics.read")));return {range:{start:q.start,endExclusive:q.endExclusive,timezone:"UTC"},...data};}
 async health(actor:AnalyticsActor){requireDashboard(actor);if(!actor.permissions.includes("projects.read"))return [];const rows=await this.timed(actor,"project-health",()=>this.repo.projectHealth(actor));return rows.map((row:any)=>({...row,health:projectHealth(row)}));}
 async report(actor:AnalyticsActor,name:ReportName,raw:any){requireReport(actor,name);const q=this.query(raw),rows=await this.timed(actor,name,()=>this.repo.report(actor,name,q));const total=Number(rows[0]?.totalCount??rows.length);return {data:rows.map(({totalCount,...row}:any)=>row),range:{start:q.start,endExclusive:q.endExclusive,timezone:"UTC"},pagination:{page:q.page,pageSize:q.pageSize,total,totalPages:Math.ceil(total/q.pageSize)}};}
 async export(actor:AnalyticsActor,name:ReportName,raw:any){requireReport(actor,name,true);const headers=exportHeaders[name];if(!headers)throw (await import("../../domain/errors.js")).domainErrors.validation("This report does not support CSV export");const q=this.query({...raw,page:1,pageSize:Math.min(Number(raw.pageSize??5000),5000)}),rows=await this.timed(actor,`${name}.export`,()=>this.repo.report(actor,name,q));return {body:csv(headers,rows),filename:`${name}-${q.start}-${q.endExclusive}.csv`,rowCount:rows.length};}
}
