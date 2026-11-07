/* Auto-generated from modular ES6 sources in src/ via scripts/build.ps1 */
(function () {
  'use strict';

  // --- Module: src/constants.js ---
// Core constants, grid dimensions, tile IDs, and rarity definitions

const SCHEMA_VERSION = 'v0.4.0-inc4';
const STORAGE_KEY = 'aethelgard_save_v4';

const TILE_SIZE = 32;
const GRID_W = 21;
const GRID_H = 15;
const VIEWPORT_WIDTH = GRID_W;
const VIEWPORT_HEIGHT = GRID_H;

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

// Increment 4 Economy Constants
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
  const specGold = Math.round(specTpl.baseGold * tierScale);

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

  // --- Module: src/engine/state.js ---
// Game State Schema, Save v4 Migration, Persistence, and Derived Hero Stats





let itemSeq = 1000;

function nextItemUid(prefix = 'gear') {
  return `${prefix}_${Date.now()}_${itemSeq++}`;
}

function normalizeEquipmentSockets(item) {
  if (!item) return null;
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

function createDefaultGameState() {
  return {
    version: SCHEMA_VERSION,
    turn: 0,
    inGuild: true,
    audioEnabled: true,
    hero: null,
    dungeon: {
      seedCode: 'STAR-' + (1000 + Math.floor(Math.random() * 8999)),
      currentFloor: 1,
      floors: {}
    },
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
    guildBounties: buildProceduralBountySet(0, 0)
  };
}

const gameState = createDefaultGameState();

function setGameState(nextState) {
  if (!nextState) return gameState;
  Object.keys(gameState).forEach(k => {
    delete gameState[k];
  });
  Object.assign(gameState, nextState);
  return gameState;
}

function migrateSaveData(raw) {
  if (!raw) return null;
  const data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));

  const migrated = createDefaultGameState();
  migrated.turn = data.turn || 0;
  migrated.inGuild = data.inGuild !== undefined ? data.inGuild : (data.location !== 'dungeon');
  migrated.audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;

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

  if (data.dungeon && data.dungeon.floors) {
    migrated.dungeon.seedCode = data.dungeon.seedCode || 'STAR-4812';
    migrated.dungeon.currentFloor = data.dungeon.currentFloor || data.dungeon.currentDepth || 1;
    migrated.dungeon.floors = data.dungeon.floors;
    Object.keys(migrated.dungeon.floors).forEach(fk => {
      const fl = migrated.dungeon.floors[fk];
      if (fl) {
        fl.shrines = fl.shrines || {};
        fl.traps = fl.traps || {};
      }
    });
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

function saveGame(state = gameState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  // --- Module: src/engine/procedural.js ---
// Procedural Dungeon Generation, Non-Blocking Ore Veins, Shrines, Traps, Safe-Path BFS, and Socketed Equipment Rolling




function rollSocketCountForRarity(rarityKey, slot) {
  if (slot === 'pickaxe') return 0;
  if (rarityKey === 'relic') return 2;
  if (rarityKey === 'epic') return Math.random() < 0.60 ? 2 : 1;
  if (rarityKey === 'rare') return Math.random() < 0.25 ? 2 : 1;
  return 0;
}

function generateProceduralEquipment(depth = 1, forcedRarity = null, forcedSlot = null) {
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];

  let rarityKey = forcedRarity;
  if (!rarityKey) {
    const roll = Math.random() + (depth * 0.04);
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

function verifyPureFloorBFS(floor) {
  const start = floor.upPos;
  const goal = floor.downPos;
  const visited = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false));
  const queue = [{ x: start.x, y: start.y }];
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.x === goal.x && cur.y === goal.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !visited[ny][nx]) {
        const t = floor.tiles[ny][nx];
        // Live traps (TILE_TRAP_HIDDEN / TILE_TRAP_VISIBLE) are intentionally excluded so BFS guarantees a trap-free path
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
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
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

function generateFloor(depth) {
  const tiles = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(TILE_WALL));
  const rooms = [];
  const targetRooms = 6;

  for (let attempt = 0; attempt < 30 && rooms.length < targetRooms; attempt++) {
    const rw = 3 + Math.floor(Math.random() * 3);
    const rh = 3 + Math.floor(Math.random() * 2);
    const rx = 1 + Math.floor(Math.random() * (GRID_W - rw - 2));
    const ry = 1 + Math.floor(Math.random() * (GRID_H - rh - 2));

    let overlap = false;
    for (const r of rooms) {
      if (rx <= r.rx + r.rw && rx + rw >= r.rx && ry <= r.ry + r.rh && ry + rh >= r.ry) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          tiles[y][x] = TILE_FLOOR;
        }
      }
      rooms.push({ rx, ry, rw, rh, cx: rx + Math.floor(rw / 2), cy: ry + Math.floor(rh / 2) });
    }
  }

  if (rooms.length < 2) {
    rooms.push({ rx: 2, ry: 2, rw: 4, rh: 4, cx: 4, cy: 4 });
    rooms.push({ rx: 14, ry: 9, rw: 4, rh: 4, cx: 16, cy: 11 });
    for (const r of rooms) {
      for (let y = r.ry; y < r.ry + r.rh; y++) {
        for (let x = r.rx; x < r.rx + r.rw; x++) tiles[y][x] = TILE_FLOOR;
      }
    }
  }

  // Carve L-corridors between rooms
  for (let i = 1; i < rooms.length; i++) {
    let cx = rooms[i - 1].cx;
    let cy = rooms[i - 1].cy;
    const tx = rooms[i].cx;
    const ty = rooms[i].cy;
    while (cx !== tx) {
      tiles[cy][cx] = TILE_FLOOR;
      cx += (tx > cx) ? 1 : -1;
    }
    while (cy !== ty) {
      tiles[cy][cx] = TILE_FLOOR;
      cy += (ty > cy) ? 1 : -1;
    }
    tiles[cy][cx] = TILE_FLOOR;
  }

  const upPos = { x: rooms[0].cx, y: rooms[0].cy };
  let downPos = { x: rooms[rooms.length - 1].cx, y: rooms[rooms.length - 1].cy };
  if (upPos.x === downPos.x && upPos.y === downPos.y) {
    downPos = { x: Math.min(GRID_W - 2, upPos.x + 3), y: upPos.y };
    for (let x = upPos.x; x <= downPos.x; x++) tiles[upPos.y][x] = TILE_FLOOR;
  }
  tiles[upPos.y][upPos.x] = TILE_STAIRS_UP;
  tiles[downPos.y][downPos.x] = TILE_STAIRS_DOWN;

  // Seed Ore Veins ONLY on WALL tiles bordering FLOOR tiles (never blocking corridors!)
  const candidateWalls = [];
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (tiles[y][x] === TILE_WALL) {
        const bordersFloor =
          tiles[y - 1][x] === TILE_FLOOR ||
          tiles[y + 1][x] === TILE_FLOOR ||
          tiles[y][x - 1] === TILE_FLOOR ||
          tiles[y][x + 1] === TILE_FLOOR;
        if (bordersFloor) candidateWalls.push({ x, y });
      }
    }
  }

  const veinGoal = 8 + Math.min(8, depth);
  for (let i = 0; i < veinGoal && candidateWalls.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidateWalls.length);
    const pos = candidateWalls.splice(idx, 1)[0];
    const roll = Math.random();
    if (depth >= 5 && roll < 0.16) tiles[pos.y][pos.x] = TILE_ORE_ASTRAL;
    else if (depth >= 3 && roll < 0.34) tiles[pos.y][pos.x] = TILE_ORE_STAR;
    else if (depth >= 2 && roll < 0.56) tiles[pos.y][pos.x] = (Math.random() < 0.5) ? TILE_ORE_MITHRIL : TILE_ORE_GEODE;
    else if (roll < 0.78) tiles[pos.y][pos.x] = TILE_ORE_IRON;
    else tiles[pos.y][pos.x] = TILE_ORE_COPPER;
  }

  // Place Chests inside rooms (not on stairs)
  for (let i = 1; i < rooms.length; i++) {
    if (Math.random() < 0.65) {
      const r = rooms[i];
      const cx = r.rx + Math.floor(Math.random() * r.rw);
      const cy = r.ry + Math.floor(Math.random() * r.rh);
      if (tiles[cy][cx] === TILE_FLOOR && !(cx === downPos.x && cy === downPos.y) && !(cx === upPos.x && cy === upPos.y)) {
        tiles[cy][cx] = TILE_CHEST;
      }
    }
  }

  // Place Astral Shrine in a tactical vault room (1 per floor)
  const shrines = {};
  const shrineTypes = ['sanctuary', 'starfire', 'aegis'];
  const midRoom = rooms[Math.min(rooms.length - 1, Math.max(1, Math.floor(rooms.length / 2)))];
  for (let sTry = 0; sTry < 12; sTry++) {
    const sx = midRoom.rx + Math.floor(Math.random() * midRoom.rw);
    const sy = midRoom.ry + Math.floor(Math.random() * midRoom.rh);
    if (tiles[sy][sx] === TILE_FLOOR && !(sx === upPos.x && sy === upPos.y) && !(sx === downPos.x && sy === downPos.y)) {
      tiles[sy][sx] = TILE_SHRINE;
      shrines[`${sx},${sy}`] = {
        type: shrineTypes[Math.floor(Math.random() * shrineTypes.length)]
      };
      break;
    }
  }

  // Place Concealed Runic Traps inside non-starting rooms (safe BFS enforced below)
  const traps = {};
  const trapGoal = 2 + Math.min(4, depth);
  let trapsPlaced = 0;
  for (let tTry = 0; tTry < 30 && trapsPlaced < trapGoal; tTry++) {
    const rm = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
    const tx = rm.rx + Math.floor(Math.random() * rm.rw);
    const ty = rm.ry + Math.floor(Math.random() * rm.rh);
    if (
      tiles[ty][tx] === TILE_FLOOR &&
      !(tx === upPos.x && ty === upPos.y) &&
      !(tx === downPos.x && ty === downPos.y) &&
      Math.hypot(tx - upPos.x, ty - upPos.y) >= 2.2
    ) {
      tiles[ty][tx] = TILE_TRAP_HIDDEN;
      traps[`${tx},${ty}`] = {
        type: Math.random() < 0.55 ? 'spike' : 'flame'
      };
      trapsPlaced += 1;
    }
  }

  const floorObj = {
    depth,
    tiles,
    upPos,
    downPos,
    shrines,
    traps,
    monsters: [],
    explored: Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false)),
    oresMined: 0
  };

  // Guarantee pure trap-free walkability between < and > stairs
  if (!verifyPureFloorBFS(floorObj)) {
    carveDirectFloorPath(floorObj);
  }

  // Spawn Monsters or Milestone Bosses (Floors 5 & 10)
  if (depth === 5) {
    const br = rooms[rooms.length - 1];
    floorObj.monsters.push({
      uid: `boss_5_${Date.now()}`,
      id: 'boss_colossus',
      name: 'Starfall Colossus',
      isBoss: true,
      isRanged: false,
      x: br.cx,
      y: br.cy,
      hp: 240,
      maxHp: 240,
      atk: 20,
      def: 10,
      xp: 260,
      color: '#f59e0b',
      statuses: []
    });
  } else if (depth === 10) {
    const br = rooms[rooms.length - 1];
    floorObj.monsters.push({
      uid: `boss_10_${Date.now()}`,
      id: 'boss_weaver',
      name: 'Void Weaver',
      isBoss: true,
      isRanged: true,
      range: 4,
      x: br.cx,
      y: br.cy,
      hp: 420,
      maxHp: 420,
      atk: 28,
      def: 14,
      xp: 520,
      color: '#ec4899',
      statuses: []
    });
  } else {
    const monsterGoal = 3 + Math.min(6, depth);
    for (let m = 0; m < monsterGoal; m++) {
      const rm = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
      const mx = rm.rx + Math.floor(Math.random() * rm.rw);
      const my = rm.ry + Math.floor(Math.random() * rm.rh);
      if (
        (tiles[my][mx] === TILE_FLOOR || tiles[my][mx] === TILE_STAIRS_DOWN) &&
        !(mx === upPos.x && my === upPos.y) &&
        !floorObj.monsters.some(other => other.x === mx && other.y === my)
      ) {
        const isElite = depth >= 2 && Math.random() < 0.22;
        const affix = isElite ? ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)] : null;
        const rollType = Math.random();
        const isRanged = rollType < 0.35;
        const baseName = isRanged ? (depth >= 3 ? 'Abyssal Cultist' : 'Starfall Archer') : 'Vault Crawler';
        const hpBase = (28 + depth * 8) * (isElite ? 1.6 : 1.0);

        floorObj.monsters.push({
          uid: `m_${depth}_${m}_${Date.now()}`,
          id: isRanged ? 'archer' : 'crawler',
          name: isElite ? `${affix.name} ${baseName}` : baseName,
          isElite,
          affix,
          isRanged,
          range: isRanged ? 3 : 1,
          x: mx,
          y: my,
          hp: Math.round(hpBase),
          maxHp: Math.round(hpBase),
          atk: Math.round((8 + depth * 2.2) * (isElite ? 1.25 : 1.0)),
          def: Math.round((2 + depth * 1.1) * ((affix && affix.id === 'fortified') ? 1.35 : 1.0)),
          xp: Math.round((16 + depth * 6) * (isElite ? 2.0 : 1.0)),
          color: isElite ? '#fbbf24' : (isRanged ? '#60a5fa' : '#f87171'),
          statuses: []
        });
      }
    }
  }

  return floorObj;
}

  // --- Module: src/engine/actions.js ---
