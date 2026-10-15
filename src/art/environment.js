/* Scenery painted once per zone: water gradient, light rays, far rocks, seafloor,
   plants, glowing objectives, air vents, data shards and the seabase. */
import { canvas, glow } from "./kit.js";
import { seeded } from "../core/util.js";
export const BASE_PAL = { top: "#2aa6bf", bot: "#0d5f78", fog: "#13708a", floor: "#3c6b56" };

export function gradient(pal) {
  const c = canvas(4, 512), g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, pal.top); gr.addColorStop(0.8, pal.bot); gr.addColorStop(1, pal.bot);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  return c;
}

export function rays() {
  const c = canvas(512, 512), g = c.getContext("2d");
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 100, gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, "rgba(190,255,250,0.16)"); gr.addColorStop(1, "rgba(190,255,250,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 20, 0); g.lineTo(x + 30, 0); g.lineTo(x + 130, 512); g.lineTo(x + 40, 512); g.closePath(); g.fill();
  }
  return c;
}

/* A tileable strip of distant rock silhouettes. */
export function farRocks(pal, seed) {
  const W = 1024, H = 320, c = canvas(W, H), g = c.getContext("2d"), r = seeded(seed);
  g.fillStyle = pal.fog; g.globalAlpha = 0.6; g.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = (i / 6) * W + r() * 60, w = 160 + r() * 260, h = 80 + r() * 200;
    for (const off of [0, -W, W]) { g.moveTo(x + off, H); g.quadraticCurveTo(x + off + w * 0.3, H - h, x + off + w * 0.55, H - h * 0.7); g.quadraticCurveTo(x + off + w * 0.8, H - h * 0.4, x + off + w, H); }
  }
  g.fill();
  return c;
}

/* A tileable strip of seafloor: wavy top edge fading to black. */
export function floorStrip(pal) {
  const W = 1024, H = 300, c = canvas(W, H), g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal.floor); gr.addColorStop(1, "#000");
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, 26 + Math.sin(x / W * Math.PI * 6) * 8 + Math.sin(x / W * Math.PI * 16) * 4);
  g.lineTo(W, H); g.fill();
  g.fillStyle = "rgba(0,0,0,0.25)";
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(70 + i * 140, 34, 40 + (i % 3) * 20, 10, 0, Math.PI, 0); g.fill(); }
  return c;
}

