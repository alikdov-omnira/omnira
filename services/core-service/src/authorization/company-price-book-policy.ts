import{domainErrors}from"../domain/errors.js";
export type CompanyPriceBookActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string;actorType?:"human"|"ai"|"system"};
export type CompanyPriceBookPermission="create"|"read"|"edit"|"review"|"approve"|"snapshots.read";
export function requireCompanyPriceBook(actor:CompanyPriceBookActor,permission:CompanyPriceBookPermission){if(!actor.permissions.includes(`company_price_books.${permission}`))throw domainErrors.forbidden();if(["create","edit","review","approve"].includes(permission)&&actor.actorType!=="human")throw domainErrors.forbidden()}
