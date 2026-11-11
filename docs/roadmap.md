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

v0.6.0-inc6 - Increment 6: Abyssal Elite Affixes, Reactive Combat & Endless Strata Delve

Implemented advanced elite monster traits, deep equipment affixes, and infinite-descent delve mechanics:
- 4 New Abyssal Elite Affixes:
  - `Reflective`: Reflects 25% thorns damage directly back to the hero on melee/skill attack.
  - `Chilling`: Inflicts `chilled` status on hit (-15% Dodge, +2 Skill MP costs for 3 turns).
  - `Temporal Warp`: 40% chance on taking damage to phase-shift/teleport to an adjacent floor tile to break melee engagement.
  - `Volatile`: On-death detonation dealing 150% ATK damage in a 1-tile Chebyshev radius to hero and adjacent monsters.
- Abyssal Equipment Affixes: Added `thorns` (of Retaliation), `leech` (of the Blood Drinker), and `ward` (of Astral Warding) to procedural loot affix tables.
- 6th Curated Dungeon Profile (`abyssal_rift`, `dng_abyss`): Infinite 80x60 strata delve featuring cosmic void glass palette (`vespera_crater`), exponential depth scaling (`effDepth`), and recurring bosses every 5 floors beyond Floor 20.
- Deepest Delve Tracking: Codex Hall of Records displays deepest floor reached per dungeon, celebrating endless delve milestones.

Expanded automated verification suite to 22/22 PASS + Headless UI Smoke Suite.

v0.6.5-dev - Increment 6.5 Phase 1: Developer & Tester Console (Floor Warp & Hero Level Scaling)

