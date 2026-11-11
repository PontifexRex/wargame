// Developer & Tester Console Engine Actions (Teleport, Level Scaling, Cheats & REPL)

import {
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  TILE_FLOOR,
  TILE_STAIRS_UP
} from '../constants.js';
import { hashSeedString } from './rng.js';
import {
  gameState,
  saveGame,
  ensureDungeonFloorHydrated,
  syncActiveDungeonAlias,
  recomputeHeroDerivedStats
} from './state.js';
import { generateFloor } from './procedural.js';
import { ENGINE_EVENTS, emitEngineEvent } from './events.js';
import {
  createDoorInstance,
  createPortalInstance,
  spawnGroundItem,
  addWorldObject
} from './objects.js';
import { createMonsterEntityFromArchetype } from './procedural.js';
import { MONSTER_ARCHETYPES, BOSS_ARCHETYPES } from '../data/monsters.js';

export function gotoFloor(depth, dungeonId = null, state = gameState) {
  if (!state || !state.hero) {
    return { ok: false, reason: 'no_hero' };
  }

  // Switch active dungeon if specified
  if (dungeonId && state.dungeons && state.dungeons[dungeonId]) {
    state.activeDungeonId = dungeonId;
    syncActiveDungeonAlias(state);
  }

  if (!state.dungeon) {
    syncActiveDungeonAlias(state);
  }
  if (!state.dungeon) {
    return { ok: false, reason: 'no_dungeon' };
  }

  const dng = state.dungeon;
  const targetDepth = Math.max(1, Math.min(999, Math.round(Number(depth) || 1)));

  // Generate floor if not already generated or stored
  if (!dng.floors) dng.floors = {};
  if (!dng.floors[targetDepth]) {
    const seed = dng.numericSeed || hashSeedString(dng.seedCode || 'STAR-0001', 0);
    dng.floors[targetDepth] = generateFloor(targetDepth, dng.config, seed);
  }

  const floor = ensureDungeonFloorHydrated(dng, targetDepth);
  if (!floor) {
    return { ok: false, reason: 'floor_generation_failed' };
  }

  dng.currentFloor = targetDepth;
  dng.deepestFloor = Math.max(dng.deepestFloor || 1, targetDepth);
  state.inGuild = false;

  // Position hero on stairs up or safe floor tile
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  let placed = false;

  if (floor.upPos && floor.upPos.x >= 0 && floor.upPos.y >= 0) {
    const t = floor.tiles[floor.upPos.y][floor.upPos.x];
    if (t === TILE_FLOOR || t === TILE_STAIRS_UP) {
      state.hero.x = floor.upPos.x;
      state.hero.y = floor.upPos.y;
      placed = true;
    }
  }

  if (!placed) {
    for (let y = 1; y < fh - 1; y++) {
      for (let x = 1; x < fw - 1; x++) {
        if (floor.tiles[y][x] === TILE_FLOOR) {
          state.hero.x = x;
          state.hero.y = y;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // Ensure hero starting tile is explored
  if (floor.explored && floor.explored[state.hero.y]) {
    floor.explored[state.hero.y][state.hero.x] = 1;
  }

  if (state === gameState) {
    emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.LOG, {
      msg: `[DEV] Warped to ${dng.name} Floor ${targetDepth} at (${state.hero.x}, ${state.hero.y}).`,
      tone: 'gold'
    }, state);
    saveGame();
  }

  return {
    ok: true,
    depth: targetDepth,
    dungeonId: dng.id,
    dungeonName: dng.name,
    x: state.hero.x,
    y: state.hero.y
  };
}

export function setHeroLevel(targetLevel, state = gameState) {
  if (!state || !state.hero) {
    return { ok: false, reason: 'no_hero' };
  }

  const h = state.hero;
  const newLvl = Math.max(1, Math.min(100, Math.round(Number(targetLevel) || 1)));

  // Calculate cumulative maxXp curve
  let newMaxXp = 40;
  for (let lvl = 2; lvl <= newLvl; lvl++) {
    newMaxXp = Math.round(newMaxXp * 1.4);
  }

  h.level = newLvl;
  h.xp = 0;
  h.maxXp = newMaxXp;

  // Stat points: +2 per level above 1 minus points already spent in bonusStats
  const totalEarnedStatPoints = (newLvl - 1) * 2;
  const b = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 };
  const spentStats = (b.str || 0) + (b.dex || 0) + (b.int || 0) + (b.vit || 0);
  h.statPoints = Math.max(0, totalEarnedStatPoints - spentStats);

  // Talent points: +1 per level above 1 minus talents already allocated
  const totalEarnedTalents = Math.max(0, newLvl - 1);
  let allocatedTalents = 0;
  if (h.talentsAllocated) {
    const keys = Object.keys(h.talentsAllocated);
    for (let i = 0; i < keys.length; i++) {
      allocatedTalents += (h.talentsAllocated[keys[i]] || 0);
    }
  }
  h.talentPoints = Math.max(0, totalEarnedTalents - allocatedTalents);

  recomputeHeroDerivedStats(true, state);
  h.hp = h.maxHp;
  h.mp = h.maxMp;

  if (state === gameState) {
    emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.LOG, {
      msg: `[DEV] Set hero to Level ${newLvl} (Max HP ${h.maxHp}, Max MP ${h.maxMp}, ${h.talentPoints} Talent Pts).`,
      tone: 'gold'
    }, state);
    saveGame();
  }

  return {
    ok: true,
    level: newLvl,
    maxHp: h.maxHp,
    maxMp: h.maxMp,
    talentPoints: h.talentPoints,
    statPoints: h.statPoints
  };
}

export function fullHeal(state = gameState) {
  if (!state || !state.hero) return { ok: false };
  const h = state.hero;
  h.hp = h.maxHp;
  h.mp = h.maxMp;
  h.statuses = (h.statuses || []).filter(s => Boolean(s.isBuff));
  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.LOG, {
      msg: '[DEV] Restored full HP & MP and cleansed negative statuses.',
      tone: 'good'
    }, state);
  }

  return { ok: true, hp: h.hp, mp: h.mp };
}

