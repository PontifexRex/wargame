// Hero Recruitment Metadata Catalog (HR-11)
// Separates Wargame recruitment-specific metadata (costs, timers, icons, specialty copy)
// from canonical hero class definitions owned by src/data/classes.js (CLASSES).
// Canonical identity (name, title, color) and base attributes (str, dex, int, vit)
// are always resolved from CLASSES rather than duplicated here.

import { CLASSES } from '../../data/classes.js';
import { BASE_HERO_RECRUIT_DURATION_MS } from '../constants.js';

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
