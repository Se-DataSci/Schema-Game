/* The PDA panel. At the seabase it has four tabs (Dive map, Fabricator, Sub Bay, Databank).
   During a dive it's a compact objectives bar that expands into encounters. */
import { CFG } from "../../config/config.js";
import { ZONES } from "../data/content.js";
import { GUIDE, SQL_DEEP, spellOut } from "../data/studyguide.js";
import { MIDTERM } from "../data/midterm.js";
import { MIDTERM2 } from "../data/midterm2.js";
import { S, persist, resetSave, has } from "../core/state.js";
import { $, esc } from "../core/util.js";
import { bus } from "../core/bus.js";
import { version, detectedVersion, dockedLayout, isTouch } from "../core/device.js";
import { run, counts, allDone, finish } from "../systems/dive.js";
import { SHOP, COS, SLOTS, bay, cosOwned, cosIndex, buyItem, buyCos, equipCos, previewCos, reqMet } from "../systems/economy.js";
import { encounterHtml, wireEncounter } from "./encounter.js";
import { raid, engage, answer, nextQuestion, current, dismiss } from "../systems/raid.js";
import { LEVELS } from "../data/bloom.js";
import { MAX_LEVEL, topLevel, chosenLevel, progress, setLevel, takeOffer } from "../systems/ladder.js";
import { questionHtml, feedbackHtml, wireQuestion } from "./question.js";
import { drawHud } from "./hud.js";
import { toast } from "./dom.js";
import { coach, tut } from "./tutorial.js";
import { showControls } from "./controls.js";
const ROMAN = ["I", "II", "III", "IV"];
export const ui = { mode: "base", tab: "dive", near: null, bankView: "guide", bankOpen: null, sqlOpen: null, logOpen: null, brief: null };

export function render() {
  drawHud();
  const sh = $("sheet"), D = run.D;
  document.body.classList.toggle("docked", dockedLayout());
  let html, compact = false;
  document.body.classList.toggle("raiding", !!(raid.active && raid.active.phase !== "done"));
  if (ui.mode === "base") html = raid.active ? raidSheet() : baseSheet();
  else if (ui.mode === "result") html = resultSheet();
  else if (D && D.active) html = encounterHtml(D.active);
  else { html = diveBar(); compact = !dockedLayout(); }
  // focus mode: questions and raids take the middle of the screen over a dimmed game
  const focus = !!((ui.mode === "dive" && D && D.active) || (ui.mode === "base" && raid.active));
  sh.classList.toggle("bar", compact);
  sh.classList.toggle("focus", focus);
  $("dim").hidden = !focus;
  sh.innerHTML = `<div class="grip"></div>` + html;
  wire(sh);
  if (focus) {
    const fbEl = sh.querySelector(".fb"), next = sh.querySelector('[data-enc="again"], [data-enc="close"], [data-raid="next"], [data-raid="ok"]');
    if (fbEl) { fbEl.scrollIntoView({ block: "nearest" }); if (next) next.focus({ preventScroll: true }); }
    else if (!sh.querySelector(".chips, .yard")) sh.scrollTop = 0;
  }
  bay.open = ui.mode === "base" && ui.tab === "bay" && !raid.active;
  bus.emit("bay", bay.open);
  showControls(ui.mode === "dive" && !(D && D.active), isTouch());
  document.documentElement.style.setProperty("--bar", (compact ? sh.offsetHeight : 0) + "px");
  bus.emit("layout", dockedLayout() || focus ? window.innerHeight : sh.getBoundingClientRect().top);
  coach(ui, render);
}

