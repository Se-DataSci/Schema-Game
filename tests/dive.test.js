// Full version on a computer: keyboard swimming, every objective, shards, vents, creatures, sonar, mini-map, blackout.
const { open, game } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ save: { banked: 200, hull: 1, tut: 'done' } });
  ok(await page.evaluate(() => document.body.classList.contains('docked')), 'wide screen docks the PDA panel on the right');
  await page.click('[data-zone="0"]'); await page.waitForTimeout(600);
  const W = await page.evaluate(() => __ds.scene('Dive').W);
  ok(W === 4400, 'Full version uses the big zone (' + W + ' px)');
  const x0 = (await page.evaluate(() => __ds.sub)).x;
  await page.keyboard.down('d'); await page.waitForTimeout(1200); await page.keyboard.up('d');
  const x1 = (await page.evaluate(() => __ds.sub)).x;
  ok(x1 - x0 > 80, `D key swims right (${Math.round(x1 - x0)} px)`);
  await page.keyboard.down('a'); await page.waitForTimeout(700); await page.keyboard.up('a');
  ok((await page.evaluate(() => __ds.sub)).face === -1, 'sub turns to face left');
  const o2a = (await game.D(page)).o2; await page.waitForTimeout(1500); const o2b = (await game.D(page)).o2;
  ok(o2b < o2a, 'oxygen drains while exploring');
  // shard pickup
  const before = (await game.D(page)).carried;
  await page.evaluate(() => { const sc = __ds.scene('Dive'), s = sc.shards.find(s => s.active); sc.sub.sprite.setPosition(s.x, s.y); });
  await page.waitForTimeout(200);
  ok((await game.D(page)).carried > before, 'swimming into a data shard collects salvage');
  // air vent refill
  await page.evaluate(() => { __ds.run.D.o2 = 40; const sc = __ds.scene('Dive'), v = sc.vents[0]; sc.sub.sprite.setPosition(v.x, v.y); });
  await page.waitForTimeout(1200);
  ok((await game.D(page)).o2 > 50, 'air vent refills oxygen');
  // sonar
  await page.keyboard.press('q'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => __ds.scene('Dive').sonarT > 3), 'Q fires sonar');
  ok(await page.evaluate(() => !!__ds.scene('Dive').mini), 'mini-map is on in the Full version');
  // creature chases and bites on contact
  await page.evaluate(() => { __ds.run.D.o2 = 100; });
  await game.tp(page, 5, -40); await page.waitForTimeout(700);
  ok((await game.D(page)).o2 < 95, 'creature bites when it touches you');
  // all six objectives
  const kinds = [];
  for (let i = 0; i < 6; i++) kinds.push(await game.clear(page, i, false));
  ok(JSON.stringify(kinds) === JSON.stringify(['scan', 'scan', 'crate', 'scan', 'scan', 'beast']), 'cleared every objective: ' + kinds.join(','));
  ok(!!(await page.$('[data-act="claim"]')), 'claim-bonus button appears');
  await page.click('[data-act="claim"]'); await page.waitForTimeout(500);
  const S = await page.evaluate(() => __ds.S);
  ok(S.cleared.includes(0) && S.slain.includes('leech') && (S.notes['0'] || []).length === 4, 'zone cleared, Leech repelled, 4 notes logged');
  ok((await page.evaluate(() => document.querySelector('.kicker').textContent)) === 'Zone charted', 'result screen');
  // blackout
  await page.click('[data-act="home"]'); await page.waitForTimeout(300);
  await page.click('[data-zone="0"]'); await page.waitForTimeout(500);
  await page.evaluate(() => { __ds.run.D.carried = 40; __ds.run.D.o2 = 0.02; }); await page.waitForTimeout(1200);
  ok((await page.evaluate(() => document.querySelector('.kicker').textContent)) === 'Oxygen depleted', 'running out of oxygen blacks you out');
  ok(await page.evaluate(() => __ds.run.result.lost === 20), 'blackout loses half of carried salvage');
  // switch to the Mobile version on a computer
  await page.click('[data-act="home"]'); await page.waitForTimeout(200);
  await page.click('[data-ver="mobile"]'); await page.click('[data-zone="0"]'); await page.waitForTimeout(500);
  ok((await page.evaluate(() => __ds.scene('Dive').W)) === 2600 && !(await page.evaluate(() => __ds.scene('Dive').mini)), 'version setting switches to the compact zone without a mini-map');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
