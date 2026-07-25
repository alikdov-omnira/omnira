import {createHash} from "node:crypto";
import type {NotificationEventType,NotificationPreferences,NotificationSeverity} from "./notification-types.js";

const copy:Record<NotificationEventType,{title:string;body:string;severity:NotificationSeverity}>={
 "task.assigned":{title:"Task assigned",body:"A task was assigned to you.",severity:"info"},
 "task.due_soon":{title:"Task due soon",body:"A task assigned to you is due soon.",severity:"warning"},
 "task.overdue":{title:"Task overdue",body:"A task assigned to you is overdue.",severity:"critical"},
 "task.completed":{title:"Task completed",body:"A task you are responsible for was completed.",severity:"success"},
 "project.started":{title:"Project started",body:"A project you manage has started.",severity:"info"},
 "project.paused":{title:"Project paused",body:"A project you manage was paused.",severity:"warning"},
 "project.completed":{title:"Project completed",body:"A project you manage was completed.",severity:"success"},
 "invoice.issued":{title:"Invoice issued",body:"An invoice was issued.",severity:"info"},
 "invoice.due_soon":{title:"Invoice due soon",body:"An issued invoice is due soon.",severity:"warning"},
 "invoice.overdue":{title:"Invoice overdue",body:"An issued invoice is overdue.",severity:"critical"},
 "invoice.paid":{title:"Invoice paid",body:"An invoice was fully paid.",severity:"success"},
 "payment.received":{title:"Payment received",body:"A payment was received.",severity:"success"},
 "expense.approved":{title:"Expense approved",body:"An expense was approved.",severity:"success"},
 "expense.rejected":{title:"Expense rejected",body:"An expense was rejected.",severity:"warning"},
 "document.uploaded":{title:"Document uploaded",body:"A new document was uploaded.",severity:"info"},
 "document.version_created":{title:"Document version created",body:"A new document version was uploaded.",severity:"info"},
 "document.archived":{title:"Document archived",body:"A document was archived.",severity:"warning"}
};
export const notificationCopy=(eventType:NotificationEventType)=>copy[eventType];
export const deduplicationKey=(eventType:NotificationEventType,entityId:string,recipientId:string,windowKey="event")=>createHash("sha256").update(`${eventType}:${entityId}:${recipientId}:${windowKey}`).digest("hex");
export function preferenceAllows(p:NotificationPreferences,eventType:NotificationEventType,isActor:boolean){
 if(!p.inAppEnabled||isActor&&!p.selfNotificationsEnabled)return false;
 if(eventType.includes("due_soon")&&!p.dueSoonEnabled)return false;
 if(eventType.includes("overdue")&&!p.overdueEnabled)return false;
 if(eventType.startsWith("task."))return p.taskEventsEnabled;
 if(eventType.startsWith("project."))return p.projectEventsEnabled;
 if(["invoice","payment","expense"].some(x=>eventType.startsWith(`${x}.`)))return p.financeEventsEnabled;
 return p.documentEventsEnabled;
}
export const utcDate=(now:Date)=>now.toISOString().slice(0,10);
export const daysBetweenUtc=(from:string,to:string)=>Math.round((Date.parse(`${to}T00:00:00Z`)-Date.parse(`${from}T00:00:00Z`))/86_400_000);
export const reminderKind=(dueDate:string,now:Date,dueSoonDays:number):"due_soon"|"overdue"|undefined=>{const days=daysBetweenUtc(utcDate(now),dueDate);return days<0?"overdue":days<=dueSoonDays?"due_soon":undefined;};
export const retryDecision=(previousAttempts:number,maxAttempts:number,now:Date)=>{const attemptCount=previousAttempts+1;return {attemptCount,deadLetter:attemptCount>=maxAttempts,nextAttemptAt:new Date(now.getTime()+Math.min(60_000,1000*2**attemptCount))};};
