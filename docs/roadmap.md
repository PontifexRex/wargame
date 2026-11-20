# Aethelgard: Project Roadmap & Strategic Horizons

> **Current Baseline**: `v0.9.7.10-hex-overworld` / `v0.8.3-hazards` / `ADR-0014` (`Stage E.5.5`)  
> **Verification Status**: 33/33 Roguelike Baseline Tests PASS + 16/16 Wargame Simulation Tests PASS  
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
Track F (Priority 1 — Progression Core) ──► Inc 10.1 (Currency/Prereq) ──► 10.2 (Accrual/Queues) ──► 10.3 (Guild/Alliance) ──► 10.4 (Effects/Training) ──► 10.5 (UI/Titles)
Track A (Dungeons & Storytelling)       ──► Inc 8.4 (Triggers) ──► Inc 8.5 (Storytelling) ──► Inc 8.6 (Ecology) ──► Inc 8.7 (10-Slot & Sets)
Track B (City, Pantheon & Overworld)    ──► Inc 9.8 (Market/Academy) ──► 9.8.5 (Pantheon/Gods) ──► 9.8b (Outposts) ──► 9.9 (Multi-City) ──► 9.10 (Defense)
Track C (Multiplayer, Alliances & War)  ──► Authoritative Server, Multi-Hero Parties, Guild/Alliance Projects & §23 Long-Term Progression Backlog (v1.1.x+)
Track D (Tooling & 12-18m Pacing)       ──► ChronoSim 12–18 Month Progression Simulator, RP Economy Forecasting & Balance Calculator
Track E (Art Direction & Mobile UX)     ──► Stage E.6 (Painted Tier 2 Iso/Hex Sprites & Hotspots) ──► Stage E.7 (Research-Backed Mobile UX)
```

---

### Track F *(Immediate Priority 1)*: Unified Progression Core — Currency Ledger, Prerequisite Engine, Effects Framework & Research/Training Prototype (`v0.10.x` Series — [`research_and_training_spec.md`](specs/research_and_training_spec.md) / `ADR-0015`)

*Promoted ahead of Increment 9.8+ so Market, Pantheon/Divine Alignment, Quests, Achievements/Titles, and Multi-City all consume these shared, server-ready foundational services natively. Implemented locally first in pure deterministic JS with server-ready idempotent interfaces.*

*Preceding Increments:*  
- **Increment 10.1 (`v0.10.1-prog-foundation` / `ADR-0015`) — Phase 1 Foundation**: Implemented scaled-integer fixed-precision `CurrencyService` (`0.00001` precision, idempotent auditable ledger, balance reconstruction, unified atomic currency+stockpile payments), nested `AND`/`OR`/`NOT` `ResearchEligibilityService` (with guild/alliance/alignment restriction codes), versioned `ResearchCatalogService` (15 domains, 5 representative prototype trees incl. `WAR_WEAPON_HEAVY_001` & hero training definitions), and `world.progression` state backfill. *(Verified)*
- **Increment 10.2 (`v0.10.2-prog-accrual-queues`) — Phase 2 Accrual & Queues**: Implemented `ResearchAccrualService` (passive offline elapsed-time accrual + event-driven fractional activity awards with idempotency, cooldowns, caps & diminishing returns) and `ResearchQueueService` (configurable free/subscriber queues, definition version snapshots, pause/resume, pending auto-promotion without upfront cost deduction, and configurable cancel refund policies). *(Verified)*
- **Increment 10.3 (`v0.10.3-prog-ownership`) — Phase 3 Guild/Alliance Ownership & Contributions**: Implemented `organizationService.js` cleanly separating Multiplayer Player Guilds (*Adventurers*, *War*, *Artisan*) and Alliances from local City Class Halls, Guild-owned RP accounts & research, multi-member attributed Alliance Research Pools (strictly research-only—no Alliance training), and member departure ownership rules. *(Verified)*

#### Increment 10.4 (`v0.10.4-prog-effects-training`) — Phase 4: Generic Effects Framework & Separate Hero Training Queue
- **Generic Benefits & Effects Engine (`BenefitService`)**:
  - Data-driven effects (`Capability unlock`, `Attribute/Skill/Production/Capacity/Probability/Limit modifier`, `Ability/Access/Recipe unlock`) with deterministic `Additive`, `Multiplicative`, `Set`, `Unlock`, `Disable`, and `Replace` operations and explicit stacking/scope/expiration rules.
  - Strictly separates **Unlocks** (e.g., Personal Research unlocks Heavy Weapon Training) from **Modifiers**.
- **Subject-Specific Hero Training (Separate Training Queue)**:
  - Dedicated **Hero Training Queue** independent of the Personal Research Queue.
  - Individual `TrainingInstance` scoped to `SubjectID` (`Hero A` trains Heavy Weapon Proficiency Lv 1–3 independently of `Hero B`), with clean extensibility for future training subjects (Cities, Units, Constructs).

#### Increment 10.5 (`v0.10.5-prog-ui-milestones`) — Phase 5: Research & Training Hub UI, Milestones, Provenance Titles, Quests & Analytics
- **Dual-Entry Prototype UI (`§18`)**:
  - Top-level **Research & Training Hub** (accessible from main navigation) PLUS contextual shortcuts directly inside town buildings (Class Halls, Academy, Temple).
  - Required views: **Research Overview** (balances, accrual rates, active queues, recent achievements), **Visual Research Tree** (branches, prerequisites, milestones, tree archiving), **Research Detail**, **Research Queue Manager**, **Hero Training Screen**, and **Research History & Analytics**.
- **Milestones, Achievements, Provenance Titles & Trophies (`§16`)**:
  - Intermediate & tree/branch completion milestones; Common, Rare, Unique, World-First, Guild/Alliance, and Humorous/Unusual titles with provenance, world association, and player display control.
- **Tutorial, Quest & Telemetry Integration (`§17`, `§19`)**:
  - 12-step incremental tutorial hooks, recurring research/training quest triggers, 17+ idempotent domain events, and `ResearchAnalyticsService` player/game metrics.

---

### Track A: Tactical Dungeon Delving, Triggers & Storytelling (`v0.8.x` Continuation — `ADR-0010`)

*Preceding Increments:*  
- **Increment 8.0 (`v0.8.0-objects`)**: Foundational Game Object Model, interaction pipeline, item stacking, and ground pickups. *(Verified)*  
- **Increment 8.1 (`v0.8.1-doors`)**: Multi-state door system, permeability matrix, lock-and-key generation, lockpicking, and bashing. *(Verified)*  
- **Increment 8.2 (`v0.8.2-portals`)**: Shared traversal engine, Ancient Waypoint networks, Astral Rifts, and Boss Extraction Gateways. *(Verified)*  
- **Increment 8.3 (`v0.8.3-hazards`)**: Interactive dungeon props (crates, oil barrels, barricades), linked mechanisms (levers -> portcullises, pressure plates -> secret doors), and symmetric hero/monster environmental hazards (oil slicks, molten slag vents, toxic spore clouds). *(Verified)*

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
- **Increment 9.4 (`v0.9.4-shared-hero-sheet`)**: Shared cross-engine Character Sheet & Paper-Doll module (`src/ui/shared/characterSheet.js`), Tier 1 Prestige Cosmetic slots, `#wgCharacterSheetModal` in `wargame.html`, `CMD_EQUIP/UNEQUIP_HERO_ITEM`, and bridge equipment sync. *(Verified)*  
- **Increment 9.5 (`v0.9.5-class-guilds`)**: `ADR-0012` modular building `facilities`, Temple Chapterhouse (`Cleric` Lv 1 → `Paladin` Lv 2+), specialized Class Guilds, City Garrison (`1 + Lv` party size), 3-Hero Roster Cap + Dismiss + Overall Leader, and 200-slot City Vault Storage Container. *(Verified)*  
- **Increment 9.6 (`v0.9.6-city-industry`)**: Tier 2 City Industry — Dwarven Smeltery (`CMD_SMELT_INGOTS`), Alchemist Apothecary (`CMD_BREW_PROVISION`), Warehouse `+50/lv` City Vault slot expansion, and interactive enterable `#wgFacilityModal` interiors for all facility constructs. *(Verified)*  
- **Increment 9.7 (`v0.9.7-city-crafting`)**: City Blacksmith & Star-Forge (`CMD_FORGE_EQUIPMENT`, `CMD_TEMPER_EQUIPMENT`) and Lapidary Workshop (`CMD_PUNCH_SOCKET`, `CMD_SOCKET_CITY_GEM`, `CMD_UNSOCKET_CITY_GEM`) decoupled from Guilds into enterable City Constructs. *(Verified)*
- **Increment 9.7.5 (`v0.9.7.5-guild-parity`)**: Unified Adventurers Guild with all other Class Guilds via the same enterable Building Interior & modular `facilities` pipeline, introduced the dedicated **Adventurer** class (`Torch Flare` skill), and gated specialist class recruitment strictly behind each class's Guild / Temple Chapterhouse. *(Verified)*

