// =============================================================================
// GENERIC EFFECTS & BENEFITS FRAMEWORK (Inc 10.4 / ADR-0015 / Spec §12)
// Data-driven effect aggregation and deterministic stacking across Personal,
// Guild, Alliance, and Subject-Specific (Hero/City/Unit/Construct) progression.
// Explicitly separates Unlocks from Modifiers.
// =============================================================================

import { OWNER_TYPES } from './currencyService.js';
import { PROTOTYPE_RESEARCH_ITEMS, PROTOTYPE_TRAINING_DEFINITIONS } from './researchCatalog.js';
import { PROTOTYPE_ORG_RESEARCH_ITEMS, isPlayerEligibleForOrgBenefits } from './organizationService.js';

export const EFFECT_TYPES = {
  CAPABILITY_UNLOCK: 'capability_unlock',
  UNLOCK_TRAINING: 'unlock_training',
  ABILITY_UNLOCK: 'ability_unlock',
  RECIPE_UNLOCK: 'recipe_unlock',
  ACCESS_UNLOCK: 'access_unlock',
  ATTRIBUTE_MODIFIER: 'attribute_modifier',
  SKILL_MODIFIER: 'skill_modifier',
  PRODUCTION_MODIFIER: 'production_modifier',
  ACCRUAL_MODIFIER: 'accrual_modifier',
  RESEARCH_SPEED_MODIFIER: 'research_speed_modifier',
  TRAINING_SPEED_MODIFIER: 'training_speed_modifier',
  CAPACITY_MODIFIER: 'capacity_modifier',
  PROBABILITY_MODIFIER: 'probability_modifier',
  EFFICIENCY_MODIFIER: 'efficiency_modifier',
  LIMIT_MODIFIER: 'limit_modifier',
  BEHAVIOR_MODIFICATION: 'behavior_modification',
  SPECIAL_EFFECT: 'special_effect'
};

export const EFFECT_OPS = {
  ADDITIVE: 'additive',
  MULTIPLICATIVE: 'multiplicative',
  SET: 'set',
  MINIMUM: 'minimum',
  MAXIMUM: 'maximum',
  UNLOCK: 'unlock',
  DISABLE: 'disable',
  REPLACE: 'replace',
  CUSTOM: 'custom'
};

const UNLOCK_OPS = {
  unlock: true,
  disable: true,
  replace: true
};

const UNLOCK_EFFECT_TYPES = {
  capability_unlock: true,
  unlock_training: true,
  ability_unlock: true,
  recipe_unlock: true,
  access_unlock: true
};

const MODIFIER_OPS = {
  additive: true,
  multiplicative: true,
  set: true,
  minimum: true,
  maximum: true
};

const _customEffectHandlers = {};

export function registerCustomEffectHandler(handlerId, fn) {
  if (!handlerId || typeof fn !== 'function') return false;
  _customEffectHandlers[String(handlerId)] = fn;
  return true;
}

export function evaluateCustomEffect(handlerId, payload) {
  const fn = _customEffectHandlers[String(handlerId)];
  if (!fn) return { ok: false, reason: 'unknown_custom_handler' };
  return { ok: true, result: fn(payload) };
}

export function isUnlockEffect(effect) {
  if (!effect) return false;
  return Boolean(UNLOCK_OPS[effect.op] || UNLOCK_EFFECT_TYPES[effect.effectType]);
}

export function isModifierEffect(effect) {
  if (!effect) return false;
  return Boolean(MODIFIER_OPS[effect.op] && !isUnlockEffect(effect));
}

function collectResearchBenefitsForOwner(progression, ownerType, ownerId, catalog, sourceType, outList) {
  const prefix = String(ownerType) + ':' + String(ownerId) + ':';
  const progressMap = (progression && progression.researchProgress) ? progression.researchProgress : {};
  const keys = Object.keys(progressMap);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.indexOf(prefix) !== 0) continue;
    const prog = progressMap[key];
    if (!prog || !prog.currentLevel || prog.currentLevel <= 0) continue;

    const itemDef = catalog[prog.researchItemId];
    if (!itemDef || !Array.isArray(itemDef.levelDefinitions)) continue;

    for (let li = 0; li < itemDef.levelDefinitions.length; li++) {
      const lvlDef = itemDef.levelDefinitions[li];
      if (lvlDef.level > prog.currentLevel) continue;
      const benefits = Array.isArray(lvlDef.benefits) ? lvlDef.benefits : [];
      for (let bi = 0; bi < benefits.length; bi++) {
        const b = benefits[bi];
        outList.push({
          sourceType: sourceType,
          sourceOwnerType: ownerType,
          sourceOwnerId: String(ownerId),
          sourceId: prog.researchItemId,
          sourceLevel: lvlDef.level,
          effectType: b.effectType,
          target: b.target,
          op: b.op,
          value: b.value,
          priority: typeof b.priority === 'number' ? b.priority : 0
        });
      }
    }
  }
}

