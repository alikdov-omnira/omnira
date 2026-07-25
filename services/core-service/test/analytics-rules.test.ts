import {describe,expect,it} from "vitest";
import {csv,daysOverdue,projectHealth,reportRange} from "../src/domain/analytics/analytics-rules.js";

describe("analytics rules",()=>{
 it("uses deterministic inclusive-start exclusive-end UTC ranges",()=>expect(reportRange({range:7},new Date("2026-07-25T20:00:00Z"))).toEqual({start:"2026-07-19",endExclusive:"2026-07-26"}));
 it("accepts explicit inclusive dates and rejects invalid ranges",()=>{expect(reportRange({start:"2026-01-01",end:"2026-01-31"})).toEqual({start:"2026-01-01",endExclusive:"2026-02-01"});expect(()=>reportRange({start:"2026-02-01",end:"2026-01-01"})).toThrow("Invalid UTC date range");});
 it("calculates overdue days without locale dependence",()=>expect(daysOverdue("2026-07-20","2026-07-25")).toBe(5));
 it("returns explainable health states",()=>{expect(projectHealth({status:"completed",overdueTasks:3,blockedTasks:1,endDatePassed:true,overdueReceivables:"2.0000",grossMargin:"-1.0000"}).state).toBe("completed");const risk=projectHealth({status:"active",overdueTasks:4,blockedTasks:2,endDatePassed:true,overdueReceivables:"2.0000",grossMargin:"-1.0000"});expect(risk.state).toBe("at_risk");expect(risk.reasons).toEqual(expect.arrayContaining(["overdue_tasks","blocked_tasks","negative_margin"]));});
 it("escapes CSV and neutralizes spreadsheet formulas",()=>{const output=csv(["name","note"],[{name:"=2+2",note:'a,"b"'}]);expect(output).toContain("\"'=2+2\"");expect(output).toContain('"a,""b"""');expect(output.startsWith("\uFEFF")).toBe(true);});
});
