async function openNavigation(page) {
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
}
async function goSection(page, name) {
  await openNavigation(page);
  if (name === "Firm Operations") {
    const details = page.locator(".workspace-administration");
    if (!(await details.getAttribute("open").then((value) => value !== null)))
      await details.locator("summary").click();
  }
  await page
    .getByRole("navigation", { name: "Law Suite sections" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function openMatter(page, id, section) {
  const selected = page.locator(".desk-tabs [aria-selected=true]");
  const previous = (await selected.count())
    ? (await selected.getAttribute("id")).replace("desk-tab-", "")
    : "issues";
  await goSection(page, "Matter Review");
  await page.getByRole("button", { name: new RegExp(`^Open ${id} `) }).click();
  const target = section || previous;
  if (target !== "issues") await page.locator(`#desk-tab-${target}`).click();
}
module.exports = { goSection, openNavigation, openMatter };
