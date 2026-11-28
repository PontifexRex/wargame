// Context-Independent Shared Spell, Prayer & Skill Runtime Service (MG-01A)
// Manages actor ability access grants (multi-source), cooldowns, cost/silence validation,
// damage/shield/healing scaling, and damage absorption independent of Dungeon/Strategy UI.

import {
  ABILITIES,
  ABILITY_ACCESS_SOURCES,
  getAbilityDefinition,
  getDefaultAbilityIdsForClass
} from '../data/abilities.js';

export function normalizeActorAbilityState(actor) {
  if (!actor || typeof actor !== 'object') return null;

  if (!actor.abilityGrants || typeof actor.abilityGrants !== 'object') {
    actor.abilityGrants = {};
  }
  for (let i = 0; i < ABILITY_ACCESS_SOURCES.length; i++) {
    const src = ABILITY_ACCESS_SOURCES[i];
    if (!Array.isArray(actor.abilityGrants[src])) {
      actor.abilityGrants[src] = [];
    } else {
      // Deduplicate & keep valid ability IDs only
      const seen = {};
      const clean = [];
      for (let j = 0; j < actor.abilityGrants[src].length; j++) {
        const id = actor.abilityGrants[src][j];
        if (typeof id === 'string' && ABILITIES[id] && !seen[id]) {
          seen[id] = true;
          clean.push(id);
        }
      }
      actor.abilityGrants[src] = clean;
    }
  }

  // Ensure class default abilities stay synced if classId is initialized or switched
  if (actor.classId && (actor.abilityGrants.class.length === 0 || (actor._abilityClassId && actor._abilityClassId !== actor.classId))) {
    const defaults = getDefaultAbilityIdsForClass(actor.classId);
    actor.abilityGrants.class = defaults.slice();
    actor._abilityClassId = actor.classId;
    if (defaults.length > 0) {
      actor.activeAbilityId = defaults[0];
    }
  } else if (actor.classId && !actor._abilityClassId) {
    actor._abilityClassId = actor.classId;
  }

  if (!actor.abilityCooldowns || typeof actor.abilityCooldowns !== 'object') {
    actor.abilityCooldowns = {};
  }
  if (typeof actor.absorbShield !== 'number' || isNaN(actor.absorbShield) || actor.absorbShield < 0) {
    actor.absorbShield = 0;
  }
  if (actor.pendingCast !== null && actor.pendingCast !== undefined && typeof actor.pendingCast !== 'object') {
    actor.pendingCast = null;
  }
  if (actor.pendingCast === undefined) {
    actor.pendingCast = null;
  }

  const activeIds = getGrantedAbilityIds(actor, { activation: 'active' });
  if (!actor.activeAbilityId || activeIds.indexOf(actor.activeAbilityId) === -1) {
    actor.activeAbilityId = activeIds.length > 0 ? activeIds[0] : null;
  }

  return actor;
}

export function getGrantedAbilityIds(actor, opts) {
  if (!actor || typeof actor !== 'object') return [];
  if (!actor.abilityGrants || typeof actor.abilityGrants !== 'object') {
    normalizeActorAbilityState(actor);
  }
  const seen = {};
  const list = [];
  const activationFilter = (opts && opts.activation) ? opts.activation : null;
  const contextFilter = (opts && opts.context) ? opts.context : null;

  for (let i = 0; i < ABILITY_ACCESS_SOURCES.length; i++) {
    const src = ABILITY_ACCESS_SOURCES[i];
    const bucket = actor.abilityGrants[src];
    if (!Array.isArray(bucket)) continue;
    for (let j = 0; j < bucket.length; j++) {
      const id = bucket[j];
      if (seen[id]) continue;
      const def = getAbilityDefinition(id);
      if (!def) continue;
      if (activationFilter && def.activation !== activationFilter) continue;
      if (contextFilter && Array.isArray(def.contexts) && def.contexts.indexOf(contextFilter) === -1) continue;
      seen[id] = true;
      list.push(id);
    }
  }
  return list;
}

