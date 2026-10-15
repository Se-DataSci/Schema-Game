// Sub Bay cosmetics as a database: preview, buy, equip, query log, locks, and the sub's look updating.
const { open } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ save: { banked: 500, tut: 'done' } });
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(__ds.S)));
  const tex = () => page.evaluate(() => __ds.scene('Base').sub.sprite.texture.key);
  await page.click('[data-tab="bay"]'); await page.waitForTimeout(900);
  ok((await page.evaluate(() => __ds.sub.zoom)) > 2, 'sub comes in close for the Sub Bay');
  ok((await page.evaluate(() => document.querySelector('.rec td:nth-child(2)').textContent)) === '0', 'record shows paint_id = 0');
  const t0 = await tex();
  await page.click('[data-try="coral"]'); await page.waitForTimeout(150);
  let s = await S();
  ok(s.banked === 500 && s.cos.eq.paint === 'std' && (await tex()) !== t0, 'tapping a row previews it on the sub without charging');
  await page.click('[data-buycos="coral"]'); await page.waitForTimeout(150); s = await S();
  ok(s.banked === 420 && s.cos.eq.paint === 'coral', 'buying Coral Red costs 80 and equips it');
  ok(s.qlog[0].startsWith('UPDATE submarine SET paint_id = 2') && s.qlog[1].startsWith('INSERT INTO owned_cosmetic'), 'query log shows INSERT then UPDATE');
  ok((await page.evaluate(() => document.querySelector('.rec td:nth-child(2)').textContent)) === '2', 'record now shows paint_id = 2');
  ok((await page.evaluate(() => document.querySelector('[data-try="levi"] .owned').textContent)) === 'Locked', 'Leviathan Scale locked until the boss is beaten');
  for (const [slot, id] of [['decal', 'key'], ['light', 'cyan'], ['trail', 'bits'], ['fin', 'antenna']]) { await page.click(`[data-slot="${slot}"]`); await page.click(`[data-buycos="${id}"]`); }
  s = await S();
  ok(s.cos.eq.trail === 'bits' && s.cos.eq.fin === 'antenna' && s.banked === 60, 'bought one item per slot; salvage math correct (' + s.banked + ')');
  ok(await page.evaluate(() => __ds.scene('Base').sub.trail.texture.key === 'p-bits'), 'Binary Stream trail is live on the sub');
  await page.reload(); await page.waitForFunction(() => window.__ds && document.querySelector('#sheet .tabs')); s = await S();
  ok(s.cos.eq.light === 'cyan' && s.cos.owned.length === 5, 'cosmetics survive a reload');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
