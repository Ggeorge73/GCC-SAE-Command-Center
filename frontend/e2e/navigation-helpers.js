const { expect } = require("@playwright/test");
async function openNavigation(page) {
  const sidebar = page.locator(".v-sidebar");
  if (
    page.viewportSize().width < 1100 &&
    !(await sidebar.getAttribute("class")).split(" ").includes("open")
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await expect(sidebar).toBeVisible();
}
async function goSection(page, name) {
  await openNavigation(page);
  const nav = page.getByRole("navigation", { name: "Law Suite sections" });
  const group = nav.getByRole("button", {
    name: name === "Dashboard" ? "Dashboards" : "Legal workspace",
    exact: true,
  });
  if ((await group.getAttribute("aria-expanded")) !== "true")
    await group.click();
  await nav
    .getByRole("button", {
      name: name === "Dashboard" ? "Firm overview" : name,
      exact: true,
    })
    .click();
  if (page.viewportSize().width < 1100)
    await expect(page.locator(".v-sidebar")).not.toHaveClass(/\bopen\b/);
}
async function openMatter(page, id, section) {
  // Read once: the previous view can unmount between count() and getAttribute().
  const previous = await page.evaluate(() => document.querySelector(".desk-tabs [aria-selected=true]")?.id.replace("desk-tab-", "") || "issues");
  await goSection(page, "Matter Review");
  await page.getByRole("button", { name: new RegExp(`^Open ${id} `) }).click();
  const target = section || previous;
  if (target !== "issues") await page.locator(`#desk-tab-${target}`).click();
}
module.exports = { openNavigation, goSection, openMatter };
