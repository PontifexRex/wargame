// Turn-Based Movement, Combat Resolution, Active Class Skills, Monster AI, Wall LOS, Auto-Walk & Stairs

import {
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  TILE_WALL,
  TILE_FLOOR,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN,
  TILE_CHEST,
  TILE_CHEST_OPEN,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_HIDDEN,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED,
  RARITY
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { getMonsterDefinition, getMonsterAbilityDefinition } from '../data/monsters.js';
import { CLEANSEABLE_STATUS_IDS, getAbilityDefinition } from '../data/abilities.js';
import {
  normalizeActorAbilityState,
  getGrantedAbilityIds,
  getAbilityCooldownRemaining,
  setAbilityCooldown,
  tickActorAbilityCooldowns,
  validateAbilityActivation,
  getEffectiveAbilityCost,
  isAbilitySilenced,
  computeAbilityDamage,
  computeAbilityHealAmount,
  computeAbilityShieldAmount,
  applyDamageWithShield
} from '../core/abilityEngine.js';
import { grantHeroKnowledge } from '../core/knowledge.js';
import { ORE_CATALOG } from '../data/ores.js';
import { RESEARCH_PROJECTS } from '../data/research.js';
import {
  gameState,
  saveGame,
  ensureDungeonFloorHydrated,
  recomputeHeroDerivedStats,
  ensureCodexState,
  getCodexMasteryMultiplier,
  recordRelicUnlock
} from './state.js';
import { generateFloor, generateProceduralEquipment } from './procedural.js';
import { playSound } from './audio.js';
import { ENGINE_EVENTS, emitEngineEvent } from './events.js';
import {
  isDoorWalkable,
  isDoorOpaque,
  createPortalInstance,
  addWorldObject,
  removeWorldObject,
  isMechanism,
  isDestructibleProp,
  isClosedContainer,
  openContainerObject,
  toggleLinkedMechanisms,
  damageDestructibleProp,
  resolveHazardStepEffects
} from './objects.js';
import { executeInteraction } from './interactions.js';
import {
  registerActionCallbacks,
  getActionCallbacks,
  applyStatusEffect,
  mineTile,
  addExpeditionTradeItem,
  gainExperience,
  recordBountyProgress,
  detectNearbyTraps,
  activateAstralShrine,
  resolveTrapInteraction,
  extractToGuild,
  handleHeroDefeat,
  pickupGroundObjectsAt,
  traversePortal
} from './actions.js';

export { applyStatusEffect };

let fovCallback = () => {};

export function registerCombatFOVCallback(fn) {
  if (typeof fn === 'function') {
    fovCallback = fn;
    registerActionCallbacks({ updateFOV: fn });
  }
}

// ============================================================================
// BRESENHAM LINE-OF-SIGHT & HOSTILE AWARENESS
// ============================================================================

export function hasLineOfSight(floor, x0, y0, x1, y1) {
  if (!floor || !floor.tiles) return false;
  let cx = Math.round(x0);
  let cy = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);

  if (cx === tx && cy === ty) return true;

  const fh = floor.tiles.length;
  const fw = floor.tiles[0] ? floor.tiles[0].length : 0;
  if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;

  const dx = Math.abs(tx - cx);
  const dy = Math.abs(ty - cy);
  const sx = cx < tx ? 1 : -1;
  const sy = cy < ty ? 1 : -1;
  let err = dx - dy;

  while (!(cx === tx && cy === ty)) {
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
    if (cx === tx && cy === ty) {
      return true;
    }
    if (cx < 0 || cx >= fw || cy < 0 || cy >= fh) {
      return false;
    }
    const tile = floor.tiles[cy][cx];
    if (tile === TILE_WALL || ORE_CATALOG[tile]) {
      return false;
    }
    if (floor.objects && floor.objects.length > 0) {
      for (let oi = 0; oi < floor.objects.length; oi++) {
        const obj = floor.objects[oi];
        if (obj && obj.x === cx && obj.y === cy && isDoorOpaque(obj)) {
          return false;
        }
      }
    }
  }
  return true;
}

export function areHostilesInSight(floor, state = gameState) {
  if (!floor || !floor.monsters || !state || !state.hero) return false;
  const h = state.hero;
  const vision = h.visionRadius || 5;
  const maxBox = Math.ceil(vision + 1);

  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    if (Math.abs(m.x - h.x) > maxBox || Math.abs(m.y - h.y) > maxBox) continue;
    if (Math.hypot(m.x - h.x, m.y - h.y) <= vision + 0.35 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)) {
      return true;
    }
  }
  return false;
}

export function countHostilesInSight(floor, state = gameState) {
  if (!floor || !floor.monsters || !state || !state.hero) return 0;
  const h = state.hero;
  const vision = h.visionRadius || 5;
  const maxBox = Math.ceil(vision + 1);
  let count = 0;

  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    if (Math.abs(m.x - h.x) > maxBox || Math.abs(m.y - h.y) > maxBox) continue;
    if (Math.hypot(m.x - h.x, m.y - h.y) <= vision + 0.35 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)) {
      count++;
    }
  }
  return count;
}

// ============================================================================
// SAFE EXPLORED PATHFINDING & CLICK-TO-TRAVEL AUTO-WALK
// ============================================================================

let activeAutoWalkQueue = [];
let autoWalkTimerId = null;
let autoWalkMode = 'walk'; // 'walk' | 'sprint'
let autoWalkInterval = 36;
let initialVisibleMonsters = 0;

export function isAutoWalking() {
  return activeAutoWalkQueue.length > 0;
}

export function getAutoWalkPath() {
  return activeAutoWalkQueue.slice();
}

export function setAutoWalkPath(pathArray) {
  activeAutoWalkQueue = Array.isArray(pathArray) ? pathArray.slice() : [];
}

export function cancelAutoWalk() {
  activeAutoWalkQueue = [];
  autoWalkMode = 'walk';
  autoWalkInterval = 36;
  if (autoWalkTimerId !== null && typeof clearTimeout !== 'undefined') {
    clearTimeout(autoWalkTimerId);
    autoWalkTimerId = null;
  }
}

export function computeSafeExploredPath(floor, sx, sy, tx, ty) {
  if (!floor || !floor.tiles || !floor.explored) return null;
  const fh = floor.tiles.length;
  const fw = floor.tiles[0] ? floor.tiles[0].length : 0;
  if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return null;
  if (sx < 0 || sx >= fw || sy < 0 || sy >= fh) return null;
  if (!floor.explored[ty] || !floor.explored[ty][tx]) return null;
  if (sx === tx && sy === ty) return [];

  const destTile = floor.tiles[ty][tx];
  if (destTile === TILE_WALL || destTile === TILE_TRAP_VISIBLE) {
    return null;
  }

  const total = fw * fh;
  const visited = new Uint8Array(total);
  const parent = new Int32Array(total);
  parent.fill(-1);
  const queue = new Int32Array(total);

  // Mark monster positions as blocked (except if clicking directly adjacent monster, handled by click)
  const monsterBlocked = new Uint8Array(total);
  if (Array.isArray(floor.monsters)) {
    for (let i = 0; i < floor.monsters.length; i++) {
      const m = floor.monsters[i];
      if (m && m.hp > 0 && m.x >= 0 && m.x < fw && m.y >= 0 && m.y < fh) {
        monsterBlocked[m.y * fw + m.x] = 1;
      }
    }
  }

  const startIdx = sy * fw + sx;
  const targetIdx = ty * fw + tx;
  visited[startIdx] = 1;
  let head = 0;
  let tail = 0;
  queue[tail++] = startIdx;

  const dirsX = [0, 0, -1, 1];
  const dirsY = [-1, 1, 0, 0];
  let found = false;

  while (head < tail) {
    const cur = queue[head++];
    if (cur === targetIdx) {
      found = true;
      break;
    }
    const cx = cur % fw;
    const cy = (cur - cx) / fw;

    for (let d = 0; d < 4; d++) {
      const nx = cx + dirsX[d];
      const ny = cy + dirsY[d];
      if (nx < 0 || nx >= fw || ny < 0 || ny >= fh) continue;
      const nIdx = ny * fw + nx;
      if (visited[nIdx]) continue;
      if (!floor.explored[ny] || !floor.explored[ny][nx]) continue;
      if (monsterBlocked[nIdx] && nIdx !== targetIdx) continue;

      const t = floor.tiles[ny][nx];
      const isSafeStep = (
        t === TILE_FLOOR ||
        t === TILE_STAIRS_UP ||
        t === TILE_STAIRS_DOWN ||
        t === TILE_CHEST_OPEN ||
        t === TILE_SHRINE_USED ||
        t === TILE_TRAP_DISARMED ||
        t === TILE_TRAP_HIDDEN
      );
      const isInteractiveGoal = nIdx === targetIdx && (
        t === TILE_CHEST ||
        t === TILE_SHRINE ||
        !!ORE_CATALOG[t]
      );

      if (!isSafeStep && !isInteractiveGoal) continue;

      if (Array.isArray(floor.objects)) {
        let isClosedDoor = false;
        for (let di = 0; di < floor.objects.length; di++) {
          const dobj = floor.objects[di];
          if (dobj && dobj.x === nx && dobj.y === ny && dobj.objectType === 'door' && !isDoorWalkable(dobj)) {
            isClosedDoor = true;
            break;
          }
        }
        if (isClosedDoor && nIdx !== targetIdx) continue;
      }

      visited[nIdx] = 1;
      parent[nIdx] = cur;
      queue[tail++] = nIdx;
    }
  }

  if (!found) return null;

  const steps = [];
  let trace = targetIdx;
  while (trace !== startIdx && trace !== -1) {
    const px = trace % fw;
    const py = (trace - px) / fw;
    steps.push({ x: px, y: py });
    trace = parent[trace];
  }
  steps.reverse();
  return steps;
}

export function stepAutoWalkOnce(state = gameState) {
  const ui = getActionCallbacks();
  if (!state || state.inGuild || !state.hero || activeAutoWalkQueue.length === 0) {
    cancelAutoWalk();
    return { ok: false, done: true, reason: 'idle' };
  }

  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) {
    cancelAutoWalk();
    return { ok: false, halted: true, reason: 'no_floor' };
  }

  const currentHostiles = countHostilesInSight(floor, state);
  const meleeHostile = floor.monsters && floor.monsters.some(m => m.hp > 0 && Math.abs(m.x - state.hero.x) <= 1 && Math.abs(m.y - state.hero.y) <= 1);
  const shouldHaltHostile = (autoWalkMode === 'sprint')
    ? (meleeHostile || currentHostiles > initialVisibleMonsters)
    : areHostilesInSight(floor, state);

  if (shouldHaltHostile) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log(`${autoWalkMode === 'sprint' ? 'Sprint' : 'Auto-walk'} halted: hostile guardian encountered!`, 'gold');
    }
    return { ok: false, halted: true, reason: 'hostile_in_sight' };
  }

  const nextStep = activeAutoWalkQueue.shift();
  const dx = nextStep.x - state.hero.x;
  const dy = nextStep.y - state.hero.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    cancelAutoWalk();
    return { ok: false, halted: true, reason: 'desync' };
  }

  if (floor.tiles[nextStep.y][nextStep.x] === TILE_TRAP_VISIBLE) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(nextStep.x, nextStep.y, '⚠ Trap Ahead!', '#fbbf24');
      ui.log('Auto-walk halted before spotted trap.', 'gold');
    }
    return { ok: false, halted: true, reason: 'trap_ahead' };
  }

  const hpBefore = state.hero.hp;
  handlePlayerAction(dx, dy, state);

  if (state.inGuild) {
    cancelAutoWalk();
    return { ok: true, stepped: true, halted: true, reason: 'left_dungeon' };
  }

  if (state.hero.hp < hpBefore) {
    cancelAutoWalk();
    return { ok: true, stepped: true, halted: true, reason: 'took_damage' };
  }

  const postFloor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  const postHostiles = countHostilesInSight(postFloor, state);
  const postMelee = postFloor.monsters && postFloor.monsters.some(m => m.hp > 0 && Math.abs(m.x - state.hero.x) <= 1 && Math.abs(m.y - state.hero.y) <= 1);
  const postHaltHostile = (autoWalkMode === 'sprint')
    ? (postMelee || postHostiles > initialVisibleMonsters)
    : areHostilesInSight(postFloor, state);

  if (postHaltHostile) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log(`${autoWalkMode === 'sprint' ? 'Sprint' : 'Auto-walk'} halted: hostile guardian encountered!`, 'gold');
    }
    return { ok: true, stepped: true, halted: true, reason: 'hostile_in_sight' };
  }

  return {
    ok: true,
    stepped: true,
    halted: false,
    remaining: activeAutoWalkQueue.length
  };
}

