// Canonical Player Identity & Ownership Normalization (Task 02)
// Establishes 'player_1' as the single canonical local player ID across Strategy, Progression, and Dungeon contexts.
// IMPORTANT: Never assigns ownership to neutral entities, NPCs, hostiles, or entities with ownerPlayerId === null.

export const CANONICAL_PLAYER_ID = 'player_1';
export const LEGACY_LOCAL_PLAYER_IDS = ['player_local'];

export function isLegacyLocalPlayerId(id) {
  if (typeof id !== 'string') return false;
  for (let i = 0; i < LEGACY_LOCAL_PLAYER_IDS.length; i++) {
    if (id === LEGACY_LOCAL_PLAYER_IDS[i]) return true;
  }
  return false;
}

export function normalizeLocalPlayerId(id) {
  if (id === null || id === undefined || id === '' || isLegacyLocalPlayerId(id)) {
    return CANONICAL_PLAYER_ID;
  }
  return String(id);
}

export function getCanonicalPlayerId(state) {
  if (!state || typeof state !== 'object') return CANONICAL_PLAYER_ID;
  if (state.world && state.world.player && state.world.player.id) {
    return normalizeLocalPlayerId(state.world.player.id);
  }
  if (state.player && state.player.id) {
    return normalizeLocalPlayerId(state.player.id);
  }
  if (state.playerId) {
    return normalizeLocalPlayerId(state.playerId);
  }
  return CANONICAL_PLAYER_ID;
}

function normalizeOwnedRecord(record, canonicalId) {
  if (!record || typeof record !== 'object') return;
  // Intentionally absent ownership (null) or non-local owner (e.g., future rival) must be preserved.
  if (record.ownerPlayerId === null) return;
  if (record.ownerPlayerId === undefined || isLegacyLocalPlayerId(record.ownerPlayerId)) {
    record.ownerPlayerId = canonicalId;
  }
}

export function ensureCanonicalPlayerIdentity(world) {
  if (!world || typeof world !== 'object') return CANONICAL_PLAYER_ID;

  if (!world.player || typeof world.player !== 'object') {
    world.player = { id: CANONICAL_PLAYER_ID };
  }
  const canonicalId = normalizeLocalPlayerId(world.player.id);
  world.player.id = canonicalId;

  // Player-owned cities
  if (world.cities && typeof world.cities === 'object') {
    const cityIds = Object.keys(world.cities);
    for (let i = 0; i < cityIds.length; i++) {
      normalizeOwnedRecord(world.cities[cityIds[i]], canonicalId);
    }
  }

  // Player-owned heroes
  if (Array.isArray(world.heroes)) {
    for (let i = 0; i < world.heroes.length; i++) {
      normalizeOwnedRecord(world.heroes[i], canonicalId);
    }
  }

  // Player-owned parties
  if (Array.isArray(world.parties)) {
    for (let i = 0; i < world.parties.length; i++) {
      normalizeOwnedRecord(world.parties[i], canonicalId);
    }
  }

  // Player-owned overworld units ONLY (never hostiles, neutral POIs, or NPCs)
  if (world.overworld && Array.isArray(world.overworld.units)) {
    for (let i = 0; i < world.overworld.units.length; i++) {
      const u = world.overworld.units[i];
      if (!u || typeof u !== 'object') continue;
      if (u.unitType === 'settler' || u.unitType === 'hero_party') {
        normalizeOwnedRecord(u, canonicalId);
      }
    }
  }

  return canonicalId;
}
