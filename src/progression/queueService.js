// =============================================================================
// RESEARCH QUEUE, PROGRESS & OFFLINE COMPLETION SERVICE (Inc 10.2 / ADR-0015 / Spec §10)
// Supports configurable queue capacity (1 free / 2 subscriber), atomic start with
// immutable Definition Version Snapshots, pending queue auto-promotion, pause/resume,
// configurable cancel refund policies, reordering, and offline elapsed-time completion.
// =============================================================================

import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  executeAtomicPayment,
  recordCurrencyTransaction
} from './currencyService.js';
import { evaluateResearchEligibility, EVALUATION_STATUS } from './eligibilityService.js';
import { PROTOTYPE_RESEARCH_ITEMS } from './researchCatalog.js';

export const REFUND_POLICIES = {
  NONE: 'none',
  FULL: 'full',
  FIXED_PERCENT: 'fixed_percent',
  TIME_BASED: 'time_based'
};

export function makeProgressKey(ownerType, ownerId, researchItemId) {
  return String(ownerType) + ':' + String(ownerId) + ':' + String(researchItemId);
}

function getItemDefinition(researchItemId, customCatalog) {
  const cat = customCatalog || PROTOTYPE_RESEARCH_ITEMS;
  return cat[researchItemId] || null;
}

export function getResearchProgressInstance(progression, ownerType, ownerId, researchItemId) {
  const key = makeProgressKey(ownerType, ownerId, researchItemId);
  if (!progression.researchProgress[key]) {
    progression.researchProgress[key] = {
      progressId: 'prog_' + key,
      researchItemId: researchItemId,
      ownerId: String(ownerId),
      ownerType: String(ownerType),
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
  return progression.researchProgress[key];
}

// Build flat map researchItemId -> progress instance for eligibility evaluator
export function buildOwnerProgressLookup(progression, ownerType, ownerId) {
  const map = {};
  const prefix = String(ownerType) + ':' + String(ownerId) + ':';
  const keys = Object.keys(progression.researchProgress || {});
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(prefix) === 0) {
      const itemId = keys[i].slice(prefix.length);
      map[itemId] = progression.researchProgress[keys[i]];
    }
  }
  return map;
}

export function startOrEnqueueResearch(progression, params) {
  if (!progression || !params) return { ok: false, reason: 'invalid_params' };
  const ownerId = params.ownerId || 'player_1';
  const ownerType = params.ownerType || OWNER_TYPES.PLAYER;
  const researchItemId = params.researchItemId;
  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : 0;
  const queue = params.queue || progression.researchQueue;
  const allowPending = params.allowPending !== false;

  const itemDef = getItemDefinition(researchItemId, params.catalog);
  if (!itemDef) return { ok: false, reason: 'unknown_research_item' };

  // Prevent duplicate active or pending entries for same item
  const isDupActive = queue.activeItems.some(function(a) { return a.researchItemId === researchItemId; });
  const isDupPending = queue.pendingItems.some(function(p) { return p.researchItemId === researchItemId; });
  if (isDupActive || isDupPending) {
    return { ok: false, reason: 'already_in_queue' };
  }

  const prog = getResearchProgressInstance(progression, ownerType, ownerId, researchItemId);
  const targetLevel = (prog.currentLevel || 0) + 1;
  const lvlDef = Array.isArray(itemDef.levelDefinitions)
    ? itemDef.levelDefinitions.find(function(l) { return l.level === targetLevel; })
    : null;
  if (!lvlDef) {
    return { ok: false, reason: EVALUATION_STATUS.MAX_LEVEL };
  }

  const isQueueFull = queue.activeItems.length >= (queue.capacity || 1);
  const eligCtx = Object.assign({}, params.eligibilityCtx || {}, {
    ownerId: ownerId,
    ownerType: ownerType,
    ledger: progression.currencyLedger,
    researchProgress: buildOwnerProgressLookup(progression, ownerType, ownerId),
    alignment: progression.alignment,
    discoveries: progression.discoveries,
    queueFull: isQueueFull && !allowPending
  });

  const elig = evaluateResearchEligibility(itemDef, targetLevel, eligCtx);
  if (!elig.canStart) {
    return { ok: false, reason: elig.status, unmetConditions: elig.unmetConditions };
  }

  // If active queue is full and pending is allowed, enqueue WITHOUT deducting costs yet (Spec §10.4)
  if (isQueueFull) {
    const pendingEntry = {
      queueEntryId: 'qpend_' + researchItemId + '_' + targetLevel + '_' + nowMs,
      researchItemId: researchItemId,
      ownerId: String(ownerId),
      ownerType: String(ownerType),
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
    source: 'research_start:' + researchItemId,
    referenceId: researchItemId + ':L' + targetLevel,
    idempotencyKey: 'rstart:' + ownerType + ':' + ownerId + ':' + researchItemId + ':L' + targetLevel + ':' + nowMs
  });

  if (!payRes.ok) {
    return { ok: false, reason: EVALUATION_STATUS.UNAFFORDABLE, shortfalls: payRes.shortfalls };
  }

  // Apply research speed modifier (strictly separate from RP accrual modifiers!)
  const speedBonus = typeof params.speedBonus === 'number' ? params.speedBonus : 0;
  const speedFactor = Math.max(0.1, 1 + speedBonus);
  const baseDurationMs = (lvlDef.durationSec || 60) * 1000;
  const effectiveDurationMs = Math.max(1000, Math.round(baseDurationMs / speedFactor));

  // Snapshot definition version, costs, duration & benefits so content updates never corrupt active progress
  const activeEntry = {
    queueEntryId: 'qact_' + researchItemId + '_' + targetLevel + '_' + nowMs,
    researchItemId: researchItemId,
    ownerId: String(ownerId),
    ownerType: String(ownerType),
    targetLevel: targetLevel,
    status: 'active',
    startedAt: nowMs,
    lastTickAt: nowMs,
    elapsedMs: 0,
    effectiveDurationMs: effectiveDurationMs,
    snapshot: {
      definitionVersion: itemDef.version || '1.0.0',
      durationSec: lvlDef.durationSec,
      costs: JSON.parse(JSON.stringify(lvlDef.costs || [])),
      benefits: JSON.parse(JSON.stringify(lvlDef.benefits || []))
    }
  };

  queue.activeItems.push(activeEntry);
  prog.targetLevel = targetLevel;
  prog.status = 'in_progress';
  prog.startedAt = nowMs;
  prog.definitionVersion = itemDef.version || '1.0.0';
  prog.lastUpdated = nowMs;

  return { ok: true, queuedAs: 'active', entry: activeEntry, transactions: payRes.transactions };
}

