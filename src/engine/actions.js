// Interactive Mining, Multi-Dungeon Atlas Management, Astral Gems & Lapidary, Guild Bounties, Shrines, Traps & Extraction

import {
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  DEFAULT_MAX_CHARTERED_DUNGEONS,
  TILE_FLOOR,
  TILE_ORE_MITHRIL,
  TILE_ORE_GEODE,
  TILE_ORE_STAR,
  TILE_ORE_ASTRAL,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_HIDDEN,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED,
  LAPIDARY_UNSOCKET_COST,
  BOUNTY_REROLL_COST
} from '../constants.js';
import { ORE_CATALOG, MINERAL_IDS } from '../data/ores.js';
import { GEM_IDS, GEM_CATALOG, SHRINE_CATALOG, TRAP_CATALOG } from '../data/gems.js';
import { buildProceduralBountySet } from '../data/bounties.js';
import { SHOP_ITEMS, computeItemPowerScore, isItemUpgrade } from '../data/items.js';
import { RESEARCH_PROJECTS } from '../data/research.js';
import { buildCharteredDungeonInstance } from '../data/dungeons.js';
import { hashSeedString, randomSeedCode } from './rng.js';
import {
  gameState,
  saveGame,
  nextItemUid,
  normalizeEquipmentSockets,
  ensureDungeonFloorHydrated,
  syncActiveDungeonAlias,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability,
  ensureCodexState
} from './state.js';
import { generateProceduralEquipment, rollSocketCountForRarity } from './procedural.js';
import { playSound } from './audio.js';
import { ENGINE_EVENTS, onEngineEvent, offEngineEvent, emitEngineEvent } from './events.js';
import {
  createWorldItemPickupInstance,
  addWorldObject,
  removeWorldObject,
  getObjectsAt,
  canItemsStack,
  mergeItemStacks
} from './objects.js';

const actionCallbacks = {
  log: (msg, tone) => emitEngineEvent(ENGINE_EVENTS.LOG, { msg, tone }, gameState),
  updateUI: () => emitEngineEvent(ENGINE_EVENTS.UI_SYNC, {}, gameState),
  floatingText: (x, y, text, color) => emitEngineEvent(ENGINE_EVENTS.FLOATING_TEXT, { x, y, text, color }, gameState),
  outcomeModal: (title, desc, details, isConfirm) => emitEngineEvent(ENGINE_EVENTS.OUTCOME_MODAL, { title, desc, details, isConfirm }, gameState),
  updateFOV: () => emitEngineEvent(ENGINE_EVENTS.FOV_SYNC, {}, gameState),
  onTurnEnd: () => emitEngineEvent(ENGINE_EVENTS.TURN_END, {}, gameState),
  combatAnim: (x, y, type, color) => {},
  heroLunge: (dx, dy) => {}
};

const registeredBridgeHandlers = {};

function bindBridgeHandler(slot, eventName, handlerFn) {
  if (registeredBridgeHandlers[slot]) {
    offEngineEvent(eventName, registeredBridgeHandlers[slot]);
  }
  registeredBridgeHandlers[slot] = handlerFn;
  onEngineEvent(eventName, handlerFn);
}

export function registerActionCallbacks(cbs) {
  if (!cbs) return;
  if (typeof cbs.log === 'function') {
    bindBridgeHandler('log', ENGINE_EVENTS.LOG, p => cbs.log(p.msg, p.tone));
  }
  if (typeof cbs.updateUI === 'function') {
    bindBridgeHandler('updateUI', ENGINE_EVENTS.UI_SYNC, () => cbs.updateUI());
  }
  if (typeof cbs.floatingText === 'function') {
    bindBridgeHandler('floatingText', ENGINE_EVENTS.FLOATING_TEXT, p => cbs.floatingText(p.x, p.y, p.text, p.color));
  }
  if (typeof cbs.outcomeModal === 'function') {
    bindBridgeHandler('outcomeModal', ENGINE_EVENTS.OUTCOME_MODAL, p => cbs.outcomeModal(p.title, p.desc, p.details, p.isConfirm));
  }
  if (typeof cbs.updateFOV === 'function') {
    bindBridgeHandler('updateFOV', ENGINE_EVENTS.FOV_SYNC, () => cbs.updateFOV());
  }
  if (typeof cbs.onTurnEnd === 'function') {
    bindBridgeHandler('onTurnEnd', ENGINE_EVENTS.TURN_END, () => cbs.onTurnEnd());
  }
  if (typeof cbs.combatAnim === 'function') {
    actionCallbacks.combatAnim = cbs.combatAnim;
  }
  if (typeof cbs.heroLunge === 'function') {
    actionCallbacks.heroLunge = cbs.heroLunge;
  }
}

export function getActionCallbacks() {
  return actionCallbacks;
}

export function applyStatusEffect(target, id, duration) {
  if (!target.statuses) target.statuses = [];
  const metaMap = {
    burn:            { id: 'burn',            name: 'Burn',              color: '#fb923c', duration, isBuff: false },
    bleed:           { id: 'bleed',           name: 'Bleed',             color: '#f87171', duration, isBuff: false },
    poison:          { id: 'poison',          name: 'Poison',            color: '#4ade80', duration, isBuff: false },
    stun:            { id: 'stun',            name: 'Stunned',           color: '#fbbf24', duration, isBuff: false },
    weakened:        { id: 'weakened',        name: 'Weakened',          color: '#c084fc', duration, isBuff: false },
    chilled:         { id: 'chilled',         name: 'Chilled',           color: '#38bdf8', duration, isBuff: false },
    shrine_starfire: { id: 'shrine_starfire', name: 'Starfire Blessing', color: '#fbbf24', duration, isBuff: true },
    shrine_aegis:    { id: 'shrine_aegis',    name: 'Astral Aegis',      color: '#60a5fa', duration, isBuff: true }
  };
  const meta = metaMap[id];
  if (!meta) return;
  const existing = target.statuses.find(s => s.id === id);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else target.statuses.push(Object.assign({}, meta));
}

export function addExpeditionTradeItem(id, name, val, qty = 1, type = 'Ore', state = gameState) {
  const pack = state.hero.expeditionPack;
  const existing = pack.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else pack.push({ id, name, val, qty, type });
}

export function gainExperience(amount, state = gameState) {
  const h = state.hero;
  if (!h) return;
  h.xp += amount;
  while (h.xp >= h.maxXp) {
    h.xp -= h.maxXp;
    h.level += 1;
    h.maxXp = Math.round(h.maxXp * 1.4);
    h.statPoints = (h.statPoints || 0) + 2;
    h.talentPoints = (h.talentPoints || 0) + 1;
    recomputeHeroDerivedStats(true, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(h.x, h.y, `LEVEL UP! Lv ${h.level}`, '#fbbf24');
      actionCallbacks.log(`LEVEL UP! Reached Level ${h.level} (+2 Stat Points, +1 Talent Point).`, 'good');
    }
  }
}

// ============================================================================
// MULTI-DUNGEON EXPEDITION ATLAS & CUSTOM CHARTER MANAGEMENT
// ============================================================================

