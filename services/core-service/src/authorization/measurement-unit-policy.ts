import {domainErrors} from "../domain/errors.js";
type Actor={permissions:readonly string[]};
const requirePermission=(actor:Actor,permission:string)=>{if(!actor.permissions.includes(permission))throw domainErrors.forbidden();};
export const assertCanReadMeasurementUnits=(actor:Actor)=>requirePermission(actor,"measurement_units.read");
export const assertCanCreateMeasurementUnits=(actor:Actor)=>requirePermission(actor,"measurement_units.create");
export const assertCanUpdateMeasurementUnits=(actor:Actor)=>requirePermission(actor,"measurement_units.update");
