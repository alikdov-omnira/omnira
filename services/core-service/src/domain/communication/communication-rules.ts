import{domainErrors}from"../errors.js";import type{MessageStatus}from"./communication-types.js";
const transitions:Record<MessageStatus,readonly MessageStatus[]>={DRAFT:["READY_FOR_REVIEW"],READY_FOR_REVIEW:["DRAFT","APPROVED_TO_SEND"],APPROVED_TO_SEND:["SENT","FAILED"],SENT:["DELIVERED","FAILED"],DELIVERED:[],FAILED:[]};
export function assertTransition(from:MessageStatus,to:MessageStatus){if(!transitions[from].includes(to))throw domainErrors.transition()}
export function assertVersion(actual:number,expected:number){if(actual!==expected)throw domainErrors.conflict()}
export function assertExternalAddress(address?:string){if(!address?.trim())throw domainErrors.validation("A resolved external recipient is required")}
export function assertNoAudio(payload:Record<string,unknown>){if("audio"in payload||"audioUrl"in payload||"recording"in payload)throw domainErrors.validation("Voice audio is ephemeral and cannot be stored")}
