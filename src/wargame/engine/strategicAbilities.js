// Overworld Strategic Ability Adapter (MG-01B)
// Executes context-eligible Scout & Adventurer abilities on the Overworld using
// real terrain, fog-of-war, POI discovery, individual travel speed, and resource pathways.

import { getAbilityDefinition } from '../../data/abilities.js';
import {
  normalizeActorAbilityState,
  getGrantedAbilityIds,
  hasAbilityAccess,
  getStrategicAbilityCooldownRemainingMs,
  setStrategicAbilityCooldownMs
} from '../../core/abilityEngine.js';
import {
  OW_TERRAIN_PLAINS,
  OW_TERRAIN_FOREST,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_FERTILE_VALE
} from '../data/terrain.js';
import { revealOverworldVision } from './pathfinding.js';
import { checkAndDiscoverDungeonsInVision } from './queues.js';
import { getPrimaryCity, getSelectedOverworldUnit } from './state.js';

const FORAGEABLE_TERRAINS = [
  OW_TERRAIN_FERTILE_VALE,
  OW_TERRAIN_FOREST,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_PLAINS
];

const CAMOUFLAGE_TERRAINS = [
  OW_TERRAIN_FOREST,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_FERTILE_VALE
];

export function resolveHeroForOverworldUnit(state, unit) {
  if (!state || !state.world || !unit || !Array.isArray(state.world.heroes)) return null;
  const heroId = unit.leaderHeroId || unit.heroId || null;
  if (!heroId) return null;
  return state.world.heroes.find(function(h) { return h && h.id === heroId; }) || null;
}

export function getOverworldAbilitiesForUnit(state, unit) {
  if (!state || !state.world || !unit) return [];
  const hero = resolveHeroForOverworldUnit(state, unit);
  if (!hero) return [];
  normalizeActorAbilityState(hero);
  const nowMs = (state.world.clock && typeof state.world.clock.simTimeMs === 'number') ? state.world.clock.simTimeMs : 0;
  const ids = getGrantedAbilityIds(hero, { activation: 'active', context: 'overworld' });
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    const def = getAbilityDefinition(ids[i]);
    if (!def) continue;
    const remMs = getStrategicAbilityCooldownRemainingMs(hero, def.id, nowMs);
    out.push({
      id: def.id,
      name: def.name,
      icon: def.icon || '✦',
      desc: def.desc,
      cooldownRemainingMs: remMs,
      cooldownRemainingSec: Math.ceil(remMs / 1000),
      ready: remMs <= 0
    });
  }
  return out;
}

