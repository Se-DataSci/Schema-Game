/* Spending salvage: Fabricator items and Sub Bay cosmetics.
   The Sub Bay is modeled as a tiny database:
     submarine(sub_id, paint_id, decal_id, light_id, trail_id, fin_id)  - each *_id is a foreign key
     owned_cosmetic(sub_id, item_id)                                     - bridge table (many-to-many) */
import { CFG } from "../../config/config.js";
import { S, persist } from "../core/state.js";
import { bus } from "../core/bus.js";
export const SHOP = CFG.shop;
export const COS = CFG.cosmetics;
export const SLOTS = [["paint", "Paint"], ["decal", "Decal"], ["light", "Lights"], ["trail", "Trail"], ["fin", "Attachment"]];

/* What the Sub Bay is showing right now. preview = { slot, id } while trying an item on. */
export const bay = { slot: "paint", preview: null, open: false };

export const cosOwned = (slot, id) => COS[slot][0].id === id || S.cos.owned.includes(slot + ":" + id);
export const cosIndex = (slot, id) => Math.max(0, COS[slot].findIndex(c => c.id === id));

/* The look to draw: equipped items, with the previewed item swapped in. */
export function currentCos() {
  const eq = Object.assign({}, S.cos.eq);
  if (bay.open && bay.preview) eq[bay.preview.slot] = bay.preview.id;
  return eq;
}

function logQuery(q) { S.qlog.unshift(q); S.qlog = S.qlog.slice(0, 4); }

/* Is an item's prerequisite met? Hulls count by level (S.hull), everything else by S.owned. */
export function reqMet(it) {
  if (!it.req) return true;
  const r = SHOP.find(x => x.id === it.req);
  return r && r.kind === "hull" ? S.hull >= r.lvl : S.owned.includes(it.req);
}

/* Fabricator purchase. Returns the item, or null if it can't be bought. */
export function buyItem(id) {
  const it = SHOP.find(x => x.id === id);
  if (!it || S.banked < it.cost) return null;
  if (!reqMet(it) || (it.kind === "hull" && S.hull >= it.lvl)) return null;
  S.banked -= it.cost;
  if (it.kind === "hull") S.hull = it.lvl;
  else if (it.kind === "sonar") S.sonar += 3;
  else if (it.kind === "canister") S.canisters = Math.min(CFG.start.maxCanisters, S.canisters + 1);
  else S.owned.push(id);
  persist();
  if (it.kind === "module" || it.id === "turret") bus.emit("base-changed");
  return it;
}

export function previewCos(slot, id) {
  bay.preview = cosOwned(slot, id) ? null : { slot, id };
  bus.emit("cos-changed");
}

export function buyCos(slot, id) {
  const it = COS[slot].find(c => c.id === id);
  if (!it || cosOwned(slot, id) || S.banked < it.price) return null;
  if (it.req && !S.slain.includes(it.req)) return null;
  S.banked -= it.price;
  S.cos.owned.push(slot + ":" + id);
  logQuery(`INSERT INTO owned_cosmetic (sub_id, item_id) VALUES (1, '${slot}-${cosIndex(slot, id)}');`);
  equipCos(slot, id);
  return it;
}

export function equipCos(slot, id) {
  if (!cosOwned(slot, id) || S.cos.eq[slot] === id) { bay.preview = null; bus.emit("cos-changed"); return false; }
  S.cos.eq[slot] = id;
  bay.preview = null;
  logQuery(`UPDATE submarine SET ${slot}_id = ${cosIndex(slot, id)} WHERE sub_id = 1;`);
  persist();
  bus.emit("cos-changed");
  return true;
}
