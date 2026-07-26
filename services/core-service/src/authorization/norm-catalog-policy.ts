import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(a:Actor,p:string)=>{if(!a.permissions.includes(p))throw domainErrors.forbidden();};
export const assertCanReadNormCatalog=(a:Actor)=>requirePermission(a,"norm_catalog.read");
export const assertCanCreateNormCatalog=(a:Actor)=>requirePermission(a,"norm_catalog.create");
export const assertCanUpdateNormCatalog=(a:Actor)=>requirePermission(a,"norm_catalog.update");
