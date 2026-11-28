// Context-Independent Shared Spell, Prayer & Skill Runtime Service (MG-01A)
// Manages actor ability access grants (multi-source), cooldowns, cost/silence validation,
// damage/shield/healing scaling, and damage absorption independent of Dungeon/Strategy UI.

import {
  ABILITIES,
  ABILITY_ACCESS_SOURCES,
  getAbilityDefinition,
  getDefaultAbilityIdsForClass
} from '../data/abilities.js';
import { isRangedWeaponItem } from '../data/items.js';

export const QUICK_SLOT_COUNT = 4;
const QUICK_SLOT_CONTEXTS = ['tactical_dungeon', 'overworld'];

function normalizeQuickSlotArray(rawArr, defaultIds, allowDefaultSeed) {
  const out = [];
  if (Array.isArray(rawArr)) {
    for (let i = 0; i < QUICK_SLOT_COUNT; i++) {
      const id = rawArr[i];
      out.push((typeof id === 'string' && ABILITIES[id]) ? id : null);
    }
    return out;
  }
  if (!allowDefaultSeed) {
    for (let i = 0; i < QUICK_SLOT_COUNT; i++) out.push(null);
    return out;
  }
  for (let i = 0; i < QUICK_SLOT_COUNT; i++) {
    out.push(defaultIds[i] || null);
  }
  return out;
}

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
  if (!actor.abilityCooldownUntilSimMs || typeof actor.abilityCooldownUntilSimMs !== 'object') {
    actor.abilityCooldownUntilSimMs = {};
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

  // Initialize (one-time per context) or strictly preserve per-context configurable quick-access slots.
  // After initial setup, player assignments/order (including intentionally cleared null slots and
  // temporarily unavailable/ungranted abilities) are never auto-repopulated, reordered, or replaced.
  if (!actor.quickSlots || typeof actor.quickSlots !== 'object') {
    actor.quickSlots = {};
  }
  if (!actor._quickSlotsInitialized || typeof actor._quickSlotsInitialized !== 'object') {
    actor._quickSlotsInitialized = {};
  }
  for (let cIdx = 0; cIdx < QUICK_SLOT_CONTEXTS.length; cIdx++) {
    const ctxKey = QUICK_SLOT_CONTEXTS[cIdx];
    const existing = actor.quickSlots[ctxKey];
    const alreadyInit = Boolean(actor._quickSlotsInitialized[ctxKey] || actor._quickSlotsCustomized || Array.isArray(existing));
    if (!alreadyInit) {
      const ctxDefaults = getGrantedAbilityIds(actor, { activation: 'active', context: ctxKey });
      actor.quickSlots[ctxKey] = normalizeQuickSlotArray(null, ctxDefaults, true);
      actor._quickSlotsInitialized[ctxKey] = true;
    } else {
      actor.quickSlots[ctxKey] = normalizeQuickSlotArray(Array.isArray(existing) ? existing : [], null, false);
      actor._quickSlotsInitialized[ctxKey] = true;
    }
  }

  return actor;
}

export function getHeroQuickSlots(actor, contextId) {
  if (!actor) return [];
  normalizeActorAbilityState(actor);
  const ctxKey = QUICK_SLOT_CONTEXTS.indexOf(contextId) !== -1 ? contextId : 'tactical_dungeon';
  const arr = actor.quickSlots[ctxKey] || [];
  const out = [];
  for (let i = 0; i < QUICK_SLOT_COUNT; i++) {
    const id = arr[i] || null;
    const def = id ? getAbilityDefinition(id) : null;
    const granted = Boolean(id && hasAbilityAccess(actor, id));
    const ctxOk = Boolean(def && Array.isArray(def.contexts) && def.contexts.indexOf(ctxKey) !== -1);
    out.push({
      slotIndex: i,
      hotkey: String(i + 1),
      abilityId: id,
      granted: granted,
      availableInContext: ctxOk
    });
  }
  return out;
}

