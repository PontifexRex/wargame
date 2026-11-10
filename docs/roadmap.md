Project Roadmap & Increment Changelog

1. Verified Release Changelog

v0.1.0-inc1 - Increment 1: Core Roguelike & Surface Guild Foundation

Established 21x15 turn-based tactical 2D canvas grid with torchlight field-of-view (FOV) and exploration fog-of-war.

Implemented 5 playable classes (Fighter, Thief, Mage, Ranger, Paladin) with starter loadouts and active skills ([Q]).

Built persistent procedural dungeon floors (dungeon.floors[depth]) with BFS staircase reachability (< to >).

Implemented dual-economy extraction (at-risk Expedition Pack vs. safe Banked Guild Vault) via Floor 1 stairs and Recall Scrolls ([R]).

Added 5/5 automated diagnostic self-test suite.

v0.2.0-inc2 - Increment 2: 6-Slot Equipment, Rarity Affixes & Talent Trees

Added Schema v2 save migration and JSON Save Sync (export/import/download modal).

Expanded equipment to 6 paper-doll slots (weapon, armor, helm, boots, accessory, pickaxe) with live delta comparisons.

Built 5-tier procedural rarity engine (Common, Uncommon, Rare, Epic, Star-Forged Relic).

Added Training Hall with 3-tier class talent trees and gold respec.

Added ranged monster AI, Elite Champions (Vampiric, Molten, Venomous, Fortified), status effects (Burn, Bleed, Poison, Stun), and Web Audio procedural sound effects.

v0.3.0-inc3 & v0.3.1-inc3 - Increment 3: Dual-Cost Research Lab, 6 Ore Veins & Bosses

Upgraded to Schema v3 (v0.3.1-inc3) with full v1/v2 migration compatibility.

Implemented 6 mineral veins (Copper, Iron, Mithril, Relic Geode, Star-Crystal, Void Astralite) embedded exclusively in wall tiles bordering floor tiles.

Built 6 dual-cost Guild Research trees (Vault Cartography, Subterranean Geology, Dwarven Toolsmithing, Antiquarian Assay, Quartermaster Requisitions, Vanguard Recovery Pact).

