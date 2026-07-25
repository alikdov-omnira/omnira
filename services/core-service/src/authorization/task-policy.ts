import {domainErrors} from "../domain/errors.js";
export interface PermissionActor {permissions:readonly string[];}
function assertPermission(actor:PermissionActor,permission:string){if(!actor.permissions.includes(permission))throw domainErrors.forbidden();}
export const assertCanReadTask=(actor:PermissionActor)=>assertPermission(actor,"tasks.read");
export const assertCanCreateTask=(actor:PermissionActor)=>assertPermission(actor,"tasks.create");
export const assertCanUpdateTask=(actor:PermissionActor)=>assertPermission(actor,"tasks.update");
export const assertCanTransitionTask=assertCanUpdateTask;
export const assertCanArchiveTask=(actor:PermissionActor)=>assertPermission(actor,"tasks.delete");
export const assertCanAssignTask=(actor:PermissionActor)=>{assertPermission(actor,"tasks.update");assertPermission(actor,"tasks.assign");};
