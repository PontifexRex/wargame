// =============================================================================
// VERSIONED RESEARCH & TRAINING CATALOG SERVICE (Inc 10.1 / ADR-0015 / Spec §6, §7, §14, §22)
// Defines the 15 Research Domains, 5 Representative Prototype Trees (General Knowledge,
// Adventurer Basics, Weapon Proficiency incl. WAR_WEAPON_HEAVY_001, City Development,
// Divine Knowledge), Starter Hero Training Definitions, and Catalog Validator.
// =============================================================================

import { OWNER_TYPES, DEFAULT_CURRENCY_DEFINITIONS } from './currencyService.js';

export const RESEARCH_DOMAINS = {
  adventuring:       { domainId: 'adventuring',       name: 'Adventuring',       icon: '🧭', sortOrder: 1,  enabled: true, version: '1.0.0' },
  dungeon:           { domainId: 'dungeon',           name: 'Dungeon',           icon: '🗝️', sortOrder: 2,  enabled: true, version: '1.0.0' },
  warrior:           { domainId: 'warrior',           name: 'Warrior',           icon: '⚔️', sortOrder: 3,  enabled: true, version: '1.0.0' },
  military:          { domainId: 'military',          name: 'Military',          icon: '🛡️', sortOrder: 4,  enabled: true, version: '1.0.0' },
  city:              { domainId: 'city',              name: 'City',              icon: '🏛️', sortOrder: 5,  enabled: true, version: '1.0.0' },
  economy:           { domainId: 'economy',           name: 'Economy',           icon: '💰', sortOrder: 6,  enabled: true, version: '1.0.0' },
  influence:         { domainId: 'influence',         name: 'Influence',         icon: '👑', sortOrder: 7,  enabled: true, version: '1.0.0' },
  constructs:        { domainId: 'constructs',        name: 'Constructs',        icon: '⚙️', sortOrder: 8,  enabled: true, version: '1.0.0' },
  religion:          { domainId: 'religion',          name: 'Religion',          icon: '☀️', sortOrder: 9,  enabled: true, version: '1.0.0' },
  priesthood:        { domainId: 'priesthood',        name: 'Priesthood',        icon: '✝️', sortOrder: 10, enabled: true, version: '1.0.0' },
  exploration:       { domainId: 'exploration',       name: 'Exploration',       icon: '🗺️', sortOrder: 11, enabled: true, version: '1.0.0' },
  magic:             { domainId: 'magic',             name: 'Magic',             icon: '✨', sortOrder: 12, enabled: true, version: '1.0.0' },
  crafting:          { domainId: 'crafting',          name: 'Crafting',          icon: '🔨', sortOrder: 13, enabled: true, version: '1.0.0' },
  logistics:         { domainId: 'logistics',         name: 'Logistics',         icon: '📦', sortOrder: 14, enabled: true, version: '1.0.0' },
  general_knowledge: { domainId: 'general_knowledge', name: 'General Knowledge', icon: '📘', sortOrder: 15, enabled: true, version: '1.0.0' }
};

