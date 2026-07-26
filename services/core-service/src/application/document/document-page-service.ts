import {createHash,randomUUID} from "node:crypto";
import type {Pool} from "pg";
import {requireDocument,type DocumentActor} from "../../authorization/document-policy.js";
import {domainErrors,DomainError} from "../../domain/errors.js";
import {pageMimeTypes,requireProcessableMime,validatePageOrder,validateRotation,type Crop,type EnhancementPreset,type Perspective} from "../../domain/document/document-page-rules.js";
import {inTenantTransaction} from "../../infrastructure/transaction.js";
import {DocumentPageRepository} from "../../infrastructure/document/document-page-repository.js";
import {LocalDocumentStorage} from "../../infrastructure/document/local-document-storage.js";
import {S3CompatibleDocumentStorage} from "../../infrastructure/document/s3-compatible-document-storage.js";
import {SharpImageProcessor} from "../../infrastructure/document/sharp-image-processor.js";
import {sanitizeScannerFilename,validateScannerFile} from "../../domain/document/document-rules.js";
import type {FileStorage} from "./file-storage.js";
import type {ImageProcessor} from "./image-processor.js";
import type {DocumentPageRepositoryPort} from "./document-page-repository-port.js";

type ProcessInput={expectedVersion:number;rotationDegrees:number;enhancementPreset:EnhancementPreset;crop?:Crop;perspective?:Perspective};
export function scannerEnvironmentInteger(name:string,fallback:number,min:number,max:number){
 const raw=process.env[name];
 if(raw===undefined)return fallback;
 if(!/^\d+$/.test(raw))throw new Error(`Invalid ${name}`);
 const value=Number(raw);
 if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error(`Invalid ${name}`);
 return value;
}
export class DocumentPageService{
 constructor(
  private pool:Pool,
  private storage:FileStorage=process.env.OBJECT_STORAGE_ENDPOINT?new S3CompatibleDocumentStorage():new LocalDocumentStorage(),
  private processor:ImageProcessor=new SharpImageProcessor(),
  private repo:DocumentPageRepositoryPort=new DocumentPageRepository(),
  private maxUploadBytes=scannerEnvironmentInteger("SCANNER_MAX_UPLOAD_BYTES",25*1024*1024,1,1024*1024*1024),
  private maxPixels=scannerEnvironmentInteger("SCANNER_MAX_IMAGE_PIXELS",40_000_000,1,250_000_000),
  private maxDimension=scannerEnvironmentInteger("SCANNER_MAX_IMAGE_DIMENSION",12_000,1,100_000),
  private jpegQuality=scannerEnvironmentInteger("SCANNER_OUTPUT_JPEG_QUALITY",88,1,100),
  private compensationFailure:(event:{event:string;errorName:string})=>void=event=>console.warn(event)
 ){}
 private async compensate(key:string){try{await this.storage.deleteObject({key});}catch(error){this.compensationFailure({event:"document.page_storage_compensation_failed",errorName:error instanceof Error?error.name:"UnknownError"});}}
 private checksum(bytes:Buffer){return createHash("sha256").update(bytes).digest("hex");}
 private async assertDocument(db:any,actor:DocumentActor,documentId:string,expectedVersion?:number){
  const document=await this.repo.document(db,actor.tenantId,documentId);
  if(!document)throw domainErrors.notFound();
  if(document.archivedAt)throw domainErrors.archived();
  if(expectedVersion!==undefined&&document.version!==expectedVersion)throw domainErrors.conflict();
  return document;
 }
 async add(actor:DocumentActor,documentId:string,expectedVersion:number,file:{filename:string;mimetype:string;bytes:Buffer}){
  requireDocument(actor,"upload");
  const info=validateScannerFile(file.filename,file.mimetype,file.bytes,this.maxUploadBytes);
  let dimensions:{width:number;height:number}|undefined;
  if((pageMimeTypes as readonly string[]).includes(info.mimeType)){
   dimensions=await this.processor.metadata(file.bytes,this.maxPixels,this.maxDimension);
   if(dimensions.width*dimensions.height>this.maxPixels)throw domainErrors.validation("Decoded image exceeds the configured pixel limit",{maxPixels:this.maxPixels});
   if(dimensions.width>this.maxDimension||dimensions.height>this.maxDimension)throw domainErrors.validation("Image exceeds the configured dimension limit",{maxDimension:this.maxDimension});
  }
  const pageId=randomUUID(),fileId=randomUUID(),key=`tenants/${actor.tenantId}/documents/${documentId}/pages/${pageId}/source/${sanitizeScannerFilename(info.originalFilename)}`;
  let stored;
  try{stored=await this.storage.putObject({key,body:file.bytes,contentType:info.mimeType,checksumSha256:info.checksum});}
  catch(error){await this.compensate(key);throw error;}
  try{return await inTenantTransaction(this.pool,actor.tenantId,async db=>{
   await db.query(`SELECT id FROM documents WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,[actor.tenantId,documentId]);
   await this.assertDocument(db,actor,documentId,expectedVersion);
   const pageNumber=Number((await db.query(`SELECT count(*) count FROM document_pages WHERE tenant_id=$1 AND document_id=$2`,[actor.tenantId,documentId])).rows[0].count)+1;
   await db.query(`INSERT INTO file_objects(id,tenant_id,storage_provider,storage_bucket,storage_key,original_filename,mime_type,size_bytes,checksum_sha256,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'available',$10)`,[fileId,actor.tenantId,stored.provider,stored.bucket,stored.key,info.originalFilename,info.mimeType,info.fileSize,info.checksum,actor.id]);
   await db.query(`INSERT INTO document_pages(id,tenant_id,document_id,source_file_object_id,page_number,original_width,original_height,checksum,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,[pageId,actor.tenantId,documentId,fileId,pageNumber,dimensions?.width??null,dimensions?.height??null,info.checksum,actor.id]);
   const changed=await db.query(`UPDATE documents SET page_count=$1,version=version+1,updated_at=now(),updated_by=$2 WHERE tenant_id=$3 AND id=$4 AND version=$5`,[pageNumber,actor.id,actor.tenantId,documentId,expectedVersion]);
   if(!changed.rowCount)throw domainErrors.conflict();
   await this.repo.audit(db,actor,"document.page_added",documentId,{pageId,pageNumber,sourceChecksum:info.checksum,mimeType:info.mimeType});
   return this.repo.page(db,actor.tenantId,documentId,pageId);
  });}catch(error){await this.compensate(key);throw error;}
 }
 async list(actor:DocumentActor,documentId:string){requireDocument(actor,"read");return inTenantTransaction(this.pool,actor.tenantId,async db=>{if(!await this.repo.document(db,actor.tenantId,documentId))throw domainErrors.notFound();return this.repo.pages(db,actor.tenantId,documentId);});}
 async get(actor:DocumentActor,documentId:string,pageId:string){requireDocument(actor,"read");return inTenantTransaction(this.pool,actor.tenantId,async db=>{const page=await this.repo.page(db,actor.tenantId,documentId,pageId);if(!page)throw domainErrors.notFound();return page;});}
 async process(actor:DocumentActor,documentId:string,pageId:string,input:ProcessInput){
  requireDocument(actor,"process");validateRotation(input.rotationDegrees);
  const started=Date.now();
  const page=await inTenantTransaction(this.pool,actor.tenantId,async db=>{
   await this.assertDocument(db,actor,documentId);
   const current=await this.repo.page(db,actor.tenantId,documentId,pageId);
   if(!current)throw domainErrors.notFound();
   if(current.version!==input.expectedVersion)throw domainErrors.conflict();
   if(current.processingStatus==="processing")throw domainErrors.conflict();
   requireProcessableMime(current.sourceMimeType);
   const changed=await db.query(`UPDATE document_pages SET processing_status='processing',processing_error_code=NULL,rotation_degrees=$1,crop_metadata=$2,perspective_metadata=$3,enhancement_preset=$4,updated_at=now(),updated_by=$5,version=version+1 WHERE tenant_id=$6 AND document_id=$7 AND id=$8 AND version=$9 AND processing_status<>'processing'`,[input.rotationDegrees,input.crop??null,input.perspective??null,input.enhancementPreset,actor.id,actor.tenantId,documentId,pageId,input.expectedVersion]);
   if(!changed.rowCount)throw domainErrors.conflict();
   await this.repo.audit(db,actor,"document.page_processing_started",documentId,{pageId,pageNumber:current.pageNumber,preset:input.enhancementPreset});
   return {...current,version:current.version+1};
  });
  let outputKey:string|undefined;
  try{
   const source=await inTenantTransaction(this.pool,actor.tenantId,db=>this.repo.file(db,actor.tenantId,page.sourceFileObjectId));
   if(!source)throw domainErrors.imageProcessing("Source object metadata is missing");
   let bytes:Buffer;try{bytes=await this.storage.getObject({key:source.storageKey});}catch{throw domainErrors.imageProcessing("Source object is missing");}
   const result=await this.processor.process({bytes,rotationDegrees:input.rotationDegrees,crop:input.crop,perspective:input.perspective,enhancementPreset:input.enhancementPreset,maxPixels:this.maxPixels,maxDimension:this.maxDimension,outputJpegQuality:this.jpegQuality});
   if(!result.bytes.length||result.width<=0||result.height<=0||result.width*result.height>this.maxPixels)throw domainErrors.imageProcessing("Image processor returned invalid output");
   const processedChecksum=this.checksum(result.bytes),fileId=randomUUID();
   outputKey=`tenants/${actor.tenantId}/documents/${documentId}/pages/${pageId}/processed/${fileId}.jpg`;
   let stored;
   try{stored=await this.storage.putObject({key:outputKey,body:result.bytes,contentType:"image/jpeg",checksumSha256:processedChecksum});}
   catch(error){await this.compensate(outputKey);throw error;}
   try{return await inTenantTransaction(this.pool,actor.tenantId,async db=>{
    const current=await this.repo.page(db,actor.tenantId,documentId,pageId);
    if(!current||current.version!==page.version||current.processingStatus!=="processing")throw domainErrors.conflict();
    await db.query(`INSERT INTO file_objects(id,tenant_id,storage_provider,storage_bucket,storage_key,original_filename,mime_type,size_bytes,checksum_sha256,status,created_by) VALUES($1,$2,$3,$4,$5,$6,'image/jpeg',$7,$8,'available',$9)`,[fileId,actor.tenantId,stored.provider,stored.bucket,stored.key,`page-${current.pageNumber}.jpg`,result.bytes.length,processedChecksum,actor.id]);
    await db.query(`UPDATE document_pages SET processed_file_object_id=$1,processing_status='completed',processing_error_code=NULL,width=$2,height=$3,original_width=$4,original_height=$5,checksum=$6,updated_at=now(),updated_by=$7,version=version+1 WHERE tenant_id=$8 AND document_id=$9 AND id=$10 AND version=$11`,[fileId,result.width,result.height,result.originalWidth,result.originalHeight,processedChecksum,actor.id,actor.tenantId,documentId,pageId,page.version]);
    await this.repo.audit(db,actor,"document.page_processed",documentId,{pageId,pageNumber:current.pageNumber,sourceChecksum:source.checksum,processedChecksum,preset:input.enhancementPreset,width:result.width,height:result.height,durationMs:Date.now()-started});
    return this.repo.page(db,actor.tenantId,documentId,pageId);
   });}catch(error){await this.compensate(outputKey);throw error;}
  }catch(error){
   const code=error instanceof DomainError?error.code:"IMAGE_PROCESSING_FAILED";
   try{await inTenantTransaction(this.pool,actor.tenantId,async db=>{
     const current=await this.repo.page(db,actor.tenantId,documentId,pageId);
     if(current?.processingStatus==="processing"&&current.version===page.version){
      await db.query(`UPDATE document_pages SET processing_status='failed',processing_error_code=$1,updated_at=now(),updated_by=$2,version=version+1 WHERE tenant_id=$3 AND document_id=$4 AND id=$5 AND version=$6`,[code,actor.id,actor.tenantId,documentId,pageId,page.version]);
      await this.repo.audit(db,actor,"document.page_processing_failed",documentId,{pageId,pageNumber:current.pageNumber,errorCode:code,durationMs:Date.now()-started});
     }
    });}catch(failure){this.compensationFailure({event:"document.page_failure_state_write_failed",errorName:failure instanceof Error?failure.name:"UnknownError"});}
   throw error;
  }
 }
 async content(actor:DocumentActor,documentId:string,pageId:string){
  requireDocument(actor,"download");
  const file=await inTenantTransaction(this.pool,actor.tenantId,async db=>{const page=await this.repo.page(db,actor.tenantId,documentId,pageId);if(!page)throw domainErrors.notFound();const processed=page.processingStatus==="completed"&&Boolean(page.processedFileObjectId),file=await this.repo.file(db,actor.tenantId,processed?page.processedFileObjectId:page.sourceFileObjectId);if(!file)throw domainErrors.notFound();return {...file,contentVariant:processed?"processed" as const:"source" as const};});
  try{return {...file,bytes:await this.storage.getObject({key:file.storageKey})};}catch{throw domainErrors.notFound();}
 }
 async reorder(actor:DocumentActor,documentId:string,input:{expectedDocumentVersion:number;pageIds:string[]}){
  requireDocument(actor,"process");
  return inTenantTransaction(this.pool,actor.tenantId,async db=>{
   await db.query(`SELECT id FROM documents WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,[actor.tenantId,documentId]);
   await this.assertDocument(db,actor,documentId,input.expectedDocumentVersion);
   const pages=await this.repo.pages(db,actor.tenantId,documentId);validatePageOrder(pages.map(x=>x.id),input.pageIds);
   await db.query(`SET CONSTRAINTS document_pages_document_page_number_unique DEFERRED`);
   for(const [index,id] of input.pageIds.entries())await db.query(`UPDATE document_pages SET page_number=$1,updated_at=now(),updated_by=$2,version=version+1 WHERE tenant_id=$3 AND document_id=$4 AND id=$5`,[index+1,actor.id,actor.tenantId,documentId,id]);
   const changed=await db.query(`UPDATE documents SET version=version+1,updated_at=now(),updated_by=$1 WHERE tenant_id=$2 AND id=$3 AND version=$4`,[actor.id,actor.tenantId,documentId,input.expectedDocumentVersion]);if(!changed.rowCount)throw domainErrors.conflict();
   await this.repo.audit(db,actor,"document.pages_reordered",documentId,{pageIds:input.pageIds});
   return this.repo.pages(db,actor.tenantId,documentId);
  });
 }
 async delete(actor:DocumentActor,documentId:string,pageId:string,input:{expectedVersion:number;expectedDocumentVersion:number}){
  requireDocument(actor,"process");
  return inTenantTransaction(this.pool,actor.tenantId,async db=>{
   await db.query(`SELECT id FROM documents WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,[actor.tenantId,documentId]);
   await this.assertDocument(db,actor,documentId,input.expectedDocumentVersion);
   const page=await this.repo.page(db,actor.tenantId,documentId,pageId);if(!page)throw domainErrors.notFound();if(page.version!==input.expectedVersion)throw domainErrors.conflict();if(page.processingStatus==="processing")throw domainErrors.conflict();
   if(!(await db.query(`DELETE FROM document_pages WHERE tenant_id=$1 AND document_id=$2 AND id=$3 AND version=$4`,[actor.tenantId,documentId,pageId,input.expectedVersion])).rowCount)throw domainErrors.conflict();
   await db.query(`SET CONSTRAINTS document_pages_document_page_number_unique DEFERRED`);
   await db.query(`UPDATE document_pages SET page_number=page_number-1,updated_at=now(),updated_by=$1,version=version+1 WHERE tenant_id=$2 AND document_id=$3 AND page_number>$4`,[actor.id,actor.tenantId,documentId,page.pageNumber]);
   const count=Number((await db.query(`SELECT count(*) count FROM document_pages WHERE tenant_id=$1 AND document_id=$2`,[actor.tenantId,documentId])).rows[0].count);
   const changed=await db.query(`UPDATE documents SET page_count=$1,version=version+1,updated_at=now(),updated_by=$2 WHERE tenant_id=$3 AND id=$4 AND version=$5`,[count||null,actor.id,actor.tenantId,documentId,input.expectedDocumentVersion]);if(!changed.rowCount)throw domainErrors.conflict();
   await this.repo.audit(db,actor,"document.page_deleted",documentId,{pageId,pageNumber:page.pageNumber});
   return {deleted:true};
  });
 }
}

export class AddDocumentPageService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["add"]>){return this.service.add(...args);}}
export class ProcessDocumentPageService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["process"]>){return this.service.process(...args);}}
export class ListDocumentPagesService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["list"]>){return this.service.list(...args);}}
export class ReorderDocumentPagesService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["reorder"]>){return this.service.reorder(...args);}}
export class DeleteDocumentPageService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["delete"]>){return this.service.delete(...args);}}
export class GetDocumentPageContentService{constructor(private service:DocumentPageService){}execute(...args:Parameters<DocumentPageService["content"]>){return this.service.content(...args);}}
