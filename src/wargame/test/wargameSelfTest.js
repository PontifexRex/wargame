// Headless & In-Browser Verification Suite for the Standalone Macro Wargame & Real-Time Simulation Engine

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS,
  COMMAND_TYPES
} from '../constants.js';
import { createWargameSimHost } from '../engine/simHost.js';
import { createMinHeapPriorityQueue } from '../engine/scheduler.js';
import { getPrimaryCity, getSelectedOverworldUnit, computeCityPopulation, computeCityStorageSlotCapacity } from '../engine/state.js';
import { computeBuildingDurationMs, isBuildingPrerequisiteMet, computeMaxPartySize, getCityRecruitableClasses } from '../data/buildings.js';
import {
  normalizeSharedHeroProfile,
  renderSharedPaperDollMannequin,
  SHARED_PAPER_DOLL_SLOTS,
  COSMETIC_SLOTS
} from '../../ui/shared/characterSheet.js';

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

  // Start training a Ranger Hero (60,000ms training queue)
  const recruitRanger = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'ranger', heroName: 'Sylvanas Pathfinder' }
  });
  const rangerQueued = recruitRanger.ok && city5.recruitmentQueue.length === 1 && city5.recruitmentQueue[0].status === 'training';
  const heroNotInstantlySpawned = host5.state.world.heroes.length === 0;

  // Queue a 2nd trainee (Fighter) and test recruitment cancel prorated refund
  const goldBeforeFighter = city5.stockpile.gold;
  const recruitFighter = host5.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'fighter', heroName: 'Garrick Ironheart' }
  });
  const fighterQueued = recruitFighter.ok && city5.recruitmentQueue.length === 2 && city5.recruitmentQueue[1].status === 'queued';

  // Cancel queued fighter -> 100% full refund
  const cancelFighter = host5.dispatch({
    type: COMMAND_TYPES.CANCEL_RECRUITMENT,
    payload: { queueItemId: recruitFighter.data.queueItem.queueItemId }
  });
  const fighterRefundVerified = cancelFighter.ok && city5.stockpile.gold === goldBeforeFighter && city5.recruitmentQueue.length === 1;

  // Advance clock by 30,000ms -> Ranger still in training!
  host5.stepClock(30000);
  const stillTrainingAt30s = host5.state.world.heroes.length === 0 && city5.recruitmentQueue.length === 1;

  // Advance clock by remaining 30,000ms (total 60,000ms elapsed) -> Ranger training finishes!
  host5.stepClock(30000);
  const rangerCompleted = city5.recruitmentQueue.length === 0 && host5.state.world.heroes.length === 1 && host5.state.world.heroes[0].classId === 'ranger';
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

  // Recruit Fighter Hero & advance 60s
  host7.dispatch({
    type: COMMAND_TYPES.RECRUIT_HERO,
    payload: { classId: 'fighter', heroName: 'Aldric Vanguard' }
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

  // 8B. Astral Recall Scroll Express Extraction -> instant teleport to City & immediate bank
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
  const recallExpressVerified = Boolean(
    recallReturn.ok &&
    recallReturn.data.expressReturn === true &&
    party7.x === city7.x &&
    party7.y === city7.y &&
    party7.status === 'idle' &&
    city7.stockpile.gold === goldBeforeRecall + 80
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
    recallExpressVerified: recallExpressVerified,
    defeatRecoveryVerified: defeatRecoveryVerified
  };
  const failed8 = Object.keys(t8Checks).filter(function(k) { return !t8Checks[k]; });
  const t8Pass = failed8.length === 0;

  results.push({
    name: '8. Dungeon Extraction Return March, Cargo Banking, Recall Scroll & Defeat Recovery',
    pass: t8Pass,
    detail: t8Pass
      ? 'Floor 1 extraction return march & cargo banking, Astral Recall Scroll express teleport, and Golden Rule #2 defeat rescue verified'
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

  return results;
}
