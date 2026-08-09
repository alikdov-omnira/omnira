import { copyFile, mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import pg from "pg";

const output = "artifacts/omniro-stage-2a-functional";

async function login(page: Page, target = "#omniro") {
  await page.goto("/#login");
  await page.getByLabel("Tenant").fill("demo");
  await page.getByLabel("Email").fill("admin@demo.odls");
  await page.getByLabel("Password").fill("DemoPassword!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Executive Dashboard" })).toBeVisible();
  await page.goto(`/${target}`);
  await expect(page.locator(".oc-shell")).toBeVisible();
}

async function select(page: Page, label: string) {
  await page.locator(".oc-node").filter({ hasText: label }).click();
}

test.describe.serial("OMNIRO Stage 2A review artifacts", () => {
  test.setTimeout(120_000);
  test.beforeAll(async () => {
    await mkdir(output, { recursive: true });
    const pool = new pg.Pool({ connectionString: process.env.E2E_DATABASE_URL ?? "postgresql://odls:odls@127.0.0.1:5432/odls_e2e" });
    await pool.query("UPDATE room_scan_sessions SET status='ready_for_approval', version=version+1, updated_at=now() WHERE id='10000000-0000-4000-8000-000000000010'");
    await pool.end();
  });

  test("captures A-L from the production implementation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page);
    await page.screenshot({ path: `${output}/A-operational-command-center.png`, fullPage: true });
    await select(page, "Technical Assignment");
    await page.screenshot({ path: `${output}/B-focus-system-view.png`, fullPage: true });
    await select(page, "Room Scanner");
    await page.screenshot({ path: `${output}/C-scanner-selected.png`, fullPage: true });
    await page.getByRole("button", { name: /ENTER AGENT WORKSPACE/ }).click();
    await page.screenshot({ path: `${output}/D-scanner-real-workspace.png`, fullPage: true });
    await page.getByRole("button", { name: /Return to system/ }).click();
    await page.screenshot({ path: `${output}/E-human-approval-required.png`, fullPage: true });
    await page.getByRole("button", { name: "◎" }).click();
    await page.screenshot({ path: `${output}/F-orchestrator-topology-explanation.png`, fullPage: true });
    await page.getByRole("button", { name: "◎" }).click();
    await select(page, "Technical Assignment");
    await page.getByRole("button", { name: /ENTER AGENT WORKSPACE/ }).click();
    await page.screenshot({ path: `${output}/G-technical-assignment-workspace.png`, fullPage: true });
    await page.getByRole("button", { name: /Return to system/ }).click();
    await select(page, "Design Project");
    await page.getByRole("button", { name: /ENTER AGENT WORKSPACE/ }).click();
    await page.screenshot({ path: `${output}/H-design-project-workspace.png`, fullPage: true });
    await page.getByRole("button", { name: /Return to system/ }).click();
    await page.goto("/#omniro/project/00000000-0000-4000-8000-000000000071/focus/commercial-estimate");
    await expect(page.getByLabel("Commercial Estimate focus view")).toBeVisible();
    await page.screenshot({ path: `${output}/I-unavailable-later-chain.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#omniro");
    await page.screenshot({ path: `${output}/J-mobile-operational-view.png`, fullPage: true });
    await select(page, "Room Scanner");
    await page.screenshot({ path: `${output}/K-mobile-scanner-approval.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?renderer=fallback#omniro");
    await expect(page.locator(".oc-static-core")).toBeVisible();
    await page.screenshot({ path: `${output}/L-fallback-reduced-motion.png`, fullPage: true });
  });

  test("records M continuous interaction", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: output, size: { width: 1280, height: 800 } } });
    const page = await context.newPage();
    await login(page);
    await select(page, "Room Scanner");
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: /ENTER AGENT WORKSPACE/ }).click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: /Return to system/ }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: /REVIEW AUTHORITY/ }).click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: /Return to system/ }).click();
    await page.getByRole("button", { name: "◎" }).click();
    await page.waitForTimeout(1200);
    const video = page.video();
    await context.close();
    if (!video) throw new Error("Chromium video recording was not created");
    await copyFile(await video.path(), `${output}/M-operational-focus-scanner-workspace-approval-orchestrator.webm`);
  });
});
