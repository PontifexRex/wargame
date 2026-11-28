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
  createMechanismInstance,
  createPropInstance,
  createContainerInstance,
  createHazardInstance,
  spawnGroundItem,
  addWorldObject
} from './objects.js';
import { createMonsterEntityFromArchetype, createBossEntityFromArchetype } from './procedural.js';
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
  const prevFloor = dng.floors && dng.floors[dng.currentFloor] ? dng.floors[dng.currentFloor] : null;
  if (prevFloor && Array.isArray(prevFloor.monsters)) {
    for (let mi = 0; mi < prevFloor.monsters.length; mi++) {
      if (prevFloor.monsters[mi] && prevFloor.monsters[mi].telegraph) {
        prevFloor.monsters[mi].telegraph = null;
      }
    }
  }
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

  // Calculate cumulative maxXp curve (aligned with canonical Lv1 maxXp = 60)
  let newMaxXp = 60;
  for (let lvl = 2; lvl <= newLvl; lvl++) {
    newMaxXp = Math.round(newMaxXp * 1.4);
  }

  h.level = newLvl;
  h.xp = 0;
  h.maxXp = newMaxXp;

  // Stat points: +2 per level above 1 minus points already spent in bonusStats (all 5 attributes including SPI)
  const totalEarnedStatPoints = (newLvl - 1) * 2;
  const b = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0, spi: 0 };
  const spentStats = (b.str || 0) + (b.dex || 0) + (b.int || 0) + (b.vit || 0) + (b.spi || 0);
  h.statPoints = Math.max(0, Math.floor(totalEarnedStatPoints - spentStats));

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

