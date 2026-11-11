// City Building Definitions, 3x3 City Plot Grid Layout, Construction Costs, Build Durations & Production Rates

export const CITY_BUILDINGS_CATALOG = {
  town_hall: {
    id: 'town_hall',
    name: 'Bastion Keep',
    icon: '🏰',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { gold: 2, food: 2 },
    unlocks: ['sawmill', 'quarry', 'farmstead', 'guild_hall', 'warehouse'],
    desc: 'The fortified heart of your city. Governs administration, tax revenue, and construction capacity.'
  },
  sawmill: {
    id: 'sawmill',
    name: 'Timber Sawmill',
    icon: '🪚',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000, // 4 seconds at 1x speed for responsive early building
    baseCost: { wood: 20, stone: 10, gold: 0 },
    productionPerTick: { wood: 8 },
    requires: { town_hall: 1 },
    desc: 'Fells and mills seasoned lumber from surrounding groves to fuel city construction.'
  },
  quarry: {
    id: 'quarry',
    name: 'Masonry Stoneworks',
    icon: '⛏️',
    category: 'economy',
    color: '#cbd5e1',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 10, gold: 0 },
    productionPerTick: { stone: 7 },
    requires: { town_hall: 1 },
    desc: 'Excavates and dresses heavy granite blocks for fortifications and guild halls.'
  },
  farmstead: {
    id: 'farmstead',
    name: 'Irrigated Granary',
    icon: '🌾',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 10 },
    requires: { town_hall: 1 },
    desc: 'Cultivates grain and provisions required to sustain marching expeditions and recruit heroes.'
  },
  guild_hall: {
    id: 'guild_hall',
    name: 'Adventurers Guild Hall',
    icon: '⚔️',
    category: 'military',
    color: '#60a5fa',
    maxLevel: 3,
    baseBuildTimeMs: 6000, // 6 seconds base build time
    baseCost: { wood: 50, stone: 50, gold: 25 },
    productionPerTick: { gold: 3 },
    requires: { town_hall: 1 },
    desc: 'Establishes the charter hall where Hero classes (Fighter, Ranger, Mage, Thief, Paladin) are recruited to delve subterranean vaults.'
  },
  barracks: {
    id: 'barracks',
    name: 'Vanguard Barracks',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 45, stone: 40, gold: 30 },
    productionPerTick: {},
    requires: { guild_hall: 1 },
    desc: 'Trains escort garrisons and increases the march speed and maximum party capacity of your realm.'
  },
  star_forge: {
    id: 'star_forge',
    name: 'Astral Star-Forge',
    icon: '🔥',
    category: 'arcane',
    color: '#c084fc',
    maxLevel: 3,
    baseBuildTimeMs: 7000,
    baseCost: { wood: 40, stone: 60, gold: 50 },
    productionPerTick: { gold: 4 },
    requires: { guild_hall: 1 },
    desc: 'Smelts subterranean star-ores brought back from dungeons into masterwork relics.'
  },
  temple_of_war: {
    id: 'temple_of_war',
    name: 'Sanctum of the War Gods',
    icon: '🏛️',
    category: 'arcane',
    color: '#38bdf8',
    maxLevel: 3,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 35, stone: 55, gold: 40 },
    productionPerTick: {},
    requires: { town_hall: 1 },
    desc: 'Channels Divine War Reimbursement—honorable battles grant divine favor and rapid troop recovery.'
  }
};

export const CITY_PLOT_SLOTS = [
  { plotIndex: 0, label: 'Central Citadel Plot', defaultBuilding: 'town_hall', lockedTo: 'town_hall' },
  { plotIndex: 1, label: 'North Timber Yard',    recommended: 'sawmill' },
  { plotIndex: 2, label: 'East Masonry Plot',    recommended: 'quarry' },
  { plotIndex: 3, label: 'South Fertile Terrace',recommended: 'farmstead' },
  { plotIndex: 4, label: 'Grand Charter Plaza',  recommended: 'guild_hall' },
  { plotIndex: 5, label: 'Western Garrison',     recommended: 'barracks' },
  { plotIndex: 6, label: 'Crucible Terrace',     recommended: 'star_forge' },
  { plotIndex: 7, label: 'High Acropolis',       recommended: 'temple_of_war' }
];

export function computeBuildingUpgradeCost(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return { wood: 50, stone: 50, gold: 0 };
  const mult = Math.pow(1.45, Math.max(0, targetLevel - 1));
  return {
    wood:  Math.round((def.baseCost.wood || 0) * mult),
    stone: Math.round((def.baseCost.stone || 0) * mult),
    gold:  Math.round((def.baseCost.gold || 0) * mult)
  };
}

export function computeBuildingDurationMs(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return 5000;
  const mult = Math.pow(1.3, Math.max(0, targetLevel - 1));
  return Math.round(def.baseBuildTimeMs * mult);
}