#### Increment 9.8 (`v0.9.8-city-academy`) — Arcane Academy & Market Trade Post *(Consumes Track F Engines)*
- **Arcane Academy / Library** *(Enterable City Construct)*: Contextual city gateway into the Track F **Personal Research Trees**, plus local library buildings that apply `BenefitService` RP generation & research speed modifiers.
- **Market / Trade Post** *(Enterable City Construct)*: Appraise/liquidate dungeon relics and surplus ores for Gold, and convert surplus city resources through the Track F **Unified Atomic Payment Interface**.

#### Increment 9.8.5 (`v0.9.8.5-pantheon-alignment`) — Pantheon of Gods, Multi-Tag Divine Alignment & Favor *(Dependent System from `research_and_training_spec.md` §9.3)*
- **Multi-Tag Pantheon Registry**: Define Aethelgard's Pantheon where each God supports multiple flexible categories/tags (never a single hardcoded category), unique domains, and **Divine Favor** currency accounts (`CurrencyService`).
- **Alignment-Driven Eligibility, Modifiers & Blessings**: Wire Divine Alignment into `ResearchEligibilityService` and `BenefitService` so gods unlock exclusive paths (e.g., *Divine Knowledge* & *Priesthood* trees), modify research costs/speeds/accrual, grant active Blessings, and obey configurable alignment-change rules for in-progress research.

