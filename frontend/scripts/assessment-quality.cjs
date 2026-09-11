const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const routes = ['/dashboards/default','/matters','/matters/LS-2401/issues','/research','/operations','/applications/wizard','/applications/calendar','/applications/kanban','/applications/data-tables','/pages/account/settings','/pages/account/invoice','/authentication/sign-in/basic','/applications/practice-desk'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const result = {at:new Date().toISOString(),baseURL:process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4180',screens:[]};
  for (const route of routes) {
    await page.goto(result.baseURL + '/#' + route);
    await page.locator('main').waitFor();
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    const scan = await page.evaluate(async () => {
      const r = await window.axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
      return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id)};
    });
    result.screens.push({route,...scan});
    console.log(route, scan.violations.map(v=>v.id).join(',') || 'no confirmed violations');
  }
  await fs.writeFile(path.resolve('../docs/assessment-remediation/accessibility.json'),JSON.stringify(result,null,2));
  await browser.close();
  if(result.screens.some(s=>s.violations.length)) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
