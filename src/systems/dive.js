/* One dive: objectives, oxygen, salvage carried, and how it ends.
   This module holds the rules only. DiveScene draws the world and calls in here. */
import { CFG } from "../../config/config.js";
import { ZONES, TUT_PLAN } from "../data/content.js";
import { S, persist, has, maxO2, lossMul } from "../core/state.js";
import { shuffle, pick } from "../core/util.js";
import { bus } from "../core/bus.js";
import { diveQuestions, fightQuestions, prepare, chosenLevel } from "./ladder.js";
/* run.D is the active dive (null at the seabase). run.result is the last dive's summary. */
export const run = { D: null, result: null };

export function newDive(zone, tutorial = false) {
  const z = ZONES[zone];
  let objectives;
  if (tutorial) {
    const plan = JSON.parse(JSON.stringify(TUT_PLAN));
    objectives = [
      { kind: "scan", ...prepare(plan[0]), obj: "drive" },
      { kind: "crate", ...plan[1] },
      { kind: "beast", hp: 1, maxHp: 1, qi: 0, qs: plan[2].qs.map(prepare) }
    ];
  } else {
    // questions come from the zone's Bloom ladder: mostly the chosen level, plus review from below
    const picked = diveQuestions(zone, CFG.dive.scansPerDive);
    const scans = picked.map(m => ({ kind: "scan", ...m, obj: ["fragment", "sample", "drive"][Math.floor(Math.random() * 3)] }));
    const crate = { kind: "crate", ...JSON.parse(JSON.stringify(pick([z.special, ...(z.specials || [])]))) };
    const c = z.creature;
    const beast = { kind: "beast", hp: c.hp, maxHp: c.hp, qi: 0, qs: fightQuestions(zone, c.hp, picked) };
    objectives = [scans[0], scans[1], crate, scans[2], scans[3], beast];
  }
  objectives.forEach((o, i) => { o.id = i; o.done = false; });
  run.D = { zone, tutorial, level: tutorial ? 1 : chosenLevel(zone), objectives, o2: maxO2(), carried: 0, active: null, answered: false, sonarUsed: false, depth: z.depth[0] };
  run.result = null;
  if (!tutorial) { S.dives++; persist(); }
  return run.D;
}

export const creatureOf = D => ZONES[D.zone].creature;
export const allDone = D => D.objectives.every(o => o.done);
export const counts = D => {
  const scans = D.objectives.filter(o => o.kind === "scan");
  return { scans: scans.filter(o => o.done).length, scanTotal: scans.length,
    crate: D.objectives.find(o => o.kind === "crate").done, beast: D.objectives.find(o => o.kind === "beast").done };
};

/* Salvage reward, scaled by depth. */
export function reward(base) {
  const D = run.D;
  const v = Math.round(base * (1 + D.zone * CFG.rewards.depthMultiplierPerZone));
  D.carried += v;
  bus.emit("float", "+" + v, "gold");
  return v;
}

/* Lose oxygen. Returns true if the dive ended because of it. */
export function drain(amount, show = true) {
  const D = run.D; if (!D) return false;
  D.o2 = Math.max(0, D.o2 - amount);
  if (show && amount >= 1) bus.emit("float", "−" + Math.round(amount) + " O₂", "red");
  return checkOxygen();
}
export const mistake = base => drain(base * lossMul());

/* Called every frame while exploring. */
export function tick(dt, inVent) {
  const D = run.D; if (!D || D.active) return false;
  if (inVent) D.o2 = Math.min(maxO2(), D.o2 + CFG.oxygen.ventRefillPerSecond * dt);
  else D.o2 = Math.max(0, D.o2 - (has("glider") ? CFG.oxygen.drainWithGlider : CFG.oxygen.drainPerSecond) * dt);
  return checkOxygen();
}

function checkOxygen() {
  const D = run.D;
  if (D.o2 > 0) return false;
  if (D.tutorial) { D.o2 = 25; return false; }
  if (S.canisters > 0) { S.canisters--; persist(); D.o2 = Math.round(maxO2() / 2); bus.emit("toast", "Emergency canister used", "gold"); return false; }
  blackout();
  return true;
}

export function logNote(q) {
  const k = String(run.D.zone);
  S.notes[k] = S.notes[k] || [];
  if (!S.notes[k].includes(q)) S.notes[k].push(q);
}

/* End the dive. complete = every objective finished (earns the zone bonus). */
export function finish(complete) {
  const D = run.D; if (!D) return;
  let bonus = 0, kind = complete ? "clear" : "ascend";
  if (D.tutorial) { bonus = CFG.rewards.tutorialBonus; kind = "tutorial"; }
  else if (complete) {
    bonus = Math.round(CFG.rewards.zoneClearBase + CFG.rewards.zoneClearPerZone * D.zone);
    if (!S.cleared.includes(D.zone)) S.cleared.push(D.zone);
  }
  S.banked += D.carried + bonus; persist();
  run.result = { kind, zone: D.zone, level: D.level, carried: D.carried, bonus, total: D.carried + bonus };
  run.D = null;
  bus.emit("dive-ended");
}

function blackout() {
  const D = run.D;
  const lost = Math.ceil(D.carried / 2), kept = D.carried - lost;
  S.banked += kept; persist();
  run.result = { kind: "blackout", zone: D.zone, carried: D.carried, lost, total: kept };
  run.D = null;
  bus.emit("dive-ended");
}