export function scheduleNextAutoWalkTick(interval = autoWalkInterval) {
  if (autoWalkTimerId !== null && typeof clearTimeout !== 'undefined') {
    clearTimeout(autoWalkTimerId);
    autoWalkTimerId = null;
  }
  if (activeAutoWalkQueue.length === 0 || typeof setTimeout === 'undefined') return;
  autoWalkTimerId = setTimeout(() => {
    autoWalkTimerId = null;
    const res = stepAutoWalkOnce(gameState);
    if (res && res.ok && !res.halted && res.remaining > 0) {
      scheduleNextAutoWalkTick(interval);
    }
  }, interval);
}

export function startAutoWalkTo(tx, ty, state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild || !state.hero) {
    return { ok: false, reason: 'in_guild' };
  }

  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  if (areHostilesInSight(floor, state)) {
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, 'Hostiles Nearby!', '#f87171');
      ui.log('Cannot auto-walk while hostile guardians are in sight.', 'bad');
    }
    return { ok: false, reason: 'hostile_in_sight' };
  }

  const path = computeSafeExploredPath(floor, state.hero.x, state.hero.y, tx, ty);
  if (!path || path.length === 0) {
    if (state === gameState) {
      ui.floatingText(tx, ty, 'Unexplored / Blocked', '#8b949e');
    }
    return { ok: false, reason: 'no_path' };
  }

  autoWalkMode = 'walk';
  autoWalkInterval = 36;
  activeAutoWalkQueue = path;
  if (state === gameState) {
    scheduleNextAutoWalkTick(autoWalkInterval);
  }
  return { ok: true, steps: path.length, path: path.slice() };
}

// ============================================================================
// COMBAT RESOLUTION, BOSS DROPS & MONSTER AI
// ============================================================================

export function clearFloorTelegraphs(floor) {
  if (!floor || !Array.isArray(floor.monsters)) return 0;
  let cleared = 0;
  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (m && m.telegraph) {
      m.telegraph = null;
      cleared += 1;
    }
  }
  return cleared;
}

export function killMonster(monster, state = gameState) {
  if (!monster) return;
  const ui = getActionCallbacks();
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;
  const wasOnFloor = Array.isArray(floor.monsters) && floor.monsters.indexOf(monster) !== -1;
  if (monster._dead && (wasOnFloor || monster.uid)) return;
  monster._dead = true;
  monster.telegraph = null;
  floor.monsters = floor.monsters.filter(m => m !== monster);

  // Update Guild Bestiary Codex & Lifetime Records
  const codex = ensureCodexState(state);
  codex.totalMonstersSlain = (codex.totalMonstersSlain || 0) + 1;
  if (monster.isBoss) codex.totalBossesSlain = (codex.totalBossesSlain || 0) + 1;
  if (monster.isElite) codex.totalElitesSlain = (codex.totalElitesSlain || 0) + 1;
  const count = (codex.monsterKills[monster.id] || 0) + 1;
  codex.monsterKills[monster.id] = count;
  if (codex.killsByArchetype) codex.killsByArchetype[monster.id] = count;

  const h = state.hero;
  if (h) {
    grantHeroKnowledge(h, 'monster_knowledge', (monster.isBoss || monster.isElite) ? 0.5 : 0.25);
  }
  // Thief Shadow Dance MP restore on kill
  if (h.classId === 'thief' && ((h.talentsAllocated && h.talentsAllocated.t_b3) || 0) > 0) {
    h.mp = Math.min(h.maxMp, h.mp + 6);
  }

  // Record Guild Notice Board Bounty Progress (supports archetype bountyTag)
  const killTags = ['monster_any', monster.id];
  if (monster.bountyTag && killTags.indexOf(monster.bountyTag) === -1) {
    killTags.push(monster.bountyTag);
  }
  if (monster.isElite) killTags.push('elite');
  if (monster.isBoss) killTags.push('boss');
  recordBountyProgress('slay', killTags, 1, state);

  const rarityBonus = (state.dungeon && state.dungeon.config && state.dungeon.config.lootRarityBonus) || 0;

  if (monster.isBoss) {
    const isRelicBoss = monster.dropRarity === 'relic' || monster.id === 'boss_weaver' || monster.id === 'boss_ignis' || monster.id === 'boss_vespera';
    const bossRarity = monster.dropRarity || (isRelicBoss ? 'relic' : 'epic');
    const bossGear = generateProceduralEquipment(floor.depth, bossRarity, null, rarityBonus);
    if (monster.id === 'boss_vespera') {
      bossGear.maxSockets = 2;
    }
    h.expeditionGear.push(bossGear);
    recordRelicUnlock(bossGear, floor.depth, (state.dungeon && state.dungeon.name), state);

    if (monster.id === 'boss_vespera') {
      addExpeditionTradeItem('astralite', 'Void Astralite', 150, 3, 'Ore', state);
      addExpeditionTradeItem('gem_void_diamond', 'Void Diamond', 300, 1, 'Gem', state);
    } else if (monster.id === 'boss_ignis') {
      addExpeditionTradeItem('astralite', 'Void Astralite', 150, 2, 'Ore', state);
      addExpeditionTradeItem('gem_ruby', 'Crimson Ruby', 120, 1, 'Gem', state);
    } else {
      addExpeditionTradeItem('starcrystal', 'Star-Crystal', 90, 2, 'Ore', state);
    }

    const maxDepth = (state.dungeon && state.dungeon.config && state.dungeon.config.maxDepth) || 999;
    if (floor.depth >= maxDepth) {
      state.dungeon.isCleared = true;
    }

    // Spawn triumphant golden Astral Sanctum Gateway portal on boss defeat tile
    const bossPortal = createPortalInstance('portal_boss_extraction', monster.x, monster.y);
    addWorldObject(floor, bossPortal);

    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(monster.x, monster.y, '👑 BOSS VANQUISHED!', '#fbbf24');
      ui.log(`👑 Vanquished ${monster.name}! Looted ${bossGear.name} (${RARITY[bossRarity].name})!`, 'gold');
    }
  } else {
    const goldVal = 8 + floor.depth * 5 + (monster.isElite ? 18 : 0);
    addExpeditionTradeItem('monster_trophy', 'Abyssal Shard', goldVal, 1, 'Relic', state);
    if (monster.isElite || Math.random() < 0.25) {
      const dropGear = generateProceduralEquipment(
        floor.depth,
        monster.isElite ? 'rare' : null,
        null,
        rarityBonus
      );
      h.expeditionGear.push(dropGear);
      if (dropGear && dropGear.rarity === 'relic') {
        recordRelicUnlock(dropGear, floor.depth, (state.dungeon && state.dungeon.name), state);
      }
      if (state === gameState) {
        ui.log(`${monster.name} dropped ${dropGear.name}!`, 'good');
      }
    }
  }

  // Volatile Elite Affix: On-death detonation in 1-tile Chebyshev radius
  if (monster.affix && monster.affix.id === 'volatile') {
    if (state === gameState) {
      playSound('hit');
      ui.floatingText(monster.x, monster.y, '💥 VOLATILE BURST!', '#ef4444');
      ui.log(`💥 ${monster.name} detonated in a violent volatile burst!`, 'bad');
    }
    const blastDmg = Math.max(3, Math.round(monster.atk * 1.5) - Math.floor(h.def * 0.5));
    if (Math.abs(h.x - monster.x) <= 1 && Math.abs(h.y - monster.y) <= 1) {
      h.hp -= blastDmg;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, `-${blastDmg} BLAST!`, '#ef4444');
      }
    }
    const lethalBlastVictims = [];
    if (floor && Array.isArray(floor.monsters)) {
      const snapMons = floor.monsters.slice();
      for (let vi = 0; vi < snapMons.length; vi++) {
        const m2 = snapMons[vi];
        if (m2 && m2 !== monster && !m2._dead && m2.hp > 0 && Math.abs(m2.x - monster.x) <= 1 && Math.abs(m2.y - monster.y) <= 1) {
          const mDmg = Math.max(2, Math.round(monster.atk * 1.5) - (m2.def || 0));
          m2.hp -= mDmg;
          if (state === gameState) {
            ui.floatingText(m2.x, m2.y, `-${mDmg}`, '#ef4444');
          }
          if (m2.hp <= 0) {
            lethalBlastVictims.push(m2);
          }
        }
      }
    }
    for (let li = 0; li < lethalBlastVictims.length; li++) {
      killMonster(lethalBlastVictims[li], state);
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage(monster.name, state);
    }
  }

  if (state === gameState) {
    gainExperience(monster.xp, state);
  }

  emitEngineEvent(ENGINE_EVENTS.MONSTER_SLAIN, {
    monsterId: monster.id,
    monsterName: monster.name,
    isElite: !!monster.isElite,
    isBoss: !!monster.isBoss,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);
}

export function attackMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const isCrit = Math.random() * 100 < h.crit;
  const critMult = isCrit ? 1.65 : 1.0;
  const weakMult = (h.statuses || []).some(s => s.id === 'weakened') ? 0.80 : 1.0;
  const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
  const isGuarding = (monster.statuses || []).some(s => s.id === 'guarding');
  const guardDef = isGuarding ? Math.round((monster.def || 0) * 1.60) : (monster.def || 0);
  const effDef = Math.round(guardDef * (1 - Math.min(0.8, pierceRank * 0.30)));
  const masteryMult = getCodexMasteryMultiplier(monster.id, state);

  const dmg = Math.max(2, Math.round(h.atk * weakMult * critMult * masteryMult) - effDef);
  monster.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(monster.x, monster.y, `${isCrit ? 'CRIT! ' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#f87171');
    ui.log(`You strike ${monster.name} for ${dmg} damage${isCrit ? ' (CRITICAL!)' : ''}.`, isCrit ? 'gold' : 'info');
    if (typeof ui.combatAnim === 'function') {
      ui.combatAnim(monster.x, monster.y, isCrit ? 'crit_slash' : 'slash', isCrit ? '#fbbf24' : '#f87171');
    }
    if (typeof ui.heroLunge === 'function') {
      ui.heroLunge(Math.sign(monster.x - h.x), Math.sign(monster.y - h.y));
    }
  }

  // Hero Leech Affix: restores HP on hit
  if ((h.leech || 0) > 0) {
    const leechHeal = Math.min(h.maxHp - h.hp, Math.round(h.leech));
    if (leechHeal > 0) {
      h.hp += leechHeal;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, `+${leechHeal} LEECH`, '#34d399');
      }
    }
  }

  // Reflective Elite Affix: returns 25% thorns damage back to hero
  if (monster.affix && monster.affix.id === 'reflective') {
    const reflDmg = Math.max(1, Math.round(dmg * 0.25));
    h.hp -= reflDmg;
    if (state === gameState) {
      ui.floatingText(h.x, h.y, `-${reflDmg} REFLECT!`, '#ec4899');
      ui.log(`⚠ ${monster.name}'s reflective carapace returned ${reflDmg} thorns damage!`, 'bad');
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage(monster.name, state);
      return;
    }
  }

  // Temporal Warp Elite Affix: 40% chance on taking damage to phase-shift away if surviving
  if (monster.hp > 0 && monster.affix && monster.affix.id === 'temporal' && Math.random() < 0.40) {
    const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
    if (floor) {
      const candidates = [];
      const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
      const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = monster.x + dx;
          const ny = monster.y + dy;
          if (nx >= 0 && nx < fw && ny >= 0 && ny < fh) {
            const isWalkable = floor.tiles[ny][nx] === TILE_FLOOR;
            const isOccupied = (h.x === nx && h.y === ny) || (floor.monsters || []).some(m2 => m2 !== monster && m2.x === nx && m2.y === ny);
            if (isWalkable && !isOccupied) {
              candidates.push({ x: nx, y: ny });
            }
          }
        }
      }
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        monster.x = pick.x;
        monster.y = pick.y;
        if (state === gameState) {
          ui.floatingText(monster.x, monster.y, '✦ PHASE WARP!', '#a855f7');
          ui.log(`✦ ${monster.name} phase-shifted through the void to (${pick.x}, ${pick.y})!`, 'info');
        }
      }
    }
  }

  if (monster.hp <= 0) {
    killMonster(monster, state);
  }
}

export function checkHeroFatalDamage(killerName, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  if (h.godMode) {
    h.hp = h.maxHp;
    return;
  }
  // Paladin Divine Intervention Keystone
  if (h.classId === 'paladin' && ((h.talentsAllocated && h.talentsAllocated.p_e3) || 0) > 0 && !h.usedDivineIntervention) {
    h.usedDivineIntervention = true;
    h.hp = Math.round(h.maxHp * 0.40);
    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(h.x, h.y, 'DIVINE INTERVENTION!', '#fbbf24');
      ui.log('Divine Intervention prevented fatal damage and restored 40% Max HP!', 'gold');
      ui.updateUI();
    }
    return;
  }
  handleHeroDefeat(killerName, state);
}

