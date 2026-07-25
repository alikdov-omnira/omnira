import {domainErrors} from "../errors.js";
import type {DateRange,ProjectHealth,ProjectHealthInput} from "./analytics-types.js";

const DAY=86_400_000;
export function reportRange(input:{range?:7|30|90;start?:string;end?:string},now=new Date()):DateRange{
 const iso=(d:Date)=>d.toISOString().slice(0,10);
 const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 if(input.start||input.end){
  if(!input.start||!input.end)throw domainErrors.validation("start and end must be supplied together");
  const start=new Date(`${input.start}T00:00:00.000Z`),end=new Date(`${input.end}T00:00:00.000Z`);
  if(!Number.isFinite(start.valueOf())||!Number.isFinite(end.valueOf())||start>end)throw domainErrors.validation("Invalid UTC date range");
  if((end.valueOf()-start.valueOf())/DAY>366)throw domainErrors.validation("Date range cannot exceed 366 days");
  return {start:iso(start),endExclusive:iso(new Date(end.valueOf()+DAY))};
 }
 const days=input.range??30;
 return {start:iso(new Date(today.valueOf()-(days-1)*DAY)),endExclusive:iso(new Date(today.valueOf()+DAY))};
}
export function daysOverdue(dueDate:string|null,today:string):number{return dueDate&&dueDate<today?Math.floor((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${dueDate}T00:00:00Z`))/DAY):0;}
export function projectHealth(x:ProjectHealthInput):ProjectHealth{
 if(x.status==="completed")return {state:"completed",score:100,reasons:["project_completed"]};
 if(x.status==="paused"||x.status==="cancelled")return {state:"paused",score:0,reasons:[x.status==="cancelled"?"project_cancelled":"project_paused"]};
 const reasons:string[]=[];let score=100;
 if(x.endDatePassed){reasons.push("project_end_date_passed");score-=35;}
 if(x.overdueTasks>0){reasons.push("overdue_tasks");score-=Math.min(35,x.overdueTasks*10);}
 if(x.blockedTasks>0){reasons.push("blocked_tasks");score-=Math.min(25,x.blockedTasks*8);}
 if(Number(x.overdueReceivables)>0){reasons.push("overdue_receivables");score-=15;}
 if(x.grossMargin!==null&&Number(x.grossMargin)<0){reasons.push("negative_margin");score-=25;}
 score=Math.max(0,score);
 return {state:score<50?"at_risk":score<80?"attention":"healthy",score,reasons:reasons.length?reasons:["no_risk_factors"]};
}
export function csvCell(value:unknown):string{
 let text=value===null||value===undefined?"":String(value);
 if(/^[=+\-@\t\r]/.test(text))text=`'${text}`;
 return `"${text.replaceAll('"','""')}"`;
}
export function csv(headers:string[],rows:Record<string,unknown>[]):string{return `\uFEFF${headers.map(csvCell).join(",")}\r\n${rows.map(row=>headers.map(h=>csvCell(row[h])).join(",")).join("\r\n")}\r\n`;}
