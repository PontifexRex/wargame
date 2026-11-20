// =============================================================================
// SEPARATE HERO & SUBJECT TRAINING QUEUE SERVICE (Inc 10.4 / Spec §3.4, §7, §14)
// Manages subject-scoped TrainingInstances (Hero, City, Unit, Construct) on a
// dedicated Training Queue completely independent of the Personal Research Queue.
// Personal Research unlocks training options; each subject trains independently.
// =============================================================================

import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  executeAtomicPayment,
  recordCurrencyTransaction
} from './currencyService.js';
import { evaluateConditionNode, EVALUATION_STATUS } from './eligibilityService.js';
import { PROTOTYPE_TRAINING_DEFINITIONS } from './researchCatalog.js';
import { buildOwnerProgressLookup, REFUND_POLICIES } from './queueService.js';
import {
  EFFECT_TYPES,
  collectActiveEffects,
  resolveNumericStat,
  resolveUnlockState
} from './benefitService.js';

export const SUBJECT_TYPES = {
  HERO: 'hero',
  CITY: 'city',
  UNIT: 'unit',
  CONSTRUCT: 'construct'
};

export function makeTrainingKey(subjectType, subjectId, trainingDefinitionId) {
  return String(subjectType) + ':' + String(subjectId) + ':' + String(trainingDefinitionId);
}

function getTrainingDefinition(trainingDefinitionId, customCatalog) {
  const cat = customCatalog || PROTOTYPE_TRAINING_DEFINITIONS;
  return cat[trainingDefinitionId] || null;
}

export function getTrainingInstance(progression, subjectType, subjectId, trainingDefinitionId) {
  const key = makeTrainingKey(subjectType, subjectId, trainingDefinitionId);
  if (!progression.trainingInstances[key]) {
    progression.trainingInstances[key] = {
      trainingInstanceId: 'trn_' + key,
      trainingDefinitionId: String(trainingDefinitionId),
      subjectId: String(subjectId),
      subjectType: String(subjectType),
      currentLevel: 0,
      targetLevel: 0,
      status: 'not_started',
      startedAt: null,
      completedAt: null,
      totalTimeSpentMs: 0,
      completionCount: 0,
      definitionVersion: '1.0.0',
      lastUpdated: 0
    };
  }
  return progression.trainingInstances[key];
}

