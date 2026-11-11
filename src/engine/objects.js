// Foundational Game Object & Runtime Instance Engine (ADR-0010)
// Manages object instances, spatial floor queries, item pickups, and the ItemStack stacking engine.

import {
  OBJECT_CATEGORIES,
  WORLD_OBJECT_TYPES,
  getObjectDefinition,
  hasObjectDefinition
} from '../data/definitions.js';
import {
  TILE_CHEST,
  TILE_CHEST_OPEN,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_HIDDEN,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED
} from '../constants.js';

let instanceSeq = 1000;

export function nextInstanceId(prefix = 'obj') {
  return `${prefix}_${Date.now()}_${instanceSeq++}`;
}

// ============================================================================
// INSTANCE FACTORIES
// ============================================================================

export function createWorldObjectInstance(defId, options = {}) {
  const def = getObjectDefinition(defId);
  const defObj = def || {};

  const inst = {
    instanceId: options.instanceId || nextInstanceId(defObj.objectType || 'obj'),
    definitionId: defId,
    objectType: options.objectType || defObj.objectType || WORLD_OBJECT_TYPES.STATIC,
    name: options.name || defObj.name || 'World Object',
    x: typeof options.x === 'number' ? options.x : 0,
    y: typeof options.y === 'number' ? options.y : 0,
    worldId: options.worldId || 'world_prime',
    locationId: options.locationId || null,
    ownerId: options.ownerId || null,
    factionId: options.factionId || null,
    revision: typeof options.revision === 'number' ? options.revision : 1,
    persistencePolicy: options.persistencePolicy || 'floor_persistent',
    tags: Array.isArray(options.tags)
      ? options.tags.slice()
      : (defObj.tags ? defObj.tags.slice() : []),
    runtimeState: Object.assign(
      {
        mechanical: 'closed',
        security: 'unlocked',
        discovery: 'revealed',
        structural: 'intact',
        power: 'unpowered'
      },
      defObj.defaultState || {},
      options.runtimeState || {}
    ),
    permeability: Object.assign(
      {
        movement: true,
        lineOfSight: true,
        light: true,
        sound: true,
        projectiles: true,
        magic: true
      },
      defObj.defaultPermeability || {},
      options.permeability || {}
    ),
    components: Object.assign({}, defObj.defaultComponents || {}, options.components || {}),
    customData: Object.assign({}, options.customData || {})
  };

  return inst;
}

export function createItemInstance(defOrItem, options = {}) {
  let defId = null;
  let baseObj = {};

  if (typeof defOrItem === 'string') {
    defId = defOrItem;
    baseObj = getObjectDefinition(defId) || {};
  } else if (defOrItem && typeof defOrItem === 'object') {
    defId = defOrItem.definitionId || defOrItem.id || 'custom_item';
    baseObj = defOrItem;
  }

  const def = getObjectDefinition(defId);
  const defData = def || {};

  const inst = Object.assign({}, baseObj, {
    instanceId: options.instanceId || baseObj.instanceId || baseObj.uid || nextInstanceId('item'),
    definitionId: defId,
    name: options.name || baseObj.name || defData.name || 'Unknown Item',
    quantity: typeof options.quantity === 'number'
      ? options.quantity
      : (typeof baseObj.quantity === 'number' ? baseObj.quantity : 1),
    quality: options.quality || baseObj.quality || 'normal',
    rarity: options.rarity || baseObj.rarity || defData.rarity || 'common',
    itemLevel: options.itemLevel || baseObj.itemLevel || 1,
    durability: typeof options.durability === 'number'
      ? options.durability
      : (typeof baseObj.curDur === 'number' ? baseObj.curDur : null),
    charges: typeof options.charges === 'number'
      ? options.charges
      : (typeof baseObj.charges === 'number' ? baseObj.charges : null),
    isStackable: options.isStackable !== undefined
      ? Boolean(options.isStackable)
      : (baseObj.isStackable !== undefined ? Boolean(baseObj.isStackable) : Boolean(defData.isStackable)),
    maxStackSize: options.maxStackSize || baseObj.maxStackSize || defData.maxStackSize || 99,
    affixes: Array.isArray(options.affixes)
      ? options.affixes.slice()
      : (Array.isArray(baseObj.affixes) ? baseObj.affixes.slice() : []),
    sockets: Array.isArray(options.sockets)
      ? options.sockets.slice()
      : (Array.isArray(baseObj.sockets) ? baseObj.sockets.slice() : []),
    locked: Boolean(options.locked || baseObj.locked),
    boundState: options.boundState || baseObj.boundState || 'unbound',
    tags: Array.isArray(options.tags)
      ? options.tags.slice()
      : (Array.isArray(baseObj.tags) ? baseObj.tags.slice() : (defData.tags ? defData.tags.slice() : [])),
    components: Object.assign({}, defData.defaultComponents || {}, baseObj.components || {}, options.components || {}),
    customData: Object.assign({}, baseObj.customData || {}, options.customData || {})
  });

  // Preserve legacy uid alias for full backward-compatibility with UI/Armory
  if (!inst.uid) {
    inst.uid = inst.instanceId;
  }

  return inst;
}

