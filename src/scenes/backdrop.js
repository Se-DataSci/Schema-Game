/* Shared ocean scenery for the seabase and every dive: gradient, light rays,
   parallax rocks, seafloor, swaying plants, drifting snow, fish and depth darkness. */
import { ensureZone } from "../art/textures.js";
import { seeded } from "../core/util.js";
const STATIC = { wreck: true, vent: true, trench: true };

export function buildBackdrop(scene, o) {
  const { zoneKey, pal, flora, worldW, floorY, deep, creatureId } = o;
  const z = ensureZone(scene, zoneKey, pal, flora, creatureId);
  const cam = scene.cameras.main, r = seeded(31 + zoneKey * 7);
  const ADD = Phaser.BlendModes.ADD;

  const grad = scene.add.image(0, 0, z.grad).setOrigin(0).setScrollFactor(0).setDepth(-30);
  const shallow = Math.max(0, 1 - deep / 3.5);
  const rays = shallow > 0 ? scene.add.image(0, 0, "rays").setOrigin(0).setScrollFactor(0).setBlendMode(ADD).setAlpha(shallow).setDepth(-28) : null;
  const far = scene.add.tileSprite(0, floorY - 290, cam.width, 320, z.far).setOrigin(0).setScrollFactor(0, 1).setDepth(-25);
  scene.add.tileSprite(0, floorY - 26, worldW, 300, z.floor).setOrigin(0).setDepth(0);

  // plants along the floor
  const props = [];
  for (let x = 20; x < worldW; x += 46 + r() * 60) {
    const p = z.plants[Math.floor(r() * z.plants.length)];
    if (flora === "wreck" && p === z.plants[0] && r() < 0.75) continue; // big hulls are rare
    const img = scene.add.image(x, floorY + 6, p.key).setOrigin(p.ox / p.w, p.oy / p.h).setDepth(1);
    if (!STATIC[flora]) scene.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 2200 + r() * 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: r() * 2000 });
    if (p.glow) scene.tweens.add({ targets: img, alpha: { from: 0.75, to: 1 }, duration: 1300 + r() * 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (p.eyes) img.y -= 40 + r() * 120;
    if (p.plume && props.length < 6) {
      props.push(scene.add.particles(x, floorY + 6 - p.plume, "p-smoke", { speedY: { min: -70, max: -40 }, speedX: { min: -8, max: 8 }, lifespan: 2600, scale: { start: 0.5, end: 2.2 }, alpha: { start: 0.5, end: 0 }, frequency: 220 }).setDepth(2));
    }
  }
  if (flora === "trench") { // dark trench walls at both ends of the zone
    const g = scene.add.graphics().setDepth(3); g.fillStyle(0x04060b, 1);
    g.fillRect(0, 0, 70, floorY + 40); g.fillRect(worldW - 70, 0, 70, floorY + 40);
  }

  // marine snow drifting in screen space
  const snow = scene.add.particles(0, -10, "p-snow", { x: { min: 0, max: Math.max(cam.width, 400) }, speedY: { min: 8, max: 22 }, speedX: { min: -5, max: 5 }, lifespan: 40000, frequency: 260, alpha: { start: 0.7, end: 0.4 }, scale: { min: 0.6, max: 1.4 }, advance: 30000 }).setScrollFactor(0).setDepth(9);

  // fish schools in sunlit water
  const fish = [];
  if (deep <= 2) {
    for (let i = 0; i < 12; i++) {
      const f = scene.add.image(r() * worldW, 140 + r() * (floorY - 300), "fish").setTint(i % 2 ? 0xffd278 : 0xb4f0ff).setAlpha(0.85).setDepth(2).setScale(0.8 + r() * 0.5);
      const dir = r() < 0.5 ? -1 : 1, dist = 300 + r() * 500;
      f.setFlipX(dir < 0);
      scene.tweens.add({ targets: f, x: f.x + dir * dist, duration: 9000 + r() * 6000, yoyo: true, repeat: -1, ease: "Sine.easeInOut", onYoyo: () => f.toggleFlipX(), onRepeat: () => f.toggleFlipX() });
      scene.tweens.add({ targets: f, y: f.y + 14, duration: 1400 + r() * 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      fish.push(f);
    }
  }

  // darkness deeper down, with a pocket of light around the sub
  const darkness = deep >= 3 ? scene.add.image(0, 0, "hole").setScrollFactor(0).setDepth(20).setAlpha(Math.min(0.75, 0.2 * (deep - 2))) : null;

  function resize() {
    const w = cam.width, h = cam.height;
    grad.setDisplaySize(w, h);
    if (rays) rays.setDisplaySize(w, h * 0.9);
    far.width = w;
  }
  resize();

  return {
    resize,
    /* sx, sy: the sub's position on screen */
    update(sx, sy) {
      far.tilePositionX = cam.scrollX * 0.35;
      if (rays) rays.x = -((cam.scrollX * 0.08) % 60);
      if (darkness) { const s = (Math.max(cam.width, cam.height) * 3) / 256; darkness.setPosition(sx + 60, sy).setScale(s); }
    }
  };
}
