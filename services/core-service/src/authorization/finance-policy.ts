import {domainErrors} from "../domain/errors.js";
export interface FinancePermissionActor{permissions:readonly string[]}
const require=(actor:FinancePermissionActor,permission:string)=>{if(!actor.permissions.includes(permission))throw domainErrors.forbidden();};
export const assertCanReadFinance=(a:FinancePermissionActor)=>require(a,"finance.read");
export const assertCanCreateFinance=(a:FinancePermissionActor)=>require(a,"finance.create");
export const assertCanUpdateFinance=(a:FinancePermissionActor)=>require(a,"finance.update");
export const assertCanArchiveFinance=(a:FinancePermissionActor)=>require(a,"finance.delete");
