export type LaborRateSourceType="tenant"|"system_default";
export type LaborRatePeriod={effectiveFrom:string;effectiveTo:string|null};
export type LaborRateScope={tenantId:string;workId:string;countryCode:string;region:string|null;currency:string;unitId:string;sourceType:LaborRateSourceType};
export type LaborRate=LaborRateScope&LaborRatePeriod&{
 id:string;workCode?:string;unitCode?:string;rateAmount:string;isActive:boolean;notes:string|null;version:number;
 createdAt:string;createdBy:string;updatedAt:string;updatedBy:string;
};
export type CreateLaborRate={
 workId:string;countryCode:string;region?:string|null;currency:string;unitId:string;rateAmount:string;
 effectiveFrom:string;effectiveTo?:string|null;sourceType:LaborRateSourceType;notes?:string|null;
};
export type UpdateLaborRate={
 expectedVersion:number;workId?:string;countryCode?:string;region?:string|null;currency?:string;unitId?:string;
 rateAmount?:string;effectiveFrom?:string;effectiveTo?:string|null;sourceType?:LaborRateSourceType;notes?:string|null;
};
export type ActivateLaborRate={expectedVersion:number};
export type DeactivateLaborRate={expectedVersion:number};
export type LaborRateApplicability={rate:Pick<LaborRate,"isActive"|"effectiveFrom"|"effectiveTo">;onDate:string};
export type LaborRateOverlapCheck={left:LaborRatePeriod;right:LaborRatePeriod};
export type LaborRateResolutionParams={
 tenantId:string;workId:string;countryCode:string;region?:string|null;currency:string;unitId:string;onDate:string;
 sourceType?:LaborRateSourceType;
};
export type LaborRateQuery={page:number;pageSize:number;workId?:string;countryCode?:string;region?:string|null;currency?:string;unitId?:string;sourceType?:LaborRateSourceType;isActive?:boolean;effectiveOn?:string;sortBy:"effectiveFrom"|"rateAmount"|"countryCode"|"currency"|"updatedAt";sortOrder:"asc"|"desc"};
export type LaborRatePage={items:LaborRate[];pagination:{page:number;pageSize:number;total:number;totalPages:number}};
export type CreateSystemLaborRate={workCode:string;countryCode:string;region?:string|null;currency:string;unitCode:string;rateAmount:string;effectiveFrom:string;effectiveTo?:string|null;notes?:string|null};
