const {
  goSection,
  openNavigation,
  openMatter,
} = require("./navigation-helpers");
const { test, expect } = require("@playwright/test");

test("source library searches excerpts, isolates matters, and opens the selected draft", async ({
  page,
}) => {
  await page.goto("/");
  await goSection(page, "Research & Documents");
  const library = page.getByRole("region", {
    name: "Research and document workspace",
  });
  await expect(
    library.getByRole("heading", { name: "Supply agreement", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search sample sources").fill("material customer");
  await expect(page.locator(".research-sources>button")).toHaveCount(1);
  await expect(
    library.getByRole("heading", { name: "Disclosure schedule", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search sample sources").fill("unmatched search");
  await expect(
    page.getByRole("heading", { name: "No sample sources match" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear source search" }).click();
  await page
    .getByRole("complementary", { name: "Source library matters" })
    .getByRole("button", { name: /Meridian commercial dispute/ })
    .click();
  await expect(page.locator(".research-sources")).not.toContainText(
    "Supply agreement",
  );
  await page.getByRole("button", { name: /Draft with context/ }).click();
  await expect(
    page.getByRole("tab", { name: "Draft & sources" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".desk-matter-heading")).toContainText(
    "Meridian commercial dispute",
  );
  await page
    .getByLabel("Draft statement M1")
    .fill("A revised fictional working statement retained across navigation.");
  await goSection(page, "Research & Documents");
  await page.getByRole("button", { name: /Draft with context/ }).click();
  await expect(page.getByLabel("Draft statement M1")).toHaveValue(
    "A revised fictional working statement retained across navigation.",
  );
});

test("portfolio charts follow attorney review and source versions refresh in the library", async ({
  page,
}) => {
  await page.goto("/#/matters/LS-2401/issues");
  await page
    .getByLabel("Review note")
    .fill(
      "Inspected the fictional agreement and noted consent remains outstanding.",
    );
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await goSection(page, "Dashboard");

  await expect(
    page
      .locator(".v-metric")
      .filter({ hasText: "Recorded reviews" })
      .locator("strong"),
  ).toHaveText("1");
  await openMatter(page, "LS-2401", "drafts");
  await page.getByRole("button", { name: "Load next sample revision" }).click();
  await goSection(page, "Research & Documents");
  await page
    .locator(".research-sources")
    .getByRole("button", { name: /Disclosure schedule/ })
    .click();
  await expect(
    page.getByRole("article", { name: "Sample source reader" }),
  ).toContainText("VERSION 3");
  await page.getByRole("button", { name: /Review evidence/ }).click();
  await expect(
    page.getByRole("tab", { name: "Issues & evidence" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("research and administration fit phone, tablet and desktop viewports", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await goSection(page, "Research & Documents");
    await expect(
      page.getByRole("heading", { name: "Research & Documents", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator(".research-workspace")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await goSection(page, "Firm Operations");
    expect(
      await page
        .getByTestId("firm-operations")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
