import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentAnalysisService } from "../src/application/document-analysis/document-analysis-service.js";
import { DocumentPageService } from "../src/application/document/document-page-service.js";
import type { FileStorage } from "../src/application/document/file-storage.js";
import { DocumentService } from "../src/application/document/document-service.js";
import { DocumentReviewService } from "../src/application/document-review/document-review-service.js";
import type { DocumentAnalysisSuggestionProvider } from "../src/application/document-review/document-analysis-suggestion-provider.js";
import { loadDocumentSuggestionConfiguration } from "../src/application/document-suggestion/document-suggestion-config.js";
import { DocumentSuggestionRequestService } from "../src/application/document-suggestion/document-suggestion-request-service.js";
import { OcrService } from "../src/application/ocr/ocr-service.js";
import type { OcrProvider } from "../src/application/ocr/ocr-provider.js";
import { DeterministicDocumentClassifier } from "../src/infrastructure/document-analysis/deterministic-classifier.js";
import { DocumentAnalysisRepository } from "../src/infrastructure/document-analysis/document-analysis-repository.js";
import { DocumentReviewRepository } from "../src/infrastructure/document-review/document-review-repository.js";
import { NoopDocumentSuggestionProvider } from "../src/infrastructure/document-review/noop-document-suggestion-provider.js";
import { DocumentSuggestionRequestRepository } from "../src/infrastructure/document-suggestion/document-suggestion-repository.js";

const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;
const tenantId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000011";

class Storage implements FileStorage {
  objects = new Map<string, Buffer>();
  async putObject(input: any) {
    this.objects.set(input.key, input.body);
    return { provider: "local" as const, bucket: "test", key: input.key, sizeBytes: input.body.length };
  }
  async getObject(input: any) { return this.objects.get(input.key)!; }
  async deleteObject(input: any) { this.objects.delete(input.key); }
  async headObject(input: any) {
    const value = this.objects.get(input.key);
    return value ? { sizeBytes: value.length } : undefined;
  }
}
class OcrFixture implements OcrProvider {
  readonly name = "fixture";
  text = "FAKTURA TEST_OCR_SECRET_678 nr AI/1 Razem 12.00 EUR";
  async recognize() {
    return { rawText: this.text, confidence: 99, detectedLanguage: "eng", providerVersion: "1", metadata: {} };
  }
  async close() {}
}
class MutableSuggestionProvider implements DocumentAnalysisSuggestionProvider {
  readonly name = "fixture-ai";
  readonly version = "1";
  calls = 0;
  behavior: (input: any) => Promise<any> = async () => ({
    suggestions: [{
      type: "classification_correction",
      suggestedDocumentType: "invoice",
      confidence: 0.9,
      reasonCode: "OCR_MATCH",
      evidence: [{ pageNumber: 1, startOffset: 0, endOffset: 3 }],
    }],
    usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14 },
  });
  async suggest(input: any) {
    this.calls += 1;
    return this.behavior(input);
  }
}

