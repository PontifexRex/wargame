// Overworld Terrain Types, Resource Nodes, POIs, Unit Types & Guided Tasks Catalog

export const TERRAIN_PLAINS = 1;
export const TERRAIN_FOREST = 2;
export const TERRAIN_HILLS = 3;
export const TERRAIN_MOUNTAINS = 4;
export const TERRAIN_WATER = 5;

export const OVERWORLD_TERRAIN = {
  [TERRAIN_PLAINS]: {
    id: TERRAIN_PLAINS,
    key: 'plains',
    name: 'Fertile Plains',
    symbol: '.',
    color: '#84cc16',
    bgColor: '#172e08',
    borderColor: '#365314',
    moveCost: 1,
    buildable: true,
    impassable: false,
    desc: 'Lush fertile grasslands suitable for agriculture, encampments, and city expansion.'
  },
  [TERRAIN_FOREST]: {
    id: TERRAIN_FOREST,
    key: 'forest',
    name: 'Ancient Forest',
    symbol: '♠',
    color: '#22c55e',
    bgColor: '#0a2e16',
    borderColor: '#14532d',
    moveCost: 1.5,
    buildable: false,
    impassable: false,
    resource: 'wood',
    desc: 'Dense timber groves rich in harvestable lumber for city construction.'
  },
  [TERRAIN_HILLS]: {
    id: TERRAIN_HILLS,
    key: 'hills',
    name: 'Craggy Foothills',
    symbol: '▲',
    color: '#a1a1aa',
    bgColor: '#27272a',
    borderColor: '#3f3f46',
    moveCost: 2,
    buildable: false,
    impassable: false,
    resource: 'stone',
    desc: 'Rocky ridges harboring stone quarries and subterranean mineral veins.'
  },
  [TERRAIN_MOUNTAINS]: {
    id: TERRAIN_MOUNTAINS,
    key: 'mountains',
    name: 'Star-Spire Mountains',
    symbol: '▲',
    color: '#e4e4e7',
    bgColor: '#3f3f46',
    borderColor: '#52525b',
    moveCost: Infinity,
    buildable: false,
    impassable: true,
    desc: 'Towering impassable mountain ranges dividing regional territories.'
  },
  [TERRAIN_WATER]: {
    id: TERRAIN_WATER,
    key: 'water',
    name: 'Deep Waters',
    symbol: '~',
    color: '#38bdf8',
    bgColor: '#082f49',
    borderColor: '#0369a1',
    moveCost: Infinity,
    buildable: false,
    impassable: true,
    desc: 'Navigable rivers and deep coastal waters requiring bridges or harbors.'
  }
};

export const OVERWORLD_POIS = {
  dungeon_entrance: {
    id: 'dungeon_entrance',
    name: 'Starfall Vaults Entrance',
    symbol: 'Ω',
    color: '#f87171',
    bgColor: '#450a0a',
    desc: 'Subterranean vault shaft plunging into procedural depths.'
  },
  wood_grove: {
    id: 'wood_grove',
    name: 'Timber Grove',
    symbol: '♠',
    color: '#4ade80',
    bgColor: '#064e3b',
    desc: 'Abundant high-yield timber supply.'
  },
  stone_quarry: {
    id: 'stone_quarry',
    name: 'Granite Quarry',
    symbol: '■',
    color: '#cbd5e1',
    bgColor: '#334155',
    desc: 'High-density granite masonry outcrop.'
  },
  ore_deposit: {
    id: 'ore_deposit',
    name: 'Star-Ore Outcrop',
    symbol: '◆',
    color: '#fbbf24',
    bgColor: '#451a03',
    desc: 'Surface mineral seam containing copper and iron.'
  },
  city: {
    id: 'city',
    name: 'Founded Bastion',
    symbol: '🏰',
    color: '#fbbf24',
    bgColor: '#1e1b4b',
    desc: 'Fortified player settlement and regional stronghold.'
  }
};

export const OVERWORLD_UNIT_TYPES = {
  settler: {
    id: 'settler',
    name: 'Pioneer Settler',
    symbol: '🏛️',
    color: '#fbbf24',
    hp: 100,
    maxHp: 100,
    moveSpeed: 1,
    canFoundCity: true,
    desc: 'Foundational settlement expedition capable of erecting your civilization\'s primary Bastion.'
  },
  hero_party: {
    id: 'hero_party',
    name: 'Vanguard Party',
    symbol: '⚔️',
    color: '#60a5fa',
    hp: 120,
    maxHp: 120,
    moveSpeed: 1,
    canFoundCity: false,
    desc: 'Armed vanguard exploration unit ready to clear overworld threats and delve subterranean vaults.'
  }
};

export const GUIDED_TASKS = [
  {
    id: 'task_move_settler',
    title: 'Pioneer Exploration',
    desc: 'March your Settler unit across the fertile Overworld to survey the realm (move at least 2 tiles).',
    category: 'exploration',
    rewardLabel: '+30 Food, +20 Wood',
    reward: { food: 30, wood: 20 },
    checkCompletion: function(state) {
      if (!state) return false;
      const steps = (state.overworld && state.overworld.settlerSteps) || 0;
      const hasCity = Boolean(state.cities && Object.keys(state.cities).length > 0);
      return steps >= 2 || hasCity;
    }
  },
  {
    id: 'task_found_first_city',
    title: 'Found Your First Bastion',
    desc: 'Command your Settler to establish your civilization\'s primary Bastion on fertile plains.',
    category: 'settlement',
    rewardLabel: '+50 Wood, +50 Stone, +50 Gold',
    reward: { wood: 50, stone: 50, gold: 50 },
    checkCompletion: function(state) {
      if (!state) return false;
      return Boolean(state.cities && Object.keys(state.cities).length > 0);
    }
  },
  {
    id: 'task_build_guild_hall',
    title: 'Establish Adventurers Guild Hall',
    desc: 'Construct or commission the Adventurers Guild Hall in your Bastion to recruit brave delvers.',
    category: 'construction',
    rewardLabel: '+100 Gold, Unlocks Vault Delving',
    reward: { gold: 100 },
    checkCompletion: function(state) {
      if (!state || !state.cities) return false;
      const cityList = Object.keys(state.cities);
      if (cityList.length === 0) return false;
      const firstCity = state.cities[cityList[0]];
      return Boolean(firstCity && firstCity.buildings && firstCity.buildings.guildHall >= 1);
    }
  },
  {
    id: 'task_delve_vault',
    title: 'First Subterranean Descent',
    desc: 'Descend into the Starfall Vaults and extract your first mineral cache or slay a subterranean beast.',
    category: 'delve',
    rewardLabel: '+2 Healing Tonics, +1 Recall Scroll',
    reward: { potions: 2, recalls: 1 },
    checkCompletion: function(state) {
      if (!state || !state.codex) return false;
      const c = state.codex;
      return Boolean(c.totalMonstersSlain > 0 || c.totalOresMined > 0 || c.totalExtractions > 0);
    }
  }
];