export function monsterAttackHero(m, isRanged, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  if (h.godMode) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'IMMUNE!', '#fbbf24');
      ui.log(`${m.name}'s attack bounces off your invulnerable shield!`, 'info');
    }
    return;
  }
  if (Math.random() * 100 < h.dodge) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'DODGE!', '#34d399');
      ui.log(`You dodged ${m.name}'s attack!`, 'good');
    }
    return;
  }

  let raw = isRanged ? Math.round(m.atk * 0.85) : m.atk;
  if (h.classId === 'fighter') raw = Math.round(raw * 0.85);

  // Hero Astral Ward Affix (flat damage reduction)
  if ((h.ward || 0) > 0) {
    raw = Math.max(1, raw - h.ward);
  }

  const dmg = Math.max(1, raw - Math.floor(h.def * 0.6));
  const shieldRes = applyDamageWithShield(h, dmg);

  if (state === gameState) {
    playSound('hit');
    if (shieldRes.absorbed > 0 && shieldRes.hpLoss === 0) {
      ui.floatingText(h.x, h.y, `ABSORBED (${shieldRes.absorbed})`, '#818cf8');
      ui.log(`Your barrier absorbed all ${shieldRes.absorbed} damage from ${m.name}!`, 'good');
    } else if (shieldRes.absorbed > 0) {
      ui.floatingText(h.x, h.y, `-${shieldRes.hpLoss} (${shieldRes.absorbed} blk)`, '#f87171');
      ui.log(`${m.name} strikes for ${dmg} (${shieldRes.absorbed} absorbed by shield, -${shieldRes.hpLoss} HP)!`, 'bad');
    } else {
      ui.floatingText(h.x, h.y, `-${dmg}${isRanged ? ' 🏹' : ''}`, '#f87171');
      ui.log(`${m.name} strikes you for ${dmg} damage!`, 'bad');
    }
    if (typeof ui.combatAnim === 'function') {
      ui.combatAnim(h.x, h.y, isRanged ? 'projectile' : 'claw', '#f87171');
    }
  }

  // Archetype On-Hit Status + Elite Affix Effects
  if (m.onHitStatus && Math.random() < 0.45) {
    applyStatusEffect(h, m.onHitStatus, 3);
  }
  if (m.affix && m.affix.id === 'vampiric') {
    m.hp = Math.min(m.maxHp, m.hp + Math.round(dmg * 0.4));
  } else if (m.affix && m.affix.id === 'molten') {
    applyStatusEffect(h, 'burn', 3);
  } else if (m.affix && m.affix.id === 'venomous') {
    applyStatusEffect(h, 'poison', 3);
  } else if (m.affix && m.affix.id === 'chilling') {
    applyStatusEffect(h, 'chilled', 3);
    recomputeHeroDerivedStats(false, state);
    if (state === gameState) {
      ui.floatingText(h.x, h.y, '❄ CHILLED!', '#38bdf8');
      ui.log(`❄ ${m.name}'s freezing aura chilled you (-15% Dodge, +2 Skill MP)!`, 'bad');
    }
  }

  // Hero Retaliation / Thorns Affix (returns thorns damage on melee)
  if (!isRanged && (h.thorns || 0) > 0) {
    const thDmg = Math.round(h.thorns);
    m.hp -= thDmg;
    if (state === gameState) {
      ui.floatingText(m.x, m.y, `-${thDmg} THORNS`, '#ec4899');
      ui.log(`Your spiked gear reflected ${thDmg} thorns damage back at ${m.name}!`, 'info');
    }
    if (m.hp <= 0) {
      killMonster(m, state);
      return;
    }
  }

  // Fighter Titan Resurgence Counter-Attack
  if (!isRanged && h.classId === 'fighter' && ((h.talentsAllocated && h.talentsAllocated.f_a3) || 0) > 0 && Math.random() < 0.35) {
    const counterDmg = Math.max(2, Math.round(h.atk * 0.5));
    m.hp -= counterDmg;
    if (state === gameState) {
      ui.floatingText(m.x, m.y, `-${counterDmg} COUNTER!`, '#60a5fa');
    }
    if (m.hp <= 0) killMonster(m, state);
  }

  if (h.hp <= 0) {
    checkHeroFatalDamage(m.name, state);
  } else {
    triggerReactiveAbilities(h, 'on_hero_low_hp', state);
  }
}

function isMonsterWalkableTile(floor, tx, ty, h, fw, fh) {
  if (tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;
  const destTile = floor.tiles[ty][tx];
  const monsterWalkable = (
    destTile === TILE_FLOOR ||
    destTile === TILE_CHEST_OPEN ||
    destTile === TILE_SHRINE_USED ||
    destTile === TILE_TRAP_DISARMED
  );
  if (!monsterWalkable) return false;
  if (tx === h.x && ty === h.y) return false;
  const doorObj = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(function(o) { return o && o.x === tx && o.y === ty && o.objectType === 'door'; })
    : null;
  if (doorObj && !isDoorWalkable(doorObj)) return false;
  if (floor.monsters && floor.monsters.some(function(other) { return other && !other._dead && other.hp > 0 && other.x === tx && other.y === ty; })) {
    return false;
  }
  return true;
}

export function computeAbilityTargetTiles(ability, floor, m, tx, ty, fw, fh) {
  if (!ability || !floor || !floor.tiles) return [];
  const tiles = [];
  const isTileThreatenable = function(cx, cy) {
    if (cx < 0 || cx >= fw || cy < 0 || cy >= fh) return false;
    const t = floor.tiles[cy][cx];
    if (t === TILE_WALL || ORE_CATALOG[t]) return false;
    const doorObj = (floor.objects && floor.objects.length > 0)
      ? floor.objects.find(function(o) { return o && o.x === cx && o.y === cy && isDoorOpaque(o); })
      : null;
    return !doorObj;
  };

  if (ability.pattern === 'target_tile') {
    if (isTileThreatenable(tx, ty)) tiles.push({ x: tx, y: ty });
  } else if (ability.pattern === 'cross_1') {
    const pts = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < pts.length; i++) {
      const cx = tx + pts[i][0];
      const cy = ty + pts[i][1];
      if (isTileThreatenable(cx, cy)) tiles.push({ x: cx, y: cy });
    }
  } else if (ability.pattern === 'radius_1') {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = tx + dx;
        const cy = ty + dy;
        if (isTileThreatenable(cx, cy)) tiles.push({ x: cx, y: cy });
      }
    }
  } else if (ability.pattern === 'line_4') {
    const sdx = Math.sign(tx - m.x);
    const sdy = Math.sign(ty - m.y);
    if (sdx === 0 && sdy === 0) return [];
    for (let step = 1; step <= 4; step++) {
      const cx = m.x + sdx * step;
      const cy = m.y + sdy * step;
      if (!isTileThreatenable(cx, cy)) break;
      tiles.push({ x: cx, y: cy });
    }
  }
  return tiles;
}

function resolveTelegraphedAbility(m, floor, state) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const tg = m.telegraph;
  m.telegraph = null;
  if (!tg) return;
  const ability = getMonsterAbilityDefinition(tg.abilityId) || getMonsterAbilityDefinition(m);
  m.abilityCooldown = (ability && ability.cooldown) ? ability.cooldown : 4;

  const committedTiles = Array.isArray(tg.tiles) ? tg.tiles : [];
  const heroHit = Boolean(h && committedTiles.some(function(pt) { return pt.x === h.x && pt.y === h.y; }));

  if (!heroHit) {
    if (state === gameState) {
      ui.floatingText(m.x, m.y, (tg.name || 'ABILITY') + ' MISSED!', '#34d399');
      ui.log(`${m.name}'s ${tg.name || 'ability'} strikes empty stone — you avoided it!`, 'good');
    }
    return;
  }

  if (h.godMode) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'IMMUNE!', '#fbbf24');
      ui.log(`${m.name}'s ${tg.name || 'ability'} bounces off your invulnerable shield!`, 'info');
    }
    return;
  }

  const mult = (ability && ability.damageMult) ? ability.damageMult : 1.5;
  let raw = Math.round((m.atk || 8) * mult);
  if (h.classId === 'fighter') raw = Math.round(raw * 0.85);
  if ((h.ward || 0) > 0) raw = Math.max(1, raw - h.ward);
  const dmg = Math.max(2, raw - Math.floor((h.def || 0) * 0.6));
  h.hp -= dmg;

  if (ability && ability.statusId) {
    applyStatusEffect(h, ability.statusId, ability.statusDuration || 2);
  }
  if (ability && ability.secondaryStatusId) {
    applyStatusEffect(h, ability.secondaryStatusId, ability.secondaryStatusDuration || 2);
    if (ability.secondaryStatusId === 'chilled') {
      recomputeHeroDerivedStats(false, state);
    }
  }

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(h.x, h.y, `-${dmg} ${(tg.name || 'HIT').toUpperCase()}!`, (ability && ability.color) || '#ef4444');
    ui.log(`💥 ${m.name}'s ${tg.name || 'ability'} hits you for ${dmg} damage!`, 'bad');
    if (typeof ui.combatAnim === 'function') {
      ui.combatAnim(h.x, h.y, 'spell', (ability && ability.color) || '#ef4444');
    }
  }

  if (h.hp <= 0) {
    checkHeroFatalDamage(m.name, state);
  } else {
    triggerReactiveAbilities(h, 'on_hero_low_hp', state);
  }
}

function tryExecuteMonsterAbility(m, floor, h, dist, fw, fh, state) {
  const ui = getActionCallbacks();
  const ability = getMonsterAbilityDefinition(m);
  if (!ability) return false;
  if ((m.abilityCooldown || 0) > 0) return false;

  if (ability.kind === 'defensive') {
    const alreadyGuarding = (m.statuses || []).some(function(s) { return s.id === 'guarding'; });
    if (alreadyGuarding) return false;
    if (dist > (ability.maxRange || 3.5)) return false;
    if (m.hp >= m.maxHp && dist > 2.2) return false;
    applyStatusEffect(m, 'guarding', ability.duration || 2);
    m.abilityCooldown = ability.cooldown || 4;
    if (state === gameState) {
      ui.floatingText(m.x, m.y, '🛡 SHIELD BRACE!', '#60a5fa');
      ui.log(`🛡 ${m.name} raises its shield (${ability.name}: +60% DEF for ${ability.duration || 2} turns)!`, 'gold');
    }
    return true;
  }

  if (ability.kind === 'telegraphed_area') {
    const minR = ability.minRange || 1;
    const maxR = ability.maxRange || 3;
    if (dist < minR - 0.1 || dist > maxR + 0.2) return false;
    if (ability.requireLos && !hasLineOfSight(floor, m.x, m.y, h.x, h.y)) return false;
    const tiles = computeAbilityTargetTiles(ability, floor, m, h.x, h.y, fw, fh);
    if (tiles.length === 0) return false;
    m.telegraph = {
      abilityId: ability.id,
      name: ability.name,
      tiles: tiles,
      turnsLeft: ability.telegraphTurns || 1,
      color: ability.color || '#ef4444'
    };
    if (state === gameState) {
      ui.floatingText(m.x, m.y, `⚠ ${ability.name.toUpperCase()}!`, ability.color || '#f59e0b');
      ui.log(`⚠ ${m.name} winds up ${ability.name}! Step out of the warned tiles!`, 'gold');
    }
    return true;
  }

  return false;
}

function trySkirmisherRetreat(m, floor, h, fw, fh, state) {
  const ui = getActionCallbacks();
  const def = getMonsterDefinition(m);
  const beh = (m.behavior || (def && def.behavior)) || null;
  if (!beh || !beh.kiteWhenAdjacent) return false;
  if ((m.kiteCooldown || 0) > 0) return false;

  const curDist = Math.hypot(m.x - h.x, m.y - h.y);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let best = null;
  let bestDist = curDist;

  for (let i = 0; i < dirs.length; i++) {
    const nx = m.x + dirs[i][0];
    const ny = m.y + dirs[i][1];
    if (!isMonsterWalkableTile(floor, nx, ny, h, fw, fh)) continue;
    const d = Math.hypot(nx - h.x, ny - h.y);
    if (d > bestDist + 0.05) {
      bestDist = d;
      best = { x: nx, y: ny };
    }
  }

  if (!best) return false;
  m.x = best.x;
  m.y = best.y;
  m.kiteCooldown = beh.kiteCooldownTurns || 2;
  if (state === gameState) {
    ui.floatingText(m.x, m.y, '↩ RETREAT', '#60a5fa');
  }
  resolveHazardStepEffects(m, best.x, best.y, floor);
  if (m.hp <= 0) {
    killMonster(m, state);
  }
  return true;
}

