# Architectural Rules & Module Standards

## 1. Modular Directory Layout

All application source code resides in `src/`, categorized by domain:

- **`src/constants.js`**: Core global constants:
  - `SCHEMA_VERSION` (e.g. `'v0.3.1-inc3'`)
  - Grid dimensions: `VIEWPORT_WIDTH = 21`, `VIEWPORT_HEIGHT = 15`
  - Tile IDs: `TILE_WALL`, `TILE_FLOOR`, `TILE_STAIRS_DOWN`, `TILE_STAIRS_UP`, `TILE_CHEST`, `TILE_ORE_*`
  - Rarity definitions: `COMMON`, `UNCOMMON`, `RARE`, `EPIC`, `LEGENDARY`

- **`src/data/`**: Pure data definitions (zero engine logic):
  - `classes.js`: Class base stats, starter equipment, unique skills & passives (Fighter, Thief, Mage, Ranger, Paladin)
  - `talents.js`: Talent tree nodes, requirements, stat bonuses
  - `items.js`: Gear slots (`weapon`, `offhand`, `armor`, `helm`, `boots`, `amulet`), affix pools, potion costs
  - `ores.js`: Mineral metadata, required pickaxe tier, guild gold appraisal values
  - `research.js`: Dual-cost Guild research upgrades (Gold + Minerals)

- **`src/engine/`**: Game rules, math, and core loop:
  - `state.js`: `gameState` object, `createDefaultGameState()`, `migrateSaveData()`, `saveGame()`, `loadGame()`
  - `procedural.js`: Cellular automata / BSP room generation, `verifyPureFloorBFS()`, monster spawners, affix generator
  - `combat.js`: Turn resolution, bump-to-attack, monster AI ticks, damage mitigation formulas, class skill execution
  - `actions.js`: Mining mechanics, pickaxe durability, vendor transactions, stairs transition, hero defeat recovery
  - `audio.js`: Web Audio API sound synthesizers (bump, hit, mine, heal, levelup, recall)

- **`src/ui/`**: Presentation, interaction, and styling:
  - `renderer.js`: HTML5 Canvas 2D rendering, shadowcasting FOV (radius 6), floating combat numbers
  - `domSync.js`: Inventory grid, stats bar, chronicle combat log, Guild hub views
  - `modals.js`: In-game overlay modals (Class Selection, Diagnostics, Save Sync, Item Inspect, Chart Dungeon)
  - `input.js`: Unified keyboard (`WASD`, arrow keys, shortcuts) and click-to-act input dispatcher

- **`src/test/`**: Verification and regression test harness:
  - `selfTest.js`: The 10 canonical self-tests as ES module exports
  - `cliRunner.js`: Headless test execution script

---

## 2. ES Module Guidelines

1. **Explicit Relative Imports**: Always include file extensions in import statements:
   ```javascript
   import { createDefaultGameState } from '../engine/state.js';
   ```
2. **Circular Dependency Avoidance**:
   - `data/` imports nothing from `engine/` or `ui/`.
   - `engine/` imports from `data/` and `constants.js`.
   - `ui/` imports from `engine/`, `data/`, and `constants.js`.
   - `main.js` bootstraps and wires UI callbacks to engine events.
3. **Global Namespace Exposure (`window.Aethelgard`)**:
   - Because UI buttons and canvas event listeners in the DOM invoke methods by name, `main.js` must attach interactive controllers to `window.Aethelgard`.
