import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(a:Actor,p:string)=>{if(!a.permissions.includes(p))throw domainErrors.forbidden();};
export const assertCanReadPriceList=(a:Actor)=>requirePermission(a,"price_list.read");
export const assertCanCreatePriceList=(a:Actor)=>requirePermission(a,"price_list.create");
export const assertCanUpdatePriceList=(a:Actor)=>requirePermission(a,"price_list.update");
