/* Turns the Canvas 2D art into Phaser textures and animations.
   Everything is generated in code, so the game ships with no image files. */
import { canvas } from "./kit.js";
import { DRAW, FRAMES, drawJelly } from "./creatures.js";
import { drawSub, SUB_FRAME } from "./sub.js";
import * as env from "./environment.js";
function put(scene, key, c, frames) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, c);
  if (frames) frames.forEach(([name, x, y, w, h]) => tex.add(name, 0, x, y, w, h));
  return key;
}

/* Textures every scene uses. */
export function ensureCommon(scene) {
  if (scene.textures.exists("hole")) return;
  put(scene, "hole", env.hole());
  put(scene, "vignette", env.vignette());
  put(scene, "cone", env.cone());
  put(scene, "rays", env.rays());
  for (const k of ["bubble", "dot", "spark", "snow", "smoke"]) put(scene, "p-" + k, env.particle(k));
  put(scene, "p-bits", env.particle("bits"), [[0, 0, 0, 14, 16], [1, 14, 0, 14, 16]]);
  for (const k of ["fragment", "sample", "drive", "crate"]) put(scene, "obj-" + k, env.objective(k));
  put(scene, "vent", env.airVent());
  put(scene, "shard", env.shard());
  // small reef fish
  const fc = canvas(24, 12), fg = fc.getContext("2d");
  fg.fillStyle = "#fff"; fg.beginPath(); fg.ellipse(14, 6, 8, 3.5, 0, 0, 6.28); fg.moveTo(7, 6); fg.lineTo(1, 2); fg.lineTo(1, 10); fg.fill();
  put(scene, "fish", fc);
  // hazard jelly: 8-frame pulse
  const jc = canvas(80 * 8, 90), jg = jc.getContext("2d");
  for (let i = 0; i < 8; i++) drawJelly(jg, 40 + i * 80, 34, (i / 8) * Math.PI * 2);
  put(scene, "jelly", jc, [...Array(8)].map((_, i) => [i, i * 80, 0, 80, 90]));
  scene.anims.create({ key: "jelly-swim", frames: [...Array(8)].map((_, i) => ({ key: "jelly", frame: i })), frameRate: 8, repeat: -1 });
}

/* A zone's palette strips, plants and creature animation. Cached per zone. */
export function ensureZone(scene, zoneKey, pal, flora, creatureId) {
  const k = "z" + zoneKey;
  if (!scene.textures.exists(k + "-grad")) {
    put(scene, k + "-grad", env.gradient(pal));
    put(scene, k + "-far", env.farRocks(pal, 99 + zoneKey * 13));
    put(scene, k + "-floor", env.floorStrip(pal));
  }
  const plants = [];
  for (let v = 0; v < 4; v++) {
    const key = `${k}-plant${v}`, p = env.plant(flora, v, 7 + zoneKey * 3);
    if (!scene.textures.exists(key)) put(scene, key, p.c);
    plants.push({ key, ox: p.ox, oy: p.oy, glow: p.glow, plume: p.plume, eyes: p.eyes, w: p.c.width, h: p.c.height });
  }
  if (creatureId) ensureCreature(scene, creatureId);
  return { grad: k + "-grad", far: k + "-far", floor: k + "-floor", plants };
}

export function ensureCreature(scene, id) {
  const key = "cr-" + id;
  if (scene.textures.exists(key)) return key;
  const f = FRAMES[id], cols = 4, n = 16, c = canvas(f.fw * cols, f.fh * Math.ceil(n / cols)), g = c.getContext("2d");
  const frames = [];
  for (let i = 0; i < n; i++) {
    const x = (i % cols) * f.fw, y = Math.floor(i / cols) * f.fh;
    g.save(); g.beginPath(); g.rect(x, y, f.fw, f.fh); g.clip();
    DRAW[id](g, x + f.cx, y + f.cy, 1, (i / n) * Math.PI * 2);
    g.restore();
    frames.push([i, x, y, f.fw, f.fh]);
  }
  put(scene, key, c, frames);
  scene.anims.create({ key: key + "-anim", frames: frames.map(([i]) => ({ key, frame: i })), frameRate: 8, repeat: -1 });
  return key;
}

/* The sub, drawn for the current cosmetics: facing right ("-R") and left ("-L"), 2 propeller frames each. */
let subVersion = 0;
export function buildSub(scene, cos) {
  const { fw, fh, cx, cy, res } = SUB_FRAME;
  subVersion++;
  const keys = {};
  for (const dir of ["R", "L"]) {
    const c = canvas(fw * res * 2, fh * res), g = c.getContext("2d");
    for (let f = 0; f < 2; f++) {
      g.save(); g.translate((f * fw + cx) * res, cy * res); g.scale(dir === "R" ? res : -res, res);
      drawSub(g, cos, f, dir === "R" ? 1 : -1);
      g.restore();
    }
    const key = `sub${subVersion}-${dir}`;
    put(scene, key, c, [[0, 0, 0, fw * res, fh * res], [1, fw * res, 0, fw * res, fh * res]]);
    if (!scene.anims.exists(key + "-spin")) scene.anims.create({ key: key + "-spin", frames: [{ key, frame: 0 }, { key, frame: 1 }], frameRate: 14, repeat: -1 });
    keys[dir] = key;
  }
  // drop textures from two versions ago (the previous one may still be on screen this frame)
  for (const dir of ["R", "L"]) {
    const old = `sub${subVersion - 2}-${dir}`;
    if (scene.anims.exists(old + "-spin")) scene.anims.remove(old + "-spin");
    if (scene.textures.exists(old)) scene.textures.remove(old);
  }
  return keys;
}

export function buildSeabase(scene, mods) {
  const s = env.seabase(mods);
  put(scene, "seabase", s.c);
  return s;
}
