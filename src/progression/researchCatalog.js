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
    shortDescription: '10-node martial doctrine spanning Heavy Arms, Polearms & Shields, and Battlefield Tactics.',
    icon: '⚔️',
    ownershipType: OWNER_TYPES.PLAYER,
    branches: [
      { branchId: 'br_heavy_arms', name: 'Heavy Arms' },
      { branchId: 'br_shields', name: 'Polearms & Shields' },
      { branchId: 'br_tactics', name: 'Battlefield Tactics' }
    ],
    itemIds: [
      'WAR_WEAPON_HEAVY_001',
      'WAR_BLADE_BALANCE_001',
      'WAR_CRUSHING_BLOW_001',
      'WAR_SHIELD_WALL_001',
      'WAR_POLEARM_REACH_001',
      'WAR_ARMOR_FITTING_001',
      'WAR_FIELD_DRILLS_001',
      'WAR_FLANKING_001',
      'WAR_MASTER_001',
      'WAR_WARLORD_APEX_001'
    ],
    milestones: [
      { milestoneId: 'ms_war_1', requiredCompletions: 4, rewardTitle: 'Master of Arms', rewardGold: 200 },
      { milestoneId: 'ms_war_2', requiredCompletions: 10, rewardTitle: 'Grand Marshal of Steel', rewardGold: 600 }
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
  // Spec §14 Reference Research Item (Root of Heavy Arms branch)
  WAR_WEAPON_HEAVY_001: {
    researchItemId: 'WAR_WEAPON_HEAVY_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_heavy_arms',
    nodePos: { col: 0, row: 0 },
    parentIds: [],
    name: 'Wield Heavier Weapons',
    description: 'Unlocks Heavy Weapon Proficiency training for individual heroes (does not auto-grant skill without hero training).',
    icon: '⚔️',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 60,   costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 5 },  { kind: 'currency', currencyId: 'gold', amount: 50 }],   benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 600,  costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 10 }, { kind: 'currency', currencyId: 'gold', amount: 250 }],  benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 2 }] },
      { level: 3, durationSec: 6000, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 25 }, { kind: 'currency', currencyId: 'gold', amount: 2000 }], benefits: [{ effectType: 'unlock_training', target: 'train_heavy_weapons', op: 'unlock', value: 3 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_BLADE_BALANCE_001: {
    researchItemId: 'WAR_BLADE_BALANCE_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_heavy_arms',
    nodePos: { col: 1, row: 0 },
    parentIds: ['WAR_WEAPON_HEAVY_001'],
    name: 'Counterweight Tempering',
    description: 'Balances greatswords and warhammers for +4% critical strike chance per level.',
    icon: '🗡️',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_WEAPON_HEAVY_001', operator: '>=', value: 1, label: 'Wield Heavier Weapons' },
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 120, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 6 },  { kind: 'currency', currencyId: 'gold', amount: 90 },  { kind: 'stockpile', resourceId: 'ore', amount: 10 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_crit_pct', op: 'additive', value: 0.04 }] },
      { level: 2, durationSec: 360, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 12 }, { kind: 'currency', currencyId: 'gold', amount: 240 }, { kind: 'stockpile', resourceId: 'ingots', amount: 5 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_crit_pct', op: 'additive', value: 0.04 }] },
      { level: 3, durationSec: 900, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 22 }, { kind: 'currency', currencyId: 'gold', amount: 600 }, { kind: 'stockpile', resourceId: 'ingots', amount: 12 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_crit_pct', op: 'additive', value: 0.05 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_CRUSHING_BLOW_001: {
    researchItemId: 'WAR_CRUSHING_BLOW_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_heavy_arms',
    nodePos: { col: 2, row: 0 },
    parentIds: ['WAR_BLADE_BALANCE_001'],
    name: 'Shattering Strikes',
    description: 'Requires Blacksmith Lv 1 and Counterweight Tempering. Unlocks Crushing Blow hero training.',
    icon: '🔨',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: {
      operator: 'AND',
      conditions: [
        { type: 'research_level', research_item_id: 'WAR_BLADE_BALANCE_001', operator: '>=', value: 1, label: 'Counterweight Tempering' },
        { type: 'building_level', buildingId: 'blacksmith', operator: '>=', value: 1 }
      ]
    },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 240, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 14 }, { kind: 'currency', currencyId: 'gold', amount: 320 }], benefits: [{ effectType: 'unlock_training', target: 'train_crushing_blows', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 720, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 28 }, { kind: 'currency', currencyId: 'gold', amount: 750 }], benefits: [{ effectType: 'unlock_training', target: 'train_crushing_blows', op: 'unlock', value: 2 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_SHIELD_WALL_001: {
    researchItemId: 'WAR_SHIELD_WALL_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_shields',
    nodePos: { col: 0, row: 1 },
    parentIds: [],
    name: 'Tower Shield Foundations',
    description: 'Unlocks Shield Wall Conditioning for individual heroes (+3 DEF per training rank).',
    icon: '🛡️',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 60,  costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 4 },  { kind: 'currency', currencyId: 'gold', amount: 45 }],  benefits: [{ effectType: 'unlock_training', target: 'train_shield_wall', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 9 },  { kind: 'currency', currencyId: 'gold', amount: 180 }], benefits: [{ effectType: 'unlock_training', target: 'train_shield_wall', op: 'unlock', value: 2 }] },
      { level: 3, durationSec: 900, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 18 }, { kind: 'currency', currencyId: 'gold', amount: 520 }], benefits: [{ effectType: 'unlock_training', target: 'train_shield_wall', op: 'unlock', value: 3 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_POLEARM_REACH_001: {
    researchItemId: 'WAR_POLEARM_REACH_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_shields',
    nodePos: { col: 1, row: 1 },
    parentIds: ['WAR_SHIELD_WALL_001'],
    name: 'Phalanx Polearm Reach',
    description: 'Extends melee formation discipline, granting +6% defense in dungeon corridors.',
    icon: '🔱',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_SHIELD_WALL_001', operator: '>=', value: 1, label: 'Tower Shield Foundations' },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 150, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 7 },  { kind: 'currency', currencyId: 'gold', amount: 110 }, { kind: 'stockpile', resourceId: 'wood', amount: 20 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_def_pct', op: 'additive', value: 0.06 }] },
      { level: 2, durationSec: 420, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 15 }, { kind: 'currency', currencyId: 'gold', amount: 300 }, { kind: 'stockpile', resourceId: 'wood', amount: 45 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_def_pct', op: 'additive', value: 0.06 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_ARMOR_FITTING_001: {
    researchItemId: 'WAR_ARMOR_FITTING_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_shields',
    nodePos: { col: 2, row: 1 },
    parentIds: ['WAR_POLEARM_REACH_001', 'WAR_BLADE_BALANCE_001'],
    name: 'Articulated Plate Fitting',
    description: 'Converging mastery: requires either Phalanx Polearm Reach OR Counterweight Tempering. Unlocks Armor Conditioning.',
    icon: '🥋',
    itemType: 'capability_unlock',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: {
      operator: 'OR',
      conditions: [
        { type: 'research_level', research_item_id: 'WAR_POLEARM_REACH_001', operator: '>=', value: 1, label: 'Phalanx Polearm Reach' },
        { type: 'research_level', research_item_id: 'WAR_BLADE_BALANCE_001', operator: '>=', value: 1, label: 'Counterweight Tempering' }
      ]
    },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 210, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 11 }, { kind: 'currency', currencyId: 'gold', amount: 260 }], benefits: [{ effectType: 'unlock_training', target: 'train_armor_conditioning', op: 'unlock', value: 1 }] },
      { level: 2, durationSec: 600, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 22 }, { kind: 'currency', currencyId: 'gold', amount: 640 }], benefits: [{ effectType: 'unlock_training', target: 'train_armor_conditioning', op: 'unlock', value: 2 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_FIELD_DRILLS_001: {
    researchItemId: 'WAR_FIELD_DRILLS_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_tactics',
    nodePos: { col: 0, row: 2 },
    parentIds: [],
    name: 'Standardized Yard Drills',
    description: 'Streamlines martial instruction, accelerating Hero Training speed by +10% per level.',
    icon: '📯',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: null,
    levelLimit: 3,
    levelDefinitions: [
      { level: 1, durationSec: 75,  costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 3 },  { kind: 'currency', currencyId: 'gold', amount: 50 }],  benefits: [{ effectType: 'training_speed_modifier', target: 'hero', op: 'additive', value: 0.10 }] },
      { level: 2, durationSec: 240, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 8 },  { kind: 'currency', currencyId: 'gold', amount: 160 }], benefits: [{ effectType: 'training_speed_modifier', target: 'hero', op: 'additive', value: 0.10 }] },
      { level: 3, durationSec: 600, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 18 }, { kind: 'currency', currencyId: 'gold', amount: 450 }], benefits: [{ effectType: 'training_speed_modifier', target: 'hero', op: 'additive', value: 0.15 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_FLANKING_001: {
    researchItemId: 'WAR_FLANKING_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_tactics',
    nodePos: { col: 1, row: 2 },
    parentIds: ['WAR_FIELD_DRILLS_001'],
    name: 'Squad Flanking Maneuvers',
    description: 'Coordinated vanguard formations increasing Overworld skirmish victory odds & party ATK by +5%.',
    icon: '🚩',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_FIELD_DRILLS_001', operator: '>=', value: 1, label: 'Standardized Yard Drills' },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 180, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 8 },  { kind: 'currency', currencyId: 'gold', amount: 140 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_atk_pct', op: 'additive', value: 0.05 }] },
      { level: 2, durationSec: 480, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 16 }, { kind: 'currency', currencyId: 'gold', amount: 360 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_atk_pct', op: 'additive', value: 0.05 }] }
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
    nodePos: { col: 2, row: 2 },
    parentIds: ['WAR_WEAPON_HEAVY_001'],
    name: 'Vanguard Arms Doctrine',
    description: 'Advanced combat doctrine requiring a veteran hero and prior martial or survival research.',
    icon: '🏅',
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
      { level: 1, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 12 }, { kind: 'currency', currencyId: 'gold', amount: 400 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_atk_pct', op: 'additive', value: 0.08 }] }
    ],
    queueType: 'research',
    version: '1.0.0',
    status: 'active'
  },
  WAR_WARLORD_APEX_001: {
    researchItemId: 'WAR_WARLORD_APEX_001',
    treeId: 'tree_weapon_proficiency',
    domainId: 'warrior',
    branchId: 'br_tactics',
    nodePos: { col: 3, row: 1 },
    parentIds: ['WAR_CRUSHING_BLOW_001', 'WAR_ARMOR_FITTING_001', 'WAR_MASTER_001'],
    name: 'Grandmaster of Arms',
    description: 'Capstone martial synthesis requiring Shattering Strikes, Articulated Plate Fitting, and Vanguard Arms Doctrine.',
    icon: '👑',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.PLAYER,
    subjectType: 'player',
    prerequisites: {
      operator: 'AND',
      conditions: [
        { type: 'research_level', research_item_id: 'WAR_CRUSHING_BLOW_001', operator: '>=', value: 1, label: 'Shattering Strikes' },
        { type: 'research_level', research_item_id: 'WAR_ARMOR_FITTING_001', operator: '>=', value: 1, label: 'Articulated Plate Fitting' },
        { type: 'research_level', research_item_id: 'WAR_MASTER_001', operator: '>=', value: 1, label: 'Vanguard Arms Doctrine' }
      ]
    },
    levelLimit: 1,
    levelDefinitions: [
      { level: 1, durationSec: 1800, costs: [{ kind: 'currency', currencyId: 'rp_warrior', amount: 45 }, { kind: 'currency', currencyId: 'gold', amount: 2500 }], benefits: [{ effectType: 'attribute_modifier', target: 'hero_atk_pct', op: 'additive', value: 0.15 }] }
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

export const PROTOTYPE_TRAINING_TREES = {
  tr_tree_martial: {
    treeId: 'tr_tree_martial',
    name: 'Martial Arms & Conditioning',
    shortDescription: 'Combat yard drills building an individual Hero\'s weapon mastery, shields, and armor endurance.',
    icon: '⚔️',
    trainingIds: ['train_heavy_weapons', 'train_crushing_blows', 'train_shield_wall', 'train_armor_conditioning']
  },
  tr_tree_delving: {
    treeId: 'tr_tree_delving',
    name: 'Dungeon Survival & Delving',
    shortDescription: 'Subterranean endurance and vault survival drills tailored for deep Starfall expeditions.',
    icon: '🧭',
    trainingIds: ['train_dungeon_survival']
  }
};

export const PROTOTYPE_TRAINING_DEFINITIONS = {
  train_heavy_weapons: {
    trainingDefinitionId: 'train_heavy_weapons',
    treeId: 'tr_tree_martial',
    nodePos: { col: 0, row: 0 },
    parentIds: [],
    icon: '⚔️',
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
  train_crushing_blows: {
    trainingDefinitionId: 'train_crushing_blows',
    treeId: 'tr_tree_martial',
    nodePos: { col: 1, row: 0 },
    parentIds: ['train_heavy_weapons'],
    icon: '🔨',
    name: 'Crushing Blow Drills',
    description: 'Armor-breaking heavy strike drills granting +6 ATK per level to this Hero.',
    subjectType: 'hero',
    skillRef: 'crushing_blows',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_CRUSHING_BLOW_001', operator: '>=', value: 1, label: 'Shattering Strikes' },
    queueType: 'hero_training',
    levels: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'gold', amount: 120 }], benefits: [{ effectType: 'attribute_modifier', target: 'atk', op: 'additive', value: 6 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'gold', amount: 350 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_CRUSHING_BLOW_001', operator: '>=', value: 2 }, benefits: [{ effectType: 'attribute_modifier', target: 'atk', op: 'additive', value: 8 }] }
    ],
    version: '1.0.0'
  },
  train_shield_wall: {
    trainingDefinitionId: 'train_shield_wall',
    treeId: 'tr_tree_martial',
    nodePos: { col: 0, row: 1 },
    parentIds: [],
    icon: '🛡️',
    name: 'Shield Wall Conditioning',
    description: 'Defensive stance training granting +3 DEF per level to this Hero.',
    subjectType: 'hero',
    skillRef: 'shield_wall',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_SHIELD_WALL_001', operator: '>=', value: 1, label: 'Tower Shield Foundations' },
    queueType: 'hero_training',
    levels: [
      { level: 1, durationSec: 45,  costs: [{ kind: 'currency', currencyId: 'gold', amount: 40 }],  benefits: [{ effectType: 'attribute_modifier', target: 'def', op: 'additive', value: 3 }] },
      { level: 2, durationSec: 180, costs: [{ kind: 'currency', currencyId: 'gold', amount: 140 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_SHIELD_WALL_001', operator: '>=', value: 2 }, benefits: [{ effectType: 'attribute_modifier', target: 'def', op: 'additive', value: 3 }] },
      { level: 3, durationSec: 540, costs: [{ kind: 'currency', currencyId: 'gold', amount: 420 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_SHIELD_WALL_001', operator: '>=', value: 3 }, benefits: [{ effectType: 'attribute_modifier', target: 'def', op: 'additive', value: 4 }] }
    ],
    version: '1.0.0'
  },
  train_armor_conditioning: {
    trainingDefinitionId: 'train_armor_conditioning',
    treeId: 'tr_tree_martial',
    nodePos: { col: 1, row: 1 },
    parentIds: ['train_shield_wall'],
    icon: '🥋',
    name: 'Heavy Plate Conditioning',
    description: 'Endurance drills in full plate granting +20 Max HP and +2 DEF per level.',
    subjectType: 'hero',
    skillRef: 'armor_conditioning',
    prerequisites: { type: 'research_level', research_item_id: 'WAR_ARMOR_FITTING_001', operator: '>=', value: 1, label: 'Articulated Plate Fitting' },
    queueType: 'hero_training',
    levels: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'gold', amount: 110 }], benefits: [{ effectType: 'attribute_modifier', target: 'maxHp', op: 'additive', value: 20 }, { effectType: 'attribute_modifier', target: 'def', op: 'additive', value: 2 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'gold', amount: 320 }], prerequisites: { type: 'research_level', research_item_id: 'WAR_ARMOR_FITTING_001', operator: '>=', value: 2 }, benefits: [{ effectType: 'attribute_modifier', target: 'maxHp', op: 'additive', value: 25 }, { effectType: 'attribute_modifier', target: 'def', op: 'additive', value: 3 }] }
    ],
    version: '1.0.0'
  },
  train_dungeon_survival: {
    trainingDefinitionId: 'train_dungeon_survival',
    treeId: 'tr_tree_delving',
    nodePos: { col: 0, row: 0 },
    parentIds: [],
    icon: '🔥',
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
