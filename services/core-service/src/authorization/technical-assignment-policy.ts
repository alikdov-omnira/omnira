import{domainErrors}from"../domain/errors.js";
export type TechnicalAssignmentActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string;actorType?:"human"|"system"|"ai"};
export type TechnicalAssignmentPermission="create"|"read"|"edit"|"review"|"approve"|"cancel"|"snapshots.read";
export function requireTechnicalAssignment(actor:TechnicalAssignmentActor,permission:TechnicalAssignmentPermission){if(!actor.permissions.includes(`technical_assignments.${permission}`))throw domainErrors.forbidden();if(permission==="approve"&&actor.actorType&&actor.actorType!=="human")throw domainErrors.forbidden();}
