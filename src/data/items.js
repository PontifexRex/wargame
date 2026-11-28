// Equipment Base Archetypes, Affix Pools, Canonical Normalization, Scoring & Shop Catalog (IS-01)

import { RARITY } from '../constants.js';
import { GEM_CATALOG } from './gems.js';

export { RARITY };

// Migration-only historical flat bonuses baked by legacy City Lapidary SOCKET_CITY_GEM.
// Never used for live stat calculations (live gem stats come strictly from GEM_CATALOG).
const LEGACY_CITY_GEM_BONUSES = {
  ruby:         { atk: 4, def: 0, hp: 0,  mp: 0 },
  emerald:      { atk: 1, def: 3, hp: 0,  mp: 0 },
  sapphire:     { atk: 2, def: 0, hp: 0,  mp: 15 },
  topaz:        { atk: 0, def: 2, hp: 20, mp: 0 },
  void_diamond: { atk: 6, def: 4, hp: 10, mp: 10 }
};

export const ITEM_BASE_ARCHETYPES = {
  weapon: [
    {
      id: 'wep_cleaver',
      slot: 'weapon',
      name: 'Obsidian Cleaver',
      profile: 'heavy_physical',
      atkMult: 1.20,
      strBase: 1,
      desc: 'Heavy melee blade favoring raw physical damage.'
    },
    {
      id: 'wep_blade',
      slot: 'weapon',
      name: 'Star-Shard Blade',
      profile: 'finesse',
      atkMult: 0.90,
      critBase: 5,
      critPerDepth: 0.8,
      dexBase: 1,
      desc: 'Balanced finesse blade trading raw ATK for precision and Crit.'
    },
    {
      id: 'wep_staff',
      slot: 'weapon',
      name: 'Astral Focus Staff',
      profile: 'arcane',
      atkMult: 0.55,
      magicBase: 6,
      magicPerDepth: 2.2,
      maxMpBase: 8,
      maxMpPerDepth: 2.0,
      intBase: 2,
      desc: 'Arcane staff channeling Magic Power, INT, and Max MP.'
    },
    {
      id: 'wep_mace',
      slot: 'weapon',
      name: 'Sanctified Mace',
      profile: 'sacred',
      atkMult: 0.85,
      magicBase: 4,
      magicPerDepth: 1.6,
      spiBase: 2,
      desc: 'Consecrated mace balancing physical strikes with SPI and Magic Power.'
    },
    {
      id: 'wep_shortbow',
      slot: 'weapon',
      name: 'Hunting Shortbow',
      profile: 'ranged',
      weaponClass: 'ranged',
      isRanged: true,
      range: 5,
      atkMult: 0.92,
      critBase: 4,
      critPerDepth: 0.7,
      dexBase: 2,
      desc: 'Ranged bow enabling Scout Aimed Shot and precision skirmishing.'
    }
  ],
  armor: [
    {
      id: 'arm_plate',
      slot: 'armor',
      name: 'Star-Forged Plate',
      profile: 'heavy_armor',
      defMult: 1.25,
      maxHpBase: 12,
      maxHpPerDepth: 4.5,
      desc: 'Heavy plate maximizing physical Defense and Max HP.'
    },
    {
      id: 'arm_brigandine',
      slot: 'armor',
      name: 'Deepwood Brigandine',
      profile: 'light_armor',
      defMult: 0.85,
      dodgeBase: 4,
      dodgePerDepth: 0.7,
      dexBase: 1,
      desc: 'Flexible light armor trading heavy DEF for Dodge and agility.'
    },
    {
      id: 'arm_vestments',
      slot: 'armor',
      name: 'Astral Vestments',
      profile: 'mystic_vestments',
      defMult: 0.65,
      wardBase: 2,
      wardPerDepth: 0.5,
      maxMpBase: 10,
      maxMpPerDepth: 2.5,
      spiBase: 1,
      desc: 'Warded mystic robes granting Astral Ward, Max MP, and SPI.'
    }
  ],
  helm: [
    {
      id: 'helm_sallet',
      slot: 'helm',
      name: 'Ironbound Sallet',
      profile: 'heavy_armor',
      defMult: 1.15,
      maxHpBase: 10,
      maxHpPerDepth: 4.0,
      desc: 'Reinforced helm bolstering DEF and Max HP.'
    },
    {
      id: 'helm_hood',
      slot: 'helm',
      name: 'Starweaver Hood',
      profile: 'arcane',
      defMult: 0.70,
      magicBase: 3,
      magicPerDepth: 1.1,
      maxMpBase: 8,
      maxMpPerDepth: 2.0,
      desc: 'Runed hood enhancing Magic Power and Max MP.'
    },
    {
      id: 'helm_mask',
      slot: 'helm',
      name: 'Stalker Mask',
      profile: 'finesse',
      defMult: 0.85,
      critBase: 3,
      critPerDepth: 0.6,
      dexBase: 1,
      desc: 'Light scouting visor sharpening Crit chance.'
    }
  ],
  boots: [
    {
      id: 'boots_greaves',
      slot: 'boots',
      name: 'Dwarven Marchers',
      profile: 'heavy_armor',
      defMult: 1.30,
      maxHpBase: 8,
      maxHpPerDepth: 3.0,
      wardBase: 1,
      wardPerDepth: 0.3,
      desc: 'Sturdy greaves reinforcing DEF, Max HP, and Ward.'
    },
    {
      id: 'boots_treads',
      slot: 'boots',
      name: 'Windrunner Boots',
      profile: 'light_armor',
      defMult: 0.80,
      dodgeBase: 3,
      dodgePerDepth: 1.1,
      desc: 'Supple boots prioritizing Dodge.'
    }
  ],
  accessory: [
    {
      id: 'acc_signet',
      slot: 'accessory',
      name: 'Vespera Signet',
      profile: 'finesse',
      critBase: 4,
      critPerDepth: 1.0,
      atkBase: 2,
      atkPerDepth: 0.8,
      desc: 'Combat signet boosting Crit and ATK.'
    },
    {
      id: 'acc_amulet',
      slot: 'accessory',
      name: 'Astral Lens Charm',
      profile: 'arcane',
      magicBase: 4,
      magicPerDepth: 1.4,
      maxMpBase: 10,
      maxMpPerDepth: 3.0,
      intBase: 1,
      desc: 'Arcane focus boosting Magic Power, INT, and Max MP.'
    },
    {
      id: 'acc_pendant',
      slot: 'accessory',
      name: 'Pendant of Dawn',
      profile: 'sacred',
      spiBase: 2,
      wardBase: 2,
      wardPerDepth: 0.4,
      maxHpBase: 10,
      maxHpPerDepth: 3.0,
      desc: 'Sacred pendant reinforcing SPI, Ward, and Max HP.'
    }
  ]
};

