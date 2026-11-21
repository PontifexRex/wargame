// =============================================================================
// SEPARATE RESEARCH & TRAINING GAME SCREENS (Zero-Tab 2-Step Game UI)
// Implements docs/ui_design_system.md §7:
//   - Dedicated Research Screen (#wgResearchModal): Overview -> Scrollable Node Graph & Detail
//   - Dedicated Training Screen (#wgTrainingModal): Overview -> Scrollable Node Graph & Detail
//   - Online & Offline wall-clock General RP accrual + live ConfigRegistry integration
// =============================================================================

import { ensureProgressionState } from '../../progression/progressionState.js';
import {
  OWNER_TYPES,
  DEFAULT_CURRENCY_DEFINITIONS,
  getCurrencyBalance,
  recordCurrencyTransaction,
  TRANSACTION_TYPES
} from '../../progression/currencyService.js';
import {
  PROTOTYPE_RESEARCH_TREES,
  PROTOTYPE_RESEARCH_ITEMS,
  PROTOTYPE_TRAINING_TREES,
  PROTOTYPE_TRAINING_DEFINITIONS
} from '../../progression/researchCatalog.js';
import { evaluateResearchEligibility } from '../../progression/eligibilityService.js';
import { processPassiveAccrual } from '../../progression/accrualService.js';
import {
  buildOwnerProgressLookup,
  startOrEnqueueResearch,
  pauseResearchItem,
  resumeResearchItem,
  cancelResearchItem,
  advanceResearchProgress,
  REFUND_POLICIES
} from '../../progression/queueService.js';
import {
  SUBJECT_TYPES,
  evaluateTrainingEligibility,
  startOrEnqueueTraining,
  pauseTrainingItem,
  resumeTrainingItem,
  cancelTrainingItem,
  advanceTrainingProgress,
  getSubjectTrainingSummary,
  computeSubjectEffectiveStat
} from '../../progression/trainingService.js';
import { evaluateTreeMilestones, isTreeCompleted } from '../../progression/milestonesAndAnalytics.js';
import { getConfigValue } from '../../progression/configRegistry.js';
import { getPrimaryCity } from '../engine/state.js';
import { getCityAcademyBenefitEffects } from '../data/buildings.js';
import { collectActiveEffects, resolveNumericStat, EFFECT_TYPES } from '../../progression/benefitService.js';
import { getProductionImageSrc } from '../../ui/shared/assetRegistry.js';

function getPlayerId() {
  return 'player_1';
}

function getSimNowMs(simHost) {
  return (simHost && simHost.state && simHost.state.world && simHost.state.world.clock)
    ? (simHost.state.world.clock.simTimeMs || 0)
    : 0;
}

// Floor to tenths (e.g. 12.49 -> "12.4", 0.09 -> "0.0") per UI Design System §7.2
export function formatRpTenths(val) {
  const num = Number(val || 0);
  const floored = Math.floor((num + 1e-9) * 10) / 10;
  return floored.toFixed(1);
}

// Render open/filled pips (e.g. ● ○ ○) for multi-level items
export function renderLevelPipsHtml(currentLevel, maxLevel) {
  const maxL = Math.max(1, Number(maxLevel || 1));
  const curL = Math.max(0, Math.min(maxL, Number(currentLevel || 0)));
  const pips = [];
  for (let i = 1; i <= maxL; i++) {
    const filled = i <= curL;
    pips.push(filled
      ? '<span class="inline-block w-2 h-2 rounded-full bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>'
      : '<span class="inline-block w-2 h-2 rounded-full border border-[#64748b] bg-[#080b11]"></span>');
  }
  return '<span class="inline-flex items-center gap-1" title="Level ' + curL + ' / ' + maxL + '">' + pips.join('') + '</span>';
}

function formatDurationShort(sec) {
  const s = Math.max(0, Math.round(Number(sec || 0)));
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h + 'h ' + m + 'm';
}

function syncCityGoldToLedger(world, prog, nowMs) {
  const city = world ? getPrimaryCity({ world: world }) : null;
  if (!city || !city.stockpile) return;
  const ledgerGold = getCurrencyBalance(prog.currencyLedger, getPlayerId(), OWNER_TYPES.PLAYER, 'gold').available;
  const cityGold = Number(city.stockpile.gold || 0);
  const diff = cityGold - ledgerGold;
  if (diff > 0.0001) {
    recordCurrencyTransaction(prog.currencyLedger, {
      ownerId: getPlayerId(),
      ownerType: OWNER_TYPES.PLAYER,
      currencyId: 'gold',
      amount: diff,
      transactionType: TRANSACTION_TYPES.ADJUSTMENT,
      source: 'city_treasury_sync',
      nowMs: nowMs
    });
  }
}

function computeEffectiveRates(prog, city, pid) {
  const acadEffects = getCityAcademyBenefitEffects(city);
  const activeEffs = collectActiveEffects(prog, { playerId: pid, extraEffects: acadEffects });
  const genAdditive = resolveNumericStat(0, 'rp_general', activeEffs.modifiers, { effectType: EFFECT_TYPES.ACCRUAL_MODIFIER }).finalValue;
  const speedAdditive = resolveNumericStat(0, 'personal', activeEffs.modifiers, { effectType: EFFECT_TYPES.RESEARCH_SPEED_MODIFIER }).finalValue;
  const trainSpeedAdditive = resolveNumericStat(0, 'hero', activeEffs.modifiers, { effectType: EFFECT_TYPES.TRAINING_SPEED_MODIFIER }).finalValue;

  const baseGenRate = getConfigValue(prog, 'passive_rp_general_per_sec');
  const effectiveGenRate = Math.round((baseGenRate * (1 + genAdditive)) * 10000000) / 10000000;
  const baseAdvAction = getConfigValue(prog, 'activity_rp_dungeon_move');
  const baseWarKill = getConfigValue(prog, 'activity_rp_monster_defeat');
  const baseWarAction = getConfigValue(prog, 'activity_rp_warrior_action');
  const globalResMult = getConfigValue(prog, 'global_research_speed_mult');
  const globalTrainMult = getConfigValue(prog, 'global_training_speed_mult');

  return {
    baseGenRate: baseGenRate,
    genAdditive: genAdditive,
    effectiveGenRate: effectiveGenRate,
    baseAdvAction: baseAdvAction,
    baseWarKill: baseWarKill,
    baseWarAction: baseWarAction,
    researchSpeedBonus: ((1 + speedAdditive) * globalResMult) - 1,
    trainingSpeedBonus: ((1 + trainSpeedAdditive) * globalTrainMult) - 1
  };
}

