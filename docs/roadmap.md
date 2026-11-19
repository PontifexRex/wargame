# Aethelgard: Project Roadmap & Strategic Horizons

> **Current Baseline**: `v0.9.3-dungeon-march`  
> **Verification Status**: 30/30 Roguelike Baseline Tests PASS + 8/8 Wargame Simulation Tests PASS  
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

```text
Track A (Dungeons & Storytelling)  ──► Inc 8.3 (Hazards) ──► Inc 8.4 (Triggers) ──► Inc 8.5 (Storytelling) ──► Inc 8.6–8.7
Track B (Overworld & City Builder) ──► Inc 9.4 (Shared Hero Sheet) ──► Inc 9.5 (Industry) ──► Inc 9.6 (Crafting) ──► Inc 9.7–9.10
Track C (Parties & Grand Warfare)  ──► Multi-Hero Parties, Guild Archetypes, Alliances & Campaign Victory Arc (v1.1.x+)
Track D (Tooling & Pacing)         ──► ChronoSim Headless Progression Simulator & 1-Year Balance Calculator (v0.9.x-sim)
Track E (Art Direction & Graphics) ──► Stage E.1 (Pillars) ──► E.2 (Art Bible) ──► E.3 (Asset Pipeline) ──► E.4 (Engine Eval) ──► E.5–E.6
```

---

### Track A: Tactical Dungeon Delving, Triggers & Storytelling (`v0.8.x` Continuation — `ADR-0010`)

*Preceding Increments:*  
- **Increment 8.0 (`v0.8.0-objects`)**: Foundational Game Object Model, interaction pipeline, item stacking, and ground pickups. *(Verified)*  
- **Increment 8.1 (`v0.8.1-doors`)**: Multi-state door system, permeability matrix, lock-and-key generation, lockpicking, and bashing. *(Verified)*  
- **Increment 8.2 (`v0.8.2-portals`)**: Shared traversal engine, Ancient Waypoint networks, Astral Rifts, and Boss Extraction Gateways. *(Verified)*

#### Increment 8.3 (`v0.8.3-hazards`) — Interactive Dungeon Props, Mechanisms & Environmental Hazards
- **Linked Mechanisms**: Authorable **Levers, Pull-Chains & Pressure Plates** controlling Iron Portcullises and concealed Secret Vaults.
- **Destructible Props & Cover**: Barrels, supply crates, and wooden barricades that interact with combat, movement, and line-of-sight.
- **Tactical Terrain Hazards**: Oil slicks, molten slag vents, and toxic spore clouds that affect both heroes and monsters equally.

#### Increment 8.4 (`v0.8.4-triggers`) — Dungeon Trigger & Event Graph Engine (`Trigger -> Condition -> Action`)
- **Event Graph Framework**: Authorable dungeon triggers (`onEnterRoom`, `onOpenContainer`, `onPullMechanism`, `onEntitySlain`, `onTurnElapsed`) bound to composable boolean conditions and atomic world actions.
- **Dynamic Dungeon Scripting**: Unlock sealed doors, spring tactical ambushes, collapse corridors, spawn guardians, mutate floor tiles, or emit narrative chronicle beats cleanly through the object interaction pipeline.

#### Increment 8.5 (`v0.8.5-storytelling`) — Environmental Storytelling, Lore Objects & Handcrafted Set-Pieces
- **Narrative Object Types**: Readable **Lore Tablets**, **Fallen Explorer Journals**, **Dwarven Murals**, **Cursed Altars**, **Locked Reliquaries**, and **Abandoned Campfires**.
- **Hybrid Procedural + Handcrafted Set-Pieces**: Bespoke room templates (e.g., *Collapsed Mining Drift*, *Last Stand Chamber*, *Astral Ritual Sanctum*) stamped into procedural floors with pre-wired triggers, clues, and environmental details.

