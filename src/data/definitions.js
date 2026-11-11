// Object Definitions Catalog & Schema Registries (ADR-0010)
// Defines immutable templates for Items, Keys, Containers, Devices, Mechanisms, and Pickups.

export const OBJECT_CATEGORIES = {
  ITEM: 'item',
  WORLD_OBJECT: 'world_object'
};

export const ITEM_CATEGORIES = {
  CONSUMABLE: 'consumable',
  EQUIPMENT:  'equipment',
  MATERIAL:   'material',
  KEY:        'key',
  TOOL:       'tool',
  QUEST:      'quest',
  ARTIFACT:   'artifact',
  CURRENCY:   'currency'
};

export const WORLD_OBJECT_TYPES = {
  STATIC:    'static',
  DOOR:      'door',
  PORTAL:    'portal',
  CONTAINER: 'container',
  MECHANISM: 'mechanism',
  DEVICE:    'device',
  PICKUP:    'pickup'
};

export const OBJECT_DEFINITIONS = {};

export function registerObjectDefinition(def) {
  if (!def || !def.definitionId) {
    throw new Error('registerObjectDefinition requires a definition with definitionId');
  }
  OBJECT_DEFINITIONS[def.definitionId] = Object.freeze(Object.assign({}, def));
  return OBJECT_DEFINITIONS[def.definitionId];
}

export function getObjectDefinition(defId) {
  return OBJECT_DEFINITIONS[defId] || null;
}

export function hasObjectDefinition(defId) {
  return Boolean(OBJECT_DEFINITIONS[defId]);
}

// ============================================================================
// CORE DEFINITION TEMPLATES
// ============================================================================

// 1. KEY DEFINITIONS (Credentials & Keys for Locks & Vaults)
registerObjectDefinition({
  definitionId: 'key_iron_common',
  category: OBJECT_CATEGORIES.ITEM,
  itemCategory: ITEM_CATEGORIES.KEY,
  name: 'Iron Skeleton Key',
  namePlural: 'Iron Skeleton Keys',
  description: 'A sturdy iron skeleton key capable of opening common dungeon doors and chests.',
  icon: '🗝️',
  rarity: 'common',
  baseValue: 15,
  isStackable: true,
  maxStackSize: 10,
  tags: ['key', 'metal', 'common_key', 'key.common_iron'],
  defaultComponents: {
    key: {
      keyTag: 'key.common_iron',
      securityLevel: 1,
      consumeOnUse: true
    }
  }
});

registerObjectDefinition({
  definitionId: 'key_vault_dwarven',
  category: OBJECT_CATEGORIES.ITEM,
  itemCategory: ITEM_CATEGORIES.KEY,
  name: 'Dwarven Vault Key',
  namePlural: 'Dwarven Vault Keys',
  description: 'An intricately notched brass key bearing the seal of the Dwarven Guild Cartographers.',
  icon: '🗝️',
  rarity: 'rare',
  baseValue: 60,
  isStackable: true,
  maxStackSize: 5,
  tags: ['key', 'dwarven', 'vault_key', 'key.dwarven_vault'],
  defaultComponents: {
    key: {
      keyTag: 'key.dwarven_vault',
      securityLevel: 2,
      consumeOnUse: true
    }
  }
});

registerObjectDefinition({
  definitionId: 'key_rune_celestial',
  category: OBJECT_CATEGORIES.ITEM,
  itemCategory: ITEM_CATEGORIES.KEY,
  name: 'Celestial Rune Sigil',
  namePlural: 'Celestial Rune Sigils',
  description: 'A glowing triangular star-stone pulsing with astral resonance.',
  icon: '💠',
  rarity: 'epic',
  baseValue: 180,
  isStackable: true,
  maxStackSize: 3,
  tags: ['key', 'astral', 'rune_key', 'key.celestial_rune'],
  defaultComponents: {
    key: {
      keyTag: 'key.celestial_rune',
      securityLevel: 3,
      consumeOnUse: true
    }
  }
});

// 2. WORLD PICKUP DEFINITION (Ground Item Wrapper)
registerObjectDefinition({
  definitionId: 'pickup_world_item',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.PICKUP,
  name: 'Item Pickup',
  description: 'An item resting upon the dungeon floor.',
  tags: ['pickup', 'ground_loot'],
  defaultPermeability: {
    movement: true,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    interactable: {
      prompt: 'Pick up item',
      autoTriggerOnStep: true,
      actions: {
        pickup: {
          id: 'pickup',
          name: 'Take Item',
          requirements: null,
          costs: null,
          effects: [{ type: 'pickupItem' }]
        }
      }
    }
  }
});