Implemented an extensible, developer-only control interface and programmatic API (`window.Aethelgard.dev`) to rapidly test, stress, and balance any game system without grind or manual traversal:
- Developer Console UI Overlay (`#devConsoleModal`):
  - Toggled via backtick (`` ` ``) key, `Ctrl+Shift+D`, or header `#btnToggleDevConsole` badge.
  - Quick-Action Command Bar (Dungeon selector, Floor depth input, Hero level input, Full Heal, Reveal Map, God Mode).
  - Interactive Terminal REPL with persistent session command history (Up/Down arrow key recall).
- Instant Dungeon Floor Warp (`goto <depth> [dungeonId]` / `warp`):
  - Transports hero to any depth (1–999) across all 6 regional dungeons.
  - Automatically hydrates or procedurally generates the destination floor and safely positions hero on stairs up (`<`) or nearest walkable floor tile.
  - Refreshes viewport, dynamic biome palette, FOV shadowcasting, and minimap.
- Character Level & Stat Calibration (`level <targetLevel>`):
  - Instantly sets hero level (1–100) with proper XP curve recalculation.
  - Awards correct stat points (+2 per level) and talent points (+1 per level).
  - Recomputes derived stats (`recomputeHeroDerivedStats`) and fully refills HP and MP.
- Developer Cheats & Utilities:
  - Full Heal (`heal`): Cleanses negative debuffs and restores 100% HP/MP.
  - Map Reveal (`reveal` / `map`): Fully uncovers the fog-of-war for the current floor chart.
  - God Mode (`god`): Grants complete damage immunity in combat.
- Programmatic Bridge (`window.Aethelgard.dev`):
  - Full API exposure on `Aethelgard.dev` and direct console execution.
- Verification Gate:
  - Sandboxed **Test 23** in `src/test/selfTest.js` verifying warp, level scaling, cheats, and REPL.
  - Expanded automated verification suite to **23/23 PASS** + UI Smoke Suite + 25-seed fuzzer pass.

v0.7.0-ux1 - Increment 7.0: Character Paper-Doll Inventory Screen, Floating Stat Comparison Tooltips & Corridor Fast-Run

Delivered comprehensive character sheet and inventory ergonomics:
- **Full Anatomical Character Paper-Doll & Inventory Management Modal (`[I]` / `[C]` / `#inventoryModal`)**:
  - Two-column modal accessible from keyboard hotkeys `[I]` / `[C]`, the top header bar, or tactical action bar.
  - Left Column: Visual hero portrait, identity, vitals (HP, MP, Pickaxe Durability), core attributes (STR, DEX, INT, VIT, ATK, DEF, CRIT, DODGE), and **Anatomical Paper-Doll Mannequin Stage** (`#inventoryPaperDollCanvas` + `#inventoryPaperDollGrid`).
    - Renders central anatomical mannequin figure with class color aura, runic dais, breastplate contours, and visor slit.
    - 6 active slots anatomically placed around the hero: Head (`Helm` 🪖), Torso (`Armor` 🦺), Main Hand (`Weapon` ⚔️), Off-Hand (`Pickaxe` ⛏️), Neck (`Accessory` 💍), Feet (`Boots` 👢).
    - 4 reserved future equipment slots rendered with locked watermarks: Neck/Right (`Amulet` 📿), Wrist/Hands (`Gloves` 🧤), Waist (`Belt` 🎗️), Finger (`Ring` 💍).
    - One-click `✕` unequip button on active slots, click-to-inspect, and hover stat comparison tooltips.
  - Right Column: Filterable Bag Gear (`All`, `Weapons`, `Armor`, `Accessories`) and Consumables/Minerals list.
  - Equip / Swap: Instant field equipping of weapons and armor from the pack or armory with automatic stat delta recomputation and returning replaced items to the bag.
  - Unequip: Unequip any worn piece to the bag/armory (pickaxes protected from direct unequip to safeguard mining capability).
  - Drop / Discard: Drop unwanted items from the pack to clear clutter.
  - Strict Economy Boundary: Selling/liquidating items for gold is strictly prohibited while inside the dungeon (`!gameState.inGuild`).
- **Upfront Item Type Icons Across All Inventories (`getItemTypeIcon`)**:
  - Immediate visual type identification prefixing item names: `🦺` Armor, `⚔️` Weapon, `🪖` Helm, `👢` Boots, `💍` Accessory/Ring, `⛏️` Pickaxe, `🛡️` Shield, `🧤` Gloves, `📿` Amulet, `🎗️` Belt, `🧪` Healing Tonic, `📜` Astral Recall, `🪨` Ores/Minerals, `◆` Gems.
  - Applied across Bag List, Pack Consumables, Sidebar Paper-Doll, Expedition Pack, Vault Armory, and Quartermaster Shop.
- **Floating Hover Comparison Tooltip (`#floatingItemTooltip`)**:
  - Glassmorphic floating tooltip triggered on hovering over items in the inventory bag, armory, or paper-doll.
  - Renders upfront item icon, rarity, power score, primary stats with side-by-side green `▲ +X` and red `▼ -Y` deltas comparing directly against the equipped item in that slot, plus socketed gems and rolled affixes.
- **Corridor Fast-Run (`Shift + Direction` / `runCorridor`) & Numpad Movement**:
  - Holding `Shift + WASD / Arrow` (or Numpad keys) triggers smooth corridor fast-running up to 50 steps.
  - Automatically halts on: hostile sighted in FOV, trap spotted, damage taken, reaching a landmark (Stairs, Chest, Shrine), adjacent unmined ore vein, or reaching a corridor intersection/room.
  - Full Numpad 8-direction movement + `Numpad5` wait.
- **Verification Gate**:
  - Added Sandboxed **Test 24** in `src/test/selfTest.js` verifying field equip/swap, unequip, drop, in-dungeon selling prohibition, corridor run, upfront item icons, canonical slot definitions, and anatomical paper-doll rendering.
  - Expanded automated verification suite to **24/24 PASS** + Headless UI Smoke Suite + 10-seed fuzzer pass.

v0.7.1-art - Increment 7.1: Visual Overhaul & Class Artistry (5 Class Sprites, 2.5D Ashlar Wall Masonry & Drop-Shadows)

Delivered complete visual overhaul, artisanal character sprites, and 2.5D dungeon environments:
- **5 Handcrafted Playable Class Sprites (`drawHeroSprite`)**:
  - Distinct pixel-vector artwork across all 5 classes on the tactical canvas, HUD portrait, Class Select cards, and Inventory Paper-Doll:
    - **Fighter** (Ironclad Vanguard): Horned iron greathelm with glowing amber visor slit, steel cuirass with gold trim, flowing crimson cape, iron heater shield with red heraldic chevron, and steel broadsword with blade fuller.
    - **Thief** (Shadowblade): Deep midnight shadow shroud cape, studded leather doublet with emerald rivets and poison vial pouch, rogue cowl with lower face mask, piercing emerald eyes, reverse-grip serrated poison stiletto, and forward-grip curved assassin dagger.
    - **Mage** (Astral Elementalist): Trailing astral cobalt robes with cyan celestial hem and sash, pointed wizard hat with gold band, shadowed face with sapphire astral eyes, active swirling azure spell-flame orb, and gnarled rowan staff capped with a floating diamond star crystal prism.
    - **Ranger** (Hawkeye Scout): Woodland camo cloak, diagonal leather quiver with feather arrow fletchings, flexible boiled leather tunic with leaf green trim, archer's peaked cowl with hawk feather crest and keen hawk-eyes, curved recurve longbow, and notched steel arrowhead.
    - **Paladin** (Radiant Crusader): Winged greathelm with incandescent golden visor cross, radiant 4-point golden sunburst halo floating above head, polished silver plate mail, white tabard emblazoned with a radiant golden sun cross, towering sun kite shield, and righteous golden warhammer.
- **Class-Defining Paper-Doll Mannequin Stages (`drawPaperDollMannequin`)**:
  - Tailored silhouetted class features on the inventory mannequin: horns & crimson cape (Fighter), peaked cowl tip & shadow shroud (Thief), tall wizard hat cone & swirling mana orb (Mage), archer's cowl with hawk feather & quiver strap (Ranger), and radiant sun halo & sun cross breastplate (Paladin).
- **Interactive Class Select Modal Overhaul (`#classSelectModal`)**:
  - Live `<canvas>` portrait rendering in each archetype card showcasing all 5 classes with their handcrafted vector sprites.
- **2.5D Dungeon Walls & Biome Masonry**:
  - 8px top wall ledge (cap) with specular highlight and separation shadow groove.
  - 24px vertical stone wall face with 2-course running-bond Ashlar brickwork and staggered mortar joints.
  - Distinct biome masonry accents: chiseled dwarven runic mason marks (Dwarven Catacombs), bioluminescent quartz crystal glints in mortar seams (Crystalline Caverns), glowing magma fissures seeping through basalt blocks (Molten Forgeworks), and cosmic stardust void crystal facets (The Vespera Crater).
  - Faceted mineral crystal geodes bursting from walls for all 6 ore types (`TILE_ORE_*`).
- **High-Fidelity Floor Flagstones & Ambient Occlusion Drop-Shadows**:
  - 2x2 stone flagstone pavers per floor tile with recessed mortar lines and deterministic hairline fissures.
  - Real-time ambient occlusion drop-shadows cast onto floor tiles bordering walls to the North (3-tier soft shadow gradient) and West (soft edge shadow).
- **3D Landmark Props**:
  - 4-tier beveled stone staircase with glowing emerald guide runes and ascending beacon portal (`<` / `TILE_STAIRS_UP`).
  - 4-tier subterranean abyss staircase receding into the dark with glowing cyan abyss light (`>` / `TILE_STAIRS_DOWN`).
  - 3D domed banded gilded oak vault chests with padlock (closed) and glittering treasure piles (opened).
  - Stepped runic dais shrines with hovering celestial diamond prisms.
- **Verification Gate**:
  - Added Sandboxed **Test 25** in `src/test/selfTest.js` verifying 5-class sprite rendering, mock canvas drawing operations, 2.5D wall/shadow contracts across all 4 biomes, and class-defining paper-doll mannequins.
  - Expanded automated verification suite to **25/25 PASS** + Headless UI Smoke Suite + 10-seed fuzzer pass.

2. Upcoming Increment Backlog

### Iteration 3 (v0.7.2-tactical) — Tactical Combat Overlays & Chronicle Polish

Scope & Deliverables:
- Skill Range & Target Preview Reticle: Visual overlay on 2D canvas showing skill reach and targeted monsters before spending MP.
- Threat & Status Telegraphs: Status icons (`🔥`, `🩸`, `❄️`, `💫`) and ranged indicators on monster tiles with smooth visual lunge animations.
- Filterable Expedition Chronicle: Quick filter tabs (`All` | `Combat` | `Loot`) and message grouping.

---

### Future Backlog: Monster/Object Refactor, Dev Spawner (6.5) & Star-Forge Runecrafting (Inc 8)

- **Monster & Object Schema Refactor**: Unified entity component architecture.
- **Developer Spawner (v0.6.5 Phase 2)**: Entity and item spawner matching the refactored schema.
- **Guild Star-Forge Runecrafting**: Dual-affix runestones, socket punching, and affix re-rolling.
