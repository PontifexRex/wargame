// Wargame DOM Synchronizer — Start Screen, Pioneer Overworld HUD, Real-Time City Builder, Guild Recruitment & Event Feed

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS
} from '../constants.js';
import {
  OVERWORLD_TERRAIN_DEFS
} from '../data/terrain.js';
import { getRecruitableHeroEntry } from '../data/heroRecruitment.js';
import { getHexDistance } from '../engine/hexSpatial.js';
import {
  CITY_BUILDINGS_CATALOG,
  CITY_PLOT_SLOTS,
  GUILD_SERVICE_CATALOGS,
  MARKET_EXCHANGE_RATES,
  computeBuildingUpgradeCost,
  computeBuildingDurationMs,
  isBuildingPrerequisiteMet,
  computeMaxPartySize,
  isFacilityButtonUnlocked,
  getBuildingLevelsTable
} from '../data/buildings.js';
import {
  TROOP_AVAILABILITY_STATES,
  ARMY_OBJECTIVE_TYPES,
  MILITARY_TARGET_STATUS,
  getAllTroopDefinitions,
  getTroopDefinition,
  getTroopMaxUnlockedLevel,
  computeTroopStatsForLevel,
  computeTroopCostForLevel,
  computeCityTrainingSpeedMultiplier,
  computeTroopTrainingDurationMs,
  computeTroopUpgradeCost,
  computeTroopUpgradeDurationMs,
  computeMaxUpgradeableQuantity,
  evaluateTroopAvailability,
  getCityTroopInventorySummary,
  getArmyTroopGroups,
  getArmyTotalTroopCount,
  getMilitaryTargetById,
  getMilitaryTargetAtHex,
  getBlockingMilitaryTargetForAccess,
  computeArmyCombatPower,
  computeTroopListCombatPower
} from '../data/troops.js';
import {
  getPrimaryCity,
  getSelectedOverworldUnit,
  getEffectiveStockpile,
  computeCityStorageCaps,
  computeCityStorageSlotCapacity,
  computeCityPopulation,
  collectOverworldDiscoveries
} from '../engine/state.js';
import { getFormattedTasksList } from '../engine/taskEngine.js';
import { renderProgressionModals } from './progressionUi.js';
import { renderDevPortalModal } from './devPortal.js';
import {
  normalizeSharedHeroProfile,
  renderSharedPaperDollMannequin,
  buildSharedPaperDollGridHtml,
  buildSharedHeroStatsHtml,
  buildSharedCosmeticsPreviewHtml
} from '../../ui/shared/characterSheet.js';
import {
  getFacilityInteriorAssetId,
  getHeroPortraitAssetId,
  getProductionImageSrc
} from '../../ui/shared/assetRegistry.js';
import { getActiveRenderAdapter } from '../../ui/shared/renderAdapter.js';
import { renderCityIsoCanvas } from './cityIsoCanvas.js';
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

  // 7. Sync Shared Character Sheet Modal, Enterable Facility Modal, Screen Info Popup & Mobile Drawers
  renderWargameCharacterSheetModal(simHost);
  renderWargameFacilityModal(simHost);
  renderProgressionModals(simHost);
  renderDevPortalModal(simHost);
  renderDeployArmyModal(simHost);
  renderBattleFeedbackOverlays(simHost);
  renderScreenInfoModal(simHost);
  renderQuickMapDocks(simHost);
  syncMobileDrawers(simHost);
}

export function getScreenInfoContent(activeView, state) {
  if (activeView === WARGAME_VIEWS.CITY) {
    return {
      title: '🏛️ Settlement & City Builder',
      subtitle: '8×8 Spatial Grid • All Buildings Unified',
      summary: 'Construct and upgrade your Bastion City across 64 spatial plots. Every built structure—from Farms and Wells to Guilds and Forges—can be entered for statistics, upgrades, and specialized services.',
      tips: [
        'Click any empty plot to construct unlocked facilities; upgrade your Meeting Hall to raise the city level cap.',
        'Click any active building and press Enter to open its full-bleed interior screen.',
        'Place Windmills adjacent to Food/Wood/Stone/Water producers for a +20% production synergy bonus.'
      ]
    };
  }
  if (activeView === WARGAME_VIEWS.GUILD) {
    return {
      title: '⚔️ Adventurers Guild Hall',
      subtitle: 'Adventurer Class • Quests, Training, Research & Shop',
      summary: 'The Adventurers Guild recruits versatile Adventurer delvers and coordinates subterranean Starfall expeditions. Specialist classes (Fighter, Thief, Mage, Ranger, Cleric, Paladin) are recruited at their own Class Guilds and Temple Chapterhouse.',
      tips: [
        'Switch between Recruit, Quests, Training, Research, and Shop tabs along the bottom of the hall.',
        'Exiting any Guild always returns you directly to your Bastion City.'
      ]
    };
  }
  return {
    title: '🗺️ Overworld Strategic Map',
    subtitle: 'Real-Time Marching • Dungeons & Frontier Exploration',
    summary: 'Command your Pioneer Settlers and Hero Vanguard Parties across the uncharted frontier in real time. Discover subterranean vaults, clear wandering hostiles, and return extracted loot to your city.',
    tips: [
      'Click any passable tile to march your selected unit, or use WASD to step tile-by-tile.',
      'March a Hero Party onto a discovered Dungeon POI and press Enter Vault to launch the tactical delve.',
      'Using an Astral Recall Scroll inside a dungeon surfaces your party at the dungeon entrance so you can choose which city to march back to.'
    ]
  };
}

export function renderScreenInfoModal(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state) return;
  const modal = document.getElementById('wgScreenInfoModal');
  if (!modal) return;
  if (!simHost.state._showScreenInfo) {
    modal.classList.add('hidden');
    return;
  }
  modal.classList.remove('hidden');
  const info = getScreenInfoContent(simHost.state.activeView || WARGAME_VIEWS.OVERWORLD, simHost.state);
  const titleEl = document.getElementById('wgScreenInfoTitle');
  const subEl = document.getElementById('wgScreenInfoSubtitle');
  const bodyEl = document.getElementById('wgScreenInfoBody');
  if (titleEl) titleEl.textContent = info.title;
  if (subEl) subEl.textContent = info.subtitle;
  if (bodyEl) {
    const tipsHtml = (info.tips || []).map(function(t) {
      return `<li class="flex items-start gap-2"><span class="text-[#fbbf24]">•</span><span>${t}</span></li>`;
    }).join('');
    setHtmlIfChanged(bodyEl, `
      <p class="text-xs text-[#e6edf3]/90 leading-relaxed">${info.summary}</p>
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-1.5">
        <div class="text-[10px] font-mono uppercase text-[#38bdf8] font-bold">Key Actions &amp; Tips</div>
        <ul class="space-y-1.5 text-[11px] text-[#cbd5e1]">${tipsHtml}</ul>
      </div>
    `);
  }
}

export function syncMobileDrawers(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state) return;
  const isMobilePreview = Boolean(simHost.state._mobilePreview);
  if (document.body && document.body.classList) {
    document.body.classList.toggle('wg-mobile-preview', isMobilePreview);
  }
  const previewBtn = document.getElementById('wgBtnMobilePreview');
  if (previewBtn && previewBtn.classList) {
    previewBtn.classList.toggle('bg-[#fbbf24]', isMobilePreview);
    previewBtn.classList.toggle('text-[#080b11]', isMobilePreview);
    previewBtn.classList.toggle('bg-[#1a2232]', !isMobilePreview);
    previewBtn.classList.toggle('text-[#38bdf8]', !isMobilePreview);
  }

  const drawer = simHost.state._mobileDrawer || null;
  const leftEl = document.getElementById('wgLeftSidebar');
  const rightEl = document.getElementById('wgRightSidebar');
  if (leftEl) {
    leftEl.classList.toggle('hidden', drawer !== 'left');
    leftEl.classList.toggle('flex', drawer === 'left');
  }
  if (rightEl) {
    rightEl.classList.toggle('hidden', drawer !== 'right');
    rightEl.classList.toggle('flex', drawer === 'right');
  }
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

  // Safe Retire Hero Zone (Requires explicit warning confirmation on Character Sheet)
  const retireEl = document.getElementById('wgSheetRetireZone');
  if (retireEl) {
    const confirmRetire = Boolean(simHost.state && simHost.state._confirmRetireHero);
    const retireHtml = confirmRetire
      ? `
        <div class="p-2.5 rounded-lg bg-[#450a0a]/85 border border-[#f87171]/60 space-y-2 text-xs">
          <div class="text-[#fecaca] font-semibold">⚠️ Permanently retire <strong>${rawHero.name}</strong>? This cannot be undone. Equipped gear will be moved safely to City Vault Storage.</div>
          <div class="flex items-center justify-end gap-2">
            <button onclick="window.WargameApp.handleToggleRetireHeroConfirm()" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#e6edf3] text-[10px] font-mono cursor-pointer">Cancel</button>
            <button onclick="window.WargameApp.handleDismissHero('${rawHero.id}')" class="px-2.5 py-1 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] text-[10px] font-mono font-bold uppercase cursor-pointer">Confirm Retire</button>
          </div>
        </div>
      `
      : `
        <div class="flex justify-end">
          <button onclick="window.WargameApp.handleToggleRetireHeroConfirm()" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#450a0a] text-[#f87171]/80 hover:text-[#f87171] border border-[#f87171]/30 text-[10px] font-mono cursor-pointer">Retire Hero...</button>
        </div>
      `;
    setHtmlIfChanged(retireEl, retireHtml);
  }
}

function buildNetResourceOverlayText(bDef, lvl) {
  if (!bDef) return '';
  const net = {};
  if (bDef.productionPerTick) {
    Object.entries(bDef.productionPerTick).forEach(function(e) {
      net[e[0]] = (net[e[0]] || 0) + (e[1] * lvl);
    });
  }
  if (bDef.consumptionPerTick) {
    Object.entries(bDef.consumptionPerTick).forEach(function(e) {
      net[e[0]] = (net[e[0]] || 0) - (e[1] * lvl);
    });
  }
  const parts = [];
  Object.entries(net).forEach(function(e) {
    if (e[1] !== 0) {
      const sign = e[1] > 0 ? '+' : '';
      const label = e[0].charAt(0).toUpperCase() + e[0].slice(1);
      parts.push(sign + e[1] + ' ' + label + '/tick');
    }
  });
  if (bDef.providesPopulation) parts.push('+' + (bDef.providesPopulation * lvl) + ' Max Pop');
  if (bDef.storageBonus) {
    Object.entries(bDef.storageBonus).forEach(function(e) {
      parts.push('+' + (e[1] * lvl) + ' ' + e[0] + ' Cap');
    });
  }
  if (bDef.adjacencyBonus) parts.push('+20% Adjacent Yield');
  return parts.length > 0 ? ('Net: ' + parts.join(' • ')) : '';
}

