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
  centerOverworldOnOffset,
  stepOverworldEdgeScroll,
  clearOverworldEdgeScrollPointer
} from './ui/overworldView.js';
import { syncWargameUI, updateHeaderFastTick, renderOverworldHoverTooltip } from './ui/wargameUiSync.js';
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
import { CITY_BUILDINGS_CATALOG } from './data/buildings.js';
import {
  getTroopDefinition,
  getTroopMaxUnlockedLevel,
  computeMaxRecruitableQuantity,
  computeMaxUpgradeableQuantity,
  getCityTroopCountAtLevel,
  getMilitaryTargetById,
  getMilitaryTargetAtHex
} from './data/troops.js';
import { getSelectedOverworldUnit, getPrimaryCity } from './engine/state.js';
import { evaluateWargameSelfTests } from './test/wargameSelfTest.js';
import { APP_CONTEXTS, createAppContextController } from '../core/appContext.js';
import { TILE_SIZE, TILE_STAIRS_UP, TILE_STAIRS_DOWN, TILE_CHEST, TILE_SHRINE, TILE_TRAP_VISIBLE } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG } from '../data/ores.js';
import { gameState, ensureDungeonFloorHydrated, recomputeHeroDerivedStats } from '../engine/state.js';
import {
  registerActionCallbacks,
  useHealingTonic,
  useRecallScroll,
  extractToGuild,
  equipItem,
  unequipItem,
  autoEquipBestGear,
  dropItem
} from '../engine/actions.js';
import {
  handlePlayerAction,
  executeClassSkill,
  useStairsAtPlayer,
  waitTurn,
  startAutoWalkTo,
  cancelAutoWalk,
  isAutoWalking,
  runCorridor,
  registerCombatFOVCallback
} from '../engine/combat.js';
import {
  renderDungeonCanvas,
  updateFOV,
  getCameraOrigin,
  setHoverTile,
  minimapPixelToGrid,
  spawnFloatingText,
  triggerCombatAnimation,
  triggerHeroLunge
} from '../ui/renderer.js';

export const simHost = createWargameSimHost();
simHost.attachDungeonState(gameState);

const dungeonChronicleEntries = [];
let dungeonCanvasWired = false;
let dungeonInventoryOpen = false;
let wargameBootstrapped = false;

function appendUnifiedDungeonLog(msg, tone) {
  dungeonChronicleEntries.unshift({ msg: String(msg || ''), tone: tone || 'info' });
  if (dungeonChronicleEntries.length > 30) dungeonChronicleEntries.pop();
  syncIntegratedDungeonHud();
}

function updateIntegratedDungeonHoverScanner(gx, gy) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('wgDungeonHoverScanner');
  if (!el || !gameState || !gameState.dungeon || !gameState.hero) return;
  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles || gy < 0 || gy >= floor.tiles.length || gx < 0 || gx >= floor.tiles[0].length) {
    el.innerHTML = 'Hover or click any explored tile to Auto-Walk, or use WASD / Arrow keys to move, attack, and mine.';
    return;
  }
  const explored = Boolean(floor.explored && floor.explored[gy] && floor.explored[gy][gx]);
  if (!explored) {
    el.innerHTML = '<span class="text-[#64748b]">Unexplored Shadow (' + gx + ', ' + gy + ')</span>';
    return;
  }
  const mon = (floor.monsters || []).find(function(m) { return m.hp > 0 && m.x === gx && m.y === gy; });
  if (mon) {
    el.innerHTML = '<span class="text-[#f87171] font-bold">' + mon.name + '</span> • HP ' + mon.hp + '/' + mon.maxHp + ' • ATK ' + mon.atk + ' • DEF ' + (mon.def || 0) + ' — Move adjacent to attack!';
    return;
  }
  const tile = floor.tiles[gy][gx];
  if (ORE_CATALOG[tile]) {
    const ore = ORE_CATALOG[tile];
    el.innerHTML = '<span class="text-[#fbbf24] font-bold">' + ore.name + ' Vein</span> (' + gx + ', ' + gy + ') — Bump adjacent with Pickaxe to mine.';
    return;
  }
  if (tile === TILE_STAIRS_UP) {
    el.innerHTML = '<span class="text-[#38bdf8] font-bold">Ascending Stairs (&lt;)</span> — Stand here and press [E] to ' + (gameState.dungeon.currentFloor === 1 ? 'extract to Overworld!' : 'ascend.');
    return;
  }
  if (tile === TILE_STAIRS_DOWN) {
    el.innerHTML = '<span class="text-[#c084fc] font-bold">Descending Stairs (&gt;)</span> — Stand here and press [E] to descend deeper.';
    return;
  }
  if (tile === TILE_CHEST) {
    el.innerHTML = '<span class="text-[#fbbf24] font-bold">Treasure Chest</span> — Step onto tile to loot.';
    return;
  }
  if (tile === TILE_SHRINE) {
    el.innerHTML = '<span class="text-[#34d399] font-bold">Astral Shrine</span> — Step onto tile to receive a blessing.';
    return;
  }
  if (tile === TILE_TRAP_VISIBLE) {
    el.innerHTML = '<span class="text-[#f87171] font-bold">Runic Trap</span> — Step carefully or disarm.';
    return;
  }
  const obj = (floor.objects || []).find(function(o) { return o && o.x === gx && o.y === gy; });
  if (obj) {
    el.innerHTML = '<span class="text-[#fbbf24] font-bold">' + (obj.name || obj.objectType) + '</span> (' + gx + ', ' + gy + ') — Move into or interact.';
    return;
  }
  el.innerHTML = 'Vault Floor (' + gx + ', ' + gy + ') — Click to Auto-Walk here.';
}