export function evaluateTrainingEligibility(progression, params) {
  if (!progression || !params) {
    return { canStart: false, status: EVALUATION_STATUS.LOCKED, unmetConditions: [{ reason: 'Invalid parameters' }] };
  }
  const ownerId = String(params.ownerId || 'player_1');
  const ownerType = params.ownerType || OWNER_TYPES.PLAYER;
  const subjectType = String(params.subjectType || SUBJECT_TYPES.HERO);
  const subjectId = params.subjectId ? String(params.subjectId) : null;
  const trainingDefinitionId = params.trainingDefinitionId;

  if (!subjectId) {
    return { canStart: false, status: EVALUATION_STATUS.SUBJECT_UNAVAILABLE, unmetConditions: [{ reason: 'No training subject specified' }] };
  }
  if (params.subjectAvailable === false) {
    return { canStart: false, status: EVALUATION_STATUS.SUBJECT_UNAVAILABLE, unmetConditions: [{ reason: 'Subject is currently unavailable for training' }] };
  }

  const def = getTrainingDefinition(trainingDefinitionId, params.trainingCatalog);
  if (!def) {
    return { canStart: false, status: EVALUATION_STATUS.LOCKED, unmetConditions: [{ reason: 'Unknown training definition: ' + trainingDefinitionId }] };
  }
  if (def.subjectType && def.subjectType !== subjectType) {
    return { canStart: false, status: EVALUATION_STATUS.SUBJECT_UNAVAILABLE, unmetConditions: [{ reason: 'Training requires subject type ' + def.subjectType }] };
  }

  const inst = getTrainingInstance(progression, subjectType, subjectId, trainingDefinitionId);
  const targetLevel = typeof params.targetLevel === 'number' ? params.targetLevel : ((inst.currentLevel || 0) + 1);
  const lvlDef = Array.isArray(def.levels)
    ? def.levels.find(function(l) { return l.level === targetLevel; })
    : null;
  if (!lvlDef) {
    return { canStart: false, status: EVALUATION_STATUS.MAX_LEVEL, unmetConditions: [{ reason: 'Maximum training level reached' }] };
  }

  const unmet = [];

  // 1. Verify capability unlock via BenefitService (if unlocked via research)
  if (params.requireUnlock !== false) {
    const activeEffects = collectActiveEffects(progression, {
      playerId: ownerId,
      researchCatalog: params.researchCatalog,
      orgCatalog: params.orgCatalog,
      trainingCatalog: params.trainingCatalog,
      extraEffects: params.extraEffects
    });
    const unlockState = resolveUnlockState(trainingDefinitionId, activeEffects.unlocks, {
      effectType: EFFECT_TYPES.UNLOCK_TRAINING
    });
    if (!unlockState.unlocked || unlockState.maxUnlockLevel < targetLevel) {
      unmet.push({
        type: 'unlock_training',
        target: trainingDefinitionId,
        expected: targetLevel,
        actual: unlockState.maxUnlockLevel,
        reason: 'Requires research unlock for ' + def.name + ' Level ' + targetLevel
      });
    }
  }

  // 2. Evaluate training-level and definition-level prerequisites
  const eligCtx = Object.assign({}, params.eligibilityCtx || {}, {
    ownerId: ownerId,
    ownerType: ownerType,
    ledger: progression.currencyLedger,
    researchProgress: buildOwnerProgressLookup(progression, ownerType, ownerId),
    alignment: progression.alignment,
    discoveries: progression.discoveries
  });

  if (def.prerequisites) {
    const baseEval = evaluateConditionNode(def.prerequisites, eligCtx);
    if (!baseEval.passed) {
      for (let i = 0; i < baseEval.unmetConditions.length; i++) {
        unmet.push(baseEval.unmetConditions[i]);
      }
    }
  }
  if (lvlDef.prerequisites) {
    const lvlEval = evaluateConditionNode(lvlDef.prerequisites, eligCtx);
    if (!lvlEval.passed) {
      for (let j = 0; j < lvlEval.unmetConditions.length; j++) {
        unmet.push(lvlEval.unmetConditions[j]);
      }
    }
  }

  if (unmet.length > 0) {
    return {
      canStart: false,
      status: EVALUATION_STATUS.LOCKED,
      targetLevel: targetLevel,
      unmetConditions: unmet
    };
  }

  return {
    canStart: true,
    status: EVALUATION_STATUS.AVAILABLE,
    targetLevel: targetLevel,
    levelDefinition: lvlDef,
    definition: def,
    unmetConditions: []
  };
}

