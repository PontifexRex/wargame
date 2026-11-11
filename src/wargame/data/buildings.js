// City Building Definitions, Tier 1 Building Catalog, Spatial Plot Grid Layout, Costs & Production Rates

export const CITY_BUILDINGS_CATALOG = {
  // ---------------------------------------------------------------------------
  // 1. CIVIC STRUCTURES
  // ---------------------------------------------------------------------------
  meeting_hall: {
    id: 'meeting_hall',
    name: 'Meeting Hall',
    icon: '🏰',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central governance keep of your realm. Sets the maximum level cap for all structures in the settlement.'
  },
  town_hall: {
    id: 'town_hall',
    name: 'Meeting Hall / Keep',
    icon: '🏰',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central governance keep of your realm. Sets the maximum level cap for all structures in the settlement.'
  },
  hut: {
    id: 'hut',
    name: 'Settler Hut',
    icon: '🛖',
    category: 'civic',
    color: '#e2e8f0',
    maxLevel: 5,
    baseBuildTimeMs: 3000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    providesPopulation: 5,
    desc: 'Provides shelter for pioneers and citizens. Each level expands the town\'s maximum population by +5.'
  },
  well: {
    id: 'well',
    name: 'Town Well',
    icon: '🪣',
    category: 'civic',
    color: '#38bdf8',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 10, stone: 20, gold: 0 },
    productionPerTick: { water: 5 },
    desc: 'Taps clean groundwater aquifers to supply essential water provisions for the settlement.'
  },

  // ---------------------------------------------------------------------------
  // 2. RESOURCE & INDUSTRY STRUCTURES
  // ---------------------------------------------------------------------------
  garden: {
    id: 'garden',
    name: 'Cultivated Garden',
    icon: '🌱',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 6 },
    requires: { meeting_hall: 1 },
    desc: 'Grows staple grains and hearty produce. Evolves toward an irrigated farm as techniques advance.'
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
    productionPerTick: { food: 6 },
    requires: { town_hall: 1 },
    desc: 'Cultivates grain and provisions required to sustain marching expeditions and recruit heroes.'
  },
  lumber_hut: {
    id: 'lumber_hut',
    name: 'Lumberjack Hut',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1 },
    desc: 'Harvests and seasons sturdy timber from surrounding woodlands to supply construction projects.'
  },
  sawmill: {
    id: 'sawmill',
    name: 'Timber Sawmill',
    icon: '🪚',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 20, stone: 10, gold: 0 },
    productionPerTick: { wood: 8 },
    requires: { town_hall: 1 },
    desc: 'Fells and mills seasoned lumber from surrounding groves to fuel city construction.'
  },
  quarry: {
    id: 'quarry',
    name: 'Stone Quarry',
    icon: '⛏️',
    category: 'economy',
    color: '#cbd5e1',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 20, stone: 15, gold: 0 },
    productionPerTick: { stone: 6 },
    requires: { meeting_hall: 1 },
    desc: 'Excavates and dresses heavy granite blocks for fortifications, foundations, and storage facilities.'
  },
  mine: {
    id: 'mine',
    name: 'Excavation Mine',
    icon: '🪨',
    category: 'economy',
    color: '#a78bfa',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 5 },
    productionPerTick: { ore: 4 },
    requires: { meeting_hall: 1 },
    desc: 'Extracts crude ore and veins of star-metal for smelting, tool forging, and armaments.'
  },

  // ---------------------------------------------------------------------------
  // 3. STORAGE DEPOTS
  // ---------------------------------------------------------------------------
  silo: {
    id: 'silo',
    name: 'Grain Silo',
    icon: '🏺',
    category: 'storage',
    color: '#fdba74',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 25, stone: 25, gold: 0 },
    storageBonus: { food: 200 },
    requires: { meeting_hall: 1 },
    desc: 'Sealed masonry tower that protects grain harvests. Increases food storage capacity by +200 per level.'
  },
  warehouse: {
    id: 'warehouse',
    name: 'Supply Warehouse',
    icon: '📦',
    category: 'storage',
    color: '#94a3b8',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 30, stone: 30, gold: 0 },
    storageBonus: { wood: 200, stone: 200, ore: 200 },
    requires: { meeting_hall: 1 },
    desc: 'Reinforced dry depot that expands wood, stone, and ore storage limits by +200 each per level.'
  },

  // ---------------------------------------------------------------------------
  // 4. SYNERGY STRUCTURES
  // ---------------------------------------------------------------------------
  windmill: {
    id: 'windmill',
    name: 'Grain Windmill',
    icon: '💨',
    category: 'synergy',
    color: '#e879f9',
    maxLevel: 3,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 25, gold: 10 },
    adjacencyBonus: { ratio: 0.20, targets: ['garden', 'farmstead', 'mine', 'lumber_hut', 'sawmill', 'quarry'] },
    requires: { meeting_hall: 1 },
    desc: 'Harnesses frontier breezes to mechanize milling and hauling. Boosts productivity of adjacent Gardens, Mines, and Lumber Huts by +20%.'
  },

  // ---------------------------------------------------------------------------
  // 5. MILITARY & TRAINING
  // ---------------------------------------------------------------------------
  barracks: {
    id: 'barracks',
    name: 'Troop Barracks',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 30, gold: 15 },
    troopCapacityBonus: 10,
    requires: { meeting_hall: 1 },
    desc: 'Quarters for standing garrisons and expeditionary units. Increases maximum troop limit by +10 per level.'
  },
  fighter_camp: {
    id: 'fighter_camp',
    name: 'Fighter Training Camp',
    icon: '🎯',
    category: 'military',
    color: '#f43f5e',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 10 },
    trainingSpeedBonus: 0.25,
    requires: { meeting_hall: 1 },
    desc: 'Drills combat recruits in swordcraft and discipline. Accelerates troop recruitment and martial training.'
  },

  // ---------------------------------------------------------------------------
  // 6. GUILDS & SANCTUARIES
  // ---------------------------------------------------------------------------
  guild_hall: {
    id: 'guild_hall',
    name: 'Adventurers Guild Hall',
    icon: '⚔️',
    category: 'military',
    color: '#60a5fa',
    maxLevel: 3,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 40, stone: 40, gold: 25 },
    productionPerTick: { gold: 2 },
    requires: { meeting_hall: 1 },
    recruits: ['fighter', 'ranger', 'thief'],
    desc: 'Recruits martial heroes (Fighters, Rangers, Rogues) and organizes expeditionary parties into the vaults.'
  },
  shrine: {
    id: 'shrine',
    name: 'Holy Shrine',
    icon: '🕊️',
    category: 'arcane',
    color: '#fef08a',
    maxLevel: 3,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 35, stone: 40, gold: 25 },
    requires: { meeting_hall: 1 },
    recruits: ['paladin', 'cleric'],
    desc: 'Consecrated sanctuary for divine communion. Prepares holy champions (Paladins, Clerics) to shield your troops.'
  },
  mage_guild: {
    id: 'mage_guild',
    name: 'Mage Arcane Guild',
    icon: '🔮',
    category: 'arcane',
    color: '#c084fc',
    maxLevel: 3,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 40, stone: 45, gold: 35 },
    requires: { meeting_hall: 2 },
    recruits: ['mage', 'elementalist'],
    desc: 'Academy of the astral elements. Enrolls Mages and elementalists wielding raw arcane forces.'
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
    requires: { meeting_hall: 1 },
    desc: 'Channels Divine War Reimbursement—honorable battles grant divine favor and rapid troop recovery.'
  }
};

