# Technical Architecture & Schema Contracts

- **Entrypoint**: `index.html` + `src/main.js` (with `dist/bundle.js` fallback for `file://` & headless CLI verification)
- **Current Schema Version**: `v0.4.5-atlas`
- **LocalStorage Key**: `aethelgard_save_v5` (with automatic migration from `aethelgard_save`, `aethelgard_save_v2`, `aethelgard_save_v3`, and `aethelgard_save_v4`)
- **Architecture Decision Records**: See `docs/adr/README.md` (`ADR-0001` through `ADR-0006`)

---

## 1. Modular ES6 Layout & Dual Bootloader (`ADR-0001`)

The codebase is organized into 24 ES6 modules under `src/` with zero external npm dependencies:

- **`src/constants.js`**: `SCHEMA_VERSION`, `STORAGE_KEY`, viewport constants (`VIEWPORT_W = 21`, `VIEWPORT_H = 15`, `TILE_SIZE = 32`), default map dimensions (`DEFAULT_MAP_W = 84`, `DEFAULT_MAP_H = 60`), Tile IDs, and Rarity multipliers.
- **`src/data/`** *(Pure static registries — zero imports from `engine/` or `ui/`)*:
  - `classes.js`: 5 playable classes (`fighter`, `thief`, `mage`, `ranger`, `paladin`).
  - `talents.js`: 15 class talent nodes (`TALENT_TREES`).
  - `items.js`: Equipment prefixes/suffixes (`AFFIX_POOL`), `ELITE_AFFIXES`, and Quartermaster `SHOP_ITEMS`.
  - `ores.js`: 6 mineral definitions (`ORE_CATALOG`, `MINERAL_IDS`).
  - `gems.js`: 5 Astral Gems (`GEM_CATALOG`), 3 Shrines (`SHRINE_CATALOG`), and 2 Runic Traps (`TRAP_CATALOG`).
  - `bounties.js`: Procedural Notice Board bounty generator (`buildProceduralBountySet`).
  - `research.js`: 6 dual-cost Guild Research trees (`RESEARCH_PROJECTS`).
  - `monsters.js`: 12 regular monster archetypes + 4 milestone bosses (`MONSTER_ARCHETYPES`, `BOSS_ARCHETYPES`).
  - `dungeons.js`: 4 Regional Dungeon Profiles (`DUNGEON_PROFILES`), Map Size Tiers (`small` `64x44` to `colossal` `168x120`), Layout Styles, and `buildCharteredDungeonInstance`.
- **`src/engine/`** *(Pure game state, procedural generation, combat, and domain events — zero imports from `ui/`)*:
  - `rng.js`: Deterministic `mulberry32` PRNG, `hashSeedString`, and `weightedPick`.
  - `compression.js`: RLE row compression (`packGrid2D` / `unpackGrid2D`) and `compactFloorForStorage` / `hydrateFloorFromStorage` (`ADR-0003`).
  - `events.js`: Synchronous Domain Event Bus (`ENGINE_EVENTS`, `onEngineEvent`, `offEngineEvent`, `emitEngineEvent`) (`ADR-0006`).
  - `state.js`: `gameState`, `createDefaultGameState`, `migrateSaveData`, `recomputeHeroDerivedStats`, `saveGame`, `loadGame`, and active dungeon hydration helpers.
  - `procedural.js`: Macro-Sector & Cellular Automata floor generator, `Int32Array` BFS validator (`verifyPureFloorBFS`), `carveDirectFloorPath`, and procedural equipment/socket generator (`ADR-0004`).
  - `combat.js`: Turn loop (`handlePlayerAction`, `processTurn`), wall-blocking Bresenham LOS, monster AI archetypes (`ranged_kite`, `caster_debuff`, `skirmisher`, `tank`), and class skills.
  - `actions.js`: Interactive mining, Lapidary gem socketing, Notice Board bounties, Multi-Dungeon Atlas switching/chartering, shrines/traps, extraction, and non-permanent defeat recovery.
  - `audio.js`: Procedural Web Audio API synthesizer (`playSound`, `toggleAudio`).
- **`src/ui/`** *(Canvas 2D & DOM presentation)*:
  - `renderer.js`: `21x15` scrolling camera frustum, FOV shadowcasting (`updateFOV`), full-map Exploration Overview (`[M]`), and floating combat text (`ADR-0005`).
  - `domSync.js`: Guild Hub tabs (Quartermaster, Assay, Lapidary, Research, Notice Board, Expedition Atlas) and Dungeon HUD synchronizer.
  - `modals.js`: Custom backdrop modals (`#classSelectModal`, `#itemInspectModal`, `#diagnosticsModal`, `#saveSyncModal`, `#outcomeModal`).
  - `input.js`: Keyboard shortcuts (`WASD`/Arrows, `Q`, `H`, `R`, `E`, `M`, `Space`), hover scanner, and safe A* click-to-autowalk (`ADR-0005`).
- **`src/test/`**:
  - `selfTest.js`: 17 cumulative sandboxed self-tests (`runSelfTests`).
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
