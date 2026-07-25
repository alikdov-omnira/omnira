import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: join(import.meta.dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString });
const files = (await readdir(join(import.meta.dirname, "../migrations"))).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
const applied = new Map((await pool.query<{ name: string; checksum: string }>("SELECT name,checksum FROM schema_migrations")).rows.map((row) => [row.name, row.checksum]));
if (process.argv.includes("--status")) {
  for (const file of files) console.log(`${applied.has(file) ? "applied" : "pending"}\t${file}`);
  await pool.end(); process.exit(0);
}
for (const file of files) {
  const sql = await readFile(join(import.meta.dirname, "../migrations", file), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  if (applied.has(file)) { if (applied.get(file) !== checksum) throw new Error(`Migration checksum changed: ${file}`); continue; }
  const client = await pool.connect();
  try { await client.query("BEGIN"); await client.query(sql); await client.query("INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",[file,checksum]); await client.query("COMMIT"); console.log(`applied\t${file}`); }
  catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
await pool.end();
