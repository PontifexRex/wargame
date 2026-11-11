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

v0.7.2-tactical - Increment 7.2: Tactical Combat Overlays & Chronicle Polish

Delivered responsive combat feedback, tactical skill previews, threat telegraphs, and chronicle filtering:
- **Tactical Skill Range & Target Preview Reticle (`getSkillTargetingInfo` / `setSkillHover`)**:
  - Non-destructive targeting evaluation checking line-of-sight, Chebyshev/Euclidean distance, floor geometry, and MP affordance without consuming MP or turns.
  - Hovering the tactical skill button (`#btnTacticalSkill`) or pressing `[Q]` when skill criteria are unmet renders a circular reach zone overlay on the 2D canvas with dashed targeting perimeter.
  - Animated pulsing reticle (`TARGET` badge, diamond brackets, crosshairs, and impact splash indicator) locks onto targeted hostiles.
  - Distinct class targeting behaviors: Paladin Holy Smite (adjacent melee focus), Fighter Whirlwind Cleave (360° adjacent reach circle), Mage Starfall Nova (4-tile radiant astral burst), Ranger Starfall Volley (5-tile pierced projectile salvo targeting closest foes), Thief Shadowstep Strike (3-tile line-of-sight leap with glowing `LEAP` destination tile highlight).
- **Overhead Threat & Status Telegraph Badges**:
  - Compact overhead badges displayed on active monsters: `burn` (🔥), `bleed` (🩸), `poison` (🧪), `stun` (💫), `chilled` (❄️), `weakened` (⚡).
  - Adjacent Melee Threat Alert: Animated red warning chevron (`▲`) pulsing overhead on monsters threatening the hero's position.
  - Ranged Aim Laser Lines: Animated crimson dashed targeting lines connecting ranged foes (`isRanged`) to the hero when line-of-sight is unobstructed.
- **Micro-Combat Displacement & Impact Animations**:
  - Smooth directional hero lunge animation displacing the hero sprite toward the target during basic melee attacks and active skills.
  - Animated combat impact effects: dynamic white/amber slash arcs for melee strikes, golden bursting star novas for critical hits, radiant holy bursts for smites, and projectile tracers for ranged combat.
- **Filterable Expedition Chronicle & Deduplication Engine**:
  - 4 Category Filter Tabs on Chronicle card: `All` | `Combat` (⚔️) | `Loot` (💎) | `System` (📜).
  - In-memory event ledger (`chronicleHistory`) storing turn, message, tone, category, and repeat count.
  - Automatic category inference (`inferChronicleCategory`) with regex word-boundary matching.
  - Consecutive identical message deduplication grouping repetitive attack, miss, and mining messages with visual `(xN)` badge to eliminate log clutter.
- **Verification Gate**:
  - Added Sandboxed **Test 26** in `src/test/selfTest.js` verifying pure non-destructive skill targeting preview across classes, zero-MP validation block, status & threat telegraphs, chronicle category auto-inference, consecutive grouping, and filter switching.
  - Expanded automated verification suite to **26/26 PASS** + Headless UI Smoke Suite.

v0.8.0-objects - Increment 8.0: Foundational Game Object Model, Interaction Pipeline & Ground Pickups

Delivered the foundational game object architecture, unified interaction pipeline, item stacking, and physical ground pickups:
- **Object Definition & Runtime Instance Architecture (`src/data/definitions.js`, `src/engine/objects.js`)**:
  - Strict separation between immutable authored templates (`ObjectDefinition`, `ItemDefinition`, `WorldObjectDefinition`) and mutable runtime instances (`RuntimeObject`, `ItemInstance`, `WorldObjectInstance`, `WorldItemPickupInstance`).
  - Extensible component and capability model (`Interactable`, `Usable`, `Equippable`, `Traversable`, `Damageable`, `Destructible`, `Lockable`, `Container`, `TrapBearing`, `Discoverable`, `Permeable`).
  - Spatial floor object layer (`floor.objects` with `getObjectsAt(floor, x, y)`, `addWorldObject`, `removeWorldObject`) decoupling interactive entities from raw scalar terrain tiles.
  - Full RLE and JSON save persistence integration (`compression.js`) with lossless packing and automatic legacy floor object hydration (`hydrateLegacyFloorObjects`).
- **Unified Interaction Pipeline (`src/engine/interactions.js`)**:
  - Standardized `InteractionRequest` -> composable boolean `Requirement` evaluation (`AND`, `OR`, `NOT`, `hasItemTag`, `hasItemDef`, `minStat`, `minSkill`, `requiredClass`, `objectState`) -> separated `Cost` deduction -> atomic `Effect` runner -> `InteractionResult`.
  - Decoupled domain event emission (`ENGINE_EVENTS.OBJECT_INTERACTION`, `OBJECT_STATE_CHANGED`, `ITEM_PICKED_UP`, `ITEM_DROPPED`).
