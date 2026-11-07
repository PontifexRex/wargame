# Architectural Rules & Module Standards

## 1. Modular Directory Layout (24 ES6 Modules)

All application source code resides in `src/`, categorized by domain:

- **`src/constants.js`**: Core global constants:
  - `SCHEMA_VERSION` (`'v0.4.5-atlas'`), `STORAGE_KEY` (`'aethelgard_save_v5'`)
  - Viewport dimensions: `VIEWPORT_W = 21`, `VIEWPORT_H = 15`, `TILE_SIZE = 32`
  - Default map dimensions: `DEFAULT_MAP_W = 84`, `DEFAULT_MAP_H = 60`
  - Tile IDs: `TILE_WALL`, `TILE_FLOOR`, `TILE_STAIRS_DOWN`, `TILE_STAIRS_UP`, `TILE_CHEST`, `TILE_ORE_*`, `TILE_SHRINE*`, `TILE_TRAP_*`
  - Rarity definitions: `common`, `uncommon`, `rare`, `epic`, `relic`

- **`src/data/`**: Pure data definitions (zero engine/UI imports):
  - `classes.js`: Class base stats, starter equipment, unique skills & passives (Fighter, Thief, Mage, Ranger, Paladin)
  - `talents.js`: Talent tree nodes, requirements, stat bonuses
  - `items.js`: Gear slots (`weapon`, `armor`, `helm`, `boots`, `accessory`, `pickaxe`), affix pools, Quartermaster shop catalog
  - `ores.js`: Mineral metadata, required Geology rank, Guild gold appraisal values
  - `gems.js`: 5 Astral Gems (`GEM_CATALOG`), 3 Shrines (`SHRINE_CATALOG`), and 2 Runic Traps (`TRAP_CATALOG`)
  - `bounties.js`: Procedural Guild Notice Board bounty generator (`buildProceduralBountySet`)
  - `research.js`: Dual-cost Guild research upgrades (Gold + Minerals)
  - `monsters.js`: 12 monster archetypes + 4 milestone bosses (`MONSTER_ARCHETYPES`, `BOSS_ARCHETYPES`)
  - `dungeons.js`: 4 Regional Dungeon Profiles (`DUNGEON_PROFILES`), Map Size Tiers (`64x44` to `168x120`), Layout Styles, and `buildCharteredDungeonInstance`

- **`src/engine/`**: Game rules, math, compression, events, and core loop (zero UI imports):
  - `rng.js`: Deterministic `mulberry32` PRNG, `hashSeedString`, and `weightedPick`
  - `compression.js`: RLE 2D grid compression (`packGrid2D` / `unpackGrid2D`) and `compactFloorForStorage` / `hydrateFloorFromStorage`
  - `events.js`: Synchronous Domain Event Bus (`ENGINE_EVENTS`, `onEngineEvent`, `offEngineEvent`, `emitEngineEvent`)
  - `state.js`: `gameState` object, `createDefaultGameState()`, `migrateSaveData()`, `saveGame()`, `loadGame()`, and active dungeon alias synchronization
  - `procedural.js`: Macro-Sector & Cellular Automata floor generation, `Int32Array` BFS (`verifyPureFloorBFS`), monster spawners, equipment/socket generator
  - `combat.js`: Turn resolution, bump-to-attack, wall-blocking Bresenham LOS, monster AI archetypes, class skill execution
  - `actions.js`: Mining mechanics, Lapidary gem socketing, Notice Board bounties, Multi-Dungeon Atlas chartering/switching, shrines/traps, extraction, hero defeat recovery
  - `audio.js`: Web Audio API sound synthesizers

- **`src/ui/`**: Presentation, interaction, and styling:
  - `renderer.js`: HTML5 Canvas 2D `21x15` scrolling camera viewport, FOV raycasting, `[M]` full-map Exploration Overview, floating combat numbers
  - `domSync.js`: Guild Hub tabs (Quartermaster, Assay, Lapidary, Research, Notice Board, Expedition Atlas), inventory, stats bar, combat log
  - `modals.js`: Custom backdrop modals (Class Select, Item Inspect, Diagnostics, Save Sync, Outcome)
  - `input.js`: Keyboard shortcuts (`WASD`/Arrows, `Q`, `H`, `R`, `E`, `M`, `Space`), hover scanner, and safe A* click-to-autowalk

- **`src/test/`**: Verification and regression test harness:
  - `selfTest.js`: The 17 cumulative sandboxed self-tests
  - `cliRunner.js`: Headless test execution harness invoked by `./scripts/test.ps1`

---

## 2. ES Module & Build Guidelines (`ADR-0001` & `ADR-0006`)

1. **Explicit Relative Imports**: Always include `.js` file extensions in import statements.
2. **Strict Layered DAG**:
   - `data/` imports nothing from `engine/` or `ui/`.
   - `engine/` imports only from `data/`, `engine/`, and `constants.js` (communicating with `ui/` or telemetry listeners via `src/engine/events.js`).
   - `ui/` imports from `engine/`, `data/`, and `constants.js`.
   - `main.js` bootstraps and exposes `window.Aethelgard`.
3. **Top-Level Identifier Uniqueness & ES2017 Compatibility**:
   - `scripts/build.ps1` concatenates all modules into a single IIFE (`dist/bundle.js`) and enforces zero duplicate top-level identifiers across modules.
   - Avoid ES2020+ syntax (`?.` or `{ ...obj }`) so `dist/bundle.js` runs natively inside Windows `chakra.dll` during `./scripts/test.ps1`.
