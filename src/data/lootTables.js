// Declarative Weighted Loot Tables for Breakable Props, Dungeon Containers & Treasure Chests (ADR-0012)

export const LOOT_TABLES = {
  loot_barrel_junk: {
    id: 'loot_barrel_junk',
    name: 'Barrel Rummage & Trash',
    entries: [
      { id: 'junk_splintered_mug', name: 'Splintered Wooden Mug',  kind: 'trash',      weight: 30, value: 0 },
      { id: 'junk_moldy_rations',  name: 'Moldy Hardtack',         kind: 'trash',      weight: 25, value: 0 },
      { id: 'junk_bent_nails',     name: 'Bent Iron Nails',        kind: 'trash',      weight: 20, value: 1 },
      { id: 'coin_copper_handful', name: 'Tarnished Copper Coins', kind: 'gold',       weight: 18, minGold: 2, maxGold: 5 },
      { id: 'salvage_torch_oil',   name: 'Intact Torch Oil Flask', kind: 'trade',      weight: 5,  value: 6 },
      { id: 'tonic_minor',         name: 'Dusty Healing Tonic',    kind: 'consumable', weight: 2,  consumableKey: 'potions', qty: 1 }
    ]
  },
  loot_crate_salvage: {
    id: 'loot_crate_salvage',
    name: 'Supply Crate Salvage',
    entries: [
      { id: 'junk_broken_tool',    name: 'Cracked Pick Handle',    kind: 'trash',      weight: 22, value: 1 },
      { id: 'coin_dwarven_bits',   name: 'Dwarven Trade Coins',    kind: 'gold',       weight: 40, minGold: 5, maxGold: 12 },
      { id: 'salvage_copper_ore',  name: 'Loose Copper Chunk',     kind: 'ore',        weight: 20, oreId: 'copper', qty: 1, value: 5 },
      { id: 'salvage_iron_scrap',  name: 'Forged Iron Scrap',      kind: 'trade',      weight: 12, value: 8 },
      { id: 'tonic_supply',        name: 'Guild Healing Tonic',    kind: 'consumable', weight: 6,  consumableKey: 'potions', qty: 1 }
    ]
  },
  loot_dungeon_chest: {
    id: 'loot_dungeon_chest',
    name: 'Dungeon Vault Chest',
    entries: [
      { id: 'chest_gold_pouch',    name: 'Gilded Coin Coffer',     kind: 'gold',       weight: 45, minGold: 25, maxGold: 55 },
      { id: 'chest_relic_gear',    name: 'Vault Equipment Cache',  kind: 'gear',       weight: 35 },
      { id: 'chest_mineral_satchel', name: 'Refined Ore Satchel',  kind: 'ore',        weight: 12, oreId: 'iron', qty: 3, value: 10 },
      { id: 'chest_recall_scroll', name: 'Astral Recall Scroll',   kind: 'consumable', weight: 8,  consumableKey: 'recalls', qty: 1 }
    ]
  }
};

export function rollLootTable(tableId, depth = 1, randFn = Math.random) {
  const table = LOOT_TABLES[tableId];
  if (!table || !Array.isArray(table.entries) || table.entries.length === 0) return null;

  let totalWeight = 0;
  for (let i = 0; i < table.entries.length; i++) {
    totalWeight += (table.entries[i].weight || 1);
  }
  if (totalWeight <= 0) return null;

  const r = (typeof randFn === 'function' ? randFn() : Math.random()) * totalWeight;
  let acc = 0;
  let picked = table.entries[0];
  for (let i = 0; i < table.entries.length; i++) {
    acc += (table.entries[i].weight || 1);
    if (r <= acc) {
      picked = table.entries[i];
      break;
    }
  }

  const out = Object.assign({}, picked);
  if (out.kind === 'gold') {
    const minG = out.minGold || 1;
    const maxG = Math.max(minG, out.maxGold || minG);
    const scale = 1 + Math.max(0, (depth || 1) - 1) * 0.12;
    const raw = minG + Math.floor((typeof randFn === 'function' ? randFn() : Math.random()) * (maxG - minG + 1));
    out.goldAmount = Math.max(1, Math.round(raw * scale));
  }
  return out;
}
