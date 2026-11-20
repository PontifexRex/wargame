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
    storageBonus: { wood: 200, stone: 200, ore: 200, ingots: 100 },
    inventorySlotBonus: 50,
    interiorAssetId: 'city_interior_warehouse_default_static',
    facilities: {
      storage: { slotBonusPerLevel: 50 }
    },
    requires: { meeting_hall: 1, lumber_camp: 1, quarry: 1 },
    desc: 'Dry storage depot that expands wood/stone/ore caps by +200 and City Vault Storage by +50 item slots per level.'
  },
  smeltery: {
    id: 'smeltery',
    name: 'Dwarven Smeltery',
    icon: '🔥',
    category: 'resource',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 35, stone: 45, gold: 20 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_smeltery_default_static',
    facilities: {
      smelting: { oreCost: 5, woodCost: 5, ingotYield: 2 }
    },
    desc: 'High-heat furnace refining raw dungeon ores and timber into Forged Ingots for Tier 2 gear and buildings.'
  },
  apothecary: {
    id: 'apothecary',
    name: 'Alchemist Apothecary',
    icon: '🧪',
    category: 'civic',
    color: '#34d399',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 30, gold: 25 },
    requires: { meeting_hall: 1, garden: 1, well: 1 },
    interiorAssetId: 'city_interior_apothecary_default_static',
    facilities: {
      brewing: true
    },
    desc: 'Alchemical workshop brewing Healing Tonics and scribing Astral Recall Scrolls to provision Hero Parties.'
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith & Star-Forge',
    icon: '🔨',
    category: 'military',
    color: '#fb923c',
    maxLevel: 5,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 40, stone: 50, gold: 30 },
    requires: { meeting_hall: 1, smeltery: 1 },
    interiorAssetId: 'city_interior_blacksmith_default_static',
    facilities: {
      blacksmithing: true
    },
    desc: 'Master forge crafting weapons, armor, and pickaxes from Forged Ingots and tempering gear affixes. Higher levels forge rarer socketed gear.'
  },
  lapidary: {
    id: 'lapidary',
    name: 'Lapidary Workshop',
    icon: '💎',
    category: 'arcane',
    color: '#a78bfa',
    maxLevel: 5,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 35, stone: 45, gold: 35 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_lapidary_default_static',
    facilities: {
      lapidary: true
    },
    desc: 'Jewelcrafter bench for punching Gem Sockets into equipment and socketing or extracting Astral Gems.'
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
    recruits: ['adventurer'],
    interiorAssetId: 'city_interior_adventurers_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'adventurer', minLevel: 1 }] },
      questBoard: { domain: 'adventurers' },
      training: { domain: 'adventurers' },
      research: { domain: 'adventurers' },
      shop: { catalogId: 'shop_adventurers' }
    },
    desc: 'Guild dedicated to the Adventurer class & dungeon delving: recruits Adventurers, hosts dungeon quests, training, research, and delve-gear shop.'
  },
  garrison: {
    id: 'garrison',
    name: 'City Garrison',
    icon: '🏰',
    category: 'military',
    color: '#fb923c',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 45, stone: 45, gold: 30 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    interiorAssetId: 'city_interior_garrison_default_static',
    facilities: {
      partyManagement: { baseBonus: 1 }
    },
    desc: 'Command headquarters for forming multi-hero Parties. Each Garrison level increases maximum Heroes per Party by +1.'
  },
  temple_chapterhouse: {
    id: 'temple_chapterhouse',
    name: 'Temple Chapterhouse',
    icon: '⛪',
    category: 'arcane',
    color: '#fef08a',
    maxLevel: 5,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 40, stone: 55, gold: 35 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    interiorAssetId: 'city_interior_temple_chapterhouse_default_static',
    facilities: {
      recruitment: {
        classes: [
          { classId: 'cleric',  minLevel: 1 },
          { classId: 'paladin', minLevel: 2 }
        ]
      },
      questBoard: { domain: 'temple' },
      training:   { domain: 'temple' },
      research:   { domain: 'temple' },
      shop:       { catalogId: 'shop_temple_exclusive' }
    },
    desc: 'Sacred sanctuary recruiting Clerics (Lv 1) and Paladins (Lv 2+), with holy quests, training, research, and exclusive temple relics.'
  },
  fighters_guild: {
    id: 'fighters_guild',
    name: 'Fighters Guild',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 40, stone: 45, gold: 30 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_fighters_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'fighter', minLevel: 1 }] },
      questBoard: { domain: 'fighters' },
      training:   { domain: 'fighters' },
      research:   { domain: 'fighters' },
      shop:       { catalogId: 'shop_fighters_exclusive' }
    },
    desc: 'Martial brotherhood recruiting Fighters, offering martial quests, training, research, and exclusive arms.'
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: 'Thieves Guild',
    icon: '🗡️',
    category: 'military',
    color: '#c084fc',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 40, stone: 35, gold: 35 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    interiorAssetId: 'city_interior_thieves_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'thief', minLevel: 1 }] },
      questBoard: { domain: 'thieves' },
      training:   { domain: 'thieves' },
      research:   { domain: 'thieves' },
      shop:       { catalogId: 'shop_thieves_exclusive' }
    },
    desc: 'Shadow network recruiting Thieves, offering heist contracts, stealth training, research, and black-market gear.'
  },
  mages_guild: {
    id: 'mages_guild',
    name: 'Mages Guild',
    icon: '✨',
    category: 'arcane',
    color: '#60a5fa',
    maxLevel: 5,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 35, stone: 50, gold: 40 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_mages_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'mage', minLevel: 1 }] },
      questBoard: { domain: 'mages' },
      training:   { domain: 'mages' },
      research:   { domain: 'mages' },
      shop:       { catalogId: 'shop_mages_exclusive' }
    },
    desc: 'Arcane spire recruiting Mages, offering spellcraft quests, arcane training, research, and staff/tome relics.'
  },
  rangers_lodge: {
    id: 'rangers_lodge',
    name: 'Rangers Lodge',
    icon: '🏹',
    category: 'military',
    color: '#34d399',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 50, stone: 30, gold: 25 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    interiorAssetId: 'city_interior_rangers_lodge_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'ranger', minLevel: 1 }] },
      questBoard: { domain: 'rangers' },
      training:   { domain: 'rangers' },
      research:   { domain: 'rangers' },
      shop:       { catalogId: 'shop_rangers_exclusive' }
    },
    desc: 'Frontier pathfinder lodge recruiting Rangers, offering scouting quests, archery training, research, and bows.'
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

