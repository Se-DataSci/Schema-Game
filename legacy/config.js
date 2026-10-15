/* Deep Schema — game configuration
   Change numbers here to rebalance the game. No other file needs to change.
   After editing, run:  python build.py   (rebuilds dist/deep-schema.html) */
window.DS_CONFIG = {
  saveKey: "deep-schema-v1",          // browser storage key; change it to reset everyone's progress

  start: {
    salvage: 60,                      // salvage a new player starts with
    sonar: 1,                         // free sonar charges at the start
    maxCanisters: 2                   // most emergency O2 canisters you can carry
  },

  oxygen: {
    base: 100,                        // max O2 with no upgrades
    tankBonus: 30,                    // added by each O2 tank upgrade
    swimCost: 6,                      // O2 used moving to each target
    swimCostWithGlider: 3,            // ...with the propulsion glider
    wrongScanCost: 18,                // wrong multiple-choice answer
    wrongPieceCost: 10,               // wrong pile (sort) or wrong block (SQL stack)
    creatureBiteCost: 22,             // wrong answer during a creature fight
    rebreatherMultiplier: 0.66        // mistakes cost this fraction with the Rebreather
  },

  rewards: {
    scanCorrect: 12,
    puzzlePiece: 4,
    creatureHit: 10,
    creatureDefeat: 30,
    zoneClearBase: 40,                // zone bonus = base + perZone × zone index
    zoneClearPerZone: 15,
    depthMultiplierPerZone: 0.3,      // rewards × (1 + zone × this)
    tutorialBonus: 20
  },

  dive: {
    scansPerDive: 4                   // multiple-choice scans per dive (plus 1 puzzle + 1 creature)
  },

  graphics: {
    maxPixelRatio: 1.5,               // canvas resolution cap; lower = faster on weak phones
    adaptiveQuality: true,            // auto-lower quality when frames are slow
    slowFrameMs: 26                   // average frame time that triggers a quality drop
  },

  // Sub Bay cosmetics. Each slot is its own table; the item's position in its slot is its id (0 = default, free).
  // "req" = creature id that must be repelled first.
  cosmetics: {
    paint: [
      { id: "std", name: "Standard Issue", price: 0, desc: "Factory yellow." },
      { id: "camo", name: "Kelp Camo", price: 60, desc: "Blends into the shallows." },
      { id: "coral", name: "Coral Red", price: 80, desc: "Bright reef red." },
      { id: "teal", name: "Abyss Teal", price: 80, desc: "Deep-water teal." },
      { id: "stealth", name: "Midnight Stealth", price: 150, desc: "Matte black with a glowing seam." },
      { id: "blueprint", name: "Blueprint Schema", price: 220, desc: "Drafted on a design grid." },
      { id: "levi", name: "Leviathan Scale", price: 300, req: "leviathan", desc: "Repel the Anomaly Leviathan to unlock." },
      { id: "gold", name: "Gold Plated", price: 400, desc: "For students who've earned it." }
    ],
    decal: [
      { id: "none", name: "No decal", price: 0, desc: "Clean hull." },
      { id: "stripes", name: "Racing Stripes", price: 40, desc: "Two speed stripes." },
      { id: "teeth", name: "Shark Teeth", price: 70, desc: "Painted jaws on the nose." },
      { id: "key", name: "Primary Key", price: 90, desc: "Unique and never NULL." },
      { id: "chain", name: "Foreign Key Chain", price: 120, desc: "Linked to its parent table." },
      { id: "select", name: "SELECT * Graffiti", price: 60, desc: "A bad habit, worn ironically." }
    ],
    light: [
      { id: "std", name: "Halogen", price: 0, desc: "Warm white headlight." },
      { id: "cyan", name: "Cyan Scanner", price: 70, desc: "Cool scanner glow." },
      { id: "ruby", name: "Ruby Beam", price: 70, desc: "Deep red light." },
      { id: "toxic", name: "Toxic Green", price: 70, desc: "Radioactive vibes." },
      { id: "rainbow", name: "Rainbow Cycle", price: 260, desc: "Cycles through every color." }
    ],
    trail: [
      { id: "bubbles", name: "Bubbles", price: 0, desc: "Standard exhaust." },
      { id: "sparkle", name: "Sparkles", price: 110, desc: "Glittering wake." },
      { id: "ribbon", name: "Neon Ribbon", price: 130, desc: "A glowing light trail." },
      { id: "bits", name: "Binary Stream", price: 150, desc: "Leaves a wake of 0s and 1s." }
    ],
    fin: [
      { id: "none", name: "No attachment", price: 0, desc: "Stock frame." },
      { id: "antenna", name: "Antenna Beacon", price: 50, desc: "Blinking comms mast." },
      { id: "tail", name: "Tail Fins", price: 60, desc: "Sharper steering fins." },
      { id: "thrusters", name: "Side Thrusters", price: 120, desc: "Glowing booster pods." },
      { id: "claw", name: "Robo Claw", price: 160, desc: "A grabber arm for salvage." }
    ]
  },

  // Fabricator items. kind: hull | gear | sonar | canister | module. "req" = item needed first.
  shop: [
  { sect: "Hull" },
  { id: "hull2", name: "Pressure Hull Mk II", desc: "Rated to 450 m. Opens Grassy Dunes and Crystal Caves.", cost: 150, kind: "hull", lvl: 2 },
  { id: "hull3", name: "Pressure Hull Mk III", desc: "Rated to 1,000 m. Opens Glowshroom Forest and Wreck Field.", cost: 380, kind: "hull", lvl: 3, req: "hull2" },
  { id: "hull4", name: "Pressure Hull Mk IV", desc: "Rated to 2,000 m. Opens Thermal Vents and the Abyssal Trench.", cost: 720, kind: "hull", lvl: 4, req: "hull3" },
  { sect: "Survival gear" },
  { id: "tank1", name: "High-capacity O₂ tank", desc: "+30 max oxygen.", cost: 90, kind: "gear" },
  { id: "tank2", name: "Ultra-capacity O₂ tank", desc: "+30 more max oxygen.", cost: 240, kind: "gear", req: "tank1" },
  { id: "rebreather", name: "Rebreather", desc: "Mistakes cost one third less oxygen.", cost: 150, kind: "gear" },
  { id: "glider", name: "Propulsion glider", desc: "Swimming between targets uses half the oxygen.", cost: 110, kind: "gear" },
  { sect: "Consumables" },
  { id: "sonar", name: "Sonar charges ×3", desc: "Ping during a scan to rule out one wrong answer.", cost: 45, kind: "sonar" },
  { id: "canister", name: "Emergency O₂ canister", desc: "Refills you to half when you'd black out. Carry up to 2.", cost: 70, kind: "canister" },
  { sect: "Seabase modules" },
  { id: "dome", name: "Observatory dome", desc: "A glass dome on the habitat.", cost: 120, kind: "module" },
  { id: "growbed", name: "Grow bed", desc: "Glowing kelp farm beside the base.", cost: 70, kind: "module" },
  { id: "moonpool", name: "Moonpool", desc: "A docking bay for your sub.", cost: 180, kind: "module" },
  { id: "beacon", name: "Beacon tower", desc: "A blinking light reaching for the surface.", cost: 50, kind: "module" },
  { id: "scanroom", name: "Scanner room", desc: "A sonar dish that sweeps the reef.", cost: 100, kind: "module" }
]
};