export function startOrEnqueueTraining(progression, params) {
  if (!progression || !params) return { ok: false, reason: 'invalid_params' };
  const ownerId = String(params.ownerId || 'player_1');
  const ownerType = params.ownerType || OWNER_TYPES.PLAYER;
  const subjectType = String(params.subjectType || SUBJECT_TYPES.HERO);
  const subjectId = params.subjectId ? String(params.subjectId) : null;
  const trainingDefinitionId = params.trainingDefinitionId;
  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : 0;
  const queue = params.queue || progression.trainingQueue;
  const allowPending = params.allowPending !== false;

  if (!subjectId) return { ok: false, reason: EVALUATION_STATUS.SUBJECT_UNAVAILABLE };

  // Prevent duplicate active or pending training of the same definition for the same subject
  const isDupActive = queue.activeItems.some(function(a) {
    return a.subjectType === subjectType && a.subjectId === subjectId && a.trainingDefinitionId === trainingDefinitionId;
  });
  const isDupPending = queue.pendingItems.some(function(p) {
    return p.subjectType === subjectType && p.subjectId === subjectId && p.trainingDefinitionId === trainingDefinitionId;
  });
  if (isDupActive || isDupPending) {
    return { ok: false, reason: 'already_in_training_queue' };
  }

  const elig = evaluateTrainingEligibility(progression, params);
  if (!elig.canStart) {
    return { ok: false, reason: elig.status, unmetConditions: elig.unmetConditions };
  }

  const def = elig.definition;
  const lvlDef = elig.levelDefinition;
  const targetLevel = elig.targetLevel;
  const isQueueFull = queue.activeItems.length >= (queue.capacity || 1);

  if (isQueueFull && !allowPending) {
    return { ok: false, reason: EVALUATION_STATUS.QUEUE_FULL };
  }

  // Pending entries do not deduct costs until promoted to active
  if (isQueueFull) {
    const pendingEntry = {
      queueEntryId: 'tpend_' + subjectId + '_' + trainingDefinitionId + '_' + targetLevel + '_' + nowMs,
      trainingDefinitionId: trainingDefinitionId,
      ownerId: ownerId,
      ownerType: String(ownerType),
      subjectType: subjectType,
      subjectId: subjectId,
      targetLevel: targetLevel,
      enqueuedAt: nowMs,
      status: 'pending'
    };
    queue.pendingItems.push(pendingEntry);
    return { ok: true, queuedAs: 'pending', entry: pendingEntry };
  }

  // Atomic all-or-nothing payment validation & deduction
  const payRes = executeAtomicPayment(progression.currencyLedger, lvlDef.costs || [], {
    ownerId: ownerId,
    ownerType: ownerType,
    stockpile: params.stockpile || null,
    nowMs: nowMs,
    source: 'training_start:' + trainingDefinitionId + ':' + subjectId,
    referenceId: subjectId + ':' + trainingDefinitionId + ':L' + targetLevel,
    idempotencyKey: 'tstart:' + subjectType + ':' + subjectId + ':' + trainingDefinitionId + ':L' + targetLevel + ':' + nowMs
  });

  if (!payRes.ok) {
    return { ok: false, reason: EVALUATION_STATUS.UNAFFORDABLE, shortfalls: payRes.shortfalls };
  }

  const speedBonus = typeof params.speedBonus === 'number' ? params.speedBonus : 0;
  const speedFactor = Math.max(0.1, 1 + speedBonus);
  const baseDurationMs = (lvlDef.durationSec || 30) * 1000;
  const effectiveDurationMs = Math.max(1000, Math.round(baseDurationMs / speedFactor));

  const activeEntry = {
    queueEntryId: 'tact_' + subjectId + '_' + trainingDefinitionId + '_' + targetLevel + '_' + nowMs,
    trainingDefinitionId: trainingDefinitionId,
    ownerId: ownerId,
    ownerType: String(ownerType),
    subjectType: subjectType,
    subjectId: subjectId,
    targetLevel: targetLevel,
    status: 'active',
    startedAt: nowMs,
    lastTickAt: nowMs,
    elapsedMs: 0,
    effectiveDurationMs: effectiveDurationMs,
    snapshot: {
      definitionVersion: def.version || '1.0.0',
      durationSec: lvlDef.durationSec,
      costs: JSON.parse(JSON.stringify(lvlDef.costs || [])),
      benefits: JSON.parse(JSON.stringify(lvlDef.benefits || []))
    }
  };

  queue.activeItems.push(activeEntry);

  const inst = getTrainingInstance(progression, subjectType, subjectId, trainingDefinitionId);
  inst.targetLevel = targetLevel;
  inst.status = 'in_progress';
  inst.startedAt = nowMs;
  inst.definitionVersion = def.version || '1.0.0';
  inst.lastUpdated = nowMs;

  return { ok: true, queuedAs: 'active', entry: activeEntry, transactions: payRes.transactions };
}

export function pauseTrainingItem(progression, subjectId, trainingDefinitionId, nowMs, options) {
  const opts = options || {};
  const queue = opts.queue || progression.trainingQueue;
  const subjectType = String(opts.subjectType || SUBJECT_TYPES.HERO);
  const entry = queue.activeItems.find(function(a) {
    return a.subjectType === subjectType && a.subjectId === String(subjectId) && a.trainingDefinitionId === trainingDefinitionId;
  });
  if (!entry || entry.status !== 'active') return { ok: false, reason: 'not_active' };

  entry.elapsedMs += Math.max(0, nowMs - entry.lastTickAt);
  entry.lastTickAt = nowMs;
  entry.status = 'paused';
  return { ok: true, elapsedMs: entry.elapsedMs };
}

