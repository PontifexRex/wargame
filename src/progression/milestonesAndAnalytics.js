// =============================================================================
// MILESTONES, PROVENANCE TITLES, TREE ARCHIVING, TUTORIAL HOOKS & ANALYTICS
// (Inc 10.5 / Spec §16, §17, §19)
// =============================================================================

import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  DEFAULT_CURRENCY_DEFINITIONS,
  recordCurrencyTransaction,
  getCurrencyBalance
} from './currencyService.js';
import {
  PROTOTYPE_RESEARCH_TREES,
  PROTOTYPE_RESEARCH_ITEMS
} from './researchCatalog.js';
import { buildOwnerProgressLookup } from './queueService.js';

export const TITLE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  UNIQUE: 'unique',
  WORLD_FIRST: 'world_first',
  GUILD: 'guild',
  ALLIANCE: 'alliance',
  HUMOROUS: 'humorous'
};

export const PROGRESSION_EVENTS = {
  RP_ACCRUED_PASSIVE: 'progression.rp_accrued_passive',
  RP_AWARDED_ACTIVITY: 'progression.rp_awarded_activity',
  RESEARCH_STARTED: 'progression.research_started',
  RESEARCH_ENQUEUED: 'progression.research_enqueued',
  RESEARCH_PAUSED: 'progression.research_paused',
  RESEARCH_RESUMED: 'progression.research_resumed',
  RESEARCH_CANCELLED: 'progression.research_cancelled',
  RESEARCH_COMPLETED: 'progression.research_completed',
  TRAINING_STARTED: 'progression.training_started',
  TRAINING_COMPLETED: 'progression.training_completed',
  TRAINING_CANCELLED: 'progression.training_cancelled',
  CONTRIBUTION_RECORDED: 'progression.contribution_recorded',
  MILESTONE_COMPLETED: 'progression.milestone_completed',
  TITLE_EARNED: 'progression.title_earned',
  TITLE_EQUIPPED: 'progression.title_equipped',
  TREE_ARCHIVED: 'progression.tree_archived',
  TUTORIAL_STEP_COMPLETED: 'progression.tutorial_step_completed'
};

// 12-Step Incremental Research & Training Onboarding Checklist (Spec §17)
export const PROGRESSION_TUTORIAL_STEPS = [
  { stepId: 'tut_01_passive_rp',      order: 1,  title: 'Accrue General Knowledge',     desc: 'Earn passive General RP over time.' },
  { stepId: 'tut_02_activity_rp',     order: 2,  title: 'Earn Field Research Points',   desc: 'Earn Adventurer RP from delving, skirmishes, or quests.' },
  { stepId: 'tut_03_start_research',  order: 3,  title: 'Begin First Research',         desc: 'Start any Personal Research project.' },
  { stepId: 'tut_04_complete_res',    order: 4,  title: 'Complete First Research',      desc: 'Finish your first Personal Research level.' },
  { stepId: 'tut_05_queue_pending',   order: 5,  title: 'Plan Ahead',                   desc: 'Add a second project or reach 2 total research completions.' },
  { stepId: 'tut_06_unlock_training', order: 6,  title: 'Unlock Hero Training',         desc: 'Research Wield Heavier Weapons or Subterranean Survival.' },
  { stepId: 'tut_07_train_hero',      order: 7,  title: 'Train an Individual Hero',     desc: 'Complete a Hero Training session on the separate Training Queue.' },
  { stepId: 'tut_08_milestone',       order: 8,  title: 'Claim a Tree Milestone',       desc: 'Complete a Research Tree milestone.' },
  { stepId: 'tut_09_equip_title',     order: 9,  title: 'Display a Provenance Title',   desc: 'Select an earned Title for display.' },
  { stepId: 'tut_10_org_join',        order: 10, title: 'Join a Guild or Alliance',     desc: 'Establish or join a Player Guild or Alliance.' },
  { stepId: 'tut_11_contribute',      order: 11, title: 'Contribute to Shared Pool',    desc: 'Record a Guild or Alliance research contribution.' },
  { stepId: 'tut_12_archive_tree',    order: 12, title: 'Archive a Mastered Tree',      desc: 'Archive a completed Research Tree while preserving history.' }
];