export function getItemBaseArchetype(archetypeId) {
  if (!archetypeId || typeof archetypeId !== 'string') return null;
  const slots = Object.keys(ITEM_BASE_ARCHETYPES);
  for (let i = 0; i < slots.length; i++) {
    const list = ITEM_BASE_ARCHETYPES[slots[i]];
    for (let j = 0; j < list.length; j++) {
      if (list[j].id === archetypeId) return list[j];
    }
  }
  return null;
}

export const AFFIX_POOL = [
  { id: 'atk',        label: 'of Ferocity',          stat: 'atk',        min: 2,  max: 6,  slots: ['weapon', 'accessory'] },
  { id: 'def',        label: 'of the Bulwark',       stat: 'def',        min: 2,  max: 6,  slots: ['armor', 'helm', 'boots'] },
  { id: 'str',        label: 'of Might',             stat: 'str',        min: 1,  max: 4,  slots: ['weapon', 'armor', 'helm'] },
  { id: 'dex',        label: 'of Precision',         stat: 'dex',        min: 1,  max: 4,  slots: ['weapon', 'boots', 'accessory'] },
  { id: 'int',        label: 'of Astral Lore',       stat: 'int',        min: 1,  max: 4,  slots: ['weapon', 'helm', 'accessory'] },
  { id: 'vit',        label: 'of Fortitude',         stat: 'vit',        min: 1,  max: 4,  slots: ['armor', 'helm', 'boots'] },
  { id: 'spi',        label: 'of Devotion',          stat: 'spi',        min: 1,  max: 4,  slots: ['weapon', 'armor', 'helm', 'accessory'] },
  { id: 'magicPower', label: 'of Spellcraft',        stat: 'magicPower', min: 3,  max: 8,  slots: ['weapon', 'helm', 'accessory'] },
  { id: 'crit',       label: 'of Keen Sight',        stat: 'crit',       min: 3,  max: 9,  slots: ['weapon', 'accessory', 'helm'] },
  { id: 'dodge',      label: 'of the Zephyr',        stat: 'dodge',      min: 3,  max: 8,  slots: ['boots', 'armor', 'accessory'] },
  { id: 'maxHp',      label: 'of Lifeblood',         stat: 'maxHp',      min: 12, max: 35, slots: ['armor', 'helm', 'accessory'] },
  { id: 'maxMp',      label: 'of the Leyline',       stat: 'maxMp',      min: 10, max: 28, slots: ['helm', 'accessory', 'weapon'] },
  { id: 'thorns',     label: 'of Retaliation',       stat: 'thorns',     min: 3,  max: 8,  slots: ['armor', 'helm', 'boots'] },
  { id: 'leech',      label: 'of the Blood Drinker', stat: 'leech',      min: 2,  max: 6,  slots: ['weapon', 'accessory'] },
  { id: 'ward',       label: 'of Astral Warding',    stat: 'ward',       min: 2,  max: 5,  slots: ['armor', 'helm', 'accessory'] }
];