/* ---------- seabase ---------- */
function baseSheet() {
  const tabs = `<div class="tabs" role="tablist">${[["dive", "Dive map"], ["fab", "Fabricator"], ["bay", "Sub Bay"], ["bank", "Databank"]].map(([k, l]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${ui.tab === k}">${l}</button>`).join("")}</div>`;
  if (ui.tab === "fab") return tabs + fabSheet();
  if (ui.tab === "bay") return tabs + baySheet();
  if (ui.tab === "bank") return tabs + bankSheet();
  if (ui.brief !== null) return tabs + briefSheet(ui.brief);
  const intro = S.dives === 0 ? `<p class="muted">Each depth zone is one lecture. Swim through it, scan the glowing targets, open the salvage crate, and drive off the creature of bad database design. Your oxygen drains while you explore, so watch the bar and ascend before it runs out.</p>` : "";
  const v = version(), det = detectedVersion();
  const record = S.raids.won + S.raids.lost ? `<p class="muted small">Base defense record: ${S.raids.won} raid${S.raids.won === 1 ? "" : "s"} repelled, ${S.raids.lost} breached.</p>` : "";
  const zones = ZONES.map((z, i) => {
    const cl = S.cleared.includes(i), un = i === 0 || S.cleared.includes(i - 1), hk = S.hull >= z.hull;
    const st = cl ? `<span class="zs ok">Cleared ✓<br>Dive again</span>` : !un ? `<span class="zs lock">Clear ${esc(ZONES[i - 1].name)}<br>first</span>` : !hk ? `<span class="zs lock">Needs Hull<br>Mk ${ROMAN[z.hull - 1]}</span>` : `<span class="zs go">Ready<br>to dive</span>`;
    return `<button class="zbtn" data-zone="${i}" ${un && hk ? "" : "disabled"}><span class="zn">${esc(z.name)} <span class="mono muted" style="font-size:.8rem">${z.depth[0]}–${z.depth[1].toLocaleString()} m</span></span><span class="zt">${esc(z.topic)} · <span class="zl">Level ${chosenLevel(i)} ${LEVELS[chosenLevel(i)].name}</span></span>${st}</button>`;
  }).reverse().join("");
  return tabs + offersHtml() + intro + record + `<div class="row" style="margin:0 0 10px"><button class="btn ghost small" data-act="tut">${S.tut === "done" ? "Replay tutorial" : "Show tutorial"}</button></div><div class="zones">${zones}</div>
    <div class="sect">Game version</div>
    <div class="slots">${[["auto", `Auto (${det === "full" ? "Full" : "Mobile"})`], ["mobile", "Mobile"], ["full", "Full"]].map(([k, l]) => `<button class="chip ${S.settings.version === k ? "sel" : ""}" data-ver="${k}">${l}</button>`).join("")}</div>
    <p class="muted small">Mobile has compact zones and a thumb-stick. Full has bigger zones, more hazards, a mini-map and sonar (Q). Playing now: <b>${v === "full" ? "Full" : "Mobile"}</b>.</p>
    <div class="sect">Graphics</div>
    <div class="slots">${[["full", "Full effects"], ["lite", "Lite (faster)"]].map(([k, l]) => `<button class="chip ${S.settings.graphics === k ? "sel" : ""}" data-gfx="${k}">${l}</button>`).join("")}</div>
    <p class="muted small">Lite turns off glow and colored trails so older phones run smoothly. Changing it reloads the game; your progress is kept.</p>`;
}

/* ---------- Bloom ladder ---------- */
const ladderLine = i => {
  const top = topLevel(i), L = chosenLevel(i);
  return `Level ${L} (${LEVELS[L].name}) of ${MAX_LEVEL}` + (top < MAX_LEVEL ? ` · ${progress(i)}/${CFG.bloom.toLevelUp} toward unlocking ${LEVELS[top + 1].name}` : " · every level unlocked");
};

function offersHtml() {
  return S.bloom.offers.map(i => {
    const top = topLevel(i), cur = chosenLevel(i);
    return `<div class="offer"><div class="kicker">Level unlocked · ${esc(ZONES[i].name)}</div>
      <p><b>Level ${top}: ${LEVELS[top].name}</b> is open. ${esc(LEVELS[top].verb)}. Move up, or keep practicing at Level ${cur}: ${LEVELS[cur].name}?</p>
      <div class="row"><button class="btn small" data-offer="up:${i}">Go up to Level ${top}</button><button class="btn ghost small" data-offer="stay:${i}">Stay at Level ${cur}</button></div></div>`;
  }).join("");
}

/* Before a dive: pick the Bloom level to dive at. */
function briefSheet(i) {
  const z = ZONES[i], top = topLevel(i), L = chosenLevel(i), need = CFG.bloom.toLevelUp;
  const rows = LEVELS.slice(1).map((lv, k) => {
    const n = k + 1, st = n < top ? "done" : n === top ? "top" : "locked";
    const status = n < top ? "✓ Mastered" : n === top ? (top === MAX_LEVEL ? "Top level" : `${progress(i)}/${need} to next`) : "Locked";
    return `<button class="lvl ${st} ${n === L ? "pick" : ""}" data-lv="${n}" ${n > top ? "disabled" : ""} aria-pressed="${n === L}"><span class="ln">${n}</span><span class="lt"><b>${lv.name}</b><span class="muted">${esc(lv.verb)}</span></span><span class="ls">${status}</span></button>`;
  }).join("");
  const missed = (S.missed[i] || []).length;
  return `<div class="kicker">${esc(z.name)} · ${esc(z.topic)}</div><h2>Choose your level</h2>
    <p class="muted small">Levels follow Bloom's taxonomy, from remembering facts up to writing SQL and designing tables yourself. Get ${need} more questions right than wrong at your top level to unlock the next one. Every dive also mixes in a review question from the levels below.</p>
    <div class="ladder">${rows}</div>
    ${missed ? `<p class="small">You have <b>${missed}</b> missed question${missed === 1 ? "" : "s"} waiting in this zone. <button class="linkbtn" data-review="${i}">Review them</button></p>` : ""}
    <div class="row"><button class="btn" data-dive="${i}">Dive at Level ${L}: ${LEVELS[L].name}</button><button class="btn ghost" data-brief="back">Back</button></div>`;
}

function fabSheet() {
  return `<p class="muted">Every correct answer earns salvage. Spend it here. You carry ${S.sonar} sonar charge${S.sonar === 1 ? "" : "s"} and ${S.canisters} canister${S.canisters === 1 ? "" : "s"}.</p><div class="shop">` + SHOP.map(it => {
    if (it.sect) return `<div class="sect">${esc(it.sect)}</div>`;
    const owned = it.kind === "hull" ? S.hull >= it.lvl : (it.kind === "gear" || it.kind === "module") && S.owned.includes(it.id);
    const reqOk = reqMet(it);
    const full = it.kind === "canister" && S.canisters >= CFG.start.maxCanisters;
    const btn = owned ? `<span class="owned">Installed</span>` : !reqOk ? `<span class="owned muted">Needs previous</span>` : full ? `<span class="owned muted">Full</span>` :
      `<button class="btn small buy" data-buy="${it.id}" ${S.banked >= it.cost ? "" : "disabled"}><span class="price">${it.cost}</span></button>`;
    return `<div class="item"><span class="in">${esc(it.name)}</span><span class="id">${esc(it.desc)}</span><span class="buy">${btn}</span></div>`;
  }).join("") + `</div>`;
}

function baySheet() {
  const eq = S.cos.eq;
  const rows = SLOTS.map(([k]) => `<td>${cosIndex(k, eq[k])}</td>`).join("");
  const list = COS[bay.slot].map((c, i) => {
    const owned = cosOwned(bay.slot, c.id), on = eq[bay.slot] === c.id, pv = bay.preview && bay.preview.slot === bay.slot && bay.preview.id === c.id;
    const locked = c.req && !S.slain.includes(c.req);
    const act = on ? `<span class="owned">Equipped</span>` : owned ? `<button class="btn small" data-equip="${c.id}">Equip</button>` :
      locked ? `<span class="owned" style="color:var(--danger)">Locked</span>` : `<button class="btn small" data-buycos="${c.id}" ${S.banked >= c.price ? "" : "disabled"}><span class="price">${c.price}</span></button>`;
    return `<div class="item cos ${pv ? "pv" : ""}" data-try="${c.id}" tabindex="0"><span class="in"><span class="mono muted">#${i}</span> ${esc(c.name)}</span><span class="id">${esc(c.desc)}${!owned && !locked ? " Tap to preview." : ""}</span><span class="buy">${act}</span></div>`;
  }).join("");
  return `<p class="muted">Your sub is one row in the <code>submarine</code> table. Each slot is a foreign key pointing into a cosmetic table, and everything you buy goes into the <code>owned_cosmetic</code> bridge table, a many-to-many link between subs and items.</p>
    <div class="rec"><div class="rq">SELECT * FROM submarine WHERE sub_id = 1;</div><div class="rt"><table><tr><th>sub_id</th>${SLOTS.map(([k]) => `<th>${k}_id</th>`).join("")}</tr><tr><td>1</td>${rows}</tr></table></div></div>
    <div class="slots">${SLOTS.map(([k, l]) => `<button class="chip ${bay.slot === k ? "sel" : ""}" data-slot="${k}" aria-pressed="${bay.slot === k}">${l}</button>`).join("")}</div>
    <div class="sect">Table: ${bay.slot}</div><div class="shop">${list}</div>
    ${S.qlog.length ? `<div class="sect">Query log</div><div class="qlog">${S.qlog.map(q => `<div>${esc(q)}</div>`).join("")}</div>` : ""}`;
}

