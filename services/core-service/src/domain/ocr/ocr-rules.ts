import {domainErrors} from "../errors.js";
export const ocrLanguages=["eng","pol","rus","ukr"] as const;
export type OcrLanguage=typeof ocrLanguages[number];
export type OcrJobStatus="pending"|"processing"|"completed"|"failed"|"cancelled";
const transitions:Record<OcrJobStatus,readonly OcrJobStatus[]>={pending:["processing","cancelled"],processing:["completed","failed"],failed:["pending","processing","cancelled"],completed:[],cancelled:[]};
export function normalizeLanguages(values:readonly string[],maxLanguages:number):OcrLanguage[]{
 const result=[...new Set(values.map(x=>x.trim().toLowerCase()))].sort();
 if(!result.length||result.length>maxLanguages||result.some(x=>!(ocrLanguages as readonly string[]).includes(x)))throw domainErrors.ocr("OCR_LANGUAGE_NOT_SUPPORTED",400,"OCR language selection is not supported");
 return result as OcrLanguage[];
}
export function assertOcrTransition(from:OcrJobStatus,to:OcrJobStatus){if(!transitions[from].includes(to))throw domainErrors.transition();}
export function normalizeOcrText(value:string,maxCharacters:number){
 if(typeof value!=="string"||value.length>maxCharacters)throw domainErrors.ocr("OCR_OUTPUT_INVALID",422,"OCR output is invalid");
 return value.normalize("NFC").replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,"").replace(/\n{4,}/g,"\n\n\n").trim();
}
export function sanitizeRawOcrText(value:string,maxCharacters:number){
 if(typeof value!=="string"||value.length>maxCharacters)throw domainErrors.ocr("OCR_OUTPUT_INVALID",422,"OCR output is invalid");
 return value.replace(/\u0000/g,"");
}
export function validateConfidence(value:number|null){if(value!==null&&(!Number.isFinite(value)||value<0||value>100))throw domainErrors.ocr("OCR_OUTPUT_INVALID",422,"OCR confidence is invalid");return value;}
export function retryDelay(attempts:number){return Math.min(300_000,1000*2**Math.min(attempts,8));}
export const retryableOcrErrors=new Set(["OCR_PROVIDER_UNAVAILABLE","OCR_PROCESSING_FAILED","OCR_TIMEOUT"]);