function collectSubjectTrainingBenefits(progression, subjectType, subjectId, trainingCatalog, outList) {
  if (!subjectType || !subjectId) return;
  const prefix = String(subjectType) + ':' + String(subjectId) + ':';
  const instMap = (progression && progression.trainingInstances) ? progression.trainingInstances : {};
  const keys = Object.keys(instMap);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.indexOf(prefix) !== 0) continue;
    const inst = instMap[key];
    if (!inst || !inst.currentLevel || inst.currentLevel <= 0) continue;

    const def = trainingCatalog[inst.trainingDefinitionId];
    if (!def || !Array.isArray(def.levels)) continue;

    for (let li = 0; li < def.levels.length; li++) {
      const lvlDef = def.levels[li];
      if (lvlDef.level > inst.currentLevel) continue;
      const benefits = Array.isArray(lvlDef.benefits) ? lvlDef.benefits : [];
      for (let bi = 0; bi < benefits.length; bi++) {
        const b = benefits[bi];
        outList.push({
          sourceType: 'training',
          subjectType: String(subjectType),
          subjectId: String(subjectId),
          sourceId: inst.trainingDefinitionId,
          sourceLevel: lvlDef.level,
          effectType: b.effectType,
          target: b.target,
          op: b.op,
          value: b.value,
          priority: typeof b.priority === 'number' ? b.priority : 0
        });
      }
    }
  }
}

// Collect all active effects for a player (and optionally a specific subject like a Hero)
// Explicitly returns separated { allEffects, unlocks, modifiers }.
export function collectActiveEffects(progression, context) {
  const ctx = context || {};
  const playerId = String(ctx.playerId || ctx.ownerId || 'player_1');
  const researchCatalog = Object.assign({}, PROTOTYPE_RESEARCH_ITEMS, ctx.researchCatalog || {});
  const orgCatalog = Object.assign({}, PROTOTYPE_ORG_RESEARCH_ITEMS, ctx.orgCatalog || {});
  const trainingCatalog = Object.assign({}, PROTOTYPE_TRAINING_DEFINITIONS, ctx.trainingCatalog || {});

  const allEffects = [];

  if (progression) {
    // 1. Personal Research
    collectResearchBenefitsForOwner(progression, OWNER_TYPES.PLAYER, playerId, researchCatalog, 'personal_research', allEffects);

    // 2. Guild Research (only if player is an eligible member)
    const orgs = progression.organizations || {};
    const guildId = ctx.guildId !== undefined ? ctx.guildId : orgs.playerGuildId;
    if (guildId && orgs.guilds && orgs.guilds[guildId]) {
      const guild = orgs.guilds[guildId];
      if (isPlayerEligibleForOrgBenefits(guild, playerId)) {
        collectResearchBenefitsForOwner(progression, OWNER_TYPES.GUILD, guildId, orgCatalog, 'guild_research', allEffects);
      }
    }

    // 3. Alliance Research (only if player is an eligible member)
    const allianceId = ctx.allianceId !== undefined ? ctx.allianceId : orgs.playerAllianceId;
    if (allianceId && orgs.alliances && orgs.alliances[allianceId]) {
      const alliance = orgs.alliances[allianceId];
      if (isPlayerEligibleForOrgBenefits(alliance, playerId)) {
        collectResearchBenefitsForOwner(progression, OWNER_TYPES.ALLIANCE, allianceId, orgCatalog, 'alliance_research', allEffects);
      }
    }

    // 4. Subject-Specific Training (strictly scoped to subjectType + subjectId)
    if (ctx.subjectType && ctx.subjectId) {
      collectSubjectTrainingBenefits(progression, ctx.subjectType, ctx.subjectId, trainingCatalog, allEffects);
    }
  }

  // 5. Optional transient / external effects (alignment, buffs, buildings, tests)
  if (Array.isArray(ctx.extraEffects)) {
    for (let ei = 0; ei < ctx.extraEffects.length; ei++) {
      const ex = ctx.extraEffects[ei];
      if (!ex) continue;
      allEffects.push({
        sourceType: ex.sourceType || 'external',
        sourceId: ex.sourceId || ('ext_' + ei),
        sourceLevel: ex.sourceLevel || 1,
        effectType: ex.effectType,
        target: ex.target,
        op: ex.op,
        value: ex.value,
        priority: typeof ex.priority === 'number' ? ex.priority : 0
      });
    }
  }

  const unlocks = [];
  const modifiers = [];
  for (let i = 0; i < allEffects.length; i++) {
    const eff = allEffects[i];
    if (isUnlockEffect(eff)) {
      unlocks.push(eff);
    } else if (isModifierEffect(eff)) {
      modifiers.push(eff);
    }
  }

  return {
    allEffects: allEffects,
    unlocks: unlocks,
    modifiers: modifiers
  };
}