export function revealMap(state = gameState) {
  if (!state || !state.dungeon) return { ok: false };
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false };

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      floor.explored[y][x] = 1;
    }
  }

  if (state === gameState) {
    emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.LOG, {
      msg: `[DEV] Revealed entire chart for Floor ${floor.depth}.`,
      tone: 'gold'
    }, state);
  }

  return { ok: true, depth: floor.depth };
}

export function toggleGodMode(state = gameState) {
  if (!state || !state.hero) return { ok: false };
  state.hero.godMode = !state.hero.godMode;

  if (state === gameState) {
    emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, state);
    emitEngineEvent(ENGINE_EVENTS.LOG, {
      msg: `[DEV] God Mode ${state.hero.godMode ? 'ACTIVATED' : 'DEACTIVATED'}.`,
      tone: state.hero.godMode ? 'gold' : 'info'
    }, state);
  }

  return { ok: true, godMode: state.hero.godMode };
}

export function executeDevCommand(cmdStr, state = gameState) {
  if (!cmdStr || typeof cmdStr !== 'string') {
    return { ok: false, output: 'Empty command.' };
  }

  const raw = cmdStr.trim();
  const parts = raw.split(/\s+/);
  const verb = parts[0].toLowerCase();
  const arg1 = parts[1];
  const arg2 = parts[2];

  if (verb === 'goto' || verb === 'warp' || verb === 'floor') {
    const depth = Number(arg1);
    if (!depth || depth < 1) {
      return { ok: false, output: 'Usage: goto <depth> [dungeonId]' };
    }
    const res = gotoFloor(depth, arg2 || null, state);
    return {
      ok: res.ok,
      output: res.ok ? `Warped to ${res.dungeonName} Floor ${res.depth} at (${res.x}, ${res.y})` : `Failed to warp: ${res.reason}`
    };
  }

  if (verb === 'level' || verb === 'lvl') {
    const lvl = Number(arg1);
    if (!lvl || lvl < 1) {
      return { ok: false, output: 'Usage: level <1-100>' };
    }
    const res = setHeroLevel(lvl, state);
    return {
      ok: res.ok,
      output: res.ok ? `Set Hero Level to ${res.level} (${res.talentPoints} Talent Pts, ${res.statPoints} Stat Pts)` : `Failed: ${res.reason}`
    };
  }

  if (verb === 'heal') {
    const res = fullHeal(state);
    return { ok: res.ok, output: 'Restored full HP/MP & cleansed negative statuses.' };
  }

  if (verb === 'reveal' || verb === 'map') {
    const res = revealMap(state);
    return { ok: res.ok, output: 'Revealed full floor chart.' };
  }

  if (verb === 'god') {
    const res = toggleGodMode(state);
    return { ok: res.ok, output: `God Mode is now ${res.godMode ? 'ON' : 'OFF'}` };
  }

  if (verb === 'spawn') {
    const type = arg1;
    const subId = arg2;
    const arg3 = parts[3];
    const arg4 = parts[4];
    const x = arg3 !== undefined ? Number(arg3) : null;
    const y = arg4 !== undefined ? Number(arg4) : null;
    if (!type) {
      return { ok: false, output: 'Usage: spawn <door|portal|key|monster> [subId] [x] [y]' };
    }
    const res = spawnEntity(type, subId, x, y, state);
    return {
      ok: res.ok,
      output: res.ok ? `Spawned ${res.type} (${res.entity.name || subId}) at (${res.x}, ${res.y})` : `Failed: ${res.reason}`
    };
  }

  if (verb === 'help') {
    return {
      ok: true,
      output: 'Commands: goto <depth> [dungeonId], level <lvl>, heal, reveal, god, spawn <door|portal|key|monster> [subId], help'
    };
  }

  return { ok: false, output: `Unknown command "${verb}". Type "help" for a list of commands.` };
}

