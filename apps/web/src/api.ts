import type {
  ClientContract,CreateClientRequest,CreateProjectRequest,CreatePropertyRequest,CreateTaskRequest,DocumentContract,DocumentVersionSchema,
  ExpenseContract,InvoiceContract,PaymentContract,ProjectContract,ProjectFinancialSummary,PropertyContract,TaskContract,UpdateClientRequest,UpdateProjectRequest,
  UpdatePropertyRequest,UpdateTaskRequest,NotificationContract,NotificationPreferencesContract,MeasurementUnitContract,WorkCategoryContract,WorkCategoryNodeContract,WorkItemContract,MaterialCategoryContract,MaterialCategoryNodeContract,MaterialContract,PriceListContract,PriceListItemContract,ConstructionNormContract,ConstructionNormItemContract,EstimateContract,EstimateItemContract,EstimateMaterialContract
} from "@odls/contracts";
import {NotificationSchema,NotificationPreferencesSchema} from "@odls/contracts";

export type Session={accessToken:string;refreshToken:string;user:{id:string;email:string;displayName:string};permissions:string[]};
export type Resource="clients"|"properties"|"projects"|"tasks";
export type EntityByResource={clients:ClientContract;properties:PropertyContract;projects:ProjectContract;tasks:TaskContract};
export type CreateByResource={clients:CreateClientRequest;properties:CreatePropertyRequest;projects:CreateProjectRequest;tasks:CreateTaskRequest};
export type UpdateByResource={clients:UpdateClientRequest;properties:UpdatePropertyRequest;projects:UpdateProjectRequest;tasks:UpdateTaskRequest};
export type ProjectAction="plan"|"start"|"pause"|"resume"|"complete"|"cancel";
export type TaskAction="start"|"block"|"resume"|"complete"|"cancel";
export type ReportName="accounts-receivable"|"profitability"|"deadlines"|"workload"|"documents"|"activity";
export type ReportEnvelope={data:any[];pagination:{page:number;pageSize:number;total:number;totalPages:number};range:{start:string;endExclusive:string;timezone:"UTC"}};
export type PageEnvelope<T>={data:T[];pagination:{page:number;pageSize:number;total:number;totalPages:number}};
export type RoomScanDto={id:string;propertyId:string;projectId?:string;status:string;revision:number;notes?:string;version:number;createdAt:string;updatedAt:string};
export type RoomScanWorkspaceDto={scan:RoomScanDto;rooms:any[];surfaces:any[];measurements:any[];openings:any[];observations:any[];attachments:any[];quantities:any[];reviews:any[];history:any[];snapshots:any[];completeness:{status:string;issues:any[]}};
export type SourceSnapshotDto={snapshotId?:string;fingerprint?:string;schemaVersion?:string};
export type TechnicalAssignmentDto={id:string;projectId:string;propertyId?:string;code:string;displayName:string;revisionId:string;revisionNumber:number;status:string;version:number;summary?:string;approvedAt?:string;approvedBy?:string;statements?:Array<Record<string,any>>;openItems?:Array<Record<string,any>>;customerSuppliedItems?:Array<Record<string,any>>;schedule?:Record<string,any>;budget?:Record<string,any>};
export type DesignProjectDto={id:string;projectId:string;propertyId?:string;code:string;displayName:string;revisionId:string;revisionNumber:number;status:string;version:number;technicalAssignmentSnapshotId?:string;technicalAssignmentFingerprint?:string;technicalAssignmentSchemaVersion?:string;roomScanSnapshotId?:string;roomScanFingerprint?:string;roomScanSchemaVersion?:string;decisions?:Array<Record<string,any>>;openItems?:Array<Record<string,any>>;references?:Array<Record<string,any>>};
export type TechnologyDto={id:string;code:string;name:string;description?:string;version:number;versionId:string;versionNumber:number;status:"draft"|"review_required"|"approved"|"superseded";executionMethod:string;requiredLayers:Array<{name:string;order:number;description?:string}>;thicknessMm?:number;dryingStages:Array<{name:string;afterLayer?:number;minimumHours:number}>;qualityRules:string[];inspectionRequirements:string[];safetyNotes:string[];technologyVersion:number};
export type WorkScopeItemDto={id:string;workType:string;description:string;status:string;priority:string;sequence:number;targetType:string;targetReference:string;technologyVersionId:string;reviewState:"pending"|"confirmed"|"rejected";version:number};
export type WorkScopeQuantityMappingDto={id:string;workItemId:string;spatialSnapshotId:string;scannerQuantityType:string;scannerQuantityValue:number;scannerUnit:string;scannerFormulaId:string;scannerCalculatorVersion:string};
export type WorkScopeDto={id:string;projectId:string;code:string;name:string;revisionId:string;revisionNumber:number;status:"draft"|"review_required"|"ready_for_approval"|"approved"|"superseded"|"cancelled";version:number;items?:WorkScopeItemDto[];dependencies?:Array<Record<string,any>>;mappings?:WorkScopeQuantityMappingDto[];sources?:Array<{spatialSnapshotId:string;snapshotFingerprint:string}>};
export type WorkScopeAnalysisDto={scopeId:string;status:string;ready:boolean;scopeCompleteness:{confirmed:number;total:number;mapped:number};sequenceValid:boolean;missingApprovals:number;recommendations:Array<{code:string;severity:string;workItemId?:string;recommendation:string}>;mutatedData:false;commercialCalculationPerformed:false};
export type EngineeringNormParameterDto={code:string;label:string;unitCode:string;dataType:"decimal"|"integer"|"boolean"|"enum";minimumValue:number|null;maximumValue:number|null;allowedValues:unknown[];required:boolean;defaultValue?:unknown};
export type EngineeringNormDemandDto={demandKind:"material_requirement"|"labor"|"machine";requirementCode:string;description:string;outputUnitCode:string;formula:{kind:"linear";base:number;perWorkUnit:boolean;terms:Array<{parameter:string;coefficient:number}>};qualification?:string;crewComposition:unknown[];shiftAssumptions:Record<string,unknown>;machineRequirements:Record<string,unknown>;engineeringRequirements:Record<string,unknown>};
export type EngineeringNormDto={id:string;code:string;title:string;countryCode:string;regionCode?:string;discipline:string;workType:string;technologyVersionId?:string;knowledgeVersionId?:string;revisionId?:string;revisionNumber:number;executionStage?:string;effectiveFrom?:string;effectiveTo?:string;status:"draft"|"review_required"|"ready_for_approval"|"approved"|"superseded"|"cancelled";authoritative:boolean;version:number;parameters?:EngineeringNormParameterDto[];layers?:Array<{sequence:number;code:string;name:string;layerKind:string;requirements:Record<string,unknown>;minimumDryingHours?:number;inspectionRequired:boolean}>;demands?:EngineeringNormDemandDto[]};
export type EngineeringNormAnalysisDto={normId:string;status:string;ready:boolean;issues:Array<{code:string;detail?:string}>;recommendations:Array<{code:string;recommendation:string}>;mutatedData:false;commercialCalculationPerformed:false;productSelectionPerformed:false};
export type EngineeringNormEvaluationDto={normId:string;effectiveOn:string;workQuantity:number;parameters:Record<string,unknown>;demands:Array<{demandKind:string;requirementCode:string;quantity:number;unitCode:string}>;engineeringConstraints:Record<string,unknown>;productSelectionPerformed:false;commercialCalculationPerformed:false};
export type ApprovedSnapshotDto={id:string;contentFingerprint:string;schemaVersion?:string;approvedAt?:string;approvedBy?:string;revisionNumber?:number;content?:Record<string,any>};
export type ConstructionAssistantRecommendation={id:string;recommendationKey:string;riskType:string;severity:string;probability:number;impact:string;happened:string;reason:string;evidence:Array<{source:string;id:string;observedAt?:string;value?:unknown}>;recommendation:string;nextStep:string;confidence:number;dataSources:string[];status:string;analysedAt:string;decisionComment?:string};
export type ConstructionAssistantPanelDto={health:"green"|"yellow"|"orange"|"red";recommendations:ConstructionAssistantRecommendation[];weather:Array<{id:string;forecastAt:string;temperatureC?:number;humidityPercent?:number;precipitationProbability?:number;condition?:string;source:string}>;blockedApprovals?:ConstructionAssistantRecommendation[];sourceAvailability:Record<string,boolean>};
export function mergeNotifications(current:NotificationContract[],incoming:NotificationContract[]):NotificationContract[]{const merged=new Map(current.map(x=>[x.id,x]));for(const item of incoming)merged.set(item.id,item);return [...merged.values()].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));}

