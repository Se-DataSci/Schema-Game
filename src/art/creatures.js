/* The eight zone creatures. Each one is a harmful database design practice.
   Drawn with Canvas 2D into 16-frame sprite sheets (t goes 0..2π across the loop,
   so every sin(t*k) uses a whole-number k and the animation loops seamlessly). */
import { glow } from "./kit.js";
/* Frame size and the creature's anchor point inside each frame. */
export const FRAMES = {
  leech: { fw: 250, fh: 190, cx: 70, cy: 115 }, wraith: { fw: 200, fh: 200, cx: 100, cy: 80 },
  shark: { fw: 230, fh: 150, cx: 115, cy: 85 }, kraken: { fw: 230, fh: 230, cx: 115, cy: 95 },
  angler: { fw: 220, fh: 190, cx: 120, cy: 120 }, squid: { fw: 200, fh: 230, cx: 100, cy: 90 },
  crab: { fw: 220, fh: 150, cx: 110, cy: 90 }, leviathan: { fw: 430, fh: 200, cx: 95, cy: 100 }
};

export const DRAW = {
  leech(ctx, x, y, s, t) { // segmented worm trailed by faint duplicate copies of itself
    for (let ghost = 2; ghost >= 0; ghost--) {
      ctx.globalAlpha = ghost ? 0.2 : 1;
      const ox = ghost * 26, oy = ghost * -14;
      for (let i = 9; i >= 0; i--) { const px = x + ox + i * 9 * s, py = y + oy + Math.sin(t * 2 - i * 0.6) * 7 * s; ctx.fillStyle = i % 2 ? "#8a2c4a" : "#a83a5e"; ctx.beginPath(); ctx.arc(px, py, (9 - i * 0.45) * s, 0, 6.28); ctx.fill(); }
      ctx.strokeStyle = "#ffb3c7"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + ox - 4 * s, y + oy + Math.sin(t * 2) * 7 * s, 5 * s, 0, 6.28); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  wraith(ctx, x, y, s, t) { // ghostly jelly with an empty core: NULL
    const pulse = 1 + Math.sin(t) * 0.06;
    glow(ctx, x, y, 70 * s, "200,230,255", 0.45);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(190,220,255,0.35)"; ctx.beginPath(); ctx.ellipse(x, y, 40 * s * pulse, 30 * s * pulse, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "rgba(190,220,255,0.5)"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 6; i++) { ctx.moveTo(x - 30 * s + i * 12 * s, y); for (let k = 1; k < 6; k++) ctx.lineTo(x - 30 * s + i * 12 * s + Math.sin(t + k + i) * 6, y + k * 12 * s); }
    ctx.stroke(); ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#e9f6ff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 12 * s, 10 * s, 0, 6.28); ctx.moveTo(x - 12 * s, y - 2 * s); ctx.lineTo(x + 12 * s, y - 22 * s); ctx.stroke();
  },
  shark(ctx, x, y, s, t) { // bites the whole table at once
    const wag = Math.sin(t * 3) * 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
    ctx.fillStyle = "#5c6f80"; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-20, -28, 50, -6); ctx.lineTo(78, -26 + wag * 30); ctx.lineTo(70, 0); ctx.lineTo(80, 26 + wag * 30); ctx.lineTo(50, 6); ctx.quadraticCurveTo(-20, 26, -70, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(4, -44); ctx.lineTo(18, -14); ctx.fill();
    ctx.fillStyle = "#c9d3db"; ctx.beginPath(); ctx.moveTo(-66, 4); ctx.quadraticCurveTo(-20, 22, 40, 6); ctx.quadraticCurveTo(-20, 12, -66, 4); ctx.fill();
    ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.arc(-48, -5, 3, 0, 6.28); ctx.fill();
    ctx.restore();
  },
  kraken(ctx, x, y, s, t) { // a tentacle for every row of the other table
    ctx.strokeStyle = "#b8324a"; ctx.lineCap = "round"; ctx.lineWidth = 7 * s; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; let px = x, py = y + 10 * s; ctx.moveTo(px, py); for (let k = 1; k <= 6; k++) { px += Math.cos(a + Math.sin(t + k + i) * 0.5) * 14 * s; py += Math.sin(a + Math.sin(t + k + i) * 0.5) * 10 * s + 4 * s; ctx.lineTo(px, py); } }
    ctx.stroke();
    ctx.fillStyle = "#d1415c"; ctx.beginPath(); ctx.ellipse(x, y - 14 * s, 34 * s, 40 * s, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.ellipse(x - 12 * s, y - 8 * s, 7 * s, 9 * s, 0, 0, 6.28); ctx.ellipse(x + 12 * s, y - 8 * s, 7 * s, 9 * s, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#200"; ctx.fillRect(x - 13 * s, y - 14 * s, 2.5 * s, 11 * s); ctx.fillRect(x + 11 * s, y - 14 * s, 2.5 * s, 11 * s);
  },
  angler(ctx, x, y, s, t) { // dangles an ambiguous lure
    const lx = x - 46 * s + Math.sin(t) * 6, ly = y - 54 * s;
    glow(ctx, lx, ly, 46 * s, "160,255,230", 0.75 + 0.25 * Math.sin(t * 3));
    ctx.strokeStyle = "#3c4a5c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10 * s, y - 30 * s); ctx.quadraticCurveTo(x - 30 * s, y - 70 * s, lx, ly); ctx.stroke();
    ctx.fillStyle = "#2a3444"; ctx.beginPath(); ctx.ellipse(x, y, 46 * s, 36 * s, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 40 * s, y); ctx.lineTo(x + 70 * s, y - 20 * s + Math.sin(t * 2) * 6); ctx.lineTo(x + 70 * s, y + 20 * s + Math.sin(t * 2) * 6); ctx.fill();
    ctx.fillStyle = "#0b0f16"; ctx.beginPath(); ctx.ellipse(x - 26 * s, y + 8 * s, 22 * s, 14 * s + Math.sin(t) * 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#e9eef2"; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(x - 44 * s + i * 7 * s, y - 2 * s); ctx.lineTo(x - 41 * s + i * 7 * s, y + 8 * s); ctx.lineTo(x - 38 * s + i * 7 * s, y - 2 * s); } ctx.fill();
    ctx.fillStyle = "#cfe"; ctx.beginPath(); ctx.arc(x - 8 * s, y - 14 * s, 5 * s, 0, 6.28); ctx.fill();
  },
  squid(ctx, x, y, s, t) { // tangled spaghetti tentacles
    ctx.strokeStyle = "#f0a23a"; ctx.lineWidth = 3 * s; ctx.lineCap = "round"; ctx.beginPath();
    for (let i = 0; i < 12; i++) { ctx.moveTo(x + (i - 6) * 3 * s, y + 20 * s); for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(t + i * 1.7 + k * 0.9) * 40 * s, y + 20 * s + k * 9 * s); }
    ctx.stroke();
    ctx.fillStyle = "#e8892c"; ctx.beginPath(); ctx.moveTo(x - 22 * s, y + 20 * s); ctx.quadraticCurveTo(x - 26 * s, y - 50 * s, x, y - 70 * s); ctx.quadraticCurveTo(x + 26 * s, y - 50 * s, x + 22 * s, y + 20 * s); ctx.fill();
    ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.arc(x - 9 * s, y + 4 * s, 7 * s, 0, 6.28); ctx.arc(x + 9 * s, y + 4 * s, 7 * s, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#1a0f05"; ctx.beginPath(); ctx.arc(x - 9 * s + Math.sin(t) * 2, y + 5 * s, 3 * s, 0, 6.28); ctx.arc(x + 9 * s - Math.sin(t) * 2, y + 5 * s, 3 * s, 0, 6.28); ctx.fill();
  },
  crab(ctx, x, y, s, t) { // cracked shell, snapping claws: orphaned rows
    const snap = Math.abs(Math.sin(t * 2)) * 0.5;
    ctx.strokeStyle = "#c4582b"; ctx.lineWidth = 4 * s; ctx.lineCap = "round"; ctx.beginPath();
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) { ctx.moveTo(x + d * 20 * s, y + 4 * s); ctx.lineTo(x + d * (36 + i * 6) * s, y - 4 * s + i * 5 * s); ctx.lineTo(x + d * (44 + i * 6) * s, y + 20 * s + Math.sin(t * 4 + i) * 3); }
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
  leviathan(ctx, x, y, s, t) { // serpent of repeating table segments: every fact stored many times
    for (let i = 16; i >= 0; i--) {
      const px = x + i * 16 * s, py = y + Math.sin(t - i * 0.45) * 22 * s;
      ctx.fillStyle = i % 2 ? "#1e3346" : "#24405a"; ctx.beginPath(); ctx.ellipse(px, py, (26 - i * 0.9) * s, (20 - i * 0.7) * s, 0, 0, 6.28); ctx.fill();
      if (i % 2 === 0) { ctx.fillStyle = `rgba(255,90,70,${0.45 + 0.35 * Math.sin(t * 2 + i)})`; ctx.fillRect(px - 6 * s, py - 3 * s, 12 * s, 6 * s); }
    }
    const hy = y + Math.sin(t) * 22 * s;
    ctx.fillStyle = "#2b4a66"; ctx.beginPath(); ctx.moveTo(x - 60 * s, hy); ctx.quadraticCurveTo(x - 30 * s, hy - 40 * s, x + 10 * s, hy - 24 * s); ctx.lineTo(x + 10 * s, hy + 24 * s); ctx.quadraticCurveTo(x - 30 * s, hy + 40 * s, x - 60 * s, hy); ctx.fill();
    const jaw = 8 + Math.abs(Math.sin(t)) * 14;
    ctx.fillStyle = "#05080c"; ctx.beginPath(); ctx.moveTo(x - 62 * s, hy); ctx.lineTo(x - 20 * s, hy - jaw * s * 0.4); ctx.lineTo(x - 20 * s, hy + jaw * s * 0.6); ctx.fill();
    glow(ctx, x - 26 * s, hy - 16 * s, 14 * s, "255,90,70", 0.9);
  }
};

/* Small hazard that drifts around zones: corrupted data. Dodge it. */
export function drawJelly(ctx, x, y, t) {
  glow(ctx, x, y, 34, "255,110,170", 0.5);
  ctx.fillStyle = "rgba(255,120,175,0.75)"; ctx.beginPath(); ctx.ellipse(x, y, 18, 14 + Math.sin(t) * 2, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = "rgba(255,170,205,0.8)"; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 5; i++) { ctx.moveTo(x - 12 + i * 6, y); for (let k = 1; k < 5; k++) ctx.lineTo(x - 12 + i * 6 + Math.sin(t + k + i) * 3, y + k * 7); }
  ctx.stroke();
  ctx.fillStyle = "#3a0b1f"; ctx.font = "700 10px monospace"; ctx.textAlign = "center"; ctx.fillText("#!?", x, y - 3);
}
