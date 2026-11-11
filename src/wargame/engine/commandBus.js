// Authoritative Command Bus & Simulation Host Engine
// All player actions are dispatched as serializable Command Envelopes, validated, and applied to the World state.

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS,
  COMMAND_TYPES,
  RESOURCE_PRODUCTION_INTERVAL_MS,
  BASE_HERO_RECRUIT_DURATION_MS,
  BASE_BUILD_QUEUE_LIMIT,
  BASE_RECRUIT_QUEUE_LIMIT,
  DEMOLISH_SALVAGE_RATIO,
  CANCEL_CLEANUP_TIME_RATIO,
  BASE_MOVE_BUILDING_DURATION_MS,
  CITY_CENTER_PLOT_INDEX,
  CITY_TOTAL_PLOTS
} from '../constants.js';
import {
  OVERWORLD_TERRAIN_DEFS,
  UNIT_ARCHETYPES,
  RECRUITABLE_HERO_CLASSES
} from '../data/terrain.js';
import {
  CITY_BUILDINGS_CATALOG,
  computeBuildingUpgradeCost,
  computeBuildingDurationMs
} from '../data/buildings.js';
import { CAMPAIGN_TASKS_DAG } from '../data/tasks.js';
import {
  findOverworldPath,
  isOverworldTilePassable,
  revealOverworldVision
} from './pathfinding.js';
import {
  scheduleNextMarchStep,
  resolveMarchStepJob,
  activateNextCityBuildQueueItem,
  resolveBuildingCompleteJob,
  resolveBuildingDemolishJob,
  resolveBuildingMoveJob,
  activateNextCityRecruitQueueItem,
  resolveRecruitHeroJob,
  processResourceProductionTick
} from './queues.js';
import { evaluateTaskDAG } from './taskEngine.js';
import {
  createNewCampaignWorldState,
  createDefaultCityPlots,
  getPrimaryCity,
  getSelectedOverworldUnit
} from './state.js';

