// Standalone Macro Wargame Entrypoint, App Bootstrap & window.WargameApp Global Bridge

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  COMMAND_TYPES,
  OVERWORLD_VIEWPORT_W,
  OVERWORLD_VIEWPORT_H,
  OVERWORLD_TILE_SIZE
} from './constants.js';
import { createWargameSimHost } from './engine/simHost.js';
import {
  renderWargameOverworldCanvas,
  setWargameHoverTile,
  getWargameCameraOrigin
} from './ui/overworldView.js';
import { syncWargameUI, updateHeaderFastTick } from './ui/wargameUiSync.js';
import { findOverworldPath, isOverworldTilePassable } from './engine/pathfinding.js';
import { getSelectedOverworldUnit, getPrimaryCity } from './engine/state.js';
import { evaluateWargameSelfTests } from './test/wargameSelfTest.js';

export const simHost = createWargameSimHost();

let lastFrameTimestamp = null;
let autoSaveAccumulatorMs = 0;

export function handleStartNewCampaignSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const houseInput = document.getElementById('wgInputHouseName');
  const worldInput = document.getElementById('wgInputWorldName');
  const seedInput  = document.getElementById('wgInputSeedCode');
  const speedSelect = document.getElementById('wgSelectStartSpeed');

  const houseName = (houseInput && houseInput.value) || 'House Vanguard';
  const worldName = (worldInput && worldInput.value) || 'Starfall Frontier';
  const seedCode  = (seedInput && seedInput.value) || ('STAR-' + Math.floor(1000 + Math.random() * 8999));
  const simSpeed  = speedSelect ? parseFloat(speedSelect.value) || 1 : 1;

  simHost.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: {
      houseName: houseName,
      worldName: worldName,
      seedCode: seedCode,
      simSpeed: simSpeed
    }
  });

  simHost.save();
  syncWargameUI(simHost);
}

export function handleContinueCampaignClick() {
  const loaded = simHost.load();
  if (loaded) {
    syncWargameUI(simHost);
  }
}

export function handleResetToTitle() {
  simHost.state.campaignPhase = CAMPAIGN_PHASES.TITLE;
  simHost.state.world = null;
  syncWargameUI(simHost);
}

export function handleSwitchView(viewName) {
  simHost.dispatch({
    type: COMMAND_TYPES.SWITCH_VIEW,
    payload: { view: viewName }
  });
  syncWargameUI(simHost);
}

export function handleSetSimSpeed(multiplier) {
  simHost.dispatch({
    type: COMMAND_TYPES.SET_SIM_SPEED,
    payload: { speedMultiplier: multiplier, paused: false }
  });
  syncWargameUI(simHost);
}

export function handleTogglePauseClock() {
  const isPaused = simHost.state.world && simHost.state.world.clock && simHost.state.world.clock.paused;
  simHost.dispatch({
    type: COMMAND_TYPES.SET_SIM_SPEED,
    payload: { paused: !isPaused }
  });
  syncWargameUI(simHost);
}

export function handleStepOverworld(dx, dy) {
  simHost.dispatch({
    type: COMMAND_TYPES.STEP_UNIT_ADJACENT,
    payload: { dx: dx, dy: dy }
  });
  syncWargameUI(simHost);
}

