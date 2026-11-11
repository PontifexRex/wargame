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
  BUILDING_COMPLETED:   'city.buildingCompleted',
  RESOURCE_TICK:        'city.resourceTick',
  RESOURCE_HARVESTED:   'overworld.resourceHarvested',
  HERO_RECRUIT_STARTED: 'guild.heroRecruitStarted',
  HERO_RECRUIT_CANCEL:  'guild.heroRecruitCancelled',
  HERO_RECRUITED:       'guild.heroRecruited',
  PARTY_FORMED:         'guild.partyFormed',
  DUNGEON_ENTERED:      'dungeon.entered',
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
  QUEUE_BUILDING:     'CMD_QUEUE_BUILDING',
  CANCEL_BUILDING:    'CMD_CANCEL_BUILDING',
  DEMOLISH_BUILDING:  'CMD_DEMOLISH_BUILDING',
  RECRUIT_HERO:       'CMD_RECRUIT_HERO',
  CANCEL_RECRUITMENT: 'CMD_CANCEL_RECRUITMENT',
  CLAIM_TASK_REWARD:  'CMD_CLAIM_TASK_REWARD',
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
    classId: 'paladin',
    name: 'Radiant Crusader',
    title: 'Dawn Warden',
    icon: '☀️',
    color: '#fbbf24',
    costGold: 65,
    costFood: 35,
    baseStats: { str: 14, dex: 9, int: 12, vit: 15, hp: 195, mp: 86, atk: 27, def: 20 },
    specialty: 'Aura of Radiance, Holy Smite self-healing, and Divine Intervention.'
  }
];

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
    },
    {
      id: 'poi_dungeon_starfall',
      type: 'dungeon_entrance',
      name: 'The Starfall Vaults',
      dungeonId: 'dng_starfall',
      x: spawnX + 5,
      y: spawnY - 3,
      depleted: false
    }
  ];

  // Ensure all POIs sit on passable terrain and have a clear path from spawn
  for (let i = 0; i < pois.length; i++) {
    const p = pois[i];
    if (tiles[p.y] && (tiles[p.y][p.x] === OW_TERRAIN_MOUNTAINS || tiles[p.y][p.x] === OW_TERRAIN_WATER)) {
      tiles[p.y][p.x] = OW_TERRAIN_PLAINS;
    }
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
    desc: 'March your Pioneer Settler across the Overworld to survey nearby timber and stone deposits (move at least 2 tiles).',
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
    title: '2. Found Your Primary Bastion',
    category: 'settlement',
    prerequisites: [],
    triggerTopics: [STREAM_TOPICS.CITY_FOUNDED],
    desc: 'Position your Pioneer Settler on fertile grasslands or a river vale and issue the Found City command.',
    rewardLabel: '+60 Wood, +60 Stone, +50 Gold',
    reward: { wood: 60, stone: 60, gold: 50 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 1 };
      const count = Object.keys(state.world.cities || {}).length;
      return { completed: count >= 1, progress: Math.min(1, count), target: 1 };
    }
  },
  {
    id: 'task_establish_production',
    title: '3. Industrial Foundations',
    category: 'economy',
    prerequisites: ['task_found_first_city'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Construct a Timber Sawmill or Masonry Stoneworks in your city\'s real-time build queue.',
    rewardLabel: '+50 Wood, +50 Stone, +40 Food',
    reward: { wood: 50, stone: 50, food: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if ((b.sawmill && b.sawmill >= 1) || (b.quarry && b.quarry >= 1)) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_guild_hall',
    title: '4. Charter the Adventurers Guild Hall',
    category: 'military',
    prerequisites: ['task_found_first_city'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Construct the Adventurers Guild Hall (50 Wood, 50 Stone, 25 Gold) to unlock Hero class recruitment.',
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
    title: '5. Swear In Your First Vanguard Hero',
    category: 'military',
    prerequisites: ['task_build_guild_hall'],
    triggerTopics: [STREAM_TOPICS.HERO_RECRUITED, STREAM_TOPICS.PARTY_FORMED],
    desc: 'Open the Adventurers Guild Hall and recruit your first Hero (Fighter, Ranger, Mage, Thief, or Paladin) to lead a delving party on the Overworld.',
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
    title: '6. March to the Starfall Vaults',
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
          if (u.alive && u.unitType === 'hero_party' && Math.hypot(u.x - dngPoi.x, u.y - dngPoi.y) <= 1.5) {
            return { completed: true, progress: 1, target: 1 };
          }
        }
      }
      return { completed: false, progress: 0, target: 1 };
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
// City Building Definitions, 3x3 City Plot Grid Layout, Construction Costs, Build Durations & Production Rates

const CITY_BUILDINGS_CATALOG = {
  town_hall: {
    id: 'town_hall',
    name: 'Bastion Keep',
    icon: '🏰',
    category: 'civic',
    color: '#fbbf24',
    maxLevel: 5,
    baseBuildTimeMs: 5000,
    baseCost: { wood: 40, stone: 40, gold: 20 },
    productionPerTick: { gold: 2, food: 2 },
    unlocks: ['sawmill', 'quarry', 'farmstead', 'guild_hall', 'warehouse'],
    desc: 'The fortified heart of your city. Governs administration, tax revenue, and construction capacity.'
  },
  sawmill: {
    id: 'sawmill',
    name: 'Timber Sawmill',
    icon: '🪚',
    category: 'economy',
    color: '#4ade80',
    maxLevel: 5,
    baseBuildTimeMs: 4000, // 4 seconds at 1x speed for responsive early building
    baseCost: { wood: 20, stone: 10, gold: 0 },
    productionPerTick: { wood: 8 },
    requires: { town_hall: 1 },
    desc: 'Fells and mills seasoned lumber from surrounding groves to fuel city construction.'
  },
  quarry: {
    id: 'quarry',
    name: 'Masonry Stoneworks',
    icon: '⛏️',
    category: 'economy',
    color: '#cbd5e1',
    maxLevel: 5,
    baseBuildTimeMs: 4500,
    baseCost: { wood: 25, stone: 10, gold: 0 },
    productionPerTick: { stone: 7 },
    requires: { town_hall: 1 },
    desc: 'Excavates and dresses heavy granite blocks for fortifications and guild halls.'
  },
  farmstead: {
    id: 'farmstead',
    name: 'Irrigated Granary',
    icon: '🌾',
    category: 'economy',
    color: '#f97316',
    maxLevel: 5,
    baseBuildTimeMs: 3500,
    baseCost: { wood: 20, stone: 5, gold: 0 },
    productionPerTick: { food: 10 },
    requires: { town_hall: 1 },
    desc: 'Cultivates grain and provisions required to sustain marching expeditions and recruit heroes.'
  },
  guild_hall: {
    id: 'guild_hall',
    name: 'Adventurers Guild Hall',
    icon: '⚔️',
    category: 'military',
    color: '#60a5fa',
    maxLevel: 3,
    baseBuildTimeMs: 6000, // 6 seconds base build time
    baseCost: { wood: 50, stone: 50, gold: 25 },
    productionPerTick: { gold: 3 },
    requires: { town_hall: 1 },
    desc: 'Establishes the charter hall where Hero classes (Fighter, Ranger, Mage, Thief, Paladin) are recruited to delve subterranean vaults.'
  },
  barracks: {
    id: 'barracks',
    name: 'Vanguard Barracks',
    icon: '🛡️',
    category: 'military',
    color: '#f87171',
    maxLevel: 5,
    baseBuildTimeMs: 5500,
    baseCost: { wood: 45, stone: 40, gold: 30 },
    productionPerTick: {},
    requires: { guild_hall: 1 },
    desc: 'Trains escort garrisons and increases the march speed and maximum party capacity of your realm.'
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
    requires: { town_hall: 1 },
    desc: 'Channels Divine War Reimbursement—honorable battles grant divine favor and rapid troop recovery.'
  }
};

const CITY_PLOT_SLOTS = [
  { plotIndex: 0, label: 'Central Citadel Plot', defaultBuilding: 'town_hall', lockedTo: 'town_hall' },
  { plotIndex: 1, label: 'North Timber Yard',    recommended: 'sawmill' },
  { plotIndex: 2, label: 'East Masonry Plot',    recommended: 'quarry' },
  { plotIndex: 3, label: 'South Fertile Terrace',recommended: 'farmstead' },
  { plotIndex: 4, label: 'Grand Charter Plaza',  recommended: 'guild_hall' },
  { plotIndex: 5, label: 'Western Garrison',     recommended: 'barracks' },
  { plotIndex: 6, label: 'Crucible Terrace',     recommended: 'star_forge' },
  { plotIndex: 7, label: 'High Acropolis',       recommended: 'temple_of_war' }
];

function computeBuildingUpgradeCost(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return { wood: 50, stone: 50, gold: 0 };
  const mult = Math.pow(1.45, Math.max(0, targetLevel - 1));
  return {
    wood:  Math.round((def.baseCost.wood || 0) * mult),
    stone: Math.round((def.baseCost.stone || 0) * mult),
    gold:  Math.round((def.baseCost.gold || 0) * mult)
  };
}

function computeBuildingDurationMs(buildingId, targetLevel) {
  const def = CITY_BUILDINGS_CATALOG[buildingId];
  if (!def) return 5000;
  const mult = Math.pow(1.3, Math.max(0, targetLevel - 1));
  return Math.round(def.baseBuildTimeMs * mult);
}

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
        gold: 50
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

function createDefaultCityPlots() {
  const plots = [];
  for (let i = 0; i < CITY_PLOT_SLOTS.length; i++) {
    const slot = CITY_PLOT_SLOTS[i];
    plots.push({
      plotIndex: slot.plotIndex,
      label: slot.label,
      buildingId: slot.defaultBuilding || null,
      level: slot.defaultBuilding ? 1 : 0,
      underConstruction: false,
      demolishing: false,
      activeJobId: null
    });
  }
  return plots;
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
  if (!state || !state.world) return { wood: 0, stone: 0, food: 0, gold: 0 };
  const city = getPrimaryCity(state);
  if (city && city.stockpile) {
    return city.stockpile;
  }
  return state.world.realmStockpile || { wood: 0, stone: 0, food: 0, gold: 0 };
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
    if (parsed.world.cities) {
      Object.keys(parsed.world.cities).forEach(function(cid) {
        const c = parsed.world.cities[cid];
        if (!Array.isArray(c.buildQueue)) c.buildQueue = [];
        if (!c.maxBuildQueueSlots) c.maxBuildQueueSlots = 3;
        if (!Array.isArray(c.recruitmentQueue)) c.recruitmentQueue = [];
        if (!c.maxRecruitQueueSlots) c.maxRecruitQueueSlots = 3;
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
    unit.status = 'idle';
    unit.marchPlan = null;
    state._dirty = true;
    saveWargameState(state, scheduler);
    if (eventStream) {
      eventStream.publish(STREAM_TOPICS.UNIT_MARCH_COMPLETED, {
        unitId: unit.id,
        unitName: unit.shortName,
        x: unit.x,
        y: unit.y
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
  if (front.status === 'building' || front.status === 'demolishing') return front;

  const simTimeMs = state.world.clock.simTimeMs;
  const dur = Math.max(500, front.durationMs || 4000);
  const isDemolishOrCleanup = front.type === 'demolish' || front.type === 'cleanup';
  const jobType = isDemolishOrCleanup ? 'CITY_BUILDING_DEMOLISH_COMPLETE' : 'CITY_BUILDING_COMPLETE';

  const job = scheduler.scheduleJob({
    jobId: (isDemolishOrCleanup ? 'demolish_' : 'build_') + city.id + '_plot_' + front.plotIndex + '_' + simTimeMs,
    jobType: jobType,
    ownerId: city.id,
    startSimTimeMs: simTimeMs,
    dueSimTimeMs: simTimeMs + dur,
    payload: {
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

  front.status = isDemolishOrCleanup ? 'demolishing' : 'building';
  front.jobId = job.jobId;
  front.startSimTimeMs = simTimeMs;
  front.dueSimTimeMs = simTimeMs + dur;

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
  city.buildings[bId] = targetLvl;

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

  // If Adventurers Guild Hall is completed, unlock GUILD_UNLOCKED phase!
  if (bId === 'guild_hall' && targetLvl >= 1 && state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED) {
    state.campaignPhase = CAMPAIGN_PHASES.GUILD_UNLOCKED;
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
    const salvage = p.salvage || { wood: 0, stone: 0, gold: 0 };
    city.stockpile.wood  = (city.stockpile.wood  || 0) + (salvage.wood  || 0);
    city.stockpile.stone = (city.stockpile.stone || 0) + (salvage.stone || 0);
    city.stockpile.gold  = (city.stockpile.gold  || 0) + (salvage.gold  || 0);

    // Clear building from city catalog
    if (city.buildings && bId) {
      delete city.buildings[bId];
    }
    if (plot) {
      plot.buildingId = null;
      plot.level = 0;
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
    recruitedAtSimMs: job.dueSimTimeMs
  };

  if (!world.heroes) world.heroes = [];
  world.heroes.push(heroObj);
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
    marchPlan: null
  };

  if (ow) {
    if (!ow.units) ow.units = [];
    ow.units.push(partyUnit);
    ow.selectedUnitId = partyUnit.id;
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

  for (let i = 0; i < cityIds.length; i++) {
    const city = state.world.cities[cityIds[i]];
    if (!city || !city.buildings || !city.stockpile) continue;

    const gains = { wood: 0, stone: 0, food: 0, gold: 0 };
    const bKeys = Object.keys(city.buildings);
    for (let k = 0; k < bKeys.length; k++) {
      const bId = bKeys[k];
      const lvl = city.buildings[bId] || 0;
      if (lvl <= 0) continue;
      const bDef = CITY_BUILDINGS_CATALOG[bId];
      if (bDef && bDef.productionPerTick) {
        if (bDef.productionPerTick.wood)  gains.wood  += bDef.productionPerTick.wood * lvl;
        if (bDef.productionPerTick.stone) gains.stone += bDef.productionPerTick.stone * lvl;
        if (bDef.productionPerTick.food)  gains.food  += bDef.productionPerTick.food * lvl;
        if (bDef.productionPerTick.gold)  gains.gold  += bDef.productionPerTick.gold * lvl;
      }
    }

    city.stockpile.wood  = (city.stockpile.wood  || 0) + gains.wood;
    city.stockpile.stone = (city.stockpile.stone || 0) + gains.stone;
    city.stockpile.food  = (city.stockpile.food  || 0) + gains.food;
    city.stockpile.gold  = (city.stockpile.gold  || 0) + gains.gold;

    if (eventStream && (gains.wood > 0 || gains.stone > 0 || gains.food > 0 || gains.gold > 0)) {
      eventStream.publish(STREAM_TOPICS.RESOURCE_TICK, {
        cityId: city.id,
        cityName: city.name,
        gains: gains,
        stockpile: {
          wood: city.stockpile.wood,
          stone: city.stockpile.stone,
          food: city.stockpile.food,
          gold: city.stockpile.gold
        }
      }, state.world.clock.simTimeMs);
    }
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
        gold:  (baseStock.gold  || 0) + 25
      },
      // IMPORTANT: Only town_hall starts at level 1! Adventurers Guild Hall must be built in the real-time queue!
      buildings: {
        town_hall: 1
      },
      plots: createDefaultCityPlots(),
      buildQueue: [],
      maxBuildQueueSlots: BASE_BUILD_QUEUE_LIMIT || 3,
      recruitmentQueue: [],
      maxRecruitQueueSlots: BASE_RECRUIT_QUEUE_LIMIT || 3
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

    if (plot.underConstruction) {
      return reject('That plot already has an active construction order');
    }

    if (plot.buildingId && plot.buildingId !== buildingId) {
      return reject('Plot is already occupied by ' + plot.buildingId);
    }

    // Check building prerequisites
    if (bDef.requires) {
      const reqKeys = Object.keys(bDef.requires);
      for (let i = 0; i < reqKeys.length; i++) {
        const reqB = reqKeys[i];
        const reqLvl = bDef.requires[reqB];
        const curReqLvl = (city.buildings && city.buildings[reqB]) || 0;
        if (curReqLvl < reqLvl) {
          const reqDef = CITY_BUILDINGS_CATALOG[reqB];
          return reject('Requires ' + (reqDef ? reqDef.name : reqB) + ' Level ' + reqLvl);
        }
      }
    }

    const currentLevel = plot.buildingId === buildingId ? (plot.level || 0) : 0;
    const targetLevel = currentLevel + 1;
    if (targetLevel > (bDef.maxLevel || 5)) {
      return reject(bDef.name + ' has reached maximum level');
    }

    const cost = computeBuildingUpgradeCost(buildingId, targetLevel);
    if ((city.stockpile.wood || 0) < cost.wood ||
        (city.stockpile.stone || 0) < cost.stone ||
        (city.stockpile.gold || 0) < cost.gold) {
      return reject('Insufficient city stockpiles (Need ' + cost.wood + ' Wood, ' + cost.stone + ' Stone, ' + cost.gold + ' Gold)');
    }

    // Deduct construction cost upfront
    city.stockpile.wood  -= cost.wood;
    city.stockpile.stone -= cost.stone;
    city.stockpile.gold  -= cost.gold;

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

    if (targetItem.status === 'queued') {
      // Pending item: 100% full refund
      city.buildQueue.splice(idx, 1);
      if (targetItem.cost) {
        city.stockpile.wood  = (city.stockpile.wood  || 0) + (targetItem.cost.wood  || 0);
        city.stockpile.stone = (city.stockpile.stone || 0) + (targetItem.cost.stone || 0);
        city.stockpile.gold  = (city.stockpile.gold  || 0) + (targetItem.cost.gold  || 0);
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

    if (plot.buildingId === 'town_hall') {
      return reject('The Bastion Town Hall cannot be demolished');
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
      wood: Math.floor((cost.wood || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      stone: Math.floor((cost.stone || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35)),
      gold: Math.floor((cost.gold || 0) * (DEMOLISH_SALVAGE_RATIO || 0.35))
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

    const guildLvl = (city.buildings && city.buildings.guild_hall) || 0;
    if (guildLvl < 1) {
      return reject('Requires an Adventurers Guild Hall in your city before heroes can be recruited');
    }

    const classId = payload.classId || 'fighter';
    const classDef = RECRUITABLE_HERO_CLASSES.find(function(c) { return c.classId === classId; });
    if (!classDef) {
      return reject('Unknown hero class: ' + classId);
    }

    if (!Array.isArray(city.recruitmentQueue)) {
      city.recruitmentQueue = [];
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

  // Pop and execute all scheduled jobs in chronological order up to targetSimTime
  let jobsExecuted = 0;
  if (scheduler) {
    const dueJobs = scheduler.popDueJobs(targetSimTime);
    for (let i = 0; i < dueJobs.length; i++) {
      const job = dueJobs[i];
      clock.simTimeMs = job.dueSimTimeMs;
      jobsExecuted++;
      if (job.jobType === 'UNIT_MARCH_STEP') {
        resolveMarchStepJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'CITY_BUILDING_COMPLETE') {
        resolveBuildingCompleteJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'CITY_BUILDING_DEMOLISH_COMPLETE') {
        resolveBuildingDemolishJob(job, state, scheduler, eventStream);
      } else if (job.jobType === 'HERO_RECRUIT_COMPLETE') {
        resolveRecruitHeroJob(job, state, scheduler, eventStream);
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

      ctx.fillStyle = pDef.bgColor || '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pDef.color || '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pDef.color || '#fbbf24';
      ctx.fillText(pDef.symbol || 'Ω', cx, cy);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(poi.name, cx, py - 3);
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
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx, by, Math.round(barW * interp.progress), barH);
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
  const resWoodEl  = document.getElementById('wgStockWood');
  const resStoneEl = document.getElementById('wgStockStone');
  const resFoodEl  = document.getElementById('wgStockFood');
  const resGoldEl  = document.getElementById('wgStockGold');
  if (resWoodEl && resWoodEl.textContent != String(stock.wood || 0))   resWoodEl.textContent  = stock.wood  || 0;
  if (resStoneEl && resStoneEl.textContent != String(stock.stone || 0)) resStoneEl.textContent = stock.stone || 0;
  if (resFoodEl && resFoodEl.textContent != String(stock.food || 0))   resFoodEl.textContent  = stock.food  || 0;
  if (resGoldEl && resGoldEl.textContent != String(stock.gold || 0))   resGoldEl.textContent  = stock.gold  || 0;
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
          const isDemolish = item.type === 'demolish';
          const isCleanup = item.type === 'cleanup';
          if (item.status === 'building' || item.status === 'demolishing') {
            const dur = Math.max(1, (item.dueSimTimeMs || 0) - (item.startSimTimeMs || 0));
            const rem = Math.max(0, (item.dueSimTimeMs || 0) - simTimeMs);
            const pct = Math.min(100, Math.round(((dur - rem) / dur) * 100));
            const label = isDemolish
              ? ('🔥 Demolishing ' + item.buildingName)
              : (isCleanup ? ('🧹 Cleaning Site ' + item.buildingName) : ('🔨 ' + item.buildingName + ' (Lv ' + item.targetLevel + ')'));
            const barColor = isDemolish ? 'bg-[#f87171]' : (isCleanup ? 'bg-[#94a3b8]' : 'bg-[#fbbf24]');

            buildItems.push(`
              <div class="p-2 rounded bg-[#080b11] border ${isDemolish ? 'border-[#f87171]/50' : 'border-[#fbbf24]/50'} space-y-1">
                <div class="flex justify-between items-center text-[11px] font-mono">
                  <span class="${isDemolish ? 'text-[#f87171]' : 'text-[#fbbf24]'} font-bold">${label}</span>
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
            const qLabel = isDemolish
              ? ('⏳ Queued Demolish: ' + item.buildingName)
              : ('⏳ Queued: ' + item.buildingName + ' (Lv ' + item.targetLevel + ')');
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

function renderCityBuilderPanel(simHost) {
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

    if (plot.demolishing) {
      return `
        <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#f87171] flex flex-col justify-between gap-2">
          <div>
            <div class="text-[10px] font-mono uppercase text-[#f87171]">Plot #${plot.plotIndex + 1} • Demolition / Cleanup</div>
            <div class="text-sm font-bold text-[#e6edf3] mt-0.5">${bDef ? bDef.icon : '🔥'} ${bDef ? bDef.name : bId}</div>
            <p class="text-[11px] text-[#8b949e] mt-1">${bDef ? bDef.desc : ''}</p>
          </div>
          <div class="py-1.5 px-2.5 rounded bg-[#f87171]/15 text-[#f87171] text-xs font-mono font-bold text-center">
            🔥 Clearing Site in Queue...
          </div>
        </div>
      `;
    }

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
          <div class="text-sm font-bold text-[#e6edf3] mt-1">${bDef ? bDef.icon : '🏛️'} ${bDef ? bDef.name : bId}</div>
          <p class="text-[11px] text-[#8b949e] mt-1">${bDef ? bDef.desc : ''}</p>
        </div>
        <div class="space-y-1.5 pt-2 border-t border-[#1e293b]">
          <div class="flex items-center justify-between text-[11px] font-mono text-[#cbd5e1]">
            <span>Cost: ${cost.wood}W • ${cost.stone}S${cost.gold ? (' • ' + cost.gold + 'G') : ''}</span>
            <span class="text-[#38bdf8]">⏱ ${formatSimDuration(durMs)}</span>
          </div>
          <button data-action="queue-building" data-plot-index="${plot.plotIndex}" data-building-id="${bId}" onclick="window.WargameApp.handleQueueBuilding(${plot.plotIndex}, '${bId}')" class="w-full py-1.5 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase btn-tactical cursor-pointer">
            ${curLevel > 0 ? ('▲ Upgrade to Lv ' + nextLevel) : ('🔨 Construct ' + (bDef ? bDef.name : bId))}
          </button>
          ${curLevel > 0 && bId !== 'town_hall' ? `
            <button data-action="demolish-building" data-plot-index="${plot.plotIndex}" onclick="window.WargameApp.handleDemolishBuilding(${plot.plotIndex})" class="w-full py-1 rounded bg-[#1a2232] hover:bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40 text-[10px] font-mono font-bold cursor-pointer">
              🔥 Demolish [35% Salvage]
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  setHtmlIfChanged(gridEl, newPlotsHtml);
}

function renderGuildRecruitmentPanel(simHost) {
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

  // Verify premature Hero Recruitment is strictly rejected before City & Guild Hall exist
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
  // Test 4: City Founding, Multi-Domain Build Queue, Prorated Cancel & Demolition Salvage
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
  // Verify Guild Hall is NOT pre-built for free!
  const guildNotBuiltYet = !city4.buildings.guild_hall;

  // Queue a Timber Sawmill on Plot #1 (4000ms build time)
  const woodBefore = city4.stockpile.wood;
  const queueSawmill = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'sawmill' }
  });
  const costDeducted = city4.stockpile.wood < woodBefore && city4.buildQueue.length === 1;

  // Queue a Stoneworks Quarry on Plot #2 (pending item)
  const woodBeforeQuarry = city4.stockpile.wood;
  const queueQuarry = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'quarry' }
  });
  // Cancel pending item -> 100% full refund
  const cancelQuarry = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueQuarry.data.queueItem.queueItemId }
  });
  const pendingRefundVerified = cancelQuarry.ok && city4.stockpile.wood === woodBeforeQuarry && city4.buildQueue.length === 1;

  // Test active cancel prorated refund + 50% cleanup demolition:
  // Sawmill is active (duration 4000ms). Advance 2000ms (50% elapsed).
  host4.stepClock(2000);
  const woodBeforeCancelActive = city4.stockpile.wood;
  const cancelActiveSawmill = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueSawmill.data.queueItem.queueItemId }
  });
  // Should receive prorated refund: ~50% of cost (targetLevel 1 cost: wood 25 -> floor(25 * 0.5) = 12)
  const proratedRefundGiven = cancelActiveSawmill.ok && city4.stockpile.wood > woodBeforeCancelActive;
  // Cleanup item scheduled for max(1000, 2000 * 0.5) = 1000ms
  const cleanupJobActive = city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'cleanup' && city4.buildQueue[0].durationMs === 1000;

  // Advance clock by 1000ms to finish cleanup
  host4.stepClock(1000);
  const cleanupFinished = city4.buildQueue.length === 0 && !city4.plots[1].underConstruction && !city4.plots[1].demolishing;

  // Re-queue Sawmill on Plot #1 and advance 4500ms -> Sawmill completes!
  host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'sawmill' }
  });
  host4.stepClock(4500);
  const sawmillCompleted = city4.buildings.sawmill === 1;

  // Test deliberate Demolition with 35% salvage:
  const woodBeforeDemolish = city4.stockpile.wood;
  const demolishCmd = host4.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: 1 }
  });
  const demolishQueued = demolishCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'demolish';
  // Advance 2500ms to complete demolition
  host4.stepClock(2500);
  const demolishCompleted = !city4.buildings.sawmill && city4.plots[1].level === 0 && city4.stockpile.wood > woodBeforeDemolish;

  // Test 3-slot build queue limit
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 1, buildingId: 'sawmill' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 2, buildingId: 'quarry' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 3, buildingId: 'farmstead' } });
  const fourthQueueBlocked = !host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'guild_hall' } }).ok;

  const t4Pass = Boolean(
    foundCmd.ok &&
    phaseIsCity &&
    guildNotBuiltYet &&
    costDeducted &&
    pendingRefundVerified &&
    proratedRefundGiven &&
    cleanupJobActive &&
    cleanupFinished &&
    sawmillCompleted &&
    demolishQueued &&
    demolishCompleted &&
    fourthQueueBlocked
  );

  results.push({
    name: '4. City Founding, 3-Slot Queue Cap, Prorated Cancel + Cleanup & Demolition Salvage',
    pass: t4Pass,
    detail: t4Pass
      ? 'Queue limits enforced, active cancel yields prorated refund with 50% cleanup job, and deliberate demolition grants 35% salvage'
      : 'Failed multi-domain queue lifecycle checks'
  });

  // =========================================================================
  // Test 5: Adventurers Guild Hall Completion, 60s Hero Recruitment Queue & Vanguard Formation
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

  // Claim completed tasks 1 and 2 to boost stockpiles
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });

  // Queue Adventurers Guild Hall on Plot #4 (6000ms build duration)
  const queueGuild = host5.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 4, buildingId: 'guild_hall' }
  });

  // Advance clock by 6500ms -> Guild Hall finishes and unlocks GUILD_UNLOCKED phase!
  host5.stepClock(6500);
  const guildUnlocked = host5.state.campaignPhase === CAMPAIGN_PHASES.GUILD_UNLOCKED && city5.buildings.guild_hall === 1;

  // Claim Task 4 ("Charter the Adventurers Guild Hall") -> grants +100 Gold, +50 Food
  const claimTask4 = host5.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: 'task_build_guild_hall' }
  });

  // Start training a Ranger Hero (60,000ms training queue)
  const recruitRanger = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'ranger', heroName: 'Sylvanas Pathfinder' }
  });
  const rangerQueued = recruitRanger.ok && city5.recruitmentQueue.length === 1 && city5.recruitmentQueue[0].status === 'training';
  const heroNotInstantlySpawned = host5.state.world.heroes.length === 0;

  // Queue a 2nd trainee (Fighter) and test recruitment cancel prorated refund
  const goldBeforeFighter = city5.stockpile.gold;
  const recruitFighter = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'fighter', heroName: 'Garrick Ironheart' }
  });
  const fighterQueued = recruitFighter.ok && city5.recruitmentQueue.length === 2 && city5.recruitmentQueue[1].status === 'queued';

  // Cancel queued fighter -> 100% full refund
  const cancelFighter = host5.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: recruitFighter.data.queueItem.queueItemId }
  });
  const fighterRefundVerified = cancelFighter.ok && city5.stockpile.gold === goldBeforeFighter && city5.recruitmentQueue.length === 1;

  // Advance clock by 30,000ms -> Ranger still in training!
  host5.stepClock(30000);
  const stillTrainingAt30s = host5.state.world.heroes.length === 0 && city5.recruitmentQueue.length === 1;

  // Advance clock by remaining 30,000ms (total 60,000ms elapsed) -> Ranger training finishes!
  host5.stepClock(30000);
  const rangerCompleted = city5.recruitmentQueue.length === 0 && host5.state.world.heroes.length === 1 && host5.state.world.heroes[0].classId === 'ranger';
  const partySpawnedOnOverworld = host5.state.world.overworld.units.some(function(u) {
    return u.unitType === 'hero_party' && u.canEnterDungeon === true && u.alive === true;
  });

  const t5Pass = Boolean(
    queueGuild.ok &&
    guildUnlocked &&
    claimTask4.ok &&
    rangerQueued &&
    heroNotInstantlySpawned &&
    fighterQueued &&
    fighterRefundVerified &&
    stillTrainingAt30s &&
    rangerCompleted &&
    partySpawnedOnOverworld
  );

  results.push({
    name: '5. Adventurers Guild Hall Completion, 60s Hero Recruitment Queue & Vanguard Formation',
    pass: t5Pass,
    detail: t5Pass
      ? 'Guild Hall completion unlocks recruitment, swearing in enqueues 60s trainee, cancel gives refund, and timer resolution inducts hero into Vanguard Party'
      : 'Failed 60s hero recruitment queue lifecycle'
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

function handleEnterDungeon() {
  if (simHost && simHost.state && simHost.state.world) {
    simHost.save();
  }
  if (typeof window !== 'undefined' && window.location) {
    // Smooth transition into the tactical dungeon engine!
    window.location.href = './index.html';
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
      handleEnterDungeon();
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
  handleQueueBuilding: handleQueueBuilding,
  handleCancelBuilding: handleCancelBuilding,
  handleDemolishBuilding: handleDemolishBuilding,
  handleRecruitHero: handleRecruitHero,
  handleCancelRecruitment: handleCancelRecruitment,
  handleClaimTask: handleClaimTask,
  handleSelectPartyByHero: handleSelectPartyByHero,
  handleEnterDungeon: handleEnterDungeon,
  syncWargameUI: function() { syncWargameUI(simHost); }
};

function bootstrapWargame() {
  setupWargameListeners();

  // Always present the Main Menu / Title Screen on initial startup or reload,
  // allowing the player to either Continue an existing campaign or start a fresh one.
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
