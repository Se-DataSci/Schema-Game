# Deep Schema: Quick Start

## 1. Play
- **Phone:** open the artifact link in the README. The tutorial starts automatically.
- **Computer:** open `dist/deep-schema.html`, or the artifact link.

| | Mobile version | Full version |
|---|---|---|
| Swim | Drag the thumb-stick (bottom left) | WASD or arrow keys |
| Interact (scan, crate, fight) | Action button (appears when you're close) | E or Space |
| Sonar (shows all targets) | (not in Mobile) | Q |
| Go home and bank salvage | **Ascend** button | **Ascend** button |

Answers and puzzles are always tapped or clicked in the panel. Switch versions or graphics on the Dive map.

## 2. Add a question
Open `src/data/content.js`, find the zone, and add to its `mc: [ ... ]` list:
```js
{ q: "Which normal form removes transitive dependencies?",
  a: "3NF",                       // correct answer
  w: ["1NF", "2NF", "4NF"],       // exactly 3 wrong answers
  why: "3NF: no non-key column depends on another non-key column." },
```
Creature questions use the same format in that zone's `creature.qs`. A creature with `hp: 3` needs at least 3.

## 3. Change the balance
Open `config/config.js`. Every number has a comment. Common ones:
- `oxygen.drainPerSecond`, `oxygen.wrongScanCost`, `oxygen.contactBiteCost`
- `rewards.scanCorrect`
- `sub.maxSpeed`, `sub.acceleration`: how the sub handles
- `profiles.mobile` / `profiles.full`: zone size, number of jellies, shards and vents, mini-map, sonar
- `shop` and `cosmetics`: prices and items (new cosmetic looks are drawn in `src/art/sub.js`)

## 4. Preview and rebuild
```bash
python -m http.server 8000      # then open http://localhost:8000/src/index.html
python build.py                 # writes dist/deep-schema.html
```
To update the published game, ask Claude: "Republish dist/deep-schema.html to my Deep Schema artifact."

## 5. Where to look in the code
| I want to change… | File |
|---|---|
| How the sub moves | `src/entities/Submarine.js` |
| How creatures and jellies chase | `src/entities/Creature.js` |
| What's placed in a zone | `src/scenes/DiveScene.js` |
| Oxygen, rewards, blackout rules | `src/systems/dive.js` |
| Shop and Sub Bay | `src/systems/economy.js` |
| Question / puzzle screens | `src/ui/encounter.js` |
| Tutorial steps | `src/ui/tutorial.js` |
| Databank definitions and the GROUP BY walkthrough | `src/data/studyguide.js` |

## Troubleshooting
| Problem | Fix |
|---|---|
| `src/index.html` is blank | It must be opened through `python -m http.server`, not double-clicked. |
| Blank after editing | Usually a missing comma in `content.js` or `config.js`. Press F12 to see the line. |
| Laggy on a phone | Dive map → Graphics → **Lite**. |
| Progress disappeared | Saves live in each browser; private windows start fresh. |