export function awardProvenanceTitle(progression, spec) {
  if (!progression || !spec || !spec.titleId) return { ok: false, reason: 'invalid_title_spec' };
  if (!Array.isArray(progression.earnedTitles)) progression.earnedTitles = [];

  const existing = progression.earnedTitles.find(function(t) { return t.titleId === spec.titleId; });
  if (existing) {
    return { ok: true, duplicate: true, title: existing };
  }

  const record = {
    titleId: String(spec.titleId),
    name: String(spec.name || spec.titleId),
    rarity: spec.rarity || TITLE_RARITIES.COMMON,
    provenance: String(spec.provenance || 'research_milestone'),
    worldId: String(spec.worldId || 'aethelgard_prime'),
    earnedAt: typeof spec.nowMs === 'number' ? spec.nowMs : 0
  };
  progression.earnedTitles.push(record);
  return { ok: true, duplicate: false, title: record };
}

export function setActivePlayerTitle(progression, titleId) {
  if (!progression) return { ok: false, reason: 'invalid_progression' };
  if (titleId === null || titleId === '') {
    progression.activeTitleId = null;
    return { ok: true, activeTitle: null };
  }
  const found = (progression.earnedTitles || []).find(function(t) { return t.titleId === titleId; });
  if (!found) return { ok: false, reason: 'title_not_owned' };
  progression.activeTitleId = found.titleId;
  return { ok: true, activeTitle: found };
}

export function getActivePlayerTitle(progression) {
  if (!progression || !progression.activeTitleId) return null;
  return (progression.earnedTitles || []).find(function(t) { return t.titleId === progression.activeTitleId; }) || null;
}

export function isTreeCompleted(progression, treeId, ownerId, options) {
  const opts = options || {};
  const trees = Object.assign({}, PROTOTYPE_RESEARCH_TREES, opts.trees || {});
  const tree = trees[treeId];
  if (!tree || !Array.isArray(tree.itemIds) || tree.itemIds.length === 0) return false;

  const ownerType = opts.ownerType || tree.ownershipType || OWNER_TYPES.PLAYER;
  const lookup = buildOwnerProgressLookup(progression, ownerType, ownerId || 'player_1');

  for (let i = 0; i < tree.itemIds.length; i++) {
    const inst = lookup[tree.itemIds[i]];
    if (!inst || (inst.currentLevel || 0) < 1) return false;
  }
  return true;
}

export function archiveCompletedTree(progression, treeId, ownerId, options) {
  if (!progression || !treeId) return { ok: false, reason: 'invalid_params' };
  if (!isTreeCompleted(progression, treeId, ownerId, options)) {
    return { ok: false, reason: 'tree_not_completed' };
  }
  if (!Array.isArray(progression.archivedTreeIds)) progression.archivedTreeIds = [];
  if (progression.archivedTreeIds.indexOf(treeId) === -1) {
    progression.archivedTreeIds.push(treeId);
  }
  return { ok: true, treeId: treeId, archivedTreeIds: progression.archivedTreeIds.slice() };
}

export function unarchiveTree(progression, treeId) {
  if (!progression || !Array.isArray(progression.archivedTreeIds)) return { ok: false, reason: 'invalid_params' };
  const idx = progression.archivedTreeIds.indexOf(treeId);
  if (idx !== -1) progression.archivedTreeIds.splice(idx, 1);
  return { ok: true, treeId: treeId, archivedTreeIds: progression.archivedTreeIds.slice() };
}

// Evaluate all tree milestones and grant rewards/titles idempotently
export function evaluateTreeMilestones(progression, ownerId, options) {
  if (!progression) return { newlyCompleted: [], earnedTitles: [] };
  const opts = options || {};
  const pid = String(ownerId || 'player_1');
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : 0;
  const worldId = String(opts.worldId || 'aethelgard_prime');
  const trees = Object.assign({}, PROTOTYPE_RESEARCH_TREES, opts.trees || {});

  if (!progression.completedMilestones) progression.completedMilestones = {};

  const lookup = buildOwnerProgressLookup(progression, OWNER_TYPES.PLAYER, pid);
  const newlyCompleted = [];
  const newlyEarnedTitles = [];

  const treeIds = Object.keys(trees);
  for (let i = 0; i < treeIds.length; i++) {
    const tree = trees[treeIds[i]];
    const milestones = Array.isArray(tree.milestones) ? tree.milestones : [];
    if (milestones.length === 0) continue;

    let completedItemsInTree = 0;
    const itemIds = Array.isArray(tree.itemIds) ? tree.itemIds : [];
    for (let j = 0; j < itemIds.length; j++) {
      const inst = lookup[itemIds[j]];
      if (inst && (inst.currentLevel || 0) >= 1) completedItemsInTree++;
    }

    for (let m = 0; m < milestones.length; m++) {
      const ms = milestones[m];
      if (progression.completedMilestones[ms.milestoneId]) continue;
      if (completedItemsInTree < (ms.requiredCompletions || 1)) continue;

      const rewardSummary = {
        gold: ms.rewardGold || 0,
        title: ms.rewardTitle || null
      };

      if (ms.rewardGold && ms.rewardGold > 0) {
        recordCurrencyTransaction(progression.currencyLedger, {
          ownerId: pid,
          ownerType: OWNER_TYPES.PLAYER,
          currencyId: 'gold',
          amount: ms.rewardGold,
          transactionType: TRANSACTION_TYPES.AWARD,
          source: 'milestone:' + ms.milestoneId,
          referenceId: tree.treeId,
          idempotencyKey: 'ms_gold:' + pid + ':' + ms.milestoneId,
          nowMs: nowMs
        });
      }

      if (ms.rewardTitle) {
        const titleRes = awardProvenanceTitle(progression, {
          titleId: 'title_' + ms.milestoneId,
          name: ms.rewardTitle,
          rarity: ms.titleRarity || TITLE_RARITIES.RARE,
          provenance: 'Completed milestone in ' + tree.name,
          worldId: worldId,
          nowMs: nowMs
        });
        if (titleRes.ok && !titleRes.duplicate) {
          newlyEarnedTitles.push(titleRes.title);
        }
      }

      const completionRecord = {
        milestoneId: ms.milestoneId,
        treeId: tree.treeId,
        completedAt: nowMs,
        rewards: rewardSummary
      };
      progression.completedMilestones[ms.milestoneId] = completionRecord;
      newlyCompleted.push(completionRecord);
    }
  }

  return {
    newlyCompleted: newlyCompleted,
    earnedTitles: newlyEarnedTitles
  };
}

