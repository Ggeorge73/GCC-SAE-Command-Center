const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
async function calendarEvent(page,title,date='2026-09-22') {
  await page.getByRole('button',{name:'Plan '+date,exact:true}).click();
  await page.getByLabel('Event title').fill(title);
  await page.getByRole('button',{name:'Save planning event'}).click();
}
async function matterIntake(page,name='QA synthetic acquisition') {
 await page.goto('/#/applications/wizard');
 await page.getByLabel('Matter name').fill(name);
 await page.getByLabel('Client organization').fill('QA Fictional Client');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByLabel('Responsible attorney').fill('QA Partner');
 await page.getByLabel('Jurisdiction',{exact:true}).fill('New York');
 await page.getByLabel('Engagement scope').fill('Synthetic contract review');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByRole('button',{name:'Save local draft'}).click();
}
test('P01 intake draft is saved and clearly stops before engagement approval',async({page})=>{
 await matterIntake(page);
 await expect(page.getByRole('status')).toContainText('Conflicts and engagement approval still require firm review');
 await page.reload(); await expect(page.getByLabel('Matter name')).toHaveValue('QA synthetic acquisition');
 await page.goto('/#/applications/data-tables'); await page.getByLabel('Search register').fill('QA synthetic acquisition');
 await expect(page.getByText('No matching matters',{exact:true})).toBeVisible();
});
test('P02 engagement request opens the selected client and matter',async({page})=>{
 await page.goto('/#/ecommerce/orders/order-list');
 const row=page.locator('tbody tr').filter({hasText:'LS-2402'});
 await expect(row).toBeVisible(); const text=await row.innerText();
 await test.info().attach('selected-row',{body:text,contentType:'text/plain'});
 await row.getByRole('button',{name:'Open →'}).click();
 await expect(page.locator('.v-order-detail')).toContainText('Meridian');
});
test('P03 separate tabs preserve independent matter review notes',async({page,context})=>{
 await page.goto('/#/matters/LS-2401/issues');
 const second=await context.newPage(); await second.goto('/#/matters/LS-2402/issues');
 await page.getByLabel('Review note').fill('QA first tab Northstar review must remain saved.');
 await expect(page.getByLabel('Review note')).toHaveValue('QA first tab Northstar review must remain saved.');
 await second.getByLabel('Review note').fill('QA second tab Meridian review must remain saved.');
 await page.reload();
 await expect(page.getByLabel('Review note')).toHaveValue('QA first tab Northstar review must remain saved.');
});
test('P04 concurrent calendar tabs retain both planning events',async({page,context})=>{
 await page.goto('/#/applications/calendar');
 const second=await context.newPage(); await second.goto('/#/applications/calendar');
 await calendarEvent(page,'QA first tab event');
 await calendarEvent(second,'QA second tab event','2026-09-23');
 await page.reload(); await expect(page.locator('.v-calendar-grid')).toContainText('QA first tab event');
 await expect(page.locator('.v-calendar-grid')).toContainText('QA second tab event');
});
test('P05 upcoming event list remains actionable after eight earlier events',async({page})=>{
 await page.goto('/#/applications/calendar');
 for(let i=0;i<6;i++) await calendarEvent(page,'QA early planning '+i,'2026-09-01');
 await calendarEvent(page,'QA later event needs removal','2026-09-30');
 await page.reload();
 await expect(page.getByRole('button',{name:'Remove QA later event needs removal'})).toBeVisible();
});
test('P06 browser storage denial gives a visible matter-review warning',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('QA storage denied','QuotaExceededError')}});
 await page.goto('/#/matters/LS-2401/issues');
 await page.getByLabel('Review note').fill('Synthetic note under unavailable browser storage');
 await expect(page.getByText(/Browser storage unavailable/)).toBeVisible();
});
test('P07 valid JSON with wrong calendar schema recovers instead of blanking the app',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('law-suite-vision-calendar','{"unexpected":true}'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/applications/calendar');
 await test.info().attach('page-errors',{body:JSON.stringify(errors),contentType:'application/json'});
 await expect(page.getByRole('button',{name:'Plan 2026-09-22',exact:true})).toBeVisible();
});
test('P08 new service is available in service overview after save',async({page})=>{
 await page.goto('/#/ecommerce/products/new-product');
 for(const fields of [
  {'Service name':'QA bespoke employment review','Practice area':'Employment'},
  {'Required documents':'Synthetic policy','Scope and exclusions':'Fictional review only'},
  {'Service lead':'QA Partner','Delivery format':'Memorandum'},
  {'Illustrative fee (USD)':'1200','Fee assumptions':'Fixed fee synthetic example'}]){
   for(const [label,value]of Object.entries(fields))await page.getByLabel(label,{exact:true}).fill(value);
   await page.getByRole('button',{name:fields['Fee assumptions']?'Save local draft':'Next',exact:true}).click();
 }
 await expect(page.getByRole('status')).toContainText('Service proposal saved locally');
 await page.goto('/#/ecommerce/products/product-page');
 await expect(page.locator('.v-service-info')).toContainText('QA bespoke employment review');
});
test('P09 intake rejects whitespace-only required values',async({page})=>{
 await page.goto('/#/applications/wizard');
 await page.getByLabel('Matter name').fill('   ');await page.getByLabel('Client organization').fill('   ');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.getByLabel('Matter name')).toBeVisible();
});
test('P10 filtered register CSV contains only matching records',async({page})=>{
 await page.goto('/#/applications/data-tables');await page.getByLabel('Search register').fill('LS-2402');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await pending;const csv=await fs.readFile(await download.path(),'utf8');
 await test.info().attach('register.csv',{body:csv,contentType:'text/csv'});
 expect(csv).toContain('Meridian');expect(csv).not.toContain('Northstar');expect(csv.trim().split('\r\n')).toHaveLength(2);
});
test('P11 sample invoice line items and total reconcile',async({page})=>{
 await page.goto('/#/pages/account/invoice');
 const rows=await page.locator('.v-invoice tbody tr').allTextContents();
 let total=0;
 for(const row of await page.locator('.v-invoice tbody tr').all()){
  const v=await row.locator('td').allTextContents();const parse=x=>Number(x.replace(/[$,]/g,''));
  expect(parse(v[1])*parse(v[2])).toBe(parse(v[3]));total+=parse(v[3]);
 }
 expect(total).toBe(4800);await expect(page.locator('.v-invoice-total h2')).toContainText('$4,800');
 await test.info().attach('invoice-lines',{body:JSON.stringify(rows),contentType:'application/json'});
});
for(const mode of ['sign-in','sign-up'])for(const layout of ['basic','cover','illustration'])
test(`P12 ${mode} ${layout} is a non-authenticating preview with no password transmission`,async({page})=>{
 const requests=[];page.on('request',r=>{if(r.method()!=='GET')requests.push({url:r.url(),body:r.postData()})});
 await page.goto(`/#/authentication/${mode}/${layout}`);
 if(mode==='sign-up')await page.getByLabel('Full name').fill('QA Fictional User');
 await page.getByLabel('Email',{exact:true}).fill('qa@example.test');
 await page.getByLabel('Password',{exact:true}).fill('QA-Synthetic-Only-731');
 await page.getByRole('button',{name:mode==='sign-up'?'PREVIEW ACCOUNT REQUEST':'PREVIEW SIGN IN'}).click();
 await expect(page.getByRole('status')).toContainText(mode==='sign-up'?'No account was created':'Live authentication is not connected');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('QA-Synthetic-Only-731');expect(requests).toEqual([]);
 await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
});
test('P13 local profile and notification preferences survive refresh',async({page})=>{
 await page.goto('/#/pages/account/settings');await page.getByLabel('Full name').fill('QA Fictional Partner');
 await page.getByRole('switch',{name:'Assignment reminders'}).uncheck();
 await page.getByRole('button',{name:'Save local profile'}).click();await page.reload();
 await expect(page.getByLabel('Full name')).toHaveValue('QA Fictional Partner');
 await expect(page.getByRole('switch',{name:'Assignment reminders'})).not.toBeChecked();
});
test('P14 review board task creation and movement persist',async({page})=>{
 await page.goto('/#/applications/kanban');await page.getByLabel('New coordination task').fill('QA synthetic client callback');
 await page.getByRole('button',{name:'Add task'}).click();await page.getByLabel('Move QA synthetic client callback').selectOption('Complete');
 await page.reload();await expect(page.getByLabel('Move QA synthetic client callback')).toHaveValue('Complete');
});
test('P15 all calendar events survive fresh-page reload and can be removed within first eight',async({page})=>{
 await page.goto('/#/applications/calendar');await calendarEvent(page,'QA removable synthetic event');await page.reload();
 await page.getByRole('button',{name:'Remove QA removable synthetic event'}).click();await page.reload();
 await expect(page.locator('.v-calendar-grid')).not.toContainText('QA removable synthetic event');
});
