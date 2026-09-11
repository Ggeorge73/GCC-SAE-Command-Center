const { test, expect } = require('@playwright/test');
test.use({ reducedMotion: 'reduce' });
test('intake opens exactly one linked matter only after documented reviews', async ({ page }) => {
  await page.goto('/#/applications/wizard');
  await page.getByLabel('Matter name', { exact: true }).fill('Synthetic workflow matter');
  await page.getByLabel('Client organization').fill('Synthetic client');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Responsible attorney').fill('Maya Chen');
  await page.getByLabel('Jurisdiction', { exact: true }).fill('New York');
  await page.getByLabel('Engagement scope').fill('Synthetic contract analysis');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Save local draft' }).click();
  await page.getByRole('button', { name: 'Review saved intake' }).click();
  await page.getByLabel('Related and adverse parties · Synthetic workflow matter').fill('Synthetic counterparties, affiliates and related parties');
  await page.getByLabel('Conflicts search and decision · Synthetic workflow matter').fill('Demo search reviewed; no assumed automatic clearance.');
  await page.getByRole('button', { name: 'Record conflicts review' }).click();
  await page.getByLabel('Engagement terms and approval · Synthetic workflow matter').fill('Synthetic scope, fee basis, exclusions and lead acceptance reviewed.');
  await page.getByRole('button', { name: 'Approve and open demo matter' }).click();
  await expect(page.getByRole('button', { name: 'Open approved demo matter' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Open approved demo matter' }).click();
  await expect(page.getByText('Define the evidence and review questions', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('law-suite-workspace-v2')).matters.filter(m => m.name === 'Synthetic workflow matter').length)).toBe(1);
});
test('time becomes one reviewed printable invoice and stays isolated by matter', async ({ page }) => {
  await page.goto('/#/applications/practice-desk');
  await page.getByRole('button', { name: 'Time & billing', exact: true }).click();
  await page.getByLabel('Time narrative').fill('Synthetic review of the record');
  await page.getByLabel('Minutes worked').fill('90');
  await page.getByLabel('Hourly rate (USD)').fill('350');
  await page.getByRole('button', { name: 'Record time', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('$525.00');
  await page.getByRole('button', { name: 'Prepare draft invoice' }).click();
  await page.getByLabel(/Billing review ·/).fill('Reviewed rates, narrative, scope, and time against the engagement.');
  await page.getByRole('button', { name: 'Record partner billing review' }).click();
  await expect(page.getByText('Reviewed locally — not sent', { exact: true })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export printable invoice' }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/invoice.*html/);
  await page.getByRole('button', { name: 'Prepare draft invoice' }).click();
  await expect(page.getByRole('status')).toContainText('unbilled time');
  await page.getByLabel('Practice matter').selectOption('LS-2402');
  await expect(page.locator('tbody tr')).toHaveCount(0);
});
test('backup validates and restores the same practice ledger into a fresh browser', async ({ page, browser }) => {
  await page.goto('/#/applications/practice-desk');
  await page.getByRole('button', { name: 'Pilot measures', exact: true }).click();
  await page.getByLabel('Observed minutes').fill('42');
  await page.getByRole('button', { name: 'Record observation' }).click();
  await page.getByRole('button', { name: 'Closing & recovery', exact: true }).click();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace backup', exact: true }).click();
  const file = await (await waiting).path();
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto(new URL('/#/applications/practice-desk', page.url()).href);
  await fresh.getByRole('button', { name: 'Closing & recovery', exact: true }).click();
  await fresh.getByLabel('Validate workspace backup').setInputFiles(file);
  await fresh.getByRole('button', { name: 'Replace workspace with validated backup' }).click();
  await fresh.getByRole('button', { name: 'Pilot measures', exact: true }).click();
  await expect(fresh.getByText(/Administration: 42 minutes/)).toBeVisible();
  await context.close();
});
test('practice workflows fit a phone without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/applications/practice-desk');
  for (const tab of ['Intake & opening','Time & billing','Client updates','Research requests','Closing & recovery','Pilot measures']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('starting another intake preserves the earlier saved prospective matter', async ({ page }) => {
  await page.goto('/#/applications/wizard');
  for (const name of ['First synthetic intake', 'Second synthetic intake']) {
    await page.getByLabel('Matter name', { exact:true }).fill(name);
    await page.getByLabel('Client organization').fill('Synthetic client');
    await page.getByRole('button', {name:'Next',exact:true}).click();
    await page.getByLabel('Responsible attorney').fill('Maya Chen');
    await page.getByLabel('Jurisdiction', {exact:true}).fill('New York');
    await page.getByLabel('Engagement scope').fill('Synthetic review scope');
    await page.getByRole('button', {name:'Next',exact:true}).click();
    await page.getByRole('button', {name:'Save local draft',exact:true}).click();
    if (name.startsWith('First')) await page.getByRole('button', {name:'Start another draft',exact:true}).click();
  }
  await page.getByRole('button', {name:'Review saved intake',exact:true}).click();
  await expect(page.getByRole('heading', {name:'First synthetic intake',exact:true})).toBeVisible();
  await expect(page.getByRole('heading', {name:'Second synthetic intake',exact:true})).toBeVisible();
});