export const CITY_PLOT_SLOTS = [
  { plotIndex: 0, label: 'Central Citadel Plot', defaultBuilding: 'town_hall', lockedTo: 'town_hall' },
  { plotIndex: 1, label: 'North Timber Yard',    recommended: 'lumber_hut' },
  { plotIndex: 2, label: 'East Masonry Plot',    recommended: 'quarry' },
  { plotIndex: 3, label: 'South Fertile Terrace',recommended: 'garden' },
  { plotIndex: 4, label: 'Grand Charter Plaza',  recommended: 'guild_hall' },
  { plotIndex: 5, label: 'Western Garrison',     recommended: 'barracks' },
  { plotIndex: 6, label: 'Crucible Terrace',     recommended: 'star_forge' },
  { plotIndex: 7, label: 'High Acropolis',       recommended: 'temple_of_war' }
];

export function computeBuildingUpgradeCost(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return { wood: 50, stone: 50, gold: 0, water: 0, ore: 0 };
  const mult = Math.pow(1.45, Math.max(0, targetLevel - 1));
  const base = def.baseCost || {};
  const cost = {};
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    cost[k] = Math.round((base[k] || 0) * mult);
  }
  if (cost.wood === undefined) cost.wood = 0;
  if (cost.stone === undefined) cost.stone = 0;
  if (cost.gold === undefined) cost.gold = 0;
  if (cost.water === undefined) cost.water = 0;
  if (cost.ore === undefined) cost.ore = 0;
  return cost;
}

export function computeBuildingDurationMs(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return 5000;
  const mult = Math.pow(1.3, Math.max(0, targetLevel - 1));
  return Math.round(def.baseBuildTimeMs * mult);
}
