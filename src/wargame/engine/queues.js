// TimedQueueManager — Real-Time Unit Marching, City Construction Queues & Resource Production Tickers

import {
  CAMPAIGN_PHASES,
  STREAM_TOPICS,
  RESOURCE_PRODUCTION_INTERVAL_MS,
  BASE_HERO_RECRUIT_DURATION_MS,
  WINDMILL_ADJACENCY_BONUS,
  ARMY_PATROL_DURATION_MS
} from '../constants.js';
import { CITY_BUILDINGS_CATALOG } from '../data/buildings.js';
import {
  getTroopDefinition,
  computeTroopTrainingDurationMs,
  computeTroopUpgradeDurationMs,
  TROOP_LOCATION_TYPES,
  ARMY_OBJECTIVE_TYPES,
  ARMY_OBJECTIVE_STATUS,
  getArmyTroopGroups
} from '../data/troops.js';
import { UNIT_ARCHETYPES, RECRUITABLE_HERO_CLASSES } from '../data/terrain.js';
import { revealOverworldVision, findOverworldPath } from './pathfinding.js';
import { evaluateTaskDAG } from './taskEngine.js';
import { saveWargameState, getPrimaryCity, computeCityStorageCaps } from './state.js';
import { getCanonicalPlayerId } from '../../core/canonicalIdentity.js';

export function scheduleNextMarchStep(unit, state, scheduler) {
  if (!unit || !unit.marchPlan || !Array.isArray(unit.marchPlan.remainingPath) || unit.marchPlan.remainingPath.length === 0) {
    return null;
  }

  const simTimeMs = state.world.clock.simTimeMs;
  const nextStep = unit.marchPlan.remainingPath[0];
  const stepDur = Math.max(250, nextStep.stepDurationMs || 3000);

  const job = scheduler.scheduleJob({
    jobId: 'march_' + unit.id + '_' + simTimeMs + '_' + Math.floor(Math.random() * 10000),
    jobType: 'UNIT_MARCH_STEP',
    ownerId: unit.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + stepDur,
    payload: {
      unitId: unit.id,
      fromX: unit.x,
      fromY: unit.y,
      toX: nextStep.x,
      toY: nextStep.y
    }
  });

  unit.status = (unit.unitType === 'army' && unit.marchPlan.intent === 'return_home') ? 'returning' : 'marching';
  unit.marchPlan.activeJobId = job.jobId;
  unit.marchPlan.stepStartSimTimeMs = simTimeMs;
  unit.marchPlan.stepDueSimTimeMs = simTimeMs + stepDur;
  unit.marchPlan.fromX = unit.x;
  unit.marchPlan.fromY = unit.y;
  unit.marchPlan.toX = nextStep.x;
  unit.marchPlan.toY = nextStep.y;

  return job;
}

export function checkAndDiscoverDungeonsInVision(ow, simTimeMs, eventStream) {
  if (!ow || !Array.isArray(ow.pois) || !Array.isArray(ow.explored)) return [];
  const newlyDiscovered = [];
  for (let i = 0; i < ow.pois.length; i++) {
    const poi = ow.pois[i];
    if (poi.type !== 'dungeon_entrance' || poi.discovered) continue;
    if (ow.explored[poi.y] && ow.explored[poi.y][poi.x]) {
      poi.discovered = true;
      newlyDiscovered.push(poi);
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.DUNGEON_DISCOVERED, {
          poiId: poi.id,
          dungeonId: poi.dungeonId,
          profileId: poi.profileId,
          dungeonName: poi.name,
          x: poi.x,
          y: poi.y
        }, simTimeMs);
      }
    }
  }
  return newlyDiscovered;
}

export function depositUnitCargoAtCity(unit, city, state, simTimeMs, eventStream) {
  if (!unit || !unit.cargo || !city || !city.stockpile) return false;
  const c = unit.cargo;
  const gold = c.gold || 0;
  const ore = c.ore || 0;
  const gems = c.gems || 0;
  const gearItems = Array.isArray(c.gearItems) ? c.gearItems : [];
  const gearCount = Math.max(c.gearCount || 0, gearItems.length);
  if (gold <= 0 && ore <= 0 && gems <= 0 && gearCount <= 0) {
    unit.cargo = null;
    return false;
  }

  city.stockpile.gold = (city.stockpile.gold || 0) + gold;
  city.stockpile.ore  = (city.stockpile.ore  || 0) + ore;
  if (gems > 0) {
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
    city.gems.ruby = (city.gems.ruby || 0) + gems;
  }

  // Deposit looted dungeon equipment items into the party leader Hero's bagGear!
  if (gearItems.length > 0 && state && state.world && Array.isArray(state.world.heroes)) {
    const leaderHero = state.world.heroes.find(function(h) { return h.id === unit.leaderHeroId; }) || state.world.heroes[0];
    if (leaderHero) {
      if (!Array.isArray(leaderHero.bagGear)) leaderHero.bagGear = [];
      for (let gi = 0; gi < gearItems.length; gi++) {
        leaderHero.bagGear.push(gearItems[gi]);
      }
    }
  }
  unit.cargo = null;
  if (state && state.world && state.world.stats) {
    state.world.stats.expeditionsBanked = (state.world.stats.expeditionsBanked || 0) + 1;
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.EXPEDITION_BANKED, {
      unitId: unit.id,
      unitName: unit.shortName,
      cityId: city.id,
      cityName: city.name,
      gold: gold,
      ore: ore,
      gems: gems,
      gearCount: gearCount
    }, simTimeMs);
  }
  return true;
}

export function resolveOverworldSkirmish(unit, hostile, state, scheduler, simTimeMs, eventStream) {
  if (!unit || !hostile || !hostile.alive) return { victory: true, skipped: true };
  const world = state && state.world;
  const hero = (world && Array.isArray(world.heroes))
    ? world.heroes.find(function(h) { return h.id === unit.leaderHeroId; })
    : null;

  const heroAtk = (hero && hero.stats && hero.stats.atk) ? hero.stats.atk : 26;
  const heroDef = (hero && hero.stats && hero.stats.def) ? hero.stats.def : 12;
  const heroLvl = (hero && hero.level) ? hero.level : 1;
  const effectiveAtk = heroAtk + (heroLvl - 1) * 4;

  const roundsToKill = Math.max(1, Math.ceil((hostile.hp || 60) / Math.max(5, effectiveAtk)));
  const dmgPerRound = Math.max(2, (hostile.power || 18) - Math.floor(heroDef * 0.6));
  const totalDmg = dmgPerRound * Math.max(1, roundsToKill - 1);

  if ((unit.hp || 1) > totalDmg) {
    unit.hp = Math.max(1, unit.hp - totalDmg);
    hostile.alive = false;
    if (world && world.stats) {
      world.stats.skirmishesWon = (world.stats.skirmishesWon || 0) + 1;
    }
    if (hero) {
      hero.xp = (hero.xp || 0) + (hostile.rewardXp || 25);
    }
    if (!unit.cargo) {
      unit.cargo = { gold: 0, ore: 0, gems: 0, gearCount: 0 };
    }
    unit.cargo.gold = (unit.cargo.gold || 0) + (hostile.rewardGold || 20);
    unit.cargo.ore  = (unit.cargo.ore  || 0) + (hostile.rewardOre  || 4);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.OVERWORLD_SKIRMISH, {
        victory: true,
        unitId: unit.id,
        unitName: unit.shortName,
        hostileId: hostile.id,
        hostileName: hostile.name,
        damageTaken: totalDmg,
        rewardGold: hostile.rewardGold || 20,
        rewardOre: hostile.rewardOre || 4,
        rewardXp: hostile.rewardXp || 25
      }, simTimeMs);
    }
    return { victory: true, damageTaken: totalDmg };
  }

  // Defeat in Overworld Skirmish: Non-permanent retreat back to City Guild Hall
  if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
    scheduler.cancelJob(unit.marchPlan.activeJobId);
  }
  const city = getPrimaryCity(state);
  if (city) {
    unit.x = city.x;
    unit.y = city.y;
  }
  unit.status = 'idle';
  unit.marchPlan = null;
  unit.hp = unit.maxHp;
  unit.cargo = null;

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.OVERWORLD_SKIRMISH, {
      victory: false,
      unitId: unit.id,
      unitName: unit.shortName,
      hostileId: hostile.id,
      hostileName: hostile.name,
      retreatedToCity: city ? city.name : 'Bastion'
    }, simTimeMs);
  }
  return { victory: false };
}

