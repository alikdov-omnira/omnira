import {copyFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import {createRequire} from "node:module";
import {createWorker,type Worker} from "tesseract.js";
import sharp from "sharp";
import {domainErrors} from "../../domain/errors.js";
import {validateConfidence,type OcrLanguage} from "../../domain/ocr/ocr-rules.js";
import type {OcrProvider} from "../../application/ocr/ocr-provider.js";
const require=createRequire(import.meta.url);
type WorkerSlot={worker:Promise<Worker>;tail:Promise<void>};

export class TesseractOcrProvider implements OcrProvider{
 readonly name="tesseract.js";
 private directory:Promise<string>|undefined;
 private workers=new Map<string,WorkerSlot>();
 private async models(){
  if(!this.directory)this.directory=(async()=>{const target=await mkdtemp(join(tmpdir(),"omnira-ocr-"));for(const language of ["eng","pol","rus","ukr"] as OcrLanguage[]){const root=dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));await copyFile(join(root,"4.0.0",`${language}.traineddata.gz`),join(target,`${language}.traineddata.gz`));}return target;})();
  return this.directory;
 }
 private worker(languages:OcrLanguage[]){
  const key=languages.join("+");
  let slot=this.workers.get(key);
  if(!slot){slot={worker:this.models().then(langPath=>createWorker(languages,1,{langPath,cacheMethod:"none",gzip:true,logger:()=>{}})),tail:Promise.resolve()};this.workers.set(key,slot);}
  return {key,slot};
 }
 async recognize(input:Parameters<OcrProvider["recognize"]>[0]){
  try{const metadata=await sharp(input.bytes,{failOn:"error"}).metadata();if(!["jpeg","png","webp"].includes(metadata.format??""))throw new Error("unsupported image");}
  catch{throw domainErrors.ocr("OCR_PROCESSING_FAILED",422,"OCR processing failed");}
  const {key,slot}=this.worker(input.languages);
  const recognition=slot.tail.then(()=>slot.worker.then(worker=>worker.recognize(input.bytes)));
  slot.tail=recognition.then(()=>undefined,()=>undefined);
  let timer:NodeJS.Timeout|undefined;
  try{
   const result=await Promise.race([recognition,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(domainErrors.ocr("OCR_TIMEOUT",422,"OCR processing timed out")),input.timeoutMs);})]);
   const rawText=result.data.text??"";if(rawText.length>input.maxCharacters)throw domainErrors.ocr("OCR_OUTPUT_INVALID",422,"OCR output exceeds the configured limit");
   return {rawText,confidence:validateConfidence(result.data.confidence??null),detectedLanguage:input.languages.length===1?input.languages[0]:null,providerVersion:"tesseract.js-6.0.1",metadata:{engine:"tesseract-wasm"}};
  }catch(error){
   if(error instanceof Error&&"code" in error&&error.code==="OCR_TIMEOUT")throw error;
   if(this.workers.get(key)===slot)this.workers.delete(key);await slot.tail;await slot.worker.then(x=>x.terminate()).catch(()=>{});
   if(error instanceof Error&&"code" in error)throw error;
   throw domainErrors.ocr("OCR_PROCESSING_FAILED",422,"OCR processing failed");
  }finally{if(timer)clearTimeout(timer);}
 }
 async close(){const workers=[...this.workers.values()];this.workers.clear();await Promise.all(workers.map(async slot=>{await slot.tail;await slot.worker.then(w=>w.terminate()).catch(()=>{});}));if(this.directory)await this.directory.then(path=>rm(path,{recursive:true,force:true})).catch(()=>{});this.directory=undefined;}
}
