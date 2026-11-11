// Overworld Procedural Generation Engine, Settler Unit Movement, City Founding & Guided Task Pipeline

import {
  DEFAULT_OVERWORLD_W,
  DEFAULT_OVERWORLD_H
} from '../constants.js';
import {
  TERRAIN_PLAINS,
  TERRAIN_FOREST,
  TERRAIN_HILLS,
  TERRAIN_MOUNTAINS,
  TERRAIN_WATER,
  OVERWORLD_TERRAIN,
  OVERWORLD_POIS,
  OVERWORLD_UNIT_TYPES,
  GUIDED_TASKS
} from '../data/overworld.js';
import { createSeededRng, hashSeedString } from './rng.js';

export function createDefaultOverworld(width = DEFAULT_OVERWORLD_W, height = DEFAULT_OVERWORLD_H, seed = 1337) {
  const numSeed = typeof seed === 'number' ? seed : hashSeedString(String(seed));
  const rng = createSeededRng(numSeed);

  const tiles = [];
  const explored = [];

  // Generate base terrain matrix
  for (let y = 0; y < height; y++) {
    const row = [];
    const expRow = [];
    for (let x = 0; x < width; x++) {
      expRow.push(false);

      // Map borders are impassable mountains
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push(TERRAIN_MOUNTAINS);
        continue;
      }

      // Procedural terrain distribution using deterministic seeded noise
      const nx = x / width;
      const ny = y / height;
      const distFromCenter = Math.hypot(nx - 0.5, ny - 0.5);

      const roll = rng();

      // Border hills and mountain clusters
      if (distFromCenter > 0.42 && roll < 0.65) {
        row.push(roll < 0.35 ? TERRAIN_MOUNTAINS : TERRAIN_HILLS);
      } else if (distFromCenter > 0.30 && roll < 0.35) {
        row.push(TERRAIN_HILLS);
      } else if (roll < 0.22) {
        row.push(TERRAIN_FOREST);
      } else if (roll < 0.28) {
        row.push(TERRAIN_HILLS);
      } else if (roll < 0.32 && ny > 0.6) {
        row.push(TERRAIN_WATER);
      } else {
        row.push(TERRAIN_PLAINS);
      }
    }
    tiles.push(row);
    explored.push(expRow);
  }

  // Guarantee fertile starting plain near center
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const qx = startX + dx;
      const qy = startY + dy;
      if (qy > 0 && qy < height - 1 && qx > 0 && qx < width - 1) {
        tiles[qy][qx] = TERRAIN_PLAINS;
      }
    }
  }

  // Scatter guaranteed nearby resource nodes
  if (startY - 3 > 0) tiles[startY - 3][startX] = TERRAIN_FOREST;
  if (startY - 3 > 0 && startX + 1 < width - 1) tiles[startY - 3][startX + 1] = TERRAIN_FOREST;
  if (startY + 3 < height - 1) tiles[startY + 3][startX - 1] = TERRAIN_HILLS;
  if (startY + 3 < height - 1) tiles[startY + 3][startX] = TERRAIN_HILLS;

  // Points of Interest
  const pois = [
    {
      id: 'poi_dungeon_starfall',
      type: 'dungeon_entrance',
      name: 'The Starfall Vaults',
      dungeonId: 'dng_starfall',
      x: Math.min(width - 3, startX + 4),
      y: Math.max(2, startY - 3)
    },
    {
      id: 'poi_wood_grove_1',
      type: 'wood_grove',
      name: 'Verdant Timber Grove',
      x: Math.max(2, startX - 3),
      y: Math.max(2, startY - 2)
    },
    {
      id: 'poi_stone_quarry_1',
      type: 'stone_quarry',
      name: 'Granite Quarry',
      x: Math.min(width - 3, startX + 3),
      y: Math.min(height - 3, startY + 3)
    },
    {
      id: 'poi_ore_deposit_1',
      type: 'ore_deposit',
      name: 'Glinting Ore Outcrop',
      x: Math.max(2, startX - 4),
      y: Math.min(height - 3, startY + 2)
    }
  ];

  // Starting Pioneer Settler Party
  const settlerParty = {
    id: 'party_settler_1',
    name: 'Pioneer Settler',
    unitType: 'settler',
    x: startX,
    y: startY,
    hp: 100,
    maxHp: 100,
    alive: true,
    canFoundCity: true,
    settled: false
  };

  // Unveil fog of war in vision radius around Settler spawn
  const vision = 3;
  for (let vy = -vision; vy <= vision; vy++) {
    for (let vx = -vision; vx <= vision; vx++) {
      const ey = startY + vy;
      const ex = startX + vx;
      if (ey >= 0 && ey < height && ex >= 0 && ex < width) {
        explored[ey][ex] = true;
      }
    }
  }

  return {
    width: width,
    height: height,
    seed: seed,
    tiles: tiles,
    explored: explored,
    pois: pois,
    parties: [settlerParty],
    activePartyId: 'party_settler_1',
    spawnX: startX,
    spawnY: startY,
    settlerSteps: 0
  };
}