export function resolveMarchStepJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.overworld) return;
  const ow = state.world.overworld;
  const unitId = job.payload && job.payload.unitId;
  const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
  if (!unit || !unit.marchPlan) return;

  const targetX = job.payload.toX;
  const targetY = job.payload.toY;

  unit.x = targetX;
  unit.y = targetY;
  state.world.stats.totalUnitSteps = (state.world.stats.totalUnitSteps || 0) + 1;

  revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 4);
  checkAndDiscoverDungeonsInVision(ow, job.dueSimTimeMs, eventStream);

  // Check for Wandering Hostile interception for Hero Parties
  if (unit.unitType === 'hero_party' && Array.isArray(ow.hostiles)) {
    const encountered = ow.hostiles.find(function(h) {
      return h.alive && h.x === unit.x && h.y === unit.y;
    });
    if (encountered) {
      const skirmishRes = resolveOverworldSkirmish(unit, encountered, state, scheduler, job.dueSimTimeMs, eventStream);
      if (!skirmishRes.victory) {
        state._dirty = true;
        saveWargameState(state, scheduler);
        evaluateTaskDAG(state, eventStream);
        return;
      }
    }
  }

  // Check if non-army unit stepped onto a supply cache POI (armies on patrol do not harvest caches in 05B-1)
  if (unit.unitType !== 'army' && Array.isArray(ow.pois)) {
    for (let i = 0; i < ow.pois.length; i++) {
      const poi = ow.pois[i];
      if (!poi.depleted && poi.type === 'resource_cache' && poi.x === unit.x && poi.y === unit.y) {
        poi.depleted = true;
        const yieldRes = poi.yield || { wood: 25, stone: 20 };
        const cityKeys = Object.keys(state.world.cities || {});
        const stock = cityKeys.length > 0
          ? state.world.cities[cityKeys[0]].stockpile
          : state.world.realmStockpile;
        if (yieldRes.wood) stock.wood = (stock.wood || 0) + yieldRes.wood;
        if (yieldRes.stone) stock.stone = (stock.stone || 0) + yieldRes.stone;
        if (yieldRes.food) stock.food = (stock.food || 0) + yieldRes.food;
        state.world.stats.resourcesHarvested = (state.world.stats.resourcesHarvested || 0) + 1;
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.RESOURCE_HARVESTED, {
            unitId: unit.id,
            unitName: unit.shortName,
            poiName: poi.name,
            yield: yieldRes
          }, job.dueSimTimeMs);
        }
      }
    }
  }

  // Pop the completed step from remainingPath
  if (Array.isArray(unit.marchPlan.remainingPath) && unit.marchPlan.remainingPath.length > 0) {
    unit.marchPlan.remainingPath.shift();
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.UNIT_MARCH_STEP, {
      unitId: unit.id,
      unitName: unit.shortName,
      x: unit.x,
      y: unit.y,
      remainingSteps: unit.marchPlan.remainingPath ? unit.marchPlan.remainingPath.length : 0
    }, job.dueSimTimeMs);
  }

  // Schedule next step or complete march
  if (unit.marchPlan.remainingPath && unit.marchPlan.remainingPath.length > 0) {
    scheduleNextMarchStep(unit, state, scheduler);
  } else {
    const completedIntent = unit.marchPlan.intent || 'move';
    unit.status = 'idle';
    unit.marchPlan = null;

    if (unit.unitType === 'army') {
      handleArmyArrival(unit, state, scheduler, job.dueSimTimeMs, eventStream);
    } else {
      // If arriving at a friendly City carrying cargo, bank spoils into City Stockpile and restore HP
      const cityKeys = Object.keys(state.world.cities || {});
      for (let cIdx = 0; cIdx < cityKeys.length; cIdx++) {
        const city = state.world.cities[cityKeys[cIdx]];
        if (city && city.x === unit.x && city.y === unit.y) {
          unit.hp = unit.maxHp;
          if (unit.cargo) {
            depositUnitCargoAtCity(unit, city, state, job.dueSimTimeMs, eventStream);
          }
          break;
        }
      }
    }

    state._dirty = true;
    saveWargameState(state, scheduler);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_COMPLETED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y,
        intent: completedIntent
      }, job.dueSimTimeMs);
    }
  }

  state._dirty = true;
  evaluateTaskDAG(state, eventStream);
}

