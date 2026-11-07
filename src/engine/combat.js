// Turn-Based Movement, Combat Resolution, Active Class Skills, Monster AI, Shrines, Traps & Stairs

import {
  GRID_W,
  GRID_H,
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
import { gameState, saveGame, recomputeHeroDerivedStats } from './state.js';
import { generateFloor, generateProceduralEquipment } from './procedural.js';
import { playSound } from './audio.js';
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

export function killMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return;
  floor.monsters = floor.monsters.filter(m => m !== monster);

  const h = state.hero;
  // Thief Shadow Dance MP restore on kill
  if (h.classId === 'thief' && ((h.talentsAllocated && h.talentsAllocated.t_b3) || 0) > 0) {
    h.mp = Math.min(h.maxMp, h.mp + 6);
  }

  // Record Guild Notice Board Bounty Progress
  const killTags = ['monster_any', monster.id];
  if (monster.isElite) killTags.push('elite');
  if (monster.isBoss) killTags.push('boss');
  recordBountyProgress('slay', killTags, 1, state);

  if (monster.isBoss) {
    const bossRarity = monster.id === 'boss_weaver' ? 'relic' : 'epic';
    const bossGear = generateProceduralEquipment(floor.depth, bossRarity);
    h.expeditionGear.push(bossGear);
    addExpeditionTradeItem('starcrystal', 'Star-Crystal', 90, 2, 'Ore', state);
    if (state === gameState) {
      playSound('lvl');
      ui.floatingText(monster.x, monster.y, '👑 BOSS VANQUISHED!', '#fbbf24');
      ui.log(`👑 Vanquished ${monster.name}! Looted ${bossGear.name} (${RARITY[bossRarity].name}) & 2x Star-Crystal!`, 'gold');
    }
  } else {
    const goldVal = 8 + floor.depth * 5 + (monster.isElite ? 18 : 0);
    addExpeditionTradeItem('monster_trophy', 'Abyssal Shard', goldVal, 1, 'Relic', state);
    if (monster.isElite || Math.random() < 0.25) {
      const dropGear = generateProceduralEquipment(floor.depth, monster.isElite ? 'rare' : null);
      h.expeditionGear.push(dropGear);
      if (state === gameState) {
        ui.log(`${monster.name} dropped ${dropGear.name}!`, 'good');
      }
    }
  }

  if (state === gameState) {
    gainExperience(monster.xp, state);
  }
}

