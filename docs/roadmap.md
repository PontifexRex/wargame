# Aethelgard: Project Roadmap & Strategic Horizons

> **Current Baseline**: `v0.9.2-city-progression`  
> **Verification Status**: 29/29 Roguelike Baseline Tests PASS + 6/6 Wargame Simulation Tests PASS  
> **Historical Release Notes**: For completed increment release logs, detailed feature breakdowns, and verification gates, refer to [CHANGELOG.md](../CHANGELOG.md).

---

## 1. Long-Term Game Vision & Strategic Pillars

**Aethelgard** is designed as a hybrid **Grand Strategy Wargame, Real-Time City Builder, and Tactical Procedural Dungeon RPG**. While multiplayer and production server infrastructure are deferred until the core game loop is complete, the single-player/local architecture is structured around the full domain model ("Start-With-One, Scale-To-Many": `1 Universe -> 1 World -> 1 Player -> 1 City -> 1 Hero/Party` initially, scaling cleanly to `N`).

### Core Design Principles

1. **True Strategic Wargame with a Definitive Goal**:
   - Worlds have a defined campaign victory condition (~1+ year duration) rather than running aimlessly forever.
   - Winning requires strategy, planning, timed alliance coordination, and tactical combat skill—not just raw stat strength or passive resource hoarding.
   - **Deception & Fog-of-War**: Long-range warfare is deliberate, with low troop intelligence enabling feints/fake attacks and rewarding skilled defenders.

2. **Low-Penalty Honorable War & Divine Reimbursement**:
   - To encourage active warfare rather than turtling, losing a battle carries strategic rather than catastrophic personal consequences.
   - **Favor of the Gods**: Engaging in honorable war grants divine reimbursement and rapid rebuilding support.
   - **Anti-Bullying Scaling**: Rewards scale significantly higher when fighting stronger opponents; attacking much weaker players yields minimal gains.

3. **Playstyle-Aligned Guild Archetypes & Alliances**:
   - **War Guilds**: High-activity, coordinated alliance warfare and territory control.
   - **Adventurers Guilds**: Geared toward solo and small-party dungeon delving, relic discovery, and hero mastery.
   - **Social / Low-Pressure Guilds**: Relaxed cooperative city growth and trade without punitive contribution quotas.
   - Multiple guilds form **Alliances** to win the world; non-aligned specialist guilds can also earn shared victory credit by contributing critical endgame milestones (such as forging a required victory artifact).

4. **Fair, Non-P2W Economy**:
   - Reasonable subscription-first model supplemented by cosmetics, minor conveniences, and optional guild/alliance pool contributions—never dependent on whales.

5. **Hybrid Gameplay Loops (Always Something Meaningful to Do)**:
   - **Real-Time Overworld & Multi-City Management**: Settling cities, managing city building grids, real-time construction queues, harvesting/trading world resources (`Wood`, `Stone`, `Gold`, `Minerals`), and marching parties across the world map.
   - **Turn-Based Procedural Dungeons**: Deep roguelike exploration with Hero-led multi-class parties to acquire rare equipment, artifacts, and experience.
   - **Idle / Upgrade Sub-Systems**: Progressive automation and resource efficiency upgrades interwoven with active play.

6. **Incremental Discovery, Guided Tutorial & Reward Tasks**:
   - Systems unlock progressively so new players are never overwhelmed, guided by optional contextual tutorials and non-linear **Tasks/Missions** that grant early progression rewards.

7. **Pacing, Economy Balance & Simulation-First Tuning ("No Blind Tuning")**:
   - Worlds and campaigns are targeted to span up to a full year (~365 days) of engaging real-time and active progression without running aimlessly forever or burning out.
   - Because construction durations scale exponentially ($2^{L-1}$), population food/water consumption escalates with city size, and research trees/perks compound, small balance tweaks can unintentionally collapse a 1-year design into 3 months—or conversely, create insurmountable starvation deadlocks.
   - All balance changes, speed boosters, tech unlocks, and economy rates must be governed by automated, deterministic simulation tools and player archetype modeling to preserve game balance and pacing.

---

## 2. Active & Upcoming Increment Roadmap

```
Track B (City & Overworld)  ──► Inc 9.3 (Dungeon March) ──► Inc 9.4 (Forge Crafting) ──┐
                                                                                       ├──► Track C (v1.0.x+)
Track D (Tooling & Pacing) ──► Inc 9.5 (ChronoSim Engine & Balance Calculator) ───────┘
```

---

### Track B: Overworld Map, Settler Onboarding, City Builder & Real-Time Loop (`v0.9.x` Series — `ADR-0011`)

*Preceding Increments:*  
- **Increment 9.0 (`v0.9.0-wargame`)**: Real-time simulation engine, min-heap scheduler, Settler-first onboarding, A* marching, and WorldEventStream. *(Verified)*  
- **Increment 9.1 (`v0.9.1-city-grid`)**: 8x8 spatial city grid, plot selection, timed relocation, demolition salvage, and 3-slot queues. *(Verified)*  
- **Increment 9.2 (`v0.9.2-city-progression`)**: Tier 1 building catalog, prerequisite unlocks, doubling times, citizen sustenance, and 60s Hero Recruitment queue. *(Verified)*