export function createWorldItemPickupInstance(itemInstance, x, y, options = {}) {
  const normItem = itemInstance && itemInstance.instanceId ? itemInstance : createItemInstance(itemInstance);
  const def = getObjectDefinition('pickup_world_item');

  const pickupObj = createWorldObjectInstance('pickup_world_item', {
    x: x,
    y: y,
    name: normItem.name,
    objectType: WORLD_OBJECT_TYPES.PICKUP,
    tags: ['pickup', normItem.rarity || 'common'].concat(normItem.tags || []),
    components: Object.assign({}, def ? def.defaultComponents : {}, {
      pickup: {
        item: normItem
      }
    }),
    customData: options.customData || {}
  });

  return pickupObj;
}

export function spawnGroundItem(floor, itemOrDefId, x, y, options = {}) {
  const itemInst = typeof itemOrDefId === 'string' ? createItemInstance(itemOrDefId) : itemOrDefId;
  const pickup = createWorldItemPickupInstance(itemInst, x, y, options);
  if (floor) {
    addWorldObject(floor, pickup);
  }
  return pickup;
}

// ============================================================================
// SPATIAL FLOOR OBJECT QUERIES & MANAGEMENT
// ============================================================================

export function ensureFloorObjects(floor) {
  if (!floor) return [];
  if (!Array.isArray(floor.objects)) {
    floor.objects = [];
  }
  return floor.objects;
}

export function getObjectsAt(floor, x, y, filterFn = null) {
  const objs = ensureFloorObjects(floor);
  const matches = [];
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i];
    if (o && o.x === x && o.y === y) {
      if (!filterFn || filterFn(o)) {
        matches.push(o);
      }
    }
  }
  return matches;
}

export function getFirstObjectAt(floor, x, y, objectType = null) {
  const objs = ensureFloorObjects(floor);
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i];
    if (o && o.x === x && o.y === y) {
      if (!objectType || o.objectType === objectType) {
        return o;
      }
    }
  }
  return null;
}

export function addWorldObject(floor, obj) {
  if (!floor || !obj) return null;
  const objs = ensureFloorObjects(floor);
  objs.push(obj);
  return obj;
}

