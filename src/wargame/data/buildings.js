// City Building Definitions, Paced Tier 1 Catalog, Construction Costs & Doubling Build Durations

export const CITY_BUILDINGS_CATALOG = {
  // ---------------------------------------------------------------------------
  // 1. CIVIC STRUCTURES
  // ---------------------------------------------------------------------------
  meeting_hall: {
    id: 'meeting_hall',
    name: 'Meeting Hall',
    icon: '🏛️',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central administration hall of your settlement. Governs town decisions and sets the maximum level cap for all structures.'
  },
  town_hall: {
    id: 'town_hall',
    name: 'Meeting Hall',
    icon: '🏛️',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central administration hall of your settlement. Governs town decisions and sets the maximum level cap for all structures.'
  },
  hut: {
    id: 'hut',
    name: 'Hut',
    icon: '🛖',
    category: 'civic',
    color: '#e2e8f0',
    maxLevel: 5,
    baseBuildTimeMs: 3000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    providesPopulation: 5,
    requires: { meeting_hall: 1 },
    desc: 'Provides shelter for citizens. Each Hut expands the town\'s maximum population by +5.'
  },
  well: {
    id: 'well',
    name: 'Well',
    icon: '🪣',
    category: 'civic',
    color: '#38bdf8',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 10, stone: 20, gold: 0 },
    productionPerTick: { water: 5 },
    requires: { meeting_hall: 1, garden: 1 },
    desc: 'Draws fresh drinking water to sustain your citizens and prevent dehydration.'
  },

  // ---------------------------------------------------------------------------
  // 2. RESOURCE & INDUSTRY STRUCTURES
  // ---------------------------------------------------------------------------
  garden: {
    id: 'garden',
    name: 'Garden',
    icon: '🌱',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 6 },
    requires: { meeting_hall: 1, hut: 1 },
    desc: 'Grows vegetables and staple crops to feed your population and prevent starvation.'
  },
  farmstead: {
    id: 'farmstead',
    name: 'Garden',
    icon: '🌱',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 6 },
    requires: { meeting_hall: 1, hut: 1 },
    desc: 'Grows vegetables and staple crops to feed your population and prevent starvation.'
  },
  lumber_camp: {
    id: 'lumber_camp',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1, well: 1 },
    requiredPopulation: 12,
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  lumber_hut: {
    id: 'lumber_hut',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1, well: 1 },
    requiredPopulation: 12,
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  sawmill: {
    id: 'sawmill',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1 },
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    icon: '⛏️',
    category: 'economy',
    color: '#cbd5e1',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 20, stone: 15, gold: 0 },
    productionPerTick: { stone: 6 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    requiredPopulation: 15,
    desc: 'Extracts granite and stone blocks for sturdy construction and guild halls.'
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    icon: '🪨',
    category: 'economy',
    color: '#a78bfa',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 5 },
    productionPerTick: { ore: 4 },
    requires: { meeting_hall: 1, quarry: 1 },
    desc: 'Extracts iron and veins of star-metal for tool crafting and forging.'
  },

  // ---------------------------------------------------------------------------
  // 3. STORAGE DEPOTS
  // ---------------------------------------------------------------------------
  silo: {
    id: 'silo',
    name: 'Silo',
    icon: '🏺',
    category: 'storage',
    color: '#fdba74',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 25, stone: 25, gold: 0 },
    storageBonus: { food: 200 },
    requires: { meeting_hall: 1, garden: 1 },
    desc: 'Sealed storage tower that increases food storage capacity by +200 per level.'
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    icon: '📦',
    category: 'storage',
    color: '#94a3b8',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 30, stone: 30, gold: 0 },
    storageBonus: { wood: 200, stone: 200, ore: 200 },
    requires: { meeting_hall: 1, lumber_camp: 1, quarry: 1 },
    desc: 'Dry storage depot that expands wood, stone, and ore storage limits by +200 each per level.'
  },

  // ---------------------------------------------------------------------------
  // 4. SYNERGY STRUCTURES
  // ---------------------------------------------------------------------------
  windmill: {
    id: 'windmill',
    name: 'Windmill',
    icon: '💨',
    category: 'synergy',
    color: '#e879f9',
    maxLevel: 3,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 25, gold: 10 },
    adjacencyBonus: { ratio: 0.20, targets: ['garden', 'farmstead', 'mine', 'lumber_camp', 'lumber_hut', 'sawmill', 'quarry'] },
    requires: { meeting_hall: 1, garden: 1, lumber_camp: 1 },
    desc: 'Harnesses wind energy to boost productivity of adjacent Gardens, Mines, and Lumber Camps by +20%.'
  },

  // ---------------------------------------------------------------------------
  // 5. MILITARY & TRAINING
  // ---------------------------------------------------------------------------
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 30, gold: 15 },
    troopCapacityBonus: 10,
    requires: { meeting_hall: 1, guild_hall: 1 },
    desc: 'Quarters for standing garrisons. Increases maximum troop limit by +10 per level.'
  },
  fighter_camp: {
    id: 'fighter_camp',
    name: 'Fighter Camp',
    icon: '🎯',
    category: 'military',
    color: '#f43f5e',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 10 },
    trainingSpeedBonus: 0.25,
    requires: { meeting_hall: 1, barracks: 1 },
    desc: 'Drills combat recruits to accelerate troop recruitment and training speed.'
  },

  // ---------------------------------------------------------------------------
  // 6. GUILDS & SANCTUARIES
  // ---------------------------------------------------------------------------
  guild_hall: {
    id: 'guild_hall',
    name: 'Adventurers Guild',
    icon: '⚔️',
    category: 'military',
    color: '#60a5fa',
    maxLevel: 3,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 40, stone: 40, gold: 25 },
    productionPerTick: { gold: 2 },
    requires: { meeting_hall: 1, quarry: 1 },
    requiredPopulation: 20,
    recruits: ['fighter', 'ranger', 'thief'],
    desc: 'Charters an adventuring guild where Heroes are recruited to explore and delve subterranean vaults.'
  },
  shrine: {
    id: 'shrine',
    name: 'Shrine',
    icon: '🕊️',
    category: 'arcane',
    color: '#fef08a',
    maxLevel: 3,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 35, stone: 40, gold: 25 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    recruits: ['paladin', 'cleric'],
    desc: 'Sanctuary for divine communion. Prepares holy champions (Paladins, Clerics) to shield your troops.'
  },
  mage_guild: {
    id: 'mage_guild',
    name: 'Mage Guild',
    icon: '🔮',
    category: 'arcane',
    color: '#c084fc',
    maxLevel: 3,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 40, stone: 45, gold: 35 },
    requires: { meeting_hall: 2, guild_hall: 1 },
    recruits: ['mage', 'elementalist'],
    desc: 'Academy of the astral elements. Enrolls Mages and Elementalists wielding arcane forces.'
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
  { plotIndex: 0, label: 'Meeting Hall Plot', defaultBuilding: 'town_hall', lockedTo: 'town_hall' },
  { plotIndex: 1, label: 'Plot 1', recommended: 'hut' },
  { plotIndex: 2, label: 'Plot 2', recommended: 'garden' },
  { plotIndex: 3, label: 'Plot 3', recommended: 'well' },
  { plotIndex: 4, label: 'Plot 4', recommended: 'lumber_camp' },
  { plotIndex: 5, label: 'Plot 5', recommended: 'quarry' },
  { plotIndex: 6, label: 'Plot 6', recommended: 'guild_hall' },
  { plotIndex: 7, label: 'Plot 7', recommended: 'barracks' }
];

