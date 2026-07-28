import type{ApprovedScanQuantitySet}from"../../domain/room-scanner/room-scanner-types.js";
export interface WorkScopeResolverPort{resolve(input:{tenantId:string;approvedQuantities:ApprovedScanQuantitySet;technicalAssignmentVersionId:string;designProjectVersionId?:string;manualAdjustmentVersionId?:string}):Promise<unknown>}
export interface TechnologyResolverPort{resolve(input:{tenantId:string;resolvedWorkScope:unknown;jurisdiction:string;companyStandardVersionId?:string}):Promise<unknown>}
export interface NormResolverPort{resolve(input:{tenantId:string;technologyDecisions:unknown;effectiveOn:string}):Promise<unknown>}
export interface PriceResolverPort{resolve(input:{tenantId:string;quantityEstimate:unknown;country:string;region?:string;currency:string;effectiveOn:string}):Promise<unknown>}
export interface EstimateDraftGeneratorPort{generateQuantityDraft(input:{tenantId:string;approvedScanQuantitySet:ApprovedScanQuantitySet;resolvedWorkScope:unknown;technologyDecisions:unknown;normResolution:unknown}):Promise<unknown>;applyPrices(input:{tenantId:string;quantityEstimate:unknown;priceResolution:unknown}):Promise<unknown>}
