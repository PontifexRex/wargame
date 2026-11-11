// Reactive Task & Milestone DAG Engine
// Subscribes to WorldEventStream, evaluates task prerequisites & predicates, and manages reward claims.

import { STREAM_TOPICS } from '../constants.js';
import { CAMPAIGN_TASKS_DAG } from '../data/tasks.js';

export function createInitialTasksState() {
  const map = {};
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const isRoot = !tDef.prerequisites || tDef.prerequisites.length === 0;
    map[tDef.id] = {
      id: tDef.id,
      status: isRoot ? 'available' : 'locked', // 'locked' | 'available' | 'completed' | 'claimed'
      progress: 0,
      target: 1,
      completedAtSimMs: null,
      claimedAtSimMs: null
    };
  }
  return map;
}

export function evaluateTaskDAG(state, eventStream) {
  if (!state || !state.world) return [];
  if (!state.world.tasks) {
    state.world.tasks = createInitialTasksState();
  }

  const tasksState = state.world.tasks;
  const simTimeMs = state.world.clock ? state.world.clock.simTimeMs : 0;

  // Pass 1: Unlock tasks whose prerequisites are completed or claimed
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    if (!tasksState[tDef.id]) {
      tasksState[tDef.id] = {
        id: tDef.id,
        status: 'locked',
        progress: 0,
        target: 1,
        completedAtSimMs: null,
        claimedAtSimMs: null
      };
    }

    const entry = tasksState[tDef.id];
    if (entry.status === 'locked') {
      const prereqs = tDef.prerequisites || [];
      let allMet = true;
      for (let p = 0; p < prereqs.length; p++) {
        const preEntry = tasksState[prereqs[p]];
        if (!preEntry || (preEntry.status !== 'completed' && preEntry.status !== 'claimed')) {
          allMet = false;
          break;
        }
      }
      if (allMet) {
        entry.status = 'available';
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.TASK_UNLOCKED, {
            taskId: tDef.id,
            title: tDef.title
          }, simTimeMs);
        }
      }
    }
  }

  // Pass 2: Evaluate progress & completion for all unlocked tasks
  let newlyCompleted = false;
  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const entry = tasksState[tDef.id];
    if (entry.status === 'locked') continue;

    const evalRes = tDef.evaluate(state);
    const prevProgress = entry.progress;
    entry.progress = evalRes.progress;
    entry.target = evalRes.target;

    if (entry.status === 'available') {
      if (evalRes.completed) {
        entry.status = 'completed';
        entry.completedAtSimMs = simTimeMs;
        newlyCompleted = true;
        if (eventStream) {
          eventStream.publish(STREAM_TOPICS.TASK_COMPLETED, {
            taskId: tDef.id,
            title: tDef.title,
            rewardLabel: tDef.rewardLabel
          }, simTimeMs);
        }
      } else if (entry.progress !== prevProgress && eventStream) {
        eventStream.publish(STREAM_TOPICS.TASK_PROGRESS, {
          taskId: tDef.id,
          title: tDef.title,
          progress: entry.progress,
          target: entry.target
        }, simTimeMs);
      }
    }
  }

  // If a task completed, run one more unlock check so downstream tasks immediately unlock
  if (newlyCompleted) {
    for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
      const tDef = CAMPAIGN_TASKS_DAG[i];
      const entry = tasksState[tDef.id];
      if (entry.status === 'locked') {
        const prereqs = tDef.prerequisites || [];
        let allMet = true;
        for (let p = 0; p < prereqs.length; p++) {
          const preEntry = tasksState[prereqs[p]];
          if (!preEntry || (preEntry.status !== 'completed' && preEntry.status !== 'claimed')) {
            allMet = false;
            break;
          }
        }
        if (allMet) {
          entry.status = 'available';
          const evalRes = tDef.evaluate(state);
          entry.progress = evalRes.progress;
          entry.target = evalRes.target;
          if (evalRes.completed) {
            entry.status = 'completed';
            entry.completedAtSimMs = simTimeMs;
          }
          if (eventStream) {
            eventStream.publish(STREAM_TOPICS.TASK_UNLOCKED, {
              taskId: tDef.id,
              title: tDef.title
            }, simTimeMs);
          }
        }
      }
    }
  }

  return getFormattedTasksList(state);
}

export function getFormattedTasksList(state) {
  if (!state || !state.world || !state.world.tasks) return [];
  const tasksState = state.world.tasks;
  const list = [];

  for (let i = 0; i < CAMPAIGN_TASKS_DAG.length; i++) {
    const tDef = CAMPAIGN_TASKS_DAG[i];
    const entry = tasksState[tDef.id] || { status: 'locked', progress: 0, target: 1 };
    list.push({
      id: tDef.id,
      title: tDef.title,
      desc: tDef.desc,
      category: tDef.category,
      prerequisites: tDef.prerequisites || [],
      rewardLabel: tDef.rewardLabel,
      reward: tDef.reward,
      status: entry.status,
      progress: entry.progress,
      target: entry.target,
      readyToClaim: entry.status === 'completed'
    });
  }

  return list;
}
