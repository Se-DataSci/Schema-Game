/* Random creature raids on the seabase. A creature from a zone you've unlocked swims at the base;
   answer its questions before the base's shields run out.
   main.js calls tickRaids() once a second. The UI and BaseScene listen on the bus:
   raid-start, raid-tick, raid-hit, raid-miss, raid-end, raid-clear. */
import { CFG } from "../../config/config.js";
import { ZONES } from "../data/content.js";
import { S, persist, has } from "../core/state.js";
import { shuffle, pick } from "../core/util.js";
import { bus } from "../core/bus.js";
import { raidQuestions, isCorrect, record } from "./ladder.js";
const R = CFG.raids;
const between = ([lo, hi]) => Math.round(lo + Math.random() * (hi - lo));
export const raid = { active: null, next: between(R.firstDelay) };

/* Zones whose creatures can raid: any zone the player can currently dive into. */
const raidZones = () => ZONES.map((_, i) => i).filter(i => (i === 0 || S.cleared.includes(i - 1)) && S.hull >= ZONES[i].hull);
export const maxShields = () => R.shields + (has("turret") ? 1 : 0);

export function startRaid(zone = pick(raidZones())) {
  const z = ZONES[zone], c = z.creature, sh = maxShields();
  // mostly the zone's top unlocked Bloom level, mixed with lower levels; enough to survive every wrong answer
  const pool = raidQuestions(zone, R.toWin + sh + 2);
  raid.active = { zone, creature: c, pool, qi: 0, hits: 0, shields: sh, maxShields: sh, phase: "warn", warn: R.warnSeconds, answered: false, last: null, result: null };
  bus.emit("raid-start", raid.active);
}

/* Once a second. atBase = the player is idle at the seabase, so a raid would be fair. */
export function tickRaids(atBase) {
  const A = raid.active;
  if (A) {
    if (A.phase === "warn") { A.warn--; bus.emit("raid-tick", A); if (A.warn <= 0) end(false, true); }
    return;
  }
  if (!atBase || S.dives < R.minDives) return;
  if (--raid.next <= 0) startRaid();
}

export function engage() { const A = raid.active; if (A && A.phase === "warn") { A.phase = "fight"; bus.emit("raid-engage", A); } }

export const current = A => A.pool[A.qi % A.pool.length];

/* Answer the current question: given is an option index, or typed text for a fill-in-the-blank. */
export function answer(given) {
  const A = raid.active; if (!A || A.phase !== "fight" || A.answered) return;
  const q = current(A), ok = isCorrect(q, given);
  A.answered = true; q.res = { given, ok }; A.last = { q, given, ok };
  record(A.zone, q, ok);
  if (ok) { A.hits++; bus.emit("raid-hit", A); } else { A.shields--; bus.emit("raid-miss", A); }
  if (A.hits >= R.toWin) end(true);
  else if (A.shields <= 0) end(false);
}

export function nextQuestion() { const A = raid.active; if (A && A.phase === "fight") { A.qi++; A.answered = false; A.last = null; current(A).res = null; } }

function end(won, undefended = false) {
  const A = raid.active;
  A.phase = "done";
  if (won) {
    const reward = Math.round(R.winReward * (1 + A.zone * CFG.rewards.depthMultiplierPerZone));
    S.banked += reward; S.raids.won++;
    A.result = { won, reward };
  } else {
    const lost = Math.min(R.lossCap, Math.round(S.banked * R.lossFraction));
    S.banked -= lost; S.raids.lost++;
    A.result = { won, lost, undefended };
  }
  persist();
  raid.next = between(R.interval);
  bus.emit("raid-end", A);
}

export function dismiss() { raid.active = null; bus.emit("raid-clear"); }
