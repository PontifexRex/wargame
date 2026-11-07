// Astral Gem Catalog,Subterranean Shrine Variants, and Runic Trap Specifications

export const GEM_IDS = ['ruby', 'emerald', 'sapphire', 'topaz', 'void_diamond'];

export const GEM_CATALOG = {
  ruby: {
    id: 'ruby',
    name: 'Ruby of Might',
    shortName: 'Ruby',
    color: '#ef4444',
    baseValue: 65,
    bonuses: { atk: 4, str: 2 },
    desc: '+4 ATK, +2 STR'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald of the Wind',
    shortName: 'Emerald',
    color: '#10b981',
    baseValue: 65,
    bonuses: { crit: 5, dodge: 4, dex: 2 },
    desc: '+5% Crit, +4% Dodge, +2 DEX'
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire of Will',
    shortName: 'Sapphire',
    color: '#3b82f6',
    baseValue: 65,
    bonuses: { maxMp: 18, int: 3 },
    desc: '+18 Max MP, +3 INT'
  },
  topaz: {
    id: 'topaz',
    name: 'Topaz of Dawn',
    shortName: 'Topaz',
    color: '#f59e0b',
    baseValue: 65,
    bonuses: { maxHp: 24, def: 3, vit: 2 },
    desc: '+24 Max HP, +3 DEF, +2 VIT'
  },
  void_diamond: {
    id: 'void_diamond',
    name: 'Void Diamond',
    shortName: 'Void Diamond',
    color: '#e879f9',
    baseValue: 140,
    bonuses: { atk: 5, def: 4, crit: 4, visionBonus: 1 },
    desc: '+5 ATK, +4 DEF, +4% Crit, +1 Vision'
  }
};

export const GEM_DISPLAY = [
  { id: 'ruby',         name: 'Ruby',         color: '#ef4444' },
  { id: 'emerald',      name: 'Emerald',      color: '#10b981' },
  { id: 'sapphire',     name: 'Sapphire',     color: '#3b82f6' },
  { id: 'topaz',        name: 'Topaz',        color: '#f59e0b' },
  { id: 'void_diamond', name: 'Void Diamond', color: '#e879f9' }
];

export const SHRINE_CATALOG = {
  sanctuary: {
    id: 'sanctuary',
    name: 'Shrine of Celestial Renewal',
    color: '#34d399',
    desc: 'Restores 50% Max HP & Max MP and purges negative afflictions.'
  },
  starfire: {
    id: 'starfire',
    name: 'Shrine of Starfire',
    color: '#fbbf24',
    statusId: 'shrine_starfire',
    statusName: 'Starfire Blessing',
    duration: 25,
    bonuses: { atk: 6, crit: 12 },
    desc: 'Grants +6 ATK and +12% Crit for 25 turns.'
  },
  aegis: {
    id: 'aegis',
    name: 'Shrine of the Astral Aegis',
    color: '#60a5fa',
    statusId: 'shrine_aegis',
    statusName: 'Astral Aegis',
    duration: 25,
    bonuses: { def: 6, visionBonus: 1 },
    desc: 'Grants +6 DEF and +1 Vision Radius for 25 turns.'
  }
};

export const TRAP_CATALOG = {
  spike: {
    id: 'spike',
    name: 'Runic Spike Trap',
    color: '#f87171',
    baseDmg: 12,
    depthScale: 4,
    statusId: 'bleed',
    statusDuration: 3,
    desc: 'Piercing floor spikes that deal physical damage and inflict Bleed.'
  },
  flame: {
    id: 'flame',
    name: 'Runic Flame Vent',
    color: '#fb923c',
    baseDmg: 10,
    depthScale: 4,
    statusId: 'burn',
    statusDuration: 3,
    desc: 'Searing rune-fire glyph that deals fire damage and inflicts Burn.'
  }
};
