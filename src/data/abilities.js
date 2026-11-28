// Shared Context-Independent Spell, Prayer, Martial Technique & Adventuring Skill Catalog (MG-01A / MG-01B)
// Complete 32-entry approved entry-tier catalog across Bruiser (fighter), Mage (mage),
// Acolyte (cleric), Scout (scout), and Adventurer (adventurer), plus preserved legacy class skills.

export const ABILITY_DOMAINS = Object.freeze({
  ARCANE: 'arcane',
  DIVINE: 'divine',
  NATURE: 'nature',
  MARTIAL: 'martial',
  ADVENTURING: 'adventuring'
});

export const ABILITY_KINDS = Object.freeze({
  SPELL: 'spell',
  PRAYER: 'prayer',
  TECHNIQUE: 'technique',
  SKILL: 'skill',
  POWER: 'power'
});

export const ABILITY_ACCESS_SOURCES = Object.freeze([
  'class',
  'learned',
  'item',
  'temporary'
]);

export const CLEANSEABLE_STATUS_IDS = Object.freeze([
  'burn',
  'poison',
  'bleed',
  'weakened',
  'chilled',
  'slow',
  'silence',
  'disrupted',
  'rooted'
]);

export const ABILITIES = Object.freeze({
  // =========================================================================
  // 1. BRUISER (Runtime: fighter) — 6 Martial Skills (Cooldowns, 0 MP)
  // =========================================================================
  power_strike: Object.freeze({
    id: 'power_strike',
    name: 'Power Strike',
    icon: '🪓',
    kind: 'technique',
    domain: 'martial',
    discipline: 'weapon_mastery',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.65, bonusFlat: 4, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'crit_slash', color: '#fb923c' },
    desc: 'Enhanced single-target physical strike dealing 165% ATK + 4 damage (respects Guarding; 0 MP, 2t CD).'
  }),

  cleave: Object.freeze({
    id: 'cleave',
    name: 'Cleave',
    icon: '⚔️',
    kind: 'technique',
    domain: 'martial',
    discipline: 'weapon_mastery',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 3 },
    targeting: {
      mode: 'auto_area',
      pattern: 'radius',
      range: 1.5,
      radius: 1.5,
      requireLos: false,
      filter: 'enemy',
      maxTargets: 8
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.35, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'slash', color: '#f97316' },
    desc: 'Sweeping physical cleave hitting all adjacent enemies for 135% ATK (respects Guarding; 0 MP, 3t CD).'
  }),

  overpower: Object.freeze({
    id: 'overpower',
    name: 'Overpower',
    icon: '💥',
    kind: 'technique',
    domain: 'martial',
    discipline: 'combat_control',
    purpose: 'control',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 4 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.25, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'knockback', distance: 1, collideStunTurns: 2, collideBonusDmg: 6 }
    ],
    vfx: { type: 'slash', color: '#f59e0b' },
    desc: 'Crushing blow knocking an adjacent enemy back 1 tile; wall collision deals +6 damage and stuns for 2 turns (0 MP, 4t CD).'
  }),

  brace: Object.freeze({
    id: 'brace',
    name: 'Brace',
    icon: '🛡️',
    kind: 'technique',
    domain: 'martial',
    discipline: 'defense',
    purpose: 'defense',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 4 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'none',
    effects: [
      { type: 'status', statusId: 'guarding', duration: 2, targetSelf: true },
      { type: 'status', statusId: 'physical_mitigation', duration: 2, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#60a5fa' },
    desc: 'Temporary physical stance granting Guarding (+60% DEF) and 25% physical damage mitigation for 2 turns (distinct from Arcane Ward absorption; 0 MP, 4t CD).'
  }),

  charge: Object.freeze({
    id: 'charge',
    name: 'Charge',
    icon: '🐂',
    kind: 'technique',
    domain: 'martial',
    discipline: 'vanguard',
    purpose: 'mobility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 4 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 4.2,
      minRange: 1.8,
      radius: 0,
      requireLos: true,
      requireChargePath: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'charge_move' },
      { type: 'damage', mult: 1.5, bonusFlat: 3, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'status', statusId: 'stun', duration: 1 }
    ],
    vfx: { type: 'crit_slash', color: '#f97316' },
    desc: 'Rush along a clear path to an enemy 2–4 tiles away, delivering a 150% physical impact + 1t Stun (0 MP, 4t CD).'
  }),

  battle_cry: Object.freeze({
    id: 'battle_cry',
    name: 'Battle Cry',
    icon: '📯',
    kind: 'technique',
    domain: 'martial',
    discipline: 'command',
    purpose: 'buff',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    groupExtensible: true,
    costs: { mp: 0, cooldown: 5 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'none',
    effects: [
      { type: 'status', statusId: 'battle_cry', duration: 3, targetSelf: true }
    ],
    vfx: { type: 'wave', color: '#f59e0b' },
    desc: 'Rousing warcry granting +4 ATK and +10% Crit for 3 turns (0 MP, 5t CD; extensible to party allies).'
  }),

  // =========================================================================
  // 2. MAGE (Runtime: mage) — 6 Arcane Spells (Mana by default)
  // =========================================================================
  arcane_missile: Object.freeze({
    id: 'arcane_missile',
    name: 'Arcane Missile',
    icon: '🔮',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'evocation',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 6, cooldown: 0 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 5.5,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'arcane',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.35, bonusFlat: 4, damageType: 'magical', scaling: 'arcane' }
    ],
    vfx: { type: 'beam', color: '#a78bfa' },
    desc: 'Fires a focused arcane bolt at a visible enemy within 5 tiles, scaling with Magic Power (6 MP).'
  }),

  fireball: Object.freeze({
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'pyromancy',
    purpose: 'damage',
    activation: 'active',
    timing: 'delayed',
    windupTurns: 1,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 14, cooldown: 2 },
    targeting: {
      mode: 'manual_location',
      pattern: 'radius',
      range: 5.2,
      radius: 1,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 9
    },
    scaling: 'arcane',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.85, bonusFlat: 6, damageType: 'magical', scaling: 'arcane' },
      { type: 'status', statusId: 'burn', duration: 3 }
    ],
    vfx: { type: 'spell', color: '#fb923c' },
    desc: 'Channels for 1 turn (interruptible by Stun/Silence), then detonates a 3x3 arcane blast dealing high magical damage + Burn (14 MP, 2t CD).'
  }),

  frost_nova: Object.freeze({
    id: 'frost_nova',
    name: 'Frost Nova',
    icon: '❄️',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'cryomancy',
    purpose: 'control',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 12, cooldown: 3 },
    targeting: {
      mode: 'auto_area',
      pattern: 'radius',
      range: 2.5,
      radius: 2.5,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 12
    },
    scaling: 'arcane',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.15, bonusFlat: 2, damageType: 'magical', scaling: 'arcane' },
      { type: 'status', statusId: 'slow', duration: 3 },
      { type: 'status', statusId: 'chilled', duration: 2 }
    ],
    vfx: { type: 'wave', color: '#38bdf8' },
    desc: 'Freezing ring around the caster dealing magical damage and inflicting Slow (3t) and Chilled (2t) (12 MP, 3t CD).'
  }),

  arcane_ward: Object.freeze({
    id: 'arcane_ward',
    name: 'Arcane Ward',
    icon: '🔷',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'abjuration',
    purpose: 'defense',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 10, cooldown: 3 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'arcane',
    damageType: 'none',
    effects: [
      { type: 'shield', baseAmount: 16, magicMult: 1.35, maxShieldCap: 95 },
      { type: 'status', statusId: 'ward_buff', duration: 3, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#818cf8' },
    desc: 'Weaves an arcane absorption barrier (scales with Magic Power) and +4 Ward for 3 turns (10 MP, 3t CD).'
  }),

  blink: Object.freeze({
    id: 'blink',
    name: 'Blink',
    icon: '🌀',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'translocation',
    purpose: 'mobility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 10, cooldown: 3 },
    targeting: {
      mode: 'manual_location',
      pattern: 'single',
      range: 4.5,
      radius: 0,
      requireLos: true,
      filter: 'any',
      maxTargets: 1,
      requireWalkable: true,
      respectTeleportWard: true
    },
    scaling: 'arcane',
    damageType: 'none',
    effects: [
      { type: 'teleport' }
    ],
    vfx: { type: 'teleport', color: '#c084fc' },
    desc: 'Short-distance teleport to a visible unobstructed floor tile within 4 tiles (respects protected/warded tiles; 10 MP, 3t CD).'
  }),

  detect_magic: Object.freeze({
    id: 'detect_magic',
    name: 'Detect Magic',
    icon: '👁️',
    kind: 'spell',
    domain: 'arcane',
    discipline: 'divination',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 4, cooldown: 3 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 6,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'arcane',
    damageType: 'none',
    effects: [
      { type: 'detect', modality: 'magical', radius: 6 }
    ],
    vfx: { type: 'detect_pulse', color: '#818cf8' },
    desc: 'Senses magical signatures (arcane rune traps, enchanted shrines/portals, arcane seals, magical foes) within 6 tiles; does not reveal mundane physical traps/doors (4 MP, 3t CD).'
  }),

  // =========================================================================
  // 3. ACOLYTE (Runtime: cleric) — 6 Divine Prayers (Mana by default)
  // =========================================================================
  healing_light: Object.freeze({
    id: 'healing_light',
    name: 'Healing Light',
    icon: '💚',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'restoration',
    purpose: 'healing',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 10, cooldown: 1 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'none',
    effects: [
      { type: 'heal', baseAmount: 14, magicMult: 1.1, maxHpPct: 0.12, targetSelf: true },
      { type: 'status', statusId: 'regen', duration: 2, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#4ade80' },
    desc: 'Restores HP immediately (scales with SPI/Magic Power) and grants 2t Regeneration — no enemy target required (10 MP, 1t CD).'
  }),

  sacred_flame: Object.freeze({
    id: 'sacred_flame',
    name: 'Sacred Flame',
    icon: '☀️',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'radiance',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 8, cooldown: 0 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 4.2,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'magical',
    effects: [
      {
        type: 'damage',
        mult: 1.4,
        bonusFlat: 3,
        damageType: 'magical',
        scaling: 'divine',
        bonusVsTraits: ['undead', 'corrupted'],
        bonusTraitMult: 1.35
      }
    ],
    vfx: { type: 'spell', color: '#fbbf24' },
    desc: 'Calls down radiant divine fire on a visible enemy within 4 tiles (+35% bonus damage vs Undead/Corrupted; 8 MP).'
  }),

  blessing: Object.freeze({
    id: 'blessing',
    name: 'Blessing',
    icon: '🙏',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'benediction',
    purpose: 'buff',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    groupExtensible: true,
    costs: { mp: 10, cooldown: 4 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'none',
    effects: [
      { type: 'status', statusId: 'blessed', duration: 4, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#fef08a' },
    desc: 'Bestows a sacred benediction granting +3 ATK, +3 Magic Power, +3 DEF, and +3 Ward for 4 turns (10 MP, 4t CD).'
  }),

  purification: Object.freeze({
    id: 'purification',
    name: 'Purification',
    icon: '🕊️',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'restoration',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 8, cooldown: 2 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'none',
    effects: [
      { type: 'cleanse', maxRemoved: 3, targetSelf: true },
      { type: 'heal', baseAmount: 6, magicMult: 0.35, targetSelf: true }
    ],
    vfx: { type: 'wave', color: '#fef08a' },
    desc: 'Removes up to 3 eligible harmful statuses (Burn, Poison, Bleed, Slow, Chilled, Weakened, Silence, Disrupted, Rooted) and restores light HP (8 MP, 2t CD).'
  }),

  sanctuary: Object.freeze({
    id: 'sanctuary',
    name: 'Sanctuary',
    icon: '⛪',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'consecration',
    purpose: 'defense',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 14, cooldown: 4 },
    targeting: {
      mode: 'manual_location',
      pattern: 'radius',
      range: 3.5,
      radius: 1,
      requireLos: true,
      filter: 'any',
      maxTargets: 9
    },
    scaling: 'divine',
    damageType: 'none',
    effects: [
      {
        type: 'persistent_area',
        areaId: 'sanctuary_zone',
        name: 'Sanctuary',
        duration: 3,
        radius: 1,
        color: '#fbbf24',
        healPerTurnBase: 8,
        healMagicMult: 0.45,
        grantStatus: 'sanctuary_ward',
        affectsHero: true,
        affectsMonsters: false
      }
    ],
    vfx: { type: 'wave', color: '#fbbf24' },
    desc: 'Consecrates a persistent 3x3 protective zone for 3 turns: grants Sanctuary Ward & periodic healing while inside; ward lifts on exit or expiry (14 MP, 4t CD).'
  }),

  divine_sight: Object.freeze({
    id: 'divine_sight',
    name: 'Divine Sight',
    icon: '🌟',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'revelation',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 4, cooldown: 3 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 6,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'none',
    effects: [
      { type: 'detect', modality: 'spiritual', radius: 6 }
    ],
    vfx: { type: 'detect_pulse', color: '#fbbf24' },
    desc: 'Attunes to spiritual/divine signatures (undead, corrupted foes, cursed/desecrated shrines, spiritual seals) within 6 tiles; does not reveal mundane objects (4 MP, 3t CD).'
  }),

  // =========================================================================
  // 4. SCOUT (Runtime: scout) — 7 Skills (Cooldowns + Equipment/Environment)
  // =========================================================================
  aimed_shot: Object.freeze({
    id: 'aimed_shot',
    name: 'Aimed Shot',
    icon: '🏹',
    kind: 'skill',
    domain: 'martial',
    discipline: 'marksmanship',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    requiresRangedWeapon: true,
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 6.0,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.55, bonusFlat: 3, bonusCritChance: 20, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'beam', color: '#10b981' },
    desc: 'Focused ranged shot (+20% Crit, 155% ATK) within 6 tiles; requires an equipped ranged weapon (0 MP, 2t CD).'
  }),

  tracking: Object.freeze({
    id: 'tracking',
    name: 'Tracking',
    icon: '🐾',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'wilderness',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon', 'overworld'],
    timeSemantics: 'tactical_turn',
    strategicCooldownMs: 15000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 3 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 8,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'track_clues', radius: 8 }
    ],
    vfx: { type: 'detect_pulse', color: '#10b981' },
    desc: 'Reads tracks and movement clues within 8 tiles/hexes, reporting approximate bearings and creature activity (distinct from exact map reveal; 0 MP, 3t CD).'
  }),

  camouflage: Object.freeze({
    id: 'camouflage',
    name: 'Camouflage',
    icon: '🌿',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'stealth',
    purpose: 'defense',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon', 'overworld'],
    timeSemantics: 'tactical_turn',
    strategicCooldownMs: 35000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 4 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'camouflage', duration: 3 }
    ],
    vfx: { type: 'shield', color: '#10b981' },
    desc: 'Blends with surroundings (requires no adjacent enemy), cutting enemy detection radius to 2 tiles for 3 turns until attacking or acting aggressively (0 MP, 4t CD).'
  }),

  snare: Object.freeze({
    id: 'snare',
    name: 'Snare',
    icon: '🪢',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'trapping',
    purpose: 'control',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 4 },
    targeting: {
      mode: 'manual_location',
      pattern: 'single',
      range: 2.5,
      radius: 0,
      requireLos: true,
      filter: 'any',
      maxTargets: 1,
      requireWalkable: true
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'place_snare', duration: 8, rootDuration: 3, maxActive: 2, triggerDamage: 8 }
    ],
    vfx: { type: 'detect_pulse', color: '#84cc16' },
    desc: 'Places a concealed snare on an open floor tile within 2 tiles (max 2 active, lasts 8t). Triggering damages and Roots/Slows the foe for 3 turns (0 MP, 4t CD).'
  }),

  forage: Object.freeze({
    id: 'forage',
    name: 'Forage',
    icon: '🍄',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'survival',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['overworld', 'tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    strategicCooldownMs: 30000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 5 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'forage' }
    ],
    vfx: { type: 'detect_pulse', color: '#4ade80' },
    desc: 'Gathers provisions/herbs from eligible natural terrain (once per location to prevent infinite farming; 0 MP, 5t / 30s CD).'
  }),

  reconnaissance: Object.freeze({
    id: 'reconnaissance',
    name: 'Reconnaissance',
    icon: '🔭',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'scouting',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['overworld'],
    timeSemantics: 'overworld_realtime',
    strategicCooldownMs: 25000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 0 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 6,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'overworld_recon', bonusVision: 3 }
    ],
    vfx: { type: 'detect_pulse', color: '#38bdf8' },
    desc: 'Overworld survey expanding vision by +3 hexes, discovering POIs/dungeons and counting nearby hostile threats (25s CD).'
  }),

  forced_pace: Object.freeze({
    id: 'forced_pace',
    name: 'Forced Pace',
    icon: '🥾',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'travel',
    purpose: 'mobility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['overworld'],
    timeSemantics: 'overworld_realtime',
    strategicCooldownMs: 45000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 0 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'overworld_forced_pace', durationMs: 30000, speedBonusRatio: 0.25 }
    ],
    vfx: { type: 'wave', color: '#34d399' },
    desc: 'Overworld travel skill increasing this Scout unit\'s march speed by 25% across eligible terrain for 30s (individual unit only; 45s CD).'
  }),

  // =========================================================================
  // 5. ADVENTURER (Runtime: adventurer) — 7 Skills (Cooldowns + Tools/Situational)
  // =========================================================================
  second_wind: Object.freeze({
    id: 'second_wind',
    name: 'Second Wind',
    icon: '🫀',
    kind: 'skill',
    domain: 'martial',
    discipline: 'endurance',
    purpose: 'healing',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 5 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'none',
    effects: [
      { type: 'heal', maxHpPct: 0.22, vitMult: 0.8, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#34d399' },
    desc: 'Deliberate endurance recovery restoring 22% Max HP + VIT bonus without requiring an enemy target (0 MP, 5t CD).'
  }),

  careful_search: Object.freeze({
    id: 'careful_search',
    name: 'Careful Search',
    icon: '🔍',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'delving',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 3,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'detect', modality: 'physical', radius: 3 }
    ],
    vfx: { type: 'detect_pulse', color: '#38bdf8' },
    desc: 'Actively searches within 3 tiles for physically concealed traps, secret passages, and hidden treasure caches (0 MP, 2t CD).'
  }),

  disengage: Object.freeze({
    id: 'disengage',
    name: 'Disengage',
    icon: '↩️',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'evasion',
    purpose: 'mobility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 3 },
    targeting: {
      mode: 'manual_location',
      pattern: 'single',
      range: 2.2,
      radius: 0,
      requireLos: true,
      filter: 'any',
      maxTargets: 1,
      requireWalkable: true
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'disengage_move' },
      { type: 'status', statusId: 'disengaged', duration: 2, targetSelf: true }
    ],
    vfx: { type: 'teleport', color: '#38bdf8' },
    desc: 'Safely withdraws up to 2 tiles to an open floor space and grants +25% Dodge for 2 turns (0 MP, 3t CD).'
  }),

  dirty_fighting: Object.freeze({
    id: 'dirty_fighting',
    name: 'Dirty Fighting',
    icon: '🥊',
    kind: 'skill',
    domain: 'martial',
    discipline: 'brawling',
    purpose: 'control',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 3 },
    targeting: {
      mode: 'manual_enemy',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.15, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'status', statusId: 'disrupted', duration: 2 },
      { type: 'status', statusId: 'stun', duration: 1 }
    ],
    vfx: { type: 'slash', color: '#fbbf24' },
    desc: 'Opportunistic strike dealing 115% ATK, inflicting Disrupted (2t) and Stun (1t, interrupts enemy windups; 0 MP, 3t CD).'
  }),

  appraise: Object.freeze({
    id: 'appraise',
    name: 'Appraise',
    icon: '💎',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'evaluation',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon', 'overworld'],
    timeSemantics: 'tactical_turn',
    strategicCooldownMs: 5000,
    acquisition: 'class',
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'appraise_item' }
    ],
    vfx: { type: 'detect_pulse', color: '#fbbf24' },
    desc: 'Inspects an unappraised item in your pack or loadout, revealing exact quality, valuation, and unusual properties (0 MP, 2t CD).'
  }),

  disarm_trap: Object.freeze({
    id: 'disarm_trap',
    name: 'Disarm Trap',
    icon: '🔧',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'mechanisms',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'manual_location',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'any',
      maxTargets: 1,
      requireDiscoveredTrap: true
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'disarm_trap' }
    ],
    vfx: { type: 'detect_pulse', color: '#34d399' },
    desc: 'Disables an adjacent discovered trap or disarmable floor hazard, updating actual trap state and awarding XP (0 MP, 2t CD).'
  }),

  lockpicking: Object.freeze({
    id: 'lockpicking',
    name: 'Lockpicking',
    icon: '🗝️',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'mechanisms',
    purpose: 'utility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 2 },
    targeting: {
      mode: 'manual_location',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'any',
      maxTargets: 1,
      requireLockedObject: true
    },
    scaling: 'none',
    damageType: 'none',
    effects: [
      { type: 'lockpick', maxSecurityLevel: 2 }
    ],
    vfx: { type: 'detect_pulse', color: '#fbbf24' },
    desc: 'Picks an adjacent ordinary locked door or container without a key; respects arcane seals and protected boss locks (0 MP, 2t CD).'
  }),

  // =========================================================================
  // 6. PRESERVED LEGACY PROTOTYPE SKILLS (Paladin / Thief / Ranger / Reactive)
  // =========================================================================
  holy_smite: Object.freeze({
    id: 'holy_smite',
    name: 'Holy Smite',
    icon: '⚜️',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'retribution',
    purpose: 'hybrid',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 12, cooldown: 0 },
    targeting: {
      mode: 'auto_enemy',
      pattern: 'single',
      range: 1.5,
      radius: 0,
      requireLos: false,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'hybrid_divine',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.35, magicRatio: 0.75, damageType: 'magical', scaling: 'hybrid_divine' },
      { type: 'heal', maxHpPct: 0.15, magicMult: 0.3, targetSelf: true }
    ],
    vfx: { type: 'spell', color: '#fbbf24' },
    desc: 'Hybrid physical + divine strike (scales with ATK and Magic Power/SPI) that restores 15% Max HP.'
  }),

  shadowstep_strike: Object.freeze({
    id: 'shadowstep_strike',
    name: 'Shadowstep Strike',
    icon: '🗡️',
    kind: 'skill',
    domain: 'martial',
    discipline: 'stealth',
    purpose: 'mobility',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 14, cooldown: 0 },
    targeting: {
      mode: 'auto_enemy',
      pattern: 'single',
      range: 3.5,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1,
      requireAdjacentLanding: true
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'shadowstep' },
      { type: 'damage', mult: 1.85, guaranteedCrit: true, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'crit_slash', color: '#a855f7' },
    desc: 'Teleports behind a visible enemy within 3 tiles and strikes for a guaranteed critical hit.'
  }),

  starfall_volley: Object.freeze({
    id: 'starfall_volley',
    name: 'Starfall Volley',
    icon: '🏹',
    kind: 'skill',
    domain: 'martial',
    discipline: 'marksmanship',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 16, cooldown: 0 },
    targeting: {
      mode: 'auto_area',
      pattern: 'radius',
      range: 5.2,
      radius: 5.2,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 3
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.25, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'projectile', color: '#34d399' },
    desc: 'Looses up to 3 arrows at visible enemies within 5 tiles (respects Guarding).'
  }),

  second_wind_reactive: Object.freeze({
    id: 'second_wind_reactive',
    name: 'Resilient Grit',
    icon: '🛡️',
    kind: 'technique',
    domain: 'martial',
    discipline: 'endurance',
    purpose: 'defense',
    activation: 'reactive',
    triggerEvent: 'on_hero_low_hp',
    triggerThresholdPct: 0.35,
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'learned',
    costs: { mp: 0, cooldown: 6 },
    targeting: {
      mode: 'self',
      pattern: 'self',
      range: 0,
      radius: 0,
      requireLos: false,
      filter: 'self',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'none',
    effects: [
      { type: 'heal', maxHpPct: 0.16, targetSelf: true },
      { type: 'shield', baseAmount: 10, defMult: 0.8, maxShieldCap: 60 }
    ],
    vfx: { type: 'shield', color: '#34d399' },
    desc: 'Reactive passive: automatically triggers below 35% HP to restore 16% Max HP and raise a barrier (6t CD).'
  })
});

