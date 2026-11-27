// Hero Recruitment Metadata Catalog (HR-11)
// Separates Wargame recruitment-specific metadata (costs, timers, icons, specialty copy)
// from canonical hero class definitions owned by src/data/classes.js (CLASSES).
// Canonical identity (name, title, color) and base attributes (str, dex, int, vit)
// are always resolved from CLASSES rather than duplicated here.

import { CLASSES } from '../../data/classes.js';
import {
  BASE_HERO_RECRUIT_DURATION_MS,
  BASE_MAX_HERO_ROSTER,
  BASE_RECRUIT_QUEUE_LIMIT
} from '../constants.js';
import { getCityRecruitableClasses } from './buildings.js';

export const HERO_RECRUITMENT_ELIGIBILITY_STATES = {
  ELIGIBLE: 'eligible',
  NO_CITY: 'no_city',
  UNKNOWN_CLASS: 'unknown_class',
  LOCKED_BUILDING: 'locked_building',
  ROSTER_FULL: 'roster_full',
  QUEUE_FULL: 'queue_full',
  INSUFFICIENT_RESOURCES: 'insufficient_resources'
};

export const HERO_RECRUITMENT_ORDER = [
  'adventurer',
  'fighter',
  'ranger',
  'mage',
  'thief',
  'cleric',
  'paladin'
];

// Recruitment-specific metadata keyed by canonical classId.
// Note: overworldCombatPreview retains the existing prototype Overworld skirmish/card
// hp/mp/atk/def snapshot temporarily until a shared derived-stat calculator is introduced
// after stat-system design is finalized. It is NOT an independent class definition.
export const HERO_RECRUITMENT_CATALOG = {
  adventurer: {
    classId: 'adventurer',
    icon: '🧭',
    costGold: 35,
    costFood: 20,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Versatile dungeon delver trained at the Adventurers Guild: Torch Flare stun, extra vision, and reinforced mining.',
    overworldCombatPreview: { hp: 160, mp: 68, atk: 24, def: 14 }
  },
  fighter: {
    classId: 'fighter',
    icon: '🛡️',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Frontline bastion defence, Whirlwind Cleave, and door breaching.',
    overworldCombatPreview: { hp: 186, mp: 59, atk: 28, def: 16 }
  },
  ranger: {
    classId: 'ranger',
    icon: '🏹',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: '+2 Overworld Vision, trap disarming, and Starfall Volley.',
    overworldCombatPreview: { hp: 145, mp: 68, atk: 26, def: 12 }
  },
  mage: {
    classId: 'mage',
    icon: '✨',
    costGold: 60,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'High-area Starfall Nova and arcane rune-seal dispelling.',
    overworldCombatPreview: { hp: 122, mp: 131, atk: 31, def: 10 }
  },
  thief: {
    classId: 'thief',
    icon: '🗡️',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Master lockpicking, secret door discovery, and Shadowstep Strike.',
    overworldCombatPreview: { hp: 130, mp: 78, atk: 27, def: 11 }
  },
  cleric: {
    classId: 'cleric',
    icon: '✝️',
    costGold: 55,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Entry-level Temple Chapterhouse healer, blessing wards, and undead turning.',
    overworldCombatPreview: { hp: 162, mp: 105, atk: 22, def: 15 }
  },
  paladin: {
    classId: 'paladin',
    icon: '☀️',
    costGold: 65,
    costFood: 35,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Temple Chapterhouse Tier-2 Champion: Aura of Radiance, Holy Smite, and Divine Intervention.',
    overworldCombatPreview: { hp: 195, mp: 86, atk: 27, def: 20 }
  }
};

export function isClassRecruitable(classId) {
  return Boolean(classId && HERO_RECRUITMENT_CATALOG[classId] && CLASSES[classId]);
}

