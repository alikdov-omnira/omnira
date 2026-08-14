import type{Session}from"./api.js";
import type{OmniroTruth}from"./omniro-module-contract.js";

export type RoleWorkspaceCategory="executive"|"finance"|"commercial"|"operations"|"project"|"engineering"|"compliance"|"people";
export type RoleWorkspaceStatus="active"|"registered";
export type RoleWorkspaceCapability={id:string;label:string;requiredPermissions:readonly string[];truth:OmniroTruth;reason:string};
export type RoleWorkspaceDefinition={
 roleId:string;
 label:string;
 category:RoleWorkspaceCategory;
 requiredPermissions:readonly string[];
 availableModules:readonly string[];
 primaryActions:readonly string[];
 attentionSources:readonly string[];
 assistantCapabilities:readonly RoleWorkspaceCapability[];
 communicationCapabilities:readonly RoleWorkspaceCapability[];
 temporaryAssignmentSupport:boolean;
 status:RoleWorkspaceStatus;
};
export type ResolvedRoleWorkspace={definition:RoleWorkspaceDefinition;truth:OmniroTruth;reason:string;actualActorId:string;actualActorName:string};

export class OmniroRoleWorkspaceRegistry{
 readonly definitions:readonly RoleWorkspaceDefinition[];
 readonly byId:ReadonlyMap<string,RoleWorkspaceDefinition>;
 constructor(items:readonly RoleWorkspaceDefinition[]){const map=new Map<string,RoleWorkspaceDefinition>();for(const item of items){if(map.has(item.roleId))throw new Error(`Duplicate OMNIRO role workspace: ${item.roleId}`);map.set(item.roleId,Object.freeze({...item}))}this.definitions=Object.freeze([...map.values()]);this.byId=map}
 get(roleId:string){return this.byId.get(roleId)}
 resolve(roleId:string,session:Session):ResolvedRoleWorkspace{const definition=this.get(roleId);if(!definition){const unavailable:RoleWorkspaceDefinition={roleId,label:"Unknown workspace",category:"operations",requiredPermissions:[],availableModules:[],primaryActions:[],attentionSources:[],assistantCapabilities:[],communicationCapabilities:[],temporaryAssignmentSupport:false,status:"registered"};return{definition:unavailable,truth:"UNAVAILABLE",reason:"Unknown role workspace.",actualActorId:session.user.id,actualActorName:session.user.displayName}}const allowed=definition.status==="active"&&definition.requiredPermissions.every(permission=>session.permissions.includes(permission));return{definition,truth:allowed?"REAL":"UNAVAILABLE",reason:allowed?"Workspace is projected for the authenticated actor from existing permissions.":definition.status!=="active"?"Role workspace is registered for future implementation.":"The authenticated actor does not hold the required base permission.",actualActorId:session.user.id,actualActorName:session.user.displayName}}
}

const unavailableAssistant=(id:string,label:string,reason:string):RoleWorkspaceCapability=>({id,label,requiredPermissions:[],truth:"UNAVAILABLE",reason});
const future=(roleId:string,label:string,category:RoleWorkspaceCategory):RoleWorkspaceDefinition=>({roleId,label,category,requiredPermissions:[],availableModules:[],primaryActions:[],attentionSources:[],assistantCapabilities:[],communicationCapabilities:[],temporaryAssignmentSupport:false,status:"registered"});

export const roleWorkspaceRegistry=new OmniroRoleWorkspaceRegistry([
 {roleId:"director",label:"Director / Owner",category:"executive",requiredPermissions:["projects.read"],availableModules:["project","room-scanner","technical-assignment","design-project","technology","work-scope","engineering-norms","material-consumption","regional-pricing","company-price-book","commercial-estimate"],primaryActions:["review-priority-actions","open-domain-approval","open-source-evidence","switch-project-context"],attentionSources:["module-lifecycle","tasks","documents","notifications","finance"],assistantCapabilities:[{id:"orchestrator",label:"Orchestrator",requiredPermissions:["projects.read"],truth:"DERIVED",reason:"Deterministic explanation from registered authorities and evidence."},{id:"ai-secretary",label:"AI Secretary",requiredPermissions:["projects.read"],truth:"PARTIAL",reason:"Deterministic briefing is available; free-form company reasoning is not connected."},{id:"economic-analyst",label:"Economic Analyst",requiredPermissions:["commercial_estimates.read"],truth:"PARTIAL",reason:"Project commercial calculations are available; company accounting conclusions are not inferred."},unavailableAssistant("legal-advisor","Legal Advisor","No verified external legal intelligence source is connected.")],communicationCapabilities:[{id:"internal",label:"OMNIRO Internal",requiredPermissions:["notifications.read"],truth:"REAL",reason:"Existing in-app notifications are connected."},unavailableAssistant("email","Email","No email provider is connected."),unavailableAssistant("whatsapp","WhatsApp Business","No WhatsApp provider is connected."),unavailableAssistant("telegram","Telegram","No Telegram provider is connected."),unavailableAssistant("voice","Voice","No voice communication provider is connected.")],temporaryAssignmentSupport:false,status:"active"},
 future("executive-assistant","Executive Assistant","executive"),future("accountant","Accountant","finance"),future("finance-manager","Finance Manager","finance"),future("tax-specialist","Tax Specialist","finance"),future("economic-analyst","Economic Analyst","commercial"),future("legal-counsel","Legal Counsel","compliance"),future("sales-manager","Sales Manager","commercial"),future("marketing-manager","Marketing Manager","commercial"),future("hr-manager","HR Manager","people"),future("procurement-manager","Procurement Manager","operations"),future("operations-manager","Operations Manager","operations"),future("project-manager","Project Manager","project"),future("site-manager","Site Manager","project"),future("engineer","Engineer","engineering"),future("architect","Architect","engineering"),future("estimator","Estimator","commercial"),future("hse","HSE","compliance"),future("quality-control","Quality Control","compliance"),future("worker","Worker","operations")
]);