/* One plant (or prop) for a zone's flora type. Returns { c, ox, oy, glow } where (ox, oy) is the base point. */
export function plant(type, variant, seed) {
  const r = seeded(seed + variant * 31);
  if (type === "kelp") {
    const h = 220 + variant * 70, c = canvas(70, h + 10), g = c.getContext("2d");
    g.strokeStyle = variant % 2 ? "#3f8f4a" : "#5aa64c"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(35, h + 4);
    for (let s = 1; s <= 8; s++) g.lineTo(35 + Math.sin(s * 0.8 + variant) * 7 * s / 3, h + 4 - (h * s) / 8);
    g.stroke(); g.fillStyle = "#6fbf5a";
    for (let s = 2; s <= 8; s += 2) { const xx = 35 + Math.sin(s * 0.8 + variant) * 7 * s / 3, yy = h + 4 - (h * s) / 8; g.beginPath(); g.ellipse(xx + 7, yy, 8, 3, 0.5, 0, 6.28); g.fill(); }
    return { c, ox: 35, oy: h + 4 };
  }
  if (type === "coral") {
    const c = canvas(110, 90), g = c.getContext("2d"), cols = ["#ff7a8a", "#ffb36b", "#c77dff", "#ff5d73"];
    if (variant % 2 === 0) {
      g.strokeStyle = cols[variant % 4]; g.lineWidth = 4; g.lineCap = "round"; g.beginPath();
      const br = (x0, y0, a, len, d) => { if (d > 3) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; g.moveTo(x0, y0); g.lineTo(x1, y1); br(x1, y1, a - 0.45, len * 0.72, d + 1); br(x1, y1, a + 0.45, len * 0.72, d + 1); };
      br(55, 88, -Math.PI / 2, 26 + r() * 8, 0); g.stroke();
    } else { g.fillStyle = cols[(variant + 1) % 4]; g.beginPath(); g.ellipse(55, 86, 26, 20, 0, Math.PI, 0); g.fill(); }
    return { c, ox: 55, oy: 86 };
  }
  if (type === "grass") {
    const c = canvas(40, 50), g = c.getContext("2d"); g.strokeStyle = "#8c9a4a"; g.lineWidth = 2; g.beginPath();
    for (let b = 0; b < 5; b++) { g.moveTo(10 + b * 4, 48); g.quadraticCurveTo(12 + b * 4, 30, 16 + b * 4, 10 + r() * 10); }
    g.stroke(); return { c, ox: 20, oy: 48 };
  }
  if (type === "crystal") {
    const hue = [270, 200, 300][variant % 3], h = 50 + r() * 40, w = 12, c = canvas(120, h + 60), g = c.getContext("2d"), bx = 60, by = h + 50;
    glow(g, bx, by - h / 2, h, hue === 200 ? "90,190,255" : "190,120,255", 0.35);
    g.fillStyle = `hsla(${hue},80%,65%,0.8)`; g.strokeStyle = `hsla(${hue},90%,85%,0.9)`; g.lineWidth = 1; g.beginPath();
    for (const off of [-w, 0, w * 0.9]) { g.moveTo(bx + off - w / 2, by); g.lineTo(bx + off - w / 3, by - h * (off ? 0.6 : 1)); g.lineTo(bx + off, by - h * (off ? 0.7 : 1.15)); g.lineTo(bx + off + w / 3, by - h * (off ? 0.6 : 1)); g.lineTo(bx + off + w / 2, by); }
    g.fill(); g.stroke(); return { c, ox: bx, oy: by, glow: true };
  }
  if (type === "shroom") {
    const rgb = ["70,255,240", "90,255,170", "220,120,255"][variant % 3], cap = ["#3fe0d0", "#48e08a", "#c77dff"][variant % 3];
    const h = 50 + r() * 60, c = canvas(120, h + 70), g = c.getContext("2d"), bx = 60, by = h + 60;
    g.strokeStyle = "#2a3d4f"; g.lineWidth = 5; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + 3, by - h / 2, bx + 5, by - h); g.stroke();
    glow(g, bx + 5, by - h, 50, rgb, 0.55);
    g.fillStyle = cap; g.beginPath(); g.ellipse(bx + 5, by - h, 22, 11, 0, Math.PI, 0); g.fill();
    return { c, ox: bx, oy: by, glow: true };
  }
  if (type === "wreck") {
    if (variant === 0) {
      const c = canvas(280, 110), g = c.getContext("2d");
      g.fillStyle = "#1a2530"; g.strokeStyle = "#3b5366"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(10, 106); g.lineTo(50, 36); g.lineTo(230, 16); g.lineTo(270, 66); g.lineTo(250, 106); g.closePath(); g.fill(); g.stroke();
      for (let w = 0; w < 5; w++) { g.fillStyle = w === 2 ? "rgba(255,190,90,0.7)" : "#0b1219"; g.beginPath(); g.arc(80 + w * 32, 51 - w * 3, 6, 0, 6.28); g.fill(); }
      return { c, ox: 140, oy: 106 };
    }
    const c = canvas(50, 70), g = c.getContext("2d"); g.strokeStyle = "#3b5366"; g.lineWidth = 4; g.beginPath(); g.moveTo(15, 68); g.lineTo(25, 20 + r() * 20); g.lineTo(41, 30); g.stroke();
    return { c, ox: 15, oy: 68 };
  }
  if (type === "vent") {
    if (variant % 2 === 0) {
      const h = 60 + r() * 40, c = canvas(80, h + 40), g = c.getContext("2d"), bx = 40, by = h + 36, top = by - h;
      g.fillStyle = "#24140e"; g.beginPath(); g.moveTo(bx - 16, by); g.lineTo(bx - 7, top); g.lineTo(bx + 7, top); g.lineTo(bx + 16, by); g.fill();
      glow(g, bx, top, 28, "255,140,60", 0.85);
      return { c, ox: bx, oy: by, glow: true, plume: by - top };
    }
    const c = canvas(30, 30), g = c.getContext("2d");
    for (let wv = 0; wv < 3; wv++) { g.fillStyle = "#e8e3d0"; g.fillRect(6 + wv * 6, 8, 2, 20); g.fillStyle = "#d9433a"; g.fillRect(5 + wv * 6, 5, 4, 4); }
    return { c, ox: 15, oy: 28 };
  }
  // trench: glowing eyes in the dark, or a dead stalk
  if (variant % 2 === 0) { const c = canvas(40, 40), g = c.getContext("2d"); glow(g, 14, 20, 10, "120,200,255", 0.9); glow(g, 26, 20, 10, "120,200,255", 0.9); return { c, ox: 20, oy: 40, glow: true, eyes: true }; }
  const c = canvas(20, 40), g = c.getContext("2d"); g.strokeStyle = "#1c2433"; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 38); g.lineTo(12, 8); g.stroke();
  return { c, ox: 8, oy: 38 };
}

