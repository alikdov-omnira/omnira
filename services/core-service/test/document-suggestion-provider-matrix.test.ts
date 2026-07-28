import { describe, expect, it, vi } from "vitest";
import { loadDocumentSuggestionConfiguration } from "../src/application/document-suggestion/document-suggestion-config.js";
import { DocumentSuggestionRequestService } from "../src/application/document-suggestion/document-suggestion-request-service.js";
import { OpenAIDocumentAnalysisSuggestionProvider } from "../src/infrastructure/document-suggestion/openai-document-analysis-suggestion-provider.js";

const config = loadDocumentSuggestionConfiguration({
  DOCUMENT_SUGGESTION_PROVIDER: "openai",
  OPENAI_API_KEY: "TEST_API_KEY_901",
  OPENAI_DOCUMENT_SUGGESTION_MODEL: "test-model",
});
const input: any = {
  documentType: "invoice",
  fields: [],
  pages: [{ pageNumber: 1, text: "TEST_OCR_SECRET_678 😀 EUR", textHash: "hash", language: "eng" }],
  maxItems: 100,
  timeoutMs: 1000,
};
const evidence = [{ pageNumber: 1, startOffset: 0, endOffset: 3 }];
const suggestion = {
  type: "field_correction",
  fieldName: "currency",
  suggestedValue: "EUR",
  suggestedDocumentType: null,
  confidence: 0.9,
  reasonCode: "OCR_MATCH",
  evidence,
};
const response = (suggestions: unknown[], extra: Record<string, unknown> = {}) => ({
  output_text: JSON.stringify({ suggestions, ...extra }),
});
const provider = (value: unknown) =>
  new OpenAIDocumentAnalysisSuggestionProvider(config, {
    responses: { create: vi.fn().mockResolvedValue(value) },
  } as any);

describe("OpenAI document suggestion strict response matrix", () => {
  it.each([
    ["empty output", { output_text: "" }],
    ["invalid JSON", { output_text: "{" }],
    ["missing suggestions", { output_text: "{}" }],
    ["unknown top-level property", response([], { raw: "TEST_PROVIDER_RAW_234" })],
    ["unknown suggestion property", response([{ ...suggestion, unknown: true }])],
    ["too many suggestions", response(Array.from({ length: 101 }, () => suggestion))],
    ["too many evidence items", response([{ ...suggestion, evidence: Array.from({ length: 9 }, () => evidence[0]) }])],
    ["suggested value too long", response([{ ...suggestion, suggestedValue: "x".repeat(10001) }])],
    ["reason code too long", response([{ ...suggestion, reasonCode: "x".repeat(81) }])],
    ["confidence below zero", response([{ ...suggestion, confidence: -0.01 }])],
    ["confidence above one", response([{ ...suggestion, confidence: 1.01 }])],
    ["unsupported document type", response([{ ...suggestion, type: "classification_correction", fieldName: null, suggestedValue: null, suggestedDocumentType: "secret" }])],
    ["missing evidence", response([{ ...suggestion, evidence: [] }])],
    ["negative offset", response([{ ...suggestion, evidence: [{ pageNumber: 1, startOffset: -1, endOffset: 2 }] }])],
    ["end before start", response([{ ...suggestion, evidence: [{ pageNumber: 1, startOffset: 3, endOffset: 2 }] }])],
  ])("rejects %s", async (_name, value) => {
    await expect(provider(value).suggest(input)).rejects.toThrow(/^AI_PROVIDER_/);
  });

  it("accepts one exact strict suggestion", async () => {
    await expect(provider(response([suggestion])).suggest(input)).resolves.toMatchObject({
      suggestions: [suggestion],
    });
  });

  it("never includes the API key in validation failures", async () => {
    await expect(provider(response([{ ...suggestion, confidence: 2 }])).suggest(input)).rejects.not.toThrow(
      /TEST_API_KEY_901/,
    );
  });
});

describe("server-side provider result validation and deterministic filtering", () => {
  const service: any = new DocumentSuggestionRequestService(
    {} as any,
    { name: "fixture", version: "1", suggest: vi.fn() } as any,
    config,
  );
  const pages = input.pages;

  it.each([
    ["unsupported field", { ...suggestion, fieldName: "unsupported" }],
    ["unsupported document type", { ...suggestion, type: "classification_correction", fieldName: null, suggestedValue: null, suggestedDocumentType: "secret" }],
    ["missing evidence", { ...suggestion, evidence: [] }],
    ["unknown page", { ...suggestion, evidence: [{ pageNumber: 2, startOffset: 0, endOffset: 1 }] }],
    ["negative offset", { ...suggestion, evidence: [{ pageNumber: 1, startOffset: -1, endOffset: 1 }] }],
    ["end equals start", { ...suggestion, evidence: [{ pageNumber: 1, startOffset: 1, endOffset: 1 }] }],
    ["offset beyond Unicode length", { ...suggestion, evidence: [{ pageNumber: 1, startOffset: 0, endOffset: 999 }] }],
  ])("rejects %s locally", (_name, value) => {
    expect(() => service.validate(value, pages)).toThrow();
  });

  it("keeps the highest-confidence duplicate", () => {
    const low = { ...suggestion, confidence: 0.6 };
    const high = { ...suggestion, confidence: 0.9 };
    expect(service.dedupe([low, high])).toEqual([high]);
  });

  it("uses stable ordering for equal-confidence distinct suggestions", () => {
    const amount = { ...suggestion, fieldName: "totalAmount", suggestedValue: "12.00" };
    expect(service.dedupe([amount, suggestion])).toEqual(service.dedupe([suggestion, amount]));
  });

  it.each([
    [{ name: "AbortError" }, "AI_PROVIDER_TIMEOUT"],
    [{ status: 429 }, "AI_PROVIDER_RATE_LIMITED"],
    [{ status: 500 }, "AI_PROVIDER_UNAVAILABLE"],
    [{ status: 502 }, "AI_PROVIDER_UNAVAILABLE"],
    [{ status: 503 }, "AI_PROVIDER_UNAVAILABLE"],
    [{ status: 504 }, "AI_PROVIDER_UNAVAILABLE"],
    [{ status: 401 }, "AI_PROVIDER_AUTH_FAILED"],
    [{ status: 403 }, "AI_PROVIDER_AUTH_FAILED"],
    [new Error("AI_PROVIDER_SCHEMA_ERROR"), "AI_PROVIDER_SCHEMA_ERROR"],
    [new Error("TEST_PROVIDER_RAW_234"), "AI_PROVIDER_REQUEST_REJECTED"],
  ])("maps provider failure to a safe code", (error, code) => {
    expect(service.safeCode(error)).toBe(code);
    expect(service.safeCode(error)).not.toContain("TEST_PROVIDER_RAW_234");
  });
});
