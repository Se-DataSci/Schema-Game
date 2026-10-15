/* One question, drawn the same way everywhere (scans, creature fights, base raids):
   the Bloom level badge, the question and its code, then either answer buttons or a typed-answer box.
   After answering, the feedback says what you answered, what the right answer is, and why. */
import { LEVELS } from "../data/bloom.js";
import { esc } from "../core/util.js";
const LETTERS = "ABCD";

export const levelBadge = q => {
  const L = LEVELS[q.lv];
  return L ? `<span class="bloom b${q.lv}" title="${esc(L.verb)}">Level ${q.lv} · ${esc(L.name)}</span>` : "";
};

/* titles: { ok, bad } headings for the feedback box. */
export function feedbackHtml(q, res, titles = {}) {
  if (res.ok) return `<div class="fb good"><b>${esc(titles.ok || "Correct")}</b><p class="why">${esc(q.why)}</p></div>`;
  const yours = q.t === "blank" ? (res.given || "(left blank)") : q.opts[res.given];
  return `<div class="fb bad"><b>${esc(titles.bad || "Not quite")}</b>
    <p class="fbrow"><span class="lbl">You answered</span><span>${esc(yours)}</span></p>
    <p class="fbrow"><span class="lbl">Correct answer</span><span class="ans">${esc(q.a)}</span></p>
    <p class="why"><b>Why:</b> ${esc(q.why)}</p></div>`;
}

export function questionHtml(q, res, titles) {
  let body;
  if (q.t === "blank") {
    body = res
      ? `<div class="typed ${res.ok ? "right" : "wrong"}"><span class="lbl">Your answer</span><b>${esc(res.given || "(left blank)")}</b></div>`
      : `<form class="blank" data-blank><input class="blankin" name="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="btn" type="submit">Check</button></form>
         <p class="muted small hint">Capitals and spacing don't matter.</p>`;
  } else {
    body = `<div class="opts">${q.opts.map((o, k) => {
      const cls = res ? (o === q.a ? "right" : k === res.given ? "wrong" : "dim") : k === q.gone ? "gone" : "";
      return `<button class="opt ${cls}" data-opt="${k}" ${res || k === q.gone ? "disabled" : ""}><span class="k">${LETTERS[k]}</span><span>${esc(o)}</span></button>`;
    }).join("")}</div>`;
  }
  return `<div class="qmeta">${levelBadge(q)}</div><div class="q">${esc(q.q)}</div>${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ""}${body}${res ? feedbackHtml(q, res, titles) : ""}`;
}

/* onAnswer(given): given is an option index, or the typed text for a blank. */
export function wireQuestion(root, q, onAnswer) {
  if (q.res) return;
  root.querySelectorAll("[data-opt]").forEach(b => (b.onclick = () => onAnswer(+b.dataset.opt)));
  const form = root.querySelector("[data-blank]");
  if (form) {
    const input = form.querySelector("input");
    form.onsubmit = e => { e.preventDefault(); onAnswer(input.value.trim()); };
    setTimeout(() => input.focus(), 30);
  }
}
