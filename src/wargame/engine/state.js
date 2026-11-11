// Wargame Authoritative State Store, Universe -> World -> Cities -> Units Hierarchy & Save Serialization

import {
  WARGAME_SCHEMA_VERSION,
  WARGAME_STORAGE_KEY,
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  OVERWORLD_MAP_W,
  OVERWORLD_MAP_H,
  RESOURCE_PRODUCTION_INTERVAL_MS,
  CITY_GRID_COLS,
  CITY_GRID_ROWS,
  CITY_TOTAL_PLOTS,
  CITY_CENTER_PLOT_INDEX,
  DEFAULT_STORAGE_CAPS,
  BASE_POPULATION_CAP,
  HUT_POPULATION_PER_LEVEL
} from '../constants.js';
import { generateOverworldMap } from './pathfinding.js';
import { createInitialTasksState } from './taskEngine.js';
import { CITY_PLOT_SLOTS, CITY_BUILDINGS_CATALOG } from '../data/buildings.js';

export function createTitleScreenState() {
  return {
    schemaVersion: WARGAME_SCHEMA_VERSION,
    campaignPhase: CAMPAIGN_PHASES.TITLE,
    activeView: WARGAME_VIEWS.OVERWORLD,
    universe: {
      id: 'universe_prime',
      name: 'Aethelgard Astral Cosmos',
      createdAt: Date.now()
    },
    world: null
  };
}

export function createNewCampaignWorldState(options = {}) {
  const houseName = String(options.houseName || 'House Vanguard').trim() || 'House Vanguard';
  const worldName = String(options.worldName || 'Starfall Frontier').trim() || 'Starfall Frontier';
  const seedCode  = String(options.seedCode  || 'STAR-7777').trim() || 'STAR-7777';
  const simSpeed  = typeof options.simSpeed === 'number' && options.simSpeed > 0 ? options.simSpeed : 1;

  const overworld = generateOverworldMap(OVERWORLD_MAP_W, OVERWORLD_MAP_H, seedCode);

  return {
    schemaVersion: WARGAME_SCHEMA_VERSION,
    campaignPhase: CAMPAIGN_PHASES.SETTLER_PIONEER,
    activeView: WARGAME_VIEWS.OVERWORLD,
    universe: {
      id: 'universe_prime',
      name: 'Aethelgard Astral Cosmos',
      createdAt: Date.now()
    },
    world: {
      id: 'world_prime',
      name: worldName,
      seedCode: seedCode,
      player: {
        id: 'player_local',
        houseName: houseName,
        guildArchetype: 'adventurer', // 'adventurer' | 'war' | 'social'
        divineFavor: 0
      },
      clock: {
        simTimeMs: 0,
        lastRealTimestamp: Date.now(),
        speedMultiplier: simSpeed,
        paused: false,
        nextResourceTickMs: RESOURCE_PRODUCTION_INTERVAL_MS
      },
      // Pioneer supply wagon stockpile before founding first city
      realmStockpile: {
        wood: 50,
        stone: 50,
        food: 100,
        gold: 50,
        water: 50,
        ore: 20
      },
      overworld: overworld,
      cities: {},
      activeCityId: null,
      // Heroes & Parties only exist AFTER Adventurers Guild Hall is constructed!
      heroes: [],
      parties: [],
      tasks: createInitialTasksState(),
      scheduledJobs: [],
      stats: {
        totalUnitSteps: 0,
        citiesFounded: 0,
        buildingsCompleted: 0,
        resourcesHarvested: 0,
        heroesRecruited: 0,
        dungeonsEntered: 0
      }
    }
  };
}

