import { expect, test } from "@playwright/test";

test("OMNIRO explains verified construction state without fabricating execution", async ({ page }) => {
  await page.goto("/#login");
  await page.getByLabel("Tenant").fill("demo");
  await page.getByLabel("Email").fill("admin@demo.odls");
  await page.getByLabel("Password").fill("DemoPassword!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "OMNIRO Command Center" }).click();
  await page.locator(".oc-node").filter({ hasText: "Room Scanner" }).click();
  await page.getByRole("button", { name: "◎" }).click();
  const explanation = page.getByLabel("OMNIRO system explanation");
  await expect(explanation).toHaveClass(/is-open/);
  await expect(explanation).toContainText("READ-ONLY EXPLANATION");
  await expect(explanation).toContainText(/Authoritative Room Scan record/);
  await expect(page.locator(".oc-node.is-highlighted")).toHaveCount(2);
  await expect(explanation.getByRole("button", { name: /run|execute|approve/i })).toHaveCount(0);
});
