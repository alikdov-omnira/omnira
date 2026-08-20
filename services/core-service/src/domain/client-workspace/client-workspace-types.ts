export type ClientRequestType="question"|"issue"|"change"|"meeting"|"document"|"clarification";
export type ClientRequestStatus="submitted"|"in_review"|"clarification_required"|"responded"|"approved"|"rejected"|"closed";
export type ClientDecision="approved"|"rejected"|"clarification_requested";
export interface CreateClientRequest{projectId:string;requestType:ClientRequestType;subject:string;description:string;}
export interface ClientRequest{id:string;tenantId:string;clientId:string;projectId:string;authorId:string;responsibleUserId:string|null;requestType:ClientRequestType;subject:string;description:string;status:ClientRequestStatus;response:string|null;version:number;createdAt:string;updatedAt:string;}
export interface ClientApproval{id:string;tenantId:string;clientId:string;projectId:string;entityType:"commercial_estimate_snapshot"|"document"|"client_request";entityId:string;title:string;summary:string|null;status:"pending"|ClientDecision;decisionComment:string|null;version:number;createdAt:string;}