export function createDefaultCityPlots() {
  const plots = [];
  const total = CITY_TOTAL_PLOTS || 64;
  const cols = CITY_GRID_COLS || 8;
  const centerIdx = CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27;

  for (let i = 0; i < total; i++) {
    const px = i % cols;
    const py = Math.floor(i / cols);
    const isCenter = i === centerIdx;

    plots.push({
      plotIndex: i,
      x: px,
      y: py,
      label: isCenter ? 'Meeting Hall Plot' : ('Plot (' + px + ', ' + py + ')'),
      buildingId: isCenter ? 'town_hall' : null,
      level: isCenter ? 1 : 0,
      underConstruction: false,
      demolishing: false,
      relocating: false,
      activeJobId: null
    });
  }
  return plots;
}

export function getPrimaryCity(state) {
  if (!state || !state.world || !state.world.cities) return null;
  if (state.world.activeCityId && state.world.cities[state.world.activeCityId]) {
    return state.world.cities[state.world.activeCityId];
  }
  const keys = Object.keys(state.world.cities);
  return keys.length > 0 ? state.world.cities[keys[0]] : null;
}

export function getSelectedOverworldUnit(state) {
  if (!state || !state.world || !state.world.overworld) return null;
  const ow = state.world.overworld;
  const units = ow.units || [];
  if (ow.selectedUnitId) {
    const found = units.find(function(u) { return u.id === ow.selectedUnitId && u.alive; });
    if (found) return found;
  }
  const firstAlive = units.find(function(u) { return u.alive; });
  if (firstAlive) {
    ow.selectedUnitId = firstAlive.id;
    return firstAlive;
  }
  return null;
}

export function getEffectiveStockpile(state) {
  const fallback = { wood: 0, stone: 0, food: 0, gold: 0, water: 0, ore: 0 };
  if (!state || !state.world) return fallback;
  const city = getPrimaryCity(state);
  if (city && city.stockpile) {
    return city.stockpile;
  }
  return state.world.realmStockpile || fallback;
}

export function computeCityStorageCaps(city) {
  const caps = Object.assign({}, DEFAULT_STORAGE_CAPS || {
    food: 200, wood: 200, stone: 200, ore: 100, water: 200, gold: 300
  });
  if (!city || !Array.isArray(city.plots)) return caps;
  for (let i = 0; i < city.plots.length; i++) {
    const p = city.plots[i];
    if (!p.buildingId || (p.level || 0) <= 0 || p.underConstruction || p.demolishing) continue;
    const bDef = CITY_BUILDINGS_CATALOG[p.buildingId];
    if (bDef && bDef.storageBonus) {
      const keys = Object.keys(bDef.storageBonus);
      for (let k = 0; k < keys.length; k++) {
        const resKey = keys[k];
        caps[resKey] = (caps[resKey] || 0) + ((bDef.storageBonus[resKey] || 0) * (p.level || 1));
      }
    }
  }
  return caps;
}

export function computeCityPopulation(city, world = null) {
  let maxPop = BASE_POPULATION_CAP || 10;
  if (city && Array.isArray(city.plots)) {
    for (let i = 0; i < city.plots.length; i++) {
      const p = city.plots[i];
      if (p.buildingId === 'hut' && (p.level || 0) > 0 && !p.demolishing) {
        maxPop += (p.level || 1) * (HUT_POPULATION_PER_LEVEL || 5);
      }
    }
  }

  if (city && city.population && typeof city.population.current === 'number') {
    city.population.max = maxPop;
    return {
      current: city.population.current,
      max: maxPop,
      starving: Boolean(city.population.starving),
      growthProgress: city.population.growthProgress || 0
    };
  }

  let currentPop = 5;
  if (city && city.level) {
    currentPop += (city.level - 1) * 2;
  }
  if (world && Array.isArray(world.heroes)) {
    currentPop += world.heroes.length;
  }
  currentPop = Math.min(currentPop, maxPop);
  return { current: currentPop, max: maxPop, starving: false, growthProgress: 0 };
}

export function hasSavedWargameCampaign() {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(WARGAME_STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.world && parsed.campaignPhase !== CAMPAIGN_PHASES.TITLE);
  } catch (e) {
    return false;
  }
}