// Preserved for legacy callers; procedural generation now uses ITEM_BASE_ARCHETYPES.
export const BASE_GEAR_NAMES = {
  weapon:    ['Star-Shard Blade', 'Runed Broadsword', 'Sanctified Mace', 'Astral Focus Staff', 'Obsidian Cleaver'],
  armor:     ['Astral Vestments', 'Deepwood Brigandine', 'Star-Forged Plate', 'Shadowalker Coat', 'Runed Cuirass'],
  helm:      ['Visor of the Deep', 'Starweaver Hood', 'Ironbound Sallet', 'Astral Crown', 'Stalker Mask'],
  boots:     ['Greaves of Striding', 'Silent Sabatons', 'Starlight Treads', 'Dwarven Marchers', 'Windrunner Boots'],
  accessory: ['Vespera Signet', 'Astral Lens Charm', 'Pendant of Dawn', 'Bloodstone Ring', 'Star-Core Amulet']
};

export function isRangedWeaponItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.isRanged === true || item.weaponClass === 'ranged') return true;
  if (item.archetypeId === 'wep_shortbow') return true;
  const nm = String(item.name || '').toLowerCase();
  return nm.indexOf('bow') !== -1 || nm.indexOf('crossbow') !== -1 || nm.indexOf('sling') !== -1;
}

