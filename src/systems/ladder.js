/* The Bloom ladder. Each zone has:
     max  - the highest level unlocked so far (starts at 1, Remember)
     lvl  - the level the player chose to dive at (any unlocked level)
     prog - net correct answers at the top level (wrong answers take one away)
   Reaching CFG.bloom.toLevelUp at the top level unlocks the next level and offers the player the choice to move up.
   Dives mostly ask questions at the chosen level and mix in a review question from the levels below. */
import { CFG } from "../../config/config.js";
import { ZONES } from "../data/content.js";
import { LEVELS } from "../data/bloom.js";
import { S, persist } from "../core/state.js";
import { shuffle } from "../core/util.js";
import { bus } from "../core/bus.js";

export const MAX_LEVEL = LEVELS.length - 1;
const B = () => S.bloom;
export const topLevel = z => B().max[z] || 1;
export const chosenLevel = z => Math.min(B().lvl[z] || 1, topLevel(z));
export const progress = z => B().prog[z] || 0;
export const levelName = lv => (LEVELS[lv] ? LEVELS[lv].name : "");

export function setLevel(z, lv) {
  if (lv < 1 || lv > topLevel(z)) return;
  B().lvl[z] = lv; persist();
}

/* Typed answers ignore case, spaces, quote style and a trailing semicolon. */
const norm = s => String(s).toLowerCase().replace(/[“”"‘’`]/g, "'").replace(/;+\s*$/, "").replace(/\s+/g, "");
export function isCorrect(q, given) {
  if (q.t === "blank") return (q.acc || [q.a]).some(a => norm(a) === norm(given));
  return q.opts[given] === q.a;
}

/* A fresh copy of a question, ready to ask: shuffled options, no answer yet. */
export const prepare = q => (q.t === "blank" ? { ...q, res: null } : { ...q, res: null, gone: null, opts: shuffle([q.a, ...q.w]) });

/* Record an answer. Keeps the missed-questions list and moves the ladder. Returns the newly unlocked level, if any. */
export function record(z, q, ok) {
  const missed = (S.missed[z] = S.missed[z] || []);
  const i = missed.indexOf(q.q);
  if (ok && i >= 0) missed.splice(i, 1);
  if (!ok && i < 0) missed.push(q.q);
  let unlocked = null;
  const top = topLevel(z);
  if (q.lv === top && chosenLevel(z) === top && top < MAX_LEVEL) {
    B().prog[z] = Math.max(0, progress(z) + (ok ? 1 : -1));
    if (B().prog[z] >= CFG.bloom.toLevelUp) {
      unlocked = top + 1;
      B().max[z] = unlocked; B().prog[z] = 0;
      if (!B().offers.includes(z)) B().offers.push(z);
      bus.emit("bloom-up", z, unlocked);
    }
  }
  persist();
  return unlocked;
}

/* Accept or decline moving up after a level unlocks. */
export function takeOffer(z, up) {
  if (up) B().lvl[z] = topLevel(z);
  B().offers = B().offers.filter(x => x !== z);
  persist();
}

const fill = (out, n, ...pools) => { for (const pool of pools) for (const q of pool) { if (out.length >= n) return out; if (!out.includes(q)) out.push(q); } return out; };

/* Scan questions for one dive: mostly the chosen level, plus review from the levels below. */
export function diveQuestions(z, n) {
  const L = chosenLevel(z), mc = ZONES[z].mc;
  const at = shuffle(mc.filter(q => q.lv === L)), low = shuffle(mc.filter(q => q.lv < L));
  const review = L > 1 ? Math.min(CFG.bloom.reviewPerDive, low.length) : 0;
  const out = fill([], n - review, at);
  fill(out, n, low, at, shuffle(mc));
  // Make sure each dive includes at least one practice midterm question at or below the chosen level.
  const mt = shuffle(mc.filter(q => q.n && q.lv <= L && !out.includes(q)));
  if (!out.some(q => q.n) && mt.length) out[out.length - 1] = mt[0];
  return shuffle(out).map(prepare);
}

/* Creature questions: at Remember/Understand the creature's own questions; higher up,
   one of its questions plus zone questions at the chosen level (skipping ones already used as scans). */
export function fightQuestions(z, n, used = []) {
  const L = chosenLevel(z), c = ZONES[z].creature, mc = ZONES[z].mc;
  const usedQ = new Set(used.map(q => q.q));
  const own = shuffle(c.qs);
  if (L <= 2) return fill([], n, own.filter(q => q.lv <= 2), shuffle(mc.filter(q => q.lv <= 2 && !usedQ.has(q.q))), own).map(prepare);
  const themed = own.filter(q => q.lv <= L).sort((a, b) => b.lv - a.lv).slice(0, 1);
  return shuffle(fill(themed, n, shuffle(mc.filter(q => q.lv === L && !usedQ.has(q.q))), own)).map(prepare);
}

/* Raid questions: about 60% at the zone's top unlocked level, the rest mixed from below. */
export function raidQuestions(z, n) {
  const top = topLevel(z), all = [...ZONES[z].mc, ...ZONES[z].creature.qs];
  const at = shuffle(all.filter(q => q.lv === top)), low = shuffle(all.filter(q => q.lv < top));
  const out = fill([], Math.ceil(n * 0.6), at);
  fill(out, n, low, at);
  return shuffle(out).map(prepare);
}
