// Application Bootstrap, Event Wiring, and window.Aethelgard Global Export Bridge

import { gameState, loadGame, saveGame } from './engine/state.js';
import { toggleAudio } from './engine/audio.js';
import { ENGINE_EVENTS, onEngineEvent, offEngineEvent, emitEngineEvent } from './engine/events.js';
import {
  registerActionCallbacks,
  useHealingTonic,
  useRecallScroll,
  buyShopItem,
  sellMineralUnit,
  sellGemUnit,
  sellAllOresAtAssay,
  sellArmoryItem,
  sellAllSpareGear,
  purchaseResearchRank,
  socketGemIntoItem,
  unsocketGemFromItem,
  rerollGuildBounties,
  claimBountyAtGuild,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon
} from './engine/actions.js';
import {
  registerCombatFOVCallback,
  handlePlayerAction,
  executeClassSkill,
  useStairsAtPlayer,
  waitTurn,
  startAutoWalkTo,
  cancelAutoWalk
} from './engine/combat.js';
import {
  renderDungeonCanvas,
  renderMinimapCanvas,
  updateFOV,
  spawnFloatingText
} from './ui/renderer.js';
import { updateAllUI, switchGuildTab, logChronicle, clearChronicle } from './ui/domSync.js';
import {
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  socketFromInspect,
  unsocketFromInspect,
  showOutcomeModal,
  closeOutcomeModal,
  openSaveSyncModal,
  closeSaveSyncModal,
  copySaveJson,
  downloadSaveJson,
  importSaveJson,
  openExpeditionAtlasModal,
  closeExpeditionAtlasModal,
  handleSelectDungeonFromAtlas,
  promptResetDungeonFromAtlas,
  cancelResetDungeonFromAtlas,
  handleResetDungeonFromAtlas,
  onCharterSizePresetChange,
  submitCharterForm,
  openFullMapModal,
  closeFullMapModal,
  toggleFullMapModal,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  restAtGuild,
  repairPickaxeAtGuild,
  spendStatPoint,
  allocateTalent,
  respecTalents
} from './ui/modals.js';
import { setupInputs } from './ui/input.js';
import {
  evaluateSelfTests,
  runSelfTests,
  openDiagnosticsModal,
  closeDiagnosticsModal
} from './test/selfTest.js';
import { TALENT_TREES } from './data/talents.js';
import { GEM_CATALOG } from './data/gems.js';
import { CURATED_DUNGEON_PROFILES } from './data/dungeons.js';

// Bind UI callbacks into engine actions & combat
registerActionCallbacks({
  log: logChronicle,
  updateUI: updateAllUI,
  floatingText: spawnFloatingText,
  outcomeModal: showOutcomeModal
});

registerCombatFOVCallback(updateFOV);

// Expose interactive controllers to window.Aethelgard (and top-level window aliases)
export const AethelgardAPI = {
  gameState,
  loadGame,
  saveGame,
  toggleAudio,
  openSaveSyncModal,
  closeSaveSyncModal,
  copySaveJson,
  downloadSaveJson,
  importSaveJson,
  openDiagnosticsModal,
  closeDiagnosticsModal,
  evaluateSelfTests,
  runSelfTests,
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  socketFromInspect,
  unsocketFromInspect,
  showOutcomeModal,
  closeOutcomeModal,
  openExpeditionAtlasModal,
  closeExpeditionAtlasModal,
  handleSelectDungeonFromAtlas,
  promptResetDungeonFromAtlas,
  cancelResetDungeonFromAtlas,
  handleResetDungeonFromAtlas,
  onCharterSizePresetChange,
  submitCharterForm,
  openFullMapModal,
  closeFullMapModal,
  toggleFullMapModal,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon,
  switchGuildTab,
  restAtGuild,
  repairPickaxeAtGuild,
  spendStatPoint,
  allocateTalent,
  respecTalents,
  buyShopItem,
  sellMineralUnit,
  sellGemUnit,
  sellAllOresAtAssay,
  sellArmoryItem,
  sellAllSpareGear,
  purchaseResearchRank,
  socketGemIntoItem,
  unsocketGemFromItem,
  rerollGuildBounties,
  claimBountyAtGuild,
  executeClassSkill,
  useHealingTonic,
  useRecallScroll,
  useStairsAtPlayer,
  handlePlayerAction,
  startAutoWalkTo,
  cancelAutoWalk,
  renderMinimapCanvas,
  waitTurn,
  clearChronicle,
  ENGINE_EVENTS,
  onEngineEvent,
  offEngineEvent,
  emitEngineEvent,
  TALENT_TREES,
  GEM_CATALOG,
  CURATED_DUNGEON_PROFILES
};

function bootstrapApp() {
  setupInputs();
  const loaded = loadGame();
  if (!loaded || !gameState.hero) {
    selectAdventurerClass('fighter');
    openClassSelectModal(false);
  } else {
    updateFOV();
    updateAllUI();
  }
  runSelfTests(false);

  function gameLoop() {
    renderDungeonCanvas();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

if (typeof window !== 'undefined') {
  window.Aethelgard = AethelgardAPI;
  Object.assign(window, AethelgardAPI);

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', bootstrapApp);
    } else {
      bootstrapApp();
    }
  }
}