export const SHOP_ITEMS = [
  { id: 'buy_heal',   name: 'Healing Tonic',             type: 'consumable', cost: 18,  reqQM: 0, desc: 'Restores 45% Max HP & cures Bleed/Poison.' },
  { id: 'buy_recall', name: 'Astral Recall Scroll',      type: 'consumable', cost: 30,  reqQM: 0, desc: 'Safely extracts you & your pack from any floor.' },
  { id: 'buy_pick_1', name: 'Dwarven Steel Pickaxe',     type: 'gear', slot: 'pickaxe',   rarity: 'uncommon', maxDur: 50,  cost: 65,  reqQM: 0, desc: '50 Base Durability.' },
  { id: 'buy_wep_1',  name: 'Vespera Runeblade',         type: 'gear', slot: 'weapon',    rarity: 'rare',     atk: 14, crit: 6, cost: 115, reqQM: 1, desc: '+14 ATK, +6% Crit.' },
  { id: 'buy_arm_1',  name: 'Carapace of the Deep',      type: 'gear', slot: 'armor',     rarity: 'rare',     def: 11, maxHp: 25, cost: 115, reqQM: 1, desc: '+11 DEF, +25 Max HP.' },
  { id: 'buy_pick_2', name: 'Mithril Star-Pickaxe',      type: 'gear', slot: 'pickaxe',   rarity: 'rare',     maxDur: 85,  cost: 145, reqQM: 1, desc: '85 Base Durability.' },
  { id: 'buy_acc_2',  name: 'Amulet of the Fallen Star', type: 'gear', slot: 'accessory', rarity: 'epic',     atk: 6, magicPower: 8, maxHp: 35, crit: 8, cost: 240, reqQM: 2, desc: '+6 ATK, +8 MAG, +35 HP, +8% Crit.' },
  { id: 'buy_pick_3', name: 'Titanium Master Pick',      type: 'gear', slot: 'pickaxe',   rarity: 'epic',     maxDur: 140, cost: 260, reqQM: 2, desc: '140 Base Durability.' },
  { id: 'buy_wep_3',  name: 'Eclipse, Blade of Vespera', type: 'gear', slot: 'weapon',    rarity: 'relic',    atk: 28, str: 5, crit: 14, cost: 520, reqQM: 3, desc: '+28 ATK, +5 STR, +14% Crit.' },
  { id: 'buy_pick_4', name: 'Void Astralite Drill',      type: 'gear', slot: 'pickaxe',   rarity: 'relic',    maxDur: 240, cost: 450, reqQM: 3, desc: '240 Base Durability.' }
];

export const ELITE_AFFIXES = [
  { id: 'vampiric',   name: 'Vampiric',      color: '#f87171', desc: 'Heals for 40% of damage dealt' },
  { id: 'molten',     name: 'Molten',        color: '#fb923c', desc: 'Inflicts Burn on hit' },
  { id: 'venomous',   name: 'Venomous',      color: '#4ade80', desc: 'Inflicts Poison on hit' },
  { id: 'fortified',  name: 'Fortified',     color: '#60a5fa', desc: '+35% Defense & HP' },
  { id: 'reflective', name: 'Reflective',    color: '#ec4899', desc: 'Reflects 25% thorns damage back to attacker' },
  { id: 'chilling',   name: 'Chilling',      color: '#38bdf8', desc: 'Inflicts Chilled on hit (-15% Dodge, +2 Skill MP)' },
  { id: 'temporal',   name: 'Temporal Warp', color: '#a855f7', desc: '40% chance on damage to phase-shift away' },
  { id: 'volatile',   name: 'Volatile',      color: '#ef4444', desc: 'Detonates upon defeat for 150% ATK damage in 1-tile radius' }
];

