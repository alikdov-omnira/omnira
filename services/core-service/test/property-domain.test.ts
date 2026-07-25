import { describe,expect,it } from "vitest";
import { normalizeProperty,normalizePropertyUpdate } from "../src/domain/property/property-rules.js";
import { assertCanArchiveProperty,assertCanCreateProperty,assertCanReadProperty,assertCanUpdateProperty } from "../src/authorization/property-policy.js";
import { DomainError } from "../src/domain/errors.js";

describe("Property rules",()=>{
  const valid={clientId:"client-id",name:" Building A ",propertyType:" office ",address:{line1:" Main 1 ",city:" Warsaw ",postalCode:" 00-001 ",countryCode:" pl "}};
  it("normalizes property and address",()=>expect(normalizeProperty(valid)).toMatchObject({name:"Building A",propertyType:"office",address:{line1:"Main 1",city:"Warsaw",postalCode:"00-001",countryCode:"PL"}}));
  it("rejects missing property name",()=>expect(()=>normalizeProperty({...valid,name:" "})).toThrow(DomainError));
  it("rejects missing address",()=>expect(()=>normalizeProperty({...valid,address:undefined as never})).toThrow(DomainError));
  it("rejects invalid country code",()=>expect(()=>normalizeProperty({...valid,address:{...valid.address,countryCode:"POL"}})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("rejects archived status on creation",()=>expect(()=>normalizeProperty({...valid,status:"archived" as never})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("requires a positive expectedVersion",()=>expect(()=>normalizePropertyUpdate({expectedVersion:0})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("requires the archive operation for archived status",()=>expect(()=>normalizePropertyUpdate({expectedVersion:1,status:"archived"})).toThrowError(expect.objectContaining({code:"VALIDATION_ERROR"})));
  it("normalizes a partial address update",()=>expect(normalizePropertyUpdate({expectedVersion:2,address:{countryCode:"de",postalCode:" "}})).toMatchObject({address:{countryCode:"DE",postalCode:null}}));
});
describe("Property permission policy",()=>{
  const full={permissions:["properties.read","properties.create","properties.update","properties.delete"]};
  it("allows granted operations",()=>{expect(()=>assertCanReadProperty(full)).not.toThrow();expect(()=>assertCanCreateProperty(full)).not.toThrow();expect(()=>assertCanUpdateProperty(full)).not.toThrow();expect(()=>assertCanArchiveProperty(full)).not.toThrow();});
  it("denies mutation without permission",()=>{for(const check of [assertCanCreateProperty,assertCanUpdateProperty,assertCanArchiveProperty])expect(()=>check({permissions:["properties.read"]})).toThrowError(expect.objectContaining({code:"FORBIDDEN"}));});
});
