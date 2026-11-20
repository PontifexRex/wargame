// Terrain Catalog, Overworld POI Definitions, Unit Archetypes & Hero Class Recruitment Templates

export const OW_TERRAIN_PLAINS = 1;
export const OW_TERRAIN_FOREST = 2;
export const OW_TERRAIN_HILLS = 3;
export const OW_TERRAIN_MOUNTAINS = 4;
export const OW_TERRAIN_WATER = 5;
export const OW_TERRAIN_FERTILE_VALE = 6;

export const OVERWORLD_TERRAIN_DEFS = {
  [OW_TERRAIN_PLAINS]: {
    id: OW_TERRAIN_PLAINS,
    key: 'plains',
    name: 'Sunlit Grasslands',
    symbol: '·',
    color: '#84cc16',
    bgColor: '#15280a',
    borderColor: '#2e4c14',
    marchTimeMs: 3000, // 3.0s per tile at 1x speed (or 10s in marathon ruleset)
    buildable: true,
    passable: true,
    yieldBonus: { food: 1 },
    desc: 'Open fertile grasslands ideal for founding settlements and rapid troop marches.'
  },
  [OW_TERRAIN_FERTILE_VALE]: {
    id: OW_TERRAIN_FERTILE_VALE,
    key: 'fertile_vale',
    name: 'Verdant River Vale',
    symbol: '❀',
    color: '#4ade80',
    bgColor: '#113016',
    borderColor: '#22632d',
    marchTimeMs: 3000,
    buildable: true,
    passable: true,
    yieldBonus: { food: 2, wood: 1 },
    desc: 'Lush alluvial meadow blessed with rich soil—an exceptional site for a primary Bastion.'
  },
  [OW_TERRAIN_FOREST]: {
    id: OW_TERRAIN_FOREST,
    key: 'forest',
    name: 'Elderwood Timberland',
    symbol: '♠',
    color: '#22c55e',
    bgColor: '#0b2414',
    borderColor: '#144426',
    marchTimeMs: 4500,
    buildable: false,
    passable: true,
    resourceType: 'wood',
    harvestAmount: 25,
    desc: 'Dense ancient timber groves. Slows marching units slightly but provides rich lumber.'
  },
  [OW_TERRAIN_HILLS]: {
    id: OW_TERRAIN_HILLS,
    key: 'hills',
    name: 'Granite Highlands',
    symbol: '▲',
    color: '#cbd5e1',
    bgColor: '#222630',
    borderColor: '#384152',
    marchTimeMs: 5500,
    buildable: false,
    passable: true,
    resourceType: 'stone',
    harvestAmount: 25,
    desc: 'Craggy ridges rich in granite and iron seams. High elevation slows transit.'
  },
  [OW_TERRAIN_MOUNTAINS]: {
    id: OW_TERRAIN_MOUNTAINS,
    key: 'mountains',
    name: 'Star-Spire Peaks',
    symbol: '⛰',
    color: '#f1f5f9',
    bgColor: '#333947',
    borderColor: '#4b5563',
    marchTimeMs: Infinity,
    buildable: false,
    passable: false,
    desc: 'Impassable jagged mountain ranges that form natural strategic chokepoints.'
  },
  [OW_TERRAIN_WATER]: {
    id: OW_TERRAIN_WATER,
    key: 'water',
    name: 'Azure Deepwaters',
    symbol: '≈',
    color: '#38bdf8',
    bgColor: '#08263d',
    borderColor: '#0c4a6e',
    marchTimeMs: Infinity,
    buildable: false,
    passable: false,
    desc: 'Deep rivers and lakes impassable to land expeditions.'
  }
};

