import AxeBuilder from '@axe-core/playwright';
import {test,expect} from './fixtures';
for(const tab of ['overview','season','logbook','soil','pests','compliance','harvest','history']){
 test(`populated parcel tab stays accessible: ${tab}`,async({page})=>{
  await page.goto(`/plots/MP-0001?tab=${tab}`);await expect(page.locator('h1')).toBeVisible();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  const details=page.locator('details').filter({has:page.locator('summary', {hasText:'Chỉnh sửa thông tin'})});
  if(await details.count()){
   await details.locator('summary').click();
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
 });
}