// 3. CONTAINER DEFINITION (Gilded Vault Chest)
registerObjectDefinition({
  definitionId: 'container_vault_chest',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.CONTAINER,
  name: 'Gilded Vault Chest',
  description: 'A banded ironbound oak chest containing ancient vault treasures.',
  tags: ['chest', 'container', 'treasure'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false, // Closed chest blocks movement
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    durability: { hp: 40, maxHp: 40, armor: 4 },
    interactable: {
      prompt: 'Open chest',
      autoTriggerOnStep: false,
      actions: {
        open: {
          id: 'open',
          name: 'Open Chest',
          requirements: {
            op: 'OR',
            rules: [
              { type: 'objectState', axis: 'security', value: 'unlocked' },
              { type: 'hasItemTag', tag: 'key.common_iron' }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'grantChestLoot' }
          ]
        }
      }
    }
  }
});

// 4. DEVICE DEFINITIONS (Subterranean Astral Shrines)
registerObjectDefinition({
  definitionId: 'device_shrine_celestial',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DEVICE,
  name: 'Celestial Renewal Shrine',
  description: 'A carved quartz dais radiating soothing lunar luminescence.',
  tags: ['shrine', 'celestial', 'healing'],
  defaultState: {
    mechanical: 'closed', // 'closed' means active/unused
    security: 'unlocked',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    interactable: {
      prompt: 'Pray at Shrine',
      actions: {
        bless: {
          id: 'bless',
          name: 'Receive Blessing',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'closed' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' }, // 'open' means used
            { type: 'applyShrineBlessing', shrineId: 'shrine_renewal' }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'device_shrine_starfire',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DEVICE,
  name: 'Starfire Blessing Shrine',
  description: 'A blazing obelisk crowned with an incandescent astralite flame.',
  tags: ['shrine', 'starfire', 'combat_buff'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    interactable: {
      prompt: 'Claim Starfire',
      actions: {
        bless: {
          id: 'bless',
          name: 'Receive Starfire',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'closed' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'applyShrineBlessing', shrineId: 'shrine_starfire' }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'device_shrine_aegis',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DEVICE,
  name: 'Astral Aegis Shrine',
  description: 'A crystalline pillar casting a protective shield of diamond light.',
  tags: ['shrine', 'aegis', 'defense_buff'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    interactable: {
      prompt: 'Attune Aegis',
      actions: {
        bless: {
          id: 'bless',
          name: 'Attune Shield',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'closed' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'applyShrineBlessing', shrineId: 'shrine_aegis' }
          ]
        }
      }
    }
  }
});

// 5. MECHANISM DEFINITIONS (Runic Traps)
registerObjectDefinition({
  definitionId: 'mechanism_trap_spikes',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.MECHANISM,
  name: 'Subterranean Spike Trap',
  description: 'Concealed pressure-plate mechanism driving spring-loaded steel spikes.',
  tags: ['trap', 'spikes', 'physical'],
  defaultState: {
    mechanical: 'closed', // ready to trigger
    security: 'unlocked',
    discovery: 'unknown', // hidden until spotted
    structural: 'intact'
  },
  defaultPermeability: {
    movement: true,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    trap: {
      trapId: 'spikes',
      damage: 18,
      effect: 'bleed',
      detectDc: 12,
      disarmDc: 13
    },
    interactable: {
      prompt: 'Disarm Spike Trap',
      actions: {
        disarm: {
          id: 'disarm',
          name: 'Disarm Trap',
          requirements: {
            op: 'OR',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'requiredClass', classId: 'ranger' },
              { type: 'minStat', stat: 'dex', value: 16 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'disabled' },
            { type: 'disarmTrap' }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'mechanism_trap_flame',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.MECHANISM,
  name: 'Runic Flame Jet Trap',
  description: 'Ancient carved floor rune triggering a column of pressurized magma flame.',
  tags: ['trap', 'flame', 'elemental'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    discovery: 'unknown',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: true,
    lineOfSight: true,
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  defaultComponents: {
    trap: {
      trapId: 'flame',
      damage: 24,
      effect: 'burn',
      detectDc: 14,
      disarmDc: 15
    },
    interactable: {
      prompt: 'Disarm Flame Rune',
      actions: {
        disarm: {
          id: 'disarm',
          name: 'Disarm Flame Rune',
          requirements: {
            op: 'OR',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'minStat', stat: 'dex', value: 18 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'disabled' },
            { type: 'disarmTrap' }
          ]
        }
      }
    }
  }
});

// ============================================================================
// 6. DOOR DEFINITIONS (Multi-State Barriers, Portcullises & Secret Entrances)
// ============================================================================

registerObjectDefinition({
  definitionId: 'door_wood_hinged',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DOOR,
  name: 'Wooden Dungeon Door',
  description: 'A reinforced oak plank door bound with forged iron bands.',
  tags: ['door', 'wood', 'hinged', 'bashable'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    discovery: 'revealed',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: false,
    light: false,
    sound: true,
    projectiles: false,
    magic: false
  },
  defaultComponents: {
    durability: { hp: 35, maxHp: 35, armor: 2, canBeForced: true },
    lock: {
      lockType: 'mechanical',
      keyTag: 'key.common_iron',
      pickDifficulty: 12,
      forceDifficulty: 14
    },
    interactable: {
      prompt: 'Operate Wooden Door',
      actions: {
        open: {
          id: 'open',
          name: 'Open Door',
          requirements: { type: 'objectState', axis: 'security', value: 'unlocked' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'updatePermeability', movement: true, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        },
        close: {
          id: 'close',
          name: 'Close Door',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'open' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'closed' },
            { type: 'updatePermeability', movement: false, lineOfSight: false, light: false, projectiles: false, magic: false }
          ]
        },
        unlock: {
          id: 'unlock',
          name: 'Unlock with Key',
          requirements: { type: 'hasItemTag', tag: 'key.common_iron' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        },
        pick_lock: {
          id: 'pick_lock',
          name: 'Pick Lock',
          requirements: {
            op: 'OR',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'minStat', stat: 'dex', value: 15 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        },
        bash: {
          id: 'bash',
          name: 'Force / Bash Door',
          requirements: null,
          costs: null,
          effects: [
            { type: 'bashDoor' }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'door_iron_reinforced',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DOOR,
  name: 'Reinforced Iron Door',
  description: 'A heavy riveted iron plate door with a dual-tumbler keyway.',
  tags: ['door', 'metal', 'reinforced', 'vault_door', 'bashable'],
  defaultState: {
    mechanical: 'closed',
    security: 'locked',
    discovery: 'revealed',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: false,
    light: false,
    sound: false,
    projectiles: false,
    magic: false
  },
  defaultComponents: {
    durability: { hp: 80, maxHp: 80, armor: 8, canBeForced: true },
    lock: {
      lockType: 'mechanical',
      keyTag: 'key.common_iron',
      pickDifficulty: 16,
      forceDifficulty: 20
    },
    interactable: {
      prompt: 'Operate Iron Door',
      actions: {
        open: {
          id: 'open',
          name: 'Open Door',
          requirements: { type: 'objectState', axis: 'security', value: 'unlocked' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'updatePermeability', movement: true, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        },
        close: {
          id: 'close',
          name: 'Close Door',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'open' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'closed' },
            { type: 'updatePermeability', movement: false, lineOfSight: false, light: false, projectiles: false, magic: false }
          ]
        },
        unlock: {
          id: 'unlock',
          name: 'Unlock with Iron Key',
          requirements: { type: 'hasItemTag', tag: 'key.common_iron' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        },
        pick_lock: {
          id: 'pick_lock',
          name: 'Pick Heavy Lock',
          requirements: {
            op: 'AND',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'minStat', stat: 'dex', value: 16 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        },
        bash: {
          id: 'bash',
          name: 'Bash Iron Door',
          requirements: null,
          costs: null,
          effects: [
            { type: 'bashDoor' }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'door_iron_portcullis',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DOOR,
  name: 'Iron Portcullis',
  description: 'A heavy vertical wrought-iron grating allowing clear line of sight while preventing physical entry.',
  tags: ['door', 'metal', 'portcullis', 'grated'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    discovery: 'revealed',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,     // Closed portcullis blocks physical footsteps!
    lineOfSight: true,  // Grate allows full line of sight!
    light: true,        // Torchlight penetrates the bars!
    sound: true,        // Sounds travel freely!
    projectiles: true,  // Arrows and spell attacks shoot straight through the bars!
    magic: true
  },
  defaultComponents: {
    durability: { hp: 120, maxHp: 120, armor: 10, canBeForced: false },
    lock: {
      lockType: 'mechanism',
      keyTag: 'key.portcullis_lever'
    },
    interactable: {
      prompt: 'Inspect Portcullis',
      actions: {
        open: {
          id: 'open',
          name: 'Lift Portcullis',
          requirements: { type: 'objectState', axis: 'security', value: 'unlocked' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'updatePermeability', movement: true, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        },
        close: {
          id: 'close',
          name: 'Drop Portcullis',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'open' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'closed' },
            { type: 'updatePermeability', movement: false, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'door_secret_stone',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DOOR,
  name: 'Concealed Secret Door',
  description: 'A revolving masonry panel chiseled to blend indistinguishably into the surrounding ashlar dungeon walls.',
  tags: ['door', 'secret', 'stone', 'hidden'],
  defaultState: {
    mechanical: 'closed',
    security: 'unlocked',
    discovery: 'unknown',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: false,
    light: false,
    sound: false,
    projectiles: false,
    magic: false
  },
  defaultComponents: {
    discovery: {
      detectDc: 13,
      isSecret: true
    },
    durability: { hp: 60, maxHp: 60, armor: 6, canBeForced: true },
    interactable: {
      prompt: 'Secret Stone Passage',
      actions: {
        reveal: {
          id: 'reveal',
          name: 'Reveal Secret Door',
          requirements: {
            op: 'OR',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'requiredClass', classId: 'ranger' },
              { type: 'minStat', stat: 'int', value: 14 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'discovery', value: 'revealed' }
          ]
        },
        open: {
          id: 'open',
          name: 'Pivot Secret Wall',
          requirements: { type: 'objectState', axis: 'discovery', value: 'revealed' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'updatePermeability', movement: true, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        },
        close: {
          id: 'close',
          name: 'Close Secret Wall',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'open' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'closed' },
            { type: 'updatePermeability', movement: false, lineOfSight: false, light: false, projectiles: false, magic: false }
          ]
        }
      }
    }
  }
});

registerObjectDefinition({
  definitionId: 'door_vault_ancient',
  category: OBJECT_CATEGORIES.WORLD_OBJECT,
  objectType: WORLD_OBJECT_TYPES.DOOR,
  name: 'Ancient Dwarven Vault Door',
  description: 'A massive 4-inch solid brass and mithril security portal with complex celestial astronomical tumblers.',
  tags: ['door', 'dwarven', 'vault', 'heavy'],
  defaultState: {
    mechanical: 'closed',
    security: 'locked',
    discovery: 'revealed',
    structural: 'intact'
  },
  defaultPermeability: {
    movement: false,
    lineOfSight: false,
    light: false,
    sound: false,
    projectiles: false,
    magic: false
  },
  defaultComponents: {
    durability: { hp: 160, maxHp: 160, armor: 14, canBeForced: false },
    lock: {
      lockType: 'dwarven_vault',
      keyTag: 'key.dwarven_vault',
      pickDifficulty: 20
    },
    interactable: {
      prompt: 'Dwarven Vault Door',
      actions: {
        open: {
          id: 'open',
          name: 'Disengage Vault Seals',
          requirements: { type: 'objectState', axis: 'security', value: 'unlocked' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'open' },
            { type: 'updatePermeability', movement: true, lineOfSight: true, light: true, projectiles: true, magic: true }
          ]
        },
        close: {
          id: 'close',
          name: 'Engage Vault Seals',
          requirements: { type: 'objectState', axis: 'mechanical', value: 'open' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'mechanical', value: 'closed' },
            { type: 'updatePermeability', movement: false, lineOfSight: false, light: false, projectiles: false, magic: false }
          ]
        },
        unlock: {
          id: 'unlock',
          name: 'Unlock with Dwarven Vault Key',
          requirements: { type: 'hasItemTag', tag: 'key.dwarven_vault' },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        },
        pick_lock: {
          id: 'pick_lock',
          name: 'Pick Dwarven Tumblers',
          requirements: {
            op: 'AND',
            rules: [
              { type: 'requiredClass', classId: 'thief' },
              { type: 'minStat', stat: 'dex', value: 20 }
            ]
          },
          costs: null,
          effects: [
            { type: 'changeState', axis: 'security', value: 'unlocked' }
          ]
        }
      }
    }
  }
});
