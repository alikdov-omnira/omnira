import {defineConfig} from "@playwright/test";
const databaseUrl=process.env.E2E_DATABASE_URL??"postgresql://odls:odls@127.0.0.1:5432/odls_e2e";
export default defineConfig({
  testDir:"./e2e",timeout:60_000,fullyParallel:false,workers:1,retries:0,
  use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure",screenshot:"only-on-failure"},
  reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
  webServer:[
    {command:`E2E_DATABASE_URL=${databaseUrl} services/core-service/node_modules/.bin/tsx services/core-service/scripts/e2e-setup.ts prepare && OIDC_ISSUER_URL=https://identity.example.com OIDC_AUDIENCE=odls-api DATABASE_URL=${databaseUrl} JWT_SECRET=replace-with-a-32-character-development-secret CORE_SERVICE_PORT=3101 services/core-service/node_modules/.bin/tsx services/core-service/src/server.ts`,url:"http://127.0.0.1:3101/ready",reuseExistingServer:false,timeout:60_000},
    {command:"OIDC_ISSUER_URL=https://identity.example.com OIDC_AUDIENCE=odls-api GATEWAY_PORT=3100 CORE_SERVICE_URL=http://127.0.0.1:3101 WEB_ORIGIN=http://127.0.0.1:5173 apps/api-gateway/node_modules/.bin/tsx apps/api-gateway/src/server.ts",url:"http://127.0.0.1:3100/ready",reuseExistingServer:false,timeout:30_000},
    {command:"cd apps/web && VITE_API_BASE_URL=http://127.0.0.1:3100/api/v1 node_modules/.bin/vite --host 127.0.0.1",url:"http://127.0.0.1:5173",reuseExistingServer:false,timeout:30_000},
    {command:`DATABASE_URL=${databaseUrl} NOTIFICATION_WORKER_HEALTH_PORT=3202 NOTIFICATION_WORKER_POLL_MS=1000 services/core-service/node_modules/.bin/tsx services/core-service/src/worker.ts`,url:"http://127.0.0.1:3202/ready",reuseExistingServer:false,timeout:30_000}
  ]
});
