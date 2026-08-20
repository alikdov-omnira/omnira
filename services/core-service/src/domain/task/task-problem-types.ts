export type TaskProblemCategory="missing_material"|"blocker"|"defect"|"damage"|"unsafe_condition"|"needs_foreman_answer"|"other";
export type TaskProblemStatus="open"|"acknowledged"|"resolved";
export interface TaskProblem{id:string;tenantId:string;projectId:string;taskId:string;category:TaskProblemCategory;description:string;location:string|null;status:TaskProblemStatus;version:number;createdAt:string;createdBy:string;updatedAt:string;updatedBy:string;}
export interface CreateTaskProblem{category:TaskProblemCategory;description:string;location?:string;}
