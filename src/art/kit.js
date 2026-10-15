/* Canvas helpers used to paint textures before Phaser takes over. */
export function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

const glowCache = {};
/* A soft radial glow, cached per color ("r,g,b"). */
export function glowSprite(rgb) {
  if (glowCache[rgb]) return glowCache[rgb];
  const c = canvas(64, 64), g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.35, `rgba(${rgb},0.45)`); r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (glowCache[rgb] = c);
}

/* Additive glow drawn into a canvas context. */
export function glow(ctx, x, y, rad, rgb, alpha = 1) {
  if (alpha <= 0) return;
  const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(rgb), x - rad, y - rad, rad * 2, rad * 2);
  ctx.globalCompositeOperation = op; ctx.globalAlpha = ga;
}