export const PROTOTYPE_RESEARCH_TREES = {
  tree_general_knowledge: {
    treeId: 'tree_general_knowledge',
    domainId: 'general_knowledge',
    name: 'General Knowledge',
    shortDescription: 'Foundational literacy, scholarly methods, and passive research acceleration.',
    icon: '📘',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_scholars', name: 'Scholarly Methods' },
      { branchId: 'br_efficiency', name: 'Research Efficiency' }
    ],
    itemIds: ['GEN_SCHOLAR_001', 'GEN_SPEED_001'],
    milestones: [
      { milestoneId: 'ms_gen_1', requiredCompletions: 2, rewardTitle: 'Curious Mind', rewardGold: 100 }
    ],
    sortOrder: 1,
    version: '1.0.0',
    status: 'active'
  },
  tree_adventurer_basics: {
    treeId: 'tree_adventurer_basics',
    domainId: 'adventuring',
    name: 'Adventurer Basics',
    shortDescription: 'Field survival, torchcraft, and dungeon delving mastery funded by Adventurer RP.',
    icon: '🧭',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_survival', name: 'Dungeon Survival' },
      { branchId: 'br_assay', name: 'Treasure Recovery' }
    ],
    itemIds: ['ADV_SURVIVAL_001', 'ADV_TREASURE_001'],
    milestones: [
      { milestoneId: 'ms_adv_1', requiredCompletions: 2, rewardTitle: 'Vault Pathfinder', rewardGold: 120 }
    ],
    sortOrder: 2,
    version: '1.0.0',
    status: 'active'
  },
  tree_weapon_proficiency: {
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    name: 'Weapon Proficiency',
    shortDescription: 'Multilevel martial doctrine unlocking specialized weapon training for individual heroes.',
    icon: '⚔️',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_heavy_arms', name: 'Heavy Arms' },
      { branchId: 'br_tactics', name: 'Combat Mastery' }
    ],
    itemIds: ['WAR_WEAPON_HEAVY_001', 'WAR_MASTER_001'],
    milestones: [
      { milestoneId: 'ms_war_1', requiredCompletions: 2, rewardTitle: 'Master of Arms', rewardGold: 200 }
    ],
    sortOrder: 3,
    version: '1.0.0',
    status: 'active'
  },
  tree_city_development: {
    treeId: 'tree_city_development',
    domainId: 'city',
    name: 'City Development',
    shortDescription: 'Civic engineering, masonry standards, and resource production multipliers.',
    icon: '🏛️',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_masonry', name: 'Civic Masonry' },
      { branchId: 'br_harvest', name: 'Agrarian Yield' }
    ],
    itemIds: ['CITY_MASONRY_001', 'CITY_HARVEST_001'],
    milestones: [
      { milestoneId: 'ms_city_1', requiredCompletions: 2, rewardTitle: 'Bastion Architect', rewardGold: 150 }
    ],
    sortOrder: 4,
    version: '1.0.0',
    status: 'active'
  },
  tree_divine_knowledge: {
    treeId: 'tree_divine_knowledge',
    domainId: 'religion',
    name: 'Divine Knowledge',
    shortDescription: 'Sacred liturgy and blessings gated by multi-tag Pantheon alignment.',
    icon: '☀️',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_radiance', name: 'Solar Liturgy' }
    ],
    itemIds: ['REL_LITURGY_001'],
    milestones: [
      { milestoneId: 'ms_rel_1', requiredCompletions: 1, rewardTitle: 'Initiate of the Dawn', rewardGold: 150 }
    ],
    sortOrder: 5,
    version: '1.0.0',
    status: 'active'
  }
};

