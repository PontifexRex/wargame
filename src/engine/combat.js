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
  handleHeroDefeat
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

// ============================================================================
// SAFE EXPLORED PATHFINDING & CLICK-TO-TRAVEL AUTO-WALK
// ============================================================================

let activeAutoWalkQueue = [];
let autoWalkTimerId = null;

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

  if (areHostilesInSight(floor, state)) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log('Auto-walk halted: hostile guardian in sight!', 'gold');
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
  if (areHostilesInSight(postFloor, state)) {
    cancelAutoWalk();
    if (state === gameState) {
      ui.floatingText(state.hero.x, state.hero.y, '⚔ Hostile Sighted!', '#fbbf24');
      ui.log('Auto-walk halted: hostile guardian in sight!', 'gold');
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

function scheduleNextAutoWalkTick() {
  if (autoWalkTimerId !== null && typeof clearTimeout !== 'undefined') {
    clearTimeout(autoWalkTimerId);
    autoWalkTimerId = null;
  }
  if (activeAutoWalkQueue.length === 0 || typeof setTimeout === 'undefined') return;
  autoWalkTimerId = setTimeout(() => {
    autoWalkTimerId = null;
    const res = stepAutoWalkOnce(gameState);
    if (res && res.ok && !res.halted && res.remaining > 0) {
      scheduleNextAutoWalkTick();
    }
  }, 36);
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

  activeAutoWalkQueue = path;
  if (state === gameState) {
    scheduleNextAutoWalkTick();
  }
  return { ok: true, steps: path.length, path: path.slice() };
}

// ============================================================================
// COMBAT RESOLUTION, BOSS DROPS & MONSTER AI
// ============================================================================

export function killMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return;
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
    if (floor && Array.isArray(floor.monsters)) {
      floor.monsters.forEach(m2 => {
        if (m2 !== monster && m2.hp > 0 && Math.abs(m2.x - monster.x) <= 1 && Math.abs(m2.y - monster.y) <= 1) {
          const mDmg = Math.max(2, Math.round(monster.atk * 1.5) - m2.def);
          m2.hp -= mDmg;
          if (state === gameState) {
            ui.floatingText(m2.x, m2.y, `-${mDmg}`, '#ef4444');
          }
        }
      });
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
  const effDef = Math.round(monster.def * (1 - Math.min(0.8, pierceRank * 0.30)));
  const masteryMult = getCodexMasteryMultiplier(monster.id, state);

  const dmg = Math.max(2, Math.round(h.atk * weakMult * critMult * masteryMult) - effDef);
  monster.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(monster.x, monster.y, `${isCrit ? 'CRIT! ' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#f87171');
    ui.log(`You strike ${monster.name} for ${dmg} damage${isCrit ? ' (CRITICAL!)' : ''}.`, isCrit ? 'gold' : 'info');
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
  h.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(h.x, h.y, `-${dmg}${isRanged ? ' 🏹' : ''}`, '#f87171');
    ui.log(`${m.name} strikes you for ${dmg} damage!`, 'bad');
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
  }
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

  // Hero Status & Shrine Buff Ticks
  if (h.statuses && h.statuses.length > 0) {
    let buffExpired = false;
    for (let i = h.statuses.length - 1; i >= 0; i--) {
      const st = h.statuses[i];
      if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
        const dot = Math.max(2, Math.round(h.maxHp * 0.04));
        h.hp -= dot;
        if (state === gameState) {
          ui.floatingText(h.x, h.y, `-${dot} ${st.name.toUpperCase()}`, st.color);
        }
      }
      st.duration -= 1;
      if (st.duration <= 0) {
        if (st.isBuff || st.id === 'chilled') buffExpired = true;
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

  const spottedTraps = detectNearbyTraps(floor, state);
  if (spottedTraps > 0 && isAutoWalking()) {
    cancelAutoWalk();
  }
  if (state === gameState) {
    fovCallback();
  }

  // Monsters AI Turn (pre-culled by Chebyshev distance for O(1) large-map turn speed)
  const monstersSnapshot = floor.monsters.slice();
  for (let mIdx = 0; mIdx < monstersSnapshot.length; mIdx++) {
    const m = monstersSnapshot[mIdx];
    if (!m || m.hp <= 0) continue;

    // Monster Status Ticks
    if (m.statuses && m.statuses.length > 0) {
      let stunned = false;
      for (let i = m.statuses.length - 1; i >= 0; i--) {
        const st = m.statuses[i];
        if (st.id === 'stun') stunned = true;
        if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
          const dot = Math.max(3, Math.round(m.maxHp * 0.06));
          m.hp -= dot;
          if (state === gameState) {
            ui.floatingText(m.x, m.y, `-${dot}`, st.color);
          }
        }
        st.duration -= 1;
        if (st.duration <= 0) m.statuses.splice(i, 1);
      }
      if (m.hp <= 0) {
        killMonster(m, state);
        continue;
      }
      if (stunned) {
        if (state === gameState) {
          ui.floatingText(m.x, m.y, 'STUNNED', '#fbbf24');
        }
        continue;
      }
    }

    // Fast bounding-box skip so distant monsters on 192x144 maps cost zero CPU
    if (Math.abs(m.x - h.x) > 8 || Math.abs(m.y - h.y) > 8) continue;

    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    if (dist <= 7.0) {
      if (dist <= 1.5) {
        monsterAttackHero(m, false, state);
        if (state.inGuild) return;
      } else if (m.isRanged && dist <= (m.range || 3) + 0.3 && hasLineOfSight(floor, m.x, m.y, h.x, h.y)) {
        monsterAttackHero(m, true, state);
        if (state.inGuild) return;
      } else if (hasLineOfSight(floor, m.x, m.y, h.x, h.y) || dist <= 4.2) {
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
          if (tx >= 0 && tx < fw && ty >= 0 && ty < fh) {
            const destTile = floor.tiles[ty][tx];
            const monsterWalkable = (
              destTile === TILE_FLOOR ||
              destTile === TILE_CHEST_OPEN ||
              destTile === TILE_SHRINE_USED ||
              destTile === TILE_TRAP_DISARMED
            );
            if (
              monsterWalkable &&
              !(tx === h.x && ty === h.y) &&
              !floor.monsters.some(other => other.x === tx && other.y === ty)
            ) {
              m.x = tx;
              m.y = ty;
              break;
            }
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

export function executeClassSkill(state = gameState) {
  const ui = getActionCallbacks();
  cancelAutoWalk();
  if (state.inGuild) return { ok: false, reason: 'in_guild' };
  const h = state.hero;
  const cls = CLASSES[h.classId];
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;

  const isChilled = (h.statuses || []).some(s => s.id === 'chilled');
  const effectiveCost = cls.skillCost + (isChilled ? 2 : 0);

  if (h.mp < effectiveCost) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'Low MP!', '#60a5fa');
      const chilledNote = isChilled ? ' (Chilled penalty: +2 MP)' : '';
      ui.log(`Not enough MP for ${cls.skillName} (${effectiveCost} MP required${chilledNote}).`, 'bad');
    }
    return { ok: false, reason: 'no_mp' };
  }

  // 1. FIGHTER: Whirlwind Cleave (Requires at least 1 adjacent monster)
  if (h.classId === 'fighter') {
    const adjTargets = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 1.5);
    if (adjTargets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Adjacent Foes!', '#fbbf24');
        ui.log('Whirlwind Cleave requires at least one adjacent enemy.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }
    h.mp -= effectiveCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'WHIRLWIND!', '#f87171');
    }
    adjTargets.slice().forEach(m => {
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      const dmg = Math.max(2, Math.round(h.atk * 1.5 * masteryMult) - m.def);
      m.hp -= dmg;
      applyStatusEffect(m, 'stun', 1);
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} STUN`, '#f87171');
      if (m.hp <= 0) killMonster(m, state);
    });
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'whirlwind' };
  }

  // 2. THIEF: Shadowstep Strike (Requires visible target within 3.5 tiles AND an unoccupied safe floor tile adjacent to target)
  if (h.classId === 'thief') {
    const candidates = floor.monsters.filter(
      m => Math.hypot(m.x - h.x, m.y - h.y) <= 3.5 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)
    );
    let chosenTarget = null;
    let destTile = null;

    for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
      const m = candidates[cIdx];
      const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (let nIdx = 0; nIdx < neighbors.length; nIdx++) {
        const tx = m.x + neighbors[nIdx][0];
        const ty = m.y + neighbors[nIdx][1];
        if (tx >= 0 && tx < fw && ty >= 0 && ty < fh) {
          const t = floor.tiles[ty][tx];
          const walkable = (
            t === TILE_FLOOR ||
            t === TILE_STAIRS_UP ||
            t === TILE_STAIRS_DOWN ||
            t === TILE_CHEST_OPEN ||
            t === TILE_SHRINE_USED ||
            t === TILE_TRAP_DISARMED
          );
          const occupied = floor.monsters.some(other => other.x === tx && other.y === ty);
          if (walkable && !occupied) {
            chosenTarget = m;
            destTile = { x: tx, y: ty };
            break;
          }
        }
      }
      if (chosenTarget && destTile) break;
    }

    if (!chosenTarget || !destTile) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Valid Shadowstep!', '#c084fc');
        ui.log('Shadowstep Strike requires a visible target within 3 tiles with an open adjacent floor tile.', 'bad');
      }
      return { ok: false, reason: 'no_valid_shadowstep' };
    }

    h.mp -= effectiveCost;
    h.x = destTile.x;
    h.y = destTile.y;
    const masteryMult = getCodexMasteryMultiplier(chosenTarget.id, state);
    const dmg = Math.max(4, Math.round(h.atk * 2.2 * masteryMult) - Math.floor(chosenTarget.def * 0.5));
    chosenTarget.hp -= dmg;

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(chosenTarget.x, chosenTarget.y, `-${dmg} CRIT BACKSTAB!`, '#fbbf24');
      ui.log(`Shadowstep Strike hits ${chosenTarget.name} for ${dmg} critical damage!`, 'gold');
    }
    if (chosenTarget.hp <= 0) killMonster(chosenTarget, state);
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'shadowstep', destTile };
  }

  // 3. MAGE: Starfall Nova (Requires at least 1 enemy within 4 tiles)
  if (h.classId === 'mage') {
    const targets = floor.monsters.filter(
      m => Math.hypot(m.x - h.x, m.y - h.y) <= 4.2 && hasLineOfSight(floor, h.x, h.y, m.x, m.y)
    );
    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Foes in Range!', '#60a5fa');
        ui.log('Starfall Nova requires at least one visible enemy within 4 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= effectiveCost;
    const ampRank = (h.talentsAllocated && h.talentsAllocated.m_c2) || 0;
    const hasEcho = ((h.talentsAllocated && h.talentsAllocated.m_c3) || 0) > 0;
    const spellMult = 2.0 * (1 + ampRank * 0.15);

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL NOVA!', '#60a5fa');
    }

    targets.slice().forEach(m => {
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      let dmg = Math.max(4, Math.round(h.atk * spellMult * masteryMult) - Math.floor(m.def * 0.4));
      if (hasEcho) dmg += Math.round(dmg * 0.5);
      m.hp -= dmg;
      applyStatusEffect(m, 'burn', 3);
      if (state === gameState) {
        ui.floatingText(m.x, m.y, `-${dmg}${hasEcho ? ' ECHO!' : ''}`, '#60a5fa');
      }
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'nova' };
  }

  // 4. RANGER: Starfall Volley (Up to 3—or 5 with Rain of Needles—visible targets within 5 tiles)
  if (h.classId === 'ranger') {
    const maxTargets = ((h.talentsAllocated && h.talentsAllocated.r_d3) || 0) > 0 ? 5 : 3;
    const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
    const defIgnore = Math.min(0.8, pierceRank * 0.30);

    const targets = floor.monsters
      .filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 5.2 && hasLineOfSight(floor, h.x, h.y, m.x, m.y))
      .sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))
      .slice(0, maxTargets);

    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Targets in Sight!', '#34d399');
        ui.log('Starfall Volley requires at least one visible enemy within 5 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= effectiveCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL VOLLEY!', '#34d399');
    }

    targets.forEach(m => {
      const effDef = Math.round(m.def * (1 - defIgnore));
      const masteryMult = getCodexMasteryMultiplier(m.id, state);
      const dmg = Math.max(3, Math.round(h.atk * 1.8 * masteryMult) - effDef);
      m.hp -= dmg;
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} VOLLEY`, '#34d399');
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'volley', count: targets.length };
  }

  // 5. PALADIN: Holy Smite (Requires adjacent enemy before deducting MP; deals 240% holy dmg + heals 15% Max HP)
  if (h.classId === 'paladin') {
    const target = floor.monsters.find(m => Math.hypot(m.x - h.x, m.y - h.y) <= 1.5);
    if (!target) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Adjacent Foe!', '#fbbf24');
        ui.log('Holy Smite requires an adjacent monster target.', 'bad');
      }
      return { ok: false, reason: 'no_adjacent_target' };
    }

    h.mp -= effectiveCost;
    const masteryMult = getCodexMasteryMultiplier(target.id, state);
    const dmg = Math.max(5, Math.round(h.atk * 2.4 * masteryMult) - Math.floor(target.def * 0.5));
    const healAmt = Math.round(h.maxHp * 0.15);
    target.hp -= dmg;
    h.hp = Math.min(h.maxHp, h.hp + healAmt);

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(target.x, target.y, `-${dmg} HOLY SMITE!`, '#fbbf24');
      ui.floatingText(h.x, h.y, `+${healAmt} HP`, '#34d399');
      ui.log(`Holy Smite sears ${target.name} for ${dmg} damage and heals you for +${healAmt} HP!`, 'gold');
    }
    if (target.hp <= 0) killMonster(target, state);
    if (state === gameState) processTurn(state);
    return { ok: true, skill: 'smite', dmg, healAmt };
  }

  return { ok: false };
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

  // 6. Step onto Walkable Tile
  if (targetTile !== TILE_WALL) {
    state.hero.x = nx;
    state.hero.y = ny;
    detectNearbyTraps(floor, state);
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

  if (tile === TILE_STAIRS_UP) {
    if (state.dungeon.currentFloor === 1) {
      extractToGuild('Floor 1 Ascending Stairs (<)', state);
    } else {
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
