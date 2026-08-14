import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run("Company Price Book REST authority", () => {
  const app = buildServer();
  const pool = new Pool({ connectionString: url });
  let token = "";
  let employeeToken = "";
  let secondToken = "";
  let bookId = "";
  let workId = "";
  let materialId = "";
  let unitId = "";
  let unitCode = "";
  let regionalSnapshotId = "";
  let firstSnapshotId = "";
  let firstRevisionId = "";
  let firstFingerprint = "";
  let laborEntryId = "";
  let otherWorkId = "";
  let otherMaterialId = "";

  const request = (method: any, path: string, payload?: any, auth = token) =>
    app.inject({ method, url: path, headers: { authorization: `Bearer ${auth}` }, payload });

  beforeAll(async () => {
    const login = async (tenantSlug: string, email: string) =>
      (await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { tenantSlug, email, password: "DemoPassword!2026" } })).json().data.accessToken;
    token = await login("demo", "admin@demo.odls");
    employeeToken = await login("demo", "employee@demo.odls");
    secondToken = await login("second", "admin@second.odls");
    const refs = (await pool.query("SELECT w.id work_id,u.id unit_id,u.code unit_code,m.id material_id,t.id tenant_id,usr.id user_id FROM work_items w JOIN measurement_units u ON u.tenant_id=w.tenant_id AND u.id=w.measurement_unit_id CROSS JOIN LATERAL(SELECT id FROM materials WHERE tenant_id=w.tenant_id AND measurement_unit_id=u.id AND status='active' LIMIT 1)m JOIN tenants t ON t.id=w.tenant_id JOIN users usr ON usr.tenant_id=t.id WHERE t.slug='demo'AND w.status='active' LIMIT 1")).rows[0];
    workId = refs.work_id;
    unitId = refs.unit_id;
    unitCode = refs.unit_code;
    materialId = refs.material_id;
    const regionalId = randomUUID();
    const regionalRevision = randomUUID();
    regionalSnapshotId = randomUUID();
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SELECT set_config('app.tenant_id',$1,true)", [refs.tenant_id]);
      await db.query("INSERT INTO regional_pricing_profiles(id,tenant_id,code,title,created_by,updated_by)VALUES($1,$2,$3,'Comparison fixture',$4,$4)", [regionalId, refs.tenant_id, `CPB-REG-${Date.now()}`, refs.user_id]);
      await db.query("INSERT INTO regional_pricing_revisions(id,tenant_id,profile_id,revision_number,status,country_code,region_code,customer_category,commercial_profile,currency,effective_from,price_source,overhead_rules,tax_rules,margin_rules,discount_rules,adjustment_rules,calculation_version,approved_at,approved_by,created_by,updated_by)VALUES($1,$2,$3,1,'approved','PL','mazowieckie','standard','standard','PLN','2026-01-01','test-reference','[]','[]','[]','[]','[]','v1',now(),$4,$4,$4)", [regionalRevision, refs.tenant_id, regionalId, refs.user_id]);
      const workCode = (await db.query("SELECT code FROM work_items WHERE tenant_id=$1 AND id=$2", [refs.tenant_id, workId])).rows[0].code;
      const content = { schemaVersion: "regional-pricing-v1", currency: "PLN", entries: [{ id: "regional-labor", priceKind: "labor", referenceCode: workCode, unitCode, unitPrice: 25, validFrom: "2026-01-01", validTo: "2026-12-31", sourceReference: "regional-evidence" }] };
      await db.query("INSERT INTO approved_regional_pricing_snapshots(id,tenant_id,profile_id,revision_id,revision_number,content,content_fingerprint,approved_by)VALUES($1,$2,$3,$4,1,$5,repeat('d',64),$6)", [regionalSnapshotId, refs.tenant_id, regionalId, regionalRevision, JSON.stringify(content), refs.user_id]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      db.release();
    }
    const other = (await pool.query("SELECT t.id tenant_id,u.id user_id FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE t.slug='second'AND u.email='admin@second.odls'")).rows[0];
    const otherUnitId = randomUUID();
    const otherWorkCategoryId = randomUUID();
    const otherMaterialCategoryId = randomUUID();
    const fixtureSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    otherWorkId = randomUUID();
    otherMaterialId = randomUUID();
    await pool.query("INSERT INTO measurement_units(id,tenant_id,code,symbol,display_name,dimension,unit_system,created_by,updated_by)VALUES($1,$2,$3,'u','CPB test unit','custom','custom',$4,$4)", [otherUnitId, other.tenant_id, `CPB_UNIT_${fixtureSuffix}`, other.user_id]);
    await pool.query("INSERT INTO work_categories(id,tenant_id,code,display_name,hierarchy_level,created_by,updated_by)VALUES($1,$2,$3,'CPB test work category',0,$4,$4)", [otherWorkCategoryId, other.tenant_id, `CPB_WORK_CATEGORY_${fixtureSuffix}`, other.user_id]);
    await pool.query("INSERT INTO material_categories(id,tenant_id,code,display_name,hierarchy_level,created_by,updated_by)VALUES($1,$2,$3,'CPB test material category',0,$4,$4)", [otherMaterialCategoryId, other.tenant_id, `CPB_MATERIAL_CATEGORY_${fixtureSuffix}`, other.user_id]);
    await pool.query("INSERT INTO work_items(id,tenant_id,code,display_name,category_id,measurement_unit_id,created_by,updated_by)VALUES($1,$2,$3,'CPB cross-tenant work',$4,$5,$6,$6)", [otherWorkId, other.tenant_id, `CPB_WORK_${fixtureSuffix}`, otherWorkCategoryId, otherUnitId, other.user_id]);
    await pool.query("INSERT INTO materials(id,tenant_id,code,display_name,category_id,measurement_unit_id,created_by,updated_by)VALUES($1,$2,$3,'CPB cross-tenant material',$4,$5,$6,$6)", [otherMaterialId, other.tenant_id, `CPB_MATERIAL_${fixtureSuffix}`, otherMaterialCategoryId, otherUnitId, other.user_id]);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("creates labor and material policy, approves V1, resolves provenance, and compares without mutation", async () => {
    let response = await request("POST", "/api/v1/company-price-books", { code: `COMPANY-${Date.now()}`, title: "Company standard prices", purpose: "Tenant-owned approved policy", currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" });
    expect(response.statusCode, response.body).toBe(201);
    let book = response.json().data;
    bookId = book.id;
    response = await request("POST", `/api/v1/company-price-books/${bookId}/entries`, { entryKind: "labor", workItemId: workId, measurementUnitId: unitId, internalCost: 18, sellingPrice: 30, currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", sourceReference: "company-owner-2026", expectedVersion: book.version });
    expect(response.statusCode, response.body).toBe(201);
    book = response.json().data;
    laborEntryId = book.entries.find((entry: any) => entry.entryKind === "labor").id;
    response = await request("POST", `/api/v1/company-price-books/${bookId}/entries`, { entryKind: "material", materialId, measurementUnitId: unitId, internalCost: 10, sellingPrice: 15, currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", sourceReference: "company-purchase-2026", expectedVersion: book.version });
    expect(response.statusCode, response.body).toBe(201);
    book = response.json().data;
    response = await request("POST", `/api/v1/company-price-books/${bookId}/review`, { expectedVersion: book.version });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().data.ready).toBe(true);
    response = await request("POST", `/api/v1/company-price-books/${bookId}/approve`, { expectedVersion: response.json().data.version });
    expect(response.statusCode, response.body).toBe(200);
    const snapshot = response.json().data;
    firstSnapshotId = snapshot.id;
    firstRevisionId = snapshot.revisionId;
    firstFingerprint = snapshot.contentFingerprint;
    expect(snapshot.content.entries.find((entry: any) => entry.entryKind === "labor")).toMatchObject({ internalCost: 18, sellingPrice: 30, marginAmount: 12, marginPercent: 40 });
    const material = snapshot.content.entries.find((entry: any) => entry.entryKind === "material");
    expect(material).toMatchObject({ internalCost: 10, sellingPrice: 15, marginAmount: 5, marginPercent: 33.3333 });
    response = await request("POST", `/api/v1/company-price-books/${bookId}/resolve`, { snapshotId: firstSnapshotId, entryKind: "labor", workItemId: workId, measurementUnitId: unitId, currency: "PLN", effectiveOn: "2026-06-01" });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().data).toMatchObject({ internalCost: 18, sellingPrice: 30, marginAmount: 12, marginPercent: 40, priceBookSnapshotId: firstSnapshotId, fingerprint: firstFingerprint, entryId: laborEntryId, resolutionVersion: "company-price-resolution-v1" });
    response = await request("POST", `/api/v1/company-price-books/${bookId}/resolve`, { snapshotId: firstSnapshotId, entryKind: "material", materialId, measurementUnitId: unitId, currency: "PLN", effectiveOn: "2026-06-01" });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().data).toMatchObject({ internalCost: 10, sellingPrice: 15, marginAmount: 5, marginPercent: 33.3333, priceBookSnapshotId: firstSnapshotId, fingerprint: firstFingerprint, entryId: material.id });
    const before = (await pool.query("SELECT content_fingerprint FROM approved_company_price_book_snapshots WHERE id=$1", [firstSnapshotId])).rows[0].content_fingerprint;
    response = await request("POST", `/api/v1/company-price-books/${bookId}/regional-comparison`, { snapshotId: firstSnapshotId, entryId: laborEntryId, regionalPricingSnapshotId: regionalSnapshotId, effectiveOn: "2026-06-01" });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().data).toMatchObject({ available: true, companySellingPrice: 30, regionalReference: 25, companyInternalCost: 18, marginAmount: 12, marginPercent: 40, regionalVariance: 5, regionalVariancePercent: 20, mutated: false });
    expect((await pool.query("SELECT content_fingerprint FROM approved_company_price_book_snapshots WHERE id=$1", [firstSnapshotId])).rows[0].content_fingerprint).toBe(before);
  });

  it("rejects incompatible resolution and never falls back to Regional Pricing", async () => {
    for (const payload of [
      { snapshotId: firstSnapshotId, entryKind: "material", materialId: randomUUID(), measurementUnitId: unitId, currency: "PLN", effectiveOn: "2026-06-01" },
      { snapshotId: firstSnapshotId, entryKind: "labor", workItemId: workId, measurementUnitId: unitId, currency: "EUR", effectiveOn: "2026-06-01" },
      { snapshotId: firstSnapshotId, entryKind: "labor", workItemId: workId, measurementUnitId: unitId, currency: "PLN", effectiveOn: "2027-01-01" },
    ]) {
      const response = await request("POST", `/api/v1/company-price-books/${bookId}/resolve`, payload);
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("COMPANY_PRICE_NOT_FOUND");
    }
    const response = await request("POST", `/api/v1/company-price-books/${bookId}/regional-comparison`, { snapshotId: firstSnapshotId, entryId: laborEntryId, regionalPricingSnapshotId: regionalSnapshotId, effectiveOn: "2027-06-01" });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({ available: false, reason: "NO_COMPATIBLE_REGIONAL_REFERENCE", mutated: false });
  });

  it("prevents direct mutation of approved revision content and snapshot", async () => {
    await expect(pool.query("UPDATE company_price_book_entries SET selling_price=999 WHERE id=$1", [laborEntryId])).rejects.toThrow(/APPROVED_COMPANY_PRICE_BOOK_IMMUTABLE/);
    await expect(pool.query("UPDATE company_price_book_revisions SET currency='EUR' WHERE id=$1", [firstRevisionId])).rejects.toThrow(/APPROVED_COMPANY_PRICE_BOOK_REVISION_IMMUTABLE/);
    await expect(pool.query("UPDATE approved_company_price_book_snapshots SET content_fingerprint=repeat('f',64) WHERE id=$1", [firstSnapshotId])).rejects.toThrow(/APPROVED_COMPANY_PRICE_BOOK_SNAPSHOT_IMMUTABLE/);
  });

  it("preserves V1 after a human creates and approves V2", async () => {
    let book = (await request("GET", `/api/v1/company-price-books/${bookId}`)).json().data;
    let response = await request("POST", `/api/v1/company-price-books/${bookId}/revisions`, { expectedVersion: book.version });
    expect(response.statusCode, response.body).toBe(201);
    book = response.json().data;
    const labor = book.entries.find((entry: any) => entry.entryKind === "labor");
    response = await request("PATCH", `/api/v1/company-price-books/${bookId}/entries/${labor.id}`, { expectedVersion: labor.version, sellingPrice: 35 });
    expect(response.statusCode, response.body).toBe(200);
    book = response.json().data;
    response = await request("POST", `/api/v1/company-price-books/${bookId}/review`, { expectedVersion: book.version });
    expect(response.json().data.ready).toBe(true);
    response = await request("POST", `/api/v1/company-price-books/${bookId}/approve`, { expectedVersion: response.json().data.version });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().data.id).not.toBe(firstSnapshotId);
    response = await request("POST", `/api/v1/company-price-books/${bookId}/resolve`, { snapshotId: firstSnapshotId, entryKind: "labor", workItemId: workId, measurementUnitId: unitId, currency: "PLN", effectiveOn: "2026-06-01" });
    expect(response.json().data).toMatchObject({ sellingPrice: 30, fingerprint: firstFingerprint });
  });

  it("enforces permissions, tenant catalog boundaries, and unit compatibility", async () => {
    expect((await request("GET", `/api/v1/company-price-books/${bookId}`, undefined, secondToken)).statusCode).toBe(404);
    expect((await request("POST", `/api/v1/company-price-books/${bookId}/review`, { expectedVersion: 1 }, employeeToken)).statusCode).toBe(403);
    let response = await request("POST", "/api/v1/company-price-books", { code: `BOUNDARY-${Date.now()}`, title: "Boundary validation", currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" });
    const draft = response.json().data;
    for (const reference of [{ entryKind: "labor", workItemId: otherWorkId }, { entryKind: "material", materialId: otherMaterialId }]) {
      response = await request("POST", `/api/v1/company-price-books/${draft.id}/entries`, { ...reference, measurementUnitId: unitId, internalCost: 18, sellingPrice: 30, currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", sourceReference: "invalid-cross-tenant", expectedVersion: draft.version });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.message).toMatch(/COMPANY_PRICE_(WORK|MATERIAL)_NOT_AVAILABLE/);
    }
    const wrongUnit = (await pool.query("SELECT id FROM measurement_units WHERE tenant_id='00000000-0000-4000-8000-000000000001'AND id<>$1 AND status='active'LIMIT 1", [unitId])).rows[0].id;
    response = await request("POST", `/api/v1/company-price-books/${draft.id}/entries`, { entryKind: "labor", workItemId: workId, measurementUnitId: wrongUnit, internalCost: 18, sellingPrice: 30, currency: "PLN", effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", sourceReference: "invalid-unit", expectedVersion: draft.version });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.message).toBe("COMPANY_PRICE_UNIT_MISMATCH");
  });

  it("writes structured audit events for authority mutations", async () => {
    const actions = (await pool.query("SELECT action,metadata FROM audit_logs WHERE entity_type='company_price_book'AND entity_id=$1 ORDER BY occurred_at", [bookId])).rows;
    expect(actions.map((row: any) => row.action)).toEqual(expect.arrayContaining(["company_price_book.created", "company_price_book.entry_created", "company_price_book.reviewed", "company_price_book.approved", "company_price_book.revision_created", "company_price_book.entry_updated"]));
    expect(actions.every((row: any) => row.metadata && typeof row.metadata === "object")).toBe(true);
  });
});