// Canonical, idempotent equipment item normalizer shared by Strategy & Dungeon engines (IS-01).
// Canonical fields: maxHp, maxMp, curDur, maxDur, maxSockets (number), sockets (string[]), affixes ([]), locked (bool).
export function normalizeEquipmentItem(item) {
  if (!item || typeof item !== 'object') return null;

  item.locked = Boolean(item.locked);
  if (!Array.isArray(item.affixes)) {
    item.affixes = [];
  }

  // 1. Legacy hp / mp bonus normalization (only when canonical maxHp/maxMp is absent)
  if (typeof item.hp === 'number' && isFinite(item.hp)) {
    if (typeof item.maxHp !== 'number' || !isFinite(item.maxHp)) {
      if (item.hp > 0) item.maxHp = item.hp;
    }
    delete item.hp;
  }
  if (typeof item.mp === 'number' && isFinite(item.mp)) {
    if (typeof item.maxMp !== 'number' || !isFinite(item.maxMp)) {
      if (item.mp > 0) item.maxMp = item.mp;
    }
    delete item.mp;
  }

  // 2. Pickaxe durability canonicalization (curDur / maxDur) and zero combat sockets
  if (item.slot === 'pickaxe') {
    const rawMaxD = (typeof item.maxDur === 'number' && isFinite(item.maxDur) && item.maxDur > 0)
      ? item.maxDur
      : ((typeof item.maxDurability === 'number' && isFinite(item.maxDurability) && item.maxDurability > 0) ? item.maxDurability : 28);
    const rawCurD = (typeof item.curDur === 'number' && isFinite(item.curDur))
      ? item.curDur
      : ((typeof item.durability === 'number' && isFinite(item.durability)) ? item.durability : rawMaxD);
    item.maxDur = Math.max(1, Math.round(rawMaxD));
    item.curDur = Math.max(0, Math.min(item.maxDur, Math.round(rawCurD)));
    if (item.durability !== undefined) delete item.durability;
    if (item.maxDurability !== undefined) delete item.maxDurability;
    item.maxSockets = 0;
    item.sockets = [];
    if (item.gems !== undefined) delete item.gems;
    return item;
  }

  // 3. Socket & Legacy City Gem Migration (distinguishes pure legacy vs canonical vs ambiguous mixed shape)
  const socketsIsArray = Array.isArray(item.sockets);
  const hasLegacyGemsArray = Array.isArray(item.gems);
  const socketsIsNumericLike = (typeof item.sockets === 'number' && isFinite(item.sockets)) ||
    (typeof item.sockets === 'string' && /^\d+$/.test(item.sockets));

  if (!socketsIsArray && (socketsIsNumericLike || hasLegacyGemsArray)) {
    // Pure legacy City Blacksmith/Lapidary shape: numeric sockets + gems[] (with historically baked bonuses)
    const legacyCap = socketsIsNumericLike ? Math.max(0, parseInt(item.sockets, 10) || 0) : 0;
    const legacyGems = hasLegacyGemsArray ? item.gems.slice() : [];
    const existingMax = (typeof item.maxSockets === 'number' && isFinite(item.maxSockets)) ? item.maxSockets : 0;
    item.maxSockets = Math.max(existingMax, legacyCap, legacyGems.length);

    // Reverse proven historical baked bonuses ONCE before moving gems to canonical sockets[]
    if (!item._legacyGemsMigrated && legacyGems.length > 0) {
      for (let gi = 0; gi < legacyGems.length; gi++) {
        const gId = legacyGems[gi];
        const hist = LEGACY_CITY_GEM_BONUSES[gId];
        if (!hist) continue; // Preserve unknown gem IDs without guessing stats
        if (hist.atk && typeof item.atk === 'number') item.atk = Math.max(0, item.atk - hist.atk);
        if (hist.def && typeof item.def === 'number') item.def = Math.max(0, item.def - hist.def);
        if (hist.hp && typeof item.maxHp === 'number') item.maxHp = Math.max(0, item.maxHp - hist.hp);
        if (hist.mp && typeof item.maxMp === 'number') item.maxMp = Math.max(0, item.maxMp - hist.mp);
      }
      item._legacyGemsMigrated = true;
    }

    item.sockets = legacyGems;
    if (item.gems !== undefined) delete item.gems;
  } else if (socketsIsArray && hasLegacyGemsArray) {
    // Mixed shape: canonical sockets[] already exists alongside legacy gems[]
    if (item.sockets.length === 0 && item.gems.length > 0 && !item._legacyGemsMigrated) {
      // Safe recovery: canonical array was empty (e.g. old normalizeEquipmentSockets clobbered numeric sockets)
      const recovered = item.gems.slice();
      for (let gi = 0; gi < recovered.length; gi++) {
        const hist = LEGACY_CITY_GEM_BONUSES[recovered[gi]];
        if (!hist) continue;
        if (hist.atk && typeof item.atk === 'number') item.atk = Math.max(0, item.atk - hist.atk);
        if (hist.def && typeof item.def === 'number') item.def = Math.max(0, item.def - hist.def);
        if (hist.hp && typeof item.maxHp === 'number') item.maxHp = Math.max(0, item.maxHp - hist.hp);
        if (hist.mp && typeof item.maxMp === 'number') item.maxMp = Math.max(0, item.maxMp - hist.mp);
      }
      item._legacyGemsMigrated = true;
      item.sockets = recovered;
      item.maxSockets = Math.max(typeof item.maxSockets === 'number' ? item.maxSockets : 0, recovered.length);
      delete item.gems;
    } else if (item.gems.length === 0) {
      delete item.gems;
    } else {
      // Ambiguous non-empty mixed shape: preserve canonical sockets[] without destructive guessing
      item._migrationWarning = 'mixed_sockets_and_gems_preserved';
    }
  } else {
    if (!socketsIsArray) {
      item.sockets = [];
    }
  }

  if (typeof item.maxSockets !== 'number' || !isFinite(item.maxSockets)) {
    if (item.rarity === 'relic') item.maxSockets = 2;
    else if (item.rarity === 'epic' || item.rarity === 'rare') item.maxSockets = 1;
    else item.maxSockets = 0;
  }
  if (item.sockets.length > item.maxSockets) {
    item.maxSockets = item.sockets.length;
  }

  return item;
}

