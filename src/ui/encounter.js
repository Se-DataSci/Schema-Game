/* The PDA panel during an encounter: a scan question, a salvage crate puzzle, or a creature fight.
   Questions are drawn by question.js; every answer is recorded on the Bloom ladder.
   Each encounter ends with closeEncounter(), which hands control back to the dive. */
import { CFG } from "../../config/config.js";
import { ZONES } from "../data/content.js";
import { S, persist } from "../core/state.js";
import { esc, shuffle } from "../core/util.js";
import { bus } from "../core/bus.js";
import { run, reward, mistake, logNote, creatureOf } from "../systems/dive.js";
import { isCorrect, record, prepare } from "../systems/ladder.js";
import { questionHtml, wireQuestion } from "./question.js";
const backBtn = (label = "Back to exploring") => `<div class="row"><button class="btn" data-enc="close">${label}</button></div>`;
const SCAN_LABEL = { fragment: "Wreck fragment", sample: "Flora sample", drive: "Data drive" };

export function encounterHtml(o) {
  const D = run.D;
  if (o.kind === "scan") {
    const sonar = !o.res && o.t !== "blank" && (o.w || []).length > 1 && S.sonar > 0 && !D.sonarUsed ? `<button class="btn ghost small" data-enc="sonar">Sonar ping (${S.sonar}): rule out one answer</button>` : "";
    return `<div class="kicker">Scanning · ${SCAN_LABEL[o.obj]}${o.n ? (String(o.n).startsWith("g") ? " · Exam 1 topic" : o.set === 2 ? " · Practice midterm 2" : " · Practice midterm") : ""}</div>` +
      questionHtml(o, o.res, { ok: "Scan complete", bad: "Scan corrupted" }) +
      (o.res && o.done ? backBtn() : `<div class="row">${sonar}</div>`);
  }
  if (o.kind === "beast") {
    const c = D.tutorial ? ZONES[0].creature : creatureOf(D), q = o.qs[o.qi];
    const after = !q.res ? `<div class="row"><span class="grow"></span><button class="btn ghost small" data-enc="retreat">Retreat</button></div>`
      : o.done ? backBtn() : `<div class="row"><button class="btn" data-enc="again">${q.res.ok ? "Keep fighting" : "Try again"}</button></div>`;
    return `<div class="kicker red">Hostile · ${esc(c.name)}</div>
      <div class="hp" aria-label="Creature health">${Array.from({ length: o.maxHp }, (_, k) => `<i class="${k < o.hp ? "" : "off"}"></i>`).join("")}</div>
      <p class="muted small"><b>Bad practice:</b> ${esc(c.practice)}. Answer correctly to drive it back.</p>` +
      questionHtml(q, q.res, { ok: o.done ? c.name + " repelled" : "Direct hit", bad: c.name + " strikes" }) + after;
  }
  // salvage crate: sort or stack puzzle
  if (o.type === "sort") {
    if (!o.left) { o.left = shuffle(o.items.map((_, k) => k)); o.placed = o.bins.map(() => []); o.sel = null; }
    return `<div class="kicker">Salvage crate · ${esc(o.title)}</div><p>${esc(o.prompt)} Pick an item, then tap its pile.</p>
      <div class="chips">${o.left.map(k => `<button class="chip ${o.sel === k ? "sel" : ""}" data-chip="${k}" aria-pressed="${o.sel === k}">${esc(o.items[k].t)}</button>`).join("") || `<span class="muted">All sorted.</span>`}</div>
      <div class="bins">${o.bins.map((b, bi) => `<button class="bin ${o.sel !== null ? "armed" : ""}" data-bin="${bi}"><span class="bt">${esc(b)}</span><span class="bi">${o.placed[bi].map(k => `<span class="chip in">${esc(o.items[k].t)}</span>`).join("")}</span></button>`).join("")}</div>
      <div id="fb">${o.solved ? `<div class="fb good"><b>Salvage secured</b><p>Everything is in the right pile.</p></div>${backBtn()}` : ""}</div>${o.solved ? "" : `<div class="row"><span class="grow"></span><button class="btn ghost small" data-enc="close">Leave it for now</button></div>`}`;
  }
  if (!o.yard) { o.yard = shuffle(o.blocks.map((_, k) => k)); o.placedRows = []; }
  return `<div class="kicker">Salvage crate · ${esc(o.title)}</div><p>${esc(o.prompt)}</p>
    <div class="yard">${o.yard.map(k => `<button class="blk" data-blk="${k}">${esc(o.blocks[k].trim())}</button>`).join("")}</div>
    <div class="stack">${o.placedRows.map(k => `<div>${esc(o.blocks[k])}</div>`).join("")}${o.placedRows.length < o.blocks.length ? `<div class="nx">▸ next piece…</div>` : ""}</div>
    <div id="fb">${o.solved ? `<div class="fb good"><b>Query fabricated</b><p>${esc(o.why)}</p></div>${backBtn()}` : ""}</div>${o.solved ? "" : `<div class="row"><span class="grow"></span><button class="btn ghost small" data-enc="close">Leave it for now</button></div>`}`;
}

