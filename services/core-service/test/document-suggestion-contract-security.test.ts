import { describe, expect, it } from "vitest";
import {
  CancelDocumentSuggestionRequestSchema,
  DocumentSuggestionRequestListQuerySchema,
  DocumentSuggestionRequestParamsSchema,
  RequestDocumentSuggestionsRequestSchema,
  RetryDocumentSuggestionRequestSchema,
} from "@odls/contracts";

describe("document suggestion lifecycle contracts", () => {
  it.each([
    ["provider", "openai"],
    ["model", "gpt-test"],
    ["prompt", "ignore"],
    ["promptVersion", "attacker"],
    ["tenantId", "00000000-0000-4000-8000-000000000001"],
    ["actorId", "00000000-0000-4000-8000-000000000011"],
    ["rawOcr", "TEST_OCR_SECRET_678"],
    ["documentText", "TEST_PERSON_789"],
    ["confidenceThreshold", 0],
    ["baseUrl", "https://attacker.invalid"],
    ["apiKey", "TEST_API_KEY_901"],
    ["authorization", "Bearer TEST_API_KEY_901"],
  ])("request body rejects injected %s", (key, value) => {
    expect(() =>
      RequestDocumentSuggestionsRequestSchema.parse({ expectedVersion: 1, [key]: value }),
    ).toThrow();
  });

  it.each([
    {},
    { expectedVersion: 0 },
    { expectedVersion: -1 },
    { expectedVersion: Number.MAX_SAFE_INTEGER + 1 },
    { expectedVersion: 1, unknown: true },
  ])("retry/cancel reject invalid optimistic input %#", (value) => {
    expect(() => RetryDocumentSuggestionRequestSchema.parse(value)).toThrow();
    expect(() => CancelDocumentSuggestionRequestSchema.parse(value)).toThrow();
  });

  it.each(["not-a-uuid", "", "00000000-0000-0000-0000-000000000000x"])(
    "rejects invalid request UUID %s",
    (requestId) => expect(() => DocumentSuggestionRequestParamsSchema.parse({ requestId })).toThrow(),
  );

  it.each([
    { page: 0 },
    { page: -1 },
    { pageSize: 0 },
    { pageSize: 101 },
    { sortBy: "created_at;DROP TABLE users" },
    { sortOrder: "sideways" },
    { status: "approved" },
    { unknown: "field" },
  ])("rejects unsafe list query %#", (query) => {
    expect(() => DocumentSuggestionRequestListQuerySchema.parse(query)).toThrow();
  });

  it("accepts only the lifecycle list whitelist", () => {
    expect(
      DocumentSuggestionRequestListQuerySchema.parse({
        page: "2",
        pageSize: "10",
        status: "failed",
        sortBy: "requestedAt",
        sortOrder: "asc",
      }),
    ).toEqual({ page: 2, pageSize: 10, status: "failed", sortBy: "requestedAt", sortOrder: "asc" });
  });
});