/* ---------- Databank: study guide, grouping & sorting walkthrough, dive log ---------- */
const tbl = t => `<div class="tblw"><table class="dt"><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>${t.rows.map(r => `<tr>${r.map(v => `<td>${esc(String(v))}</td>`).join("")}</tr>`).join("")}</table></div>`;
const code = q => `<pre class="code">${esc(q)}</pre>`;
const card = e => `<div class="term"><div class="tn">${esc(e.term)}</div><div class="td">${esc(e.def)}</div>` +
  (e.more ? `<div class="tm">${esc(e.more)}</div>` : "") + (e.ex ? `<div class="tx"><b>Example:</b> ${esc(e.ex)}</div>` : "") +
  (e.watch ? `<div class="tw"><b>Watch out:</b> ${esc(e.watch)}</div>` : "") + `</div>`;

function guideView() {
  return `<p class="muted">Every definition from the course, zone by zone. Open a zone to study it before you dive.</p>` +
    ZONES.map((z, i) => `<details class="log"${ui.bankOpen === i ? " open" : ""} data-bz="${i}"><summary>${i + 1}. ${esc(z.name)} · ${esc(spellOut(z.topic))}</summary>${(GUIDE[i] || []).map(card).join("")}</details>`).join("");
}

function sqlView() {
  const d = SQL_DEEP;
  return `<p>${esc(d.intro)}</p><div class="sect">The rental table</div>${tbl(d.sample)}
    <div class="sect">Write in this order</div><p class="mono order">${d.orderWritten.join(" → ")}</p>
    <div class="sect">The database runs them in this order</div><ol class="steps">${d.orderRun.map(([c, t]) => `<li><b>${esc(c)}</b>: ${esc(t)}</li>`).join("")}</ol><p class="muted">${esc(d.orderNote)}</p>` +
    d.sections.map(x => `<details class="log"${ui.sqlOpen === x.clause ? " open" : ""} data-sq="${esc(x.clause)}"><summary>${esc(x.clause)}</summary>
      <div class="td">${esc(x.def)}</div>${x.more.map(m => `<p class="tm">${esc(m)}</p>`).join("")}
      <div class="sect">Example</div>${code(x.query)}<p class="tm">${esc(x.steps)}</p>${tbl(x.result)}
      ${x.query2 ? `<div class="sect">WHERE and HAVING in one query</div>${code(x.query2)}<p class="tm">${esc(x.steps2)}</p>${tbl(x.result2)}` : ""}
      <div class="sect">Watch out</div><ul class="watch">${x.watch.map(w => `<li>${esc(w)}</li>`).join("")}</ul></details>`).join("") +
    `<div class="sect">${esc(d.together.title)}</div>${code(d.together.query)}<p class="tm">${esc(d.together.read)}</p>`;
}

