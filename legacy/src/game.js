(() => {
/* =========================================================
   CONTENT — one depth zone per ITSC 3160 lecture
   ========================================================= */
const ZONES = window.DS_CONTENT.ZONES;

const SHOP = window.DS_CONFIG.shop;

/* Training dive used by the tutorial */
const TUT_PLAN = window.DS_CONTENT.TUT_PLAN;

/* =========================================================
   STATE + SAVE
   ========================================================= */
const CFG = window.DS_CONFIG;
const KEY = CFG.saveKey;
const fresh = () => ({ banked: CFG.start.salvage, owned: [], hull: 1, sonar: CFG.start.sonar, canisters: 0, cleared: [], seen: [], slain: [], notes: {}, dives: 0, cos: { owned: [], eq: { paint: "std", decal: "none", light: "std", trail: "bubbles", fin: "none" } }, qlog: [] });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s.banked === "number") { S = Object.assign(fresh(), s); S.cos = Object.assign(fresh().cos, s.cos || {}); S.cos.eq = Object.assign(fresh().cos.eq, (s.cos || {}).eq || {}); } } catch (e) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const has = id => S.owned.includes(id);
const maxO2 = () => CFG.oxygen.base + (has("tank1") ? CFG.oxygen.tankBonus : 0) + (has("tank2") ? CFG.oxygen.tankBonus : 0);
const COS = CFG.cosmetics;
const SLOTS = [["paint", "Paint"], ["decal", "Decal"], ["light", "Lights"], ["trail", "Trail"], ["fin", "Attachment"]];
let baySlot = "paint", preview = null;   // preview = { slot, id } while trying on an item
const cosOwned = (slot, id) => COS[slot][0].id === id || S.cos.owned.includes(slot + ":" + id);
const cosIndex = (slot, id) => Math.max(0, COS[slot].findIndex(c => c.id === id));
function currentCos() { const eq = Object.assign({}, S.cos.eq); if (preview && mode === "base" && tab === "bay") eq[preview.slot] = preview.id; return eq; }
function logQuery(q) { S.qlog.unshift(q); S.qlog = S.qlog.slice(0, 4); }
function buyCos(slot, id) {
  const it = COS[slot].find(c => c.id === id); if (!it || cosOwned(slot, id) || S.banked < it.price) return;
  if (it.req && !S.slain.includes(it.req)) return;
  S.banked -= it.price; S.cos.owned.push(slot + ":" + id);
  logQuery(`INSERT INTO owned_cosmetic (sub_id, item_id) VALUES (1, '${slot}-${cosIndex(slot, id)}');`);
  equipCos(slot, id, true);
  toast(it.name + " purchased", "gold");
}
function equipCos(slot, id, quiet) {
  if (!cosOwned(slot, id)) return;
  S.cos.eq[slot] = id; preview = null;
  logQuery(`UPDATE submarine SET ${slot}_id = ${cosIndex(slot, id)} WHERE sub_id = 1;`);
  persist(); if (!quiet) toast(COS[slot].find(c => c.id === id).name + " equipped"); render();
}
const lossMul = () => has("rebreather") ? CFG.oxygen.rebreatherMultiplier : 1;

let mode = "base";        // base | dive | result
let tab = "dive";
let D = null;             // active dive
let result = null;

const $ = id => document.getElementById(id);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const unlockedZone = i => (i === 0 || S.cleared.includes(i - 1));
const hullOk = i => S.hull >= ZONES[i].hull;

let toastT;
function toast(msg, cls) { const t = $("toast"); t.textContent = msg; t.className = "toast " + (cls || ""); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 1400); }

/* =========================================================
   DIVE LOGIC
   ========================================================= */
function startDive(zi, tutorial) {
  const z = ZONES[zi];
  if (tutorial) {
    const plan = JSON.parse(JSON.stringify(TUT_PLAN));
    plan[2].qs.forEach(q => q.opts = shuffle([q.a, ...q.w])); plan[0].opts = shuffle([plan[0].a, ...plan[0].w]);
    D = { zone: 0, plan, idx: -1, o2: maxO2(), carried: 0, answered: false, sonarUsed: false, tutorial: true };
    mode = "dive"; scene.enterZone(0); nextEncounter(); return;
  }
  const scans = shuffle(z.mc).slice(0, CFG.dive.scansPerDive).map(m => ({ type: "scan", ...m, opts: shuffle([m.a, ...m.w]), obj: ["fragment", "sample", "drive"][Math.floor(Math.random() * 3)] }));
  const sp = JSON.parse(JSON.stringify(z.special)); sp.type = z.special.type;
  const beast = { type: "beast", hp: z.creature.hp, maxHp: z.creature.hp, qs: shuffle(z.creature.qs).slice(0, z.creature.hp).map(m => ({ ...m, opts: shuffle([m.a, ...m.w]) })), qi: 0 };
  const plan = [scans[0], scans[1], sp, scans[2], beast, scans[3]];
  D = { zone: zi, plan, idx: -1, o2: maxO2(), carried: 0, phase: "travel", answered: false, sonarUsed: false, t0: performance.now() };
  S.dives++; persist();
  mode = "dive";
  scene.enterZone(zi);
  nextEncounter();
}
function reward(base) { const z = D.zone; const v = Math.round(base * (1 + z * CFG.rewards.depthMultiplierPerZone)); D.carried += v; scene.floatText("+" + v, "gold"); return v; }
function drain(amount, why) {
  D.o2 = Math.max(0, D.o2 - Math.round(amount));
  if (why) scene.floatText("−" + Math.round(amount) + " O₂", "red");
  drawHud();
  if (D.o2 <= 0 && D.tutorial) { D.o2 = 20; drawHud(); return false; }
  if (D.o2 <= 0) {
    if (S.canisters > 0) { S.canisters--; persist(); D.o2 = Math.round(maxO2() / 2); toast("Emergency canister used", "gold"); drawHud(); return false; }
    blackout(); return true;
  }
  return false;
}
function nextEncounter() {
  D.idx++; D.answered = false; D.sonarUsed = false;
  if (D.idx >= D.plan.length) return finishDive(true);
  const e = D.plan[D.idx];
  if (e.type === "beast" && !S.seen.includes(ZONES[D.zone].creature.id)) { S.seen.push(ZONES[D.zone].creature.id); persist(); }
  const swim = has("glider") ? CFG.oxygen.swimCostWithGlider : CFG.oxygen.swimCost;
  D.phase = "approach";
  scene.setTarget(e);
  if (drain(swim, false)) return;
  render();
}
function finishDive(complete) {
  const z = ZONES[D.zone];
  let bonus = 0;
  if (D.tutorial) {
    S.banked += D.carried + CFG.rewards.tutorialBonus; persist();
    result = { kind: "tutorial", zone: 0, carried: D.carried, bonus: CFG.rewards.tutorialBonus, total: D.carried + CFG.rewards.tutorialBonus };
    D = null; mode = "result"; scene.enterBase(); tutStep = "tres"; render(); return;
  }
  if (complete) { bonus = Math.round(CFG.rewards.zoneClearBase + CFG.rewards.zoneClearPerZone * D.zone); if (!S.cleared.includes(D.zone)) S.cleared.push(D.zone); }
  const total = D.carried + bonus;
  S.banked += total; persist();
  result = { kind: complete ? "clear" : "ascend", zone: D.zone, carried: D.carried, bonus, total };
  D = null; mode = "result"; scene.enterBase(); render();
}
function blackout() {
  const lost = Math.ceil(D.carried / 2);
  const kept = D.carried - lost;
  S.banked += kept; persist();
  result = { kind: "blackout", zone: D.zone, carried: D.carried, lost, total: kept };
  D = null; mode = "result"; scene.enterBase(); render();
}
function logNote(q) { const z = String(D.zone); S.notes[z] = S.notes[z] || []; if (!S.notes[z].includes(q)) S.notes[z].push(q); }

/* =========================================================
   RENDER — HUD + PDA sheet
   ========================================================= */
function drawHud() {
  if (mode === "dive" && D) {
    const z = ZONES[D.zone];
    const frac = (D.idx + 1) / (D.plan.length + 1);
    const depth = Math.round(z.depth[0] + (z.depth[1] - z.depth[0]) * Math.max(0, frac));
    $("hZone").textContent = z.name;
    $("hDepth").textContent = depth.toLocaleString() + " m";
    $("hO2").hidden = false;
    const pct = Math.round(100 * D.o2 / maxO2());
    $("hO2v").textContent = D.o2 + " / " + maxO2();
    $("hO2f").style.width = pct + "%";
    $("hO2").classList.toggle("low", pct <= 30);
    $("hCash").textContent = "+" + D.carried;
    $("hCashSub").textContent = "Carried";
  } else {
    $("hZone").textContent = "Seabase · Kelp Shallows";
    $("hDepth").textContent = "12 m";
    $("hO2").hidden = true;
    $("hCash").textContent = S.banked.toLocaleString();
    $("hCashSub").textContent = "Salvage";
  }
}

function render() {
  drawHud();
  const sh = $("sheet");
  if (mode === "base") sh.innerHTML = `<div class="grip"></div>` + baseSheet();
  else if (mode === "result") sh.innerHTML = `<div class="grip"></div>` + resultSheet();
  else sh.innerHTML = `<div class="grip"></div>` + diveSheet();
  wire();
  coach();
  scene.setBay(mode === "base" && tab === "bay");
  scene.measure();
}

