import { describe,expect,it } from "vitest";
import { normalizeClient,normalizeClientUpdate } from "../src/domain/client/client-rules.js";
import { assertCanArchiveClient,assertCanCreateClient,assertCanReadClient,assertCanUpdateClient } from "../src/authorization/client-policy.js";
import { DomainError } from "../src/domain/errors.js";
describe("Client rules",()=>{
  it("normalizes a valid individual",()=>expect(normalizeClient({name:" Ada ",clientType:"individual",email:" ADA@EXAMPLE.COM ",phone:" +48 123 "})).toMatchObject({name:"Ada",email:"ada@example.com",phone:"+48 123"}));
  it("accepts company fields",()=>expect(normalizeClient({name:"Acme",clientType:"company",legalName:"Acme Ltd",taxId:" PL123 "}).taxId).toBe("PL123"));
  it("rejects missing name",()=>expect(()=>normalizeClient({name:""})).toThrow(DomainError));
  it("rejects invalid type",()=>expect(()=>normalizeClient({name:"A",clientType:"invalid" as never})).toThrow(DomainError));
  it("rejects invalid email",()=>expect(()=>normalizeClient({name:"A",email:"broken"})).toThrow(DomainError));
  it("requires a positive expectedVersion",()=>expect(()=>normalizeClientUpdate({expectedVersion:0})).toThrow(DomainError));
});
describe("Client permission policy",()=>{
  const full={permissions:["clients.read","clients.create","clients.update","clients.delete"]};
  it("allows granted operations",()=>{expect(()=>assertCanReadClient(full)).not.toThrow();expect(()=>assertCanCreateClient(full)).not.toThrow();expect(()=>assertCanUpdateClient(full)).not.toThrow();expect(()=>assertCanArchiveClient(full)).not.toThrow();});
  it("denies mutation without permission",()=>{for(const check of [assertCanCreateClient,assertCanUpdateClient,assertCanArchiveClient])expect(()=>check({permissions:["clients.read"]})).toThrowError(expect.objectContaining({code:"FORBIDDEN"}));});
});