function logView() {
  const body = ZONES.map((z, i) => {
    const c = z.creature, seen = S.seen.includes(c.id), slain = S.slain.includes(c.id);
    const find = t => z.mc.find(m => m.q === t) || c.qs.find(m => m.q === t);
    const notes = (S.notes[String(i)] || []).map(find).filter(Boolean);
    const missed = (S.missed[i] || []).map(find).filter(Boolean);
    if (!seen && !notes.length && !missed.length) return "";
    return `<details class="log"${ui.logOpen === i ? " open" : ""} data-lz="${i}"><summary>${esc(z.name)} · ${esc(spellOut(z.topic))}${missed.length ? ` <span class="misscount">${missed.length} to review</span>` : ""}</summary>` +
      (missed.length ? `<div class="sect">Missed: study these, then get them right on a dive to clear them</div>` + missed.map(m => `<div class="entry miss"><div>${esc(spellOut(m.q))}</div>${m.code ? `<pre class="qcode">${esc(m.code)}</pre>` : ""}<div class="a">Answer: ${esc(spellOut(m.a))}</div><div class="muted">${esc(spellOut(m.why))}</div></div>`).join("") + (notes.length ? `<div class="sect">Answered correctly</div>` : "") : "") +
      (seen ? `<div class="beast"><div class="bn">${esc(c.name)}${slain ? " · repelled" : ""}</div><div><b>Bad practice:</b> ${esc(spellOut(c.practice))}</div><div class="muted">${esc(spellOut(c.lore))}</div><div><b>Counter:</b> ${esc(spellOut(c.counter))}</div></div>` : "") +
      notes.map(m => `<div class="entry"><div>${esc(spellOut(m.q))}</div>${m.code ? `<pre class="qcode">${esc(m.code)}</pre>` : ""}<div class="a">${esc(spellOut(m.a))}</div><div class="muted">${esc(spellOut(m.why))}</div></div>`).join("") + `</details>`;
  }).join("");
  return `<p class="muted">Creature files, the questions you've missed (until you get them right), and the ones you've answered correctly.</p>` + (body || `<p>No entries yet. Dive and scan to fill your log.</p>`);
}

