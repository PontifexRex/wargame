// Reactive Event-Driven Guided Tasks & Campaign Milestones DAG (Directed Acyclic Graph)
// Tasks subscribe to STREAM_TOPICS and transition: LOCKED -> AVAILABLE -> COMPLETED -> CLAIMED

import { STREAM_TOPICS } from '../constants.js';

export const CAMPAIGN_TASKS_DAG = [
  {
    id: 'task_scout_wilderness',
    title: '1. Pioneer Reconnaissance',
    category: 'exploration',
    prerequisites: [],
    triggerTopics: [STREAM_TOPICS.UNIT_MARCH_STEP, STREAM_TOPICS.UNIT_MARCH_COMPLETED, STREAM_TOPICS.CITY_FOUNDED],
    desc: 'March your Pioneer Settler across the Overworld to survey the surrounding frontier (move at least 2 tiles).',
    rewardLabel: '+40 Wood, +30 Food',
    reward: { wood: 40, food: 30 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 2 };
      const steps = state.world.stats.totalUnitSteps || 0;
      const cityCount = Object.keys(state.world.cities || {}).length;
      const prog = cityCount > 0 ? 2 : Math.min(2, steps);
      return { completed: prog >= 2, progress: prog, target: 2 };
    }
  },
  {
    id: 'task_found_first_city',
    title: '2. Found Your Settlement',
    category: 'settlement',
    prerequisites: [],
    triggerTopics: [STREAM_TOPICS.CITY_FOUNDED],
    desc: 'Position your Pioneer Settler on a fertile site and establish your initial settlement with its Meeting Hall.',
    rewardLabel: '+60 Wood, +60 Stone, +50 Gold',
    reward: { wood: 60, stone: 60, gold: 50 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 1 };
      const count = Object.keys(state.world.cities || {}).length;
      return { completed: count >= 1, progress: Math.min(1, count), target: 1 };
    }
  },
  {
    id: 'task_build_first_hut',
    title: '3. Expand the Settlement',
    category: 'civic',
    prerequisites: ['task_found_first_city'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Now that you founded your first city, you have to grow it. Build a Hut to attract more people.',
    rewardLabel: '+40 Wood, +30 Food',
    reward: { wood: 40, food: 30 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const c = cities[i];
        const hasHut = (c.plots || []).some(function(p) { return p.buildingId === 'hut' && (p.level || 0) >= 1; }) ||
                       ((c.buildings && c.buildings.hut) || 0) >= 1;
        if (hasHut) return { completed: true, progress: 1, target: 1 };
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_garden',
    title: '4. Cultivate Food',
    category: 'economy',
    prerequisites: ['task_build_first_hut'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'As population grows, demands on food increase. Construct a Garden to produce food and prevent starvation.',
    rewardLabel: '+40 Wood, +30 Stone',
    reward: { wood: 40, stone: 30 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if ((b.garden && b.garden >= 1) || (b.farmstead && b.farmstead >= 1)) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_well',
    title: '5. Fresh Water Supply',
    category: 'civic',
    prerequisites: ['task_build_garden'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Dig a Well to supply clean drinking water for your citizens and support growth.',
    rewardLabel: '+30 Wood, +40 Stone, +20 Gold',
    reward: { wood: 30, stone: 40, gold: 20 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.well && b.well >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_grow_population_12',
    title: '6. Frontier Growth',
    category: 'civic',
    prerequisites: ['task_build_well'],
    triggerTopics: [STREAM_TOPICS.RESOURCE_TICK, STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Build additional Huts and keep food and water stocked to grow your population to 12 citizens.',
    rewardLabel: '+50 Wood, +50 Stone',
    reward: { wood: 50, stone: 50 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 12 };
      const cities = Object.values(state.world.cities);
      let maxCurrent = 5;
      for (let i = 0; i < cities.length; i++) {
        const pop = cities[i].population ? cities[i].population.current : 5;
        if (pop > maxCurrent) maxCurrent = pop;
      }
      const prog = Math.min(12, maxCurrent);
      return { completed: prog >= 12, progress: prog, target: 12 };
    }
  },
  {
    id: 'task_build_lumber_camp',
    title: '7. Timber Industry',
    category: 'economy',
    prerequisites: ['task_grow_population_12'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'With 12 citizens in town, construct a Lumber Camp to supply sturdy construction timber.',
    rewardLabel: '+60 Wood, +40 Stone',
    reward: { wood: 60, stone: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if ((b.lumber_camp && b.lumber_camp >= 1) || (b.lumber_hut && b.lumber_hut >= 1) || (b.sawmill && b.sawmill >= 1)) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_quarry',
    title: '8. Stone Quarrying',
    category: 'economy',
    prerequisites: ['task_build_lumber_camp'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Grow population to 15 and construct a Quarry to cut heavy granite stone blocks.',
    rewardLabel: '+50 Wood, +60 Stone, +40 Gold',
    reward: { wood: 50, stone: 60, gold: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.quarry && b.quarry >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_build_guild_hall',
    title: '9. Charter the Adventurers Guild',
    category: 'military',
    prerequisites: ['task_build_quarry'],
    triggerTopics: [STREAM_TOPICS.BUILDING_COMPLETED],
    desc: 'Grow population to 20 and construct the Adventurers Guild to unlock Hero recruitment.',
    rewardLabel: '+100 Gold, +50 Food (Unlocks Heroes)',
    reward: { gold: 100, food: 50 },
    evaluate: function(state) {
      if (!state || !state.world || !state.world.cities) return { completed: false, progress: 0, target: 1 };
      const cities = Object.values(state.world.cities);
      for (let i = 0; i < cities.length; i++) {
        const b = cities[i].buildings || {};
        if (b.guild_hall && b.guild_hall >= 1) {
          return { completed: true, progress: 1, target: 1 };
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  },
  {
    id: 'task_recruit_first_hero',
    title: '10. Swear In Your First Hero',
    category: 'military',
    prerequisites: ['task_build_guild_hall'],
    triggerTopics: [STREAM_TOPICS.HERO_RECRUITED, STREAM_TOPICS.PARTY_FORMED],
    desc: 'Recruit your first Hero at the Adventurers Guild to lead expeditionary parties.',
    rewardLabel: '+75 Gold, +40 Wood, +40 Stone',
    reward: { gold: 75, wood: 40, stone: 40 },
    evaluate: function(state) {
      if (!state || !state.world || !Array.isArray(state.world.heroes)) {
        return { completed: false, progress: 0, target: 1 };
      }
      const count = state.world.heroes.length;
      return { completed: count >= 1, progress: Math.min(1, count), target: 1 };
    }
  },
  {
    id: 'task_march_to_dungeon',
    title: '11. March to the Starfall Vaults',
    category: 'delve',
    prerequisites: ['task_recruit_first_hero'],
    triggerTopics: [STREAM_TOPICS.UNIT_MARCH_STEP, STREAM_TOPICS.UNIT_MARCH_COMPLETED, STREAM_TOPICS.DUNGEON_ENTERED],
    desc: 'March your Hero Party across the Overworld to the Starfall Vaults entrance (Ω) and breach the subterranean gates.',
    rewardLabel: '+150 Gold, Campaign Milestone Complete',
    reward: { gold: 150 },
    evaluate: function(state) {
      if (!state || !state.world) return { completed: false, progress: 0, target: 1 };
      if (state.world.stats && state.world.stats.dungeonsEntered > 0) {
        return { completed: true, progress: 1, target: 1 };
      }
      const pois = (state.world.overworld && state.world.overworld.pois) || [];
      const dngPoi = pois.find(function(p) { return p.type === 'dungeon_entrance'; });
      const units = (state.world.overworld && state.world.overworld.units) || [];
      if (dngPoi) {
        for (let i = 0; i < units.length; i++) {
          const u = units[i];
          if (u.alive && u.unitType === 'hero_party' && Math.hypot(u.x - dngPoi.x, u.y - dngPoi.y) <= 1.5) {
            return { completed: true, progress: 1, target: 1 };
          }
        }
      }
      return { completed: false, progress: 0, target: 1 };
    }
  }
];
