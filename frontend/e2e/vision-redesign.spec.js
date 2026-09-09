const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const routes = [
  ...fs
    .readFileSync(
      path.resolve(__dirname, "../src/components/vision/routes.js"),
      "utf8",
    )
    .matchAll(
      /['"](\/(?:dashboards|pages|applications|ecommerce|authentication)[^'"]+)['"]/g,
    ),
].map((m) => m[1]);
for (const width of [390, 768, 1526])
  test(`all handoff routes render and remain contained at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 893 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto("/#" + route);
      await expect(page.locator("main h1").first(), route).toBeVisible();
      await expect(page.locator(".v-sidebar")).toHaveCount(1);
      const sizes = await page
        .locator("main")
        .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
      expect(sizes.scroll, route).toBeLessThanOrEqual(sizes.width + 1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        route,
      ).toBeLessThanOrEqual(width);
    }
    expect(errors).toEqual([]);
  });
test("appearance drawer saves its controls and restores keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open appearance settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Law Suite Configurator" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Violet navigation accent" })
    .click();
  await dialog.getByRole("switch", { name: "Navbar fixed" }).check();
  await dialog
    .getByRole("button", { name: "Transparent", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".vision-app")).toHaveCSS("--v-accent", "#7551ff");
  await expect(page.locator(".vision-app")).toHaveClass(/v-fixed-header/);
  await expect(page.locator(".vision-app")).not.toHaveClass(/v-opaque/);
});
test("intake validates, steps backward, and retains a local draft", async ({
  page,
}) => {
  await page.goto("/#/applications/wizard");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Matter name")).toBeVisible();
  await page.getByLabel("Matter name").fill("Test acquisition");
  await page.getByLabel("Client organization").fill("Fictional Client");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Responsible attorney").fill("Maya Chen");
  await page.getByLabel("Jurisdiction", { exact: true }).fill("Delaware");
  await page
    .getByLabel("Engagement scope")
    .fill("Review fictional supply agreement");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Matter name")).toHaveValue("Test acquisition");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".v-review-fields")).toContainText(
    "Test acquisition",
  );
  await page.getByRole("button", { name: "Save local draft" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Intake draft saved locally",
  );
  await page.reload();
  await expect(page.getByLabel("Matter name")).toHaveValue("Test acquisition");
});
test("calendar and review board changes persist without changing evidence decisions", async ({
  page,
}) => {
  await page.goto("/#/applications/calendar");
  await page
    .getByRole("button", { name: "Plan 2026-09-22", exact: true })
    .click();
  await page.getByLabel("Event title").fill("QA planning checkpoint");
  await page.getByRole("button", { name: "Save planning event" }).click();
  await page.reload();
  await expect(page.locator(".v-calendar-grid")).toContainText(
    "QA planning checkpoint",
  );
  await page.goto("/#/applications/kanban");
  await page
    .getByLabel("Move Inspect consent language")
    .selectOption("Complete");
  await page.reload();
  await expect(
    page
      .locator(".v-panel")
      .filter({
        has: page.getByRole("heading", { name: "Complete", exact: true }),
      }),
  ).toContainText("Inspect consent language");
  await page.goto("/#/matters/LS-2401/issues");
  await expect(
    page.getByRole("button", { name: "Record review", exact: true }),
  ).toBeDisabled();
});
test("account forms validate but do not persist or transmit passwords", async ({
  page,
}) => {
  await page.goto("/#/authentication/sign-up/cover");
  await page.getByLabel("Full name").fill("Fictional Tester");
  await page.getByLabel("Email", { exact: true }).fill("tester@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fictional-password-only");
  await page.getByRole("button", { name: "PREVIEW ACCOUNT REQUEST" }).click();
  await expect(page.getByRole("status")).toContainText(
    "No account was created",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "fictional-password-only",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
});
test("Lady Justice renders a still fallback when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".v-globe")).toHaveAttribute(
    "data-fallback",
    "true",
  );
  await expect(
    page.getByAltText("Blue particle Lady Justice, still view"),
  ).toBeVisible();
});
test("mobile sidebar traps focus and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Law Suite navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "MATTER INTAKE", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".v-sidebar")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toBeFocused();
});
