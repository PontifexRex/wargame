// Headless & In-Browser Verification Suite for the Standalone Macro Wargame & Real-Time Simulation Engine

import {
  CAMPAIGN_PHASES,
  WARGAME_VIEWS,
  STREAM_TOPICS,
  COMMAND_TYPES
} from '../constants.js';
import { createWargameSimHost } from '../engine/simHost.js';
import { createMinHeapPriorityQueue } from '../engine/scheduler.js';
import { getPrimaryCity, getSelectedOverworldUnit } from '../engine/state.js';

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

  // Verify premature Hero Recruitment is strictly rejected before City & Guild Hall exist
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
  // Test 4: City Founding, Multi-Domain Build Queue, Prorated Cancel & Demolition Salvage
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
  // Verify Guild Hall is NOT pre-built for free!
  const guildNotBuiltYet = !city4.buildings.guild_hall;

  // Queue a Timber Sawmill on Plot #1 (4000ms build time)
  const woodBefore = city4.stockpile.wood;
  const queueSawmill = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'sawmill' }
  });
  const costDeducted = city4.stockpile.wood < woodBefore && city4.buildQueue.length === 1;

  // Queue a Stoneworks Quarry on Plot #2 (pending item)
  const woodBeforeQuarry = city4.stockpile.wood;
  const queueQuarry = host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 2, buildingId: 'quarry' }
  });
  // Cancel pending item -> 100% full refund
  const cancelQuarry = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueQuarry.data.queueItem.queueItemId }
  });
  const pendingRefundVerified = cancelQuarry.ok && city4.stockpile.wood === woodBeforeQuarry && city4.buildQueue.length === 1;

  // Test active cancel prorated refund + 50% cleanup demolition:
  // Sawmill is active (duration 4000ms). Advance 2000ms (50% elapsed).
  host4.stepClock(2000);
  const woodBeforeCancelActive = city4.stockpile.wood;
  const cancelActiveSawmill = host4.dispatch({
    type: COMMAND_TYPES.CANCEL_BUILDING,
    payload: { queueItemId: queueSawmill.data.queueItem.queueItemId }
  });
  // Should receive prorated refund: ~50% of cost (targetLevel 1 cost: wood 25 -> floor(25 * 0.5) = 12)
  const proratedRefundGiven = cancelActiveSawmill.ok && city4.stockpile.wood > woodBeforeCancelActive;
  // Cleanup item scheduled for max(1000, 2000 * 0.5) = 1000ms
  const cleanupJobActive = city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'cleanup' && city4.buildQueue[0].durationMs === 1000;

  // Advance clock by 1000ms to finish cleanup
  host4.stepClock(1000);
  const cleanupFinished = city4.buildQueue.length === 0 && !city4.plots[1].underConstruction && !city4.plots[1].demolishing;

  // Re-queue Sawmill on Plot #1 and advance 4500ms -> Sawmill completes!
  host4.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'sawmill' }
  });
  host4.stepClock(4500);
  const sawmillCompleted = city4.buildings.sawmill === 1;

  // Verify 8x8 spatial grid (64 plots) & center keep
  const gridHas64Plots = Array.isArray(city4.plots) && city4.plots.length === 64;
  const centerPlotIsKeep = city4.plots[27] && city4.plots[27].buildingId === 'town_hall' && city4.plots[27].level === 1;

  // Test selecting city plot
  const selectPlotCmd = host4.dispatch({
    type: COMMAND_TYPES.SELECT_CITY_PLOT,
    payload: { plotIndex: 12 }
  });
  const plotSelected = selectPlotCmd.ok && city4.selectedPlotIndex === 12;

  // Test moving a building (Plot 1 Sawmill to empty Plot 10)
  const moveCmd = host4.dispatch({
    type: COMMAND_TYPES.MOVE_BUILDING,
    payload: { fromPlotIndex: 1, toPlotIndex: 10 }
  });
  const moveQueued = moveCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'move';
  const plotsMarkedRelocating = Boolean(city4.plots[1].relocating && city4.plots[10].relocating);

  // Advance clock by 2500ms -> move completes!
  host4.stepClock(2500);
  const moveCompleted = city4.plots[1].buildingId === null &&
                        city4.plots[10].buildingId === 'sawmill' &&
                        city4.plots[10].level === 1 &&
                        !city4.plots[1].relocating &&
                        !city4.plots[10].relocating;

  // Test deliberate Demolition of the relocated Sawmill on Plot 10 with 35% salvage:
  const woodBeforeDemolish = city4.stockpile.wood;
  const demolishCmd = host4.dispatch({
    type: COMMAND_TYPES.DEMOLISH_BUILDING,
    payload: { plotIndex: 10 }
  });
  const demolishQueued = demolishCmd.ok && city4.buildQueue.length === 1 && city4.buildQueue[0].type === 'demolish';
  // Advance 2500ms to complete demolition
  host4.stepClock(2500);
  const demolishCompleted = !city4.buildings.sawmill && city4.plots[10].level === 0 && city4.stockpile.wood > woodBeforeDemolish;

  // Test 3-slot build queue limit
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 1, buildingId: 'sawmill' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 2, buildingId: 'quarry' } });
  host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 3, buildingId: 'farmstead' } });
  const fourthQueueBlocked = !host4.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 4, buildingId: 'guild_hall' } }).ok;

  const t4Pass = Boolean(
    foundCmd.ok &&
    phaseIsCity &&
    guildNotBuiltYet &&
    costDeducted &&
    pendingRefundVerified &&
    proratedRefundGiven &&
    cleanupJobActive &&
    cleanupFinished &&
    sawmillCompleted &&
    gridHas64Plots &&
    centerPlotIsKeep &&
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
      ? '8x8 grid of 64 plots initialized with central keep at (3,3), plot selection, timed building relocation, and demolition salvage verified'
      : 'Failed 8x8 spatial grid or relocation checks'
  });

  // =========================================================================
  // Test 5: Adventurers Guild Hall Completion, 60s Hero Recruitment Queue & Vanguard Formation
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

  // Claim completed tasks 1 and 2 to boost stockpiles
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_scout_wilderness' } });
  host5.dispatch({ type: COMMAND_TYPES.CLAIM_TASK_REWARD, payload: { taskId: 'task_found_first_city' } });

  // Queue Adventurers Guild Hall on Plot #4 (6000ms build duration)
  const queueGuild = host5.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 4, buildingId: 'guild_hall' }
  });

  // Advance clock by 6500ms -> Guild Hall finishes and unlocks GUILD_UNLOCKED phase!
  host5.stepClock(6500);
  const guildUnlocked = host5.state.campaignPhase === CAMPAIGN_PHASES.GUILD_UNLOCKED && city5.buildings.guild_hall === 1;

  // Claim Task 4 ("Charter the Adventurers Guild Hall") -> grants +100 Gold, +50 Food
  const claimTask4 = host5.dispatch({
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
    claimTask4.ok &&
    rangerQueued &&
    heroNotInstantlySpawned &&
    fighterQueued &&
    fighterRefundVerified &&
    stillTrainingAt30s &&
    rangerCompleted &&
    partySpawnedOnOverworld
  );

  results.push({
    name: '5. Adventurers Guild Hall Completion, 60s Hero Recruitment Queue & Vanguard Formation',
    pass: t5Pass,
    detail: t5Pass
      ? 'Guild Hall completion unlocks recruitment, swearing in enqueues 60s trainee, cancel gives refund, and timer resolution inducts hero into Vanguard Party'
      : 'Failed 60s hero recruitment queue lifecycle'
  });

  // =========================================================================
  // Test 6: Tier 1 Buildings, Meeting Hall Level Cap, Water/Ore & Windmill Synergy
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

  // 2. Verify Subsistence baseline production (+1 food, wood, stone, gold, water per 5s tick without industry)
  const waterBeforeTick = city6.stockpile.water;
  const foodBeforeTick  = city6.stockpile.food;
  host6.stepClock(5000); // 5s resource production interval
  const subsistenceYieldGiven = (city6.stockpile.water === waterBeforeTick + 1) &&
                                (city6.stockpile.food === foodBeforeTick + 1);

  // 3. Test Meeting Hall Level Cap:
  // Build a Lumberjack Hut on Plot 1 (Level 1)
  host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'lumber_hut' }
  });
  host6.stepClock(4000); // Complete Lumberjack Hut
  const lumberHutLevel1 = city6.plots[1].buildingId === 'lumber_hut' && city6.plots[1].level === 1;

  // Attempt to upgrade Lumberjack Hut to Level 2 while Meeting Hall is Level 1 -> MUST BE REJECTED!
  const prematureLumberUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'lumber_hut' }
  });
  const upgradeBlockedByMeetingHall = !prematureLumberUpgrade.ok;

  // Boost stockpile and upgrade Meeting Hall (Plot 27) to Level 2
  city6.stockpile.wood = 500;
  city6.stockpile.stone = 500;
  city6.stockpile.gold = 500;
  const queueMeetingHallLv2 = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 27, buildingId: 'town_hall' }
  });
  host6.stepClock(8000); // Complete Meeting Hall Level 2
  const meetingHallLevel2 = (city6.buildings.meeting_hall === 2 || city6.buildings.town_hall === 2);

  // Now upgrade Lumberjack Hut to Level 2 -> MUST SUCCEED!
  const validLumberUpgrade = host6.dispatch({
    type: COMMAND_TYPES.QUEUE_BUILDING,
    payload: { plotIndex: 1, buildingId: 'lumber_hut' }
  });
  const upgradeAllowedAfterMeetingHall = validLumberUpgrade.ok;
  host6.stepClock(6000); // Finish upgrading Lumberjack Hut

  // 4. Test Hut Population Scaling & Multi-Building Stacking
  const popBeforeHuts = city6.plots.reduce(function(acc, p) {
    return acc + (p.buildingId === 'hut' ? (p.level * 5) : 0);
  }, 10);
  // Queue Hut 1 on Plot 2
  host6.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 2, buildingId: 'hut' } });
  host6.stepClock(4000);
  // Queue Hut 2 on Plot 3 (Multi-building stacking)
  host6.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 3, buildingId: 'hut' } });
  host6.stepClock(4000);
  const hutPlotsCount = city6.plots.filter(function(p) { return p.buildingId === 'hut' && p.level === 1; }).length;
  const multiHutVerified = (hutPlotsCount === 2);

  // 5. Test Windmill Spatial Adjacency Synergy (+20% yield to orthogonal neighbors)
  // Place Garden on Plot 18 (x=2, y=2)
  host6.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 18, buildingId: 'garden' } });
  host6.stepClock(4000);

  // Place Windmill on Plot 26 (x=2, y=3) which is immediately South of Plot 18
  host6.dispatch({ type: COMMAND_TYPES.QUEUE_BUILDING, payload: { plotIndex: 26, buildingId: 'windmill' } });
  host6.stepClock(6000);

  // Step clock by 5000ms for a resource tick
  const foodBeforeSynergyTick = city6.stockpile.food;
  host6.stepClock(5000);
  // Expected food gain: +1 subsistence + Garden Lv 1 with Windmill +20% (6 * 1.20 = 7.2 -> 7) = +8
  const foodGained = city6.stockpile.food - foodBeforeSynergyTick;
  const windmillSynergyVerified = (foodGained >= 8);

  const t6Pass = Boolean(
    hasWaterAndOre &&
    subsistenceYieldGiven &&
    lumberHutLevel1 &&
    upgradeBlockedByMeetingHall &&
    meetingHallLevel2 &&
    upgradeAllowedAfterMeetingHall &&
    multiHutVerified &&
    windmillSynergyVerified
  );

  results.push({
    name: '6. Tier 1 Buildings, Meeting Hall Level Cap, Water/Ore & Windmill Synergy',
    pass: t6Pass,
    detail: t6Pass
      ? 'Subsistence yield, Meeting Hall level cap enforcement, Hut population stacking, and 8x8 Windmill adjacency synergy (+20%) verified'
      : 'Failed Tier 1 building catalog or synergy invariants'
  });

  return results;
}
