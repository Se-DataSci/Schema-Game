const { open } = require('./helpers');
(async () => {
  for (const mobile of [true, false]) {
    const { browser, page } = await open({ mobile, save: { banked: 200, hull: 3, cleared: [0,1,2], tut: 'done' } });
    const tag = mobile ? 'phone' : 'desk';
    await page.screenshot({ path: `../shots/${tag}-base.png` });
    await page.click('[data-zone="3"]'); await page.waitForTimeout(1200);
    await page.screenshot({ path: `../shots/${tag}-dive.png` });
    await browser.close();
  }
})();