#### Increment 9.8b (`v0.9.8b-overworld-frontiers`) — Claimable Overworld Outposts, Scouts & Dynamic Patrols
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

### Track C: Multiplayer Backend, Multi-Hero Parties, Guild/Alliance Organizations & Tactical Warfare (`v1.1.x+` Series)

- **Authoritative Multiplayer Backend & Server-Time Sync**: Migrate Track F's server-ready services (`CurrencyService` ledger, offline RP accrual, `ResearchQueueService`, `ResearchContributionService`) and Overworld simulation from local client storage to an authoritative multiplayer server with concurrent/idempotent transaction safety.
- **Multi-Member Hero Parties**: Parties led by a Hero with multiple class members entering dungeons and tactical battles together.
- **Multiplayer Guild Archetypes & Alliances**: Distinct Player Guild organizations (**Adventurers Guilds**, **War Guilds**, **Artisan Guilds**, **Social Guilds**) owning Guild Research, plus **Alliances** owning Alliance Research (no Alliance training) and endgame Alliance victory objectives.
- **Tactical Overworld Warfare**: Timed marches, feints/fog-of-war intel, city defense, and Divine War Reimbursement.
- **Longer-Term Research & Training Backlog (`research_and_training_spec.md` §23)**:
  - *Advanced Research Discovery*: Hidden trees, clue-based & dungeon/NPC/world-event discovery, knowledge fragments, and shared player discovery.
  - *Cooperative Guild & Alliance Projects*: Multi-stage cooperative research, cross-alliance projects, research competitions, and research-linked World Wonders.
  - *Advanced Queue Automation*: Conditional scheduling, priority rules, queue templates, and cross-subject training plans.
  - *Expanded Training Subjects*: Extend the `TrainingInstance` engine beyond Heroes to train **Cities**, **Military Units**, and **Constructs**, plus hero specialization synergies.
  - *Advanced Progression & Authoring Tools*: Repeatable mastery & world-to-world prestige, mutually exclusive/branching decision paths, and a **Visual Research Tree Editor & Content Validator**.

