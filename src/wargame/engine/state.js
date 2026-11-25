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
  HUT_POPULATION_PER_LEVEL,
  BASE_MAX_HERO_ROSTER,
  CITY_STORAGE_BASE_CAPACITY,
  BASE_TROOP_QUEUE_LIMIT
} from '../constants.js';
import { generateOverworldMap, isOverworldTilePassable } from './pathfinding.js';
import { isInOverworldBounds, areHexesAdjacent } from './hexSpatial.js';
import { createInitialTasksState } from './taskEngine.js';
import { CITY_PLOT_SLOTS, CITY_BUILDINGS_CATALOG } from '../data/buildings.js';
import { getTroopDefinition, normalizeLegacyTroopDefId, TROOP_LOCATION_TYPES } from '../data/troops.js';
import { createDefaultProgressionState, ensureProgressionState } from '../../progression/progressionState.js';
import { CANONICAL_PLAYER_ID, ensureCanonicalPlayerIdentity } from '../../core/canonicalIdentity.js';
import { packDungeonWorldSnapshot } from '../../engine/state.js';

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
      campaignId: 'camp_' + seedCode + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      name: worldName,
      seedCode: seedCode,
      player: {
        id: CANONICAL_PLAYER_ID,
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
      // Heroes & Parties only exist AFTER a Guild Hall is constructed!
      roster: {
        maxHeroes: BASE_MAX_HERO_ROSTER || 3,
        overallLeaderHeroId: null
      },
      heroes: [],
      parties: [],
      troopGroups: [],
      tasks: createInitialTasksState(),
      progression: createDefaultProgressionState(0),
      scheduledJobs: [],
      stats: {
        totalUnitSteps: 0,
        citiesFounded: 0,
        buildingsCompleted: 0,
        resourcesHarvested: 0,
        heroesRecruited: 0,
        troopsTrained: 0,
        dungeonsEntered: 0,
        expeditionsBanked: 0,
        skirmishesWon: 0
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

export function createInventoryContainer(id, name, capacity) {
  return {
    id: id || 'container_default',
    name: name || 'Storage Vault',
    capacity: typeof capacity === 'number' && capacity > 0 ? capacity : (CITY_STORAGE_BASE_CAPACITY || 200),
    items: []
  };
}

export function computeCityStorageSlotCapacity(city) {
  let cap = CITY_STORAGE_BASE_CAPACITY || 200;
  if (!city || !Array.isArray(city.plots)) return cap;
  for (let i = 0; i < city.plots.length; i++) {
    const p = city.plots[i];
    if (!p.buildingId || (p.level || 0) <= 0 || p.underConstruction || p.demolishing) continue;
    const bDef = CITY_BUILDINGS_CATALOG[p.buildingId];
    if (bDef && bDef.inventorySlotBonus) {
      cap += bDef.inventorySlotBonus * (p.level || 1);
    }
  }
  return cap;
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

export function buildSerializableWargameState(state) {
  if (!state || typeof state !== 'object') return null;
  const clean = {};
  const keys = Object.keys(state);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    // Exclude transient UI/presentation flags (underscore-prefixed) from persisted simulation saves
    if (k.charAt(0) === '_') continue;
    clean[k] = state[k];
  }
  // Never persist transient facility interior view (WARGAME_VIEWS.GUILD) as durable navigation state
  if (clean.activeView === WARGAME_VIEWS.GUILD) {
    const hasCities = Boolean(clean.world && clean.world.cities && Object.keys(clean.world.cities).length > 0);
    clean.activeView = hasCities ? WARGAME_VIEWS.CITY : WARGAME_VIEWS.OVERWORLD;
  }
  return clean;
}

export function validateWargameSavePayload(parsed) {
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'not_an_object' };
  const w = parsed.world;
  if (!w || typeof w !== 'object') return { ok: false, reason: 'missing_world' };
  if (!w.clock || typeof w.clock !== 'object' || typeof w.clock.simTimeMs !== 'number' || !isFinite(w.clock.simTimeMs)) {
    return { ok: false, reason: 'invalid_clock' };
  }
  const ow = w.overworld;
  if (!ow || typeof ow !== 'object' || typeof ow.width !== 'number' || typeof ow.height !== 'number' || ow.width <= 0 || ow.height <= 0) {
    return { ok: false, reason: 'invalid_overworld_dimensions' };
  }
  if (!Array.isArray(ow.tiles) || ow.tiles.length !== ow.height) {
    return { ok: false, reason: 'invalid_overworld_tiles' };
  }
  if (!Array.isArray(ow.explored) || ow.explored.length !== ow.height) {
    return { ok: false, reason: 'invalid_overworld_explored' };
  }
  for (let y = 0; y < ow.height; y++) {
    if (!Array.isArray(ow.tiles[y]) || ow.tiles[y].length !== ow.width) {
      return { ok: false, reason: 'corrupt_tile_row_' + y };
    }
    if (!Array.isArray(ow.explored[y]) || ow.explored[y].length !== ow.width) {
      return { ok: false, reason: 'corrupt_explored_row_' + y };
    }
  }
  if (!Array.isArray(ow.units)) return { ok: false, reason: 'invalid_units' };
  if (w.cities !== undefined && (typeof w.cities !== 'object' || w.cities === null || Array.isArray(w.cities))) {
    return { ok: false, reason: 'invalid_cities' };
  }
  if (w.heroes !== undefined && !Array.isArray(w.heroes)) return { ok: false, reason: 'invalid_heroes' };
  if (w.parties !== undefined && !Array.isArray(w.parties)) return { ok: false, reason: 'invalid_parties' };
  if (w.troopGroups !== undefined && !Array.isArray(w.troopGroups)) return { ok: false, reason: 'invalid_troop_groups' };
  return { ok: true };
}

export function reconcileLoadedWorldIntegrity(parsed) {
  const w = parsed.world;
  const ow = w.overworld;
  const simTimeMs = (w.clock && typeof w.clock.simTimeMs === 'number') ? w.clock.simTimeMs : 0;

  if (!w.cities || typeof w.cities !== 'object') w.cities = {};
  if (!Array.isArray(w.heroes)) w.heroes = [];
  if (!Array.isArray(w.parties)) w.parties = [];

  // 0. Normalize activeView on load so stale/invalid facility views never trap the player in Adventurers Guild
  const cityIds = Object.keys(w.cities);
  const hasCitiesOnLoad = cityIds.length > 0;
  if (parsed.activeView !== WARGAME_VIEWS.OVERWORLD && parsed.activeView !== WARGAME_VIEWS.CITY) {
    parsed.activeView = hasCitiesOnLoad ? WARGAME_VIEWS.CITY : WARGAME_VIEWS.OVERWORLD;
  } else if (parsed.activeView === WARGAME_VIEWS.CITY && !hasCitiesOnLoad) {
    parsed.activeView = WARGAME_VIEWS.OVERWORLD;
  }

  // 1. Reconcile activeCityId
  if (w.activeCityId && !w.cities[w.activeCityId]) {
    w.activeCityId = cityIds.length > 0 ? cityIds[0] : null;
  } else if (!w.activeCityId && cityIds.length > 0) {
    w.activeCityId = cityIds[0];
  }

  // 2. Reconcile hero IDs, roster leader & party memberships (never delete valid entities)
  const heroIdSet = {};
  for (let i = 0; i < w.heroes.length; i++) {
    if (w.heroes[i] && w.heroes[i].id) heroIdSet[w.heroes[i].id] = true;
  }
  if (w.roster) {
    if (w.roster.overallLeaderHeroId && !heroIdSet[w.roster.overallLeaderHeroId]) {
      w.roster.overallLeaderHeroId = w.heroes.length > 0 ? w.heroes[0].id : null;
    }
  }
  for (let pi = 0; pi < w.parties.length; pi++) {
    const party = w.parties[pi];
    if (!party) continue;
    if (Array.isArray(party.memberIds)) {
      const seen = {};
      party.memberIds = party.memberIds.filter(function(mid) {
        if (!heroIdSet[mid] || seen[mid]) return false;
        seen[mid] = true;
        return true;
      });
    } else {
      party.memberIds = [];
    }
    if (party.leaderHeroId && !heroIdSet[party.leaderHeroId]) {
      party.leaderHeroId = party.memberIds.length > 0 ? party.memberIds[0] : null;
    }
  }

  // 3. Reconcile selectedUnitId
  const units = Array.isArray(ow.units) ? ow.units : [];
  const hasSelected = Boolean(ow.selectedUnitId && units.some(function(u) { return u && u.id === ow.selectedUnitId && u.alive; }));
  if (!hasSelected) {
    const firstAlive = units.find(function(u) { return u && u.alive; });
    ow.selectedUnitId = firstAlive ? firstAlive.id : null;
  }

  // 4. Deduplicate scheduledJobs by jobId
  const rawJobs = Array.isArray(w.scheduledJobs) ? w.scheduledJobs : [];
  const jobMap = {};
  const cleanJobs = [];
  for (let ji = 0; ji < rawJobs.length; ji++) {
    const j = rawJobs[ji];
    if (!j || !j.jobId || typeof j.dueSimTimeMs !== 'number' || !isFinite(j.dueSimTimeMs)) continue;
    if (jobMap[j.jobId]) continue;
    jobMap[j.jobId] = j;
    cleanJobs.push(j);
  }

  // 5. Reconcile interrupted marches & active dungeon sessions
  const dngWorld = w.dungeonWorld && typeof w.dungeonWorld === 'object' ? w.dungeonWorld : null;
  const activeSess = dngWorld && dngWorld.activeSession && typeof dngWorld.activeSession === 'object' ? dngWorld.activeSession : null;
  const sessDungeonExists = Boolean(activeSess && activeSess.dungeonId && dngWorld.dungeons && dngWorld.dungeons[activeSess.dungeonId] && activeSess.hero);

  for (let ui = 0; ui < units.length; ui++) {
    const u = units[ui];
    if (!u || !u.alive) continue;

    if (u.status === 'marching') {
      const mp = u.marchPlan;
      let pathValid = Boolean(mp && Array.isArray(mp.remainingPath) && mp.remainingPath.length > 0);
      if (pathValid) {
        let px = u.x;
        let py = u.y;
        for (let si = 0; si < mp.remainingPath.length; si++) {
          const st = mp.remainingPath[si];
          if (!st || !isInOverworldBounds(ow, st.x, st.y) || !isOverworldTilePassable(ow, st.x, st.y) || !areHexesAdjacent(px, py, st.x, st.y)) {
            pathValid = false;
            break;
          }
          px = st.x;
          py = st.y;
        }
      }
      if (!pathValid) {
        u.status = 'idle';
        u.marchPlan = null;
      } else if (!mp.activeJobId || !jobMap[mp.activeJobId]) {
        const nextStep = mp.remainingPath[0];
        const stepDur = Math.max(250, nextStep.stepDurationMs || 3000);
        const recoveryJobId = 'job_recover_march_' + u.id + '_' + simTimeMs;
        const dueMs = Math.max(simTimeMs + 250, mp.stepDueSimTimeMs || (simTimeMs + stepDur));
        const recJob = {
          jobId: recoveryJobId,
          jobType: 'UNIT_MARCH_STEP',
          ownerId: u.id,
          startSimTimeMs: simTimeMs,
          dueSimTimeMs: dueMs,
          durationMs: Math.max(1, dueMs - simTimeMs),
          payload: { unitId: u.id, targetX: nextStep.x, targetY: nextStep.y }
        };
        mp.activeJobId = recoveryJobId;
        mp.fromX = u.x;
        mp.fromY = u.y;
        mp.toX = nextStep.x;
        mp.toY = nextStep.y;
        mp.stepStartSimTimeMs = simTimeMs;
        mp.stepDueSimTimeMs = dueMs;
        jobMap[recoveryJobId] = recJob;
        cleanJobs.push(recJob);
      }
    } else if (u.status === 'in_dungeon') {
      const matchesSession = Boolean(sessDungeonExists && activeSess.unitId === u.id);
      if (!matchesSession) {
        // Deterministic safe fallback: return party to idle at dungeon entrance POI without losing permanent progression/gear
        const poi = (ow.pois || []).find(function(p) {
          return p && p.type === 'dungeon_entrance' && (p.id === u.activeDungeonPoiId || p.dungeonId === u.activeDungeonId);
        });
        if (poi && isInOverworldBounds(ow, poi.x, poi.y)) {
          u.x = poi.x;
          u.y = poi.y;
        }
        u.status = 'idle';
        u.marchPlan = null;
        u.activeDungeonPoiId = null;
        u.activeDungeonId = null;
      }
    }
  }

  // 6. Reconcile orphaned active city build/recruitment queue items
  for (let ci = 0; ci < cityIds.length; ci++) {
    const c = w.cities[cityIds[ci]];
    if (!c) continue;
    if (Array.isArray(c.buildQueue)) {
      for (let bi = 0; bi < c.buildQueue.length; bi++) {
        const bq = c.buildQueue[bi];
        if (bq && bq.status === 'building' && (!bq.jobId || !jobMap[bq.jobId])) {
          const recJobId = bq.jobId || ('job_recover_build_' + c.id + '_' + bi);
          const dueMs = Math.max(simTimeMs + 250, bq.dueSimTimeMs || (simTimeMs + 5000));
          const recJob = {
            jobId: recJobId,
            jobType: bq.actionType === 'demolish' ? 'BUILDING_DEMOLISH_COMPLETE' : (bq.actionType === 'move' ? 'BUILDING_MOVE_COMPLETE' : 'BUILDING_COMPLETE'),
            ownerId: c.id,
            startSimTimeMs: bq.startSimTimeMs || simTimeMs,
            dueSimTimeMs: dueMs,
            durationMs: Math.max(1, dueMs - (bq.startSimTimeMs || simTimeMs)),
            payload: {
              cityId: c.id,
              plotIndex: bq.plotIndex,
              sourcePlotIndex: bq.sourcePlotIndex,
              targetPlotIndex: bq.targetPlotIndex,
              buildingId: bq.buildingId,
              targetLevel: bq.targetLevel,
              queueItemId: bq.queueItemId
            }
          };
          bq.jobId = recJobId;
          bq.dueSimTimeMs = dueMs;
          jobMap[recJobId] = recJob;
          cleanJobs.push(recJob);
        }
      }
    }
    if (Array.isArray(c.recruitmentQueue)) {
      for (let ri = 0; ri < c.recruitmentQueue.length; ri++) {
        const rq = c.recruitmentQueue[ri];
        if (rq && rq.status === 'training' && (!rq.jobId || !jobMap[rq.jobId])) {
          const recJobId = rq.jobId || ('job_recover_recruit_' + c.id + '_' + ri);
          const dueMs = Math.max(simTimeMs + 250, rq.dueSimTimeMs || (simTimeMs + 10000));
          const recJob = {
            jobId: recJobId,
            jobType: 'HERO_RECRUIT_COMPLETE',
            ownerId: c.id,
            startSimTimeMs: rq.startSimTimeMs || simTimeMs,
            dueSimTimeMs: dueMs,
            durationMs: Math.max(1, dueMs - (rq.startSimTimeMs || simTimeMs)),
            payload: {
              cityId: c.id,
              classId: rq.classId,
              heroName: rq.heroName,
              queueItemId: rq.queueItemId
            }
          };
          rq.jobId = recJobId;
          rq.dueSimTimeMs = dueMs;
          jobMap[recJobId] = recJob;
          cleanJobs.push(recJob);
        }
      }
    }
    if (Array.isArray(c.troopTrainingQueue)) {
      const validTroopQueue = [];
      for (let ti = 0; ti < c.troopTrainingQueue.length; ti++) {
        const tq = c.troopTrainingQueue[ti];
        if (!tq) continue;
        const normId = normalizeLegacyTroopDefId(tq.troopDefId);
        const normDef = getTroopDefinition(normId);
        if (!normDef) continue;
        const qty = Math.floor(tq.quantity || 0);
        const done = Math.max(0, Math.floor(tq.completedCount || 0));
        if (qty <= 0 || done >= qty) continue;
        tq.troopDefId = normId;
        tq.troopName = normDef.name;
        tq.jobKind = (tq.jobKind === 'upgrade') ? 'upgrade' : 'recruit';
        if (tq.jobKind === 'upgrade') {
          tq.fromLevel = Math.max(1, Math.floor(tq.fromLevel || 1));
          tq.toLevel = Math.max(tq.fromLevel + 1, Math.floor(tq.toLevel || (tq.fromLevel + 1)));
        } else {
          tq.level = Math.max(1, Math.floor(tq.level || 1));
        }
        tq.quantity = qty;
        tq.completedCount = done;
        tq.cityId = c.id;
        validTroopQueue.push(tq);
      }
      c.troopTrainingQueue = validTroopQueue;
      for (let ti = 0; ti < c.troopTrainingQueue.length; ti++) {
        const tq = c.troopTrainingQueue[ti];
        const isActive = (tq.status === 'training' || tq.status === 'upgrading');
        if (isActive && (!tq.jobId || !jobMap[tq.jobId])) {
          const isUpgrade = tq.jobKind === 'upgrade';
          const recJobId = tq.jobId || ((isUpgrade ? 'job_recover_troop_upg_' : 'job_recover_troop_') + c.id + '_' + ti);
          const perUnitDur = Math.max(1500, tq.durationMsPerUnit || 8000);
          const dueMs = Math.max(simTimeMs + 250, tq.dueSimTimeMs || (simTimeMs + perUnitDur));
          const recJob = {
            jobId: recJobId,
            jobType: isUpgrade ? 'TROOP_UPGRADE_UNIT_COMPLETE' : 'TROOP_TRAIN_UNIT_COMPLETE',
            ownerId: c.id,
            startSimTimeMs: tq.startSimTimeMs || simTimeMs,
            dueSimTimeMs: dueMs,
            durationMs: Math.max(1, dueMs - (tq.startSimTimeMs || simTimeMs)),
            payload: {
              cityId: c.id,
              queueItemId: tq.queueItemId,
              troopDefId: tq.troopDefId
            }
          };
          tq.jobId = recJobId;
          tq.dueSimTimeMs = dueMs;
          jobMap[recJobId] = recJob;
          cleanJobs.push(recJob);
        }
      }
    }
  }

  // 7. Reconcile Troop Group instances (migrate legacy 'city_garrison' -> 'barracks', preserve type & level, drop invalid/empty)
  if (!Array.isArray(w.troopGroups)) {
    w.troopGroups = [];
  } else {
    const cleanGroups = [];
    for (let gi = 0; gi < w.troopGroups.length; gi++) {
      const g = w.troopGroups[gi];
      if (!g || !g.id) continue;
      const normDefId = normalizeLegacyTroopDefId(g.troopDefId);
      if (!getTroopDefinition(normDefId)) continue;
      const cnt = Math.floor(g.count || 0);
      if (cnt <= 0) continue;
      let locType = g.locationType || TROOP_LOCATION_TYPES.BARRACKS;
      // Migrate legacy Task 05A/C1/C2 'city_garrison' Barracks troop groups -> 'barracks' without duplication or loss
      if (locType === 'city_garrison') {
        locType = TROOP_LOCATION_TYPES.BARRACKS;
      }
      if (locType === TROOP_LOCATION_TYPES.BARRACKS && (!g.locationId || !w.cities[g.locationId])) {
        continue;
      }
      g.troopDefId = normDefId;
      g.count = cnt;
      g.locationType = locType;
      g.level = typeof g.level === 'number' && g.level >= 1 ? Math.floor(g.level) : 1;
      g.xp = typeof g.xp === 'number' && g.xp >= 0 ? g.xp : 0;
      g.condition = typeof g.condition === 'number' ? Math.max(0, Math.min(100, g.condition)) : 100;
      if (!g.ownerPlayerId || g.ownerPlayerId === 'player_local') {
        g.ownerPlayerId = (w.player && w.player.id) || CANONICAL_PLAYER_ID;
      }
      cleanGroups.push(g);
    }
    w.troopGroups = cleanGroups;
  }

  w.scheduledJobs = cleanJobs;
  return cleanJobs;
}

export function saveWargameState(state, scheduler = null, dungeonState = null) {
  if (typeof localStorage === 'undefined' || !state || !state.world) return false;
  try {
    const payload = buildSerializableWargameState(state);
    if (!payload || !payload.world) return false;
    const jobs = scheduler ? scheduler.serializeJobs() : (Array.isArray(state.world.scheduledJobs) ? state.world.scheduledJobs : []);
    const nowTs = Date.now();
    // Stage updated metadata on payload without corrupting last valid save if serialization or storage throws
    const worldCopy = Object.assign({}, payload.world, {
      scheduledJobs: jobs,
      clock: Object.assign({}, payload.world.clock, { lastRealTimestamp: nowTs })
    });
    if (dungeonState && dungeonState.dungeons) {
      const dngSnap = packDungeonWorldSnapshot(dungeonState);
      if (dngSnap) {
        worldCopy.dungeonWorld = dngSnap;
      }
    }
    payload.world = worldCopy;
    const serialized = JSON.stringify(payload);
    localStorage.setItem(WARGAME_STORAGE_KEY, serialized);
    state.world.scheduledJobs = jobs;
    state.world.clock.lastRealTimestamp = nowTs;
    if (worldCopy.dungeonWorld) {
      state.world.dungeonWorld = worldCopy.dungeonWorld;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function loadWargameState(scheduler = null, options = null) {
  if (typeof localStorage === 'undefined') return null;
  const opts = options || {};
  const raw = localStorage.getItem(WARGAME_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const validation = validateWargameSavePayload(parsed);
    if (!validation.ok) return null;
    if (parsed.world.realmStockpile) {
      if (typeof parsed.world.realmStockpile.water !== 'number') parsed.world.realmStockpile.water = 50;
      if (typeof parsed.world.realmStockpile.ore !== 'number')   parsed.world.realmStockpile.ore = 20;
    }
    if (parsed.world.stats) {
      if (typeof parsed.world.stats.expeditionsBanked !== 'number') parsed.world.stats.expeditionsBanked = 0;
      if (typeof parsed.world.stats.skirmishesWon !== 'number')     parsed.world.stats.skirmishesWon = 0;
      if (typeof parsed.world.stats.troopsTrained !== 'number')     parsed.world.stats.troopsTrained = 0;
    }
    if (!Array.isArray(parsed.world.troopGroups)) {
      parsed.world.troopGroups = [];
    }
    if (!parsed.world.roster || typeof parsed.world.roster !== 'object') {
      const firstH = Array.isArray(parsed.world.heroes) && parsed.world.heroes.length > 0 ? parsed.world.heroes[0].id : null;
      parsed.world.roster = {
        maxHeroes: BASE_MAX_HERO_ROSTER || 3,
        overallLeaderHeroId: firstH
      };
    }
    if (parsed.world.overworld) {
      if (!Array.isArray(parsed.world.overworld.hostiles)) parsed.world.overworld.hostiles = [];
      if (Array.isArray(parsed.world.overworld.pois)) {
        for (let pi = 0; pi < parsed.world.overworld.pois.length; pi++) {
          const poi = parsed.world.overworld.pois[pi];
          if (poi.type === 'dungeon_entrance') {
            if (!poi.profileId) poi.profileId = 'starfall_vaults';
            if (typeof poi.discovered !== 'boolean') {
              const expRow = parsed.world.overworld.explored && parsed.world.overworld.explored[poi.y];
              poi.discovered = Boolean(expRow && expRow[poi.x]);
            }
          }
        }
      }
      if (Array.isArray(parsed.world.overworld.units)) {
        for (let ui = 0; ui < parsed.world.overworld.units.length; ui++) {
          if (parsed.world.overworld.units[ui].cargo === undefined) {
            parsed.world.overworld.units[ui].cargo = null;
          }
        }
      }
    }
    if (Array.isArray(parsed.world.heroes)) {
      for (let hi = 0; hi < parsed.world.heroes.length; hi++) {
        const hh = parsed.world.heroes[hi];
        if (!hh.equipment) {
          hh.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };
        }
        if (!hh.cosmetics) {
          hh.cosmetics = { cloak: null, aura: null, banner_crest: null, weapon_glow: null };
        }
        if (!Array.isArray(hh.bagGear)) {
          hh.bagGear = [];
        }
        // Backfill Task 02 hero progression fields ONLY when absent (never overwrite existing progression!)
        if (typeof hh.maxXp !== 'number' || hh.maxXp <= 0) hh.maxXp = 60;
        if (!hh.bonusStats || typeof hh.bonusStats !== 'object') {
          hh.bonusStats = { str: 0, dex: 0, int: 0, vit: 0 };
        }
        if (typeof hh.statPoints !== 'number') hh.statPoints = 0;
        if (typeof hh.talentPoints !== 'number') hh.talentPoints = 0;
        if (!hh.talentsAllocated || typeof hh.talentsAllocated !== 'object') {
          hh.talentsAllocated = {};
        }
      }
    }
    if (parsed.world.cities) {
      Object.keys(parsed.world.cities).forEach(function(cid) {
        const c = parsed.world.cities[cid];
        if (!c.stockpile) c.stockpile = {};
        if (typeof c.stockpile.water !== 'number') c.stockpile.water = 50;
        if (typeof c.stockpile.ore !== 'number')   c.stockpile.ore = 20;
        if (typeof c.stockpile.ingots !== 'number') c.stockpile.ingots = 0;
        if (!c.provisions || typeof c.provisions !== 'object') {
          c.provisions = { potions: 2, recalls: 1 };
        }
        if (!c.gems || typeof c.gems !== 'object') {
          c.gems = { ruby: 1, emerald: 1, sapphire: 0, topaz: 0, void_diamond: 0 };
        }
        if (!c.buildings) c.buildings = {};
        if (c.buildings.town_hall && !c.buildings.meeting_hall) {
          c.buildings.meeting_hall = c.buildings.town_hall;
        }
        if (!Array.isArray(c.buildQueue)) c.buildQueue = [];
        if (!c.maxBuildQueueSlots) c.maxBuildQueueSlots = 3;
        if (!Array.isArray(c.recruitmentQueue)) c.recruitmentQueue = [];
        if (!c.maxRecruitQueueSlots) c.maxRecruitQueueSlots = 3;
        if (!Array.isArray(c.troopTrainingQueue)) c.troopTrainingQueue = [];
        if (!c.maxTroopQueueSlots) c.maxTroopQueueSlots = BASE_TROOP_QUEUE_LIMIT || 3;
        if (!c.storage || !Array.isArray(c.storage.items)) {
          c.storage = createInventoryContainer('city_storage_' + cid, (c.name || 'City') + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
        }
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
    if (parsed.world) {
      ensureCanonicalPlayerIdentity(parsed.world);
      ensureProgressionState(parsed.world);
      reconcileLoadedWorldIntegrity(parsed);
    }
    if (scheduler && !opts.deferSchedulerHydrate && Array.isArray(parsed.world.scheduledJobs)) {
      scheduler.hydrateJobs(parsed.world.scheduledJobs);
    }
    return parsed;
  } catch (e) {
    return null;
  }
}
