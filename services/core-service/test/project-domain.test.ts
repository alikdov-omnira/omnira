import {describe,expect,it} from "vitest";
import {assertCanArchiveProject,assertCanCreateProject,assertCanReadProject,assertCanTransitionProject,assertCanUpdateProject} from "../src/authorization/project-policy.js";
import {DomainError} from "../src/domain/errors.js";
import {lifecycleTransition,normalizeProject,normalizeProjectUpdate} from "../src/domain/project/project-rules.js";

const valid={clientId:"client",propertyId:"property",financialOwnerLegalEntityId:"legal",projectNumber:" PRJ-1 ",name:" Project One ",currencyCode:"eur",estimatedBudget:100,startDate:"2026-07-01",expectedCompletionDate:"2026-08-01"};
describe("Project rules",()=>{
  it("normalizes a valid project",()=>expect(normalizeProject(valid)).toMatchObject({projectNumber:"PRJ-1",name:"Project One",currencyCode:"EUR"}));
  it("rejects missing names",()=>expect(()=>normalizeProject({...valid,name:" "})).toThrow(DomainError));
  it("rejects invalid currency codes",()=>expect(()=>normalizeProject({...valid,currencyCode:"EU"})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects negative amounts",()=>expect(()=>normalizeProject({...valid,estimatedBudget:-1})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects completion before start",()=>expect(()=>normalizeProject({...valid,expectedCompletionDate:"2026-06-30"})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("requires a positive expectedVersion",()=>expect(()=>normalizeProjectUpdate({expectedVersion:0})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects status in generic update",()=>expect(()=>normalizeProjectUpdate({expectedVersion:1,status:"active"} as never)).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
});
describe("Project lifecycle",()=>{
  it("plans a draft project",()=>expect(lifecycleTransition("plan","draft")).toBe("planned"));
  it("starts a planned project",()=>expect(lifecycleTransition("start","planned")).toBe("active"));
  it("pauses and resumes an active project",()=>{expect(lifecycleTransition("pause","active")).toBe("paused");expect(lifecycleTransition("resume","paused")).toBe("active");});
  it("completes an active project",()=>expect(lifecycleTransition("complete","active")).toBe("completed"));
  it("cancels a mutable project",()=>expect(lifecycleTransition("cancel","paused")).toBe("cancelled"));
  it("rejects invalid transitions",()=>expect(()=>lifecycleTransition("complete","draft")).toThrowError(expect.objectContaining({code:"INVALID_STATUS_TRANSITION"})));
});
describe("Project permission policy",()=>{
  const full={permissions:["projects.read","projects.create","projects.update","projects.delete"]};
  it("allows granted operations",()=>{for(const check of [assertCanReadProject,assertCanCreateProject,assertCanUpdateProject,assertCanArchiveProject,assertCanTransitionProject])expect(()=>check(full)).not.toThrow();});
  it("denies mutations without permission",()=>{for(const check of [assertCanCreateProject,assertCanUpdateProject,assertCanArchiveProject,assertCanTransitionProject])expect(()=>check({permissions:["projects.read"]})).toThrowError(expect.objectContaining({code:"FORBIDDEN"}));});
});