#### Increment 8.6 (`v0.8.6-ecology`) — Dungeon Ecology, Sound Propagation & Multi-Phase Encounters
- **Monster Squad Roles**: Distinct tactical AI roles (pack flankers, ranged hexers, shieldbearers, support healers).
- **Acoustic / Noise Propagation**: Loud actions (bashing a door, volatile explosions) alert monsters in adjacent chambers; Thief/Ranger stealth rewards ambush critical multipliers.
- **Telegraphed Multi-Phase Encounters**: Ground-telegraphed boss/guardian abilities and phase shifts powered by the Inc 8.4 Trigger/Event engine.

#### Increment 8.7 (`v0.8.7-sets-modifiers`) — Full 10-Slot Paper-Doll, Gear Sets & Vault Modifiers
- **10-Slot Anatomical Paper-Doll**: Activate the 4 reserved equipment slots (**Amulet, Gloves, Belt, Ring**) alongside 2-piece and 4-piece dungeon gear set bonuses.
- **Vault Modifiers & Cursed Contracts**: Optional pre-entry modifiers (*Blood Moon*, *Dense Fog*, *Rich Veins*, *Ironman*) trading heightened danger for multiplied ore, gem, and relic drop rates.

---

### Track B: Overworld Map, Settler Onboarding, City Builder & Real-Time Loop (`v0.9.x` Series — `ADR-0011`)

*Preceding Increments:*  
- **Increment 9.0 (`v0.9.0-wargame`)**: Real-time simulation engine, min-heap scheduler, Settler-first onboarding, A* marching, and WorldEventStream. *(Verified)*  
- **Increment 9.1 (`v0.9.1-city-grid`)**: 8x8 spatial city grid, plot selection, timed relocation, demolition salvage, and 3-slot queues. *(Verified)*  
- **Increment 9.2 (`v0.9.2-city-progression`)**: Tier 1 building catalog, prerequisite unlocks, doubling times, citizen sustenance, and 60s Hero Recruitment queue. *(Verified)*  
- **Increment 9.3 (`v0.9.3-dungeon-march`)**: Multi-dungeon Overworld discovery, wandering hostile skirmishes, real-time march to vaults, cross-engine `wargameBridge` handoff (`wargame.html` ↔ `index.html`), extraction return march + cargo banking, Recall Scroll express return, and defeat recovery. *(Verified)*

#### Increment 9.4 (`v0.9.4-shared-hero-sheet`) — Shared Cross-Engine Character Sheet & Paper-Doll Module
- **Unified Character View**: Extract the anatomical Paper-Doll, inventory, floating stat comparison tooltips, and talent sheet into a shared UI/engine module usable natively inside **both** `wargame.html` (Overworld, City, Guild, Blacksmith, Lapidary) and `index.html` (Dungeon).
- **Synchronized Hero State**: Equip, unequip, inspect, and manage Hero loadouts seamlessly before marching out to a vault or while delving inside one.

#### Increment 9.5 (`v0.9.5-city-industry`) — Tier 2 City Industry: Smeltery, Warehouse & Apothecary
- **Smeltery** *(Enterable City Construct)*: Refines raw dungeon ores (`Copper`, `Iron`, `Mithril`, `Astralite`) into forged ingots/alloys required for Tier 2 buildings and crafted equipment.
- **Warehouse**: Substantially expands City resource storage caps per level and safeguards stockpiles.
- **Apothecary** *(Enterable City Construct)*: Brews **Healing Tonics**, **Antidotes**, and scribes **Astral Recall Scrolls** using city provisions and dungeon reagents to stock Hero Parties before expeditions.