export function buildUnifiedGuildServicesHtml(simHost, bId, city, bDef, lvl, activePlot) {
  const fac = (bDef && bDef.facilities) || {};
  const hasGuildServices = Boolean(
    (fac.recruitment && Array.isArray(fac.recruitment.classes)) ||
    fac.questBoard || fac.training || fac.research || fac.shop
  );
  if (!hasGuildServices) return '';

  const subPage = simHost && simHost.state ? (simHost.state._facilityTab || null) : null;
  const domain = (fac.questBoard && fac.questBoard.domain)
    || (fac.training && fac.training.domain)
    || (fac.research && fac.research.domain)
    || 'adventurers';
  const catalog = GUILD_SERVICE_CATALOGS[domain] || GUILD_SERVICE_CATALOGS.adventurers;

  // Compute Upgrade button state
  const nextLvl = lvl + 1;
  const isMaxLvl = nextLvl > (bDef.maxLevel || 5);
  const upgCost = !isMaxLvl ? computeBuildingUpgradeCost(bId, nextLvl) : null;
  const upgDur = !isMaxLvl ? computeBuildingDurationMs(bId, nextLvl) : 0;
  const mhLvl = (city.buildings && city.buildings.meeting_hall) || 1;
  const isMH = (bId === 'meeting_hall');
  const cappedByMH = !isMH && nextLvl > mhLvl;
  const canAffordUpg = Boolean(
    !isMaxLvl && !cappedByMH && activePlot && !activePlot.underConstruction &&
    (city.stockpile.wood  || 0) >= (upgCost.wood  || 0) &&
    (city.stockpile.stone || 0) >= (upgCost.stone || 0) &&
    (city.stockpile.gold  || 0) >= (upgCost.gold  || 0) &&
    (city.stockpile.water || 0) >= (upgCost.water || 0) &&
    (city.stockpile.ore   || 0) >= (upgCost.ore   || 0)
  );
  const upgTitle = isMaxLvl
    ? 'Maximum Level Reached'
    : (cappedByMH
      ? ('Requires Meeting Hall Lv ' + nextLvl)
      : ('Upgrade Lv ' + nextLvl + ': ' + upgCost.wood + 'W, ' + upgCost.stone + 'S' + (upgCost.gold ? (', ' + upgCost.gold + 'G') : '') + ' (' + formatSimDuration(upgDur) + ')'));

  // Dedicated Sub-Pages: Recruit / Quest Board / Shop (opened from the clean action row)
  if (subPage === 'recruit' && fac.recruitment && Array.isArray(fac.recruitment.classes)) {
    const classCards = fac.recruitment.classes.map(function(entry) {
      const cDef = getRecruitableHeroEntry(entry.classId);
      if (!cDef) return '';
      const unlocked = lvl >= (entry.minLevel || 1);
      const canAfford = unlocked && (city.stockpile.gold || 0) >= cDef.costGold && (city.stockpile.food || 0) >= cDef.costFood;
      const portraitSrc = getProductionImageSrc(getHeroPortraitAssetId(cDef.classId));
      const portraitHtml = portraitSrc
        ? `<img src="${portraitSrc}" alt="${cDef.name}" class="w-16 h-16 rounded-lg object-cover border border-[#fbbf24]/50 shadow shrink-0 bg-[#080b11]" />`
        : `<div class="w-16 h-16 rounded-lg bg-[#080b11] border border-[#283347] flex items-center justify-center text-2xl shrink-0">${cDef.icon}</div>`;
      const bs = cDef.baseStats || { hp: 80, mp: 20, atk: 10, def: 5 };
      return `
        <div class="p-3 rounded-lg bg-[#111722]/92 border border-[#283347] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            ${portraitHtml}
            <div class="min-w-0 space-y-1">
              <div class="font-bold text-sm truncate" style="color:${cDef.color}">${cDef.icon} ${cDef.name} <span class="text-[10px] font-mono text-[#fbbf24]">• ${cDef.title}</span></div>
              <div class="text-[11px] text-[#94a3b8]">${cDef.specialty || ''}</div>
              <div class="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#cbd5e1]">
                <span class="px-1.5 py-0.5 rounded bg-[#080b11] border border-[#1e293b]">HP <strong>${bs.hp}</strong></span>
                <span class="px-1.5 py-0.5 rounded bg-[#080b11] border border-[#1e293b]">MP <strong>${bs.mp}</strong></span>
                <span class="px-1.5 py-0.5 rounded bg-[#080b11] border border-[#1e293b]">ATK <strong>${bs.atk}</strong></span>
                <span class="px-1.5 py-0.5 rounded bg-[#080b11] border border-[#1e293b]">DEF <strong>${bs.def}</strong></span>
              </div>
              <div class="text-[10px] font-mono text-[#fbbf24]">${unlocked ? ('Recruit Cost: ' + cDef.costGold + 'g • ' + cDef.costFood + ' Food') : ('Unlocks at ' + bDef.name + ' Lv ' + entry.minLevel)}</div>
            </div>
          </div>
          <button onclick="window.WargameApp.handleRecruitHero('${cDef.classId}')" ${!canAfford ? 'disabled' : ''} class="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase whitespace-nowrap ${canAfford ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ${unlocked ? '⚔️ Recruit (60s)' : ('Lv ' + entry.minLevel)}
          </button>
        </div>
      `;
    }).join('');

    return `
      <div class="p-3.5 rounded-xl bg-[#080b11]/90 border border-[#fbbf24]/50 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-display text-sm font-bold text-[#fbbf24]">⚔️ Recruit Heroes — ${bDef.name}</span>
          <button onclick="window.WargameApp.handleSwitchFacilityTab('')" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-xs font-mono text-[#e6edf3] cursor-pointer">← Back</button>
        </div>
        <div class="space-y-2">${classCards}</div>
      </div>
    `;
  }

  if (subPage === 'quests' && fac.questBoard) {
    const qList = (catalog.quests || []).map(function(q) {
      return `
        <div class="p-2.5 rounded-lg bg-[#111722]/90 border border-[#283347] flex items-center justify-between gap-2 text-xs">
          <div>
            <div class="font-bold text-[#fbbf24]">📜 ${q.name}</div>
            <div class="text-[10px] text-[#94a3b8]">${q.desc}</div>
          </div>
          <span class="px-2 py-1 rounded bg-[#080b11] border border-[#34d399]/40 text-[10px] font-mono text-[#34d399] whitespace-nowrap">${q.reward}</span>
        </div>
      `;
    }).join('');
    return `
      <div class="p-3.5 rounded-xl bg-[#080b11]/90 border border-[#fbbf24]/50 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-display text-sm font-bold text-[#fbbf24]">📜 Quest Board — ${bDef.name}</span>
          <button onclick="window.WargameApp.handleSwitchFacilityTab('')" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-xs font-mono text-[#e6edf3] cursor-pointer">← Back</button>
        </div>
        <div class="space-y-1.5">${qList}</div>
      </div>
    `;
  }

  if (subPage === 'shop' && fac.shop) {
    const sList = (catalog.shop || []).map(function(sh) {
      return `
        <div class="p-2.5 rounded-lg bg-[#111722]/90 border border-[#283347] flex items-center justify-between gap-2 text-xs">
          <div>
            <div class="font-bold text-[#34d399]">🛒 ${sh.name}</div>
            <div class="text-[10px] text-[#94a3b8]">${sh.desc}</div>
          </div>
          <span class="px-2 py-1 rounded bg-[#080b11] border border-[#fbbf24]/40 text-[10px] font-mono text-[#fbbf24] whitespace-nowrap">${sh.cost}</span>
        </div>
      `;
    }).join('');
    return `
      <div class="p-3.5 rounded-xl bg-[#080b11]/90 border border-[#fbbf24]/50 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-display text-sm font-bold text-[#34d399]">🛒 Quartermaster Shop — ${bDef.name}</span>
          <button onclick="window.WargameApp.handleSwitchFacilityTab('')" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-xs font-mono text-[#e6edf3] cursor-pointer">← Back</button>
        </div>
        <div class="space-y-1.5">${sList}</div>
      </div>
    `;
  }

  // Default Home View: Clean single row of action buttons over the full-bleed interior (respecting per-button minLevel!)
  const actionBtns = [];
  if (fac.recruitment && Array.isArray(fac.recruitment.classes)) {
    const u = isFacilityButtonUnlocked(fac.recruitment, lvl);
    actionBtns.push(`<button title="${u.unlocked ? 'Recruit Heroes' : ('Unlocks at Lv ' + u.minLevel)}" ${!u.unlocked ? 'disabled' : ''} onclick="window.WargameApp.handleSwitchFacilityTab('recruit')" class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${u.unlocked ? 'bg-[#080b11]/85 hover:bg-[#fbbf24] hover:text-[#080b11] border border-[#fbbf24]/50 text-[#fbbf24] cursor-pointer' : 'bg-[#080b11]/60 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">⚔️ Recruit${u.unlocked ? '' : (' (Lv ' + u.minLevel + ')')}</button>`);
  }
  if (fac.questBoard) {
    const u = isFacilityButtonUnlocked(fac.questBoard, lvl);
    actionBtns.push(`<button title="${u.unlocked ? 'Quest Board' : ('Unlocks at Lv ' + u.minLevel)}" ${!u.unlocked ? 'disabled' : ''} onclick="window.WargameApp.handleSwitchFacilityTab('quests')" class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${u.unlocked ? 'bg-[#080b11]/85 hover:bg-[#fbbf24] hover:text-[#080b11] border border-[#334155] text-[#e6edf3] cursor-pointer' : 'bg-[#080b11]/60 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">📜 Quest Board${u.unlocked ? '' : (' (Lv ' + u.minLevel + ')')}</button>`);
  }
  if (fac.training) {
    const u = isFacilityButtonUnlocked(fac.training, lvl);
    actionBtns.push(`<button title="${u.unlocked ? 'Open Training Grounds' : ('Unlocks at Lv ' + u.minLevel)}" ${!u.unlocked ? 'disabled' : ''} onclick="window.WargameApp.handleOpenTrainingHub()" class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${u.unlocked ? 'bg-[#080b11]/85 hover:bg-[#34d399] hover:text-[#080b11] border border-[#34d399]/50 text-[#34d399] cursor-pointer' : 'bg-[#080b11]/60 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">🎯 Training${u.unlocked ? '' : (' (Lv ' + u.minLevel + ')')}</button>`);
  }
  if (fac.research) {
    const u = isFacilityButtonUnlocked(fac.research, lvl);
    actionBtns.push(`<button title="${u.unlocked ? 'Open Research Archive' : ('Unlocks at Lv ' + u.minLevel)}" ${!u.unlocked ? 'disabled' : ''} onclick="window.WargameApp.handleOpenResearchHub()" class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${u.unlocked ? 'bg-[#080b11]/85 hover:bg-[#c084fc] hover:text-[#080b11] border border-[#c084fc]/50 text-[#c084fc] cursor-pointer' : 'bg-[#080b11]/60 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">📚 Research${u.unlocked ? '' : (' (Lv ' + u.minLevel + ')')}</button>`);
  }
  if (fac.shop) {
    const u = isFacilityButtonUnlocked(fac.shop, lvl);
    actionBtns.push(`<button title="${u.unlocked ? 'Guild Shop' : ('Unlocks at Lv ' + u.minLevel)}" ${!u.unlocked ? 'disabled' : ''} onclick="window.WargameApp.handleSwitchFacilityTab('shop')" class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${u.unlocked ? 'bg-[#080b11]/85 hover:bg-[#34d399] hover:text-[#080b11] border border-[#334155] text-[#e6edf3] cursor-pointer' : 'bg-[#080b11]/60 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">🛒 Shop${u.unlocked ? '' : (' (Lv ' + u.minLevel + ')')}</button>`);
  }
  if (activePlot && !isMaxLvl) {
    actionBtns.push(`<button title="${upgTitle}" onclick="window.WargameApp.handleQueueBuilding(${activePlot.plotIndex}, '${bId}')" ${!canAffordUpg ? 'disabled' : ''} class="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${canAffordUpg ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#080b11]/75 text-[#64748b] border border-[#1e293b] cursor-not-allowed'}">⬆️ Upgrade</button>`);
  }

  return `<div class="flex flex-wrap items-center justify-center gap-2">${actionBtns.join('')}</div>`;
}

