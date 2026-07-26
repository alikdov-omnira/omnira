import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(a:Actor,p:string)=>{if(!a.permissions.includes(p))throw domainErrors.forbidden();};
export const assertCanReadWorkCatalog=(a:Actor)=>requirePermission(a,"work_catalog.read");
export const assertCanCreateWorkCatalog=(a:Actor)=>requirePermission(a,"work_catalog.create");
export const assertCanUpdateWorkCatalog=(a:Actor)=>requirePermission(a,"work_catalog.update");
