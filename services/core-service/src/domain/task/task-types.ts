export type TaskStatus="todo"|"in_progress"|"blocked"|"submitted_for_review"|"accepted"|"returned"|"completed"|"cancelled"|"archived";
export type TaskPriority="low"|"normal"|"high"|"urgent";
export interface TaskAssignee {userId:string;displayName:string;assignedAt:string;}
export interface Task {
  id:string;tenantId:string;projectId:string;title:string;description:string|null;status:TaskStatus;
  priority:TaskPriority;dueDate:string|null;startedAt:string|null;completedAt:string|null;isOverdue:boolean;
  assignees:TaskAssignee[];lastReview?:TaskReviewEvent|null;version:number;createdAt:string;updatedAt:string;archivedAt:string|null;
}
export interface TaskReviewEvent {id:string;action:"submitted_for_review"|"accepted"|"returned";comment:string|null;taskVersion:number;createdAt:string;createdBy:string;}
export interface CreateTaskCommand {projectId:string;title:string;description?:string;priority?:TaskPriority;dueDate?:string;}
export interface UpdateTaskCommand {expectedVersion:number;projectId?:string;title?:string;description?:string|null;priority?:TaskPriority;dueDate?:string|null;}
export type TaskSortField="title"|"status"|"priority"|"dueDate"|"createdAt"|"updatedAt";
export interface TaskListQuery {
  page:number;pageSize:number;search?:string;status?:TaskStatus;priority?:TaskPriority;projectId?:string;
  propertyId?:string;clientId?:string;assigneeId?:string;overdue?:boolean;sortBy:TaskSortField;sortOrder:"asc"|"desc";
}
export interface TaskListResult {items:Task[];pagination:{page:number;pageSize:number;total:number;totalPages:number};}
export type TaskLifecycleAction="start"|"block"|"resume"|"submit"|"accept"|"return"|"complete"|"cancel";
