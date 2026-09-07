const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("opens an independent Law Suite review experience without legacy product naming", async ({
  page,
}) => {
  await expect(page).toHaveTitle("Law Suite | Evidence before delivery");
  await expect(
    page.getByRole("heading", { name: "Know what stands behind your work." }),
  ).toBeVisible();
  await expect(page.getByText("Interactive demonstration")).toBeVisible();
  await expect(
    page.getByText(/Harvey|Vault|Command Center|Learned Silk/i),
  ).toHaveCount(0);
  await page.getByLabel("Search matters").fill("not a matter");
  await expect(
    page.getByText("No matters match your search.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Search matters").fill("");
  await page
    .getByLabel("Filter matters by practice")
    .selectOption("Litigation");
  await expect(page.locator(".desk-matter-card")).toHaveCount(1);
});

test("blocks unresolved evidence and exports an honest draft packet", async ({
  page,
}) => {
  await page
    .getByRole("button", {
      name: /Current authority check has not been completed/,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Record review", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("No source attached")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export demo packet" }).click();
  const download = await downloadPromise;
  const packet = JSON.parse(await fs.readFile(await download.path(), "utf8"));
  expect(packet.synthetic).toBe(true);
  expect(packet.handoff).toContain("Blocked");
  expect(packet.matter.issues).toHaveLength(3);
  expect(
    packet.matter.issues.find((issue) => issue.id === "N3").source,
  ).toBeNull();
});

test("requires documented review, preserves it across sections, and recalculates when reopened", async ({
  page,
}) => {
  await page.getByRole("button", { name: /LS-2402 Litigation/ }).click();
  await page.getByLabel("Reviewer name").fill("Demo reviewer");
  await page.getByLabel("Review note").fill("short");
  await expect(
    page.getByRole("button", { name: "Record review", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Review note")
    .fill(
      "Compared the sample receipt with the chronology; no deadline calculation performed.",
    );
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Damages assumption needs an explicit qualification/,
    })
    .click();
  await page
    .getByLabel("Review note")
    .fill(
      "Confirmed the draft labels the estimate preliminary and identifies missing invoices.",
    );
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await page.getByRole("tab", { name: "Handoff requirements" }).click();
  await expect(
    page.getByRole("heading", { name: "Ready for supervising lawyer review" }),
  ).toBeVisible();
  await page.getByLabel("Client AI-use terms reviewed").uncheck();
  await expect(
    page.getByRole("heading", { name: "Handoff is blocked" }),
  ).toBeVisible();
  await page.getByLabel("Client AI-use terms reviewed").check();
  await page
    .getByRole("button", { name: "Firm Operations", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Matter Review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ready for supervising lawyer review" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Decision history" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Demo reviewer recorded review of M1",
  );
  await page.getByRole("tab", { name: /Issues & evidence/ }).click();
  await page.getByRole("button", { name: "Reopen review" }).click();
  await page.getByRole("tab", { name: "Handoff requirements" }).click();
  await expect(
    page.getByRole("heading", { name: "Handoff is blocked" }),
  ).toBeVisible();
});

test("keeps matter decisions isolated and represents negative estimated value", async ({
  page,
}) => {
  await page.getByLabel("Reviewer name").fill("Demo reviewer");
  await page
    .getByLabel("Review note")
    .fill(
      "Reviewed the sample clause; closing consent remains a separately tracked deliverable.",
    );
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await page.getByRole("button", { name: /LS-2402 Litigation/ }).click();
  await page.getByRole("tab", { name: "Decision history" }).click();
  await expect(
    page.getByText("No decisions recorded for this matter yet."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Value estimate" }).click();
  await page.getByLabel("Manual baseline (hours)").fill("10");
  await page.getByLabel("Assisted work + review (hours)").fill("20");
  await expect(page.locator(".desk-value-result strong")).toHaveText("$-3,500");
});

test("mobile navigation and review controls remain usable without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Firm Operations", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /LS-2402 Litigation/ }).click();
  await expect(
    page.getByRole("button", { name: "Record review", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".matter-desk")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Firm Operations", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Law Suite Firm Operations" }),
  ).toBeVisible();
});
