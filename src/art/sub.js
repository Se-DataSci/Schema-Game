/* Your submarine and its cosmetics. Drawn facing right, centered on (0,0),
   body about 60x30 units. Phaser shows a left-facing copy when you swim left. */
import { glow } from "./kit.js";
export const PAINTS = {
  std: { body: "#f2c14e", accent: "#d89b2b" }, camo: { body: "#56783e", accent: "#3c5a2b", pat: "camo" },
  coral: { body: "#e2524f", accent: "#a8302f" }, teal: { body: "#1fa7a3", accent: "#147572" },
  stealth: { body: "#1b2330", accent: "#2c3a4d", pat: "seam" }, blueprint: { body: "#1d4f8f", accent: "#163b6c", pat: "grid" },
  levi: { body: "#24405a", accent: "#1e3346", pat: "scales" }, gold: { body: "gold", accent: "#b8892a" }
};

export const RAINBOW = ["255,90,90", "255,190,80", "250,255,110", "110,255,150", "110,200,255", "200,120,255"];
export const LIGHTS = { std: "255,245,200", cyan: "120,240,255", ruby: "255,90,110", toxic: "150,255,120" };
/* "r,g,b" for a light cosmetic. Rainbow changes with time. */
export const lightRGB = (id, t = 0) => LIGHTS[id] || RAINBOW[Math.floor(t * 1.5) % 6];
export const rgbNum = rgb => { const [r, g, b] = rgb.split(",").map(Number); return (r << 16) | (g << 8) | b; };

/* prop = propeller frame (0 or 1). textFlip = -1 when the canvas is mirrored, so painted text still reads correctly. */
export function drawSub(ctx, cos, prop = 0, textFlip = 1) {
  const P = PAINTS[cos.paint] || PAINTS.std, rgb = lightRGB(cos.light, 0);
  if (cos.fin === "tail") { ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(-22, -10); ctx.lineTo(-38, -22); ctx.lineTo(-30, -7); ctx.moveTo(-22, 10); ctx.lineTo(-38, 22); ctx.lineTo(-30, 7); ctx.fill(); }
  if (cos.fin === "thrusters") { ctx.fillStyle = "#59636e"; ctx.beginPath(); ctx.ellipse(-8, 15, 10, 4, 0, 0, 6.28); ctx.fill(); glow(ctx, -19, 15, 10, "120,240,255", 0.8); }
  // hull
  let fill = P.body;
  if (P.body === "gold") { fill = ctx.createLinearGradient(0, -15, 0, 15); fill.addColorStop(0, "#fff3b0"); fill.addColorStop(0.45, "#e0b545"); fill.addColorStop(1, "#8a6414"); }
  ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, 6.28); ctx.fill();
  if (P.pat) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, 6.28); ctx.clip();
    if (P.pat === "camo") { ctx.fillStyle = "#3b5a2a"; ctx.beginPath(); ctx.ellipse(-14, -6, 8, 4, 0.4, 0, 6.28); ctx.ellipse(4, 7, 9, 4, -0.3, 0, 6.28); ctx.ellipse(18, -9, 6, 3, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "#7a9a52"; ctx.beginPath(); ctx.ellipse(-2, -9, 6, 3, 0, 0, 6.28); ctx.ellipse(-20, 7, 6, 3, 0, 0, 6.28); ctx.fill(); }
    else if (P.pat === "grid") { ctx.strokeStyle = "rgba(190,230,255,0.55)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let gx = -30; gx <= 30; gx += 6) { ctx.moveTo(gx, -15); ctx.lineTo(gx, 15); } for (let gy = -15; gy <= 15; gy += 6) { ctx.moveTo(-30, gy); ctx.lineTo(30, gy); } ctx.stroke(); }
    else if (P.pat === "seam") { ctx.strokeStyle = "rgba(94,234,212,0.85)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-28, 3); ctx.lineTo(28, 3); ctx.stroke(); }
    else if (P.pat === "scales") { for (let k = -24; k <= 20; k += 9) { ctx.fillStyle = "rgba(255,90,70,0.7)"; ctx.fillRect(k, 4, 5, 3); } }
    ctx.restore();
  }
  ctx.fillStyle = P.accent; ctx.fillRect(-30, -3, 12, 6);
  // decals
  if (cos.decal === "stripes") { ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-24, 5); ctx.lineTo(16, 5); ctx.moveTo(-22, 8.5); ctx.lineTo(12, 8.5); ctx.stroke(); }
  else if (cos.decal === "teeth") { ctx.fillStyle = "#f4f4f4"; ctx.beginPath(); ctx.moveTo(12, 5); for (let k = 0; k < 6; k++) ctx.lineTo(13 + k * 2.6, k % 2 ? 5 : 10 - k * 0.5); ctx.lineTo(28, 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#b02a2a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(28, 5); ctx.stroke(); }
  else if (cos.decal === "key") { ctx.strokeStyle = "#ffd36b"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-13, 5, 3.5, 0, 6.28); ctx.moveTo(-9.5, 5); ctx.lineTo(3, 5); ctx.moveTo(1, 5); ctx.lineTo(1, 8.5); ctx.moveTo(-2.5, 5); ctx.lineTo(-2.5, 7.5); ctx.stroke(); }
  else if (cos.decal === "chain") { ctx.strokeStyle = "#cfd8de"; ctx.lineWidth = 1.3; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-18 + k * 6 + 3.5, 6); ctx.ellipse(-18 + k * 6, 6, 3.5, 2, 0, 0, 6.28); } ctx.stroke(); }
  else if (cos.decal === "select") { ctx.save(); ctx.translate(-8, 8); ctx.scale(textFlip, 1); ctx.fillStyle = "#ff5d9e"; ctx.font = "700 6px monospace"; ctx.textAlign = "center"; ctx.fillText("SELECT *", 0, 0); ctx.restore(); }
  // canopy, propeller, skid
  ctx.fillStyle = "#9fe7f5"; ctx.beginPath(); ctx.ellipse(10, -3, 11, 8, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.ellipse(13, -6, 4, 2.5, -0.4, 0, 6.28); ctx.fill();
  ctx.strokeStyle = "#5a4a2a"; ctx.lineWidth = 2; const pr = prop ? 8 : 3;
  ctx.beginPath(); ctx.moveTo(-34, -pr); ctx.lineTo(-34, pr); ctx.stroke();
  ctx.fillStyle = "#3a3f46"; ctx.fillRect(-6, 12, 18, 4);
  if (cos.fin === "antenna") { ctx.strokeStyle = "#9aa7b3"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-8, -30); ctx.stroke(); if (prop) glow(ctx, -8, -31, 8, "255,90,70", 1); ctx.fillStyle = "#ff5a46"; ctx.beginPath(); ctx.arc(-8, -31, 1.8, 0, 6.28); ctx.fill(); }
  if (cos.fin === "claw") { const o = prop ? 5 : 2; ctx.strokeStyle = "#8a96a3"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(22, 22); ctx.lineTo(30, 21); ctx.moveTo(30, 21); ctx.lineTo(35, 21 - o); ctx.moveTo(30, 21); ctx.lineTo(35, 21 + o); ctx.stroke(); }
  glow(ctx, 29, -1, 7, cos.light === "rainbow" ? "255,255,255" : rgb, 0.9);
}

/* Frame layout used by textures.js: 2 frames (propeller), each FW x FH units, drawn at RES x resolution. */
export const SUB_FRAME = { fw: 96, fh: 72, cx: 48, cy: 38, res: 2 };
