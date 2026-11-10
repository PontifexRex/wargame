// Equipment Affix Pools, Quartermaster Shop Catalog, and Elite Monster Affixes

import { RARITY } from '../constants.js';

export { RARITY };

export const AFFIX_POOL = [
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

export const BASE_GEAR_NAMES = {
  weapon:    ['Star-Shard Blade', 'Runed Broadsword', 'Astral Longbow', 'Vespera Halberd', 'Obsidian Cleaver'],
  armor:     ['Astral Hauberk', 'Deepwood Brigandine', 'Star-Forged Plate', 'Shadowalker Coat', 'Runed Cuirass'],
  helm:      ['Visor of the Deep', 'Starweaver Hood', 'Ironbound Sallet', 'Astral Crown', 'Stalker Mask'],
  boots:     ['Greaves of Striding', 'Silent Sabatons', 'Starlight Treads', 'Dwarven Marchers', 'Windrunner Boots'],
  accessory: ['Vespera Signet', 'Astral Lens Charm', 'Pendant of Dawn', 'Bloodstone Ring', 'Star-Core Amulet']
};

export const SHOP_ITEMS = [
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

export const ELITE_AFFIXES = [
  { id: 'vampiric',   name: 'Vampiric',      color: '#f87171', desc: 'Heals for 40% of damage dealt' },
  { id: 'molten',     name: 'Molten',        color: '#fb923c', desc: 'Inflicts Burn on hit' },
  { id: 'venomous',   name: 'Venomous',      color: '#4ade80', desc: 'Inflicts Poison on hit' },
  { id: 'fortified',  name: 'Fortified',     color: '#60a5fa', desc: '+35% Defense & HP' },
  { id: 'reflective', name: 'Reflective',    color: '#ec4899', desc: 'Reflects 25% thorns damage back to attacker' },
  { id: 'chilling',   name: 'Chilling',      color: '#38bdf8', desc: 'Inflicts Chilled on hit (-15% Dodge, +2 Skill MP)' },
  { id: 'temporal',   name: 'Temporal Warp', color: '#a855f7', desc: '40% chance on damage to phase-shift away' },
  { id: 'volatile',   name: 'Volatile',      color: '#ef4444', desc: 'Detonates upon defeat for 150% ATK damage in 1-tile radius' }
];

export function computeItemPowerScore(item) {
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

export function isItemUpgrade(candidateItem, equipment) {
  if (!candidateItem || !candidateItem.slot) return false;
  if (!equipment) return true;
  const curEq = equipment[candidateItem.slot];
  if (!curEq) return true;
  return computeItemPowerScore(candidateItem) > computeItemPowerScore(curEq);
}
