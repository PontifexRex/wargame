// =============================================================================
// RESEARCH POINT ACCRUAL & ANTI-ABUSE SERVICE (Inc 10.2 / ADR-0015 / Spec §5)
// Handles passive time-based accrual (with authoritative offline catch-up) and
// event-driven fractional activity awards with idempotency, cooldowns, caps,
// diminishing returns, and strict separation of RP-generation vs. speed modifiers.
// =============================================================================

import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  getCurrencyDefinition,
  recordCurrencyTransaction,
  toScaledInt
} from './currencyService.js';

export const DEFAULT_ACCRUAL_CONFIG = {
  passiveCurrencyId: 'rp_general',
  passiveBaseRatePerSec: 0.00001 // Spec §5.1 illustrative baseline (configurable)
};

export const DEFAULT_ACTIVITY_AWARD_RULES = {
  dungeon_move: {
    activityType: 'dungeon_move',
    currencyId: 'rp_adventurer',
    baseAmount: 0.001,
    cooldownMs: 500,
    windowMs: 86400000,
    windowCapCount: 500,
    diminishingAfter: 200,
    diminishingFactor: 0.5,
    version: '1.0.0'
  },
  monster_defeated: {
    activityType: 'monster_defeated',
    currencyId: 'rp_warrior',
    baseAmount: 0.005,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 300,
    diminishingAfter: 150,
    diminishingFactor: 0.5,
    version: '1.0.0'
  },
  warrior_class_action: {
    activityType: 'warrior_class_action',
    currencyId: 'rp_warrior',
    baseAmount: 0.002,
    cooldownMs: 500,
    windowMs: 86400000,
    windowCapCount: 500,
    diminishingAfter: 200,
    diminishingFactor: 0.5,
    version: '1.0.0'
  },
  chest_opened: {
    activityType: 'chest_opened',
    currencyId: 'rp_adventurer',
    baseAmount: 0.002,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 200,
    diminishingAfter: 100,
    diminishingFactor: 0.5,
    version: '1.0.0'
  },
  location_discovered: {
    activityType: 'location_discovered',
    currencyId: 'rp_adventurer',
    baseAmount: 0.010,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 100,
    version: '1.0.0'
  },
  dungeon_completed: {
    activityType: 'dungeon_completed',
    currencyId: 'rp_adventurer',
    baseAmount: 0.050,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 50,
    version: '1.0.0'
  },
  major_expedition: {
    activityType: 'major_expedition',
    currencyId: 'rp_adventurer',
    baseAmount: 0.100,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 20,
    version: '1.0.0'
  },
  research_quest: {
    activityType: 'research_quest',
    currencyId: 'rp_adventurer',
    baseAmount: 5.000,
    cooldownMs: 0,
    windowMs: 86400000,
    windowCapCount: 20,
    version: '1.0.0'
  }
};

export function computeEffectiveGenerationMultiplier(modifiers) {
  const m = modifiers || {};
  const additive = typeof m.additiveBonus === 'number' ? m.additiveBonus : 0;
  const multiplicative = typeof m.multiplicativeFactor === 'number' ? m.multiplicativeFactor : 1.0;
  return Math.max(0, (1 + additive) * multiplicative);
}

// Passive time-based RP accrual (works seamlessly for offline elapsed-time catch-up)
export function processPassiveAccrual(progression, ownerId, nowMs, options) {
  if (!progression || !progression.currencyLedger) return { ok: false, reason: 'missing_progression' };
  const opts = options || {};
  const currencyId = opts.currencyId || DEFAULT_ACCRUAL_CONFIG.passiveCurrencyId;
  const baseRate = typeof opts.baseRatePerSec === 'number' ? opts.baseRatePerSec : DEFAULT_ACCRUAL_CONFIG.passiveBaseRatePerSec;
  const lastMs = typeof progression.lastAccrualAtMs === 'number' ? progression.lastAccrualAtMs : nowMs;
  const elapsedMs = Math.max(0, nowMs - lastMs);

  if (elapsedMs <= 0) {
    return { ok: true, elapsedSec: 0, awardedScaled: 0, awarded: 0 };
  }

  const def = getCurrencyDefinition(progression.currencyLedger, currencyId);
  const precision = def ? def.decimalPrecision : 5;
  const mult = computeEffectiveGenerationMultiplier(opts.generationModifiers);
  const elapsedSec = elapsedMs / 1000;
  const rawAward = elapsedSec * baseRate * mult;
  const awardedScaled = Math.floor(rawAward * Math.pow(10, precision));

  if (awardedScaled <= 0) {
    return { ok: true, elapsedSec: elapsedSec, awardedScaled: 0, awarded: 0 };
  }

  // Only advance lastAccrualAtMs by the exact time consumed so sub-unit remainders are never lost
  const consumedSec = (awardedScaled / Math.pow(10, precision)) / (baseRate * mult);
  progression.lastAccrualAtMs = lastMs + Math.floor(consumedSec * 1000);

  const txRes = recordCurrencyTransaction(progression.currencyLedger, {
    ownerId: ownerId || 'player_1',
    ownerType: opts.ownerType || OWNER_TYPES.PLAYER,
    currencyId: currencyId,
    amountScaled: awardedScaled,
    transactionType: TRANSACTION_TYPES.AWARD,
    source: 'passive_accrual',
    referenceId: 'passive_' + String(lastMs) + '_' + String(nowMs),
    idempotencyKey: 'passive:' + String(ownerId || 'player_1') + ':' + String(lastMs) + ':' + String(nowMs),
    nowMs: nowMs
  });

  return {
    ok: txRes.ok,
    elapsedSec: elapsedSec,
    awardedScaled: awardedScaled,
    awarded: awardedScaled / Math.pow(10, precision),
    transaction: txRes.transaction || null
  };
}