export function getGrantedAbilitySources(actor, abilityId) {
  if (!actor || !actor.abilityGrants || !abilityId) return [];
  const sources = [];
  for (let i = 0; i < ABILITY_ACCESS_SOURCES.length; i++) {
    const src = ABILITY_ACCESS_SOURCES[i];
    const bucket = actor.abilityGrants[src];
    if (Array.isArray(bucket) && bucket.indexOf(abilityId) !== -1) {
      sources.push(src);
    }
  }
  return sources;
}

export function hasAbilityAccess(actor, abilityId) {
  return getGrantedAbilitySources(actor, abilityId).length > 0;
}

export function grantAbilityAccess(actor, abilityId, sourceType) {
  if (!actor || typeof actor !== 'object') return { ok: false, reason: 'invalid_actor' };
  const def = getAbilityDefinition(abilityId);
  if (!def) return { ok: false, reason: 'unknown_ability' };
  const src = ABILITY_ACCESS_SOURCES.indexOf(sourceType) !== -1 ? sourceType : 'learned';
  normalizeActorAbilityState(actor);
  const bucket = actor.abilityGrants[src];
  if (bucket.indexOf(abilityId) === -1) {
    bucket.push(abilityId);
  }
  if (!actor.activeAbilityId && def.activation === 'active') {
    actor.activeAbilityId = abilityId;
  }
  return { ok: true, abilityId: abilityId, source: src };
}

export function revokeAbilityAccess(actor, abilityId, sourceType) {
  if (!actor || typeof actor !== 'object') return { ok: false, reason: 'invalid_actor' };
  normalizeActorAbilityState(actor);
  const src = ABILITY_ACCESS_SOURCES.indexOf(sourceType) !== -1 ? sourceType : 'learned';
  const bucket = actor.abilityGrants[src];
  const idx = bucket.indexOf(abilityId);
  if (idx !== -1) {
    bucket.splice(idx, 1);
  }
  const stillHas = hasAbilityAccess(actor, abilityId);
  if (!stillHas && actor.activeAbilityId === abilityId) {
    const remaining = getGrantedAbilityIds(actor, { activation: 'active' });
    actor.activeAbilityId = remaining.length > 0 ? remaining[0] : null;
  }
  return { ok: true, abilityId: abilityId, source: src, stillGranted: stillHas };
}

export function getAbilityCooldownRemaining(actor, abilityId) {
  if (!actor || !actor.abilityCooldowns || !abilityId) return 0;
  const cd = actor.abilityCooldowns[abilityId];
  return (typeof cd === 'number' && cd > 0) ? Math.ceil(cd) : 0;
}

export function setAbilityCooldown(actor, abilityId, turns) {
  if (!actor || !abilityId) return;
  if (!actor.abilityCooldowns || typeof actor.abilityCooldowns !== 'object') {
    actor.abilityCooldowns = {};
  }
  if (turns > 0) {
    actor.abilityCooldowns[abilityId] = Math.ceil(turns);
  } else {
    delete actor.abilityCooldowns[abilityId];
  }
}

export function tickActorAbilityCooldowns(actor) {
  if (!actor || !actor.abilityCooldowns || typeof actor.abilityCooldowns !== 'object') return;
  const keys = Object.keys(actor.abilityCooldowns);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const cur = actor.abilityCooldowns[k];
    if (typeof cur === 'number' && cur > 1) {
      actor.abilityCooldowns[k] = cur - 1;
    } else {
      delete actor.abilityCooldowns[k];
    }
  }
}

export function resetActorAbilityCooldowns(actor) {
  if (!actor) return;
  actor.abilityCooldowns = {};
  actor.skillCooldown = 0;
}

export function isAbilitySilenced(actor, abilityDef) {
  if (!actor || !abilityDef) return false;
  const silenced = (actor.statuses || []).some(function(s) { return s && s.id === 'silence'; });
  if (!silenced) return false;
  // Silence blocks arcane, divine, and nature magic while allowing martial techniques and adventuring skills
  return (
    abilityDef.domain === 'arcane' ||
    abilityDef.domain === 'divine' ||
    abilityDef.domain === 'nature'
  );
}

