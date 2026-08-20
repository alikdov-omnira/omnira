import {describe,expect,it} from "vitest";
import {assertCanArchiveTask,assertCanAssignTask,assertCanCreateTask,assertCanReadTask,assertCanTransitionTask,assertCanUpdateTask} from "../src/authorization/task-policy.js";
import {DomainError} from "../src/domain/errors.js";
import {assertDueDateWithinProject,normalizeReviewComment,normalizeTask,normalizeTaskUpdate,taskLifecycleTransition} from "../src/domain/task/task-rules.js";
import {TaskService} from "../src/application/task/task-service.js";

const valid={projectId:"project",title:" Inspect roof ",description:" Before rain ",priority:"high" as const,dueDate:"2026-08-01"};
describe("Task rules",()=>{
  it("normalizes a valid task",()=>expect(normalizeTask(valid)).toMatchObject({title:"Inspect roof",description:"Before rain",priority:"high"}));
  it("rejects missing title",()=>expect(()=>normalizeTask({...valid,title:" "})).toThrow(DomainError));
  it("rejects invalid priority",()=>expect(()=>normalizeTask({...valid,priority:"critical" as never})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects invalid due dates",()=>expect(()=>normalizeTask({...valid,dueDate:"01-08-2026"})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("requires positive expectedVersion",()=>expect(()=>normalizeTaskUpdate({expectedVersion:0})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects lifecycle fields in generic update",()=>expect(()=>normalizeTaskUpdate({expectedVersion:1,status:"completed"} as never)).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("enforces Project start boundary",()=>expect(()=>assertDueDateWithinProject("2026-06-30","2026-07-01","2026-12-31")).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("enforces Project completion boundary",()=>expect(()=>assertDueDateWithinProject("2027-01-01","2026-07-01","2026-12-31")).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
});
describe("Task lifecycle",()=>{
  it("starts todo",()=>expect(taskLifecycleTransition("start","todo")).toBe("in_progress"));
  it("blocks and resumes work",()=>{expect(taskLifecycleTransition("block","in_progress")).toBe("blocked");expect(taskLifecycleTransition("resume","blocked")).toBe("in_progress");});
  it("completes in-progress work",()=>expect(taskLifecycleTransition("complete","in_progress")).toBe("completed"));
  it("submits, returns, restarts and accepts assigned work",()=>{expect(taskLifecycleTransition("submit","in_progress")).toBe("submitted_for_review");expect(taskLifecycleTransition("return","submitted_for_review")).toBe("returned");expect(taskLifecycleTransition("start","returned")).toBe("in_progress");expect(taskLifecycleTransition("accept","submitted_for_review")).toBe("accepted")});
  it("requires a bounded human return comment",()=>{expect(normalizeReviewComment("return"," Fix the edge ")).toBe("Fix the edge");expect(()=>normalizeReviewComment("return"," ")).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"}))});
  it("cancels mutable work",()=>expect(taskLifecycleTransition("cancel","blocked")).toBe("cancelled"));
  it("rejects terminal transitions",()=>expect(()=>taskLifecycleTransition("start","completed")).toThrowError(expect.objectContaining({code:"INVALID_STATUS_TRANSITION"})));
});
describe("Task permission policy",()=>{
  const full={permissions:["tasks.read","tasks.create","tasks.update","tasks.assign","tasks.delete"]};
  it("allows granted operations",()=>{for(const check of [assertCanReadTask,assertCanCreateTask,assertCanUpdateTask,assertCanTransitionTask,assertCanAssignTask,assertCanArchiveTask])expect(()=>check(full)).not.toThrow();});
  it("requires both update and assign permissions",()=>expect(()=>assertCanAssignTask({permissions:["tasks.assign"]})).toThrowError(expect.objectContaining({code:"FORBIDDEN"})));
  it("denies read-only mutations",()=>{for(const check of [assertCanCreateTask,assertCanUpdateTask,assertCanTransitionTask,assertCanAssignTask,assertCanArchiveTask])expect(()=>check({permissions:["tasks.read"]})).toThrowError(expect.objectContaining({code:"FORBIDDEN"}));});
});
describe("Task transaction and audit",()=>{
  const actor={id:"actor",tenantId:"tenant",permissions:["tasks.create"],correlationId:"44444444-4444-4444-8444-444444444444"};
  const entity={id:"task",tenantId:"tenant",projectId:"project",title:"Task",description:null,status:"todo",priority:"normal",dueDate:null,startedAt:null,completedAt:null,isOverdue:false,assignees:[],version:1,createdAt:"now",updatedAt:"now",archivedAt:null};
  function harness(failAudit=false){const statements:string[]=[];const connection={query:async(sql:string)=>{statements.push(sql);if(failAudit&&sql.startsWith("INSERT INTO audit_logs"))throw new Error("audit unavailable");return {rows:[],rowCount:1};},release:()=>undefined};const pool={connect:async()=>connection};const repository={findProject:async()=>({id:"project",status:"active",startDate:null,expectedCompletionDate:null,archivedAt:null}),create:async(db:{query:(sql:string)=>Promise<unknown>})=>{await db.query("TASK_MUTATION");return entity;}};return {statements,service:new TaskService(pool as never,repository as never)};}
  it("commits mutation and mandatory audit in one transaction",async()=>{const {service,statements}=harness();await expect(service.createTask(actor,{projectId:"project",title:"Task"})).resolves.toMatchObject({id:"task"});expect(statements.indexOf("TASK_MUTATION")).toBeGreaterThan(statements.indexOf("BEGIN"));expect(statements.findIndex(sql=>sql.startsWith("INSERT INTO audit_logs"))).toBeGreaterThan(statements.indexOf("TASK_MUTATION"));expect(statements.at(-1)).toBe("COMMIT");});
  it("rolls back when mandatory audit insertion fails",async()=>{const {service,statements}=harness(true);await expect(service.createTask(actor,{projectId:"project",title:"Task"})).rejects.toThrow("audit unavailable");expect(statements).toContain("TASK_MUTATION");expect(statements.at(-1)).toBe("ROLLBACK");expect(statements).not.toContain("COMMIT");});
});