- **ItemStack Stacking Engine**:
  - Smart stack compatibility (`canItemsStack`, `mergeItemStacks`, `splitItemStack`) allowing consumables, keys, and materials to stack cleanly while strictly preserving unique instance identity for rolled/socketed equipment.
- **Physical Ground Pickups & In-Dungeon Dropping/Gathering**:
  - Dropping an item in a dungeon (`dropItem`) creates a physical `WorldItemPickupInstance` on the dungeon floor.
  - Stepping onto a tile with ground loot automatically collects it into inventory (`pickupGroundObjectsAt`), respecting stacking rules and triggering audio/floating text.
  - Rendered on the 2D tactical canvas with drop-shadow, rarity glow ring, and upfront item type icon (`getItemTypeIcon`).
- **Verification Gate**:
  - Added Sandboxed **Test 27** in `src/test/selfTest.js` verifying definition/instance separation, spatial floor indexing, item stacking/splitting, requirement/cost execution pipeline, physical pickup creation/resolution, and legacy floor auto-migration.
  - Expanded automated verification suite to **27/27 PASS** + Headless UI Smoke Suite.

v0.8.1-doors - Increment 8.1: Multi-State Door System, Environmental Permeability Matrix & Lock-and-Key Generation

Delivered the multi-dimensional state door system, tactical permeability raycasting, bump interactions, procedural choke point placement, and lock-and-key generation:
- **5 Door Definitions & Multi-Dimensional State Engine (`src/data/definitions.js`, `src/engine/objects.js`)**:
  - Registered 5 distinct door templates: `door_wood_hinged` (sturdy oak with iron bands), `door_iron_reinforced` (riveted iron plates with heavy lock), `door_iron_portcullis` (wrought-iron see-through grate), `door_vault_ancient` (massive celestial dwarven brass & mithril vault door), `door_secret_stone` (chiseled stone wall panel).
  - Multi-state axes: `mechanical` (`open`, `closed`, `jammed`), `security` (`unlocked`, `locked`, `sealed`), `structural` (`intact`, `damaged`, `critically_damaged`, `destroyed`), `discovery` (`revealed`, `unknown`), `power` (`unpowered`, `powered`).
  - Helper query functions: `createDoorInstance`, `isDoorWalkable`, `isDoorOpaque`, `isDoorTraversable`.
- **Environmental Permeability Matrix & Bresenham Raycasting**:
  - Fine-grained permeability axes: `movement`, `lineOfSight`, `light`, `sound`, `projectiles`, `magic`.
  - Tactical Portcullis Permeability: Blocks physical footsteps (`movement: false`), but allows full line of sight (`lineOfSight: true`) and projectile/spell targeting through the iron bars (`projectiles: true`, `magic: true`).
  - Integrated into `hasLineOfSight(floor, x0, y0, x1, y1)` in `src/engine/combat.js` and viewport rendering in `src/ui/renderer.js`.
- **Bump Auto-Open, Key Unlock & Monster Collision**:
  - Walking into an unlocked closed door (`handlePlayerAction`) auto-opens the door and updates its permeability without consuming turn movement onto the tile.
  - Walking into a locked door checks hero inventory for the matching key (`keyTag`). If held, unlocks and opens the door; if missing, provides immediate floating and chronicle feedback (`Locked!`).
  - Monsters in `processTurn` respect door permeability and cannot path through closed doors.
- **Thief Lockpicking, Fighter Bashing & Secret Door Perception**:
  - Thief and high-dexterity characters can pick locks (`pick_lock` action).
  - Destructible doors can be physically bashed (`bash` action). When durability reaches 0, the door transitions to `structural: 'destroyed'`, `mechanical: 'open'`, becoming permanently walkable rubble.
  - Secret stone doors (`door_secret_stone`) spawn with `discovery: 'unknown'`, rendering identically to biome wall masonry. Scouts (Thief/Ranger) and high-perception heroes automatically reveal hidden doors in `detectNearbyTraps`.
- **Procedural Choke Point Placement & Lock-and-Key Placement (`src/engine/procedural.js`)**:
  - Automatically identifies room-corridor doorways (floor tiles bordered by opposing walls) and places doors.
  - Guarded Treasure Vaults (`vaults`) spawn with locked security doors (`door_iron_reinforced` / `door_vault_ancient`) and matching keys placed in accessible exploration rooms outside the vault, strictly preserving progression solvability.