export function activateNextCityBuildQueueItem(city, state, scheduler) {
  if (!city || !Array.isArray(city.buildQueue) || city.buildQueue.length === 0) return null;

  // Check if the front item is already active
  const front = city.buildQueue[0];
  if (front.status === 'building' || front.status === 'demolishing' || front.status === 'moving') return front;

  const simTimeMs = state.world.clock.simTimeMs;
  const dur = Math.max(500, front.durationMs || 4000);
  const isMove = front.type === 'move';
  const isDemolishOrCleanup = front.type === 'demolish' || front.type === 'cleanup';

  let jobType = 'CITY_BUILDING_COMPLETE';
  let jobPrefix = 'build_';
  if (isMove) {
    jobType = 'CITY_BUILDING_MOVE_COMPLETE';
    jobPrefix = 'move_';
  } else if (isDemolishOrCleanup) {
    jobType = 'CITY_BUILDING_DEMOLISH_COMPLETE';
    jobPrefix = 'demolish_';
  }

  const job = scheduler.scheduleJob({
    jobId: jobPrefix + city.id + '_plot_' + (isMove ? (front.fromPlotIndex + '_' + front.toPlotIndex) : front.plotIndex) + '_' + simTimeMs,
    jobType: jobType,
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: isMove ? {
      cityId: city.id,
      queueItemId: front.queueItemId,
      fromPlotIndex: front.fromPlotIndex,
      toPlotIndex: front.toPlotIndex,
      buildingId: front.buildingId,
      level: front.level
    } : {
      cityId: city.id,
      queueItemId: front.queueItemId,
      plotIndex: front.plotIndex,
      buildingId: front.buildingId,
      targetLevel: front.targetLevel,
      actionType: front.type || 'build',
      previousLevel: front.previousLevel || 0,
      salvage: front.salvage || null
    }
  });

  front.status = isMove ? 'moving' : (isDemolishOrCleanup ? 'demolishing' : 'building');
  front.jobId = job.jobId;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

  if (isMove) {
    const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === front.fromPlotIndex; });
    const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === front.toPlotIndex; });
    if (fromPlot) { fromPlot.relocating = true; fromPlot.activeJobId = job.jobId; }
    if (toPlot)   { toPlot.relocating = true; toPlot.activeJobId = job.jobId; }
  } else {
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === front.plotIndex; });
    if (plot) {
      if (isDemolishOrCleanup) {
        plot.demolishing = true;
        plot.underConstruction = false;
      } else {
        plot.underConstruction = true;
        plot.demolishing = false;
      }
      plot.activeJobId = job.jobId;
    }
  }

  return front;
}

export function resolveBuildingCompleteJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const bId = p.buildingId;
  const targetLvl = p.targetLevel || 1;

  if (!city.buildings) city.buildings = {};
  city.buildings[bId] = Math.max(city.buildings[bId] || 0, targetLvl);

  if (bId === 'town_hall' || bId === 'meeting_hall') {
    city.buildings.town_hall = Math.max(city.buildings.town_hall || 0, targetLvl);
    city.buildings.meeting_hall = Math.max(city.buildings.meeting_hall || 0, targetLvl);
    city.level = Math.max(city.level || 1, targetLvl);
  } else if (bId === 'garden' || bId === 'farmstead') {
    city.buildings.garden = Math.max(city.buildings.garden || 0, targetLvl);
    city.buildings.farmstead = Math.max(city.buildings.farmstead || 0, targetLvl);
  } else if (bId === 'lumber_camp' || bId === 'lumber_hut' || bId === 'sawmill') {
    city.buildings.lumber_camp = Math.max(city.buildings.lumber_camp || 0, targetLvl);
    city.buildings.lumber_hut = Math.max(city.buildings.lumber_hut || 0, targetLvl);
    city.buildings.sawmill = Math.max(city.buildings.sawmill || 0, targetLvl);
  }

  const plot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.plotIndex; });
  if (plot) {
    plot.buildingId = bId;
    plot.level = targetLvl;
    plot.underConstruction = false;
    plot.demolishing = false;
    plot.activeJobId = null;
  }

  // Remove completed item from front of buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  state.world.stats.buildingsCompleted = (state.world.stats.buildingsCompleted || 0) + 1;

  // If Adventurers Guild Hall is completed, unlock GUILD_UNLOCKED phase and reveal The Starfall Vaults!
  if (bId === 'guild_hall' && targetLvl >= 1) {
    if (state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED) {
      state.campaignPhase = CAMPAIGN_PHASES.GUILD_UNLOCKED;
    }
    const ow = state.world.overworld;
    if (ow && Array.isArray(ow.pois)) {
      const starfallPoi = ow.pois.find(function(poi) { return poi.id === 'poi_dungeon_starfall' || poi.type === 'dungeon_entrance'; });
      if (starfallPoi) {
        revealOverworldVision(ow, starfallPoi.x, starfallPoi.y, 2);
        checkAndDiscoverDungeonsInVision(ow, job.dueSimTimeMs, eventStream);
      }
    }
  }

  const bDef = CITY_BUILDINGS_CATALOG[bId];
  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.BUILDING_COMPLETED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      level: targetLvl,
      plotIndex: p.plotIndex
    }, job.dueSimTimeMs);
  }

  // Start next queued building in this city if any
  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function resolveBuildingDemolishJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const plot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.plotIndex; });
  const bId = p.buildingId;
  const isDeliberate = p.actionType === 'demolish';

  if (isDeliberate) {
    // Deliberate demolition: credit salvage materials
    const salvage = p.salvage || { wood: 0, stone: 0, gold: 0, water: 0, ore: 0 };
    city.stockpile.wood  = (city.stockpile.wood  || 0) + (salvage.wood  || 0);
    city.stockpile.stone = (city.stockpile.stone || 0) + (salvage.stone || 0);
    city.stockpile.gold  = (city.stockpile.gold  || 0) + (salvage.gold  || 0);
    if (salvage.water) city.stockpile.water = (city.stockpile.water || 0) + salvage.water;
    if (salvage.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + salvage.ore;

    if (plot) {
      plot.buildingId = null;
      plot.level = 0;
    }

    // Recompute highest level for buildingId across remaining plots
    let highestLvl = 0;
    for (let pIdx = 0; pIdx < (city.plots || []).length; pIdx++) {
      const pl = city.plots[pIdx];
      if (pl.buildingId === bId) {
        highestLvl = Math.max(highestLvl, pl.level || 0);
      }
    }
    if (highestLvl > 0) {
      if (city.buildings) city.buildings[bId] = highestLvl;
    } else if (city.buildings) {
      delete city.buildings[bId];
      if (bId === 'sawmill') delete city.buildings.lumber_hut;
      if (bId === 'lumber_hut') delete city.buildings.sawmill;
      if (bId === 'farmstead') delete city.buildings.garden;
      if (bId === 'garden') delete city.buildings.farmstead;
    }
  } else {
    // Site cleanup after cancelled construction
    if (plot) {
      const prevLvl = typeof p.previousLevel === 'number' ? p.previousLevel : 0;
      if (prevLvl <= 0) {
        plot.buildingId = null;
        plot.level = 0;
      } else {
        plot.level = prevLvl;
      }
    }
  }

  if (plot) {
    plot.underConstruction = false;
    plot.demolishing = false;
    plot.activeJobId = null;
  }

  // Remove from buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  if (eventStream) {
    eventStream.publish(isDeliberate ? STREAM_TOPICS.BUILDING_DEMOLISHED : STREAM_TOPICS.BUILDING_CANCELLED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      plotIndex: p.plotIndex,
      salvage: isDeliberate ? (p.salvage || null) : null
    }, job.dueSimTimeMs);
  }

  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function resolveBuildingMoveJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const fromPlot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.fromPlotIndex; });
  const toPlot   = (city.plots || []).find(function(pl) { return pl.plotIndex === p.toPlotIndex; });

  const bId = p.buildingId;
  const lvl = p.level || 1;

  if (fromPlot) {
    fromPlot.buildingId = null;
    fromPlot.level = 0;
    fromPlot.relocating = false;
    fromPlot.underConstruction = false;
    fromPlot.demolishing = false;
    fromPlot.activeJobId = null;
  }

  if (toPlot) {
    toPlot.buildingId = bId;
    toPlot.level = lvl;
    toPlot.relocating = false;
    toPlot.underConstruction = false;
    toPlot.demolishing = false;
    toPlot.activeJobId = null;
  }

  // Remove completed move from front of buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  // Update selectedPlotIndex if user was inspecting the moved structure
  if (city.selectedPlotIndex === p.fromPlotIndex) {
    city.selectedPlotIndex = p.toPlotIndex;
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.BUILDING_MOVED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      fromPlotIndex: p.fromPlotIndex,
      toPlotIndex: p.toPlotIndex,
      level: lvl
    }, job.dueSimTimeMs);
  }

  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function activateNextCityRecruitQueueItem(city, state, scheduler) {
  if (!city || !Array.isArray(city.recruitmentQueue) || city.recruitmentQueue.length === 0) return null;

  // Check if an item is already active
  const front = city.recruitmentQueue[0];
  if (front.status === 'training') return front;

  const simTimeMs = state.world.clock.simTimeMs;
  const dur = Math.max(1000, front.durationMs || BASE_HERO_RECRUIT_DURATION_MS);

  const job = scheduler.scheduleJob({
    jobId: 'recruit_' + city.id + '_' + front.classId + '_' + simTimeMs,
    jobType: 'HERO_RECRUIT_COMPLETE',
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: {
      cityId: city.id,
      queueItemId: front.queueItemId,
      classId: front.classId,
      heroName: front.heroName
    }
  });

  front.status = 'training';
  front.jobId = job.jobId;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

  return front;
}

