// Unified Object Interaction & Traversal Pipeline (ADR-0010)
// Evaluates requirements, deducts costs, applies atomic effects, and emits domain events.

import { gameState } from './state.js';
import { ENGINE_EVENTS, emitEngineEvent } from './events.js';
import { findObjectById, removeWorldObject } from './objects.js';

let interactionSeq = 1000;

export function createInteractionRequest(actorId, targetId, actionId, parameters = {}, context = {}) {
  return {
    requestId: `req_${Date.now()}_${interactionSeq++}`,
    actorId: actorId || 'hero',
    targetId: targetId,
    actionId: actionId || 'inspect',
    parameters: parameters || {},
    context: context || {}
  };
}

export function createInteractionResult(ok, actionId, reason = null, stateChanged = false, effectsApplied = [], message = '') {
  return {
    ok: Boolean(ok),
    success: Boolean(ok),
    actionId: actionId,
    reason: reason,
    stateChanged: Boolean(stateChanged),
    effectsApplied: Array.isArray(effectsApplied) ? effectsApplied : [],
    message: message || ''
  };
}

// ============================================================================
// REQUIREMENT EVALUATION ENGINE
// ============================================================================

export function evaluateRequirement(req, context = {}) {
  if (!req) return { ok: true };

  // Composable Boolean Combinators
  if (req.op === 'AND') {
    const rules = Array.isArray(req.rules) ? req.rules : [];
    for (let i = 0; i < rules.length; i++) {
      const res = evaluateRequirement(rules[i], context);
      if (!res.ok) return res;
    }
    return { ok: true };
  }

  if (req.op === 'OR') {
    const rules = Array.isArray(req.rules) ? req.rules : [];
    if (rules.length === 0) return { ok: true };
    let lastReason = 'no_condition_met';
    for (let i = 0; i < rules.length; i++) {
      const res = evaluateRequirement(rules[i], context);
      if (res.ok) return { ok: true };
      lastReason = res.reason;
    }
    return { ok: false, reason: lastReason };
  }

  if (req.op === 'NOT') {
    const res = evaluateRequirement(req.rule, context);
    return {
      ok: !res.ok,
      reason: res.ok ? 'condition_prohibited' : null
    };
  }

  const actor = context.actor;
  const target = context.target;

  // Specific rule types:
  if (req.type === 'hasItemTag') {
    const tag = req.tag;
    const inv = (actor && (actor.expeditionPack || actor.inventory)) || [];
    const hasTag = inv.some(it => {
      if (!it) return false;
      if (Array.isArray(it.tags) && it.tags.indexOf(tag) !== -1) return true;
      if (it.components && it.components.key && it.components.key.keyTag === tag) return true;
      if (it.keyTag === tag) return true;
      return false;
    });
    if (!hasTag) {
      return { ok: false, reason: `missing_item_tag:${tag}` };
    }
    return { ok: true };
  }

  if (req.type === 'hasItemDef') {
    const defId = req.defId;
    const inv = (actor && (actor.expeditionPack || actor.inventory)) || [];
    const hasDef = inv.some(it => it && (it.definitionId === defId || it.id === defId));
    if (!hasDef) {
      return { ok: false, reason: `missing_item_def:${defId}` };
    }
    return { ok: true };
  }

  if (req.type === 'minStat') {
    const stat = req.stat;
    const minVal = req.value || 0;
    const val = (actor && (actor[stat] || (actor.bonusStats && actor.bonusStats[stat]))) || 0;
    if (val < minVal) {
      return { ok: false, reason: `insufficient_stat:${stat}_need_${minVal}` };
    }
    return { ok: true };
  }

  if (req.type === 'requiredClass') {
    const needed = req.classId;
    if (!actor || actor.classId !== needed) {
      return { ok: false, reason: `required_class:${needed}` };
    }
    return { ok: true };
  }

  if (req.type === 'objectState') {
    const axis = req.axis;
    const expected = req.value;
    const current = target && target.runtimeState && target.runtimeState[axis];
    if (current !== expected) {
      return { ok: false, reason: `invalid_state:${axis}_is_${current}_need_${expected}` };
    }
    return { ok: true };
  }

  if (req.type === 'custom' && typeof req.fn === 'function') {
    const pass = req.fn(context);
    return { ok: Boolean(pass), reason: pass ? null : 'custom_requirement_failed' };
  }

  return { ok: true };
}

