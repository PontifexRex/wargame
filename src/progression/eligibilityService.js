// =============================================================================
// GENERIC NESTED PREREQUISITE & ELIGIBILITY ENGINE (Inc 10.1 / ADR-0015 / Spec §8)
// Evaluates recursive AND / OR / NOT condition trees across Visibility, Eligibility,
// Start, Completion, and Bonus categories, returning rich diagnostic evaluation results.
// =============================================================================

import { getCurrencyBalance, OWNER_TYPES } from './currencyService.js';

export const EVALUATION_STATUS = {
  AVAILABLE: 'available',
  LOCKED: 'locked',
  HIDDEN: 'hidden',
  UNAFFORDABLE: 'unaffordable',
  QUEUE_FULL: 'queue_full',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MAX_LEVEL: 'max_level_reached',
  TEMP_UNAVAILABLE: 'temporarily_unavailable',
  RESTRICTED_GUILD: 'restricted_by_guild',
  RESTRICTED_ALLIANCE: 'restricted_by_alliance',
  RESTRICTED_ALIGNMENT: 'restricted_by_alignment',
  SUBJECT_UNAVAILABLE: 'subject_unavailable'
};

function compareValues(actual, op, expected) {
  switch (op) {
    case 'greater_than_or_equal':
    case '>=': return Number(actual || 0) >= Number(expected);
    case 'less_than_or_equal':
    case '<=': return Number(actual || 0) <= Number(expected);
    case 'greater_than':
    case '>':  return Number(actual || 0) > Number(expected);
    case 'less_than':
    case '<':  return Number(actual || 0) < Number(expected);
    case 'equals':
    case '==': return actual === expected;
    case 'not_equals':
    case '!=': return actual !== expected;
    case 'in': return Array.isArray(expected) && expected.indexOf(actual) !== -1;
    case 'contains': return Array.isArray(actual) && actual.indexOf(expected) !== -1;
    case 'contains_any':
      if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
      return expected.some(function(v) { return actual.indexOf(v) !== -1; });
    default:
      return actual === expected;
  }
}

