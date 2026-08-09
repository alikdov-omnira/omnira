import{OmniroWorkspaceRegistry}from"./omniro-workspace-registry.js";import{buildingModuleRegistry}from"./omniro-building-modules.js";
const load=()=>import("./omniro-workspace-content.js");
export const buildingWorkspaceRegistry=new OmniroWorkspaceRegistry([
 {id:"room-scanner",moduleId:"room-scanner",routeSegment:"room-scanner",requiredPermissions:["room_scans.read"],load},
 {id:"technical-assignment",moduleId:"technical-assignment",routeSegment:"technical-assignment",requiredPermissions:["technical_assignments.read"],load},
 {id:"design-project",moduleId:"design-project",routeSegment:"design-project",requiredPermissions:["design_projects.read"],load}
],buildingModuleRegistry);