export class ApiError extends Error {
  constructor(public status:number,public code:string,public correlationId?:string,public details:Record<string,unknown>={}){super(code);}
}
export function apiErrorMessage(error:unknown):string {
  if(!(error instanceof ApiError))return "The request could not be completed.";
  if(error.code==="VERSION_CONFLICT")return "This record changed in another session. Reload the list before trying again.";
  if(error.code==="ENTITY_ARCHIVED")return "This record is archived and can no longer be changed.";
  if(error.code==="INVALID_STATUS_TRANSITION")return "That action is no longer valid for the current status. Reload the list.";
  if(error.code==="VALIDATION_ERROR")return "Some submitted values are invalid. Review them and try again.";
  if(error.code==="FORBIDDEN")return "You do not have permission to perform this action.";
  return `Request failed: ${error.code}`;
}

const base=import.meta.env.VITE_API_BASE_URL??"http://localhost:3000/api/v1";
const storage=typeof sessionStorage==="undefined"?null:sessionStorage;
let session:Session|null=JSON.parse(storage?.getItem("odls.session")??"null");
export const auth={get:()=>session,set:(value:Session|null)=>{session=value;if(value)storage?.setItem("odls.session",JSON.stringify(value));else storage?.removeItem("odls.session");}};

async function raw<T>(path:string,init:RequestInit={},retried=false):Promise<T>{
  const headers=new Headers(init.headers);if(!(init.body instanceof FormData))headers.set("content-type","application/json");if(session)headers.set("authorization",`Bearer ${session.accessToken}`);
  const response=await fetch(`${base}${path}`,{...init,headers});const body=await response.json().catch(()=>null);
  if(response.status===401&&session&&!retried&&path!=="/auth/refresh"){const refresh=await fetch(`${base}/auth/refresh`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refreshToken:session.refreshToken})});const refreshed=await refresh.json();if(refresh.ok){auth.set({...session,...refreshed.data});return raw<T>(path,init,true);}auth.set(null);}
  if(!response.ok){const problem=body?.error??body??{};throw new ApiError(response.status,problem.code??"REQUEST_FAILED",problem.correlationId??problem.requestId,problem.details??{});}
  return body?.data as T;
}
async function envelope<T>(path:string):Promise<T>{const headers=new Headers();if(session)headers.set("authorization",`Bearer ${session.accessToken}`);const response=await fetch(`${base}${path}`,{headers});const body=await response.json().catch(()=>null);if(!response.ok){const problem=body?.error??body??{};throw new ApiError(response.status,problem.code??"REQUEST_FAILED",problem.correlationId??problem.requestId,problem.details??{});}return body as T;}
const json=(method:string,body:unknown):RequestInit=>({method,body:JSON.stringify(body)});
export const api={
  login:(tenantSlug:string,email:string,password:string)=>raw<Session>("/auth/login",json("POST",{tenantSlug,email,password})),
  me:()=>raw<Session["user"]>("/auth/me"),
  company:()=>raw<{id:string;name:string;slug:string}>("/company"),
  list:<R extends Resource>(resource:R,search="")=>raw<EntityByResource[R][]>(`/${resource}?pageSize=100${search?`&search=${encodeURIComponent(search)}`:""}`),
  projectsPage:(query:string)=>envelope<PageEnvelope<ProjectContract>>(`/projects?${query}`),
  get:<R extends Resource>(resource:R,id:string)=>raw<EntityByResource[R]>(`/${resource}/${id}`),
  create:<R extends Resource>(resource:R,body:CreateByResource[R])=>raw<EntityByResource[R]>(`/${resource}`,json("POST",body)),
  update:<R extends Resource>(resource:R,id:string,body:UpdateByResource[R])=>raw<EntityByResource[R]>(`/${resource}/${id}`,json("PATCH",body)),
  archive:<R extends Resource>(resource:R,id:string,expectedVersion:number)=>raw<EntityByResource[R]>(`/${resource}/${id}`,json("DELETE",{expectedVersion})),
  projectLifecycle:(id:string,action:ProjectAction,expectedVersion:number)=>raw<ProjectContract>(`/projects/${id}/${action}`,json("POST",{expectedVersion})),
  taskLifecycle:(id:string,action:TaskAction,expectedVersion:number)=>raw<TaskContract>(`/tasks/${id}/${action}`,json("POST",{expectedVersion})),
  assign:(taskId:string,userId:string,expectedVersion:number)=>raw<TaskContract>(`/tasks/${taskId}/assignees`,json("POST",{userId,expectedVersion})),
  unassign:(taskId:string,userId:string,expectedVersion:number)=>raw<TaskContract>(`/tasks/${taskId}/assignees/${userId}`,json("DELETE",{expectedVersion})),
  invoices:()=>raw<InvoiceContract[]>("/invoices?pageSize=100"),
  invoice:(id:string)=>raw<InvoiceContract>(`/invoices/${id}`),
  createInvoice:(body:unknown)=>raw<InvoiceContract>("/invoices",json("POST",body)),
  updateInvoice:(id:string,body:unknown)=>raw<InvoiceContract>(`/invoices/${id}`,json("PATCH",body)),
  invoiceAction:(id:string,action:"issue"|"cancel",expectedVersion:number)=>raw<InvoiceContract>(`/invoices/${id}/${action}`,json("POST",{expectedVersion})),
  archiveInvoice:(id:string,expectedVersion:number)=>raw<InvoiceContract>(`/invoices/${id}`,json("DELETE",{expectedVersion})),
  payments:()=>raw<PaymentContract[]>("/payments?pageSize=100"),
  createPayment:(body:unknown)=>raw<PaymentContract>("/payments",json("POST",body)),
  allocatePayment:(id:string,invoiceId:string,amount:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}/allocate`,json("POST",{invoiceId,amount,expectedVersion})),
  reversePayment:(id:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}/reverse`,json("POST",{expectedVersion})),
  archivePayment:(id:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}`,json("DELETE",{expectedVersion})),
  expenses:()=>raw<ExpenseContract[]>("/expenses?pageSize=100"),
  createExpense:(body:unknown)=>raw<ExpenseContract>("/expenses",json("POST",body)),
  updateExpense:(id:string,body:unknown)=>raw<ExpenseContract>(`/expenses/${id}`,json("PATCH",body)),
  expenseAction:(id:string,action:"approve"|"reject",expectedVersion:number)=>raw<ExpenseContract>(`/expenses/${id}/${action}`,json("POST",{expectedVersion})),
  archiveExpense:(id:string,expectedVersion:number)=>raw<ExpenseContract>(`/expenses/${id}`,json("DELETE",{expectedVersion})),
  projectFinancialSummary:(id:string)=>raw<ProjectFinancialSummary>(`/projects/${id}/financial-summary`),
  documents:()=>raw<DocumentContract[]>("/documents?pageSize=100"),
  document:(id:string)=>raw<DocumentContract>(`/documents/${id}`),
  uploadDocument:(file:File,meta:{category:string;description:string;entityType:string;entityId:string})=>{const body=new FormData();for(const [k,v] of Object.entries(meta))body.append(k,v);body.append("file",file);return raw<DocumentContract>("/documents",{method:"POST",body});},
  updateDocument:(id:string,body:unknown)=>raw<DocumentContract>(`/documents/${id}`,json("PATCH",body)),
  archiveDocument:(id:string,expectedVersion:number)=>raw<DocumentContract>(`/documents/${id}`,json("DELETE",{expectedVersion})),
  documentVersions:(id:string)=>raw<Array<ReturnType<typeof DocumentVersionSchema.parse>>>(`/documents/${id}/versions`),
  uploadDocumentVersion:(id:string,file:File,expectedVersion:number)=>{const body=new FormData();body.append("expectedVersion",String(expectedVersion));body.append("file",file);return raw<DocumentContract>(`/documents/${id}/versions`,{method:"POST",body});},
  downloadDocument:async(id:string,versionId?:string)=>{const headers=new Headers();if(session)headers.set("authorization",`Bearer ${session.accessToken}`);const response=await fetch(`${base}/documents/${id}${versionId?`/versions/${versionId}`:""}/download`,{headers});if(!response.ok)throw new ApiError(response.status,"REQUEST_FAILED");return {blob:await response.blob(),disposition:response.headers.get("content-disposition")};},
  notifications:async(query="archived=false")=>(await raw<unknown[]>(`/notifications?${query}`)).map(x=>NotificationSchema.parse(x)),
  unreadCount:()=>raw<{count:number}>("/notifications/unread-count"),
  notificationState:(id:string,state:"read"|"unread"|"archive",expectedVersion:number)=>raw<NotificationContract>(`/notifications/${id}${state==="archive"?"":`/${state}`}`,json(state==="archive"?"DELETE":"POST",{expectedVersion})).then(x=>NotificationSchema.parse(x)),
  markAllNotificationsRead:()=>raw<{updated:number}>("/notifications/read-all",json("POST",{})),
  notificationPreferences:()=>raw<NotificationPreferencesContract>("/notification-preferences").then(x=>NotificationPreferencesSchema.parse(x)),
  updateNotificationPreferences:(body:Partial<NotificationPreferencesContract>&{expectedVersion:number})=>raw<NotificationPreferencesContract>("/notification-preferences",json("PATCH",body)).then(x=>NotificationPreferencesSchema.parse(x)),
  dashboard:(range=30)=>raw<any>(`/dashboard/executive?range=${range}`),
  projectHealth:()=>raw<any[]>("/dashboard/project-health"),
  report:(name:ReportName|"revenue"|"expenses"|"tasks",query="range=30&pageSize=25")=>envelope<ReportEnvelope>(`/reports/${name}?${query}`),
  measurementUnits:(query:string)=>envelope<{data:MeasurementUnitContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/measurement-units?${query}`),
  createMeasurementUnit:(body:unknown)=>raw<MeasurementUnitContract>("/measurement-units",json("POST",body)),
  updateMeasurementUnit:(id:string,body:unknown)=>raw<MeasurementUnitContract>(`/measurement-units/${id}`,json("PATCH",body)),
  measurementUnitStatus:(id:string,action:"activate"|"deactivate",expectedVersion:number)=>raw<MeasurementUnitContract>(`/measurement-units/${id}/${action}`,json("POST",{expectedVersion})),
  convertMeasurementUnit:(body:unknown)=>raw<{quantity:string;fromUnitId:string;toUnitId:string;result:string;precision:number}>("/measurement-units/convert",json("POST",body)),
  workCategories:(query:string)=>envelope<{data:WorkCategoryContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/work-categories?${query}`),
  workCategoryTree:()=>raw<WorkCategoryNodeContract[]>("/work-categories/tree"),
  createWorkCategory:(body:unknown)=>raw<WorkCategoryContract>("/work-categories",json("POST",body)),
  updateWorkCategory:(id:string,body:unknown)=>raw<WorkCategoryContract>(`/work-categories/${id}`,json("PATCH",body)),
  moveWorkCategory:(id:string,body:unknown)=>raw<WorkCategoryContract>(`/work-categories/${id}/move`,json("POST",body)),
  workCategoryStatus:(id:string,action:"activate"|"deactivate",expectedVersion:number)=>raw<WorkCategoryContract>(`/work-categories/${id}/${action}`,json("POST",{expectedVersion})),
  workItems:(query:string)=>envelope<{data:WorkItemContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/work-items?${query}`),
  createWorkItem:(body:unknown)=>raw<WorkItemContract>("/work-items",json("POST",body)),
  updateWorkItem:(id:string,body:unknown)=>raw<WorkItemContract>(`/work-items/${id}`,json("PATCH",body)),
  workItemStatus:(id:string,action:"activate"|"deactivate",expectedVersion:number)=>raw<WorkItemContract>(`/work-items/${id}/${action}`,json("POST",{expectedVersion})),
  materialCategories:(query:string)=>envelope<{data:MaterialCategoryContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/material-categories?${query}`),
  materialCategoryTree:()=>raw<MaterialCategoryNodeContract[]>("/material-categories/tree"),
  createMaterialCategory:(body:unknown)=>raw<MaterialCategoryContract>("/material-categories",json("POST",body)),
  updateMaterialCategory:(id:string,body:unknown)=>raw<MaterialCategoryContract>(`/material-categories/${id}`,json("PATCH",body)),
  moveMaterialCategory:(id:string,body:unknown)=>raw<MaterialCategoryContract>(`/material-categories/${id}/move`,json("POST",body)),
  materialCategoryStatus:(id:string,action:"activate"|"deactivate",expectedVersion:number)=>raw<MaterialCategoryContract>(`/material-categories/${id}/${action}`,json("POST",{expectedVersion})),
  materials:(query:string)=>envelope<{data:MaterialContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/materials?${query}`),
  createMaterial:(body:unknown)=>raw<MaterialContract>("/materials",json("POST",body)),
  updateMaterial:(id:string,body:unknown)=>raw<MaterialContract>(`/materials/${id}`,json("PATCH",body)),
  materialStatus:(id:string,action:"activate"|"deactivate",expectedVersion:number)=>raw<MaterialContract>(`/materials/${id}/${action}`,json("POST",{expectedVersion})),
  priceLists:(query:string)=>envelope<{data:PriceListContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/price-lists?${query}`),
  createPriceList:(body:unknown)=>raw<PriceListContract>("/price-lists",json("POST",body)),
  updatePriceList:(id:string,body:unknown)=>raw<PriceListContract>(`/price-lists/${id}`,json("PATCH",body)),
  priceListStatus:(id:string,status:"active"|"inactive",expectedVersion:number)=>raw<PriceListContract>(`/price-lists/${id}/status`,json("PATCH",{status,expectedVersion})),
  priceListItems:(query:string)=>envelope<{data:PriceListItemContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/price-list-items?${query}`),
  createPriceListItem:(body:unknown)=>raw<PriceListItemContract>("/price-list-items",json("POST",body)),
  updatePriceListItem:(id:string,body:unknown)=>raw<PriceListItemContract>(`/price-list-items/${id}`,json("PATCH",body)),
  priceListItemStatus:(id:string,status:"active"|"inactive",expectedVersion:number)=>raw<PriceListItemContract>(`/price-list-items/${id}/status`,json("PATCH",{status,expectedVersion})),
  constructionNorms:(query:string)=>envelope<{data:ConstructionNormContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/construction-norms?${query}`),
  createConstructionNorm:(body:unknown)=>raw<ConstructionNormContract>("/construction-norms",json("POST",body)),
  updateConstructionNorm:(id:string,body:unknown)=>raw<ConstructionNormContract>(`/construction-norms/${id}`,json("PATCH",body)),
  constructionNormStatus:(id:string,status:"active"|"inactive",expectedVersion:number)=>raw<ConstructionNormContract>(`/construction-norms/${id}/status`,json("PATCH",{status,expectedVersion})),
  constructionNormItems:(query:string)=>envelope<{data:ConstructionNormItemContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/construction-norm-items?${query}`),
  createConstructionNormItem:(body:unknown)=>raw<ConstructionNormItemContract>("/construction-norm-items",json("POST",body)),
  updateConstructionNormItem:(id:string,body:unknown)=>raw<ConstructionNormItemContract>(`/construction-norm-items/${id}`,json("PATCH",body)),
  deleteConstructionNormItem:(id:string,expectedVersion:number)=>raw<{id:string}>(`/construction-norm-items/${id}`,json("DELETE",{expectedVersion})),
  estimates:(query:string)=>envelope<{data:EstimateContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/estimates?${query}`),
  createEstimate:(body:unknown)=>raw<EstimateContract>("/estimates",json("POST",body)),
  updateEstimate:(id:string,body:unknown)=>raw<EstimateContract>(`/estimates/${id}`,json("PATCH",body)),
  estimateStatus:(id:string,status:"draft"|"approved"|"archived",expectedVersion:number)=>raw<EstimateContract>(`/estimates/${id}/status`,json("PATCH",{status,expectedVersion})),
  recalculateEstimate:(id:string)=>raw<EstimateContract>(`/estimates/${id}/recalculate`,json("POST",{})),
  estimateItems:(query:string)=>envelope<{data:EstimateItemContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/estimate-items?${query}`),
  createEstimateItem:(body:unknown)=>raw<EstimateItemContract>("/estimate-items",json("POST",body)),
  updateEstimateItem:(id:string,body:unknown)=>raw<EstimateItemContract>(`/estimate-items/${id}`,json("PATCH",body)),
  deleteEstimateItem:(id:string,expectedVersion:number)=>raw<{id:string}>(`/estimate-items/${id}`,json("DELETE",{expectedVersion})),
  estimateMaterials:(query:string)=>envelope<{data:EstimateMaterialContract[];pagination:{page:number;pageSize:number;total:number;totalPages:number}}>(`/estimate-materials?${query}`),
  updateEstimateMaterial:(id:string,body:unknown)=>raw<EstimateMaterialContract>(`/estimate-materials/${id}`,json("PATCH",body)),
  deleteEstimateMaterial:(id:string,expectedVersion:number)=>raw<{id:string}>(`/estimate-materials/${id}`,json("DELETE",{expectedVersion})),
  roomScans:(projectId?:string)=>envelope<PageEnvelope<RoomScanDto>>(`/room-scans?page=1&pageSize=25&sortBy=updatedAt&sortOrder=desc${projectId?`&projectId=${encodeURIComponent(projectId)}`:""}`),
  roomScan:(id:string)=>raw<RoomScanDto>(`/room-scans/${id}`),
  createRoomScan:(body:unknown)=>raw<RoomScanDto>("/room-scans",json("POST",body)),
  roomScanWorkspace:(id:string)=>raw<RoomScanWorkspaceDto>(`/room-scans/${id}/workspace`),
  spatialCapabilities:(id:string)=>raw<any>(`/room-scans/${id}/spatial/capabilities?platform=web&camera=${typeof navigator!=="undefined"&&"mediaDevices"in navigator}&webXrDepth=false`),
  spatialWorkspace:(id:string)=>raw<any>(`/room-scans/${id}/spatial/workspace`),
  createSpatialSession:(id:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/sessions`,json("POST",body)),
  addSpatialPoint:(id:string,sessionId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/sessions/${sessionId}/points`,json("POST",body)),
  decideSpatialPoint:(id:string,sessionId:string,pointId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/sessions/${sessionId}/points/${pointId}/decision`,json("POST",body)),
  createSpatialRevision:(id:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/revisions`,json("POST",body)),
  addSpatialOpening:(id:string,revisionId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/revisions/${revisionId}/openings`,json("POST",body)),
  calculateSpatialRevision:(id:string,revisionId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/revisions/${revisionId}/validate-calculate`,json("POST",body)),
  reviewSpatialRevision:(id:string,revisionId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/revisions/${revisionId}/review`,json("POST",body)),
  approveSpatialRevision:(id:string,revisionId:string,body:unknown)=>raw<any>(`/room-scans/${id}/spatial/revisions/${revisionId}/approve`,json("POST",body)),
  spatialSnapshot:(id:string,roomId:string)=>raw<any>(`/room-scans/${id}/spatial/rooms/${roomId}/approved-snapshot`),
  roomScanSnapshot:(id:string)=>raw<ApprovedSnapshotDto>(`/room-scans/${id}/approved-snapshot`),
  roomScanAction:(id:string,action:"start-capture"|"submit-review"|"reject"|"cancel"|"complete-capture"|"approve",expectedVersion:number)=>raw<any>(`/room-scans/${id}/${action}`,json("POST",{expectedVersion})),
  addRoomScanRoom:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/rooms`,json("POST",body)),
  addRoomScanSurface:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/surfaces`,json("POST",body)),
  addRoomScanMeasurement:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/measurements`,json("POST",body)),
  addRoomScanOpening:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/openings`,json("POST",body)),
  addRoomScanObservation:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/observations`,json("POST",body)),
  reviewRoomScanFact:(id:string,body:unknown)=>raw<RoomScanDto>(`/room-scans/${id}/review-entity`,json("POST",body)),
  attachRoomScanPhoto:(id:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/attachments`,json("POST",body)),
  updateRoomScanPhoto:(id:string,attachmentId:string,body:unknown)=>raw<{id:string}>(`/room-scans/${id}/attachments/${attachmentId}`,json("PATCH",body)),
  removeRoomScanPhoto:(id:string,attachmentId:string,expectedVersion:number)=>raw<{id:string}>(`/room-scans/${id}/attachments/${attachmentId}`,json("DELETE",{expectedVersion})),
  deleteRoomScanEntity:(id:string,type:string,entityId:string,expectedVersion:number)=>raw<{id:string}>(`/room-scans/${id}/entities/${type}/${entityId}`,json("DELETE",{expectedVersion})),
  technicalAssignments:(projectId?:string)=>raw<TechnicalAssignmentDto[]>(`/technical-assignments${projectId?`?projectId=${encodeURIComponent(projectId)}`:""}`),
  technicalAssignment:(id:string)=>raw<TechnicalAssignmentDto>(`/technical-assignments/${id}`),
  technicalAssignmentSnapshot:(id:string)=>raw<ApprovedSnapshotDto>(`/technical-assignments/${id}/approved-snapshot`),
  technicalAssignmentTransition:(id:string,status:string,expectedVersion:number)=>raw<TechnicalAssignmentDto>(`/technical-assignments/${id}/transition`,json("POST",{status,expectedVersion})),
  technicalAssignmentReadiness:(id:string,expectedVersion:number)=>raw<TechnicalAssignmentDto>(`/technical-assignments/${id}/readiness`,json("POST",{expectedVersion})),
  technicalAssignmentApprove:(id:string,expectedVersion:number)=>raw<ApprovedSnapshotDto>(`/technical-assignments/${id}/approve`,json("POST",{expectedVersion})),
  updateTechnicalStatement:(assignmentId:string,statementId:string,body:unknown)=>raw<TechnicalAssignmentDto>(`/technical-assignments/${assignmentId}/statements/${statementId}`,json("PATCH",body)),
  reviewTechnicalStatement:(assignmentId:string,statementId:string,expectedVersion:number,decision:string)=>raw<TechnicalAssignmentDto>(`/technical-assignments/${assignmentId}/statements/${statementId}/review`,json("POST",{expectedVersion,decision})),
  designProjects:(projectId?:string)=>raw<DesignProjectDto[]>(`/design-projects${projectId?`?projectId=${encodeURIComponent(projectId)}`:""}`),
  designProject:(id:string)=>raw<DesignProjectDto>(`/design-projects/${id}`),
  designProjectSnapshot:(id:string)=>raw<ApprovedSnapshotDto>(`/design-projects/${id}/approved-snapshot`),
  designProjectTransition:(id:string,status:string,expectedVersion:number)=>raw<DesignProjectDto>(`/design-projects/${id}/transition`,json("POST",{status,expectedVersion})),
  designProjectReadiness:(id:string,expectedVersion:number)=>raw<DesignProjectDto>(`/design-projects/${id}/readiness`,json("POST",{expectedVersion})),
  designProjectApprove:(id:string,expectedVersion:number)=>raw<ApprovedSnapshotDto>(`/design-projects/${id}/approve`,json("POST",{expectedVersion})),
  updateDesignDecision:(designId:string,decisionId:string,body:unknown)=>raw<DesignProjectDto>(`/design-projects/${designId}/decisions/${decisionId}`,json("PATCH",body)),
  reviewDesignDecision:(designId:string,decisionId:string,expectedVersion:number,decision:string)=>raw<DesignProjectDto>(`/design-projects/${designId}/decisions/${decisionId}/review`,json("POST",{expectedVersion,decision})),
  technologies:()=>raw<TechnologyDto[]>("/technologies"),
  createTechnology:(body:unknown)=>raw<{id:string;versionId:string;status:string;version:number}>("/technologies",json("POST",body)),
  technologyReview:(id:string,expectedVersion:number)=>raw<{id:string;versionId:string;status:string;version:number}>(`/technologies/${id}/review`,json("POST",{expectedVersion})),
  technologyApprove:(id:string,expectedVersion:number)=>raw<{id:string;versionId:string;status:string;version:number}>(`/technologies/${id}/approve`,json("POST",{expectedVersion})),
  workScopes:(projectId?:string)=>raw<WorkScopeDto[]>(`/work-scopes${projectId?`?projectId=${encodeURIComponent(projectId)}`:""}`),
  workScope:(id:string)=>raw<WorkScopeDto>(`/work-scopes/${id}`),
  createWorkScope:(body:unknown)=>raw<WorkScopeDto>("/work-scopes",json("POST",body)),
  addWorkScopeItem:(id:string,body:unknown)=>raw<{id:string}>(`/work-scopes/${id}/items`,json("POST",body)),
  reviewWorkScopeItem:(id:string,itemId:string,body:unknown)=>raw<{id:string;state:string}>(`/work-scopes/${id}/items/${itemId}/decision`,json("POST",body)),
  mapWorkScopeQuantity:(id:string,body:unknown)=>raw<{id:string;value:number;unit:string}>(`/work-scopes/${id}/quantity-mappings`,json("POST",body)),
  workScopeReadiness:(id:string,expectedVersion:number)=>raw<{ready:boolean;issues:{code:string;itemId?:string}[]}>(`/work-scopes/${id}/readiness`,json("POST",{expectedVersion})),
  workScopeApprove:(id:string,expectedVersion:number)=>raw<ApprovedSnapshotDto>(`/work-scopes/${id}/approve`,json("POST",{expectedVersion})),
  workScopeAnalysis:(id:string)=>raw<WorkScopeAnalysisDto>(`/work-scopes/${id}/analysis`),
  workScopeSnapshot:(id:string)=>raw<ApprovedSnapshotDto>(`/work-scopes/${id}/approved-snapshot`),
  engineeringNorms:()=>raw<EngineeringNormDto[]>("/engineering-norms"),
  engineeringNorm:(id:string)=>raw<EngineeringNormDto>(`/engineering-norms/${id}`),
  engineeringNormReadiness:(id:string,expectedVersion:number)=>raw<{ready:boolean;issues:Array<{code:string;detail?:string}>}>(`/engineering-norms/${id}/readiness`,json("POST",{expectedVersion})),
  engineeringNormApprove:(id:string,expectedVersion:number)=>raw<ApprovedSnapshotDto>(`/engineering-norms/${id}/approve`,json("POST",{expectedVersion})),
  engineeringNormEvaluate:(id:string,body:{workQuantity:number;parameters:Record<string,string|number|boolean>;effectiveOn:string})=>raw<EngineeringNormEvaluationDto>(`/engineering-norms/${id}/evaluate`,json("POST",body)),
  engineeringNormAnalysis:(id:string)=>raw<EngineeringNormAnalysisDto>(`/engineering-norms/${id}/analysis`),
  engineeringNormSnapshot:(id:string)=>raw<ApprovedSnapshotDto>(`/engineering-norms/${id}/approved-snapshot`),
  constructionAssistant:(projectId:string)=>raw<ConstructionAssistantPanelDto>(`/construction-assistant/projects/${projectId}`),
  analyzeConstructionProject:(projectId:string)=>raw<ConstructionAssistantPanelDto>(`/construction-assistant/projects/${projectId}/analyze`,json("POST",{})),
  constructionAssistantDecision:(recommendationId:string,decision:"accepted"|"dismissed"|"deferred",comment?:string)=>raw<any>(`/construction-assistant/recommendations/${recommendationId}/decision`,json("POST",{decision,comment})),
  tagRoomScanPhoto:(scanId:string,attachmentId:string,condition:string,note?:string)=>raw<any>(`/construction-assistant/room-scans/${scanId}/photos/${attachmentId}/tags`,json("POST",{condition,note})),
  exportReport:async(name:ReportName,query="range=30")=>{const headers=new Headers();if(session)headers.set("authorization",`Bearer ${session.accessToken}`);const response=await fetch(`${base}/reports/${name}/export?${query}`,{headers});if(!response.ok){const body=await response.json().catch(()=>({}));throw new ApiError(response.status,body?.error?.code??"REQUEST_FAILED");}return {blob:await response.blob(),disposition:response.headers.get("content-disposition")};},
  logout:()=>session?raw<{revoked:boolean}>("/auth/logout",json("POST",{refreshToken:session.refreshToken})):Promise.resolve()
};