export function resolveRecruitHeroJob(job, state, scheduler, eventStream) {
  if (!state || !state.world) return;
  const p = job.payload || {};
  const world = state.world;
  const city = (world.cities && world.cities[p.cityId]) || getPrimaryCity(state);
  const ow = world.overworld;

  const classDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === p.classId; });
  if (!classDef) return;

  const heroIndex = (world.heroes || []).length + 1;
  const heroName = String(p.heroName || (classDef.name + ' #' + heroIndex)).trim();
  const starterEq = {
    weapon:    { uid: 'eq_w_' + heroIndex, slot: 'weapon',    name: 'Guild Iron Blade',     rarity: 'common', atk: 6, def: 0, value: 25 },
    armor:     { uid: 'eq_a_' + heroIndex, slot: 'armor',     name: 'Vanguard Cuirass',     rarity: 'common', atk: 0, def: 5, value: 25 },
    helm:      { uid: 'eq_h_' + heroIndex, slot: 'helm',      name: 'Scout Steel Helm',     rarity: 'common', atk: 0, def: 2, value: 15 },
    boots:     { uid: 'eq_b_' + heroIndex, slot: 'boots',     name: 'Frontier Greaves',     rarity: 'common', atk: 0, def: 2, value: 15 },
    accessory: null,
    pickaxe:   { uid: 'eq_p_' + heroIndex, slot: 'pickaxe',   name: 'Copper Miner Pickaxe', rarity: 'common', tier: 1, maxDurability: 25, durability: 25, value: 20 }
  };
  const heroObj = {
    id: 'hero_' + heroIndex + '_' + classDef.classId,
    name: heroName,
    classId: classDef.classId,
    className: classDef.name,
    title: classDef.title,
    icon: classDef.icon,
    color: classDef.color,
    level: 1,
    xp: 0,
    stats: Object.assign({}, classDef.baseStats),
    equipment: starterEq,
    cosmetics: { cloak: null, aura: null, banner_crest: null, weapon_glow: null },
    bagGear: [
      { uid: 'bag_ring_' + heroIndex, slot: 'accessory', name: 'Aethelgard Signet', rarity: 'uncommon', atk: 3, def: 2, value: 45 }
    ],
    ownerPlayerId: getCanonicalPlayerId(state),
    recruitedAtSimMs: job.dueSimTimeMs
  };

  if (!world.heroes) world.heroes = [];
  world.heroes.push(heroObj);
  if (!world.roster) {
    world.roster = { maxHeroes: 3, overallLeaderHeroId: heroObj.id };
  } else if (!world.roster.overallLeaderHeroId) {
    world.roster.overallLeaderHeroId = heroObj.id;
  }
  world.stats.heroesRecruited = (world.stats.heroesRecruited || 0) + 1;

  // Form an Overworld Vanguard Party at the City gates led by this Hero
  const partyArch = UNIT_ARCHETYPES.hero_party;
  const spawnX = city ? city.x : (ow ? ow.spawnX : 0);
  const spawnY = city ? city.y : (ow ? ow.spawnY : 0);

  const partyUnit = {
    id: 'unit_party_' + heroIndex,
    ownerPlayerId: getCanonicalPlayerId(state),
    name: heroObj.name + '\'s Vanguard',
    shortName: heroObj.name,
    unitType: 'hero_party',
    leaderHeroId: heroObj.id,
    heroClassId: heroObj.classId,
    x: spawnX,
    y: spawnY,
    hp: heroObj.stats.hp,
    maxHp: heroObj.stats.hp,
    visionRadius: heroObj.classId === 'ranger' ? 7 : partyArch.visionRadius,
    canFoundCity: false,
    canEnterDungeon: true,
    alive: true,
    status: 'idle',
    cargo: null,
    marchPlan: null
  };

  if (ow) {
    if (!ow.units) ow.units = [];
    ow.units.push(partyUnit);
    // Preserve current selection if the player is already commanding an active unit in the field
    const hasActiveSelected = Boolean(ow.selectedUnitId && ow.units.some(function(u) {
      return u.id === ow.selectedUnitId && u.alive;
    }));
    if (!hasActiveSelected) {
      ow.selectedUnitId = partyUnit.id;
    }
    revealOverworldVision(ow, partyUnit.x, partyUnit.y, partyUnit.visionRadius);
  }

  if (!world.parties) world.parties = [];
  world.parties.push({
    id: partyUnit.id,
    ownerPlayerId: getCanonicalPlayerId(state),
    leaderHeroId: heroObj.id,
    memberIds: [heroObj.id],
    cityId: city ? city.id : null
  });

  // Remove from recruitmentQueue
  if (city && Array.isArray(city.recruitmentQueue)) {
    const idx = city.recruitmentQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.recruitmentQueue.splice(idx, 1);
    }
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.HERO_RECRUITED, {
      heroId: heroObj.id,
      heroName: heroObj.name,
      classId: heroObj.classId,
      partyUnitId: partyUnit.id
    }, job.dueSimTimeMs);
    eventStream.publish(STREAM_TOPICS.PARTY_FORMED, {
      partyUnitId: partyUnit.id,
      leaderName: heroObj.name,
      x: partyUnit.x,
      y: partyUnit.y
    }, job.dueSimTimeMs);
  }

  if (city) {
    activateNextCityRecruitQueueItem(city, state, scheduler);
  }

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function activateNextCityTroopQueueItem(city, state, scheduler) {
  if (!city || !Array.isArray(city.troopTrainingQueue) || city.troopTrainingQueue.length === 0) return null;

  const front = city.troopTrainingQueue[0];
  if (front.status === 'training' || front.status === 'upgrading') return front;

  const troopDef = getTroopDefinition(front.troopDefId);
  const simTimeMs = state.world.clock.simTimeMs;
  const isUpgrade = front.jobKind === 'upgrade';
  const dur = isUpgrade
    ? Math.max(1500, front.durationMsPerUnit || computeTroopUpgradeDurationMs(city, troopDef, front.fromLevel || 1, front.toLevel || 2))
    : Math.max(1500, front.durationMsPerUnit || computeTroopTrainingDurationMs(city, troopDef, front.level || 1));

  const job = scheduler.scheduleJob({
    jobId: (isUpgrade ? 'troop_upg_' : 'troop_') + city.id + '_' + front.troopDefId + '_' + simTimeMs + '_' + Math.floor(Math.random() * 10000),
    jobType: isUpgrade ? 'TROOP_UPGRADE_UNIT_COMPLETE' : 'TROOP_TRAIN_UNIT_COMPLETE',
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: {
      cityId: city.id,
      queueItemId: front.queueItemId,
      troopDefId: front.troopDefId
    }
  });

  front.status = isUpgrade ? 'upgrading' : 'training';
  front.jobId = job.jobId;
  front.durationMsPerUnit = dur;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

  return front;
}

