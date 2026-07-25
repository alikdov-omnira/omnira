export type PropertyStatus = "active" | "under_maintenance" | "inactive" | "archived";
export interface PropertyAddress { line1:string; city:string; postalCode:string|null; countryCode:string; }
export interface Property {
  id:string; tenantId:string; clientId:string; addressId:string; name:string; propertyType:string;
  status:PropertyStatus; description:string|null; address:PropertyAddress; version:number;
  createdAt:string; updatedAt:string; archivedAt:string|null;
}
export interface CreatePropertyCommand {
  clientId:string; name:string; propertyType:string; status?:Exclude<PropertyStatus,"archived">;
  description?:string; address:{line1:string;city:string;postalCode?:string;countryCode:string};
}
export interface UpdatePropertyCommand {
  expectedVersion:number; clientId?:string; name?:string; propertyType?:string;
  status?:PropertyStatus; description?:string|null;
  address?:{line1?:string;city?:string;postalCode?:string|null;countryCode?:string};
}
export type PropertySortField="name"|"status"|"propertyType"|"createdAt"|"updatedAt";
export interface PropertyListQuery {
  page:number; pageSize:number; search?:string; clientId?:string; status?:PropertyStatus;
  propertyType?:string; sortBy:PropertySortField; sortOrder:"asc"|"desc";
}
export interface PropertyListResult { items:Property[]; pagination:{page:number;pageSize:number;total:number;totalPages:number}; }
