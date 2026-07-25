import { domainErrors } from "../errors.js";
import type { CreatePropertyCommand,PropertyStatus,UpdatePropertyCommand } from "./property-types.js";

const statuses:PropertyStatus[]=["active","under_maintenance","inactive","archived"];
const text=(value:string,name:string)=>{const normalized=value?.trim();if(!normalized)throw domainErrors.validation(`${name} is required`);return normalized;};
const country=(value:string)=>{const normalized=text(value,"address.countryCode").toUpperCase();if(!/^[A-Z]{2}$/.test(normalized))throw domainErrors.validation("address.countryCode must be an ISO 3166-1 alpha-2 code");return normalized;};

export function normalizeProperty(command:CreatePropertyCommand):CreatePropertyCommand {
  if(command.status && !statuses.filter(status=>status!=="archived").includes(command.status))throw domainErrors.validation("Invalid property status");
  return {...command,clientId:text(command.clientId,"clientId"),name:text(command.name,"Property name"),propertyType:text(command.propertyType,"propertyType"),
    description:command.description?.trim()||undefined,address:{line1:text(command.address?.line1,"address.line1"),city:text(command.address?.city,"address.city"),postalCode:command.address?.postalCode?.trim()||undefined,countryCode:country(command.address?.countryCode)}};
}
export function normalizePropertyUpdate(command:UpdatePropertyCommand):UpdatePropertyCommand {
  if(!Number.isInteger(command.expectedVersion)||command.expectedVersion<1)throw domainErrors.validation("expectedVersion must be a positive integer");
  if(command.status!==undefined&&(command.status==="archived"||!statuses.includes(command.status)))throw domainErrors.validation("Use archiveProperty to archive a property");
  const normalized={...command};
  if(command.clientId!==undefined)normalized.clientId=text(command.clientId,"clientId");
  if(command.name!==undefined)normalized.name=text(command.name,"Property name");
  if(command.propertyType!==undefined)normalized.propertyType=text(command.propertyType,"propertyType");
  if(command.description!==undefined)normalized.description=command.description?.trim()||null;
  if(command.address)normalized.address={
    ...(command.address.line1!==undefined&&{line1:text(command.address.line1,"address.line1")}),
    ...(command.address.city!==undefined&&{city:text(command.address.city,"address.city")}),
    ...(command.address.postalCode!==undefined&&{postalCode:command.address.postalCode?.trim()||null}),
    ...(command.address.countryCode!==undefined&&{countryCode:country(command.address.countryCode)})
  };
  return normalized;
}
