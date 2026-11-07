// Class Talent Trees

export const TALENT_TREES = {
  fighter: [
    { id: 'f_a1', name: 'Juggernaut Plating',   desc: '+12 Max HP per rank.', max: 3 },
    { id: 'f_a2', name: 'Heavy Cleaver',        desc: '+3 Physical ATK per rank.', max: 3 },
    { id: 'f_a3', name: 'Titan Resurgence',     desc: 'Counter-attack adjacent attackers for 50% ATK (35% chance).', max: 1 }
  ],
  thief: [
    { id: 't_b1', name: 'Lethal Precision',     desc: '+5% Critical Strike chance per rank.', max: 3 },
    { id: 't_b2', name: 'Mineral Vein Sense',   desc: '25% chance per rank to mine veins without using pickaxe durability.', max: 2 },
    { id: 't_b3', name: 'Shadow Dance',         desc: '+10% Dodge & defeating an enemy restores +6 MP.', max: 1 }
  ],
  mage: [
    { id: 'm_c1', name: 'Astral Reservoir',     desc: '+15 Max MP per rank.', max: 3 },
    { id: 'm_c2', name: 'Arcane Amplification', desc: '+15% Starfall Nova & spell damage per rank.', max: 3 },
    { id: 'm_c3', name: 'Supernova Echo',       desc: 'Starfall Nova triggers a second astral pulse for 50% damage.', max: 1 }
  ],
  ranger: [
    { id: 'r_d1', name: 'Pathfinder Agility',   desc: '+4% Dodge & +1 Torchlight vision per rank.', max: 3 },
    { id: 'r_d2', name: 'Piercing Shafts',      desc: 'Attacks and Volley ignore 30% of enemy DEF per rank.', max: 2 },
    { id: 'r_d3', name: 'Rain of Needles',      desc: 'Starfall Volley strikes up to 5 visible targets.', max: 1 }
  ],
  paladin: [
    { id: 'p_e1', name: 'Aegis of Dawn',        desc: '+4 DEF and +8 Max HP per rank.', max: 3 },
    { id: 'p_e2', name: 'Consecrated Arms',     desc: '+4 ATK per rank.', max: 3 },
    { id: 'p_e3', name: 'Divine Intervention',  desc: 'Once per descent, fatal damage heals you to 40% Max HP instead.', max: 1 }
  ]
};
