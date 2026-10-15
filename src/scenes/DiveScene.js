/* A dive: an open zone you explore. Swim to glowing targets to scan them, open the salvage crate,
   and fight the zone's creature. Watch your oxygen; air vents refill it. */
import { CFG } from "../../config/config.js";
import { ZONES } from "../data/content.js";
import { S, maxO2 } from "../core/state.js";
import { bus } from "../core/bus.js";
import { realDt } from "../core/util.js";
import { profile, isTouch } from "../core/device.js";
import { seeded, clamp } from "../core/util.js";
import { run, tick, drain, reward, creatureOf, allDone } from "../systems/dive.js";
import { buildBackdrop } from "./backdrop.js";
import { Submarine } from "../entities/Submarine.js";
import { ZoneCreature, Hazard } from "../entities/Creature.js";
import { stick, setAction, setSonar } from "../ui/controls.js";
const LABEL = { scan: "Scan", crate: "Open crate", beast: "Engage" };

export class DiveScene extends Phaser.Scene {
  constructor() { super("Dive"); }

  create() {
    const D = run.D; this.D = D;
    const z = ZONES[D.zone], base = profile();
    const prof = D.tutorial ? { ...base, worldWidth: 1700, worldHeight: 1100, hazards: 0, shards: 3, vents: 0, sonar: false, minimap: false } : base;
    this.prof = prof; this.touch = isTouch();
    const W = prof.worldWidth, H = prof.worldHeight, floorY = H - 130;
    this.W = W; this.floorY = floorY;
    const top = 70, r = seeded(Date.now() & 0xffff);
    this.bounds = { x: 40, y: top, w: W - 80, h: floorY - 36 - top };
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H);
    this.back = buildBackdrop(this, { zoneKey: D.zone, pal: z.pal, flora: z.flora, worldW: W, floorY, deep: D.zone, creatureId: z.creature.id });