// Aggregates canonical item stats + socketed GEM_CATALOG bonuses ONCE (never mutates item).
export function getEffectiveItemBonuses(item) {
  const out = {
    atk: 0, def: 0, magicPower: 0,
    maxHp: 0, maxMp: 0, crit: 0, dodge: 0,
    str: 0, dex: 0, int: 0, vit: 0, spi: 0,
    thorns: 0, leech: 0, ward: 0, visionBonus: 0,
    maxDur: 0
  };
  if (!item || typeof item !== 'object') return out;

  out.atk += item.atk || 0;
  out.def += item.def || 0;
  out.magicPower += item.magicPower || 0;
  out.maxHp += (typeof item.maxHp === 'number' ? item.maxHp : (item.hp || 0));
  out.maxMp += (typeof item.maxMp === 'number' ? item.maxMp : (item.mp || 0));
  out.crit += item.crit || 0;
  out.dodge += item.dodge || 0;
  out.str += item.str || 0;
  out.dex += item.dex || 0;
  out.int += item.int || 0;
  out.vit += item.vit || 0;
  out.spi += item.spi || 0;
  out.thorns += item.thorns || 0;
  out.leech += item.leech || 0;
  out.ward += item.ward || 0;
  out.visionBonus += item.visionBonus || 0;
  out.maxDur += (typeof item.maxDur === 'number' ? item.maxDur : (item.maxDurability || 0));

  if (Array.isArray(item.sockets)) {
    for (let i = 0; i < item.sockets.length; i++) {
      const gem = GEM_CATALOG[item.sockets[i]];
      if (!gem || !gem.bonuses) continue;
      const gb = gem.bonuses;
      if (gb.atk) out.atk += gb.atk;
      if (gb.def) out.def += gb.def;
      if (gb.magicPower) out.magicPower += gb.magicPower;
      if (gb.maxHp) out.maxHp += gb.maxHp;
      if (gb.maxMp) out.maxMp += gb.maxMp;
      if (gb.crit) out.crit += gb.crit;
      if (gb.dodge) out.dodge += gb.dodge;
      if (gb.str) out.str += gb.str;
      if (gb.dex) out.dex += gb.dex;
      if (gb.int) out.int += gb.int;
      if (gb.vit) out.vit += gb.vit;
      if (gb.spi) out.spi += gb.spi;
      if (gb.visionBonus) out.visionBonus += gb.visionBonus;
    }
  }
  return out;
}

