// Shared test setup: serves Phaser from vendor/ instead of the CDN, blocks web fonts.
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
async function open({ file = 'dist/deep-schema.html', mobile = false, save = null } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route('**/phaser.min.js', r => r.fulfill({ path: path.join(ROOT, 'vendor/phaser.min.js'), contentType: 'application/javascript' }));
  await page.route('**/fonts.*/**', r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(ROOT, file));
  if (save) { await page.evaluate(s => localStorage.setItem('deep-schema-v1', JSON.stringify(s)), save); await page.reload(); }
  await page.waitForFunction(() => window.__ds && document.querySelector('#sheet .tabs, #sheet .kicker'), null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  return { browser, page, errors, ok };
}
module.exports = { open, ROOT };

// ---- in-game helpers ----
const game = {
  // move the sub next to objective #i (or onto a point) instantly
  tp: (page, i, dx = -70) => page.evaluate(([i, dx]) => { const sc = __ds.scene('Dive'), o = __ds.run.D.objectives[i]; const x = o.kind === 'beast' ? sc.creature.x : o.x, y = o.kind === 'beast' ? sc.creature.y : o.y; sc.sub.sprite.setPosition(x + dx, y); sc.sub.vx = sc.sub.vy = 0;
    // park jellies near the target so a sting can't knock the sub out of range mid-test
    for (const h of sc.hazards) if (Math.hypot(h.x - x, h.y - y) < 500) { h.home = { x: 20, y: 20 }; h.sprite.setPosition(20, 20); } }, [i, dx]),
  tpXY: (page, x, y) => page.evaluate(([x, y]) => { const sc = __ds.scene('Dive'); sc.sub.sprite.setPosition(x, y); sc.sub.vx = sc.sub.vy = 0; }, [x, y]),
  answer: (page, right = true) => page.evaluate(right => { const o = __ds.run.D.active, q = o.kind === 'beast' ? o.qs[o.qi] : o; const k = right ? q.opts.indexOf(q.a) : q.opts.findIndex(x => x !== q.a); document.querySelector(`[data-opt="${k}"]`).click(); }, right),
  solveCrate: page => page.evaluate(() => { const o = __ds.run.D.active;
    if (o.type === 'sort') { while (o.left.length) { const k = o.left[0]; document.querySelector(`[data-chip="${k}"]`).click(); document.querySelector(`[data-bin="${o.items[k].b}"]`).click(); } }
    else { while (o.placedRows.length < o.blocks.length) { const want = o.blocks[o.placedRows.length].trim(); const k = o.yard.find(i => o.blocks[i].trim() === want); document.querySelector(`[data-blk="${k}"]`).click(); } } }),
  D: page => page.evaluate(() => { const D = __ds.run.D; return D && { o2: D.o2, carried: D.carried, active: D.active && D.active.kind, done: D.objectives.map(o => o.done), zone: D.zone }; }),
  // play one objective to completion (keyboard on desktop, button on touch)
  async clear(page, i, touch) {
    await this.tp(page, i); await page.waitForTimeout(250);
    if (touch) await page.click('#act'); else await page.keyboard.press('e');
    await page.waitForTimeout(150);
    const kind = await page.evaluate(() => __ds.run.D.active && __ds.run.D.active.kind);
    if (!kind) { const why = await page.evaluate(i => { const sc = __ds.scene('Dive'), o = __ds.run.D.objectives[i]; return { i, done: o.done, kind: o.kind, cr: sc.creature && sc.creature.state, near: sc.near && sc.near.kind, sub: [sc.sub.sprite.x|0, sc.sub.sprite.y|0], o2: __ds.run.D.o2 }; }, i); throw new Error('could not open objective ' + JSON.stringify(why)); }
    if (kind === 'crate') { await this.solveCrate(page); }
    else if (kind === 'scan') { await this.answer(page, true); }
    else if (kind === 'beast') { for (let g = 0; g < 6; g++) { await this.answer(page, true); await page.waitForTimeout(60); if (await page.$('#again')) await page.click('#again'); else break; } }
    await page.waitForTimeout(100);
    await page.click('[data-enc="close"]'); await page.waitForTimeout(150);
    return kind;
  }
};
module.exports.game = game;
