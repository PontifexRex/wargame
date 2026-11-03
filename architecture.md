Technical Architecture & Schema Contracts

Target File: index.html

Current Schema Version: v0.3.1-inc3

LocalStorage Key: aethelgard_save_v3 (with automatic fallback reads from aethelgard_save and aethelgard_save_v2)

1. Single-File Mandate & Code Layout

The application is strictly architected as a single-file HTML5 document (index.html) with zero external build steps, bundlers, or image/audio asset dependencies:

Styling: Tailwind CSS CDN paired with custom CSS variables (--bg-canvas, --bg-surface, --accent-gold, etc.) in a <style> block.

Graphics: Procedural 2D Canvas (#dungeonCanvas at 672x480, 32px tile size on a 21x15 grid, plus #heroPortraitCanvas at 42x42).

Audio: Procedural Web Audio API synthesizer (playSound(type)) using oscillators and gain ramps (hit, mine, spell, gold, lvl).

Modals: Custom HTML/CSS backdrop modals (#classSelectModal, #itemInspectModal, #diagnosticsModal, #saveSyncModal, #outcomeModal). Never use native alert() or confirm() dialogs.

Logical Sections Inside <script>

Constants & Static Registries: SCHEMA_VERSION, Tile IDs, RARITY, AFFIX_POOL, CLASSES, ORE_CATALOG, TALENT_TREES, RESEARCH_PROJECTS, SHOP_ITEMS, ELITE_AFFIXES.

State Initialization & Schema Migration: createDefaultGameState(), migrateSaveData(raw), saveGame(), loadGame().

Procedural Audio Engine: playSound(type), toggleAudio().

Loot & Derived Stat Engine: generateProceduralEquipment(), getPickaxeMaxDurability(), recomputeHeroDerivedStats().

Procedural Floor Generator & BFS Validator: generateFloor(depth), verifyPureFloorBFS(floor), carveDirectFloorPath(floor).

Core Gameplay Actions (Sandboxed): mineTile(), executeClassSkill(), useHealingTonic(), useRecallScroll(), extractToGuild(), handleHeroDefeat().

Guild Economy & Research Actions (Sandboxed): buyShopItem(), sellMineralUnit(), sellAllOresAtAssay(), sellArmoryItem(), sellAllSpareGear(), purchaseResearchRank().

Turn Loop & Combat Engine: handlePlayerAction(), processTurn(), attackMonster(), killMonster(), monsterAttackHero(), checkHeroFatalDamage().

Canvas 2D Renderer & FOV: updateFOV(), drawHeroSprite(), renderDungeonCanvas().

DOM UI Synchronizer: updateAllUI(), renderGuildHub(), renderDungeonHud().

Automated Self-Test Suite: runSelfTests(renderModal).

2. Sandboxed State Injection Pattern (Critical for Testing)

To allow runSelfTests() to execute real gameplay functions without mutating the player's active session, all state-mutating functions accept state = gameState as their final parameter:

function mineTile(x, y, state = gameState) { ... }
function executeClassSkill(state = gameState) { ... }
function purchaseResearchRank(projId, state = gameState) { ... }
function buyShopItem(itemId, state = gameState) { ... }
function sellMineralUnit(mineralId, sellAll = false, state = gameState) { ... }
function handleHeroDefeat(killerName = 'Abyssal Guardian', state = gameState) { ... }


Rule: Inside these functions, only trigger UI/DOM updates, audio effects, or saveGame() when state === gameState. When called with an isolated sandbox state (const sandbox = createDefaultGameState()), the function mutates sandbox silently and returns a structured result object (e.g., { ok: true, ... }).

3. Master State Schema (v0.3.1-inc3)

{
  "version": "v0.3.1-inc3",
  "turn": 0,
  "inGuild": true,
  "audioEnabled": true,
  "hero": {
    "name": "Fighter",
    "classId": "fighter",
    "level": 1,
    "xp": 0,
    "maxXp": 60,
    "statPoints": 0,
    "bonusStats": { "str": 0, "dex": 0, "int": 0, "vit": 0 },
    "hp": 186,
    "maxHp": 186,
    "mp": 59,
    "maxMp": 59,
    "atk": 28,
    "def": 16,
    "crit": 12,
    "dodge": 8,
    "visionRadius": 5,
    "talentPoints": 1,
    "talentsAllocated": { "f_a1": 1 },
    "consumables": { "potions": 2, "recalls": 1 },
    "equipment": {
      "weapon":    { "uid": "w_start_f", "name": "Iron Broadsword", "slot": "weapon", "rarity": "common", "atk": 8, "str": 2, "value": 20, "affixes": [] },
      "armor":     { "uid": "a_start_f", "name": "Riveted Mail", "slot": "armor", "rarity": "common", "def": 6, "vit": 1, "value": 20, "affixes": [] },
      "helm":      { "uid": "h_start_f", "name": "Iron Coif", "slot": "helm", "rarity": "common", "def": 2, "value": 12, "affixes": [] },
      "boots":     { "uid": "b_start_f", "name": "Heavy Sabatons", "slot": "boots", "rarity": "common", "def": 2, "value": 12, "affixes": [] },
      "accessory": { "uid": "acc_start_f", "name": "Vanguard Signet", "slot": "accessory", "rarity": "common", "atk": 1, "crit": 2, "value": 15, "affixes": [] },
      "pickaxe":   { "uid": "pick_start_f", "name": "Iron Pickaxe", "slot": "pickaxe", "rarity": "common", "curDur": 30, "maxDur": 30, "value": 25, "affixes": [] }
    },
    "expeditionPack": [
      { "id": "copper", "name": "Copper Ore", "val": 10, "qty": 3, "type": "Ore" }
    ],
    "expeditionGear": [],
    "statuses": [],
    "usedDivineIntervention": false,
    "x": 4,
    "y": 4
  },
  "dungeon": {
    "seedCode": "STAR-4821",
    "currentFloor": 1,
    "floors": {
      "1": {
        "depth": 1,
        "tiles": "2D Array [15][21] of Tile IDs",
        "upPos": { "x": 4, "y": 4 },
        "downPos": { "x": 16, "y": 11 },
        "monsters": [],
        "explored": "2D Boolean Array [15][21]",
        "oresMined": 0
      }
    }
  },
  "guildVault": {
    "gold": 35,
    "copper": 0,
    "iron": 0,
    "mithril": 0,
    "geode": 0,
    "starcrystal": 0,
    "astralite": 0,
    "armory": []
  },
  "guildResearch": {
    "cartography": 0,
    "geology": 0,
    "toolsmithing": 0,
    "assay": 0,
    "quartermaster": 0,
    "vanguard": 0
  }
}


4. Save Migration Contract (migrateSaveData)

Every new increment must bump SCHEMA_VERSION (e.g., v0.4.0-inc4) and update migrateSaveData(raw) so saves from Increment 1 (v0.1.x), Increment 2 (v0.2.x), and Increment 3 (v0.3.x) upgrade cleanly without losing progress:

Map legacy data.bank or data.guildVault properties into migrated.guildVault.

Map legacy data.bank.items arrays (copper_ore, iron_ore, etc.) into integer counters on guildVault.

Map legacy research keys (vault_cartography, max_depth, metallurgy_geology, pickaxe_temper, appraisal, vanguard_insurance) into the canonical 6 keys (cartography, geology, toolsmithing, assay, quartermaster, vanguard).

Ensure any newly introduced properties on hero, guildVault, or guildResearch are initialized with safe defaults if missing.

5. Procedural Map Generation & BFS Invariants

Grid Dimensions: GRID_W = 21, GRID_H = 15, TILE_SIZE = 32.

Non-Blocking Ore Veins: Ore veins (TILE_ORE_COPPER through TILE_ORE_GEODE, IDs 10–15) must only be placed on TILE_WALL (0) cells that are orthogonally adjacent to at least one TILE_FLOOR (1) cell. Never place an ore vein on a TILE_FLOOR corridor tile, as higher-tier ores require Geology Research to mine and would soft-lock players at Geology Rank 0.

Pure-Floor BFS Reachability (verifyPureFloorBFS): Every generated floor must verify that a path exists from upPos (<) to downPos (>) traversing only walkable tiles (TILE_FLOOR, TILE_STAIRS_UP, TILE_STAIRS_DOWN, TILE_CHEST, TILE_CHEST_OPEN). If random room placement fails this check, carveDirectFloorPath(floor) immediately carves an unobstructed corridor.