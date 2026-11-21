// =============================================================================
// WARGAME DEVELOPER PORTAL (Live Currency Editor & Auto-Surfaced Key Configs)
// Automatically renders every entry registered in src/progression/configRegistry.js
// plus live currency/stockpile editors and offline time-jump testing tools.
// =============================================================================

import { ensureProgressionState } from '../../progression/progressionState.js';
import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  DEFAULT_CURRENCY_DEFINITIONS,
  getCurrencyBalance,
  recordCurrencyTransaction
} from '../../progression/currencyService.js';
import {
  DEV_CONFIG_REGISTRY,
  getConfigValue,
  setConfigValue,
  resetAllConfigValues
} from '../../progression/configRegistry.js';
import { advanceResearchProgress } from '../../progression/queueService.js';
import { advanceTrainingProgress } from '../../progression/trainingService.js';
import { processPassiveAccrual } from '../../progression/accrualService.js';
import { getPrimaryCity } from '../engine/state.js';

export function renderDevPortalModal(simHost, forceRender) {
  const modal = document.getElementById('wgDevPortalModal');
  if (!modal) return;
  const state = simHost ? simHost.state : null;
  if (!state || !state.world || !state._devPortalOpen) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  // Prevent background 400ms UI sync from wiping out live user input values!
  if (!forceRender && !state._devPortalNeedsRender) {
    return;
  }
  state._devPortalNeedsRender = false;
  const bodyEl = document.getElementById('wgDevPortalBody');
  if (!bodyEl) return;

  const world = state.world;
  const prog = ensureProgressionState(world);
  const pid = 'player_1';
  const city = getPrimaryCity(state);

  // 1. Progression Currencies Editor
  const currIds = Object.keys(DEFAULT_CURRENCY_DEFINITIONS);
  const currRows = currIds.map(function(cid) {
    const def = DEFAULT_CURRENCY_DEFINITIONS[cid];
    const bal = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, cid).available;
    return `
      <div class="p-2 rounded bg-[#0a0f18] border border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div class="min-w-0">
          <div class="font-bold text-[#e6edf3]">${def.icon || '💎'} ${def.name}</div>
          <div class="text-[10px] text-[#64748b]">${cid} • Current: <span class="text-[#fbbf24]">${Number(bal).toFixed(5)}</span></div>
        </div>
        <div class="flex items-center gap-1.5">
          <input id="wgDevCurrInput_${cid}" type="number" step="any" value="${bal}" class="w-24 px-2 py-1 rounded bg-[#111722] border border-[#334155] text-[#e6edf3] text-xs font-mono" />
          <button onclick="window.WargameApp.handleDevSetCurrency('${cid}')" class="px-2.5 py-1 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-[10px] uppercase cursor-pointer">Set</button>
          <button onclick="window.WargameApp.handleDevAddCurrency('${cid}', ${cid === 'gold' ? 500 : 10})" class="px-2 py-1 rounded bg-[#161e2e] hover:bg-[#283347] text-[#34d399] border border-[#34d399]/40 font-bold text-[10px] cursor-pointer">+${cid === 'gold' ? 500 : 10}</button>
        </div>
      </div>
    `;
  }).join('');

  // 2. City Stockpiles Editor
  const stockKeys = ['wood', 'stone', 'food', 'water', 'ore', 'ingots', 'gold'];
  const stockHtml = city ? stockKeys.map(function(sk) {
    const val = (city.stockpile && city.stockpile[sk]) || 0;
    return `
      <div class="p-2 rounded bg-[#0a0f18] border border-[#1e293b] flex items-center justify-between gap-2 text-xs font-mono">
        <span class="uppercase text-[#94a3b8] font-bold">${sk}: <strong class="text-[#e6edf3]">${val}</strong></span>
        <div class="flex items-center gap-1">
          <button onclick="window.WargameApp.handleDevAddStockpile('${sk}', 100)" class="px-2 py-0.5 rounded bg-[#161e2e] hover:bg-[#283347] text-[#34d399] border border-[#34d399]/40 text-[10px] font-bold cursor-pointer">+100</button>
          <button onclick="window.WargameApp.handleDevAddStockpile('${sk}', 1000)" class="px-2 py-0.5 rounded bg-[#161e2e] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-bold cursor-pointer">+1000</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="text-xs text-[#64748b] italic">Found a city to edit city stockpiles.</div>';

  // 3. Auto-Surfaced Key Configurations grouped by category
  const byCat = {};
  for (let i = 0; i < DEV_CONFIG_REGISTRY.length; i++) {
    const cfg = DEV_CONFIG_REGISTRY[i];
    if (!byCat[cfg.category]) byCat[cfg.category] = [];
    byCat[cfg.category].push(cfg);
  }

  const configSections = Object.keys(byCat).map(function(cat) {
    const rows = byCat[cat].map(function(cfg) {
      const curVal = getConfigValue(prog, cfg.key);
      return `
        <div class="p-2 rounded bg-[#0a0f18] border border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="min-w-0 flex-1">
            <div class="font-bold text-[#e6edf3]">${cfg.label}</div>
            <div class="text-[10px] text-[#64748b]">${cfg.desc} <span class="font-mono text-[#94a3b8]">(default: ${cfg.defaultValue})</span></div>
          </div>
          <div class="flex items-center gap-1.5">
            <input id="wgDevCfgInput_${cfg.key}" type="number" step="${cfg.step}" min="${cfg.min}" max="${cfg.max}" value="${curVal}" class="w-24 px-2 py-1 rounded bg-[#111722] border border-[#334155] text-[#38bdf8] text-xs font-mono" />
            <button onclick="window.WargameApp.handleDevSetConfig('${cfg.key}')" class="px-2.5 py-1 rounded bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#080b11] font-bold text-[10px] font-mono uppercase cursor-pointer">Apply</button>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="space-y-1.5">
        <div class="text-[10px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold">${cat}</div>
        ${rows}
      </div>
    `;
  }).join('');

  bodyEl.innerHTML = `
    <div class="space-y-4">
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#fbbf24]/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="text-xs font-bold text-[#fbbf24] uppercase">⚡ Live Simulation &amp; Offline Testing Tools</div>
          <div class="text-[10px] text-[#94a3b8]">Simulate offline time passage for General RP accrual &amp; active queue completion.</div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button onclick="window.WargameApp.handleDevTimeJump(600)" class="px-2.5 py-1.5 rounded bg-[#161e2e] hover:bg-[#283347] text-[#38bdf8] border border-[#38bdf8]/40 text-[10px] font-mono font-bold cursor-pointer">⏩ +10m Offline</button>
          <button onclick="window.WargameApp.handleDevTimeJump(3600)" class="px-2.5 py-1.5 rounded bg-[#161e2e] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-mono font-bold cursor-pointer">⏩ +1h Offline</button>
          <button onclick="window.WargameApp.handleDevCompleteQueues()" class="px-2.5 py-1.5 rounded bg-[#34d399] hover:bg-[#10b981] text-[#080b11] text-[10px] font-mono font-bold cursor-pointer">✓ Finish Active Queues</button>
          <button onclick="window.WargameApp.handleDevResetConfigs()" class="px-2.5 py-1.5 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold cursor-pointer">↺ Reset Configs</button>
        </div>
      </div>

      <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
        <div class="text-xs font-bold text-[#fbbf24] uppercase">💰 Progression Currencies (Ledger)</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${currRows}</div>
      </div>

      <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
        <div class="text-xs font-bold text-[#34d399] uppercase">📦 Primary City Stockpiles</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${stockHtml}</div>
      </div>

      <div class="p-3 rounded-lg bg-[#080b11] border border-[#38bdf8]/40 space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold text-[#38bdf8] uppercase">⚙️ Registered Key Configurations (Auto-Surfaced)</div>
          <span class="text-[10px] font-mono text-[#64748b]">${DEV_CONFIG_REGISTRY.length} live settings</span>
        </div>
        ${configSections}
      </div>
    </div>
  `;
}

export function handleOpenDevPortal(simHost) {
  if (!simHost || !simHost.state || !simHost.state.world) return;
  simHost.state._devPortalOpen = true;
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
}

export function handleCloseDevPortal(simHost) {
  if (!simHost || !simHost.state) return;
  simHost.state._devPortalOpen = false;
  simHost.state._devPortalNeedsRender = false;
  renderDevPortalModal(simHost);
}

export function handleDevSetCurrencyAction(simHost, currencyId, explicitValue) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const pid = 'player_1';
  let targetVal = explicitValue;
  if (typeof targetVal !== 'number' && typeof document !== 'undefined') {
    const inp = document.getElementById('wgDevCurrInput_' + currencyId);
    targetVal = inp ? parseFloat(inp.value) : NaN;
  }
  if (!isFinite(targetVal) || targetVal < 0) return { ok: false, reason: 'invalid_amount' };

  const current = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, currencyId).available;
  const delta = Math.round((targetVal - current) * 100000) / 100000;
  if (Math.abs(delta) > 0) {
    recordCurrencyTransaction(prog.currencyLedger, {
      ownerId: pid,
      ownerType: OWNER_TYPES.PLAYER,
      currencyId: currencyId,
      amount: delta,
      transactionType: TRANSACTION_TYPES.ADJUSTMENT,
      source: 'dev_portal_set',
      nowMs: Date.now()
    });
  }
  // Keep City Gold stockpile in sync when editing gold
  if (currencyId === 'gold') {
    const city = getPrimaryCity(simHost.state);
    if (city && city.stockpile) city.stockpile.gold = Math.floor(targetVal);
  }
  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return { ok: true, currencyId: currencyId, balance: targetVal };
}

export function handleDevAddCurrencyAction(simHost, currencyId, delta) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const pid = 'player_1';
  const current = getCurrencyBalance(prog.currencyLedger, pid, OWNER_TYPES.PLAYER, currencyId).available;
  return handleDevSetCurrencyAction(simHost, currencyId, Math.max(0, current + Number(delta || 0)));
}

export function handleDevAddStockpileAction(simHost, resourceId, delta) {
  const city = getPrimaryCity(simHost.state);
  if (!city || !city.stockpile) return { ok: false };
  city.stockpile[resourceId] = Math.max(0, Number(city.stockpile[resourceId] || 0) + Number(delta || 0));
  if (resourceId === 'gold') {
    handleDevAddCurrencyAction(simHost, 'gold', delta);
  }
  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return { ok: true, resourceId: resourceId, value: city.stockpile[resourceId] };
}

export function handleDevSetConfigAction(simHost, key, explicitValue) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  let val = explicitValue;
  if (typeof val !== 'number' && typeof document !== 'undefined') {
    const inp = document.getElementById('wgDevCfgInput_' + key);
    val = inp ? parseFloat(inp.value) : NaN;
  }
  const res = setConfigValue(prog, key, val);
  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return res;
}

export function handleDevResetConfigsAction(simHost) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  resetAllConfigValues(prog);
  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return { ok: true };
}

export function handleDevTimeJumpAction(simHost, seconds) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const deltaMs = Math.max(1000, Math.round(Number(seconds || 600) * 1000));
  const newWallMs = (prog.lastWallClockAtMs || Date.now()) + deltaMs;
  const baseRate = getConfigValue(prog, 'passive_rp_general_per_sec');

  // Rewind lastAccrualAtMs by deltaMs so processPassiveAccrual awards exact elapsed time
  prog.lastAccrualAtMs = (prog.lastAccrualAtMs || 0);
  const simNow = (simHost.state.world.clock ? simHost.state.world.clock.simTimeMs : 0) + deltaMs;
  if (simHost.state.world.clock) simHost.state.world.clock.simTimeMs = simNow;
  processPassiveAccrual(prog, 'player_1', prog.lastAccrualAtMs + deltaMs, { baseRatePerSec: baseRate });
  prog.lastWallClockAtMs = newWallMs;
  advanceResearchProgress(prog, simNow);
  advanceTrainingProgress(prog, simNow);

  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return { ok: true, jumpedSec: seconds };
}

export function handleDevCompleteQueuesAction(simHost) {
  if (!simHost || !simHost.state || !simHost.state.world) return { ok: false };
  const prog = ensureProgressionState(simHost.state.world);
  const simNow = (simHost.state.world.clock ? simHost.state.world.clock.simTimeMs : 0) + 100000000;
  if (simHost.state.world.clock) simHost.state.world.clock.simTimeMs = simNow;
  advanceResearchProgress(prog, simNow);
  advanceTrainingProgress(prog, simNow);
  simHost.state._dirty = true;
  simHost.save();
  simHost.state._devPortalNeedsRender = true;
  renderDevPortalModal(simHost, true);
  return { ok: true };
}