export function dispatchWargameCommand(commandEnvelope, state, scheduler, eventStream) {
  if (!commandEnvelope || !commandEnvelope.type) {
    return { ok: false, reason: 'Malformed command envelope' };
  }

  const cmdType = commandEnvelope.type;
  const payload = commandEnvelope.payload || {};
  const simTimeMs = (state && state.world && state.world.clock) ? state.world.clock.simTimeMs : 0;

  function reject(reason) {
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.COMMAND_REJECTED, {
        commandType: cmdType,
        reason: reason
      }, simTimeMs);
    }
    return { ok: false, reason: reason };
  }

  function accept(resultPayload) {
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.COMMAND_ACCEPTED, {
        commandType: cmdType,
        result: resultPayload
      }, simTimeMs);
    }
    return { ok: true, data: resultPayload };
  }

  // ---------------------------------------------------------------------------
  // 1. START NEW CAMPAIGN (Transitions from TITLE -> SETTLER_PIONEER)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.START_NEW_CAMPAIGN) {
    const fresh = createNewCampaignWorldState(payload);
    Object.keys(state).forEach(function(k) { delete state[k]; });
    Object.assign(state, fresh);
    if (scheduler) scheduler.clear();

    evaluateTaskDAG(state, eventStream);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CAMPAIGN_STARTED, {
        houseName: state.world.player.houseName,
        worldName: state.world.name,
        seedCode: state.world.seedCode,
        settlerId: 'unit_settler_1'
      }, 0);
    }
    return accept({ campaignPhase: state.campaignPhase, worldName: state.world.name });
  }

  // Ensure an active world exists for all subsequent commands
  if (!state || !state.world) {
    return reject('No active campaign world');
  }

  const world = state.world;
  const ow = world.overworld;

  // ---------------------------------------------------------------------------
  // 2. ORDER UNIT MARCH (Real-Time A* Pathfinding & Scheduled Step Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.ORDER_UNIT_MARCH) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit) return reject('No active unit selected for march');

    const targetX = Number(payload.targetX);
    const targetY = Number(payload.targetY);
    if (isNaN(targetX) || isNaN(targetY)) return reject('Invalid destination coordinates');

    if (unit.x === targetX && unit.y === targetY) {
      return reject('Unit is already at that coordinate');
    }

    if (!isOverworldTilePassable(ow, targetX, targetY)) {
      const tId = (ow.tiles[targetY] && ow.tiles[targetY][targetX]) || 0;
      const tDef = OVERWORLD_TERRAIN_DEFS[tId];
      return reject('Impassable terrain: ' + (tDef ? tDef.name : 'Blocked'));
    }

    const path = findOverworldPath(ow, unit.x, unit.y, targetX, targetY);
    if (!path || path.length === 0) {
      return reject('No passable route to destination');
    }

    // Cancel existing march job if unit was already moving
    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }

    const totalMs = path.reduce(function(sum, st) { return sum + (st.stepDurationMs || 3000); }, 0);
    unit.marchPlan = {
      targetX: targetX,
      targetY: targetY,
      remainingPath: path,
      totalDurationMs: totalMs,
      activeJobId: null,
      stepStartSimTimeMs: simTimeMs,
      stepDueSimTimeMs: simTimeMs,
      fromX: unit.x,
      fromY: unit.y,
      toX: path[0].x,
      toY: path[0].y
    };

    scheduleNextMarchStep(unit, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_STARTED, {
        unitId: unit.id,
        unitName: unit.shortName,
        fromX: unit.x,
        fromY: unit.y,
        targetX: targetX,
        targetY: targetY,
        stepsCount: path.length,
        totalDurationMs: totalMs
      }, simTimeMs);
    }

    return accept({
      unitId: unit.id,
      stepsCount: path.length,
      totalDurationMs: totalMs,
      path: path
    });
  }

  // ---------------------------------------------------------------------------
  // 3. STEP UNIT ADJACENT (Convenience wrapper around ORDER_UNIT_MARCH)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.STEP_UNIT_ADJACENT) {
    const unit = getSelectedOverworldUnit(state);
    if (!unit) return reject('No active unit selected');
    const dx = Number(payload.dx || 0);
    const dy = Number(payload.dy || 0);
    return dispatchWargameCommand({
      type: COMMAND_TYPES.ORDER_UNIT_MARCH,
      payload: {
        unitId: unit.id,
        targetX: unit.x + dx,
        targetY: unit.y + dy
      }
    }, state, scheduler, eventStream);
  }

  // ---------------------------------------------------------------------------
  // 4. CANCEL UNIT MARCH
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_UNIT_MARCH) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || unit.status !== 'marching' || !unit.marchPlan) {
      return reject('Unit is not currently marching');
    }
    if (unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }
    unit.status = 'idle';
    unit.marchPlan = null;
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_CANCELLED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y
      }, simTimeMs);
    }
    return accept({ unitId: unit.id, x: unit.x, y: unit.y });
  }

  // ---------------------------------------------------------------------------
  // 5. FOUND CITY (Consumes Pioneer Settler & Establishes Primary Bastion)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.FOUND_CITY) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canFoundCity) {
      return reject('Selected unit cannot found a city');
    }

    const tId = ow.tiles[unit.y][unit.x];
    const tDef = OVERWORLD_TERRAIN_DEFS[tId];
    if (!tDef || !tDef.buildable) {
      return reject('Cities can only be founded on Sunlit Grasslands or Verdant River Vales');
    }

    // Cancel any active march
    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }

    // Consume the settler unit
    unit.alive = false;
    unit.status = 'settled';
    unit.marchPlan = null;

    const existingCitiesCount = Object.keys(world.cities || {}).length;
    const cityId = 'city_' + (existingCitiesCount + 1);
    const cityName = String(payload.cityName || (existingCitiesCount === 0 ? 'Oakhaven Bastion' : 'Bastion ' + (existingCitiesCount + 1))).trim();

    // Transfer pioneer realm stockpile into the founded city + grant founding bonus
    const baseStock = world.realmStockpile || { wood: 50, stone: 50, food: 100, gold: 50 };
    const newCity = {
      id: cityId,
      name: cityName,
      x: unit.x,
      y: unit.y,
      level: 1,
      foundedAtSimMs: simTimeMs,
      stockpile: {
        wood:  (baseStock.wood  || 0) + 40,
        stone: (baseStock.stone || 0) + 40,
        food:  (baseStock.food  || 0) + 50,
        gold:  (baseStock.gold  || 0) + 25
      },
      // IMPORTANT: Only town_hall starts at level 1! Adventurers Guild Hall must be built in the real-time queue!
      buildings: {
        town_hall: 1
      },
      plots: createDefaultCityPlots(),
      selectedPlotIndex: CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27,
      buildQueue: [],
      maxBuildQueueSlots: BASE_BUILD_QUEUE_LIMIT || 3,
      recruitmentQueue: [],
      maxRecruitQueueSlots: BASE_RECRUIT_QUEUE_LIMIT || 3
    };

    world.cities[cityId] = newCity;
    world.activeCityId = cityId;
    world.stats.citiesFounded = (world.stats.citiesFounded || 0) + 1;

    if (state.campaignPhase === CAMPAIGN_PHASES.SETTLER_PIONEER) {
      state.campaignPhase = CAMPAIGN_PHASES.CITY_ESTABLISHED;
    }

    revealOverworldVision(ow, newCity.x, newCity.y, 5);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CITY_FOUNDED, {
        cityId: newCity.id,
        cityName: newCity.name,
        x: newCity.x,
        y: newCity.y
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);

    return accept({
      city: newCity,
      campaignPhase: state.campaignPhase
    });
  }

  // ---------------------------------------------------------------------------
  // 6. RESPAWN SETTLER (Safe Non-Permanent Loss Recovery before City Founding)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RESPAWN_SETTLER) {
    if (Object.keys(world.cities || {}).length > 0) {
      return reject('Cannot respawn starter settler after a city has been established');
    }
    const existingAlive = (ow.units || []).find(function(u) { return u.unitType === 'settler' && u.alive; });
    if (existingAlive) {
      return reject('Pioneer Settler is still active on the Overworld');
    }

    const settlerArch = UNIT_ARCHETYPES.settler;
    const revived = {
      id: 'unit_settler_' + (ow.units.length + 1),
      name: settlerArch.name,
      shortName: settlerArch.shortName,
      unitType: 'settler',
      x: ow.spawnX,
      y: ow.spawnY,
      hp: settlerArch.maxHp,
      maxHp: settlerArch.maxHp,
      visionRadius: settlerArch.visionRadius,
      canFoundCity: true,
      canEnterDungeon: false,
      alive: true,
      status: 'idle',
      marchPlan: null
    };

    ow.units.push(revived);
    ow.selectedUnitId = revived.id;
    revealOverworldVision(ow, revived.x, revived.y, revived.visionRadius);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.SETTLER_RESPAWNED, {
        unitId: revived.id,
        x: revived.x,
        y: revived.y
      }, simTimeMs);
    }

    return accept({ settler: revived });
  }

  // ---------------------------------------------------------------------------
  // 6B. SELECT CITY PLOT (Focus Inspector on Specific 8x8 Grid Plot)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SELECT_CITY_PLOT) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');
    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    if (plotIndex < 0 || plotIndex >= (city.plots ? city.plots.length : (CITY_TOTAL_PLOTS || 64))) {
      return reject('Invalid city plot coordinate: ' + plotIndex);
    }
    city.selectedPlotIndex = plotIndex;
    return accept({ selectedPlotIndex: plotIndex });
  }

  // ---------------------------------------------------------------------------
  // 7. QUEUE BUILDING (Real-Time City Construction Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.QUEUE_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const buildingId = payload.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[buildingId];
    if (!bDef) return reject('Unknown building type: ' + buildingId);

    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === plotIndex; });
    if (!plot) return reject('Invalid city building plot');

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || 3)) {
      return reject('City construction queue is full');
    }

    if (plot.underConstruction || plot.demolishing || plot.relocating) {
      return reject('That plot already has an active order');
    }

    if (plot.buildingId && plot.buildingId !== buildingId) {
      return reject('Plot is already occupied by ' + plot.buildingId);
    }

    // Check building prerequisites
    if (bDef.requires) {
      const reqKeys = Object.keys(bDef.requires);
      for (let i = 0; i < reqKeys.length; i++) {
        const reqB = reqKeys[i];
        const reqLvl = bDef.requires[reqB];
        const curReqLvl = (city.buildings && city.buildings[reqB]) || 0;
        if (curReqLvl < reqLvl) {
          const reqDef = CITY_BUILDINGS_CATALOG[reqB];
          return reject('Requires ' + (reqDef ? reqDef.name : reqB) + ' Level ' + reqLvl);
        }
      }
    }

    const currentLevel = plot.buildingId === buildingId ? (plot.level || 0) : 0;
    const targetLevel = currentLevel + 1;
    if (targetLevel > (bDef.maxLevel || 5)) {
      return reject(bDef.name + ' has reached maximum level');
    }

    const cost = computeBuildingUpgradeCost(buildingId, targetLevel);
    if ((city.stockpile.wood || 0) < cost.wood ||
        (city.stockpile.stone || 0) < cost.stone ||
        (city.stockpile.gold || 0) < cost.gold) {
      return reject('Insufficient city stockpiles (Need ' + cost.wood + ' Wood, ' + cost.stone + ' Stone, ' + cost.gold + ' Gold)');
    }

    // Deduct construction cost upfront
    city.stockpile.wood  -= cost.wood;
    city.stockpile.stone -= cost.stone;
    city.stockpile.gold  -= cost.gold;

    const durationMs = computeBuildingDurationMs(buildingId, targetLevel);
    const queueItem = {
      queueItemId: 'q_' + city.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      cityId: city.id,
      plotIndex: plot.plotIndex,
      buildingId: buildingId,
      buildingName: bDef.name,
      targetLevel: targetLevel,
      previousLevel: currentLevel,
      cost: cost,
      durationMs: durationMs,
      status: 'queued', // 'queued' | 'building'
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    plot.underConstruction = true;
    city.selectedPlotIndex = plot.plotIndex;
    city.buildQueue.push(queueItem);

    // If this is the front of the queue, schedule the completion timer immediately
    activateNextCityBuildQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.BUILDING_QUEUED, {
        cityId: city.id,
        cityName: city.name,
        buildingId: buildingId,
        buildingName: bDef.name,
        targetLevel: targetLevel,
        plotIndex: plot.plotIndex,
        durationMs: durationMs
      }, simTimeMs);
    }

    return accept({
      queueItem: queueItem,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 7B. MOVE BUILDING (Timed Relocation to an Empty 8x8 Grid Plot)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.MOVE_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const fromIdx = typeof payload.fromPlotIndex === 'number' ? payload.fromPlotIndex : -1;
    const toIdx   = typeof payload.toPlotIndex === 'number' ? payload.toPlotIndex : -1;

    const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === fromIdx; });
    const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === toIdx; });

    if (!fromPlot) return reject('Invalid source plot: ' + fromIdx);
    if (!toPlot)   return reject('Invalid destination plot: ' + toIdx);
    if (fromIdx === toIdx) return reject('Destination plot must be different from source');

    if (!fromPlot.buildingId || (fromPlot.level || 0) <= 0) {
      return reject('No building exists on source plot');
    }

    if (fromPlot.underConstruction || fromPlot.demolishing || fromPlot.relocating) {
      return reject('Source plot is currently undergoing an active order');
    }

    if (toPlot.buildingId || toPlot.underConstruction || toPlot.demolishing || toPlot.relocating) {
      return reject('Destination plot is already occupied or undergoing an order');
    }

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || BASE_BUILD_QUEUE_LIMIT || 3)) {
      return reject('City construction queue is full');
    }

    const bId = fromPlot.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[bId];
    const lvl = fromPlot.level || 1;
    const durMs = BASE_MOVE_BUILDING_DURATION_MS || 2500;

    const queueItem = {
      queueItemId: 'move_' + city.id + '_p' + fromIdx + '_to_p' + toIdx + '_' + Date.now(),
      cityId: city.id,
      fromPlotIndex: fromIdx,
      toPlotIndex: toIdx,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      level: lvl,
      type: 'move',
      durationMs: durMs,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    fromPlot.relocating = true;
    toPlot.relocating = true;
    city.selectedPlotIndex = toIdx;
    city.buildQueue.push(queueItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    return accept({ queueItem: queueItem });
  }

  // ---------------------------------------------------------------------------
  // 8. CANCEL BUILDING IN QUEUE (Prorated Refund + 50% Time Spent Cleanup Job)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city || !Array.isArray(city.buildQueue) || city.buildQueue.length === 0) {
      return reject('No queued construction to cancel');
    }

    const qId = payload.queueItemId;
    const idx = qId
      ? city.buildQueue.findIndex(function(q) { return q.queueItemId === qId; })
      : (typeof payload.plotIndex === 'number'
          ? city.buildQueue.findIndex(function(q) { return q.plotIndex === payload.plotIndex; })
          : city.buildQueue.length - 1);

    if (idx === -1) return reject('Construction item not found');
    const targetItem = city.buildQueue[idx];

    if (targetItem.type === 'cleanup') {
      return reject('Site cleanup cannot be cancelled');
    }

    if (targetItem.type === 'move') {
      city.buildQueue.splice(idx, 1);
      if (targetItem.jobId && scheduler) {
        scheduler.cancelJob(targetItem.jobId);
      }
      const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.fromPlotIndex; });
      const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.toPlotIndex; });
      if (fromPlot) { fromPlot.relocating = false; fromPlot.activeJobId = null; }
      if (toPlot)   { toPlot.relocating = false; toPlot.activeJobId = null; }
      activateNextCityBuildQueueItem(city, state, scheduler);
      return accept({ cancelled: targetItem });
    }

    if (targetItem.status === 'queued') {
      // Pending item: 100% full refund
      city.buildQueue.splice(idx, 1);
      if (targetItem.cost) {
        city.stockpile.wood  = (city.stockpile.wood  || 0) + (targetItem.cost.wood  || 0);
        city.stockpile.stone = (city.stockpile.stone || 0) + (targetItem.cost.stone || 0);
        city.stockpile.gold  = (city.stockpile.gold  || 0) + (targetItem.cost.gold  || 0);
      }
      const plot = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.plotIndex; });
      if (plot) {
        plot.underConstruction = false;
        plot.demolishing = false;
        plot.activeJobId = null;
      }
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.BUILDING_CANCELLED, {
          cityId: city.id,
          buildingId: targetItem.buildingId,
          buildingName: targetItem.buildingName,
          refundRatio: 1.0
        }, simTimeMs);
      }
      return accept({ cancelled: targetItem, stockpile: city.stockpile });
    }

    // Active item (status === 'building'):
    // Calculate elapsed time & prorated refund based on remaining time ratio (1.0 - elapsed / dur)
    if (targetItem.jobId && scheduler) {
      scheduler.cancelJob(targetItem.jobId);
    }
    const elapsed = Math.max(0, simTimeMs - (targetItem.startSimTimeMs || simTimeMs));
    const totalDur = Math.max(1, targetItem.durationMs || 4000);
    const unspentRatio = Math.max(0, Math.min(1, 1.0 - (elapsed / totalDur)));

    if (targetItem.cost) {
      city.stockpile.wood  = (city.stockpile.wood  || 0) + Math.floor((targetItem.cost.wood  || 0) * unspentRatio);
      city.stockpile.stone = (city.stockpile.stone || 0) + Math.floor((targetItem.cost.stone || 0) * unspentRatio);
      city.stockpile.gold  = (city.stockpile.gold  || 0) + Math.floor((targetItem.cost.gold  || 0) * unspentRatio);
    }

    // Replace the active queue item with a cleanup job taking 50% of already spent time (min 1000ms)
    const cleanupDur = Math.max(1000, Math.floor(elapsed * (CANCEL_CLEANUP_TIME_RATIO || 0.50)));
    const cleanupItem = {
      queueItemId: 'cleanup_' + targetItem.queueItemId,
      cityId: city.id,
      plotIndex: targetItem.plotIndex,
      buildingId: targetItem.buildingId,
      buildingName: targetItem.buildingName,
      type: 'cleanup',
      previousLevel: targetItem.previousLevel || 0,
      durationMs: cleanupDur,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    city.buildQueue.splice(idx, 1, cleanupItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.BUILDING_CANCELLED, {
        cityId: city.id,
        buildingId: targetItem.buildingId,
        buildingName: targetItem.buildingName,
        refundRatio: unspentRatio,
        cleanupDurationMs: cleanupDur
      }, simTimeMs);
    }

    return accept({ cancelled: targetItem, cleanup: cleanupItem, stockpile: city.stockpile });
  }

  // ---------------------------------------------------------------------------
  // 8B. DEMOLISH BUILDING (Takes 50% Build Time & Yields 35% Salvage)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DEMOLISH_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === plotIndex; });
    if (!plot || !plot.buildingId || (plot.level || 0) <= 0) {
      return reject('No established building to demolish on this plot');
    }

    if (plot.buildingId === 'town_hall') {
      return reject('The Bastion Town Hall cannot be demolished');
    }

    if (plot.underConstruction || plot.demolishing) {
      return reject('Plot already has an active construction or demolition order');
    }

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || BASE_BUILD_QUEUE_LIMIT || 3)) {
      return reject('City construction queue is full');
    }

    const bId = plot.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[bId];
    const lvl = plot.level || 1;
    const cost = computeBuildingUpgradeCost(bId, lvl);
    const baseDur = computeBuildingDurationMs(bId, lvl);

    const demolishDur = Math.max(2000, Math.floor(baseDur * (CANCEL_CLEANUP_TIME_RATIO || 0.50)));
    const salvage = {
      wood: Math.floor((cost.wood || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      stone: Math.floor((cost.stone || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      gold: Math.floor((cost.gold || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35))
    };

    const queueItem = {
      queueItemId: 'demolish_' + city.id + '_p' + plot.plotIndex + '_' + Date.now(),
      cityId: city.id,
      plotIndex: plot.plotIndex,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      type: 'demolish',
      durationMs: demolishDur,
      salvage: salvage,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    plot.demolishing = true;
    city.buildQueue.push(queueItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    return accept({ queueItem: queueItem, salvage: salvage });
  }

  // ---------------------------------------------------------------------------
  // 9. RECRUIT HERO (Real-Time 60s Training in Recruitment Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RECRUIT_HERO) {
    const city = getPrimaryCity(state);
    if (!city) {
      return reject('You must found a Bastion City before recruiting heroes');
    }

    const guildLvl = (city.buildings && city.buildings.guild_hall) || 0;
    if (guildLvl < 1) {
      return reject('Requires an Adventurers Guild Hall in your city before heroes can be recruited');
    }

    const classId = payload.classId || 'fighter';
    const classDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === classId; });
    if (!classDef) {
      return reject('Unknown hero class: ' + classId);
    }

    if (!Array.isArray(city.recruitmentQueue)) {
      city.recruitmentQueue = [];
    }

    if (city.recruitmentQueue.length >= (city.maxRecruitQueueSlots || BASE_RECRUIT_QUEUE_LIMIT || 3)) {
      return reject('Hero training grounds are full (Maximum ' + (city.maxRecruitQueueSlots || 3) + ' in training queue)');
    }

    if ((city.stockpile.gold || 0) < classDef.costGold || (city.stockpile.food || 0) < classDef.costFood) {
      return reject('Insufficient Gold or Food to swear in ' + classDef.name + ' (Need ' + classDef.costGold + ' Gold, ' + classDef.costFood + ' Food)');
    }

    city.stockpile.gold -= classDef.costGold;
    city.stockpile.food -= classDef.costFood;

    const heroIndex = (world.heroes || []).length + city.recruitmentQueue.length + 1;
    const heroName = String(payload.heroName || (classDef.name + ' #' + heroIndex)).trim();
    const queueItem = {
      queueItemId: 'rec_' + city.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      cityId: city.id,
      classId: classDef.classId,
      className: classDef.name,
      heroName: heroName,
      costGold: classDef.costGold,
      costFood: classDef.costFood,
      durationMs: BASE_HERO_RECRUIT_DURATION_MS,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    city.recruitmentQueue.push(queueItem);
    activateNextCityRecruitQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_RECRUIT_STARTED, {
        cityId: city.id,
        classId: classDef.classId,
        heroName: heroName,
        durationMs: BASE_HERO_RECRUIT_DURATION_MS
      }, simTimeMs);
    }

    return accept({
      queueItem: queueItem,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 9B. CANCEL HERO RECRUITMENT (Prorated Refund of Gold & Food)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_RECRUITMENT) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city || !Array.isArray(city.recruitmentQueue) || city.recruitmentQueue.length === 0) {
      return reject('No queued hero training to cancel');
    }

    const qId = payload.queueItemId;
    const idx = qId
      ? city.recruitmentQueue.findIndex(function(q) { return q.queueItemId === qId; })
      : city.recruitmentQueue.length - 1;

    if (idx === -1) return reject('Recruitment item not found');
    const removed = city.recruitmentQueue.splice(idx, 1)[0];

    let refundRatio = 1.0;
    if (removed.status === 'training') {
      if (removed.jobId && scheduler) {
        scheduler.cancelJob(removed.jobId);
      }
      const elapsed = Math.max(0, simTimeMs - (removed.startSimTimeMs || simTimeMs));
      const totalDur = Math.max(1, removed.durationMs || BASE_HERO_RECRUIT_DURATION_MS);
      refundRatio = Math.max(0, Math.min(1, 1.0 - (elapsed / totalDur)));
    }

    const refGold = Math.floor((removed.costGold || 0) * refundRatio);
    const refFood = Math.floor((removed.costFood || 0) * refundRatio);
    city.stockpile.gold = (city.stockpile.gold || 0) + refGold;
    city.stockpile.food = (city.stockpile.food || 0) + refFood;

    // Start next recruitment item if front was cancelled
    activateNextCityRecruitQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_RECRUIT_CANCEL, {
        cityId: city.id,
        classId: removed.classId,
        heroName: removed.heroName,
        refundGold: refGold,
        refundFood: refFood,
        refundRatio: refundRatio
      }, simTimeMs);
    }

    return accept({
      cancelled: removed,
      refundGold: refGold,
      refundFood: refFood,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 10. CLAIM TASK REWARD
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CLAIM_TASK_REWARD) {
    const taskId = payload.taskId;
    const tDef = CAMPAIGN_TASKS_DAG.find(function(t) { return t.id === taskId; });
    if (!tDef) return reject('Unknown task ID: ' + taskId);

    evaluateTaskDAG(state, eventStream);
    const entry = world.tasks[taskId];
    if (!entry || entry.status !== 'completed') {
      return reject('Task is not ready to claim');
    }

    entry.status = 'claimed';
    entry.claimedAtSimMs = simTimeMs;

    const city = getPrimaryCity(state);
    const targetStock = city ? city.stockpile : world.realmStockpile;
    const r = tDef.reward || {};

    if (r.wood)  targetStock.wood  = (targetStock.wood  || 0) + r.wood;
    if (r.stone) targetStock.stone = (targetStock.stone || 0) + r.stone;
    if (r.food)  targetStock.food  = (targetStock.food  || 0) + r.food;
    if (r.gold)  targetStock.gold  = (targetStock.gold  || 0) + r.gold;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.TASK_CLAIMED, {
        taskId: taskId,
        title: tDef.title,
        rewardLabel: tDef.rewardLabel,
        reward: r
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);

    return accept({
      taskId: taskId,
      reward: r,
      stockpile: targetStock
    });
  }

  // ---------------------------------------------------------------------------
  // 11. SET SIMULATION SPEED / PAUSE
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SET_SIM_SPEED) {
    if (typeof payload.paused === 'boolean') {
      world.clock.paused = payload.paused;
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.CLOCK_PAUSED, { paused: world.clock.paused }, simTimeMs);
      }
    }
    if (typeof payload.speedMultiplier === 'number' && payload.speedMultiplier > 0) {
      world.clock.speedMultiplier = payload.speedMultiplier;
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.CLOCK_SPEED_CHANGED, { speedMultiplier: world.clock.speedMultiplier }, simTimeMs);
      }
    }
    return accept({
      paused: world.clock.paused,
      speedMultiplier: world.clock.speedMultiplier
    });
  }

  // ---------------------------------------------------------------------------
  // 12. SWITCH ACTIVE VIEWPORT (Respecting Campaign Phase Gating!)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SWITCH_VIEW) {
    const targetView = payload.view;
    if (targetView === WARGAME_VIEWS.CITY && Object.keys(world.cities || {}).length === 0) {
      return reject('You must found your first Bastion City with your Pioneer Settler before entering City View');
    }
    if (targetView === WARGAME_VIEWS.GUILD) {
      const city = getPrimaryCity(state);
      const hasGuildHall = Boolean(city && city.buildings && city.buildings.guild_hall >= 1);
      if (!hasGuildHall) {
        return reject('Construct the Adventurers Guild Hall in your City before opening the Guild Recruitment Hall');
      }
    }
    state.activeView = targetView;
    return accept({ activeView: state.activeView });
  }

  return reject('Unsupported command type: ' + cmdType);
}

