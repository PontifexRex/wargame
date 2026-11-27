// Narrow Strategy <-> Dungeon Entity Sync Adapter (Task 02)
// Purpose: Adapts canonical Wargame hero, party, equipment, and reward data across the Strategy/Dungeon boundary
// in-process without duplicating authoritative entities or using localStorage bridge handoffs.
// Intended lifecycle: Permanent narrow boundary adapter while Strategy (real-time) and Dungeon (turn-based)
// keep their specialized runtime schemas.

import {
  CLASSES,
  DEFAULT_HERO_SPI,
  isClassDungeonEligible,
  isHeroDungeonEligible
} from '../data/classes.js';
import { normalizeHeroBonusStats } from './heroStats.js';
import { normalizeHeroKnowledge } from './knowledge.js';
import {
  normalizeEquipmentSockets,
  recomputeHeroDerivedStats
} from '../engine/state.js';
import { applyWargameEntryHandoff } from '../engine/actions.js';
import { COMMAND_TYPES } from '../wargame/constants.js';
import {
  getPrimaryCity,
  DEFAULT_PERSISTENT_HERO_MAX_XP,
  normalizePersistentHeroInstance
} from '../wargame/engine/state.js';
import { getCanonicalPlayerId } from './canonicalIdentity.js';

const CANONICAL_EQ_SLOTS = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];

export function createDungeonHeroForClass(classId, canonicalHero, ownerPlayerId) {
  if (canonicalHero && typeof canonicalHero === 'object') {
    normalizePersistentHeroInstance(canonicalHero);
    if (!isHeroDungeonEligible(canonicalHero)) {
      return null;
    }
  }
  if (!isClassDungeonEligible(classId)) {
    return null;
  }
  const cls = CLASSES[classId];
  const startEq = cls.starterGear || {};
  const base = cls.baseStats || { str: 10, dex: 10, int: 10, vit: 10 };
  const eq = {
    weapon: startEq.weapon ? normalizeEquipmentSockets(Object.assign({}, startEq.weapon)) : null,
    armor: startEq.armor ? normalizeEquipmentSockets(Object.assign({}, startEq.armor)) : null,
    helm: startEq.helm ? normalizeEquipmentSockets(Object.assign({}, startEq.helm)) : null,
    boots: startEq.boots ? normalizeEquipmentSockets(Object.assign({}, startEq.boots)) : null,
    accessory: startEq.accessory ? normalizeEquipmentSockets(Object.assign({}, startEq.accessory)) : null,
    pickaxe: startEq.pickaxe ? normalizeEquipmentSockets(Object.assign({}, startEq.pickaxe)) : null
  };

  if (canonicalHero && canonicalHero.equipment && typeof canonicalHero.equipment === 'object') {
    for (let i = 0; i < CANONICAL_EQ_SLOTS.length; i++) {
      const slot = CANONICAL_EQ_SLOTS[i];
      if (canonicalHero.equipment[slot]) {
        eq[slot] = normalizeEquipmentSockets(JSON.parse(JSON.stringify(canonicalHero.equipment[slot])));
      }
    }
  }

  return {
    id: (canonicalHero && canonicalHero.id) || 'hero_1',
    ownerPlayerId: (canonicalHero && canonicalHero.ownerPlayerId) || ownerPlayerId,
    classId: cls.id,
    name: (canonicalHero && canonicalHero.name) || cls.name,
    level: (canonicalHero && typeof canonicalHero.level === 'number' && canonicalHero.level >= 1) ? canonicalHero.level : 1,
    xp: (canonicalHero && typeof canonicalHero.xp === 'number' && canonicalHero.xp >= 0) ? canonicalHero.xp : 0,
    maxXp: (canonicalHero && typeof canonicalHero.maxXp === 'number' && canonicalHero.maxXp > 0) ? canonicalHero.maxXp : DEFAULT_PERSISTENT_HERO_MAX_XP,
    x: 1,
    y: 1,
    hp: cls.hpBase || 100,
    maxHp: cls.hpBase || 100,
    mp: cls.mpBase || 40,
    maxMp: cls.mpBase || 40,
    baseStats: {
      str: base.str,
      dex: base.dex,
      int: base.int,
      vit: base.vit,
      spi: typeof base.spi === 'number' ? base.spi : DEFAULT_HERO_SPI
    },
    bonusStats: normalizeHeroBonusStats(canonicalHero && canonicalHero.bonusStats),
    knowledge: normalizeHeroKnowledge(canonicalHero && canonicalHero.knowledge),
    statPoints: (canonicalHero && typeof canonicalHero.statPoints === 'number') ? canonicalHero.statPoints : 0,
    talentPoints: (canonicalHero && typeof canonicalHero.talentPoints === 'number') ? canonicalHero.talentPoints : 0,
    talentsAllocated: (canonicalHero && canonicalHero.talentsAllocated) ? Object.assign({}, canonicalHero.talentsAllocated) : {},
    equipment: eq,
    cosmetics: (canonicalHero && canonicalHero.cosmetics) ? JSON.parse(JSON.stringify(canonicalHero.cosmetics)) : null,
    consumables: { potions: 2, recalls: 1 },
    expeditionPack: [],
    expeditionGear: [],
    statuses: [],
    usedDivineIntervention: false,
    skillCooldown: 0,
    godMode: false
  };
}