export function assignQuickSlot(actor, contextId, slotIndex, abilityId) {
  if (!actor) return { ok: false, reason: 'invalid_actor' };
  normalizeActorAbilityState(actor);
  const ctxKey = QUICK_SLOT_CONTEXTS.indexOf(contextId) !== -1 ? contextId : 'tactical_dungeon';
  const idx = Math.floor(Number(slotIndex));
  if (isNaN(idx) || idx < 0 || idx >= QUICK_SLOT_COUNT) return { ok: false, reason: 'invalid_slot' };
  const def = getAbilityDefinition(abilityId);
  if (!def || def.activation !== 'active') return { ok: false, reason: 'invalid_ability' };
  if (!hasAbilityAccess(actor, abilityId)) return { ok: false, reason: 'not_granted' };
  if (!Array.isArray(def.contexts) || def.contexts.indexOf(ctxKey) === -1) {
    return { ok: false, reason: 'invalid_context' };
  }
  const slots = actor.quickSlots[ctxKey];
  const prevIdx = slots.indexOf(abilityId);
  let swappedWith = -1;
  if (prevIdx !== -1 && prevIdx !== idx) {
    // Prevent duplicates by swapping existing slot position
    const displaced = slots[idx] || null;
    slots[idx] = abilityId;
    slots[prevIdx] = displaced;
    swappedWith = prevIdx;
  } else {
    slots[idx] = abilityId;
  }
  actor._quickSlotsCustomized = true;
  if (!actor._quickSlotsInitialized || typeof actor._quickSlotsInitialized !== 'object') {
    actor._quickSlotsInitialized = {};
  }
  actor._quickSlotsInitialized[ctxKey] = true;
  return { ok: true, slotIndex: idx, abilityId: abilityId, swappedWith: swappedWith, slots: slots.slice() };
}

export function clearQuickSlot(actor, contextId, slotIndex) {
  if (!actor) return { ok: false, reason: 'invalid_actor' };
  normalizeActorAbilityState(actor);
  const ctxKey = QUICK_SLOT_CONTEXTS.indexOf(contextId) !== -1 ? contextId : 'tactical_dungeon';
  const idx = Math.floor(Number(slotIndex));
  if (isNaN(idx) || idx < 0 || idx >= QUICK_SLOT_COUNT) return { ok: false, reason: 'invalid_slot' };
  actor.quickSlots[ctxKey][idx] = null;
  actor._quickSlotsCustomized = true;
  if (!actor._quickSlotsInitialized || typeof actor._quickSlotsInitialized !== 'object') {
    actor._quickSlotsInitialized = {};
  }
  actor._quickSlotsInitialized[ctxKey] = true;
  return { ok: true, slotIndex: idx, slots: actor.quickSlots[ctxKey].slice() };
}