export function resumeTrainingItem(progression, subjectId, trainingDefinitionId, nowMs, options) {
  const opts = options || {};
  const queue = opts.queue || progression.trainingQueue;
  const subjectType = String(opts.subjectType || SUBJECT_TYPES.HERO);
  const entry = queue.activeItems.find(function(a) {
    return a.subjectType === subjectType && a.subjectId === String(subjectId) && a.trainingDefinitionId === trainingDefinitionId;
  });
  if (!entry || entry.status !== 'paused') return { ok: false, reason: 'not_paused' };

  entry.lastTickAt = nowMs;
  entry.status = 'active';
  return { ok: true, elapsedMs: entry.elapsedMs };
}

export function cancelTrainingItem(progression, subjectId, trainingDefinitionId, options) {
  const opts = options || {};
  const queue = opts.queue || progression.trainingQueue;
  const subjectType = String(opts.subjectType || SUBJECT_TYPES.HERO);
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : 0;

  const pIdx = queue.pendingItems.findIndex(function(p) {
    return p.subjectType === subjectType && p.subjectId === String(subjectId) && p.trainingDefinitionId === trainingDefinitionId;
  });
  if (pIdx !== -1) {
    const removed = queue.pendingItems.splice(pIdx, 1)[0];
    return { ok: true, removedFrom: 'pending', refundedRatio: 0, entry: removed };
  }

  const aIdx = queue.activeItems.findIndex(function(a) {
    return a.subjectType === subjectType && a.subjectId === String(subjectId) && a.trainingDefinitionId === trainingDefinitionId;
  });
  if (aIdx === -1) return { ok: false, reason: 'not_found_in_queue' };

  const entry = queue.activeItems.splice(aIdx, 1)[0];
  if (entry.status === 'active') {
    entry.elapsedMs += Math.max(0, nowMs - entry.lastTickAt);
  }

  const policy = opts.refundPolicy || REFUND_POLICIES.FIXED_PERCENT;
  let ratio = 0;
  if (policy === REFUND_POLICIES.FULL) {
    ratio = 1.0;
  } else if (policy === REFUND_POLICIES.FIXED_PERCENT) {
    ratio = typeof opts.refundRatio === 'number' ? opts.refundRatio : 0.5;
  } else if (policy === REFUND_POLICIES.TIME_BASED) {
    ratio = Math.max(0, Math.min(1, 1 - (entry.elapsedMs / Math.max(1, entry.effectiveDurationMs))));
  }

  const snapCosts = (entry.snapshot && Array.isArray(entry.snapshot.costs)) ? entry.snapshot.costs : [];
  if (ratio > 0) {
    for (let i = 0; i < snapCosts.length; i++) {
      const c = snapCosts[i];
      if (c.consumed === false) continue;
      const refundAmt = Number(c.amount || 0) * ratio;
      if (refundAmt <= 0) continue;
      if ((c.kind || 'currency') === 'currency') {
        recordCurrencyTransaction(progression.currencyLedger, {
          ownerId: c.ownerId || entry.ownerId,
          ownerType: c.ownerType || entry.ownerType,
          currencyId: c.currencyId,
          amount: refundAmt,
          transactionType: TRANSACTION_TYPES.REFUND,
          source: 'training_cancel:' + trainingDefinitionId,
          referenceId: entry.queueEntryId,
          idempotencyKey: 'tcancel:' + entry.queueEntryId + ':c' + i,
          nowMs: nowMs
        });
      } else if (c.kind === 'stockpile' && opts.stockpile) {
        opts.stockpile[c.resourceId] = Number(opts.stockpile[c.resourceId] || 0) + Math.floor(refundAmt);
      }
    }
  }

  const inst = getTrainingInstance(progression, entry.subjectType, entry.subjectId, trainingDefinitionId);
  inst.status = inst.currentLevel > 0 ? 'completed' : 'not_started';
  inst.targetLevel = inst.currentLevel;
  inst.lastUpdated = nowMs;

  return { ok: true, removedFrom: 'active', refundedRatio: ratio, entry: entry };
}