/* Glowing scan targets. */
export function objective(kind) {
  const c = canvas(120, 120), g = c.getContext("2d");
  glow(g, 60, 60, 56, "94,234,212", 0.55);
  g.save(); g.translate(60, 60);
  if (kind === "fragment") { g.rotate(0.3); g.fillStyle = "#7c8a96"; g.fillRect(-24, -14, 48, 28); g.fillStyle = "#4b5660"; g.fillRect(-24, -14, 48, 6); g.fillStyle = "rgba(94,234,212,0.95)"; g.fillRect(-16, 2, 32, 3); }
  else if (kind === "sample") { g.strokeStyle = "#7fe0a6"; g.lineWidth = 3; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(0, 18); g.quadraticCurveTo(i * 8, 0, i * 12, -18); } g.stroke(); g.fillStyle = "#c6ffd9"; g.beginPath(); g.arc(0, -20, 5, 0, 6.28); g.fill(); }
  else if (kind === "drive") { g.fillStyle = "#2f3a46"; g.fillRect(-14, -14, 28, 28); g.strokeStyle = "rgba(255,207,107,0.95)"; g.lineWidth = 2; g.strokeRect(-9, -9, 18, 18); }
  else if (kind === "crate") { glow(g, 0, 0, 50, "255,207,107", 0.4); g.fillStyle = "#6b5a3a"; g.fillRect(-28, -18, 56, 36); g.strokeStyle = "#ffcf6b"; g.lineWidth = 2; g.strokeRect(-28, -18, 56, 36); g.beginPath(); g.moveTo(-28, -6); g.lineTo(28, -6); g.stroke(); g.fillStyle = "#ffcf6b"; g.fillRect(-5, -10, 10, 8); }
  g.restore();
  return c;
}

export function airVent() {
  const c = canvas(120, 70), g = c.getContext("2d");
  glow(g, 60, 50, 55, "160,230,255", 0.5);
  g.fillStyle = "#2b3a46"; g.beginPath(); g.ellipse(60, 58, 34, 10, 0, 0, 6.28); g.fill();
  g.fillStyle = "#0e1820"; g.beginPath(); g.ellipse(60, 56, 16, 5, 0, 0, 6.28); g.fill();
  return c;
}

export function shard() {
  const c = canvas(44, 44), g = c.getContext("2d");
  glow(g, 22, 22, 20, "255,207,107", 0.8);
  g.fillStyle = "#ffe29a"; g.beginPath(); g.moveTo(22, 10); g.lineTo(30, 22); g.lineTo(22, 34); g.lineTo(14, 22); g.closePath(); g.fill();
  return c;
}

/* Particle textures. */
export function particle(kind) {
  if (kind === "bubble") { const c = canvas(16, 16), g = c.getContext("2d"); g.strokeStyle = "rgba(220,250,255,0.9)"; g.lineWidth = 1.5; g.beginPath(); g.arc(8, 8, 6, 0, 6.28); g.stroke(); return c; }
  if (kind === "dot") { const c = canvas(32, 32), g = c.getContext("2d"); const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return c; }
  if (kind === "spark") { const c = canvas(24, 24), g = c.getContext("2d"); glow(g, 12, 12, 12, "255,255,255", 0.7); g.fillStyle = "#fff"; g.fillRect(11, 3, 2, 18); g.fillRect(3, 11, 18, 2); return c; }
  if (kind === "snow") { const c = canvas(6, 6), g = c.getContext("2d"); g.fillStyle = "rgba(230,245,255,0.9)"; g.beginPath(); g.arc(3, 3, 2, 0, 6.28); g.fill(); return c; }
  if (kind === "bits") { const c = canvas(28, 16), g = c.getContext("2d"); g.fillStyle = "#fff"; g.font = "700 13px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("0", 7, 8); g.fillText("1", 21, 8); return c; }
  if (kind === "smoke") { const c = canvas(48, 48), g = c.getContext("2d"); const r = g.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, "rgba(130,120,120,0.6)"); r.addColorStop(1, "rgba(130,120,120,0)"); g.fillStyle = r; g.fillRect(0, 0, 48, 48); return c; }
}