export function removeWorldObject(floor, instanceIdOrObj) {
  if (!floor) return false;
  const objs = ensureFloorObjects(floor);
  const targetId = typeof instanceIdOrObj === 'string'
    ? instanceIdOrObj
    : (instanceIdOrObj ? instanceIdOrObj.instanceId : null);

  if (!targetId) return false;

  for (let i = 0; i < objs.length; i++) {
    if (objs[i] && objs[i].instanceId === targetId) {
      objs.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function findObjectById(floor, instanceId) {
  if (!floor || !instanceId) return null;
  const objs = ensureFloorObjects(floor);
  for (let i = 0; i < objs.length; i++) {
    if (objs[i] && objs[i].instanceId === instanceId) {
      return objs[i];
    }
  }
  return null;
}

// ============================================================================
// ITEMSTACK STACKING ENGINE
// ============================================================================

export function canItemsStack(a, b) {
  if (!a || !b) return false;

  // Equipment with equipment slots (weapon, armor, helm, boots, accessory, pickaxe) never stack
  if (a.slot || b.slot) return false;

  // Must share identical definition or base item ID
  const aDef = a.definitionId || a.id;
  const bDef = b.definitionId || b.id;
  if (!aDef || !bDef || aDef !== bDef) return false;

  // Explicit non-stackable flags
  if (a.isStackable === false || b.isStackable === false) return false;

  // Rarity and quality must match
  if ((a.rarity || 'common') !== (b.rarity || 'common')) return false;
  if ((a.quality || 'normal') !== (b.quality || 'normal')) return false;

  // Binding states must match
  if ((a.boundState || 'unbound') !== (b.boundState || 'unbound')) return false;

  // Unique rolled affixes or socketed gems prevent stacking
  const aAff = Array.isArray(a.affixes) ? a.affixes.length : 0;
  const bAff = Array.isArray(b.affixes) ? b.affixes.length : 0;
  if (aAff > 0 || bAff > 0) return false;

  const aSock = Array.isArray(a.sockets) ? a.sockets.length : 0;
  const bSock = Array.isArray(b.sockets) ? b.sockets.length : 0;
  if (aSock > 0 || bSock > 0) return false;

  return true;
}

export function mergeItemStacks(target, source, maxStackSize = 99) {
  if (!canItemsStack(target, source)) return 0;

  const targetCap = target.maxStackSize || maxStackSize;
  const currentQty = typeof target.quantity === 'number' ? target.quantity : 1;
  const spaceLeft = Math.max(0, targetCap - currentQty);
  if (spaceLeft <= 0) return 0;

  const sourceQty = typeof source.quantity === 'number' ? source.quantity : 1;
  const amountToMove = Math.min(spaceLeft, sourceQty);

  target.quantity = currentQty + amountToMove;
  source.quantity = sourceQty - amountToMove;

  return amountToMove;
}

export function splitItemStack(stack, qtyToSplit) {
  if (!stack || typeof qtyToSplit !== 'number' || qtyToSplit <= 0) return null;
  const currentQty = typeof stack.quantity === 'number' ? stack.quantity : 1;
  if (qtyToSplit >= currentQty) return null;

  stack.quantity = currentQty - qtyToSplit;

  const splitInst = createItemInstance(stack, {
    quantity: qtyToSplit,
    instanceId: nextInstanceId('item_split')
  });

  return splitInst;
}

// ============================================================================
// LEGACY FLOOR OBJECT AUTO-MIGRATION
// ============================================================================

export function hydrateLegacyFloorObjects(floor) {
  if (!floor || !floor.tiles) return [];
  const objs = ensureFloorObjects(floor);

  // If floor already has objects (e.g. from new generator or save), retain them
  const existingCoords = {};
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i];
    if (o) existingCoords[`${o.x},${o.y}`] = true;
  }

  const fh = floor.height || floor.tiles.length;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : 0);

  for (let y = 0; y < fh; y++) {
    const row = floor.tiles[y];
    if (!row) continue;
    for (let x = 0; x < fw; x++) {
      const coordKey = `${x},${y}`;
      if (existingCoords[coordKey]) continue;

      const t = row[x];
      if (t === TILE_CHEST || t === TILE_CHEST_OPEN) {
        const chestObj = createWorldObjectInstance('container_vault_chest', {
          x: x,
          y: y,
          runtimeState: {
            mechanical: t === TILE_CHEST_OPEN ? 'open' : 'closed',
            security: 'unlocked',
            structural: 'intact'
          }
        });
        objs.push(chestObj);
        existingCoords[coordKey] = true;
      } else if (t === TILE_SHRINE || t === TILE_SHRINE_USED) {
        // Look up shrine type from floor.shrines map if present
        const sMeta = (floor.shrines && floor.shrines[coordKey]) || {};
        let defId = 'device_shrine_celestial';
        if (sMeta.id === 'shrine_starfire') defId = 'device_shrine_starfire';
        else if (sMeta.id === 'shrine_aegis') defId = 'device_shrine_aegis';

        const shrineObj = createWorldObjectInstance(defId, {
          x: x,
          y: y,
          runtimeState: {
            mechanical: t === TILE_SHRINE_USED ? 'open' : 'closed', // 'open' = used
            security: 'unlocked',
            structural: 'intact'
          }
        });
        objs.push(shrineObj);
        existingCoords[coordKey] = true;
      } else if (t === TILE_TRAP_HIDDEN || t === TILE_TRAP_VISIBLE || t === TILE_TRAP_DISARMED) {
        const tMeta = (floor.traps && floor.traps[coordKey]) || {};
        let defId = 'mechanism_trap_spikes';
        if (tMeta.id === 'flame') defId = 'mechanism_trap_flame';

        const trapObj = createWorldObjectInstance(defId, {
          x: x,
          y: y,
          runtimeState: {
            mechanical: t === TILE_TRAP_DISARMED ? 'disabled' : 'closed',
            security: 'unlocked',
            discovery: t === TILE_TRAP_HIDDEN ? 'unknown' : 'revealed',
            structural: 'intact'
          }
        });
        objs.push(trapObj);
        existingCoords[coordKey] = true;
      }
    }
  }

  return objs;
}

// ============================================================================
// DOOR HELPERS & PERMEABILITY QUERIES
// ============================================================================

export function createDoorInstance(defId = 'door_wood_hinged', x = 0, y = 0, options = {}) {
  const door = createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.DOOR
  }));
  return door;
}

export function isDoorWalkable(door) {
  if (!door) return true;
  if (door.objectType !== WORLD_OBJECT_TYPES.DOOR) return true;

  const st = door.runtimeState || {};
  if (st.mechanical === 'open') return true;
  if (st.structural === 'destroyed' || st.structural === 'breached') return true;
  if (door.permeability && door.permeability.movement === true) return true;

  return false;
}

export function isDoorOpaque(door) {
  if (!door) return false;
  if (door.objectType !== WORLD_OBJECT_TYPES.DOOR) return false;

  const st = door.runtimeState || {};
  // If door is open, destroyed, or breached, vision passes through
  if (st.mechanical === 'open') return false;
  if (st.structural === 'destroyed' || st.structural === 'breached') return false;

  // If door has lineOfSight permeability (such as portcullis bars), vision passes through
  if (door.permeability && door.permeability.lineOfSight === true) return false;

  return true;
}

export function isDoorTraversable(door) {
  if (!door) return { traversable: true };
  const walkable = isDoorWalkable(door);
  if (walkable) return { traversable: true };

  const st = door.runtimeState || {};
  let reason = 'closed';
  if (st.security === 'locked') reason = 'locked';
  else if (st.security === 'sealed') reason = 'sealed';
  else if (st.mechanical === 'jammed') reason = 'jammed';
  else if (st.discovery === 'unknown') reason = 'secret_wall';

  return { traversable: false, reason: reason };
}
