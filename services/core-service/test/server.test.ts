import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

const app = buildServer();
afterAll(async () => app.close());
describe("core service", () => {
  it("reports health", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
  });
});