    // objectives spread across the zone, the creature's lair near the far end
    const n = D.objectives.length, yLo = top + 90, yHi = floorY - 90;
    D.objectives.forEach((o, i) => {
      o.x = o.kind === "beast" ? W - 380 : 300 + ((i + 0.5) / n) * (W - 800) + (r() - 0.5) * 120;
      o.y = yLo + r() * (yHi - yLo);
      if (o.kind === "beast") {
        const c = new ZoneCreature(this, z.creature.id, o.x, o.y, D.tutorial ? 0.7 : (z.creature.id === "leviathan" ? 1.1 : 1));
        this.creature = c; o.sprite = c.sprite;
      } else {
        const key = o.kind === "crate" ? "obj-crate" : "obj-" + o.obj;
        o.sprite = this.add.image(o.x, o.y, key).setDepth(5).setScale(0.9);
        this.tweens.add({ targets: o.sprite, y: o.y + 10, duration: 1600 + r() * 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        o.ring = this.add.circle(o.x, o.y, 40).setStrokeStyle(2, o.kind === "crate" ? 0xffcf6b : 0x5eead4, 0.8).setDepth(4);
        this.tweens.add({ targets: o.ring, scale: { from: 0.6, to: 1.5 }, alpha: { from: 0.9, to: 0 }, duration: 1600, repeat: -1 });
      }
    });

    // air vents, data shards, hazards
    this.vents = [];
    for (let i = 0; i < prof.vents; i++) {
      const x = W * (0.35 + i * 0.35) + (r() - 0.5) * 200;
      const img = this.add.image(x, floorY - 10, "vent").setDepth(3);
      const em = this.add.particles(x, floorY - 14, "p-bubble", { speedY: { min: -120, max: -70 }, speedX: { min: -14, max: 14 }, lifespan: 2400, scale: { start: 0.6, end: 1.3 }, alpha: { start: 0.9, end: 0 }, frequency: 70 }).setDepth(3);
      this.vents.push({ x, y: floorY - 60, img, em });
    }
    this.shards = [];
    for (let i = 0; i < prof.shards; i++) {
      const s = this.add.image(250 + r() * (W - 500), yLo + r() * (yHi - yLo), "shard").setDepth(5);
      this.tweens.add({ targets: s, angle: 360, duration: 4000, repeat: -1 });
      this.shards.push(s);
    }
    this.hazards = [];
    if (D.zone >= 1) for (let i = 0; i < prof.hazards; i++) this.hazards.push(new Hazard(this, 700 + r() * (W - 1200), yLo + r() * (yHi - yLo)));

    // the sub enters from the left
    this.sub = new Submarine(this, 120, (yLo + yHi) / 2, this.bounds);
    cam.startFollow(this.sub.sprite, true, 0.09, 0.09);

    // overlays
    this.beam = this.add.graphics().setDepth(9);
    this.arrows = this.add.graphics().setScrollFactor(0).setDepth(31);
    this.mini = prof.minimap ? this.add.graphics().setScrollFactor(0).setDepth(31) : null;
    this.vig = this.add.image(0, 0, "vignette").setOrigin(0).setScrollFactor(0).setDepth(21).setAlpha(0);
    this.hurt = this.add.rectangle(0, 0, 10, 10, 0xff3c28, 1).setOrigin(0).setScrollFactor(0).setDepth(22).setAlpha(0);
    this.sonarT = 0; this.sonarCd = 0; this.beamT = 0; this.near = undefined; this.hudT = 0;

    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,Q", false);   // no key capture, so typed answers work
    // key events (not polling) so a quick tap is never missed on a slow frame
    const kb = this.input.keyboard;
    kb.on("keydown-E", () => this.interact()); kb.on("keydown-SPACE", () => this.interact());
    kb.on("keydown-Q", () => this.sonar());
    this.events.once("shutdown", () => kb.off("keydown-E").off("keydown-SPACE").off("keydown-Q"));
    this.onResize(); this.scale.on("resize", this.onResize, this);

    const h = {
      act: () => this.interact(),
      sonar: () => this.sonar(),
      "encounter-closed": o => this.afterEncounter(o),
      "fight-hit": () => { this.creature.flash(); this.fireBeam(this.creature, true); },
      "fight-miss": () => { this.creature.lunge(this.sub); this.ouch(); },
      "scan-beam": ok => { const o = this.D.active; if (o) this.fireBeam(o, ok); if (!ok) this.ouch(); },
      float: (txt, c) => this.floatText(txt, c),
      "cos-changed": () => this.sub.refreshLook(),
      layout: top => { this.sheetTop = top; }
    };
    for (const k in h) bus.on(k, h[k]);
    this.events.once("shutdown", () => { for (const k in h) bus.off(k, h[k]); this.scale.off("resize", this.onResize, this); setAction(null, this.touch); setSonar(false, false, this.touch); });
    setSonar(prof.sonar, true, this.touch);
  }

  onResize() {
    const cam = this.cameras.main;
    this.back.resize();
    this.vig.setDisplaySize(cam.width, cam.height);
    this.hurt.setSize(cam.width, cam.height);
  }

  update(time, delta) {
    const D = run.D; if (!D || D !== this.D) return;
    const dt = realDt(this), k = this.keys, cam = this.cameras.main;
    let ax = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let ay = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (ax && ay) { ax *= 0.7071; ay *= 0.7071; }
    if (stick.active) { ax = stick.x; ay = stick.y; }
    const frozen = !!D.active;

    this.sub.update(dt, ax, ay, { frozen, cone: D.zone >= 3 ? 1 : 0 });
    // keep the sub in the visible area when the PDA panel covers the bottom of the screen
    cam.setFollowOffset(0, -Math.max(0, (cam.height - (this.sheetTop || cam.height)) / 2));

    const inVent = this.vents.some(v => Math.abs(v.x - this.sub.x) < 70 && this.sub.y > v.y - 160);
    if (tick(dt, inVent)) return;

    for (const s of this.shards) if (s.active && Math.hypot(s.x - this.sub.x, s.y - this.sub.y) < 40) { s.destroy(); reward(CFG.rewards.shardPickup); }

    // creature + hazards
    const cfgC = CFG.creatures;
    if (this.creature) {
      const beast = D.objectives.find(o => o.kind === "beast");
      const bite = this.creature.update(dt, this.sub, { paused: frozen && D.active !== beast, canChase: !beast.done, chaseRange: this.prof.chaseRange, speed: cfgC.chaseSpeed, touch: 60 * this.creature.sprite.scale });
      if (bite && !frozen) { this.sub.knockback(this.creature.x, this.creature.y); if (drain(CFG.oxygen.contactBiteCost)) return; this.ouch(); }
    }
    for (const hz of this.hazards) {
      if (hz.update(dt, this.sub, { paused: frozen, speed: cfgC.hazardSpeed }) === "bite" && !frozen) { this.sub.knockback(hz.x, hz.y, 260); if (drain(CFG.oxygen.hazardBiteCost)) return; this.ouch(); }
    }

    // what can we interact with?
    const near = frozen ? null : this.findNear();
    if (near !== this.near) { this.near = near; setAction(near ? LABEL[near.kind] : null, this.touch); bus.emit("near", near ? LABEL[near.kind] : null); }

    // effects + HUD
    this.sonarCd = Math.max(0, this.sonarCd - dt); this.sonarT = Math.max(0, this.sonarT - dt);
    const sx = this.sub.x - cam.scrollX, sy = this.sub.y - cam.scrollY;
    this.back.update(sx, sy);
    this.drawArrows(cam);
    if (this.mini) this.drawMinimap(cam);
    if (this.beamT > 0) { this.beamT -= dt; this.beam.setAlpha(Math.max(0, this.beamT / 0.45)); }
    const low = D.o2 / maxO2() <= 0.3;
    this.vig.setAlpha(low ? 0.3 + 0.15 * Math.sin(time / 160) : 0);
    const z = ZONES[D.zone];
    D.depth = Math.round(z.depth[0] + clamp(this.sub.y / this.floorY, 0, 1) * (z.depth[1] - z.depth[0]));
    this.hudT -= dt; if (this.hudT <= 0) { this.hudT = 0.12; bus.emit("hud"); setSonar(this.prof.sonar, this.sonarCd <= 0, this.touch); }
  }

  // the closest unfinished objective in reach, or null
  findNear() {
    const D = run.D, cfgC = CFG.creatures; let near = null, best = 1e9;
    for (const o of D.objectives) {
      if (o.done) continue;
      const tx = o.kind === "beast" ? this.creature.x : o.x, ty = o.kind === "beast" ? this.creature.y : o.y;
      const d = Math.hypot(tx - this.sub.x, ty - this.sub.y), range = o.kind === "beast" ? cfgC.engageRange : cfgC.interactRange;
      if (d < range && d < best) { best = d; near = o; }
    }
    return near;
  }

  docked() { return window.innerWidth >= 900; }

  interact() {
    const D = run.D; if (!D || D.active) return;
    this.near = this.findNear(); if (!this.near) return;
    D.active = this.near; D.answered = false;
    if (this.near.kind === "beast") this.creature.state = "fight";
    setAction(null, this.touch);
    bus.emit("encounter-open", this.near);
  }

  afterEncounter(o) {
    if (o.kind === "beast") { if (o.done) this.creature.flee(); else this.creature.calm(); }
    else if (o.done) { this.tweens.killTweensOf(o.ring); o.ring.destroy(); this.tweens.add({ targets: o.sprite, alpha: 0.25, scale: 0.6, duration: 500 }); }
    this.near = undefined;
    if (run.D && allDone(run.D)) bus.emit("toast", "Zone charted! Ascend to claim your bonus.", "gold");
  }

  sonar() {
    if (!this.prof.sonar || this.sonarCd > 0 || (run.D && run.D.active)) return;
    this.sonarCd = 10; this.sonarT = 4;
    const ring = this.add.circle(this.sub.x, this.sub.y, 30).setStrokeStyle(3, 0x5eead4, 1).setDepth(9);
    this.tweens.add({ targets: ring, scale: 30, alpha: 0, duration: 1400, onComplete: () => ring.destroy() });
  }

  fireBeam(target, ok) {
    this.beam.clear().lineStyle(4, ok ? 0x5eead4 : 0xff6b57, 1).beginPath();
    this.beam.moveTo(this.sub.x + 30 * this.sub.face, this.sub.y).lineTo(target.x, target.y).strokePath();
    this.beam.strokeCircle(target.x, target.y, 42);
    this.beamT = 0.45; this.beam.setAlpha(1);
  }

  ouch() {
    this.cameras.main.shake(220, 0.008);
    this.hurt.setAlpha(0.35); this.tweens.add({ targets: this.hurt, alpha: 0, duration: 380 });
  }

  floatText(txt, color) {
    const t = this.add.text(this.sub.x, this.sub.y - 44, txt, { fontFamily: "JetBrains Mono, monospace", fontSize: "18px", fontStyle: "bold", color: color === "gold" ? "#ffcf6b" : "#ff6b57", stroke: "#021018", strokeThickness: 4 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1300, onComplete: () => t.destroy() });
  }

  /* Arrows at the screen edge point to objectives you can't see. Sonar shows all of them; otherwise just the nearest. */
  drawArrows(cam) {
    const g = this.arrows.clear(), D = run.D;
    const left = D.objectives.filter(o => !o.done).map(o => ({ o, x: o.kind === "beast" ? this.creature.x : o.x, y: o.kind === "beast" ? this.creature.y : o.y }));
    left.sort((a, b) => Math.hypot(a.x - this.sub.x, a.y - this.sub.y) - Math.hypot(b.x - this.sub.x, b.y - this.sub.y));
    const show = this.sonarT > 0 ? left : left.slice(0, 1);
    const w = cam.width, h = cam.height, m = 34;
    for (const it of show) {
      const sx = it.x - cam.scrollX, sy = it.y - cam.scrollY;
      if (sx > m && sx < w - m && sy > 70 && sy < h - m) continue;
      const cx = w / 2, cy = h / 2, ang = Math.atan2(sy - cy, sx - cx);
      const ex = clamp(sx, m, w - m), ey = clamp(sy, 80, h - m - 60);
      const col = it.o.kind === "beast" ? 0xff6b57 : it.o.kind === "crate" ? 0xffcf6b : 0x5eead4;
      g.fillStyle(col, 0.95);
      const s = 13;
      g.fillTriangle(ex + Math.cos(ang) * s, ey + Math.sin(ang) * s, ex + Math.cos(ang + 2.5) * s, ey + Math.sin(ang + 2.5) * s, ex + Math.cos(ang - 2.5) * s, ey + Math.sin(ang - 2.5) * s);
    }
  }

  drawMinimap(cam) {
    const g = this.mini.clear(), D = run.D, mw = 190, mh = 64, x0 = cam.width - mw - 16, y0 = 76;
    const fx = v => x0 + (v / this.W) * mw, fy = v => y0 + (v / this.floorY) * mh;
    g.fillStyle(0x021018, 0.75).fillRect(x0, y0, mw, mh).lineStyle(1, 0x5eead4, 0.5).strokeRect(x0, y0, mw, mh);
    g.lineStyle(1, 0xffffff, 0.35).strokeRect(fx(cam.scrollX), fy(cam.scrollY), (cam.width / this.W) * mw, (cam.height / this.floorY) * mh);
    for (const v of this.vents) g.fillStyle(0x9fe7f5, 1).fillRect(fx(v.x) - 2, y0 + mh - 4, 4, 3);
    for (const o of D.objectives) {
      if (o.done) continue;
      const ox = o.kind === "beast" ? this.creature.x : o.x, oy = o.kind === "beast" ? this.creature.y : o.y;
      g.fillStyle(o.kind === "beast" ? 0xff6b57 : o.kind === "crate" ? 0xffcf6b : 0x5eead4, 1).fillCircle(fx(ox), fy(oy), this.sonarT > 0 ? 4 : 3);
    }
    g.fillStyle(0xffffff, 1).fillCircle(fx(this.sub.x), fy(this.sub.y), 3);
  }
}
