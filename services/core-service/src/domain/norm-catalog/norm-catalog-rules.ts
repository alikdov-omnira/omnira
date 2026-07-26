import {domainErrors} from "../errors.js";
const codePattern=/^[A-Z][A-Z0-9_]{0,59}$/;
const text=(v:string,n:string,max:number)=>{const x=v.trim();if(!x)throw domainErrors.validation(`${n} is required`);if(x.length>max)throw domainErrors.validation(`${n} must not exceed ${max} characters`);return x;};
const optional=(v:string|null|undefined,n:string,max:number)=>{if(v==null)return v;const x=v.trim();if(!x)return null;if(x.length>max)throw domainErrors.validation(`${n} must not exceed ${max} characters`);return x;};
const decimal=(v:string,n:string,max:number,positive=false)=>{if(!/^\d+(\.\d{1,6})?$/.test(v)||Number(v)>max||(positive?Number(v)<=0:Number(v)<0))throw domainErrors.validation(`${n} must be ${positive?"greater than zero and ":""}at most ${max}`);return Number(v).toFixed(positive?6:4);};
export const validateNormCreate=(x:any)=>{const code=x.code.trim().toUpperCase();if(!codePattern.test(code))throw domainErrors.validation("Code must be a stable uppercase identifier");return {...x,code,displayName:text(x.displayName,"Display name",300),description:optional(x.description,"Description",5000)??undefined};};
export const validateNormUpdate=(x:any)=>({...x,displayName:x.displayName===undefined?undefined:text(x.displayName,"Display name",300),description:x.description===undefined?undefined:optional(x.description,"Description",5000)});
export const validateNormItemCreate=(x:any)=>({...x,quantity:decimal(x.quantity,"quantity",9999999999999,true),wastePercent:decimal(x.wastePercent,"wastePercent",100)});
export const validateNormItemUpdate=(x:any)=>({...x,quantity:x.quantity===undefined?undefined:decimal(x.quantity,"quantity",9999999999999,true),wastePercent:x.wastePercent===undefined?undefined:decimal(x.wastePercent,"wastePercent",100)});
