import {domainErrors} from "../domain/errors.js";
export type NotificationActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export const assertCanReadNotifications=(actor:NotificationActor)=>{if(!actor.permissions.includes("notifications.read"))throw domainErrors.forbidden();};
export const assertCanUpdateNotifications=(actor:NotificationActor)=>{if(!actor.permissions.includes("notifications.update"))throw domainErrors.forbidden();};
export const assertCanManageNotifications=(actor:NotificationActor)=>{if(!actor.permissions.includes("notifications.manage"))throw domainErrors.forbidden();};
