import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import proxy from "@fastify/http-proxy";
import dotenv from "dotenv";
import { join } from "node:path";
import { createLogger, loadPlatformConfiguration } from "@odls/platform";
import type { HealthResponse } from "@odls/contracts";

dotenv.config({ path: join(import.meta.dirname, "../../../../.env") });

export function buildGateway(coreServiceUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:3001"): FastifyInstance<any, any, any, any> {
  const config = loadPlatformConfiguration();
  const app = Fastify({ loggerInstance: createLogger("api-gateway", config.LOG_LEVEL), requestIdHeader: "x-request-id" });
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
  void app.register(helmet);
  app.addHook("onRequest", async (request, reply) => {
    if (request.headers.origin === webOrigin) {
      reply.header("access-control-allow-origin", webOrigin).header("vary", "Origin").header("access-control-allow-credentials", "true");
      if (request.method === "OPTIONS") return reply.header("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS").header("access-control-allow-headers", "authorization,content-type,x-correlation-id,x-request-id").code(204).send();
    }
  });
  app.get<{ Reply: HealthResponse }>("/health", async () => ({ status: "ok", service: "api-gateway", timestamp: new Date().toISOString() }));
  app.get("/ready", async (_request, reply) => {
    try {
      const upstream = await fetch(`${coreServiceUrl}/ready`, { signal: AbortSignal.timeout(1500) });
      if (!upstream.ok) throw new Error("core service is not ready");
      return { status: "ok", service: "api-gateway", timestamp: new Date().toISOString() } satisfies HealthResponse;
    } catch { return reply.code(503).send({ status: "unavailable", service: "api-gateway" }); }
  });
  void app.register(proxy, { upstream: coreServiceUrl, prefix: "/api/v1", rewritePrefix: "/api/v1" });
  return app;
}

const app = buildGateway();
const port = Number(process.env.GATEWAY_PORT ?? 3000);
if (process.env.NODE_ENV !== "test") {
  void app.listen({ host: "0.0.0.0", port });
}