export function advanceTrainingProgress(progression, nowMs, options) {
  const opts = options || {};
  const queue = opts.queue || progression.trainingQueue;
  const completedItems = [];
  const promotedItems = [];

  for (let i = queue.activeItems.length - 1; i >= 0; i--) {
    const entry = queue.activeItems[i];
    if (entry.status !== 'active') continue;

    const delta = Math.max(0, nowMs - entry.lastTickAt);
    entry.elapsedMs += delta;
    entry.lastTickAt = nowMs;

    if (entry.elapsedMs >= entry.effectiveDurationMs) {
      queue.activeItems.splice(i, 1);
      const inst = getTrainingInstance(progression, entry.subjectType, entry.subjectId, entry.trainingDefinitionId);
      inst.currentLevel = entry.targetLevel;
      inst.targetLevel = entry.targetLevel;
      inst.status = 'completed';
      inst.completedAt = nowMs;
      inst.totalTimeSpentMs = (inst.totalTimeSpentMs || 0) + entry.effectiveDurationMs;
      inst.completionCount = (inst.completionCount || 0) + 1;
      inst.lastUpdated = nowMs;

      completedItems.push({
        trainingDefinitionId: entry.trainingDefinitionId,
        completedLevel: entry.targetLevel,
        subjectType: entry.subjectType,
        subjectId: entry.subjectId,
        ownerId: entry.ownerId,
        ownerType: entry.ownerType,
        snapshot: entry.snapshot
      });
    }
  }

  while (queue.activeItems.length < (queue.capacity || 1) && queue.pendingItems.length > 0) {
    const nextPending = queue.pendingItems.shift();
    const startRes = startOrEnqueueTraining(progression, {
      ownerId: nextPending.ownerId,
      ownerType: nextPending.ownerType,
      subjectType: nextPending.subjectType,
      subjectId: nextPending.subjectId,
      trainingDefinitionId: nextPending.trainingDefinitionId,
      nowMs: nowMs,
      queue: queue,
      allowPending: false,
      stockpile: opts.stockpile || null,
      eligibilityCtx: opts.eligibilityCtx || {},
      speedBonus: opts.speedBonus || 0,
      researchCatalog: opts.researchCatalog,
      orgCatalog: opts.orgCatalog,
      trainingCatalog: opts.trainingCatalog,
      requireUnlock: opts.requireUnlock
    });
    if (startRes.ok) {
      promotedItems.push(startRes.entry);
    }
  }

  return {
    completedItems: completedItems,
    promotedItems: promotedItems
  };
}

export function getSubjectTrainingSummary(progression, subjectType, subjectId) {
  const prefix = String(subjectType) + ':' + String(subjectId) + ':';
  const instMap = (progression && progression.trainingInstances) ? progression.trainingInstances : {};
  const keys = Object.keys(instMap);
  const completed = [];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(prefix) !== 0) continue;
    const inst = instMap[keys[i]];
    if (inst && inst.currentLevel > 0) {
      completed.push({
        trainingDefinitionId: inst.trainingDefinitionId,
        currentLevel: inst.currentLevel,
        completedAt: inst.completedAt
      });
    }
  }
  return completed;
}

export function computeSubjectEffectiveStat(progression, subjectType, subjectId, baseValue, statTarget, options) {
  const opts = options || {};
  const collected = collectActiveEffects(progression, {
    playerId: opts.playerId || opts.ownerId || 'player_1',
    guildId: opts.guildId,
    allianceId: opts.allianceId,
    subjectType: subjectType,
    subjectId: subjectId,
    researchCatalog: opts.researchCatalog,
    orgCatalog: opts.orgCatalog,
    trainingCatalog: opts.trainingCatalog,
    extraEffects: opts.extraEffects
  });
  return resolveNumericStat(baseValue, statTarget, collected.modifiers, {
    effectType: opts.effectType || null
  });
}
