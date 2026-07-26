import {describe,expect,it} from "vitest";
import {assertNoActivePeriodOverlap,isLaborRateApplicable,nextVersion,normalizeRegion,periodsOverlap,requireApplicableLaborRate,sameLaborRateScope,validateLaborRateCreate,validatePeriod,validateRateAmount,validateVersion} from "../src/domain/labor-rate-catalog/labor-rate-rules.js";
import type {LaborRateScope} from "../src/domain/labor-rate-catalog/labor-rate-types.js";

const create=(overrides:Record<string,unknown>={})=>({workId:"work",countryCode:"pl",region:" Mazowieckie ",currency:"pln",unitId:"unit",rateAmount:"125.5",effectiveFrom:"2026-01-01",effectiveTo:"2026-12-31",sourceType:"tenant" as const,notes:" Note ",...overrides});
const scope=(overrides:Partial<LaborRateScope>={}):LaborRateScope=>({tenantId:"tenant",workId:"work",countryCode:"PL",region:null,currency:"PLN",unitId:"unit",sourceType:"tenant",...overrides});

describe("labor rate catalog rules",()=>{
 it("accepts a positive rate with project monetary precision",()=>expect(validateRateAmount("125.5")).toBe("125.5000"));
 it.each(["0","0.0000","-1"])("rejects zero or negative rate %s",value=>expect(()=>validateRateAmount(value)).toThrow());
 it.each(["NaN","Infinity","-Infinity"])("rejects non-finite rate %s",value=>expect(()=>validateRateAmount(value)).toThrow());
 it("rejects monetary precision beyond four decimals",()=>expect(()=>validateRateAmount("1.00001")).toThrow());
 it("rejects an invalid country code",()=>expect(()=>validateLaborRateCreate(create({countryCode:"POL"}) as any)).toThrow("countryCode"));
 it("rejects an invalid currency",()=>expect(()=>validateLaborRateCreate(create({currency:"EU"}) as any)).toThrow("currency"));
 it("normalizes country, currency, region, and notes",()=>expect(validateLaborRateCreate(create() as any)).toMatchObject({countryCode:"PL",currency:"PLN",region:"Mazowieckie",notes:"Note"}));
 it("normalizes an empty region to null",()=>expect(normalizeRegion("   ")).toBeNull());
 it("accepts closed and open periods",()=>{expect(validatePeriod("2026-01-01","2026-01-31")).toEqual({effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"});expect(validatePeriod("2026-01-01",null).effectiveTo).toBeNull();});
 it("rejects an end before the start",()=>expect(()=>validatePeriod("2026-02-01","2026-01-31")).toThrow("effectiveTo"));
 it("accepts valid calendar dates only",()=>expect(()=>validatePeriod("2026-02-30",null)).toThrow());
 it("is applicable inside the period including both boundaries",()=>{const rate={isActive:true,effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"};expect(isLaborRateApplicable(rate,"2026-01-01")).toBe(true);expect(isLaborRateApplicable(rate,"2026-01-15")).toBe(true);expect(isLaborRateApplicable(rate,"2026-01-31")).toBe(true);});
 it("is not applicable outside the period or when inactive",()=>{expect(isLaborRateApplicable({isActive:true,effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"},"2026-02-01")).toBe(false);expect(isLaborRateApplicable({isActive:false,effectiveFrom:"2026-01-01",effectiveTo:null},"2026-02-01")).toBe(false);});
 it("raises a distinguishable error when no rate is applicable",()=>{try{requireApplicableLaborRate(undefined,"2026-01-01");throw new Error("expected failure");}catch(error:any){expect(error.code).toBe("NOT_FOUND");expect(error.details.kind).toBe("NO_APPLICABLE_RATE");}});
 it("detects closed-period overlap and a shared boundary date",()=>{expect(periodsOverlap({effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"},{effectiveFrom:"2026-01-15",effectiveTo:"2026-02-28"})).toBe(true);expect(periodsOverlap({effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"},{effectiveFrom:"2026-01-31",effectiveTo:"2026-02-28"})).toBe(true);});
 it("does not overlap adjacent periods without a common date",()=>expect(periodsOverlap({effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"},{effectiveFrom:"2026-02-01",effectiveTo:"2026-02-28"})).toBe(false));
 it("treats an open period as overlapping every later period",()=>expect(periodsOverlap({effectiveFrom:"2026-01-01",effectiveTo:null},{effectiveFrom:"2030-01-01",effectiveTo:"2030-01-31"})).toBe(true));
 it("normalizes null and empty regions when comparing scope",()=>expect(sameLaborRateScope(scope({region:null}),scope({region:"  "}))).toBe(true));
 it("distinguishes different regions",()=>expect(sameLaborRateScope(scope({region:"North"}),scope({region:"South"}))).toBe(false));
 it("distinguishes tenant and system-default source types",()=>expect(sameLaborRateScope(scope(),scope({sourceType:"system_default"}))).toBe(false));
 it("rejects overlapping active rates in the same scope",()=>expect(()=>assertNoActivePeriodOverlap({...scope(),isActive:true,effectiveFrom:"2026-01-01",effectiveTo:"2026-01-31"},{...scope(),isActive:true,effectiveFrom:"2026-01-31",effectiveTo:null})).toThrow("overlap"));
 it("forbids system-default creation outside system context",()=>expect(()=>validateLaborRateCreate(create({sourceType:"system_default"}) as any)).toThrow("system context"));
 it("allows system-default creation in an explicitly authorized context",()=>expect(validateLaborRateCreate(create({sourceType:"system_default"}) as any,true).sourceType).toBe("system_default"));
 it("increments a valid optimistic version",()=>expect(nextVersion(1)).toBe(2));
 it.each([0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+1])("rejects invalid version %s",value=>expect(()=>validateVersion(value)).toThrow());
 it("protects next version from safe-integer overflow",()=>expect(()=>nextVersion(Number.MAX_SAFE_INTEGER)).toThrow());
});
