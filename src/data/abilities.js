// Shared Context-Independent Spell, Prayer, Martial Technique & Adventuring Skill Catalog (MG-01A)
// Immutable definitions separated from actor-owned runtime access grants and cooldowns.

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
  'silence'
]);

export const ABILITIES = Object.freeze({
  // -------------------------------------------------------------------------
  // MARTIAL TECHNIQUES (Fighter / Bruiser & shared physical skills)
  // -------------------------------------------------------------------------
  whirlwind_cleave: Object.freeze({
    id: 'whirlwind_cleave',
    name: 'Whirlwind Cleave',
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
    costs: { mp: 10, cooldown: 0 },
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
      { type: 'damage', mult: 1.45, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'status', statusId: 'stun', duration: 1 }
    ],
    vfx: { type: 'slash', color: '#f97316' },
    desc: 'Sweeping cleave striking all adjacent enemies for 145% physical damage (respects Guarding).'
  }),

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
    desc: 'Cooldown martial strike dealing 165% physical damage to an adjacent enemy (0 MP, 2t CD).'
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
    desc: 'Crushing blow that knocks an adjacent foe back 1 tile; slamming into a wall stuns for 2 turns (0 MP, 4t CD).'
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
      { type: 'shield', baseAmount: 14, defMult: 1.2, maxShieldCap: 80 },
      { type: 'status', statusId: 'guarding', duration: 2, targetSelf: true }
    ],
    vfx: { type: 'shield', color: '#60a5fa' },
    desc: 'Raise a defensive stance gaining an Absorb Shield and Guarding (+60% DEF) for 2 turns (0 MP, 4t CD).'
  }),

  second_wind_reactive: Object.freeze({
    id: 'second_wind_reactive',
    name: 'Second Wind',
    icon: '🫀',
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
    acquisition: 'class',
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
    desc: 'Reactive technique: automatically triggers when dropping below 35% HP to restore 16% Max HP and raise a shield (6t CD).'
  }),

  // -------------------------------------------------------------------------
  // ARCANE SPELLS (Mage representative catalog)
  // -------------------------------------------------------------------------
  starfall_nova: Object.freeze({
    id: 'starfall_nova',
    name: 'Starfall Nova',
    icon: '✨',
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
    costs: { mp: 16, cooldown: 0 },
    targeting: {
      mode: 'auto_area',
      pattern: 'radius',
      range: 4.2,
      radius: 4.2,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 12
    },
    scaling: 'arcane',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.55, bonusFlat: 4, damageType: 'magical', scaling: 'arcane' }
    ],
    vfx: { type: 'wave', color: '#818cf8' },
    desc: 'Arcane burst striking all visible foes within 4 tiles, scaling with Magic Power and INT.'
  }),

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
    desc: 'Fires a focused bolt of arcane energy at a visible enemy within 5 tiles (scales with Magic Power).'
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
    desc: 'Channels for 1 turn, then detonates a 3x3 fireball at the target location dealing high arcane damage + Burn (interruptible by Stun/Silence).'
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
    desc: 'Freezing ring around the caster dealing magical damage and inflicting Slow (3t) and Chilled (2t).'
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
    desc: 'Weaves an arcane barrier absorbing incoming damage (scales with Magic Power) and granting +4 Ward for 3 turns.'
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
      requireWalkable: true
    },
    scaling: 'arcane',
    damageType: 'none',
    effects: [
      { type: 'teleport' }
    ],
    vfx: { type: 'teleport', color: '#c084fc' },
    desc: 'Instantly teleports to an unobstructed visible floor tile within 4 tiles.'
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
    costs: { mp: 0, cooldown: 3 },
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
      { type: 'detect', radius: 6, revealTraps: true, revealSecretDoors: true }
    ],
    vfx: { type: 'wave', color: '#34d399' },
    desc: 'Divination pulse revealing hidden traps and secret doors within 6 tiles (0 MP, 3t CD).'
  }),

  // -------------------------------------------------------------------------
  // DIVINE PRAYERS (Cleric / Acolyte & Paladin representative catalog)
  // -------------------------------------------------------------------------
  sacred_ward: Object.freeze({
    id: 'sacred_ward',
    name: 'Sacred Ward',
    icon: '☀️',
    kind: 'prayer',
    domain: 'divine',
    discipline: 'radiance',
    purpose: 'hybrid',
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
      range: 3.2,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'divine',
    damageType: 'magical',
    effects: [
      { type: 'damage', mult: 1.45, bonusFlat: 4, damageType: 'magical', scaling: 'divine' },
      { type: 'heal', maxHpPct: 0.14, magicMult: 0.45, targetSelf: true }
    ],
    vfx: { type: 'spell', color: '#fbbf24' },
    desc: 'Calls down radiant divine damage on a visible foe within 3 tiles while mending the caster.'
  }),

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
    desc: 'Restores HP immediately (scaling with SPI & Magic Power) and grants Regeneration for 2 turns.'
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
    desc: 'Cleanses up to 3 negative status effects (Burn, Poison, Bleed, Slow, Chilled, Weakened) and heals lightly.'
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
        grantStatus: 'ward_buff',
        affectsHero: true,
        affectsMonsters: false
      }
    ],
    vfx: { type: 'wave', color: '#fbbf24' },
    desc: 'Consecrates a 3x3 ground zone for 3 turns that periodically heals the hero and grants Ward while inside.'
  }),

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

  // -------------------------------------------------------------------------
  // THIEF, RANGER & ADVENTURER REPRESENTATIVE SKILLS
  // -------------------------------------------------------------------------
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

  crippling_throw: Object.freeze({
    id: 'crippling_throw',
    name: 'Crippling Throw',
    icon: '🎯',
    kind: 'skill',
    domain: 'martial',
    discipline: 'skirmish',
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
      range: 4.5,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 1
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.05, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'status', statusId: 'slow', duration: 2 },
      { type: 'status', statusId: 'bleed', duration: 2 }
    ],
    vfx: { type: 'projectile', color: '#f87171' },
    desc: 'Hurls a weighted blade inflicting Slow (2t) and Bleed (2t) (0 MP, 3t CD).'
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

  piercing_line: Object.freeze({
    id: 'piercing_line',
    name: 'Piercing Shot',
    icon: '⚡',
    kind: 'technique',
    domain: 'martial',
    discipline: 'marksmanship',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 0, cooldown: 3 },
    targeting: {
      mode: 'directional',
      pattern: 'line',
      range: 4,
      radius: 0,
      requireLos: true,
      filter: 'enemy',
      maxTargets: 4
    },
    scaling: 'physical',
    damageType: 'physical',
    effects: [
      { type: 'damage', mult: 1.35, damageType: 'physical', scaling: 'physical', respectGuarding: true }
    ],
    vfx: { type: 'beam', color: '#34d399' },
    desc: 'Fires a piercing arrow in a 4-tile line, hitting every enemy along the path (0 MP, 3t CD).'
  }),

  torch_flare: Object.freeze({
    id: 'torch_flare',
    name: 'Torch Flare',
    icon: '🔦',
    kind: 'skill',
    domain: 'adventuring',
    discipline: 'delving',
    purpose: 'damage',
    activation: 'active',
    timing: 'immediate',
    windupTurns: 0,
    contexts: ['tactical_dungeon'],
    timeSemantics: 'tactical_turn',
    acquisition: 'class',
    costs: { mp: 10, cooldown: 0 },
    targeting: {
      mode: 'auto_enemy',
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
      { type: 'damage', mult: 1.35, damageType: 'physical', scaling: 'physical', respectGuarding: true },
      { type: 'status', statusId: 'burn', duration: 3 }
    ],
    vfx: { type: 'spell', color: '#f97316' },
    desc: 'Swings a blazing torch at an adjacent foe, dealing physical damage and applying Burn for 3 turns.'
  })
});

