import {domainErrors} from "../domain/errors.js";
export type DocumentActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export function requireDocument(actor:DocumentActor,permission:"read"|"create"|"update"|"delete"){if(!actor.permissions.includes(`documents.${permission}`))throw domainErrors.forbidden();}
