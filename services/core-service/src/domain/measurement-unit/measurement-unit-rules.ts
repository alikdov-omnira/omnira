import {DomainError,domainErrors} from "../errors.js";
import type {CreateMeasurementUnit,MeasurementUnit,UpdateMeasurementUnit} from "./measurement-unit-types.js";
const decimal=/^(0|[1-9]\d{0,17})(\.\d{1,15})?$/;
export const normalizeCode=(value:string)=>value.trim().toUpperCase();
export function validateCreate(input:CreateMeasurementUnit):CreateMeasurementUnit{
 const code=normalizeCode(input.code),base=input.baseMultiplier,canonical=input.canonicalBaseCode?normalizeCode(input.canonicalBaseCode):undefined;
 if(!/^[A-Z][A-Z0-9_]{0,39}$/.test(code))throw domainErrors.validation("Unit code must be a stable uppercase identifier");
 if(!Number.isInteger(input.decimalPrecision)||input.decimalPrecision<0||input.decimalPrecision>12)throw domainErrors.validation("decimalPrecision must be between 0 and 12");
 if((base===undefined)!==(canonical===undefined))throw domainErrors.validation("canonicalBaseCode and baseMultiplier must be supplied together");
 if(base!==undefined&&(!decimal.test(base)||/^0(?:\.0+)?$/.test(base)))throw domainErrors.validation("baseMultiplier must be a positive decimal");
 return {...input,code,canonicalBaseCode:canonical};
}
export function validateUpdate(input:UpdateMeasurementUnit){
 if(input.decimalPrecision!==undefined&&(!Number.isInteger(input.decimalPrecision)||input.decimalPrecision<0||input.decimalPrecision>12))throw domainErrors.validation("decimalPrecision must be between 0 and 12");
 if(input.baseMultiplier!==undefined&&input.baseMultiplier!==null&&(!decimal.test(input.baseMultiplier)||/^0(?:\.0+)?$/.test(input.baseMultiplier)))throw domainErrors.validation("baseMultiplier must be a positive decimal");
 if((input.baseMultiplier===null)!==(input.canonicalBaseCode===null))throw domainErrors.validation("Conversion metadata must be cleared together");
 return {...input,canonicalBaseCode:typeof input.canonicalBaseCode==="string"?normalizeCode(input.canonicalBaseCode):input.canonicalBaseCode};
}
export function assertConvertible(from:MeasurementUnit,to:MeasurementUnit,quantity:string){
 if(!decimal.test(quantity)||/^0(?:\.0+)?$/.test(quantity))throw domainErrors.validation("quantity must be a positive decimal");
 if(from.status!=="active"||to.status!=="active")throw domainErrors.validation("Both units must be active");
 if(from.dimension!==to.dimension)throw new DomainError("INVALID_RELATIONSHIP",422,"Units have incompatible dimensions");
 if(!from.baseMultiplier||!to.baseMultiplier||!from.canonicalBaseCode||from.canonicalBaseCode!==to.canonicalBaseCode)throw domainErrors.validation("Unit is not convertible");
}
