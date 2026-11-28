// Hero Recruitment Metadata Catalog (HR-11)
// Separates Wargame recruitment-specific metadata (costs, timers, icons, specialty copy)
// from canonical hero class definitions owned by src/data/classes.js (CLASSES).
// Canonical identity (name, title, color) and base attributes (str, dex, int, vit)
// are always resolved from CLASSES rather than duplicated here.

import { CLASSES, DEFAULT_HERO_SPI, normalizeHeroClassId } from '../../data/classes.js';
import { computeHeroDerivedStats, createDefaultBonusStats } from '../../core/heroStats.js';
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
  'bruiser',
  'scout',
  'ranger',
  'mage',
  'thief',
  'acolyte',
  'paladin'
];

// Recruitment-specific metadata keyed by canonical classId.
// Derived baseline stats (HP/MP/ATK/DEF) are computed dynamically from CLASSES + starterGear
// via src/core/heroStats.js — zero static stat snapshots are duplicated here (HR-13).
export const HERO_RECRUITMENT_CATALOG = {
  adventurer: {
    classId: 'adventurer',
    icon: '🧭',
    costGold: 35,
    costFood: 20,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Versatile dungeon delver trained at the Adventurers Guild: Second Wind, Careful Search, Disarm Trap, Lockpicking, and Appraise.'
  },
  bruiser: {
    classId: 'bruiser',
    icon: '🛡️',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Fighters Guild frontline brawler: Power Strike, Cleave, Overpower, Brace, Charge, and Battle Cry.'
  },
  ranger: {
    classId: 'ranger',
    icon: '🏹',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: '+2 Overworld Vision, trap disarming, and Starfall Volley.'
  },
  mage: {
    classId: 'mage',
    icon: '✨',
    costGold: 60,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Mages Guild arcanist: Arcane Missile, Fireball, Frost Nova, Arcane Ward, Blink, and Detect Magic.'
  },
  thief: {
    classId: 'thief',
    icon: '🗡️',
    costGold: 50,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Master lockpicking, secret door discovery, and Shadowstep Strike.'
  },
  acolyte: {
    classId: 'acolyte',
    icon: '✝️',
    costGold: 55,
    costFood: 30,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Entry-tier Temple Chapterhouse devotee: Healing Light, Sacred Flame, Blessing, Purification, Sanctuary, and Divine Sight.'
  },
  paladin: {
    classId: 'paladin',
    icon: '☀️',
    costGold: 65,
    costFood: 35,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Temple Chapterhouse Tier-2 Champion: Aura of Radiance, Holy Smite, and Divine Intervention.'
  },
  scout: {
    classId: 'scout',
    icon: '🌲',
    costGold: 45,
    costFood: 25,
    durationMs: BASE_HERO_RECRUIT_DURATION_MS,
    specialty: 'Rangers Lodge reconnaissance & wilderness specialist: Aimed Shot, Tracking, Camouflage, Snare, Forage, Reconnaissance, and Forced Pace.'
  }
};

export function isClassRecruitable(classId) {
  const normId = normalizeHeroClassId(classId);
  return Boolean(normId && HERO_RECRUITMENT_CATALOG[normId] && CLASSES[normId]);
}

// Composes a recruitment descriptor by resolving canonical class identity, base attributes,
// and derived baseline stats from CLASSES + shared heroStats calculator (HR-11 / HR-13).
export function getRecruitableHeroEntry(classId) {
  if (!classId) return null;
  const normId = normalizeHeroClassId(classId);
  const rec = HERO_RECRUITMENT_CATALOG[normId];
  const cls = CLASSES[normId];
  if (!rec || !cls) return null;

  const canonicalAttrs = cls.baseStats || { str: 10, dex: 10, int: 10, vit: 10, spi: DEFAULT_HERO_SPI };
  const derived = computeHeroDerivedStats({
    classId: cls.id,
    level: 1,
    bonusStats: createDefaultBonusStats(),
    equipment: cls.starterGear || {},
    talentsAllocated: {},
    statuses: []
  });

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
      vit: canonicalAttrs.vit,
      spi: typeof canonicalAttrs.spi === 'number' ? canonicalAttrs.spi : DEFAULT_HERO_SPI
    },
    baseStats: {
      str: canonicalAttrs.str,
      dex: canonicalAttrs.dex,
      int: canonicalAttrs.int,
      vit: canonicalAttrs.vit,
      spi: typeof canonicalAttrs.spi === 'number' ? canonicalAttrs.spi : DEFAULT_HERO_SPI,
      hp: derived ? derived.maxHp : (cls.hpBase || 100),
      mp: derived ? derived.maxMp : (cls.mpBase || 40),
      atk: derived ? derived.atk : 12,
      magicPower: derived ? derived.magicPower : 12,
      def: derived ? derived.def : 8
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

  const normClassId = normalizeHeroClassId(classId);
  const classDef = getRecruitableHeroEntry(normClassId);
  if (!classDef) {
    return {
      eligible: false,
      status: HERO_RECRUITMENT_ELIGIBILITY_STATES.UNKNOWN_CLASS,
      reason: 'Unknown hero class: ' + classId,
      classDef: null
    };
  }

  const unlockedClasses = getCityRecruitableClasses(city);
  if (unlockedClasses.indexOf(normClassId) === -1) {
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