export function selectActiveDungeon(dungeonId, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  if (!state.dungeons || !state.dungeons[dungeonId]) {
    return { ok: false, reason: 'not_found' };
  }
  const dng = state.dungeons[dungeonId];
  const reqCart = (dng.config && dng.config.reqCartography) || 0;
  const curCart = (state.guildResearch && state.guildResearch.cartography) || 0;
  if (curCart < reqCart) {
    if (state === gameState) {
      actionCallbacks.log(`Requires Vault Cartography Rank ${reqCart} to chart routes to ${dng.name}.`, 'bad');
    }
    return { ok: false, reason: 'cartography_locked', reqCart };
  }

  state.activeDungeonId = dungeonId;
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`🗺️ Expedition destination set to ${dng.name} (${dng.config.width}x${dng.config.height}, Seed ${dng.seedCode}).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, dungeonId, dungeon: state.dungeon };
}

export function chartCustomExpedition(opts = {}, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  const allDungeons = state.dungeons || {};
  const charteredCount = Object.keys(allDungeons).filter(
    k => allDungeons[k] && allDungeons[k].originType === 'chartered'
  ).length;
  const cap = state.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS;
  if (charteredCount >= cap) {
    if (state === gameState) {
      actionCallbacks.log(`Charter limit reached (${charteredCount}/${cap}). Abandon an old charter first.`, 'bad');
    }
    return { ok: false, reason: 'charter_cap_reached', cap };
  }

  const newDng = buildCharteredDungeonInstance(opts);
  state.dungeons[newDng.id] = newDng;
  state.activeDungeonId = newDng.id;
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(
      `🧭 Chartered "${newDng.name}" (${newDng.config.width}x${newDng.config.height} • Max Fl ${newDng.config.maxDepth} • ${newDng.seedCode})!`,
      'gold'
    );
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, dungeon: newDng };
}

export function resetOrAbandonDungeon(dungeonId, state = gameState) {
  if (!state || !state.inGuild) {
    return { ok: false, reason: 'in_dungeon' };
  }
  const dng = state.dungeons && state.dungeons[dungeonId];
  if (!dng) {
    return { ok: false, reason: 'not_found' };
  }

  if (dng.originType === 'chartered') {
    const oldName = dng.name;
    delete state.dungeons[dungeonId];
    if (state.activeDungeonId === dungeonId) {
      state.activeDungeonId = state.dungeons.dng_starfall
        ? 'dng_starfall'
        : Object.keys(state.dungeons)[0];
    }
    syncActiveDungeonAlias(state);
    if (state === gameState) {
      playSound('hit');
      actionCallbacks.log(`Sealed and retired expedition charter "${oldName}".`, 'info');
      saveGame();
      actionCallbacks.updateUI();
    }
    return { ok: true, action: 'abandoned', activeDungeonId: state.activeDungeonId };
  }

  const prefix = (dng.config && dng.config.seedPrefix) || 'STAR';
  dng.seedCode = randomSeedCode(prefix);
  dng.numericSeed = hashSeedString(dng.seedCode, 0);
  dng.currentFloor = 1;
  dng.deepestFloor = 1;
  dng.isCleared = false;
  dng.floors = {};
  syncActiveDungeonAlias(state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(`Re-charted ${dng.name} with fresh subterranean seed ${dng.seedCode}!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, action: 'reset', seedCode: dng.seedCode };
}

// ============================================================================
// GUILD NOTICE BOARD (PROCEDURAL BOUNTY CONTRACTS)
// ============================================================================

export function ensureGuildBounties(forceRefresh = false, state = gameState) {
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  if (forceRefresh || !Array.isArray(state.guildBounties) || state.guildBounties.length === 0) {
    state.guildBounties = buildProceduralBountySet(geo, cart);
  }
  return state.guildBounties;
}

export function rerollGuildBounties(state = gameState) {
  if (state.guildVault.gold < BOUNTY_REROLL_COST) {
    if (state === gameState) {
      actionCallbacks.log(`Need ${BOUNTY_REROLL_COST} Vault Gold to post fresh Notice Board contracts.`, 'bad');
    }
    return { ok: false, reason: 'no_gold' };
  }
  state.guildVault.gold -= BOUNTY_REROLL_COST;
  ensureGuildBounties(true, state);
  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Posted 3 fresh Guild Bounty contracts (-${BOUNTY_REROLL_COST}g).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, bounties: state.guildBounties };
}

export function recordBountyProgress(kind, targetTags, amount = 1, state = gameState) {
  if (!Array.isArray(state.guildBounties)) return 0;
  const tags = Array.isArray(targetTags) ? targetTags : [targetTags];
  let newlyCompleted = 0;

  for (let i = 0; i < state.guildBounties.length; i++) {
    const b = state.guildBounties[i];
    if (!b || b.completed || b.kind !== kind) continue;
    if (tags.indexOf(b.targetId) !== -1) {
      b.curQty = Math.min(b.reqQty, (b.curQty || 0) + amount);
      if (b.curQty >= b.reqQty) {
        b.completed = true;
        newlyCompleted += 1;
        if (state === gameState) {
          playSound('lvl');
          actionCallbacks.log(`📜 Bounty Complete: ${b.title}! Extract to the Guild to claim ${b.rewardLabel}.`, 'gold');
        }
      }
    }
  }
  return newlyCompleted;
}

function applySingleBountyReward(bounty, state) {
  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }
  if (bounty.rewardType === 'gold') {
    state.guildVault.gold += bounty.rewardQty;
  } else if (bounty.rewardType === 'talent_tome' && state.hero) {
    state.hero.talentPoints = (state.hero.talentPoints || 0) + bounty.rewardQty;
  } else if (bounty.rewardType === 'gem') {
    state.guildVault.gems[bounty.rewardId] = (state.guildVault.gems[bounty.rewardId] || 0) + bounty.rewardQty;
  } else if (bounty.rewardType === 'ore') {
    state.guildVault[bounty.rewardId] = (state.guildVault[bounty.rewardId] || 0) + bounty.rewardQty;
  }
}

export function payoutCompletedBounties(state = gameState) {
  ensureGuildBounties(false, state);
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  const replacementPool = buildProceduralBountySet(geo, cart);
  const claimedLabels = [];

  for (let i = 0; i < state.guildBounties.length; i++) {
    const b = state.guildBounties[i];
    if (b && b.completed) {
      applySingleBountyReward(b, state);
      claimedLabels.push(`${b.title} (${b.rewardLabel})`);
      state.guildBounties[i] = replacementPool[i % replacementPool.length];
    }
  }

  return claimedLabels;
}

export function claimBountyAtGuild(bountyId, state = gameState) {
  ensureGuildBounties(false, state);
  const idx = state.guildBounties.findIndex(b => b.id === bountyId);
  if (idx === -1 || !state.guildBounties[idx].completed) {
    return { ok: false, reason: 'not_completed' };
  }
  const b = state.guildBounties[idx];
  applySingleBountyReward(b, state);
  const geo = (state.guildResearch && state.guildResearch.geology) || 0;
  const cart = (state.guildResearch && state.guildResearch.cartography) || 0;
  const freshSet = buildProceduralBountySet(geo, cart);
  state.guildBounties[idx] = freshSet[idx % freshSet.length];

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Claimed Notice Board Bounty "${b.title}": ${b.rewardLabel}!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, rewardLabel: b.rewardLabel };
}

