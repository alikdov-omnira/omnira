import {createHash} from "node:crypto";
import {basename,extname} from "node:path";
import {domainErrors} from "../errors.js";
import type {DocumentCategory} from "@odls/contracts";
const categories=new Set(["contract","offer","invoice","receipt","project_plan","photo","protocol","permit","correspondence","other"]);
const allowed:{[key:string]:{mime:string;signature:(b:Buffer)=>boolean}}={
 ".pdf":{mime:"application/pdf",signature:b=>b.subarray(0,5).toString()==="%PDF-"},
 ".png":{mime:"image/png",signature:b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
 ".jpg":{mime:"image/jpeg",signature:b=>b[0]===0xff&&b[1]===0xd8&&b.at(-2)===0xff&&b.at(-1)===0xd9},
 ".jpeg":{mime:"image/jpeg",signature:b=>b[0]===0xff&&b[1]===0xd8&&b.at(-2)===0xff&&b.at(-1)===0xd9}
};
export function validateCategory(value:string):DocumentCategory{if(!categories.has(value))throw domainErrors.validation("Invalid document category");return value as DocumentCategory;}
export function normalizeFilename(value:string){if(!value||value!==basename(value)||value.includes("\0")||value.includes("/")||value.includes("\\"))throw domainErrors.validation("Invalid filename");const name=value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g,"").trim().replace(/\s+/g," ");if(!name||name.length>240)throw domainErrors.validation("Invalid filename");const parts=name.toLowerCase().split(".");if(parts.length>2)throw domainErrors.validation("Double extensions are not allowed");return name;}
export function validateFile(filename:string,declaredMime:string,bytes:Buffer,maxBytes:number){const safe=normalizeFilename(filename);if(!bytes.length)throw domainErrors.validation("Empty files are not allowed");if(bytes.length>maxBytes)throw domainErrors.validation("File exceeds maximum size",{maxBytes});const extension=extname(safe).toLowerCase(),rule=allowed[extension];if(!rule)throw domainErrors.validation("File type is not allowed");if(declaredMime!==rule.mime||!rule.signature(bytes))throw domainErrors.validation("File content does not match its declared type");return {originalFilename:safe,extension:extension.slice(1),mimeType:rule.mime,fileSize:bytes.length,checksum:createHash("sha256").update(bytes).digest("hex")};}

const scannerSignatures:Record<string,(b:Buffer)=>boolean>={
 "application/pdf":b=>b.subarray(0,5).toString()==="%PDF-",
 "image/png":b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
 "image/jpeg":b=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff,
 "image/webp":b=>b.length>=12&&b.subarray(0,4).toString()==="RIFF"&&b.subarray(8,12).toString()==="WEBP"
};
export const documentTypes=["unknown","invoice","contract","estimate","acceptance_act","receipt","drawing","photo","other"] as const;
export function validateDocumentType(value:string){if(!(documentTypes as readonly string[]).includes(value))throw domainErrors.validation("Invalid document type");return value as typeof documentTypes[number];}
export function sanitizeScannerFilename(value:string){
 const leaf=basename(value.replaceAll("\\","/")).normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g,"").trim().replace(/\s+/g," ");
 if(!leaf)throw domainErrors.validation("Invalid filename");
 const trimmed=leaf.slice(0,240),extension=extname(trimmed).toLowerCase(),stem=basename(trimmed,extension).replace(/[^a-zA-Z0-9._() -]/g,"_").replace(/^\.+/,"");
 if(!stem||stem.toLowerCase().split(".").length>1)throw domainErrors.validation("Invalid filename");
 return `${stem}${extension}`;
}
export function validateScannerFile(filename:string,declaredMime:string,bytes:Buffer,maxBytes:number){
 const originalFilename=sanitizeScannerFilename(filename);
 if(!bytes.length)throw domainErrors.validation("Empty files are not allowed");
 if(bytes.length>maxBytes)throw domainErrors.validation("File exceeds maximum size",{maxBytes});
 const signature=scannerSignatures[declaredMime];
 if(!signature||!signature(bytes))throw domainErrors.validation("File content does not match its declared type");
 const extension=extname(originalFilename).toLowerCase(),expected:Record<string,readonly string[]>={"application/pdf":[".pdf"],"image/png":[".png"],"image/jpeg":[".jpg",".jpeg"],"image/webp":[".webp"]};
 if(!expected[declaredMime]?.includes(extension))throw domainErrors.validation("Filename extension does not match its declared type");
 return {originalFilename,extension:extension.slice(1),mimeType:declaredMime,fileSize:bytes.length,checksum:createHash("sha256").update(bytes).digest("hex")};
}