function midtermView() {
  const key = (set, title) => {
    const orig = set.filter(m => typeof m.n === "number").sort((a, b) => a.n - b.n);
    return `<div class="sect">${title}</div>` + orig.map(m => `<div class="term"><div class="tn">${m.n}. ${esc(m.q)}</div><div class="td">${esc(m.a)}</div><div class="tm">${esc(m.why)}</div><div class="muted small">Zone: ${esc(ZONES[m.zone].name)}</div></div>`).join("");
  };
  return `<p class="muted">Answer keys for both practice midterms. These questions, reworded versions, true/false, fill-in-the-blank and code questions all show up as scans, marked "Practice midterm" or "Exam 1 topic".</p>
    <div class="term"><div class="tn">Exam 1 format</div><div class="tm">60 minutes, 100 points, modules 1–6, on Canvas. Multiple choice, true/false, fill in the blank and essay. SQL questions: write short code, find and fix errors, describe what code does, and work out its output without running it. One handwritten reference sheet (front and back) is allowed; no MySQL Workbench or AI.</div></div>` +
    key(MIDTERM, "Practice midterm 1 · questions 1–24") + key(MIDTERM2, "Practice midterm 2 · questions 1–23");
}

function bankSheet() {
  const views = [["guide", "Study guide"], ["sql", "Grouping & sorting"], ["mid", "Practice midterm"], ["log", "My dive log"]];
  const v = ui.bankView || "guide";
  const body = v === "mid" ? midtermView() : v === "sql" ? sqlView() : v === "log" ? logView() : guideView();
  return `<div class="slots">${views.map(([k, l]) => `<button class="chip ${v === k ? "sel" : ""}" data-bv="${k}">${l}</button>`).join("")}</div>` + body +
    `<div class="row"><button class="btn ghost small" data-act="reset">Reset all progress</button></div>`;
}