export function processTurn(state = gameState) {
  const ui = getActionCallbacks();
  state.turn += 1;
  const h = state.hero;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  // Passive Class Turn Ticks
  if (h.classId === 'mage') {
    h.mp = Math.min(h.maxMp, h.mp + 2);
  }
  if (h.classId === 'paladin' && state.turn % 3 === 0) {
    h.hp = Math.min(h.maxHp, h.hp + 1);
  }
  if (h.classId === 'cleric' && state.turn % 2 === 0) {
    h.mp = Math.min(h.maxMp, h.mp + 1);
  }

  // Tick hero per-ability cooldowns
  tickActorAbilityCooldowns(h);

  // Capture pre-tick CC state so 1-turn Stun/Silence reliably interrupts delayed casts on this turn
  const heroStunnedBeforeTick = (h.statuses || []).some(function(s) { return s && s.id === 'stun'; });
  const heroSilencedBeforeTick = (h.statuses || []).some(function(s) { return s && s.id === 'silence'; });

  // Hero Status & Shrine Buff Ticks (normalizes legacy turns-only hazard statuses)
  if (h.statuses && h.statuses.length > 0) {
    let buffExpired = false;
    for (let i = h.statuses.length - 1; i >= 0; i--) {
      const st = h.statuses[i];
      if (typeof st.duration !== 'number' || isNaN(st.duration)) {
        st.duration = (typeof st.turns === 'number' && !isNaN(st.turns)) ? st.turns : 1;
        if (st.turns !== undefined) delete st.turns;
      }
      if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
        const dot = Math.max(2, Math.round(h.maxHp * 0.04));
        applyDamageWithShield(h, dot);
        if (state === gameState) {
          ui.floatingText(h.x, h.y, `-${dot} ${(st.name || st.id).toUpperCase()}`, st.color || '#f87171');
        }
      } else if (st.id === 'regen') {
        const healTick = Math.max(3, Math.round(h.maxHp * 0.06));
        h.hp = Math.min(h.maxHp, h.hp + healTick);
        if (state === gameState) {
          ui.floatingText(h.x, h.y, `+${healTick} REGEN`, '#4ade80');
        }
      }
      st.duration -= 1;
      if (st.duration <= 0) {
        if (st.isBuff || st.id === 'chilled' || st.id === 'slow' || st.id === 'silence') buffExpired = true;
        h.statuses.splice(i, 1);
      }
    }
    if (buffExpired) {
      recomputeHeroDerivedStats(false, state);
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage('Affliction', state);
      return;
    }
  }

  // Tick Persistent Ground Areas (e.g. Sanctuary)
  if (Array.isArray(floor.persistentAreas) && floor.persistentAreas.length > 0) {
    for (let aIdx = floor.persistentAreas.length - 1; aIdx >= 0; aIdx--) {
      const area = floor.persistentAreas[aIdx];
      if (!area) {
        floor.persistentAreas.splice(aIdx, 1);
        continue;
      }
      const inside = Array.isArray(area.tiles) && area.tiles.some(function(t) { return t.x === h.x && t.y === h.y; });
      if (inside && area.affectsHero) {
        const healAmt = Math.max(2, area.healPerTurn || 6);
        h.hp = Math.min(h.maxHp, h.hp + healAmt);
        if (area.grantStatus) {
          applyStatusEffect(h, area.grantStatus, 2, { sourceId: h.id, sourceAbilityId: area.sourceAbilityId || 'sanctuary' });
          recomputeHeroDerivedStats(false, state);
        }
        if (state === gameState) {
          ui.floatingText(h.x, h.y, `+${healAmt} ${area.name || 'ZONE'}`, area.color || '#fbbf24');
        }
      }
      area.turnsLeft = (typeof area.turnsLeft === 'number' ? area.turnsLeft : 1) - 1;
      if (area.turnsLeft <= 0) {
        floor.persistentAreas.splice(aIdx, 1);
      }
    }
  }

  // Resolve or Interrupt Delayed Hero Casts (e.g. Fireball)
  if (h.pendingCast) {
    const pDef = getAbilityDefinition(h.pendingCast.abilityId);
    const heroStunned = heroStunnedBeforeTick || (h.statuses || []).some(function(s) { return s && s.id === 'stun'; });
    const heroSilenced = pDef ? (isAbilitySilenced(h, pDef) || (heroSilencedBeforeTick && (pDef.domain === 'arcane' || pDef.domain === 'divine' || pDef.domain === 'nature'))) : false;
    if (!pDef || heroStunned || heroSilenced) {
      const reasonLabel = heroStunned ? 'Stun' : (heroSilenced ? 'Silence' : 'Disruption');
      const castName = pDef ? pDef.name : 'Cast';
      h.pendingCast = null;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'INTERRUPTED!', '#f87171');
        ui.log(`✦ Your ${castName} cast was interrupted by ${reasonLabel}!`, 'bad');
        if (typeof ui.combatAnim === 'function') {
          ui.combatAnim(h.x, h.y, 'interrupt', '#f87171');
        }
      }
    } else {
      h.pendingCast.turnsLeft = (typeof h.pendingCast.turnsLeft === 'number' ? h.pendingCast.turnsLeft : 1) - 1;
      if (h.pendingCast.turnsLeft <= 0) {
        const committed = h.pendingCast;
        h.pendingCast = null;
        resolveCommittedAbilityEffects(pDef, committed, floor, state);
      }
    }
  }

  const spottedTraps = detectNearbyTraps(floor, state);
  if (spottedTraps > 0 && isAutoWalking()) {
    cancelAutoWalk();
  }
  if (state === gameState) {
    fovCallback();
  }

  // Monsters AI Turn (pre-culled by Chebyshev distance for O(1) large-map turn speed,
  // while always resolving/clearing active telegraphs so none become stale)
  const monstersSnapshot = floor.monsters.slice();
  for (let mIdx = 0; mIdx < monstersSnapshot.length; mIdx++) {
    const m = monstersSnapshot[mIdx];
    if (!m || m._dead || m.hp <= 0) continue;

    // Monster Status Ticks
    if (m.statuses && m.statuses.length > 0) {
      let stunned = false;
      for (let i = m.statuses.length - 1; i >= 0; i--) {
        const st = m.statuses[i];
        if (typeof st.duration !== 'number' || isNaN(st.duration)) {
          st.duration = (typeof st.turns === 'number' && !isNaN(st.turns)) ? st.turns : 1;
          if (st.turns !== undefined) delete st.turns;
        }
        if (st.id === 'stun') stunned = true;
        if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
          const dot = Math.max(3, Math.round(m.maxHp * 0.06));
          m.hp -= dot;
          if (state === gameState) {
            ui.floatingText(m.x, m.y, `-${dot}`, st.color || '#f87171');
          }
        }
        st.duration -= 1;
        if (st.duration <= 0) {
          if (st.id === 'guarding' && state === gameState) {
            ui.log(`${m.name}'s Shield Brace wore off.`, 'info');
          }
          m.statuses.splice(i, 1);
        }
      }
      if (m.hp <= 0) {
        killMonster(m, state);
        continue;
      }
      if (stunned) {
        if (m.telegraph) {
          const interruptedName = m.telegraph.name || 'ability';
          const abDef = getMonsterAbilityDefinition(m.telegraph.abilityId) || getMonsterAbilityDefinition(m);
          m.telegraph = null;
          m.abilityCooldown = Math.max(2, Math.floor(((abDef && abDef.cooldown) || 4) / 2));
          if (state === gameState) {
            ui.floatingText(m.x, m.y, 'INTERRUPTED!', '#fbbf24');
            ui.log(`✦ ${m.name}'s ${interruptedName} was interrupted by Stun!`, 'gold');
          }
        } else if (state === gameState) {
          ui.floatingText(m.x, m.y, 'STUNNED', '#fbbf24');
        }
        continue;
      }
    }

    // Active Telegraph Resolution runs before distance culling so stale telegraphs never persist
    if (m.telegraph) {
      m.telegraph.turnsLeft = (typeof m.telegraph.turnsLeft === 'number' ? m.telegraph.turnsLeft : 1) - 1;
      if (m.telegraph.turnsLeft <= 0) {
        resolveTelegraphedAbility(m, floor, state);
        if (state.inGuild) return;
      }
      continue;
    }

    // Decrement cooldowns on active turns when not winding up
    if ((m.abilityCooldown || 0) > 0) m.abilityCooldown -= 1;
    if ((m.kiteCooldown || 0) > 0) m.kiteCooldown -= 1;

    // Fast bounding-box skip so distant monsters on 192x144 maps cost zero CPU
    if (Math.abs(m.x - h.x) > 8 || Math.abs(m.y - h.y) > 8) continue;

    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    if (dist <= 7.0) {
      // 1. Signature Ability Check (defensive or telegraphed)
      if (tryExecuteMonsterAbility(m, floor, h, dist, fw, fh, state)) {
        continue;
      }

      // 2. Adjacent Engagement (Skirmisher retreat if configured & space exists, else melee)
      if (dist <= 1.5) {
        if (trySkirmisherRetreat(m, floor, h, fw, fh, state)) {
          continue;
        }
        monsterAttackHero(m, false, state);
        if (state.inGuild) return;
      } else if (m.isRanged && dist <= (m.range || 3) + 0.3 && hasLineOfSight(floor, m.x, m.y, h.x, h.y)) {
        // 3. Ranged Attack
        monsterAttackHero(m, true, state);
        if (state.inGuild) return;
      } else if (hasLineOfSight(floor, m.x, m.y, h.x, h.y) || dist <= 4.2) {
        // 4. Baseline Pursuit (Slowed monsters skip movement on odd turns)
        const isSlowed = (m.statuses || []).some(function(s) { return s && s.id === 'slow'; });
        if (isSlowed && (state.turn % 2 === 1)) {
          if (state === gameState) {
            ui.floatingText(m.x, m.y, 'SLOWED', '#38bdf8');
          }
          continue;
        }
        const sx = Math.sign(h.x - m.x);
        const sy = Math.sign(h.y - m.y);
        const candidates = Math.abs(h.x - m.x) >= Math.abs(h.y - m.y)
          ? [[sx, 0], [0, sy]]
          : [[0, sy], [sx, 0]];
        for (let c = 0; c < candidates.length; c++) {
          const dx = candidates[c][0];
          const dy = candidates[c][1];
          if (dx === 0 && dy === 0) continue;
          const tx = m.x + dx;
          const ty = m.y + dy;
          if (isMonsterWalkableTile(floor, tx, ty, h, fw, fh)) {
            m.x = tx;
            m.y = ty;
            resolveHazardStepEffects(m, tx, ty, floor);
            if (m.hp <= 0) {
              killMonster(m, state);
            }
            break;
          }
        }
      }
    }
  }

  if (state === gameState) {
    saveGame();
    ui.updateUI();
  }
}

// Wire turn-end hook into actions.js (for Healing Tonic turn advance)
registerActionCallbacks({ onTurnEnd: () => processTurn(gameState) });

// ============================================================================
// MG-01A UNIFIED SPELL, PRAYER, TECHNIQUE & SKILL TARGETING AND EXECUTION
// ============================================================================

const MAX_REACTIVE_TRIGGER_DEPTH = 2;
let reactiveTriggerDepth = 0;

function isTileWalkableForAbility(floor, tx, ty, fw, fh) {
  if (!floor || !floor.tiles || tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;
  const t = floor.tiles[ty][tx];
  const walkable = (
    t === TILE_FLOOR ||
    t === TILE_STAIRS_UP ||
    t === TILE_STAIRS_DOWN ||
    t === TILE_CHEST_OPEN ||
    t === TILE_SHRINE_USED ||
    t === TILE_TRAP_DISARMED
  );
  if (!walkable) return false;
  if (floor.objects && floor.objects.length > 0) {
    const doorObj = floor.objects.find(function(o) { return o && o.x === tx && o.y === ty && o.objectType === 'door'; });
    if (doorObj && !isDoorWalkable(doorObj)) return false;
  }
  return true;
}

function isTileThreatenableForAbility(floor, tx, ty, fw, fh) {
  if (!floor || !floor.tiles || tx < 0 || tx >= fw || ty < 0 || ty >= fh) return false;
  const t = floor.tiles[ty][tx];
  if (t === TILE_WALL || ORE_CATALOG[t]) return false;
  if (floor.objects && floor.objects.length > 0) {
    const doorObj = floor.objects.find(function(o) { return o && o.x === tx && o.y === ty && isDoorOpaque(o); });
    if (doorObj) return false;
  }
  return true;
}

function findShadowstepLanding(floor, m, fw, fh) {
  const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (let i = 0; i < neighbors.length; i++) {
    const tx = m.x + neighbors[i][0];
    const ty = m.y + neighbors[i][1];
    if (!isTileWalkableForAbility(floor, tx, ty, fw, fh)) continue;
    const occupied = (floor.monsters || []).some(function(other) {
      return other && !other._dead && other.hp > 0 && other.x === tx && other.y === ty;
    });
    if (!occupied) {
      return { x: tx, y: ty };
    }
  }
  return null;
}

function buildPatternTiles(floor, originX, originY, centerX, centerY, targeting, fw, fh) {
  const tiles = [];
  const pattern = (targeting && targeting.pattern) || 'single';
  if (pattern === 'self') {
    tiles.push({ x: originX, y: originY });
    return tiles;
  }
  if (pattern === 'single') {
    if (isTileThreatenableForAbility(floor, centerX, centerY, fw, fh)) {
      tiles.push({ x: centerX, y: centerY });
    }
    return tiles;
  }
  if (pattern === 'radius') {
    const rad = Math.max(0, Math.floor((targeting && typeof targeting.radius === 'number') ? targeting.radius : 1));
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const cx = centerX + dx;
        const cy = centerY + dy;
        if (isTileThreatenableForAbility(floor, cx, cy, fw, fh)) {
          tiles.push({ x: cx, y: cy });
        }
      }
    }
    return tiles;
  }
  if (pattern === 'line') {
    const sdx = Math.sign(centerX - originX);
    const sdy = Math.sign(centerY - originY);
    if (sdx === 0 && sdy === 0) return tiles;
    const maxLen = Math.max(1, Math.floor((targeting && targeting.range) || 4));
    for (let step = 1; step <= maxLen; step++) {
      const cx = originX + sdx * step;
      const cy = originY + sdy * step;
      if (!isTileThreatenableForAbility(floor, cx, cy, fw, fh)) break;
      tiles.push({ x: cx, y: cy });
    }
    return tiles;
  }
  if (pattern === 'cone') {
    const sdx = Math.sign(centerX - originX);
    const sdy = Math.sign(centerY - originY);
    if (sdx === 0 && sdy === 0) return tiles;
    const maxLen = Math.max(1, Math.floor((targeting && targeting.range) || 3));
    for (let step = 1; step <= maxLen; step++) {
      const bx = originX + sdx * step;
      const by = originY + sdy * step;
      const spread = step - 1;
      for (let s = -spread; s <= spread; s++) {
        const cx = sdx !== 0 ? bx : bx + s;
        const cy = sdy !== 0 ? by : by + s;
        if (isTileThreatenableForAbility(floor, cx, cy, fw, fh)) {
          tiles.push({ x: cx, y: cy });
        }
      }
    }
    return tiles;
  }
  return tiles;
}