export function bindCanonicalHeroToDungeonState(simHost, dungeonState, entryInfo) {
  if (!simHost || !simHost.state || !simHost.state.world || !dungeonState || !entryInfo) {
    return { ok: false, reason: 'invalid_sync_arguments' };
  }

  const world = simHost.state.world;
  const playerId = getCanonicalPlayerId(simHost.state);

  // HR-12: Validate Overworld unit eligibility if a partyUnitId is provided
  if (entryInfo.partyUnitId && world.overworld && Array.isArray(world.overworld.units)) {
    const unit = world.overworld.units.find(function(u) { return u && u.id === entryInfo.partyUnitId; });
    if (unit && unit.canEnterDungeon !== true) {
      return { ok: false, reason: 'unit_not_dungeon_eligible' };
    }
  }

  const canonicalHero = (world.heroes || []).find(function(h) {
    return h.id === entryInfo.heroId;
  }) || null;
  if (canonicalHero) {
    normalizePersistentHeroInstance(canonicalHero);
  }

  const classId = (canonicalHero && canonicalHero.classId) || entryInfo.heroClassId || null;
  if (!classId || !CLASSES[classId]) {
    return { ok: false, reason: 'invalid_hero_class' };
  }
  if (canonicalHero ? !isHeroDungeonEligible(canonicalHero) : !isClassDungeonEligible(classId)) {
    return { ok: false, reason: 'hero_not_dungeon_eligible' };
  }

  const city = getPrimaryCity(simHost.state);

  // Ensure dungeonState has a valid hero bound to canonical identity & equipment
  const sameHero = Boolean(
    dungeonState.hero &&
    canonicalHero &&
    dungeonState.hero.id === canonicalHero.id &&
    dungeonState.hero.classId === classId
  );

  if (!sameHero) {
    const createdHero = createDungeonHeroForClass(classId, canonicalHero, playerId);
    if (!createdHero) {
      return { ok: false, reason: 'dungeon_hero_creation_failed' };
    }
    dungeonState.hero = createdHero;
  } else {
    dungeonState.hero.id = canonicalHero.id;
    dungeonState.hero.ownerPlayerId = canonicalHero.ownerPlayerId || playerId;
    dungeonState.hero.name = canonicalHero.name;
    dungeonState.hero.level = Math.max(dungeonState.hero.level || 1, canonicalHero.level || 1);
    dungeonState.hero.xp = Math.max(dungeonState.hero.xp || 0, canonicalHero.xp || 0);
    if (typeof canonicalHero.maxXp === 'number' && canonicalHero.maxXp > 0) {
      dungeonState.hero.maxXp = canonicalHero.maxXp;
    }
    if (canonicalHero.bonusStats && typeof canonicalHero.bonusStats === 'object') {
      dungeonState.hero.bonusStats = normalizeHeroBonusStats(canonicalHero.bonusStats);
    }
    if (canonicalHero.knowledge && typeof canonicalHero.knowledge === 'object') {
      dungeonState.hero.knowledge = normalizeHeroKnowledge(canonicalHero.knowledge);
    }
    if (typeof canonicalHero.statPoints === 'number') {
      dungeonState.hero.statPoints = canonicalHero.statPoints;
    }
    if (typeof canonicalHero.talentPoints === 'number') {
      dungeonState.hero.talentPoints = canonicalHero.talentPoints;
    }
    if (canonicalHero.talentsAllocated && typeof canonicalHero.talentsAllocated === 'object') {
      dungeonState.hero.talentsAllocated = Object.assign({}, canonicalHero.talentsAllocated);
    }
  }

  // Sync city provisions into hero consumables if city has provisions
  if (city && city.provisions && dungeonState.hero.consumables) {
    if (typeof city.provisions.potions === 'number') {
      dungeonState.hero.consumables.potions = Math.max(dungeonState.hero.consumables.potions || 0, Math.min(2, city.provisions.potions));
    }
    if (typeof city.provisions.recalls === 'number') {
      dungeonState.hero.consumables.recalls = Math.max(dungeonState.hero.consumables.recalls || 0, Math.min(1, city.provisions.recalls));
    }
  }

  dungeonState.playerId = playerId;

  const inProcessHandoff = {
    inProcess: true,
    sessionId: entryInfo.sessionId,
    playerId: playerId,
    campaignId: world.campaignId || (world.id + '_' + (world.seedCode || 'STAR')),
    seedCode: world.seedCode || 'STAR-7777',
    houseName: (world.player && world.player.houseName) || 'House Vanguard',
    cityId: city ? city.id : null,
    cityName: city ? city.name : 'Oakhaven Bastion',
    cityCoords: city ? { x: city.x, y: city.y } : null,
    partyUnitId: entryInfo.partyUnitId,
    hero: {
      id: canonicalHero ? canonicalHero.id : dungeonState.hero.id,
      ownerPlayerId: canonicalHero ? (canonicalHero.ownerPlayerId || playerId) : playerId,
      name: canonicalHero ? canonicalHero.name : dungeonState.hero.name,
      classId: classId,
      level: canonicalHero ? canonicalHero.level : dungeonState.hero.level,
      xp: canonicalHero ? canonicalHero.xp : dungeonState.hero.xp,
      equipment: canonicalHero && canonicalHero.equipment ? JSON.parse(JSON.stringify(canonicalHero.equipment)) : null,
      cosmetics: canonicalHero && canonicalHero.cosmetics ? JSON.parse(JSON.stringify(canonicalHero.cosmetics)) : null
    },
    dungeon: entryInfo.dungeon
  };

  const applied = applyWargameEntryHandoff(inProcessHandoff, dungeonState);
  if (!applied) {
    return { ok: false, reason: 'dungeon_entry_apply_failed' };
  }

  recomputeHeroDerivedStats(true, dungeonState);
  return {
    ok: true,
    heroId: dungeonState.hero.id,
    playerId: playerId,
    dungeonId: dungeonState.activeDungeonId
  };
}

export function applyDungeonOutcomeToStrategy(simHost, outcomePayload) {
  if (!simHost || !simHost.state || !simHost.state.world || !outcomePayload) {
    return { ok: false, reason: 'invalid_outcome_arguments' };
  }

  const res = simHost.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: outcomePayload
  });

  if (!res || !res.ok) {
    return { ok: false, reason: (res && res.error) || 'resolve_dungeon_return_failed' };
  }

  // Ensure canonical ownership remains intact on hero & party
  const world = simHost.state.world;
  const playerId = getCanonicalPlayerId(simHost.state);
  if (outcomePayload.heroId && Array.isArray(world.heroes)) {
    const hero = world.heroes.find(function(h) { return h.id === outcomePayload.heroId; });
    if (hero && !hero.ownerPlayerId) {
      hero.ownerPlayerId = playerId;
    }
  }

  return {
    ok: true,
    result: res.data || res.result || null
  };
}
