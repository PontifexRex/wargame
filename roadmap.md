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

2. Upcoming Increment Backlog

Increment 5 (v0.5.0-inc5) - Deep Abyssal Biomes, Floor 15/20 Bosses & Bestiary Codex

Scope & Deliverables:

Distinct Visual Biomes by Depth & Profile:

Dwarven Catacombs (slate masonry)

Crystalline Caverns (indigo & quartz walls)

Molten Forgeworks (basalt & magma veins)

The Vespera Crater (cosmic void masonry)

Deeper Boss Encounters:

Floor 15 Boss: Ignis, The Forge Tyrant

Floor 20 Boss: Vespera's Avatar, Heart of the Fallen Star

Guild Bestiary & Hall of Records:

Tracks total monsters slain, deepest floor reached per dungeon, total ores mined, and unlocked Star-Forged Relics.

Verification Gate: Bump to 20/20 PASS in runSelfTests().