export function selectHeroActiveAbility(abilityId, state = gameState) {
  if (!state || !state.hero) return { ok: false, reason: 'no_hero' };
  const h = state.hero;
  normalizeActorAbilityState(h);
  const def = getAbilityDefinition(abilityId);
  if (!def || def.activation !== 'active') return { ok: false, reason: 'invalid_ability' };
  const activeIds = getGrantedAbilityIds(h, { activation: 'active' });
  if (activeIds.indexOf(abilityId) === -1) return { ok: false, reason: 'not_granted' };
  h.activeAbilityId = abilityId;
  return { ok: true, abilityId: abilityId };
}

export function cancelPendingAbilityCast(state = gameState) {
  if (!state || !state.hero || !state.hero.pendingCast) {
    return { ok: false, reason: 'no_pending_cast' };
  }
  const cancelled = state.hero.pendingCast;
  state.hero.pendingCast = null;
  if (state === gameState) {
    const ui = getActionCallbacks();
    ui.floatingText(state.hero.x, state.hero.y, 'CAST CANCELLED', '#94a3b8');
    ui.log('Cancelled pending spell cast.', 'info');
    ui.updateUI();
  }
  return { ok: true, cancelled: cancelled };
}

export function getHeroAbilityBarState(state = gameState) {
  if (!state || !state.hero) return [];
  const h = state.hero;
  normalizeActorAbilityState(h);
  const activeIds = getGrantedAbilityIds(h, { activation: 'active' });
  const list = [];
  for (let i = 0; i < activeIds.length; i++) {
    const id = activeIds[i];
    const def = getAbilityDefinition(id);
    if (!def) continue;
    const costInfo = getEffectiveAbilityCost(h, def);
    const cdRem = getAbilityCooldownRemaining(h, id);
    const silenced = isAbilitySilenced(h, def);
    const canAfford = (h.mp || 0) >= costInfo.mp;
    const ready = !silenced && cdRem <= 0 && canAfford && !h.pendingCast;
    const mode = (def.targeting && def.targeting.mode) || 'self';
    const requiresManualTarget = (mode === 'manual_enemy' || mode === 'manual_location' || mode === 'directional');
    list.push({
      id: id,
      name: def.name,
      icon: def.icon || '✦',
      kind: def.kind,
      domain: def.domain,
      timing: def.timing,
      desc: def.desc,
      effectiveMp: costInfo.mp,
      baseMp: costInfo.baseMp,
      chilledPenalty: costInfo.chilledPenalty,
      cooldown: costInfo.cooldown,
      cooldownRemaining: cdRem,
      silenced: silenced,
      canAfford: canAfford,
      ready: ready,
      isSelected: h.activeAbilityId === id,
      requiresManualTarget: requiresManualTarget,
      mode: mode,
      hotkey: i === 0 ? 'Q' : String(i + 1)
    });
  }
  return list;
}

export function getAbilityTargetingInfo(abilityId, state = gameState, targetOverride = null) {
  if (!state || state.inGuild || !state.hero) {
    return { valid: false, reason: 'not_in_dungeon', targets: [], targetCoords: [], targetTiles: [], canAfford: false, reachRadius: 0 };
  }
  const h = state.hero;
  normalizeActorAbilityState(h);
  const resolvedId = abilityId || h.activeAbilityId || (getGrantedAbilityIds(h, { activation: 'active' })[0] || null);
  const def = getAbilityDefinition(resolvedId);
  if (!def) {
    return { valid: false, reason: 'unknown_ability', targets: [], targetCoords: [], targetTiles: [], canAfford: false, reachRadius: 0 };
  }
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || !floor.monsters) {
    return { valid: false, reason: 'no_floor', targets: [], targetCoords: [], targetTiles: [], canAfford: false, reachRadius: 0 };
  }

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  const costInfo = getEffectiveAbilityCost(h, def);
  const cdRem = getAbilityCooldownRemaining(h, def.id);
  const silenced = isAbilitySilenced(h, def);
  const canAfford = (h.mp || 0) >= costInfo.mp && cdRem <= 0 && !silenced && !h.pendingCast;

  const tgt = def.targeting || { mode: 'self', pattern: 'self', range: 0, radius: 0, requireLos: false, filter: 'self', maxTargets: 1 };
  const reachRadius = typeof tgt.range === 'number' ? tgt.range : 1.5;
  let maxTargets = tgt.maxTargets || 1;
  if (def.id === 'starfall_volley' && ((h.talentsAllocated && h.talentsAllocated.r_d3) || 0) > 0) {
    maxTargets = 5;
  }

  const livingMonsters = floor.monsters.filter(function(m) { return m && !m._dead && m.hp > 0; });
  let targets = [];
  let targetTiles = [];
  let destTile = null;
  let validTarget = false;
  const requiresManualTarget = (tgt.mode === 'manual_enemy' || tgt.mode === 'manual_location' || tgt.mode === 'directional');

  if (tgt.mode === 'self') {
    validTarget = true;
    targetTiles = [{ x: h.x, y: h.y }];
  } else if (tgt.mode === 'auto_area') {
    const inRange = livingMonsters
      .filter(function(m) {
        const d = Math.hypot(m.x - h.x, m.y - h.y);
        if (d > reachRadius) return false;
        if (tgt.requireLos && !hasLineOfSight(floor, h.x, h.y, m.x, m.y)) return false;
        return true;
      })
      .sort(function(a, b) {
        return Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y);
      })
      .slice(0, maxTargets);
    targets = inRange;
    targetTiles = inRange.map(function(m) { return { x: m.x, y: m.y }; });
    validTarget = targets.length > 0;
  } else if (tgt.mode === 'auto_enemy') {
    const candidates = livingMonsters
      .filter(function(m) {
        const d = Math.hypot(m.x - h.x, m.y - h.y);
        if (d > reachRadius) return false;
        if (tgt.requireLos && !hasLineOfSight(floor, h.x, h.y, m.x, m.y)) return false;
        return true;
      })
      .sort(function(a, b) {
        return Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y);
      });
    if (tgt.requireAdjacentLanding) {
      for (let i = 0; i < candidates.length; i++) {
        const landing = findShadowstepLanding(floor, candidates[i], fw, fh);
        if (landing) {
          targets = [candidates[i]];
          destTile = landing;
          targetTiles = [{ x: candidates[i].x, y: candidates[i].y }];
          validTarget = true;
          break;
        }
      }
    } else if (candidates.length > 0) {
      targets = [candidates[0]];
      targetTiles = [{ x: candidates[0].x, y: candidates[0].y }];
      validTarget = true;
    }
  } else if (tgt.mode === 'manual_enemy') {
    let chosen = null;
    if (targetOverride && typeof targetOverride.targetX === 'number' && typeof targetOverride.targetY === 'number') {
      chosen = livingMonsters.find(function(m) {
        if (m.x !== targetOverride.targetX || m.y !== targetOverride.targetY) return false;
        const d = Math.hypot(m.x - h.x, m.y - h.y);
        if (d > reachRadius) return false;
        if (tgt.requireLos && !hasLineOfSight(floor, h.x, h.y, m.x, m.y)) return false;
        return true;
      }) || null;
    } else {
      // Auto-preview nearest legal enemy if no manual cursor override provided
      const candidates = livingMonsters
        .filter(function(m) {
          const d = Math.hypot(m.x - h.x, m.y - h.y);
          if (d > reachRadius) return false;
          if (tgt.requireLos && !hasLineOfSight(floor, h.x, h.y, m.x, m.y)) return false;
          return true;
        })
        .sort(function(a, b) {
          return Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y);
        });
      chosen = candidates[0] || null;
    }
    if (chosen) {
      targets = [chosen];
      targetTiles = [{ x: chosen.x, y: chosen.y }];
      validTarget = true;
    }
  } else if (tgt.mode === 'manual_location') {
    const cx = (targetOverride && typeof targetOverride.targetX === 'number') ? targetOverride.targetX : h.x;
    const cy = (targetOverride && typeof targetOverride.targetY === 'number') ? targetOverride.targetY : h.y;
    const d = Math.hypot(cx - h.x, cy - h.y);
    const inRange = d <= reachRadius + 0.05;
    const losOk = !tgt.requireLos || hasLineOfSight(floor, h.x, h.y, cx, cy);
    const walkableOk = !tgt.requireWalkable || (
      isTileWalkableForAbility(floor, cx, cy, fw, fh) &&
      !(cx === h.x && cy === h.y) &&
      !livingMonsters.some(function(m) { return m.x === cx && m.y === cy; })
    );
    if (inRange && losOk && walkableOk && isTileThreatenableForAbility(floor, cx, cy, fw, fh)) {
      targetTiles = buildPatternTiles(floor, h.x, h.y, cx, cy, tgt, fw, fh);
      if (tgt.requireWalkable) {
        destTile = { x: cx, y: cy };
      }
      if (tgt.filter === 'enemy') {
        targets = livingMonsters.filter(function(m) {
          return targetTiles.some(function(pt) { return pt.x === m.x && pt.y === m.y; });
        });
      }
      validTarget = targetTiles.length > 0;
    }
  } else if (tgt.mode === 'directional') {
    let tx = (targetOverride && typeof targetOverride.targetX === 'number') ? targetOverride.targetX : null;
    let ty = (targetOverride && typeof targetOverride.targetY === 'number') ? targetOverride.targetY : null;
    if (tx === null || ty === null) {
      if (targetOverride && (targetOverride.dirX || targetOverride.dirY)) {
        tx = h.x + Math.sign(targetOverride.dirX || 0);
        ty = h.y + Math.sign(targetOverride.dirY || 0);
      } else {
        const nearest = livingMonsters
          .filter(function(m) { return Math.hypot(m.x - h.x, m.y - h.y) <= reachRadius + 1; })
          .sort(function(a, b) { return Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y); })[0];
        if (nearest) {
          tx = nearest.x;
          ty = nearest.y;
        }
      }
    }
    if (tx !== null && ty !== null && !(tx === h.x && ty === h.y)) {
      targetTiles = buildPatternTiles(floor, h.x, h.y, tx, ty, tgt, fw, fh);
      targets = livingMonsters.filter(function(m) {
        return targetTiles.some(function(pt) { return pt.x === m.x && pt.y === m.y; });
      });
      validTarget = targetTiles.length > 0;
    }
  }

  const targetCoords = targets.map(function(m) { return { x: m.x, y: m.y }; });
  return {
    valid: validTarget && canAfford,
    hasTargets: validTarget,
    canAfford: canAfford,
    classId: h.classId,
    abilityId: def.id,
    abilityDef: def,
    skillName: def.name,
    skillCost: costInfo.baseMp,
    effectiveCost: costInfo.mp,
    cooldownRemaining: cdRem,
    silenced: silenced,
    requiresManualTarget: requiresManualTarget,
    mode: tgt.mode,
    pattern: tgt.pattern,
    reachRadius: reachRadius,
    targets: targets,
    targetCoords: targetCoords,
    targetTiles: targetTiles,
    destTile: destTile
  };
}

export function getSkillTargetingInfo(state = gameState) {
  return getAbilityTargetingInfo(null, state, null);
}