#### Increment 9.6 (`v0.9.6-city-crafting`) — City Blacksmith (Star-Forge) & Lapidary Workshop
- **Blacksmith / Star-Forge** *(Enterable City Construct)*: Forge weapons, armor, helms, boots, and upgraded pickaxes from smelted ingots; reforge affixes and repair gear.
- **Lapidary Workshop** *(Enterable City Construct)*: Cut raw Astral Gems, punch Gem Sockets into Rare/Epic/Relic equipment, and socket/extract gems.
- **Architectural Separation**: Decouples equipment forging and gem socketing out of the Adventurers Guild (which remains focused on Hero recruitment, parties, bounties, and Bestiary Codex) into dedicated upgradeable City Constructs.

#### Increment 9.7 (`v0.9.7-city-academy`) — Arcane Academy (Research) & Market Trade Post
- **Arcane Academy / Library** *(Enterable City Construct)*: Hosts dual-cost City & Expedition Research trees (Cartography, Geology, Metallurgy, Logistics, Construction Efficiency).
- **Market / Trade Post** *(Enterable City Construct)*: Appraise/liquidate dungeon relics and surplus ores for Gold, and convert surplus city resources at dynamic exchange rates.

#### Increment 9.8 (`v0.9.8-overworld-frontiers`) — Claimable Overworld Outposts, Scouts & Dynamic Patrols
- **Frontier Outposts**: Claim and fortify Overworld resource nodes (Timber Groves, Mason Quarries, Astral Monoliths) for passive regional yield.
- **Reconnaissance**: Train **Outrider Scouts** for rapid fog-of-war exploration and construct **Watchtowers** for permanent vision radii.
- **Living Frontier**: Dynamic hostile patrol routes with territory aggro and respawn timers.

#### Increment 9.9 (`v0.9.9-multi-city`) — Settler Training, Multi-City Expansion & Trade Caravans
- **Settler Recruitment**: Train new Pioneer Settlers at a Level 3+ Meeting Hall to establish Bastion Cities #2..N across the Overworld.
- **Inter-City Logistics**: Multi-city switcher UI and real-time **Resource Caravans** marching between friendly cities.

#### Increment 9.10 (`v0.9.10-city-defense`) — Barracks, City Walls & Temple of War
- **Fortifications & Garrison**: Barracks and City Walls providing garrison forces, fortification ratings, and defense against frontier raids.
- **Temple of War**: Implements **Divine Favor & Honorable War Reimbursement** (`ADR-0011`), granting rebuilding support after intense battles.

---

### Track C: Multi-Hero Parties, Guild Playstyles & Tactical Warfare (`v1.1.x+` Series)

- **Multi-Member Hero Parties**: Parties led by a Hero with multiple class members entering dungeons and tactical battles together.
- **Guild Archetype Specializations**: Distinct configurations and perks for **Adventurers Guilds**, **War Guilds**, and **Social Guilds**.
- **Tactical Overworld Warfare, Alliances & World Victory Arc**: Timed marches, feints/fog-of-war intel, city defense, Divine War Reimbursement, and endgame Alliance victory objectives.

---

### Track D: Game Simulation, Macro Balance Calculator & Pacing Engine (`v0.9.x-sim` / Tooling Series)

#### ChronoSim — Headless Progression Simulator, Time-to-Finish Calculator & Balance Modeling Tools
- **Headless Progression Simulator ("ChronoSim" Engine)**:
  - Deterministic discrete-event simulation engine that runs days, weeks, months, or an entire 1-year campaign in milliseconds without rendering UI or waiting for real-time clocks.
  - Simulates the full game loop: population growth, food/water consumption, resource production ticks, build queues (1–3 slots, subscription boosts), tech research, and overworld travel times.
- **Configurable Player Playstyle Archetypes**:
  - *Casual / Low-Activity*: 1–2 check-ins per day, modest queue utilization, natural idle gaps between orders.
  - *Active / Standard*: 3–5 check-ins per day, disciplined queue queuing, balanced focus between city building and dungeon runs.
  - *Hardcore / Min-Max Optimizer*: 24/7 queue uptime, maximum resource reinvestment, aggressive rush strategies.
