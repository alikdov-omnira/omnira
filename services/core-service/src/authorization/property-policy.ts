import { domainErrors } from "../domain/errors.js";
export interface PermissionActor { permissions:readonly string[]; }
function assertPermission(actor:PermissionActor,permission:string){if(!actor.permissions.includes(permission))throw domainErrors.forbidden();}
export const assertCanReadProperty=(actor:PermissionActor)=>assertPermission(actor,"properties.read");
export const assertCanCreateProperty=(actor:PermissionActor)=>assertPermission(actor,"properties.create");
export const assertCanUpdateProperty=(actor:PermissionActor)=>assertPermission(actor,"properties.update");
export const assertCanArchiveProperty=(actor:PermissionActor)=>assertPermission(actor,"properties.delete");
