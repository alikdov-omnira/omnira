import {domainErrors} from "../errors.js";
import type {CreateTaskCommand,TaskLifecycleAction,TaskPriority,TaskStatus,UpdateTaskCommand} from "./task-types.js";

const priorities:TaskPriority[]=["low","normal","high","urgent"];
const text=(value:string,name:string)=>{const normalized=value?.trim();if(!normalized)throw domainErrors.validation(`${name} is required`);return normalized;};
const date=(value:string|null|undefined)=>{if(value!==undefined&&value!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(value))throw domainErrors.validation("dueDate must use YYYY-MM-DD");return value;};
export function normalizeTask(command:CreateTaskCommand):CreateTaskCommand {
  if(command.priority&&!priorities.includes(command.priority))throw domainErrors.validation("Invalid task priority");
  return {...command,projectId:text(command.projectId,"projectId"),title:text(command.title,"Task title"),description:command.description?.trim()||undefined,dueDate:date(command.dueDate)??undefined};
}
export function normalizeTaskUpdate(command:UpdateTaskCommand):UpdateTaskCommand {
  if(!Number.isInteger(command.expectedVersion)||command.expectedVersion<1)throw domainErrors.validation("expectedVersion must be a positive integer");
  if("status" in command||"startedAt" in command||"completedAt" in command)throw domainErrors.validation("Use a lifecycle operation to change task status");
  if(command.priority!==undefined&&!priorities.includes(command.priority))throw domainErrors.validation("Invalid task priority");
  const value={...command};if(command.projectId!==undefined)value.projectId=text(command.projectId,"projectId");if(command.title!==undefined)value.title=text(command.title,"Task title");if(command.description!==undefined)value.description=command.description?.trim()||null;if(command.dueDate!==undefined)value.dueDate=date(command.dueDate);return value;
}
const transitions:Record<TaskLifecycleAction,{from:TaskStatus[];to:TaskStatus}>={
  start:{from:["todo","returned"],to:"in_progress"},block:{from:["todo","in_progress","returned"],to:"blocked"},
  resume:{from:["blocked"],to:"in_progress"},complete:{from:["in_progress"],to:"completed"},
  submit:{from:["in_progress","returned"],to:"submitted_for_review"},accept:{from:["submitted_for_review"],to:"accepted"},return:{from:["submitted_for_review"],to:"returned"},
  cancel:{from:["todo","in_progress","blocked"],to:"cancelled"}
};
export function taskLifecycleTransition(action:TaskLifecycleAction,current:TaskStatus):TaskStatus {const transition=transitions[action];if(!transition.from.includes(current))throw domainErrors.transition();return transition.to;}
export function normalizeReviewComment(action:TaskLifecycleAction,value?:string){const comment=value?.trim()||null;if(comment&&comment.length>2000)throw domainErrors.validation("Review comment must not exceed 2000 characters");if(action==="return"&&!comment)throw domainErrors.validation("A return comment is required");return comment;}
export function assertDueDateWithinProject(dueDate:string|null|undefined,startDate:string|null,expectedCompletionDate:string|null){if(!dueDate)return;if(startDate&&dueDate<startDate)throw domainErrors.validation("dueDate cannot be before the Project start date");if(expectedCompletionDate&&dueDate>expectedCompletionDate)throw domainErrors.validation("dueDate cannot be after the Project expected completion date");}