function resolveCommittedAbilityEffects(abilityDef, commitCtx, floor, state) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const tiles = Array.isArray(commitCtx.tiles) ? commitCtx.tiles : [];
  const livingMonsters = (floor.monsters || []).filter(function(m) { return m && !m._dead && m.hp > 0; });

  // Resolve target monsters at resolution time (important for delayed casts like Fireball!)
  let affectedMonsters = [];
  if (Array.isArray(commitCtx.explicitTargets) && commitCtx.explicitTargets.length > 0) {
    affectedMonsters = commitCtx.explicitTargets.filter(function(m) { return m && !m._dead && m.hp > 0; });
  } else if (tiles.length > 0 && abilityDef.targeting && abilityDef.targeting.filter === 'enemy') {
    affectedMonsters = livingMonsters.filter(function(m) {
      return tiles.some(function(pt) { return pt.x === m.x && pt.y === m.y; });
    });
  }

  const summary = {
    totalDmg: 0,
    hits: 0,
    kills: 0,
    healAmt: 0,
    shieldAmt: 0,
    cleansedCount: 0,
    revealedCount: 0,
    movedTo: null,
    knockbackCollided: false
  };

  if (state === gameState) {
    playSound('spell');
    if (abilityDef.vfx && typeof ui.combatAnim === 'function') {
      const animX = (typeof commitCtx.targetX === 'number') ? commitCtx.targetX : h.x;
      const animY = (typeof commitCtx.targetY === 'number') ? commitCtx.targetY : h.y;
      ui.combatAnim(animX, animY, abilityDef.vfx.type || 'spell', abilityDef.vfx.color || '#60a5fa');
    }
  }

  const effects = Array.isArray(abilityDef.effects) ? abilityDef.effects : [];
  for (let eIdx = 0; eIdx < effects.length; eIdx++) {
    const eff = effects[eIdx];
    if (!eff) continue;

    if (eff.type === 'shadowstep' && commitCtx.destTile) {
      h.x = commitCtx.destTile.x;
      h.y = commitCtx.destTile.y;
      summary.movedTo = { x: h.x, y: h.y };
      if (state === gameState && typeof ui.combatAnim === 'function') {
        ui.combatAnim(h.x, h.y, 'teleport', '#a855f7');
      }
    } else if (eff.type === 'teleport' && commitCtx.destTile) {
      h.x = commitCtx.destTile.x;
      h.y = commitCtx.destTile.y;
      summary.movedTo = { x: h.x, y: h.y };
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'BLINK!', '#c084fc');
        ui.log(`You blink to (${h.x}, ${h.y})!`, 'info');
        if (typeof ui.combatAnim === 'function') {
          ui.combatAnim(h.x, h.y, 'teleport', '#c084fc');
        }
      }
    } else if (eff.type === 'damage') {
      const ampRank = (abilityDef.id === 'starfall_nova' && h.talentsAllocated && h.talentsAllocated.m_c2) || 0;
      const hasEcho = abilityDef.id === 'starfall_nova' && ((h.talentsAllocated && h.talentsAllocated.m_c3) || 0) > 0;
      const talentMult = 1 + ampRank * 0.15;

      for (let mIdx = 0; mIdx < affectedMonsters.length; mIdx++) {
        const m = affectedMonsters[mIdx];
        if (!m || m._dead || m.hp <= 0) continue;
        const masteryMult = getCodexMasteryMultiplier(m.id, state);
        const dmgRes = computeAbilityDamage(h, eff, m, masteryMult * talentMult);
        let dmg = dmgRes.damage;
        if (hasEcho) dmg += Math.round(dmg * 0.5);
        m.hp -= dmg;
        summary.totalDmg += dmg;
        summary.hits += 1;

        if (state === gameState) {
          const guardTag = dmgRes.guarded ? ' (GUARD)' : '';
          ui.floatingText(m.x, m.y, `-${dmg}${guardTag}`, (abilityDef.vfx && abilityDef.vfx.color) || '#fbbf24');
          if (typeof ui.combatAnim === 'function') {
            ui.combatAnim(m.x, m.y, abilityDef.vfx ? abilityDef.vfx.type : 'slash', (abilityDef.vfx && abilityDef.vfx.color) || '#fbbf24');
          }
        }
        if (m.hp <= 0 && !m._dead) {
          killMonster(m, state);
          summary.kills += 1;
        }
      }
    } else if (eff.type === 'status') {
      const stOpts = { sourceId: h.id || 'hero', sourceAbilityId: abilityDef.id };
      if (eff.targetSelf) {
        applyStatusEffect(h, eff.statusId, eff.duration || 2, stOpts);
        recomputeHeroDerivedStats(false, state);
        if (state === gameState) {
          ui.floatingText(h.x, h.y, eff.statusId.toUpperCase(), (abilityDef.vfx && abilityDef.vfx.color) || '#60a5fa');
        }
      } else {
        for (let mIdx = 0; mIdx < affectedMonsters.length; mIdx++) {
          const m = affectedMonsters[mIdx];
          if (!m || m._dead || m.hp <= 0) continue;
          applyStatusEffect(m, eff.statusId, eff.duration || 2, stOpts);
          if (state === gameState) {
            ui.floatingText(m.x, m.y, eff.statusId.toUpperCase(), '#fbbf24');
          }
        }
      }
    } else if (eff.type === 'heal') {
      const healAmt = computeAbilityHealAmount(h, eff);
      h.hp = Math.min(h.maxHp, h.hp + healAmt);
      summary.healAmt += healAmt;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, `+${healAmt} HP`, '#34d399');
      }
    } else if (eff.type === 'shield') {
      const shieldAmt = computeAbilityShieldAmount(h, eff);
      h.absorbShield = Math.max(h.absorbShield || 0, shieldAmt);
      summary.shieldAmt = h.absorbShield;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, `+${shieldAmt} SHIELD`, (abilityDef.vfx && abilityDef.vfx.color) || '#818cf8');
        if (typeof ui.combatAnim === 'function') {
          ui.combatAnim(h.x, h.y, 'shield', (abilityDef.vfx && abilityDef.vfx.color) || '#818cf8');
        }
      }
    } else if (eff.type === 'cleanse') {
      const maxRem = eff.maxRemoved || 3;
      let removed = 0;
      if (Array.isArray(h.statuses)) {
        for (let i = h.statuses.length - 1; i >= 0 && removed < maxRem; i--) {
          const st = h.statuses[i];
          if (st && CLEANSEABLE_STATUS_IDS.indexOf(st.id) !== -1) {
            h.statuses.splice(i, 1);
            removed += 1;
          }
        }
      }
      summary.cleansedCount += removed;
      if (removed > 0) {
        recomputeHeroDerivedStats(false, state);
      }
      if (state === gameState) {
        ui.floatingText(h.x, h.y, removed > 0 ? `CLEANSED (${removed})` : 'PURIFIED', '#fef08a');
        ui.log(removed > 0 ? `Purification cleansed ${removed} negative effect(s)!` : 'Purification washes over you.', 'good');
      }
    } else if (eff.type === 'knockback') {
      const dist = eff.distance || 1;
      for (let mIdx = 0; mIdx < affectedMonsters.length; mIdx++) {
        const m = affectedMonsters[mIdx];
        if (!m || m._dead || m.hp <= 0) continue;
        const dx = Math.sign(m.x - h.x);
        const dy = Math.sign(m.y - h.y);
        if (dx === 0 && dy === 0) continue;
        let collided = false;
        for (let step = 0; step < dist; step++) {
          const nx = m.x + dx;
          const ny = m.y + dy;
          if (isMonsterWalkableTile(floor, nx, ny, h, fw, fh)) {
            m.x = nx;
            m.y = ny;
          } else {
            collided = true;
            break;
          }
        }
        if (collided) {
          summary.knockbackCollided = true;
          if (eff.collideBonusDmg > 0) {
            m.hp -= eff.collideBonusDmg;
          }
          if (eff.collideStunTurns > 0) {
            applyStatusEffect(m, 'stun', eff.collideStunTurns, { sourceId: h.id || 'hero', sourceAbilityId: abilityDef.id });
          }
          if (state === gameState) {
            ui.floatingText(m.x, m.y, 'WALL SLAM! STUN', '#fbbf24');
            ui.log(`${m.name} slammed into an obstacle and is stunned!`, 'gold');
          }
          if (m.hp <= 0 && !m._dead) {
            killMonster(m, state);
            summary.kills += 1;
          }
        } else if (state === gameState) {
          ui.floatingText(m.x, m.y, 'KNOCKBACK!', '#f59e0b');
        }
      }
    } else if (eff.type === 'detect') {
      const rad = eff.radius || 6;
      let revealed = 0;
      if (eff.revealTraps && floor.tiles) {
        for (let ty = Math.max(0, h.y - rad); ty <= Math.min(fh - 1, h.y + rad); ty++) {
          for (let tx = Math.max(0, h.x - rad); tx <= Math.min(fw - 1, h.x + rad); tx++) {
            if (Math.hypot(tx - h.x, ty - h.y) <= rad && floor.tiles[ty][tx] === TILE_TRAP_HIDDEN) {
              floor.tiles[ty][tx] = TILE_TRAP_VISIBLE;
              revealed += 1;
            }
          }
        }
      }
      if (eff.revealSecretDoors && Array.isArray(floor.objects)) {
        for (let oIdx = 0; oIdx < floor.objects.length; oIdx++) {
          const obj = floor.objects[oIdx];
          if (!obj || Math.hypot(obj.x - h.x, obj.y - h.y) > rad) continue;
          if (obj.runtimeState && obj.runtimeState.discovered === false) {
            obj.runtimeState.discovered = true;
            revealed += 1;
          }
        }
      }
      summary.revealedCount += revealed;
      if (state === gameState) {
        ui.floatingText(h.x, h.y, revealed > 0 ? `REVEALED (${revealed})` : 'SENSE CLEAR', '#34d399');
        ui.log(revealed > 0 ? `Detect Magic revealed ${revealed} concealed trap(s) or secret(s)!` : 'Detect Magic senses no hidden traps or secrets nearby.', 'info');
      }
    } else if (eff.type === 'persistent_area') {
      if (!Array.isArray(floor.persistentAreas)) floor.persistentAreas = [];
      const healPerTurn = Math.max(4, Math.round((eff.healPerTurnBase || 6) + (h.magicPower || 0) * (eff.healMagicMult || 0.35)));
      floor.persistentAreas.push({
        id: (eff.areaId || 'zone') + '_' + (state.turn || 0) + '_' + floor.persistentAreas.length,
        name: eff.name || abilityDef.name,
        sourceAbilityId: abilityDef.id,
        centerX: commitCtx.targetX,
        centerY: commitCtx.targetY,
        tiles: tiles.slice(),
        turnsLeft: eff.duration || 3,
        color: eff.color || '#fbbf24',
        healPerTurn: healPerTurn,
        grantStatus: eff.grantStatus || null,
        affectsHero: eff.affectsHero !== false,
        affectsMonsters: Boolean(eff.affectsMonsters)
      });
      if (state === gameState) {
        ui.floatingText(commitCtx.targetX, commitCtx.targetY, eff.name || 'SANCTUARY', eff.color || '#fbbf24');
        ui.log(`${abilityDef.name} consecrates the ground for ${eff.duration || 3} turns!`, 'gold');
      }
    }
  }

  // Legacy Starfall Nova Burn side effect preservation
  if (abilityDef.id === 'starfall_nova') {
    for (let i = 0; i < affectedMonsters.length; i++) {
      const m = affectedMonsters[i];
      if (m && !m._dead && m.hp > 0) {
        applyStatusEffect(m, 'burn', 3, { sourceId: h.id || 'hero', sourceAbilityId: 'starfall_nova' });
      }
    }
  }
  // Legacy Torch Flare Stun side effect preservation
  if (abilityDef.id === 'torch_flare') {
    for (let i = 0; i < affectedMonsters.length; i++) {
      const m = affectedMonsters[i];
      if (m && !m._dead && m.hp > 0) {
        m.stunned = Math.max(m.stunned || 0, 1);
        applyStatusEffect(m, 'stun', 1, { sourceId: h.id || 'hero', sourceAbilityId: 'torch_flare' });
      }
    }
  }

  if (state === gameState && summary.hits > 0) {
    ui.log(`${abilityDef.name} hit ${summary.hits} foe(s) for ${summary.totalDmg} total damage!`, 'gold');
  }

  return summary;
}

export function triggerReactiveAbilities(actor, eventName, state = gameState) {
  if (!actor || !eventName || !state || state.inGuild) return [];
  if (reactiveTriggerDepth >= MAX_REACTIVE_TRIGGER_DEPTH) return [];
  normalizeActorAbilityState(actor);
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return [];

  const reactiveIds = getGrantedAbilityIds(actor, { activation: 'reactive' });
  const triggered = [];
  reactiveTriggerDepth += 1;
  try {
    for (let i = 0; i < reactiveIds.length; i++) {
      const def = getAbilityDefinition(reactiveIds[i]);
      if (!def || def.triggerEvent !== eventName) continue;
      if (eventName === 'on_hero_low_hp') {
        const thresh = def.triggerThresholdPct || 0.35;
        if ((actor.hp || 0) <= 0 || (actor.hp / Math.max(1, actor.maxHp || 100)) > thresh) continue;
      }
      const val = validateAbilityActivation(actor, def, { context: 'tactical_dungeon', allowTriggered: true, allowWhileCasting: true });
      if (!val.ok) continue;
      if (val.effectiveCost > 0) actor.mp -= val.effectiveCost;
      if (val.cooldown > 0) setAbilityCooldown(actor, def.id, val.cooldown);
      const summary = resolveCommittedAbilityEffects(def, {
        targetX: actor.x,
        targetY: actor.y,
        tiles: [{ x: actor.x, y: actor.y }],
        explicitTargets: []
      }, floor, state);
      if (state === gameState) {
        const ui = getActionCallbacks();
        ui.floatingText(actor.x, actor.y, `${def.name.toUpperCase()}!`, '#34d399');
        ui.log(`✦ Reactive ${def.name} triggered!`, 'good');
      }
      triggered.push({ abilityId: def.id, summary: summary });
    }
  } finally {
    reactiveTriggerDepth -= 1;
  }
  return triggered;
}

