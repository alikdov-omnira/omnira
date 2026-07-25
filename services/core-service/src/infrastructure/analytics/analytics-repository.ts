import type {Pool,PoolClient} from "pg";
import {inUserTransaction} from "../transaction.js";
import type {AnalyticsActor,AnalyticsQuery,ReportName} from "../../domain/analytics/analytics-types.js";

const money=(column:string)=>`round(coalesce(${column},0),4)::text`;
export class AnalyticsRepository{
 constructor(private readonly pool:Pool){}
 private run<T>(actor:AnalyticsActor,operation:(client:PoolClient)=>Promise<T>){return inUserTransaction(this.pool,actor.tenantId,actor.id,operation);}
 async executive(actor:AnalyticsActor,q:AnalyticsQuery,operational:boolean){
  return this.run(actor,async c=>{if(operational)await c.query("SELECT set_config('app.worker','true',true)");return (await c.query(`
   WITH project_metrics AS (
    SELECT count(*) FILTER(WHERE status='active')::int active,count(*) FILTER(WHERE status='planned')::int planned,
     count(*) FILTER(WHERE status='paused')::int paused,
     count(*) FILTER(WHERE status IN ('planned','active','paused') AND expected_completion_date<CURRENT_DATE)::int overdue,
     count(*) FILTER(WHERE status='completed' AND actual_completion_date>=$1 AND actual_completion_date<$2)::int completed
    FROM projects WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL
   ), task_metrics AS (
    SELECT count(*) FILTER(WHERE status='todo')::int open,count(*) FILTER(WHERE status='in_progress')::int in_progress,
     count(*) FILTER(WHERE status='blocked')::int blocked,
     count(*) FILTER(WHERE status IN ('todo','in_progress','blocked') AND due_date<CURRENT_DATE)::int overdue,
     count(*) FILTER(WHERE status IN ('todo','in_progress','blocked') AND due_date>=CURRENT_DATE AND due_date<CURRENT_DATE+interval '8 days')::int due_soon,
     count(*) FILTER(WHERE status='completed' AND completed_at>=$1::date AND completed_at<$2::date)::int completed
    FROM tasks WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL
   ), finance AS (
    SELECT currency_code,
     ${money("sum(gross_amount) FILTER(WHERE status IN ('issued','partially_paid','paid'))")} invoiced_gross,
     ${money("sum(paid_amount) FILTER(WHERE status IN ('issued','partially_paid','paid'))")} paid,
     ${money("sum(gross_amount-paid_amount) FILTER(WHERE status IN ('issued','partially_paid'))")} outstanding,
     ${money("sum(gross_amount-paid_amount) FILTER(WHERE status IN ('issued','partially_paid') AND due_date<CURRENT_DATE)")} overdue_receivables
    FROM invoices WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL GROUP BY currency_code
   ), expense AS (
    SELECT currency_code,${money("sum(gross_amount)")} approved_expenses FROM expenses WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL AND status='approved' AND expense_date>=$1 AND expense_date<$2 GROUP BY currency_code
   ), docs AS (
    SELECT count(*) FILTER(WHERE deleted_at IS NULL AND created_at>=now()-interval '7 days')::int recent,
     count(*) FILTER(WHERE deleted_at IS NULL AND created_at>=$1::date AND created_at<$2::date)::int created,
     count(*) FILTER(WHERE deleted_at IS NOT NULL)::int archived FROM documents WHERE tenant_id=current_setting('app.tenant_id')::uuid
   ), notices AS (
    SELECT count(*)::int unread FROM notifications WHERE recipient_user_id=current_setting('app.user_id')::uuid AND status='unread'
   ), ops AS (
    SELECT (SELECT count(*)::int FROM outbox_events WHERE state='dead_letter') dead_letters,
     (SELECT count(*)::int FROM notification_deliveries WHERE status='failed') failed
   )
   SELECT CASE WHEN $3 THEN row_to_json(project_metrics) END projects,CASE WHEN $4 THEN row_to_json(task_metrics) END tasks,
    CASE WHEN $5 THEN coalesce((SELECT json_agg(json_build_object('currencyCode',f.currency_code,'invoicedGross',f.invoiced_gross,'paid',f.paid,'outstanding',f.outstanding,'overdueReceivables',f.overdue_receivables,'approvedExpenses',coalesce(e.approved_expenses,'0.0000'),'grossMargin',(f.invoiced_gross::numeric-coalesce(e.approved_expenses::numeric,0))::numeric(19,4)::text,'grossMarginPercentage',CASE WHEN f.invoiced_gross::numeric=0 THEN NULL ELSE round((f.invoiced_gross::numeric-coalesce(e.approved_expenses::numeric,0))/f.invoiced_gross::numeric*100,4)::text END) ORDER BY f.currency_code) FROM finance f LEFT JOIN expense e USING(currency_code)),'[]') END finance,
    CASE WHEN $6 THEN row_to_json(docs) END documents,(SELECT unread FROM notices) unread_notifications,
    CASE WHEN $7 THEN (SELECT row_to_json(ops) FROM ops) ELSE NULL END operations
   FROM project_metrics,task_metrics,docs`,[q.start,q.endExclusive,actor.permissions.includes("projects.read"),actor.permissions.includes("tasks.read"),actor.permissions.includes("finance.read"),actor.permissions.includes("documents.read"),operational])).rows[0];});
 }
 async projectHealth(actor:AnalyticsActor){
  return this.run(actor,async c=>(await c.query(`
   WITH task_totals AS(SELECT project_id,count(*) FILTER(WHERE status IN ('todo','in_progress','blocked') AND due_date<CURRENT_DATE)::int overdue,count(*) FILTER(WHERE status='blocked')::int blocked FROM tasks WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL GROUP BY project_id),
   invoice_totals AS(SELECT project_id,sum(gross_amount) FILTER(WHERE status IN ('issued','partially_paid','paid')) invoiced,sum(gross_amount-paid_amount) FILTER(WHERE status IN ('issued','partially_paid') AND due_date<CURRENT_DATE) overdue FROM invoices WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL GROUP BY project_id),
   expense_totals AS(SELECT project_id,sum(gross_amount) expenses FROM expenses WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL AND status='approved' GROUP BY project_id)
   SELECT p.id,p.project_number "projectNumber",p.name,p.status,p.expected_completion_date "expectedCompletionDate",p.currency_code "currencyCode",
    coalesce(t.overdue,0) "overdueTasks",coalesce(t.blocked,0) "blockedTasks",
    (p.expected_completion_date<CURRENT_DATE AND p.status IN ('planned','active','paused')) "endDatePassed",
    ${money("i.overdue")} "overdueReceivables",(coalesce(i.invoiced,0)-coalesce(e.expenses,0))::numeric(19,4)::text "grossMargin"
   FROM projects p LEFT JOIN task_totals t ON t.project_id=p.id LEFT JOIN invoice_totals i ON i.project_id=p.id LEFT JOIN expense_totals e ON e.project_id=p.id
   WHERE p.tenant_id=current_setting('app.tenant_id')::uuid AND p.deleted_at IS NULL ORDER BY p.updated_at DESC LIMIT 200`)).rows);
 }
 async report(actor:AnalyticsActor,name:ReportName,q:AnalyticsQuery){
  return this.run(actor,async c=>{
   const values:any[]=[q.start,q.endExclusive],bind=(value:unknown)=>{values.push(value);return `$${values.length}`;},where:string[]=[];let sql="",order="";
   const paginate=()=>{const limit=bind(q.pageSize),offset=bind((q.page-1)*q.pageSize);return ` LIMIT ${limit} OFFSET ${offset}`;};
   const ordered=(map:Record<string,string>,fallback:string,id:string)=>{const expression=map[q.sortBy??""]??fallback,direction=q.sortOrder==="asc"?"ASC":"DESC";return `${expression} ${direction} NULLS LAST, ${id} ${direction}`;};
   if(name==="accounts-receivable"){
    where.push("i.tenant_id=current_setting('app.tenant_id')::uuid","i.deleted_at IS NULL","i.status IN ('issued','partially_paid')","i.issue_date>=$1","i.issue_date<$2");
    if(q.clientId)where.push(`i.client_id=${bind(q.clientId)}`);if(q.projectId)where.push(`i.project_id=${bind(q.projectId)}`);if(q.currencyCode)where.push(`i.currency_code=${bind(q.currencyCode)}`);if(q.overdue!==undefined)where.push(`${q.overdue?"":"NOT "}(i.due_date<CURRENT_DATE)`);
    order=ordered({invoiceNumber:"i.invoice_number",clientName:"c.name",projectName:"p.name",issueDate:"i.issue_date",dueDate:"i.due_date",outstanding:"(i.gross_amount-i.paid_amount)",status:"i.status"},"i.due_date","i.id");
    sql=`SELECT i.id,i.invoice_number "invoiceNumber",c.id "clientId",c.name "clientName",p.id "projectId",p.name "projectName",i.issue_date "issueDate",i.due_date "dueDate",i.currency_code "currencyCode",${money("i.gross_amount")} gross,${money("i.paid_amount")} paid,${money("i.gross_amount-i.paid_amount")} outstanding,greatest(0,CURRENT_DATE-coalesce(i.due_date,CURRENT_DATE))::int "daysOverdue",i.status,count(*) OVER()::int "totalCount" FROM invoices i JOIN clients c ON c.id=i.client_id LEFT JOIN projects p ON p.id=i.project_id WHERE ${where.join(" AND ")} ORDER BY ${order}${paginate()}`;
   }else if(name==="profitability"){
    if(q.projectId)where.push(`p.id=${bind(q.projectId)}`);if(q.currencyCode)where.push(`p.currency_code=${bind(q.currencyCode)}`);
    order=ordered({projectName:"p.name",margin:"(coalesce(inv.invoiced,0)-coalesce(exp.expenses,0))",marginPercentage:"CASE WHEN coalesce(inv.invoiced,0)=0 THEN NULL ELSE (inv.invoiced-coalesce(exp.expenses,0))/inv.invoiced END",outstanding:"coalesce(inv.overdue,0)"},"p.name","p.id");
    sql=`WITH inv AS(SELECT project_id,currency_code,sum(gross_amount) invoiced,sum(paid_amount) paid,sum(gross_amount-paid_amount) FILTER(WHERE status IN ('issued','partially_paid') AND due_date<CURRENT_DATE) overdue FROM invoices WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL AND status IN ('issued','partially_paid','paid') AND issue_date>=$1 AND issue_date<$2 GROUP BY project_id,currency_code),exp AS(SELECT project_id,currency_code,sum(gross_amount) expenses FROM expenses WHERE tenant_id=current_setting('app.tenant_id')::uuid AND deleted_at IS NULL AND status='approved' AND expense_date>=$1 AND expense_date<$2 GROUP BY project_id,currency_code) SELECT p.id "projectId",p.name "projectName",p.currency_code "currencyCode",round(p.approved_budget,4)::text budget,${money("inv.invoiced")} invoiced,${money("inv.paid")} paid,${money("exp.expenses")} expenses,round(coalesce(inv.invoiced,0)-coalesce(exp.expenses,0),4)::text margin,CASE WHEN coalesce(inv.invoiced,0)=0 THEN NULL ELSE round((inv.invoiced-coalesce(exp.expenses,0))/inv.invoiced*100,4)::text END "marginPercentage",${money("inv.overdue")} "overdueReceivables",count(*) OVER()::int "totalCount" FROM projects p LEFT JOIN inv ON inv.project_id=p.id AND inv.currency_code=p.currency_code LEFT JOIN exp ON exp.project_id=p.id AND exp.currency_code=p.currency_code WHERE p.tenant_id=current_setting('app.tenant_id')::uuid AND p.deleted_at IS NULL${where.length?` AND ${where.join(" AND ")}`:""} ORDER BY ${order}${paginate()}`;
   }else if(name==="tasks"||name==="deadlines"){
    where.push("t.tenant_id=current_setting('app.tenant_id')::uuid","t.deleted_at IS NULL");if(name==="deadlines")where.push("t.status IN ('todo','in_progress','blocked')","(t.due_date IS NULL OR (t.due_date>=$1 AND t.due_date<$2))");else where.push("t.created_at>=$1::date","t.created_at<$2::date");
    if(q.projectId)where.push(`t.project_id=${bind(q.projectId)}`);if(q.userId)where.push(`EXISTS(SELECT 1 FROM task_assignments ta WHERE ta.task_id=t.id AND ta.user_id=${bind(q.userId)})`);if(q.status)where.push(`t.status=${bind(q.status)}`);if(q.overdue!==undefined)where.push(`${q.overdue?"":"NOT "}(t.due_date<CURRENT_DATE AND t.status IN ('todo','in_progress','blocked'))`);
    const bucket="CASE WHEN t.due_date IS NULL THEN 'no_due_date' WHEN t.due_date<CURRENT_DATE THEN 'overdue' WHEN t.due_date=CURRENT_DATE THEN 'due_today' WHEN t.due_date<CURRENT_DATE+interval '8 days' THEN 'due_soon' ELSE 'later' END";
    order=ordered({title:"t.title",status:"t.status",dueDate:"t.due_date",projectName:"p.name",bucket},name==="deadlines"?"t.due_date":"t.updated_at","t.id");
    sql=`SELECT t.id,t.title,t.status,t.priority,t.due_date "dueDate",${bucket} bucket,p.id "projectId",p.name "projectName",count(*) OVER()::int "totalCount" FROM tasks t JOIN projects p ON p.id=t.project_id WHERE ${where.join(" AND ")} ORDER BY ${order}${paginate()}`;
   }else if(name==="workload"){
    const project=q.projectId?` AND t.project_id=${bind(q.projectId)}`:"",user=q.userId?` AND u.id=${bind(q.userId)}`:"";
    order=ordered({displayName:'r."displayName"',openCount:'r."openCount"',overdueCount:'r."overdueCount"'},'r."displayName"','coalesce(r."userId",\'ffffffff-ffff-ffff-ffff-ffffffffffff\'::uuid)');
    sql=`WITH rows AS(SELECT u.id "userId",u.display_name "displayName",u.is_disabled "isDisabled",count(DISTINCT t.id) FILTER(WHERE t.status IN ('todo','in_progress','blocked'))::int "openCount",count(DISTINCT t.id) FILTER(WHERE t.status='in_progress')::int "inProgressCount",count(DISTINCT t.id) FILTER(WHERE t.status='blocked')::int "blockedCount",count(DISTINCT t.id) FILTER(WHERE t.status IN ('todo','in_progress','blocked') AND t.due_date<CURRENT_DATE)::int "overdueCount",count(DISTINCT t.id) FILTER(WHERE t.status IN ('todo','in_progress','blocked') AND t.due_date>=CURRENT_DATE AND t.due_date<CURRENT_DATE+interval '8 days')::int "dueSoonCount" FROM users u LEFT JOIN task_assignments a ON a.user_id=u.id LEFT JOIN tasks t ON t.id=a.task_id AND t.tenant_id=current_setting('app.tenant_id')::uuid AND t.deleted_at IS NULL AND t.created_at>=$1 AND t.created_at<$2${project} WHERE u.tenant_id=current_setting('app.tenant_id')::uuid AND u.deleted_at IS NULL${user} GROUP BY u.id UNION ALL SELECT NULL,'Unassigned',false,count(*)::int,count(*) FILTER(WHERE status='in_progress')::int,count(*) FILTER(WHERE status='blocked')::int,count(*) FILTER(WHERE due_date<CURRENT_DATE)::int,count(*) FILTER(WHERE due_date>=CURRENT_DATE AND due_date<CURRENT_DATE+interval '8 days')::int FROM tasks t WHERE t.tenant_id=current_setting('app.tenant_id')::uuid AND t.deleted_at IS NULL AND t.created_at>=$1 AND t.created_at<$2 AND t.status IN ('todo','in_progress','blocked')${project} AND ${q.userId?"false":"true"} AND NOT EXISTS(SELECT 1 FROM task_assignments a WHERE a.task_id=t.id)) SELECT r.*,count(*) OVER()::int "totalCount" FROM rows r ORDER BY ${order}${paginate()}`;
   }else if(name==="documents"){
    where.push("d.tenant_id=current_setting('app.tenant_id')::uuid","d.created_at>=$1","d.created_at<$2");where.push(q.archived===true?"d.deleted_at IS NOT NULL":"d.deleted_at IS NULL");
    if(q.projectId)where.push(`EXISTS(SELECT 1 FROM document_links x WHERE x.document_id=d.id AND x.entity_type='project' AND x.entity_id=${bind(q.projectId)})`);if(q.userId)where.push(`d.created_by=${bind(q.userId)}`);if(q.category)where.push(`d.category=${bind(q.category)}`);if(q.entityType)where.push(`EXISTS(SELECT 1 FROM document_links x WHERE x.document_id=d.id AND x.entity_type=${bind(q.entityType)}${q.entityId?` AND x.entity_id=${bind(q.entityId)}`:""})`);
    order=ordered({filename:"v.original_filename",category:"d.category",createdAt:"d.created_at"},"d.created_at","d.id");
    sql=`SELECT d.id,d.category,d.description,d.created_at "createdAt",u.id "uploaderId",u.display_name "uploaderName",v.original_filename filename,coalesce(string_agg(DISTINCT l.entity_type,','),'') "linkedEntityTypes",coalesce(jsonb_agg(DISTINCT jsonb_build_object('entityType',l.entity_type,'entityId',l.entity_id)) FILTER(WHERE l.id IS NOT NULL),'[]') "linkedEntities",count(*) OVER()::int "totalCount" FROM documents d JOIN users u ON u.id=d.created_by JOIN document_versions v ON v.document_id=d.id AND v.version_no=d.current_version_no LEFT JOIN document_links l ON l.document_id=d.id WHERE ${where.join(" AND ")} GROUP BY d.id,u.id,v.original_filename ORDER BY ${order}${paginate()}`;
   }else if(name==="activity"){
    where.push("a.tenant_id=current_setting('app.tenant_id')::uuid","a.occurred_at>=$1","a.occurred_at<$2");if(q.actorId)where.push(`a.actor_id=${bind(q.actorId)}`);if(q.domain)where.push(`a.entity_type=${bind(q.domain)}`);
    order=ordered({occurredAt:"a.occurred_at",action:"a.action",actorName:"coalesce(u.display_name,'System')"},"a.occurred_at","a.id");
    sql=`SELECT a.id,a.action,a.entity_type "entityType",a.entity_id "entityId",a.occurred_at "occurredAt",u.id "actorId",coalesce(u.display_name,'System') "actorName",count(*) OVER()::int "totalCount" FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id WHERE ${where.join(" AND ")} ORDER BY ${order}${paginate()}`;
   }else if(name==="revenue"||name==="expenses"){
    const group=q.groupBy??"month";
    if(name==="revenue"){where.push("i.tenant_id=current_setting('app.tenant_id')::uuid","i.deleted_at IS NULL","i.status IN ('issued','partially_paid','paid')","i.issue_date>=$1","i.issue_date<$2");if(q.clientId)where.push(`i.client_id=${bind(q.clientId)}`);if(q.projectId)where.push(`i.project_id=${bind(q.projectId)}`);if(q.currencyCode)where.push(`i.currency_code=${bind(q.currencyCode)}`);const g=group==="client"?"c.name":group==="project"?"coalesce(p.name,'Unassigned')":"to_char(i.issue_date,'YYYY-MM')";sql=`SELECT i.currency_code "currencyCode",${g} "group",${money("sum(i.gross_amount)")} "grossInvoiced",${money("sum(i.paid_amount)")} "paidReceipts",count(*) OVER()::int "totalCount" FROM invoices i JOIN clients c ON c.id=i.client_id LEFT JOIN projects p ON p.id=i.project_id WHERE ${where.join(" AND ")} GROUP BY i.currency_code,${g} ORDER BY i.currency_code,${g}${paginate()}`;}
    else{where.push("e.tenant_id=current_setting('app.tenant_id')::uuid","e.deleted_at IS NULL","e.status='approved'","e.expense_date>=$1","e.expense_date<$2");if(q.projectId)where.push(`e.project_id=${bind(q.projectId)}`);if(q.currencyCode)where.push(`e.currency_code=${bind(q.currencyCode)}`);if(q.category)where.push(`e.category=${bind(q.category)}`);const g=group==="category"?"e.category":group==="project"?"coalesce(p.name,'Unassigned')":"to_char(e.expense_date,'YYYY-MM')";sql=`SELECT e.currency_code "currencyCode",${g} "group",${money("sum(e.gross_amount)")} amount,count(*) OVER()::int "totalCount" FROM expenses e LEFT JOIN projects p ON p.id=e.project_id WHERE ${where.join(" AND ")} GROUP BY e.currency_code,${g} ORDER BY e.currency_code,${g}${paginate()}`;}
   }
   if(!sql)throw new Error("Unsupported report");return (await c.query(sql,values)).rows;
  });
 }
}
