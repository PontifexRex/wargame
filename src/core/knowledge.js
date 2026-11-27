// Categorized Hero Knowledge Foundation & Monster Knowledge Reveal (HR-13)
// Knowledge is a developable capability family, NOT a sixth foundational attribute.
// INT supports reasoning/checks without substituting for topic expertise.

export const KNOWLEDGE_CATEGORIES = [
  'monster_knowledge',
  'object_item_knowledge',
  'flora_knowledge',
  'fauna_knowledge'
];

export function createDefaultHeroKnowledge() {
  return {
    monster_knowledge: 0,
    object_item_knowledge: 0,
    flora_knowledge: 0,
    fauna_knowledge: 0
  };
}

// Idempotent, non-destructive normalizer preserving fractional/numeric ranks
export function normalizeHeroKnowledge(rawKnowledge) {
  const out = createDefaultHeroKnowledge();
  if (!rawKnowledge || typeof rawKnowledge !== 'object' || Array.isArray(rawKnowledge)) {
    return out;
  }
  const existingKeys = Object.keys(rawKnowledge);
  for (let i = 0; i < existingKeys.length; i++) {
    const k = existingKeys[i];
    const v = rawKnowledge[k];
    if (typeof v === 'number' && isFinite(v) && v >= 0) {
      out[k] = v;
    }
  }
  return out;
}

export function grantHeroKnowledge(hero, categoryKey, delta) {
  if (!hero || typeof hero !== 'object' || !categoryKey) return 0;
  const amount = Number(delta);
  if (!isFinite(amount) || amount <= 0) return 0;
  hero.knowledge = normalizeHeroKnowledge(hero.knowledge);
  const prev = typeof hero.knowledge[categoryKey] === 'number' ? hero.knowledge[categoryKey] : 0;
  hero.knowledge[categoryKey] = Math.round((prev + amount) * 1000) / 1000;
  return hero.knowledge[categoryKey];
}

// Practical Monster Knowledge gameplay use: enemy inspection / reveal tiers.
// Combines topic rank (monster_knowledge) with modest INT reasoning support
// (INT assists checks, capped so raw INT alone does not replace Monster Knowledge).
export function evaluateMonsterKnowledgeReveal(hero, monster) {
  if (!monster || typeof monster !== 'object') {
    return { tier: 0, effectiveScore: 0, summary: '' };
  }
  const knowledge = normalizeHeroKnowledge(hero && hero.knowledge);
  const topicRank = knowledge.monster_knowledge || 0;
  const heroInt = (hero && typeof hero.computedInt === 'number')
    ? hero.computedInt
    : ((hero && hero.stats && typeof hero.stats.int === 'number') ? hero.stats.int : 10);

  // INT provides modest reasoning support (up to +2), while topic expertise drives deeper tiers
  const intSupport = Math.min(2, Math.floor(Math.max(0, heroInt - 8) / 5));
  const effectiveScore = topicRank + intSupport;

  // Tier 0: baseline observation (score < 2)
  // Tier 1 (score >= 2): reveals archetype / threat classification
  // Tier 2 (score >= 4): reveals trait / on-hit / elite affix insight
  // Tier 3 (score >= 6): reveals tactical counter / weakness note
  let tier = 0;
  if (effectiveScore >= 6 && topicRank >= 4) tier = 3;
  else if (effectiveScore >= 4 && topicRank >= 2) tier = 2;
  else if (effectiveScore >= 2 && topicRank >= 0.5) tier = 1;

  const isBoss = Boolean(monster.isBoss || (typeof monster.id === 'string' && monster.id.indexOf('boss_') === 0));
  const isElite = Boolean(monster.affix && monster.affix.name);
  const threatLabel = isBoss ? 'Boss Guardian' : (isElite ? ('Elite (' + monster.affix.name + ')') : (monster.ranged ? 'Ranged Skirmisher' : 'Melee Hostile'));

  let traitNote = null;
  if (tier >= 2) {
    if (monster.affix && monster.affix.desc) {
      traitNote = monster.affix.name + ': ' + monster.affix.desc;
    } else if (monster.onHitStatus) {
      traitNote = 'Inflicts ' + monster.onHitStatus + ' on hit';
    } else if (monster.ranged) {
      traitNote = 'Attacks from range (85% ATK)';
    } else {
      traitNote = 'Standard melee attacker (DEF ' + (monster.def || 0) + ')';
    }
  }

  let tacticalTip = null;
  if (tier >= 3) {
    if (monster.affix && monster.affix.id === 'reflective') {
      tacticalTip = 'Weakness: burst or heal through 25% thorns reflection.';
    } else if ((monster.def || 0) >= 8) {
      tacticalTip = 'Weakness: armored — high-DEF target favors magic, crits, or DEF pierce.';
    } else if (monster.ranged) {
      tacticalTip = 'Weakness: close distance or break line-of-sight behind walls.';
    } else {
      tacticalTip = 'Tactical: watch HP threshold (' + (monster.hp || 0) + '/' + (monster.maxHp || 0) + ') and stun/control windows.';
    }
  }

  const parts = [];
  if (tier >= 1) parts.push('Lore T' + tier + ': ' + threatLabel);
  if (traitNote) parts.push(traitNote);
  if (tacticalTip) parts.push(tacticalTip);

  return {
    tier: tier,
    topicRank: topicRank,
    intSupport: intSupport,
    effectiveScore: effectiveScore,
    threatLabel: tier >= 1 ? threatLabel : null,
    traitNote: traitNote,
    tacticalTip: tacticalTip,
    summary: parts.join(' • ')
  };
}
