// Practice midterm: answer key in the Databank, questions show up in dives with a label, data is well-formed.
const { open, game } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ mobile: true, save: { banked: 0, hull: 1, tut: 'done' } });
  if (await page.$('#startBtn:not([hidden])')) { await page.click('#startBtn'); await page.waitForTimeout(500); }
  await page.click('[data-tab="bank"]'); await page.click('[data-bv="mid"]'); await page.waitForTimeout(150);
  ok((await page.$$('.term')).length === 48, 'Databank shows the exam format plus both answer keys (24 + 23)');
  await page.click('[data-tab="dive"]'); await page.click('[data-zone="0"]'); await page.click('[data-dive="0"]'); await page.waitForTimeout(700);
  const mts = await page.evaluate(() => __ds.run.D.objectives.filter(o => o.n).length);
  ok(mts >= 1, `a dive includes ${mts} practice midterm scan(s)`);
  const i = await page.evaluate(() => __ds.run.D.objectives.findIndex(o => o.n));
  await game.tp(page, i); await page.waitForTimeout(250); await page.click('#act'); await page.waitForTimeout(150);
  const kick = await page.evaluate(() => [...document.querySelectorAll('.kicker')].map(k => k.textContent).join(' | ') + ' / active: ' + (__ds.run.D.active && __ds.run.D.active.kind));
  console.log(kick);
  ok(/Practice midterm/.test(kick), 'the scan is labeled "Practice midterm"');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