export const PROTOTYPE_RESEARCH_ITEMS = {
  GEN_SCHOLAR_001: {
    researchItemId: 'GEN_SCHOLAR_001',
    treeId: 'tree_general_knowledge',
    domainId: 'general_knowledge',
    branchId: 'br_scholars',
    name: 'Foundational Scholarship',
    description: 'Establishes systematic note-taking, increasing passive General RP accrual by +25% per level.',
    icon: '📘',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 30,  costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.01 }, { kind: 'currency', currencyId: 'gold', amount: 25 }],  benefits: [{ effectType: 'accrual_modifier', target: 'rp_general', op: 'additive', value: 0.25 }] },
      { level: 2, durationSec: 120, costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.05 }, { kind: 'currency', currencyId: 'gold', amount: 75 }],  benefits: [{ effectType: 'accrual_modifier', target: 'rp_general', op: 'additive', value: 0.25 }] },
      { level: 3, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.15 }, { kind: 'currency', currencyId: 'gold', amount: 200 }], benefits: [{ effectType: 'accrual_modifier', target: 'rp_general', op: 'additive', value: 0.25 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  GEN_SPEED_001: {
    researchItemId: 'GEN_SPEED_001',
    treeId: 'tree_general_knowledge',
    domainId: 'general_knowledge',
    branchId: 'br_efficiency',
    name: 'Structured Research Methods',
    description: 'Improves personal research completion speed by +10% per level.',
    icon: '⏱️',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'research_level', research_item_id: 'GEN_SCHOLAR_001', operator: '>=', value: 1, label: 'Foundational Scholarship' },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.05 }, { kind: 'currency', currencyId: 'gold', amount: 60 }],  benefits: [{ effectType: 'research_speed_modifier', target: 'personal', op: 'additive', value: 0.10 }] },
      { level: 2, durationSec: 240, costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.12 }, { kind: 'currency', currencyId: 'gold', amount: 180 }], benefits: [{ effectType: 'research_speed_modifier', target: 'personal', op: 'additive', value: 0.10 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  ADV_SURVIVAL_001: {
    researchItemId: 'ADV_SURVIVAL_001',
    treeId: 'tree_adventurer_basics',
    domainId: 'adventuring',
    branchId: 'br_survival',
    name: 'Subterranean Survival',
    description: 'Unlocks Dungeon Survival Drills for individual heroes and improves torchlight preparation.',
    icon: '🔥',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 45,  costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 0.5 }, { kind: 'currency', currencyId: 'gold', amount: 30 }],  benefits: [{ effectType: 'unlock_training', target: 'train_dungeon_survival', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 180, costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 2.0 }, { kind: 'currency', currencyId: 'gold', amount: 120 }], benefits: [{ effectType: 'unlock_training', target: 'train_dungeon_survival', op: 'unlock', value: 2 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  ADV_TREASURE_001: {
    researchItemId: 'ADV_TREASURE_001',
    treeId: 'tree_adventurer_basics',
    domainId: 'adventuring',
    branchId: 'br_assay',
    name: 'Antiquarian Field Appraisal',
    description: 'Increases gold value of extracted dungeon relics by +12% per level.',
    icon: '💎',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'research_level', research_item_id: 'ADV_SURVIVAL_001', operator: '>=', value: 1, label: 'Subterranean Survival' },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 60,  costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 1.0 }, { kind: 'currency', currencyId: 'gold', amount: 50 }],  benefits: [{ effectType: 'probability_modifier', target: 'relic_gold_mult', op: 'additive', value: 0.12 }] },
      { level: 2, durationSec: 240, costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 3.0 }, { kind: 'currency', currencyId: 'gold', amount: 150 }], benefits: [{ effectType: 'probability_modifier', target: 'relic_gold_mult', op: 'additive', value: 0.12 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  // Spec §14 Reference Research Item
  WAR_WEAPON_HEAVY_001: {
    researchItemId: 'WAR_WEAPON_HEAVY_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_heavy_arms',
    name: 'Wield Heavier Weapons',
    description: 'Unlocks Heavy Weapon Proficiency training for individual heroes (does not auto-grant skill without hero training).',
    icon: '⚔️',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 60,   costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 5 },  { kind: 'currency', currencyId: 'gold', amount: 50 }],   benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 600,  costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 10 }, { kind: 'currency', currencyId: 'gold', amount: 250 }],  benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 2 }] },
      { level: 3, durationSec: 6000, costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 25 }, { kind: 'currency', currencyId: 'gold', amount: 2000 }], benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 3 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_MASTER_001: {
    researchItemId: 'WAR_MASTER_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_tactics',
    name: 'Vanguard Arms Doctrine',
    description: 'Advanced combat doctrine requiring a veteran hero and prior martial or survival research.',
    icon: '🛡️',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: {
      operator: 'AND',
      conditions: [
        { type: 'hero_level', operator: 'greater_than_or_equal', value: 5 },
        {
          operator: 'OR',
          conditions: [
            { type: 'research_level', research_item_id: 'WAR_WEAPON_HEAVY_001', operator: 'greater_than_or_equal', value: 1, label: 'Wield Heavier Weapons' },
            { type: 'research_level', research_item_id: 'ADV_SURVIVAL_001', operator: 'greater_than_or_equal', value: 2, label: 'Subterranean Survival' }
          ]
        }
      ]
    },
    levelLimit: 1,
    levelDefinitions: [
      { level: 1, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_adventurer', amount: 12 }, { kind: 'currency', currencyId: 'gold', amount: 400 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_atk_pct', op: 'additive', value: 0.08 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  CITY_MASONRY_001: {
    researchItemId: 'CITY_MASONRY_001',
    treeId: 'tree_city_development',
    domainId: 'city',
    branchId: 'br_masonry',
    name: 'Ashlar Masonry Standards',
    description: 'Reduces city construction duration by 8% per level and improves quarry stone output.',
    icon: '🪨',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'building_level', buildingId: 'quarry', operator: '>=', value: 1 },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.02 }, { kind: 'stockpile', resourceId: 'stone', amount: 30 }], benefits: [{ effectType: 'production_modifier', target: 'stone', op: 'additive', value: 0.15 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.08 }, { kind: 'stockpile', resourceId: 'stone', amount: 80 }], benefits: [{ effectType: 'production_modifier', target: 'stone', op: 'additive', value: 0.15 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  CITY_HARVEST_001: {
    researchItemId: 'CITY_HARVEST_001',
    treeId: 'tree_city_development',
    domainId: 'city',
    branchId: 'br_harvest',
    name: 'Crop Rotation & Irrigation',
    description: 'Boosts Garden food and Well water output by +15% per level.',
    icon: '🌾',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'building_level', buildingId: 'garden', operator: '>=', value: 1 },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.02 }, { kind: 'stockpile', resourceId: 'wood', amount: 25 }], benefits: [{ effectType: 'production_modifier', target: 'food', op: 'additive', value: 0.15 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_general', amount: 0.08 }, { kind: 'stockpile', resourceId: 'wood', amount: 70 }], benefits: [{ effectType: 'production_modifier', target: 'food', op: 'additive', value: 0.15 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  REL_LITURGY_001: {
    researchItemId: 'REL_LITURGY_001',
    treeId: 'tree_divine_knowledge',
    domainId: 'religion',
    branchId: 'br_radiance',
    name: 'Solar Sanctuary Rites',
    description: 'Sacred rites available to players aligned with a Solar or Order deity.',
    icon: '☀️',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'divine_alignment_tag', operator: 'contains_any', value: ['solar', 'order'] },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 120, costs: [{ kind: 'currency', currencyId: 'divine_favor', amount: 10 }, { kind: 'currency', currencyId: 'gold', amount: 100 }], benefits: [{ effectType: 'accrual_modifier', target: 'divine_favor', op: 'additive', value: 0.20 }] },
      { level: 2, durationSec: 360, costs: [{ kind: 'currency', currencyId: 'divine_favor', amount: 30 }, { kind: 'currency', currencyId: 'gold', amount: 300 }], benefits: [{ effectType: 'accrual_modifier', target: 'divine_favor', op: 'additive', value: 0.25 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  }
};

export const PROTOTYPE_TRAINING_DEFINITIONS = {
  train_heavy_weapons: {
    trainingDefinitionId: 'train_heavy_weapons',
    name: 'Heavy Weapon Proficiency',
    description: 'Trains an individual Hero to wield heavy two-handed arms, granting +4 ATK per level.',
    subjectType: 'hero',
    skillRef: 'heavy_weapon_proficiency',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_WEAPON_HEAVY_001', operator: '>=', value: 1, label: 'Wield Heavier Weapons' },
    queueType: 'hero_training',
    levels: [
      { level: 1, durationSec: 45,  costs: [{ kind: 'currency', currencyId: 'gold', amount: 40 }],  benefits: [{ effectType: 'attribute_modifier', target: 'atk', op: 'additive', value: 4 }] },
      { level: 2, durationSec: 180, costs: [{ kind: 'currency', currencyId: 'gold', amount: 150 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_WEAPON_HEAVY_001', operator: '>=', value: 2 }, benefits: [{ effectType: 'attribute_modifier', target: 'atk', op: 'additive', value: 4 }] },
      { level: 3, durationSec: 600, costs: [{ kind: 'currency', currencyId: 'gold', amount: 500 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_WEAPON_HEAVY_001', operator: '>=', value: 3 }, benefits: [{ effectType: 'attribute_modifier', target: 'atk', op: 'additive', value: 6 }] }
    ],
    version: '1.0.0'
  },
  train_dungeon_survival: {
    trainingDefinitionId: 'train_dungeon_survival',
    name: 'Dungeon Survival Drills',
    description: 'Hardens an individual Hero for deep vault delves, granting +15 Max HP per level.',
    subjectType: 'hero',
    skillRef: 'dungeon_survival',
    prerequisites: { type: 'research_level', research_item_id: 'ADV_SURVIVAL_001', operator: '>=', value: 1, label: 'Subterranean Survival' },
    queueType: 'hero_training',
    levels: [
      { level: 1, durationSec: 30,  costs: [{ kind: 'currency', currencyId: 'gold', amount: 30 }],  benefits: [{ effectType: 'attribute_modifier', target: 'maxHp', op: 'additive', value: 15 }] },
      { level: 2, durationSec: 120, costs: [{ kind: 'currency', currencyId: 'gold', amount: 110 }], prerequisites: { type: 'research_level', research_item_id: 'ADV_SURVIVAL_001', operator: '>=', value: 2 }, benefits: [{ effectType: 'attribute_modifier', target: 'maxHp', op: 'additive', value: 20 }] }
    ],
    version: '1.0.0'
  }
};

export function validateResearchCatalog(trees, items, currencies) {
  const errors = [];
  const tMap = trees || PROTOTYPE_RESEARCH_TREES;
  const iMap = items || PROTOTYPE_RESEARCH_ITEMS;
  const cMap = currencies || DEFAULT_CURRENCY_DEFINITIONS;

  const treeIds = Object.keys(tMap);
  for (let i = 0; i < treeIds.length; i++) {
    const tr = tMap[treeIds[i]];
    if (!RESEARCH_DOMAINS[tr.domainId]) {
      errors.push('Tree ' + tr.treeId + ' references unknown domain ' + tr.domainId);
    }
    if (!Array.isArray(tr.itemIds) || tr.itemIds.length === 0) {
      errors.push('Tree ' + tr.treeId + ' has no itemIds');
    } else {
      for (let j = 0; j < tr.itemIds.length; j++) {
        if (!iMap[tr.itemIds[j]]) {
          errors.push('Tree ' + tr.treeId + ' references missing item ' + tr.itemIds[j]);
        }
      }
    }
  }

  const itemIds = Object.keys(iMap);
  for (let k = 0; k < itemIds.length; k++) {
    const it = iMap[itemIds[k]];
    if (!tMap[it.treeId]) errors.push('Item ' + it.researchItemId + ' references missing tree ' + it.treeId);
    if (!it.version) errors.push('Item ' + it.researchItemId + ' missing version');
    const lvls = Array.isArray(it.levelDefinitions) ? it.levelDefinitions : [];
    if (lvls.length !== it.levelLimit) {
      errors.push('Item ' + it.researchItemId + ' levelDefinitions count mismatch');
    }
    for (let li = 0; li < lvls.length; li++) {
      const ld = lvls[li];
      if (ld.level !== li + 1) errors.push('Item ' + it.researchItemId + ' non-sequential level ' + ld.level);
      const costs = Array.isArray(ld.costs) ? ld.costs : [];
      for (let ci = 0; ci < costs.length; ci++) {
        if (costs[ci].kind === 'currency' && !cMap[costs[ci].currencyId]) {
          errors.push('Item ' + it.researchItemId + ' L' + ld.level + ' references unknown currency ' + costs[ci].currencyId);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    domainCount: Object.keys(RESEARCH_DOMAINS).length,
    treeCount: treeIds.length,
    itemCount: itemIds.length
  };
}
