import { domainErrors } from "../errors.js";
import type { CreateProjectCommand,PaymentStatus,ProjectLifecycleAction,ProjectStatus,UpdateProjectCommand } from "./project-types.js";

const paymentStatuses:PaymentStatus[]=["not_required","not_invoiced","partially_invoiced","invoiced","partially_paid","paid","overdue"];
const text=(value:string,name:string)=>{const normalized=value?.trim();if(!normalized)throw domainErrors.validation(`${name} is required`);return normalized;};
const optionalText=(value:string|undefined|null)=>value===null?null:value?.trim()||undefined;
const money=(value:number|null|undefined,name:string)=>{if(value!==undefined&&value!==null&&(!Number.isFinite(value)||value<0))throw domainErrors.validation(`${name} must be nonnegative`);return value;};
const date=(value:string|null|undefined,name:string)=>{if(value!==undefined&&value!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(value))throw domainErrors.validation(`${name} must use YYYY-MM-DD`);return value;};
export function normalizeProject(command:CreateProjectCommand):CreateProjectCommand {
  if(command.paymentStatus&&!paymentStatuses.includes(command.paymentStatus))throw domainErrors.validation("Invalid payment status");
  const value={...command,clientId:text(command.clientId,"clientId"),propertyId:text(command.propertyId,"propertyId"),financialOwnerLegalEntityId:text(command.financialOwnerLegalEntityId,"financialOwnerLegalEntityId"),projectNumber:text(command.projectNumber,"projectNumber"),name:text(command.name,"Project name"),description:optionalText(command.description)??undefined,currencyCode:text(command.currencyCode,"currencyCode").toUpperCase(),startDate:date(command.startDate,"startDate")??undefined,expectedCompletionDate:date(command.expectedCompletionDate,"expectedCompletionDate")??undefined,estimatedBudget:money(command.estimatedBudget,"estimatedBudget")??undefined,approvedBudget:money(command.approvedBudget,"approvedBudget")??undefined,contractValue:money(command.contractValue,"contractValue")??undefined,billingCustomerReference:optionalText(command.billingCustomerReference)??undefined,externalPaymentCustomerReference:optionalText(command.externalPaymentCustomerReference)??undefined};
  if(!/^[A-Z]{3}$/.test(value.currencyCode))throw domainErrors.validation("currencyCode must be an ISO 4217 code");
  if(value.startDate&&value.expectedCompletionDate&&value.expectedCompletionDate<value.startDate)throw domainErrors.validation("expectedCompletionDate cannot be before startDate");
  return value;
}
export function normalizeProjectUpdate(command:UpdateProjectCommand):UpdateProjectCommand {
  if(!Number.isInteger(command.expectedVersion)||command.expectedVersion<1)throw domainErrors.validation("expectedVersion must be a positive integer");
  if("status" in command)throw domainErrors.validation("Use a lifecycle operation to change project status");
  if(command.paymentStatus!==undefined&&!paymentStatuses.includes(command.paymentStatus))throw domainErrors.validation("Invalid payment status");
  const value={...command};
  if(command.clientId!==undefined)value.clientId=text(command.clientId,"clientId");if(command.propertyId!==undefined)value.propertyId=text(command.propertyId,"propertyId");
  if(command.financialOwnerLegalEntityId!==undefined)value.financialOwnerLegalEntityId=text(command.financialOwnerLegalEntityId,"financialOwnerLegalEntityId");
  if(command.projectNumber!==undefined)value.projectNumber=text(command.projectNumber,"projectNumber");if(command.name!==undefined)value.name=text(command.name,"Project name");
  if(command.description!==undefined)value.description=optionalText(command.description)??null;if(command.currencyCode!==undefined){value.currencyCode=text(command.currencyCode,"currencyCode").toUpperCase();if(!/^[A-Z]{3}$/.test(value.currencyCode))throw domainErrors.validation("currencyCode must be an ISO 4217 code");}
  if(command.startDate!==undefined)value.startDate=date(command.startDate,"startDate");if(command.expectedCompletionDate!==undefined)value.expectedCompletionDate=date(command.expectedCompletionDate,"expectedCompletionDate");
  value.estimatedBudget=money(command.estimatedBudget,"estimatedBudget");value.approvedBudget=money(command.approvedBudget,"approvedBudget");value.contractValue=money(command.contractValue,"contractValue");
  if(command.billingCustomerReference!==undefined)value.billingCustomerReference=optionalText(command.billingCustomerReference)??null;if(command.externalPaymentCustomerReference!==undefined)value.externalPaymentCustomerReference=optionalText(command.externalPaymentCustomerReference)??null;
  return value;
}
const transitions:Record<ProjectLifecycleAction,{from:ProjectStatus[];to:ProjectStatus}>={
  plan:{from:["draft"],to:"planned"},start:{from:["planned"],to:"active"},pause:{from:["active"],to:"paused"},
  resume:{from:["paused"],to:"active"},complete:{from:["active"],to:"completed"},cancel:{from:["draft","planned","active","paused"],to:"cancelled"}
};
export function lifecycleTransition(action:ProjectLifecycleAction,current:ProjectStatus):ProjectStatus {const transition=transitions[action];if(!transition.from.includes(current))throw domainErrors.transition();return transition.to;}
