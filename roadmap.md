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

2. Upcoming Increment Backlog

Increment 4 (v0.4.0-inc4) - Astral Gem Socketing, Guild Bounties & Tactical Vault Rooms

Scope & Deliverables:

Astral Gem Socketing & Lapidary Bench:

Mining high-tier veins (Mithril, Relic Geode, Star-Crystal, Void Astralite) has a chance to yield uncut Astral Gems (Ruby of Might, Emerald of the Wind, Sapphire of Will, Topaz of Dawn, Void Diamond).

Rare, Epic, and Star-Forged Relic equipment roll 1 to 2 Gem Sockets. Players can socket/unsocket gems at the Guild Lapidary Bench.

Guild Notice Board (Procedural Bounty Contracts):

New Guild tab offering 3 active contracts per descent (e.g., Slay 5 Vault Crawlers, Mine 4 Iron Ore, Vanquish an Elite Champion).

Completing bounties awards bonus Vault Gold, Talent Tomes, or rare crafting materials upon extraction.

Interactive Subterranean Shrines & Tactical Traps:

Procedural floors spawn Astral Shrines (granting temporary floor buffs or healing) and Runic Spike/Flame Traps (spotted via Vision/DEX and disarmable by Thieves/Rangers).

Verification Gate: Bump to 13/13 PASS in runSelfTests().

Increment 5 (v0.5.0-inc5) - Deep Abyssal Biomes, Floor 15/20 Bosses & Bestiary Codex

Scope & Deliverables:

Distinct Visual Biomes by Depth:

Floors 1-5: Dwarven Catacombs (slate masonry)

Floors 6-10: Crystalline Caverns (indigo & quartz walls)

Floors 11-15: Molten Forgeworks (basalt & magma veins)

Floors 16+: The Vespera Crater (cosmic void masonry)

Deeper Boss Encounters:

Floor 15 Boss: Ignis, The Forge Tyrant

Floor 20 Boss: Vespera's Avatar, Heart of the Fallen Star

Guild Bestiary & Hall of Records:

Tracks total monsters slain, deepest floor reached, total ores mined, and unlocked Star-Forged Relics.

Verification Gate: Bump to 16/16 PASS in runSelfTests().