export function ensureOverworldHydrated(state) {
  if (!state) return null;

  if (!state.universe || typeof state.universe !== 'object') {
    state.universe = {
      id: 'universe_prime',
      name: 'Aethelgard Universe'
    };
  }

  if (!state.world || typeof state.world !== 'object') {
    state.world = {
      id: 'world_prime',
      name: 'Starfall Realm',
      seed: 1337,
      tick: 0
    };
  }

  if (!state.cities || typeof state.cities !== 'object') {
    state.cities = {};
  }

  if (!state.tasks || typeof state.tasks !== 'object') {
    state.tasks = {
      active: ['task_move_settler', 'task_found_first_city', 'task_build_guild_hall', 'task_delve_vault'],
      completed: [],
      claimed: []
    };
  } else {
    if (!Array.isArray(state.tasks.active)) {
      state.tasks.active = ['task_move_settler', 'task_found_first_city', 'task_build_guild_hall', 'task_delve_vault'];
    }
    if (!Array.isArray(state.tasks.completed)) state.tasks.completed = [];
    if (!Array.isArray(state.tasks.claimed)) state.tasks.claimed = [];
  }

  if (!state.activeView) {
    state.activeView = state.inGuild ? 'guild' : 'dungeon';
  }

  if (!state.overworld || !Array.isArray(state.overworld.tiles)) {
    const owSeed = (state.world && state.world.seed) || 1337;
    state.overworld = createDefaultOverworld(DEFAULT_OVERWORLD_W, DEFAULT_OVERWORLD_H, owSeed);
  }

  return state.overworld;
}

export function getActiveOverworldParty(state) {
  if (!state || !state.overworld || !Array.isArray(state.overworld.parties)) return null;
  const pId = state.overworld.activePartyId;
  const found = state.overworld.parties.find(function(p) { return p.id === pId; });
  if (found) return found;
  return state.overworld.parties.find(function(p) { return p.alive; }) || state.overworld.parties[0] || null;
}

