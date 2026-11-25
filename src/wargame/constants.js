// Wargame Macro Simulation Constants, Campaign Phases, Topic Namespaces & Default Rulesets

export const WARGAME_SCHEMA_VERSION = 'v1.0.0-wargame-sim';
export const WARGAME_STORAGE_KEY = 'aethelgard_wargame_campaign_v1';

// Campaign Lifecycle Phases (Strict Settler-First Onboarding State Machine)
export const CAMPAIGN_PHASES = {
  TITLE:             'title',             // Start screen: New Campaign / Continue / Seed & Ruleset
  SETTLER_PIONEER:   'settler_pioneer',   // Controlling Pioneer Settler on Overworld; no City or Hero yet
  CITY_ESTABLISHED:  'city_established',  // First City founded; real-time build queue & resource production active
  GUILD_UNLOCKED:    'guild_unlocked'     // Adventurers Guild Hall built; Hero recruitment & Dungeon parties active
};

// Active Workspace Viewport Modes inside an active campaign
export const WARGAME_VIEWS = {
  OVERWORLD: 'overworld',
  CITY:      'city',
  GUILD:     'guild'
};

// Default Overworld Dimensions
export const OVERWORLD_MAP_W = 56;
export const OVERWORLD_MAP_H = 40;
export const OVERWORLD_VIEWPORT_W = 21;
export const OVERWORLD_VIEWPORT_H = 15;
export const OVERWORLD_TILE_SIZE = 32;

// Real-Time Simulation Tick Configuration
export const BASE_TICK_INTERVAL_MS = 100; // 10 simulation ticks per second (100ms resolution)
export const RESOURCE_PRODUCTION_INTERVAL_MS = 5000; // Resource buildings yield every 5s base time
export const BASE_HERO_RECRUIT_DURATION_MS = 60000; // 60 seconds real-time hero oath / induction duration
export const BASE_BUILD_QUEUE_LIMIT = 3; // Maximum construction projects in queue (1 active + 2 pending)
export const BASE_RECRUIT_QUEUE_LIMIT = 3; // Maximum heroes in recruitment queue (1 active + 2 pending)
export const BASE_TROOP_QUEUE_LIMIT = 3; // Maximum troop training batches in city queue (1 active + 2 pending)
export const MAX_TROOP_BATCH_SIZE = 10; // Maximum soldiers queued in a single training batch
export const DEMOLISH_SALVAGE_RATIO = 0.35; // 35% salvage returned upon demolishing a building
export const CANCEL_CLEANUP_TIME_RATIO = 0.50; // Cancelling active construction requires 50% of elapsed time for site cleanup

// Spatial 8x8 City Grid Layout
export const CITY_GRID_COLS = 8;
export const CITY_GRID_ROWS = 8;
export const CITY_TOTAL_PLOTS = 64;
export const CITY_CENTER_PLOT_INDEX = 27; // Center plot at (3, 3) where starter Bastion Keep / Hut is founded
export const BASE_MOVE_BUILDING_DURATION_MS = 2500; // 2.5s base duration to relocate a structure to an empty plot

// Base Resource Storage Limits & Population Capacities
export const DEFAULT_STORAGE_CAPS = {
  food:   200,
  wood:   200,
  stone:  200,
  ore:    100,
  ingots: 100,
  water:  200,
  gold:   300
};
export const BASE_POPULATION_CAP = 10;
export const HUT_POPULATION_PER_LEVEL = 5;
export const WINDMILL_ADJACENCY_BONUS = 0.20;
export const BASE_MAX_HERO_ROSTER = 3;
export const CITY_STORAGE_BASE_CAPACITY = 200;

// Structured Streaming Event Topics
export const STREAM_TOPICS = {
  CAMPAIGN_STARTED:     'campaign.started',
  CAMPAIGN_LOADED:      'campaign.loaded',
  CLOCK_SPEED_CHANGED:  'clock.speedChanged',
  CLOCK_PAUSED:         'clock.paused',
  COMMAND_ACCEPTED:     'command.accepted',
  COMMAND_REJECTED:     'command.rejected',
  UNIT_SPAWNED:         'unit.spawned',
  UNIT_MARCH_STARTED:   'unit.marchStarted',
  UNIT_MARCH_STEP:      'unit.marchStep',
  UNIT_MARCH_COMPLETED: 'unit.marchCompleted',
  UNIT_MARCH_CANCELLED: 'unit.marchCancelled',
  SETTLER_RESPAWNED:    'unit.settlerRespawned',
  CITY_FOUNDED:         'city.founded',
  BUILDING_QUEUED:      'city.buildingQueued',
  BUILDING_CANCELLED:   'city.buildingCancelled',
  BUILDING_DEMOLISHED:  'city.buildingDemolished',
  BUILDING_MOVED:       'city.buildingMoved',
  BUILDING_COMPLETED:   'city.buildingCompleted',
  RESOURCE_TICK:        'city.resourceTick',
  RESOURCE_HARVESTED:   'overworld.resourceHarvested',
  HERO_RECRUIT_STARTED: 'guild.heroRecruitStarted',
  HERO_RECRUIT_CANCEL:  'guild.heroRecruitCancelled',
  HERO_RECRUITED:       'guild.heroRecruited',
  TROOP_TRAINING_STARTED:   'military.troopTrainingStarted',
  TROOP_TRAINING_CANCELLED: 'military.troopTrainingCancelled',
  TROOP_TRAINED:            'military.troopTrained',
  TROOP_UPGRADE_STARTED:    'military.troopUpgradeStarted',
  TROOP_UPGRADE_CANCELLED:  'military.troopUpgradeCancelled',
  TROOP_UPGRADE_COMPLETED:  'military.troopUpgradeCompleted',
  TROOPS_DISBANDED:         'military.troopsDisbanded',
  HERO_DISMISSED:       'guild.heroDismissed',
  LEADER_CHANGED:       'guild.leaderChanged',
  STORAGE_UPDATED:      'city.storageUpdated',
  CRAFTING_COMPLETED:   'city.craftingCompleted',
  MARKET_TRADE:         'city.marketTrade',
  ACADEMY_STUDY:        'city.academyStudy',
  PARTY_FORMED:         'guild.partyFormed',
  DUNGEON_DISCOVERED:   'dungeon.discovered',
  DUNGEON_ENTERED:      'dungeon.entered',
  DUNGEON_RETURNED:     'dungeon.returned',
  EXPEDITION_BANKED:    'expedition.banked',
  OVERWORLD_SKIRMISH:   'overworld.skirmish',
  TASK_UNLOCKED:        'task.unlocked',
  TASK_PROGRESS:        'task.progress',
  TASK_COMPLETED:       'task.completed',
  TASK_CLAIMED:         'task.claimed'
};