// ============================================================================
// MINING, ASTRAL GEM DROPS & LAPIDARY BENCH
// ============================================================================

function rollUncutGemForOreTile(tile) {
  const coreGems = ['ruby', 'emerald', 'sapphire', 'topaz'];
  let chance = 0;
  let voidWeight = 0;

  if (tile === TILE_ORE_MITHRIL) {
    chance = 0.22;
  } else if (tile === TILE_ORE_GEODE) {
    chance = 0.35;
  } else if (tile === TILE_ORE_STAR) {
    chance = 0.40;
    voidWeight = 0.20;
  } else if (tile === TILE_ORE_ASTRAL) {
    chance = 0.55;
    voidWeight = 0.40;
  }

  if (chance <= 0 || Math.random() >= chance) return null;
  if (voidWeight > 0 && Math.random() < voidWeight) {
    return 'void_diamond';
  }
  return coreGems[Math.floor(Math.random() * coreGems.length)];
}

export function mineTile(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };
  if (y < 0 || y >= floor.tiles.length || x < 0 || x >= floor.tiles[0].length) {
    return { ok: false, reason: 'out_of_bounds' };
  }

  const tile = floor.tiles[y][x];
  const ore = ORE_CATALOG[tile];
  if (!ore) return { ok: false, reason: 'not_ore' };

  const pick = state.hero.equipment.pickaxe;
  if (!pick || pick.curDur <= 0) {
    if (state === gameState) {
      actionCallbacks.floatingText(x, y, 'Pickaxe Broken!', '#f87171');
      actionCallbacks.log('Your pickaxe is broken! Repair or replace it at the Guild.', 'bad');
      playSound('hit');
    }
    return { ok: false, reason: 'broken_pickaxe' };
  }

  const geoRank = state.guildResearch.geology || 0;
  if (geoRank < ore.minGeology) {
    if (state === gameState) {
      actionCallbacks.floatingText(x, y, `Req Geology R${ore.minGeology}!`, '#fbbf24');
      actionCallbacks.log(`This ${ore.name} vein is too dense! Research Subterranean Geology Rank ${ore.minGeology} at the Guild Lab.`, 'bad');
      playSound('hit');
    }
    return { ok: false, reason: 'geology_locked' };
  }

  // Thief Mineral Vein Sense (t_b2 * 0.25) & Dwarven Toolsmithing (toolRank * 0.20)
  const t_b2 = (state.hero.talentsAllocated && state.hero.talentsAllocated.t_b2) || 0;
  const toolRank = state.guildResearch.toolsmithing || 0;
  const freeMine = (t_b2 > 0 && Math.random() < (t_b2 * 0.25)) || (toolRank > 0 && Math.random() < (toolRank * 0.20));

  if (!freeMine) {
    pick.curDur = Math.max(0, pick.curDur - 1);
  }

  floor.tiles[y][x] = TILE_FLOOR;
  floor.oresMined = (floor.oresMined || 0) + 1;

  const codex = ensureCodexState(state);
  codex.totalOresMined = (codex.totalOresMined || 0) + 1;
  codex.oreMinedById[ore.id] = (codex.oreMinedById[ore.id] || 0) + 1;

  addExpeditionTradeItem(ore.id, ore.name, ore.baseValue, 1, 'Ore', state);
  recordBountyProgress('mine', [ore.id], 1, state);

  // High-tier vein uncut Astral Gem drop check
  const droppedGemId = rollUncutGemForOreTile(tile);
  if (droppedGemId && GEM_CATALOG[droppedGemId]) {
    codex.totalGemsUnearthed = (codex.totalGemsUnearthed || 0) + 1;
    const gemDef = GEM_CATALOG[droppedGemId];
    addExpeditionTradeItem(gemDef.id, gemDef.name, gemDef.baseValue, 1, 'Gem', state);
    if (state === gameState) {
      actionCallbacks.log(`💎 Unearthed uncut ${gemDef.name} (${gemDef.desc}) from the vein!`, 'good');
    }
  }

  emitEngineEvent(ENGINE_EVENTS.ORE_MINED, {
    oreId: ore.id,
    tile,
    freeMine,
    gemDropped: droppedGemId,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);

  if (state === gameState) {
    playSound('mine');
    actionCallbacks.floatingText(x, y, `+1 ${ore.name}${freeMine ? ' (FREE!)' : ''}`, ore.sparkle);
    actionCallbacks.log(`Mined ${ore.name} (+1 to Pack). Pickaxe: ${pick.curDur}/${getPickaxeMaxDurability(state)}.`, 'gold');

    // Geode bonus equipment roll
    if (tile === TILE_ORE_GEODE && Math.random() < 0.45) {
      const rarityBonus = (state.dungeon && state.dungeon.config && state.dungeon.config.lootRarityBonus) || 0;
      const dropGear = generateProceduralEquipment(floor.depth, 'rare', null, rarityBonus);
      state.hero.expeditionGear.push(dropGear);
      actionCallbacks.log(`Cracked Relic Geode contained ${dropGear.name}!`, 'good');
    }

    gainExperience(ore.xp, state);
    actionCallbacks.updateFOV();
    actionCallbacks.updateUI();
  }

  return { ok: true, oreId: ore.id, freeMine, gemDropped: droppedGemId };
}

function resolveLapidaryTargetItem(targetRef, isEquipped, state) {
  if (!state || !state.hero) return null;
  if (isEquipped) {
    if (state.hero.equipment[targetRef]) {
      return state.hero.equipment[targetRef];
    }
    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
    for (let i = 0; i < slots.length; i++) {
      const eq = state.hero.equipment[slots[i]];
      if (eq && eq.uid === targetRef) return eq;
    }
    return null;
  }
  return state.guildVault.armory.find(g => g.uid === targetRef) || null;
}

export function socketGemIntoItem(targetRef, gemId, isEquipped = true, state = gameState) {
  const gemDef = GEM_CATALOG[gemId];
  if (!gemDef) return { ok: false, reason: 'invalid_gem' };

  const item = resolveLapidaryTargetItem(targetRef, isEquipped, state);
  if (!item) return { ok: false, reason: 'item_not_found' };
  normalizeEquipmentSockets(item);

  if (item.slot === 'pickaxe' || (item.maxSockets || 0) <= 0) {
    if (state === gameState) actionCallbacks.log(`${item.name} has no Astral Gem sockets.`, 'bad');
    return { ok: false, reason: 'no_sockets' };
  }
  if (item.sockets.length >= item.maxSockets) {
    if (state === gameState) actionCallbacks.log(`All gem sockets on ${item.name} are already filled.`, 'bad');
    return { ok: false, reason: 'sockets_full' };
  }
  if (!state.guildVault.gems || (state.guildVault.gems[gemId] || 0) <= 0) {
    if (state === gameState) actionCallbacks.log(`No banked ${gemDef.name} in your Guild Vault.`, 'bad');
    return { ok: false, reason: 'no_gem_in_vault' };
  }

  state.guildVault.gems[gemId] -= 1;
  item.sockets.push(gemId);
  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(`💎 Socketed ${gemDef.name} (${gemDef.desc}) into ${item.name}!`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, gemId, sockets: item.sockets.slice() };
}

