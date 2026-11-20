// =============================================================================
// DUAL-ENTRY RESEARCH & TRAINING HUB UI (Inc 10.5 / Spec §18)
// Renders the 6 required prototype views inside #wgProgressionHubModal:
//   1. Overview  2. Visual Research Trees  3. Research Detail
//   4. Queue Manager  5. Hero Training  6. History & Analytics
// Accessible from the top-level navigation header AND contextual town buildings.
// =============================================================================

import { ensureProgressionState } from '../../progression/progressionState.js';
import { OWNER_TYPES, getCurrencyBalance, recordCurrencyTransaction, TRANSACTION_TYPES } from '../../progression/currencyService.js';
import { PROTOTYPE_RESEARCH_TREES, PROTOTYPE_RESEARCH_ITEMS, PROTOTYPE_TRAINING_DEFINITIONS } from '../../progression/researchCatalog.js';
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
import {
  evaluateTreeMilestones,
  archiveCompletedTree,
  unarchiveTree,
  isTreeCompleted,
  setActivePlayerTitle,
  computeProgressionAnalytics
} from '../../progression/milestonesAndAnalytics.js';
import { getPrimaryCity } from '../engine/state.js';

export const PROGRESSION_HUB_TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'trees',     label: '🌳 Trees' },
  { id: 'detail',    label: '🔍 Detail' },
  { id: 'queues',    label: '⏳ Queues' },
  { id: 'training',  label: '🎯 Hero Training' },
  { id: 'analytics', label: '🏆 History & Titles' }
];

function getNowMs(simHost) {
  return (simHost && simHost.state && simHost.state.world && simHost.state.world.clock)
    ? (simHost.state.world.clock.simTimeMs || 0)
    : 0;
}

function getPlayerId() {
  return 'player_1';
}

function formatRp(val) {
  return Number(val || 0).toFixed(5);
}

function syncGoldToLedger(world, prog, nowMs) {
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

export function tickWorldProgression(simHost) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const nowMs = getNowMs(simHost);
  const pid = getPlayerId();

  processPassiveAccrual(prog, pid, nowMs);
  advanceResearchProgress(prog, nowMs);
  advanceTrainingProgress(prog, nowMs);
  evaluateTreeMilestones(prog, pid, { nowMs: nowMs, worldId: world.meta ? world.meta.worldName : 'aethelgard_prime' });
}

