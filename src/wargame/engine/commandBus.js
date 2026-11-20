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
  CITY_TOTAL_PLOTS,
  BASE_MAX_HERO_ROSTER,
  CITY_STORAGE_BASE_CAPACITY
} from '../constants.js';
import {
  OVERWORLD_TERRAIN_DEFS,
  UNIT_ARCHETYPES,
  RECRUITABLE_HERO_CLASSES
} from '../data/terrain.js';
import {
  CITY_BUILDINGS_CATALOG,
  computeBuildingUpgradeCost,
  computeBuildingDurationMs,
  isBuildingPrerequisiteMet,
  getBuildingPrerequisiteMissingReason,
  computeMaxPartySize,
  getCityRecruitableClasses
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
  depositUnitCargoAtCity,
  activateNextCityBuildQueueItem,
  resolveBuildingCompleteJob,
  resolveBuildingDemolishJob,
  resolveBuildingMoveJob,
  activateNextCityRecruitQueueItem,
  resolveRecruitHeroJob,
  processResourceProductionTick
} from './queues.js';
import {
  createDungeonEntryEnvelope,
  writeDungeonEntryHandoff
} from '../../engine/wargameBridge.js';
import { evaluateTaskDAG } from './taskEngine.js';
import {
  createNewCampaignWorldState,
  createDefaultCityPlots,
  createInventoryContainer,
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
    if (unit.status === 'in_dungeon') return reject('Unit is currently delving inside a dungeon');

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
      intent: payload.intent || 'move',
      targetPoiId: payload.targetPoiId || null,
      targetCityId: payload.targetCityId || null,
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
        gold:  (baseStock.gold  || 0) + 25,
        water: (baseStock.water || 0) + 30,
        ore:   (baseStock.ore   || 0) + 15,
        ingots: 0
      },
      provisions: {
        potions: 2,
        recalls: 1
      },
      gems: {
        ruby: 1,
        emerald: 1,
        sapphire: 0,
        topaz: 0,
        void_diamond: 0
      },
      // IMPORTANT: Only town_hall / meeting_hall starts at level 1!
      buildings: {
        town_hall: 1,
        meeting_hall: 1
      },
      population: {
        current: 5,
        max: 10,
        growthProgress: 0,
        starving: false,
        starveTicks: 0
      },
      plots: createDefaultCityPlots(),
      selectedPlotIndex: CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27,
      buildQueue: [],
      maxBuildQueueSlots: BASE_BUILD_QUEUE_LIMIT || 3,
      recruitmentQueue: [],
      maxRecruitQueueSlots: BASE_RECRUIT_QUEUE_LIMIT || 3,
      storage: createInventoryContainer('city_storage_' + cityId, cityName + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200)
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

    const isSameBuilding = (plot.buildingId === buildingId) ||
      (plot.buildingId === 'town_hall' && buildingId === 'meeting_hall') ||
      (plot.buildingId === 'meeting_hall' && buildingId === 'town_hall') ||
      (plot.buildingId === 'farmstead' && buildingId === 'garden') ||
      (plot.buildingId === 'garden' && buildingId === 'farmstead') ||
      (plot.buildingId === 'sawmill' && (buildingId === 'lumber_camp' || buildingId === 'lumber_hut')) ||
      (plot.buildingId === 'lumber_hut' && (buildingId === 'lumber_camp' || buildingId === 'sawmill')) ||
      (plot.buildingId === 'lumber_camp' && (buildingId === 'sawmill' || buildingId === 'lumber_hut'));

    if (plot.buildingId && !isSameBuilding) {
      return reject('Plot is already occupied by ' + plot.buildingId);
    }

    // Check building prerequisites & population requirements
    if (!isBuildingPrerequisiteMet(city, buildingId)) {
      const reason = getBuildingPrerequisiteMissingReason(city, buildingId);
      return reject(reason || 'Prerequisites not met');
    }

    const currentLevel = isSameBuilding ? (plot.level || 0) : 0;
    const targetLevel = currentLevel + 1;
    if (targetLevel > (bDef.maxLevel || 5)) {
      return reject(bDef.name + ' has reached maximum level');
    }

    // Meeting Hall Rule: No building in the city can exceed the level of the Meeting Hall
    if (buildingId !== 'meeting_hall' && buildingId !== 'town_hall') {
      const meetingHallLevel = Math.max(
        (city.buildings && city.buildings.meeting_hall) || 0,
        (city.buildings && city.buildings.town_hall) || 0,
        1
      );
      if (targetLevel > meetingHallLevel) {
        return reject('Cannot exceed Meeting Hall level (' + meetingHallLevel + ')');
      }
    }

    const cost = computeBuildingUpgradeCost(buildingId, targetLevel);
    const stock = city.stockpile;
    if ((stock.wood  || 0) < (cost.wood  || 0) ||
        (stock.stone || 0) < (cost.stone || 0) ||
        (stock.gold  || 0) < (cost.gold  || 0) ||
        (stock.water || 0) < (cost.water || 0) ||
        (stock.ore   || 0) < (cost.ore   || 0)) {
      return reject('Insufficient city stockpiles (Need ' + cost.wood + ' Wood, ' + cost.stone + ' Stone, ' + cost.gold + ' Gold)');
    }

    // Deduct construction cost upfront
    stock.wood  = (stock.wood  || 0) - (cost.wood  || 0);
    stock.stone = (stock.stone || 0) - (cost.stone || 0);
    stock.gold  = (stock.gold  || 0) - (cost.gold  || 0);
    if (cost.water) stock.water = (stock.water || 0) - cost.water;
    if (cost.ore)   stock.ore   = (stock.ore   || 0) - cost.ore;

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
        if (targetItem.cost.water) city.stockpile.water = (city.stockpile.water || 0) + targetItem.cost.water;
        if (targetItem.cost.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + targetItem.cost.ore;
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
      if (targetItem.cost.water) city.stockpile.water = (city.stockpile.water || 0) + Math.floor(targetItem.cost.water * unspentRatio);
      if (targetItem.cost.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + Math.floor(targetItem.cost.ore * unspentRatio);
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

    if (plot.buildingId === 'town_hall' || plot.buildingId === 'meeting_hall') {
      return reject('The Meeting Hall cannot be demolished');
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
      wood:  Math.floor((cost.wood  || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      stone: Math.floor((cost.stone || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      gold:  Math.floor((cost.gold  || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      water: Math.floor((cost.water || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      ore:   Math.floor((cost.ore   || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35))
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

    // Enforce global Hero Roster Cap (ADR-0012: starts at 3, dismiss a Hero to recruit another)
    const maxHeroes = (world.roster && world.roster.maxHeroes) ? world.roster.maxHeroes : (BASE_MAX_HERO_ROSTER || 3);
    const totalActiveAndQueued = (world.heroes ? world.heroes.length : 0) + city.recruitmentQueue.length;
    if (totalActiveAndQueued >= maxHeroes) {
      return reject('Hero roster is full (' + totalActiveAndQueued + '/' + maxHeroes + '). Dismiss a Hero before recruiting another.');
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
  // 9B2. EQUIP / UNEQUIP HERO EQUIPMENT (Shared Character Sheet Operations)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.EQUIP_HERO_ITEM) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    if (!hero.equipment) hero.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };

    const itemIdx = hero.bagGear.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (itemIdx === -1) return reject('Item not found in hero pack');
    const item = hero.bagGear.splice(itemIdx, 1)[0];
    const slot = item.slot;
    if (!slot || !(slot in hero.equipment)) {
      hero.bagGear.push(item);
      return reject('Unsupported equipment slot: ' + slot);
    }

    const prev = hero.equipment[slot];
    if (prev) {
      hero.bagGear.push(prev);
    }
    hero.equipment[slot] = item;
    return accept({ heroId: hero.id, slot: slot, equipped: item, swappedOut: prev || null });
  }

  if (cmdType === COMMAND_TYPES.UNEQUIP_HERO_ITEM) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    const slot = payload.slot;
    if (slot === 'pickaxe') return reject('Pickaxe cannot be unequipped directly');
    if (!hero.equipment || !hero.equipment[slot]) return reject('No item equipped in ' + slot);
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];

    const removed = hero.equipment[slot];
    hero.equipment[slot] = null;
    hero.bagGear.push(removed);
    return accept({ heroId: hero.id, slot: slot, unequipped: removed });
  }

  if (cmdType === COMMAND_TYPES.AUTO_EQUIP_HERO) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    if (!hero.equipment) hero.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };

    function scoreGear(it) {
      if (!it) return -1;
      return (it.atk || 0) * 3 + (it.def || 0) * 2.5 + (it.hp || 0) * 0.4 + (it.mp || 0) * 0.3 + (it.tier || 0) * 15;
    }

    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    let equippedCount = 0;
    for (let s = 0; s < slots.length; s++) {
      const sl = slots[s];
      const candidates = hero.bagGear.filter(function(g) { return g && g.slot === sl; });
      if (candidates.length === 0) continue;
      candidates.sort(function(a, b) { return scoreGear(b) - scoreGear(a); });
      const best = candidates[0];
      const cur = hero.equipment[sl];
      if (scoreGear(best) > scoreGear(cur)) {
        const idx = hero.bagGear.indexOf(best);
        if (idx !== -1) hero.bagGear.splice(idx, 1);
        hero.equipment[sl] = best;
        if (cur) hero.bagGear.push(cur);
        equippedCount++;
      }
    }
    return accept({ heroId: hero.id, equippedCount: equippedCount });
  }

  // ---------------------------------------------------------------------------
  // 9B3. HERO ROSTER MANAGEMENT (Dismiss Hero, Overall Leader, Garrison Party)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DISMISS_HERO) {
    const heroIdx = (world.heroes || []).findIndex(function(h) { return h.id === payload.heroId; });
    if (heroIdx === -1) return reject('Hero not found in roster');
    const hero = world.heroes[heroIdx];
    const city = getPrimaryCity(state);

    // Safely deposit all hero equipment & bag gear into City Vault Storage!
    if (city) {
      if (!city.storage || !Array.isArray(city.storage.items)) {
        city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
      }
      if (hero.equipment) {
        const eqKeys = Object.keys(hero.equipment);
        for (let i = 0; i < eqKeys.length; i++) {
          const it = hero.equipment[eqKeys[i]];
          if (it) city.storage.items.push(it);
        }
      }
      if (Array.isArray(hero.bagGear)) {
        for (let i = 0; i < hero.bagGear.length; i++) {
          if (hero.bagGear[i]) city.storage.items.push(hero.bagGear[i]);
        }
      }
    }

    world.heroes.splice(heroIdx, 1);

    // Remove or clean up Overworld unit led by this dismissed hero
    if (ow && Array.isArray(ow.units)) {
      for (let u = 0; u < ow.units.length; u++) {
        if (ow.units[u].leaderHeroId === hero.id) {
          if (ow.units[u].marchPlan && ow.units[u].marchPlan.activeJobId && scheduler) {
            scheduler.cancelJob(ow.units[u].marchPlan.activeJobId);
          }
          ow.units[u].alive = false;
          ow.units[u].status = 'dismissed';
        }
      }
    }

    // Remove from any party
    if (Array.isArray(world.parties)) {
      world.parties = world.parties.filter(function(pt) {
        if (Array.isArray(pt.memberHeroIds)) {
          pt.memberHeroIds = pt.memberHeroIds.filter(function(mid) { return mid !== hero.id; });
        }
        if (Array.isArray(pt.memberIds)) {
          pt.memberIds = pt.memberIds.filter(function(mid) { return mid !== hero.id; });
        }
        return pt.leaderHeroId !== hero.id;
      });
    }

    // Reassign Overall Leader if the dismissed hero was leader
    if (world.roster && world.roster.overallLeaderHeroId === hero.id) {
      world.roster.overallLeaderHeroId = world.heroes.length > 0 ? world.heroes[0].id : null;
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_DISMISSED, {
        heroId: hero.id,
        heroName: hero.name
      }, simTimeMs);
    }
    return accept({ dismissedHeroId: hero.id, remainingHeroes: world.heroes.length });
  }

  if (cmdType === COMMAND_TYPES.SET_OVERALL_LEADER) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found in roster');
    if (!world.roster) world.roster = { maxHeroes: BASE_MAX_HERO_ROSTER || 3, overallLeaderHeroId: null };
    world.roster.overallLeaderHeroId = hero.id;
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.LEADER_CHANGED, {
        heroId: hero.id,
        heroName: hero.name
      }, simTimeMs);
    }
    return accept({ overallLeaderHeroId: hero.id });
  }

  if (cmdType === COMMAND_TYPES.ASSIGN_HERO_TO_PARTY) {
    const city = getPrimaryCity(state);
    if (!city) return reject('Requires an established City');
    const maxSize = computeMaxPartySize(city);
    const party = (world.parties || []).find(function(pt) { return pt.id === payload.partyId; });
    if (!party) return reject('Party not found');
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(party.memberIds)) party.memberIds = [];
    if (party.memberIds.indexOf(hero.id) !== -1) return reject('Hero is already in this party');
    if (party.memberIds.length >= maxSize) {
      return reject('Party is at maximum capacity (' + maxSize + '). Build or upgrade the City Garrison to add more Heroes to a Party.');
    }
    party.memberIds.push(hero.id);
    return accept({ partyId: party.id, memberIds: party.memberIds.slice(), maxPartySize: maxSize });
  }

  // ---------------------------------------------------------------------------
  // 9B4. CITY VAULT STORAGE CONTAINER (Deposit, Withdraw, Dump Bag — ADR-0012)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DEPOSIT_TO_CITY_STORAGE) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero || !Array.isArray(hero.bagGear)) return reject('Hero not found');
    if (city.storage.items.length >= (city.storage.capacity || 200)) {
      return reject('City Vault Storage is full');
    }
    const idx = hero.bagGear.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (idx === -1) return reject('Item not found in hero pack');
    const item = hero.bagGear.splice(idx, 1)[0];
    city.storage.items.push(item);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'deposit', itemName: item.name }, simTimeMs);
    }
    return accept({ item: item, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    const idx = city.storage.items.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (idx === -1) return reject('Item not found in City Vault Storage');
    const item = city.storage.items.splice(idx, 1)[0];
    hero.bagGear.push(item);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'withdraw', itemName: item.name }, simTimeMs);
    }
    return accept({ item: item, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.DUMP_HERO_BAG_TO_CITY) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero || !Array.isArray(hero.bagGear) || hero.bagGear.length === 0) {
      return reject('Hero pack is already empty');
    }
    const cap = city.storage.capacity || 200;
    let movedCount = 0;
    while (hero.bagGear.length > 0 && city.storage.items.length < cap) {
      city.storage.items.push(hero.bagGear.shift());
      movedCount++;
    }
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'dump', count: movedCount }, simTimeMs);
    }
    return accept({ movedCount: movedCount, storageCount: city.storage.items.length });
  }

  // ---------------------------------------------------------------------------
  // 9B5. TIER 2 CITY INDUSTRY (Smeltery Ingots & Apothecary Provisions — Inc 9.6)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SMELT_INGOTS) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const smelteryLvl = (city.buildings && city.buildings.smeltery) || 0;
    if (smelteryLvl < 1) return reject('Construct a Dwarven Smeltery before smelting ingots');

    const batches = Math.max(1, Math.min(10, Math.round(Number(payload.batches) || 1)));
    const oreCost = 5 * batches;
    const woodCost = 5 * batches;
    const yieldIngots = 2 * batches;

    if ((city.stockpile.ore || 0) < oreCost || (city.stockpile.wood || 0) < woodCost) {
      return reject('Insufficient materials (Need ' + oreCost + ' Ore and ' + woodCost + ' Wood)');
    }
    city.stockpile.ore -= oreCost;
    city.stockpile.wood -= woodCost;
    city.stockpile.ingots = (city.stockpile.ingots || 0) + yieldIngots;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'smeltery',
        itemName: 'Forged Ingots',
        qty: yieldIngots
      }, simTimeMs);
    }
    return accept({ ingotsAdded: yieldIngots, totalIngots: city.stockpile.ingots });
  }

  if (cmdType === COMMAND_TYPES.BREW_PROVISION) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const apothLvl = (city.buildings && city.buildings.apothecary) || 0;
    if (apothLvl < 1) return reject('Construct an Alchemist Apothecary before brewing provisions');
    if (!city.provisions) city.provisions = { potions: 0, recalls: 0 };

    const kind = payload.kind === 'recalls' ? 'recalls' : 'potions';
    if (kind === 'potions') {
      if ((city.stockpile.food || 0) < 10 || (city.stockpile.water || 0) < 10 || (city.stockpile.gold || 0) < 10) {
        return reject('Need 10 Food, 10 Water, and 10 Gold to brew a Healing Tonic');
      }
      city.stockpile.food -= 10;
      city.stockpile.water -= 10;
      city.stockpile.gold -= 10;
      city.provisions.potions = (city.provisions.potions || 0) + 1;
    } else {
      if ((city.stockpile.gold || 0) < 25 || (city.stockpile.ore || 0) < 5) {
        return reject('Need 25 Gold and 5 Ore to scribe an Astral Recall Scroll');
      }
      city.stockpile.gold -= 25;
      city.stockpile.ore -= 5;
      city.provisions.recalls = (city.provisions.recalls || 0) + 1;
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'apothecary',
        itemName: kind === 'potions' ? 'Healing Tonic' : 'Astral Recall Scroll',
        qty: 1
      }, simTimeMs);
    }
    return accept({ kind: kind, provisions: Object.assign({}, city.provisions) });
  }

  // ---------------------------------------------------------------------------
  // 9B6. CITY BLACKSMITH (Star-Forge) & LAPIDARY WORKSHOP (Inc 9.7)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.FORGE_EQUIPMENT) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const bsLvl = (city.buildings && city.buildings.blacksmith) || 0;
    if (bsLvl < 1) return reject('Construct a Blacksmith & Star-Forge before forging equipment');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }

    const slot = payload.slot || 'weapon';
    const validSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    if (validSlots.indexOf(slot) === -1) return reject('Invalid equipment slot: ' + slot);

    const ingotCost = 3 + bsLvl;
    const goldCost = 20 + bsLvl * 10;
    if ((city.stockpile.ingots || 0) < ingotCost || (city.stockpile.gold || 0) < goldCost) {
      return reject('Need ' + ingotCost + ' Forged Ingots and ' + goldCost + ' Gold to forge ' + slot);
    }
    city.stockpile.ingots -= ingotCost;
    city.stockpile.gold -= goldCost;

    const rarity = bsLvl >= 3 ? 'epic' : (bsLvl >= 2 ? 'rare' : 'uncommon');
    const socketCount = bsLvl >= 3 ? 2 : (bsLvl >= 2 ? 1 : 0);
    const tierName = bsLvl >= 3 ? 'Star-Forged' : (bsLvl >= 2 ? 'Tempered' : 'Forged');
    const slotNames = {
      weapon: 'Greatsword',
      armor: 'Plate Cuirass',
      helm: 'Greathelm',
      boots: 'War Greaves',
      accessory: 'Runic Signet',
      pickaxe: 'Mithril Pickaxe'
    };

    const forged = {
      uid: 'forge_' + slot + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      slot: slot,
      name: tierName + ' ' + slotNames[slot],
      rarity: rarity,
      atk: slot === 'weapon' ? (10 + bsLvl * 4) : (slot === 'accessory' ? (3 + bsLvl * 2) : 0),
      def: (slot === 'armor' || slot === 'helm' || slot === 'boots') ? (5 + bsLvl * 3) : (slot === 'accessory' ? (2 + bsLvl) : 0),
      hp: slot === 'armor' ? (10 + bsLvl * 6) : 0,
      tier: slot === 'pickaxe' ? Math.min(4, 1 + bsLvl) : undefined,
      maxDurability: slot === 'pickaxe' ? (30 + bsLvl * 10) : undefined,
      durability: slot === 'pickaxe' ? (30 + bsLvl * 10) : undefined,
      sockets: socketCount,
      gems: [],
      temperRank: 0,
      value: 45 + bsLvl * 30
    };

    city.storage.items.push(forged);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'blacksmith',
        itemName: forged.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: forged, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.TEMPER_EQUIPMENT) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const bsLvl = (city.buildings && city.buildings.blacksmith) || 0;
    if (bsLvl < 1) return reject('Requires Blacksmith & Star-Forge');

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    const curRank = item.temperRank || 0;
    if (curRank >= 3) return reject(item.name + ' is already at maximum Temper Rank (+3)');

    if ((city.stockpile.ingots || 0) < 2 || (city.stockpile.gold || 0) < 20) {
      return reject('Need 2 Forged Ingots and 20 Gold to temper equipment');
    }
    city.stockpile.ingots -= 2;
    city.stockpile.gold -= 20;

    item.temperRank = curRank + 1;
    if (item.slot === 'weapon' || item.slot === 'accessory') {
      item.atk = (item.atk || 0) + 2;
    } else {
      item.def = (item.def || 0) + 2;
    }
    item.value = (item.value || 30) + 25;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'blacksmith',
        itemName: item.name + ' (+' + item.temperRank + ')',
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, temperRank: item.temperRank });
  }

  if (cmdType === COMMAND_TYPES.PUNCH_SOCKET) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before punching gem sockets');

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    const curSockets = item.sockets || 0;
    if (curSockets >= 2) return reject(item.name + ' already has the maximum 2 Gem Sockets');

    if ((city.stockpile.ingots || 0) < 2 || (city.stockpile.gold || 0) < 35) {
      return reject('Need 2 Forged Ingots and 35 Gold to punch a Gem Socket');
    }
    city.stockpile.ingots -= 2;
    city.stockpile.gold -= 35;

    item.sockets = curSockets + 1;
    if (!Array.isArray(item.gems)) item.gems = [];
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'lapidary',
        itemName: 'Gem Socket on ' + item.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, sockets: item.sockets });
  }

  if (cmdType === COMMAND_TYPES.SOCKET_CITY_GEM) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before socketing Astral Gems');
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    if (!Array.isArray(item.gems)) item.gems = [];
    if (item.gems.length >= (item.sockets || 0)) return reject('No open Gem Sockets on ' + item.name);

    const gemId = payload.gemId || 'ruby';
    const gemBonuses = {
      ruby:         { name: 'Ruby of Might',     atk: 4, def: 0, hp: 0,  mp: 0 },
      emerald:      { name: 'Emerald of Wind',   atk: 1, def: 3, hp: 0,  mp: 0 },
      sapphire:     { name: 'Sapphire of Will',  atk: 2, def: 0, hp: 0,  mp: 15 },
      topaz:        { name: 'Topaz of Dawn',     atk: 0, def: 2, hp: 20, mp: 0 },
      void_diamond: { name: 'Void Diamond',      atk: 6, def: 4, hp: 10, mp: 10 }
    };
    const gDef = gemBonuses[gemId];
    if (!gDef) return reject('Unknown gem type: ' + gemId);
    if ((city.gems[gemId] || 0) < 1) return reject('No ' + gDef.name + ' available in City Gems');

    city.gems[gemId] -= 1;
    item.gems.push(gemId);
    item.atk = (item.atk || 0) + gDef.atk;
    item.def = (item.def || 0) + gDef.def;
    item.hp  = (item.hp  || 0) + gDef.hp;
    item.mp  = (item.mp  || 0) + gDef.mp;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'lapidary',
        itemName: gDef.name + ' into ' + item.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, gemId: gemId, remainingGems: city.gems[gemId] });
  }

  if (cmdType === COMMAND_TYPES.UNSOCKET_CITY_GEM) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before extracting gems');
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item || !Array.isArray(item.gems) || item.gems.length === 0) return reject('No socketed gems to extract');
    if ((city.stockpile.gold || 0) < 20) return reject('Need 20 Gold to safely extract a gem');

    city.stockpile.gold -= 20;
    const removedGemId = item.gems.pop();
    const gemBonuses = {
      ruby:         { atk: 4, def: 0, hp: 0,  mp: 0 },
      emerald:      { atk: 1, def: 3, hp: 0,  mp: 0 },
      sapphire:     { atk: 2, def: 0, hp: 0,  mp: 15 },
      topaz:        { atk: 0, def: 2, hp: 20, mp: 0 },
      void_diamond: { atk: 6, def: 4, hp: 10, mp: 10 }
    };
    const gDef = gemBonuses[removedGemId];
    if (gDef) {
      item.atk = Math.max(0, (item.atk || 0) - gDef.atk);
      item.def = Math.max(0, (item.def || 0) - gDef.def);
      item.hp  = Math.max(0, (item.hp  || 0) - gDef.hp);
      item.mp  = Math.max(0, (item.mp  || 0) - gDef.mp);
    }
    city.gems[removedGemId] = (city.gems[removedGemId] || 0) + 1;

    return accept({ item: item, extractedGemId: removedGemId, cityGemCount: city.gems[removedGemId] });
  }

  // ---------------------------------------------------------------------------
  // 9C. MARCH TO DUNGEON (Quick-Order Hero Party to a Discovered Vault POI)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.MARCH_TO_DUNGEON) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canEnterDungeon) {
      return reject('Select a Hero-led Vanguard Party to march on a Dungeon');
    }
    if (unit.status === 'in_dungeon') {
      return reject('Party is already delving inside a dungeon');
    }

    const poi = (ow.pois || []).find(function(p) {
      return p.type === 'dungeon_entrance' && (payload.poiId ? p.id === payload.poiId : true);
    });
    if (!poi) return reject('Dungeon entrance not found on Overworld');
    if (!poi.discovered && !(ow.explored[poi.y] && ow.explored[poi.y][poi.x])) {
      return reject('Scout the Overworld to discover ' + poi.name + ' before marching there');
    }

    if (unit.x === poi.x && unit.y === poi.y) {
      return accept({ alreadyAtEntrance: true, poiId: poi.id, dungeonId: poi.dungeonId });
    }

    return dispatchWargameCommand({
      type: COMMAND_TYPES.ORDER_UNIT_MARCH,
      payload: {
        unitId: unit.id,
        targetX: poi.x,
        targetY: poi.y,
        intent: 'enter_dungeon',
        targetPoiId: poi.id
      }
    }, state, scheduler, eventStream);
  }

  // ---------------------------------------------------------------------------
  // 9D. ENTER DUNGEON (Transition Hero Party into Turn-Based Tactical Engine)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.ENTER_DUNGEON) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canEnterDungeon) {
      return reject('Requires an active Hero-led Vanguard Party to enter a Dungeon');
    }

    const poi = (ow.pois || []).find(function(p) {
      if (p.type !== 'dungeon_entrance') return false;
      if (payload.poiId) return p.id === payload.poiId;
      return unit.x === p.x && unit.y === p.y;
    });
    if (!poi) {
      return reject('Party must complete its march onto a Dungeon Entrance before entering');
    }
    if (unit.status === 'marching') {
      return reject('Wait until the party finishes moving into ' + poi.name + ' before entering');
    }
    if (unit.x !== poi.x || unit.y !== poi.y) {
      return reject('Party must stand directly on ' + poi.name + ' before entering');
    }

    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }
    unit.x = poi.x;
    unit.y = poi.y;
    unit.status = 'in_dungeon';
    unit.marchPlan = null;
    unit.activeDungeonPoiId = poi.id;
    unit.activeDungeonId = poi.dungeonId;

    world.stats.dungeonsEntered = (world.stats.dungeonsEntered || 0) + 1;

    const hero = (world.heroes || []).find(function(h) { return h.id === unit.leaderHeroId; });
    const city = getPrimaryCity(state);

    const envelopeData = {
      campaignId: world.campaignId || (world.id + '_' + (world.seedCode || 'STAR')),
      seedCode: world.seedCode || 'STAR-7777',
      houseName: (world.player && world.player.houseName) || 'House Vanguard',
      cityId: city ? city.id : null,
      cityName: city ? city.name : 'Oakhaven Bastion',
      cityCoords: city ? { x: city.x, y: city.y } : null,
      partyUnitId: unit.id,
      hero: hero ? {
        id: hero.id,
        name: hero.name,
        classId: hero.classId,
        level: hero.level,
        xp: hero.xp,
        equipment: hero.equipment || null,
        cosmetics: hero.cosmetics || null
      } : {
        id: unit.leaderHeroId || 'hero_1',
        name: unit.shortName,
        classId: unit.heroClassId || 'fighter',
        level: 1,
        xp: 0
      },
      dungeon: {
        poiId: poi.id,
        dungeonId: poi.dungeonId,
        profileId: poi.profileId || 'starfall_vaults',
        name: poi.name,
        coords: { x: poi.x, y: poi.y }
      }
    };

    const envelope = payload.skipStorageWrite
      ? createDungeonEntryEnvelope(envelopeData)
      : writeDungeonEntryHandoff(envelopeData);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.DUNGEON_ENTERED, {
        unitId: unit.id,
        unitName: unit.shortName,
        poiId: poi.id,
        dungeonId: poi.dungeonId,
        dungeonName: poi.name
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);
    return accept({
      unitId: unit.id,
      poiId: poi.id,
      dungeonId: poi.dungeonId,
      envelope: envelope
    });
  }

  // ---------------------------------------------------------------------------
  // 9D2. EXIT DUNGEON TO SURFACE (Safely surface a party marked in_dungeon)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit) return reject('No active party found');
    unit.status = 'idle';
    unit.marchPlan = null;
    unit.activeDungeonPoiId = null;
    unit.activeDungeonId = null;
    return accept({ unitId: unit.id, x: unit.x, y: unit.y, status: 'idle' });
  }

  // ---------------------------------------------------------------------------
  // 9E. RESOLVE DUNGEON RETURN (Extraction Return March, Recall Scroll, or Defeat)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RESOLVE_DUNGEON_RETURN) {
    const outcome = payload.outcome === 'defeated' ? 'defeated' : 'extracted';
    const method = payload.method || 'Floor 1 Ascending Stairs (<)';
    const loot = payload.lootSummary || {};
    const city = getPrimaryCity(state);

    let unit = null;
    if (payload.partyUnitId) {
      unit = (ow.units || []).find(function(u) { return u.id === payload.partyUnitId && u.alive; });
    }
    if (!unit) {
      unit = (ow.units || []).find(function(u) { return u.status === 'in_dungeon' && u.alive; })
          || (ow.units || []).find(function(u) { return u.unitType === 'hero_party' && u.alive; });
    }
    if (!unit) return reject('No Vanguard Party found to resolve dungeon return');

    // Sync hero progression back to Overworld roster
    const hero = (world.heroes || []).find(function(h) {
      return h.id === (payload.heroId || unit.leaderHeroId);
    });
    if (hero) {
      if (typeof payload.heroLevel === 'number' && payload.heroLevel > hero.level) {
        hero.level = payload.heroLevel;
      }
      if (typeof payload.heroXp === 'number' && payload.heroXp > (hero.xp || 0)) {
        hero.xp = payload.heroXp;
      }
      if (payload.heroEquipment && typeof payload.heroEquipment === 'object') {
        hero.equipment = Object.assign({}, hero.equipment || {}, payload.heroEquipment);
      }
    }

    const poiId = payload.dungeonPoiId || unit.activeDungeonPoiId;
    const poi = (ow.pois || []).find(function(p) { return p.id === poiId; })
             || (ow.pois || []).find(function(p) { return p.type === 'dungeon_entrance'; });

    unit.activeDungeonPoiId = null;
    unit.activeDungeonId = null;
    ow.selectedUnitId = unit.id;

    if (outcome === 'defeated') {
      // Non-Permanent Defeat (Golden Rule #2): Express-return directly to City Adventurers Guild Hall
      if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
        scheduler.cancelJob(unit.marchPlan.activeJobId);
      }
      if (city) {
        unit.x = city.x;
        unit.y = city.y;
        if (loot.salvagedGold > 0) {
          city.stockpile.gold = (city.stockpile.gold || 0) + loot.salvagedGold;
        }
      }
      unit.status = 'idle';
      unit.marchPlan = null;
      unit.hp = unit.maxHp;
      unit.cargo = null;

      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.DUNGEON_RETURNED, {
          outcome: 'defeated',
          method: 'Guild Scout Rescue',
          unitId: unit.id,
          unitName: unit.shortName,
          killerName: payload.killerName || 'Abyssal Guardian',
          floorDepth: payload.floorDepth || 1,
          salvagedGold: loot.salvagedGold || 0,
          cityName: city ? city.name : 'Bastion'
        }, simTimeMs);
      }

      evaluateTaskDAG(state, eventStream);
      return accept({ outcome: 'defeated', unitId: unit.id, x: unit.x, y: unit.y, salvagedGold: loot.salvagedGold || 0 });
    }

    // Outcome: 'extracted'
    unit.hp = unit.maxHp;
    unit.status = 'idle';
    unit.marchPlan = null;

    if (!unit.cargo) {
      unit.cargo = { gold: 0, ore: 0, gems: 0, gearCount: 0, gearItems: [] };
    }
    if (!Array.isArray(unit.cargo.gearItems)) unit.cargo.gearItems = [];
    const incomingGear = Array.isArray(payload.extractedGear) ? payload.extractedGear : [];
    for (let gi = 0; gi < incomingGear.length; gi++) {
      unit.cargo.gearItems.push(incomingGear[gi]);
    }
    unit.cargo.gold      = (unit.cargo.gold      || 0) + (loot.gold      || 0);
    unit.cargo.ore       = (unit.cargo.ore       || 0) + (loot.ore       || 0);
    unit.cargo.gems      = (unit.cargo.gems      || 0) + (loot.gems      || 0);
    unit.cargo.gearCount = (unit.cargo.gearCount || 0) + Math.max(loot.gearCount || 0, incomingGear.length);

    const isRecallScroll = String(method).indexOf('Recall Scroll') !== -1;
    let returnMarchStarted = false;
    let surfacedAtEntrance = false;

    if (isRecallScroll) {
      // Astral Recall Scroll: Instant exit to the surface at the Dungeon Entrance POI (idle, cargo intact).
      // Player chooses which City or destination to march to next on the Overworld.
      if (poi) {
        unit.x = poi.x;
        unit.y = poi.y;
        revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 5);
      }
      surfacedAtEntrance = true;
    } else {
      // Surface extraction via Floor 1 Stairs or Boss Portal: Exit at Vault POI & begin timed Return March home
      if (poi) {
        unit.x = poi.x;
        unit.y = poi.y;
        revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 5);
      }
      if (city && (unit.x !== city.x || unit.y !== city.y)) {
        const marchRes = dispatchWargameCommand({
          type: COMMAND_TYPES.ORDER_UNIT_MARCH,
          payload: {
            unitId: unit.id,
            targetX: city.x,
            targetY: city.y,
            intent: 'return_city',
            targetCityId: city.id
          }
        }, state, scheduler, eventStream);
        returnMarchStarted = Boolean(marchRes && marchRes.ok);
      } else if (city) {
        depositUnitCargoAtCity(unit, city, state, simTimeMs, eventStream);
      }
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.DUNGEON_RETURNED, {
        outcome: 'extracted',
        method: method,
        unitId: unit.id,
        unitName: unit.shortName,
        expressReturn: false,
        surfacedAtEntrance: surfacedAtEntrance,
        returnMarchStarted: returnMarchStarted,
        lootSummary: loot,
        cityName: city ? city.name : 'Bastion'
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);
    return accept({
      outcome: 'extracted',
      expressReturn: false,
      surfacedAtEntrance: surfacedAtEntrance,
      returnMarchStarted: returnMarchStarted,
      unitId: unit.id,
      x: unit.x,
      y: unit.y
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

  // Pop and execute all scheduled jobs (including chained jobs) in chronological order up to targetSimTime
  let jobsExecuted = 0;
  if (scheduler) {
    while (jobsExecuted < 500) {
      const dueJobs = scheduler.popDueJobs(targetSimTime);
      if (!dueJobs || dueJobs.length === 0) break;
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
