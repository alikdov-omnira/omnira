import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(a:Actor,p:string)=>{if(!a.permissions.includes(p))throw domainErrors.forbidden();};
export const assertCanReadEstimate=(a:Actor)=>requirePermission(a,"estimate.read");
export const assertCanCreateEstimate=(a:Actor)=>requirePermission(a,"estimate.create");
export const assertCanUpdateEstimate=(a:Actor)=>requirePermission(a,"estimate.update");
