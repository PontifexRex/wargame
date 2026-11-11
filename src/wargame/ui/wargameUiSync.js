// Wargame DOM Synchronizer — Start Screen, Pioneer Overworld HUD, Real-Time City Builder, Guild Recruitment & Event Feed

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS
} from '../constants.js';
import {
  OVERWORLD_TERRAIN_DEFS,
  RECRUITABLE_HERO_CLASSES
} from '../data/terrain.js';
import {
  CITY_BUILDINGS_CATALOG,
  CITY_PLOT_SLOTS,
  computeBuildingUpgradeCost,
  computeBuildingDurationMs
} from '../data/buildings.js';
import {
  getPrimaryCity,
  getSelectedOverworldUnit,
  getEffectiveStockpile,
  computeCityStorageCaps,
  computeCityPopulation
} from '../engine/state.js';
import { getFormattedTasksList } from '../engine/taskEngine.js';

function setHtmlIfChanged(el, newHtml) {
  if (!el) return;
  if (!el.dataset) el.dataset = {};
  if (el.dataset.renderedHtml !== newHtml) {
    el.innerHTML = newHtml;
    el.dataset.renderedHtml = newHtml;
  }
}

export function formatSimDuration(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) {
    return mins + 'm ' + (secs < 10 ? '0' + secs : secs) + 's';
  }
  return secs + 's';
}

export function formatWorldClock(simTimeMs) {
  const totalSec = Math.floor(Math.max(0, simTimeMs) / 1000);
  const day = Math.floor(totalSec / 60) + 1;
  const secInDay = totalSec % 60;
  return 'Day ' + day + ' • ' + (secInDay < 10 ? '0' + secInDay : secInDay) + 's';
}

export function updateHeaderFastTick(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const world = simHost.state.world;
  const clock = world.clock || { simTimeMs: 0, paused: false };

  const clockTextEl = document.getElementById('wgHeaderClockText');
  if (clockTextEl) {
    clockTextEl.textContent = formatWorldClock(clock.simTimeMs) + (clock.paused ? ' [PAUSED]' : '');
  }

  const stock = getEffectiveStockpile(simHost.state);
  const city = getPrimaryCity(simHost.state);
  const resWoodEl  = document.getElementById('wgStockWood');
  const resStoneEl = document.getElementById('wgStockStone');
  const resFoodEl  = document.getElementById('wgStockFood');
  const resGoldEl  = document.getElementById('wgStockGold');
  const resWaterEl = document.getElementById('wgStockWater');
  const resOreEl   = document.getElementById('wgStockOre');
  const popEl      = document.getElementById('wgStockPop');

  if (resWoodEl  && resWoodEl.textContent  != String(stock.wood  || 0)) resWoodEl.textContent  = stock.wood  || 0;
  if (resStoneEl && resStoneEl.textContent != String(stock.stone || 0)) resStoneEl.textContent = stock.stone || 0;
  if (resFoodEl  && resFoodEl.textContent  != String(stock.food  || 0)) resFoodEl.textContent  = stock.food  || 0;
  if (resGoldEl  && resGoldEl.textContent  != String(stock.gold  || 0)) resGoldEl.textContent  = stock.gold  || 0;
  if (resWaterEl && resWaterEl.textContent != String(stock.water || 0)) resWaterEl.textContent = stock.water || 0;
  if (resOreEl   && resOreEl.textContent   != String(stock.ore   || 0)) resOreEl.textContent   = stock.ore   || 0;

  if (popEl && city) {
    const pop = computeCityPopulation(city, world);
    const popStr = pop.current + '/' + pop.max;
    if (popEl.textContent != popStr) popEl.textContent = popStr;
  }
}

