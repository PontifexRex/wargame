// Core constants, viewport dimensions, map scale presets, tile IDs, and rarity definitions

export const SCHEMA_VERSION = 'v0.4.5-atlas';
export const STORAGE_KEY = 'aethelgard_save_v5';

export const TILE_SIZE = 32;
export const VIEWPORT_WIDTH = 21;
export const VIEWPORT_HEIGHT = 15;

// Legacy viewport aliases + new exploration-scale default floor dimensions
export const GRID_W = VIEWPORT_WIDTH;
export const GRID_H = VIEWPORT_HEIGHT;
export const DEFAULT_MAP_W = 80;
export const DEFAULT_MAP_H = 60;

// Soft configurable cap on simultaneously chartered custom expeditions (not a structural limit; can be raised to 500+)
export const DEFAULT_MAX_CHARTERED_DUNGEONS = 12;

export const MAP_SIZE_PRESETS = {
  small:     { id: 'small',     name: 'Small Outpost',        width: 48,  height: 36,  desc: '48x36 (~5.5x classic) • 14–18 chambers' },
  standard:  { id: 'standard',  name: 'Standard Delve',       width: 80,  height: 60,  desc: '80x60 (~15x classic) • Multi-wing halls & vaults' },
  sprawling: { id: 'sprawling', name: 'Sprawling Labyrinth',  width: 128, height: 96,  desc: '128x96 (~39x classic) • Deep avenues & caverns' },
  colossal:  { id: 'colossal',  name: 'Colossal Megadungeon', width: 192, height: 144, desc: '192x144 (~88x classic) • Massive subterranean expanse' }
};

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

// Economy Constants
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
