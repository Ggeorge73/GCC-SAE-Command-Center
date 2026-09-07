const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const note =
  "Compared the fictional source and documented the remaining qualifications.";
const issue = (page, name) =>
  page.locator(".desk-issue-list").getByRole("button", { name });
const tab = (page, name) => page.getByRole("tab", { name });
async function record(page) {
  await page.getByLabel("Review note").fill(note);
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("blocked issue notes survive switching and refresh, with a separate escalation history", async ({
  page,
}) => {
  await issue(page, /Disclosure schedule/).click();
  await page
    .getByLabel("Review note")
    .fill(
      "Instructed deal counsel to issue a corrected schedule; blocked pending version three.",
    );
  await issue(page, /Current authority/).click();
  await issue(page, /Disclosure schedule/).click();
  await expect(page.getByLabel("Review note")).toHaveValue(
    /blocked pending version three/,
  );
  await page.reload();
  await issue(page, /Disclosure schedule/).click();
  await expect(page.getByLabel("Review note")).toHaveValue(
    /blocked pending version three/,
  );
  await page.getByRole("button", { name: "Escalate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Record review", exact: true }),
  ).toBeDisabled();
  await tab(page, "Decision history").click();
  await expect(page.getByRole("tabpanel")).toContainText("Escalated N2");
  await page.getByRole("button", { name: /LS-2402 Litigation/ }).click();
  await expect(page.getByRole("tabpanel")).not.toContainText("Escalated N2");
});

test("Northstar reaches qualified partner approval then a later revision revokes it", async ({
  page,
}) => {
  await record(page);
  await issue(page, /Disclosure schedule/).click();
  await page
    .getByLabel("Review note")
    .fill(
      "Asked Daniel to reconcile the schedule with the supplier consent condition.",
    );
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await tab(page, "Draft & sources").click();
  await page.getByRole("button", { name: "Load next sample revision" }).click();
  await tab(page, /Issues & evidence/).click();
  await expect(page.getByText("Previous · v2")).toBeVisible();
  await expect(page.getByText("Current · v3")).toBeVisible();
  await page
    .getByRole("button", { name: "I inspected the source change" })
    .click();
  await tab(page, "Draft & sources").click();
  await page
    .getByLabel("Draft statement N2")
    .fill(
      "The corrected schedule identifies the written supplier consent as an outstanding closing deliverable.",
    );
  await tab(page, /Issues & evidence/).click();
  await record(page);
  await page
    .getByLabel("Review note")
    .fill(
      "The corrected sample schedule has been received; the reconciliation assignment is complete.",
    );
  await page.getByRole("button", { name: "Resolve task", exact: true }).click();
  await issue(page, /Change-of-control consent/).click();
  await page
    .getByRole("button", { name: "I inspected the source change" })
    .click();
  await record(page);
  await issue(page, /Current authority/).click();
  await page
    .getByLabel("Review note")
    .fill(
      "Exclude this unsupported legal proposition from the internal memorandum pending licensed research.",
    );
  await page
    .getByRole("button", { name: "Exclude proposition from reliance" })
    .click();
  await record(page);
  await tab(page, "Handoff requirements").click();
  await expect(
    page.getByLabel("Client AI-use terms reviewed"),
  ).not.toBeChecked();
  await page.getByLabel("Client AI-use terms reviewed").check();
  await page.getByLabel("Matter team and sharing scope confirmed").check();
  await page
    .getByLabel("Simulated participant")
    .selectOption("Daniel Foster · Associate");
  await expect(
    page.getByRole("button", { name: "Approve internal memorandum" }),
  ).toBeDisabled();
  await page
    .getByLabel("Simulated participant")
    .selectOption("Maya Chen · Partner");
  await page
    .getByRole("button", { name: "Approve internal memorandum" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Internal demo memorandum approved" }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download review memorandum" })
    .click();
  const file = await pending;
  const html = await fs.readFile(await file.path(), "utf8");
  expect(html).toContain("QUALIFIED SCOPE");
  expect(html).toContain("Excluded from reliance");
  expect(html).toContain("Approved internally by Maya Chen");
  await page.reload();
  await tab(page, "Handoff requirements").click();
  await expect(
    page.getByRole("heading", { name: "Internal demo memorandum approved" }),
  ).toBeVisible();
  await tab(page, "Draft & sources").click();
  await page.getByRole("button", { name: "Load next sample revision" }).click();
  await tab(page, "Handoff requirements").click();
  await expect(
    page.getByRole("heading", { name: "Handoff is blocked" }),
  ).toBeVisible();
  await tab(page, "Decision history").click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "internal approval revoked",
  );
});

test("external text checks references, retains unverified status and source dialog is keyboard accessible", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Supply agreement v3", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("§12.3");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await tab(page, "Draft & sources").click();
  await page
    .getByRole("textbox", { name: "External draft", exact: true })
    .fill(
      "Consent required [N1 v3]. Unsupported conclusion [N2 v1]. Another matter [M1 v1].",
    );
  await page.getByRole("button", { name: "Inspect source references" }).click();
  await expect(page.locator(".desk-import-results")).toContainText(
    "support not verified",
  );
  await expect(page.locator(".desk-import-results")).toContainText(
    "Outdated reference",
  );
  await expect(page.locator(".desk-import-results")).toContainText(
    "Source unavailable in this matter",
  );
  await page.getByRole("button", { name: "Load next sample revision" }).click();
  await expect(page.locator(".desk-import-results")).toContainText(
    "Sources changed after inspection",
  );
  await page.getByRole("button", { name: /LS-2402 Litigation/ }).click();
  await expect(page.getByRole("textbox", { name: "External draft", exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("button", { name: /LS-2401 Corporate/ }).click();
  await expect(page.getByRole("textbox", { name: "External draft", exact: true })).toHaveValue(
    /Consent required/,
  );
});

test("draft edits reopen review, target math records assumptions, and reset clears local progress", async ({
  page,
}) => {
  await record(page);
  await tab(page, "Draft & sources").click();
  await page
    .getByLabel("Draft statement N1")
    .fill(
      "The revised internal draft preserves the outstanding consent qualification.",
    );
  await tab(page, "Handoff requirements").click();
  await expect(
    page.getByRole("heading", { name: "Handoff is blocked" }),
  ).toBeVisible();
  await page.getByLabel("Complete packet received").fill("2026-12-30");
  await expect(page.locator(".desk-deadline-fields strong")).toHaveText(
    "2027-01-02",
  );
  await page
    .getByRole("button", { name: "Record target and assumptions" })
    .click();
  await tab(page, "Decision history").click();
  await expect(page.getByRole("tabpanel")).toContainText("2027-01-02");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset saved demo" }).click();
  await page.reload();
  await expect(page.getByLabel("Review note")).toHaveValue("");
  await tab(page, "Decision history").click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "No decisions recorded",
  );
});

test("dashboard and source comparison remain contained on phone and tablet", async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page
        .locator(".matter-desk")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await tab(page, "Draft & sources").click();
  await page.getByRole("button", { name: "Load next sample revision" }).click();
  await tab(page, /Issues & evidence/).click();
  await expect(
    page.getByRole("button", { name: "I inspected the source change" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".matter-desk")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
});
