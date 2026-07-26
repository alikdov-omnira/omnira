import {createHash,createHmac} from "node:crypto";
import type {FileStorage,StoredObject} from "../../application/document/file-storage.js";

type Config={endpoint:string;region:string;bucket:string;accessKey:string;secretKey:string;forcePathStyle:boolean};
const hash=(v:string|Buffer)=>createHash("sha256").update(v).digest("hex");
const hmac=(key:Buffer|string,value:string)=>createHmac("sha256",key).update(value).digest();

export class S3CompatibleDocumentStorage implements FileStorage{
 constructor(private config:Config=S3CompatibleDocumentStorage.fromEnvironment()){}
 static fromEnvironment():Config{
  const endpoint=process.env.OBJECT_STORAGE_ENDPOINT,accessKey=process.env.OBJECT_STORAGE_ACCESS_KEY,secretKey=process.env.OBJECT_STORAGE_SECRET_KEY;
  if(!endpoint||!accessKey||!secretKey)throw new Error("Object storage configuration is incomplete");
  return {endpoint,accessKey,secretKey,region:process.env.OBJECT_STORAGE_REGION??"us-east-1",bucket:process.env.OBJECT_STORAGE_BUCKET??"omnira-documents",forcePathStyle:process.env.OBJECT_STORAGE_FORCE_PATH_STYLE!=="false"};
 }
 private url(key:string){const endpoint=new URL(this.config.endpoint),encoded=key.split("/").map(encodeURIComponent).join("/");if(this.config.forcePathStyle){endpoint.pathname=`/${encodeURIComponent(this.config.bucket)}/${encoded}`;}else{endpoint.hostname=`${this.config.bucket}.${endpoint.hostname}`;endpoint.pathname=`/${encoded}`;}return endpoint;}
 private async request(method:string,key:string,body?:Buffer,contentType="application/octet-stream"){
  const url=this.url(key),now=new Date(),amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,""),date=amzDate.slice(0,8),payloadHash=hash(body??Buffer.alloc(0)),headers:Record<string,string>={"host":url.host,"x-amz-content-sha256":payloadHash,"x-amz-date":amzDate};
  if(body)headers["content-type"]=contentType;
  const signedHeaders=Object.keys(headers).sort().join(";"),canonicalHeaders=Object.keys(headers).sort().map(k=>`${k}:${headers[k]}\n`).join(""),canonicalRequest=[method,url.pathname,url.searchParams.toString(),canonicalHeaders,signedHeaders,payloadHash].join("\n"),scope=`${date}/${this.config.region}/s3/aws4_request`,stringToSign=["AWS4-HMAC-SHA256",amzDate,scope,hash(canonicalRequest)].join("\n");
  const signature=createHmac("sha256",hmac(hmac(hmac(hmac(`AWS4${this.config.secretKey}`,date),this.config.region),"s3"),"aws4_request")).update(stringToSign).digest("hex");
  const requestBody=body?body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength) as ArrayBuffer:undefined;
  const response=await fetch(url,{method,headers:{...headers,authorization:`AWS4-HMAC-SHA256 Credential=${this.config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`},body:requestBody});
  if(response.status===404)return undefined;
  if(!response.ok)throw new Error(`Object storage request failed (${response.status})`);
  return response;
 }
 async putObject(input:{key:string;body:Buffer;contentType:string;checksumSha256:string}):Promise<StoredObject>{await this.request("PUT",input.key,input.body,input.contentType);return {provider:"s3",bucket:this.config.bucket,key:input.key,sizeBytes:input.body.length};}
 async getObject(input:{key:string}){const response=await this.request("GET",input.key);if(!response)throw new Error("Stored object not found");return Buffer.from(await response.arrayBuffer());}
 async deleteObject(input:{key:string}){await this.request("DELETE",input.key);}
 async headObject(input:{key:string}){const response=await this.request("HEAD",input.key);if(!response)return undefined;return {sizeBytes:Number(response.headers.get("content-length")??0)};}
}