export function addBarracksTroopsAtLevel(world, ownerId, cityId, troopDefId, level, count, simTimeMs) {
  const qty = Math.floor(Number(count || 0));
  if (!world || !cityId || !troopDefId || qty <= 0) return null;
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  if (!Array.isArray(world.troopGroups)) world.troopGroups = [];

  let targetGroup = world.troopGroups.find(function(g) {
    return g &&
      g.ownerPlayerId === ownerId &&
      g.locationType === TROOP_LOCATION_TYPES.BARRACKS &&
      g.locationId === cityId &&
      g.troopDefId === troopDefId &&
      (g.level || 1) === lvl;
  });

  if (targetGroup) {
    targetGroup.count = (targetGroup.count || 0) + qty;
  } else {
    targetGroup = {
      id: 'tg_' + cityId + '_' + troopDefId + '_lv' + lvl + '_' + (simTimeMs || 0) + '_' + Math.floor(Math.random() * 10000),
      ownerPlayerId: ownerId,
      troopDefId: troopDefId,
      count: qty,
      level: lvl,
      xp: 0,
      condition: 100,
      locationType: TROOP_LOCATION_TYPES.BARRACKS,
      locationId: cityId,
      createdAtSimMs: simTimeMs || 0
    };
    world.troopGroups.push(targetGroup);
  }
  return targetGroup;
}

export function resolveTroopTrainUnitJob(job, state, scheduler, eventStream) {
  if (!state || !state.world) return;
  const p = job.payload || {};
  const world = state.world;
  const city = (world.cities && world.cities[p.cityId]) || getPrimaryCity(state);
  if (!city || !Array.isArray(city.troopTrainingQueue)) return;

  const idx = city.troopTrainingQueue.findIndex(function(q) {
    return q && q.jobKind !== 'upgrade' && (q.queueItemId === p.queueItemId || q.jobId === job.jobId);
  });
  if (idx === -1) return;

  const item = city.troopTrainingQueue[idx];
  // Idempotency guard: prevent duplicate completion if job is replayed
  if ((item.completedCount || 0) >= (item.quantity || 0)) return;
  if (item.jobId && job.jobId && item.jobId !== job.jobId) return;

  const troopDef = getTroopDefinition(item.troopDefId);
  if (!troopDef) {
    city.troopTrainingQueue.splice(idx, 1);
    activateNextCityTroopQueueItem(city, state, scheduler);
    return;
  }

  const targetLevel = Math.max(1, Math.floor(item.level || 1));
  const ownerId = getCanonicalPlayerId(state);
  const targetGroup = addBarracksTroopsAtLevel(world, ownerId, city.id, troopDef.id, targetLevel, 1, job.dueSimTimeMs);

  item.completedCount = (item.completedCount || 0) + 1;
  if (!world.stats) world.stats = {};
  world.stats.troopsTrained = (world.stats.troopsTrained || 0) + 1;

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.TROOP_TRAINED, {
      cityId: city.id,
      troopGroupId: targetGroup ? targetGroup.id : null,
      troopDefId: troopDef.id,
      troopName: troopDef.name,
      level: targetLevel,
      completedCount: item.completedCount,
      quantity: item.quantity,
      groupCount: targetGroup ? targetGroup.count : 1
    }, job.dueSimTimeMs);
  }

  if (item.completedCount < item.quantity) {
    const nextDur = computeTroopTrainingDurationMs(city, troopDef, targetLevel);
    const nextJob = scheduler.scheduleJob({
      jobId: 'troop_' + city.id + '_' + troopDef.id + '_' + job.dueSimTimeMs + '_' + Math.floor(Math.random() * 10000),
      jobType: 'TROOP_TRAIN_UNIT_COMPLETE',
      ownerId: city.id,
      startSimTimeMs: job.dueSimTimeMs,
      dueSimTimeMs: job.dueSimTimeMs + nextDur,
      payload: {
        cityId: city.id,
        queueItemId: item.queueItemId,
        troopDefId: troopDef.id
      }
    });
    item.status = 'training';
    item.jobId = nextJob.jobId;
    item.durationMsPerUnit = nextDur;
    item.startSimTimeMs = job.dueSimTimeMs;
    item.dueSimTimeMs = job.dueSimTimeMs + nextDur;
  } else {
    city.troopTrainingQueue.splice(idx, 1);
    activateNextCityTroopQueueItem(city, state, scheduler);
  }

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function resolveTroopUpgradeUnitJob(job, state, scheduler, eventStream) {
  if (!state || !state.world) return;
  const p = job.payload || {};
  const world = state.world;
  const city = (world.cities && world.cities[p.cityId]) || getPrimaryCity(state);
  if (!city || !Array.isArray(city.troopTrainingQueue)) return;

  const idx = city.troopTrainingQueue.findIndex(function(q) {
    return q && q.jobKind === 'upgrade' && (q.queueItemId === p.queueItemId || q.jobId === job.jobId);
  });
  if (idx === -1) return;

  const item = city.troopTrainingQueue[idx];
  // Idempotency guard: prevent duplicate troop creation if job fires more than once
  if ((item.completedCount || 0) >= (item.quantity || 0)) return;
  if (item.jobId && job.jobId && item.jobId !== job.jobId) return;

  const troopDef = getTroopDefinition(item.troopDefId);
  if (!troopDef) {
    city.troopTrainingQueue.splice(idx, 1);
    activateNextCityTroopQueueItem(city, state, scheduler);
    return;
  }

  const fromLevel = Math.max(1, Math.floor(item.fromLevel || 1));
  const toLevel = Math.max(fromLevel + 1, Math.floor(item.toLevel || (fromLevel + 1)));
  const ownerId = getCanonicalPlayerId(state);
  const targetGroup = addBarracksTroopsAtLevel(world, ownerId, city.id, troopDef.id, toLevel, 1, job.dueSimTimeMs);

  item.completedCount = (item.completedCount || 0) + 1;

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.TROOP_UPGRADE_COMPLETED, {
      cityId: city.id,
      troopGroupId: targetGroup ? targetGroup.id : null,
      troopDefId: troopDef.id,
      troopName: troopDef.name,
      fromLevel: fromLevel,
      toLevel: toLevel,
      completedCount: item.completedCount,
      quantity: item.quantity,
      groupCount: targetGroup ? targetGroup.count : 1
    }, job.dueSimTimeMs);
  }

  if (item.completedCount < item.quantity) {
    const nextDur = computeTroopUpgradeDurationMs(city, troopDef, fromLevel, toLevel);
    const nextJob = scheduler.scheduleJob({
      jobId: 'troop_upg_' + city.id + '_' + troopDef.id + '_' + job.dueSimTimeMs + '_' + Math.floor(Math.random() * 10000),
      jobType: 'TROOP_UPGRADE_UNIT_COMPLETE',
      ownerId: city.id,
      startSimTimeMs: job.dueSimTimeMs,
      dueSimTimeMs: job.dueSimTimeMs + nextDur,
      payload: {
        cityId: city.id,
        queueItemId: item.queueItemId,
        troopDefId: troopDef.id
      }
    });
    item.status = 'upgrading';
    item.jobId = nextJob.jobId;
    item.durationMsPerUnit = nextDur;
    item.startSimTimeMs = job.dueSimTimeMs;
    item.dueSimTimeMs = job.dueSimTimeMs + nextDur;
  } else {
    city.troopTrainingQueue.splice(idx, 1);
    activateNextCityTroopQueueItem(city, state, scheduler);
  }

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

