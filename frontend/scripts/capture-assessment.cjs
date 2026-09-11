const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
  await page.goto((process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4180') + '/#/applications/practice-desk');
  await page.getByRole('button',{name:'Time & billing',exact:true}).click();
  await page.getByLabel('Time narrative').fill('Synthetic partner review of consent exceptions');
  await page.getByLabel('Minutes worked').fill('90');
  await page.getByRole('button',{name:'Record time',exact:true}).click();
  await page.screenshot({path:path.resolve('../docs/assessment-remediation/practice-desk-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.resolve('../docs/assessment-remediation/practice-desk-mobile.png'),fullPage:true});
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
