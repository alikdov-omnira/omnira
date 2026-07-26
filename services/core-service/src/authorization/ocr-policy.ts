import {domainErrors} from "../domain/errors.js";
import type {DocumentActor} from "./document-policy.js";
export type OcrPermission="request"|"read"|"retry"|"cancel";
export function requireOcr(actor:DocumentActor,permission:OcrPermission){if(!actor.permissions.includes(`documents.ocr.${permission}`))throw domainErrors.forbidden();}