export function unsocketGemFromItem(targetRef, socketIndex = 0, isEquipped = true, state = gameState) {
  const item = resolveLapidaryTargetItem(targetRef, isEquipped, state);
  if (!item) return { ok: false, reason: 'item_not_found' };
  normalizeEquipmentSockets(item);

  if (socketIndex < 0 || socketIndex >= item.sockets.length) {
    return { ok: false, reason: 'empty_socket' };
  }
  if (state.guildVault.gold < LAPIDARY_UNSOCKET_COST) {
    if (state === gameState) {
      actionCallbacks.log(`Need ${LAPIDARY_UNSOCKET_COST} Vault Gold for the Lapidary to extract a socketed gem.`, 'bad');
    }
    return { ok: false, reason: 'no_gold' };
  }

  state.guildVault.gold -= LAPIDARY_UNSOCKET_COST;
  const removedGemId = item.sockets.splice(socketIndex, 1)[0];
  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }
  state.guildVault.gems[removedGemId] = (state.guildVault.gems[removedGemId] || 0) + 1;
  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    const gemDef = GEM_CATALOG[removedGemId];
    playSound('gold');
    actionCallbacks.log(`Extracted ${gemDef ? gemDef.name : removedGemId} from ${item.name} back to Guild Vault (-${LAPIDARY_UNSOCKET_COST}g).`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, gemId: removedGemId };
}

export function sellGemUnit(gemId, sellAll = false, state = gameState) {
  if (!state || !state.guildVault || !state.guildVault.gems) return 0;
  if (!state.inGuild) {
    if (state === gameState) actionCallbacks.log('Gem trading is only permitted in the Oakhaven Guild Bastion.', 'bad');
    return 0;
  }
  const count = state.guildVault.gems[gemId] || 0;
  if (count <= 0) return 0;

  const gemDef = GEM_CATALOG[gemId];
  const baseVal = gemDef ? gemDef.baseValue : 65;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const qtyToSell = sellAll ? count : 1;
  const payout = Math.round(baseVal * qtyToSell * mult);

  state.guildVault.gems[gemId] -= qtyToSell;
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${qtyToSell}x ${gemDef ? gemDef.name : gemId} at Assay Counter for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

// ============================================================================
// SUBTERRANEAN ASTRAL SHRINES & TACTICAL RUNIC TRAPS
// ============================================================================

export function detectNearbyTraps(floor, state = gameState) {
  if (!floor || !floor.tiles || !state || !state.hero) return 0;
  const h = state.hero;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const vision = h.visionRadius || 5;
  const spotScore = (h.computedDex || 10) * 2 + vision * 6;
  const threshold = 26 + (floor.depth || 1) * 3;
  const isScoutClass = h.classId === 'thief' || h.classId === 'ranger';
  let spottedCount = 0;

  const minY = Math.max(0, Math.floor(h.y - vision - 1));
  const maxY = Math.min(fh - 1, Math.ceil(h.y + vision + 1));
  const minX = Math.max(0, Math.floor(h.x - vision - 1));
  const maxX = Math.min(fw - 1, Math.ceil(h.x + vision + 1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (floor.tiles[y][x] !== TILE_TRAP_HIDDEN) continue;
      const dist = Math.hypot(x - h.x, y - h.y);
      if (dist > vision + 0.35) continue;

      if ((isScoutClass && dist <= 2.5) || spotScore >= threshold) {
        floor.tiles[y][x] = TILE_TRAP_VISIBLE;
        spottedCount += 1;
        if (state === gameState) {
          const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
          const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
          actionCallbacks.floatingText(x, y, '⚠ TRAP SPOTTED!', '#fbbf24');
          actionCallbacks.log(`Keen senses revealed a ${tDef.name} at (${x}, ${y})!`, 'gold');
        }
      }
    }
  }
  return spottedCount;
}

export function activateAstralShrine(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || floor.tiles[y][x] !== TILE_SHRINE) {
    return { ok: false, reason: 'not_shrine' };
  }

  const h = state.hero;
  const sMeta = (floor.shrines && floor.shrines[`${x},${y}`]) || { type: 'sanctuary' };
  const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;

  floor.tiles[y][x] = TILE_SHRINE_USED;
  h.x = x;
  h.y = y;

  if (sDef.id === 'sanctuary') {
    const hpGain = Math.round(h.maxHp * 0.50);
    const mpGain = Math.round(h.maxMp * 0.50);
    h.hp = Math.min(h.maxHp, h.hp + hpGain);
    h.mp = Math.min(h.maxMp, h.mp + mpGain);
    h.statuses = (h.statuses || []).filter(s => !!s.isBuff);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(x, y, `+${hpGain} HP / +${mpGain} MP`, sDef.color);
      actionCallbacks.log(`✨ Touched ${sDef.name}: Restored +${hpGain} HP, +${mpGain} MP & cleansed afflictions!`, 'good');
    }
  } else {
    applyStatusEffect(h, sDef.statusId, sDef.duration);
    recomputeHeroDerivedStats(false, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.floatingText(x, y, `${sDef.statusName.toUpperCase()}!`, sDef.color);
      actionCallbacks.log(`✨ Touched ${sDef.name}: ${sDef.desc}`, 'good');
    }
  }

  const codex = ensureCodexState(state);
  codex.totalShrinesActivated = (codex.totalShrinesActivated || 0) + 1;

  detectNearbyTraps(floor, state);
  emitEngineEvent(ENGINE_EVENTS.SHRINE_ACTIVATED, {
    shrineType: sDef.id,
    floorDepth: floor.depth,
    dungeonId: state.activeDungeonId
  }, state);
  return { ok: true, shrineType: sDef.id };
}

export function resolveTrapInteraction(x, y, state = gameState) {
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return { ok: false, reason: 'no_floor' };
  const tile = floor.tiles[y][x];
  if (tile !== TILE_TRAP_HIDDEN && tile !== TILE_TRAP_VISIBLE) {
    return { ok: false, reason: 'not_trap' };
  }

  const h = state.hero;
  const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
  const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;

  floor.tiles[y][x] = TILE_TRAP_DISARMED;
  h.x = x;
  h.y = y;

  const canDisarm = tile === TILE_TRAP_VISIBLE && (h.classId === 'thief' || h.classId === 'ranger');
  if (canDisarm) {
    const xpGain = 15 + (floor.depth || 1) * 5;
    gainExperience(xpGain, state);
    if (state === gameState) {
      playSound('gold');
      actionCallbacks.floatingText(x, y, `DISARMED (+${xpGain} XP)`, '#34d399');
      actionCallbacks.log(`Disarmed ${tDef.name} safely (+${xpGain} XP)!`, 'good');
    }
    detectNearbyTraps(floor, state);
    return { ok: true, disarmed: true, triggered: false, dmg: 0, trapType: tDef.id, fatal: false };
  }

  const rawDmg = tDef.baseDmg + (floor.depth || 1) * tDef.depthScale;
  const dmg = Math.max(3, rawDmg - Math.floor((h.def || 0) * 0.4));
  h.hp -= dmg;
  applyStatusEffect(h, tDef.statusId, tDef.statusDuration);

  if (state === gameState) {
    playSound('hit');
    actionCallbacks.floatingText(x, y, `TRAP! -${dmg}`, tDef.color);
    actionCallbacks.log(`Triggered ${tDef.name} for ${dmg} damage and ${tDef.statusId.toUpperCase()}!`, 'bad');
  }

  detectNearbyTraps(floor, state);
  return {
    ok: true,
    disarmed: false,
    triggered: true,
    dmg,
    statusId: tDef.statusId,
    trapType: tDef.id,
    fatal: h.hp <= 0,
    killerName: tDef.name
  };
}

