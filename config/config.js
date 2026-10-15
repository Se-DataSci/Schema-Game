/* Deep Schema: game configuration
   Change numbers here to rebalance the game. No other file needs to change.
   After editing, run:  python build.py   (rebuilds index.html) */
export const CFG = {
  saveKey: "deep-schema-v1",          // browser storage key; change it to reset everyone's progress

  start: {
    salvage: 60,                      // salvage a new player starts with
    sonar: 1,                         // free sonar charges at the start
    maxCanisters: 2                   // most emergency O2 canisters you can carry
  },

  oxygen: {
    base: 100,                        // max O2 with no upgrades
    tankBonus: 30,                    // added by each O2 tank upgrade
    drainPerSecond: 0.55,             // O2 used per second while swimming in a dive
    drainWithGlider: 0.35,            // ...with the propulsion glider
    ventRefillPerSecond: 18,          // O2 regained per second inside an air vent
    wrongScanCost: 18,                // wrong multiple-choice answer
    wrongPieceCost: 10,               // wrong pile (sort) or wrong block (SQL stack)
    creatureBiteCost: 22,             // wrong answer during a creature fight
    contactBiteCost: 12,              // a creature touching your sub while you explore
    hazardBiteCost: 8,                // a small hazard creature touching your sub
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
    tutorialBonus: 20,
    shardPickup: 3                    // floating data shard you collect by swimming into it
  },

  dive: {
    scansPerDive: 4                   // scan targets per dive (plus 1 salvage crate + 1 creature)
  },

  // Bloom's taxonomy ladder (see src/systems/ladder.js)
  bloom: {
    toLevelUp: 4,                     // net correct answers at your top level to unlock the next (a wrong one takes one away)
    reviewPerDive: 1                  // scan questions per dive drawn from the levels below the one you chose
  },

  // Random creature raids on the seabase while you're there (never during dives or the tutorial).
  raids: {
    firstDelay: [60, 120],            // seconds at the base before the first raid (random in this range)
    interval: [150, 330],             // seconds between raids after that (random in this range)
    minDives: 1,                      // no raids until the player has finished this many dives
    warnSeconds: 25,                  // time to start defending before the creature hits an undefended base
    toWin: 3,                         // correct answers needed to drive the raider off
    shields: 2,                       // wrong answers the base can take before it's breached (+1 with the turret)
    winReward: 35,                    // salvage for repelling a raid (× the zone's depth multiplier)
    lossFraction: 0.15,               // share of banked salvage stolen when the base is breached
    lossCap: 120                      // most salvage a single raid can steal
  },

  // The two versions of the game. "mobile" is picked automatically on phones, "full" on computers.
  // Players can override this in the Dive map settings.
  profiles: {
    mobile: { worldWidth: 2600, worldHeight: 1300, hazards: 1, shards: 4, vents: 1, chaseRange: 300, minimap: false, sonar: false },
    full:   { worldWidth: 4400, worldHeight: 1600, hazards: 4, shards: 10, vents: 2, chaseRange: 440, minimap: true, sonar: true }
  },

  sub: {
    maxSpeed: 230,                    // pixels per second
    acceleration: 520,
    drag: 0.9                         // 0..1, lower = stops faster
  },

  creatures: {
    chaseSpeed: 95,                   // the zone's creature, while chasing you
    hazardSpeed: 70,                  // small hazards
    engageRange: 170,                 // how close you must be to start a fight
    interactRange: 95                 // how close you must be to scan or open a crate
  },

  graphics: {
    phaserCdn: "https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"
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
  { sect: "Base defense" },
  { id: "turret", name: "Perimeter turret", desc: "Adds one base shield when creatures raid the seabase.", cost: 160, kind: "gear" },
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
