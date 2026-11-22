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
  getWargameCameraOrigin,
  attachOverworldHexControls,
  centerOverworldOnOffset
} from './ui/overworldView.js';
import { syncWargameUI, updateHeaderFastTick } from './ui/wargameUiSync.js';
import {
  tickWorldProgression,
  handleOpenResearchHub,
  handleCloseResearchHub,
  handleSelectResearchTree,
  handleBackToResearchOverview,
  handleSelectResearchNode,
  handleOpenTrainingHub,
  handleCloseTrainingHub,
  handleSelectTrainingTree,
  handleBackToTrainingOverview,
  handleSelectTrainingNode,
  handleStartResearchAction,
  handlePauseResearchAction,
  handleResumeResearchAction,
  handleCancelResearchAction,
  handleSelectTrainingHeroAction,
  handleStartHeroTrainingAction,
  handleCancelHeroTrainingAction
} from './ui/progressionUi.js';
import {
  handleOpenDevPortal,
  handleCloseDevPortal,
  handleDevSetCurrencyAction,
  handleDevAddCurrencyAction,
  handleDevAddStockpileAction,
  handleDevSetConfigAction,
  handleDevResetConfigsAction,
  handleDevTimeJumpAction,
  handleDevCompleteQueuesAction
} from './ui/devPortal.js';
import { attachCityIsoControls, renderCityIsoCanvas } from './ui/cityIsoCanvas.js';
import { findOverworldPath, isOverworldTilePassable } from './engine/pathfinding.js';
import { getSelectedOverworldUnit, getPrimaryCity } from './engine/state.js';
import { evaluateWargameSelfTests } from './test/wargameSelfTest.js';
import {
  BRIDGE_DIRECTIONS,
  peekBridgeHandoff,
  consumeBridgeHandoff
} from '../engine/wargameBridge.js';

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
    simHost.state._dirty = true;
    syncWargameUI(simHost);
  }
}

