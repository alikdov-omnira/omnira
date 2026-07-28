import type{OmniroContext,OmniroStage}from"./omniro-model.js";
export type OrchestratorIntent="show_projects"|"show_attention"|"open_project"|"show_stage"|"explain"|"company_view"|"unsupported";
export type OrchestratorInterpretation={intent:OrchestratorIntent;confidence:"exact"|"matched"|"unsupported";supported:boolean;projectId?:string;stage?:OmniroStage;explanation:string;source:"local-deterministic-interpreter";trace:{normalizedInput:string;matchedRule:string}};
export interface OrchestratorInterpreter{interpret(input:string,context:OmniroContext):Promise<OrchestratorInterpretation>}
const normalize=(input:string)=>input.trim().toLocaleLowerCase().replace(/[?.!,]/g,"").replace(/\s+/g," ");
const result=(normalizedInput:string,intent:OrchestratorIntent,matchedRule:string,explanation:string,extra:Partial<OrchestratorInterpretation>={}):OrchestratorInterpretation=>({intent,confidence:"exact",supported:true,explanation,source:"local-deterministic-interpreter",trace:{normalizedInput,matchedRule},...extra});
const stageRules:Array<[RegExp,OmniroStage,string]>=[[/room scanner|room scan|сканер комнат|скан помещения/,"room-scan","Room Scanner"],[/technical assignment|техническое задание|тз\b/,"technical-assignment","Technical Assignment"],[/design project|дизайн проект/,"design-project","Design Project"]];
export class LocalOrchestratorInterpreter implements OrchestratorInterpreter{
 async interpret(input:string,context:OmniroContext):Promise<OrchestratorInterpretation>{
  const n=normalize(input);
  if(/^(show projects|projects|pokaż projekty|projekty|покажи проекты|проекты)$/.test(n))return result(n,"show_projects","show-projects","Showing all authoritative projects.");
  if(/requires attention|requiring attention|what requires attention|требует внимания|что требует внимания/.test(n))return result(n,"show_attention","show-attention","Showing projects with incomplete or review-stage workflow records.");
  if(/what is happening|что происходит/.test(n))return result(n,"explain","explain","Summarizing the loaded authoritative workflow state.");
  if(/return to company view|company view|вернуться к компании|обзор компании/.test(n))return result(n,"company_view","company-view","Returning to company view.");
  for(const[pattern,stage,label]of stageRules)if(pattern.test(n))return result(n,"show_stage",`stage:${stage}`,`Focusing the available ${label} stage.`,{stage});
  const open=n.match(/^(?:open project|открой проект)\s+(.+)$/);
  if(open){
   const name=open[1].toLocaleLowerCase(),matches=context.projects.filter(x=>x.name.toLocaleLowerCase()===name||x.name.toLocaleLowerCase().includes(name));
   if(matches.length===1)return result(n,"open_project","open-project",`Focusing project ${matches[0].name}.`,{projectId:matches[0].id});
   if(matches.length>1)return{...result(n,"unsupported","ambiguous-project","More than one project matches that name."),supported:false,confidence:"matched"};
  }
  return{intent:"unsupported",confidence:"unsupported",supported:false,explanation:"This command is not available. OMNIRO can navigate and explain existing workflow state, but cannot calculate or modify construction data.",source:"local-deterministic-interpreter",trace:{normalizedInput:n,matchedRule:"none"}};
 }
}
