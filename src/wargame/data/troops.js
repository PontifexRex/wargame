// Military Troop Archetype Definitions, Level Progression, Upgrade Formulas & Barracks Inventory Helpers (Task 05A / C2 / C3)
// Strictly separates Barracks military troops (locationType: 'barracks') from City Garrison militia.

import { CITY_BUILDINGS_CATALOG } from './buildings.js';
import { BASE_TROOP_QUEUE_LIMIT } from '../constants.js';

export const TROOP_ROLES = {
  INFANTRY: 'infantry',
  RANGED: 'ranged'
};

export const TROOP_LOCATION_TYPES = {
  BARRACKS: 'barracks',
  ARMY: 'army'
};

export const ARMY_OBJECTIVE_TYPES = {
  PATROL_HEX: 'patrol_hex',
  RETURN_HOME: 'return_home'
};

export const ARMY_OBJECTIVE_STATUS = {
  ACCEPTED: 'accepted',
  TRAVELING: 'traveling',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  INTERRUPTED: 'interrupted'
};

export const TROOP_AVAILABILITY_STATES = {
  AVAILABLE: 'available',
  LOCKED: 'locked',
  INSUFFICIENT_RESOURCES: 'insufficient_resources',
  INSUFFICIENT_CAPACITY: 'insufficient_capacity',
  QUEUE_FULL: 'queue_full'
};

// Simplified, role-defined MVP1 Troop Catalog (camps unlock troop types & max recruitable levels)
export const TROOP_CATALOG = {
  infantry: {
    id: 'infantry',
    name: 'Basic Infantry',
    icon: '🛡️',
    role: TROOP_ROLES.INFANTRY,
    roleLabel: 'Frontline Infantry',
    tier: 1,
    requiredBuildings: { barracks: 1, fighter_camp: 1 },
    levelCampBuilding: 'fighter_camp',
    cost: { food: 10, wood: 5, gold: 5 },
    trainTimeMsPerUnit: 8000,
    capacityWeight: 1,
    upkeepPerTick: { food: 0.2, gold: 0 },
    baseStats: { hp: 35, atk: 6, def: 4, speed: 1.0 },
    desc: 'Core frontline melee soldiers with balanced durability and defense. Unlocked and leveled by the Fighter Camp.'
  },
  archer: {
    id: 'archer',
    name: 'Archers',
    icon: '🏹',
    role: TROOP_ROLES.RANGED,
    roleLabel: 'Ranged Support',
    tier: 1,
    requiredBuildings: { barracks: 1, archer_camp: 1 },
    levelCampBuilding: 'archer_camp',
    cost: { food: 10, wood: 10, gold: 8 },
    trainTimeMsPerUnit: 10000,
    capacityWeight: 1,
    upkeepPerTick: { food: 0.2, gold: 0.1 },
    baseStats: { hp: 25, atk: 8, def: 2, speed: 1.0 },
    desc: 'Ranged bowmen with higher attack power and lower durability. Unlocked and leveled by the Archer Camp.'
  }
};

export function normalizeLegacyTroopDefId(troopDefId) {
  if (troopDefId === 'militia') return 'infantry';
  return troopDefId;
}

export function getTroopDefinition(troopDefId) {
  if (!troopDefId || !TROOP_CATALOG[troopDefId]) return null;
  return TROOP_CATALOG[troopDefId];
}

export function getAllTroopDefinitions() {
  return Object.keys(TROOP_CATALOG).map(function(k) { return TROOP_CATALOG[k]; });
}

export function getCityCompletedBuildingLevel(city, buildingId) {
  if (!city || !buildingId) return 0;
  let maxLvl = 0;
  if (Array.isArray(city.plots)) {
    for (let i = 0; i < city.plots.length; i++) {
      const p = city.plots[i];
      if (!p || p.buildingId !== buildingId || (p.level || 0) <= 0) continue;
      if (p.demolishing) continue;
      if (p.underConstruction && (p.level || 0) <= 0) continue;
      if (p.level > maxLvl) maxLvl = p.level;
    }
  }
  if (maxLvl === 0 && city.buildings && typeof city.buildings[buildingId] === 'number' && city.buildings[buildingId] > 0) {
    maxLvl = city.buildings[buildingId];
  }
  return maxLvl;
}

