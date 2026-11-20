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
  computeBuildingDurationMs,
  isBuildingPrerequisiteMet,
  computeMaxPartySize
} from '../data/buildings.js';
import {
  getPrimaryCity,
  getSelectedOverworldUnit,
  getEffectiveStockpile,
  computeCityStorageCaps,
  computeCityStorageSlotCapacity,
  computeCityPopulation
} from '../engine/state.js';
import { getFormattedTasksList } from '../engine/taskEngine.js';
import {
  normalizeSharedHeroProfile,
  renderSharedPaperDollMannequin,
  buildSharedPaperDollGridHtml,
  buildSharedHeroStatsHtml,
  buildSharedCosmeticsPreviewHtml
} from '../../ui/shared/characterSheet.js';
import {
  getFacilityInteriorAssetId,
  getProductionImageSrc
} from '../../ui/shared/assetRegistry.js';
import { getActiveRenderAdapter } from '../../ui/shared/renderAdapter.js';
import { RARITY } from '../../constants.js';
import { getItemTypeIcon } from '../../data/items.js';

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
    const popStr = pop.starving ? (pop.current + '/' + pop.max + ' ⚠️') : (pop.current + '/' + pop.max);
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

  // 7. Sync Shared Character Sheet Modal & Enterable Facility Modal if open
  renderWargameCharacterSheetModal(simHost);
  renderWargameFacilityModal(simHost);
}

export function renderWargameCharacterSheetModal(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const modal = document.getElementById('wgCharacterSheetModal');
  if (!modal) return;

  const openHeroId = simHost.state._openHeroSheetId || null;
  if (!openHeroId) {
    modal.classList.add('hidden');
    return;
  }

  const heroes = simHost.state.world.heroes || [];
  const rawHero = heroes.find(function(h) { return h.id === openHeroId; }) || heroes[0];
  if (!rawHero) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  const profile = normalizeSharedHeroProfile(rawHero);

  const nameEl = document.getElementById('wgSheetHeroName');
  const titleEl = document.getElementById('wgSheetHeroTitle');
  if (nameEl) nameEl.textContent = profile.name + ' — ' + profile.className;
  if (titleEl) titleEl.textContent = 'Level ' + profile.level + ' ' + profile.title + ' • HP ' + profile.hp + '/' + profile.maxHp + ' • MP ' + profile.mp + '/' + profile.maxMp;

  const canvas = document.getElementById('wgSheetPaperDollCanvas');
  if (canvas) {
    renderSharedPaperDollMannequin(canvas, rawHero);
  }

  const gridEl = document.getElementById('wgSheetPaperDollGrid');
  if (gridEl) {
    setHtmlIfChanged(gridEl, buildSharedPaperDollGridHtml(rawHero, { mode: 'wargame' }));
  }

  const statsEl = document.getElementById('wgSheetStatsGrid');
  if (statsEl) {
    setHtmlIfChanged(statsEl, buildSharedHeroStatsHtml(profile));
  }

  const cosEl = document.getElementById('wgSheetCosmeticsStrip');
  if (cosEl) {
    setHtmlIfChanged(cosEl, buildSharedCosmeticsPreviewHtml(profile));
  }

  const bagEl = document.getElementById('wgSheetBagList');
  if (bagEl) {
    const bag = profile.bagGear || [];
    if (bag.length === 0) {
      setHtmlIfChanged(bagEl, `<div class="text-[11px] text-[#64748b] italic py-2 text-center">No unequipped gear in pack. Unequip worn gear or forge items at the City Blacksmith!</div>`);
    } else {
      const bagHtml = bag.map(function(it) {
        const rInfo = RARITY[it.rarity] || RARITY.common;
        const icon = getItemTypeIcon(it.slot);
        const statTxt = [
          it.atk ? ('+' + it.atk + ' ATK') : '',
          it.def ? ('+' + it.def + ' DEF') : '',
          it.hp  ? ('+' + it.hp  + ' HP')  : ''
        ].filter(Boolean).join(' • ') || 'Equipment';
        return `
          <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 text-xs">
            <div class="min-w-0">
              <div class="font-bold truncate" style="color:${rInfo.color}">${icon} ${it.name}</div>
              <div class="text-[10px] font-mono text-[#8b949e]">${it.slot.toUpperCase()} • ${rInfo.label} • <span class="text-[#34d399]">${statTxt}</span></div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="window.WargameApp.handleDepositToCityStorage('${rawHero.id}', '${it.uid}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/30 font-bold text-[10px] uppercase cursor-pointer" title="Store in City Vault">Store</button>
              <button onclick="window.WargameApp.handleEquipHeroItem('${rawHero.id}', '${it.uid}')" class="px-2.5 py-1 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-[10px] uppercase cursor-pointer">Equip</button>
            </div>
          </div>
        `;
      }).join('');
      setHtmlIfChanged(bagEl, bagHtml);
    }
  }

  // City Vault Storage Container (200-slot shared city inventory)
  const storageSection = document.getElementById('wgSheetCityStorageSection');
  const storageCountEl = document.getElementById('wgSheetStorageCount');
  const storageListEl = document.getElementById('wgSheetCityStorageList');
  const city = getPrimaryCity(simHost.state);
  if (storageSection && storageListEl) {
    if (!city) {
      storageSection.classList.add('hidden');
    } else {
      storageSection.classList.remove('hidden');
      const items = (city.storage && Array.isArray(city.storage.items)) ? city.storage.items : [];
      const cap = computeCityStorageSlotCapacity(city);
      if (storageCountEl) storageCountEl.textContent = items.length + ' / ' + cap + ' slots';
      if (items.length === 0) {
        setHtmlIfChanged(storageListEl, `<div class="text-[11px] text-[#64748b] italic py-2 text-center">City Vault Storage is empty. Click "📦 Dump to City" to offload loot from your Hero's pack!</div>`);
      } else {
        const stHtml = items.map(function(it) {
          const rInfo = RARITY[it.rarity] || RARITY.common;
          const icon = getItemTypeIcon(it.slot || 'weapon');
          return `
            <div class="p-1.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 text-xs">
              <div class="min-w-0">
                <div class="font-bold truncate" style="color:${rInfo.color}">${icon} ${it.name}</div>
                <div class="text-[10px] font-mono text-[#8b949e]">${(it.slot || 'item').toUpperCase()} • ${rInfo.label}</div>
              </div>
              <button onclick="window.WargameApp.handleWithdrawFromCityStorage('${rawHero.id}', '${it.uid}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-[10px] uppercase cursor-pointer">Take</button>
            </div>
          `;
        }).join('');
        setHtmlIfChanged(storageListEl, stHtml);
      }
    }
  }
}

