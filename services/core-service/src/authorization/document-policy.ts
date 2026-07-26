import {domainErrors} from "../domain/errors.js";
export type DocumentActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export function requireDocument(actor:DocumentActor,permission:"read"|"upload"|"download"|"update"|"delete"|"process"){
 const accepted=permission==="upload"?["documents.upload","documents.create"]:permission==="download"?["documents.download","documents.read"]:[`documents.${permission}`];
 if(!accepted.some(code=>actor.permissions.includes(code)))throw domainErrors.forbidden();
}