function buildBuildingLevelsTableHtml(bId, bDef, currentLvl) {
  const rows = getBuildingLevelsTable(bId);
  if (!rows || rows.length === 0) return '';
  const trs = rows.map(function(r) {
    const isCur = r.level === currentLvl;
    const costParts = [];
    if (r.cost.wood) costParts.push(r.cost.wood + 'W');
    if (r.cost.stone) costParts.push(r.cost.stone + 'S');
    if (r.cost.gold) costParts.push(r.cost.gold + 'G');
    if (r.cost.water) costParts.push(r.cost.water + '💧');
    if (r.cost.ore) costParts.push(r.cost.ore + '⛏️');
    return `
      <tr class="border-b border-[#1e293b] ${isCur ? 'bg-[#fbbf24]/15 text-[#fbbf24] font-bold' : 'text-[#cbd5e1]'}">
        <td class="py-1.5 px-2 font-mono">Lv ${r.level}${isCur ? ' ★' : ''}</td>
        <td class="py-1.5 px-2 font-mono">${costParts.join(' • ') || 'Free'}</td>
        <td class="py-1.5 px-2 font-mono">${formatSimDuration(r.durationMs)}</td>
        <td class="py-1.5 px-2">${r.benefits}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="mx-3.5 p-3 rounded-lg bg-[#080b11]/95 backdrop-blur-md border border-[#38bdf8]/50 shadow-xl space-y-2 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold text-[#38bdf8]">📊 ${bDef.name} — Level Progression Table</span>
        <button onclick="window.WargameApp.handleToggleBuildingLevels()" class="text-[#94a3b8] hover:text-white text-xs font-bold cursor-pointer">✕</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[11px]">
          <thead>
            <tr class="border-b border-[#334155] text-[10px] font-mono uppercase text-[#94a3b8]">
              <th class="py-1 px-2">Level</th>
              <th class="py-1 px-2">Cost</th>
              <th class="py-1 px-2">Build Time</th>
              <th class="py-1 px-2">Benefits &amp; Unlocks</th>
            </tr>
          </thead>
          <tbody>${trs}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderQuickMapDocks(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const state = simHost.state;
  const ow = state.world.overworld || {};
  const hasCity = Object.keys(state.world.cities || {}).length > 0;
  const activeDungeonParty = (ow.units || []).find(function(u) { return u.alive && u.status === 'in_dungeon'; });

  const dngBtn = activeDungeonParty
    ? `<button onclick="window.WargameApp.handleEnterDungeon('${activeDungeonParty.activeDungeonPoiId || ''}')" class="px-2.5 py-1.5 rounded-lg bg-[#080b11]/85 hover:bg-[#f87171] hover:text-[#080b11] backdrop-blur border border-[#f87171]/60 text-xs font-mono font-bold text-[#f87171] shadow transition cursor-pointer">⚔️ Dungeon</button>`
    : '';

  // Single toggle button in bottom-right corner of Overworld -> goes to City (+ Deploy Army when Barracks troops exist)
  const owDock = document.getElementById('wgOverworldMapDock');
  if (owDock) {
    const primaryCityDock = getPrimaryCity(simHost.state);
    const hasBarracksTroops = Boolean(primaryCityDock && getCityTroopInventorySummary(simHost.state.world, primaryCityDock).totals.trained > 0);
    const deployBtn = hasBarracksTroops
      ? `<button data-action="open-deploy-army" onclick="window.WargameApp.handleOpenDeployArmyModal()" class="px-2.5 py-1.5 rounded-lg bg-[#450a0a]/90 hover:bg-[#f87171] hover:text-[#080b11] backdrop-blur border border-[#f87171]/60 text-xs font-mono font-bold text-[#fecaca] shadow transition cursor-pointer">🛡️ Deploy Army</button>`
      : '';
    const owHtml = deployBtn + (hasCity
      ? `<button onclick="window.WargameApp.handleSwitchView('city')" class="px-2.5 py-1.5 rounded-lg bg-[#080b11]/85 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur border border-[#fbbf24]/60 text-xs font-mono font-bold text-[#fbbf24] shadow transition cursor-pointer">🏛️ City</button>`
      : '') + dngBtn;
    setHtmlIfChanged(owDock, owHtml);
  }

  // Single toggle button in bottom-right corner of City -> goes to World Map
  const cityDock = document.getElementById('wgCityMapDock');
  if (cityDock) {
    const cityHtml = `<button onclick="window.WargameApp.handleSwitchView('overworld')" class="px-2.5 py-1.5 rounded-lg bg-[#080b11]/85 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur border border-[#fbbf24]/60 text-xs font-mono font-bold text-[#fbbf24] shadow transition cursor-pointer">🗺️ World</button>` + dngBtn;
    setHtmlIfChanged(cityDock, cityHtml);
  }
}

export function buildUnifiedBuildingStageHtml(simHost, bId, city) {
  const world = (simHost && simHost.state) ? simHost.state.world : null;
  const bDef = bId ? CITY_BUILDINGS_CATALOG[bId] : null;
  if (!bId || !city || !bDef) return '';

  const plots = Array.isArray(city.plots) ? city.plots : [];
  const targetPlotIdx = simHost.state._openFacilityPlotIndex;
  const activePlot = (typeof targetPlotIdx === 'number'
    ? plots.find(function(p) { return p.plotIndex === targetPlotIdx && p.buildingId === bId; })
    : null) || plots.find(function(p) { return p.buildingId === bId; }) || null;
  const lvl = (activePlot && activePlot.level) || (city.buildings && city.buildings[bId]) || 1;
  const fac = bDef.facilities || {};
  const sections = [];

  // Stage E.5/E.6: Common Config-Driven Full-Bleed Interior Stage (reads interiorAssetId directly from building config)
  const interiorAssetId = bDef.interiorAssetId || getFacilityInteriorAssetId(bId);
  const interiorSrc = getProductionImageSrc(interiorAssetId);

  if (fac.storage) {
    const slotCap = computeCityStorageSlotCapacity(city);
    const items = (city.storage && Array.isArray(city.storage.items)) ? city.storage.items : [];
    const previewItems = items.slice(0, 6).map(function(it) {
      return `<span class="px-2 py-1 rounded bg-[#111722] border border-[#283347] text-[10px] font-mono text-[#e6edf3]">${getItemTypeIcon(it.slot)} ${it.name}</span>`;
    }).join('');
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#94a3b8]/40 space-y-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-[#fbbf24] font-bold">📦 City Vault Storage</span>
          <span class="text-[#e6edf3]">Used: <strong class="text-[#38bdf8]">${items.length} / ${slotCap}</strong> Slots (+${(bDef.inventorySlotBonus || 50) * lvl} Warehouse Bonus)</span>
        </div>
        <div class="flex flex-wrap gap-1.5">${previewItems || '<span class="text-[11px] text-[#64748b] italic">Vault is currently empty. Dump Hero expedition bags from the Character Sheet while in the City.</span>'}</div>
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

  if (fac.academy) {
    const rpBonusPct = lvl * 25;
    const speedBonusPct = lvl * 10;
    const studyYield = (0.05 * lvl).toFixed(2);
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#c084fc]/50 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span class="text-[#c084fc] font-bold">🎓 Arcane Academy &amp; Library (Lv ${lvl})</span>
          <span class="text-[#34d399]">+${rpBonusPct}% General RP • +${speedBonusPct}% Research Speed</span>
        </div>
        <p class="text-[11px] text-[#94a3b8]">Direct civic gateway into your Personal Research Trees. Academy modifiers stack automatically via BenefitService.</p>
        <div class="flex flex-wrap gap-2">
          <button onclick="window.WargameApp.handleCloseFacilityModal(); window.WargameApp.handleOpenResearchHub()" class="px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-mono font-bold text-xs uppercase cursor-pointer">📚 Open Research Archive →</button>
          <button onclick="window.WargameApp.handleAcademyStudySession()" class="px-3 py-1.5 rounded-lg bg-[#1a2232] hover:bg-[#283347] text-[#c084fc] border border-[#c084fc]/50 font-mono font-bold text-xs uppercase cursor-pointer">📘 Fund Study (+${studyYield} RP • 25g, 10 Food)</button>
        </div>
      </div>
    `);
  }

  if (fac.market) {
    const sellBonusPct = Math.max(0, lvl - 1) * 5;
    const resKeys = Object.keys(MARKET_EXCHANGE_RATES);
    const tradeRows = resKeys.map(function(rk) {
      const r = MARKET_EXCHANGE_RATES[rk];
      const sellVal = Math.round(r.sellGold * (1 + (sellBonusPct / 100)));
      const owned = city.stockpile[rk] || 0;
      return `
        <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 text-xs font-mono">
          <div>
            <span class="font-bold text-[#e6edf3]">${r.icon} ${r.label}</span>
            <span class="text-[10px] text-[#94a3b8] ml-1.5">(Have: ${owned})</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="window.WargameApp.handleMarketTrade('${rk}', 'sell')" class="px-2 py-1 rounded bg-[#34d399]/20 hover:bg-[#34d399] hover:text-[#080b11] text-[#34d399] border border-[#34d399]/40 text-[10px] font-bold cursor-pointer">Sell ${r.lotSize} → +${sellVal}g</button>
            <button onclick="window.WargameApp.handleMarketTrade('${rk}', 'buy')" class="px-2 py-1 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24] hover:text-[#080b11] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-bold cursor-pointer">Buy ${r.lotSize} (-${r.buyGold}g)</button>
          </div>
        </div>
      `;
    }).join('');

    const vaultItems = (city.storage && Array.isArray(city.storage.items)) ? city.storage.items.slice(0, 6) : [];
    const liqHtml = vaultItems.length === 0
      ? `<div class="text-[11px] text-[#64748b] italic">Deposit dungeon relics or gear into City Vault Storage to appraise &amp; liquidate them here.</div>`
      : vaultItems.map(function(it) {
          return `
            <div class="p-1.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between text-xs">
              <span class="font-bold text-[#e6edf3]">${getItemTypeIcon(it.slot)} ${it.name} <span class="text-[10px] font-mono text-[#94a3b8]">(${it.rarity || 'common'})</span></span>
              <button onclick="window.WargameApp.handleMarketLiquidateItem('${it.uid}')" class="px-2 py-0.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] text-[10px] font-mono font-bold cursor-pointer">💰 Appraise &amp; Sell</button>
            </div>
          `;
        }).join('');

    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#fbbf24]/50 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span class="text-[#fbbf24] font-bold">⚖️ Market &amp; Trade Exchange (Lv ${lvl})</span>
          <span class="text-[#34d399]">Gold: <strong>${city.stockpile.gold || 0}g</strong> • Sell Bonus: +${sellBonusPct}%</span>
        </div>
        <div class="space-y-1.5">${tradeRows}</div>
        <div class="pt-2 border-t border-[#1e293b] space-y-1.5">
          <div class="text-[10px] font-mono uppercase text-[#fbbf24] font-bold">💎 Relic Appraisal &amp; Liquidation (City Vault)</div>
          ${liqHtml}
        </div>
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

  if (bDef.facilities && bDef.facilities.troopRecruitment) {
    const inv = getCityTroopInventorySummary(world, city);
    const usage = inv.capacity;
    const speedMult = computeCityTrainingSpeedMultiplier(city);
    const allTroopDefs = getAllTroopDefinitions();
    const unlockedTroopDefs = allTroopDefs.filter(function(td) {
      return getTroopMaxUnlockedLevel(city, td) >= 1;
    });
    const tq = Array.isArray(city.troopTrainingQueue) ? city.troopTrainingQueue : [];
    const maxSlots = city.maxTroopQueueSlots || 3;
    const simTimeMs = (world && world.clock) ? world.clock.simTimeMs : 0;
    const capPct = usage.maxCapacity > 0 ? Math.min(100, Math.round((usage.totalUsed / usage.maxCapacity) * 100)) : 0;
    const qtyStore = (simHost.state && simHost.state._recruitQtyByTroop) ? simHost.state._recruitQtyByTroop : {};
    const lvlStore = (simHost.state && simHost.state._recruitLevelByTroop) ? simHost.state._recruitLevelByTroop : {};
    const upgQtyStore = (simHost.state && simHost.state._upgradeQtyByKey) ? simHost.state._upgradeQtyByKey : {};

    // 1. Barracks Troop Inventory Table (strictly by Type AND Level)
    const inventoryRowsHtml = inv.byTypeAndLevel.length === 0
      ? '<tr class="border-t border-[#1e293b]"><td colspan="7" class="py-2 text-center text-[#8b949e] italic">No troops in Barracks inventory yet.</td></tr>'
      : inv.byTypeAndLevel.map(function(row) {
          return `
            <tr class="border-t border-[#1e293b]">
              <td class="py-1 pr-2 text-[#e6edf3] font-semibold">${row.icon} ${row.name}</td>
              <td class="py-1 px-1.5 text-center text-[#fbbf24]">Lv ${row.level}</td>
              <td class="py-1 px-1.5 text-right text-[#34d399]">${row.trained}</td>
              <td class="py-1 px-1.5 text-right text-[#fbbf24]">${row.training}</td>
              <td class="py-1 px-1.5 text-right text-[#c084fc]">${row.upgradingIn}</td>
              <td class="py-1 px-1.5 text-right text-[#38bdf8] font-bold">${row.projectedTotal}</td>
              <td class="py-1 pl-2 text-right whitespace-nowrap">
                ${row.trained > 0 ? `
                  <button data-action="disband-troops" data-troop-def-id="${row.troopDefId}" data-level="${row.level}" data-qty="1" onclick="window.WargameApp.handleDisbandTroopsByLevel('${row.troopDefId}', ${row.level}, 1)" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#450a0a] text-[#f87171] border border-[#f87171]/40 text-[9px] cursor-pointer">-1</button>
                  <button data-action="disband-troops" data-troop-def-id="${row.troopDefId}" data-level="${row.level}" data-qty="${row.trained}" onclick="window.WargameApp.handleDisbandTroopsByLevel('${row.troopDefId}', ${row.level}, ${row.trained})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#450a0a] text-[#f87171] border border-[#f87171]/40 text-[9px] cursor-pointer">All</button>
                ` : '<span class="text-[#64748b] text-[9px]">—</span>'}
              </td>
            </tr>
          `;
        }).join('');

    // 2. Recruitment Cards (ONLY unlocked troop types shown; hidden until required camp is built)
    const recruitCardsHtml = unlockedTroopDefs.length === 0
      ? '<div class="p-2.5 rounded bg-[#111722] border border-[#283347] text-[11px] text-[#8b949e]">No troop types unlocked yet. Build a <strong>Fighter Camp</strong> to unlock Basic Infantry or an <strong>Archer Camp</strong> to unlock Archers.</div>'
      : unlockedTroopDefs.map(function(td) {
          const maxUnlockedLvl = getTroopMaxUnlockedLevel(city, td);
          const storedLvl = lvlStore[td.id];
          const selLvl = (typeof storedLvl === 'number' && storedLvl >= 1 && storedLvl <= maxUnlockedLvl)
            ? storedLvl
            : maxUnlockedLvl;
          const durMs = computeTroopTrainingDurationMs(city, td, selLvl);
          const lvlStats = computeTroopStatsForLevel(td, selLvl);
          const unitCostMap = computeTroopCostForLevel(td, selLvl);
          const baseEval = evaluateTroopAvailability(world, city, td, 1, selLvl);
          const maxRec = baseEval.maxRecruitable;
          const rawSel = typeof qtyStore[td.id] === 'number' ? qtyStore[td.id] : 1;
          const selQty = maxRec >= 1 ? Math.max(1, Math.min(maxRec, Math.floor(rawSel))) : 1;
          const avail = evaluateTroopAvailability(world, city, td, selQty, selLvl);
          const canTrain = avail.state === TROOP_AVAILABILITY_STATES.AVAILABLE;
          const weight = td.capacityWeight || 1;
          const costEntries = Object.keys(unitCostMap);

          let levelOptionsHtml = '';
          for (let lv = maxUnlockedLvl; lv >= 1; lv--) {
            levelOptionsHtml += `<option value="${lv}" ${lv === selLvl ? 'selected' : ''}>Lv ${lv}${lv === maxUnlockedLvl ? ' (Max)' : ''}</option>`;
          }

          let statusBadgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#064e3b] text-[#34d399]">Available</span>';
          let statusNote = '';
          if (avail.state === TROOP_AVAILABILITY_STATES.QUEUE_FULL) {
            statusBadgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#1e293b] text-[#94a3b8]">Queue Full</span>';
            statusNote = 'Shared military queue full (' + tq.length + '/' + maxSlots + ')';
          } else if (avail.state === TROOP_AVAILABILITY_STATES.INSUFFICIENT_CAPACITY) {
            statusBadgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#451a03] text-[#fb923c]">Insufficient Capacity</span>';
            statusNote = 'Need +' + avail.capacityNeeded + ' capacity (' + usage.available + ' free of ' + usage.maxCapacity + ') — upgrade Barracks or disband troops';
          } else if (avail.state === TROOP_AVAILABILITY_STATES.INSUFFICIENT_RESOURCES) {
            const missText = avail.missingResources.map(function(m) { return m.need + ' ' + m.resource + ' (have ' + m.have + ')'; }).join(', ');
            statusBadgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#450a0a] text-[#f87171]">Insufficient Resources</span>';
            statusNote = 'Short on ' + missText;
          }

          const unitCostParts = costEntries.map(function(rk) {
            return (unitCostMap[rk] || 0) + ' ' + rk;
          }).join(' • ');

          const previewCostParts = costEntries.map(function(rk) {
            const totalNeed = (unitCostMap[rk] || 0) * selQty;
            const have = (city.stockpile && city.stockpile[rk]) || 0;
            const rem = have - totalNeed;
            const cls = rem < 0 ? 'text-[#f87171]' : 'text-[#cbd5e1]';
            return '<span class="' + cls + '">' + rk + ': <strong>' + totalNeed + '</strong> <span class="text-[#8b949e]">(' + have + ' → ' + Math.max(0, rem) + ')</span></span>';
          }).join(' • ');

          return `
            <div class="p-2.5 rounded bg-[#111722] border border-[#283347] space-y-2 text-xs">
              <div class="flex flex-wrap items-center justify-between gap-2 font-mono">
                <span class="font-bold text-[#e6edf3]">${td.icon} ${td.name} <span class="text-[10px] text-[#8b949e]">(${td.roleLabel || td.role})</span></span>
                <div class="flex items-center gap-1.5">
                  <label class="text-[10px] text-[#8b949e]">Level:
                    <select data-troop-level="${td.id}" onchange="window.WargameApp.handleSetTroopRecruitLevel('${td.id}', this.value)" class="ml-1 px-1.5 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[#fbbf24] text-[10px] font-mono cursor-pointer">${levelOptionsHtml}</select>
                  </label>
                  ${statusBadgeHtml}
                  <span class="text-[10px] text-[#34d399]">⏱ ${formatSimDuration(durMs)}/unit</span>
                </div>
              </div>
              <div class="text-[10px] text-[#8b949e] font-mono">Lv ${selLvl} Stats: HP ${lvlStats.hp} • ATK ${lvlStats.atk} • DEF ${lvlStats.def} • Cap ${weight}/unit | Unit Cost: ${unitCostParts}</div>
              <div class="space-y-1.5 pt-0.5">
                <div class="flex flex-wrap items-center gap-2 font-mono">
                  <span class="text-[10px] text-[#8b949e]">Qty:</span>
                  <input type="range" data-troop-slider="${td.id}" min="1" max="${Math.max(1, maxRec)}" value="${selQty}" ${maxRec < 1 ? 'disabled' : ''} oninput="window.WargameApp.handleSetTroopRecruitQty('${td.id}', this.value)" class="flex-1 min-w-[90px] accent-[#f87171] cursor-pointer" />
                  <input type="number" data-troop-qty="${td.id}" min="1" max="${Math.max(1, maxRec)}" value="${selQty}" ${maxRec < 1 ? 'disabled' : ''} oninput="window.WargameApp.handleSetTroopRecruitQty('${td.id}', this.value)" class="w-14 px-1.5 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[#e6edf3] text-center text-[11px]" />
                  <button type="button" onclick="window.WargameApp.handleSetTroopRecruitQty('${td.id}', ${Math.max(1, maxRec)})" ${maxRec < 1 ? 'disabled' : ''} class="px-2 py-0.5 rounded text-[10px] ${maxRec >= 1 ? 'bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">Max (${maxRec})</button>
                  <button data-action="train-troops" data-troop-def-id="${td.id}" data-level="${selLvl}" data-qty="${selQty}" onclick="window.WargameApp.handleTrainTroops('${td.id}', ${selQty}, ${selLvl})" ${canTrain ? '' : 'disabled'} class="px-3 py-1 rounded text-[10px] font-bold uppercase ${canTrain ? 'bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">Recruit ×${selQty} (Lv ${selLvl})</button>
                </div>
                <div class="p-1.5 rounded bg-[#080b11] border border-[#1e293b] text-[10px] font-mono space-y-0.5">
                  <div>Total Cost (×${selQty} Lv ${selLvl}): ${previewCostParts}</div>
                  <div class="text-[#8b949e]">Capacity: +${selQty * weight} (${usage.totalUsed + (selQty * weight)}/${usage.maxCapacity}) • Est. Time: <span class="text-[#34d399]">${formatSimDuration(durMs * selQty)}</span></div>
                </div>
                ${statusNote ? `<div class="text-[10px] font-mono text-[#fbbf24]">⚠️ ${statusNote}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');

    // 3. Upgrade Eligible Lower-Level Barracks Troops (shares the same city military queue)
    const upgradeEligibleRows = inv.byTypeAndLevel.filter(function(r) {
      return r.trained > 0 && r.maxUnlockedLevel > r.level;
    });
    const upgradeCardsHtml = upgradeEligibleRows.length === 0
      ? '<div class="text-[11px] text-[#8b949e] italic">No lower-level Barracks troops eligible for upgrade. Upgrade your Fighter Camp or Archer Camp to unlock higher troop levels.</div>'
      : upgradeEligibleRows.map(function(row) {
          const td = getTroopDefinition(row.troopDefId);
          const toLvl = row.maxUnlockedLevel;
          const upgCost = computeTroopUpgradeCost(td, row.level, toLvl);
          const upgDur = computeTroopUpgradeDurationMs(city, td, row.level, toLvl);
          const maxUpg = computeMaxUpgradeableQuantity(world, city, td, row.level, toLvl);
          const upgKey = row.troopDefId + ':' + row.level;
          const rawUpgQty = typeof upgQtyStore[upgKey] === 'number' ? upgQtyStore[upgKey] : maxUpg;
          const selUpgQty = maxUpg >= 1 ? Math.max(1, Math.min(maxUpg, Math.floor(rawUpgQty))) : 1;
          const canUpg = maxUpg >= 1 && tq.length < maxSlots;
          const costParts = Object.keys(upgCost).filter(function(rk) { return (upgCost[rk] || 0) > 0; }).map(function(rk) {
            return rk + ': ' + ((upgCost[rk] || 0) * selUpgQty);
          }).join(' • ') || 'No extra resource cost';
          return `
            <div class="p-2 rounded bg-[#111722] border border-[#c084fc]/40 space-y-1.5 text-xs font-mono">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[#e6edf3] font-bold">${row.icon} ${row.name} <span class="text-[#fbbf24]">Lv ${row.level}</span> → <span class="text-[#c084fc]">Lv ${toLvl}</span> <span class="text-[10px] text-[#8b949e]">(${row.trained} eligible)</span></span>
                <span class="text-[10px] text-[#34d399]">⏱ ${formatSimDuration(upgDur * selUpgQty)}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[10px] text-[#8b949e]">Qty:</span>
                <input type="range" data-troop-upgrade-slider="${upgKey}" min="1" max="${Math.max(1, maxUpg)}" value="${selUpgQty}" ${!canUpg ? 'disabled' : ''} oninput="window.WargameApp.handleSetTroopUpgradeQty('${row.troopDefId}', ${row.level}, this.value)" class="flex-1 min-w-[80px] accent-[#c084fc] cursor-pointer" />
                <input type="number" data-troop-upgrade-qty="${upgKey}" min="1" max="${Math.max(1, maxUpg)}" value="${selUpgQty}" ${!canUpg ? 'disabled' : ''} oninput="window.WargameApp.handleSetTroopUpgradeQty('${row.troopDefId}', ${row.level}, this.value)" class="w-14 px-1.5 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[#e6edf3] text-center text-[11px]" />
                <button data-action="upgrade-troops" data-troop-def-id="${row.troopDefId}" data-from-level="${row.level}" data-to-level="${toLvl}" data-qty="${selUpgQty}" onclick="window.WargameApp.handleUpgradeTroops('${row.troopDefId}', ${row.level}, ${selUpgQty}, ${toLvl})" ${canUpg ? '' : 'disabled'} class="px-2.5 py-1 rounded text-[10px] font-bold uppercase ${canUpg ? 'bg-[#c084fc] hover:bg-[#a855f7] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">Upgrade ×${selUpgQty}</button>
              </div>
              <div class="text-[10px] text-[#8b949e]">Upgrade Cost (×${selUpgQty}): <span class="text-[#cbd5e1]">${costParts}</span> • +0 Capacity</div>
            </div>
          `;
        }).join('');

    // 4. Shared City Military Queue (Recruitment & Upgrades sequentially)
    const queueRowsHtml = tq.length === 0
      ? '<div class="text-[11px] text-[#8b949e] italic">Military production queue is idle.</div>'
      : tq.map(function(item, qIdx) {
          const done = item.completedCount || 0;
          const total = item.quantity || 1;
          const isUpg = item.jobKind === 'upgrade';
          const badge = isUpg
            ? '<span class="px-1 py-0.5 rounded bg-[#3b0764] text-[#e9d5ff] text-[9px] uppercase">Upgrade</span>'
            : '<span class="px-1 py-0.5 rounded bg-[#450a0a] text-[#fecaca] text-[9px] uppercase">Recruit</span>';
          const descLabel = isUpg
            ? ((item.troopName || item.troopDefId) + ' Lv ' + (item.fromLevel || 1) + '→' + (item.toLevel || 2))
            : ((item.troopName || item.troopDefId) + ' Lv ' + (item.level || 1));
          const isActive = (item.status === 'training' || item.status === 'upgrading');
          if (isActive) {
            const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
            const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
            const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
            const barColor = isUpg ? '#c084fc' : '#f87171';
            return `
              <div class="p-2 rounded bg-[#111722] border ${isUpg ? 'border-[#c084fc]/50' : 'border-[#f87171]/50'} space-y-1 text-[11px] font-mono">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[#e6edf3] font-bold">#${qIdx + 1} ${badge} ${descLabel} (${done}/${total})</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[#34d399]">${formatSimDuration(rem)}</span>
                    <button data-action="cancel-troop-training" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelTroopTraining('${item.queueItemId}')" class="px-1.5 py-0.5 rounded bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fecaca] text-[10px] cursor-pointer">Cancel</button>
                  </div>
                </div>
                <div class="w-full h-1.5 bg-[#080b11] rounded-full overflow-hidden"><div class="h-full" style="width:${pct}%;background:${barColor}"></div></div>
              </div>
            `;
          }
          return `
            <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between text-[11px] font-mono">
              <span class="text-[#cbd5e1]">#${qIdx + 1} ${badge} ${descLabel} ×${total}</span>
              <button data-action="cancel-troop-training" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelTroopTraining('${item.queueItemId}')" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#450a0a] text-[#f87171] text-[10px] cursor-pointer">Cancel</button>
            </div>
          `;
        }).join('');

    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#f87171]/40 space-y-3">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span class="text-[#f87171] font-bold">🛡️ Barracks — Central Recruitment, Upgrades & Troop Inventory</span>
            <span class="text-[#fbbf24]">Barracks Capacity: ${usage.totalUsed} / ${usage.maxCapacity} (${usage.available} free)</span>
          </div>
          <p class="text-[11px] text-[#8b949e]">All military recruitment and troop upgrades share this city's Barracks production queue. Specialized camps unlock troop types and higher levels.</p>
        </div>
        <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
          <div class="h-full bg-[#f87171]" style="width:${capPct}%"></div>
        </div>
        <div class="p-2 rounded bg-[#111722] border border-[#283347] space-y-1">
          <div class="flex items-center justify-between text-[10px] font-mono uppercase">
            <span class="text-[#38bdf8] font-bold">Barracks Troop Inventory (By Type & Level)</span>
            <span class="text-[#8b949e] normal-case">Total Trained: <strong class="text-[#34d399]">${inv.totals.trained}</strong></span>
          </div>
          <table class="w-full text-[11px] font-mono">
            <thead>
              <tr class="text-[10px] text-[#8b949e]">
                <th class="text-left pb-1">Troop Type</th>
                <th class="text-center pb-1 px-1.5">Level</th>
                <th class="text-right pb-1 px-1.5">Trained</th>
                <th class="text-right pb-1 px-1.5">Training</th>
                <th class="text-right pb-1 px-1.5">Upgrading</th>
                <th class="text-right pb-1 px-1.5">Projected</th>
                <th class="text-right pb-1 pl-2">Disband</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryRowsHtml}
              <tr class="border-t border-[#334155] font-bold">
                <td class="pt-1 pr-2 text-[#e6edf3]" colspan="2">Total</td>
                <td class="pt-1 px-1.5 text-right text-[#34d399]">${inv.totals.trained}</td>
                <td class="pt-1 px-1.5 text-right text-[#fbbf24]">${inv.totals.training}</td>
                <td class="pt-1 px-1.5 text-right text-[#c084fc]">${inv.totals.upgrading}</td>
                <td class="pt-1 px-1.5 text-right text-[#38bdf8]">${inv.totals.projectedTotal}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        ${speedMult > 1
          ? `<div class="px-2 py-1 rounded bg-[#064e3b]/40 border border-[#34d399]/30 text-[10px] font-mono text-[#34d399]">🎯 Fighter Camp Bonus Active: ${Math.round(speedMult * 100)}% training speed</div>`
          : ''}
        <div class="space-y-1.5">
          <div class="text-[10px] font-mono uppercase text-[#cbd5e1] font-bold">Recruit Troops</div>
          ${recruitCardsHtml}
        </div>
        <div class="pt-2 border-t border-[#283347] space-y-1.5">
          <div class="text-[10px] font-mono uppercase text-[#c084fc] font-bold">Upgrade Existing Barracks Troops</div>
          ${upgradeCardsHtml}
        </div>
        <div class="pt-2 border-t border-[#283347] space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-mono uppercase">
            <span class="text-[#f87171] font-bold">Shared Military Queue (${tq.length}/${maxSlots})</span>
            <span class="text-[#8b949e] normal-case">Sequential (1 active job at a time)</span>
          </div>
          ${queueRowsHtml}
        </div>
      </div>
    `);
  }

  if (bId === 'fighter_camp') {
    const speedMult = computeCityTrainingSpeedMultiplier(city);
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#f43f5e]/40 space-y-1.5 text-xs">
        <div class="flex items-center justify-between font-mono">
          <span class="text-[#f43f5e] font-bold">🎯 Military Drill Grounds</span>
          <span class="text-[#34d399]">Unlocks: Basic Infantry Lv 1–${lvl} • Speed: ${Math.round(speedMult * 100)}%</span>
        </div>
        <p class="text-[11px] text-[#8b949e]">Unlocks <strong>Basic Infantry</strong> up to Level ${lvl} and grants +25% troop training speed per level. All recruitment and upgrades are managed centrally in the <strong>Barracks</strong>.</p>
      </div>
    `);
  }

  if (bId === 'archer_camp') {
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#34d399]/40 space-y-1.5 text-xs">
        <div class="flex items-center justify-between font-mono">
          <span class="text-[#34d399] font-bold">🏹 Archery Drill Range</span>
          <span class="text-[#fbbf24]">Unlocks: Archers Lv 1–${lvl}</span>
        </div>
        <p class="text-[11px] text-[#8b949e]">Unlocks <strong>Archers</strong> up to Level ${lvl}. All troop recruitment and upgrades are managed centrally in the <strong>Barracks</strong>.</p>
      </div>
    `);
  }

  const guildServicesHtml = buildUnifiedGuildServicesHtml(simHost, bId, city, bDef, lvl, activePlot);
  if (guildServicesHtml) {
    sections.push(guildServicesHtml);
  }

  const nextLvl = lvl + 1;
  const isMaxLvl = nextLvl > (bDef.maxLevel || 5);
  const upgCost = !isMaxLvl ? computeBuildingUpgradeCost(bId, nextLvl) : null;
  const upgDur = !isMaxLvl ? computeBuildingDurationMs(bId, nextLvl) : 0;
  const mhLvl = (city.buildings && city.buildings.meeting_hall) || 1;
  const isMH = (bId === 'meeting_hall');
  const cappedByMH = !isMH && nextLvl > mhLvl;
  const canAffordUpg = Boolean(
    !isMaxLvl && !cappedByMH && activePlot && !activePlot.underConstruction &&
    (city.stockpile.wood  || 0) >= (upgCost.wood  || 0) &&
    (city.stockpile.stone || 0) >= (upgCost.stone || 0) &&
    (city.stockpile.gold  || 0) >= (upgCost.gold  || 0) &&
    (city.stockpile.water || 0) >= (upgCost.water || 0) &&
    (city.stockpile.ore   || 0) >= (upgCost.ore   || 0)
  );

  // For non-guild buildings, show a clean compact Upgrade action button (no bulky Producing/Consuming box!)
  if (!guildServicesHtml && activePlot && !isMaxLvl) {
    const upgTitle = cappedByMH
      ? ('Requires Meeting Hall Lv ' + nextLvl)
      : ('Upgrade Lv ' + nextLvl + ': ' + upgCost.wood + 'W, ' + upgCost.stone + 'S' + (upgCost.gold ? (', ' + upgCost.gold + 'G') : '') + ' (' + formatSimDuration(upgDur) + ')');
    sections.push(`
      <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#080b11]/80 border border-[#283347]">
        <div class="text-[11px] font-mono text-[#cbd5e1]">
          Upgrade Lv ${nextLvl}: <span class="text-[#fbbf24]">${upgCost.wood}W • ${upgCost.stone}S${upgCost.gold ? (' • ' + upgCost.gold + 'G') : ''}</span> • ⏱ ${formatSimDuration(upgDur)}
          ${cappedByMH ? '<span class="text-[#f87171] ml-1">(Needs Meeting Hall Lv ' + nextLvl + ')</span>' : ''}
        </div>
        <button title="${upgTitle}" onclick="window.WargameApp.handleQueueBuilding(${activePlot.plotIndex}, '${bId}')" ${!canAffordUpg ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase ${canAffordUpg ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
          ⬆️ Upgrade
        </button>
      </div>
    `);
  }

  const innerHtml = sections.join('');
  const netOverlayText = buildNetResourceOverlayText(bDef, lvl);
  const showInfo = Boolean(simHost.state && simHost.state._showFacilityInfo);
  const showLevels = Boolean(simHost.state && simHost.state._showBuildingLevels);
  const showDemolishConfirm = Boolean(simHost.state && simHost.state._confirmFacilityDemolish);
  const canDemolish = Boolean(activePlot && !isMH && !activePlot.underConstruction);

  const infoPopoverHtml = showInfo ? `
    <div class="mx-3.5 p-3 rounded-lg bg-[#080b11]/92 backdrop-blur-md border border-[#fbbf24]/60 shadow-xl space-y-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold text-[#fbbf24]">ⓘ About ${bDef.name} (Level ${lvl})</span>
        <button onclick="window.WargameApp.handleToggleFacilityInfo()" class="text-[#94a3b8] hover:text-white text-xs font-bold cursor-pointer">✕</button>
      </div>
      <p class="text-[11px] text-[#e6edf3]/90 leading-relaxed">${bDef.desc || 'Operational town construct.'}</p>
    </div>
  ` : '';

  const levelsTableHtml = showLevels ? buildBuildingLevelsTableHtml(bId, bDef, lvl) : '';

  const demolishPopoverHtml = (showDemolishConfirm && canDemolish) ? `
    <div class="mx-3.5 p-3 rounded-lg bg-[#450a0a]/92 backdrop-blur-md border border-[#f87171]/60 shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs">
      <span class="text-[#fecaca] font-semibold">🗑️ Demolish ${bDef.name} (Lv ${lvl}) for 35% resource salvage?</span>
      <div class="flex items-center gap-1.5">
        <button onclick="window.WargameApp.handleDemolishBuilding(${activePlot.plotIndex}); window.WargameApp.handleSwitchView('city')" class="px-2.5 py-1 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-mono font-bold text-[10px] uppercase cursor-pointer">Confirm Demolish</button>
        <button onclick="window.WargameApp.handleToggleFacilityDemolishConfirm()" class="px-2.5 py-1 rounded bg-[#1a2232] text-[#e6edf3] font-mono text-[10px] cursor-pointer">Cancel</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="relative min-h-[540px] rounded-xl overflow-hidden border border-[#fbbf24]/50 bg-gradient-to-br from-[#161e2e] via-[#0f1520] to-[#080b11] shadow-2xl flex flex-col justify-between">
      ${interiorSrc ? `<img src="${interiorSrc}" alt="${bDef.name} Interior" class="absolute inset-0 w-full h-full object-cover object-center" />` : `<div class="absolute inset-0 flex items-center justify-center opacity-10 text-[140px] select-none pointer-events-none">${bDef.icon || '🏛️'}</div>`}
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b11]/55 via-[#080b11]/15 to-[#080b11]/90"></div>
      <div class="relative z-10 p-4 flex items-start justify-between gap-2">
        <div class="space-y-1">
          <div class="px-3.5 py-2 rounded-lg bg-[#080b11]/75 backdrop-blur-md border border-[#fbbf24]/40 inline-block">
            <div class="text-sm font-display font-bold text-[#fbbf24]">${bDef.icon || '🏛️'} ${bDef.name} <span class="text-[10px] font-mono text-[#e6edf3]/85">• Lv ${lvl} (${city.name})</span></div>
          </div>
          ${netOverlayText ? `<div class="px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#34d399] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${netOverlayText}</div>` : ''}
        </div>
        <div class="flex items-start gap-2">
          <div class="flex flex-col items-center gap-1.5">
            <button onclick="window.WargameApp.handleToggleFacilityInfo()" title="Building Info" class="w-8 h-8 rounded-full bg-[#080b11]/80 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur-md border border-[#fbbf24]/50 text-[#fbbf24] font-bold text-xs flex items-center justify-center cursor-pointer transition">ⓘ</button>
            <button onclick="window.WargameApp.handleToggleBuildingLevels()" title="View All Building Levels" class="w-8 h-8 rounded-full bg-[#080b11]/80 hover:bg-[#38bdf8] hover:text-[#080b11] backdrop-blur-md border border-[#38bdf8]/50 text-[#38bdf8] text-xs flex items-center justify-center cursor-pointer transition">📊</button>
            ${canDemolish ? `<button onclick="window.WargameApp.handleToggleFacilityDemolishConfirm()" title="Demolish Building" class="w-8 h-8 rounded-full bg-[#080b11]/80 hover:bg-[#f87171] hover:text-[#080b11] backdrop-blur-md border border-[#f87171]/50 text-[#f87171] text-xs flex items-center justify-center cursor-pointer transition">🗑️</button>` : ''}
          </div>
          <button onclick="window.WargameApp.handleSwitchView('city')" class="px-3 py-1.5 rounded-lg bg-[#080b11]/80 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur-md text-[#fbbf24] border border-[#fbbf24]/50 text-[11px] font-mono font-bold uppercase cursor-pointer transition whitespace-nowrap">🏰 Exit to City</button>
        </div>
      </div>
      ${infoPopoverHtml ? `<div class="relative z-20">${infoPopoverHtml}</div>` : ''}
      ${levelsTableHtml ? `<div class="relative z-20">${levelsTableHtml}</div>` : ''}
      ${demolishPopoverHtml ? `<div class="relative z-20">${demolishPopoverHtml}</div>` : ''}
      <div class="relative z-10 flex-1 min-h-[160px]"></div>
      ${innerHtml ? `<div class="relative z-10 p-4 space-y-2">${innerHtml}</div>` : ''}
    </div>
  `;
}

export function renderWargameFacilityModal(simHost) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('wgFacilityModal');
  if (modal) modal.classList.add('hidden');
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

  // A. Selected Unit Inspector Card (+ Deployed Armies Quick Selector)
  const selUnit = getSelectedOverworldUnit(state);
  const unitCardEl = document.getElementById('wgSelectedUnitCard');
  if (unitCardEl) {
    const activeArmies = (ow.units || []).filter(function(u) { return u && u.alive && !u.reintegrated && u.unitType === 'army'; });
    const armiesStripHtml = activeArmies.length > 0 ? `
      <div class="pb-2 mb-2 border-b border-[#283347] space-y-1">
        <div class="text-[10px] font-mono uppercase text-[#f87171] font-bold">🛡️ Deployed Armies (${activeArmies.length})</div>
        <div class="flex flex-wrap gap-1">
          ${activeArmies.map(function(au) {
            const isSelArmy = selUnit && selUnit.id === au.id;
            const cnt = getArmyTotalTroopCount(world, au.id);
            return `<button onclick="window.WargameApp.handleSelectOverworldUnit('${au.id}')" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${isSelArmy ? 'bg-[#f87171] text-[#080b11]' : 'bg-[#111722] text-[#fecaca] border border-[#f87171]/40 hover:bg-[#1a2232]'}">🛡️ ${au.shortName} (${cnt})</button>`;
          }).join('')}
        </div>
      </div>
    ` : '';
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
      } else if ((selUnit.status === 'marching' || selUnit.status === 'returning') && selUnit.marchPlan) {
        const remSteps = selUnit.marchPlan.remainingPath ? selUnit.marchPlan.remainingPath.length : 0;
        const stepRemMs = Math.max(0, (selUnit.marchPlan.stepDueSimTimeMs || 0) - simTimeMs);
        const isReturning = selUnit.marchPlan.intent === 'return_city' || selUnit.marchPlan.intent === 'return_home' || selUnit.status === 'returning';
        marchHtml = `
          <div class="p-2 rounded bg-[#111722] border ${isReturning ? 'border-[#fbbf24]/50' : 'border-[#38bdf8]/40'} space-y-1">
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span class="${isReturning ? 'text-[#fbbf24]' : 'text-[#38bdf8]'} font-bold">${isReturning ? '🏠 Returning Home' : ('⏳ Marching to (' + selUnit.marchPlan.targetX + ', ' + selUnit.marchPlan.targetY + ')')}</span>
              <span class="text-[#fbbf24]">${remSteps} tiles left</span>
            </div>
            <div class="text-[10px] text-[#8b949e] font-mono">Next tile in ${formatSimDuration(stepRemMs)}</div>
            ${selUnit.unitType !== 'army' ? `<button data-action="cancel-march" onclick="window.WargameApp.handleCancelMarch()" class="w-full mt-1 py-1 rounded bg-[#1a2232] hover:bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40 text-[10px] font-mono font-bold cursor-pointer">✕ Halt March</button>` : ''}
          </div>
        `;
      } else if (selUnit.unitType === 'army' && selUnit.status === 'objective_in_progress' && selUnit.objective) {
        const objRemMs = Math.max(0, (selUnit.objective.dueSimTimeMs || 0) - simTimeMs);
        const isCombatObj = selUnit.objective.type === ARMY_OBJECTIVE_TYPES.ENGAGE_TARGET;
        const activeBattle = isCombatObj ? selUnit.objective.battle : null;
        const roundLabel = activeBattle
          ? ('Round ' + Math.min(activeBattle.plannedRounds || 1, (activeBattle.currentRound || 0) + 1) + ' / ' + (activeBattle.plannedRounds || 1))
          : '';
        marchHtml = `
          <div class="p-2 rounded bg-[#111722] border ${isCombatObj ? 'border-[#ef4444]/60' : 'border-[#c084fc]/50'} space-y-1 text-[11px] font-mono">
            <div class="flex items-center justify-between">
              <span class="${isCombatObj ? 'text-[#f87171]' : 'text-[#c084fc]'} font-bold">${isCombatObj ? ('⚔️ Battle: ' + (selUnit.objective.targetName || 'Military Target')) : ('🧭 Executing: ' + selUnit.objective.type)}</span>
              <span class="text-[#34d399]">${formatSimDuration(objRemMs)}</span>
            </div>
            ${activeBattle ? `
              <div class="flex items-center justify-between text-[10px] text-[#fbbf24]">
                <span>${roundLabel}</span>
                <span>Enemy Threat: ${activeBattle.finalStrengths ? activeBattle.finalStrengths.enemyPower : activeBattle.initialStrengths.enemyPower}</span>
              </div>
            ` : `<div class="text-[10px] text-[#8b949e]">Location: (${selUnit.x}, ${selUnit.y})</div>`}
          </div>
        `;
      } else {
        marchHtml = `
          <div class="text-[11px] text-[#34d399] font-mono">Status: Ready for Orders at (${selUnit.x}, ${selUnit.y})</div>
        `;
      }

      let armyDetailHtml = '';
      if (selUnit.unitType === 'army') {
        const aGroups = getArmyTroopGroups(world, selUnit.id);
        const aPower = computeArmyCombatPower(world, selUnit.id);
        const homeC = (world.cities && selUnit.homeCityId) ? world.cities[selUnit.homeCityId] : null;
        const obj = selUnit.objective || null;
        const compRows = aGroups.map(function(g) {
          const td = getTroopDefinition(g.troopDefId);
          return '<div class="flex justify-between text-[10px] font-mono"><span class="text-[#e6edf3]">' + (td ? (td.icon + ' ' + td.name) : g.troopDefId) + ' Lv ' + (g.level || 1) + '</span><span class="text-[#34d399]">×' + g.count + '</span></div>';
        }).join('');
        const lastCbt = selUnit.lastCombatResult || null;
        const combatSummaryHtml = lastCbt ? `
          <div class="p-1.5 rounded ${lastCbt.victory ? 'bg-[#064e3b]/40 border border-[#34d399]/50 text-[#6ee7b7]' : 'bg-[#450a0a]/40 border border-[#f87171]/50 text-[#fecaca]'} text-[10px] font-mono space-y-0.5">
            <div class="font-bold">${lastCbt.victory ? '✓ Victory' : '✕ Defeat'} vs ${lastCbt.targetName} (${lastCbt.armyPower} vs ${lastCbt.enemyPower})</div>
            <div>Losses: ${lastCbt.totalLosses} • Survivors: ${lastCbt.survivingTroops}</div>
            ${lastCbt.victory && lastCbt.unlockedLabels && lastCbt.unlockedLabels.length > 0 ? `<div class="text-[#fbbf24]">Unlocked: ${lastCbt.unlockedLabels.join(', ')}</div>` : ''}
          </div>
        ` : '';
        armyDetailHtml = `
          <div class="p-2 rounded bg-[#080b11] border border-[#f87171]/40 space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-mono">
              <span class="text-[#f87171] font-bold">Home: ${homeC ? homeC.name : 'Unknown'} • Power ${aPower}</span>
              <span class="text-[#cbd5e1]">Obj: ${obj ? (obj.type + ' (' + obj.status + ')') : 'none'}</span>
            </div>
            <div class="space-y-0.5">${compRows}</div>
            ${combatSummaryHtml}
            <label class="flex items-center gap-1.5 text-[10px] font-mono text-[#cbd5e1] pt-1 cursor-pointer">
              <input type="checkbox" ${selUnit.stayDeployed ? 'checked' : ''} onchange="window.WargameApp.handleSetArmyReturnPolicy('${selUnit.id}', this.checked)" class="accent-[#f87171]" />
              <span>Stay deployed after completing objective</span>
            </label>
            <div class="text-[10px] text-[#8b949e]">Click any passable Overworld hex to redirect this army.</div>
            ${selUnit.status !== 'returning' ? `
              <button data-action="return-army-home" onclick="window.WargameApp.handleReturnArmyHome('${selUnit.id}')" class="w-full py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 font-mono font-bold text-[10px] uppercase cursor-pointer">
                🏠 Return to Barracks
              </button>
            ` : ''}
          </div>
        `;
      }

      newHtml = `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">${selUnit.unitType === 'army' ? '🛡️' : (selUnit.unitType === 'settler' ? '🚩' : '⚔️')}</span>
              <div>
                <div class="text-xs font-bold text-[#e6edf3]">${selUnit.name}</div>
                <div class="text-[10px] font-mono text-[#8b949e]">Terrain: <span class="text-[#84cc16]">${tDef ? tDef.name : 'Plains'}</span> • Vision ${selUnit.visionRadius}</div>
              </div>
            </div>
            <span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#111722] text-[#34d399] border border-[#283347]">${selUnit.unitType === 'army' ? (getArmyTotalTroopCount(world, selUnit.id) + ' Troops') : ('HP ' + selUnit.hp + '/' + selUnit.maxHp)}</span>
          </div>
          ${cargoHtml}
          ${marchHtml}
          ${armyDetailHtml}
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

    // Task 05B-2: Explicit Military Target Inspector Card (when player selects a discovered target)
    let targetInspectorHtml = '';
    const inspectedTarget = state._selectedMilitaryTargetId ? getMilitaryTargetById(ow, state._selectedMilitaryTargetId) : null;
    if (inspectedTarget && (inspectedTarget.discovered || (ow.explored[inspectedTarget.y] && ow.explored[inspectedTarget.y][inspectedTarget.x]))) {
      const isClearedMt = inspectedTarget.status === MILITARY_TARGET_STATUS.CLEARED;
      const blocksText = (inspectedTarget.blocksAccess || []).map(function(b) { return b.label || b.targetRef; }).join(', ') || 'None';
      const primaryCityMt = getPrimaryCity(state);
      const hasTrainedBarracks = Boolean(primaryCityMt && getCityTroopInventorySummary(world, primaryCityMt).totals.trained > 0);
      const selArmyForAssign = (selUnit && selUnit.alive && !selUnit.reintegrated && selUnit.unitType === 'army') ? selUnit : null;
      const selArmyPower = selArmyForAssign ? computeArmyCombatPower(world, selArmyForAssign.id) : 0;
      targetInspectorHtml = `
        <div id="wgMilitaryTargetInspector" class="p-2.5 mb-2 rounded bg-[#080b11] border ${isClearedMt ? 'border-[#34d399]/60' : 'border-[#ef4444]/70'} space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs font-bold ${isClearedMt ? 'text-[#34d399]' : 'text-[#f87171]'}">${isClearedMt ? '✓' : '⚔️'} ${inspectedTarget.name}</div>
            <button onclick="window.WargameApp.handleCloseMilitaryTargetInspector()" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[10px] font-mono text-[#cbd5e1] cursor-pointer">✕</button>
          </div>
          <div class="text-[10px] font-mono text-[#94a3b8]">(${inspectedTarget.x}, ${inspectedTarget.y}) • ${isClearedMt ? '<span class="text-[#34d399] font-bold">CLEARED</span>' : ('<span class="text-[#f87171] font-bold">ACTIVE THREAT</span> • Threat Power ' + inspectedTarget.enemyPower)}</div>
          <div class="text-[10px] text-[#cbd5e1]">${inspectedTarget.desc || ''}</div>
          <div class="text-[10px] font-mono ${isClearedMt ? 'text-[#34d399]' : 'text-[#fbbf24]'}">${isClearedMt ? 'Unlocked Access:' : 'Blocks Access:'} <strong>${blocksText}</strong></div>
          ${!isClearedMt ? `
            <div class="flex flex-col gap-1 pt-1">
              ${hasTrainedBarracks ? `
                <button data-action="deploy-to-target" data-target-id="${inspectedTarget.id}" onclick="window.WargameApp.handleOpenDeployArmyModal(${inspectedTarget.x}, ${inspectedTarget.y}, '${inspectedTarget.id}')" class="w-full py-1.5 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-mono font-bold text-[10px] uppercase cursor-pointer">🛡️ Deploy Army to Target</button>
              ` : `<div class="text-[10px] font-mono text-[#8b949e]">Train troops in Barracks to deploy a Field Army.</div>`}
              ${selArmyForAssign ? `
                <button data-action="assign-army-target" data-target-id="${inspectedTarget.id}" onclick="window.WargameApp.handleAssignArmyToTarget('${selArmyForAssign.id}', '${inspectedTarget.id}')" class="w-full py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fecaca] border border-[#f87171]/50 font-mono font-bold text-[10px] uppercase cursor-pointer">⚔️ Assign ${selArmyForAssign.shortName} (Pwr ${selArmyPower} vs ${inspectedTarget.enemyPower})</button>
              ` : ''}
            </div>
          ` : `<div class="text-[10px] font-mono text-[#6ee7b7]">Threat permanently cleared. Heroes may now access ${blocksText}.</div>`}
        </div>
      `;
    }

    setHtmlIfChanged(unitCardEl, targetInspectorHtml + armiesStripHtml + newHtml);
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

    // 2B. Shared Military Production Queue (Recruitment & Upgrades)
    for (let c = 0; c < cities.length; c++) {
      const city = cities[c];
      const tq = city.troopTrainingQueue || [];
      if (tq.length > 0) {
        const troopItems = [];
        for (let q = 0; q < tq.length; q++) {
          const item = tq[q];
          const done = item.completedCount || 0;
          const total = item.quantity || 1;
          const isUpg = item.jobKind === 'upgrade';
          const label = isUpg
            ? ('⬆️ ' + (item.troopName || item.troopDefId) + ' Lv ' + (item.fromLevel || 1) + '→' + (item.toLevel || 2))
            : ('🛡️ ' + (item.troopName || item.troopDefId) + ' Lv ' + (item.level || 1));
          if (item.status === 'training' || item.status === 'upgrading') {
            const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
            const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
            const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
            const accent = isUpg ? '#c084fc' : '#f87171';
            troopItems.push(`
              <div class="p-2 rounded bg-[#080b11] border ${isUpg ? 'border-[#c084fc]/50' : 'border-[#f87171]/50'} space-y-1">
                <div class="flex justify-between items-center text-[11px] font-mono">
                  <span style="color:${accent}" class="font-bold">${label} (${done}/${total})</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#34d399]">${formatSimDuration(rem)}</span>
                    <button data-action="cancel-troop-training" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelTroopTraining('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] ml-1 cursor-pointer">✕</button>
                  </div>
                </div>
                <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden">
                  <div class="h-full" style="width:${pct}%;background:${accent}"></div>
                </div>
              </div>
            `);
          } else {
            troopItems.push(`
              <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex justify-between items-center text-[11px] font-mono">
                <span class="text-[#8b949e]">⏳ ${label} ×${total}</span>
                <button data-action="cancel-troop-training" data-queue-item-id="${item.queueItemId}" onclick="window.WargameApp.handleCancelTroopTraining('${item.queueItemId}')" class="text-[#f87171] hover:underline text-[10px] cursor-pointer">Cancel</button>
              </div>
            `);
          }
        }
        sectionsHtml.push(`
          <div class="space-y-1">
            <div class="text-[10px] font-mono uppercase text-[#f87171] font-bold">⚔️ Barracks Queue (${tq.length}/${city.maxTroopQueueSlots || 3})</div>
            ${troopItems.join('')}
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
              <button data-action="open-hero-sheet" data-hero-id="${h.id}" onclick="window.WargameApp.handleOpenHeroSheet('${h.id}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/30 text-[10px] font-mono font-bold cursor-pointer" title="View Hero">View</button>
              <button data-action="select-party" data-hero-id="${h.id}" onclick="window.WargameApp.handleSelectPartyByHero('${h.id}')" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#60a5fa] text-[10px] font-mono font-bold cursor-pointer">Select</button>
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

  // Discovered Military Targets Inspector Bar (Task 05B-2)
  const mtBarEl = document.getElementById('wgMilitaryTargetsBar');
  if (mtBarEl) {
    const discoveredTargets = (ow.militaryTargets || []).filter(function(t) {
      return t && (t.discovered || (ow.explored[t.y] && ow.explored[t.y][t.x]));
    });
    if (discoveredTargets.length === 0) {
      mtBarEl.classList.add('hidden');
    } else {
      mtBarEl.classList.remove('hidden');
      const mtCardsHtml = discoveredTargets.map(function(t) {
        const isCleared = t.status === MILITARY_TARGET_STATUS.CLEARED;
        const isSelT = state._selectedMilitaryTargetId === t.id;
        const blocksLbl = (t.blocksAccess || []).map(function(b) { return b.label || b.targetRef; }).join(', ');
        return `
          <div class="flex items-center justify-between gap-2 px-2 py-1.5 rounded ${isSelT ? 'bg-[#1a2232] border border-[#fbbf24]' : 'bg-[#111722] border border-[#283347]'} text-[11px] font-mono">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="${isCleared ? 'text-[#34d399]' : 'text-[#ef4444]'} font-bold">${isCleared ? '✓' : '⚔️'}</span>
                <span class="text-[#e6edf3] font-semibold truncate">${t.name}</span>
                <span class="text-[10px] ${isCleared ? 'text-[#34d399]' : 'text-[#f87171]'}">${isCleared ? 'Cleared' : ('Pwr ' + t.enemyPower)}</span>
              </div>
              ${blocksLbl ? `<div class="text-[10px] text-[#8b949e] truncate">${isCleared ? 'Unlocked:' : 'Blocks:'} ${blocksLbl}</div>` : ''}
            </div>
            <button data-action="inspect-military-target" data-target-id="${t.id}" onclick="window.WargameApp.handleInspectMilitaryTarget('${t.id}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 font-bold text-[10px] uppercase cursor-pointer">Inspect</button>
          </div>
        `;
      }).join('');
      setHtmlIfChanged(mtBarEl, `
        <div class="text-[10px] font-mono uppercase text-[#f87171] font-bold">⚔️ Discovered Military Threats (${discoveredTargets.length})</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${mtCardsHtml}</div>
      `);
    }
  }

  // Generalized Discoveries Panel (PF-03 — Threats, Dungeons, Resources/POIs, Locations + Locate)
  const dngBarEl = document.getElementById('wgDiscoveredDungeonsBar');
  if (dngBarEl) {
    const disc = collectOverworldDiscoveries(state.world);
    if (disc.all.length === 0) {
      dngBarEl.classList.add('hidden');
    } else {
      dngBarEl.classList.remove('hidden');
      const activeCat = state._discoveryFilter || 'all';
      const canMarchHero = Boolean(selUnit && selUnit.alive && selUnit.canEnterDungeon && selUnit.status !== 'in_dungeon');
      const items = activeCat === 'threats'
        ? disc.threats
        : (activeCat === 'dungeons'
          ? disc.dungeons
          : (activeCat === 'resources'
            ? disc.resources
            : (activeCat === 'locations' ? disc.locations : disc.all)));

      const tabs = [
        { id: 'all', label: 'All (' + disc.all.length + ')' },
        { id: 'threats', label: 'Threats (' + disc.threats.length + ')' },
        { id: 'dungeons', label: 'Dungeons (' + disc.dungeons.length + ')' },
        { id: 'resources', label: 'Resources (' + disc.resources.length + ')' },
        { id: 'locations', label: 'Locations (' + disc.locations.length + ')' }
      ];
      const tabsHtml = tabs.map(function(tb) {
        const isOn = activeCat === tb.id;
        return `<button onclick="window.WargameApp.handleSetDiscoveryFilter('${tb.id}')" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${isOn ? 'bg-[#38bdf8] text-[#080b11]' : 'bg-[#111722] text-[#94a3b8] border border-[#283347] hover:text-[#e6edf3]'}">${tb.label}</button>`;
      }).join('');

      const cardsHtml = items.length === 0
        ? '<div class="text-[10px] font-mono text-[#64748b] italic">No discoveries in this category yet.</div>'
        : items.map(function(item) {
            const dist = selUnit ? getHexDistance(selUnit.x, selUnit.y, item.x, item.y) : null;
            let actionHtml = `<button onclick="window.WargameApp.handleLocateOverworldHex(${item.x}, ${item.y})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#cbd5e1] border border-[#283347] font-bold text-[10px] cursor-pointer" title="Center map on (${item.x},${item.y})">◎</button>`;
            if (item.kind === 'military_target') {
              actionHtml += `<button data-action="inspect-military-target" data-target-id="${item.id}" onclick="window.WargameApp.handleLocateOverworldHex(${item.x}, ${item.y}, '${item.id}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 font-bold text-[10px] uppercase cursor-pointer">Inspect</button>`;
            } else if (item.kind === 'dungeon_entrance') {
              const atGate = Boolean(canMarchHero && selUnit.status === 'idle' && selUnit.x === item.x && selUnit.y === item.y);
              if (item.blockedBy) {
                actionHtml += `<span class="text-[10px] text-[#f87171] font-bold truncate" title="Clear ${item.blockedBy.name} with a Field Army first">🔒 ${item.blockedBy.name}</span>`;
              } else if (atGate) {
                actionHtml += `<button data-action="enter-dungeon" data-poi-id="${item.id}" onclick="window.WargameApp.handleEnterDungeon('${item.id}')" class="px-2 py-0.5 rounded bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-bold text-[10px] uppercase cursor-pointer">Enter</button>`;
              } else if (canMarchHero) {
                actionHtml += `<button data-action="march-to-dungeon" data-poi-id="${item.id}" onclick="window.WargameApp.handleMarchToDungeon('${item.id}')" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-[10px] uppercase cursor-pointer">March</button>`;
              } else {
                actionHtml += `<span class="text-[10px] text-[#64748b]">Hero Only</span>`;
              }
            } else if (item.kind === 'adventure_hostile') {
              actionHtml += `<span class="text-[10px] text-[#fb923c]">Hero Threat</span>`;
            } else if (item.category === 'resources') {
              actionHtml += `<span class="text-[10px] ${item.depleted ? 'text-[#64748b]' : 'text-[#34d399]'}">${item.depleted ? 'Depleted' : 'Resource'}</span>`;
            } else if (item.kind === 'city') {
              actionHtml += `<span class="text-[10px] text-[#fbbf24]">Bastion</span>`;
            }

            return `
              <div class="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-[#111722] border ${item.blockedBy ? 'border-[#ef4444]/50' : 'border-[#283347]'} text-[11px] font-mono">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span style="color:${item.accentColor || '#fbbf24'}" class="font-bold">${item.icon}</span>
                  <span class="text-[#e6edf3] font-semibold truncate">${item.name}</span>
                  <span class="text-[10px] text-[#8b949e]">(${item.x},${item.y})${dist !== null ? (' • ' + dist + 't') : ''}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">${actionHtml}</div>
              </div>
            `;
          }).join('');

      setHtmlIfChanged(dngBarEl, `
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="text-[10px] font-mono uppercase text-[#38bdf8] font-bold">🧭 Discoveries (${disc.all.length})</div>
          <div class="flex flex-wrap gap-1">${tabsHtml}</div>
        </div>
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
    } else if (bId === 'meeting_hall') {
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

  // Toggle 2:1 Isometric City Canvas (ADR-0014 default) vs. Flat Grid fallback
  const isFlatMode = simHost.state._cityViewMode === 'flat';
  const isoContainer = document.getElementById('wgCityIsoContainer');
  const flatContainer = document.getElementById('wgCityFlatContainer');
  const projBtn = document.getElementById('wgBtnCityProjectionToggle');
  if (isoContainer) isoContainer.classList.toggle('hidden', isFlatMode);
  if (flatContainer) flatContainer.classList.toggle('hidden', !isFlatMode);
  if (projBtn) projBtn.textContent = isFlatMode ? '⊞ Flat Grid' : '◇ Isometric View';
  if (!isFlatMode) {
    renderCityIsoCanvas(simHost);
  }

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
      1
    );
    const blockedByMeetingHall = (curBId !== 'meeting_hall' && nextLevel > meetingHallLevel);

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
          <button data-action="enter-facility" onclick="window.WargameApp.handleOpenFacilityModal('${curBId}', ${selPlot.plotIndex})" class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080b11] cursor-pointer">
            🚪 Enter ${curBDef.name}
          </button>
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
            ${(curBId !== 'meeting_hall') ? `
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
        if (k === 'meeting_hall') return false;
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

  // Never arbitrarily default to Adventurers Guild when no valid facility is open!
  const requestedId = state._openFacilityId || null;
  if (!requestedId || !CITY_BUILDINGS_CATALOG[requestedId]) {
    state.activeView = WARGAME_VIEWS.CITY;
    state._openFacilityId = null;
    state._openFacilityPlotIndex = null;
    return;
  }
  const unifiedHtml = buildUnifiedBuildingStageHtml(simHost, requestedId, city);
  if (unifiedHtml) {
    setHtmlIfChanged(gridEl, unifiedHtml);
  }
}

export function renderRightTasksAndStreamSidebar(simHost) {
  const state = simHost.state;

  // 1. Reactive Guided Tasks DAG List (Show ONLY currently available/active milestones; hide claimed & locked!)
  const tasksEl = document.getElementById('wgGuidedTasksList');
  if (tasksEl) {
    const tasks = getFormattedTasksList(state).filter(function(t) {
      return t.status !== 'claimed' && t.status !== 'locked';
    });
    const newTasksHtml = tasks.length > 0 ? tasks.map(function(t) {
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
    }).join('') : `<div class="text-xs text-[#34d399] italic py-2 text-center">All available milestones completed!</div>`;

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
  if (ev.topic === STREAM_TOPICS.TROOP_TRAINING_STARTED) {
    return '— Queued ' + (p.quantity || 1) + '× ' + (p.troopName || p.troopDefId) + ' Lv ' + (p.level || 1) + ' at Barracks';
  }
  if (ev.topic === STREAM_TOPICS.TROOP_TRAINING_CANCELLED) {
    return '— Cancelled ' + (p.cancelledCount || 0) + '× ' + (p.troopName || p.troopDefId) + ' recruitment';
  }
  if (ev.topic === STREAM_TOPICS.TROOP_TRAINED) {
    return '— Trained ' + (p.troopName || p.troopDefId) + ' Lv ' + (p.level || 1) + ' (' + (p.completedCount || 1) + '/' + (p.quantity || 1) + ') -> Barracks ×' + (p.groupCount || 1);
  }
  if (ev.topic === STREAM_TOPICS.TROOP_UPGRADE_STARTED) {
    return '— Queued upgrade: ' + (p.quantity || 1) + '× ' + (p.troopName || p.troopDefId) + ' Lv ' + (p.fromLevel || 1) + '→' + (p.toLevel || 2);
  }
  if (ev.topic === STREAM_TOPICS.TROOP_UPGRADE_CANCELLED) {
    return '— Cancelled upgrade of ' + (p.cancelledCount || 0) + '× ' + (p.troopName || p.troopDefId) + ' (returned to Lv ' + (p.fromLevel || 1) + ')';
  }
  if (ev.topic === STREAM_TOPICS.TROOP_UPGRADE_COMPLETED) {
    return '— Upgraded ' + (p.troopName || p.troopDefId) + ' Lv ' + (p.fromLevel || 1) + '→' + (p.toLevel || 2) + ' (' + (p.completedCount || 1) + '/' + (p.quantity || 1) + ')';
  }
  if (ev.topic === STREAM_TOPICS.TROOPS_DISBANDED) {
    return '— Disbanded ' + (p.disbandedCount || 1) + '× ' + (p.troopDefId || 'troops') + (p.level ? (' Lv ' + p.level) : '') + ' from Barracks';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_DEPLOYED) {
    return '— Deployed ' + p.armyName + ' (' + p.totalTroops + ' troops) from ' + p.homeCityName + ' -> (' + p.targetX + ',' + p.targetY + ')';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_REDIRECTED) {
    return '— Redirected ' + p.armyName + ' -> (' + p.targetX + ',' + p.targetY + ')';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_OBJECTIVE_STARTED) {
    return '— ' + p.armyName + ' began ' + p.objectiveType + ' at (' + p.x + ',' + p.y + ')';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_OBJECTIVE_COMPLETED) {
    return '— ' + p.armyName + ' completed ' + p.objectiveType + ' at (' + p.x + ',' + p.y + ')';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_OBJECTIVE_FAILED) {
    return '— ' + p.armyName + ' objective failed: ' + (p.reason || 'interrupted');
  }
  if (ev.topic === STREAM_TOPICS.ARMY_RETURNING) {
    return '— ' + p.armyName + ' returning to ' + p.homeCityName + ' (' + p.stepsCount + ' hexes)';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_REINTEGRATED) {
    return '— ' + p.armyName + ' returned ' + p.troopsReturned + ' troops to ' + p.homeCityName + ' Barracks';
  }
  if (ev.topic === STREAM_TOPICS.MILITARY_TARGET_DISCOVERED) {
    return '— Discovered Military Threat: ' + p.targetName + ' (Power ' + p.enemyPower + ') at (' + p.x + ',' + p.y + ')!';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_COMBAT_STARTED) {
    return '— ' + p.armyName + ' engaged ' + p.targetName + ' (' + (p.plannedRounds || 1) + ' rounds) at (' + p.x + ',' + p.y + ')!';
  }
  if (ev.topic === STREAM_TOPICS.ARMY_COMBAT_ROUND_RESOLVED) {
    const fl = p.friendlyLosses > 0 ? ('-' + p.friendlyLosses + ' troops') : '0 troop losses';
    const el = p.enemyPowerLost > 0 ? ('-' + p.enemyPowerLost + ' enemy threat') : '0 enemy losses';
    return '— Round ' + p.round + '/' + (p.plannedRounds || p.round) + ' (' + p.targetName + '): ' + fl + ', ' + el;
  }
  if (ev.topic === STREAM_TOPICS.ARMY_COMBAT_RESOLVED) {
    return '— ' + (p.victory ? 'VICTORY: ' : 'DEFEAT: ') + p.armyName + ' vs ' + p.targetName + ' (' + p.armyPower + ' vs ' + p.enemyPower + ', lost ' + p.totalLosses + ', ' + p.survivingTroops + ' survived)';
  }
  if (ev.topic === STREAM_TOPICS.MILITARY_TARGET_CLEARED) {
    const unl = (p.unlockedLabels && p.unlockedLabels.length > 0) ? (' — Unlocked: ' + p.unlockedLabels.join(', ')) : '';
    return '— Cleared ' + p.targetName + unl + '!';
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
  if (ev.topic === STREAM_TOPICS.MARKET_TRADE) {
    if (p.side === 'liquidate') return '— Liquidated ' + p.itemName + ' at Market (+' + p.goldDelta + 'g)';
    return '— Market ' + p.side + ' ' + p.qty + ' ' + p.resourceId + ' (' + (p.goldDelta >= 0 ? ('+' + p.goldDelta) : p.goldDelta) + 'g)';
  }
  if (ev.topic === STREAM_TOPICS.ACADEMY_STUDY) {
    return '— Arcane Academy Study Session granted +' + p.rpAwarded + ' General RP!';
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

export function renderDeployArmyModal(simHost) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('wgDeployArmyModal');
  const body = document.getElementById('wgDeployArmyBody');
  if (!modal || !body) return;

  const state = simHost && simHost.state;
  const isOpen = Boolean(state && state._deployArmyModalOpen && state.world);
  modal.classList.toggle('hidden', !isOpen);
  if (!isOpen) return;

  const world = state.world;
  const city = getPrimaryCity(state);
  if (!city) {
    modal.classList.add('hidden');
    return;
  }

  const ow = world.overworld;
  const draft = state._deployArmyDraft || {};
  const militaryTarget = draft.targetId ? getMilitaryTargetById(ow, draft.targetId) : null;
  // PF-05: Explicit formation type ('army' | 'hero_party'), NEVER defaulting blindly to Hero Team
  const formationType = militaryTarget ? 'army' : (draft.formationType === 'hero_party' ? 'hero_party' : 'army');
  const heroParties = (ow.units || []).filter(function(u) { return u && u.alive && u.unitType === 'hero_party' && u.status !== 'in_dungeon'; });
  const selectedHeroPartyId = draft.heroPartyId || (heroParties[0] ? heroParties[0].id : null);
  const targetX = militaryTarget ? militaryTarget.x : (typeof draft.targetX === 'number' ? draft.targetX : Math.min((ow.width || 56) - 1, city.x + 1));
  const targetY = militaryTarget ? militaryTarget.y : (typeof draft.targetY === 'number' ? draft.targetY : city.y);
  const stayDeployed = Boolean(draft.stayDeployed);
  const qtyByKey = draft.qtyByKey || {};

  const inv = getCityTroopInventorySummary(world, city);
  const availableRows = inv.byTypeAndLevel.filter(function(r) { return r.trained > 0; });

  let totalSelected = 0;
  const selectedEntries = [];
  const rowsHtml = availableRows.length === 0
    ? '<div class="text-xs text-[#8b949e] italic py-2">No trained troops available in ' + city.name + ' Barracks.</div>'
    : availableRows.map(function(row) {
        const key = row.troopDefId + ':' + row.level;
        const curQty = Math.max(0, Math.min(row.trained, Math.floor(Number(qtyByKey[key] || 0))));
        totalSelected += curQty;
        if (curQty > 0) {
          selectedEntries.push({ troopDefId: row.troopDefId, level: row.level, quantity: curQty });
        }
        return `
          <div class="p-2 rounded bg-[#111722] border border-[#283347] space-y-1 text-xs font-mono">
            <div class="flex items-center justify-between">
              <span class="text-[#e6edf3] font-bold">${row.icon} ${row.name} <span class="text-[#fbbf24]">Lv ${row.level}</span></span>
              <span class="text-[#34d399]">Available: ${row.trained}</span>
            </div>
            <div class="flex items-center gap-2">
              <input type="range" min="0" max="${row.trained}" value="${curQty}" oninput="window.WargameApp.handleSetDeployTroopQty('${row.troopDefId}', ${row.level}, this.value)" class="flex-1 accent-[#f87171] cursor-pointer" />
              <input type="number" min="0" max="${row.trained}" value="${curQty}" oninput="window.WargameApp.handleSetDeployTroopQty('${row.troopDefId}', ${row.level}, this.value)" class="w-14 px-1.5 py-0.5 rounded bg-[#080b11] border border-[#283347] text-[#e6edf3] text-center" />
            </div>
          </div>
        `;
      }).join('');

  const selectedPower = computeTroopListCombatPower(selectedEntries);
  const blocksSummary = militaryTarget && Array.isArray(militaryTarget.blocksAccess)
    ? militaryTarget.blocksAccess.map(function(b) { return b.label || b.targetRef; }).join(', ')
    : '';
  const formationTypeSwitcherHtml = !militaryTarget ? `
      <div class="p-2 rounded bg-[#080b11] border border-[#283347] space-y-1.5 text-xs font-mono">
        <div class="text-[10px] uppercase text-[#94a3b8] font-bold">Formation Type</div>
        <div class="grid grid-cols-2 gap-1.5">
          <button data-formation-type="army" onclick="window.WargameApp.handleSetDeployFormationType('army')" class="py-1.5 px-2 rounded font-bold text-[11px] cursor-pointer ${formationType === 'army' ? 'bg-[#f87171] text-[#080b11]' : 'bg-[#111722] text-[#cbd5e1] border border-[#283347] hover:bg-[#1a2232]'}">🛡️ Field Army (Barracks)</button>
          <button data-formation-type="hero_party" onclick="window.WargameApp.handleSetDeployFormationType('hero_party')" ${heroParties.length === 0 ? 'disabled' : ''} class="py-1.5 px-2 rounded font-bold text-[11px] ${formationType === 'hero_party' ? 'bg-[#60a5fa] text-[#080b11] cursor-pointer' : (heroParties.length > 0 ? 'bg-[#111722] text-[#cbd5e1] border border-[#283347] hover:bg-[#1a2232] cursor-pointer' : 'bg-[#111722] text-[#475569] border border-[#1e293b] cursor-not-allowed')}">⚔️ Hero Team (${heroParties.length})</button>
        </div>
      </div>
  ` : '';

  const targetHeaderHtml = militaryTarget ? `
      <div class="p-2.5 rounded bg-[#450a0a]/40 border border-[#ef4444]/60 space-y-1 text-xs font-mono">
        <div class="flex items-center justify-between">
          <span class="text-[#fecaca] font-bold">⚔️ Target: ${militaryTarget.name} (${militaryTarget.x}, ${militaryTarget.y})</span>
          <span class="text-[#f87171] font-bold">Threat Power: ${militaryTarget.enemyPower}</span>
        </div>
        ${blocksSummary ? `<div class="text-[11px] text-[#fbbf24]">Clearing Unlocks: <strong>${blocksSummary}</strong></div>` : ''}
        <div class="text-[11px] ${selectedPower >= militaryTarget.enemyPower ? 'text-[#34d399]' : 'text-[#fbbf24]'}">
          Army Power: <strong>${selectedPower}</strong> vs <strong>${militaryTarget.enemyPower}</strong>
          (${totalSelected === 0 ? 'Select troops' : (selectedPower >= militaryTarget.enemyPower ? 'Favored — Victory Expected' : 'Understrength — Defeat Expected')})
        </div>
      </div>
  ` : `
      <div class="p-2.5 rounded bg-[#080b11] border border-[#283347] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span class="text-[#cbd5e1] font-bold">Destination Hex:</span>
        <div class="flex items-center gap-2">
          <label class="text-[#8b949e]">X <input type="number" min="0" max="${(ow.width || 56) - 1}" value="${targetX}" oninput="window.WargameApp.handleSetDeployTargetCoord('x', this.value)" class="w-14 px-1.5 py-0.5 rounded bg-[#111722] border border-[#283347] text-[#e6edf3] text-center" /></label>
          <label class="text-[#8b949e]">Y <input type="number" min="0" max="${(ow.height || 40) - 1}" value="${targetY}" oninput="window.WargameApp.handleSetDeployTargetCoord('y', this.value)" class="w-14 px-1.5 py-0.5 rounded bg-[#111722] border border-[#283347] text-[#e6edf3] text-center" /></label>
          <button data-action="pick-deploy-hex" onclick="window.WargameApp.handleStartPickDeployHex()" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] border border-[#38bdf8]/50 text-[10px] font-bold cursor-pointer">📍 Pick Tile</button>
        </div>
      </div>
  `;

  const heroTeamBodyHtml = `
      <div class="space-y-1.5">
        ${heroParties.length === 0
          ? '<div class="text-xs text-[#8b949e] italic py-2">No active Hero Party available on the Overworld.</div>'
          : heroParties.map(function(hp) {
              const isSel = hp.id === selectedHeroPartyId;
              return `
                <button onclick="window.WargameApp.handleSelectDeployHeroParty('${hp.id}')" class="w-full p-2 rounded text-left text-xs font-mono flex items-center justify-between cursor-pointer ${isSel ? 'bg-[#1e3a8a]/50 border border-[#60a5fa] text-[#e6edf3]' : 'bg-[#111722] border border-[#283347] text-[#94a3b8]'}">
                  <span class="font-bold">⚔️ ${hp.name}</span>
                  <span>(${hp.x},${hp.y}) • HP ${hp.hp}/${hp.maxHp}</span>
                </button>
              `;
            }).join('')}
      </div>
  `;

  const canConfirm = formationType === 'hero_party' ? Boolean(selectedHeroPartyId) : (totalSelected > 0);

  const html = `
    <div class="flex items-center justify-between px-4 py-3 bg-[#080b11] border-b border-[#283347]">
      <div>
        <h2 class="text-sm font-bold ${formationType === 'hero_party' ? 'text-[#60a5fa]' : 'text-[#f87171]'}">${formationType === 'hero_party' ? '⚔️ Dispatch Hero Team' : ('🛡️ Deploy Field Army from ' + city.name)}</h2>
        <div class="text-[11px] font-mono text-[#94a3b8]">${militaryTarget ? ('Assign Barracks troops to engage ' + militaryTarget.name) : 'Choose formation type, destination hex, and units'}</div>
      </div>
      <button onclick="window.WargameApp.handleCloseDeployArmyModal()" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-xs font-mono font-bold text-[#e6edf3] cursor-pointer">✕ Close</button>
    </div>
    <div class="p-4 space-y-3 overflow-y-auto">
      ${formationTypeSwitcherHtml}
      ${targetHeaderHtml}
      ${formationType === 'hero_party' ? heroTeamBodyHtml : `<div class="space-y-1.5">${rowsHtml}</div>`}
      ${formationType === 'army' ? `
        <label class="flex items-center gap-2 p-2.5 rounded bg-[#080b11] border border-[#283347] text-xs font-mono text-[#e6edf3] cursor-pointer">
          <input type="checkbox" ${stayDeployed ? 'checked' : ''} onchange="window.WargameApp.handleToggleDeployStayDeployed(this.checked)" class="accent-[#f87171]" />
          <span>Stay deployed after completing objective (victory/patrol; unchecked = auto-return to ${city.name} Barracks)</span>
        </label>
      ` : ''}
      <div class="flex items-center justify-between pt-1">
        <span class="text-xs font-mono text-[#fbbf24]">${formationType === 'hero_party' ? ('Selected Team: <strong>' + (selectedHeroPartyId ? 'Hero Party' : 'None') + '</strong>') : ('Selected Force: <strong>' + totalSelected + ' Troops</strong> (Power ' + selectedPower + ')')}</span>
        <button data-action="confirm-deploy-army" onclick="window.WargameApp.handleConfirmDeployArmy()" ${!canConfirm ? 'disabled' : ''} class="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase ${canConfirm ? (formationType === 'hero_party' ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080b11] cursor-pointer' : 'bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] cursor-pointer') : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">${militaryTarget ? '⚔️ Deploy & Engage' : (formationType === 'hero_party' ? '⚔️ March Hero Team' : '🛡️ Deploy Army')}</button>
      </div>
    </div>
  `;
  setHtmlIfChanged(body, html);
}

// =============================================================================
// PF-04: Visibility-Respecting Overworld Map Hover Tooltips
// =============================================================================
export function buildOverworldTileTooltipData(state, x, y) {
  if (!state || !state.world || !state.world.overworld) return null;
  const world = state.world;
  const ow = world.overworld;
  if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || y < 0 || x >= ow.width || y >= ow.height) {
    return null;
  }

  const isExplored = Boolean(ow.explored && ow.explored[y] && ow.explored[y][x]);
  if (!isExplored) {
    return {
      explored: false,
      x: x,
      y: y,
      title: 'Unexplored Frontier (' + x + ', ' + y + ')',
      badge: 'Fog of War',
      lines: ['Scout this area to reveal terrain, resources, and threats.']
    };
  }

  const tId = ow.tiles[y][x];
  const tDef = OVERWORLD_TERRAIN_DEFS[tId] || null;
  const lines = [];
  if (tDef) {
    const marchSec = (typeof tDef.marchTimeMs === 'number' && isFinite(tDef.marchTimeMs))
      ? ((tDef.marchTimeMs / 1000).toFixed(1) + 's/hex')
      : 'Impassable';
    lines.push('Terrain: ' + tDef.name + ' (' + marchSec + (tDef.buildable ? ', Buildable' : '') + ')');
  }

  // City at hex
  const cities = Object.values(world.cities || {});
  const cityHere = cities.find(function(c) { return c && c.x === x && c.y === y; });
  if (cityHere) {
    lines.push('City: 🏰 ' + cityHere.name + ' (Lv ' + (cityHere.level || 1) + ', ' + (cityHere.ownerPlayerId || 'player_1') + ')');
  }

  // Alive player unit/army at hex
  const unitHere = (ow.units || []).find(function(u) { return u && u.alive && u.x === x && u.y === y; });
  if (unitHere) {
    if (unitHere.unitType === 'army') {
      const cnt = getArmyTotalTroopCount(world, unitHere.id);
      const pwr = computeArmyCombatPower(world, unitHere.id);
      lines.push('Army: 🛡️ ' + unitHere.name + ' (' + cnt + ' troops, Pwr ' + pwr + ', ' + unitHere.status + ')');
    } else {
      lines.push('Unit: ' + (unitHere.unitType === 'hero_party' ? '⚔️ ' : '🚩 ') + unitHere.name + ' (HP ' + unitHere.hp + '/' + unitHere.maxHp + ', ' + unitHere.status + ')');
    }
  }

  // Discovered military target at hex
  const mtHere = getMilitaryTargetAtHex(ow, x, y);
  if (mtHere && (mtHere.discovered || isExplored)) {
    const isCleared = mtHere.status === MILITARY_TARGET_STATUS.CLEARED;
    lines.push('Military Target: ' + (isCleared ? '✓ ' : '⚔️ ') + mtHere.name + (isCleared ? ' (Cleared)' : (' (Threat Power ' + mtHere.enemyPower + ')')));
    if (!isCleared && Array.isArray(mtHere.blocksAccess) && mtHere.blocksAccess.length > 0) {
      lines.push('Blocks: ' + mtHere.blocksAccess.map(function(b) { return b.label || b.targetRef; }).join(', '));
    }
  }

  // Discovered POI at hex
  const poiHere = (ow.pois || []).find(function(p) { return p && p.x === x && p.y === y; });
  if (poiHere && (poiHere.discovered || isExplored)) {
    if (poiHere.type === 'dungeon_entrance') {
      const blk = getBlockingMilitaryTargetForAccess(ow, 'overworld_poi', poiHere.id);
      lines.push('Dungeon: Ω ' + poiHere.name + ' (Lv ' + (poiHere.recommendedLevel || 1) + (blk ? (', 🔒 Blocked by ' + blk.name) : ', Accessible') + ')');
    } else {
      lines.push('Resource POI: ' + poiHere.name + (poiHere.depleted ? ' (Depleted)' : ' (Available)'));
    }
  }

  // Wandering Hostile at hex (ONLY if alive AND within active vision of a friendly unit or city)
  const hostileHere = (ow.hostiles || []).find(function(h) { return h && h.alive && h.x === x && h.y === y; });
  if (hostileHere) {
    let inActiveSight = false;
    const units = ow.units || [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u && u.alive && getHexDistance(x, y, u.x, u.y) <= (u.visionRadius || 4) + 1) {
        inActiveSight = true;
        break;
      }
    }
    if (!inActiveSight) {
      for (let i = 0; i < cities.length; i++) {
        const c = cities[i];
        if (c && getHexDistance(x, y, c.x, c.y) <= 5) {
          inActiveSight = true;
          break;
        }
      }
    }
    if (inActiveSight) {
      lines.push('Adventure Hostile: ' + (hostileHere.icon || '☠') + ' ' + hostileHere.name + ' (Lv ' + (hostileHere.level || 1) + ', Power ' + (hostileHere.power || 18) + ')');
    }
  }

  const title = cityHere
    ? ('🏰 ' + cityHere.name)
    : (mtHere
      ? ((mtHere.status === MILITARY_TARGET_STATUS.CLEARED ? '✓ ' : '⚔️ ') + mtHere.name)
      : (poiHere ? poiHere.name : (tDef ? tDef.name : 'Overworld Hex')));

  return {
    explored: true,
    x: x,
    y: y,
    title: title + ' (' + x + ', ' + y + ')',
    badge: mtHere ? (mtHere.status === MILITARY_TARGET_STATUS.CLEARED ? 'Cleared' : 'Military Threat') : (cityHere ? 'City' : (tDef ? tDef.name : '')),
    lines: lines
  };
}

export function renderOverworldHoverTooltip(state, tile, screenPos) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('wgOverworldTooltip');
  if (!el) return;
  if (!tile || !state || !state.world || state.activeView !== WARGAME_VIEWS.OVERWORLD) {
    el.classList.add('hidden');
    return;
  }
  const data = buildOverworldTileTooltipData(state, tile.x, tile.y);
  if (!data) {
    el.classList.add('hidden');
    return;
  }
  const linesHtml = data.lines.map(function(ln) {
    return '<div class="text-[10px] text-[#cbd5e1] leading-snug">' + ln + '</div>';
  }).join('');
  setHtmlIfChanged(el, `
    <div class="font-bold text-[#fbbf24] text-[11px] mb-0.5">${data.title}</div>
    ${linesHtml}
  `);
  if (screenPos && typeof screenPos.sx === 'number' && typeof screenPos.sy === 'number') {
    const leftPx = Math.min(430, Math.max(8, Math.round(screenPos.sx + 14)));
    const topPx = Math.min(370, Math.max(8, Math.round(screenPos.sy + 14)));
    el.style.left = leftPx + 'px';
    el.style.top = topPx + 'px';
  }
  el.classList.remove('hidden');
}

// =============================================================================
// CB-03 & CB-04: Victory/Defeat Outcome Banner (~2s) & Battle Results Popup
// =============================================================================
export function renderBattleFeedbackOverlays(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state) return;
  const state = simHost.state;

  // 1. CB-03: Prominent Victory / Defeat Outcome Banner
  const bannerEl = document.getElementById('wgBattleOutcomeBanner');
  if (bannerEl) {
    const banner = state._battleOutcomeBanner || null;
    if (!banner) {
      bannerEl.classList.add('hidden');
    } else {
      const isWin = Boolean(banner.victory);
      const bannerHtml = `
        <div class="px-6 py-3 rounded-xl border-2 shadow-2xl text-center backdrop-blur-md ${isWin ? 'bg-[#064e3b]/95 border-[#34d399] text-[#ecfdf5]' : 'bg-[#450a0a]/95 border-[#ef4444] text-[#fef2f2]'}">
          <div class="text-lg md:text-xl font-display font-extrabold tracking-widest uppercase ${isWin ? 'text-[#fbbf24]' : 'text-[#fca5a5]'}">${isWin ? '⚔️ VICTORY ⚔️' : '💀 DEFEAT 💀'}</div>
          <div class="text-xs font-mono mt-0.5">${banner.armyName || 'Field Army'} vs ${banner.targetName || 'Hostile Force'}</div>
        </div>
      `;
      setHtmlIfChanged(bannerEl, bannerHtml);
      bannerEl.classList.remove('hidden');
    }
  }

  // 2. CB-04: Compact Battle Results Summary Popup
  const modal = document.getElementById('wgBattleResultsModal');
  const body = document.getElementById('wgBattleResultsBody');
  if (!modal || !body) return;
  const rpt = state._battleResultsPopup || null;
  if (!rpt) {
    modal.classList.add('hidden');
    return;
  }

  const isWin = Boolean(rpt.victory);
  const rewardsHtml = (isWin && Array.isArray(rpt.unlockedLabels) && rpt.unlockedLabels.length > 0)
    ? `
      <div class="p-2.5 rounded bg-[#064e3b]/35 border border-[#34d399]/50 text-xs font-mono text-[#6ee7b7]">
        <div class="text-[10px] uppercase text-[#fbbf24] font-bold mb-0.5">Access Unlocked / Rewards</div>
        <div>✓ ${rpt.unlockedLabels.join(', ')} — Now open for Hero Parties</div>
      </div>
    `
    : (isWin
      ? '<div class="p-2 rounded bg-[#111722] border border-[#283347] text-[11px] font-mono text-[#94a3b8]">Target permanently cleared.</div>'
      : '<div class="p-2 rounded bg-[#450a0a]/30 border border-[#f87171]/40 text-[11px] font-mono text-[#fecaca]">Target remains active. Surviving troops are retreating to Barracks to regroup.</div>');

  const html = `
    <div class="px-4 py-3 border-b border-[#283347] flex items-center justify-between ${isWin ? 'bg-[#064e3b]/50' : 'bg-[#450a0a]/50'}">
      <div>
        <div class="text-base font-display font-bold uppercase tracking-wider ${isWin ? 'text-[#34d399]' : 'text-[#f87171]'}">${isWin ? '⚔️ Battle Victory' : '💀 Battle Defeat'}</div>
        <div class="text-[11px] font-mono text-[#cbd5e1]">${rpt.targetName || 'Military Target'} (${rpt.x !== undefined ? rpt.x : '?'}, ${rpt.y !== undefined ? rpt.y : '?'}) • ${rpt.roundCount || 1} Round${(rpt.roundCount || 1) === 1 ? '' : 's'}</div>
      </div>
      <button data-action="dismiss-battle-results" onclick="window.WargameApp.handleDismissBattleResultsPopup()" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-xs font-mono text-[#e6edf3] cursor-pointer">✕</button>
    </div>
    <div class="p-4 space-y-3 text-xs font-mono">
      <div class="grid grid-cols-2 gap-2.5">
        <div class="p-2.5 rounded bg-[#080b11] border border-[#38bdf8]/40 space-y-1">
          <div class="text-[10px] uppercase text-[#38bdf8] font-bold">🛡️ ${rpt.armyName || 'Friendly Army'}</div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Starting:</span><span class="text-[#e6edf3]">${rpt.initialTroops || 0} (Pwr ${rpt.armyPower || 0})</span></div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Surviving:</span><span class="text-[#34d399] font-bold">${rpt.survivingTroops || 0}</span></div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Casualties:</span><span class="${(rpt.totalLosses || 0) > 0 ? 'text-[#f87171]' : 'text-[#94a3b8]'} font-bold">${rpt.totalLosses || 0}</span></div>
        </div>
        <div class="p-2.5 rounded bg-[#080b11] border border-[#ef4444]/40 space-y-1">
          <div class="text-[10px] uppercase text-[#f87171] font-bold">⚔️ Enemy Force</div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Starting:</span><span class="text-[#e6edf3]">Pwr ${rpt.enemyInitialPower !== undefined ? rpt.enemyInitialPower : (rpt.enemyPower || 0)}</span></div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Surviving:</span><span class="text-[#fbbf24] font-bold">Pwr ${rpt.enemySurvivingPower !== undefined ? rpt.enemySurvivingPower : (isWin ? 0 : (rpt.enemyPower || 0))}</span></div>
          <div class="flex justify-between"><span class="text-[#8b949e]">Losses:</span><span class="text-[#f87171] font-bold">${rpt.enemyLosses !== undefined ? rpt.enemyLosses : (isWin ? (rpt.enemyPower || 0) : 0)}</span></div>
        </div>
      </div>
      ${rewardsHtml}
      <button data-action="dismiss-battle-results" onclick="window.WargameApp.handleDismissBattleResultsPopup()" class="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer ${isWin ? 'bg-[#34d399] hover:bg-[#10b981] text-[#080b11]' : 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11]'}">Continue</button>
    </div>
  `;
  setHtmlIfChanged(body, html);
  modal.classList.remove('hidden');
}
