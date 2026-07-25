import { domainErrors } from "../errors.js";
import type { ClientType, CreateClientCommand, UpdateClientCommand } from "./client-types.js";
export function normalizeClient(command: CreateClientCommand): CreateClientCommand {
  if (!command.name?.trim()) throw domainErrors.validation("Client name is required");
  if (command.clientType && !(["individual","company"] as ClientType[]).includes(command.clientType)) throw domainErrors.validation("Invalid client type");
  const email=command.email?.trim().toLowerCase(); if(email && !/^\S+@\S+\.\S+$/.test(email)) throw domainErrors.validation("Invalid email");
  return {...command,name:command.name.trim(),email:email||undefined,phone:command.phone?.trim()||undefined,taxId:command.taxId?.trim()||undefined};
}
export function normalizeClientUpdate(command:UpdateClientCommand):UpdateClientCommand {
  if(!Number.isInteger(command.expectedVersion)||command.expectedVersion<1)throw domainErrors.validation("expectedVersion must be a positive integer");
  const normalized={...command};
  if(command.name!==undefined){if(!command.name.trim())throw domainErrors.validation("Client name is required");normalized.name=command.name.trim();}
  if(command.clientType!==undefined&&!(["individual","company"] as ClientType[]).includes(command.clientType))throw domainErrors.validation("Invalid client type");
  if(command.email!==undefined){const email=command.email.trim().toLowerCase();if(email&&!/^\S+@\S+\.\S+$/.test(email))throw domainErrors.validation("Invalid email");normalized.email=email||undefined;}
  if(command.phone!==undefined)normalized.phone=command.phone.trim()||undefined;
  if(command.taxId!==undefined)normalized.taxId=command.taxId.trim()||undefined;
  return normalized;
}