// Deterministic stacking order (Spec §12):
// 1. Set (highest priority wins) -> replaces baseValue
// 2. Additive -> sum all additive values onto base
// 3. Multiplicative -> multiply by product of multiplicative factors
// 4. Minimum -> clamp lower bound (highest minimum wins)
// 5. Maximum -> clamp upper bound (lowest maximum wins)
export function resolveNumericStat(baseValue, target, effects, options) {
  const opts = options || {};
  const effectTypeFilter = opts.effectType || null;
  const list = Array.isArray(effects) ? effects : [];

  const matching = [];
  for (let i = 0; i < list.length; i++) {
    const eff = list[i];
    if (!eff || eff.target !== target) continue;
    if (effectTypeFilter && eff.effectType !== effectTypeFilter) continue;
    if (!isModifierEffect(eff)) continue;
    matching.push(eff);
  }

  let setEffect = null;
  let additiveSum = 0;
  let multiplicativeFactor = 1;
  let minBound = null;
  let maxBound = null;

  for (let j = 0; j < matching.length; j++) {
    const m = matching[j];
    const numVal = Number(m.value);
    if (!isFinite(numVal)) continue;

    if (m.op === EFFECT_OPS.SET) {
      if (!setEffect || (m.priority || 0) >= (setEffect.priority || 0)) {
        setEffect = m;
      }
    } else if (m.op === EFFECT_OPS.ADDITIVE) {
      additiveSum += numVal;
    } else if (m.op === EFFECT_OPS.MULTIPLICATIVE) {
      multiplicativeFactor *= numVal;
    } else if (m.op === EFFECT_OPS.MINIMUM) {
      if (minBound === null || numVal > minBound) minBound = numVal;
    } else if (m.op === EFFECT_OPS.MAXIMUM) {
      if (maxBound === null || numVal < maxBound) maxBound = numVal;
    }
  }

  let val = setEffect ? Number(setEffect.value) : Number(baseValue || 0);
  val = (val + additiveSum) * multiplicativeFactor;
  if (minBound !== null && val < minBound) val = minBound;
  if (maxBound !== null && val > maxBound) val = maxBound;

  // Clean minor floating-point representation noise (e.g. 12.000000000000002 -> 12)
  const cleanVal = Math.round(val * 1000000) / 1000000;

  return {
    target: target,
    baseValue: Number(baseValue || 0),
    finalValue: cleanVal,
    setApplied: setEffect ? Number(setEffect.value) : null,
    additiveSum: Math.round(additiveSum * 1000000) / 1000000,
    multiplicativeFactor: Math.round(multiplicativeFactor * 1000000) / 1000000,
    minBound: minBound,
    maxBound: maxBound,
    appliedEffects: matching
  };
}

// Resolve Unlock / Disable / Replace state for a target capability, training, ability, or recipe
export function resolveUnlockState(target, effects, options) {
  const opts = options || {};
  const effectTypeFilter = opts.effectType || null;
  const list = Array.isArray(effects) ? effects : [];

  let unlocked = false;
  let maxUnlockLevel = 0;
  let highestUnlockPriority = -Infinity;
  let disabled = false;
  let highestDisablePriority = -Infinity;
  let replacedBy = null;
  let highestReplacePriority = -Infinity;
  const sources = [];

  for (let i = 0; i < list.length; i++) {
    const eff = list[i];
    if (!eff || eff.target !== target) continue;
    if (effectTypeFilter && eff.effectType !== effectTypeFilter) continue;
    if (!isUnlockEffect(eff)) continue;

    sources.push(eff);
    const prio = typeof eff.priority === 'number' ? eff.priority : 0;

    if (eff.op === EFFECT_OPS.UNLOCK) {
      unlocked = true;
      const lvl = typeof eff.value === 'number' ? eff.value : 1;
      if (lvl > maxUnlockLevel) maxUnlockLevel = lvl;
      if (prio >= highestUnlockPriority) highestUnlockPriority = prio;
    } else if (eff.op === EFFECT_OPS.DISABLE) {
      disabled = true;
      if (prio >= highestDisablePriority) highestDisablePriority = prio;
    } else if (eff.op === EFFECT_OPS.REPLACE) {
      if (prio >= highestReplacePriority) {
        highestReplacePriority = prio;
        replacedBy = eff.value;
      }
    }
  }

  // Disable overrides unlock unless an unlock has strictly higher priority
  const isEffectiveUnlocked = unlocked && (!disabled || highestUnlockPriority > highestDisablePriority);

  return {
    target: target,
    unlocked: isEffectiveUnlocked,
    maxUnlockLevel: isEffectiveUnlocked ? maxUnlockLevel : 0,
    disabled: disabled && highestDisablePriority >= highestUnlockPriority,
    replacedBy: replacedBy,
    sources: sources
  };
}