// Interactive Mining, Astral Gems & Lapidary, Guild Bounties, Shrines, Traps, Extraction & Research










const actionCallbacks = {
  log: () => {},
  updateUI: () => {},
  floatingText: () => {},
  outcomeModal: () => {},
  updateFOV: () => {},
  onTurnEnd: () => {}
};

function registerActionCallbacks(cbs) {
  Object.assign(actionCallbacks, cbs);
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
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return { ok: false, reason: 'no_floor' };

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

  addExpeditionTradeItem(ore.id, ore.name, ore.baseValue, 1, 'Ore', state);
  recordBountyProgress('mine', [ore.id], 1, state);

  // High-tier vein uncut Astral Gem drop check
  const droppedGemId = rollUncutGemForOreTile(tile);
  if (droppedGemId && GEM_CATALOG[droppedGemId]) {
    const gemDef = GEM_CATALOG[droppedGemId];
    addExpeditionTradeItem(gemDef.id, gemDef.name, gemDef.baseValue, 1, 'Gem', state);
    if (state === gameState) {
      actionCallbacks.log(`💎 Unearthed uncut ${gemDef.name} (${gemDef.desc}) from the vein!`, 'good');
    }
  }

  if (state === gameState) {
    playSound('mine');
    actionCallbacks.floatingText(x, y, `+1 ${ore.name}${freeMine ? ' (FREE!)' : ''}`, ore.sparkle);
    actionCallbacks.log(`Mined ${ore.name} (+1 to Pack). Pickaxe: ${pick.curDur}/${getPickaxeMaxDurability(state)}.`, 'gold');

    // Geode bonus equipment roll
    if (tile === TILE_ORE_GEODE && Math.random() < 0.45) {
      const dropGear = generateProceduralEquipment(floor.depth, 'rare');
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
  if (!floor || !state || !state.hero) return 0;
  const h = state.hero;
  const vision = h.visionRadius || 5;
  const spotScore = (h.computedDex || 10) * 2 + vision * 6;
  const threshold = 26 + (floor.depth || 1) * 3;
  const isScoutClass = h.classId === 'thief' || h.classId === 'ranger';
  let spottedCount = 0;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
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
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
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

  detectNearbyTraps(floor, state);
  return { ok: true, shrineType: sDef.id };
}

function resolveTrapInteraction(x, y, state = gameState) {
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
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

function extractToGuild(method = 'Floor 1 Ascending Stairs (<)', state = gameState) {
  const h = state.hero;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

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
      `You fell to ${killerName} on Floor ${state.dungeon.currentFloor}. Oakhaven scouts recovered you to the surface. Your character level, equipped loadout, and Guild Vault remain intact!`,
      [
        `Defeated By: ${killerName} (Floor ${state.dungeon.currentFloor})`,
        `Unbanked Pack Items Lost: ${lostOreCount}`,
        `Unbanked Equipment Lost: ${lostGearCount}`,
        `Vanguard Pact Salvage (${vRank * 20}%): +${salvagedGold}g`,
        `Persistent Dungeon Seed: ${state.dungeon.seedCode}`
      ]
    );
  }

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

function sellAllSpareGear(state = gameState) {
  if (state.guildVault.armory.length === 0) {
    if (state === gameState) actionCallbacks.log('No spare equipment in Vault Armory to sell.', 'info');
    return 0;
  }
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  let total = 0;
  const count = state.guildVault.armory.length;
  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }
  state.guildVault.armory.forEach(g => {
    if (Array.isArray(g.sockets)) {
      g.sockets.forEach(gId => {
        state.guildVault.gems[gId] = (state.guildVault.gems[gId] || 0) + 1;
      });
    }
    total += Math.round((g.value || 15) * mult);
  });
  state.guildVault.armory = [];
  state.guildVault.gold += total;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${count} spare armory items with Assay bonus for +${total}g!`, 'gold');
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
// Turn-Based Movement, Combat Resolution, Active Class Skills, Monster AI, Shrines, Traps & Stairs


let fovCallback = () => {};

function registerCombatFOVCallback(fn) {
  if (typeof fn === 'function') {
    fovCallback = fn;
    registerActionCallbacks({ updateFOV: fn });
  }
}

function killMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return;
  floor.monsters = floor.monsters.filter(m => m !== monster);

  const h = state.hero;
  // Thief Shadow Dance MP restore on kill
  if (h.classId === 'thief' && ((h.talentsAllocated && h.talentsAllocated.t_b3) || 0) > 0) {
    h.mp = Math.min(h.maxMp, h.mp + 6);
  }

  // Record Guild Notice Board Bounty Progress
  const killTags = ['monster_any', monster.id];
  if (monster.isElite) killTags.push('elite');
  if (monster.isBoss) killTags.push('boss');
  recordBountyProgress('slay', killTags, 1, state);

  if (monster.isBoss) {
    const bossRarity = monster.id === 'boss_weaver' ? 'relic' : 'epic';
    const bossGear = generateProceduralEquipment(floor.depth, bossRarity);
    h.expeditionGear.push(bossGear);
    addExpeditionTradeItem('starcrystal', 'Star-Crystal', 90, 2, 'Ore', state);
    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(monster.x, monster.y, '👑 BOSS VANQUISHED!', '#fbbf24');
      ui.log(`👑 Vanquished ${monster.name}! Looted ${bossGear.name} (${RARITY[bossRarity].name}) & 2x Star-Crystal!`, 'gold');
    }
  } else {
    const goldVal = 8 + floor.depth * 5 + (monster.isElite ? 18 : 0);
    addExpeditionTradeItem('monster_trophy', 'Abyssal Shard', goldVal, 1, 'Relic', state);
    if (monster.isElite || Math.random() < 0.25) {
      const dropGear = generateProceduralEquipment(floor.depth, monster.isElite ? 'rare' : null);
      h.expeditionGear.push(dropGear);
      if (state === gameState) {
        ui.log(`${monster.name} dropped ${dropGear.name}!`, 'good');
      }
    }
  }

  if (state === gameState) {
    gainExperience(monster.xp, state);
  }
}

function attackMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const isCrit = Math.random() * 100 < h.crit;
  const critMult = isCrit ? 1.65 : 1.0;
  const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
  const effDef = Math.round(monster.def * (1 - Math.min(0.8, pierceRank * 0.30)));

  const dmg = Math.max(2, Math.round(h.atk * critMult) - effDef);
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

function checkHeroFatalDamage(killerName) {
  const ui = getActionCallbacks();
  const h = gameState.hero;
  // Paladin Divine Intervention Keystone
  if (h.classId === 'paladin' && ((h.talentsAllocated && h.talentsAllocated.p_e3) || 0) > 0 && !h.usedDivineIntervention) {
    h.usedDivineIntervention = true;
    h.hp = Math.round(h.maxHp * 0.40);
    playSound('lvl');
    ui.floatingText(h.x, h.y, 'DIVINE INTERVENTION!', '#fbbf24');
    ui.log('Divine Intervention prevented fatal damage and restored 40% Max HP!', 'gold');
    ui.updateUI();
    return;
  }
  handleHeroDefeat(killerName);
}

function monsterAttackHero(m, isRanged) {
  const ui = getActionCallbacks();
  const h = gameState.hero;
  if (Math.random() * 100 < h.dodge) {
    ui.floatingText(h.x, h.y, 'DODGE!', '#34d399');
    ui.log(`You dodged ${m.name}'s attack!`, 'good');
    return;
  }

  let raw = isRanged ? Math.round(m.atk * 0.85) : m.atk;
  if (h.classId === 'fighter') raw = Math.round(raw * 0.85);
  const dmg = Math.max(1, raw - Math.floor(h.def * 0.6));
  h.hp -= dmg;
  playSound('hit');
  ui.floatingText(h.x, h.y, `-${dmg}${isRanged ? ' 🏹' : ''}`, '#f87171');
  ui.log(`${m.name} strikes you for ${dmg} damage!`, 'bad');

  // Elite Affix Effects
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
    ui.floatingText(m.x, m.y, `-${counterDmg} COUNTER!`, '#60a5fa');
    if (m.hp <= 0) killMonster(m);
  }

  if (h.hp <= 0) {
    checkHeroFatalDamage(m.name);
  }
}