- **Pacing & Accelerator Impact Calculator ("What-If" Sensitivity Analysis)**:
  - Evaluates macro pacing sensitivity when introducing new features, accelerators, or balance adjustments to prevent accidentally compressing a 1-year campaign down to 3 months.
- **Bottleneck, Deadlock & Starvation Trap Detection**:
  - Automated invariant checker alerting if resource curves (stone shortage, food/water drought, worker deficit) cause progression deadlocks or irreversible starvation loops.
- **Tooling Deliverables**:
  - **CLI Tool**: `./scripts/simulate-pacing.ps1` outputting ASCII timeline charts, milestone timestamps, and balance variance reports.
  - **Interactive Balance Calculator**: In-game Dev Console / Admin modal to run parameter sliders and visualize projected player timelines interactively.

---

### Track E: Visual Foundation, Art Direction, Asset Pipeline & Rendering Architecture

*Starts from a blank slate using studio best practices—defining visual pillars, art governance, asset management, and rendering engine selection **before** investing in scaled asset production.*

#### Stage E.1 — Visual Pillars, Aesthetic Exploration & Reference Direction
- Conduct structured art-direction discovery independent of current prototype visuals.
- Define core visual pillars, tone/atmosphere, camera projection & perspective (e.g., painterly top-down, 2.5D oblique, isometric, or HD-2D), silhouette readability rules across zoom levels, and target benchmark references.

#### Stage E.2 — Formal Art Bible & UI/UX Design System (`docs/art_bible.md`, `docs/ui_design_system.md`)
- Author the single source of truth for visual craft: color theory & biome palettes, value/contrast separation (terrain vs. props vs. units vs. VFX), lighting/shadow grammar, material language (stone, timber, brass, starlight), typography hierarchy, HUD ergonomics, and shared component design tokens.

#### Stage E.3 — Asset Taxonomy, Storage & Management Pipeline (`docs/asset_pipeline.md`)
- Define the complete **Asset Catalog & Production Spec** across all domains (Overworld, City, Dungeon, Characters, Monsters, Objects/Props, VFX, UI Icons, Audio).
- Establish studio asset governance:
  - Source vs. runtime directory hierarchy (`assets/raw/` authoring files vs. `assets/runtime/` optimized exports).
  - Canonical naming convention (`<domain>_<category>_<entity>_<variant>_<state>`).
  - Storage & versioning strategy (Git LFS / external asset bucket, optimization budgets, resolution/DPI standards, sprite-sheet / texture-atlas packing specs).
  - Semantic **`assets/manifest.json`** registry so engine code loads assets strictly by semantic ID rather than hardcoded file paths.

#### Stage E.4 — Graphics Library & Rendering Engine Evaluation (`ADR-0012`)
- Evaluate rendering libraries and game engines against the Art Bible and Asset Pipeline requirements (e.g., **PixiJS / WebGL2**, **Phaser**, **Three.js / HD-2D**, or **Godot / WebGPU**) via targeted technical spikes.
- Strictly preserve our **Decoupled Simulation-First Engine** boundary so game rules, state, and tests remain independent of the visual renderer.

#### Stage E.5 — "Golden Slice" Visual Vertical Slice
- Build one complete, top-tier visual vertical slice (1 Overworld biome chunk + 1 City building cluster + 1 Dungeon chamber + 1 Hero + 1 Monster + UI chrome) through the real asset pipeline and chosen renderer to validate look, feel, and 60fps performance before scaling up.

#### Stage E.6 — Scaled Asset Production & Full Visual Migration
- Roll out full asset sets (all biomes, Lv 1–5 building visual evolutions, full monster/boss rosters, dynamic lighting/shaders, particle VFX, and unified UI chrome) through the validated asset pipeline.

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
  - Headless CLI verification runs: `./scripts/test.ps1` (30 roguelike tests) and `./scripts/test-wargame.ps1` (8 simulation tests).
