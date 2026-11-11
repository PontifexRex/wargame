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
  getEffectiveStockpile
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
  const resWoodEl  = document.getElementById('wgStockWood');
  const resStoneEl = document.getElementById('wgStockStone');
  const resFoodEl  = document.getElementById('wgStockFood');
  const resGoldEl  = document.getElementById('wgStockGold');
  if (resWoodEl && resWoodEl.textContent != String(stock.wood || 0))   resWoodEl.textContent  = stock.wood  || 0;
  if (resStoneEl && resStoneEl.textContent != String(stock.stone || 0)) resStoneEl.textContent = stock.stone || 0;
  if (resFoodEl && resFoodEl.textContent != String(stock.food || 0))   resFoodEl.textContent  = stock.food  || 0;
  if (resGoldEl && resGoldEl.textContent != String(stock.gold || 0))   resGoldEl.textContent  = stock.gold  || 0;
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

  // B. Active Timed Queues Summary (Construction & Marching)
  const queuesListEl = document.getElementById('wgActiveQueuesList');
  if (queuesListEl) {
    const itemsHtml = [];

    // 1. Unit Marches
    const units = ow.units || [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.alive && u.status === 'marching' && u.marchPlan) {
        const dur = Math.max(1, (u.marchPlan.stepDueSimTimeMs || 0) - (u.marchPlan.stepStartSimTimeMs || 0));
        const rem = Math.max(0, (u.marchPlan.stepDueSimTimeMs || 0) - simTimeMs);
        const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
        itemsHtml.push(`
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

    // 2. City Construction Queues
    const cities = Object.values(world.cities || {});
    for (let c = 0; c < cities.length; c++) {
      const city = cities[c];
      const bq = city.buildQueue || [];
      for (let q = 0; q < bq.length; q++) {
        const item = bq[q];
        if (item.status === 'building') {
          const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
          const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
          const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
          itemsHtml.push(`
            <div class="p-2 rounded bg-[#080b11] border border-[#fbbf24]/50 space-y-1">
              <div class="flex justify-between items-center text-[11px] font-mono">
                <span class="text-[#fbbf24] font-bold">🔨 ${item.buildingName} (Lv ${item.targetLevel})</span>
                <span class="text-[#34d399]">${formatSimDuration(rem)}</span>
              </div>
              <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
                <div class="h-full bg-[#fbbf24]" style="width:${pct}%"></div>
              </div>
            </div>
          `);
        } else {
          itemsHtml.push(`
            <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex justify-between items-center text-[11px] font-mono">
              <span class="text-[#8b949e]">⏳ Queued: ${item.buildingName} (Lv ${item.targetLevel})</span>
              <button onclick="window.WargameApp.handleCancelBuilding('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px]">Cancel</button>
            </div>
          `);
        }
      }
    }

    const newQueuesHtml = itemsHtml.length > 0
      ? itemsHtml.join('')
      : `<div class="text-[11px] text-[#8b949e] italic py-1">No active marches or construction timers.</div>`;
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
  if (!city || !gridEl) return;

  const titleEl = document.getElementById('wgCityPanelTitle');
  if (titleEl) titleEl.textContent = city.name + ' — Bastion Construction Grid';

  const plots = city.plots || [];
  const newPlotsHtml = plots.map(function(plot) {
    const slotMeta = CITY_PLOT_SLOTS[plot.plotIndex] || { label: 'City Plot' };
    const bId = plot.buildingId || slotMeta.recommended;
    const bDef = CITY_BUILDINGS_CATALOG[bId];
    const curLevel = plot.buildingId ? (plot.level || 0) : 0;
    const nextLevel = curLevel + 1;
    const cost = computeBuildingUpgradeCost(bId, nextLevel);
    const durMs = computeBuildingDurationMs(bId, nextLevel);

    if (plot.underConstruction) {
      return `
        <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#fbbf24] flex flex-col justify-between gap-2">
          <div>
            <div class="text-[10px] font-mono uppercase text-[#fbbf24]">Plot #${plot.plotIndex + 1} • Under Construction</div>
            <div class="text-sm font-bold text-[#e6edf3] mt-0.5">${bDef ? bDef.icon : '🔨'} ${bDef ? bDef.name : bId} (→ Lv ${nextLevel})</div>
            <p class="text-[11px] text-[#8b949e] mt-1">${bDef ? bDef.desc : ''}</p>
          </div>
          <div class="py-1.5 px-2.5 rounded bg-[#fbbf24]/15 text-[#fbbf24] text-xs font-mono font-bold text-center">
            🔨 Constructing in Queue...
          </div>
        </div>
      `;
    }

    return `
      <div class="p-3.5 rounded-lg bg-[#080b11] border ${curLevel > 0 ? 'border-[#34d399]/50' : 'border-[#283347]'} flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase text-[#8b949e]">${slotMeta.label}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${curLevel > 0 ? 'bg-[#34d399]/20 text-[#34d399]' : 'bg-[#1a2232] text-[#8b949e]'}">
              ${curLevel > 0 ? ('Level ' + curLevel) : 'Unbuilt'}
            </span>
          </div>
          <div class="text-sm font-bold text-[#e6edf3] mt-1">${bDef.icon} ${bDef.name}</div>
          <p class="text-[11px] text-[#8b949e] mt-1">${bDef.desc}</p>
        </div>
        <div class="space-y-1.5 pt-2 border-t border-[#1e293b]">
          <div class="flex items-center justify-between text-[11px] font-mono text-[#cbd5e1]">
            <span>Cost: ${cost.wood}W • ${cost.stone}S${cost.gold ? (' • ' + cost.gold + 'G') : ''}</span>
            <span class="text-[#38bdf8]">⏱ ${formatSimDuration(durMs)}</span>
          </div>
          <button data-action="queue-building" data-plot-index="${plot.plotIndex}" data-building-id="${bId}" onclick="window.WargameApp.handleQueueBuilding(${plot.plotIndex}, '${bId}')" class="w-full py-1.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase btn-tactical cursor-pointer">
            ${curLevel > 0 ? ('▲ Upgrade to Lv ' + nextLevel) : ('🔨 Construct ' + bDef.name)}
          </button>
        </div>
      </div>
    `;
  }).join('');

  setHtmlIfChanged(gridEl, newPlotsHtml);
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
            ⚔️ Swear In ${cls.name}
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