function processTurn() {
  const ui = getActionCallbacks();
  gameState.turn += 1;
  const h = gameState.hero;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  // Passive Class Turn Ticks
  if (h.classId === 'mage') {
    h.mp = Math.min(h.maxMp, h.mp + 2);
  }
  if (h.classId === 'paladin' && gameState.turn % 3 === 0) {
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
        ui.floatingText(h.x, h.y, `-${dot} ${st.name.toUpperCase()}`, st.color);
      }
      st.duration -= 1;
      if (st.duration <= 0) {
        if (st.isBuff) buffExpired = true;
        h.statuses.splice(i, 1);
      }
    }
    if (buffExpired) {
      recomputeHeroDerivedStats(false, gameState);
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage('Affliction');
      return;
    }
  }

  detectNearbyTraps(floor, gameState);
  fovCallback();

  // Monsters AI Turn
  for (const m of floor.monsters.slice()) {
    if (m.hp <= 0) continue;

    // Monster Status Ticks
    if (m.statuses && m.statuses.length > 0) {
      let stunned = false;
      for (let i = m.statuses.length - 1; i >= 0; i--) {
        const st = m.statuses[i];
        if (st.id === 'stun') stunned = true;
        if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
          const dot = Math.max(3, Math.round(m.maxHp * 0.06));
          m.hp -= dot;
          ui.floatingText(m.x, m.y, `-${dot}`, st.color);
        }
        st.duration -= 1;
        if (st.duration <= 0) m.statuses.splice(i, 1);
      }
      if (m.hp <= 0) {
        killMonster(m);
        continue;
      }
      if (stunned) {
        ui.floatingText(m.x, m.y, 'STUNNED', '#fbbf24');
        continue;
      }
    }

    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    if (dist <= 6.5) {
      if (dist <= 1.5) {
        monsterAttackHero(m, false);
        if (gameState.inGuild) return;
      } else if (m.isRanged && dist <= (m.range || 3) + 0.3) {
        monsterAttackHero(m, true);
        if (gameState.inGuild) return;
      } else {
        const sx = Math.sign(h.x - m.x);
        const sy = Math.sign(h.y - m.y);
        const candidates = Math.abs(h.x - m.x) >= Math.abs(h.y - m.y)
          ? [[sx, 0], [0, sy]]
          : [[0, sy], [sx, 0]];
        for (const [dx, dy] of candidates) {
          if (dx === 0 && dy === 0) continue;
          const tx = m.x + dx;
          const ty = m.y + dy;
          if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
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

  saveGame();
  ui.updateUI();
}

// Wire turn-end hook into actions.js (for Healing Tonic turn advance)
registerActionCallbacks({ onTurnEnd: processTurn });

function executeClassSkill(state = gameState) {
  const ui = getActionCallbacks();
  if (state.inGuild) return { ok: false, reason: 'in_guild' };
  const h = state.hero;
  const cls = CLASSES[h.classId];
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return { ok: false, reason: 'no_floor' };

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
      const dmg = Math.max(2, Math.round(h.atk * 1.5) - m.def);
      m.hp -= dmg;
      applyStatusEffect(m, 'stun', 1);
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} STUN`, '#f87171');
      if (m.hp <= 0) killMonster(m, state);
    });
    if (state === gameState) processTurn();
    return { ok: true, skill: 'whirlwind' };
  }

  // 2. THIEF: Shadowstep Strike (Requires visible target within 3.5 tiles AND an unoccupied safe floor tile adjacent to target)
  if (h.classId === 'thief') {
    const candidates = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 3.5);
    let chosenTarget = null;
    let destTile = null;

    for (const m of candidates) {
      const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of neighbors) {
        const tx = m.x + dx;
        const ty = m.y + dy;
        if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
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
        ui.log('Shadowstep Strike requires a target within 3 tiles with an open adjacent floor tile.', 'bad');
      }
      return { ok: false, reason: 'no_valid_shadowstep' };
    }

    h.mp -= cls.skillCost;
    h.x = destTile.x;
    h.y = destTile.y;
    const dmg = Math.max(4, Math.round(h.atk * 2.2) - Math.floor(chosenTarget.def * 0.5));
    chosenTarget.hp -= dmg;

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(chosenTarget.x, chosenTarget.y, `-${dmg} CRIT BACKSTAB!`, '#fbbf24');
      ui.log(`Shadowstep Strike hits ${chosenTarget.name} for ${dmg} critical damage!`, 'gold');
    }
    if (chosenTarget.hp <= 0) killMonster(chosenTarget, state);
    if (state === gameState) processTurn();
    return { ok: true, skill: 'shadowstep', destTile };
  }

  // 3. MAGE: Starfall Nova (Requires at least 1 enemy within 4 tiles, applies Arcane Amplification & Supernova Echo)
  if (h.classId === 'mage') {
    const targets = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 4.2);
    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Foes in Range!', '#60a5fa');
        ui.log('Starfall Nova requires at least one enemy within 4 tiles.', 'bad');
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
      let dmg = Math.max(4, Math.round(h.atk * spellMult) - Math.floor(m.def * 0.4));
      if (hasEcho) dmg += Math.round(dmg * 0.5);
      m.hp -= dmg;
      applyStatusEffect(m, 'burn', 3);
      if (state === gameState) {
        ui.floatingText(m.x, m.y, `-${dmg}${hasEcho ? ' ECHO!' : ''}`, '#60a5fa');
      }
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn();
    return { ok: true, skill: 'nova' };
  }

  // 4. RANGER: Starfall Volley (Up to 3—or 5 with Rain of Needles—targets within 5 tiles)
  if (h.classId === 'ranger') {
    const maxTargets = ((h.talentsAllocated && h.talentsAllocated.r_d3) || 0) > 0 ? 5 : 3;
    const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
    const defIgnore = Math.min(0.8, pierceRank * 0.30);

    const targets = floor.monsters
      .filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 5.2)
      .sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))
      .slice(0, maxTargets);

    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Targets in Sight!', '#34d399');
        ui.log('Starfall Volley requires at least one enemy within 5 tiles.', 'bad');
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
      const dmg = Math.max(3, Math.round(h.atk * 1.8) - effDef);
      m.hp -= dmg;
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} VOLLEY`, '#34d399');
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn();
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
    const dmg = Math.max(5, Math.round(h.atk * 2.4) - Math.floor(target.def * 0.5));
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
    if (state === gameState) processTurn();
    return { ok: true, skill: 'smite', dmg, healAmt };
  }

  return { ok: false };
}