// Authoritative Command Types (Serializable Intent Envelopes)
export const COMMAND_TYPES = {
  START_NEW_CAMPAIGN: 'CMD_START_NEW_CAMPAIGN',
  ORDER_UNIT_MARCH:   'CMD_ORDER_UNIT_MARCH',
  STEP_UNIT_ADJACENT: 'CMD_STEP_UNIT_ADJACENT',
  CANCEL_UNIT_MARCH:  'CMD_CANCEL_UNIT_MARCH',
  HARVEST_NODE:       'CMD_HARVEST_NODE',
  FOUND_CITY:         'CMD_FOUND_CITY',
  RESPAWN_SETTLER:    'CMD_RESPAWN_SETTLER',
  SELECT_CITY_PLOT:   'CMD_SELECT_CITY_PLOT',
  QUEUE_BUILDING:     'CMD_QUEUE_BUILDING',
  MOVE_BUILDING:      'CMD_MOVE_BUILDING',
  CANCEL_BUILDING:    'CMD_CANCEL_BUILDING',
  DEMOLISH_BUILDING:  'CMD_DEMOLISH_BUILDING',
  RECRUIT_HERO:          'CMD_RECRUIT_HERO',
  CANCEL_RECRUITMENT:    'CMD_CANCEL_RECRUITMENT',
  TRAIN_TROOPS:          'CMD_TRAIN_TROOPS',
  CANCEL_TROOP_TRAINING: 'CMD_CANCEL_TROOP_TRAINING',
  UPGRADE_TROOPS:        'CMD_UPGRADE_TROOPS',
  CANCEL_TROOP_UPGRADE:  'CMD_CANCEL_TROOP_UPGRADE',
  DISBAND_TROOPS:        'CMD_DISBAND_TROOPS',
  DISMISS_HERO:          'CMD_DISMISS_HERO',
  SET_OVERALL_LEADER:    'CMD_SET_OVERALL_LEADER',
  ASSIGN_HERO_TO_PARTY:  'CMD_ASSIGN_HERO_TO_PARTY',
  EQUIP_HERO_ITEM:       'CMD_EQUIP_HERO_ITEM',
  UNEQUIP_HERO_ITEM:     'CMD_UNEQUIP_HERO_ITEM',
  AUTO_EQUIP_HERO:       'CMD_AUTO_EQUIP_HERO',
  DEPOSIT_TO_CITY_STORAGE:    'CMD_DEPOSIT_TO_CITY_STORAGE',
  WITHDRAW_FROM_CITY_STORAGE: 'CMD_WITHDRAW_FROM_CITY_STORAGE',
  DUMP_HERO_BAG_TO_CITY:      'CMD_DUMP_HERO_BAG_TO_CITY',
  SMELT_INGOTS:               'CMD_SMELT_INGOTS',
  BREW_PROVISION:             'CMD_BREW_PROVISION',
  FORGE_EQUIPMENT:            'CMD_FORGE_EQUIPMENT',
  TEMPER_EQUIPMENT:           'CMD_TEMPER_EQUIPMENT',
  PUNCH_SOCKET:               'CMD_PUNCH_SOCKET',
  SOCKET_CITY_GEM:            'CMD_SOCKET_CITY_GEM',
  UNSOCKET_CITY_GEM:          'CMD_UNSOCKET_CITY_GEM',
  MARKET_TRADE:               'CMD_MARKET_TRADE',
  MARKET_LIQUIDATE_ITEM:      'CMD_MARKET_LIQUIDATE_ITEM',
  ACADEMY_STUDY_SESSION:      'CMD_ACADEMY_STUDY_SESSION',
  MARCH_TO_DUNGEON:           'CMD_MARCH_TO_DUNGEON',
  ENTER_DUNGEON:              'CMD_ENTER_DUNGEON',
  EXIT_DUNGEON_TO_SURFACE:    'CMD_EXIT_DUNGEON_TO_SURFACE',
  RESOLVE_DUNGEON_RETURN:     'CMD_RESOLVE_DUNGEON_RETURN',
  CLAIM_TASK_REWARD:     'CMD_CLAIM_TASK_REWARD',
  SET_SIM_SPEED:      'CMD_SET_SIM_SPEED',
  SWITCH_VIEW:        'CMD_SWITCH_VIEW'
};
