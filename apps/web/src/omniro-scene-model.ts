import type{OmniroContext,OmniroProject,OmniroStageNode,OmniroVisualState}from"./omniro-model.js";
import type{OrchestratorInterpretation}from"./omniro-interpreter.js";

export type OmniroPresenceState="dormant"|"present"|"listening"|"interpreting"|"presenting"|"directing-attention"|"focusing-project"|"unavailable"|"error";
export type PresenceEvent="data-ready"|"listen"|"interpret"|"show-attention"|"focus-project"|"present"|"unavailable"|"fail"|"reset";
export type EarthState="idle"|"listening"|"interpreting"|"company-attention"|"project-focus"|"unavailable-data"|"partial-load"|"error"|"reduced-motion"|"renderer-fallback";
export type FlowKind="project"|"room-scan"|"technical-assignment"|"design-project"|"assistant-focus"|"unavailable";
export type SemanticFlow={id:string;kind:FlowKind;state:OmniroVisualState;label:string;description:string};
export type OrchestrationPresentation={understoodIntent:string;visualTransition:string;focusedEntities:Array<{entityType:string;entityId:string;label:string}>;authoritativeReasons:string[];mutatedData:false;unsupportedCapability?:string;verification:string};
export const transitionPresence=(state:OmniroPresenceState,event:PresenceEvent):OmniroPresenceState=>{
 if(event==="fail")return"error";if(event==="unavailable")return"unavailable";if(event==="listen")return"listening";if(event==="interpret")return"interpreting";if(event==="show-attention")return"directing-attention";if(event==="focus-project")return"focusing-project";if(event==="present")return"presenting";if(event==="data-ready"||event==="reset")return"present";return state;
};
export const deriveEarthState=(presence:OmniroPresenceState,projectId:string,attentionOnly:boolean,partial:boolean,reduced:boolean,fallback:boolean):EarthState=>{
 if(fallback)return"renderer-fallback";if(reduced)return"reduced-motion";if(presence==="error")return"error";if(partial)return"partial-load";if(presence==="unavailable")return"unavailable-data";if(presence==="listening")return"listening";if(presence==="interpreting")return"interpreting";if(projectId)return"project-focus";if(attentionOnly)return"company-attention";return"idle";
};
export const stageFlowKind=(stage:OmniroStageNode):FlowKind=>stage.stage==="room-scan"?"room-scan":stage.stage==="technical-assignment"?"technical-assignment":stage.stage==="design-project"?"design-project":"unavailable";
export function semanticFlows(projects:OmniroProject[],focusedProjectId?:string):SemanticFlow[]{return projects.flatMap(project=>[
 {id:`flow:project:${project.id}`,kind:focusedProjectId===project.id?"assistant-focus":"project",state:project.visualState,label:project.name,description:`Project ${project.name} is ${project.status}.`}as SemanticFlow,
 ...project.stages.map(stage=>({id:`flow:${stage.id}`,kind:stageFlowKind(stage),state:stage.visualState,label:stage.label,description:stage.explanation}))
 ]);}
export function deriveCompanyBrief(context:OmniroContext):string{
 const requiring=context.projects.filter(x=>x.attentionReasons.length).length,review=context.projects.flatMap(x=>x.stages).filter(x=>["review_required","ready_for_approval"].includes(x.status)).length,editable=context.projects.flatMap(x=>x.stages).filter(x=>["draft","collecting_information","in_review"].includes(x.status)).length;
 if(!context.projects.length)return"Based on the currently loaded authoritative state, no projects are available.";
 const statements=[`${requiring} project${requiring===1?"":"s"} require workflow attention.`];if(review)statements.push(`${review} workflow record${review===1?" is":"s are"} awaiting review or approval.`);if(editable)statements.push(`${editable} workflow record${editable===1?" remains":"s remain"} editable.`);return`Based on the currently loaded authoritative state: ${statements.join(" ")}`;
}
export function derivePresentation(result:OrchestratorInterpretation,context:OmniroContext):OrchestrationPresentation{
 const projects=result.projectId?context.projects.filter(x=>x.id===result.projectId):result.intent==="show_attention"?context.projects.filter(x=>x.attentionReasons.length):context.projects;
 const unsupported=result.supported?undefined:result.trace.normalizedInput.match(/estimate|смет/)?"Estimate":result.trace.normalizedInput.match(/material|материал/)?"Procurement":result.trace.normalizedInput.match(/technolog|технолог/)?"Technology":result.trace.normalizedInput.match(/norm|норм/)?"Norms":"Unsupported command";
 return{understoodIntent:result.intent,visualTransition:result.intent==="open_project"?"Company Universe → Project Universe":result.intent==="company_view"?"Project Universe → Company Universe":result.intent==="show_attention"?"Attention flows emphasized":"Authoritative state presented",focusedEntities:projects.map(x=>({entityType:"project",entityId:x.id,label:x.name})),authoritativeReasons:projects.flatMap(x=>x.attentionReasons),mutatedData:false,unsupportedCapability:unsupported,verification:"Open the project workflow semantic view or existing project workspace to verify."};
}
export const rendererMode=(requested:"enhanced"|"balanced"|"reduced",failed:boolean,hidden:boolean)=>failed?"fallback":requested==="reduced"||hidden?"static":requested;
