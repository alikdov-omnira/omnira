import {domainErrors} from "../domain/errors.js";
import type {AnalyticsActor,ReportName} from "../domain/analytics/analytics-types.js";
export function requireDashboard(actor:AnalyticsActor){if(!actor.permissions.includes("dashboard.read"))throw domainErrors.forbidden();}
export function requireReport(actor:AnalyticsActor,report:ReportName,exporting=false){
 if(!actor.permissions.includes(exporting?"reports.export":"reports.read"))throw domainErrors.forbidden();
 const domain=report==="accounts-receivable"||report==="revenue"||report==="expenses"||report==="profitability"?"finance.read":report==="tasks"||report==="deadlines"||report==="workload"?"tasks.read":report==="documents"?"documents.read":"operational_metrics.read";
 if(!actor.permissions.includes(domain))throw domainErrors.forbidden();
}
