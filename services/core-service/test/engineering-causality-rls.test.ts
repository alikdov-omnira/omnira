import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";

const run = process.env.DATABASE_URL ? describe : describe.skip;

run("Engineering Causality PostgreSQL integrity", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tables = ["engineering_value_lineages", "engineering_change_events", "engineering_impact_reports"];
  afterAll(() => pool.end());

  it("forces tenant isolation and append-only causality", async () => {
    const rows = (await pool.query("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE relname=ANY($1)", [tables])).rows;
    expect(rows).toHaveLength(3);
    expect(rows.every((x) => x.relrowsecurity && x.relforcerowsecurity)).toBe(true);
    const names = ["immutable_engineering_value_lineages", "immutable_engineering_change_events", "immutable_engineering_impact_reports"];
    const triggers = (await pool.query("SELECT tgname FROM pg_trigger WHERE tgname=ANY($1)AND NOT tgisinternal", [names])).rows;
    expect(triggers).toHaveLength(3);
  });

  it("automatically creates an impact report for a new authoritative revision", async () => {
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const fixture = (await db.query("SELECT t.id tenant_id,u.id user_id FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE t.slug='demo'AND u.email='admin@demo.odls'")).rows[0];
      const profile = randomUUID(), revision1 = randomUUID(), revision2 = randomUUID(), snapshot1 = randomUUID(), snapshot2 = randomUUID();
      await db.query("SELECT set_config('app.tenant_id',$1,true)", [fixture.tenant_id]);
      await db.query("INSERT INTO regional_pricing_profiles(id,tenant_id,code,title,created_by,updated_by)VALUES($1,$2,$3,'ECC rates',$4,$4)", [profile, fixture.tenant_id, `ECC-${Date.now()}`, fixture.user_id]);
      for (const [id, number] of [[revision1, 1], [revision2, 2]] as const) {
        await db.query("INSERT INTO regional_pricing_revisions(id,tenant_id,profile_id,revision_number,status,is_current,country_code,region_code,customer_category,commercial_profile,currency,effective_from,price_source,overhead_rules,tax_rules,margin_rules,discount_rules,adjustment_rules,calculation_version,approved_at,approved_by,created_by,updated_by)VALUES($1,$2,$3,$4,'approved',$5,'PL','mazowieckie','standard','standard','PLN','2026-01-01','verified','[]','[]','[]','[]','[]','v1',now(),$6,$6,$6)", [id, fixture.tenant_id, profile, number, number === 2, fixture.user_id]);
      }
      await db.query("INSERT INTO approved_regional_pricing_snapshots(id,tenant_id,profile_id,revision_id,revision_number,content,content_fingerprint,approved_by)VALUES($1,$2,$3,$4,1,$5,repeat('a',64),$6)", [snapshot1, fixture.tenant_id, profile, revision1, JSON.stringify({ schemaVersion:"regional-pricing-v1", entries:[{ referenceCode:"PAINT", unitPrice:10 }] }), fixture.user_id]);
      await db.query("INSERT INTO approved_regional_pricing_snapshots(id,tenant_id,profile_id,revision_id,revision_number,content,content_fingerprint,approved_by)VALUES($1,$2,$3,$4,2,$5,repeat('b',64),$6)", [snapshot2, fixture.tenant_id, profile, revision2, JSON.stringify({ schemaVersion:"regional-pricing-v1", entries:[{ referenceCode:"PAINT", unitPrice:12 }] }), fixture.user_id]);
      const report = (await db.query("SELECT r.*,e.old_snapshot_id,e.new_snapshot_id FROM engineering_impact_reports r JOIN engineering_change_events e ON e.id=r.change_event_id WHERE e.new_snapshot_id=$1", [snapshot2])).rows[0];
      expect(report).toMatchObject({ status:"recalculation_required", old_snapshot_id:snapshot1, new_snapshot_id:snapshot2 });
      expect(report.approval_requirement).toMatchObject({ required:true });
      expect(report.affected_modules).toEqual(expect.arrayContaining(["estimate", "profitability"]));
      await db.query("ROLLBACK");
    } finally { db.release(); }
  });
});
