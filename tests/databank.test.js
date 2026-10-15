// Databank: study guide for every zone, the grouping & sorting walkthrough, the dive log, and no abbreviations.
const { open } = require('./helpers');
(async () => {
  const { browser, page, errors, ok } = await open({ mobile: true, save: { banked: 0, hull: 1, tut: 'done', notes: { '0': ['What is the main purpose of a DBMS?'] }, seen: ['leech'] } });
  await page.click('[data-tab="bank"]'); await page.waitForTimeout(200);
  ok((await page.$$('[data-bz]')).length === 8, 'study guide lists all 8 zones');
  ok((await page.$$('.term')).length >= 70, 'study guide has ' + (await page.$$('.term')).length + ' definitions');
  // abbreviations: allow keywords/products that are real words in queries
  const allowed = new Set(['SELECT','FROM','WHERE','GROUP','BY','HAVING','ORDER','LIMIT','OFFSET','ASC','DESC','COUNT','SUM','AVG','MIN','MAX','DISTINCT','NULL','NOT','AND','OR','TRUE','FALSE','IN','IS','EXISTS','JOIN','ON','AS','WITH','LIKE','INSERT','UPDATE','DELETE','CREATE','ALTER','DROP','TABLE','SCHEMA','DATABASE','USE','UNIQUE','CHECK','DEFAULT','PRIMARY','KEY','FOREIGN','RESTRICT','CASCADE','SET','INT','DECIMAL','VARCHAR','DATE','UNSIGNED','AUTO_INCREMENT','COALESCE','STRCMP','TOP','FETCH','FIRST','ROWS','ONLY','SQL','PostgreSQL','MySQL','SQLite']);
  const words = v => page.evaluate(() => { const ds = [...document.querySelectorAll('#sheet details')]; ds.forEach(d => d.open = true); return ds.map(d => d.innerText).join(' '); }).then(t => [...new Set((t.match(/\b[A-Z][A-Z0-9_:]{1,}\b/g) || []))]);
  const g = (await words()).filter(w => !allowed.has(w));
  ok(g.length === 0, 'study guide has no abbreviations ' + JSON.stringify(g));
  await page.click('[data-bv="sql"]'); await page.waitForTimeout(200);
  const clauses = await page.$$eval('[data-sq] summary', s => s.map(x => x.textContent));
  ok(JSON.stringify(clauses) === '["GROUP BY","HAVING","ORDER BY","LIMIT"]', 'walkthrough covers ' + clauses.join(', '));
  ok((await page.$$('table.dt')).length >= 6, 'walkthrough shows the sample table and result tables');
  await page.click('[data-sq="HAVING"] summary'); await page.waitForTimeout(150);
  await page.screenshot({ path: '../shots/databank-having.png', fullPage: false });
  await page.click('[data-bv="log"]'); await page.waitForTimeout(200);
  const log = await page.evaluate(() => document.querySelector('#sheet').textContent);
  ok(/database management system/.test(log) && !/\bDBMS\b/.test(log), 'dive log spells out abbreviations');
  ok(errors.length === 0, 'no page errors ' + JSON.stringify(errors));
  await browser.close();
})();