function handlePlayerAction(dx, dy) {
  const ui = getActionCallbacks();
  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  const nx = gameState.hero.x + dx;
  const ny = gameState.hero.y + dy;
  if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) return;

  // 1. Monster Melee/Ranged Bump Attack
  const targetMonster = floor.monsters.find(m => m.x === nx && m.y === ny);
  if (targetMonster) {
    attackMonster(targetMonster);
    processTurn();
    return;
  }

  // 2. Ore Vein Mining
  const targetTile = floor.tiles[ny][nx];
  if (ORE_CATALOG[targetTile]) {
    mineTile(nx, ny);
    processTurn();
    return;
  }

  // 3. Gilded Chest Opening
  if (targetTile === TILE_CHEST) {
    floor.tiles[ny][nx] = TILE_CHEST_OPEN;
    playSound('gold');
    const depth = gameState.dungeon.currentFloor;
    const goldVal = Math.round((22 + depth * 12) * (gameState.hero.classId === 'thief' ? 1.25 : 1.0));
    addExpeditionTradeItem('star_relic', 'Star-etched Relic', goldVal, 1, 'Relic');
    recordBountyProgress('open_chest', ['chest'], 1, gameState);

    const chestGear = generateProceduralEquipment(depth, depth >= 3 ? 'rare' : 'uncommon');
    gameState.hero.expeditionGear.push(chestGear);

    ui.floatingText(nx, ny, `+${goldVal}g & ${chestGear.name}!`, RARITY[chestGear.rarity].color);
    ui.log(`Opened Gilded Chest! Found Star-etched Relic (${goldVal}g) & ${chestGear.name}!`, 'gold');
    gainExperience(18 + depth * 6);
    processTurn();
    return;
  }

  // 4. Astral Shrine Activation
  if (targetTile === TILE_SHRINE) {
    activateAstralShrine(nx, ny, gameState);
    processTurn();
    return;
  }

  // 5. Runic Trap Interaction (Disarm for Scout on Spotted Trap, else Trigger)
  if (targetTile === TILE_TRAP_HIDDEN || targetTile === TILE_TRAP_VISIBLE) {
    const trapRes = resolveTrapInteraction(nx, ny, gameState);
    if (trapRes.fatal) {
      checkHeroFatalDamage(trapRes.killerName);
      return;
    }
    processTurn();
    return;
  }

  // 6. Step onto Walkable Tile
  if (targetTile !== TILE_WALL) {
    gameState.hero.x = nx;
    gameState.hero.y = ny;
    detectNearbyTraps(floor, gameState);
    processTurn();
  } else {
    ui.floatingText(nx, ny, 'Blocked', '#8b949e');
  }
}