export function getMissingTroopPrerequisites(city, troopDef) {
  if (!troopDef) return [];
  const reqs = troopDef.requiredBuildings || {};
  const keys = Object.keys(reqs);
  const missing = [];
  for (let i = 0; i < keys.length; i++) {
    const bId = keys[i];
    const reqLvl = reqs[bId] || 1;
    const curLvl = getCityCompletedBuildingLevel(city, bId);
    if (curLvl < reqLvl) {
      const bDef = CITY_BUILDINGS_CATALOG[bId];
      missing.push({
        buildingId: bId,
        buildingName: bDef ? bDef.name : bId,
        requiredLevel: reqLvl,
        currentLevel: curLvl
      });
    }
  }
  return missing;
}

export function getTroopMaxUnlockedLevel(city, troopDef) {
  if (!city || !troopDef) return 0;
  if (getMissingTroopPrerequisites(city, troopDef).length > 0) return 0;
  const campId = troopDef.levelCampBuilding || 'barracks';
  const campDef = CITY_BUILDINGS_CATALOG[campId];
  const campCap = (campDef && typeof campDef.maxLevel === 'number') ? campDef.maxLevel : 5;
  const campLvl = getCityCompletedBuildingLevel(city, campId);
  return Math.max(0, Math.min(campCap, campLvl));
}

export function computeTroopStatsForLevel(troopDef, level) {
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  const base = (troopDef && troopDef.baseStats) || { hp: 30, atk: 5, def: 3, speed: 1.0 };
  const mult = 1 + 0.20 * (lvl - 1);
  return {
    hp: Math.round((base.hp || 0) * mult),
    atk: Math.round((base.atk || 0) * mult),
    def: Math.round((base.def || 0) * mult),
    speed: base.speed || 1.0
  };
}

export function computeTroopCostForLevel(troopDef, level) {
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  const base = (troopDef && troopDef.cost) || {};
  const mult = 1 + 0.25 * (lvl - 1);
  const scaled = {};
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const rk = keys[i];
    const amt = base[rk] || 0;
    if (amt > 0) {
      scaled[rk] = Math.round(amt * mult);
    }
  }
  return scaled;
}

export function computeCityTroopCapacity(city) {
  if (!city) return 0;
  let cap = 0;
  let foundPlotBarracks = false;
  if (Array.isArray(city.plots)) {
    for (let i = 0; i < city.plots.length; i++) {
      const p = city.plots[i];
      if (!p || p.buildingId !== 'barracks' || (p.level || 0) <= 0 || p.demolishing) continue;
      foundPlotBarracks = true;
      cap += (p.level || 0) * 10;
    }
  }
  if (!foundPlotBarracks && city.buildings && (city.buildings.barracks || 0) > 0) {
    cap = (city.buildings.barracks || 0) * 10;
  }
  return cap;
}

export function computeCityTrainingSpeedMultiplier(city) {
  if (!city) return 1.0;
  let bonus = 0;
  let foundPlotCamp = false;
  if (Array.isArray(city.plots)) {
    for (let i = 0; i < city.plots.length; i++) {
      const p = city.plots[i];
      if (!p || p.buildingId !== 'fighter_camp' || (p.level || 0) <= 0 || p.demolishing) continue;
      foundPlotCamp = true;
      bonus += (p.level || 0) * 0.25;
    }
  }
  if (!foundPlotCamp && city.buildings && (city.buildings.fighter_camp || 0) > 0) {
    bonus = (city.buildings.fighter_camp || 0) * 0.25;
  }
  return Math.min(3.0, 1.0 + bonus);
}

export function computeTroopTrainingDurationMs(city, troopDef, level) {
  if (!troopDef) return 10000;
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  const baseMs = (troopDef.trainTimeMsPerUnit || 10000) * (1 + 0.20 * (lvl - 1));
  const mult = computeCityTrainingSpeedMultiplier(city);
  return Math.max(1500, Math.round(baseMs / mult));
}

export function computeTroopUpgradeCost(troopDef, fromLevel, toLevel) {
  if (!troopDef) return {};
  const srcCost = computeTroopCostForLevel(troopDef, fromLevel);
  const dstCost = computeTroopCostForLevel(troopDef, toLevel);
  const delta = {};
  const keys = Object.keys(dstCost);
  for (let i = 0; i < keys.length; i++) {
    const rk = keys[i];
    const diff = Math.max(0, (dstCost[rk] || 0) - (srcCost[rk] || 0));
    delta[rk] = diff;
  }
  return delta;
}

export function computeTroopUpgradeDurationMs(city, troopDef, fromLevel, toLevel) {
  const trainDur = computeTroopTrainingDurationMs(city, troopDef, toLevel);
  return Math.max(1500, Math.round(trainDur * 0.60));
}

export function getCityBarracksTroopGroups(world, cityId) {
  if (!world || !Array.isArray(world.troopGroups) || !cityId) return [];
  return world.troopGroups.filter(function(g) {
    return g && g.locationType === TROOP_LOCATION_TYPES.BARRACKS && g.locationId === cityId && (g.count || 0) > 0;
  });
}

