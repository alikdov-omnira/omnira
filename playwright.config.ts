import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",timeout:60_000,fullyParallel:false,retries:0,
  use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure",screenshot:"only-on-failure"},
  reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
  webServer:[
    {command:"OIDC_ISSUER_URL=https://identity.example.com OIDC_AUDIENCE=odls-api DATABASE_URL=postgresql://odls:odls@127.0.0.1:5432/odls JWT_SECRET=replace-with-a-32-character-development-secret CORE_SERVICE_PORT=3001 services/core-service/node_modules/.bin/tsx services/core-service/src/server.ts",url:"http://127.0.0.1:3001/ready",reuseExistingServer:true,timeout:30_000},
    {command:"OIDC_ISSUER_URL=https://identity.example.com OIDC_AUDIENCE=odls-api GATEWAY_PORT=3000 CORE_SERVICE_URL=http://127.0.0.1:3001 WEB_ORIGIN=http://127.0.0.1:5173 apps/api-gateway/node_modules/.bin/tsx apps/api-gateway/src/server.ts",url:"http://127.0.0.1:3000/ready",reuseExistingServer:true,timeout:30_000},
    {command:"cd apps/web && VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1 node_modules/.bin/vite --host 127.0.0.1",url:"http://127.0.0.1:5173",reuseExistingServer:true,timeout:30_000}
  ]
});
