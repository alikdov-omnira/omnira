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