export const OVERWORLD_POI_DEFS = {
  resource_cache: {
    type: 'resource_cache',
    name: 'Pioneer Supply Cache',
    symbol: '📦',
    color: '#fbbf24',
    bgColor: '#451a03',
    desc: 'Abandoned supply wagons containing seasoned timber and cut stone.'
  },
  timber_camp: {
    type: 'timber_camp',
    name: 'Primeval Timber Grove',
    symbol: '🌲',
    color: '#4ade80',
    bgColor: '#064e3b',
    desc: 'High-yield forestry node that boosts city Sawmill output.'
  },
  stone_outcrop: {
    type: 'stone_outcrop',
    name: 'Dwarven Mason Quarry',
    symbol: '⛏️',
    color: '#cbd5e1',
    bgColor: '#1e293b',
    desc: 'Ancient cut-stone quarry rich in structural blocks.'
  },
  dungeon_entrance: {
    type: 'dungeon_entrance',
    name: 'The Starfall Vaults',
    symbol: 'Ω',
    color: '#f87171',
    bgColor: '#450a0a',
    desc: 'Subterranean gateway plunging into the procedural Starfall Vaults. Requires a Hero-led Party.'
  }
};

export const UNIT_ARCHETYPES = {
  settler: {
    id: 'settler',
    name: 'Pioneer Settler Expedition',
    shortName: 'Pioneer Settler',
    icon: '🚩',
    color: '#fbbf24',
    visionRadius: 4,
    maxHp: 100,
    canFoundCity: true,
    canEnterDungeon: false,
    desc: 'Foundational pioneer column equipped with tools and provisions to establish a new Bastion City.'
  },
  scout: {
    id: 'scout',
    name: 'Outrider Scout',
    shortName: 'Scout',
    icon: '🦅',
    color: '#34d399',
    visionRadius: 6,
    maxHp: 75,
    canFoundCity: false,
    canEnterDungeon: false,
    desc: 'Swift reconnaissance rider with extended line-of-sight and rapid overworld transit.'
  },
  hero_party: {
    id: 'hero_party',
    name: 'Vanguard Delving Party',
    shortName: 'Hero Party',
    icon: '⚔️',
    color: '#60a5fa',
    visionRadius: 5,
    maxHp: 150,
    canFoundCity: false,
    canEnterDungeon: true,
    desc: 'Armed expedition led by a sworn Adventurers Guild Hero capable of entering subterranean dungeons.'
  }
};

export const RECRUITABLE_HERO_CLASSES = [
  {
    classId: 'adventurer',
    name: 'Guild Adventurer',
    title: 'Starfall Delver',
    icon: '🧭',
    color: '#38bdf8',
    costGold: 35,
    costFood: 20,
    baseStats: { str: 12, dex: 12, int: 11, vit: 13, hp: 160, mp: 68, atk: 24, def: 14 },
    specialty: 'Versatile dungeon delver trained at the Adventurers Guild: Torch Flare stun, extra vision, and reinforced mining.'
  },
  {
    classId: 'fighter',
    name: 'Ironclad Fighter',
    title: 'Vanguard Commander',
    icon: '🛡️',
    color: '#f87171',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 15, dex: 10, int: 8, vit: 14, hp: 186, mp: 59, atk: 28, def: 16 },
    specialty: 'Frontline bastion defence, Whirlwind Cleave, and door breaching.'
  },
  {
    classId: 'ranger',
    name: 'Deepwood Ranger',
    title: 'Hawkeye Pathfinder',
    icon: '🏹',
    color: '#34d399',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 12, dex: 15, int: 11, vit: 11, hp: 145, mp: 68, atk: 26, def: 12 },
    specialty: '+2 Overworld Vision, trap disarming, and Starfall Volley.'
  },
  {
    classId: 'mage',
    name: 'Astral Elementalist',
    title: 'Starweaver Adept',
    icon: '✨',
    color: '#60a5fa',
    costGold: 60,
    costFood: 30,
    baseStats: { str: 7, dex: 10, int: 17, vit: 10, hp: 122, mp: 131, atk: 31, def: 10 },
    specialty: 'High-area Starfall Nova and arcane rune-seal dispelling.'
  },
  {
    classId: 'thief',
    name: 'Shadowblade Rogue',
    title: 'Silent Infiltrator',
    icon: '🗡️',
    color: '#c084fc',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 9, dex: 16, int: 11, vit: 10, hp: 130, mp: 78, atk: 27, def: 11 },
    specialty: 'Master lockpicking, secret door discovery, and Shadowstep Strike.'
  },
  {
    classId: 'cleric',
    name: 'Acolyte Cleric',
    title: 'Temple Devotee',
    icon: '✝️',
    color: '#fef08a',
    costGold: 55,
    costFood: 30,
    baseStats: { str: 10, dex: 9, int: 15, vit: 13, hp: 162, mp: 105, atk: 22, def: 15 },
    specialty: 'Entry-level Temple Chapterhouse healer, blessing wards, and undead turning.'
  },
  {
    classId: 'paladin',
    name: 'Radiant Crusader',
    title: 'Dawn Warden',
    icon: '☀️',
    color: '#fbbf24',
    costGold: 65,
    costFood: 35,
    baseStats: { str: 14, dex: 9, int: 12, vit: 15, hp: 195, mp: 86, atk: 27, def: 20 },
    specialty: 'Temple Chapterhouse Tier-2 Champion: Aura of Radiance, Holy Smite, and Divine Intervention.'
  }
];