export function evaluateTutorialProgress(progression, ownerId) {
  const pid = String(ownerId || 'player_1');
  const lookup = buildOwnerProgressLookup(progression || {}, OWNER_TYPES.PLAYER, pid);
  const completedResCount = Object.keys(lookup).filter(function(k) {
    return lookup[k] && (lookup[k].currentLevel || 0) >= 1;
  }).length;

  const trainInsts = (progression && progression.trainingInstances) ? Object.values(progression.trainingInstances) : [];
  const completedTrainCount = trainInsts.filter(function(t) { return t && (t.currentLevel || 0) >= 1; }).length;

  const genRp = progression && progression.currencyLedger
    ? getCurrencyBalance(progression.currencyLedger, pid, OWNER_TYPES.PLAYER, 'rp_general').availableScaled
    : 0;
  const advRp = progression && progression.currencyLedger
    ? getCurrencyBalance(progression.currencyLedger, pid, OWNER_TYPES.PLAYER, 'rp_adventurer').availableScaled
    : 0;

  const rq = (progression && progression.researchQueue) ? progression.researchQueue : { activeItems: [], pendingItems: [] };
  const orgs = (progression && progression.organizations) ? progression.organizations : {};

  const checks = {
    tut_01_passive_rp: genRp > 0 || completedResCount > 0,
    tut_02_activity_rp: advRp > 0 || completedResCount > 0,
    tut_03_start_research: rq.activeItems.length > 0 || completedResCount > 0,
    tut_04_complete_res: completedResCount >= 1,
    tut_05_queue_pending: rq.pendingItems.length > 0 || completedResCount >= 2,
    tut_06_unlock_training: Boolean((lookup.WAR_WEAPON_HEAVY_001 && lookup.WAR_WEAPON_HEAVY_001.currentLevel >= 1) || (lookup.ADV_SURVIVAL_001 && lookup.ADV_SURVIVAL_001.currentLevel >= 1)),
    tut_07_train_hero: completedTrainCount >= 1,
    tut_08_milestone: Object.keys((progression && progression.completedMilestones) || {}).length >= 1,
    tut_09_equip_title: Boolean(progression && progression.activeTitleId),
    tut_10_org_join: Boolean(orgs.playerGuildId || orgs.playerAllianceId),
    tut_11_contribute: Boolean(progression && Array.isArray(progression.contributions) && progression.contributions.length >= 1),
    tut_12_archive_tree: Boolean(progression && Array.isArray(progression.archivedTreeIds) && progression.archivedTreeIds.length >= 1)
  };

  const completedSteps = [];
  let nextStep = null;
  for (let i = 0; i < PROGRESSION_TUTORIAL_STEPS.length; i++) {
    const st = PROGRESSION_TUTORIAL_STEPS[i];
    if (checks[st.stepId]) {
      completedSteps.push(st.stepId);
    } else if (!nextStep) {
      nextStep = st;
    }
  }

  return {
    completedSteps: completedSteps,
    completedCount: completedSteps.length,
    totalSteps: PROGRESSION_TUTORIAL_STEPS.length,
    progressPct: Math.round((completedSteps.length / PROGRESSION_TUTORIAL_STEPS.length) * 100),
    nextStep: nextStep
  };
}