export function getEffectiveAbilityCost(actor, abilityDef) {
  if (!abilityDef) return { mp: 0, baseMp: 0, cooldown: 0, chilledPenalty: 0 };
  const baseMp = (abilityDef.costs && typeof abilityDef.costs.mp === 'number') ? abilityDef.costs.mp : 0;
  const cooldown = (abilityDef.costs && typeof abilityDef.costs.cooldown === 'number') ? abilityDef.costs.cooldown : 0;
  const isChilled = Boolean(actor && (actor.statuses || []).some(function(s) { return s && s.id === 'chilled'; }));
  // Chilled adds +2 MP to mana-using abilities (cooldown-only 0-MP martial techniques stay 0 MP)
  const chilledPenalty = (baseMp > 0 && isChilled) ? 2 : 0;
  return {
    mp: baseMp + chilledPenalty,
    baseMp: baseMp,
    cooldown: cooldown,
    chilledPenalty: chilledPenalty
  };
}

export function validateAbilityActivation(actor, abilityDef, ctx) {
  if (!actor || !abilityDef) {
    return { ok: false, reason: 'invalid_ability' };
  }
  normalizeActorAbilityState(actor);

  const contextId = (ctx && ctx.context) ? ctx.context : 'tactical_dungeon';
  if (Array.isArray(abilityDef.contexts) && abilityDef.contexts.indexOf(contextId) === -1) {
    return { ok: false, reason: 'invalid_context' };
  }
  if (abilityDef.activation !== 'active' && !(ctx && ctx.allowTriggered)) {
    return { ok: false, reason: 'not_active_ability' };
  }
  if (!hasAbilityAccess(actor, abilityDef.id) && !(ctx && ctx.bypassAccessCheck)) {
    return { ok: false, reason: 'not_granted' };
  }
  if (actor.pendingCast && !(ctx && ctx.allowWhileCasting)) {
    return { ok: false, reason: 'already_casting' };
  }
  if (isAbilitySilenced(actor, abilityDef)) {
    return { ok: false, reason: 'silenced' };
  }
  const cdRem = getAbilityCooldownRemaining(actor, abilityDef.id);
  if (cdRem > 0) {
    return { ok: false, reason: 'on_cooldown', cooldownRemaining: cdRem };
  }
  const costInfo = getEffectiveAbilityCost(actor, abilityDef);
  if ((actor.mp || 0) < costInfo.mp) {
    return { ok: false, reason: 'no_mp', effectiveCost: costInfo.mp, chilledPenalty: costInfo.chilledPenalty };
  }
  return {
    ok: true,
    effectiveCost: costInfo.mp,
    baseMp: costInfo.baseMp,
    cooldown: costInfo.cooldown,
    chilledPenalty: costInfo.chilledPenalty
  };
}

export function getActorMagicPower(actor) {
  if (!actor) return 0;
  if (typeof actor.magicPower === 'number' && !isNaN(actor.magicPower)) {
    return actor.magicPower;
  }
  const effInt = (actor.effectiveStats && actor.effectiveStats.int) || (actor.baseStats && actor.baseStats.int) || 10;
  const effSpi = (actor.effectiveStats && actor.effectiveStats.spi) || (actor.baseStats && actor.baseStats.spi) || 8;
  return Math.max(4, Math.round(effInt * 1.1 + effSpi * 0.6));
}