function resultSheet() {
  const r = run.result, z = ZONES[r.zone], next = ZONES[r.zone + 1];
  if (r.kind === "tutorial") return `<div class="kicker">Training complete</div><h2>Back at the seabase</h2><p>You banked <span class="price">${r.total}</span> salvage, including a <span class="price">${r.bonus}</span> training bonus.</p><div class="row"><button class="btn" data-act="home">Back to seabase</button></div>`;
  if (r.kind === "blackout") return `<div class="kicker red">Oxygen depleted</div><h2>You blacked out in ${esc(z.name)}</h2><p>Your lifepod's tether hauled you back to the seabase. You dropped ${r.lost} salvage on the way up and kept ${r.total}.</p><p class="muted">Tip: air vents on the seafloor refill oxygen. The Rebreather and bigger tanks also help.</p><div class="row"><button class="btn" data-act="home">Back to seabase</button></div>`;
  const lead = r.kind === "clear" ? `<div class="kicker">Zone charted</div><h2>${esc(z.name)} cleared</h2>` : `<div class="kicker">Surfaced early</div><h2>Back from ${esc(z.name)}</h2>`;
  const tip = r.kind === "clear" && next ? (S.hull >= next.hull ? `<p>${esc(next.name)} is open below you.</p>` : `<p>${esc(next.name)} is deeper than your hull can handle. Build Pressure Hull Mk ${ROMAN[next.hull - 1]} at the Fabricator.</p>`) : r.kind === "clear" && !next ? `<p>You reached the bottom of the trench and repelled the Anomaly Leviathan. The whole schema is yours.</p>` : "";
  return lead + `<p>Salvage banked: <span class="price">${r.carried}</span>${r.bonus ? ` + <span class="price">${r.bonus}</span> zone bonus` : ""} = <span class="price">${r.total}</span></p>${tip}
    <p class="muted small">${esc(z.name)} ladder: ${ladderLine(r.zone)}</p>${offersHtml()}
    <div class="row"><button class="btn" data-act="home">Back to seabase</button><button class="btn ghost" data-act="fab">Open Fabricator</button></div>`;
}

/* ---------- base raid ---------- */
function raidSheet() {
  const A = raid.active, c = A.creature, z = ZONES[A.zone], R = CFG.raids;
  const bar = (n, on, cls = "") => `<div class="hp ${cls}">${Array.from({ length: n }, (_, k) => `<i class="${k < on ? "" : "off"}"></i>`).join("")}</div>`;
  const feedback = L => feedbackHtml(L.q, L, { ok: "Direct hit", bad: "Shield down" });
  if (A.phase === "warn") return `<div class="kicker red">Base alarm</div><h2>${esc(c.name)} is attacking the seabase</h2>
    <p>It swam up from ${esc(z.name)} (${esc(z.topic)}). Answer ${R.toWin} questions correctly to drive it off. Each wrong answer knocks out a shield, and if all ${A.maxShields} go down it breaks in and steals salvage.</p>
    <p class="raidwarn">Impact in <b id="raidWarn">${A.warn}</b> s</p>
    <div class="row"><button class="btn warn" data-raid="engage">Defend the base</button></div>`;
  if (A.phase === "done") {
    const r = A.result, last = A.last ? feedback(A.last) : "";
    const record = `<p class="muted small">Base defense record: ${S.raids.won} repelled, ${S.raids.lost} breached.</p>`;
    return r.won
      ? `<div class="kicker">Raid repelled</div><h2>${esc(c.name)} driven off</h2>${last}<p style="margin-top:10px">The seabase held. You salvaged <span class="price">${r.reward}</span> from the fight.</p>${record}<div class="row"><button class="btn" data-raid="ok">Back to the seabase</button></div>`
      : `<div class="kicker red">Base breached</div><h2>${esc(c.name)} got in</h2>${last}<p style="margin-top:10px">${r.undefended ? "Nobody manned the defenses. " : ""}It made off with <span class="price">${r.lost}</span> salvage before it fled.</p><p class="muted small">Review ${esc(z.topic)} in the Databank${has("turret") ? "" : ", or build a Perimeter turret at the Fabricator for an extra shield"}.</p>${record}<div class="row"><button class="btn" data-raid="ok">Back to the seabase</button></div>`;
  }
  const q = current(A);
  return `<div class="kicker red">Defending the seabase · ${esc(c.name)}</div>
    <div class="raidbars"><div><span class="muted small">Raider</span>${bar(R.toWin, R.toWin - A.hits)}</div><div><span class="muted small">Base shields</span>${bar(A.maxShields, A.shields, "shields")}</div></div>` +
    questionHtml(q, q.res, { ok: "Direct hit", bad: "Shield down" }) +
    (q.res ? `<div class="row"><button class="btn" data-raid="next">Next question</button></div>` : "");
}

