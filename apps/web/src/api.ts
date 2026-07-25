import type {
  ClientContract,CreateClientRequest,CreateProjectRequest,CreatePropertyRequest,CreateTaskRequest,DocumentContract,DocumentVersionSchema,
  ExpenseContract,InvoiceContract,PaymentContract,ProjectContract,ProjectFinancialSummary,PropertyContract,TaskContract,UpdateClientRequest,UpdateProjectRequest,
  UpdatePropertyRequest,UpdateTaskRequest
} from "@odls/contracts";

export type Session={accessToken:string;refreshToken:string;user:{id:string;email:string;displayName:string};permissions:string[]};
export type Resource="clients"|"properties"|"projects"|"tasks";
export type EntityByResource={clients:ClientContract;properties:PropertyContract;projects:ProjectContract;tasks:TaskContract};
export type CreateByResource={clients:CreateClientRequest;properties:CreatePropertyRequest;projects:CreateProjectRequest;tasks:CreateTaskRequest};
export type UpdateByResource={clients:UpdateClientRequest;properties:UpdatePropertyRequest;projects:UpdateProjectRequest;tasks:UpdateTaskRequest};
export type ProjectAction="plan"|"start"|"pause"|"resume"|"complete"|"cancel";
export type TaskAction="start"|"block"|"resume"|"complete"|"cancel";

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
const json=(method:string,body:unknown):RequestInit=>({method,body:JSON.stringify(body)});
export const api={
  login:(tenantSlug:string,email:string,password:string)=>raw<Session>("/auth/login",json("POST",{tenantSlug,email,password})),
  me:()=>raw<Session["user"]>("/auth/me"),
  company:()=>raw<{id:string;name:string;slug:string}>("/company"),
  list:<R extends Resource>(resource:R,search="")=>raw<EntityByResource[R][]>(`/${resource}?pageSize=100${search?`&search=${encodeURIComponent(search)}`:""}`),
  create:<R extends Resource>(resource:R,body:CreateByResource[R])=>raw<EntityByResource[R]>(`/${resource}`,json("POST",body)),
  update:<R extends Resource>(resource:R,id:string,body:UpdateByResource[R])=>raw<EntityByResource[R]>(`/${resource}/${id}`,json("PATCH",body)),
  archive:<R extends Resource>(resource:R,id:string,expectedVersion:number)=>raw<EntityByResource[R]>(`/${resource}/${id}`,json("DELETE",{expectedVersion})),
  projectLifecycle:(id:string,action:ProjectAction,expectedVersion:number)=>raw<ProjectContract>(`/projects/${id}/${action}`,json("POST",{expectedVersion})),
  taskLifecycle:(id:string,action:TaskAction,expectedVersion:number)=>raw<TaskContract>(`/tasks/${id}/${action}`,json("POST",{expectedVersion})),
  assign:(taskId:string,userId:string,expectedVersion:number)=>raw<TaskContract>(`/tasks/${taskId}/assignees`,json("POST",{userId,expectedVersion})),
  unassign:(taskId:string,userId:string,expectedVersion:number)=>raw<TaskContract>(`/tasks/${taskId}/assignees/${userId}`,json("DELETE",{expectedVersion})),
  invoices:()=>raw<InvoiceContract[]>("/invoices"),
  createInvoice:(body:unknown)=>raw<InvoiceContract>("/invoices",json("POST",body)),
  updateInvoice:(id:string,body:unknown)=>raw<InvoiceContract>(`/invoices/${id}`,json("PATCH",body)),
  invoiceAction:(id:string,action:"issue"|"cancel",expectedVersion:number)=>raw<InvoiceContract>(`/invoices/${id}/${action}`,json("POST",{expectedVersion})),
  archiveInvoice:(id:string,expectedVersion:number)=>raw<InvoiceContract>(`/invoices/${id}`,json("DELETE",{expectedVersion})),
  payments:()=>raw<PaymentContract[]>("/payments"),
  createPayment:(body:unknown)=>raw<PaymentContract>("/payments",json("POST",body)),
  allocatePayment:(id:string,invoiceId:string,amount:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}/allocate`,json("POST",{invoiceId,amount,expectedVersion})),
  reversePayment:(id:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}/reverse`,json("POST",{expectedVersion})),
  archivePayment:(id:string,expectedVersion:number)=>raw<PaymentContract>(`/payments/${id}`,json("DELETE",{expectedVersion})),
  expenses:()=>raw<ExpenseContract[]>("/expenses"),
  createExpense:(body:unknown)=>raw<ExpenseContract>("/expenses",json("POST",body)),
  updateExpense:(id:string,body:unknown)=>raw<ExpenseContract>(`/expenses/${id}`,json("PATCH",body)),
  expenseAction:(id:string,action:"approve"|"reject",expectedVersion:number)=>raw<ExpenseContract>(`/expenses/${id}/${action}`,json("POST",{expectedVersion})),
  archiveExpense:(id:string,expectedVersion:number)=>raw<ExpenseContract>(`/expenses/${id}`,json("DELETE",{expectedVersion})),
  projectFinancialSummary:(id:string)=>raw<ProjectFinancialSummary>(`/projects/${id}/financial-summary`),
  documents:()=>raw<DocumentContract[]>("/documents"),
  uploadDocument:(file:File,meta:{category:string;description:string;entityType:string;entityId:string})=>{const body=new FormData();for(const [k,v] of Object.entries(meta))body.append(k,v);body.append("file",file);return raw<DocumentContract>("/documents",{method:"POST",body});},
  updateDocument:(id:string,body:unknown)=>raw<DocumentContract>(`/documents/${id}`,json("PATCH",body)),
  archiveDocument:(id:string,expectedVersion:number)=>raw<DocumentContract>(`/documents/${id}`,json("DELETE",{expectedVersion})),
  documentVersions:(id:string)=>raw<Array<ReturnType<typeof DocumentVersionSchema.parse>>>(`/documents/${id}/versions`),
  uploadDocumentVersion:(id:string,file:File,expectedVersion:number)=>{const body=new FormData();body.append("expectedVersion",String(expectedVersion));body.append("file",file);return raw<DocumentContract>(`/documents/${id}/versions`,{method:"POST",body});},
  downloadDocument:async(id:string,versionId?:string)=>{const headers=new Headers();if(session)headers.set("authorization",`Bearer ${session.accessToken}`);const response=await fetch(`${base}/documents/${id}${versionId?`/versions/${versionId}`:""}/download`,{headers});if(!response.ok)throw new ApiError(response.status,"REQUEST_FAILED");return {blob:await response.blob(),disposition:response.headers.get("content-disposition")};},
  logout:()=>session?raw<{revoked:boolean}>("/auth/logout",json("POST",{refreshToken:session.refreshToken})):Promise.resolve()
};