export function renderProgressionHubModal(simHost) {
  const modal = document.getElementById('wgProgressionHubModal');
  if (!modal) return;
  const state = simHost ? simHost.state : null;
  if (!state || !state.world || !state._progressionHubOpen) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  tickWorldProgression(simHost);

  const world = state.world;
  const prog = ensureProgressionState(world);
  const nowMs = getNowMs(simHost);
  const pid = getPlayerId();
  syncGoldToLedger(world, prog, nowMs);

  const activeTab = state._progressionHubTab || 'overview';
  const selectedItemId = state._progressionSelectedItemId || 'WAR_WEAPON_HEAVY_001';
  const heroes = Array.isArray(world.heroes) ? world.heroes : [];
  let selectedHeroId = state._progressionSelectedHeroId || (heroes[0] ? heroes[0].id : null);
  if (selectedHeroId && !heroes.some(function(h) { return h.id === selectedHeroId; })) {
    selectedHeroId = heroes[0] ? heroes[0].id : null;
  }

  const subtitleEl = document.getElementById('wgProgressionHubSubtitle');
  if (subtitleEl) {
    const genRp = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, 'rp_general').available;
    const advRp = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, 'rp_adventurer').available;
    const goldBal = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, 'gold').available;
    subtitleEl.textContent = 'General RP: ' + formatRp(genRp) + ' • Adventurer RP: ' + formatRp(advRp) + ' • Gold: ' + Math.floor(goldBal);
  }

  const tabsEl = document.getElementById('wgProgressionHubTabs');
  if (tabsEl) {
    tabsEl.innerHTML = PROGRESSION_HUB_TABS.map(function(t) {
      const isAct = t.id === activeTab;
      return `<button onclick="window.WargameApp.handleSwitchProgressionTab('${t.id}')" class="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase cursor-pointer transition ${isAct ? 'bg-[#fbbf24] text-[#080b11] shadow' : 'bg-[#111722] hover:bg-[#1a2232] text-[#cbd5e1] border border-[#283347]'}">${t.label}</button>`;
    }).join('');
  }

  const bodyEl = document.getElementById('wgProgressionHubBody');
  if (!bodyEl) return;

  const analytics = computeProgressionAnalytics(prog, pid);
  const lookup = buildOwnerProgressLookup(prog, OWNER_TYPES.PLAYER, pid);
  const city = getPrimaryCity(state);

  if (activeTab === 'overview') {
    const activeTitleHtml = analytics.activeTitle
      ? `<span class="px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50 text-[10px] font-mono font-bold">👑 ${analytics.activeTitle.name}</span>`
      : `<span class="text-[10px] font-mono text-[#64748b]">No title equipped</span>`;

    const nextStepText = analytics.tutorial.nextStep
      ? ('Next: ' + analytics.tutorial.nextStep.order + '. ' + analytics.tutorial.nextStep.title + ' — ' + analytics.tutorial.nextStep.desc)
      : 'All 12 Research & Training onboarding steps mastered!';

    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-1">
          <div class="text-[10px] font-mono uppercase text-[#94a3b8]">📘 General RP (Passive)</div>
          <div class="text-lg font-mono font-bold text-[#60a5fa]">${formatRp(analytics.currencyBalances.rp_general)}</div>
          <div class="text-[10px] text-[#64748b]">Accrues offline at 0.00001 / sec + modifiers</div>
        </div>
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-1">
          <div class="text-[10px] font-mono uppercase text-[#94a3b8]">🧭 Adventurer RP (Activity)</div>
          <div class="text-lg font-mono font-bold text-[#34d399]">${formatRp(analytics.currencyBalances.rp_adventurer)}</div>
          <div class="text-[10px] text-[#64748b]">Earned from delving, skirmishes & quests</div>
        </div>
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-1">
          <div class="text-[10px] font-mono uppercase text-[#94a3b8]">💰 Treasury Gold</div>
          <div class="text-lg font-mono font-bold text-[#fbbf24]">${Math.floor(analytics.currencyBalances.gold)}g</div>
          <div class="text-[10px] text-[#64748b]">Shared atomic currency & stockpile payments</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#fbbf24] uppercase">⏳ Active Queues</span>
            <button onclick="window.WargameApp.handleSwitchProgressionTab('queues')" class="text-[10px] font-mono text-[#38bdf8] hover:underline cursor-pointer">Manage →</button>
          </div>
          <div class="text-xs text-[#cbd5e1] font-mono">
            • Personal Research Queue: <strong>${analytics.activeResearchCount}/${prog.researchQueue.capacity}</strong> active (${analytics.pendingResearchCount} pending)<br/>
            • Separate Hero Training Queue: <strong>${analytics.activeTrainingCount}/${prog.trainingQueue.capacity}</strong> active (${analytics.pendingTrainingCount} pending)
          </div>
        </div>
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#c084fc] uppercase">🏆 Progression Identity</span>
            ${activeTitleHtml}
          </div>
          <div class="text-xs text-[#cbd5e1] font-mono">
            • Research Levels Completed: <strong>${analytics.totalResearchLevels}</strong> (${analytics.completedTreeCount} trees mastered)<br/>
            • Hero Trainings Completed: <strong>${analytics.totalTrainingCompletions}</strong> (${analytics.trainedSubjectCount} heroes)
          </div>
        </div>
      </div>

      <div class="p-3 rounded-lg bg-[#080b11] border border-[#38bdf8]/40 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-[#38bdf8]">📜 12-Step Research &amp; Training Onboarding</span>
          <span class="font-mono text-[#fbbf24] font-bold">${analytics.tutorial.completedCount} / ${analytics.tutorial.totalSteps} (${analytics.tutorial.progressPct}%)</span>
        </div>
        <div class="w-full h-2 bg-[#111722] rounded-full overflow-hidden">
          <div class="h-full bg-[#38bdf8]" style="width:${analytics.tutorial.progressPct}%"></div>
        </div>
        <div class="text-[11px] text-[#94a3b8]">${nextStepText}</div>
      </div>
    `;
    return;
  }

  if (activeTab === 'trees') {
    const treesHtml = Object.keys(PROTOTYPE_RESEARCH_TREES).map(function(tid) {
      const tree = PROTOTYPE_RESEARCH_TREES[tid];
      const archived = (prog.archivedTreeIds || []).indexOf(tid) !== -1;
      const completed = isTreeCompleted(prog, tid, pid);

      const nodesHtml = (tree.itemIds || []).map(function(itemId) {
        const item = PROTOTYPE_RESEARCH_ITEMS[itemId];
        if (!item) return '';
        const inst = lookup[itemId];
        const curLv = inst ? (inst.currentLevel || 0) : 0;
        const isActive = prog.researchQueue.activeItems.some(function(a) { return a.researchItemId === itemId; });
        const badge = isActive
          ? '<span class="px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] text-[9px] font-mono">IN PROGRESS</span>'
          : (curLv >= item.levelLimit
            ? '<span class="px-1.5 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] text-[9px] font-mono">MAX</span>'
            : '<span class="px-1.5 py-0.5 rounded bg-[#1a2232] text-[#fbbf24] text-[9px] font-mono">Lv ' + curLv + '/' + item.levelLimit + '</span>');

        return `
          <button onclick="window.WargameApp.handleSelectResearchItem('${itemId}')" class="w-full text-left p-2.5 rounded-lg bg-[#111722] hover:bg-[#1a2232] border ${selectedItemId === itemId ? 'border-[#fbbf24]' : 'border-[#283347]'} flex items-center justify-between gap-2 cursor-pointer transition">
            <div class="min-w-0">
              <div class="text-xs font-bold text-[#e6edf3] truncate">${item.icon || '📘'} ${item.name}</div>
              <div class="text-[10px] text-[#8b949e] truncate">${item.description}</div>
            </div>
            ${badge}
          </button>
        `;
      }).join('');

      const archiveBtn = completed
        ? (archived
          ? `<button onclick="window.WargameApp.handleToggleArchiveTree('${tid}', false)" class="px-2 py-0.5 rounded bg-[#1a2232] text-[#94a3b8] text-[10px] font-mono cursor-pointer">Restore</button>`
          : `<button onclick="window.WargameApp.handleToggleArchiveTree('${tid}', true)" class="px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40 text-[10px] font-mono cursor-pointer">📦 Archive Tree</button>`)
        : '';

      return `
        <div class="p-3 rounded-lg bg-[#080b11] border ${archived ? 'border-[#1e293b] opacity-65' : 'border-[#283347]'} space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="text-xs font-bold text-[#fbbf24]">${tree.icon} ${tree.name} ${archived ? '<span class="text-[9px] text-[#64748b] font-mono">(Archived)</span>' : ''}</div>
              <div class="text-[10px] text-[#94a3b8]">${tree.shortDescription}</div>
            </div>
            ${archiveBtn}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${nodesHtml}</div>
        </div>
      `;
    }).join('');

    bodyEl.innerHTML = `<div class="space-y-3">${treesHtml}</div>`;
    return;
  }

  if (activeTab === 'detail') {
    const item = PROTOTYPE_RESEARCH_ITEMS[selectedItemId] || PROTOTYPE_RESEARCH_ITEMS.WAR_WEAPON_HEAVY_001;
    const inst = lookup[item.researchItemId];
    const curLv = inst ? (inst.currentLevel || 0) : 0;
    const nextLv = curLv + 1;
    const lvlDef = (item.levelDefinitions || []).find(function(l) { return l.level === nextLv; });

    const elig = lvlDef
      ? evaluateResearchEligibility(item, nextLv, {
          ownerId: pid,
          ownerType: OWNER_TYPES.PLAYER,
          ledger: prog.currencyLedger,
          researchProgress: lookup,
          city: city,
          alignment: prog.alignment,
          discoveries: prog.discoveries
        })
      : { canStart: false, status: 'max_level_reached', unmetConditions: [] };

    const costsStr = lvlDef
      ? (lvlDef.costs || []).map(function(c) {
          return c.kind === 'stockpile' ? (c.amount + ' ' + c.resourceId) : (c.amount + ' ' + c.currencyId);
        }).join(' • ')
      : 'Max Level Reached';

    const benefitsStr = lvlDef
      ? (lvlDef.benefits || []).map(function(b) {
          return '[' + b.op.toUpperCase() + '] ' + b.effectType + ' -> ' + b.target + ' (' + b.value + ')';
        }).join('<br/>')
      : 'All levels completed.';

    const unmetHtml = (elig.unmetConditions && elig.unmetConditions.length > 0)
      ? `<div class="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 space-y-1">
          <div class="font-bold">🔒 Unmet Requirements:</div>
          ${elig.unmetConditions.map(function(u) { return '<div>• ' + (u.reason || u.type) + '</div>'; }).join('')}
        </div>`
      : '';

    bodyEl.innerHTML = `
      <div class="p-4 rounded-lg bg-[#080b11] border border-[#fbbf24]/40 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-base font-bold text-[#fbbf24]">${item.icon || '📘'} ${item.name}</div>
            <div class="text-[11px] font-mono text-[#94a3b8]">ID: ${item.researchItemId} • Domain: ${item.domainId} • Level ${curLv} / ${item.levelLimit}</div>
          </div>
          <button onclick="window.WargameApp.handleSwitchProgressionTab('trees')" class="px-2.5 py-1 rounded bg-[#1a2232] text-xs text-[#cbd5e1] cursor-pointer">← All Trees</button>
        </div>
        <p class="text-xs text-[#e6edf3]">${item.description}</p>
        ${unmetHtml}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div class="p-3 rounded bg-[#111722] border border-[#283347]">
            <div class="text-[10px] uppercase text-[#94a3b8] mb-1">Next Level (${lvlDef ? ('Lv ' + nextLv) : 'MAX'}) Costs &amp; Time</div>
            <div class="text-[#fbbf24]">${costsStr}</div>
            ${lvlDef ? `<div class="text-[#38bdf8] mt-1">⏱ Duration: ${lvlDef.durationSec}s</div>` : ''}
          </div>
          <div class="p-3 rounded bg-[#111722] border border-[#283347]">
            <div class="text-[10px] uppercase text-[#94a3b8] mb-1">Effects (Unlocks &amp; Modifiers)</div>
            <div class="text-[#34d399]">${benefitsStr}</div>
          </div>
        </div>
        <div class="flex justify-end">
          <button onclick="window.WargameApp.handleStartResearch('${item.researchItemId}')" ${!lvlDef ? 'disabled' : ''} class="px-4 py-2 rounded-lg font-bold text-xs uppercase ${lvlDef ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ${lvlDef ? ('📚 Start / Enqueue Level ' + nextLv) : '✓ Mastered'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  if (activeTab === 'queues') {
    const rq = prog.researchQueue;
    const tq = prog.trainingQueue;

    const rActiveHtml = rq.activeItems.length > 0
      ? rq.activeItems.map(function(e) {
          const pct = Math.min(100, Math.round((e.elapsedMs / Math.max(1, e.effectiveDurationMs)) * 100));
          const toggleBtn = e.status === 'paused'
            ? `<button onclick="window.WargameApp.handleResumeResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] text-[10px] font-mono cursor-pointer">▶ Resume</button>`
            : `<button onclick="window.WargameApp.handlePauseResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] text-[10px] font-mono cursor-pointer">⏸ Pause</button>`;
          return `
            <div class="p-2.5 rounded bg-[#111722] border border-[#38bdf8]/40 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#e6edf3]">${e.researchItemId} (Lv ${e.targetLevel})</span>
                <div class="flex items-center gap-1">
                  ${toggleBtn}
                  <button onclick="window.WargameApp.handleCancelResearch('${e.researchItemId}')" class="px-2 py-0.5 rounded bg-red-950/60 text-red-300 text-[10px] font-mono cursor-pointer">✕ Cancel</button>
                </div>
              </div>
              <div class="w-full h-1.5 bg-[#080b11] rounded-full overflow-hidden"><div class="h-full bg-[#38bdf8]" style="width:${pct}%"></div></div>
              <div class="text-[10px] font-mono text-[#94a3b8]">Status: ${e.status} • ${pct}%</div>
            </div>
          `;
        }).join('')
      : '<div class="text-xs text-[#64748b] italic">No active personal research.</div>';

    const tActiveHtml = tq.activeItems.length > 0
      ? tq.activeItems.map(function(e) {
          const pct = Math.min(100, Math.round((e.elapsedMs / Math.max(1, e.effectiveDurationMs)) * 100));
          return `
            <div class="p-2.5 rounded bg-[#111722] border border-[#34d399]/40 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#e6edf3]">${e.trainingDefinitionId} • ${e.subjectId} (Lv ${e.targetLevel})</span>
                <button onclick="window.WargameApp.handleCancelHeroTraining('${e.subjectId}', '${e.trainingDefinitionId}')" class="px-2 py-0.5 rounded bg-red-950/60 text-red-300 text-[10px] font-mono cursor-pointer">✕ Cancel</button>
              </div>
              <div class="w-full h-1.5 bg-[#080b11] rounded-full overflow-hidden"><div class="h-full bg-[#34d399]" style="width:${pct}%"></div></div>
              <div class="text-[10px] font-mono text-[#94a3b8]">Status: ${e.status} • ${pct}%</div>
            </div>
          `;
        }).join('')
      : '<div class="text-xs text-[#64748b] italic">No active hero training.</div>';

    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
          <div class="text-xs font-bold text-[#38bdf8] uppercase">📚 Personal Research Queue (${rq.activeItems.length}/${rq.capacity})</div>
          ${rActiveHtml}
          <div class="text-[10px] font-mono text-[#94a3b8] pt-1">Pending: ${rq.pendingItems.length}</div>
        </div>
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
          <div class="text-xs font-bold text-[#34d399] uppercase">🎯 Separate Hero Training Queue (${tq.activeItems.length}/${tq.capacity})</div>
          ${tActiveHtml}
          <div class="text-[10px] font-mono text-[#94a3b8] pt-1">Pending: ${tq.pendingItems.length}</div>
        </div>
      </div>
    `;
    return;
  }

  if (activeTab === 'training') {
    if (heroes.length === 0) {
      bodyEl.innerHTML = `<div class="p-4 rounded-lg bg-[#080b11] border border-[#283347] text-xs text-[#94a3b8] text-center">Recruit at least one Hero at your City Guild Hall to train individual Hero skills here.</div>`;
      return;
    }
    const selHero = heroes.find(function(h) { return h.id === selectedHeroId; }) || heroes[0];
    const effAtk = computeSubjectEffectiveStat(prog, SUBJECT_TYPES.HERO, selHero.id, selHero.stats ? selHero.stats.atk : 10, 'atk', { playerId: pid }).finalValue;
    const effHp = computeSubjectEffectiveStat(prog, SUBJECT_TYPES.HERO, selHero.id, selHero.stats ? selHero.stats.maxHp : 100, 'maxHp', { playerId: pid }).finalValue;
    const heroSummary = getSubjectTrainingSummary(prog, SUBJECT_TYPES.HERO, selHero.id);

    const heroButtons = heroes.map(function(h) {
      const isSel = h.id === selHero.id;
      return `<button onclick="window.WargameApp.handleSelectTrainingHero('${h.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${isSel ? 'bg-[#fbbf24] text-[#080b11] font-bold' : 'bg-[#111722] text-[#cbd5e1] border border-[#283347]'}">${h.icon || '⚔️'} ${h.name}</button>`;
    }).join('');

    const trainCards = Object.keys(PROTOTYPE_TRAINING_DEFINITIONS).map(function(tid) {
      const def = PROTOTYPE_TRAINING_DEFINITIONS[tid];
      const elig = evaluateTrainingEligibility(prog, { ownerId: pid, subjectType: SUBJECT_TYPES.HERO, subjectId: selHero.id, trainingDefinitionId: tid });
      const trainedRec = heroSummary.find(function(s) { return s.trainingDefinitionId === tid; });
      const curLv = trainedRec ? trainedRec.currentLevel : 0;
      const reasonHtml = !elig.canStart && elig.unmetConditions && elig.unmetConditions[0]
        ? `<div class="text-[10px] text-amber-300 font-mono">🔒 ${elig.unmetConditions[0].reason}</div>`
        : '';

      return `
        <div class="p-3 rounded-lg bg-[#111722] border border-[#283347] flex items-center justify-between gap-3 text-xs">
          <div class="space-y-0.5">
            <div class="font-bold text-[#34d399]">🎯 ${def.name} <span class="text-[10px] font-mono text-[#fbbf24]">• Lv ${curLv}/${def.levels.length}</span></div>
            <div class="text-[10px] text-[#94a3b8]">${def.description}</div>
            ${reasonHtml}
          </div>
          <button onclick="window.WargameApp.handleStartHeroTraining('${selHero.id}', '${tid}')" ${!elig.canStart ? 'disabled' : ''} class="px-3 py-1.5 rounded font-bold text-[10px] font-mono uppercase whitespace-nowrap ${elig.canStart ? 'bg-[#34d399] hover:bg-[#10b981] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ${elig.canStart ? ('Train Lv ' + elig.targetLevel) : 'Locked'}
          </button>
        </div>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">${heroButtons}</div>
        <div class="p-3 rounded-lg bg-[#080b11] border border-[#fbbf24]/30 flex items-center justify-between text-xs font-mono">
          <span class="font-bold text-[#fbbf24]">${selHero.icon || '⚔️'} ${selHero.name} (Lv ${selHero.level} ${selHero.className})</span>
          <span class="text-[#34d399]">Effective ATK: <strong>${effAtk}</strong> • Effective Max HP: <strong>${effHp}</strong></span>
        </div>
        <div class="space-y-2">${trainCards}</div>
      </div>
    `;
    return;
  }

  // Tab 6: History, Milestones, Provenance Titles & Analytics
  const titlesHtml = (prog.earnedTitles || []).length > 0
    ? prog.earnedTitles.map(function(t) {
        const isEq = prog.activeTitleId === t.titleId;
        return `
          <div class="p-2 rounded bg-[#111722] border ${isEq ? 'border-[#fbbf24]' : 'border-[#283347]'} flex items-center justify-between text-xs">
            <div>
              <div class="font-bold text-[#fbbf24]">👑 ${t.name} <span class="text-[9px] font-mono uppercase text-[#c084fc]">[${t.rarity}]</span></div>
              <div class="text-[10px] text-[#94a3b8]">${t.provenance} • World: ${t.worldId}</div>
            </div>
            <button onclick="window.WargameApp.handleEquipPlayerTitle('${isEq ? '' : t.titleId}')" class="px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${isEq ? 'bg-[#fbbf24] text-[#080b11]' : 'bg-[#1a2232] text-[#e6edf3]'}">
              ${isEq ? 'Equipped' : 'Equip'}
            </button>
          </div>
        `;
      }).join('')
    : '<div class="text-xs text-[#64748b] italic">Complete Research Tree milestones to earn Provenance Titles!</div>';

  bodyEl.innerHTML = `
    <div class="space-y-3">
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
        <div class="text-xs font-bold text-[#fbbf24] uppercase">👑 Provenance Titles (${analytics.titleCount})</div>
        <div class="space-y-1.5">${titlesHtml}</div>
      </div>
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
        <div><span class="text-[#94a3b8]">Milestones:</span> <strong class="text-[#34d399]">${analytics.milestoneCount}</strong></div>
        <div><span class="text-[#94a3b8]">Archived Trees:</span> <strong class="text-[#38bdf8]">${analytics.archivedTreeCount}</strong></div>
        <div><span class="text-[#94a3b8]">Ledger Txns:</span> <strong class="text-[#fbbf24]">${analytics.ledgerTransactionCount}</strong></div>
        <div><span class="text-[#94a3b8]">Contributions:</span> <strong class="text-[#c084fc]">${analytics.contributionCount}</strong></div>
      </div>
    </div>
  `;
}

// UI Action Handlers (bound to window.WargameApp)
export function handleOpenProgressionHub(simHost, initialTab) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  simHost.state._progressionHubOpen = true;
  if (initialTab) simHost.state._progressionHubTab = initialTab;
  renderProgressionHubModal(simHost);
}

export function handleCloseProgressionHub(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._progressionHubOpen = false;
  renderProgressionHubModal(simHost);
}

export function handleSwitchProgressionTab(simHost, tabId) {
  if (!simHost || !simHost.state) return;
  simHost.state._progressionHubTab = tabId || 'overview';
  renderProgressionHubModal(simHost);
}

export function handleSelectResearchItem(simHost, itemId) {
  if (!simHost || !simHost.state) return;
  simHost.state._progressionSelectedItemId = itemId;
  simHost.state._progressionHubTab = 'detail';
  renderProgressionHubModal(simHost);
}

export function handleStartResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const nowMs = getNowMs(simHost);
  const city = getPrimaryCity(simHost.state);
  syncGoldToLedger(world, prog, nowMs);

  const res = startOrEnqueueResearch(prog, {
    ownerId: getPlayerId(),
    researchItemId: itemId,
    nowMs: nowMs,
    stockpile: city ? city.stockpile : null,
    eligibilityCtx: { city: city }
  });
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handlePauseResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = pauseResearchItem(prog, itemId, getNowMs(simHost));
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleResumeResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = resumeResearchItem(prog, itemId, getNowMs(simHost));
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleCancelResearchAction(simHost, itemId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const city = getPrimaryCity(simHost.state);
  const res = cancelResearchItem(prog, itemId, {
    nowMs: getNowMs(simHost),
    refundPolicy: REFUND_POLICIES.FIXED_PERCENT,
    stockpile: city ? city.stockpile : null
  });
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleSelectTrainingHeroAction(simHost, heroId) {
  if (!simHost || !simHost.state) return;
  simHost.state._progressionSelectedHeroId = heroId;
  renderProgressionHubModal(simHost);
}

export function handleStartHeroTrainingAction(simHost, heroId, trainingDefinitionId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const world = simHost.state.world;
  const prog = ensureProgressionState(world);
  const nowMs = getNowMs(simHost);
  const city = getPrimaryCity(simHost.state);
  syncGoldToLedger(world, prog, nowMs);

  const res = startOrEnqueueTraining(prog, {
    ownerId: getPlayerId(),
    subjectType: SUBJECT_TYPES.HERO,
    subjectId: heroId,
    trainingDefinitionId: trainingDefinitionId,
    nowMs: nowMs,
    stockpile: city ? city.stockpile : null
  });
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleCancelHeroTrainingAction(simHost, heroId, trainingDefinitionId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = cancelTrainingItem(prog, heroId, trainingDefinitionId, {
    nowMs: getNowMs(simHost),
    refundPolicy: REFUND_POLICIES.FIXED_PERCENT
  });
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleToggleArchiveTreeAction(simHost, treeId, archive) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = archive ? archiveCompletedTree(prog, treeId, getPlayerId()) : unarchiveTree(prog, treeId);
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}

export function handleEquipPlayerTitleAction(simHost, titleId) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const res = setActivePlayerTitle(prog, titleId || null);
  simHost.save();
  renderProgressionHubModal(simHost);
  return res;
}
