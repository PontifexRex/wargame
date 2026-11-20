// Foundational Game Object & Runtime Instance Engine (ADR-0010)
// Manages object instances, spatial floor queries, item pickups, and the ItemStack stacking engine.

import { rollLootTable } from '../data/lootTables.js';
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
    components: (function() {
      const mc = {};
      if (defObj.defaultComponents) {
        const dKeys = Object.keys(defObj.defaultComponents);
        for (let di = 0; di < dKeys.length; di++) {
          const dk = dKeys[di];
          mc[dk] = Object.assign({}, defObj.defaultComponents[dk]);
        }
      }
      if (options.components) {
        const oKeys = Object.keys(options.components);
        for (let oi = 0; oi < oKeys.length; oi++) {
          const ok = oKeys[oi];
          mc[ok] = Object.assign(mc[ok] || {}, options.components[ok]);
        }
      }
      if (options.traversal) {
        mc.traversal = Object.assign(mc.traversal || {}, options.traversal);
      }
      return mc;
    })(),
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

// ============================================================================
// PORTAL & WAYPOINT HELPERS (Fast-Travel & Astral Traversal)
// ============================================================================

export function createPortalInstance(defId = 'portal_ancient_waypoint', x = 0, y = 0, options = {}) {
  const portal = createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.PORTAL
  }));
  return portal;
}

export function isPortal(obj) {
  return Boolean(obj && obj.objectType === WORLD_OBJECT_TYPES.PORTAL);
}

export function isPortalActive(portal) {
  if (!portal || !isPortal(portal)) return false;
  const st = portal.runtimeState || {};
  return st.mechanical === 'active';
}

export function registerDiscoveredWaypoint(floorDepth, x, y, waypointObj, state) {
  if (!state || !state.dungeon) return false;
  if (!state.dungeon.waypoints) {
    state.dungeon.waypoints = {};
  }
  const key = `f${floorDepth}`;
  const existing = state.dungeon.waypoints[key];
  if (existing && existing.attuned) return false;

  state.dungeon.waypoints[key] = {
    depth: floorDepth,
    x: x,
    y: y,
    attuned: true,
    instanceId: waypointObj ? waypointObj.instanceId : `wp_${floorDepth}`,
    name: (waypointObj && waypointObj.name) || `Floor ${floorDepth} Celestial Waypoint`,
    discoveredAtTurn: state.turn || 0
  };
  return true;
}

export function getDiscoveredWaypoints(state) {
  if (!state || !state.dungeon || !state.dungeon.waypoints) return [];
  const wps = state.dungeon.waypoints;
  const list = [];
  const keys = Object.keys(wps);
  for (let i = 0; i < keys.length; i++) {
    const wp = wps[keys[i]];
    if (wp && wp.attuned) {
      list.push(wp);
    }
  }
  list.sort((a, b) => a.depth - b.depth);
  return list;
}

// =========================================================================
// Increment 8.3: Mechanisms, Destructible Props & Environmental Hazards
// =========================================================================

export function createMechanismInstance(defId = 'mech_wall_lever', x = 0, y = 0, options = {}) {
  const inst = createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.MECHANISM
  }));
  if (inst && options.linkedTargetIds && Array.isArray(options.linkedTargetIds)) {
    if (!inst.components) inst.components = {};
    if (!inst.components.mechanism) inst.components.mechanism = { mechanismType: 'lever', linkedTargetIds: [] };
    inst.components.mechanism.linkedTargetIds = options.linkedTargetIds.slice();
  }
  return inst;
}

export function createPropInstance(defId = 'prop_supply_crate', x = 0, y = 0, options = {}) {
  return createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.PROP
  }));
}

export function createContainerInstance(defId = 'container_dungeon_chest', x = 0, y = 0, options = {}) {
  return createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.CONTAINER
  }));
}

export function isClosedContainer(obj) {
  return Boolean(obj && obj.objectType === WORLD_OBJECT_TYPES.CONTAINER && obj.runtimeState && obj.runtimeState.mechanical === 'closed');
}