// Online & Offline General RP accrual + Queue Advancement
export function tickWorldProgression(simHost, explicitWallNowMs) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const simNowMs = getSimNowMs(simHost);
  const wallNowMs = typeof explicitWallNowMs === 'number' ? explicitWallNowMs : Date.now();
  const pid = getPlayerId();
  const city = getPrimaryCity(simHost.state);
  const rates = computeEffectiveRates(prog, city, pid);

  // Wall-clock elapsed ms handles BOTH online real-time ticks AND offline browser-closed accrual!
  if (typeof prog.lastWallClockAtMs !== 'number') prog.lastWallClockAtMs = wallNowMs;
  const wallDeltaMs = Math.max(0, wallNowMs - prog.lastWallClockAtMs);
  if (wallDeltaMs >= 1000) {
    const prevAccrual = typeof prog.lastAccrualAtMs === 'number' ? prog.lastAccrualAtMs : 0;
    processPassiveAccrual(prog, pid, prevAccrual + wallDeltaMs, {
      baseRatePerSec: rates.baseGenRate,
      generationModifiers: { additiveBonus: rates.genAdditive }
    });
    prog.lastWallClockAtMs = wallNowMs;
  }

  advanceResearchProgress(prog, simNowMs, { speedBonus: rates.researchSpeedBonus });
  advanceTrainingProgress(prog, simNowMs, { speedBonus: rates.trainingSpeedBonus });
  evaluateTreeMilestones(prog, pid, { nowMs: simNowMs, worldId: world.meta ? world.meta.worldName : 'aethelgard_prime' });
}

// Compute tree completion percentage (0..100)
function computeResearchTreePct(tree, lookup) {
  const ids = Array.isArray(tree.itemIds) ? tree.itemIds : [];
  if (ids.length === 0) return 0;
  let totalMax = 0;
  let totalCur = 0;
  for (let i = 0; i < ids.length; i++) {
    const def = PROTOTYPE_RESEARCH_ITEMS[ids[i]];
    if (!def) continue;
    totalMax += (def.levelLimit || 1);
    const inst = lookup[ids[i]];
    totalCur += inst ? Math.min(def.levelLimit || 1, inst.currentLevel || 0) : 0;
  }
  return totalMax > 0 ? Math.floor((totalCur / totalMax) * 100) : 0;
}

function computeTrainingTreePct(tree, heroSummary) {
  const ids = Array.isArray(tree.trainingIds) ? tree.trainingIds : [];
  if (ids.length === 0) return 0;
  let totalMax = 0;
  let totalCur = 0;
  for (let i = 0; i < ids.length; i++) {
    const def = PROTOTYPE_TRAINING_DEFINITIONS[ids[i]];
    if (!def) continue;
    const maxL = Array.isArray(def.levels) ? def.levels.length : 1;
    totalMax += maxL;
    const rec = heroSummary.find(function(s) { return s.trainingDefinitionId === ids[i]; });
    totalCur += rec ? Math.min(maxL, rec.currentLevel || 0) : 0;
  }
  return totalMax > 0 ? Math.floor((totalCur / totalMax) * 100) : 0;
}

// Format a cost row as "Gold 7000/500" in green if affordable, red if unaffordable
export function buildCostComparisonRowHtml(cost, prog, city, pid) {
  let label = '';
  let owned = 0;
  const need = Number(cost.amount || 0);

  if (cost.kind === 'stockpile') {
    label = String(cost.resourceId || '').toUpperCase();
    owned = city && city.stockpile ? Number(city.stockpile[cost.resourceId] || 0) : 0;
  } else {
    const cDef = DEFAULT_CURRENCY_DEFINITIONS[cost.currencyId];
    label = cDef ? cDef.name : cost.currencyId;
    if (cost.currencyId === 'gold' && city && city.stockpile) {
      owned = Math.max(
        Number(city.stockpile.gold || 0),
        getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, 'gold').available
      );
    } else {
      owned = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, cost.currencyId).available;
    }
  }

  const affordable = owned + 1e-9 >= need;
  const isRp = cost.kind !== 'stockpile' && cost.currencyId !== 'gold';
  const ownedText = isRp ? formatRpTenths(owned) : String(Math.floor(owned));
  const needText = isRp ? String(need) : String(Math.floor(need));
  const colorCls = affordable ? 'text-[#34d399]' : 'text-[#f87171]';
  const icon = affordable ? '✓' : '✕';

  return `<div class="flex items-center justify-between text-xs font-mono ${colorCls}"><span>${icon} ${label}</span><strong>${ownedText}/${needText}</strong></div>`;
}

