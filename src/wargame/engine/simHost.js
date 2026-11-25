// Authoritative Wargame Simulation Host (SimHost)
// Encapsulates State Store, Min-Heap Priority Queue Scheduler, Replayable WorldEventStream & CommandBus.
// Provides a clean LocalLoopback / WebSocket-ready boundary for UI clients and deterministic tests.

import { createWorldEventStream } from './eventStream.js';
import { createSimulationScheduler } from './scheduler.js';
import {
  createTitleScreenState,
  saveWargameState,
  loadWargameState,
  hasSavedWargameCampaign,
  peekSavedCampaignSummary
} from './state.js';
import { dispatchWargameCommand, advanceSimulationClock } from './commandBus.js';
import { evaluateTaskDAG } from './taskEngine.js';
import { createDefaultGameState, hydrateDungeonWorldSnapshot } from '../../engine/state.js';

export function createWargameSimHost(initialState = null) {
  const state = initialState || createTitleScreenState();
  const scheduler = createSimulationScheduler();
  const eventStream = createWorldEventStream(500);
  let attachedDungeonState = null;

  function attachDungeonState(dungeonStateRef) {
    attachedDungeonState = dungeonStateRef || null;
  }

  function resetAttachedDungeonState() {
    if (!attachedDungeonState) return;
    const fresh = createDefaultGameState();
    Object.keys(attachedDungeonState).forEach(function(k) { delete attachedDungeonState[k]; });
    Object.assign(attachedDungeonState, fresh);
  }

  function dispatch(commandEnvelope) {
    return dispatchWargameCommand(commandEnvelope, state, scheduler, eventStream);
  }

  function stepClock(deltaRealMs) {
    return advanceSimulationClock(deltaRealMs, state, scheduler, eventStream);
  }

  function save() {
    return saveWargameState(state, scheduler, attachedDungeonState);
  }

  function surfaceUnitsOnWorld(worldObj) {
    if (!worldObj || !worldObj.overworld || !Array.isArray(worldObj.overworld.units)) return;
    const pois = Array.isArray(worldObj.overworld.pois) ? worldObj.overworld.pois : [];
    for (let i = 0; i < worldObj.overworld.units.length; i++) {
      const u = worldObj.overworld.units[i];
      if (!u || !u.alive || u.status !== 'in_dungeon') continue;
      if (u.dungeonPoiId) {
        const poi = pois.find(function(p) { return p && p.id === u.dungeonPoiId; });
        if (poi && typeof poi.x === 'number' && typeof poi.y === 'number') {
          u.x = poi.x;
          u.y = poi.y;
        }
      }
      u.status = 'idle';
      u.movePlan = null;
      u.activeJobId = null;
      u.dungeonPoiId = null;
    }
  }

  function load() {
    // Phase 1: Stage & validate campaign state without mutating live state or scheduler
    const loaded = loadWargameState(null, { deferSchedulerHydrate: true });
    if (!loaded) return false;

    // Phase 2: Stage dungeon-world hydration into an isolated sandbox before committing
    let stagedDungeon = null;
    if (attachedDungeonState) {
      stagedDungeon = createDefaultGameState();
      if (loaded.world && loaded.world.dungeonWorld) {
        const hRes = hydrateDungeonWorldSnapshot(loaded.world.dungeonWorld, stagedDungeon);
        if (!hRes || !hRes.ok) {
          // Deterministic fallback: discard corrupt dungeon slice and safely surface any in_dungeon unit
          stagedDungeon = createDefaultGameState();
          loaded.world.dungeonWorld = null;
          surfaceUnitsOnWorld(loaded.world);
        } else if (stagedDungeon.wargameSession && stagedDungeon.wargameSession.active) {
          // Verify matching in_dungeon unit exists and is alive
          const targetUnitId = stagedDungeon.wargameSession.partyUnitId;
          const units = (loaded.world.overworld && Array.isArray(loaded.world.overworld.units))
            ? loaded.world.overworld.units : [];
          const matchUnit = units.find(function(u) {
            return u && u.alive && u.id === targetUnitId && u.status === 'in_dungeon';
          });
          if (!matchUnit) {
            stagedDungeon.wargameSession.active = false;
            stagedDungeon.inGuild = true;
            surfaceUnitsOnWorld(loaded.world);
          }
        }
      }
    }

    // Phase 3: Atomic commit with rollback guard
    const prevStateBackup = {};
    Object.keys(state).forEach(function(k) { prevStateBackup[k] = state[k]; });
    const prevJobsBackup = scheduler.serializeJobs();
    const prevDungeonBackup = attachedDungeonState ? {} : null;
    if (attachedDungeonState) {
      Object.keys(attachedDungeonState).forEach(function(k) { prevDungeonBackup[k] = attachedDungeonState[k]; });
    }

    try {
      Object.keys(state).forEach(function(k) { delete state[k]; });
      Object.assign(state, loaded);

      const stagedJobs = (loaded.world && Array.isArray(loaded.world.scheduledJobs))
        ? loaded.world.scheduledJobs
        : [];
      scheduler.hydrateJobs(stagedJobs);

      if (attachedDungeonState && stagedDungeon) {
        Object.keys(attachedDungeonState).forEach(function(k) { delete attachedDungeonState[k]; });
        Object.assign(attachedDungeonState, stagedDungeon);
      }

      evaluateTaskDAG(state, eventStream);
      return true;
    } catch (err) {
      // Roll back live state, scheduler, and dungeon state on unexpected commit failure
      Object.keys(state).forEach(function(k) { delete state[k]; });
      Object.assign(state, prevStateBackup);
      scheduler.hydrateJobs(prevJobsBackup);
      if (attachedDungeonState && prevDungeonBackup) {
        Object.keys(attachedDungeonState).forEach(function(k) { delete attachedDungeonState[k]; });
        Object.assign(attachedDungeonState, prevDungeonBackup);
      }
      return false;
    }
  }

  return {
    state: state,
    scheduler: scheduler,
    eventStream: eventStream,
    attachDungeonState: attachDungeonState,
    resetAttachedDungeonState: resetAttachedDungeonState,
    dispatch: dispatch,
    stepClock: stepClock,
    save: save,
    load: load,
    hasSavedCampaign: hasSavedWargameCampaign,
    peekSavedSummary: peekSavedCampaignSummary
  };
}
