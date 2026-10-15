/* Entry point: loads the save, starts Phaser, and connects the UI to the scenes. */
import { S, load, persist } from "./core/state.js";
import { bus } from "./core/bus.js";
import { $ } from "./core/util.js";
import { newDive, run } from "./systems/dive.js";
import { raid, tickRaids, startRaid } from "./systems/raid.js";
import { ui, render } from "./ui/sheet.js";
import { tut } from "./ui/tutorial.js";
import { initControls } from "./ui/controls.js";
import { BootScene } from "./scenes/BootScene.js";
import { BaseScene } from "./scenes/BaseScene.js";
import { DiveScene } from "./scenes/DiveScene.js";
load();
if (S.tut !== "done") tut.step = "welcome";
initControls();

const game = new Phaser.Game({
  // "full" = WebGL (glow, tinted trails); "lite" = plain canvas, faster on weak devices
  type: S.settings.graphics === "lite" ? Phaser.CANVAS : Phaser.AUTO,
  parent: "game",
  backgroundColor: "#021018",
  scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
  render: { antialias: true, powerPreference: "high-performance" },
  audio: { noAudio: true },
  scene: [BootScene, BaseScene, DiveScene]
});

bus.on("ready", () => {
  render();
  // Title screen: the Start button only switches on once the game has actually booted.
  window.__dsReady = true;
  const btn = $("startBtn"), splash = $("splash");
  if (window.__dsEarlyError) { window.__dsFail(window.__dsEarlyError); return; }
  btn.disabled = false; btn.textContent = "Start game";
  btn.onclick = () => { splash.hidden = true; render(); };
  btn.focus();
});

// The docked (wide-screen) layout shrinks the game area; tell Phaser when that changes.
let lastDock = null;
bus.on("layout", () => {
  const d = document.body.classList.contains("docked");
  if (d !== lastDock) { lastDock = d; requestAnimationFrame(() => game.scale.refresh()); }
});

bus.on("start-dive", (zone, tutorial) => {
  newDive(zone, tutorial);
  ui.mode = "dive"; ui.near = null;
  game.scene.stop("Base");
  game.scene.start("Dive");
  render();
});

bus.on("dive-ended", () => {
  ui.mode = "result";
  game.scene.stop("Dive");
  game.scene.start("Base");
  render();
});

window.addEventListener("resize", () => render());

// Raid clock: counts only while the tab is visible and the player is idle at the seabase (no tutorial).
setInterval(() => { if (!document.hidden) tickRaids(ui.mode === "base" && !tut.step && $("splash").hidden); }, 1000);

// One-time hint if the game is running slowly with full effects.
setInterval(() => {
  if (S.settings.graphics === "lite" || S.settings.slowHint || !game.loop || game.loop.frame < 200) return;
  if (game.loop.actualFps < 24) { S.settings.slowHint = true; persist(); bus.emit("toast", "Running slow? Switch Graphics to Lite on the Dive map.", "gold"); }
}, 5000);

/* Read-only hooks for the automated tests in /tests. */
window.__ds = {
  get S() { return S; }, get run() { return run; }, get raid() { return raid; }, startRaid, get ui() { return ui; }, get tut() { return tut; }, game,
  get sub() { const sc = game.scene.isActive("Dive") ? game.scene.getScene("Dive") : game.scene.getScene("Base"); return sc && sc.sub ? { x: sc.sub.x, y: sc.sub.y, face: sc.sub.face, zoom: sc.sub.zoom } : null; },
  scene(name) { return game.scene.getScene(name); }
};