// General context-neutral equipment power score (accounts for all supported stats + gems once).
export function computeItemPowerScore(item) {
  if (!item) return 0;
  if (item.slot === 'pickaxe') {
    const dur = typeof item.maxDur === 'number' ? item.maxDur : (item.maxDurability || 0);
    return Math.round(dur * 0.5 + (item.tier || 0) * 10);
  }
  const b = getEffectiveItemBonuses(item);
  const openSockets = Math.max(0, (item.maxSockets || 0) - (Array.isArray(item.sockets) ? item.sockets.length : 0));
  return Math.round(
    b.atk * 2.0 +
    b.def * 2.0 +
    b.magicPower * 2.0 +
    b.maxHp * 0.25 +
    b.maxMp * 0.25 +
    b.crit * 1.5 +
    b.dodge * 1.5 +
    (b.str + b.dex + b.int + b.vit + b.spi) * 1.2 +
    b.thorns * 1.5 +
    b.leech * 2.0 +
    b.ward * 2.0 +
    b.visionBonus * 3.0 +
    openSockets * 4.0
  );
}

// Lightweight, explicit, provisional class preference weights grounded in heroStats.js & combat.js scaling.
export const CLASS_ITEM_PREFERENCE_WEIGHTS = {
  bruiser:    { atk: 2.6, def: 2.2, magicPower: 0.2, maxHp: 0.35, maxMp: 0.10, crit: 1.3, dodge: 1.0, str: 2.2, dex: 1.0, int: 0.2, vit: 2.0, spi: 0.2, thorns: 1.8, leech: 2.4, ward: 2.0, visionBonus: 1.5 },
  thief:      { atk: 2.3, def: 1.4, magicPower: 0.2, maxHp: 0.20, maxMp: 0.15, crit: 2.5, dodge: 2.2, str: 1.1, dex: 2.4, int: 0.3, vit: 1.0, spi: 0.2, thorns: 0.8, leech: 2.2, ward: 1.4, visionBonus: 2.0 },
  ranger:     { atk: 2.3, def: 1.5, magicPower: 0.2, maxHp: 0.20, maxMp: 0.15, crit: 2.3, dodge: 2.4, str: 1.1, dex: 2.4, int: 0.3, vit: 1.0, spi: 0.2, thorns: 0.8, leech: 1.8, ward: 1.5, visionBonus: 3.0 },
  scout:      { atk: 2.2, def: 1.4, magicPower: 0.4, maxHp: 0.22, maxMp: 0.18, crit: 2.2, dodge: 2.3, str: 1.0, dex: 2.4, int: 1.4, vit: 1.1, spi: 0.5, thorns: 0.7, leech: 1.5, ward: 1.4, visionBonus: 3.0 },
  mage:       { atk: 0.6, def: 1.3, magicPower: 2.8, maxHp: 0.20, maxMp: 0.40, crit: 1.4, dodge: 1.3, str: 0.3, dex: 0.8, int: 2.6, vit: 1.0, spi: 1.2, thorns: 0.6, leech: 0.8, ward: 2.4, visionBonus: 2.0 },
  paladin:    { atk: 2.2, def: 2.3, magicPower: 1.2, maxHp: 0.32, maxMp: 0.22, crit: 1.1, dodge: 0.9, str: 1.8, dex: 0.8, int: 0.8, vit: 2.0, spi: 1.8, thorns: 1.8, leech: 1.8, ward: 2.2, visionBonus: 1.5 },
  acolyte:    { atk: 1.1, def: 1.8, magicPower: 2.6, maxHp: 0.28, maxMp: 0.35, crit: 0.9, dodge: 1.0, str: 0.8, dex: 0.6, int: 1.6, vit: 1.5, spi: 2.6, thorns: 0.8, leech: 1.0, ward: 2.4, visionBonus: 1.5 },
  adventurer: { atk: 2.0, def: 2.0, magicPower: 1.4, maxHp: 0.25, maxMp: 0.25, crit: 1.5, dodge: 1.5, str: 1.4, dex: 1.4, int: 1.2, vit: 1.4, spi: 1.2, thorns: 1.5, leech: 1.8, ward: 2.0, visionBonus: 2.5 }
};

