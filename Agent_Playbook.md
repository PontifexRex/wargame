# Agentic SDLC & Quality Gate Protocol

This playbook defines the operational rules for AI coding agents and new chat sessions working on **Aethelgard: The Starfall Vaults**. Read this file alongside `AGENTS.md`, `GEMINI.md`, and `docs/adr/README.md` before modifying code.

---

## 1. Non-Negotiable Architectural Invariants (The 8 Golden Rules)

1. **Modular ES6 & Dual-Boot Parity (`ADR-0001`)**: All gameplay code lives in `src/` (24 ES6 modules). Always run `./scripts/test.ps1` after edits so `dist/bundle.js` is rebuilt, verified for top-level scope collisions, checked against `index.html` DOM IDs, and tested headlessly. Never leave placeholder comments (`// TODO: rest of code`).
2. **Stairs & Recall Scrolls Only (No Lifts)**: Players extract loot ONLY via Floor 1 Ascending Stairs (`<`) or Astral Recall Scrolls (`[R]`). Never introduce elevator shafts or floor-skipping teleporters.
3. **Non-Permanent Death Contract**: Defeat in the dungeon (`handleHeroDefeat`) must never erase the player's save, level, talents, equipped 6-slot gear, or Banked Guild Vault. It only clears `expeditionPack` and `expeditionGear` (after applying Vanguard Recovery Pact salvage) and returns the hero to the Guild at full HP/MP.
4. **Persistent Multi-Dungeon Floors (`ADR-0003`)**: `state.dungeons[id].floors[depth]` must persist across descents, dungeon switches, and defeats. Only explicit chartering/resetting (`chartNewDungeon` / `abandonCharteredDungeon`) creates or removes dungeon instances.
5. **Non-Blocking Ore Veins & Shrines**: Ore veins (`TILE_ORE_*`) and shrines (`TILE_SHRINE`) must only spawn on `TILE_WALL` tiles adjacent to `TILE_FLOOR` tiles—never on corridor floor tiles where an unresearched vein would block pathfinding.
6. **Pure-Floor BFS Guarantee (`ADR-0004`)**: Every generated floor must pass `verifyPureFloorBFS(floor)` verifying reachability from `upPos` (`<`) to `downPos` (`>`) and all chests using only walkable floor/stair/chest/trap tiles.
7. **Zero-Wasted-MP Skill Validation**: Active skills (`executeClassSkill`) must validate that a valid target (and an unoccupied walkable destination tile for Thief's Shadowstep Strike) exists in range and Line-of-Sight before deducting MP or consuming the player's turn.
8. **No Native Browser Dialogs**: Never call `window.alert()`, `window.confirm()`, or `window.prompt()`. Always use `#outcomeModal` or a custom backdrop modal.

---

## 2. Historical Regression Traps to Avoid

- **Trap 1 — Chakra ES2017 Syntax Incompatibility (`ADR-0001`)**: `scripts/test.ps1` runs via Windows `chakra.dll` (ES2017). Never use optional chaining (`?.`) or object rest/spread (`{ ...obj }`) in `src/`—use explicit guards (`obj && obj.prop`) and `Object.assign({}, obj)`.
- **Trap 2 — Corrupting Live State During Self-Tests (`ADR-0002`)**: Every test in `src/test/selfTest.js` must instantiate its own sandbox (`const sandbox = createDefaultGameState()`) and pass `sandbox` into gameplay functions. Never mutate `gameState` inside a test.
- **Trap 3 — Breaking Legacy Saves (`ADR-0003`)**: When adding new state keys, always initialize them inside `createDefaultGameState()` AND back-fill them inside `migrateSaveData(raw)` supporting saves from `v0.1.0-inc1` onward.
- **Trap 4 — Hardcoding `21x15` Map Loops (`ADR-0004`)**: Always read `floor.width` and `floor.height` for dungeon simulation bounds; reserve `VIEWPORT_W (21)` and `VIEWPORT_H (15)` strictly for camera rendering in `src/ui/renderer.js`.

---

## 3. Cumulative Automated Verification Protocol (`17/17 PASS`)

Currently, `v0.4.5-atlas` enforces **17 automated self-tests** in `src/test/selfTest.js`:

1. Schema v5 Save Migration (`v0.1.0-inc1` -> `v0.4.5-atlas` compatibility & Multi-Dungeon registry)
2. Complete 5-Class Registry (`fighter`, `thief`, `mage`, `ranger`, `paladin`)
3. Pure-Floor BFS Staircase Reachability (5 consecutive procedural floors)
4. Procedural 6-Slot Equipment & Rarity Affix Engine
5. Interactive Mining, Geology Gating, Durability Math & Domain Event Bus (`ENGINE_EVENTS.ORE_MINED`)
6. Dual-Cost Guild Research Lab (Gold + Vault Minerals)
7. Quartermaster Consumables & Antiquarian Assay Multiplier
8. Active Skill Target & Walkable Tile Validation (Zero Wasted MP)
9. Milestone Boss Spawns (Floor 5 Colossus & Floor 10 Weaver)
10. Non-Permanent Defeat & Vanguard Recovery Salvage
11. Astral Gem Extraction & Lapidary Socketing (`socketGemIntoItem`, `unsocketGemsFromItem`)
12. Guild Notice Board Bounties & Reward Claiming (`recordBountyProgress`, `claimBountyReward`)
13. Subterranean Shrines, Runic Traps & Status Effects (`interactWithShrine`, `triggerFloorTrap`)
14. Multi-Dungeon Atlas Switching & Independent Floor Persistence (`selectActiveDungeon`, `chartNewDungeon`)
15. Exploration-Scale Map Generation (`64x44` to `168x120`) & Pure-Floor BFS
16. Biome-Specific Monster Archetypes, Ranged LOS & Ore Weighting
17. RLE Floor Compression & Round-Trip Hydration (`compactFloorForStorage`, `hydrateFloorFromStorage`)

**Rule for Future Increments**: Never delete existing self-tests. New increments must retain Tests 1–17 and append new unit checks.

---

## 4. Handoff Prompt Template for New Chat Sessions

```text
We are developing "Aethelgard: The Starfall Vaults", a modular ES6 HTML5 tactical roguelike currently at v0.4.5-atlas (17/17 self-tests passing).
Review GEMINI.md, AGENTS.md, architecture.md, docs/adr/README.md, game_design_spec.md, and roadmap.md.
Strictly adhere to the 8 Golden Rules, preserve backward-compatible save migration, and run ./scripts/test.ps1 to verify all self-tests and DOM contracts pass.
```