// ============================================================================
// CONSUMABLES, EXTRACTION, DEFEAT SALVAGE, SHOP & RESEARCH
// ============================================================================

export function useHealingTonic(state = gameState) {
  if (state.inGuild) {
    if (state === gameState) actionCallbacks.log('Use the Sanctuary Hearth to rest for free while in the Guild.', 'info');
    return false;
  }
  const h = state.hero;
  if (((h.consumables && h.consumables.potions) || 0) <= 0) {
    if (state === gameState) actionCallbacks.log('No Healing Tonics remaining!', 'bad');
    return false;
  }
  const hasNegativeAffliction = (h.statuses || []).some(s => !s.isBuff);
  if (h.hp >= h.maxHp && !hasNegativeAffliction) {
    if (state === gameState) actionCallbacks.log('You are already at full health.', 'info');
    return false;
  }

  h.consumables.potions -= 1;
  const heal = Math.round(h.maxHp * 0.45);
  h.hp = Math.min(h.maxHp, h.hp + heal);
  h.statuses = (h.statuses || []).filter(s => s.id !== 'bleed' && s.id !== 'poison');

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.floatingText(h.x, h.y, `+${heal} HP`, '#34d399');
    actionCallbacks.log(`Quaffed Healing Tonic (+${heal} HP, toxins purged).`, 'good');
    actionCallbacks.onTurnEnd();
  }
  return true;
}

function recordDungeonDepthInCodex(state) {
  if (!state || !state.dungeon) return;
  const codex = ensureCodexState(state);
  const dId = state.activeDungeonId || state.dungeon.id;
  const curFl = state.dungeon.currentFloor || 1;
  const cfg = state.dungeon.config || {};
  if (!codex.deepestFloorByDungeon[dId]) {
    codex.deepestFloorByDungeon[dId] = {
      name: state.dungeon.name,
      deepestFloor: curFl,
      maxDepth: cfg.maxDepth || 999
    };
  } else {
    const entry = codex.deepestFloorByDungeon[dId];
    entry.name = state.dungeon.name;
    entry.deepestFloor = Math.max(entry.deepestFloor || 1, curFl);
    entry.maxDepth = cfg.maxDepth || 999;
  }
}

export function extractToGuild(method = 'Floor 1 Ascending Stairs (<)', state = gameState) {
  const h = state.hero;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const codex = ensureCodexState(state);
  codex.totalExtractions = (codex.totalExtractions || 0) + 1;
  recordDungeonDepthInCodex(state);

  if (!state.guildVault.gems) {
    state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }

  let goldEarned = 0;
  let oresBanked = 0;
  let gemsBanked = 0;
  const gearBanked = h.expeditionGear.length;

  for (const item of h.expeditionPack) {
    if (MINERAL_IDS.includes(item.id)) {
      state.guildVault[item.id] = (state.guildVault[item.id] || 0) + item.qty;
      oresBanked += item.qty;
    } else if (GEM_IDS.includes(item.id)) {
      state.guildVault.gems[item.id] = (state.guildVault.gems[item.id] || 0) + item.qty;
      gemsBanked += item.qty;
    } else {
      goldEarned += Math.round(item.val * item.qty * mult);
    }
  }

  for (const gear of h.expeditionGear) {
    state.guildVault.armory.push(normalizeEquipmentSockets(gear));
  }

  state.guildVault.gold += goldEarned;
  const claimedBounties = payoutCompletedBounties(state);

  h.expeditionPack = [];
  h.expeditionGear = [];
  h.statuses = [];
  h.usedDivineIntervention = false;
  recomputeHeroDerivedStats(true, state);
  state.inGuild = true;

  if (state === gameState) {
    saveGame();
    actionCallbacks.updateUI();
    const details = [
      `Extraction Method: ${method}`,
      `Minerals Banked to Vault: ${oresBanked} ores`,
      `Astral Gems Banked to Vault: ${gemsBanked} gems`,
      `Equipment Secured to Armory: ${gearBanked} items`,
      `Relics Appraised to Gold: +${goldEarned}g`
    ];
    if (claimedBounties.length > 0) {
      details.push(`Bounties Claimed: ${claimedBounties.join(' • ')}`);
    }
    details.push(`Total Vault Gold: ${state.guildVault.gold}g`);

    actionCallbacks.outcomeModal(
      'Safe Extraction Complete!',
      `You returned to the Grand Guild via ${method}. All gathered minerals, uncut Astral Gems, equipment, and completed Notice Board rewards have been secured.`,
      details
    );
  }

  emitEngineEvent(ENGINE_EVENTS.EXTRACTED, {
    method,
    oresBanked,
    gemsBanked,
    gearBanked,
    goldEarned,
    claimedBounties
  }, state);

  return { oresBanked, gemsBanked, gearBanked, goldEarned, claimedBounties };
}

export function useRecallScroll(state = gameState) {
  if (state.inGuild) return false;
  const h = state.hero;
  if (((h.consumables && h.consumables.recalls) || 0) <= 0) {
    if (state === gameState) {
      actionCallbacks.floatingText(h.x, h.y, 'No Recall Scrolls!', '#f87171');
      actionCallbacks.log('No Recall Scrolls remaining! Retreat to Floor 1 Ascending Stairs (<) to extract.', 'bad');
    }
    return false;
  }

  h.consumables.recalls -= 1;
  if (state === gameState) playSound('spell');
  extractToGuild('Astral Recall Scroll', state);
  return true;
}