function baseSheet() {
  const tabs = `<div class="tabs" role="tablist">${[["dive", "Dive map"], ["fab", "Fabricator"], ["bay", "Sub Bay"], ["bank", "Databank"]].map(([k, l]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>`;
  if (tab === "dive") {
    const intro = S.dives === 0 ? `<p class="muted">You survived the crash and set up a habitat in the shallows. Each depth zone below is one lecture. Scan what you find, fight off the creatures of bad database design, and bring back salvage to build better gear.</p><p class="muted">Oxygen drains as you swim and when you make mistakes. Ascend any time to bank your salvage. If you black out, you lose half of what you're carrying.</p>` : "";
    return tabs + intro + `<div class="row" style="margin:0 0 10px"><button class="btn ghost small" data-act="tut">${S.tut === "done" ? "Replay tutorial" : "Show tutorial"}</button></div><div class="zones">${ZONES.map((z, i) => {
      const cl = S.cleared.includes(i), un = unlockedZone(i), hk = hullOk(i);
      const st = cl ? `<span class="zs ok">Cleared ✓<br>Dive again</span>` : !un ? `<span class="zs lock">Clear ${esc(ZONES[i - 1].name)}<br>first</span>` : !hk ? `<span class="zs lock">Needs Hull<br>Mk ${["I", "II", "III", "IV"][z.hull - 1]}</span>` : `<span class="zs go">Ready<br>to dive</span>`;
      return `<button class="zbtn" data-zone="${i}" ${un && hk ? "" : "disabled"}><span class="zn">${esc(z.name)} <span class="mono muted" style="font-size:.8rem">${z.depth[0]}–${z.depth[1].toLocaleString()} m</span></span><span class="zt">${esc(z.topic)}</span>${st}</button>`;
    }).reverse().join("")}</div>`;
  }
  if (tab === "fab") {
    return tabs + `<p class="muted">Every correct answer earns salvage. Spend it here. You carry ${S.sonar} sonar charge${S.sonar === 1 ? "" : "s"} and ${S.canisters} canister${S.canisters === 1 ? "" : "s"}.</p><div class="shop">` + SHOP.map(it => {
      if (it.sect) return `<div class="sect">${esc(it.sect)}</div>`;
      const owned = it.kind === "hull" ? S.hull >= it.lvl : (it.kind === "gear" || it.kind === "module") && has(it.id);
      const reqOk = !it.req || has(it.req);
      const full = it.kind === "canister" && S.canisters >= CFG.start.maxCanisters;
      const afford = S.banked >= it.cost;
      const btn = owned ? `<span class="owned">Installed</span>` : !reqOk ? `<span class="owned" style="color:var(--muted)">Needs previous</span>` : full ? `<span class="owned" style="color:var(--muted)">Full</span>` :
        `<button class="btn small buy" data-buy="${it.id}" ${afford ? "" : "disabled"}><span class="price" style="color:inherit">${it.cost}</span></button>`;
      return `<div class="item"><span class="in">${esc(it.name)}</span><span class="id">${esc(it.desc)}</span><span class="buy">${btn}</span></div>`;
    }).join("") + `</div>`;
  }
  if (tab === "bay") return tabs + baySheet();
  // databank
  const anyNotes = Object.keys(S.notes).length;
  return tabs + `<p class="muted">Creature files and every concept you've scanned correctly. Use it as your study notes.</p>` +
    ZONES.map((z, i) => {
      const c = z.creature, seen = S.seen.includes(c.id), slain = S.slain.includes(c.id);
      const notes = (S.notes[String(i)] || []).map(q => z.mc.find(m => m.q === q)).filter(Boolean);
      if (!seen && !notes.length) return "";
      return `<details class="log"${i === 0 && anyNotes < 3 ? " open" : ""}><summary>${esc(z.name)} · ${esc(z.topic)}</summary>` +
        (seen ? `<div class="beast"><div class="bn">${esc(c.name)}${slain ? " · repelled" : ""}</div><div><b>Bad practice:</b> ${esc(c.practice)}</div><div class="muted">${esc(c.lore)}</div><div><b>Counter:</b> ${esc(c.counter)}</div></div>` : "") +
        notes.map(m => `<div class="entry"><div>${esc(m.q)}</div><div class="a">${esc(m.a)}</div><div class="muted">${esc(m.why)}</div></div>`).join("") + `</details>`;
    }).join("") || `<p>No entries yet. Dive and scan to fill the databank.</p>`;
}

function baySheet() {
  const eq = S.cos.eq;
  const rows = SLOTS.map(([k]) => `<td>${cosIndex(k, eq[k])}</td>`).join("");
  const list = COS[baySlot].map((c, i) => {
    const owned = cosOwned(baySlot, c.id), on = eq[baySlot] === c.id, pv = preview && preview.slot === baySlot && preview.id === c.id;
    const locked = c.req && !S.slain.includes(c.req);
    const act = on ? `<span class="owned">Equipped</span>` : owned ? `<button class="btn small" data-equip="${c.id}">Equip</button>` :
      locked ? `<span class="owned" style="color:var(--danger)">Locked</span>` : `<button class="btn small" data-buycos="${c.id}" ${S.banked >= c.price ? "" : "disabled"}><span class="price" style="color:inherit">${c.price}</span></button>`;
    return `<div class="item cos ${pv ? "pv" : ""}" data-try="${c.id}" tabindex="0"><span class="in"><span class="mono muted">#${i}</span> ${esc(c.name)}</span><span class="id">${esc(c.desc)}${!owned && !locked ? " Tap to preview." : ""}</span><span class="buy">${act}</span></div>`;
  }).join("");
  return `<p class="muted">Your sub is one row in the <code>submarine</code> table. Each slot is a foreign key pointing into a cosmetic table, and everything you buy goes into the <code>owned_cosmetic</code> bridge table. That's a many-to-many link between subs and items.</p>
    <div class="rec"><div class="rq">SELECT * FROM submarine WHERE sub_id = 1;</div><div class="rt"><table><tr><th>sub_id</th>${SLOTS.map(([k]) => `<th>${k}_id</th>`).join("")}</tr><tr><td>1</td>${rows}</tr></table></div></div>
    <div class="slots" role="tablist">${SLOTS.map(([k, l]) => `<button class="chip ${baySlot === k ? "sel" : ""}" data-slot="${k}" aria-pressed="${baySlot === k}">${l}</button>`).join("")}</div>
    <div class="sect">Table: ${baySlot}</div><div class="shop">${list}</div>
    ${S.qlog.length ? `<div class="sect">Query log</div><div class="qlog">${S.qlog.map(q => `<div>${esc(q)}</div>`).join("")}</div>` : ""}`;
}

function resultSheet() {
  const r = result, z = ZONES[r.zone];
  if (r.kind === "tutorial") return `<div class="kicker">Training complete</div><h2>Back at the seabase</h2><p>You banked <span class="price">${r.total}</span> salvage, including a <span class="price">20</span> training bonus.</p><div class="row"><button class="btn" data-act="home">Back to seabase</button></div>`;
  const next = ZONES[r.zone + 1];
  if (r.kind === "blackout") return `<div class="kicker red">Oxygen depleted</div><h2>You blacked out in ${esc(z.name)}</h2>
    <p>Your lifepod's tether hauled you back to the seabase. You dropped ${r.lost} salvage on the way up and kept ${r.total}.</p>
    <p class="muted">Tip: the Rebreather and bigger O₂ tanks at the Fabricator make deep dives safer.</p>
    <div class="row"><button class="btn" data-act="home">Back to seabase</button></div>`;
  const lead = r.kind === "clear" ? `<div class="kicker">Zone cleared</div><h2>${esc(z.name)} charted</h2>` : `<div class="kicker">Surfaced early</div><h2>Back from ${esc(z.name)}</h2>`;
  const nextTip = r.kind === "clear" && next ? (S.hull >= next.hull ? `<p>${esc(next.name)} is open below you.</p>` : `<p>${esc(next.name)} is deeper than your hull can handle. Build Pressure Hull Mk ${["I", "II", "III", "IV"][next.hull - 1]} at the Fabricator.</p>`) : (r.kind === "clear" && !next ? `<p>You reached the bottom of the trench and repelled the Anomaly Leviathan. The whole schema is yours.</p>` : "");
  return lead + `<p>Salvage banked: <span class="price">${r.carried}</span>${r.bonus ? ` + <span class="price">${r.bonus}</span> zone bonus` : ""} = <span class="price">${r.total}</span></p>${nextTip}
    <div class="row"><button class="btn" data-act="home">Back to seabase</button><button class="btn ghost" data-act="fab">Open Fabricator</button></div>`;
}

function diveSheet() {
  const z = ZONES[D.zone], e = D.plan[D.idx];
  const step = `<span class="mono muted" style="float:right;font-size:.75rem">${D.idx + 1}/${D.plan.length}</span>`;
  const ascend = `<button class="btn ghost small" data-act="ascend">Ascend now and bank ${D.carried}</button>`;
  if (e.type === "scan") {
    const label = { fragment: "Wreck fragment", sample: "Flora sample", drive: "Data drive" }[e.obj];
    const sonarBtn = !D.answered && S.sonar > 0 && !D.sonarUsed ? `<button class="btn ghost small" data-act="sonar">Sonar ping (${S.sonar})</button>` : "";
    return `<div class="kicker">Scanning · ${label}</div>${step}<div class="q">${esc(e.q)}</div>
      <div class="opts">${e.opts.map((o, k) => `<button class="opt" data-opt="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      <div id="fb"></div><div class="row">${sonarBtn}<span class="grow"></span>${D.answered ? "" : ascend}</div>`;
  }
  if (e.type === "beast") {
    const c = z.creature, q = e.qs[e.qi];
    return `<div class="kicker red">Hostile · ${esc(c.name)}</div>${step}<div class="hp" aria-label="Creature health">${Array.from({ length: e.maxHp || c.hp }, (_, k) => `<i class="${k < e.hp ? "" : "off"}"></i>`).join("")}</div>
      <p class="muted" style="font-size:.92rem"><b style="color:var(--ink)">Bad practice:</b> ${esc(c.practice)}. Answer correctly to drive it back.</p>
      <div class="q">${esc(q.q)}</div>
      <div class="opts">${q.opts.map((o, k) => `<button class="opt" data-opt="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      <div id="fb"></div><div class="row"><span class="grow"></span>${D.answered ? "" : `<button class="btn ghost small" data-act="ascend">Flee to the surface and bank ${D.carried}</button>`}</div>`;
  }
  if (e.type === "sort") {
    if (!e.left) { e.left = shuffle(e.items.map((_, k) => k)); e.placed = e.bins.map(() => []); e.sel = null; }
    return `<div class="kicker">Salvage · ${esc(e.title)}</div>${step}<p>${esc(e.prompt)} Pick an item, then tap its pile.</p>
      <div class="chips">${e.left.map(k => `<button class="chip ${e.sel === k ? "sel" : ""}" data-chip="${k}" aria-pressed="${e.sel === k}">${esc(e.items[k].t)}</button>`).join("") || `<span class="muted">All sorted.</span>`}</div>
      <div class="bins">${e.bins.map((b, bi) => `<button class="bin ${e.sel !== null ? "armed" : ""}" data-bin="${bi}"><span class="bt">${esc(b)}</span><span class="bi">${e.placed[bi].map(k => `<span class="chip in">${esc(e.items[k].t)}</span>`).join("")}</span></button>`).join("")}</div>
      <div id="fb">${e.done ? doneNote("Salvage secured", "Everything is in the right pile.") : ""}</div>${e.done ? "" : `<div class="row"><span class="grow"></span><button class="btn ghost small" data-act="ascend">Ascend now and bank ${D.carried}</button></div>`}`;
  }
  // stack
  if (!e.yard) { e.yard = shuffle(e.blocks.map((_, k) => k)); e.placed = []; }
  return `<div class="kicker">Fabricate · ${esc(e.title)}</div>${step}<p>${esc(e.prompt)}</p>
    <div class="yard">${e.yard.map(k => `<button class="blk" data-blk="${k}">${esc(e.blocks[k].trim())}</button>`).join("")}</div>
    <div class="stack">${e.placed.map(k => `<div>${esc(e.blocks[k])}</div>`).join("")}${e.placed.length < e.blocks.length ? `<div class="nx">▸ next piece…</div>` : ""}</div>
    <div id="fb">${e.done ? doneNote("Query fabricated", e.why) : ""}</div>${e.done ? "" : `<div class="row"><span class="grow"></span><button class="btn ghost small" data-act="ascend">Ascend now and bank ${D.carried}</button></div>`}`;
}
const doneNote = (t, m) => `<div class="fb good"><b>${esc(t)}</b><p>${esc(m)}</p></div><div class="row"><button class="btn" data-act="next">${D && D.idx + 1 >= D.plan.length ? "Finish dive" : "Swim on"}</button></div>`;

