import { domainErrors } from "../domain/errors.js";
export interface PermissionActor {permissions:readonly string[];}
function assertPermission(actor:PermissionActor,permission:string){if(!actor.permissions.includes(permission))throw domainErrors.forbidden();}
export const assertCanReadProject=(actor:PermissionActor)=>assertPermission(actor,"projects.read");
export const assertCanCreateProject=(actor:PermissionActor)=>assertPermission(actor,"projects.create");
export const assertCanUpdateProject=(actor:PermissionActor)=>assertPermission(actor,"projects.update");
export const assertCanArchiveProject=(actor:PermissionActor)=>assertPermission(actor,"projects.delete");
export const assertCanTransitionProject=assertCanUpdateProject;