// ============================================================================
// COST PROCESSOR
// ============================================================================

export function deductInteractionCosts(costs, context = {}) {
  if (!costs || typeof costs !== 'object') return true;
  const actor = context.actor;
  if (!actor) return true;

  if (costs.consumeItemTag) {
    const tag = costs.consumeItemTag;
    const inv = actor.expeditionPack || actor.inventory || [];
    for (let i = 0; i < inv.length; i++) {
      const it = inv[i];
      const match = it && (
        (Array.isArray(it.tags) && it.tags.indexOf(tag) !== -1) ||
        (it.components && it.components.key && it.components.key.keyTag === tag) ||
        (it.keyTag === tag)
      );
      if (match) {
        if (typeof it.quantity === 'number' && it.quantity > 1) {
          it.quantity -= 1;
        } else {
          inv.splice(i, 1);
        }
        break;
      }
    }
  }

  if (costs.consumeItemDef) {
    const defId = costs.consumeItemDef;
    const inv = actor.expeditionPack || actor.inventory || [];
    for (let i = 0; i < inv.length; i++) {
      const it = inv[i];
      if (it && (it.definitionId === defId || it.id === defId)) {
        if (typeof it.quantity === 'number' && it.quantity > 1) {
          it.quantity -= 1;
        } else {
          inv.splice(i, 1);
        }
        break;
      }
    }
  }

  if (typeof costs.deductMp === 'number' && costs.deductMp > 0) {
    actor.mp = Math.max(0, (actor.mp || 0) - costs.deductMp);
  }

  return true;
}

// ============================================================================
// ATOMIC EFFECT RUNNER
// ============================================================================

export function applyInteractionEffects(effects, context = {}, state = gameState) {
  if (!Array.isArray(effects)) return [];
  const applied = [];
  const actor = context.actor;
  const target = context.target;
  const floor = context.floor;

  for (let i = 0; i < effects.length; i++) {
    const eff = effects[i];
    if (!eff) continue;

    if (eff.type === 'changeState' && target && target.runtimeState) {
      target.runtimeState[eff.axis] = eff.value;
      applied.push(eff);
    } else if (eff.type === 'updatePermeability' && target && target.permeability) {
      if (eff.movement !== undefined) target.permeability.movement = Boolean(eff.movement);
      if (eff.lineOfSight !== undefined) target.permeability.lineOfSight = Boolean(eff.lineOfSight);
      if (eff.light !== undefined) target.permeability.light = Boolean(eff.light);
      if (eff.projectiles !== undefined) target.permeability.projectiles = Boolean(eff.projectiles);
      if (eff.magic !== undefined) target.permeability.magic = Boolean(eff.magic);
      applied.push(eff);
    } else if (eff.type === 'bashDoor' && target && target.components && target.components.durability) {
      const dur = target.components.durability;
      const atkPower = (actor && (actor.atk || actor.str)) || 10;
      const armor = dur.armor || 0;
      const dmg = Math.max(1, atkPower - armor);
      dur.hp = Math.max(0, dur.hp - dmg);

      if (dur.hp <= 0) {
        if (target.runtimeState) {
          target.runtimeState.structural = 'destroyed';
          target.runtimeState.mechanical = 'open';
        }
        if (target.permeability) {
          target.permeability.movement = true;
          target.permeability.lineOfSight = true;
          target.permeability.light = true;
          target.permeability.projectiles = true;
          target.permeability.magic = true;
        }
      } else if (dur.hp <= dur.maxHp * 0.4) {
        if (target.runtimeState) {
          target.runtimeState.structural = 'critically_damaged';
        }
      } else {
        if (target.runtimeState) {
          target.runtimeState.structural = 'damaged';
        }
      }
      applied.push(Object.assign({}, eff, { damageDealt: dmg, remainingHp: dur.hp }));
    } else if (eff.type === 'applyDamage' && target && target.components && target.components.durability) {
      const dmg = Math.max(1, eff.amount || 1);
      target.components.durability.hp = Math.max(0, target.components.durability.hp - dmg);
      if (target.components.durability.hp <= 0 && target.runtimeState) {
        target.runtimeState.structural = 'destroyed';
      } else if (target.components.durability.hp < target.components.durability.maxHp * 0.4 && target.runtimeState) {
        target.runtimeState.structural = 'damaged';
      }
      applied.push(eff);
    } else if (eff.type === 'pickupItem' && target && target.components && target.components.pickup) {
      const itemToTake = target.components.pickup.item;
      if (itemToTake && actor) {
        const pack = actor.expeditionPack || (state.guildVault ? state.guildVault.armory : null);
        if (pack) {
          pack.push(itemToTake);
        }
        if (floor) {
          removeWorldObject(floor, target.instanceId);
        }
        applied.push(eff);
      }
    } else if (eff.type === 'removeObject' && target && floor) {
      removeWorldObject(floor, target.instanceId);
      applied.push(eff);
    } else {
      applied.push(eff);
    }
  }

  return applied;
}