export function executeAbility(abilityId, targetOpts = null, state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild || !state.hero) return { ok: false, reason: 'in_guild' };
  const h = state.hero;
  normalizeActorAbilityState(h);
  const resolvedId = abilityId || h.activeAbilityId || (getGrantedAbilityIds(h, { activation: 'active' })[0] || null);
  const def = getAbilityDefinition(resolvedId);
  if (!def) return { ok: false, reason: 'unknown_ability' };

  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  // 1. Validate access, silence, cooldown, pendingCast, and MP BEFORE spending anything
  const val = validateAbilityActivation(h, def, { context: 'tactical_dungeon' });
  if (!val.ok) {
    if (state === gameState) {
      if (val.reason === 'no_mp') {
        ui.floatingText(h.x, h.y, 'Low MP!', '#60a5fa');
        const chillNote = val.chilledPenalty > 0 ? ' (Chilled: +2 MP)' : '';
        ui.log(`Not enough MP for ${def.name} (${val.effectiveCost} MP required${chillNote}).`, 'bad');
      } else if (val.reason === 'on_cooldown') {
        ui.floatingText(h.x, h.y, `CD: ${val.cooldownRemaining}t`, '#94a3b8');
        ui.log(`${def.name} is on cooldown (${val.cooldownRemaining} turn(s) remaining).`, 'bad');
      } else if (val.reason === 'silenced') {
        ui.floatingText(h.x, h.y, 'SILENCED!', '#e879f9');
        ui.log(`You are Silenced and cannot cast ${def.name}!`, 'bad');
      } else if (val.reason === 'already_casting') {
        ui.floatingText(h.x, h.y, 'CASTING...', '#fbbf24');
      }
    }
    return { ok: false, reason: val.reason, cooldownRemaining: val.cooldownRemaining || 0 };
  }

  // 2. Validate targeting BEFORE spending resources
  const info = getAbilityTargetingInfo(def.id, state, targetOpts);
  if (!info.hasTargets) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'No Valid Target!', '#fbbf24');
      ui.log(`${def.name} has no valid target in range.`, 'bad');
    }
    const noTargetReason = (def.id === 'shadowstep_strike') ? 'no_valid_shadowstep' : 'no_target';
    return { ok: false, reason: noTargetReason };
  }

  // 3. Commit resources (MP + cooldown)
  if (val.effectiveCost > 0) {
    h.mp -= val.effectiveCost;
  }
  if (val.cooldown > 0) {
    setAbilityCooldown(h, def.id, val.cooldown);
  }

  const targetX = (targetOpts && typeof targetOpts.targetX === 'number')
    ? targetOpts.targetX
    : (info.destTile ? info.destTile.x : (info.targets[0] ? info.targets[0].x : h.x));
  const targetY = (targetOpts && typeof targetOpts.targetY === 'number')
    ? targetOpts.targetY
    : (info.destTile ? info.destTile.y : (info.targets[0] ? info.targets[0].y : h.y));

  // 4. Delayed cast windup OR immediate resolution
  if (def.timing === 'delayed' && (def.windupTurns || 1) > 0) {
    h.pendingCast = {
      abilityId: def.id,
      name: def.name,
      targetX: targetX,
      targetY: targetY,
      tiles: info.targetTiles.slice(),
      turnsLeft: def.windupTurns || 1,
      color: (def.vfx && def.vfx.color) || '#fb923c'
    };
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, `CASTING ${def.name.toUpperCase()}...`, '#fbbf24');
      ui.log(`You begin channeling ${def.name} at (${targetX}, ${targetY}) — resolves next turn!`, 'gold');
      if (typeof ui.combatAnim === 'function') {
        ui.combatAnim(h.x, h.y, 'cast_ring', h.pendingCast.color);
      }
      processTurn(state);
    }
    return { ok: true, delayed: true, skill: def.id, abilityId: def.id, pendingCast: h.pendingCast };
  }

  const summary = resolveCommittedAbilityEffects(def, {
    targetX: targetX,
    targetY: targetY,
    tiles: info.targetTiles,
    explicitTargets: info.targets,
    destTile: info.destTile
  }, floor, state);

  if (state === gameState) {
    processTurn(state);
  }

  return {
    ok: true,
    skill: def.id,
    abilityId: def.id,
    dmg: summary.totalDmg,
    hits: summary.hits,
    kills: summary.kills,
    healAmt: summary.healAmt,
    shieldAmt: summary.shieldAmt,
    cleansedCount: summary.cleansedCount,
    revealedCount: summary.revealedCount,
    destTile: info.destTile,
    movedTo: summary.movedTo,
    knockbackCollided: summary.knockbackCollided
  };
}

export function executeClassSkill(state = gameState) {
  return executeAbility(null, null, state);
}

export function handlePlayerAction(dx, dy, state = gameState) {
  const ui = getActionCallbacks();
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  const nx = state.hero.x + dx;
  const ny = state.hero.y + dy;
  if (nx < 0 || nx >= fw || ny < 0 || ny >= fh) return;

  // 1. Monster Melee Bump Attack
  const targetMonster = floor.monsters.find(m => m.x === nx && m.y === ny);
  if (targetMonster) {
    attackMonster(targetMonster, state);
    processTurn(state);
    return;
  }

  // 2. Ore Vein Mining
  const targetTile = floor.tiles[ny][nx];
  if (ORE_CATALOG[targetTile]) {
    mineTile(nx, ny, state);
    processTurn(state);
    return;
  }

  // 3. Gilded Chest Opening
  if (targetTile === TILE_CHEST) {
    floor.tiles[ny][nx] = TILE_CHEST_OPEN;
    const codex = ensureCodexState(state);
    codex.totalChestsOpened = (codex.totalChestsOpened || 0) + 1;
    const depth = state.dungeon.currentFloor;
    const cfg = state.dungeon.config || {};
    const effDepth = depth + (cfg.baseDangerDepth || 0);
    const goldVal = Math.round((22 + effDepth * 12) * (state.hero.classId === 'thief' ? 1.25 : 1.0));
    addExpeditionTradeItem('star_relic', 'Star-etched Relic', goldVal, 1, 'Relic', state);
    recordBountyProgress('open_chest', ['chest'], 1, state);

    const rarityBonus = cfg.lootRarityBonus || 0;
    const forcedRarity = effDepth >= 4 ? 'rare' : 'uncommon';
    const chestGear = generateProceduralEquipment(effDepth, forcedRarity, cfg.lootSlotBias || null, rarityBonus);
    state.hero.expeditionGear.push(chestGear);
    if (chestGear && chestGear.rarity === 'relic') {
      recordRelicUnlock(chestGear, depth, (state.dungeon && state.dungeon.name), state);
    }

    emitEngineEvent(ENGINE_EVENTS.CHEST_OPENED, {
      goldVal,
      gear: chestGear,
      floorDepth: depth,
      dungeonId: state.activeDungeonId
    }, state);

    if (state === gameState) {
      playSound('gold');
      ui.floatingText(nx, ny, `+${goldVal}g & ${chestGear.name}!`, RARITY[chestGear.rarity].color);
      ui.log(`Opened Gilded Chest! Found Star-etched Relic (${goldVal}g) & ${chestGear.name}!`, 'gold');
      gainExperience(18 + effDepth * 6, state);
    }
    processTurn(state);
    return;
  }

  // 4. Astral Shrine Activation
  if (targetTile === TILE_SHRINE) {
    activateAstralShrine(nx, ny, state);
    processTurn(state);
    return;
  }

  // 5. Runic Trap Interaction (Disarm for Scout on Spotted Trap, else Trigger)
  if (targetTile === TILE_TRAP_HIDDEN || targetTile === TILE_TRAP_VISIBLE) {
    const trapRes = resolveTrapInteraction(nx, ny, state);
    if (trapRes.fatal) {
      checkHeroFatalDamage(trapRes.killerName, state);
      return;
    }
    processTurn(state);
    return;
  }

  // 6. Door Collision & Interaction (Auto-open, Key Unlock, Destructible, Secret)
  const doorAtTarget = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(o => o.x === nx && o.y === ny && o.objectType === 'door')
    : null;

  if (doorAtTarget) {
    const rState = doorAtTarget.runtimeState || {};
    // 1. Unknown secret door: behaves like solid wall to unaware hero
    if (rState.discovery === 'unknown') {
      if (state === gameState) {
        ui.floatingText(nx, ny, 'Solid Wall', '#8b949e');
      }
      return;
    }

    // 2. Walkable door (open, destroyed, or permeable)
    if (isDoorWalkable(doorAtTarget)) {
      state.hero.x = nx;
      state.hero.y = ny;
      pickupGroundObjectsAt(nx, ny, state);
      detectNearbyTraps(floor, state);
      processTurn(state);
      return;
    }

    // 3. Closed door: check lock / security state
    const sec = rState.security || 'unlocked';
    if (sec === 'locked' || sec === 'reinforced_locked') {
      // Try to unlock with matching key in inventory
      const unlockRes = executeInteraction({ targetId: doorAtTarget.instanceId, actionId: 'unlock' }, state);
      if (unlockRes && (unlockRes.ok || unlockRes.success)) {
        // Automatically swing door open upon successful key unlock
        executeInteraction({ targetId: doorAtTarget.instanceId, actionId: 'open' }, state);
        if (state === gameState) {
          playSound('door');
          ui.floatingText(nx, ny, 'Unlocked & Opened!', '#34d399');
          ui.log(`Unlocked and opened ${doorAtTarget.name} with key!`, 'good');
          if (typeof fovCallback === 'function') fovCallback();
        }
        processTurn(state);
        return;
      } else {
        // Locked door with no key
        if (state === gameState) {
          playSound('hit');
          ui.floatingText(nx, ny, 'Locked!', '#f87171');
          ui.log(`${doorAtTarget.name} is locked! (${unlockRes ? unlockRes.message : 'Key required'})`, 'bad');
        }
        return;
      }
    } else {
      // Unlocked door: bump auto-open!
      const openRes = executeInteraction({ targetId: doorAtTarget.instanceId, actionId: 'open' }, state);
      if (openRes && (openRes.ok || openRes.success)) {
        if (state === gameState) {
          playSound('door');
          ui.floatingText(nx, ny, 'Opened', '#e2e8f0');
          ui.log(`Opened ${doorAtTarget.name}.`, 'info');
          if (typeof fovCallback === 'function') fovCallback();
        }
        processTurn(state);
        return;
      } else {
        if (state === gameState) {
          ui.floatingText(nx, ny, 'Stuck!', '#f87171');
        }
        return;
      }
    }
  }

  // 6.5. Portal Collision & One-Way Traversal (Step-Through Gate)
  const portalAtTarget = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(function(o) { return o.x === nx && o.y === ny && o.objectType === 'portal'; })
    : null;

  if (portalAtTarget) {
    const travRes = traversePortal(portalAtTarget, state);
    if (travRes && travRes.ok) {
      processTurn(state);
      return;
    }
  }

  // 6.55. Spawnable Container Chest Bump-Open (ADR-0012)
  const containerAtTarget = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(function(o) { return o.x === nx && o.y === ny && isClosedContainer(o); })
    : null;
  if (containerAtTarget) {
    const cRes = openContainerObject(containerAtTarget, floor, state);
    if (cRes.opened && state === gameState) {
      playSound('chest');
      const items = (cRes.loot && cRes.loot.items) || [];
      const summary = items.length > 0 ? items.map(function(it) { return it.name; }).join(', ') : 'Empty';
      ui.floatingText(nx, ny, 'Chest Opened!', '#fbbf24');
      ui.log('Opened ' + containerAtTarget.name + ': Found ' + summary + '!', 'gold');
    }
    processTurn(state);
    return;
  }

  // 6.6. Destructible Prop Bump-Bash (Inc 8.3: Crates, Barrels, Barricades)
  const propAtTarget = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(function(o) { return o.x === nx && o.y === ny && isDestructibleProp(o); })
    : null;
  if (propAtTarget) {
    const pRes = damageDestructibleProp(propAtTarget, (state.hero && state.hero.atk) || 12, floor, state);
    if (state === gameState) {
      playSound('hit');
      ui.floatingText(nx, ny, pRes.destroyed ? 'Smashed!' : ('-' + pRes.damage), '#fb923c');
      if (pRes.destroyed) {
        ui.log('Smashed ' + propAtTarget.name + (pRes.goldLooted ? (' (+' + pRes.goldLooted + 'g)') : '') + (pRes.spawnedHazards ? ' — Oil spilled!' : '!'), 'gold');
      }
    }
    processTurn(state);
    return;
  }

  // 7. Step onto Walkable Tile
  if (targetTile !== TILE_WALL) {
    state.hero.x = nx;
    state.hero.y = ny;
    pickupGroundObjectsAt(nx, ny, state);
    detectNearbyTraps(floor, state);

    // Inc 8.3: Trigger Mechanisms (Levers / Pressure Plates) & Environmental Hazards on step
    if (floor.objects && floor.objects.length > 0) {
      const mechAtTile = floor.objects.find(function(o) { return o.x === nx && o.y === ny && isMechanism(o); });
      if (mechAtTile) {
        const mRes = toggleLinkedMechanisms(mechAtTile, floor);
        if (state === gameState && mRes.toggled > 0) {
          playSound('chest');
          ui.floatingText(nx, ny, mechAtTile.name + ' Activated!', '#fbbf24');
          ui.log(mechAtTile.name + ' actuated ' + mRes.toggled + ' linked dungeon mechanism(s)!', 'gold');
        }
      }
      const hzRes = resolveHazardStepEffects(state.hero, nx, ny, floor);
      if (hzRes.triggered && state === gameState) {
        if (hzRes.damage > 0) {
          playSound('hit');
          ui.floatingText(nx, ny, '-' + hzRes.damage + ' Hazard!', '#f87171');
          ui.log('Environmental hazard seared you for ' + hzRes.damage + ' damage!', 'bad');
        }
        if (state.hero.hp <= 0) {
          handleHeroDefeat('Environmental Hazard', state);
          return;
        }
      }
    }

    // Auto-discover waypoint if stepping onto it
    if (floor.objects && floor.objects.length > 0) {
      for (let oi = 0; oi < floor.objects.length; oi++) {
        const o = floor.objects[oi];
        if (o && o.x === nx && o.y === ny && o.objectType === 'portal') {
          if (o.definitionId === 'portal_ancient_waypoint' && o.runtimeState && o.runtimeState.discovery === 'unknown') {
            executeInteraction({ targetId: o.instanceId, actionId: 'attune' }, state);
            if (state === gameState) {
              playSound('lvl');
              ui.floatingText(nx, ny, 'Waypoint Attuned!', '#38bdf8');
              ui.log(`Discovered and attuned Celestial Waypoint on Floor ${state.dungeon.currentFloor}!`, 'good');
            }
          }
          break;
        }
      }
    }

    processTurn(state);
  } else if (state === gameState) {
    ui.floatingText(nx, ny, 'Blocked', '#8b949e');
  }
}

