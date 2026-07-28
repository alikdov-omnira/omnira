import {createServer} from "node:http";
import {join} from "node:path";
import dotenv from "dotenv";
import {Pool} from "pg";
import {NotificationWorker} from "./application/notification/notification-worker.js";
import {OcrService,ocrEnvironmentInteger} from "./application/ocr/ocr-service.js";
import {OcrJobRunner} from "./application/ocr/ocr-job-runner.js";
import {TesseractOcrProvider} from "./infrastructure/ocr/tesseract-ocr-provider.js";
import {DocumentAnalysisService,analysisEnvInt} from "./application/document-analysis/document-analysis-service.js";
import {DocumentAnalysisRunner} from "./application/document-analysis/document-analysis-runner.js";
import {DeterministicDocumentClassifier} from "./infrastructure/document-analysis/deterministic-classifier.js";
import {DocumentAnalysisRepository} from "./infrastructure/document-analysis/document-analysis-repository.js";
import {createDocumentSuggestionProvider} from "./infrastructure/document-suggestion/document-suggestion-provider-factory.js";
import {DocumentSuggestionRequestRepository} from "./infrastructure/document-suggestion/document-suggestion-repository.js";
import {DocumentSuggestionRequestService} from "./application/document-suggestion/document-suggestion-request-service.js";
import {DocumentSuggestionRunner} from "./application/document-suggestion/document-suggestion-runner.js";
dotenv.config({path:join(import.meta.dirname,"../../../../.env")});
const databaseUrl=process.env.DATABASE_URL;if(!databaseUrl)throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl}),worker=new NotificationWorker(pool,{batchSize:Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE??25),maxAttempts:Number(process.env.NOTIFICATION_WORKER_MAX_ATTEMPTS??5),dueSoonDays:Number(process.env.NOTIFICATION_DUE_SOON_DAYS??3)}),ocrProvider=new TesseractOcrProvider(),ocrRunner=new OcrJobRunner(pool,new OcrService(pool,ocrProvider),ocrEnvironmentInteger("OCR_WORKER_BATCH_SIZE",1,1,4)),analysisRunner=new DocumentAnalysisRunner(pool,new DocumentAnalysisService(new DocumentAnalysisRepository(pool),new DeterministicDocumentClassifier()),analysisEnvInt("ANALYSIS_WORKER_BATCH_SIZE",1,1,4)),suggestionSelection=createDocumentSuggestionProvider(),suggestionRunner=new DocumentSuggestionRunner(pool,new DocumentSuggestionRequestService(new DocumentSuggestionRequestRepository(pool),suggestionSelection.provider,suggestionSelection.config),1),interval=Math.max(1000,Number(process.env.NOTIFICATION_WORKER_POLL_MS??5000));
let ready=false,stopping=false,lastCycle:string|null=null;
const health=createServer(async(req,res)=>{res.setHeader("content-type","application/json");if(req.url==="/ready"){try{await pool.query("SELECT 1");res.statusCode=ready?200:503;}catch{res.statusCode=503;}}else res.statusCode=200;res.end(JSON.stringify({status:res.statusCode===200?"ok":"unavailable",service:"notification-worker",ready,lastCycle}));}).listen(Number(process.env.NOTIFICATION_WORKER_HEALTH_PORT??3002));
async function cycle(){if(stopping)return;try{const summary=await worker.runCycle(),ocr=await ocrRunner.runOnce().catch(()=>({processed:0})),analysis=await analysisRunner.runOnce().catch(()=>({processed:0})),suggestions=await suggestionRunner.runOnce().catch(()=>({processed:0}));lastCycle=new Date().toISOString();ready=true;console.log(JSON.stringify({level:"info",service:"notification-worker",event:"cycle.completed",...summary,ocrProcessed:ocr.processed,analysisProcessed:analysis.processed,suggestionProcessed:suggestions.processed,lastCycle}));}catch(error){console.error(JSON.stringify({level:"error",service:"notification-worker",event:"cycle.failed",errorName:error instanceof Error?error.name:"UnknownError"}));}if(!stopping)setTimeout(()=>void cycle(),interval);}
async function shutdown(signal:string){if(stopping)return;stopping=true;ready=false;suggestionRunner.shutdown();console.log(JSON.stringify({level:"info",service:"notification-worker",event:"shutdown",signal}));health.close();await ocrProvider.close();await pool.end();process.exit(0);}
process.on("SIGTERM",()=>void shutdown("SIGTERM"));process.on("SIGINT",()=>void shutdown("SIGINT"));void cycle();
