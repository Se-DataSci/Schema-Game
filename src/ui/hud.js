/* Top bar: zone + depth, oxygen, salvage. */
import { $ } from "../core/util.js";
import { S, maxO2 } from "../core/state.js";
import { ZONES } from "../data/content.js";
import { run } from "../systems/dive.js";
export function drawHud() {
  const D = run.D;
  if (D) {
    const z = ZONES[D.zone];
    $("hZone").textContent = D.tutorial ? "Training dive" : z.name;
    $("hDepth").textContent = (D.depth || z.depth[0]).toLocaleString() + " m";
    $("hO2").hidden = false;
    const pct = Math.round((100 * D.o2) / maxO2());
    $("hO2v").textContent = Math.ceil(D.o2) + " / " + maxO2();
    $("hO2f").style.width = pct + "%";
    $("hO2").classList.toggle("low", pct <= 30);
    $("hCash").textContent = "+" + D.carried;
    $("hCashSub").textContent = "Carried";
  } else {
    $("hZone").textContent = "Seabase · Kelp Shallows";
    $("hDepth").textContent = "12 m";
    $("hO2").hidden = true;
    $("hCash").textContent = S.banked.toLocaleString();
    $("hCashSub").textContent = "Salvage";
  }
}
