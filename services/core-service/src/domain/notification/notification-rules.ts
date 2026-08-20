import {createHash} from "node:crypto";
import type {NotificationEventType,NotificationPreferences,NotificationSeverity} from "./notification-types.js";

const copy:Record<NotificationEventType,{title:string;body:string;severity:NotificationSeverity}>={
 "task.assigned":{title:"Task assigned",body:"A task was assigned to you.",severity:"info"},
 "task.due_soon":{title:"Task due soon",body:"A task assigned to you is due soon.",severity:"warning"},
 "task.overdue":{title:"Task overdue",body:"A task assigned to you is overdue.",severity:"critical"},
 "task.started":{title:"Task started",body:"Assigned work was started.",severity:"info"},
 "task.blocked":{title:"Task blocked",body:"Assigned work was blocked.",severity:"warning"},
 "task.resumed":{title:"Task resumed",body:"Assigned work resumed.",severity:"info"},
 "task.submitted_for_review":{title:"Work ready for review",body:"A worker submitted task evidence for human review.",severity:"info"},
 "task.accepted":{title:"Work accepted",body:"The foreman accepted submitted work.",severity:"success"},
 "task.returned":{title:"Work returned",body:"The foreman returned submitted work with a comment.",severity:"warning"},
 "task.completed":{title:"Task completed",body:"A task you are responsible for was completed.",severity:"success"},
 "task.cancelled":{title:"Task cancelled",body:"An assigned task was cancelled.",severity:"warning"},
 "task.problem_reported":{title:"Field problem reported",body:"A worker reported a problem on an assigned task.",severity:"warning"},
 "task.problem_acknowledged":{title:"Field problem acknowledged",body:"A reported task problem was acknowledged.",severity:"info"},
 "task.problem_resolved":{title:"Field problem resolved",body:"A reported task problem was resolved.",severity:"success"},
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
 "document.archived":{title:"Document archived",body:"A document was archived.",severity:"warning"},
 "document.page_ocr_requested":{title:"OCR requested",body:"Text recognition was requested for a document page.",severity:"info"},
 "document.page_ocr_started":{title:"OCR started",body:"Text recognition started for a document page.",severity:"info"},
 "document.page_ocr_completed":{title:"OCR completed",body:"Text recognition completed for a document page.",severity:"success"},
 "document.page_ocr_failed":{title:"OCR failed",body:"Text recognition failed for a document page.",severity:"warning"},
 "document.page_ocr_retried":{title:"OCR retried",body:"Text recognition was queued for retry.",severity:"info"},
 "document.page_ocr_cancelled":{title:"OCR cancelled",body:"Text recognition was cancelled.",severity:"warning"},
 "document.analysis_requested":{title:"Analysis requested",body:"Document analysis was requested.",severity:"info"},
 "document.analysis_started":{title:"Analysis started",body:"Document analysis started.",severity:"info"},
 "document.classified":{title:"Document classified",body:"Document classification completed.",severity:"success"},
 "document.extraction_completed":{title:"Extraction completed",body:"Structured extraction completed.",severity:"success"},
 "document.analysis_failed":{title:"Analysis failed",body:"Document analysis failed.",severity:"warning"},
 "document.analysis_retried":{title:"Analysis retried",body:"Document analysis was queued for retry.",severity:"info"},
 "document.analysis_cancelled":{title:"Analysis cancelled",body:"Document analysis was cancelled.",severity:"warning"},
 "document.review_started":{title:"Review started",body:"Manual document review started.",severity:"info"},
 "document.review_assigned":{title:"Review assigned",body:"A document review was assigned.",severity:"info"},
 "document.review_field_changed":{title:"Review updated",body:"A reviewed document field was changed.",severity:"info"},
 "document.review_classification_changed":{title:"Classification updated",body:"The reviewed document classification was changed.",severity:"info"},
 "document.review_submitted":{title:"Review submitted",body:"A document review is ready for a decision.",severity:"info"},
 "document.review_changes_requested":{title:"Review changes requested",body:"Changes were requested for a document review.",severity:"warning"},
 "document.review_approved":{title:"Review approved",body:"Reviewed document data was approved.",severity:"success"},
 "document.review_rejected":{title:"Review rejected",body:"A document review was rejected.",severity:"warning"},
 "document.suggestions_requested":{title:"Suggestions requested",body:"Document review suggestions were requested.",severity:"info"},
 "document.suggestion_created":{title:"Suggestion created",body:"A document review suggestion was created.",severity:"info"},
 "document.suggestion_accepted":{title:"Suggestion accepted",body:"A document review suggestion was accepted.",severity:"success"},
 "document.suggestion_rejected":{title:"Suggestion rejected",body:"A document review suggestion was rejected.",severity:"warning"},
 "document.suggestion_request_created":{title:"AI review queued",body:"Document suggestions were queued.",severity:"info"},
 "document.suggestion_request_started":{title:"AI review started",body:"Document suggestion processing started.",severity:"info"},
 "document.suggestion_request_completed":{title:"AI review completed",body:"Document suggestions are ready for review.",severity:"success"},
 "document.suggestion_request_failed":{title:"AI review failed",body:"Document suggestion processing failed safely.",severity:"warning"},
 "document.suggestion_request_cancelled":{title:"AI review cancelled",body:"Document suggestion processing was cancelled.",severity:"warning"},
 "document.suggestion_request_stale":{title:"AI review stale",body:"Document suggestions were discarded because the review changed.",severity:"warning"},
 "room_scan.review_required":{title:"Room scan review required",body:"A room scan is ready for human review.",severity:"info"},
 "room_scan.approved":{title:"Room scan approved",body:"A room scan snapshot was approved.",severity:"success"},
 "room_scan.rejected":{title:"Room scan rejected",body:"A room scan was rejected.",severity:"warning"},
 "room_scan.quantities_ready":{title:"Room quantities ready",body:"Room scan quantities were calculated.",severity:"success"},
 "technical_assignment.created":{title:"Technical assignment created",body:"A technical assignment was created.",severity:"info"},
 "technical_assignment.lifecycle_changed":{title:"Technical assignment updated",body:"The technical assignment lifecycle changed.",severity:"info"},
 "technical_assignment.statement_changed":{title:"Technical assignment updated",body:"Technical assignment content changed.",severity:"info"},
 "technical_assignment.statement_reviewed":{title:"Statement reviewed",body:"A technical assignment statement was reviewed.",severity:"info"},
 "technical_assignment.open_item_changed":{title:"Open item updated",body:"A technical assignment open item changed.",severity:"info"},
 "technical_assignment.readiness_requested":{title:"Technical assignment ready",body:"A technical assignment is ready for approval.",severity:"info"},
 "technical_assignment.approved":{title:"Technical assignment approved",body:"A technical assignment snapshot was approved.",severity:"success"},
 "technical_assignment.cancelled":{title:"Technical assignment cancelled",body:"A technical assignment was cancelled.",severity:"warning"},
 "technical_assignment.revision_created":{title:"Technical assignment revised",body:"A successor technical assignment revision was created.",severity:"info"},
 "design_project.created":{title:"Design project created",body:"A design project was created.",severity:"info"},
 "design_project.lifecycle_changed":{title:"Design project updated",body:"The design lifecycle changed.",severity:"info"},
 "design_project.decision_changed":{title:"Design decision updated",body:"A design decision changed.",severity:"info"},
 "design_project.decision_reviewed":{title:"Design decision reviewed",body:"A design decision was reviewed.",severity:"info"},
 "design_project.open_item_changed":{title:"Design open item updated",body:"A design open item changed.",severity:"info"},
 "design_project.reference_added":{title:"Design reference added",body:"A design reference was added.",severity:"info"},
 "design_project.readiness_requested":{title:"Design ready",body:"A design project is ready for approval.",severity:"info"},
 "design_project.approved":{title:"Design approved",body:"A design project snapshot was approved.",severity:"success"},
 "design_project.cancelled":{title:"Design cancelled",body:"A design project was cancelled.",severity:"warning"},
 "design_project.revision_created":{title:"Design revised",body:"A successor design revision was created.",severity:"info"}
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
