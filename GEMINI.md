# Aethelgard: The Starfall Vaults — Antigravity Project Guide

Welcome to the development workspace for **Aethelgard: The Starfall Vaults**, a turn-based tactical grid roguelike and subterranean mining RPG.

---

## 1. Project Overview & Current Architecture

- **Genre**: Tactical Grid Roguelike & Subterranean Mining RPG
- **Target Display**: 21x15 tile tactical canvas viewport + Tailwind CSS UI
- **Current Baseline**: `v0.3.1-inc3` (10/10 automated self-tests passing)
- **Active Transition**: Migrating from the legacy single-file `index.html` monolith to a structured, modular ES6 architecture under `src/` with a dual verification pipeline (headless CLI runner + in-browser diagnostics).

---

## 2. Immediate Development Priority

> [!IMPORTANT]
> **Priority 1: Modular Architecture Refactor**
> Before adding any new gameplay mechanics (such as Increment 4 talent trees or advanced affixes), all game systems from `index.html` must be cleanly modularized into `src/` while strictly keeping the 10/10 automated self-tests passing.

---

## 3. Modular Target Architecture (`src/`)

```text
wargame/
├── index.html                 # Main entrypoint HTML shell & canvas mounting
├── src/
│   ├── main.js                # App bootstrap, event wiring, and window.Aethelgard exports
│   ├── constants.js           # Tile types, directions, schema versions, rarity tiers
│   ├── data/
│   │   ├── classes.js         # Fighter, Thief, Mage, Ranger, Paladin definitions
│   │   ├── talents.js         # Talent tree data and perks
│   │   ├── items.js           # Gear, affix pools, and consumable catalogs
│   │   ├── ores.js            # Mineral catalog and geology requirements
│   │   └── research.js        # Dual-cost Guild research upgrades
│   ├── engine/
│   │   ├── state.js           # gameState schema, default state, and save migration
│   │   ├── procedural.js      # Dungeon generation, BFS reachability, affix rolling
│   │   ├── combat.js          # Turn execution, attack resolution, class skills
│   │   ├── actions.js         # Mining, shopping, stairs, extraction, defeat
│   │   └── audio.js           # Web Audio API sound effects and ambient synth
│   ├── ui/
│   │   ├── renderer.js        # Canvas 2D rendering, FOV raycasting, floating text
│   │   ├── domSync.js         # DOM updates, inventory rendering, chronicle log
│   │   ├── modals.js          # Outcome, inspect, class select, save sync modals
│   │   └── input.js           # Keyboard, mouse, and touch control listeners
│   └── test/
│       ├── selfTest.js        # Modular in-browser & headless self-test suite (10/10 baseline)
│       └── cliRunner.js       # Standalone test runner for Node.js / headless execution
├── .agents/
│   ├── rules/                 # Domain-specific constraints (engine, ui, testing, architecture)
│   └── skills/                # On-demand workflows (modular-refactor, verification-runner, increment-delivery)
└── scripts/
    └── test.ps1               # Automated test execution script
```

---

## 4. Non-Negotiable Core Invariants (The Golden Rules)

Every change made to this codebase must respect these architectural rules:

1. **Stairs & Recall Scrolls Only (No Lifts)**: Players extract loot strictly via Floor 1 Ascending Stairs (`<`) or Astral Recall Scrolls (`[R]`). Never introduce elevators or floor-skipping shortcuts.
2. **Non-Permanent Death Contract**: Defeat (`handleHeroDefeat`) must **never** wipe the character's level, talents, equipped 6-slot loadout, or Banked Guild Vault. Defeat only clears the unbanked `expeditionPack` / `expeditionGear` (subject to Vanguard Recovery salvage) and returns the player to the surface at full HP/MP.
3. **Persistent Dungeon Floors**: `gameState.dungeon.floors[depth]` must persist across descents and defeats. Only explicit Guild action (`confirmChartNewDungeon()`) resets floor layouts.
4. **Non-Blocking Ore Veins**: Mineral veins (`TILE_ORE_*`) must only spawn on `TILE_WALL` tiles adjacent to `TILE_FLOOR` tiles—never directly on corridor floor paths.
5. **Pure-Floor BFS Guarantee**: Every generated floor must pass `verifyPureFloorBFS(floor)` verifying that player start, stairs, and chests are connected solely through walkable floor tiles.
6. **Zero-Wasted-MP Skill Validation**: Active skills (`executeClassSkill`) must validate valid targets/destinations in range before deducting MP or consuming the turn.
7. **No Native Browser Dialogs**: Never call `window.alert()`, `window.confirm()`, or `window.prompt()`. Always use custom in-game modal components.
8. **Cumulative Automated Verification**: All 10 existing self-tests must pass on every modification. New increments must append new unit tests without deleting or corrupting previous tests.

---

## 5. Verification Protocol

- **CLI Verification**: Run `./scripts/test.ps1` to execute the automated verification suite from the terminal.
- **In-Browser Verification**: Open `index.html` and click **Verify Inc-X** in the header to confirm visual rendering and pass state.
- **Sandboxed Test Isolation**: Tests in `selfTest.js` must **never** mutate the active `gameState`. Always instantiate `const sandbox = createDefaultGameState()` and pass that sandbox into gameplay logic.

---

## 6. Antigravity Customizations Reference

- Domain Rules: Refer to `.agents/rules/` for deep-dive specifications on engine mechanics, canvas/UI rendering, and test invariants.
- Operational Skills: Refer to `.agents/skills/` for execution runbooks on `modular-refactor`, `verification-runner`, and `increment-delivery`.