function syncIntegratedDungeonHud() {
  if (typeof document === 'undefined') return;
  const viewEl = document.getElementById('wgDungeonContextView');
  const isDungeon = appContext.getActiveContext() === APP_CONTEXTS.DUNGEON;
  if (viewEl) {
    viewEl.classList.toggle('hidden', !isDungeon);
  }
  if (!isDungeon || !gameState || !gameState.hero) return;

  const h = gameState.hero;
  const cls = CLASSES[h.classId] || CLASSES.fighter;
  const dng = gameState.dungeon || {};
  const titleEl = document.getElementById('wgDungeonTitleText');
  if (titleEl) titleEl.textContent = dng.name || 'The Starfall Vaults';
  const floorEl = document.getElementById('wgDungeonFloorText');
  if (floorEl) floorEl.textContent = 'Floor ' + (dng.currentFloor || 1);
  const turnEl = document.getElementById('wgDungeonTurnText');
  if (turnEl) turnEl.textContent = 'Turn ' + (gameState.turn || 0);
  const vitalsEl = document.getElementById('wgDungeonHeroVitalsText');
  if (vitalsEl) {
    vitalsEl.textContent = (h.name || 'Hero') + ' (' + cls.name + ') • Lv ' + (h.level || 1);
  }

  const barsEl = document.getElementById('wgDungeonHeroBars');
  if (barsEl) {
    const hp = Math.max(0, Math.round(h.hp || 0));
    const maxHp = Math.max(1, Math.round(h.maxHp || 1));
    const mp = Math.max(0, Math.round(h.mp || 0));
    const maxMp = Math.max(1, Math.round(h.maxMp || 1));
    const xp = Math.max(0, Math.round(h.xp || 0));
    const maxXp = Math.max(1, Math.round(h.maxXp || 60));
    const hpPct = Math.min(100, Math.round((hp / maxHp) * 100));
    const mpPct = Math.min(100, Math.round((mp / maxMp) * 100));
    const xpPct = Math.min(100, Math.round((xp / maxXp) * 100));
    barsEl.innerHTML =
      '<div><div class="flex justify-between text-[11px]"><span class="text-[#f87171]">HP</span><span>' + hp + '/' + maxHp + '</span></div><div class="h-2 rounded bg-[#080b11] overflow-hidden"><div class="h-full bg-[#ef4444]" style="width:' + hpPct + '%"></div></div></div>' +
      '<div><div class="flex justify-between text-[11px]"><span class="text-[#60a5fa]">MP</span><span>' + mp + '/' + maxMp + '</span></div><div class="h-2 rounded bg-[#080b11] overflow-hidden"><div class="h-full bg-[#3b82f6]" style="width:' + mpPct + '%"></div></div></div>' +
      '<div><div class="flex justify-between text-[11px]"><span class="text-[#fbbf24]">XP</span><span>' + xp + '/' + maxXp + '</span></div><div class="h-2 rounded bg-[#080b11] overflow-hidden"><div class="h-full bg-[#fbbf24]" style="width:' + xpPct + '%"></div></div></div>';
  }

  const statusesEl = document.getElementById('wgDungeonStatuses');
  if (statusesEl) {
    if (Array.isArray(h.statuses) && h.statuses.length > 0) {
      statusesEl.innerHTML = h.statuses.map(function(st) {
        return '<span class="px-1.5 py-0.5 rounded bg-[#1a2232] border border-[#fbbf24]/40 text-[#fbbf24]">' + (st.name || st.id) + ' (' + (st.duration || st.turns || 1) + 't)</span>';
      }).join('');
    } else {
      statusesEl.innerHTML = '';
    }
  }

  const attrsEl = document.getElementById('wgDungeonHeroAttributes');
  if (attrsEl) {
    const sp = h.statPoints || 0;
    const spBanner = sp > 0
      ? '<div class="flex items-center justify-between px-2 py-1 rounded bg-[#fbbf24]/15 border border-[#fbbf24]/50 text-[#fbbf24] font-bold mb-1"><span>✨ Stat Points Available</span><span>' + sp + '</span></div>'
      : '';
    const statRows = [
      { key: 'str', label: 'STR', val: h.computedStr || 0, color: '#f87171' },
      { key: 'dex', label: 'DEX', val: h.computedDex || 0, color: '#34d399' },
      { key: 'int', label: 'INT', val: h.computedInt || 0, color: '#60a5fa' },
      { key: 'vit', label: 'VIT', val: h.computedVit || 0, color: '#fbbf24' }
    ].map(function(s) {
      const plusBtn = sp > 0
        ? '<button onclick="window.WargameApp.handleDungeonSpendStat(\'' + s.key + '\')" class="px-2 py-0.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-[10px] cursor-pointer">+1</button>'
        : '';
      return '<div class="flex items-center justify-between px-1.5 py-0.5 rounded bg-[#080b11]"><span><span class="text-[#8b949e]">' + s.label + '</span> <strong style="color:' + s.color + '">' + s.val + '</strong></span>' + plusBtn + '</div>';
    }).join('');
    attrsEl.innerHTML = spBanner + '<div class="grid grid-cols-2 gap-1">' + statRows + '</div>';
  }

  const tonicBtn = document.getElementById('wgBtnDungeonTonic');
  if (tonicBtn) tonicBtn.textContent = '🧪 Tonic (' + ((h.consumables && h.consumables.potions) || 0) + ') [H]';
  const recallBtn = document.getElementById('wgBtnDungeonRecall');
  if (recallBtn) recallBtn.textContent = '📜 Recall (' + ((h.consumables && h.consumables.recalls) || 0) + ') [R]';

  const statsEl = document.getElementById('wgDungeonHeroStatsGrid');
  if (statsEl) {
    const pick = h.equipment && h.equipment.pickaxe ? h.equipment.pickaxe : null;
    const pickText = pick ? ((pick.curDur || 0) + '/' + (pick.maxDur || 30)) : 'None';
    statsEl.innerHTML =
      '<div class="p-1.5 rounded bg-[#080b11]">ATK <strong class="text-[#f87171]">' + (h.atk || 0) + '</strong></div>' +
      '<div class="p-1.5 rounded bg-[#080b11]">DEF <strong class="text-[#38bdf8]">' + (h.def || 0) + '</strong></div>' +
      '<div class="p-1.5 rounded bg-[#080b11]">CRIT <strong class="text-[#fbbf24]">' + (h.crit || 0) + '%</strong></div>' +
      '<div class="p-1.5 rounded bg-[#080b11]">DODGE <strong class="text-[#34d399]">' + (h.dodge || 0) + '%</strong></div>' +
      '<div class="p-1.5 rounded bg-[#080b11] col-span-2">Pickaxe <strong class="text-[#cbd5e1]">' + pickText + '</strong> • Pos (' + h.x + ',' + h.y + ')</div>';
  }

  const summaryEl = document.getElementById('wgDungeonExpeditionSummary');
  if (summaryEl) {
    const eq = h.equipment || {};
    const eqSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    const eqHtml = eqSlots.map(function(sl) {
      const it = eq[sl];
      return '<div class="flex justify-between text-[11px]"><span class="text-[#8b949e] uppercase">' + sl + '</span><span class="text-[#e6edf3] truncate max-w-[140px]">' + (it ? it.name : '—') + '</span></div>';
    }).join('');
    const packList = Array.isArray(h.expeditionPack) && h.expeditionPack.length > 0
      ? h.expeditionPack.map(function(it) { return '<span class="inline-block px-1.5 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[10px]">' + it.name + ' ×' + (it.qty || 1) + '</span>'; }).join(' ')
      : '<span class="text-[#64748b] text-[11px]">No ores/loot yet</span>';
    const gearCount = Array.isArray(h.expeditionGear) ? h.expeditionGear.length : 0;
    const potions = (h.consumables && h.consumables.potions) || 0;
    const recalls = (h.consumables && h.consumables.recalls) || 0;
    summaryEl.innerHTML =
      '<div class="space-y-0.5 pb-2 border-b border-[#283347]/70">' + eqHtml + '</div>' +
      '<div class="pt-1 flex justify-between text-[11px]"><span>Tonics: <strong class="text-[#34d399]">' + potions + '</strong></span><span>Recalls: <strong class="text-[#c084fc]">' + recalls + '</strong></span><span>Gear: <strong class="text-[#fbbf24]">' + gearCount + '</strong></span></div>' +
      '<div class="pt-1 flex flex-wrap gap-1">' + packList + '</div>';
  }

  const skillEl = document.getElementById('wgDungeonSkillCard');
  if (skillEl) {
    skillEl.innerHTML =
      '<div class="flex items-center justify-between"><strong class="text-[#60a5fa]">' + (cls.skillName || 'Class Skill') + '</strong><span class="text-[11px] text-[#fbbf24]">' + (cls.skillCost || 10) + ' MP</span></div>' +
      '<div class="text-[11px] text-[#94a3b8]">' + (cls.skillDesc || '') + '</div>' +
      '<button onclick="window.WargameApp.handleDungeonSkill()" class="w-full py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#60a5fa]/40 text-xs font-mono font-bold text-[#60a5fa] cursor-pointer">⚡ Cast ' + (cls.skillName || 'Skill') + ' [Q]</button>';
  }

  const logEl = document.getElementById('wgDungeonLog');
  if (logEl) {
    logEl.innerHTML = dungeonChronicleEntries.slice(0, 14).map(function(entry) {
      const col = entry.tone === 'bad' ? 'text-[#f87171]' : (entry.tone === 'good' ? 'text-[#34d399]' : (entry.tone === 'gold' ? 'text-[#fbbf24]' : 'text-[#94a3b8]'));
      return '<div class="' + col + '">• ' + entry.msg + '</div>';
    }).join('');
  }

  syncIntegratedDungeonInventoryModal();
}