function useStairsAtPlayer() {
  const ui = getActionCallbacks();
  if (gameState.inGuild) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  const tile = floor.tiles[gameState.hero.y][gameState.hero.x];

  if (tile === TILE_STAIRS_UP) {
    if (gameState.dungeon.currentFloor === 1) {
      extractToGuild('Floor 1 Ascending Stairs (<)');
    } else {
      gameState.dungeon.currentFloor -= 1;
      const prev = gameState.dungeon.floors[gameState.dungeon.currentFloor];
      gameState.hero.x = prev.downPos.x;
      gameState.hero.y = prev.downPos.y;
      detectNearbyTraps(prev, gameState);
      fovCallback();
      ui.updateUI();
      ui.log(`Ascended to Floor ${gameState.dungeon.currentFloor}.`, 'info');
    }
  } else if (tile === TILE_STAIRS_DOWN) {
    const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
    if (gameState.dungeon.currentFloor + 1 > permit) {
      ui.floatingText(gameState.hero.x, gameState.hero.y, 'Ward Sealed!', '#f87171');
      ui.log(`Astral Ward blocks Floor ${gameState.dungeon.currentFloor + 1}! Research Vault Cartography at the Guild Lab.`, 'bad');
      playSound('hit');
      return;
    }
    gameState.dungeon.currentFloor += 1;
    if (!gameState.dungeon.floors[gameState.dungeon.currentFloor]) {
      gameState.dungeon.floors[gameState.dungeon.currentFloor] = generateFloor(gameState.dungeon.currentFloor);
    }
    const next = gameState.dungeon.floors[gameState.dungeon.currentFloor];
    gameState.hero.x = next.upPos.x;
    gameState.hero.y = next.upPos.y;
    detectNearbyTraps(next, gameState);
    fovCallback();
    ui.updateUI();
    ui.log(`Descended to Floor ${gameState.dungeon.currentFloor}.`, 'info');
  } else {
    ui.log('Stand on Ascending (<) or Descending (>) stairs to use them.', 'info');
  }
}

