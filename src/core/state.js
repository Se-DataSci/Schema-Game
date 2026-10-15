/* The player's save file: everything that persists between visits.
   It lives in the browser's localStorage under CFG.saveKey. */
import { CFG } from "../../config/config.js";
export const fresh = () => ({
  banked: CFG.start.salvage, owned: [], hull: 1, sonar: CFG.start.sonar, canisters: 0,
  cleared: [], seen: [], slain: [], notes: {}, dives: 0,
  cos: { owned: [], eq: { paint: "std", decal: "none", light: "std", trail: "bubbles", fin: "none" } },
  qlog: [], raids: { won: 0, lost: 0 },
  bloom: { lvl: {}, max: {}, prog: {}, offers: [] }, missed: {}, settings: { version: "auto", graphics: "full", slowHint: false }, tut: null
});

/* S is a single shared object. Modules mutate its fields; nobody reassigns it. */
export const S = fresh();

export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG.saveKey) || "null");
    if (!saved || typeof saved.banked !== "number") return;
    const base = fresh();
    Object.assign(S, base, saved);
    S.cos = Object.assign(base.cos, saved.cos || {});
    S.cos.eq = Object.assign(fresh().cos.eq, (saved.cos || {}).eq || {});
    S.settings = Object.assign(base.settings, saved.settings || {});
    S.bloom = Object.assign(base.bloom, saved.bloom || {});
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
}

export function persist() {
  try { localStorage.setItem(CFG.saveKey, JSON.stringify(S)); } catch (e) { /* private mode */ }
}

export function resetSave() {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, fresh());
  persist();
}

export const has = id => S.owned.includes(id);
export const maxO2 = () => CFG.oxygen.base + (has("tank1") ? CFG.oxygen.tankBonus : 0) + (has("tank2") ? CFG.oxygen.tankBonus : 0);
export const lossMul = () => (has("rebreather") ? CFG.oxygen.rebreatherMultiplier : 1);
