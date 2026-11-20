// =============================================================================
// UNIFIED PROGRESSION STATE CONTAINER & SAVE BACKFILL (Inc 10.1 / ADR-0015)
// Durable runtime state for Currency Ledger, Research Progress Instances,
// Separate Research & Hero Training Queues, Contributions, Milestones & Titles.
// =============================================================================

import { createCurrencyLedgerState } from './currencyService.js';

export function createDefaultProgressionState(nowMs) {
  const ts = typeof nowMs === 'number' ? nowMs : 0;
  return {
    schemaVersion: '1.0.0',
    currencyLedger: createCurrencyLedgerState(),
    researchProgress: {},     // Keyed by ownerKey:researchItemId -> ResearchProgressInstance
    trainingInstances: {},    // Keyed by subjectId:trainingDefinitionId -> TrainingInstance
    researchQueue: {
      queueId: 'q_research_personal',
      queueType: 'research',
      capacity: 1,            // 1 free baseline; 2 for subscribers (configurable)
      activeItems: [],
      pendingItems: [],
      enabled: true
    },
    trainingQueue: {
      queueId: 'q_training_hero',
      queueType: 'hero_training',
      capacity: 1,            // Separate Hero Training Queue (Clarified Decision #2)
      activeItems: [],
      pendingItems: [],
      enabled: true
    },
    contributions: [],        // ResearchContributionInstance[]
    completedMilestones: {},  // milestoneId -> { completedAt, rewards }
    earnedTitles: [],         // { titleId, name, rarity, provenance, earnedAt }
    activeTitleId: null,
    archivedTreeIds: [],
    discoveries: {},
    alignment: {
      godId: null,
      godName: null,
      godTags: []
    },
    lastAccrualAtMs: ts,
    antiAbuseCounters: {}
  };
}

export function ensureProgressionState(world) {
  if (!world) return null;
  if (!world.progression || typeof world.progression !== 'object') {
    world.progression = createDefaultProgressionState(world.clock ? world.clock.simTimeMs : 0);
  }
  const p = world.progression;
  if (!p.currencyLedger) p.currencyLedger = createCurrencyLedgerState();
  if (!p.researchProgress) p.researchProgress = {};
  if (!p.trainingInstances) p.trainingInstances = {};
  if (!p.researchQueue) p.researchQueue = createDefaultProgressionState().researchQueue;
  if (!p.trainingQueue) p.trainingQueue = createDefaultProgressionState().trainingQueue;
  if (!Array.isArray(p.contributions)) p.contributions = [];
  if (!p.completedMilestones) p.completedMilestones = {};
  if (!Array.isArray(p.earnedTitles)) p.earnedTitles = [];
  if (!Array.isArray(p.archivedTreeIds)) p.archivedTreeIds = [];
  if (!p.discoveries) p.discoveries = {};
  if (!p.alignment) p.alignment = { godId: null, godName: null, godTags: [] };
  if (!p.antiAbuseCounters) p.antiAbuseCounters = {};
  return p;
}
