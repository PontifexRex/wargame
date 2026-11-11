// Declarative Dungeon Profiles, Layout Styles, Monster/Ore Rosters & Custom Charter Builder

import {
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  MAP_SIZE_PRESETS,
  TILE_ORE_COPPER,
  TILE_ORE_IRON,
  TILE_ORE_MITHRIL,
  TILE_ORE_GEODE,
  TILE_ORE_STAR,
  TILE_ORE_ASTRAL
} from '../constants.js';
import { hashSeedString, randomSeedCode } from '../engine/rng.js';

export const LAYOUT_STYLES = {
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

export const MONSTER_FAMILY_POOLS = {
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

export const ORE_FOCUS_TABLES = {
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

export const BIOME_PALETTES = {
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

export function resolveFloorBiome(cfgOrDungeon, depth = 1) {
  const cfg = (cfgOrDungeon && cfgOrDungeon.config) ? cfgOrDungeon.config : (cfgOrDungeon || {});
  if (cfg.biomeId && BIOME_PALETTES[cfg.biomeId]) {
    return cfg.biomeId;
  }
  const prof = cfg.profileId || '';
  if (prof === 'sunken_quarry') return 'dwarven_catacombs';
  if (prof === 'mycelium_labyrinth') return 'crystalline_caverns';
  if (prof === 'molten_crucible') return 'molten_forgeworks';
  if (prof === 'citadel_ruins' || prof === 'abyssal_rift') return 'vespera_crater';

  const d = Math.max(1, Number(depth) || 1);
  if (d <= 5) return 'dwarven_catacombs';
  if (d <= 10) return 'crystalline_caverns';
  if (d <= 15) return 'molten_forgeworks';
  return 'vespera_crater';
}

export const CURATED_DUNGEON_PROFILES = {
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
  },
  abyssal_rift: {
    profileId: 'abyssal_rift',
    name: 'The Abyssal Rift',
    subtitle: 'Endless Void Fracture • Infinite Strata & Scaling Hazards',
    themeColor: '#c084fc',
    seedPrefix: 'ABYS',
    reqCartography: 1,
    width: 80,
    height: 60,
    sizeTier: 'standard',
    maxDepth: 999,
    baseDangerDepth: 3,
    respectsCartographyPermit: false,
    layoutStyle: 'grand_ruins',
    loopRatio: 0.40,
    vaultRoomCount: 2,
    monsterFamily: 'astral_cult',
    monsterDensityMult: 1.2,
    eliteChance: 0.35,
    oreFocus: 'astral_crystal',
    veinDensityMult: 1.35,
    motherlodeChance: 0.55,
    chestDensityMult: 1.25,
    lootRarityBonus: 0.15,
    shrineDensityMult: 1.1,
    trapDensityMult: 1.25,
    allowedTraps: ['spike', 'flame'],
    biomeId: 'vespera_crater',
    bossSchedule: {
      5: 'boss_colossus',
      10: 'boss_weaver',
      15: 'boss_ignis',
      20: 'boss_vespera',
      25: 'boss_weaver',
      30: 'boss_ignis',
      35: 'boss_colossus',
      40: 'boss_vespera'
    }
  }
};

export function normalizeDungeonConfig(rawCfg) {
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

export function createDungeonInstance(profileOrConfig, options = {}) {
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
    floors: {},
    waypoints: {}
  };
}

export function buildCharteredDungeonInstance(opts = {}) {
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
