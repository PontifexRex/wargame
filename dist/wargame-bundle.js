/* Auto-generated from modular ES6 sources in src/ via scripts/build.ps1 */
(function () {
  'use strict';

  // --- Module: src/wargame/constants.js ---
// Wargame Macro Simulation Constants, Campaign Phases, Topic Namespaces & Default Rulesets

const WARGAME_SCHEMA_VERSION = 'v1.0.0-wargame-sim';
const WARGAME_STORAGE_KEY = 'aethelgard_wargame_campaign_v1';

// Campaign Lifecycle Phases (Strict Settler-First Onboarding State Machine)
const CAMPAIGN_PHASES = {
  TITLE:             'title',             // Start screen: New Campaign / Continue / Seed & Ruleset
  SETTLER_PIONEER:   'settler_pioneer',   // Controlling Pioneer Settler on Overworld; no City or Hero yet
  CITY_ESTABLISHED:  'city_established',  // First City founded; real-time build queue & resource production active
  GUILD_UNLOCKED:    'guild_unlocked'     // Adventurers Guild Hall built; Hero recruitment & Dungeon parties active
};

// Active Workspace Viewport Modes inside an active campaign
const WARGAME_VIEWS = {
  OVERWORLD: 'overworld',
  CITY:      'city',
  GUILD:     'guild'
};

// Default Overworld Dimensions
const OVERWORLD_MAP_W = 56;
const OVERWORLD_MAP_H = 40;
const OVERWORLD_VIEWPORT_W = 21;
const OVERWORLD_VIEWPORT_H = 15;
const OVERWORLD_TILE_SIZE = 32;

// Real-Time Simulation Tick Configuration
const BASE_TICK_INTERVAL_MS = 100; // 10 simulation ticks per second (100ms resolution)
const RESOURCE_PRODUCTION_INTERVAL_MS = 5000; // Resource buildings yield every 5s base time
const BASE_HERO_RECRUIT_DURATION_MS = 60000; // 60 seconds real-time hero oath / induction duration
const BASE_BUILD_QUEUE_LIMIT = 3; // Maximum construction projects in queue (1 active + 2 pending)
const BASE_RECRUIT_QUEUE_LIMIT = 3; // Maximum heroes in recruitment queue (1 active + 2 pending)
const DEMOLISH_SALVAGE_RATIO = 0.35; // 35% salvage returned upon demolishing a building
const CANCEL_CLEANUP_TIME_RATIO = 0.50; // Cancelling active construction requires 50% of elapsed time for site cleanup

// Spatial 8x8 City Grid Layout
const CITY_GRID_COLS = 8;
const CITY_GRID_ROWS = 8;
const CITY_TOTAL_PLOTS = 64;
const CITY_CENTER_PLOT_INDEX = 27; // Center plot at (3, 3) where starter Bastion Keep / Hut is founded
const BASE_MOVE_BUILDING_DURATION_MS = 2500; // 2.5s base duration to relocate a structure to an empty plot

// Base Resource Storage Limits & Population Capacities
const DEFAULT_STORAGE_CAPS = {
  food:   200,
  wood:   200,
  stone:  200,
  ore:    100,
  ingots: 100,
  water:  200,
  gold:   300
};
const BASE_POPULATION_CAP = 10;
const HUT_POPULATION_PER_LEVEL = 5;
const WINDMILL_ADJACENCY_BONUS = 0.20;
const BASE_MAX_HERO_ROSTER = 3;
const CITY_STORAGE_BASE_CAPACITY = 200;

// Structured Streaming Event Topics
const STREAM_TOPICS = {
  CAMPAIGN_STARTED:     'campaign.started',
  CAMPAIGN_LOADED:      'campaign.loaded',
  CLOCK_SPEED_CHANGED:  'clock.speedChanged',
  CLOCK_PAUSED:         'clock.paused',
  COMMAND_ACCEPTED:     'command.accepted',
  COMMAND_REJECTED:     'command.rejected',
  UNIT_SPAWNED:         'unit.spawned',
  UNIT_MARCH_STARTED:   'unit.marchStarted',
  UNIT_MARCH_STEP:      'unit.marchStep',
  UNIT_MARCH_COMPLETED: 'unit.marchCompleted',
  UNIT_MARCH_CANCELLED: 'unit.marchCancelled',
  SETTLER_RESPAWNED:    'unit.settlerRespawned',
  CITY_FOUNDED:         'city.founded',
  BUILDING_QUEUED:      'city.buildingQueued',
  BUILDING_CANCELLED:   'city.buildingCancelled',
  BUILDING_DEMOLISHED:  'city.buildingDemolished',
  BUILDING_MOVED:       'city.buildingMoved',
  BUILDING_COMPLETED:   'city.buildingCompleted',
  RESOURCE_TICK:        'city.resourceTick',
  RESOURCE_HARVESTED:   'overworld.resourceHarvested',
  HERO_RECRUIT_STARTED: 'guild.heroRecruitStarted',
  HERO_RECRUIT_CANCEL:  'guild.heroRecruitCancelled',
  HERO_RECRUITED:       'guild.heroRecruited',
  HERO_DISMISSED:       'guild.heroDismissed',
  LEADER_CHANGED:       'guild.leaderChanged',
  STORAGE_UPDATED:      'city.storageUpdated',
  CRAFTING_COMPLETED:   'city.craftingCompleted',
  PARTY_FORMED:         'guild.partyFormed',
  DUNGEON_DISCOVERED:   'dungeon.discovered',
  DUNGEON_ENTERED:      'dungeon.entered',
  DUNGEON_RETURNED:     'dungeon.returned',
  EXPEDITION_BANKED:    'expedition.banked',
  OVERWORLD_SKIRMISH:   'overworld.skirmish',
  TASK_UNLOCKED:        'task.unlocked',
  TASK_PROGRESS:        'task.progress',
  TASK_COMPLETED:       'task.completed',
  TASK_CLAIMED:         'task.claimed'
};

// Authoritative Command Types (Serializable Intent Envelopes)
const COMMAND_TYPES = {
  START_NEW_CAMPAIGN: 'CMD_START_NEW_CAMPAIGN',
  ORDER_UNIT_MARCH:   'CMD_ORDER_UNIT_MARCH',
  STEP_UNIT_ADJACENT: 'CMD_STEP_UNIT_ADJACENT',
  CANCEL_UNIT_MARCH:  'CMD_CANCEL_UNIT_MARCH',
  HARVEST_NODE:       'CMD_HARVEST_NODE',
  FOUND_CITY:         'CMD_FOUND_CITY',
  RESPAWN_SETTLER:    'CMD_RESPAWN_SETTLER',
  SELECT_CITY_PLOT:   'CMD_SELECT_CITY_PLOT',
  QUEUE_BUILDING:     'CMD_QUEUE_BUILDING',
  MOVE_BUILDING:      'CMD_MOVE_BUILDING',
  CANCEL_BUILDING:    'CMD_CANCEL_BUILDING',
  DEMOLISH_BUILDING:  'CMD_DEMOLISH_BUILDING',
  RECRUIT_HERO:          'CMD_RECRUIT_HERO',
  CANCEL_RECRUITMENT:    'CMD_CANCEL_RECRUITMENT',
  DISMISS_HERO:          'CMD_DISMISS_HERO',
  SET_OVERALL_LEADER:    'CMD_SET_OVERALL_LEADER',
  ASSIGN_HERO_TO_PARTY:  'CMD_ASSIGN_HERO_TO_PARTY',
  EQUIP_HERO_ITEM:       'CMD_EQUIP_HERO_ITEM',
  UNEQUIP_HERO_ITEM:     'CMD_UNEQUIP_HERO_ITEM',
  AUTO_EQUIP_HERO:       'CMD_AUTO_EQUIP_HERO',
  DEPOSIT_TO_CITY_STORAGE:    'CMD_DEPOSIT_TO_CITY_STORAGE',
  WITHDRAW_FROM_CITY_STORAGE: 'CMD_WITHDRAW_FROM_CITY_STORAGE',
  DUMP_HERO_BAG_TO_CITY:      'CMD_DUMP_HERO_BAG_TO_CITY',
  SMELT_INGOTS:               'CMD_SMELT_INGOTS',
  BREW_PROVISION:             'CMD_BREW_PROVISION',
  FORGE_EQUIPMENT:            'CMD_FORGE_EQUIPMENT',
  TEMPER_EQUIPMENT:           'CMD_TEMPER_EQUIPMENT',
  PUNCH_SOCKET:               'CMD_PUNCH_SOCKET',
  SOCKET_CITY_GEM:            'CMD_SOCKET_CITY_GEM',
  UNSOCKET_CITY_GEM:          'CMD_UNSOCKET_CITY_GEM',
  MARCH_TO_DUNGEON:           'CMD_MARCH_TO_DUNGEON',
  ENTER_DUNGEON:              'CMD_ENTER_DUNGEON',
  EXIT_DUNGEON_TO_SURFACE:    'CMD_EXIT_DUNGEON_TO_SURFACE',
  RESOLVE_DUNGEON_RETURN:     'CMD_RESOLVE_DUNGEON_RETURN',
  CLAIM_TASK_REWARD:     'CMD_CLAIM_TASK_REWARD',
  SET_SIM_SPEED:      'CMD_SET_SIM_SPEED',
  SWITCH_VIEW:        'CMD_SWITCH_VIEW'
};

  // --- Module: src/wargame/engine/eventStream.js ---
// WorldEventStream — Replayable Ring-Buffer Event Stream & Pub/Sub Dispatcher
// Designed for real-time strategy event streaming, late-joining client replay, and reactive Task DAG evaluation.

function createWorldEventStream(maxBufferSize = 500) {
  let nextSeqId = 1;
  const ringBuffer = [];
  const topicListeners = {};
  const wildcardListeners = [];

  function publish(topic, payload = {}, simTimeMs = 0) {
    const eventEnvelope = {
      seqId: nextSeqId++,
      topic: String(topic),
      timestamp: Date.now(),
      simTimeMs: typeof simTimeMs === 'number' ? simTimeMs : 0,
      payload: payload || {}
    };

    ringBuffer.push(eventEnvelope);
    if (ringBuffer.length > maxBufferSize) {
      ringBuffer.shift();
    }

    // Notify specific topic subscribers
    const subs = topicListeners[eventEnvelope.topic];
    if (subs && subs.length > 0) {
      const snapshot = subs.slice();
      for (let i = 0; i < snapshot.length; i++) {
        snapshot[i](eventEnvelope);
      }
    }

    // Notify wildcard ('*') subscribers
    if (wildcardListeners.length > 0) {
      const wildSnap = wildcardListeners.slice();
      for (let w = 0; w < wildSnap.length; w++) {
        wildSnap[w](eventEnvelope);
      }
    }

    return eventEnvelope;
  }

  function subscribe(topicOrTopics, handler) {
    if (typeof handler !== 'function') return function noop() {};

    if (topicOrTopics === '*') {
      if (wildcardListeners.indexOf(handler) === -1) {
        wildcardListeners.push(handler);
      }
      return function unsubscribeWild() {
        const idx = wildcardListeners.indexOf(handler);
        if (idx !== -1) wildcardListeners.splice(idx, 1);
      };
    }

    const topics = Array.isArray(topicOrTopics) ? topicOrTopics : [topicOrTopics];
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      if (!topicListeners[t]) topicListeners[t] = [];
      if (topicListeners[t].indexOf(handler) === -1) {
        topicListeners[t].push(handler);
      }
    }

    return function unsubscribeTopics() {
      for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        const list = topicListeners[t];
        if (list) {
          const idx = list.indexOf(handler);
          if (idx !== -1) list.splice(idx, 1);
        }
      }
    };
  }

  function getEventsSince(lastSeqId = 0, filterTopic = null) {
    const result = [];
    for (let i = 0; i < ringBuffer.length; i++) {
      const ev = ringBuffer[i];
      if (ev.seqId > lastSeqId) {
        if (!filterTopic || ev.topic === filterTopic || ev.topic.indexOf(filterTopic) === 0) {
          result.push(ev);
        }
      }
    }
    return result;
  }

  function getRecentEvents(limit = 50, filterPrefix = null) {
    const matched = [];
    for (let i = ringBuffer.length - 1; i >= 0; i--) {
      const ev = ringBuffer[i];
      if (!filterPrefix || ev.topic.indexOf(filterPrefix) === 0) {
        matched.push(ev);
        if (matched.length >= limit) break;
      }
    }
    return matched.reverse();
  }

  function getCursor() {
    return nextSeqId - 1;
  }

  function clear() {
    ringBuffer.length = 0;
  }

  return {
    publish: publish,
    subscribe: subscribe,
    getEventsSince: getEventsSince,
    getRecentEvents: getRecentEvents,
    getCursor: getCursor,
    clear: clear
  };
}

  // --- Module: src/wargame/engine/scheduler.js ---
// Binary Min-Heap Priority Queue Scheduler & Real-Time Simulation Clock
// Provides O(log N) scheduling for thousands of concurrent timers (building completions, unit march steps, resource ticks).

function createMinHeapPriorityQueue() {
  const heap = [];

  function compare(a, b) {
    if (a.dueSimTimeMs !== b.dueSimTimeMs) {
      return a.dueSimTimeMs - b.dueSimTimeMs;
    }
    return a.seq - b.seq;
  }

  function siftUp(idx) {
    let i = idx;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (compare(heap[i], heap[parent]) < 0) {
        const tmp = heap[i];
        heap[i] = heap[parent];
        heap[parent] = tmp;
        i = parent;
      } else {
        break;
      }
    }
  }

  function siftDown(idx) {
    let i = idx;
    const len = heap.length;
    while (true) {
      const left = (i << 1) + 1;
      const right = left + 1;
      let smallest = i;

      if (left < len && compare(heap[left], heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && compare(heap[right], heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== i) {
        const tmp = heap[i];
        heap[i] = heap[smallest];
        heap[smallest] = tmp;
        i = smallest;
      } else {
        break;
      }
    }
  }

  function push(item) {
    heap.push(item);
    siftUp(heap.length - 1);
  }

  function peek() {
    return heap.length > 0 ? heap[0] : null;
  }

  function pop() {
    if (heap.length === 0) return null;
    const top = heap[0];
    const bottom = heap.pop();
    if (heap.length > 0) {
      heap[0] = bottom;
      siftDown(0);
    }
    return top;
  }

  function removeById(jobId) {
    for (let i = 0; i < heap.length; i++) {
      if (heap[i].jobId === jobId) {
        const removed = heap[i];
        const bottom = heap.pop();
        if (i < heap.length) {
          heap[i] = bottom;
          siftUp(i);
          siftDown(i);
        }
        return removed;
      }
    }
    return null;
  }

  function toArray() {
    return heap.slice().sort(compare);
  }

  function size() {
    return heap.length;
  }

  function clear() {
    heap.length = 0;
  }

  return {
    push: push,
    peek: peek,
    pop: pop,
    removeById: removeById,
    toArray: toArray,
    size: size,
    clear: clear
  };
}

function createSimulationScheduler() {
  const pq = createMinHeapPriorityQueue();
  let jobSeq = 1;

  function scheduleJob(jobConfig) {
    const job = {
      jobId: jobConfig.jobId || ('job_' + jobSeq),
      seq: jobSeq++,
      jobType: jobConfig.jobType || 'generic',
      ownerId: jobConfig.ownerId || null,
      startSimTimeMs: jobConfig.startSimTimeMs || 0,
      dueSimTimeMs: jobConfig.dueSimTimeMs || 0,
      durationMs: Math.max(1, (jobConfig.dueSimTimeMs || 0) - (jobConfig.startSimTimeMs || 0)),
      payload: jobConfig.payload || {}
    };
    pq.push(job);
    return job;
  }

  function cancelJob(jobId) {
    return pq.removeById(jobId);
  }

  function popDueJobs(currentSimTimeMs) {
    const due = [];
    while (pq.size() > 0) {
      const next = pq.peek();
      if (next.dueSimTimeMs <= currentSimTimeMs) {
        due.push(pq.pop());
      } else {
        break;
      }
    }
    return due;
  }

  function getJobsForOwner(ownerId, jobType = null) {
    const all = pq.toArray();
    return all.filter(function(j) {
      if (ownerId && j.ownerId !== ownerId) return false;
      if (jobType && j.jobType !== jobType) return false;
      return true;
    });
  }

  function serializeJobs() {
    return pq.toArray();
  }

  function hydrateJobs(jobsArray) {
    pq.clear();
    if (!Array.isArray(jobsArray)) return;
    for (let i = 0; i < jobsArray.length; i++) {
      const j = jobsArray[i];
      if (j && typeof j.dueSimTimeMs === 'number') {
        if (typeof j.seq === 'number' && j.seq >= jobSeq) {
          jobSeq = j.seq + 1;
        }
        pq.push(j);
      }
    }
  }

  return {
    scheduleJob: scheduleJob,
    cancelJob: cancelJob,
    popDueJobs: popDueJobs,
    getJobsForOwner: getJobsForOwner,
    serializeJobs: serializeJobs,
    hydrateJobs: hydrateJobs,
    size: pq.size,
    clear: pq.clear
  };
}

  // --- Module: src/wargame/data/terrain.js ---
// Terrain Catalog, Overworld POI Definitions, Unit Archetypes & Hero Class Recruitment Templates

const OW_TERRAIN_PLAINS = 1;
const OW_TERRAIN_FOREST = 2;
const OW_TERRAIN_HILLS = 3;
const OW_TERRAIN_MOUNTAINS = 4;
const OW_TERRAIN_WATER = 5;
const OW_TERRAIN_FERTILE_VALE = 6;

const OVERWORLD_TERRAIN_DEFS = {
  [OW_TERRAIN_PLAINS]: {
    id: OW_TERRAIN_PLAINS,
    key: 'plains',
    name: 'Sunlit Grasslands',
    symbol: '·',
    color: '#84cc16',
    bgColor: '#15280a',
    borderColor: '#2e4c14',
    marchTimeMs: 3000, // 3.0s per tile at 1x speed (or 10s in marathon ruleset)
    buildable: true,
    passable: true,
    yieldBonus: { food: 1 },
    desc: 'Open fertile grasslands ideal for founding settlements and rapid troop marches.'
  },
  [OW_TERRAIN_FERTILE_VALE]: {
    id: OW_TERRAIN_FERTILE_VALE,
    key: 'fertile_vale',
    name: 'Verdant River Vale',
    symbol: '❀',
    color: '#4ade80',
    bgColor: '#113016',
    borderColor: '#22632d',
    marchTimeMs: 3000,
    buildable: true,
    passable: true,
    yieldBonus: { food: 2, wood: 1 },
    desc: 'Lush alluvial meadow blessed with rich soil—an exceptional site for a primary Bastion.'
  },
  [OW_TERRAIN_FOREST]: {
    id: OW_TERRAIN_FOREST,
    key: 'forest',
    name: 'Elderwood Timberland',
    symbol: '♠',
    color: '#22c55e',
    bgColor: '#0b2414',
    borderColor: '#144426',
    marchTimeMs: 4500,
    buildable: false,
    passable: true,
    resourceType: 'wood',
    harvestAmount: 25,
    desc: 'Dense ancient timber groves. Slows marching units slightly but provides rich lumber.'
  },
  [OW_TERRAIN_HILLS]: {
    id: OW_TERRAIN_HILLS,
    key: 'hills',
    name: 'Granite Highlands',
    symbol: '▲',
    color: '#cbd5e1',
    bgColor: '#222630',
    borderColor: '#384152',
    marchTimeMs: 5500,
    buildable: false,
    passable: true,
    resourceType: 'stone',
    harvestAmount: 25,
    desc: 'Craggy ridges rich in granite and iron seams. High elevation slows transit.'
  },
  [OW_TERRAIN_MOUNTAINS]: {
    id: OW_TERRAIN_MOUNTAINS,
    key: 'mountains',
    name: 'Star-Spire Peaks',
    symbol: '⛰',
    color: '#f1f5f9',
    bgColor: '#333947',
    borderColor: '#4b5563',
    marchTimeMs: Infinity,
    buildable: false,
    passable: false,
    desc: 'Impassable jagged mountain ranges that form natural strategic chokepoints.'
  },
  [OW_TERRAIN_WATER]: {
    id: OW_TERRAIN_WATER,
    key: 'water',
    name: 'Azure Deepwaters',
    symbol: '≈',
    color: '#38bdf8',
    bgColor: '#08263d',
    borderColor: '#0c4a6e',
    marchTimeMs: Infinity,
    buildable: false,
    passable: false,
    desc: 'Deep rivers and lakes impassable to land expeditions.'
  }
};

const OVERWORLD_POI_DEFS = {
  resource_cache: {
    type: 'resource_cache',
    name: 'Pioneer Supply Cache',
    symbol: '📦',
    color: '#fbbf24',
    bgColor: '#451a03',
    desc: 'Abandoned supply wagons containing seasoned timber and cut stone.'
  },
  timber_camp: {
    type: 'timber_camp',
    name: 'Primeval Timber Grove',
    symbol: '🌲',
    color: '#4ade80',
    bgColor: '#064e3b',
    desc: 'High-yield forestry node that boosts city Sawmill output.'
  },
  stone_outcrop: {
    type: 'stone_outcrop',
    name: 'Dwarven Mason Quarry',
    symbol: '⛏️',
    color: '#cbd5e1',
    bgColor: '#1e293b',
    desc: 'Ancient cut-stone quarry rich in structural blocks.'
  },
  dungeon_entrance: {
    type: 'dungeon_entrance',
    name: 'The Starfall Vaults',
    symbol: 'Ω',
    color: '#f87171',
    bgColor: '#450a0a',
    desc: 'Subterranean gateway plunging into the procedural Starfall Vaults. Requires a Hero-led Party.'
  }
};

const UNIT_ARCHETYPES = {
  settler: {
    id: 'settler',
    name: 'Pioneer Settler Expedition',
    shortName: 'Pioneer Settler',
    icon: '🚩',
    color: '#fbbf24',
    visionRadius: 4,
    maxHp: 100,
    canFoundCity: true,
    canEnterDungeon: false,
    desc: 'Foundational pioneer column equipped with tools and provisions to establish a new Bastion City.'
  },
  scout: {
    id: 'scout',
    name: 'Outrider Scout',
    shortName: 'Scout',
    icon: '🦅',
    color: '#34d399',
    visionRadius: 6,
    maxHp: 75,
    canFoundCity: false,
    canEnterDungeon: false,
    desc: 'Swift reconnaissance rider with extended line-of-sight and rapid overworld transit.'
  },
  hero_party: {
    id: 'hero_party',
    name: 'Vanguard Delving Party',
    shortName: 'Hero Party',
    icon: '⚔️',
    color: '#60a5fa',
    visionRadius: 5,
    maxHp: 150,
    canFoundCity: false,
    canEnterDungeon: true,
    desc: 'Armed expedition led by a sworn Adventurers Guild Hero capable of entering subterranean dungeons.'
  }
};

const RECRUITABLE_HERO_CLASSES = [
  {
    classId: 'adventurer',
    name: 'Guild Adventurer',
    title: 'Starfall Delver',
    icon: '🧭',
    color: '#38bdf8',
    costGold: 35,
    costFood: 20,
    baseStats: { str: 12, dex: 12, int: 11, vit: 13, hp: 160, mp: 68, atk: 24, def: 14 },
    specialty: 'Versatile dungeon delver trained at the Adventurers Guild: Torch Flare stun, extra vision, and reinforced mining.'
  },
  {
    classId: 'fighter',
    name: 'Ironclad Fighter',
    title: 'Vanguard Commander',
    icon: '🛡️',
    color: '#f87171',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 15, dex: 10, int: 8, vit: 14, hp: 186, mp: 59, atk: 28, def: 16 },
    specialty: 'Frontline bastion defence, Whirlwind Cleave, and door breaching.'
  },
  {
    classId: 'ranger',
    name: 'Deepwood Ranger',
    title: 'Hawkeye Pathfinder',
    icon: '🏹',
    color: '#34d399',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 12, dex: 15, int: 11, vit: 11, hp: 145, mp: 68, atk: 26, def: 12 },
    specialty: '+2 Overworld Vision, trap disarming, and Starfall Volley.'
  },
  {
    classId: 'mage',
    name: 'Astral Elementalist',
    title: 'Starweaver Adept',
    icon: '✨',
    color: '#60a5fa',
    costGold: 60,
    costFood: 30,
    baseStats: { str: 7, dex: 10, int: 17, vit: 10, hp: 122, mp: 131, atk: 31, def: 10 },
    specialty: 'High-area Starfall Nova and arcane rune-seal dispelling.'
  },
  {
    classId: 'thief',
    name: 'Shadowblade Rogue',
    title: 'Silent Infiltrator',
    icon: '🗡️',
    color: '#c084fc',
    costGold: 50,
    costFood: 30,
    baseStats: { str: 9, dex: 16, int: 11, vit: 10, hp: 130, mp: 78, atk: 27, def: 11 },
    specialty: 'Master lockpicking, secret door discovery, and Shadowstep Strike.'
  },
  {
    classId: 'cleric',
    name: 'Acolyte Cleric',
    title: 'Temple Devotee',
    icon: '✝️',
    color: '#fef08a',
    costGold: 55,
    costFood: 30,
    baseStats: { str: 10, dex: 9, int: 15, vit: 13, hp: 162, mp: 105, atk: 22, def: 15 },
    specialty: 'Entry-level Temple Chapterhouse healer, blessing wards, and undead turning.'
  },
  {
    classId: 'paladin',
    name: 'Radiant Crusader',
    title: 'Dawn Warden',
    icon: '☀️',
    color: '#fbbf24',
    costGold: 65,
    costFood: 35,
    baseStats: { str: 14, dex: 9, int: 12, vit: 15, hp: 195, mp: 86, atk: 27, def: 20 },
    specialty: 'Temple Chapterhouse Tier-2 Champion: Aura of Radiance, Holy Smite, and Divine Intervention.'
  }
];

const OVERWORLD_DUNGEON_CATALOG = [
  {
    poiId: 'poi_dungeon_starfall',
    dungeonId: 'dng_starfall',
    profileId: 'starfall_vaults',
    name: 'The Starfall Vaults',
    recommendedLevel: 1,
    accentColor: '#f87171',
    offsetDx: 5,
    offsetDy: -3,
    desc: 'Ancient dwarven subterranean catacombs scarred by the meteor Vespera.'
  },
  {
    poiId: 'poi_dungeon_quarry',
    dungeonId: 'dng_quarry',
    profileId: 'copper_quarry',
    name: 'Sunken Copper Quarry',
    recommendedLevel: 1,
    accentColor: '#fb923c',
    offsetDx: -9,
    offsetDy: 5,
    desc: 'Flooded excavation shafts rich in surface copper and iron veins.'
  },
  {
    poiId: 'poi_dungeon_mycelium',
    dungeonId: 'dng_mycelium',
    profileId: 'mycelium_labyrinth',
    name: 'Whispering Mycelium Labyrinth',
    recommendedLevel: 3,
    accentColor: '#34d399',
    offsetDx: 12,
    offsetDy: 7,
    desc: 'Bioluminescent fungal caverns teeming with ambush predators and geodes.'
  },
  {
    poiId: 'poi_dungeon_molten',
    dungeonId: 'dng_molten',
    profileId: 'molten_crucible',
    name: 'The Molten Forgeworks',
    recommendedLevel: 5,
    accentColor: '#f97316',
    offsetDx: -14,
    offsetDy: -9,
    desc: 'Blazing basalt foundries guarded by dwarven automatons and magma golems.'
  }
];

const OVERWORLD_HOSTILE_ARCHETYPES = {
  raider_pack: {
    id: 'raider_pack',
    name: 'Starfall Raiding Pack',
    icon: '🐺',
    level: 1,
    power: 16,
    maxHp: 58,
    rewardGold: 20,
    rewardOre: 4,
    rewardXp: 25,
    color: '#f87171'
  },
  brood_swarm: {
    id: 'brood_swarm',
    name: 'Feral Brood Skitterers',
    icon: '🕷️',
    level: 1,
    power: 20,
    maxHp: 70,
    rewardGold: 25,
    rewardOre: 5,
    rewardXp: 35,
    color: '#fb923c'
  },
  cultist_patrol: {
    id: 'cultist_patrol',
    name: 'Astral Cultist Patrol',
    icon: '💀',
    level: 2,
    power: 28,
    maxHp: 105,
    rewardGold: 45,
    rewardOre: 10,
    rewardXp: 60,
    color: '#c084fc'
  }
};

  // --- Module: src/engine/rng.js ---
// Deterministic Seeded PRNG (Mulberry32) & Seed String Hashing

function hashSeedString(seedStr, salt = 0) {
  const str = String(seedStr || 'STAR-1000') + ':' + String(salt);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function createSeededRng(numericSeed) {
  let state = (numericSeed >>> 0) || 1;
  return function nextRand() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeedCode(prefix = 'STAR') {
  const num = 1000 + Math.floor(Math.random() * 8999);
  return `${prefix}-${num}`;
}

  // --- Module: src/wargame/engine/pathfinding.js ---
// A* Terrain-Weighted Pathfinding & Overworld Procedural Generation Engine




function generateOverworldMap(width = OVERWORLD_MAP_W, height = OVERWORLD_MAP_H, seedCode = 'STAR-7777') {
  const numSeed = typeof seedCode === 'number' ? seedCode : hashSeedString(String(seedCode), 404);
  const rng = createSeededRng(numSeed);

  const tiles = [];
  const explored = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    const expRow = [];
    for (let x = 0; x < width; x++) {
      expRow.push(false);

      // Outer border is impassable Star-Spire Mountains
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push(OW_TERRAIN_MOUNTAINS);
        continue;
      }

      const nx = x / width;
      const ny = y / height;
      const distCenter = Math.hypot(nx - 0.5, ny - 0.5);
      const r = rng();

      if (distCenter > 0.43 && r < 0.65) {
        row.push(r < 0.35 ? OW_TERRAIN_MOUNTAINS : OW_TERRAIN_HILLS);
      } else if (distCenter > 0.30 && r < 0.32) {
        row.push(OW_TERRAIN_HILLS);
      } else if (r < 0.22) {
        row.push(OW_TERRAIN_FOREST);
      } else if (r < 0.28) {
        row.push(OW_TERRAIN_HILLS);
      } else if (r < 0.33 && ny > 0.58) {
        row.push(OW_TERRAIN_WATER);
      } else if (r > 0.90) {
        row.push(OW_TERRAIN_FERTILE_VALE);
      } else {
        row.push(OW_TERRAIN_PLAINS);
      }
    }
    tiles.push(row);
    explored.push(expRow);
  }

  // Carve fertile pioneer starting valley near center
  const spawnX = Math.floor(width / 2);
  const spawnY = Math.floor(height / 2);

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const ty = spawnY + dy;
      const tx = spawnX + dx;
      if (ty > 0 && ty < height - 1 && tx > 0 && tx < width - 1) {
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          tiles[ty][tx] = OW_TERRAIN_FERTILE_VALE;
        } else {
          tiles[ty][tx] = OW_TERRAIN_PLAINS;
        }
      }
    }
  }

  // Guarantee accessible forest & hills near starting basin
  tiles[spawnY - 2][spawnX - 2] = OW_TERRAIN_FOREST;
  tiles[spawnY - 2][spawnX - 1] = OW_TERRAIN_FOREST;
  tiles[spawnY + 2][spawnX + 2] = OW_TERRAIN_HILLS;
  tiles[spawnY + 2][spawnX + 1] = OW_TERRAIN_HILLS;

  // Points of Interest (Resource Caches, Timber Camps, Quarries, and Dungeon Entrances)
  const pois = [
    {
      id: 'poi_cache_1',
      type: 'resource_cache',
      name: 'Pioneer Supply Cache',
      x: spawnX - 2,
      y: spawnY,
      depleted: false,
      yield: { wood: 35, stone: 25, food: 20 }
    },
    {
      id: 'poi_timber_1',
      type: 'timber_camp',
      name: 'Elderwood Timber Grove',
      x: spawnX - 3,
      y: spawnY - 2,
      depleted: false,
      yield: { wood: 45 }
    },
    {
      id: 'poi_quarry_1',
      type: 'stone_outcrop',
      name: 'Dwarven Mason Quarry',
      x: spawnX + 3,
      y: spawnY + 2,
      depleted: false,
      yield: { stone: 45 }
    }
  ];

  // Register curated Dungeon Entrance POIs across the Overworld frontier
  const dngCatalog = OVERWORLD_DUNGEON_CATALOG || [];
  for (let d = 0; d < dngCatalog.length; d++) {
    const def = dngCatalog[d];
    const px = Math.max(2, Math.min(width - 3, spawnX + def.offsetDx));
    const py = Math.max(2, Math.min(height - 3, spawnY + def.offsetDy));
    pois.push({
      id: def.poiId,
      type: 'dungeon_entrance',
      name: def.name,
      dungeonId: def.dungeonId,
      profileId: def.profileId,
      recommendedLevel: def.recommendedLevel || 1,
      accentColor: def.accentColor || '#f87171',
      x: px,
      y: py,
      discovered: false,
      depleted: false
    });
  }

  // Ensure all POIs sit on passable terrain and have a clear path from spawn
  for (let i = 0; i < pois.length; i++) {
    const p = pois[i];
    if (tiles[p.y] && (tiles[p.y][p.x] === OW_TERRAIN_MOUNTAINS || tiles[p.y][p.x] === OW_TERRAIN_WATER)) {
      tiles[p.y][p.x] = OW_TERRAIN_PLAINS;
    }
  }

  // Spawn deterministic Overworld Wandering Hostiles outside the safe starting basin (radius >= 5)
  const hostiles = [];
  const hostileKeys = Object.keys(OVERWORLD_HOSTILE_ARCHETYPES || {});
  const hostilePlacements = [
    { dx: 3,   dy: -2,  archId: 'raider_pack' },
    { dx: -6,  dy: 3,   archId: 'brood_swarm' },
    { dx: 8,   dy: 4,   archId: 'raider_pack' },
    { dx: -8,  dy: -5,  archId: 'cultist_patrol' },
    { dx: 10,  dy: -6,  archId: 'brood_swarm' },
    { dx: -11, dy: 7,   archId: 'cultist_patrol' }
  ];
  for (let h = 0; h < hostilePlacements.length; h++) {
    const hp = hostilePlacements[h];
    const hx = Math.max(2, Math.min(width - 3, spawnX + hp.dx));
    const hy = Math.max(2, Math.min(height - 3, spawnY + hp.dy));
    // Never overlap spawn or any POI
    const overlapsPoi = pois.some(function(p) { return p.x === hx && p.y === hy; });
    if (overlapsPoi) continue;
    if (tiles[hy] && (tiles[hy][hx] === OW_TERRAIN_MOUNTAINS || tiles[hy][hx] === OW_TERRAIN_WATER)) {
      tiles[hy][hx] = OW_TERRAIN_PLAINS;
    }
    const arch = OVERWORLD_HOSTILE_ARCHETYPES[hp.archId] || OVERWORLD_HOSTILE_ARCHETYPES[hostileKeys[0]];
    if (!arch) continue;
    hostiles.push({
      id: 'ow_hostile_' + (h + 1),
      archetypeId: arch.id,
      name: arch.name,
      icon: arch.icon,
      color: arch.color || '#f87171',
      level: arch.level || 1,
      power: arch.power || 18,
      hp: arch.maxHp || 60,
      maxHp: arch.maxHp || 60,
      rewardGold: arch.rewardGold || 20,
      rewardOre: arch.rewardOre || 4,
      rewardXp: arch.rewardXp || 25,
      x: hx,
      y: hy,
      homeX: hx,
      homeY: hy,
      alive: true
    });
  }

  // Spawn ONLY the Pioneer Settler unit initially (NO Dungeon Hero exists yet!)
  const settlerArch = UNIT_ARCHETYPES.settler;
  const settlerUnit = {
    id: 'unit_settler_1',
    name: settlerArch.name,
    shortName: settlerArch.shortName,
    unitType: 'settler',
    x: spawnX,
    y: spawnY,
    hp: settlerArch.maxHp,
    maxHp: settlerArch.maxHp,
    visionRadius: settlerArch.visionRadius,
    canFoundCity: true,
    canEnterDungeon: false,
    alive: true,
    status: 'idle', // 'idle' | 'marching' | 'settled'
    cargo: null,
    marchPlan: null
  };

  const ow = {
    width: width,
    height: height,
    seedCode: String(seedCode),
    spawnX: spawnX,
    spawnY: spawnY,
    tiles: tiles,
    explored: explored,
    pois: pois,
    hostiles: hostiles,
    units: [settlerUnit],
    selectedUnitId: settlerUnit.id
  };

  revealOverworldVision(ow, spawnX, spawnY, settlerUnit.visionRadius);

  return ow;
}

function revealOverworldVision(overworld, cx, cy, radius = 4) {
  if (!overworld || !overworld.explored) return;
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const y = cy + dy;
      const x = cx + dx;
      if (y >= 0 && y < overworld.height && x >= 0 && x < overworld.width) {
        if (Math.hypot(dx, dy) <= radius + 0.35) {
          overworld.explored[y][x] = true;
        }
      }
    }
  }
}

function isOverworldTilePassable(overworld, x, y) {
  if (!overworld || !overworld.tiles) return false;
  if (x < 0 || x >= overworld.width || y < 0 || y >= overworld.height) return false;
  const tId = overworld.tiles[y][x];
  const tDef = OVERWORLD_TERRAIN_DEFS[tId];
  return Boolean(tDef && tDef.passable);
}

function getOverworldTileMarchCostMs(overworld, x, y) {
  if (!overworld || !overworld.tiles) return 3000;
  if (x < 0 || x >= overworld.width || y < 0 || y >= overworld.height) return Infinity;
  const tId = overworld.tiles[y][x];
  const tDef = OVERWORLD_TERRAIN_DEFS[tId];
  return tDef ? tDef.marchTimeMs : 3000;
}

// Terrain-weighted A* Pathfinding on the Overworld Grid
function findOverworldPath(overworld, startX, startY, targetX, targetY, maxNodes = 2500) {
  if (!overworld || !overworld.tiles) return null;
  if (startX === targetX && startY === targetY) return [];
  if (!isOverworldTilePassable(overworld, targetX, targetY)) return null;

  const w = overworld.width;
  const h = overworld.height;
  const startKey = startY * w + startX;
  const targetKey = targetY * w + targetX;

  const gScore = {};
  const fScore = {};
  const cameFrom = {};
  const closed = {};

  gScore[startKey] = 0;
  fScore[startKey] = (Math.abs(targetX - startX) + Math.abs(targetY - startY)) * 3000;

  const openList = [startKey];
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
  ];

  let visited = 0;
  while (openList.length > 0 && visited < maxNodes) {
    visited++;

    // Find node with lowest fScore
    let bestIdx = 0;
    let bestKey = openList[0];
    let bestF = fScore[bestKey] !== undefined ? fScore[bestKey] : Infinity;
    for (let i = 1; i < openList.length; i++) {
      const k = openList[i];
      const fk = fScore[k] !== undefined ? fScore[k] : Infinity;
      if (fk < bestF) {
        bestF = fk;
        bestKey = k;
        bestIdx = i;
      }
    }

    openList.splice(bestIdx, 1);

    if (bestKey === targetKey) {
      // Reconstruct path (excluding start tile)
      const path = [];
      let curr = targetKey;
      while (curr !== startKey) {
        const px = curr % w;
        const py = Math.floor(curr / w);
        path.push({
          x: px,
          y: py,
          stepDurationMs: getOverworldTileMarchCostMs(overworld, px, py)
        });
        curr = cameFrom[curr];
      }
      path.reverse();
      return path;
    }

    closed[bestKey] = true;
    const cx = bestKey % w;
    const cy = Math.floor(bestKey / w);
    const curG = gScore[bestKey];

    for (let d = 0; d < dirs.length; d++) {
      const nx = cx + dirs[d].dx;
      const ny = cy + dirs[d].dy;
      if (!isOverworldTilePassable(overworld, nx, ny)) continue;

      const nKey = ny * w + nx;
      if (closed[nKey]) continue;

      const stepCost = getOverworldTileMarchCostMs(overworld, nx, ny);
      const tentativeG = curG + stepCost;

      if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
        cameFrom[nKey] = bestKey;
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + (Math.abs(targetX - nx) + Math.abs(targetY - ny)) * 3000;
        if (openList.indexOf(nKey) === -1) {
          openList.push(nKey);
        }
      }
    }
  }

  return null;
}

  // --- Module: src/wargame/data/tasks.js ---
// Reactive Event-Driven Guided Tasks & Campaign Milestones DAG (Directed Acyclic Graph)
// Tasks subscribe to STREAM_TOPICS and transition: LOCKED -> AVAILABLE -> COMPLETED -> CLAIMED


const CAMPAIGN_TASKS_DAG = [
  {
    id: 'task_scout_wilderness',
    title: '1. Pioneer Reconnaissance',
    category: 'exploration',
    prerequisites: [],
    triggerTopics: [STREAM_TOPICS.UNIT_MARCH_STEP, STREAM_TOPICS.UNIT_MARCH_COMPLETED, STREAM_TOPICS.CITY_FOUNDED],
    desc: 'March your Pioneer Settler across the Overworld to survey the surrounding frontier (move at least 2 tiles).',
    rewardLabel: '+40 Wood, +30 Food',
    reward: { wood: 40, food: 30 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 2 };
      const steps = state.world.stats.totalUnitSteps || 0;
      const cityCount = Object.keys(state.world.cities || {}).length;
      const prog = cityCount > 0 ? 2 : Math.min(2, steps);
      return { completed: prog >= 2, progress: prog, target: 2 };
    }
  },
  {
    id: 'task_found_first_city',
    title: '2. Found Your Settlement',
    category: 'settlement',
    prerequisites: [],
    triggerTopics: [STREAM_TOPICS.CITY_FOUNDED],
    desc: 'Position your Pioneer Settler on a fertile site and establish your initial settlement with its Meeting Hall.',
    rewardLabel: '+60 Wood, +60 Stone, +50 Gold',
    reward: { wood: 60, stone: 60, gold: 50 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 1 };
      const count = Object.keys(state.world.cities || {}).length;
      return { completed: count >= 1, progress: Math.min(1, count), target: 1 };
    }
  },
  {
    id: 'task_build_first_hut',
    title: '3. Expand the Settlement',
    category: 'civic',
    prerequisites: ['task_found_first_city'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Now that you founded your first city, you have to grow it. Build a Hut to attract more people.',
    rewardLabel: '+40 Wood, +30 Food',
    reward: { wood: 40, food: 30 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const c = cities[i];
        const hasHut = (c.plots || []).some(function(p) { return p.buildingId === 'hut' && (p.level || 0) >= 1; }) ||
                       ((c.buildings && c.buildings.hut) || 0) >= 1;
        if (hasHut) return { completed: true, progress: 1, target: 1 };
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_garden',
    title: '4. Cultivate Food',
    category: 'economy',
    prerequisites: ['task_build_first_hut'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'As population grows, demands on food increase. Construct a Garden to produce food and prevent starvation.',
    rewardLabel: '+40 Wood, +30 Stone',
    reward: { wood: 40, stone: 30 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if ((b.garden && b.garden >= 1) || (b.farmstead && b.farmstead >= 1)) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_well',
    title: '5. Fresh Water Supply',
    category: 'civic',
    prerequisites: ['task_build_garden'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Dig a Well to supply clean drinking water for your citizens and support growth.',
    rewardLabel: '+30 Wood, +40 Stone, +20 Gold',
    reward: { wood: 30, stone: 40, gold: 20 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.well && b.well >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_grow_population_12',
    title: '6. Frontier Growth',
    category: 'civic',
    prerequisites: ['task_build_well'],
    triggerTopics: [STREAM_TOPICS.RESOURCE_TICK, STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Build additional Huts and keep food and water stocked to grow your population to 12 citizens.',
    rewardLabel: '+50 Wood, +50 Stone',
    reward: { wood: 50, stone: 50 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 12 };
      const cities = Object.values(state.world.cities);
      let maxCurrent = 5;
      for (let i = 0; i < cities.length; i++) {
        const pop = cities[i].population ? cities[i].population.current : 5;
        if (pop > maxCurrent) maxCurrent = pop;
      }
      const prog = Math.min(12, maxCurrent);
      return { completed: prog >= 12, progress: prog, target: 12 };
    }
  },
  {
    id: 'task_build_lumber_camp',
    title: '7. Timber Industry',
    category: 'economy',
    prerequisites: ['task_grow_population_12'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'With 12 citizens in town, construct a Lumber Camp to supply sturdy construction timber.',
    rewardLabel: '+60 Wood, +40 Stone',
    reward: { wood: 60, stone: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if ((b.lumber_camp && b.lumber_camp >= 1) || (b.lumber_hut && b.lumber_hut >= 1) || (b.sawmill && b.sawmill >= 1)) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_quarry',
    title: '8. Stone Quarrying',
    category: 'economy',
    prerequisites: ['task_build_lumber_camp'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Grow population to 15 and construct a Quarry to cut heavy granite stone blocks.',
    rewardLabel: '+50 Wood, +60 Stone, +40 Gold',
    reward: { wood: 50, stone: 60, gold: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.quarry && b.quarry >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_guild_hall',
    title: '9. Charter the Adventurers Guild',
    category: 'military',
    prerequisites: ['task_build_quarry'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Grow population to 20 and construct the Adventurers Guild to unlock Hero recruitment.',
    rewardLabel: '+100 Gold, +50 Food (Unlocks Heroes)',
    reward: { gold: 100, food: 50 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.guild_hall && b.guild_hall >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_recruit_first_hero',
    title: '10. Swear In Your First Hero',
    category: 'military',
    prerequisites: ['task_build_guild_hall'],
    triggerTopics: [STREAM_TOPICS.HERO_RECRUITED, STREAM_TOPICS.PARTY_FORMED],
    desc: 'Recruit your first Hero at the Adventurers Guild to lead expeditionary parties.',
    rewardLabel: '+75 Gold, +40 Wood, +40 Stone',
    reward: { gold: 75, wood: 40, stone: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !Array.isArray(state.world.heroes)) {
        return { completed: false, progress: 0, target: 1 };
      }
      const count = state.world.heroes.length;
      return { completed: count >= 1, progress: Math.min(1, count), target: 1 };
    }
  },
  {
    id: 'task_march_to_dungeon',
    title: '11. March to the Starfall Vaults',
    category: 'delve',
    prerequisites: ['task_recruit_first_hero'],
    triggerTopics: [STREAM_TOPICS.UNIT_MARCH_STEP, STREAM_TOPICS.UNIT_MARCH_COMPLETED, STREAM_TOPICS.DUNGEON_ENTERED],
    desc: 'March your Hero Party across the Overworld to the Starfall Vaults entrance (Ω) and breach the subterranean gates.',
    rewardLabel: '+150 Gold, Campaign Milestone Complete',
    reward: { gold: 150 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 1 };
      if (state.world.stats && state.world.stats.dungeonsEntered > 0) {
        return { completed: true, progress: 1, target: 1 };
      }
      const pois = (state.world.overworld && state.world.overworld.pois) || [];
      const dngPoi = pois.find(function(p) { return p.type === 'dungeon_entrance'; });
      const units = (state.world.overworld && state.world.overworld.units) || [];
      if (dngPoi) {
        for (let i = 0; i < units.length; i++) {
          const u = units[i];
          if (u.alive && u.unitType === 'hero_party' && u.status !== 'marching' && u.x === dngPoi.x && u.y === dngPoi.y) {
            return { completed: true, progress: 1, target: 1 };
          }
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_return_with_spoils',
    title: '12. Return With Dungeon Spoils',
    category: 'delve',
    prerequisites: ['task_march_to_dungeon'],
    triggerTopics: [STREAM_TOPICS.EXPEDITION_BANKED, STREAM_TOPICS.DUNGEON_RETURNED],
    desc: 'Extract from a Dungeon Vault and complete the return march to bank your expedition spoils at Oakhaven Bastion.',
    rewardLabel: '+200 Gold, +40 Ore',
    reward: { gold: 200, ore: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.stats) return { completed: false, progress: 0, target: 1 };
      const banked = state.world.stats.expeditionsBanked || 0;
      return { completed: banked >= 1, progress: Math.min(1, banked), target: 1 };
    }
  }
];

  // --- Module: src/wargame/engine/taskEngine.js ---
// Reactive Task & Milestone DAG Engine
// Subscribes to WorldEventStream, evaluates task prerequisites & predicates, and manages reward claims.



function createInitialTasksState() {
  const map = {};
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const isRoot = !tDef.prerequisites || tDef.prerequisites.length === 0;
    map[tDef.id] = {
      id: tDef.id,
      status: isRoot ? 'available' : 'locked', // 'locked' | 'available' | 'completed' | 'claimed'
      progress: 0,
      target: 1,
      completedAtSimMs: null,
      claimedAtSimMs: null
    };
  }
  return map;
}

function evaluateTaskDAG(state, eventStream) {
  if (!state || !state.world) return [];
  if (!state.world.tasks) {
    state.world.tasks = createInitialTasksState();
  }

  const tasksState = state.world.tasks;
  const simTimeMs = state.world.clock ? state.world.clock.simTimeMs : 0;

  // Pass 1: Unlock tasks whose prerequisites are completed or claimed
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    if (!tasksState[tDef.id]) {
      tasksState[tDef.id] = {
        id: tDef.id,
        status: 'locked',
        progress: 0,
        target: 1,
        completedAtSimMs: null,
        claimedAtSimMs: null
      };
    }

    const entry = tasksState[tDef.id];
    if (entry.status === 'locked') {
      const prereqs = tDef.prerequisites || [];
      let allMet = true;
      for (let p = 0; p < prereqs.length; p++) {
        const preEntry = tasksState[prereqs[p]];
        if (!preEntry || (preEntry.status !== 'completed' && preEntry.status !== 'claimed')) {
          allMet = false;
          break;
        }
      }
      if (allMet) {
        entry.status = 'available';
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.TASK_UNLOCKED, {
            taskId: tDef.id,
            title: tDef.title
          }, simTimeMs);
        }
      }
    }
  }

  // Pass 2: Evaluate progress & completion for all unlocked tasks
  let newlyCompleted = false;
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const entry = tasksState[tDef.id];
    if (entry.status === 'locked') continue;

    const evalRes = tDef.evaluate(state);
    const prevProgress = entry.progress;
    entry.progress = evalRes.progress;
    entry.target = evalRes.target;

    if (entry.status === 'available') {
      if (evalRes.completed) {
        entry.status = 'completed';
        entry.completedAtSimMs = simTimeMs;
        newlyCompleted = true;
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.TASK_COMPLETED, {
            taskId: tDef.id,
            title: tDef.title,
            rewardLabel: tDef.rewardLabel
          }, simTimeMs);
        }
      } else if (entry.progress !== prevProgress && eventStream) {
        eventStream.publish(STREAM_TOPICS.TASK_PROGRESS, {
          taskId: tDef.id,
          title: tDef.title,
          progress: entry.progress,
          target: entry.target
        }, simTimeMs);
      }
    }
  }

  // If a task completed, run one more unlock check so downstream tasks immediately unlock
  if (newlyCompleted) {
    for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
      const tDef = CAMPAIGN_TASKS_DAG[i];
      const entry = tasksState[tDef.id];
      if (entry.status === 'locked') {
        const prereqs = tDef.prerequisites || [];
        let allMet = true;
        for (let p = 0; p < prereqs.length; p++) {
          const preEntry = tasksState[prereqs[p]];
          if (!preEntry || (preEntry.status !== 'completed' && preEntry.status !== 'claimed')) {
            allMet = false;
            break;
          }
        }
        if (allMet) {
          entry.status = 'available';
          const evalRes = tDef.evaluate(state);
          entry.progress = evalRes.progress;
          entry.target = evalRes.target;
          if (evalRes.completed) {
            entry.status = 'completed';
            entry.completedAtSimMs = simTimeMs;
          }
          if (eventStream) {
            eventStream.publish(STREAM_TOPICS.TASK_UNLOCKED, {
              taskId: tDef.id,
              title: tDef.title
            }, simTimeMs);
          }
        }
      }
    }
  }

  return getFormattedTasksList(state);
}

function getFormattedTasksList(state) {
  if (!state || !state.world || !state.world.tasks) return [];
  const tasksState = state.world.tasks;
  const list = [];

  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const entry = tasksState[tDef.id] || { status: 'locked', progress: 0, target: 1 };
    list.push({
      id: tDef.id,
      title: tDef.title,
      desc: tDef.desc,
      category: tDef.category,
      prerequisites: tDef.prerequisites || [],
      rewardLabel: tDef.rewardLabel,
      reward: tDef.reward,
      status: entry.status,
      progress: entry.progress,
      target: entry.target,
      readyToClaim: entry.status === 'completed'
    });
  }

  return list;
}

  // --- Module: src/wargame/data/buildings.js ---
// City Building Definitions, Paced Tier 1 Catalog, Construction Costs & Doubling Build Durations

const CITY_BUILDINGS_CATALOG = {
  // ---------------------------------------------------------------------------
  // 1. CIVIC STRUCTURES
  // ---------------------------------------------------------------------------
  meeting_hall: {
    id: 'meeting_hall',
    name: 'Meeting Hall',
    icon: '🏛️',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central administration hall of your settlement. Governs town decisions and sets the maximum level cap for all structures.'
  },
  town_hall: {
    id: 'town_hall',
    name: 'Meeting Hall',
    icon: '🏛️',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { food: 1, wood: 1, stone: 1, gold: 1, water: 1 },
    desc: 'The central administration hall of your settlement. Governs town decisions and sets the maximum level cap for all structures.'
  },
  hut: {
    id: 'hut',
    name: 'Hut',
    icon: '🛖',
    category: 'civic',
    color: '#e2e8f0',
    maxLevel: 5,
    baseBuildTimeMs: 3000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    providesPopulation: 5,
    requires: { meeting_hall: 1 },
    desc: 'Provides shelter for citizens. Each Hut expands the town\'s maximum population by +5.'
  },
  well: {
    id: 'well',
    name: 'Well',
    icon: '🪣',
    category: 'civic',
    color: '#38bdf8',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 10, stone: 20, gold: 0 },
    productionPerTick: { water: 5 },
    requires: { meeting_hall: 1, garden: 1 },
    desc: 'Draws fresh drinking water to sustain your citizens and prevent dehydration.'
  },

  // ---------------------------------------------------------------------------
  // 2. RESOURCE & INDUSTRY STRUCTURES
  // ---------------------------------------------------------------------------
  garden: {
    id: 'garden',
    name: 'Garden',
    icon: '🌱',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 6 },
    requires: { meeting_hall: 1, hut: 1 },
    desc: 'Grows vegetables and staple crops to feed your population and prevent starvation.'
  },
  farmstead: {
    id: 'farmstead',
    name: 'Garden',
    icon: '🌱',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 6 },
    requires: { meeting_hall: 1, hut: 1 },
    desc: 'Grows vegetables and staple crops to feed your population and prevent starvation.'
  },
  lumber_camp: {
    id: 'lumber_camp',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1, well: 1 },
    requiredPopulation: 12,
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  lumber_hut: {
    id: 'lumber_hut',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1, well: 1 },
    requiredPopulation: 12,
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  sawmill: {
    id: 'sawmill',
    name: 'Lumber Camp',
    icon: '🪓',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 15, stone: 10, gold: 0 },
    productionPerTick: { wood: 6 },
    requires: { meeting_hall: 1 },
    desc: 'Fells and cuts seasoned timber to supply construction materials for the town.'
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    icon: '⛏️',
    category: 'economy',
    color: '#cbd5e1',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 20, stone: 15, gold: 0 },
    productionPerTick: { stone: 6 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    requiredPopulation: 15,
    desc: 'Extracts granite and stone blocks for sturdy construction and guild halls.'
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    icon: '🪨',
    category: 'economy',
    color: '#a78bfa',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 5 },
    productionPerTick: { ore: 4 },
    requires: { meeting_hall: 1, quarry: 1 },
    desc: 'Extracts iron and veins of star-metal for tool crafting and forging.'
  },

  // ---------------------------------------------------------------------------
  // 3. STORAGE DEPOTS
  // ---------------------------------------------------------------------------
  silo: {
    id: 'silo',
    name: 'Silo',
    icon: '🏺',
    category: 'storage',
    color: '#fdba74',
    maxLevel: 5,
    baseBuildTimeMs: 4000,
    baseCost: { wood: 25, stone: 25, gold: 0 },
    storageBonus: { food: 200 },
    requires: { meeting_hall: 1, garden: 1 },
    desc: 'Sealed storage tower that increases food storage capacity by +200 per level.'
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    icon: '📦',
    category: 'storage',
    color: '#94a3b8',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 30, stone: 30, gold: 0 },
    storageBonus: { wood: 200, stone: 200, ore: 200, ingots: 100 },
    inventorySlotBonus: 50,
    interiorAssetId: 'city_interior_warehouse_default_static',
    facilities: {
      storage: { slotBonusPerLevel: 50 }
    },
    requires: { meeting_hall: 1, lumber_camp: 1, quarry: 1 },
    desc: 'Dry storage depot that expands wood/stone/ore caps by +200 and City Vault Storage by +50 item slots per level.'
  },
  smeltery: {
    id: 'smeltery',
    name: 'Dwarven Smeltery',
    icon: '🔥',
    category: 'resource',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 35, stone: 45, gold: 20 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_smeltery_default_static',
    facilities: {
      smelting: { oreCost: 5, woodCost: 5, ingotYield: 2 }
    },
    desc: 'High-heat furnace refining raw dungeon ores and timber into Forged Ingots for Tier 2 gear and buildings.'
  },
  apothecary: {
    id: 'apothecary',
    name: 'Alchemist Apothecary',
    icon: '🧪',
    category: 'civic',
    color: '#34d399',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 30, gold: 25 },
    requires: { meeting_hall: 1, garden: 1, well: 1 },
    interiorAssetId: 'city_interior_apothecary_default_static',
    facilities: {
      brewing: true
    },
    desc: 'Alchemical workshop brewing Healing Tonics and scribing Astral Recall Scrolls to provision Hero Parties.'
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith & Star-Forge',
    icon: '🔨',
    category: 'military',
    color: '#fb923c',
    maxLevel: 5,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 40, stone: 50, gold: 30 },
    requires: { meeting_hall: 1, smeltery: 1 },
    interiorAssetId: 'city_interior_blacksmith_default_static',
    facilities: {
      blacksmithing: true
    },
    desc: 'Master forge crafting weapons, armor, and pickaxes from Forged Ingots and tempering gear affixes. Higher levels forge rarer socketed gear.'
  },
  lapidary: {
    id: 'lapidary',
    name: 'Lapidary Workshop',
    icon: '💎',
    category: 'arcane',
    color: '#a78bfa',
    maxLevel: 5,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 35, stone: 45, gold: 35 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_lapidary_default_static',
    facilities: {
      lapidary: true
    },
    desc: 'Jewelcrafter bench for punching Gem Sockets into equipment and socketing or extracting Astral Gems.'
  },

  // ---------------------------------------------------------------------------
  // 4. SYNERGY STRUCTURES
  // ---------------------------------------------------------------------------
  windmill: {
    id: 'windmill',
    name: 'Windmill',
    icon: '💨',
    category: 'synergy',
    color: '#e879f9',
    maxLevel: 3,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 25, gold: 10 },
    adjacencyBonus: { ratio: 0.20, targets: ['garden', 'farmstead', 'mine', 'lumber_camp', 'lumber_hut', 'sawmill', 'quarry'] },
    requires: { meeting_hall: 1, garden: 1, lumber_camp: 1 },
    desc: 'Harnesses wind energy to boost productivity of adjacent Gardens, Mines, and Lumber Camps by +20%.'
  },

  // ---------------------------------------------------------------------------
  // 5. MILITARY & TRAINING
  // ---------------------------------------------------------------------------
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 35, stone: 30, gold: 15 },
    troopCapacityBonus: 10,
    requires: { meeting_hall: 1, guild_hall: 1 },
    desc: 'Quarters for standing garrisons. Increases maximum troop limit by +10 per level.'
  },
  fighter_camp: {
    id: 'fighter_camp',
    name: 'Fighter Camp',
    icon: '🎯',
    category: 'military',
    color: '#f43f5e',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 20, gold: 10 },
    trainingSpeedBonus: 0.25,
    requires: { meeting_hall: 1, barracks: 1 },
    desc: 'Drills combat recruits to accelerate troop recruitment and training speed.'
  },

  // ---------------------------------------------------------------------------
  // 6. GUILDS & SANCTUARIES
  // ---------------------------------------------------------------------------
  guild_hall: {
    id: 'guild_hall',
    name: 'Adventurers Guild',
    icon: '⚔️',
    category: 'military',
    color: '#60a5fa',
    maxLevel: 3,
    baseBuildTimeMs: 6000,
    baseCost: { wood: 40, stone: 40, gold: 25 },
    productionPerTick: { gold: 2 },
    requires: { meeting_hall: 1, quarry: 1 },
    requiredPopulation: 20,
    recruits: ['adventurer'],
    interiorAssetId: 'city_interior_adventurers_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'adventurer', minLevel: 1 }] },
      questBoard: { domain: 'adventurers' },
      training: { domain: 'adventurers' },
      research: { domain: 'adventurers' },
      shop: { catalogId: 'shop_adventurers' }
    },
    desc: 'Guild dedicated to the Adventurer class & dungeon delving: recruits Adventurers, hosts dungeon quests, training, research, and delve-gear shop.'
  },
  garrison: {
    id: 'garrison',
    name: 'City Garrison',
    icon: '🏰',
    category: 'military',
    color: '#fb923c',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 45, stone: 45, gold: 30 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    interiorAssetId: 'city_interior_garrison_default_static',
    facilities: {
      partyManagement: { baseBonus: 1 }
    },
    desc: 'Command headquarters for forming multi-hero Parties. Each Garrison level increases maximum Heroes per Party by +1.'
  },
  temple_chapterhouse: {
    id: 'temple_chapterhouse',
    name: 'Temple Chapterhouse',
    icon: '⛪',
    category: 'arcane',
    color: '#fef08a',
    maxLevel: 5,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 40, stone: 55, gold: 35 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    interiorAssetId: 'city_interior_temple_chapterhouse_default_static',
    facilities: {
      recruitment: {
        classes: [
          { classId: 'cleric',  minLevel: 1 },
          { classId: 'paladin', minLevel: 2 }
        ]
      },
      questBoard: { domain: 'temple' },
      training:   { domain: 'temple' },
      research:   { domain: 'temple' },
      shop:       { catalogId: 'shop_temple_exclusive' }
    },
    desc: 'Sacred sanctuary recruiting Clerics (Lv 1) and Paladins (Lv 2+), with holy quests, training, research, and exclusive temple relics.'
  },
  fighters_guild: {
    id: 'fighters_guild',
    name: 'Fighters Guild',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 40, stone: 45, gold: 30 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_fighters_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'fighter', minLevel: 1 }] },
      questBoard: { domain: 'fighters' },
      training:   { domain: 'fighters' },
      research:   { domain: 'fighters' },
      shop:       { catalogId: 'shop_fighters_exclusive' }
    },
    desc: 'Martial brotherhood recruiting Fighters, offering martial quests, training, research, and exclusive arms.'
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: 'Thieves Guild',
    icon: '🗡️',
    category: 'military',
    color: '#c084fc',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 40, stone: 35, gold: 35 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    interiorAssetId: 'city_interior_thieves_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'thief', minLevel: 1 }] },
      questBoard: { domain: 'thieves' },
      training:   { domain: 'thieves' },
      research:   { domain: 'thieves' },
      shop:       { catalogId: 'shop_thieves_exclusive' }
    },
    desc: 'Shadow network recruiting Thieves, offering heist contracts, stealth training, research, and black-market gear.'
  },
  mages_guild: {
    id: 'mages_guild',
    name: 'Mages Guild',
    icon: '✨',
    category: 'arcane',
    color: '#60a5fa',
    maxLevel: 5,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 35, stone: 50, gold: 40 },
    requires: { meeting_hall: 1, quarry: 1 },
    interiorAssetId: 'city_interior_mages_guild_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'mage', minLevel: 1 }] },
      questBoard: { domain: 'mages' },
      training:   { domain: 'mages' },
      research:   { domain: 'mages' },
      shop:       { catalogId: 'shop_mages_exclusive' }
    },
    desc: 'Arcane spire recruiting Mages, offering spellcraft quests, arcane training, research, and staff/tome relics.'
  },
  rangers_lodge: {
    id: 'rangers_lodge',
    name: 'Rangers Lodge',
    icon: '🏹',
    category: 'military',
    color: '#34d399',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 50, stone: 30, gold: 25 },
    requires: { meeting_hall: 1, lumber_camp: 1 },
    interiorAssetId: 'city_interior_rangers_lodge_default_static',
    facilities: {
      recruitment: { classes: [{ classId: 'ranger', minLevel: 1 }] },
      questBoard: { domain: 'rangers' },
      training:   { domain: 'rangers' },
      research:   { domain: 'rangers' },
      shop:       { catalogId: 'shop_rangers_exclusive' }
    },
    desc: 'Frontier pathfinder lodge recruiting Rangers, offering scouting quests, archery training, research, and bows.'
  },
  shrine: {
    id: 'shrine',
    name: 'Shrine',
    icon: '🕊️',
    category: 'arcane',
    color: '#fef08a',
    maxLevel: 3,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 35, stone: 40, gold: 25 },
    requires: { meeting_hall: 1, guild_hall: 1 },
    recruits: ['paladin', 'cleric'],
    desc: 'Sanctuary for divine communion. Prepares holy champions (Paladins, Clerics) to shield your troops.'
  },
  mage_guild: {
    id: 'mage_guild',
    name: 'Mage Guild',
    icon: '🔮',
    category: 'arcane',
    color: '#c084fc',
    maxLevel: 3,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 40, stone: 45, gold: 35 },
    requires: { meeting_hall: 2, guild_hall: 1 },
    recruits: ['mage', 'elementalist'],
    desc: 'Academy of the astral elements. Enrolls Mages and Elementalists wielding arcane forces.'
  },
  star_forge: {
    id: 'star_forge',
    name: 'Astral Star-Forge',
    icon: '🔥',
    category: 'arcane',
    color: '#c084fc',
    maxLevel: 3,
    baseBuildTimeMs: 7000,
    baseCost: { wood: 40, stone: 60, gold: 50 },
    productionPerTick: { gold: 4 },
    requires: { guild_hall: 1 },
    desc: 'Smelts subterranean star-ores brought back from dungeons into masterwork relics.'
  },
  temple_of_war: {
    id: 'temple_of_war',
    name: 'Sanctum of the War Gods',
    icon: '🏛️',
    category: 'arcane',
    color: '#38bdf8',
    maxLevel: 3,
    baseBuildTimeMs: 6500,
    baseCost: { wood: 35, stone: 55, gold: 40 },
    productionPerTick: {},
    requires: { meeting_hall: 1 },
    desc: 'Channels Divine War Reimbursement—honorable battles grant divine favor and rapid troop recovery.'
  }
};

const CITY_PLOT_SLOTS = [
  { plotIndex: 0, label: 'Meeting Hall Plot', defaultBuilding: 'town_hall', lockedTo: 'town_hall' },
  { plotIndex: 1, label: 'Plot 1', recommended: 'hut' },
  { plotIndex: 2, label: 'Plot 2', recommended: 'garden' },
  { plotIndex: 3, label: 'Plot 3', recommended: 'well' },
  { plotIndex: 4, label: 'Plot 4', recommended: 'lumber_camp' },
  { plotIndex: 5, label: 'Plot 5', recommended: 'quarry' },
  { plotIndex: 6, label: 'Plot 6', recommended: 'guild_hall' },
  { plotIndex: 7, label: 'Plot 7', recommended: 'barracks' }
];

function isBuildingPrerequisiteMet(city, buildingId) {
  if (!city) return false;
  const bDef = CITY_BUILDINGS_CATALOG[buildingId];
  if (!bDef) return false;

  // 1. Check required population
  if (bDef.requiredPopulation) {
    const curPop = (city.population && typeof city.population.current === 'number')
      ? city.population.current
      : 5;
    if (curPop < bDef.requiredPopulation) {
      return false;
    }
  }

  // 2. Check required building prerequisites
  if (bDef.requires) {
    const bldgs = city.buildings || {};
    const reqKeys = Object.keys(bDef.requires);
    for (let i = 0; i < reqKeys.length; i++) {
      const reqB = reqKeys[i];
      const reqLvl = bDef.requires[reqB];
      let curLvl = 0;
      if (reqB === 'meeting_hall' || reqB === 'town_hall') {
        curLvl = Math.max(bldgs.meeting_hall || 0, bldgs.town_hall || 0);
      } else if (reqB === 'garden' || reqB === 'farmstead') {
        curLvl = Math.max(bldgs.garden || 0, bldgs.farmstead || 0);
      } else if (reqB === 'lumber_camp' || reqB === 'lumber_hut' || reqB === 'sawmill') {
        curLvl = Math.max(bldgs.lumber_camp || 0, bldgs.lumber_hut || 0, bldgs.sawmill || 0);
      } else {
        curLvl = bldgs[reqB] || 0;
      }
      if (curLvl < reqLvl) {
        return false;
      }
    }
  }

  return true;
}

function getBuildingPrerequisiteMissingReason(city, buildingId) {
  if (!city) return 'No city established';
  const bDef = CITY_BUILDINGS_CATALOG[buildingId];
  if (!bDef) return 'Unknown building';

  if (bDef.requiredPopulation) {
    const curPop = (city.population && typeof city.population.current === 'number')
      ? city.population.current
      : 5;
    if (curPop < bDef.requiredPopulation) {
      return 'Requires Population ' + bDef.requiredPopulation + ' (Current: ' + curPop + ')';
    }
  }

  if (bDef.requires) {
    const bldgs = city.buildings || {};
    const reqKeys = Object.keys(bDef.requires);
    for (let i = 0; i < reqKeys.length; i++) {
      const reqB = reqKeys[i];
      const reqLvl = bDef.requires[reqB];
      let curLvl = 0;
      if (reqB === 'meeting_hall' || reqB === 'town_hall') {
        curLvl = Math.max(bldgs.meeting_hall || 0, bldgs.town_hall || 0);
      } else if (reqB === 'garden' || reqB === 'farmstead') {
        curLvl = Math.max(bldgs.garden || 0, bldgs.farmstead || 0);
      } else if (reqB === 'lumber_camp' || reqB === 'lumber_hut' || reqB === 'sawmill') {
        curLvl = Math.max(bldgs.lumber_camp || 0, bldgs.lumber_hut || 0, bldgs.sawmill || 0);
      } else {
        curLvl = bldgs[reqB] || 0;
      }
      if (curLvl < reqLvl) {
        const reqDef = CITY_BUILDINGS_CATALOG[reqB];
        return 'Requires ' + (reqDef ? reqDef.name : reqB) + ' Level ' + reqLvl;
      }
    }
  }

  return '';
}

function computeBuildingUpgradeCost(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return { wood: 50, stone: 50, gold: 0, water: 0, ore: 0 };
  const mult = Math.pow(1.45, Math.max(0, targetLevel - 1));
  const base = def.baseCost || {};
  const cost = {};
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    cost[k] = Math.round((base[k] || 0) * mult);
  }
  if (cost.wood === undefined) cost.wood = 0;
  if (cost.stone === undefined) cost.stone = 0;
  if (cost.gold === undefined) cost.gold = 0;
  if (cost.water === undefined) cost.water = 0;
  if (cost.ore === undefined) cost.ore = 0;
  return cost;
}

// Doubling duration for each upgrade level (e.g. 1x, 2x, 4x, 8x, 16x)
function computeBuildingDurationMs(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return 5000;
  const mult = Math.pow(2.0, Math.max(0, targetLevel - 1));
  return Math.round(def.baseBuildTimeMs * mult);
}

// Garrison Party Size Scaling (ADR-0012): 1 hero solo pre-Garrison; +1 per Garrison level
function computeMaxPartySize(city) {
  if (!city || !city.buildings) return 1;
  const garLvl = city.buildings.garrison || 0;
  return 1 + garLvl;
}

// Compute all Hero classIds recruitable in this city based on declarative building facilities
function getCityRecruitableClasses(city) {
  const unlocked = {};
  if (!city || !city.buildings) return [];
  const bKeys = Object.keys(city.buildings);
  for (let i = 0; i < bKeys.length; i++) {
    const bId = bKeys[i];
    const lvl = city.buildings[bId] || 0;
    if (lvl <= 0) continue;
    const def = CITY_BUILDINGS_CATALOG[bId];
    if (def && def.facilities && def.facilities.recruitment && Array.isArray(def.facilities.recruitment.classes)) {
      const list = def.facilities.recruitment.classes;
      for (let j = 0; j < list.length; j++) {
        if (lvl >= (list[j].minLevel || 1)) {
          unlocked[list[j].classId] = true;
        }
      }
    }
  }
  return Object.keys(unlocked);
}

// Declarative Guild Service Catalogs (Config-driven single Guild Screen per ADR-0012)
const GUILD_SERVICE_CATALOGS = {
  adventurers: {
    quests: [
      { id: 'q_adv_delve1', name: 'Chart Starfall Floor 1', desc: 'Map the outer masonry vaults and extract safely.', reward: '60g • 25 XP' },
      { id: 'q_adv_ore',    name: 'Subterranean Ore Assay', desc: 'Mine 10 raw ore seams and return them to the surface.', reward: '80g • 5 Ingots' }
    ],
    training: [
      { id: 'tr_adv_stride', name: 'Delver Conditioning', desc: '+10% Torchlight duration & reduced fatigue on deep floors.', cost: '40g' },
      { id: 'tr_adv_mine',   name: 'Reinforced Pickcraft', desc: '+4 Pickaxe durability for Adventurer delves.', cost: '35g • 4 Ingots' }
    ],
    research: [
      { id: 'rs_adv_geo',    name: 'Subterranean Geology', desc: 'Unlocks mining of dense Iron, Mithril, and Astral ore seams.', cost: '75g • 15 Ore' },
      { id: 'rs_adv_pact',   name: 'Vanguard Recovery Pact', desc: 'Increases gold salvaged by Guild Scouts upon expedition defeat.', cost: '90g • 10 Ore' }
    ],
    shop: [
      { id: 'sh_adv_compass', name: 'Brass Delver Compass', desc: 'Accessory • +1 Vision, +3% Crit', cost: '45g' },
      { id: 'sh_adv_pick',    name: 'Tempered Star-Pick', desc: 'Pickaxe • 45 Durability', cost: '60g' }
    ]
  },
  fighters: {
    quests: [
      { id: 'q_fgt_clear', name: 'Break the Vanguard Line', desc: 'Defeat 12 subterranean monsters in melee combat.', reward: '75g • 35 XP' }
    ],
    training: [
      { id: 'tr_fgt_cleave', name: 'Heavy Shield Drills', desc: '+2 Base DEF for sworn Fighters.', cost: '50g' }
    ],
    research: [
      { id: 'rs_fgt_plate', name: 'Riveted Plate Forging', desc: 'Improves heavy armor mitigation across the roster.', cost: '85g • 8 Ingots' }
    ],
    shop: [
      { id: 'sh_fgt_blade', name: 'Guildmaster Greatsword', desc: 'Weapon • +12 ATK, +2 STR', cost: '80g' }
    ]
  },
  thieves: {
    quests: [
      { id: 'q_thf_chest', name: 'Silent Vault Recovery', desc: 'Open 3 gilded dungeon chests without triggering traps.', reward: '90g • 30 XP' }
    ],
    training: [
      { id: 'tr_thf_lock', name: 'Master Lockpicking', desc: '+10% Crit & improved chest disarming.', cost: '50g' }
    ],
    research: [
      { id: 'rs_thf_map', name: 'Hidden Passage Cipher', desc: 'Increases chance to detect secret doors and levers.', cost: '80g' }
    ],
    shop: [
      { id: 'sh_thf_dagger', name: 'Nightshade Stiletto', desc: 'Weapon • +10 ATK, +12% Crit', cost: '75g' }
    ]
  },
  mages: {
    quests: [
      { id: 'q_mag_rune', name: 'Astral Leyline Resonance', desc: 'Harvest 5 Astral Gems from deep crystalline chambers.', reward: '110g • 40 XP' }
    ],
    training: [
      { id: 'tr_mag_focus', name: 'Mana Conduit Meditation', desc: '+15 Max MP & faster arcane regeneration.', cost: '55g' }
    ],
    research: [
      { id: 'rs_mag_star', name: 'Starlight Amplification', desc: 'Boosts spell damage and elemental hazard mastery.', cost: '100g • 12 Ore' }
    ],
    shop: [
      { id: 'sh_mag_staff', name: 'Vespera Runestaff', desc: 'Weapon • +8 ATK, +5 INT, +20 MP', cost: '90g' }
    ]
  },
  rangers: {
    quests: [
      { id: 'q_rng_scout', name: 'Frontier Patrol Sweep', desc: 'Defeat 2 wandering Overworld hostile bands.', reward: '85g • 30 XP' }
    ],
    training: [
      { id: 'tr_rng_eye', name: 'Hawkeye Marksmanship', desc: '+1 Overworld Vision & +8% Dodge.', cost: '50g' }
    ],
    research: [
      { id: 'rs_rng_trail', name: 'Pathfinder Logistics', desc: 'Reduces Overworld march times across forests and hills.', cost: '85g • 20 Wood' }
    ],
    shop: [
      { id: 'sh_rng_bow', name: 'Heartwood Longbow', desc: 'Weapon • +11 ATK, +3 DEX', cost: '80g' }
    ]
  },
  temple: {
    quests: [
      { id: 'q_tmp_ward', name: 'Sanctify the Deep Crypts', desc: 'Vanquish undead guardians beneath the Starfall Vaults.', reward: '95g • 40 XP' }
    ],
    training: [
      { id: 'tr_tmp_vow', name: 'Vow of Radiance', desc: '+15 Max HP & stronger healing blessings.', cost: '55g' }
    ],
    research: [
      { id: 'rs_tmp_sanct', name: 'Chapterhouse Reliquary', desc: 'Enhances divine wards and Paladin aura potency.', cost: '95g • 10 Ingots' }
    ],
    shop: [
      { id: 'sh_tmp_mace', name: 'Sunburst Morningstar', desc: 'Weapon • +11 ATK, +3 VIT', cost: '85g' }
    ]
  }
};

  // --- Module: src/wargame/engine/state.js ---
// Wargame Authoritative State Store, Universe -> World -> Cities -> Units Hierarchy & Save Serialization





function createTitleScreenState() {
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

function createNewCampaignWorldState(options = {}) {
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
      // Heroes & Parties only exist AFTER a Guild Hall is constructed!
      roster: {
        maxHeroes: BASE_MAX_HERO_ROSTER || 3,
        overallLeaderHeroId: null
      },
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
        dungeonsEntered: 0,
        expeditionsBanked: 0,
        skirmishesWon: 0
      }
    }
  };
}

function createDefaultCityPlots() {
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

function createInventoryContainer(id, name, capacity) {
  return {
    id: id || 'container_default',
    name: name || 'Storage Vault',
    capacity: typeof capacity === 'number' && capacity > 0 ? capacity : (CITY_STORAGE_BASE_CAPACITY || 200),
    items: []
  };
}

function computeCityStorageSlotCapacity(city) {
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

function getPrimaryCity(state) {
  if (!state || !state.world || !state.world.cities) return null;
  if (state.world.activeCityId && state.world.cities[state.world.activeCityId]) {
    return state.world.cities[state.world.activeCityId];
  }
  const keys = Object.keys(state.world.cities);
  return keys.length > 0 ? state.world.cities[keys[0]] : null;
}

function getSelectedOverworldUnit(state) {
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

function getEffectiveStockpile(state) {
  const fallback = { wood: 0, stone: 0, food: 0, gold: 0, water: 0, ore: 0 };
  if (!state || !state.world) return fallback;
  const city = getPrimaryCity(state);
  if (city && city.stockpile) {
    return city.stockpile;
  }
  return state.world.realmStockpile || fallback;
}

function computeCityStorageCaps(city) {
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

function computeCityPopulation(city, world = null) {
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

function hasSavedWargameCampaign() {
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

function peekSavedCampaignSummary() {
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

function saveWargameState(state, scheduler = null) {
  if (typeof localStorage === 'undefined' || !state || !state.world) return false;
  if (scheduler) {
    state.world.scheduledJobs = scheduler.serializeJobs();
  }
  state.world.clock.lastRealTimestamp = Date.now();
  localStorage.setItem(WARGAME_STORAGE_KEY, JSON.stringify(state));
  return true;
}

function loadWargameState(scheduler = null) {
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
    if (parsed.world.stats) {
      if (typeof parsed.world.stats.expeditionsBanked !== 'number') parsed.world.stats.expeditionsBanked = 0;
      if (typeof parsed.world.stats.skirmishesWon !== 'number')     parsed.world.stats.skirmishesWon = 0;
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
    if (scheduler && Array.isArray(parsed.world.scheduledJobs)) {
      scheduler.hydrateJobs(parsed.world.scheduledJobs);
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

  // --- Module: src/wargame/engine/queues.js ---
// TimedQueueManager — Real-Time Unit Marching, City Construction Queues & Resource Production Tickers







function scheduleNextMarchStep(unit, state, scheduler) {
  if (!unit || !unit.marchPlan || !Array.isArray(unit.marchPlan.remainingPath) || unit.marchPlan.remainingPath.length === 0) {
    return null;
  }

  const simTimeMs = state.world.clock.simTimeMs;
  const nextStep = unit.marchPlan.remainingPath[0];
  const stepDur = Math.max(250, nextStep.stepDurationMs || 3000);

  const job = scheduler.scheduleJob({
    jobId: 'march_' + unit.id + '_' + simTimeMs + '_' + Math.floor(Math.random() * 10000),
    jobType: 'UNIT_MARCH_STEP',
    ownerId: unit.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + stepDur,
    payload: {
      unitId: unit.id,
      fromX: unit.x,
      fromY: unit.y,
      toX: nextStep.x,
      toY: nextStep.y
    }
  });

  unit.status = 'marching';
  unit.marchPlan.activeJobId = job.jobId;
  unit.marchPlan.stepStartSimTimeMs = simTimeMs;
  unit.marchPlan.stepDueSimTimeMs = simTimeMs + stepDur;
  unit.marchPlan.fromX = unit.x;
  unit.marchPlan.fromY = unit.y;
  unit.marchPlan.toX = nextStep.x;
  unit.marchPlan.toY = nextStep.y;

  return job;
}

function checkAndDiscoverDungeonsInVision(ow, simTimeMs, eventStream) {
  if (!ow || !Array.isArray(ow.pois) || !Array.isArray(ow.explored)) return [];
  const newlyDiscovered = [];
  for (let i = 0; i < ow.pois.length; i++) {
    const poi = ow.pois[i];
    if (poi.type !== 'dungeon_entrance' || poi.discovered) continue;
    if (ow.explored[poi.y] && ow.explored[poi.y][poi.x]) {
      poi.discovered = true;
      newlyDiscovered.push(poi);
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.DUNGEON_DISCOVERED, {
          poiId: poi.id,
          dungeonId: poi.dungeonId,
          profileId: poi.profileId,
          dungeonName: poi.name,
          x: poi.x,
          y: poi.y
        }, simTimeMs);
      }
    }
  }
  return newlyDiscovered;
}

function depositUnitCargoAtCity(unit, city, state, simTimeMs, eventStream) {
  if (!unit || !unit.cargo || !city || !city.stockpile) return false;
  const c = unit.cargo;
  const gold = c.gold || 0;
  const ore = c.ore || 0;
  const gems = c.gems || 0;
  const gearItems = Array.isArray(c.gearItems) ? c.gearItems : [];
  const gearCount = Math.max(c.gearCount || 0, gearItems.length);
  if (gold <= 0 && ore <= 0 && gems <= 0 && gearCount <= 0) {
    unit.cargo = null;
    return false;
  }

  city.stockpile.gold = (city.stockpile.gold || 0) + gold;
  city.stockpile.ore  = (city.stockpile.ore  || 0) + ore;
  if (gems > 0) {
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
    city.gems.ruby = (city.gems.ruby || 0) + gems;
  }

  // Deposit looted dungeon equipment items into the party leader Hero's bagGear!
  if (gearItems.length > 0 && state && state.world && Array.isArray(state.world.heroes)) {
    const leaderHero = state.world.heroes.find(function(h) { return h.id === unit.leaderHeroId; }) || state.world.heroes[0];
    if (leaderHero) {
      if (!Array.isArray(leaderHero.bagGear)) leaderHero.bagGear = [];
      for (let gi = 0; gi < gearItems.length; gi++) {
        leaderHero.bagGear.push(gearItems[gi]);
      }
    }
  }
  unit.cargo = null;
  if (state && state.world && state.world.stats) {
    state.world.stats.expeditionsBanked = (state.world.stats.expeditionsBanked || 0) + 1;
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.EXPEDITION_BANKED, {
      unitId: unit.id,
      unitName: unit.shortName,
      cityId: city.id,
      cityName: city.name,
      gold: gold,
      ore: ore,
      gems: gems,
      gearCount: gearCount
    }, simTimeMs);
  }
  return true;
}

function resolveOverworldSkirmish(unit, hostile, state, scheduler, simTimeMs, eventStream) {
  if (!unit || !hostile || !hostile.alive) return { victory: true, skipped: true };
  const world = state && state.world;
  const hero = (world && Array.isArray(world.heroes))
    ? world.heroes.find(function(h) { return h.id === unit.leaderHeroId; })
    : null;

  const heroAtk = (hero && hero.stats && hero.stats.atk) ? hero.stats.atk : 26;
  const heroDef = (hero && hero.stats && hero.stats.def) ? hero.stats.def : 12;
  const heroLvl = (hero && hero.level) ? hero.level : 1;
  const effectiveAtk = heroAtk + (heroLvl - 1) * 4;

  const roundsToKill = Math.max(1, Math.ceil((hostile.hp || 60) / Math.max(5, effectiveAtk)));
  const dmgPerRound = Math.max(2, (hostile.power || 18) - Math.floor(heroDef * 0.6));
  const totalDmg = dmgPerRound * Math.max(1, roundsToKill - 1);

  if ((unit.hp || 1) > totalDmg) {
    unit.hp = Math.max(1, unit.hp - totalDmg);
    hostile.alive = false;
    if (world && world.stats) {
      world.stats.skirmishesWon = (world.stats.skirmishesWon || 0) + 1;
    }
    if (hero) {
      hero.xp = (hero.xp || 0) + (hostile.rewardXp || 25);
    }
    if (!unit.cargo) {
      unit.cargo = { gold: 0, ore: 0, gems: 0, gearCount: 0 };
    }
    unit.cargo.gold = (unit.cargo.gold || 0) + (hostile.rewardGold || 20);
    unit.cargo.ore  = (unit.cargo.ore  || 0) + (hostile.rewardOre  || 4);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.OVERWORLD_SKIRMISH, {
        victory: true,
        unitId: unit.id,
        unitName: unit.shortName,
        hostileId: hostile.id,
        hostileName: hostile.name,
        damageTaken: totalDmg,
        rewardGold: hostile.rewardGold || 20,
        rewardOre: hostile.rewardOre || 4,
        rewardXp: hostile.rewardXp || 25
      }, simTimeMs);
    }
    return { victory: true, damageTaken: totalDmg };
  }

  // Defeat in Overworld Skirmish: Non-permanent retreat back to City Guild Hall
  if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
    scheduler.cancelJob(unit.marchPlan.activeJobId);
  }
  const city = getPrimaryCity(state);
  if (city) {
    unit.x = city.x;
    unit.y = city.y;
  }
  unit.status = 'idle';
  unit.marchPlan = null;
  unit.hp = unit.maxHp;
  unit.cargo = null;

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.OVERWORLD_SKIRMISH, {
      victory: false,
      unitId: unit.id,
      unitName: unit.shortName,
      hostileId: hostile.id,
      hostileName: hostile.name,
      retreatedToCity: city ? city.name : 'Bastion'
    }, simTimeMs);
  }
  return { victory: false };
}

function resolveMarchStepJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.overworld) return;
  const ow = state.world.overworld;
  const unitId = job.payload && job.payload.unitId;
  const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
  if (!unit || !unit.marchPlan) return;

  const targetX = job.payload.toX;
  const targetY = job.payload.toY;

  unit.x = targetX;
  unit.y = targetY;
  state.world.stats.totalUnitSteps = (state.world.stats.totalUnitSteps || 0) + 1;

  revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 4);
  checkAndDiscoverDungeonsInVision(ow, job.dueSimTimeMs, eventStream);

  // Check for Wandering Hostile interception for Hero Parties
  if (unit.unitType === 'hero_party' && Array.isArray(ow.hostiles)) {
    const encountered = ow.hostiles.find(function(h) {
      return h.alive && h.x === unit.x && h.y === unit.y;
    });
    if (encountered) {
      const skirmishRes = resolveOverworldSkirmish(unit, encountered, state, scheduler, job.dueSimTimeMs, eventStream);
      if (!skirmishRes.victory) {
        state._dirty = true;
        saveWargameState(state, scheduler);
        evaluateTaskDAG(state, eventStream);
        return;
      }
    }
  }

  // Check if unit stepped onto a supply cache POI
  if (Array.isArray(ow.pois)) {
    for (let i = 0; i < ow.pois.length; i++) {
      const poi = ow.pois[i];
      if (!poi.depleted && poi.type === 'resource_cache' && poi.x === unit.x && poi.y === unit.y) {
        poi.depleted = true;
        const yieldRes = poi.yield || { wood: 25, stone: 20 };
        const cityKeys = Object.keys(state.world.cities || {});
        const stock = cityKeys.length > 0
          ? state.world.cities[cityKeys[0]].stockpile
          : state.world.realmStockpile;
        if (yieldRes.wood) stock.wood = (stock.wood || 0) + yieldRes.wood;
        if (yieldRes.stone) stock.stone = (stock.stone || 0) + yieldRes.stone;
        if (yieldRes.food) stock.food = (stock.food || 0) + yieldRes.food;
        state.world.stats.resourcesHarvested = (state.world.stats.resourcesHarvested || 0) + 1;
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.RESOURCE_HARVESTED, {
            unitId: unit.id,
            unitName: unit.shortName,
            poiName: poi.name,
            yield: yieldRes
          }, job.dueSimTimeMs);
        }
      }
    }
  }

  // Pop the completed step from remainingPath
  if (Array.isArray(unit.marchPlan.remainingPath) && unit.marchPlan.remainingPath.length > 0) {
    unit.marchPlan.remainingPath.shift();
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.UNIT_MARCH_STEP, {
      unitId: unit.id,
      unitName: unit.shortName,
      x: unit.x,
      y: unit.y,
      remainingSteps: unit.marchPlan.remainingPath ? unit.marchPlan.remainingPath.length : 0
    }, job.dueSimTimeMs);
  }

  // Schedule next step or complete march
  if (unit.marchPlan.remainingPath && unit.marchPlan.remainingPath.length > 0) {
    scheduleNextMarchStep(unit, state, scheduler);
  } else {
    const completedIntent = unit.marchPlan.intent || 'move';
    unit.status = 'idle';
    unit.marchPlan = null;

    // If arriving at a friendly City carrying cargo, bank spoils into City Stockpile and restore HP
    const cityKeys = Object.keys(state.world.cities || {});
    for (let cIdx = 0; cIdx < cityKeys.length; cIdx++) {
      const city = state.world.cities[cityKeys[cIdx]];
      if (city && city.x === unit.x && city.y === unit.y) {
        unit.hp = unit.maxHp;
        if (unit.cargo) {
          depositUnitCargoAtCity(unit, city, state, job.dueSimTimeMs, eventStream);
        }
        break;
      }
    }

    state._dirty = true;
    saveWargameState(state, scheduler);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_COMPLETED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y,
        intent: completedIntent
      }, job.dueSimTimeMs);
    }
  }

  state._dirty = true;
  evaluateTaskDAG(state, eventStream);
}

function activateNextCityBuildQueueItem(city, state, scheduler) {
  if (!city || !Array.isArray(city.buildQueue) || city.buildQueue.length === 0) return null;

  // Check if the front item is already active
  const front = city.buildQueue[0];
  if (front.status === 'building' || front.status === 'demolishing' || front.status === 'moving') return front;

  const simTimeMs = state.world.clock.simTimeMs;
  const dur = Math.max(500, front.durationMs || 4000);
  const isMove = front.type === 'move';
  const isDemolishOrCleanup = front.type === 'demolish' || front.type === 'cleanup';

  let jobType = 'CITY_BUILDING_COMPLETE';
  let jobPrefix = 'build_';
  if (isMove) {
    jobType = 'CITY_BUILDING_MOVE_COMPLETE';
    jobPrefix = 'move_';
  } else if (isDemolishOrCleanup) {
    jobType = 'CITY_BUILDING_DEMOLISH_COMPLETE';
    jobPrefix = 'demolish_';
  }

  const job = scheduler.scheduleJob({
    jobId: jobPrefix + city.id + '_plot_' + (isMove ? (front.fromPlotIndex + '_' + front.toPlotIndex) : front.plotIndex) + '_' + simTimeMs,
    jobType: jobType,
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: isMove ? {
      cityId: city.id,
      queueItemId: front.queueItemId,
      fromPlotIndex: front.fromPlotIndex,
      toPlotIndex: front.toPlotIndex,
      buildingId: front.buildingId,
      level: front.level
    } : {
      cityId: city.id,
      queueItemId: front.queueItemId,
      plotIndex: front.plotIndex,
      buildingId: front.buildingId,
      targetLevel: front.targetLevel,
      actionType: front.type || 'build',
      previousLevel: front.previousLevel || 0,
      salvage: front.salvage || null
    }
  });

  front.status = isMove ? 'moving' : (isDemolishOrCleanup ? 'demolishing' : 'building');
  front.jobId = job.jobId;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

  if (isMove) {
    const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === front.fromPlotIndex; });
    const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === front.toPlotIndex; });
    if (fromPlot) { fromPlot.relocating = true; fromPlot.activeJobId = job.jobId; }
    if (toPlot)   { toPlot.relocating = true; toPlot.activeJobId = job.jobId; }
  } else {
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === front.plotIndex; });
    if (plot) {
      if (isDemolishOrCleanup) {
        plot.demolishing = true;
        plot.underConstruction = false;
      } else {
        plot.underConstruction = true;
        plot.demolishing = false;
      }
      plot.activeJobId = job.jobId;
    }
  }

  return front;
}

function resolveBuildingCompleteJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const bId = p.buildingId;
  const targetLvl = p.targetLevel || 1;

  if (!city.buildings) city.buildings = {};
  city.buildings[bId] = Math.max(city.buildings[bId] || 0, targetLvl);

  if (bId === 'town_hall' || bId === 'meeting_hall') {
    city.buildings.town_hall = Math.max(city.buildings.town_hall || 0, targetLvl);
    city.buildings.meeting_hall = Math.max(city.buildings.meeting_hall || 0, targetLvl);
    city.level = Math.max(city.level || 1, targetLvl);
  } else if (bId === 'garden' || bId === 'farmstead') {
    city.buildings.garden = Math.max(city.buildings.garden || 0, targetLvl);
    city.buildings.farmstead = Math.max(city.buildings.farmstead || 0, targetLvl);
  } else if (bId === 'lumber_camp' || bId === 'lumber_hut' || bId === 'sawmill') {
    city.buildings.lumber_camp = Math.max(city.buildings.lumber_camp || 0, targetLvl);
    city.buildings.lumber_hut = Math.max(city.buildings.lumber_hut || 0, targetLvl);
    city.buildings.sawmill = Math.max(city.buildings.sawmill || 0, targetLvl);
  }

  const plot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.plotIndex; });
  if (plot) {
    plot.buildingId = bId;
    plot.level = targetLvl;
    plot.underConstruction = false;
    plot.demolishing = false;
    plot.activeJobId = null;
  }

  // Remove completed item from front of buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  state.world.stats.buildingsCompleted = (state.world.stats.buildingsCompleted || 0) + 1;

  // If Adventurers Guild Hall is completed, unlock GUILD_UNLOCKED phase and reveal The Starfall Vaults!
  if (bId === 'guild_hall' && targetLvl >= 1) {
    if (state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED) {
      state.campaignPhase = CAMPAIGN_PHASES.GUILD_UNLOCKED;
    }
    const ow = state.world.overworld;
    if (ow && Array.isArray(ow.pois)) {
      const starfallPoi = ow.pois.find(function(poi) { return poi.id === 'poi_dungeon_starfall' || poi.type === 'dungeon_entrance'; });
      if (starfallPoi) {
        revealOverworldVision(ow, starfallPoi.x, starfallPoi.y, 2);
        checkAndDiscoverDungeonsInVision(ow, job.dueSimTimeMs, eventStream);
      }
    }
  }

  const bDef = CITY_BUILDINGS_CATALOG[bId];
  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.BUILDING_COMPLETED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      level: targetLvl,
      plotIndex: p.plotIndex
    }, job.dueSimTimeMs);
  }

  // Start next queued building in this city if any
  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

function resolveBuildingDemolishJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const plot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.plotIndex; });
  const bId = p.buildingId;
  const isDeliberate = p.actionType === 'demolish';

  if (isDeliberate) {
    // Deliberate demolition: credit salvage materials
    const salvage = p.salvage || { wood: 0, stone: 0, gold: 0, water: 0, ore: 0 };
    city.stockpile.wood  = (city.stockpile.wood  || 0) + (salvage.wood  || 0);
    city.stockpile.stone = (city.stockpile.stone || 0) + (salvage.stone || 0);
    city.stockpile.gold  = (city.stockpile.gold  || 0) + (salvage.gold  || 0);
    if (salvage.water) city.stockpile.water = (city.stockpile.water || 0) + salvage.water;
    if (salvage.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + salvage.ore;

    if (plot) {
      plot.buildingId = null;
      plot.level = 0;
    }

    // Recompute highest level for buildingId across remaining plots
    let highestLvl = 0;
    for (let pIdx = 0; pIdx < (city.plots || []).length; pIdx++) {
      const pl = city.plots[pIdx];
      if (pl.buildingId === bId) {
        highestLvl = Math.max(highestLvl, pl.level || 0);
      }
    }
    if (highestLvl > 0) {
      if (city.buildings) city.buildings[bId] = highestLvl;
    } else if (city.buildings) {
      delete city.buildings[bId];
      if (bId === 'sawmill') delete city.buildings.lumber_hut;
      if (bId === 'lumber_hut') delete city.buildings.sawmill;
      if (bId === 'farmstead') delete city.buildings.garden;
      if (bId === 'garden') delete city.buildings.farmstead;
    }
  } else {
    // Site cleanup after cancelled construction
    if (plot) {
      const prevLvl = typeof p.previousLevel === 'number' ? p.previousLevel : 0;
      if (prevLvl <= 0) {
        plot.buildingId = null;
        plot.level = 0;
      } else {
        plot.level = prevLvl;
      }
    }
  }

  if (plot) {
    plot.underConstruction = false;
    plot.demolishing = false;
    plot.activeJobId = null;
  }

  // Remove from buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  if (eventStream) {
    eventStream.publish(isDeliberate ? STREAM_TOPICS.BUILDING_DEMOLISHED : STREAM_TOPICS.BUILDING_CANCELLED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      plotIndex: p.plotIndex,
      salvage: isDeliberate ? (p.salvage || null) : null
    }, job.dueSimTimeMs);
  }

  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

function resolveBuildingMoveJob(job, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const p = job.payload || {};
  const city = state.world.cities[p.cityId];
  if (!city) return;

  const fromPlot = (city.plots || []).find(function(pl) { return pl.plotIndex === p.fromPlotIndex; });
  const toPlot   = (city.plots || []).find(function(pl) { return pl.plotIndex === p.toPlotIndex; });

  const bId = p.buildingId;
  const lvl = p.level || 1;

  if (fromPlot) {
    fromPlot.buildingId = null;
    fromPlot.level = 0;
    fromPlot.relocating = false;
    fromPlot.underConstruction = false;
    fromPlot.demolishing = false;
    fromPlot.activeJobId = null;
  }

  if (toPlot) {
    toPlot.buildingId = bId;
    toPlot.level = lvl;
    toPlot.relocating = false;
    toPlot.underConstruction = false;
    toPlot.demolishing = false;
    toPlot.activeJobId = null;
  }

  // Remove completed move from front of buildQueue
  if (Array.isArray(city.buildQueue)) {
    const idx = city.buildQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.buildQueue.splice(idx, 1);
    }
  }

  // Update selectedPlotIndex if user was inspecting the moved structure
  if (city.selectedPlotIndex === p.fromPlotIndex) {
    city.selectedPlotIndex = p.toPlotIndex;
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.BUILDING_MOVED, {
      cityId: city.id,
      cityName: city.name,
      buildingId: bId,
      fromPlotIndex: p.fromPlotIndex,
      toPlotIndex: p.toPlotIndex,
      level: lvl
    }, job.dueSimTimeMs);
  }

  activateNextCityBuildQueueItem(city, state, scheduler);

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

function activateNextCityRecruitQueueItem(city, state, scheduler) {
  if (!city || !Array.isArray(city.recruitmentQueue) || city.recruitmentQueue.length === 0) return null;

  // Check if an item is already active
  const front = city.recruitmentQueue[0];
  if (front.status === 'training') return front;

  const simTimeMs = state.world.clock.simTimeMs;
  const dur = Math.max(1000, front.durationMs || BASE_HERO_RECRUIT_DURATION_MS);

  const job = scheduler.scheduleJob({
    jobId: 'recruit_' + city.id + '_' + front.classId + '_' + simTimeMs,
    jobType: 'HERO_RECRUIT_COMPLETE',
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: {
      cityId: city.id,
      queueItemId: front.queueItemId,
      classId: front.classId,
      heroName: front.heroName
    }
  });

  front.status = 'training';
  front.jobId = job.jobId;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

  return front;
}

function resolveRecruitHeroJob(job, state, scheduler, eventStream) {
  if (!state || !state.world) return;
  const p = job.payload || {};
  const world = state.world;
  const city = (world.cities && world.cities[p.cityId]) || getPrimaryCity(state);
  const ow = world.overworld;

  const classDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === p.classId; });
  if (!classDef) return;

  const heroIndex = (world.heroes || []).length + 1;
  const heroName = String(p.heroName || (classDef.name + ' #' + heroIndex)).trim();
  const starterEq = {
    weapon:    { uid: 'eq_w_' + heroIndex, slot: 'weapon',    name: 'Guild Iron Blade',     rarity: 'common', atk: 6, def: 0, value: 25 },
    armor:     { uid: 'eq_a_' + heroIndex, slot: 'armor',     name: 'Vanguard Cuirass',     rarity: 'common', atk: 0, def: 5, value: 25 },
    helm:      { uid: 'eq_h_' + heroIndex, slot: 'helm',      name: 'Scout Steel Helm',     rarity: 'common', atk: 0, def: 2, value: 15 },
    boots:     { uid: 'eq_b_' + heroIndex, slot: 'boots',     name: 'Frontier Greaves',     rarity: 'common', atk: 0, def: 2, value: 15 },
    accessory: null,
    pickaxe:   { uid: 'eq_p_' + heroIndex, slot: 'pickaxe',   name: 'Copper Miner Pickaxe', rarity: 'common', tier: 1, maxDurability: 25, durability: 25, value: 20 }
  };
  const heroObj = {
    id: 'hero_' + heroIndex + '_' + classDef.classId,
    name: heroName,
    classId: classDef.classId,
    className: classDef.name,
    title: classDef.title,
    icon: classDef.icon,
    color: classDef.color,
    level: 1,
    xp: 0,
    stats: Object.assign({}, classDef.baseStats),
    equipment: starterEq,
    cosmetics: { cloak: null, aura: null, banner_crest: null, weapon_glow: null },
    bagGear: [
      { uid: 'bag_ring_' + heroIndex, slot: 'accessory', name: 'Aethelgard Signet', rarity: 'uncommon', atk: 3, def: 2, value: 45 }
    ],
    recruitedAtSimMs: job.dueSimTimeMs
  };

  if (!world.heroes) world.heroes = [];
  world.heroes.push(heroObj);
  if (!world.roster) {
    world.roster = { maxHeroes: 3, overallLeaderHeroId: heroObj.id };
  } else if (!world.roster.overallLeaderHeroId) {
    world.roster.overallLeaderHeroId = heroObj.id;
  }
  world.stats.heroesRecruited = (world.stats.heroesRecruited || 0) + 1;

  // Form an Overworld Vanguard Party at the City gates led by this Hero
  const partyArch = UNIT_ARCHETYPES.hero_party;
  const spawnX = city ? city.x : (ow ? ow.spawnX : 0);
  const spawnY = city ? city.y : (ow ? ow.spawnY : 0);

  const partyUnit = {
    id: 'unit_party_' + heroIndex,
    name: heroObj.name + '\'s Vanguard',
    shortName: heroObj.name,
    unitType: 'hero_party',
    leaderHeroId: heroObj.id,
    heroClassId: heroObj.classId,
    x: spawnX,
    y: spawnY,
    hp: heroObj.stats.hp,
    maxHp: heroObj.stats.hp,
    visionRadius: heroObj.classId === 'ranger' ? 7 : partyArch.visionRadius,
    canFoundCity: false,
    canEnterDungeon: true,
    alive: true,
    status: 'idle',
    cargo: null,
    marchPlan: null
  };

  if (ow) {
    if (!ow.units) ow.units = [];
    ow.units.push(partyUnit);
    // Preserve current selection if the player is already commanding an active unit in the field
    const hasActiveSelected = Boolean(ow.selectedUnitId && ow.units.some(function(u) {
      return u.id === ow.selectedUnitId && u.alive;
    }));
    if (!hasActiveSelected) {
      ow.selectedUnitId = partyUnit.id;
    }
    revealOverworldVision(ow, partyUnit.x, partyUnit.y, partyUnit.visionRadius);
  }

  if (!world.parties) world.parties = [];
  world.parties.push({
    id: partyUnit.id,
    leaderHeroId: heroObj.id,
    memberIds: [heroObj.id],
    cityId: city ? city.id : null
  });

  // Remove from recruitmentQueue
  if (city && Array.isArray(city.recruitmentQueue)) {
    const idx = city.recruitmentQueue.findIndex(function(q) { return q.queueItemId === p.queueItemId || q.jobId === job.jobId; });
    if (idx !== -1) {
      city.recruitmentQueue.splice(idx, 1);
    }
  }

  if (eventStream) {
    eventStream.publish(STREAM_TOPICS.HERO_RECRUITED, {
      heroId: heroObj.id,
      heroName: heroObj.name,
      classId: heroObj.classId,
      partyUnitId: partyUnit.id
    }, job.dueSimTimeMs);
    eventStream.publish(STREAM_TOPICS.PARTY_FORMED, {
      partyUnitId: partyUnit.id,
      leaderName: heroObj.name,
      x: partyUnit.x,
      y: partyUnit.y
    }, job.dueSimTimeMs);
  }

  if (city) {
    activateNextCityRecruitQueueItem(city, state, scheduler);
  }

  state._dirty = true;
  saveWargameState(state, scheduler);
  evaluateTaskDAG(state, eventStream);
}

function processResourceProductionTick(state, eventStream) {
  if (!state || !state.world || !state.world.cities) return;
  const cityIds = Object.keys(state.world.cities);
  if (cityIds.length === 0) return;
  let popChanged = false;

  for (let i = 0; i < cityIds.length; i++) {
    const city = state.world.cities[cityIds[i]];
    if (!city || !city.stockpile) continue;

    // 1. Recompute population capacity from Meeting Hall and active Huts
    if (!city.population) {
      city.population = { current: 5, max: 10, growthProgress: 0, starving: false, starveTicks: 0 };
    }
    let maxPop = 10;
    if (Array.isArray(city.plots)) {
      for (let p = 0; p < city.plots.length; p++) {
        const pl = city.plots[p];
        if (pl.buildingId === 'hut' && (pl.level || 0) > 0 && !pl.demolishing) {
          maxPop += (pl.level || 1) * 5;
        }
      }
    }
    city.population.max = maxPop;
    if (typeof city.population.current !== 'number') {
      city.population.current = 5;
    }

    // 2. Subsistence token production: Every city produces +1 food, wood, stone, gold, water baseline per tick
    const gains = { wood: 1, stone: 1, food: 1, gold: 1, water: 1, ore: 0 };

    if (Array.isArray(city.plots) && city.plots.length > 0) {
      // Spatial plot-based production with adjacency bonuses
      for (let p = 0; p < city.plots.length; p++) {
        const plot = city.plots[p];
        const bId = plot.buildingId;
        const lvl = plot.level || 0;
        if (!bId || lvl <= 0 || plot.underConstruction || plot.demolishing || plot.relocating) continue;

        // Skip meeting_hall / town_hall here because token baseline is already accounted for
        if (bId === 'meeting_hall' || bId === 'town_hall') continue;

        const bDef = CITY_BUILDINGS_CATALOG[bId];
        if (!bDef || !bDef.productionPerTick) continue;

        // Check for adjacent active Windmills on the 8x8 grid
        let windmillCount = 0;
        const px = plot.x !== undefined ? plot.x : (plot.plotIndex % 8);
        const py = plot.y !== undefined ? plot.y : Math.floor(plot.plotIndex / 8);
        const neighbors = [
          { x: px + 1, y: py },
          { x: px - 1, y: py },
          { x: px, y: py + 1 },
          { x: px, y: py - 1 }
        ];
        for (let n = 0; n < neighbors.length; n++) {
          const nb = neighbors[n];
          if (nb.x >= 0 && nb.x < 8 && nb.y >= 0 && nb.y < 8) {
            const nPlot = city.plots[nb.y * 8 + nb.x];
            if (nPlot && nPlot.buildingId === 'windmill' && (nPlot.level || 0) > 0 && !nPlot.underConstruction && !nPlot.demolishing) {
              windmillCount++;
            }
          }
        }

        const mult = 1.0 + (windmillCount * (WINDMILL_ADJACENCY_BONUS || 0.20));
        const prod = bDef.productionPerTick;
        if (prod.wood)  gains.wood  += Math.round(prod.wood  * lvl * mult);
        if (prod.stone) gains.stone += Math.round(prod.stone * lvl * mult);
        if (prod.food)  gains.food  += Math.round(prod.food  * lvl * mult);
        if (prod.gold)  gains.gold  += Math.round(prod.gold  * lvl * mult);
        if (prod.water) gains.water += Math.round(prod.water * lvl * mult);
        if (prod.ore)   gains.ore   += Math.round(prod.ore   * lvl * mult);
      }
    } else if (city.buildings) {
      // Fallback for legacy state
      const bKeys = Object.keys(city.buildings);
      for (let k = 0; k < bKeys.length; k++) {
        const bId = bKeys[k];
        if (bId === 'town_hall' || bId === 'meeting_hall') continue;
        const lvl = city.buildings[bId] || 0;
        if (lvl <= 0) continue;
        const bDef = CITY_BUILDINGS_CATALOG[bId];
        if (bDef && bDef.productionPerTick) {
          if (bDef.productionPerTick.wood)  gains.wood  += bDef.productionPerTick.wood * lvl;
          if (bDef.productionPerTick.stone) gains.stone += bDef.productionPerTick.stone * lvl;
          if (bDef.productionPerTick.food)  gains.food  += bDef.productionPerTick.food * lvl;
          if (bDef.productionPerTick.gold)  gains.gold  += bDef.productionPerTick.gold * lvl;
          if (bDef.productionPerTick.water) gains.water += bDef.productionPerTick.water * lvl;
          if (bDef.productionPerTick.ore)   gains.ore   += bDef.productionPerTick.ore * lvl;
        }
      }
    }

    // Add passive production gains up to storage caps (never deleting overflow expedition spoils or task rewards!)
    const caps = computeCityStorageCaps(city);
    function addProductionCapped(cur, gain, cap) {
      const base = cur || 0;
      if (gain <= 0) return base;
      if (base >= cap) return base;
      return Math.min(cap, base + gain);
    }
    city.stockpile.wood  = addProductionCapped(city.stockpile.wood,  gains.wood,  caps.wood  || 200);
    city.stockpile.stone = addProductionCapped(city.stockpile.stone, gains.stone, caps.stone || 200);
    city.stockpile.food  = addProductionCapped(city.stockpile.food,  gains.food,  caps.food  || 200);
    city.stockpile.gold  = addProductionCapped(city.stockpile.gold,  gains.gold,  caps.gold  || 300);
    city.stockpile.water = addProductionCapped(city.stockpile.water, gains.water, caps.water || 200);
    city.stockpile.ore   = addProductionCapped(city.stockpile.ore,   gains.ore,   caps.ore   || 100);

    // 3. Population Sustenance Consumption & Starvation Dynamics
    // Demand scales with population: 1 food and 1 water per 5 citizens
    const foodDemand = Math.max(1, Math.ceil(city.population.current / 5));
    const waterDemand = Math.max(1, Math.ceil(city.population.current / 5));

    if ((city.stockpile.food || 0) >= foodDemand && (city.stockpile.water || 0) >= waterDemand) {
      city.stockpile.food  -= foodDemand;
      city.stockpile.water -= waterDemand;
      city.population.starving = false;
      city.population.starveTicks = 0;

      // Natural Population Growth: advances when food & water are satisfied
      if (city.population.current < city.population.max) {
        city.population.growthProgress = (city.population.growthProgress || 0) + 25;
        if (city.population.growthProgress >= 100) {
          city.population.current += 1;
          city.population.growthProgress = 0;
          popChanged = true;
        }
      }
    } else {
      // Starvation: insufficient food or water!
      city.stockpile.food  = Math.max(0, (city.stockpile.food || 0) - foodDemand);
      city.stockpile.water = Math.max(0, (city.stockpile.water || 0) - waterDemand);
      city.population.starving = true;
      city.population.growthProgress = 0;
      city.population.starveTicks = (city.population.starveTicks || 0) + 1;

      // After 2 consecutive starved ticks, a citizen is lost to famine
      if (city.population.starveTicks >= 2 && city.population.current > 3) {
        city.population.current -= 1;
        city.population.starveTicks = 0;
        popChanged = true;
      }
    }

    if (eventStream && (gains.wood > 0 || gains.stone > 0 || gains.food > 0 || gains.gold > 0 || gains.water > 0 || gains.ore > 0)) {
      eventStream.publish(STREAM_TOPICS.RESOURCE_TICK, {
        cityId: city.id,
        cityName: city.name,
        gains: gains,
        stockpile: {
          wood: city.stockpile.wood,
          stone: city.stockpile.stone,
          food: city.stockpile.food,
          gold: city.stockpile.gold,
          water: city.stockpile.water,
          ore: city.stockpile.ore
        }
      }, state.world.clock.simTimeMs);
    }
  }

  // Immediately re-evaluate Task DAG when population changes (e.g., Frontier Growth to 12)
  if (popChanged) {
    state._dirty = true;
    evaluateTaskDAG(state, eventStream);
  }
}

// Compute live 0..1 interpolation coordinates for smooth real-time unit rendering on the Overworld canvas
function getUnitInterpolatedPosition(unit, currentSimTimeMs) {
  if (!unit) return { x: 0, y: 0, progress: 0 };
  if (unit.status !== 'marching' || !unit.marchPlan) {
    return { x: unit.x, y: unit.y, progress: 0 };
  }
  const mp = unit.marchPlan;
  const start = mp.stepStartSimTimeMs || 0;
  const due   = mp.stepDueSimTimeMs   || (start + 1000);
  const dur   = Math.max(1, due - start);
  const elapsed = Math.max(0, Math.min(dur, currentSimTimeMs - start));
  const t = elapsed / dur;

  const ix = mp.fromX + (mp.toX - mp.fromX) * t;
  const iy = mp.fromY + (mp.toY - mp.fromY) * t;
  return { x: ix, y: iy, progress: t };
}

  // --- Module: src/engine/wargameBridge.js ---
// Shared Cross-Engine Handoff Bridge between Macro Wargame (wargame.html) and Tactical Dungeon Engine (index.html)
// Uses a dedicated localStorage envelope so both engines remain 100% standalone-capable with zero regressions.

const BRIDGE_STORAGE_KEY = 'aethelgard_bridge_handoff_v1';

const BRIDGE_DIRECTIONS = {
  TO_DUNGEON: 'wargame_to_dungeon',
  TO_WARGAME: 'dungeon_to_wargame'
};

function createDungeonEntryEnvelope(data) {
  const src = data || {};
  return {
    version: 1,
    direction: BRIDGE_DIRECTIONS.TO_DUNGEON,
    timestamp: Date.now(),
    campaignId: src.campaignId || 'world_prime',
    seedCode: src.seedCode || 'STAR-7777',
    houseName: src.houseName || 'House Vanguard',
    cityId: src.cityId || null,
    cityName: src.cityName || 'Oakhaven Bastion',
    cityCoords: src.cityCoords ? { x: src.cityCoords.x, y: src.cityCoords.y } : null,
    partyUnitId: src.partyUnitId || null,
    hero: src.hero ? {
      id: src.hero.id || null,
      name: src.hero.name || 'Vanguard Hero',
      classId: src.hero.classId || 'fighter',
      level: typeof src.hero.level === 'number' ? src.hero.level : 1,
      xp: typeof src.hero.xp === 'number' ? src.hero.xp : 0,
      equipment: src.hero.equipment ? JSON.parse(JSON.stringify(src.hero.equipment)) : null,
      cosmetics: src.hero.cosmetics ? JSON.parse(JSON.stringify(src.hero.cosmetics)) : null
    } : null,
    dungeon: src.dungeon ? {
      poiId: src.dungeon.poiId || null,
      dungeonId: src.dungeon.dungeonId || 'dng_starfall',
      profileId: src.dungeon.profileId || 'starfall_vaults',
      name: src.dungeon.name || 'The Starfall Vaults',
      coords: src.dungeon.coords ? { x: src.dungeon.coords.x, y: src.dungeon.coords.y } : null
    } : null
  };
}

function createDungeonReturnEnvelope(data) {
  const src = data || {};
  const loot = src.lootSummary || {};
  return {
    version: 1,
    direction: BRIDGE_DIRECTIONS.TO_WARGAME,
    outcome: src.outcome === 'defeated' ? 'defeated' : 'extracted',
    method: src.method || 'Floor 1 Ascending Stairs (<)',
    timestamp: Date.now(),
    partyUnitId: src.partyUnitId || null,
    heroId: src.heroId || null,
    heroLevel: typeof src.heroLevel === 'number' ? src.heroLevel : 1,
    heroXp: typeof src.heroXp === 'number' ? src.heroXp : 0,
    dungeonId: src.dungeonId || 'dng_starfall',
    dungeonPoiId: src.dungeonPoiId || null,
    killerName: src.killerName || null,
    floorDepth: typeof src.floorDepth === 'number' ? src.floorDepth : 1,
    lootSummary: {
      gold: typeof loot.gold === 'number' ? loot.gold : 0,
      ore: typeof loot.ore === 'number' ? loot.ore : 0,
      gems: typeof loot.gems === 'number' ? loot.gems : 0,
      gearCount: typeof loot.gearCount === 'number' ? loot.gearCount : 0,
      salvagedGold: typeof loot.salvagedGold === 'number' ? loot.salvagedGold : 0
    },
    extractedGear: Array.isArray(src.extractedGear) ? JSON.parse(JSON.stringify(src.extractedGear)) : [],
    heroEquipment: src.heroEquipment ? JSON.parse(JSON.stringify(src.heroEquipment)) : null
  };
}

function writeDungeonEntryHandoff(data) {
  const envelope = createDungeonEntryEnvelope(data);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (e) {
      // Ignore storage quota errors in restricted environments
    }
  }
  return envelope;
}

function writeDungeonReturnHandoff(data) {
  const envelope = createDungeonReturnEnvelope(data);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (e) {
      // Ignore storage quota errors in restricted environments
    }
  }
  return envelope;
}

function peekBridgeHandoff(expectedDirection) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (expectedDirection && parsed.direction !== expectedDirection) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearBridgeHandoff() {
  if (typeof localStorage === 'undefined') return;
  try {
    if (typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(BRIDGE_STORAGE_KEY);
    } else {
      localStorage.setItem(BRIDGE_STORAGE_KEY, '');
    }
  } catch (e) {
    // Ignore storage errors
  }
}

function consumeBridgeHandoff(expectedDirection) {
  const env = peekBridgeHandoff(expectedDirection);
  if (!env) return null;
  clearBridgeHandoff();
  return env;
}

  // --- Module: src/wargame/engine/commandBus.js ---
// Authoritative Command Bus & Simulation Host Engine
// All player actions are dispatched as serializable Command Envelopes, validated, and applied to the World state.










function dispatchWargameCommand(commandEnvelope, state, scheduler, eventStream) {
  if (!commandEnvelope || !commandEnvelope.type) {
    return { ok: false, reason: 'Malformed command envelope' };
  }

  const cmdType = commandEnvelope.type;
  const payload = commandEnvelope.payload || {};
  const simTimeMs = (state && state.world && state.world.clock) ? state.world.clock.simTimeMs : 0;

  function reject(reason) {
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.COMMAND_REJECTED, {
        commandType: cmdType,
        reason: reason
      }, simTimeMs);
    }
    return { ok: false, reason: reason };
  }

  function accept(resultPayload) {
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.COMMAND_ACCEPTED, {
        commandType: cmdType,
        result: resultPayload
      }, simTimeMs);
    }
    return { ok: true, data: resultPayload };
  }

  // ---------------------------------------------------------------------------
  // 1. START NEW CAMPAIGN (Transitions from TITLE -> SETTLER_PIONEER)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.START_NEW_CAMPAIGN) {
    const fresh = createNewCampaignWorldState(payload);
    Object.keys(state).forEach(function(k) { delete state[k]; });
    Object.assign(state, fresh);
    if (scheduler) scheduler.clear();

    evaluateTaskDAG(state, eventStream);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CAMPAIGN_STARTED, {
        houseName: state.world.player.houseName,
        worldName: state.world.name,
        seedCode: state.world.seedCode,
        settlerId: 'unit_settler_1'
      }, 0);
    }
    return accept({ campaignPhase: state.campaignPhase, worldName: state.world.name });
  }

  // Ensure an active world exists for all subsequent commands
  if (!state || !state.world) {
    return reject('No active campaign world');
  }

  const world = state.world;
  const ow = world.overworld;

  // ---------------------------------------------------------------------------
  // 2. ORDER UNIT MARCH (Real-Time A* Pathfinding & Scheduled Step Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.ORDER_UNIT_MARCH) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit) return reject('No active unit selected for march');
    if (unit.status === 'in_dungeon') return reject('Unit is currently delving inside a dungeon');

    const targetX = Number(payload.targetX);
    const targetY = Number(payload.targetY);
    if (isNaN(targetX) || isNaN(targetY)) return reject('Invalid destination coordinates');

    if (unit.x === targetX && unit.y === targetY) {
      return reject('Unit is already at that coordinate');
    }

    if (!isOverworldTilePassable(ow, targetX, targetY)) {
      const tId = (ow.tiles[targetY] && ow.tiles[targetY][targetX]) || 0;
      const tDef = OVERWORLD_TERRAIN_DEFS[tId];
      return reject('Impassable terrain: ' + (tDef ? tDef.name : 'Blocked'));
    }

    const path = findOverworldPath(ow, unit.x, unit.y, targetX, targetY);
    if (!path || path.length === 0) {
      return reject('No passable route to destination');
    }

    // Cancel existing march job if unit was already moving
    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }

    const totalMs = path.reduce(function(sum, st) { return sum + (st.stepDurationMs || 3000); }, 0);
    unit.marchPlan = {
      intent: payload.intent || 'move',
      targetPoiId: payload.targetPoiId || null,
      targetCityId: payload.targetCityId || null,
      targetX: targetX,
      targetY: targetY,
      remainingPath: path,
      totalDurationMs: totalMs,
      activeJobId: null,
      stepStartSimTimeMs: simTimeMs,
      stepDueSimTimeMs: simTimeMs,
      fromX: unit.x,
      fromY: unit.y,
      toX: path[0].x,
      toY: path[0].y
    };

    scheduleNextMarchStep(unit, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_STARTED, {
        unitId: unit.id,
        unitName: unit.shortName,
        fromX: unit.x,
        fromY: unit.y,
        targetX: targetX,
        targetY: targetY,
        stepsCount: path.length,
        totalDurationMs: totalMs
      }, simTimeMs);
    }

    return accept({
      unitId: unit.id,
      stepsCount: path.length,
      totalDurationMs: totalMs,
      path: path
    });
  }

  // ---------------------------------------------------------------------------
  // 3. STEP UNIT ADJACENT (Convenience wrapper around ORDER_UNIT_MARCH)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.STEP_UNIT_ADJACENT) {
    const unit = getSelectedOverworldUnit(state);
    if (!unit) return reject('No active unit selected');
    const dx = Number(payload.dx || 0);
    const dy = Number(payload.dy || 0);
    return dispatchWargameCommand({
      type: COMMAND_TYPES.ORDER_UNIT_MARCH,
      payload: {
        unitId: unit.id,
        targetX: unit.x + dx,
        targetY: unit.y + dy
      }
    }, state, scheduler, eventStream);
  }

  // ---------------------------------------------------------------------------
  // 4. CANCEL UNIT MARCH
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_UNIT_MARCH) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || unit.status !== 'marching' || !unit.marchPlan) {
      return reject('Unit is not currently marching');
    }
    if (unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }
    unit.status = 'idle';
    unit.marchPlan = null;
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_CANCELLED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y
      }, simTimeMs);
    }
    return accept({ unitId: unit.id, x: unit.x, y: unit.y });
  }

  // ---------------------------------------------------------------------------
  // 5. FOUND CITY (Consumes Pioneer Settler & Establishes Primary Bastion)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.FOUND_CITY) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canFoundCity) {
      return reject('Selected unit cannot found a city');
    }

    const tId = ow.tiles[unit.y][unit.x];
    const tDef = OVERWORLD_TERRAIN_DEFS[tId];
    if (!tDef || !tDef.buildable) {
      return reject('Cities can only be founded on Sunlit Grasslands or Verdant River Vales');
    }

    // Cancel any active march
    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }

    // Consume the settler unit
    unit.alive = false;
    unit.status = 'settled';
    unit.marchPlan = null;

    const existingCitiesCount = Object.keys(world.cities || {}).length;
    const cityId = 'city_' + (existingCitiesCount + 1);
    const cityName = String(payload.cityName || (existingCitiesCount === 0 ? 'Oakhaven Bastion' : 'Bastion ' + (existingCitiesCount + 1))).trim();

    // Transfer pioneer realm stockpile into the founded city + grant founding bonus
    const baseStock = world.realmStockpile || { wood: 50, stone: 50, food: 100, gold: 50 };
    const newCity = {
      id: cityId,
      name: cityName,
      x: unit.x,
      y: unit.y,
      level: 1,
      foundedAtSimMs: simTimeMs,
      stockpile: {
        wood:  (baseStock.wood  || 0) + 40,
        stone: (baseStock.stone || 0) + 40,
        food:  (baseStock.food  || 0) + 50,
        gold:  (baseStock.gold  || 0) + 25,
        water: (baseStock.water || 0) + 30,
        ore:   (baseStock.ore   || 0) + 15,
        ingots: 0
      },
      provisions: {
        potions: 2,
        recalls: 1
      },
      gems: {
        ruby: 1,
        emerald: 1,
        sapphire: 0,
        topaz: 0,
        void_diamond: 0
      },
      // IMPORTANT: Only town_hall / meeting_hall starts at level 1!
      buildings: {
        town_hall: 1,
        meeting_hall: 1
      },
      population: {
        current: 5,
        max: 10,
        growthProgress: 0,
        starving: false,
        starveTicks: 0
      },
      plots: createDefaultCityPlots(),
      selectedPlotIndex: CITY_CENTER_PLOT_INDEX !== undefined ? CITY_CENTER_PLOT_INDEX : 27,
      buildQueue: [],
      maxBuildQueueSlots: BASE_BUILD_QUEUE_LIMIT || 3,
      recruitmentQueue: [],
      maxRecruitQueueSlots: BASE_RECRUIT_QUEUE_LIMIT || 3,
      storage: createInventoryContainer('city_storage_' + cityId, cityName + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200)
    };

    world.cities[cityId] = newCity;
    world.activeCityId = cityId;
    world.stats.citiesFounded = (world.stats.citiesFounded || 0) + 1;

    if (state.campaignPhase === CAMPAIGN_PHASES.SETTLER_PIONEER) {
      state.campaignPhase = CAMPAIGN_PHASES.CITY_ESTABLISHED;
    }

    revealOverworldVision(ow, newCity.x, newCity.y, 5);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CITY_FOUNDED, {
        cityId: newCity.id,
        cityName: newCity.name,
        x: newCity.x,
        y: newCity.y
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);

    return accept({
      city: newCity,
      campaignPhase: state.campaignPhase
    });
  }

  // ---------------------------------------------------------------------------
  // 6. RESPAWN SETTLER (Safe Non-Permanent Loss Recovery before City Founding)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RESPAWN_SETTLER) {
    if (Object.keys(world.cities || {}).length > 0) {
      return reject('Cannot respawn starter settler after a city has been established');
    }
    const existingAlive = (ow.units || []).find(function(u) { return u.unitType === 'settler' && u.alive; });
    if (existingAlive) {
      return reject('Pioneer Settler is still active on the Overworld');
    }

    const settlerArch = UNIT_ARCHETYPES.settler;
    const revived = {
      id: 'unit_settler_' + (ow.units.length + 1),
      name: settlerArch.name,
      shortName: settlerArch.shortName,
      unitType: 'settler',
      x: ow.spawnX,
      y: ow.spawnY,
      hp: settlerArch.maxHp,
      maxHp: settlerArch.maxHp,
      visionRadius: settlerArch.visionRadius,
      canFoundCity: true,
      canEnterDungeon: false,
      alive: true,
      status: 'idle',
      marchPlan: null
    };

    ow.units.push(revived);
    ow.selectedUnitId = revived.id;
    revealOverworldVision(ow, revived.x, revived.y, revived.visionRadius);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.SETTLER_RESPAWNED, {
        unitId: revived.id,
        x: revived.x,
        y: revived.y
      }, simTimeMs);
    }

    return accept({ settler: revived });
  }

  // ---------------------------------------------------------------------------
  // 6B. SELECT CITY PLOT (Focus Inspector on Specific 8x8 Grid Plot)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SELECT_CITY_PLOT) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');
    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    if (plotIndex < 0 || plotIndex >= (city.plots ? city.plots.length : (CITY_TOTAL_PLOTS || 64))) {
      return reject('Invalid city plot coordinate: ' + plotIndex);
    }
    city.selectedPlotIndex = plotIndex;
    return accept({ selectedPlotIndex: plotIndex });
  }

  // ---------------------------------------------------------------------------
  // 7. QUEUE BUILDING (Real-Time City Construction Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.QUEUE_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const buildingId = payload.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[buildingId];
    if (!bDef) return reject('Unknown building type: ' + buildingId);

    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === plotIndex; });
    if (!plot) return reject('Invalid city building plot');

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || 3)) {
      return reject('City construction queue is full');
    }

    if (plot.underConstruction || plot.demolishing || plot.relocating) {
      return reject('That plot already has an active order');
    }

    const isSameBuilding = (plot.buildingId === buildingId) ||
      (plot.buildingId === 'town_hall' && buildingId === 'meeting_hall') ||
      (plot.buildingId === 'meeting_hall' && buildingId === 'town_hall') ||
      (plot.buildingId === 'farmstead' && buildingId === 'garden') ||
      (plot.buildingId === 'garden' && buildingId === 'farmstead') ||
      (plot.buildingId === 'sawmill' && (buildingId === 'lumber_camp' || buildingId === 'lumber_hut')) ||
      (plot.buildingId === 'lumber_hut' && (buildingId === 'lumber_camp' || buildingId === 'sawmill')) ||
      (plot.buildingId === 'lumber_camp' && (buildingId === 'sawmill' || buildingId === 'lumber_hut'));

    if (plot.buildingId && !isSameBuilding) {
      return reject('Plot is already occupied by ' + plot.buildingId);
    }

    // Check building prerequisites & population requirements
    if (!isBuildingPrerequisiteMet(city, buildingId)) {
      const reason = getBuildingPrerequisiteMissingReason(city, buildingId);
      return reject(reason || 'Prerequisites not met');
    }

    const currentLevel = isSameBuilding ? (plot.level || 0) : 0;
    const targetLevel = currentLevel + 1;
    if (targetLevel > (bDef.maxLevel || 5)) {
      return reject(bDef.name + ' has reached maximum level');
    }

    // Meeting Hall Rule: No building in the city can exceed the level of the Meeting Hall
    if (buildingId !== 'meeting_hall' && buildingId !== 'town_hall') {
      const meetingHallLevel = Math.max(
        (city.buildings && city.buildings.meeting_hall) || 0,
        (city.buildings && city.buildings.town_hall) || 0,
        1
      );
      if (targetLevel > meetingHallLevel) {
        return reject('Cannot exceed Meeting Hall level (' + meetingHallLevel + ')');
      }
    }

    const cost = computeBuildingUpgradeCost(buildingId, targetLevel);
    const stock = city.stockpile;
    if ((stock.wood  || 0) < (cost.wood  || 0) ||
        (stock.stone || 0) < (cost.stone || 0) ||
        (stock.gold  || 0) < (cost.gold  || 0) ||
        (stock.water || 0) < (cost.water || 0) ||
        (stock.ore   || 0) < (cost.ore   || 0)) {
      return reject('Insufficient city stockpiles (Need ' + cost.wood + ' Wood, ' + cost.stone + ' Stone, ' + cost.gold + ' Gold)');
    }

    // Deduct construction cost upfront
    stock.wood  = (stock.wood  || 0) - (cost.wood  || 0);
    stock.stone = (stock.stone || 0) - (cost.stone || 0);
    stock.gold  = (stock.gold  || 0) - (cost.gold  || 0);
    if (cost.water) stock.water = (stock.water || 0) - cost.water;
    if (cost.ore)   stock.ore   = (stock.ore   || 0) - cost.ore;

    const durationMs = computeBuildingDurationMs(buildingId, targetLevel);
    const queueItem = {
      queueItemId: 'q_' + city.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      cityId: city.id,
      plotIndex: plot.plotIndex,
      buildingId: buildingId,
      buildingName: bDef.name,
      targetLevel: targetLevel,
      previousLevel: currentLevel,
      cost: cost,
      durationMs: durationMs,
      status: 'queued', // 'queued' | 'building'
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    plot.underConstruction = true;
    city.selectedPlotIndex = plot.plotIndex;
    city.buildQueue.push(queueItem);

    // If this is the front of the queue, schedule the completion timer immediately
    activateNextCityBuildQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.BUILDING_QUEUED, {
        cityId: city.id,
        cityName: city.name,
        buildingId: buildingId,
        buildingName: bDef.name,
        targetLevel: targetLevel,
        plotIndex: plot.plotIndex,
        durationMs: durationMs
      }, simTimeMs);
    }

    return accept({
      queueItem: queueItem,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 7B. MOVE BUILDING (Timed Relocation to an Empty 8x8 Grid Plot)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.MOVE_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const fromIdx = typeof payload.fromPlotIndex === 'number' ? payload.fromPlotIndex : -1;
    const toIdx   = typeof payload.toPlotIndex === 'number' ? payload.toPlotIndex : -1;

    const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === fromIdx; });
    const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === toIdx; });

    if (!fromPlot) return reject('Invalid source plot: ' + fromIdx);
    if (!toPlot)   return reject('Invalid destination plot: ' + toIdx);
    if (fromIdx === toIdx) return reject('Destination plot must be different from source');

    if (!fromPlot.buildingId || (fromPlot.level || 0) <= 0) {
      return reject('No building exists on source plot');
    }

    if (fromPlot.underConstruction || fromPlot.demolishing || fromPlot.relocating) {
      return reject('Source plot is currently undergoing an active order');
    }

    if (toPlot.buildingId || toPlot.underConstruction || toPlot.demolishing || toPlot.relocating) {
      return reject('Destination plot is already occupied or undergoing an order');
    }

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || BASE_BUILD_QUEUE_LIMIT || 3)) {
      return reject('City construction queue is full');
    }

    const bId = fromPlot.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[bId];
    const lvl = fromPlot.level || 1;
    const durMs = BASE_MOVE_BUILDING_DURATION_MS || 2500;

    const queueItem = {
      queueItemId: 'move_' + city.id + '_p' + fromIdx + '_to_p' + toIdx + '_' + Date.now(),
      cityId: city.id,
      fromPlotIndex: fromIdx,
      toPlotIndex: toIdx,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      level: lvl,
      type: 'move',
      durationMs: durMs,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    fromPlot.relocating = true;
    toPlot.relocating = true;
    city.selectedPlotIndex = toIdx;
    city.buildQueue.push(queueItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    return accept({ queueItem: queueItem });
  }

  // ---------------------------------------------------------------------------
  // 8. CANCEL BUILDING IN QUEUE (Prorated Refund + 50% Time Spent Cleanup Job)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city || !Array.isArray(city.buildQueue) || city.buildQueue.length === 0) {
      return reject('No queued construction to cancel');
    }

    const qId = payload.queueItemId;
    const idx = qId
      ? city.buildQueue.findIndex(function(q) { return q.queueItemId === qId; })
      : (typeof payload.plotIndex === 'number'
          ? city.buildQueue.findIndex(function(q) { return q.plotIndex === payload.plotIndex; })
          : city.buildQueue.length - 1);

    if (idx === -1) return reject('Construction item not found');
    const targetItem = city.buildQueue[idx];

    if (targetItem.type === 'cleanup') {
      return reject('Site cleanup cannot be cancelled');
    }

    if (targetItem.type === 'move') {
      city.buildQueue.splice(idx, 1);
      if (targetItem.jobId && scheduler) {
        scheduler.cancelJob(targetItem.jobId);
      }
      const fromPlot = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.fromPlotIndex; });
      const toPlot   = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.toPlotIndex; });
      if (fromPlot) { fromPlot.relocating = false; fromPlot.activeJobId = null; }
      if (toPlot)   { toPlot.relocating = false; toPlot.activeJobId = null; }
      activateNextCityBuildQueueItem(city, state, scheduler);
      return accept({ cancelled: targetItem });
    }

    if (targetItem.status === 'queued') {
      // Pending item: 100% full refund
      city.buildQueue.splice(idx, 1);
      if (targetItem.cost) {
        city.stockpile.wood  = (city.stockpile.wood  || 0) + (targetItem.cost.wood  || 0);
        city.stockpile.stone = (city.stockpile.stone || 0) + (targetItem.cost.stone || 0);
        city.stockpile.gold  = (city.stockpile.gold  || 0) + (targetItem.cost.gold  || 0);
        if (targetItem.cost.water) city.stockpile.water = (city.stockpile.water || 0) + targetItem.cost.water;
        if (targetItem.cost.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + targetItem.cost.ore;
      }
      const plot = (city.plots || []).find(function(p) { return p.plotIndex === targetItem.plotIndex; });
      if (plot) {
        plot.underConstruction = false;
        plot.demolishing = false;
        plot.activeJobId = null;
      }
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.BUILDING_CANCELLED, {
          cityId: city.id,
          buildingId: targetItem.buildingId,
          buildingName: targetItem.buildingName,
          refundRatio: 1.0
        }, simTimeMs);
      }
      return accept({ cancelled: targetItem, stockpile: city.stockpile });
    }

    // Active item (status === 'building'):
    // Calculate elapsed time & prorated refund based on remaining time ratio (1.0 - elapsed / dur)
    if (targetItem.jobId && scheduler) {
      scheduler.cancelJob(targetItem.jobId);
    }
    const elapsed = Math.max(0, simTimeMs - (targetItem.startSimTimeMs || simTimeMs));
    const totalDur = Math.max(1, targetItem.durationMs || 4000);
    const unspentRatio = Math.max(0, Math.min(1, 1.0 - (elapsed / totalDur)));

    if (targetItem.cost) {
      city.stockpile.wood  = (city.stockpile.wood  || 0) + Math.floor((targetItem.cost.wood  || 0) * unspentRatio);
      city.stockpile.stone = (city.stockpile.stone || 0) + Math.floor((targetItem.cost.stone || 0) * unspentRatio);
      city.stockpile.gold  = (city.stockpile.gold  || 0) + Math.floor((targetItem.cost.gold  || 0) * unspentRatio);
      if (targetItem.cost.water) city.stockpile.water = (city.stockpile.water || 0) + Math.floor(targetItem.cost.water * unspentRatio);
      if (targetItem.cost.ore)   city.stockpile.ore   = (city.stockpile.ore   || 0) + Math.floor(targetItem.cost.ore * unspentRatio);
    }

    // Replace the active queue item with a cleanup job taking 50% of already spent time (min 1000ms)
    const cleanupDur = Math.max(1000, Math.floor(elapsed * (CANCEL_CLEANUP_TIME_RATIO || 0.50)));
    const cleanupItem = {
      queueItemId: 'cleanup_' + targetItem.queueItemId,
      cityId: city.id,
      plotIndex: targetItem.plotIndex,
      buildingId: targetItem.buildingId,
      buildingName: targetItem.buildingName,
      type: 'cleanup',
      previousLevel: targetItem.previousLevel || 0,
      durationMs: cleanupDur,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    city.buildQueue.splice(idx, 1, cleanupItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.BUILDING_CANCELLED, {
        cityId: city.id,
        buildingId: targetItem.buildingId,
        buildingName: targetItem.buildingName,
        refundRatio: unspentRatio,
        cleanupDurationMs: cleanupDur
      }, simTimeMs);
    }

    return accept({ cancelled: targetItem, cleanup: cleanupItem, stockpile: city.stockpile });
  }

  // ---------------------------------------------------------------------------
  // 8B. DEMOLISH BUILDING (Takes 50% Build Time & Yields 35% Salvage)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DEMOLISH_BUILDING) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city) return reject('No city founded yet');

    const plotIndex = typeof payload.plotIndex === 'number' ? payload.plotIndex : -1;
    const plot = (city.plots || []).find(function(p) { return p.plotIndex === plotIndex; });
    if (!plot || !plot.buildingId || (plot.level || 0) <= 0) {
      return reject('No established building to demolish on this plot');
    }

    if (plot.buildingId === 'town_hall' || plot.buildingId === 'meeting_hall') {
      return reject('The Meeting Hall cannot be demolished');
    }

    if (plot.underConstruction || plot.demolishing) {
      return reject('Plot already has an active construction or demolition order');
    }

    if (city.buildQueue.length >= (city.maxBuildQueueSlots || BASE_BUILD_QUEUE_LIMIT || 3)) {
      return reject('City construction queue is full');
    }

    const bId = plot.buildingId;
    const bDef = CITY_BUILDINGS_CATALOG[bId];
    const lvl = plot.level || 1;
    const cost = computeBuildingUpgradeCost(bId, lvl);
    const baseDur = computeBuildingDurationMs(bId, lvl);

    const demolishDur = Math.max(2000, Math.floor(baseDur * (CANCEL_CLEANUP_TIME_RATIO || 0.50)));
    const salvage = {
      wood:  Math.floor((cost.wood  || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      stone: Math.floor((cost.stone || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      gold:  Math.floor((cost.gold  || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      water: Math.floor((cost.water || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      ore:   Math.floor((cost.ore   || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35))
    };

    const queueItem = {
      queueItemId: 'demolish_' + city.id + '_p' + plot.plotIndex + '_' + Date.now(),
      cityId: city.id,
      plotIndex: plot.plotIndex,
      buildingId: bId,
      buildingName: bDef ? bDef.name : bId,
      type: 'demolish',
      durationMs: demolishDur,
      salvage: salvage,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    plot.demolishing = true;
    city.buildQueue.push(queueItem);
    activateNextCityBuildQueueItem(city, state, scheduler);

    return accept({ queueItem: queueItem, salvage: salvage });
  }

  // ---------------------------------------------------------------------------
  // 9. RECRUIT HERO (Real-Time 60s Training in Recruitment Queue)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RECRUIT_HERO) {
    const city = getPrimaryCity(state);
    if (!city) {
      return reject('You must found a Bastion City before recruiting heroes');
    }

    const classId = payload.classId || 'adventurer';
    const classDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === classId; });
    if (!classDef) {
      return reject('Unknown hero class: ' + classId);
    }

    const unlockedClasses = getCityRecruitableClasses(city);
    if (unlockedClasses.indexOf(classId) === -1) {
      return reject('Build or upgrade the required Guild Hall / Chapterhouse to recruit ' + classDef.name);
    }

    if (!Array.isArray(city.recruitmentQueue)) {
      city.recruitmentQueue = [];
    }

    // Enforce global Hero Roster Cap (ADR-0012: starts at 3, dismiss a Hero to recruit another)
    const maxHeroes = (world.roster && world.roster.maxHeroes) ? world.roster.maxHeroes : (BASE_MAX_HERO_ROSTER || 3);
    const totalActiveAndQueued = (world.heroes ? world.heroes.length : 0) + city.recruitmentQueue.length;
    if (totalActiveAndQueued >= maxHeroes) {
      return reject('Hero roster is full (' + totalActiveAndQueued + '/' + maxHeroes + '). Dismiss a Hero before recruiting another.');
    }

    if (city.recruitmentQueue.length >= (city.maxRecruitQueueSlots || BASE_RECRUIT_QUEUE_LIMIT || 3)) {
      return reject('Hero training grounds are full (Maximum ' + (city.maxRecruitQueueSlots || 3) + ' in training queue)');
    }

    if ((city.stockpile.gold || 0) < classDef.costGold || (city.stockpile.food || 0) < classDef.costFood) {
      return reject('Insufficient Gold or Food to swear in ' + classDef.name + ' (Need ' + classDef.costGold + ' Gold, ' + classDef.costFood + ' Food)');
    }

    city.stockpile.gold -= classDef.costGold;
    city.stockpile.food -= classDef.costFood;

    const heroIndex = (world.heroes || []).length + city.recruitmentQueue.length + 1;
    const heroName = String(payload.heroName || (classDef.name + ' #' + heroIndex)).trim();
    const queueItem = {
      queueItemId: 'rec_' + city.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      cityId: city.id,
      classId: classDef.classId,
      className: classDef.name,
      heroName: heroName,
      costGold: classDef.costGold,
      costFood: classDef.costFood,
      durationMs: BASE_HERO_RECRUIT_DURATION_MS,
      status: 'queued',
      jobId: null,
      startSimTimeMs: null,
      dueSimTimeMs: null
    };

    city.recruitmentQueue.push(queueItem);
    activateNextCityRecruitQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_RECRUIT_STARTED, {
        cityId: city.id,
        classId: classDef.classId,
        heroName: heroName,
        durationMs: BASE_HERO_RECRUIT_DURATION_MS
      }, simTimeMs);
    }

    return accept({
      queueItem: queueItem,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 9B. CANCEL HERO RECRUITMENT (Prorated Refund of Gold & Food)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CANCEL_RECRUITMENT) {
    const city = (payload.cityId && world.cities[payload.cityId]) || getPrimaryCity(state);
    if (!city || !Array.isArray(city.recruitmentQueue) || city.recruitmentQueue.length === 0) {
      return reject('No queued hero training to cancel');
    }

    const qId = payload.queueItemId;
    const idx = qId
      ? city.recruitmentQueue.findIndex(function(q) { return q.queueItemId === qId; })
      : city.recruitmentQueue.length - 1;

    if (idx === -1) return reject('Recruitment item not found');
    const removed = city.recruitmentQueue.splice(idx, 1)[0];

    let refundRatio = 1.0;
    if (removed.status === 'training') {
      if (removed.jobId && scheduler) {
        scheduler.cancelJob(removed.jobId);
      }
      const elapsed = Math.max(0, simTimeMs - (removed.startSimTimeMs || simTimeMs));
      const totalDur = Math.max(1, removed.durationMs || BASE_HERO_RECRUIT_DURATION_MS);
      refundRatio = Math.max(0, Math.min(1, 1.0 - (elapsed / totalDur)));
    }

    const refGold = Math.floor((removed.costGold || 0) * refundRatio);
    const refFood = Math.floor((removed.costFood || 0) * refundRatio);
    city.stockpile.gold = (city.stockpile.gold || 0) + refGold;
    city.stockpile.food = (city.stockpile.food || 0) + refFood;

    // Start next recruitment item if front was cancelled
    activateNextCityRecruitQueueItem(city, state, scheduler);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_RECRUIT_CANCEL, {
        cityId: city.id,
        classId: removed.classId,
        heroName: removed.heroName,
        refundGold: refGold,
        refundFood: refFood,
        refundRatio: refundRatio
      }, simTimeMs);
    }

    return accept({
      cancelled: removed,
      refundGold: refGold,
      refundFood: refFood,
      stockpile: city.stockpile
    });
  }

  // ---------------------------------------------------------------------------
  // 9B2. EQUIP / UNEQUIP HERO EQUIPMENT (Shared Character Sheet Operations)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.EQUIP_HERO_ITEM) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    if (!hero.equipment) hero.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };

    const itemIdx = hero.bagGear.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (itemIdx === -1) return reject('Item not found in hero pack');
    const item = hero.bagGear.splice(itemIdx, 1)[0];
    const slot = item.slot;
    if (!slot || !(slot in hero.equipment)) {
      hero.bagGear.push(item);
      return reject('Unsupported equipment slot: ' + slot);
    }

    const prev = hero.equipment[slot];
    if (prev) {
      hero.bagGear.push(prev);
    }
    hero.equipment[slot] = item;
    return accept({ heroId: hero.id, slot: slot, equipped: item, swappedOut: prev || null });
  }

  if (cmdType === COMMAND_TYPES.UNEQUIP_HERO_ITEM) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    const slot = payload.slot;
    if (slot === 'pickaxe') return reject('Pickaxe cannot be unequipped directly');
    if (!hero.equipment || !hero.equipment[slot]) return reject('No item equipped in ' + slot);
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];

    const removed = hero.equipment[slot];
    hero.equipment[slot] = null;
    hero.bagGear.push(removed);
    return accept({ heroId: hero.id, slot: slot, unequipped: removed });
  }

  if (cmdType === COMMAND_TYPES.AUTO_EQUIP_HERO) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    if (!hero.equipment) hero.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };

    function scoreGear(it) {
      if (!it) return -1;
      return (it.atk || 0) * 3 + (it.def || 0) * 2.5 + (it.hp || 0) * 0.4 + (it.mp || 0) * 0.3 + (it.tier || 0) * 15;
    }

    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    let equippedCount = 0;
    for (let s = 0; s < slots.length; s++) {
      const sl = slots[s];
      const candidates = hero.bagGear.filter(function(g) { return g && g.slot === sl; });
      if (candidates.length === 0) continue;
      candidates.sort(function(a, b) { return scoreGear(b) - scoreGear(a); });
      const best = candidates[0];
      const cur = hero.equipment[sl];
      if (scoreGear(best) > scoreGear(cur)) {
        const idx = hero.bagGear.indexOf(best);
        if (idx !== -1) hero.bagGear.splice(idx, 1);
        hero.equipment[sl] = best;
        if (cur) hero.bagGear.push(cur);
        equippedCount++;
      }
    }
    return accept({ heroId: hero.id, equippedCount: equippedCount });
  }

  // ---------------------------------------------------------------------------
  // 9B3. HERO ROSTER MANAGEMENT (Dismiss Hero, Overall Leader, Garrison Party)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DISMISS_HERO) {
    const heroIdx = (world.heroes || []).findIndex(function(h) { return h.id === payload.heroId; });
    if (heroIdx === -1) return reject('Hero not found in roster');
    const hero = world.heroes[heroIdx];
    const city = getPrimaryCity(state);

    // Safely deposit all hero equipment & bag gear into City Vault Storage!
    if (city) {
      if (!city.storage || !Array.isArray(city.storage.items)) {
        city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
      }
      if (hero.equipment) {
        const eqKeys = Object.keys(hero.equipment);
        for (let i = 0; i < eqKeys.length; i++) {
          const it = hero.equipment[eqKeys[i]];
          if (it) city.storage.items.push(it);
        }
      }
      if (Array.isArray(hero.bagGear)) {
        for (let i = 0; i < hero.bagGear.length; i++) {
          if (hero.bagGear[i]) city.storage.items.push(hero.bagGear[i]);
        }
      }
    }

    world.heroes.splice(heroIdx, 1);

    // Remove or clean up Overworld unit led by this dismissed hero
    if (ow && Array.isArray(ow.units)) {
      for (let u = 0; u < ow.units.length; u++) {
        if (ow.units[u].leaderHeroId === hero.id) {
          if (ow.units[u].marchPlan && ow.units[u].marchPlan.activeJobId && scheduler) {
            scheduler.cancelJob(ow.units[u].marchPlan.activeJobId);
          }
          ow.units[u].alive = false;
          ow.units[u].status = 'dismissed';
        }
      }
    }

    // Remove from any party
    if (Array.isArray(world.parties)) {
      world.parties = world.parties.filter(function(pt) {
        if (Array.isArray(pt.memberHeroIds)) {
          pt.memberHeroIds = pt.memberHeroIds.filter(function(mid) { return mid !== hero.id; });
        }
        if (Array.isArray(pt.memberIds)) {
          pt.memberIds = pt.memberIds.filter(function(mid) { return mid !== hero.id; });
        }
        return pt.leaderHeroId !== hero.id;
      });
    }

    // Reassign Overall Leader if the dismissed hero was leader
    if (world.roster && world.roster.overallLeaderHeroId === hero.id) {
      world.roster.overallLeaderHeroId = world.heroes.length > 0 ? world.heroes[0].id : null;
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.HERO_DISMISSED, {
        heroId: hero.id,
        heroName: hero.name
      }, simTimeMs);
    }
    return accept({ dismissedHeroId: hero.id, remainingHeroes: world.heroes.length });
  }

  if (cmdType === COMMAND_TYPES.SET_OVERALL_LEADER) {
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found in roster');
    if (!world.roster) world.roster = { maxHeroes: BASE_MAX_HERO_ROSTER || 3, overallLeaderHeroId: null };
    world.roster.overallLeaderHeroId = hero.id;
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.LEADER_CHANGED, {
        heroId: hero.id,
        heroName: hero.name
      }, simTimeMs);
    }
    return accept({ overallLeaderHeroId: hero.id });
  }

  if (cmdType === COMMAND_TYPES.ASSIGN_HERO_TO_PARTY) {
    const city = getPrimaryCity(state);
    if (!city) return reject('Requires an established City');
    const maxSize = computeMaxPartySize(city);
    const party = (world.parties || []).find(function(pt) { return pt.id === payload.partyId; });
    if (!party) return reject('Party not found');
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(party.memberIds)) party.memberIds = [];
    if (party.memberIds.indexOf(hero.id) !== -1) return reject('Hero is already in this party');
    if (party.memberIds.length >= maxSize) {
      return reject('Party is at maximum capacity (' + maxSize + '). Build or upgrade the City Garrison to add more Heroes to a Party.');
    }
    party.memberIds.push(hero.id);
    return accept({ partyId: party.id, memberIds: party.memberIds.slice(), maxPartySize: maxSize });
  }

  // ---------------------------------------------------------------------------
  // 9B4. CITY VAULT STORAGE CONTAINER (Deposit, Withdraw, Dump Bag — ADR-0012)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.DEPOSIT_TO_CITY_STORAGE) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero || !Array.isArray(hero.bagGear)) return reject('Hero not found');
    if (city.storage.items.length >= (city.storage.capacity || 200)) {
      return reject('City Vault Storage is full');
    }
    const idx = hero.bagGear.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (idx === -1) return reject('Item not found in hero pack');
    const item = hero.bagGear.splice(idx, 1)[0];
    city.storage.items.push(item);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'deposit', itemName: item.name }, simTimeMs);
    }
    return accept({ item: item, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero) return reject('Hero not found');
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    const idx = city.storage.items.findIndex(function(it) { return it.uid === payload.itemUid; });
    if (idx === -1) return reject('Item not found in City Vault Storage');
    const item = city.storage.items.splice(idx, 1)[0];
    hero.bagGear.push(item);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'withdraw', itemName: item.name }, simTimeMs);
    }
    return accept({ item: item, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.DUMP_HERO_BAG_TO_CITY) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }
    const hero = (world.heroes || []).find(function(h) { return h.id === payload.heroId; });
    if (!hero || !Array.isArray(hero.bagGear) || hero.bagGear.length === 0) {
      return reject('Hero pack is already empty');
    }
    const cap = city.storage.capacity || 200;
    let movedCount = 0;
    while (hero.bagGear.length > 0 && city.storage.items.length < cap) {
      city.storage.items.push(hero.bagGear.shift());
      movedCount++;
    }
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.STORAGE_UPDATED, { cityId: city.id, action: 'dump', count: movedCount }, simTimeMs);
    }
    return accept({ movedCount: movedCount, storageCount: city.storage.items.length });
  }

  // ---------------------------------------------------------------------------
  // 9B5. TIER 2 CITY INDUSTRY (Smeltery Ingots & Apothecary Provisions — Inc 9.6)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SMELT_INGOTS) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const smelteryLvl = (city.buildings && city.buildings.smeltery) || 0;
    if (smelteryLvl < 1) return reject('Construct a Dwarven Smeltery before smelting ingots');

    const batches = Math.max(1, Math.min(10, Math.round(Number(payload.batches) || 1)));
    const oreCost = 5 * batches;
    const woodCost = 5 * batches;
    const yieldIngots = 2 * batches;

    if ((city.stockpile.ore || 0) < oreCost || (city.stockpile.wood || 0) < woodCost) {
      return reject('Insufficient materials (Need ' + oreCost + ' Ore and ' + woodCost + ' Wood)');
    }
    city.stockpile.ore -= oreCost;
    city.stockpile.wood -= woodCost;
    city.stockpile.ingots = (city.stockpile.ingots || 0) + yieldIngots;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'smeltery',
        itemName: 'Forged Ingots',
        qty: yieldIngots
      }, simTimeMs);
    }
    return accept({ ingotsAdded: yieldIngots, totalIngots: city.stockpile.ingots });
  }

  if (cmdType === COMMAND_TYPES.BREW_PROVISION) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const apothLvl = (city.buildings && city.buildings.apothecary) || 0;
    if (apothLvl < 1) return reject('Construct an Alchemist Apothecary before brewing provisions');
    if (!city.provisions) city.provisions = { potions: 0, recalls: 0 };

    const kind = payload.kind === 'recalls' ? 'recalls' : 'potions';
    if (kind === 'potions') {
      if ((city.stockpile.food || 0) < 10 || (city.stockpile.water || 0) < 10 || (city.stockpile.gold || 0) < 10) {
        return reject('Need 10 Food, 10 Water, and 10 Gold to brew a Healing Tonic');
      }
      city.stockpile.food -= 10;
      city.stockpile.water -= 10;
      city.stockpile.gold -= 10;
      city.provisions.potions = (city.provisions.potions || 0) + 1;
    } else {
      if ((city.stockpile.gold || 0) < 25 || (city.stockpile.ore || 0) < 5) {
        return reject('Need 25 Gold and 5 Ore to scribe an Astral Recall Scroll');
      }
      city.stockpile.gold -= 25;
      city.stockpile.ore -= 5;
      city.provisions.recalls = (city.provisions.recalls || 0) + 1;
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'apothecary',
        itemName: kind === 'potions' ? 'Healing Tonic' : 'Astral Recall Scroll',
        qty: 1
      }, simTimeMs);
    }
    return accept({ kind: kind, provisions: Object.assign({}, city.provisions) });
  }

  // ---------------------------------------------------------------------------
  // 9B6. CITY BLACKSMITH (Star-Forge) & LAPIDARY WORKSHOP (Inc 9.7)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.FORGE_EQUIPMENT) {
    const city = getPrimaryCity(state);
    if (!city) return reject('No City founded');
    const bsLvl = (city.buildings && city.buildings.blacksmith) || 0;
    if (bsLvl < 1) return reject('Construct a Blacksmith & Star-Forge before forging equipment');
    if (!city.storage || !Array.isArray(city.storage.items)) {
      city.storage = createInventoryContainer('city_storage_' + city.id, city.name + ' Vault Storage', CITY_STORAGE_BASE_CAPACITY || 200);
    }

    const slot = payload.slot || 'weapon';
    const validSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    if (validSlots.indexOf(slot) === -1) return reject('Invalid equipment slot: ' + slot);

    const ingotCost = 3 + bsLvl;
    const goldCost = 20 + bsLvl * 10;
    if ((city.stockpile.ingots || 0) < ingotCost || (city.stockpile.gold || 0) < goldCost) {
      return reject('Need ' + ingotCost + ' Forged Ingots and ' + goldCost + ' Gold to forge ' + slot);
    }
    city.stockpile.ingots -= ingotCost;
    city.stockpile.gold -= goldCost;

    const rarity = bsLvl >= 3 ? 'epic' : (bsLvl >= 2 ? 'rare' : 'uncommon');
    const socketCount = bsLvl >= 3 ? 2 : (bsLvl >= 2 ? 1 : 0);
    const tierName = bsLvl >= 3 ? 'Star-Forged' : (bsLvl >= 2 ? 'Tempered' : 'Forged');
    const slotNames = {
      weapon: 'Greatsword',
      armor: 'Plate Cuirass',
      helm: 'Greathelm',
      boots: 'War Greaves',
      accessory: 'Runic Signet',
      pickaxe: 'Mithril Pickaxe'
    };

    const forged = {
      uid: 'forge_' + slot + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      slot: slot,
      name: tierName + ' ' + slotNames[slot],
      rarity: rarity,
      atk: slot === 'weapon' ? (10 + bsLvl * 4) : (slot === 'accessory' ? (3 + bsLvl * 2) : 0),
      def: (slot === 'armor' || slot === 'helm' || slot === 'boots') ? (5 + bsLvl * 3) : (slot === 'accessory' ? (2 + bsLvl) : 0),
      hp: slot === 'armor' ? (10 + bsLvl * 6) : 0,
      tier: slot === 'pickaxe' ? Math.min(4, 1 + bsLvl) : undefined,
      maxDurability: slot === 'pickaxe' ? (30 + bsLvl * 10) : undefined,
      durability: slot === 'pickaxe' ? (30 + bsLvl * 10) : undefined,
      sockets: socketCount,
      gems: [],
      temperRank: 0,
      value: 45 + bsLvl * 30
    };

    city.storage.items.push(forged);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'blacksmith',
        itemName: forged.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: forged, storageCount: city.storage.items.length });
  }

  if (cmdType === COMMAND_TYPES.TEMPER_EQUIPMENT) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const bsLvl = (city.buildings && city.buildings.blacksmith) || 0;
    if (bsLvl < 1) return reject('Requires Blacksmith & Star-Forge');

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    const curRank = item.temperRank || 0;
    if (curRank >= 3) return reject(item.name + ' is already at maximum Temper Rank (+3)');

    if ((city.stockpile.ingots || 0) < 2 || (city.stockpile.gold || 0) < 20) {
      return reject('Need 2 Forged Ingots and 20 Gold to temper equipment');
    }
    city.stockpile.ingots -= 2;
    city.stockpile.gold -= 20;

    item.temperRank = curRank + 1;
    if (item.slot === 'weapon' || item.slot === 'accessory') {
      item.atk = (item.atk || 0) + 2;
    } else {
      item.def = (item.def || 0) + 2;
    }
    item.value = (item.value || 30) + 25;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'blacksmith',
        itemName: item.name + ' (+' + item.temperRank + ')',
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, temperRank: item.temperRank });
  }

  if (cmdType === COMMAND_TYPES.PUNCH_SOCKET) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before punching gem sockets');

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    const curSockets = item.sockets || 0;
    if (curSockets >= 2) return reject(item.name + ' already has the maximum 2 Gem Sockets');

    if ((city.stockpile.ingots || 0) < 2 || (city.stockpile.gold || 0) < 35) {
      return reject('Need 2 Forged Ingots and 35 Gold to punch a Gem Socket');
    }
    city.stockpile.ingots -= 2;
    city.stockpile.gold -= 35;

    item.sockets = curSockets + 1;
    if (!Array.isArray(item.gems)) item.gems = [];
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'lapidary',
        itemName: 'Gem Socket on ' + item.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, sockets: item.sockets });
  }

  if (cmdType === COMMAND_TYPES.SOCKET_CITY_GEM) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before socketing Astral Gems');
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item) return reject('Item not found in City Vault Storage');
    if (!Array.isArray(item.gems)) item.gems = [];
    if (item.gems.length >= (item.sockets || 0)) return reject('No open Gem Sockets on ' + item.name);

    const gemId = payload.gemId || 'ruby';
    const gemBonuses = {
      ruby:         { name: 'Ruby of Might',     atk: 4, def: 0, hp: 0,  mp: 0 },
      emerald:      { name: 'Emerald of Wind',   atk: 1, def: 3, hp: 0,  mp: 0 },
      sapphire:     { name: 'Sapphire of Will',  atk: 2, def: 0, hp: 0,  mp: 15 },
      topaz:        { name: 'Topaz of Dawn',     atk: 0, def: 2, hp: 20, mp: 0 },
      void_diamond: { name: 'Void Diamond',      atk: 6, def: 4, hp: 10, mp: 10 }
    };
    const gDef = gemBonuses[gemId];
    if (!gDef) return reject('Unknown gem type: ' + gemId);
    if ((city.gems[gemId] || 0) < 1) return reject('No ' + gDef.name + ' available in City Gems');

    city.gems[gemId] -= 1;
    item.gems.push(gemId);
    item.atk = (item.atk || 0) + gDef.atk;
    item.def = (item.def || 0) + gDef.def;
    item.hp  = (item.hp  || 0) + gDef.hp;
    item.mp  = (item.mp  || 0) + gDef.mp;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.CRAFTING_COMPLETED, {
        cityId: city.id,
        facility: 'lapidary',
        itemName: gDef.name + ' into ' + item.name,
        qty: 1
      }, simTimeMs);
    }
    return accept({ item: item, gemId: gemId, remainingGems: city.gems[gemId] });
  }

  if (cmdType === COMMAND_TYPES.UNSOCKET_CITY_GEM) {
    const city = getPrimaryCity(state);
    if (!city || !city.storage || !Array.isArray(city.storage.items)) return reject('City Vault Storage unavailable');
    const lapLvl = (city.buildings && city.buildings.lapidary) || 0;
    if (lapLvl < 1) return reject('Construct a Lapidary Workshop before extracting gems');
    if (!city.gems) city.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

    const item = city.storage.items.find(function(it) { return it.uid === payload.itemUid; });
    if (!item || !Array.isArray(item.gems) || item.gems.length === 0) return reject('No socketed gems to extract');
    if ((city.stockpile.gold || 0) < 20) return reject('Need 20 Gold to safely extract a gem');

    city.stockpile.gold -= 20;
    const removedGemId = item.gems.pop();
    const gemBonuses = {
      ruby:         { atk: 4, def: 0, hp: 0,  mp: 0 },
      emerald:      { atk: 1, def: 3, hp: 0,  mp: 0 },
      sapphire:     { atk: 2, def: 0, hp: 0,  mp: 15 },
      topaz:        { atk: 0, def: 2, hp: 20, mp: 0 },
      void_diamond: { atk: 6, def: 4, hp: 10, mp: 10 }
    };
    const gDef = gemBonuses[removedGemId];
    if (gDef) {
      item.atk = Math.max(0, (item.atk || 0) - gDef.atk);
      item.def = Math.max(0, (item.def || 0) - gDef.def);
      item.hp  = Math.max(0, (item.hp  || 0) - gDef.hp);
      item.mp  = Math.max(0, (item.mp  || 0) - gDef.mp);
    }
    city.gems[removedGemId] = (city.gems[removedGemId] || 0) + 1;

    return accept({ item: item, extractedGemId: removedGemId, cityGemCount: city.gems[removedGemId] });
  }

  // ---------------------------------------------------------------------------
  // 9C. MARCH TO DUNGEON (Quick-Order Hero Party to a Discovered Vault POI)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.MARCH_TO_DUNGEON) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canEnterDungeon) {
      return reject('Select a Hero-led Vanguard Party to march on a Dungeon');
    }
    if (unit.status === 'in_dungeon') {
      return reject('Party is already delving inside a dungeon');
    }

    const poi = (ow.pois || []).find(function(p) {
      return p.type === 'dungeon_entrance' && (payload.poiId ? p.id === payload.poiId : true);
    });
    if (!poi) return reject('Dungeon entrance not found on Overworld');
    if (!poi.discovered && !(ow.explored[poi.y] && ow.explored[poi.y][poi.x])) {
      return reject('Scout the Overworld to discover ' + poi.name + ' before marching there');
    }

    if (unit.x === poi.x && unit.y === poi.y) {
      return accept({ alreadyAtEntrance: true, poiId: poi.id, dungeonId: poi.dungeonId });
    }

    return dispatchWargameCommand({
      type: COMMAND_TYPES.ORDER_UNIT_MARCH,
      payload: {
        unitId: unit.id,
        targetX: poi.x,
        targetY: poi.y,
        intent: 'enter_dungeon',
        targetPoiId: poi.id
      }
    }, state, scheduler, eventStream);
  }

  // ---------------------------------------------------------------------------
  // 9D. ENTER DUNGEON (Transition Hero Party into Turn-Based Tactical Engine)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.ENTER_DUNGEON) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit || !unit.canEnterDungeon) {
      return reject('Requires an active Hero-led Vanguard Party to enter a Dungeon');
    }

    const poi = (ow.pois || []).find(function(p) {
      if (p.type !== 'dungeon_entrance') return false;
      if (payload.poiId) return p.id === payload.poiId;
      return unit.x === p.x && unit.y === p.y;
    });
    if (!poi) {
      return reject('Party must complete its march onto a Dungeon Entrance before entering');
    }
    if (unit.status === 'marching') {
      return reject('Wait until the party finishes moving into ' + poi.name + ' before entering');
    }
    if (unit.x !== poi.x || unit.y !== poi.y) {
      return reject('Party must stand directly on ' + poi.name + ' before entering');
    }

    if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
      scheduler.cancelJob(unit.marchPlan.activeJobId);
    }
    unit.x = poi.x;
    unit.y = poi.y;
    unit.status = 'in_dungeon';
    unit.marchPlan = null;
    unit.activeDungeonPoiId = poi.id;
    unit.activeDungeonId = poi.dungeonId;

    world.stats.dungeonsEntered = (world.stats.dungeonsEntered || 0) + 1;

    const hero = (world.heroes || []).find(function(h) { return h.id === unit.leaderHeroId; });
    const city = getPrimaryCity(state);

    const envelopeData = {
      campaignId: world.campaignId || (world.id + '_' + (world.seedCode || 'STAR')),
      seedCode: world.seedCode || 'STAR-7777',
      houseName: (world.player && world.player.houseName) || 'House Vanguard',
      cityId: city ? city.id : null,
      cityName: city ? city.name : 'Oakhaven Bastion',
      cityCoords: city ? { x: city.x, y: city.y } : null,
      partyUnitId: unit.id,
      hero: hero ? {
        id: hero.id,
        name: hero.name,
        classId: hero.classId,
        level: hero.level,
        xp: hero.xp,
        equipment: hero.equipment || null,
        cosmetics: hero.cosmetics || null
      } : {
        id: unit.leaderHeroId || 'hero_1',
        name: unit.shortName,
        classId: unit.heroClassId || 'fighter',
        level: 1,
        xp: 0
      },
      dungeon: {
        poiId: poi.id,
        dungeonId: poi.dungeonId,
        profileId: poi.profileId || 'starfall_vaults',
        name: poi.name,
        coords: { x: poi.x, y: poi.y }
      }
    };

    const envelope = payload.skipStorageWrite
      ? createDungeonEntryEnvelope(envelopeData)
      : writeDungeonEntryHandoff(envelopeData);

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.DUNGEON_ENTERED, {
        unitId: unit.id,
        unitName: unit.shortName,
        poiId: poi.id,
        dungeonId: poi.dungeonId,
        dungeonName: poi.name
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);
    return accept({
      unitId: unit.id,
      poiId: poi.id,
      dungeonId: poi.dungeonId,
      envelope: envelope
    });
  }

  // ---------------------------------------------------------------------------
  // 9D2. EXIT DUNGEON TO SURFACE (Safely surface a party marked in_dungeon)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE) {
    const unitId = payload.unitId || ow.selectedUnitId;
    const unit = (ow.units || []).find(function(u) { return u.id === unitId && u.alive; });
    if (!unit) return reject('No active party found');
    unit.status = 'idle';
    unit.marchPlan = null;
    unit.activeDungeonPoiId = null;
    unit.activeDungeonId = null;
    return accept({ unitId: unit.id, x: unit.x, y: unit.y, status: 'idle' });
  }

  // ---------------------------------------------------------------------------
  // 9E. RESOLVE DUNGEON RETURN (Extraction Return March, Recall Scroll, or Defeat)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.RESOLVE_DUNGEON_RETURN) {
    const outcome = payload.outcome === 'defeated' ? 'defeated' : 'extracted';
    const method = payload.method || 'Floor 1 Ascending Stairs (<)';
    const loot = payload.lootSummary || {};
    const city = getPrimaryCity(state);

    let unit = null;
    if (payload.partyUnitId) {
      unit = (ow.units || []).find(function(u) { return u.id === payload.partyUnitId && u.alive; });
    }
    if (!unit) {
      unit = (ow.units || []).find(function(u) { return u.status === 'in_dungeon' && u.alive; })
          || (ow.units || []).find(function(u) { return u.unitType === 'hero_party' && u.alive; });
    }
    if (!unit) return reject('No Vanguard Party found to resolve dungeon return');

    // Sync hero progression back to Overworld roster
    const hero = (world.heroes || []).find(function(h) {
      return h.id === (payload.heroId || unit.leaderHeroId);
    });
    if (hero) {
      if (typeof payload.heroLevel === 'number' && payload.heroLevel > hero.level) {
        hero.level = payload.heroLevel;
      }
      if (typeof payload.heroXp === 'number' && payload.heroXp > (hero.xp || 0)) {
        hero.xp = payload.heroXp;
      }
      if (payload.heroEquipment && typeof payload.heroEquipment === 'object') {
        hero.equipment = Object.assign({}, hero.equipment || {}, payload.heroEquipment);
      }
    }

    const poiId = payload.dungeonPoiId || unit.activeDungeonPoiId;
    const poi = (ow.pois || []).find(function(p) { return p.id === poiId; })
             || (ow.pois || []).find(function(p) { return p.type === 'dungeon_entrance'; });

    unit.activeDungeonPoiId = null;
    unit.activeDungeonId = null;
    ow.selectedUnitId = unit.id;

    if (outcome === 'defeated') {
      // Non-Permanent Defeat (Golden Rule #2): Express-return directly to City Adventurers Guild Hall
      if (unit.marchPlan && unit.marchPlan.activeJobId && scheduler) {
        scheduler.cancelJob(unit.marchPlan.activeJobId);
      }
      if (city) {
        unit.x = city.x;
        unit.y = city.y;
        if (loot.salvagedGold > 0) {
          city.stockpile.gold = (city.stockpile.gold || 0) + loot.salvagedGold;
        }
      }
      unit.status = 'idle';
      unit.marchPlan = null;
      unit.hp = unit.maxHp;
      unit.cargo = null;

      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.DUNGEON_RETURNED, {
          outcome: 'defeated',
          method: 'Guild Scout Rescue',
          unitId: unit.id,
          unitName: unit.shortName,
          killerName: payload.killerName || 'Abyssal Guardian',
          floorDepth: payload.floorDepth || 1,
          salvagedGold: loot.salvagedGold || 0,
          cityName: city ? city.name : 'Bastion'
        }, simTimeMs);
      }

      evaluateTaskDAG(state, eventStream);
      return accept({ outcome: 'defeated', unitId: unit.id, x: unit.x, y: unit.y, salvagedGold: loot.salvagedGold || 0 });
    }

    // Outcome: 'extracted'
    unit.hp = unit.maxHp;
    unit.status = 'idle';
    unit.marchPlan = null;

    if (!unit.cargo) {
      unit.cargo = { gold: 0, ore: 0, gems: 0, gearCount: 0, gearItems: [] };
    }
    if (!Array.isArray(unit.cargo.gearItems)) unit.cargo.gearItems = [];
    const incomingGear = Array.isArray(payload.extractedGear) ? payload.extractedGear : [];
    for (let gi = 0; gi < incomingGear.length; gi++) {
      unit.cargo.gearItems.push(incomingGear[gi]);
    }
    unit.cargo.gold      = (unit.cargo.gold      || 0) + (loot.gold      || 0);
    unit.cargo.ore       = (unit.cargo.ore       || 0) + (loot.ore       || 0);
    unit.cargo.gems      = (unit.cargo.gems      || 0) + (loot.gems      || 0);
    unit.cargo.gearCount = (unit.cargo.gearCount || 0) + Math.max(loot.gearCount || 0, incomingGear.length);

    const isRecallScroll = String(method).indexOf('Recall Scroll') !== -1;
    let returnMarchStarted = false;
    let surfacedAtEntrance = false;

    if (isRecallScroll) {
      // Astral Recall Scroll: Instant exit to the surface at the Dungeon Entrance POI (idle, cargo intact).
      // Player chooses which City or destination to march to next on the Overworld.
      if (poi) {
        unit.x = poi.x;
        unit.y = poi.y;
        revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 5);
      }
      surfacedAtEntrance = true;
    } else {
      // Surface extraction via Floor 1 Stairs or Boss Portal: Exit at Vault POI & begin timed Return March home
      if (poi) {
        unit.x = poi.x;
        unit.y = poi.y;
        revealOverworldVision(ow, unit.x, unit.y, unit.visionRadius || 5);
      }
      if (city && (unit.x !== city.x || unit.y !== city.y)) {
        const marchRes = dispatchWargameCommand({
          type: COMMAND_TYPES.ORDER_UNIT_MARCH,
          payload: {
            unitId: unit.id,
            targetX: city.x,
            targetY: city.y,
            intent: 'return_city',
            targetCityId: city.id
          }
        }, state, scheduler, eventStream);
        returnMarchStarted = Boolean(marchRes && marchRes.ok);
      } else if (city) {
        depositUnitCargoAtCity(unit, city, state, simTimeMs, eventStream);
      }
    }

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.DUNGEON_RETURNED, {
        outcome: 'extracted',
        method: method,
        unitId: unit.id,
        unitName: unit.shortName,
        expressReturn: false,
        surfacedAtEntrance: surfacedAtEntrance,
        returnMarchStarted: returnMarchStarted,
        lootSummary: loot,
        cityName: city ? city.name : 'Bastion'
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);
    return accept({
      outcome: 'extracted',
      expressReturn: false,
      surfacedAtEntrance: surfacedAtEntrance,
      returnMarchStarted: returnMarchStarted,
      unitId: unit.id,
      x: unit.x,
      y: unit.y
    });
  }

  // ---------------------------------------------------------------------------
  // 10. CLAIM TASK REWARD
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.CLAIM_TASK_REWARD) {
    const taskId = payload.taskId;
    const tDef = CAMPAIGN_TASKS_DAG.find(function(t) { return t.id === taskId; });
    if (!tDef) return reject('Unknown task ID: ' + taskId);

    evaluateTaskDAG(state, eventStream);
    const entry = world.tasks[taskId];
    if (!entry || entry.status !== 'completed') {
      return reject('Task is not ready to claim');
    }

    entry.status = 'claimed';
    entry.claimedAtSimMs = simTimeMs;

    const city = getPrimaryCity(state);
    const targetStock = city ? city.stockpile : world.realmStockpile;
    const r = tDef.reward || {};

    if (r.wood)  targetStock.wood  = (targetStock.wood  || 0) + r.wood;
    if (r.stone) targetStock.stone = (targetStock.stone || 0) + r.stone;
    if (r.food)  targetStock.food  = (targetStock.food  || 0) + r.food;
    if (r.gold)  targetStock.gold  = (targetStock.gold  || 0) + r.gold;

    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.TASK_CLAIMED, {
        taskId: taskId,
        title: tDef.title,
        rewardLabel: tDef.rewardLabel,
        reward: r
      }, simTimeMs);
    }

    evaluateTaskDAG(state, eventStream);

    return accept({
      taskId: taskId,
      reward: r,
      stockpile: targetStock
    });
  }

  // ---------------------------------------------------------------------------
  // 11. SET SIMULATION SPEED / PAUSE
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SET_SIM_SPEED) {
    if (typeof payload.paused === 'boolean') {
      world.clock.paused = payload.paused;
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.CLOCK_PAUSED, { paused: world.clock.paused }, simTimeMs);
      }
    }
    if (typeof payload.speedMultiplier === 'number' && payload.speedMultiplier > 0) {
      world.clock.speedMultiplier = payload.speedMultiplier;
      if (eventStream) {
        eventStream.publish(STREAM_TOPICS.CLOCK_SPEED_CHANGED, { speedMultiplier: world.clock.speedMultiplier }, simTimeMs);
      }
    }
    return accept({
      paused: world.clock.paused,
      speedMultiplier: world.clock.speedMultiplier
    });
  }

  // ---------------------------------------------------------------------------
  // 12. SWITCH ACTIVE VIEWPORT (Respecting Campaign Phase Gating!)
  // ---------------------------------------------------------------------------
  if (cmdType === COMMAND_TYPES.SWITCH_VIEW) {
    const targetView = payload.view;
    if (targetView === WARGAME_VIEWS.CITY && Object.keys(world.cities || {}).length === 0) {
      return reject('You must found your first Bastion City with your Pioneer Settler before entering City View');
    }
    if (targetView === WARGAME_VIEWS.GUILD) {
      const city = getPrimaryCity(state);
      const hasGuildHall = Boolean(city && city.buildings && city.buildings.guild_hall >= 1);
      if (!hasGuildHall) {
        return reject('Construct the Adventurers Guild Hall in your City before opening the Guild Recruitment Hall');
      }
    }
    state.activeView = targetView;
    return accept({ activeView: state.activeView });
  }

  return reject('Unsupported command type: ' + cmdType);
}

// Advance the authoritative simulation clock by deltaRealMs (multiplied by clock.speedMultiplier)
function advanceSimulationClock(deltaRealMs, state, scheduler, eventStream) {
  if (!state || !state.world || !state.world.clock) return 0;
  const clock = state.world.clock;
  if (clock.paused || deltaRealMs <= 0) return 0;

  const mult = clock.speedMultiplier || 1;
  const simDelta = Math.round(deltaRealMs * mult);
  const targetSimTime = clock.simTimeMs + simDelta;

  // Pop and execute all scheduled jobs (including chained jobs) in chronological order up to targetSimTime
  let jobsExecuted = 0;
  if (scheduler) {
    while (jobsExecuted < 500) {
      const dueJobs = scheduler.popDueJobs(targetSimTime);
      if (!dueJobs || dueJobs.length === 0) break;
      for (let i = 0; i < dueJobs.length; i++) {
        const job = dueJobs[i];
        clock.simTimeMs = job.dueSimTimeMs;
        jobsExecuted++;
        if (job.jobType === 'UNIT_MARCH_STEP') {
          resolveMarchStepJob(job, state, scheduler, eventStream);
        } else if (job.jobType === 'CITY_BUILDING_COMPLETE') {
          resolveBuildingCompleteJob(job, state, scheduler, eventStream);
        } else if (job.jobType === 'CITY_BUILDING_MOVE_COMPLETE') {
          resolveBuildingMoveJob(job, state, scheduler, eventStream);
        } else if (job.jobType === 'CITY_BUILDING_DEMOLISH_COMPLETE') {
          resolveBuildingDemolishJob(job, state, scheduler, eventStream);
        } else if (job.jobType === 'HERO_RECRUIT_COMPLETE') {
          resolveRecruitHeroJob(job, state, scheduler, eventStream);
        }
      }
    }
  }

  clock.simTimeMs = targetSimTime;

  // Process periodic city resource production ticks
  if (typeof clock.nextResourceTickMs !== 'number') {
    clock.nextResourceTickMs = RESOURCE_PRODUCTION_INTERVAL_MS;
  }
  while (clock.simTimeMs >= clock.nextResourceTickMs) {
    processResourceProductionTick(state, eventStream);
    clock.nextResourceTickMs += RESOURCE_PRODUCTION_INTERVAL_MS;
  }

  return jobsExecuted;
}

  // --- Module: src/wargame/engine/simHost.js ---
// Authoritative Wargame Simulation Host (SimHost)
// Encapsulates State Store, Min-Heap Priority Queue Scheduler, Replayable WorldEventStream & CommandBus.
// Provides a clean LocalLoopback / WebSocket-ready boundary for UI clients and deterministic tests.






function createWargameSimHost(initialState = null) {
  const state = initialState || createTitleScreenState();
  const scheduler = createSimulationScheduler();
  const eventStream = createWorldEventStream(500);

  function dispatch(commandEnvelope) {
    return dispatchWargameCommand(commandEnvelope, state, scheduler, eventStream);
  }

  function stepClock(deltaRealMs) {
    return advanceSimulationClock(deltaRealMs, state, scheduler, eventStream);
  }

  function save() {
    return saveWargameState(state, scheduler);
  }

  function load() {
    const loaded = loadWargameState(scheduler);
    if (!loaded) return false;
    Object.keys(state).forEach(function(k) { delete state[k]; });
    Object.assign(state, loaded);
    evaluateTaskDAG(state, eventStream);
    return true;
  }

  return {
    state: state,
    scheduler: scheduler,
    eventStream: eventStream,
    dispatch: dispatch,
    stepClock: stepClock,
    save: save,
    load: load,
    hasSavedCampaign: hasSavedWargameCampaign,
    peekSavedSummary: peekSavedCampaignSummary
  };
}

  // --- Module: src/wargame/ui/overworldView.js ---
// Overworld 2D Canvas Renderer — Frustum-Culled Terrain, Fog of War, A* Route Preview & Smooth Unit Interpolation





let wgHoverTile = null;
let wgPreviewPath = null;

function setWargameHoverTile(tile, previewPath = null) {
  wgHoverTile = tile;
  wgPreviewPath = previewPath;
}

function getWargameHoverTile() {
  return wgHoverTile;
}

function getWargameCameraOrigin(ow, centerX, centerY) {
  const fw = ow.width;
  const fh = ow.height;

  let camX = Math.round(centerX) - Math.floor(OVERWORLD_VIEWPORT_W / 2);
  let camY = Math.round(centerY) - Math.floor(OVERWORLD_VIEWPORT_H / 2);

  if (camX < 0) camX = 0;
  if (camY < 0) camY = 0;
  if (camX + OVERWORLD_VIEWPORT_W > fw) camX = Math.max(0, fw - OVERWORLD_VIEWPORT_W);
  if (camY + OVERWORLD_VIEWPORT_H > fh) camY = Math.max(0, fh - OVERWORLD_VIEWPORT_H);

  return { camX: camX, camY: camY };
}

function renderWargameOverworldCanvas(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const canvas = document.getElementById('wgOverworldCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#06090f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const state = simHost.state;
  const world = state.world;
  const ow = world.overworld;
  if (!ow || !ow.tiles) return;

  const simTimeMs = world.clock ? world.clock.simTimeMs : 0;
  const selUnit = getSelectedOverworldUnit(state);
  const primaryCity = getPrimaryCity(state);

  let focusX = ow.spawnX;
  let focusY = ow.spawnY;

  if (selUnit && selUnit.alive) {
    const interp = getUnitInterpolatedPosition(selUnit, simTimeMs);
    focusX = interp.x;
    focusY = interp.y;
  } else if (primaryCity) {
    focusX = primaryCity.x;
    focusY = primaryCity.y;
  }

  const cam = getWargameCameraOrigin(ow, focusX, focusY);
  const camX = cam.camX;
  const camY = cam.camY;
  const visionRadius = selUnit ? (selUnit.visionRadius || 4) : 5;

  // 1. Render Terrain Grid
  for (let vy = 0; vy < OVERWORLD_VIEWPORT_H; vy++) {
    const y = camY + vy;
    if (y < 0 || y >= ow.height) continue;
    const expRow = ow.explored[y];

    for (let vx = 0; vx < OVERWORLD_VIEWPORT_W; vx++) {
      const x = camX + vx;
      if (x < 0 || x >= ow.width) continue;

      const px = vx * OVERWORLD_TILE_SIZE;
      const py = vy * OVERWORLD_TILE_SIZE;
      const isExplored = expRow && expRow[x];

      if (!isExplored) {
        ctx.fillStyle = '#05070c';
        ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);
        ctx.strokeStyle = '#0c121e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, OVERWORLD_TILE_SIZE - 1, OVERWORLD_TILE_SIZE - 1);
        continue;
      }

      const dist = Math.hypot(x - focusX, y - focusY);
      const inSight = dist <= visionRadius + 0.45;
      const tId = ow.tiles[y][x];
      const tDef = OVERWORLD_TERRAIN_DEFS[tId] || OVERWORLD_TERRAIN_DEFS[OW_TERRAIN_PLAINS];

      ctx.fillStyle = inSight ? tDef.bgColor : '#0c1420';
      ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);

      ctx.strokeStyle = inSight ? tDef.borderColor : '#162234';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, OVERWORLD_TILE_SIZE - 1, OVERWORLD_TILE_SIZE - 1);

      const cx = px + OVERWORLD_TILE_SIZE / 2;
      const cy = py + OVERWORLD_TILE_SIZE / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (tId === OW_TERRAIN_FERTILE_VALE) {
        ctx.fillStyle = inSight ? '#4ade80' : '#15803d';
        ctx.font = '12px sans-serif';
        ctx.fillText('❀', cx, cy);
      } else if (tId === OW_TERRAIN_FOREST) {
        ctx.fillStyle = inSight ? '#22c55e' : '#166534';
        ctx.font = '13px sans-serif';
        ctx.fillText('♠', cx - 4, cy - 2);
        ctx.fillText('♠', cx + 4, cy + 3);
      } else if (tId === OW_TERRAIN_HILLS) {
        ctx.fillStyle = inSight ? '#cbd5e1' : '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('▲', cx, cy);
      } else if (tId === OW_TERRAIN_MOUNTAINS) {
        ctx.fillStyle = inSight ? '#f1f5f9' : '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('▲', cx - 3, cy);
        ctx.font = '11px sans-serif';
        ctx.fillText('▲', cx + 5, cy + 2);
      } else if (tId === OW_TERRAIN_WATER) {
        ctx.fillStyle = inSight ? '#38bdf8' : '#0284c7';
        ctx.font = '13px sans-serif';
        ctx.fillText('≈', cx, cy);
      } else if (inSight) {
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!inSight) {
        ctx.fillStyle = 'rgba(5, 8, 15, 0.52)';
        ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);
      }
    }
  }

  // 2. Render Points of Interest (Resource Caches, Groves, Quarries, Dungeon Entrances)
  if (Array.isArray(ow.pois)) {
    for (let i = 0; i < ow.pois.length; i++) {
      const poi = ow.pois[i];
      if (poi.depleted) continue;
      if (poi.x < camX || poi.x >= camX + OVERWORLD_VIEWPORT_W || poi.y < camY || poi.y >= camY + OVERWORLD_VIEWPORT_H) continue;
      if (!ow.explored[poi.y] || !ow.explored[poi.y][poi.x]) continue;

      const px = (poi.x - camX) * OVERWORLD_TILE_SIZE;
      const py = (poi.y - camY) * OVERWORLD_TILE_SIZE;
      const cx = px + OVERWORLD_TILE_SIZE / 2;
      const cy = py + OVERWORLD_TILE_SIZE / 2;
      const pDef = OVERWORLD_POI_DEFS[poi.type] || OVERWORLD_POI_DEFS.dungeon_entrance;
      const accent = poi.accentColor || pDef.color || '#fbbf24';

      // Pulsing breach ring only once selected Hero Party has finished moving onto this Dungeon POI
      if (poi.type === 'dungeon_entrance' && selUnit && selUnit.alive && selUnit.canEnterDungeon &&
          selUnit.status === 'idle' && selUnit.x === poi.x && selUnit.y === poi.y) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = pDef.bgColor || '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = accent;
      ctx.fillText(pDef.symbol || 'Ω', cx, cy);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(poi.name, cx, py - 3);
    }
  }

  // 2B. Render Overworld Wandering Hostiles inside explored vision
  if (Array.isArray(ow.hostiles)) {
    for (let i = 0; i < ow.hostiles.length; i++) {
      const h = ow.hostiles[i];
      if (!h.alive) continue;
      if (h.x < camX || h.x >= camX + OVERWORLD_VIEWPORT_W || h.y < camY || h.y >= camY + OVERWORLD_VIEWPORT_H) continue;
      if (!ow.explored[h.y] || !ow.explored[h.y][h.x]) continue;

      const px = (h.x - camX) * OVERWORLD_TILE_SIZE;
      const py = (h.y - camY) * OVERWORLD_TILE_SIZE;
      const cx = px + OVERWORLD_TILE_SIZE / 2;
      const cy = py + OVERWORLD_TILE_SIZE / 2;

      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx + 11, cy);
      ctx.lineTo(cx, cy + 11);
      ctx.lineTo(cx - 11, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = h.color || '#f87171';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(h.icon || '💀', cx, cy);
    }
  }

  // 3. Render Founded Cities
  const cityKeys = Object.keys(world.cities || {});
  for (let i = 0; i < cityKeys.length; i++) {
    const city = world.cities[cityKeys[i]];
    if (city.x < camX || city.x >= camX + OVERWORLD_VIEWPORT_W || city.y < camY || city.y >= camY + OVERWORLD_VIEWPORT_H) continue;

    const px = (city.x - camX) * OVERWORLD_TILE_SIZE;
    const py = (city.y - camY) * OVERWORLD_TILE_SIZE;
    const cx = px + OVERWORLD_TILE_SIZE / 2;
    const cy = py + OVERWORLD_TILE_SIZE / 2;

    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰', cx, cy);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(city.name, cx, py - 4);
  }

  // 4. Render Active March Waypoint Path & Hover Preview Path
  if (selUnit && selUnit.alive && selUnit.marchPlan && Array.isArray(selUnit.marchPlan.remainingPath)) {
    const rem = selUnit.marchPlan.remainingPath;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const interp = getUnitInterpolatedPosition(selUnit, simTimeMs);
    ctx.moveTo((interp.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (interp.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    for (let i = 0; i < rem.length; i++) {
      const st = rem[i];
      ctx.lineTo((st.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (st.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (wgPreviewPath && wgPreviewPath.length > 0 && selUnit && selUnit.alive) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo((selUnit.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (selUnit.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    for (let i = 0; i < wgPreviewPath.length; i++) {
      const st = wgPreviewPath[i];
      ctx.lineTo((st.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (st.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Render Overworld Units (Settlers & Hero Parties) with Smooth Real-Time Interpolation
  const units = ow.units || [];
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.alive) continue;
    const interp = getUnitInterpolatedPosition(u, simTimeMs);
    if (interp.x < camX - 1 || interp.x >= camX + OVERWORLD_VIEWPORT_W + 1 ||
        interp.y < camY - 1 || interp.y >= camY + OVERWORLD_VIEWPORT_H + 1) {
      continue;
    }

    const cx = (interp.x - camX + 0.5) * OVERWORLD_TILE_SIZE;
    const cy = (interp.y - camY + 0.5) * OVERWORLD_TILE_SIZE;
    const isSelected = selUnit && selUnit.id === u.id;

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = u.unitType === 'settler' ? '#fbbf24' : '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.unitType === 'settler' ? '🚩' : '⚔️', cx, cy);

    // Step Progress Bar above marching unit
    if (u.status === 'marching') {
      const barW = 24;
      const barH = 4;
      const bx = cx - barW / 2;
      const by = cy - 18;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = (u.marchPlan && u.marchPlan.intent === 'return_city') ? '#fbbf24' : '#38bdf8';
      ctx.fillRect(bx, by, Math.round(barW * interp.progress), barH);
    } else if (u.status === 'in_dungeon') {
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#f87171';
      ctx.fillText('IN VAULT', cx, cy - 16);
    }

    // Gold Cargo Indicator when party carries unbanked skirmish or dungeon spoils
    if (u.cargo && ((u.cargo.gold || 0) > 0 || (u.cargo.ore || 0) > 0)) {
      ctx.font = '10px sans-serif';
      ctx.fillText('💰', cx + 11, cy - 10);
    }

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = isSelected ? '#38bdf8' : '#e6edf3';
    ctx.fillText(u.shortName || u.name, cx, cy + 19);
  }

  // 6. Hover Tile Reticle
  if (wgHoverTile) {
    const hx = wgHoverTile.x;
    const hy = wgHoverTile.y;
    if (hx >= camX && hx < camX + OVERWORLD_VIEWPORT_W && hy >= camY && hy < camY + OVERWORLD_VIEWPORT_H) {
      const hpx = (hx - camX) * OVERWORLD_TILE_SIZE;
      const hpy = (hy - camY) * OVERWORLD_TILE_SIZE;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hpx + 1, hpy + 1, OVERWORLD_TILE_SIZE - 2, OVERWORLD_TILE_SIZE - 2);
    }
  }
}

  // --- Module: src/constants.js ---
// Core constants, viewport dimensions, map scale presets, tile IDs, and rarity definitions

const SCHEMA_VERSION = 'v0.5.0-inc5';
const STORAGE_KEY = 'aethelgard_save_v6';

const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 21;
const VIEWPORT_HEIGHT = 15;

// Legacy viewport aliases + new exploration-scale default floor dimensions
const GRID_W = VIEWPORT_WIDTH;
const GRID_H = VIEWPORT_HEIGHT;
const DEFAULT_MAP_W = 80;
const DEFAULT_MAP_H = 60;

// Soft configurable cap on simultaneously chartered custom expeditions (not a structural limit; can be raised to 500+)
const DEFAULT_MAX_CHARTERED_DUNGEONS = 12;

// Bestiary & Codex Mastery Constants
const CODEX_MASTERY_KILLS = 5;
const CODEX_MASTERY_DMG_MULT = 1.08;

const MAP_SIZE_PRESETS = {
  small:     { id: 'small',     name: 'Small Outpost',        width: 48,  height: 36,  desc: '48x36 (~5.5x classic) • 14–18 chambers' },
  standard:  { id: 'standard',  name: 'Standard Delve',       width: 80,  height: 60,  desc: '80x60 (~15x classic) • Multi-wing halls & vaults' },
  sprawling: { id: 'sprawling', name: 'Sprawling Labyrinth',  width: 128, height: 96,  desc: '128x96 (~39x classic) • Deep avenues & caverns' },
  colossal:  { id: 'colossal',  name: 'Colossal Megadungeon', width: 192, height: 144, desc: '192x144 (~88x classic) • Massive subterranean expanse' }
};

// Tile Constants
const TILE_WALL = 0;
const TILE_FLOOR = 1;
const TILE_STAIRS_UP = 2;
const TILE_STAIRS_DOWN = 3;
const TILE_CHEST = 4;
const TILE_CHEST_OPEN = 5;
const TILE_SHRINE = 6;
const TILE_SHRINE_USED = 7;
const TILE_TRAP_HIDDEN = 8;
const TILE_TRAP_VISIBLE = 9;
const TILE_ORE_COPPER = 10;
const TILE_ORE_IRON = 11;
const TILE_ORE_MITHRIL = 12;
const TILE_ORE_STAR = 13;
const TILE_ORE_ASTRAL = 14;
const TILE_ORE_GEODE = 15;
const TILE_TRAP_DISARMED = 16;

// Economy Constants
const LAPIDARY_UNSOCKET_COST = 15;
const BOUNTY_REROLL_COST = 25;

// Rarity Definitions
const RARITY = {
  common:   { id: 'common',   name: 'Common',            color: '#94a3b8', mult: 1.0, affixes: 0 },
  uncommon: { id: 'uncommon', name: 'Uncommon',          color: '#4ade80', mult: 1.4, affixes: 1 },
  rare:     { id: 'rare',     name: 'Rare',              color: '#60a5fa', mult: 2.0, affixes: 2 },
  epic:     { id: 'epic',     name: 'Epic',              color: '#c084fc', mult: 3.2, affixes: 3 },
  relic:    { id: 'relic',    name: 'Star-Forged Relic', color: '#fbbf24', mult: 5.5, affixes: 4 }
};

  // --- Module: src/data/classes.js ---
// Complete 5 Playable Classes Registry (Fighter, Thief, Mage, Ranger, Paladin)

const CLASSES = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    title: 'Iron Vanguard',
    color: '#f87171',
    baseStats: { str: 15, dex: 10, int: 8, vit: 14 },
    hpBase: 120,
    mpBase: 35,
    vision: 5,
    starterGear: {
      weapon:    { uid: 'w_start_f', name: 'Iron Broadsword', slot: 'weapon', rarity: 'common', atk: 8, str: 2, value: 20, affixes: [] },
      armor:     { uid: 'a_start_f', name: 'Riveted Mail', slot: 'armor', rarity: 'common', def: 6, vit: 1, value: 20, affixes: [] },
      helm:      { uid: 'h_start_f', name: 'Iron Coif', slot: 'helm', rarity: 'common', def: 2, value: 12, affixes: [] },
      boots:     { uid: 'b_start_f', name: 'Heavy Sabatons', slot: 'boots', rarity: 'common', def: 2, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_f', name: 'Vanguard Signet', slot: 'accessory', rarity: 'common', atk: 1, crit: 2, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_f', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 30, maxDur: 30, value: 25, affixes: [] }
    },
    passiveName: 'Unstoppable Stride',
    passiveDesc: '+10 Max HP & reduces incoming physical damage by 15%.',
    skillName: 'Whirlwind Cleave',
    skillCost: 10,
    skillRange: 1,
    skillDesc: 'Cleaves all adjacent foes for 150% weapon damage and stuns them for 1 turn.'
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    title: 'Shadow Strider',
    color: '#c084fc',
    baseStats: { str: 9, dex: 16, int: 11, vit: 10 },
    hpBase: 90,
    mpBase: 45,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_t', name: 'Obsidian Stiletto', slot: 'weapon', rarity: 'common', atk: 7, crit: 8, value: 20, affixes: [] },
      armor:     { uid: 'a_start_t', name: 'Shadow Leather', slot: 'armor', rarity: 'common', def: 3, dodge: 6, value: 20, affixes: [] },
      helm:      { uid: 'h_start_t', name: 'Nightblade Cowl', slot: 'helm', rarity: 'common', def: 1, crit: 3, value: 12, affixes: [] },
      boots:     { uid: 'b_start_t', name: 'Silent Footwraps', slot: 'boots', rarity: 'common', def: 1, dodge: 5, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_t', name: 'Prospector Die', slot: 'accessory', rarity: 'common', crit: 4, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_t', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 28, maxDur: 28, value: 25, affixes: [] }
    },
    passiveName: 'Opportunist',
    passiveDesc: '+15% Critical Strike chance & +25% gold found in chests.',
    skillName: 'Shadowstep Strike',
    skillCost: 12,
    skillRange: 3,
    skillDesc: 'Teleports to a free floor tile adjacent to a target within 3 tiles and strikes for 220% Crit damage.'
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    title: 'Starweaver Adept',
    color: '#60a5fa',
    baseStats: { str: 7, dex: 10, int: 17, vit: 10 },
    hpBase: 82,
    mpBase: 80,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_m', name: 'Astral Runestaff', slot: 'weapon', rarity: 'common', atk: 5, int: 3, value: 20, affixes: [] },
      armor:     { uid: 'a_start_m', name: 'Starweaver Robes', slot: 'armor', rarity: 'common', def: 2, maxMp: 15, value: 20, affixes: [] },
      helm:      { uid: 'h_start_m', name: 'Circlet of Will', slot: 'helm', rarity: 'common', def: 1, int: 2, value: 12, affixes: [] },
      boots:     { uid: 'b_start_m', name: 'Leyline Slippers', slot: 'boots', rarity: 'common', def: 1, maxMp: 10, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_m', name: 'Vespera Shard', slot: 'accessory', rarity: 'common', maxMp: 15, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_m', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 25, maxDur: 25, value: 25, affixes: [] }
    },
    passiveName: 'Arcane Surge',
    passiveDesc: 'Regenerates +2 MP each turn and adds INT scaling to basic attacks.',
    skillName: 'Starfall Nova',
    skillCost: 16,
    skillRange: 4,
    skillDesc: 'Unleashes an astral detonation hitting all visible enemies within 4 tiles for 200% spell damage + Burn.'
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    title: 'Deepwood Pathfinder',
    color: '#34d399',
    baseStats: { str: 12, dex: 15, int: 11, vit: 11 },
    hpBase: 95,
    mpBase: 45,
    vision: 7,
    starterGear: {
      weapon:    { uid: 'w_start_r', name: 'Recurve Shortbow', slot: 'weapon', rarity: 'common', atk: 6, dex: 2, value: 20, affixes: [] },
      armor:     { uid: 'a_start_r', name: 'Scout Gambeson', slot: 'armor', rarity: 'common', def: 4, dodge: 4, value: 20, affixes: [] },
      helm:      { uid: 'h_start_r', name: 'Falconer Cap', slot: 'helm', rarity: 'common', def: 1, visionBonus: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_r', name: 'Trailrunner Boots', slot: 'boots', rarity: 'common', def: 1, dodge: 5, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_r', name: 'Quiver Trinket', slot: 'accessory', rarity: 'common', crit: 5, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_r', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 25, maxDur: 25, value: 25, affixes: [] }
    },
    passiveName: 'Eagle Eye',
    passiveDesc: '7-tile Torchlight vision & +15% Evasion.',
    skillName: 'Starfall Volley',
    skillCost: 14,
    skillRange: 5,
    skillDesc: 'Looses a piercing astral salvo striking up to 3 visible foes within 5 tiles for 180% weapon damage.'
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    title: 'Dawn Warden',
    color: '#fbbf24',
    baseStats: { str: 14, dex: 9, int: 12, vit: 15 },
    hpBase: 125,
    mpBase: 50,
    vision: 5,
    starterGear: {
      weapon:    { uid: 'w_start_p', name: 'Blessed Mace', slot: 'weapon', rarity: 'common', atk: 7, str: 1, value: 20, affixes: [] },
      armor:     { uid: 'a_start_p', name: 'Crusader Hauberk', slot: 'armor', rarity: 'common', def: 7, vit: 1, value: 22, affixes: [] },
      helm:      { uid: 'h_start_p', name: 'Steel Sallet', slot: 'helm', rarity: 'common', def: 3, value: 14, affixes: [] },
      boots:     { uid: 'b_start_p', name: 'Plated Greaves', slot: 'boots', rarity: 'common', def: 2, value: 14, affixes: [] },
      accessory: { uid: 'acc_start_p', name: 'Solar Medallion', slot: 'accessory', rarity: 'common', maxHp: 12, value: 18, affixes: [] },
      pickaxe:   { uid: 'pick_start_p', name: 'Iron Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 28, maxDur: 28, value: 25, affixes: [] }
    },
    passiveName: 'Aura of Radiance',
    passiveDesc: '+10 Armor & regenerates +1 HP every 3 turns.',
    skillName: 'Holy Smite',
    skillCost: 16,
    skillRange: 1,
    skillDesc: 'Strikes an adjacent foe for 240% holy damage and restores 15% of your Max HP.'
  },
  adventurer: {
    id: 'adventurer',
    name: 'Adventurer',
    title: 'Starfall Delver',
    color: '#38bdf8',
    baseStats: { str: 12, dex: 12, int: 11, vit: 13 },
    hpBase: 108,
    mpBase: 50,
    vision: 6,
    starterGear: {
      weapon:    { uid: 'w_start_a', name: 'Delver Shortsword', slot: 'weapon', rarity: 'common', atk: 7, dex: 1, value: 20, affixes: [] },
      armor:     { uid: 'a_start_a', name: 'Expedition Brigandine', slot: 'armor', rarity: 'common', def: 5, vit: 1, value: 20, affixes: [] },
      helm:      { uid: 'h_start_a', name: 'Lantern Cap', slot: 'helm', rarity: 'common', def: 2, visionBonus: 1, value: 12, affixes: [] },
      boots:     { uid: 'b_start_a', name: 'Wayfarer Boots', slot: 'boots', rarity: 'common', def: 2, value: 12, affixes: [] },
      accessory: { uid: 'acc_start_a', name: 'Guild Compass', slot: 'accessory', rarity: 'common', crit: 3, value: 15, affixes: [] },
      pickaxe:   { uid: 'pick_start_a', name: 'Reinforced Pickaxe', slot: 'pickaxe', rarity: 'common', curDur: 34, maxDur: 34, value: 25, affixes: [] }
    },
    passiveName: 'Delver Grit',
    passiveDesc: 'Balanced dungeon explorer with +1 Torchlight vision and durable mining pickaxe.',
    skillName: 'Torch Flare',
    skillCost: 11,
    skillRange: 1,
    skillDesc: 'Blasts an adjacent foe with searing torchlight for 180% damage and stuns them for 1 turn.'
  }
};

  // --- Module: src/data/items.js ---
// Equipment Affix Pools, Quartermaster Shop Catalog, and Elite Monster Affixes


const AFFIX_POOL = [
  { id: 'atk',   label: 'of Ferocity',    stat: 'atk',   min: 2,  max: 6,  slots: ['weapon', 'accessory'] },
  { id: 'def',   label: 'of the Bulwark', stat: 'def',   min: 2,  max: 6,  slots: ['armor', 'helm', 'boots'] },
  { id: 'str',   label: 'of Might',       stat: 'str',   min: 1,  max: 4,  slots: ['weapon', 'armor', 'helm'] },
  { id: 'dex',   label: 'of Precision',   stat: 'dex',   min: 1,  max: 4,  slots: ['weapon', 'boots', 'accessory'] },
  { id: 'int',   label: 'of Astral Lore', stat: 'int',   min: 1,  max: 4,  slots: ['weapon', 'helm', 'accessory'] },
  { id: 'vit',   label: 'of Fortitude',   stat: 'vit',   min: 1,  max: 4,  slots: ['armor', 'helm', 'boots'] },
  { id: 'crit',  label: 'of Keen Sight',  stat: 'crit',  min: 3,  max: 9,  slots: ['weapon', 'accessory', 'helm'] },
  { id: 'dodge', label: 'of the Zephyr',  stat: 'dodge', min: 3,  max: 8,  slots: ['boots', 'armor', 'accessory'] },
  { id: 'maxHp', label: 'of Lifeblood',   stat: 'maxHp', min: 12, max: 35, slots: ['armor', 'helm', 'accessory'] },
  { id: 'maxMp', label: 'of the Leyline', stat: 'maxMp', min: 10, max: 28, slots: ['helm', 'accessory', 'weapon'] },
  { id: 'thorns', label: 'of Retaliation', stat: 'thorns', min: 3, max: 8, slots: ['armor', 'helm', 'boots'] },
  { id: 'leech', label: 'of the Blood Drinker', stat: 'leech', min: 2, max: 6, slots: ['weapon', 'accessory'] },
  { id: 'ward', label: 'of Astral Warding', stat: 'ward', min: 2, max: 5, slots: ['armor', 'helm', 'accessory'] }
];

const BASE_GEAR_NAMES = {
  weapon:    ['Star-Shard Blade', 'Runed Broadsword', 'Astral Longbow', 'Vespera Halberd', 'Obsidian Cleaver'],
  armor:     ['Astral Hauberk', 'Deepwood Brigandine', 'Star-Forged Plate', 'Shadowalker Coat', 'Runed Cuirass'],
  helm:      ['Visor of the Deep', 'Starweaver Hood', 'Ironbound Sallet', 'Astral Crown', 'Stalker Mask'],
  boots:     ['Greaves of Striding', 'Silent Sabatons', 'Starlight Treads', 'Dwarven Marchers', 'Windrunner Boots'],
  accessory: ['Vespera Signet', 'Astral Lens Charm', 'Pendant of Dawn', 'Bloodstone Ring', 'Star-Core Amulet']
};

const SHOP_ITEMS = [
  { id: 'buy_heal',   name: 'Healing Tonic',             type: 'consumable', cost: 18,  reqQM: 0, desc: 'Restores 45% Max HP & cures Bleed/Poison.' },
  { id: 'buy_recall', name: 'Astral Recall Scroll',      type: 'consumable', cost: 30,  reqQM: 0, desc: 'Safely extracts you & your pack from any floor.' },
  { id: 'buy_pick_1', name: 'Dwarven Steel Pickaxe',     type: 'gear', slot: 'pickaxe',   rarity: 'uncommon', maxDur: 50,  cost: 65,  reqQM: 0, desc: '50 Base Durability.' },
  { id: 'buy_wep_1',  name: 'Vespera Runeblade',         type: 'gear', slot: 'weapon',    rarity: 'rare',     atk: 14, crit: 6, cost: 115, reqQM: 1, desc: '+14 ATK, +6% Crit.' },
  { id: 'buy_arm_1',  name: 'Carapace of the Deep',      type: 'gear', slot: 'armor',     rarity: 'rare',     def: 11, maxHp: 25, cost: 115, reqQM: 1, desc: '+11 DEF, +25 Max HP.' },
  { id: 'buy_pick_2', name: 'Mithril Star-Pickaxe',      type: 'gear', slot: 'pickaxe',   rarity: 'rare',     maxDur: 85,  cost: 145, reqQM: 1, desc: '85 Base Durability.' },
  { id: 'buy_acc_2',  name: 'Amulet of the Fallen Star', type: 'gear', slot: 'accessory', rarity: 'epic',     atk: 6, maxHp: 35, crit: 8, cost: 240, reqQM: 2, desc: '+6 ATK, +35 HP, +8% Crit.' },
  { id: 'buy_pick_3', name: 'Titanium Master Pick',      type: 'gear', slot: 'pickaxe',   rarity: 'epic',     maxDur: 140, cost: 260, reqQM: 2, desc: '140 Base Durability.' },
  { id: 'buy_wep_3',  name: 'Eclipse, Blade of Vespera', type: 'gear', slot: 'weapon',    rarity: 'relic',    atk: 28, str: 5, crit: 14, cost: 520, reqQM: 3, desc: '+28 ATK, +5 STR, +14% Crit.' },
  { id: 'buy_pick_4', name: 'Void Astralite Drill',      type: 'gear', slot: 'pickaxe',   rarity: 'relic',    maxDur: 240, cost: 450, reqQM: 3, desc: '240 Base Durability.' }
];

const ELITE_AFFIXES = [
  { id: 'vampiric',   name: 'Vampiric',      color: '#f87171', desc: 'Heals for 40% of damage dealt' },
  { id: 'molten',     name: 'Molten',        color: '#fb923c', desc: 'Inflicts Burn on hit' },
  { id: 'venomous',   name: 'Venomous',      color: '#4ade80', desc: 'Inflicts Poison on hit' },
  { id: 'fortified',  name: 'Fortified',     color: '#60a5fa', desc: '+35% Defense & HP' },
  { id: 'reflective', name: 'Reflective',    color: '#ec4899', desc: 'Reflects 25% thorns damage back to attacker' },
  { id: 'chilling',   name: 'Chilling',      color: '#38bdf8', desc: 'Inflicts Chilled on hit (-15% Dodge, +2 Skill MP)' },
  { id: 'temporal',   name: 'Temporal Warp', color: '#a855f7', desc: '40% chance on damage to phase-shift away' },
  { id: 'volatile',   name: 'Volatile',      color: '#ef4444', desc: 'Detonates upon defeat for 150% ATK damage in 1-tile radius' }
];

function computeItemPowerScore(item) {
  if (!item) return 0;
  const atk = (item.atk || 0) * 2;
  const def = (item.def || 0) * 2;
  const hp = (item.maxHp || 0) * 0.25;
  const mp = (item.maxMp || 0) * 0.25;
  const crit = (item.crit || 0) * 1.5;
  const dodge = (item.dodge || 0) * 1.5;
  const stats = ((item.str || 0) + (item.dex || 0) + (item.int || 0) + (item.vit || 0)) * 1.2;
  const affExtra = ((item.thorns || 0) * 1.5) + ((item.leech || 0) * 2) + ((item.ward || 0) * 2);
  const sockets = ((item.maxSockets || 0) * 4) + (Array.isArray(item.sockets) ? item.sockets.length * 4 : 0);
  const dur = (item.maxDur || 0) * 0.5;
  return Math.round(atk + def + hp + mp + crit + dodge + stats + affExtra + sockets + dur);
}

function isItemUpgrade(candidateItem, equipment) {
  if (!candidateItem || !candidateItem.slot) return false;
  if (!equipment) return true;
  const curEq = equipment[candidateItem.slot];
  if (!curEq) return true;
  return computeItemPowerScore(candidateItem) > computeItemPowerScore(curEq);
}

const SLOT_METADATA = {
  helm:      { id: 'helm',      label: 'Head / Helm',         icon: '🪖', placeholder: 'Helm' },
  armor:     { id: 'armor',     label: 'Chest / Body Armor',  icon: '🦺', placeholder: 'Armor' },
  weapon:    { id: 'weapon',    label: 'Main Hand / Weapon',  icon: '⚔️', placeholder: 'Weapon' },
  boots:     { id: 'boots',     label: 'Feet / Boots',        icon: '👢', placeholder: 'Boots' },
  accessory: { id: 'accessory', label: 'Neck / Accessory',    icon: '💍', placeholder: 'Trinket' },
  pickaxe:   { id: 'pickaxe',   label: 'Off-Hand / Pickaxe',  icon: '⛏️', placeholder: 'Pickaxe' },
  shield:    { id: 'shield',    label: 'Off-Hand / Shield',   icon: '🛡️', placeholder: 'Shield' },
  gloves:    { id: 'gloves',    label: 'Hands / Gauntlets',   icon: '🧤', placeholder: 'Gloves' },
  amulet:    { id: 'amulet',    label: 'Necklace / Amulet',   icon: '📿', placeholder: 'Amulet' },
  ring:      { id: 'ring',      label: 'Finger / Ring',       icon: '💍', placeholder: 'Ring' },
  belt:      { id: 'belt',      label: 'Waist / Belt',        icon: '🎗️', placeholder: 'Belt' }
};

function getItemTypeIcon(itemOrSlot) {
  if (!itemOrSlot) return '📦';
  if (typeof itemOrSlot === 'string') {
    const meta = SLOT_METADATA[itemOrSlot];
    return meta ? meta.icon : '📦';
  }
  if (itemOrSlot.slot && SLOT_METADATA[itemOrSlot.slot]) {
    return SLOT_METADATA[itemOrSlot.slot].icon;
  }
  const idStr = String(itemOrSlot.id || '');
  if (idStr === 'healing_tonic' || idStr === 'buy_heal' || idStr === 'potions') return '🧪';
  if (idStr === 'recall_scroll' || idStr === 'buy_recall' || idStr === 'recalls') return '📜';
  if (itemOrSlot.type === 'Gem') return '◆';
  if (itemOrSlot.type === 'Ore' || ['copper', 'iron', 'mithril', 'geode', 'starcrystal', 'astralite'].includes(idStr) || idStr.indexOf('ore') !== -1) return '🪨';
  return '📦';
}

  // --- Module: src/ui/shared/assetRegistry.js ---
// =============================================================================
// SHARED SEMANTIC ASSET REGISTRY (Stage E.5 â€” Golden Slice / ADR-0013)
// Resolves all Tier 1-3 visual assets strictly by semantic ID via assets/manifest.json,
// with graceful procedural fallback and zero-CORS file:// support.
// =============================================================================

const ASSET_ID_REGEX = /^[a-z]+_[a-z]+_[a-z0-9_]+_[a-z0-9_]+_[a-z0-9_]+$/;

// Facility buildingId -> Canonical Tier 1 Interior Asset ID mapping
const FACILITY_INTERIOR_ASSET_MAP = {
  guild_hall: 'city_interior_adventurers_guild_default_static',
  adventurers_guild: 'city_interior_adventurers_guild_default_static',
  fighters_guild: 'city_interior_fighters_guild_default_static',
  thieves_guild: 'city_interior_thieves_guild_default_static',
  mages_guild: 'city_interior_mages_guild_default_static',
  rangers_lodge: 'city_interior_rangers_lodge_default_static',
  temple_chapterhouse: 'city_interior_temple_chapterhouse_default_static',
  garrison: 'city_interior_garrison_default_static',
  smeltery: 'city_interior_smeltery_default_static',
  apothecary: 'city_interior_apothecary_default_static',
  blacksmith: 'city_interior_blacksmith_default_static',
  lapidary: 'city_interior_lapidary_default_static',
  warehouse: 'city_interior_warehouse_default_static'
};

// Embedded manifest mirror for instant file:// & headless execution (synced with assets/manifest.json)
const DEFAULT_ASSET_MANIFEST = {
  schemaVersion: '1.0.0',
  project: 'Aethelgard: The Starfall Vaults',
  artBibleRef: 'docs/art_bible.md',
  pipelineRef: 'docs/asset_pipeline.md',
  cdnBaseUrl: '',
  assets: {
    char_portrait_adventurer_default_idle: {
      id: 'char_portrait_adventurer_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_adventurer_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_fighter_default_idle: {
      id: 'char_portrait_fighter_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_fighter_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_thief_default_idle: {
      id: 'char_portrait_thief_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_thief_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_mage_default_idle: {
      id: 'char_portrait_mage_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_mage_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_ranger_default_idle: {
      id: 'char_portrait_ranger_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_ranger_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_cleric_default_idle: {
      id: 'char_portrait_cleric_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_cleric_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_paladin_default_idle: {
      id: 'char_portrait_paladin_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_paladin_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    city_interior_adventurers_guild_default_static: {
      id: 'city_interior_adventurers_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_adventurers_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_fighters_guild_default_static: {
      id: 'city_interior_fighters_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_fighters_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_thieves_guild_default_static: {
      id: 'city_interior_thieves_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_thieves_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_mages_guild_default_static: {
      id: 'city_interior_mages_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_mages_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_rangers_lodge_default_static: {
      id: 'city_interior_rangers_lodge_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_rangers_lodge_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_temple_chapterhouse_default_static: {
      id: 'city_interior_temple_chapterhouse_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_temple_chapterhouse_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_garrison_default_static: {
      id: 'city_interior_garrison_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_garrison_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_smeltery_default_static: {
      id: 'city_interior_smeltery_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_smeltery_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_apothecary_default_static: {
      id: 'city_interior_apothecary_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_apothecary_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_blacksmith_default_static: {
      id: 'city_interior_blacksmith_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_blacksmith_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_lapidary_default_static: {
      id: 'city_interior_lapidary_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_lapidary_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_warehouse_default_static: {
      id: 'city_interior_warehouse_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_warehouse_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    dng_container_chest_gilded_closed: {
      id: 'dng_container_chest_gilded_closed',
      tier: 2,
      domain: 'dng',
      category: 'container',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_container_chest_gilded_closed',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawGildedChestProp'
    },
    dng_container_chest_gilded_open: {
      id: 'dng_container_chest_gilded_open',
      tier: 2,
      domain: 'dng',
      category: 'container',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_container_chest_gilded_open',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawGildedChestProp'
    },
    dng_prop_oil_barrel_default_intact: {
      id: 'dng_prop_oil_barrel_default_intact',
      tier: 2,
      domain: 'dng',
      category: 'prop',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_prop_oil_barrel_default_intact',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawWorldObject'
    },
    dng_tile_wall_catacombs_ashlar_static: {
      id: 'dng_tile_wall_catacombs_ashlar_static',
      tier: 2,
      domain: 'dng',
      category: 'tile',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_catacombs_kit.webp',
      atlasFrame: 'dng_tile_wall_catacombs_ashlar_static',
      width: 128,
      height: 128,
      anchor: [0.5, 0.5],
      fallback: 'drawAshlarWall'
    },
    ow_poi_dungeon_starfall_idle: {
      id: 'ow_poi_dungeon_starfall_idle',
      tier: 3,
      domain: 'ow',
      category: 'poi',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/overworld_cartography.webp',
      atlasFrame: 'ow_poi_dungeon_starfall_idle',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawOverworldPoi'
    }
  }
};

let activeManifest = DEFAULT_ASSET_MANIFEST;
const imageCache = {};

function validateAssetManifest(manifestObj) {
  const errors = [];
  if (!manifestObj || typeof manifestObj !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'], total: 0, productionCount: 0 };
  }
  if (!manifestObj.schemaVersion) {
    errors.push('Missing schemaVersion');
  }
  const assets = manifestObj.assets;
  if (!assets || typeof assets !== 'object') {
    return { valid: false, errors: ['Missing assets map'], total: 0, productionCount: 0 };
  }

  const keys = Object.keys(assets);
  let productionCount = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const entry = assets[key];
    if (!ASSET_ID_REGEX.test(key)) {
      errors.push('Invalid canonical asset ID: ' + key);
    }
    if (!entry || entry.id !== key) {
      errors.push('Entry id mismatch for key: ' + key);
      continue;
    }
    if (entry.tier !== 1 && entry.tier !== 2 && entry.tier !== 3) {
      errors.push('Invalid tier for ' + key);
    }
    if (!entry.src || typeof entry.src !== 'string') {
      errors.push('Missing src for ' + key);
    }
    if (entry.status === 'production') {
      productionCount++;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    total: keys.length,
    productionCount: productionCount
  };
}

function getAssetRegistry() {
  return activeManifest;
}

function resolveAsset(assetId) {
  if (!assetId || !activeManifest || !activeManifest.assets) return null;
  const entry = activeManifest.assets[assetId];
  if (!entry) return null;
  const base = activeManifest.cdnBaseUrl || '';
  return {
    id: entry.id,
    tier: entry.tier,
    domain: entry.domain,
    category: entry.category,
    status: entry.status,
    src: base ? (base + entry.src) : entry.src,
    atlasFrame: entry.atlasFrame || null,
    width: entry.width || 0,
    height: entry.height || 0,
    anchor: entry.anchor || [0.5, 0.5],
    fallback: entry.fallback || null,
    isProduction: entry.status === 'production'
  };
}

function getProductionImageSrc(assetId) {
  const resolved = resolveAsset(assetId);
  if (!resolved || !resolved.isProduction) return null;
  return resolved.src;
}

function getFacilityInteriorAssetId(buildingId) {
  if (!buildingId) return null;
  return FACILITY_INTERIOR_ASSET_MAP[buildingId] || null;
}

function getHeroPortraitAssetId(classId) {
  if (!classId) return null;
  return 'char_portrait_' + String(classId).toLowerCase() + '_default_idle';
}

function getCachedImage(assetId, onLoad) {
  const src = getProductionImageSrc(assetId);
  if (!src) return null;
  if (typeof Image === 'undefined') return null;

  if (imageCache[assetId]) {
    const existing = imageCache[assetId];
    return existing.loaded ? existing.img : null;
  }

  const img = new Image();
  const rec = { img: img, loaded: false, failed: false };
  imageCache[assetId] = rec;

  img.onload = function() {
    rec.loaded = true;
    if (typeof onLoad === 'function') onLoad(img, assetId);
  };
  img.onerror = function() {
    rec.failed = true;
  };
  img.src = src;
  return null;
}

function getAssetRegistryStats() {
  const check = validateAssetManifest(activeManifest);
  return {
    schemaVersion: activeManifest.schemaVersion,
    totalAssets: check.total,
    productionAssets: check.productionCount,
    fallbackAssets: check.total - check.productionCount,
    valid: check.valid
  };
}

  // --- Module: src/ui/shared/characterSheet.js ---
// Shared Cross-Engine Character Sheet, Anatomical Paper-Doll & Prestige Cosmetic Showcase
// Used natively by BOTH the Turn-Based Dungeon Engine (index.html) and Macro Wargame (wargame.html).





const SHARED_PAPER_DOLL_SLOTS = [
  // Row 1: Head & Neck
  { id: 'accessory', label: 'Trinket',  left: '10px',  top: '10px',  width: '84px', height: '64px', active: true },
  { id: 'helm',      label: 'Helm',     left: '128px', top: '10px',  width: '84px', height: '64px', active: true },
  { id: 'amulet',    label: 'Amulet',   right: '10px', top: '10px',  width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

  // Row 2: Torso & Weapons
  { id: 'weapon',    label: 'Weapon',   left: '10px',  top: '86px',  width: '84px', height: '70px', active: true },
  { id: 'armor',     label: 'Armor',    left: '128px', top: '86px',  width: '84px', height: '70px', active: true },
  { id: 'pickaxe',   label: 'Off-Hand', right: '10px', top: '86px',  width: '84px', height: '70px', active: true },

  // Row 3: Hands, Waist, Rings (Reserved for Track A Inc 8.7)
  { id: 'gloves',    label: 'Gloves',   left: '10px',  top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },
  { id: 'belt',      label: 'Belt',     left: '128px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 3 Expansion' },
  { id: 'ring',      label: 'Ring',     right: '10px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

  // Row 4: Feet
  { id: 'boots',     label: 'Boots',    left: '128px', top: '254px', width: '84px', height: '64px', active: true }
];

// Tier 1 Prestige Cosmetic Showcase Slots (Stage E.1 Art Direction — Fair Non-P2W Cosmetic System)
const COSMETIC_SLOTS = [
  { id: 'cloak',        label: 'Mantle / Cloak',  icon: '🧣' },
  { id: 'aura',         label: 'Astral Aura',     icon: '✨' },
  { id: 'banner_crest', label: 'Heraldic Crest',  icon: '🛡️' },
  { id: 'weapon_glow',  label: 'Weapon Enchant',  icon: '⚔️' }
];

function drawSharedSafeEllipse(ctx, cx, cy, rx, ry) {
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
  }
}

function normalizeSharedHeroProfile(hero) {
  const h = hero || {};
  const classId = h.classId || 'fighter';
  const cls = CLASSES[classId] || CLASSES.fighter;
  const st = h.stats || {};

  const str = h.computedStr !== undefined ? h.computedStr : (st.str || (cls.baseStats && cls.baseStats.str) || 10);
  const dex = h.computedDex !== undefined ? h.computedDex : (st.dex || (cls.baseStats && cls.baseStats.dex) || 10);
  const intel = h.computedInt !== undefined ? h.computedInt : (st.int || (cls.baseStats && cls.baseStats.int) || 10);
  const vit = h.computedVit !== undefined ? h.computedVit : (st.vit || (cls.baseStats && cls.baseStats.vit) || 10);

  const eq = h.equipment || {};
  let eqAtk = 0;
  let eqDef = 0;
  let eqHp = 0;
  let eqMp = 0;
  const eqKeys = Object.keys(eq);
  for (let i = 0; i < eqKeys.length; i++) {
    const it = eq[eqKeys[i]];
    if (!it) continue;
    eqAtk += (it.atk || 0);
    eqDef += (it.def || 0);
    eqHp  += (it.hp  || 0);
    eqMp  += (it.mp  || 0);
  }

  const baseMaxHp = h.maxHp !== undefined ? h.maxHp : ((st.hp || 140) + eqHp);
  const baseMaxMp = h.maxMp !== undefined ? h.maxMp : ((st.mp || 60) + eqMp);
  const atk = h.atk !== undefined ? h.atk : ((st.atk || 22) + eqAtk);
  const def = h.def !== undefined ? h.def : ((st.def || 10) + eqDef);
  const crit = h.crit !== undefined ? h.crit : Math.min(60, 8 + Math.floor(dex * 0.6));
  const dodge = h.dodge !== undefined ? h.dodge : Math.min(45, 5 + Math.floor(dex * 0.5));

  return {
    id: h.id || 'hero_active',
    name: h.name || cls.name,
    classId: classId,
    className: h.className || cls.name,
    title: h.title || cls.title || 'Guild Vanguard',
    color: h.color || cls.color || '#fbbf24',
    level: h.level || 1,
    xp: h.xp || 0,
    hp: h.hp !== undefined ? h.hp : baseMaxHp,
    maxHp: baseMaxHp,
    mp: h.mp !== undefined ? h.mp : baseMaxMp,
    maxMp: baseMaxMp,
    stats: {
      str: str,
      dex: dex,
      int: intel,
      vit: vit,
      atk: atk,
      def: def,
      crit: crit,
      dodge: dodge
    },
    equipment: eq,
    cosmetics: h.cosmetics || { cloak: null, aura: null, banner_crest: null, weapon_glow: null },
    bagGear: Array.isArray(h.bagGear) ? h.bagGear : []
  };
}

function renderSharedPaperDollMannequin(canvas, hero) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const classId = hero ? hero.classId : 'fighter';
  const cls = CLASSES[classId] || CLASSES.fighter;
  const cosmeticAura = hero && hero.cosmetics && hero.cosmetics.aura ? hero.cosmetics.aura.color : null;
  const themeColor = cosmeticAura || cls.color || '#fbbf24';

  ctx.save();

  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  // Radial celestial aura behind chest
  if (typeof ctx.createRadialGradient === 'function') {
    const grad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 120);
    if (grad && typeof grad.addColorStop === 'function') {
      grad.addColorStop(0, themeColor + '22');
      grad.addColorStop(0.6, themeColor + '08');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
    }
  } else {
    ctx.fillStyle = themeColor + '15';
  }
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 120, 0, Math.PI * 2);
  ctx.fill();

  // Stage E.5 Golden Slice: Tier 1 Prestige Realism Portrait Medallion (when production art exists)
  const portraitId = getHeroPortraitAssetId(classId);
  const portraitImg = getCachedImage(portraitId, function() {
    renderSharedPaperDollMannequin(canvas, hero);
  });
  if (portraitImg && typeof ctx.drawImage === 'function') {
    const rad = Math.min(Math.floor(w * 0.34), Math.floor(h * 0.34));
    const py = Math.floor(h * 0.46);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, py, rad, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(portraitImg, cx - rad, py - rad, rad * 2, rad * 2);
    ctx.restore();

    // Brushed Celestial Gold outer medallion bezel
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, py, rad + 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = themeColor + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, py, rad + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // Pedestal / Dais ellipse at feet
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 35, 75, 18);
  ctx.fill();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Runic floor circle rings
  ctx.strokeStyle = '#283347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 35, 60, 14);
  ctx.stroke();

  // Body shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 34, 45, 10);
  ctx.fill();

  // Class-specific silhouette cape & back ornaments
  if (classId === 'fighter') {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 65, 235);
    ctx.lineTo(cx + 65, 235);
    ctx.lineTo(cx + 36, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'thief') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 72, 235);
    ctx.lineTo(cx - 15, 235);
    ctx.lineTo(cx - 20, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'paladin') {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 65, 235);
    ctx.lineTo(cx + 65, 235);
    ctx.lineTo(cx + 36, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 65, 230, 130, 5);
  } else if (classId === 'ranger') {
    ctx.fillStyle = 'rgba(22, 101, 52, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 60, 225);
    ctx.lineTo(cx + 40, 225);
    ctx.lineTo(cx + 30, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'mage') {
    ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 105);
    ctx.lineTo(cx - 56, 265);
    ctx.lineTo(cx + 56, 265);
    ctx.lineTo(cx + 36, 105);
    ctx.closePath();
    ctx.fill();
  }

  // Legs & Boots
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - 24, 185, 18, 90);
  ctx.strokeRect(cx - 24, 185, 18, 90);
  ctx.fillRect(cx + 6, 185, 18, 90);
  ctx.strokeRect(cx + 6, 185, 18, 90);

  // Arms
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 52, 108, 16, 75);
  ctx.strokeRect(cx - 52, 108, 16, 75);
  ctx.fillRect(cx + 36, 108, 16, 75);
  ctx.strokeRect(cx + 36, 108, 16, 75);

  // Torso / Cuirass
  ctx.fillStyle = '#253247';
  ctx.beginPath();
  ctx.moveTo(cx - 38, 100);
  ctx.lineTo(cx + 38, 100);
  ctx.lineTo(cx + 28, 186);
  ctx.lineTo(cx - 28, 186);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = themeColor + '66';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Class chest emblem
  if (classId === 'paladin') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 3, 114, 6, 36);
    ctx.fillRect(cx - 14, 126, 28, 6);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, 132, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head / Helm
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cx, 72, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Class head crest / visor
  if (classId === 'fighter') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 12, 70, 24, 4);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(cx, 26);
    ctx.lineTo(cx + 26, 62);
    ctx.lineTo(cx - 26, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
  } else if (classId === 'paladin') {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 38, 16, 0, Math.PI * 2);
    ctx.stroke();
  } else if (classId === 'thief') {
    ctx.fillStyle = '#34d399';
    ctx.fillRect(cx - 10, 68, 6, 3);
    ctx.fillRect(cx + 4, 68, 6, 3);
  } else if (classId === 'ranger') {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(cx - 10, 68, 6, 3);
    ctx.fillRect(cx + 4, 68, 6, 3);
  }

  ctx.restore();
}

function buildSharedPaperDollGridHtml(hero, options = {}) {
  const eq = (hero && hero.equipment) ? hero.equipment : {};
  const mode = options.mode || 'wargame';
  const heroId = (hero && hero.id) || '';

  return SHARED_PAPER_DOLL_SLOTS.map(function(cfg) {
    const posStyle = 'top:' + cfg.top + ';width:' + cfg.width + ';height:' + cfg.height + ';' +
      (cfg.left ? ('left:' + cfg.left + ';') : ('right:' + cfg.right + ';'));

    if (!cfg.active) {
      const icon = getItemTypeIcon(cfg.id);
      return `
        <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#05080e]/80 backdrop-blur-sm border border-[#1e293b]/60 flex flex-col justify-between items-center text-center opacity-60 cursor-not-allowed select-none"
             style="${posStyle}"
             title="${cfg.label} Slot (${cfg.tier}) — Reserved for Track A Inc 8.7">
          <div class="w-full flex items-center justify-between text-[9px] text-[#475569]">
            <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
            <span>🔒</span>
          </div>
          <div class="text-base opacity-30">${icon}</div>
          <div class="text-[8px] font-mono text-[#475569]">Locked</div>
        </div>
      `;
    }

    const it = eq[cfg.id] || null;
    const typeIcon = getItemTypeIcon(cfg.id);

    if (!it) {
      return `
        <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#080b11]/75 backdrop-blur-sm border border-dashed border-[#283347]/80 flex flex-col justify-between items-center text-center select-none"
             style="${posStyle}">
          <div class="w-full flex items-center justify-between text-[9px] text-[#64748b]">
            <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
          </div>
          <div class="text-base opacity-25">${typeIcon}</div>
          <div class="text-[8px] font-mono text-[#475569]">Empty</div>
        </div>
      `;
    }

    const rInfo = RARITY[it.rarity] || RARITY.common;
    const statTag = it.atk ? ('+' + it.atk + ' ATK') : (it.def ? ('+' + it.def + ' DEF') : (it.maxDurability ? ('Tier ' + (it.tier || 1)) : 'Equipped'));
    const canUnequip = cfg.id !== 'pickaxe';
    const unequipAction = mode === 'wargame'
      ? `window.WargameApp.handleUnequipHeroItem('${heroId}', '${cfg.id}')`
      : `window.Aethelgard.handleInventoryUnequip('${cfg.id}')`;

    return `
      <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#0e1524]/90 backdrop-blur-sm border flex flex-col justify-between text-left select-none shadow-md"
           style="${posStyle}border-color:${rInfo.color}88;"
           title="${it.name} (${rInfo.label})">
        <div class="w-full flex items-center justify-between text-[9px]">
          <span class="uppercase tracking-wider font-semibold text-[#8b949e]">${cfg.label}</span>
          ${canUnequip ? `<button onclick="${unequipAction}" class="text-[#f87171] hover:text-white font-bold text-[10px] leading-none cursor-pointer" title="Unequip">✕</button>` : ''}
        </div>
        <div class="text-[10px] font-bold truncate" style="color:${rInfo.color}">${typeIcon} ${it.name}</div>
        <div class="text-[9px] font-mono text-[#34d399]">${statTag}</div>
      </div>
    `;
  }).join('');
}

function buildSharedHeroStatsHtml(profile) {
  const s = profile.stats;
  const cells = [
    { label: 'STR', val: s.str, color: '#f87171' },
    { label: 'DEX', val: s.dex, color: '#34d399' },
    { label: 'INT', val: s.int, color: '#60a5fa' },
    { label: 'VIT', val: s.vit, color: '#fbbf24' },
    { label: 'ATK', val: s.atk, color: '#fb923c' },
    { label: 'DEF', val: s.def, color: '#38bdf8' },
    { label: 'CRIT', val: s.crit + '%', color: '#facc15' },
    { label: 'DODGE', val: s.dodge + '%', color: '#a78bfa' }
  ];
  return cells.map(function(c) {
    return `
      <div class="p-1.5 rounded bg-[#080b11] border border-[#283347] text-center">
        <div class="text-[9px] font-mono text-[#8b949e] uppercase">${c.label}</div>
        <div class="text-xs font-mono font-bold" style="color:${c.color}">${c.val}</div>
      </div>
    `;
  }).join('');
}

function buildSharedCosmeticsPreviewHtml(profile) {
  const cos = profile.cosmetics || {};
  return COSMETIC_SLOTS.map(function(slot) {
    const equipped = cos[slot.id];
    return `
      <div class="p-2 rounded bg-[#080b11] border border-[#fbbf24]/30 flex items-center justify-between text-[10px] font-mono">
        <span class="text-[#8b949e]">${slot.icon} ${slot.label}</span>
        <span class="${equipped ? 'text-[#fbbf24] font-bold' : 'text-[#475569]'}">${equipped ? equipped.name : 'Default'}</span>
      </div>
    `;
  }).join('');
}

  // --- Module: src/ui/shared/renderAdapter.js ---
// =============================================================================
// DECOUPLED RENDER ADAPTER (Stage E.5 — Golden Slice / ADR-0013)
// Isolates rendering backend selection (PixiJS v8 WebGPU/WebGL2 vs. Canvas 2D fallback)
// from core simulation modules while resolving assets strictly through AssetRegistry.
// =============================================================================


const RENDER_BACKENDS = {
  PIXI_WEBGPU: 'pixi_webgpu',
  PIXI_WEBGL2: 'pixi_webgl2',
  CANVAS_2D: 'canvas2d'
};

function detectRenderCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasDocument = typeof document !== 'undefined';
  const hasPixi = Boolean(hasWindow && window.PIXI && typeof window.PIXI.Application === 'function');
  let hasWebGL2 = false;
  let hasWebGPU = false;

  if (hasWindow && typeof navigator !== 'undefined' && navigator.gpu) {
    hasWebGPU = true;
  }
  if (hasDocument) {
    try {
      const testCanvas = document.createElement('canvas');
      if (testCanvas && typeof testCanvas.getContext === 'function') {
        hasWebGL2 = Boolean(testCanvas.getContext('webgl2'));
      }
    } catch (_err) {
      hasWebGL2 = false;
    }
  }

  return {
    hasWindow: hasWindow,
    hasDocument: hasDocument,
    hasPixi: hasPixi,
    hasWebGL2: hasWebGL2,
    hasWebGPU: hasWebGPU
  };
}

function createRenderAdapter(options) {
  const opts = options || {};
  const preferred = opts.mode || 'auto';
  const caps = detectRenderCapabilities();

  let activeBackend = RENDER_BACKENDS.CANVAS_2D;
  if (preferred !== 'canvas2d' && caps.hasPixi) {
    activeBackend = caps.hasWebGPU ? RENDER_BACKENDS.PIXI_WEBGPU : RENDER_BACKENDS.PIXI_WEBGL2;
  }

  return {
    backend: activeBackend,
    capabilities: caps,
    resolveSprite: function(assetId) {
      return resolveAsset(assetId);
    },
    getCachedImage: function(assetId, onLoad) {
      return getCachedImage(assetId, onLoad);
    },
    getStats: function() {
      return Object.assign({ backend: activeBackend }, getAssetRegistryStats());
    }
  };
}

let sharedAdapter = null;

function getActiveRenderAdapter() {
  if (!sharedAdapter) {
    sharedAdapter = createRenderAdapter({ mode: 'auto' });
  }
  return sharedAdapter;
}

  // --- Module: src/wargame/ui/wargameUiSync.js ---
// Wargame DOM Synchronizer — Start Screen, Pioneer Overworld HUD, Real-Time City Builder, Guild Recruitment & Event Feed











function setHtmlIfChanged(el, newHtml) {
  if (!el) return;
  if (!el.dataset) el.dataset = {};
  if (el.dataset.renderedHtml !== newHtml) {
    el.innerHTML = newHtml;
    el.dataset.renderedHtml = newHtml;
  }
}

function formatSimDuration(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) {
    return mins + 'm ' + (secs < 10 ? '0' + secs : secs) + 's';
  }
  return secs + 's';
}

function formatWorldClock(simTimeMs) {
  const totalSec = Math.floor(Math.max(0, simTimeMs) / 1000);
  const day = Math.floor(totalSec / 60) + 1;
  const secInDay = totalSec % 60;
  return 'Day ' + day + ' • ' + (secInDay < 10 ? '0' + secInDay : secInDay) + 's';
}

function updateHeaderFastTick(simHost) {
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

function syncWargameUI(simHost) {
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
  renderScreenInfoModal(simHost);
  syncMobileDrawers(simHost);
}

function getScreenInfoContent(activeView, state) {
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

function renderScreenInfoModal(simHost) {
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

function syncMobileDrawers(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state) return;
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

function renderWargameCharacterSheetModal(simHost) {
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

function buildUnifiedGuildServicesHtml(simHost, bId, city, bDef, lvl) {
  const fac = (bDef && bDef.facilities) || {};
  const tabs = [];
  if (fac.recruitment && Array.isArray(fac.recruitment.classes)) {
    tabs.push({ id: 'recruit', label: '⚔️ Recruit' });
  }
  if (fac.questBoard) tabs.push({ id: 'quests', label: '📜 Quests' });
  if (fac.training)   tabs.push({ id: 'training', label: '🎯 Training' });
  if (fac.research)   tabs.push({ id: 'research', label: '📚 Research' });
  if (fac.shop)       tabs.push({ id: 'shop', label: '🛒 Shop' });

  if (tabs.length === 0) return '';

  const requestedTab = simHost && simHost.state ? simHost.state._facilityTab : null;
  const activeTab = tabs.some(function(t) { return t.id === requestedTab; }) ? requestedTab : tabs[0].id;

  const domain = (fac.questBoard && fac.questBoard.domain)
    || (fac.training && fac.training.domain)
    || (fac.research && fac.research.domain)
    || 'adventurers';
  const catalog = GUILD_SERVICE_CATALOGS[domain] || GUILD_SERVICE_CATALOGS.adventurers;

  const tabBarHtml = tabs.map(function(t) {
    const isAct = t.id === activeTab;
    return `<button onclick="window.WargameApp.handleSwitchFacilityTab('${t.id}')" class="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase cursor-pointer transition ${isAct ? 'bg-[#fbbf24] text-[#080b11] shadow' : 'bg-[#080b11]/75 hover:bg-[#1a2232] text-[#cbd5e1] border border-[#283347]'}">${t.label}</button>`;
  }).join('');

  let panelHtml = '';
  if (activeTab === 'recruit') {
    const classCards = fac.recruitment.classes.map(function(entry) {
      const cDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === entry.classId; });
      if (!cDef) return '';
      const unlocked = lvl >= (entry.minLevel || 1);
      const canAfford = unlocked && (city.stockpile.gold || 0) >= cDef.costGold && (city.stockpile.food || 0) >= cDef.costFood;
      const portraitSrc = getProductionImageSrc(getHeroPortraitAssetId(cDef.classId));
      const portraitHtml = portraitSrc
        ? `<img src="${portraitSrc}" alt="${cDef.name}" class="w-12 h-12 rounded-lg object-cover border border-[#fbbf24]/50 shadow shrink-0 bg-[#080b11]" />`
        : `<div class="w-12 h-12 rounded-lg bg-[#080b11] border border-[#283347] flex items-center justify-center text-xl shrink-0">${cDef.icon}</div>`;
      return `
        <div class="p-2.5 rounded-lg bg-[#111722]/90 border border-[#283347] flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5 min-w-0">
            ${portraitHtml}
            <div class="min-w-0">
              <div class="font-bold truncate" style="color:${cDef.color}">${cDef.icon} ${cDef.name} <span class="text-[9px] font-mono text-[#fbbf24]">• ${cDef.title}</span></div>
              <div class="text-[10px] text-[#94a3b8] truncate">${cDef.specialty || ''}</div>
              <div class="text-[10px] font-mono text-[#fbbf24] mt-0.5">${unlocked ? ('Oath Cost: ' + cDef.costGold + 'g • ' + cDef.costFood + ' Food') : ('Unlocks at ' + bDef.name + ' Lv ' + entry.minLevel)}</div>
            </div>
          </div>
          <button onclick="window.WargameApp.handleRecruitHero('${cDef.classId}')" ${!canAfford ? 'disabled' : ''} class="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase whitespace-nowrap ${canAfford ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
            ${unlocked ? '⚔️ Train (60s)' : ('Lv ' + entry.minLevel)}
          </button>
        </div>
      `;
    }).join('');
    panelHtml = `<div class="space-y-1.5">${classCards}</div>`;
  } else if (activeTab === 'quests') {
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
    panelHtml = `<div class="space-y-1.5">${qList}</div>`;
  } else if (activeTab === 'training') {
    const tList = (catalog.training || []).map(function(tr) {
      return `
        <div class="p-2.5 rounded-lg bg-[#111722]/90 border border-[#283347] flex items-center justify-between gap-2 text-xs">
          <div>
            <div class="font-bold text-[#38bdf8]">🎯 ${tr.name}</div>
            <div class="text-[10px] text-[#94a3b8]">${tr.desc}</div>
          </div>
          <span class="px-2 py-1 rounded bg-[#080b11] border border-[#fbbf24]/40 text-[10px] font-mono text-[#fbbf24] whitespace-nowrap">${tr.cost}</span>
        </div>
      `;
    }).join('');
    panelHtml = `<div class="space-y-1.5">${tList}</div>`;
  } else if (activeTab === 'research') {
    const rList = (catalog.research || []).map(function(rs) {
      return `
        <div class="p-2.5 rounded-lg bg-[#111722]/90 border border-[#283347] flex items-center justify-between gap-2 text-xs">
          <div>
            <div class="font-bold text-[#c084fc]">📚 ${rs.name}</div>
            <div class="text-[10px] text-[#94a3b8]">${rs.desc}</div>
          </div>
          <span class="px-2 py-1 rounded bg-[#080b11] border border-[#c084fc]/40 text-[10px] font-mono text-[#c084fc] whitespace-nowrap">${rs.cost}</span>
        </div>
      `;
    }).join('');
    panelHtml = `<div class="space-y-1.5">${rList}</div>`;
  } else if (activeTab === 'shop') {
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
    panelHtml = `<div class="space-y-1.5">${sList}</div>`;
  }

  return `
    <div class="p-3 rounded-lg bg-[#080b11] border border-[#fbbf24]/40 space-y-2.5">
      <div class="flex flex-wrap items-center gap-1.5">${tabBarHtml}</div>
      ${panelHtml}
    </div>
  `;
}

function renderWargameFacilityModal(simHost) {
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
  const plots = Array.isArray(city.plots) ? city.plots : [];
  const targetPlotIdx = simHost.state._openFacilityPlotIndex;
  const activePlot = (typeof targetPlotIdx === 'number'
    ? plots.find(function(p) { return p.plotIndex === targetPlotIdx && p.buildingId === bId; })
    : null) || plots.find(function(p) { return p.buildingId === bId; }) || null;
  const lvl = (activePlot && activePlot.level) || (city.buildings && city.buildings[bId]) || 1;
  const titleEl = document.getElementById('wgFacilityTitle');
  const subEl = document.getElementById('wgFacilitySubtitle');
  const bodyEl = document.getElementById('wgFacilityBody');
  if (titleEl) titleEl.textContent = (bDef.icon || '🏛️') + ' ' + bDef.name;
  if (subEl) subEl.textContent = 'Level ' + lvl + ' • ' + city.name;

  if (!bodyEl) return;
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

  const guildServicesHtml = buildUnifiedGuildServicesHtml(simHost, bId, city, bDef, lvl);
  if (guildServicesHtml) {
    sections.push(guildServicesHtml);
  }

  // Universal Production, Consumption & Upgrade Statistics Panel (works identically for Farms, Wells, Huts, Mines, Guilds, etc.)
  const prodLines = [];
  if (bDef.productionPerTick) {
    Object.entries(bDef.productionPerTick).forEach(function(e) {
      if (e[1] > 0) prodLines.push('+' + (e[1] * lvl) + ' ' + e[0] + ' / tick');
    });
  }
  if (bDef.providesPopulation) prodLines.push('+' + (bDef.providesPopulation * lvl) + ' Max Population');
  if (bDef.storageBonus) {
    Object.entries(bDef.storageBonus).forEach(function(e) {
      prodLines.push('+' + (e[1] * lvl) + ' ' + e[0] + ' Cap');
    });
  }
  if (bDef.adjacencyBonus) prodLines.push('+20% Adjacent Food/Wood/Stone/Water Output');

  const consumeLines = [];
  if (bDef.consumptionPerTick) {
    Object.entries(bDef.consumptionPerTick).forEach(function(e) {
      if (e[1] > 0) consumeLines.push('-' + (e[1] * lvl) + ' ' + e[0] + ' / tick');
    });
  } else if (bDef.providesPopulation) {
    consumeLines.push('Citizens consume Food & Water per tick');
  } else {
    consumeLines.push('None (Zero passive upkeep)');
  }

  const nextLvl = lvl + 1;
  const isMaxLvl = nextLvl > (bDef.maxLevel || 5);
  const upgCost = !isMaxLvl ? computeBuildingUpgradeCost(bId, nextLvl) : null;
  const upgDur = !isMaxLvl ? computeBuildingDurationMs(bId, nextLvl) : 0;
  const mhLvl = (city.buildings && (city.buildings.meeting_hall || city.buildings.town_hall)) || 1;
  const isMH = (bId === 'meeting_hall' || bId === 'town_hall');
  const cappedByMH = !isMH && nextLvl > mhLvl;
  const canAffordUpg = Boolean(
    !isMaxLvl && !cappedByMH && activePlot && !activePlot.underConstruction &&
    (city.stockpile.wood  || 0) >= (upgCost.wood  || 0) &&
    (city.stockpile.stone || 0) >= (upgCost.stone || 0) &&
    (city.stockpile.gold  || 0) >= (upgCost.gold  || 0) &&
    (city.stockpile.water || 0) >= (upgCost.water || 0) &&
    (city.stockpile.ore   || 0) >= (upgCost.ore   || 0)
  );

  if (sections.length === 0 || bDef.productionPerTick || bDef.providesPopulation || bDef.adjacencyBonus) {
    sections.push(`
      <div class="p-3 rounded-lg bg-[#080b11] border border-[#38bdf8]/40 space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded bg-[#111722]/90 border border-[#283347]">
            <div class="text-[10px] font-mono uppercase text-[#34d399] font-bold">📈 Producing / Providing</div>
            <div class="text-[11px] font-mono text-[#e6edf3] mt-1">${prodLines.length > 0 ? prodLines.join(' • ') : 'Civic / Operational Support'}</div>
          </div>
          <div class="p-2 rounded bg-[#111722]/90 border border-[#283347]">
            <div class="text-[10px] font-mono uppercase text-[#fb923c] font-bold">📉 Consuming / Upkeep</div>
            <div class="text-[11px] font-mono text-[#94a3b8] mt-1">${consumeLines.join(' • ')}</div>
          </div>
        </div>
        ${!isMaxLvl && activePlot ? `
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e293b]">
            <div class="text-[10px] font-mono text-[#cbd5e1]">
              Upgrade Lv ${nextLvl}: <span class="text-[#fbbf24]">${upgCost.wood}W • ${upgCost.stone}S${upgCost.gold ? (' • ' + upgCost.gold + 'G') : ''}${upgCost.water ? (' • ' + upgCost.water + '💧') : ''}${upgCost.ore ? (' • ' + upgCost.ore + '⛏️') : ''}</span> • ⏱ ${formatSimDuration(upgDur)}
              ${cappedByMH ? '<span class="text-[#f87171] ml-1">(Requires Meeting Hall Lv ' + nextLvl + ')</span>' : ''}
            </div>
            <button onclick="window.WargameApp.handleQueueBuilding(${activePlot.plotIndex}, '${bId}')" ${!canAffordUpg ? 'disabled' : ''} class="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase ${canAffordUpg ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] cursor-pointer' : 'bg-[#1a2232] text-[#64748b] cursor-not-allowed'}">
              ⬆️ Upgrade to Lv ${nextLvl}
            </button>
          </div>
        ` : (isMaxLvl ? `<div class="text-[10px] font-mono text-[#fbbf24] text-right">★ Maximum Level Reached</div>` : '')}
      </div>
    `);
  }

  const innerHtml = sections.join('') || `<div class="text-xs text-[#8b949e]">Facility operational.</div>`;
  const showInfo = Boolean(simHost.state && simHost.state._showFacilityInfo);
  const infoPopoverHtml = showInfo ? `
    <div class="mx-3.5 p-3 rounded-lg bg-[#080b11]/92 backdrop-blur-md border border-[#fbbf24]/60 shadow-xl space-y-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold text-[#fbbf24]">ⓘ About ${bDef.name} (Level ${lvl})</span>
        <button onclick="window.WargameApp.handleToggleFacilityInfo()" class="text-[#94a3b8] hover:text-white text-xs font-bold cursor-pointer">✕</button>
      </div>
      <p class="text-[11px] text-[#e6edf3]/90 leading-relaxed">${bDef.desc || 'Operational town construct.'}</p>
    </div>
  ` : '';

  const unifiedStageHtml = `
    <div class="relative min-h-[460px] rounded-xl overflow-hidden border border-[#fbbf24]/50 bg-gradient-to-br from-[#161e2e] via-[#0f1520] to-[#080b11] shadow-2xl flex flex-col justify-between">
      ${interiorSrc ? `<img src="${interiorSrc}" alt="${bDef.name} Interior" class="absolute inset-0 w-full h-full object-cover object-center" />` : `<div class="absolute inset-0 flex items-center justify-center opacity-10 text-[140px] select-none pointer-events-none">${bDef.icon || '🏛️'}</div>`}
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b11]/55 via-[#080b11]/20 to-[#080b11]/92"></div>
      <div class="relative z-10 p-3.5 flex items-center justify-between gap-2">
        <div class="px-3 py-1.5 rounded-lg bg-[#080b11]/70 backdrop-blur-md border border-[#fbbf24]/40">
          <div class="text-xs font-display font-bold text-[#fbbf24]">${bDef.icon || '🏛️'} ${bDef.name} <span class="text-[10px] font-mono text-[#e6edf3]/80">• Lv ${lvl} (${city.name})</span></div>
        </div>
        <button onclick="window.WargameApp.handleToggleFacilityInfo()" title="Building Info" class="w-8 h-8 rounded-full bg-[#080b11]/80 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur-md border border-[#fbbf24]/50 text-[#fbbf24] font-bold text-xs flex items-center justify-center cursor-pointer transition">ⓘ</button>
      </div>
      ${infoPopoverHtml ? `<div class="relative z-20">${infoPopoverHtml}</div>` : ''}
      <div class="relative z-10 flex-1 min-h-[120px]"></div>
      <div class="relative z-10 p-3.5 space-y-2.5 [&_>div]:bg-[#080b11]/78 [&_>div]:backdrop-blur-md">
        ${innerHtml}
      </div>
    </div>
  `;
  setHtmlIfChanged(bodyEl, unifiedStageHtml);
}

function renderTitleScreenSummary(simHost) {
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

function renderLeftCommandSidebar(simHost) {
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

function renderOverworldHudBar(simHost) {
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

function renderCityBuilderPanel(simHost) {
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

function renderGuildRecruitmentPanel(simHost) {
  const state = simHost.state;
  const city = getPrimaryCity(state);
  const gridEl = document.getElementById('wgGuildClassesGrid');
  if (!city || !gridEl) return;

  // Single config-driven Guild Screen (pulls image, title & services directly from CITY_BUILDINGS_CATALOG.guild_hall)
  const bId = 'guild_hall';
  const bDef = CITY_BUILDINGS_CATALOG[bId];
  const lvl = (city.buildings && city.buildings[bId]) || 1;
  const interiorSrc = getProductionImageSrc(bDef.interiorAssetId || getFacilityInteriorAssetId(bId));
  const servicesHtml = buildUnifiedGuildServicesHtml(simHost, bId, city, bDef, lvl);
  const showInfo = Boolean(state && state._showFacilityInfo);
  const infoPopoverHtml = showInfo ? `
    <div class="mx-4 p-3 rounded-lg bg-[#080b11]/92 backdrop-blur-md border border-[#fbbf24]/60 shadow-xl space-y-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold text-[#fbbf24]">ⓘ About ${bDef.name} (Level ${lvl})</span>
        <button onclick="window.WargameApp.handleToggleFacilityInfo()" class="text-[#94a3b8] hover:text-white text-xs font-bold cursor-pointer">✕</button>
      </div>
      <p class="text-[11px] text-[#e6edf3]/90 leading-relaxed">${bDef.desc || ''}</p>
    </div>
  ` : '';

  const unifiedHtml = `
    <div class="relative min-h-[540px] rounded-xl overflow-hidden border border-[#fbbf24]/50 bg-[#080b11] shadow-2xl flex flex-col justify-between">
      ${interiorSrc ? `<img src="${interiorSrc}" alt="${bDef.name} Interior" class="absolute inset-0 w-full h-full object-cover object-center" />` : ''}
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b11]/55 via-[#080b11]/20 to-[#080b11]/92"></div>
      <div class="relative z-10 p-4 flex items-center justify-between gap-3">
        <div class="px-3.5 py-2 rounded-lg bg-[#080b11]/70 backdrop-blur-md border border-[#fbbf24]/40">
          <div class="text-sm font-display font-bold text-[#fbbf24]">${bDef.icon || '⚔️'} ${bDef.name} <span class="text-[10px] font-mono text-[#e6edf3]/80">• Lv ${lvl} (${city.name})</span></div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.WargameApp.handleToggleFacilityInfo()" title="Guild Info" class="w-8 h-8 rounded-full bg-[#080b11]/80 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur-md border border-[#fbbf24]/50 text-[#fbbf24] font-bold text-xs flex items-center justify-center cursor-pointer transition">ⓘ</button>
          <button onclick="window.WargameApp.handleSwitchView('city')" class="px-3 py-1.5 rounded-lg bg-[#080b11]/75 hover:bg-[#fbbf24] hover:text-[#080b11] backdrop-blur-md text-[#fbbf24] border border-[#fbbf24]/50 text-[11px] font-mono font-bold uppercase cursor-pointer transition whitespace-nowrap">🏰 Exit to City</button>
        </div>
      </div>
      ${infoPopoverHtml ? `<div class="relative z-20">${infoPopoverHtml}</div>` : ''}
      <div class="relative z-10 flex-1 min-h-[150px]"></div>
      <div class="relative z-10 p-4 [&_>div]:bg-[#080b11]/78 [&_>div]:backdrop-blur-md">
        ${servicesHtml}
      </div>
    </div>
  `;

  setHtmlIfChanged(gridEl, unifiedHtml);
}

function renderRightTasksAndStreamSidebar(simHost) {
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

function formatEventSummary(ev) {
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

  // --- Module: src/wargame/test/wargameSelfTest.js ---
// Headless & In-Browser Verification Suite for the Standalone Macro Wargame & Real-Time Simulation Engine










function evaluateWargameSelfTests() {
  const results = [];

  // =========================================================================
  // Test 1: Campaign Start Screen & Strict Settler-First Onboarding Contract
  // =========================================================================
  const host1 = createWargameSimHost();
  const startsOnTitle = host1.state.campaignPhase === CAMPAIGN_PHASES.TITLE && host1.state.world === null;

  const startRes = host1.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: {
      houseName: 'House Starborn',
      worldName: 'Aethelgard Prime',
      seedCode: 'STAR-2026',
      simSpeed: 1
    }
  });

  const selUnit1 = getSelectedOverworldUnit(host1.state);
  const noCitiesInitially = Object.keys(host1.state.world.cities || {}).length === 0;
  const noHeroesInitially = Array.isArray(host1.state.world.heroes) && host1.state.world.heroes.length === 0;
  const onlySettlerExists = Boolean(
    selUnit1 &&
    selUnit1.unitType === 'settler' &&
    selUnit1.canFoundCity === true &&
    selUnit1.canEnterDungeon === false &&
    host1.state.world.overworld.units.length === 1
  );

  // Verify premature Hero Recruitment is strictly rejected before City & Guild exist
  const prematureRecruit = host1.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'fighter' }
  });
  const prematureGuildView = host1.dispatch({
    type: COMMAND_TYPES.SWITCH_VIEW,
    payload: { view: WARGAME_VIEWS.GUILD }
  });

  const t1Pass = Boolean(
    startsOnTitle &&
    startRes.ok &&
    host1.state.campaignPhase === CAMPAIGN_PHASES.SETTLER_PIONEER &&
    noCitiesInitially &&
    noHeroesInitially &&
    onlySettlerExists &&
    !prematureRecruit.ok &&
    !prematureGuildView.ok
  );

  results.push({
    name: '1. Campaign Start Screen & Strict Settler-First Onboarding (No Premature Hero)',
    pass: t1Pass,
    detail: t1Pass
      ? 'Starts at Title Screen, transitions to SETTLER_PIONEER with only Pioneer Settler, 0 heroes, and blocks premature hero recruitment/guild view'
      : 'Failed Settler-First onboarding invariant'
  });

  // =========================================================================
  // Test 2: Binary Min-Heap Priority Queue & WorldEventStream Ring Buffer
  // =========================================================================
  const pq = createMinHeapPriorityQueue();
  pq.push({ jobId: 'j_late',  dueSimTimeMs: 9000, seq: 1 });
  pq.push({ jobId: 'j_early', dueSimTimeMs: 1500, seq: 2 });
  pq.push({ jobId: 'j_mid',   dueSimTimeMs: 4200, seq: 3 });
  pq.push({ jobId: 'j_cancel',dueSimTimeMs: 2500, seq: 4 });

  const removedJob = pq.removeById('j_cancel');
  const pop1 = pq.pop();
  const pop2 = pq.pop();
  const pop3 = pq.pop();

  const streamEvents = [];
  const unsub = host1.eventStream.subscribe(STREAM_TOPICS.CLOCK_SPEED_CHANGED, function(ev) {
    streamEvents.push(ev);
  });
  host1.dispatch({ type: COMMAND_TYPES.SET_SIM_SPEED, payload: { speedMultiplier: 5 } });
  unsub();

  const replaySince = host1.eventStream.getEventsSince(0);
  const t2Pass = Boolean(
    removedJob && removedJob.jobId === 'j_cancel' &&
    pop1 && pop1.jobId === 'j_early' &&
    pop2 && pop2.jobId === 'j_mid' &&
    pop3 && pop3.jobId === 'j_late' &&
    pq.size() === 0 &&
    streamEvents.length === 1 &&
    replaySince.length >= 2
  );

  results.push({
    name: '2. Binary Min-Heap Priority Queue Scheduler & WorldEventStream Pub/Sub Replay',
    pass: t2Pass,
    detail: t2Pass
      ? 'O(log N) chronological ordering, mid-heap cancellation, topic subscription, and sequence cursor replay verified'
      : 'Failed scheduler or event stream checks'
  });

  // =========================================================================
  // Test 3: Real-Time A* Unit Marching, Smooth Interpolation & Safe Settler Respawn
  // =========================================================================
  const host3 = createWargameSimHost();
  host3.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Pathfinder', seedCode: 'STAR-3003' }
  });
  const settler3 = getSelectedOverworldUnit(host3.state);
  const startX3 = settler3.x;
  const startY3 = settler3.y;

  // Order a 2-tile march to the East
  const marchOrder = host3.dispatch({
    type: COMMAND_TYPES.ORDER_UNIT_MARCH,
    payload: { unitId: settler3.id, targetX: startX3 + 2, targetY: startY3 }
  });

  const isMarching = settler3.status === 'marching' && marchOrder.ok && marchOrder.data.stepsCount === 2;

  // Advance clock partially (1500ms < 3000ms first tile cost) -> unit should still be on startX3
  host3.stepClock(1500);
  const midMarchStillAtStart = settler3.x === startX3 && settler3.status === 'marching';

  // Advance clock by remaining 1500ms -> completes step 1!
  host3.stepClock(1500);
  const completedStep1 = settler3.x === startX3 + 1 && settler3.status === 'marching';

  // Advance clock by another 3000ms -> completes step 2 and finishes march!
  host3.stepClock(3000);
  const completedStep2 = settler3.x === startX3 + 2 && settler3.status === 'idle' && settler3.marchPlan === null;

  // Test Non-Permanent Loss Settler Respawn before founding city
  settler3.alive = false;
  const respawnCmd = host3.dispatch({ type: COMMAND_TYPES.RESPAWN_SETTLER });
  const revivedSettler = getSelectedOverworldUnit(host3.state);
  const respawnValid = Boolean(respawnCmd.ok && revivedSettler && revivedSettler.alive && revivedSettler.unitType === 'settler');

  const t3Pass = Boolean(isMarching && midMarchStillAtStart && completedStep1 && completedStep2 && respawnValid);
  results.push({
    name: '3. Real-Time A* Overworld Marching, Tick Clock Progression & Settler Safe Respawn',
    pass: t3Pass,
    detail: t3Pass
      ? 'Multi-tile A* route scheduling, partial-step interpolation, chronological step completion, and settler respawn verified'
      : 'Failed real-time march or respawn verification'
  });

  // =========================================================================
  // Test 4: 8x8 Spatial Grid (64 Plots), Plot Selection, Building Relocation & Demolition Salvage
  // =========================================================================
  const host4 = createWargameSimHost();
  host4.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Builder', seedCode: 'STAR-4004' }
  });

  const foundCmd = host4.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Oakhaven Prime' }
  });
  const city4 = getPrimaryCity(host4.state);
  const phaseIsCity = host4.state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED;
  const guildNotBuiltYet = !city4.buildings.guild_hall;

  // Queue a Hut on Plot #1 (3000ms build time)
  const woodBefore = city4.stockpile.wood;
  const queueHut = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const costDeducted = city4.stockpile.wood < woodBefore && city4.buildQueue.length === 1;

  // Queue a 2nd Hut on Plot #2 (pending item)
  const woodBeforeHut2 = city4.stockpile.wood;
  const queueHut2 = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'hut' }
  });
  // Cancel pending item -> 100% full refund
  const cancelHut2 = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueHut2.data.queueItem.queueItemId }
  });
  const pendingRefundVerified = cancelHut2.ok && city4.stockpile.wood === woodBeforeHut2 && city4.buildQueue.length === 1;

  // Test active cancel prorated refund + 50% cleanup demolition:
  // Hut is active (duration 3000ms). Advance 1500ms (50% elapsed).
  host4.stepClock(1500);
  const woodBeforeCancelActive = city4.stockpile.wood;
  const cancelActiveHut = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueHut.data.queueItem.queueItemId }
  });
  const proratedRefundGiven = cancelActiveHut.ok && city4.stockpile.wood > woodBeforeCancelActive;
  const cleanupJobActive = city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'cleanup';

  // Advance clock by 1000ms to finish cleanup
  host4.stepClock(1000);
  const cleanupFinished = city4.buildQueue.length === 0 && !city4.plots[1].underConstruction && !city4.plots[1].demolishing;

  // Re-queue Hut on Plot #1 and advance 3500ms -> Hut completes!
  host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  host4.stepClock(3500);
  const hutCompleted = city4.buildings.hut === 1;

  // Verify 8x8 spatial grid (64 plots) & center Meeting Hall
  const gridHas64Plots = Array.isArray(city4.plots) && city4.plots.length === 64;
  const centerPlotIsHall = city4.plots[27] && (city4.plots[27].buildingId === 'town_hall' || city4.plots[27].buildingId === 'meeting_hall') && city4.plots[27].level === 1;

  // Test selecting city plot
  const selectPlotCmd = host4.dispatch({
    type: COMMAND_TYPES.SELECT_CITY_PLOT,
    payload: { plotIndex: 12 }
  });
  const plotSelected = selectPlotCmd.ok && city4.selectedPlotIndex === 12;

  // Test moving a building (Plot 1 Hut to empty Plot 10)
  const moveCmd = host4.dispatch({
    type: COMMAND_TYPES.MOVE_BUILDING,
    payload: { fromPlotIndex: 1, toPlotIndex: 10 }
  });
  const moveQueued = moveCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'move';
  const plotsMarkedRelocating = Boolean(city4.plots[1].relocating && city4.plots[10].relocating);

  // Advance clock by 2500ms -> move completes!
  host4.stepClock(2500);
  const moveCompleted = city4.plots[1].buildingId === null &&
                        city4.plots[10].buildingId === 'hut' &&
                        city4.plots[10].level === 1 &&
                        !city4.plots[1].relocating &&
                        !city4.plots[10].relocating;

  // Test deliberate Demolition of the relocated Hut on Plot 10 with 35% salvage:
  const woodBeforeDemolish = city4.stockpile.wood;
  const demolishCmd = host4.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: 10 }
  });
  const demolishQueued = demolishCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'demolish';
  // Advance 2500ms to complete demolition
  host4.stepClock(2500);
  const demolishCompleted = !city4.buildings.hut && city4.plots[10].level === 0 && city4.stockpile.wood > woodBeforeDemolish;

  // Test 3-slot build queue limit
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 1, buildingId: 'hut' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 2, buildingId: 'hut' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 3, buildingId: 'hut' } });
  const fourthQueueBlocked = !host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'hut' } }).ok;

  const t4Pass = Boolean(
    foundCmd.ok &&
    phaseIsCity &&
    guildNotBuiltYet &&
    costDeducted &&
    pendingRefundVerified &&
    proratedRefundGiven &&
    cleanupJobActive &&
    cleanupFinished &&
    hutCompleted &&
    gridHas64Plots &&
    centerPlotIsHall &&
    plotSelected &&
    moveQueued &&
    plotsMarkedRelocating &&
    moveCompleted &&
    demolishQueued &&
    demolishCompleted &&
    fourthQueueBlocked
  );

  results.push({
    name: '4. 8x8 Spatial Grid (64 Plots), Plot Selection, Building Relocation & Demolition Salvage',
    pass: t4Pass,
    detail: t4Pass
      ? '8x8 grid of 64 plots initialized with central Meeting Hall at (3,3), plot selection, timed building relocation, and demolition salvage verified'
      : 'Failed 8x8 spatial grid or relocation checks'
  });

  // =========================================================================
  // Test 5: Adventurers Guild Completion, 60s Hero Recruitment Queue & Vanguard Formation
  // =========================================================================
  const host5 = createWargameSimHost();
  host5.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Guildmaster', seedCode: 'STAR-5005' }
  });
  host5.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Vanguard Hold' }
  });
  const city5 = getPrimaryCity(host5.state);

  // Set up prerequisites to charter Adventurers Guild (Hut -> Garden -> Well -> Lumber Camp -> Quarry + 20 population)
  city5.plots[1].buildingId = 'hut';
  city5.plots[1].level = 1;
  city5.buildings.hut = 1;
  city5.buildings.garden = 1;
  city5.buildings.well = 1;
  city5.buildings.lumber_camp = 1;
  city5.buildings.quarry = 1;
  city5.population = { current: 20, max: 25, growthProgress: 0, starving: false };

  // Claim campaign milestone rewards in sequence
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_first_hut' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_garden' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_well' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_grow_population_12' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_lumber_camp' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_quarry' } });

  // Queue Adventurers Guild on Plot #4 (6000ms build duration)
  const queueGuild = host5.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 4, buildingId: 'guild_hall' }
  });

  // Advance clock by 6500ms -> Guild finishes and unlocks GUILD_UNLOCKED phase!
  host5.stepClock(6500);
  const guildUnlocked = host5.state.campaignPhase === CAMPAIGN_PHASES.GUILD_UNLOCKED && city5.buildings.guild_hall === 1;

  // Claim Task ("Charter the Adventurers Guild") -> grants +100 Gold, +50 Food
  const claimTaskGuild = host5.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: 'task_build_guild_hall' }
  });

  // Start training an Adventurer Hero at the Adventurers Guild (60,000ms training queue)
  const recruitRanger = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Sylvanas Delver' }
  });
  const rangerQueued = recruitRanger.ok && city5.recruitmentQueue.length === 1 && city5.recruitmentQueue[0].status === 'training';
  const heroNotInstantlySpawned = host5.state.world.heroes.length === 0;

  // Queue a 2nd trainee (Adventurer) and test recruitment cancel prorated refund
  const goldBeforeFighter = city5.stockpile.gold;
  const recruitFighter = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Garrick Delver' }
  });
  const fighterQueued = recruitFighter.ok && city5.recruitmentQueue.length === 2 && city5.recruitmentQueue[1].status === 'queued';

  // Cancel queued trainee -> 100% full refund
  const cancelFighter = host5.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: recruitFighter.data.queueItem.queueItemId }
  });
  const fighterRefundVerified = cancelFighter.ok && city5.stockpile.gold === goldBeforeFighter && city5.recruitmentQueue.length === 1;

  // Advance clock by 30,000ms -> Trainee still in training!
  host5.stepClock(30000);
  const stillTrainingAt30s = host5.state.world.heroes.length === 0 && city5.recruitmentQueue.length === 1;

  // Advance clock by remaining 30,000ms (total 60,000ms elapsed) -> Training finishes!
  host5.stepClock(30000);
  const rangerCompleted = city5.recruitmentQueue.length === 0 && host5.state.world.heroes.length === 1 && host5.state.world.heroes[0].classId === 'adventurer';
  const partySpawnedOnOverworld = host5.state.world.overworld.units.some(function(u) {
    return u.unitType === 'hero_party' && u.canEnterDungeon === true && u.alive === true;
  });

  const t5Pass = Boolean(
    queueGuild.ok &&
    guildUnlocked &&
    claimTaskGuild.ok &&
    rangerQueued &&
    heroNotInstantlySpawned &&
    fighterQueued &&
    fighterRefundVerified &&
    stillTrainingAt30s &&
    rangerCompleted &&
    partySpawnedOnOverworld
  );

  results.push({
    name: '5. Adventurers Guild Completion, 60s Hero Recruitment Queue & Vanguard Formation',
    pass: t5Pass,
    detail: t5Pass
      ? 'Guild completion unlocks recruitment, swearing in enqueues 60s trainee, cancel gives refund, and timer resolution inducts hero into Vanguard Party'
      : 'Failed 60s hero recruitment queue lifecycle'
  });

  // =========================================================================
  // Test 6: Tier 1 Buildings, Meeting Hall Level Cap, Doubling Times & Paced Progression
  // =========================================================================
  const host6 = createWargameSimHost();
  host6.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Frontier', seedCode: 'STAR-6006' }
  });
  host6.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Aethelgard Haven' }
  });
  const city6 = getPrimaryCity(host6.state);

  // 1. Verify Water and Ore initialized in city stockpile
  const hasWaterAndOre = typeof city6.stockpile.water === 'number' &&
                         typeof city6.stockpile.ore === 'number' &&
                         city6.stockpile.water >= 50 &&
                         city6.stockpile.ore >= 20;

  // 2. Verify doubling construction duration:
  // Base Hut build time = 3000ms. Level 2 = 6000ms. Level 3 = 12000ms.
  const hutDurLv1 = computeBuildingDurationMs('hut', 1);
  const hutDurLv2 = computeBuildingDurationMs('hut', 2);
  const hutDurLv3 = computeBuildingDurationMs('hut', 3);
  const durationDoubles = (hutDurLv1 === 3000 && hutDurLv2 === 6000 && hutDurLv3 === 12000);

  // 3. Verify Paced Building Unlock Progression:
  // At founding, only Hut is constructible! Garden, Well, Lumber Camp, Quarry, Guild are locked.
  const hutUnlockedInitially = isBuildingPrerequisiteMet(city6, 'hut');
  const gardenLockedInitially = !isBuildingPrerequisiteMet(city6, 'garden');
  const wellLockedInitially = !isBuildingPrerequisiteMet(city6, 'well');
  const lumberLockedInitially = !isBuildingPrerequisiteMet(city6, 'lumber_camp');

  // Build a Hut on Plot 1 -> now Garden unlocks!
  host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  host6.stepClock(3500); // Complete Hut
  const hutCompleted6 = city6.plots[1].buildingId === 'hut' && city6.plots[1].level === 1;
  const gardenUnlockedAfterHut = isBuildingPrerequisiteMet(city6, 'garden');

  // Attempt to upgrade Hut to Level 2 while Meeting Hall is Level 1 -> MUST BE REJECTED!
  const prematureHutUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const upgradeBlockedByMeetingHall = !prematureHutUpgrade.ok;

  // Upgrade Meeting Hall (Plot 27) to Level 2 (Takes 10,000ms with doubling duration)
  city6.stockpile.wood = 500;
  city6.stockpile.stone = 500;
  city6.stockpile.gold = 500;
  city6.stockpile.food = 500;
  city6.stockpile.water = 500;
  const queueMeetingHallLv2 = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 27, buildingId: 'meeting_hall' }
  });
  host6.stepClock(11000); // Complete Meeting Hall Level 2
  const meetingHallLevel2 = (city6.buildings.meeting_hall === 2 || city6.buildings.town_hall === 2);

  // Now upgrade Hut to Level 2 (Takes 6,000ms with doubling duration) -> MUST SUCCEED!
  const validHutUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const upgradeAllowedAfterMeetingHall = validHutUpgrade.ok;
  host6.stepClock(7000); // Finish upgrading Hut to Lv 2

  // Build Garden on Plot 2 -> now Well unlocks!
  host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'garden' }
  });
  host6.stepClock(4000);
  const wellUnlockedAfterGarden = isBuildingPrerequisiteMet(city6, 'well');

  // 4. Test Population Sustenance Consumption, Growth & Immediate Frontier Growth Task Evaluation
  // With 5 citizens, consumption is 1 food and 1 water per tick.
  // With abundant food and water, growthProgress increases by +25 per tick.
  const popBeforeTick = city6.population.current;
  host6.stepClock(20000); // 4 resource production ticks (20s) -> should grow population by +1!
  const popGrew = city6.population.current >= popBeforeTick + 1;

  // Verify Frontier Growth (task_grow_population_12) auto-completes on resource tick when pop reaches 12
  city6.population.current = 11;
  city6.population.max = 15;
  city6.population.growthProgress = 75;
  city6.stockpile.food = 150;
  city6.stockpile.water = 150;
  host6.state.world.tasks.task_build_well.status = 'completed';
  host6.state.world.tasks.task_grow_population_12.status = 'available';
  host6.stepClock(5000); // 1 tick -> grows from 11 to 12 and immediately triggers evaluateTaskDAG
  const popTaskAutoCompleted = city6.population.current === 12 &&
    host6.state.world.tasks.task_grow_population_12.status === 'completed';

  const t6Pass = Boolean(
    hasWaterAndOre &&
    durationDoubles &&
    hutUnlockedInitially &&
    gardenLockedInitially &&
    wellLockedInitially &&
    lumberLockedInitially &&
    hutCompleted6 &&
    gardenUnlockedAfterHut &&
    upgradeBlockedByMeetingHall &&
    meetingHallLevel2 &&
    upgradeAllowedAfterMeetingHall &&
    wellUnlockedAfterGarden &&
    popGrew &&
    popTaskAutoCompleted
  );

  results.push({
    name: '6. Tier 1 Buildings, Meeting Hall Level Cap, Doubling Times & Paced Progression',
    pass: t6Pass,
    detail: t6Pass
      ? 'Doubling build durations, paced sequential unlocking (Hut -> Garden -> Well), Meeting Hall level cap, and population food/water consumption growth verified'
      : 'Failed Tier 1 building catalog or paced progression invariants'
  });

  // =========================================================================
  // Test 7: Multi-Dungeon Discovery, Wandering Hostile Skirmish & Dungeon Entry Handoff
  // =========================================================================
  const host7 = createWargameSimHost();
  host7.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Expedition', seedCode: 'STAR-7007' }
  });
  host7.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Oakhaven Bastion' }
  });
  const city7 = getPrimaryCity(host7.state);
  const ow7 = host7.state.world.overworld;

  // Verify 4 curated dungeon POIs & wandering hostiles spawned
  const dungeonPois7 = (ow7.pois || []).filter(function(p) { return p.type === 'dungeon_entrance'; });
  const hasFourDungeons = dungeonPois7.length >= 4;
  const hasWanderingHostiles = Array.isArray(ow7.hostiles) && ow7.hostiles.length >= 4;

  // Build Adventurers Guild Hall -> verifies Starfall Vaults auto-discovery
  city7.stockpile.wood = 500;
  city7.stockpile.stone = 500;
  city7.stockpile.gold = 500;
  city7.stockpile.food = 500;
  city7.stockpile.water = 500;
  city7.population = { current: 20, max: 25, growthProgress: 0, starving: false, starveTicks: 0 };
  city7.buildings.hut = 1;
  city7.buildings.garden = 1;
  city7.buildings.well = 1;
  city7.buildings.lumber_camp = 1;
  city7.buildings.quarry = 1;
  city7.plots[2].buildingId = 'quarry';
  city7.plots[2].level = 1;
  host7.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'guild_hall' }
  });
  host7.stepClock(12000);

  const starfallPoi = dungeonPois7.find(function(p) { return p.id === 'poi_dungeon_starfall'; });
  const starfallRevealedByGuild = Boolean(starfallPoi && starfallPoi.discovered === true);

  // Recruit Adventurer Hero at Adventurers Guild & advance 60s
  host7.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Aldric Delver' }
  });
  host7.stepClock(60000);
  const party7 = ow7.units.find(function(u) { return u.unitType === 'hero_party' && u.alive; });

  // Place a live wandering hostile directly adjacent to party and march onto it -> Victory!
  const testHostile = ow7.hostiles[0];
  testHostile.x = party7.x + 1;
  testHostile.y = party7.y;
  testHostile.alive = true;
  host7.dispatch({
    type: COMMAND_TYPES.ORDER_UNIT_MARCH,
    payload: { unitId: party7.id, targetX: testHostile.x, targetY: testHostile.y }
  });
  host7.stepClock(8000);
  const skirmishWon = !testHostile.alive && host7.state.world.stats.skirmishesWon >= 1 &&
    Boolean(party7.cargo && party7.cargo.gold >= testHostile.rewardGold);

  // Order March to Starfall Vaults via CMD_MARCH_TO_DUNGEON
  const marchToDng = host7.dispatch({
    type: COMMAND_TYPES.MARCH_TO_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall' }
  });
  const intentIsDungeon = Boolean(marchToDng.ok && party7.marchPlan && party7.marchPlan.intent === 'enter_dungeon');

  // Verify CMD_ENTER_DUNGEON is strictly blocked while party is still mid-march
  const blockedWhileMarching = !host7.dispatch({
    type: COMMAND_TYPES.ENTER_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall', skipStorageWrite: true }
  }).ok;

  // Advance clock until party arrives at Starfall Vaults
  host7.stepClock(60000);
  const arrivedAtVault = party7.x === starfallPoi.x && party7.y === starfallPoi.y && party7.status === 'idle';

  // Claim completed Task 11 while standing on the Vault tile -> party MUST stay at the Vault!
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_first_hut' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_garden' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_well' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_grow_population_12' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_lumber_camp' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_quarry' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_guild_hall' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_recruit_first_hero' } });
  const claimMarchTask = host7.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: 'task_march_to_dungeon' }
  });
  const stayedAtVaultAfterClaim = Boolean(
    claimMarchTask.ok &&
    party7.x === starfallPoi.x &&
    party7.y === starfallPoi.y &&
    party7.status === 'idle' &&
    ow7.selectedUnitId === party7.id
  );

  // Enter Dungeon -> transitions to in_dungeon and produces valid handoff envelope
  const enterRes = host7.dispatch({
    type: COMMAND_TYPES.ENTER_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall', skipStorageWrite: true }
  });
  const enteredCleanly = Boolean(
    enterRes.ok &&
    party7.status === 'in_dungeon' &&
    host7.state.world.stats.dungeonsEntered === 1 &&
    enterRes.data &&
    enterRes.data.envelope &&
    enterRes.data.envelope.direction === 'wargame_to_dungeon' &&
    enterRes.data.envelope.dungeon.dungeonId === 'dng_starfall'
  );

  const t7Checks = {
    hasFourDungeons: hasFourDungeons,
    hasWanderingHostiles: hasWanderingHostiles,
    starfallRevealedByGuild: starfallRevealedByGuild,
    skirmishWon: skirmishWon,
    intentIsDungeon: intentIsDungeon,
    blockedWhileMarching: blockedWhileMarching,
    arrivedAtVault: arrivedAtVault,
    stayedAtVaultAfterClaim: stayedAtVaultAfterClaim,
    enteredCleanly: enteredCleanly
  };
  const failed7 = Object.keys(t7Checks).filter(function(k) { return !t7Checks[k]; });
  const t7Pass = failed7.length === 0;

  results.push({
    name: '7. Multi-Dungeon Discovery, Wandering Hostile Skirmish & Dungeon Entry Handoff',
    pass: t7Pass,
    detail: t7Pass
      ? '4 curated dungeon POIs, Guild Hall Starfall reveal, Overworld hostile skirmish victory & cargo, CMD_MARCH_TO_DUNGEON, and CMD_ENTER_DUNGEON handoff envelope verified'
      : 'Failed checks: ' + failed7.join(', ')
  });

  // =========================================================================
  // Test 8: Dungeon Extraction Return March, Cargo Banking, Recall Scroll & Defeat Recovery
  // =========================================================================
  const city7GoldBefore = city7.stockpile.gold;
  const city7OreBefore = city7.stockpile.ore;

  // 8A. Surface Extraction via Floor 1 Stairs -> placed at Vault POI & timed Return March home
  const extReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'extracted',
      method: 'Floor 1 Ascending Stairs (<)',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 3,
      heroXp: 240,
      dungeonPoiId: 'poi_dungeon_starfall',
      lootSummary: { gold: 120, ore: 18, gems: 2, gearCount: 1 }
    }
  });
  const startedReturnMarch = Boolean(
    extReturn.ok &&
    extReturn.data.returnMarchStarted === true &&
    party7.status === 'marching' &&
    party7.marchPlan &&
    party7.marchPlan.intent === 'return_city' &&
    party7.cargo &&
    party7.cargo.gold >= 120
  );
  const heroLevelSynced = host7.state.world.heroes[0].level === 3;

  // Clear hostiles along return path so return march completes cleanly to city
  ow7.hostiles.forEach(function(h) { h.alive = false; });
  host7.stepClock(60000);
  const returnedAndBanked = Boolean(
    party7.x === city7.x &&
    party7.y === city7.y &&
    party7.cargo === null &&
    city7.stockpile.gold >= city7GoldBefore + 120 &&
    city7.stockpile.ore >= city7OreBefore + 18 &&
    host7.state.world.stats.expeditionsBanked >= 1
  );

  // 8B. Astral Recall Scroll Surface Extraction -> surfaces at Vault POI (idle, cargo intact; does not teleport to a city)
  const goldBeforeRecall = city7.stockpile.gold;
  party7.x = starfallPoi.x;
  party7.y = starfallPoi.y;
  party7.status = 'in_dungeon';
  const recallReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'extracted',
      method: 'Astral Recall Scroll',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 4,
      dungeonPoiId: 'poi_dungeon_starfall',
      lootSummary: { gold: 80, ore: 10, gems: 1, gearCount: 0 }
    }
  });
  const recallSurfaceVerified = Boolean(
    recallReturn.ok &&
    recallReturn.data.surfacedAtEntrance === true &&
    recallReturn.data.returnMarchStarted === false &&
    party7.x === starfallPoi.x &&
    party7.y === starfallPoi.y &&
    party7.status === 'idle' &&
    party7.cargo &&
    party7.cargo.gold >= 80 &&
    city7.stockpile.gold === goldBeforeRecall
  );

  // 8C. Non-Permanent Defeat Recovery -> express return to City Guild Hall, salvage credited, Hero preserved
  const goldBeforeDefeat = city7.stockpile.gold;
  party7.x = starfallPoi.x;
  party7.y = starfallPoi.y;
  party7.status = 'in_dungeon';
  party7.cargo = { gold: 999, ore: 50, gems: 0, gearCount: 0 };
  const defeatReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'defeated',
      method: 'Guild Scout Rescue',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 4,
      killerName: 'Starfall Colossus',
      floorDepth: 5,
      lootSummary: { salvagedGold: 35 }
    }
  });
  const defeatRecoveryVerified = Boolean(
    defeatReturn.ok &&
    party7.x === city7.x &&
    party7.y === city7.y &&
    party7.status === 'idle' &&
    party7.hp === party7.maxHp &&
    party7.cargo === null &&
    city7.stockpile.gold === goldBeforeDefeat + 35 &&
    host7.state.world.heroes[0].level === 4
  );

  const t8Checks = {
    startedReturnMarch: startedReturnMarch,
    heroLevelSynced: heroLevelSynced,
    returnedAndBanked: returnedAndBanked,
    recallSurfaceVerified: recallSurfaceVerified,
    defeatRecoveryVerified: defeatRecoveryVerified
  };
  const failed8 = Object.keys(t8Checks).filter(function(k) { return !t8Checks[k]; });
  const t8Pass = failed8.length === 0;

  results.push({
    name: '8. Dungeon Extraction Return March, Cargo Banking, Recall Scroll & Defeat Recovery',
    pass: t8Pass,
    detail: t8Pass
      ? 'Floor 1 extraction return march & cargo banking, Astral Recall Scroll surface exit at dungeon entrance, and Golden Rule #2 defeat rescue verified'
      : 'Failed checks: ' + failed8.join(', ')
  });

  // =========================================================================
  // Test 9: Shared Cross-Engine Character Sheet, Paper-Doll & Hero Equipment (Inc 9.4)
  // =========================================================================
  const hero9 = host7.state.world.heroes[0];
  const hasStarterEq9 = Boolean(hero9 && hero9.equipment && hero9.equipment.weapon && hero9.equipment.pickaxe);
  const hasCosmetics9 = Boolean(hero9 && hero9.cosmetics && COSMETIC_SLOTS.length === 4 && SHARED_PAPER_DOLL_SLOTS.length === 10);

  const profBefore9 = normalizeSharedHeroProfile(hero9);
  const bagSignet = (hero9.bagGear || []).find(function(it) { return it.slot === 'accessory'; });
  const eqRes9 = bagSignet ? host7.dispatch({
    type: COMMAND_TYPES.EQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, itemUid: bagSignet.uid }
  }) : { ok: false };
  const profAfterEq9 = normalizeSharedHeroProfile(hero9);
  const equipBoostedStats9 = Boolean(
    eqRes9.ok &&
    hero9.equipment.accessory &&
    hero9.equipment.accessory.uid === bagSignet.uid &&
    profAfterEq9.stats.atk === profBefore9.stats.atk + (bagSignet.atk || 0)
  );

  // Unequip helm -> moves back to bagGear; unequip pickaxe -> strictly rejected
  const uneqHelm9 = host7.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, slot: 'helm' }
  });
  const uneqPickBlocked9 = !host7.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, slot: 'pickaxe' }
  }).ok;
  const unequipVerified9 = Boolean(uneqHelm9.ok && hero9.equipment.helm === null && uneqPickBlocked9);

  // Verify shared paper-doll canvas rendering on mock context
  let drawCalls9 = 0;
  const mockCanvas9 = {
    width: 340,
    height: 330,
    getContext: function() {
      return {
        fillStyle: '', strokeStyle: '', lineWidth: 1,
        save: function(){}, restore: function(){}, clearRect: function(){},
        beginPath: function(){}, closePath: function(){}, moveTo: function(){}, lineTo: function(){},
        arc: function(){ drawCalls9++; }, ellipse: function(){ drawCalls9++; },
        fill: function(){ drawCalls9++; }, stroke: function(){ drawCalls9++; },
        fillRect: function(){ drawCalls9++; }, strokeRect: function(){ drawCalls9++; }
      };
    }
  };
  renderSharedPaperDollMannequin(mockCanvas9, hero9);
  const mannequinRendered9 = drawCalls9 > 5;

  // Verify CMD_AUTO_EQUIP_HERO equips superior gear from hero.bagGear
  hero9.bagGear.push({ uid: 'upg_w_9', slot: 'weapon', name: 'Star-Forged Greatsword', rarity: 'epic', atk: 24, def: 2, value: 200 });
  const autoEqRes9 = host7.dispatch({
    type: COMMAND_TYPES.AUTO_EQUIP_HERO,
    payload: { heroId: hero9.id }
  });
  const autoEquipVerified9 = Boolean(autoEqRes9.ok && hero9.equipment.weapon && hero9.equipment.weapon.uid === 'upg_w_9');

  const t9Checks = {
    hasStarterEq9: hasStarterEq9,
    hasCosmetics9: hasCosmetics9,
    equipBoostedStats9: equipBoostedStats9,
    unequipVerified9: unequipVerified9,
    autoEquipVerified9: autoEquipVerified9,
    mannequinRendered9: mannequinRendered9
  };
  const failed9 = Object.keys(t9Checks).filter(function(k) { return !t9Checks[k]; });
  const t9Pass = failed9.length === 0;

  results.push({
    name: '9. Shared Cross-Engine Character Sheet, Paper-Doll & Hero Equipment (Inc 9.4)',
    pass: t9Pass,
    detail: t9Pass
      ? 'Shared 10-slot paper-doll, 4 prestige cosmetic slots, CMD_EQUIP/UNEQUIP_HERO_ITEM stat recomputation, pickaxe guard, and canvas render verified'
      : 'Failed checks: ' + failed9.join(', ')
  });

  // =========================================================================
  // Test 10: City Vault Storage (200 Slots), Roster Cap (3), Dismiss, Overall Leader, Garrison & Temple Chapterhouse (ADR-0012)
  // =========================================================================
  // 10A. City Storage Container: Dump Hero Bag -> City Vault -> Withdraw back
  const bagCountBeforeDump = hero9.bagGear.length;
  const dumpRes10 = host7.dispatch({
    type: COMMAND_TYPES.DUMP_HERO_BAG_TO_CITY,
    payload: { heroId: hero9.id }
  });
  const dumpedToCity10 = Boolean(
    dumpRes10.ok &&
    hero9.bagGear.length === 0 &&
    city7.storage &&
    city7.storage.capacity === 200 &&
    city7.storage.items.length >= bagCountBeforeDump
  );
  const storedSampleUid = city7.storage.items[0] ? city7.storage.items[0].uid : null;
  const withdrawRes10 = storedSampleUid ? host7.dispatch({
    type: COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE,
    payload: { heroId: hero9.id, itemUid: storedSampleUid }
  }) : { ok: false };
  const withdrewFromCity10 = Boolean(withdrawRes10.ok && hero9.bagGear.length === 1);

  // 10B. Garrison Party Size Scaling (1 pre-Garrison -> 2 at Garrison Lv 1) & Temple Chapterhouse (Cleric Lv 1 -> Paladin Lv 2)
  const preGarrisonMax = computeMaxPartySize(city7);
  city7.buildings.garrison = 1;
  const postGarrisonMax = computeMaxPartySize(city7);
  city7.buildings.temple_chapterhouse = 1;
  const templeLv1Classes = getCityRecruitableClasses(city7);
  city7.buildings.temple_chapterhouse = 2;
  const templeLv2Classes = getCityRecruitableClasses(city7);
  const templeAndGarrisonVerified = Boolean(
    preGarrisonMax === 1 &&
    postGarrisonMax === 2 &&
    templeLv1Classes.indexOf('cleric') !== -1 &&
    templeLv1Classes.indexOf('paladin') === -1 &&
    templeLv2Classes.indexOf('paladin') !== -1
  );

  // 10C. Hero Roster Cap of 3, Overall Leader Reassignment & Dismiss Hero (Gear preserved in City Storage)
  city7.stockpile.gold = 500;
  city7.stockpile.food = 500;
  city7.buildings.mages_guild = 1;
  city7.buildings.thieves_guild = 1;
  const rec2 = host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'cleric', heroName: 'Brother Aldous' } });
  const rec3 = host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'mage', heroName: 'Lyra Starweaver' } });
  const rec4Blocked = !host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'thief', heroName: 'Vex Shadow' } }).ok;
  host7.stepClock(125000);
  const rosterAtCap3 = Boolean(rec2.ok && rec3.ok && rec4Blocked && host7.state.world.heroes.length === 3);

  const secondHero = host7.state.world.heroes[1];
  const leaderRes10 = host7.dispatch({ type: COMMAND_TYPES.SET_OVERALL_LEADER, payload: { heroId: secondHero.id } });
  const leaderChanged10 = Boolean(leaderRes10.ok && host7.state.world.roster.overallLeaderHeroId === secondHero.id);

  // Assign 2nd hero to 1st party using Garrison Lv 1 (maxSize 2)
  const party1Id = host7.state.world.parties[0].id;
  const assignRes10 = host7.dispatch({ type: COMMAND_TYPES.ASSIGN_HERO_TO_PARTY, payload: { partyId: party1Id, heroId: secondHero.id } });
  const partyAssignVerified10 = Boolean(assignRes10.ok && host7.state.world.parties[0].memberIds.length === 2);

  // Dismiss 3rd hero -> frees roster slot & deposits their gear safely into City Storage
  const thirdHero = host7.state.world.heroes[2];
  const storageBeforeDismiss = city7.storage.items.length;
  const dismissRes10 = host7.dispatch({ type: COMMAND_TYPES.DISMISS_HERO, payload: { heroId: thirdHero.id } });
  const dismissVerified10 = Boolean(
    dismissRes10.ok &&
    host7.state.world.heroes.length === 2 &&
    city7.storage.items.length > storageBeforeDismiss
  );

  const t10Checks = {
    dumpedToCity10: dumpedToCity10,
    withdrewFromCity10: withdrewFromCity10,
    templeAndGarrisonVerified: templeAndGarrisonVerified,
    rosterAtCap3: rosterAtCap3,
    leaderChanged10: leaderChanged10,
    partyAssignVerified10: partyAssignVerified10,
    dismissVerified10: dismissVerified10
  };
  const failed10 = Object.keys(t10Checks).filter(function(k) { return !t10Checks[k]; });
  const t10Pass = failed10.length === 0;

  results.push({
    name: '10. City Vault Storage (200 Slots), Roster Cap (3), Dismiss, Leader, Garrison & Temple Chapterhouse',
    pass: t10Pass,
    detail: t10Pass
      ? '200-slot City Storage dump/withdraw, Garrison party scaling, Temple Chapterhouse Cleric->Paladin gating, 3-Hero cap, Overall Leader, and Dismiss gear rescue verified'
      : 'Failed checks: ' + failed10.join(', ')
  });

  // =========================================================================
  // Test 11: Tier 2 City Industry — Smeltery Ingots, Apothecary Provisions & Warehouse Storage Expansion (Inc 9.6)
  // =========================================================================
  // Smeltery blocked before building -> succeeds after building
  const smeltBlocked11 = !host7.dispatch({ type: COMMAND_TYPES.SMELT_INGOTS, payload: { batches: 1 } }).ok;
  city7.buildings.smeltery = 1;
  city7.stockpile.ore = 50;
  city7.stockpile.wood = 50;
  const smeltRes11 = host7.dispatch({ type: COMMAND_TYPES.SMELT_INGOTS, payload: { batches: 2 } });
  const smelteryVerified11 = Boolean(
    smeltBlocked11 &&
    smeltRes11.ok &&
    city7.stockpile.ingots === 4 &&
    city7.stockpile.ore === 40 &&
    city7.stockpile.wood === 40
  );

  // Apothecary blocked before building -> brews Healing Tonic & scribes Recall Scroll after building
  const brewBlocked11 = !host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'potions' } }).ok;
  city7.buildings.apothecary = 1;
  city7.stockpile.food = 100;
  city7.stockpile.water = 100;
  city7.stockpile.gold = 200;
  const potBefore11 = city7.provisions.potions || 0;
  const recBefore11 = city7.provisions.recalls || 0;
  const brewPot11 = host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'potions' } });
  const brewRec11 = host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'recalls' } });
  const apothecaryVerified11 = Boolean(
    brewBlocked11 &&
    brewPot11.ok &&
    brewRec11.ok &&
    city7.provisions.potions === potBefore11 + 1 &&
    city7.provisions.recalls === recBefore11 + 1
  );

  // Warehouse expands City Vault Storage slot capacity (+50 per level)
  const capBeforeWh11 = computeCityStorageSlotCapacity(city7);
  city7.plots[5].buildingId = 'warehouse';
  city7.plots[5].level = 2;
  const capAfterWh11 = computeCityStorageSlotCapacity(city7);
  const warehouseSlotsVerified11 = capAfterWh11 === capBeforeWh11 + 100;

  const t11Checks = {
    smelteryVerified11: smelteryVerified11,
    apothecaryVerified11: apothecaryVerified11,
    warehouseSlotsVerified11: warehouseSlotsVerified11
  };
  const failed11 = Object.keys(t11Checks).filter(function(k) { return !t11Checks[k]; });
  const t11Pass = failed11.length === 0;

  results.push({
    name: '11. Tier 2 City Industry — Smeltery Ingots, Apothecary Provisions & Warehouse Storage Expansion (Inc 9.6)',
    pass: t11Pass,
    detail: t11Pass
      ? 'Smeltery ore->ingot refining, Apothecary potion/scroll brewing, and Warehouse +50/lv City Vault slot expansion verified'
      : 'Failed checks: ' + failed11.join(', ')
  });

  // =========================================================================
  // Test 12: City Blacksmith (Star-Forge) & Lapidary Workshop (Inc 9.7)
  // =========================================================================
  const forgeBlocked12 = !host7.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: 'weapon' } }).ok;
  city7.buildings.blacksmith = 2;
  city7.stockpile.ingots = 30;
  city7.stockpile.gold = 300;
  const forgeRes12 = host7.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: 'weapon' } });
  const forgedItem12 = forgeRes12.ok ? forgeRes12.data.item : null;
  const forgedVerified12 = Boolean(
    forgeBlocked12 &&
    forgedItem12 &&
    forgedItem12.rarity === 'rare' &&
    forgedItem12.sockets === 1
  );

  // Temper forged weapon (+2 ATK, temperRank = 1)
  const atkBeforeTemper12 = forgedItem12 ? forgedItem12.atk : 0;
  const temperRes12 = forgedItem12 ? host7.dispatch({ type: COMMAND_TYPES.TEMPER_EQUIPMENT, payload: { itemUid: forgedItem12.uid } }) : { ok: false };
  const temperVerified12 = Boolean(temperRes12.ok && forgedItem12.temperRank === 1 && forgedItem12.atk === atkBeforeTemper12 + 2);

  // Lapidary: Punch 2nd socket -> Socket Ruby (+4 ATK) -> Extract Ruby back to city.gems
  const lapBlocked12 = !host7.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: forgedItem12.uid } }).ok;
  city7.buildings.lapidary = 1;
  city7.gems = { ruby: 2, emerald: 1, sapphire: 0, topaz: 0, void_diamond: 0 };
  const punchRes12 = host7.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: forgedItem12.uid } });
  const atkBeforeGem12 = forgedItem12.atk;
  const socketRes12 = host7.dispatch({ type: COMMAND_TYPES.SOCKET_CITY_GEM, payload: { itemUid: forgedItem12.uid, gemId: 'ruby' } });
  const gemSocketed12 = Boolean(socketRes12.ok && forgedItem12.atk === atkBeforeGem12 + 4 && city7.gems.ruby === 1);
  const unsocketRes12 = host7.dispatch({ type: COMMAND_TYPES.UNSOCKET_CITY_GEM, payload: { itemUid: forgedItem12.uid } });
  const gemExtracted12 = Boolean(unsocketRes12.ok && forgedItem12.atk === atkBeforeGem12 && city7.gems.ruby === 2);

  const t12Checks = {
    forgedVerified12: forgedVerified12,
    temperVerified12: temperVerified12,
    lapBlocked12: lapBlocked12,
    punchOk: Boolean(punchRes12.ok && forgedItem12.sockets === 2),
    gemSocketed12: gemSocketed12,
    gemExtracted12: gemExtracted12
  };
  const failed12 = Object.keys(t12Checks).filter(function(k) { return !t12Checks[k]; });
  const t12Pass = failed12.length === 0;

  results.push({
    name: '12. City Blacksmith (Star-Forge) & Lapidary Workshop (Inc 9.7)',
    pass: t12Pass,
    detail: t12Pass
      ? 'Blacksmith forging & tempering, Lapidary socket punching, Ruby socketing (+4 ATK), and safe gem extraction verified'
      : 'Failed checks: ' + failed12.join(', ')
  });

  // =========================================================================
  // Test 13: Semantic AssetRegistry, Guild Interior Banners & RenderAdapter (Stage E.5)
  // =========================================================================
  const manifestCheck13 = validateAssetManifest(DEFAULT_ASSET_MANIFEST);
  const guildBannerId = getFacilityInteriorAssetId('guild_hall');
  const forgeBannerId = getFacilityInteriorAssetId('blacksmith');
  const guildBannerSrc = getProductionImageSrc(guildBannerId);
  const forgeBannerSrc = getProductionImageSrc(forgeBannerId);
  const fighterPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('fighter'));
  const paladinPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('paladin'));
  const fallbackPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('mage'));
  const adapter13 = createRenderAdapter({ mode: 'auto' });

  const enterableBuildingIds13 = [
    'guild_hall', 'fighters_guild', 'thieves_guild', 'mages_guild', 'rangers_lodge', 'temple_chapterhouse',
    'garrison', 'smeltery', 'apothecary', 'blacksmith', 'lapidary', 'warehouse'
  ];
  const all12InteriorsResolved = enterableBuildingIds13.every(function(bid) {
    const def = CITY_BUILDINGS_CATALOG[bid];
    return Boolean(def && def.interiorAssetId && getProductionImageSrc(def.interiorAssetId));
  });

  const t13Checks = {
    manifestValid: manifestCheck13.valid && manifestCheck13.total >= 20 && manifestCheck13.productionCount >= 16,
    guildBannerResolved: Boolean(guildBannerSrc && guildBannerSrc.indexOf('city_interior_adventurers_guild') !== -1),
    forgeBannerResolved: Boolean(forgeBannerSrc && forgeBannerSrc.indexOf('city_interior_blacksmith') !== -1),
    all12InteriorsResolved: all12InteriorsResolved,
    portraitsResolved: Boolean(fighterPortraitSrc && paladinPortraitSrc && fallbackPortraitSrc === null),
    adapterFallbackValid: Boolean(adapter13 && adapter13.backend === RENDER_BACKENDS.CANVAS_2D && adapter13.getStats().valid)
  };
  const failed13 = Object.keys(t13Checks).filter(function(k) { return !t13Checks[k]; });
  const t13Pass = failed13.length === 0;

  results.push({
    name: '13. Semantic AssetRegistry, Guild Interior Banners & RenderAdapter (Stage E.5)',
    pass: t13Pass,
    detail: t13Pass
      ? 'Manifest schema valid (' + manifestCheck13.total + ' entries, ' + manifestCheck13.productionCount + ' production Golden Slice assets), Tier 1 interior/portrait resolution & Canvas2D fallback verified'
      : 'Failed checks: ' + failed13.join(', ')
  });

  // =========================================================================
  // Test 14: Unified Adventurers Guild Parity & Dedicated Adventurer Class (Inc 9.7.5)
  // =========================================================================
  const host14 = createWargameSimHost();
  host14.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Parity', seedCode: 'STAR-9750' } });
  host14.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Parity Bastion' } });
  const city14 = getPrimaryCity(host14.state);
  city14.stockpile.gold = 500;
  city14.stockpile.food = 500;
  city14.buildings.guild_hall = 1;

  const guildOnlyClasses = getCityRecruitableClasses(city14);
  const onlyAdventurerUnlocked = guildOnlyClasses.length === 1 && guildOnlyClasses[0] === 'adventurer';
  const fighterBlockedWithoutGuild = !host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'fighter' } }).ok;
  const rangerBlockedWithoutLodge = !host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'ranger' } }).ok;
  const adventurerAllowed = host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'adventurer', heroName: 'Rowan Delver' } }).ok;

  city14.buildings.fighters_guild = 1;
  const fighterUnlockedWithGuild = host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'fighter', heroName: 'Bram Vanguard' } }).ok;

  const t14Checks = {
    onlyAdventurerUnlocked: onlyAdventurerUnlocked,
    fighterBlockedWithoutGuild: fighterBlockedWithoutGuild,
    rangerBlockedWithoutLodge: rangerBlockedWithoutLodge,
    adventurerAllowed: adventurerAllowed,
    fighterUnlockedWithGuild: fighterUnlockedWithGuild
  };
  const failed14 = Object.keys(t14Checks).filter(function(k) { return !t14Checks[k]; });
  const t14Pass = failed14.length === 0;

  results.push({
    name: '14. Unified Adventurers Guild Parity & Dedicated Adventurer Class (Inc 9.7.5)',
    pass: t14Pass,
    detail: t14Pass
      ? 'Adventurers Guild strictly unlocks Adventurer class only; specialist classes gated behind their respective Guilds'
      : 'Failed checks: ' + failed14.join(', ')
  });

  // =========================================================================
  // Test 15: Cross-Platform Screen Info (i) & Navigation Architecture (Stage E.5.5)
  // =========================================================================
  const infoOw = getScreenInfoContent(WARGAME_VIEWS.OVERWORLD, host14.state);
  const infoCity = getScreenInfoContent(WARGAME_VIEWS.CITY, host14.state);
  const infoGuild = getScreenInfoContent(WARGAME_VIEWS.GUILD, host14.state);
  const t15Pass = Boolean(
    infoOw && infoOw.title && Array.isArray(infoOw.tips) && infoOw.tips.length >= 2 &&
    infoCity && infoCity.title && Array.isArray(infoCity.tips) && infoCity.tips.length >= 2 &&
    infoGuild && infoGuild.title && Array.isArray(infoGuild.tips) && infoGuild.tips.length >= 2
  );

  results.push({
    name: '15. Cross-Platform Screen Info (i) & Mobile Navigation Architecture (Stage E.5.5)',
    pass: t15Pass,
    detail: t15Pass
      ? 'Contextual Screen Info (i) content verified for Overworld, City, and Guild screens'
      : 'Failed Stage E.5.5 screen info checks'
  });

  return results;
}

  // --- Module: src/wargame/main.js ---
// Standalone Macro Wargame Entrypoint, App Bootstrap & window.WargameApp Global Bridge









const simHost = createWargameSimHost();

let lastFrameTimestamp = null;
let autoSaveAccumulatorMs = 0;

function handleStartNewCampaignSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const houseInput = document.getElementById('wgInputHouseName');
  const worldInput = document.getElementById('wgInputWorldName');
  const seedInput  = document.getElementById('wgInputSeedCode');
  const speedSelect = document.getElementById('wgSelectStartSpeed');

  const houseName = (houseInput && houseInput.value) || 'House Vanguard';
  const worldName = (worldInput && worldInput.value) || 'Starfall Frontier';
  const seedCode  = (seedInput && seedInput.value) || ('STAR-' + Math.floor(1000 + Math.random() * 8999));
  const simSpeed  = speedSelect ? parseFloat(speedSelect.value) || 1 : 1;

  simHost.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: {
      houseName: houseName,
      worldName: worldName,
      seedCode: seedCode,
      simSpeed: simSpeed
    }
  });

  simHost.save();
  syncWargameUI(simHost);
}

function handleContinueCampaignClick() {
  const loaded = simHost.load();
  if (loaded) {
    simHost.state._dirty = true;
    syncWargameUI(simHost);
  }
}

function handleResetToTitle() {
  if (simHost && simHost.state && simHost.state.world) {
    simHost.save();
  }
  simHost.state.campaignPhase = CAMPAIGN_PHASES.TITLE;
  simHost.state.world = null;
  syncWargameUI(simHost);
}

function handleSwitchView(viewName) {
  simHost.dispatch({
    type: COMMAND_TYPES.SWITCH_VIEW,
    payload: { view: viewName }
  });
  syncWargameUI(simHost);
}

function handleSetSimSpeed(multiplier) {
  simHost.dispatch({
    type: COMMAND_TYPES.SET_SIM_SPEED,
    payload: { speedMultiplier: multiplier, paused: false }
  });
  syncWargameUI(simHost);
}

function handleTogglePauseClock() {
  const isPaused = simHost.state.world && simHost.state.world.clock && simHost.state.world.clock.paused;
  simHost.dispatch({
    type: COMMAND_TYPES.SET_SIM_SPEED,
    payload: { paused: !isPaused }
  });
  syncWargameUI(simHost);
}

function handleStepOverworld(dx, dy) {
  simHost.dispatch({
    type: COMMAND_TYPES.STEP_UNIT_ADJACENT,
    payload: { dx: dx, dy: dy }
  });
  syncWargameUI(simHost);
}

function handleFoundCity() {
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

function handleRespawnSettler() {
  simHost.dispatch({
    type: COMMAND_TYPES.RESPAWN_SETTLER
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleCancelMarch() {
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

function handleSelectCityPlot(plotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.SELECT_CITY_PLOT,
    payload: { plotIndex: plotIndex }
  });
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleMoveBuilding(fromPlotIndex, toPlotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.MOVE_BUILDING,
    payload: { fromPlotIndex: fromPlotIndex, toPlotIndex: toPlotIndex }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleStartMoveMode(plotIndex) {
  simHost.state._moveSourcePlotIndex = plotIndex;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleCancelMoveMode() {
  delete simHost.state._moveSourcePlotIndex;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleQueueBuilding(plotIndex, buildingId) {
  simHost.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: plotIndex, buildingId: buildingId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleCancelBuilding(queueItemId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueItemId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleDemolishBuilding(plotIndex) {
  simHost.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: plotIndex }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleCancelRecruitment(queueItemId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: queueItemId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleRecruitHero(classId) {
  simHost.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: classId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleClaimTask(taskId) {
  simHost.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: taskId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleOpenHeroSheet(heroId) {
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
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleCloseHeroSheet() {
  if (!simHost.state) return;
  delete simHost.state._openHeroSheetId;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleEquipHeroItem(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.EQUIP_HERO_ITEM,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleUnequipHeroItem(heroId, slot) {
  simHost.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: heroId, slot: slot }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleAutoEquipHero() {
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

function handleDepositToCityStorage(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.DEPOSIT_TO_CITY_STORAGE,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleWithdrawFromCityStorage(heroId, itemUid) {
  simHost.dispatch({
    type: COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE,
    payload: { heroId: heroId, itemUid: itemUid }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleDumpHeroBagToCity() {
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

function handleSetOverallLeader(heroId) {
  simHost.dispatch({
    type: COMMAND_TYPES.SET_OVERALL_LEADER,
    payload: { heroId: heroId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleDismissHero(heroId) {
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

function handleOpenFacilityModal(buildingId, plotIndex) {
  if (!simHost.state) return;
  simHost.state._openFacilityId = buildingId;
  simHost.state._openFacilityPlotIndex = (typeof plotIndex === 'number' && !isNaN(plotIndex)) ? plotIndex : null;
  simHost.state._facilityTab = null;
  simHost.state._showFacilityInfo = false;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleSwitchFacilityTab(tabId) {
  if (!simHost.state) return;
  simHost.state._facilityTab = tabId || null;
  syncWargameUI(simHost);
}

function handleToggleFacilityInfo() {
  if (!simHost.state) return;
  simHost.state._showFacilityInfo = !simHost.state._showFacilityInfo;
  syncWargameUI(simHost);
}

function handleOpenScreenInfo() {
  if (!simHost.state) return;
  simHost.state._showScreenInfo = true;
  syncWargameUI(simHost);
}

function handleCloseScreenInfo() {
  if (!simHost.state) return;
  simHost.state._showScreenInfo = false;
  syncWargameUI(simHost);
}

function handleToggleMobileDrawer(side) {
  if (!simHost.state) return;
  simHost.state._mobileDrawer = (simHost.state._mobileDrawer === side) ? null : side;
  syncWargameUI(simHost);
}

function handleCloseFacilityModal() {
  if (!simHost.state) return;
  delete simHost.state._openFacilityId;
  simHost.state._dirty = true;
  syncWargameUI(simHost);
}

function handleSmeltIngots(batches) {
  simHost.dispatch({
    type: COMMAND_TYPES.SMELT_INGOTS,
    payload: { batches: batches || 1 }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleBrewProvision(kind) {
  simHost.dispatch({
    type: COMMAND_TYPES.BREW_PROVISION,
    payload: { kind: kind || 'potions' }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleForgeEquipment(slot) {
  simHost.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: slot || 'weapon' } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleTemperEquipment(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.TEMPER_EQUIPMENT, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handlePunchSocket(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleSocketCityGem(itemUid, gemId) {
  simHost.dispatch({ type: COMMAND_TYPES.SOCKET_CITY_GEM, payload: { itemUid: itemUid, gemId: gemId || 'ruby' } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleUnsocketCityGem(itemUid) {
  simHost.dispatch({ type: COMMAND_TYPES.UNSOCKET_CITY_GEM, payload: { itemUid: itemUid } });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleAssignHeroToParty(partyId, heroId) {
  simHost.dispatch({
    type: COMMAND_TYPES.ASSIGN_HERO_TO_PARTY,
    payload: { partyId: partyId, heroId: heroId }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleSelectPartyByHero(heroId) {
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

function handleMarchToDungeon(poiId) {
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

function handleReturnToCity() {
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

function handleExitDungeonToSurface(unitId) {
  simHost.dispatch({
    type: COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE,
    payload: { unitId: unitId || null }
  });
  simHost.state._dirty = true;
  simHost.save();
  syncWargameUI(simHost);
}

function handleEnterDungeon(poiId) {
  const selUnit = getSelectedOverworldUnit(simHost.state);
  if (simHost && simHost.state && simHost.state.world && selUnit) {
    const res = simHost.dispatch({
      type: COMMAND_TYPES.ENTER_DUNGEON,
      payload: { unitId: selUnit.id, poiId: poiId || null }
    });
    simHost.save();
    if (!res || !res.ok) {
      syncWargameUI(simHost);
      return;
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    // Smooth transition into the tactical dungeon engine with handoff envelope!
    window.location.href = './index.html?from=wargame';
  }
}

// ---------------------------------------------------------------------------
// Canvas Mouse & Keyboard Listeners
// ---------------------------------------------------------------------------
function setupWargameListeners() {
  if (typeof document === 'undefined') return;

  const canvas = document.getElementById('wgOverworldCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', function(e) {
      if (!simHost.state.world || !simHost.state.world.overworld) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const ow = simHost.state.world.overworld;
      const selUnit = getSelectedOverworldUnit(simHost.state);
      const primaryCity = getPrimaryCity(simHost.state);

      const focusX = selUnit ? selUnit.x : (primaryCity ? primaryCity.x : ow.spawnX);
      const focusY = selUnit ? selUnit.y : (primaryCity ? primaryCity.y : ow.spawnY);

      const cam = getWargameCameraOrigin(ow, focusX, focusY);
      const tx = cam.camX + Math.floor(mx / OVERWORLD_TILE_SIZE);
      const ty = cam.camY + Math.floor(my / OVERWORLD_TILE_SIZE);

      if (tx >= 0 && tx < ow.width && ty >= 0 && ty < ow.height) {
        let previewRoute = null;
        if (selUnit && selUnit.alive && isOverworldTilePassable(ow, tx, ty)) {
          previewRoute = findOverworldPath(ow, selUnit.x, selUnit.y, tx, ty);
        }
        setWargameHoverTile({ x: tx, y: ty }, previewRoute);
      } else {
        setWargameHoverTile(null, null);
      }
    });

    canvas.addEventListener('mouseleave', function() {
      setWargameHoverTile(null, null);
    });

    canvas.addEventListener('click', function(e) {
      if (!simHost.state.world || !simHost.state.world.overworld) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const ow = simHost.state.world.overworld;
      const selUnit = getSelectedOverworldUnit(simHost.state);
      const primaryCity = getPrimaryCity(simHost.state);

      const focusX = selUnit ? selUnit.x : (primaryCity ? primaryCity.x : ow.spawnX);
      const focusY = selUnit ? selUnit.y : (primaryCity ? primaryCity.y : ow.spawnY);

      const cam = getWargameCameraOrigin(ow, focusX, focusY);
      const tx = cam.camX + Math.floor(mx / OVERWORLD_TILE_SIZE);
      const ty = cam.camY + Math.floor(my / OVERWORLD_TILE_SIZE);

      if (tx >= 0 && tx < ow.width && ty >= 0 && ty < ow.height && selUnit && selUnit.alive) {
        simHost.dispatch({
          type: COMMAND_TYPES.ORDER_UNIT_MARCH,
          payload: { unitId: selUnit.id, targetX: tx, targetY: ty }
        });
        simHost.state._dirty = true;
        simHost.save();
        syncWargameUI(simHost);
      }
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

  // Global Keyboard shortcuts
  window.addEventListener('keydown', function(e) {
    // Avoid capturing inputs when typing into input fields
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
      return;
    }

    if (!simHost.state.world) return;

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

  if (simHost.state.world && simHost.state.campaignPhase !== CAMPAIGN_PHASES.TITLE) {
    simHost.stepClock(elapsedRealMs);

    autoSaveAccumulatorMs += elapsedRealMs;
    if (autoSaveAccumulatorMs >= 5000) {
      autoSaveAccumulatorMs = 0;
      simHost.save();
    }

    if (simHost.state.activeView === WARGAME_VIEWS.OVERWORLD) {
      renderWargameOverworldCanvas(simHost);
    }
    updateHeaderFastTick(simHost);

    // Throttle DOM rebuilds so buttons don't get destroyed mid-click
    if (simHost.state._dirty || (timestamp - lastUiSyncRealMs >= 400)) {
      lastUiSyncRealMs = timestamp;
      simHost.state._dirty = false;
      syncWargameUI(simHost);
    }
  }

  requestAnimationFrame(wargameMainLoop);
}

const WargameApp = {
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
  handleEquipHeroItem: handleEquipHeroItem,
  handleUnequipHeroItem: handleUnequipHeroItem,
  handleAutoEquipHero: handleAutoEquipHero,
  handleDepositToCityStorage: handleDepositToCityStorage,
  handleWithdrawFromCityStorage: handleWithdrawFromCityStorage,
  handleDumpHeroBagToCity: handleDumpHeroBagToCity,
  handleSetOverallLeader: handleSetOverallLeader,
  handleDismissHero: handleDismissHero,
  handleOpenFacilityModal: handleOpenFacilityModal,
  handleSwitchFacilityTab: handleSwitchFacilityTab,
  handleToggleFacilityInfo: handleToggleFacilityInfo,
  handleOpenScreenInfo: handleOpenScreenInfo,
  handleCloseScreenInfo: handleCloseScreenInfo,
  handleToggleMobileDrawer: handleToggleMobileDrawer,
  handleCloseFacilityModal: handleCloseFacilityModal,
  handleSmeltIngots: handleSmeltIngots,
  handleBrewProvision: handleBrewProvision,
  handleForgeEquipment: handleForgeEquipment,
  handleTemperEquipment: handleTemperEquipment,
  handlePunchSocket: handlePunchSocket,
  handleSocketCityGem: handleSocketCityGem,
  handleUnsocketCityGem: handleUnsocketCityGem,
  handleAssignHeroToParty: handleAssignHeroToParty,
  handleMarchToDungeon: handleMarchToDungeon,
  handleReturnToCity: handleReturnToCity,
  handleExitDungeonToSurface: handleExitDungeonToSurface,
  handleEnterDungeon: handleEnterDungeon,
  syncWargameUI: function() { syncWargameUI(simHost); }
};

function bootstrapWargame() {
  setupWargameListeners();

  // If returning from a Turn-Based Dungeon Delve (index.html), auto-resume campaign and resolve return outcome!
  const pendingReturn = peekBridgeHandoff(BRIDGE_DIRECTIONS.TO_WARGAME);
  if (pendingReturn) {
    const loaded = simHost.load();
    if (loaded) {
      const consumed = consumeBridgeHandoff(BRIDGE_DIRECTIONS.TO_WARGAME);
      if (consumed) {
        simHost.dispatch({
          type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
          payload: consumed
        });
        simHost.state.activeView = WARGAME_VIEWS.OVERWORLD;
        simHost.state._dirty = true;
        simHost.save();
      }
    }
  }

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

})();
