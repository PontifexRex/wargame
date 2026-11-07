// Interactive Mining, Consumables, Extraction, Defeat Recovery, Quartermaster & Guild Research

import { TILE_FLOOR, TILE_ORE_GEODE } from '../constants.js';
import { ORE_CATALOG, MINERAL_IDS } from '../data/ores.js';
import { SHOP_ITEMS } from '../data/items.js';
import { RESEARCH_PROJECTS } from '../data/research.js';
import {
  gameState,
  saveGame,
  nextItemUid,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability
} from './state.js';
import { generateProceduralEquipment } from './procedural.js';
import { playSound } from './audio.js';

const actionCallbacks = {
  log: () => {},
  updateUI: () => {},
  floatingText: () => {},
  outcomeModal: () => {},
  updateFOV: () => {},
  onTurnEnd: () => {}
};

export function registerActionCallbacks(cbs) {
  Object.assign(actionCallbacks, cbs);
}

export function getActionCallbacks() {
  return actionCallbacks;
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

export function mineTile(x, y, state = gameState) {
  const floor = state.dungeon.floors[state.dungeon.currentFloor];
  if (!floor) return { ok: false, reason: 'no_floor' };

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

  addExpeditionTradeItem(ore.id, ore.name, ore.baseValue, 1, 'Ore', state);

  if (state === gameState) {
    playSound('mine');
    actionCallbacks.floatingText(x, y, `+1 ${ore.name}${freeMine ? ' (FREE!)' : ''}`, ore.sparkle);
    actionCallbacks.log(`Mined ${ore.name} (+1 to Pack). Pickaxe: ${pick.curDur}/${getPickaxeMaxDurability(state)}.`, 'gold');

    // Geode bonus equipment roll
    if (tile === TILE_ORE_GEODE && Math.random() < 0.45) {
      const dropGear = generateProceduralEquipment(floor.depth, 'rare');
      state.hero.expeditionGear.push(dropGear);
      actionCallbacks.log(`Cracked Relic Geode contained ${dropGear.name}!`, 'good');
    }

    gainExperience(ore.xp, state);
    actionCallbacks.updateFOV();
    actionCallbacks.updateUI();
  }

  return { ok: true, oreId: ore.id, freeMine };
}

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
  if (h.hp >= h.maxHp && (!h.statuses || h.statuses.length === 0)) {
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

export function extractToGuild(method = 'Floor 1 Ascending Stairs (<)', state = gameState) {
  const h = state.hero;
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;

  let goldEarned = 0;
  let oresBanked = 0;
  const gearBanked = h.expeditionGear.length;

  for (const item of h.expeditionPack) {
    if (MINERAL_IDS.includes(item.id)) {
      state.guildVault[item.id] = (state.guildVault[item.id] || 0) + item.qty;
      oresBanked += item.qty;
    } else {
      goldEarned += Math.round(item.val * item.qty * mult);
    }
  }

  for (const gear of h.expeditionGear) {
    state.guildVault.armory.push(gear);
  }

  state.guildVault.gold += goldEarned;
  h.expeditionPack = [];
  h.expeditionGear = [];
  h.statuses = [];
  h.usedDivineIntervention = false;
  h.hp = h.maxHp;
  h.mp = h.maxMp;
  state.inGuild = true;

  if (state === gameState) {
    saveGame();
    actionCallbacks.updateUI();
    actionCallbacks.outcomeModal(
      'Safe Extraction Complete!',
      `You returned to the Grand Guild via ${method}. All gathered minerals and equipment have been secured in your Guild Vault.`,
      [
        `Extraction Method: ${method}`,
        `Minerals Banked to Vault: ${oresBanked} ores`,
        `Equipment Secured to Armory: ${gearBanked} items`,
        `Relics Appraised to Gold: +${goldEarned}g`,
        `Total Vault Gold: ${state.guildVault.gold}g`
      ]
    );
  }
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
  h.hp = h.maxHp;
  h.mp = h.maxMp;
  state.inGuild = true;

  if (state === gameState) {
    playSound('hit');
    actionCallbacks.log(`Defeated by ${killerName}! Rescued by Guild Scouts. Vanguard Pact salvaged +${salvagedGold}g.`, 'bad');
    saveGame();
    actionCallbacks.updateUI();
    actionCallbacks.outcomeModal(
      'Expedition Defeat — Rescued by Guild Scouts',
      `You fell to ${killerName} on Floor ${state.dungeon.currentFloor}. Oakhaven scouts recovered you to the surface. Your character level, equipped loadout, and Guild Vault remain intact!`,
      [
        `Defeated By: ${killerName} (Floor ${state.dungeon.currentFloor})`,
        `Unbanked Minerals Lost: ${lostOreCount}`,
        `Unbanked Equipment Lost: ${lostGearCount}`,
        `Vanguard Pact Salvage (${vRank * 20}%): +${salvagedGold}g`,
        `Persistent Dungeon Seed: ${state.dungeon.seedCode}`
      ]
    );
  }

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
      affixes: []
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
      affixes: []
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
  const idx = state.guildVault.armory.findIndex(g => g.uid === uid);
  if (idx === -1) return 0;
  const item = state.guildVault.armory.splice(idx, 1)[0];
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

export function sellAllSpareGear(state = gameState) {
  if (state.guildVault.armory.length === 0) {
    if (state === gameState) actionCallbacks.log('No spare equipment in Vault Armory to sell.', 'info');
    return 0;
  }
  const assayRank = state.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  let total = 0;
  const count = state.guildVault.armory.length;
  state.guildVault.armory.forEach(g => {
    total += Math.round((g.value || 15) * mult);
  });
  state.guildVault.armory = [];
  state.guildVault.gold += total;

  if (state === gameState) {
    playSound('gold');
    actionCallbacks.log(`Sold ${count} spare armory items with Assay bonus for +${total}g!`, 'gold');
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
