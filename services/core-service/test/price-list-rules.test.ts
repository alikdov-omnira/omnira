import {describe,expect,it} from "vitest";
import {validatePriceListCreate,validatePriceListItemCreate,validatePriceListItemUpdate} from "../src/domain/price-list/price-list-rules.js";
describe("price list domain rules",()=>{
 it("normalizes identifiers, markets and monetary precision",()=>{const x=validatePriceListCreate({code:" pl_custom ",displayName:" Custom ",currency:"eur",country:"pl",validFrom:"2026-01-01"});expect(x).toMatchObject({code:"PL_CUSTOM",displayName:"Custom",currency:"EUR",country:"PL"});expect(validatePriceListItemCreate({priceListId:"p",materialId:"m",unitPrice:"12.5",vatRate:"23",discountPercent:"2.5",currency:"pln",validFrom:"2026-01-01"}).unitPrice).toBe("12.5000");});
 it("rejects inverted validity and out-of-range percentages",()=>{expect(()=>validatePriceListCreate({code:"GOOD",displayName:"Good",currency:"EUR",country:"DE",validFrom:"2026-02-01",validTo:"2026-01-01"})).toThrow();expect(()=>validatePriceListItemCreate({priceListId:"p",materialId:"m",unitPrice:"1",vatRate:"101",discountPercent:"0",currency:"EUR",validFrom:"2026-01-01"})).toThrow();});
 it("validates partial updates against current validity",()=>{expect(()=>validatePriceListItemUpdate({expectedVersion:1,validTo:"2025-01-01"},{validFrom:"2026-01-01",validTo:null})).toThrow();});
});
