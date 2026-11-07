// 6 Mineral Vein Types & Geology Requirements

import {
  TILE_ORE_COPPER,
  TILE_ORE_IRON,
  TILE_ORE_MITHRIL,
  TILE_ORE_GEODE,
  TILE_ORE_STAR,
  TILE_ORE_ASTRAL
} from '../constants.js';

export const ORE_CATALOG = {
  [TILE_ORE_COPPER]:  { id: 'copper',      name: 'Copper Ore',     baseValue: 10,  minGeology: 0, color: '#d97736', sparkle: '#fDBA74', xp: 10 },
  [TILE_ORE_IRON]:    { id: 'iron',        name: 'Iron Ore',       baseValue: 20,  minGeology: 1, color: '#94a3b8', sparkle: '#e2e8f0', xp: 18 },
  [TILE_ORE_MITHRIL]: { id: 'mithril',     name: 'Mithril Ore',    baseValue: 42,  minGeology: 2, color: '#38bdf8', sparkle: '#bae6fd', xp: 35 },
  [TILE_ORE_GEODE]:   { id: 'geode',       name: 'Relic Geode',    baseValue: 60,  minGeology: 2, color: '#f59e0b', sparkle: '#fef08a', xp: 45 },
  [TILE_ORE_STAR]:    { id: 'starcrystal', name: 'Star-Crystal',   baseValue: 90,  minGeology: 3, color: '#c084fc', sparkle: '#f3e8ff', xp: 70 },
  [TILE_ORE_ASTRAL]:  { id: 'astralite',   name: 'Void Astralite', baseValue: 150, minGeology: 3, color: '#ec4899', sparkle: '#fbcfe8', xp: 110 }
};

export const MINERAL_IDS = ['copper', 'iron', 'mithril', 'geode', 'starcrystal', 'astralite'];

export const MINERAL_DISPLAY = [
  { id: 'copper',      name: 'Copper',       color: '#d97736' },
  { id: 'iron',        name: 'Iron',         color: '#94a3b8' },
  { id: 'mithril',     name: 'Mithril',      color: '#38bdf8' },
  { id: 'geode',       name: 'Geodes',       color: '#f59e0b' },
  { id: 'starcrystal', name: 'Star-Crystal', color: '#c084fc' },
  { id: 'astralite',   name: 'Astralite',    color: '#ec4899' }
];
