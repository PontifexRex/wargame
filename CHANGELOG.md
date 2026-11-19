# Changelog

All notable changes to the **Aethelgard: The Starfall Vaults** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- **Track A (`v0.8.3`–`v0.8.7`)**: Interactive dungeon props & hazards, `Trigger -> Condition -> Action` event graph, environmental storytelling & handcrafted set-pieces, dungeon ecology & acoustic alerts, 10-slot paper-doll & vault modifiers.
- **Track B (`v0.9.4`–`v0.9.10`)**: Shared cross-engine Character Sheet & Paper-Doll module, Tier 2 City Industry (Smeltery, Warehouse, Apothecary), City Blacksmith & Lapidary Workshop, Arcane Academy & Market, Frontier Outposts, Multi-City expansion, and City Defense / Temple of War.
- **Track D (`v0.9.x-sim`)**: Headless progression simulator ("ChronoSim"), time-to-finish calculator, and 1-year pacing engine.
- **Track E (Art Direction & Graphics Foundation)**: Visual pillars discovery, formal Art Bible & UI Design System, Asset Taxonomy & Management Pipeline, Graphics Engine Evaluation (`ADR-0012`), Golden Vertical Slice, and scaled visual migration.

---

## [v0.9.3-dungeon-march] - 2026-11-19

### Added
- **Shared Cross-Engine Bridge (`src/engine/wargameBridge.js`)**:
  - Dedicated `localStorage` handoff protocol (`aethelgard_bridge_handoff_v1`) connecting `wargame.html` and `index.html` while keeping both engines 100% standalone-capable.
  - Structured `wargame_to_dungeon` entry and `dungeon_to_wargame` return envelopes with atomic consumption (`consumeBridgeHandoff`).
- **Multi-Dungeon Overworld Map & Wandering Hostiles (`src/wargame/data/terrain.js`, `src/wargame/engine/pathfinding.js`)**:
  - 4 curated Dungeon Entrance POIs placed across the Overworld frontier (`The Starfall Vaults`, `Sunken Copper Quarry`, `Whispering Mycelium Labyrinth`, `The Molten Forgeworks`).
  - Completing the Adventurers Guild Hall automatically reveals `The Starfall Vaults` in fog-of-war (`STREAM_TOPICS.DUNGEON_DISCOVERED`); scouting uncovers deeper frontier vaults.
  - Deterministic Overworld Wandering Hostiles (`Starfall Raiding Pack`, `Feral Brood Skitterers`, `Astral Cultist Patrol`) spawning outside the safe starting basin.
