// Frame times on a simulated slow phone (CPU slowed 6x).
const { open } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ mobile: true, save: { banked: 100, hull: 4, cleared: [0,1,2,3,4,5,6], tut: 'done' } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const measure = () => page.evaluate(() => new Promise(res => { const ts = []; let n = 0; const f = t => { ts.push(t); if (++n < 90) requestAnimationFrame(f); else { const d = []; for (let i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]); d.sort((a, b) => a - b); res({ avg: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1), p90: +d[Math.floor(d.length * 0.9)].toFixed(1) }); } }; requestAnimationFrame(f); }));
  console.log('base', JSON.stringify(await measure()));
  for (const z of [0, 3, 7]) {
    await page.click(`[data-zone="${z}"]`); await page.waitForTimeout(800);
    console.log('zone', z, JSON.stringify(await measure()));
    await page.click('[data-act="ascend"]'); await page.waitForTimeout(400); await page.click('[data-act="home"]'); await page.waitForTimeout(300);
  }
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
