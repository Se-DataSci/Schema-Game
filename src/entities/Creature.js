/* The zone's creature (a bad database practice) and small drifting hazards.
   Creatures patrol near their lair, chase you when you get close, and bite on contact. */
import { ensureCreature } from "../art/textures.js";
export class ZoneCreature {
  constructor(scene, id, x, y, scale = 1) {
    const key = ensureCreature(scene, id);
    this.scene = scene; this.id = id;
    this.sprite = scene.add.sprite(x, y, key, 0).play(key + "-anim").setDepth(6).setScale(scale);
    this.home = { x, y }; this.state = "patrol"; this.t = Math.random() * 10; this.invuln = 0;
  }
  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  /* Returns "bite" on the frame it touches the sub. */
  update(dt, sub, o) {
    if (this.state === "gone" || this.state === "flee") return null;
    this.t += dt; this.invuln = Math.max(0, this.invuln - dt);
    const d = Math.hypot(sub.x - this.x, sub.y - this.y);
    if (o.paused) return null;
    if (this.state === "patrol" && o.canChase && d < o.chaseRange) this.state = "chase";
    else if (this.state === "chase" && d > o.chaseRange * 1.6) this.state = "patrol";
    let tx, ty, sp;
    if (this.state === "chase") { tx = sub.x; ty = sub.y; sp = o.speed; }
    else if (this.state === "fight") { tx = sub.x + 150 * (this.x > sub.x ? 1 : -1); ty = sub.y; sp = 120; }
    else { tx = this.home.x + Math.cos(this.t * 0.4) * 130; ty = this.home.y + Math.sin(this.t * 0.7) * 50; sp = 55; }
    const dx = tx - this.x, dy = ty - this.y, dd = Math.hypot(dx, dy);
    if (dd > 2) { const step = Math.min(dd, sp * dt); this.sprite.x += (dx / dd) * step; this.sprite.y += (dy / dd) * step; }
    this.sprite.setFlipX(this.state === "fight" ? sub.x > this.x : dx > 0);
    if (this.state !== "fight" && d < o.touch && this.invuln <= 0) { this.invuln = 1.6; return "bite"; }
    return null;
  }

  flash() { this.sprite.setTintFill(0xffffff); this.scene.time.delayedCall(120, () => this.sprite.clearTint()); }
  lunge(sub) {
    const dx = sub.x - this.x;
    this.scene.tweens.add({ targets: this.sprite, x: this.x + dx * 0.5, duration: 160, yoyo: true, ease: "Quad.easeOut" });
  }
  flee() {
    this.state = "flee";
    this.scene.tweens.add({ targets: this.sprite, x: this.x + 900, y: this.y - 260, alpha: 0, duration: 1400, ease: "Quad.easeIn", onComplete: () => { this.state = "gone"; this.sprite.setVisible(false); } });
  }
  calm() { this.state = "patrol"; this.invuln = 2.5; }
}

export class Hazard {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "jelly", 0).play("jelly-swim").setDepth(6).setScale(0.9);
    this.home = { x, y }; this.t = Math.random() * 10; this.invuln = 0;
  }
  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  update(dt, sub, o) {
    this.t += dt; this.invuln = Math.max(0, this.invuln - dt);
    if (o.paused) return null;
    const d = Math.hypot(sub.x - this.x, sub.y - this.y);
    let tx = this.home.x + Math.cos(this.t * 0.3) * 160, ty = this.home.y + Math.sin(this.t * 0.5) * 80, sp = 40;
    if (d < 220) { tx = sub.x; ty = sub.y; sp = o.speed; }
    const dx = tx - this.x, dy = ty - this.y, dd = Math.hypot(dx, dy);
    if (dd > 2) { const step = Math.min(dd, sp * dt); this.sprite.x += (dx / dd) * step; this.sprite.y += (dy / dd) * step; }
    if (d < 42 && this.invuln <= 0) { this.invuln = 1.4; return "bite"; }
    return null;
  }
}