function evaluateLeafCondition(cond, ctx) {
  const c = ctx || {};
  const type = cond.type;
  const op = cond.operator || 'greater_than_or_equal';
  const expected = cond.value;

  if (type === 'research_level') {
    const progMap = c.researchProgress || {};
    const inst = progMap[cond.research_item_id || cond.researchItemId];
    const actual = inst ? (inst.currentLevel || 0) : 0;
    const ok = compareValues(actual, op, expected);
    return {
      passed: ok,
      restriction: null,
      unmet: ok ? null : {
        type: type,
        researchItemId: cond.research_item_id || cond.researchItemId,
        expected: expected,
        actual: actual,
        reason: 'Requires ' + (cond.label || cond.research_item_id || cond.researchItemId) + ' Lv ' + expected + ' (have Lv ' + actual + ')'
      }
    };
  }

  if (type === 'hero_level') {
    const actual = c.hero ? (c.hero.level || 1) : (c.heroLevel || 0);
    const ok = compareValues(actual, op, expected);
    return {
      passed: ok,
      restriction: c.hero || typeof c.heroLevel === 'number' ? null : EVALUATION_STATUS.SUBJECT_UNAVAILABLE,
      unmet: ok ? null : { type: type, expected: expected, actual: actual, reason: 'Requires Hero Level ' + expected + ' (current: ' + actual + ')' }
    };
  }

  if (type === 'player_level') {
    const actual = c.playerLevel || 1;
    const ok = compareValues(actual, op, expected);
    return {
      passed: ok,
      restriction: null,
      unmet: ok ? null : { type: type, expected: expected, actual: actual, reason: 'Requires Player Level ' + expected }
    };
  }

  if (type === 'building_level') {
    const bMap = (c.city && c.city.buildings) ? c.city.buildings : (c.buildings || {});
    const actual = bMap[cond.buildingId] || 0;
    const ok = compareValues(actual, op, expected);
    return {
      passed: ok,
      restriction: null,
      unmet: ok ? null : { type: type, buildingId: cond.buildingId, expected: expected, actual: actual, reason: 'Requires ' + cond.buildingId + ' Level ' + expected }
    };
  }

  if (type === 'currency_balance') {
    const bal = c.ledger
      ? getCurrencyBalance(c.ledger, cond.ownerId || c.ownerId || 'player_1', cond.ownerType || c.ownerType || OWNER_TYPES.PLAYER, cond.currencyId).available
      : 0;
    const ok = compareValues(bal, op, expected);
    return {
      passed: ok,
      restriction: null,
      unmet: ok ? null : { type: type, currencyId: cond.currencyId, expected: expected, actual: bal, reason: 'Requires ' + expected + ' ' + cond.currencyId }
    };
  }

  if (type === 'guild_type') {
    const actual = c.guild ? c.guild.type : null;
    const ok = compareValues(actual, op === 'greater_than_or_equal' ? 'equals' : op, expected);
    return {
      passed: ok,
      restriction: ok ? null : EVALUATION_STATUS.RESTRICTED_GUILD,
      unmet: ok ? null : { type: type, expected: expected, actual: actual, reason: 'Requires Guild specialization: ' + expected }
    };
  }

  if (type === 'alliance_membership') {
    const isMember = Boolean(c.alliance && c.alliance.id);
    const ok = isMember === (expected !== false);
    return {
      passed: ok,
      restriction: ok ? null : EVALUATION_STATUS.RESTRICTED_ALLIANCE,
      unmet: ok ? null : { type: type, expected: true, actual: isMember, reason: 'Requires active Alliance membership' }
    };
  }

  if (type === 'divine_alignment_tag') {
    const tags = (c.alignment && Array.isArray(c.alignment.godTags)) ? c.alignment.godTags : [];
    const ok = Array.isArray(expected)
      ? compareValues(tags, 'contains_any', expected)
      : compareValues(tags, 'contains', expected);
    return {
      passed: ok,
      restriction: ok ? null : EVALUATION_STATUS.RESTRICTED_ALIGNMENT,
      unmet: ok ? null : { type: type, expected: expected, actual: tags, reason: 'Requires Divine Alignment tag: ' + String(expected) }
    };
  }

  if (type === 'discovery_status') {
    const discovered = (c.discoveries && c.discoveries[cond.discoveryId]) === true;
    const ok = discovered === (expected !== false);
    return {
      passed: ok,
      restriction: null,
      unmet: ok ? null : { type: type, discoveryId: cond.discoveryId, expected: true, actual: discovered, reason: 'Must first discover ' + cond.discoveryId }
    };
  }

  return { passed: true, restriction: null, unmet: null };
}

