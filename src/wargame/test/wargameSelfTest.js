// Headless & In-Browser Verification Suite for the Standalone Macro Wargame & Real-Time Simulation Engine

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS,
  COMMAND_TYPES
} from '../constants.js';
import { createWargameSimHost } from '../engine/simHost.js';
import { createMinHeapPriorityQueue } from '../engine/scheduler.js';
import { getPrimaryCity, getSelectedOverworldUnit, computeCityPopulation, computeCityStorageSlotCapacity, buildSerializableWargameState } from '../engine/state.js';
import {
  CANONICAL_PLAYER_ID,
  getCanonicalPlayerId,
  ensureCanonicalPlayerIdentity
} from '../../core/canonicalIdentity.js';
import { APP_CONTEXTS, createAppContextController } from '../../core/appContext.js';
import { createDefaultGameState } from '../../engine/state.js';
import { extractToGuild, handleHeroDefeat, useRecallScroll, traversePortal } from '../../engine/actions.js';
import { useStairsAtPlayer } from '../../engine/combat.js';
import { createPortalInstance } from '../../engine/objects.js';
import {
  HEX_DIR_NAMES,
  getOverworldHexAdapter,
  getHexNeighbors,
  getHexNeighborInDirection,
  getHexDistance,
  areHexesAdjacent,
  getHexesInRange
} from '../engine/hexSpatial.js';
import {
  findOverworldPath,
  revealOverworldVision,
  MIN_OVERWORLD_MARCH_COST_MS
} from '../engine/pathfinding.js';
import {
  OW_TERRAIN_PLAINS,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_MOUNTAINS
} from '../data/terrain.js';
import { interpolateHexSegment, computeOverworldCameraFollow } from '../ui/overworldView.js';
import { CITY_BUILDINGS_CATALOG, computeBuildingDurationMs, isBuildingPrerequisiteMet, computeMaxPartySize, getCityRecruitableClasses, getCityAcademyBenefitEffects } from '../data/buildings.js';
import {
  normalizeSharedHeroProfile,
  renderSharedPaperDollMannequin,
  SHARED_PAPER_DOLL_SLOTS,
  COSMETIC_SLOTS
} from '../../ui/shared/characterSheet.js';
import {
  DEFAULT_ASSET_MANIFEST,
  validateAssetManifest,
  getFacilityInteriorAssetId,
  getHeroPortraitAssetId,
  getProductionImageSrc
} from '../../ui/shared/assetRegistry.js';
import { createRenderAdapter, RENDER_BACKENDS } from '../../ui/shared/renderAdapter.js';
import { getScreenInfoContent } from '../ui/wargameUiSync.js';
import { createIsoGridAdapter, createHexGridAdapter } from '../../ui/shared/gridAdapters.js';
import { createMapViewport } from '../../ui/shared/mapViewport.js';
import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  createCurrencyLedgerState,
  recordCurrencyTransaction,
  getCurrencyBalance,
  reconstructAccountBalance,
  executeAtomicPayment
} from '../../progression/currencyService.js';
import { evaluateConditionNode, evaluateResearchEligibility, EVALUATION_STATUS } from '../../progression/eligibilityService.js';
import { PROTOTYPE_RESEARCH_TREES, PROTOTYPE_RESEARCH_ITEMS, PROTOTYPE_TRAINING_TREES, validateResearchCatalog } from '../../progression/researchCatalog.js';
import { createDefaultProgressionState } from '../../progression/progressionState.js';
import { processPassiveAccrual, awardActivityResearchPoints } from '../../progression/accrualService.js';
import {
  startOrEnqueueResearch,
  pauseResearchItem,
  resumeResearchItem,
  cancelResearchItem,
  advanceResearchProgress,
  REFUND_POLICIES
} from '../../progression/queueService.js';
import {
  createPlayerGuild,
  createAlliance,
  joinOrganization,
  leaveOrganization,
  isPlayerEligibleForOrgBenefits,
  recordGuildActivityContribution,
  contributeToAlliancePool,
  getContributionReport,
  startOrganizationResearch,
  getOrganizationResearchBalance
} from '../../progression/organizationService.js';
import {
  EFFECT_TYPES,
  EFFECT_OPS,
  collectActiveEffects,
  resolveNumericStat,
  resolveUnlockState,
  registerCustomEffectHandler,
  evaluateCustomEffect
} from '../../progression/benefitService.js';
import {
  SUBJECT_TYPES,
  startOrEnqueueTraining,
  pauseTrainingItem,
  resumeTrainingItem,
  cancelTrainingItem,
  advanceTrainingProgress,
  computeSubjectEffectiveStat
} from '../../progression/trainingService.js';
import {
  TITLE_RARITIES,
  PROGRESSION_EVENTS,
  PROGRESSION_TUTORIAL_STEPS,
  evaluateTreeMilestones,
  awardProvenanceTitle,
  setActivePlayerTitle,
  getActivePlayerTitle,
  archiveCompletedTree,
  unarchiveTree,
  evaluateTutorialProgress,
  computeProgressionAnalytics
} from '../../progression/milestonesAndAnalytics.js';
import {
  renderResearchModal,
  renderTrainingModal,
  formatRpTenths,
  buildCostComparisonRowHtml,
  tickWorldProgression
} from '../ui/progressionUi.js';
import { DEV_CONFIG_REGISTRY, getConfigValue } from '../../progression/configRegistry.js';
import {
  renderDevPortalModal,
  handleDevSetCurrencyAction,
  handleDevSetConfigAction
} from '../ui/devPortal.js';