export function computeClassItemPreferenceScore(item, classId) {
  if (!item) return -1;
  if (item.slot === 'pickaxe') {
    return computeItemPowerScore(item);
  }
  const normId = classId === 'fighter' ? 'bruiser' : (classId === 'cleric' ? 'acolyte' : classId);
  const w = (normId && CLASS_ITEM_PREFERENCE_WEIGHTS[normId]) ? CLASS_ITEM_PREFERENCE_WEIGHTS[normId] : null;
  if (!w) return computeItemPowerScore(item);
  const b = getEffectiveItemBonuses(item);
  const openSockets = Math.max(0, (item.maxSockets || 0) - (Array.isArray(item.sockets) ? item.sockets.length : 0));
  return Math.round((
    b.atk * w.atk +
    b.def * w.def +
    b.magicPower * w.magicPower +
    b.maxHp * w.maxHp +
    b.maxMp * w.maxMp +
    b.crit * w.crit +
    b.dodge * w.dodge +
    b.str * w.str +
    b.dex * w.dex +
    b.int * w.int +
    b.vit * w.vit +
    b.spi * w.spi +
    b.thorns * w.thorns +
    b.leech * w.leech +
    b.ward * w.ward +
    b.visionBonus * w.visionBonus +
    openSockets * 4.0
  ) * 100) / 100;
}

export function isItemUpgrade(candidateItem, equipment, classId) {
  if (!candidateItem || !candidateItem.slot) return false;
  if (!equipment) return true;
  const curEq = equipment[candidateItem.slot];
  if (!curEq) return true;
  if (classId) {
    return computeClassItemPreferenceScore(candidateItem, classId) > computeClassItemPreferenceScore(curEq, classId);
  }
  return computeItemPowerScore(candidateItem) > computeItemPowerScore(curEq);
}

export const SLOT_METADATA = {
  helm:      { id: 'helm',      label: 'Head / Helm',         icon: '🪖', placeholder: 'Helm' },
  armor:     { id: 'armor',     label: 'Chest / Body Armor',  icon: '🦺', placeholder: 'Armor' },
  weapon:    { id: 'weapon',    label: 'Main Hand / Weapon',  icon: '⚔️', placeholder: 'Weapon' },
  boots:     { id: 'boots',     label: 'Feet / Boots',        icon: '👢', placeholder: 'Boots' },
  accessory: { id: 'accessory', label: 'Neck / Accessory',    icon: '💍', placeholder: 'Trinket' },
  pickaxe:   { id: 'pickaxe',   label: 'Off-Hand / Pickaxe',  icon: '⛏️', placeholder: 'Pickaxe' },
  shield:    { id: 'shield',    label: 'Off-Hand / Shield',   icon: '🛡️', placeholder: 'Shield' },
  gloves:    { id: 'gloves',    label: 'Hands / Gauntlets',   icon: '🧤', placeholder: 'Gloves' },
  amulet:    { id: 'amulet',    label: 'Necklace / Amulet',   icon: '📿', placeholder: 'Amulet' },
  ring:      { id: 'ring',      label: 'Finger / Ring',       icon: '💍', placeholder: 'Ring' },
  belt:      { id: 'belt',      label: 'Waist / Belt',        icon: '🎗️', placeholder: 'Belt' }
};

export function getItemTypeIcon(itemOrSlot) {
  if (!itemOrSlot) return '📦';
  if (typeof itemOrSlot === 'string') {
    const meta = SLOT_METADATA[itemOrSlot];
    return meta ? meta.icon : '📦';
  }
  if (itemOrSlot.slot && SLOT_METADATA[itemOrSlot.slot]) {
    return SLOT_METADATA[itemOrSlot.slot].icon;
  }
  const idStr = String(itemOrSlot.id || '');
  if (idStr === 'healing_tonic' || idStr === 'buy_heal' || idStr === 'potions') return '🧪';
  if (idStr === 'recall_scroll' || idStr === 'buy_recall' || idStr === 'recalls') return '📜';
  if (itemOrSlot.type === 'Gem') return '◆';
  if (itemOrSlot.type === 'Ore' || ['copper', 'iron', 'mithril', 'geode', 'starcrystal', 'astralite'].includes(idStr) || idStr.indexOf('ore') !== -1) return '🪨';
  return '📦';
}