// Event-driven fractional activity accrual with idempotency, cooldowns, caps & diminishing returns
export function awardActivityResearchPoints(progression, params) {
  if (!progression || !progression.currencyLedger || !params) {
    return { ok: false, reason: 'invalid_params' };
  }

  const rules = params.customRules || DEFAULT_ACTIVITY_AWARD_RULES;
  const rule = rules[params.activityType];
  if (!rule) {
    return { ok: false, reason: 'unknown_activity_type' };
  }

  const ownerId = params.ownerId || 'player_1';
  const ownerType = params.ownerType || OWNER_TYPES.PLAYER;
  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : 0;
  const eventId = params.eventId || null;
  const idempotencyKey = eventId
    ? ('act:' + ownerType + ':' + ownerId + ':' + rule.activityType + ':' + eventId)
    : null;

  // Duplicate event check before incrementing anti-abuse counters
  if (idempotencyKey && progression.currencyLedger.idempotencyIndex[idempotencyKey]) {
    return { ok: true, duplicate: true, awardedScaled: 0, awarded: 0, throttledReason: null };
  }

  if (!progression.antiAbuseCounters) progression.antiAbuseCounters = {};
  const counterKey = ownerType + ':' + ownerId + ':' + rule.activityType;
  let counter = progression.antiAbuseCounters[counterKey];
  if (!counter || (rule.windowMs && (nowMs - counter.windowStartMs) >= rule.windowMs)) {
    counter = { windowStartMs: nowMs, count: 0, lastAwardMs: -Infinity };
    progression.antiAbuseCounters[counterKey] = counter;
  }

  // Cooldown check
  if (rule.cooldownMs > 0 && (nowMs - counter.lastAwardMs) < rule.cooldownMs) {
    return { ok: false, duplicate: false, awardedScaled: 0, awarded: 0, throttledReason: 'cooldown_active' };
  }

  // Window cap check
  if (typeof rule.windowCapCount === 'number' && counter.count >= rule.windowCapCount) {
    return { ok: false, duplicate: false, awardedScaled: 0, awarded: 0, throttledReason: 'window_cap_reached' };
  }

  // Diminishing returns check
  let amount = rule.baseAmount;
  if (typeof rule.diminishingAfter === 'number' && counter.count >= rule.diminishingAfter) {
    amount = amount * (typeof rule.diminishingFactor === 'number' ? rule.diminishingFactor : 0.5);
  }

  const mult = computeEffectiveGenerationMultiplier(params.generationModifiers);
  amount = amount * mult;

  const def = getCurrencyDefinition(progression.currencyLedger, rule.currencyId);
  const precision = def ? def.decimalPrecision : 5;
  const amountScaled = toScaledInt(amount, precision);
  if (amountScaled <= 0) {
    return { ok: false, duplicate: false, awardedScaled: 0, awarded: 0, throttledReason: 'below_min_unit' };
  }

  const txRes = recordCurrencyTransaction(progression.currencyLedger, {
    ownerId: ownerId,
    ownerType: ownerType,
    currencyId: rule.currencyId,
    amountScaled: amountScaled,
    transactionType: TRANSACTION_TYPES.AWARD,
    source: 'activity:' + rule.activityType,
    referenceId: eventId,
    idempotencyKey: idempotencyKey,
    nowMs: nowMs
  });

  if (txRes.ok && !txRes.duplicate) {
    counter.count += 1;
    counter.lastAwardMs = nowMs;
  }

  return {
    ok: txRes.ok,
    duplicate: Boolean(txRes.duplicate),
    currencyId: rule.currencyId,
    awardedScaled: txRes.ok ? amountScaled : 0,
    awarded: txRes.ok ? (amountScaled / Math.pow(10, precision)) : 0,
    throttledReason: null,
    transaction: txRes.transaction || null
  };
}