export const ABILITY_IDS = Object.freeze(Object.keys(ABILITIES));

// Representative default ability sets for all 7 existing prototype classes.
// First entry preserves each class's legacy primary skill for backward compatibility.
export const CLASS_DEFAULT_ABILITIES = Object.freeze({
  fighter: Object.freeze(['whirlwind_cleave', 'power_strike', 'overpower', 'brace', 'second_wind_reactive']),
  mage: Object.freeze(['starfall_nova', 'arcane_missile', 'fireball', 'frost_nova', 'arcane_ward', 'blink', 'detect_magic']),
  cleric: Object.freeze(['sacred_ward', 'healing_light', 'purification', 'sanctuary']),
  paladin: Object.freeze(['holy_smite', 'brace', 'purification']),
  thief: Object.freeze(['shadowstep_strike', 'crippling_throw']),
  ranger: Object.freeze(['starfall_volley', 'piercing_line']),
  adventurer: Object.freeze(['torch_flare', 'brace', 'detect_magic'])
});

export function getAbilityDefinition(abilityId) {
  if (!abilityId || typeof abilityId !== 'string') return null;
  return ABILITIES[abilityId] || null;
}

export function getDefaultAbilityIdsForClass(classId) {
  const list = CLASS_DEFAULT_ABILITIES[classId];
  return Array.isArray(list) ? list.slice() : [];
}