export function getArmyTroopGroups(world, armyId) {
  if (!world || !Array.isArray(world.troopGroups) || !armyId) return [];
  return world.troopGroups.filter(function(g) {
    return g && g.locationType === TROOP_LOCATION_TYPES.ARMY && g.locationId === armyId && (g.count || 0) > 0;
  });
}

export function getArmyTotalTroopCount(world, armyId) {
  const groups = getArmyTroopGroups(world, armyId);
  let total = 0;
  for (let i = 0; i < groups.length; i++) {
    total += (groups[i].count || 0);
  }
  return total;
}

export function getCityDeployedArmyTroopCount(world, cityId) {
  if (!world || !cityId || !world.overworld || !Array.isArray(world.overworld.units)) return 0;
  const activeHomeArmyIds = {};
  for (let u = 0; u < world.overworld.units.length; u++) {
    const unit = world.overworld.units[u];
    if (unit && unit.alive && unit.unitType === 'army' && !unit.reintegrated && unit.homeCityId === cityId) {
      activeHomeArmyIds[unit.id] = true;
    }
  }
  if (!Array.isArray(world.troopGroups)) return 0;
  let deployed = 0;
  for (let i = 0; i < world.troopGroups.length; i++) {
    const g = world.troopGroups[i];
    if (!g || g.locationType !== TROOP_LOCATION_TYPES.ARMY || !activeHomeArmyIds[g.locationId] || (g.count || 0) <= 0) continue;
    const def = getTroopDefinition(g.troopDefId);
    const weight = (def && def.capacityWeight) ? def.capacityWeight : 1;
    deployed += (g.count || 0) * weight;
  }
  return deployed;
}

export function getCityTroopCountAtLevel(world, cityId, troopDefId, level) {
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  const groups = getCityBarracksTroopGroups(world, cityId);
  let total = 0;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].troopDefId === troopDefId && (groups[i].level || 1) === lvl) {
      total += (groups[i].count || 0);
    }
  }
  return total;
}

export function getCityTroopCapacityUsage(world, city) {
  const maxCapacity = computeCityTroopCapacity(city);
  if (!world || !city) {
    return { stationed: 0, deployed: 0, queuedRecruit: 0, upgrading: 0, queued: 0, totalUsed: 0, maxCapacity: maxCapacity, available: maxCapacity };
  }
  const groups = getCityBarracksTroopGroups(world, city.id);
  let stationed = 0;
  for (let i = 0; i < groups.length; i++) {
    const def = getTroopDefinition(groups[i].troopDefId);
    const weight = (def && def.capacityWeight) ? def.capacityWeight : 1;
    stationed += (groups[i].count || 0) * weight;
  }
  const deployed = getCityDeployedArmyTroopCount(world, city.id);
  let queuedRecruit = 0;
  let upgrading = 0;
  const tq = Array.isArray(city.troopTrainingQueue) ? city.troopTrainingQueue : [];
  for (let q = 0; q < tq.length; q++) {
    const item = tq[q];
    if (!item) continue;
    const rem = Math.max(0, (item.quantity || 0) - (item.completedCount || 0));
    const def = getTroopDefinition(item.troopDefId);
    const weight = (def && def.capacityWeight) ? def.capacityWeight : 1;
    if (item.jobKind === 'upgrade') {
      upgrading += rem * weight;
    } else {
      queuedRecruit += rem * weight;
    }
  }
  // Each troop is counted exactly once: Barracks stationed + Deployed armies + Queued recruits + Upgrading troops
  const totalUsed = stationed + deployed + queuedRecruit + upgrading;
  const available = Math.max(0, maxCapacity - totalUsed);
  return {
    stationed: stationed,
    deployed: deployed,
    queuedRecruit: queuedRecruit,
    upgrading: upgrading,
    queued: queuedRecruit,
    totalUsed: totalUsed,
    maxCapacity: maxCapacity,
    available: available
  };
}

