import {createServer} from "node:http";
import {join} from "node:path";
import dotenv from "dotenv";
import {Pool} from "pg";
import {NotificationWorker} from "./application/notification/notification-worker.js";
dotenv.config({path:join(import.meta.dirname,"../../../../.env")});
const databaseUrl=process.env.DATABASE_URL;if(!databaseUrl)throw new Error("DATABASE_URL is required");
const pool=new Pool({connectionString:databaseUrl}),worker=new NotificationWorker(pool,{batchSize:Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE??25),maxAttempts:Number(process.env.NOTIFICATION_WORKER_MAX_ATTEMPTS??5),dueSoonDays:Number(process.env.NOTIFICATION_DUE_SOON_DAYS??3)}),interval=Math.max(1000,Number(process.env.NOTIFICATION_WORKER_POLL_MS??5000));
let ready=false,stopping=false,lastCycle:string|null=null;
const health=createServer(async(req,res)=>{res.setHeader("content-type","application/json");if(req.url==="/ready"){try{await pool.query("SELECT 1");res.statusCode=ready?200:503;}catch{res.statusCode=503;}}else res.statusCode=200;res.end(JSON.stringify({status:res.statusCode===200?"ok":"unavailable",service:"notification-worker",ready,lastCycle}));}).listen(Number(process.env.NOTIFICATION_WORKER_HEALTH_PORT??3002));
async function cycle(){if(stopping)return;try{const summary=await worker.runCycle();lastCycle=new Date().toISOString();ready=true;console.log(JSON.stringify({level:"info",service:"notification-worker",event:"cycle.completed",...summary,lastCycle}));}catch(error){console.error(JSON.stringify({level:"error",service:"notification-worker",event:"cycle.failed",error:error instanceof Error?error.message:"unknown"}));}if(!stopping)setTimeout(()=>void cycle(),interval);}
async function shutdown(signal:string){if(stopping)return;stopping=true;ready=false;console.log(JSON.stringify({level:"info",service:"notification-worker",event:"shutdown",signal}));health.close();await pool.end();process.exit(0);}
process.on("SIGTERM",()=>void shutdown("SIGTERM"));process.on("SIGINT",()=>void shutdown("SIGINT"));void cycle();