- **2D Tactical Canvas & Minimap Visuals (`src/ui/renderer.js`)**:
  - Custom canvas rendering for all 5 door types: timber oak with iron bands, reinforced steel plates with rivets, iron portcullises with pointed chisel teeth, circular brass dwarven astrolabe dials, glowing cyan runic seam secret doors, swung-open door jambs, and fractured rubble splinters.
  - Doors rendered on minimap with distinct markers (amber for closed, gold for locked vault doors).
- **Verification Gate**:
  - Added Sandboxed **Test 28** in `src/test/selfTest.js` verifying door definitions, multi-state axes, portcullis vision permeability, bump auto-open, key unlock, Thief lockpicking, Fighter bashing, secret door discovery, and procedural door generation.
  - Expanded automated verification suite to **28/28 PASS** + Headless UI Smoke Suite.

---

## 2. Long-Term Game Vision & Strategic Pillars

**Aethelgard** is designed as a hybrid **Grand Strategy Wargame, Real-Time City Builder, and Tactical Procedural Dungeon RPG**. While multiplayer and production server infrastructure are deferred until the core game is complete, the single-player/local architecture is structured around the full domain model ("Start-With-One, Scale-To-Many": `1 Universe -> 1 World -> 1 Player -> 1 City -> 1 Hero/Party` initially, scaling cleanly to `N`).

### Core Design Principles
1. **True Strategic Wargame with a Definitive Goal**:
   - Worlds have a defined campaign victory condition (~1+ year duration) rather than running aimlessly forever.
   - Winning requires strategy, planning, timed alliance coordination, and tactical combat skill—not just raw stat strength or passive resource hoarding.
   - **Deception & Fog-of-War**: Long-range warfare is deliberate, with low troop intelligence enabling feints/fake attacks and rewarding skilled defenders.
2. **Low-Penalty Honorable War & Divine Reimbursement**:
   - To encourage active warfare rather than turtling, losing a battle carries strategic rather than catastrophic personal consequences.
   - **Favor of the Gods**: Engaging in honorable war grants divine reimbursement and rapid rebuilding support.
   - **Anti-Bullying Scaling**: Rewards scale significantly higher when fighting stronger opponents; attacking much weaker players yields minimal gains.
3. **Playstyle-Aligned Guild Archetypes & Alliances**:
   - **War Guilds**: High-activity, coordinated alliance warfare and territory control.
   - **Adventurers Guilds**: Geared toward solo and small-party dungeon delving, relic discovery, and hero mastery.
   - **Social / Low-Pressure Guilds**: Relaxed cooperative city growth and trade without punitive contribution quotas.
   - Multiple guilds form **Alliances** to win the world; non-aligned specialist guilds can also earn shared victory credit by contributing critical endgame milestones (such as forging a required victory artifact).
4. **Fair, Non-P2W Economy**:
   - Reasonable subscription-first model supplemented by cosmetics, minor conveniences, and optional guild/alliance pool contributions—never dependent on whales.
5. **Hybrid Gameplay Loops (Always Something Meaningful to Do)**:
   - **Real-Time Overworld & Multi-City Management**: Settling cities, managing city building grids, real-time construction queues, harvesting/trading world resources (`Wood`, `Stone`, `Gold`, `Minerals`), and marching parties across the world map.
   - **Turn-Based Procedural Dungeons**: Deep roguelike exploration with Hero-led multi-class parties to acquire rare equipment, artifacts, and experience.
   - **Idle / Upgrade Sub-Systems**: Progressive automation and resource efficiency upgrades interwoven with active play.
6. **Incremental Discovery, Guided Tutorial & Reward Tasks**:
   - Systems unlock progressively so new players are never overwhelmed, guided by optional contextual tutorials and non-linear **Tasks/Missions** that grant early progression rewards.

---

## 3. Upcoming Increment Roadmap (`v0.8.x` – `v1.0.x+`)

### Track A: Foundational Game Object, Item, Door & Portal Architecture (`v0.8.x` Series — `ADR-0010`)

#### Increment 8.1 (`v0.8.1-doors`) — Multi-State Door System, Permeability & Lock-and-Key Generation (Phases 3–4)
- **Physical & Magical Door Types (`DoorDefinition` / `DoorInstance`)**:
  - **Wooden Door** (hinged, low HP, bashable), **Reinforced Iron Door** (key/lockpick/high-STR bash), **Iron Portcullis** (lever/mechanism operated, blocks movement but allows line-of-sight and ranged attacks!), **Ancient Vault Door** (multi-lock), **Rune-Sealed Barrier** (magic/dispel), and **Concealed Secret Door** (`discovery: unknown -> revealed`, blends into 2.5D wall masonry until spotted/searched).