export function computeMaxRecruitableQuantity(world, city, troopDef, level) {
  if (!world || !city || !troopDef) return 0;
  const maxLvl = getTroopMaxUnlockedLevel(city, troopDef);
  const reqLvl = level !== undefined && level !== null ? Math.floor(Number(level)) : maxLvl;
  if (maxLvl <= 0 || isNaN(reqLvl) || reqLvl < 1 || reqLvl > maxLvl) return 0;

  const tq = Array.isArray(city.troopTrainingQueue) ? city.troopTrainingQueue : [];
  const maxSlots = city.maxTroopQueueSlots || BASE_TROOP_QUEUE_LIMIT || 3;
  if (tq.length >= maxSlots) return 0;

  const usage = getCityTroopCapacityUsage(world, city);
  const weight = troopDef.capacityWeight || 1;
  const maxByCap = Math.floor(usage.available / weight);
  if (maxByCap <= 0) return 0;

  let maxByRes = Infinity;
  const cost = computeTroopCostForLevel(troopDef, reqLvl);
  const keys = Object.keys(cost);
  for (let i = 0; i < keys.length; i++) {
    const rk = keys[i];
    const unitCost = cost[rk] || 0;
    if (unitCost > 0) {
      const have = (city.stockpile && city.stockpile[rk]) || 0;
      const afford = Math.floor(have / unitCost);
      if (afford < maxByRes) maxByRes = afford;
    }
  }
  if (!isFinite(maxByRes)) maxByRes = maxByCap;
  return Math.max(0, Math.min(maxByCap, maxByRes));
}

export function computeMaxUpgradeableQuantity(world, city, troopDef, fromLevel, toLevel) {
  if (!world || !city || !troopDef) return 0;
  const maxLvl = getTroopMaxUnlockedLevel(city, troopDef);
  const srcLvl = Math.floor(Number(fromLevel || 0));
  const dstLvl = toLevel !== undefined && toLevel !== null ? Math.floor(Number(toLevel)) : maxLvl;
  if (maxLvl <= 0 || isNaN(srcLvl) || isNaN(dstLvl) || srcLvl < 1 || dstLvl <= srcLvl || dstLvl > maxLvl) return 0;

  const tq = Array.isArray(city.troopTrainingQueue) ? city.troopTrainingQueue : [];
  const maxSlots = city.maxTroopQueueSlots || BASE_TROOP_QUEUE_LIMIT || 3;
  if (tq.length >= maxSlots) return 0;

  const ownedAtLevel = getCityTroopCountAtLevel(world, city.id, troopDef.id, srcLvl);
  if (ownedAtLevel <= 0) return 0;

  let maxByRes = ownedAtLevel;
  const upgCost = computeTroopUpgradeCost(troopDef, srcLvl, dstLvl);
  const keys = Object.keys(upgCost);
  for (let i = 0; i < keys.length; i++) {
    const rk = keys[i];
    const unitCost = upgCost[rk] || 0;
    if (unitCost > 0) {
      const have = (city.stockpile && city.stockpile[rk]) || 0;
      const afford = Math.floor(have / unitCost);
      if (afford < maxByRes) maxByRes = afford;
    }
  }
  return Math.max(0, Math.min(ownedAtLevel, maxByRes));
}

export function evaluateTroopAvailability(world, city, troopDef, selectedQty, selectedLevel) {
  const qty = Math.max(1, Math.floor(Number(selectedQty || 1)));
  const missingPrereqs = getMissingTroopPrerequisites(city, troopDef);
  const maxUnlockedLevel = getTroopMaxUnlockedLevel(city, troopDef);
  const lvl = (selectedLevel !== undefined && selectedLevel !== null)
    ? Math.floor(Number(selectedLevel))
    : Math.max(1, maxUnlockedLevel);
  const levelLocked = maxUnlockedLevel <= 0 || isNaN(lvl) || lvl < 1 || lvl > maxUnlockedLevel;

  const usage = getCityTroopCapacityUsage(world, city);
  const weight = (troopDef && troopDef.capacityWeight) ? troopDef.capacityWeight : 1;
  const tq = (city && Array.isArray(city.troopTrainingQueue)) ? city.troopTrainingQueue : [];
  const maxSlots = (city && city.maxTroopQueueSlots) || BASE_TROOP_QUEUE_LIMIT || 3;
  const queueFull = tq.length >= maxSlots;
  const maxByCapacity = Math.floor(usage.available / weight);

  let maxByResources = Infinity;
  const missingResources = [];
  const cost = computeTroopCostForLevel(troopDef, Math.max(1, lvl));
  const keys = Object.keys(cost);
  for (let i = 0; i < keys.length; i++) {
    const rk = keys[i];
    const unitCost = cost[rk] || 0;
    if (unitCost > 0) {
      const have = (city && city.stockpile && city.stockpile[rk]) || 0;
      const afford = Math.floor(have / unitCost);
      if (afford < maxByResources) maxByResources = afford;
      if (have < unitCost * qty) {
        missingResources.push({ resource: rk, need: unitCost * qty, have: have });
      }
    }
  }
  if (!isFinite(maxByResources)) maxByResources = maxByCapacity;

  const maxRecruitable = (missingPrereqs.length > 0 || levelLocked || queueFull)
    ? 0
    : Math.max(0, Math.min(maxByCapacity, maxByResources));

  let state = TROOP_AVAILABILITY_STATES.AVAILABLE;
  if (missingPrereqs.length > 0 || levelLocked) {
    state = TROOP_AVAILABILITY_STATES.LOCKED;
  } else if (queueFull) {
    state = TROOP_AVAILABILITY_STATES.QUEUE_FULL;
  } else if (usage.available < qty * weight) {
    state = TROOP_AVAILABILITY_STATES.INSUFFICIENT_CAPACITY;
  } else if (missingResources.length > 0) {
    state = TROOP_AVAILABILITY_STATES.INSUFFICIENT_RESOURCES;
  }

  return {
    state: state,
    level: lvl,
    maxUnlockedLevel: maxUnlockedLevel,
    missingPrerequisites: missingPrereqs,
    missingResources: missingResources,
    queueFull: queueFull,
    maxByCapacity: maxByCapacity,
    maxByResources: maxByResources,
    maxRecruitable: maxRecruitable,
    capacityNeeded: qty * weight,
    capacityAvailable: usage.available
  };
}

