// Military Troop Archetype Definitions, Level Progression, Upgrade Formulas & Barracks Inventory Helpers (Task 05A / C2 / C3)
// Strictly separates Barracks military troops (locationType: 'barracks') from City Garrison militia.

import { CITY_BUILDINGS_CATALOG } from './buildings.js';
import {
  BASE_TROOP_QUEUE_LIMIT,
  ARMY_COMBAT_ROUND_DURATION_MS,
  MAX_MILITARY_COMBAT_ROUNDS
} from '../constants.js';

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
  ENGAGE_TARGET: 'engage_target',
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

// Reusable Deployed Army Display Number helpers (Task 05B-1-C1)
// Display numbers are strictly user-facing labels derived from currently active deployed armies
// and are completely separate from the persistent, never-reused internal army.id.
export function isActiveDeployedArmy(unit) {
  return Boolean(
    unit &&
    unit.unitType === 'army' &&
    unit.alive &&
    !unit.reintegrated &&
    unit.status !== 'retired'
  );
}

export function parseArmyDisplayNumber(unit) {
  if (!unit) return null;
  if (typeof unit.displayNumber === 'number' && isFinite(unit.displayNumber) && unit.displayNumber >= 1 && Math.floor(unit.displayNumber) === unit.displayNumber) {
    return unit.displayNumber;
  }
  const label = String(unit.shortName || unit.name || '');
  const m = label.match(/#(\d+)/);
  if (m && m[1]) {
    const parsed = parseInt(m[1], 10);
    if (isFinite(parsed) && parsed >= 1) return parsed;
  }
  return null;
}

export function allocateLowestArmyDisplayNumber(units, excludeArmyId) {
  const used = {};
  const list = Array.isArray(units) ? units : [];
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    if (!isActiveDeployedArmy(u)) continue;
    if (excludeArmyId && u.id === excludeArmyId) continue;
    const n = parseArmyDisplayNumber(u);
    if (n !== null) {
      used[n] = true;
    }
  }
  let candidate = 1;
  while (used[candidate]) {
    candidate++;
  }
  return candidate;
}

// =============================================================================
// Military Targets, Typed Access-Gating & Deterministic Combat (Task 05B-2)
// =============================================================================
export const MILITARY_TARGET_STATUS = {
  ACTIVE: 'active',
  CLEARED: 'cleared'
};

export const MILITARY_TARGET_ARCHETYPES = {
  raider_blockade: {
    id: 'raider_blockade',
    name: 'Hostile Military Blockade',
    icon: '⚔️',
    accentColor: '#ef4444',
    clearedColor: '#34d399',
    enemyLabel: 'Organized Raider Warband',
    desc: 'A fortified hostile military position denying safe Hero access to surrounding frontier locations.'
  }
};

// Deterministic initial military targets (never blocks poi_dungeon_starfall so early onboarding stays intact)
// PF-01: Ironjaw Blockade Camp sits at hex distance 5 from spawn so it is immediately discovered & visible
// as soon as the player founds their starting Bastion City (city vision radius 5).
export const DEFAULT_MILITARY_TARGET_SPECS = [
  {
    id: 'mtarget_quarry_blockade',
    archetypeId: 'raider_blockade',
    name: 'Ironjaw Blockade Camp',
    desiredDx: -4,
    desiredDy: 2,
    enemyPower: 100,
    enemyLabel: 'Ironjaw Raider Warband',
    desc: 'Nearby fortified raider blockade barring Hero access to the Sunken Copper Quarry.',
    blocksAccess: [
      {
        accessType: 'overworld_poi',
        targetRef: 'poi_dungeon_quarry',
        label: 'Sunken Copper Quarry'
      }
    ]
  },
  {
    id: 'mtarget_mycelium_war_camp',
    archetypeId: 'raider_blockade',
    name: 'Ashveil War-Camp',
    desiredDx: 10,
    desiredDy: 6,
    enemyPower: 180,
    enemyLabel: 'Ashveil Vanguard Cohort',
    desc: 'Entrenched frontier war-camp blocking safe Hero approaches to the Whispering Mycelium Labyrinth.',
    blocksAccess: [
      {
        accessType: 'overworld_poi',
        targetRef: 'poi_dungeon_mycelium',
        label: 'Whispering Mycelium Labyrinth'
      }
    ]
  }
];