- **Orthogonal State Axes & Environmental Permeability**:
  - Independent `mechanical` (`closed`/`open`/`jammed`), `security` (`unlocked`/`locked`/`sealed`), `discovery` (`unknown`/`revealed`), and `structural` (`intact`/`damaged`/`breached`/`destroyed`) states.
  - Dynamic permeability integration with `hasLineOfSight`, `updateFOV` torchlight raycasting, ranged combat projectiles, and monster AI pathfinding.
- **Multi-Solution Door Interactions**:
  - Context actions: `Open`, `Close`, `Inspect`, `Unlock (Key)`, `Pick Lock` (Thief/DEX), `Force / Bash` (STR/Weapon damage vs. door HP/Armor), `Disarm Trap`, and `Barricade`.
- **Lock-and-Key Procedural Generation**:
  - Places doors at room-corridor choke points, treasure vaults, and secret alcoves.
  - Upgrades `verifyPureFloorBFS` into a **Progression Graph Validator** guaranteeing keys/levers spawn upstream of the locked doors they control (zero soft-locks).

#### Increment 8.2 (`v0.8.2-portals`) — Portal System, Portal Networks & Expanded Monster/Object Spawner (Phases 5–6 + Dev 6.5 Phase 2)
- **Portal & `PortalNetwork` System (`PortalDefinition` / `PortalInstance`)**:
  - Shared `ITraversable` contract across Doors, Stairs, and Portals.
  - **Dungeon Entrance/Exit Portal**, **Unstable Astral Rift** (charge-limited/stability-degrading shortcuts), and **Ancient Waypoint Network** (discoverable multi-endpoint fast travel within/across dungeons).
- **Developer Console Phase 2 (Entity, Object, Door & Item Spawner)**:
  - Interactive spawner built natively on top of the new `ObjectDefinition` and `MONSTER_ARCHETYPES` registries (`spawn monster`, `spawn door`, `spawn item`, `spawn key`, `spawn portal`).

---

### Track B: Overworld Map, Settler Onboarding, City Builder & Real-Time Loop (`v0.9.x` Series — `ADR-0011`)

#### Increment 9.0 (`v0.9.0-overworld`) — Overworld Map, Settler Unit, City Founding & Guided Task System
- **Macro State Hierarchy (`universe -> world -> overworld -> cities -> parties`)**:
  - Overworld terrain grid with resource nodes (`Wood` forests, `Stone` outcrops, `Ore` hills), fog-of-war, and coordinates.
- **First-15-Minutes Settler Onboarding**:
  - Start on Overworld Map controlling a **Settler** at a valid unoccupied location (with safe respawn if killed before settling).
  - **Guided Tutorial & Task System**:
    - *Task 1 ("Settle Your First City")*: Founding City #1 on the Overworld map awards `50 Wood` and `50 Stone`.
- **City Grid & Real-Time Build Queue**:
  - City interior grid view with a real-time **Build Queue** (1 slot initially).
  - *Task 2 ("Build the Adventurers Guild Hall")*: Costs `50 Wood, 50 Stone` (~30s real-time build timer).
  - Completing the Adventurers Guild Hall unlocks the Hero and reveals the first **Dungeon Entrance** on the Overworld map.
- **Real-Time Overworld March & Dungeon Transition**:
  - Selecting a destination on the Overworld marches the party in real-time (~10s per grid tile).
  - Exiting a dungeon via Floor 1 Stairs places the party at the Overworld Dungeon Entrance and automatically begins the march back to the City; dungeon defeat returns directly to the City's Adventurers Guild Hall.

#### Increment 9.1 (`v0.9.1-city-economy`) — City Buildings, Resource Production & Guild Star-Forge
- **Expanded City Buildings**:
  - Resource producers (**Sawmill** for Wood, **Stoneworks** for Stone, **Smeltery** for Ores), **Warehouse**, **Barracks**, **Temple of War** (Divine War Reimbursement mechanics), and **Star-Forge**.
- **Guild Star-Forge Runecrafting**:
  - Craft equipment, punch sockets, and re-roll affixes using dungeon minerals and city resources.

---

### Track C: Multi-Hero Parties, Guild Playstyles & Tactical Warfare (`v1.0.x+` Series)
- **Multi-Member Hero Parties**: Parties led by a Hero with multiple class members entering dungeons and tactical battles together.
- **Guild Archetype Specializations**: Distinct configurations for **Adventurers Guilds**, **War Guilds**, and **Social Guilds**.
- **Tactical Overworld Warfare, Alliances & World Victory Arc**: Timed marches, feints/fog-of-war intel, city defense, Divine War Reimbursement, and endgame Alliance victory objectives.
