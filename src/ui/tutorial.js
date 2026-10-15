/* The guided tutorial: a short walkthrough of the seabase plus a training dive.
   coach() runs after every panel render and shows the right tip for what's on screen. */
import { S, persist } from "../core/state.js";
import { $ } from "../core/util.js";
import { bus } from "../core/bus.js";
import { isTouch } from "../core/device.js";
import { run } from "../systems/dive.js";
export const tut = { step: null };   // null = off

export function coach(ui, render) {
  const box = $("coach");
  document.querySelectorAll(".spot").forEach(el => el.classList.remove("spot"));
  if (!tut.step) { box.hidden = true; return; }
  const sh = $("sheet"), touch = isTouch();
  const spot = el => { if (typeof el === "string") el = document.querySelector(el); if (el) el.classList.add("spot"); };
  const swim = touch ? "Drag the thumb-stick (bottom left) to swim" : "Use WASD or the arrow keys to swim";
  const press = word => (touch ? `tap ${word}` : `press E to ${word.toLowerCase()}`);
  let text = "", btns = "", step = "";
  const baseStep = ["welcome", "cash", "controls", "map"].includes(tut.step);
  if (ui.mode === "base" && baseStep && ui.tab !== "dive") { ui.tab = "dive"; return render(); }

  if (tut.step === "welcome") { step = "1/6"; text = "Welcome to Deep Schema. You're stranded on an ocean planet, and the only way to survive is to know your database design. Every question here comes from your ITSC 3160 lectures."; btns = next("cash"); }
  else if (tut.step === "cash") { step = "2/6"; spot(".cash"); text = "This is your salvage, the game's money. You earn it with correct answers and spend it on gear and sub cosmetics."; btns = next("controls"); }
  else if (tut.step === "controls") { step = "3/6"; text = touch ? "Your sub goes where you steer it. Here at the base, tap the water to swim somewhere. In a dive you'll get a thumb-stick." : "Your sub goes where you steer it. Use WASD or the arrow keys (or click the water). Try it now."; btns = next("map"); }
  else if (tut.step === "map") { step = "4/6"; spot(sh.querySelector('[data-zone="0"]')); text = "Each depth zone is one lecture, from Intro to Databases down to Normalization. Clear a zone to unlock the next. Let's start with a short training dive."; btns = `<button class="btn small" data-tut="dive">Start training dive</button>`; }
  else if (ui.mode === "dive" && run.D && run.D.tutorial) {
    step = "5/6";
    const D = run.D, o = D.active, nextObj = D.objectives.find(x => !x.done);
    if (o && o.kind === "scan") { if (!D.answered) { spot(sh.querySelector(".opts")); text = "Read the question and tap the answer you think is right. Right answers earn salvage. Wrong ones cost oxygen, but you'll always see the correct answer and why."; } else { spot(sh.querySelector('[data-enc="close"]')); text = "That's a scan. Tap Back to exploring."; } }
    else if (o && o.kind === "crate") { spot(sh.querySelector(o.solved ? '[data-enc="close"]' : ".chips")); text = o.solved ? "Crate emptied. Tap Back to exploring." : "Salvage crate: tap an item, then tap the pile it belongs in. A wrong pile costs a little oxygen."; }
    else if (o && o.kind === "beast") { spot(sh.querySelector(o.done ? '[data-enc="close"]' : ".hp")); text = o.done ? "You drove it off. Tap Back to exploring." : "The red bars are its health. Each correct answer knocks one off. A wrong answer lets it bite."; }
    else if (!nextObj) { spot(sh.querySelector('[data-act="claim"]')); text = "Training complete! Tap Ascend and claim bonus to bank everything."; }
    else if (nextObj.kind === "scan") { spot("#hO2"); text = `${swim} to the glowing data drive. If it's off screen, follow the arrow at the edge. When you're close, ${press("Scan")}. Keep an eye on your oxygen at the top.`; }
    else if (nextObj.kind === "crate") { text = `Next, swim to the gold salvage crate and ${press("Open crate")}.`; }
    else { text = `A Redundancy Leech! Creatures chase you and bite if they touch you, which costs oxygen. Get close and ${press("Engage")} to fight it with answers.`; }
  }
  else if (tut.step === "tres" && ui.mode === "result") { step = "5/6"; spot(sh.querySelector('[data-act="home"]')); text = "Ascending banks everything you carried. If you black out instead, you lose half. Head back to the seabase."; }
  else if (tut.step === "fab" && ui.mode === "base") { step = "6/6"; if (ui.tab !== "fab") { ui.tab = "fab"; return render(); } spot(sh.querySelector('[data-buy="hull2"]')?.closest(".item")); text = "The Fabricator is where you spend salvage. Pressure hulls open deeper zones. Bigger tanks and the Rebreather keep you alive longer."; btns = next("bay"); }
  else if (tut.step === "bay" && ui.mode === "base") { step = "6/6"; if (ui.tab !== "bay") { ui.tab = "bay"; return render(); } spot(sh.querySelector(".rec")); text = "The Sub Bay sells cosmetics. Your sub is stored like a database row, and each cosmetic slot is a foreign key. Tap any item to preview it."; btns = next("bank"); }
  else if (tut.step === "bank" && ui.mode === "base") { step = "6/6"; if (ui.tab !== "bank") { ui.tab = "bank"; return render(); } spot(sh.querySelector('[data-tab="bank"]')); text = "The Databank saves every concept you scan correctly and every creature you meet. Read it before the exam."; btns = next("go"); }
  else if (tut.step === "go" && ui.mode === "base") { step = "Done"; if (ui.tab !== "dive") { ui.tab = "dive"; return render(); } spot(sh.querySelector('[data-zone="0"]')); text = "You're ready. Dive into the Kelp Shallows to start Lecture 1. You can replay this tutorial from the Dive map."; btns = `<button class="btn small" data-tut="done">Got it</button>`; }
  else { box.hidden = true; return; }

  box.innerHTML = `<div class="who"><span>PDA guide</span><span>${step}</span></div><p>${text}</p><div class="row">${btns}<span class="grow"></span><button class="skip" data-tut="skip">Skip tutorial</button></div>`;
  box.hidden = false;
  box.querySelectorAll("[data-tut]").forEach(b => b.onclick = () => {
    const n = b.dataset.tut;
    if (n === "skip" || n === "done") { tut.step = null; S.tut = "done"; persist(); render(); return; }
    if (n === "dive") { tut.step = "diving"; bus.emit("start-dive", 0, true); return; }
    tut.step = n; render();
  });
}

const next = step => `<button class="btn small" data-tut="${step}">Next</button>`;

/* When the training dive ends, move on to the result step. */
bus.on("dive-ended", () => { if (tut.step === "diving") tut.step = run.result && run.result.kind === "tutorial" ? "tres" : "fab"; });
