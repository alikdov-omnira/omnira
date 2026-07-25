export type ClientType = "individual" | "company";
export type ClientStatus = "active" | "inactive" | "archived";
export interface Client { id:string; tenantId:string; clientType:ClientType; name:string; legalName:string|null; taxId:string|null; email:string|null; phone:string|null; status:ClientStatus; notes:string|null; version:number; createdAt:string; updatedAt:string; archivedAt:string|null; }
export interface CreateClientCommand { name:string; clientType?:ClientType; legalName?:string; taxId?:string; email?:string; phone?:string; notes?:string; }
export interface UpdateClientCommand extends Partial<CreateClientCommand> { expectedVersion:number; status?:ClientStatus; }
export type ClientSortField="name"|"status"|"clientType"|"createdAt"|"updatedAt";
export interface ClientListQuery { page:number; pageSize:number; search?:string; status?:ClientStatus; clientType?:ClientType; sortBy:ClientSortField; sortOrder:"asc"|"desc"; }
export interface ClientListResult { items:Client[]; pagination:{page:number;pageSize:number;total:number;totalPages:number}; }
