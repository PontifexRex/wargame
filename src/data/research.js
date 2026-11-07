// 6 Dual-Cost Guild Research Tech Trees

export const RESEARCH_PROJECTS = {
  cartography: {
    id: 'cartography',
    name: 'Vault Cartography & Shoring',
    desc: 'Reinforces subterranean shafts and dispels depth wards to unlock deeper floors.',
    levels: [
      { depthPermit: 5,   costGold: 0,    costOre: {},                               desc: 'Permit: Floors 1 – 5' },
      { depthPermit: 10,  costGold: 90,   costOre: { copper: 3 },                    desc: 'Permit: Floor 10 (Starfall Colossus)' },
      { depthPermit: 20,  costGold: 220,  costOre: { iron: 4, copper: 4 },           desc: 'Permit: Floor 20 (Void Weaver)' },
      { depthPermit: 50,  costGold: 520,  costOre: { mithril: 5, starcrystal: 2 },   desc: 'Permit: Floor 50 (Deep Abyss)' },
      { depthPermit: 999, costGold: 1200, costOre: { astralite: 3, starcrystal: 5 }, desc: 'Permit: Infinite Abyssal Descent' }
    ]
  },
  geology: {
    id: 'geology',
    name: 'Subterranean Geology',
    desc: 'Trains miners to fracture denser cosmic mineral veins embedded in vault walls.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                       desc: 'Can mine Copper Ore veins' },
      { rank: 1, costGold: 70,  costOre: { copper: 4 },            desc: 'Unlocks Iron Ore extraction' },
      { rank: 2, costGold: 180, costOre: { iron: 5 },              desc: 'Unlocks Mithril Ore & Relic Geodes' },
      { rank: 3, costGold: 420, costOre: { mithril: 5, geode: 2 }, desc: 'Unlocks Star-Crystal & Void Astralite' }
    ]
  },
  toolsmithing: {
    id: 'toolsmithing',
    name: 'Dwarven Toolsmithing',
    desc: '+50% Max Pickaxe Durability and +20% chance per rank for durability-free mining strikes.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},            desc: 'Base Pickaxe Durability' },
      { rank: 1, costGold: 60,  costOre: { copper: 2 }, desc: '+50% Durability & 20% Free-Strike chance' },
      { rank: 2, costGold: 150, costOre: { iron: 4 },   desc: '+100% Durability & 40% Free-Strike chance' },
      { rank: 3, costGold: 340, costOre: { mithril: 4 },desc: '+150% Durability & 60% Free-Strike chance' }
    ]
  },
  assay: {
    id: 'assay',
    name: 'Antiquarian Assay & Smelting',
    desc: 'Increases gold payout by +35% per rank when selling ores, relics, and spare equipment.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                    desc: '100% Base Appraisal Value' },
      { rank: 1, costGold: 75,  costOre: { copper: 3 },         desc: '135% Appraisal Value (+35%)' },
      { rank: 2, costGold: 175, costOre: { iron: 4, geode: 1 }, desc: '170% Appraisal Value (+70%)' },
      { rank: 3, costGold: 380, costOre: { starcrystal: 3 },    desc: '205% Appraisal Value (+105%)' }
    ]
  },
  quartermaster: {
    id: 'quartermaster',
    name: 'Quartermaster Requisitions',
    desc: 'Expands the Guild Shop with higher-rarity weapons, armor, and masterwork pickaxes.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                               desc: 'Basic Supplies & Dwarven Steel Pickaxe' },
      { rank: 1, costGold: 85,  costOre: { copper: 3, iron: 2 },           desc: 'Unlocks Rare Runeblades & Mithril Pickaxe' },
      { rank: 2, costGold: 210, costOre: { mithril: 4, geode: 1 },         desc: 'Unlocks Epic Star-Armor & Titanium Pickaxe' },
      { rank: 3, costGold: 480, costOre: { starcrystal: 3, astralite: 1 }, desc: 'Unlocks Star-Forged Relics & Astral Drill' }
    ]
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard Recovery Pact',
    desc: 'Guild rescue scouts salvage 20% per rank of unbanked pack value if you fall in battle.',
    levels: [
      { rank: 0, costGold: 0,   costOre: {},                 desc: '0% Unbanked Loot Salvage on Defeat' },
      { rank: 1, costGold: 65,  costOre: { copper: 2 },      desc: '20% Unbanked Value Salvaged on Defeat' },
      { rank: 2, costGold: 160, costOre: { iron: 3 },        desc: '40% Unbanked Value Salvaged on Defeat' },
      { rank: 3, costGold: 320, costOre: { mithril: 3 },     desc: '60% Unbanked Value Salvaged on Defeat' },
      { rank: 4, costGold: 600, costOre: { starcrystal: 3 }, desc: '80% Unbanked Value Salvaged on Defeat' }
    ]
  }
};