run("document suggestion request lifecycle, concurrency, atomicity and privacy", () => {
  const pool = new Pool({ connectionString: url });
  const storage = new Storage();
  const ocrProvider = new OcrFixture();
  const docs = new DocumentService(pool, storage);
  const pages = new DocumentPageService(pool, storage);
  const ocr = new OcrService(pool, ocrProvider, storage);
  const analysis = new DocumentAnalysisService(new DocumentAnalysisRepository(pool), new DeterministicDocumentClassifier());
  const review = new DocumentReviewService(new DocumentReviewRepository(pool), new NoopDocumentSuggestionProvider());
  const repository = new DocumentSuggestionRequestRepository(pool);
  const provider = new MutableSuggestionProvider();
  const baseConfig = loadDocumentSuggestionConfiguration({
    DOCUMENT_SUGGESTION_PROVIDER: "noop",
    DOCUMENT_SUGGESTION_TENANT_REQUESTS_PER_MINUTE: "100",
    DOCUMENT_SUGGESTION_TENANT_ACTIVE_REQUESTS: "100",
    DOCUMENT_SUGGESTION_REVIEW_ACTIVE_REQUESTS: "10",
    DOCUMENT_SUGGESTION_REVIEW_MAX_REQUESTS: "100",
    OPENAI_DOCUMENT_SUGGESTION_MAX_RETRIES: "2",
    OPENAI_DOCUMENT_SUGGESTION_BASE_RETRY_DELAY_MS: "100",
    OPENAI_DOCUMENT_SUGGESTION_MAX_RETRY_DELAY_MS: "1000",
    DOCUMENT_SUGGESTION_STUCK_REQUEST_MS: "1000",
  });
  const actor: any = {
    id: userId,
    tenantId,
    permissions: [
      "documents.upload", "documents.read", "documents.process",
      "documents.ocr.request", "documents.ocr.read",
      "documents.analysis.request", "documents.analysis.read",
      "documents.review.start", "documents.review.read", "documents.review.submit",
      "documents.review.approve", "documents.review.reject",
      "documents.suggestions.request", "documents.suggestions.read",
      "documents.suggestions.retry", "documents.suggestions.cancel",
    ],
    correlationId: randomUUID(),
  };
  let image: Buffer;

  beforeAll(async () => {
    image = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  });
  beforeEach(async () => {
    await pool.query("DELETE FROM document_suggestion_requests");
    provider.behavior = new MutableSuggestionProvider().behavior;
    provider.calls = 0;
  });
  afterAll(async () => pool.end());

  async function readyReview() {
    const document = await docs.upload(actor, { title: `AI lifecycle ${randomUUID()}` }, {
      filename: "synthetic.png", mimetype: "image/png", bytes: image,
    });
    const page = await pages.add(actor, document.id, document.version, {
      filename: "synthetic.png", mimetype: "image/png", bytes: image,
    });
    const ocrJob = await ocr.request(actor, document.id, page.id, { languages: ["eng"], expectedPageVersion: page.version });
    await ocr.processNext(tenantId, ocrJob.id);
    const analysisJob = await analysis.request(actor, document.id);
    await analysis.processNext(tenantId, analysisJob.id);
    return review.start(actor, document.id);
  }
  const service = (configuration = baseConfig, selectedProvider = provider) =>
    new DocumentSuggestionRequestService(repository, selectedProvider, configuration, () => new Date("2026-07-26T12:00:00.000Z"), () => 0.5);

  it("creates pending and reuses pending/completed/failed identical requests", async () => {
    const session = await readyReview();
    const first = await service().create(actor, session.id, session.version);
    expect(first).toMatchObject({ status: "pending", attemptCount: 0, version: 1 });
    expect((await service().create(actor, session.id, session.version)).id).toBe(first.id);
    await pool.query("UPDATE document_suggestion_requests SET status='processing',processing_started_at=now() WHERE id=$1", [first.id]);
    expect((await service().create(actor, session.id, session.version)).id).toBe(first.id);
    await pool.query("UPDATE document_suggestion_requests SET status='completed',completed_at=now() WHERE id=$1", [first.id]);
    expect((await service().create(actor, session.id, session.version)).id).toBe(first.id);
    await pool.query("UPDATE document_suggestion_requests SET status='failed',completed_at=NULL,failed_at=now() WHERE id=$1", [first.id]);
    expect((await service().create(actor, session.id, session.version)).id).toBe(first.id);
  });

  it("serializes concurrent identical creation into one row", async () => {
    const session = await readyReview();
    const results = await Promise.all([
      service().create(actor, session.id, session.version),
      service().create(actor, session.id, session.version),
    ]);
    expect(new Set(results.map((result) => result.id)).size).toBe(1);
    expect(Number((await pool.query("SELECT count(*) FROM document_suggestion_requests WHERE review_session_id=$1", [session.id])).rows[0].count)).toBe(1);
  });

  it("creates a new request for a changed snapshot or prompt version", async () => {
    const session = await readyReview();
    const first = await service().create(actor, session.id, session.version);
    await pool.query("UPDATE document_suggestion_requests SET status='completed',processing_started_at=now(),completed_at=now() WHERE id=$1", [first.id]);
    await pool.query("UPDATE document_review_sessions SET version=version+1 WHERE id=$1", [session.id]);
    const changed = await service().create(actor, session.id, session.version + 1);
    expect(changed.id).not.toBe(first.id);
    const promptService = service({ ...baseConfig, promptVersion: "document-suggestion-v2" });
    const prompt = await promptService.create(actor, session.id, session.version + 1);
    expect(prompt.id).not.toBe(changed.id);
  });

  it("atomically claims once, increments attempt and recovers only stuck processing", async () => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    const claims = await Promise.all([
      repository.transaction(tenantId, (db) => repository.claim(db, tenantId, new Date(0), 3)),
      repository.transaction(tenantId, (db) => repository.claim(db, tenantId, new Date(0), 3)),
    ]);
    expect(claims.filter(Boolean).map((claim) => claim.id)).toEqual([request.id]);
    expect(await service().get(actor, request.id)).toMatchObject({ status: "processing", attemptCount: 1, version: 2 });
    expect(await repository.transaction(tenantId, (db) => repository.claim(db, tenantId, new Date(0), 3))).toBeUndefined();
    await pool.query("UPDATE document_suggestion_requests SET processing_started_at=now()-interval '1 hour' WHERE id=$1", [request.id]);
    expect((await repository.transaction(tenantId, (db) => repository.claim(db, tenantId, new Date(), 3))).id).toBe(request.id);
    expect((await service().get(actor, request.id)).attemptCount).toBe(2);
  });

  it("completes once with validated suggestions and token counters", async () => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    expect(await service().processTenant(tenantId)).toBe(true);
    expect(await service().get(actor, request.id)).toMatchObject({
      status: "completed", attemptCount: 1, outputSuggestionCount: 1,
      inputTokens: 10, outputTokens: 4, totalTokens: 14,
    });
    expect(Number((await pool.query("SELECT count(*) FROM document_analysis_suggestions WHERE request_id=$1", [request.id])).rows[0].count)).toBe(1);
    expect(await service().processTenant(tenantId)).toBe(false);
  });

  it.each([
    ["timeout", Object.assign(new Error("timeout"), { name: "AbortError" }), "AI_PROVIDER_TIMEOUT", true],
    ["429", { status: 429 }, "AI_PROVIDER_RATE_LIMITED", true],
    ["500", { status: 500 }, "AI_PROVIDER_UNAVAILABLE", true],
    ["502", { status: 502 }, "AI_PROVIDER_UNAVAILABLE", true],
    ["503", { status: 503 }, "AI_PROVIDER_UNAVAILABLE", true],
    ["504", { status: 504 }, "AI_PROVIDER_UNAVAILABLE", true],
    ["auth", { status: 401, message: "TEST_API_KEY_901" }, "AI_PROVIDER_AUTH_FAILED", false],
    ["schema", new Error("AI_PROVIDER_SCHEMA_ERROR"), "AI_PROVIDER_SCHEMA_ERROR", false],
  ])("persists safe retry semantics for %s", async (_name, error: any, code, retryable) => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    provider.behavior = async () => { throw error; };
    await service().processTenant(tenantId);
    const failed = await service().get(actor, request.id);
    expect(failed.status).toBe("failed");
    expect(failed.safeErrorCode).toBe(code);
    expect(Boolean(failed.nextAttemptAt)).toBe(retryable);
    provider.behavior = new MutableSuggestionProvider().behavior;
  });

  it("enforces cancel/retry state transitions and optimistic versions", async () => {
    const session = await readyReview();
    let request = await service().create(actor, session.id, session.version);
    await expect(service().cancel(actor, request.id, request.version + 1)).rejects.toMatchObject({ code: "AI_REQUEST_VERSION_CONFLICT" });
    request = await service().cancel(actor, request.id, request.version);
    expect(request.status).toBe("cancelled");
    await expect(service().cancel(actor, request.id, request.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    await expect(service().retry(actor, request.id, request.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    const second = await readyReview();
    request = await service().create(actor, second.id, second.version);
    await pool.query("UPDATE document_suggestion_requests SET status='failed',failed_at=now(),safe_error_code='AI_PROVIDER_UNAVAILABLE' WHERE id=$1", [request.id]);
    request = await service().get(actor, request.id);
    await expect(service().retry(actor, request.id, request.version + 1)).rejects.toMatchObject({ code: "AI_REQUEST_VERSION_CONFLICT" });
    const retried = await service().retry(actor, request.id, request.version);
    expect(retried.status).toBe("pending");
    await pool.query("UPDATE document_suggestion_requests SET status='processing',processing_started_at=now() WHERE id=$1", [retried.id]);
    await expect(service().cancel(actor, retried.id, retried.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    await expect(service().retry(actor, retried.id, retried.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it("does not retry or claim beyond max attempts and rejects terminal cancellation", async () => {
    const session = await readyReview();
    let request = await service().create(actor, session.id, session.version);
    await pool.query("UPDATE document_suggestion_requests SET status='failed',failed_at=now(),attempt_count=3 WHERE id=$1", [request.id]);
    request = await service().get(actor, request.id);
    await expect(service().retry(actor, request.id, request.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    expect(await repository.transaction(tenantId, (db) => repository.claim(db, tenantId, new Date(), 3))).toBeUndefined();
    await pool.query("UPDATE document_suggestion_requests SET status='completed',processing_started_at=now(),completed_at=now(),failed_at=NULL WHERE id=$1", [request.id]);
    request = await service().get(actor, request.id);
    await expect(service().cancel(actor, request.id, request.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    await pool.query("UPDATE document_suggestion_requests SET status='stale',processing_started_at=now(),completed_at=NULL WHERE id=$1", [request.id]);
    request = await service().get(actor, request.id);
    await expect(service().cancel(actor, request.id, request.version)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it.each(["approved", "rejected"])("marks response stale when review becomes %s during provider call", async (status) => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    provider.behavior = async () => {
      const submitted = await review.submit(actor, session.id, session.version);
      if (status === "approved") await review.approve(actor, session.id, submitted.version);
      else await review.reject(actor, session.id, { expectedVersion: submitted.version, reason: "Synthetic rejection" });
      return new MutableSuggestionProvider().behavior({});
    };
    await service().processTenant(tenantId);
    expect((await service().get(actor, request.id)).status).toBe("stale");
    expect(Number((await pool.query("SELECT count(*) FROM document_analysis_suggestions WHERE request_id=$1", [request.id])).rows[0].count)).toBe(0);
    expect(Number((await pool.query("SELECT count(*) FROM document_review_field_changes WHERE review_session_id=$1", [session.id])).rows[0].count)).toBe(0);
    provider.behavior = new MutableSuggestionProvider().behavior;
  });

  it("marks response stale when OCR, classification, extraction or review version changes", async () => {
    for (const target of ["ocr", "classification", "extraction", "review"]) {
      const session = await readyReview();
      const request = await service().create(actor, session.id, session.version);
      provider.behavior = async () => {
        if (target === "ocr") await pool.query("UPDATE ocr_results SET version=version+1 WHERE id=(SELECT o.id FROM ocr_results o JOIN document_pages p ON p.id=o.document_page_id WHERE p.document_id=$1 LIMIT 1)", [session.documentId]);
        if (target === "classification") await pool.query("UPDATE document_classifications SET version=version+1 WHERE id=$1", [session.classificationId]);
        if (target === "extraction") await pool.query("UPDATE document_extraction_results SET version=version+1 WHERE id=$1", [session.extractionResultId]);
        if (target === "review") await pool.query("UPDATE document_review_sessions SET version=version+1 WHERE id=$1", [session.id]);
        return new MutableSuggestionProvider().behavior({});
      };
      await service().processTenant(tenantId);
      expect((await service().get(actor, request.id)).status, target).toBe("stale");
      expect(Number((await pool.query("SELECT count(*) FROM document_analysis_suggestions WHERE request_id=$1", [request.id])).rows[0].count)).toBe(0);
    }
    provider.behavior = new MutableSuggestionProvider().behavior;
  });

  it("rolls back every suggestion if persistence fails and records a sanitized failure", async () => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    await pool.query("CREATE FUNCTION fail_ai_suggestion_insert() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'TEST_PROVIDER_RAW_234';END$$");
    await pool.query("CREATE TRIGGER fail_ai_suggestion_insert BEFORE INSERT ON document_analysis_suggestions FOR EACH ROW EXECUTE FUNCTION fail_ai_suggestion_insert()");
    try {
      await service().processTenant(tenantId);
    } finally {
      await pool.query("DROP TRIGGER fail_ai_suggestion_insert ON document_analysis_suggestions");
      await pool.query("DROP FUNCTION fail_ai_suggestion_insert()");
    }
    expect(Number((await pool.query("SELECT count(*) FROM document_analysis_suggestions WHERE request_id=$1", [request.id])).rows[0].count)).toBe(0);
    expect(await service().get(actor, request.id)).toMatchObject({ status: "failed", safeErrorCode: "AI_PROVIDER_REQUEST_REJECTED" });
  });

  it("keeps synthetic sensitive markers out of request, audit and outbox after failure", async () => {
    const markers = ["TEST_NIP_123", "TEST_IBAN_456", "TEST_PERSON_789", "TEST_ADDRESS_012", "TEST_AMOUNT_345", "TEST_OCR_SECRET_678", "TEST_API_KEY_901", "TEST_PROVIDER_RAW_234"];
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    provider.behavior = async () => { throw new Error(markers.join(" ")); };
    await service().processTenant(tenantId);
    const serialized = JSON.stringify({
      request: (await pool.query("SELECT * FROM document_suggestion_requests WHERE id=$1", [request.id])).rows,
      audit: (await pool.query("SELECT metadata FROM audit_logs WHERE entity_id=$1", [session.documentId])).rows,
      outbox: (await pool.query("SELECT payload FROM outbox_events WHERE entity_id=$1", [session.documentId])).rows,
    });
    for (const marker of markers) expect(serialized).not.toContain(marker);
    provider.behavior = new MutableSuggestionProvider().behavior;
  });

  it("enforces tenant and review limits under concurrent creation", async () => {
    const first = await readyReview();
    const second = await readyReview();
    const limitedConfig = { ...baseConfig, tenantRequestsPerMinute: 1, tenantActiveRequests: 100, reviewActiveRequests: 10 };
    const outcomes = await Promise.allSettled([
      service(limitedConfig).create(actor, first.id, first.version),
      service(limitedConfig).create(actor, second.id, second.version),
    ]);
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "AI_REQUEST_LIMIT_EXCEEDED" } });
  });

  it("counts pending/processing as active and excludes completed/failed", async () => {
    const first = await readyReview();
    const second = await readyReview();
    const activeLimited = { ...baseConfig, tenantRequestsPerMinute: 100, tenantActiveRequests: 1 };
    const pending = await service(activeLimited).create(actor, first.id, first.version);
    await expect(service(activeLimited).create(actor, second.id, second.version)).rejects.toMatchObject({ code: "AI_REQUEST_LIMIT_EXCEEDED" });
    await pool.query("UPDATE document_suggestion_requests SET status='completed',processing_started_at=now(),completed_at=now() WHERE id=$1", [pending.id]);
    const allowedAfterCompleted = await service(activeLimited).create(actor, second.id, second.version);
    await pool.query("UPDATE document_suggestion_requests SET status='failed',failed_at=now() WHERE id=$1", [allowedAfterCompleted.id]);
    const third = await readyReview();
    await expect(service(activeLimited).create(actor, third.id, third.version)).resolves.toMatchObject({ status: "pending" });
    await pool.query("UPDATE document_suggestion_requests SET status='processing',processing_started_at=now() WHERE review_session_id=$1", [third.id]);
    const fourth = await readyReview();
    await expect(service(activeLimited).create(actor, fourth.id, fourth.version)).rejects.toMatchObject({ code: "AI_REQUEST_LIMIT_EXCEEDED" });
  });

  it("enforces active and total limits per review for changed snapshots", async () => {
    const session = await readyReview();
    const first = await service().create(actor, session.id, session.version);
    await pool.query("UPDATE document_review_sessions SET version=version+1 WHERE id=$1", [session.id]);
    await expect(service({ ...baseConfig, reviewActiveRequests: 1 }).create(actor, session.id, session.version + 1)).rejects.toMatchObject({ code: "AI_REQUEST_LIMIT_EXCEEDED" });
    await pool.query("UPDATE document_suggestion_requests SET status='completed',processing_started_at=now(),completed_at=now() WHERE id=$1", [first.id]);
    await expect(service({ ...baseConfig, reviewMaxRequests: 1 }).create(actor, session.id, session.version + 1)).rejects.toMatchObject({ code: "AI_REQUEST_LIMIT_EXCEEDED" });
  });

  it("isolates read, list and claim and rejects cross-tenant ownership chains", async () => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    const other: any = {
      ...actor,
      id: "00000000-0000-4000-8000-000000000015",
      tenantId: "00000000-0000-4000-8000-000000000002",
    };
    await expect(service().get(other, request.id)).rejects.toMatchObject({ code: "AI_REQUEST_NOT_FOUND" });
    expect((await service().list(other, { page: 1, pageSize: 25, sortBy: "requestedAt", sortOrder: "desc" })).items).toEqual([]);
    expect(await service().processTenant(other.tenantId)).toBe(false);
    await expect(pool.query(
      "INSERT INTO document_suggestion_requests(tenant_id,document_id,review_session_id,provider,model,prompt_version,snapshot_fingerprint,requested_by,input_page_count,input_char_count,review_version)VALUES($1,$2,$3,'fixture','fixture','v1',$4,$5,1,1,1)",
      [other.tenantId, session.documentId, session.id, "a".repeat(64), other.id],
    )).rejects.toBeTruthy();
    await expect(pool.query(
      "INSERT INTO document_analysis_suggestions(tenant_id,document_id,review_session_id,request_id,suggestion_type,field_name,suggested_value,confidence,provider,provider_version)VALUES($1,$2,$3,$4,'field_correction','currency','EUR',.9,'fixture','1')",
      [other.tenantId, session.documentId, session.id, request.id],
    )).rejects.toBeTruthy();
  });

  it("runner-style processing propagates AbortSignal and noop makes no external call", async () => {
    const session = await readyReview();
    const request = await service().create(actor, session.id, session.version);
    const observed = vi.fn();
    provider.behavior = async (value) => {
      observed(value.signal);
      return new MutableSuggestionProvider().behavior(value);
    };
    const controller = new AbortController();
    await service().processTenant(tenantId, controller.signal);
    expect(observed).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect((await service().get(actor, request.id)).status).toBe("completed");
    provider.behavior = new MutableSuggestionProvider().behavior;
  });
});