// Build a scrollable 2D Node-and-Edge Graph (scales cleanly to 8-12+ or 30+ nodes!)
function buildScrollableNodeGraphHtml(nodes, selectedId, onClickHandlerName) {
  const COL_W = 210;
  const ROW_H = 104;
  const NODE_W = 166;
  const NODE_H = 74;
  const PAD_X = 24;
  const PAD_Y = 24;

  let maxCol = 0;
  let maxRow = 0;
  const posById = {};

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const col = (n.nodePos && typeof n.nodePos.col === 'number') ? n.nodePos.col : i;
    const row = (n.nodePos && typeof n.nodePos.row === 'number') ? n.nodePos.row : 0;
    if (col > maxCol) maxCol = col;
    if (row > maxRow) maxRow = row;
    posById[n.id] = {
      x: PAD_X + col * COL_W,
      y: PAD_Y + row * ROW_H
    };
  }

  const canvasW = Math.max(640, PAD_X * 2 + (maxCol + 1) * COL_W);
  const canvasH = Math.max(240, PAD_Y * 2 + (maxRow + 1) * ROW_H);

  // SVG Edges connecting prerequisite parents -> children
  const edgeLines = [];
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i];
    const parents = Array.isArray(child.parentIds) ? child.parentIds : [];
    const cPos = posById[child.id];
    for (let p = 0; p < parents.length; p++) {
      const pPos = posById[parents[p]];
      if (!pPos || !cPos) continue;
      const x1 = pPos.x + NODE_W;
      const y1 = pPos.y + Math.floor(NODE_H / 2);
      const x2 = cPos.x;
      const y2 = cPos.y + Math.floor(NODE_H / 2);
      const midX = Math.floor((x1 + x2) / 2);
      const isLit = child.isUnlockedOrDone;
      const stroke = isLit ? '#fbbf24' : '#334155';
      const strokeW = isLit ? '2.5' : '1.75';
      edgeLines.push(`<path d="M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${strokeW}" stroke-opacity="${isLit ? '0.9' : '0.65'}" />`);
    }
  }

  const nodeCards = nodes.map(function(n) {
    const pos = posById[n.id];
    const isSel = n.id === selectedId;
    let borderCls = 'border-[#334155] bg-[#0f1520]';
    if (n.isActive) {
      borderCls = 'border-[#fbbf24] bg-[#1a1625] shadow-[0_0_16px_rgba(251,191,36,0.45)]';
    } else if (n.isMaxed) {
      borderCls = 'border-[#34d399]/70 bg-[#0d1f1c]';
    } else if (n.canStart) {
      borderCls = 'border-[#38bdf8]/60 bg-[#101a2a]';
    } else {
      borderCls = 'border-[#1e293b] bg-[#090d14] opacity-75';
    }
    if (isSel) {
      borderCls += ' ring-2 ring-[#fbbf24]';
    }

    const activeSparkle = n.isActive
      ? '<span class="text-[10px] text-[#fbbf24] animate-pulse" title="In Progress">✨</span>'
      : '';

    return `
      <button onclick="window.WargameApp.${onClickHandlerName}('${n.id}')" style="left:${pos.x}px; top:${pos.y}px; width:${NODE_W}px; height:${NODE_H}px;" class="absolute p-2 rounded-lg border ${borderCls} text-left flex flex-col justify-between cursor-pointer transition hover:brightness-110">
        <div class="flex items-center justify-between gap-1">
          ${renderLevelPipsHtml(n.currentLevel, n.maxLevel)}
          <span class="text-[9px] font-mono text-[#94a3b8]">${activeSparkle} Lv ${n.currentLevel}/${n.maxLevel}</span>
        </div>
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-base leading-none shrink-0">${n.icon || '📘'}</span>
          <span class="text-[11px] font-bold text-[#e6edf3] leading-tight line-clamp-2">${n.name}</span>
        </div>
      </button>
    `;
  }).join('');

  return `
    <div class="w-full overflow-auto rounded-lg bg-[#05080f] border border-[#1e293b] max-h-[340px]">
      <div class="relative" style="width:${canvasW}px; height:${canvasH}px;">
        <svg class="absolute inset-0 pointer-events-none" width="${canvasW}" height="${canvasH}">
          ${edgeLines.join('')}
        </svg>
        ${nodeCards}
      </div>
    </div>
  `;
}