/* Attach handlers. rerender() redraws the panel. */
export function wireEncounter(root, o, rerender) {
  const D = run.D;
  const fb = () => root.querySelector("#fb");

  root.querySelectorAll("[data-enc]").forEach(b => b.onclick = () => {
    const a = b.dataset.enc;
    if (a === "close" || a === "retreat") closeEncounter(o);
    else if (a === "sonar" && S.sonar > 0 && !D.sonarUsed) {
      S.sonar--; D.sonarUsed = true; persist();
      const wrong = o.opts.map((x, k) => (x === o.a ? -1 : k)).filter(k => k >= 0);
      o.gone = wrong[Math.floor(Math.random() * wrong.length)];
      rerender();
    } else if (a === "again") {
      o.qi = (o.qi + 1) % o.qs.length;
      if (o.qi === 0) o.qs = shuffle(o.qs).map(prepare);   // went through them all: reshuffle for another round
      else o.qs[o.qi].res = null;
      D.answered = false;
      rerender();
    }
  });

  if (o.kind === "scan") wireQuestion(root, o, given => {
    if (D.answered) return; D.answered = true;
    const ok = isCorrect(o, given);
    o.res = { given, ok };
    if (ok) { reward(CFG.rewards.scanCorrect); if (!D.tutorial) logNote(o.q); }
    if (!D.tutorial) record(D.zone, o, ok);
    bus.emit("scan-beam", ok);
    if (!ok && mistake(CFG.oxygen.wrongScanCost)) return;
    o.done = true; persist();
    rerender();
    const close = root.querySelector('[data-enc="close"]'); if (close) close.focus();
    bus.emit("encounter-progress");
  });

  if (o.kind === "beast") wireQuestion(root, o.qs[o.qi], given => {
    if (D.answered) return; D.answered = true;
    const q = o.qs[o.qi], c = D.tutorial ? ZONES[0].creature : creatureOf(D), ok = isCorrect(q, given);
    q.res = { given, ok };
    if (ok) { o.hp--; reward(CFG.rewards.creatureHit); bus.emit("fight-hit"); } else bus.emit("fight-miss");
    if (!D.tutorial) record(D.zone, q, ok);
    if (!ok && mistake(CFG.oxygen.creatureBiteCost)) return;
    if (o.hp <= 0) {
      reward(CFG.rewards.creatureDefeat); o.done = true;
      if (!D.tutorial && !S.slain.includes(c.id)) S.slain.push(c.id);
      if (!S.seen.includes(c.id)) S.seen.push(c.id);
      persist();
    }
    rerender();
    const next = root.querySelector('[data-enc="again"], [data-enc="close"]'); if (next) next.focus();
    bus.emit("encounter-progress");
  });

  root.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => { const k = +b.dataset.chip; o.sel = o.sel === k ? null : k; rerender(); });
  root.querySelectorAll("[data-bin]").forEach(b => b.onclick = () => {
    if (o.sel === null || o.sel === undefined) { const c = root.querySelector(".chips"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); return; }
    const k = o.sel, it = o.items[k], bi = +b.dataset.bin;
    if (it.b === bi) {
      o.placed[bi].push(k); o.left = o.left.filter(x => x !== k); o.sel = null; reward(CFG.rewards.puzzlePiece);
      if (!o.left.length) { o.solved = true; o.done = true; persist(); }
      rerender();
    } else {
      o.sel = null; rerender();
      fb().innerHTML = `<div class="fb bad"><b>Wrong pile</b><p>“${esc(it.t)}” goes in <b>${esc(o.bins[it.b])}</b>, not ${esc(o.bins[bi])}. ${esc(it.why)}</p></div>`;
      mistake(CFG.oxygen.wrongPieceCost);
    }
  });
  root.querySelectorAll("[data-blk]").forEach(b => b.onclick = () => {
    const k = +b.dataset.blk, want = o.placedRows.length;
    if (o.blocks[k].trim() === o.blocks[want].trim()) {
      o.placedRows.push(want); o.yard = o.yard.filter(x => x !== k); reward(CFG.rewards.puzzlePiece);
      if (o.placedRows.length === o.blocks.length) { o.solved = true; o.done = true; persist(); }
      rerender();
    } else {
      b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      fb().innerHTML = `<div class="fb bad"><b>Doesn't fit</b><p>“${esc(o.blocks[k].trim())}” isn't next. ${esc(o.why)}</p></div>`;
      mistake(CFG.oxygen.wrongPieceCost);
    }
  });
}

export function closeEncounter(o) {
  const D = run.D; if (!D) return;
  D.active = null; D.answered = false; D.sonarUsed = false;
  bus.emit("encounter-closed", o);
}
