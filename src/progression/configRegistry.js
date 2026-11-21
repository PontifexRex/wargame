// =============================================================================
// CENTRALIZED KEY CONFIGURATION REGISTRY (Auto-Surfaced in Developer Portal)
// Rule: Whenever a new key gameplay configuration is introduced, register it here
// so it automatically appears in the Developer Portal for live tuning & testing.
// =============================================================================

export const CONFIG_CATEGORIES = {
  ACCRUAL: 'RP Accrual & Rates',
  QUEUES: 'Research & Training Queues',
  REFUNDS: 'Cancellation & Refunds',
  TRAINING: 'Hero & Subject Training'
};

export const DEV_CONFIG_REGISTRY = [
  {
    key: 'passive_rp_general_per_sec',
    category: CONFIG_CATEGORIES.ACCRUAL,
    label: 'Base General RP / sec (Online & Offline)',
    type: 'number',
    step: 0.00001,
    min: 0,
    max: 10,
    defaultValue: 0.00001,
    desc: 'Base passive General RP earned per real-world second (before Building & Research modifiers).'
  },
  {
    key: 'activity_rp_dungeon_move',
    category: CONFIG_CATEGORIES.ACCRUAL,
    label: 'Adventurer RP per Dungeon Action',
    type: 'number',
    step: 0.0001,
    min: 0,
    max: 10,
    defaultValue: 0.001,
    desc: 'Base Adventurer RP awarded per qualifying dungeon movement/exploration action.'
  },
  {
    key: 'activity_rp_monster_defeat',
    category: CONFIG_CATEGORIES.ACCRUAL,
    label: 'Adventurer RP per Monster Defeated',
    type: 'number',
    step: 0.001,
    min: 0,
    max: 50,
    defaultValue: 0.005,
    desc: 'Base Adventurer RP awarded for defeating a dungeon or overworld monster.'
  },
  {
    key: 'activity_rp_research_quest',
    category: CONFIG_CATEGORIES.ACCRUAL,
    label: 'Adventurer RP per Research Quest',
    type: 'number',
    step: 0.5,
    min: 0,
    max: 500,
    defaultValue: 5.0,
    desc: 'Adventurer RP granted upon completing a dedicated research quest.'
  },
  {
    key: 'research_queue_capacity',
    category: CONFIG_CATEGORIES.QUEUES,
    label: 'Personal Research Queue Capacity',
    type: 'integer',
    step: 1,
    min: 1,
    max: 5,
    defaultValue: 1,
    desc: 'Concurrent active Personal Research slots (1 free baseline, 2 subscriber).'
  },
  {
    key: 'training_queue_capacity',
    category: CONFIG_CATEGORIES.QUEUES,
    label: 'Hero Training Queue Capacity',
    type: 'integer',
    step: 1,
    min: 1,
    max: 5,
    defaultValue: 1,
    desc: 'Concurrent active Hero Training slots on the separate Training Queue.'
  },
  {
    key: 'global_research_speed_mult',
    category: CONFIG_CATEGORIES.QUEUES,
    label: 'Global Research Speed Multiplier',
    type: 'number',
    step: 0.1,
    min: 0.1,
    max: 100,
    defaultValue: 1.0,
    desc: 'Testing multiplier applied to Personal Research completion speed.'
  },
  {
    key: 'global_training_speed_mult',
    category: CONFIG_CATEGORIES.TRAINING,
    label: 'Global Training Speed Multiplier',
    type: 'number',
    step: 0.1,
    min: 0.1,
    max: 100,
    defaultValue: 1.0,
    desc: 'Testing multiplier applied to Hero Training completion speed.'
  },
  {
    key: 'cancel_refund_ratio',
    category: CONFIG_CATEGORIES.REFUNDS,
    label: 'Active Cancel Refund Ratio (0.0 - 1.0)',
    type: 'number',
    step: 0.05,
    min: 0,
    max: 1,
    defaultValue: 0.5,
    desc: 'Fraction of costs refunded when cancelling an active Research or Training item.'
  }
];

const _configByKey = {};
for (let i = 0; i < DEV_CONFIG_REGISTRY.length; i++) {
  _configByKey[DEV_CONFIG_REGISTRY[i].key] = DEV_CONFIG_REGISTRY[i];
}

export function getConfigDefinition(key) {
  return _configByKey[key] || null;
}

export function getConfigValue(progression, key) {
  const def = _configByKey[key];
  const overrides = (progression && progression.configOverrides) ? progression.configOverrides : {};
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key];
  }
  return def ? def.defaultValue : null;
}

export function setConfigValue(progression, key, rawValue) {
  if (!progression) return { ok: false, reason: 'invalid_progression' };
  const def = _configByKey[key];
  if (!def) return { ok: false, reason: 'unknown_config_key' };

  let val = Number(rawValue);
  if (!isFinite(val)) return { ok: false, reason: 'invalid_number' };
  if (def.type === 'integer') val = Math.round(val);
  if (typeof def.min === 'number' && val < def.min) val = def.min;
  if (typeof def.max === 'number' && val > def.max) val = def.max;

  if (!progression.configOverrides) progression.configOverrides = {};
  progression.configOverrides[key] = val;

  // Apply immediate side-effects for queue capacities
  if (key === 'research_queue_capacity' && progression.researchQueue) {
    progression.researchQueue.capacity = val;
  }
  if (key === 'training_queue_capacity' && progression.trainingQueue) {
    progression.trainingQueue.capacity = val;
  }

  return { ok: true, key: key, value: val };
}

export function resetAllConfigValues(progression) {
  if (!progression) return { ok: false };
  progression.configOverrides = {};
  if (progression.researchQueue) progression.researchQueue.capacity = 1;
  if (progression.trainingQueue) progression.trainingQueue.capacity = 1;
  return { ok: true };
}