export function evaluateConditionNode(node, ctx) {
  if (!node) return { passed: true, unmetConditions: [], restrictionStatus: null };

  // Composite Group (AND / OR / NOT)
  if (node.operator === 'AND' || node.operator === 'OR' || node.operator === 'NOT') {
    const children = Array.isArray(node.conditions) ? node.conditions : [];
    if (node.operator === 'NOT') {
      const sub = children.length > 0 ? evaluateConditionNode(children[0], ctx) : { passed: false };
      const passed = !sub.passed;
      return {
        passed: passed,
        unmetConditions: passed ? [] : [{ type: 'NOT', reason: node.reason || 'Condition must not be met' }],
        restrictionStatus: null
      };
    }

    if (node.operator === 'AND') {
      const unmet = [];
      let restriction = null;
      for (let i = 0; i < children.length; i++) {
        const res = evaluateConditionNode(children[i], ctx);
        if (!res.passed) {
          for (let j = 0; j < res.unmetConditions.length; j++) unmet.push(res.unmetConditions[j]);
          if (!restriction && res.restrictionStatus) restriction = res.restrictionStatus;
        }
      }
      return {
        passed: unmet.length === 0,
        unmetConditions: unmet,
        restrictionStatus: restriction
      };
    }

    if (node.operator === 'OR') {
      const allUnmet = [];
      let restriction = null;
      for (let i = 0; i < children.length; i++) {
        const res = evaluateConditionNode(children[i], ctx);
        if (res.passed) {
          return { passed: true, unmetConditions: [], restrictionStatus: null };
        }
        for (let j = 0; j < res.unmetConditions.length; j++) allUnmet.push(res.unmetConditions[j]);
        if (!restriction && res.restrictionStatus) restriction = res.restrictionStatus;
      }
      return {
        passed: children.length === 0,
        unmetConditions: allUnmet,
        restrictionStatus: restriction
      };
    }
  }

  // Leaf Condition
  const leaf = evaluateLeafCondition(node, ctx);
  return {
    passed: leaf.passed,
    unmetConditions: leaf.unmet ? [leaf.unmet] : [],
    restrictionStatus: leaf.restriction
  };
}

export function evaluateResearchEligibility(itemDef, targetLevel, ctx) {
  if (!itemDef) {
    return { status: EVALUATION_STATUS.TEMP_UNAVAILABLE, canStart: false, unmetConditions: [{ reason: 'Unknown research item' }] };
  }

  const context = ctx || {};
  const progMap = context.researchProgress || {};
  const inst = progMap[itemDef.researchItemId];
  const curLvl = inst ? (inst.currentLevel || 0) : 0;

  if (curLvl >= (itemDef.levelLimit || 1)) {
    return { status: EVALUATION_STATUS.MAX_LEVEL, canStart: false, unmetConditions: [] };
  }

  if (inst && inst.status === 'in_progress') {
    return { status: EVALUATION_STATUS.IN_PROGRESS, canStart: false, unmetConditions: [] };
  }

  // 1. Visibility check
  if (itemDef.visibilityRules) {
    const vis = evaluateConditionNode(itemDef.visibilityRules, context);
    if (!vis.passed) {
      return { status: EVALUATION_STATUS.HIDDEN, canStart: false, unmetConditions: vis.unmetConditions };
    }
  }

  // 2. Item-level & Level-specific Eligibility Prerequisites
  const lvlDef = Array.isArray(itemDef.levelDefinitions)
    ? itemDef.levelDefinitions.find(function(l) { return l.level === targetLevel; })
    : null;

  const combinedUnmet = [];
  let restriction = null;

  if (itemDef.prerequisites) {
    const r1 = evaluateConditionNode(itemDef.prerequisites, context);
    if (!r1.passed) {
      for (let i = 0; i < r1.unmetConditions.length; i++) combinedUnmet.push(r1.unmetConditions[i]);
      if (r1.restrictionStatus) restriction = r1.restrictionStatus;
    }
  }

  if (lvlDef && lvlDef.prerequisites) {
    const r2 = evaluateConditionNode(lvlDef.prerequisites, context);
    if (!r2.passed) {
      for (let i = 0; i < r2.unmetConditions.length; i++) combinedUnmet.push(r2.unmetConditions[i]);
      if (!restriction && r2.restrictionStatus) restriction = r2.restrictionStatus;
    }
  }

  if (combinedUnmet.length > 0) {
    return {
      status: restriction || EVALUATION_STATUS.LOCKED,
      canStart: false,
      unmetConditions: combinedUnmet
    };
  }

  // 3. Queue Capacity check
  if (context.queueFull === true) {
    return { status: EVALUATION_STATUS.QUEUE_FULL, canStart: false, unmetConditions: [{ reason: 'Research queue is full' }] };
  }

  return {
    status: EVALUATION_STATUS.AVAILABLE,
    canStart: true,
    unmetConditions: []
  };
}
