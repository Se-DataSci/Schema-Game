# Tests

Automated browser tests built with [Playwright](https://playwright.dev). They load `dist/deep-schema.html`,
serve Phaser from `../vendor/phaser.min.js` (so no internet is needed) and play the game.

## Setup (once)
```bash
npm install playwright
npx playwright install chromium
```

## Run (from this folder)
```bash
node tutorial.test.js
node dive.test.js
```
Each check prints `PASS` or `FAIL`.

| File | What it checks |
|---|---|
| `tutorial.test.js` | The whole tutorial and training dive on a phone (23 checks) |
| `dive.test.js` | Full version: keyboard swimming, shards, vents, sonar, mini-map, creature bites, all six objectives, claim bonus, blackout, switching versions (18) |
| `mobile.test.js` | Mobile version: bottom panel, thumb-stick, action button, camera above the panel, leaving a crate (10) |
| `subbay.test.js` | Sub Bay: preview, buy, equip, query log, saves (11) |
| `databank.test.js` | Study guide covers all 8 zones with no abbreviations, the GROUP BY / HAVING / ORDER BY / LIMIT walkthrough, the dive log (7) |
| `midterm.test.js` | Both practice midterm answer keys in the Databank, midterm scans in dives with their label (4) |
| `hull.test.js` | Hull Mk II → III → IV can be bought in order and unlock deeper zones (5) |
| `graphics.test.js` | Lite graphics switches to the canvas renderer and keeps progress (5) |
| `performance.test.js` | Frame times on a phone screen with the CPU slowed 6× |
| `shots.js` | Saves screenshots to `../shots/` (not a test) |
| `helpers.js` | Shared setup and in-game helpers |

## Note on speed
Headless test browsers have no graphics card, so WebGL is drawn in software and the game runs at
about 8–18 fps there, with the performance test reporting 70–180 ms frames. A real phone or laptop uses its
GPU and is far faster. In the same headless setup the Lite (canvas) renderer holds 60 fps.

Last run (Oct 13, 2026): all checks passed.