/* ---------- dive ---------- */
function diveBar() {
  const D = run.D, z = ZONES[D.zone], c = counts(D), done = allDone(D);
  const beastName = D.tutorial ? ZONES[0].creature.name : z.creature.name;
  const chip = (ok, txt) => `<span class="obj ${ok ? "ok" : ""}">${ok ? "✓ " : ""}${txt}</span>`;
  const keys = isTouch() ? "" : `<p class="muted small keys">WASD or arrows to swim · E to ${ui.near ? ui.near.toLowerCase() : "interact"}${version() === "full" && !D.tutorial ? " · Q sonar" : ""}</p>`;
  const hint = ui.near && !isTouch() ? `<div class="near">Press <b>E</b> to ${esc(ui.near.toLowerCase())}</div>` : "";
  return `<div class="kicker">${D.tutorial ? "Training dive" : esc(z.name) + " · Level " + D.level + " " + LEVELS[D.level].name}</div>
    <div class="objs">${chip(c.scans === c.scanTotal, `Scans ${c.scans}/${c.scanTotal}`)}${chip(c.crate, "Crate")}${chip(c.beast, esc(beastName))}</div>
    ${hint}
    <div class="row">${done ? `<button class="btn" data-act="claim">Ascend and claim bonus</button>` : `<button class="btn ghost small" data-act="ascend">Ascend and bank ${D.carried}</button>`}</div>${keys}`;
}