export function isBuildingPrerequisiteMet(city, buildingId) {
  if (!city) return false;
  const bDef = CITY_BUILDINGS_CATALOG[buildingId];
  if (!bDef) return false;

  // 1. Check required population
  if (bDef.requiredPopulation) {
    const curPop = (city.population && typeof city.population.current === 'number')
      ? city.population.current
      : 5;
    if (curPop < bDef.requiredPopulation) {
      return false;
    }
  }

  // 2. Check required building prerequisites
  if (bDef.requires) {
    const bldgs = city.buildings || {};
    const reqKeys = Object.keys(bDef.requires);
    for (let i = 0; i < reqKeys.length; i++) {
      const reqB = reqKeys[i];
      const reqLvl = bDef.requires[reqB];
      let curLvl = 0;
      if (reqB === 'meeting_hall' || reqB === 'town_hall') {
        curLvl = Math.max(bldgs.meeting_hall || 0, bldgs.town_hall || 0);
      } else if (reqB === 'garden' || reqB === 'farmstead') {
        curLvl = Math.max(bldgs.garden || 0, bldgs.farmstead || 0);
      } else if (reqB === 'lumber_camp' || reqB === 'lumber_hut' || reqB === 'sawmill') {
        curLvl = Math.max(bldgs.lumber_camp || 0, bldgs.lumber_hut || 0, bldgs.sawmill || 0);
      } else {
        curLvl = bldgs[reqB] || 0;
      }
      if (curLvl < reqLvl) {
        return false;
      }
    }
  }

  return true;
}

export function getBuildingPrerequisiteMissingReason(city, buildingId) {
  if (!city) return 'No city established';
  const bDef = CITY_BUILDINGS_CATALOG[buildingId];
  if (!bDef) return 'Unknown building';

  if (bDef.requiredPopulation) {
    const curPop = (city.population && typeof city.population.current === 'number')
      ? city.population.current
      : 5;
    if (curPop < bDef.requiredPopulation) {
      return 'Requires Population ' + bDef.requiredPopulation + ' (Current: ' + curPop + ')';
    }
  }

  if (bDef.requires) {
    const bldgs = city.buildings || {};
    const reqKeys = Object.keys(bDef.requires);
    for (let i = 0; i < reqKeys.length; i++) {
      const reqB = reqKeys[i];
      const reqLvl = bDef.requires[reqB];
      let curLvl = 0;
      if (reqB === 'meeting_hall' || reqB === 'town_hall') {
        curLvl = Math.max(bldgs.meeting_hall || 0, bldgs.town_hall || 0);
      } else if (reqB === 'garden' || reqB === 'farmstead') {
        curLvl = Math.max(bldgs.garden || 0, bldgs.farmstead || 0);
      } else if (reqB === 'lumber_camp' || reqB === 'lumber_hut' || reqB === 'sawmill') {
        curLvl = Math.max(bldgs.lumber_camp || 0, bldgs.lumber_hut || 0, bldgs.sawmill || 0);
      } else {
        curLvl = bldgs[reqB] || 0;
      }
      if (curLvl < reqLvl) {
        const reqDef = CITY_BUILDINGS_CATALOG[reqB];
        return 'Requires ' + (reqDef ? reqDef.name : reqB) + ' Level ' + reqLvl;
      }
    }
  }

  return '';
}

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

// Doubling duration for each upgrade level (e.g. 1x, 2x, 4x, 8x, 16x)
export function computeBuildingDurationMs(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return 5000;
  const mult = Math.pow(2.0, Math.max(0, targetLevel - 1));
  return Math.round(def.baseBuildTimeMs * mult);
}
