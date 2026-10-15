/* The seabase in the Kelp Shallows. You can swim around it freely.
   Opening the Sub Bay brings the sub in close for previews. */
import { S } from "../core/state.js";
import { bus } from "../core/bus.js";
import { realDt } from "../core/util.js";
import { dockedLayout } from "../core/device.js";
import { buildSeabase } from "../art/textures.js";
import { BASE_PAL } from "../art/environment.js";
import { buildBackdrop } from "./backdrop.js";
import { Submarine } from "../entities/Submarine.js";
import { bay } from "../systems/economy.js";
import { stick } from "../ui/controls.js";
import { raid } from "../systems/raid.js";
import { ZoneCreature } from "../entities/Creature.js";
export class BaseScene extends Phaser.Scene {
  constructor() { super("Base"); }

  create() {
    const cam = this.cameras.main;
    this.W = Math.max(1300, cam.width * 1.8);
    this.floorY = dockedLayout() ? cam.height - 70 : Math.round(cam.height * 0.42);
    const top = 70;
    this.bounds = { x: 40, y: top, w: this.W - 80, h: this.floorY - 30 - top };
    cam.setBounds(0, 0, this.W, Math.max(cam.height, this.floorY + 200));
    this.back = buildBackdrop(this, { zoneKey: 99, pal: BASE_PAL, flora: "kelp", worldW: this.W, floorY: this.floorY, deep: -1 });

    this.baseX = this.W / 2;
    this.drawBase();
    this.sub = new Submarine(this, this.baseX - 160, this.floorY - 150, this.bounds);
    cam.startFollow(this.sub.sprite, true, 0.08, 0.08);
    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT", false);   // no key capture, so typed answers work
    this.target = null; this.wanderT = 0;

    // tap or click the water to swim there
    this.input.on("pointerdown", p => { if (!bay.open) this.target = { x: p.worldX, y: p.worldY, hold: 4 }; });
    this.input.on("pointermove", p => { if (p.isDown && this.target) { this.target.x = p.worldX; this.target.y = p.worldY; } });

    const onCos = () => this.sub.refreshLook();
    const onBase = () => this.drawBase();
    bus.on("cos-changed", onCos); bus.on("base-changed", onBase);
    const rh = {
      "raid-start": A => this.spawnRaider(A),
      "raid-hit": () => this.zapRaider(),
      "raid-miss": () => this.baseHit(),
      "raid-end": A => this.raidOver(A),
      "raid-clear": () => this.clearRaider()
    };
    for (const k in rh) bus.on(k, rh[k]);
    if (raid.active && raid.active.phase !== "done") this.spawnRaider(raid.active);
    this.scale.on("resize", this.onResize, this);
    this.events.once("shutdown", () => { bus.off("cos-changed", onCos); bus.off("base-changed", onBase); for (const k in rh) bus.off(k, rh[k]); this.scale.off("resize", this.onResize, this); this.raider = null; });
  }

  /* ---- raids: the raider swims in from the right and parks beside the base ---- */
  spawnRaider(A) {
    this.clearRaider();
    const id = A.creature.id;
    this.raider = new ZoneCreature(this, id, this.W - 40, this.floorY - 240, id === "leviathan" ? 0.8 : 0.9);
    const spot = { x: this.baseX + Math.min(190, this.cameras.main.width * 0.28), y: this.floorY - 130 };  // stays on screen on phones
    this.tweens.add({ targets: this.raider.sprite, x: spot.x, y: spot.y, duration: 4000, ease: "Sine.easeOut" });
    this.tweens.add({ targets: this.raider.sprite, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1 });
  }

  zapRaider() {
    if (!this.raider) return;
    this.raider.flash();
    const g = this.add.graphics().setDepth(9);
    g.lineStyle(4, 0x5eead4, 1).beginPath().moveTo(this.sub.x + 30 * this.sub.face, this.sub.y).lineTo(this.raider.x, this.raider.y).strokePath();
    g.strokeCircle(this.raider.x, this.raider.y, 42);
    this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
  }

  baseHit() {
    this.cameras.main.shake(260, 0.01);
    if (this.baseImg) { this.baseImg.setTint(0xff6b57); this.time.delayedCall(240, () => this.baseImg && this.baseImg.clearTint()); }
    if (this.raider) this.raider.lunge({ x: this.baseX });
  }

  raidOver(A) {
    if (!this.raider) return;
    const r = this.raider;
    this.tweens.killTweensOf(r.sprite);
    if (A.result.won) { r.flash(); r.flee(); }
    else { this.baseHit(); this.time.delayedCall(450, () => r.sprite.active && r.flee()); }
  }

  clearRaider() {
    if (!this.raider) return;
    this.tweens.killTweensOf(this.raider.sprite);
    this.raider.sprite.destroy();
    this.raider = null;
  }

  onResize() { this.back.resize(); }

  drawBase() {
    const s = buildSeabase(this, S.owned);
    if (this.baseImg) this.baseImg.destroy();
    this.baseImg = this.add.image(this.baseX, this.floorY + 4, "seabase").setOrigin(s.ox / s.c.width, s.oy / s.c.height).setDepth(4);
    if (this.beacon) this.beacon.destroy();
    this.beacon = null;
    if (s.beacon) {
      this.beacon = this.add.image(this.baseImg.x - s.ox + s.beacon.x, this.baseImg.y - s.oy + s.beacon.y, "p-dot").setTint(0xff5a46).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setDepth(5);
      this.tweens.add({ targets: this.beacon, alpha: { from: 1, to: 0.15 }, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  update(time, delta) {
    const dt = realDt(this), k = this.keys;
    let ax = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let ay = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (stick.active) { ax = stick.x; ay = stick.y; }
    let autopilot = null;
    if (bay.open) { autopilot = { x: this.baseX - 150, y: this.floorY - 120 }; ax = ay = 0; }
    else if (raid.active && raid.active.phase !== "done") { autopilot = { x: this.baseX + 30, y: this.floorY - 150 }; ax = ay = 0; this.target = null; }
    else if (ax || ay) this.target = null;
    else if (this.target) { autopilot = this.target; this.target.hold -= dt; if (this.target.hold <= 0 || Math.hypot(this.target.x - this.sub.x, this.target.y - this.sub.y) < 8) this.target = null; }
    else { // idle: drift lazily around the base
      this.wanderT -= dt;
      if (this.wanderT <= 0) { this.wander = { x: this.baseX + Phaser.Math.Between(-360, 360), y: Phaser.Math.Between(110, this.floorY - 70) }; this.wanderT = 3 + Math.random() * 3; }
      autopilot = this.wander;
    }
    this.sub.setZoom(bay.open ? 2.4 : 1);
    this.sub.update(dt, ax, ay, { autopilot, cone: bay.open ? 0.5 : 0, speedMul: autopilot && !bay.open && !this.target ? 0.35 : 1 });
    const cam = this.cameras.main;
    this.back.update(this.sub.x - cam.scrollX, this.sub.y - cam.scrollY);
  }
}