// ---------------------------------------------------------------------------
// Field Army Objective, Return & Idempotent Barracks Reintegration (Task 05B-1)
// ---------------------------------------------------------------------------
export function reintegrateArmyIntoBarracks(army, state, simTimeMs, eventStream) {
  if (!army || !state || !state.world) return { ok: false, skipped: true };
  // Strict idempotency guard: already reintegrated or retired armies are a safe no-op
  if (army.reintegrated || !army.alive) {
    return { ok: false, skipped: true, reason: 'already_reintegrated' };
  }

  const world = state.world;
  const homeCity = (world.cities && army.homeCityId) ? world.cities[army.homeCityId] : null;
  if (!homeCity) {
    // Safe recovery policy: if home city is missing/invalid, halt army safely & preserve troops (never delete or reassign arbitrarily)
    army.status = 'idle';
    army.marchPlan = null;
    if (army.objective) {
      army.objective.status = ARMY_OBJECTIVE_STATUS.FAILED;
      army.objective.jobId = null;
      army.objective.failureReason = 'home_city_unavailable';
    }
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.ARMY_OBJECTIVE_FAILED, {
        armyId: army.id,
        armyName: army.shortName || army.name,
        objectiveType: army.objective ? army.objective.type : ARMY_OBJECTIVE_TYPES.RETURN_HOME,
        reason: 'Home city unavailable; army halted to preserve troops'
      }, simTimeMs);
    }
    return { ok: false, reason: 'home_city_unavailable' };
  }

  const armyGroups = getArmyTroopGroups(world, army.id);
  let totalReturned = 0;
  for (let i = 0; i < armyGroups.length; i++) {
    const g = armyGroups[i];
    const ownerId = g.ownerPlayerId || army.ownerPlayerId || getCanonicalPlayerId(state);
    addBarracksTroopsAtLevel(world, ownerId, homeCity.id, g.troopDefId, g.level || 1, g.count || 0, simTimeMs);
    totalReturned += (g.count || 0);
  }
  // Remove army-located group records now that troops have been transferred to Barracks
  if (Array.isArray(world.troopGroups)) {
    world.troopGroups = world.troopGroups.filter(function(g) {
      return !(g && g.locationType === TROOP_LOCATION_TYPES.ARMY && g.locationId === army.id);
    });
  }

  if (army.cargo) {
    depositUnitCargoAtCity(army, homeCity, state, simTimeMs, eventStream);
  }

  army.reintegrated = true;
  army.alive = false;
  army.status = 'retired';
  army.marchPlan = null;
  if (army.objective) {
    army.objective.status = ARMY_OBJECTIVE_STATUS.COMPLETED;
    army.objective.jobId = null;
  }

  const ow = world.overworld;
  if (ow && ow.selectedUnitId === army.id) {
    const nextAlive = (ow.units || []).find(function(u) { return u && u.alive && u.id !== army.id; });
    ow.selectedUnitId = nextAlive ? nextAlive.id : null;
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.ARMY_REINTEGRATED, {
      armyId: army.id,
      armyName: army.shortName || army.name,
      homeCityId: homeCity.id,
      homeCityName: homeCity.name,
      troopsReturned: totalReturned
    }, simTimeMs);
  }

  return { ok: true, homeCityId: homeCity.id, troopsReturned: totalReturned };
}

export function startArmyReturnHome(army, state, scheduler, simTimeMs, eventStream) {
  if (!army || !army.alive || army.reintegrated || !state || !state.world) {
    return { ok: false, reason: 'invalid_army' };
  }
  const world = state.world;
  const ow = world.overworld;
  const homeCity = (world.cities && army.homeCityId) ? world.cities[army.homeCityId] : null;
  if (!homeCity) {
    army.status = 'idle';
    army.marchPlan = null;
    if (army.objective) {
      army.objective.status = ARMY_OBJECTIVE_STATUS.FAILED;
      army.objective.jobId = null;
      army.objective.failureReason = 'home_city_unavailable';
    }
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.ARMY_OBJECTIVE_FAILED, {
        armyId: army.id,
        armyName: army.shortName || army.name,
        objectiveType: ARMY_OBJECTIVE_TYPES.RETURN_HOME,
        reason: 'Home city unavailable; army halted to preserve troops'
      }, simTimeMs);
    }
    return { ok: false, reason: 'home_city_unavailable' };
  }

  // Cancel any active march or objective job before starting return
  if (army.marchPlan && army.marchPlan.activeJobId && scheduler) {
    scheduler.cancelJob(army.marchPlan.activeJobId);
  }
  if (army.objective && army.objective.jobId && scheduler) {
    scheduler.cancelJob(army.objective.jobId);
  }

  army.objective = {
    id: 'obj_ret_' + army.id + '_' + simTimeMs,
    type: ARMY_OBJECTIVE_TYPES.RETURN_HOME,
    status: ARMY_OBJECTIVE_STATUS.ACCEPTED,
    targetX: homeCity.x,
    targetY: homeCity.y,
    jobId: null,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: null
  };

  if (army.x === homeCity.x && army.y === homeCity.y) {
    army.objective.status = ARMY_OBJECTIVE_STATUS.ARRIVED;
    return reintegrateArmyIntoBarracks(army, state, simTimeMs, eventStream);
  }

  const path = findOverworldPath(ow, army.x, army.y, homeCity.x, homeCity.y);
  if (!path || path.length === 0) {
    army.status = 'idle';
    army.marchPlan = null;
    army.objective.status = ARMY_OBJECTIVE_STATUS.FAILED;
    army.objective.failureReason = 'return_path_unreachable';
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.ARMY_OBJECTIVE_FAILED, {
        armyId: army.id,
        armyName: army.shortName || army.name,
        objectiveType: ARMY_OBJECTIVE_TYPES.RETURN_HOME,
        reason: 'Return path to home city is unreachable'
      }, simTimeMs);
    }
    return { ok: false, reason: 'return_path_unreachable' };
  }

  const totalMs = path.reduce(function(sum, st) { return sum + (st.stepDurationMs || 3000); }, 0);
  army.objective.status = ARMY_OBJECTIVE_STATUS.TRAVELING;
  army.marchPlan = {
    intent: 'return_home',
    targetCityId: homeCity.id,
    targetX: homeCity.x,
    targetY: homeCity.y,
    remainingPath: path,
    totalDurationMs: totalMs,
    activeJobId: null,
    stepStartSimTimeMs: simTimeMs,
    stepDueSimTimeMs: simTimeMs,
    fromX: army.x,
    fromY: army.y,
    toX: path[0].x,
    toY: path[0].y
  };

  scheduleNextMarchStep(army, state, scheduler);

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.ARMY_RETURNING, {
      armyId: army.id,
      armyName: army.shortName || army.name,
      homeCityId: homeCity.id,
      homeCityName: homeCity.name,
      stepsCount: path.length
    }, simTimeMs);
  }

  return { ok: true, stepsCount: path.length };
}