export function handleHeroDefeat(killerName = 'Abyssal Guardian', state = gameState) {
  const h = state.hero;
  const vRank = state.guildResearch.vanguard || 0;
  const recoveryPct = vRank * 0.20;

  const codex = ensureCodexState(state);
  codex.totalDefeats = (codex.totalDefeats || 0) + 1;
  recordDungeonDepthInCodex(state);

  let packValue = 0;
  h.expeditionPack.forEach(i => { packValue += i.val * i.qty; });
  h.expeditionGear.forEach(g => { packValue += (g.value || 20); });

  const salvagedGold = Math.round(packValue * recoveryPct);
  const lostGearCount = h.expeditionGear.length;
  const lostOreCount = h.expeditionPack.reduce((s, i) => s + i.qty, 0);

  state.guildVault.gold += salvagedGold;
  h.expeditionPack = [];
  h.expeditionGear = [];
  h.statuses = [];
  h.usedDivineIntervention = false;
  recomputeHeroDerivedStats(true, state);
  state.inGuild = true;

  if (state === gameState) {
    playSound('hit');
    actionCallbacks.log(`Defeated by ${killerName}! Rescued by Guild Scouts. Vanguard Pact salvaged +${salvagedGold}g.`, 'bad');
    saveGame();
    actionCallbacks.updateUI();
    actionCallbacks.outcomeModal(
      'Expedition Defeat — Rescued by Guild Scouts',
      `You fell to ${killerName} on Floor ${state.dungeon.currentFloor} of ${state.dungeon.name}. Oakhaven scouts recovered you to the surface. Your character level, equipped loadout, and Guild Vault remain intact!`,
      [
        `Defeated By: ${killerName} (Floor ${state.dungeon.currentFloor})`,
        `Unbanked Pack Items Lost: ${lostOreCount}`,
        `Unbanked Equipment Lost: ${lostGearCount}`,
        `Vanguard Pact Salvage (${vRank * 20}%): +${salvagedGold}g`,
        `Persistent Dungeon: ${state.dungeon.name} (${state.dungeon.seedCode})`
      ]
    );
  }

  emitEngineEvent(ENGINE_EVENTS.HERO_DEFEATED, {
    killerName,
    floorDepth: state.dungeon.currentFloor,
    dungeonId: state.activeDungeonId,
    salvagedGold,
    lostOreCount,
    lostGearCount
  }, state);

  return { salvagedGold, lostOreCount, lostGearCount };
}

