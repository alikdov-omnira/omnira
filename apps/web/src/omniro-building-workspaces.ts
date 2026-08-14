import{OmniroWorkspaceRegistry}from"./omniro-workspace-registry.js";import{buildingModuleRegistry}from"./omniro-building-modules.js";
const load=()=>import("./omniro-workspace-content.js");
const loadStage2B=()=>import("./omniro-stage-2b-workspaces.js");
const loadStage2C=()=>import("./omniro-stage-2c-workspace.js");
const loadMaterialConsumption=()=>import("./omniro-material-consumption-workspace.js");
const loadRegionalPricing=()=>import("./omniro-regional-pricing-workspace.js");
const loadCommercialEstimate=()=>import("./omniro-commercial-estimate-workspace.js");
export const buildingWorkspaceRegistry=new OmniroWorkspaceRegistry([
 {id:"room-scanner",moduleId:"room-scanner",routeSegment:"room-scanner",requiredPermissions:["room_scans.read"],load},
 {id:"technical-assignment",moduleId:"technical-assignment",routeSegment:"technical-assignment",requiredPermissions:["technical_assignments.read"],load},
 {id:"design-project",moduleId:"design-project",routeSegment:"design-project",requiredPermissions:["design_projects.read"],load}
 ,{id:"technology",moduleId:"technology",routeSegment:"technology",requiredPermissions:["work_scopes.read"],load:loadStage2B}
 ,{id:"work-scope",moduleId:"work-scope",routeSegment:"work-scope",requiredPermissions:["work_scopes.read"],load:loadStage2B}
 ,{id:"engineering-norms",moduleId:"engineering-norms",routeSegment:"engineering-norms",requiredPermissions:["engineering_norms.read"],load:loadStage2C}
 ,{id:"material-consumption",moduleId:"material-consumption",routeSegment:"material-consumption",requiredPermissions:["material_consumption.read"],load:loadMaterialConsumption}
 ,{id:"regional-pricing",moduleId:"regional-pricing",routeSegment:"regional-pricing",requiredPermissions:["regional_pricing.read"],load:loadRegionalPricing}
 ,{id:"commercial-estimate",moduleId:"commercial-estimate",routeSegment:"commercial-estimate",requiredPermissions:["commercial_estimates.read"],load:loadCommercialEstimate}
],buildingModuleRegistry);