export function syncWargameUI(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state) return;
  const state = simHost.state;

  const titleOverlay = document.getElementById('wgTitleScreenOverlay');
  const workspaceEl  = document.getElementById('wgCampaignWorkspace');

  // 1. Handle Start / Title Screen vs Active Campaign Workspace
  if (state.campaignPhase === CAMPAIGN_PHASES.TITLE || !state.world) {
    if (titleOverlay) titleOverlay.classList.remove('hidden');
    if (workspaceEl)  workspaceEl.classList.add('hidden');
    renderTitleScreenSummary(simHost);
    return;
  }

  if (titleOverlay) titleOverlay.classList.add('hidden');
  if (workspaceEl)  workspaceEl.classList.remove('hidden');

  const world = state.world;
  const clock = world.clock || { simTimeMs: 0, speedMultiplier: 1, paused: false };
  const primaryCity = getPrimaryCity(state);
  const stock = getEffectiveStockpile(state);

  // 2. Top Header Bar: Campaign Phase Badge, Clock, Speed Controls & Resource Stockpiles
  const houseEl = document.getElementById('wgHeaderHouseName');
  if (houseEl) houseEl.textContent = (world.player && world.player.houseName) || 'House Vanguard';

  const worldNameEl = document.getElementById('wgHeaderWorldName');
  if (worldNameEl) worldNameEl.textContent = world.name + ' (' + world.seedCode + ')';

  const phaseBadgeEl = document.getElementById('wgHeaderPhaseBadge');
  if (phaseBadgeEl) {
    if (state.campaignPhase === CAMPAIGN_PHASES.SETTLER_PIONEER) {
      phaseBadgeEl.textContent = 'Phase I: Pioneer Expedition';
      phaseBadgeEl.className = 'text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-bold';
    } else if (state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED) {
      phaseBadgeEl.textContent = 'Phase II: City Founding & Industry';
      phaseBadgeEl.className = 'text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40 font-bold';
    } else {
      phaseBadgeEl.textContent = 'Phase III: Guild & Vanguard Parties';
      phaseBadgeEl.className = 'text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/40 font-bold';
    }
  }

  const clockTextEl = document.getElementById('wgHeaderClockText');
  if (clockTextEl) {
    clockTextEl.textContent = formatWorldClock(clock.simTimeMs) + (clock.paused ? ' [PAUSED]' : '');
  }

  // Speed multiplier button highlights
  const speeds = [1, 2, 5];
  for (let i = 0; i < speeds.length; i++) {
    const sp = speeds[i];
    const btn = document.getElementById('wgBtnSpeed_' + sp + 'x');
    if (btn) {
      const isAct = !clock.paused && clock.speedMultiplier === sp;
      btn.className = isAct
        ? 'px-2 py-1 rounded text-xs font-mono font-bold bg-[#fbbf24] text-[#080b11]'
        : 'px-2 py-1 rounded text-xs font-mono font-semibold bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3]';
    }
  }
  const btnPause = document.getElementById('wgBtnPauseClock');
  if (btnPause) {
    btnPause.className = clock.paused
      ? 'px-2 py-1 rounded text-xs font-mono font-bold bg-[#f87171] text-[#080b11]'
      : 'px-2 py-1 rounded text-xs font-mono font-semibold bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3]';
  }

  // Stockpile counters
  const resWoodEl  = document.getElementById('wgStockWood');
  const resStoneEl = document.getElementById('wgStockStone');
  const resFoodEl  = document.getElementById('wgStockFood');
  const resGoldEl  = document.getElementById('wgStockGold');
  if (resWoodEl)  resWoodEl.textContent  = stock.wood  || 0;
  if (resStoneEl) resStoneEl.textContent = stock.stone || 0;
  if (resFoodEl)  resFoodEl.textContent  = stock.food  || 0;
  if (resGoldEl)  resGoldEl.textContent  = stock.gold  || 0;

  // 3. View Navigation Buttons (With Phase Gating!)
  const hasCity = Boolean(primaryCity);
  const hasGuildHall = Boolean(primaryCity && primaryCity.buildings && primaryCity.buildings.guild_hall >= 1);

  const btnViewOw    = document.getElementById('wgBtnViewOverworld');
  const btnViewCity  = document.getElementById('wgBtnViewCity');
  const btnViewGuild = document.getElementById('wgBtnViewGuild');

  if (btnViewOw) {
    btnViewOw.className = state.activeView === WARGAME_VIEWS.OVERWORLD
      ? 'px-3 py-1.5 text-xs font-bold rounded bg-[#fbbf24] text-[#080b11] shadow'
      : 'px-3 py-1.5 text-xs font-semibold rounded bg-[#1a2232] text-[#e6edf3] hover:bg-[#283347]';
  }
  if (btnViewCity) {
    btnViewCity.disabled = !hasCity;
    btnViewCity.textContent = hasCity ? ('🏰 ' + primaryCity.name) : '🔒 City (Found First)';
    btnViewCity.className = !hasCity
      ? 'px-3 py-1.5 text-xs font-semibold rounded bg-[#111722] text-[#475569] border border-[#1e293b] cursor-not-allowed'
      : (state.activeView === WARGAME_VIEWS.CITY
          ? 'px-3 py-1.5 text-xs font-bold rounded bg-[#fbbf24] text-[#080b11] shadow'
          : 'px-3 py-1.5 text-xs font-semibold rounded bg-[#1a2232] text-[#e6edf3] hover:bg-[#283347]');
  }
  if (btnViewGuild) {
    btnViewGuild.disabled = !hasGuildHall;
    btnViewGuild.textContent = hasGuildHall ? '⚔️ Adventurers Guild' : '🔒 Guild Hall (Build First)';
    btnViewGuild.className = !hasGuildHall
      ? 'px-3 py-1.5 text-xs font-semibold rounded bg-[#111722] text-[#475569] border border-[#1e293b] cursor-not-allowed'
      : (state.activeView === WARGAME_VIEWS.GUILD
          ? 'px-3 py-1.5 text-xs font-bold rounded bg-[#60a5fa] text-[#080b11] shadow'
          : 'px-3 py-1.5 text-xs font-semibold rounded bg-[#1a2232] text-[#e6edf3] hover:bg-[#283347]');
  }

  // Toggle center viewport panels
  const panelOw    = document.getElementById('wgPanelOverworld');
  const panelCity  = document.getElementById('wgPanelCity');
  const panelGuild = document.getElementById('wgPanelGuild');

  if (panelOw)    panelOw.classList.toggle('hidden', state.activeView !== WARGAME_VIEWS.OVERWORLD);
  if (panelCity)  panelCity.classList.toggle('hidden', state.activeView !== WARGAME_VIEWS.CITY);
  if (panelGuild) panelGuild.classList.toggle('hidden', state.activeView !== WARGAME_VIEWS.GUILD);

  // 4. Sync Left Sidebar: Expedition Units, Active Queues & Heroes Roster
  renderLeftCommandSidebar(simHost);

  // 5. Sync Center Active Viewport
  if (state.activeView === WARGAME_VIEWS.CITY) {
    renderCityBuilderPanel(simHost);
  } else if (state.activeView === WARGAME_VIEWS.GUILD) {
    renderGuildRecruitmentPanel(simHost);
  } else {
    renderOverworldHudBar(simHost);
  }

  // 6. Sync Right Sidebar: Reactive Task DAG & Live Streaming Event Feed
  renderRightTasksAndStreamSidebar(simHost);
}

export function renderTitleScreenSummary(simHost) {
  const continueBox = document.getElementById('wgContinueCampaignBox');
  const summaryEl   = document.getElementById('wgSavedCampaignSummary');
  if (!continueBox || !summaryEl) return;

  const summary = simHost.peekSavedSummary();
  if (!summary) {
    continueBox.classList.add('hidden');
  } else {
    continueBox.classList.remove('hidden');
    summaryEl.textContent = summary.houseName + ' • ' + summary.worldName + ' (' + summary.seedCode + ') • ' +
      summary.cityCount + ' Cities • ' + summary.heroCount + ' Heroes';
  }
}

