import type{ProjectContract}from"@odls/contracts";
import type{Session}from"./api.js";
import type{OmniroFlowRuntimeState}from"./omniro-flow-contract.js";
import type{OmniroRuntimeSnapshot,OmniroTruth}from"./omniro-module-contract.js";

export type OmniroEnvironmentLayer="universe"|"building"|"role";
export type OmniroEnvironmentRoute={layer:OmniroEnvironmentLayer;roleId?:string};
export const parseEnvironmentRoute=(hash:string):OmniroEnvironmentRoute|undefined=>{
 const parts=hash.replace(/^#/,"").split("/").filter(Boolean).map(decodeURIComponent);
 if(parts[0]!=="omniro")return undefined;
 if(parts[1]==="universe")return{layer:"universe"};
 if(parts[1]==="building")return{layer:"building"};
 if(parts[1]==="role")return{layer:"role",roleId:parts[2]??"director"};
 return undefined;
};
export const environmentHash=(route:OmniroEnvironmentRoute)=>route.layer==="role"?`#omniro/role/${encodeURIComponent(route.roleId??"director")}`:`#omniro/${route.layer}`;

export type OmniroProductDefinition={id:string;label:string;description:string;glyph:string;defaultTruth:OmniroTruth;resolve:(projects:readonly ProjectContract[])=>{truth:OmniroTruth;reason:string};route?:OmniroEnvironmentRoute};
export class OmniroProductRegistry{readonly definitions:readonly OmniroProductDefinition[];readonly byId:ReadonlyMap<string,OmniroProductDefinition>;constructor(items:readonly OmniroProductDefinition[]){const map=new Map<string,OmniroProductDefinition>();for(const item of items){if(map.has(item.id))throw new Error(`Duplicate OMNIRO product: ${item.id}`);map.set(item.id,item)}this.definitions=Object.freeze([...items]);this.byId=map}get(id:string){return this.byId.get(id)}}
const unavailable=(label:string)=>()=>({truth:"UNAVAILABLE"as const,reason:`${label} is registered as a future Product World; no connected product runtime is available.`});
export const productRegistry=new OmniroProductRegistry([
 {id:"building",label:"OMNIRO Building",description:"Construction operating environment",glyph:"▥",defaultTruth:"REAL",route:{layer:"building"},resolve:projects=>projects.length?{truth:"REAL",reason:`${projects.length} authoritative project context${projects.length===1?" is":"s are"} connected.`}:{truth:"PARTIAL",reason:"Building contracts are connected, but no readable project context is currently available."}},
 {id:"finance",label:"OMNIRO Finance",description:"Financial control and accounting",glyph:"$",defaultTruth:"UNAVAILABLE",resolve:unavailable("Finance Product World")},
 {id:"legal",label:"OMNIRO Legal",description:"Legal and contracts",glyph:"§",defaultTruth:"UNAVAILABLE",resolve:unavailable("Legal Product World")},
 {id:"tax",label:"OMNIRO Tax / PIT",description:"Tax and compliance",glyph:"TAX",defaultTruth:"UNAVAILABLE",resolve:unavailable("Tax Product World")},
 {id:"market",label:"OMNIRO Market",description:"Market intelligence",glyph:"↗",defaultTruth:"UNAVAILABLE",resolve:unavailable("Market Product World")},
 {id:"people",label:"OMNIRO People",description:"People and workforce",glyph:"◎",defaultTruth:"UNAVAILABLE",resolve:unavailable("People Product World")}
]);

export type OmniroRoleDefinition={id:string;label:string;description:string;requiredPermissions:string[];defaultTruth:OmniroTruth};
export class OmniroRoleRegistry{readonly definitions:readonly OmniroRoleDefinition[];readonly byId:ReadonlyMap<string,OmniroRoleDefinition>;constructor(items:readonly OmniroRoleDefinition[]){const map=new Map<string,OmniroRoleDefinition>();for(const item of items){if(map.has(item.id))throw new Error(`Duplicate OMNIRO role: ${item.id}`);map.set(item.id,item)}this.definitions=Object.freeze([...items]);this.byId=map}get(id:string){return this.byId.get(id)}resolve(id:string,session:Session){const role=this.get(id);if(!role)return{truth:"UNAVAILABLE"as const,reason:"Unknown role workspace."};if(role.defaultTruth!=="REAL")return{truth:role.defaultTruth,reason:"Role projection is registered but not implemented in this slice."};const allowed=role.requiredPermissions.every(permission=>session.permissions.includes(permission));return allowed?{truth:"REAL"as const,reason:"Workspace is projected from the authenticated actor and existing permissions."}:{truth:"UNAVAILABLE"as const,reason:"The authenticated actor does not hold the permissions required by this workspace."}}}
export const roleRegistry=new OmniroRoleRegistry([
 {id:"director",label:"Director / Owner",description:"Portfolio command and human authority workspace",requiredPermissions:["projects.read"],defaultTruth:"REAL"},
 {id:"executive-assistant",label:"Executive Assistant",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"accountant",label:"Accountant",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"project-manager",label:"Project Manager",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"site-manager",label:"Site Manager",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"engineer",label:"Engineer",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"procurement-manager",label:"Procurement Manager",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"},
 {id:"legal-counsel",label:"Legal Counsel",description:"Future role projection",requiredPermissions:[],defaultTruth:"UNAVAILABLE"}
]);

export type CanonicalDataFlowId="01"|"02"|"03"|"04"|"05"|"06"|"07"|"08";
export type CanonicalDataFlow={id:CanonicalDataFlowId;key:string;label:string;color:string;moduleIds:readonly string[]};
export class OmniroDataFlowVisualRegistry{readonly definitions:readonly CanonicalDataFlow[];readonly byId:ReadonlyMap<string,CanonicalDataFlow>;constructor(items:readonly CanonicalDataFlow[]){const ids=new Set<string>(),colors=new Set<string>();for(const item of items){if(ids.has(item.id))throw new Error(`Duplicate data flow number: ${item.id}`);if(colors.has(item.color))throw new Error(`Duplicate data flow color: ${item.color}`);ids.add(item.id);colors.add(item.color)}this.definitions=Object.freeze([...items]);this.byId=new Map(items.map(item=>[item.id,item]))}project(runtime:OmniroRuntimeSnapshot,flows:readonly OmniroFlowRuntimeState[]){return this.definitions.map(definition=>{const modules=definition.moduleIds.map(id=>runtime.modules.get(id)).filter(Boolean),related=flows.filter(flow=>definition.moduleIds.some(id=>flow.flowId.includes(id))),active=modules.some(module=>module?.truth==="REAL")||related.some(flow=>flow.state==="available");return{...definition,active,truth:active?"DERIVED"as const:"UNAVAILABLE"as const,evidenceCount:related.reduce((count,flow)=>count+flow.evidence.length,0)}})}}
export const dataFlowVisualRegistry=new OmniroDataFlowVisualRegistry([
 {id:"01",key:"financial",label:"Financial",color:"#16d9f5",moduleIds:["regional-pricing","company-price-book","commercial-estimate"]},
 {id:"02",key:"project",label:"Project",color:"#38b6ff",moduleIds:["project","room-scanner","technical-assignment","design-project"]},
 {id:"03",key:"document",label:"Document",color:"#d96cff",moduleIds:["documents"]},
 {id:"04",key:"communication",label:"Communication",color:"#7de34b",moduleIds:[]},
 {id:"05",key:"compliance",label:"Compliance",color:"#ff5a36",moduleIds:["engineering-norms"]},
 {id:"06",key:"analytics",label:"Analytics",color:"#4ba8ff",moduleIds:[]},
 {id:"07",key:"procurement",label:"Procurement",color:"#ffb229",moduleIds:["material-consumption"]},
 {id:"08",key:"people",label:"People",color:"#ff5b9d",moduleIds:[]}
]);
