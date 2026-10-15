// Hull upgrades: Mk II -> Mk III -> Mk IV can be bought in order and unlock the deeper zones.
const { open } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ save: { banked: 2000, hull: 2, cleared: [0,1,2,3], tut: 'done' } });
  await page.click('[data-tab="fab"]');
  await page.waitForTimeout(200);
  ok(!!(await page.$('[data-buy="hull3"]:not([disabled])')), 'Mk III is buyable with Mk II installed');
  await page.click('[data-buy="hull3"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => __ds.S.hull === 3), 'buying Mk III raises the hull to level 3');
  ok(!!(await page.$('[data-buy="hull4"]:not([disabled])')), 'Mk IV is buyable next');
  await page.click('[data-tab="dive"]'); await page.waitForTimeout(200);
  ok(!!(await page.$('[data-zone="4"]:not([disabled])')), 'Glowshroom Forest is unlocked');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
