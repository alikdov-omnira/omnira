import{domainErrors}from"../domain/errors.js";
export type CommercialActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string;actorType?:"human"|"ai"|"system"};
export type CommercialScope="regional_pricing"|"commercial_estimates";
export type CommercialPermission="create"|"read"|"edit"|"review"|"approve"|"snapshots.read";
export function requireCommercial(actor:CommercialActor,scope:CommercialScope,permission:CommercialPermission){if(!actor.permissions.includes(`${scope}.${permission}`))throw domainErrors.forbidden();if(["create","edit","review","approve"].includes(permission)&&actor.actorType!=="human")throw domainErrors.forbidden()}
