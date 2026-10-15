/* The player's sub: a Phaser sprite plus its headlight, trail and cosmetics.
   Movement uses real elapsed time (not fixed physics steps), so it swims at the same speed on slow and fast devices. */
import { CFG } from "../../config/config.js";
import { buildSub } from "../art/textures.js";
import { lightRGB, rgbNum, RAINBOW } from "../art/sub.js";
import { currentCos } from "../systems/economy.js";
import { clamp } from "../core/util.js";
const BASE_SCALE = 0.5;   // textures are drawn at 2x for sharpness

export class Submarine {
  /* bounds = { x, y, w, h }: the area the sub can swim in. */
  constructor(scene, x, y, bounds) {
    this.scene = scene; this.bounds = bounds;
    this.face = 1; this.vx = 0; this.vy = 0; this.zoom = 1; this.t = 0;
    this.cone = scene.add.image(x, y, "cone").setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setVisible(false);
    this.sprite = scene.add.sprite(x, y, "fish").setDepth(8);
    this.refreshLook();
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  /* Rebuild textures + trail after a cosmetic change. */
  refreshLook() {
    this.cos = currentCos();
    this.keys = buildSub(this.scene, this.cos);
    this.sprite.setTexture(this.keys[this.face > 0 ? "R" : "L"], 0);
    this.sprite.play(this.keys[this.face > 0 ? "R" : "L"] + "-spin");
    this.sprite.setScale(BASE_SCALE * this.zoom);
    this.makeTrail();
  }

  makeTrail() {
    if (this.trail) this.trail.destroy();
    const cos = this.cos, s = this.scene;
    const tint = cos.light === "rainbow" ? RAINBOW.map(rgbNum) : rgbNum(lightRGB(cos.light));
    const add = Phaser.BlendModes.ADD;
    const configs = {
      bubbles: ["p-bubble", { speedY: { min: -60, max: -30 }, speedX: { min: -12, max: 12 }, lifespan: 1600, scale: { start: 0.5, end: 1.1 }, alpha: { start: 0.8, end: 0 }, frequency: 150 }],
      sparkle: ["p-spark", { speed: { min: 10, max: 40 }, lifespan: 700, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, tint, blendMode: add, frequency: 45 }],
      ribbon: ["p-dot", { speed: 0, lifespan: 520, scale: { start: 0.55, end: 0.05 }, alpha: { start: 0.9, end: 0 }, tint, blendMode: add, frequency: 14 }],
      bits: ["p-bits", { frame: [0, 1], speed: { min: 15, max: 40 }, lifespan: 1300, gravityY: -20, alpha: { start: 1, end: 0 }, tint, frequency: 70 }]
    };
    const [key, cfg] = configs[cos.trail] || configs.bubbles;
    this.trail = s.add.particles(0, 0, key, cfg).setDepth(7);
    this.trail.startFollow(this.sprite, -34, 2);
  }

  setZoom(z) { this.zoom = z; }

  /* ax, ay: steering input from -1..1. opts: { frozen, cone (0..1), autopilot: {x,y}, speedMul } */
  update(dt, ax, ay, opts = {}) {
    this.t += dt;
    const max = CFG.sub.maxSpeed * (opts.speedMul || 1);
    let tx = ax * max, ty = ay * max;
    if (opts.autopilot) {
      const dx = opts.autopilot.x - this.x, dy = opts.autopilot.y - this.y, d = Math.hypot(dx, dy);
      const sp = Math.min(max, d * 2);
      tx = d > 3 ? (dx / d) * sp : 0; ty = d > 3 ? (dy / d) * sp : 0;
    }
    if (opts.frozen) { tx = 0; ty = 0; }
    const steering = Math.hypot(ax, ay) > 0.05 || opts.autopilot;
    const k = Math.min(1, dt * (steering ? CFG.sub.acceleration / max : 2.2 * (1.1 - CFG.sub.drag)));
    this.vx += (tx - this.vx) * k; this.vy += (ty - this.vy) * k;
    const b = this.bounds;
    this.sprite.x = clamp(this.sprite.x + this.vx * dt, b.x, b.x + b.w);
    this.sprite.y = clamp(this.sprite.y + (this.vy + Math.sin(this.t * 1.4) * 4) * dt, b.y, b.y + b.h);
    if (this.sprite.x <= b.x || this.sprite.x >= b.x + b.w) this.vx *= 0.5;
    if (this.sprite.y <= b.y || this.sprite.y >= b.y + b.h) this.vy *= 0.5;

    const want = Math.abs(this.vx) > 25 ? Math.sign(this.vx) : this.face;
    if (want !== this.face) {
      this.face = want;
      const k2 = this.keys[want > 0 ? "R" : "L"];
      this.sprite.play(k2 + "-spin");
      this.trail.followOffset.x = -34 * want * this.zoom;
    }
    const sc = BASE_SCALE * this.zoom;
    if (Math.abs(this.sprite.scaleX - sc) > 0.001) { this.sprite.setScale(this.sprite.scaleX + (sc - this.sprite.scaleX) * Math.min(1, dt * 5)); this.trail.followOffset.x = -34 * this.face * this.sprite.scaleX / BASE_SCALE; }
    const tilt = clamp(this.vy / 420, -0.32, 0.32) * this.face;
    this.sprite.rotation += (tilt - this.sprite.rotation) * Math.min(1, dt * 6);
    const speed = Math.hypot(this.vx, this.vy);
    this.sprite.anims.timeScale = 0.5 + (speed / max) * 1.5;
    this.trail.frequency = this.cos.trail === "bubbles" ? 260 - Math.min(200, speed) : this.trail.frequency;

    const coneA = opts.cone || 0;
    this.cone.setVisible(coneA > 0);
    if (coneA > 0) {
      const s = 1.7 * this.sprite.scaleX / BASE_SCALE;
      this.cone.setPosition(this.x + 22 * this.face * s / 1.7, this.y).setScale(s * this.face, s).setRotation(this.sprite.rotation).setAlpha(coneA);
      this.cone.setTint(rgbNum(lightRGB(this.cos.light, this.t)));
    }
  }

  knockback(fromX, fromY, force = 320) {
    const dx = this.x - fromX, dy = this.y - fromY, d = Math.hypot(dx, dy) || 1;
    this.vx = (dx / d) * force; this.vy = (dy / d) * force;
  }

  destroy() { this.trail.destroy(); this.cone.destroy(); this.sprite.destroy(); }
}