export function spawnEntity(type, subId = null, x = null, y = null, state = gameState) {
  if (!state || !state.hero || state.inGuild) {
    return { ok: false, reason: 'not_in_dungeon' };
  }
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  const sx = typeof x === 'number' && !isNaN(x) ? x : state.hero.x + 1;
  const sy = typeof y === 'number' && !isNaN(y) ? y : state.hero.y;

  const tLower = (type || '').toLowerCase();
  const subLower = (subId || '').toLowerCase();

  if (tLower === 'door') {
    let defId = 'door_wood_hinged';
    if (subLower === 'iron' || subLower === 'reinforced') defId = 'door_iron_reinforced';
    else if (subLower === 'portcullis' || subLower === 'grate') defId = 'door_iron_portcullis';
    else if (subLower === 'vault' || subLower === 'dwarven') defId = 'door_vault_ancient';
    else if (subLower === 'secret' || subLower === 'stone') defId = 'door_secret_stone';

    const door = createDoorInstance(defId, sx, sy);
    addWorldObject(floor, door);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${door.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: door, type: 'door', x: sx, y: sy };
  }

  if (tLower === 'portal') {
    let defId = 'portal_ancient_waypoint';
    if (subLower === 'rift' || subLower === 'astral') defId = 'portal_astral_rift';
    else if (subLower === 'boss' || subLower === 'extraction' || subLower === 'gateway') defId = 'portal_boss_extraction';

    const portal = createPortalInstance(defId, sx, sy);
    addWorldObject(floor, portal);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${portal.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: portal, type: 'portal', x: sx, y: sy };
  }

  if (tLower === 'key') {
    let keyDefId = 'key_iron_common';
    if (subLower === 'vault' || subLower === 'dwarven') keyDefId = 'key_vault_dwarven';
    else if (subLower === 'celestial' || subLower === 'rune') keyDefId = 'key_rune_celestial';

    const pickup = spawnGroundItem(floor, keyDefId, sx, sy);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${pickup.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: pickup, type: 'key', x: sx, y: sy };
  }

  if (tLower === 'monster' || tLower === 'mob') {
    const archId = subId || 'vault_crawler';
    const isBoss = BOSS_ARCHETYPES[archId];
    let monster = null;
    if (isBoss) {
      const bDef = BOSS_ARCHETYPES[archId];
      monster = {
        uid: `boss_dev_${Date.now()}`,
        id: bDef.id,
        bountyTag: 'boss',
        name: bDef.name,
        isBoss: true,
        dropRarity: bDef.dropRarity || 'epic',
        isRanged: !!bDef.isRanged,
        range: bDef.range || 1,
        x: sx,
        y: sy,
        hp: bDef.hp,
        maxHp: bDef.hp,
        atk: bDef.atk,
        def: bDef.def,
        xp: bDef.xp,
        color: bDef.color,
        statuses: []
      };
    } else {
      monster = createMonsterEntityFromArchetype(archId, floor.depth || 1, sx, sy, false, Math.random, 999);
    }
    if (!floor.monsters) floor.monsters = [];
    floor.monsters.push(monster);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${monster.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: monster, type: 'monster', x: sx, y: sy };
  }

  return { ok: false, reason: `Unknown spawn type "${type}". Valid: door, portal, key, monster` };
}