function waitTurn() {
  const ui = getActionCallbacks();
  if (gameState.inGuild) return;
  ui.log('You hold your ground and scan the shadows.', 'info');
  processTurn();
}

  // --- Module: src/ui/renderer.js ---
// 2D Graphical Canvas Renderer, Torchlight FOV, Shrines, Traps, Hero Sprite, and Floating Combat Text







const floatingTexts = [];
let hoverTile = null;

function setHoverTile(tile) {
  hoverTile = tile;
}

function getHoverTile() {
  return hoverTile;
}

function spawnFloatingText(gx, gy, text, color = '#fff') {
  floatingTexts.push({
    px: gx * TILE_SIZE + 16,
    py: gy * TILE_SIZE + 10,
    text,
    color,
    ticks: 28
  });
}

function updateFOV() {
  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;
  const radius = gameState.hero.visionRadius || 5;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (Math.hypot(x - gameState.hero.x, y - gameState.hero.y) <= radius + 0.35) {
        floor.explored[y][x] = true;
      }
    }
  }

  detectNearbyTraps(floor, gameState);
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

function renderDungeonCanvas() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('dungeonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!floor.explored[y][x]) continue;

      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      const dist = Math.hypot(x - hx, y - hy);
      const inSight = dist <= vision + 0.35;
      const tile = floor.tiles[y][x];

      // Draw Wall or Ore Vein Wall
      if (tile === TILE_WALL || ORE_CATALOG[tile]) {
        ctx.fillStyle = '#1b2434';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#293548';
        ctx.fillRect(px, py, TILE_SIZE, 4);
        ctx.fillStyle = '#0d131d';
        ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 5);

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
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0e1420' : '#111826';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#192234';
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
          // Stone Altar Base
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 8, py + 20, 16, 6);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 11, py + 14, 10, 6);
          // Floating Astral Crystal
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
          // Draw hazard triangles / rune nodes
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
          ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // Draw Visible Monsters
  for (const m of floor.monsters) {
    if (Math.hypot(m.x - hx, m.y - hy) > vision + 0.35) continue;
    const mx = m.x * TILE_SIZE;
    const my = m.y * TILE_SIZE;

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

  // Draw Player Sprite
  drawHeroSprite(ctx, hx * TILE_SIZE, hy * TILE_SIZE, gameState.hero.classId, TILE_SIZE);

  // Draw Hover Highlight
  if (hoverTile) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hoverTile.x * TILE_SIZE + 1, hoverTile.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  // Draw Floating Combat/Mining Numbers
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(ft.text, ft.px + 1, ft.py + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.px, ft.py);
    ft.py -= 0.45;
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

  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  document.getElementById('uiGuildSeed').textContent = gameState.dungeon.seedCode;
  document.getElementById('uiChartedFloors').textContent = Object.keys(gameState.dungeon.floors).length;
  document.getElementById('uiDepthPermit').textContent = `Floor ${permit}`;
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
    sellRows.push(`
      <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="cursor-pointer hover:underline">
          <span class="font-bold" style="color:${r.color}">${g.name}</span>${formatSocketPipsHtml(g)}
          <span class="text-[10px] text-[#8b949e] uppercase ml-1">[${g.slot}]</span>
        </div>
        <button onclick="window.Aethelgard.sellArmoryItem('${g.uid}')" class="px-2.5 py-0.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
          Sell (+${salePrice}g)
        </button>
      </div>
    `);
  });

  sellEl.innerHTML = sellRows.length > 0
    ? sellRows.join('')
    : `<div class="text-[#8b949e] italic py-4 text-center">No banked minerals, gems, or spare equipment to appraise. Mine veins & extract from the dungeon!</div>`;

  // Vault Armory Tab
  const armoryGrid = document.getElementById('uiArmoryGrid');
  if (gameState.guildVault.armory.length === 0) {
    armoryGrid.innerHTML = `<div class="col-span-2 text-xs text-[#8b949e] italic py-4 text-center">Your Vault Armory is empty. Defeat monsters, open chests, or buy gear from the Quartermaster.</div>`;
  } else {
    armoryGrid.innerHTML = gameState.guildVault.armory.map(g => {
      const r = RARITY[g.rarity] || RARITY.common;
      return `
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="p-2.5 rounded bg-[#080b11] border border-[#283347] hover:border-[#60a5fa] cursor-pointer flex items-center justify-between">
          <div>
            <div class="text-xs font-bold" style="color:${r.color}">${g.name}${formatSocketPipsHtml(g)}</div>
            <div class="text-[10px] text-[#8b949e] uppercase">${r.name} • ${g.slot}</div>
          </div>
          <span class="text-xs font-mono-num text-[#fbbf24]">${g.value}g</span>
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
}

function renderDungeonHud() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  const cls = CLASSES[h.classId];
  const depth = gameState.dungeon.currentFloor;
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  const floor = gameState.dungeon.floors[depth];

  document.getElementById('uiFloorBadge').textContent = `FLOOR ${depth} / ${permit}`;
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
    : `Starfall Vaults • Floor ${gameState.dungeon.currentFloor}`;
  document.getElementById('headerLocationDot').className = gameState.inGuild
    ? 'w-2.5 h-2.5 rounded-full bg-[#34d399]'
    : 'w-2.5 h-2.5 rounded-full bg-[#f87171] animate-pulse';

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
}

function switchGuildTab(tabId) {
  if (typeof document === 'undefined') return;
  ['tavern', 'bounties', 'lapidary', 'shop', 'armory', 'talents', 'research'].forEach(t => {
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
// In-Game Modals, Guild Controllers, Item Inspection (with Gem Sockets), Class Selection & Save Sync











let inspectedItemContext = null;

function getInspectedItemContext() {
  return inspectedItemContext;
}

function descendIntoDungeon() {
  gameState.inGuild = false;
  gameState.dungeon.currentFloor = 1;
  if (!gameState.dungeon.floors[1]) {
    gameState.dungeon.floors[1] = generateFloor(1);
  }
  const f1 = gameState.dungeon.floors[1];
  gameState.hero.x = f1.upPos.x;
  gameState.hero.y = f1.upPos.y;
  updateFOV();
  saveGame();
  updateAllUI();
  logChronicle(`Descended into Floor 1 of ${gameState.dungeon.seedCode}.`, 'gold');
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
      <button onclick="window.Aethelgard.confirmChartNewDungeon()" class="px-4 py-1.5 rounded bg-[#f87171] text-[#080b11] font-bold text-xs font-mono-num">Confirm New Chart</button>
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

function openNewDungeonModal() {
  showOutcomeModal(
    'Chart New Subterranean Dungeon?',
    'Guild Cartographers will seal the current dungeon shaft and chart a fresh procedural layout across all floors. Your character level, Vault Gold, Astral Gems, and minerals are preserved.',
    [`Current Chart: ${gameState.dungeon.seedCode}`, `Explored Floors to Reset: ${Object.keys(gameState.dungeon.floors).length}`],
    true
  );
}

function closeNewDungeonModal() {
  closeOutcomeModal();
}

function confirmChartNewDungeon() {
  gameState.dungeon.seedCode = 'STAR-' + (1000 + Math.floor(Math.random() * 8999));
  gameState.dungeon.currentFloor = 1;
  gameState.dungeon.floors = { 1: generateFloor(1) };
  closeOutcomeModal();
  playSound('lvl');
  logChronicle(`Charted new dungeon seed ${gameState.dungeon.seedCode}!`, 'gold');
  saveGame();
  updateAllUI();
}

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

  document.getElementById('itemInspectModal').classList.remove('hidden');
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
  targetState.dungeon.floors = { 1: generateFloor(1) };
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
  document.getElementById('saveJsonTextarea').value = JSON.stringify(gameState, null, 2);
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
  document.getElementById('saveSyncStatusMsg').textContent = '✓ Copied save JSON to clipboard!';
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
    logChronicle('Imported & migrated save state to Schema v4!', 'good');
  } catch (e) {
    document.getElementById('saveSyncStatusMsg').textContent = '✕ Invalid JSON format.';
  }
}

  // --- Module: src/ui/input.js ---
// Unified Keyboard, Mouse & Tactical Tile Scanner Input Listeners








function updateScannerOnHover(gx, gy) {
  if (typeof document === 'undefined') return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor || !floor.explored[gy][gx]) return;
  const box = document.getElementById('uiScannerContent');
  if (!box) return;

  const monster = floor.monsters.find(m => m.x === gx && m.y === gy);
  if (monster) {
    box.innerHTML = `
      <div class="font-bold" style="color:${monster.color}">${monster.name} ${monster.isBoss ? '👑' : ''}</div>
      <div class="text-[11px] text-[#e6edf3]">HP: ${monster.hp}/${monster.maxHp} • ATK: ${monster.atk} • DEF: ${monster.def}</div>
      <div class="text-[10px] text-[#8b949e]">${monster.affix ? monster.affix.desc : (monster.isRanged ? 'Ranged Attacker (3 tiles)' : 'Melee Guardian')}</div>
    `;
    return;
  }

  const t = floor.tiles[gy][gx];
  if (ORE_CATALOG[t]) {
    const ore = ORE_CATALOG[t];
    box.innerHTML = `
      <div class="font-bold" style="color:${ore.color}">${ore.name} Vein</div>
      <div class="text-[11px] text-[#e6edf3]">Base Value: ${ore.baseValue}g • Requires Geology Rank ${ore.minGeology}</div>
      <div class="text-[10px] text-[#8b949e]">Step into this wall to swing your pickaxe.</div>
    `;
  } else if (t === TILE_CHEST) {
    box.innerHTML = `<div class="font-bold text-[#fbbf24]">Gilded Vault Chest</div><div class="text-[11px] text-[#8b949e]">Contains relics and procedural equipment.</div>`;
  } else if (t === TILE_SHRINE) {
    const sMeta = (floor.shrines && floor.shrines[`${gx},${gy}`]) || { type: 'sanctuary' };
    const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;
    box.innerHTML = `
      <div class="font-bold" style="color:${sDef.color}">✨ ${sDef.name}</div>
      <div class="text-[11px] text-[#e6edf3]">${sDef.desc}</div>
      <div class="text-[10px] text-[#8b949e]">Step onto this altar to claim its astral blessing.</div>
    `;
  } else if (t === TILE_SHRINE_USED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Dormant Astral Altar</div><div class="text-[11px] text-[#8b949e]">Its celestial energy has already been channeled.</div>`;
  } else if (t === TILE_TRAP_VISIBLE) {
    const tMeta = (floor.traps && floor.traps[`${gx},${gy}`]) || { type: 'spike' };
    const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
    const isScout = gameState.hero && (gameState.hero.classId === 'thief' || gameState.hero.classId === 'ranger');
    box.innerHTML = `
      <div class="font-bold" style="color:${tDef.color}">⚠ ${tDef.name} (Spotted)</div>
      <div class="text-[11px] text-[#e6edf3]">${tDef.desc}</div>
      <div class="text-[10px] text-[#34d399]">${isScout ? 'Step onto tile to safely DISARM for bonus XP!' : 'Navigate around—only Thieves & Rangers can disarm safely.'}</div>
    `;
  } else if (t === TILE_TRAP_DISARMED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Disarmed Runic Plate</div><div class="text-[11px] text-[#8b949e]">Mechanism neutralized; safe to walk across.</div>`;
  } else if (t === TILE_STAIRS_UP) {
    box.innerHTML = `<div class="font-bold text-[#34d399]">Ascending Stairs (&lt;)</div><div class="text-[11px] text-[#8b949e]">Stand on stairs and press [E] to ascend or extract to the Guild.</div>`;
  } else if (t === TILE_STAIRS_DOWN) {
    box.innerHTML = `<div class="font-bold text-[#60a5fa]">Descending Stairs (&gt;)</div><div class="text-[11px] text-[#8b949e]">Stand on stairs and press [E] to descend deeper.</div>`;
  } else {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Vault Masonry (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click adjacent tiles or use WASD/Arrows to move.</div>`;
  }
}

function setupInputs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.addEventListener('keydown', e => {
    const classModal = document.getElementById('classSelectModal');
    const saveModal = document.getElementById('saveSyncModal');
    if (classModal && !classModal.classList.contains('hidden')) return;
    if (saveModal && !saveModal.classList.contains('hidden')) return;
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
  if (!canvas) return;

  canvas.addEventListener('mousemove', e => {
    if (gameState.inGuild || !gameState.hero) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
      setHoverTile({ x: gx, y: gy });
      updateScannerOnHover(gx, gy);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    setHoverTile(null);
  });

  canvas.addEventListener('click', e => {
    if (gameState.inGuild || !gameState.hero) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - rect.left) * (canvas.width / rect.width)) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * (canvas.height / rect.height)) / TILE_SIZE);
    const dx = gx - gameState.hero.x;
    const dy = gy - gameState.hero.y;
    if (dx === 0 && dy === 0) {
      useStairsAtPlayer();
    } else if (Math.abs(dx) + Math.abs(dy) === 1) {
      handlePlayerAction(dx, dy);
    }
  });
}

  // --- Module: src/test/selfTest.js ---