Added Antiquarian Assay smelting/selling counter (#sell-catalog) with $+35\%/\text{rank}$ appraisal multiplier.

Added Floor 5 (Starfall Colossus) and Floor 10 (Void Weaver) milestone boss encounters with dedicated Boss HP HUD.

Expanded automated verification suite to 10/10 PASS.

v0.4.0-inc4 - Increment 4: Astral Gem Socketing, Guild Bounties & Tactical Vault Rooms

Upgraded to Schema v4 (v0.4.0-inc4) with full v1/v2/v3 migration compatibility on top of the modular ES6 src/ architecture.

Implemented 5 uncut Astral Gems (Ruby of Might, Emerald of the Wind, Sapphire of Will, Topaz of Dawn, Void Diamond) unearthed from Mithril, Relic Geode, Star-Crystal, and Void Astralite veins.

Added 1 to 2 Gem Sockets on Rare, Epic, and Star-Forged Relic equipment plus the Guild Astral Lapidary Bench (and inline Item Inspect socketing/extraction).

Added the Guild Notice Board offering 3 procedural contracts per descent (Monster Cull, Geological Quota, and Champion/Chest objectives) awarding bonus Vault Gold, Talent Tomes, and rare materials/gems upon extraction.

Added interactive Subterranean Astral Shrines (Celestial Renewal, Starfire Blessing, Astral Aegis) and Runic Spike/Flame Traps (spotted via Vision/DEX and safely disarmable by Thieves and Rangers) with guaranteed trap-free Pure-Floor BFS paths.

Expanded automated verification suite to 13/13 PASS.

v0.4.5-atlas - Multi-Dungeon Expedition Atlas & Exploration-Scale Maps

Upgraded to Schema v5 (v0.4.5-atlas) with lossless RLE floor compression, lazy active-dungeon hydration, world-map coordinate readiness (worldCoords), and full v1–v4 migration compatibility.

Implemented simultaneous persistent multi-dungeon registry (gameState.dungeons) featuring 4 curated Regional Dungeons (The Starfall Vaults 80x60, Sunken Copper Quarry 48x36, Whispering Mycelium Labyrinth 128x96, Citadel of the Fallen Star 192x144) plus an interactive Custom Expedition Charter Builder supporting custom Width x Height decoupled from maxDepth.

Built O(Sectors) multi-wing procedural floor generator supporting 4 architectural layout styles (masonry_vaults, excavation_quarry, crystalline_caverns, grand_ruins), pillared courts, 2-tile avenues, loop corridors, Motherlode ore seams, Guarded Treasure Vaults, 12 monster archetypes, and 4 boss archetypes.

Added O(21x15) frustum-culled scrolling camera, Bresenham raycast wall line-of-sight, live Sidebar Minimap (#minimapCanvas), [M] Full-Floor Cartographer's Survey Map Modal (#fullMapModal), and safe BFS Click-to-Travel Auto-Walk (interrupting immediately on hostile sight, spotted trap, or damage).

Expanded automated verification suite to 17/17 PASS.

v0.5.0-inc5 - Increment 5: Deep Abyssal Biomes, Floor 15/20 Bosses & Guild Bestiary Codex

Upgraded to Schema v6 (v0.5.0-inc5, storage key aethelgard_save_v6) with backward migration supporting v1–v5 saves.

Implemented 4 Distinct Visual Biomes by Depth & Curated Profile:
- Dwarven Catacombs (Floors 1-5 & Sunken Quarry)
- Crystalline Caverns (Floors 6-10 & Mycelium Labyrinth)
- Molten Forgeworks (Floors 11-15 & Molten Crucible)
- The Vespera Crater (Floors 16-20 & Citadel of the Fallen Star)
Each biome renders tailored 2D canvas wall fills, caps, bases, accents, torchlight tints, and dynamic minimap coloring.

Added 5th Curated Regional Dungeon: The Molten Forgeworks (molten_crucible, 96x72, 15 floors) featuring basalt chambers, slag pools, and heavy Mithril/Astral veins.

Added Deep Vault Milestone Bosses:
- Floor 15: Ignis, The Forge Tyrant (680 HP, 38 ATK, 20 DEF, Burn, guaranteed Relic equipment + 2 Astralite + Crimson Ruby)
- Floor 20: Vespera's Avatar, Heart of the Fallen Star (1050 HP, 48 ATK, 26 DEF, Weakened, guaranteed 2-socket Relic equipment + 3 Astralite + Void Diamond)

Implemented Guild Bestiary Codex & Hall of Records (gameState.codex):
- Tracks lifetime monsters slain, bosses fallen, elites vanquished, ores mined, gems unearthed, extractions, defeats, and deepest floor reached per dungeon.
- Star-Forged Relic discoveries archive logging legendary equipment finds.
- Hunter's Mastery: Slaying 5 foes of a monster archetype (or 1 boss) grants permanent +8% Mastery Damage against that archetype across all melee and class skills.
- Guild Hub Codex Tab (#guildTab_codex) with dynamic stat counters, deepest delvings, relic archive, and bestiary grid.

Expanded automated verification suite to 20/20 PASS + Headless UI Smoke Suite.

v0.5.1-inv - Inventory Intelligence, Upgrade Detection & Keep Locks

Implemented comprehensive inventory management and vault intelligence systems:
- Multi-Criteria Armory Sorting: Sort Vault Armory by Slot/Type, Rarity, Power Score, Gold Value, or Name with persistent UI setting (`gameState.uiSettings.armorySortBy`).
- Power Score Engine & Visual Upgrade Indicators: Computed power metric weighting attack, defense, health, mana, crit, dodge, core attributes, sockets, and durability. Renders visual `▲ UPGRADE` badge on superior gear.
- One-Click `Auto-Equip Best`: Evaluates highest-performing equipment across all 6 slots and automatically equips superior items while safely cycling old gear back to the Vault Armory.
- Keep / Lock Protection (`item.locked` / `🔒`): Granular toggle protecting favored equipment from accidental bulk liquidation in armory cards and inspect modals.
- Granular Bulk Auto-Sell: Fast liquidation by rarity tier (`Common`, `Uncommon`, `Rare`) or all unlocked gear with automatic gem socket extraction and Antiquarian Assay bonuses.

Expanded automated verification suite to 21/21 PASS + Headless UI Smoke Suite.

2. Upcoming Increment Backlog

Increment 6 (v0.6.0-inc6) - Guild Forge Runecrafting, Deep Affix Synthesis & Abyss Expeditions

Scope & Deliverables:
- Star-Forge Runecrafting & Affix Synthesis: Guild facility to re-roll item affixes or upgrade item rarity using star-ores and lapidary gems.
- Abyssal Affixes & Elite Modifiers: New monster modifier affixes (Reflective, Chilled, Temporal Warp) and enhanced procedural loot affixes.
- Endless Strata Delve Mode: Infinitely descending dungeon profile beyond Floor 20 with scaling monster danger and celestial vault rewards.
- Verification Gate: Bump to 23/23 PASS in runSelfTests().