/* Darkness with a pocket of light; light cone; low-oxygen vignette. */
export function hole() { const c = canvas(256, 256), g = c.getContext("2d"); const r = g.createRadialGradient(128, 128, 18, 128, 128, 128); r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return c; }
export function vignette() { const c = canvas(256, 256), g = c.getContext("2d"); const r = g.createRadialGradient(128, 128, 60, 128, 128, 182); r.addColorStop(0, "rgba(180,30,20,0)"); r.addColorStop(1, "rgba(180,30,20,1)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return c; }
export function cone() {
  const c = canvas(256, 160), g = c.getContext("2d"), h = 160;
  const r = g.createRadialGradient(0, h / 2, 4, 40, h / 2, 256); r.addColorStop(0, "rgba(255,255,255,0.4)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.beginPath(); g.moveTo(0, h / 2 - 4); g.lineTo(256, 0); g.lineTo(256, h); g.lineTo(0, h / 2 + 4); g.closePath(); g.fill();
  return c;
}

/* The seabase, with whichever modules you've built. Base point is bottom-center. */
export function seabase(mods) {
  const W = 420, H = 230, c = canvas(W, H), g = c.getContext("2d"), bx = W / 2, by = H - 4;
  if (mods.includes("beacon")) { g.strokeStyle = "#9aa7b3"; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + 120, by); g.lineTo(bx + 120, by - 150); g.stroke(); }
  if (mods.includes("growbed")) { g.fillStyle = "#4b5a63"; g.fillRect(bx - 170, by - 16, 70, 16); g.strokeStyle = "#7fe0a6"; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(bx - 164 + i * 11, by - 16); g.quadraticCurveTo(bx - 162 + i * 11, by - 30, bx - 160 + i * 11, by - 42); } g.stroke(); for (let i = 0; i < 6; i++) glow(g, bx - 160 + i * 11, by - 42, 6, "127,224,166", 0.9); }
  if (mods.includes("moonpool")) { g.fillStyle = "#6d7b88"; g.fillRect(bx + 36, by - 40, 74, 40); g.fillStyle = "#26323d"; g.fillRect(bx + 44, by - 8, 58, 8); }
  if (mods.includes("scanroom")) { g.fillStyle = "#6d7b88"; g.beginPath(); g.arc(bx - 70, by - 18, 22, Math.PI, 0); g.fill(); g.strokeStyle = "#c8d3dc"; g.lineWidth = 2; g.beginPath(); g.arc(bx - 70, by - 44, 12, Math.PI * 0.1, Math.PI * 0.9, true); g.moveTo(bx - 70, by - 40); g.lineTo(bx - 70, by - 32); g.stroke(); }
  if (mods.includes("turret")) { g.fillStyle = "#59636e"; g.fillRect(bx + 150, by - 22, 26, 22); g.fillStyle = "#8796a3"; g.beginPath(); g.arc(bx + 163, by - 22, 11, Math.PI, 0); g.fill(); g.strokeStyle = "#c8d3dc"; g.lineWidth = 4; g.beginPath(); g.moveTo(bx + 166, by - 28); g.lineTo(bx + 190, by - 42); g.stroke(); glow(g, bx + 190, by - 42, 8, "94,234,212", 0.9); }
  g.fillStyle = "#8796a3"; g.fillRect(bx - 40, by - 10, 80, 10);
  g.fillStyle = "#a9b6c1"; g.beginPath(); g.arc(bx, by - 34, 34, 0, 6.28); g.fill();
  g.fillStyle = "#7c8a96"; g.fillRect(bx - 34, by - 36, 68, 6);
  for (let i = -1; i <= 1; i++) glow(g, bx + i * 18, by - 44, 9, "255,214,140", 0.9);
  g.fillStyle = "#ffd68c"; g.beginPath(); for (let i = -1; i <= 1; i++) { g.moveTo(bx + i * 18 + 5, by - 44); g.arc(bx + i * 18, by - 44, 5, 0, 6.28); } g.fill();
  if (mods.includes("dome")) { g.fillStyle = "rgba(160,230,255,0.35)"; g.strokeStyle = "rgba(200,240,255,0.7)"; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by - 68, 22, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); }
  g.strokeStyle = "#8796a3"; g.lineWidth = 6; g.beginPath(); g.moveTo(bx - 34, by - 20); g.lineTo(bx - 100, by - 20); g.stroke();
  return { c, ox: bx, oy: by, beacon: mods.includes("beacon") ? { x: bx + 120, y: by - 154 } : null };
}