export function getMilitaryTargetById(overworld, targetId) {
  if (!overworld || !Array.isArray(overworld.militaryTargets) || !targetId) return null;
  for (let i = 0; i < overworld.militaryTargets.length; i++) {
    const t = overworld.militaryTargets[i];
    if (t && t.id === targetId) return t;
  }
  return null;
}

export function getMilitaryTargetAtHex(overworld, x, y) {
  if (!overworld || !Array.isArray(overworld.militaryTargets)) return null;
  for (let i = 0; i < overworld.militaryTargets.length; i++) {
    const t = overworld.militaryTargets[i];
    if (t && t.x === x && t.y === y) return t;
  }
  return null;
}

// Authoritative access-gate query derived strictly from militaryTargets[].status
export function getBlockingMilitaryTargetForAccess(overworld, accessType, targetRef) {
  if (!overworld || !Array.isArray(overworld.militaryTargets) || !accessType || !targetRef) return null;
  for (let i = 0; i < overworld.militaryTargets.length; i++) {
    const t = overworld.militaryTargets[i];
    if (!t || t.status === MILITARY_TARGET_STATUS.CLEARED) continue;
    const blocks = Array.isArray(t.blocksAccess) ? t.blocksAccess : [];
    for (let b = 0; b < blocks.length; b++) {
      const desc = blocks[b];
      if (desc && desc.accessType === accessType && desc.targetRef === targetRef) {
        return t;
      }
    }
  }
  return null;
}

export function computeSingleTroopCombatPower(troopDef, level) {
  if (!troopDef) return 0;
  const stats = computeTroopStatsForLevel(troopDef, level || 1);
  return Math.max(1, Math.round((stats.atk || 0) * 2 + (stats.def || 0) * 1.5 + (stats.hp || 0) * 0.2));
}

export function computeTroopListCombatPower(troopEntries) {
  if (!Array.isArray(troopEntries) || troopEntries.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < troopEntries.length; i++) {
    const e = troopEntries[i];
    if (!e) continue;
    const cnt = Math.max(0, Math.floor(Number(e.count !== undefined ? e.count : (e.quantity || 0))));
    if (cnt <= 0) continue;
    const td = getTroopDefinition(e.troopDefId);
    if (!td) continue;
    total += cnt * computeSingleTroopCombatPower(td, e.level || 1);
  }
  return total;
}

export function computeArmyCombatPower(world, armyId) {
  const groups = getArmyTroopGroups(world, armyId);
  return computeTroopListCombatPower(groups);
}