export function renderLeftCommandSidebar(simHost) {
  const state = simHost.state;
  const world = state.world;
  const ow = world.overworld;
  const simTimeMs = world.clock.simTimeMs;

  // A. Selected Unit Inspector Card
  const selUnit = getSelectedOverworldUnit(state);
  const unitCardEl = document.getElementById('wgSelectedUnitCard');
  if (unitCardEl) {
    let newHtml = '';
    if (!selUnit || !selUnit.alive) {
      const hasCity = Object.keys(world.cities || {}).length > 0;
      if (!hasCity) {
        newHtml = `
          <div class="p-3 rounded bg-[#450a0a]/40 border border-[#f87171]/50 space-y-2">
            <div class="text-xs font-bold text-[#f87171]">Pioneer Settler Lost</div>
            <p class="text-[11px] text-[#e6edf3]">Your initial pioneer column was lost before founding a city. Call forth a new settler column at the safe starting vale.</p>
            <button data-action="respawn-settler" onclick="window.WargameApp.handleRespawnSettler()" class="w-full py-1.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase cursor-pointer">🚩 Respawn Pioneer Settler</button>
          </div>
        `;
      } else {
        newHtml = `
          <div class="p-3 rounded bg-[#080b11] border border-[#283347] text-xs text-[#8b949e]">
            <div class="font-bold text-[#fbbf24] mb-1">🏰 Pioneer Settler Settled</div>
            <p class="text-[11px]">Your Pioneer Settler founded your primary Bastion. Construct the <strong>Adventurers Guild Hall</strong> in your city to recruit Hero Parties for Overworld exploration and dungeon delving!</p>
          </div>
        `;
      }
    } else {
      const tId = ow.tiles[selUnit.y][selUnit.x];
      const tDef = OVERWORLD_TERRAIN_DEFS[tId];
      const canFoundHere = Boolean(selUnit.canFoundCity && tDef && tDef.buildable);
      let marchHtml = '';
      if (selUnit.status === 'marching' && selUnit.marchPlan) {
        const remSteps = selUnit.marchPlan.remainingPath ? selUnit.marchPlan.remainingPath.length : 0;
        const stepRemMs = Math.max(0, (selUnit.marchPlan.stepDueSimTimeMs || 0) - simTimeMs);
        marchHtml = `
          <div class="p-2 rounded bg-[#111722] border border-[#38bdf8]/40 space-y-1">
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span class="text-[#38bdf8] font-bold">⏳ Marching to (${selUnit.marchPlan.targetX}, ${selUnit.marchPlan.targetY})</span>
              <span class="text-[#fbbf24]">${remSteps} tiles left</span>
            </div>
            <div class="text-[10px] text-[#8b949e] font-mono">Next tile in ${formatSimDuration(stepRemMs)}</div>
            <button data-action="cancel-march" onclick="window.WargameApp.handleCancelMarch()" class="w-full mt-1 py-1 rounded bg-[#1a2232] hover:bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40 text-[10px] font-mono font-bold cursor-pointer">✕ Halt March</button>
          </div>
        `;
      } else {
        marchHtml = `
          <div class="text-[11px] text-[#34d399] font-mono">Status: Ready for Orders at (${selUnit.x}, ${selUnit.y})</div>
        `;
      }

      newHtml = `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">${selUnit.unitType === 'settler' ? '🚩' : '⚔️'}</span>
              <div>
                <div class="text-xs font-bold text-[#e6edf3]">${selUnit.name}</div>
                <div class="text-[10px] font-mono text-[#8b949e]">Terrain: <span class="text-[#84cc16]">${tDef ? tDef.name : 'Plains'}</span> • Vision ${selUnit.visionRadius}</div>
              </div>
            </div>
            <span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#111722] text-[#34d399] border border-[#283347]">HP ${selUnit.hp}/${selUnit.maxHp}</span>
          </div>
          ${marchHtml}
          ${selUnit.canFoundCity ? `
            <button data-action="found-city" onclick="window.WargameApp.handleFoundCity()" ${!canFoundHere ? 'disabled' : ''} class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow ${canFoundHere ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
              🏰 Found Bastion City Here
            </button>
          ` : ''}
        </div>
      `;
    }

    setHtmlIfChanged(unitCardEl, newHtml);
  }

  // B. Active Timed Queues Summary (Construction, Recruitment, and Marching)
  const queuesListEl = document.getElementById('wgActiveQueuesList');
  if (queuesListEl) {
    const sectionsHtml = [];

    // 1. City Construction & Demolition Queue
    const cities = Object.values(world.cities || {});
    for (let c = 0; c < cities.length; c++) {
      const city = cities[c];
      const bq = city.buildQueue || [];
      if (bq.length > 0) {
        const buildItems = [];
        for (let q = 0; q < bq.length; q++) {
          const item = bq[q];
          const isMove = item.type === 'move';
          const isDemolish = item.type === 'demolish';
          const isCleanup = item.type === 'cleanup';
          if (item.status === 'building' || item.status === 'demolishing' || item.status === 'moving') {
            const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
            const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
            const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
            const label = isMove
              ? ('↔ Moving ' + item.buildingName)
              : (isDemolish
                  ? ('🔥 Demolishing ' + item.buildingName)
                  : (isCleanup ? ('🧹 Cleaning Site ' + item.buildingName) : ('🔨 ' + item.buildingName + ' (Lv ' + item.targetLevel + ')')));
            const barColor = isMove ? 'bg-[#38bdf8]' : (isDemolish ? 'bg-[#f87171]' : (isCleanup ? 'bg-[#94a3b8]' : 'bg-[#fbbf24]'));

            buildItems.push(`
              <div class="p-2 rounded bg-[#080b11] border ${isMove ? 'border-[#38bdf8]/50' : (isDemolish ? 'border-[#f87171]/50' : 'border-[#fbbf24]/50')} space-y-1">
                <div class="flex justify-between items-center text-[11px] font-mono">
                  <span class="${isMove ? 'text-[#38bdf8]' : (isDemolish ? 'text-[#f87171]' : 'text-[#fbbf24]')} font-bold">${label}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#34d399]">${formatSimDuration(rem)}</span>
                    ${!isCleanup ? `
                      <button data-action="cancel-building" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelBuilding('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] ml-1 cursor-pointer">✕</button>
                    ` : ''}
                  </div>
                </div>
                <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
                  <div class="h-full ${barColor}" style="width:${pct}%"></div>
                </div>
              </div>
            `);
          } else {
            const qLabel = isMove
              ? ('⏳ Queued Move: ' + item.buildingName)
              : (isDemolish
                  ? ('⏳ Queued Demolish: ' + item.buildingName)
                  : ('⏳ Queued: ' + item.buildingName + ' (Lv ' + item.targetLevel + ')'));
            buildItems.push(`
              <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex justify-between items-center text-[11px] font-mono">
                <span class="text-[#8b949e]">${qLabel}</span>
                <button data-action="cancel-building" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelBuilding('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] cursor-pointer">Cancel</button>
              </div>
            `);
          }
        }
        sectionsHtml.push(`
          <div class="space-y-1">
            <div class="text-[10px] font-mono uppercase text-[#fbbf24] font-bold">🏗️ Build Queue (${bq.length}/${city.maxBuildQueueSlots || 3})</div>
            ${buildItems.join('')}
          </div>
        `);
      }
    }

    // 2. Hero Recruitment Queue
    for (let c = 0; c < cities.length; c++) {
      const city = cities[c];
      const rq = city.recruitmentQueue || [];
      if (rq.length > 0) {
        const recruitItems = [];
        for (let q = 0; q < rq.length; q++) {
          const item = rq[q];
          if (item.status === 'training') {
            const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
            const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
            const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
            recruitItems.push(`
              <div class="p-2 rounded bg-[#080b11] border border-[#60a5fa]/50 space-y-1">
                <div class="flex justify-between items-center text-[11px] font-mono">
                  <span class="text-[#60a5fa] font-bold">⚔️ Training: ${item.heroName || item.className}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#34d399]">${formatSimDuration(rem)}</span>
                    <button data-action="cancel-recruitment" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelRecruitment('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] ml-1 cursor-pointer">✕</button>
                  </div>
                </div>
                <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
                  <div class="h-full bg-[#60a5fa]" style="width:${pct}%"></div>
                </div>
              </div>
            `);
          } else {
            recruitItems.push(`
              <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex justify-between items-center text-[11px] font-mono">
                <span class="text-[#8b949e]">⏳ Queued: ${item.heroName || item.className}</span>
                <button data-action="cancel-recruitment" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelRecruitment('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] cursor-pointer">Cancel</button>
              </div>
            `);
          }
        }
        sectionsHtml.push(`
          <div class="space-y-1">
            <div class="text-[10px] font-mono uppercase text-[#60a5fa] font-bold">🛡️ Hero Training (${rq.length}/${city.maxRecruitQueueSlots || 3})</div>
            ${recruitItems.join('')}
          </div>
        `);
      }
    }

    // 3. Unit Marches
    const units = ow.units || [];
    const marchItems = [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.alive && u.status === 'marching' && u.marchPlan) {
        const dur = Math.max(1, (u.marchPlan.stepDueSimTimeMs || 0) - (u.marchPlan.stepStartSimTimeMs || 0));
        const rem = Math.max(0, (u.marchPlan.stepDueSimTimeMs || 0) - simTimeMs);
        const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
        marchItems.push(`
          <div class="p-2 rounded bg-[#080b11] border border-[#38bdf8]/40 space-y-1">
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#38bdf8] font-bold">🚩 ${u.shortName} → (${u.marchPlan.targetX}, ${u.marchPlan.targetY})</span>
              <span class="text-[#fbbf24]">${formatSimDuration(rem)}</span>
            </div>
            <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
              <div class="h-full bg-[#38bdf8]" style="width:${pct}%"></div>
            </div>
          </div>
        `);
      }
    }
    if (marchItems.length > 0) {
      sectionsHtml.push(`
        <div class="space-y-1">
          <div class="text-[10px] font-mono uppercase text-[#38bdf8] font-bold">🗺️ Unit Marches</div>
          ${marchItems.join('')}
        </div>
      `);
    }

    const newQueuesHtml = sectionsHtml.length > 0
      ? sectionsHtml.join('')
      : `<div class="text-[11px] text-[#8b949e] italic py-1">No active construction, training, or march timers.</div>`;
    setHtmlIfChanged(queuesListEl, newQueuesHtml);
  }

  // C. Recruited Heroes & Parties Roster (Only visible/populated once Guild Hall exists)
  const heroesListEl = document.getElementById('wgHeroesRosterList');
  if (heroesListEl) {
    const heroes = world.heroes || [];
    let newHeroesHtml = '';
    if (heroes.length === 0) {
      newHeroesHtml = `
        <div class="text-[11px] text-[#8b949e] italic py-1">
          No Dungeon Heroes recruited yet. Found a city and construct the <strong>Adventurers Guild Hall</strong> to recruit your first Hero!
        </div>
      `;
    } else {
      newHeroesHtml = heroes.map(function(h) {
        return `
          <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span>${h.icon}</span>
              <div>
                <div class="font-bold" style="color:${h.color}">${h.name}</div>
                <div class="text-[10px] font-mono text-[#8b949e]">Lv ${h.level} ${h.className} • HP ${h.stats.hp} • ATK ${h.stats.atk}</div>
              </div>
            </div>
            <button data-action="select-party" data-hero-id="${h.id}" onclick="window.WargameApp.handleSelectPartyByHero('${h.id}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#60a5fa] text-[10px] font-mono font-bold cursor-pointer">Select Party</button>
          </div>
        `;
      }).join('');
    }
    setHtmlIfChanged(heroesListEl, newHeroesHtml);
  }
}

export function renderOverworldHudBar(simHost) {
  const state = simHost.state;
  const ow = state.world.overworld;
  const selUnit = getSelectedOverworldUnit(state);
  const primaryCity = getPrimaryCity(state);

  const coordEl = document.getElementById('wgOverworldCoordText');
  if (coordEl) {
    if (selUnit && selUnit.alive) {
      coordEl.textContent = '(' + selUnit.x + ', ' + selUnit.y + ')';
    } else if (primaryCity) {
      coordEl.textContent = '(' + primaryCity.x + ', ' + primaryCity.y + ')';
    }
  }

  const dngBtn = document.getElementById('wgBtnEnterDungeon');
  if (dngBtn) {
    let canEnterDng = false;
    if (selUnit && selUnit.alive && selUnit.canEnterDungeon && Array.isArray(ow.pois)) {
      const dngPoi = ow.pois.find(function(p) { return p.type === 'dungeon_entrance'; });
      if (dngPoi && Math.hypot(selUnit.x - dngPoi.x, selUnit.y - dngPoi.y) <= 1.5) {
        canEnterDng = true;
      }
    }
    dngBtn.disabled = !canEnterDng;
    dngBtn.className = canEnterDng
      ? 'px-3 py-1.5 rounded-lg bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-bold text-xs uppercase shadow cursor-pointer'
      : 'px-3 py-1.5 rounded-lg bg-[#1a2232] text-[#64748b] font-bold text-xs uppercase border border-[#283347] cursor-not-allowed';
  }
}

export function renderCityBuilderPanel(simHost) {
  const state = simHost.state;
  const city = getPrimaryCity(state);
  const gridEl = document.getElementById('wgCityPlotsGrid');
  const inspectorEl = document.getElementById('wgCityPlotInspector');
  if (!city || !gridEl) return;

  const titleEl = document.getElementById('wgCityPanelTitle');
  if (titleEl) titleEl.textContent = city.name + ' — 8x8 Spatial Grid';

  const moveBannerEl = document.getElementById('wgCityMoveModeBanner');
  const moveSourceIdx = typeof state._moveSourcePlotIndex === 'number' ? state._moveSourcePlotIndex : null;
  if (moveBannerEl) {
    if (moveSourceIdx !== null) moveBannerEl.classList.remove('hidden');
    else moveBannerEl.classList.add('hidden');
  }

  const selectedIdx = typeof city.selectedPlotIndex === 'number' ? city.selectedPlotIndex : 27;
  const plots = city.plots || [];

  // 1. Render 8x8 Spatial Grid Tiles (64 plots)
  const tilesHtml = [];
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const px = plot.x !== undefined ? plot.x : (plot.plotIndex % 8);
    const py = plot.y !== undefined ? plot.y : Math.floor(plot.plotIndex / 8);
    const bId = plot.buildingId;
    const bDef = bId ? CITY_BUILDINGS_CATALOG[bId] : null;

    const isSelected = (plot.plotIndex === selectedIdx);
    const isMoveSource = (plot.plotIndex === moveSourceIdx);

    let borderClass = 'border-slate-800 bg-[#080b11]/80 hover:bg-[#111722] hover:border-slate-600';
    let icon = '<span class="opacity-20 text-[10px]">+</span>';
    let label = `<span class="text-[7px] font-mono text-slate-500 leading-none">(${px},${py})</span>`;

    if (isMoveSource) {
      borderClass = 'border-2 border-sky-400 bg-sky-950/40 animate-pulse';
      icon = '↔';
      label = `<span class="text-[7px] font-mono text-sky-400 font-bold leading-none">MOVE</span>`;
    } else if (plot.relocating) {
      borderClass = 'border border-sky-500 bg-sky-950/30 animate-pulse';
      icon = '↔';
      label = `<span class="text-[7px] font-mono text-sky-400 font-bold leading-none">MOVE</span>`;
    } else if (plot.demolishing) {
      borderClass = 'border border-red-500 bg-red-950/30 animate-pulse';
      icon = '🔥';
      label = `<span class="text-[7px] font-mono text-red-400 font-bold leading-none">DEMO</span>`;
    } else if (plot.underConstruction) {
      borderClass = 'border border-amber-400 bg-amber-950/30 animate-pulse';
      icon = '🔨';
      label = `<span class="text-[7px] font-mono text-amber-400 font-bold leading-none">BUILD</span>`;
    } else if (bId === 'town_hall') {
      borderClass = 'border-2 border-amber-400 bg-amber-950/20 shadow';
      icon = bDef ? bDef.icon : '🏰';
      label = `<span class="text-[7px] font-mono text-amber-400 font-bold leading-none">Keep ${plot.level}</span>`;
    } else if (bDef) {
      borderClass = 'border border-emerald-500/50 bg-[#111722] hover:border-emerald-400';
      icon = bDef.icon;
      label = `<span class="text-[7px] font-mono font-bold leading-none" style="color:${bDef.color || '#4ade80'}">Lv ${plot.level}</span>`;
    }

    const ringClass = isSelected ? 'ring-2 ring-amber-400 shadow-md shadow-amber-400/20 z-10' : '';

    tilesHtml.push(`
      <button data-action="select-plot" data-plot-index="${plot.plotIndex}" onclick="window.WargameApp.handleSelectCityPlot(${plot.plotIndex})" class="aspect-square rounded-md p-1 flex flex-col items-center justify-between transition-all cursor-pointer relative ${borderClass} ${ringClass}">
        <div class="w-full flex justify-between items-center text-[7px] font-mono text-slate-500 leading-none">
          <span>${plot.plotIndex}</span>
        </div>
        <div class="text-sm select-none leading-none my-auto">${icon}</div>
        ${label}
      </button>
    `);
  }
  setHtmlIfChanged(gridEl, tilesHtml.join(''));

  // 2. Render Plot Inspector & Action Operations Hub
  if (!inspectorEl) return;
  const selPlot = plots.find(function(p) { return p.plotIndex === selectedIdx; }) || plots[27] || plots[0];
  if (!selPlot) return;

  const spX = selPlot.x !== undefined ? selPlot.x : (selPlot.plotIndex % 8);
  const spY = selPlot.y !== undefined ? selPlot.y : Math.floor(selPlot.plotIndex / 8);
  const curBId = selPlot.buildingId;
  const curBDef = curBId ? CITY_BUILDINGS_CATALOG[curBId] : null;

  let inspectorHtml = `
    <div class="flex items-center justify-between border-b border-[#283347] pb-2.5">
      <div>
        <div class="text-xs font-bold text-[#e6edf3]">Plot #${selPlot.plotIndex} — Coordinates (${spX}, ${spY})</div>
        <div class="text-[10px] font-mono text-[#8b949e]">Central Bastion Territory</div>
      </div>
      <div>
        ${selPlot.underConstruction ? `
          <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/40 text-[10px] font-mono font-bold">🔨 Under Construction</span>
        ` : selPlot.demolishing ? `
          <span class="px-2 py-0.5 rounded bg-red-400/20 text-red-400 border border-red-400/40 text-[10px] font-mono font-bold">🔥 Demolishing</span>
        ` : selPlot.relocating ? `
          <span class="px-2 py-0.5 rounded bg-sky-400/20 text-sky-400 border border-sky-400/40 text-[10px] font-mono font-bold">↔ Relocating</span>
        ` : curBDef ? `
          <span class="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-400/40 text-[10px] font-mono font-bold">Active Structure</span>
        ` : `
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">Empty Plot</span>
        `}
      </div>
    </div>
  `;

  // Case A: Plot has an active order (underConstruction, demolishing, relocating)
  if (selPlot.underConstruction || selPlot.demolishing || selPlot.relocating) {
    const activeItem = (city.buildQueue || []).find(function(q) {
      return q.plotIndex === selPlot.plotIndex || q.fromPlotIndex === selPlot.plotIndex || q.toPlotIndex === selPlot.plotIndex;
    });
    const rem = activeItem && activeItem.dueSimTimeMs ? Math.max(0, activeItem.dueSimTimeMs - simHost.state.world.clock.simTimeMs) : 0;
    const dur = activeItem && activeItem.durationMs ? activeItem.durationMs : 4000;
    const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));

    inspectorHtml += `
      <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#283347] space-y-2.5">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-amber-400 font-bold">${activeItem ? activeItem.buildingName : 'Active Order'}</span>
          <span class="text-emerald-400 font-bold">${formatSimDuration(rem)}</span>
        </div>
        <div class="w-full h-2 bg-[#111722] rounded-full overflow-hidden">
          <div class="h-full bg-amber-400" style="width:${pct}%"></div>
        </div>
        <div class="text-[11px] text-[#8b949e]">
          ${selPlot.relocating ? 'Workers are preparing foundation stones and safely relocating structural timbers.' :
            selPlot.demolishing ? 'Demolition crew is dismantling structure and reclaiming 35% salvage materials.' :
            'Artisans and laborers are constructing facility in accordance with realm blueprints.'}
        </div>
        ${activeItem && activeItem.type !== 'cleanup' ? `
          <button data-action="cancel-building" data-queue-item-id="${activeItem.queueItemId}" onclick="window.WargameApp.handleCancelBuilding('${activeItem.queueItemId}')" class="w-full py-1.5 rounded bg-[#1a2232] hover:bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold cursor-pointer">
            ✕ Cancel Order
          </button>
        ` : ''}
      </div>
    `;
  }
  // Case B: Plot has an existing structure
  else if (curBDef) {
    const curLevel = selPlot.level || 1;
    const nextLevel = curLevel + 1;
    const isMax = nextLevel > (curBDef.maxLevel || 5);
    const upgradeCost = computeBuildingUpgradeCost(curBId, nextLevel);
    const upgradeDurMs = computeBuildingDurationMs(curBId, nextLevel);

    const meetingHallLevel = Math.max(
      (city.buildings && city.buildings.meeting_hall) || 0,
      (city.buildings && city.buildings.town_hall) || 0,
      1
    );
    const blockedByMeetingHall = (curBId !== 'meeting_hall' && curBId !== 'town_hall' && nextLevel > meetingHallLevel);

    const canAfford = (city.stockpile.wood  || 0) >= (upgradeCost.wood  || 0) &&
                      (city.stockpile.stone || 0) >= (upgradeCost.stone || 0) &&
                      (city.stockpile.gold  || 0) >= (upgradeCost.gold  || 0) &&
                      (city.stockpile.water || 0) >= (upgradeCost.water || 0) &&
                      (city.stockpile.ore   || 0) >= (upgradeCost.ore   || 0);

    let isAdjacentToWindmill = false;
    if (Array.isArray(plots)) {
      const nbs = [
        { x: spX + 1, y: spY },
        { x: spX - 1, y: spY },
        { x: spX, y: spY + 1 },
        { x: spX, y: spY - 1 }
      ];
      for (let n = 0; n < nbs.length; n++) {
        const nb = nbs[n];
        if (nb.x >= 0 && nb.x < 8 && nb.y >= 0 && nb.y < 8) {
          const np = plots[nb.y * 8 + nb.x];
          if (np && np.buildingId === 'windmill' && (np.level || 0) > 0 && !np.underConstruction && !np.demolishing) {
            isAdjacentToWindmill = true;
            break;
          }
        }
      }
    }

    const prodEntries = Object.entries(curBDef.productionPerTick || {});
    let prodText = 'Special Facility';
    if (prodEntries.length > 0) {
      const mult = isAdjacentToWindmill ? 1.20 : 1.0;
      prodText = prodEntries.map(function(e) {
        const val = Math.round(e[1] * curLevel * mult);
        return '+' + val + ' ' + e[0];
      }).join(', ') + ' / tick';
    } else if (curBDef.providesPopulation) {
      prodText = '+' + (curBDef.providesPopulation * curLevel) + ' Pop Cap';
    } else if (curBDef.storageBonus) {
      prodText = Object.entries(curBDef.storageBonus).map(function(e) { return '+' + (e[1] * curLevel) + ' ' + e[0] + ' Cap'; }).join(', ');
    } else if (curBDef.adjacencyBonus) {
      prodText = '+20% Adjacent Production';
    }

    inspectorHtml += `
      <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#283347] space-y-3">
        <div class="flex items-start gap-3">
          <span class="text-3xl">${curBDef.icon}</span>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div class="text-sm font-bold text-[#e6edf3]">${curBDef.name} <span class="text-xs font-mono text-emerald-400 font-semibold">(Level ${curLevel})</span></div>
              ${isAdjacentToWindmill ? `<span class="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold">💨 Windmill +20%</span>` : ''}
            </div>
            <div class="text-[10px] font-mono uppercase text-[#8b949e]">${curBDef.category} • Yield: <span class="text-[#38bdf8]">${prodText}</span></div>
            <p class="text-[11px] text-[#8b949e] mt-1">${curBDef.desc}</p>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-[#1e293b]">
          <!-- Upgrade Action -->
          ${!isMax ? `
            <div class="p-2.5 rounded bg-[#111722] border border-[#283347] space-y-1.5">
              <div class="flex justify-between items-center text-[11px] font-mono">
                <span class="text-[#e6edf3] font-bold">Upgrade to Level ${nextLevel}</span>
                <span class="text-[#38bdf8]">⏱ ${formatSimDuration(upgradeDurMs)}</span>
              </div>
              <div class="text-[10px] font-mono text-[#8b949e]">
                Cost: ${upgradeCost.wood} Wood • ${upgradeCost.stone} Stone • ${upgradeCost.gold} Gold${upgradeCost.water ? (' • ' + upgradeCost.water + ' Water') : ''}${upgradeCost.ore ? (' • ' + upgradeCost.ore + ' Ore') : ''}
              </div>
              ${blockedByMeetingHall ? `
                <div class="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/30 p-1.5 rounded border border-amber-500/30">
                  ⚠️ Capped by Meeting Hall (Lv ${meetingHallLevel}). Upgrade Meeting Hall first!
                </div>
              ` : ''}
              <button data-action="queue-building" data-plot-index="${selPlot.plotIndex}" data-building-id="${curBId}" onclick="window.WargameApp.handleQueueBuilding(${selPlot.plotIndex}, '${curBId}')" ${(!canAfford || blockedByMeetingHall) ? 'disabled' : ''} class="w-full py-1.5 rounded font-bold text-xs uppercase cursor-pointer ${canAfford && !blockedByMeetingHall ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                ${blockedByMeetingHall ? ('Requires Meeting Hall Lv ' + nextLevel) : '▲ Upgrade Structure'}
              </button>
            </div>
          ` : `
            <div class="p-2 rounded bg-[#111722] text-center text-xs font-mono text-amber-400">★ Maximum Level Reached</div>
          `}

          <!-- Move & Demolish Action Row -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button data-action="start-move-mode" data-plot-index="${selPlot.plotIndex}" onclick="window.WargameApp.handleStartMoveMode(${selPlot.plotIndex})" class="py-1.5 px-2 rounded bg-[#1a2232] hover:bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[11px] font-mono font-bold cursor-pointer text-center">
              ↔ Relocate (2.5s)
            </button>
            ${(curBId !== 'town_hall' && curBId !== 'meeting_hall') ? `
              <button data-action="demolish-building" data-plot-index="${selPlot.plotIndex}" onclick="window.WargameApp.handleDemolishBuilding(${selPlot.plotIndex})" class="py-1.5 px-2 rounded bg-[#1a2232] hover:bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-mono font-bold cursor-pointer text-center">
                🔥 Demolish (35%)
              </button>
            ` : `
              <div class="py-1.5 px-2 rounded bg-slate-900 text-slate-600 border border-slate-800 text-[10px] font-mono text-center flex items-center justify-center">
                Locked Citadel
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
  // Case C: Empty Plot — Construct Facility Catalog
  else {
    if (moveSourceIdx !== null) {
      inspectorHtml += `
        <div class="p-4 rounded-lg bg-sky-950/30 border border-sky-500/50 text-center space-y-3">
          <div class="text-base">↔</div>
          <div class="text-xs font-bold text-sky-300">Relocate to Plot (${spX}, ${spY})?</div>
          <p class="text-[11px] text-[#8b949e]">Click below to confirm moving the structure from Plot #${moveSourceIdx} to this empty plot.</p>
          <div class="flex gap-2 justify-center">
            <button data-action="select-plot" data-plot-index="${selPlot.plotIndex}" onclick="window.WargameApp.handleSelectCityPlot(${selPlot.plotIndex})" class="py-1.5 px-4 rounded bg-sky-400 hover:bg-sky-300 text-slate-900 font-bold text-xs uppercase cursor-pointer">
              ✓ Confirm Relocation
            </button>
            <button data-action="cancel-move-mode" onclick="window.WargameApp.handleCancelMoveMode()" class="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      `;
    } else {
      let isAdjacentToWindmill = false;
      if (Array.isArray(plots)) {
        const nbs = [
          { x: spX + 1, y: spY },
          { x: spX - 1, y: spY },
          { x: spX, y: spY + 1 },
          { x: spX, y: spY - 1 }
        ];
        for (let n = 0; n < nbs.length; n++) {
          const nb = nbs[n];
          if (nb.x >= 0 && nb.x < 8 && nb.y >= 0 && nb.y < 8) {
            const np = plots[nb.y * 8 + nb.x];
            if (np && np.buildingId === 'windmill' && (np.level || 0) > 0 && !np.underConstruction && !np.demolishing) {
              isAdjacentToWindmill = true;
              break;
            }
          }
        }
      }

      // Hide town_hall / meeting_hall from empty plot catalog (central citadel only) and redundant aliases
      const constructibleKeys = Object.keys(CITY_BUILDINGS_CATALOG).filter(function(k) {
        return k !== 'town_hall' && k !== 'meeting_hall' && k !== 'farmstead' && k !== 'sawmill';
      });

      const catalogCards = constructibleKeys.map(function(bId) {
        const bDef = CITY_BUILDINGS_CATALOG[bId];
        const cost = computeBuildingUpgradeCost(bId, 1);
        const durMs = computeBuildingDurationMs(bId, 1);

        // Check prerequisites
        let reqMet = true;
        let reqLabel = '';
        if (bDef.requires) {
          const rKeys = Object.keys(bDef.requires);
          for (let r = 0; r < rKeys.length; r++) {
            const reqB = rKeys[r];
            const reqLvl = bDef.requires[reqB];
            let curReqLvl = 0;
            if (reqB === 'meeting_hall' || reqB === 'town_hall') {
              curReqLvl = Math.max((city.buildings && city.buildings.meeting_hall) || 0, (city.buildings && city.buildings.town_hall) || 0);
            } else if (reqB === 'garden' || reqB === 'farmstead') {
              curReqLvl = Math.max((city.buildings && city.buildings.garden) || 0, (city.buildings && city.buildings.farmstead) || 0);
            } else if (reqB === 'lumber_hut' || reqB === 'sawmill') {
              curReqLvl = Math.max((city.buildings && city.buildings.lumber_hut) || 0, (city.buildings && city.buildings.sawmill) || 0);
            } else {
              curReqLvl = (city.buildings && city.buildings[reqB]) || 0;
            }
            if (curReqLvl < reqLvl) {
              reqMet = false;
              const reqDef = CITY_BUILDINGS_CATALOG[reqB];
              reqLabel = 'Requires ' + (reqDef ? reqDef.name : reqB) + ' Lv ' + reqLvl;
              break;
            }
          }
        }

        const canAfford = (city.stockpile.wood  || 0) >= (cost.wood  || 0) &&
                          (city.stockpile.stone || 0) >= (cost.stone || 0) &&
                          (city.stockpile.gold  || 0) >= (cost.gold  || 0) &&
                          (city.stockpile.water || 0) >= (cost.water || 0) &&
                          (city.stockpile.ore   || 0) >= (cost.ore   || 0);

        return `
          <div class="p-2.5 rounded bg-[#080b11] border ${reqMet ? 'border-[#283347]' : 'border-slate-800 opacity-60'} flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-xl">${bDef.icon}</span>
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#e6edf3] truncate">${bDef.name}</div>
                <div class="text-[10px] font-mono text-[#8b949e]">
                  ${cost.wood}W • ${cost.stone}S${cost.gold ? (' • ' + cost.gold + 'G') : ''}${cost.water ? (' • ' + cost.water + '💧') : ''}${cost.ore ? (' • ' + cost.ore + '⛏️') : ''} • ⏱ ${formatSimDuration(durMs)}
                </div>
                ${!reqMet ? `<div class="text-[9px] font-mono text-red-400 font-semibold">${reqLabel}</div>` : ''}
              </div>
            </div>
            <button data-action="queue-building" data-plot-index="${selPlot.plotIndex}" data-building-id="${bId}" onclick="window.WargameApp.handleQueueBuilding(${selPlot.plotIndex}, '${bId}')" ${(!reqMet || !canAfford) ? 'disabled' : ''} class="px-3 py-1.5 rounded font-bold text-[11px] uppercase whitespace-nowrap cursor-pointer ${reqMet && canAfford ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
              🔨 Build
            </button>
          </div>
        `;
      }).join('');

      inspectorHtml += `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#fbbf24] uppercase tracking-wider">Construct New Facility</span>
            ${isAdjacentToWindmill ? `<span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold">💨 Windmill +20% Bonus Zone</span>` : ''}
          </div>
          <div class="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            ${catalogCards}
          </div>
        </div>
      `;
    }
  }

  setHtmlIfChanged(inspectorEl, inspectorHtml);
}

export function renderGuildRecruitmentPanel(simHost) {
  const state = simHost.state;
  const city = getPrimaryCity(state);
  const gridEl = document.getElementById('wgGuildClassesGrid');
  if (!city || !gridEl) return;

  const newGuildHtml = RECRUITABLE_HERO_CLASSES.map(function(cls) {
    const canAfford = (city.stockpile.gold || 0) >= cls.costGold && (city.stockpile.food || 0) >= cls.costFood;
    return `
      <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#283347] flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-base font-bold" style="color:${cls.color}">${cls.icon} ${cls.name}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a2232] text-[#fbbf24]">${cls.title}</span>
          </div>
          <p class="text-[11px] text-[#8b949e] mt-1">${cls.specialty}</p>
          <div class="grid grid-cols-4 gap-1 text-center font-mono text-[10px] mt-2.5 bg-[#111722] p-1.5 rounded border border-[#283347]">
            <div>STR <strong>${cls.baseStats.str}</strong></div>
            <div>DEX <strong>${cls.baseStats.dex}</strong></div>
            <div>INT <strong>${cls.baseStats.int}</strong></div>
            <div>VIT <strong>${cls.baseStats.vit}</strong></div>
          </div>
        </div>
        <div class="space-y-1.5 pt-2 border-t border-[#1e293b]">
          <div class="text-[11px] font-mono text-[#fbbf24]">Oath Cost: <strong>${cls.costGold} Gold</strong> • <strong>${cls.costFood} Food</strong></div>
          <button data-action="recruit-hero" data-class-id="${cls.classId}" onclick="window.WargameApp.handleRecruitHero('${cls.classId}')" ${!canAfford ? 'disabled' : ''} class="w-full py-1.5 rounded font-bold text-xs uppercase ${canAfford ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ⚔️ Train ${cls.name} (60s)
          </button>
        </div>
      </div>
    `;
  }).join('');

  setHtmlIfChanged(gridEl, newGuildHtml);
}

export function renderRightTasksAndStreamSidebar(simHost) {
  const state = simHost.state;

  // 1. Reactive Guided Tasks DAG List
  const tasksEl = document.getElementById('wgGuidedTasksList');
  if (tasksEl) {
    const tasks = getFormattedTasksList(state);
    const newTasksHtml = tasks.map(function(t) {
      if (t.status === 'locked') {
        return `
          <div class="p-2.5 rounded bg-[#080b11]/60 border border-[#1e293b] opacity-55 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-[#64748b]">🔒 ${t.title}</span>
              <span class="text-[10px] font-mono text-[#475569]">Locked</span>
            </div>
          </div>
        `;
      }
      if (t.status === 'claimed') {
        return `
          <div class="p-2 rounded bg-[#080b11] border border-[#34d399]/30 flex items-center justify-between text-xs">
            <span class="text-[#34d399] font-semibold">✓ ${t.title}</span>
            <span class="text-[10px] font-mono text-[#8b949e]">Claimed</span>
          </div>
        `;
      }
      return `
        <div class="p-2.5 rounded bg-[#080b11] border ${t.readyToClaim ? 'border-[#34d399]' : 'border-[#38bdf8]/50'} space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[#e6edf3]">${t.title}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111722] text-[#38bdf8]">${t.progress}/${t.target}</span>
          </div>
          <p class="text-[11px] text-[#8b949e]">${t.desc}</p>
          <div class="flex items-center justify-between pt-1">
            <span class="text-[10px] font-mono text-[#fbbf24]">Reward: ${t.rewardLabel}</span>
            ${t.readyToClaim ? `
              <button data-action="claim-task" data-task-id="${t.id}" onclick="window.WargameApp.handleClaimTask('${t.id}')" class="px-2.5 py-1 rounded bg-[#34d399] hover:bg-[#10b981] text-[#080b11] font-bold text-[10px] uppercase animate-pulse cursor-pointer">
                ✨ Claim Reward
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    setHtmlIfChanged(tasksEl, newTasksHtml);
  }

  // 2. Live Streaming Event Log
  const streamEl = document.getElementById('wgEventStreamFeed');
  if (streamEl && simHost.eventStream) {
    const events = simHost.eventStream.getRecentEvents(30);
    const newStreamHtml = events.slice().reverse().map(function(ev) {
      return `
        <div class="py-1 border-b border-[#1a2232]/60 text-[11px] font-mono">
          <span class="text-[#64748b]">[#${ev.seqId}]</span>
          <span class="text-[#38bdf8] font-semibold">${ev.topic}</span>
          <span class="text-[#cbd5e1]">${formatEventSummary(ev)}</span>
        </div>
      `;
    }).join('');

    setHtmlIfChanged(streamEl, newStreamHtml);
  }
}

export function formatEventSummary(ev) {
  const p = ev.payload || {};
  if (ev.topic === STREAM_TOPICS.CAMPAIGN_STARTED) {
    return '— ' + p.houseName + ' entered ' + p.worldName + ' (' + p.seedCode + ')';
  }
  if (ev.topic === STREAM_TOPICS.UNIT_MARCH_STARTED) {
    return '— ' + p.unitName + ' marching to (' + p.targetX + ',' + p.targetY + ') [' + p.stepsCount + ' tiles]';
  }
  if (ev.topic === STREAM_TOPICS.UNIT_MARCH_STEP) {
    return '— ' + p.unitName + ' reached (' + p.x + ',' + p.y + ')';
  }
  if (ev.topic === STREAM_TOPICS.UNIT_MARCH_COMPLETED) {
    return '— ' + p.unitName + ' arrived at (' + p.x + ',' + p.y + ')';
  }
  if (ev.topic === STREAM_TOPICS.CITY_FOUNDED) {
    return '— Founded ' + p.cityName + ' at (' + p.x + ',' + p.y + ')!';
  }
  if (ev.topic === STREAM_TOPICS.BUILDING_QUEUED) {
    return '— Queued ' + p.buildingName + ' Lv ' + p.targetLevel + ' (' + formatSimDuration(p.durationMs) + ')';
  }
  if (ev.topic === STREAM_TOPICS.BUILDING_COMPLETED) {
    return '— Completed ' + p.buildingName + ' Lv ' + p.level + ' in ' + p.cityName + '!';
  }
  if (ev.topic === STREAM_TOPICS.HERO_RECRUITED) {
    return '— Recruited ' + p.heroName + ' (' + p.classId + ')!';
  }
  if (ev.topic === STREAM_TOPICS.TASK_COMPLETED) {
    return '— Milestone Ready: ' + p.title;
  }
  if (ev.topic === STREAM_TOPICS.TASK_CLAIMED) {
    return '— Claimed: ' + p.title + ' (' + p.rewardLabel + ')';
  }
  if (ev.topic === STREAM_TOPICS.COMMAND_REJECTED) {
    return '— [Blocked] ' + p.reason;
  }
  return '';
}
