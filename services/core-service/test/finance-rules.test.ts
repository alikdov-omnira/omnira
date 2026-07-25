import {describe,expect,it} from "vitest";
import {decimal,minor,totals,validDates} from "../src/domain/finance/finance-rules.js";
describe("finance money rules",()=>{
  it("uses exact four-place decimal arithmetic",()=>{expect(minor("0.1")+minor("0.2")).toBe(3000n);expect(decimal(3000n)).toBe("0.3000");});
  it("formats signed derived values without corrupting the fractional component",()=>expect(decimal(-1000000n)).toBe("-100.0000"));
  it("rounds VAT deterministically to four places",()=>expect(totals("10.0050","23.0000")).toEqual({netAmount:"10.0050",vatRate:"23.0000",vatAmount:"2.3012",grossAmount:"12.3062"}));
  it("rejects invalid money and dates",()=>{expect(()=>minor("-1")).toThrow();expect(()=>minor("1.00001")).toThrow();expect(()=>validDates("2026-02-02","2026-02-01")).toThrow();});
});