export function getCityTroopInventorySummary(world, city) {
  const defs = getAllTroopDefinitions();
  const capacity = getCityTroopCapacityUsage(world, city);
  const groups = (world && city) ? getCityBarracksTroopGroups(world, city.id) : [];
  const tq = (city && Array.isArray(city.troopTrainingQueue)) ? city.troopTrainingQueue : [];

  const rowMap = {};
  function ensureRow(td, level) {
    const key = td.id + ':' + level;
    if (!rowMap[key]) {
      rowMap[key] = {
        key: key,
        troopDefId: td.id,
        name: td.name,
        icon: td.icon,
        role: td.role,
        roleLabel: td.roleLabel || td.role,
        level: level,
        trained: 0,
        training: 0,
        upgradingIn: 0,
        projectedTotal: 0,
        maxUnlockedLevel: getTroopMaxUnlockedLevel(city, td)
      };
    }
    return rowMap[key];
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const td = getTroopDefinition(g.troopDefId);
    if (!td) continue;
    const row = ensureRow(td, g.level || 1);
    row.trained += (g.count || 0);
  }

  for (let qi = 0; qi < tq.length; qi++) {
    const item = tq[qi];
    if (!item) continue;
    const td = getTroopDefinition(item.troopDefId);
    if (!td) continue;
    const rem = Math.max(0, (item.quantity || 0) - (item.completedCount || 0));
    if (rem <= 0) continue;
    if (item.jobKind === 'upgrade') {
      const dstRow = ensureRow(td, item.toLevel || 2);
      dstRow.upgradingIn += rem;
    } else {
      const rRow = ensureRow(td, item.level || 1);
      rRow.training += rem;
    }
  }

  const byTypeAndLevel = [];
  let totalTrained = 0;
  let totalTraining = 0;
  let totalUpgrading = 0;

  const byTypeTotals = defs.map(function(td) {
    let typeTrained = 0;
    let typeTraining = 0;
    let typeUpgrading = 0;
    const typeRows = Object.keys(rowMap)
      .filter(function(k) { return rowMap[k].troopDefId === td.id; })
      .map(function(k) { return rowMap[k]; })
      .sort(function(a, b) { return a.level - b.level; });

    for (let i = 0; i < typeRows.length; i++) {
      const r = typeRows[i];
      r.projectedTotal = r.trained + r.training + r.upgradingIn;
      typeTrained += r.trained;
      typeTraining += r.training;
      typeUpgrading += r.upgradingIn;
      byTypeAndLevel.push(r);
    }

    totalTrained += typeTrained;
    totalTraining += typeTraining;
    totalUpgrading += typeUpgrading;

    return {
      troopDefId: td.id,
      name: td.name,
      icon: td.icon,
      role: td.role,
      roleLabel: td.roleLabel || td.role,
      maxUnlockedLevel: getTroopMaxUnlockedLevel(city, td),
      unlocked: getTroopMaxUnlockedLevel(city, td) >= 1,
      trained: typeTrained,
      training: typeTraining,
      upgrading: typeUpgrading,
      projectedTotal: typeTrained + typeTraining + typeUpgrading
    };
  });

  return {
    byTypeAndLevel: byTypeAndLevel,
    byType: byTypeTotals,
    totals: {
      trained: totalTrained,
      training: totalTraining,
      upgrading: totalUpgrading,
      projectedTotal: totalTrained + totalTraining + totalUpgrading
    },
    capacity: capacity
  };
}