export function handleResetToTitle() {
  if (simHost && simHost.state && simHost.state.world) {
    simHost.save();
  }
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

export function handleSelectCityPlot(plotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.SELECT_CITY_PLOT,
    payload: { plotIndex: plotIndex }
  });
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleClosePlotPopup() {
  if (!simHost.state) return;
  simHost.state._plotPopupOpen = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleMoveBuilding(fromPlotIndex, toPlotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.MOVE_BUILDING,
    payload: { fromPlotIndex: fromPlotIndex, toPlotIndex: toPlotIndex }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleStartMoveMode(plotIndex) {
  simHost.state._moveSourcePlotIndex = plotIndex;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleCancelMoveMode() {
  delete simHost.state._moveSourcePlotIndex;
  simHost.state._dirty = true;
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

export function handleOpenHeroSheet(heroId) {
  if (!simHost.state || !simHost.state.world) return;
  const heroes = simHost.state.world.heroes || [];
  let targetId = heroId || null;
  if (!targetId) {
    const sel = getSelectedOverworldUnit(simHost.state);
    if (sel && sel.leaderHeroId) targetId = sel.leaderHeroId;
    else if (heroes.length > 0) targetId = heroes[0].id;
  }
  if (!targetId) return;
  simHost.state._openHeroSheetId = targetId;
  simHost.state._confirmRetireHero = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleCloseHeroSheet() {
  if (!simHost.state) return;
  delete simHost.state._openHeroSheetId;
  simHost.state._confirmRetireHero = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleToggleRetireHeroConfirm() {
  if (!simHost.state) return;
  simHost.state._confirmRetireHero = !simHost.state._confirmRetireHero;
  syncWargameUI(simHost);
}

export function handleEquipHeroItem(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.EQUIP_HERO_ITEM,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleUnequipHeroItem(heroId, slot) {
  simHost.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: heroId, slot: slot }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleAutoEquipHero() {
  const heroId = simHost.state && simHost.state._openHeroSheetId;
  if (!heroId) return;
  simHost.dispatch({
    type: COMMAND_TYPES.AUTO_EQUIP_HERO,
    payload: { heroId: heroId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleDepositToCityStorage(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.DEPOSIT_TO_CITY_STORAGE,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleWithdrawFromCityStorage(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleDumpHeroBagToCity() {
  const heroId = simHost.state && simHost.state._openHeroSheetId;
  if (!heroId) return;
  simHost.dispatch({
    type: COMMAND_TYPES.DUMP_HERO_BAG_TO_CITY,
    payload: { heroId: heroId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleSetOverallLeader(heroId) {
  simHost.dispatch({
    type: COMMAND_TYPES.SET_OVERALL_LEADER,
    payload: { heroId: heroId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleDismissHero(heroId) {
  simHost.dispatch({
    type: COMMAND_TYPES.DISMISS_HERO,
    payload: { heroId: heroId }
  });
  if (simHost.state && simHost.state._openHeroSheetId === heroId) {
    delete simHost.state._openHeroSheetId;
  }
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleOpenFacilityModal(buildingId, plotIndex) {
  if (!simHost.state) return;
  simHost.state._openFacilityId = buildingId;
  simHost.state._openFacilityPlotIndex = (typeof plotIndex === 'number' && !isNaN(plotIndex)) ? plotIndex : null;
  simHost.state._facilityTab = null;
  simHost.state._showFacilityInfo = false;
  simHost.state._showBuildingLevels = false;
  simHost.state._confirmFacilityDemolish = false;
  simHost.state._plotPopupOpen = false;
  simHost.state.activeView = WARGAME_VIEWS.GUILD;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleToggleBuildingLevels() {
  if (!simHost.state) return;
  simHost.state._showBuildingLevels = !simHost.state._showBuildingLevels;
  if (simHost.state._showBuildingLevels) {
    simHost.state._showFacilityInfo = false;
    simHost.state._confirmFacilityDemolish = false;
  }
  syncWargameUI(simHost);
}

export function handleSwitchFacilityTab(tabId) {
  if (!simHost.state) return;
  simHost.state._facilityTab = tabId || null;
  syncWargameUI(simHost);
}

export function handleToggleFacilityInfo() {
  if (!simHost.state) return;
  simHost.state._showFacilityInfo = !simHost.state._showFacilityInfo;
  if (simHost.state._showFacilityInfo) simHost.state._confirmFacilityDemolish = false;
  syncWargameUI(simHost);
}

export function handleToggleFacilityDemolishConfirm() {
  if (!simHost.state) return;
  simHost.state._confirmFacilityDemolish = !simHost.state._confirmFacilityDemolish;
  if (simHost.state._confirmFacilityDemolish) simHost.state._showFacilityInfo = false;
  syncWargameUI(simHost);
}

export function handleOpenScreenInfo() {
  if (!simHost.state) return;
  simHost.state._showScreenInfo = true;
  syncWargameUI(simHost);
}

export function handleCloseScreenInfo() {
  if (!simHost.state) return;
  simHost.state._showScreenInfo = false;
  syncWargameUI(simHost);
}

export function handleToggleMobileDrawer(side) {
  if (!simHost.state) return;
  simHost.state._mobileDrawer = (simHost.state._mobileDrawer === side) ? null : side;
  syncWargameUI(simHost);
}

export function handleToggleMobilePreview() {
  if (!simHost.state) return;
  simHost.state._mobilePreview = !simHost.state._mobilePreview;
  if (!simHost.state._mobilePreview) {
    simHost.state._mobileDrawer = null;
  }
  syncWargameUI(simHost);
}

export function handleToggleCityProjection() {
  if (!simHost.state) return;
  simHost.state._cityViewMode = (simHost.state._cityViewMode === 'flat') ? 'iso' : 'flat';
  syncWargameUI(simHost);
}

export function handleCloseFacilityModal() {
  if (!simHost.state) return;
  delete simHost.state._openFacilityId;
  simHost.state._confirmFacilityDemolish = false;
  simHost.state._showFacilityInfo = false;
  simHost.state._facilityTab = null;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleSmeltIngots(batches) {
  simHost.dispatch({
    type: COMMAND_TYPES.SMELT_INGOTS,
    payload: { batches: batches || 1 }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleBrewProvision(kind) {
  simHost.dispatch({
    type: COMMAND_TYPES.BREW_PROVISION,
    payload: { kind: kind || 'potions' }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleForgeEquipment(slot) {
  simHost.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: slot || 'weapon' } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleTemperEquipment(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.TEMPER_EQUIPMENT, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handlePunchSocket(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleSocketCityGem(itemUid, gemId) {
  simHost.dispatch({ type: COMMAND_TYPES.SOCKET_CITY_GEM, payload: { itemUid: itemUid, gemId: gemId || 'ruby' } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleUnsocketCityGem(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.UNSOCKET_CITY_GEM, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleAssignHeroToParty(partyId, heroId) {
  simHost.dispatch({
    type: COMMAND_TYPES.ASSIGN_HERO_TO_PARTY,
    payload: { partyId: partyId, heroId: heroId }
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

export function handleMarchToDungeon(poiId) {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  if (!selUnit) return;
  simHost.dispatch({
    type: COMMAND_TYPES.MARCH_TO_DUNGEON,
    payload: { unitId: selUnit.id, poiId: poiId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleReturnToCity() {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  const city = getPrimaryCity(simHost.state);
  if (!selUnit || !city) return;
  simHost.dispatch({
    type: COMMAND_TYPES.ORDER_UNIT_MARCH,
    payload: {
      unitId: selUnit.id,
      targetX: city.x,
      targetY: city.y,
      intent: 'return_city',
      targetCityId: city.id
    }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleExitDungeonToSurface(unitId) {
  simHost.dispatch({
    type: COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE,
    payload: { unitId: unitId || null }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleMarketTrade(resourceId, side) {
  simHost.dispatch({
    type: COMMAND_TYPES.MARKET_TRADE,
    payload: { resourceId: resourceId, side: side }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleMarketLiquidateItem(itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.MARKET_LIQUIDATE_ITEM,
    payload: { itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleAcademyStudySession() {
  simHost.dispatch({
    type: COMMAND_TYPES.ACADEMY_STUDY_SESSION,
    payload: {}
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleEnterDungeon(poiId) {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  if (simHost && simHost.state && simHost.state.world && selUnit) {
    const res = simHost.dispatch({
      type: COMMAND_TYPES.ENTER_DUNGEON,
      payload: { unitId: selUnit.id, poiId: poiId || null }
    });
    simHost.save();
    if (!res || !res.ok) {
      syncWargameUI(simHost);
      return;
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    // Smooth transition into the tactical dungeon engine with handoff envelope!
    window.location.href = './index.html?from=wargame';
  }
}

// ---------------------------------------------------------------------------
// Canvas Mouse & Keyboard Listeners
// ---------------------------------------------------------------------------
function setupWargameListeners() {
  if (typeof document === 'undefined') return;

  const isoCanvas = document.getElementById('wgCityIsoCanvas');
  if (isoCanvas) {
    attachCityIsoControls(isoCanvas, {
      onRepaint: function() {
        renderCityIsoCanvas(simHost);
      },
      onSelectPlot: function(plotIndex) {
        const city = getPrimaryCity(simHost.state);
        const plot = city && Array.isArray(city.plots) ? city.plots[plotIndex] : null;
        const alreadySelected = simHost.state.selectedPlotIndex === plotIndex;
        if (alreadySelected && plot && plot.buildingId && !plot.underConstruction && !plot.demolishing && !plot.relocating && simHost.state.moveSourcePlotIndex === null) {
          handleOpenFacilityModal(plot.buildingId, plotIndex);
          return;
        }
        handleSelectCityPlot(plotIndex);
      }
    });
  }

  const canvas = document.getElementById('wgOverworldCanvas');
  if (canvas) {
    attachOverworldHexControls(canvas, {
      onHoverOffset: function(off) {
        if (!simHost.state.world || !simHost.state.world.overworld || !off) {
          setWargameHoverTile(null, null);
          return;
        }
        const ow = simHost.state.world.overworld;
        const selUnit = getSelectedOverworldUnit(simHost.state);
        if (off.x >= 0 && off.x < ow.width && off.y >= 0 && off.y < ow.height) {
          let previewRoute = null;
          if (selUnit && selUnit.alive && isOverworldTilePassable(ow, off.x, off.y)) {
            previewRoute = findOverworldPath(ow, selUnit.x, selUnit.y, off.x, off.y);
          }
          setWargameHoverTile({ x: off.x, y: off.y }, previewRoute);
        } else {
          setWargameHoverTile(null, null);
        }
      },
      onTapOffset: function(off) {
        if (!simHost.state.world || !simHost.state.world.overworld || !off) return;
        const ow = simHost.state.world.overworld;
        const selUnit = getSelectedOverworldUnit(simHost.state);
        if (off.x >= 0 && off.x < ow.width && off.y >= 0 && off.y < ow.height && selUnit && selUnit.alive) {
          simHost.dispatch({
            type: COMMAND_TYPES.ORDER_UNIT_MARCH,
            payload: { unitId: selUnit.id, targetX: off.x, targetY: off.y }
          });
          simHost.state._dirty = true;
          simHost.save();
          syncWargameUI(simHost);
        }
      },
      onRepaint: function() {
        renderWargameOverworldCanvas(simHost);
      }
    });

    canvas.addEventListener('mouseleave', function() {
      setWargameHoverTile(null, null);
    });
  }

  // Delegated Button Click Dispatcher (Guarantees clicks register even across re-renders)
  document.addEventListener('click', function(e) {
    if (!e.target) return;
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    // Avoid double-firing buttons that already execute via inline onclick
    if (btn.getAttribute && btn.getAttribute('onclick')) return;
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
      handleEnterDungeon(btn.dataset.poiId || null);
    } else if (action === 'march-to-dungeon') {
      if (btn.dataset.poiId) handleMarchToDungeon(btn.dataset.poiId);
    } else if (action === 'return-to-city') {
      handleReturnToCity();
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
    } else if (action === 'select-plot') {
      const pIdx = parseInt(btn.dataset.plotIndex, 10);
      if (!isNaN(pIdx)) {
        if (typeof simHost.state._moveSourcePlotIndex === 'number') {
          const srcIdx = simHost.state._moveSourcePlotIndex;
          delete simHost.state._moveSourcePlotIndex;
          if (srcIdx !== pIdx) handleMoveBuilding(srcIdx, pIdx);
          else syncWargameUI(simHost);
        } else {
          handleSelectCityPlot(pIdx);
        }
      }
    } else if (action === 'start-move-mode') {
      const pIdx = parseInt(btn.dataset.plotIndex, 10);
      if (!isNaN(pIdx)) handleStartMoveMode(pIdx);
    } else if (action === 'cancel-move-mode') {
      handleCancelMoveMode();
    } else if (action === 'continue-campaign') {
      handleContinueCampaignClick();
    } else if (action === 'reset-title') {
      handleResetToTitle();
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
    } else if (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C') {
      if (simHost.state._openHeroSheetId) handleCloseHeroSheet();
      else handleOpenHeroSheet();
    } else if (e.key === 'Escape' && simHost.state._openHeroSheetId) {
      handleCloseHeroSheet();
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
      tickWorldProgression(simHost);
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
  handleSelectCityPlot: handleSelectCityPlot,
  handleMoveBuilding: handleMoveBuilding,
  handleStartMoveMode: handleStartMoveMode,
  handleCancelMoveMode: handleCancelMoveMode,
  handleQueueBuilding: handleQueueBuilding,
  handleCancelBuilding: handleCancelBuilding,
  handleDemolishBuilding: handleDemolishBuilding,
  handleRecruitHero: handleRecruitHero,
  handleCancelRecruitment: handleCancelRecruitment,
  handleClaimTask: handleClaimTask,
  handleSelectPartyByHero: handleSelectPartyByHero,
  handleOpenHeroSheet: handleOpenHeroSheet,
  handleCloseHeroSheet: handleCloseHeroSheet,
  handleToggleRetireHeroConfirm: handleToggleRetireHeroConfirm,
  handleEquipHeroItem: handleEquipHeroItem,
  handleUnequipHeroItem: handleUnequipHeroItem,
  handleAutoEquipHero: handleAutoEquipHero,
  handleDepositToCityStorage: handleDepositToCityStorage,
  handleWithdrawFromCityStorage: handleWithdrawFromCityStorage,
  handleDumpHeroBagToCity: handleDumpHeroBagToCity,
  handleSetOverallLeader: handleSetOverallLeader,
  handleDismissHero: handleDismissHero,
  handleOpenFacilityModal: handleOpenFacilityModal,
  handleSwitchFacilityTab: handleSwitchFacilityTab,
  handleToggleFacilityInfo: handleToggleFacilityInfo,
  handleToggleBuildingLevels: handleToggleBuildingLevels,
  handleToggleFacilityDemolishConfirm: handleToggleFacilityDemolishConfirm,
  handleClosePlotPopup: handleClosePlotPopup,
  handleOpenScreenInfo: handleOpenScreenInfo,
  handleCloseScreenInfo: handleCloseScreenInfo,
  handleToggleMobileDrawer: handleToggleMobileDrawer,
  handleToggleMobilePreview: handleToggleMobilePreview,
  handleToggleCityProjection: handleToggleCityProjection,
  handleCloseFacilityModal: handleCloseFacilityModal,
  handleSmeltIngots: handleSmeltIngots,
  handleBrewProvision: handleBrewProvision,
  handleForgeEquipment: handleForgeEquipment,
  handleTemperEquipment: handleTemperEquipment,
  handlePunchSocket: handlePunchSocket,
  handleSocketCityGem: handleSocketCityGem,
  handleUnsocketCityGem: handleUnsocketCityGem,
  handleMarketTrade: handleMarketTrade,
  handleMarketLiquidateItem: handleMarketLiquidateItem,
  handleAcademyStudySession: handleAcademyStudySession,
  handleAssignHeroToParty: handleAssignHeroToParty,
  handleMarchToDungeon: handleMarchToDungeon,
  handleReturnToCity: handleReturnToCity,
  handleExitDungeonToSurface: handleExitDungeonToSurface,
  handleEnterDungeon: handleEnterDungeon,
  handleOpenResearchHub: function(treeId) { handleOpenResearchHub(simHost, treeId); },
  handleCloseResearchHub: function() { handleCloseResearchHub(simHost); },
  handleSelectResearchTree: function(treeId) { handleSelectResearchTree(simHost, treeId); },
  handleBackToResearchOverview: function() { handleBackToResearchOverview(simHost); },
  handleSelectResearchNode: function(itemId) { handleSelectResearchNode(simHost, itemId); },
  handleOpenTrainingHub: function(treeId) { handleOpenTrainingHub(simHost, treeId); },
  handleCloseTrainingHub: function() { handleCloseTrainingHub(simHost); },
  handleSelectTrainingTree: function(treeId) { handleSelectTrainingTree(simHost, treeId); },
  handleBackToTrainingOverview: function() { handleBackToTrainingOverview(simHost); },
  handleSelectTrainingNode: function(tid) { handleSelectTrainingNode(simHost, tid); },
  handleStartResearch: function(itemId) { return handleStartResearchAction(simHost, itemId); },
  handlePauseResearch: function(itemId) { return handlePauseResearchAction(simHost, itemId); },
  handleResumeResearch: function(itemId) { return handleResumeResearchAction(simHost, itemId); },
  handleCancelResearch: function(itemId) { return handleCancelResearchAction(simHost, itemId); },
  handleSelectTrainingHero: function(heroId) { handleSelectTrainingHeroAction(simHost, heroId); },
  handleStartHeroTraining: function(heroId, tid) { return handleStartHeroTrainingAction(simHost, heroId, tid); },
  handleCancelHeroTraining: function(heroId, tid) { return handleCancelHeroTrainingAction(simHost, heroId, tid); },
  handleOpenDevPortal: function() { handleOpenDevPortal(simHost); },
  handleCloseDevPortal: function() { handleCloseDevPortal(simHost); },
  handleDevSetCurrency: function(cid, val) { return handleDevSetCurrencyAction(simHost, cid, val); },
  handleDevAddCurrency: function(cid, delta) { return handleDevAddCurrencyAction(simHost, cid, delta); },
  handleDevAddStockpile: function(rid, delta) { return handleDevAddStockpileAction(simHost, rid, delta); },
  handleDevSetConfig: function(key, val) { return handleDevSetConfigAction(simHost, key, val); },
  handleDevResetConfigs: function() { return handleDevResetConfigsAction(simHost); },
  handleDevTimeJump: function(sec) { return handleDevTimeJumpAction(simHost, sec); },
  handleDevCompleteQueues: function() { return handleDevCompleteQueuesAction(simHost); },
  syncWargameUI: function() { syncWargameUI(simHost); }
};

export function bootstrapWargame() {
  setupWargameListeners();

  // If returning from a Turn-Based Dungeon Delve (index.html), auto-resume campaign and resolve return outcome!
  const pendingReturn = peekBridgeHandoff(BRIDGE_DIRECTIONS.TO_WARGAME);
  if (pendingReturn) {
    const loaded = simHost.load();
    if (loaded) {
      const consumed = consumeBridgeHandoff(BRIDGE_DIRECTIONS.TO_WARGAME);
      if (consumed) {
        simHost.dispatch({
          type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
          payload: consumed
        });
        simHost.state.activeView = WARGAME_VIEWS.OVERWORLD;
        simHost.state._dirty = true;
        simHost.save();
      }
    }
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