// Advance the authoritative simulation clock by deltaRealMs (multiplied by clock.speedMultiplier)
export function advanceSimulationClock(deltaRealMs, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.clock) return 0;
  const clock = state.world.clock;
  if (clock.paused || deltaRealMs <= 0) return 0;

  const mult = clock.speedMultiplier || 1;
  const simDelta = Math.round(deltaRealMs * mult);
  const targetSimTime = clock.simTimeMs + simDelta;

  // Pop and execute all scheduled jobs in chronological order up to targetSimTime
  let jobsExecuted = 0;
  if (scheduler) {
    const dueJobs = scheduler.popDueJobs(targetSimTime);
    for (let i = 0; i < dueJobs.length; i++) {
      const job = dueJobs[i];
      clock.simTimeMs = job.dueSimTimeMs;
      jobsExecuted++;
      if (job.jobType === 'UNIT_MARCH_STEP') {
        resolveMarchStepJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'CITY_BUILDING_COMPLETE') {
        resolveBuildingCompleteJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'CITY_BUILDING_MOVE_COMPLETE') {
        resolveBuildingMoveJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'CITY_BUILDING_DEMOLISH_COMPLETE') {
        resolveBuildingDemolishJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'HERO_RECRUIT_COMPLETE') {
        resolveRecruitHeroJob(job, state, scheduler, eventStream);
      }
    }
  }

  clock.simTimeMs = targetSimTime;

  // Process periodic city resource production ticks
  if (typeof clock.nextResourceTickMs !== 'number') {
    clock.nextResourceTickMs = RESOURCE_PRODUCTION_INTERVAL_MS;
  }
  while (clock.simTimeMs >= clock.nextResourceTickMs) {
    processResourceProductionTick(state, eventStream);
    clock.nextResourceTickMs += RESOURCE_PRODUCTION_INTERVAL_MS;
  }

  return jobsExecuted;
}
