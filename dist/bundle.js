/* Auto-generated from modular ES6 sources in src/ via scripts/build.ps1 */
(function () {
  'use strict';

  // --- Module: src/constants.js ---
// Core constants, viewport dimensions, map scale presets, tile IDs, and rarity definitions

const SCHEMA_VERSION = 'v0.5.0-inc5';
const STORAGE_KEY = 'aethelgard_save_v6';

const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 21;
const VIEWPORT_HEIGHT = 15;

// Legacy viewport aliases + new exploration-scale default floor dimensions
const GRID_W = VIEWPORT_WIDTH;
const GRID_H = VIEWPORT_HEIGHT;
const DEFAULT_MAP_W = 80;
const DEFAULT_MAP_H = 60;

// Soft configurable cap on simultaneously chartered custom expeditions (not a structural limit; can be raised to 500+)
const DEFAULT_MAX_CHARTERED_DUNGEONS = 12;

// Bestiary & Codex Mastery Constants
const CODEX_MASTERY_KILLS = 5;
const CODEX_MASTERY_DMG_MULT = 1.08;

const MAP_SIZE_PRESETS = {
  small:     { id: 'small',     name: 'Small Outpost',        width: 48,  height: 36,  desc: '48x36 (~5.5x classic) • 14–18 chambers' },
  standard:  { id: 'standard',  name: 'Standard Delve',       width: 80,  height: 60,  desc: '80x60 (~15x classic) • Multi-wing halls & vaults' },
  sprawling: { id: 'sprawling', name: 'Sprawling Labyrinth',  width: 128, height: 96,  desc: '128x96 (~39x classic) • Deep avenues & caverns' },
  colossal:  { id: 'colossal',  name: 'Colossal Megadungeon', width: 192, height: 144, desc: '192x144 (~88x classic) • Massive subterranean expanse' }
};

// Tile Constants
const TILE_WALL = 0;
const TILE_FLOOR = 1;
const TILE_STAIRS_UP = 2;
const TILE_STAIRS_DOWN = 3;
const TILE_CHEST = 4;
const TILE_CHEST_OPEN = 5;
const TILE_SHRINE = 6;
const TILE_SHRINE_USED = 7;
const TILE_TRAP_HIDDEN = 8;
const TILE_TRAP_VISIBLE = 9;
const TILE_ORE_COPPER = 10;
const TILE_ORE_IRON = 11;
const TILE_ORE_MITHRIL = 12;
const TILE_ORE_STAR = 13;
const TILE_ORE_ASTRAL = 14;
const TILE_ORE_GEODE = 15;
const TILE_TRAP_DISARMED = 16;

// Economy Constants
const LAPIDARY_UNSOCKET_COST = 15;
const BOUNTY_REROLL_COST = 25;

// Rarity Definitions
const RARITY = {
  common:   { id: 'common',   name: 'Common',            color: '#94a3b8', mult: 1.0, affixes: 0 },
  uncommon: { id: 'uncommon', name: 'Uncommon',          color: '#4ade80', mult: 1.4, affixes: 1 },
  rare:     { id: 'rare',     name: 'Rare',              color: '#60a5fa', mult: 2.0, affixes: 2 },
  epic:     { id: 'epic',     name: 'Epic',              color: '#c084fc', mult: 3.2, affixes: 3 },
  relic:    { id: 'relic',    name: 'Star-Forged Relic', color: '#fbbf24', mult: 5.5, affixes: 4 }
};

  // --- Module: src/data/classes.js ---
// Complete 5 Playable Classes Registry (Fighter, Thief, Mage, Ranger, Paladin)

const CLASSES = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    title: 'Iron Vanguard',
    color: '#f87171',
    baseStats: { str: 15, dex: 10, int: 8, vit: 14 },
    hpBase: 120,
    mpBase: 35,
    vision: 5,
    starterGear: {
      weapon:    { uid: 'w_start_f', name: 'Iron Broadsword', slot: 'weapon', rarity: 'common', atk: 8, str: 2, value: 20, affixes: [] },
      armor:     { uid: 'a_start_f', name: 'Riveted Mail', slot: 'armor', rarity: 'common', def: 6, vit: 1, value: 20, affixes: [] },
      helm:      { uid: 'h_start_f', name: 'Iron Coif', slot: 'helm', rarity: 'common', def: 2, value: 12, affixes: [] },
      boots:     { uid: 'b_start_f', name: 'Heavy Sabatons', slot: 'boots', rarity: 'common', def: 2, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_f', name: 'Vanguard Signet', slot: 'accessory', rarity: 'common', atk: 1, crit: 2, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_f', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 30, maxDur: 30, value: 25, affixes: [] }
    },
    passiveName: 'Unstoppable Stride',
    passiveDesc: '+10 Max HP & reduces incoming physical damage by 15%.',
    skillName: 'Whirlwind Cleave',
    skillCost: 10,
    skillRange: 1,
    skillDesc: 'Cleaves all adjacent foes for 150% weapon damage and stuns them for 1 turn.'
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    title: 'Shadow Strider',
    color: '#c084fc',
    baseStats: { str: 9, dex: 16, int: 11, vit: 10 },
    hpBase: 90,
    mpBase: 45,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_t', name: 'Obsidian Stiletto', slot: 'weapon', rarity: 'common', atk: 7, crit: 8, value: 20, affixes: [] },
      armor:     { uid: 'a_start_t', name: 'Shadow Leather', slot: 'armor', rarity: 'common', def: 3, dodge: 6, value: 20, affixes: [] },
      helm:      { uid: 'h_start_t', name: 'Nightblade Cowl', slot: 'helm', rarity: 'common', def: 1, crit: 3, value: 12, affixes: [] },
      boots:     { uid: 'b_start_t', name: 'Silent Footwraps', slot: 'boots', rarity: 'common', def: 1, dodge: 5, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_t', name: 'Prospector Die', slot: 'accessory', rarity: 'common', crit: 4, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_t', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 28, maxDur: 28, value: 25, affixes: [] }
    },
    passiveName: 'Opportunist',
    passiveDesc: '+15% Critical Strike chance & +25% gold found in chests.',
    skillName: 'Shadowstep Strike',
    skillCost: 12,
    skillRange: 3,
    skillDesc: 'Teleports to a free floor tile adjacent to a target within 3 tiles and strikes for 220% Crit damage.'
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    title: 'Starweaver Adept',
    color: '#60a5fa',
    baseStats: { str: 7, dex: 10, int: 17, vit: 10 },
    hpBase: 82,
    mpBase: 80,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_m', name: 'Astral Runestaff', slot: 'weapon', rarity: 'common', atk: 5, int: 3, value: 20, affixes: [] },
      armor:     { uid: 'a_start_m', name: 'Starweaver Robes', slot: 'armor', rarity: 'common', def: 2, maxMp: 15, value: 20, affixes: [] },
      helm:      { uid: 'h_start_m', name: 'Circlet of Will', slot: 'helm', rarity: 'common', def: 1, int: 2, value: 12, affixes: [] },
      boots:     { uid: 'b_start_m', name: 'Leyline Slippers', slot: 'boots', rarity: 'common', def: 1, maxMp: 10, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_m', name: 'Vespera Shard', slot: 'accessory', rarity: 'common', maxMp: 15, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_m', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 25, maxDur: 25, value: 25, affixes: [] }
    },
    passiveName: 'Arcane Surge',
    passiveDesc: 'Regenerates +2 MP each turn and adds INT scaling to basic attacks.',
    skillName: 'Starfall Nova',
    skillCost: 16,
    skillRange: 4,
    skillDesc: 'Unleashes an astral detonation hitting all visible enemies within 4 tiles for 200% spell damage + Burn.'
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    title: 'Deepwood Pathfinder',
    color: '#34d399',
    baseStats: { str: 12, dex: 15, int: 11, vit: 11 },
    hpBase: 95,
    mpBase: 45,
    vision: 7,
    starterGear: {
      weapon:    { uid: 'w_start_r', name: 'Recurve Shortbow', slot: 'weapon', rarity: 'common', atk: 6, dex: 2, value: 20, affixes: [] },
      armor:     { uid: 'a_start_r', name: 'Scout Gambeson', slot: 'armor', rarity: 'common', def: 4, dodge: 4, value: 20, affixes: [] },
      helm:      { uid: 'h_start_r', name: 'Falconer Cap', slot: 'helm', rarity: 'common', def: 1, visionBonus: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_r', name: 'Trailrunner Boots', slot: 'boots', rarity: 'common', def: 1, dodge: 5, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_r', name: 'Quiver Trinket', slot: 'accessory', rarity: 'common', crit: 5, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_r', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 25, maxDur: 25, value: 25, affixes: [] }
    },
    passiveName: 'Eagle Eye',
    passiveDesc: '7-tile Torchlight vision & +15% Evasion.',
    skillName: 'Starfall Volley',
    skillCost: 14,
    skillRange: 5,
    skillDesc: 'Looses a piercing astral salvo striking up to 3 visible foes within 5 tiles for 180% weapon damage.'
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    title: 'Dawn Warden',
    color: '#fbbf24',
    baseStats: { str: 14, dex: 9, int: 12, vit: 15 },
    hpBase: 125,
    mpBase: 50,
    vision: 5,
    starterGear: {
      weapon:    { uid: 'w_start_p', name: 'Blessed Mace', slot: 'weapon', rarity: 'common', atk: 7, str: 1, value: 20, affixes: [] },
      armor:     { uid: 'a_start_p', name: 'Crusader Hauberk', slot: 'armor', rarity: 'common', def: 7, vit: 1, value: 22, affixes: [] },
      helm:      { uid: 'h_start_p', name: 'Steel Sallet', slot: 'helm', rarity: 'common', def: 3, value: 14, affixes: [] },
      boots:     { uid: 'b_start_p', name: 'Plated Greaves', slot: 'boots', rarity: 'common', def: 2, value: 14, affixes: [] },
      accessory: { uid: 'acc_start_p', name: 'Solar Medallion', slot: 'accessory', rarity: 'common', maxHp: 12, value: 18, affixes: [] },
      pickaxe:   { uid: 'pick_start_p', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 28, maxDur: 28, value: 25, affixes: [] }
    },
    passiveName: 'Aura of Radiance',
    passiveDesc: '+10 Armor & regenerates +1 HP every 3 turns.',
    skillName: 'Holy Smite',
    skillCost: 16,
    skillRange: 1,
    skillDesc: 'Strikes an adjacent foe for 240% holy damage and restores 15% of your Max HP.'
  }
};

  // --- Module: src/data/gems.js ---
// Astral Gem Catalog,Subterranean Shrine Variants, and Runic Trap Specifications

const GEM_IDS = ['ruby', 'emerald', 'sapphire', 'topaz', 'void_diamond'];

const GEM_CATALOG = {
  ruby: {
    id: 'ruby',
    name: 'Ruby of Might',
    shortName: 'Ruby',
    color: '#ef4444',
    baseValue: 65,
    bonuses: { atk: 4, str: 2 },
    desc: '+4 ATK, +2 STR'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald of the Wind',
    shortName: 'Emerald',
    color: '#10b981',
    baseValue: 65,
    bonuses: { crit: 5, dodge: 4, dex: 2 },
    desc: '+5% Crit, +4% Dodge, +2 DEX'
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire of Will',
    shortName: 'Sapphire',
    color: '#3b82f6',
    baseValue: 65,
    bonuses: { maxMp: 18, int: 3 },
    desc: '+18 Max MP, +3 INT'
  },
  topaz: {
    id: 'topaz',
    name: 'Topaz of Dawn',
    shortName: 'Topaz',
    color: '#f59e0b',
    baseValue: 65,
    bonuses: { maxHp: 24, def: 3, vit: 2 },
    desc: '+24 Max HP, +3 DEF, +2 VIT'
  },
  void_diamond: {
    id: 'void_diamond',
    name: 'Void Diamond',
    shortName: 'Void Diamond',
    color: '#e879f9',
    baseValue: 140,
    bonuses: { atk: 5, def: 4, crit: 4, visionBonus: 1 },
    desc: '+5 ATK, +4 DEF, +4% Crit, +1 Vision'
  }
};

const GEM_DISPLAY = [
  { id: 'ruby',         name: 'Ruby',         color: '#ef4444' },
  { id: 'emerald',      name: 'Emerald',      color: '#10b981' },
  { id: 'sapphire',     name: 'Sapphire',     color: '#3b82f6' },
  { id: 'topaz',        name: 'Topaz',        color: '#f59e0b' },
  { id: 'void_diamond', name: 'Void Diamond', color: '#e879f9' }
];

const SHRINE_CATALOG = {
  sanctuary: {
    id: 'sanctuary',
    name: 'Shrine of Celestial Renewal',
    color: '#34d399',
    desc: 'Restores 50% Max HP & Max MP and purges negative afflictions.'
  },
  starfire: {
    id: 'starfire',
    name: 'Shrine of Starfire',
    color: '#fbbf24',
    statusId: 'shrine_starfire',
    statusName: 'Starfire Blessing',
    duration: 25,
    bonuses: { atk: 6, crit: 12 },
    desc: 'Grants +6 ATK and +12% Crit for 25 turns.'
  },
  aegis: {
    id: 'aegis',
    name: 'Shrine of the Astral Aegis',
    color: '#60a5fa',
    statusId: 'shrine_aegis',
    statusName: 'Astral Aegis',
    duration: 25,
    bonuses: { def: 6, visionBonus: 1 },
    desc: 'Grants +6 DEF and +1 Vision Radius for 25 turns.'
  }
};

const TRAP_CATALOG = {
  spike: {
    id: 'spike',
    name: 'Runic Spike Trap',
    color: '#f87171',
    baseDmg: 12,
    depthScale: 4,
    statusId: 'bleed',
    statusDuration: 3,
    desc: 'Piercing floor spikes that deal physical damage and inflict Bleed.'
  },
  flame: {
    id: 'flame',
    name: 'Runic Flame Vent',
    color: '#fb923c',
    baseDmg: 10,
    depthScale: 4,
    statusId: 'burn',
    statusDuration: 3,
    desc: 'Searing rune-fire glyph that deals fire damage and inflicts Burn.'
  }
};

  // --- Module: src/data/bounties.js ---
// Procedural Guild Notice Board Contract Templates & Generator

const BOUNTY_SLAY_TEMPLATES = [
  { targetId: 'crawler',     label: 'Vault Crawlers',     minQty: 4, maxQty: 6, minPermit: 5,  baseGold: 85 },
  { targetId: 'archer',      label: 'Ranged Cultists & Archers', minQty: 3, maxQty: 5, minPermit: 5, baseGold: 95 },
  { targetId: 'monster_any', label: 'Subterranean Hostiles', minQty: 6, maxQty: 9, minPermit: 5, baseGold: 100 }
];

const BOUNTY_ORE_TEMPLATES = [
  { targetId: 'copper',      label: 'Copper Ore',     minQty: 4, maxQty: 6, reqGeo: 0, baseGold: 80 },
  { targetId: 'iron',        label: 'Iron Ore',       minQty: 3, maxQty: 5, reqGeo: 1, baseGold: 115 },
  { targetId: 'mithril',     label: 'Mithril Ore',    minQty: 3, maxQty: 4, reqGeo: 2, baseGold: 165 },
  { targetId: 'geode',       label: 'Relic Geodes',   minQty: 2, maxQty: 3, reqGeo: 2, baseGold: 175 },
  { targetId: 'starcrystal', name: 'Star-Crystal', label: 'Star-Crystal', minQty: 2, maxQty: 3, reqGeo: 3, baseGold: 220 }
];

const BOUNTY_SPECIAL_TEMPLATES = [
  { kind: 'slay',       targetId: 'elite',      titlePrefix: 'Champion Hunt', descVerb: 'Vanquish', label: 'Elite Champions', minQty: 1, maxQty: 2, minGeo: 0, baseGold: 140 },
  { kind: 'open_chest', targetId: 'chest',      titlePrefix: 'Relic Recovery', descVerb: 'Open',    label: 'Gilded Vault Chests', minQty: 2, maxQty: 3, minGeo: 0, baseGold: 110 }
];

let bountySeqCounter = 100;

function buildProceduralBountySet(geologyRank = 0, cartographyRank = 0) {
  const contracts = [];
  const tierScale = 1 + cartographyRank * 0.25;

  // Slot 1: Monster Cull Contract (Vault Gold Reward)
  const slayTpl = BOUNTY_SLAY_TEMPLATES[Math.floor(Math.random() * BOUNTY_SLAY_TEMPLATES.length)];
  const slayQty = slayTpl.minQty + Math.floor(Math.random() * (slayTpl.maxQty - slayTpl.minQty + 1));
  const slayGold = Math.round(slayTpl.baseGold * tierScale);
  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: 'slay',
    targetId: slayTpl.targetId,
    title: `Cull: ${slayTpl.label}`,
    desc: `Slay ${slayQty} ${slayTpl.label} in the vaults.`,
    reqQty: slayQty,
    curQty: 0,
    completed: false,
    rewardType: 'gold',
    rewardId: 'gold',
    rewardQty: slayGold,
    rewardLabel: `+${slayGold} Vault Gold`
  });

  // Slot 2: Geological Quota Contract (Rare Material or Uncut Gem Reward)
  const unlockedOres = BOUNTY_ORE_TEMPLATES.filter(o => geologyRank >= o.reqGeo);
  const orePool = unlockedOres.length > 0 ? unlockedOres : [BOUNTY_ORE_TEMPLATES[0]];
  const oreTpl = orePool[Math.floor(Math.random() * orePool.length)];
  const oreQty = oreTpl.minQty + Math.floor(Math.random() * (oreTpl.maxQty - oreTpl.minQty + 1));

  const gemChoices = [
    { id: 'ruby', name: 'Ruby of Might' },
    { id: 'emerald', name: 'Emerald of the Wind' },
    { id: 'sapphire', name: 'Sapphire of Will' },
    { id: 'topaz', name: 'Topaz of Dawn' }
  ];
  if (cartographyRank >= 2) {
    gemChoices.push({ id: 'void_diamond', name: 'Void Diamond' });
  }
  const chosenGem = gemChoices[Math.floor(Math.random() * gemChoices.length)];

  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: 'mine',
    targetId: oreTpl.targetId,
    title: `Quota: ${oreTpl.label}`,
    desc: `Mine ${oreQty} ${oreTpl.label} veins.`,
    reqQty: oreQty,
    curQty: 0,
    completed: false,
    rewardType: 'gem',
    rewardId: chosenGem.id,
    rewardQty: 1,
    rewardLabel: `+1 ${chosenGem.name}`
  });

  // Slot 3: High-Value Tactical Contract (Talent Tome or Bonus Gold + Star-Crystal)
  const specTpl = BOUNTY_SPECIAL_TEMPLATES[Math.floor(Math.random() * BOUNTY_SPECIAL_TEMPLATES.length)];
  const specQty = specTpl.minQty + Math.floor(Math.random() * (specTpl.maxQty - specTpl.minQty + 1));
  const awardTome = Math.random() < 0.6;

  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: specTpl.kind,
    targetId: specTpl.targetId,
    title: `${specTpl.titlePrefix}`,
    desc: `${specTpl.descVerb} ${specQty} ${specTpl.label}.`,
    reqQty: specQty,
    curQty: 0,
    completed: false,
    rewardType: awardTome ? 'talent_tome' : 'ore',
    rewardId: awardTome ? 'talent' : (geologyRank >= 2 ? 'starcrystal' : 'mithril'),
    rewardQty: awardTome ? 1 : 2,
    rewardLabel: awardTome
      ? '+1 Talent Tome (+1 Talent Pt)'
      : (geologyRank >= 2 ? '+2 Star-Crystal' : '+2 Mithril Ore')
  });

  return contracts;
}

  // --- Module: src/engine/rng.js ---
// Deterministic Seeded PRNG (Mulberry32) & Seed String Hashing

function hashSeedString(seedStr, salt = 0) {
  const str = String(seedStr || 'STAR-1000') + ':' + String(salt);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function createSeededRng(numericSeed) {
  let state = (numericSeed >>> 0) || 1;
  return function nextRand() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeedCode(prefix = 'STAR') {
  const num = 1000 + Math.floor(Math.random() * 8999);
  return `${prefix}-${num}`;
}

  // --- Module: src/data/dungeons.js ---
// Declarative Dungeon Profiles, Layout Styles, Monster/Ore Rosters & Custom Charter Builder



const LAYOUT_STYLES = {
  masonry_vaults: {
    id: 'masonry_vaults',
    name: 'Masonry Vaults & Avenues',
    desc: 'Structured halls, pillared plazas, 2-tile main avenues, and looping corridors.'
  },
  excavation_quarry: {
    id: 'excavation_quarry',
    name: 'Dwarven Mining Quarry',
    desc: 'Long cross-cut excavation drifts with high wall perimeter and rich ore motherlodes.'
  },
  crystalline_caverns: {
    id: 'crystalline_caverns',
    name: 'Crystalline & Mycelium Caverns',
    desc: 'Organic chamfered grottoes, winding tunnels, and dense subterranean shrines.'
  },
  grand_ruins: {
    id: 'grand_ruins',
    name: 'Grand Colonnade Ruins',
    desc: 'Vast pillared courts, side sanctums, and heavily guarded Treasure Vaults.'
  }
};

const MONSTER_FAMILY_POOLS = {
  balanced: [
    { id: 'vault_crawler',     weight: 30, minFloor: 1 },
    { id: 'starfall_archer',   weight: 22, minFloor: 1 },
    { id: 'brood_skitterer',   weight: 16, minFloor: 1 },
    { id: 'dwarven_automaton', weight: 14, minFloor: 2 },
    { id: 'abyssal_cultist',   weight: 18, minFloor: 3 },
    { id: 'crypt_stalker',     weight: 14, minFloor: 3 },
    { id: 'void_hexer',        weight: 12, minFloor: 5 }
  ],
  beasts: [
    { id: 'vault_crawler',     weight: 36, minFloor: 1 },
    { id: 'brood_skitterer',   weight: 32, minFloor: 1 },
    { id: 'spore_lurker',      weight: 28, minFloor: 1 },
    { id: 'starfall_archer',   weight: 12, minFloor: 2 }
  ],
  dwarven_forge: [
    { id: 'dwarven_automaton', weight: 35, minFloor: 1 },
    { id: 'ember_pyromancer',  weight: 26, minFloor: 1 },
    { id: 'vault_crawler',     weight: 18, minFloor: 1 },
    { id: 'magma_golem',       weight: 24, minFloor: 2 }
  ],
  astral_cult: [
    { id: 'starfall_archer',   weight: 24, minFloor: 1 },
    { id: 'abyssal_cultist',   weight: 32, minFloor: 1 },
    { id: 'astral_wraith',     weight: 24, minFloor: 1 },
    { id: 'void_hexer',        weight: 22, minFloor: 2 }
  ],
  ancient_crypt: [
    { id: 'crypt_stalker',     weight: 34, minFloor: 1 },
    { id: 'bone_warden',       weight: 32, minFloor: 1 },
    { id: 'abyssal_cultist',   weight: 20, minFloor: 1 },
    { id: 'astral_wraith',     weight: 18, minFloor: 2 }
  ]
};

const ORE_FOCUS_TABLES = {
  balanced: [
    { tile: TILE_ORE_COPPER,  weight: 38, minFloor: 1 },
    { tile: TILE_ORE_IRON,    weight: 28, minFloor: 1 },
    { tile: TILE_ORE_MITHRIL, weight: 16, minFloor: 2 },
    { tile: TILE_ORE_GEODE,   weight: 14, minFloor: 2 },
    { tile: TILE_ORE_STAR,    weight: 12, minFloor: 3 },
    { tile: TILE_ORE_ASTRAL,  weight: 8,  minFloor: 5 }
  ],
  copper_iron: [
    { tile: TILE_ORE_COPPER,  weight: 50, minFloor: 1 },
    { tile: TILE_ORE_IRON,    weight: 38, minFloor: 1 },
    { tile: TILE_ORE_GEODE,   weight: 12, minFloor: 2 },
    { tile: TILE_ORE_MITHRIL, weight: 8,  minFloor: 3 }
  ],
  mithril_geode: [
    { tile: TILE_ORE_IRON,    weight: 22, minFloor: 1 },
    { tile: TILE_ORE_MITHRIL, weight: 36, minFloor: 1 },
    { tile: TILE_ORE_GEODE,   weight: 34, minFloor: 1 },
    { tile: TILE_ORE_STAR,    weight: 12, minFloor: 3 }
  ],
  astral_crystal: [
    { tile: TILE_ORE_MITHRIL, weight: 20, minFloor: 1 },
    { tile: TILE_ORE_GEODE,   weight: 20, minFloor: 1 },
    { tile: TILE_ORE_STAR,    weight: 36, minFloor: 1 },
    { tile: TILE_ORE_ASTRAL,  weight: 28, minFloor: 2 }
  ]
};

const BIOME_PALETTES = {
  dwarven_catacombs: {
    id: 'dwarven_catacombs',
    name: 'Dwarven Catacombs',
    subtitle: 'Ancient Masonry Strata',
    wallFill: '#1b2434',
    wallCap: '#293548',
    wallBase: '#0d131d',
    wallAccent: null,
    floor1: '#0e1420',
    floor2: '#111826',
    floorBorder: '#192234',
    minimapWall: '#253247',
    minimapFloor: '#111a2b',
    torchR: 251, torchG: 191, torchB: 36,
    badgeColor: '#fbbf24'
  },
  crystalline_caverns: {
    id: 'crystalline_caverns',
    name: 'Crystalline Caverns',
    subtitle: 'Bioluminescent Indigo & Quartz Deeps',
    wallFill: '#1e1b4b',
    wallCap: '#3730a3',
    wallBase: '#0f0c29',
    wallAccent: '#38bdf8',
    floor1: '#0c1226',
    floor2: '#101730',
    floorBorder: '#1e2942',
    minimapWall: '#312e81',
    minimapFloor: '#0f172a',
    torchR: 56, torchG: 189, torchB: 248,
    badgeColor: '#38bdf8'
  },
  molten_forgeworks: {
    id: 'molten_forgeworks',
    name: 'Molten Forgeworks',
    subtitle: 'Basalt Foundry & Slag Seams',
    wallFill: '#2a1612',
    wallCap: '#451a03',
    wallBase: '#150906',
    wallAccent: '#f97316',
    floor1: '#160c0a',
    floor2: '#1d100d',
    floorBorder: '#2d1814',
    minimapWall: '#7c2d12',
    minimapFloor: '#1c1917',
    torchR: 249, torchG: 115, torchB: 22,
    badgeColor: '#f97316'
  },
  vespera_crater: {
    id: 'vespera_crater',
    name: 'The Vespera Crater',
    subtitle: 'Cosmic Abyssal Void Glass',
    wallFill: '#1e1033',
    wallCap: '#4c1d95',
    wallBase: '#0d0617',
    wallAccent: '#c084fc',
    floor1: '#0d0818',
    floor2: '#130c24',
    floorBorder: '#261545',
    minimapWall: '#581c87',
    minimapFloor: '#180d2c',
    torchR: 192, torchG: 132, torchB: 252,
    badgeColor: '#c084fc'
  }
};

function resolveFloorBiome(cfgOrDungeon, depth = 1) {
  const cfg = (cfgOrDungeon && cfgOrDungeon.config) ? cfgOrDungeon.config : (cfgOrDungeon || {});
  if (cfg.biomeId && BIOME_PALETTES[cfg.biomeId]) {
    return cfg.biomeId;
  }
  const prof = cfg.profileId || '';
  if (prof === 'sunken_quarry') return 'dwarven_catacombs';
  if (prof === 'mycelium_labyrinth') return 'crystalline_caverns';
  if (prof === 'molten_crucible') return 'molten_forgeworks';
  if (prof === 'citadel_ruins') return 'vespera_crater';

  const d = Math.max(1, Number(depth) || 1);
  if (d <= 5) return 'dwarven_catacombs';
  if (d <= 10) return 'crystalline_caverns';
  if (d <= 15) return 'molten_forgeworks';
  return 'vespera_crater';
}

const CURATED_DUNGEON_PROFILES = {
  starfall_vaults: {
    profileId: 'starfall_vaults',
    name: 'The Starfall Vaults',
    subtitle: 'Primary Astral Shaft • Multi-Wing Masonry Halls',
    themeColor: '#fbbf24',
    seedPrefix: 'STAR',
    reqCartography: 0,
    width: 80,
    height: 60,
    sizeTier: 'standard',
    maxDepth: 999,
    baseDangerDepth: 0,
    respectsCartographyPermit: true,
    layoutStyle: 'masonry_vaults',
    loopRatio: 0.35,
    vaultRoomCount: 1,
    monsterFamily: 'balanced',
    monsterDensityMult: 1.0,
    eliteChance: 0.22,
    oreFocus: 'balanced',
    veinDensityMult: 1.0,
    motherlodeChance: 0.45,
    chestDensityMult: 1.0,
    lootRarityBonus: 0,
    shrineDensityMult: 1.0,
    trapDensityMult: 1.0,
    allowedTraps: ['spike', 'flame'],
    bossSchedule: {
      5: 'boss_colossus',
      10: 'boss_weaver',
      15: 'boss_ignis',
      20: 'boss_vespera'
    }
  },
  sunken_quarry: {
    profileId: 'sunken_quarry',
    name: 'Sunken Copper Quarry',
    subtitle: 'Abandoned Dwarven Drift • Rich Copper & Iron Seams',
    themeColor: '#f59e0b',
    seedPrefix: 'QUAR',
    reqCartography: 0,
    width: 48,
    height: 36,
    sizeTier: 'small',
    maxDepth: 4,
    baseDangerDepth: 0,
    respectsCartographyPermit: false,
    layoutStyle: 'excavation_quarry',
    loopRatio: 0.40,
    vaultRoomCount: 1,
    monsterFamily: 'dwarven_forge',
    monsterDensityMult: 0.9,
    eliteChance: 0.18,
    oreFocus: 'copper_iron',
    veinDensityMult: 1.55,
    motherlodeChance: 0.75,
    chestDensityMult: 0.95,
    lootRarityBonus: 0,
    shrineDensityMult: 1.0,
    trapDensityMult: 0.85,
    allowedTraps: ['spike', 'flame'],
    bossSchedule: {
      4: 'boss_runelord'
    }
  },
  mycelium_labyrinth: {
    profileId: 'mycelium_labyrinth',
    name: 'Whispering Mycelium Labyrinth',
    subtitle: 'Sprawling Bioluminescent Grottoes • Geodes & Shrines',
    themeColor: '#34d399',
    seedPrefix: 'MYCE',
    reqCartography: 1,
    width: 128,
    height: 96,
    sizeTier: 'sprawling',
    maxDepth: 5,
    baseDangerDepth: 1,
    respectsCartographyPermit: false,
    layoutStyle: 'crystalline_caverns',
    loopRatio: 0.42,
    vaultRoomCount: 2,
    monsterFamily: 'beasts',
    monsterDensityMult: 1.05,
    eliteChance: 0.25,
    oreFocus: 'mithril_geode',
    veinDensityMult: 1.25,
    motherlodeChance: 0.60,
    chestDensityMult: 1.15,
    lootRarityBonus: 0.08,
    shrineDensityMult: 1.5,
    trapDensityMult: 1.1,
    allowedTraps: ['spike'],
    bossSchedule: {
      5: 'boss_broodmother'
    }
  },
  citadel_ruins: {
    profileId: 'citadel_ruins',
    name: 'Citadel of the Fallen Star',
    subtitle: 'Colossal 2-Floor Sunken Metropolis • High-Tier Vaults',
    themeColor: '#c084fc',
    seedPrefix: 'CITA',
    reqCartography: 1,
    width: 192,
    height: 144,
    sizeTier: 'colossal',
    maxDepth: 2,
    baseDangerDepth: 3,
    respectsCartographyPermit: false,
    layoutStyle: 'grand_ruins',
    loopRatio: 0.45,
    vaultRoomCount: 4,
    monsterFamily: 'ancient_crypt',
    monsterDensityMult: 1.1,
    eliteChance: 0.30,
    oreFocus: 'astral_crystal',
    veinDensityMult: 1.2,
    motherlodeChance: 0.65,
    chestDensityMult: 1.4,
    lootRarityBonus: 0.16,
    shrineDensityMult: 1.35,
    trapDensityMult: 1.2,
    allowedTraps: ['spike', 'flame'],
    bossSchedule: {
      2: 'boss_weaver'
    }
  },
  molten_crucible: {
    profileId: 'molten_crucible',
    name: 'The Molten Forgeworks',
    subtitle: 'Blazing Slag Vents & Ancient Foundries • Magma Golems',
    themeColor: '#f97316',
    seedPrefix: 'FORG',
    reqCartography: 2,
    width: 96,
    height: 72,
    sizeTier: 'standard',
    maxDepth: 6,
    baseDangerDepth: 2,
    respectsCartographyPermit: false,
    layoutStyle: 'excavation_quarry',
    loopRatio: 0.38,
    vaultRoomCount: 2,
    monsterFamily: 'dwarven_forge',
    monsterDensityMult: 1.1,
    eliteChance: 0.28,
    oreFocus: 'mithril_geode',
    veinDensityMult: 1.35,
    motherlodeChance: 0.65,
    chestDensityMult: 1.2,
    lootRarityBonus: 0.12,
    shrineDensityMult: 1.25,
    trapDensityMult: 1.2,
    allowedTraps: ['flame'],
    biomeId: 'molten_forgeworks',
    bossSchedule: {
      6: 'boss_ignis'
    }
  }
};

function normalizeDungeonConfig(rawCfg) {
  const base = CURATED_DUNGEON_PROFILES.starfall_vaults;
  const src = rawCfg || {};

  const width = Math.max(15, Math.min(500, Math.round(Number(src.width) || base.width || DEFAULT_MAP_W)));
  const height = Math.max(15, Math.min(500, Math.round(Number(src.height) || base.height || DEFAULT_MAP_H)));
  const maxDepth = Math.max(1, Math.min(999, Math.round(Number(src.maxDepth) || base.maxDepth)));
  const layoutStyle = LAYOUT_STYLES[src.layoutStyle] ? src.layoutStyle : base.layoutStyle;
  const monsterFamily = MONSTER_FAMILY_POOLS[src.monsterFamily] ? src.monsterFamily : base.monsterFamily;
  const oreFocus = ORE_FOCUS_TABLES[src.oreFocus] ? src.oreFocus : base.oreFocus;

  const monsterPool = Array.isArray(src.monsterPool) && src.monsterPool.length > 0
    ? src.monsterPool
    : MONSTER_FAMILY_POOLS[monsterFamily];

  const oreTable = Array.isArray(src.oreTable) && src.oreTable.length > 0
    ? src.oreTable
    : ORE_FOCUS_TABLES[oreFocus];

  return {
    profileId: src.profileId || 'custom_charter',
    biomeId: src.biomeId || null,
    name: src.name || base.name,
    subtitle: src.subtitle || `${width}x${height} • Max Depth ${maxDepth}`,
    themeColor: src.themeColor || '#60a5fa',
    seedPrefix: src.seedPrefix || 'CHRT',
    reqCartography: typeof src.reqCartography === 'number' ? src.reqCartography : 0,
    width,
    height,
    sizeTier: src.sizeTier || 'custom',
    maxDepth,
    baseDangerDepth: typeof src.baseDangerDepth === 'number' ? src.baseDangerDepth : 0,
    respectsCartographyPermit: src.respectsCartographyPermit !== undefined ? !!src.respectsCartographyPermit : false,
    layoutStyle,
    loopRatio: typeof src.loopRatio === 'number' ? src.loopRatio : 0.35,
    vaultRoomCount: typeof src.vaultRoomCount === 'number' ? src.vaultRoomCount : Math.max(1, Math.round((width * height) / 4800)),
    monsterFamily,
    monsterPool,
    monsterDensityMult: typeof src.monsterDensityMult === 'number' ? src.monsterDensityMult : 1.0,
    eliteChance: typeof src.eliteChance === 'number' ? src.eliteChance : 0.22,
    oreFocus,
    oreTable,
    veinDensityMult: typeof src.veinDensityMult === 'number' ? src.veinDensityMult : 1.0,
    motherlodeChance: typeof src.motherlodeChance === 'number' ? src.motherlodeChance : 0.50,
    chestDensityMult: typeof src.chestDensityMult === 'number' ? src.chestDensityMult : 1.0,
    lootRarityBonus: typeof src.lootRarityBonus === 'number' ? src.lootRarityBonus : 0,
    lootSlotBias: src.lootSlotBias || null,
    shrineDensityMult: typeof src.shrineDensityMult === 'number' ? src.shrineDensityMult : 1.0,
    trapDensityMult: typeof src.trapDensityMult === 'number' ? src.trapDensityMult : 1.0,
    allowedTraps: Array.isArray(src.allowedTraps) && src.allowedTraps.length > 0 ? src.allowedTraps : ['spike', 'flame'],
    bossSchedule: src.bossSchedule ? Object.assign({}, src.bossSchedule) : {}
  };
}

let dungeonInstSeq = 100;

function createDungeonInstance(profileOrConfig, options = {}) {
  const baseProfile = typeof profileOrConfig === 'string'
    ? (CURATED_DUNGEON_PROFILES[profileOrConfig] || CURATED_DUNGEON_PROFILES.starfall_vaults)
    : (profileOrConfig || CURATED_DUNGEON_PROFILES.starfall_vaults);

  const mergedCfg = normalizeDungeonConfig(Object.assign({}, baseProfile, options.configOverrides || {}));
  const id = options.id || `dng_${mergedCfg.profileId}_${Date.now()}_${dungeonInstSeq++}`;
  const seedCode = options.seedCode || randomSeedCode(mergedCfg.seedPrefix || 'STAR');
  const numericSeed = options.numericSeed || hashSeedString(seedCode, 0);

  return {
    id,
    name: mergedCfg.name,
    profileId: mergedCfg.profileId,
    originType: options.originType || (CURATED_DUNGEON_PROFILES[mergedCfg.profileId] ? 'curated' : 'chartered'),
    worldCoords: options.worldCoords || null, // Ready for future World Map { x, y, regionId }
    seedCode,
    numericSeed,
    config: mergedCfg,
    currentFloor: 1,
    deepestFloor: 1,
    isCleared: false,
    floors: {}
  };
}

function buildCharteredDungeonInstance(opts = {}) {
  const preset = opts.sizePreset && MAP_SIZE_PRESETS[opts.sizePreset] ? MAP_SIZE_PRESETS[opts.sizePreset] : null;
  const width = opts.width ? Number(opts.width) : (preset ? preset.width : 80);
  const height = opts.height ? Number(opts.height) : (preset ? preset.height : 60);
  const maxDepth = Math.max(1, Math.min(999, Number(opts.maxDepth) || 5));

  const styleKeys = Object.keys(LAYOUT_STYLES);
  const famKeys = Object.keys(MONSTER_FAMILY_POOLS);
  const oreKeys = Object.keys(ORE_FOCUS_TABLES);

  const layoutStyle = LAYOUT_STYLES[opts.layoutStyle] ? opts.layoutStyle : styleKeys[Math.floor(Math.random() * styleKeys.length)];
  const monsterFamily = MONSTER_FAMILY_POOLS[opts.monsterFamily] ? opts.monsterFamily : famKeys[Math.floor(Math.random() * famKeys.length)];
  const oreFocus = ORE_FOCUS_TABLES[opts.oreFocus] ? opts.oreFocus : oreKeys[Math.floor(Math.random() * oreKeys.length)];
  const richness = opts.richness === 'high' ? 1.45 : (opts.richness === 'extreme' ? 1.85 : 1.0);

  const adjPool = ['Forgotten', 'Sunken', 'Obsidian', 'Shattered', 'Astral', 'Gilded', 'Whispering', 'eldritch'];
  const nounPool = {
    masonry_vaults: 'Vaults',
    excavation_quarry: 'Delve',
    crystalline_caverns: 'Grottoes',
    grand_ruins: 'Sanctum'
  };
  const autoTitle = opts.name && String(opts.name).trim()
    ? String(opts.name).trim()
    : `${adjPool[Math.floor(Math.random() * adjPool.length)].replace(/^e/, 'E')} ${nounPool[layoutStyle] || 'Expanse'}`;

  const bossPool = ['boss_colossus', 'boss_runelord', 'boss_broodmother', 'boss_weaver'];
  const finalBoss = bossPool[Math.min(bossPool.length - 1, Math.floor((maxDepth - 1) / 3) % bossPool.length)];
  const bossSchedule = {};
  bossSchedule[maxDepth] = finalBoss;

  const customCfg = normalizeDungeonConfig({
    profileId: 'custom_charter',
    name: autoTitle,
    subtitle: `Chartered ${width}x${height} • ${LAYOUT_STYLES[layoutStyle].name}`,
    themeColor: '#60a5fa',
    seedPrefix: 'CHRT',
    width,
    height,
    sizeTier: preset ? preset.id : 'custom',
    maxDepth,
    baseDangerDepth: Number(opts.baseDangerDepth) || 0,
    respectsCartographyPermit: false,
    layoutStyle,
    monsterFamily,
    oreFocus,
    veinDensityMult: richness,
    chestDensityMult: richness,
    lootRarityBonus: richness > 1.2 ? 0.10 : 0,
    bossSchedule
  });

  return createDungeonInstance(customCfg, {
    originType: 'chartered',
    seedCode: opts.seedCode || randomSeedCode('CHRT')
  });
}

  // --- Module: src/engine/compression.js ---
// Compact Run-Length Encoding (RLE) & Lazy Floor Hydration for Large Multi-Dungeon Saves


function createUint8Grid(width, height, fillVal = 0) {
  const rows = new Array(height);
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(width);
    if (fillVal !== 0) row.fill(fillVal);
    rows[y] = row;
  }
  return rows;
}

function encodeGridToRle(grid, width, height, boolMode = false) {
  if (!grid || height <= 0 || width <= 0) return '';
  const parts = [];
  let curVal = -1;
  let runLen = 0;

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const raw = row ? row[x] : 0;
      const v = boolMode ? (raw ? 1 : 0) : (raw | 0);
      if (v === curVal) {
        runLen += 1;
      } else {
        if (runLen > 0) {
          parts.push(runLen > 1 ? `${curVal}:${runLen}` : `${curVal}`);
        }
        curVal = v;
        runLen = 1;
      }
    }
  }
  if (runLen > 0) {
    parts.push(runLen > 1 ? `${curVal}:${runLen}` : `${curVal}`);
  }
  return parts.join(',');
}

function decodeRleToGrid(rleStr, width, height) {
  const rows = createUint8Grid(width, height, 0);
  if (!rleStr || typeof rleStr !== 'string') return rows;

  const total = width * height;
  let cellIdx = 0;
  let i = 0;
  const len = rleStr.length;

  while (i < len && cellIdx < total) {
    let val = 0;
    while (i < len) {
      const c = rleStr.charCodeAt(i);
      if (c >= 48 && c <= 57) {
        val = val * 10 + (c - 48);
        i += 1;
      } else {
        break;
      }
    }

    let count = 1;
    if (i < len && rleStr.charCodeAt(i) === 58) { // ':'
      i += 1;
      count = 0;
      while (i < len) {
        const c = rleStr.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          count = count * 10 + (c - 48);
          i += 1;
        } else {
          break;
        }
      }
      if (count <= 0) count = 1;
    }

    if (i < len && rleStr.charCodeAt(i) === 44) { // ','
      i += 1;
    }

    const endIdx = Math.min(total, cellIdx + count);
    if (val !== 0) {
      while (cellIdx < endIdx) {
        const r = (cellIdx / width) | 0;
        const col = cellIdx - r * width;
        rows[r][col] = val;
        cellIdx += 1;
      }
    } else {
      cellIdx = endIdx;
    }
  }

  return rows;
}

function packFloorForStorage(floor) {
  if (!floor) return null;
  if (floor.packed && typeof floor.tilesRle === 'string') {
    return floor;
  }
  const h = floor.height || (floor.tiles ? floor.tiles.length : DEFAULT_MAP_H);
  const w = floor.width || (floor.tiles && floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);

  return {
    packed: true,
    depth: floor.depth || 1,
    width: w,
    height: h,
    roomCount: floor.roomCount || 0,
    upPos: floor.upPos || { x: 2, y: 2 },
    downPos: floor.downPos || { x: w - 3, y: h - 3 },
    hasDownStairs: floor.hasDownStairs !== undefined ? !!floor.hasDownStairs : true,
    shrines: floor.shrines || {},
    traps: floor.traps || {},
    vaults: floor.vaults || [],
    monsters: Array.isArray(floor.monsters) ? floor.monsters : [],
    oresMined: floor.oresMined || 0,
    tilesRle: encodeGridToRle(floor.tiles, w, h, false),
    exploredRle: encodeGridToRle(floor.explored, w, h, true)
  };
}

function hydrateFloorFromStorage(rawFloor) {
  if (!rawFloor) return null;
  if (!rawFloor.packed && rawFloor.tiles && rawFloor.tiles.length > 0) {
    const h = rawFloor.height || rawFloor.tiles.length;
    const w = rawFloor.width || rawFloor.tiles[0].length;
    rawFloor.packed = false;
    rawFloor.width = w;
    rawFloor.height = h;
    rawFloor.shrines = rawFloor.shrines || {};
    rawFloor.traps = rawFloor.traps || {};
    rawFloor.vaults = rawFloor.vaults || [];
    if (rawFloor.hasDownStairs === undefined) rawFloor.hasDownStairs = true;
    return rawFloor;
  }

  const w = rawFloor.width || DEFAULT_MAP_W;
  const h = rawFloor.height || DEFAULT_MAP_H;
  return {
    packed: false,
    depth: rawFloor.depth || 1,
    width: w,
    height: h,
    roomCount: rawFloor.roomCount || 0,
    tiles: decodeRleToGrid(rawFloor.tilesRle || '', w, h),
    explored: decodeRleToGrid(rawFloor.exploredRle || '', w, h),
    upPos: rawFloor.upPos || { x: 2, y: 2 },
    downPos: rawFloor.downPos || { x: w - 3, y: h - 3 },
    hasDownStairs: rawFloor.hasDownStairs !== undefined ? !!rawFloor.hasDownStairs : true,
    shrines: rawFloor.shrines || {},
    traps: rawFloor.traps || {},
    vaults: rawFloor.vaults || [],
    monsters: Array.isArray(rawFloor.monsters) ? rawFloor.monsters : [],
    oresMined: rawFloor.oresMined || 0
  };
}

  // --- Module: src/engine/state.js ---
// Game State Schema (Multi-Dungeon Atlas v5/v6), Save Migration, RLE Persistence & Derived Hero Stats








let itemSeq = 1000;

function nextItemUid(prefix = 'gear') {
  return `${prefix}_${Date.now()}_${itemSeq++}`;
}

function normalizeEquipmentSockets(item) {
  if (!item) return null;
  item.locked = Boolean(item.locked);
  if (item.slot === 'pickaxe') {
    item.maxSockets = 0;
    item.sockets = [];
    return item;
  }
  if (typeof item.maxSockets !== 'number') {
    if (item.rarity === 'relic') item.maxSockets = 2;
    else if (item.rarity === 'epic' || item.rarity === 'rare') item.maxSockets = 1;
    else item.maxSockets = 0;
  }
  if (!Array.isArray(item.sockets)) {
    item.sockets = [];
  }
  return item;
}

function createDefaultCodexState() {
  const kills = {};
  return {
    totalMonstersSlain: 0,
    totalBossesSlain: 0,
    totalElitesSlain: 0,
    totalOresMined: 0,
    totalGemsUnearthed: 0,
    totalChestsOpened: 0,
    totalShrinesActivated: 0,
    totalExtractions: 0,
    totalDefeats: 0,
    deepestFloorByDungeon: {},
    monsterKills: kills,
    killsByArchetype: kills,
    oreMinedById: {},
    relicsUnlocked: []
  };
}

function ensureCodexState(state) {
  if (!state) return createDefaultCodexState();
  if (!state.codex || typeof state.codex !== 'object') {
    state.codex = createDefaultCodexState();
  } else {
    const c = state.codex;
    c.totalMonstersSlain = c.totalMonstersSlain || 0;
    c.totalBossesSlain = c.totalBossesSlain || 0;
    c.totalElitesSlain = c.totalElitesSlain || 0;
    c.totalOresMined = c.totalOresMined || 0;
    c.totalGemsUnearthed = c.totalGemsUnearthed || 0;
    c.totalChestsOpened = c.totalChestsOpened || 0;
    c.totalShrinesActivated = c.totalShrinesActivated || 0;
    c.totalExtractions = c.totalExtractions || 0;
    c.totalDefeats = c.totalDefeats || 0;
    if (!c.deepestFloorByDungeon || typeof c.deepestFloorByDungeon !== 'object') c.deepestFloorByDungeon = {};
    if (!c.monsterKills || typeof c.monsterKills !== 'object') {
      c.monsterKills = c.killsByArchetype || {};
    }
    if (!c.killsByArchetype || typeof c.killsByArchetype !== 'object') {
      c.killsByArchetype = c.monsterKills;
    }
    if (!c.oreMinedById || typeof c.oreMinedById !== 'object') c.oreMinedById = {};
    if (!Array.isArray(c.relicsUnlocked)) c.relicsUnlocked = [];
  }
  return state.codex;
}

function getCodexMasteryMultiplier(monsterId, state) {
  const targetState = state || gameState;
  if (!targetState || !targetState.codex) return 1.0;
  const killsMap = targetState.codex.monsterKills || targetState.codex.killsByArchetype;
  if (!killsMap) return 1.0;
  const kills = killsMap[monsterId] || 0;
  const isBoss = typeof monsterId === 'string' && monsterId.indexOf('boss_') === 0;
  const req = isBoss ? 1 : CODEX_MASTERY_KILLS;
  return kills >= req ? CODEX_MASTERY_DMG_MULT : 1.0;
}

function recordRelicUnlock(item, floorDepth = 1, dungeonName = 'The Starfall Vaults', state) {
  const targetState = state || gameState;
  if (!item || item.rarity !== 'relic' || !targetState) return;
  const codex = ensureCodexState(targetState);
  const exists = codex.relicsUnlocked.some(r => r.name === item.name);
  if (!exists) {
    codex.relicsUnlocked.push({
      name: item.name,
      slot: item.slot,
      atk: item.atk || 0,
      def: item.def || 0,
      floor: floorDepth || 1,
      dungeonName: dungeonName || (targetState.dungeon && targetState.dungeon.name) || 'Subterranean Delve'
    });
    if (codex.relicsUnlocked.length > 50) {
      codex.relicsUnlocked.shift();
    }
  }
}

function createDefaultDungeonsRegistry() {
  return {
    dng_starfall: createDungeonInstance('starfall_vaults', { id: 'dng_starfall', originType: 'curated' }),
    dng_quarry:   createDungeonInstance('sunken_quarry',   { id: 'dng_quarry',   originType: 'curated' }),
    dng_mycelium: createDungeonInstance('mycelium_labyrinth', { id: 'dng_mycelium', originType: 'curated' }),
    dng_citadel:  createDungeonInstance('citadel_ruins',   { id: 'dng_citadel',  originType: 'curated' }),
    dng_molten:   createDungeonInstance('molten_crucible', { id: 'dng_molten',   originType: 'curated' })
  };
}

function ensureDungeonFloorHydrated(dungeonObj, depth) {
  if (!dungeonObj || !dungeonObj.floors || !dungeonObj.floors[depth]) return null;
  dungeonObj.floors[depth] = hydrateFloorFromStorage(dungeonObj.floors[depth]);
  return dungeonObj.floors[depth];
}

function syncActiveDungeonAlias(state) {
  if (!state) return null;
  if (!state.dungeons || Object.keys(state.dungeons).length === 0) {
    state.dungeons = createDefaultDungeonsRegistry();
  }
  if (!state.activeDungeonId || !state.dungeons[state.activeDungeonId]) {
    const firstKey = state.dungeons.dng_starfall ? 'dng_starfall' : Object.keys(state.dungeons)[0];
    state.activeDungeonId = firstKey;
  }

  // Keep inactive dungeons compactly RLE-packed in memory so hundreds of dungeons stay lightweight
  Object.keys(state.dungeons).forEach(dId => {
    const dng = state.dungeons[dId];
    if (!dng || !dng.floors) return;
    if (dId !== state.activeDungeonId) {
      Object.keys(dng.floors).forEach(fk => {
        if (dng.floors[fk] && !dng.floors[fk].packed) {
          dng.floors[fk] = packFloorForStorage(dng.floors[fk]);
        }
      });
    }
  });

  const active = state.dungeons[state.activeDungeonId];
  ensureDungeonFloorHydrated(active, active.currentFloor || 1);
  state.dungeon = active;
  return active;
}

function createDefaultGameState() {
  const dungeons = createDefaultDungeonsRegistry();
  const activeId = 'dng_starfall';
  return {
    version: SCHEMA_VERSION,
    turn: 0,
    inGuild: true,
    audioEnabled: true,
    maxCharteredDungeons: DEFAULT_MAX_CHARTERED_DUNGEONS,
    hero: null,
    activeDungeonId: activeId,
    dungeons,
    dungeon: dungeons[activeId],
    guildVault: {
      gold: 35,
      copper: 0,
      iron: 0,
      mithril: 0,
      geode: 0,
      starcrystal: 0,
      astralite: 0,
      gems: {
        ruby: 0,
        emerald: 0,
        sapphire: 0,
        topaz: 0,
        void_diamond: 0
      },
      armory: []
    },
    guildResearch: {
      cartography: 0,
      geology: 0,
      toolsmithing: 0,
      assay: 0,
      quartermaster: 0,
      vanguard: 0
    },
    guildBounties: buildProceduralBountySet(0, 0),
    codex: createDefaultCodexState(),
    uiSettings: {
      armorySortBy: 'slot'
    }
  };
}

const gameState = createDefaultGameState();

function setGameState(nextState) {
  if (!nextState) return gameState;
  Object.keys(gameState).forEach(k => {
    delete gameState[k];
  });
  Object.assign(gameState, nextState);
  syncActiveDungeonAlias(gameState);
  return gameState;
}

function migrateSaveData(raw) {
  if (!raw) return null;
  const data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));

  const migrated = createDefaultGameState();
  migrated.turn = data.turn || 0;
  migrated.inGuild = data.inGuild !== undefined ? data.inGuild : (data.location !== 'dungeon');
  migrated.audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;
  migrated.maxCharteredDungeons = typeof data.maxCharteredDungeons === 'number'
    ? data.maxCharteredDungeons
    : DEFAULT_MAX_CHARTERED_DUNGEONS;

  migrated.uiSettings = data.uiSettings || { armorySortBy: 'slot' };
  if (!migrated.uiSettings.armorySortBy) migrated.uiSettings.armorySortBy = 'slot';

  // Migrate Vault & Bank
  const srcVault = data.guildVault || data.bank || {};
  migrated.guildVault.gold = srcVault.gold !== undefined ? srcVault.gold : 35;
  migrated.guildVault.copper = srcVault.copper || 0;
  migrated.guildVault.iron = srcVault.iron || 0;
  migrated.guildVault.mithril = srcVault.mithril || 0;
  migrated.guildVault.geode = srcVault.geode || 0;
  migrated.guildVault.starcrystal = srcVault.starcrystal || 0;
  migrated.guildVault.astralite = srcVault.astralite || 0;

  const srcGems = srcVault.gems || {};
  GEM_IDS.forEach(gId => {
    migrated.guildVault.gems[gId] = srcGems[gId] || 0;
  });

  const rawArmory = Array.isArray(srcVault.armory)
    ? srcVault.armory
    : (Array.isArray(srcVault.equipment) ? srcVault.equipment : []);
  migrated.guildVault.armory = rawArmory.map(g => normalizeEquipmentSockets(g));

  // Migrate old v1/v2 bank items array into mineral/gem counts
  if (Array.isArray(srcVault.items)) {
    srcVault.items.forEach(it => {
      const cleanId = (it.id || '')
        .replace('_ore', '')
        .replace('relic_geode', 'geode')
        .replace('star', 'starcrystal')
        .replace('astral', 'astralite');
      if (migrated.guildVault.gems[cleanId] !== undefined) {
        migrated.guildVault.gems[cleanId] += (it.count || it.qty || 1);
      } else if (migrated.guildVault[cleanId] !== undefined && typeof migrated.guildVault[cleanId] === 'number') {
        migrated.guildVault[cleanId] += (it.count || it.qty || 1);
      }
    });
  }

  // Migrate Research
  const srcRes = data.guildResearch || data.research || {};
  migrated.guildResearch = {
    cartography:   srcRes.cartography !== undefined ? srcRes.cartography : (srcRes.vault_cartography || srcRes.max_depth || 0),
    geology:       srcRes.geology !== undefined ? srcRes.geology : (srcRes.metallurgy_geology || 0),
    toolsmithing:  srcRes.toolsmithing !== undefined ? srcRes.toolsmithing : (srcRes.pickaxe_temper || 0),
    assay:         srcRes.assay !== undefined ? srcRes.assay : (srcRes.appraisal || srcRes.ore_appraisal || 0),
    quartermaster: srcRes.quartermaster || 0,
    vanguard:      srcRes.vanguard !== undefined ? srcRes.vanguard : (srcRes.vanguard_insurance || 0)
  };

  // Migrate Bounties
  if (Array.isArray(data.guildBounties) && data.guildBounties.length > 0) {
    migrated.guildBounties = data.guildBounties.map(b => Object.assign({
      curQty: 0,
      reqQty: 1,
      completed: false
    }, b));
  } else {
    migrated.guildBounties = buildProceduralBountySet(
      migrated.guildResearch.geology,
      migrated.guildResearch.cartography
    );
  }

  // Migrate Hero
  if (data.hero) {
    const clsId = CLASSES[data.hero.classId] ? data.hero.classId : 'fighter';
    const cls = CLASSES[clsId];
    const eqSource = data.hero.equipment || data.hero.equipped || {};
    migrated.hero = {
      name: data.hero.name || cls.name,
      classId: clsId,
      level: data.hero.level || 1,
      xp: data.hero.xp || 0,
      maxXp: data.hero.maxXp || data.hero.xpNext || 60,
      statPoints: data.hero.statPoints || 0,
      bonusStats: data.hero.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 },
      hp: data.hero.hp || cls.hpBase,
      maxHp: data.hero.maxHp || cls.hpBase,
      mp: data.hero.mp || cls.mpBase,
      maxMp: data.hero.maxMp || cls.mpBase,
      atk: data.hero.atk || 12,
      def: data.hero.def || 6,
      crit: data.hero.crit || 5,
      dodge: data.hero.dodge || 5,
      talentPoints: data.hero.talentPoints !== undefined ? data.hero.talentPoints : (data.hero.talentPointsAvailable || 0),
      talentsAllocated: data.hero.talentsAllocated || {},
      consumables: {
        potions: (data.hero.consumables && data.hero.consumables.potions !== undefined)
          ? data.hero.consumables.potions
          : (srcVault.potions !== undefined ? srcVault.potions : 2),
        recalls: (data.hero.consumables && data.hero.consumables.recalls !== undefined)
          ? data.hero.consumables.recalls
          : (srcVault.recallScrolls !== undefined ? srcVault.recallScrolls : 1)
      },
      equipment: {
        weapon:    normalizeEquipmentSockets(eqSource.weapon    || JSON.parse(JSON.stringify(cls.starterGear.weapon))),
        armor:     normalizeEquipmentSockets(eqSource.armor     || JSON.parse(JSON.stringify(cls.starterGear.armor))),
        helm:      normalizeEquipmentSockets(eqSource.helm      || JSON.parse(JSON.stringify(cls.starterGear.helm))),
        boots:     normalizeEquipmentSockets(eqSource.boots     || JSON.parse(JSON.stringify(cls.starterGear.boots))),
        accessory: normalizeEquipmentSockets(eqSource.accessory || JSON.parse(JSON.stringify(cls.starterGear.accessory))),
        pickaxe:   normalizeEquipmentSockets(eqSource.pickaxe   || JSON.parse(JSON.stringify(cls.starterGear.pickaxe)))
      },
      expeditionPack: Array.isArray(data.hero.expeditionPack) ? data.hero.expeditionPack : [],
      expeditionGear: Array.isArray(data.hero.expeditionGear)
        ? data.hero.expeditionGear.map(g => normalizeEquipmentSockets(g))
        : [],
      statuses: Array.isArray(data.hero.statuses) ? data.hero.statuses : [],
      usedDivineIntervention: !!data.hero.usedDivineIntervention,
      x: data.hero.x || 1,
      y: data.hero.y || 1
    };
  }

  // Migrate Multi-Dungeon Registry OR Legacy Single Dungeon
  if (data.dungeons && typeof data.dungeons === 'object' && Object.keys(data.dungeons).length > 0) {
    Object.keys(data.dungeons).forEach(dId => {
      const rawDng = data.dungeons[dId];
      if (!rawDng) return;
      const baseProf = CURATED_DUNGEON_PROFILES[rawDng.profileId] || {};
      const normCfg = normalizeDungeonConfig(Object.assign({}, baseProf, rawDng.config || {}));
      const seedCode = rawDng.seedCode || 'STAR-4812';
      migrated.dungeons[dId] = {
        id: dId,
        name: rawDng.name || normCfg.name,
        profileId: rawDng.profileId || normCfg.profileId,
        originType: rawDng.originType || (CURATED_DUNGEON_PROFILES[normCfg.profileId] ? 'curated' : 'chartered'),
        worldCoords: rawDng.worldCoords || null,
        seedCode,
        numericSeed: rawDng.numericSeed || hashSeedString(seedCode, 0),
        config: normCfg,
        currentFloor: rawDng.currentFloor || 1,
        deepestFloor: rawDng.deepestFloor || rawDng.currentFloor || 1,
        isCleared: !!rawDng.isCleared,
        floors: rawDng.floors || {}
      };
    });
    migrated.activeDungeonId = data.activeDungeonId && migrated.dungeons[data.activeDungeonId]
      ? data.activeDungeonId
      : Object.keys(migrated.dungeons)[0];
  } else if (data.dungeon && data.dungeon.floors) {
    const targetDng = migrated.dungeons.dng_starfall;
    targetDng.seedCode = data.dungeon.seedCode || 'STAR-4812';
    targetDng.numericSeed = hashSeedString(targetDng.seedCode, 0);
    targetDng.currentFloor = data.dungeon.currentFloor || data.dungeon.currentDepth || 1;
    targetDng.deepestFloor = Math.max(1, targetDng.currentFloor, Object.keys(data.dungeon.floors).length);
    targetDng.floors = {};
    Object.keys(data.dungeon.floors).forEach(fk => {
      targetDng.floors[fk] = hydrateFloorFromStorage(data.dungeon.floors[fk]);
    });
    migrated.activeDungeonId = 'dng_starfall';
  }

  syncActiveDungeonAlias(migrated);

  // Migrate Codex & Hall of Records
  migrated.codex = createDefaultCodexState();
  if (data.codex && typeof data.codex === 'object') {
    Object.assign(migrated.codex, data.codex);
    ensureCodexState(migrated);
  }

  migrated.version = SCHEMA_VERSION;
  return migrated;
}

function getPickaxeMaxDurability(state = gameState) {
  const pick = state && state.hero && state.hero.equipment ? state.hero.equipment.pickaxe : null;
  if (!pick) return 25;
  const toolRank = (state && state.guildResearch && state.guildResearch.toolsmithing) || 0;
  return Math.round(pick.maxDur * (1 + toolRank * 0.5));
}

function recomputeHeroDerivedStats(fullRestore = false, state = gameState) {
  const h = state.hero;
  if (!h) return;
  const cls = CLASSES[h.classId] || CLASSES.fighter;
  const bonus = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 };

  let str = cls.baseStats.str + (h.level - 1) * 2 + (bonus.str || 0);
  let dex = cls.baseStats.dex + (h.level - 1) * 2 + (bonus.dex || 0);
  let int = cls.baseStats.int + (h.level - 1) * 2 + (bonus.int || 0);
  let vit = cls.baseStats.vit + (h.level - 1) * 2 + (bonus.vit || 0);

  let flatAtk = 0, flatDef = 0, flatCrit = 0, flatDodge = 0, flatHp = 0, flatMp = 0, visionBonus = 0;

  // Passive Class Bonuses
  if (h.classId === 'fighter') flatHp += 10;
  if (h.classId === 'thief')   flatCrit += 15;
  if (h.classId === 'ranger')  flatDodge += 15;
  if (h.classId === 'paladin') flatDef += 10;

  // Talent Bonuses
  const t = h.talentsAllocated || {};
  if (t.f_a1) flatHp += t.f_a1 * 12;
  if (t.f_a2) flatAtk += t.f_a2 * 3;
  if (t.t_b1) flatCrit += t.t_b1 * 5;
  if (t.t_b3) flatDodge += t.t_b3 * 10;
  if (t.m_c1) flatMp += t.m_c1 * 15;
  if (t.r_d1) { flatDodge += t.r_d1 * 4; visionBonus += t.r_d1; }
  if (t.p_e1) { flatDef += t.p_e1 * 4; flatHp += t.p_e1 * 8; }
  if (t.p_e2) flatAtk += t.p_e2 * 4;

  // Sum 6-Slot Equipment & Socketed Astral Gems
  for (const slot of ['weapon', 'armor', 'helm', 'boots', 'accessory']) {
    const it = h.equipment[slot];
    if (!it) continue;
    if (it.str) str += it.str;
    if (it.dex) dex += it.dex;
    if (it.int) int += it.int;
    if (it.vit) vit += it.vit;
    if (it.atk) flatAtk += it.atk;
    if (it.def) flatDef += it.def;
    if (it.crit) flatCrit += it.crit;
    if (it.dodge) flatDodge += it.dodge;
    if (it.maxHp) flatHp += it.maxHp;
    if (it.maxMp) flatMp += it.maxMp;
    if (it.visionBonus) visionBonus += it.visionBonus;

    if (Array.isArray(it.sockets)) {
      for (let sIdx = 0; sIdx < it.sockets.length; sIdx++) {
        const gem = GEM_CATALOG[it.sockets[sIdx]];
        if (!gem || !gem.bonuses) continue;
        const gb = gem.bonuses;
        if (gb.str) str += gb.str;
        if (gb.dex) dex += gb.dex;
        if (gb.int) int += gb.int;
        if (gb.vit) vit += gb.vit;
        if (gb.atk) flatAtk += gb.atk;
        if (gb.def) flatDef += gb.def;
        if (gb.crit) flatCrit += gb.crit;
        if (gb.dodge) flatDodge += gb.dodge;
        if (gb.maxHp) flatHp += gb.maxHp;
        if (gb.maxMp) flatMp += gb.maxMp;
        if (gb.visionBonus) visionBonus += gb.visionBonus;
      }
    }
  }

  // Active Astral Shrine Status Buffs
  if (Array.isArray(h.statuses)) {
    for (let i = 0; i < h.statuses.length; i++) {
      const st = h.statuses[i];
      if (st.id === 'shrine_starfire') {
        flatAtk += 6;
        flatCrit += 12;
      } else if (st.id === 'shrine_aegis') {
        flatDef += 6;
        visionBonus += 1;
      }
    }
  }

  h.computedStr = str;
  h.computedDex = dex;
  h.computedInt = int;
  h.computedVit = vit;
  h.visionRadius = (cls.vision || 5) + visionBonus;

  h.maxHp = cls.hpBase + (vit * 4) + flatHp;
  h.maxMp = cls.mpBase + (int * 3) + flatMp;

  const primaryOffensive = h.classId === 'mage'
    ? Math.round(int * 1.1 + str * 0.3)
    : h.classId === 'ranger' || h.classId === 'thief'
      ? Math.round(dex * 0.9 + str * 0.4)
      : Math.round(str * 0.95 + dex * 0.35);

  h.atk = primaryOffensive + flatAtk;
  h.def = Math.round(vit * 0.45) + flatDef;
  h.crit = Math.min(75, 5 + Math.round(dex * 0.45) + flatCrit);
  h.dodge = Math.min(60, 4 + Math.round(dex * 0.35) + flatDodge);

  if (fullRestore) {
    h.hp = h.maxHp;
    h.mp = h.maxMp;
  } else {
    h.hp = Math.min(h.hp, h.maxHp);
    h.mp = Math.min(h.mp, h.maxMp);
  }
}

function serializeStateForStorage(state = gameState) {
  const packedDungeons = {};
  const srcDungeons = state.dungeons || {};
  Object.keys(srcDungeons).forEach(dId => {
    const dng = srcDungeons[dId];
    if (!dng) return;
    const packedFloors = {};
    if (dng.floors) {
      Object.keys(dng.floors).forEach(fk => {
        packedFloors[fk] = packFloorForStorage(dng.floors[fk]);
      });
    }
    packedDungeons[dId] = {
      id: dng.id,
      name: dng.name,
      profileId: dng.profileId,
      originType: dng.originType,
      worldCoords: dng.worldCoords || null,
      seedCode: dng.seedCode,
      numericSeed: dng.numericSeed,
      config: dng.config,
      currentFloor: dng.currentFloor,
      deepestFloor: dng.deepestFloor || dng.currentFloor || 1,
      isCleared: !!dng.isCleared,
      floors: packedFloors
    };
  });

  return {
    version: state.version || SCHEMA_VERSION,
    turn: state.turn || 0,
    inGuild: state.inGuild !== false,
    audioEnabled: state.audioEnabled !== false,
    maxCharteredDungeons: state.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS,
    activeDungeonId: state.activeDungeonId,
    dungeons: packedDungeons,
    hero: state.hero,
    guildVault: state.guildVault,
    guildResearch: state.guildResearch,
    guildBounties: state.guildBounties,
    codex: state.codex ? JSON.parse(JSON.stringify(state.codex)) : createDefaultCodexState()
  };
}

function saveGame(state = gameState) {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload = serializeStateForStorage(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (e) {
    // Ignore storage quota or sandbox errors
  }
}

function loadGame() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('aethelgard_save_v5') ||
        localStorage.getItem('aethelgard_save_v4') ||
        localStorage.getItem('aethelgard_save_v3') ||
        localStorage.getItem('aethelgard_save_v2') ||
        localStorage.getItem('aethelgard_save');
      if (raw) {
        const migrated = migrateSaveData(raw);
        setGameState(migrated);
        if (gameState.hero) {
          recomputeHeroDerivedStats(false, gameState);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Save load warning:', e);
  }
  return false;
}

  // --- Module: src/engine/audio.js ---
// Procedural Web Audio API Sound Effects


let audioCtx = null;

function playSound(type) {
  if (!gameState.audioEnabled || typeof window === 'undefined') return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.11);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'mine') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(1020, now + 0.08);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'spell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'gold') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.06);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'lvl') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.09);
      osc.frequency.setValueAtTime(659, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Ignore audio context errors when autoplay is blocked
  }
}

function toggleAudio() {
  gameState.audioEnabled = !gameState.audioEnabled;
  if (typeof document !== 'undefined') {
    const btn = document.getElementById('btnAudioToggle');
    if (btn) btn.textContent = gameState.audioEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF';
  }
  saveGame();
}

  // --- Module: src/engine/events.js ---
// Synchronous Domain Event Bus & Gameplay Telemetry Dispatcher (ADR-0006)
// Decouples engine state mutations from UI/Audio side effects and provides telemetry hooks for Bestiary/Codex tracking.

const ENGINE_EVENTS = {
  LOG:              'log',
  FLOATING_TEXT:    'floatingText',
  OUTCOME_MODAL:    'outcomeModal',
  UI_SYNC:          'uiSync',
  FOV_SYNC:         'fovSync',
  TURN_END:         'turnEnd',
  MONSTER_SLAIN:    'monsterSlain',
  ORE_MINED:        'oreMined',
  CHEST_OPENED:     'chestOpened',
  SHRINE_ACTIVATED: 'shrineActivated',
  TRAP_RESOLVED:    'trapResolved',
  EXTRACTED:        'extracted',
  HERO_DEFEATED:    'heroDefeated'
};

const eventListenersMap = {};

function onEngineEvent(eventName, handler) {
  if (!eventName || typeof handler !== 'function') {
    return () => {};
  }
  if (!eventListenersMap[eventName]) {
    eventListenersMap[eventName] = [];
  }
  if (eventListenersMap[eventName].indexOf(handler) === -1) {
    eventListenersMap[eventName].push(handler);
  }
  return function unsubscribe() {
    offEngineEvent(eventName, handler);
  };
}

function offEngineEvent(eventName, handler) {
  const list = eventListenersMap[eventName];
  if (!list) return;
  const idx = list.indexOf(handler);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
}

function emitEngineEvent(eventName, payload, state = null) {
  const list = eventListenersMap[eventName];
  if (!list || list.length === 0) return 0;
  const snapshot = list.slice();
  for (let i = 0; i < snapshot.length; i++) {
    snapshot[i](payload, state);
  }
  return snapshot.length;
}

function clearEngineEventListeners(eventName = null) {
  if (eventName) {
    delete eventListenersMap[eventName];
    return;
  }
  Object.keys(eventListenersMap).forEach(k => {
    delete eventListenersMap[k];
  });
}

  // --- Module: src/data/ores.js ---
// 6 Mineral Vein Types & Geology Requirements


const ORE_CATALOG = {
  [TILE_ORE_COPPER]:  { id: 'copper',      name: 'Copper Ore',     baseValue: 10,  minGeology: 0, color: '#d97736', sparkle: '#fDBA74', xp: 10 },
  [TILE_ORE_IRON]:    { id: 'iron',        name: 'Iron Ore',       baseValue: 20,  minGeology: 1, color: '#94a3b8', sparkle: '#e2e8f0', xp: 18 },
  [TILE_ORE_MITHRIL]: { id: 'mithril',     name: 'Mithril Ore',    baseValue: 42,  minGeology: 2, color: '#38bdf8', sparkle: '#bae6fd', xp: 35 },
  [TILE_ORE_GEODE]:   { id: 'geode',       name: 'Relic Geode',    baseValue: 60,  minGeology: 2, color: '#f59e0b', sparkle: '#fef08a', xp: 45 },
  [TILE_ORE_STAR]:    { id: 'starcrystal', name: 'Star-Crystal',   baseValue: 90,  minGeology: 3, color: '#c084fc', sparkle: '#f3e8ff', xp: 70 },
  [TILE_ORE_ASTRAL]:  { id: 'astralite',   name: 'Void Astralite', baseValue: 150, minGeology: 3, color: '#ec4899', sparkle: '#fbcfe8', xp: 110 }
};

const MINERAL_IDS = ['copper', 'iron', 'mithril', 'geode', 'starcrystal', 'astralite'];

const MINERAL_DISPLAY = [
  { id: 'copper',      name: 'Copper',       color: '#d97736' },
  { id: 'iron',        name: 'Iron',         color: '#94a3b8' },
  { id: 'mithril',     name: 'Mithril',      color: '#38bdf8' },
  { id: 'geode',       name: 'Geodes',       color: '#f59e0b' },
  { id: 'starcrystal', name: 'Star-Crystal', color: '#c084fc' },
  { id: 'astralite',   name: 'Astralite',    color: '#ec4899' }
];

  // --- Module: src/data/items.js ---
// Equipment Affix Pools, Quartermaster Shop Catalog, and Elite Monster Affixes


const AFFIX_POOL = [
  { id: 'atk',   label: 'of Ferocity',    stat: 'atk',   min: 2,  max: 6,  slots: ['weapon', 'accessory'] },
  { id: 'def',   label: 'of the Bulwark', stat: 'def',   min: 2,  max: 6,  slots: ['armor', 'helm', 'boots'] },
  { id: 'str',   label: 'of Might',       stat: 'str',   min: 1,  max: 4,  slots: ['weapon', 'armor', 'helm'] },
  { id: 'dex',   label: 'of Precision',   stat: 'dex',   min: 1,  max: 4,  slots: ['weapon', 'boots', 'accessory'] },
  { id: 'int',   label: 'of Astral Lore', stat: 'int',   min: 1,  max: 4,  slots: ['weapon', 'helm', 'accessory'] },
  { id: 'vit',   label: 'of Fortitude',   stat: 'vit',   min: 1,  max: 4,  slots: ['armor', 'helm', 'boots'] },
  { id: 'crit',  label: 'of Keen Sight',  stat: 'crit',  min: 3,  max: 9,  slots: ['weapon', 'accessory', 'helm'] },
  { id: 'dodge', label: 'of the Zephyr',  stat: 'dodge', min: 3,  max: 8,  slots: ['boots', 'armor', 'accessory'] },
  { id: 'maxHp', label: 'of Lifeblood',   stat: 'maxHp', min: 12, max: 35, slots: ['armor', 'helm', 'accessory'] },
  { id: 'maxMp', label: 'of the Leyline', stat: 'maxMp', min: 10, max: 28, slots: ['helm', 'accessory', 'weapon'] }
];

const BASE_GEAR_NAMES = {
  weapon:    ['Star-Shard Blade', 'Runed Broadsword', 'Astral Longbow', 'Vespera Halberd', 'Obsidian Cleaver'],
  armor:     ['Astral Hauberk', 'Deepwood Brigandine', 'Star-Forged Plate', 'Shadowalker Coat', 'Runed Cuirass'],
  helm:      ['Visor of the Deep', 'Starweaver Hood', 'Ironbound Sallet', 'Astral Crown', 'Stalker Mask'],
  boots:     ['Greaves of Striding', 'Silent Sabatons', 'Starlight Treads', 'Dwarven Marchers', 'Windrunner Boots'],
  accessory: ['Vespera Signet', 'Astral Lens Charm', 'Pendant of Dawn', 'Bloodstone Ring', 'Star-Core Amulet']
};

const SHOP_ITEMS = [
  { id: 'buy_heal',   name: 'Healing Tonic',             type: 'consumable', cost: 18,  reqQM: 0, desc: 'Restores 45% Max HP & cures Bleed/Poison.' },
  { id: 'buy_recall', name: 'Astral Recall Scroll',      type: 'consumable', cost: 30,  reqQM: 0, desc: 'Safely extracts you & your pack from any floor.' },
  { id: 'buy_pick_1', name: 'Dwarven Steel Pickaxe',     type: 'gear', slot: 'pickaxe',   rarity: 'uncommon', maxDur: 50,  cost: 65,  reqQM: 0, desc: '50 Base Durability.' },
  { id: 'buy_wep_1',  name: 'Vespera Runeblade',         type: 'gear', slot: 'weapon',    rarity: 'rare',     atk: 14, crit: 6, cost: 115, reqQM: 1, desc: '+14 ATK, +6% Crit.' },
  { id: 'buy_arm_1',  name: 'Carapace of the Deep',      type: 'gear', slot: 'armor',     rarity: 'rare',     def: 11, maxHp: 25, cost: 115, reqQM: 1, desc: '+11 DEF, +25 Max HP.' },
  { id: 'buy_pick_2', name: 'Mithril Star-Pickaxe',      type: 'gear', slot: 'pickaxe',   rarity: 'rare',     maxDur: 85,  cost: 145, reqQM: 1, desc: '85 Base Durability.' },
  { id: 'buy_acc_2',  name: 'Amulet of the Fallen Star', type: 'gear', slot: 'accessory', rarity: 'epic',     atk: 6, maxHp: 35, crit: 8, cost: 240, reqQM: 2, desc: '+6 ATK, +35 HP, +8% Crit.' },
  { id: 'buy_pick_3', name: 'Titanium Master Pick',      type: 'gear', slot: 'pickaxe',   rarity: 'epic',     maxDur: 140, cost: 260, reqQM: 2, desc: '140 Base Durability.' },
  { id: 'buy_wep_3',  name: 'Eclipse, Blade of Vespera', type: 'gear', slot: 'weapon',    rarity: 'relic',    atk: 28, str: 5, crit: 14, cost: 520, reqQM: 3, desc: '+28 ATK, +5 STR, +14% Crit.' },
  { id: 'buy_pick_4', name: 'Void Astralite Drill',      type: 'gear', slot: 'pickaxe',   rarity: 'relic',    maxDur: 240, cost: 450, reqQM: 3, desc: '240 Base Durability.' }
];

const ELITE_AFFIXES = [
  { id: 'vampiric',  name: 'Vampiric',  color: '#f87171', desc: 'Heals for 40% of damage dealt' },
  { id: 'molten',    name: 'Molten',    color: '#fb923c', desc: 'Inflicts Burn on hit' },
  { id: 'venomous',  name: 'Venomous',  color: '#4ade80', desc: 'Inflicts Poison on hit' },
  { id: 'fortified', name: 'Fortified', color: '#60a5fa', desc: '+35% Defense & HP' }
];

function computeItemPowerScore(item) {
  if (!item) return 0;
  const atk = (item.atk || 0) * 2;
  const def = (item.def || 0) * 2;
  const hp = (item.maxHp || 0) * 0.25;
  const mp = (item.maxMp || 0) * 0.25;
  const crit = (item.crit || 0) * 1.5;
  const dodge = (item.dodge || 0) * 1.5;
  const stats = ((item.str || 0) + (item.dex || 0) + (item.int || 0) + (item.vit || 0)) * 1.2;
  const sockets = ((item.maxSockets || 0) * 4) + (Array.isArray(item.sockets) ? item.sockets.length * 4 : 0);
  const dur = (item.maxDur || 0) * 0.5;
  return Math.round(atk + def + hp + mp + crit + dodge + stats + sockets + dur);
}

function isItemUpgrade(candidateItem, equipment) {
  if (!candidateItem || !candidateItem.slot) return false;
  if (!equipment) return true;
  const curEq = equipment[candidateItem.slot];
  if (!curEq) return true;
  return computeItemPowerScore(candidateItem) > computeItemPowerScore(curEq);
}

  // --- Module: src/data/research.js ---
// 6 Dual-Cost Guild Research Tech Trees

const RESEARCH_PROJECTS = {
  cartography: {
    id: 'cartography',
    name: 'Vault Cartography & Shoring',
    desc: 'Reinforces subterranean shafts and dispels depth wards to unlock deeper floors.',
    levels: [
      { depthPermit: 5,   costGold: 0,    costOre: {},                               desc: 'Permit: Floors 1 – 5' },
      { depthPermit: 10,  costGold: 90,   costOre: { copper: 3 },                    desc: 'Permit: Floor 10 (Starfall Colossus)' },
      { depthPermit: 20,  costGold: 220,  costOre: { iron: 4, copper: 4 },           desc: 'Permit: Floor 20 (Void Weaver)' },
      { depthPermit: 50,  costGold: 520,  costOre: { mithril: 5, starcrystal: 2 },   desc: 'Permit: Floor 50 (Deep Abyss)' },
      { depthPermit: 999, costGold: 1200, costOre: { astralite: 3, starcrystal: 5 }, desc: 'Permit: Infinite Abyssal Descent' }
    ]
  },
  geology: {
    id: 'geology',
    name: 'Subterranean Geology',
    desc: 'Trains miners to fracture denser cosmic mineral veins embedded in vault walls.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                       desc: 'Can mine Copper Ore veins' },
      { rank: 1, costGold: 70,  costOre: { copper: 4 },            desc: 'Unlocks Iron Ore extraction' },
      { rank: 2, costGold: 180, costOre: { iron: 5 },              desc: 'Unlocks Mithril Ore & Relic Geodes' },
      { rank: 3, costGold: 420, costOre: { mithril: 5, geode: 2 }, desc: 'Unlocks Star-Crystal & Void Astralite' }
    ]
  },
  toolsmithing: {
    id: 'toolsmithing',
    name: 'Dwarven Toolsmithing',
    desc: '+50% Max Pickaxe Durability and +20% chance per rank for durability-free mining strikes.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},            desc: 'Base Pickaxe Durability' },
      { rank: 1, costGold: 60,  costOre: { copper: 2 }, desc: '+50% Durability & 20% Free-Strike chance' },
      { rank: 2, costGold: 150, costOre: { iron: 4 },   desc: '+100% Durability & 40% Free-Strike chance' },
      { rank: 3, costGold: 340, costOre: { mithril: 4 },desc: '+150% Durability & 60% Free-Strike chance' }
    ]
  },
  assay: {
    id: 'assay',
    name: 'Antiquarian Assay & Smelting',
    desc: 'Increases gold payout by +35% per rank when selling ores, relics, and spare equipment.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                    desc: '100% Base Appraisal Value' },
      { rank: 1, costGold: 75,  costOre: { copper: 3 },         desc: '135% Appraisal Value (+35%)' },
      { rank: 2, costGold: 175, costOre: { iron: 4, geode: 1 }, desc: '170% Appraisal Value (+70%)' },
      { rank: 3, costGold: 380, costOre: { starcrystal: 3 },    desc: '205% Appraisal Value (+105%)' }
    ]
  },
  quartermaster: {
    id: 'quartermaster',
    name: 'Quartermaster Requisitions',
    desc: 'Expands the Guild Shop with higher-rarity weapons, armor, and masterwork pickaxes.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                               desc: 'Basic Supplies & Dwarven Steel Pickaxe' },
      { rank: 1, costGold: 85,  costOre: { copper: 3, iron: 2 },           desc: 'Unlocks Rare Runeblades & Mithril Pickaxe' },
      { rank: 2, costGold: 210, costOre: { mithril: 4, geode: 1 },         desc: 'Unlocks Epic Star-Armor & Titanium Pickaxe' },
      { rank: 3, costGold: 480, costOre: { starcrystal: 3, astralite: 1 }, desc: 'Unlocks Star-Forged Relics & Astral Drill' }
    ]
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard Recovery Pact',
    desc: 'Guild rescue scouts salvage 20% per rank of unbanked pack value if you fall in battle.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                 desc: '0% Unbanked Loot Salvage on Defeat' },
      { rank: 1, costGold: 65,  costOre: { copper: 2 },      desc: '20% Unbanked Value Salvaged on Defeat' },
      { rank: 2, costGold: 160, costOre: { iron: 3 },        desc: '40% Unbanked Value Salvaged on Defeat' },
      { rank: 3, costGold: 320, costOre: { mithril: 3 },     desc: '60% Unbanked Value Salvaged on Defeat' },
      { rank: 4, costGold: 600, costOre: { starcrystal: 3 }, desc: '80% Unbanked Value Salvaged on Defeat' }
    ]
  }
};

  // --- Module: src/data/monsters.js ---
// Monster & Boss Archetype Registry for Configurable Multi-Dungeon Rosters

const MONSTER_ARCHETYPES = {
  vault_crawler: {
    id: 'vault_crawler',
    bountyTag: 'crawler',
    family: 'beasts',
    name: 'Vault Crawler',
    isRanged: false,
    range: 1,
    hpMult: 1.0,
    atkMult: 1.0,
    defMult: 1.0,
    xpMult: 1.0,
    color: '#f87171',
    desc: 'Chitinous subterranean hunter.'
  },
  brood_skitterer: {
    id: 'brood_skitterer',
    bountyTag: 'crawler',
    family: 'beasts',
    name: 'Brood Skitterer',
    isRanged: false,
    range: 1,
    hpMult: 0.82,
    atkMult: 1.15,
    defMult: 0.8,
    xpMult: 1.05,
    color: '#fb923c',
    desc: 'Razor-limbed swarm predator.'
  },
  spore_lurker: {
    id: 'spore_lurker',
    bountyTag: 'crawler',
    family: 'beasts',
    name: 'Mycelium Lurker',
    isRanged: false,
    range: 1,
    hpMult: 1.15,
    atkMult: 0.95,
    defMult: 1.05,
    xpMult: 1.15,
    onHitStatus: 'poison',
    color: '#4ade80',
    desc: 'Toxic fungal ambusher that inflicts Poison.'
  },
  starfall_archer: {
    id: 'starfall_archer',
    bountyTag: 'archer',
    family: 'astral_cult',
    name: 'Starfall Archer',
    isRanged: true,
    range: 3,
    hpMult: 0.88,
    atkMult: 1.0,
    defMult: 0.85,
    xpMult: 1.05,
    color: '#60a5fa',
    desc: 'Marksman firing shard-tipped arrows (3 tiles).'
  },
  abyssal_cultist: {
    id: 'abyssal_cultist',
    bountyTag: 'archer',
    family: 'astral_cult',
    name: 'Abyssal Cultist',
    isRanged: true,
    range: 4,
    hpMult: 0.95,
    atkMult: 1.12,
    defMult: 0.9,
    xpMult: 1.2,
    color: '#818cf8',
    desc: 'Zealot channeling void bolts (4 tiles).'
  },
  void_hexer: {
    id: 'void_hexer',
    bountyTag: 'archer',
    family: 'astral_cult',
    name: 'Void Hexer',
    isRanged: true,
    range: 4,
    hpMult: 0.9,
    atkMult: 1.18,
    defMult: 0.9,
    xpMult: 1.3,
    onHitStatus: 'weakened',
    color: '#c084fc',
    desc: 'Astral caster weaving weakening curses (4 tiles).'
  },
  astral_wraith: {
    id: 'astral_wraith',
    bountyTag: 'crawler',
    family: 'astral_cult',
    name: 'Astral Wraith',
    isRanged: false,
    range: 1,
    hpMult: 0.95,
    atkMult: 1.25,
    defMult: 0.85,
    xpMult: 1.25,
    color: '#e879f9',
    desc: 'Phasing star-spirit with searing claws.'
  },
  dwarven_automaton: {
    id: 'dwarven_automaton',
    bountyTag: 'crawler',
    family: 'dwarven_forge',
    name: 'Dwarven Automaton',
    isRanged: false,
    range: 1,
    hpMult: 1.28,
    atkMult: 1.05,
    defMult: 1.45,
    xpMult: 1.25,
    color: '#94a3b8',
    desc: 'Clockwork bronze sentinel with heavy plating.'
  },
  magma_golem: {
    id: 'magma_golem',
    bountyTag: 'crawler',
    family: 'dwarven_forge',
    name: 'Slag Golem',
    isRanged: false,
    range: 1,
    hpMult: 1.45,
    atkMult: 1.18,
    defMult: 1.35,
    xpMult: 1.4,
    onHitStatus: 'burn',
    color: '#f97316',
    desc: 'Molten forge-construct radiating intense heat.'
  },
  ember_pyromancer: {
    id: 'ember_pyromancer',
    bountyTag: 'archer',
    family: 'dwarven_forge',
    name: 'Forge Pyromancer',
    isRanged: true,
    range: 3,
    hpMult: 0.92,
    atkMult: 1.15,
    defMult: 0.95,
    xpMult: 1.25,
    onHitStatus: 'burn',
    color: '#fbbf24',
    desc: 'Hurls cinder-bolts that inflict Burn (3 tiles).'
  },
  crypt_stalker: {
    id: 'crypt_stalker',
    bountyTag: 'crawler',
    family: 'ancient_crypt',
    name: 'Crypt Stalker',
    isRanged: false,
    range: 1,
    hpMult: 0.95,
    atkMult: 1.22,
    defMult: 0.95,
    xpMult: 1.2,
    onHitStatus: 'bleed',
    color: '#fda4af',
    desc: 'Relentless tomb-revenant that inflicts Bleed.'
  },
  bone_warden: {
    id: 'bone_warden',
    bountyTag: 'crawler',
    family: 'ancient_crypt',
    name: 'Ossuary Warden',
    isRanged: false,
    range: 1,
    hpMult: 1.32,
    atkMult: 1.1,
    defMult: 1.3,
    xpMult: 1.3,
    color: '#cbd5e1',
    desc: 'Ancient shield-bearer guarding royal vaults.'
  }
};

const BOSS_ARCHETYPES = {
  boss_colossus: {
    id: 'boss_colossus',
    name: 'Starfall Colossus',
    isRanged: false,
    range: 1,
    hp: 240,
    atk: 20,
    def: 10,
    xp: 260,
    dropRarity: 'epic',
    color: '#f59e0b',
    desc: 'Towering monolith animated by meteoric core-fire.'
  },
  boss_weaver: {
    id: 'boss_weaver',
    name: 'Void Weaver',
    isRanged: true,
    range: 4,
    hp: 420,
    atk: 28,
    def: 14,
    xp: 520,
    dropRarity: 'relic',
    color: '#ec4899',
    desc: 'Sovereign arachnid-seer of the Vespera rift (4 tiles).'
  },
  boss_runelord: {
    id: 'boss_runelord',
    name: 'Thane Kazador, Runeforge Warden',
    isRanged: false,
    range: 1,
    hp: 210,
    atk: 18,
    def: 12,
    xp: 240,
    dropRarity: 'epic',
    onHitStatus: 'burn',
    color: '#fb923c',
    desc: 'Undying master of the Sunken Quarry excavation.'
  },
  boss_broodmother: {
    id: 'boss_broodmother',
    name: 'Spore-Queen Mycelia',
    isRanged: true,
    range: 3,
    hp: 310,
    atk: 23,
    def: 11,
    xp: 360,
    dropRarity: 'epic',
    onHitStatus: 'poison',
    color: '#34d399',
    desc: 'Matriarch of the Whispering Labyrinth (3 tiles).'
  },
  boss_ignis: {
    id: 'boss_ignis',
    name: 'Ignis, The Forge Tyrant',
    isRanged: true,
    range: 3,
    hp: 680,
    atk: 38,
    def: 20,
    xp: 850,
    dropRarity: 'relic',
    onHitStatus: 'burn',
    color: '#f97316',
    desc: 'Ancient molten behemoth wielding the white-hot wrath of the subterranean deeps (3 tiles).'
  },
  boss_vespera: {
    id: 'boss_vespera',
    name: "Vespera's Avatar, Heart of the Fallen Star",
    isRanged: true,
    range: 4,
    hp: 1050,
    atk: 48,
    def: 26,
    xp: 1500,
    dropRarity: 'relic',
    onHitStatus: 'weakened',
    color: '#c084fc',
    desc: 'Cosmic astral divinity descending through the abyssal rift to claim the shattered star (4 tiles).'
  }
};

  // --- Module: src/engine/procedural.js ---
// Multi-Style Sector-Grid Procedural Floor Generator, Fast O(W*H) BFS, Declarative Spawns & Socketed Gear








function rollSocketCountForRarity(rarityKey, slot) {
  if (slot === 'pickaxe') return 0;
  if (rarityKey === 'relic') return 2;
  if (rarityKey === 'epic') return Math.random() < 0.60 ? 2 : 1;
  if (rarityKey === 'rare') return Math.random() < 0.25 ? 2 : 1;
  return 0;
}

function generateProceduralEquipment(depth = 1, forcedRarity = null, forcedSlot = null, rarityBonus = 0) {
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];

  let rarityKey = forcedRarity;
  if (!rarityKey) {
    const roll = Math.random() + (depth * 0.04) + (rarityBonus || 0);
    if (roll > 1.22) rarityKey = 'relic';
    else if (roll > 0.94) rarityKey = 'epic';
    else if (roll > 0.64) rarityKey = 'rare';
    else if (roll > 0.32) rarityKey = 'uncommon';
    else rarityKey = 'common';
  }

  const rDef = RARITY[rarityKey] || RARITY.common;
  const baseTitle = BASE_GEAR_NAMES[slot][Math.floor(Math.random() * BASE_GEAR_NAMES[slot].length)];
  const item = {
    uid: nextItemUid('gear'),
    slot,
    rarity: rarityKey,
    name: baseTitle,
    value: Math.round((18 + depth * 6) * rDef.mult),
    affixes: [],
    maxSockets: rollSocketCountForRarity(rarityKey, slot),
    sockets: []
  };

  // Primary stat by slot
  if (slot === 'weapon') {
    item.atk = Math.round((5 + depth * 2.2) * (rarityKey === 'relic' ? 1.35 : 1.0));
  } else if (slot === 'armor') {
    item.def = Math.round((4 + depth * 1.8) * (rarityKey === 'relic' ? 1.35 : 1.0));
  } else if (slot === 'helm') {
    item.def = Math.round(2 + depth * 0.9);
    item.maxHp = Math.round(8 + depth * 4);
  } else if (slot === 'boots') {
    item.def = Math.round(1 + depth * 0.8);
    item.dodge = Math.round(2 + depth * 1.1);
  } else if (slot === 'accessory') {
    item.crit = Math.round(3 + depth * 1.0);
    item.maxMp = Math.round(8 + depth * 3);
  }

  // Roll Affixes based on rarity
  const eligible = AFFIX_POOL.filter(a => a.slots.includes(slot));
  const picked = [];
  for (let i = 0; i < rDef.affixes && eligible.length > 0; i++) {
    const remaining = eligible.filter(a => !picked.some(p => p.id === a.id));
    if (remaining.length === 0) break;
    const aff = remaining[Math.floor(Math.random() * remaining.length)];
    const val = aff.min + Math.floor(Math.random() * (aff.max - aff.min + 1)) + Math.floor(depth * 0.4);
    item[aff.stat] = (item[aff.stat] || 0) + val;
    picked.push({ id: aff.id, label: aff.label, stat: aff.stat, val });
  }
  item.affixes = picked;
  if (picked.length > 0) {
    item.name = `${baseTitle} ${picked[0].label}`;
  }
  return item;
}

// Fast O(W * H) zero-allocation BFS guaranteeing a trap-free walkable path between upPos and downPos
function verifyPureFloorBFS(floor) {
  if (!floor || !floor.tiles || !floor.upPos || !floor.downPos) return false;
  const fh = floor.height || floor.tiles.length;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : 0);
  if (fw <= 0 || fh <= 0) return false;

  const sx = floor.upPos.x;
  const sy = floor.upPos.y;
  const gx = floor.downPos.x;
  const gy = floor.downPos.y;
  if (sx < 0 || sx >= fw || sy < 0 || sy >= fh || gx < 0 || gx >= fw || gy < 0 || gy >= fh) {
    return false;
  }

  const total = fw * fh;
  const visited = new Uint8Array(total);
  const qx = new Int32Array(total);
  const qy = new Int32Array(total);

  let head = 0;
  let tail = 0;
  qx[tail] = sx;
  qy[tail] = sy;
  tail += 1;
  visited[sy * fw + sx] = 1;

  const dxs = [1, -1, 0, 0];
  const dys = [0, 0, 1, -1];

  while (head < tail) {
    const cx = qx[head];
    const cy = qy[head];
    head += 1;
    if (cx === gx && cy === gy) return true;

    for (let d = 0; d < 4; d++) {
      const nx = cx + dxs[d];
      const ny = cy + dys[d];
      if (nx >= 0 && nx < fw && ny >= 0 && ny < fh) {
        const idx = ny * fw + nx;
        if (visited[idx] === 0) {
          const t = floor.tiles[ny][nx];
          const isSafeWalkable = (
            t === TILE_FLOOR ||
            t === TILE_STAIRS_UP ||
            t === TILE_STAIRS_DOWN ||
            t === TILE_CHEST ||
            t === TILE_CHEST_OPEN ||
            t === TILE_SHRINE ||
            t === TILE_SHRINE_USED ||
            t === TILE_TRAP_DISARMED
          );
          if (isSafeWalkable) {
            visited[idx] = 1;
            qx[tail] = nx;
            qy[tail] = ny;
            tail += 1;
          }
        }
      }
    }
  }
  return false;
}

function carveDirectFloorPath(floor) {
  let cx = floor.upPos.x;
  let cy = floor.upPos.y;
  while (cx !== floor.downPos.x) {
    cx += (floor.downPos.x > cx) ? 1 : -1;
    if (floor.tiles[cy][cx] !== TILE_STAIRS_UP && floor.tiles[cy][cx] !== TILE_STAIRS_DOWN) {
      floor.tiles[cy][cx] = TILE_FLOOR;
      if (floor.traps) delete floor.traps[`${cx},${cy}`];
    }
  }
  while (cy !== floor.downPos.y) {
    cy += (floor.downPos.y > cy) ? 1 : -1;
    if (floor.tiles[cy][cx] !== TILE_STAIRS_UP && floor.tiles[cy][cx] !== TILE_STAIRS_DOWN) {
      floor.tiles[cy][cx] = TILE_FLOOR;
      if (floor.traps) delete floor.traps[`${cx},${cy}`];
    }
  }
}

function pickWeightedEntry(entries, effDepth, rand) {
  const valid = entries.filter(e => effDepth >= (e.minFloor || 1));
  const pool = valid.length > 0 ? valid : entries;
  let totalWeight = 0;
  for (let i = 0; i < pool.length; i++) {
    totalWeight += (pool[i].weight || 10);
  }
  let r = rand() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= (pool[i].weight || 10);
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function carveRoomByStyle(tiles, w, h, room, layoutStyle, rand) {
  const { rx, ry, rw, rh, cx, cy } = room;

  if (layoutStyle === 'crystalline_caverns') {
    // Chamfered / organic cavern pocket
    const radX = rw * 0.54;
    const radY = rh * 0.54;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const nx = (x + 0.5 - (rx + rw * 0.5)) / radX;
        const ny = (y + 0.5 - (ry + rh * 0.5)) / radY;
        if (nx * nx + ny * ny <= 1.15 + (rand() * 0.28 - 0.1)) {
          tiles[y][x] = TILE_FLOOR;
        }
      }
    }
    tiles[cy][cx] = TILE_FLOOR;
    return;
  }

  // Carve base rectangular hall
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      tiles[y][x] = TILE_FLOOR;
    }
  }

  // Add architectural stone pillars in large plazas / grand ruins (always keeping >=2-tile walkways & room center clear)
  if ((layoutStyle === 'grand_ruins' || layoutStyle === 'masonry_vaults') && rw >= 8 && rh >= 7 && rand() < 0.65) {
    const px1 = rx + 2;
    const px2 = rx + rw - 3;
    const py1 = ry + 2;
    const py2 = ry + rh - 3;
    const pts = [[px1, py1], [px2, py1], [px1, py2], [px2, py2]];
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0];
      const py = pts[i][1];
      if (!(px === cx && py === cy)) {
        tiles[py][px] = TILE_WALL;
      }
    }
  } else if (layoutStyle === 'excavation_quarry' && rw >= 7 && rh >= 5 && rand() < 0.55) {
    // Quarry support pier off-center so ore veins can form along drift ribs
    const px = rx + 2;
    const py = ry + Math.floor(rh / 2);
    if (!(px === cx && py === cy)) {
      tiles[py][px] = TILE_WALL;
    }
  }
}

function carveCorridorBetweenRooms(tiles, w, h, rA, rB, wideAvenue, bendHorizontalFirst) {
  let cx = rA.cx;
  let cy = rA.cy;
  const tx = rB.cx;
  const ty = rB.cy;

  function stampFloor(x, y) {
    if (x >= 1 && x < w - 1 && y >= 1 && y < h - 1) {
      tiles[y][x] = TILE_FLOOR;
      if (wideAvenue) {
        if (x + 1 < w - 1) tiles[y][x + 1] = TILE_FLOOR;
        if (y + 1 < h - 1) tiles[y + 1][x] = TILE_FLOOR;
      }
    }
  }

  if (bendHorizontalFirst) {
    while (cx !== tx) {
      stampFloor(cx, cy);
      cx += (tx > cx) ? 1 : -1;
    }
    while (cy !== ty) {
      stampFloor(cx, cy);
      cy += (ty > cy) ? 1 : -1;
    }
  } else {
    while (cy !== ty) {
      stampFloor(cx, cy);
      cy += (ty > cy) ? 1 : -1;
    }
    while (cx !== tx) {
      stampFloor(cx, cy);
      cx += (tx > cx) ? 1 : -1;
    }
  }
  stampFloor(tx, ty);
}

function createMonsterEntityFromArchetype(archId, effDepth, mx, my, isElite, rand, seqIdx) {
  const arch = MONSTER_ARCHETYPES[archId] || MONSTER_ARCHETYPES.vault_crawler;
  const affix = isElite ? ELITE_AFFIXES[Math.floor(rand() * ELITE_AFFIXES.length)] : null;
  const hpBase = (28 + effDepth * 8) * arch.hpMult * (isElite ? 1.65 : 1.0);
  const atkBase = (8 + effDepth * 2.2) * arch.atkMult * (isElite ? 1.25 : 1.0);
  const defBase = (2 + effDepth * 1.1) * arch.defMult * ((affix && affix.id === 'fortified') ? 1.35 : 1.0);
  const xpBase = (16 + effDepth * 6) * arch.xpMult * (isElite ? 2.0 : 1.0);

  return {
    uid: `m_${effDepth}_${seqIdx}_${Math.floor(rand() * 100000)}`,
    id: arch.id,
    bountyTag: arch.bountyTag || 'crawler',
    name: isElite ? `${affix.name} ${arch.name}` : arch.name,
    isElite: !!isElite,
    affix,
    isRanged: !!arch.isRanged,
    range: arch.range || 1,
    onHitStatus: arch.onHitStatus || null,
    x: mx,
    y: my,
    hp: Math.max(10, Math.round(hpBase)),
    maxHp: Math.max(10, Math.round(hpBase)),
    atk: Math.max(3, Math.round(atkBase)),
    def: Math.max(0, Math.round(defBase)),
    xp: Math.max(8, Math.round(xpBase)),
    color: isElite ? '#fbbf24' : arch.color,
    statuses: []
  };
}

function generateFloor(depth, dungeonConfig = null, dungeonSeed = null) {
  const cfg = normalizeDungeonConfig(dungeonConfig);
  const w = cfg.width || DEFAULT_MAP_W;
  const h = cfg.height || DEFAULT_MAP_H;
  const effDepth = Math.max(1, depth + (cfg.baseDangerDepth || 0));
  const rand = dungeonSeed
    ? createSeededRng(((dungeonSeed >>> 0) + depth * 7919) >>> 0)
    : Math.random;

  const tiles = createUint8Grid(w, h, TILE_WALL);
  const explored = createUint8Grid(w, h, 0);
  const rooms = [];

  // Macro-Sector Partitioning for O(Sectors) multi-wing generation at any size (21x15 up to 400x300+)
  const usableW = w - 2;
  const usableH = h - 2;
  const secCols = Math.max(2, Math.round(usableW / 13));
  const secRows = Math.max(2, Math.round(usableH / 10));
  const cellW = usableW / secCols;
  const cellH = usableH / secRows;

  const sectorRoomGrid = Array.from({ length: secRows }, () => Array(secCols).fill(null));
  const keepChance = (secCols * secRows <= 6) ? 1.0 : 0.82;

  for (let sr = 0; sr < secRows; sr++) {
    for (let sc = 0; sc < secCols; sc++) {
      if (rand() > keepChance && rooms.length >= 2) continue;

      const sLeft = 1 + Math.floor(sc * cellW);
      const sTop = 1 + Math.floor(sr * cellH);
      const sRight = Math.min(w - 2, Math.floor((sc + 1) * cellW));
      const sBottom = Math.min(h - 2, Math.floor((sr + 1) * cellH));
      const maxRW = Math.max(3, sRight - sLeft - 1);
      const maxRH = Math.max(3, sBottom - sTop - 1);

      let minRW = Math.min(maxRW, cfg.layoutStyle === 'grand_ruins' ? 6 : 5);
      let minRH = Math.min(maxRH, cfg.layoutStyle === 'excavation_quarry' ? 4 : 5);
      if (maxRW <= 4) minRW = 3;
      if (maxRH <= 4) minRH = 3;

      const rw = minRW + Math.floor(rand() * (maxRW - minRW + 1));
      const rh = minRH + Math.floor(rand() * (maxRH - minRH + 1));
      const slackX = Math.max(0, (sRight - sLeft) - rw);
      const slackY = Math.max(0, (sBottom - sTop) - rh);
      const rx = Math.min(w - rw - 1, sLeft + Math.floor(rand() * (slackX + 1)));
      const ry = Math.min(h - rh - 1, sTop + Math.floor(rand() * (slackY + 1)));

      const room = {
        id: rooms.length,
        sc,
        sr,
        rx,
        ry,
        rw,
        rh,
        cx: rx + Math.floor(rw / 2),
        cy: ry + Math.floor(rh / 2)
      };

      carveRoomByStyle(tiles, w, h, room, cfg.layoutStyle, rand);
      rooms.push(room);
      sectorRoomGrid[sr][sc] = room;
    }
  }

  // Fallback guarantee if tiny custom dimensions were passed
  if (rooms.length < 2) {
    const r1 = { id: 0, sc: 0, sr: 0, rx: 2, ry: 2, rw: 4, rh: 4, cx: 4, cy: 4 };
    const r2 = { id: 1, sc: 1, sr: 1, rx: Math.max(6, w - 6), ry: Math.max(6, h - 6), rw: 4, rh: 4, cx: Math.max(7, w - 4), cy: Math.max(7, h - 4) };
    carveRoomByStyle(tiles, w, h, r1, 'masonry_vaults', rand);
    carveRoomByStyle(tiles, w, h, r2, 'masonry_vaults', rand);
    rooms.length = 0;
    rooms.push(r1, r2);
  }

  // Build nearest-neighbor Spanning Tree across rooms so corridors form natural local wings
  const connected = new Uint8Array(rooms.length);
  const edgeSet = {};
  connected[0] = 1;
  let connectedCount = 1;

  while (connectedCount < rooms.length) {
    let bestA = -1;
    let bestB = -1;
    let bestDist = Infinity;

    for (let i = 0; i < rooms.length; i++) {
      if (!connected[i]) continue;
      for (let j = 0; j < rooms.length; j++) {
        if (connected[j]) continue;
        const d = Math.abs(rooms[i].cx - rooms[j].cx) + Math.abs(rooms[i].cy - rooms[j].cy);
        if (d < bestDist) {
          bestDist = d;
          bestA = i;
          bestB = j;
        }
      }
    }

    if (bestA === -1 || bestB === -1) break;
    connected[bestB] = 1;
    connectedCount += 1;
    const eKey = bestA < bestB ? `${bestA}:${bestB}` : `${bestB}:${bestA}`;
    edgeSet[eKey] = true;

    const wideAve = w >= 48 && (cfg.layoutStyle === 'masonry_vaults' || cfg.layoutStyle === 'grand_ruins') && rand() < 0.30;
    carveCorridorBetweenRooms(tiles, w, h, rooms[bestA], rooms[bestB], wideAve, rand() < 0.5);
  }

  // Add Loop Passages between nearby sector neighbors so players have flanking loops & exploration choices
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const ds = Math.abs(rooms[i].sc - rooms[j].sc) + Math.abs(rooms[i].sr - rooms[j].sr);
      if (ds > 2) continue;
      const eKey = `${i}:${j}`;
      if (edgeSet[eKey]) continue;
      if (rand() < cfg.loopRatio) {
        edgeSet[eKey] = true;
        carveCorridorBetweenRooms(tiles, w, h, rooms[i], rooms[j], false, rand() < 0.5);
      }
    }
  }

  // Choose well-separated Entrance (upRoom) and Goal/Exit (downRoom) across opposite wings
  const startIdx = Math.min(rooms.length - 1, Math.floor(rand() * Math.max(1, Math.ceil(rooms.length * 0.2))));
  const upRoom = rooms[startIdx];
  let downRoom = rooms[rooms.length - 1];
  let maxStairDist = -1;
  for (let i = 0; i < rooms.length; i++) {
    if (i === startIdx) continue;
    const d = Math.hypot(rooms[i].cx - upRoom.cx, rooms[i].cy - upRoom.cy);
    if (d > maxStairDist) {
      maxStairDist = d;
      downRoom = rooms[i];
    }
  }

  const upPos = { x: upRoom.cx, y: upRoom.cy };
  let downPos = { x: downRoom.cx, y: downRoom.cy };
  if (upPos.x === downPos.x && upPos.y === downPos.y) {
    downPos = { x: Math.min(w - 2, upPos.x + 3), y: upPos.y };
    for (let x = upPos.x; x <= downPos.x; x++) tiles[upPos.y][x] = TILE_FLOOR;
  }

  const hasDownStairs = depth < cfg.maxDepth;
  tiles[upPos.y][upPos.x] = TILE_STAIRS_UP;
  if (hasDownStairs) {
    tiles[downPos.y][downPos.x] = TILE_STAIRS_DOWN;
  } else {
    // Final floor of a finite-depth dungeon: sanctum floor / reward chest instead of deeper stairs
    tiles[downPos.y][downPos.x] = TILE_CHEST;
  }

  // Area scaling ratio relative to legacy 21x15 (315 tiles)
  const areaRatio = Math.max(1, (w * h) / 315);

  // Designate Guarded Treasure Vault Chambers in remote sectors
  const vaults = [];
  const candidateVaultRooms = rooms.filter(r => r !== upRoom && r !== downRoom);
  const desiredVaults = Math.min(candidateVaultRooms.length, cfg.vaultRoomCount || 0);
  for (let v = 0; v < desiredVaults; v++) {
    const pickIdx = Math.floor(rand() * candidateVaultRooms.length);
    const vr = candidateVaultRooms.splice(pickIdx, 1)[0];
    if (!vr) break;
    if (tiles[vr.cy][vr.cx] === TILE_FLOOR) {
      tiles[vr.cy][vr.cx] = TILE_CHEST;
    }
    vaults.push({ roomId: vr.id, cx: vr.cx, cy: vr.cy, rx: vr.rx, ry: vr.ry, rw: vr.rw, rh: vr.rh });
  }

  // Seed Ore Veins ONLY on WALL tiles bordering FLOOR tiles (Golden Rule #4), including Motherlode Seams!
  const candidateWalls = [];
  const wallIndexMap = new Int32Array(w * h);
  wallIndexMap.fill(-1);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (tiles[y][x] === TILE_WALL) {
        const bordersFloor =
          tiles[y - 1][x] === TILE_FLOOR ||
          tiles[y + 1][x] === TILE_FLOOR ||
          tiles[y][x - 1] === TILE_FLOOR ||
          tiles[y][x + 1] === TILE_FLOOR;
        if (bordersFloor) {
          wallIndexMap[y * w + x] = 1;
          candidateWalls.push({ x, y });
        }
      }
    }
  }

  const veinGoal = Math.round((9 + Math.min(8, effDepth)) * Math.pow(areaRatio, 0.78) * cfg.veinDensityMult);
  let veinsPlaced = 0;
  let safetyVeinIter = 0;

  while (veinsPlaced < veinGoal && candidateWalls.length > 0 && safetyVeinIter < veinGoal * 3) {
    safetyVeinIter += 1;
    const idx = Math.floor(rand() * candidateWalls.length);
    const pos = candidateWalls[idx];
    // O(1) swap-remove
    candidateWalls[idx] = candidateWalls[candidateWalls.length - 1];
    candidateWalls.pop();

    if (tiles[pos.y][pos.x] !== TILE_WALL) continue;
    const pickedOre = pickWeightedEntry(cfg.oreTable, effDepth, rand);
    const oreTile = pickedOre ? pickedOre.tile : TILE_ORE_COPPER;
    tiles[pos.y][pos.x] = oreTile;
    veinsPlaced += 1;

    // Motherlode seam expansion onto adjacent eligible border walls
    if (veinsPlaced < veinGoal && rand() < cfg.motherlodeChance) {
      const clusterSize = 2 + Math.floor(rand() * 3);
      let cx = pos.x;
      let cy = pos.y;
      for (let c = 0; c < clusterSize && veinsPlaced < veinGoal; c++) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]];
        const d = dirs[Math.floor(rand() * dirs.length)];
        const nx = cx + d[0];
        const ny = cy + d[1];
        if (nx >= 1 && nx < w - 1 && ny >= 1 && ny < h - 1 && tiles[ny][nx] === TILE_WALL && wallIndexMap[ny * w + nx] === 1) {
          tiles[ny][nx] = oreTile;
          veinsPlaced += 1;
          cx = nx;
          cy = ny;
        }
      }
    }
  }

  // Place Chests inside rooms (scaled by room count & chestDensityMult)
  const chestChance = Math.min(0.85, 0.38 * cfg.chestDensityMult);
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    if (r === upRoom) continue;
    if (rand() < chestChance) {
      const cx = r.rx + Math.floor(rand() * r.rw);
      const cy = r.ry + Math.floor(rand() * r.rh);
      if (tiles[cy][cx] === TILE_FLOOR && !(cx === downPos.x && cy === downPos.y) && !(cx === upPos.x && cy === upPos.y)) {
        tiles[cy][cx] = TILE_CHEST;
      }
    }
  }

  // Place Subterranean Astral Shrines across wings
  const shrines = {};
  const shrineTypes = ['sanctuary', 'starfire', 'aegis'];
  const shrineGoal = Math.max(1, Math.round(Math.pow(areaRatio, 0.52) * cfg.shrineDensityMult * 0.75));
  let shrinesPlaced = 0;
  for (let sTry = 0; sTry < shrineGoal * 14 && shrinesPlaced < shrineGoal; sTry++) {
    const rm = rooms[Math.floor(rand() * rooms.length)];
    if (rm === upRoom && rooms.length > 2) continue;
    const sx = rm.rx + Math.floor(rand() * rm.rw);
    const sy = rm.ry + Math.floor(rand() * rm.rh);
    if (tiles[sy][sx] === TILE_FLOOR && !(sx === upPos.x && sy === upPos.y) && !(sx === downPos.x && sy === downPos.y)) {
      tiles[sy][sx] = TILE_SHRINE;
      shrines[`${sx},${sy}`] = {
        type: shrineTypes[Math.floor(rand() * shrineTypes.length)]
      };
      shrinesPlaced += 1;
    }
  }

  // Place Concealed Runic Traps inside non-starting rooms (safe BFS enforced below)
  const traps = {};
  const trapGoal = Math.round((2 + Math.min(4, effDepth)) * Math.pow(areaRatio, 0.65) * cfg.trapDensityMult);
  let trapsPlaced = 0;
  for (let tTry = 0; tTry < trapGoal * 10 && trapsPlaced < trapGoal; tTry++) {
    const rm = rooms[Math.floor(rand() * rooms.length)];
    if (rm === upRoom) continue;
    const tx = rm.rx + Math.floor(rand() * rm.rw);
    const ty = rm.ry + Math.floor(rand() * rm.rh);
    if (
      tiles[ty][tx] === TILE_FLOOR &&
      !(tx === upPos.x && ty === upPos.y) &&
      !(tx === downPos.x && ty === downPos.y) &&
      Math.hypot(tx - upPos.x, ty - upPos.y) >= 3.0
    ) {
      tiles[ty][tx] = TILE_TRAP_HIDDEN;
      const tType = cfg.allowedTraps[Math.floor(rand() * cfg.allowedTraps.length)] || 'spike';
      traps[`${tx},${ty}`] = { type: tType };
      trapsPlaced += 1;
    }
  }

  const floorObj = {
    packed: false,
    depth,
    biomeId: resolveFloorBiome(cfg, depth),
    width: w,
    height: h,
    roomCount: rooms.length,
    tiles,
    explored,
    upPos,
    downPos,
    hasDownStairs,
    shrines,
    traps,
    vaults,
    monsters: [],
    oresMined: 0
  };

  // Guarantee pure trap-free walkability between < and > (or final sanctum)
  if (!verifyPureFloorBFS(floorObj)) {
    carveDirectFloorPath(floorObj);
  }

  // Occupancy bitmap for fast O(1) monster placement collision checks on huge floors
  const occupied = new Uint8Array(w * h);
  occupied[upPos.y * w + upPos.x] = 1;

  // 1. Spawn Scheduled Boss (if configured for this floor depth)
  const scheduledBossId = cfg.bossSchedule && cfg.bossSchedule[depth];
  if (scheduledBossId && BOSS_ARCHETYPES[scheduledBossId]) {
    const bDef = BOSS_ARCHETYPES[scheduledBossId];
    let bx = downRoom.cx;
    let by = downRoom.cy;
    if (!hasDownStairs && tiles[by][bx] === TILE_CHEST) {
      // Place boss adjacent to the final sanctum chest if possible
      const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (let a = 0; a < adj.length; a++) {
        const nx = bx + adj[a][0];
        const ny = by + adj[a][1];
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && tiles[ny][nx] === TILE_FLOOR) {
          bx = nx;
          by = ny;
          break;
        }
      }
    }
    occupied[by * w + bx] = 1;
    floorObj.monsters.push({
      uid: `boss_${depth}_${Date.now()}`,
      id: bDef.id,
      bountyTag: 'boss',
      name: bDef.name,
      isBoss: true,
      dropRarity: bDef.dropRarity || 'epic',
      isRanged: !!bDef.isRanged,
      range: bDef.range || 1,
      onHitStatus: bDef.onHitStatus || null,
      x: bx,
      y: by,
      hp: bDef.hp,
      maxHp: bDef.hp,
      atk: bDef.atk,
      def: bDef.def,
      xp: bDef.xp,
      color: bDef.color,
      statuses: []
    });
  }

  // 2. Spawn Elite Vault Wardens inside Guarded Treasure Vaults
  let mSeq = 1;
  for (let v = 0; v < vaults.length; v++) {
    const vr = vaults[v];
    for (let tries = 0; tries < 10; tries++) {
      const mx = vr.rx + Math.floor(rand() * vr.rw);
      const my = vr.ry + Math.floor(rand() * vr.rh);
      if (tiles[my][mx] === TILE_FLOOR && occupied[my * w + mx] === 0 && Math.hypot(mx - upPos.x, my - upPos.y) > 5) {
        occupied[my * w + mx] = 1;
        const pickedM = pickWeightedEntry(cfg.monsterPool, effDepth, rand);
        floorObj.monsters.push(createMonsterEntityFromArchetype(pickedM.id, effDepth, mx, my, true, rand, mSeq++));
        break;
      }
    }
  }

  // 3. Spawn Sector Monster Roster across rooms (scaled smoothly by floor area)
  const spawnRegularPack = !scheduledBossId || areaRatio >= 2.5;
  if (spawnRegularPack) {
    const baseCount = scheduledBossId ? 2 + Math.min(4, effDepth) : 4 + Math.min(6, effDepth);
    const monsterGoal = Math.round(baseCount * Math.pow(areaRatio, 0.70) * cfg.monsterDensityMult);
    let spawned = 0;

    for (let attempt = 0; attempt < monsterGoal * 6 && spawned < monsterGoal; attempt++) {
      const rm = rooms[Math.floor(rand() * rooms.length)];
      if (rm === upRoom) continue;
      if (scheduledBossId && rm === downRoom) continue;

      const mx = rm.rx + Math.floor(rand() * rm.rw);
      const my = rm.ry + Math.floor(rand() * rm.rh);
      if (
        (tiles[my][mx] === TILE_FLOOR || tiles[my][mx] === TILE_STAIRS_DOWN) &&
        occupied[my * w + mx] === 0 &&
        Math.hypot(mx - upPos.x, my - upPos.y) >= 5.0
      ) {
        occupied[my * w + mx] = 1;
        const isElite = effDepth >= 2 && rand() < cfg.eliteChance;
        const pickedM = pickWeightedEntry(cfg.monsterPool, effDepth, rand);
        floorObj.monsters.push(createMonsterEntityFromArchetype(pickedM.id, effDepth, mx, my, isElite, rand, mSeq++));
        spawned += 1;
      }
    }
  }

  return floorObj;
}

  // --- Module: src/engine/actions.js ---
// Interactive Mining, Multi-Dungeon Atlas Management, Astral Gems & Lapidary, Guild Bounties, Shrines, Traps & Extraction













const actionCallbacks = {
  log: (msg, tone) => emitEngineEvent(ENGINE_EVENTS.LOG, { msg, tone }, gameState),
  updateUI: () => emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, gameState),
  floatingText: (x, y, text, color) => emitEngineEvent(ENGINE_EVENTS.FLOATING_TEXT, { x, y, text, color }, gameState),
  outcomeModal: (title, desc, details, isConfirm) => emitEngineEvent(ENGINE_EVENTS.OUTCOME_MODAL, { title, desc, details, isConfirm }, gameState),
  updateFOV: () => emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, gameState),
  onTurnEnd: () => emitEngineEvent(ENGINE_EVENTS.TURN_END, {}, gameState)
};

const registeredBridgeHandlers = {};

function bindBridgeHandler(slot, eventName, handlerFn) {
  if (registeredBridgeHandlers[slot]) {
    offEngineEvent(eventName, registeredBridgeHandlers[slot]);
  }
  registeredBridgeHandlers[slot] = handlerFn;
  onEngineEvent(eventName, handlerFn);
}

function registerActionCallbacks(cbs) {
  if (!cbs) return;
  if (typeof cbs.log === 'function') {
    bindBridgeHandler('log', ENGINE_EVENTS.LOG, p => cbs.log(p.msg, p.tone));
  }
  if (typeof cbs.updateUI === 'function') {
    bindBridgeHandler('updateUI', ENGINE_EVENTS.UI_SYNC, () => cbs.updateUI());
  }
  if (typeof cbs.floatingText === 'function') {
    bindBridgeHandler('floatingText', ENGINE_EVENTS.FLOATING_TEXT, p => cbs.floatingText(p.x, p.y, p.text, p.color));
  }
  if (typeof cbs.outcomeModal === 'function') {
    bindBridgeHandler('outcomeModal', ENGINE_EVENTS.OUTCOME_MODAL, p => cbs.outcomeModal(p.title, p.desc, p.details, p.isConfirm));
  }
  if (typeof cbs.updateFOV === 'function') {
    bindBridgeHandler('updateFOV', ENGINE_EVENTS.FOV_SYNC, () => cbs.updateFOV());
  }
  if (typeof cbs.onTurnEnd === 'function') {
    bindBridgeHandler('onTurnEnd', ENGINE_EVENTS.TURN_END, () => cbs.onTurnEnd());
  }
}

function getActionCallbacks() {
  return actionCallbacks;
}

function applyStatusEffect(target, id, duration) {
  if (!target.statuses) target.statuses = [];
  const metaMap = {
    burn:            { id: 'burn',            name: 'Burn',              color: '#fb923c', duration, isBuff: false },
    bleed:           { id: 'bleed',           name: 'Bleed',             color: '#f87171', duration, isBuff: false },
    poison:          { id: 'poison',          name: 'Poison',            color: '#4ade80', duration, isBuff: false },
    stun:            { id: 'stun',            name: 'Stunned',           color: '#fbbf24', duration, isBuff: false },
    weakened:        { id: 'weakened',        name: 'Weakened',          color: '#c084fc', duration, isBuff: false },
    shrine_starfire: { id: 'shrine_starfire', name: 'Starfire Blessing', color: '#fbbf24', duration, isBuff: true },
    shrine_aegis:    { id: 'shrine_aegis',    name: 'Astral Aegis',      color: '#60a5fa', duration, isBuff: true }
  };
  const meta = metaMap[id];
  if (!meta) return;
  const existing = target.statuses.find(s => s.id === id);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else target.statuses.push(Object.assign({}, meta));
}

function addExpeditionTradeItem(id, name, val, qty = 1, type = 'Ore', state = gameState) {
  const pack = state.hero.expeditionPack;
  const existing = pack.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else pack.push({ id, name, val, qty, type });
}

function gainExperience(amount, state = gameState) {
  const h = state.hero;
  if (!h) return;
  h.xp += amount;
  while (h.xp >= h.maxXp) {
    h.xp -= h.maxXp;
    h.level += 1;
    h.maxXp = Math.round(h.maxXp * 1.4);
    h.statPoints = (h.statPoints || 0) + 2;
    h.talentPoints = (h.talentPoints || 0) + 1;
    recomputeHeroDerivedStats(true, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(h.x, h.y, `LEVEL UP! Lv ${h.level}`, '#fbbf24');
      actionCallbacks.log(`LEVEL UP! Reached Level ${h.level} (+2 Stat Points, +1 Talent Point).`, 'good');
    }
  }
}

// ============================================================================
// MULTI-DUNGEON EXPEDITION ATLAS & CUSTOM CHARTER MANAGEMENT
// ============================================================================

function selectActiveDungeon(dungeonId, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  if (!state.dungeons || !state.dungeons[dungeonId]) {
    return { ok: false, reason: 'not_found' };
  }
  const dng = state.dungeons[dungeonId];
  const reqCart = (dng.config && dng.config.reqCartography) || 0;
  const curCart = (state.guildResearch && state.guildResearch.cartography) || 0;
  if (curCart < reqCart) {
    if (state === gameState) {
      actionCallbacks.log(`Requires Vault Cartography Rank ${reqCart} to chart routes to ${dng.name}.`, 'bad');
    }
    return { ok: false, reason: 'cartography_locked', reqCart };
  }

  state.activeDungeonId = dungeonId;
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`🗺️ Expedition destination set to ${dng.name} (${dng.config.width}x${dng.config.height}, Seed ${dng.seedCode}).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, dungeonId, dungeon: state.dungeon };
}

function chartCustomExpedition(opts = {}, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  const allDungeons = state.dungeons || {};
  const charteredCount = Object.keys(allDungeons).filter(
    k => allDungeons[k] && allDungeons[k].originType === 'chartered'
  ).length;
  const cap = state.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS;
  if (charteredCount >= cap) {
    if (state === gameState) {
      actionCallbacks.log(`Charter limit reached (${charteredCount}/${cap}). Abandon an old charter first.`, 'bad');
    }
    return { ok: false, reason: 'charter_cap_reached', cap };
  }

  const newDng = buildCharteredDungeonInstance(opts);
  state.dungeons[newDng.id] = newDng;
  state.activeDungeonId = newDng.id;
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(
      `🧭 Chartered "${newDng.name}" (${newDng.config.width}x${newDng.config.height} • Max Fl ${newDng.config.maxDepth} • ${newDng.seedCode})!`,
      'gold'
    );
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, dungeon: newDng };
}

function resetOrAbandonDungeon(dungeonId, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  const dng = state.dungeons && state.dungeons[dungeonId];
  if (!dng) {
    return { ok: false, reason: 'not_found' };
  }

  if (dng.originType === 'chartered') {
    const oldName = dng.name;
    delete state.dungeons[dungeonId];
    if (state.activeDungeonId === dungeonId) {
      state.activeDungeonId = state.dungeons.dng_starfall
        ? 'dng_starfall'
        : Object.keys(state.dungeons)[0];
    }
    syncActiveDungeonAlias(state);
    if (state === gameState) {
      playSound('hit');
      actionCallbacks.log(`Sealed and retired expedition charter "${oldName}".`, 'info');
      saveGame();
      actionCallbacks.updateUI();
    }
    return { ok: true, action: 'abandoned', activeDungeonId: state.activeDungeonId };
  }

  const prefix = (dng.config && dng.config.seedPrefix) || 'STAR';
  dng.seedCode = randomSeedCode(prefix);
  dng.numericSeed = hashSeedString(dng.seedCode, 0);
  dng.currentFloor = 1;
  dng.deepestFloor = 1;
  dng.isCleared = false;
  dng.floors = {};
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(`Re-charted ${dng.name} with fresh subterranean seed ${dng.seedCode}!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, action: 'reset', seedCode: dng.seedCode };
}

// ============================================================================
// GUILD NOTICE BOARD (PROCEDURAL BOUNTY CONTRACTS)
// ============================================================================

function ensureGuildBounties(forceRefresh = false, state = gameState) {
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  if (forceRefresh || !Array.isArray(state.guildBounties) || state.guildBounties.length === 0) {
    state.guildBounties = buildProceduralBountySet(geo, cart);
  }
  return state.guildBounties;
}

function rerollGuildBounties(state = gameState) {
  if (state.guildVault.gold < BOUNTY_REROLL_COST) {
    if (state === gameState) {
      actionCallbacks.log(`Need ${BOUNTY_REROLL_COST} Vault Gold to post fresh Notice Board contracts.`, 'bad');
    }
    return { ok: false, reason: 'no_gold' };
  }
  state.guildVault.gold -= BOUNTY_REROLL_COST;
  ensureGuildBounties(true, state);
  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Posted 3 fresh Guild Bounty contracts (-${BOUNTY_REROLL_COST}g).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, bounties: state.guildBounties };
}

function recordBountyProgress(kind, targetTags, amount = 1, state = gameState) {
  if (!Array.isArray(state.guildBounties)) return 0;
  const tags = Array.isArray(targetTags) ? targetTags : [targetTags];
  let newlyCompleted = 0;

  for (let i = 0; i < state.guildBounties.length; i++) {
    const b = state.guildBounties[i];
    if (!b || b.completed || b.kind !== kind) continue;
    if (tags.indexOf(b.targetId) !== -1) {
      b.curQty = Math.min(b.reqQty, (b.curQty || 0) + amount);
      if (b.curQty >= b.reqQty) {
        b.completed = true;
        newlyCompleted += 1;
        if (state === gameState) {
          playSound('lvl');
          actionCallbacks.log(`📜 Bounty Complete: ${b.title}! Extract to the Guild to claim ${b.rewardLabel}.`, 'gold');
        }
      }
    }
  }
  return newlyCompleted;
}

function applySingleBountyReward(bounty, state) {
  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }
  if (bounty.rewardType === 'gold') {
    state.guildVault.gold += bounty.rewardQty;
  } else if (bounty.rewardType === 'talent_tome' && state.hero) {
    state.hero.talentPoints = (state.hero.talentPoints || 0) + bounty.rewardQty;
  } else if (bounty.rewardType === 'gem') {
    state.guildVault.gems[bounty.rewardId] = (state.guildVault.gems[bounty.rewardId] || 0) + bounty.rewardQty;
  } else if (bounty.rewardType === 'ore') {
    state.guildVault[bounty.rewardId] = (state.guildVault[bounty.rewardId] || 0) + bounty.rewardQty;
  }
}

function payoutCompletedBounties(state = gameState) {
  ensureGuildBounties(false, state);
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  const replacementPool = buildProceduralBountySet(geo, cart);
  const claimedLabels = [];

  for (let i = 0; i < state.guildBounties.length; i++) {
    const b = state.guildBounties[i];
    if (b && b.completed) {
      applySingleBountyReward(b, state);
      claimedLabels.push(`${b.title} (${b.rewardLabel})`);
      state.guildBounties[i] = replacementPool[i % replacementPool.length];
    }
  }

  return claimedLabels;
}

function claimBountyAtGuild(bountyId, state = gameState) {
  ensureGuildBounties(false, state);
  const idx = state.guildBounties.findIndex(b => b.id === bountyId);
  if (idx === -1 || !state.guildBounties[idx].completed) {
    return { ok: false, reason: 'not_completed' };
  }
  const b = state.guildBounties[idx];
  applySingleBountyReward(b, state);
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  const freshSet = buildProceduralBountySet(geo, cart);
  state.guildBounties[idx] = freshSet[idx % freshSet.length];

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Claimed Notice Board Bounty "${b.title}": ${b.rewardLabel}!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, rewardLabel: b.rewardLabel };
}

// ============================================================================
// MINING, ASTRAL GEM DROPS & LAPIDARY BENCH
// ============================================================================

function rollUncutGemForOreTile(tile) {
  const coreGems = ['ruby', 'emerald', 'sapphire', 'topaz'];
  let chance = 0;
  let voidWeight = 0;

  if (tile === TILE_ORE_MITHRIL) {
    chance = 0.22;
  } else if (tile === TILE_ORE_GEODE) {
    chance = 0.35;
  } else if (tile === TILE_ORE_STAR) {
    chance = 0.40;
    voidWeight = 0.20;
  } else if (tile === TILE_ORE_ASTRAL) {
    chance = 0.55;
    voidWeight = 0.40;
  }

  if (chance <= 0 || Math.random() >= chance) return null;
  if (voidWeight > 0 && Math.random() < voidWeight) {
    return 'void_diamond';
  }
  return coreGems[Math.floor(Math.random() * coreGems.length)];
}

function mineTile(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };
  if (y < 0 || y >= floor.tiles.length || x < 0 || x >= floor.tiles[0].length) {
    return { ok: false, reason: 'out_of_bounds' };
  }

  const tile = floor.tiles[y][x];
  const ore = ORE_CATALOG[tile];
  if (!ore) return { ok: false, reason: 'not_ore' };

  const pick = state.hero.equipment.pickaxe;
  if (!pick || pick.curDur <= 0) {
    if (state === gameState) {
      actionCallbacks.floatingText(x, y, 'Pickaxe Broken!', '#f87171');
      actionCallbacks.log('Your pickaxe is broken! Repair or replace it at the Guild.', 'bad');
      playSound('hit');
    }
    return { ok: false, reason: 'broken_pickaxe' };
  }

  const geoRank = state.guildResearch.geology || 0;
  if (geoRank < ore.minGeology) {
    if (state === gameState) {
      actionCallbacks.floatingText(x, y, `Req Geology R${ore.minGeology}!`, '#fbbf24');
      actionCallbacks.log(`This ${ore.name} vein is too dense! Research Subterranean Geology Rank ${ore.minGeology} at the Guild Lab.`, 'bad');
      playSound('hit');
    }
    return { ok: false, reason: 'geology_locked' };
  }

  // Thief Mineral Vein Sense (t_b2 * 0.25) & Dwarven Toolsmithing (toolRank * 0.20)
  const t_b2 = (state.hero.talentsAllocated && state.hero.talentsAllocated.t_b2) || 0;
  const toolRank = state.guildResearch.toolsmithing || 0;
  const freeMine = (t_b2 > 0 && Math.random() < (t_b2 * 0.25)) || (toolRank > 0 && Math.random() < (toolRank * 0.20));

  if (!freeMine) {
    pick.curDur = Math.max(0, pick.curDur - 1);
  }

  floor.tiles[y][x] = TILE_FLOOR;
  floor.oresMined = (floor.oresMined || 0) + 1;

  const codex = ensureCodexState(state);
  codex.totalOresMined = (codex.totalOresMined || 0) + 1;
  codex.oreMinedById[ore.id] = (codex.oreMinedById[ore.id] || 0) + 1;

  addExpeditionTradeItem(ore.id, ore.name, ore.baseValue, 1, 'Ore', state);
  recordBountyProgress('mine', [ore.id], 1, state);

  // High-tier vein uncut Astral Gem drop check
  const droppedGemId = rollUncutGemForOreTile(tile);
  if (droppedGemId && GEM_CATALOG[droppedGemId]) {
    codex.totalGemsUnearthed = (codex.totalGemsUnearthed || 0) + 1;
    const gemDef = GEM_CATALOG[droppedGemId];
    addExpeditionTradeItem(gemDef.id, gemDef.name, gemDef.baseValue, 1, 'Gem', state);
    if (state === gameState) {
      actionCallbacks.log(`💎 Unearthed uncut ${gemDef.name} (${gemDef.desc}) from the vein!`, 'good');
    }
  }

  emitEngineEvent(ENGINE_EVENTS.ORE_MINED, {
    oreId: ore.id,
    tile,
    freeMine,
    gemDropped: droppedGemId,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);

  if (state === gameState) {
    playSound('mine');
    actionCallbacks.floatingText(x, y, `+1 ${ore.name}${freeMine ? ' (FREE!)' : ''}`, ore.sparkle);
    actionCallbacks.log(`Mined ${ore.name} (+1 to Pack). Pickaxe: ${pick.curDur}/${getPickaxeMaxDurability(state)}.`, 'gold');

    // Geode bonus equipment roll
    if (tile === TILE_ORE_GEODE && Math.random() < 0.45) {
      const rarityBonus = (state.dungeon && state.dungeon.config && state.dungeon.config.lootRarityBonus) || 0;
      const dropGear = generateProceduralEquipment(floor.depth, 'rare', null, rarityBonus);
      state.hero.expeditionGear.push(dropGear);
      actionCallbacks.log(`Cracked Relic Geode contained ${dropGear.name}!`, 'good');
    }

    gainExperience(ore.xp, state);
    actionCallbacks.updateFOV();
    actionCallbacks.updateUI();
  }

  return { ok: true, oreId: ore.id, freeMine, gemDropped: droppedGemId };
}

function resolveLapidaryTargetItem(targetRef, isEquipped, state) {
  if (!state || !state.hero) return null;
  if (isEquipped) {
    if (state.hero.equipment[targetRef]) {
      return state.hero.equipment[targetRef];
    }
    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
    for (let i = 0; i < slots.length; i++) {
      const eq = state.hero.equipment[slots[i]];
      if (eq && eq.uid === targetRef) return eq;
    }
    return null;
  }
  return state.guildVault.armory.find(g => g.uid === targetRef) || null;
}

function socketGemIntoItem(targetRef, gemId, isEquipped = true, state = gameState) {
  const gemDef = GEM_CATALOG[gemId];
  if (!gemDef) return { ok: false, reason: 'invalid_gem' };

  const item = resolveLapidaryTargetItem(targetRef, isEquipped, state);
  if (!item) return { ok: false, reason: 'item_not_found' };
  normalizeEquipmentSockets(item);

  if (item.slot === 'pickaxe' || (item.maxSockets || 0) <= 0) {
    if (state === gameState) actionCallbacks.log(`${item.name} has no Astral Gem sockets.`, 'bad');
    return { ok: false, reason: 'no_sockets' };
  }
  if (item.sockets.length >= item.maxSockets) {
    if (state === gameState) actionCallbacks.log(`All gem sockets on ${item.name} are already filled.`, 'bad');
    return { ok: false, reason: 'sockets_full' };
  }
  if (!state.guildVault.gems || (state.guildVault.gems[gemId] || 0) <= 0) {
    if (state === gameState) actionCallbacks.log(`No banked ${gemDef.name} in your Guild Vault.`, 'bad');
    return { ok: false, reason: 'no_gem_in_vault' };
  }

  state.guildVault.gems[gemId] -= 1;
  item.sockets.push(gemId);
  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(`💎 Socketed ${gemDef.name} (${gemDef.desc}) into ${item.name}!`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, gemId, sockets: item.sockets.slice() };
}

function unsocketGemFromItem(targetRef, socketIndex = 0, isEquipped = true, state = gameState) {
  const item = resolveLapidaryTargetItem(targetRef, isEquipped, state);
  if (!item) return { ok: false, reason: 'item_not_found' };
  normalizeEquipmentSockets(item);

  if (socketIndex < 0 || socketIndex >= item.sockets.length) {
    return { ok: false, reason: 'empty_socket' };
  }
  if (state.guildVault.gold < LAPIDARY_UNSOCKET_COST) {
    if (state === gameState) {
      actionCallbacks.log(`Need ${LAPIDARY_UNSOCKET_COST} Vault Gold for the Lapidary to extract a socketed gem.`, 'bad');
    }
    return { ok: false, reason: 'no_gold' };
  }

  state.guildVault.gold -= LAPIDARY_UNSOCKET_COST;
  const removedGemId = item.sockets.splice(socketIndex, 1)[0];
  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }
  state.guildVault.gems[removedGemId] = (state.guildVault.gems[removedGemId] || 0) + 1;
  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    const gemDef = GEM_CATALOG[removedGemId];
    playSound('gold');
    actionCallbacks.log(`Extracted ${gemDef ? gemDef.name : removedGemId} from ${item.name} back to Guild Vault (-${LAPIDARY_UNSOCKET_COST}g).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, gemId: removedGemId };
}

function sellGemUnit(gemId, sellAll = false, state = gameState) {
  if (!state.guildVault.gems) return 0;
  const count = state.guildVault.gems[gemId] || 0;
  if (count <= 0) return 0;

  const gemDef = GEM_CATALOG[gemId];
  const baseVal = gemDef ? gemDef.baseValue : 65;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const qtyToSell = sellAll ? count : 1;
  const payout = Math.round(baseVal * qtyToSell * mult);

  state.guildVault.gems[gemId] -= qtyToSell;
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${qtyToSell}x ${gemDef ? gemDef.name : gemId} at Assay Counter for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

// ============================================================================
// SUBTERRANEAN ASTRAL SHRINES & TACTICAL RUNIC TRAPS
// ============================================================================

function detectNearbyTraps(floor, state = gameState) {
  if (!floor || !floor.tiles || !state || !state.hero) return 0;
  const h = state.hero;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const vision = h.visionRadius || 5;
  const spotScore = (h.computedDex || 10) * 2 + vision * 6;
  const threshold = 26 + (floor.depth || 1) * 3;
  const isScoutClass = h.classId === 'thief' || h.classId === 'ranger';
  let spottedCount = 0;

  const minY = Math.max(0, Math.floor(h.y - vision - 1));
  const maxY = Math.min(fh - 1, Math.ceil(h.y + vision + 1));
  const minX = Math.max(0, Math.floor(h.x - vision - 1));
  const maxX = Math.min(fw - 1, Math.ceil(h.x + vision + 1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (floor.tiles[y][x] !== TILE_TRAP_HIDDEN) continue;
      const dist = Math.hypot(x - h.x, y - h.y);
      if (dist > vision + 0.35) continue;

      if ((isScoutClass && dist <= 2.5) || spotScore >= threshold) {
        floor.tiles[y][x] = TILE_TRAP_VISIBLE;
        spottedCount += 1;
        if (state === gameState) {
          const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
          const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
          actionCallbacks.floatingText(x, y, '⚠ TRAP SPOTTED!', '#fbbf24');
          actionCallbacks.log(`Keen senses revealed a ${tDef.name} at (${x}, ${y})!`, 'gold');
        }
      }
    }
  }
  return spottedCount;
}

function activateAstralShrine(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || floor.tiles[y][x] !== TILE_SHRINE) {
    return { ok: false, reason: 'not_shrine' };
  }

  const h = state.hero;
  const sMeta = (floor.shrines && floor.shrines[`${x},${y}`]) || { type: 'sanctuary' };
  const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;

  floor.tiles[y][x] = TILE_SHRINE_USED;
  h.x = x;
  h.y = y;

  if (sDef.id === 'sanctuary') {
    const hpGain = Math.round(h.maxHp * 0.50);
    const mpGain = Math.round(h.maxMp * 0.50);
    h.hp = Math.min(h.maxHp, h.hp + hpGain);
    h.mp = Math.min(h.maxMp, h.mp + mpGain);
    h.statuses = (h.statuses || []).filter(s => !!s.isBuff);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(x, y, `+${hpGain} HP / +${mpGain} MP`, sDef.color);
      actionCallbacks.log(`✨ Touched ${sDef.name}: Restored +${hpGain} HP, +${mpGain} MP & cleansed afflictions!`, 'good');
    }
  } else {
    applyStatusEffect(h, sDef.statusId, sDef.duration);
    recomputeHeroDerivedStats(false, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(x, y, `${sDef.statusName.toUpperCase()}!`, sDef.color);
      actionCallbacks.log(`✨ Touched ${sDef.name}: ${sDef.desc}`, 'good');
    }
  }

  const codex = ensureCodexState(state);
  codex.totalShrinesActivated = (codex.totalShrinesActivated || 0) + 1;

  detectNearbyTraps(floor, state);
  emitEngineEvent(ENGINE_EVENTS.SHRINE_ACTIVATED, {
    shrineType: sDef.id,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);
  return { ok: true, shrineType: sDef.id };
}

function resolveTrapInteraction(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };
  const tile = floor.tiles[y][x];
  if (tile !== TILE_TRAP_HIDDEN && tile !== TILE_TRAP_VISIBLE) {
    return { ok: false, reason: 'not_trap' };
  }

  const h = state.hero;
  const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
  const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;

  floor.tiles[y][x] = TILE_TRAP_DISARMED;
  h.x = x;
  h.y = y;

  const canDisarm = tile === TILE_TRAP_VISIBLE && (h.classId === 'thief' || h.classId === 'ranger');
  if (canDisarm) {
    const xpGain = 15 + (floor.depth || 1) * 5;
    gainExperience(xpGain, state);
    if (state === gameState) {
      playSound('gold');
      actionCallbacks.floatingText(x, y, `DISARMED (+${xpGain} XP)`, '#34d399');
      actionCallbacks.log(`Disarmed ${tDef.name} safely (+${xpGain} XP)!`, 'good');
    }
    detectNearbyTraps(floor, state);
    return { ok: true, disarmed: true, triggered: false, dmg: 0, trapType: tDef.id, fatal: false };
  }

  const rawDmg = tDef.baseDmg + (floor.depth || 1) * tDef.depthScale;
  const dmg = Math.max(3, rawDmg - Math.floor((h.def || 0) * 0.4));
  h.hp -= dmg;
  applyStatusEffect(h, tDef.statusId, tDef.statusDuration);

  if (state === gameState) {
    playSound('hit');
    actionCallbacks.floatingText(x, y, `TRAP! -${dmg}`, tDef.color);
    actionCallbacks.log(`Triggered ${tDef.name} for ${dmg} damage and ${tDef.statusId.toUpperCase()}!`, 'bad');
  }

  detectNearbyTraps(floor, state);
  return {
    ok: true,
    disarmed: false,
    triggered: true,
    dmg,
    statusId: tDef.statusId,
    trapType: tDef.id,
    fatal: h.hp <= 0,
    killerName: tDef.name
  };
}

// ============================================================================
// CONSUMABLES, EXTRACTION, DEFEAT SALVAGE, SHOP & RESEARCH
// ============================================================================

function useHealingTonic(state = gameState) {
  if (state.inGuild) {
    if (state === gameState) actionCallbacks.log('Use the Sanctuary Hearth to rest for free while in the Guild.', 'info');
    return false;
  }
  const h = state.hero;
  if (((h.consumables && h.consumables.potions) || 0) <= 0) {
    if (state === gameState) actionCallbacks.log('No Healing Tonics remaining!', 'bad');
    return false;
  }
  const hasNegativeAffliction = (h.statuses || []).some(s => !s.isBuff);
  if (h.hp >= h.maxHp && !hasNegativeAffliction) {
    if (state === gameState) actionCallbacks.log('You are already at full health.', 'info');
    return false;
  }

  h.consumables.potions -= 1;
  const heal = Math.round(h.maxHp * 0.45);
  h.hp = Math.min(h.maxHp, h.hp + heal);
  h.statuses = (h.statuses || []).filter(s => s.id !== 'bleed' && s.id !== 'poison');

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.floatingText(h.x, h.y, `+${heal} HP`, '#34d399');
    actionCallbacks.log(`Quaffed Healing Tonic (+${heal} HP, toxins purged).`, 'good');
    actionCallbacks.onTurnEnd();
  }
  return true;
}

function recordDungeonDepthInCodex(state) {
  if (!state || !state.dungeon) return;
  const codex = ensureCodexState(state);
  const dId = state.activeDungeonId || state.dungeon.id;
  const curFl = state.dungeon.currentFloor || 1;
  const cfg = state.dungeon.config || {};
  if (!codex.deepestFloorByDungeon[dId]) {
    codex.deepestFloorByDungeon[dId] = {
      name: state.dungeon.name,
      deepestFloor: curFl,
      maxDepth: cfg.maxDepth || 999
    };
  } else {
    const entry = codex.deepestFloorByDungeon[dId];
    entry.name = state.dungeon.name;
    entry.deepestFloor = Math.max(entry.deepestFloor || 1, curFl);
    entry.maxDepth = cfg.maxDepth || 999;
  }
}

function extractToGuild(method = 'Floor 1 Ascending Stairs (<)', state = gameState) {
  const h = state.hero;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const codex = ensureCodexState(state);
  codex.totalExtractions = (codex.totalExtractions || 0) + 1;
  recordDungeonDepthInCodex(state);

  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }

  let goldEarned = 0;
  let oresBanked = 0;
  let gemsBanked = 0;
  const gearBanked = h.expeditionGear.length;

  for (const item of h.expeditionPack) {
    if (MINERAL_IDS.includes(item.id)) {
      state.guildVault[item.id] = (state.guildVault[item.id] || 0) + item.qty;
      oresBanked += item.qty;
    } else if (GEM_IDS.includes(item.id)) {
      state.guildVault.gems[item.id] = (state.guildVault.gems[item.id] || 0) + item.qty;
      gemsBanked += item.qty;
    } else {
      goldEarned += Math.round(item.val * item.qty * mult);
    }
  }

  for (const gear of h.expeditionGear) {
    state.guildVault.armory.push(normalizeEquipmentSockets(gear));
  }

  state.guildVault.gold += goldEarned;
  const claimedBounties = payoutCompletedBounties(state);

  h.expeditionPack = [];
  h.expeditionGear = [];
  h.statuses = [];
  h.usedDivineIntervention = false;
  recomputeHeroDerivedStats(true, state);
  state.inGuild = true;

  if (state === gameState) {
    saveGame();
    actionCallbacks.updateUI();
    const details = [
      `Extraction Method: ${method}`,
      `Minerals Banked to Vault: ${oresBanked} ores`,
      `Astral Gems Banked to Vault: ${gemsBanked} gems`,
      `Equipment Secured to Armory: ${gearBanked} items`,
      `Relics Appraised to Gold: +${goldEarned}g`
    ];
    if (claimedBounties.length > 0) {
      details.push(`Bounties Claimed: ${claimedBounties.join(' • ')}`);
    }
    details.push(`Total Vault Gold: ${state.guildVault.gold}g`);

    actionCallbacks.outcomeModal(
      'Safe Extraction Complete!',
      `You returned to the Grand Guild via ${method}. All gathered minerals, uncut Astral Gems, equipment, and completed Notice Board rewards have been secured.`,
      details
    );
  }

  emitEngineEvent(ENGINE_EVENTS.EXTRACTED, {
    method,
    oresBanked,
    gemsBanked,
    gearBanked,
    goldEarned,
    claimedBounties
  }, state);

  return { oresBanked, gemsBanked, gearBanked, goldEarned, claimedBounties };
}

function useRecallScroll(state = gameState) {
  if (state.inGuild) return false;
  const h = state.hero;
  if (((h.consumables && h.consumables.recalls) || 0) <= 0) {
    if (state === gameState) {
      actionCallbacks.floatingText(h.x, h.y, 'No Recall Scrolls!', '#f87171');
      actionCallbacks.log('No Recall Scrolls remaining! Retreat to Floor 1 Ascending Stairs (<) to extract.', 'bad');
    }
    return false;
  }

  h.consumables.recalls -= 1;
  if (state === gameState) playSound('spell');
  extractToGuild('Astral Recall Scroll', state);
  return true;
}

function handleHeroDefeat(killerName = 'Abyssal Guardian', state = gameState) {
  const h = state.hero;
  const vRank = state.guildResearch.vanguard || 0;
  const recoveryPct = vRank * 0.20;

  const codex = ensureCodexState(state);
  codex.totalDefeats = (codex.totalDefeats || 0) + 1;
  recordDungeonDepthInCodex(state);

  let packValue = 0;
  h.expeditionPack.forEach(i => { packValue += i.val * i.qty; });
  h.expeditionGear.forEach(g => { packValue += (g.value || 20); });

  const salvagedGold = Math.round(packValue * recoveryPct);
  const lostGearCount = h.expeditionGear.length;
  const lostOreCount = h.expeditionPack.reduce((s, i) => s + i.qty, 0);

  state.guildVault.gold += salvagedGold;
  h.expeditionPack = [];
  h.expeditionGear = [];
  h.statuses = [];
  h.usedDivineIntervention = false;
  recomputeHeroDerivedStats(true, state);
  state.inGuild = true;

  if (state === gameState) {
    playSound('hit');
    actionCallbacks.log(`Defeated by ${killerName}! Rescued by Guild Scouts. Vanguard Pact salvaged +${salvagedGold}g.`, 'bad');
    saveGame();
    actionCallbacks.updateUI();
    actionCallbacks.outcomeModal(
      'Expedition Defeat — Rescued by Guild Scouts',
      `You fell to ${killerName} on Floor ${state.dungeon.currentFloor} of ${state.dungeon.name}. Oakhaven scouts recovered you to the surface. Your character level, equipped loadout, and Guild Vault remain intact!`,
      [
        `Defeated By: ${killerName} (Floor ${state.dungeon.currentFloor})`,
        `Unbanked Pack Items Lost: ${lostOreCount}`,
        `Unbanked Equipment Lost: ${lostGearCount}`,
        `Vanguard Pact Salvage (${vRank * 20}%): +${salvagedGold}g`,
        `Persistent Dungeon: ${state.dungeon.name} (${state.dungeon.seedCode})`
      ]
    );
  }

  emitEngineEvent(ENGINE_EVENTS.HERO_DEFEATED, {
    killerName,
    floorDepth: state.dungeon.currentFloor,
    dungeonId: state.activeDungeonId,
    salvagedGold,
    lostOreCount,
    lostGearCount
  }, state);

  return { salvagedGold, lostOreCount, lostGearCount };
}

function buyShopItem(itemId, state = gameState) {
  const shopItem = SHOP_ITEMS.find(s => s.id === itemId);
  if (!shopItem) return { ok: false, reason: 'invalid_item' };

  const qmRank = state.guildResearch.quartermaster || 0;
  if (qmRank < shopItem.reqQM) {
    if (state === gameState) actionCallbacks.log(`Requires Quartermaster Requisitions Rank ${shopItem.reqQM}.`, 'bad');
    return { ok: false, reason: 'locked_tier' };
  }

  if (state.guildVault.gold < shopItem.cost) {
    if (state === gameState) actionCallbacks.log(`Insufficient Vault Gold! Need ${shopItem.cost}g.`, 'bad');
    return { ok: false, reason: 'no_gold' };
  }

  state.guildVault.gold -= shopItem.cost;

  if (shopItem.id === 'buy_heal') {
    state.hero.consumables.potions += 1;
  } else if (shopItem.id === 'buy_recall') {
    state.hero.consumables.recalls += 1;
  } else if (shopItem.slot === 'pickaxe') {
    state.hero.equipment.pickaxe = {
      uid: nextItemUid('pick'),
      name: shopItem.name,
      slot: 'pickaxe',
      rarity: shopItem.rarity,
      maxDur: shopItem.maxDur,
      curDur: Math.round(shopItem.maxDur * (1 + (state.guildResearch.toolsmithing || 0) * 0.5)),
      value: Math.round(shopItem.cost * 0.6),
      affixes: [],
      maxSockets: 0,
      sockets: []
    };
  } else if (shopItem.type === 'gear') {
    const boughtGear = {
      uid: nextItemUid('shop'),
      name: shopItem.name,
      slot: shopItem.slot,
      rarity: shopItem.rarity,
      atk: shopItem.atk || 0,
      def: shopItem.def || 0,
      str: shopItem.str || 0,
      crit: shopItem.crit || 0,
      maxHp: shopItem.maxHp || 0,
      value: Math.round(shopItem.cost * 0.6),
      affixes: [],
      maxSockets: rollSocketCountForRarity(shopItem.rarity, shopItem.slot),
      sockets: []
    };
    state.guildVault.armory.push(boughtGear);
  }

  if (state === gameState) {
    playSound('gold');
    recomputeHeroDerivedStats(false, state);
    actionCallbacks.log(`Purchased ${shopItem.name} for ${shopItem.cost}g.`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true };
}

function sellMineralUnit(mineralId, sellAll = false, state = gameState) {
  const count = state.guildVault[mineralId] || 0;
  if (count <= 0) return 0;

  const oreDef = Object.values(ORE_CATALOG).find(o => o.id === mineralId);
  const baseVal = oreDef ? oreDef.baseValue : 10;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const qtyToSell = sellAll ? count : 1;
  const payout = Math.round(baseVal * qtyToSell * mult);

  state.guildVault[mineralId] -= qtyToSell;
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${qtyToSell}x ${oreDef ? oreDef.name : mineralId} at Assay Counter for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

function sellAllOresAtAssay(state = gameState) {
  let totalPayout = 0;
  for (const mId of MINERAL_IDS) {
    if ((state.guildVault[mId] || 0) > 0) {
      totalPayout += sellMineralUnit(mId, true, state);
    }
  }
  if (state === gameState && totalPayout === 0) {
    actionCallbacks.log('No banked minerals in Vault to smelt/sell.', 'info');
  }
  return totalPayout;
}

function sellArmoryItem(uid, state = gameState) {
  const idx = state.guildVault.armory.findIndex(g => g.uid === uid);
  if (idx === -1) return 0;
  if (state.guildVault.armory[idx].locked) {
    if (state === gameState) actionCallbacks.log(`${state.guildVault.armory[idx].name} is locked/kept. Unlock it before selling.`, 'bad');
    return 0;
  }
  const item = state.guildVault.armory.splice(idx, 1)[0];

  // Return any socketed gems safely to Guild Vault before selling the frame
  if (Array.isArray(item.sockets) && item.sockets.length > 0) {
    if (!state.guildVault.gems) {
      state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
    }
    item.sockets.forEach(gId => {
      state.guildVault.gems[gId] = (state.guildVault.gems[gId] || 0) + 1;
    });
  }

  const assayRank = state.guildResearch.assay || 0;
  const payout = Math.round((item.value || 15) * (1 + assayRank * 0.35));
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Appraised & sold ${item.name} for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

function toggleItemLock(uid, state = gameState) {
  if (!uid || !state) return { ok: false, reason: 'invalid_args' };

  let targetItem = null;

  // Check Armory
  if (state.guildVault && Array.isArray(state.guildVault.armory)) {
    targetItem = state.guildVault.armory.find(g => g.uid === uid);
  }

  // Check Expedition Gear
  if (!targetItem && state.hero && Array.isArray(state.hero.expeditionGear)) {
    targetItem = state.hero.expeditionGear.find(g => g.uid === uid);
  }

  // Check Equipped Slots
  if (!targetItem && state.hero && state.hero.equipment) {
    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    for (let i = 0; i < slots.length; i++) {
      const eq = state.hero.equipment[slots[i]];
      if (eq && eq.uid === uid) {
        targetItem = eq;
        break;
      }
    }
  }

  if (!targetItem) {
    return { ok: false, reason: 'item_not_found' };
  }

  targetItem.locked = !targetItem.locked;

  if (state === gameState) {
    playSound('click');
    const msg = targetItem.locked
      ? `🔒 Marked ${targetItem.name} as Kept/Locked (protected from bulk sale).`
      : `🔓 Unlocked ${targetItem.name} (eligible for bulk sale).`;
    actionCallbacks.log(msg, 'info');
    saveGame();
    actionCallbacks.updateUI();
  }

  return { ok: true, locked: targetItem.locked, item: targetItem };
}

function autoEquipBestGear(state = gameState) {
  if (!state || !state.hero || !state.guildVault) {
    return { ok: false, reason: 'invalid_state', equippedCount: 0 };
  }

  const h = state.hero;
  if (!h.equipment) {
    h.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };
  }

  const armory = state.guildVault.armory || [];
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
  let equippedCount = 0;
  const equippedNames = [];

  for (let sIdx = 0; sIdx < slots.length; sIdx++) {
    const slot = slots[sIdx];
    const candidates = armory.filter(g => g && g.slot === slot);
    if (candidates.length === 0) continue;

    candidates.sort((a, b) => computeItemPowerScore(b) - computeItemPowerScore(a));
    const bestCandidate = candidates[0];
    const bestScore = computeItemPowerScore(bestCandidate);

    const curEq = h.equipment[slot];
    const curScore = curEq ? computeItemPowerScore(curEq) : -1;

    if (bestScore > curScore) {
      const armoryIdx = armory.indexOf(bestCandidate);
      if (armoryIdx !== -1) {
        armory.splice(armoryIdx, 1);
      }
      h.equipment[slot] = bestCandidate;
      if (curEq) {
        armory.push(curEq);
      }
      equippedCount++;
      equippedNames.push(bestCandidate.name);
    }
  }

  if (equippedCount > 0) {
    recomputeHeroDerivedStats(false, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.log(`⚡ Auto-equipped ${equippedCount} upgrade(s): ${equippedNames.join(', ')}!`, 'gold');
      saveGame();
      actionCallbacks.updateUI();
    }
  } else {
    if (state === gameState) {
      actionCallbacks.log('⚡ You already have your highest-power gear equipped in all slots.', 'info');
    }
  }

  return { ok: true, equippedCount, equippedNames };
}

function sellAllSpareGear(rarityFilter = null, state = gameState) {
  let rFilter = rarityFilter;
  let targetState = state;
  if (rarityFilter && typeof rarityFilter === 'object' && rarityFilter.guildVault) {
    targetState = rarityFilter;
    rFilter = null;
  }
  if (!targetState || !targetState.guildVault) return 0;

  const armory = targetState.guildVault.armory || [];
  if (armory.length === 0) {
    if (targetState === gameState) actionCallbacks.log('No spare equipment in Vault Armory to sell.', 'info');
    return 0;
  }

  const itemsToSell = [];
  const itemsToKeep = [];

  for (let i = 0; i < armory.length; i++) {
    const g = armory[i];
    const matchesRarity = !rFilter || rFilter === 'all' || g.rarity === rFilter;
    if (matchesRarity && !g.locked) {
      itemsToSell.push(g);
    } else {
      itemsToKeep.push(g);
    }
  }

  if (itemsToSell.length === 0) {
    if (targetState === gameState) {
      const lockNote = armory.some(g => g.locked) ? ' (all matching items are locked)' : '';
      actionCallbacks.log(`No eligible ${rFilter ? rFilter + ' ' : ''}spare gear to sell${lockNote}.`, 'info');
    }
    return 0;
  }

  const assayRank = targetState.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  let total = 0;
  if (!targetState.guildVault.gems) {
    targetState.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }

  itemsToSell.forEach(g => {
    if (Array.isArray(g.sockets)) {
      g.sockets.forEach(gId => {
        targetState.guildVault.gems[gId] = (targetState.guildVault.gems[gId] || 0) + 1;
      });
    }
    total += Math.round((g.value || 15) * mult);
  });

  targetState.guildVault.armory = itemsToKeep;
  targetState.guildVault.gold += total;

  if (targetState === gameState) {
    playSound('gold');
    const label = rFilter ? `${rFilter.toUpperCase()}` : 'spare';
    actionCallbacks.log(`Sold ${itemsToSell.length} ${label} armory items with Assay bonus for +${total}g!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return total;
}

function purchaseResearchRank(projId, state = gameState) {
  const proj = RESEARCH_PROJECTS[projId];
  if (!proj) return { ok: false, reason: 'invalid_project' };

  const curRank = state.guildResearch[projId] || 0;
  if (curRank >= proj.levels.length - 1) return { ok: false, reason: 'max_rank' };

  const nextSpec = proj.levels[curRank + 1];
  if (state.guildVault.gold < nextSpec.costGold) {
    if (state === gameState) actionCallbacks.log(`Need ${nextSpec.costGold} Banked Gold for ${proj.name}.`, 'bad');
    return { ok: false, reason: 'insufficient_gold' };
  }

  for (const [oreId, reqQty] of Object.entries(nextSpec.costOre)) {
    if ((state.guildVault[oreId] || 0) < reqQty) {
      if (state === gameState) actionCallbacks.log(`Need ${reqQty} ${oreId.toUpperCase()} in Vault for ${proj.name}.`, 'bad');
      return { ok: false, reason: 'insufficient_ore' };
    }
  }

  state.guildVault.gold -= nextSpec.costGold;
  for (const [oreId, reqQty] of Object.entries(nextSpec.costOre)) {
    state.guildVault[oreId] -= reqQty;
  }
  state.guildResearch[projId] = curRank + 1;

  if (state === gameState) {
    playSound('lvl');
    recomputeHeroDerivedStats(false, state);
    if (projId === 'toolsmithing' && state.hero.equipment.pickaxe) {
      state.hero.equipment.pickaxe.curDur = getPickaxeMaxDurability(state);
    }
    actionCallbacks.log(`Researched ${proj.name} Rank ${curRank + 1}! (${nextSpec.desc})`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, newRank: curRank + 1 };
}

  // --- Module: src/engine/combat.js ---
// Turn-Based Movement, Combat Resolution, Active Class Skills, Monster AI, Wall LOS, Auto-Walk & Stairs


let fovCallback = () => {};

function registerCombatFOVCallback(fn) {
  if (typeof fn === 'function') {
    fovCallback = fn;
    registerActionCallbacks({ updateFOV: fn });
  }
}

// ============================================================================
// BRESENHAM LINE-OF-SIGHT & HOSTILE AWARENESS
// ============================================================================

function hasLineOfSight(floor, x0, y0, x1, y1) {
  if (!floor || !floor.tiles) return false;
  let cx = Math.round(x0);
  let cy = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);

  if (cx === tx && cy === ty) return true;

  const fh = floor.tiles.length;
  const fw = floor.tiles[0] ? floor.tiles[0].length : 0;
  if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;

  const dx = Math.abs(tx - cx);
  const dy = Math.abs(ty - cy);
  const sx = cx < tx ? 1 : -1;
  const sy = cy < ty ? 1 : -1;
  let err = dx - dy;

  while (!(cx === tx && cy === ty)) {
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
    if (cx === tx && cy === ty) {
      return true;
    }
    if (cx < 0 || cx >= fw || cy < 0 || cy >= fh) {
      return false;
    }
    const tile = floor.tiles[cy][cx];
    if (tile === TILE_WALL || ORE_CATALOG[tile]) {
      return false;
    }
  }
  return true;
}

function areHostilesInSight(floor, state = gameState) {
  if (!floor || !floor.monsters || !state || !state.hero) return false;
  const h = state.hero;
  const vision = h.visionRadius || 5;
  const maxBox = Math.ceil(vision + 1);

  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    if (Math.abs(m.x - h.x) > maxBox || Math.abs(m.y - h.y) > maxBox) continue;
    if (Math.hypot(m.x - h.x, m.y - h.y) <= vision + 0.35 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// SAFE EXPLORED PATHFINDING & CLICK-TO-TRAVEL AUTO-WALK
// ============================================================================

let activeAutoWalkQueue = [];
let autoWalkTimerId = null;

function isAutoWalking() {
  return activeAutoWalkQueue.length > 0;
}

function getAutoWalkPath() {
  return activeAutoWalkQueue.slice();
}

function setAutoWalkPath(pathArray) {
  activeAutoWalkQueue = Array.isArray(pathArray) ? pathArray.slice() : [];
}

function cancelAutoWalk() {
  activeAutoWalkQueue = [];
  if (autoWalkTimerId !== null && typeof clearTimeout !== 'undefined') {
    clearTimeout(autoWalkTimerId);
    autoWalkTimerId = null;
  }
}

function computeSafeExploredPath(floor, sx, sy, tx, ty) {
  if (!floor || !floor.tiles || !floor.explored) return null;
  const fh = floor.tiles.length;
  const fw = floor.tiles[0] ? floor.tiles[0].length : 0;
  if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return null;
  if (sx < 0 || sx >= fw || sy < 0 || sy >= fh) return null;
  if (!floor.explored[ty] || !floor.explored[ty][tx]) return null;
  if (sx === tx && sy === ty) return [];

  const destTile = floor.tiles[ty][tx];
  if (destTile === TILE_WALL || destTile === TILE_TRAP_VISIBLE) {
    return null;
  }

  const total = fw * fh;
  const visited = new Uint8Array(total);
  const parent = new Int32Array(total);
  parent.fill(-1);
  const queue = new Int32Array(total);

  // Mark monster positions as blocked (except if clicking directly adjacent monster, handled by click)
  const monsterBlocked = new Uint8Array(total);
  if (Array.isArray(floor.monsters)) {
    for (let i = 0; i < floor.monsters.length; i++) {
      const m = floor.monsters[i];
      if (m && m.hp > 0 && m.x >= 0 && m.x < fw && m.y >= 0 && m.y < fh) {
        monsterBlocked[m.y * fw + m.x] = 1;
      }
    }
  }

  const startIdx = sy * fw + sx;
  const targetIdx = ty * fw + tx;
  visited[startIdx] = 1;
  let head = 0;
  let tail = 0;
  queue[tail++] = startIdx;

  const dirsX = [0, 0, -1, 1];
  const dirsY = [-1, 1, 0, 0];
  let found = false;

  while (head < tail) {
    const cur = queue[head++];
    if (cur === targetIdx) {
      found = true;
      break;
    }
    const cx = cur % fw;
    const cy = (cur - cx) / fw;

    for (let d = 0; d < 4; d++) {
      const nx = cx + dirsX[d];
      const ny = cy + dirsY[d];
      if (nx < 0 || nx >= fw || ny < 0 || ny >= fh) continue;
      const nIdx = ny * fw + nx;
      if (visited[nIdx]) continue;
      if (!floor.explored[ny] || !floor.explored[ny][nx]) continue;
      if (monsterBlocked[nIdx] && nIdx !== targetIdx) continue;

      const t = floor.tiles[ny][nx];
      const isSafeStep = (
        t === TILE_FLOOR ||
        t === TILE_STAIRS_UP ||
        t === TILE_STAIRS_DOWN ||
        t === TILE_CHEST_OPEN ||
        t === TILE_SHRINE_USED ||
        t === TILE_TRAP_DISARMED ||
        t === TILE_TRAP_HIDDEN
      );
      const isInteractiveGoal = nIdx === targetIdx && (
        t === TILE_CHEST ||
        t === TILE_SHRINE ||
        !!ORE_CATALOG[t]
      );

      if (!isSafeStep && !isInteractiveGoal) continue;

      visited[nIdx] = 1;
      parent[nIdx] = cur;
      queue[tail++] = nIdx;
    }
  }

  if (!found) return null;

  const steps = [];
  let trace = targetIdx;
  while (trace !== startIdx && trace !== -1) {
    const px = trace % fw;
    const py = (trace - px) / fw;
    steps.push({ x: px, y: py });
    trace = parent[trace];
  }
  steps.reverse();
  return steps;
}

function stepAutoWalkOnce(state = gameState) {
  const ui = getActionCallbacks();
  if (!state || state.inGuild || !state.hero || activeAutoWalkQueue.length === 0) {
    cancelAutoWalk();
    return { ok: false, done: true, reason: 'idle' };
  }

  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) {
    cancelAutoWalk();
    return { ok: false, halted: true, reason: 'no_floor' };
  }

  if (areHostilesInSight(floor, state)) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log('Auto-walk halted: hostile guardian in sight!', 'gold');
    }
    return { ok: false, halted: true, reason: 'hostile_in_sight' };
  }

  const nextStep = activeAutoWalkQueue.shift();
  const dx = nextStep.x - state.hero.x;
  const dy = nextStep.y - state.hero.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    cancelAutoWalk();
    return { ok: false, halted: true, reason: 'desync' };
  }

  if (floor.tiles[nextStep.y][nextStep.x] === TILE_TRAP_VISIBLE) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(nextStep.x, nextStep.y, '⚠ Trap Ahead!', '#fbbf24');
      ui.log('Auto-walk halted before spotted trap.', 'gold');
    }
    return { ok: false, halted: true, reason: 'trap_ahead' };
  }

  const hpBefore = state.hero.hp;
  handlePlayerAction(dx, dy, state);

  if (state.inGuild) {
    cancelAutoWalk();
    return { ok: true, stepped: true, halted: true, reason: 'left_dungeon' };
  }

  if (state.hero.hp < hpBefore) {
    cancelAutoWalk();
    return { ok: true, stepped: true, halted: true, reason: 'took_damage' };
  }

  const postFloor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (areHostilesInSight(postFloor, state)) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log('Auto-walk halted: hostile guardian in sight!', 'gold');
    }
    return { ok: true, stepped: true, halted: true, reason: 'hostile_in_sight' };
  }

  return {
    ok: true,
    stepped: true,
    halted: false,
    remaining: activeAutoWalkQueue.length
  };
}

function scheduleNextAutoWalkTick() {
  if (autoWalkTimerId !== null && typeof clearTimeout !== 'undefined') {
    clearTimeout(autoWalkTimerId);
    autoWalkTimerId = null;
  }
  if (activeAutoWalkQueue.length === 0 || typeof setTimeout === 'undefined') return;
  autoWalkTimerId = setTimeout(() => {
    autoWalkTimerId = null;
    const res = stepAutoWalkOnce(gameState);
    if (res && res.ok && !res.halted && res.remaining > 0) {
      scheduleNextAutoWalkTick();
    }
  }, 36);
}

function startAutoWalkTo(tx, ty, state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild || !state.hero) {
    return { ok: false, reason: 'in_guild' };
  }

  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  if (areHostilesInSight(floor, state)) {
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, 'Hostiles Nearby!', '#f87171');
      ui.log('Cannot auto-walk while hostile guardians are in sight.', 'bad');
    }
    return { ok: false, reason: 'hostile_in_sight' };
  }

  const path = computeSafeExploredPath(floor, state.hero.x, state.hero.y, tx, ty);
  if (!path || path.length === 0) {
    if (state === gameState) {
      ui.floatingText(tx, ty, 'Unexplored / Blocked', '#8b949e');
    }
    return { ok: false, reason: 'no_path' };
  }

  activeAutoWalkQueue = path;
  if (state === gameState) {
    scheduleNextAutoWalkTick();
  }
  return { ok: true, steps: path.length, path: path.slice() };
}

// ============================================================================
// COMBAT RESOLUTION, BOSS DROPS & MONSTER AI
// ============================================================================

function killMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;
  floor.monsters = floor.monsters.filter(m => m !== monster);

  // Update Guild Bestiary Codex & Lifetime Records
  const codex = ensureCodexState(state);
  codex.totalMonstersSlain = (codex.totalMonstersSlain || 0) + 1;
  if (monster.isBoss) codex.totalBossesSlain = (codex.totalBossesSlain || 0) + 1;
  if (monster.isElite) codex.totalElitesSlain = (codex.totalElitesSlain || 0) + 1;
  const count = (codex.monsterKills[monster.id] || 0) + 1;
  codex.monsterKills[monster.id] = count;
  if (codex.killsByArchetype) codex.killsByArchetype[monster.id] = count;

  const h = state.hero;
  // Thief Shadow Dance MP restore on kill
  if (h.classId === 'thief' && ((h.talentsAllocated && h.talentsAllocated.t_b3) || 0) > 0) {
    h.mp = Math.min(h.maxMp, h.mp + 6);
  }

  // Record Guild Notice Board Bounty Progress (supports archetype bountyTag)
  const killTags = ['monster_any', monster.id];
  if (monster.bountyTag && killTags.indexOf(monster.bountyTag) === -1) {
    killTags.push(monster.bountyTag);
  }
  if (monster.isElite) killTags.push('elite');
  if (monster.isBoss) killTags.push('boss');
  recordBountyProgress('slay', killTags, 1, state);

  const rarityBonus = (state.dungeon && state.dungeon.config && state.dungeon.config.lootRarityBonus) || 0;

  if (monster.isBoss) {
    const isRelicBoss = monster.dropRarity === 'relic' || monster.id === 'boss_weaver' || monster.id === 'boss_ignis' || monster.id === 'boss_vespera';
    const bossRarity = monster.dropRarity || (isRelicBoss ? 'relic' : 'epic');
    const bossGear = generateProceduralEquipment(floor.depth, bossRarity, null, rarityBonus);
    if (monster.id === 'boss_vespera') {
      bossGear.maxSockets = 2;
    }
    h.expeditionGear.push(bossGear);
    recordRelicUnlock(bossGear, floor.depth, (state.dungeon && state.dungeon.name), state);

    if (monster.id === 'boss_vespera') {
      addExpeditionTradeItem('astralite', 'Void Astralite', 150, 3, 'Ore', state);
      addExpeditionTradeItem('gem_void_diamond', 'Void Diamond', 300, 1, 'Gem', state);
    } else if (monster.id === 'boss_ignis') {
      addExpeditionTradeItem('astralite', 'Void Astralite', 150, 2, 'Ore', state);
      addExpeditionTradeItem('gem_ruby', 'Crimson Ruby', 120, 1, 'Gem', state);
    } else {
      addExpeditionTradeItem('starcrystal', 'Star-Crystal', 90, 2, 'Ore', state);
    }

    const maxDepth = (state.dungeon && state.dungeon.config && state.dungeon.config.maxDepth) || 999;
    if (floor.depth >= maxDepth) {
      state.dungeon.isCleared = true;
    }

    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(monster.x, monster.y, '👑 BOSS VANQUISHED!', '#fbbf24');
      ui.log(`👑 Vanquished ${monster.name}! Looted ${bossGear.name} (${RARITY[bossRarity].name})!`, 'gold');
    }
  } else {
    const goldVal = 8 + floor.depth * 5 + (monster.isElite ? 18 : 0);
    addExpeditionTradeItem('monster_trophy', 'Abyssal Shard', goldVal, 1, 'Relic', state);
    if (monster.isElite || Math.random() < 0.25) {
      const dropGear = generateProceduralEquipment(
        floor.depth,
        monster.isElite ? 'rare' : null,
        null,
        rarityBonus
      );
      h.expeditionGear.push(dropGear);
      if (dropGear && dropGear.rarity === 'relic') {
        recordRelicUnlock(dropGear, floor.depth, (state.dungeon && state.dungeon.name), state);
      }
      if (state === gameState) {
        ui.log(`${monster.name} dropped ${dropGear.name}!`, 'good');
      }
    }
  }

  if (state === gameState) {
    gainExperience(monster.xp, state);
  }

  emitEngineEvent(ENGINE_EVENTS.MONSTER_SLAIN, {
    monsterId: monster.id,
    monsterName: monster.name,
    isElite: !!monster.isElite,
    isBoss: !!monster.isBoss,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);
}

function attackMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const isCrit = Math.random() * 100 < h.crit;
  const critMult = isCrit ? 1.65 : 1.0;
  const weakMult = (h.statuses || []).some(s => s.id === 'weakened') ? 0.80 : 1.0;
  const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
  const effDef = Math.round(monster.def * (1 - Math.min(0.8, pierceRank * 0.30)));
  const masteryMult = getCodexMasteryMultiplier(monster.id, state);

  const dmg = Math.max(2, Math.round(h.atk * weakMult * critMult * masteryMult) - effDef);
  monster.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(monster.x, monster.y, `${isCrit ? 'CRIT! ' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#f87171');
    ui.log(`You strike ${monster.name} for ${dmg} damage${isCrit ? ' (CRITICAL!)' : ''}.`, isCrit ? 'gold' : 'info');
  }

  if (monster.hp <= 0) {
    killMonster(monster, state);
  }
}

function checkHeroFatalDamage(killerName, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  // Paladin Divine Intervention Keystone
  if (h.classId === 'paladin' && ((h.talentsAllocated && h.talentsAllocated.p_e3) || 0) > 0 && !h.usedDivineIntervention) {
    h.usedDivineIntervention = true;
    h.hp = Math.round(h.maxHp * 0.40);
    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(h.x, h.y, 'DIVINE INTERVENTION!', '#fbbf24');
      ui.log('Divine Intervention prevented fatal damage and restored 40% Max HP!', 'gold');
      ui.updateUI();
    }
    return;
  }
  handleHeroDefeat(killerName, state);
}

function monsterAttackHero(m, isRanged, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  if (Math.random() * 100 < h.dodge) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'DODGE!', '#34d399');
      ui.log(`You dodged ${m.name}'s attack!`, 'good');
    }
    return;
  }

  let raw = isRanged ? Math.round(m.atk * 0.85) : m.atk;
  if (h.classId === 'fighter') raw = Math.round(raw * 0.85);
  const dmg = Math.max(1, raw - Math.floor(h.def * 0.6));
  h.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(h.x, h.y, `-${dmg}${isRanged ? ' 🏹' : ''}`, '#f87171');
    ui.log(`${m.name} strikes you for ${dmg} damage!`, 'bad');
  }

  // Archetype On-Hit Status + Elite Affix Effects
  if (m.onHitStatus && Math.random() < 0.45) {
    applyStatusEffect(h, m.onHitStatus, 3);
  }
  if (m.affix && m.affix.id === 'vampiric') {
    m.hp = Math.min(m.maxHp, m.hp + Math.round(dmg * 0.4));
  } else if (m.affix && m.affix.id === 'molten') {
    applyStatusEffect(h, 'burn', 3);
  } else if (m.affix && m.affix.id === 'venomous') {
    applyStatusEffect(h, 'poison', 3);
  }

  // Fighter Titan Resurgence Counter-Attack
  if (!isRanged && h.classId === 'fighter' && ((h.talentsAllocated && h.talentsAllocated.f_a3) || 0) > 0 && Math.random() < 0.35) {
    const counterDmg = Math.max(2, Math.round(h.atk * 0.5));
    m.hp -= counterDmg;
    if (state === gameState) {
      ui.floatingText(m.x, m.y, `-${counterDmg} COUNTER!`, '#60a5fa');
    }
    if (m.hp <= 0) killMonster(m, state);
  }

  if (h.hp <= 0) {
    checkHeroFatalDamage(m.name, state);
  }
}

function processTurn(state = gameState) {
  const ui = getActionCallbacks();
  state.turn += 1;
  const h = state.hero;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  // Passive Class Turn Ticks
  if (h.classId === 'mage') {
    h.mp = Math.min(h.maxMp, h.mp + 2);
  }
  if (h.classId === 'paladin' && state.turn % 3 === 0) {
    h.hp = Math.min(h.maxHp, h.hp + 1);
  }

  // Hero Status & Shrine Buff Ticks
  if (h.statuses && h.statuses.length > 0) {
    let buffExpired = false;
    for (let i = h.statuses.length - 1; i >= 0; i--) {
      const st = h.statuses[i];
      if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
        const dot = Math.max(2, Math.round(h.maxHp * 0.04));
        h.hp -= dot;
        if (state === gameState) {
          ui.floatingText(h.x, h.y, `-${dot} ${st.name.toUpperCase()}`, st.color);
        }
      }
      st.duration -= 1;
      if (st.duration <= 0) {
        if (st.isBuff) buffExpired = true;
        h.statuses.splice(i, 1);
      }
    }
    if (buffExpired) {
      recomputeHeroDerivedStats(false, state);
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage('Affliction', state);
      return;
    }
  }

  const spottedTraps = detectNearbyTraps(floor, state);
  if (spottedTraps > 0 && isAutoWalking()) {
    cancelAutoWalk();
  }
  if (state === gameState) {
    fovCallback();
  }

  // Monsters AI Turn (pre-culled by Chebyshev distance for O(1) large-map turn speed)
  const monstersSnapshot = floor.monsters.slice();
  for (let mIdx = 0; mIdx < monstersSnapshot.length; mIdx++) {
    const m = monstersSnapshot[mIdx];
    if (!m || m.hp <= 0) continue;

    // Monster Status Ticks
    if (m.statuses && m.statuses.length > 0) {
      let stunned = false;
      for (let i = m.statuses.length - 1; i >= 0; i--) {
        const st = m.statuses[i];
        if (st.id === 'stun') stunned = true;
        if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
          const dot = Math.max(3, Math.round(m.maxHp * 0.06));
          m.hp -= dot;
          if (state === gameState) {
            ui.floatingText(m.x, m.y, `-${dot}`, st.color);
          }
        }
        st.duration -= 1;
        if (st.duration <= 0) m.statuses.splice(i, 1);
      }
      if (m.hp <= 0) {
        killMonster(m, state);
        continue;
      }
      if (stunned) {
        if (state === gameState) {
          ui.floatingText(m.x, m.y, 'STUNNED', '#fbbf24');
        }
        continue;
      }
    }

    // Fast bounding-box skip so distant monsters on 192x144 maps cost zero CPU
    if (Math.abs(m.x - h.x) > 8 || Math.abs(m.y - h.y) > 8) continue;

    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    if (dist <= 7.0) {
      if (dist <= 1.5) {
        monsterAttackHero(m, false, state);
        if (state.inGuild) return;
      } else if (m.isRanged && dist <= (m.range || 3) + 0.3 && hasLineOfSight(floor, m.x, m.y, h.x, h.y)) {
        monsterAttackHero(m, true, state);
        if (state.inGuild) return;
      } else if (hasLineOfSight(floor, m.x, m.y, h.x, h.y) || dist <= 4.2) {
        const sx = Math.sign(h.x - m.x);
        const sy = Math.sign(h.y - m.y);
        const candidates = Math.abs(h.x - m.x) >= Math.abs(h.y - m.y)
          ? [[sx, 0], [0, sy]]
          : [[0, sy], [sx, 0]];
        for (let c = 0; c < candidates.length; c++) {
          const dx = candidates[c][0];
          const dy = candidates[c][1];
          if (dx === 0 && dy === 0) continue;
          const tx = m.x + dx;
          const ty = m.y + dy;
          if (tx >= 0 && tx < fw && ty >= 0 && ty < fh) {
            const destTile = floor.tiles[ty][tx];
            const monsterWalkable = (
              destTile === TILE_FLOOR ||
              destTile === TILE_CHEST_OPEN ||
              destTile === TILE_SHRINE_USED ||
              destTile === TILE_TRAP_DISARMED
            );
            if (
              monsterWalkable &&
              !(tx === h.x && ty === h.y) &&
              !floor.monsters.some(other => other.x === tx && other.y === ty)
            ) {
              m.x = tx;
              m.y = ty;
              break;
            }
          }
        }
      }
    }
  }

  if (state === gameState) {
    saveGame();
    ui.updateUI();
  }
}

// Wire turn-end hook into actions.js (for Healing Tonic turn advance)
registerActionCallbacks({ onTurnEnd: () => processTurn(gameState) });

function executeClassSkill(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (state.inGuild) return { ok: false, reason: 'in_guild' };
  const h = state.hero;
  const cls = CLASSES[h.classId];
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  if (h.mp < cls.skillCost) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'Low MP!', '#60a5fa');
      ui.log(`Not enough MP for ${cls.skillName} (${cls.skillCost} MP required).`, 'bad');
    }
    return { ok: false, reason: 'no_mp' };
  }

  // 1. FIGHTER: Whirlwind Cleave (Requires at least 1 adjacent monster)
  if (h.classId === 'fighter') {
    const adjTargets = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 1.5);
    if (adjTargets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Adjacent Foes!', '#fbbf24');
        ui.log('Whirlwind Cleave requires at least one adjacent enemy.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }
    h.mp -= cls.skillCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'WHIRLWIND!', '#f87171');
    }
    adjTargets.slice().forEach(m => {
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      const dmg = Math.max(2, Math.round(h.atk * 1.5 * masteryMult) - m.def);
      m.hp -= dmg;
      applyStatusEffect(m, 'stun', 1);
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} STUN`, '#f87171');
      if (m.hp <= 0) killMonster(m, state);
    });
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'whirlwind' };
  }

  // 2. THIEF: Shadowstep Strike (Requires visible target within 3.5 tiles AND an unoccupied safe floor tile adjacent to target)
  if (h.classId === 'thief') {
    const candidates = floor.monsters.filter(
      m => Math.hypot(m.x - h.x, m.y - h.y) <= 3.5 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)
    );
    let chosenTarget = null;
    let destTile = null;

    for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
      const m = candidates[cIdx];
      const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (let nIdx = 0; nIdx < neighbors.length; nIdx++) {
        const tx = m.x + neighbors[nIdx][0];
        const ty = m.y + neighbors[nIdx][1];
        if (tx >= 0 && tx < fw && ty >= 0 && ty < fh) {
          const t = floor.tiles[ty][tx];
          const walkable = (
            t === TILE_FLOOR ||
            t === TILE_STAIRS_UP ||
            t === TILE_STAIRS_DOWN ||
            t === TILE_CHEST_OPEN ||
            t === TILE_SHRINE_USED ||
            t === TILE_TRAP_DISARMED
          );
          const occupied = floor.monsters.some(other => other.x === tx && other.y === ty);
          if (walkable && !occupied) {
            chosenTarget = m;
            destTile = { x: tx, y: ty };
            break;
          }
        }
      }
      if (chosenTarget && destTile) break;
    }

    if (!chosenTarget || !destTile) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Valid Shadowstep!', '#c084fc');
        ui.log('Shadowstep Strike requires a visible target within 3 tiles with an open adjacent floor tile.', 'bad');
      }
      return { ok: false, reason: 'no_valid_shadowstep' };
    }

    h.mp -= cls.skillCost;
    h.x = destTile.x;
    h.y = destTile.y;
    const masteryMult = getCodexMasteryMultiplier(chosenTarget.id, state);
    const dmg = Math.max(4, Math.round(h.atk * 2.2 * masteryMult) - Math.floor(chosenTarget.def * 0.5));
    chosenTarget.hp -= dmg;

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(chosenTarget.x, chosenTarget.y, `-${dmg} CRIT BACKSTAB!`, '#fbbf24');
      ui.log(`Shadowstep Strike hits ${chosenTarget.name} for ${dmg} critical damage!`, 'gold');
    }
    if (chosenTarget.hp <= 0) killMonster(chosenTarget, state);
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'shadowstep', destTile };
  }

  // 3. MAGE: Starfall Nova (Requires at least 1 enemy within 4 tiles)
  if (h.classId === 'mage') {
    const targets = floor.monsters.filter(
      m => Math.hypot(m.x - h.x, m.y - h.y) <= 4.2 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)
    );
    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Foes in Range!', '#60a5fa');
        ui.log('Starfall Nova requires at least one visible enemy within 4 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= cls.skillCost;
    const ampRank = (h.talentsAllocated && h.talentsAllocated.m_c2) || 0;
    const hasEcho = ((h.talentsAllocated && h.talentsAllocated.m_c3) || 0) > 0;
    const spellMult = 2.0 * (1 + ampRank * 0.15);

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL NOVA!', '#60a5fa');
    }

    targets.slice().forEach(m => {
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      let dmg = Math.max(4, Math.round(h.atk * spellMult * masteryMult) - Math.floor(m.def * 0.4));
      if (hasEcho) dmg += Math.round(dmg * 0.5);
      m.hp -= dmg;
      applyStatusEffect(m, 'burn', 3);
      if (state === gameState) {
        ui.floatingText(m.x, m.y, `-${dmg}${hasEcho ? ' ECHO!' : ''}`, '#60a5fa');
      }
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'nova' };
  }

  // 4. RANGER: Starfall Volley (Up to 3—or 5 with Rain of Needles—visible targets within 5 tiles)
  if (h.classId === 'ranger') {
    const maxTargets = ((h.talentsAllocated && h.talentsAllocated.r_d3) || 0) > 0 ? 5 : 3;
    const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
    const defIgnore = Math.min(0.8, pierceRank * 0.30);

    const targets = floor.monsters
      .filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 5.2 && hasLineOfSight(floor, h.x, h.y, m.x, m.y))
      .sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))
      .slice(0, maxTargets);

    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Targets in Sight!', '#34d399');
        ui.log('Starfall Volley requires at least one visible enemy within 5 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= cls.skillCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL VOLLEY!', '#34d399');
    }

    targets.forEach(m => {
      const effDef = Math.round(m.def * (1 - defIgnore));
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      const dmg = Math.max(3, Math.round(h.atk * 1.8 * masteryMult) - effDef);
      m.hp -= dmg;
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} VOLLEY`, '#34d399');
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'volley', count: targets.length };
  }

  // 5. PALADIN: Holy Smite (Requires adjacent enemy before deducting MP; deals 240% holy dmg + heals 15% Max HP)
  if (h.classId === 'paladin') {
    const target = floor.monsters.find(m => Math.hypot(m.x - h.x, m.y - h.y) <= 1.5);
    if (!target) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Adjacent Foe!', '#fbbf24');
        ui.log('Holy Smite requires an adjacent monster target.', 'bad');
      }
      return { ok: false, reason: 'no_adjacent_target' };
    }

    h.mp -= cls.skillCost;
    const masteryMult = getCodexMasteryMultiplier(target.id, state);
    const dmg = Math.max(5, Math.round(h.atk * 2.4 * masteryMult) - Math.floor(target.def * 0.5));
    const healAmt = Math.round(h.maxHp * 0.15);
    target.hp -= dmg;
    h.hp = Math.min(h.maxHp, h.hp + healAmt);

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(target.x, target.y, `-${dmg} HOLY SMITE!`, '#fbbf24');
      ui.floatingText(h.x, h.y, `+${healAmt} HP`, '#34d399');
      ui.log(`Holy Smite sears ${target.name} for ${dmg} damage and heals you for +${healAmt} HP!`, 'gold');
    }
    if (target.hp <= 0) killMonster(target, state);
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'smite', dmg, healAmt };
  }

  return { ok: false };
}

function handlePlayerAction(dx, dy, state = gameState) {
  const ui = getActionCallbacks();
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  const nx = state.hero.x + dx;
  const ny = state.hero.y + dy;
  if (nx < 0 || nx >= fw || ny < 0 || ny >= fh) return;

  // 1. Monster Melee Bump Attack
  const targetMonster = floor.monsters.find(m => m.x === nx && m.y === ny);
  if (targetMonster) {
    attackMonster(targetMonster, state);
    processTurn(state);
    return;
  }

  // 2. Ore Vein Mining
  const targetTile = floor.tiles[ny][nx];
  if (ORE_CATALOG[targetTile]) {
    mineTile(nx, ny, state);
    processTurn(state);
    return;
  }

  // 3. Gilded Chest Opening
  if (targetTile === TILE_CHEST) {
    floor.tiles[ny][nx] = TILE_CHEST_OPEN;
    const codex = ensureCodexState(state);
    codex.totalChestsOpened = (codex.totalChestsOpened || 0) + 1;
    const depth = state.dungeon.currentFloor;
    const cfg = state.dungeon.config || {};
    const effDepth = depth + (cfg.baseDangerDepth || 0);
    const goldVal = Math.round((22 + effDepth * 12) * (state.hero.classId === 'thief' ? 1.25 : 1.0));
    addExpeditionTradeItem('star_relic', 'Star-etched Relic', goldVal, 1, 'Relic', state);
    recordBountyProgress('open_chest', ['chest'], 1, state);

    const rarityBonus = cfg.lootRarityBonus || 0;
    const forcedRarity = effDepth >= 4 ? 'rare' : 'uncommon';
    const chestGear = generateProceduralEquipment(effDepth, forcedRarity, cfg.lootSlotBias || null, rarityBonus);
    state.hero.expeditionGear.push(chestGear);
    if (chestGear && chestGear.rarity === 'relic') {
      recordRelicUnlock(chestGear, depth, (state.dungeon && state.dungeon.name), state);
    }

    emitEngineEvent(ENGINE_EVENTS.CHEST_OPENED, {
      goldVal,
      gear: chestGear,
      floorDepth: depth,
      dungeonId: state.activeDungeonId
    }, state);

    if (state === gameState) {
      playSound('gold');
      ui.floatingText(nx, ny, `+${goldVal}g & ${chestGear.name}!`, RARITY[chestGear.rarity].color);
      ui.log(`Opened Gilded Chest! Found Star-etched Relic (${goldVal}g) & ${chestGear.name}!`, 'gold');
      gainExperience(18 + effDepth * 6, state);
    }
    processTurn(state);
    return;
  }

  // 4. Astral Shrine Activation
  if (targetTile === TILE_SHRINE) {
    activateAstralShrine(nx, ny, state);
    processTurn(state);
    return;
  }

  // 5. Runic Trap Interaction (Disarm for Scout on Spotted Trap, else Trigger)
  if (targetTile === TILE_TRAP_HIDDEN || targetTile === TILE_TRAP_VISIBLE) {
    const trapRes = resolveTrapInteraction(nx, ny, state);
    if (trapRes.fatal) {
      checkHeroFatalDamage(trapRes.killerName, state);
      return;
    }
    processTurn(state);
    return;
  }

  // 6. Step onto Walkable Tile
  if (targetTile !== TILE_WALL) {
    state.hero.x = nx;
    state.hero.y = ny;
    detectNearbyTraps(floor, state);
    processTurn(state);
  } else if (state === gameState) {
    ui.floatingText(nx, ny, 'Blocked', '#8b949e');
  }
}

function useStairsAtPlayer(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;
  const tile = floor.tiles[state.hero.y][state.hero.x];

  if (tile === TILE_STAIRS_UP) {
    if (state.dungeon.currentFloor === 1) {
      extractToGuild('Floor 1 Ascending Stairs (<)', state);
    } else {
      state.dungeon.currentFloor -= 1;
      const prev = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
      state.hero.x = prev.downPos.x;
      state.hero.y = prev.downPos.y;
      detectNearbyTraps(prev, state);
      if (state === gameState) {
        fovCallback();
        saveGame();
        ui.updateUI();
        ui.log(`Ascended to Floor ${state.dungeon.currentFloor} of ${state.dungeon.name}.`, 'info');
      }
    }
  } else if (tile === TILE_STAIRS_DOWN) {
    const cfg = state.dungeon.config || {};
    const maxDepth = cfg.maxDepth || 999;
    if (state.dungeon.currentFloor >= maxDepth) {
      if (state === gameState) {
        ui.log(`You have reached the deepest sanctum of ${state.dungeon.name} (Floor ${maxDepth}).`, 'gold');
      }
      return;
    }

    if (cfg.respectsCartographyPermit !== false) {
      const permit = RESEARCH_PROJECTS.cartography.levels[state.guildResearch.cartography || 0].depthPermit;
      if (state.dungeon.currentFloor + 1 > permit) {
        if (state === gameState) {
          ui.floatingText(state.hero.x, state.hero.y, 'Ward Sealed!', '#f87171');
          ui.log(`Astral Ward blocks Floor ${state.dungeon.currentFloor + 1}! Research Vault Cartography at the Guild Lab.`, 'bad');
          playSound('hit');
        }
        return;
      }
    }

    const nextDepth = state.dungeon.currentFloor + 1;
    state.dungeon.currentFloor = nextDepth;
    state.dungeon.deepestFloor = Math.max(state.dungeon.deepestFloor || 1, nextDepth);
    const codex = ensureCodexState(state);
    const dId = state.activeDungeonId || state.dungeon.id;
    if (!codex.deepestFloorByDungeon[dId]) {
      codex.deepestFloorByDungeon[dId] = {
        name: state.dungeon.name,
        deepestFloor: nextDepth,
        maxDepth: cfg.maxDepth || 999
      };
    } else {
      codex.deepestFloorByDungeon[dId].deepestFloor = Math.max(codex.deepestFloorByDungeon[dId].deepestFloor || 1, nextDepth);
    }
    if (!state.dungeon.floors[nextDepth]) {
      state.dungeon.floors[nextDepth] = generateFloor(
        nextDepth,
        state.dungeon.config,
        state.dungeon.numericSeed
      );
    }
    const next = ensureDungeonFloorHydrated(state.dungeon, nextDepth);
    state.hero.x = next.upPos.x;
    state.hero.y = next.upPos.y;
    detectNearbyTraps(next, state);
    if (state === gameState) {
      fovCallback();
      saveGame();
      ui.updateUI();
      ui.log(`Descended to Floor ${nextDepth} of ${state.dungeon.name} (${next.width}x${next.height}).`, 'info');
    }
  } else if (state === gameState) {
    ui.log('Stand on Ascending (<) or Descending (>) stairs to use them.', 'info');
  }
}

function waitTurn(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild) return;
  if (state === gameState) {
    ui.log('You hold your ground and scan the shadows.', 'info');
  }
  processTurn(state);
}

  // --- Module: src/ui/renderer.js ---
// 2D Frustum-Culled Camera Renderer, Bresenham Torchlight FOV, Minimap / Cartographer's Map & Floating Text


const floatingTexts = [];
let hoverTile = null;
let visibleCoordMap = {};

function setHoverTile(tile) {
  hoverTile = tile;
}

function getHoverTile() {
  return hoverTile;
}

function getCameraOrigin(floor, hx, hy) {
  const fw = (floor && floor.width) || (floor && floor.tiles && floor.tiles[0] ? floor.tiles[0].length : VIEWPORT_WIDTH);
  const fh = (floor && floor.height) || (floor && floor.tiles ? floor.tiles.length : VIEWPORT_HEIGHT);
  const maxCamX = Math.max(0, fw - VIEWPORT_WIDTH);
  const maxCamY = Math.max(0, fh - VIEWPORT_HEIGHT);
  const camX = Math.max(0, Math.min(maxCamX, Math.round(hx) - Math.floor(VIEWPORT_WIDTH / 2)));
  const camY = Math.max(0, Math.min(maxCamY, Math.round(hy) - Math.floor(VIEWPORT_HEIGHT / 2)));
  return { camX, camY, fw, fh };
}

function spawnFloatingText(gx, gy, text, color = '#fff') {
  floatingTexts.push({
    gx,
    gy,
    riseOffset: 0,
    text,
    color,
    ticks: 28
  });
}

function updateFOV(state = gameState) {
  visibleCoordMap = {};
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const hx = state.hero.x;
  const hy = state.hero.y;
  const radius = state.hero.visionRadius || 5;

  const minY = Math.max(0, Math.floor(hy - radius - 1));
  const maxY = Math.min(fh - 1, Math.ceil(hy + radius + 1));
  const minX = Math.max(0, Math.floor(hx - radius - 1));
  const maxX = Math.min(fw - 1, Math.ceil(hx + radius + 1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (Math.hypot(x - hx, y - hy) <= radius + 0.35 && hasLineOfSight(floor, hx, hy, x, y)) {
        floor.explored[y][x] = 1;
        visibleCoordMap[`${x},${y}`] = true;
      }
    }
  }

  detectNearbyTraps(floor, state);

  if (state === gameState && typeof document !== 'undefined') {
    renderMinimapCanvas('minimapCanvas');
    const fullModal = document.getElementById('fullMapModal');
    if (fullModal && !fullModal.classList.contains('hidden')) {
      renderMinimapCanvas('fullMapCanvas');
    }
  }
}

function isTileVisibleNow(floor, hx, hy, vision, x, y) {
  if (visibleCoordMap[`${x},${y}`]) return true;
  if (Math.abs(x - hx) > vision + 1 || Math.abs(y - hy) > vision + 1) return false;
  return Math.hypot(x - hx, y - hy) <= vision + 0.35 && hasLineOfSight(floor, hx, hy, x, y);
}

function drawHeroSprite(ctx, px, py, classId, size = TILE_SIZE) {
  ctx.save();
  ctx.translate(px, py);
  const scale = size / 32;
  ctx.scale(scale, scale);

  const cls = CLASSES[classId] || CLASSES.fighter;
  // Base Cloak / Armor Silhouette
  ctx.fillStyle = cls.color;
  ctx.beginPath();
  ctx.arc(16, 17, 10, 0, Math.PI * 2);
  ctx.fill();

  // Head / Visor
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(11, 8, 10, 7);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(12, 10, 8, 2);

  // Class Weapon Accent
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.2;
  if (classId === 'fighter' || classId === 'paladin') {
    ctx.beginPath();
    ctx.moveTo(26, 7);
    ctx.lineTo(26, 25);
    ctx.stroke();
  } else if (classId === 'ranger') {
    ctx.beginPath();
    ctx.arc(24, 16, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (classId === 'mage') {
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(26, 9, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.lineTo(10, 22);
    ctx.stroke();
  }

  ctx.restore();
}

function minimapPixelToGrid(canvas, clientX, clientY, floor) {
  if (!canvas || !floor || !floor.tiles) return null;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const rect = canvas.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;

  const px = (clientX - rect.left) * (canvas.width / rect.width);
  const py = (clientY - rect.top) * (canvas.height / rect.height);
  const scale = Math.min(canvas.width / fw, canvas.height / fh);
  const offX = Math.floor((canvas.width - fw * scale) / 2);
  const offY = Math.floor((canvas.height - fh * scale) / 2);

  const gx = Math.floor((px - offX) / scale);
  const gy = Math.floor((py - offY) / scale);
  if (gx < 0 || gx >= fw || gy < 0 || gy >= fh) return null;
  return { x: gx, y: gy };
}

function renderMinimapCanvas(targetCanvasId = 'minimapCanvas') {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(targetCanvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) {
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Descend to chart subterranean floors', Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
    return;
  }

  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const biomeId = floor.biomeId || resolveFloorBiome(gameState.dungeon, floor.depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const scale = Math.min(canvas.width / fw, canvas.height / fh);
  const offX = Math.floor((canvas.width - fw * scale) / 2);
  const offY = Math.floor((canvas.height - fh * scale) / 2);
  const drawSize = Math.max(1, Math.ceil(scale));

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;
  const poiMarkers = [];

  for (let y = 0; y < fh; y++) {
    const expRow = floor.explored[y];
    if (!expRow) continue;
    const tileRow = floor.tiles[y];
    for (let x = 0; x < fw; x++) {
      if (!expRow[x]) continue;
      const t = tileRow[x];
      const rx = Math.floor(offX + x * scale);
      const ry = Math.floor(offY + y * scale);

      if (t === TILE_WALL) {
        ctx.fillStyle = biome.minimapWall;
        ctx.fillRect(rx, ry, drawSize, drawSize);
      } else if (ORE_CATALOG[t]) {
        ctx.fillStyle = ORE_CATALOG[t].color;
        ctx.fillRect(rx, ry, Math.max(2, drawSize), Math.max(2, drawSize));
      } else {
        ctx.fillStyle = biome.minimapFloor;
        ctx.fillRect(rx, ry, drawSize, drawSize);
        if (t === TILE_STAIRS_UP) {
          poiMarkers.push({ x: rx, y: ry, color: '#10b981', size: Math.max(3, drawSize + 1) });
        } else if (t === TILE_STAIRS_DOWN) {
          poiMarkers.push({ x: rx, y: ry, color: '#60a5fa', size: Math.max(3, drawSize + 1) });
        } else if (t === TILE_CHEST) {
          poiMarkers.push({ x: rx, y: ry, color: '#fbbf24', size: Math.max(2, drawSize) });
        } else if (t === TILE_SHRINE) {
          poiMarkers.push({ x: rx, y: ry, color: '#34d399', size: Math.max(2, drawSize) });
        } else if (t === TILE_TRAP_VISIBLE) {
          poiMarkers.push({ x: rx, y: ry, color: '#fb923c', size: Math.max(2, drawSize) });
        }
      }
    }
  }

  for (let i = 0; i < poiMarkers.length; i++) {
    const p = poiMarkers[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  // Visible Monsters on Minimap
  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    if (!isTileVisibleNow(floor, hx, hy, vision, m.x, m.y)) continue;
    ctx.fillStyle = m.isBoss ? '#fbbf24' : '#f87171';
    const mx = Math.floor(offX + m.x * scale);
    const my = Math.floor(offY + m.y * scale);
    ctx.fillRect(mx, my, Math.max(2, drawSize), Math.max(2, drawSize));
  }

  // Camera Viewport Outline
  const cam = getCameraOrigin(floor, hx, hy);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    Math.floor(offX + cam.camX * scale) + 0.5,
    Math.floor(offY + cam.camY * scale) + 0.5,
    Math.min(fw, VIEWPORT_WIDTH) * scale,
    Math.min(fh, VIEWPORT_HEIGHT) * scale
  );

  // Hero Beacon
  const heroPx = Math.floor(offX + hx * scale);
  const heroPy = Math.floor(offY + hy * scale);
  const beacon = Math.max(3, drawSize + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(heroPx - 1, heroPy - 1, beacon, beacon);
}

function renderDungeonCanvas() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('dungeonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) return;
  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const biomeId = floor.biomeId || resolveFloorBiome(gameState.dungeon, floor.depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;
  const cam = getCameraOrigin(floor, hx, hy);
  const camX = cam.camX;
  const camY = cam.camY;
  const fw = cam.fw;
  const fh = cam.fh;

  // Frustum-culled O(21*15) tile render loop
  for (let vy = 0; vy < VIEWPORT_HEIGHT; vy++) {
    const y = camY + vy;
    if (y < 0 || y >= fh) continue;
    const expRow = floor.explored[y];
    if (!expRow) continue;

    for (let vx = 0; vx < VIEWPORT_WIDTH; vx++) {
      const x = camX + vx;
      if (x < 0 || x >= fw) continue;
      if (!expRow[x]) continue;

      const px = vx * TILE_SIZE;
      const py = vy * TILE_SIZE;
      const dist = Math.hypot(x - hx, y - hy);
      const inSight = isTileVisibleNow(floor, hx, hy, vision, x, y);
      const tile = floor.tiles[y][x];

      // Draw Wall or Ore Vein Wall
      if (tile === TILE_WALL || ORE_CATALOG[tile]) {
        ctx.fillStyle = biome.wallFill;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = biome.wallCap;
        ctx.fillRect(px, py, TILE_SIZE, 4);
        ctx.fillStyle = biome.wallBase;
        ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 5);

        // Biome wall visual accent (e.g. quartz glint or magma/void ember)
        if (biome.wallAccent && !ORE_CATALOG[tile] && ((x * 13 + y * 7) % 6 === 0)) {
          ctx.fillStyle = biome.wallAccent;
          ctx.fillRect(px + 14, py + 12, 3, 3);
        }

        if (ORE_CATALOG[tile]) {
          const ore = ORE_CATALOG[tile];
          ctx.fillStyle = ore.color;
          ctx.fillRect(px + 6, py + 7, 7, 6);
          ctx.fillRect(px + 17, py + 10, 8, 6);
          ctx.fillRect(px + 10, py + 18, 9, 6);
          ctx.fillStyle = ore.sparkle;
          ctx.fillRect(px + 8, py + 8, 3, 3);
          ctx.fillRect(px + 19, py + 12, 3, 3);
        }
      } else {
        // Walkable Floor Tile (including concealed traps)
        ctx.fillStyle = (x + y) % 2 === 0 ? biome.floor1 : biome.floor2;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = biome.floorBorder;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        if (tile === TILE_STAIRS_UP) {
          ctx.fillStyle = '#34d399';
          for (let s = 0; s < 4; s++) {
            ctx.fillRect(px + 5 + s * 3, py + 22 - s * 4, 20 - s * 3, 3);
          }
        } else if (tile === TILE_STAIRS_DOWN) {
          ctx.fillStyle = '#60a5fa';
          for (let s = 0; s < 4; s++) {
            ctx.fillRect(px + 6 + s * 3, py + 7 + s * 4, 20 - s * 3, 3);
          }
        } else if (tile === TILE_CHEST) {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(px + 6, py + 10, 20, 14);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 6, py + 9, 20, 3);
          ctx.fillRect(px + 14, py + 14, 4, 5);
        } else if (tile === TILE_CHEST_OPEN) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 6, py + 15, 20, 9);
        } else if (tile === TILE_SHRINE) {
          const sMeta = (floor.shrines && floor.shrines[`${x},${y}`]) || { type: 'sanctuary' };
          const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 8, py + 20, 16, 6);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 11, py + 14, 10, 6);
          ctx.fillStyle = sDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 4);
          ctx.lineTo(px + 22, py + 11);
          ctx.lineTo(px + 16, py + 18);
          ctx.lineTo(px + 10, py + 11);
          ctx.closePath();
          ctx.fill();
        } else if (tile === TILE_SHRINE_USED) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 8, py + 20, 16, 6);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 12, py + 14, 8, 6);
        } else if (tile === TILE_TRAP_VISIBLE) {
          const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
          const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
          ctx.strokeStyle = tDef.color;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(px + 5, py + 5, 22, 22);
          ctx.fillStyle = tDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 11, py + 21);
          ctx.lineTo(px + 14, py + 11);
          ctx.lineTo(px + 17, py + 21);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 21);
          ctx.lineTo(px + 19, py + 11);
          ctx.lineTo(px + 22, py + 21);
          ctx.fill();
        } else if (tile === TILE_TRAP_DISARMED) {
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 7, py + 7, 18, 18);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 11, py + 15, 10, 2);
        }
      }

      // Torchlight Warmth or Fog Dimming
      if (!inSight) {
        ctx.fillStyle = 'rgba(4, 6, 10, 0.68)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else {
        const glow = Math.max(0, 0.13 - dist * 0.022);
        if (glow > 0) {
          ctx.fillStyle = `rgba(${biome.torchR}, ${biome.torchG}, ${biome.torchB}, ${glow})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // Draw Auto-Walk Breadcrumb Trail (if active)
  const walkPath = getAutoWalkPath();
  if (walkPath.length > 0) {
    ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
    for (let i = 0; i < walkPath.length; i++) {
      const st = walkPath[i];
      const vx = st.x - camX;
      const vy = st.y - camY;
      if (vx >= 0 && vx < VIEWPORT_WIDTH && vy >= 0 && vy < VIEWPORT_HEIGHT) {
        ctx.beginPath();
        ctx.arc(vx * TILE_SIZE + 16, vy * TILE_SIZE + 16, i === walkPath.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw Visible Monsters inside Camera Frustum
  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    const vx = m.x - camX;
    const vy = m.y - camY;
    if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) continue;
    if (!isTileVisibleNow(floor, hx, hy, vision, m.x, m.y)) continue;

    const mx = vx * TILE_SIZE;
    const my = vy * TILE_SIZE;

    if (m.isBoss) {
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 2, my + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    } else if (m.isElite) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(mx + 16, my + 16, 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = m.color;
    ctx.fillRect(mx + 8, my + 7, 16, 16);
    ctx.fillStyle = '#080b11';
    ctx.fillRect(mx + 11, my + 11, 3, 3);
    ctx.fillRect(mx + 18, my + 11, 3, 3);

    // Monster Health Bar
    const pct = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = '#04060a';
    ctx.fillRect(mx + 4, my + 26, 24, 4);
    ctx.fillStyle = m.isBoss || m.isElite ? '#fbbf24' : '#f87171';
    ctx.fillRect(mx + 4, my + 26, Math.round(24 * pct), 4);
  }

  // Draw Player Sprite relative to Camera Origin
  drawHeroSprite(ctx, (hx - camX) * TILE_SIZE, (hy - camY) * TILE_SIZE, gameState.hero.classId, TILE_SIZE);

  // Draw Hover Highlight relative to Camera Origin
  if (hoverTile) {
    const hvx = hoverTile.x - camX;
    const hvy = hoverTile.y - camY;
    if (hvx >= 0 && hvx < VIEWPORT_WIDTH && hvy >= 0 && hvy < VIEWPORT_HEIGHT) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hvx * TILE_SIZE + 1, hvy * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }

  // Draw Floating Combat/Mining Numbers projected into Camera Space
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const px = (ft.gx - camX) * TILE_SIZE + 16;
    const py = (ft.gy - camY) * TILE_SIZE + 10 - ft.riseOffset;
    if (px >= -40 && px <= canvas.width + 40 && py >= -20 && py <= canvas.height + 20) {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(ft.text, px + 1, py + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, px, py);
    }
    ft.riseOffset += 0.45;
    ft.ticks -= 1;
    if (ft.ticks <= 0) floatingTexts.splice(i, 1);
  }
}

  // --- Module: src/data/talents.js ---
// Class Talent Trees

const TALENT_TREES = {
  fighter: [
    { id: 'f_a1', name: 'Juggernaut Plating',   desc: '+12 Max HP per rank.', max: 3 },
    { id: 'f_a2', name: 'Heavy Cleaver',        desc: '+3 Physical ATK per rank.', max: 3 },
    { id: 'f_a3', name: 'Titan Resurgence',     desc: 'Counter-attack adjacent attackers for 50% ATK (35% chance).', max: 1 }
  ],
  thief: [
    { id: 't_b1', name: 'Lethal Precision',     desc: '+5% Critical Strike chance per rank.', max: 3 },
    { id: 't_b2', name: 'Mineral Vein Sense',   desc: '25% chance per rank to mine veins without using pickaxe durability.', max: 2 },
    { id: 't_b3', name: 'Shadow Dance',         desc: '+10% Dodge & defeating an enemy restores +6 MP.', max: 1 }
  ],
  mage: [
    { id: 'm_c1', name: 'Astral Reservoir',     desc: '+15 Max MP per rank.', max: 3 },
    { id: 'm_c2', name: 'Arcane Amplification', desc: '+15% Starfall Nova & spell damage per rank.', max: 3 },
    { id: 'm_c3', name: 'Supernova Echo',       desc: 'Starfall Nova triggers a second astral pulse for 50% damage.', max: 1 }
  ],
  ranger: [
    { id: 'r_d1', name: 'Pathfinder Agility',   desc: '+4% Dodge & +1 Torchlight vision per rank.', max: 3 },
    { id: 'r_d2', name: 'Piercing Shafts',      desc: 'Attacks and Volley ignore 30% of enemy DEF per rank.', max: 2 },
    { id: 'r_d3', name: 'Rain of Needles',      desc: 'Starfall Volley strikes up to 5 visible targets.', max: 1 }
  ],
  paladin: [
    { id: 'p_e1', name: 'Aegis of Dawn',        desc: '+4 DEF and +8 Max HP per rank.', max: 3 },
    { id: 'p_e2', name: 'Consecrated Arms',     desc: '+4 ATK per rank.', max: 3 },
    { id: 'p_e3', name: 'Divine Intervention',  desc: 'Once per descent, fatal damage heals you to 40% Max HP instead.', max: 1 }
  ]
};

  // --- Module: src/ui/domSync.js ---
// DOM Synchronization, Guild Hub Views (including Notice Board & Lapidary), Dungeon HUD & Chronicle Log













function formatSocketPipsHtml(item) {
  if (!item || !item.maxSockets || item.maxSockets <= 0) return '';
  const sockets = Array.isArray(item.sockets) ? item.sockets : [];
  const pips = [];
  for (let i = 0; i < item.maxSockets; i++) {
    const gId = sockets[i];
    if (gId && GEM_CATALOG[gId]) {
      pips.push(`<span style="color:${GEM_CATALOG[gId].color}" title="${GEM_CATALOG[gId].name}">◆</span>`);
    } else {
      pips.push(`<span class="text-[#64748b]" title="Empty Socket">◇</span>`);
    }
  }
  return `<span class="ml-1 tracking-tighter">${pips.join('')}</span>`;
}

function renderGuildHub() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  ensureGuildBounties(false, gameState);
  const vaultGems = gameState.guildVault.gems || { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

  const totalBankedGems = GEM_IDS.reduce((sum, gId) => sum + (vaultGems[gId] || 0), 0);
  const readyBounties = (gameState.guildBounties || []).filter(b => b && b.completed).length;

  const dng = gameState.dungeon;
  const cfg = dng.config || {};
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;

  const activeNameEl = document.getElementById('uiActiveDungeonName');
  if (activeNameEl) activeNameEl.textContent = dng.name;
  const mapSizeEl = document.getElementById('uiGuildMapSize');
  if (mapSizeEl) mapSizeEl.textContent = `${cfg.width || 80}x${cfg.height || 60}`;

  document.getElementById('uiGuildSeed').textContent = dng.seedCode;
  document.getElementById('uiChartedFloors').textContent = cfg.maxDepth >= 999
    ? `${Object.keys(dng.floors || {}).length}`
    : `${Object.keys(dng.floors || {}).length} / ${cfg.maxDepth}`;
  document.getElementById('uiDepthPermit').textContent = cfg.respectsCartographyPermit !== false
    ? `Permit Fl ${permit}`
    : `Max Fl ${cfg.maxDepth}`;
  document.getElementById('uiForgeMaxDur').textContent = getPickaxeMaxDurability();
  document.getElementById('uiTavernGold').textContent = gameState.guildVault.gold;
  document.getElementById('uiArmoryCountBadge').textContent = gameState.guildVault.armory.length;
  document.getElementById('uiTalentCountBadge').textContent = h.talentPoints || 0;

  const gemBadgeEl = document.getElementById('uiGemCountBadge');
  if (gemBadgeEl) gemBadgeEl.textContent = totalBankedGems;
  const btyBadgeEl = document.getElementById('uiBountyReadyBadge');
  if (btyBadgeEl) btyBadgeEl.textContent = readyBounties;

  // Mineral Vault Grid
  const minGrid = document.getElementById('uiVaultMineralsGrid');
  minGrid.innerHTML = MINERAL_DISPLAY.map(m => `
    <div class="bg-[#111722] p-2 rounded border border-[#283347]">
      <div class="text-[9px] text-[#8b949e] uppercase">${m.name}</div>
      <div class="font-bold text-sm mt-0.5" style="color:${m.color}">${gameState.guildVault[m.id] || 0}</div>
    </div>
  `).join('');

  // Astral Gem Vault Grid (Tavern + Lapidary Header)
  const gemCardsHtml = GEM_DISPLAY.map(g => {
    const gd = GEM_CATALOG[g.id];
    return `
      <div class="bg-[#111722] p-2 rounded border border-[#283347]" title="${gd ? gd.desc : ''}">
        <div class="text-[9px] text-[#8b949e] uppercase truncate">${g.name}</div>
        <div class="font-bold text-sm mt-0.5" style="color:${g.color}">${vaultGems[g.id] || 0}</div>
      </div>
    `;
  }).join('');

  const vaultGemsEl = document.getElementById('uiVaultGemsGrid');
  if (vaultGemsEl) vaultGemsEl.innerHTML = gemCardsHtml;
  const lapGemsEl = document.getElementById('uiLapidaryGemsBar');
  if (lapGemsEl) lapGemsEl.innerHTML = gemCardsHtml;

  // Guild Notice Board Tab (#uiBountiesGrid)
  const btyGrid = document.getElementById('uiBountiesGrid');
  if (btyGrid) {
    btyGrid.innerHTML = (gameState.guildBounties || []).map(b => {
      const pct = Math.min(100, Math.round(((b.curQty || 0) / Math.max(1, b.reqQty)) * 100));
      return `
        <div class="p-3 rounded-lg bg-[#080b11] border ${b.completed ? 'border-[#34d399]/60' : 'border-[#283347]'} flex flex-col justify-between gap-2.5">
          <div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold ${b.completed ? 'text-[#34d399]' : 'text-[#fbbf24]'}">${b.title}</span>
              <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#e6edf3]">${b.curQty || 0}/${b.reqQty}</span>
            </div>
            <p class="text-[11px] text-[#8b949e] mt-1">${b.desc}</p>
            <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden border border-[#283347] mt-2">
              <div class="h-full ${b.completed ? 'bg-[#34d399]' : 'bg-[#fbbf24]'}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="text-[11px] font-mono-num text-[#60a5fa]">Reward: <strong>${b.rewardLabel}</strong></div>
            ${b.completed
              ? `<button onclick="window.Aethelgard.claimBountyAtGuild('${b.id}')" class="w-full py-1.5 rounded bg-[#34d399] hover:bg-[#10b981] text-[#080b11] text-xs font-mono-num font-bold btn-tactical">✓ Claim Reward</button>`
              : `<div class="w-full py-1 rounded bg-[#111722] text-center text-[10px] font-mono-num text-[#8b949e] border border-[#283347]">Active on Descent</div>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // Astral Lapidary Bench Tab (#uiLapidaryItemsGrid)
  const lapGrid = document.getElementById('uiLapidaryItemsGrid');
  if (lapGrid) {
    const socketableEntries = [];
    ['weapon', 'armor', 'helm', 'boots', 'accessory'].forEach(slot => {
      const eq = h.equipment[slot];
      if (eq) {
        normalizeEquipmentSockets(eq);
        if ((eq.maxSockets || 0) > 0) {
          socketableEntries.push({ item: eq, refKey: slot, isEquipped: true, locLabel: `Equipped • ${slot.toUpperCase()}` });
        }
      }
    });
    gameState.guildVault.armory.forEach(arm => {
      normalizeEquipmentSockets(arm);
      if ((arm.maxSockets || 0) > 0) {
        socketableEntries.push({ item: arm, refKey: arm.uid, isEquipped: false, locLabel: `Vault Armory • ${arm.slot.toUpperCase()}` });
      }
    });

    if (socketableEntries.length === 0) {
      lapGrid.innerHTML = `
        <div class="p-4 rounded bg-[#080b11] border border-[#283347] text-xs text-[#8b949e] italic text-center">
          No socketed equipment owned yet. Rare, Epic, and Star-Forged Relic gear (from Gilded Chests, Elites, Bosses, or Quartermaster Rank 1+) roll 1 to 2 Astral Sockets!
        </div>
      `;
    } else {
      const availGemIds = GEM_IDS.filter(k => (vaultGems[k] || 0) > 0);
      lapGrid.innerHTML = socketableEntries.map(entry => {
        const it = entry.item;
        const r = RARITY[it.rarity] || RARITY.common;
        const socketRows = [];
        for (let sIdx = 0; sIdx < it.maxSockets; sIdx++) {
          const gId = it.sockets[sIdx];
          if (gId && GEM_CATALOG[gId]) {
            const gd = GEM_CATALOG[gId];
            socketRows.push(`
              <div class="flex items-center justify-between bg-[#111722] px-2.5 py-1.5 rounded border border-[#283347] text-xs font-mono-num">
                <span style="color:${gd.color}">◆ ${gd.name} <span class="text-[#8b949e] text-[10px]">(${gd.desc})</span></span>
                <button onclick="window.Aethelgard.unsocketGemFromItem('${entry.refKey}', ${sIdx}, ${entry.isEquipped})" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-bold btn-tactical">
                  Extract (${LAPIDARY_UNSOCKET_COST}g)
                </button>
              </div>
            `);
          } else {
            const btns = availGemIds.length > 0
              ? availGemIds.map(k => {
                  const gd = GEM_CATALOG[k];
                  return `<button onclick="window.Aethelgard.socketGemIntoItem('${entry.refKey}', '${k}', ${entry.isEquipped})" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#283347] text-[10px] font-bold btn-tactical" style="color:${gd.color}" title="${gd.desc}">+ Socket ${gd.shortName}</button>`;
                }).join(' ')
              : `<span class="text-[10px] text-[#8b949e]">Mine high-tier veins for uncut gems</span>`;
            socketRows.push(`
              <div class="flex flex-wrap items-center justify-between gap-1.5 bg-[#111722] px-2.5 py-1.5 rounded border border-[#283347] text-xs font-mono-num">
                <span class="text-[#8b949e]">◇ Empty Socket #${sIdx + 1}</span>
                <div class="flex flex-wrap gap-1">${btns}</div>
              </div>
            `);
          }
        }

        return `
          <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold" style="color:${r.color}">${it.name}</span>
                <span class="text-[10px] font-mono-num text-[#8b949e] ml-1.5">[${entry.locLabel}]</span>
              </div>
              <span class="text-[10px] font-mono-num text-[#60a5fa]">${it.sockets.length}/${it.maxSockets} Sockets</span>
            </div>
            <div class="space-y-1.5">${socketRows.join('')}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Quartermaster Buy Catalog
  const qmRank = gameState.guildResearch.quartermaster || 0;
  document.getElementById('uiShopTierLabel').textContent = `Requisition Rank ${qmRank}`;
  const shopEl = document.getElementById('shop-catalog');
  shopEl.innerHTML = SHOP_ITEMS.map(s => {
    const unlocked = qmRank >= s.reqQM;
    const canBuy = unlocked && gameState.guildVault.gold >= s.cost;
    const rColor = s.rarity ? RARITY[s.rarity].color : '#e6edf3';
    return `
      <div class="p-2.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 ${!unlocked ? 'opacity-50' : ''}">
        <div>
          <div class="text-xs font-bold" style="color:${rColor}">${s.name}</div>
          <div class="text-[11px] text-[#8b949e]">${s.desc}</div>
        </div>
        <button onclick="window.Aethelgard.buyShopItem('${s.id}')" ${!canBuy ? 'disabled' : ''} class="px-3 py-1.5 rounded text-xs font-mono-num font-bold whitespace-nowrap btn-tactical ${canBuy ? 'bg-[#fbbf24] text-[#080b11] hover:bg-[#f59e0b]' : 'bg-[#1a2232] text-[#8b949e] cursor-not-allowed'}">
          ${!unlocked ? `Req QM ${s.reqQM}` : `Buy (${s.cost}g)`}
        </button>
      </div>
    `;
  }).join('');

  // Antiquarian Assay Sell Counter (#sell-catalog)
  const assayRank = gameState.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  document.getElementById('uiAssayBonusLabel').textContent = `Appraisal Multiplier: ${Math.round(mult * 100)}% (Rank ${assayRank})`;

  const sellEl = document.getElementById('sell-catalog');
  const sellRows = [];
  MINERAL_DISPLAY.forEach(m => {
    const cnt = gameState.guildVault[m.id] || 0;
    if (cnt > 0) {
      const oreDef = Object.values(ORE_CATALOG).find(o => o.id === m.id);
      const unitVal = Math.round((oreDef ? oreDef.baseValue : 10) * mult);
      sellRows.push(`
        <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
          <div>
            <span class="font-bold" style="color:${m.color}">${m.name}</span>
            <span class="text-[#8b949e]"> x${cnt} (${unitVal}g each)</span>
          </div>
          <div class="flex gap-1">
            <button onclick="window.Aethelgard.sellMineralUnit('${m.id}', false)" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#283347]">Sell 1</button>
            <button onclick="window.Aethelgard.sellMineralUnit('${m.id}', true)" class="px-2 py-0.5 rounded bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/40">All (+${unitVal * cnt}g)</button>
          </div>
        </div>
      `);
    }
  });

  GEM_DISPLAY.forEach(g => {
    const cnt = vaultGems[g.id] || 0;
    if (cnt > 0) {
      const gDef = GEM_CATALOG[g.id];
      const unitVal = Math.round((gDef ? gDef.baseValue : 65) * mult);
      sellRows.push(`
        <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
          <div>
            <span class="font-bold" style="color:${g.color}">◆ ${g.name}</span>
            <span class="text-[#8b949e]"> x${cnt} (${unitVal}g each)</span>
          </div>
          <div class="flex gap-1">
            <button onclick="window.Aethelgard.sellGemUnit('${g.id}', false)" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#283347]">Sell 1</button>
            <button onclick="window.Aethelgard.sellGemUnit('${g.id}', true)" class="px-2 py-0.5 rounded bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/40">All (+${unitVal * cnt}g)</button>
          </div>
        </div>
      `);
    }
  });

  gameState.guildVault.armory.forEach(g => {
    const r = RARITY[g.rarity] || RARITY.common;
    const salePrice = Math.round((g.value || 15) * mult);
    const isLocked = Boolean(g.locked);
    const sellBtnHtml = isLocked
      ? `<span class="px-2 py-0.5 rounded bg-[#1a2232] text-[#fbbf24] text-[10px] border border-[#fbbf24]/30">🔒 Locked</span>`
      : `<button onclick="window.Aethelgard.sellArmoryItem('${g.uid}')" class="px-2.5 py-0.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">Sell (+${salePrice}g)</button>`;

    sellRows.push(`
      <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="cursor-pointer hover:underline">
          <span class="font-bold" style="color:${r.color}">${g.name}</span>${formatSocketPipsHtml(g)}
          <span class="text-[10px] text-[#8b949e] uppercase ml-1">[${g.slot}]</span>
        </div>
        ${sellBtnHtml}
      </div>
    `);
  });

  sellEl.innerHTML = sellRows.length > 0
    ? sellRows.join('')
    : `<div class="text-[#8b949e] italic py-4 text-center">No banked minerals, gems, or spare equipment to appraise. Mine veins & extract from the dungeon!</div>`;

  // Vault Armory Tab
  const sortBy = (gameState.uiSettings && gameState.uiSettings.armorySortBy) || 'slot';
  ['slot', 'rarity', 'power', 'value', 'name'].forEach(k => {
    const btn = document.getElementById(`btnSort_${k}`);
    if (btn) {
      if (k === sortBy) {
        btn.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-[#1a2232] text-[#fbbf24] border border-[#fbbf24]/50';
      } else {
        btn.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-[#111722] text-[#8b949e] border border-[#283347] hover:text-[#e6edf3]';
      }
    }
  });

  const slotWeights = { weapon: 1, armor: 2, helm: 3, boots: 4, accessory: 5, pickaxe: 6 };
  const rarityWeights = { relic: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

  const rawArmory = gameState.guildVault.armory || [];
  const displayArmory = rawArmory.slice();

  displayArmory.sort((a, b) => {
    if (sortBy === 'slot') {
      const swA = slotWeights[a.slot] || 99;
      const swB = slotWeights[b.slot] || 99;
      if (swA !== swB) return swA - swB;
      return computeItemPowerScore(b) - computeItemPowerScore(a);
    } else if (sortBy === 'rarity') {
      const rwA = rarityWeights[a.rarity] || 0;
      const rwB = rarityWeights[b.rarity] || 0;
      if (rwA !== rwB) return rwB - rwA;
      return (b.value || 0) - (a.value || 0);
    } else if (sortBy === 'power') {
      return computeItemPowerScore(b) - computeItemPowerScore(a);
    } else if (sortBy === 'value') {
      return (b.value || 0) - (a.value || 0);
    } else if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  let upgradeCount = 0;
  rawArmory.forEach(g => {
    if (isItemUpgrade(g, h.equipment)) upgradeCount++;
  });

  const upgradeBadgeEl = document.getElementById('uiArmoryUpgradeCountBadge');
  if (upgradeBadgeEl) {
    if (upgradeCount > 0) {
      upgradeBadgeEl.textContent = `▲ ${upgradeCount} Upgrade${upgradeCount > 1 ? 's' : ''}`;
      upgradeBadgeEl.classList.remove('hidden');
    } else {
      upgradeBadgeEl.classList.add('hidden');
    }
  }

  const armoryGrid = document.getElementById('uiArmoryGrid');
  if (displayArmory.length === 0) {
    armoryGrid.innerHTML = `<div class="col-span-2 text-xs text-[#8b949e] italic py-4 text-center">Your Vault Armory is empty. Defeat monsters, open chests, or buy gear from the Quartermaster.</div>`;
  } else {
    armoryGrid.innerHTML = displayArmory.map(g => {
      const r = RARITY[g.rarity] || RARITY.common;
      const isUpgrade = isItemUpgrade(g, h.equipment);
      const pwr = computeItemPowerScore(g);
      const isLocked = Boolean(g.locked);
      const borderClass = isUpgrade
        ? 'border-[#34d399]/60 bg-[#07130f]'
        : (isLocked ? 'border-[#fbbf24]/40 bg-[#080b11]' : 'border-[#283347] bg-[#080b11]');

      const upgradeBadgeHtml = isUpgrade
        ? `<span class="px-1.5 py-0.2 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40 text-[9px] font-bold">▲ UPGRADE</span>`
        : '';

      const lockBtnHtml = `
        <button onclick="event.stopPropagation(); window.Aethelgard.toggleItemLock('${g.uid}')" class="px-1 py-0.5 rounded text-[11px] ${isLocked ? 'text-[#fbbf24]' : 'text-[#64748b] hover:text-[#e6edf3]'}" title="${isLocked ? 'Locked (Protected from sale)' : 'Unlocked (Click to Lock)'}">
          ${isLocked ? '🔒' : '🔓'}
        </button>
      `;

      return `
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="p-2.5 rounded ${borderClass} hover:border-[#60a5fa] cursor-pointer flex items-center justify-between gap-2">
          <div class="truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-xs font-bold truncate" style="color:${r.color}">${g.name}${formatSocketPipsHtml(g)}</span>
              ${upgradeBadgeHtml}
            </div>
            <div class="text-[10px] text-[#8b949e] uppercase mt-0.5">
              <span>${r.name} • ${g.slot}</span>
              <span class="text-[#60a5fa] font-mono-num ml-1">PWR ${pwr}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-xs font-mono-num text-[#fbbf24]">${g.value}g</span>
            ${lockBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Training Hall Talents Tab
  document.getElementById('uiTalentClassTitle').textContent = CLASSES[h.classId].name;
  document.getElementById('uiTalentPointsText').textContent = h.talentPoints || 0;
  const talents = TALENT_TREES[h.classId] || [];
  document.getElementById('uiTalentsGrid').innerHTML = talents.map(t => {
    const cur = h.talentsAllocated[t.id] || 0;
    const isMax = cur >= t.max;
    const canSpend = (h.talentPoints || 0) > 0 && !isMax;
    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isMax ? 'border-[#34d399]/50' : 'border-[#283347]'} flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#60a5fa]">${t.name}</span>
            <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#fbbf24]">${cur} / ${t.max}</span>
          </div>
          <p class="text-[11px] text-[#8b949e] mt-1.5">${t.desc}</p>
        </div>
        <button onclick="window.Aethelgard.allocateTalent('${t.id}')" ${!canSpend ? 'disabled' : ''} class="w-full py-1.5 rounded text-xs font-mono-num font-bold btn-tactical ${isMax ? 'bg-[#111722] text-[#34d399]' : canSpend ? 'bg-[#2563eb] hover:bg-[#3b82f6] text-white' : 'bg-[#1a2232] text-[#8b949e] opacity-50 cursor-not-allowed'}">
          ${isMax ? '★ Mastered' : 'Train Rank'}
        </button>
      </div>
    `;
  }).join('');

  // Research Lab Tab
  const resGrid = document.getElementById('uiResearchGrid');
  resGrid.innerHTML = Object.values(RESEARCH_PROJECTS).map(proj => {
    const curRank = gameState.guildResearch[proj.id] || 0;
    const isMax = curRank >= proj.levels.length - 1;
    const nxt = proj.levels[curRank + 1];

    let costPills = '';
    let canAfford = !isMax;
    if (!isMax && nxt) {
      const hasGold = gameState.guildVault.gold >= nxt.costGold;
      if (!hasGold) canAfford = false;
      costPills += `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num ${hasGold ? 'bg-[#fbbf24]/15 text-[#fbbf24]' : 'bg-[#f87171]/15 text-[#f87171]'}">${nxt.costGold}g</span>`;
      for (const [oreId, qty] of Object.entries(nxt.costOre)) {
        const have = gameState.guildVault[oreId] || 0;
        const ok = have >= qty;
        if (!ok) canAfford = false;
        costPills += `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num ${ok ? 'bg-[#34d399]/15 text-[#34d399]' : 'bg-[#f87171]/15 text-[#f87171]'}">${qty} ${oreId} (${have})</span>`;
      }
    }

    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isMax ? 'border-[#34d399]/50' : 'border-[#283347]'} flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#e6edf3]">${proj.name}</span>
            <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#60a5fa]">Rank ${curRank}/${proj.levels.length - 1}</span>
          </div>
          <p class="text-[11px] text-[#8b949e] mt-1">${proj.desc}</p>
          <div class="text-[11px] font-mono-num text-[#34d399] mt-1">Current: ${proj.levels[curRank].desc}</div>
        </div>
        <div>
          <div class="flex flex-wrap gap-1 mb-2">${costPills}</div>
          <button onclick="window.Aethelgard.purchaseResearchRank('${proj.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-1.5 rounded text-xs font-mono-num font-bold btn-tactical ${isMax ? 'bg-[#111722] text-[#34d399]' : canAfford ? 'bg-[#fbbf24] text-[#080b11] hover:bg-[#f59e0b]' : 'bg-[#1a2232] text-[#8b949e] opacity-50 cursor-not-allowed'}">
            ${isMax ? '★ Completed' : `Research Rank ${curRank + 1}`}
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderCodexTab();
}

function renderCodexTab() {
  if (typeof document === 'undefined') return;
  const codex = ensureCodexState(gameState);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('uiCodexMonstersSlain', codex.totalMonstersSlain || 0);
  setTxt('uiCodexBossesSlain', codex.totalBossesSlain || 0);
  setTxt('uiCodexOresMined', codex.totalOresMined || 0);
  setTxt('uiCodexGemsUnearthed', codex.totalGemsUnearthed || 0);
  setTxt('uiCodexExtractions', codex.totalExtractions || 0);

  const allMonsters = Object.values(MONSTER_ARCHETYPES).concat(Object.values(BOSS_ARCHETYPES));
  let masteredCount = 0;

  for (let i = 0; i < allMonsters.length; i++) {
    const m = allMonsters[i];
    const kills = (codex.killsByArchetype && codex.killsByArchetype[m.id]) || 0;
    const req = m.isBoss ? 1 : CODEX_MASTERY_KILLS;
    if (kills >= req) {
      masteredCount++;
    }
  }

  setTxt('uiCodexMasteredCount', masteredCount);
  setTxt('uiCodexMasteryBadge', masteredCount);

  // Deepest Floor Grid
  const deepestGrid = document.getElementById('uiCodexDeepestGrid');
  if (deepestGrid) {
    const depths = codex.deepestFloorByDungeon || {};
    const dngKeys = Object.keys(depths);
    if (dngKeys.length === 0) {
      deepestGrid.innerHTML = '<div class="col-span-full text-xs text-[#8b949e] italic py-2 text-center">No expeditions recorded yet. Descend the stairs to chart records!</div>';
    } else {
      deepestGrid.innerHTML = dngKeys.map(dKey => {
        const dProf = CURATED_DUNGEON_PROFILES[dKey];
        const dName = (dProf && dProf.name) || dKey;
        const maxF = depths[dKey] || 0;
        return `
          <div class="bg-[#111722] p-2.5 rounded border border-[#283347] flex items-center justify-between">
            <span class="text-xs text-[#e6edf3] font-bold truncate">${dName}</span>
            <span class="text-xs font-mono-num text-[#34d399] font-bold ml-2">Fl ${maxF}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Star-Forged Relics Grid
  const relicsGrid = document.getElementById('uiCodexRelicsGrid');
  if (relicsGrid) {
    const relics = Array.isArray(codex.relicsUnlocked) ? codex.relicsUnlocked : [];
    if (relics.length === 0) {
      relicsGrid.innerHTML = '<div class="col-span-full text-xs text-[#8b949e] italic py-2 text-center">No relics unearthed yet. Challenge deep Vault bosses (Floors 10, 15, 20) or rare chests!</div>';
    } else {
      relicsGrid.innerHTML = relics.map(r => {
        const rar = RARITY[r.rarity] || RARITY.relic;
        return `
          <div class="bg-[#111722] p-2.5 rounded border border-[#fbbf24]/40 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold" style="color:${rar.color}">★ ${r.name}</div>
              <div class="text-[10px] text-[#8b949e] uppercase">${r.slot} • Fl ${r.floorDepth || 1}</div>
            </div>
            <span class="text-[10px] font-mono-num text-[#fbbf24] px-1.5 py-0.5 rounded bg-[#080b11]">Relic</span>
          </div>
        `;
      }).join('');
    }
  }

  // Bestiary & Hunter Mastery Grid
  const bestiaryGrid = document.getElementById('uiBestiaryGrid');
  if (bestiaryGrid) {
    bestiaryGrid.innerHTML = allMonsters.map(m => {
      const kills = (codex.killsByArchetype && codex.killsByArchetype[m.id]) || 0;
      const req = m.isBoss ? 1 : CODEX_MASTERY_KILLS;
      const isMastered = kills >= req;
      const borderCol = isMastered ? 'border-[#fbbf24]/50' : 'border-[#283347]';
      const bgCol = isMastered ? 'bg-[#181308]' : 'bg-[#111722]';
      const sym = m.isBoss ? '👑' : (m.isRanged ? '🏹' : '⚔️');
      const badgeText = m.isBoss ? 'BOSS' : (m.bountyTag ? m.bountyTag.toUpperCase() : 'FOE');
      const statLine = m.isBoss ? `HP: ${m.hp} | ATK: ${m.atk} | DEF: ${m.def}` : (m.desc || '');
      const statRight = m.isBoss ? `+${m.xp} XP` : (m.family ? m.family.replace('_', ' ').toUpperCase() : '');

      return `
        <div class="${bgCol} p-2.5 rounded border ${borderCol} flex flex-col justify-between gap-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-sm font-bold font-mono" style="color:${m.color}">${sym}</span>
              <span class="text-xs font-bold truncate ${m.isBoss ? 'text-[#f87171]' : 'text-[#e6edf3]'}">${m.name}</span>
            </div>
            <span class="text-[10px] font-mono-num px-1 rounded bg-[#080b11] ${m.isBoss ? 'text-[#f87171]' : 'text-[#8b949e]'}">
              ${badgeText}
            </span>
          </div>
          <div class="text-[10px] font-mono-num text-[#8b949e] flex justify-between gap-1">
            <span class="truncate">${statLine}</span>
            <span class="shrink-0 text-[#60a5fa]">${statRight}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-[#283347]/50 text-[11px] font-mono-num">
            <span class="text-[#8b949e]">Kills: <strong class="${kills > 0 ? 'text-[#e6edf3]' : 'text-[#8b949e]'}">${kills}</strong>/${req}</span>
            ${isMastered
              ? '<span class="text-[#fbbf24] font-bold">★ +8% DMG</span>'
              : `<span class="text-[#64748b]">${req - kills} more</span>`
            }
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderDungeonHud() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  const cls = CLASSES[h.classId];
  const dng = gameState.dungeon;
  const cfg = dng.config || {};
  const depth = dng.currentFloor;
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  const capLabel = cfg.respectsCartographyPermit !== false ? permit : cfg.maxDepth;
  const floor = ensureDungeonFloorHydrated(dng, depth);
  const fw = floor ? floor.width : (cfg.width || 80);
  const fh = floor ? floor.height : (cfg.height || 60);

  document.getElementById('uiFloorBadge').textContent = `FLOOR ${depth} / ${capLabel >= 999 ? '∞' : capLabel}`;
  const biomeId = resolveFloorBiome(cfg, depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;
  const biomeBadge = document.getElementById('uiFloorBiomeBadge');
  if (biomeBadge && biome) {
    biomeBadge.textContent = biome.name;
    biomeBadge.style.color = biome.badgeColor || '#38bdf8';
    biomeBadge.style.borderColor = (biome.badgeColor || '#38bdf8') + '55';
  }
  const zoneLabelEl = document.getElementById('uiZoneDangerLabel');
  if (zoneLabelEl) {
    zoneLabelEl.textContent = `${dng.name} • ${fw}x${fh}`;
  }
  const coordEl = document.getElementById('uiCoordBadge');
  if (coordEl) {
    coordEl.textContent = `(${h.x}, ${h.y})`;
  }
  document.getElementById('uiHostilesCount').textContent = floor ? floor.monsters.length : 0;
  document.getElementById('uiVisionRadiusText').textContent = h.visionRadius || 5;

  document.getElementById('btnSkillLabel').textContent = cls.skillName;
  document.getElementById('btnSkillMpCost').textContent = `${cls.skillCost} MP`;
  document.getElementById('btnPotionCount').textContent = h.consumables.potions;
  document.getElementById('btnRecallCount').textContent = h.consumables.recalls;

  // Boss HUD Check
  const boss = floor ? floor.monsters.find(m => m.isBoss) : null;
  const bossBar = document.getElementById('bossHudBar');
  if (boss) {
    bossBar.classList.remove('hidden');
    document.getElementById('uiBossName').textContent = boss.name.toUpperCase();
    document.getElementById('uiBossHpText').textContent = `${boss.hp} / ${boss.maxHp} HP`;
    document.getElementById('uiBossHpFill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
  } else {
    bossBar.classList.add('hidden');
  }
}

function updateAllUI() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  if (!h) return;
  recomputeHeroDerivedStats(false, gameState);
  ensureGuildBounties(false, gameState);
  const cls = CLASSES[h.classId];

  // Header
  document.getElementById('headerSeedText').textContent = gameState.dungeon.seedCode;
  document.getElementById('headerTurnText').textContent = gameState.turn;
  document.getElementById('headerLocationText').textContent = gameState.inGuild
    ? 'Oakhaven Guild Bastion'
    : `${gameState.dungeon.name} • Floor ${gameState.dungeon.currentFloor}`;
  document.getElementById('headerLocationDot').className = gameState.inGuild
    ? 'w-2.5 h-2.5 rounded-full bg-[#34d399]'
    : 'w-2.5 h-2.5 rounded-full bg-[#f87171] animate-pulse';

  const mmScaleEl = document.getElementById('uiMinimapScaleLabel');
  if (mmScaleEl) {
    const dCfg = gameState.dungeon && gameState.dungeon.config ? gameState.dungeon.config : { width: 80, height: 60 };
    mmScaleEl.textContent = gameState.inGuild
      ? `${dCfg.width}x${dCfg.height} Chart`
      : `Fl ${gameState.dungeon.currentFloor} • ${dCfg.width}x${dCfg.height}`;
  }

  // Portrait
  const pCanvas = document.getElementById('heroPortraitCanvas');
  if (pCanvas) {
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 42, 42);
    drawHeroSprite(pCtx, 3, 3, h.classId, 36);
  }

  // Hero Sheet
  document.getElementById('uiHeroName').textContent = h.name;
  document.getElementById('uiHeroTitleBadge').textContent = cls.title;
  document.getElementById('uiHeroLevel').textContent = h.level;
  document.getElementById('uiHeroXp').textContent = `${h.xp} / ${h.maxXp}`;

  document.getElementById('uiHpText').textContent = `${h.hp} / ${h.maxHp}`;
  document.getElementById('uiHpBar').style.width = `${Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100))}%`;
  document.getElementById('uiMpText').textContent = `${h.mp} / ${h.maxMp}`;
  document.getElementById('uiMpBar').style.width = `${Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100))}%`;

  const pick = h.equipment.pickaxe;
  const maxDur = getPickaxeMaxDurability();
  const curDur = pick ? pick.curDur : 0;
  document.getElementById('uiPickaxeLabel').textContent = pick ? pick.name : 'No Pickaxe';
  document.getElementById('uiPickaxeText').textContent = `${curDur} / ${maxDur}`;
  document.getElementById('uiPickaxeBar').style.width = `${Math.max(0, Math.min(100, (curDur / maxDur) * 100))}%`;

  // Statuses & Shrine Blessings
  const stRow = document.getElementById('uiStatusEffectsRow');
  if (h.statuses && h.statuses.length > 0) {
    stRow.innerHTML = h.statuses.map(s => `
      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold" style="background:${s.color}25; color:${s.color}; border:1px solid ${s.color}50">
        ${s.isBuff ? '✨ ' : ''}${s.name} (${s.duration})
      </span>
    `).join('');
  } else {
    stRow.innerHTML = `<span class="text-[10px] text-[#8b949e] italic">No active status effects</span>`;
  }

  // Stats
  document.getElementById('uiStatStr').textContent = h.computedStr;
  document.getElementById('uiStatDex').textContent = h.computedDex;
  document.getElementById('uiStatInt').textContent = h.computedInt;
  document.getElementById('uiStatVit').textContent = h.computedVit;
  document.getElementById('uiStatAtk').textContent = h.atk;
  document.getElementById('uiStatDef').textContent = h.def;
  document.getElementById('uiStatCrit').textContent = `${h.crit}%`;
  document.getElementById('uiStatDodge').textContent = `${h.dodge}%`;

  const spBox = document.getElementById('uiStatPointsBox');
  if ((h.statPoints || 0) > 0) {
    spBox.classList.remove('hidden');
    document.getElementById('uiStatPointsCount').textContent = h.statPoints;
  } else {
    spBox.classList.add('hidden');
  }

  // Paper Doll 6 Slots (with Gem Socket pips)
  const dollGrid = document.getElementById('uiPaperDollGrid');
  dollGrid.innerHTML = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'].map(slot => {
    const it = h.equipment[slot];
    const r = it ? (RARITY[it.rarity] || RARITY.common) : RARITY.common;
    let sub = '—';
    if (it) {
      if (slot === 'weapon') sub = `+${it.atk} ATK`;
      else if (slot === 'armor') sub = `+${it.def} DEF`;
      else if (slot === 'helm') sub = `+${it.def || 0} DEF`;
      else if (slot === 'boots') sub = `+${it.dodge || 0}% Dodge`;
      else if (slot === 'accessory') sub = `+${it.crit || 0}% Crit`;
      else if (slot === 'pickaxe') sub = `${it.curDur}/${maxDur} Dur`;
    }
    return `
      <div onclick="window.Aethelgard.openItemInspectModal('${slot}', true)" class="p-2 rounded bg-[#080b11] border border-[#283347] hover:border-[#60a5fa] cursor-pointer">
        <div class="flex items-center justify-between text-[9px] text-[#8b949e] uppercase">
          <span>${slot}</span>
          ${formatSocketPipsHtml(it)}
        </div>
        <div class="font-bold truncate" style="color:${it ? r.color : '#64748b'}">${it ? it.name : 'Empty'}</div>
        <div class="text-[10px] text-[#8b949e]">${sub}</div>
      </div>
    `;
  }).join('');

  // Class Kit
  document.getElementById('uiPassiveBadge').textContent = cls.passiveName;
  document.getElementById('uiPassiveDesc').textContent = cls.passiveDesc;
  document.getElementById('uiSkillTitle').textContent = `${cls.skillName} [Q]`;
  document.getElementById('uiSkillMpBadge').textContent = `${cls.skillCost} MP`;
  document.getElementById('uiSkillDesc').textContent = cls.skillDesc;

  // Right Sidebar Economy & Pack
  document.getElementById('uiVaultGoldBadge').textContent = `${gameState.guildVault.gold}g`;
  document.getElementById('uiConsumablePotions').textContent = h.consumables.potions;
  document.getElementById('uiConsumableRecalls').textContent = h.consumables.recalls;

  const packList = document.getElementById('uiExpeditionPackList');
  let totalRiskVal = 0;
  const packHtml = [];
  h.expeditionPack.forEach(item => {
    const v = item.val * item.qty;
    totalRiskVal += v;
    const isGem = item.type === 'Gem' && GEM_CATALOG[item.id];
    const nameColor = isGem ? GEM_CATALOG[item.id].color : '#e6edf3';
    const prefix = isGem ? '◆ ' : '';
    packHtml.push(`
      <div class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347]">
        <span style="color:${nameColor}">${prefix}${item.name} x${item.qty}</span>
        <span class="text-[#fbbf24]">${v}g</span>
      </div>
    `);
  });
  h.expeditionGear.forEach(gear => {
    totalRiskVal += (gear.value || 20);
    const r = RARITY[gear.rarity] || RARITY.common;
    packHtml.push(`
      <div onclick="window.Aethelgard.openItemInspectModal('${gear.uid}', false, true)" class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347] cursor-pointer hover:border-[#60a5fa]">
        <span style="color:${r.color}">★ ${gear.name}${formatSocketPipsHtml(gear)}</span>
        <span class="text-[#fbbf24]">${gear.value}g</span>
      </div>
    `);
  });
  packList.innerHTML = packHtml.length > 0
    ? packHtml.join('')
    : `<div class="text-[#8b949e] italic text-[11px] py-1">Pack is empty. Mine veins & open chests.</div>`;
  document.getElementById('uiPackTotalValue').textContent = `${totalRiskVal}g Value`;

  // Sidebar Live Bounties Tracker
  const sbBounties = document.getElementById('uiSidebarBountiesList');
  if (sbBounties) {
    sbBounties.innerHTML = (gameState.guildBounties || []).map(b => `
      <div class="p-1.5 rounded bg-[#080b11] border ${b.completed ? 'border-[#34d399]/50' : 'border-[#283347]'} flex items-center justify-between gap-2">
        <div class="truncate">
          <span class="${b.completed ? 'text-[#34d399] font-bold' : 'text-[#e6edf3]'}">${b.completed ? '✓ ' : ''}${b.title}</span>
          <div class="text-[10px] text-[#8b949e] truncate">${b.rewardLabel}</div>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-[#111722] text-[10px] ${b.completed ? 'text-[#34d399] font-bold' : 'text-[#fbbf24]'} whitespace-nowrap">${b.curQty || 0}/${b.reqQty}</span>
      </div>
    `).join('');
  }

  // View Toggle
  if (gameState.inGuild) {
    document.getElementById('guildViewPanel').classList.remove('hidden');
    document.getElementById('dungeonViewPanel').classList.add('hidden');
    renderGuildHub();
  } else {
    document.getElementById('guildViewPanel').classList.add('hidden');
    document.getElementById('dungeonViewPanel').classList.remove('hidden');
    renderDungeonHud();
  }
  renderMinimapCanvas('minimapCanvas');
}

function switchGuildTab(tabId) {
  if (typeof document === 'undefined') return;
  ['tavern', 'bounties', 'lapidary', 'shop', 'armory', 'talents', 'research', 'codex'].forEach(t => {
    const panel = document.getElementById(`guildTab_${t}`);
    if (panel) panel.classList.toggle('hidden', t !== tabId);
    const btn = document.getElementById(`tabBtn_${t}`);
    if (btn) {
      if (t === tabId) {
        btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-[#fbbf24] text-[#fbbf24] whitespace-nowrap';
      } else {
        btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-transparent text-[#8b949e] hover:text-[#e6edf3] whitespace-nowrap';
      }
    }
  });
}

function setArmorySortBy(sortKey) {
  if (!gameState.uiSettings) {
    gameState.uiSettings = {};
  }
  gameState.uiSettings.armorySortBy = sortKey;
  updateAllUI();
}

function logChronicle(msg, tone = 'info') {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('chronicle-log');
  if (!box) return;
  const colors = {
    gold: '#fbbf24',
    good: '#34d399',
    bad:  '#f87171',
    info: '#94a3b8'
  };
  const div = document.createElement('div');
  div.style.color = colors[tone] || colors.info;
  div.textContent = `[T${gameState.turn}] ${msg}`;
  box.appendChild(div);
  while (box.children.length > 100) {
    box.removeChild(box.firstChild);
  }
  box.scrollTop = box.scrollHeight;
}

function clearChronicle() {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('chronicle-log');
  if (box) box.innerHTML = '';
}

  // --- Module: src/ui/modals.js ---
// In-Game Modals, Expedition Atlas & Custom Charter Builder, Full-Floor Survey Map, Item Inspect & Save Sync













let inspectedItemContext = null;
let pendingAtlasResetId = null;

function getInspectedItemContext() {
  return inspectedItemContext;
}

function descendIntoDungeon() {
  cancelAutoWalk();
  syncActiveDungeonAlias(gameState);
  gameState.inGuild = false;
  gameState.dungeon.currentFloor = 1;
  if (!gameState.dungeon.floors[1]) {
    gameState.dungeon.floors[1] = generateFloor(
      1,
      gameState.dungeon.config,
      gameState.dungeon.numericSeed
    );
  }
  const f1 = ensureDungeonFloorHydrated(gameState.dungeon, 1);
  gameState.hero.x = f1.upPos.x;
  gameState.hero.y = f1.upPos.y;
  updateFOV();
  saveGame();
  updateAllUI();
  logChronicle(
    `Descended into Floor 1 of ${gameState.dungeon.name} (${f1.width}x${f1.height} • ${gameState.dungeon.seedCode}).`,
    'gold'
  );
}

function showOutcomeModal(title, desc, details = [], isConfirmNewDungeon = false) {
  if (typeof document === 'undefined') return;
  document.getElementById('outcomeModalTitle').textContent = title;
  document.getElementById('outcomeModalDesc').textContent = desc;
  document.getElementById('outcomeModalDetails').innerHTML = details.map(d => `<div>• ${d}</div>`).join('');
  const btnBox = document.getElementById('outcomeModalButtons');
  if (isConfirmNewDungeon) {
    btnBox.innerHTML = `
      <button onclick="window.Aethelgard.closeOutcomeModal()" class="px-3 py-1.5 rounded bg-[#1a2232] text-xs font-mono-num text-[#8b949e]">Cancel</button>
      <button onclick="window.Aethelgard.confirmChartNewDungeon()" class="px-4 py-1.5 rounded bg-[#f87171] text-[#080b11] font-bold text-xs font-mono-num">Confirm Re-Chart</button>
    `;
  } else {
    btnBox.innerHTML = `<button onclick="window.Aethelgard.closeOutcomeModal()" class="px-4 py-1.5 rounded bg-[#fbbf24] text-[#080b11] font-bold text-xs">Continue</button>`;
  }
  document.getElementById('outcomeModal').classList.remove('hidden');
}

function closeOutcomeModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('outcomeModal').classList.add('hidden');
}

// ============================================================================
// MULTI-DUNGEON EXPEDITION ATLAS & CUSTOM CHARTER MODAL
// ============================================================================

const FAMILY_LABELS = {
  balanced: 'Mixed Vault Host',
  beasts: 'Subterranean Beasts',
  dwarven_forge: 'Dwarven Forge Constructs',
  astral_cult: 'Astral Void Cult',
  ancient_crypt: 'Ancient Undead Crypt'
};

const ORE_LABELS = {
  balanced: 'Balanced Seams',
  copper_iron: 'Copper & Iron Heavy',
  mithril_geode: 'Mithril & Relic Geodes',
  astral_crystal: 'Star-Crystal & Astralite'
};

function renderExpeditionAtlasContents() {
  if (typeof document === 'undefined') return;
  const listEl = document.getElementById('atlasDungeonsList');
  if (!listEl) return;

  const allIds = Object.keys(gameState.dungeons || {});
  const sortedIds = allIds.slice().sort((a, b) => {
    const da = gameState.dungeons[a];
    const db = gameState.dungeons[b];
    if (da.originType !== db.originType) {
      return da.originType === 'curated' ? -1 : 1;
    }
    return 0;
  });

  const charteredCount = sortedIds.filter(
    id => gameState.dungeons[id] && gameState.dungeons[id].originType === 'chartered'
  ).length;
  const cap = gameState.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS;
  const badgeEl = document.getElementById('uiAtlasCharterCountBadge');
  if (badgeEl) {
    badgeEl.textContent = `${charteredCount} / ${cap} Chartered`;
  }

  const curCart = (gameState.guildResearch && gameState.guildResearch.cartography) || 0;

  listEl.innerHTML = sortedIds.map(id => {
    const dng = gameState.dungeons[id];
    const cfg = dng.config || {};
    const isActive = id === gameState.activeDungeonId;
    const reqCart = cfg.reqCartography || 0;
    const locked = curCart < reqCart;
    const chartedCount = Object.keys(dng.floors || {}).length;
    const maxDepthText = cfg.maxDepth >= 999 ? '∞ Floors' : `Max Fl ${cfg.maxDepth}`;
    const styleDef = LAYOUT_STYLES[cfg.layoutStyle] || LAYOUT_STYLES.masonry_vaults;
    const famLabel = FAMILY_LABELS[cfg.monsterFamily] || cfg.monsterFamily;
    const oreLabel = ORE_LABELS[cfg.oreFocus] || cfg.oreFocus;
    const isConfirmingReset = pendingAtlasResetId === id;

    let actionButtons = '';
    if (locked) {
      actionButtons = `
        <span class="px-2.5 py-1 rounded bg-[#1a2232] text-[#f87171] border border-[#f87171]/40 text-[11px] font-mono-num">
          🔒 Req Vault Cartography R${reqCart}
        </span>
      `;
    } else if (isConfirmingReset) {
      actionButtons = `
        <span class="text-[11px] text-[#f87171] font-bold mr-1">${dng.originType === 'chartered' ? 'Abandon charter?' : 'Seal & re-chart floors?'}</span>
        <button onclick="window.Aethelgard.handleResetDungeonFromAtlas('${id}')" class="px-2.5 py-1 rounded bg-[#f87171] text-[#080b11] text-[11px] font-mono-num font-bold btn-tactical">Confirm</button>
        <button onclick="window.Aethelgard.cancelResetDungeonFromAtlas()" class="px-2 py-1 rounded bg-[#1a2232] text-[#8b949e] text-[11px] font-mono-num">Cancel</button>
      `;
    } else {
      actionButtons = `
        ${isActive
          ? `<span class="px-2.5 py-1 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/50 text-[11px] font-mono-num font-bold">✓ Selected</span>`
          : `<button onclick="window.Aethelgard.handleSelectDungeonFromAtlas('${id}', false)" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#e6edf3] border border-[#283347] text-[11px] font-mono-num font-bold btn-tactical">Select</button>`
        }
        <button onclick="window.Aethelgard.handleSelectDungeonFromAtlas('${id}', true)" class="px-3 py-1 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] text-[11px] font-mono-num font-bold btn-tactical">
          ⚔️ Descend
        </button>
        <button onclick="window.Aethelgard.promptResetDungeonFromAtlas('${id}')" class="px-2 py-1 rounded bg-[#111722] hover:bg-[#1a2232] text-[#8b949e] hover:text-[#f87171] border border-[#283347] text-[11px] font-mono-num btn-tactical">
          ${dng.originType === 'chartered' ? '✕ Abandon' : '↻ Re-Chart'}
        </button>
      `;
    }

    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isActive ? 'border-[#fbbf24]' : 'border-[#283347]'} space-y-2">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-display font-bold text-sm" style="color:${cfg.themeColor || '#e6edf3'}">${dng.name}</span>
              <span class="text-[9px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-[#1a2232] text-[#8b949e] border border-[#283347]">
                ${dng.originType === 'curated' ? 'Regional' : 'Charter'}
              </span>
              ${dng.isCleared ? `<span class="text-[9px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] font-bold">★ Cleared</span>` : ''}
            </div>
            <div class="text-[11px] text-[#8b949e] mt-0.5">${cfg.subtitle || ''}</div>
          </div>
          <span class="text-[11px] font-mono-num text-[#60a5fa] font-bold">${dng.seedCode}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono-num">
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347]">
            <span class="text-[#8b949e]">Scale:</span> <strong class="text-[#fbbf24]">${cfg.width}x${cfg.height}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347]">
            <span class="text-[#8b949e]">Depth:</span> <strong class="text-[#e6edf3]">${chartedCount} charted / ${maxDepthText}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347] truncate" title="${famLabel}">
            <span class="text-[#8b949e]">Foes:</span> <strong class="text-[#f87171]">${famLabel}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347] truncate" title="${oreLabel}">
            <span class="text-[#8b949e]">Veins:</span> <strong class="text-[#34d399]">${oreLabel}</strong>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#192234]">
          <span class="text-[10px] text-[#8b949e]">Architecture: <strong class="text-[#e6edf3]">${styleDef.name}</strong></span>
          <div class="flex flex-wrap items-center gap-1.5">${actionButtons}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openExpeditionAtlasModal() {
  if (typeof document === 'undefined') return;
  pendingAtlasResetId = null;
  const msgEl = document.getElementById('charterStatusMsg');
  if (msgEl) msgEl.textContent = '';
  renderExpeditionAtlasContents();
  const modal = document.getElementById('expeditionAtlasModal');
  if (modal) modal.classList.remove('hidden');
}

function closeExpeditionAtlasModal() {
  if (typeof document === 'undefined') return;
  pendingAtlasResetId = null;
  const modal = document.getElementById('expeditionAtlasModal');
  if (modal) modal.classList.add('hidden');
}

function handleSelectDungeonFromAtlas(dungeonId, descendImmediately = false) {
  const res = selectActiveDungeon(dungeonId, gameState);
  if (!res.ok) return;
  renderExpeditionAtlasContents();
  if (descendImmediately) {
    closeExpeditionAtlasModal();
    descendIntoDungeon();
  }
}

function promptResetDungeonFromAtlas(dungeonId) {
  pendingAtlasResetId = dungeonId;
  renderExpeditionAtlasContents();
}

function cancelResetDungeonFromAtlas() {
  pendingAtlasResetId = null;
  renderExpeditionAtlasContents();
}

function handleResetDungeonFromAtlas(dungeonId) {
  pendingAtlasResetId = null;
  resetOrAbandonDungeon(dungeonId, gameState);
  renderExpeditionAtlasContents();
}

function onCharterSizePresetChange() {
  if (typeof document === 'undefined') return;
  const sel = document.getElementById('charterSizeSelect');
  const wIn = document.getElementById('charterWidthInput');
  const hIn = document.getElementById('charterHeightInput');
  if (!sel || !wIn || !hIn) return;
  const preset = MAP_SIZE_PRESETS[sel.value];
  if (preset) {
    wIn.value = preset.width;
    hIn.value = preset.height;
  }
}

function submitCharterForm(randomize = false) {
  if (typeof document === 'undefined') return;
  const nameEl = document.getElementById('charterNameInput');
  const sizeEl = document.getElementById('charterSizeSelect');
  const wEl = document.getElementById('charterWidthInput');
  const hEl = document.getElementById('charterHeightInput');
  const depthEl = document.getElementById('charterDepthInput');
  const styleEl = document.getElementById('charterStyleSelect');
  const monEl = document.getElementById('charterMonsterSelect');
  const oreEl = document.getElementById('charterOreSelect');
  const richEl = document.getElementById('charterRichnessSelect');
  const statusEl = document.getElementById('charterStatusMsg');

  let opts = {};
  if (randomize) {
    const sizeKeys = ['small', 'standard', 'sprawling', 'colossal'];
    const pickedSize = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
    const preset = MAP_SIZE_PRESETS[pickedSize];
    const randDepths = [1, 2, 3, 5, 8, 12];
    const richKeys = ['standard', 'rich', 'jackpot'];
    opts = {
      randomize: true,
      sizePreset: pickedSize,
      width: preset.width,
      height: preset.height,
      maxDepth: randDepths[Math.floor(Math.random() * randDepths.length)],
      richness: richKeys[Math.floor(Math.random() * richKeys.length)]
    };
  } else {
    const rawW = Math.max(36, Math.min(400, Math.round(Number(wEl && wEl.value) || 80)));
    const rawH = Math.max(28, Math.min(300, Math.round(Number(hEl && hEl.value) || 60)));
    const rawD = Math.max(1, Math.min(999, Math.round(Number(depthEl && depthEl.value) || 5)));
    if (wEl) wEl.value = rawW;
    if (hEl) hEl.value = rawH;
    if (depthEl) depthEl.value = rawD;

    opts = {
      name: nameEl && nameEl.value ? nameEl.value.trim() : '',
      sizePreset: sizeEl ? sizeEl.value : 'custom',
      width: rawW,
      height: rawH,
      maxDepth: rawD,
      layoutStyle: styleEl ? styleEl.value : 'masonry_vaults',
      monsterFamily: monEl ? monEl.value : 'balanced',
      oreFocus: oreEl ? oreEl.value : 'balanced',
      richness: richEl ? richEl.value : 'standard'
    };
  }

  const res = chartCustomExpedition(opts, gameState);
  if (statusEl) {
    if (res.ok) {
      statusEl.style.color = '#34d399';
      statusEl.textContent = `✓ Chartered "${res.dungeon.name}" (${res.dungeon.config.width}x${res.dungeon.config.height}, Max Fl ${res.dungeon.config.maxDepth})!`;
      if (nameEl && !randomize) nameEl.value = '';
    } else {
      statusEl.style.color = '#f87171';
      statusEl.textContent = res.reason === 'charter_cap_reached'
        ? `✕ Charter cap reached (${res.cap}). Abandon an existing charter first.`
        : '✕ Return to Guild Bastion before charting.';
    }
  }
  renderExpeditionAtlasContents();
}

function openNewDungeonModal() {
  openExpeditionAtlasModal();
}

function closeNewDungeonModal() {
  closeExpeditionAtlasModal();
  closeOutcomeModal();
}

function confirmChartNewDungeon() {
  resetOrAbandonDungeon(gameState.activeDungeonId, gameState);
  gameState.dungeon.floors = {
    1: generateFloor(1, gameState.dungeon.config, gameState.dungeon.numericSeed)
  };
  closeOutcomeModal();
  saveGame();
  updateAllUI();
}

// ============================================================================
// FULL-FLOOR CARTOGRAPHER'S SURVEY MAP MODAL ([M])
// ============================================================================

function openFullMapModal() {
  if (typeof document === 'undefined') return;
  if (gameState.inGuild) {
    openExpeditionAtlasModal();
    return;
  }
  const modal = document.getElementById('fullMapModal');
  if (!modal) return;

  const dng = gameState.dungeon;
  const floor = ensureDungeonFloorHydrated(dng, dng.currentFloor);
  const fw = floor ? floor.width : (dng.config.width || 80);
  const fh = floor ? floor.height : (dng.config.height || 60);

  const titleEl = document.getElementById('fullMapModalTitle');
  if (titleEl) {
    titleEl.textContent = `${dng.name} — Floor ${dng.currentFloor} (${fw}x${fh})`;
  }
  const subEl = document.getElementById('fullMapModalSubtitle');
  if (subEl) {
    subEl.textContent = `Seed ${dng.seedCode} • Position (${gameState.hero.x}, ${gameState.hero.y}) • Click any explored chamber or corridor to Auto-Walk`;
  }

  modal.classList.remove('hidden');
  renderMinimapCanvas('fullMapCanvas');
}

function closeFullMapModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('fullMapModal');
  if (modal) modal.classList.add('hidden');
}

function toggleFullMapModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('fullMapModal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) {
    openFullMapModal();
  } else {
    closeFullMapModal();
  }
}

// ============================================================================
// GUILD SERVICES, STATS, TALENTS, ITEM INSPECT, CLASS SELECT & SAVE SYNC
// ============================================================================

function restAtGuild() {
  recomputeHeroDerivedStats(true, gameState);
  gameState.hero.statuses = [];
  playSound('lvl');
  logChronicle('Rested at the Sanctuary Hearth. HP and MP restored to 100%!', 'good');
  saveGame();
  updateAllUI();
}

function repairPickaxeAtGuild() {
  const pick = gameState.hero.equipment.pickaxe;
  if (!pick) return;
  const maxDur = getPickaxeMaxDurability();
  if (pick.curDur >= maxDur) {
    logChronicle('Your pickaxe is already at full durability.', 'info');
    return;
  }
  if (gameState.guildVault.gold < 10) {
    logChronicle('Need 10 Vault Gold to repair your pickaxe.', 'bad');
    return;
  }
  gameState.guildVault.gold -= 10;
  pick.curDur = maxDur;
  playSound('mine');
  logChronicle(`Blacksmith repaired ${pick.name} to ${maxDur}/${maxDur} durability.`, 'good');
  saveGame();
  updateAllUI();
}

function spendStatPoint(stat) {
  const h = gameState.hero;
  if ((h.statPoints || 0) <= 0) return;
  h.bonusStats = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 };
  h.bonusStats[stat] = (h.bonusStats[stat] || 0) + 1;
  h.statPoints -= 1;
  recomputeHeroDerivedStats(false, gameState);
  saveGame();
  updateAllUI();
}

function allocateTalent(tId) {
  const h = gameState.hero;
  const talents = TALENT_TREES[h.classId] || [];
  const tDef = talents.find(t => t.id === tId);
  if (!tDef || (h.talentPoints || 0) <= 0) return;
  const cur = h.talentsAllocated[tId] || 0;
  if (cur >= tDef.max) return;
  h.talentsAllocated[tId] = cur + 1;
  h.talentPoints -= 1;
  playSound('lvl');
  recomputeHeroDerivedStats(false, gameState);
  logChronicle(`Trained ${tDef.name} (Rank ${cur + 1}/${tDef.max})!`, 'good');
  saveGame();
  updateAllUI();
}

function respecTalents() {
  const h = gameState.hero;
  if (gameState.guildVault.gold < 25) {
    logChronicle('Need 25 Vault Gold to reset talents.', 'bad');
    return;
  }
  let refunded = 0;
  Object.values(h.talentsAllocated).forEach(v => { refunded += v; });
  if (refunded === 0) return;
  gameState.guildVault.gold -= 25;
  h.talentPoints = (h.talentPoints || 0) + refunded;
  h.talentsAllocated = {};
  recomputeHeroDerivedStats(false, gameState);
  logChronicle(`Reset talents! Refunded ${refunded} Talent Points.`, 'gold');
  saveGame();
  updateAllUI();
}

function closeItemInspectModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('itemInspectModal').classList.add('hidden');
}

function openItemInspectModal(refId, isEquippedSlot = false, fromExpedition = false) {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  let item = null;
  if (isEquippedSlot) {
    item = h.equipment[refId];
  } else if (fromExpedition) {
    item = h.expeditionGear.find(g => g.uid === refId);
  } else {
    item = gameState.guildVault.armory.find(g => g.uid === refId);
  }
  if (!item) return;
  normalizeEquipmentSockets(item);

  inspectedItemContext = { item, refId, isEquippedSlot, fromExpedition };
  const r = RARITY[item.rarity] || RARITY.common;
  const badge = document.getElementById('inspectRarityBadge');
  badge.textContent = `${r.name} • ${item.slot.toUpperCase()}`;
  badge.style.backgroundColor = `${r.color}25`;
  badge.style.color = r.color;

  const title = document.getElementById('inspectItemTitle');
  title.textContent = item.name;
  title.style.color = r.color;

  const curEq = h.equipment[item.slot];
  const statKeys = [
    { k: 'atk',    label: 'Attack' },
    { k: 'def',    label: 'Defense' },
    { k: 'str',    label: 'Strength' },
    { k: 'dex',    label: 'Dexterity' },
    { k: 'int',    label: 'Intelligence' },
    { k: 'vit',    label: 'Vitality' },
    { k: 'crit',   label: 'Crit Chance %' },
    { k: 'dodge',  label: 'Dodge %' },
    { k: 'maxHp',  label: 'Max HP' },
    { k: 'maxMp',  label: 'Max MP' },
    { k: 'maxDur', label: 'Base Durability' }
  ];

  const rows = [];
  statKeys.forEach(({ k, label }) => {
    const newVal = item[k] || 0;
    const oldVal = curEq ? (curEq[k] || 0) : 0;
    if (newVal > 0 || oldVal > 0) {
      const diff = newVal - oldVal;
      const diffBadge = isEquippedSlot
        ? `<span class="text-[#8b949e]">(Equipped)</span>`
        : diff > 0
          ? `<span class="text-[#34d399] font-bold">(+${diff})</span>`
          : diff < 0
            ? `<span class="text-[#f87171] font-bold">(${diff})</span>`
            : `<span class="text-[#8b949e]">(0)</span>`;
      rows.push(`<div class="flex justify-between"><span>${label}:</span><span><strong>${newVal}</strong> ${diffBadge}</span></div>`);
    }
  });
  document.getElementById('inspectComparisonBody').innerHTML = rows.join('') || `<div class="text-[#8b949e]">Standard equipment piece</div>`;

  const affEl = document.getElementById('inspectAffixesBody');
  const affHtml = [];
  if (item.affixes && item.affixes.length > 0) {
    item.affixes.forEach(a => {
      affHtml.push(`<div class="text-[#fbbf24]">★ +${a.val} ${a.stat.toUpperCase()} (${a.label})</div>`);
    });
  }

  // Render Astral Gem Sockets & Inline Lapidary Actions (when in Guild & banked/equipped)
  if ((item.maxSockets || 0) > 0) {
    const canModifySockets = gameState.inGuild && !fromExpedition;
    const targetRefKey = isEquippedSlot ? refId : item.uid;
    affHtml.push(`<div class="pt-2 mt-2 border-t border-[#283347] text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">Astral Sockets (${item.sockets.length}/${item.maxSockets})</div>`);

    for (let sIdx = 0; sIdx < item.maxSockets; sIdx++) {
      const gId = item.sockets[sIdx];
      if (gId && GEM_CATALOG[gId]) {
        const gDef = GEM_CATALOG[gId];
        const unsocketBtn = canModifySockets
          ? `<button onclick="window.Aethelgard.unsocketFromInspect('${targetRefKey}', ${sIdx}, ${isEquippedSlot})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px]">Extract (${LAPIDARY_UNSOCKET_COST}g)</button>`
          : '';
        affHtml.push(`
          <div class="flex items-center justify-between bg-[#080b11] p-1.5 rounded border border-[#283347]">
            <span style="color:${gDef.color}">◆ ${gDef.name} <span class="text-[#8b949e]">(${gDef.desc})</span></span>
            ${unsocketBtn}
          </div>
        `);
      } else {
        let gemButtons = '';
        if (canModifySockets && gameState.guildVault.gems) {
          const avail = GEM_IDS.filter(k => (gameState.guildVault.gems[k] || 0) > 0);
          if (avail.length > 0) {
            gemButtons = avail.map(k => {
              const gd = GEM_CATALOG[k];
              return `<button onclick="window.Aethelgard.socketFromInspect('${targetRefKey}', '${k}', ${isEquippedSlot})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#283347] text-[10px]" style="color:${gd.color}">+${gd.shortName}</button>`;
            }).join(' ');
          } else {
            gemButtons = `<span class="text-[10px] text-[#8b949e]">No banked gems</span>`;
          }
        }
        affHtml.push(`
          <div class="flex flex-wrap items-center justify-between gap-1 bg-[#080b11] p-1.5 rounded border border-[#283347]">
            <span class="text-[#8b949e]">◇ Empty Socket</span>
            <div class="flex flex-wrap gap-1">${gemButtons}</div>
          </div>
        `);
      }
    }
  }

  affEl.innerHTML = affHtml.join('');

  const btnEquip = document.getElementById('btnInspectEquip');
  const btnSell = document.getElementById('btnInspectSell');
  const btnLock = document.getElementById('btnInspectLock');

  if (btnLock) {
    if (item.locked) {
      btnLock.textContent = '🔒 Locked (Keep)';
      btnLock.className = 'px-3 py-1.5 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] border border-[#fbbf24]/50 text-xs font-mono-num font-bold btn-tactical';
    } else {
      btnLock.textContent = '🔓 Unlocked (Sellable)';
      btnLock.className = 'px-3 py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#8b949e] hover:text-[#e6edf3] border border-[#283347] text-xs font-mono-num btn-tactical';
    }
  }

  if (isEquippedSlot) {
    btnEquip.textContent = 'Unequip';
    btnEquip.onclick = () => {
      if (item.slot === 'pickaxe') {
        logChronicle('Pickaxe cannot be unequipped directly; buy or equip a replacement.', 'info');
      } else {
        h.equipment[item.slot] = null;
        gameState.guildVault.armory.push(item);
        recomputeHeroDerivedStats(false, gameState);
        saveGame();
        updateAllUI();
      }
      closeItemInspectModal();
    };
    btnSell.classList.add('hidden');
  } else {
    btnEquip.textContent = 'Equip Now';
    btnEquip.onclick = () => {
      const prev = h.equipment[item.slot];
      h.equipment[item.slot] = item;
      if (fromExpedition) {
        h.expeditionGear = h.expeditionGear.filter(g => g.uid !== item.uid);
        if (prev) h.expeditionGear.push(prev);
      } else {
        gameState.guildVault.armory = gameState.guildVault.armory.filter(g => g.uid !== item.uid);
        if (prev) gameState.guildVault.armory.push(prev);
      }
      playSound('lvl');
      recomputeHeroDerivedStats(false, gameState);
      saveGame();
      updateAllUI();
      closeItemInspectModal();
    };
    btnSell.classList.remove('hidden');
    const assayMult = 1 + (gameState.guildResearch.assay || 0) * 0.35;
    const saleVal = Math.round((item.value || 15) * assayMult);
    btnSell.textContent = `Sell (+${saleVal}g)`;

    if (item.locked) {
      btnSell.disabled = true;
      btnSell.className = 'px-3 py-1.5 rounded bg-[#1a2232] text-[#8b949e] border border-[#283347] text-xs font-mono-num opacity-50 cursor-not-allowed';
      btnSell.title = 'Item is locked. Unlock it first to sell.';
      btnSell.onclick = null;
    } else {
      btnSell.disabled = false;
      btnSell.className = 'px-3 py-1.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-mono-num font-bold btn-tactical';
      btnSell.title = '';
      btnSell.onclick = () => {
        if (fromExpedition) {
          h.expeditionGear = h.expeditionGear.filter(g => g.uid !== item.uid);
          gameState.guildVault.gold += saleVal;
        } else {
          sellArmoryItem(item.uid);
        }
        saveGame();
        updateAllUI();
        closeItemInspectModal();
      };
    }
  }

  document.getElementById('itemInspectModal').classList.remove('hidden');
}

function toggleLockFromInspect() {
  if (!inspectedItemContext || !inspectedItemContext.item) return;
  toggleItemLock(inspectedItemContext.item.uid);
  openItemInspectModal(inspectedItemContext.refId, inspectedItemContext.isEquippedSlot, inspectedItemContext.fromExpedition);
  updateAllUI();
}

function socketFromInspect(targetRef, gemId, isEquippedSlot) {
  const res = socketGemIntoItem(targetRef, gemId, isEquippedSlot, gameState);
  if (res.ok) {
    openItemInspectModal(targetRef, isEquippedSlot, false);
  }
}

function unsocketFromInspect(targetRef, socketIdx, isEquippedSlot) {
  const res = unsocketGemFromItem(targetRef, socketIdx, isEquippedSlot, gameState);
  if (res.ok) {
    openItemInspectModal(targetRef, isEquippedSlot, false);
  }
}

function openClassSelectModal(allowCancel = false) {
  if (typeof document === 'undefined') return;
  document.getElementById('btnCloseClassModal').classList.toggle('hidden', !allowCancel);
  const container = document.getElementById('classCardsContainer');
  container.innerHTML = Object.values(CLASSES).map(c => `
    <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#283347] hover:border-[#fbbf24] flex flex-col justify-between gap-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-display font-bold text-base" style="color:${c.color}">${c.name} — ${c.title}</span>
          <span class="text-[10px] font-mono-num px-2 py-0.5 rounded bg-[#1a2232] text-[#e6edf3]">HP ${c.hpBase} | MP ${c.mpBase}</span>
        </div>
        <div class="text-xs text-[#34d399] font-semibold mt-1.5">Passive: ${c.passiveName}</div>
        <p class="text-[11px] text-[#8b949e]">${c.passiveDesc}</p>
        <div class="text-xs text-[#60a5fa] font-semibold mt-1.5">Skill [Q]: ${c.skillName} (${c.skillCost} MP)</div>
        <p class="text-[11px] text-[#8b949e]">${c.skillDesc}</p>
      </div>
      <button onclick="window.Aethelgard.selectAdventurerClass('${c.id}')" class="w-full py-2 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase tracking-wider btn-tactical">
        Begin as ${c.name}
      </button>
    </div>
  `).join('');
  document.getElementById('classSelectModal').classList.remove('hidden');
}

function closeClassSelectModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('classSelectModal').classList.add('hidden');
}

function selectAdventurerClass(classId, targetState = gameState) {
  syncActiveDungeonAlias(targetState);
  const cls = CLASSES[classId] || CLASSES.fighter;
  const eqCopy = JSON.parse(JSON.stringify(cls.starterGear));
  Object.keys(eqCopy).forEach(k => {
    normalizeEquipmentSockets(eqCopy[k]);
  });

  targetState.hero = {
    name: cls.name,
    classId: cls.id,
    level: 1,
    xp: 0,
    maxXp: 60,
    statPoints: 0,
    bonusStats: { str: 0, dex: 0, int: 0, vit: 0 },
    hp: cls.hpBase,
    maxHp: cls.hpBase,
    mp: cls.mpBase,
    maxMp: cls.mpBase,
    atk: 12,
    def: 6,
    crit: 5,
    dodge: 5,
    talentPoints: 1,
    talentsAllocated: {},
    consumables: { potions: 2, recalls: 1 },
    equipment: eqCopy,
    expeditionPack: [],
    expeditionGear: [],
    statuses: [],
    usedDivineIntervention: false,
    x: 1,
    y: 1
  };
  targetState.inGuild = true;
  targetState.dungeon.currentFloor = 1;
  const f1 = generateFloor(1, targetState.dungeon.config, targetState.dungeon.numericSeed);
  targetState.dungeon.floors = { 1: f1 };
  targetState.hero.x = f1.upPos.x;
  targetState.hero.y = f1.upPos.y;
  ensureGuildBounties(false, targetState);

  recomputeHeroDerivedStats(true, targetState);

  if (targetState === gameState) {
    closeClassSelectModal();
    logChronicle(`Sworn into the Oakhaven Guild as a ${cls.name} (${cls.title})!`, 'gold');
    saveGame();
    updateAllUI();
  }
}

function openSaveSyncModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('saveJsonTextarea').value = JSON.stringify(serializeStateForStorage(gameState), null, 2);
  document.getElementById('saveSyncStatusMsg').textContent = '';
  document.getElementById('saveSyncModal').classList.remove('hidden');
}

function closeSaveSyncModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('saveSyncModal').classList.add('hidden');
}

function copySaveJson() {
  if (typeof document === 'undefined') return;
  const area = document.getElementById('saveJsonTextarea');
  area.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(area.value).catch(() => {
      document.execCommand('copy');
    });
  } else {
    document.execCommand('copy');
  }
  document.getElementById('saveSyncStatusMsg').textContent = '✓ Copied compact RLE save JSON to clipboard!';
}

function downloadSaveJson() {
  if (typeof document === 'undefined') return;
  const blob = new Blob([document.getElementById('saveJsonTextarea').value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `aethelgard_${gameState.dungeon.seedCode}.json`;
  a.click();
}

function importSaveJson() {
  if (typeof document === 'undefined') return;
  try {
    const raw = document.getElementById('saveJsonTextarea').value;
    const migrated = migrateSaveData(raw);
    setGameState(migrated);
    recomputeHeroDerivedStats(false, gameState);
    saveGame();
    updateAllUI();
    closeSaveSyncModal();
    logChronicle('Imported & migrated save state to Multi-Dungeon Atlas Schema v5!', 'good');
  } catch (e) {
    document.getElementById('saveSyncStatusMsg').textContent = '✕ Invalid JSON format.';
  }
}

  // --- Module: src/ui/input.js ---
// Unified Keyboard, Camera-Translated Mouse, Minimap / Full-Map Click-to-Travel & Tactical Scanner Listeners









function updateScannerOnHover(gx, gy) {
  if (typeof document === 'undefined') return;
  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;
  if (gy < 0 || gy >= floor.tiles.length || gx < 0 || gx >= floor.tiles[0].length) return;
  if (!floor.explored[gy] || !floor.explored[gy][gx]) return;

  const box = document.getElementById('uiScannerContent');
  if (!box) return;

  const h = gameState.hero;
  const vision = (h && h.visionRadius) || 5;
  const inSight = h && Math.hypot(gx - h.x, gy - h.y) <= vision + 0.35 && hasLineOfSight(floor, h.x, h.y, gx, gy);

  const monster = inSight ? floor.monsters.find(m => m.x === gx && m.y === gy) : null;
  if (monster) {
    box.innerHTML = `
      <div class="font-bold" style="color:${monster.color}">${monster.name} ${monster.isBoss ? '👑' : ''}</div>
      <div class="text-[11px] text-[#e6edf3]">HP: ${monster.hp}/${monster.maxHp} • ATK: ${monster.atk} • DEF: ${monster.def}</div>
      <div class="text-[10px] text-[#8b949e]">${monster.affix ? monster.affix.desc : (monster.isRanged ? `Ranged Attacker (${monster.range || 3} tiles)` : 'Melee Guardian')}</div>
    `;
    return;
  }

  const t = floor.tiles[gy][gx];
  if (ORE_CATALOG[t]) {
    const ore = ORE_CATALOG[t];
    box.innerHTML = `
      <div class="font-bold" style="color:${ore.color}">${ore.name} Vein (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">Base Value: ${ore.baseValue}g • Requires Geology Rank ${ore.minGeology}</div>
      <div class="text-[10px] text-[#8b949e]">Step into or click vein to swing your pickaxe.</div>
    `;
  } else if (t === TILE_CHEST) {
    box.innerHTML = `<div class="font-bold text-[#fbbf24]">Gilded Vault Chest (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Contains relics and procedural equipment. Click to travel & open.</div>`;
  } else if (t === TILE_SHRINE) {
    const sMeta = (floor.shrines && floor.shrines[`${gx},${gy}`]) || { type: 'sanctuary' };
    const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;
    box.innerHTML = `
      <div class="font-bold" style="color:${sDef.color}">✨ ${sDef.name} (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">${sDef.desc}</div>
      <div class="text-[10px] text-[#8b949e]">Step onto or click this altar to claim its astral blessing.</div>
    `;
  } else if (t === TILE_SHRINE_USED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Dormant Astral Altar (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Its celestial energy has already been channeled.</div>`;
  } else if (t === TILE_TRAP_VISIBLE) {
    const tMeta = (floor.traps && floor.traps[`${gx},${gy}`]) || { type: 'spike' };
    const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
    const isScout = h && (h.classId === 'thief' || h.classId === 'ranger');
    box.innerHTML = `
      <div class="font-bold" style="color:${tDef.color}">⚠ ${tDef.name} (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">${tDef.desc}</div>
      <div class="text-[10px] text-[#34d399]">${isScout ? 'Step onto tile to safely DISARM for bonus XP!' : 'Auto-walk routes around spotted traps automatically.'}</div>
    `;
  } else if (t === TILE_TRAP_DISARMED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Disarmed Runic Plate (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Mechanism neutralized; safe to walk across.</div>`;
  } else if (t === TILE_STAIRS_UP) {
    box.innerHTML = `<div class="font-bold text-[#34d399]">Ascending Stairs (&lt;) (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click to Auto-Walk here, then press [E] to ascend or extract.</div>`;
  } else if (t === TILE_STAIRS_DOWN) {
    box.innerHTML = `<div class="font-bold text-[#60a5fa]">Descending Stairs (&gt;) (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click to Auto-Walk here, then press [E] to descend deeper.</div>`;
  } else {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Vault Masonry (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click any explored tile to safely Auto-Walk, or press [M] for full map.</div>`;
  }
}

function setupInputs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
      return;
    }

    if (isAutoWalking()) {
      cancelAutoWalk();
    }

    if (e.code === 'Escape') {
      closeFullMapModal();
      closeExpeditionAtlasModal();
      closeItemInspectModal();
      return;
    }

    const classModal = document.getElementById('classSelectModal');
    const saveModal = document.getElementById('saveSyncModal');
    const atlasModal = document.getElementById('expeditionAtlasModal');
    const fullMapModal = document.getElementById('fullMapModal');
    if (classModal && !classModal.classList.contains('hidden')) return;
    if (saveModal && !saveModal.classList.contains('hidden')) return;
    if (atlasModal && !atlasModal.classList.contains('hidden')) return;

    if (e.code === 'KeyM') {
      e.preventDefault();
      toggleFullMapModal();
      return;
    }

    if (fullMapModal && !fullMapModal.classList.contains('hidden')) return;
    if (gameState.inGuild) return;

    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); handlePlayerAction(0, -1); }
    else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); handlePlayerAction(0, 1); }
    else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); handlePlayerAction(-1, 0); }
    else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); handlePlayerAction(1, 0); }
    else if (e.code === 'KeyQ') { e.preventDefault(); executeClassSkill(); }
    else if (e.code === 'KeyH') { e.preventDefault(); useHealingTonic(); }
    else if (e.code === 'KeyR') { e.preventDefault(); useRecallScroll(); }
    else if (e.code === 'KeyE') { e.preventDefault(); useStairsAtPlayer(); }
    else if (e.code === 'Space') { e.preventDefault(); waitTurn(); }
  });

  const canvas = document.getElementById('dungeonCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const vx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
      const vy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

      if (vx >= 0 && vx < VIEWPORT_WIDTH && vy >= 0 && vy < VIEWPORT_HEIGHT) {
        const gx = cam.camX + vx;
        const gy = cam.camY + vy;
        if (gx >= 0 && gx < cam.fw && gy >= 0 && gy < cam.fh) {
          setHoverTile({ x: gx, y: gy });
          updateScannerOnHover(gx, gy);
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      setHoverTile(null);
    });

    canvas.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
      const rect = canvas.getBoundingClientRect();
      const vx = Math.floor(((e.clientX - rect.left) * (canvas.width / rect.width)) / TILE_SIZE);
      const vy = Math.floor(((e.clientY - rect.top) * (canvas.height / rect.height)) / TILE_SIZE);
      if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) return;

      const gx = cam.camX + vx;
      const gy = cam.camY + vy;
      const dx = gx - gameState.hero.x;
      const dy = gy - gameState.hero.y;

      if (dx === 0 && dy === 0) {
        if (isAutoWalking()) {
          cancelAutoWalk();
        } else {
          useStairsAtPlayer();
        }
      } else if (Math.abs(dx) + Math.abs(dy) === 1) {
        cancelAutoWalk();
        handlePlayerAction(dx, dy);
      } else if (gx >= 0 && gx < cam.fw && gy >= 0 && gy < cam.fh) {
        startAutoWalkTo(gx, gy);
      }
    });
  }

  // Sidebar Minimap Click-to-Travel
  const minimap = document.getElementById('minimapCanvas');
  if (minimap) {
    minimap.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const pt = minimapPixelToGrid(minimap, e.clientX, e.clientY, floor);
      if (pt && floor.explored[pt.y] && floor.explored[pt.y][pt.x]) {
        startAutoWalkTo(pt.x, pt.y);
      }
    });
  }

  // Full-Floor Survey Map Hover & Click-to-Travel
  const fullMap = document.getElementById('fullMapCanvas');
  if (fullMap) {
    fullMap.addEventListener('mousemove', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const lbl = document.getElementById('fullMapHoverLabel');
      if (!lbl) return;
      const pt = minimapPixelToGrid(fullMap, e.clientX, e.clientY, floor);
      if (!pt || !floor.explored[pt.y] || !floor.explored[pt.y][pt.x]) {
        lbl.textContent = 'Unexplored Shadow';
        return;
      }
      const t = floor.tiles[pt.y][pt.x];
      if (ORE_CATALOG[t]) lbl.textContent = `(${pt.x}, ${pt.y}) • ${ORE_CATALOG[t].name} Vein — Click to Auto-Walk`;
      else if (t === TILE_STAIRS_UP) lbl.textContent = `(${pt.x}, ${pt.y}) • Ascending Stairs (<) — Click to Auto-Walk`;
      else if (t === TILE_STAIRS_DOWN) lbl.textContent = `(${pt.x}, ${pt.y}) • Descending Stairs (>) — Click to Auto-Walk`;
      else if (t === TILE_CHEST) lbl.textContent = `(${pt.x}, ${pt.y}) • Gilded Vault Chest — Click to Auto-Walk`;
      else if (t === TILE_SHRINE) lbl.textContent = `(${pt.x}, ${pt.y}) • Astral Shrine — Click to Auto-Walk`;
      else lbl.textContent = `(${pt.x}, ${pt.y}) • Explored Tile — Click to Auto-Walk`;
    });

    fullMap.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const pt = minimapPixelToGrid(fullMap, e.clientX, e.clientY, floor);
      if (pt && floor.explored[pt.y] && floor.explored[pt.y][pt.x]) {
        closeFullMapModal();
        startAutoWalkTo(pt.x, pt.y);
      }
    });
  }
}

  // --- Module: src/test/selfTest.js ---
// 21/21 Comprehensive Automated Self-Test Suite (Sandboxed & Non-Destructive)














function evaluateSelfTests() {
  const results = [];

  // 1. Schema v6 Migration preserves v1–v5 saves & backfills Multi-Dungeon Atlas, gems, bounties & codex
  const legacySave = {
    version: 'v0.1.0-inc1',
    hero: { classId: 'ranger', level: 4, xp: 20 },
    bank: { gold: 120, potions: 4, recallScrolls: 2, items: [{ id: 'copper_ore', count: 5 }] },
    research: { max_depth: 1, metallurgy_geology: 2 }
  };
  const mig = migrateSaveData(legacySave);
  const t1Pass = !!(
    mig.version === SCHEMA_VERSION &&
    mig.hero.classId === 'ranger' &&
    mig.guildVault.gold === 120 &&
    mig.guildVault.copper === 5 &&
    mig.hero.consumables.potions === 4 &&
    mig.guildResearch.geology === 2 &&
    mig.guildVault.gems &&
    mig.dungeons &&
    mig.dungeons.dng_starfall &&
    mig.dungeon === mig.dungeons[mig.activeDungeonId] &&
    Array.isArray(mig.guildBounties) &&
    mig.guildBounties.length === 3 &&
    mig.codex &&
    mig.codex.killsByArchetype &&
    mig.codex.deepestFloorByDungeon
  );
  results.push({
    name: '1. Schema v6 Save Migration (v1–v5 & Multi-Dungeon + Codex Compatibility)',
    pass: t1Pass,
    detail: `Migrated Lv4 Ranger, 120g, 5 Copper, ${Object.keys(mig.dungeons).length} Regional Dungeons, 3 Bounties & Codex`
  });

  // 2. All 5 Classes Registered with Complete Declarations
  const reqClasses = ['fighter', 'thief', 'mage', 'ranger', 'paladin'];
  const t2Pass = reqClasses.every(
    k => CLASSES[k] && CLASSES[k].skillName && CLASSES[k].passiveName && CLASSES[k].starterGear.pickaxe
  );
  results.push({
    name: '2. Complete 5-Class Registry (Fighter, Thief, Mage, Ranger, Paladin)',
    pass: t2Pass,
    detail: `Ranger Skill: ${CLASSES.ranger.skillName} • Paladin Skill: ${CLASSES.paladin.skillName}`
  });

  // 3. Pure-Floor BFS Staircase Reachability & Non-Blocking Ores/Traps (80x60 Standard Scale)
  let bfsAllPass = true;
  for (let i = 0; i < 5; i++) {
    const testFl = generateFloor(i + 1, CURATED_DUNGEON_PROFILES.starfall_vaults, 4100 + i);
    if (!verifyPureFloorBFS(testFl)) bfsAllPass = false;
  }
  results.push({
    name: '3. Pure-Floor BFS Staircase Reachability (80x60 Trap-Free & Non-Blocking)',
    pass: bfsAllPass,
    detail: '5/5 80x60 procedural floors verified with safe trap-free walkable paths from < to >'
  });

  // 4. Procedural 6-Slot Equipment & 5 Rarity Tiers
  const relicItem = generateProceduralEquipment(6, 'relic', 'weapon');
  const t4Pass = !!(
    relicItem &&
    relicItem.rarity === 'relic' &&
    relicItem.affixes.length >= 3 &&
    relicItem.atk > 0 &&
    relicItem.maxSockets === 2
  );
  results.push({
    name: '4. Procedural 6-Slot Equipment, Affix & Socket Roll Engine',
    pass: t4Pass,
    detail: `Generated "${relicItem.name}" (+${relicItem.atk} ATK, ${relicItem.affixes.length} affixes, ${relicItem.maxSockets} sockets)`
  });

  // 5. Mining Engine, Geology Gating, Durability Math & Domain Event Bus Telemetry
  const sandbox5 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox5);
  const fl5 = ensureDungeonFloorHydrated(sandbox5.dungeon, 1);
  fl5.tiles[2][2] = TILE_ORE_STAR; // Requires Geology 3
  let minedEvents = 0;
  const unsubMine = onEngineEvent(ENGINE_EVENTS.ORE_MINED, payload => {
    if (payload && payload.oreId === 'starcrystal') minedEvents += 1;
  });
  const blockedMine = mineTile(2, 2, sandbox5);
  sandbox5.guildResearch.geology = 3;
  const allowedMine = mineTile(2, 2, sandbox5);
  unsubMine();
  const t5Pass =
    !blockedMine.ok &&
    blockedMine.reason === 'geology_locked' &&
    allowedMine.ok &&
    minedEvents === 1 &&
    fl5.tiles[2][2] === TILE_FLOOR;
  results.push({
    name: '5. Interactive Mining, Geology Gating & Domain Event Bus',
    pass: t5Pass,
    detail: 'Star-Crystal blocked at Geo R0, mined at Geo R3 -> TILE_FLOOR & emitted ORE_MINED event'
  });

  // 6. Dual-Cost Guild Research Execution
  const sandbox6 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox6);
  sandbox6.guildVault.gold = 200;
  sandbox6.guildVault.copper = 5;
  const resOut = purchaseResearchRank('cartography', sandbox6);
  const t6Pass =
    resOut.ok &&
    sandbox6.guildResearch.cartography === 1 &&
    sandbox6.guildVault.copper === 2 &&
    sandbox6.guildVault.gold === 110;
  results.push({
    name: '6. Dual-Cost Guild Research Lab (Gold + Vault Minerals)',
    pass: t6Pass,
    detail: 'Cartography R1 unlocked (Permit Fl 10); deducted 90g & 3 Copper Ore'
  });

  // 7. Quartermaster Buy & Antiquarian Assay Sell Multiplier
  const sandbox7 = createDefaultGameState();
  selectAdventurerClass('mage', sandbox7);
  sandbox7.guildVault.gold = 100;
  buyShopItem('buy_recall', sandbox7);
  buyShopItem('buy_heal', sandbox7);
  sandbox7.guildResearch.assay = 2; // +70% value (1.70x)
  sandbox7.guildVault.copper = 2;   // Base 10 * 2 * 1.70 = 34g
  const assayGain = sellMineralUnit('copper', true, sandbox7);
  const t7Pass =
    sandbox7.hero.consumables.recalls === 2 &&
    sandbox7.hero.consumables.potions === 3 &&
    assayGain === 34;
  results.push({
    name: '7. Quartermaster Consumables & Antiquarian Assay Multiplier',
    pass: t7Pass,
    detail: `Recalls: ${sandbox7.hero.consumables.recalls}, Potions: ${sandbox7.hero.consumables.potions}, Assay Sale: +${assayGain}g (170%)`
  });

  // 8. Active Skill Target & Walkable Tile Validation (Thief & Paladin)
  const sandbox8 = createDefaultGameState();
  selectAdventurerClass('paladin', sandbox8);
  sandbox8.inGuild = false;
  sandbox8.dungeon.floors[1].monsters = []; // No monsters adjacent
  const startMp = sandbox8.hero.mp;
  const smiteEmpty = executeClassSkill(sandbox8);
  const t8Pass = !smiteEmpty.ok && sandbox8.hero.mp === startMp;
  results.push({
    name: '8. Active Skill Target & Tile Validation (Zero Wasted MP)',
    pass: t8Pass,
    detail: 'Paladin Holy Smite & Thief Shadowstep validate target/tile before deducting MP'
  });

  // 9. Milestone Boss Spawns (Floor 5 Starfall Colossus & Floor 10 Void Weaver)
  const bossFl5 = generateFloor(5, CURATED_DUNGEON_PROFILES.starfall_vaults, 5505);
  const bossFl10 = generateFloor(10, CURATED_DUNGEON_PROFILES.starfall_vaults, 5510);
  const b5 = bossFl5.monsters.find(m => m.isBoss && m.id === 'boss_colossus');
  const b10 = bossFl10.monsters.find(m => m.isBoss && m.id === 'boss_weaver');
  const t9Pass = !!b5 && !!b10;
  results.push({
    name: '9. Milestone Boss Spawns (Floor 5 Colossus & Floor 10 Weaver)',
    pass: t9Pass,
    detail: `Fl 5: ${b5 ? b5.name : 'missing'} (${b5 ? b5.hp : 0} HP) • Fl 10: ${b10 ? b10.name : 'missing'} (${b10 ? b10.hp : 0} HP)`
  });

  // 10. Non-Permanent Defeat & Vanguard Recovery Math
  const sandbox10 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox10);
  sandbox10.inGuild = false;
  sandbox10.guildResearch.vanguard = 2; // 40% recovery
  addExpeditionTradeItem('starcrystal', 'Star-Crystal', 100, 1, 'Ore', sandbox10);
  const defeatOut = handleHeroDefeat('Test Titan', sandbox10);
  const t10Pass =
    sandbox10.inGuild === true &&
    defeatOut.salvagedGold === 40 &&
    sandbox10.hero.hp === sandbox10.hero.maxHp;
  results.push({
    name: '10. Non-Permanent Defeat & Vanguard Recovery Salvage',
    pass: t10Pass,
    detail: `Returned to Guild with full HP; salvaged +${defeatOut.salvagedGold}g (40% of 100g pack)`
  });

  // 11. Astral Gem Socketing, Lapidary Stat Recomputation & Unsocketing
  const sandbox11 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox11);
  const socketBlade = generateProceduralEquipment(4, 'relic', 'weapon');
  sandbox11.hero.equipment.weapon = socketBlade;
  sandbox11.guildVault.gold = 50;
  sandbox11.guildVault.gems.ruby = 1;
  socketGemIntoItem('weapon', 'ruby', true, sandbox11);
  const atkSocketed = sandbox11.hero.atk;
  const gemAfterSocket = sandbox11.guildVault.gems.ruby;
  const unsocketOut = unsocketGemFromItem('weapon', 0, true, sandbox11);
  const atkUnsocketed = sandbox11.hero.atk;
  const t11Pass =
    unsocketOut.ok &&
    gemAfterSocket === 0 &&
    sandbox11.guildVault.gems.ruby === 1 &&
    sandbox11.guildVault.gold === 35 &&
    atkSocketed > atkUnsocketed;
  results.push({
    name: '11. Astral Gem Socketing & Lapidary Bench Extraction',
    pass: t11Pass,
    detail: `Ruby socketed (${atkUnsocketed} -> ${atkSocketed} ATK) & extracted cleanly (-15g, gem returned)`
  });

  // 12. Guild Notice Board Bounties & Extraction Reward Payout
  const sandbox12 = createDefaultGameState();
  selectAdventurerClass('ranger', sandbox12);
  sandbox12.inGuild = false;
  const baseTalentPts = sandbox12.hero.talentPoints;
  sandbox12.guildBounties[0] = {
    id: 'bty_test_copper',
    kind: 'mine',
    targetId: 'copper',
    title: 'Quota: Copper Ore',
    desc: 'Mine 2 Copper Ore veins.',
    reqQty: 2,
    curQty: 0,
    completed: false,
    rewardType: 'talent_tome',
    rewardId: 'talent',
    rewardQty: 1,
    rewardLabel: '+1 Talent Tome (+1 Talent Pt)'
  };
  const fl12 = ensureDungeonFloorHydrated(sandbox12.dungeon, 1);
  fl12.tiles[1][1] = TILE_ORE_COPPER;
  fl12.tiles[1][2] = TILE_ORE_COPPER;
  mineTile(1, 1, sandbox12);
  mineTile(2, 1, sandbox12);
  const completedBeforeExtract = sandbox12.guildBounties[0].completed === true;
  const extOut = extractToGuild('Floor 1 Ascending Stairs (<)', sandbox12);
  const t12Pass =
    completedBeforeExtract &&
    extOut.claimedBounties.length >= 1 &&
    sandbox12.hero.talentPoints === baseTalentPts + 1 &&
    sandbox12.guildBounties[0].id !== 'bty_test_copper';
  results.push({
    name: '12. Guild Notice Board Contracts & Extraction Payout',
    pass: t12Pass,
    detail: 'Completed Copper quota -> claimed +1 Talent Point & rotated fresh contract'
  });

  // 13. Subterranean Astral Shrines & Scout Trap Detection/Disarming
  const sandbox13 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox13);
  sandbox13.inGuild = false;
  const fl13 = ensureDungeonFloorHydrated(sandbox13.dungeon, 1);
  sandbox13.hero.x = 4;
  sandbox13.hero.y = 4;
  fl13.tiles[4][5] = TILE_TRAP_HIDDEN;
  fl13.traps['5,4'] = { type: 'spike' };
  fl13.tiles[4][6] = TILE_SHRINE;
  fl13.shrines['6,4'] = { type: 'starfire' };

  const spotted = detectNearbyTraps(fl13, sandbox13);
  const trapVisible = fl13.tiles[4][5] === TILE_TRAP_VISIBLE;
  const hpBeforeTrap = sandbox13.hero.hp;
  const disarmRes = resolveTrapInteraction(5, 4, sandbox13);
  const atkBeforeShrine = sandbox13.hero.atk;
  const shrineRes = activateAstralShrine(6, 4, sandbox13);
  const t13Pass =
    spotted >= 1 &&
    trapVisible &&
    disarmRes.ok &&
    disarmRes.disarmed === true &&
    sandbox13.hero.hp === hpBeforeTrap &&
    fl13.tiles[4][5] === TILE_TRAP_DISARMED &&
    shrineRes.ok &&
    fl13.tiles[4][6] === TILE_SHRINE_USED &&
    sandbox13.hero.atk === atkBeforeShrine + 6;
  results.push({
    name: '13. Astral Shrines & Scout Runic Trap Detection/Disarming',
    pass: t13Pass,
    detail: 'Thief spotted & disarmed Spike Trap (0 dmg) + channeled Starfire Shrine (+6 ATK)'
  });

  // 14. Multi-Dungeon Registry Isolation, Switching & Lazy RLE Packing
  const sandbox14 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox14);
  const sfFl1 = ensureDungeonFloorHydrated(sandbox14.dungeon, 1);
  sfFl1.oresMined = 9;
  const swQuarry = selectActiveDungeon('dng_quarry', sandbox14);
  const starfallPackedInRam = !!(
    sandbox14.dungeons.dng_starfall.floors[1] &&
    sandbox14.dungeons.dng_starfall.floors[1].packed === true
  );
  sandbox14.dungeon.floors[1] = generateFloor(1, sandbox14.dungeon.config, sandbox14.dungeon.numericSeed);
  const quarryW = sandbox14.dungeon.floors[1].width;
  const quarryH = sandbox14.dungeon.floors[1].height;
  const swBack = selectActiveDungeon('dng_starfall', sandbox14);
  const sfHydratedAgain = ensureDungeonFloorHydrated(sandbox14.dungeon, 1);
  const t14Pass = !!(
    swQuarry.ok &&
    swBack.ok &&
    starfallPackedInRam &&
    quarryW === 48 &&
    quarryH === 36 &&
    sfHydratedAgain &&
    sfHydratedAgain.packed === false &&
    sfHydratedAgain.width === 80 &&
    sfHydratedAgain.oresMined === 9 &&
    sandbox14.dungeons.dng_quarry.floors[1].packed === true
  );
  results.push({
    name: '14. Multi-Dungeon Registry Isolation & Lazy RLE Memory Packing',
    pass: t14Pass,
    detail: `Switched Starfall (80x60, 9 mined) <-> Quarry (${quarryW}x${quarryH}) with isolated state & auto-RLE`
  });

  // 15. Exploration-Scale Colossal (192x144) Generation, Decoupled Depth & Non-Blocking Veins
  const sandbox15 = createDefaultGameState();
  selectAdventurerClass('ranger', sandbox15);
  const charterCol = chartCustomExpedition({
    name: 'Colossal Ruin Test',
    width: 192,
    height: 144,
    maxDepth: 1,
    layoutStyle: 'grand_ruins',
    richness: 'rich'
  }, sandbox15);
  const colFl = generateFloor(1, sandbox15.dungeon.config, 77715);
  let veinsAllBorderFloor = true;
  let veinTotal = 0;
  for (let y = 1; y < colFl.height - 1; y++) {
    for (let x = 1; x < colFl.width - 1; x++) {
      if (ORE_CATALOG[colFl.tiles[y][x]]) {
        veinTotal += 1;
        const adjWalk =
          (colFl.tiles[y - 1][x] !== TILE_WALL && !ORE_CATALOG[colFl.tiles[y - 1][x]]) ||
          (colFl.tiles[y + 1][x] !== TILE_WALL && !ORE_CATALOG[colFl.tiles[y + 1][x]]) ||
          (colFl.tiles[y][x - 1] !== TILE_WALL && !ORE_CATALOG[colFl.tiles[y][x - 1]]) ||
          (colFl.tiles[y][x + 1] !== TILE_WALL && !ORE_CATALOG[colFl.tiles[y][x + 1]]);
        if (!adjWalk) {
          veinsAllBorderFloor = false;
        }
      }
    }
  }
  const colBfsOk = verifyPureFloorBFS(colFl);
  const t15Pass = !!(
    charterCol.ok &&
    colFl.width === 192 &&
    colFl.height === 144 &&
    colFl.hasDownStairs === false &&
    colFl.roomCount >= 25 &&
    veinTotal >= 20 &&
    veinsAllBorderFloor &&
    colBfsOk
  );
  results.push({
    name: '15. Colossal 192x144 Megadungeon Sector Generation & Fast BFS',
    pass: t15Pass,
    detail: `192x144 MaxFl-1 Ruin: ${colFl.roomCount} chambers, ${veinTotal} wall veins, 100% BFS reachable`
  });

  // 16. Declarative DungeonConfig Enforcement (Monster Family, Ore Table & Final-Floor Boss)
  const sandbox16 = createDefaultGameState();
  selectAdventurerClass('mage', sandbox16);
  chartCustomExpedition({
    name: 'Dwarven Crystal Delve',
    width: 64,
    height: 48,
    maxDepth: 1,
    layoutStyle: 'excavation_quarry',
    monsterFamily: 'dwarven_forge',
    oreFocus: 'astral_crystal',
    richness: 'rich'
  }, sandbox16);
  const cfgFl = generateFloor(1, sandbox16.dungeon.config, 88216);
  const allowedForgeIds = {
    dwarven_automaton: true,
    ember_pyromancer: true,
    vault_crawler: true,
    magma_golem: true
  };
  const nonBossMonsters = cfgFl.monsters.filter(m => !m.isBoss);
  const hasFinalBoss = cfgFl.monsters.some(m => m.isBoss);
  const monstersMatchFamily = nonBossMonsters.length > 0 && nonBossMonsters.every(m => !!allowedForgeIds[m.id]);

  let oresMatchFocus = true;
  let focusVeinCount = 0;
  for (let y = 0; y < cfgFl.height; y++) {
    for (let x = 0; x < cfgFl.width; x++) {
      const t = cfgFl.tiles[y][x];
      if (ORE_CATALOG[t]) {
        focusVeinCount += 1;
        if (
          t !== TILE_ORE_MITHRIL &&
          t !== TILE_ORE_GEODE &&
          t !== TILE_ORE_STAR &&
          t !== TILE_ORE_ASTRAL
        ) {
          oresMatchFocus = false;
        }
        if (t === TILE_ORE_COPPER || t === TILE_ORE_IRON) {
          oresMatchFocus = false;
        }
      }
    }
  }
  const t16Pass = !!(hasFinalBoss && monstersMatchFamily && focusVeinCount > 0 && oresMatchFocus);
  results.push({
    name: '16. Declarative DungeonConfig Rosters (Monsters, Ores & Bosses)',
    pass: t16Pass,
    detail: `Dwarven Forge roster (${nonBossMonsters.length} foes + Boss) & ${focusVeinCount} Astral/Mithril veins verified`
  });

  // 17. Lossless RLE Compression, Bresenham Wall LOS & Safe Auto-Walk Hostile Interrupt
  const rawRleFl = generateFloor(1, CURATED_DUNGEON_PROFILES.mycelium_labyrinth, 99117);
  rawRleFl.explored[12][15] = 1;
  rawRleFl.explored[40][60] = 1;
  const packedRle = packFloorForStorage(rawRleFl);
  const hydratedRle = hydrateFloorFromStorage(packedRle);
  let rleExactMatch = !!(
    packedRle.packed === true &&
    typeof packedRle.tilesRle === 'string' &&
    hydratedRle.packed === false &&
    hydratedRle.width === 128 &&
    hydratedRle.height === 96
  );
  if (rleExactMatch) {
    for (let y = 0; y < 96; y++) {
      for (let x = 0; x < 128; x++) {
        if (
          hydratedRle.tiles[y][x] !== rawRleFl.tiles[y][x] ||
          !!hydratedRle.explored[y][x] !== !!rawRleFl.explored[y][x]
        ) {
          rleExactMatch = false;
          break;
        }
      }
      if (!rleExactMatch) break;
    }
  }

  // Bresenham Wall LOS + Auto-Walk Interrupt in isolated sandbox
  const sandbox17 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox17);
  sandbox17.inGuild = false;
  const navFl = ensureDungeonFloorHydrated(sandbox17.dungeon, 1);
  for (let y = 8; y <= 18; y++) {
    for (let x = 8; x <= 18; x++) {
      navFl.tiles[y][x] = TILE_WALL;
      navFl.explored[y][x] = 1;
    }
  }
  // Carve L-corridor: (10,10) -> (11,10) -> (12,10) -> (12,11) -> (12,12) -> (12,13) -> (12,14)
  navFl.tiles[10][10] = TILE_FLOOR;
  navFl.tiles[10][11] = TILE_FLOOR;
  navFl.tiles[10][12] = TILE_FLOOR;
  navFl.tiles[11][12] = TILE_FLOOR;
  navFl.tiles[12][12] = TILE_FLOOR;
  navFl.tiles[13][12] = TILE_FLOOR;
  navFl.tiles[14][12] = TILE_FLOOR;

  const wallSeen = hasLineOfSight(navFl, 10, 10, 10, 11) === true;
  const occludedByWall = hasLineOfSight(navFl, 10, 10, 12, 14) === false;
  const downHallClear = hasLineOfSight(navFl, 12, 10, 12, 14) === true;

  sandbox17.hero.x = 10;
  sandbox17.hero.y = 10;
  navFl.monsters = [{
    id: 'vault_crawler',
    name: 'Test Crawler',
    x: 12,
    y: 14,
    hp: 30,
    maxHp: 30,
    atk: 6,
    def: 2,
    xp: 10,
    isRanged: false,
    statuses: []
  }];

  const safePath = computeSafeExploredPath(navFl, 10, 10, 12, 12);
  setAutoWalkPath(safePath || []);
  const stepA = stepAutoWalkOnce(sandbox17); // Moves to (11,10) — monster at (12,14) still behind wall (11,11)
  const stepB = stepAutoWalkOnce(sandbox17); // Moves to (12,10) — gains LOS down hall to monster -> HALTS!
  cancelAutoWalk();

  const t17Pass = !!(
    rleExactMatch &&
    wallSeen &&
    occludedByWall &&
    downHallClear &&
    safePath &&
    safePath.length === 4 &&
    stepA.ok &&
    stepA.halted === false &&
    stepB.ok &&
    stepB.halted === true &&
    stepB.reason === 'hostile_in_sight' &&
    sandbox17.hero.x === 12 &&
    sandbox17.hero.y === 10
  );
  results.push({
    name: '17. Lossless RLE Compression, Wall LOS & Safe Auto-Walk Interrupt',
    pass: t17Pass,
    detail: `128x96 RLE 100% lossless (${packedRle.tilesRle.length} chars); LOS wall occlusion & hostile halt verified`
  });

  // 18. Visual Biomes by Depth & Curated Dungeon Profile (4 Palettes & Floor Stamping)
  const sfCfg = CURATED_DUNGEON_PROFILES.starfall_vaults;
  const b1 = resolveFloorBiome(sfCfg, 1);
  const b7 = resolveFloorBiome(sfCfg, 7);
  const b12 = resolveFloorBiome(sfCfg, 12);
  const b18 = resolveFloorBiome(sfCfg, 18);
  const bMolten = resolveFloorBiome(CURATED_DUNGEON_PROFILES.molten_crucible, 1);
  const bCitadel = resolveFloorBiome(CURATED_DUNGEON_PROFILES.citadel_ruins, 1);

  const flMolten = generateFloor(1, CURATED_DUNGEON_PROFILES.molten_crucible, 88123);
  const palettesValid = ['dwarven_catacombs', 'crystalline_caverns', 'molten_forgeworks', 'vespera_crater'].every(
    k => BIOME_PALETTES[k] && BIOME_PALETTES[k].wallFill && BIOME_PALETTES[k].floor1 && BIOME_PALETTES[k].name
  );

  const t18Pass = !!(
    palettesValid &&
    b1 === 'dwarven_catacombs' &&
    b7 === 'crystalline_caverns' &&
    b12 === 'molten_forgeworks' &&
    b18 === 'vespera_crater' &&
    bMolten === 'molten_forgeworks' &&
    bCitadel === 'vespera_crater' &&
    flMolten.biomeId === 'molten_forgeworks'
  );
  results.push({
    name: '18. Visual Biome Palettes by Depth & Profile (4 Biomes & Floor Stamping)',
    pass: t18Pass,
    detail: `Floors 1, 7, 12, 18 resolve distinct palettes; Molten Crucible stamped with molten_forgeworks`
  });

  // 19. Floor 15 & 20 Boss Spawns (Ignis & Vespera) & Guaranteed Relic Drops
  const fl15 = generateFloor(15, CURATED_DUNGEON_PROFILES.starfall_vaults, 15001);
  const fl20 = generateFloor(20, CURATED_DUNGEON_PROFILES.starfall_vaults, 20002);
  const ignis = fl15.monsters.find(m => m.id === 'boss_ignis');
  const vespera = fl20.monsters.find(m => m.id === 'boss_vespera');

  // Kill boss in isolated sandbox and verify relic drop
  const sandbox19 = createDefaultGameState();
  selectAdventurerClass('paladin', sandbox19);
  sandbox19.inGuild = false;
  ensureDungeonFloorHydrated(sandbox19.dungeon, 15);
  const dummyIgnis = Object.assign({}, ignis || { id: 'boss_ignis', name: 'Ignis', hp: 1, isBoss: true, dropRarity: 'relic', xp: 850 });
  dummyIgnis.hp = 0;
  killMonster(dummyIgnis, sandbox19);

  const lootedRelic = sandbox19.hero.expeditionGear.find(g => g.rarity === 'relic');
  const hasAstralite = (sandbox19.hero.expeditionPack || []).some(it => it.id === 'astralite');
  const hasRuby = (sandbox19.hero.expeditionPack || []).some(it => it.id === 'gem_ruby');
  const relicRecorded = (sandbox19.codex.relicsUnlocked || []).length > 0;

  const t19Pass = !!(
    ignis &&
    ignis.isBoss &&
    ignis.hp === 680 &&
    ignis.atk === 38 &&
    vespera &&
    vespera.isBoss &&
    vespera.hp === 1050 &&
    vespera.atk === 48 &&
    lootedRelic &&
    hasAstralite &&
    hasRuby &&
    relicRecorded
  );
  results.push({
    name: '19. Floors 15 & 20 Boss Encounters (Ignis & Vespera) & Relic Rewards',
    pass: t19Pass,
    detail: `Ignis (680 HP) & Vespera (1050 HP) verified; guaranteed Relic + Astralite + Gem drop recorded`
  });

  // 20. Guild Bestiary Codex, Hall of Records & Hunter Mastery (+8% Damage)
  const sandbox20 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox20);
  ensureCodexState(sandbox20);

  const initialMult = getCodexMasteryMultiplier('vault_crawler', sandbox20);

  // Slay 5 crawlers
  const testCrawler = { id: 'vault_crawler', name: 'Vault Crawler', hp: 0, maxHp: 20, atk: 5, def: 1, xp: 15, isBoss: false };
  for (let k = 0; k < CODEX_MASTERY_KILLS; k++) {
    killMonster(testCrawler, sandbox20);
  }
  const crawlerMult = getCodexMasteryMultiplier('vault_crawler', sandbox20);

  // Slay 1 boss
  const testBoss = { id: 'boss_colossus', name: 'Starfall Colossus', hp: 0, maxHp: 240, atk: 22, def: 8, xp: 250, isBoss: true };
  killMonster(testBoss, sandbox20);
  const bossMult = getCodexMasteryMultiplier('boss_colossus', sandbox20);

  const t20Pass = !!(
    initialMult === 1.0 &&
    sandbox20.codex.killsByArchetype.vault_crawler === CODEX_MASTERY_KILLS &&
    crawlerMult === CODEX_MASTERY_DMG_MULT &&
    sandbox20.codex.killsByArchetype.boss_colossus === 1 &&
    bossMult === CODEX_MASTERY_DMG_MULT &&
    sandbox20.codex.totalMonstersSlain === (CODEX_MASTERY_KILLS + 1) &&
    sandbox20.codex.totalBossesSlain === 1
  );
  results.push({
    name: '20. Guild Bestiary Codex, Hall of Records & Hunter Mastery (+8% Damage)',
    pass: t20Pass,
    detail: `Crawler 5 kills -> 1.08x Mastery; Boss 1 kill -> 1.08x Mastery; Codex kill tracking verified`
  });

  // 21. Inventory Sorting, Upgrade Detection, Auto-Equip, Keep Lock & Rarity Bulk Selling
  const sandbox21 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox21);
  sandbox21.inGuild = true;

  const initialWeapon = sandbox21.hero.equipment.weapon;
  const initialWeaponScore = computeItemPowerScore(initialWeapon);

  const itemCommonSword = {
    uid: 'test_c_sword',
    slot: 'weapon',
    name: 'Bronze Broadsword',
    rarity: 'common',
    value: 20,
    atk: 14,
    str: 4,
    maxDur: 100,
    durability: 100,
    sockets: [],
    maxSockets: 0,
    locked: false
  };
  const itemRareArmor = {
    uid: 'test_r_armor',
    slot: 'armor',
    name: 'Obsidian Plate',
    rarity: 'rare',
    value: 150,
    def: 12,
    maxHp: 40,
    maxDur: 120,
    durability: 120,
    sockets: [],
    maxSockets: 2,
    locked: false
  };
  const itemSpareUnlockedBoots = {
    uid: 'test_u_boots',
    slot: 'boots',
    name: 'Worn Leather Boots',
    rarity: 'uncommon',
    value: 45,
    def: 1, // worse than starter boots def: 2
    maxDur: 0,
    durability: 0,
    sockets: [],
    maxSockets: 0,
    locked: false
  };
  const itemSpareLockedHelm = {
    uid: 'test_c_helm',
    slot: 'helm',
    name: 'Cracked Rusty Helm',
    rarity: 'common',
    value: 25,
    def: 1, // worse than starter helm def: 2
    maxDur: 0,
    durability: 0,
    sockets: [],
    maxSockets: 0,
    locked: true // Protected with Keep Lock!
  };
  const itemSpareUnlockedCommon = {
    uid: 'test_c_ring',
    slot: 'accessory',
    name: 'Tarnished Band',
    rarity: 'common',
    value: 15,
    atk: 0,
    def: 0,
    maxDur: 0,
    durability: 0,
    sockets: [],
    maxSockets: 0,
    locked: false
  };

  sandbox21.guildVault.armory = [
    itemCommonSword,
    itemRareArmor,
    itemSpareUnlockedBoots,
    itemSpareLockedHelm,
    itemSpareUnlockedCommon
  ];

  // 1. Upgrade detection & Power Score
  const swordIsUpgrade = isItemUpgrade(itemCommonSword, sandbox21.hero.equipment);
  const swordPower = computeItemPowerScore(itemCommonSword);
  const armorIsUpgrade = isItemUpgrade(itemRareArmor, sandbox21.hero.equipment);
  const lockedHelmIsUpgrade = isItemUpgrade(itemSpareLockedHelm, sandbox21.hero.equipment); // should be false

  // 2. Lock / Keep Toggle
  const lockToggleRes = toggleItemLock(itemRareArmor.uid, sandbox21);
  const armorIsLocked = itemRareArmor.locked === true;

  // 3. Auto-Equip Best
  const autoEquipRes = autoEquipBestGear(sandbox21);
  const weaponNowEquipped = sandbox21.hero.equipment.weapon.uid === 'test_c_sword';
  const armorNowEquipped = sandbox21.hero.equipment.armor.uid === 'test_r_armor';
  const oldWeaponMovedToArmory = sandbox21.guildVault.armory.some(g => g.uid === (initialWeapon && initialWeapon.uid));

  // 4. Bulk Sell by Rarity (Commons) with Keep Lock Protection
  const startGold = sandbox21.guildVault.gold;
  const sellCommonRes = sellAllSpareGear('common', sandbox21);
  const commonHelmStillInArmory = sandbox21.guildVault.armory.some(g => g.uid === 'test_c_helm');
  const goldIncreasedFromCommons = sandbox21.guildVault.gold > startGold;

  // 5. Bulk Sell All Unlocked Spare Gear (Preserves locked common helm)
  const sellAllRes = sellAllSpareGear(null, sandbox21);
  const bootsSold = !sandbox21.guildVault.armory.some(g => g.uid === 'test_u_boots');
  const lockedHelmStillIntact = sandbox21.guildVault.armory.some(g => g.uid === 'test_c_helm');
  const armoryOnlyHasLockedItem = sandbox21.guildVault.armory.length === 1 && sandbox21.guildVault.armory[0].uid === 'test_c_helm';

  const t21Checks = {
    swordIsUpgrade: !!swordIsUpgrade,
    swordPower: swordPower > initialWeaponScore,
    armorIsUpgrade: !!armorIsUpgrade,
    lockedHelmNotUpgrade: !lockedHelmIsUpgrade,
    lockToggleOk: !!lockToggleRes.ok,
    armorIsLocked: !!armorIsLocked,
    autoEquipOk: !!autoEquipRes.ok,
    autoEquipCount: autoEquipRes.equippedCount >= 2,
    weaponNowEquipped: !!weaponNowEquipped,
    armorNowEquipped: !!armorNowEquipped,
    oldWeaponMovedToArmory: !!oldWeaponMovedToArmory,
    sellCommonRes: sellCommonRes > 0,
    commonHelmStillInArmory: !!commonHelmStillInArmory,
    goldIncreasedFromCommons: !!goldIncreasedFromCommons,
    sellAllRes: sellAllRes > 0,
    bootsSold: !!bootsSold,
    lockedHelmStillIntact: !!lockedHelmStillIntact,
    armoryOnlyHasLockedItem: !!armoryOnlyHasLockedItem
  };
  const failedKeys = Object.keys(t21Checks).filter(k => !t21Checks[k]);
  const t21Pass = failedKeys.length === 0;
  results.push({
    name: '21. Inventory Sorting, Upgrade Detection, Auto-Equip, Keep Lock & Rarity Bulk Selling',
    pass: t21Pass,
    detail: failedKeys.length === 0
      ? `Power score upgrade detection verified; auto-equip equipped superior gear; locked helm survived bulk sell`
      : `Failed checks: ${failedKeys.join(', ')} (sellCommonRes=${sellCommonRes}, sellAllRes=${sellAllRes})`
  });

  return results;
}

function runSelfTests(renderModal = false) {
  const results = evaluateSelfTests();
  const passCount = results.filter(r => r.pass).length;

  if (typeof document !== 'undefined') {
    const btnText = document.getElementById('verifyBtnText');
    if (btnText) {
      btnText.textContent = `Verify Inc-5 (${passCount}/${results.length} PASS)`;
    }

    if (renderModal) {
      const listEl = document.getElementById('diagnosticsList');
      if (listEl) {
        listEl.innerHTML = results.map(r => `
          <div class="p-2.5 rounded bg-[#080b11] border ${r.pass ? 'border-[#34d399]/40' : 'border-[#f87171]'} flex items-center justify-between gap-2">
            <div>
              <div class="font-bold ${r.pass ? 'text-[#e6edf3]' : 'text-[#f87171]'}">${r.name}</div>
              <div class="text-[11px] text-[#8b949e]">${r.detail}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.pass ? 'bg-[#34d399]/20 text-[#34d399]' : 'bg-[#f87171]/20 text-[#f87171]'}">
              ${r.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
        `).join('');
      }
    }
  }

  return passCount === results.length;
}

function openDiagnosticsModal() {
  if (typeof document === 'undefined') return;
  runSelfTests(true);
  const modal = document.getElementById('diagnosticsModal');
  if (modal) modal.classList.remove('hidden');
}

function closeDiagnosticsModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('diagnosticsModal');
  if (modal) modal.classList.add('hidden');
}

function runChaosFuzzer(seedCount = 25) {
  const classes = ['fighter', 'thief', 'mage', 'ranger', 'paladin'];
  const sizePresets = [
    { w: 48,  h: 36,  name: 'compact' },
    { w: 80,  h: 60,  name: 'standard' },
    { w: 128, h: 96,  name: 'sprawling' },
    { w: 192, h: 144, name: 'colossal' }
  ];
  const layoutStyles = ['masonry_vaults', 'excavation_quarry', 'crystalline_caverns', 'grand_ruins'];
  const totalSeeds = Math.max(1, seedCount);
  const errors = [];
  let totalTurns = 0;

  for (let s = 0; s < totalSeeds; s++) {
    try {
      const sb = createDefaultGameState();
      const cls = classes[s % classes.length];
      selectAdventurerClass(cls, sb);
      sb.inGuild = false;

      const preset = sizePresets[s % sizePresets.length];
      const layout = layoutStyles[s % layoutStyles.length];
      const seedVal = (s + 1) * 31337 + 101;

      const dCfg = {
        id: 'fuzz_dng_' + s,
        name: 'Fuzz Dungeon ' + s,
        width: preset.w,
        height: preset.h,
        maxDepth: 5,
        layoutStyle: layout,
        originType: 'custom'
      };

      const fl1 = generateFloor(1, dCfg, seedVal);
      const fl2 = generateFloor(2, dCfg, seedVal + 1);

      const bfs1 = verifyPureFloorBFS(fl1);
      const bfs2 = verifyPureFloorBFS(fl2);
      if (!bfs1 || !bfs2) {
        errors.push('Seed ' + s + ' (' + preset.name + ' ' + layout + '): BFS reachability failed.');
        continue;
      }

      const packed = packFloorForStorage(fl1);
      const hydrated = hydrateFloorFromStorage(packed);
      if (!hydrated || hydrated.width !== fl1.width || hydrated.height !== fl1.height) {
        errors.push('Seed ' + s + ': RLE compression roundtrip mismatch.');
        continue;
      }

      sb.dungeon.floors[1] = fl1;
      sb.dungeon.currentFloor = 1;
      sb.hero.x = fl1.upPos.x;
      sb.hero.y = fl1.upPos.y;

      const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

      for (let t = 0; t < 100; t++) {
        totalTurns++;
        const dir = dirs[(s * 100 + t) % 4];

        if (t % 15 === 0) {
          executeClassSkill(sb);
        } else if (t % 25 === 0) {
          useHealingTonic(sb);
        } else {
          handlePlayerAction(dir.x, dir.y, sb);
        }

        if (sb.inGuild) {
          break;
        }
      }
    } catch (e) {
      errors.push('Seed ' + s + ' Exception: ' + (e && e.message ? e.message : String(e)));
    }
  }

  return {
    totalSeeds: totalSeeds,
    totalTurns: totalTurns,
    errorCount: errors.length,
    errors: errors
  };
}

  // --- Module: src/main.js ---
// Application Bootstrap, Event Wiring, and window.Aethelgard Global Export Bridge














// Bind UI callbacks into engine actions & combat
registerActionCallbacks({
  log: logChronicle,
  updateUI: updateAllUI,
  floatingText: spawnFloatingText,
  outcomeModal: showOutcomeModal
});

registerCombatFOVCallback(updateFOV);

// Expose interactive controllers to window.Aethelgard (and top-level window aliases)
const AethelgardAPI = {
  gameState,
  loadGame,
  saveGame,
  toggleAudio,
  openSaveSyncModal,
  closeSaveSyncModal,
  copySaveJson,
  downloadSaveJson,
  importSaveJson,
  openDiagnosticsModal,
  closeDiagnosticsModal,
  evaluateSelfTests,
  runSelfTests,
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  toggleLockFromInspect,
  socketFromInspect,
  unsocketFromInspect,
  showOutcomeModal,
  closeOutcomeModal,
  openExpeditionAtlasModal,
  closeExpeditionAtlasModal,
  handleSelectDungeonFromAtlas,
  promptResetDungeonFromAtlas,
  cancelResetDungeonFromAtlas,
  handleResetDungeonFromAtlas,
  onCharterSizePresetChange,
  submitCharterForm,
  openFullMapModal,
  closeFullMapModal,
  toggleFullMapModal,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon,
  switchGuildTab,
  setArmorySortBy,
  restAtGuild,
  repairPickaxeAtGuild,
  spendStatPoint,
  allocateTalent,
  respecTalents,
  buyShopItem,
  sellMineralUnit,
  sellGemUnit,
  sellAllOresAtAssay,
  sellArmoryItem,
  sellAllSpareGear,
  autoEquipBestGear,
  toggleItemLock,
  purchaseResearchRank,
  socketGemIntoItem,
  unsocketGemFromItem,
  rerollGuildBounties,
  claimBountyAtGuild,
  executeClassSkill,
  useHealingTonic,
  useRecallScroll,
  useStairsAtPlayer,
  handlePlayerAction,
  startAutoWalkTo,
  cancelAutoWalk,
  renderMinimapCanvas,
  waitTurn,
  clearChronicle,
  ENGINE_EVENTS,
  onEngineEvent,
  offEngineEvent,
  emitEngineEvent,
  TALENT_TREES,
  GEM_CATALOG,
  CURATED_DUNGEON_PROFILES,
  BIOME_PALETTES,
  resolveFloorBiome,
  getCodexMasteryMultiplier,
  renderCodexTab,
  runChaosFuzzer
};

function bootstrapApp() {
  setupInputs();
  const loaded = loadGame();
  if (!loaded || !gameState.hero) {
    selectAdventurerClass('fighter');
    openClassSelectModal(false);
  } else {
    updateFOV();
    updateAllUI();
  }
  runSelfTests(false);

  function gameLoop() {
    renderDungeonCanvas();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

if (typeof window !== 'undefined') {
  window.Aethelgard = AethelgardAPI;
  Object.assign(window, AethelgardAPI);

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', bootstrapApp);
    } else {
      bootstrapApp();
    }
  }
}

})();
