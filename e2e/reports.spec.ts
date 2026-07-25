import {expect,test} from "@playwright/test";

async function login(page:any,email="admin@demo.odls"){
 await page.goto("/");await page.getByLabel("Tenant").fill("demo");await page.getByLabel("Email").fill(email);await page.getByLabel("Password").fill("DemoPassword!2026");await page.getByRole("button",{name:"Sign in"}).click();
}
test("dashboard ranges, health, reports and CSV work without browser failures",async({page})=>{
 const failures:string[]=[];page.on("console",message=>{if(message.type()==="error")failures.push(message.text());});page.on("response",response=>{if(response.status()>=500)failures.push(`${response.status()} ${response.url()}`);});
 await login(page);await expect(page.getByRole("heading",{name:"Executive Dashboard"})).toBeVisible();
 await page.getByLabel("Dashboard date range").selectOption("7");await expect(page.getByText(/UTC reporting period/)).toBeVisible();await expect(page.getByRole("heading",{name:"Project health"})).toBeVisible();
 await page.getByRole("button",{name:"Reports"}).click();await expect(page.getByRole("heading",{name:"Operational Reports"})).toBeVisible();
 await page.getByLabel("Report selector").selectOption("accounts-receivable");await page.getByText("Overdue only").click();await expect(page.getByRole("table")).toBeVisible();
 await page.getByLabel("Report selector").selectOption("profitability");await expect(page.getByRole("table")).toBeVisible();
 await page.getByLabel("Report selector").selectOption("workload");await expect(page.getByText("Unassigned")).toBeVisible();
 await page.getByLabel("Report selector").selectOption("deadlines");await expect(page.getByRole("table")).toBeVisible();
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Download CSV"}).click();expect((await download).suggestedFilename()).toMatch(/^deadlines(?:-.*)?\.csv$/);
 expect(failures).toEqual([]);
});

test("employee sees only underlying authorized document report",async({page})=>{
 await login(page,"employee@demo.odls");await page.getByRole("button",{name:"Reports"}).click();await expect(page.getByLabel("Report selector").locator("option")).toHaveCount(1);await expect(page.getByLabel("Report selector")).toHaveValue("documents");await expect(page.getByRole("button",{name:"Download CSV"})).toHaveCount(0);
});
