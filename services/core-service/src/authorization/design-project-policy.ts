import{domainErrors}from"../domain/errors.js";
export type DesignProjectActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string;actorType?:"human"|"system"|"ai"};
export type DesignProjectPermission="create"|"read"|"edit"|"review"|"approve"|"cancel"|"snapshots.read";
export function requireDesignProject(actor:DesignProjectActor,permission:DesignProjectPermission){if(!actor.permissions.includes(`design_projects.${permission}`))throw domainErrors.forbidden();if(permission==="approve"&&actor.actorType!=="human")throw domainErrors.forbidden();}
