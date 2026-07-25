export type AnalyticsActor={id:string;tenantId:string;permissions:string[];correlationId:string};
export type DateRange={start:string;endExclusive:string};
export type ProjectHealthState="healthy"|"attention"|"at_risk"|"completed"|"paused";
export type ProjectHealthInput={status:string;overdueTasks:number;blockedTasks:number;endDatePassed:boolean;overdueReceivables:string;grossMargin:string|null};
export type ProjectHealth={state:ProjectHealthState;score:number;reasons:string[]};
export type ReportName="accounts-receivable"|"revenue"|"expenses"|"profitability"|"tasks"|"deadlines"|"workload"|"documents"|"activity";
export type AnalyticsQuery={start:string;endExclusive:string;page:number;pageSize:number;sortBy?:string;sortOrder:"asc"|"desc";groupBy?:string;projectId?:string;clientId?:string;userId?:string;actorId?:string;currencyCode?:string;status?:string;category?:string;domain?:string;entityType?:string;entityId?:string;overdue?:boolean;archived?:boolean};