export function useStairsAtPlayer(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;
  const tile = floor.tiles[state.hero.y][state.hero.x];

  // 1. Check for interactive Portal at hero position
  const portalAtPlayer = (floor.objects && floor.objects.length > 0)
    ? floor.objects.find(function(o) { return o.x === state.hero.x && o.y === state.hero.y && o.objectType === 'portal'; })
    : null;

  if (portalAtPlayer) {
    const travRes = traversePortal(portalAtPlayer, state);
    if (travRes && travRes.ok) {
      return;
    }
  }

  // 2. Stairs Traversal
  if (tile === TILE_STAIRS_UP) {
    if (state.dungeon.currentFloor === 1) {
      clearFloorTelegraphs(floor);
      extractToGuild('Floor 1 Ascending Stairs (<)', state);
    } else {
      clearFloorTelegraphs(floor);
      state.dungeon.currentFloor -= 1;
      const prev = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
      state.hero.x = prev.downPos.x;
      state.hero.y = prev.downPos.y;
      detectNearbyTraps(prev, state);
      if (state === gameState) {
        fovCallback();
        saveGame();
        ui.updateUI();
        ui.log(`Ascended to Floor ${state.dungeon.currentFloor} of ${state.dungeon.name}.`, 'info');
      }
    }
  } else if (tile === TILE_STAIRS_DOWN) {
    const cfg = state.dungeon.config || {};
    const maxDepth = cfg.maxDepth || 999;
    if (state.dungeon.currentFloor >= maxDepth) {
      if (state === gameState) {
        ui.log(`You have reached the deepest sanctum of ${state.dungeon.name} (Floor ${maxDepth}).`, 'gold');
      }
      return;
    }

    if (cfg.respectsCartographyPermit !== false) {
      const permit = RESEARCH_PROJECTS.cartography.levels[state.guildResearch.cartography || 0].depthPermit;
      if (state.dungeon.currentFloor + 1 > permit) {
        if (state === gameState) {
          ui.floatingText(state.hero.x, state.hero.y, 'Ward Sealed!', '#f87171');
          ui.log(`Astral Ward blocks Floor ${state.dungeon.currentFloor + 1}! Research Vault Cartography at the Guild Lab.`, 'bad');
          playSound('hit');
        }
        return;
      }
    }

    clearFloorTelegraphs(floor);
    const nextDepth = state.dungeon.currentFloor + 1;
    state.dungeon.currentFloor = nextDepth;
    state.dungeon.deepestFloor = Math.max(state.dungeon.deepestFloor || 1, nextDepth);
    const codex = ensureCodexState(state);
    const dId = state.activeDungeonId || state.dungeon.id;
    if (!codex.deepestFloorByDungeon[dId]) {
      codex.deepestFloorByDungeon[dId] = {
        name: state.dungeon.name,
        deepestFloor: nextDepth,
        maxDepth: cfg.maxDepth || 999
      };
    } else {
      codex.deepestFloorByDungeon[dId].deepestFloor = Math.max(codex.deepestFloorByDungeon[dId].deepestFloor || 1, nextDepth);
    }
    if (!state.dungeon.floors[nextDepth]) {
      state.dungeon.floors[nextDepth] = generateFloor(
        nextDepth,
        state.dungeon.config,
        state.dungeon.numericSeed
      );
    }
    const next = ensureDungeonFloorHydrated(state.dungeon, nextDepth);
    state.hero.x = next.upPos.x;
    state.hero.y = next.upPos.y;
    detectNearbyTraps(next, state);
    if (state === gameState) {
      fovCallback();
      saveGame();
      ui.updateUI();
      ui.log(`Descended to Floor ${nextDepth} of ${state.dungeon.name} (${next.width}x${next.height}).`, 'info');
    }
  } else if (state === gameState) {
    ui.log('Stand on Ascending (<) or Descending (>) stairs to use them.', 'info');
  }
}

export function waitTurn(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (!state || state.inGuild) return;
  if (state === gameState) {
    ui.log('You hold your ground and scan the shadows.', 'info');
  }
  processTurn(state);
}

export function computeCorridorRunPath(dx, dy, floor, state = gameState) {
  if (!floor || !floor.tiles || !state || !state.hero) {
    return { path: [], stopReason: 'no_floor' };
  }

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  function isWalkable(x, y) {
    if (x < 0 || x >= fw || y < 0 || y >= fh) return false;
    const t = floor.tiles[y][x];
    if (t === TILE_WALL || ORE_CATALOG[t] || t === TILE_TRAP_VISIBLE) return false;
    return true;
  }

  let curX = state.hero.x;
  let curY = state.hero.y;
  let curDx = dx;
  let curDy = dy;
  const path = [];
  let stopReason = 'max_steps';
  const maxSteps = 50;

  // Determine if hero is starting in an open room vs a narrow corridor
  let leftDir = { x: -curDy, y: curDx };
  let rightDir = { x: curDy, y: -curDx };
  const leftOpen = isWalkable(curX + leftDir.x, curY + leftDir.y);
  const rightOpen = isWalkable(curX + rightDir.x, curY + rightDir.y);
  let inRoom = leftOpen && rightOpen;

  for (let s = 0; s < maxSteps; s++) {
    let nx = curX + curDx;
    let ny = curY + curDy;

    // If straight ahead is blocked by a wall or obstacle
    if (!isWalkable(nx, ny)) {
      const canTurnLeft = isWalkable(curX + leftDir.x, curY + leftDir.y);
      const canTurnRight = isWalkable(curX + rightDir.x, curY + rightDir.y);

      if (canTurnLeft && !canTurnRight) {
        // Bend in corridor: single 90-degree left turn
        curDx = leftDir.x;
        curDy = leftDir.y;
        leftDir = { x: -curDy, y: curDx };
        rightDir = { x: curDy, y: -curDx };
        inRoom = false;
        nx = curX + curDx;
        ny = curY + curDy;
      } else if (canTurnRight && !canTurnLeft) {
        // Bend in corridor: single 90-degree right turn
        curDx = rightDir.x;
        curDy = rightDir.y;
        leftDir = { x: -curDy, y: curDx };
        rightDir = { x: curDy, y: -curDx };
        inRoom = false;
        nx = curX + curDx;
        ny = curY + curDy;
      } else {
        stopReason = (canTurnLeft && canTurnRight) ? 'intersection' : 'blocked';
        break;
      }
    }

    if (!isWalkable(nx, ny)) {
      stopReason = 'blocked';
      break;
    }

    if (floor.monsters && floor.monsters.some(m => m.hp > 0 && m.x === nx && m.y === ny)) {
      stopReason = 'hostile_ahead';
      break;
    }

    if (floor.tiles[ny][nx] === TILE_TRAP_VISIBLE) {
      stopReason = 'trap_ahead';
      break;
    }

    path.push({ x: nx, y: ny });
    curX = nx;
    curY = ny;

    const tileType = floor.tiles[curY][curX];
    if (
      tileType === TILE_STAIRS_UP ||
      tileType === TILE_STAIRS_DOWN ||
      tileType === TILE_CHEST ||
      tileType === TILE_SHRINE
    ) {
      stopReason = 'reached_landmark';
      break;
    }

    leftDir = { x: -curDy, y: curDx };
    rightDir = { x: curDy, y: -curDx };
    const lWalk = isWalkable(curX + leftDir.x, curY + leftDir.y);
    const rWalk = isWalkable(curX + rightDir.x, curY + rightDir.y);

    if (inRoom) {
      // If started in a room, we keep sprinting straight until entering a corridor
      if (!lWalk && !rWalk) {
        inRoom = false;
      }
    } else {
      // In a corridor:
      if (lWalk && rWalk) {
        // Reached entrance of an open room: halt at threshold!
        stopReason = 'room_entrance';
        break;
      }
      if (lWalk || rWalk) {
        // T-junction or side branch: halt!
        stopReason = 'intersection';
        break;
      }
    }
  }

  return { path, stopReason };
}

export function runCorridor(dx, dy, state = gameState) {
  if (!state || state.inGuild || !state.hero) {
    return { ok: false, reason: 'invalid_state', stepsTaken: 0 };
  }
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || !floor.tiles) {
    return { ok: false, reason: 'no_floor', stepsTaken: 0 };
  }

  cancelAutoWalk();

  // If already engaged in melee with a hostile, do not run blindly
  if (floor.monsters && floor.monsters.some(m => m.hp > 0 && Math.abs(m.x - state.hero.x) <= 1 && Math.abs(m.y - state.hero.y) <= 1)) {
    const ui = getActionCallbacks();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, 'Hostile in Melee!', '#f87171');
      ui.log('Cannot fast-run while engaged in melee combat!', 'bad');
    }
    return { ok: false, reason: 'hostile_adjacent', stepsTaken: 0 };
  }

  const { path, stopReason } = computeCorridorRunPath(dx, dy, floor, state);
  if (path.length === 0) {
    const ui = getActionCallbacks();
    if (state === gameState) {
      ui.floatingText(state.hero.x + dx, state.hero.y + dy, 'Blocked', '#8b949e');
    }
    return { ok: false, reason: stopReason, stepsTaken: 0 };
  }

  // Synchronous execution for sandboxed tests / headless environments
  if (state !== gameState || typeof setTimeout === 'undefined') {
    let stepsTaken = 0;
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      const stepDx = step.x - state.hero.x;
      const stepDy = step.y - state.hero.y;
      handlePlayerAction(stepDx, stepDy, state);
      stepsTaken++;
      if (state.inGuild) break;
    }
    return { ok: true, stepsTaken, stopReason };
  }

  // Live browser execution: start high-speed animated sprint (22ms per step)
  const ui = getActionCallbacks();
  autoWalkMode = 'sprint';
  autoWalkInterval = 22;
  initialVisibleMonsters = countHostilesInSight(floor, state);
  activeAutoWalkQueue = path.slice();

  ui.floatingText(state.hero.x, state.hero.y, '⚡ Fast Run...', '#fbbf24');
  ui.log(`Fast-run started: ${path.length} steps queued.`, 'info');
  scheduleNextAutoWalkTick(autoWalkInterval);

  return { ok: true, stepsTaken: path.length, stopReason };
}