export function handleArmyArrival(army, state, scheduler, simTimeMs, eventStream) {
  if (!army || !army.alive || army.reintegrated) return;
  if (!army.objective) {
    army.status = 'idle';
    return;
  }

  army.objective.status = ARMY_OBJECTIVE_STATUS.ARRIVED;

  if (army.objective.type === ARMY_OBJECTIVE_TYPES.RETURN_HOME) {
    reintegrateArmyIntoBarracks(army, state, simTimeMs, eventStream);
    return;
  }

  if (army.objective.type === ARMY_OBJECTIVE_TYPES.PATROL_HEX) {
    const patrolDur = Math.max(250, ARMY_PATROL_DURATION_MS || 3000);
    const job = scheduler ? scheduler.scheduleJob({
      jobId: 'army_obj_' + army.id + '_' + simTimeMs + '_' + Math.floor(Math.random() * 10000),
      jobType: 'ARMY_OBJECTIVE_COMPLETE',
      ownerId: army.id,
      startSimTimeMs: simTimeMs,
      dueSimTimeMs: simTimeMs + patrolDur,
      payload: {
        armyId: army.id,
        objectiveId: army.objective.id,
        objectiveType: army.objective.type
      }
    }) : null;

    army.status = 'objective_in_progress';
    army.objective.status = ARMY_OBJECTIVE_STATUS.IN_PROGRESS;
    army.objective.jobId = job ? job.jobId : null;
    army.objective.startSimTimeMs = simTimeMs;
    army.objective.dueSimTimeMs = simTimeMs + patrolDur;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.ARMY_OBJECTIVE_STARTED, {
        armyId: army.id,
        armyName: army.shortName || army.name,
        objectiveType: army.objective.type,
        x: army.x,
        y: army.y,
        durationMs: patrolDur
      }, simTimeMs);
    }
    return;
  }

  // Fallback for unrecognized objective types: fail cleanly without auto-returning
  army.status = 'idle';
  army.objective.status = ARMY_OBJECTIVE_STATUS.FAILED;
  army.objective.jobId = null;
}

export function resolveArmyObjectiveCompleteJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.overworld) return;
  const p = job.payload || {};
  const ow = state.world.overworld;
  const army = (ow.units || []).find(function(u) {
    return u && u.alive && u.unitType === 'army' && u.id === p.armyId;
  });
  if (!army || army.reintegrated || !army.objective) return;
  // Strict idempotency guard: only complete matching in-progress objective job
  if (army.status !== 'objective_in_progress' || army.objective.status !== ARMY_OBJECTIVE_STATUS.IN_PROGRESS) return;
  if (army.objective.jobId && job.jobId && army.objective.jobId !== job.jobId) return;

  army.objective.status = ARMY_OBJECTIVE_STATUS.COMPLETED;
  army.objective.jobId = null;
  army.status = 'idle';

  revealOverworldVision(ow, army.x, army.y, army.visionRadius || 4);

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.ARMY_OBJECTIVE_COMPLETED, {
      armyId: army.id,
      armyName: army.shortName || army.name,
      objectiveType: army.objective.type,
      x: army.x,
      y: army.y,
      stayDeployed: Boolean(army.stayDeployed)
    }, job.dueSimTimeMs);
  }

  // Return policy evaluated ONLY on successful objective completion
  if (!army.stayDeployed) {
    startArmyReturnHome(army, state, scheduler, job.dueSimTimeMs, eventStream);
  }

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

