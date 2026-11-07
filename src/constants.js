// Core constants, grid dimensions, tile IDs, and rarity definitions

export const SCHEMA_VERSION = 'v0.4.0-inc4';
export const STORAGE_KEY = 'aethelgard_save_v4';

export const TILE_SIZE = 32;
export const GRID_W = 21;
export const GRID_H = 15;
export const VIEWPORT_WIDTH = GRID_W;
export const VIEWPORT_HEIGHT = GRID_H;

// Tile Constants
export const TILE_WALL = 0;
export const TILE_FLOOR = 1;
export const TILE_STAIRS_UP = 2;
export const TILE_STAIRS_DOWN = 3;
export const TILE_CHEST = 4;
export const TILE_CHEST_OPEN = 5;
export const TILE_SHRINE = 6;
export const TILE_SHRINE_USED = 7;
export const TILE_TRAP_HIDDEN = 8;
export const TILE_TRAP_VISIBLE = 9;
export const TILE_ORE_COPPER = 10;
export const TILE_ORE_IRON = 11;
export const TILE_ORE_MITHRIL = 12;
export const TILE_ORE_STAR = 13;
export const TILE_ORE_ASTRAL = 14;
export const TILE_ORE_GEODE = 15;
export const TILE_TRAP_DISARMED = 16;

// Increment 4 Economy Constants
export const LAPIDARY_UNSOCKET_COST = 15;
export const BOUNTY_REROLL_COST = 25;

// Rarity Definitions
export const RARITY = {
  common:   { id: 'common',   name: 'Common',            color: '#94a3b8', mult: 1.0, affixes: 0 },
  uncommon: { id: 'uncommon', name: 'Uncommon',          color: '#4ade80', mult: 1.4, affixes: 1 },
  rare:     { id: 'rare',     name: 'Rare',              color: '#60a5fa', mult: 2.0, affixes: 2 },
  epic:     { id: 'epic',     name: 'Epic',              color: '#c084fc', mult: 3.2, affixes: 3 },
  relic:    { id: 'relic',    name: 'Star-Forged Relic', color: '#fbbf24', mult: 5.5, affixes: 4 }
};