#### Increment 9.3 (`v0.9.3-dungeon-march`) — Real-Time Overworld Marching to Dungeons & Transition Pipeline
- **Real-Time March to Dungeons**:
  - Vanguard Party marches across Overworld tiles (~10s/tile) toward discovered Vault entrances.
  - Intercepting wandering hostiles, scouting fog of war, and transition into turn-based tactical delving (`index.html` engine) upon entering the vault portal.
- **Expedition Return & Recovery**:
  - Surface extraction via Floor 1 Stairs places the Vanguard Party at the Overworld Vault Entrance and begins the timed march back to Oakhaven Bastion.
  - Defeat returns the party directly to the City's Adventurers Guild Hall without permanent character or gear loss.

#### Increment 9.4 (`v0.9.4-forge-crafting`) — City Economy Expansion & Guild Star-Forge Runecrafting
- **Expanded City Production Structures**:
  - Advanced producers (**Smeltery** for refined ingots, **Warehouse** for expanded storage caps, **Barracks**, **Temple of War** for Divine War Reimbursement).
- **Guild Star-Forge Runecrafting**:
  - Craft equipment, punch gem sockets, and re-roll affixes using dungeon minerals and city resources.
  - Interlock subterranean mining yield (`Copper`, `Iron`, `Mithril`, `Astralite`) directly with Overworld military production.

---

### Track D: Game Simulation, Macro Balance Calculator & Pacing Engine (`v0.9.5-sim` / Tooling Series)

#### Increment 9.5 (`v0.9.5-sim`) — Headless Progression Simulator, Time-to-Finish Calculator & Balance Modeling Tools
- **Headless Progression Simulator ("ChronoSim" Engine)**:
  - Deterministic discrete-event simulation engine that runs days, weeks, months, or an entire 1-year campaign in milliseconds without rendering UI or waiting for real-time clocks.
  - Simulates the full game loop: population growth, food/water consumption, resource production ticks, build queues (1–3 slots, subscription boosts), tech research, and overworld travel times.
- **Configurable Player Playstyle Archetypes**:
  - *Casual / Low-Activity*: 1–2 check-ins per day, modest queue utilization, natural idle gaps between orders.
  - *Active / Standard*: 3–5 check-ins per day, disciplined queue queuing, balanced focus between city building and dungeon runs.
  - *Hardcore / Min-Max Optimizer*: 24/7 queue uptime, maximum resource reinvestment, aggressive rush strategies.
- **Pacing & Accelerator Impact Calculator ("What-If" Sensitivity Analysis)**:
  - Evaluates macro pacing sensitivity when introducing new features, accelerators, or balance adjustments:
    - e.g., *"If a new Guild research perk grants +15% construction speed, how does overall campaign duration change across all 3 archetypes?"*
    - Prevents feature creep or boosters from accidentally compressing a 1-year target down to 3 months.
- **Bottleneck, Deadlock & Starvation Trap Detection**:
  - Automated invariant checker that alerts if specific resource curves (e.g. stone shortage, food/water drought, worker deficit) cause game-breaking progression deadlocks or irreversible starvation loops.
- **Tooling Deliverables**:
  - **CLI Tool**: `./scripts/simulate-pacing.ps1` (or `node src/wargame/tools/simulatePacing.js`) outputting ASCII timeline charts, milestone timestamps (Time-to-Guild, Time-to-Tier-2, Time-to-Victory), and balance variance reports.
  - **Interactive Balance Calculator**: In-game Dev Console / Admin modal to run parameter sliders and visualize projected player timelines interactively.

---

### Track C: Multi-Hero Parties, Guild Playstyles & Tactical Warfare (`v1.0.x+` Series)

- **Multi-Member Hero Parties**:
  - Parties led by a Hero with multiple class members entering dungeons and tactical battles together.
- **Guild Archetype Specializations**:
  - Distinct configurations and perks for **Adventurers Guilds**, **War Guilds**, and **Social Guilds**.
- **Tactical Overworld Warfare, Alliances & World Victory Arc**:
  - Timed marches, feints/fog-of-war intel, city defense, Divine War Reimbursement, and endgame Alliance victory objectives.

---

## 3. Technical Debt & Architecture Memory

- **ES2017 Compatibility Constraint (`ADR-0001`)**:
  - Strict syntax gate: no optional chaining (`?.`) or nullish coalescing (`??`) in any engine source files to ensure compatibility across all JavaScript runtimes and headless runners.
- **Dual Engine Decoupling**:
  - Turn-based Tactical Roguelike: `index.html` mounted to `src/` modular bundle (`dist/bundle.js`).
  - Real-Time Overworld Simulation: `wargame.html` mounted to `src/wargame/` modular bundle (`dist/wargame-bundle.js`).
- **Unified Save Hydration**:
  - Schema migration contract strictly preserves legacy saves back to `v0.1.0-inc1` with automatic backfilling in `migrateSaveData()`.
- **Quality Gates**:
  - Headless CLI verification runs: `./scripts/test.ps1` (29 roguelike tests) and `./scripts/test-wargame.ps1` (6 simulation tests).
