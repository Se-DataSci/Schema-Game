// Graphics setting: Lite switches to the canvas renderer, keeps progress, and runs a dive.
const { open } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ mobile: true, save: { banked: 77, hull: 1, tut: 'done' } });
  ok(await page.evaluate(() => __ds.game.renderer.type === Phaser.WEBGL), 'Full effects uses WebGL');
  await page.click('[data-gfx="lite"]'); await page.waitForFunction(() => window.__ds && document.querySelector('#sheet .tabs'), null, { timeout: 15000 }); await page.waitForTimeout(400);
  ok(await page.evaluate(() => __ds.game.renderer.type === Phaser.CANVAS), 'Lite reloads with the canvas renderer');
  ok(await page.evaluate(() => __ds.S.banked === 77 && __ds.S.settings.graphics === 'lite'), 'progress kept after the reload');
  await page.click('[data-zone="0"]'); await page.waitForTimeout(800);
  await page.screenshot({ path: '../shots/lite-dive.png' });
  ok(await page.evaluate(() => !!__ds.scene('Dive').sub), 'a dive runs in Lite');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
