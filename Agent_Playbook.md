Agentic SDLC & Quality Gate Protocol

This playbook defines the operational rules for AI coding agents and new chat sessions working on Aethelgard: The Starfall Vaults. Read this file before modifying index.html.

1. Non-Negotiable Architectural Invariants (The 8 Golden Rules)

Single-File Completeness: All HTML, CSS, and JavaScript must remain inside index.html. Never split scripts or stylesheets into external files, and never output truncated placeholders like // ... rest of code.

Stairs & Recall Scrolls Only (No Lifts): Players extract loot ONLY via Floor 1 Ascending Stairs (<) or Astral Recall Scrolls ([R]). Never introduce elevator shafts or floor-skipping teleporters.

Non-Permanent Death Contract: Defeat in the dungeon (handleHeroDefeat) must never erase the player's save, level, equipped 6-slot gear, or Banked Guild Vault. It only clears expeditionPack and expeditionGear (after applying Vanguard Recovery Pact salvage) and returns the hero to the Guild at full HP/MP.

Persistent Dungeon Floors: gameState.dungeon.floors[depth] must persist across descents and defeats. Only confirmChartNewDungeon() may reset gameState.dungeon.floors.

Non-Blocking Ore Veins: Ore veins (TILE_ORE_*) must only spawn on TILE_WALL tiles adjacent to TILE_FLOOR tiles—never on corridor floor tiles where an unresearched vein would block pathfinding.

Pure-Floor BFS Guarantee: Every generated floor must pass verifyPureFloorBFS(floor) using only walkable floor/stair/chest tiles.

Zero-Wasted-MP Skill Validation: Active skills (executeClassSkill) must validate that a valid target (and an unoccupied walkable destination tile for Thief's Shadowstep Strike) exists in range before deducting MP or consuming the player's turn.

No Native Browser Dialogs: Never call window.alert(), window.confirm(), or window.prompt(). Always use #outcomeModal or a custom backdrop modal.

2. Historical Regression Traps to Avoid

Trap 1 — Unclosed Object/Class Braces: When editing CLASSES or ORE_CATALOG, verify that all 5 classes (fighter, thief, mage, ranger, paladin) are present and the outer CLASSES object closes cleanly with }; before const ORE_CATALOG = {.

Trap 2 — Corrupting Live State During Self-Tests: runSelfTests() runs automatically on window.onload. Every test in runSelfTests() must instantiate its own sandbox (const sandbox = createDefaultGameState()) and pass sandbox into gameplay functions. Never mutate gameState inside a test.

Trap 3 — Breaking Legacy Saves: When adding new state keys in future increments, always initialize them inside createDefaultGameState() AND back-fill them inside migrateSaveData(raw).

3. Cumulative Automated Verification Protocol (runSelfTests)

Currently, v0.3.1-inc3 enforces 10 automated self-tests:

Schema v3 Save Migration (v0.1.0-inc1 compatibility)

Complete 5-Class Registry (fighter, thief, mage, ranger, paladin)

Pure-Floor BFS Staircase Reachability (5 consecutive procedural floors)

Procedural 6-Slot Equipment & Rarity Affix Engine

Interactive Mining, Geology Gating & Durability Math

Dual-Cost Guild Research Lab (Gold + Vault Minerals)

Quartermaster Consumables & Antiquarian Assay Multiplier

Active Skill Target & Walkable Tile Validation (Zero Wasted MP)

Milestone Boss Spawns (Floor 5 Colossus & Floor 10 Weaver)

Non-Permanent Defeat & Vanguard Recovery Salvage

Rule for Future Increments: Never delete existing self-tests. Increment 4 must retain Tests 1–10 and append Tests 11–13 (e.g., 13/13 PASS).

4. Handoff Prompt Template for New Chat Sessions

To start a fresh chat session or onboard a new coding agent without losing context, paste index.html along with ARCHITECTURE.md, GAME_DESIGN_SPEC.md, and AGENT_PLAYBOOK.md, then use this prompt:

We are developing "Aethelgard: The Starfall Vaults", a single-file HTML5 tactical roguelike currently at v0.3.1-inc3 (10/10 self-tests passing).
Review the attached index.html, ARCHITECTURE.md, GAME_DESIGN_SPEC.md, AGENT_PLAYBOOK.md, and ROADMAP.md.
Strictly adhere to all 8 Golden Rules in AGENT_PLAYBOOK.md, preserve backward-compatible save migration, and append new unit checks to runSelfTests().
Let's implement Increment 4 as specified in ROADMAP.md.