export function peekSavedCampaignSummary() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(WARGAME_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.world) return null;
    const w = parsed.world;
    const cityCount = Object.keys(w.cities || {}).length;
    const heroCount = Array.isArray(w.heroes) ? w.heroes.length : 0;
    const simSeconds = Math.floor(((w.clock && w.clock.simTimeMs) || 0) / 1000);
    return {
      houseName: (w.player && w.player.houseName) || 'House Vanguard',
      worldName: w.name || 'Starfall Frontier',
      seedCode: w.seedCode || 'STAR-7777',
      campaignPhase: parsed.campaignPhase,
      cityCount: cityCount,
      heroCount: heroCount,
      simSeconds: simSeconds
    };
  } catch (e) {
    return null;
  }
}

export function saveWargameState(state, scheduler = null) {
  if (typeof localStorage === 'undefined' || !state || !state.world) return false;
  if (scheduler) {
    state.world.scheduledJobs = scheduler.serializeJobs();
  }
  state.world.clock.lastRealTimestamp = Date.now();
  localStorage.setItem(WARGAME_STORAGE_KEY, JSON.stringify(state));
  return true;
}

export function loadWargameState(scheduler = null) {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(WARGAME_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.world) return null;
    if (parsed.world.realmStockpile) {
      if (typeof parsed.world.realmStockpile.water !== 'number') parsed.world.realmStockpile.water = 50;
      if (typeof parsed.world.realmStockpile.ore !== 'number')   parsed.world.realmStockpile.ore = 20;
    }
    if (parsed.world.cities) {
      Object.keys(parsed.world.cities).forEach(function(cid) {
        const c = parsed.world.cities[cid];
        if (!c.stockpile) c.stockpile = {};
        if (typeof c.stockpile.water !== 'number') c.stockpile.water = 50;
        if (typeof c.stockpile.ore !== 'number')   c.stockpile.ore = 20;
        if (!c.buildings) c.buildings = {};
        if (c.buildings.town_hall && !c.buildings.meeting_hall) {
          c.buildings.meeting_hall = c.buildings.town_hall;
        }
        if (!Array.isArray(c.buildQueue)) c.buildQueue = [];
        if (!c.maxBuildQueueSlots) c.maxBuildQueueSlots = 3;
        if (!Array.isArray(c.recruitmentQueue)) c.recruitmentQueue = [];
        if (!c.maxRecruitQueueSlots) c.maxRecruitQueueSlots = 3;
        if (typeof c.selectedPlotIndex !== 'number') c.selectedPlotIndex = (CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27);

        // Migrate legacy 8-plot array to full 64-plot 8x8 grid if needed
        if (!Array.isArray(c.plots) || c.plots.length < (CITY_TOTAL_PLOTS || 64)) {
          const freshPlots = createDefaultCityPlots();
          if (Array.isArray(c.plots)) {
            for (let p = 0; p < c.plots.length; p++) {
              const oldP = c.plots[p];
              if (oldP && oldP.buildingId) {
                const targetIdx = (oldP.plotIndex === 0 && oldP.buildingId === 'town_hall')
                  ? (CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27)
                  : oldP.plotIndex;
                if (freshPlots[targetIdx]) {
                  freshPlots[targetIdx].buildingId = oldP.buildingId;
                  freshPlots[targetIdx].level = oldP.level || 1;
                  freshPlots[targetIdx].underConstruction = Boolean(oldP.underConstruction);
                  freshPlots[targetIdx].demolishing = Boolean(oldP.demolishing);
                  freshPlots[targetIdx].relocating = Boolean(oldP.relocating);
                  freshPlots[targetIdx].activeJobId = oldP.activeJobId || null;
                }
              }
            }
          }
          c.plots = freshPlots;
        }
      });
    }
    if (scheduler && Array.isArray(parsed.world.scheduledJobs)) {
      scheduler.hydrateJobs(parsed.world.scheduledJobs);
    }
    return parsed;
  } catch (e) {
    return null;
  }
}