export function processResourceProductionTick(state, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const cityIds = Object.keys(state.world.cities);
  if (cityIds.length === 0) return;
  let popChanged = false;

  for (let i = 0; i < cityIds.length; i++) {
    const city = state.world.cities[cityIds[i]];
    if (!city || !city.stockpile) continue;

    // 1. Recompute population capacity from Meeting Hall and active Huts
    if (!city.population) {
      city.population = { current: 5, max: 10, growthProgress: 0, starving: false, starveTicks: 0 };
    }
    let maxPop = 10;
    if (Array.isArray(city.plots)) {
      for (let p = 0; p < city.plots.length; p++) {
        const pl = city.plots[p];
        if (pl.buildingId === 'hut' && (pl.level || 0) > 0 && !pl.demolishing) {
          maxPop += (pl.level || 1) * 5;
        }
      }
    }
    city.population.max = maxPop;
    if (typeof city.population.current !== 'number') {
      city.population.current = 5;
    }

    // 2. Subsistence token production: Every city produces +1 food, wood, stone, gold, water baseline per tick
    const gains = { wood: 1, stone: 1, food: 1, gold: 1, water: 1, ore: 0 };

    if (Array.isArray(city.plots) && city.plots.length > 0) {
      // Spatial plot-based production with adjacency bonuses
      for (let p = 0; p < city.plots.length; p++) {
        const plot = city.plots[p];
        const bId = plot.buildingId;
        const lvl = plot.level || 0;
        if (!bId || lvl <= 0 || plot.underConstruction || plot.demolishing || plot.relocating) continue;

        // Skip meeting_hall / town_hall here because token baseline is already accounted for
        if (bId === 'meeting_hall' || bId === 'town_hall') continue;

        const bDef = CITY_BUILDINGS_CATALOG[bId];
        if (!bDef || !bDef.productionPerTick) continue;

        // Check for adjacent active Windmills on the 8x8 grid
        let windmillCount = 0;
        const px = plot.x !== undefined ? plot.x : (plot.plotIndex % 8);
        const py = plot.y !== undefined ? plot.y : Math.floor(plot.plotIndex / 8);
        const neighbors = [
          { x: px + 1, y: py },
          { x: px - 1, y: py },
          { x: px, y: py + 1 },
          { x: px, y: py - 1 }
        ];
        for (let n = 0; n < neighbors.length; n++) {
          const nb = neighbors[n];
          if (nb.x >= 0 && nb.x < 8 && nb.y >= 0 && nb.y < 8) {
            const nPlot = city.plots[nb.y * 8 + nb.x];
            if (nPlot && nPlot.buildingId === 'windmill' && (nPlot.level || 0) > 0 && !nPlot.underConstruction && !nPlot.demolishing) {
              windmillCount++;
            }
          }
        }

        const mult = 1.0 + (windmillCount * (WINDMILL_ADJACENCY_BONUS || 0.20));
        const prod = bDef.productionPerTick;
        if (prod.wood)  gains.wood  += Math.round(prod.wood  * lvl * mult);
        if (prod.stone) gains.stone += Math.round(prod.stone * lvl * mult);
        if (prod.food)  gains.food  += Math.round(prod.food  * lvl * mult);
        if (prod.gold)  gains.gold  += Math.round(prod.gold  * lvl * mult);
        if (prod.water) gains.water += Math.round(prod.water * lvl * mult);
        if (prod.ore)   gains.ore   += Math.round(prod.ore   * lvl * mult);
      }
    } else if (city.buildings) {
      // Fallback for legacy state
      const bKeys = Object.keys(city.buildings);
      for (let k = 0; k < bKeys.length; k++) {
        const bId = bKeys[k];
        if (bId === 'town_hall' || bId === 'meeting_hall') continue;
        const lvl = city.buildings[bId] || 0;
        if (lvl <= 0) continue;
        const bDef = CITY_BUILDINGS_CATALOG[bId];
        if (bDef && bDef.productionPerTick) {
          if (bDef.productionPerTick.wood)  gains.wood  += bDef.productionPerTick.wood * lvl;
          if (bDef.productionPerTick.stone) gains.stone += bDef.productionPerTick.stone * lvl;
          if (bDef.productionPerTick.food)  gains.food  += bDef.productionPerTick.food * lvl;
          if (bDef.productionPerTick.gold)  gains.gold  += bDef.productionPerTick.gold * lvl;
          if (bDef.productionPerTick.water) gains.water += bDef.productionPerTick.water * lvl;
          if (bDef.productionPerTick.ore)   gains.ore   += bDef.productionPerTick.ore * lvl;
        }
      }
    }

    // Add passive production gains up to storage caps (never deleting overflow expedition spoils or task rewards!)
    const caps = computeCityStorageCaps(city);
    function addProductionCapped(cur, gain, cap) {
      const base = cur || 0;
      if (gain <= 0) return base;
      if (base >= cap) return base;
      return Math.min(cap, base + gain);
    }
    city.stockpile.wood  = addProductionCapped(city.stockpile.wood,  gains.wood,  caps.wood  || 200);
    city.stockpile.stone = addProductionCapped(city.stockpile.stone, gains.stone, caps.stone || 200);
    city.stockpile.food  = addProductionCapped(city.stockpile.food,  gains.food,  caps.food  || 200);
    city.stockpile.gold  = addProductionCapped(city.stockpile.gold,  gains.gold,  caps.gold  || 300);
    city.stockpile.water = addProductionCapped(city.stockpile.water, gains.water, caps.water || 200);
    city.stockpile.ore   = addProductionCapped(city.stockpile.ore,   gains.ore,   caps.ore   || 100);

    // 3. Population Sustenance Consumption & Starvation Dynamics
    // Demand scales with population: 1 food and 1 water per 5 citizens
    const foodDemand = Math.max(1, Math.ceil(city.population.current / 5));
    const waterDemand = Math.max(1, Math.ceil(city.population.current / 5));

    if ((city.stockpile.food || 0) >= foodDemand && (city.stockpile.water || 0) >= waterDemand) {
      city.stockpile.food  -= foodDemand;
      city.stockpile.water -= waterDemand;
      city.population.starving = false;
      city.population.starveTicks = 0;

      // Natural Population Growth: advances when food & water are satisfied
      if (city.population.current < city.population.max) {
        city.population.growthProgress = (city.population.growthProgress || 0) + 25;
        if (city.population.growthProgress >= 100) {
          city.population.current += 1;
          city.population.growthProgress = 0;
          popChanged = true;
        }
      }
    } else {
      // Starvation: insufficient food or water!
      city.stockpile.food  = Math.max(0, (city.stockpile.food || 0) - foodDemand);
      city.stockpile.water = Math.max(0, (city.stockpile.water || 0) - waterDemand);
      city.population.starving = true;
      city.population.growthProgress = 0;
      city.population.starveTicks = (city.population.starveTicks || 0) + 1;

      // After 2 consecutive starved ticks, a citizen is lost to famine
      if (city.population.starveTicks >= 2 && city.population.current > 3) {
        city.population.current -= 1;
        city.population.starveTicks = 0;
        popChanged = true;
      }
    }

    if (eventStream && (gains.wood > 0 || gains.stone > 0 || gains.food > 0 || gains.gold > 0 || gains.water > 0 || gains.ore > 0)) {
      eventStream.publish(STREAM_TOPICS.RESOURCE_TICK, {
        cityId: city.id,
        cityName: city.name,
        gains: gains,
        stockpile: {
          wood: city.stockpile.wood,
          stone: city.stockpile.stone,
          food: city.stockpile.food,
          gold: city.stockpile.gold,
          water: city.stockpile.water,
          ore: city.stockpile.ore
        }
      }, state.world.clock.simTimeMs);
    }
  }

  // Immediately re-evaluate Task DAG when population changes (e.g., Frontier Growth to 12)
  if (popChanged) {
    state._dirty = true;
    evaluateTaskDAG(state, eventStream);
  }
}

// Compute live 0..1 interpolation coordinates for smooth real-time unit rendering on the Overworld canvas
export function getUnitInterpolatedPosition(unit, currentSimTimeMs) {
  if (!unit) return { x: 0, y: 0, progress: 0 };
  if ((unit.status !== 'marching' && unit.status !== 'returning') || !unit.marchPlan) {
    return { x: unit.x, y: unit.y, progress: 0 };
  }
  const mp = unit.marchPlan;
  const start = mp.stepStartSimTimeMs || 0;
  const due   = mp.stepDueSimTimeMs   || (start + 1000);
  const dur   = Math.max(1, due - start);
  const elapsed = Math.max(0, Math.min(dur, currentSimTimeMs - start));
  const t = elapsed / dur;

  const ix = mp.fromX + (mp.toX - mp.fromX) * t;
  const iy = mp.fromY + (mp.toY - mp.fromY) * t;
  return { x: ix, y: iy, progress: t };
}