// Composes a recruitment descriptor by resolving canonical class identity & base attributes
// from CLASSES and merging recruitment-only metadata from HERO_RECRUITMENT_CATALOG.
export function getRecruitableHeroEntry(classId) {
  if (!classId) return null;
  const rec = HERO_RECRUITMENT_CATALOG[classId];
  const cls = CLASSES[classId];
  if (!rec || !cls) return null;

  const canonicalAttrs = cls.baseStats || { str: 10, dex: 10, int: 10, vit: 10 };
  const preview = rec.overworldCombatPreview || { hp: cls.hpBase || 100, mp: cls.mpBase || 40, atk: 12, def: 8 };

  return {
    classId: cls.id,
    name: cls.name,
    title: cls.title,
    color: cls.color,
    icon: rec.icon,
    costGold: rec.costGold,
    costFood: rec.costFood,
    durationMs: rec.durationMs || BASE_HERO_RECRUIT_DURATION_MS,
    specialty: rec.specialty,
    baseAttributes: {
      str: canonicalAttrs.str,
      dex: canonicalAttrs.dex,
      int: canonicalAttrs.int,
      vit: canonicalAttrs.vit
    },
    baseStats: {
      str: canonicalAttrs.str,
      dex: canonicalAttrs.dex,
      int: canonicalAttrs.int,
      vit: canonicalAttrs.vit,
      hp: preview.hp,
      mp: preview.mp,
      atk: preview.atk,
      def: preview.def
    }
  };
}

export function getAllRecruitableHeroEntries() {
  const out = [];
  for (let i = 0; i < HERO_RECRUITMENT_ORDER.length; i++) {
    const entry = getRecruitableHeroEntry(HERO_RECRUITMENT_ORDER[i]);
    if (entry) out.push(entry);
  }
  return out;
}

// Pure, deterministic recruitment eligibility evaluator (HR-12).
// Uses canonical CLASSES, HERO_RECRUITMENT_CATALOG, and building unlocks from buildings.js.
// Preserves all existing recruitment rules, caps, costs, and error messages.
export function evaluateHeroRecruitmentEligibility(city, world, classId) {
  if (!city) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.NO_CITY,
      reason: 'You must found a Bastion City before recruiting heroes',
      classDef: null
    };
  }

  const classDef = getRecruitableHeroEntry(classId);
  if (!classDef) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.UNKNOWN_CLASS,
      reason: 'Unknown hero class: ' + classId,
      classDef: null
    };
  }

  const unlockedClasses = getCityRecruitableClasses(city);
  if (unlockedClasses.indexOf(classId) === -1) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.LOCKED_BUILDING,
      reason: 'Build or upgrade the required Guild Hall / Chapterhouse to recruit ' + classDef.name,
      classDef: classDef
    };
  }

  const recruitQueue = Array.isArray(city.recruitmentQueue) ? city.recruitmentQueue : [];
  const heroesList = (world && Array.isArray(world.heroes)) ? world.heroes : [];
  const maxHeroes = (world && world.roster && world.roster.maxHeroes)
    ? world.roster.maxHeroes
    : (BASE_MAX_HERO_ROSTER || 3);
  const totalActiveAndQueued = heroesList.length + recruitQueue.length;
  if (totalActiveAndQueued >= maxHeroes) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.ROSTER_FULL,
      reason: 'Hero roster is full (' + totalActiveAndQueued + '/' + maxHeroes + '). Dismiss a Hero before recruiting another.',
      classDef: classDef
    };
  }

  const maxQueue = city.maxRecruitQueueSlots || BASE_RECRUIT_QUEUE_LIMIT || 3;
  if (recruitQueue.length >= maxQueue) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.QUEUE_FULL,
      reason: 'Hero training grounds are full (Maximum ' + maxQueue + ' in training queue)',
      classDef: classDef
    };
  }

  const gold = (city.stockpile && city.stockpile.gold) || 0;
  const food = (city.stockpile && city.stockpile.food) || 0;
  if (gold < classDef.costGold || food < classDef.costFood) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.INSUFFICIENT_RESOURCES,
      reason: 'Insufficient Gold or Food to swear in ' + classDef.name + ' (Need ' + classDef.costGold + ' Gold, ' + classDef.costFood + ' Food)',
      classDef: classDef
    };
  }

  return {
    eligible: true,
    status: HERO_RECRUITMENT_ELIGIBILITY_STATES.ELIGIBLE,
    reason: '',
    classDef: classDef
  };
}