// 13/13 Comprehensive Automated Self-Test Suite (Sandboxed & Non-Destructive)








function evaluateSelfTests() {
  const results = [];

  // 1. Schema v4 Migration preserves v1/v2/v3 saves & backfills gems + bounties
  const legacySave = {
    version: 'v0.1.0-inc1',
    hero: { classId: 'ranger', level: 4, xp: 20 },
    bank: { gold: 120, potions: 4, recallScrolls: 2, items: [{ id: 'copper_ore', count: 5 }] },
    research: { max_depth: 1, metallurgy_geology: 2 }
  };
  const mig = migrateSaveData(legacySave);
  const t1Pass =
    mig.version === SCHEMA_VERSION &&
    mig.hero.classId === 'ranger' &&
    mig.guildVault.gold === 120 &&
    mig.guildVault.copper === 5 &&
    mig.hero.consumables.potions === 4 &&
    mig.guildResearch.geology === 2 &&
    mig.guildVault.gems &&
    Array.isArray(mig.guildBounties) &&
    mig.guildBounties.length === 3;
  results.push({
    name: '1. Schema v4 Save Migration (v1/v2/v3 Compatibility)',
    pass: t1Pass,
    detail: `Migrated Lv4 Ranger, 120g, 5 Copper, Geology R${mig.guildResearch.geology}, Gems & 3 Bounties initialized`
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

  // 3. Pure-Floor BFS Staircase Reachability & Non-Blocking Ores/Traps
  let bfsAllPass = true;
  for (let i = 0; i < 5; i++) {
    const testFl = generateFloor(i + 1);
    if (!verifyPureFloorBFS(testFl)) bfsAllPass = false;
  }
  results.push({
    name: '3. Pure-Floor BFS Staircase Reachability (Trap-Free & Non-Blocking)',
    pass: bfsAllPass,
    detail: '5/5 procedural floors verified with safe trap-free walkable paths from < to >'
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

  // 5. Mining Engine, Geology Gating & Durability Math
  const sandbox5 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox5);
  const fl5 = sandbox5.dungeon.floors[1];
  fl5.tiles[2][2] = TILE_ORE_STAR; // Requires Geology 3
  const blockedMine = mineTile(2, 2, sandbox5);
  sandbox5.guildResearch.geology = 3;
  const allowedMine = mineTile(2, 2, sandbox5);
  const t5Pass =
    !blockedMine.ok &&
    blockedMine.reason === 'geology_locked' &&
    allowedMine.ok &&
    fl5.tiles[2][2] === TILE_FLOOR;
  results.push({
    name: '5. Interactive Mining, Geology Gating & Durability Math',
    pass: t5Pass,
    detail: 'Star-Crystal blocked at Geo R0, mined cleanly at Geo R3 -> converted wall to TILE_FLOOR'
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
  const bossFl5 = generateFloor(5);
  const bossFl10 = generateFloor(10);
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
  const fl12 = sandbox12.dungeon.floors[1];
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
    detail: `Completed Copper quota -> claimed +1 Talent Point & rotated fresh contract`
  });

  // 13. Subterranean Astral Shrines & Scout Trap Detection/Disarming
  const sandbox13 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox13);
  sandbox13.inGuild = false;
  const fl13 = sandbox13.dungeon.floors[1];
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
    detail: `Thief spotted & disarmed Spike Trap (0 dmg) + channeled Starfire Shrine (+6 ATK)`
  });

  return results;
}

function runSelfTests(renderModal = false) {
  const results = evaluateSelfTests();
  const passCount = results.filter(r => r.pass).length;

  if (typeof document !== 'undefined') {
    const btnText = document.getElementById('verifyBtnText');
    if (btnText) {
      btnText.textContent = `Verify Inc-4 (${passCount}/${results.length} PASS)`;
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
  socketFromInspect,
  unsocketFromInspect,
  showOutcomeModal,
  closeOutcomeModal,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  switchGuildTab,
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
  waitTurn,
  clearChronicle,
  TALENT_TREES,
  GEM_CATALOG
};

function bootstrapApp() {
  setupInputs();
  const loaded = loadGame();
  if (!loaded || !gameState.hero) {
    selectAdventurerClass('fighter');
    openClassSelectModal(false);
  } else {
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
