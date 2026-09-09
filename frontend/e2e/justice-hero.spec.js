const { test, expect } = require("@playwright/test");

test("Lady Justice moves, pauses offscreen, honors reduced motion, and survives context loss", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1526, height: 893 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const art = page.locator(".v-justice");
  await expect(art).toHaveAttribute("data-ready", "true");
  await expect(art).toHaveAttribute("data-animation", "still");
  const still = await art.screenshot();
  await page.waitForTimeout(400);
  expect((await art.screenshot()).equals(still)).toBe(true);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.bringToFront();
  await expect(art).toHaveAttribute("data-animation", "running");
  const first = await art.screenshot();
  await page.waitForTimeout(1200);
  expect((await art.screenshot()).equals(first)).toBe(false);
  await page.setViewportSize({ width: 1526, height: 400 });
  await page.locator("main").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(art).toHaveAttribute("data-animation", "paused");
  await page.locator("main").evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(art).toHaveAttribute("data-animation", "running");

  await art
    .locator("canvas")
    .evaluate((el) =>
      el.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(art).toHaveAttribute("data-fallback", "true");
  await expect(
    page.getByAltText("Blue particle Lady Justice, still view"),
  ).toBeVisible();
  await expect(art.locator("canvas")).not.toBeVisible();
});