function syncIntegratedDungeonInventoryModal() {
  if (typeof document === 'undefined') return;
  const modalEl = document.getElementById('wgDungeonInventoryModal');
  if (!modalEl) return;
  const isDungeon = appContext.getActiveContext() === APP_CONTEXTS.DUNGEON;
  if (!isDungeon || !dungeonInventoryOpen || !gameState || !gameState.hero) {
    modalEl.classList.add('hidden');
    return;
  }
  modalEl.classList.remove('hidden');
  const bodyEl = document.getElementById('wgDungeonInventoryBody');
  if (!bodyEl) return;

  const h = gameState.hero;
  const eq = h.equipment || {};
  const eqSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
  const eqRows = eqSlots.map(function(sl) {
    const it = eq[sl];
    const statLine = it
      ? [it.atk ? ('ATK +' + it.atk) : '', it.def ? ('DEF +' + it.def) : '', it.str ? ('STR +' + it.str) : '', it.dex ? ('DEX +' + it.dex) : '', it.int ? ('INT +' + it.int) : '', it.vit ? ('VIT +' + it.vit) : '', it.maxDur ? ('Dur ' + (it.curDur || 0) + '/' + it.maxDur) : ''].filter(Boolean).join(' • ')
      : 'Empty';
    const unequipBtn = (it && sl !== 'pickaxe')
      ? '<button onclick="window.WargameApp.handleDungeonUnequipItem(\'' + sl + '\')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#f87171]/40 text-[#f87171] text-[10px] cursor-pointer">Unequip</button>'
      : '';
    return '<div class="flex items-center justify-between gap-2 p-2 rounded bg-[#080b11] border border-[#283347]"><div><span class="uppercase text-[#8b949e] mr-2">' + sl + '</span><strong class="text-[#e6edf3]">' + (it ? it.name : '—') + '</strong><div class="text-[10px] text-[#94a3b8]">' + statLine + '</div></div>' + unequipBtn + '</div>';
  }).join('');

  const bagGear = Array.isArray(h.expeditionGear) ? h.expeditionGear : [];
  const bagRows = bagGear.length > 0
    ? bagGear.map(function(it) {
        const statLine = [it.atk ? ('ATK +' + it.atk) : '', it.def ? ('DEF +' + it.def) : '', it.str ? ('STR +' + it.str) : '', it.dex ? ('DEX +' + it.dex) : '', it.int ? ('INT +' + it.int) : '', it.vit ? ('VIT +' + it.vit) : ''].filter(Boolean).join(' • ');
        return '<div class="flex items-center justify-between gap-2 p-2 rounded bg-[#080b11] border border-[#283347]"><div><span class="uppercase text-[#fbbf24] mr-1.5">[' + (it.slot || 'gear') + ']</span><strong class="text-[#e6edf3]">' + it.name + '</strong><div class="text-[10px] text-[#94a3b8]">' + (statLine || (it.rarity || 'common')) + '</div></div><div class="flex items-center gap-1.5"><button onclick="window.WargameApp.handleDungeonEquipItem(\'' + it.uid + '\')" class="px-2 py-0.5 rounded bg-[#34d399]/20 hover:bg-[#34d399]/30 border border-[#34d399]/50 text-[#34d399] text-[10px] font-bold cursor-pointer">Equip</button><button onclick="window.WargameApp.handleDungeonDropItem(\'' + it.uid + '\')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#f87171]/40 text-[#f87171] text-[10px] cursor-pointer">Drop</button></div></div>';
      }).join('')
    : '<div class="text-[#64748b]">No unequipped gear in Expedition Bag.</div>';

  const pack = Array.isArray(h.expeditionPack) ? h.expeditionPack : [];
  const packHtml = pack.length > 0
    ? pack.map(function(it) {
        return '<span class="px-2 py-1 rounded bg-[#080b11] border border-[#283347] text-[#34d399]">' + it.name + ' ×' + (it.qty || 1) + '</span>';
      }).join('')
    : '<span class="text-[#64748b]">No ores, gems, or relics gathered yet.</span>';

  bodyEl.innerHTML =
    '<div><div class="text-[11px] font-bold uppercase text-[#fbbf24] mb-1.5">Equipped Loadout (6 Slots)</div><div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">' + eqRows + '</div></div>' +
    '<div><div class="text-[11px] font-bold uppercase text-[#38bdf8] mb-1.5">Expedition Gear Bag (' + bagGear.length + ')</div><div class="space-y-1.5">' + bagRows + '</div></div>' +
    '<div><div class="text-[11px] font-bold uppercase text-[#34d399] mb-1.5">Expedition Pack (Ores, Gems &amp; Relics)</div><div class="flex flex-wrap gap-1.5">' + packHtml + '</div></div>';
}

