import {spawn} from "node:child_process";
import {Client} from "pg";

const databaseUrl=process.env.E2E_DATABASE_URL??"postgresql://odls:odls@127.0.0.1:5432/odls_e2e";
const target=new URL(databaseUrl),database=target.pathname.slice(1);
if(!/^[a-z0-9_]+_e2e$/.test(database))throw new Error(`Refusing to recreate non-E2E database: ${database}`);
const adminUrl=new URL(databaseUrl);adminUrl.pathname="/postgres";

const run=(script:string)=>new Promise<void>((resolve,reject)=>{
 const child=spawn("services/core-service/node_modules/.bin/tsx",[script],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:databaseUrl},stdio:"inherit"});
 child.on("error",reject);child.on("exit",code=>code===0?resolve():reject(new Error(`${script} exited with ${code}`)));
});
export async function recreate(){
 const admin=new Client({connectionString:adminUrl.toString()});await admin.connect();
 try{
  await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()",[database]);
  await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
  await admin.query(`CREATE DATABASE "${database}"`);
 }finally{await admin.end();}
}
export async function prepare(){
 await recreate();
 await run("services/core-service/scripts/migrate.ts");
 await run("services/core-service/scripts/seed.ts");
 await run("services/core-service/scripts/seed.ts");
}
if(process.argv[2]==="prepare")await prepare();
