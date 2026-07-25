import {describe,expect,it} from "vitest";
import {chartSeries,nextReportSort,relatedReportPage} from "./app.js";

describe("report interaction helpers",()=>{
 it("selects ascending then toggles direction",()=>{expect(nextReportSort("dueDate","asc","outstanding")).toEqual({sortBy:"outstanding",sortOrder:"asc"});expect(nextReportSort("outstanding","asc","outstanding")).toEqual({sortBy:"outstanding",sortOrder:"desc"});});
 it("keeps multi-currency chart series separate",()=>expect(chartSeries([{group:"2026-07",currencyCode:"EUR",grossInvoiced:"2.0000"},{group:"2026-07",currencyCode:"USD",grossInvoiced:"3.0000"}],"grossInvoiced")).toEqual([{label:"2026-07",series:"EUR",value:"2.0000"},{label:"2026-07",series:"USD",value:"3.0000"}]));
 it("constructs only real related-page navigation",()=>{expect(relatedReportPage("invoiceNumber")).toBe("finance");expect(relatedReportPage("projectName")).toBe("projects");expect(relatedReportPage("unknown")).toBeNull();});
});