export function attackMonster(monster, state = gameState) {
  const ui = getActionCallbacks();
  const h = state.hero;
  const isCrit = Math.random() * 100 < h.crit;
  const critMult = isCrit ? 1.65 : 1.0;
  const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
  const effDef = Math.round(monster.def * (1 - Math.min(0.8, pierceRank * 0.30)));

  const dmg = Math.max(2, Math.round(h.atk * critMult) - effDef);
  monster.hp -= dmg;

  if (state === gameState) {
    playSound('hit');
    ui.floatingText(monster.x, monster.y, `${isCrit ? 'CRIT! ' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#f87171');
    ui.log(`You strike ${monster.name} for ${dmg} damage${isCrit ? ' (CRITICAL!)' : ''}.`, isCrit ? 'gold' : 'info');
  }

  if (monster.hp <= 0) {
    killMonster(monster, state);
  }
}

export function checkHeroFatalDamage(killerName) {
  const ui = getActionCallbacks();
  const h = gameState.hero;
  // Paladin Divine Intervention Keystone
  if (h.classId === 'paladin' && ((h.talentsAllocated && h.talentsAllocated.p_e3) || 0) > 0 && !h.usedDivineIntervention) {
    h.usedDivineIntervention = true;
    h.hp = Math.round(h.maxHp * 0.40);
    playSound('lvl');
    ui.floatingText(h.x, h.y, 'DIVINE INTERVENTION!', '#fbbf24');
    ui.log('Divine Intervention prevented fatal damage and restored 40% Max HP!', 'gold');
    ui.updateUI();
    return;
  }
  handleHeroDefeat(killerName);
}

export function monsterAttackHero(m, isRanged) {
  const ui = getActionCallbacks();
  const h = gameState.hero;
  if (Math.random() * 100 < h.dodge) {
    ui.floatingText(h.x, h.y, 'DODGE!', '#34d399');
    ui.log(`You dodged ${m.name}'s attack!`, 'good');
    return;
  }

  let raw = isRanged ? Math.round(m.atk * 0.85) : m.atk;
  if (h.classId === 'fighter') raw = Math.round(raw * 0.85);
  const dmg = Math.max(1, raw - Math.floor(h.def * 0.6));
  h.hp -= dmg;
  playSound('hit');
  ui.floatingText(h.x, h.y, `-${dmg}${isRanged ? ' 🏹' : ''}`, '#f87171');
  ui.log(`${m.name} strikes you for ${dmg} damage!`, 'bad');

  // Elite Affix Effects
  if (m.affix && m.affix.id === 'vampiric') {
    m.hp = Math.min(m.maxHp, m.hp + Math.round(dmg * 0.4));
  } else if (m.affix && m.affix.id === 'molten') {
    applyStatusEffect(h, 'burn', 3);
  } else if (m.affix && m.affix.id === 'venomous') {
    applyStatusEffect(h, 'poison', 3);
  }

  // Fighter Titan Resurgence Counter-Attack
  if (!isRanged && h.classId === 'fighter' && ((h.talentsAllocated && h.talentsAllocated.f_a3) || 0) > 0 && Math.random() < 0.35) {
    const counterDmg = Math.max(2, Math.round(h.atk * 0.5));
    m.hp -= counterDmg;
    ui.floatingText(m.x, m.y, `-${counterDmg} COUNTER!`, '#60a5fa');
    if (m.hp <= 0) killMonster(m);
  }

  if (h.hp <= 0) {
    checkHeroFatalDamage(m.name);
  }
}

export function processTurn() {
  const ui = getActionCallbacks();
  gameState.turn += 1;
  const h = gameState.hero;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  // Passive Class Turn Ticks
  if (h.classId === 'mage') {
    h.mp = Math.min(h.maxMp, h.mp + 2);
  }
  if (h.classId === 'paladin' && gameState.turn % 3 === 0) {
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
        ui.floatingText(h.x, h.y, `-${dot} ${st.name.toUpperCase()}`, st.color);
      }
      st.duration -= 1;
      if (st.duration <= 0) {
        if (st.isBuff) buffExpired = true;
        h.statuses.splice(i, 1);
      }
    }
    if (buffExpired) {
      recomputeHeroDerivedStats(false, gameState);
    }
    if (h.hp <= 0) {
      checkHeroFatalDamage('Affliction');
      return;
    }
  }

  detectNearbyTraps(floor, gameState);
  fovCallback();

  // Monsters AI Turn
  for (const m of floor.monsters.slice()) {
    if (m.hp <= 0) continue;

    // Monster Status Ticks
    if (m.statuses && m.statuses.length > 0) {
      let stunned = false;
      for (let i = m.statuses.length - 1; i >= 0; i--) {
        const st = m.statuses[i];
        if (st.id === 'stun') stunned = true;
        if (st.id === 'burn' || st.id === 'bleed' || st.id === 'poison') {
          const dot = Math.max(3, Math.round(m.maxHp * 0.06));
          m.hp -= dot;
          ui.floatingText(m.x, m.y, `-${dot}`, st.color);
        }
        st.duration -= 1;
        if (st.duration <= 0) m.statuses.splice(i, 1);
      }
      if (m.hp <= 0) {
        killMonster(m);
        continue;
      }
      if (stunned) {
        ui.floatingText(m.x, m.y, 'STUNNED', '#fbbf24');
        continue;
      }
    }

    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    if (dist <= 6.5) {
      if (dist <= 1.5) {
        monsterAttackHero(m, false);
        if (gameState.inGuild) return;
      } else if (m.isRanged && dist <= (m.range || 3) + 0.3) {
        monsterAttackHero(m, true);
        if (gameState.inGuild) return;
      } else {
        const sx = Math.sign(h.x - m.x);
        const sy = Math.sign(h.y - m.y);
        const candidates = Math.abs(h.x - m.x) >= Math.abs(h.y - m.y)
          ? [[sx, 0], [0, sy]]
          : [[0, sy], [sx, 0]];
        for (const [dx, dy] of candidates) {
          if (dx === 0 && dy === 0) continue;
          const tx = m.x + dx;
          const ty = m.y + dy;
          if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
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

  saveGame();
  ui.updateUI();
}

// Wire turn-end hook into actions.js (for Healing Tonic turn advance)
registerActionCallbacks({ onTurnEnd: processTurn });

export function executeClassSkill(state = gameState) {
  const ui = getActionCallbacks();
  if (state.inGuild) return { ok: false, reason: 'in_guild' };
  const h = state.hero;
  const cls = CLASSES[h.classId];
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return { ok: false, reason: 'no_floor' };

  if (h.mp < cls.skillCost) {
    if (state === gameState) {
      ui.floatingText(h.x, h.y, 'Low MP!', '#60a5fa');
      ui.log(`Not enough MP for ${cls.skillName} (${cls.skillCost} MP required).`, 'bad');
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
    h.mp -= cls.skillCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'WHIRLWIND!', '#f87171');
    }
    adjTargets.slice().forEach(m => {
      const dmg = Math.max(2, Math.round(h.atk * 1.5) - m.def);
      m.hp -= dmg;
      applyStatusEffect(m, 'stun', 1);
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} STUN`, '#f87171');
      if (m.hp <= 0) killMonster(m, state);
    });
    if (state === gameState) processTurn();
    return { ok: true, skill: 'whirlwind' };
  }

  // 2. THIEF: Shadowstep Strike (Requires visible target within 3.5 tiles AND an unoccupied safe floor tile adjacent to target)
  if (h.classId === 'thief') {
    const candidates = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 3.5);
    let chosenTarget = null;
    let destTile = null;

    for (const m of candidates) {
      const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of neighbors) {
        const tx = m.x + dx;
        const ty = m.y + dy;
        if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
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
        ui.log('Shadowstep Strike requires a target within 3 tiles with an open adjacent floor tile.', 'bad');
      }
      return { ok: false, reason: 'no_valid_shadowstep' };
    }

    h.mp -= cls.skillCost;
    h.x = destTile.x;
    h.y = destTile.y;
    const dmg = Math.max(4, Math.round(h.atk * 2.2) - Math.floor(chosenTarget.def * 0.5));
    chosenTarget.hp -= dmg;

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(chosenTarget.x, chosenTarget.y, `-${dmg} CRIT BACKSTAB!`, '#fbbf24');
      ui.log(`Shadowstep Strike hits ${chosenTarget.name} for ${dmg} critical damage!`, 'gold');
    }
    if (chosenTarget.hp <= 0) killMonster(chosenTarget, state);
    if (state === gameState) processTurn();
    return { ok: true, skill: 'shadowstep', destTile };
  }

  // 3. MAGE: Starfall Nova (Requires at least 1 enemy within 4 tiles, applies Arcane Amplification & Supernova Echo)
  if (h.classId === 'mage') {
    const targets = floor.monsters.filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 4.2);
    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Foes in Range!', '#60a5fa');
        ui.log('Starfall Nova requires at least one enemy within 4 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= cls.skillCost;
    const ampRank = (h.talentsAllocated && h.talentsAllocated.m_c2) || 0;
    const hasEcho = ((h.talentsAllocated && h.talentsAllocated.m_c3) || 0) > 0;
    const spellMult = 2.0 * (1 + ampRank * 0.15);

    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL NOVA!', '#60a5fa');
    }

    targets.slice().forEach(m => {
      let dmg = Math.max(4, Math.round(h.atk * spellMult) - Math.floor(m.def * 0.4));
      if (hasEcho) dmg += Math.round(dmg * 0.5);
      m.hp -= dmg;
      applyStatusEffect(m, 'burn', 3);
      if (state === gameState) {
        ui.floatingText(m.x, m.y, `-${dmg}${hasEcho ? ' ECHO!' : ''}`, '#60a5fa');
      }
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn();
    return { ok: true, skill: 'nova' };
  }

  // 4. RANGER: Starfall Volley (Up to 3—or 5 with Rain of Needles—targets within 5 tiles)
  if (h.classId === 'ranger') {
    const maxTargets = ((h.talentsAllocated && h.talentsAllocated.r_d3) || 0) > 0 ? 5 : 3;
    const pierceRank = (h.talentsAllocated && h.talentsAllocated.r_d2) || 0;
    const defIgnore = Math.min(0.8, pierceRank * 0.30);

    const targets = floor.monsters
      .filter(m => Math.hypot(m.x - h.x, m.y - h.y) <= 5.2)
      .sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))
      .slice(0, maxTargets);

    if (targets.length === 0) {
      if (state === gameState) {
        ui.floatingText(h.x, h.y, 'No Targets in Sight!', '#34d399');
        ui.log('Starfall Volley requires at least one enemy within 5 tiles.', 'bad');
      }
      return { ok: false, reason: 'no_target' };
    }

    h.mp -= cls.skillCost;
    if (state === gameState) {
      playSound('spell');
      ui.floatingText(h.x, h.y, 'STARFALL VOLLEY!', '#34d399');
    }

    targets.forEach(m => {
      const effDef = Math.round(m.def * (1 - defIgnore));
      const dmg = Math.max(3, Math.round(h.atk * 1.8) - effDef);
      m.hp -= dmg;
      if (state === gameState) ui.floatingText(m.x, m.y, `-${dmg} VOLLEY`, '#34d399');
      if (m.hp <= 0) killMonster(m, state);
    });

    if (state === gameState) processTurn();
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

    h.mp -= cls.skillCost;
    const dmg = Math.max(5, Math.round(h.atk * 2.4) - Math.floor(target.def * 0.5));
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
    if (state === gameState) processTurn();
    return { ok: true, skill: 'smite', dmg, healAmt };
  }

  return { ok: false };
}

export function handlePlayerAction(dx, dy) {
  const ui = getActionCallbacks();
  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  const nx = gameState.hero.x + dx;
  const ny = gameState.hero.y + dy;
  if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) return;

  // 1. Monster Melee/Ranged Bump Attack
  const targetMonster = floor.monsters.find(m => m.x === nx && m.y === ny);
  if (targetMonster) {
    attackMonster(targetMonster);
    processTurn();
    return;
  }

  // 2. Ore Vein Mining
  const targetTile = floor.tiles[ny][nx];
  if (ORE_CATALOG[targetTile]) {
    mineTile(nx, ny);
    processTurn();
    return;
  }

  // 3. Gilded Chest Opening
  if (targetTile === TILE_CHEST) {
    floor.tiles[ny][nx] = TILE_CHEST_OPEN;
    playSound('gold');
    const depth = gameState.dungeon.currentFloor;
    const goldVal = Math.round((22 + depth * 12) * (gameState.hero.classId === 'thief' ? 1.25 : 1.0));
    addExpeditionTradeItem('star_relic', 'Star-etched Relic', goldVal, 1, 'Relic');
    recordBountyProgress('open_chest', ['chest'], 1, gameState);

    const chestGear = generateProceduralEquipment(depth, depth >= 3 ? 'rare' : 'uncommon');
    gameState.hero.expeditionGear.push(chestGear);

    ui.floatingText(nx, ny, `+${goldVal}g & ${chestGear.name}!`, RARITY[chestGear.rarity].color);
    ui.log(`Opened Gilded Chest! Found Star-etched Relic (${goldVal}g) & ${chestGear.name}!`, 'gold');
    gainExperience(18 + depth * 6);
    processTurn();
    return;
  }

  // 4. Astral Shrine Activation
  if (targetTile === TILE_SHRINE) {
    activateAstralShrine(nx, ny, gameState);
    processTurn();
    return;
  }

  // 5. Runic Trap Interaction (Disarm for Scout on Spotted Trap, else Trigger)
  if (targetTile === TILE_TRAP_HIDDEN || targetTile === TILE_TRAP_VISIBLE) {
    const trapRes = resolveTrapInteraction(nx, ny, gameState);
    if (trapRes.fatal) {
      checkHeroFatalDamage(trapRes.killerName);
      return;
    }
    processTurn();
    return;
  }

  // 6. Step onto Walkable Tile
  if (targetTile !== TILE_WALL) {
    gameState.hero.x = nx;
    gameState.hero.y = ny;
    detectNearbyTraps(floor, gameState);
    processTurn();
  } else {
    ui.floatingText(nx, ny, 'Blocked', '#8b949e');
  }
}

export function useStairsAtPlayer() {
  const ui = getActionCallbacks();
  if (gameState.inGuild) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  const tile = floor.tiles[gameState.hero.y][gameState.hero.x];

  if (tile === TILE_STAIRS_UP) {
    if (gameState.dungeon.currentFloor === 1) {
      extractToGuild('Floor 1 Ascending Stairs (<)');
    } else {
      gameState.dungeon.currentFloor -= 1;
      const prev = gameState.dungeon.floors[gameState.dungeon.currentFloor];
      gameState.hero.x = prev.downPos.x;
      gameState.hero.y = prev.downPos.y;
      detectNearbyTraps(prev, gameState);
      fovCallback();
      ui.updateUI();
      ui.log(`Ascended to Floor ${gameState.dungeon.currentFloor}.`, 'info');
    }
  } else if (tile === TILE_STAIRS_DOWN) {
    const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
    if (gameState.dungeon.currentFloor + 1 > permit) {
      ui.floatingText(gameState.hero.x, gameState.hero.y, 'Ward Sealed!', '#f87171');
      ui.log(`Astral Ward blocks Floor ${gameState.dungeon.currentFloor + 1}! Research Vault Cartography at the Guild Lab.`, 'bad');
      playSound('hit');
      return;
    }
    gameState.dungeon.currentFloor += 1;
    if (!gameState.dungeon.floors[gameState.dungeon.currentFloor]) {
      gameState.dungeon.floors[gameState.dungeon.currentFloor] = generateFloor(gameState.dungeon.currentFloor);
    }
    const next = gameState.dungeon.floors[gameState.dungeon.currentFloor];
    gameState.hero.x = next.upPos.x;
    gameState.hero.y = next.upPos.y;
    detectNearbyTraps(next, gameState);
    fovCallback();
    ui.updateUI();
    ui.log(`Descended to Floor ${gameState.dungeon.currentFloor}.`, 'info');
  } else {
    ui.log('Stand on Ascending (<) or Descending (>) stairs to use them.', 'info');
  }
}

export function waitTurn() {
  const ui = getActionCallbacks();
  if (gameState.inGuild) return;
  ui.log('You hold your ground and scan the shadows.', 'info');
  processTurn();
}
