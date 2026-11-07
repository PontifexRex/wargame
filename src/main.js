// Application Bootstrap, Event Wiring, and window.Aethelgard Global Export Bridge

import { gameState, loadGame, saveGame } from './engine/state.js';
import { toggleAudio } from './engine/audio.js';
import {
  registerActionCallbacks,
  useHealingTonic,
  useRecallScroll,
  buyShopItem,
  sellMineralUnit,
  sellAllOresAtAssay,
  sellArmoryItem,
  sellAllSpareGear,
  purchaseResearchRank
} from './engine/actions.js';
import {
  registerCombatFOVCallback,
  handlePlayerAction,
  executeClassSkill,
  useStairsAtPlayer,
  waitTurn
} from './engine/combat.js';
import { renderDungeonCanvas, updateFOV, spawnFloatingText } from './ui/renderer.js';
import { updateAllUI, switchGuildTab, logChronicle, clearChronicle } from './ui/domSync.js';
import {
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  showOutcomeModal,
  closeOutcomeModal,
  openSaveSyncModal,
  closeSaveSyncModal,
  copySaveJson,
  downloadSaveJson,
  importSaveJson,
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
  showOutcomeModal,
  closeOutcomeModal,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  switchGuildTab,
  restAtGuild,
  repairPickaxeAtGuild,
  spendStatPoint,
  allocateTalent,
  respecTalents,
  buyShopItem,
  sellMineralUnit,
  sellAllOresAtAssay,
  sellArmoryItem,
  sellAllSpareGear,
  purchaseResearchRank,
  executeClassSkill,
  useHealingTonic,
  useRecallScroll,
  useStairsAtPlayer,
  handlePlayerAction,
  waitTurn,
  clearChronicle,
  TALENT_TREES
};

function bootstrapApp() {
  setupInputs();
  const loaded = loadGame();
  if (!loaded || !gameState.hero) {
    selectAdventurerClass('fighter');
    openClassSelectModal(false);
  } else {
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