// Deterministic Proportional Largest-Remainder Casualty Allocation (zero role bias)
// Returns an array of { groupId, troopDefId, level, initialCount, lost, surviving }
export function allocateProportionalCasualties(armyGroups, totalLosses) {
  const validGroups = (Array.isArray(armyGroups) ? armyGroups : [])
    .filter(function(g) { return g && (g.count || 0) > 0; })
    .slice()
    .sort(function(a, b) {
      if (a.troopDefId !== b.troopDefId) return a.troopDefId < b.troopDefId ? -1 : 1;
      const la = a.level || 1;
      const lb = b.level || 1;
      if (la !== lb) return la - lb;
      const ia = String(a.id || '');
      const ib = String(b.id || '');
      return ia < ib ? -1 : (ia > ib ? 1 : 0);
    });

  let totalTroops = 0;
  for (let i = 0; i < validGroups.length; i++) {
    totalTroops += Math.floor(validGroups[i].count || 0);
  }

  const clampedLosses = Math.max(0, Math.min(Math.max(0, totalTroops - 1), Math.floor(Number(totalLosses || 0))));
  const rows = validGroups.map(function(g) {
    const cnt = Math.floor(g.count || 0);
    const exact = totalTroops > 0 ? (clampedLosses * (cnt / totalTroops)) : 0;
    const base = Math.min(cnt, Math.floor(exact));
    return {
      groupId: g.id,
      troopDefId: g.troopDefId,
      level: g.level || 1,
      initialCount: cnt,
      lost: base,
      remainder: exact - base
    };
  });

  let assigned = 0;
  for (let i = 0; i < rows.length; i++) assigned += rows[i].lost;
  let leftover = clampedLosses - assigned;

  if (leftover > 0 && rows.length > 0) {
    const order = rows.slice().sort(function(a, b) {
      if (Math.abs(b.remainder - a.remainder) > 1e-9) return b.remainder - a.remainder;
      if (b.initialCount !== a.initialCount) return b.initialCount - a.initialCount;
      if (a.troopDefId !== b.troopDefId) return a.troopDefId < b.troopDefId ? -1 : 1;
      if (a.level !== b.level) return a.level - b.level;
      return String(a.groupId || '') < String(b.groupId || '') ? -1 : 1;
    });

    let guard = 0;
    while (leftover > 0 && guard < rows.length * 4) {
      let progressed = false;
      for (let i = 0; i < order.length && leftover > 0; i++) {
        const row = order[i];
        if (row.lost < row.initialCount) {
          row.lost++;
          leftover--;
          progressed = true;
        }
      }
      if (!progressed) break;
      guard++;
    }
  }

  return rows.map(function(r) {
    return {
      groupId: r.groupId,
      troopDefId: r.troopDefId,
      level: r.level,
      initialCount: r.initialCount,
      lost: r.lost,
      surviving: Math.max(0, r.initialCount - r.lost)
    };
  });
}

// Isolated, tunable deterministic combat resolver for Task 05B-2:
// - Victory: armyPower >= enemyPower; lossRate = clamp(0.05, 0.25, (enemyPower / armyPower) * 0.25)
// - Defeat:  armyPower < enemyPower;  lossRate = clamp(0.20, 0.45, 0.45 - (armyPower / enemyPower) * 0.20)
// - Always leaves >= 1 surviving troop so army lifecycle & return/reintegration remain intact.
export function resolveMilitaryTargetCombat(world, armyId, target) {
  const groups = getArmyTroopGroups(world, armyId);
  let totalTroops = 0;
  for (let i = 0; i < groups.length; i++) {
    totalTroops += Math.floor(groups[i].count || 0);
  }
  const armyPower = computeTroopListCombatPower(groups);
  const enemyPower = Math.max(1, Math.floor(Number((target && target.enemyPower) || 100)));
  const victory = totalTroops > 0 && armyPower >= enemyPower;

  let lossRate = 0;
  let totalLosses = 0;
  if (totalTroops > 0) {
    if (victory) {
      const rawRate = (enemyPower / Math.max(1, armyPower)) * 0.25;
      lossRate = Math.max(0.05, Math.min(0.25, rawRate));
      totalLosses = Math.min(totalTroops - 1, Math.round(totalTroops * lossRate));
    } else {
      const rawRate = 0.45 - (armyPower / enemyPower) * 0.20;
      lossRate = Math.max(0.20, Math.min(0.45, rawRate));
      const minLoss = totalTroops > 1 ? 1 : 0;
      totalLosses = Math.min(totalTroops - 1, Math.max(minLoss, Math.round(totalTroops * lossRate)));
    }
  }

  const allocations = allocateProportionalCasualties(groups, totalLosses);
  let actualLosses = 0;
  for (let i = 0; i < allocations.length; i++) {
    actualLosses += allocations[i].lost;
  }

  return {
    victory: victory,
    armyPower: armyPower,
    enemyPower: enemyPower,
    lossRate: lossRate,
    initialTroops: totalTroops,
    totalLosses: actualLosses,
    survivingTroops: Math.max(0, totalTroops - actualLosses),
    allocations: allocations
  };
}