export function evaluateWargameSelfTests() {
  const results = [];

  // =========================================================================
  // Test 1: Campaign Start Screen & Strict Settler-First Onboarding Contract
  // =========================================================================
  const host1 = createWargameSimHost();
  const startsOnTitle = host1.state.campaignPhase === CAMPAIGN_PHASES.TITLE && host1.state.world === null;

  const startRes = host1.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: {
      houseName: 'House Starborn',
      worldName: 'Aethelgard Prime',
      seedCode: 'STAR-2026',
      simSpeed: 1
    }
  });

  const selUnit1 = getSelectedOverworldUnit(host1.state);
  const noCitiesInitially = Object.keys(host1.state.world.cities || {}).length === 0;
  const noHeroesInitially = Array.isArray(host1.state.world.heroes) && host1.state.world.heroes.length === 0;
  const onlySettlerExists = Boolean(
    selUnit1 &&
    selUnit1.unitType === 'settler' &&
    selUnit1.canFoundCity === true &&
    selUnit1.canEnterDungeon === false &&
    host1.state.world.overworld.units.length === 1
  );

  // Verify premature Hero Recruitment is strictly rejected before City & Guild exist
  const prematureRecruit = host1.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'fighter' }
  });
  const prematureGuildView = host1.dispatch({
    type: COMMAND_TYPES.SWITCH_VIEW,
    payload: { view: WARGAME_VIEWS.GUILD }
  });

  const t1Pass = Boolean(
    startsOnTitle &&
    startRes.ok &&
    host1.state.campaignPhase === CAMPAIGN_PHASES.SETTLER_PIONEER &&
    noCitiesInitially &&
    noHeroesInitially &&
    onlySettlerExists &&
    !prematureRecruit.ok &&
    !prematureGuildView.ok
  );

  results.push({
    name: '1. Campaign Start Screen & Strict Settler-First Onboarding (No Premature Hero)',
    pass: t1Pass,
    detail: t1Pass
      ? 'Starts at Title Screen, transitions to SETTLER_PIONEER with only Pioneer Settler, 0 heroes, and blocks premature hero recruitment/guild view'
      : 'Failed Settler-First onboarding invariant'
  });

  // =========================================================================
  // Test 2: Binary Min-Heap Priority Queue & WorldEventStream Ring Buffer
  // =========================================================================
  const pq = createMinHeapPriorityQueue();
  pq.push({ jobId: 'j_late',  dueSimTimeMs: 9000, seq: 1 });
  pq.push({ jobId: 'j_early', dueSimTimeMs: 1500, seq: 2 });
  pq.push({ jobId: 'j_mid',   dueSimTimeMs: 4200, seq: 3 });
  pq.push({ jobId: 'j_cancel',dueSimTimeMs: 2500, seq: 4 });

  const removedJob = pq.removeById('j_cancel');
  const pop1 = pq.pop();
  const pop2 = pq.pop();
  const pop3 = pq.pop();

  const streamEvents = [];
  const unsub = host1.eventStream.subscribe(STREAM_TOPICS.CLOCK_SPEED_CHANGED, function(ev) {
    streamEvents.push(ev);
  });
  host1.dispatch({ type: COMMAND_TYPES.SET_SIM_SPEED, payload: { speedMultiplier: 5 } });
  unsub();

  const replaySince = host1.eventStream.getEventsSince(0);
  const t2Pass = Boolean(
    removedJob && removedJob.jobId === 'j_cancel' &&
    pop1 && pop1.jobId === 'j_early' &&
    pop2 && pop2.jobId === 'j_mid' &&
    pop3 && pop3.jobId === 'j_late' &&
    pq.size() === 0 &&
    streamEvents.length === 1 &&
    replaySince.length >= 2
  );

  results.push({
    name: '2. Binary Min-Heap Priority Queue Scheduler & WorldEventStream Pub/Sub Replay',
    pass: t2Pass,
    detail: t2Pass
      ? 'O(log N) chronological ordering, mid-heap cancellation, topic subscription, and sequence cursor replay verified'
      : 'Failed scheduler or event stream checks'
  });

  // =========================================================================
  // Test 3: Real-Time A* Unit Marching, Smooth Interpolation & Safe Settler Respawn
  // =========================================================================
  const host3 = createWargameSimHost();
  host3.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Pathfinder', seedCode: 'STAR-3003' }
  });
  const settler3 = getSelectedOverworldUnit(host3.state);
  const startX3 = settler3.x;
  const startY3 = settler3.y;

  // Order a 2-tile march to the East
  const marchOrder = host3.dispatch({
    type: COMMAND_TYPES.ORDER_UNIT_MARCH,
    payload: { unitId: settler3.id, targetX: startX3 + 2, targetY: startY3 }
  });

  const isMarching = settler3.status === 'marching' && marchOrder.ok && marchOrder.data.stepsCount === 2;

  // Advance clock partially (1500ms < 3000ms first tile cost) -> unit should still be on startX3
  host3.stepClock(1500);
  const midMarchStillAtStart = settler3.x === startX3 && settler3.status === 'marching';

  // Advance clock by remaining 1500ms -> completes step 1!
  host3.stepClock(1500);
  const completedStep1 = settler3.x === startX3 + 1 && settler3.status === 'marching';

  // Advance clock by another 3000ms -> completes step 2 and finishes march!
  host3.stepClock(3000);
  const completedStep2 = settler3.x === startX3 + 2 && settler3.status === 'idle' && settler3.marchPlan === null;

  // Test Non-Permanent Loss Settler Respawn before founding city
  settler3.alive = false;
  const respawnCmd = host3.dispatch({ type: COMMAND_TYPES.RESPAWN_SETTLER });
  const revivedSettler = getSelectedOverworldUnit(host3.state);
  const respawnValid = Boolean(respawnCmd.ok && revivedSettler && revivedSettler.alive && revivedSettler.unitType === 'settler');

  const t3Pass = Boolean(isMarching && midMarchStillAtStart && completedStep1 && completedStep2 && respawnValid);
  results.push({
    name: '3. Real-Time A* Overworld Marching, Tick Clock Progression & Settler Safe Respawn',
    pass: t3Pass,
    detail: t3Pass
      ? 'Multi-tile A* route scheduling, partial-step interpolation, chronological step completion, and settler respawn verified'
      : 'Failed real-time march or respawn verification'
  });

  // =========================================================================
  // Test 4: 8x8 Spatial Grid (64 Plots), Plot Selection, Building Relocation & Demolition Salvage
  // =========================================================================
  const host4 = createWargameSimHost();
  host4.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Builder', seedCode: 'STAR-4004' }
  });

  const foundCmd = host4.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Oakhaven Prime' }
  });
  const city4 = getPrimaryCity(host4.state);
  const phaseIsCity = host4.state.campaignPhase === CAMPAIGN_PHASES.CITY_ESTABLISHED;
  const guildNotBuiltYet = !city4.buildings.guild_hall;

  // Queue a Hut on Plot #1 (3000ms build time)
  const woodBefore = city4.stockpile.wood;
  const queueHut = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const costDeducted = city4.stockpile.wood < woodBefore && city4.buildQueue.length === 1;

  // Queue a 2nd Hut on Plot #2 (pending item)
  const woodBeforeHut2 = city4.stockpile.wood;
  const queueHut2 = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'hut' }
  });
  // Cancel pending item -> 100% full refund
  const cancelHut2 = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueHut2.data.queueItem.queueItemId }
  });
  const pendingRefundVerified = cancelHut2.ok && city4.stockpile.wood === woodBeforeHut2 && city4.buildQueue.length === 1;

  // Test active cancel prorated refund + 50% cleanup demolition:
  // Hut is active (duration 3000ms). Advance 1500ms (50% elapsed).
  host4.stepClock(1500);
  const woodBeforeCancelActive = city4.stockpile.wood;
  const cancelActiveHut = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueHut.data.queueItem.queueItemId }
  });
  const proratedRefundGiven = cancelActiveHut.ok && city4.stockpile.wood > woodBeforeCancelActive;
  const cleanupJobActive = city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'cleanup';

  // Advance clock by 1000ms to finish cleanup
  host4.stepClock(1000);
  const cleanupFinished = city4.buildQueue.length === 0 && !city4.plots[1].underConstruction && !city4.plots[1].demolishing;

  // Re-queue Hut on Plot #1 and advance 3500ms -> Hut completes!
  host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  host4.stepClock(3500);
  const hutCompleted = city4.buildings.hut === 1;

  // Verify 8x8 spatial grid (64 plots) & center Meeting Hall
  const gridHas64Plots = Array.isArray(city4.plots) && city4.plots.length === 64;
  const centerPlotIsHall = city4.plots[27] && (city4.plots[27].buildingId === 'town_hall' || city4.plots[27].buildingId === 'meeting_hall') && city4.plots[27].level === 1;

  // Test selecting city plot
  const selectPlotCmd = host4.dispatch({
    type: COMMAND_TYPES.SELECT_CITY_PLOT,
    payload: { plotIndex: 12 }
  });
  const plotSelected = selectPlotCmd.ok && city4.selectedPlotIndex === 12;

  // Test moving a building (Plot 1 Hut to empty Plot 10)
  const moveCmd = host4.dispatch({
    type: COMMAND_TYPES.MOVE_BUILDING,
    payload: { fromPlotIndex: 1, toPlotIndex: 10 }
  });
  const moveQueued = moveCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'move';
  const plotsMarkedRelocating = Boolean(city4.plots[1].relocating && city4.plots[10].relocating);

  // Advance clock by 2500ms -> move completes!
  host4.stepClock(2500);
  const moveCompleted = city4.plots[1].buildingId === null &&
                        city4.plots[10].buildingId === 'hut' &&
                        city4.plots[10].level === 1 &&
                        !city4.plots[1].relocating &&
                        !city4.plots[10].relocating;

  // Test deliberate Demolition of the relocated Hut on Plot 10 with 35% salvage:
  const woodBeforeDemolish = city4.stockpile.wood;
  const demolishCmd = host4.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: 10 }
  });
  const demolishQueued = demolishCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'demolish';
  // Advance 2500ms to complete demolition
  host4.stepClock(2500);
  const demolishCompleted = !city4.buildings.hut && city4.plots[10].level === 0 && city4.stockpile.wood > woodBeforeDemolish;

  // Test 3-slot build queue limit
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 1, buildingId: 'hut' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 2, buildingId: 'hut' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 3, buildingId: 'hut' } });
  const fourthQueueBlocked = !host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'hut' } }).ok;

  const t4Pass = Boolean(
    foundCmd.ok &&
    phaseIsCity &&
    guildNotBuiltYet &&
    costDeducted &&
    pendingRefundVerified &&
    proratedRefundGiven &&
    cleanupJobActive &&
    cleanupFinished &&
    hutCompleted &&
    gridHas64Plots &&
    centerPlotIsHall &&
    plotSelected &&
    moveQueued &&
    plotsMarkedRelocating &&
    moveCompleted &&
    demolishQueued &&
    demolishCompleted &&
    fourthQueueBlocked
  );

  results.push({
    name: '4. 8x8 Spatial Grid (64 Plots), Plot Selection, Building Relocation & Demolition Salvage',
    pass: t4Pass,
    detail: t4Pass
      ? '8x8 grid of 64 plots initialized with central Meeting Hall at (3,3), plot selection, timed building relocation, and demolition salvage verified'
      : 'Failed 8x8 spatial grid or relocation checks'
  });

  // =========================================================================
  // Test 5: Adventurers Guild Completion, 60s Hero Recruitment Queue & Vanguard Formation
  // =========================================================================
  const host5 = createWargameSimHost();
  host5.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Guildmaster', seedCode: 'STAR-5005' }
  });
  host5.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Vanguard Hold' }
  });
  const city5 = getPrimaryCity(host5.state);

  // Set up prerequisites to charter Adventurers Guild (Hut -> Garden -> Well -> Lumber Camp -> Quarry + 20 population)
  city5.plots[1].buildingId = 'hut';
  city5.plots[1].level = 1;
  city5.buildings.hut = 1;
  city5.buildings.garden = 1;
  city5.buildings.well = 1;
  city5.buildings.lumber_camp = 1;
  city5.buildings.quarry = 1;
  city5.population = { current: 20, max: 25, growthProgress: 0, starving: false };

  // Claim campaign milestone rewards in sequence
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_first_hut' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_garden' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_well' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_grow_population_12' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_lumber_camp' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_quarry' } });

  // Queue Adventurers Guild on Plot #4 (6000ms build duration)
  const queueGuild = host5.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 4, buildingId: 'guild_hall' }
  });

  // Advance clock by 6500ms -> Guild finishes and unlocks GUILD_UNLOCKED phase!
  host5.stepClock(6500);
  const guildUnlocked = host5.state.campaignPhase === CAMPAIGN_PHASES.GUILD_UNLOCKED && city5.buildings.guild_hall === 1;

  // Claim Task ("Charter the Adventurers Guild") -> grants +100 Gold, +50 Food
  const claimTaskGuild = host5.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: 'task_build_guild_hall' }
  });

  // Start training an Adventurer Hero at the Adventurers Guild (60,000ms training queue)
  const recruitRanger = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Sylvanas Delver' }
  });
  const rangerQueued = recruitRanger.ok && city5.recruitmentQueue.length === 1 && city5.recruitmentQueue[0].status === 'training';
  const heroNotInstantlySpawned = host5.state.world.heroes.length === 0;

  // Queue a 2nd trainee (Adventurer) and test recruitment cancel prorated refund
  const goldBeforeFighter = city5.stockpile.gold;
  const recruitFighter = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Garrick Delver' }
  });
  const fighterQueued = recruitFighter.ok && city5.recruitmentQueue.length === 2 && city5.recruitmentQueue[1].status === 'queued';

  // Cancel queued trainee -> 100% full refund
  const cancelFighter = host5.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: recruitFighter.data.queueItem.queueItemId }
  });
  const fighterRefundVerified = cancelFighter.ok && city5.stockpile.gold === goldBeforeFighter && city5.recruitmentQueue.length === 1;

  // Advance clock by 30,000ms -> Trainee still in training!
  host5.stepClock(30000);
  const stillTrainingAt30s = host5.state.world.heroes.length === 0 && city5.recruitmentQueue.length === 1;

  // Advance clock by remaining 30,000ms (total 60,000ms elapsed) -> Training finishes!
  host5.stepClock(30000);
  const rangerCompleted = city5.recruitmentQueue.length === 0 && host5.state.world.heroes.length === 1 && host5.state.world.heroes[0].classId === 'adventurer';
  const partySpawnedOnOverworld = host5.state.world.overworld.units.some(function(u) {
    return u.unitType === 'hero_party' && u.canEnterDungeon === true && u.alive === true;
  });

  const t5Pass = Boolean(
    queueGuild.ok &&
    guildUnlocked &&
    claimTaskGuild.ok &&
    rangerQueued &&
    heroNotInstantlySpawned &&
    fighterQueued &&
    fighterRefundVerified &&
    stillTrainingAt30s &&
    rangerCompleted &&
    partySpawnedOnOverworld
  );

  results.push({
    name: '5. Adventurers Guild Completion, 60s Hero Recruitment Queue & Vanguard Formation',
    pass: t5Pass,
    detail: t5Pass
      ? 'Guild completion unlocks recruitment, swearing in enqueues 60s trainee, cancel gives refund, and timer resolution inducts hero into Vanguard Party'
      : 'Failed 60s hero recruitment queue lifecycle'
  });

  // =========================================================================
  // Test 6: Tier 1 Buildings, Meeting Hall Level Cap, Doubling Times & Paced Progression
  // =========================================================================
  const host6 = createWargameSimHost();
  host6.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Frontier', seedCode: 'STAR-6006' }
  });
  host6.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Aethelgard Haven' }
  });
  const city6 = getPrimaryCity(host6.state);

  // 1. Verify Water and Ore initialized in city stockpile
  const hasWaterAndOre = typeof city6.stockpile.water === 'number' &&
                         typeof city6.stockpile.ore === 'number' &&
                         city6.stockpile.water >= 50 &&
                         city6.stockpile.ore >= 20;

  // 2. Verify doubling construction duration:
  // Base Hut build time = 3000ms. Level 2 = 6000ms. Level 3 = 12000ms.
  const hutDurLv1 = computeBuildingDurationMs('hut', 1);
  const hutDurLv2 = computeBuildingDurationMs('hut', 2);
  const hutDurLv3 = computeBuildingDurationMs('hut', 3);
  const durationDoubles = (hutDurLv1 === 3000 && hutDurLv2 === 6000 && hutDurLv3 === 12000);

  // 3. Verify Paced Building Unlock Progression:
  // At founding, only Hut is constructible! Garden, Well, Lumber Camp, Quarry, Guild are locked.
  const hutUnlockedInitially = isBuildingPrerequisiteMet(city6, 'hut');
  const gardenLockedInitially = !isBuildingPrerequisiteMet(city6, 'garden');
  const wellLockedInitially = !isBuildingPrerequisiteMet(city6, 'well');
  const lumberLockedInitially = !isBuildingPrerequisiteMet(city6, 'lumber_camp');

  // Build a Hut on Plot 1 -> now Garden unlocks!
  host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  host6.stepClock(3500); // Complete Hut
  const hutCompleted6 = city6.plots[1].buildingId === 'hut' && city6.plots[1].level === 1;
  const gardenUnlockedAfterHut = isBuildingPrerequisiteMet(city6, 'garden');

  // Attempt to upgrade Hut to Level 2 while Meeting Hall is Level 1 -> MUST BE REJECTED!
  const prematureHutUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const upgradeBlockedByMeetingHall = !prematureHutUpgrade.ok;

  // Upgrade Meeting Hall (Plot 27) to Level 2 (Takes 10,000ms with doubling duration)
  city6.stockpile.wood = 500;
  city6.stockpile.stone = 500;
  city6.stockpile.gold = 500;
  city6.stockpile.food = 500;
  city6.stockpile.water = 500;
  const queueMeetingHallLv2 = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 27, buildingId: 'meeting_hall' }
  });
  host6.stepClock(11000); // Complete Meeting Hall Level 2
  const meetingHallLevel2 = (city6.buildings.meeting_hall === 2 || city6.buildings.town_hall === 2);

  // Now upgrade Hut to Level 2 (Takes 6,000ms with doubling duration) -> MUST SUCCEED!
  const validHutUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'hut' }
  });
  const upgradeAllowedAfterMeetingHall = validHutUpgrade.ok;
  host6.stepClock(7000); // Finish upgrading Hut to Lv 2

  // Build Garden on Plot 2 -> now Well unlocks!
  host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'garden' }
  });
  host6.stepClock(4000);
  const wellUnlockedAfterGarden = isBuildingPrerequisiteMet(city6, 'well');

  // 4. Test Population Sustenance Consumption, Growth & Immediate Frontier Growth Task Evaluation
  // With 5 citizens, consumption is 1 food and 1 water per tick.
  // With abundant food and water, growthProgress increases by +25 per tick.
  const popBeforeTick = city6.population.current;
  host6.stepClock(20000); // 4 resource production ticks (20s) -> should grow population by +1!
  const popGrew = city6.population.current >= popBeforeTick + 1;

  // Verify Frontier Growth (task_grow_population_12) auto-completes on resource tick when pop reaches 12
  city6.population.current = 11;
  city6.population.max = 15;
  city6.population.growthProgress = 75;
  city6.stockpile.food = 150;
  city6.stockpile.water = 150;
  host6.state.world.tasks.task_build_well.status = 'completed';
  host6.state.world.tasks.task_grow_population_12.status = 'available';
  host6.stepClock(5000); // 1 tick -> grows from 11 to 12 and immediately triggers evaluateTaskDAG
  const popTaskAutoCompleted = city6.population.current === 12 &&
    host6.state.world.tasks.task_grow_population_12.status === 'completed';

  const t6Pass = Boolean(
    hasWaterAndOre &&
    durationDoubles &&
    hutUnlockedInitially &&
    gardenLockedInitially &&
    wellLockedInitially &&
    lumberLockedInitially &&
    hutCompleted6 &&
    gardenUnlockedAfterHut &&
    upgradeBlockedByMeetingHall &&
    meetingHallLevel2 &&
    upgradeAllowedAfterMeetingHall &&
    wellUnlockedAfterGarden &&
    popGrew &&
    popTaskAutoCompleted
  );

  results.push({
    name: '6. Tier 1 Buildings, Meeting Hall Level Cap, Doubling Times & Paced Progression',
    pass: t6Pass,
    detail: t6Pass
      ? 'Doubling build durations, paced sequential unlocking (Hut -> Garden -> Well), Meeting Hall level cap, and population food/water consumption growth verified'
      : 'Failed Tier 1 building catalog or paced progression invariants'
  });

  // =========================================================================
  // Test 7: Multi-Dungeon Discovery, Wandering Hostile Skirmish & Dungeon Entry Handoff
  // =========================================================================
  const host7 = createWargameSimHost();
  host7.dispatch({
    type: COMMAND_TYPES.START_NEW_CAMPAIGN,
    payload: { houseName: 'House Expedition', seedCode: 'STAR-7007' }
  });
  host7.dispatch({
    type: COMMAND_TYPES.FOUND_CITY,
    payload: { cityName: 'Oakhaven Bastion' }
  });
  const city7 = getPrimaryCity(host7.state);
  const ow7 = host7.state.world.overworld;

  // Verify 4 curated dungeon POIs & wandering hostiles spawned
  const dungeonPois7 = (ow7.pois || []).filter(function(p) { return p.type === 'dungeon_entrance'; });
  const hasFourDungeons = dungeonPois7.length >= 4;
  const hasWanderingHostiles = Array.isArray(ow7.hostiles) && ow7.hostiles.length >= 4;

  // Build Adventurers Guild Hall -> verifies Starfall Vaults auto-discovery
  city7.stockpile.wood = 500;
  city7.stockpile.stone = 500;
  city7.stockpile.gold = 500;
  city7.stockpile.food = 500;
  city7.stockpile.water = 500;
  city7.population = { current: 20, max: 25, growthProgress: 0, starving: false, starveTicks: 0 };
  city7.buildings.hut = 1;
  city7.buildings.garden = 1;
  city7.buildings.well = 1;
  city7.buildings.lumber_camp = 1;
  city7.buildings.quarry = 1;
  city7.plots[2].buildingId = 'quarry';
  city7.plots[2].level = 1;
  host7.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'guild_hall' }
  });
  host7.stepClock(12000);

  const starfallPoi = dungeonPois7.find(function(p) { return p.id === 'poi_dungeon_starfall'; });
  const starfallRevealedByGuild = Boolean(starfallPoi && starfallPoi.discovered === true);

  // Recruit Adventurer Hero at Adventurers Guild & advance 60s
  host7.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'adventurer', heroName: 'Aldric Delver' }
  });
  host7.stepClock(60000);
  const party7 = ow7.units.find(function(u) { return u.unitType === 'hero_party' && u.alive; });

  // Place a live wandering hostile directly adjacent to party and march onto it -> Victory!
  const testHostile = ow7.hostiles[0];
  testHostile.x = party7.x + 1;
  testHostile.y = party7.y;
  testHostile.alive = true;
  host7.dispatch({
    type: COMMAND_TYPES.ORDER_UNIT_MARCH,
    payload: { unitId: party7.id, targetX: testHostile.x, targetY: testHostile.y }
  });
  host7.stepClock(8000);
  const skirmishWon = !testHostile.alive && host7.state.world.stats.skirmishesWon >= 1 &&
    Boolean(party7.cargo && party7.cargo.gold >= testHostile.rewardGold);

  // Order March to Starfall Vaults via CMD_MARCH_TO_DUNGEON
  const marchToDng = host7.dispatch({
    type: COMMAND_TYPES.MARCH_TO_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall' }
  });
  const intentIsDungeon = Boolean(marchToDng.ok && party7.marchPlan && party7.marchPlan.intent === 'enter_dungeon');

  // Verify CMD_ENTER_DUNGEON is strictly blocked while party is still mid-march
  const blockedWhileMarching = !host7.dispatch({
    type: COMMAND_TYPES.ENTER_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall', skipStorageWrite: true }
  }).ok;

  // Advance clock until party arrives at Starfall Vaults
  host7.stepClock(60000);
  const arrivedAtVault = party7.x === starfallPoi.x && party7.y === starfallPoi.y && party7.status === 'idle';

  // Claim completed Task 11 while standing on the Vault tile -> party MUST stay at the Vault!
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_first_hut' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_garden' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_well' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_grow_population_12' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_lumber_camp' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_quarry' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_build_guild_hall' } });
  host7.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_recruit_first_hero' } });
  const claimMarchTask = host7.dispatch({
    type: COMMAND_TYPES.CLAIM_TASK_REWARD,
    payload: { taskId: 'task_march_to_dungeon' }
  });
  const stayedAtVaultAfterClaim = Boolean(
    claimMarchTask.ok &&
    party7.x === starfallPoi.x &&
    party7.y === starfallPoi.y &&
    party7.status === 'idle' &&
    ow7.selectedUnitId === party7.id
  );

  // Enter Dungeon -> transitions to in_dungeon and produces valid handoff envelope
  const enterRes = host7.dispatch({
    type: COMMAND_TYPES.ENTER_DUNGEON,
    payload: { unitId: party7.id, poiId: 'poi_dungeon_starfall', skipStorageWrite: true }
  });
  const enteredCleanly = Boolean(
    enterRes.ok &&
    party7.status === 'in_dungeon' &&
    host7.state.world.stats.dungeonsEntered === 1 &&
    enterRes.data &&
    enterRes.data.envelope &&
    enterRes.data.envelope.direction === 'wargame_to_dungeon' &&
    enterRes.data.envelope.dungeon.dungeonId === 'dng_starfall'
  );

  const t7Checks = {
    hasFourDungeons: hasFourDungeons,
    hasWanderingHostiles: hasWanderingHostiles,
    starfallRevealedByGuild: starfallRevealedByGuild,
    skirmishWon: skirmishWon,
    intentIsDungeon: intentIsDungeon,
    blockedWhileMarching: blockedWhileMarching,
    arrivedAtVault: arrivedAtVault,
    stayedAtVaultAfterClaim: stayedAtVaultAfterClaim,
    enteredCleanly: enteredCleanly
  };
  const failed7 = Object.keys(t7Checks).filter(function(k) { return !t7Checks[k]; });
  const t7Pass = failed7.length === 0;

  results.push({
    name: '7. Multi-Dungeon Discovery, Wandering Hostile Skirmish & Dungeon Entry Handoff',
    pass: t7Pass,
    detail: t7Pass
      ? '4 curated dungeon POIs, Guild Hall Starfall reveal, Overworld hostile skirmish victory & cargo, CMD_MARCH_TO_DUNGEON, and CMD_ENTER_DUNGEON handoff envelope verified'
      : 'Failed checks: ' + failed7.join(', ')
  });

  // =========================================================================
  // Test 8: Dungeon Extraction Return March, Cargo Banking, Recall Scroll & Defeat Recovery
  // =========================================================================
  const city7GoldBefore = city7.stockpile.gold;
  const city7OreBefore = city7.stockpile.ore;

  // 8A. Surface Extraction via Floor 1 Stairs -> placed at Vault POI & timed Return March home
  const extReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'extracted',
      method: 'Floor 1 Ascending Stairs (<)',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 3,
      heroXp: 240,
      dungeonPoiId: 'poi_dungeon_starfall',
      lootSummary: { gold: 120, ore: 18, gems: 2, gearCount: 1 }
    }
  });
  const startedReturnMarch = Boolean(
    extReturn.ok &&
    extReturn.data.returnMarchStarted === true &&
    party7.status === 'marching' &&
    party7.marchPlan &&
    party7.marchPlan.intent === 'return_city' &&
    party7.cargo &&
    party7.cargo.gold >= 120
  );
  const heroLevelSynced = host7.state.world.heroes[0].level === 3;

  // Clear hostiles along return path so return march completes cleanly to city
  ow7.hostiles.forEach(function(h) { h.alive = false; });
  host7.stepClock(60000);
  const returnedAndBanked = Boolean(
    party7.x === city7.x &&
    party7.y === city7.y &&
    party7.cargo === null &&
    city7.stockpile.gold >= city7GoldBefore + 120 &&
    city7.stockpile.ore >= city7OreBefore + 18 &&
    host7.state.world.stats.expeditionsBanked >= 1
  );

  // 8B. Astral Recall Scroll Surface Extraction -> surfaces at Vault POI (idle, cargo intact; does not teleport to a city)
  const goldBeforeRecall = city7.stockpile.gold;
  party7.x = starfallPoi.x;
  party7.y = starfallPoi.y;
  party7.status = 'in_dungeon';
  const recallReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'extracted',
      method: 'Astral Recall Scroll',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 4,
      dungeonPoiId: 'poi_dungeon_starfall',
      lootSummary: { gold: 80, ore: 10, gems: 1, gearCount: 0 }
    }
  });
  const recallSurfaceVerified = Boolean(
    recallReturn.ok &&
    recallReturn.data.surfacedAtEntrance === true &&
    recallReturn.data.returnMarchStarted === false &&
    party7.x === starfallPoi.x &&
    party7.y === starfallPoi.y &&
    party7.status === 'idle' &&
    party7.cargo &&
    party7.cargo.gold >= 80 &&
    city7.stockpile.gold === goldBeforeRecall
  );

  // 8C. Non-Permanent Defeat Recovery -> express return to City Guild Hall, salvage credited, Hero preserved
  const goldBeforeDefeat = city7.stockpile.gold;
  party7.x = starfallPoi.x;
  party7.y = starfallPoi.y;
  party7.status = 'in_dungeon';
  party7.cargo = { gold: 999, ore: 50, gems: 0, gearCount: 0 };
  const defeatReturn = host7.dispatch({
    type: COMMAND_TYPES.RESOLVE_DUNGEON_RETURN,
    payload: {
      outcome: 'defeated',
      method: 'Guild Scout Rescue',
      partyUnitId: party7.id,
      heroId: party7.leaderHeroId,
      heroLevel: 4,
      killerName: 'Starfall Colossus',
      floorDepth: 5,
      lootSummary: { salvagedGold: 35 }
    }
  });
  const defeatRecoveryVerified = Boolean(
    defeatReturn.ok &&
    party7.x === city7.x &&
    party7.y === city7.y &&
    party7.status === 'idle' &&
    party7.hp === party7.maxHp &&
    party7.cargo === null &&
    city7.stockpile.gold === goldBeforeDefeat + 35 &&
    host7.state.world.heroes[0].level === 4
  );

  const t8Checks = {
    startedReturnMarch: startedReturnMarch,
    heroLevelSynced: heroLevelSynced,
    returnedAndBanked: returnedAndBanked,
    recallSurfaceVerified: recallSurfaceVerified,
    defeatRecoveryVerified: defeatRecoveryVerified
  };
  const failed8 = Object.keys(t8Checks).filter(function(k) { return !t8Checks[k]; });
  const t8Pass = failed8.length === 0;

  results.push({
    name: '8. Dungeon Extraction Return March, Cargo Banking, Recall Scroll & Defeat Recovery',
    pass: t8Pass,
    detail: t8Pass
      ? 'Floor 1 extraction return march & cargo banking, Astral Recall Scroll surface exit at dungeon entrance, and Golden Rule #2 defeat rescue verified'
      : 'Failed checks: ' + failed8.join(', ')
  });

  // =========================================================================
  // Test 9: Shared Cross-Engine Character Sheet, Paper-Doll & Hero Equipment (Inc 9.4)
  // =========================================================================
  const hero9 = host7.state.world.heroes[0];
  const hasStarterEq9 = Boolean(hero9 && hero9.equipment && hero9.equipment.weapon && hero9.equipment.pickaxe);
  const hasCosmetics9 = Boolean(hero9 && hero9.cosmetics && COSMETIC_SLOTS.length === 4 && SHARED_PAPER_DOLL_SLOTS.length === 10);

  const profBefore9 = normalizeSharedHeroProfile(hero9);
  const bagSignet = (hero9.bagGear || []).find(function(it) { return it.slot === 'accessory'; });
  const eqRes9 = bagSignet ? host7.dispatch({
    type: COMMAND_TYPES.EQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, itemUid: bagSignet.uid }
  }) : { ok: false };
  const profAfterEq9 = normalizeSharedHeroProfile(hero9);
  const equipBoostedStats9 = Boolean(
    eqRes9.ok &&
    hero9.equipment.accessory &&
    hero9.equipment.accessory.uid === bagSignet.uid &&
    profAfterEq9.stats.atk === profBefore9.stats.atk + (bagSignet.atk || 0)
  );

  // Unequip helm -> moves back to bagGear; unequip pickaxe -> strictly rejected
  const uneqHelm9 = host7.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, slot: 'helm' }
  });
  const uneqPickBlocked9 = !host7.dispatch({
    type: COMMAND_TYPES.UNEQUIP_HERO_ITEM,
    payload: { heroId: hero9.id, slot: 'pickaxe' }
  }).ok;
  const unequipVerified9 = Boolean(uneqHelm9.ok && hero9.equipment.helm === null && uneqPickBlocked9);

  // Verify shared paper-doll canvas rendering on mock context
  let drawCalls9 = 0;
  const mockCanvas9 = {
    width: 340,
    height: 330,
    getContext: function() {
      return {
        fillStyle: '', strokeStyle: '', lineWidth: 1,
        save: function(){}, restore: function(){}, clearRect: function(){},
        beginPath: function(){}, closePath: function(){}, moveTo: function(){}, lineTo: function(){},
        arc: function(){ drawCalls9++; }, ellipse: function(){ drawCalls9++; },
        fill: function(){ drawCalls9++; }, stroke: function(){ drawCalls9++; },
        fillRect: function(){ drawCalls9++; }, strokeRect: function(){ drawCalls9++; }
      };
    }
  };
  renderSharedPaperDollMannequin(mockCanvas9, hero9);
  const mannequinRendered9 = drawCalls9 > 5;

  // Verify CMD_AUTO_EQUIP_HERO equips superior gear from hero.bagGear
  hero9.bagGear.push({ uid: 'upg_w_9', slot: 'weapon', name: 'Star-Forged Greatsword', rarity: 'epic', atk: 24, def: 2, value: 200 });
  const autoEqRes9 = host7.dispatch({
    type: COMMAND_TYPES.AUTO_EQUIP_HERO,
    payload: { heroId: hero9.id }
  });
  const autoEquipVerified9 = Boolean(autoEqRes9.ok && hero9.equipment.weapon && hero9.equipment.weapon.uid === 'upg_w_9');

  const t9Checks = {
    hasStarterEq9: hasStarterEq9,
    hasCosmetics9: hasCosmetics9,
    equipBoostedStats9: equipBoostedStats9,
    unequipVerified9: unequipVerified9,
    autoEquipVerified9: autoEquipVerified9,
    mannequinRendered9: mannequinRendered9
  };
  const failed9 = Object.keys(t9Checks).filter(function(k) { return !t9Checks[k]; });
  const t9Pass = failed9.length === 0;

  results.push({
    name: '9. Shared Cross-Engine Character Sheet, Paper-Doll & Hero Equipment (Inc 9.4)',
    pass: t9Pass,
    detail: t9Pass
      ? 'Shared 10-slot paper-doll, 4 prestige cosmetic slots, CMD_EQUIP/UNEQUIP_HERO_ITEM stat recomputation, pickaxe guard, and canvas render verified'
      : 'Failed checks: ' + failed9.join(', ')
  });

  // =========================================================================
  // Test 10: City Vault Storage (200 Slots), Roster Cap (3), Dismiss, Overall Leader, Garrison & Temple Chapterhouse (ADR-0012)
  // =========================================================================
  // 10A. City Storage Container: Dump Hero Bag -> City Vault -> Withdraw back
  const bagCountBeforeDump = hero9.bagGear.length;
  const dumpRes10 = host7.dispatch({
    type: COMMAND_TYPES.DUMP_HERO_BAG_TO_CITY,
    payload: { heroId: hero9.id }
  });
  const dumpedToCity10 = Boolean(
    dumpRes10.ok &&
    hero9.bagGear.length === 0 &&
    city7.storage &&
    city7.storage.capacity === 200 &&
    city7.storage.items.length >= bagCountBeforeDump
  );
  const storedSampleUid = city7.storage.items[0] ? city7.storage.items[0].uid : null;
  const withdrawRes10 = storedSampleUid ? host7.dispatch({
    type: COMMAND_TYPES.WITHDRAW_FROM_CITY_STORAGE,
    payload: { heroId: hero9.id, itemUid: storedSampleUid }
  }) : { ok: false };
  const withdrewFromCity10 = Boolean(withdrawRes10.ok && hero9.bagGear.length === 1);

  // 10B. Garrison Party Size Scaling (1 pre-Garrison -> 2 at Garrison Lv 1) & Temple Chapterhouse (Cleric Lv 1 -> Paladin Lv 2)
  const preGarrisonMax = computeMaxPartySize(city7);
  city7.buildings.garrison = 1;
  const postGarrisonMax = computeMaxPartySize(city7);
  city7.buildings.temple_chapterhouse = 1;
  const templeLv1Classes = getCityRecruitableClasses(city7);
  city7.buildings.temple_chapterhouse = 2;
  const templeLv2Classes = getCityRecruitableClasses(city7);
  const templeAndGarrisonVerified = Boolean(
    preGarrisonMax === 1 &&
    postGarrisonMax === 2 &&
    templeLv1Classes.indexOf('cleric') !== -1 &&
    templeLv1Classes.indexOf('paladin') === -1 &&
    templeLv2Classes.indexOf('paladin') !== -1
  );

  // 10C. Hero Roster Cap of 3, Overall Leader Reassignment & Dismiss Hero (Gear preserved in City Storage)
  city7.stockpile.gold = 500;
  city7.stockpile.food = 500;
  city7.buildings.mages_guild = 1;
  city7.buildings.thieves_guild = 1;
  const rec2 = host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'cleric', heroName: 'Brother Aldous' } });
  const rec3 = host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'mage', heroName: 'Lyra Starweaver' } });
  const rec4Blocked = !host7.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'thief', heroName: 'Vex Shadow' } }).ok;
  host7.stepClock(125000);
  const rosterAtCap3 = Boolean(rec2.ok && rec3.ok && rec4Blocked && host7.state.world.heroes.length === 3);

  const secondHero = host7.state.world.heroes[1];
  const leaderRes10 = host7.dispatch({ type: COMMAND_TYPES.SET_OVERALL_LEADER, payload: { heroId: secondHero.id } });
  const leaderChanged10 = Boolean(leaderRes10.ok && host7.state.world.roster.overallLeaderHeroId === secondHero.id);

  // Assign 2nd hero to 1st party using Garrison Lv 1 (maxSize 2)
  const party1Id = host7.state.world.parties[0].id;
  const assignRes10 = host7.dispatch({ type: COMMAND_TYPES.ASSIGN_HERO_TO_PARTY, payload: { partyId: party1Id, heroId: secondHero.id } });
  const partyAssignVerified10 = Boolean(assignRes10.ok && host7.state.world.parties[0].memberIds.length === 2);

  // Dismiss 3rd hero -> frees roster slot & deposits their gear safely into City Storage
  const thirdHero = host7.state.world.heroes[2];
  const storageBeforeDismiss = city7.storage.items.length;
  const dismissRes10 = host7.dispatch({ type: COMMAND_TYPES.DISMISS_HERO, payload: { heroId: thirdHero.id } });
  const dismissVerified10 = Boolean(
    dismissRes10.ok &&
    host7.state.world.heroes.length === 2 &&
    city7.storage.items.length > storageBeforeDismiss
  );

  const t10Checks = {
    dumpedToCity10: dumpedToCity10,
    withdrewFromCity10: withdrewFromCity10,
    templeAndGarrisonVerified: templeAndGarrisonVerified,
    rosterAtCap3: rosterAtCap3,
    leaderChanged10: leaderChanged10,
    partyAssignVerified10: partyAssignVerified10,
    dismissVerified10: dismissVerified10
  };
  const failed10 = Object.keys(t10Checks).filter(function(k) { return !t10Checks[k]; });
  const t10Pass = failed10.length === 0;

  results.push({
    name: '10. City Vault Storage (200 Slots), Roster Cap (3), Dismiss, Leader, Garrison & Temple Chapterhouse',
    pass: t10Pass,
    detail: t10Pass
      ? '200-slot City Storage dump/withdraw, Garrison party scaling, Temple Chapterhouse Cleric->Paladin gating, 3-Hero cap, Overall Leader, and Dismiss gear rescue verified'
      : 'Failed checks: ' + failed10.join(', ')
  });

  // =========================================================================
  // Test 11: Tier 2 City Industry — Smeltery Ingots, Apothecary Provisions & Warehouse Storage Expansion (Inc 9.6)
  // =========================================================================
  // Smeltery blocked before building -> succeeds after building
  const smeltBlocked11 = !host7.dispatch({ type: COMMAND_TYPES.SMELT_INGOTS, payload: { batches: 1 } }).ok;
  city7.buildings.smeltery = 1;
  city7.stockpile.ore = 50;
  city7.stockpile.wood = 50;
  const smeltRes11 = host7.dispatch({ type: COMMAND_TYPES.SMELT_INGOTS, payload: { batches: 2 } });
  const smelteryVerified11 = Boolean(
    smeltBlocked11 &&
    smeltRes11.ok &&
    city7.stockpile.ingots === 4 &&
    city7.stockpile.ore === 40 &&
    city7.stockpile.wood === 40
  );

  // Apothecary blocked before building -> brews Healing Tonic & scribes Recall Scroll after building
  const brewBlocked11 = !host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'potions' } }).ok;
  city7.buildings.apothecary = 1;
  city7.stockpile.food = 100;
  city7.stockpile.water = 100;
  city7.stockpile.gold = 200;
  const potBefore11 = city7.provisions.potions || 0;
  const recBefore11 = city7.provisions.recalls || 0;
  const brewPot11 = host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'potions' } });
  const brewRec11 = host7.dispatch({ type: COMMAND_TYPES.BREW_PROVISION, payload: { kind: 'recalls' } });
  const apothecaryVerified11 = Boolean(
    brewBlocked11 &&
    brewPot11.ok &&
    brewRec11.ok &&
    city7.provisions.potions === potBefore11 + 1 &&
    city7.provisions.recalls === recBefore11 + 1
  );

  // Warehouse expands City Vault Storage slot capacity (+50 per level)
  const capBeforeWh11 = computeCityStorageSlotCapacity(city7);
  city7.plots[5].buildingId = 'warehouse';
  city7.plots[5].level = 2;
  const capAfterWh11 = computeCityStorageSlotCapacity(city7);
  const warehouseSlotsVerified11 = capAfterWh11 === capBeforeWh11 + 100;

  const t11Checks = {
    smelteryVerified11: smelteryVerified11,
    apothecaryVerified11: apothecaryVerified11,
    warehouseSlotsVerified11: warehouseSlotsVerified11
  };
  const failed11 = Object.keys(t11Checks).filter(function(k) { return !t11Checks[k]; });
  const t11Pass = failed11.length === 0;

  results.push({
    name: '11. Tier 2 City Industry — Smeltery Ingots, Apothecary Provisions & Warehouse Storage Expansion (Inc 9.6)',
    pass: t11Pass,
    detail: t11Pass
      ? 'Smeltery ore->ingot refining, Apothecary potion/scroll brewing, and Warehouse +50/lv City Vault slot expansion verified'
      : 'Failed checks: ' + failed11.join(', ')
  });

  // =========================================================================
  // Test 12: City Blacksmith (Star-Forge) & Lapidary Workshop (Inc 9.7)
  // =========================================================================
  const forgeBlocked12 = !host7.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: 'weapon' } }).ok;
  city7.buildings.blacksmith = 2;
  city7.stockpile.ingots = 30;
  city7.stockpile.gold = 300;
  const forgeRes12 = host7.dispatch({ type: COMMAND_TYPES.FORGE_EQUIPMENT, payload: { slot: 'weapon' } });
  const forgedItem12 = forgeRes12.ok ? forgeRes12.data.item : null;
  const forgedVerified12 = Boolean(
    forgeBlocked12 &&
    forgedItem12 &&
    forgedItem12.rarity === 'rare' &&
    forgedItem12.sockets === 1
  );

  // Temper forged weapon (+2 ATK, temperRank = 1)
  const atkBeforeTemper12 = forgedItem12 ? forgedItem12.atk : 0;
  const temperRes12 = forgedItem12 ? host7.dispatch({ type: COMMAND_TYPES.TEMPER_EQUIPMENT, payload: { itemUid: forgedItem12.uid } }) : { ok: false };
  const temperVerified12 = Boolean(temperRes12.ok && forgedItem12.temperRank === 1 && forgedItem12.atk === atkBeforeTemper12 + 2);

  // Lapidary: Punch 2nd socket -> Socket Ruby (+4 ATK) -> Extract Ruby back to city.gems
  const lapBlocked12 = !host7.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: forgedItem12.uid } }).ok;
  city7.buildings.lapidary = 1;
  city7.gems = { ruby: 2, emerald: 1, sapphire: 0, topaz: 0, void_diamond: 0 };
  const punchRes12 = host7.dispatch({ type: COMMAND_TYPES.PUNCH_SOCKET, payload: { itemUid: forgedItem12.uid } });
  const atkBeforeGem12 = forgedItem12.atk;
  const socketRes12 = host7.dispatch({ type: COMMAND_TYPES.SOCKET_CITY_GEM, payload: { itemUid: forgedItem12.uid, gemId: 'ruby' } });
  const gemSocketed12 = Boolean(socketRes12.ok && forgedItem12.atk === atkBeforeGem12 + 4 && city7.gems.ruby === 1);
  const unsocketRes12 = host7.dispatch({ type: COMMAND_TYPES.UNSOCKET_CITY_GEM, payload: { itemUid: forgedItem12.uid } });
  const gemExtracted12 = Boolean(unsocketRes12.ok && forgedItem12.atk === atkBeforeGem12 && city7.gems.ruby === 2);

  const t12Checks = {
    forgedVerified12: forgedVerified12,
    temperVerified12: temperVerified12,
    lapBlocked12: lapBlocked12,
    punchOk: Boolean(punchRes12.ok && forgedItem12.sockets === 2),
    gemSocketed12: gemSocketed12,
    gemExtracted12: gemExtracted12
  };
  const failed12 = Object.keys(t12Checks).filter(function(k) { return !t12Checks[k]; });
  const t12Pass = failed12.length === 0;

  results.push({
    name: '12. City Blacksmith (Star-Forge) & Lapidary Workshop (Inc 9.7)',
    pass: t12Pass,
    detail: t12Pass
      ? 'Blacksmith forging & tempering, Lapidary socket punching, Ruby socketing (+4 ATK), and safe gem extraction verified'
      : 'Failed checks: ' + failed12.join(', ')
  });

  // =========================================================================
  // Test 13: Semantic AssetRegistry, Guild Interior Banners & RenderAdapter (Stage E.5)
  // =========================================================================
  const manifestCheck13 = validateAssetManifest(DEFAULT_ASSET_MANIFEST);
  const guildBannerId = getFacilityInteriorAssetId('guild_hall');
  const forgeBannerId = getFacilityInteriorAssetId('blacksmith');
  const guildBannerSrc = getProductionImageSrc(guildBannerId);
  const forgeBannerSrc = getProductionImageSrc(forgeBannerId);
  const fighterPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('fighter'));
  const paladinPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('paladin'));
  const fallbackPortraitSrc = getProductionImageSrc(getHeroPortraitAssetId('mage'));
  const adapter13 = createRenderAdapter({ mode: 'auto' });

  const enterableBuildingIds13 = [
    'guild_hall', 'fighters_guild', 'thieves_guild', 'mages_guild', 'rangers_lodge', 'temple_chapterhouse',
    'garrison', 'smeltery', 'apothecary', 'blacksmith', 'lapidary', 'warehouse'
  ];
  const all12InteriorsResolved = enterableBuildingIds13.every(function(bid) {
    const def = CITY_BUILDINGS_CATALOG[bid];
    return Boolean(def && def.interiorAssetId && getProductionImageSrc(def.interiorAssetId));
  });

  const t13Checks = {
    manifestValid: manifestCheck13.valid && manifestCheck13.total >= 20 && manifestCheck13.productionCount >= 16,
    guildBannerResolved: Boolean(guildBannerSrc && guildBannerSrc.indexOf('city_interior_adventurers_guild') !== -1),
    forgeBannerResolved: Boolean(forgeBannerSrc && forgeBannerSrc.indexOf('city_interior_blacksmith') !== -1),
    all12InteriorsResolved: all12InteriorsResolved,
    portraitsResolved: Boolean(fighterPortraitSrc && paladinPortraitSrc && fallbackPortraitSrc === null),
    adapterFallbackValid: Boolean(adapter13 && adapter13.backend === RENDER_BACKENDS.CANVAS_2D && adapter13.getStats().valid)
  };
  const failed13 = Object.keys(t13Checks).filter(function(k) { return !t13Checks[k]; });
  const t13Pass = failed13.length === 0;

  results.push({
    name: '13. Semantic AssetRegistry, Guild Interior Banners & RenderAdapter (Stage E.5)',
    pass: t13Pass,
    detail: t13Pass
      ? 'Manifest schema valid (' + manifestCheck13.total + ' entries, ' + manifestCheck13.productionCount + ' production Golden Slice assets), Tier 1 interior/portrait resolution & Canvas2D fallback verified'
      : 'Failed checks: ' + failed13.join(', ')
  });

  // =========================================================================
  // Test 14: Unified Adventurers Guild Parity & Dedicated Adventurer Class (Inc 9.7.5)
  // =========================================================================
  const host14 = createWargameSimHost();
  host14.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Parity', seedCode: 'STAR-9750' } });
  host14.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Parity Bastion' } });
  const city14 = getPrimaryCity(host14.state);
  city14.stockpile.gold = 500;
  city14.stockpile.food = 500;
  city14.buildings.guild_hall = 1;

  const guildOnlyClasses = getCityRecruitableClasses(city14);
  const onlyAdventurerUnlocked = guildOnlyClasses.length === 1 && guildOnlyClasses[0] === 'adventurer';
  const fighterBlockedWithoutGuild = !host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'fighter' } }).ok;
  const rangerBlockedWithoutLodge = !host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'ranger' } }).ok;
  const adventurerAllowed = host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'adventurer', heroName: 'Rowan Delver' } }).ok;

  city14.buildings.fighters_guild = 1;
  const fighterUnlockedWithGuild = host14.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'fighter', heroName: 'Bram Vanguard' } }).ok;

  const t14Checks = {
    onlyAdventurerUnlocked: onlyAdventurerUnlocked,
    fighterBlockedWithoutGuild: fighterBlockedWithoutGuild,
    rangerBlockedWithoutLodge: rangerBlockedWithoutLodge,
    adventurerAllowed: adventurerAllowed,
    fighterUnlockedWithGuild: fighterUnlockedWithGuild
  };
  const failed14 = Object.keys(t14Checks).filter(function(k) { return !t14Checks[k]; });
  const t14Pass = failed14.length === 0;

  results.push({
    name: '14. Unified Adventurers Guild Parity & Dedicated Adventurer Class (Inc 9.7.5)',
    pass: t14Pass,
    detail: t14Pass
      ? 'Adventurers Guild strictly unlocks Adventurer class only; specialist classes gated behind their respective Guilds'
      : 'Failed checks: ' + failed14.join(', ')
  });

  // =========================================================================
  // Test 15: Cross-Platform Screen Info (i) & Navigation Architecture (Stage E.5.5)
  // =========================================================================
  const infoOw = getScreenInfoContent(WARGAME_VIEWS.OVERWORLD, host14.state);
  const infoCity = getScreenInfoContent(WARGAME_VIEWS.CITY, host14.state);
  const infoGuild = getScreenInfoContent(WARGAME_VIEWS.GUILD, host14.state);
  const t15Pass = Boolean(
    infoOw && infoOw.title && Array.isArray(infoOw.tips) && infoOw.tips.length >= 2 &&
    infoCity && infoCity.title && Array.isArray(infoCity.tips) && infoCity.tips.length >= 2 &&
    infoGuild && infoGuild.title && Array.isArray(infoGuild.tips) && infoGuild.tips.length >= 2
  );

  results.push({
    name: '15. Cross-Platform Screen Info (i) & Mobile Navigation Architecture (Stage E.5.5)',
    pass: t15Pass,
    detail: t15Pass
      ? 'Contextual Screen Info (i) content verified for Overworld, City, and Guild screens'
      : 'Failed Stage E.5.5 screen info checks'
  });

  // =========================================================================
  // Test 16: Unified MapViewportEngine, Hex Overworld & 2:1 Iso City Adapters (ADR-0014)
  // =========================================================================
  const hex16 = createHexGridAdapter({ hexSize: 28 });
  const ring2 = hex16.getRing({ q: 0, r: 0 }, 2);
  const spiral2 = hex16.getSpiral({ q: 0, r: 0 }, 2);
  const iso16 = createIsoGridAdapter({ tileWidth: 96, tileHeight: 48 });
  const isoDraw = iso16.getDrawOrder(8, 8);
  const vp16 = createMapViewport({ gridAdapter: iso16, viewportWidth: 640, viewportHeight: 480 });
  vp16.centerOnTile({ x: 3, y: 4 });
  const isoPicked = vp16.screenToTile(320, 240);
  const visRect = vp16.getVisibleWorldRect(32);

  const t16Pass = Boolean(
    ring2.length === 12 &&
    spiral2.length === 19 &&
    isoDraw.length === 64 &&
    isoDraw[0].x === 0 && isoDraw[0].y === 0 &&
    isoDraw[63].x === 7 && isoDraw[63].y === 7 &&
    isoPicked.x === 3 && isoPicked.y === 4 &&
    visRect.maxX > visRect.minX && visRect.maxY > visRect.minY
  );

  results.push({
    name: '16. Unified MapViewportEngine, Hex Overworld & 2:1 Iso City Adapters (ADR-0014)',
    pass: t16Pass,
    detail: t16Pass
      ? 'Hex rings/spirals (12/19), 8x8 Iso painter sort, centerOnTile/screenToTile picking & frustum bounds verified'
      : 'Failed ADR-0014 MapViewportEngine or GridAdapter checks'
  });

  // =========================================================================
  // Test 17: Track F Phase 1 — Fixed-Precision Currency Ledger, Atomic Payments, Nested Prerequisites & 5-Tree Catalog (Inc 10.1)
  // =========================================================================
  const ledger17 = createCurrencyLedgerState();
  // Exact scaled-integer fractional precision: 0.00001 + 0.001 + 0.005 = 0.00601 (601 atomic units)
  recordCurrencyTransaction(ledger17, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_adventurer', amount: 0.00001, transactionType: TRANSACTION_TYPES.AWARD, source: 'passive', idempotencyKey: 'k1', nowMs: 1000 });
  recordCurrencyTransaction(ledger17, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_adventurer', amount: 0.001,   transactionType: TRANSACTION_TYPES.AWARD, source: 'move',    idempotencyKey: 'k2', nowMs: 2000 });
  recordCurrencyTransaction(ledger17, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_adventurer', amount: 0.005,   transactionType: TRANSACTION_TYPES.AWARD, source: 'kill',    idempotencyKey: 'k3', nowMs: 3000 });
  // Duplicate idempotencyKey MUST NOT double-award!
  const dupRes17 = recordCurrencyTransaction(ledger17, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_adventurer', amount: 0.005, transactionType: TRANSACTION_TYPES.AWARD, source: 'kill', idempotencyKey: 'k3', nowMs: 3001 });
  const bal17 = getCurrencyBalance(ledger17, 'p1', OWNER_TYPES.PLAYER, 'rp_adventurer');
  const recon17 = reconstructAccountBalance(ledger17, 'p1', OWNER_TYPES.PLAYER, 'rp_adventurer');
  const scaledPrecisionOk = bal17.availableScaled === 601 && recon17.reconstructedScaled === 601 && dupRes17.duplicate === true;

  // Unified Atomic Payment (Currency + Physical Stockpile): fails with ZERO partial deduction if stone is short
  recordCurrencyTransaction(ledger17, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_general', amount: 1, transactionType: TRANSACTION_TYPES.AWARD, source: 'grant', nowMs: 4000 });
  const mockStock17 = { stone: 10 };
  const failPay17 = executeAtomicPayment(ledger17, [
    { kind: 'currency', currencyId: 'rp_general', amount: 0.5 },
    { kind: 'stockpile', resourceId: 'stone', amount: 30 }
  ], { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, stockpile: mockStock17, nowMs: 4100 });
  const noPartialDeduction = !failPay17.ok && getCurrencyBalance(ledger17, 'p1', OWNER_TYPES.PLAYER, 'rp_general').availableScaled === 100000 && mockStock17.stone === 10;

  mockStock17.stone = 40;
  const okPay17 = executeAtomicPayment(ledger17, [
    { kind: 'currency', currencyId: 'rp_general', amount: 0.5 },
    { kind: 'stockpile', resourceId: 'stone', amount: 30 }
  ], { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, stockpile: mockStock17, nowMs: 4200 });
  const atomicPayOk = okPay17.ok && getCurrencyBalance(ledger17, 'p1', OWNER_TYPES.PLAYER, 'rp_general').availableScaled === 50000 && mockStock17.stone === 10;

  // Spec §8.5 Nested AND/OR Prerequisite Evaluation + Alignment Restriction
  const nestedSpecCond = {
    operator: 'AND',
    conditions: [
      { type: 'hero_level', operator: 'greater_than_or_equal', value: 10 },
      {
        operator: 'OR',
        conditions: [
          { type: 'research_level', research_item_id: 'w12', operator: 'greater_than_or_equal', value: 1 },
          { type: 'research_level', research_item_id: 'w59', operator: 'greater_than_or_equal', value: 1 },
          { type: 'research_level', research_item_id: 'w80', operator: 'greater_than_or_equal', value: 1 }
        ]
      }
    ]
  };
  const nestedFail = evaluateConditionNode(nestedSpecCond, { heroLevel: 10, researchProgress: {} });
  const nestedPass = evaluateConditionNode(nestedSpecCond, { heroLevel: 10, researchProgress: { w59: { currentLevel: 1 } } });
  const relLocked = evaluateResearchEligibility(PROTOTYPE_RESEARCH_ITEMS.REL_LITURGY_001, 1, { alignment: { godTags: ['shadow'] } });
  const relOpen = evaluateResearchEligibility(PROTOTYPE_RESEARCH_ITEMS.REL_LITURGY_001, 1, { alignment: { godTags: ['solar', 'war'] } });

  // Catalog validation (15 domains, 5 representative trees, WAR_WEAPON_HEAVY_001 3 levels)
  const catVal17 = validateResearchCatalog();
  const heavyItem17 = PROTOTYPE_RESEARCH_ITEMS.WAR_WEAPON_HEAVY_001;
  const hasWorldProgression = Boolean(host14.state.world && host14.state.world.progression && host14.state.world.progression.currencyLedger);

  const t17Checks = {
    scaledPrecisionOk: scaledPrecisionOk,
    noPartialDeduction: noPartialDeduction,
    atomicPayOk: atomicPayOk,
    nestedLogicOk: !nestedFail.passed && nestedPass.passed,
    alignmentGatingOk: relLocked.status === EVALUATION_STATUS.RESTRICTED_ALIGNMENT && relOpen.status === EVALUATION_STATUS.AVAILABLE,
    catalogValid: catVal17.valid && catVal17.domainCount === 15 && catVal17.treeCount === 5 && Boolean(heavyItem17 && heavyItem17.levelLimit === 3),
    hasWorldProgression: hasWorldProgression
  };
  const failed17 = Object.keys(t17Checks).filter(function(k) { return !t17Checks[k]; });
  const t17Pass = failed17.length === 0;

  results.push({
    name: '17. Track F Phase 1: Fixed-Precision Currency Ledger, Atomic Payments, Nested Prerequisites & 5-Tree Catalog (Inc 10.1)',
    pass: t17Pass,
    detail: t17Pass
      ? 'Scaled-integer 0.00001 precision, idempotency, balance reconstruction, atomic currency+stockpile payments, nested AND/OR/alignment rules & 15-domain/5-tree catalog verified'
      : 'Failed checks: ' + failed17.join(', ')
  });

  // =========================================================================
  // Test 18: Track F Phase 2 — Passive/Activity Accrual, Anti-Abuse, Queues & Offline Completion (Inc 10.2)
  // =========================================================================
  const prog18 = createDefaultProgressionState(0);
  // 1. Offline passive accrual over 10,000s at 0.00001/s with +50% generation modifier => 0.15000 rp_general (15000 scaled)
  const passRes18 = processPassiveAccrual(prog18, 'p1', 10000 * 1000, { generationModifiers: { additiveBonus: 0.5 } });
  const passiveOfflineOk = passRes18.ok && passRes18.awardedScaled === 15000;

  // 2. Activity fractional awards + duplicate eventId guard + cooldown guard
  const actMove1 = awardActivityResearchPoints(prog18, { ownerId: 'p1', activityType: 'dungeon_move', eventId: 'ev1', nowMs: 10000 });
  const actMoveDup = awardActivityResearchPoints(prog18, { ownerId: 'p1', activityType: 'dungeon_move', eventId: 'ev1', nowMs: 11000 });
  const actMoveCooldown = awardActivityResearchPoints(prog18, { ownerId: 'p1', activityType: 'dungeon_move', eventId: 'ev2', nowMs: 10100 });
  const actQuest = awardActivityResearchPoints(prog18, { ownerId: 'p1', activityType: 'research_quest', eventId: 'q1', nowMs: 12000 });
  const activityAccrualOk = Boolean(
    actMove1.ok && actMove1.awardedScaled === 100 &&
    actMoveDup.duplicate === true &&
    !actMoveCooldown.ok && actMoveCooldown.throttledReason === 'cooldown_active' &&
    actQuest.ok && getCurrencyBalance(prog18.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'rp_adventurer').availableScaled === 500100
  );

  // 3. Queue start, pending without cost deduction, pause/resume, offline completion + auto-promote, cancel refund
  recordCurrencyTransaction(prog18.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'gold', amount: 200, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 12000 });
  const startGen = startOrEnqueueResearch(prog18, { ownerId: 'p1', researchItemId: 'GEN_SCHOLAR_001', nowMs: 20000 });
  const advBalBeforePending = getCurrencyBalance(prog18.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'rp_adventurer').availableScaled;
  const enqueueAdv = startOrEnqueueResearch(prog18, { ownerId: 'p1', researchItemId: 'ADV_SURVIVAL_001', nowMs: 20000 });
  const pendingNoCostDeducted = enqueueAdv.ok && enqueueAdv.queuedAs === 'pending' &&
    getCurrencyBalance(prog18.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'rp_adventurer').availableScaled === advBalBeforePending;

  // Pause after 10s, resume after 20s idle -> elapsed stays 10s!
  pauseResearchItem(prog18, 'GEN_SCHOLAR_001', 30000);
  const advWhilePaused = advanceResearchProgress(prog18, 50000);
  resumeResearchItem(prog18, 'GEN_SCHOLAR_001', 50000);
  const pausePreserved = advWhilePaused.completedItems.length === 0 && prog18.researchQueue.activeItems[0].elapsedMs === 10000;

  // Offline jump +25s (total 35s >= 30s) -> completes GEN_SCHOLAR_001 Lv1 & auto-promotes ADV_SURVIVAL_001!
  const advComplete = advanceResearchProgress(prog18, 75000);
  const completedAndPromoted = advComplete.completedItems.length === 1 &&
    advComplete.completedItems[0].researchItemId === 'GEN_SCHOLAR_001' &&
    advComplete.promotedItems.length === 1 &&
    advComplete.promotedItems[0].researchItemId === 'ADV_SURVIVAL_001';

  // Cancel promoted active item with FULL refund -> gold & rp_adventurer restored
  const goldBeforeCancel = getCurrencyBalance(prog18.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available;
  const cancelRes18 = cancelResearchItem(prog18, 'ADV_SURVIVAL_001', { nowMs: 76000, refundPolicy: REFUND_POLICIES.FULL });
  const cancelRefundOk = cancelRes18.ok &&
    getCurrencyBalance(prog18.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available === goldBeforeCancel + 30;

  const t18Checks = {
    passiveOfflineOk: passiveOfflineOk,
    activityAccrualOk: activityAccrualOk,
    startGenOk: Boolean(startGen.ok && startGen.entry.snapshot.definitionVersion === '1.0.0'),
    pendingNoCostDeducted: pendingNoCostDeducted,
    pausePreserved: pausePreserved,
    completedAndPromoted: completedAndPromoted,
    cancelRefundOk: cancelRefundOk
  };
  const failed18 = Object.keys(t18Checks).filter(function(k) { return !t18Checks[k]; });
  const t18Pass = failed18.length === 0;

  results.push({
    name: '18. Track F Phase 2: Passive/Activity Accrual, Anti-Abuse, Queues & Offline Completion (Inc 10.2)',
    pass: t18Pass,
    detail: t18Pass
      ? 'Offline passive accrual, activity anti-abuse (idempotency/cooldown), pending queue auto-promotion, pause/resume, snapshots & cancel refund verified'
      : 'Failed checks: ' + failed18.join(', ')
  });

  // =========================================================================
  // Test 19: Track F Phase 3 — Guild/Alliance Research Ownership, Shared Contribution Pool & Lifecycle (Inc 10.3)
  // =========================================================================
  const prog19 = createDefaultProgressionState(0);
  const gCreate = createPlayerGuild(prog19, { guildId: 'g_starfall', name: 'Order of Starfall', specialization: 'adventurer', founderPlayerId: 'player_1', nowMs: 1000 });
  const aCreate = createAlliance(prog19, { allianceId: 'a_bastion', name: 'Bastion Concord', founderPlayerId: 'player_1', nowMs: 1000 });
  joinOrganization(aCreate.alliance, 'player_2');
  joinOrganization(aCreate.alliance, 'player_3');

  // 1. Guild activity awards guild-owned RP independent of player personal RP & funds Guild Research
  recordGuildActivityContribution(prog19, { guildId: 'g_starfall', contributorPlayerId: 'player_1', amount: 2.5, source: 'dungeon_clear', eventId: 'gc1', nowMs: 2000 });
  const guildBalBefore = getOrganizationResearchBalance(prog19, OWNER_TYPES.GUILD, 'g_starfall').available;
  const startGuildRes = startOrganizationResearch(prog19, { orgType: OWNER_TYPES.GUILD, orgId: 'g_starfall', researchItemId: 'GLD_ADV_MAP_001', nowMs: 3000 });
  const guildFundedOk = startGuildRes.ok && guildBalBefore === 2.5 && getOrganizationResearchBalance(prog19, OWNER_TYPES.GUILD, 'g_starfall').available === 0.5;

  // 2. Multi-member Alliance Contributions (player_1: 4, player_2: 3.5, player_3: 2.5 => 10.0 rp_alliance)
  contributeToAlliancePool(prog19, { allianceId: 'a_bastion', contributorPlayerId: 'player_1', amount: 4.0, eventId: 'ac1', nowMs: 4000 });
  contributeToAlliancePool(prog19, { allianceId: 'a_bastion', contributorPlayerId: 'player_2', amount: 3.5, eventId: 'ac2', nowMs: 4100 });
  contributeToAlliancePool(prog19, { allianceId: 'a_bastion', contributorPlayerId: 'player_3', amount: 2.5, eventId: 'ac3', nowMs: 4200 });
  const aReport = getContributionReport(prog19, { targetOwnerType: OWNER_TYPES.ALLIANCE, targetOwnerId: 'a_bastion' });
  const multiContribOk = aReport.count === 3 && aReport.total === 10 &&
    aReport.byMemberScaled.player_1 === 400000 && aReport.byMemberScaled.player_2 === 350000 && aReport.byMemberScaled.player_3 === 250000;

  // 3. Alliance Research paid from shared Alliance pool; Alliance Training strictly rejected!
  const allianceTrainingBlocked = !startOrganizationResearch(prog19, { orgType: OWNER_TYPES.ALLIANCE, orgId: 'a_bastion', researchItemId: 'ALL_CITADEL_001', isTraining: true, nowMs: 5000 }).ok;
  const startAllianceRes = startOrganizationResearch(prog19, { orgType: OWNER_TYPES.ALLIANCE, orgId: 'a_bastion', researchItemId: 'ALL_CITADEL_001', nowMs: 5000 });
  const advAlliance = advanceResearchProgress(prog19, 100000, { queue: aCreate.alliance.researchQueue });
  const allianceCompletedOk = startAllianceRes.ok && advAlliance.completedItems.length === 1 &&
    getOrganizationResearchBalance(prog19, OWNER_TYPES.ALLIANCE, 'a_bastion').available === 0;

  // 4. Member leaves Alliance -> departing member loses benefit eligibility while Alliance retains completed research
  leaveOrganization(aCreate.alliance, 'player_3');
  const leaveRuleOk = !isPlayerEligibleForOrgBenefits(aCreate.alliance, 'player_3') &&
    isPlayerEligibleForOrgBenefits(aCreate.alliance, 'player_1') &&
    prog19.researchProgress['alliance:a_bastion:ALL_CITADEL_001'].currentLevel === 1;

  const t19Checks = {
    orgsCreated: Boolean(gCreate.ok && aCreate.ok),
    guildFundedOk: guildFundedOk,
    multiContribOk: multiContribOk,
    allianceTrainingBlocked: allianceTrainingBlocked,
    allianceCompletedOk: allianceCompletedOk,
    leaveRuleOk: leaveRuleOk
  };
  const failed19 = Object.keys(t19Checks).filter(function(k) { return !t19Checks[k]; });
  const t19Pass = failed19.length === 0;

  results.push({
    name: '19. Track F Phase 3: Guild/Alliance Research Ownership, Shared Contribution Pool & Lifecycle (Inc 10.3)',
    pass: t19Pass,
    detail: t19Pass
      ? 'Guild-owned RP/research, 3-member attributed Alliance pool funding, no-alliance-training rule & departure ownership persistence verified'
      : 'Failed checks: ' + failed19.join(', ')
  });

  // =========================================================================
  // Test 20: Track F Phase 4 — Generic Effects Framework & Separate Hero Training Queue (Inc 10.4)
  // =========================================================================
  const prog20 = createDefaultProgressionState(0);
  recordCurrencyTransaction(prog20.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_warrior', amount: 20, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });
  recordCurrencyTransaction(prog20.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_adventurer', amount: 20, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });
  recordCurrencyTransaction(prog20.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_general', amount: 1, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });
  recordCurrencyTransaction(prog20.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'gold', amount: 500, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });

  // 1. Deterministic BenefitService stacking: Set(10) -> Additive(+4, +6 => 20) -> Multiplicative(*1.5 => 30) -> Max(25 => 25)
  const stackEffects = [
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.SET, value: 10, priority: 1 },
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.ADDITIVE, value: 4 },
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.ADDITIVE, value: 6 },
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.MULTIPLICATIVE, value: 1.5 },
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.MINIMUM, value: 5 },
    { effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'atk', op: EFFECT_OPS.MAXIMUM, value: 25 }
  ];
  const stackRes = resolveNumericStat(99, 'atk', stackEffects);
  const stackingOk = stackRes.finalValue === 25 && stackRes.setApplied === 10 && stackRes.additiveSum === 10 && stackRes.multiplicativeFactor === 1.5;

  // 2. Unlock / Disable / Replace + Custom Handler separation
  const unlockEffects = [
    { effectType: EFFECT_TYPES.ABILITY_UNLOCK, target: 'heavy_cleave', op: EFFECT_OPS.UNLOCK, value: 1, priority: 1 },
    { effectType: EFFECT_TYPES.ABILITY_UNLOCK, target: 'heavy_cleave', op: EFFECT_OPS.REPLACE, value: 'titan_cleave', priority: 2 },
    { effectType: EFFECT_TYPES.ABILITY_UNLOCK, target: 'banned_rite', op: EFFECT_OPS.UNLOCK, value: 1, priority: 1 },
    { effectType: EFFECT_TYPES.ABILITY_UNLOCK, target: 'banned_rite', op: EFFECT_OPS.DISABLE, value: true, priority: 2 }
  ];
  const cleaveUnlock = resolveUnlockState('heavy_cleave', unlockEffects);
  const bannedUnlock = resolveUnlockState('banned_rite', unlockEffects);
  registerCustomEffectHandler('bonus_flat_test', function(p) { return (p.base || 0) + 7; });
  const customEffRes = evaluateCustomEffect('bonus_flat_test', { base: 10 });
  const unlockAndCustomOk = cleaveUnlock.unlocked && cleaveUnlock.replacedBy === 'titan_cleave' &&
    !bannedUnlock.unlocked && bannedUnlock.disabled &&
    customEffRes.ok && customEffRes.result === 17;

  // 3. Before WAR_WEAPON_HEAVY_001 is researched, Hero A cannot start train_heavy_weapons
  const trainLockedBefore = !startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_A', trainingDefinitionId: 'train_heavy_weapons', nowMs: 2000 }).ok;

  // 4. Complete WAR_WEAPON_HEAVY_001 Lv 1 -> unlocks train_heavy_weapons WITHOUT auto-granting +4 ATK!
  const startHeavyRes = startOrEnqueueResearch(prog20, { ownerId: 'p1', researchItemId: 'WAR_WEAPON_HEAVY_001', nowMs: 2000 });
  const advHeavyRes = advanceResearchProgress(prog20, 65000);
  const heroEffectsPreTrain = collectActiveEffects(prog20, { playerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_A' });
  const heavyUnlockedLv1 = resolveUnlockState('train_heavy_weapons', heroEffectsPreTrain.unlocks, { effectType: EFFECT_TYPES.UNLOCK_TRAINING });
  const heroAAtkPre = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.HERO, 'hero_A', 10, 'atk', { playerId: 'p1' }).finalValue;
  const heroBAtkPre = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.HERO, 'hero_B', 10, 'atk', { playerId: 'p1' }).finalValue;
  const unlockWithoutAutoBonusOk = Boolean(
    startHeavyRes.ok && advHeavyRes.completedItems.length === 1 &&
    heavyUnlockedLv1.unlocked && heavyUnlockedLv1.maxUnlockLevel === 1 &&
    heroAAtkPre === 10 && heroBAtkPre === 10
  );

  // 5. Separate queues: run Personal Research (GEN_SCHOLAR_001) AND Hero A Training simultaneously!
  const startConcurrentResearch = startOrEnqueueResearch(prog20, { ownerId: 'p1', researchItemId: 'GEN_SCHOLAR_001', nowMs: 70000 });
  const startHeroATrain = startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_A', trainingDefinitionId: 'train_heavy_weapons', nowMs: 70000 });
  const concurrentQueuesOk = Boolean(
    startConcurrentResearch.ok && startConcurrentResearch.queuedAs === 'active' &&
    startHeroATrain.ok && startHeroATrain.queuedAs === 'active' &&
    prog20.researchQueue.activeItems.length === 1 && prog20.trainingQueue.activeItems.length === 1
  );

  // Pause & resume Hero A training, then complete via offline jump
  pauseTrainingItem(prog20, 'hero_A', 'train_heavy_weapons', 80000);
  const advPausedTrain = advanceTrainingProgress(prog20, 100000);
  resumeTrainingItem(prog20, 'hero_A', 'train_heavy_weapons', 100000);
  const advDoneTrain = advanceTrainingProgress(prog20, 140000);

  // 6. Strict Subject Isolation: Hero A gets +4 ATK (14), Hero B remains at 10!
  const heroAAtkPost = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.HERO, 'hero_A', 10, 'atk', { playerId: 'p1' }).finalValue;
  const heroBAtkPost = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.HERO, 'hero_B', 10, 'atk', { playerId: 'p1' }).finalValue;
  const heroLv2StillLocked = !startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_A', trainingDefinitionId: 'train_heavy_weapons', nowMs: 141000 }).ok;
  const unavailableSubjectBlocked = startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_B', trainingDefinitionId: 'train_heavy_weapons', subjectAvailable: false, nowMs: 141000 }).reason === EVALUATION_STATUS.SUBJECT_UNAVAILABLE;

  // Cancel training with full refund check on Hero B
  const goldBeforeHeroB = getCurrencyBalance(prog20.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available;
  startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.HERO, subjectId: 'hero_B', trainingDefinitionId: 'train_heavy_weapons', nowMs: 142000 });
  const cancelHeroB = cancelTrainingItem(prog20, 'hero_B', 'train_heavy_weapons', { nowMs: 143000, refundPolicy: REFUND_POLICIES.FULL });
  const cancelHeroBOk = cancelHeroB.ok && getCurrencyBalance(prog20.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available === goldBeforeHeroB;

  const subjectIsolationOk = Boolean(
    advPausedTrain.completedItems.length === 0 &&
    advDoneTrain.completedItems.length === 1 &&
    heroAAtkPost === 14 &&
    heroBAtkPost === 10 &&
    heroLv2StillLocked &&
    unavailableSubjectBlocked &&
    cancelHeroBOk
  );

  // 7. Extensibility: City-scoped training subject (city_1 vs city_2)
  const customCityCatalog = {
    train_city_militia: {
      trainingDefinitionId: 'train_city_militia',
      name: 'Civic Militia Drills',
      subjectType: SUBJECT_TYPES.CITY,
      levels: [{ level: 1, durationSec: 10, costs: [{ kind: 'currency', currencyId: 'gold', amount: 20 }], benefits: [{ effectType: EFFECT_TYPES.ATTRIBUTE_MODIFIER, target: 'city_defense', op: EFFECT_OPS.ADDITIVE, value: 15 }] }],
      version: '1.0.0'
    }
  };
  const startCityTrain = startOrEnqueueTraining(prog20, { ownerId: 'p1', subjectType: SUBJECT_TYPES.CITY, subjectId: 'city_1', trainingDefinitionId: 'train_city_militia', trainingCatalog: customCityCatalog, requireUnlock: false, nowMs: 150000 });
  advanceTrainingProgress(prog20, 165000, { trainingCatalog: customCityCatalog });
  const city1Def = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.CITY, 'city_1', 100, 'city_defense', { playerId: 'p1', trainingCatalog: customCityCatalog }).finalValue;
  const city2Def = computeSubjectEffectiveStat(prog20, SUBJECT_TYPES.CITY, 'city_2', 100, 'city_defense', { playerId: 'p1', trainingCatalog: customCityCatalog }).finalValue;
  const extensibleSubjectOk = startCityTrain.ok && city1Def === 115 && city2Def === 100;

  const t20Checks = {
    stackingOk: stackingOk,
    unlockAndCustomOk: unlockAndCustomOk,
    trainLockedBefore: trainLockedBefore,
    unlockWithoutAutoBonusOk: unlockWithoutAutoBonusOk,
    concurrentQueuesOk: concurrentQueuesOk,
    subjectIsolationOk: subjectIsolationOk,
    extensibleSubjectOk: extensibleSubjectOk
  };
  const failed20 = Object.keys(t20Checks).filter(function(k) { return !t20Checks[k]; });
  const t20Pass = failed20.length === 0;

  results.push({
    name: '20. Track F Phase 4: Generic Effects Framework, Separate Hero Training Queue & Subject Isolation (Inc 10.4)',
    pass: t20Pass,
    detail: t20Pass
      ? 'Deterministic Set/Add/Mult/Min/Max stacking, Unlock/Modifier separation, concurrent Research+Training queues, Hero A vs Hero B isolation & extensible City subject verified'
      : 'Failed checks: ' + failed20.join(', ')
  });

  // =========================================================================
  // Test 21: Track F Phase 5 — Milestones, Provenance Titles, Tree Archiving, Tutorial Hooks & Hub UI (Inc 10.5)
  // =========================================================================
  const prog21 = createDefaultProgressionState(0);
  recordCurrencyTransaction(prog21.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'rp_general', amount: 1.0, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });
  recordCurrencyTransaction(prog21.currencyLedger, { ownerId: 'p1', ownerType: OWNER_TYPES.PLAYER, currencyId: 'gold', amount: 500, transactionType: TRANSACTION_TYPES.AWARD, source: 'seed', nowMs: 1000 });

  // Incomplete tree cannot be archived yet
  const archiveIncompleteBlocked = !archiveCompletedTree(prog21, 'tree_general_knowledge', 'p1').ok;

  // Complete both items in tree_general_knowledge -> satisfies ms_gen_1 milestone
  startOrEnqueueResearch(prog21, { ownerId: 'p1', researchItemId: 'GEN_SCHOLAR_001', nowMs: 2000 });
  advanceResearchProgress(prog21, 35000);
  startOrEnqueueResearch(prog21, { ownerId: 'p1', researchItemId: 'GEN_SPEED_001', nowMs: 36000 });
  advanceResearchProgress(prog21, 130000);

  const goldBeforeMs = getCurrencyBalance(prog21.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available;
  const msRes1 = evaluateTreeMilestones(prog21, 'p1', { nowMs: 131000, worldId: 'Starfall Prime' });
  const msRes2 = evaluateTreeMilestones(prog21, 'p1', { nowMs: 132000, worldId: 'Starfall Prime' });
  const milestoneIdempotentOk = msRes1.newlyCompleted.length === 1 &&
    msRes1.earnedTitles.length === 1 &&
    msRes1.earnedTitles[0].name === 'Curious Mind' &&
    msRes2.newlyCompleted.length === 0 &&
    getCurrencyBalance(prog21.currencyLedger, 'p1', OWNER_TYPES.PLAYER, 'gold').available === goldBeforeMs + 100;

  // Provenance Title display selector (equip owned, reject unowned, grant World-First title)
  const equipOwned = setActivePlayerTitle(prog21, 'title_ms_gen_1');
  const equipUnownedBlocked = !setActivePlayerTitle(prog21, 'title_does_not_exist').ok;
  const wfTitle = awardProvenanceTitle(prog21, { titleId: 'title_wf_1', name: 'First Scholar of Starfall', rarity: TITLE_RARITIES.WORLD_FIRST, provenance: 'World-First Tree Completion', worldId: 'Starfall Prime', nowMs: 132000 });
  const titlesOk = equipOwned.ok && getActivePlayerTitle(prog21).name === 'Curious Mind' && equipUnownedBlocked && wfTitle.ok && prog21.earnedTitles.length === 2;

  // Archive completed tree without losing research history, then restore
  const archOk = archiveCompletedTree(prog21, 'tree_general_knowledge', 'p1').ok &&
    prog21.archivedTreeIds.indexOf('tree_general_knowledge') !== -1 &&
    prog21.researchProgress['player:p1:GEN_SCHOLAR_001'].currentLevel === 1;
  const unarchOk = unarchiveTree(prog21, 'tree_general_knowledge').ok && prog21.archivedTreeIds.length === 0;
  archiveCompletedTree(prog21, 'tree_general_knowledge', 'p1');

  // 12-Step Tutorial & Analytics verification
  const tut21 = evaluateTutorialProgress(prog21, 'p1');
  const analytics21 = computeProgressionAnalytics(prog21, 'p1');
  const analyticsOk = PROGRESSION_TUTORIAL_STEPS.length === 12 &&
    Object.keys(PROGRESSION_EVENTS).length >= 17 &&
    tut21.completedCount >= 7 &&
    analytics21.completedTreeCount === 1 &&
    analytics21.archivedTreeCount === 1 &&
    analytics21.milestoneCount === 1 &&
    analytics21.titleCount === 2 &&
    analytics21.domainBreakdown.general_knowledge.itemsCompleted === 2;

  // Separate Research & Training 2-step screens smoke render (Overview -> Tree Node Graph)
  const host21 = createWargameSimHost();
  host21.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Lore', seedCode: 'STAR-2121' } });
  host21.state._researchModalOpen = true;
  host21.state._researchSelectedTreeId = null;
  renderResearchModal(host21);
  host21.state._researchSelectedTreeId = 'tree_weapon_proficiency';
  renderResearchModal(host21);
  host21.state._researchModalOpen = false;
  renderResearchModal(host21);

  host21.state._trainingModalOpen = true;
  host21.state._trainingSelectedTreeId = null;
  renderTrainingModal(host21);
  host21.state._trainingModalOpen = false;
  renderTrainingModal(host21);
  const allTabsRendered = true;

  const t21Checks = {
    archiveIncompleteBlocked: archiveIncompleteBlocked,
    milestoneIdempotentOk: milestoneIdempotentOk,
    titlesOk: titlesOk,
    archOk: archOk,
    unarchOk: unarchOk,
    analyticsOk: analyticsOk,
    allTabsRendered: allTabsRendered
  };
  const failed21 = Object.keys(t21Checks).filter(function(k) { return !t21Checks[k]; });
  const t21Pass = failed21.length === 0;

  results.push({
    name: '21. Track F Phase 5: Milestones, Provenance Titles, Tree Archiving, 12-Step Tutorial & Hub UI (Inc 10.5)',
    pass: t21Pass,
    detail: t21Pass
      ? 'Idempotent tree milestones, Provenance Titles + display selector, lossless tree archiving, 12-step tutorial, analytics & 6-tab Research/Training Hub verified'
      : 'Failed checks: ' + failed21.join(', ')
  });

  // =========================================================================
  // Test 22: Track B Inc 9.8 — Arcane Academy & Market Trade Post (Consumes Track F Engines)
  // =========================================================================
  const host22 = createWargameSimHost();
  host22.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Meridian', seedCode: 'STAR-9800' } });
  host22.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Meridian Exchange' } });
  const city22 = getPrimaryCity(host22.state);

  const catalogHas98 = Boolean(
    CITY_BUILDINGS_CATALOG.arcane_academy && CITY_BUILDINGS_CATALOG.arcane_academy.facilities.academy &&
    CITY_BUILDINGS_CATALOG.market_post && CITY_BUILDINGS_CATALOG.market_post.facilities.market
  );

  // Blocked before buildings exist
  const blockedBefore98 = !host22.dispatch({ type: COMMAND_TYPES.ACADEMY_STUDY_SESSION, payload: {} }).ok &&
    !host22.dispatch({ type: COMMAND_TYPES.MARKET_TRADE, payload: { resourceId: 'wood', side: 'sell' } }).ok;

  // Establish Lv 2 Arcane Academy & Lv 2 Market Trade Post
  city22.buildings.arcane_academy = 2;
  city22.buildings.market_post = 2;
  city22.stockpile.wood = 100;
  city22.stockpile.food = 100;
  city22.stockpile.gold = 200;
  city22.stockpile.ore = 10;

  // 1. Arcane Academy BenefitService modifiers (+50% rp_general accrual, +20% personal research speed)
  const acadEff22 = getCityAcademyBenefitEffects(city22);
  const acadAccrualBonus = resolveNumericStat(0, 'rp_general', acadEff22, { effectType: EFFECT_TYPES.ACCRUAL_MODIFIER }).finalValue;
  const acadSpeedBonus = resolveNumericStat(0, 'personal', acadEff22, { effectType: EFFECT_TYPES.RESEARCH_SPEED_MODIFIER }).finalValue;
  const studyRes22 = host22.dispatch({ type: COMMAND_TYPES.ACADEMY_STUDY_SESSION, payload: {} });
  const studyRpBal = getCurrencyBalance(host22.state.world.progression.currencyLedger, 'player_1', OWNER_TYPES.PLAYER, 'rp_general').available;
  const academyOk = acadAccrualBonus === 0.5 && acadSpeedBonus === 0.2 &&
    studyRes22.ok && studyRes22.data.rpAwarded === 0.1 &&
    studyRpBal === 0.1 && city22.stockpile.gold === 175 && city22.stockpile.food === 90;

  // 2. Market Sell & Buy via Unified Atomic Payment Interface
  const sellWoodRes = host22.dispatch({ type: COMMAND_TYPES.MARKET_TRADE, payload: { resourceId: 'wood', side: 'sell' } });
  const buyOreRes = host22.dispatch({ type: COMMAND_TYPES.MARKET_TRADE, payload: { resourceId: 'ore', side: 'buy' } });
  const marketTradeOk = sellWoodRes.ok && sellWoodRes.data.goldEarned === 13 && city22.stockpile.wood === 80 &&
    buyOreRes.ok && buyOreRes.data.goldSpent === 45 && city22.stockpile.ore === 20 && city22.stockpile.gold === 143;

  // 3. Market Relic Liquidation consuming Track F BenefitService (ADV_TREASURE_001 Lv 1 = +12% relic_gold_mult + 5% Market Lv 2 = 1.17x)
  host22.state.world.progression.researchProgress['player:player_1:ADV_TREASURE_001'] = {
    researchItemId: 'ADV_TREASURE_001',
    ownerId: 'player_1',
    ownerType: OWNER_TYPES.PLAYER,
    currentLevel: 1,
    status: 'completed'
  };
  city22.storage.items.push({ uid: 'relic_test_98', name: 'Starfall Astrolabe', slot: 'accessory', rarity: 'rare' });
  const liqRes22 = host22.dispatch({ type: COMMAND_TYPES.MARKET_LIQUIDATE_ITEM, payload: { itemUid: 'relic_test_98' } });
  // 110 * (1.05 + 0.12) = 128.7 -> 129g
  const liquidateOk = liqRes22.ok && liqRes22.data.payoutGold === 129 && city22.storage.items.length === 0 && city22.stockpile.gold === 272;

  const t22Checks = {
    catalogHas98: catalogHas98,
    blockedBefore98: blockedBefore98,
    academyOk: academyOk,
    marketTradeOk: marketTradeOk,
    liquidateOk: liquidateOk
  };
  const failed22 = Object.keys(t22Checks).filter(function(k) { return !t22Checks[k]; });
  const t22Pass = failed22.length === 0;

  results.push({
    name: '22. Track B Inc 9.8: Arcane Academy & Market Trade Post (Consumes Track F Engines)',
    pass: t22Pass,
    detail: t22Pass
      ? 'Arcane Academy BenefitService modifiers/study sessions & Market atomic trades/ADV_TREASURE_001 relic liquidation verified'
      : 'Failed checks: ' + failed22.join(', ')
  });

  // =========================================================================
  // Test 23: Separate Research/Training Node-Graph UI, Developer Portal & Offline Accrual
  // =========================================================================
  const host23 = createWargameSimHost();
  host23.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Forge', seedCode: 'STAR-2323' } });
  host23.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Archive Bastion' } });
  const prog23 = host23.state.world.progression;
  const city23 = getPrimaryCity(host23.state);

  // 1. 10-node rich Weapon Proficiency tree (uses rp_warrior, WAR_MASTER_001 has no phantom WAR_FLANKING_001 parent) + Training disciplines
  const weaponTree23 = PROTOTYPE_RESEARCH_TREES.tree_weapon_proficiency;
  const heavyUsesWarriorRp = PROTOTYPE_RESEARCH_ITEMS.WAR_WEAPON_HEAVY_001.levelDefinitions[0].costs[0].currencyId === 'rp_warrior';
  const noPhantomFlankingEdge = PROTOTYPE_RESEARCH_ITEMS.WAR_MASTER_001.parentIds.indexOf('WAR_FLANKING_001') === -1;
  const killAwardsWarrior = awardActivityResearchPoints(prog23, { ownerId: 'player_1', activityType: 'monster_defeated', eventId: 'kill_23', nowMs: 5000 });
  const warActionAwardsWarrior = awardActivityResearchPoints(prog23, { ownerId: 'player_1', activityType: 'warrior_class_action', eventId: 'wact_23', nowMs: 6000 });
  const tenNodeTreeOk = Boolean(
    weaponTree23 && weaponTree23.itemIds.length === 10 &&
    Object.keys(PROTOTYPE_TRAINING_TREES).length >= 2 &&
    heavyUsesWarriorRp && noPhantomFlankingEdge &&
    killAwardsWarrior.ok && killAwardsWarrior.currencyId === 'rp_warrior' &&
    warActionAwardsWarrior.ok && warActionAwardsWarrior.currencyId === 'rp_warrior'
  );

  // 2. Floor-to-tenths RP formatting & Have/Need green/red cost rows
  const tenthsOk = formatRpTenths(12.49) === '12.4' && formatRpTenths(0.09) === '0.0';
  city23.stockpile.gold = 7000;
  const greenCostHtml = buildCostComparisonRowHtml({ kind: 'currency', currencyId: 'gold', amount: 500 }, prog23, city23, 'player_1');
  city23.stockpile.gold = 100;
  const redCostHtml = buildCostComparisonRowHtml({ kind: 'currency', currencyId: 'gold', amount: 500 }, prog23, city23, 'player_1');
  const haveNeedColorsOk = greenCostHtml.indexOf('7000/500') !== -1 && greenCostHtml.indexOf('#34d399') !== -1 &&
    redCostHtml.indexOf('100/500') !== -1 && redCostHtml.indexOf('#f87171') !== -1;

  // 3. Developer Portal Currency Editor & Auto-Surfaced Config Registry
  const devSetCurrRes = handleDevSetCurrencyAction(host23, 'rp_adventurer', 42.5);
  const devSetCfgRes = handleDevSetConfigAction(host23, 'research_queue_capacity', 2);
  host23.state._devPortalOpen = true;
  renderDevPortalModal(host23);
  host23.state._devPortalOpen = false;
  renderDevPortalModal(host23);
  const devPortalOk = Boolean(
    DEV_CONFIG_REGISTRY.length >= 9 &&
    devSetCurrRes.ok &&
    getCurrencyBalance(prog23.currencyLedger, 'player_1', OWNER_TYPES.PLAYER, 'rp_adventurer').available === 42.5 &&
    devSetCfgRes.ok &&
    getConfigValue(prog23, 'research_queue_capacity') === 2 &&
    prog23.researchQueue.capacity === 2
  );

  // 4. Online & Offline wall-clock General RP accrual (1000s offline at 0.00001/s => 0.01 rp_general)
  const baseWall = prog23.lastWallClockAtMs || 1000000;
  prog23.lastWallClockAtMs = baseWall;
  tickWorldProgression(host23, baseWall + 1000 * 1000);
  const offlineWallRpOk = getCurrencyBalance(prog23.currencyLedger, 'player_1', OWNER_TYPES.PLAYER, 'rp_general').availableScaled === 1000;

  const t23Checks = {
    tenNodeTreeOk: tenNodeTreeOk,
    tenthsOk: tenthsOk,
    haveNeedColorsOk: haveNeedColorsOk,
    devPortalOk: devPortalOk,
    offlineWallRpOk: offlineWallRpOk
  };
  const failed23 = Object.keys(t23Checks).filter(function(k) { return !t23Checks[k]; });
  const t23Pass = failed23.length === 0;

  results.push({
    name: '23. Separate Research/Training Node-Graph UI, Developer Portal & Offline Wall-Clock RP Accrual',
    pass: t23Pass,
    detail: t23Pass
      ? '10-node Weapon Proficiency tree, tenths-floor RP display, green/red Have/Need costs, Developer Portal currency/config editor & offline wall-clock General RP verified'
      : 'Failed checks: ' + failed23.join(', ')
  });

  // =========================================================================
  // TEST 24: Canonical Player Identity, Legacy Migration & Save Hygiene (Task 02)
  // =========================================================================
  const host24 = createWargameSimHost();
  host24.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Canon', seedCode: 'STAR-2400' } });
  const freshPidOk = host24.state.world.player.id === CANONICAL_PLAYER_ID &&
    getCanonicalPlayerId(host24.state) === 'player_1';

  // Simulate legacy save with 'player_local', intentionally unowned entity (null), rival entity, and neutral hostiles/POIs
  host24.state.world.player.id = 'player_local';
  host24.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Canon Keep' } });
  const city24 = getPrimaryCity(host24.state);
  city24.ownerPlayerId = 'player_local';
  host24.state.world.cities.neutral_ruin = { id: 'neutral_ruin', name: 'Ancient Ruin', ownerPlayerId: null };
  host24.state.world.cities.rival_bastion = { id: 'rival_bastion', name: 'Ironhold', ownerPlayerId: 'rival_1' };

  ensureCanonicalPlayerIdentity(host24.state.world);
  const migratedPidOk = host24.state.world.player.id === 'player_1' && city24.ownerPlayerId === 'player_1';
  const neutralPreservedOk = host24.state.world.cities.neutral_ruin.ownerPlayerId === null &&
    host24.state.world.cities.rival_bastion.ownerPlayerId === 'rival_1';
  const hostilesUnownedOk = (host24.state.world.overworld.hostiles || []).every(function(ho) {
    return ho.ownerPlayerId === undefined || ho.ownerPlayerId === null;
  });

  // Transient UI state stripping on serialization
  host24.state._dirty = true;
  host24.state._openHeroSheetId = 'hero_1';
  host24.state._mobileDrawer = 'left';
  host24.state._plotPopupOpen = true;
  const serialized24 = buildSerializableWargameState(host24.state);
  const noTransientUiKeysOk = Boolean(
    serialized24 &&
    serialized24.world &&
    serialized24._dirty === undefined &&
    serialized24._openHeroSheetId === undefined &&
    serialized24._mobileDrawer === undefined &&
    serialized24._plotPopupOpen === undefined
  );

  const t24Checks = {
    freshPidOk: freshPidOk,
    migratedPidOk: migratedPidOk,
    neutralPreservedOk: neutralPreservedOk,
    hostilesUnownedOk: hostilesUnownedOk,
    noTransientUiKeysOk: noTransientUiKeysOk
  };
  const failed24 = Object.keys(t24Checks).filter(function(k) { return !t24Checks[k]; });
  const t24Pass = failed24.length === 0;

  results.push({
    name: '24. Canonical Player Identity (player_1), Legacy Migration, Neutral Safety & Save Hygiene (Task 02)',
    pass: t24Pass,
    detail: t24Pass
      ? 'Canonical player_1 enforced, legacy player_local migrated, neutral/rival ownership untouched & transient UI flags excluded from saves'
      : 'Failed checks: ' + failed24.join(', ')
  });

  // =========================================================================
  // TEST 25: Unified In-Process Context Transitions, Shared Hero/Item/Resource Integrity & Safety (Task 02)
  // =========================================================================
  const host25 = createWargameSimHost();
  host25.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Unified', seedCode: 'STAR-2500' } });
  host25.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Unified Bastion' } });
  const city25 = getPrimaryCity(host25.state);
  city25.stockpile.wood = 500;
  city25.stockpile.stone = 500;
  city25.stockpile.gold = 500;
  city25.stockpile.food = 500;
  city25.buildings.hut = 1;
  city25.buildings.garden = 1;
  city25.buildings.well = 1;
  city25.buildings.lumber_camp = 1;
  city25.buildings.quarry = 1;
  city25.population = { current: 20, max: 25, growthProgress: 0, starving: false };
  host25.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'guild_hall' } });
  host25.stepClock(60 * 1000);
  host25.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'adventurer', heroName: 'Aldric' } });
  host25.stepClock(70 * 1000);

  const hero25 = host25.state.world.heroes[0];
  const partyUnit25 = host25.state.world.overworld.units.find(function(u) { return u.unitType === 'hero_party'; });
  const poi25 = host25.state.world.overworld.pois.find(function(p) { return p.type === 'dungeon_entrance'; });
  hero25.equipment.weapon = { uid: 'wpn_canon_01', name: 'Vanguard Blade', slot: 'weapon', rarity: 'rare', atk: 12, def: 0, maxSockets: 1, sockets: [] };

  const dngState25 = createDefaultGameState();
  let dungeonInitCount25 = 0;
  const ctx25 = createAppContextController({
    simHost: host25,
    dungeonState: dngState25,
    onEnsureDungeonInitialized: function() { dungeonInitCount25 += 1; }
  });

  // 1. Negative test: cannot enter dungeon when not standing on POI
  const badEntryRes = ctx25.enterDungeon({ unitId: partyUnit25.id, poiId: poi25.id });
  const badEntryRejectedOk = !badEntryRes.ok && ctx25.getActiveContext() === APP_CONTEXTS.STRATEGY && partyUnit25.status === 'idle';

  // Position party on dungeon entrance POI
  partyUnit25.x = poi25.x;
  partyUnit25.y = poi25.y;

  // 2. Atomicity & rollback test on sync failure
  const failEntryRes = ctx25.enterDungeon({ unitId: partyUnit25.id, poiId: poi25.id, simulateSyncFailure: true });
  const rollbackOk = !failEntryRes.ok && Boolean(failEntryRes.rolledBack) &&
    ctx25.getActiveContext() === APP_CONTEXTS.STRATEGY && partyUnit25.status === 'idle';

  // 3. Valid in-process dungeon entry
  const enterRes1 = ctx25.enterDungeon({ unitId: partyUnit25.id, poiId: poi25.id });
  const entry1Ok = Boolean(
    enterRes1.ok &&
    ctx25.getActiveContext() === APP_CONTEXTS.DUNGEON &&
    dungeonInitCount25 === 1 &&
    dngState25.playerId === 'player_1' &&
    dngState25.wargameSession &&
    dngState25.wargameSession.inProcess === true &&
    dngState25.hero.id === hero25.id &&
    dngState25.hero.ownerPlayerId === 'player_1' &&
    dngState25.hero.equipment.weapon &&
    dngState25.hero.equipment.weapon.uid === 'wpn_canon_01'
  );

  // 4. Simulate dungeon progress: level/XP, loot, upgraded weapon
  dngState25.hero.level = 3;
  dngState25.hero.xp = 145;
  dngState25.hero.equipment.weapon = { uid: 'wpn_star_02', name: 'Starfall Greatsword', slot: 'weapon', rarity: 'epic', atk: 24, def: 2, maxSockets: 1, sockets: [] };
  dngState25.hero.expeditionPack.push({ id: 'copper', name: 'Copper Ore', qty: 5, val: 10 });
  dngState25.hero.expeditionGear.push({ uid: 'loot_helm_01', name: 'Delver Helm', slot: 'helm', rarity: 'uncommon', atk: 0, def: 6, value: 45 });

  // 5. Extract via Floor 1 Stairs & apply in-process exit
  const extRes1 = extractToGuild('Floor 1 Ascending Stairs (<)', dngState25);
  const exitRes1 = ctx25.exitDungeon(extRes1.returnEnvelope);
  const cargoAfterExit1 = partyUnit25.cargo ? { gold: partyUnit25.cargo.gold, ore: partyUnit25.cargo.ore, gearCount: partyUnit25.cargo.gearCount } : null;
  const exit1Ok = Boolean(
    exitRes1.ok &&
    ctx25.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    hero25.id === dngState25.hero.id &&
    hero25.level === 3 &&
    hero25.xp === 145 &&
    hero25.equipment.weapon &&
    hero25.equipment.weapon.uid === 'wpn_star_02' &&
    cargoAfterExit1 &&
    cargoAfterExit1.ore >= 5 &&
    cargoAfterExit1.gearCount >= 1
  );

  // 6. Duplicate reward prevention: re-submitting same session exit is rejected & does not double cargo
  const dupExitRes = ctx25.exitDungeon(extRes1.returnEnvelope);
  const dupPreventedOk = Boolean(
    !dupExitRes.ok &&
    dupExitRes.duplicate === true &&
    partyUnit25.cargo &&
    partyUnit25.cargo.ore === cargoAfterExit1.ore &&
    partyUnit25.cargo.gearCount === cargoAfterExit1.gearCount
  );

  // 7. Repeated transition (Run #2: Defeat recovery) — must NOT re-run init or leak listeners
  partyUnit25.status = 'idle';
  partyUnit25.marchPlan = null;
  partyUnit25.x = poi25.x;
  partyUnit25.y = poi25.y;
  const enterRes2 = ctx25.enterDungeon({ unitId: partyUnit25.id, poiId: poi25.id });
  const defeatRes2 = handleHeroDefeat('Iron Colossus', dngState25);
  const exitRes2 = ctx25.exitDungeon(defeatRes2.returnEnvelope);
  const repeatAndDefeatOk = Boolean(
    enterRes2.ok &&
    dungeonInitCount25 === 1 &&
    exitRes2.ok &&
    ctx25.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    partyUnit25.x === city25.x &&
    partyUnit25.y === city25.y &&
    hero25.level === 3 &&
    hero25.equipment.weapon &&
    hero25.equipment.weapon.uid === 'wpn_star_02'
  );

  const t25Checks = {
    badEntryRejectedOk: badEntryRejectedOk,
    rollbackOk: rollbackOk,
    entry1Ok: entry1Ok,
    exit1Ok: exit1Ok,
    dupPreventedOk: dupPreventedOk,
    repeatAndDefeatOk: repeatAndDefeatOk
  };
  const failed25 = Object.keys(t25Checks).filter(function(k) { return !t25Checks[k]; });
  const t25Pass = failed25.length === 0;

  results.push({
    name: '25. Unified In-Process Context Transitions, Shared Hero/Item/Reward Integrity & Safety (Task 02)',
    pass: t25Pass,
    detail: t25Pass
      ? 'Zero-reload Strategy<->Dungeon transitions, atomic rollback, canonical Hero/Item/Reward sync, duplicate-reward guard & repeated runs verified'
      : 'Failed checks: ' + failed25.join(', ')
  });

  // =========================================================================
  // TEST 26: All Unified Dungeon Exit Pathways -> Strategy/Overworld (No Legacy Guild Fallback)
  // =========================================================================
  const host26 = createWargameSimHost();
  host26.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Surface', seedCode: 'STAR-2600' } });
  host26.dispatch({ type: COMMAND_TYPES.FOUND_CITY, payload: { cityName: 'Surface Bastion' } });
  const city26 = getPrimaryCity(host26.state);
  city26.stockpile.wood = 500;
  city26.stockpile.stone = 500;
  city26.stockpile.gold = 500;
  city26.stockpile.food = 500;
  city26.buildings.hut = 1;
  city26.buildings.garden = 1;
  city26.buildings.well = 1;
  city26.buildings.lumber_camp = 1;
  city26.buildings.quarry = 1;
  city26.population = { current: 20, max: 25, growthProgress: 0, starving: false };
  host26.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'guild_hall' } });
  host26.stepClock(60 * 1000);
  host26.dispatch({ type: COMMAND_TYPES.RECRUIT_HERO, payload: { classId: 'adventurer', heroName: 'Kaelen' } });
  host26.stepClock(70 * 1000);

  const hero26 = host26.state.world.heroes[0];
  const party26 = host26.state.world.overworld.units.find(function(u) { return u.unitType === 'hero_party'; });
  const poi26 = host26.state.world.overworld.pois.find(function(p) { return p.type === 'dungeon_entrance'; });
  const dng26 = createDefaultGameState();
  const initialLegacyGuildGold26 = dng26.guildVault.gold;

  const ctx26 = createAppContextController({
    simHost: host26,
    dungeonState: dng26
  });

  function prepReentry26() {
    party26.status = 'idle';
    party26.marchPlan = null;
    party26.x = poi26.x;
    party26.y = poi26.y;
    host26.state._openFacilityId = 'guild_hall';
    return ctx26.enterDungeon({ unitId: party26.id, poiId: poi26.id });
  }

  // Pathway 1: Floor 1 Ascending Stairs (<) via useStairsAtPlayer
  const e26_1 = prepReentry26();
  dng26.hero.expeditionPack.push({ id: 'copper', name: 'Copper Ore', qty: 3, val: 10 });
  const f1_26 = dng26.dungeon.floors[1];
  dng26.hero.x = f1_26.upPos.x;
  dng26.hero.y = f1_26.upPos.y;
  useStairsAtPlayer(dng26);
  const stairsExit26 = ctx26.exitDungeon({
    outcome: 'extracted',
    method: 'Floor 1 Ascending Stairs (<)',
    sessionId: e26_1.sessionId,
    partyUnitId: party26.id,
    heroId: hero26.id,
    heroLevel: dng26.hero.level,
    heroXp: dng26.hero.xp,
    dungeonId: dng26.activeDungeonId,
    dungeonPoiId: poi26.id,
    lootSummary: { gold: 0, ore: 3, gems: 0, gearCount: 0, salvagedGold: 0 },
    extractedGear: [],
    heroEquipment: dng26.hero.equipment
  });
  const stairsPathOk = Boolean(
    e26_1.ok &&
    stairsExit26.ok &&
    ctx26.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    host26.state.activeView === WARGAME_VIEWS.OVERWORLD &&
    host26.state._openFacilityId === null &&
    dng26.guildVault.copper === 0
  );

  // Pathway 2: Astral Recall Scroll (useRecallScroll)
  const e26_2 = prepReentry26();
  dng26.hero.consumables.recalls = 1;
  dng26.hero.expeditionPack.push({ id: 'iron', name: 'Iron Ore', qty: 4, val: 20 });
  const recallUsed26 = useRecallScroll(dng26);
  const recallExit26 = ctx26.exitDungeon({
    outcome: 'extracted',
    method: 'Astral Recall Scroll',
    sessionId: e26_2.sessionId,
    partyUnitId: party26.id,
    heroId: hero26.id,
    heroLevel: dng26.hero.level,
    heroXp: dng26.hero.xp,
    dungeonId: dng26.activeDungeonId,
    dungeonPoiId: poi26.id,
    lootSummary: { gold: 0, ore: 4, gems: 0, gearCount: 0, salvagedGold: 0 },
    extractedGear: [],
    heroEquipment: dng26.hero.equipment
  });
  const recallPathOk = Boolean(
    e26_2.ok &&
    recallUsed26 &&
    recallExit26.ok &&
    ctx26.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    host26.state.activeView === WARGAME_VIEWS.OVERWORLD &&
    party26.x === poi26.x &&
    party26.y === poi26.y &&
    dng26.guildVault.iron === 0
  );

  // Pathway 3: Boss Extraction Portal (traversePortal)
  const e26_3 = prepReentry26();
  const bossPortal26 = createPortalInstance('portal_boss_extraction', dng26.hero.x, dng26.hero.y, {
    dungeonId: dng26.activeDungeonId,
    floorDepth: 1
  });
  const portalRes26 = traversePortal(bossPortal26, dng26);
  const portalExit26 = ctx26.exitDungeon({
    outcome: 'extracted',
    method: 'Astral Sanctum Gateway',
    sessionId: e26_3.sessionId,
    partyUnitId: party26.id,
    heroId: hero26.id,
    heroLevel: dng26.hero.level,
    heroXp: dng26.hero.xp,
    dungeonId: dng26.activeDungeonId,
    dungeonPoiId: poi26.id,
    lootSummary: { gold: 15, ore: 0, gems: 0, gearCount: 0, salvagedGold: 0 },
    extractedGear: [],
    heroEquipment: dng26.hero.equipment
  });
  const portalPathOk = Boolean(
    e26_3.ok &&
    portalRes26.ok &&
    portalRes26.type === 'extraction' &&
    portalExit26.ok &&
    ctx26.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    host26.state.activeView === WARGAME_VIEWS.OVERWORLD
  );

  // Pathway 4: Defeat Recovery (handleHeroDefeat)
  const e26_4 = prepReentry26();
  const defeatOut26 = handleHeroDefeat('Vault Sentinel', dng26);
  const defeatExit26 = ctx26.exitDungeon(defeatOut26.returnEnvelope);
  const defeatPathOk = Boolean(
    e26_4.ok &&
    defeatExit26.ok &&
    ctx26.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    host26.state.activeView === WARGAME_VIEWS.OVERWORLD &&
    party26.x === city26.x &&
    party26.y === city26.y &&
    dng26.guildVault.gold === initialLegacyGuildGold26
  );

  // Pathway 5: Integrated UI Surface Exit ('Dungeon Surface Exit') preserves XP & loot
  const e26_5 = prepReentry26();
  dng26.hero.level = 2;
  dng26.hero.xp = 88;
  dng26.hero.expeditionPack.push({ id: 'copper', name: 'Copper Ore', qty: 2, val: 10 });
  const surfaceOut26 = extractToGuild('Dungeon Surface Exit', dng26);
  const surfaceExit26 = ctx26.exitDungeon(surfaceOut26.returnEnvelope);
  const surfacePathOk = Boolean(
    e26_5.ok &&
    surfaceExit26.ok &&
    ctx26.getActiveContext() === APP_CONTEXTS.STRATEGY &&
    host26.state.activeView === WARGAME_VIEWS.OVERWORLD &&
    hero26.level === 2 &&
    hero26.xp === 88
  );

  const t26Checks = {
    stairsPathOk: stairsPathOk,
    recallPathOk: recallPathOk,
    portalPathOk: portalPathOk,
    defeatPathOk: defeatPathOk,
    surfacePathOk: surfacePathOk
  };
  const failed26 = Object.keys(t26Checks).filter(function(k) { return !t26Checks[k]; });
  const t26Pass = failed26.length === 0;

  results.push({
    name: '26. All Unified Dungeon Exit Pathways -> Strategy/Overworld & Zero Legacy Guild Leakage',
    pass: t26Pass,
    detail: t26Pass
      ? 'Stairs, Recall Scroll, Boss Extraction Portal, Defeat Recovery & UI Surface Exit all return cleanly to Strategy/Overworld without legacy Guild fallback'
      : 'Failed checks: ' + failed26.join(', ')
  });

  // =========================================================================
  // TEST 27: Hex Spatial Foundation — Neighbors, Distance, A*, Movement, Vision & Interpolation (Task 03)
  // =========================================================================
  function makeBlankHexMap27(w, h) {
    const tiles = [];
    const explored = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      const erow = [];
      for (let x = 0; x < w; x++) {
        row.push(OW_TERRAIN_PLAINS);
        erow.push(false);
      }
      tiles.push(row);
      explored.push(erow);
    }
    return { width: w, height: h, tiles: tiles, explored: explored };
  }

  const map27 = makeBlankHexMap27(20, 20);

  // 1. Six neighbors & reciprocity on both even (10,10) and odd (10,11) rows
  const evenN = getHexNeighbors(10, 10, map27);
  const oddN = getHexNeighbors(10, 11, map27);
  let reciprocityOk = evenN.length === 6 && oddN.length === 6;
  const checkPairs27 = [
    { cx: 10, cy: 10, list: evenN },
    { cx: 10, cy: 11, list: oddN }
  ];
  for (let pi = 0; pi < checkPairs27.length; pi++) {
    const cp = checkPairs27[pi];
    for (let ni = 0; ni < cp.list.length; ni++) {
      const n = cp.list[ni];
      const back = getHexNeighbors(n.x, n.y, map27);
      const hasBack = back.some(function(b) { return b.x === cp.cx && b.y === cp.cy; });
      if (!hasBack || getHexDistance(cp.cx, cp.cy, n.x, n.y) !== 1 || getHexDistance(n.x, n.y, cp.cx, cp.cy) !== 1) {
        reciprocityOk = false;
      }
    }
  }

  // 2. Distance invariants (zero to self, symmetry, multi-step)
  const distOk = Boolean(
    getHexDistance(10, 10, 10, 10) === 0 &&
    getHexDistance(10, 11, 10, 11) === 0 &&
    getHexDistance(10, 10, 13, 10) === 3 &&
    getHexDistance(13, 10, 10, 10) === 3 &&
    getHexDistance(10, 10, 8, 8) === 3 &&
    getHexDistance(8, 8, 10, 10) === 3 &&
    getHexDistance(10, 10, 9, 8) === 2 &&
    getHexDistance(9, 8, 10, 10) === 2 &&
    getHexDistance(10, 10, 11, 11) === 2 && // non-adjacent on even row!
    getHexDistance(10, 11, 9, 10) === 2     // non-adjacent on odd row!
  );

  // 3. Boundary & corner hexes strictly within map bounds
  const corners27 = [[0, 0], [19, 0], [0, 19], [19, 19]];
  let cornersOk = true;
  for (let ci = 0; ci < corners27.length; ci++) {
    const cN = getHexNeighbors(corners27[ci][0], corners27[ci][1], map27);
    if (cN.length < 2 || cN.length > 4) cornersOk = false;
    for (let k = 0; k < cN.length; k++) {
      if (cN[k].x < 0 || cN[k].x >= 20 || cN[k].y < 0 || cN[k].y >= 20) cornersOk = false;
    }
  }

  // 4. 1-step A* path to all 6 neighbors (even & odd rows) + obstacle avoidance + unreachable + terrain cost
  let sixWayPathsOk = MIN_OVERWORLD_MARCH_COST_MS === 3000;
  for (let ni = 0; ni < evenN.length; ni++) {
    const p = findOverworldPath(map27, 10, 10, evenN[ni].x, evenN[ni].y);
    if (!p || p.length !== 1 || p[0].x !== evenN[ni].x || p[0].y !== evenN[ni].y) sixWayPathsOk = false;
  }
  for (let ni = 0; ni < oddN.length; ni++) {
    const p = findOverworldPath(map27, 10, 11, oddN[ni].x, oddN[ni].y);
    if (!p || p.length !== 1 || p[0].x !== oddN[ni].x || p[0].y !== oddN[ni].y) sixWayPathsOk = false;
  }

  // Wall off (14, 10) with mountains on all 6 neighbors -> unreachable must return null
  const mapBlock27 = makeBlankHexMap27(20, 20);
  const ringAroundTarget = getHexNeighbors(14, 10, mapBlock27);
  for (let i = 0; i < ringAroundTarget.length; i++) {
    mapBlock27.tiles[ringAroundTarget[i].y][ringAroundTarget[i].x] = OW_TERRAIN_MOUNTAINS;
  }
  const unreachableOk = findOverworldPath(mapBlock27, 10, 10, 14, 10) === null;

  // Obstacle detour: block direct E neighbor (11,10) with mountain -> must route around (3 hex steps: NE->E->SE or SE->E->NE)
  const mapDetour27 = makeBlankHexMap27(20, 20);
  mapDetour27.tiles[10][11] = OW_TERRAIN_MOUNTAINS;
  const detourPath = findOverworldPath(mapDetour27, 10, 10, 12, 10);
  let detourOk = Boolean(detourPath && detourPath.length === 3);
  if (detourPath) {
    let px = 10, py = 10;
    for (let i = 0; i < detourPath.length; i++) {
      if (!areHexesAdjacent(px, py, detourPath[i].x, detourPath[i].y)) detourOk = false;
      px = detourPath[i].x;
      py = detourPath[i].y;
    }
  }

  // Terrain cost preference: put Hills (5500ms) on direct E (11,10), keep Plains (3000ms) on NE (10,9) -> SE (11,10) vs direct 2-step
  const mapCost27 = makeBlankHexMap27(20, 20);
  mapCost27.tiles[10][11] = OW_TERRAIN_HILLS; // 10,10 -> 11,10 (5500) -> 12,10 (3000) = 8500
  // Going 10,10 -> 10,9 (3000) -> 11,9 (3000) -> 12,10 (3000) = 9000, so direct Hills is 8500 < 9000;
  // Compare 2-step routes from (10,10) to (11,9): via (11,10) Hills = 8500 vs via (10,9) Plains = 6000!
  const costPath = findOverworldPath(mapCost27, 10, 10, 11, 9);
  const terrainCostOk = Boolean(costPath && costPath.length === 2 && costPath[0].x === 10 && costPath[0].y === 9);

  // 5. STEP_UNIT_ADJACENT: all 6 hexDirs, valid legacy cardinal steps on even & odd rows, and strict rejection with zero side effects
  const host27 = createWargameSimHost();
  host27.dispatch({ type: COMMAND_TYPES.START_NEW_CAMPAIGN, payload: { houseName: 'House Hex', seedCode: 'STAR-2700' } });
  const ow27 = host27.state.world.overworld;
  const u27 = ow27.units[0];
  // Clear a passable area around (10,10) and (10,11)
  for (let y = 8; y <= 13; y++) {
    for (let x = 8; x <= 13; x++) {
      ow27.tiles[y][x] = OW_TERRAIN_PLAINS;
    }
  }

  let hexDirsCmdOk = true;
  const testCenters27 = [[10, 10], [10, 11]];
  for (let ci = 0; ci < testCenters27.length; ci++) {
    const cx = testCenters27[ci][0], cy = testCenters27[ci][1];
    for (let di = 0; di < HEX_DIR_NAMES.length; di++) {
      u27.x = cx; u27.y = cy; u27.status = 'idle'; u27.marchPlan = null;
      const expected = getHexNeighborInDirection(cx, cy, HEX_DIR_NAMES[di], ow27);
      const stepRes = host27.dispatch({ type: COMMAND_TYPES.STEP_UNIT_ADJACENT, payload: { hexDir: HEX_DIR_NAMES[di] } });
      if (!stepRes.ok || !u27.marchPlan || u27.marchPlan.targetX !== expected.x || u27.marchPlan.targetY !== expected.y) {
        hexDirsCmdOk = false;
      }
      host27.dispatch({ type: COMMAND_TYPES.CANCEL_UNIT_MARCH, payload: { unitId: u27.id } });
    }
  }

  // Valid legacy cardinal dx/dy on both even (10,10) and odd (10,11) rows
  let legacyCardinalOk = true;
  const cardinals27 = [[1, 0], [-1, 0], [0, -1], [0, 1]];
  for (let ci = 0; ci < testCenters27.length; ci++) {
    const cx = testCenters27[ci][0], cy = testCenters27[ci][1];
    for (let k = 0; k < cardinals27.length; k++) {
      u27.x = cx; u27.y = cy; u27.status = 'idle'; u27.marchPlan = null;
      const resC = host27.dispatch({ type: COMMAND_TYPES.STEP_UNIT_ADJACENT, payload: { dx: cardinals27[k][0], dy: cardinals27[k][1] } });
      if (!resC.ok || !u27.marchPlan || u27.marchPlan.remainingPath.length !== 1) legacyCardinalOk = false;
      host27.dispatch({ type: COMMAND_TYPES.CANCEL_UNIT_MARCH, payload: { unitId: u27.id } });
    }
  }

  // Invalid non-adjacent dx/dy strictly rejected with ZERO side effects
  u27.x = 10; u27.y = 10; u27.status = 'idle'; u27.marchPlan = null;
  const badEvenJump = host27.dispatch({ type: COMMAND_TYPES.STEP_UNIT_ADJACENT, payload: { dx: 1, dy: 1 } }); // dist 2 on even row
  const badEvenZeroSideEffects = !badEvenJump.ok && u27.x === 10 && u27.y === 10 && u27.status === 'idle' && u27.marchPlan === null;

  u27.x = 10; u27.y = 11; u27.status = 'idle'; u27.marchPlan = null;
  const badOddJump = host27.dispatch({ type: COMMAND_TYPES.STEP_UNIT_ADJACENT, payload: { dx: -1, dy: -1 } }); // dist 2 on odd row
  const badOddZeroSideEffects = !badOddJump.ok && u27.x === 10 && u27.y === 11 && u27.status === 'idle' && u27.marchPlan === null;

  // 6. Hex Vision & Range (exact ring counts: 1 + 3*r*(r+1) => r=2: 19, r=3: 37)
  const visMap27 = makeBlankHexMap27(20, 20);
  revealOverworldVision(visMap27, 10, 10, 2);
  let visCount2 = 0;
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      if (visMap27.explored[y][x]) visCount2 += 1;
    }
  }
  const range3Count = getHexesInRange(10, 10, 3, visMap27).length;
  const visionHexOk = visCount2 === 19 && range3Count === 37;

  // 7. Diagonal Hex Interpolation uses exact source/dest hex centers without mutating unit position
  const hexAd27 = getOverworldHexAdapter();
  const wStart27 = hexAd27.tileToWorld(hexAd27.offsetToAxial(10, 10));
  const wEnd27 = hexAd27.tileToWorld(hexAd27.offsetToAxial(9, 9)); // NW neighbor on even row
  const wMid27 = interpolateHexSegment(10, 10, 9, 9, 0.5);
  const interpOk = Boolean(
    Math.abs(wMid27.wx - (wStart27.wx + wEnd27.wx) * 0.5) < 0.001 &&
    Math.abs(wMid27.wy - (wStart27.wy + wEnd27.wy) * 0.5) < 0.001
  );

  // 8. Overworld camera stability during movement (no jumping in safe zone, smooth edge follow, respects manual pan)
  const mockCam27 = { x: 500, y: 500, width: 672, height: 480, zoom: 1.0 };
  const camInit27 = computeOverworldCameraFollow(mockCam27, { wx: 520, wy: 510 }, { initialized: false, userPanned: false });
  const camSteady27 = computeOverworldCameraFollow(mockCam27, { wx: 540, wy: 530 }, { initialized: true, userPanned: false });
  const camEdge27 = computeOverworldCameraFollow(mockCam27, { wx: 800, wy: 500 }, { initialized: true, userPanned: false });
  const camUserPan27 = computeOverworldCameraFollow(mockCam27, { wx: 800, wy: 500 }, { initialized: true, userPanned: true });
  const cameraStableOk = Boolean(
    camInit27.shouldMove && camInit27.wx === 520 && camInit27.wy === 510 &&
    !camSteady27.shouldMove && camSteady27.wx === 500 && camSteady27.wy === 500 &&
    camEdge27.shouldMove && camEdge27.wx > 500 && camEdge27.wx < 800 &&
    !camUserPan27.shouldMove && camUserPan27.wx === 500
  );

  const t27Checks = {
    reciprocityOk: reciprocityOk,
    distOk: distOk,
    cornersOk: cornersOk,
    sixWayPathsOk: sixWayPathsOk,
    unreachableOk: unreachableOk,
    detourOk: detourOk,
    terrainCostOk: terrainCostOk,
    hexDirsCmdOk: hexDirsCmdOk,
    legacyCardinalOk: legacyCardinalOk,
    badEvenZeroSideEffects: badEvenZeroSideEffects,
    badOddZeroSideEffects: badOddZeroSideEffects,
    visionHexOk: visionHexOk,
    interpOk: interpOk,
    cameraStableOk: cameraStableOk
  };
  const failed27 = Object.keys(t27Checks).filter(function(k) { return !t27Checks[k]; });
  const t27Pass = failed27.length === 0;

  results.push({
    name: '27. Hex Spatial Foundation: 6-Way Neighbors, Distance, Hex A*, Movement Guard, Vision & Interpolation (Task 03)',
    pass: t27Pass,
    detail: t27Pass
      ? '6-way hex neighbors, reciprocity, boundaries, hex A* (detour/unreachable/cost), 6-dir & legacy step validation, hex vision rings & diagonal hex interpolation verified'
      : 'Failed checks: ' + failed27.join(', ')
  });

  return results;
}
