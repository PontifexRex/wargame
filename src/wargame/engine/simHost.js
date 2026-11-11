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

export function createWargameSimHost(initialState = null) {
  const state = initialState || createTitleScreenState();
  const scheduler = createSimulationScheduler();
  const eventStream = createWorldEventStream(500);

  function dispatch(commandEnvelope) {
    return dispatchWargameCommand(commandEnvelope, state, scheduler, eventStream);
  }

  function stepClock(deltaRealMs) {
    return advanceSimulationClock(deltaRealMs, state, scheduler, eventStream);
  }

  function save() {
    return saveWargameState(state, scheduler);
  }

  function load() {
    const loaded = loadWargameState(scheduler);
    if (!loaded) return false;
    Object.keys(state).forEach(function(k) { delete state[k]; });
    Object.assign(state, loaded);
    evaluateTaskDAG(state, eventStream);
    return true;
  }

  return {
    state: state,
    scheduler: scheduler,
    eventStream: eventStream,
    dispatch: dispatch,
    stepClock: stepClock,
    save: save,
    load: load,
    hasSavedCampaign: hasSavedWargameCampaign,
    peekSavedSummary: peekSavedCampaignSummary
  };
}
