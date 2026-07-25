import type { Pool, PoolClient } from "pg";

/** Executes one atomic business operation. SET LOCAL keeps tenant context scoped to this transaction. */
export async function inTenantTransaction<T>(pool: Pool, tenantId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function inUserTransaction<T>(pool:Pool,tenantId:string,userId:string,operation:(client:PoolClient)=>Promise<T>):Promise<T>{
 return inTenantTransaction(pool,tenantId,async client=>{await client.query("SELECT set_config('app.user_id',$1,true)",[userId]);return operation(client);});
}

export async function inWorkerTransaction<T>(pool:Pool,tenantId:string,operation:(client:PoolClient)=>Promise<T>):Promise<T>{
 return inTenantTransaction(pool,tenantId,async client=>{await client.query("SELECT set_config('app.worker','true',true)");return operation(client);});
}