function wire() {
  const sh = $("sheet");
  sh.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; preview = null; render(); });
  sh.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => { baySlot = b.dataset.slot; preview = null; render(); });
  sh.querySelectorAll("[data-buycos]").forEach(b => b.onclick = ev => { ev.stopPropagation(); buyCos(baySlot, b.dataset.buycos); });
  sh.querySelectorAll("[data-equip]").forEach(b => b.onclick = ev => { ev.stopPropagation(); equipCos(baySlot, b.dataset.equip); });
  sh.querySelectorAll("[data-try]").forEach(b => b.onclick = () => { const id = b.dataset.try; preview = cosOwned(baySlot, id) ? null : { slot: baySlot, id }; if (!preview) { if (S.cos.eq[baySlot] !== id) equipCos(baySlot, id); } else render(); });
  sh.querySelectorAll("[data-zone]").forEach(b => b.onclick = () => startDive(+b.dataset.zone));
  sh.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => buy(b.dataset.buy));
  sh.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act(b.dataset.act));
  sh.querySelectorAll("[data-opt]").forEach(b => b.onclick = () => answer(+b.dataset.opt, b));
  sh.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => { const e = D.plan[D.idx]; const k = +b.dataset.chip; e.sel = e.sel === k ? null : k; render(); });
  sh.querySelectorAll("[data-bin]").forEach(b => b.onclick = () => placeChip(+b.dataset.bin, b));
  sh.querySelectorAll("[data-blk]").forEach(b => b.onclick = () => placeBlock(+b.dataset.blk, b));
}

/* =========================================================
   TUTORIAL COACH — short guided walkthrough with a training dive
   ========================================================= */
let tutStep = null;
function coach() {
  const box = $("coach");
  document.querySelectorAll(".spot").forEach(el => el.classList.remove("spot"));
  if (!tutStep) { box.hidden = true; return; }
  const sh = $("sheet");
  const spot = sel => { const el = typeof sel === "string" ? document.querySelector(sel) : sel; if (el) el.classList.add("spot"); return el; };
  let text = "", btns = "", step = "";
  if (mode === "base" && ["welcome", "cash", "map"].includes(tutStep) && tab !== "dive") { tab = "dive"; return render(); }
  if (tutStep === "welcome") { step = "1/5"; text = "Welcome to Deep Schema. You're stranded on an ocean planet, and the only way to survive is to know your database design. Every question here comes from your ITSC 3160 lectures."; btns = `<button class="btn small" data-tut="cash">Next</button>`; }
  else if (tutStep === "cash") { step = "2/5"; spot(".cash"); text = "This is your salvage, the game's money. You earn it with correct answers and spend it on gear that keeps you alive deeper down."; btns = `<button class="btn small" data-tut="map">Next</button>`; }
  else if (tutStep === "map") { step = "3/5"; spot(sh.querySelector('[data-zone="0"]')); text = "Each depth zone is one lecture, from Intro to Databases down to Normalization. Clear a zone to unlock the next one. Let's do a short training dive first."; btns = `<button class="btn small" data-tut="dive">Start training dive</button>`; }
  else if (mode === "dive" && D) {
    step = "4/5";
    const e = D.plan[D.idx];
    if (e.type === "scan" && !D.answered) { spot(sh.querySelector(".opts")); text = "Scan: read the question and tap the answer you think is right. (Tip: tap the water to steer your sub.) A right answer earns salvage. A wrong one costs oxygen, but you'll always see the correct answer and why."; }
    else if (e.type === "scan") { spot("#hO2"); spot("#nx"); text = "That's a scan. Keep an eye on your oxygen bar at the top. Swimming and mistakes drain it. Tap Swim on to reach the next target."; }
    else if (e.type === "sort" && !e.done) { spot(sh.querySelector(".chips")); text = "Salvage: tap an item to pick it up, then tap the pile it belongs in. A wrong pile costs a little oxygen."; }
    else if (e.type === "sort") { spot(sh.querySelector('[data-act="next"]')); text = "All sorted. Tap Swim on. A creature is waiting ahead."; }
    else if (e.type === "beast" && !D.answered) { spot(sh.querySelector(".hp")); text = "Hostile! Every creature is a bad database habit. The red bars are its health, and each correct answer knocks one off. A wrong answer lets it bite, which costs oxygen. If a fight goes badly, you can flee to the surface."; }
    else { spot(sh.querySelector("#nx, #again")); text = "That's how fights work. Tap the button to finish the training dive and bank your salvage."; }
    btns = "";
  }
  else if (tutStep === "tres") { step = "4/5"; spot(sh.querySelector('[data-act="home"]')); text = "Ascending banks everything you carried. If you black out instead, you lose half. Head back to the seabase."; }
  else if (tutStep === "fab" && mode === "base") { step = "5/5"; if (tab !== "fab") { tab = "fab"; return render(); } spot(sh.querySelector('.item [data-buy="sonar"]')?.closest(".item")); text = "The Fabricator is where you spend salvage. Sonar charges rule out a wrong answer. Pressure hulls open deeper zones. Bigger tanks and the Rebreather help you survive longer."; btns = `<button class="btn small" data-tut="bank">Next</button>`; }
  else if (tutStep === "bank" && mode === "base") { step = "5/5"; if (tab !== "bank") { tab = "bank"; return render(); } spot(sh.querySelector('[data-tab="bank"]')); text = "The Databank saves every concept you scan correctly and every creature you meet. It works as your study notes, so read it before the exam."; btns = `<button class="btn small" data-tut="go">Next</button>`; }
  else if (tutStep === "go" && mode === "base") { step = "Done"; if (tab !== "dive") { tab = "dive"; return render(); } spot(sh.querySelector('[data-zone="0"]')); text = "You're ready. Dive into the Kelp Shallows to start Lecture 1. Spend spare salvage on paint, lights and trails in the Sub Bay. You can replay this tutorial any time from the Dive map."; btns = `<button class="btn small" data-tut="done">Got it</button>`; }
  else { box.hidden = true; return; }
  box.innerHTML = `<div class="who"><span>PDA guide</span><span>${step}</span></div><p>${text}</p><div class="row">${btns}<span class="grow"></span><button class="skip" data-tut="skip">Skip tutorial</button></div>`;
  box.hidden = false;
  box.querySelectorAll("[data-tut]").forEach(b => b.onclick = () => {
    const n = b.dataset.tut;
    if (n === "skip" || n === "done") { tutStep = null; S.tut = "done"; persist(); render(); return; }
    if (n === "dive") { tutStep = "diving"; startDive(0, true); return; }
    tutStep = n; render();
  });
}

function act(a) {
  if (a === "home") { mode = "base"; tab = tutStep === "tres" ? "fab" : "dive"; if (tutStep === "tres") tutStep = "fab"; result = null; render(); }
  else if (a === "fab") { mode = "base"; tab = "fab"; result = null; render(); }
  else if (a === "ascend") finishDive(false);
  else if (a === "tut") { tutStep = "welcome"; render(); }
  else if (a === "next") nextEncounter();
  else if (a === "sonar") {
    const e = D.plan[D.idx]; if (S.sonar <= 0 || D.sonarUsed) return;
    S.sonar--; D.sonarUsed = true; persist();
    const wrongIdx = e.opts.map((o, k) => o === e.a ? -1 : k).filter(k => k >= 0);
    const kill = wrongIdx[Math.floor(Math.random() * wrongIdx.length)];
    scene.ping();
    render();
    const b = $("sheet").querySelector(`[data-opt="${kill}"]`); if (b) { b.classList.add("gone"); b.disabled = true; }
  }
}

function buy(id) {
  const it = SHOP.find(x => x.id === id);
  if (!it || S.banked < it.cost) return;
  S.banked -= it.cost;
  if (it.kind === "hull") S.hull = it.lvl;
  else if (it.kind === "sonar") S.sonar += 3;
  else if (it.kind === "canister") S.canisters = Math.min(CFG.start.maxCanisters, S.canisters + 1);
  else S.owned.push(id);
  persist(); toast(it.name + " fabricated", "gold"); scene.refreshBase(); render();
}

