Aethelgard: The Starfall Vaults

Current Build: v0.3.1-inc3 (Increment 3 Verified)

Architecture: Zero-dependency, single-file HTML5 / Canvas 2D / Tailwind CSS application (index.html)

Genre: Turn-Based Tactical Grid Roguelike & Subterranean Mining RPG

1. Lore & Premise

Three centuries ago, the astral meteor Vespera tore through the heavens and shattered the subterranean vaults beneath Oakhaven, mutating the ancient dwarven masonry into an ever-shifting abyss of living star-ore and eldritch guardians.

As a sworn operative of the Grand Guild of Aethelgard, you descend into the vaults to harvest cosmic minerals, recover Star-Forged Relics, and slay abyssal titans. Because of the Guild's Vanguard Recovery Pact, you cannot die permanently—if your health reaches zero, Guild Scouts drag you back to the surface hearth. You retain your character level, trained talents, equipped 6-slot loadout, and everything stored in your Banked Guild Vault, forfeiting only the unbanked loot carried in your Expedition Pack during that descent.

2. Core Gameplay Pillars

Tactical Turn-Based Grid (21x15 Canvas): Enemies only move or act when you step, attack, mine, quaff a tonic, or cast a skill.

Dual-Economy Extraction Loop:

Expedition Pack (At Risk): Ores mined and equipment looted during a run sit in your pack.

Banked Guild Vault (Safe): Returning to the surface via Floor 1 Ascending Stairs (<) or an Astral Recall Scroll ([R]) banks all ores into your Vault Reserves, moves unequipped gear into the Vault Armory, and appraises trade relics into Gold. (Note: No elevator/lift shortcuts exist by design).

Persistent Procedural Dungeon (dungeon.floors[depth]): Every floor layout, mined wall, opened chest, and slain monster persists across runs—even if you are defeated—until you explicitly click Chart New Dungeon at the Guild.

Dual-Cost Guild Research Lab: Upgrading Guild capabilities requires both Banked Gold and Mined Minerals (Copper, Iron, Mithril, Relic Geodes, Star-Crystal, Void Astralite).

3. Controls Reference

| Input | Action | Context |
| W, A, S, D or Arrow Keys | Move / Bump-Attack Monster / Mine Wall Vein / Open Chest | Dungeon |
| Mouse Click (Adjacent Tile) | Move / Attack / Mine / Open Chest | Dungeon |
| Q | Execute Class Tactical Skill | Dungeon |
| H | Quaff Healing Tonic ($+45\%$ Max HP & cures Bleed/Poison) | Dungeon |
| R | Read Astral Recall Scroll (Instant safe extraction to Guild) | Dungeon |
| E or Click Player Tile | Use Ascending (<) or Descending (>) Stairs | Dungeon |
| Space | Wait 1 Turn (triggers passive regen & advances enemy AI) | Dungeon |
| Mouse Hover | Inspect Tile, Ore Vein, or Monster in Tactical Scanner | Dungeon |

4. Repository Documentation Map

To support multi-agent development and seamless context handoffs across chat sessions, this repository uses a modular specification suite:

README.md (This file): Project overview, core loop, controls, and Git workflow.

ARCHITECTURE.md: Single-file code structure, gameState JSON schema (v0.3.1-inc3), save migration contract, sandboxed state injection pattern, and procedural generation invariants.

GAME_DESIGN_SPEC.md: Exact mathematical formulas, 5 class definitions, 6-slot equipment & affix tables, 6 mineral veins, 6 dual-cost research trees, and boss mechanics.

AGENT_PLAYBOOK.md: Mandatory guardrails for AI coding agents, anti-regression rules, and instructions for extending the runSelfTests() verification suite.

ROADMAP.md: Cumulative changelog (Increments 1–3) and detailed specifications for Increment 4 and Increment 5.

5. Local Git & Release Tagging Workflow

All game logic, styles, and rendering live in index.html. When adopting a new increment:

Replace index.html and review the line diff in VS Code or GitHub Desktop.

Open index.html in a browser and click Verify Inc-X in the top-right header to confirm all automated self-tests pass.

Commit and tag the milestone:

git add index.html *.md
git commit -m "Release v0.3.1-inc3: Verified Increment 3 + Spec Documentation Suite"
git tag -a v0.3.1-inc3 -m "Verified 10/10 self-tests passing"
git push origin main --tags

