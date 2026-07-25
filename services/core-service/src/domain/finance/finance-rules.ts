import {domainErrors} from "../errors.js";
const money=/^(0|[1-9]\d*)(\.\d{1,4})?$/;
export const minor=(value:string)=>{if(!money.test(value))throw domainErrors.validation("Money must be a non-negative decimal with at most four decimal places");const [whole,fraction=""]=value.split(".");return BigInt(whole)*10000n+BigInt(fraction.padEnd(4,"0"));};
export const decimal=(value:bigint)=>{const sign=value<0n?"-":"",absolute=value<0n?-value:value;return `${sign}${absolute/10000n}.${(absolute%10000n).toString().padStart(4,"0")}`;};
export function totals(net:string,rate:string){const n=minor(net),r=minor(rate);if(r>1000000n)throw domainErrors.validation("VAT rate must be between 0 and 100");const vat=(n*r+500000n)/1000000n;return {netAmount:decimal(n),vatRate:decimal(r),vatAmount:decimal(vat),grossAmount:decimal(n+vat)};}
export function validDates(issue?:string|null,due?:string|null){if(issue&&due&&due<issue)throw domainErrors.validation("dueDate cannot be before issueDate");}