export function spawnEntity(type, subId = null, x = null, y = null, state = gameState, opts = null) {
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
    const legacyMobAliases = { skeleton_grunt: 'bone_warden' };
    const rawArchId = subId || 'vault_crawler';
    const archId = legacyMobAliases[rawArchId] || rawArchId;
    const isBoss = Boolean(BOSS_ARCHETYPES[archId]);
    const isRegular = Boolean(MONSTER_ARCHETYPES[archId]);
    if (!isBoss && !isRegular) {
      return {
        ok: false,
        reason: 'Unknown monster archetype "' + archId + '". Valid: ' + Object.keys(MONSTER_ARCHETYPES).concat(Object.keys(BOSS_ARCHETYPES)).join(', ')
      };
    }

    // HR-15: Validate walkable, unoccupied floor tile instead of blindly spawning at (hero.x + 1, hero.y) which may be a solid wall!
    const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
    const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
    const isTileFreeForMonster = function(tx, ty) {
      if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;
      const t = floor.tiles && floor.tiles[ty] ? floor.tiles[ty][tx] : 0;
      if (t !== TILE_FLOOR && t !== TILE_STAIRS_UP) return false;
      if (state.hero.x === tx && state.hero.y === ty) return false;
      const occupied = (floor.monsters || []).some(function(m) { return m && m.hp > 0 && m.x === tx && m.y === ty; });
      return !occupied;
    };

    let mx = sx;
    let my = sy;
    const explicitCoords = (typeof x === 'number' && !isNaN(x)) && (typeof y === 'number' && !isNaN(y));
    const strictCoords = Boolean(opts && opts.strictCoords);
    if (explicitCoords && strictCoords) {
      if (!isTileFreeForMonster(mx, my)) {
        return { ok: false, reason: 'Target tile (' + mx + ', ' + my + ') is blocked, out of bounds, or occupied' };
      }
    } else if (!isTileFreeForMonster(mx, my)) {
      let found = null;
      const anchorX = explicitCoords ? mx : state.hero.x;
      const anchorY = explicitCoords ? my : state.hero.y;
      for (let rad = 1; rad <= 12 && !found; rad++) {
        for (let dy = -rad; dy <= rad && !found; dy++) {
          for (let dx = -rad; dx <= rad && !found; dx++) {
            if (Math.abs(dx) !== rad && Math.abs(dy) !== rad) continue;
            const cx = anchorX + dx;
            const cy = anchorY + dy;
            if (isTileFreeForMonster(cx, cy)) {
              found = { x: cx, y: cy };
            }
          }
        }
      }
      if (!found) {
        return { ok: false, reason: 'No unoccupied walkable floor tile found near (' + anchorX + ', ' + anchorY + ')' };
      }
      mx = found.x;
      my = found.y;
    }

    let monster = null;
    if (isBoss) {
      monster = createBossEntityFromArchetype(archId, floor.depth || 1, mx, my, 'boss_dev_' + Date.now());
    } else {
      monster = createMonsterEntityFromArchetype(archId, floor.depth || 1, mx, my, false, Math.random, (floor.monsters ? floor.monsters.length : 0) + 999);
    }
    if (!floor.monsters) floor.monsters = [];
    floor.monsters.push(monster);
    if (floor.explored && floor.explored[my]) {
      floor.explored[my][mx] = 1;
    }
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: '[DEV] Spawned ' + monster.name + ' at (' + mx + ', ' + my + ').', tone: 'gold' }, state);
    }
    return { ok: true, entity: monster, type: 'monster', x: mx, y: my };
  }

  if (tLower === 'mechanism' || tLower === 'mech') {
    const defId = (subLower === 'plate' || subLower === 'pressure_plate') ? 'mech_pressure_plate' : 'mech_wall_lever';
    // Automatically link to nearest door/portcullis on the floor if one exists!
    const nearestDoor = (floor.objects || []).find(function(o) {
      return o && o.objectType === 'door' && Math.hypot(o.x - sx, o.y - sy) <= 8;
    });
    const mech = createMechanismInstance(defId, sx, sy, {
      linkedTargetIds: nearestDoor ? [nearestDoor.instanceId] : []
    });
    addWorldObject(floor, mech);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${mech.name} at (${sx}, ${sy})${nearestDoor ? (' linked to ' + nearestDoor.name) : ''}.`, tone: 'gold' }, state);
    }
    return { ok: true, entity: mech, type: 'mechanism', x: sx, y: sy };
  }

  if (tLower === 'prop') {
    let defId = 'prop_supply_crate';
    if (subLower === 'wooden_barrel' || subLower === 'wood_barrel') defId = 'prop_wooden_barrel';
    else if (subLower === 'barrel' || subLower === 'oil' || subLower === 'oil_barrel') defId = 'prop_oil_barrel';
    else if (subLower === 'barricade' || subLower === 'wood_barricade') defId = 'prop_wood_barricade';
    const prop = createPropInstance(defId, sx, sy);
    addWorldObject(floor, prop);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${prop.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: prop, type: 'prop', x: sx, y: sy };
  }

  if (tLower === 'chest' || tLower === 'container') {
    // Pick an unoccupied walkable tile adjacent to hero so two chests never stack on the same spot
    const candidates = [
      { x: sx, y: sy },
      { x: state.hero.x - 1, y: state.hero.y },
      { x: state.hero.x, y: state.hero.y + 1 },
      { x: state.hero.x, y: state.hero.y - 1 }
    ];
    let placedChest = null;
    let cx = sx;
    let cy = sy;
    for (let ci = 0; ci < candidates.length; ci++) {
      const c = candidates[ci];
      const t = floor.tiles && floor.tiles[c.y] ? floor.tiles[c.y][c.x] : 0;
      if (t !== TILE_FLOOR) continue;
      const chest = createContainerInstance('container_dungeon_chest', c.x, c.y);
      const added = addWorldObject(floor, chest);
      if (added) {
        placedChest = added;
        cx = c.x;
        cy = c.y;
        break;
      }
    }
    if (!placedChest) {
      return { ok: false, reason: 'No unoccupied adjacent floor tile for chest (chests are not stackable)' };
    }
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${placedChest.name} at (${cx}, ${cy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: placedChest, type: 'chest', x: cx, y: cy };
  }

  if (tLower === 'hazard') {
    let defId = 'hazard_slag_vent';
    if (subLower === 'oil' || subLower === 'oil_slick') defId = 'hazard_oil_slick';
    else if (subLower === 'spore' || subLower === 'spore_cloud') defId = 'hazard_spore_cloud';
    const hz = createHazardInstance(defId, sx, sy);
    addWorldObject(floor, hz);
    if (state === gameState) {
      emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, state);
      emitEngineEvent(ENGINE_EVENTS.LOG, { msg: `[DEV] Spawned ${hz.name} at (${sx}, ${sy}).`, tone: 'gold' }, state);
    }
    return { ok: true, entity: hz, type: 'hazard', x: sx, y: sy };
  }

  return { ok: false, reason: `Unknown spawn type "${type}". Valid: door, portal, key, monster, mechanism, prop, hazard` };
}
