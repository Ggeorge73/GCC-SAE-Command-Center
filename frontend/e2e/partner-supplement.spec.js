const {test,expect}=require('@playwright/test');
test('S01 filtering reports preserves a colleague sample review count',async({page})=>{
 await page.goto('/#/pages/users/reports');const row=page.locator('tbody tr').filter({hasText:'Priya Raman'});
 const original=await row.locator('td').nth(3).innerText();expect(original).toBe('36');
 await page.getByLabel('Search team report').fill('Priya');await expect(row.locator('td').nth(3)).toHaveText(original);
});
test('S02 team comments persist, escape markup and stay local',async({page})=>{
 const requests=[];page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url())});
 await page.goto('/#/pages/profile/teams');await page.getByLabel('Local team comment').fill('<b>QA synthetic team discussion</b>');
 await page.getByRole('button',{name:'Add',exact:true}).click();await page.reload();
 await expect(page.locator('.v-comment').last()).toContainText('<b>QA synthetic team discussion</b>');expect(requests).toEqual([]);
});
test('S03 edit service updates overview, quantity arithmetic and local request notice',async({page})=>{
 await page.goto('/#/ecommerce/products/edit-product');
 await page.getByLabel('Service name',{exact:true}).fill('QA edited service');await page.getByLabel('Illustrative fee (USD)').fill('1250');
 const submit=page.locator('form').getByRole('button').filter({hasText:/Save|Update/});await submit.click();
 await page.goto('/#/ecommerce/products/product-page');await expect(page.locator('.v-service-info')).toContainText('QA edited service');
 await page.getByLabel('Review workstreams').fill('3');await expect(page.locator('.v-service-info')).toContainText('Example total: $3,750');
 await page.getByRole('button',{name:'Prepare request'}).click();await expect(page.getByRole('status')).toContainText('conflicts clearance and agreed scope');
});
test('S04 sample notification dismissal and restoration work',async({page})=>{
 await page.goto('/#/pages/alerts');await page.getByRole('button',{name:'Dismiss Handoff blocked'}).click();
 await expect(page.getByRole('heading',{name:'Handoff blocked',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Restore sample alerts'}).click();await expect(page.getByRole('heading',{name:'Handoff blocked',exact:true})).toBeVisible();
});
test('S05 pricing selection is illustrative and creates no subscription',async({page})=>{
 await page.goto('/#/pages/pricing-page');await page.getByRole('button',{name:'Yearly',exact:true}).click();
 await expect(page.getByRole('button',{name:'Yearly',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Preview Firm',exact:true}).click();await expect(page.getByRole('status')).toContainText('No subscription or payment has been created');
});
test('S06 colleague invitation validates all stages and remains a local draft',async({page})=>{
 await page.goto('/#/pages/users/new-user');
 for(const fields of [{'Full name':'QA Colleague','Work email':'qa@example.test'},{'Practice group':'Corporate','Role':'Associate'},{'Office':'New York','Phone':'2125550100'}]){
  for(const[k,v]of Object.entries(fields))await page.getByLabel(k,{exact:true}).fill(v);
  await page.getByRole('button',{name:'Next',exact:true}).click();
 }
 await page.getByRole('button',{name:'Save local draft'}).click();await expect(page.getByRole('status')).toContainText('No invitation was sent');
 await page.reload();await expect(page.getByLabel('Full name')).toHaveValue('QA Colleague');
});
test('S07 print control invokes printing and the print layout exposes statement total',async({page})=>{
 await page.addInitScript(()=>{window.print=()=>{window.qaPrintCalled=true}});
 await page.goto('/#/pages/account/invoice');await page.getByRole('button',{name:'Print statement'}).click();expect(await page.evaluate(()=>window.qaPrintCalled)).toBe(true);
 await page.emulateMedia({media:'print'});await expect(page.locator('.v-invoice-total')).toBeVisible();
 await test.info().attach('invoice-print-preview',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
test('S08 legal calendar next and previous month show correct day count',async({page})=>{
 await page.goto('/#/applications/calendar');expect(await page.getByRole('button',{name:/^Plan 2026-09-/}).count()).toBe(30);
 await page.getByRole('button',{name:'Next month'}).click();expect(await page.getByRole('button',{name:/^Plan 2026-10-/}).count()).toBe(31);
 await page.getByRole('button',{name:'Previous month'}).click();expect(await page.getByRole('button',{name:/^Plan 2026-09-/}).count()).toBe(30);
});
