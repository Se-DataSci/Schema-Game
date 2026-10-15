/* Toast messages along the top of the screen. */
import { $ } from "../core/util.js";
let timer;
export function toast(msg, cls = "") {
  const t = $("toast");
  t.textContent = msg; t.className = "toast " + cls; t.style.opacity = 1;
  clearTimeout(timer); timer = setTimeout(() => (t.style.opacity = 0), 1800);
}
