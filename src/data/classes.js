// Canonical Playable Classes Registry (5 Entry-Tier + Preserved Legacy Prototype Classes)
// Five foundational attributes: STR, DEX, INT, VIT, SPI (HR-13)

export const HERO_ATTRIBUTE_KEYS = ['str', 'dex', 'int', 'vit', 'spi'];
export const DEFAULT_HERO_SPI = 10;
// Provisional per-level automatic attribute growth fallback (~1.5 total/level across 5 attributes; HR-14.1)
export const DEFAULT_LEVEL_GROWTH = { str: 0.3, dex: 0.3, int: 0.3, vit: 0.3, spi: 0.3 };

// Narrow legacy class ID normalization map (MG-01C): fighter -> bruiser, cleric -> acolyte
export const LEGACY_CLASS_ID_MAP = Object.freeze({
  fighter: 'bruiser',
  cleric: 'acolyte'
});

export function normalizeHeroClassId(classId) {
  if (!classId || typeof classId !== 'string') return classId;
  const key = classId.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LEGACY_CLASS_ID_MAP, key)) {
    return LEGACY_CLASS_ID_MAP[key];
  }
  return key;
}

export const CLASSES = {
  bruiser: {
    id: 'bruiser',
    name: 'Bruiser',
    title: 'Iron Vanguard',
    color: '#f87171',
    canEnterDungeon: true,
    baseStats: { str: 15, dex: 10, int: 8, vit: 14, spi: 8 },
    levelGrowth: { str: 0.6, dex: 0.25, int: 0.1, vit: 0.55, spi: 0.1 },
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
    skillName: 'Power Strike',
    skillCost: 0,
    skillRange: 1,
    skillDesc: 'Enhanced single-target physical strike (0 MP, 2t CD).'
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    title: 'Shadow Strider',
    color: '#c084fc',
    canEnterDungeon: true,
    baseStats: { str: 9, dex: 16, int: 11, vit: 10, spi: 9 },
    levelGrowth: { str: 0.2, dex: 0.65, int: 0.25, vit: 0.25, spi: 0.15 },
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
    canEnterDungeon: true,
    baseStats: { str: 7, dex: 10, int: 17, vit: 10, spi: 13 },
    levelGrowth: { str: 0.1, dex: 0.2, int: 0.7, vit: 0.2, spi: 0.4 },
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
    canEnterDungeon: true,
    baseStats: { str: 12, dex: 15, int: 11, vit: 11, spi: 10 },
    levelGrowth: { str: 0.3, dex: 0.6, int: 0.2, vit: 0.3, spi: 0.2 },
    hpBase: 95,
    mpBase: 45,
    vision: 7,
    starterGear: {
      weapon:    { uid: 'w_start_r', name: 'Recurve Shortbow', slot: 'weapon', rarity: 'common', atk: 6, dex: 2, weaponClass: 'ranged', isRanged: true, range: 5, value: 20, affixes: [] },
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
    canEnterDungeon: true,
    baseStats: { str: 14, dex: 9, int: 12, vit: 15, spi: 14 },
    levelGrowth: { str: 0.45, dex: 0.15, int: 0.2, vit: 0.45, spi: 0.35 },
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
  },
  adventurer: {
    id: 'adventurer',
    name: 'Adventurer',
    title: 'Starfall Delver',
    color: '#38bdf8',
    canEnterDungeon: true,
    baseStats: { str: 12, dex: 12, int: 11, vit: 13, spi: 10 },
    levelGrowth: { str: 0.35, dex: 0.35, int: 0.25, vit: 0.35, spi: 0.2 },
    hpBase: 108,
    mpBase: 50,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_a', name: 'Delver Shortsword', slot: 'weapon', rarity: 'common', atk: 7, dex: 1, value: 20, affixes: [] },
      armor:     { uid: 'a_start_a', name: 'Expedition Brigandine', slot: 'armor', rarity: 'common', def: 5, vit: 1, value: 20, affixes: [] },
      helm:      { uid: 'h_start_a', name: 'Lantern Cap', slot: 'helm', rarity: 'common', def: 2, visionBonus: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_a', name: 'Wayfarer Boots', slot: 'boots', rarity: 'common', def: 2, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_a', name: 'Guild Compass', slot: 'accessory', rarity: 'common', crit: 3, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_a', name: 'Reinforced Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 34, maxDur: 34, value: 25, affixes: [] }
    },
    passiveName: 'Delver Grit',
    passiveDesc: 'Balanced dungeon explorer with +1 Torchlight vision and durable mining pickaxe.',
    skillName: 'Torch Flare',
    skillCost: 11,
    skillRange: 1,
    skillDesc: 'Blasts an adjacent foe with searing torchlight for 180% damage and stuns them for 1 turn.'
  },
  acolyte: {
    id: 'acolyte',
    name: 'Acolyte',
    title: 'Temple Devotee',
    color: '#fef08a',
    canEnterDungeon: true,
    baseStats: { str: 10, dex: 9, int: 15, vit: 13, spi: 16 },
    levelGrowth: { str: 0.15, dex: 0.15, int: 0.45, vit: 0.3, spi: 0.55 },
    hpBase: 100,
    mpBase: 65,
    vision: 5,
    starterGear: {
      weapon:    { uid: 'w_start_c', name: 'Sanctified Rod', slot: 'weapon', rarity: 'common', atk: 5, int: 2, value: 20, affixes: [] },
      armor:     { uid: 'a_start_c', name: 'Acolyte Vestments', slot: 'armor', rarity: 'common', def: 5, maxMp: 10, value: 20, affixes: [] },
      helm:      { uid: 'h_start_c', name: 'Temple Hood', slot: 'helm', rarity: 'common', def: 2, int: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_c', name: 'Sanctuary Sandals', slot: 'boots', rarity: 'common', def: 2, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_c', name: 'Blessing Charm', slot: 'accessory', rarity: 'common', maxHp: 10, maxMp: 8, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_c', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 28, maxDur: 28, value: 25, affixes: [] }
    },
    passiveName: 'Sanctuary Ward',
    passiveDesc: '+5 Armor & restores +1 MP every 2 turns.',
    skillName: 'Sacred Flame',
    skillCost: 8,
    skillRange: 4,
    skillDesc: 'Calls down radiant divine fire on a visible enemy within 4 tiles (+35% vs Undead/Corrupted).'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    title: 'Frontier Pathfinder',
    color: '#10b981',
    canEnterDungeon: true,
    baseStats: { str: 10, dex: 15, int: 14, vit: 11, spi: 10 },
    levelGrowth: { str: 0.2, dex: 0.55, int: 0.4, vit: 0.25, spi: 0.2 },
    hpBase: 94,
    mpBase: 40,
    vision: 7,
    starterGear: {
      weapon:    { uid: 'w_start_s', name: 'Hunting Shortbow', slot: 'weapon', rarity: 'common', atk: 6, dex: 2, weaponClass: 'ranged', isRanged: true, range: 5, value: 20, affixes: [] },
      armor:     { uid: 'a_start_s', name: 'Outrider Jerkin', slot: 'armor', rarity: 'common', def: 4, dodge: 5, value: 20, affixes: [] },
      helm:      { uid: 'h_start_s', name: 'Pathfinder Hood', slot: 'helm', rarity: 'common', def: 1, visionBonus: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_s', name: 'Strider Boots', slot: 'boots', rarity: 'common', def: 1, dodge: 4, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_s', name: 'Trail Compass', slot: 'accessory', rarity: 'common', crit: 4, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_s', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 26, maxDur: 26, value: 25, affixes: [] }
    },
    passiveName: 'Wilderness Keenness',
    passiveDesc: '7-tile vision, ranged marksmanship, wilderness tracking, and frontier survival expertise.',
    skillName: 'Aimed Shot',
    skillCost: 0,
    skillRange: 6,
    skillDesc: 'Focused ranged shot requiring a ranged weapon (0 MP, 2t CD).'
  }
};

// Canonical MG-01C entry-tier class-to-guild bindings
export const CLASS_CATALOG_BINDINGS = Object.freeze({
  bruiser:    { runtimeClassId: 'bruiser',    displayRole: 'Bruiser',    guild: 'Fighters Guild',      buildingId: 'fighters_guild',      tier: 'entry', bindingType: 'direct' },
  mage:       { runtimeClassId: 'mage',       displayRole: 'Mage',       guild: 'Mages Guild',         buildingId: 'mages_guild',         tier: 'entry', bindingType: 'direct' },
  acolyte:    { runtimeClassId: 'acolyte',    displayRole: 'Acolyte',    guild: 'Temple Chapterhouse', buildingId: 'temple_chapterhouse', tier: 'entry', bindingType: 'direct' },
  scout:      { runtimeClassId: 'scout',      displayRole: 'Scout',      guild: 'Rangers Lodge',       buildingId: 'rangers_lodge',       tier: 'entry', bindingType: 'direct' },
  adventurer: { runtimeClassId: 'adventurer', displayRole: 'Adventurer', guild: 'Adventurers Guild',   buildingId: 'guild_hall',          tier: 'entry', bindingType: 'direct' }
});

// Fail-closed canonical dungeon eligibility evaluators (HR-12 / MG-01C).
// Entities/classes without explicit canEnterDungeon === true are ineligible by default.
export function isClassDungeonEligible(classId) {
  if (!classId || typeof classId !== 'string') return false;
  const canonicalId = normalizeHeroClassId(classId);
  const cls = CLASSES[canonicalId];
  return Boolean(cls && cls.canEnterDungeon === true);
}

export function isHeroDungeonEligible(hero) {
  if (!hero || typeof hero !== 'object') return false;
  if (hero.canEnterDungeon === false) return false;
  return isClassDungeonEligible(hero.classId);
}
