import { afterAll, describe, expect, it } from "vitest";
import { buildGateway } from "../src/server.js";
const app = buildGateway("http://127.0.0.1:65535");
afterAll(async () => app.close());
describe("gateway", () => {
  it("reports health", async () => { const response = await app.inject({ method: "GET", url: "/health" }); expect(response.statusCode).toBe(200); });
  it("answers Web preflight for the configured origin",async()=>{const response=await app.inject({method:"OPTIONS",url:"/api/v1/auth/login",headers:{origin:"http://localhost:5173","access-control-request-method":"POST"}});expect(response.statusCode).toBe(204);expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");});
});