function answer(k, btn) {
  const e = D.plan[D.idx];
  if (e.type === "scan") {
    if (D.answered) return; D.answered = true;
    const ok = e.opts[k] === e.a;
    if (ok) { reward(CFG.rewards.scanCorrect); logNote(e.q); scene.beam(true); } else { scene.beam(false); }
    paintOpts(e.opts, e.a, k);
    $("fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "Scan complete" : "Scan corrupted"}</b><p>${ok ? "" : "Answer: " + esc(e.a) + ". "}${esc(e.why)}</p></div>`;
    if (!ok && drain(CFG.oxygen.wrongScanCost * lossMul(), true)) return;
    persist();
    showNext();
  } else if (e.type === "beast") {
    if (D.answered) return; D.answered = true;
    const q = e.qs[e.qi], c = ZONES[D.zone].creature;
    const ok = q.opts[k] === q.a;
    paintOpts(q.opts, q.a, k);
    if (ok) { e.hp--; reward(CFG.rewards.creatureHit); scene.hitCreature(); } else { scene.creatureLunge(); }
    const won = e.hp <= 0;
    $("fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? (won ? c.name + " repelled" : "Direct hit") : c.name + " strikes"}</b><p>${ok ? "" : "Answer: " + esc(q.a) + ". "}${esc(q.why)}</p></div>`;
    if (!ok && drain(CFG.oxygen.creatureBiteCost * lossMul(), true)) return;
    if (won) { reward(CFG.rewards.creatureDefeat); if (!S.slain.includes(c.id)) S.slain.push(c.id); persist(); scene.creatureFlee(); showNext(); return; }
    e.qi = (e.qi + 1) % e.qs.length;
    if (!ok && e.qi === 0) e.qs = shuffle(e.qs).map(x => ({ ...x, opts: shuffle(x.opts) }));
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = `<button class="btn" id="again">${ok ? "Keep fighting" : "Try again"}</button>`;
    $("fb").appendChild(row); $("again").focus();
    $("again").onclick = () => { D.answered = false; render(); };
    coach();
  }
}
function paintOpts(opts, a, k) {
  $("sheet").querySelectorAll("[data-opt]").forEach(b => {
    const i = +b.dataset.opt; b.disabled = true;
    if (opts[i] === a) b.classList.add("right"); else if (i === k) b.classList.add("wrong"); else b.classList.add("dim");
  });
}
function showNext() {
  const row = document.createElement("div"); row.className = "row";
  row.innerHTML = `<button class="btn" id="nx">${D.idx + 1 >= D.plan.length ? "Finish dive" : "Swim on"}</button><span class="grow"></span><button class="btn ghost small" id="asc">Ascend and bank ${D.carried}</button>`;
  $("fb").appendChild(row); $("nx").focus();
  $("nx").onclick = nextEncounter; $("asc").onclick = () => finishDive(false);
  coach();
}
function placeChip(bi, binEl) {
  const e = D.plan[D.idx];
  if (e.sel === null || e.sel === undefined) { const c = $("sheet").querySelector(".chips"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); return; }
  const k = e.sel, it = e.items[k];
  if (it.b === bi) {
    e.placed[bi].push(k); e.left = e.left.filter(x => x !== k); e.sel = null; reward(CFG.rewards.puzzlePiece);
    if (!e.left.length) e.done = true;
    render();
  } else {
    e.sel = null; render();
    $("fb").innerHTML = `<div class="fb bad"><b>Wrong pile</b><p>“${esc(it.t)}” doesn't go in ${esc(e.bins[bi])}. ${esc(it.why)}</p></div>`;
    drain(CFG.oxygen.wrongPieceCost * lossMul(), true);
  }
}
function placeBlock(k, el) {
  const e = D.plan[D.idx];
  const want = e.placed.length;
  if (e.blocks[k].trim() === e.blocks[want].trim()) {
    e.placed.push(want); e.yard = e.yard.filter(x => x !== k); reward(CFG.rewards.puzzlePiece);
    if (e.placed.length === e.blocks.length) e.done = true;
    render();
  } else {
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
    $("fb").innerHTML = `<div class="fb bad"><b>Doesn't fit</b><p>“${esc(e.blocks[k].trim())}” isn't next. ${esc(e.why)}</p></div>`;
    drain(CFG.oxygen.wrongPieceCost * lossMul(), true);
  }
}

/* =========================================================
   SCENE — animated canvas ocean
   ========================================================= */
const scene = (() => {
  const cv = $("scene"), ctx = cv.getContext("2d", { alpha: false });
  let W = 0, H = 0, DPR = 1, t = 0, last = 0;
  let floorY = 400, floorTarget = 400, viewTop = 64;
  let zone = -1;            // -1 = base
  let layers = null, target = null, floats = [];
  const fx = { beam: 0, beamOk: true, hit: 0, hurt: 0, lunge: 0, ping: 0, flee: 0, travel: 0 };
  const snow = [], bubbles = [], fish = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dprCap = CFG.graphics.maxPixelRatio, lowFx = false, frameLog = [], tuned = 0;
  let G = {};               // cached gradients, rebuilt only on size/zone change
  let floorGradY = -1;
  let camX = 0, camV = 0, bay = false, tap = null;
  const PAD = 260;
  const wrapX = (x, par) => { const span = W + PAD * 2; return ((x - camX * par) % span + span) % span - PAD; };
  const sub = { x: 120, y: 260, vx: 0, vy: 0, fs: 1, tilt: 0, sc: 1, wp: null, wpT: 0, hold: 0, emit: 0 };
  const trail = [], hist = [];
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };

  /* ---------- pre-rendered sprites (built once) ---------- */
  const sprite = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
  const glowCache = {};
  function glowSprite(rgb) {
    if (glowCache[rgb]) return glowCache[rgb];
    return glowCache[rgb] = sprite(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.35, `rgba(${rgb},0.45)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  }
  function glow(x, y, rad, rgb, a) { if (a <= 0) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(glowSprite(rgb), x - rad, y - rad, rad * 2, rad * 2); ctx.globalAlpha = 1; }
  const coneSprite = sprite(256, 160, (g, w, h) => {
    const r = g.createRadialGradient(0, h / 2, 4, 40, h / 2, w); r.addColorStop(0, "rgba(255,245,200,0.34)"); r.addColorStop(1, "rgba(255,245,200,0)");
    g.fillStyle = r; g.beginPath(); g.moveTo(0, h / 2 - 4); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(0, h / 2 + 4); g.closePath(); g.fill();
  });
  const holeSprite = sprite(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 10, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const vignetteSprite = sprite(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 30, 64, 64, 92); r.addColorStop(0, "rgba(180,30,20,0)"); r.addColorStop(1, "rgba(180,30,20,1)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });

  function resize() {
    DPR = Math.min(dprCap, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    measure(); floorY = floorTarget; build();
  }
  function measure() {
    const hud = document.querySelector(".hud");
    viewTop = hud ? hud.getBoundingClientRect().bottom : 60;
    const sh = $("sheet").getBoundingClientRect();
    floorTarget = Math.max(viewTop + 170, Math.min(sh.top, H) - 6);
  }
  function build() {
    const rng = mulberry(1234 + (zone + 2) * 977);
    layers = { rocks: [], flora: [], far: [] };
    const SPAN = W + PAD * 2;
    for (let i = 0; i < 9; i++) layers.far.push({ x: rng() * SPAN, w: 120 + rng() * 260, h: 60 + rng() * 140 });
    for (let i = 0; i < 12; i++) layers.rocks.push({ x: rng() * SPAN, w: 40 + rng() * 120, h: 14 + rng() * 40 });
    const n = Math.max(10, Math.round(SPAN / (lowFx ? 60 : 44)));
    for (let i = 0; i < n; i++) layers.flora.push({ x: (i + rng()) * (SPAN / n), h: 0.5 + rng() * 0.8, p: rng() * 6.28, s: rng() });
    snow.length = 0; const ns = Math.min(lowFx ? 30 : 60, Math.round(W * H / 12000)); for (let i = 0; i < ns; i++) snow.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.6, v: 4 + Math.random() * 10 });
    fish.length = 0;
    if (zone <= 2 && !lowFx) for (let i = 0; i < 10; i++) fish.push({ x: Math.random() * W, o: Math.random() * 6.28, sp: 18 + Math.random() * 18, k: i });
    const z = Z();
    G.water = ctx.createLinearGradient(0, 0, 0, H); G.water.addColorStop(0, z.pal.top); G.water.addColorStop(0.75, z.pal.bot); G.water.addColorStop(1, z.pal.bot);
    G.ray = ctx.createLinearGradient(0, 0, 0, H * 0.6); G.ray.addColorStop(0, "rgba(190,255,250,0.10)"); G.ray.addColorStop(1, "rgba(190,255,250,0)");
    floorGradY = -1;
  }
  function floorGrad() {
    if (Math.abs(floorGradY - floorY) > 3) { const z = Z(); G.floor = ctx.createLinearGradient(0, floorY - 20, 0, H); G.floor.addColorStop(0, z.pal.floor); G.floor.addColorStop(1, "#000"); floorGradY = floorY; }
    return G.floor;
  }

  const Z = () => zone >= 0 ? ZONES[zone] : { pal: { top: "#2aa6bf", bot: "#0d5f78", fog: "#13708a", floor: "#3c6b56" }, flora: "kelp" };
  const mid = () => (viewTop + floorY) / 2;
  const groundAt = x => floorY + Math.sin((x + camX) * 0.013) * 8 + Math.sin((x + camX) * 0.041) * 4;

  /* ---------- environment ---------- */
  function water() {
    const z = Z();
    ctx.fillStyle = G.water; ctx.fillRect(0, 0, W, H);
    const shallow = zone < 0 ? 1 : Math.max(0, 1 - zone / 3.5);
    if (shallow > 0 && !lowFx) {
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = shallow; ctx.fillStyle = G.ray;
      for (let i = 0; i < 5; i++) { const x = (i * 0.22 + 0.05) * W + Math.sin(t * 0.25 + i) * 30; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 130 + i * 10, H * 0.6); ctx.lineTo(x + 40, H * 0.6); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    ctx.fillStyle = z.pal.fog; ctx.globalAlpha = 0.55;
    ctx.beginPath();
    layers.far.forEach(f0 => { const f = { x: wrapX(f0.x, 0.35), w: f0.w, h: f0.h }; if (f.x > W || f.x + f.w < 0) return; ctx.moveTo(f.x, floorY + 10); ctx.quadraticCurveTo(f.x + f.w * 0.3, floorY - f.h, f.x + f.w * 0.55, floorY - f.h * 0.7); ctx.quadraticCurveTo(f.x + f.w * 0.8, floorY - f.h * 0.4, f.x + f.w, floorY + 10); });
    ctx.fill(); ctx.globalAlpha = 1;
  }
  function seafloor() {
    ctx.fillStyle = floorGrad();
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 24) ctx.lineTo(x, groundAt(x));
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath();
    layers.rocks.forEach(r0 => { const r = { x: wrapX(r0.x, 1), w: r0.w, h: r0.h }; if (r.x - r.w > W || r.x + r.w < 0) return; ctx.moveTo(r.x + r.w / 2, floorY + 4); ctx.ellipse(r.x, floorY + 4, r.w / 2, r.h / 2, 0, 0, Math.PI, true); });
    ctx.fill();
  }
  function flora() {
    const type = Z().flora;
    if (type === "kelp") {
      ctx.lineCap = "round"; ctx.lineWidth = 5;
      for (const shade of ["#3f8f4a", "#5aa64c"]) {
        ctx.strokeStyle = shade; ctx.beginPath();
        layers.flora.forEach((f, i) => { if ((i % 3 ? "#3f8f4a" : "#5aa64c") !== shade) return; const x = wrapX(f.x, 1); if (x < -40 || x > W + 40) return; const y = groundAt(x) + 2, sw = reduce ? 0 : Math.sin(t * 0.8 + f.p), h = (floorY - viewTop) * 0.55 * f.h; ctx.moveTo(x, y); for (let s = 1; s <= 7; s++) ctx.lineTo(x + Math.sin(s * 0.7 + t * 0.9 + f.p) * 8 * s / 3 + sw * s * 1.5, y - h * s / 7); });
        ctx.stroke();
      }
      ctx.fillStyle = "#6fbf5a"; ctx.beginPath();
      layers.flora.forEach(f => { const x = wrapX(f.x, 1); if (x < -40 || x > W + 40) return; const y = groundAt(x) + 2, sw = reduce ? 0 : Math.sin(t * 0.8 + f.p), h = (floorY - viewTop) * 0.55 * f.h; for (let s = 2; s <= 7; s += 2) { const yy = y - h * s / 7, xx = x + Math.sin(s * 0.7 + t * 0.9 + f.p) * 8 * s / 3 + sw * s * 1.5; ctx.moveTo(xx + 14, yy); ctx.ellipse(xx + 7, yy, 7, 3, 0.5, 0, 6.28); } });
      ctx.fill();
      return;
    }
    layers.flora.forEach((f, i) => {
      const x = wrapX(f.x, 1); if (x > W + 60 || x < (type === "wreck" && i === 2 ? -250 : -60)) return;
      const y = groundAt(x) + 2, sw = reduce ? 0 : Math.sin(t * 0.8 + f.p);
      if (type === "coral") {
        const cols = ["#ff7a8a", "#ffb36b", "#c77dff", "#ff5d73"];
        if (i % 2 === 0) { ctx.strokeStyle = cols[i % 4]; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); const br = (x0, y0, a, len, d) => { if (d > 3) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); br(x1, y1, a - 0.45 + sw * 0.03, len * 0.72, d + 1); br(x1, y1, a + 0.45 + sw * 0.03, len * 0.72, d + 1); }; br(x, y, -Math.PI / 2, 22 * f.h + 10, 0); ctx.stroke(); }
        else { ctx.fillStyle = cols[(i + 1) % 4]; ctx.beginPath(); ctx.ellipse(x, y - 8, 14 * f.h + 6, 10 * f.h + 5, 0, Math.PI, 0); ctx.fill(); }
      } else if (type === "grass") {
        ctx.strokeStyle = "#8c9a4a"; ctx.lineWidth = 2; ctx.beginPath();
        for (let b = 0; b < 5; b++) { ctx.moveTo(x + b * 4, y); ctx.quadraticCurveTo(x + b * 4 + sw * 6, y - 18 * f.h, x + b * 4 + sw * 10 + 4, y - 30 * f.h - 6); }
        ctx.stroke();
      } else if (type === "crystal") {
        const hue = [270, 200, 300][i % 3], h = 26 + 40 * f.h, w = 9 + 6 * f.s;
        ctx.fillStyle = `hsla(${hue},80%,65%,0.75)`; ctx.strokeStyle = `hsla(${hue},90%,85%,0.9)`; ctx.lineWidth = 1; ctx.beginPath();
        for (const off of [-w, 0, w * 0.9]) { ctx.moveTo(x + off - w / 2, y); ctx.lineTo(x + off - w / 3, y - h * (off ? 0.6 : 1)); ctx.lineTo(x + off, y - h * (off ? 0.7 : 1.15)); ctx.lineTo(x + off + w / 3, y - h * (off ? 0.6 : 1)); ctx.lineTo(x + off + w / 2, y); }
        ctx.fill(); ctx.stroke();
        if (!lowFx) { ctx.globalCompositeOperation = "lighter"; glow(x, y - h / 2, h, hue === 200 ? "90,190,255" : "190,120,255", 0.22 + 0.1 * Math.sin(t * 2 + f.p)); ctx.globalCompositeOperation = "source-over"; }
      } else if (type === "shroom") {
        const h = 30 + 60 * f.h, rgb = ["70,255,240", "90,255,170", "220,120,255"][i % 3], cap = ["#3fe0d0", "#48e08a", "#c77dff"][i % 3];
        ctx.strokeStyle = "#2a3d4f"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 4, y - h / 2, x + sw * 6, y - h); ctx.stroke();
        if (!lowFx) { ctx.globalCompositeOperation = "lighter"; glow(x + sw * 6, y - h, 46, rgb, 0.4 + 0.18 * Math.sin(t * 1.6 + f.p)); ctx.globalCompositeOperation = "source-over"; }
        ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x + sw * 6, y - h, 18 * f.h + 8, 9 * f.h + 5, 0, Math.PI, 0); ctx.fill();
      } else if (type === "wreck") {
        if (i === 2) {
          ctx.fillStyle = "#1a2530"; ctx.strokeStyle = "#3b5366"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 10, y - 70); ctx.lineTo(x + 190, y - 90); ctx.lineTo(x + 230, y - 40); ctx.lineTo(x + 210, y); ctx.closePath(); ctx.fill(); ctx.stroke();
          for (let w = 0; w < 5; w++) { ctx.fillStyle = w === 2 ? `rgba(255,190,90,${0.4 + 0.3 * Math.sin(t * 3)})` : "#0b1219"; ctx.beginPath(); ctx.arc(x + 40 + w * 32, y - 55 - w * 3, 6, 0, 6.28); ctx.fill(); }
        } else if (i % 3 === 0) { ctx.strokeStyle = "#3b5366"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 40 * f.h - 10); ctx.lineTo(x + 26, y - 30 * f.h - 6); ctx.stroke(); }
        else { ctx.strokeStyle = "#556b3a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 5, y - 14, x + sw * 8, y - 24 * f.h); ctx.stroke(); }
      } else if (type === "vent") {
        if (i % 3 === 0) {
          const top = y - 50 * f.h - 20;
          ctx.fillStyle = "#24140e"; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 7, top); ctx.lineTo(x + 7, top); ctx.lineTo(x + 16, y); ctx.fill();
          ctx.globalCompositeOperation = "lighter"; glow(x, top, 26, "255,140,60", 0.75); ctx.globalCompositeOperation = "source-over";
          if (!lowFx) for (let p = 0; p < 4; p++) { const pt = (t * 0.5 + p / 4 + f.p) % 1; ctx.fillStyle = `rgba(120,110,110,${0.35 * (1 - pt)})`; ctx.beginPath(); ctx.arc(x + Math.sin(pt * 6 + p) * 10 * pt, top - pt * 120, 6 + pt * 18, 0, 6.28); ctx.fill(); }
        } else { for (let wv = 0; wv < 3; wv++) { ctx.fillStyle = "#e8e3d0"; ctx.fillRect(x + wv * 5, y - 14 * f.h - 4, 2, 14 * f.h + 4); ctx.fillStyle = "#d9433a"; ctx.fillRect(x + wv * 5 - 1, y - 14 * f.h - 7, 4, 4); } }
      } else if (type === "trench") {
        if (i % 4 === 0) { ctx.globalCompositeOperation = "lighter"; const a = 0.4 + 0.4 * Math.sin(t * 1.3 + f.p); ctx.fillStyle = `rgba(120,200,255,${a})`; ctx.beginPath(); ctx.arc(x, y - 30 - 80 * f.s, 2.2, 0, 6.28); ctx.arc(x + 7, y - 30 - 80 * f.s, 2.2, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
        else { ctx.strokeStyle = "#1c2433"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y - 20 * f.h); ctx.stroke(); }
      }
    });
    if (type === "trench") {
      ctx.fillStyle = "#04060b";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.12, 0); for (let y = 0; y <= floorY; y += 30) ctx.lineTo(W * 0.08 + Math.sin(y * 0.03) * 14, y); ctx.lineTo(0, floorY); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * 0.9, 0); for (let y = 0; y <= floorY; y += 30) ctx.lineTo(W * 0.93 + Math.cos(y * 0.025) * 14, y); ctx.lineTo(W, floorY); ctx.fill();
    }
  }
  function drawFish(dt) {
    if (!fish.length) return;
    for (const col of ["rgba(255,210,120,0.85)", "rgba(180,240,255,0.8)"]) {
      ctx.fillStyle = col; ctx.beginPath();
      fish.forEach(f => {
        if (col.startsWith("rgba(255")) { f.x += (f.sp - camV * 0.6) * dt; if (f.x > W + 30) f.x = -30; if (f.x < -40) f.x = W + 30; }
        if ((f.k % 2 === 1) !== col.startsWith("rgba(255")) return;
        const y = viewTop + 40 + (f.k % 5) * 18 + Math.sin(t * 1.5 + f.o) * 6 + (f.k > 5 ? (floorY - viewTop) * 0.35 : 0);
        ctx.moveTo(f.x + 6, y); ctx.ellipse(f.x, y, 6, 2.6, 0, 0, 6.28); ctx.moveTo(f.x - 5, y); ctx.lineTo(f.x - 10, y - 3); ctx.lineTo(f.x - 10, y + 3);
      });
      ctx.fill();
    }
  }
  function particles(dt) {
    ctx.fillStyle = "rgba(220,240,255,0.4)"; ctx.beginPath();
    snow.forEach(p => { p.y += p.v * dt; if (p.y > H) { p.y = -4; p.x = Math.random() * W; } const x = p.x + Math.sin(t + p.y * 0.01) * 3; ctx.moveTo(x + p.r, p.y); ctx.arc(x, p.y, p.r, 0, 6.28); });
    ctx.fill();
    if (bubbles.length) {
      ctx.strokeStyle = "rgba(220,250,255,0.55)"; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.o) * 0.4; b.l -= dt; if (b.l <= 0 || b.y < 0) { bubbles.splice(i, 1); continue; } ctx.moveTo(b.x + b.r, b.y); ctx.arc(b.x, b.y, b.r, 0, 6.28); }
      ctx.stroke();
    }
  }
  function bubble(x, y, n) { if (bubbles.length > 40) return; for (let i = 0; i < n; i++) bubbles.push({ x: x + Math.random() * 6, y: y + Math.random() * 6, r: 1.5 + Math.random() * 3, v: 30 + Math.random() * 40, o: Math.random() * 6, l: 3 }); }

  /* ---------- your submarine: cosmetics, movement and trails ---------- */
  const PAINTS = {
    std: { body: "#f2c14e", accent: "#d89b2b" }, camo: { body: "#56783e", accent: "#3c5a2b", pat: "camo" },
    coral: { body: "#e2524f", accent: "#a8302f" }, teal: { body: "#1fa7a3", accent: "#147572" },
    stealth: { body: "#1b2330", accent: "#2c3a4d", pat: "seam" }, blueprint: { body: "#1d4f8f", accent: "#163b6c", pat: "grid" },
    levi: { body: "#24405a", accent: "#1e3346", pat: "scales" }, gold: { body: "gold", accent: "#b8892a" }
  };
  const RAINBOW = ["255,90,90", "255,190,80", "250,255,110", "110,255,150", "110,200,255", "200,120,255"];
  const lightRGB = id => ({ std: "255,245,200", cyan: "120,240,255", ruby: "255,90,110", toxic: "150,255,120" }[id] || RAINBOW[Math.floor(t * 1.5) % 6]);
  const coneCache = {};
  const coneFor = rgb => coneCache[rgb] || (coneCache[rgb] = sprite(256, 160, (g, w, h) => {
    const r = g.createRadialGradient(0, h / 2, 4, 40, h / 2, w); r.addColorStop(0, `rgba(${rgb},0.34)`); r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.beginPath(); g.moveTo(0, h / 2 - 4); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(0, h / 2 + 4); g.closePath(); g.fill();
  }));
  let goldGrad = null;

  function drawSub(x, y, sc, fs, tilt, cos, cone) {
    const P = PAINTS[cos.paint] || PAINTS.std, rgb = lightRGB(cos.light);
    if (cone > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(fs >= 0 ? 1 : -1, 1); ctx.rotate(tilt); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = cone; ctx.drawImage(coneFor(rgb), 24 * sc, -150 * sc, 440 * sc, 300 * sc); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt * (fs >= 0 ? 1 : -1)); ctx.scale(fs * sc, sc);
    if (cos.fin === "tail") { ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(-22, -10); ctx.lineTo(-38, -22); ctx.lineTo(-30, -7); ctx.moveTo(-22, 10); ctx.lineTo(-38, 22); ctx.lineTo(-30, 7); ctx.fill(); }
    if (cos.fin === "thrusters") { ctx.fillStyle = "#59636e"; ctx.beginPath(); ctx.ellipse(-8, 15, 10, 4, 0, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = "lighter"; glow(-19, 15, 9 + Math.abs(sub.vx) * 0.03, "120,240,255", 0.8); ctx.globalCompositeOperation = "source-over"; }
    // hull
    if (P.body === "gold" && !goldGrad) { goldGrad = ctx.createLinearGradient(0, -15, 0, 15); goldGrad.addColorStop(0, "#fff3b0"); goldGrad.addColorStop(0.45, "#e0b545"); goldGrad.addColorStop(1, "#8a6414"); }
    ctx.fillStyle = P.body === "gold" ? goldGrad : P.body; ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, 6.28); ctx.fill();
    if (P.pat) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, 6.28); ctx.clip();
      if (P.pat === "camo") { ctx.fillStyle = "#3b5a2a"; ctx.beginPath(); ctx.ellipse(-14, -6, 8, 4, 0.4, 0, 6.28); ctx.ellipse(4, 7, 9, 4, -0.3, 0, 6.28); ctx.ellipse(18, -9, 6, 3, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "#7a9a52"; ctx.beginPath(); ctx.ellipse(-2, -9, 6, 3, 0, 0, 6.28); ctx.ellipse(-20, 7, 6, 3, 0, 0, 6.28); ctx.fill(); }
      else if (P.pat === "grid") { ctx.strokeStyle = "rgba(190,230,255,0.55)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let gx = -30; gx <= 30; gx += 6) { ctx.moveTo(gx, -15); ctx.lineTo(gx, 15); } for (let gy = -15; gy <= 15; gy += 6) { ctx.moveTo(-30, gy); ctx.lineTo(30, gy); } ctx.stroke(); }
      else if (P.pat === "seam") { ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(94,234,212,${0.6 + 0.3 * Math.sin(t * 3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-28, 3); ctx.lineTo(28, 3); ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }
      else if (P.pat === "scales") { for (let k = -24; k <= 20; k += 9) { ctx.fillStyle = `rgba(255,90,70,${0.45 + 0.35 * Math.sin(t * 3 + k)})`; ctx.fillRect(k, 4, 5, 3); } }
      ctx.restore();
    }
    ctx.fillStyle = P.accent; ctx.fillRect(-30, -3, 12, 6);
    // decals
    if (cos.decal === "stripes") { ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-24, 5); ctx.lineTo(16, 5); ctx.moveTo(-22, 8.5); ctx.lineTo(12, 8.5); ctx.stroke(); }
    else if (cos.decal === "teeth") { ctx.fillStyle = "#f4f4f4"; ctx.beginPath(); ctx.moveTo(12, 5); for (let k = 0; k < 6; k++) ctx.lineTo(13 + k * 2.6, k % 2 ? 5 : 10 - k * 0.5); ctx.lineTo(28, 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#b02a2a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(28, 5); ctx.stroke(); }
    else if (cos.decal === "key") { ctx.strokeStyle = "#ffd36b"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-13, 5, 3.5, 0, 6.28); ctx.moveTo(-9.5, 5); ctx.lineTo(3, 5); ctx.moveTo(1, 5); ctx.lineTo(1, 8.5); ctx.moveTo(-2.5, 5); ctx.lineTo(-2.5, 7.5); ctx.stroke(); }
    else if (cos.decal === "chain") { ctx.strokeStyle = "#cfd8de"; ctx.lineWidth = 1.3; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-18 + k * 6 + 3.5, 6); ctx.ellipse(-18 + k * 6, 6, 3.5, 2, 0, 0, 6.28); } ctx.stroke(); }
    else if (cos.decal === "select") { ctx.save(); ctx.translate(-8, 8); ctx.scale(fs >= 0 ? 1 : -1, 1); ctx.fillStyle = "#ff5d9e"; ctx.font = "700 6px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.fillText("SELECT *", 0, 0); ctx.restore(); }
    // canopy
    ctx.fillStyle = "#9fe7f5"; ctx.beginPath(); ctx.ellipse(10, -3, 11, 8, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.ellipse(13, -6, 4, 2.5, -0.4, 0, 6.28); ctx.fill();
    ctx.strokeStyle = "#5a4a2a"; ctx.lineWidth = 2; const pr = Math.sin(t * (20 + Math.abs(sub.vx) * 0.1)) * 8;
    ctx.beginPath(); ctx.moveTo(-34, -pr); ctx.lineTo(-34, pr); ctx.stroke();
    ctx.fillStyle = "#3a3f46"; ctx.fillRect(-6, 12, 18, 4);
    if (cos.fin === "antenna") { ctx.strokeStyle = "#9aa7b3"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-8, -30); ctx.stroke(); if (Math.sin(t * 4) > 0) { ctx.globalCompositeOperation = "lighter"; glow(-8, -31, 8, "255,90,70", 1); ctx.globalCompositeOperation = "source-over"; } ctx.fillStyle = "#ff5a46"; ctx.beginPath(); ctx.arc(-8, -31, 1.8, 0, 6.28); ctx.fill(); }
    if (cos.fin === "claw") { const o = 3 + Math.sin(t * 2) * 2; ctx.strokeStyle = "#8a96a3"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(22, 22); ctx.lineTo(30, 21); ctx.moveTo(30, 21); ctx.lineTo(35, 21 - o); ctx.moveTo(30, 21); ctx.lineTo(35, 21 + o); ctx.stroke(); }
    ctx.globalCompositeOperation = "lighter"; glow(29, -1, 7, rgb, 0.9); ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  function pickWaypoint(maxX) {
    const top = viewTop + 34, bot = floorY - (zone < 0 ? 90 : 40);
    sub.wp = { x: 50 + Math.random() * Math.max(40, maxX - 50), y: top + Math.random() * Math.max(10, bot - top) };
    sub.wpT = 2.5 + Math.random() * 2.5;
  }
  function updateSub(dt, targetX) {
    const top = viewTop + 30, bot = floorY - 34;
    let tx, ty, maxV = 80;
    if (bay) { tx = W / 2; ty = viewTop + (floorY - viewTop) * 0.42; maxV = 220; }
    else if (zone >= 0 && fx.travel > 0) { tx = Math.max(70, W * 0.26); ty = mid(); maxV = 200; }
    else {
      sub.wpT -= dt; sub.hold -= dt;
      const lim = zone >= 0 && targetX ? targetX - 120 : W - 60;
      if (!sub.wp || (sub.wpT <= 0 && sub.hold <= 0) || (sub.hold <= 0 && sub.wp.x > lim + 20)) pickWaypoint(lim);
      tx = sub.wp.x; ty = sub.wp.y; if (sub.hold > 0) maxV = 190;
    }
    const dx = tx - sub.x, dy = ty - sub.y, d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(maxV, d * 1.8);
    const k = Math.min(1, dt * 2.6);
    sub.vx += ((dx / d) * sp - sub.vx) * k; sub.vy += ((dy / d) * sp - sub.vy) * k;
    sub.x += sub.vx * dt; sub.y += sub.vy * dt + Math.sin(t * 1.3) * 0.15;
    sub.y = Math.max(top, Math.min(bot, sub.y)); sub.x = Math.max(30, Math.min(W - 30, sub.x));
    let face = sub.fs >= 0 ? 1 : -1;
    if (bay || fx.travel > 0) face = 1;
    else if (Math.abs(sub.vx) > 20) face = Math.sign(sub.vx);
    else if (zone >= 0 && targetX) face = targetX > sub.x ? 1 : -1;
    sub.fs += (face - sub.fs) * Math.min(1, dt * 7);
    sub.tilt += ((Math.max(-0.3, Math.min(0.3, sub.vy / 320)) + (fx.travel > 0 ? 0.06 : 0)) - sub.tilt) * Math.min(1, dt * 5);
    sub.sc += ((bay ? 2.1 : 1) - sub.sc) * Math.min(1, dt * 4);
  }
  function trails(dt, cos) {
    const rx = sub.x - sub.fs * 36 * sub.sc, ry = sub.y + sub.tilt * -10;
    const speed = Math.hypot(sub.vx, sub.vy) + Math.abs(camV);
    const kind = cos.trail, rgb = lightRGB(cos.light);
    for (let i = trail.length - 1; i >= 0; i--) { const p = trail[i]; p.l -= dt; p.x += (p.vx - camV) * dt; p.y += p.vy * dt; if (p.l <= 0) trail.splice(i, 1); }
    hist.forEach(h => h.x -= camV * dt);
    hist.push({ x: rx, y: ry }); if (hist.length > 26) hist.shift();
    if (kind === "bubbles") { if (!reduce && Math.random() < 0.04 + speed * 0.0008) bubble(rx, ry - 2, 1); }
    else if (kind !== "ribbon") {
      sub.emit += dt * (kind === "bits" ? 6 : 10) * (0.4 + speed / 150);
      while (sub.emit >= 1 && trail.length < 40) { sub.emit--; trail.push({ x: rx, y: ry + (Math.random() - 0.5) * 8, vx: -sub.fs * (10 + Math.random() * 20), vy: (Math.random() - 0.5) * 14 - 6, l: kind === "bits" ? 1.4 : 0.9, m: kind === "bits" ? 1.4 : 0.9, ch: Math.random() < 0.5 ? "0" : "1" }); }
      sub.emit = Math.min(sub.emit, 2);
    }
    if (kind === "ribbon" && hist.length > 2) {
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (let i = 1; i < hist.length; i++) { const a = i / hist.length; ctx.strokeStyle = `rgba(${rgb},${a * 0.8})`; ctx.lineWidth = 1 + a * 5 * sub.sc; ctx.beginPath(); ctx.moveTo(hist[i - 1].x, hist[i - 1].y); ctx.lineTo(hist[i].x, hist[i].y); ctx.stroke(); }
      ctx.globalCompositeOperation = "source-over";
    } else if (kind === "bits") {
      ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
      trail.forEach(p => { ctx.globalAlpha = p.l / p.m; ctx.fillStyle = `rgb(${rgb})`; ctx.fillText(p.ch, p.x, p.y); });
      ctx.globalAlpha = 1;
    } else if (kind === "sparkle") {
      ctx.globalCompositeOperation = "lighter";
      trail.forEach(p => { const a = p.l / p.m; glow(p.x, p.y, 6 + a * 5, rgb, a); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(p.x - 0.8, p.y - 3, 1.6, 6); ctx.fillRect(p.x - 3, p.y - 0.8, 6, 1.6); });
      ctx.globalCompositeOperation = "source-over";
    }
  }
  function drawPlayer(dt, targetX) {
    updateSub(dt, targetX);
    const cos = currentCos();
    trails(dt, cos);
    drawSub(sub.x, sub.y, sub.sc, sub.fs, sub.tilt, cos, zone >= 3 ? 1 : bay ? 0.55 : 0);
    if (tap && tap.l > 0) { tap.l -= dt; ctx.strokeStyle = `rgba(94,234,212,${tap.l * 1.5})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tap.x, tap.y, 6 + (0.6 - tap.l) * 40, 0, 6.28); ctx.stroke(); }
  }

  /* ---------- creatures: each one is a bad design practice ---------- */
  const CREATURES = {
    leech(x, y, s) { // segmented worm trailed by faint duplicate copies of itself
      for (let ghost = 2; ghost >= 0; ghost--) {
        ctx.globalAlpha = ghost ? 0.18 : 1;
        const ox = ghost * 26, oy = ghost * -14;
        for (let i = 9; i >= 0; i--) { const px = x + ox + i * 9 * s, py = y + oy + Math.sin(t * 3 - i * 0.6) * 7 * s; ctx.fillStyle = i % 2 ? "#8a2c4a" : "#a83a5e"; ctx.beginPath(); ctx.arc(px, py, (9 - i * 0.45) * s, 0, 6.28); ctx.fill(); }
        ctx.strokeStyle = "#ffb3c7"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + ox - 4 * s, y + oy + Math.sin(t * 3) * 7 * s, 5 * s, 0, 6.28); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    wraith(x, y, s) { // ghostly jelly with an empty core (∅)
      ctx.globalCompositeOperation = "lighter";
      const pulse = 1 + Math.sin(t * 2) * 0.06;
      glow(x, y, 70 * s, "200,230,255", 0.45);
      ctx.fillStyle = "rgba(190,220,255,0.35)"; ctx.beginPath(); ctx.ellipse(x, y, 40 * s * pulse, 30 * s * pulse, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "rgba(190,220,255,0.5)"; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 6; i++) { ctx.moveTo(x - 30 * s + i * 12 * s, y); for (let k = 1; k < 6; k++) ctx.lineTo(x - 30 * s + i * 12 * s + Math.sin(t * 2 + k + i) * 6, y + k * 12 * s); }
      ctx.stroke(); ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#e9f6ff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 12 * s, 10 * s, 0, 6.28); ctx.moveTo(x - 12 * s, y - 2 * s); ctx.lineTo(x + 12 * s, y - 22 * s); ctx.stroke();
    },
    shark(x, y, s) {
      const wag = Math.sin(t * 4) * 0.25;
      ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
      ctx.fillStyle = "#5c6f80"; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-20, -28, 50, -6); ctx.lineTo(78, -26 + wag * 30); ctx.lineTo(70, 0); ctx.lineTo(80, 26 + wag * 30); ctx.lineTo(50, 6); ctx.quadraticCurveTo(-20, 26, -70, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(4, -44); ctx.lineTo(18, -14); ctx.fill();
      ctx.fillStyle = "#c9d3db"; ctx.beginPath(); ctx.moveTo(-66, 4); ctx.quadraticCurveTo(-20, 22, 40, 6); ctx.quadraticCurveTo(-20, 12, -66, 4); ctx.fill();
      ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.arc(-48, -5, 3, 0, 6.28); ctx.fill();
      ctx.restore();
    },
    kraken(x, y, s) { // tentacles reaching for every row
      ctx.strokeStyle = "#b8324a"; ctx.lineCap = "round"; ctx.lineWidth = 7 * s; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + t * 0.3; let px = x, py = y + 10 * s; ctx.moveTo(px, py); for (let k = 1; k <= 6; k++) { px += Math.cos(a + Math.sin(t * 1.5 + k + i) * 0.5) * 14 * s; py += Math.sin(a + Math.sin(t * 1.5 + k + i) * 0.5) * 10 * s + 4 * s; ctx.lineTo(px, py); } }
      ctx.stroke();
      ctx.fillStyle = "#d1415c"; ctx.beginPath(); ctx.ellipse(x, y - 14 * s, 34 * s, 40 * s, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.ellipse(x - 12 * s, y - 8 * s, 7 * s, 9 * s, 0, 0, 6.28); ctx.ellipse(x + 12 * s, y - 8 * s, 7 * s, 9 * s, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#200"; ctx.fillRect(x - 13 * s, y - 14 * s, 2.5 * s, 11 * s); ctx.fillRect(x + 11 * s, y - 14 * s, 2.5 * s, 11 * s);
    },
    angler(x, y, s) { // dangles an ambiguous lure
      const lx = x - 46 * s + Math.sin(t * 1.4) * 6, ly = y - 54 * s;
      ctx.globalCompositeOperation = "lighter"; glow(lx, ly, 46 * s, "160,255,230", 0.75 + 0.25 * Math.sin(t * 5)); ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#3c4a5c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10 * s, y - 30 * s); ctx.quadraticCurveTo(x - 30 * s, y - 70 * s, lx, ly); ctx.stroke();
      ctx.fillStyle = "#2a3444"; ctx.beginPath(); ctx.ellipse(x, y, 46 * s, 36 * s, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 40 * s, y); ctx.lineTo(x + 70 * s, y - 20 * s + Math.sin(t * 3) * 6); ctx.lineTo(x + 70 * s, y + 20 * s + Math.sin(t * 3) * 6); ctx.fill();
      ctx.fillStyle = "#0b0f16"; ctx.beginPath(); ctx.ellipse(x - 26 * s, y + 8 * s, 22 * s, 14 * s + Math.sin(t * 2) * 3, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#e9eef2"; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(x - 44 * s + i * 7 * s, y - 2 * s); ctx.lineTo(x - 41 * s + i * 7 * s, y + 8 * s); ctx.lineTo(x - 38 * s + i * 7 * s, y - 2 * s); } ctx.fill();
      ctx.fillStyle = "#cfe"; ctx.beginPath(); ctx.arc(x - 8 * s, y - 14 * s, 5 * s, 0, 6.28); ctx.fill();
    },
    squid(x, y, s) { // tangled spaghetti tentacles
      ctx.strokeStyle = "#f0a23a"; ctx.lineWidth = 3 * s; ctx.lineCap = "round"; ctx.beginPath();
      for (let i = 0; i < 12; i++) { ctx.moveTo(x + (i - 6) * 3 * s, y + 20 * s); for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(t * 1.2 + i * 1.7 + k * 0.9) * 40 * s, y + 20 * s + k * 9 * s); }
      ctx.stroke();
      ctx.fillStyle = "#e8892c"; ctx.beginPath(); ctx.moveTo(x - 22 * s, y + 20 * s); ctx.quadraticCurveTo(x - 26 * s, y - 50 * s, x, y - 70 * s); ctx.quadraticCurveTo(x + 26 * s, y - 50 * s, x + 22 * s, y + 20 * s); ctx.fill();
      ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.arc(x - 9 * s, y + 4 * s, 7 * s, 0, 6.28); ctx.arc(x + 9 * s, y + 4 * s, 7 * s, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#1a0f05"; ctx.beginPath(); ctx.arc(x - 9 * s + Math.sin(t) * 2, y + 5 * s, 3 * s, 0, 6.28); ctx.arc(x + 9 * s - Math.sin(t) * 2, y + 5 * s, 3 * s, 0, 6.28); ctx.fill();
    },
    crab(x, y, s) { // cracked shell, snapping claws
      const snap = Math.abs(Math.sin(t * 3)) * 0.5;
      ctx.strokeStyle = "#c4582b"; ctx.lineWidth = 4 * s; ctx.lineCap = "round"; ctx.beginPath();
      for (let i = 0; i < 4; i++) for (const d of [-1, 1]) { ctx.moveTo(x + d * 20 * s, y + 4 * s); ctx.lineTo(x + d * (36 + i * 6) * s, y - 4 * s + i * 5 * s); ctx.lineTo(x + d * (44 + i * 6) * s, y + 20 * s + Math.sin(t * 6 + i) * 3); }
      for (const d of [-1, 1]) { ctx.moveTo(x + d * 24 * s, y - 8 * s); ctx.lineTo(x + d * 44 * s, y - 30 * s); }
      ctx.stroke();
      ctx.fillStyle = "#e0703c";
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 52 * s, y - 38 * s, 14 * s, 9 * s, d * -0.5, 0, 6.28); ctx.fill(); }
      ctx.strokeStyle = "#5a2210"; ctx.lineWidth = 2; ctx.beginPath();
      for (const d of [-1, 1]) { ctx.moveTo(x + d * 46 * s, y - 38 * s); ctx.lineTo(x + d * 66 * s, y - 38 * s - snap * 14 * s); }
      ctx.stroke();
      ctx.fillStyle = "#e0703c"; ctx.beginPath(); ctx.ellipse(x, y, 30 * s, 20 * s, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + 28 * s, y + 6 * s); ctx.lineTo(x - 28 * s, y + 6 * s); ctx.fill();
      ctx.strokeStyle = "#5a2210"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 18 * s); ctx.lineTo(x + 2 * s, y - 8 * s); ctx.lineTo(x - 4 * s, y + 2 * s); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x - 8 * s, y - 24 * s, 3 * s, 0, 6.28); ctx.arc(x + 8 * s, y - 24 * s, 3 * s, 0, 6.28); ctx.fill();
    },
    leviathan(x, y, s) { // serpent of repeating table segments
      const segs = 16;
      for (let i = segs; i >= 0; i--) {
        const px = x + i * 16 * s, py = y + Math.sin(t * 1.6 - i * 0.45) * 22 * s;
        ctx.fillStyle = i % 2 ? "#1e3346" : "#24405a"; ctx.beginPath(); ctx.ellipse(px, py, (26 - i * 0.9) * s, (20 - i * 0.7) * s, 0, 0, 6.28); ctx.fill();
        if (i % 2 === 0) { ctx.fillStyle = `rgba(255,90,70,${0.45 + 0.35 * Math.sin(t * 3 + i)})`; ctx.fillRect(px - 6 * s, py - 3 * s, 12 * s, 6 * s); }
      }
      const hy = y + Math.sin(t * 1.6) * 22 * s;
      ctx.fillStyle = "#2b4a66"; ctx.beginPath(); ctx.moveTo(x - 60 * s, hy); ctx.quadraticCurveTo(x - 30 * s, hy - 40 * s, x + 10 * s, hy - 24 * s); ctx.lineTo(x + 10 * s, hy + 24 * s); ctx.quadraticCurveTo(x - 30 * s, hy + 40 * s, x - 60 * s, hy); ctx.fill();
      const jaw = 8 + Math.abs(Math.sin(t * 1.2)) * 14;
      ctx.fillStyle = "#05080c"; ctx.beginPath(); ctx.moveTo(x - 62 * s, hy); ctx.lineTo(x - 20 * s, hy - jaw * s * 0.4); ctx.lineTo(x - 20 * s, hy + jaw * s * 0.6); ctx.fill();
      ctx.globalCompositeOperation = "lighter"; glow(x - 26 * s, hy - 16 * s, 14 * s, "255,90,70", 0.9); ctx.globalCompositeOperation = "source-over";
    }
  };
  function drawObject(kind, x, y) {
    const bob = Math.sin(t * 2) * 4;
    ctx.globalCompositeOperation = "lighter"; glow(x, y + bob, 52, "94,234,212", 0.5); ctx.globalCompositeOperation = "source-over";
    ctx.save(); ctx.translate(x, y + bob);
    if (kind === "fragment") { ctx.rotate(0.3 + Math.sin(t) * 0.1); ctx.fillStyle = "#7c8a96"; ctx.fillRect(-24, -14, 48, 28); ctx.fillStyle = "#4b5660"; ctx.fillRect(-24, -14, 48, 6); ctx.fillStyle = `rgba(94,234,212,${0.6 + 0.4 * Math.sin(t * 4)})`; ctx.fillRect(-16, 2, 32, 3); }
    else if (kind === "sample") { ctx.strokeStyle = "#7fe0a6"; ctx.lineWidth = 3; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(0, 18); ctx.quadraticCurveTo(i * 8, 0, i * 12 + Math.sin(t * 2 + i) * 3, -18); } ctx.stroke(); ctx.fillStyle = "#c6ffd9"; ctx.beginPath(); ctx.arc(0, -20, 5, 0, 6.28); ctx.fill(); }
    else { ctx.rotate(t * 0.6); ctx.fillStyle = "#2f3a46"; ctx.fillRect(-14, -14, 28, 28); ctx.strokeStyle = `rgba(255,207,107,${0.6 + 0.4 * Math.sin(t * 5)})`; ctx.lineWidth = 2; ctx.strokeRect(-9, -9, 18, 18); }
    ctx.restore();
  }

  /* ---------- seabase ---------- */
  function seabase() {
    const bx = W * 0.5, by = floorY - 4, sy = viewTop + 6;
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.moveTo(0, sy); for (let x = 0; x <= W + 16; x += 16) ctx.lineTo(x, sy + Math.sin(x * 0.04 + t * 1.5) * 3); ctx.lineTo(W, sy - 4); ctx.lineTo(0, sy - 4); ctx.fill();
    const mods = S.owned;
    if (mods.includes("beacon")) { ctx.strokeStyle = "#9aa7b3"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + 120, by); ctx.lineTo(bx + 120, by - 150); ctx.stroke(); const on = Math.sin(t * 4) > 0; ctx.fillStyle = on ? "rgba(255,90,70,0.95)" : "rgba(255,90,70,0.25)"; ctx.beginPath(); ctx.arc(bx + 120, by - 154, 5, 0, 6.28); ctx.fill(); if (on) { ctx.globalCompositeOperation = "lighter"; glow(bx + 120, by - 154, 40, "255,90,70", 0.5); ctx.globalCompositeOperation = "source-over"; } }
    if (mods.includes("growbed")) { ctx.fillStyle = "#4b5a63"; ctx.fillRect(bx - 170, by - 16, 70, 16); ctx.strokeStyle = "#7fe0a6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(bx - 164 + i * 11, by - 16); ctx.quadraticCurveTo(bx - 164 + i * 11 + Math.sin(t + i) * 5, by - 30, bx - 160 + i * 11, by - 42); } ctx.stroke(); ctx.fillStyle = "#a8ffcf"; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(bx - 157 + i * 11, by - 42); ctx.arc(bx - 160 + i * 11, by - 42, 3, 0, 6.28); } ctx.fill(); }
    if (mods.includes("moonpool")) { ctx.fillStyle = "#6d7b88"; ctx.fillRect(bx + 36, by - 40, 74, 40); ctx.fillStyle = "#26323d"; ctx.fillRect(bx + 44, by - 8, 58, 8); }
    if (mods.includes("scanroom")) { ctx.fillStyle = "#6d7b88"; ctx.beginPath(); ctx.arc(bx - 70, by - 18, 22, Math.PI, 0); ctx.fill(); ctx.strokeStyle = "#c8d3dc"; ctx.lineWidth = 2; ctx.save(); ctx.translate(bx - 70, by - 44); ctx.rotate(Math.sin(t * 0.8) * 0.8); ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke(); ctx.restore(); ctx.beginPath(); ctx.moveTo(bx - 70, by - 40); ctx.lineTo(bx - 70, by - 32); ctx.stroke(); }
    ctx.fillStyle = "#8796a3"; ctx.fillRect(bx - 40, by - 10, 80, 10);
    ctx.fillStyle = "#a9b6c1"; ctx.beginPath(); ctx.arc(bx, by - 34, 34, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#7c8a96"; ctx.fillRect(bx - 34, by - 36, 68, 6);
    ctx.fillStyle = "#ffd68c"; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(bx + i * 18 + 5, by - 44); ctx.arc(bx + i * 18, by - 44, 5, 0, 6.28); } ctx.fill();
    if (mods.includes("dome")) { ctx.fillStyle = "rgba(160,230,255,0.35)"; ctx.strokeStyle = "rgba(200,240,255,0.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by - 68, 22, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = "#8796a3"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx - 34, by - 20); ctx.lineTo(bx - 100, by - 20); ctx.stroke();
    if (!reduce && Math.random() < 0.03) bubble(bx + (Math.random() - 0.5) * 60, by - 60, 1);
  }

  function floatTextDraw(dt) {
    if (!floats.length) return;
    ctx.font = "700 18px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; if (f.x == null) continue; f.y -= 30 * dt; f.l -= dt; if (f.l <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, f.l * 1.5); ctx.fillStyle = f.c === "gold" ? "#ffcf6b" : "#ff6b57"; ctx.fillText(f.txt, f.x, f.y); }
    ctx.globalAlpha = 1;
  }

  /* adaptive quality: if frames run slow, drop resolution, then extra effects */
  function tune(ms) {
    frameLog.push(ms); if (frameLog.length < 45) return;
    const avg = frameLog.reduce((a, b) => a + b, 0) / frameLog.length; frameLog = [];
    if (CFG.graphics.adaptiveQuality && avg > CFG.graphics.slowFrameMs && tuned < 2) {
      tuned++;
      if (DPR > 1) { dprCap = 1; resize(); } else { lowFx = true; build(); }
    }
  }

  function frame(now) {
    const ms = now - last; const dt = Math.min(0.05, ms / 1000 || 0); last = now; t += dt;
    if (ms > 0 && ms < 500) tune(ms);
    floorY += (floorTarget - floorY) * Math.min(1, dt * 6);
    const travelK = fx.travel > 0 ? Math.sin(Math.min(1, fx.travel / 1.5) * Math.PI) : 0;
    camV = zone >= 0 ? (travelK * 380 + sub.vx * 0.15) : sub.vx * 0.05;
    camX += camV * dt;
    water(); seafloor();
    if (zone < 0) { drawFish(dt); seabase(); flora(); drawPlayer(dt, 0); particles(dt); }
    else {
      drawFish(dt); flora();
      const m = mid();
      const px = sub.x, py = sub.y;
      const tx = Math.min(W - 80, Math.max(W * 0.64, 250)) + (fx.travel > 0 ? Math.min(1, fx.travel / 1.5) * W * 0.85 : 0), ty = m + Math.sin(t * 0.7) * 10;
      const s = Math.min(1.25, Math.max(0.6, (floorY - viewTop) / 300)) * (W < 500 ? 0.85 : 1);
      let cx = tx, cy = ty;
      if (target) {
        const lunge = fx.lunge > 0 ? Math.sin((1 - fx.lunge / 0.5) * Math.PI) * Math.max(0, tx - px - 60) : 0;
        const flee = fx.flee > 0 ? (1 - fx.flee / 1.2) : (target.gone ? 1 : 0);
        cx = tx - lunge + flee * W * 0.6; cy = ty - flee * 80;
        if (target.type === "beast") {
          if (flee < 1) {
            ctx.globalAlpha = 1 - flee * 0.9;
            CREATURES[ZONES[zone].creature.id](cx, cy, target.id === "leviathan" ? s * 1.1 : s);
            ctx.globalAlpha = 1;
            if (fx.hit > 0) { ctx.globalCompositeOperation = "lighter"; glow(cx, cy, 90 * s, "255,255,255", fx.hit * 3); ctx.globalCompositeOperation = "source-over"; }
          }
        } else if (!target.gone) drawObject(target.obj || "drive", cx, cy);
        if (fx.beam > 0) {
          const a = fx.beam / 0.6;
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = fx.beamOk ? `rgba(94,234,212,${a})` : `rgba(255,107,87,${a})`; ctx.lineWidth = 3 + 4 * a;
          ctx.beginPath(); ctx.moveTo(px + sub.fs * 30, py); ctx.lineTo(cx, cy); ctx.moveTo(cx + 30 + (1 - a) * 40, cy); ctx.arc(cx, cy, 30 + (1 - a) * 40, 0, 6.28); ctx.stroke();
          ctx.globalCompositeOperation = "source-over";
        }
      }
      drawPlayer(dt, tx);
      if (fx.ping > 0) { ctx.strokeStyle = `rgba(94,234,212,${fx.ping})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sub.x, sub.y, (1 - fx.ping) * Math.max(W, H) * 0.7, 0, 6.28); ctx.stroke(); }
      particles(dt);
      if (zone >= 3) { // darkness by depth, with a pocket of light around the sub
        const dark = Math.min(0.72, 0.18 * (zone - 2)), R = Math.max(W, H) * 0.75, hx = sub.x + sub.fs * 80;
        ctx.globalAlpha = dark; ctx.drawImage(holeSprite, hx - R, sub.y - R, R * 2, R * 2);
        ctx.fillStyle = "#000";
        if (hx - R > 0) ctx.fillRect(0, 0, hx - R, H);
        if (hx + R < W) ctx.fillRect(hx + R, 0, W - hx - R, H);
        if (sub.y - R > 0) ctx.fillRect(0, 0, W, sub.y - R);
        if (sub.y + R < H) ctx.fillRect(0, sub.y + R, W, H - sub.y - R);
        ctx.globalAlpha = 1;
      }
      if (D && D.o2 / maxO2() <= 0.3) { ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 5); ctx.drawImage(vignetteSprite, 0, 0, W, H); ctx.globalAlpha = 1; }
      if (fx.hurt > 0) { ctx.fillStyle = `rgba(255,60,40,${fx.hurt * 0.5})`; ctx.fillRect(0, 0, W, H); }
      floats.forEach(f => { if (f.x == null) { f.x = sub.x + 10; f.y = sub.y - 40; } });
    }
    floatTextDraw(dt);
    for (const k in fx) if (typeof fx[k] === "number") fx[k] = Math.max(0, fx[k] - dt);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  cv.addEventListener("pointerdown", e => {
    if (bay || e.clientY < viewTop || e.clientY > floorY) return;
    sub.wp = { x: Math.max(40, Math.min(W - 40, e.clientX)), y: Math.max(viewTop + 30, Math.min(floorY - 34, e.clientY)) };
    sub.hold = 4; sub.wpT = 4; tap = { x: e.clientX, y: e.clientY, l: 0.6 };
  });
  if (window.ResizeObserver) new ResizeObserver(() => measure()).observe($("sheet"));
  return {
    start() { resize(); requestAnimationFrame(frame); },
    measure,
    enterZone(i) { zone = i; target = null; floats = []; trail.length = 0; hist.length = 0; sub.x = -40; sub.y = mid(); sub.wp = null; build(); },
    enterBase() { zone = -1; target = null; floats = []; trail.length = 0; hist.length = 0; sub.wp = null; build(); },
    setBay(on) { bay = on; },
    _sub() { return { x: sub.x, y: sub.y, fs: sub.fs, sc: sub.sc, camX }; },
    refreshBase() {},
    setTarget(e) { target = { type: e.type, obj: e.obj, id: e.type === "beast" ? ZONES[zone].creature.id : null, gone: false }; fx.flee = 0; fx.travel = 1.5; bubble(sub.x, sub.y, 6); },
    beam(ok) { fx.beam = 0.6; fx.beamOk = ok; if (!ok) fx.hurt = 0.35; },
    hitCreature() { fx.beam = 0.6; fx.beamOk = true; fx.hit = 0.25; },
    creatureLunge() { fx.lunge = 0.5; fx.hurt = 0.45; },
    creatureFlee() { fx.flee = 1.2; setTimeout(() => { if (target) target.gone = true; }, 1150); },
    ping() { fx.ping = 1; },
    floatText(txt, c) { floats.push({ txt, c, x: null, y: null, l: 1.3 }); }
  };
})();

/* keep progress across live page updates */
const hot = window.claude?.hot;
hot?.snapshot?.(() => ({ S }));
function boot(data) { if (data && data.S) S = Object.assign(fresh(), data.S); if (S.tut !== "done") tutStep = "welcome"; scene.start(); render(); }
window.__ds = { get D() { return D; }, get S() { return S; }, get sub() { return scene._sub(); } };
hot?.ready ? hot.ready(boot) : boot(hot?.data ?? {});
})();