export function moveOverworldParty(partyId, dx, dy, state) {
  if (!state || !state.overworld) return { success: false, reason: 'No overworld' };
  const ow = state.overworld;

  const party = ow.parties.find(function(p) { return p.id === partyId; }) || getActiveOverworldParty(state);
  if (!party || !party.alive) {
    return { success: false, reason: 'No active overworld unit' };
  }

  const tx = party.x + dx;
  const ty = party.y + dy;

  if (tx < 0 || tx >= ow.width || ty < 0 || ty >= ow.height) {
    return { success: false, reason: 'Target is outside map boundaries' };
  }

  const tile = ow.tiles[ty][tx];
  if (tile === TERRAIN_MOUNTAINS || tile === TERRAIN_WATER) {
    const tDef = OVERWORLD_TERRAIN[tile];
    return { success: false, reason: 'Impassable terrain: ' + (tDef ? tDef.name : 'Unknown') };
  }

  // Move party
  party.x = tx;
  party.y = ty;
  ow.settlerSteps = (ow.settlerSteps || 0) + 1;

  // Unveil fog of war
  const vision = 3;
  for (let vy = -vision; vy <= vision; vy++) {
    for (let vx = -vision; vx <= vision; vx++) {
      const ey = ty + vy;
      const ex = tx + vx;
      if (ey >= 0 && ey < ow.height && ex >= 0 && ex < ow.width) {
        ow.explored[ey][ex] = true;
      }
    }
  }

  evaluateGuidedTasks(state);

  return {
    success: true,
    x: tx,
    y: ty,
    tile: tile,
    settlerSteps: ow.settlerSteps
  };
}

export function foundCity(partyId, cityName, state) {
  if (!state) return { success: false, reason: 'Invalid state' };
  ensureOverworldHydrated(state);
  const ow = state.overworld;

  const party = (partyId ? ow.parties.find(function(p) { return p.id === partyId; }) : null) || getActiveOverworldParty(state);
  if (!party || !party.alive || !party.canFoundCity) {
    return { success: false, reason: 'Selected unit cannot found a settlement' };
  }

  const tile = ow.tiles[party.y][party.x];
  if (tile === TERRAIN_MOUNTAINS || tile === TERRAIN_WATER) {
    return { success: false, reason: 'Cannot build a settlement on impassable terrain' };
  }

  // Consume/settle the pioneer unit
  party.alive = false;
  party.settled = true;

  const cityId = 'city_' + (Object.keys(state.cities).length + 1);
  const finalName = cityName || (Object.keys(state.cities).length === 0 ? 'Oakhaven Bastion' : 'Outpost ' + cityId);

  const newCity = {
    id: cityId,
    name: finalName,
    x: party.x,
    y: party.y,
    level: 1,
    stockpile: {
      wood: 75,
      stone: 50,
      gold: 50,
      food: 100
    },
    buildings: {
      townSquare: 1,
      guildHall: 1
    },
    buildQueue: []
  };

  state.cities[cityId] = newCity;

  // Add City POI to overworld
  ow.pois.push({
    id: 'poi_' + cityId,
    type: 'city',
    name: finalName,
    cityId: cityId,
    x: party.x,
    y: party.y
  });

  evaluateGuidedTasks(state);

  return {
    success: true,
    city: newCity
  };
}

export function respawnSettler(state) {
  if (!state) return { success: false, reason: 'Invalid state' };
  ensureOverworldHydrated(state);
  const ow = state.overworld;

  // Check if player already has a city
  if (state.cities && Object.keys(state.cities).length > 0) {
    return { success: false, reason: 'Civilization already established' };
  }

  let settler = ow.parties.find(function(p) { return p.unitType === 'settler'; });
  if (!settler) {
    settler = {
      id: 'party_settler_' + Date.now(),
      name: 'Pioneer Settler',
      unitType: 'settler',
      x: ow.spawnX || Math.floor(ow.width / 2),
      y: ow.spawnY || Math.floor(ow.height / 2),
      hp: 100,
      maxHp: 100,
      alive: true,
      canFoundCity: true,
      settled: false
    };
    ow.parties.push(settler);
  } else {
    settler.alive = true;
    settler.hp = settler.maxHp;
    settler.settled = false;
    settler.x = ow.spawnX || Math.floor(ow.width / 2);
    settler.y = ow.spawnY || Math.floor(ow.height / 2);
  }

  ow.activePartyId = settler.id;

  // Reveal area around spawn
  const vision = 3;
  for (let vy = -vision; vy <= vision; vy++) {
    for (let vx = -vision; vx <= vision; vx++) {
      const ey = settler.y + vy;
      const ex = settler.x + vx;
      if (ey >= 0 && ey < ow.height && ex >= 0 && ex < ow.width) {
        ow.explored[ey][ex] = true;
      }
    }
  }

  return {
    success: true,
    settler: settler
  };
}

