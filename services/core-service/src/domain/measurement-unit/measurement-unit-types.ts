export type MeasurementDimension="length"|"area"|"volume"|"mass"|"time"|"count"|"packaging"|"custom";
export type UnitSystem="metric"|"imperial"|"universal"|"custom";
export type MeasurementUnitStatus="active"|"inactive";
export interface MeasurementUnit {id:string;tenantId:string;code:string;symbol:string;displayName:string;description:string|null;dimension:MeasurementDimension;unitSystem:UnitSystem;status:MeasurementUnitStatus;decimalPrecision:number;canonicalBaseCode:string|null;baseMultiplier:string|null;isSystem:boolean;createdAt:string;updatedAt:string;version:number}
export interface CreateMeasurementUnit {code:string;symbol:string;displayName:string;description?:string;dimension:MeasurementDimension;unitSystem:UnitSystem;decimalPrecision:number;canonicalBaseCode?:string;baseMultiplier?:string}
export interface UpdateMeasurementUnit {expectedVersion:number;symbol?:string;displayName?:string;description?:string|null;decimalPrecision?:number;canonicalBaseCode?:string|null;baseMultiplier?:string|null}
export interface MeasurementUnitListQuery {page:number;pageSize:number;search?:string;dimension?:MeasurementDimension;unitSystem?:UnitSystem;active?:boolean;sortBy:"code"|"symbol"|"displayName"|"dimension"|"unitSystem"|"status"|"createdAt"|"updatedAt";sortOrder:"asc"|"desc"}
export interface MeasurementUnitListResult {items:MeasurementUnit[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}
