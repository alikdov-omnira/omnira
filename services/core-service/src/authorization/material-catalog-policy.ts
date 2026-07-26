import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(a:Actor,p:string)=>{if(!a.permissions.includes(p))throw domainErrors.forbidden();};
export const assertCanReadMaterialCatalog=(a:Actor)=>requirePermission(a,"material_catalog.read");
export const assertCanCreateMaterialCatalog=(a:Actor)=>requirePermission(a,"material_catalog.create");
export const assertCanUpdateMaterialCatalog=(a:Actor)=>requirePermission(a,"material_catalog.update");