export function resolveLootableComponent(obj, floor, state, randFn = Math.random) {
  const lootCfg = obj && obj.components && obj.components.lootable;
  if (!lootCfg || !lootCfg.lootTableId) return { dropped: false, items: [], gold: 0 };

  const chance = typeof lootCfg.dropChance === 'number' ? lootCfg.dropChance : 1.0;
  const rolls = Math.max(1, lootCfg.rolls || 1);
  const depth = (floor && floor.depth) || 1;
  const droppedItems = [];
  let goldGained = 0;

  for (let r = 0; r < rolls; r++) {
    const rollVal = typeof randFn === 'function' ? randFn() : Math.random();
    if (rollVal > chance) continue;
    const entry = rollLootTable(lootCfg.lootTableId, depth, randFn);
    if (!entry) continue;

    if (entry.kind === 'gold') {
      const amt = entry.goldAmount || 3;
      goldGained += amt;
      if (state && state.hero && Array.isArray(state.hero.expeditionPack)) {
        state.hero.expeditionPack.push({ id: entry.id, name: entry.name, qty: 1, val: amt });
      } else if (state && state.guildVault) {
        state.guildVault.gold = (state.guildVault.gold || 0) + amt;
      }
      droppedItems.push(entry);
    } else if (entry.kind === 'consumable' && state && state.hero && state.hero.consumables) {
      const k = entry.consumableKey || 'potions';
      state.hero.consumables[k] = (state.hero.consumables[k] || 0) + (entry.qty || 1);
      droppedItems.push(entry);
    } else if (entry.kind === 'ore' && state && state.hero && Array.isArray(state.hero.expeditionPack)) {
      const existing = state.hero.expeditionPack.find(function(it) { return it.id === entry.oreId; });
      if (existing) existing.qty += (entry.qty || 1);
      else state.hero.expeditionPack.push({ id: entry.oreId || 'copper', name: entry.name, qty: entry.qty || 1, val: entry.value || 5 });
      droppedItems.push(entry);
    } else if (entry.kind === 'trash' || entry.kind === 'trade') {
      if (state && state.hero && Array.isArray(state.hero.expeditionPack)) {
        state.hero.expeditionPack.push({ id: entry.id, name: entry.name, qty: 1, val: entry.value || 0, isTrash: entry.kind === 'trash' });
      }
      droppedItems.push(entry);
    } else if (entry.kind === 'gear') {
      if (state && state.hero && Array.isArray(state.hero.expeditionGear)) {
        state.hero.expeditionGear.push({
          uid: 'chest_gear_' + Date.now() + '_' + Math.floor((typeof randFn === 'function' ? randFn() : Math.random()) * 10000),
          slot: 'weapon',
          name: 'Vault-Forged Blade',
          rarity: 'uncommon',
          atk: 8 + Math.floor(depth * 1.5),
          def: 1,
          value: 45 + depth * 10
        });
      }
      droppedItems.push(entry);
    }
  }

  return { dropped: droppedItems.length > 0, items: droppedItems, gold: goldGained };
}

export function openContainerObject(containerObj, floor, state, randFn = Math.random) {
  if (!isClosedContainer(containerObj)) return { opened: false, loot: null };
  containerObj.runtimeState.mechanical = 'open';
  if (!containerObj.permeability) containerObj.permeability = {};
  containerObj.permeability.movement = true;
  const loot = resolveLootableComponent(containerObj, floor, state, randFn);
  return { opened: true, loot: loot };
}

export function createHazardInstance(defId = 'hazard_slag_vent', x = 0, y = 0, options = {}) {
  return createWorldObjectInstance(defId, Object.assign({}, options, {
    x: x,
    y: y,
    objectType: WORLD_OBJECT_TYPES.HAZARD
  }));
}

export function isMechanism(obj) {
  return Boolean(obj && obj.objectType === WORLD_OBJECT_TYPES.MECHANISM);
}

export function isDestructibleProp(obj) {
  return Boolean(obj && obj.objectType === WORLD_OBJECT_TYPES.PROP && obj.runtimeState && obj.runtimeState.structural !== 'destroyed');
}

export function isEnvironmentalHazard(obj) {
  return Boolean(obj && obj.objectType === WORLD_OBJECT_TYPES.HAZARD && obj.runtimeState && obj.runtimeState.mechanical === 'active');
}

export function toggleLinkedMechanisms(mechObj, floor) {
  if (!mechObj || !isMechanism(mechObj) || !floor || !Array.isArray(floor.objects)) {
    return { toggled: 0, targetIds: [] };
  }
  const st = mechObj.runtimeState || {};
  const nextMechState = st.mechanical === 'pulled' ? 'idle' : 'pulled';
  st.mechanical = nextMechState;

  const linkIds = (mechObj.components && mechObj.components.mechanism && Array.isArray(mechObj.components.mechanism.linkedTargetIds))
    ? mechObj.components.mechanism.linkedTargetIds
    : [];
  const affected = [];

  for (let i = 0; i < linkIds.length; i++) {
    const tid = linkIds[i];
    const target = floor.objects.find(function(o) { return o.instanceId === tid; });
    if (!target) continue;
    if (!target.runtimeState) target.runtimeState = {};
    if (!target.permeability) target.permeability = {};

    const opening = nextMechState === 'pulled';
    if (target.runtimeState.discovery === 'unknown') {
      target.runtimeState.discovery = 'revealed';
    }
    if (opening) {
      target.runtimeState.security = 'unlocked';
      target.runtimeState.mechanical = 'open';
      target.permeability.movement = true;
      target.permeability.lineOfSight = true;
      target.permeability.light = true;
      target.permeability.projectiles = true;
      target.permeability.magic = true;
    } else {
      target.runtimeState.mechanical = 'closed';
      target.permeability.movement = false;
      if (target.definitionId !== 'door_iron_portcullis') {
        target.permeability.lineOfSight = false;
        target.permeability.light = false;
      }
    }
    affected.push(tid);
  }

  return { toggled: affected.length, state: nextMechState, targetIds: affected };
}

