import { domainErrors } from "../domain/errors.js";
export interface PermissionActor { permissions: readonly string[]; }
function assertPermission(actor:PermissionActor, permission:string){if(!actor.permissions.includes(permission))throw domainErrors.forbidden();}
export const assertCanReadClient=(actor:PermissionActor)=>assertPermission(actor,"clients.read");
export const assertCanCreateClient=(actor:PermissionActor)=>assertPermission(actor,"clients.create");
export const assertCanUpdateClient=(actor:PermissionActor)=>assertPermission(actor,"clients.update");
export const assertCanArchiveClient=(actor:PermissionActor)=>assertPermission(actor,"clients.delete");