// =============================================================================
// Timed Round-Based Battle State & Step Calculator (CB-01 & CB-05)
// Preserves exact 05B-2 combat outcome and total casualty formulas while
// executing discrete, authoritative rounds separated from UI animations.
// =============================================================================
export function computePlannedCombatRounds(armyPower, enemyPower, maxRounds) {
  const cap = typeof maxRounds === 'number' && maxRounds >= 1 ? Math.floor(maxRounds) : (MAX_MILITARY_COMBAT_ROUNDS || 10);
  const ratio = (armyPower || 0) / Math.max(1, enemyPower || 1);
  let planned = 3;
  if (ratio >= 2.0) {
    planned = 1; // Overwhelming force vs very weak enemy finishes in 1 round
  } else if (ratio >= 1.35 || ratio < 0.60) {
    planned = 2; // Clear advantage or heavy mismatch finishes in 2 rounds
  } else {
    planned = 3; // Close / equal-strength engagement plays across 3 rounds
  }
  return Math.max(1, Math.min(cap, planned));
}

export function createMilitaryBattleState(world, army, target, simTimeMs, roundDurationMs) {
  const baseRes = resolveMilitaryTargetCombat(world, army ? army.id : null, target);
  const maxRounds = MAX_MILITARY_COMBAT_ROUNDS || 10;
  const plannedRounds = computePlannedCombatRounds(baseRes.armyPower, baseRes.enemyPower, maxRounds);
  const rDur = Math.max(250, typeof roundDurationMs === 'number' && isFinite(roundDurationMs) ? roundDurationMs : (ARMY_COMBAT_ROUND_DURATION_MS || 3000));

  const plannedEnemyTotalLoss = baseRes.victory
    ? baseRes.enemyPower
    : Math.max(1, Math.min(baseRes.enemyPower - 1, Math.round(baseRes.enemyPower * Math.min(0.65, (baseRes.armyPower / Math.max(1, baseRes.enemyPower)) * 0.60))));

  const unlockedLabels = baseRes.victory && target && Array.isArray(target.blocksAccess)
    ? target.blocksAccess.map(function(b) { return b.label || b.targetRef; })
    : [];

  return {
    battleId: 'battle_' + (army ? army.id : 'army') + '_' + (target ? target.id : 'target') + '_' + (simTimeMs || 0),
    participants: {
      friendly: {
        armyId: army ? army.id : null,
        armyName: army ? (army.shortName || army.name) : 'Field Army',
        homeCityId: army ? (army.homeCityId || null) : null
      },
      enemy: {
        targetId: target ? target.id : null,
        targetName: target ? target.name : 'Military Target',
        enemyLabel: target ? (target.enemyLabel || 'Hostile Force') : 'Hostile Force'
      }
    },
    location: {
      x: target ? target.x : (army ? army.x : 0),
      y: target ? target.y : (army ? army.y : 0)
    },
    targetId: target ? target.id : null,
    targetName: target ? target.name : 'Military Target',
    startedAtSimMs: simTimeMs || 0,
    endedAtSimMs: null,
    roundDurationMs: rDur,
    currentRound: 0,
    maxRounds: maxRounds,
    plannedRounds: plannedRounds,
    expectedVictory: baseRes.victory,
    initialStrengths: {
      friendlyTroops: baseRes.initialTroops,
      friendlyPower: baseRes.armyPower,
      enemyPower: baseRes.enemyPower
    },
    finalStrengths: {
      friendlyTroops: baseRes.initialTroops,
      friendlyPower: baseRes.armyPower,
      enemyPower: baseRes.enemyPower
    },
    friendlyTotalLosses: 0,
    enemyTotalLosses: 0,
    plannedFriendlyLossesRemaining: baseRes.totalLosses,
    plannedEnemyLossesRemaining: plannedEnemyTotalLoss,
    outcome: null,
    rounds: [],
    casualtyEvents: [],
    rewards: {
      unlockedLabels: unlockedLabels
    }
  };
}