export function buyShopItem(itemId, state = gameState) {
  const shopItem = SHOP_ITEMS.find(s => s.id === itemId);
  if (!shopItem) return { ok: false, reason: 'invalid_item' };

  const qmRank = state.guildResearch.quartermaster || 0;
  if (qmRank < shopItem.reqQM) {
    if (state === gameState) actionCallbacks.log(`Requires Quartermaster Requisitions Rank ${shopItem.reqQM}.`, 'bad');
    return { ok: false, reason: 'locked_tier' };
  }

  if (state.guildVault.gold < shopItem.cost) {
    if (state === gameState) actionCallbacks.log(`Insufficient Vault Gold! Need ${shopItem.cost}g.`, 'bad');
    return { ok: false, reason: 'no_gold' };
  }

  state.guildVault.gold -= shopItem.cost;

  if (shopItem.id === 'buy_heal') {
    state.hero.consumables.potions += 1;
  } else if (shopItem.id === 'buy_recall') {
    state.hero.consumables.recalls += 1;
  } else if (shopItem.slot === 'pickaxe') {
    state.hero.equipment.pickaxe = {
      uid: nextItemUid('pick'),
      name: shopItem.name,
      slot: 'pickaxe',
      rarity: shopItem.rarity,
      maxDur: shopItem.maxDur,
      curDur: Math.round(shopItem.maxDur * (1 + (state.guildResearch.toolsmithing || 0) * 0.5)),
      value: Math.round(shopItem.cost * 0.6),
      affixes: [],
      maxSockets: 0,
      sockets: []
    };
  } else if (shopItem.type === 'gear') {
    const boughtGear = {
      uid: nextItemUid('shop'),
      name: shopItem.name,
      slot: shopItem.slot,
      rarity: shopItem.rarity,
      atk: shopItem.atk || 0,
      def: shopItem.def || 0,
      str: shopItem.str || 0,
      crit: shopItem.crit || 0,
      maxHp: shopItem.maxHp || 0,
      value: Math.round(shopItem.cost * 0.6),
      affixes: [],
      maxSockets: rollSocketCountForRarity(shopItem.rarity, shopItem.slot),
      sockets: []
    };
    state.guildVault.armory.push(boughtGear);
  }

  if (state === gameState) {
    playSound('gold');
    recomputeHeroDerivedStats(false, state);
    actionCallbacks.log(`Purchased ${shopItem.name} for ${shopItem.cost}g.`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true };
}

export function sellMineralUnit(mineralId, sellAll = false, state = gameState) {
  if (!state || !state.guildVault) return 0;
  if (!state.inGuild) {
    if (state === gameState) actionCallbacks.log('Mineral smelting and sales are only permitted in the Oakhaven Guild Bastion.', 'bad');
    return 0;
  }
  const count = state.guildVault[mineralId] || 0;
  if (count <= 0) return 0;

  const oreDef = Object.values(ORE_CATALOG).find(o => o.id === mineralId);
  const baseVal = oreDef ? oreDef.baseValue : 10;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  const qtyToSell = sellAll ? count : 1;
  const payout = Math.round(baseVal * qtyToSell * mult);

  state.guildVault[mineralId] -= qtyToSell;
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${qtyToSell}x ${oreDef ? oreDef.name : mineralId} at Assay Counter for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

export function sellAllOresAtAssay(state = gameState) {
  if (!state || !state.inGuild) {
    if (state === gameState) actionCallbacks.log('Assay smelting is only permitted in the Oakhaven Guild Bastion.', 'bad');
    return 0;
  }
  let totalPayout = 0;
  for (const mId of MINERAL_IDS) {
    if ((state.guildVault[mId] || 0) > 0) {
      totalPayout += sellMineralUnit(mId, true, state);
    }
  }
  if (state === gameState && totalPayout === 0) {
    actionCallbacks.log('No banked minerals in Vault to smelt/sell.', 'info');
  }
  return totalPayout;
}

export function sellArmoryItem(uid, state = gameState) {
  if (!state || !state.guildVault || !state.guildVault.armory) return 0;
  if (!state.inGuild) {
    if (state === gameState) actionCallbacks.log('Equipment liquidation is only permitted in the Oakhaven Guild Bastion.', 'bad');
    return 0;
  }
  const idx = state.guildVault.armory.findIndex(g => g.uid === uid);
  if (idx === -1) return 0;
  if (state.guildVault.armory[idx].locked) {
    if (state === gameState) actionCallbacks.log(`${state.guildVault.armory[idx].name} is locked/kept. Unlock it before selling.`, 'bad');
    return 0;
  }
  const item = state.guildVault.armory.splice(idx, 1)[0];

  // Return any socketed gems safely to Guild Vault before selling the frame
  if (Array.isArray(item.sockets) && item.sockets.length > 0) {
    if (!state.guildVault.gems) {
      state.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
    }
    item.sockets.forEach(gId => {
      state.guildVault.gems[gId] = (state.guildVault.gems[gId] || 0) + 1;
    });
  }

  const assayRank = state.guildResearch.assay || 0;
  const payout = Math.round((item.value || 15) * (1 + assayRank * 0.35));
  state.guildVault.gold += payout;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Appraised & sold ${item.name} for +${payout}g.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return payout;
}

export function toggleItemLock(uid, state = gameState) {
  if (!uid || !state) return { ok: false, reason: 'invalid_args' };

  let targetItem = null;

  // Check Armory
  if (state.guildVault && Array.isArray(state.guildVault.armory)) {
    targetItem = state.guildVault.armory.find(g => g.uid === uid);
  }

  // Check Expedition Gear
  if (!targetItem && state.hero && Array.isArray(state.hero.expeditionGear)) {
    targetItem = state.hero.expeditionGear.find(g => g.uid === uid);
  }

  // Check Equipped Slots
  if (!targetItem && state.hero && state.hero.equipment) {
    const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    for (let i = 0; i < slots.length; i++) {
      const eq = state.hero.equipment[slots[i]];
      if (eq && eq.uid === uid) {
        targetItem = eq;
        break;
      }
    }
  }

  if (!targetItem) {
    return { ok: false, reason: 'item_not_found' };
  }

  targetItem.locked = !targetItem.locked;

  if (state === gameState) {
    playSound('click');
    const msg = targetItem.locked
      ? `🔒 Marked ${targetItem.name} as Kept/Locked (protected from bulk sale).`
      : `🔓 Unlocked ${targetItem.name} (eligible for bulk sale).`;
    actionCallbacks.log(msg, 'info');
    saveGame();
    actionCallbacks.updateUI();
  }

  return { ok: true, locked: targetItem.locked, item: targetItem };
}

export function autoEquipBestGear(state = gameState) {
  if (!state || !state.hero || !state.guildVault) {
    return { ok: false, reason: 'invalid_state', equippedCount: 0 };
  }

  const h = state.hero;
  if (!h.equipment) {
    h.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };
  }

  const armory = state.guildVault.armory || [];
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
  let equippedCount = 0;
  const equippedNames = [];

  for (let sIdx = 0; sIdx < slots.length; sIdx++) {
    const slot = slots[sIdx];
    const candidates = armory.filter(g => g && g.slot === slot);
    if (candidates.length === 0) continue;

    candidates.sort((a, b) => computeItemPowerScore(b) - computeItemPowerScore(a));
    const bestCandidate = candidates[0];
    const bestScore = computeItemPowerScore(bestCandidate);

    const curEq = h.equipment[slot];
    const curScore = curEq ? computeItemPowerScore(curEq) : -1;

    if (bestScore > curScore) {
      const armoryIdx = armory.indexOf(bestCandidate);
      if (armoryIdx !== -1) {
        armory.splice(armoryIdx, 1);
      }
      h.equipment[slot] = bestCandidate;
      if (curEq) {
        armory.push(curEq);
      }
      equippedCount++;
      equippedNames.push(bestCandidate.name);
    }
  }

  if (equippedCount > 0) {
    recomputeHeroDerivedStats(false, state);
    if (state === gameState) {
      playSound('lvl');
      actionCallbacks.log(`⚡ Auto-equipped ${equippedCount} upgrade(s): ${equippedNames.join(', ')}!`, 'gold');
      saveGame();
      actionCallbacks.updateUI();
    }
  } else {
    if (state === gameState) {
      actionCallbacks.log('⚡ You already have your highest-power gear equipped in all slots.', 'info');
    }
  }

  return { ok: true, equippedCount, equippedNames };
}

export function sellAllSpareGear(rarityFilter = null, state = gameState) {
  let rFilter = rarityFilter;
  let targetState = state;
  if (rarityFilter && typeof rarityFilter === 'object' && rarityFilter.guildVault) {
    targetState = rarityFilter;
    rFilter = null;
  }
  if (!targetState || !targetState.guildVault) return 0;
  if (!targetState.inGuild) {
    if (targetState === gameState) actionCallbacks.log('Equipment liquidation is only permitted in the Oakhaven Guild Bastion.', 'bad');
    return 0;
  }

  const armory = targetState.guildVault.armory || [];
  if (armory.length === 0) {
    if (targetState === gameState) actionCallbacks.log('No spare equipment in Vault Armory to sell.', 'info');
    return 0;
  }

  const itemsToSell = [];
  const itemsToKeep = [];

  for (let i = 0; i < armory.length; i++) {
    const g = armory[i];
    const matchesRarity = !rFilter || rFilter === 'all' || g.rarity === rFilter;
    if (matchesRarity && !g.locked) {
      itemsToSell.push(g);
    } else {
      itemsToKeep.push(g);
    }
  }

  if (itemsToSell.length === 0) {
    if (targetState === gameState) {
      const lockNote = armory.some(g => g.locked) ? ' (all matching items are locked)' : '';
      actionCallbacks.log(`No eligible ${rFilter ? rFilter + ' ' : ''}spare gear to sell${lockNote}.`, 'info');
    }
    return 0;
  }

  const assayRank = targetState.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  let total = 0;
  if (!targetState.guildVault.gems) {
    targetState.guildVault.gems = { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };
  }

  itemsToSell.forEach(g => {
    if (Array.isArray(g.sockets)) {
      g.sockets.forEach(gId => {
        targetState.guildVault.gems[gId] = (targetState.guildVault.gems[gId] || 0) + 1;
      });
    }
    total += Math.round((g.value || 15) * mult);
  });

  targetState.guildVault.armory = itemsToKeep;
  targetState.guildVault.gold += total;

  if (targetState === gameState) {
    playSound('gold');
    const label = rFilter ? `${rFilter.toUpperCase()}` : 'spare';
    actionCallbacks.log(`Sold ${itemsToSell.length} ${label} armory items with Assay bonus for +${total}g!`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }
  return total;
}

export function purchaseResearchRank(projId, state = gameState) {
  const proj = RESEARCH_PROJECTS[projId];
  if (!proj) return { ok: false, reason: 'invalid_project' };

  const curRank = state.guildResearch[projId] || 0;
  if (curRank >= proj.levels.length - 1) return { ok: false, reason: 'max_rank' };

  const nextSpec = proj.levels[curRank + 1];
  if (state.guildVault.gold < nextSpec.costGold) {
    if (state === gameState) actionCallbacks.log(`Need ${nextSpec.costGold} Banked Gold for ${proj.name}.`, 'bad');
    return { ok: false, reason: 'insufficient_gold' };
  }

  for (const [oreId, reqQty] of Object.entries(nextSpec.costOre)) {
    if ((state.guildVault[oreId] || 0) < reqQty) {
      if (state === gameState) actionCallbacks.log(`Need ${reqQty} ${oreId.toUpperCase()} in Vault for ${proj.name}.`, 'bad');
      return { ok: false, reason: 'insufficient_ore' };
    }
  }

  state.guildVault.gold -= nextSpec.costGold;
  for (const [oreId, reqQty] of Object.entries(nextSpec.costOre)) {
    state.guildVault[oreId] -= reqQty;
  }
  state.guildResearch[projId] = curRank + 1;

  if (state === gameState) {
    playSound('lvl');
    recomputeHeroDerivedStats(false, state);
    if (projId === 'toolsmithing' && state.hero.equipment.pickaxe) {
      state.hero.equipment.pickaxe.curDur = getPickaxeMaxDurability(state);
    }
    actionCallbacks.log(`Researched ${proj.name} Rank ${curRank + 1}! (${nextSpec.desc})`, 'good');
    saveGame();
    actionCallbacks.updateUI();
  }
  return { ok: true, newRank: curRank + 1 };
}

export function equipItem(itemUid, state = gameState) {
  if (!itemUid || !state || !state.hero) {
    return { ok: false, reason: 'invalid_args' };
  }
  const h = state.hero;
  if (!h.equipment) {
    h.equipment = { weapon: null, armor: null, helm: null, boots: null, accessory: null, pickaxe: null };
  }

  let sourceArray = null;
  let sourceIndex = -1;
  let item = null;

  if (Array.isArray(h.expeditionGear)) {
    sourceIndex = h.expeditionGear.findIndex(g => g && g.uid === itemUid);
    if (sourceIndex !== -1) {
      sourceArray = h.expeditionGear;
      item = h.expeditionGear[sourceIndex];
    }
  }

  if (!item && state.guildVault && Array.isArray(state.guildVault.armory)) {
    sourceIndex = state.guildVault.armory.findIndex(g => g && g.uid === itemUid);
    if (sourceIndex !== -1) {
      sourceArray = state.guildVault.armory;
      item = state.guildVault.armory[sourceIndex];
    }
  }

  if (!item || !item.slot) {
    return { ok: false, reason: 'item_not_found' };
  }

  const slot = item.slot;
  const prev = h.equipment[slot] || null;

  sourceArray.splice(sourceIndex, 1);
  h.equipment[slot] = item;
  if (prev) {
    sourceArray.push(prev);
  }

  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    playSound('lvl');
    actionCallbacks.log(`Equipped ${item.name} to ${slot.toUpperCase()}${prev ? ` (swapped with ${prev.name})` : ''}.`, 'gold');
    saveGame();
    actionCallbacks.updateUI();
  }

  return { ok: true, slot, equipped: item, unequipped: prev };
}

export function unequipItem(slot, state = gameState) {
  if (!slot || !state || !state.hero || !state.hero.equipment) {
    return { ok: false, reason: 'invalid_args' };
  }

  if (slot === 'pickaxe') {
    if (state === gameState) {
      actionCallbacks.log('Pickaxe cannot be unequipped directly; equip an alternate pickaxe to replace it.', 'bad');
    }
    return { ok: false, reason: 'cannot_unequip_pickaxe' };
  }

  const item = state.hero.equipment[slot];
  if (!item) {
    return { ok: false, reason: 'slot_empty' };
  }

  state.hero.equipment[slot] = null;

  if (!state.inGuild) {
    if (!state.hero.expeditionGear) state.hero.expeditionGear = [];
    state.hero.expeditionGear.push(item);
  } else {
    if (!state.guildVault) state.guildVault = {};
    if (!state.guildVault.armory) state.guildVault.armory = [];
    state.guildVault.armory.push(item);
  }

  recomputeHeroDerivedStats(false, state);

  if (state === gameState) {
    playSound('click');
    actionCallbacks.log(`Unequipped ${item.name} from ${slot.toUpperCase()}.`, 'info');
    saveGame();
    actionCallbacks.updateUI();
  }

  return { ok: true, slot, unequipped: item };
}

export function dropItem(uidOrId, isGear = true, state = gameState) {
  if (!uidOrId || !state || !state.hero) {
    return { ok: false, reason: 'invalid_args' };
  }

  const h = state.hero;
  let droppedItem = null;

  if (isGear) {
    if (Array.isArray(h.expeditionGear)) {
      const idx = h.expeditionGear.findIndex(g => g && (g.uid === uidOrId || g.instanceId === uidOrId));
      if (idx !== -1) {
        droppedItem = h.expeditionGear.splice(idx, 1)[0];
      }
    }
    if (!droppedItem && state.guildVault && Array.isArray(state.guildVault.armory)) {
      const aIdx = state.guildVault.armory.findIndex(g => g && (g.uid === uidOrId || g.instanceId === uidOrId));
      if (aIdx !== -1) {
        droppedItem = state.guildVault.armory.splice(aIdx, 1)[0];
      }
    }
    if (!droppedItem) return { ok: false, reason: 'item_not_found' };
  } else {
    if (!Array.isArray(h.expeditionPack)) return { ok: false, reason: 'no_expedition_pack' };
    const idx = h.expeditionPack.findIndex(p => p && (p.id === uidOrId || p.instanceId === uidOrId || p.uid === uidOrId));
    if (idx === -1) return { ok: false, reason: 'item_not_found' };
    const orig = h.expeditionPack[idx];
    const origQty = typeof orig.quantity === 'number' ? orig.quantity : (typeof orig.qty === 'number' ? orig.qty : 1);
    if (origQty > 1) {
      droppedItem = Object.assign({}, orig, { quantity: 1, qty: 1 });
      if (typeof orig.quantity === 'number') orig.quantity -= 1;
      if (typeof orig.qty === 'number') orig.qty -= 1;
    } else {
      droppedItem = h.expeditionPack.splice(idx, 1)[0];
    }
  }

  // If inside dungeon, create a physical WorldItemPickupInstance on the floor
  if (!state.inGuild && state.dungeon) {
    const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
    if (floor) {
      const pickup = createWorldItemPickupInstance(droppedItem, h.x, h.y);
      addWorldObject(floor, pickup);
    }
  }

  emitEngineEvent(ENGINE_EVENTS.ITEM_DROPPED, {
    item: droppedItem,
    x: h.x,
    y: h.y
  }, state);

  if (state === gameState) {
    playSound('click');
    actionCallbacks.log(`Dropped ${droppedItem.name} from inventory.`, 'info');
    saveGame();
    actionCallbacks.updateUI();
  }

  return { ok: true, dropped: droppedItem.name, item: droppedItem };
}

export function pickupGroundObjectsAt(x, y, state = gameState) {
  if (!state || state.inGuild || !state.hero) return 0;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor) return 0;

  const pickups = getObjectsAt(floor, x, y, o => o.objectType === 'pickup' && o.components && o.components.pickup);
  if (pickups.length === 0) return 0;

  const h = state.hero;
  if (!Array.isArray(h.expeditionPack)) h.expeditionPack = [];
  if (!Array.isArray(h.expeditionGear)) h.expeditionGear = [];

  let count = 0;
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i];
    const it = p.components.pickup.item;
    if (!it) continue;

    // Check if item can stack with existing item in expeditionPack
    let stacked = false;
    if (it.isStackable) {
      for (let j = 0; j < h.expeditionPack.length; j++) {
        const existing = h.expeditionPack[j];
        if (canItemsStack(existing, it)) {
          mergeItemStacks(existing, it);
          if ((it.quantity || 0) <= 0) {
            stacked = true;
            break;
          }
        }
      }
    }

    if (!stacked && (it.quantity || 1) > 0) {
      if (it.slot && it.slot !== 'pickaxe') {
        h.expeditionGear.push(it);
      } else {
        h.expeditionPack.push(it);
      }
    }

    removeWorldObject(floor, p.instanceId);
    count++;

    emitEngineEvent(ENGINE_EVENTS.ITEM_PICKED_UP, {
      item: it,
      x: x,
      y: y
    }, state);

    if (state === gameState) {
      playSound('gold');
      actionCallbacks.floatingText(x, y, `+${it.name}`, '#fbbf24');
      actionCallbacks.log(`Picked up ${it.name} from the ground.`, 'gold');
    }
  }

  if (count > 0 && state === gameState) {
    saveGame();
    actionCallbacks.updateUI();
  }

  return count;
}
