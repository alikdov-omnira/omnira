import{domainErrors}from"../domain/errors.js";import type{DocumentActor}from"./document-policy.js";
export type ReviewPermission="start"|"read"|"edit"|"assign"|"submit"|"approve"|"reject";export type SuggestionPermission="request"|"read"|"decide";
export function requireReview(a:DocumentActor,p:ReviewPermission){if(!a.permissions.includes(`documents.review.${p}`))throw domainErrors.forbidden();}
export function requireSuggestion(a:DocumentActor,p:SuggestionPermission){if(!a.permissions.includes(`documents.suggestions.${p}`))throw domainErrors.forbidden();}
