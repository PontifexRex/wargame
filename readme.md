Aethelgard: The Starfall Vaults

Current Build: v0.4.0-inc4 (Increment 4 Verified)

Architecture: Modular ES6 architecture (src/) + compiled file:// bundle (dist/bundle.js) / HTML5 Canvas 2D / Tailwind CSS

Genre: Turn-Based Tactical Grid Roguelike & Subterranean Mining RPG

1. Lore & Premise

Three centuries ago, the astral meteor Vespera tore through the heavens and shattered the subterranean vaults beneath Oakhaven, mutating the ancient dwarven masonry into an ever-shifting abyss of living star-ore and eldritch guardians.

As a sworn operative of the Grand Guild of Aethelgard, you descend into the vaults to harvest cosmic minerals, recover Star-Forged Relics, and slay abyssal titans. Because of the Guild's Vanguard Recovery Pact, you cannot die permanently—if your health reaches zero, Guild Scouts drag you back to the surface hearth. You retain your character level, trained talents, equipped 6-slot loadout, and everything stored in your Banked Guild Vault, forfeiting only the unbanked loot carried in your Expedition Pack during that descent.

2. Core Gameplay Pillars

Tactical Turn-Based Grid (21x15 Canvas): Enemies only move or act when you step, attack, mine, quaff a tonic, or cast a skill.

Dual-Economy Extraction Loop:

Expedition Pack (At Risk): Ores, uncut Astral Gems, and equipment looted during a run sit in your pack.

Banked Guild Vault (Safe): Returning to the surface via Floor 1 Ascending Stairs (<) or an Astral Recall Scroll ([R]) banks all ores and uncut Astral Gems into your Vault Reserves, moves unequipped gear into the Vault Armory, appraises trade relics into Gold, and pays out completed Guild Notice Board contracts. (Note: No elevator/lift shortcuts exist by design).

Persistent Procedural Dungeon (dungeon.floors[depth]): Every floor layout, mined wall, opened chest, channeled shrine, disarmed trap, and slain monster persists across runs—even if you are defeated—until you explicitly click Chart New Dungeon at the Guild.

Dual-Cost Guild Research, Lapidary & Bounties: Upgrading Guild capabilities requires both Banked Gold and Mined Minerals, while Rare/Epic/Relic gear can be socketed with Astral Gems at the Lapidary Bench.

3. Controls Reference

| Input | Action | Context |
| W, A, S, D or Arrow Keys | Move / Bump-Attack Monster / Mine Wall Vein / Open Chest / Channel Shrine / Disarm Spotted Trap | Dungeon |
| Mouse Click (Adjacent Tile) | Move / Attack / Mine / Open Chest / Channel Shrine / Disarm Spotted Trap | Dungeon |
| Q | Execute Class Tactical Skill | Dungeon |
| H | Quaff Healing Tonic ($+45\%$ Max HP & cures Bleed/Poison) | Dungeon |
| R | Read Astral Recall Scroll (Instant safe extraction to Guild) | Dungeon |
| E or Click Player Tile | Use Ascending (<) or Descending (>) Stairs | Dungeon |
| Space | Wait 1 Turn (triggers passive regen & advances enemy AI) | Dungeon |
| Mouse Hover | Inspect Tile, Ore Vein, Shrine, Spotted Trap, or Monster in Tactical Scanner | Dungeon |

4. Repository Documentation Map

To support multi-agent development and seamless context handoffs across chat sessions, this repository uses a modular specification suite:

README.md (This file): Project overview, core loop, controls, and Git workflow.

GEMINI.md & AGENTS.md: Antigravity workspace architecture map, 8 Golden Rules, and operational guardrails.

ARCHITECTURE.md: Master gameState JSON schema, save migration contract, sandboxed state injection pattern, and procedural generation invariants.

GAME_DESIGN_SPEC.md: Exact mathematical formulas, 5 class definitions, 6-slot equipment & affix tables, 6 mineral veins, 6 dual-cost research trees, and boss mechanics.

AGENT_PLAYBOOK.md: Mandatory guardrails for AI coding agents, anti-regression rules, and instructions for extending the runSelfTests() verification suite.

ROADMAP.md: Cumulative changelog (Increments 1–4) and detailed specifications for Increment 5.

5. Local Verification & Release Tagging Workflow

Run the automated CLI verification suite and rebuild dist/bundle.js:

./scripts/test.ps1

Open index.html in a browser (or run ./scripts/serve.ps1) and click Verify Inc-4 in the top-right header to inspect all 13/13 diagnostic checks.

Commit and tag the milestone:

git add .
git commit -m "Release v0.4.0-inc4: Implemented Increment 4 with 13/13 verified tests"
git tag -a v0.4.0-inc4 -m "Verified 13/13 self-tests passing"
git push origin main --tags
