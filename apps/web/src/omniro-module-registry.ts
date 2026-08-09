import type{OmniroModuleDefinition}from"./omniro-module-contract.js";

export class OmniroModuleRegistry{
 readonly definitions:readonly OmniroModuleDefinition[];readonly byId:ReadonlyMap<string,OmniroModuleDefinition>;
 constructor(definitions:readonly OmniroModuleDefinition[]){const byId=new Map<string,OmniroModuleDefinition>();for(const item of definitions){if(byId.has(item.id))throw new Error(`Duplicate OMNIRO module: ${item.id}`);if(!item.accessibility.label||!item.accessibility.description)throw new Error(`Missing accessibility semantics: ${item.id}`);byId.set(item.id,item)}for(const item of definitions)for(const dependency of item.dependencies)if(!byId.has(dependency))throw new Error(`Unknown dependency ${dependency} for ${item.id}`);this.definitions=Object.freeze([...definitions]);this.byId=byId}
 get(id:string){return this.byId.get(id)}
 require(id:string){const item=this.get(id);if(!item)throw new Error(`Unknown OMNIRO module: ${id}`);return item}
}
