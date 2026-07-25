import {join} from "node:path";
import dotenv from "dotenv";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool,PoolClient} from "pg";

dotenv.config({path:join(import.meta.dirname,"../../../.env")});
const enabled=Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)("task_assignments RLS",()=>{
  let pool:Pool,db:PoolClient;
  beforeAll(async()=>{pool=new Pool({connectionString:process.env.DATABASE_URL});db=await pool.connect();await db.query("BEGIN");await db.query("CREATE ROLE odls_rls_test NOLOGIN");await db.query("GRANT USAGE ON SCHEMA public TO odls_rls_test");await db.query("GRANT SELECT ON tasks,users TO odls_rls_test");await db.query("GRANT SELECT,INSERT,DELETE ON task_assignments TO odls_rls_test");await db.query("SET LOCAL ROLE odls_rls_test");});
  afterAll(async()=>{await db.query("RESET ROLE");await db.query("ROLLBACK");db.release();await pool.end();});
  it("allows a same-tenant assignment",async()=>{await db.query("SELECT set_config('app.tenant_id',$1,true)",["00000000-0000-4000-8000-000000000001"]);await db.query("DELETE FROM task_assignments WHERE task_id=$1 AND user_id=$2",["00000000-0000-4000-8000-000000000081","00000000-0000-4000-8000-000000000013"]);const result=await db.query("INSERT INTO task_assignments(tenant_id,task_id,user_id,assigned_by) VALUES($1,$2,$3,$4) RETURNING user_id",["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000081","00000000-0000-4000-8000-000000000013","00000000-0000-4000-8000-000000000011"]);expect(result.rowCount).toBe(1);});
  it("blocks a cross-tenant assignee",async()=>{await db.query("SAVEPOINT cross_tenant");await expect(db.query("INSERT INTO task_assignments(tenant_id,task_id,user_id,assigned_by) VALUES($1,$2,$3,$4)",["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000081","00000000-0000-4000-8000-000000000015","00000000-0000-4000-8000-000000000011"])).rejects.toMatchObject({code:"42501"});await db.query("ROLLBACK TO SAVEPOINT cross_tenant");});
  it("hides another tenant's assignments",async()=>{await db.query("SELECT set_config('app.tenant_id',$1,true)",["00000000-0000-4000-8000-000000000002"]);const result=await db.query("SELECT * FROM task_assignments WHERE task_id=$1",["00000000-0000-4000-8000-000000000081"]);expect(result.rowCount).toBe(0);});
});