- **Overworld Skirmishes, March Intents & Cargo Banking (`src/wargame/engine/commandBus.js`, `src/wargame/engine/queues.js`)**:
  - New commands: `CMD_MARCH_TO_DUNGEON`, `CMD_ENTER_DUNGEON`, and `CMD_RESOLVE_DUNGEON_RETURN`.
  - Deterministic Overworld Skirmish resolution (`resolveOverworldSkirmish`): victory awards XP, Gold, and Ore into `unit.cargo`; defeat triggers non-permanent retreat to the City Guild Hall at full HP.
  - **Expedition Return Pipeline**:
    - Floor 1 Ascending Stairs (`<`) and Boss Portals place the Vanguard Party at the Overworld Vault POI carrying extracted `cargo` and automatically queue a timed Return March (`intent: 'return_city'`) back to Oakhaven Bastion, banking spoils on arrival (`STREAM_TOPICS.EXPEDITION_BANKED`).
    - Astral Recall Scrolls (`[R]`) express-teleport the party directly to the City and bank spoils immediately.
    - Dungeon Defeat (Golden Rule #2) express-returns the party directly to the City Adventurers Guild Hall at full HP, credits Vanguard Pact salvage gold, and preserves Hero level/XP/gear.
- **Overworld Canvas & HUD Upgrades (`src/wargame/ui/overworldView.js`, `src/wargame/ui/wargameUiSync.js`, `wargame.html`)**:
  - Renders multiple colored Dungeon Entrances with breach rings, wandering hostiles, gold cargo pack indicators (`💰`), and `IN VAULT` badges.
  - Added Discovered Dungeons quick-march bar (`#wgDiscoveredDungeonsBar`), unit card cargo badge, Breach Dungeon button, and March Home button.
  - Added **Task 12 (`task_return_with_spoils`)** to the Campaign Task DAG.
- **Roguelike Engine Session Integration (`src/engine/state.js`, `src/engine/actions.js`, `src/ui/modals.js`, `src/main.js`)**:
  - Added `wargameSession` schema field with full v1–v6 migration backfill.
  - `index.html` consumes inbound `wargame_to_dungeon` handoffs to descend directly into Floor 1 of the chosen vault, writes return envelopes on extraction/defeat, and surfaces a **"🗺️ Return to Overworld"** button in Outcome Modals.

### Fixed
- **Chained Scheduled Job Execution (`advanceSimulationClock`)**: Upgraded discrete-event clock stepping to process chained jobs (such as multi-step marches) chronologically within a single time jump.
- **Overflow Expedition Spoils Protection (`processResourceProductionTick`)**: City storage caps now cap only passive production gains so dungeon spoils and task rewards are never deleted on subsequent resource ticks.

### Verification
- Added **Test 30** in `src/test/selfTest.js` verifying Wargame-to-Dungeon entry sync, extraction/defeat return envelopes, and v1 migration backfill.
- Added **Tests 7–8** in `src/wargame/test/wargameSelfTest.js` verifying multi-dungeon discovery, wandering hostile skirmishes, `CMD_MARCH_TO_DUNGEON`, `CMD_ENTER_DUNGEON`, extraction return marches + cargo banking, Recall Scroll express returns, and defeat recovery.
- Suite status: **30/30 Roguelike Tests PASS** + **8/8 Wargame Tests PASS** + Headless UI Smoke Suites (`./scripts/test.ps1` and `./scripts/test-wargame.ps1`).

---

## [v0.9.2-city-progression] - 2026-11-19

### Added
- **Tier 1 Building Catalog & Paced Prerequisite Unlocks**:
  - Renamed building catalog: **Meeting Hall**, **Hut**, **Garden**, **Well**, **Lumber Camp**, **Quarry**, **Windmill**, **Adventurers Guild Hall**.
  - Paced sequential prerequisite unlocks: Hut $\rightarrow$ Garden $\rightarrow$ Well $\rightarrow$ Lumber Camp $\rightarrow$ Quarry $\rightarrow$ Windmill $\rightarrow$ Adventurers Guild Hall.
- **Doubling Construction Duration Formula**:
  - Long-term campaign pacing formula ($T(L) = T_0 \times 2^{L-1}$), preventing endgame rush while keeping early gameplay snappy.
- **Meeting Hall Level Cap**:
  - Central Meeting Hall level dictates maximum allowable tier of all city structures, establishing strategic development milestones.
- **Windmill Food Production Synergy**:
  - Spatial synergy granting +25% Food production boost to adjacent gardens and wheat farms.
- **6 City Stockpile Resources & Citizen Sustenance**:
  - Stockpile resources: `wood`, `stone`, `ore`, `gold`, `food`, `water`.
  - Population housing caps and sustenance consumption (1 food and 1 water per 5 citizens per 5s tick).
- **60-Second Hero Recruitment Queue & Vanguard Formation**:
  - Chartering the Adventurers Guild Hall unlocks the 60-second Hero Recruitment queue.
  - Swearing in enqueues training of a chosen class (Fighter, Thief, Mage, Ranger, Paladin) with prorated cancel refunds.
  - Completing training inducts the hero into the Overworld Vanguard Party with dungeon exploration capabilities.

### Verification
- Added Sandboxed Test 6 in `src/wargame/test/wargameSelfTest.js` verifying Tier 1 building prerequisites, doubling duration progression, food/water citizen sustenance, and Meeting Hall level caps.
- Suite status: **29/29 Roguelike Tests PASS** + **6/6 Wargame Tests PASS** + Headless UI Smoke Suites (`./scripts/test.ps1` and `./scripts/test-wargame.ps1`).

---

## [v0.9.1-city-grid] - 2026-11-19

### Added
- **8x8 Spatial Grid & Plot Selection (`src/wargame/data/buildings.js`, `src/wargame/ui/wargameUiSync.js`)**:
  - 64 discrete city plots with central Meeting Hall pre-established at plot index 27 (grid coordinates 3,3).
  - Interactive plot selection (`SELECT_CITY_PLOT`) rendering plot coordinates, elevation, status, and contextual build actions.
- **Timed Building Relocation (`MOVE_BUILDING`)**:
  - Relocate established structures to any vacant plot with real-time relocation timers, preserving building levels.
- **Demolition & Material Salvage (`DEMOLISH_BUILDING`)**:
  - Deliberate building demolition returning 35% material salvage of base construction costs to the city stockpile.
- **3-Slot Multi-Domain Build Queue (`src/wargame/engine/queues.js`)**:
  - Multi-domain queue managing construction, upgrades, moves, demolition, and cleanup.
  - Cancellation refunds: 100% full refund for pending queued jobs; prorated refund + cleanup timer for active in-progress jobs.

### Verification
- Added Sandboxed Tests 4–5 in `src/wargame/test/wargameSelfTest.js` verifying 8x8 spatial city grid, plot selection, relocation, demolition salvage, and 60s hero recruitment queue.
- Suite status: **29/29 Roguelike Tests PASS** + **5/5 Wargame Tests PASS**.

---

## [v0.9.0-wargame] - 2026-11-11

### Added
- **Binary Min-Heap Priority Queue Scheduler (`src/wargame/engine/scheduler.js`)**:
  - Discrete-event scheduler operating in $O(\log N)$ chronological ordering supporting simulation speed multipliers (`1x`, `2x`, `5x`).
  - High-precision scheduled jobs with unique `jobId`, arbitrary metadata, and safe mid-heap cancellation (`removeById`).
- **WorldEventStream Pub/Sub Replay Engine (`src/wargame/engine/eventStream.js`)**:
  - Decoupled in-memory circular ring buffer logging discrete simulation events with monotonic sequence IDs and timestamps.
  - Granular topic subscriptions (`STREAM_TOPICS`: clock, units, cities, queues, tasks) with sequence cursor replay (`getEventsSince(cursor)`).
- **Campaign Start Screen & Strict Settler-First Onboarding (`src/wargame/engine/commandBus.js`)**:
  - Campaign Start Screen with House Name, World Name, Seed Code, and Simulation Speed.
  - Starts in `SETTLER_PIONEER` phase with only a single Pioneer Settler unit on the Overworld grid, 0 cities, and 0 heroes.
  - Strict onboarding contract: blocks premature hero recruitment or guild navigation before a City and Guild Hall exist.
  - Safe non-permanent loss contract: Settler revives safely at the spawn point if lost prior to city founding (`RESPAWN_SETTLER`).
- **Real-Time A* Unit Marching & Interpolation (`src/wargame/engine/pathfinding.js`)**:
  - Real-time unit marching across overworld terrain tiles with terrain movement costs, chronological step intervals, and smooth visual interpolation.
- **Standalone Shell (`wargame.html` & `dist/wargame-bundle.js`)**:
  - Independent HTML entrypoint with live tactical canvas, event chronicle, and top-bar mode switcher to `index.html`.

### Verification
- Built dedicated CLI test runner `scripts/test-wargame.ps1` and unit suite `src/wargame/test/wargameSelfTest.js` (Tests 1–3 PASS).

---

## [v0.8.2-portals] - 2026-11-10

### Added
- **Unified Traversal Engine (`src/engine/interactions.js`, `src/engine/objects.js`, `src/engine/combat.js`)**:
  - Shared traversal component (`components.traversal`) unifying Doors, Stairs (`<`, `>`), and Portals into a consistent transition contract (`endpointType`, `transitionType`, `destination`, `charges`, `collapseOnDeplete`).
  - Seamlessly handles transitions: `instant` (fast travel across charted floors), `rift_jump` (dimensional shortcuts), and `extraction` (surface return).
- **3 Portal Definitions & Multi-Dimensional State Engine (`src/data/definitions.js`)**:
  - `portal_ancient_waypoint`: Ancient celestial monoliths embedded in milestone strata (Floors 5, 10, 15, 20...) that players discover and attune. Unlocks fast-travel across the persistent dungeon floor network.
  - `portal_astral_rift`: Fluctuating dimensional anomalies with finite charges (`charges: 2`). Traversal degrades stability until collapsing into inert cosmic residue and auto-clearing from the floor (`collapseOnDeplete`).
  - `portal_boss_extraction`: Triumphant golden Astral Sanctum Gateway materializing upon defeating major bosses (Colossus, Weaver, Ignis, Vespera), offering immediate safe extraction to Oakhaven.
  - Multi-state axes: `mechanical` (`active`, `dormant`, `collapsed`), `security` (`unlocked`, `sealed`), `discovery` (`revealed`, `unknown`), `power` (`powered`, `unpowered`), `structural`.
- **Ancient Waypoint Network Persistence (`src/data/dungeons.js`, `src/engine/state.js`)**:
  - Persistent `waypoints: {}` dictionary tracked per dungeon in `gameState.dungeons`.
  - Full backward compatibility and automatic back-filling in `migrateSaveData(raw)`.
  - Stepping onto an unknown waypoint auto-discovers and attunes it (`registerDiscoveredWaypoint`).
  - Activating an attuned waypoint (`useStairsAtPlayer`) cycles through all discovered waypoints in the dungeon.
- **Developer Console Phase 2 Spawner (`src/engine/dev.js`)**:
  - Interactive spawner `spawnEntity(type, subId, x, y, state)` and terminal command `spawn <door|portal|key|monster> [subId] [x] [y]`.
  - Supports spawning doors (`wood`, `iron`, `portcullis`, `vault`, `secret`), portals (`waypoint`, `rift`, `extraction`), keys (`iron`, `dwarven`, `celestial`), and monsters/bosses.
- **2D Tactical Canvas & Minimap Visuals (`src/ui/renderer.js`)**:
  - Distinct visual rendering for portals: celestial obelisk monolith with glowing cyan core, swirling violet-pink vortex astral rift with charge pips, and glowing golden tri-pillar boss sanctum gateway.
  - Minimap POI markers for explored portals (cyan for waypoints, purple for rifts, gold for extraction gateways).

### Verification
- Added Sandboxed Test 29 in `src/test/selfTest.js` verifying portal definitions, instance creation, waypoint network registration/fast-travel, astral rift charges & collapse, boss defeat extraction portal spawn & safe extraction, dev console object spawner, and procedural waypoint placement.
- Suite status: **29/29 PASS** + Headless UI Smoke Suite.

---

## [v0.8.1-doors] - 2026-11-10

### Added
- **5 Door Definitions & Multi-Dimensional State Engine (`src/data/definitions.js`, `src/engine/objects.js`)**:
  - Registered 5 distinct door templates: `door_wood_hinged` (sturdy oak with iron bands), `door_iron_reinforced` (riveted iron plates with heavy lock), `door_iron_portcullis` (wrought-iron see-through grate), `door_vault_ancient` (massive celestial dwarven brass & mithril vault door), `door_secret_stone` (chiseled stone wall panel).
  - Multi-state axes: `mechanical` (`open`, `closed`, `jammed`), `security` (`unlocked`, `locked`, `sealed`), `structural` (`intact`, `damaged`, `critically_damaged`, `destroyed`), `discovery` (`revealed`, `unknown`), `power` (`unpowered`, `powered`).
  - Helper query functions: `createDoorInstance`, `isDoorWalkable`, `isDoorOpaque`, `isDoorTraversable`.
- **Environmental Permeability Matrix & Bresenham Raycasting**:
  - Fine-grained permeability axes: `movement`, `lineOfSight`, `light`, `sound`, `projectiles`, `magic`.
  - Tactical Portcullis Permeability: Blocks physical footsteps (`movement: false`), but allows full line of sight (`lineOfSight: true`) and projectile/spell targeting through the iron bars (`projectiles: true`, `magic: true`).
  - Integrated into `hasLineOfSight(floor, x0, y0, x1, y1)` in `src/engine/combat.js` and viewport rendering in `src/ui/renderer.js`.
- **Bump Auto-Open, Key Unlock & Monster Collision**:
  - Walking into an unlocked closed door (`handlePlayerAction`) auto-opens the door and updates its permeability without consuming turn movement onto the tile.
  - Walking into a locked door checks hero inventory for the matching key (`keyTag`). If held, unlocks and opens the door; if missing, provides immediate floating and chronicle feedback (`Locked!`).
  - Monsters in `processTurn` respect door permeability and cannot path through closed doors.
- **Thief Lockpicking, Fighter Bashing & Secret Door Perception**:
  - Thief and high-dexterity characters can pick locks (`pick_lock` action).
  - Destructible doors can be physically bashed (`bash` action). When durability reaches 0, the door transitions to `structural: 'destroyed'`, `mechanical: 'open'`, becoming permanently walkable rubble.
  - Secret stone doors (`door_secret_stone`) spawn with `discovery: 'unknown'`, rendering identically to biome wall masonry. Scouts (Thief/Ranger) and high-perception heroes automatically reveal hidden doors in `detectNearbyTraps`.
- **Procedural Choke Point Placement & Lock-and-Key Placement (`src/engine/procedural.js`)**:
  - Automatically identifies room-corridor doorways (floor tiles bordered by opposing walls) and places doors.
  - Guarded Treasure Vaults (`vaults`) spawn with locked security doors (`door_iron_reinforced` / `door_vault_ancient`) and matching keys placed in accessible exploration rooms outside the vault, strictly preserving progression solvability.
- **2D Tactical Canvas & Minimap Visuals (`src/ui/renderer.js`)**:
  - Custom canvas rendering for all 5 door types: timber oak with iron bands, reinforced steel plates with rivets, iron portcullises with pointed chisel teeth, circular brass dwarven astrolabe dials, glowing cyan runic seam secret doors, swung-open door jambs, and fractured rubble splinters.
  - Doors rendered on minimap with distinct markers (amber for closed, gold for locked vault doors).

### Verification
- Added Sandboxed Test 28 in `src/test/selfTest.js` verifying door definitions, multi-state axes, portcullis vision permeability, bump auto-open, key unlock, Thief lockpicking, Fighter bashing, secret door discovery, and procedural door generation.
- Suite status: **28/28 PASS** + Headless UI Smoke Suite.

---

## [v0.8.0-objects] - 2026-11-09

### Added
- **Object Definition & Runtime Instance Architecture (`src/data/definitions.js`, `src/engine/objects.js`)**:
  - Strict separation between immutable authored templates (`ObjectDefinition`, `ItemDefinition`, `WorldObjectDefinition`) and mutable runtime instances (`RuntimeObject`, `ItemInstance`, `WorldObjectInstance`, `WorldItemPickupInstance`).
  - Extensible component and capability model (`Interactable`, `Usable`, `Equippable`, `Traversable`, `Damageable`, `Destructible`, `Lockable`, `Container`, `TrapBearing`, `Discoverable`, `Permeable`).
  - Spatial floor object layer (`floor.objects` with `getObjectsAt(floor, x, y)`, `addWorldObject`, `removeWorldObject`) decoupling interactive entities from raw scalar terrain tiles.
  - Full RLE and JSON save persistence integration (`compression.js`) with lossless packing and automatic legacy floor object hydration (`hydrateLegacyFloorObjects`).
- **Unified Interaction Pipeline (`src/engine/interactions.js`)**:
  - Standardized `InteractionRequest` $\rightarrow$ composable boolean `Requirement` evaluation (`AND`, `OR`, `NOT`, `hasItemTag`, `hasItemDef`, `minStat`, `minSkill`, `requiredClass`, `objectState`) $\rightarrow$ separated `Cost` deduction $\rightarrow$ atomic `Effect` runner $\rightarrow$ `InteractionResult`.
  - Decoupled domain event emission (`ENGINE_EVENTS.OBJECT_INTERACTION`, `OBJECT_STATE_CHANGED`, `ITEM_PICKED_UP`, `ITEM_DROPPED`).
- **ItemStack Stacking Engine**:
  - Smart stack compatibility (`canItemsStack`, `mergeItemStacks`, `splitItemStack`) allowing consumables, keys, and materials to stack cleanly while strictly preserving unique instance identity for rolled/socketed equipment.
- **Physical Ground Pickups & In-Dungeon Dropping/Gathering**:
  - Dropping an item in a dungeon (`dropItem`) creates a physical `WorldItemPickupInstance` on the dungeon floor.
  - Stepping onto a tile with ground loot automatically collects it into inventory (`pickupGroundObjectsAt`), respecting stacking rules and triggering audio/floating text.
  - Rendered on the 2D tactical canvas with drop-shadow, rarity glow ring, and upfront item type icon (`getItemTypeIcon`).

### Verification
- Added Sandboxed Test 27 in `src/test/selfTest.js` verifying definition/instance separation, spatial floor indexing, item stacking/splitting, requirement/cost execution pipeline, physical pickup creation/resolution, and legacy floor auto-migration.
- Suite status: **27/27 PASS** + Headless UI Smoke Suite.

---

## [v0.7.2-tactical] - 2026-11-08

### Added
- **Tactical Skill Range & Target Preview Reticle (`getSkillTargetingInfo` / `setSkillHover`)**:
  - Non-destructive targeting evaluation checking line-of-sight, Chebyshev/Euclidean distance, floor geometry, and MP affordance without consuming MP or turns.
  - Hovering the tactical skill button (`#btnTacticalSkill`) or pressing `[Q]` when skill criteria are unmet renders a circular reach zone overlay on the 2D canvas with dashed targeting perimeter.
  - Animated pulsing reticle (`TARGET` badge, diamond brackets, crosshairs, and impact splash indicator) locks onto targeted hostiles.
  - Distinct class targeting behaviors: Paladin Holy Smite (adjacent melee focus), Fighter Whirlwind Cleave (360° adjacent reach circle), Mage Starfall Nova (4-tile radiant astral burst), Ranger Starfall Volley (5-tile pierced projectile salvo targeting closest foes), Thief Shadowstep Strike (3-tile line-of-sight leap with glowing `LEAP` destination tile highlight).
- **Overhead Threat & Status Telegraph Badges**:
  - Compact overhead badges displayed on active monsters: `burn` (🔥), `bleed` (🩸), `poison` (🧪), `stun` (💫), `chilled` (❄️), `weakened` (⚡).
  - Adjacent Melee Threat Alert: Animated red warning chevron (`▲`) pulsing overhead on monsters threatening the hero's position.
  - Ranged Aim Laser Lines: Animated crimson dashed targeting lines connecting ranged foes (`isRanged`) to the hero when line-of-sight is unobstructed.
- **Micro-Combat Displacement & Impact Animations**:
  - Smooth directional hero lunge animation displacing the hero sprite toward the target during basic melee attacks and active skills.
  - Animated combat impact effects: dynamic white/amber slash arcs for melee strikes, golden bursting star novas for critical hits, radiant holy bursts for smites, and projectile tracers for ranged combat.
- **Filterable Expedition Chronicle & Deduplication Engine**:
  - 4 Category Filter Tabs on Chronicle card: `All` | `Combat` (⚔️) | `Loot` (💎) | `System` (📜).
  - In-memory event ledger (`chronicleHistory`) storing turn, message, tone, category, and repeat count.
  - Automatic category inference (`inferChronicleCategory`) with regex word-boundary matching.
  - Consecutive identical message deduplication grouping repetitive attack, miss, and mining messages with visual `(xN)` badge to eliminate log clutter.

### Verification
- Added Sandboxed Test 26 in `src/test/selfTest.js` verifying pure non-destructive skill targeting preview across classes, zero-MP validation block, status & threat telegraphs, chronicle category auto-inference, consecutive grouping, and filter switching.
- Suite status: **26/26 PASS** + Headless UI Smoke Suite.

---

## [v0.7.1-art] - 2026-11-07

### Added
- **5 Handcrafted Playable Class Sprites (`drawHeroSprite`)**:
  - Distinct pixel-vector artwork across all 5 classes on the tactical canvas, HUD portrait, Class Select cards, and Inventory Paper-Doll:
    - **Fighter** (Ironclad Vanguard): Horned iron greathelm with glowing amber visor slit, steel cuirass with gold trim, flowing crimson cape, iron heater shield with red heraldic chevron, and steel broadsword with blade fuller.
    - **Thief** (Shadowblade): Deep midnight shadow shroud cape, studded leather doublet with emerald rivets and poison vial pouch, rogue cowl with lower face mask, piercing emerald eyes, reverse-grip serrated poison stiletto, and forward-grip curved assassin dagger.
    - **Mage** (Astral Elementalist): Trailing astral cobalt robes with cyan celestial hem and sash, pointed wizard hat with gold band, shadowed face with sapphire astral eyes, active swirling azure spell-flame orb, and gnarled rowan staff capped with a floating diamond star crystal prism.
    - **Ranger** (Hawkeye Scout): Woodland camo cloak, diagonal leather quiver with feather arrow fletchings, flexible boiled leather tunic with leaf green trim, archer's peaked cowl with hawk feather crest and keen hawk-eyes, curved recurve longbow, and notched steel arrowhead.
    - **Paladin** (Radiant Crusader): Winged greathelm with incandescent golden visor cross, radiant 4-point golden sunburst halo floating above head, polished silver plate mail, white tabard emblazoned with a radiant golden sun cross, towering sun kite shield, and righteous golden warhammer.
- **Class-Defining Paper-Doll Mannequin Stages (`drawPaperDollMannequin`)**:
  - Tailored silhouetted class features on the inventory mannequin: horns & crimson cape (Fighter), peaked cowl tip & shadow shroud (Thief), tall wizard hat cone & swirling mana orb (Mage), archer's cowl with hawk feather & quiver strap (Ranger), and radiant sun halo & sun cross breastplate (Paladin).
- **Interactive Class Select Modal Overhaul (`#classSelectModal`)**:
  - Live `<canvas>` portrait rendering in each archetype card showcasing all 5 classes with their handcrafted vector sprites.
- **2.5D Dungeon Walls & Biome Masonry**:
  - 8px top wall ledge (cap) with specular highlight and separation shadow groove.
  - 24px vertical stone wall face with 2-course running-bond Ashlar brickwork and staggered mortar joints.
  - Distinct biome masonry accents: chiseled dwarven runic mason marks (Dwarven Catacombs), bioluminescent quartz crystal glints in mortar seams (Crystalline Caverns), glowing magma fissures seeping through basalt blocks (Molten Forgeworks), and cosmic stardust void crystal facets (The Vespera Crater).
  - Faceted mineral crystal geodes bursting from walls for all 6 ore types (`TILE_ORE_*`).
- **High-Fidelity Floor Flagstones & Ambient Occlusion Drop-Shadows**:
  - 2x2 stone flagstone pavers per floor tile with recessed mortar lines and deterministic hairline fissures.
  - Real-time ambient occlusion drop-shadows cast onto floor tiles bordering walls to the North (3-tier soft shadow gradient) and West (soft edge shadow).
- **3D Landmark Props**:
  - 4-tier beveled stone staircase with glowing emerald guide runes and ascending beacon portal (`<` / `TILE_STAIRS_UP`).
  - 4-tier subterranean abyss staircase receding into the dark with glowing cyan abyss light (`>` / `TILE_STAIRS_DOWN`).
  - 3D domed banded gilded oak vault chests with padlock (closed) and glittering treasure piles (opened).
  - Stepped runic dais shrines with hovering celestial diamond prisms.

### Verification
- Added Sandboxed Test 25 in `src/test/selfTest.js` verifying 5-class sprite rendering, mock canvas drawing operations, 2.5D wall/shadow contracts across all 4 biomes, and class-defining paper-doll mannequins.
- Suite status: **25/25 PASS** + Headless UI Smoke Suite.

---

## [v0.7.0-ux1] - 2026-11-06

### Added
- **Full Anatomical Character Paper-Doll & Inventory Management Modal (`[I]` / `[C]` / `#inventoryModal`)**:
  - Two-column modal accessible from keyboard hotkeys `[I]` / `[C]`, header, or tactical action bar.
  - Left Column: Visual hero portrait, identity, vitals, core attributes, and **Anatomical Paper-Doll Mannequin Stage** (`#inventoryPaperDollCanvas` + `#inventoryPaperDollGrid`).
    - 6 active slots anatomically placed around the hero: Head (`Helm` 🪖), Torso (`Armor` 🦺), Main Hand (`Weapon` ⚔️), Off-Hand (`Pickaxe` ⛏️), Neck (`Accessory` 💍), Feet (`Boots` 👢).
    - 4 reserved future equipment slots rendered with locked watermarks: Neck/Right (`Amulet` 📿), Wrist/Hands (`Gloves` 🧤), Waist (`Belt` 🎗️), Finger (`Ring` 💍).
    - One-click `✕` unequip button, click-to-inspect, and hover stat comparison tooltips.
  - Right Column: Filterable Bag Gear (`All`, `Weapons`, `Armor`, `Accessories`) and Consumables/Minerals list.
  - Equip / Swap: Instant field equipping of weapons and armor from pack or armory with automatic stat delta recomputation.
  - Unequip: Unequip any worn piece to bag/armory (pickaxes protected from direct unequip).
  - Drop / Discard: Drop unwanted items from the pack.
  - Strict Economy Boundary: Selling/liquidating items for gold strictly prohibited inside dungeons (`!gameState.inGuild`).
- **Upfront Item Type Icons Across All Inventories (`getItemTypeIcon`)**:
  - Immediate visual type identification prefixing item names: `🦺` Armor, `⚔️` Weapon, `🪖` Helm, `👢` Boots, `💍` Accessory/Ring, `⛏️` Pickaxe, `🛡️` Shield, `🧤` Gloves, `📿` Amulet, `🎗️` Belt, `🧪` Healing Tonic, `📜` Astral Recall, `🪨` Ores/Minerals, `◆` Gems.
- **Floating Hover Comparison Tooltip (`#floatingItemTooltip`)**:
  - Glassmorphic floating tooltip triggered on hovering over items in inventory, armory, or paper-doll.
  - Renders upfront item icon, rarity, power score, primary stats with side-by-side green `▲ +X` and red `▼ -Y` deltas comparing directly against equipped item, plus socketed gems and rolled affixes.
- **Corridor Fast-Run (`Shift + Direction` / `runCorridor`) & Numpad Movement**:
  - Holding `Shift + WASD / Arrow` triggers smooth corridor fast-running up to 50 steps.
  - Automatically halts on hostile sighted in FOV, trap spotted, damage taken, landmark reached, adjacent unmined ore vein, or corridor intersection/room.
  - Full Numpad 8-direction movement + `Numpad5` wait.

### Verification
- Added Sandboxed Test 24 in `src/test/selfTest.js` verifying field equip/swap, unequip, drop, in-dungeon selling prohibition, corridor run, upfront item icons, canonical slot definitions, and anatomical paper-doll rendering.
- Suite status: **24/24 PASS** + Headless UI Smoke Suite.

---

## [v0.6.5-dev] - 2026-11-05

### Added
- **Developer Console UI Overlay (`#devConsoleModal`)**:
  - Toggled via backtick (`` ` ``) key, `Ctrl+Shift+D`, or header `#btnToggleDevConsole` badge.
  - Quick-Action Command Bar (Dungeon selector, Floor depth input, Hero level input, Full Heal, Reveal Map, God Mode).
  - Interactive Terminal REPL with persistent session command history (Up/Down arrow key recall).
- **Instant Dungeon Floor Warp (`goto <depth> [dungeonId]` / `warp`)**:
  - Transports hero to any depth (1–999) across all 6 regional dungeons.
  - Safely positions hero on stairs up (`<`) or nearest walkable floor tile.
  - Refreshes viewport, dynamic biome palette, FOV shadowcasting, and minimap.
- **Character Level & Stat Calibration (`level <targetLevel>` & `xp <amount>`)**:
  - Instantly sets hero level (1–100) with proper XP curve recalculation.
  - Awards correct stat points (+2 per level) and talent points (+1 per level).
  - Recomputes derived stats and fully refills HP and MP.
- **Developer Cheats & Utilities**:
  - Full Heal (`heal`): Cleanses debuffs and restores 100% HP/MP.
  - Map Reveal (`reveal` / `map`): Fully uncovers fog-of-war for the current floor chart.
  - God Mode (`god`): Grants complete damage immunity in combat.
- **Programmatic Bridge (`window.Aethelgard.dev`)**:
  - Full API exposure on `Aethelgard.dev` for automated testing and scripting.

### Verification
- Added Sandboxed Test 23 in `src/test/selfTest.js` verifying warp, level scaling, cheats, and REPL.
- Suite status: **23/23 PASS** + Headless UI Smoke Suite.

---

## [v0.6.0-inc6] - 2026-11-04

### Added
- **4 Abyssal Elite Affixes**:
  - `Reflective`: Reflects 25% thorns damage directly back to hero on melee/skill attack.
  - `Chilling`: Inflicts `chilled` status on hit (-15% Dodge, +2 Skill MP costs for 3 turns).
  - `Temporal Warp`: 40% chance on damage to phase-shift/teleport to an adjacent floor tile to break melee engagement.
  - `Volatile`: On-death detonation dealing 150% ATK damage in a 1-tile Chebyshev radius.
- **Abyssal Equipment Affixes**:
  - Added `thorns` (of Retaliation), `leech` (of the Blood Drinker), and `ward` (of Astral Warding) to procedural loot affix tables.
- **6th Curated Dungeon Profile (`abyssal_rift`, `dng_abyss`)**:
  - Infinite 80x60 strata delve featuring cosmic void glass palette (`vespera_crater`), exponential depth scaling (`effDepth`), and recurring bosses every 5 floors beyond Floor 20.
- **Deepest Delve Tracking**:
  - Codex Hall of Records displays deepest floor reached per dungeon, celebrating endless delve milestones.

### Verification
- Added Sandboxed Test 22 in `src/test/selfTest.js`. Suite status: **22/22 PASS** + Headless UI Smoke Suite.

---

## [v0.5.1-inv] - 2026-11-03

### Added
- **Multi-Criteria Armory Sorting**:
  - Sort Vault Armory by Slot/Type, Rarity, Power Score, Gold Value, or Name with persistent UI setting (`gameState.uiSettings.armorySortBy`).
- **Power Score Engine & Visual Upgrade Indicators**:
  - Computed power metric weighting attack, defense, health, mana, crit, dodge, core attributes, sockets, and durability.
  - Renders visual `▲ UPGRADE` badge on superior gear.
- **One-Click `Auto-Equip Best`**:
  - Evaluates highest-performing equipment across all 6 slots and automatically equips superior items while safely cycling old gear back to Vault Armory.
- **Keep / Lock Protection (`item.locked` / `🔒`)**:
  - Granular toggle protecting favored equipment from accidental bulk liquidation in armory cards and inspect modals.
- **Granular Bulk Auto-Sell**:
  - Fast liquidation by rarity tier (`Common`, `Uncommon`, `Rare`) or all unlocked gear with automatic gem socket extraction and Antiquarian Assay bonuses.

### Verification
- Added Sandboxed Test 21 in `src/test/selfTest.js`. Suite status: **21/21 PASS** + Headless UI Smoke Suite.

---

## [v0.5.0-inc5] - 2026-11-02

### Added
- **Schema v6 Save Migration (`aethelgard_save_v6`)**:
  - Full backward migration supporting v1–v5 saves.
- **4 Distinct Visual Biomes by Depth & Curated Profile**:
  - Dwarven Catacombs (Floors 1-5 & Sunken Quarry)
  - Crystalline Caverns (Floors 6-10 & Mycelium Labyrinth)
  - Molten Forgeworks (Floors 11-15 & Molten Crucible)
  - The Vespera Crater (Floors 16-20 & Citadel of the Fallen Star)
  - Dynamic 2D canvas wall fills, caps, bases, accents, torchlight tints, and minimap coloring.
- **5th Curated Regional Dungeon**:
  - The Molten Forgeworks (`molten_crucible`, 96x72, 15 floors) featuring basalt chambers, slag pools, and heavy Mithril/Astral veins.
- **Deep Vault Milestone Bosses**:
  - Floor 15: Ignis, The Forge Tyrant (680 HP, 38 ATK, 20 DEF, Burn, guaranteed Relic equipment + 2 Astralite + Crimson Ruby).
  - Floor 20: Vespera's Avatar, Heart of the Fallen Star (1050 HP, 48 ATK, 26 DEF, Weakened, guaranteed 2-socket Relic equipment + 3 Astralite + Void Diamond).
- **Guild Bestiary Codex & Hall of Records (`gameState.codex`)**:
  - Tracks lifetime monsters slain, bosses fallen, elites vanquished, ores mined, gems unearthed, extractions, defeats, and deepest floor reached per dungeon.
  - Star-Forged Relic discoveries archive logging legendary equipment finds.
  - Hunter's Mastery: Slaying 5 foes of an archetype (or 1 boss) grants permanent +8% Mastery Damage against that archetype.
  - Guild Hub Codex Tab (`#guildTab_codex`) with dynamic stat counters, deepest delvings, relic archive, and bestiary grid.

### Verification
- Added Sandboxed Tests 18, 19, 20 in `src/test/selfTest.js`. Suite status: **20/20 PASS** + Headless UI Smoke Suite.

---

## [v0.4.5-atlas] - 2026-11-01

### Added
- **Schema v5 Save Migration (`v0.4.5-atlas`)**:
  - Lossless RLE floor compression, lazy active-dungeon hydration, world-map coordinate readiness (`worldCoords`), and full v1–v4 migration compatibility.
- **Simultaneous Persistent Multi-Dungeon Registry (`gameState.dungeons`)**:
  - 4 Curated Regional Dungeons: The Starfall Vaults (80x60), Sunken Copper Quarry (48x36), Whispering Mycelium Labyrinth (128x96), Citadel of the Fallen Star (192x144).
  - Interactive Custom Expedition Charter Builder supporting custom Width x Height decoupled from `maxDepth`.
- **$O(\text{Sectors})$ Multi-Wing Procedural Generator**:
  - 4 architectural layout styles (`masonry_vaults`, `excavation_quarry`, `crystalline_caverns`, `grand_ruins`).
  - Pillared courts, 2-tile avenues, loop corridors, Motherlode ore seams, Guarded Treasure Vaults, 12 monster archetypes, and 4 boss archetypes.
- **Exploration-Scale Viewport & Navigation**:
  - $O(21\times 15)$ frustum-culled scrolling camera, Bresenham raycast wall line-of-sight.
  - Live Sidebar Minimap (`#minimapCanvas`) and `[M]` Full-Floor Cartographer's Survey Map Modal (`#fullMapModal`).
  - Safe BFS Click-to-Travel Auto-Walk (interrupts on hostile sight, trap spotted, or damage).

### Verification
- Added Sandboxed Tests 14, 15, 16, 17 in `src/test/selfTest.js`. Suite status: **17/17 PASS**.

---

## [v0.4.0-inc4] - 2026-10-31

### Added
- **Modular ES6 Architecture (`src/`) & Schema v4 Save Migration**:
  - Fully modular codebase decoupled from monolithic HTML.
  - Backward migration compatibility with v1, v2, and v3 saves.
- **5 Uncut Astral Gems**:
  - Ruby of Might, Emerald of the Wind, Sapphire of Will, Topaz of Dawn, Void Diamond.
  - Unearthed from Mithril, Relic Geode, Star-Crystal, and Void Astralite veins.
- **Gem Socketing & Astral Lapidary Bench**:
  - 1 to 2 Gem Sockets on Rare, Epic, and Star-Forged Relic equipment.
  - Inline Item Inspect socketing and extraction.
- **Guild Notice Board Contracts**:
  - 3 procedural contracts per descent (Monster Cull, Geological Quota, Champion/Chest objectives) awarding bonus Vault Gold, Talent Tomes, and rare materials/gems upon extraction.
- **Subterranean Astral Shrines & Runic Traps**:
  - Shrines: Celestial Renewal, Starfire Blessing, Astral Aegis.
  - Runic Spike/Flame Traps spotted via Vision/DEX and safely disarmable by Thieves and Rangers with guaranteed trap-free Pure-Floor BFS paths.

### Verification
- Added Sandboxed Tests 11, 12, 13 in `src/test/selfTest.js`. Suite status: **13/13 PASS**.

---

## [v0.3.1-inc3] - 2026-10-30

### Fixed
- Stabilized Schema v3 save migration and verified backward compatibility with legacy v1 and v2 saves.

---

## [v0.3.0-inc3] - 2026-10-29

### Added
- **6 Mineral Veins**:
  - Copper, Iron, Mithril, Relic Geode, Star-Crystal, Void Astralite.
  - Embedded exclusively in wall tiles bordering floor tiles (non-blocking).
- **6 Dual-Cost Guild Research Trees**:
  - Vault Cartography, Subterranean Geology, Dwarven Toolsmithing, Antiquarian Assay, Quartermaster Requisitions, Vanguard Recovery Pact.
- **Antiquarian Assay Smelting/Selling Counter (`#sell-catalog`)**:
  - Ore appraisal multiplier granting $+35\%/\text{rank}$.
- **Milestone Boss Encounters**:
  - Floor 5: Starfall Colossus.
  - Floor 10: Void Weaver.
  - Dedicated Boss HP HUD.

### Verification
- Added Sandboxed Tests 6–10 in `src/test/selfTest.js`. Suite status: **10/10 PASS**.

---

## [v0.2.0-inc2] - 2026-10-28

### Added
- **Schema v2 Save Migration & JSON Save Sync**:
  - Export, import, and download save data modal.
- **6-Slot Paper-Doll Equipment**:
  - Weapon, Armor, Helm, Boots, Accessory, Pickaxe with live delta comparisons.
- **5-Tier Procedural Rarity Engine**:
  - Common, Uncommon, Rare, Epic, Star-Forged Relic.
- **Training Hall & Talent Trees**:
  - 3-tier class talent trees and gold respec.
- **Combat Mechanics**:
  - Ranged monster AI, Elite Champions (Vampiric, Molten, Venomous, Fortified).
  - Status effects: Burn, Bleed, Poison, Stun.
  - Web Audio procedural sound effects.

### Verification
- Expanded self-tests to cover equipment, rarity, and talent trees.

---

## [v0.1.0-inc1] - 2026-10-27

### Added
- **Tactical 2D Canvas Grid**:
  - 21x15 turn-based tactical canvas with torchlight field-of-view (FOV) and exploration fog-of-war.
- **5 Playable Classes**:
  - Fighter, Thief, Mage, Ranger, Paladin with starter loadouts and active skills (`[Q]`).
- **Persistent Procedural Dungeon Floors**:
  - Persistent `dungeon.floors[depth]` with pure-floor BFS staircase reachability (`<` to `>`).
- **Dual-Economy Extraction**:
  - At-risk Expedition Pack vs. safe Banked Guild Vault via Floor 1 stairs and Recall Scrolls (`[R]`).
- **Automated Verification Suite**:
  - 5/5 automated diagnostic self-test suite.