---

### Track D: Game Simulation, 12–18 Month Macro Balance Calculator & Pacing Engine (`v0.9.x-sim` / Tooling Series)

#### ChronoSim — Headless Progression Simulator, 12–18 Month World Calculator & Balance Modeling Tools
- **Headless Progression Simulator ("ChronoSim" Engine)**:
  - Deterministic discrete-event simulation engine that runs days, weeks, months, or an entire **12–18 month world lifecycle** in milliseconds without rendering UI or waiting for real-time clocks.
  - Simulates the full game loop: population growth, food/water consumption, resource production ticks, build queues, **passive + activity fractional RP accrual, currency inflation, free vs. subscriber research queues, hero training, and guild/alliance contribution dynamics** (`research_and_training_spec.md` §19.2 & §19.4).
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

*Preceding Stages:*  
- **Stage E.1 — Visual Pillars & Art Direction Brief (`docs/art_direction_brief.md`)**: Locked in **Grounded High-Craft Fantasy Realism**, **Dynamic Light-to-Dark Tone**, and **Tiered Visual Fidelity** (Tier 1 Prestige Realism for Hero Profiles & Cosmetics, Tier 2 Modular Tactical Realism for Cities/Dungeons, Tier 3 Elevated Strategic Cartography for Overworld). *(Verified)*
- **Stage E.2 — Formal Art Bible & UI/UX Design System (`docs/art_bible.md`, `docs/ui_design_system.md`)**: Locked in biome & daylight/subterranean color palettes, Guild/Facility interior art specs, 4-layer value/contrast budgets, lighting & shadow grammar, material library, Tier 1 10-layer Paper-Doll & Cosmetic standards, Carved Obsidian Slate & Celestial Gold UI tokens, typography, and component anatomy. *(Verified)*
- **Stage E.3 — Asset Taxonomy, Storage & Management Pipeline (`docs/asset_pipeline.md`, `assets/manifest.json`)**: Established `assets/raw/` vs. `assets/runtime/` hierarchy, 5-segment canonical naming (`<domain>_<category>_<entity>_<variant>_<state>`), Tier 1–3 catalog & memory budgets, Git LFS/CDN storage rules, and initial semantic `assets/manifest.json` registry with procedural fallbacks. *(Verified)*
- **Stage E.4 — Graphics Library & Rendering Engine Evaluation (`docs/adr/ADR-0013-graphics-library-and-rendering-architecture.md`)**: Evaluated PixiJS v8, Phaser 3, Three.js, Godot 4, and Canvas 2D; locked in **PixiJS v8 (WebGL2/WebGPU)** behind a decoupled `RenderAdapter` + `AssetRegistry` boundary, preserving HTML/Tailwind UI chrome and Canvas 2D zero-dependency fallback. *(Verified)*
- **Stage E.5 — "Golden Slice" Visual Vertical Slice (`src/ui/shared/assetRegistry.js`, `src/ui/shared/renderAdapter.js`, `assets/runtime/tier1/`)**: Built semantic `AssetRegistry` + `RenderAdapter`, generated and wired live Tier 1 Golden Slice art (all 12 Town Building Interiors + 4 Hero portraits) through `assets/manifest.json` with graceful procedural fallback and automated manifest validation tests. *(Verified)*
- **Stage E.5.5 — Cross-Platform Navigation Architecture (Screens vs. Popups) & Mobile-First Responsive UX (`wargame.html`, `src/wargame/ui/wargameUiSync.js`, `docs/ui_design_system.md`)**: Implemented universal top-bar **`ⓘ` Screen Info Popup**, unified full-bleed Building Screen for every town structure, Mobile Bottom Thumb-Zone Navigation Bar (`≥ 44×44px` touch targets), collapsible mobile drawers, and responsive Bottom-Sheet modals. *(Verified)*
- **Map Architecture Decision (`docs/adr/ADR-0014-unified-map-architecture-and-grid-projections.md`)**: Locked in **Path A — Shared `MapViewportEngine` (`pixi-viewport` + `@pixi/tilemap`) + Best-in-Class Domain Grid Projections**: **Hexagonal Overworld** (pointy-top axial/cube), **2:1 Isometric City** (rotated square 8×8 plots), and **2.5D Oblique Dungeon** (crisp `90°` masonry). *(Verified)*