function wireIntegratedDungeonCallbacksOnce() {
  registerCombatFOVCallback(updateFOV);
  registerActionCallbacks({
    log: appendUnifiedDungeonLog,
    updateUI: syncIntegratedDungeonHud,
    floatingText: spawnFloatingText,
    outcomeModal: function(title, desc) {
      appendUnifiedDungeonLog(title + ': ' + desc, 'good');
    },
    updateFOV: updateFOV,
    combatAnim: triggerCombatAnimation,
    heroLunge: triggerHeroLunge,
    onDungeonReturn: function(returnPayload) {
      appContext.exitDungeon(returnPayload);
    }
  });

  if (!dungeonCanvasWired && typeof document !== 'undefined') {
    dungeonCanvasWired = true;
    const dCanvas = document.getElementById('dungeonCanvas');
    if (dCanvas) {
      dCanvas.addEventListener('mousemove', function(e) {
        if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON || !gameState || !gameState.hero || !gameState.dungeon) return;
        const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
        if (!floor) return;
        const rect = dCanvas.getBoundingClientRect();
        const scaleX = dCanvas.width / (rect.width || dCanvas.width);
        const scaleY = dCanvas.height / (rect.height || dCanvas.height);
        const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
        const gx = cam.camX + Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
        const gy = cam.camY + Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);
        setHoverTile({ x: gx, y: gy });
        updateIntegratedDungeonHoverScanner(gx, gy);
      });
      dCanvas.addEventListener('mouseleave', function() {
        setHoverTile(null);
      });
      dCanvas.addEventListener('click', function(e) {
        if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON || !gameState || !gameState.hero || !gameState.dungeon) return;
        const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
        if (!floor) return;
        const rect = dCanvas.getBoundingClientRect();
        const scaleX = dCanvas.width / (rect.width || dCanvas.width);
        const scaleY = dCanvas.height / (rect.height || dCanvas.height);
        const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
        const gx = cam.camX + Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
        const gy = cam.camY + Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);
        // Adjacent click acts immediately (move/attack/mine); distant explored click auto-walks
        const dx = gx - gameState.hero.x;
        const dy = gy - gameState.hero.y;
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          handlePlayerAction(dx, dy);
          syncIntegratedDungeonHud();
        } else {
          startAutoWalkTo(gx, gy);
        }
      });
    }

    const mmCanvas = document.getElementById('minimapCanvas');
    if (mmCanvas) {
      mmCanvas.addEventListener('click', function(e) {
        if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON || !gameState || !gameState.dungeon) return;
        const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
        if (!floor) return;
        const pt = minimapPixelToGrid(mmCanvas, e.clientX, e.clientY, floor);
        if (pt) {
          startAutoWalkTo(pt.x, pt.y);
        }
      });
    }
  }
}

export const appContext = createAppContextController({
  simHost: simHost,
  dungeonState: gameState,
  onEnsureDungeonInitialized: wireIntegratedDungeonCallbacksOnce,
  onContextChanged: function(ctx) {
    if (ctx === APP_CONTEXTS.DUNGEON) {
      dungeonInventoryOpen = false;
      updateFOV();
      syncIntegratedDungeonHud();
    } else {
      dungeonInventoryOpen = false;
      cancelAutoWalk();
      syncIntegratedDungeonHud();
      syncWargameUI(simHost);
    }
  }
});

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

  simHost.resetAttachedDungeonState();
  simHost.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: {
      houseName: houseName,
      worldName: worldName,
      seedCode: seedCode,
      simSpeed: simSpeed
    }
  });
  simHost.state._openFacilityId = null;
  simHost.state._openFacilityPlotIndex = null;
  simHost.state._recruitQtyByTroop = {};
  simHost.state._recruitLevelByTroop = {};
  simHost.state._upgradeQtyByKey = {};

  appContext.restoreDungeonSession();
  simHost.save();
  syncWargameUI(simHost);
}

