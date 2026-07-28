import{domainErrors}from"../domain/errors.js";
export type RoomScanActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export function requireRoomScan(actor:RoomScanActor,permission:"create"|"read"|"capture"|"edit"|"review"|"approve"|"cancel"|"quantities.read"){if(!actor.permissions.includes(`room_scans.${permission}`))throw domainErrors.forbidden();}