export function swapQuickSlots(actor, contextId, idxA, idxB) {
  if (!actor) return { ok: false, reason: 'invalid_actor' };
  normalizeActorAbilityState(actor);
  const ctxKey = QUICK_SLOT_CONTEXTS.indexOf(contextId) !== -1 ? contextId : 'tactical_dungeon';
  const a = Math.floor(Number(idxA));
  const b = Math.floor(Number(idxB));
  if (isNaN(a) || isNaN(b) || a < 0 || a >= QUICK_SLOT_COUNT || b < 0 || b >= QUICK_SLOT_COUNT) {
    return { ok: false, reason: 'invalid_slot' };
  }
  const slots = actor.quickSlots[ctxKey];
  const tmp = slots[a];
  slots[a] = slots[b];
  slots[b] = tmp;
  actor._quickSlotsCustomized = true;
  if (!actor._quickSlotsInitialized || typeof actor._quickSlotsInitialized !== 'object') {
    actor._quickSlotsInitialized = {};
  }
  actor._quickSlotsInitialized[ctxKey] = true;
  return { ok: true, slots: slots.slice() };
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
  if (!actor.abilityCooldownUntilSimMs || typeof actor.abilityCooldownUntilSimMs !== 'object') {
    actor.abilityCooldownUntilSimMs = {};
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
  actor.abilityCooldownUntilSimMs = {};
  actor.skillCooldown = 0;
}

export function getStrategicAbilityCooldownRemainingMs(actor, abilityId, nowSimTimeMs) {
  if (!actor || !actor.abilityCooldownUntilSimMs || !abilityId) return 0;
  const due = actor.abilityCooldownUntilSimMs[abilityId];
  if (typeof due !== 'number' || !isFinite(due)) return 0;
  const now = typeof nowSimTimeMs === 'number' ? nowSimTimeMs : 0;
  return Math.max(0, due - now);
}

export function setStrategicAbilityCooldownMs(actor, abilityId, nowSimTimeMs, durationMs) {
  if (!actor || !abilityId) return;
  if (!actor.abilityCooldownUntilSimMs || typeof actor.abilityCooldownUntilSimMs !== 'object') {
    actor.abilityCooldownUntilSimMs = {};
  }
  const dur = Math.max(0, Number(durationMs) || 0);
  if (dur > 0) {
    actor.abilityCooldownUntilSimMs[abilityId] = (Number(nowSimTimeMs) || 0) + dur;
  } else {
    delete actor.abilityCooldownUntilSimMs[abilityId];
  }
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
  if (abilityDef.requiresRangedWeapon) {
    const wep = actor.equipment ? actor.equipment.weapon : null;
    if (!isRangedWeaponItem(wep)) {
      return { ok: false, reason: 'requires_ranged_weapon' };
    }
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

  // Explicit single-path scaling with zero attribute double-counting:
  // magicPower in heroStats.js already incorporates INT-primary/SPI-secondary (arcane)
  // or SPI-primary/INT-secondary (divine) plus magical equipment bonuses.
  let raw = 0;
  if (scaling === 'arcane') {
    raw = Math.round(magicPower * 1.25 * mult + bonusFlat);
  } else if (scaling === 'divine') {
    raw = Math.round(magicPower * 1.20 * mult + bonusFlat);
  } else if (scaling === 'hybrid_divine') {
    const mRatio = (effectDef && typeof effectDef.magicRatio === 'number') ? effectDef.magicRatio : 0.75;
    raw = Math.round((atk * 0.85 + magicPower * mRatio) * mult + bonusFlat);
  } else {
    raw = Math.round(atk * mult + bonusFlat);
  }

  // Trait-specific bonus (e.g. Sacred Flame +35% vs Undead/Corrupted)
  let traitBonusApplied = false;
  if (
    target &&
    Array.isArray(target.traits) &&
    effectDef &&
    Array.isArray(effectDef.bonusVsTraits) &&
    effectDef.bonusVsTraits.length > 0
  ) {
    const matched = effectDef.bonusVsTraits.some(function(tr) {
      return target.traits.indexOf(tr) !== -1;
    });
    if (matched) {
      raw = Math.round(raw * (effectDef.bonusTraitMult || 1.35));
      traitBonusApplied = true;
    }
  }

  // Optional focused crit bonus (e.g. Scout Aimed Shot)
  let isCrit = false;
  if (effectDef && typeof effectDef.bonusCritChance === 'number' && effectDef.bonusCritChance > 0) {
    const critRoll = ((actor && actor.crit) || 5) + effectDef.bonusCritChance;
    if (Math.random() * 100 < critRoll) {
      raw = Math.round(raw * 1.5);
      isCrit = true;
    }
  }

  raw = Math.round(raw * mod);

  // Explicit physical vs. magical defense mitigation (guarding applied exactly once to physical)
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
      // Explicit baseline magical defense (independent of physical armor and Guarding)
      const mDef = (typeof target.magicDef === 'number') ? target.magicDef : 2;
      mitigated = Math.max(1, raw - mDef);
    }
  }

  return {
    damage: Math.max(1, mitigated),
    raw: raw,
    damageType: damageType,
    guarded: guarded,
    traitBonusApplied: traitBonusApplied,
    isCrit: isCrit
  };
}

export function computeAbilityHealAmount(actor, effectDef) {
  if (!actor || !effectDef) return 0;
  const base = effectDef.baseAmount || 0;
  const magicMult = effectDef.magicMult || 0;
  const maxHpPct = effectDef.maxHpPct || 0;
  const vitMult = effectDef.vitMult || 0;
  const mp = getActorMagicPower(actor);
  const effVit = (actor.computedVit || (actor.baseStats && actor.baseStats.vit) || 10);
  const pctHeal = Math.round((actor.maxHp || 100) * maxHpPct);
  return Math.max(1, Math.round(base + mp * magicMult + effVit * vitMult + pctHeal));
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
