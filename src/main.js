// Application Bootstrap, Event Wiring, and window.Aethelgard Global Export Bridge

import { gameState, loadGame, saveGame, getCodexMasteryMultiplier } from './engine/state.js';
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
  autoEquipBestGear,
  toggleItemLock,
  purchaseResearchRank,
  socketGemIntoItem,
  unsocketGemFromItem,
  rerollGuildBounties,
  claimBountyAtGuild,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon,
  equipItem,
  unequipItem,
  dropItem
} from './engine/actions.js';
import {
  registerCombatFOVCallback,
  handlePlayerAction,
  executeClassSkill,
  getSkillTargetingInfo,
  useStairsAtPlayer,
  waitTurn,
  startAutoWalkTo,
  cancelAutoWalk,
  runCorridor
} from './engine/combat.js';
import {
  renderDungeonCanvas,
  renderMinimapCanvas,
  updateFOV,
  spawnFloatingText,
  drawPaperDollMannequin,
  triggerCombatAnimation,
  triggerHeroLunge,
  setSkillHover,
  getSkillHover
} from './ui/renderer.js';
import { getItemTypeIcon, SLOT_METADATA } from './data/items.js';
import {
  updateAllUI,
  switchGuildTab,
  setArmorySortBy,
  logChronicle,
  clearChronicle,
  setChronicleFilter,
  getChronicleFilter,
  renderCodexTab
} from './ui/domSync.js';
import {
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  toggleLockFromInspect,
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
  respecTalents,
  openInventoryModal,
  closeInventoryModal,
  toggleInventoryModal,
  isInventoryModalOpen,
  setInventoryFilter,
  handleInventoryEquip,
  handleInventoryUnequip,
  handleInventoryDrop,
  toggleLockFromInventory,
  showFloatingItemTooltip,
  hideFloatingItemTooltip,
  renderInventoryModal
} from './ui/modals.js';
import { setupInputs } from './ui/input.js';
import {
  evaluateSelfTests,
  runSelfTests,
  openDiagnosticsModal,
  closeDiagnosticsModal,
  runChaosFuzzer
} from './test/selfTest.js';
import { TALENT_TREES } from './data/talents.js';
import { GEM_CATALOG } from './data/gems.js';
import { CURATED_DUNGEON_PROFILES, BIOME_PALETTES, resolveFloorBiome } from './data/dungeons.js';
import {
  gotoFloor,
  setHeroLevel,
  fullHeal,
  revealMap,
  toggleGodMode,
  executeDevCommand
} from './engine/dev.js';
import {
  openDevConsole,
  closeDevConsole,
  toggleDevConsole,
  handleDevWarpClick,
  handleDevSetLevelClick,
  handleDevFullHealClick,
  handleDevRevealMapClick,
  handleDevGodModeClick,
  handleDevTerminalSubmit,
  handleDevTerminalKeyDown
} from './ui/devConsole.js';

// Bind UI callbacks into engine actions & combat
registerActionCallbacks({
  log: logChronicle,
  updateUI: updateAllUI,
  floatingText: spawnFloatingText,
  outcomeModal: showOutcomeModal,
  combatAnim: triggerCombatAnimation,
  heroLunge: triggerHeroLunge
});

registerCombatFOVCallback(updateFOV);

// Expose interactive controllers to window.Aethelgard (and top-level window aliases)
export const AethelgardAPI = {
  gameState,
  loadGame,
  saveGame,
  toggleAudio,
  setSkillHover,
  getSkillHover,
  getSkillTargetingInfo,
  triggerCombatAnimation,
  setChronicleFilter,
  getChronicleFilter,
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
  toggleLockFromInspect,
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
  setArmorySortBy,
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
  equipItem,
  unequipItem,
  dropItem,
  autoEquipBestGear,
  toggleItemLock,
  purchaseResearchRank,
  socketGemIntoItem,
  unsocketGemFromItem,
  rerollGuildBounties,
  claimBountyAtGuild,
  openInventoryModal,
  closeInventoryModal,
  toggleInventoryModal,
  isInventoryModalOpen,
  setInventoryFilter,
  handleInventoryEquip,
  handleInventoryUnequip,
  handleInventoryDrop,
  toggleLockFromInventory,
  showFloatingItemTooltip,
  hideFloatingItemTooltip,
  renderInventoryModal,
  executeClassSkill,
  useHealingTonic,
  useRecallScroll,
  useStairsAtPlayer,
  handlePlayerAction: (dx, dy, evt) => {
    const isShift = (evt && evt.shiftKey) || (typeof window !== 'undefined' && window.event && window.event.shiftKey);
    if (isShift) {
      return runCorridor(dx, dy);
    }
    return handlePlayerAction(dx, dy);
  },
  runCorridor,
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
  CURATED_DUNGEON_PROFILES,
  BIOME_PALETTES,
  resolveFloorBiome,
  getCodexMasteryMultiplier,
  renderCodexTab,
  runChaosFuzzer,
  drawPaperDollMannequin,
  getItemTypeIcon,
  SLOT_METADATA,
  dev: {
    gotoFloor: gotoFloor,
    setLevel: setHeroLevel,
    fullHeal: fullHeal,
    revealMap: revealMap,
    toggleGodMode: toggleGodMode,
    executeCommand: executeDevCommand,
    toggleConsole: toggleDevConsole,
    openConsole: openDevConsole,
    closeConsole: closeDevConsole
  },
  gotoFloor,
  setHeroLevel,
  openDevConsole,
  closeDevConsole,
  toggleDevConsole,
  handleDevWarpClick,
  handleDevSetLevelClick,
  handleDevFullHealClick,
  handleDevRevealMapClick,
  handleDevGodModeClick,
  handleDevTerminalSubmit,
  handleDevTerminalKeyDown
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