// ============================================================================
// EXECUTE INTERACTION (Main Pipeline Orchestrator)
// ============================================================================

export function executeInteraction(request, state = gameState) {
  if (!request) {
    return createInteractionResult(false, 'none', 'invalid_request', false, [], 'Invalid request');
  }

  const floor = state && state.dungeon && state.dungeon.floors
    ? (state.dungeon.floors[state.dungeon.currentFloor] || null)
    : null;

  let target = null;
  if (request.targetId && floor) {
    target = findObjectById(floor, request.targetId);
  } else if (typeof request.x === 'number' && typeof request.y === 'number' && floor) {
    const objs = (floor.objects || []).filter(o => o.x === request.x && o.y === request.y);
    target = objs[0] || null;
  }

  if (!target) {
    return createInteractionResult(false, request.actionId, 'target_not_found', false, [], 'Target not found');
  }

  const actor = (state && state.hero) || { name: 'Player', classId: 'fighter' };

  // Spatial range validation (Chebyshev distance <= 1.5 for manual interactions, 0 for step-over triggers)
  const maxRange = request.maxRange !== undefined ? request.maxRange : 1.5;
  const dist = Math.max(Math.abs(target.x - actor.x), Math.abs(target.y - actor.y));
  if (dist > maxRange) {
    return createInteractionResult(false, request.actionId, 'out_of_range', false, [], 'Target is out of reach');
  }

  // Look up action definition on target's interactable component
  const interactable = target.components && target.components.interactable;
  const actionDef = (interactable && interactable.actions && interactable.actions[request.actionId]) || {
    id: request.actionId,
    requirements: null,
    costs: null,
    effects: []
  };

  const context = {
    actor: actor,
    target: target,
    floor: floor,
    state: state,
    parameters: request.parameters || {}
  };

  // 1. Evaluate Requirements
  const reqResult = evaluateRequirement(actionDef.requirements, context);
  if (!reqResult.ok) {
    return createInteractionResult(false, request.actionId, reqResult.reason, false, [], `Requirements not met: ${reqResult.reason}`);
  }

  // 2. Deduct Costs
  deductInteractionCosts(actionDef.costs, context);

  // 3. Apply Effects
  const appliedEffects = applyInteractionEffects(actionDef.effects, context, state);

  // 4. Update Target Revision
  target.revision = (target.revision || 1) + 1;

  // 5. Emit Domain Events
  emitEngineEvent(ENGINE_EVENTS.OBJECT_INTERACTION, {
    actorId: actor.name || 'hero',
    targetId: target.instanceId,
    actionId: request.actionId,
    targetType: target.objectType,
    effects: appliedEffects
  }, state);

  if (appliedEffects.some(e => e.type === 'changeState')) {
    emitEngineEvent(ENGINE_EVENTS.OBJECT_STATE_CHANGED, {
      instanceId: target.instanceId,
      runtimeState: target.runtimeState
    }, state);
  }

  return createInteractionResult(
    true,
    request.actionId,
    null,
    appliedEffects.length > 0,
    appliedEffects,
    `Successfully executed ${request.actionId} on ${target.name}`
  );
}
