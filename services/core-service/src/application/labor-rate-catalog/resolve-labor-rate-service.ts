import {DomainError} from "../../domain/errors.js";
import {isLaborRateApplicable,normalizeCountryCode,normalizeCurrency,normalizeRegion,validateRateAmount} from "../../domain/labor-rate-catalog/labor-rate-rules.js";
import type {LaborRate,LaborRateResolutionParams} from "../../domain/labor-rate-catalog/labor-rate-types.js";
import type {LaborRateCatalogRepository} from "./labor-rate-catalog-repository.js";

export class ResolveLaborRateService{
 constructor(private repository:LaborRateCatalogRepository){}
 private positive(rate:LaborRate){try{validateRateAmount(rate.rateAmount);return true;}catch{return false;}}
 resolve(input:LaborRateResolutionParams){const params={...input,countryCode:normalizeCountryCode(input.countryCode),region:normalizeRegion(input.region),currency:normalizeCurrency(input.currency)};return this.repository.transaction(input.tenantId,async repository=>{const candidates=(await repository.findResolutionCandidates(params)).filter(rate=>rate.workId===params.workId&&rate.countryCode===params.countryCode&&rate.currency===params.currency&&rate.unitId===params.unitId&&isLaborRateApplicable(rate,params.onDate)&&this.positive(rate));const region=params.region;const tiers=[(rate:LaborRate)=>rate.sourceType==="tenant"&&rate.tenantId===params.tenantId&&region!==null&&normalizeRegion(rate.region)===region,(rate:LaborRate)=>rate.sourceType==="tenant"&&rate.tenantId===params.tenantId&&normalizeRegion(rate.region)===null,(rate:LaborRate)=>rate.sourceType==="system_default"&&region!==null&&normalizeRegion(rate.region)===region,(rate:LaborRate)=>rate.sourceType==="system_default"&&normalizeRegion(rate.region)===null];for(const tier of tiers){const matches=candidates.filter(tier);if(matches.length>1)throw new DomainError("DUPLICATE_RECORD",409,"Ambiguous applicable labor rate",{kind:"AMBIGUOUS_LABOR_RATE"});if(matches.length===1)return matches[0];}throw new DomainError("NOT_FOUND",404,"No applicable labor rate",{kind:"NO_APPLICABLE_RATE"});});}
}
