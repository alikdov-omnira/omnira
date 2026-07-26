import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
const url=process.env.DATABASE_URL,run=url?describe:describe.skip;
run("Document pages FORCE RLS",()=>{
 const pool=new Pool({connectionString:url});
 afterAll(()=>pool.end());
 it("enables and forces tenant RLS and defines tenant-aware foreign keys",async()=>{
  expect((await pool.query(`SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE relname='document_pages'`)).rows[0]).toEqual({relrowsecurity:true,relforcerowsecurity:true});
  const policies=(await pool.query(`SELECT policyname FROM pg_policies WHERE tablename='document_pages'`)).rows.map(x=>x.policyname);expect(policies).toEqual(["tenant_document_pages"]);
  const definitions=(await pool.query(`SELECT pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='document_pages'::regclass AND contype='f'`)).rows.map(x=>x.definition);
  expect(definitions.filter(x=>x.includes("FOREIGN KEY (tenant_id,")).length).toBeGreaterThanOrEqual(5);
 });
});