export function executeStrategicAbility(simHost, abilityId, opts) {
  if (!simHost || !simHost.state || !simHost.state.world || !simHost.state.world.overworld) {
    return { ok: false, reason: 'no_world' };
  }
  const state = simHost.state;
  const ow = state.world.overworld;
  const unit = (opts && opts.unit) || getSelectedOverworldUnit(state);
  if (!unit || !unit.alive) {
    return { ok: false, reason: 'no_active_unit' };
  }
  const hero = (opts && opts.hero) || resolveHeroForOverworldUnit(state, unit);
  if (!hero) {
    return { ok: false, reason: 'no_hero_leader' };
  }
  normalizeActorAbilityState(hero);

  const def = getAbilityDefinition(abilityId);
  if (!def) return { ok: false, reason: 'unknown_ability' };
  if (!Array.isArray(def.contexts) || def.contexts.indexOf('overworld') === -1) {
    return { ok: false, reason: 'not_overworld_eligible' };
  }
  if (!hasAbilityAccess(hero, def.id)) {
    return { ok: false, reason: 'not_granted' };
  }

  const nowMs = (state.world.clock && typeof state.world.clock.simTimeMs === 'number') ? state.world.clock.simTimeMs : 0;
  const remMs = getStrategicAbilityCooldownRemainingMs(hero, def.id, nowMs);
  if (remMs > 0) {
    return { ok: false, reason: 'on_cooldown', cooldownRemainingMs: remMs };
  }

  const cdMs = typeof def.strategicCooldownMs === 'number' ? def.strategicCooldownMs : 20000;
  const terrain = (ow.tiles && ow.tiles[unit.y]) ? ow.tiles[unit.y][unit.x] : null;

  if (def.id === 'reconnaissance') {
    const baseVis = unit.vision || 3;
    const surveyRadius = baseVis + 3;
    revealOverworldVision(ow, unit.x, unit.y, surveyRadius);
    const newlyDiscovered = checkAndDiscoverDungeonsInVision(ow, nowMs, simHost.eventStream);
    const hostilesNear = (ow.hostiles || []).filter(function(h) {
      return h && h.alive && Math.hypot(h.x - unit.x, h.y - unit.y) <= surveyRadius;
    });
    const targetsNear = (ow.militaryTargets || []).filter(function(mt) {
      return mt && mt.status !== 'cleared' && Math.hypot(mt.x - unit.x, mt.y - unit.y) <= surveyRadius;
    });
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = 'Reconnaissance surveyed ' + surveyRadius + ' hexes: ' +
      newlyDiscovered.length + ' new POI(s), ' + hostilesNear.length + ' hostile(s), ' + targetsNear.length + ' camp(s).';
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      surveyRadius: surveyRadius,
      discoveredPois: newlyDiscovered.length,
      hostilesSpotted: hostilesNear.length,
      targetsSpotted: targetsNear.length
    };
  }

  if (def.id === 'forced_pace') {
    // Individual unit speed boost only (no group/army-wide boost)
    if (unit.unitType === 'army') {
      return { ok: false, reason: 'individual_unit_only' };
    }
    const durMs = 30000;
    unit.forcedPaceUntilSimTimeMs = nowMs + durMs;
    unit.forcedPaceSpeedBonus = 0.25;
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = 'Forced Pace active for ' + unit.shortName + ' (+25% individual march speed for 30s).';
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      unitId: unit.id,
      expiresAtSimTimeMs: unit.forcedPaceUntilSimTimeMs,
      speedBonusRatio: 0.25
    };
  }

  if (def.id === 'forage') {
    if (FORAGEABLE_TERRAINS.indexOf(terrain) === -1) {
      return { ok: false, reason: 'ineligible_terrain' };
    }
    if (!ow.foragedHexes || typeof ow.foragedHexes !== 'object') ow.foragedHexes = {};
    const hKey = unit.x + ',' + unit.y;
    if (ow.foragedHexes[hKey]) {
      return { ok: false, reason: 'already_foraged' };
    }
    ow.foragedHexes[hKey] = nowMs || 1;
    const foodGain = (terrain === OW_TERRAIN_FERTILE_VALE || terrain === OW_TERRAIN_FOREST) ? 18 : 10;
    const woodGain = (terrain === OW_TERRAIN_FOREST) ? 8 : 0;
    const city = getPrimaryCity(state);
    if (city && city.stockpile) {
      city.stockpile.food = (city.stockpile.food || 0) + foodGain;
      if (woodGain > 0) city.stockpile.wood = (city.stockpile.wood || 0) + woodGain;
    }
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = 'Foraged +' + foodGain + ' Food' + (woodGain > 0 ? (' and +' + woodGain + ' Wood') : '') + ' from local wilderness.';
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      terrain: terrain,
      foodGained: foodGain,
      woodGained: woodGain
    };
  }

  if (def.id === 'tracking') {
    const rad = 8;
    const clues = [];
    const hostiles = Array.isArray(ow.hostiles) ? ow.hostiles : [];
    for (let i = 0; i < hostiles.length; i++) {
      const hst = hostiles[i];
      if (!hst || !hst.alive) continue;
      const dist = Math.hypot(hst.x - unit.x, hst.y - unit.y);
      if (dist > rad) continue;
      const ns = (hst.y - unit.y) < -1 ? 'N' : ((hst.y - unit.y) > 1 ? 'S' : '');
      const ew = (hst.x - unit.x) > 1 ? 'E' : ((hst.x - unit.x) < -1 ? 'W' : '');
      clues.push({ bearing: (ns + ew) || 'NEAR', kind: 'hostile', distBand: dist <= 3 ? 'close' : 'distant' });
    }
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = clues.length > 0
      ? ('Tracking clues: ' + clues.length + ' trail(s) detected (' + clues.slice(0, 3).map(function(c) { return c.bearing + ' ' + c.distBand; }).join(', ') + ').')
      : 'Tracking found no fresh hostile trails within 8 hexes.';
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      clues: clues
    };
  }

  if (def.id === 'camouflage') {
    if (CAMOUFLAGE_TERRAINS.indexOf(terrain) === -1) {
      return { ok: false, reason: 'ineligible_terrain' };
    }
    unit.camouflagedUntilSimTimeMs = nowMs + 25000;
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = unit.shortName + ' is Camouflaged in natural cover for 25s.';
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      expiresAtSimTimeMs: unit.camouflagedUntilSimTimeMs
    };
  }

  if (def.id === 'appraise') {
    const eqSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
    const pool = [];
    if (Array.isArray(hero.bagGear)) {
      for (let i = 0; i < hero.bagGear.length; i++) pool.push(hero.bagGear[i]);
    }
    if (hero.equipment) {
      for (let i = 0; i < eqSlots.length; i++) {
        if (hero.equipment[eqSlots[i]]) pool.push(hero.equipment[eqSlots[i]]);
      }
    }
    const targetItem = (opts && opts.targetItemUid)
      ? pool.find(function(it) { return it && it.uid === opts.targetItemUid && !it.appraised; })
      : pool.find(function(it) { return it && !it.appraised; });
    if (!targetItem) {
      return { ok: false, reason: 'nothing_to_appraise' };
    }
    targetItem.appraised = true;
    targetItem.appraisalNotes = (targetItem.rarity ? String(targetItem.rarity).toUpperCase() : 'COMMON') +
      ' • Est. ' + (targetItem.value || 15) + 'g' +
      (targetItem.magicPower ? (' • Magic +' + targetItem.magicPower) : '') +
      (targetItem.isRanged ? ' • Ranged' : '');
    setStrategicAbilityCooldownMs(hero, def.id, nowMs, cdMs);
    state._lastStrategicFeedback = 'Appraised ' + targetItem.name + ': ' + targetItem.appraisalNotes;
    state._dirty = true;
    return {
      ok: true,
      abilityId: def.id,
      appraisedItem: targetItem
    };
  }

  return { ok: false, reason: 'unsupported_overworld_ability' };
}