export function computeAbilityDamage(actor, effectDef, target, extraMult) {
  const mult = (effectDef && typeof effectDef.mult === 'number') ? effectDef.mult : 1.0;
  const bonusFlat = (effectDef && typeof effectDef.bonusFlat === 'number') ? effectDef.bonusFlat : 0;
  const scaling = (effectDef && effectDef.scaling) || 'physical';
  const damageType = (effectDef && effectDef.damageType) || (scaling === 'physical' ? 'physical' : 'magical');
  const mod = (typeof extraMult === 'number' && extraMult > 0) ? extraMult : 1.0;

  const atk = (actor && typeof actor.atk === 'number') ? actor.atk : 10;
  const magicPower = getActorMagicPower(actor);
  const effInt = (actor && actor.effectiveStats && actor.effectiveStats.int) || 10;
  const effSpi = (actor && actor.effectiveStats && actor.effectiveStats.spi) || 8;

  let raw = 0;
  if (scaling === 'arcane') {
    raw = Math.round((magicPower * 1.15 + effInt * 0.35) * mult + bonusFlat);
  } else if (scaling === 'divine') {
    raw = Math.round((magicPower * 1.05 + effSpi * 0.45) * mult + bonusFlat);
  } else if (scaling === 'hybrid_divine') {
    const mRatio = (effectDef && typeof effectDef.magicRatio === 'number') ? effectDef.magicRatio : 0.75;
    raw = Math.round((atk * 0.85 + magicPower * mRatio) * mult + bonusFlat);
  } else {
    raw = Math.round(atk * mult + bonusFlat);
  }

  raw = Math.round(raw * mod);

  // Explicit physical vs. magical defense mitigation
  let mitigated = raw;
  let guarded = false;
  if (target) {
    const isTargetGuarding = Boolean((target.statuses || []).some(function(s) { return s && s.id === 'guarding'; }));
    if (damageType === 'physical') {
      let effDef = target.def || 0;
      if (isTargetGuarding && (!effectDef || effectDef.respectGuarding !== false)) {
        effDef = Math.round(effDef * 1.6);
        guarded = true;
      }
      mitigated = Math.max(1, raw - Math.floor(effDef * 0.5));
    } else {
      // Magical defense uses explicit magicDef/ward if defined, else 25% of physical DEF (distinct from full armor & physical Guarding)
      const mDef = (typeof target.magicDef === 'number')
        ? target.magicDef
        : Math.floor((target.def || 0) * 0.25);
      mitigated = Math.max(1, raw - mDef);
    }
  }

  return {
    damage: Math.max(1, mitigated),
    raw: raw,
    damageType: damageType,
    guarded: guarded
  };
}

export function computeAbilityHealAmount(actor, effectDef) {
  if (!actor || !effectDef) return 0;
  const base = effectDef.baseAmount || 0;
  const magicMult = effectDef.magicMult || 0;
  const maxHpPct = effectDef.maxHpPct || 0;
  const mp = getActorMagicPower(actor);
  const pctHeal = Math.round((actor.maxHp || 100) * maxHpPct);
  return Math.max(1, Math.round(base + mp * magicMult + pctHeal));
}

export function computeAbilityShieldAmount(actor, effectDef) {
  if (!actor || !effectDef) return 0;
  const base = effectDef.baseAmount || 10;
  const defMult = effectDef.defMult || 0;
  const magicMult = effectDef.magicMult || 0;
  const cap = effectDef.maxShieldCap || 100;
  const raw = Math.round(base + (actor.def || 0) * defMult + getActorMagicPower(actor) * magicMult);
  return Math.max(1, Math.min(cap, raw));
}

export function applyDamageWithShield(actor, rawDamage) {
  const dmg = Math.max(0, Math.round(rawDamage || 0));
  if (!actor || dmg <= 0) {
    return { absorbed: 0, hpLoss: 0, remainingShield: (actor && actor.absorbShield) || 0 };
  }
  const curShield = (typeof actor.absorbShield === 'number' && actor.absorbShield > 0) ? actor.absorbShield : 0;
  const absorbed = Math.min(curShield, dmg);
  const hpLoss = dmg - absorbed;
  actor.absorbShield = Math.max(0, curShield - absorbed);
  if (hpLoss > 0) {
    actor.hp = (actor.hp || 0) - hpLoss;
  }
  return {
    absorbed: absorbed,
    hpLoss: hpLoss,
    remainingShield: actor.absorbShield
  };
}
