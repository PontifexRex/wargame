// TimedQueueManager — Real-Time Unit Marching, City Construction Queues & Resource Production Tickers

import {
  CAMPAIGN_PHASES,
  STREAM_TOPICS,
  RESOURCE_PRODUCTION_INTERVAL_MS,
  BASE_HERO_RECRUIT_DURATION_MS,
  WINDMILL_ADJACENCY_BONUS
} from '../constants.js';
import { CITY_BUILDINGS_CATALOG } from '../data/buildings.js';
import { UNIT_ARCHETYPES, RECRUITABLE_HERO_CLASSES } from '../data/terrain.js';
import { revealOverworldVision } from './pathfinding.js';
import { evaluateTaskDAG } from './taskEngine.js';
import { saveWargameState, getPrimaryCity, computeCityStorageCaps } from './state.js';

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

  unit.status = 'marching';
  unit.marchPlan.activeJobId = job.jobId;
  unit.marchPlan.stepStartSimTimeMs = simTimeMs;
  unit.marchPlan.stepDueSimTimeMs = simTimeMs + stepDur;
  unit.marchPlan.fromX = unit.x;
  unit.marchPlan.fromY = unit.y;
  unit.marchPlan.toX = nextStep.x;
  unit.marchPlan.toY = nextStep.y;

  return job;
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

  // Check if unit stepped onto a supply cache POI
  if (Array.isArray(ow.pois)) {
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
    unit.status = 'idle';
    unit.marchPlan = null;
    state._dirty = true;
    saveWargameState(state, scheduler);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_COMPLETED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y
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

  // If Adventurers Guild Hall is completed, unlock GUILD_UNLOCKED phase!
  if (bId === 'guild_hall' && targetLvl >= 1 && state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED) {
    state.campaignPhase = CAMPAIGN_PHASES.GUILD_UNLOCKED;
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
    recruitedAtSimMs: job.dueSimTimeMs
  };

  if (!world.heroes) world.heroes = [];
  world.heroes.push(heroObj);
  world.stats.heroesRecruited = (world.stats.heroesRecruited || 0) + 1;

  // Form an Overworld Vanguard Party at the City gates led by this Hero
  const partyArch = UNIT_ARCHETYPES.hero_party;
  const spawnX = city ? city.x : (ow ? ow.spawnX : 0);
  const spawnY = city ? city.y : (ow ? ow.spawnY : 0);

  const partyUnit = {
    id: 'unit_party_' + heroIndex,
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
    marchPlan: null
  };

  if (ow) {
    if (!ow.units) ow.units = [];
    ow.units.push(partyUnit);
    ow.selectedUnitId = partyUnit.id;
    revealOverworldVision(ow, partyUnit.x, partyUnit.y, partyUnit.visionRadius);
  }

  if (!world.parties) world.parties = [];
  world.parties.push({
    id: partyUnit.id,
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

export function processResourceProductionTick(state, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const cityIds = Object.keys(state.world.cities);
  if (cityIds.length === 0) return;

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

    // Add production gains before consumption
    city.stockpile.wood  = (city.stockpile.wood  || 0) + gains.wood;
    city.stockpile.stone = (city.stockpile.stone || 0) + gains.stone;
    city.stockpile.food  = (city.stockpile.food  || 0) + gains.food;
    city.stockpile.gold  = (city.stockpile.gold  || 0) + gains.gold;
    city.stockpile.water = (city.stockpile.water || 0) + gains.water;
    city.stockpile.ore   = (city.stockpile.ore   || 0) + gains.ore;

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
      }
    }

    const caps = computeCityStorageCaps(city);
    city.stockpile.wood  = Math.min(caps.wood  || 200, city.stockpile.wood);
    city.stockpile.stone = Math.min(caps.stone || 200, city.stockpile.stone);
    city.stockpile.food  = Math.min(caps.food  || 200, city.stockpile.food);
    city.stockpile.gold  = Math.min(caps.gold  || 300, city.stockpile.gold);
    city.stockpile.water = Math.min(caps.water || 200, city.stockpile.water);
    city.stockpile.ore   = Math.min(caps.ore   || 100, city.stockpile.ore);

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
}

// Compute live 0..1 interpolation coordinates for smooth real-time unit rendering on the Overworld canvas
export function getUnitInterpolatedPosition(unit, currentSimTimeMs) {
  if (!unit) return { x: 0, y: 0, progress: 0 };
  if (unit.status !== 'marching' || !unit.marchPlan) {
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
