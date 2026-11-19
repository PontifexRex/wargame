// Shared Cross-Engine Handoff Bridge between Macro Wargame (wargame.html) and Tactical Dungeon Engine (index.html)
// Uses a dedicated localStorage envelope so both engines remain 100% standalone-capable with zero regressions.

export const BRIDGE_STORAGE_KEY = 'aethelgard_bridge_handoff_v1';

export const BRIDGE_DIRECTIONS = {
  TO_DUNGEON: 'wargame_to_dungeon',
  TO_WARGAME: 'dungeon_to_wargame'
};

export function createDungeonEntryEnvelope(data) {
  const src = data || {};
  return {
    version: 1,
    direction: BRIDGE_DIRECTIONS.TO_DUNGEON,
    timestamp: Date.now(),
    campaignId: src.campaignId || 'world_prime',
    houseName: src.houseName || 'House Vanguard',
    cityId: src.cityId || null,
    cityName: src.cityName || 'Oakhaven Bastion',
    cityCoords: src.cityCoords ? { x: src.cityCoords.x, y: src.cityCoords.y } : null,
    partyUnitId: src.partyUnitId || null,
    hero: src.hero ? {
      id: src.hero.id || null,
      name: src.hero.name || 'Vanguard Hero',
      classId: src.hero.classId || 'fighter',
      level: typeof src.hero.level === 'number' ? src.hero.level : 1,
      xp: typeof src.hero.xp === 'number' ? src.hero.xp : 0
    } : null,
    dungeon: src.dungeon ? {
      poiId: src.dungeon.poiId || null,
      dungeonId: src.dungeon.dungeonId || 'dng_starfall',
      profileId: src.dungeon.profileId || 'starfall_vaults',
      name: src.dungeon.name || 'The Starfall Vaults',
      coords: src.dungeon.coords ? { x: src.dungeon.coords.x, y: src.dungeon.coords.y } : null
    } : null
  };
}

export function createDungeonReturnEnvelope(data) {
  const src = data || {};
  const loot = src.lootSummary || {};
  return {
    version: 1,
    direction: BRIDGE_DIRECTIONS.TO_WARGAME,
    outcome: src.outcome === 'defeated' ? 'defeated' : 'extracted',
    method: src.method || 'Floor 1 Ascending Stairs (<)',
    timestamp: Date.now(),
    partyUnitId: src.partyUnitId || null,
    heroId: src.heroId || null,
    heroLevel: typeof src.heroLevel === 'number' ? src.heroLevel : 1,
    heroXp: typeof src.heroXp === 'number' ? src.heroXp : 0,
    dungeonId: src.dungeonId || 'dng_starfall',
    dungeonPoiId: src.dungeonPoiId || null,
    killerName: src.killerName || null,
    floorDepth: typeof src.floorDepth === 'number' ? src.floorDepth : 1,
    lootSummary: {
      gold: typeof loot.gold === 'number' ? loot.gold : 0,
      ore: typeof loot.ore === 'number' ? loot.ore : 0,
      gems: typeof loot.gems === 'number' ? loot.gems : 0,
      gearCount: typeof loot.gearCount === 'number' ? loot.gearCount : 0,
      salvagedGold: typeof loot.salvagedGold === 'number' ? loot.salvagedGold : 0
    }
  };
}

export function writeDungeonEntryHandoff(data) {
  const envelope = createDungeonEntryEnvelope(data);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (e) {
      // Ignore storage quota errors in restricted environments
    }
  }
  return envelope;
}

export function writeDungeonReturnHandoff(data) {
  const envelope = createDungeonReturnEnvelope(data);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (e) {
      // Ignore storage quota errors in restricted environments
    }
  }
  return envelope;
}

export function peekBridgeHandoff(expectedDirection) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (expectedDirection && parsed.direction !== expectedDirection) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function clearBridgeHandoff() {
  if (typeof localStorage === 'undefined') return;
  try {
    if (typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(BRIDGE_STORAGE_KEY);
    } else {
      localStorage.setItem(BRIDGE_STORAGE_KEY, '');
    }
  } catch (e) {
    // Ignore storage errors
  }
}

export function consumeBridgeHandoff(expectedDirection) {
  const env = peekBridgeHandoff(expectedDirection);
  if (!env) return null;
  clearBridgeHandoff();
  return env;
}
