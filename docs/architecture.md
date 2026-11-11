# Technical Architecture & Schema Contracts

- **Entrypoint**: `index.html` + `src/main.js` (with `dist/bundle.js` fallback for `file://` & headless CLI verification)
- **Current Release Baseline**: `v0.8.1-doors` (`28/28` automated self-tests passing)
- **Current Schema Version**: `v0.5.0-inc5` (Schema v6)
- **LocalStorage Key**: `aethelgard_save_v6` (with automatic migration from `aethelgard_save`, `aethelgard_save_v2`, `aethelgard_save_v3`, `aethelgard_save_v4`, and `aethelgard_save_v5`)
- **Architecture Decision Records**: See `docs/adr/README.md` (`ADR-0001` through `ADR-0011`)

---

## 1. Modular ES6 Layout & Dual Bootloader (`ADR-0001`)

The codebase is organized into 29 ES6 modules under `src/` with zero external npm dependencies:

- **`src/constants.js`**: `SCHEMA_VERSION`, `STORAGE_KEY`, viewport constants (`VIEWPORT_WIDTH = 21`, `VIEWPORT_HEIGHT = 15`, `TILE_SIZE = 32`), default map dimensions (`DEFAULT_MAP_W = 80`, `DEFAULT_MAP_H = 60`), Tile IDs, Rarity multipliers, `CODEX_MASTERY_KILLS = 5`, and `CODEX_MASTERY_DMG_MULT = 1.08`.
- **`src/data/`** *(Pure static registries — zero imports from `engine/` or `ui/`)*:
  - `classes.js`: 5 playable classes (`fighter`, `thief`, `mage`, `ranger`, `paladin`).
  - `talents.js`: 15 class talent nodes (`TALENT_TREES`).
  - `items.js`: Equipment prefixes/suffixes (`AFFIX_POOL`), `ELITE_AFFIXES`, Quartermaster `SHOP_ITEMS`, canonical `SLOT_METADATA`, and `getItemTypeIcon`.
  - `ores.js`: 6 mineral definitions (`ORE_CATALOG`, `MINERAL_IDS`).
  - `gems.js`: 5 Astral Gems (`GEM_CATALOG`), 3 Shrines (`SHRINE_CATALOG`), and 2 Runic Traps (`TRAP_CATALOG`).
  - `bounties.js`: Procedural Notice Board bounty generator (`buildProceduralBountySet`).
  - `research.js`: 6 dual-cost Guild Research trees (`RESEARCH_PROJECTS`).
  - `monsters.js`: 12 regular monster archetypes + 6 milestone bosses (`MONSTER_ARCHETYPES`, `BOSS_ARCHETYPES` including `boss_ignis` and `boss_vespera`).
  - `dungeons.js`: 6 Regional Dungeon Profiles (`CURATED_DUNGEON_PROFILES` including `molten_crucible` and `abyssal_rift`), Map Size Tiers (`small` to `colossal`), Layout Styles, 4 Visual Biomes (`BIOME_PALETTES`), and `resolveFloorBiome`.
- **`src/engine/`** *(Pure game state, procedural generation, combat, and domain events — zero imports from `ui/`)*:
  - `rng.js`: Deterministic `mulberry32` PRNG, `hashSeedString`, and `weightedPick`.
  - `compression.js`: RLE row compression (`packFloorForStorage` / `hydrateFloorFromStorage`) (`ADR-0003`).
  - `events.js`: Synchronous Domain Event Bus (`ENGINE_EVENTS`, `onEngineEvent`, `offEngineEvent`, `emitEngineEvent`) (`ADR-0006`).
  - `state.js`: `gameState`, `createDefaultGameState`, `migrateSaveData`, `recomputeHeroDerivedStats`, `saveGame`, `loadGame`, `ensureCodexState`, `getCodexMasteryMultiplier`, and `recordRelicUnlock`.
  - `procedural.js`: Macro-Sector & Cellular Automata floor generator with biome stamping, `Int32Array` BFS validator (`verifyPureFloorBFS`), and procedural equipment/socket generator (`ADR-0004`).
  - `combat.js`: Turn loop (`handlePlayerAction`, `processTurn`), wall-blocking Bresenham LOS, monster AI archetypes, boss relic drops, Hunter's Mastery damage scaling, class skills, `getSkillTargetingInfo`, and `runCorridor`.
  - `actions.js`: Interactive mining, Lapidary gem socketing, Notice Board bounties, Multi-Dungeon Atlas switching/chartering, shrines/traps, extraction, field equip/unequip/drop, and non-permanent defeat recovery.
  - `devConsole.js`: Programmatic developer console engine (`gotoFloor`, `setHeroLevel`, `fullHeal`, `revealMap`, `toggleGodMode`, `execDevCommand`) (`ADR-0009`).
  - `audio.js`: Procedural Web Audio API synthesizer (`playSound`, `toggleAudio`).
