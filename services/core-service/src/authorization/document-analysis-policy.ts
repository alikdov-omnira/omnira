import {domainErrors} from "../domain/errors.js";import type {DocumentActor} from "./document-policy.js";
export type AnalysisPermission="request"|"read"|"retry"|"cancel";
export function requireAnalysis(actor:DocumentActor,permission:AnalysisPermission){if(!actor.permissions.includes(`documents.analysis.${permission}`))throw domainErrors.forbidden();}
