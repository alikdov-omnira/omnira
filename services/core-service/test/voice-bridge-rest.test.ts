import{Pool}from"pg";
import{afterAll,beforeAll,describe,expect,it}from"vitest";
import{buildServer}from"../src/server.js";

const run=process.env.DATABASE_URL?describe:describe.skip;
run("Voice Bridge REST privacy and lifecycle",()=>{
  const app=buildServer(),pool=new Pool({connectionString:process.env.DATABASE_URL});
  let token="",userId="";
  const request=(method:any,url:string,payload?:any):any=>app.inject({method,url,headers:{authorization:`Bearer ${token}`},payload});
  beforeAll(async()=>{const login=await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{tenantSlug:"demo",email:"admin@demo.odls",password:"DemoPassword!2026"}});token=login.json().data.accessToken;userId=login.json().data.user.id});
  afterAll(async()=>{await app.close();await pool.end()});
  it("reports PARTIAL providers and never offers recording",async()=>{const response=await request("GET","/api/v1/voice/providers");expect(response.statusCode,response.body).toBe(200);expect(response.json().data).toMatchObject({architecture:"REAL",recording:"PROHIBITED_BY_ARCHITECTURE"});expect(response.json().data.providers.every((x:any)=>x.truth==="PARTIAL")).toBe(true)});
  it("starts and ends an ephemeral session while auditing metadata only",async()=>{let response=await request("POST","/api/v1/voice/sessions",{mode:"conversation_translation",participants:[{userId,speakingLanguage:"pl-PL",listeningLanguage:"ru-RU"}]});expect(response.statusCode,response.body).toBe(201);const session=response.json().data;expect(session).toMatchObject({state:"active",providerTruth:"PARTIAL"});response=await request("POST",`/api/v1/voice/sessions/${session.id}/end`);expect(response.statusCode,response.body).toBe(200);const logs=(await pool.query("SELECT action,metadata::text FROM audit_logs WHERE entity_id=$1 ORDER BY occurred_at",[session.id])).rows;expect(logs.map(x=>x.action)).toEqual(["voice.session_started","voice.session_ended"]);expect(JSON.stringify(logs)).not.toMatch(/audio|transcript|waveform/i)});
  it("allows only active participants from the authenticated tenant",async()=>{const tenant=(await pool.query("SELECT tenant_id FROM users WHERE id=$1",[userId])).rows[0].tenant_id,sameTenant=(await pool.query("SELECT id FROM users WHERE tenant_id=$1 AND id<>$2 AND deleted_at IS NULL AND is_disabled=false LIMIT 1",[tenant,userId])).rows[0].id,otherTenant=(await pool.query("SELECT id FROM users WHERE tenant_id<>$1 AND deleted_at IS NULL AND is_disabled=false LIMIT 1",[tenant])).rows[0].id;expect((await request("POST","/api/v1/voice/sessions",{mode:"conversation_translation",participants:[{userId,listeningLanguage:"pl-PL"},{userId:sameTenant,listeningLanguage:"ru-RU"}]})).statusCode).toBe(201);expect((await request("POST","/api/v1/voice/sessions",{mode:"conversation_translation",participants:[{userId,listeningLanguage:"pl-PL"},{userId:otherTenant,listeningLanguage:"ru-RU"}]})).statusCode).toBe(403)});
});
