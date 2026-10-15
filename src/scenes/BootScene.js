/* Paints the shared textures once, then opens the seabase. */
import { ensureCommon } from "../art/textures.js";
import { bus } from "../core/bus.js";
export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() {
    ensureCommon(this);
    this.scene.start("Base");
    bus.emit("ready");
  }
}