/* ---------- events ---------- */
function wire(sh) {
  sh.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { ui.tab = b.dataset.tab; bay.preview = null; render(); });
  sh.querySelectorAll("[data-zone]").forEach(b => b.onclick = () => { ui.brief = +b.dataset.zone; render(); sh.scrollTop = 0; });
  sh.querySelectorAll("[data-brief]").forEach(b => b.onclick = () => { ui.brief = null; render(); });
  sh.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { setLevel(ui.brief, +b.dataset.lv); render(); });
  sh.querySelectorAll("[data-dive]").forEach(b => b.onclick = () => { const z = +b.dataset.dive; ui.brief = null; bus.emit("start-dive", z, false); });
  sh.querySelectorAll("[data-offer]").forEach(b => b.onclick = () => { const [how, z] = b.dataset.offer.split(":"); takeOffer(+z, how === "up"); toast(how === "up" ? `Now diving at Level ${chosenLevel(+z)}: ${LEVELS[chosenLevel(+z)].name}` : "Staying at your current level"); render(); });
  sh.querySelectorAll("[data-review]").forEach(b => b.onclick = () => { ui.tab = "bank"; ui.bankView = "log"; ui.logOpen = +b.dataset.review; ui.brief = null; render(); sh.scrollTop = 0; });
  sh.querySelectorAll("[data-lz]").forEach(d => d.ontoggle = () => { if (d.open) ui.logOpen = +d.dataset.lz; else if (ui.logOpen === +d.dataset.lz) ui.logOpen = null; });
  sh.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => { const it = buyItem(b.dataset.buy); if (it) toast(it.name + " fabricated", "gold"); render(); });
  sh.querySelectorAll("[data-bv]").forEach(b => b.onclick = () => { ui.bankView = b.dataset.bv; render(); sh.scrollTop = 0; });
  sh.querySelectorAll("[data-bz]").forEach(d => d.ontoggle = () => { if (d.open) ui.bankOpen = +d.dataset.bz; else if (ui.bankOpen === +d.dataset.bz) ui.bankOpen = null; });
  sh.querySelectorAll("[data-sq]").forEach(d => d.ontoggle = () => { if (d.open) ui.sqlOpen = d.dataset.sq; else if (ui.sqlOpen === d.dataset.sq) ui.sqlOpen = null; });
  sh.querySelectorAll("[data-gfx]").forEach(b => b.onclick = () => { if (S.settings.graphics === b.dataset.gfx) return; S.settings.graphics = b.dataset.gfx; persist(); location.reload(); });
  sh.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => { S.settings.version = b.dataset.ver; persist(); render(); });
  sh.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => { bay.slot = b.dataset.slot; bay.preview = null; bus.emit("cos-changed"); render(); });
  sh.querySelectorAll("[data-buycos]").forEach(b => b.onclick = e => { e.stopPropagation(); const it = buyCos(bay.slot, b.dataset.buycos); if (it) toast(it.name + " purchased", "gold"); render(); });
  sh.querySelectorAll("[data-equip]").forEach(b => b.onclick = e => { e.stopPropagation(); if (equipCos(bay.slot, b.dataset.equip)) toast(COS[bay.slot].find(c => c.id === b.dataset.equip).name + " equipped"); render(); });
  sh.querySelectorAll("[data-try]").forEach(b => b.onclick = () => { const id = b.dataset.try; if (cosOwned(bay.slot, id)) equipCos(bay.slot, id); else previewCos(bay.slot, id); render(); });
  sh.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act(b.dataset.act, b));
  sh.querySelectorAll("[data-raid]").forEach(b => b.onclick = () => { const a = b.dataset.raid; if (a === "engage") engage(); else if (a === "next") nextQuestion(); else if (a === "ok") dismiss(); render(); });
  if (ui.mode === "base" && raid.active && raid.active.phase === "fight") wireQuestion(sh, current(raid.active), given => { answer(given); render(); });
  const D = run.D;
  if (ui.mode === "dive" && D && D.active) wireEncounter(sh, D.active, render);
}

function act(a, btn) {
  if (a === "home") { ui.mode = "base"; ui.tab = tut.step === "tres" ? "fab" : "dive"; if (tut.step === "tres") tut.step = "fab"; render(); }
  else if (a === "fab") { ui.mode = "base"; ui.tab = "fab"; render(); }
  else if (a === "ascend") finish(false);
  else if (a === "claim") finish(true);
  else if (a === "tut") { tut.step = "welcome"; render(); }
  else if (a === "reset") {
    if (btn.dataset.armed) { resetSave(); tut.step = "welcome"; bus.emit("cos-changed"); bus.emit("base-changed"); toast("Progress reset"); render(); }
    else { btn.dataset.armed = "1"; btn.textContent = "Tap again to erase everything"; }
  }
}

/* keep the HUD and bar fresh while diving */
bus.on("hud", () => { drawHud(); });
bus.on("near", label => { ui.near = label; if (ui.mode === "dive" && run.D && !run.D.active) render(); });
bus.on("encounter-open", () => render());
bus.on("encounter-closed", () => render());
bus.on("encounter-progress", () => coach(ui, render));
bus.on("toast", (m, c) => toast(m, c));
bus.on("bloom-up", (z, lv) => toast(`Level ${lv} unlocked: ${LEVELS[lv].name}!`, "gold"));
bus.on("raid-start", A => { toast(A.creature.name + " is attacking the base!", "red"); try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {} render(); });
bus.on("raid-tick", A => { const el = $("raidWarn"); if (el) el.textContent = A.warn; });
bus.on("raid-end", () => render());
bus.on("raid-clear", () => render());
bus.on("float", (txt, c) => { if (c === "gold" && ui.mode === "dive" && run.D && !run.D.active) render(); });
