/* On-screen controls for touch screens: a thumb-stick (bottom left) and an action button (bottom right).
   On a computer the same actions use the keyboard: WASD/arrows to swim, E or Space to interact, Q for sonar. */
import { $ } from "../core/util.js";
import { bus } from "../core/bus.js";
/* Current thumb-stick vector, read by the scenes every frame. */
export const stick = { x: 0, y: 0, active: false };

let built = false;
export function initControls() {
  if (built) return; built = true;
  const base = $("stick"), knob = $("stickKnob"), act = $("act");
  let id = null, cx = 0, cy = 0;
  const R = 46;
  const move = e => {
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    stick.x = dx / R; stick.y = dy / R; stick.active = Math.hypot(stick.x, stick.y) > 0.12;
  };
  base.addEventListener("pointerdown", e => { id = e.pointerId; base.setPointerCapture(id); const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); e.preventDefault(); });
  base.addEventListener("pointermove", e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; stick.x = stick.y = 0; stick.active = false; knob.style.transform = ""; };
  base.addEventListener("pointerup", end); base.addEventListener("pointercancel", end);
  act.addEventListener("click", () => bus.emit("act"));
  $("sonarBtn").addEventListener("click", () => bus.emit("sonar"));
}

/* Show the stick + action button (touch dives only). */
export function showControls(on, touch) {
  $("stick").hidden = !(on && touch);
  if (!on) { $("act").hidden = true; $("sonarBtn").hidden = true; stick.x = stick.y = 0; stick.active = false; }
}

/* label = "Scan", "Open crate", "Engage" or null when nothing is in range. */
export function setAction(label, touch) {
  const act = $("act");
  if (touch) { act.hidden = !label; if (label) act.textContent = label; }
  else act.hidden = true;
}

export function setSonar(visible, ready, touch) {
  const b = $("sonarBtn");
  b.hidden = !(visible && touch);
  b.disabled = !ready;
}
