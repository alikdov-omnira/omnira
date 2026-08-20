export type AgentTruth="REAL"|"DERIVED"|"PARTIAL"|"UNAVAILABLE";
export type AgentCapability="find"|"explain"|"analyze"|"draft"|"recommend"|"prepare_action";
export type AgentDefinition={id:string;label:string;capabilities:readonly AgentCapability[];requiredPermissions:readonly string[];truth:AgentTruth;reason:string};

export class AgentRegistry{
 readonly definitions:readonly AgentDefinition[];readonly byId:ReadonlyMap<string,AgentDefinition>;
 constructor(items:readonly AgentDefinition[]){const map=new Map<string,AgentDefinition>();for(const item of items){if(map.has(item.id))throw new Error(`Duplicate OMNIRO agent: ${item.id}`);map.set(item.id,Object.freeze({...item}))}this.definitions=Object.freeze([...map.values()]);this.byId=map}
 get(id:string){return this.byId.get(id)}
}
const real=(id:string,label:string,permissions:string[],capabilities:AgentCapability[]):AgentDefinition=>({id,label,requiredPermissions:permissions,capabilities,truth:"REAL",reason:"Uses existing OMNIRO authorities through permission-bound deterministic adapters."});
export const agentRegistry=new AgentRegistry([
 real("project-analyst","Project Analyst Agent",["projects.read"],["find","explain","analyze","recommend"]),
 real("document","Document Agent",["documents.read"],["find","explain","analyze","draft"]),
 real("finance","Finance Agent",["finance.read"],["find","explain","analyze"]),
 {...real("legal","Legal Agent",["documents.read","projects.read"],["find","explain","analyze","draft"]),truth:"PARTIAL",reason:"Grounded document drafting is available; no external legal intelligence or autonomous legal authority is connected."},
 real("engineering","Engineering Agent",["projects.read"],["find","explain","analyze","recommend"]),
 {id:"communication",label:"Communication Agent",requiredPermissions:["projects.read"],capabilities:["draft","prepare_action"],truth:"PARTIAL",reason:"Message drafts are available; Email, WhatsApp and Telegram providers are not connected."},
 real("support","Support Agent",[],["explain","recommend"]),
 {id:"calendar-notes",label:"Calendar / Notes Agent",requiredPermissions:[],capabilities:["find","draft"],truth:"UNAVAILABLE",reason:"Calendar and Notes authorities are not connected."}
]);