#### Stage E.6 — Scaled Asset Production, Painted Isometric Sprites, Diegetic Hotspots & Full Visual Migration
- **Painted Tier 2 Isometric City Building Sprites & Hex Overworld Tiles**: Replace temporary procedural Canvas 2D city/overworld geometry with real painted/rendered Tier 2 isometric building sprites (`city_bldg_<id>_lv<N>_idle`) and Tier 3 hex terrain tiles loaded through `assets/manifest.json` and `PixiJS v8` (`ADR-0013` / `ADR-0014`), plus remaining Tier 1 Hero Portraits (`Mage`, `Cleric`, `Adventurer`).
- Roll out full asset sets (all biomes, Lv 1–5 building visual evolutions, full monster/boss rosters, dynamic lighting/shaders, particle VFX, and unified UI chrome) through the validated asset pipeline.
- **Guild & City Building Interior Artwork**: Add bespoke atmospheric interior backdrop illustrations to every Guild and City Facility screen (Adventurers Guild, Fighters Guild, Thieves Guild, Mages Guild, Rangers Lodge, Temple Chapterhouse, Garrison, Dwarven Smeltery, Alchemist Apothecary, Blacksmith & Star-Forge, Lapidary Workshop, Warehouse) following our `docs/art_direction_brief.md` standards (Grounded High-Craft Fantasy Realism, dynamic warm/whimsical-to-dark lighting).
- **Diegetic Interactive Interior Hotspots (Post-Feature-Freeze)**: Once building functionality is finalized, replace on-screen button grids inside building interiors with clean, immersive **clickable/tappable scene regions** (e.g., tap the Forge in the Smithy to open Weapon Forging, tap the Anvil to Temper, tap the Quest Board for Contracts, tap the Vault Door for Storage) with subtle luminous highlights and mobile-friendly touch targets.

#### Stage E.7 — Target-State Cross-Platform Experience Research & Purpose-Built Mobile UI *(Post Main-Screen Graphics)*
- **Deep Industry UX Research**: Conduct thorough research into best practices for cross-platform and mobile-first strategy/city-builder and tactical roguelike RPGs (touch ergonomics, gesture pan/zoom, compact HUD density, portrait vs. landscape workflows, and screen-vs-popup flows) rather than shrinking desktop layouts.
- **End-to-End Target-State Experience Design**: Once core main-screen graphics (Overworld, City, Dungeon, and Interiors) are more defined, design the complete target-state player experience across every screen so mobile and desktop each feel native, legible, and uncluttered with zero box overflow.
- **Purpose-Built Mobile Implementation**: Rebuild mobile views, touch controls, and responsive modals against the researched target-state blueprint.

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
  - Headless CLI verification runs: `./scripts/test.ps1` (33 roguelike tests) and `./scripts/test-wargame.ps1` (16 simulation tests).