export function renderWargameFacilityModal(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const modal = document.getElementById('wgFacilityModal');
  if (!modal) return;

  const bId = simHost.state._openFacilityId || null;
  const city = getPrimaryCity(simHost.state);
  const bDef = bId ? CITY_BUILDINGS_CATALOG[bId] : null;
  if (!bId || !city || !bDef) {
    modal.classList.add('hidden');
    return;
  }

  modal.classList.remove('hidden');
  const lvl = (city.buildings && city.buildings[bId]) || 1;
  const titleEl = document.getElementById('wgFacilityTitle');
  const subEl = document.getElementById('wgFacilitySubtitle');
  const bodyEl = document.getElementById('wgFacilityBody');
  if (titleEl) titleEl.textContent = (bDef.icon || '🏛️') + ' ' + bDef.name;
  if (subEl) subEl.textContent = 'Level ' + lvl + ' • ' + city.name;

  if (!bodyEl) return;
  const fac = bDef.facilities || {};
  const sections = [];

  // Stage E.5 Golden Slice: Tier 1 Guild / City Facility Interior Banner via Semantic AssetRegistry
  const interiorAssetId = getFacilityInteriorAssetId(bId);
  const interiorSrc = getProductionImageSrc(interiorAssetId);
  if (interiorSrc) {
    sections.push(`
      <div class="relative h-36 rounded-lg overflow-hidden border border-[#fbbf24]/40 bg-[#080b11] shadow-lg">
        <img src="${interiorSrc}" alt="${bDef.name} Interior" class="w-full h-full object-cover object-center" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0f1520] via-[#0f1520]/35 to-transparent"></div>
        <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#fbbf24]">${city.name} • Level ${lvl}</div>
            <div class="text-xs text-[#e6edf3]/90">${bDef.desc || ''}</div>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#080b11]/80 border border-[#fbbf24]/40 text-[9px] font-mono text-[#fbbf24] uppercase whitespace-nowrap">Tier 1 Interior</span>
        </div>
      </div>
    `);
  } else {
    sections.push(`
      <div class="p-3 rounded-lg bg-gradient-to-r from-[#161e2e] via-[#0f1520] to-[#080b11] border border-[#283347] flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-[#080b11] border border-[#fbbf24]/30 flex items-center justify-center text-xl">${bDef.icon || '🏛️'}</div>
          <div>
            <div class="text-xs font-bold text-[#e6edf3]">${bDef.name} — Level ${lvl}</div>
            <div class="text-[11px] text-[#8b949e]">${bDef.desc || ''}</div>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[9px] font-mono text-[#64748b] uppercase whitespace-nowrap">${getActiveRenderAdapter().backend}</span>
      </div>
    `);
  }

  if (fac.smelting) {
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#f97316]/40 space-y-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-[#f97316] font-bold">🔥 Ore Refining Furnace</span>
          <span class="text-[#e6edf3]">Ore: ${city.stockpile.ore || 0} • Wood: ${city.stockpile.wood || 0} • <strong class="text-[#fbbf24]">Ingots: ${city.stockpile.ingots || 0}</strong></span>
        </div>
        <p class="text-[11px] text-[#8b949e]">Refine 5 raw Dungeon Ore + 5 Wood fuel into 2 Forged Ingots.</p>
        <div class="flex gap-2">
          <button onclick="window.WargameApp.handleSmeltIngots(1)" class="px-3 py-1.5 rounded bg-[#f97316] hover:bg-[#ea580c] text-[#080b11] font-bold text-xs uppercase cursor-pointer">🔥 Smelt 2 Ingots</button>
          <button onclick="window.WargameApp.handleSmeltIngots(5)" class="px-3 py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f97316] border border-[#f97316]/40 font-bold text-xs uppercase cursor-pointer">🔥 Smelt 10 Ingots</button>
        </div>
      </div>
    `);
  }

  if (fac.brewing) {
    const prov = city.provisions || { potions: 0, recalls: 0 };
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#34d399]/40 space-y-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-[#34d399] font-bold">🧪 Apothecary Provisions</span>
          <span class="text-[#e6edf3]">Tonics: <strong class="text-[#34d399]">${prov.potions || 0}</strong> • Recall Scrolls: <strong class="text-[#38bdf8]">${prov.recalls || 0}</strong></span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onclick="window.WargameApp.handleBrewProvision('potions')" class="p-2 rounded bg-[#111722] hover:bg-[#1a2232] border border-[#34d399]/40 text-left text-xs cursor-pointer">
            <div class="font-bold text-[#34d399]">🧪 Brew Healing Tonic</div>
            <div class="text-[10px] font-mono text-[#8b949e]">Cost: 10 Food • 10 Water • 10 Gold</div>
          </button>
          <button onclick="window.WargameApp.handleBrewProvision('recalls')" class="p-2 rounded bg-[#111722] hover:bg-[#1a2232] border border-[#38bdf8]/40 text-left text-xs cursor-pointer">
            <div class="font-bold text-[#38bdf8]">📜 Scribe Recall Scroll</div>
            <div class="text-[10px] font-mono text-[#8b949e]">Cost: 25 Gold • 5 Ore</div>
          </button>
        </div>
      </div>
    `);
  }

  if (fac.blacksmithing) {
    const ingCost = 3 + lvl;
    const gCost = 20 + lvl * 10;
    const tierLbl = lvl >= 3 ? 'Epic (2 Sockets)' : (lvl >= 2 ? 'Rare (1 Socket)' : 'Uncommon');
    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    const forgeBtns = slots.map(function(sl) {
      return `<button onclick="window.WargameApp.handleForgeEquipment('${sl}')" class="p-2 rounded bg-[#111722] hover:bg-[#1a2232] border border-[#fb923c]/40 text-left text-xs cursor-pointer"><div class="font-bold text-[#fb923c]">${getItemTypeIcon(sl)} Forge ${sl.toUpperCase()}</div><div class="text-[10px] font-mono text-[#8b949e]">${ingCost} Ingots • ${gCost}g</div></button>`;
    }).join('');
    const stItems = (city.storage && Array.isArray(city.storage.items)) ? city.storage.items.slice(0, 6) : [];
    const temperList = stItems.length === 0
      ? `<div class="text-[11px] text-[#64748b] italic">Forge or deposit gear into City Vault Storage to temper it here.</div>`
      : stItems.map(function(it) {
          const rk = it.temperRank || 0;
          return `<div class="p-1.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between text-xs"><span class="font-bold text-[#e6edf3]">${getItemTypeIcon(it.slot)} ${it.name}${rk > 0 ? (' +' + rk) : ''}</span><button onclick="window.WargameApp.handleTemperEquipment('${it.uid}')" ${rk >= 3 ? 'disabled' : ''} class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rk >= 3 ? 'bg-[#1a2232] text-[#64748b]' : 'bg-[#fb923c] text-[#080b11] cursor-pointer'}">${rk >= 3 ? 'MAX' : 'Temper (2 Ingots, 20g)'}</button></div>`;
        }).join('');
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#fb923c]/40 space-y-2.5">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-[#fb923c] font-bold">🔨 Star-Forge Blueprints (${tierLbl})</span>
          <span class="text-[#e6edf3]">Ingots: <strong class="text-[#fbbf24]">${city.stockpile.ingots || 0}</strong> • Gold: <strong class="text-[#fbbf24]">${city.stockpile.gold || 0}</strong></span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">${forgeBtns}</div>
        <div class="pt-2 border-t border-[#1e293b] space-y-1.5">
          <div class="text-[10px] font-mono uppercase text-[#fb923c] font-bold">🔥 Tempering Anvil (City Vault Gear)</div>
          ${temperList}
        </div>
      </div>
    `);
  }

  if (fac.lapidary) {
    const cg = city.gems || { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
    const stItems = (city.storage && Array.isArray(city.storage.items)) ? city.storage.items.slice(0, 6) : [];
    const sockList = stItems.length === 0
      ? `<div class="text-[11px] text-[#64748b] italic">Deposit or forge gear into City Vault Storage to punch sockets and inlay Astral Gems.</div>`
      : stItems.map(function(it) {
          const maxS = it.sockets || 0;
          const usedS = Array.isArray(it.gems) ? it.gems.length : 0;
          return `
            <div class="p-2 rounded bg-[#111722] border border-[#283347] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <div class="font-bold text-[#e6edf3]">${getItemTypeIcon(it.slot)} ${it.name}</div>
                <div class="text-[10px] font-mono text-[#a78bfa]">Sockets: ${usedS}/${maxS} ${usedS > 0 ? ('[' + it.gems.join(', ') + ']') : ''}</div>
              </div>
              <div class="flex items-center gap-1">
                ${maxS < 2 ? `<button onclick="window.WargameApp.handlePunchSocket('${it.uid}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-mono cursor-pointer">+ Socket (2 Ing, 35g)</button>` : ''}
                ${usedS < maxS && (cg.ruby || 0) > 0 ? `<button onclick="window.WargameApp.handleSocketCityGem('${it.uid}', 'ruby')" class="px-2 py-0.5 rounded bg-[#f87171] text-[#080b11] font-bold text-[10px] font-mono cursor-pointer">Socket Ruby</button>` : ''}
                ${usedS < maxS && (cg.emerald || 0) > 0 ? `<button onclick="window.WargameApp.handleSocketCityGem('${it.uid}', 'emerald')" class="px-2 py-0.5 rounded bg-[#34d399] text-[#080b11] font-bold text-[10px] font-mono cursor-pointer">Socket Emerald</button>` : ''}
                ${usedS > 0 ? `<button onclick="window.WargameApp.handleUnsocketCityGem('${it.uid}')" class="px-2 py-0.5 rounded bg-[#1a2232] text-[#38bdf8] border border-[#38bdf8]/40 text-[10px] font-mono cursor-pointer">Extract (20g)</button>` : ''}
              </div>
            </div>
          `;
        }).join('');
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#a78bfa]/40 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span class="text-[#a78bfa] font-bold">💎 Astral Lapidary Bench</span>
          <span class="text-[10px] text-[#cbd5e1]">🔴 Ruby:${cg.ruby || 0} • 🟢 Emr:${cg.emerald || 0} • 🔵 Sap:${cg.sapphire || 0} • 🟡 Top:${cg.topaz || 0} • 🟣 Void:${cg.void_diamond || 0}</span>
        </div>
        <div class="space-y-1.5">${sockList}</div>
      </div>
    `);
  }

  if (fac.partyManagement) {
    const maxSize = computeMaxPartySize(city);
    const parties = simHost.state.world.parties || [];
    const heroes = simHost.state.world.heroes || [];
    const partiesHtml = parties.length === 0
      ? `<div class="text-xs text-[#64748b] italic">No active parties yet. Recruit Heroes at a Guild Hall first.</div>`
      : parties.map(function(pt) {
          const members = Array.isArray(pt.memberIds) ? pt.memberIds : [];
          const unassigned = heroes.filter(function(h) { return members.indexOf(h.id) === -1; });
          return `
            <div class="p-2.5 rounded bg-[#111722] border border-[#283347] space-y-1.5 text-xs">
              <div class="flex items-center justify-between font-mono">
                <span class="font-bold text-[#fbbf24]">⚔️ Party ${pt.id}</span>
                <span class="text-[#38bdf8]">${members.length} / ${maxSize} Heroes</span>
              </div>
              ${unassigned.length > 0 && members.length < maxSize ? `
                <div class="flex flex-wrap gap-1 pt-1">
                  ${unassigned.map(function(uh) {
                    return `<button onclick="window.WargameApp.handleAssignHeroToParty('${pt.id}', '${uh.id}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] border border-[#34d399]/40 text-[10px] font-mono cursor-pointer">+ Add ${uh.name}</button>`;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#fb923c]/40 space-y-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-[#fb923c] font-bold">🏰 Garrison Party Command</span>
          <span class="text-[#fbbf24]">Max Party Size: ${maxSize} Heroes</span>
        </div>
        ${partiesHtml}
      </div>
    `);
  }

  if (fac.recruitment && Array.isArray(fac.recruitment.classes)) {
    const classCards = fac.recruitment.classes.map(function(entry) {
      const cDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === entry.classId; });
      if (!cDef) return '';
      const unlocked = lvl >= (entry.minLevel || 1);
      return `
        <div class="p-2.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 text-xs">
          <div>
            <div class="font-bold" style="color:${cDef.color}">${cDef.icon} ${cDef.name}</div>
            <div class="text-[10px] font-mono text-[#8b949e]">${unlocked ? ('Cost: ' + cDef.costGold + 'g • ' + cDef.costFood + ' Food') : ('Unlocks at ' + bDef.name + ' Lv ' + entry.minLevel)}</div>
          </div>
          <button onclick="window.WargameApp.handleRecruitHero('${cDef.classId}')" ${!unlocked ? 'disabled' : ''} class="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${unlocked ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ${unlocked ? 'Recruit' : ('Lv ' + entry.minLevel)}
          </button>
        </div>
      `;
    }).join('');
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#60a5fa]/40 space-y-2">
        <div class="text-xs font-mono font-bold text-[#60a5fa]">⚔️ Guild Recruitment Roster</div>
        <div class="space-y-1.5">${classCards}</div>
      </div>
    `);
  }

  if (fac.questBoard || fac.training || fac.research || fac.shop) {
    const badges = [
      fac.questBoard ? '📜 Guild Quest Board' : '',
      fac.training ? '🎯 Class Training' : '',
      fac.research ? '📚 Guild Research' : '',
      fac.shop ? '🛒 Class-Exclusive Armory Shop' : ''
    ].filter(Boolean).map(function(b) {
      return `<span class="px-2 py-1 rounded bg-[#111722] border border-[#283347] text-[10px] font-mono text-[#cbd5e1]">${b}</span>`;
    }).join('');
    sections.push(`
      <div class="p-2.5 rounded bg-[#080b11] border border-[#283347] space-y-1.5">
        <div class="text-[10px] font-mono uppercase text-[#8b949e]">Declared Guild Services (ADR-0012)</div>
        <div class="flex flex-wrap gap-1.5">${badges}</div>
      </div>
    `);
  }

  setHtmlIfChanged(bodyEl, sections.join('') || `<div class="text-xs text-[#8b949e]">Facility operational.</div>`);
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
      const primaryCity = getPrimaryCity(state);
      const nearbyDng = (selUnit.canEnterDungeon && selUnit.status === 'idle' && Array.isArray(ow.pois))
        ? ow.pois.find(function(p) { return p.type === 'dungeon_entrance' && selUnit.x === p.x && selUnit.y === p.y; })
        : null;
      const canReturnHome = Boolean(selUnit.canEnterDungeon && selUnit.status !== 'in_dungeon' && primaryCity && (selUnit.x !== primaryCity.x || selUnit.y !== primaryCity.y));

      let cargoHtml = '';
      if (selUnit.cargo && ((selUnit.cargo.gold || 0) > 0 || (selUnit.cargo.ore || 0) > 0 || (selUnit.cargo.gearCount || 0) > 0)) {
        cargoHtml = `
          <div class="p-2 rounded bg-[#451a03]/40 border border-[#fbbf24]/50 text-[11px] font-mono text-[#fbbf24] flex items-center justify-between">
            <span>💰 Expedition Cargo</span>
            <span>+${selUnit.cargo.gold || 0}g • +${selUnit.cargo.ore || 0} Ore</span>
          </div>
        `;
      }

      let marchHtml = '';
      if (selUnit.status === 'in_dungeon') {
        marchHtml = `
          <div class="p-2 rounded bg-[#450a0a]/40 border border-[#f87171]/50 space-y-1.5 text-[11px] font-mono text-[#f87171]">
            <div>⚔️ Currently delving inside Vault.</div>
            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button onclick="window.WargameApp.handleEnterDungeon('${selUnit.activeDungeonPoiId || ''}')" class="py-1 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-bold text-[10px] uppercase cursor-pointer">⚔️ Resume</button>
              <button onclick="window.WargameApp.handleExitDungeonToSurface('${selUnit.id}')" class="py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 font-bold text-[10px] uppercase cursor-pointer">🧗 Exit to Surface</button>
            </div>
          </div>
        `;
      } else if (selUnit.status === 'marching' && selUnit.marchPlan) {
        const remSteps = selUnit.marchPlan.remainingPath ? selUnit.marchPlan.remainingPath.length : 0;
        const stepRemMs = Math.max(0, (selUnit.marchPlan.stepDueSimTimeMs || 0) - simTimeMs);
        const isReturning = selUnit.marchPlan.intent === 'return_city';
        marchHtml = `
          <div class="p-2 rounded bg-[#111722] border ${isReturning ? 'border-[#fbbf24]/50' : 'border-[#38bdf8]/40'} space-y-1">
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span class="${isReturning ? 'text-[#fbbf24]' : 'text-[#38bdf8]'} font-bold">${isReturning ? '🏠 Returning Home' : ('⏳ Marching to (' + selUnit.marchPlan.targetX + ', ' + selUnit.marchPlan.targetY + ')')}</span>
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
          ${cargoHtml}
          ${marchHtml}
          ${nearbyDng ? `
            <button data-action="enter-dungeon" data-poi-id="${nearbyDng.id}" onclick="window.WargameApp.handleEnterDungeon('${nearbyDng.id}')" class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] cursor-pointer">
              ⚔️ Enter ${nearbyDng.name}
            </button>
          ` : ''}
          ${canReturnHome ? `
            <button data-action="return-to-city" onclick="window.WargameApp.handleReturnToCity()" class="w-full py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 cursor-pointer">
              🏰 March Home to ${primaryCity.name}
            </button>
          ` : ''}
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
            <div class="flex items-center gap-1">
              <button data-action="set-leader" data-hero-id="${h.id}" onclick="window.WargameApp.handleSetOverallLeader('${h.id}')" class="px-1.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] text-[10px] font-mono font-bold cursor-pointer" title="Designate as Overall Leader">${(world.roster && world.roster.overallLeaderHeroId === h.id) ? '👑' : '☆'}</button>
              <button data-action="open-hero-sheet" data-hero-id="${h.id}" onclick="window.WargameApp.handleOpenHeroSheet('${h.id}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/30 text-[10px] font-mono font-bold cursor-pointer" title="Open Shared Character Sheet">👤 Sheet</button>
              <button data-action="select-party" data-hero-id="${h.id}" onclick="window.WargameApp.handleSelectPartyByHero('${h.id}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#60a5fa] text-[10px] font-mono font-bold cursor-pointer">Select</button>
              <button data-action="dismiss-hero" data-hero-id="${h.id}" onclick="window.WargameApp.handleDismissHero('${h.id}')" class="px-1.5 py-1 rounded bg-[#1a2232] hover:bg-[#f87171]/20 text-[#f87171] text-[10px] font-mono font-bold cursor-pointer" title="Dismiss Hero (Gear saved to City Vault)">✕</button>
            </div>
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

  // Discovered Dungeons Quick-March Bar
  const dngBarEl = document.getElementById('wgDiscoveredDungeonsBar');
  if (dngBarEl) {
    const discoveredDngs = (ow.pois || []).filter(function(p) {
      return p.type === 'dungeon_entrance' && (p.discovered || (ow.explored[p.y] && ow.explored[p.y][p.x]));
    });
    if (discoveredDngs.length === 0) {
      dngBarEl.classList.add('hidden');
    } else {
      dngBarEl.classList.remove('hidden');
      const canMarchHero = Boolean(selUnit && selUnit.alive && selUnit.canEnterDungeon && selUnit.status !== 'in_dungeon');
      const cardsHtml = discoveredDngs.map(function(p) {
        const dist = selUnit ? Math.round(Math.hypot(selUnit.x - p.x, selUnit.y - p.y)) : null;
        const atGate = Boolean(canMarchHero && selUnit.status === 'idle' && selUnit.x === p.x && selUnit.y === p.y);
        return `
          <div class="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-[#111722] border border-[#283347] text-[11px] font-mono">
            <div class="flex items-center gap-1.5 min-w-0">
              <span style="color:${p.accentColor || '#f87171'}" class="font-bold">Ω</span>
              <span class="text-[#e6edf3] font-semibold truncate">${p.name}</span>
              <span class="text-[10px] text-[#8b949e]">(${p.x},${p.y})${dist !== null ? (' • ' + dist + 't') : ''}</span>
            </div>
            ${atGate ? `
              <button data-action="enter-dungeon" data-poi-id="${p.id}" onclick="window.WargameApp.handleEnterDungeon('${p.id}')" class="px-2 py-0.5 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-bold text-[10px] uppercase cursor-pointer">Enter</button>
            ` : (canMarchHero ? `
              <button data-action="march-to-dungeon" data-poi-id="${p.id}" onclick="window.WargameApp.handleMarchToDungeon('${p.id}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-[10px] uppercase cursor-pointer">March</button>
            ` : `
              <span class="text-[10px] text-[#64748b]">Need Hero Party</span>
            `)}
          </div>
        `;
      }).join('');
      setHtmlIfChanged(dngBarEl, `
        <div class="text-[10px] font-mono uppercase text-[#f87171] font-bold">Ω Discovered Vault Entrances (${discoveredDngs.length})</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${cardsHtml}</div>
      `);
    }
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
    } else if (bId === 'town_hall' || bId === 'meeting_hall') {
      borderClass = 'border-2 border-amber-400 bg-amber-950/20 shadow';
      icon = bDef ? bDef.icon : '🏛️';
      label = `<span class="text-[7px] font-mono text-amber-400 font-bold leading-none">Hall ${plot.level}</span>`;
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
          ${curBId === 'guild_hall' ? `
            <button data-action="enter-guild" onclick="window.WargameApp.handleSwitchView('guild')" class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080b11] cursor-pointer">
              ⚔️ Enter Adventurers Guild
            </button>
          ` : (curBDef.facilities ? `
            <button data-action="enter-facility" onclick="window.WargameApp.handleOpenFacilityModal('${curBId}')" class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080b11] cursor-pointer">
              🚪 Enter ${curBDef.name}
            </button>
          ` : '')}
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
                Meeting Hall (Seat)
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

      // Hide meeting hall (founded at center plot) and legacy aliases
      // Only show buildings whose prerequisites are currently satisfied!
      const constructibleKeys = Object.keys(CITY_BUILDINGS_CATALOG).filter(function(k) {
        if (k === 'town_hall' || k === 'meeting_hall' || k === 'farmstead' || k === 'sawmill' || k === 'lumber_hut') return false;
        return isBuildingPrerequisiteMet(city, k);
      });

      const catalogCards = constructibleKeys.length > 0
        ? constructibleKeys.map(function(bId) {
            const bDef = CITY_BUILDINGS_CATALOG[bId];
            const cost = computeBuildingUpgradeCost(bId, 1);
            const durMs = computeBuildingDurationMs(bId, 1);

            const canAfford = (city.stockpile.wood  || 0) >= (cost.wood  || 0) &&
                              (city.stockpile.stone || 0) >= (cost.stone || 0) &&
                              (city.stockpile.gold  || 0) >= (cost.gold  || 0) &&
                              (city.stockpile.water || 0) >= (cost.water || 0) &&
                              (city.stockpile.ore   || 0) >= (cost.ore   || 0);

            return `
              <div class="p-2.5 rounded bg-[#080b11] border border-[#283347] flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-xl">${bDef.icon}</span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-[#e6edf3] truncate">${bDef.name}</div>
                    <div class="text-[10px] font-mono text-[#8b949e]">
                      ${cost.wood}W • ${cost.stone}S${cost.gold ? (' • ' + cost.gold + 'G') : ''}${cost.water ? (' • ' + cost.water + '💧') : ''}${cost.ore ? (' • ' + cost.ore + '⛏️') : ''} • ⏱ ${formatSimDuration(durMs)}
                    </div>
                  </div>
                </div>
                <button data-action="queue-building" data-plot-index="${selPlot.plotIndex}" data-building-id="${bId}" onclick="window.WargameApp.handleQueueBuilding(${selPlot.plotIndex}, '${bId}')" ${!canAfford ? 'disabled' : ''} class="px-3 py-1.5 rounded font-bold text-[11px] uppercase whitespace-nowrap cursor-pointer ${canAfford ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                  🔨 Build
                </button>
              </div>
            `;
          }).join('')
        : `<div class="p-3.5 rounded bg-[#080b11] border border-[#283347] text-center text-xs text-[#8b949e] italic">No new buildings currently available. Grow your population or fulfill current tasks to unlock new structures!</div>`;

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
  if (ev.topic === STREAM_TOPICS.DUNGEON_DISCOVERED) {
    return '— Discovered Vault: ' + p.dungeonName + ' at (' + p.x + ',' + p.y + ')!';
  }
  if (ev.topic === STREAM_TOPICS.DUNGEON_ENTERED) {
    return '— ' + p.unitName + ' breached ' + p.dungeonName + '!';
  }
  if (ev.topic === STREAM_TOPICS.DUNGEON_RETURNED) {
    if (p.outcome === 'defeated') {
      return '— ' + p.unitName + ' rescued to ' + p.cityName + ' (+' + (p.salvagedGold || 0) + 'g salvage)';
    }
    return '— ' + p.unitName + ' extracted via ' + p.method + (p.surfacedAtEntrance ? ' (Surfaced at Dungeon Entrance)' : (p.returnMarchStarted ? ' (Marching Home)' : ' (At Surface)'));
  }
  if (ev.topic === STREAM_TOPICS.EXPEDITION_BANKED) {
    return '— Banked +' + (p.gold || 0) + 'g, +' + (p.ore || 0) + ' Ore at ' + p.cityName + '!';
  }
  if (ev.topic === STREAM_TOPICS.OVERWORLD_SKIRMISH) {
    if (p.victory) {
      return '— ' + p.unitName + ' defeated ' + p.hostileName + ' (+' + (p.rewardGold || 0) + 'g, +' + (p.rewardOre || 0) + ' Ore)';
    }
    return '— ' + p.unitName + ' retreated from ' + p.hostileName + ' to ' + p.retreatedToCity;
  }
  if (ev.topic === STREAM_TOPICS.CRAFTING_COMPLETED) {
    return '— Crafted ' + (p.qty || 1) + 'x ' + p.itemName + ' at ' + p.facility + '!';
  }
  if (ev.topic === STREAM_TOPICS.HERO_DISMISSED) {
    return '— Dismissed ' + p.heroName + ' (gear secured in City Vault)';
  }
  if (ev.topic === STREAM_TOPICS.LEADER_CHANGED) {
    return '— Designated ' + p.heroName + ' as Overall Leader 👑';
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
