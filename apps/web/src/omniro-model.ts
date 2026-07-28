import type{ProjectContract}from"@odls/contracts";
import type{DesignProjectDto,RoomScanDto,TechnicalAssignmentDto}from"./api.js";

export type OmniroStage="room-scan"|"technical-assignment"|"design-project"|"work-scope"|"technology"|"norms"|"pricing"|"estimate";
export type OmniroVisualState="completed"|"attention"|"active"|"unavailable"|"neutral";
export type OmniroProject={id:string;name:string;number:string;status:string;visualState:OmniroVisualState;attentionReasons:string[];stages:OmniroStageNode[]};
export type OmniroStageNode={id:string;stage:OmniroStage;label:string;status:string;visualState:OmniroVisualState;available:boolean;recordId?:string;explanation:string};
export type OmniroContext={projects:OmniroProject[];insights:OmniroInsight[]};
export type OmniroInsight={id:string;priority:number;projectId:string;entityType:string;entityId:string;status:string;statement:string;explanation:string;stage?:OmniroStage};

const planned:Array<[OmniroStage,string]>=[["work-scope","Work Scope"],["technology","Technology"],["norms","Norms"],["pricing","Pricing"],["estimate","Estimate"]];
const completed=new Set(["approved","completed"]);
const attention=new Set(["review_required","ready_for_approval","rejected","failed"]);
const stageState=(status?:string):OmniroVisualState=>!status?"attention":completed.has(status)?"completed":attention.has(status)?"attention":"active";
const existing=(projectId:string,stage:OmniroStage,label:string,records:Array<{id:string;projectId?:string;status:string;updatedAt?:string}>):OmniroStageNode=>{
 const record=records.filter(x=>x.projectId===projectId).sort((a,b)=>(b.updatedAt??"").localeCompare(a.updatedAt??""))[0];
 return record?{id:`project:${projectId}:stage:${stage}`,stage,label,status:record.status,visualState:stageState(record.status),available:true,recordId:record.id,explanation:`Authoritative ${label} record is ${record.status.replaceAll("_"," ")}.`}:{id:`project:${projectId}:stage:${stage}`,stage,label,status:"not_started",visualState:"attention",available:true,explanation:`No project-linked ${label} record is available.`};
};
export function composeOmniroContext(projects:ProjectContract[],scans:RoomScanDto[],assignments:TechnicalAssignmentDto[],designs:DesignProjectDto[]):OmniroContext{
 const graph:OmniroProject[]=projects.slice().sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id)).map(project=>{
  const stages=[
   existing(project.id,"room-scan","Room Scanner",scans),
   existing(project.id,"technical-assignment","Technical Assignment",assignments),
   existing(project.id,"design-project","Design Project",designs),
   ...planned.map(([stage,label]):OmniroStageNode=>({id:`project:${project.id}:stage:${stage}`,stage,label,status:"unavailable",visualState:"unavailable",available:false,explanation:`${label} is planned and not connected in this foundation.`}))
  ];
  const attentionReasons=stages.slice(0,3).filter(x=>x.visualState==="attention"||x.visualState==="active").map(x=>x.explanation);
  return{id:project.id,name:project.name,number:project.projectNumber,status:project.status,visualState:attentionReasons.length?"attention":stages.slice(0,3).some(x=>x.visualState==="active")?"active":"completed",attentionReasons,stages};
 });
 const insights=graph.flatMap(project=>project.stages.slice(0,3).map((stage):OmniroInsight=>({
  id:`insight:${stage.id}`,priority:stage.visualState==="attention"?3:stage.visualState==="active"?4:5,projectId:project.id,entityType:stage.stage,entityId:stage.recordId??project.id,status:stage.status,
  statement:stage.recordId?`${project.name}: ${stage.label} is ${stage.status.replaceAll("_"," ")}.`:`${project.name}: ${stage.label} has not started.`,
  explanation:stage.explanation,stage:stage.stage
 }))).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 return{projects:graph,insights};
}