- **`src/ui/`** *(Canvas 2D & DOM presentation)*:
  - `renderer.js`: `21x15` scrolling camera frustum, 5 handcrafted class sprites (`drawHeroSprite`), 2.5D Ashlar wall masonry & drop-shadows, dynamic biome palettes, FOV shadowcasting (`updateFOV`), skill targeting reticle overlay, status/threat telegraphs, and combat animations (`ADR-0005`).
  - `domSync.js`: Guild Hub tabs (Quartermaster, Assay, Lapidary, Research, Notice Board, Expedition Atlas, and Codex & Records), Dungeon HUD synchronizer, and filterable/deduplicated Chronicle log.
  - `modals.js`: Custom backdrop modals (`#classSelectModal`, `#inventoryModal` with anatomical paper-doll mannequin, `#itemInspectModal`, `#diagnosticsModal`, `#saveSyncModal`, `#outcomeModal`, `#floatingItemTooltip`).
  - `devConsoleUI.js`: Interactive Developer Console modal & terminal REPL (`#devConsoleModal`).
  - `input.js`: Keyboard shortcuts (`WASD`/Arrows, Numpad, `Shift+Direction` corridor fast-run, `Q`, `I`/`C`, `H`, `R`, `E`, `M`, `Space`, `` ` ``), hover scanner, and safe BFS click-to-autowalk (`ADR-0005`).
- **`src/test/`**:
  - `selfTest.js`: 26 cumulative sandboxed self-tests (`runSelfTests`) + Chaos Fuzzer (`runChaosFuzzer`).
  - `cliRunner.js`: Headless verification harness executed by `scripts/test.ps1` via Windows `chakra.dll` (`ES2017`).

---

## 2. Sandboxed State Injection Pattern (`ADR-0002`)

Every state-mutating engine function accepts `state = gameState` as its final parameter:

```javascript
export function mineTile(x, y, state = gameState) { ... }
export function executeClassSkill(state = gameState) { ... }
export function socketGemIntoItem(location, slotOrIndex, socketIdx, gemId, state = gameState) { ... }
export function selectActiveDungeon(dungeonId, state = gameState) { ... }
export function chartNewDungeon(options = {}, state = gameState) { ... }
export function handleHeroDefeat(killerName = 'Abyssal Guardian', state = gameState) { ... }
```

**Rule**: Side effects (DOM updates, audio, `saveGame()`, and `emitEngineEvent(..., state)` when `state !== gameState`) only fire when `state === gameState` (or when a test explicitly subscribes with `includeSandboxes = true`).

---

## 3. Master State Schema (`v0.4.5-atlas`)

```json
{
  "version": "v0.4.5-atlas",
  "turn": 0,
  "inGuild": true,
  "audioEnabled": true,
  "nextItemUid": 100,
  "activeDungeonId": "dng_starfall_crater",
  "maxCharteredDungeons": 6,
  "hero": {
    "name": "Fighter",
    "classId": "fighter",
    "level": 1,
    "xp": 0,
    "maxXp": 60,
    "statPoints": 0,
    "bonusStats": { "str": 0, "dex": 0, "int": 0, "vit": 0 },
    "hp": 186, "maxHp": 186, "mp": 59, "maxMp": 59,
    "atk": 28, "def": 16, "crit": 12, "dodge": 8, "visionRadius": 5,
    "talentPoints": 1,
    "talentsAllocated": { "f_a1": 1 },
    "consumables": { "potions": 2, "recalls": 1 },
    "equipment": {
      "weapon":    { "uid": "w_start_f", "slot": "weapon", "rarity": "common", "sockets": 0, "socketedGems": [] },
      "armor":     { "uid": "a_start_f", "slot": "armor", "rarity": "common", "sockets": 0, "socketedGems": [] },
      "helm":      { "uid": "h_start_f", "slot": "helm", "rarity": "common", "sockets": 0, "socketedGems": [] },
      "boots":     { "uid": "b_start_f", "slot": "boots", "rarity": "common", "sockets": 0, "socketedGems": [] },
      "accessory": { "uid": "acc_start_f", "slot": "accessory", "rarity": "common", "sockets": 0, "socketedGems": [] },
      "pickaxe":   { "uid": "pick_start_f", "slot": "pickaxe", "rarity": "common", "curDur": 30, "maxDur": 30, "sockets": 0, "socketedGems": [] }
    },
    "expeditionPack": [],
    "expeditionGear": [],
    "statuses": [],
    "usedDivineIntervention": false,
    "x": 4, "y": 4
  },
  "dungeons": {
    "dng_starfall_crater": {
      "id": "dng_starfall_crater",
      "name": "Starfall Crater",
      "profileId": "starfall_crater",
      "seedCode": "STAR-4821",
      "seedInt": 19482104,
      "currentFloor": 1,
      "maxDepthReached": 1,
      "config": {
        "sizeTier": "medium",
        "width": 84,
        "height": 60,
        "layoutStyle": "standard",
        "maxFloors": 999,
        "difficultyTier": 1,
        "monsterPool": ["goblin_scavenger", "cave_crawler", "kobold_miner", "deep_cultist", "iron_golem", "void_stalker"],
        "oreWeights": { "copper": 100, "iron": 85, "mithril": 55, "geode": 45, "starcrystal": 30, "astralite": 18 }
      },
      "floors": {}
    }
  },
  "dungeon": "<Alias pointer to state.dungeons[state.activeDungeonId]>",
  "guildVault": {
    "gold": 35,
    "copper": 0, "iron": 0, "mithril": 0, "geode": 0, "starcrystal": 0, "astralite": 0,
    "gems": { "ruby": 0, "sapphire": 0, "emerald": 0, "topaz": 0, "voidstone": 0 },
    "armory": []
  },
  "guildResearch": {
    "cartography": 0, "geology": 0, "toolsmithing": 0, "assay": 0, "quartermaster": 0, "vanguard": 0
  },
  "guildBounties": {
    "Contracts": []
  }
}
```

---

## 4. Save Migration & Multi-Dungeon RLE Persistence (`ADR-0003`)

- **`migrateSaveData(raw)`**: Upgrades saves from `v0.1.0-inc1` through `v0.4.0-inc4` into `v0.4.5-atlas`, preserving legacy `21x15` single-dungeon saves inside `dungeons.dng_starfall_crater` while registering the additional Regional Dungeons (`Sunken Reliquary`, `Pyroclast Fissure`, `Abyssal Citadel`).
- **RLE Storage Compaction**: Before writing to `localStorage`, `saveGame()` compacts all inactive floors via `compactFloorForStorage(floor)` so multi-dungeon `168x120` grids remain well under browser `localStorage` limits.

---

## 5. Procedural Map Generation & BFS Invariants (`ADR-0004`)

- **Exploration-Scale Grids**: Map dimensions are defined per floor (`floor.width`, `floor.height`), ranging from `48x36` up to `192x144`+ (with legacy `21x15` saves still supported).
- **Non-Blocking Ore Veins**: Ore veins (`TILE_ORE_*`, IDs 10–15) and Astral Shrines (`TILE_SHRINE`, ID 16) must only spawn on `TILE_WALL` (`0`) cells orthogonally adjacent to at least one `TILE_FLOOR` (`1`) cell.
- **Pure-Floor BFS Reachability (`verifyPureFloorBFS`)**: Every generated floor verifies connectivity from `upPos` (`<`) to `downPos` (`>`) and all chests using a zero-allocation `Int32Array` ring-buffer queue over walkable tiles. If any target is unreachable, `carveDirectFloorPath(floor)` carves a guaranteed walkable corridor.

---

## 6. Architecture Roadmap Part I: Foundational Game Object & Traversal Model (`ADR-0010`)

To support complex interactive objects (Doors, Portals, Chests, Levers, Shrines, Traps, Ground Pickups, and Destructible Barriers) and an expanded Monster/Entity ecosystem, the engine is transitioning from scalar tile-ID objects (`TILE_CHEST`, `TILE_SHRINE`, `TILE_TRAP_*`) to a unified **Definition + Runtime Instance + Capability Component** architecture.

### 6.1 Core Architectural Separation
1. **Object Definitions (`ObjectDefinition` — Immutable Templates in `src/data/`)**:
   - Authored catalogs with stable `definitionId`, `category`, `subcategory`, `tags`, `defaultComponents`, `defaultProperties`, and `generationRules`.
   - Divided into **`ItemDefinition`** (logical possessions: Weapons, Armor, Accessories, Consumables, Materials, Keys, Tools, Quest Items, Artifacts, Currency) and **`WorldObjectDefinition`** (spatial entities: Static Objects, Doors, Portals, Containers, Mechanisms, Devices, World Pickups).
2. **Runtime Instances (`RuntimeObject` — Mutable State in `gameState`)**:
   - Each spawned or created entity has a unique `instanceId`, `definitionId`, `objectType`, `revision` (concurrency counter), `ownerId`, `factionId`, `tags`, `components`, `runtimeState`, and `persistencePolicy`.
   - **Logical Item vs. World Object Split**: `ItemInstance` is never a world object. When an item is dropped or spawned on the ground, a **`WorldItemPickupInstance`** lives on the floor and wraps the `ItemInstance`.
   - **Stacking Engine (`ItemStack`)**: Evaluates stack compatibility across `definitionId`, quality, enchantments, binding, expiration, charges, durability, and rolled affixes so stackable consumables/materials/keys merge cleanly while unique equipment preserves instance identity.

### 6.2 Capability Composition & Interaction Pipeline
- **Reusable Capabilities**: `Interactable`, `Usable`, `Equippable`, `Traversable`, `Damageable`, `Destructible`, `Lockable`, `Container`, `Ownable`, `TrapBearing`, `Discoverable`, `Permeable`.
- **Standardized `InteractionRequest` Pipeline**:
  - Every player, AI, or mechanism interaction dispatches `{ actorId, targetId, actionId, parameters, context, requestId }`.
  - **Requirements vs. Costs**: A generic boolean `Requirement` evaluator (`AND`/`OR` over item tags, credentials, skills, attributes, faction, quest state) checks permission before any state change; `Cost` processing (consuming a key, charge, mana, or lockpick) runs only upon validated execution.
  - **Effects & Events**: Reusable atomic effects (`UnlockObject`, `ChangeObjectState`, `ApplyDamage`, `ConsumeItem`, `TriggerTrap`, `TransferCharacter`, `GrantItem`) mutate state and emit decoupled gameplay events via `src/engine/events.js`.

### 6.3 Multi-Dimensional Door System (`DoorDefinition` / `DoorInstance`)
- **Orthogonal State Axes**:
  - `mechanical`: `closed` | `opening` | `open` | `closing` | `blocked` | `jammed` | `disabled`
  - `security`: `unlocked` | `locked` | `sealed` | `bypassed`
  - `discovery`: `unknown` | `suspected` | `discovered` | `revealed` *(Secret Doors render as surrounding 2.5D wall masonry until discovered!)*
  - `structural`: `intact` | `damaged` | `critically_damaged` | `breached` | `destroyed`
  - `power`: `unpowered` | `powered` | `overloaded`
- **Environmental Permeability Matrix**:
  - Independent permeability flags/fractions for **`movement`**, **`lineOfSight`**, **`light`**, **`sound`**, **`projectiles`**, and **`magic`**.
  - *Example*: A closed **Wooden Door** blocks movement, LOS, light, and projectiles; an **Iron Portcullis** blocks movement (`movement: false`) while permitting LOS, light, and ranged arrow/spell attacks (`lineOfSight: true, projectiles: true`).
- **Multi-Solution Lock & Breach Mechanics**:
  - Locked doors can be solved via matching **Key/Credential**, **Lockpicking** (Thief/DEX), **Force/Bash** (Fighter/Paladin STR vs. structural HP/armor), **Magical Dispel** (Mage/INT), or **Remote Mechanism/Lever**.

### 6.4 Portal, `PortalNetwork` & Shared `ITraversable` System
- **`ITraversable` Contract**: Shared interface across Doors, Portals, Stairs, and Dungeon Entrances for player movement, AI pathfinding cost evaluation, and world transitions.
- **`PortalInstance` & `PortalNetwork`**: Supports room-to-room, floor-to-floor, dungeon-to-overworld, and multi-endpoint waypoint network travel with stability ratings, charge consumption, activation rules, and safe arrival resolution.
- **Lock-and-Key Procedural Progression Validation**: Extends `verifyPureFloorBFS` into a progression graph validator ensuring keys/levers always spawn upstream of the locked doors they control.

### 6.5 Phased Object Architecture Rollout Sequence
| Phase | Milestone | Scope | Core Deliverables | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | `v0.8.0-objects` | **Object Foundation** | `ObjectDefinition`, `RuntimeObject`, `WorldObjectInstance`, IDs, tags, lifecycle, component registry, spatial floor index (`floor.objects`), serialization | **Complete (27/27 Tests)** |
| **Phase 1** | `v0.8.0-objects` | **Interaction Foundation** | `IInteractable`, `InteractionRequest` / `InteractionResult`, boolean `Requirement` evaluator, `Cost` & `Effect` processors, object domain events | **Complete (27/27 Tests)** |
| **Phase 2** | `v0.8.0-objects` | **Item & Pickup System** | `ItemDefinition`, `ItemInstance`, `ItemStack` compatibility engine, `KeyDefinition` credentials, `WorldItemPickupInstance`, migrating Chests/Shrines/Traps to `WorldObjectInstance` | **Complete (27/27 Tests)** |
| **Phase 3** | `v0.8.1-doors` | **Basic Door System** | Hinged Wooden/Iron Doors & Portcullises at room choke points, Open/Close/Unlock/Bash actions, basic keys, dynamic FOV/LOS permeability | **Complete (28/28 Tests)** |
| **Phase 4** | `v0.8.1-doors` | **Advanced Doors & Locks** | Secret doors (`discovery` state), door traps, multi-lock Vault doors, barricading, structural destruction/debris, Lock-and-Key BFS validation | **Complete (28/28 Tests)** |
| **Phase 5** | `v0.8.2-portals` | **Basic Portals** | `PortalDefinition`, `PortalInstance`, shared `traversal` component, Astral Sanctum Boss Extraction, surface return | **Complete (29/29 Tests)** |
| **Phase 6** | `v0.8.2-portals` | **Advanced Portals & Waypoint Networks** | Ancient Waypoint Network cross-floor travel, Unstable Astral Rifts with charge degradation & collapse, Dev Console Spawner (`spawn`) | **Complete (29/29 Tests)** |
| **Phase 7** | `v0.8.3+` | **World Topology & AI** | Regional location graph, traversal cost pathfinding for monsters/parties, multi-stage mechanisms | Planned |
| **Phase 8** | `v0.8.4+` | **Authority & Persistence** | Revision-checked atomic transactions, delta persistence policies, replication-ready state envelopes | Planned |

---

## 7. Architecture Roadmap Part II: Macro Wargame Hierarchy & Hybrid Time Engine (`ADR-0011`)

To support the long-term grand strategy wargame vision while remaining 100% playable locally at every milestone, the top-level state architecture follows a **"Start-With-One, Scale-To-Many"** hierarchy:

1. **`Universe` -> `World`**:
   - Holds world ruleset, campaign clock (~1-year campaign arc), alliance victory conditions, and the **Overworld Map Grid** (`overworld.tiles`, fog-of-war, resource nodes, cities, and dungeon entrances).
2. **`Player` -> `Cities[]`**:
   - Each city has a **City Building Grid**, local resource stockpile (`wood`, `stone`, `gold`, `copper`, `iron`, etc.), and a **Real-Time Build Queue** (initially 1 active slot).
   - **Buildings**: Adventurers Guild Hall, Resource Producers (Sawmill, Quarry), Military/Training, Constructs, Temples, Forge.
3. **`Guilds` & `Alliances`**:
   - Configurable Guild Archetypes supporting distinct playstyles: **War Guilds** (coordinated territory/alliance warfare with Divine War Reimbursement), **Adventurers Guilds** (solo/party dungeon delving & relic crafting), and **Social Guilds** (low-pressure cooperative city growth).
4. **`Parties[]` & `Units` (Settlers & Heroes)**:
   - **Settler**: Initial unit spawned on the Overworld map to explore and found a City.
   - **Hero-Led Parties**: Parties of 1..N class members that march in **real-time** on the Overworld map (~10s/tile) and transition into **turn-based** tactical mode inside Dungeons.
5. **Progressive Discovery & Guided Task System**:
   - Contextual tutorial tips and optional reward tasks (`Task 1: Settle Your First City` -> rewards `50 Wood, 50 Stone` -> `Task 2: Build Adventurers Guild Hall` [30s build timer] -> reveals first Overworld Dungeon Entrance -> real-time march to Dungeon).
