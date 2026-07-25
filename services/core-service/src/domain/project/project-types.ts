export type ProjectStatus="draft"|"planned"|"active"|"paused"|"completed"|"cancelled"|"archived";
export type PaymentStatus="not_required"|"not_invoiced"|"partially_invoiced"|"invoiced"|"partially_paid"|"paid"|"overdue";
export interface Project {
  id:string;tenantId:string;clientId:string;propertyId:string;financialOwnerLegalEntityId:string;
  projectManagerId:string|null;projectNumber:string;name:string;description:string|null;status:ProjectStatus;
  startDate:string|null;expectedCompletionDate:string|null;actualCompletionDate:string|null;currencyCode:string;
  estimatedBudget:string|null;approvedBudget:string|null;contractValue:string|null;paymentStatus:PaymentStatus;
  billingCustomerReference:string|null;externalPaymentCustomerReference:string|null;
  version:number;createdAt:string;updatedAt:string;archivedAt:string|null;
}
export interface CreateProjectCommand {
  clientId:string;propertyId:string;financialOwnerLegalEntityId:string;projectManagerId?:string|null;
  projectNumber:string;name:string;description?:string;startDate?:string;expectedCompletionDate?:string;
  currencyCode:string;estimatedBudget?:number;approvedBudget?:number;contractValue?:number;
  paymentStatus?:PaymentStatus;billingCustomerReference?:string;externalPaymentCustomerReference?:string;
}
export interface UpdateProjectCommand {
  expectedVersion:number;clientId?:string;propertyId?:string;financialOwnerLegalEntityId?:string;projectManagerId?:string|null;
  projectNumber?:string;name?:string;description?:string|null;startDate?:string|null;expectedCompletionDate?:string|null;
  currencyCode?:string;estimatedBudget?:number|null;approvedBudget?:number|null;contractValue?:number|null;
  paymentStatus?:PaymentStatus;billingCustomerReference?:string|null;externalPaymentCustomerReference?:string|null;
}
export type ProjectSortField="projectNumber"|"name"|"status"|"startDate"|"expectedCompletionDate"|"createdAt"|"updatedAt";
export interface ProjectListQuery {
  page:number;pageSize:number;search?:string;status?:ProjectStatus;propertyId?:string;clientId?:string;
  projectManagerId?:string;sortBy:ProjectSortField;sortOrder:"asc"|"desc";
}
export interface ProjectListResult {items:Project[];pagination:{page:number;pageSize:number;total:number;totalPages:number};}
export type ProjectLifecycleAction="plan"|"start"|"pause"|"resume"|"complete"|"cancel";