// Garrison Party Size Scaling (ADR-0012): 1 hero solo pre-Garrison; +1 per Garrison level
export function computeMaxPartySize(city) {
  if (!city || !city.buildings) return 1;
  const garLvl = city.buildings.garrison || 0;
  return 1 + garLvl;
}

// Compute all Hero classIds recruitable in this city based on declarative building facilities
export function getCityRecruitableClasses(city) {
  const unlocked = {};
  if (!city || !city.buildings) return [];
  const bKeys = Object.keys(city.buildings);
  for (let i = 0; i < bKeys.length; i++) {
    const bId = bKeys[i];
    const lvl = city.buildings[bId] || 0;
    if (lvl <= 0) continue;
    const def = CITY_BUILDINGS_CATALOG[bId];
    if (def && def.facilities && def.facilities.recruitment && Array.isArray(def.facilities.recruitment.classes)) {
      const list = def.facilities.recruitment.classes;
      for (let j = 0; j < list.length; j++) {
        if (lvl >= (list[j].minLevel || 1)) {
          unlocked[list[j].classId] = true;
        }
      }
    }
  }
  return Object.keys(unlocked);
}

// Declarative Guild Service Catalogs (Config-driven single Guild Screen per ADR-0012)
export const GUILD_SERVICE_CATALOGS = {
  adventurers: {
    quests: [
      { id: 'q_adv_delve1', name: 'Chart Starfall Floor 1', desc: 'Map the outer masonry vaults and extract safely.', reward: '60g • 25 XP' },
      { id: 'q_adv_ore',    name: 'Subterranean Ore Assay', desc: 'Mine 10 raw ore seams and return them to the surface.', reward: '80g • 5 Ingots' }
    ],
    training: [
      { id: 'tr_adv_stride', name: 'Delver Conditioning', desc: '+10% Torchlight duration & reduced fatigue on deep floors.', cost: '40g' },
      { id: 'tr_adv_mine',   name: 'Reinforced Pickcraft', desc: '+4 Pickaxe durability for Adventurer delves.', cost: '35g • 4 Ingots' }
    ],
    research: [
      { id: 'rs_adv_geo',    name: 'Subterranean Geology', desc: 'Unlocks mining of dense Iron, Mithril, and Astral ore seams.', cost: '75g • 15 Ore' },
      { id: 'rs_adv_pact',   name: 'Vanguard Recovery Pact', desc: 'Increases gold salvaged by Guild Scouts upon expedition defeat.', cost: '90g • 10 Ore' }
    ],
    shop: [
      { id: 'sh_adv_compass', name: 'Brass Delver Compass', desc: 'Accessory • +1 Vision, +3% Crit', cost: '45g' },
      { id: 'sh_adv_pick',    name: 'Tempered Star-Pick', desc: 'Pickaxe • 45 Durability', cost: '60g' }
    ]
  },
  fighters: {
    quests: [
      { id: 'q_fgt_clear', name: 'Break the Vanguard Line', desc: 'Defeat 12 subterranean monsters in melee combat.', reward: '75g • 35 XP' }
    ],
    training: [
      { id: 'tr_fgt_cleave', name: 'Heavy Shield Drills', desc: '+2 Base DEF for sworn Fighters.', cost: '50g' }
    ],
    research: [
      { id: 'rs_fgt_plate', name: 'Riveted Plate Forging', desc: 'Improves heavy armor mitigation across the roster.', cost: '85g • 8 Ingots' }
    ],
    shop: [
      { id: 'sh_fgt_blade', name: 'Guildmaster Greatsword', desc: 'Weapon • +12 ATK, +2 STR', cost: '80g' }
    ]
  },
  thieves: {
    quests: [
      { id: 'q_thf_chest', name: 'Silent Vault Recovery', desc: 'Open 3 gilded dungeon chests without triggering traps.', reward: '90g • 30 XP' }
    ],
    training: [
      { id: 'tr_thf_lock', name: 'Master Lockpicking', desc: '+10% Crit & improved chest disarming.', cost: '50g' }
    ],
    research: [
      { id: 'rs_thf_map', name: 'Hidden Passage Cipher', desc: 'Increases chance to detect secret doors and levers.', cost: '80g' }
    ],
    shop: [
      { id: 'sh_thf_dagger', name: 'Nightshade Stiletto', desc: 'Weapon • +10 ATK, +12% Crit', cost: '75g' }
    ]
  },
  mages: {
    quests: [
      { id: 'q_mag_rune', name: 'Astral Leyline Resonance', desc: 'Harvest 5 Astral Gems from deep crystalline chambers.', reward: '110g • 40 XP' }
    ],
    training: [
      { id: 'tr_mag_focus', name: 'Mana Conduit Meditation', desc: '+15 Max MP & faster arcane regeneration.', cost: '55g' }
    ],
    research: [
      { id: 'rs_mag_star', name: 'Starlight Amplification', desc: 'Boosts spell damage and elemental hazard mastery.', cost: '100g • 12 Ore' }
    ],
    shop: [
      { id: 'sh_mag_staff', name: 'Vespera Runestaff', desc: 'Weapon • +8 ATK, +5 INT, +20 MP', cost: '90g' }
    ]
  },
  rangers: {
    quests: [
      { id: 'q_rng_scout', name: 'Frontier Patrol Sweep', desc: 'Defeat 2 wandering Overworld hostile bands.', reward: '85g • 30 XP' }
    ],
    training: [
      { id: 'tr_rng_eye', name: 'Hawkeye Marksmanship', desc: '+1 Overworld Vision & +8% Dodge.', cost: '50g' }
    ],
    research: [
      { id: 'rs_rng_trail', name: 'Pathfinder Logistics', desc: 'Reduces Overworld march times across forests and hills.', cost: '85g • 20 Wood' }
    ],
    shop: [
      { id: 'sh_rng_bow', name: 'Heartwood Longbow', desc: 'Weapon • +11 ATK, +3 DEX', cost: '80g' }
    ]
  },
  temple: {
    quests: [
      { id: 'q_tmp_ward', name: 'Sanctify the Deep Crypts', desc: 'Vanquish undead guardians beneath the Starfall Vaults.', reward: '95g • 40 XP' }
    ],
    training: [
      { id: 'tr_tmp_vow', name: 'Vow of Radiance', desc: '+15 Max HP & stronger healing blessings.', cost: '55g' }
    ],
    research: [
      { id: 'rs_tmp_sanct', name: 'Chapterhouse Reliquary', desc: 'Enhances divine wards and Paladin aura potency.', cost: '95g • 10 Ingots' }
    ],
    shop: [
      { id: 'sh_tmp_mace', name: 'Sunburst Morningstar', desc: 'Weapon • +11 ATK, +3 VIT', cost: '85g' }
    ]
  }
};