export function damageDestructibleProp(propObj, rawDamage, floor, state) {
  if (!propObj || !isDestructibleProp(propObj)) return { destroyed: false, damage: 0 };
  const dur = (propObj.components && propObj.components.durability) || { hp: 15, maxHp: 15, armor: 0 };
  const dmg = Math.max(1, Math.round(rawDamage || 10) - (dur.armor || 0));
  dur.hp = Math.max(0, (dur.hp || 0) - dmg);

  if (dur.hp > 0) {
    if (propObj.runtimeState) propObj.runtimeState.structural = 'damaged';
    return { destroyed: false, damage: dmg, remainingHp: dur.hp };
  }

  if (!propObj.runtimeState) propObj.runtimeState = {};
  propObj.runtimeState.structural = 'destroyed';
  propObj.runtimeState.mechanical = 'open';
  if (!propObj.permeability) propObj.permeability = {};
  propObj.permeability.movement = true;
  propObj.permeability.lineOfSight = true;
  propObj.permeability.light = true;
  propObj.permeability.projectiles = true;
  propObj.permeability.magic = true;

  const propCfg = (propObj.components && propObj.components.prop) || {};
  let spawnedHazards = 0;
  let goldLooted = 0;
  const lootRes = resolveLootableComponent(propObj, floor, state);
  goldLooted += (lootRes.gold || 0);
  if (propCfg.goldDrop && state && state.guildVault) {
    goldLooted += propCfg.goldDrop;
    state.guildVault.gold = (state.guildVault.gold || 0) + propCfg.goldDrop;
  }

  if (propCfg.spawnsHazard && floor && Array.isArray(floor.objects)) {
    const offsets = [
      { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
    for (let i = 0; i < offsets.length; i++) {
      const hx = propObj.x + offsets[i].dx;
      const hy = propObj.y + offsets[i].dy;
      if (floor.tiles && floor.tiles[hy] && floor.tiles[hy][hx] !== 0) {
        const exists = floor.objects.some(function(o) {
          return o.x === hx && o.y === hy && o.definitionId === propCfg.spawnsHazard;
        });
        if (!exists) {
          floor.objects.push(createHazardInstance(propCfg.spawnsHazard, hx, hy));
          spawnedHazards++;
        }
      }
    }
  }

  return {
    destroyed: true,
    damage: dmg,
    goldLooted: goldLooted,
    lootResult: lootRes,
    spawnedHazards: spawnedHazards
  };
}

export function resolveHazardStepEffects(actor, x, y, floor) {
  if (!actor || !floor || !Array.isArray(floor.objects)) return { triggered: false, damage: 0, statuses: [] };
  const hazards = floor.objects.filter(function(o) {
    return o.x === x && o.y === y && isEnvironmentalHazard(o);
  });
  if (hazards.length === 0) return { triggered: false, damage: 0, statuses: [] };

  let totalDmg = 0;
  const appliedStatuses = [];

  for (let i = 0; i < hazards.length; i++) {
    const hz = hazards[i];
    const hCfg = (hz.components && hz.components.hazard) || {};
    let dmg = hCfg.damage || 0;

    // If actor is burning and steps into an oil slick, ignite for burst fire damage!
    const actorStatuses = Array.isArray(actor.statuses) ? actor.statuses : [];
    const isBurning = actorStatuses.some(function(s) { return s.id === 'burn'; });
    if (hCfg.hazardType === 'oil' && isBurning) {
      dmg += (hCfg.igniteDamage || 18);
      hz.runtimeState.mechanical = 'spent';
    }

    if (dmg > 0) {
      actor.hp = Math.max(0, (actor.hp || 0) - dmg);
      totalDmg += dmg;
    }

    if (hCfg.statusId) {
      if (!Array.isArray(actor.statuses)) actor.statuses = [];
      const existing = actor.statuses.find(function(s) { return s.id === hCfg.statusId; });
      if (existing) {
        existing.turns = Math.max(existing.turns || 0, hCfg.statusTurns || 2);
      } else {
        actor.statuses.push({ id: hCfg.statusId, turns: hCfg.statusTurns || 2 });
      }
      appliedStatuses.push(hCfg.statusId);
    }
  }

  return { triggered: true, damage: totalDmg, statuses: appliedStatuses };
}
