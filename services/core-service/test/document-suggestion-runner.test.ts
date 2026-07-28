import { describe, expect, it, vi } from "vitest";
import { DocumentSuggestionRunner } from "../src/application/document-suggestion/document-suggestion-runner.js";
import { createDocumentSuggestionProvider } from "../src/infrastructure/document-suggestion/document-suggestion-provider-factory.js";

describe("document suggestion runner isolation and shutdown", () => {
  const pool: any = {
    query: vi.fn().mockResolvedValue({ rows: [{ id: "tenant-a" }, { id: "tenant-b" }] }),
  };

  it("runOnce processes bounded requests for every tenant", async () => {
    const processTenant = vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const runner = new DocumentSuggestionRunner(pool, { processTenant } as any, 2);
    await expect(runner.runOnce()).resolves.toEqual({ processed: 2 });
    expect(processTenant.mock.calls.map((call) => call[0])).toEqual(["tenant-a", "tenant-a", "tenant-b", "tenant-b"]);
  });

  it("a request-level failure result does not prevent the next tenant", async () => {
    const processTenant = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const runner = new DocumentSuggestionRunner(pool, { processTenant } as any, 1);
    await expect(runner.runOnce()).resolves.toEqual({ processed: 1 });
    expect(processTenant).toHaveBeenCalledTimes(2);
  });

  it("passes one AbortSignal and graceful shutdown aborts it", async () => {
    let observed: AbortSignal | undefined;
    let release: (() => void) | undefined;
    const processTenant = vi.fn(async (_tenant: string, signal: AbortSignal) => {
      observed = signal;
      await new Promise<void>((resolve) => {
        release = resolve;
        signal.addEventListener("abort", () => resolve(), { once: true });
      });
      return false;
    });
    const runner = new DocumentSuggestionRunner({ query: vi.fn().mockResolvedValue({ rows: [{ id: "tenant-a" }] }) } as any, { processTenant } as any);
    const active = runner.runOnce();
    await vi.waitFor(() => expect(observed).toBeDefined());
    runner.shutdown();
    await active;
    expect(observed?.aborted).toBe(true);
    release?.();
  });

  it("default noop selection does not instantiate a network provider", () => {
    const selected = createDocumentSuggestionProvider({});
    expect(selected.config.provider).toBe("noop");
    expect(selected.provider.name).toBe("omnira-noop");
  });

  it("unknown provider fails before worker polling starts", () => {
    expect(() => createDocumentSuggestionProvider({ DOCUMENT_SUGGESTION_PROVIDER: "remote" })).toThrow(
      "Invalid DOCUMENT_SUGGESTION_PROVIDER",
    );
  });
});