export function handleFoundCity() {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  if (!selUnit) return;
  const res = simHost.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { unitId: selUnit.id, cityName: 'Oakhaven Bastion' }
  });
  if (res && res.ok) {
    simHost.state.activeView = WARGAME_VIEWS.CITY;
  }
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleRespawnSettler() {
  simHost.dispatch({
    type: COMMAND_TYPES.RESPAWN_SETTLER
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleCancelMarch() {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  if (!selUnit) return;
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_UNIT_MARCH,
    payload: { unitId: selUnit.id }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleQueueBuilding(plotIndex, buildingId) {
  simHost.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: plotIndex, buildingId: buildingId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleCancelBuilding(queueItemId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueItemId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleDemolishBuilding(plotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: plotIndex }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleCancelRecruitment(queueItemId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: queueItemId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleRecruitHero(classId) {
  simHost.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: classId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleClaimTask(taskId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: taskId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleSelectPartyByHero(heroId) {
  if (!simHost.state.world || !simHost.state.world.overworld) return;
  const ow = simHost.state.world.overworld;
  const pUnit = (ow.units || []).find(function(u) { return u.leaderHeroId === heroId && u.alive; });
  if (pUnit) {
    ow.selectedUnitId = pUnit.id;
    simHost.state.activeView = WARGAME_VIEWS.OVERWORLD;
    simHost.state._dirty = true;
    syncWargameUI(simHost);
  }
}

export function handleEnterDungeon() {
  if (simHost && simHost.state && simHost.state.world) {
    simHost.save();
  }
  if (typeof window !== 'undefined' && window.location) {
    // Smooth transition into the tactical dungeon engine!
    window.location.href = './index.html';
  }
}

// ---------------------------------------------------------------------------
// Canvas Mouse & Keyboard Listeners
// ---------------------------------------------------------------------------
function setupWargameListeners() {
  if (typeof document === 'undefined') return;

  const canvas = document.getElementById('wgOverworldCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', function(e) {
      if (!simHost.state.world || !simHost.state.world.overworld) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const ow = simHost.state.world.overworld;
      const selUnit = getSelectedOverworldUnit(simHost.state);
      const primaryCity = getPrimaryCity(simHost.state);

      const focusX = selUnit ? selUnit.x : (primaryCity ? primaryCity.x : ow.spawnX);
      const focusY = selUnit ? selUnit.y : (primaryCity ? primaryCity.y : ow.spawnY);

      const cam = getWargameCameraOrigin(ow, focusX, focusY);
      const tx = cam.camX + Math.floor(mx / OVERWORLD_TILE_SIZE);
      const ty = cam.camY + Math.floor(my / OVERWORLD_TILE_SIZE);

      if (tx >= 0 && tx < ow.width && ty >= 0 && ty < ow.height) {
        let previewRoute = null;
        if (selUnit && selUnit.alive && isOverworldTilePassable(ow, tx, ty)) {
          previewRoute = findOverworldPath(ow, selUnit.x, selUnit.y, tx, ty);
        }
        setWargameHoverTile({ x: tx, y: ty }, previewRoute);
      } else {
        setWargameHoverTile(null, null);
      }
    });

    canvas.addEventListener('mouseleave', function() {
      setWargameHoverTile(null, null);
    });

    canvas.addEventListener('click', function(e) {
      if (!simHost.state.world || !simHost.state.world.overworld) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const ow = simHost.state.world.overworld;
      const selUnit = getSelectedOverworldUnit(simHost.state);
      const primaryCity = getPrimaryCity(simHost.state);

      const focusX = selUnit ? selUnit.x : (primaryCity ? primaryCity.x : ow.spawnX);
      const focusY = selUnit ? selUnit.y : (primaryCity ? primaryCity.y : ow.spawnY);

      const cam = getWargameCameraOrigin(ow, focusX, focusY);
      const tx = cam.camX + Math.floor(mx / OVERWORLD_TILE_SIZE);
      const ty = cam.camY + Math.floor(my / OVERWORLD_TILE_SIZE);

      if (tx >= 0 && tx < ow.width && ty >= 0 && ty < ow.height && selUnit && selUnit.alive) {
        simHost.dispatch({
          type: COMMAND_TYPES.ORDER_UNIT_MARCH,
          payload: { unitId: selUnit.id, targetX: tx, targetY: ty }
        });
        simHost.state._dirty = true;
        simHost.save();
        syncWargameUI(simHost);
      }
    });
  }

  // Delegated Button Click Dispatcher (Guarantees clicks register even across re-renders)
  document.addEventListener('click', function(e) {
    if (!e.target) return;
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'found-city') {
      handleFoundCity();
    } else if (action === 'claim-task') {
      const taskId = btn.dataset.taskId;
      if (taskId) handleClaimTask(taskId);
    } else if (action === 'respawn-settler') {
      handleRespawnSettler();
    } else if (action === 'cancel-march') {
      handleCancelMarch();
    } else if (action === 'enter-dungeon') {
      handleEnterDungeon();
    } else if (action === 'queue-building') {
      const pIdx = parseInt(btn.dataset.plotIndex, 10);
      const bId = btn.dataset.buildingId;
      if (!isNaN(pIdx) && bId) handleQueueBuilding(pIdx, bId);
    } else if (action === 'cancel-building') {
      const qId = btn.dataset.queueItemId;
      if (qId) handleCancelBuilding(qId);
    } else if (action === 'demolish-building') {
      const pIdx = parseInt(btn.dataset.plotIndex, 10);
      if (!isNaN(pIdx)) handleDemolishBuilding(pIdx);
    } else if (action === 'recruit-hero') {
      const cId = btn.dataset.classId;
      if (cId) handleRecruitHero(cId);
    } else if (action === 'cancel-recruitment') {
      const qId = btn.dataset.queueItemId;
      if (qId) handleCancelRecruitment(qId);
    } else if (action === 'select-party') {
      const hId = btn.dataset.heroId;
      if (hId) handleSelectPartyByHero(hId);
    } else if (action === 'continue-campaign') {
      handleContinueCampaignClick();
    }
  });

  // Guarantee state preservation when leaving page (navigating to dungeon mode, reload, etc.)
  window.addEventListener('beforeunload', function() {
    if (simHost && simHost.state && simHost.state.world) {
      simHost.save();
    }
  });
  window.addEventListener('pagehide', function() {
    if (simHost && simHost.state && simHost.state.world) {
      simHost.save();
    }
  });

  // Global Keyboard shortcuts
  window.addEventListener('keydown', function(e) {
    // Avoid capturing inputs when typing into input fields
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
      return;
    }

    if (!simHost.state.world) return;

    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      handleStepOverworld(0, -1);
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      handleStepOverworld(0, 1);
    } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      handleStepOverworld(-1, 0);
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      handleStepOverworld(1, 0);
    } else if (e.key === ' ') {
      handleTogglePauseClock();
    } else if (e.key === '1') {
      handleSetSimSpeed(1);
    } else if (e.key === '2') {
      handleSetSimSpeed(2);
    } else if (e.key === '5') {
      handleSetSimSpeed(5);
    }
  });
}

// ---------------------------------------------------------------------------
// Main Real-Time Simulation Loop
// ---------------------------------------------------------------------------
let lastUiSyncRealMs = 0;

function wargameMainLoop(timestamp) {
  if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
  const elapsedRealMs = Math.min(250, timestamp - lastFrameTimestamp);
  lastFrameTimestamp = timestamp;

  if (simHost.state.world && simHost.state.campaignPhase !== CAMPAIGN_PHASES.TITLE) {
    simHost.stepClock(elapsedRealMs);

    autoSaveAccumulatorMs += elapsedRealMs;
    if (autoSaveAccumulatorMs >= 5000) {
      autoSaveAccumulatorMs = 0;
      simHost.save();
    }

    if (simHost.state.activeView === WARGAME_VIEWS.OVERWORLD) {
      renderWargameOverworldCanvas(simHost);
    }
    updateHeaderFastTick(simHost);

    // Throttle DOM rebuilds so buttons don't get destroyed mid-click
    if (simHost.state._dirty || (timestamp - lastUiSyncRealMs >= 400)) {
      lastUiSyncRealMs = timestamp;
      simHost.state._dirty = false;
      syncWargameUI(simHost);
    }
  }

  requestAnimationFrame(wargameMainLoop);
}

export const WargameApp = {
  simHost: simHost,
  evaluateWargameSelfTests: evaluateWargameSelfTests,
  handleStartNewCampaignSubmit: handleStartNewCampaignSubmit,
  handleContinueCampaignClick: handleContinueCampaignClick,
  handleResetToTitle: handleResetToTitle,
  handleSwitchView: handleSwitchView,
  handleSetSimSpeed: handleSetSimSpeed,
  handleTogglePauseClock: handleTogglePauseClock,
  handleStepOverworld: handleStepOverworld,
  handleFoundCity: handleFoundCity,
  handleRespawnSettler: handleRespawnSettler,
  handleCancelMarch: handleCancelMarch,
  handleQueueBuilding: handleQueueBuilding,
  handleCancelBuilding: handleCancelBuilding,
  handleDemolishBuilding: handleDemolishBuilding,
  handleRecruitHero: handleRecruitHero,
  handleCancelRecruitment: handleCancelRecruitment,
  handleClaimTask: handleClaimTask,
  handleSelectPartyByHero: handleSelectPartyByHero,
  handleEnterDungeon: handleEnterDungeon,
  syncWargameUI: function() { syncWargameUI(simHost); }
};

export function bootstrapWargame() {
  setupWargameListeners();

  // Try restoring saved campaign if available
  if (simHost.hasSavedCampaign()) {
    simHost.load();
  }

  syncWargameUI(simHost);
  requestAnimationFrame(wargameMainLoop);
}

if (typeof window !== 'undefined') {
  window.WargameApp = WargameApp;
  window.WargameSimHost = simHost;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', bootstrapWargame);
    } else {
      bootstrapWargame();
    }
  }
}