export const ABILITY_IDS = Object.freeze(Object.keys(ABILITIES));

// Complete 32-entry approved entry-tier default bindings + preserved legacy classes
export const CLASS_DEFAULT_ABILITIES = Object.freeze({
  fighter:    Object.freeze(['power_strike', 'cleave', 'overpower', 'brace', 'charge', 'battle_cry']),
  mage:       Object.freeze(['arcane_missile', 'fireball', 'frost_nova', 'arcane_ward', 'blink', 'detect_magic']),
  cleric:     Object.freeze(['sacred_flame', 'healing_light', 'blessing', 'purification', 'sanctuary', 'divine_sight']),
  scout:      Object.freeze(['aimed_shot', 'tracking', 'camouflage', 'snare', 'forage', 'reconnaissance', 'forced_pace']),
  adventurer: Object.freeze(['second_wind', 'careful_search', 'disengage', 'dirty_fighting', 'appraise', 'disarm_trap', 'lockpicking']),
  // Legacy prototype classes preserved until deliberate roster progression pass
  paladin:    Object.freeze(['holy_smite', 'brace', 'purification']),
  thief:      Object.freeze(['shadowstep_strike']),
  ranger:     Object.freeze(['starfall_volley', 'aimed_shot'])
});

export function getAbilityDefinition(abilityId) {
  if (!abilityId || typeof abilityId !== 'string') return null;
  return ABILITIES[abilityId] || null;
}

export function getDefaultAbilityIdsForClass(classId) {
  const list = CLASS_DEFAULT_ABILITIES[classId];
  return Array.isArray(list) ? list.slice() : [];
}