export function pauseResearchItem(progression, researchItemId, nowMs, queueOverride) {
  const queue = queueOverride || progression.researchQueue;
  const entry = queue.activeItems.find(function(a) { return a.researchItemId === researchItemId; });
  if (!entry || entry.status !== 'active') return { ok: false, reason: 'not_active' };

  const delta = Math.max(0, nowMs - entry.lastTickAt);
  entry.elapsedMs += delta;
  entry.lastTickAt = nowMs;
  entry.status = 'paused';
  return { ok: true, elapsedMs: entry.elapsedMs };
}

export function resumeResearchItem(progression, researchItemId, nowMs, queueOverride) {
  const queue = queueOverride || progression.researchQueue;
  const entry = queue.activeItems.find(function(a) { return a.researchItemId === researchItemId; });
  if (!entry || entry.status !== 'paused') return { ok: false, reason: 'not_paused' };

  entry.lastTickAt = nowMs;
  entry.status = 'active';
  return { ok: true, elapsedMs: entry.elapsedMs };
}

export function reorderPendingQueue(progression, fromIdx, toIdx, queueOverride) {
  const queue = queueOverride || progression.researchQueue;
  const list = queue.pendingItems;
  if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) {
    return { ok: false, reason: 'index_out_of_bounds' };
  }
  const moved = list.splice(fromIdx, 1)[0];
  list.splice(toIdx, 0, moved);
  return { ok: true, pendingItems: list };
}

export function cancelResearchItem(progression, researchItemId, options) {
  const opts = options || {};
  const queue = opts.queue || progression.researchQueue;
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : 0;

  // Check pending items first (no costs were deducted)
  const pIdx = queue.pendingItems.findIndex(function(p) { return p.researchItemId === researchItemId; });
  if (pIdx !== -1) {
    const removed = queue.pendingItems.splice(pIdx, 1)[0];
    return { ok: true, removedFrom: 'pending', refundedRatio: 0, entry: removed };
  }

  const aIdx = queue.activeItems.findIndex(function(a) { return a.researchItemId === researchItemId; });
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
          source: 'research_cancel:' + researchItemId,
          referenceId: entry.queueEntryId,
          idempotencyKey: 'rcancel:' + entry.queueEntryId + ':c' + i,
          nowMs: nowMs
        });
      } else if (c.kind === 'stockpile' && opts.stockpile) {
        opts.stockpile[c.resourceId] = Number(opts.stockpile[c.resourceId] || 0) + Math.floor(refundAmt);
      }
    }
  }

  const prog = getResearchProgressInstance(progression, entry.ownerType, entry.ownerId, researchItemId);
  prog.status = prog.currentLevel > 0 ? 'completed' : 'not_started';
  prog.targetLevel = prog.currentLevel;
  prog.lastUpdated = nowMs;

  return { ok: true, removedFrom: 'active', refundedRatio: ratio, entry: entry };
}

// Advance active research using authoritative elapsed time (handles offline catch-up + auto-promoting pending queue)
export function advanceResearchProgress(progression, nowMs, options) {
  const opts = options || {};
  const queue = opts.queue || progression.researchQueue;
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
      const prog = getResearchProgressInstance(progression, entry.ownerType, entry.ownerId, entry.researchItemId);
      prog.currentLevel = entry.targetLevel;
      prog.targetLevel = entry.targetLevel;
      prog.status = 'completed';
      prog.completedAt = nowMs;
      prog.totalTimeSpentMs = (prog.totalTimeSpentMs || 0) + entry.effectiveDurationMs;
      prog.completionCount = (prog.completionCount || 0) + 1;
      prog.lastUpdated = nowMs;

      completedItems.push({
        researchItemId: entry.researchItemId,
        completedLevel: entry.targetLevel,
        ownerId: entry.ownerId,
        ownerType: entry.ownerType,
        snapshot: entry.snapshot
      });
    }
  }

  // Auto-promote eligible pending items into freed active queue slots
  while (queue.activeItems.length < (queue.capacity || 1) && queue.pendingItems.length > 0) {
    const nextPending = queue.pendingItems.shift();
    const startRes = startOrEnqueueResearch(progression, {
      ownerId: nextPending.ownerId,
      ownerType: nextPending.ownerType,
      researchItemId: nextPending.researchItemId,
      nowMs: nowMs,
      queue: queue,
      allowPending: false,
      stockpile: opts.stockpile || null,
      eligibilityCtx: opts.eligibilityCtx || {},
      speedBonus: opts.speedBonus || 0,
      catalog: opts.catalog
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