export function handleContinueCampaignClick() {
  const loaded = simHost.load();
  if (loaded) {
    appContext.restoreDungeonSession();
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
  appContext.restoreDungeonSession();
  syncWargameUI(simHost);
}

export function handleSwitchView(viewName) {
  const res = simHost.dispatch({
    type: COMMAND_TYPES.SWITCH_VIEW,
    payload: { view: viewName }
  });
  if (res && res.ok) {
    if (viewName === WARGAME_VIEWS.GUILD) {
      simHost.state._openFacilityId = 'guild_hall';
      simHost.state._openFacilityPlotIndex = null;
    } else if (viewName === WARGAME_VIEWS.CITY || viewName === WARGAME_VIEWS.OVERWORLD) {
      simHost.state._openFacilityId = null;
      simHost.state._openFacilityPlotIndex = null;
    }
    simHost.state._showFacilityInfo = false;
    simHost.state._showBuildingLevels = false;
    simHost.state._confirmFacilityDemolish = false;
  }
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

export function handleSetTroopRecruitLevel(troopDefId, rawLevel) {
  if (!simHost.state || !simHost.state.world || !troopDefId) return 1;
  const city = getPrimaryCity(simHost.state);
  const troopDef = getTroopDefinition(troopDefId);
  if (!city || !troopDef) return 1;

  const maxLvl = getTroopMaxUnlockedLevel(city, troopDef);
  const parsed = Math.floor(Number(rawLevel));
  const clampedLvl = (isFinite(parsed) && parsed >= 1 && parsed <= maxLvl) ? parsed : Math.max(1, maxLvl);

  if (!simHost.state._recruitLevelByTroop || typeof simHost.state._recruitLevelByTroop !== 'object') {
    simHost.state._recruitLevelByTroop = {};
  }
  // If user selects the current max level, store null so camp upgrades auto-advance default
  simHost.state._recruitLevelByTroop[troopDefId] = (clampedLvl === maxLvl) ? null : clampedLvl;

  const nextMaxQty = computeMaxRecruitableQuantity(simHost.state.world, city, troopDef, clampedLvl);
  if (!simHost.state._recruitQtyByTroop || typeof simHost.state._recruitQtyByTroop !== 'object') {
    simHost.state._recruitQtyByTroop = {};
  }
  const curQty = simHost.state._recruitQtyByTroop[troopDefId] || 1;
  simHost.state._recruitQtyByTroop[troopDefId] = Math.max(1, Math.min(curQty, Math.max(1, nextMaxQty)));
  simHost.state._dirty = true;
  syncWargameUI(simHost);
  return clampedLvl;
}

export function handleSetTroopRecruitQty(troopDefId, rawValue) {
  if (!simHost.state || !simHost.state.world || !troopDefId) return 1;
  const city = getPrimaryCity(simHost.state);
  const troopDef = getTroopDefinition(troopDefId);
  if (!city || !troopDef) return 1;

  const maxLvl = getTroopMaxUnlockedLevel(city, troopDef);
  const storedLvl = simHost.state._recruitLevelByTroop && simHost.state._recruitLevelByTroop[troopDefId];
  const selLvl = (typeof storedLvl === 'number' && storedLvl >= 1 && storedLvl <= maxLvl) ? storedLvl : maxLvl;
  const maxQty = computeMaxRecruitableQuantity(simHost.state.world, city, troopDef, selLvl);
  const parsed = Number(rawValue);
  let clamped = 1;
  if (isFinite(parsed) && parsed >= 1) {
    clamped = Math.floor(parsed);
    if (maxQty >= 1 && clamped > maxQty) clamped = maxQty;
  }

  if (!simHost.state._recruitQtyByTroop || typeof simHost.state._recruitQtyByTroop !== 'object') {
    simHost.state._recruitQtyByTroop = {};
  }
  simHost.state._recruitQtyByTroop[troopDefId] = clamped;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
  return clamped;
}

export function handleSetTroopUpgradeQty(troopDefId, fromLevel, rawValue) {
  if (!simHost.state || !simHost.state.world || !troopDefId) return 1;
  const city = getPrimaryCity(simHost.state);
  const troopDef = getTroopDefinition(troopDefId);
  if (!city || !troopDef) return 1;

  const maxLvl = getTroopMaxUnlockedLevel(city, troopDef);
  const maxQty = computeMaxUpgradeableQuantity(simHost.state.world, city, troopDef, fromLevel, maxLvl);
  const parsed = Number(rawValue);
  let clamped = 1;
  if (isFinite(parsed) && parsed >= 1) {
    clamped = Math.floor(parsed);
    if (maxQty >= 1 && clamped > maxQty) clamped = maxQty;
  }

  const key = troopDefId + ':' + fromLevel;
  if (!simHost.state._upgradeQtyByKey || typeof simHost.state._upgradeQtyByKey !== 'object') {
    simHost.state._upgradeQtyByKey = {};
  }
  simHost.state._upgradeQtyByKey[key] = clamped;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
  return clamped;
}

export function handleTrainTroops(troopDefId, quantity, level) {
  const city = getPrimaryCity(simHost.state);
  const troopDef = getTroopDefinition(troopDefId);
  const maxLvl = (city && troopDef) ? getTroopMaxUnlockedLevel(city, troopDef) : 1;
  let qty = quantity;
  if (qty === undefined || qty === null) {
    qty = (simHost.state && simHost.state._recruitQtyByTroop && simHost.state._recruitQtyByTroop[troopDefId]) || 1;
  }
  let lvl = level;
  if (lvl === undefined || lvl === null) {
    const stored = simHost.state && simHost.state._recruitLevelByTroop && simHost.state._recruitLevelByTroop[troopDefId];
    lvl = (typeof stored === 'number' && stored >= 1 && stored <= maxLvl) ? stored : maxLvl;
  }
  const res = simHost.dispatch({
    type: COMMAND_TYPES.TRAIN_TROOPS,
    payload: { troopDefId: troopDefId, quantity: qty, level: lvl }
  });
  if (res && res.ok && simHost.state._recruitQtyByTroop && city && troopDef) {
    const nextMax = computeMaxRecruitableQuantity(simHost.state.world, city, troopDef, lvl);
    simHost.state._recruitQtyByTroop[troopDefId] = Math.max(1, Math.min(simHost.state._recruitQtyByTroop[troopDefId] || 1, Math.max(1, nextMax)));
  }
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleUpgradeTroops(troopDefId, fromLevel, quantity, toLevel) {
  const key = troopDefId + ':' + fromLevel;
  let qty = quantity;
  if (qty === undefined || qty === null) {
    qty = (simHost.state && simHost.state._upgradeQtyByKey && simHost.state._upgradeQtyByKey[key]) || 1;
  }
  const res = simHost.dispatch({
    type: COMMAND_TYPES.UPGRADE_TROOPS,
    payload: { troopDefId: troopDefId, fromLevel: fromLevel, toLevel: toLevel, quantity: qty }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleDisbandTroopsByLevel(troopDefId, level, quantity) {
  const res = simHost.dispatch({
    type: COMMAND_TYPES.DISBAND_TROOPS,
    payload: { troopDefId: troopDefId, level: level, quantity: quantity }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleOpenDeployArmyModal(targetX, targetY, targetId, formationType) {
  if (!simHost.state || !simHost.state.world) return;
  const city = getPrimaryCity(simHost.state);
  if (!city) return;
  const ow = simHost.state.world.overworld;
  const target = targetId ? getMilitaryTargetById(ow, targetId) : null;
  const defX = target ? target.x : ((typeof targetX === 'number' && !isNaN(targetX)) ? targetX : Math.min((ow.width || 56) - 1, city.x + 1));
  const defY = target ? target.y : ((typeof targetY === 'number' && !isNaN(targetY)) ? targetY : city.y);
  const heroParties = (ow.units || []).filter(function(u) { return u && u.alive && u.unitType === 'hero_party' && u.status !== 'in_dungeon'; });
  // PF-05: Default explicitly to 'army' (Barracks Field Army), NEVER blindly defaulting to Hero Team
  const resolvedType = target ? 'army' : (formationType === 'hero_party' && heroParties.length > 0 ? 'hero_party' : 'army');
  simHost.state._pickingDeployHex = false;
  simHost.state._deployArmyModalOpen = true;
  simHost.state._deployArmyDraft = {
    formationType: resolvedType,
    heroPartyId: heroParties[0] ? heroParties[0].id : null,
    targetId: target ? target.id : null,
    targetX: defX,
    targetY: defY,
    stayDeployed: false,
    qtyByKey: {}
  };
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleSetDeployFormationType(formationType) {
  if (!simHost.state || !simHost.state._deployArmyDraft) return;
  if (simHost.state._deployArmyDraft.targetId) return; // Military targets require a Field Army
  simHost.state._deployArmyDraft.formationType = (formationType === 'hero_party') ? 'hero_party' : 'army';
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleSelectDeployHeroParty(unitId) {
  if (!simHost.state || !simHost.state._deployArmyDraft) return;
  simHost.state._deployArmyDraft.heroPartyId = unitId || null;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleStartPickDeployHex() {
  if (!simHost.state || !simHost.state._deployArmyDraft) return;
  simHost.state._pickingDeployHex = true;
  simHost.state._deployArmyModalOpen = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleSetDiscoveryFilter(category) {
  if (!simHost.state) return;
  const valid = category === 'threats' || category === 'dungeons' || category === 'resources' || category === 'locations';
  simHost.state._discoveryFilter = valid ? category : 'all';
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleLocateOverworldHex(x, y, targetId) {
  if (!simHost.state || !simHost.state.world || !simHost.state.world.overworld) return;
  if (simHost.state.activeView !== WARGAME_VIEWS.OVERWORLD) {
    simHost.dispatch({ type: COMMAND_TYPES.SWITCH_VIEW, payload: { view: WARGAME_VIEWS.OVERWORLD } });
  }
  centerOverworldOnOffset(x, y);
  if (targetId) {
    simHost.state._selectedMilitaryTargetId = targetId;
  }
  simHost.state._dirty = true;
  syncWargameUI(simHost);
  renderWargameOverworldCanvas(simHost);
}

export function handleInspectMilitaryTarget(targetId) {
  if (!simHost.state || !simHost.state.world || !simHost.state.world.overworld) return;
  const ow = simHost.state.world.overworld;
  const mt = getMilitaryTargetById(ow, targetId);
  if (!mt) return;
  const isDisc = Boolean(mt.discovered || (ow.explored[mt.y] && ow.explored[mt.y][mt.x]));
  if (!isDisc) return;
  simHost.state._selectedMilitaryTargetId = mt.id;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleCloseMilitaryTargetInspector() {
  if (!simHost.state) return;
  simHost.state._selectedMilitaryTargetId = null;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleAssignArmyToTarget(armyId, targetId) {
  if (!simHost.state || !simHost.state.world) return { ok: false };
  const res = simHost.dispatch({
    type: COMMAND_TYPES.REDIRECT_ARMY,
    payload: { armyId: armyId, targetId: targetId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleCloseDeployArmyModal() {
  if (!simHost.state) return;
  simHost.state._deployArmyModalOpen = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

export function handleSetDeployTargetCoord(axis, rawVal) {
  if (!simHost.state || !simHost.state._deployArmyDraft) return;
  const v = Math.floor(Number(rawVal));
  if (!isFinite(v) || v < 0) return;
  if (axis === 'x') simHost.state._deployArmyDraft.targetX = v;
  else if (axis === 'y') simHost.state._deployArmyDraft.targetY = v;
  syncWargameUI(simHost);
}

export function handleSetDeployTroopQty(troopDefId, level, rawVal) {
  if (!simHost.state || !simHost.state.world || !simHost.state._deployArmyDraft) return;
  const city = getPrimaryCity(simHost.state);
  if (!city) return;
  const maxAvail = getCityTroopCountAtLevel(simHost.state.world, city.id, troopDefId, level);
  const parsed = Math.floor(Number(rawVal));
  const clamped = isFinite(parsed) ? Math.max(0, Math.min(maxAvail, parsed)) : 0;
  simHost.state._deployArmyDraft.qtyByKey[troopDefId + ':' + level] = clamped;
  syncWargameUI(simHost);
}

export function handleToggleDeployStayDeployed(checked) {
  if (!simHost.state || !simHost.state._deployArmyDraft) return;
  simHost.state._deployArmyDraft.stayDeployed = Boolean(checked);
  syncWargameUI(simHost);
}

export function handleConfirmDeployArmy() {
  if (!simHost.state || !simHost.state.world || !simHost.state._deployArmyDraft) return { ok: false };
  const city = getPrimaryCity(simHost.state);
  const draft = simHost.state._deployArmyDraft;
  const formationType = draft.targetId ? 'army' : (draft.formationType === 'hero_party' ? 'hero_party' : 'army');

  if (formationType === 'hero_party') {
    const resHero = simHost.dispatch({
      type: COMMAND_TYPES.ORDER_UNIT_MARCH,
      payload: {
        unitId: draft.heroPartyId,
        targetX: draft.targetX,
        targetY: draft.targetY
      }
    });
    if (resHero && resHero.ok) {
      simHost.state._deployArmyModalOpen = false;
      simHost.state._pickingDeployHex = false;
    }
    simHost.state._dirty = true;
    simHost.save();
    syncWargameUI(simHost);
    return resHero;
  }

  const troops = [];
  const keys = Object.keys(draft.qtyByKey || {});
  for (let i = 0; i < keys.length; i++) {
    const qty = Math.floor(Number(draft.qtyByKey[keys[i]] || 0));
    if (qty <= 0) continue;
    const parts = keys[i].split(':');
    troops.push({ troopDefId: parts[0], level: parseInt(parts[1], 10) || 1, quantity: qty });
  }
  const res = simHost.dispatch({
    type: COMMAND_TYPES.DEPLOY_ARMY,
    payload: {
      homeCityId: city ? city.id : null,
      targetId: draft.targetId || null,
      targetX: draft.targetX,
      targetY: draft.targetY,
      stayDeployed: Boolean(draft.stayDeployed),
      troops: troops
    }
  });
  if (res && res.ok) {
    simHost.state._deployArmyModalOpen = false;
    simHost.state._pickingDeployHex = false;
  }
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleSelectOverworldUnit(unitId) {
  if (!simHost.state || !simHost.state.world || !simHost.state.world.overworld) return;
  const ow = simHost.state.world.overworld;
  const found = (ow.units || []).find(function(u) { return u && u.alive && u.id === unitId; });
  if (found) {
    ow.selectedUnitId = found.id;
    simHost.state._dirty = true;
    syncWargameUI(simHost);
  }
}

export function handleReturnArmyHome(armyId) {
  const res = simHost.dispatch({
    type: COMMAND_TYPES.RETURN_ARMY_HOME,
    payload: { armyId: armyId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleSetArmyReturnPolicy(armyId, stayDeployed) {
  const res = simHost.dispatch({
    type: COMMAND_TYPES.SET_ARMY_RETURN_POLICY,
    payload: { armyId: armyId, stayDeployed: Boolean(stayDeployed) }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
  return res;
}

export function handleCancelTroopTraining(queueItemId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_TROOP_TRAINING,
    payload: { queueItemId: queueItemId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

export function handleDisbandTroops(troopGroupId, quantity) {
  simHost.dispatch({
    type: COMMAND_TYPES.DISBAND_TROOPS,
    payload: { troopGroupId: troopGroupId, quantity: quantity }
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
  if (!simHost.state || !buildingId || !CITY_BUILDINGS_CATALOG[buildingId]) return;
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
  if (!simHost || !simHost.state || !simHost.state.world) {
    return { ok: false, reason: 'no_active_world' };
  }
  const ow = simHost.state.world.overworld || {};
  const units = Array.isArray(ow.units) ? ow.units : [];
  let targetUnit = getSelectedOverworldUnit(simHost.state);

  // If selected unit isn't a dungeon-capable party, resolve the party standing at or delving in poiId
  if (!targetUnit || !targetUnit.alive || !targetUnit.canEnterDungeon) {
    targetUnit = units.find(function(u) {
      if (!u.alive || !u.canEnterDungeon) return false;
      if (poiId && u.status === 'in_dungeon' && u.activeDungeonPoiId === poiId) return true;
      return u.status === 'in_dungeon';
    }) || units.find(function(u) {
      return u.alive && u.canEnterDungeon;
    }) || null;
  }
  if (!targetUnit) {
    return { ok: false, reason: 'no_selected_party' };
  }
  ow.selectedUnitId = targetUnit.id;
  simHost.state._openFacilityId = null;
  simHost.state._openHeroSheetId = null;

  const res = appContext.enterDungeon({
    unitId: targetUnit.id,
    poiId: poiId || targetUnit.activeDungeonPoiId || null
  });
  simHost.save();
  if (!res || !res.ok) {
    syncWargameUI(simHost);
    return res || { ok: false };
  }
  return res;
}

export function handleDungeonMove(dx, dy) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  if (isAutoWalking()) cancelAutoWalk();
  handlePlayerAction(dx, dy);
  syncIntegratedDungeonHud();
}

export function handleDungeonWait() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  waitTurn();
  syncIntegratedDungeonHud();
}

export function handleDungeonUseStairs() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  useStairsAtPlayer();
  syncIntegratedDungeonHud();
}

export function handleDungeonSpendStat(statKey) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON || !gameState || !gameState.hero) return false;
  const h = gameState.hero;
  if ((h.statPoints || 0) <= 0) return false;
  if (statKey !== 'str' && statKey !== 'dex' && statKey !== 'int' && statKey !== 'vit') return false;
  if (!h.bonusStats) h.bonusStats = { str: 0, dex: 0, int: 0, vit: 0 };
  h.bonusStats[statKey] = (h.bonusStats[statKey] || 0) + 1;
  h.statPoints -= 1;
  recomputeHeroDerivedStats(false, gameState);
  appendUnifiedDungeonLog('Allocated +1 ' + statKey.toUpperCase() + '!', 'good');
  syncIntegratedDungeonHud();
  return true;
}

export function handleToggleDungeonInventory(forceOpen) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  dungeonInventoryOpen = typeof forceOpen === 'boolean' ? forceOpen : !dungeonInventoryOpen;
  syncIntegratedDungeonInventoryModal();
}

export function handleDungeonEquipItem(itemUid) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  equipItem(itemUid, gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonUnequipItem(slot) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  unequipItem(slot, gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonAutoEquip() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  autoEquipBestGear(gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonDropItem(itemUid) {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  dropItem(itemUid, true, gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonSkill() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  executeClassSkill(gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonTonic() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  useHealingTonic(gameState);
  syncIntegratedDungeonHud();
}

export function handleDungeonRecall() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  useRecallScroll(gameState);
}

export function handleDungeonSurfaceExit() {
  if (appContext.getActiveContext() !== APP_CONTEXTS.DUNGEON) return;
  if (gameState && gameState.hero && gameState.wargameSession && gameState.wargameSession.active && gameState.wargameSession.inProcess) {
    extractToGuild('Dungeon Surface Exit', gameState);
    return;
  }
  appContext.exitDungeon(null);
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
        if (typeof simHost.state._moveSourcePlotIndex === 'number') {
          const srcIdx = simHost.state._moveSourcePlotIndex;
          delete simHost.state._moveSourcePlotIndex;
          if (srcIdx !== plotIndex) handleMoveBuilding(srcIdx, plotIndex);
          else syncWargameUI(simHost);
          return;
        }
        const city = getPrimaryCity(simHost.state);
        const plot = city && Array.isArray(city.plots) ? city.plots[plotIndex] : null;
        const alreadySelected = Boolean(city && city.selectedPlotIndex === plotIndex);
        if (alreadySelected && plot && plot.buildingId && !plot.underConstruction && !plot.demolishing && !plot.relocating) {
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
      onHoverOffset: function(off, pos) {
        if (!simHost.state.world || !simHost.state.world.overworld || !off) {
          setWargameHoverTile(null, null);
          renderOverworldHoverTooltip(simHost.state, null, null);
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
          renderOverworldHoverTooltip(simHost.state, { x: off.x, y: off.y }, pos);
        } else {
          setWargameHoverTile(null, null);
          renderOverworldHoverTooltip(simHost.state, null, null);
        }
      },
      onTapOffset: function(off) {
        if (!simHost.state.world || !simHost.state.world.overworld || !off) return;
        const ow = simHost.state.world.overworld;
        if (off.x < 0 || off.x >= ow.width || off.y < 0 || off.y >= ow.height) return;

        // PF-05: Picking a map tile for Army/Team Formation destination
        if (simHost.state._pickingDeployHex && simHost.state._deployArmyDraft) {
          simHost.state._pickingDeployHex = false;
          simHost.state._deployArmyDraft.targetX = off.x;
          simHost.state._deployArmyDraft.targetY = off.y;
          simHost.state._deployArmyDraft.targetId = null;
          simHost.state._deployArmyModalOpen = true;
          simHost.state._dirty = true;
          syncWargameUI(simHost);
          return;
        }

        // Task 05B-2 explicit UI contract: tapping a discovered military target ALWAYS selects & inspects it
        // and NEVER auto-redirects an army or marches a unit without explicit Deploy/Assign confirmation.
        const tappedTarget = getMilitaryTargetAtHex(ow, off.x, off.y);
        if (tappedTarget && (tappedTarget.discovered || (ow.explored[tappedTarget.y] && ow.explored[tappedTarget.y][tappedTarget.x]))) {
          simHost.state._selectedMilitaryTargetId = tappedTarget.id;
          simHost.state._dirty = true;
          syncWargameUI(simHost);
          return;
        }

        // Selecting an existing player unit/army on the tapped hex
        const tappedUnit = (ow.units || []).find(function(u) {
          return u && u.alive && u.x === off.x && u.y === off.y;
        });
        const selUnit = getSelectedOverworldUnit(simHost.state);
        if (tappedUnit && (!selUnit || tappedUnit.id !== selUnit.id)) {
          simHost.state._selectedMilitaryTargetId = null;
          ow.selectedUnitId = tappedUnit.id;
          simHost.state._dirty = true;
          syncWargameUI(simHost);
          return;
        }

        simHost.state._selectedMilitaryTargetId = null;
        if (selUnit && selUnit.alive) {
          if (selUnit.unitType === 'army') {
            simHost.dispatch({
              type: COMMAND_TYPES.REDIRECT_ARMY,
              payload: { armyId: selUnit.id, targetX: off.x, targetY: off.y }
            });
          } else {
            simHost.dispatch({
              type: COMMAND_TYPES.ORDER_UNIT_MARCH,
              payload: { unitId: selUnit.id, targetX: off.x, targetY: off.y }
            });
          }
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
      clearOverworldEdgeScrollPointer();
      renderOverworldHoverTooltip(simHost.state, null, null);
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

  // Global Keyboard shortcuts (context-gated: Strategy vs. Dungeon)
  window.addEventListener('keydown', function(e) {
    // Avoid capturing inputs when typing into input fields
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
      return;
    }

    if (!simHost.state.world) return;

    if (appContext.getActiveContext() === APP_CONTEXTS.DUNGEON) {
      if (isAutoWalking()) cancelAutoWalk();
      let dx = 0;
      let dy = 0;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') dy = -1;
      else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') dy = 1;
      else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') dx = 1;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        if (e.shiftKey) runCorridor(dx, dy);
        else handlePlayerAction(dx, dy);
        syncIntegratedDungeonHud();
      } else if (e.key === ' ') {
        e.preventDefault();
        waitTurn();
        syncIntegratedDungeonHud();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleDungeonSkill();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleDungeonTonic();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleDungeonRecall();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        useStairsAtPlayer();
        syncIntegratedDungeonHud();
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleToggleDungeonInventory();
      } else if (e.key === 'Escape' && dungeonInventoryOpen) {
        e.preventDefault();
        handleToggleDungeonInventory(false);
      }
      return;
    }

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

  if (appContext.getActiveContext() === APP_CONTEXTS.DUNGEON) {
    renderDungeonCanvas();
    autoSaveAccumulatorMs += elapsedRealMs;
    if (autoSaveAccumulatorMs >= 5000) {
      autoSaveAccumulatorMs = 0;
      simHost.save();
    }
  } else if (simHost.state.world && simHost.state.campaignPhase !== CAMPAIGN_PHASES.TITLE) {
    appContext.syncFromCampaignPhase();
    simHost.stepClock(elapsedRealMs);

    autoSaveAccumulatorMs += elapsedRealMs;
    if (autoSaveAccumulatorMs >= 5000) {
      autoSaveAccumulatorMs = 0;
      simHost.save();
    }

    if (simHost.state.activeView === WARGAME_VIEWS.OVERWORLD) {
      stepOverworldEdgeScroll(elapsedRealMs / 1000, simHost.state);
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
  handleSetTroopRecruitLevel: handleSetTroopRecruitLevel,
  handleSetTroopRecruitQty: handleSetTroopRecruitQty,
  handleSetTroopUpgradeQty: handleSetTroopUpgradeQty,
  handleTrainTroops: handleTrainTroops,
  handleUpgradeTroops: handleUpgradeTroops,
  handleDisbandTroopsByLevel: handleDisbandTroopsByLevel,
  handleOpenDeployArmyModal: handleOpenDeployArmyModal,
  handleCloseDeployArmyModal: handleCloseDeployArmyModal,
  handleSetDeployFormationType: handleSetDeployFormationType,
  handleSelectDeployHeroParty: handleSelectDeployHeroParty,
  handleStartPickDeployHex: handleStartPickDeployHex,
  handleSetDiscoveryFilter: handleSetDiscoveryFilter,
  handleLocateOverworldHex: handleLocateOverworldHex,
  handleInspectMilitaryTarget: handleInspectMilitaryTarget,
  handleCloseMilitaryTargetInspector: handleCloseMilitaryTargetInspector,
  handleAssignArmyToTarget: handleAssignArmyToTarget,
  handleSetDeployTargetCoord: handleSetDeployTargetCoord,
  handleSetDeployTroopQty: handleSetDeployTroopQty,
  handleToggleDeployStayDeployed: handleToggleDeployStayDeployed,
  handleConfirmDeployArmy: handleConfirmDeployArmy,
  handleSelectOverworldUnit: handleSelectOverworldUnit,
  handleReturnArmyHome: handleReturnArmyHome,
  handleSetArmyReturnPolicy: handleSetArmyReturnPolicy,
  handleCancelTroopTraining: handleCancelTroopTraining,
  handleDisbandTroops: handleDisbandTroops,
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
  handleDungeonMove: handleDungeonMove,
  handleDungeonWait: handleDungeonWait,
  handleDungeonUseStairs: handleDungeonUseStairs,
  handleDungeonSpendStat: handleDungeonSpendStat,
  handleToggleDungeonInventory: handleToggleDungeonInventory,
  handleDungeonEquipItem: handleDungeonEquipItem,
  handleDungeonUnequipItem: handleDungeonUnequipItem,
  handleDungeonAutoEquip: handleDungeonAutoEquip,
  handleDungeonDropItem: handleDungeonDropItem,
  handleDungeonSkill: handleDungeonSkill,
  handleDungeonTonic: handleDungeonTonic,
  handleDungeonRecall: handleDungeonRecall,
  handleDungeonSurfaceExit: handleDungeonSurfaceExit,
  appContext: appContext,
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
  if (wargameBootstrapped) return;
  wargameBootstrapped = true;

  setupWargameListeners();
  appContext.syncFromCampaignPhase();
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
