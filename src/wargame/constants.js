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
export const DEMOLISH_SALVAGE_RATIO = 0.35; // 35% salvage returned upon demolishing a building
export const CANCEL_CLEANUP_TIME_RATIO = 0.50; // Cancelling active construction requires 50% of elapsed time for site cleanup

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
  BUILDING_COMPLETED:   'city.buildingCompleted',
  RESOURCE_TICK:        'city.resourceTick',
  RESOURCE_HARVESTED:   'overworld.resourceHarvested',
  HERO_RECRUIT_STARTED: 'guild.heroRecruitStarted',
  HERO_RECRUIT_CANCEL:  'guild.heroRecruitCancelled',
  HERO_RECRUITED:       'guild.heroRecruited',
  PARTY_FORMED:         'guild.partyFormed',
  DUNGEON_ENTERED:      'dungeon.entered',
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
  QUEUE_BUILDING:     'CMD_QUEUE_BUILDING',
  CANCEL_BUILDING:    'CMD_CANCEL_BUILDING',
  DEMOLISH_BUILDING:  'CMD_DEMOLISH_BUILDING',
  RECRUIT_HERO:       'CMD_RECRUIT_HERO',
  CANCEL_RECRUITMENT: 'CMD_CANCEL_RECRUITMENT',
  CLAIM_TASK_REWARD:  'CMD_CLAIM_TASK_REWARD',
  SET_SIM_SPEED:      'CMD_SET_SIM_SPEED',
  SWITCH_VIEW:        'CMD_SWITCH_VIEW'
};