// Pure per-round combat step calculator (returns round delta & terminal status without mutating troopGroups directly)
export function computeNextBattleRoundStep(world, armyId, battle, simTimeMs) {
  if (!battle || battle.outcome) {
    return { skipped: true, terminal: true };
  }
  const nextRound = (battle.currentRound || 0) + 1;
  const remainingRounds = Math.max(1, (battle.plannedRounds || 1) - (battle.currentRound || 0));
  const isFinalPlanned = nextRound >= (battle.plannedRounds || 1);
  const isStalemateCap = nextRound >= (battle.maxRounds || MAX_MILITARY_COMBAT_ROUNDS || 10);

  const liveGroups = getArmyTroopGroups(world, armyId);
  let liveTroops = 0;
  for (let i = 0; i < liveGroups.length; i++) {
    liveTroops += Math.floor(liveGroups[i].count || 0);
  }

  // Distribute remaining planned friendly losses evenly across remaining rounds
  const remFriendly = Math.max(0, Math.floor(battle.plannedFriendlyLossesRemaining || 0));
  const rawFriendlyThisRound = isFinalPlanned || isStalemateCap
    ? remFriendly
    : Math.floor(remFriendly / remainingRounds);
  const friendlyLossesTarget = Math.min(Math.max(0, liveTroops - 1), rawFriendlyThisRound);
  const allocations = allocateProportionalCasualties(liveGroups, friendlyLossesTarget);
  let friendlyLosses = 0;
  for (let i = 0; i < allocations.length; i++) {
    friendlyLosses += allocations[i].lost;
  }

  // Distribute remaining planned enemy power loss evenly across remaining rounds
  const remEnemy = Math.max(0, Math.floor(battle.plannedEnemyLossesRemaining || 0));
  const enemyPowerLost = isFinalPlanned || isStalemateCap
    ? remEnemy
    : Math.max(remEnemy > 0 ? 1 : 0, Math.floor(remEnemy / remainingRounds));

  const friendlyTroopsAfter = Math.max(0, liveTroops - friendlyLosses);
  const enemyPowerAfter = Math.max(0, (battle.finalStrengths ? battle.finalStrengths.enemyPower : 0) - enemyPowerLost);

  // Terminal condition check (including stalemate safety cap)
  const terminal = Boolean(
    isFinalPlanned ||
    isStalemateCap ||
    enemyPowerAfter <= 0 ||
    liveTroops <= 0
  );
  const outcome = terminal
    ? (battle.expectedVictory && liveTroops > 0 ? 'victory' : 'defeat')
    : null;

  const casualtyEvents = [];
  if (friendlyLosses > 0) {
    casualtyEvents.push({
      round: nextRound,
      simTimeMs: simTimeMs || 0,
      side: 'friendly',
      amount: friendlyLosses,
      unitLabel: 'Troops'
    });
  }
  if (enemyPowerLost > 0) {
    casualtyEvents.push({
      round: nextRound,
      simTimeMs: simTimeMs || 0,
      side: 'enemy',
      amount: enemyPowerLost,
      unitLabel: 'Threat'
    });
  }

  return {
    skipped: false,
    round: nextRound,
    simTimeMs: simTimeMs || 0,
    friendlyLosses: friendlyLosses,
    enemyPowerLost: enemyPowerLost,
    allocations: allocations,
    friendlyTroopsAfter: friendlyTroopsAfter,
    enemyPowerAfter: enemyPowerAfter,
    casualtyEvents: casualtyEvents,
    terminal: terminal,
    stalemateCapped: Boolean(isStalemateCap && !isFinalPlanned),
    outcome: outcome
  };
}