export const OVERWORLD_DUNGEON_CATALOG = [
  {
    poiId: 'poi_dungeon_starfall',
    dungeonId: 'dng_starfall',
    profileId: 'starfall_vaults',
    name: 'The Starfall Vaults',
    recommendedLevel: 1,
    accentColor: '#f87171',
    offsetDx: 5,
    offsetDy: -3,
    desc: 'Ancient dwarven subterranean catacombs scarred by the meteor Vespera.'
  },
  {
    poiId: 'poi_dungeon_quarry',
    dungeonId: 'dng_quarry',
    profileId: 'copper_quarry',
    name: 'Sunken Copper Quarry',
    recommendedLevel: 1,
    accentColor: '#fb923c',
    offsetDx: -9,
    offsetDy: 5,
    desc: 'Flooded excavation shafts rich in surface copper and iron veins.'
  },
  {
    poiId: 'poi_dungeon_mycelium',
    dungeonId: 'dng_mycelium',
    profileId: 'mycelium_labyrinth',
    name: 'Whispering Mycelium Labyrinth',
    recommendedLevel: 3,
    accentColor: '#34d399',
    offsetDx: 12,
    offsetDy: 7,
    desc: 'Bioluminescent fungal caverns teeming with ambush predators and geodes.'
  },
  {
    poiId: 'poi_dungeon_molten',
    dungeonId: 'dng_molten',
    profileId: 'molten_crucible',
    name: 'The Molten Forgeworks',
    recommendedLevel: 5,
    accentColor: '#f97316',
    offsetDx: -14,
    offsetDy: -9,
    desc: 'Blazing basalt foundries guarded by dwarven automatons and magma golems.'
  }
];

export const OVERWORLD_HOSTILE_ARCHETYPES = {
  raider_pack: {
    id: 'raider_pack',
    name: 'Starfall Raiding Pack',
    icon: '🐺',
    level: 1,
    power: 16,
    maxHp: 58,
    rewardGold: 20,
    rewardOre: 4,
    rewardXp: 25,
    color: '#f87171'
  },
  brood_swarm: {
    id: 'brood_swarm',
    name: 'Feral Brood Skitterers',
    icon: '🕷️',
    level: 1,
    power: 20,
    maxHp: 70,
    rewardGold: 25,
    rewardOre: 5,
    rewardXp: 35,
    color: '#fb923c'
  },
  cultist_patrol: {
    id: 'cultist_patrol',
    name: 'Astral Cultist Patrol',
    icon: '💀',
    level: 2,
    power: 28,
    maxHp: 105,
    rewardGold: 45,
    rewardOre: 10,
    rewardXp: 60,
    color: '#c084fc'
  }
};
