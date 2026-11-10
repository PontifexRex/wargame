Aethelgard: The Starfall Vaults

Current Build: v0.5.0-inc5 (Deep Abyssal Biomes, Floors 15/20 Bosses & Bestiary Codex)

Architecture: Modular ES6 architecture (src/) + compiled file:// bundle (dist/bundle.js) / HTML5 Canvas 2D / Tailwind CSS

Genre: Turn-Based Tactical Grid Roguelike & Subterranean Mining RPG

1. Lore & Premise

Three centuries ago, the astral meteor Vespera tore through the heavens and shattered the subterranean vaults beneath Oakhaven, mutating the ancient dwarven masonry into an ever-shifting abyss of living star-ore and eldritch guardians.

As a sworn operative of the Grand Guild of Aethelgard, you descend into regional subterranean realms and custom-chartered ruins to harvest cosmic minerals, recover Star-Forged Relics, and slay abyssal titans. Because of the Guild's Vanguard Recovery Pact, you cannot die permanently—if your health reaches zero, Guild Scouts drag you back to the surface hearth. You retain your character level, trained talents, equipped 6-slot loadout, and everything stored in your Banked Guild Vault, forfeiting only the unbanked loot carried in your Expedition Pack during that descent.

2. Core Gameplay Pillars

Exploration-Scale Maps & Scrolling Tactical Camera: Floors span from Small Outposts (48x36) and Standard Delves (80x60) up to Sprawling Labyrinths (128x96), Colossal Megadungeons (192x144), and custom Width x Height dimensions, rendered through a crisp 21x15 frustum-culled viewport with Bresenham wall line-of-sight.

Multi-Dungeon Expedition Atlas & Custom Charters: Switch between persistent Regional Dungeons (The Starfall Vaults, Sunken Copper Quarry, Whispering Mycelium Labyrinth, Citadel of the Fallen Star) or chart custom expeditions with independent monster rosters, mineral seam tables, layout architectures, and floor depths—compressed automatically via lossless RLE.

Dual-Economy Extraction Loop:

Expedition Pack (At Risk): Ores, uncut Astral Gems, and equipment looted during a run sit in your pack.

Banked Guild Vault (Safe): Returning to the surface via Floor 1 Ascending Stairs (<) or an Astral Recall Scroll ([R]) banks all ores and uncut Astral Gems into your Vault Reserves, moves unequipped gear into the Vault Armory, appraises trade relics into Gold, and pays out completed Guild Notice Board contracts. (Note: No elevator/lift shortcuts exist by design).

Persistent Procedural Dungeons (dungeons[id].floors[depth]): Every dungeon's floor layouts, mined walls, opened chests, channeled shrines, disarmed traps, and slain monsters persist independently across runs—even if you are defeated—until explicitly re-charted or abandoned in the Guild Expedition Atlas.

Dual-Cost Guild Research, Lapidary & Bounties: Upgrading Guild capabilities requires both Banked Gold and Mined Minerals, while Rare/Epic/Relic gear can be socketed with Astral Gems at the Lapidary Bench.

3. Controls Reference

| Input | Action | Context |
| W, A, S, D or Arrow Keys | Move / Bump-Attack Monster / Mine Wall Vein / Open Chest / Channel Shrine / Disarm Spotted Trap | Dungeon |
| Click Adjacent Tile | Move / Attack / Mine / Open Chest / Channel Shrine / Disarm Spotted Trap | Dungeon |
| Click Distant Explored Tile / Minimap | Safe BFS Auto-Walk (halts immediately on hostile sight, spotted trap, or damage) | Dungeon |
| M | Toggle Full-Floor Cartographer's Survey Map Overlay (with click-to-travel) | Dungeon / Guild |
| Q | Execute Class Tactical Skill | Dungeon |
| H | Quaff Healing Tonic ($+45\%$ Max HP & cures Bleed/Poison) | Dungeon |
| R | Read Astral Recall Scroll (Instant safe extraction to Guild) | Dungeon |
| E or Click Player Tile | Use Ascending (<) or Descending (>) Stairs (or cancel active Auto-Walk) | Dungeon |
| Space | Wait 1 Turn (triggers passive regen & advances enemy AI) | Dungeon |
| Mouse Hover | Inspect Tile, Ore Vein, Shrine, Spotted Trap, or Visible Monster in Tactical Scanner | Dungeon |

4. Repository Documentation Map

To support multi-agent development and seamless context handoffs across chat sessions, this repository uses a modular specification suite under `docs/`:

- `README.md` (This file): Project overview, core loop, controls, and Git workflow.
- `GEMINI.md` & `AGENTS.md`: Antigravity workspace architecture map, 8 Golden Rules, and operational guardrails.
- `docs/architecture.md`: Master gameState JSON schema, save migration contract, sandboxed state injection pattern, and procedural generation invariants.
- `docs/game_design_spec.md`: Exact mathematical formulas, 5 class definitions, 6-slot equipment & affix tables, 6 mineral veins, 6 dual-cost research trees, and boss mechanics.
- `docs/agentic_workflow.md` & `docs/agentic_workflow_roadmap.md`: Living architecture diagrams and staged maturity roadmap for agentic development.
- `docs/roadmap.md`: Cumulative changelog (Increments 1–5) and upcoming milestone backlogs.
- `docs/adr/`: Architecture Decision Records (`ADR-0001` through `ADR-0006`).

5. Local Verification & Release Tagging Workflow

Run the automated CLI verification suite and rebuild dist/bundle.js:

./scripts/test.ps1

Open index.html in a browser (or run ./scripts/serve.ps1) and click Verify Atlas in the top-right header to inspect all 17/17 diagnostic checks.

Commit and tag the milestone:

git add .
git commit -m "feat(atlas): implement multi-dungeon registry, exploration-scale maps, RLE & auto-walk (17/17 PASS)"
git tag -a v0.4.5-atlas -m "Verified 17/17 self-tests passing"
git push origin main --tags
