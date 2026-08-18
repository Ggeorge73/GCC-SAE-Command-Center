const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("command-center")).toBeVisible();
});

test("opens on the clearly labeled Control Center portfolio surface", async ({ page }) => {
  const commandCenter = page.getByTestId("command-center");

  await expect(commandCenter.getByRole("heading", { name: "GCC Control Center", level: 1 })).toBeVisible();
  await expect(commandCenter.getByText("Sample portfolio data")).toBeVisible();
  await expect(commandCenter.getByText("Weekly active users")).toBeVisible();
  await expect(commandCenter.getByText("Governed interactions")).toBeVisible();
});

test("filters adoption and access data and explains a governance signal", async ({ page }) => {
  await page.getByLabel("Practice group filter").selectOption("Tax");
  await page.getByLabel("Reporting timeframe").selectOption("30 days");

  const adoptionSection = page.locator("section").filter({ hasText: "Adoption by practice" });
  await expect(adoptionSection).toContainText("Tax");
  const trajectorySection = page.locator("section").filter({ hasText: "Adoption trajectory" });
  await expect(trajectorySection).toContainText("30 days");

  const intelligenceSection = page.locator("section").filter({ hasText: "Deployment intelligence" });
  await intelligenceSection.getByRole("button", { name: "Where is governance exposed?" }).click();
  await expect(intelligenceSection.getByRole("heading", { name: "Contractor access is the immediate control gap" })).toBeVisible();
  await expect(intelligenceSection).toContainText("12 open reviews");

  const accessSection = page.locator("section").filter({ hasText: "Identity and access" });
  await accessSection.getByPlaceholder("Search people or practices").fill("Sophie");
  await expect(accessSection.getByRole("row", { name: /Sophie Laurent/ })).toBeVisible();
  await expect(accessSection.getByRole("row", { name: /Amara Okafor/ })).toHaveCount(0);

  await accessSection.getByPlaceholder("Search people or practices").fill("");
  await accessSection.getByLabel("Role filter").selectOption("Contractor");
  await expect(accessSection.locator("tbody tr")).toHaveCount(2);
  await expect(accessSection.getByRole("row", { name: /Emeka Balogun/ })).toBeVisible();
  await expect(accessSection.getByRole("row", { name: /James Wright/ })).toBeVisible();
});

test("turns a recommendation into an action and exports the adoption report", async ({ page }) => {
  const recommendation = page.locator("article").filter({ hasText: "Launch a Tax workflow clinic" });
  await recommendation.getByRole("button", { name: "Start plan" }).click();
  await expect(recommendation.getByRole("button", { name: "Plan started" })).toBeDisabled();
  await expect(page.getByText("Action plan started: Launch a Tax workflow clinic")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-adoption-report").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("gcc-control-center-adoption-report.csv");
  const csv = await fs.readFile(await download.path(), "utf8");
  expect(csv).toContain('"Practice group","Adoption","Advanced workflow depth","Users"');
  expect(csv).toContain('"Tax","54%","39%","88"');
});
