/* Small helpers shared by every module. */
export const $ = id => document.getElementById(id);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* Seeded random numbers, so a zone's scenery looks the same on every dive. */
export function seeded(seed) {
  let a = seed | 0;
  return () => { a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}

/* "#1d8fa6" -> 0x1d8fa6, for Phaser colors. */
export const hex = s => parseInt(s.replace("#", ""), 16);

/* Seconds since the scene's last frame, measured with the real clock.
   (Phaser smooths its own delta and reports ~16 ms even when a slow phone takes longer,
   which would make the game run in slow motion.) Capped at 0.1 s so a hiccup doesn't teleport anything. */
export function realDt(scene) {
  const now = performance.now(), last = scene.__lastT || now;
  scene.__lastT = now;
  return Math.min(0.1, (now - last) / 1000);
}