// =============================================================================
// 1. DEDICATED RESEARCH SCREEN (#wgResearchModal) — ZERO TABS (Overview -> Tree)
// =============================================================================
export function renderResearchModal(simHost) {
  const modal = document.getElementById('wgResearchModal');
  if (!modal) return;
  const state = simHost ? simHost.state : null;
  if (!state || !state.world || !state._researchModalOpen) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  tickWorldProgression(simHost);

  const bodyEl = document.getElementById('wgResearchBody');
  if (!bodyEl) return;

  const world = state.world;
  const prog = ensureProgressionState(world);
  const simNowMs = getSimNowMs(simHost);
  const pid = getPlayerId();
  const city = getPrimaryCity(state);
  syncCityGoldToLedger(world, prog, simNowMs);

  const rates = computeEffectiveRates(prog, city, pid);
  const lookup = buildOwnerProgressLookup(prog, OWNER_TYPES.PLAYER, pid);
  const bannerSrc = getProductionImageSrc('city_interior_mages_guild_default_static');
  const selectedTreeId = state._researchSelectedTreeId || null;

  // Shared Atmospheric Library/Laboratory Header (no duplicate RP/Gold subtitle!)
  const headerHtml = `
    <div class="relative h-32 sm:h-36 w-full overflow-hidden border-b border-[#fbbf24]/40 bg-[#080b11] shrink-0">
      ${bannerSrc ? `<img src="${bannerSrc}" alt="Arcane Library & Laboratory" class="absolute inset-0 w-full h-full object-cover object-center" />` : ''}
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b11]/55 via-[#080b11]/25 to-[#080b11]/95"></div>
      <div class="relative z-10 h-full px-4 py-3 flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            ${selectedTreeId ? `<button onclick="window.WargameApp.handleBackToResearchOverview()" class="px-2.5 py-1 rounded-lg bg-[#080b11]/80 hover:bg-[#fbbf24] hover:text-[#080b11] border border-[#fbbf24]/50 text-[#fbbf24] text-xs font-mono font-bold cursor-pointer transition">← Overview</button>` : ''}
            <div class="px-3 py-1 rounded-lg bg-[#080b11]/75 backdrop-blur-md border border-[#fbbf24]/40">
              <h2 class="font-display text-sm sm:text-base font-bold text-[#fbbf24]">📚 ${selectedTreeId && PROTOTYPE_RESEARCH_TREES[selectedTreeId] ? PROTOTYPE_RESEARCH_TREES[selectedTreeId].name : 'Grand Archive of Research'}</h2>
            </div>
          </div>
          <button id="wgResearchCloseBtn" onclick="window.WargameApp.handleCloseResearchHub()" class="px-3 py-1 rounded-lg bg-[#080b11]/80 hover:bg-[#283347] border border-[#334155] text-xs font-mono font-bold text-[#e6edf3] cursor-pointer">✕ Close</button>
        </div>
        <div class="text-[11px] text-[#cbd5e1] drop-shadow">
          ${selectedTreeId && PROTOTYPE_RESEARCH_TREES[selectedTreeId]
            ? PROTOTYPE_RESEARCH_TREES[selectedTreeId].shortDescription
            : 'Select an active Research Tree to chart connected doctrines and unlock new capabilities.'}
        </div>
      </div>
    </div>
  `;

  // VIEW 1: RESEARCH OVERVIEW (RP List + Inline Active Queue + Active Trees Grid)
  if (!selectedTreeId || !PROTOTYPE_RESEARCH_TREES[selectedTreeId]) {
    // Relevant RP currencies list only (no Gold!), rounded down to tenths, showing effective rate after modifiers
    const rpDefs = Object.values(DEFAULT_CURRENCY_DEFINITIONS).filter(function(c) {
      return c.enabled !== false && (
        c.category === 'personal_research' ||
        c.category === 'guild_research' ||
        c.category === 'alliance_research'
      );
    });

    const rpListHtml = rpDefs.map(function(cDef) {
      const bal = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, cDef.currencyId).available;
      let rateLabel = 'Guild / Alliance activity';
      let tooltip = cDef.description || cDef.name;

      if (cDef.currencyId === 'rp_general') {
        rateLabel = '+' + rates.effectiveGenRate.toFixed(5) + '/sec';
        tooltip = 'Base ' + rates.baseGenRate.toFixed(5) + '/sec • Modifiers: +' + Math.round(rates.genAdditive * 100) + '% (Accrues online & offline)';
      } else if (cDef.currencyId === 'rp_adventurer') {
        rateLabel = '+' + rates.baseAdvAction.toFixed(4) + '/action';
        tooltip = 'Earned from dungeon exploration, chests, discoveries, and quests.';
      } else if (cDef.currencyId === 'rp_warrior') {
        rateLabel = '+' + rates.baseWarKill.toFixed(4) + '/kill';
        tooltip = 'Earned from killing monsters with any class (+' + rates.baseWarKill.toFixed(4) + ') or any qualifying action by a Warrior class (+' + rates.baseWarAction.toFixed(4) + ').';
      }

      return `
        <div title="${tooltip}" class="px-2.5 py-1.5 rounded bg-[#0a0f18] border border-[#1e293b] flex items-center justify-between gap-2 text-xs font-mono">
          <span class="text-[#e6edf3] truncate">${cDef.icon || '📘'} ${cDef.name.replace(' Research Points', ' RP')}</span>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[10px] text-[#34d399]">${rateLabel}</span>
            <strong class="text-[#fbbf24]">${formatRpTenths(bal)}</strong>
          </div>
        </div>
      `;
    }).join('');

    // Inline Active Research Queue
    const rq = prog.researchQueue;
    const activeQHtml = rq.activeItems.length > 0
      ? rq.activeItems.map(function(e) {
          const itemDef = PROTOTYPE_RESEARCH_ITEMS[e.researchItemId];
          const pct = Math.min(100, Math.round((e.elapsedMs / Math.max(1, e.effectiveDurationMs)) * 100));
          const remSec = Math.max(0, Math.ceil((e.effectiveDurationMs - e.elapsedMs) / 1000));
          const toggleBtn = e.status === 'paused'
            ? `<button onclick="window.WargameApp.handleResumeResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] text-[10px] font-mono cursor-pointer">▶ Resume</button>`
            : `<button onclick="window.WargameApp.handlePauseResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] text-[10px] font-mono cursor-pointer">⏸ Pause</button>`;
          return `
            <div class="p-2.5 rounded-lg bg-[#0a0f18] border border-[#fbbf24]/50 space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="font-bold text-[#fbbf24]">✨ ${itemDef ? itemDef.name : e.researchItemId} <span class="text-[10px] font-mono text-[#94a3b8]">Lv ${e.targetLevel}</span></span>
                <div class="flex items-center gap-1.5 font-mono">
                  <span class="text-[11px] text-[#38bdf8]">${e.status === 'paused' ? 'PAUSED' : formatDurationShort(remSec)}</span>
                  ${toggleBtn}
                  <button onclick="window.WargameApp.handleCancelResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-red-950/60 text-red-300 text-[10px] cursor-pointer">✕</button>
                </div>
              </div>
              <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden"><div class="h-full bg-[#fbbf24]" style="width:${pct}%"></div></div>
            </div>
          `;
        }).join('')
      : `<div class="text-xs text-[#64748b] italic py-1">Research queue is idle. Select any active Research Tree below to begin.</div>`;

    const pendingText = rq.pendingItems.length > 0
      ? `<div class="text-[10px] font-mono text-[#94a3b8] pt-1">Queued next: ${rq.pendingItems.map(function(p) { return p.researchItemId + ' (Lv ' + p.targetLevel + ')'; }).join(', ')}</div>`
      : '';

    // Active (non-completed) Research Trees Grid (Bulk of the page!)
    const activeTrees = Object.values(PROTOTYPE_RESEARCH_TREES).filter(function(tr) {
      const pct = computeResearchTreePct(tr, lookup);
      return pct < 100 && !isTreeCompleted(prog, tr.treeId, pid);
    });

    const treesGridHtml = activeTrees.length > 0
      ? activeTrees.map(function(tr) {
          const pct = computeResearchTreePct(tr, lookup);
          const hasActiveInTree = rq.activeItems.some(function(a) {
            return (tr.itemIds || []).indexOf(a.researchItemId) !== -1;
          });
          const cardCls = hasActiveInTree
            ? 'border-[#fbbf24] bg-gradient-to-b from-[#1d1829] to-[#0d111a] shadow-[0_0_20px_rgba(251,191,36,0.3)]'
            : 'border-[#283347] hover:border-[#fbbf24]/60 bg-[#0f1520] hover:bg-[#161e2e]';

          return `
            <button onclick="window.WargameApp.handleSelectResearchTree('${tr.treeId}')" class="p-4 rounded-xl border ${cardCls} text-center flex flex-col items-center justify-between gap-2.5 cursor-pointer transition group">
              <div class="relative">
                <div class="w-14 h-14 rounded-2xl bg-[#080b11] border ${hasActiveInTree ? 'border-[#fbbf24]' : 'border-[#334155]'} flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
                  ${tr.icon || '📘'}
                </div>
                ${hasActiveInTree ? '<span class="absolute -top-1.5 -right-2 text-sm animate-pulse" title="Active Research in Progress">✨</span>' : ''}
              </div>
              <div class="space-y-0.5">
                <div class="font-display text-xs sm:text-sm font-bold text-[#e6edf3]">${tr.name}</div>
                <div class="text-[10px] font-mono ${hasActiveInTree ? 'text-[#fbbf24]' : 'text-[#94a3b8]'}">${pct}% Complete</div>
              </div>
              <div class="w-full h-1.5 bg-[#080b11] rounded-full overflow-hidden">
                <div class="h-full ${hasActiveInTree ? 'bg-[#fbbf24]' : 'bg-[#38bdf8]'}" style="width:${pct}%"></div>
              </div>
            </button>
          `;
        }).join('')
      : `<div class="col-span-full p-6 text-center text-xs text-[#34d399]">All available Research Trees are 100% mastered!</div>`;

    bodyEl.innerHTML = `
      ${headerHtml}
      <div class="p-4 space-y-4 overflow-y-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div class="lg:col-span-4 space-y-3">
            <div class="space-y-1.5">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] font-bold">Research Points</div>
              <div class="space-y-1">${rpListHtml}</div>
            </div>
            <div class="space-y-1.5">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#fbbf24] font-bold">Active Research Queue (${rq.activeItems.length}/${rq.capacity})</div>
              ${activeQHtml}
              ${pendingText}
            </div>
          </div>
          <div class="lg:col-span-8 space-y-2">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#fbbf24] font-bold">Active Research Trees</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${treesGridHtml}</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // VIEW 2: TREE NODE GRAPH & SELECTED ITEM DETAIL
  const tree = PROTOTYPE_RESEARCH_TREES[selectedTreeId];
  const itemIds = Array.isArray(tree.itemIds) ? tree.itemIds : [];
  let selItemId = state._researchSelectedItemId;
  if (!selItemId || itemIds.indexOf(selItemId) === -1) {
    selItemId = itemIds[0] || null;
    state._researchSelectedItemId = selItemId;
  }

  const graphNodes = itemIds.map(function(id, idx) {
    const def = PROTOTYPE_RESEARCH_ITEMS[id];
    const inst = lookup[id];
    const curLv = inst ? (inst.currentLevel || 0) : 0;
    const maxLv = def.levelLimit || 1;
    const isActive = prog.researchQueue.activeItems.some(function(a) { return a.researchItemId === id; });
    const nextLv = curLv + 1;
    const elig = curLv < maxLv
      ? evaluateResearchEligibility(def, nextLv, {
          ownerId: pid,
          ownerType: OWNER_TYPES.PLAYER,
          ledger: prog.currencyLedger,
          researchProgress: lookup,
          city: city,
          heroLevel: (world.heroes && world.heroes[0]) ? (world.heroes[0].level || 1) : 1,
          alignment: prog.alignment,
          discoveries: prog.discoveries
        })
      : { canStart: false };
    return {
      id: id,
      name: def.name,
      icon: def.icon,
      nodePos: def.nodePos || { col: idx % 4, row: Math.floor(idx / 4) },
      parentIds: Array.isArray(def.parentIds) ? def.parentIds : [],
      currentLevel: curLv,
      maxLevel: maxLv,
      isActive: isActive,
      isMaxed: curLv >= maxLv,
      canStart: elig.canStart,
      isUnlockedOrDone: curLv > 0 || isActive || elig.canStart
    };
  });

  const graphHtml = buildScrollableNodeGraphHtml(graphNodes, selItemId, 'handleSelectResearchNode');

  // Docked Detail Panel for Selected Research Item
  const selItem = PROTOTYPE_RESEARCH_ITEMS[selItemId];
  const selInst = lookup[selItemId];
  const curLv = selInst ? (selInst.currentLevel || 0) : 0;
  const nextLv = curLv + 1;
  const lvlDef = selItem && Array.isArray(selItem.levelDefinitions)
    ? selItem.levelDefinitions.find(function(l) { return l.level === nextLv; })
    : null;

  const elig = (selItem && lvlDef)
    ? evaluateResearchEligibility(selItem, nextLv, {
        ownerId: pid,
        ownerType: OWNER_TYPES.PLAYER,
        ledger: prog.currencyLedger,
        researchProgress: lookup,
        city: city,
        heroLevel: (world.heroes && world.heroes[0]) ? (world.heroes[0].level || 1) : 1,
        alignment: prog.alignment,
        discoveries: prog.discoveries
      })
    : { canStart: false, unmetConditions: [] };

  const costRowsHtml = lvlDef && Array.isArray(lvlDef.costs)
    ? lvlDef.costs.map(function(c) { return buildCostComparisonRowHtml(c, prog, city, pid); }).join('')
    : '<div class="text-xs text-[#34d399] font-mono">✓ Maximum Level Mastered</div>';

  const unmetHtml = (elig.unmetConditions && elig.unmetConditions.length > 0)
    ? `<div class="p-2 rounded bg-red-950/40 border border-red-500/40 text-[11px] text-[#f87171] space-y-0.5">${elig.unmetConditions.map(function(u) { return '<div>✕ ' + (u.reason || u.type) + '</div>'; }).join('')}</div>`
    : (lvlDef ? '<div class="text-[11px] text-[#34d399] font-mono">✓ Prerequisites Met</div>' : '');

  const benefitsHtml = lvlDef && Array.isArray(lvlDef.benefits)
    ? lvlDef.benefits.map(function(b) {
        return '<div class="text-[11px] text-[#cbd5e1] font-mono">• ' + b.effectType.replace(/_/g, ' ') + ': <span class="text-[#fbbf24]">' + b.target + ' (' + b.value + ')</span></div>';
      }).join('')
    : '';

  bodyEl.innerHTML = `
    ${headerHtml}
    <div class="p-4 space-y-3 overflow-y-auto">
      ${graphHtml}
      ${selItem ? `
        <div class="p-3.5 rounded-xl bg-[#0f1520] border border-[#fbbf24]/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div class="md:col-span-7 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">${selItem.icon || '📘'}</span>
              <div>
                <div class="font-display text-sm font-bold text-[#fbbf24]">${selItem.name}</div>
                <div class="flex items-center gap-2 text-[10px] font-mono text-[#94a3b8]">
                  ${renderLevelPipsHtml(curLv, selItem.levelLimit)}
                  <span>Level ${curLv} / ${selItem.levelLimit}</span>
                  ${lvlDef ? '<span>• ⏱ ' + formatDurationShort(lvlDef.durationSec) + '</span>' : ''}
                </div>
              </div>
            </div>
            <p class="text-xs text-[#e6edf3]">${selItem.description}</p>
            ${benefitsHtml}
            ${unmetHtml}
          </div>
          <div class="md:col-span-5 p-3 rounded-lg bg-[#080b11] border border-[#1e293b] space-y-2">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] font-bold">Required Resources (Have / Need)</div>
            <div class="space-y-1">${costRowsHtml}</div>
            <button onclick="window.WargameApp.handleStartResearch('${selItem.researchItemId}')" ${!lvlDef ? 'disabled' : ''} class="w-full py-2 rounded-lg font-bold text-xs uppercase ${lvlDef ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
              ${lvlDef ? ('Start Research (Lv ' + nextLv + ')') : '✓ Mastered'}
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// =============================================================================
// 2. DEDICATED TRAINING SCREEN (#wgTrainingModal) — ZERO TABS (Overview -> Tree)
// =============================================================================
export function renderTrainingModal(simHost) {
  const modal = document.getElementById('wgTrainingModal');
  if (!modal) return;
  const state = simHost ? simHost.state : null;
  if (!state || !state.world || !state._trainingModalOpen) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  tickWorldProgression(simHost);

  const bodyEl = document.getElementById('wgTrainingBody');
  if (!bodyEl) return;

  const world = state.world;
  const prog = ensureProgressionState(world);
  const simNowMs = getSimNowMs(simHost);
  const pid = getPlayerId();
  const city = getPrimaryCity(state);
  syncCityGoldToLedger(world, prog, simNowMs);

  const heroes = Array.isArray(world.heroes) ? world.heroes : [];
  let selHeroId = state._trainingSelectedHeroId || (heroes[0] ? heroes[0].id : null);
  if (selHeroId && !heroes.some(function(h) { return h.id === selHeroId; })) {
    selHeroId = heroes[0] ? heroes[0].id : null;
  }
  const selHero = heroes.find(function(h) { return h.id === selHeroId; }) || null;
  const selectedTreeId = state._trainingSelectedTreeId || null;
  const bannerSrc = getProductionImageSrc('city_interior_fighters_guild_default_static');

  const headerHtml = `
    <div class="relative h-32 sm:h-36 w-full overflow-hidden border-b border-[#34d399]/40 bg-[#080b11] shrink-0">
      ${bannerSrc ? `<img src="${bannerSrc}" alt="Arms Training Yard" class="absolute inset-0 w-full h-full object-cover object-center" />` : ''}
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b11]/55 via-[#080b11]/25 to-[#080b11]/95"></div>
      <div class="relative z-10 h-full px-4 py-3 flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            ${selectedTreeId ? `<button onclick="window.WargameApp.handleBackToTrainingOverview()" class="px-2.5 py-1 rounded-lg bg-[#080b11]/80 hover:bg-[#34d399] hover:text-[#080b11] border border-[#34d399]/50 text-[#34d399] text-xs font-mono font-bold cursor-pointer transition">← Overview</button>` : ''}
            <div class="px-3 py-1 rounded-lg bg-[#080b11]/75 backdrop-blur-md border border-[#34d399]/40">
              <h2 class="font-display text-sm sm:text-base font-bold text-[#34d399]">🎯 ${selectedTreeId && PROTOTYPE_TRAINING_TREES[selectedTreeId] ? PROTOTYPE_TRAINING_TREES[selectedTreeId].name : 'Hero Training Grounds'}</h2>
            </div>
          </div>
          <button id="wgTrainingCloseBtn" onclick="window.WargameApp.handleCloseTrainingHub()" class="px-3 py-1 rounded-lg bg-[#080b11]/80 hover:bg-[#283347] border border-[#334155] text-xs font-mono font-bold text-[#e6edf3] cursor-pointer">✕ Close</button>
        </div>
        <div class="text-[11px] text-[#cbd5e1] drop-shadow">
          ${selectedTreeId && PROTOTYPE_TRAINING_TREES[selectedTreeId]
            ? PROTOTYPE_TRAINING_TREES[selectedTreeId].shortDescription
            : 'Train individual Heroes in unlocked martial and delving disciplines on a dedicated Training Queue.'}
        </div>
      </div>
    </div>
  `;

  if (!selHero) {
    bodyEl.innerHTML = `
      ${headerHtml}
      <div class="p-6 text-center text-xs text-[#94a3b8]">
        Recruit at least one Hero at a City Guild Hall before using the Hero Training Grounds.
      </div>
    `;
    return;
  }

  const effAtk = computeSubjectEffectiveStat(prog, SUBJECT_TYPES.HERO, selHero.id, selHero.stats ? selHero.stats.atk : 10, 'atk', { playerId: pid }).finalValue;
  const effDef = computeSubjectEffectiveStat(prog, SUBJECT_TYPES.HERO, selHero.id, selHero.stats ? selHero.stats.def : 5, 'def', { playerId: pid }).finalValue;
  const effHp = computeSubjectEffectiveStat(prog, SUBJECT_TYPES.HERO, selHero.id, selHero.stats ? selHero.stats.maxHp : 100, 'maxHp', { playerId: pid }).finalValue;
  const heroSummary = getSubjectTrainingSummary(prog, SUBJECT_TYPES.HERO, selHero.id);

  const heroBarHtml = `
    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0a0f18] border border-[#1e293b]">
      <div class="flex flex-wrap items-center gap-1.5">
        ${heroes.map(function(h) {
          const isSel = h.id === selHero.id;
          return `<button onclick="window.WargameApp.handleSelectTrainingHero('${h.id}')" class="px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${isSel ? 'bg-[#34d399] text-[#080b11] font-bold' : 'bg-[#111722] text-[#cbd5e1] border border-[#283347]'}">${h.icon || '⚔️'} ${h.name}</button>`;
        }).join('')}
      </div>
      <div class="text-xs font-mono text-[#34d399]">
        ATK <strong>${effAtk}</strong> • DEF <strong>${effDef}</strong> • HP <strong>${effHp}</strong>
      </div>
    </div>
  `;

  // VIEW 1: TRAINING OVERVIEW
  if (!selectedTreeId || !PROTOTYPE_TRAINING_TREES[selectedTreeId]) {
    const tq = prog.trainingQueue;
    const activeTHtml = tq.activeItems.length > 0
      ? tq.activeItems.map(function(e) {
          const def = PROTOTYPE_TRAINING_DEFINITIONS[e.trainingDefinitionId];
          const pct = Math.min(100, Math.round((e.elapsedMs / Math.max(1, e.effectiveDurationMs)) * 100));
          const remSec = Math.max(0, Math.ceil((e.effectiveDurationMs - e.elapsedMs) / 1000));
          return `
            <div class="p-2.5 rounded-lg bg-[#0a0f18] border border-[#34d399]/50 space-y-1.5">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-bold text-[#34d399]">✨ ${def ? def.name : e.trainingDefinitionId} (${e.subjectId} • Lv ${e.targetLevel})</span>
                <div class="flex items-center gap-1.5 font-mono">
                  <span class="text-[11px] text-[#fbbf24]">${formatDurationShort(remSec)}</span>
                  <button onclick="window.WargameApp.handleCancelHeroTraining('${e.subjectId}', '${e.trainingDefinitionId}')" class="px-2 py-0.5 rounded bg-red-950/60 text-red-300 text-[10px] cursor-pointer">✕</button>
                </div>
              </div>
              <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden"><div class="h-full bg-[#34d399]" style="width:${pct}%"></div></div>
            </div>
          `;
        }).join('')
      : `<div class="text-xs text-[#64748b] italic py-1">Training queue is idle. Select a discipline below to drill ${selHero.name}.</div>`;

    const trTrees = Object.values(PROTOTYPE_TRAINING_TREES).filter(function(tr) {
      return computeTrainingTreePct(tr, heroSummary) < 100;
    });

    const trGridHtml = trTrees.map(function(tr) {
      const pct = computeTrainingTreePct(tr, heroSummary);
      const hasActive = tq.activeItems.some(function(a) {
        return a.subjectId === selHero.id && (tr.trainingIds || []).indexOf(a.trainingDefinitionId) !== -1;
      });
      const cardCls = hasActive
        ? 'border-[#34d399] bg-gradient-to-b from-[#11241f] to-[#0a0f18] shadow-[0_0_20px_rgba(52,211,153,0.3)]'
        : 'border-[#283347] hover:border-[#34d399]/60 bg-[#0f1520] hover:bg-[#161e2e]';

      return `
        <button onclick="window.WargameApp.handleSelectTrainingTree('${tr.treeId}')" class="p-4 rounded-xl border ${cardCls} text-center flex flex-col items-center justify-between gap-2.5 cursor-pointer transition group">
          <div class="relative">
            <div class="w-14 h-14 rounded-2xl bg-[#080b11] border ${hasActive ? 'border-[#34d399]' : 'border-[#334155]'} flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
              ${tr.icon || '🎯'}
            </div>
            ${hasActive ? '<span class="absolute -top-1.5 -right-2 text-sm animate-pulse">✨</span>' : ''}
          </div>
          <div class="space-y-0.5">
            <div class="font-display text-xs sm:text-sm font-bold text-[#e6edf3]">${tr.name}</div>
            <div class="text-[10px] font-mono ${hasActive ? 'text-[#34d399]' : 'text-[#94a3b8]'}">${pct}% Complete</div>
          </div>
          <div class="w-full h-1.5 bg-[#080b11] rounded-full overflow-hidden">
            <div class="h-full bg-[#34d399]" style="width:${pct}%"></div>
          </div>
        </button>
      `;
    }).join('');

    bodyEl.innerHTML = `
      ${headerHtml}
      <div class="p-4 space-y-4 overflow-y-auto">
        ${heroBarHtml}
        <div class="space-y-1.5">
          <div class="text-[10px] font-mono uppercase tracking-wider text-[#34d399] font-bold">Active Hero Training Queue (${tq.activeItems.length}/${tq.capacity})</div>
          ${activeTHtml}
        </div>
        <div class="space-y-2">
          <div class="text-[10px] font-mono uppercase tracking-wider text-[#34d399] font-bold">Active Training Disciplines for ${selHero.name}</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">${trGridHtml}</div>
        </div>
      </div>
    `;
    return;
  }

  // VIEW 2: TRAINING NODE GRAPH & DETAIL
  const trTree = PROTOTYPE_TRAINING_TREES[selectedTreeId];
  const tIds = Array.isArray(trTree.trainingIds) ? trTree.trainingIds : [];
  let selTrainId = state._trainingSelectedItemId;
  if (!selTrainId || tIds.indexOf(selTrainId) === -1) {
    selTrainId = tIds[0] || null;
    state._trainingSelectedItemId = selTrainId;
  }

  const graphNodes = tIds.map(function(id, idx) {
    const def = PROTOTYPE_TRAINING_DEFINITIONS[id];
    const rec = heroSummary.find(function(s) { return s.trainingDefinitionId === id; });
    const curLv = rec ? rec.currentLevel : 0;
    const maxLv = Array.isArray(def.levels) ? def.levels.length : 1;
    const isActive = prog.trainingQueue.activeItems.some(function(a) {
      return a.subjectId === selHero.id && a.trainingDefinitionId === id;
    });
    const elig = evaluateTrainingEligibility(prog, { ownerId: pid, subjectType: SUBJECT_TYPES.HERO, subjectId: selHero.id, trainingDefinitionId: id });
    return {
      id: id,
      name: def.name,
      icon: def.icon || '🎯',
      nodePos: def.nodePos || { col: idx, row: 0 },
      parentIds: Array.isArray(def.parentIds) ? def.parentIds : [],
      currentLevel: curLv,
      maxLevel: maxLv,
      isActive: isActive,
      isMaxed: curLv >= maxLv,
      canStart: elig.canStart,
      isUnlockedOrDone: curLv > 0 || isActive || elig.canStart
    };
  });

  const graphHtml = buildScrollableNodeGraphHtml(graphNodes, selTrainId, 'handleSelectTrainingNode');
  const selDef = PROTOTYPE_TRAINING_DEFINITIONS[selTrainId];
  const selRec = heroSummary.find(function(s) { return s.trainingDefinitionId === selTrainId; });
  const curLv = selRec ? selRec.currentLevel : 0;
  const maxLv = selDef && Array.isArray(selDef.levels) ? selDef.levels.length : 1;
  const nextLv = curLv + 1;
  const lvlDef = selDef && Array.isArray(selDef.levels)
    ? selDef.levels.find(function(l) { return l.level === nextLv; })
    : null;
  const elig = selDef
    ? evaluateTrainingEligibility(prog, { ownerId: pid, subjectType: SUBJECT_TYPES.HERO, subjectId: selHero.id, trainingDefinitionId: selTrainId })
    : { canStart: false, unmetConditions: [] };

  const costRowsHtml = lvlDef && Array.isArray(lvlDef.costs)
    ? lvlDef.costs.map(function(c) { return buildCostComparisonRowHtml(c, prog, city, pid); }).join('')
    : '<div class="text-xs text-[#34d399] font-mono">✓ Maximum Training Rank Reached</div>';

  const unmetHtml = (elig.unmetConditions && elig.unmetConditions.length > 0)
    ? `<div class="p-2 rounded bg-red-950/40 border border-red-500/40 text-[11px] text-[#f87171] space-y-0.5">${elig.unmetConditions.map(function(u) { return '<div>✕ ' + (u.reason || u.type) + '</div>'; }).join('')}</div>`
    : (lvlDef ? '<div class="text-[11px] text-[#34d399] font-mono">✓ Research Unlock &amp; Prerequisites Met</div>' : '');

  bodyEl.innerHTML = `
    ${headerHtml}
    <div class="p-4 space-y-3 overflow-y-auto">
      ${heroBarHtml}
      ${graphHtml}
      ${selDef ? `
        <div class="p-3.5 rounded-xl bg-[#0f1520] border border-[#34d399]/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div class="md:col-span-7 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">${selDef.icon || '🎯'}</span>
              <div>
                <div class="font-display text-sm font-bold text-[#34d399]">${selDef.name}</div>
                <div class="flex items-center gap-2 text-[10px] font-mono text-[#94a3b8]">
                  ${renderLevelPipsHtml(curLv, maxLv)}
                  <span>Rank ${curLv} / ${maxLv} (${selHero.name})</span>
                  ${lvlDef ? '<span>• ⏱ ' + formatDurationShort(lvlDef.durationSec) + '</span>' : ''}
                </div>
              </div>
            </div>
            <p class="text-xs text-[#e6edf3]">${selDef.description}</p>
            ${unmetHtml}
          </div>
          <div class="md:col-span-5 p-3 rounded-lg bg-[#080b11] border border-[#1e293b] space-y-2">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] font-bold">Required Resources (Have / Need)</div>
            <div class="space-y-1">${costRowsHtml}</div>
            <button onclick="window.WargameApp.handleStartHeroTraining('${selHero.id}', '${selDef.trainingDefinitionId}')" ${!elig.canStart ? 'disabled' : ''} class="w-full py-2 rounded-lg font-bold text-xs uppercase ${elig.canStart ? 'bg-[#34d399] hover:bg-[#10b981] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
              ${elig.canStart ? ('Train ' + selHero.name + ' (Lv ' + nextLv + ')') : (lvlDef ? 'Locked' : '✓ Mastered')}
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Unified render hook called by syncWargameUI
export function renderProgressionModals(simHost) {
  renderResearchModal(simHost);
  renderTrainingModal(simHost);
}

// Action Handlers (Separate Research & Training flows)
export function handleOpenResearchHub(simHost, treeId) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  simHost.state._trainingModalOpen = false;
  simHost.state._researchModalOpen = true;
  simHost.state._researchSelectedTreeId = treeId || null;
  renderProgressionModals(simHost);
}

export function handleCloseResearchHub(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._researchModalOpen = false;
  renderResearchModal(simHost);
}

export function handleSelectResearchTree(simHost, treeId) {
  if (!simHost || !simHost.state) return;
  simHost.state._researchSelectedTreeId = treeId;
  simHost.state._researchSelectedItemId = null;
  renderResearchModal(simHost);
}

export function handleBackToResearchOverview(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._researchSelectedTreeId = null;
  renderResearchModal(simHost);
}

export function handleSelectResearchNode(simHost, itemId) {
  if (!simHost || !simHost.state) return;
  simHost.state._researchSelectedItemId = itemId;
  renderResearchModal(simHost);
}

export function handleOpenTrainingHub(simHost, treeId) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  simHost.state._researchModalOpen = false;
  simHost.state._trainingModalOpen = true;
  simHost.state._trainingSelectedTreeId = treeId || null;
  renderProgressionModals(simHost);
}

export function handleCloseTrainingHub(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._trainingModalOpen = false;
  renderTrainingModal(simHost);
}

export function handleSelectTrainingTree(simHost, treeId) {
  if (!simHost || !simHost.state) return;
  simHost.state._trainingSelectedTreeId = treeId;
  simHost.state._trainingSelectedItemId = null;
  renderTrainingModal(simHost);
}

export function handleBackToTrainingOverview(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._trainingSelectedTreeId = null;
  renderTrainingModal(simHost);
}

export function handleSelectTrainingNode(simHost, trainingDefId) {
  if (!simHost || !simHost.state) return;
  simHost.state._trainingSelectedItemId = trainingDefId;
  renderTrainingModal(simHost);
}

export function handleSelectTrainingHeroAction(simHost, heroId) {
  if (!simHost || !simHost.state) return;
  simHost.state._trainingSelectedHeroId = heroId;
  renderTrainingModal(simHost);
}

export function handleStartResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const simNowMs = getSimNowMs(simHost);
  const city = getPrimaryCity(simHost.state);
  syncCityGoldToLedger(world, prog, simNowMs);
  const rates = computeEffectiveRates(prog, city, getPlayerId());

  const res = startOrEnqueueResearch(prog, {
    ownerId: getPlayerId(),
    researchItemId: itemId,
    nowMs: simNowMs,
    stockpile: city ? city.stockpile : null,
    eligibilityCtx: {
      city: city,
      heroLevel: (world.heroes && world.heroes[0]) ? (world.heroes[0].level || 1) : 1
    },
    speedBonus: rates.researchSpeedBonus
  });
  simHost.save();
  renderResearchModal(simHost);
  return res;
}

export function handlePauseResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = pauseResearchItem(prog, itemId, getSimNowMs(simHost));
  simHost.save();
  renderResearchModal(simHost);
  return res;
}

export function handleResumeResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = resumeResearchItem(prog, itemId, getSimNowMs(simHost));
  simHost.save();
  renderResearchModal(simHost);
  return res;
}

export function handleCancelResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const city = getPrimaryCity(simHost.state);
  const refundRatio = getConfigValue(prog, 'cancel_refund_ratio');
  const res = cancelResearchItem(prog, itemId, {
    nowMs: getSimNowMs(simHost),
    refundPolicy: REFUND_POLICIES.FIXED_PERCENT,
    refundRatio: refundRatio,
    stockpile: city ? city.stockpile : null
  });
  simHost.save();
  renderResearchModal(simHost);
  return res;
}

export function handleStartHeroTrainingAction(simHost, heroId, trainingDefinitionId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const simNowMs = getSimNowMs(simHost);
  const city = getPrimaryCity(simHost.state);
  syncCityGoldToLedger(world, prog, simNowMs);
  const rates = computeEffectiveRates(prog, city, getPlayerId());

  const res = startOrEnqueueTraining(prog, {
    ownerId: getPlayerId(),
    subjectType: SUBJECT_TYPES.HERO,
    subjectId: heroId,
    trainingDefinitionId: trainingDefinitionId,
    nowMs: simNowMs,
    stockpile: city ? city.stockpile : null,
    speedBonus: rates.trainingSpeedBonus
  });
  simHost.save();
  renderTrainingModal(simHost);
  return res;
}

export function handleCancelHeroTrainingAction(simHost, heroId, trainingDefinitionId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const refundRatio = getConfigValue(prog, 'cancel_refund_ratio');
  const res = cancelTrainingItem(prog, heroId, trainingDefinitionId, {
    nowMs: getSimNowMs(simHost),
    refundPolicy: REFUND_POLICIES.FIXED_PERCENT,
    refundRatio: refundRatio
  });
  simHost.save();
  renderTrainingModal(simHost);
  return res;
}