export function evaluateGuidedTasks(state) {
  if (!state) return [];
  ensureOverworldHydrated(state);

  const taskStatuses = [];
  const activeIds = state.tasks.active || [];
  const claimedIds = state.tasks.claimed || [];

  for (let i = 0; i < GUIDED_TASKS.length; i++) {
    const tDef = GUIDED_TASKS[i];
    const isCompleted = tDef.checkCompletion(state);
    const isClaimed = claimedIds.indexOf(tDef.id) !== -1;
    const readyToClaim = isCompleted && !isClaimed;

    if (isCompleted && state.tasks.completed.indexOf(tDef.id) === -1) {
      state.tasks.completed.push(tDef.id);
    }

    taskStatuses.push({
      id: tDef.id,
      title: tDef.title,
      desc: tDef.desc,
      category: tDef.category,
      reward: tDef.reward,
      rewardLabel: tDef.rewardLabel,
      completed: isCompleted,
      claimed: isClaimed,
      readyToClaim: readyToClaim
    });
  }

  return taskStatuses;
}

export function claimTaskReward(taskId, state) {
  if (!state) return { success: false, reason: 'Invalid state' };
  ensureOverworldHydrated(state);

  const tDef = GUIDED_TASKS.find(function(t) { return t.id === taskId; });
  if (!tDef) {
    return { success: false, reason: 'Unknown task: ' + taskId };
  }

  const isCompleted = tDef.checkCompletion(state);
  if (!isCompleted) {
    return { success: false, reason: 'Task requirements not yet satisfied' };
  }

  if (state.tasks.claimed.indexOf(taskId) !== -1) {
    return { success: false, reason: 'Reward has already been claimed' };
  }

  // Grant rewards
  const r = tDef.reward || {};
  let targetCity = null;
  const cityKeys = Object.keys(state.cities || {});
  if (cityKeys.length > 0) {
    targetCity = state.cities[cityKeys[0]];
  }

  if (r.wood) {
    if (targetCity) targetCity.stockpile.wood = (targetCity.stockpile.wood || 0) + r.wood;
  }
  if (r.stone) {
    if (targetCity) targetCity.stockpile.stone = (targetCity.stockpile.stone || 0) + r.stone;
  }
  if (r.food) {
    if (targetCity) targetCity.stockpile.food = (targetCity.stockpile.food || 0) + r.food;
  }
  if (r.gold) {
    if (state.guildVault) state.guildVault.gold = (state.guildVault.gold || 0) + r.gold;
    if (targetCity) targetCity.stockpile.gold = (targetCity.stockpile.gold || 0) + r.gold;
  }
  if (r.potions && state.hero && state.hero.consumables) {
    state.hero.consumables.potions = (state.hero.consumables.potions || 0) + r.potions;
  }
  if (r.recalls && state.hero && state.hero.consumables) {
    state.hero.consumables.recalls = (state.hero.consumables.recalls || 0) + r.recalls;
  }

  state.tasks.claimed.push(taskId);
  if (state.tasks.completed.indexOf(taskId) === -1) {
    state.tasks.completed.push(taskId);
  }

  return {
    success: true,
    taskId: taskId,
    reward: r,
    rewardLabel: tDef.rewardLabel
  };
}

export function switchActiveView(viewName, state) {
  if (!state) return 'overworld';
  ensureOverworldHydrated(state);

  const validViews = ['overworld', 'guild', 'dungeon'];
  if (validViews.indexOf(viewName) === -1) {
    viewName = 'overworld';
  }

  state.activeView = viewName;
  if (viewName === 'dungeon') {
    state.inGuild = false;
  } else {
    state.inGuild = true;
  }

  return state.activeView;
}