// ResearchAnalyticsService: Player & Game Telemetry Summary (Spec §19)
export function computeProgressionAnalytics(progression, ownerId, options) {
  const opts = options || {};
  const pid = String(ownerId || 'player_1');
  const itemsCatalog = Object.assign({}, PROTOTYPE_RESEARCH_ITEMS, opts.items || {});
  const treesCatalog = Object.assign({}, PROTOTYPE_RESEARCH_TREES, opts.trees || {});

  const currencyBalances = {};
  const cIds = Object.keys(DEFAULT_CURRENCY_DEFINITIONS);
  for (let i = 0; i < cIds.length; i++) {
    const cid = cIds[i];
    currencyBalances[cid] = progression && progression.currencyLedger
      ? getCurrencyBalance(progression.currencyLedger, pid, OWNER_TYPES.PLAYER, cid).available
      : 0;
  }

  const lookup = buildOwnerProgressLookup(progression || {}, OWNER_TYPES.PLAYER, pid);
  const domainBreakdown = {};
  let totalResearchCompletions = 0;
  let totalResearchLevels = 0;

  const progKeys = Object.keys(lookup);
  for (let j = 0; j < progKeys.length; j++) {
    const itemId = progKeys[j];
    const inst = lookup[itemId];
    if (!inst || !inst.currentLevel) continue;
    totalResearchCompletions += (inst.completionCount || inst.currentLevel);
    totalResearchLevels += inst.currentLevel;

    const def = itemsCatalog[itemId];
    const domId = def ? def.domainId : 'unknown';
    if (!domainBreakdown[domId]) {
      domainBreakdown[domId] = { domainId: domId, itemsCompleted: 0, totalLevels: 0 };
    }
    domainBreakdown[domId].itemsCompleted += 1;
    domainBreakdown[domId].totalLevels += inst.currentLevel;
  }

  const completedTreeIds = Object.keys(treesCatalog).filter(function(tid) {
    return isTreeCompleted(progression, tid, pid, { trees: treesCatalog });
  });

  const trainMap = (progression && progression.trainingInstances) ? progression.trainingInstances : {};
  const trainKeys = Object.keys(trainMap);
  const trainedSubjects = {};
  let totalTrainingCompletions = 0;
  for (let t = 0; t < trainKeys.length; t++) {
    const tr = trainMap[trainKeys[t]];
    if (tr && tr.currentLevel > 0) {
      totalTrainingCompletions += (tr.completionCount || tr.currentLevel);
      trainedSubjects[tr.subjectType + ':' + tr.subjectId] = true;
    }
  }

  const contribs = (progression && Array.isArray(progression.contributions)) ? progression.contributions : [];
  let totalContributedScaled = 0;
  for (let c = 0; c < contribs.length; c++) {
    totalContributedScaled += (contribs[c].amountScaled || 0);
  }

  const rq = (progression && progression.researchQueue) ? progression.researchQueue : { activeItems: [], pendingItems: [] };
  const tq = (progression && progression.trainingQueue) ? progression.trainingQueue : { activeItems: [], pendingItems: [] };

  return {
    ownerId: pid,
    currencyBalances: currencyBalances,
    totalResearchCompletions: totalResearchCompletions,
    totalResearchLevels: totalResearchLevels,
    completedTreeCount: completedTreeIds.length,
    completedTreeIds: completedTreeIds,
    archivedTreeCount: (progression && Array.isArray(progression.archivedTreeIds)) ? progression.archivedTreeIds.length : 0,
    totalTrainingCompletions: totalTrainingCompletions,
    trainedSubjectCount: Object.keys(trainedSubjects).length,
    activeResearchCount: rq.activeItems.length,
    pendingResearchCount: rq.pendingItems.length,
    activeTrainingCount: tq.activeItems.length,
    pendingTrainingCount: tq.pendingItems.length,
    milestoneCount: Object.keys((progression && progression.completedMilestones) || {}).length,
    titleCount: (progression && Array.isArray(progression.earnedTitles)) ? progression.earnedTitles.length : 0,
    activeTitle: getActivePlayerTitle(progression),
    ledgerTransactionCount: (progression && progression.currencyLedger && Array.isArray(progression.currencyLedger.transactions))
      ? progression.currencyLedger.transactions.length
      : 0,
    contributionCount: contribs.length,
    totalContributedScaled: totalContributedScaled,
    domainBreakdown: domainBreakdown,
    tutorial: evaluateTutorialProgress(progression, pid)
  };
}
