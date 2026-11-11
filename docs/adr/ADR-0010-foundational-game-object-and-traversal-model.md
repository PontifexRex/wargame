# ADR-0010: Foundational Game Object Model, Interaction Pipeline & Traversal Systems

- **Status**: Proposed / Foundational Specification
- **Milestone**: `v0.8.0` – `v0.9.0` Series
- **Supersedes**: Raw integer tile-ID interactive objects (`TILE_CHEST`, `TILE_SHRINE`, `TILE_TRAP_*`) in `floor.tiles[y][x]`

---

## 1. Context & Problem Statement

Through milestone `v0.7.2-tactical`, interactive dungeon features (chests, shrines, traps, stairs, and ore veins) were represented directly inside the 2D terrain array (`floor.tiles[y][x]`) as scalar integer tile IDs, and items were represented as ad-hoc plain objects without a strict separation between static definitions and runtime instances.

As **Aethelgard** expands toward its long-term vision—featuring complex multi-state **Doors** (hinged, portcullis, vault, secret, rune-sealed), **Portals & Portal Networks**, **Lock-and-Key progression**, **Destructible/Barricadable obstacles**, **Ground Pickups**, **Expanded Monster/Entity rosters**, and **Real-Time Overworld / City / Multiplayer readiness**—scalar tile IDs and ad-hoc interaction branches cannot scale.

We need a unified, data-driven **Foundational Game Object Model** that supports:
1. Strict separation between immutable **Object Definitions** and mutable **Runtime Instances**.
2. Composition via reusable **Capabilities / Components** rather than deep inheritance hierarchies.
3. Strict separation between logical **Items** (`ItemInstance`) and physical **World Objects** (`WorldObjectInstance`, including `WorldItemPickupInstance` wrappers).
4. A unified **`InteractionRequest` -> `Requirement` -> `Cost` -> `Effect` -> `InteractionResult`** pipeline.
5. Independent multi-dimensional state axes and environmental **Permeability** (movement, line-of-sight, light, sound, projectiles, magic) for Doors and barriers.
6. Shared **`ITraversable`** and World Topology Graph contracts for Doors, Portals, Stairs, and Overworld transitions.

---

## 2. Core Architectural Principles & 18 Foundational Rules

1. **Stable Definition Identity**: Every object definition has a globally unique, stable `definitionId`.
2. **Unique Runtime Identity**: Every independent runtime instance has its own unique `instanceId` and state `revision`.
3. **Definition vs. Instance Separation**: Authored definition data is immutable at runtime; mutable state lives exclusively on instances.
4. **Items Are Not World Objects**: `ItemInstance` is a logical inventory entity; it does not inherit from `WorldObjectInstance`.
5. **Doors & Portals Are World Objects**: Doors and portals derive from `InteractiveWorldObjectInstance`, never from `ItemInstance`.
6. **World Pickups Wrap Items**: A physical item on the ground is represented by a `WorldItemPickupInstance` that contains or references an `ItemInstance`.
7. **Capability Composition**: Shared behavior is exposed through reusable capabilities (`Interactable`, `Usable`, `Equippable`, `Traversable`, `Damageable`, `Destructible`, `Lockable`, `Container`, `Ownable`, `TrapBearing`, `Discoverable`, `Permeable`).
8. **Component Specialization**: Specialized state and logic belong in components (`components.lock`, `components.durability`, `components.trap`, `components.container`, `components.portal`) rather than combinatorial subclasses.
9. **Unified Interaction Pipeline**: All interactions use a common `InteractionRequest` and `InteractionResult` contract.
10. **Separate Requirements and Costs**: A **Requirement** evaluates whether an action is permitted (e.g., possesses key or meets STR threshold); a **Cost** defines what is spent upon execution (e.g., consumes key charge, mana, or lockpick).
11. **Reusable Effects**: Effects (`UnlockObject`, `ChangeObjectState`, `ApplyDamage`, `ConsumeItem`, `ApplyStatus`, `TriggerTrap`, `TransferCharacter`, `GrantItem`) are composable across items, doors, portals, and shrines.
12. **Decoupled Gameplay Events**: Authoritative state transitions emit structured domain events via `src/engine/events.js` independent of cosmetic UI or audio listeners.
13. **Independent World Connectivity**: Room/region topology and traversal connections are maintained independently of the physical door or portal objects regulating them.
14. **Orthogonal State Dimensions**: Multi-axis object states (e.g., Door `mechanical`, `security`, `discovery`, `structural`, and `power` states) vary independently rather than collapsing into a single flat enum.
15. **Validated Lock-and-Key Generation**: Procedural generation validates progression graphs so required keys/mechanisms are always reachable before the locks they open (or have valid class/destructible alternatives).
16. **Authoritative State Mutations**: All gameplay-relevant mutations validate range, state revision, requirements, and costs atomically so multiplayer authority can be introduced without redesigning object logic.
17. **Versioned Persistence Policies**: Persistent instances serialize `instanceId`, `definitionId`, `revision`, location, and delta state according to their `persistencePolicy`.
18. **Cosmetic Independence**: Visual animations and sound effects never drive authoritative gameplay state changes.

---

## 3. Conceptual Hierarchy & Schemas

### 3.1 Definition Hierarchy (`src/data/definitions/`)
```text
ObjectDefinition
├── ItemDefinition
│   ├── ConsumableDefinition
│   ├── EquipmentDefinition (Weapon, Armor, Helm, Boots, Accessory, Offhand/Shield, Gloves, Belt, Amulet, Ring)
│   ├── MaterialDefinition (Ores, Wood, Stone, Ingots, Essences)
│   ├── KeyDefinition (Mechanical Keys, Rune Keys, Faction Credentials)
│   ├── ToolDefinition (Pickaxes, Lockpicks, Repair Kits)
│   ├── QuestItemDefinition & ArtifactDefinition
│   └── CurrencyDefinition
└── WorldObjectDefinition
    ├── StaticObjectDefinition (Pillars, Statues, Debris, Decorative Braziers)
    ├── InteractiveObjectDefinition
    │   ├── DoorDefinition (Hinged, Sliding, Portcullis, Vault, Secret, Rune-Sealed, Barricade)
    │   ├── PortalDefinition (Floor Rift, Dungeon Entrance/Exit, Waypoint Network Node)
    │   ├── ContainerDefinition (Chests, Reliquaries, Crates, Barrels)
    │   ├── MechanismDefinition (Levers, Pressure Plates, Rune Pedestals)
    │   └── DeviceDefinition (Astral Shrines, Crafting Stations, Resource Nodes/Veins)
    └── WorldPickupDefinition (Ground wrapper for ItemInstances)
```

### 3.2 Runtime Instance Schema
```javascript
// Runtime World Object Instance
{
  instanceId: "obj_door_1042",
  definitionId: "door_iron_portcullis",
  objectType: "door", // 'door' | 'portal' | 'container' | 'mechanism' | 'device' | 'pickup' | 'static'
  worldId: "world_prime",
  locationId: "dng_starfall:fl_1",
  x: 14,
  y: 8,
  ownerId: null,
  factionId: null,
  revision: 1,
  persistencePolicy: "floor_persistent",
  tags: ["door", "metal", "grated"],
  runtimeState: {
    mechanical: "closed",   // 'closed' | 'opening' | 'open' | 'closing' | 'blocked' | 'jammed' | 'disabled'
    security: "locked",     // 'unlocked' | 'locked' | 'sealed' | 'bypassed'
    discovery: "revealed",  // 'unknown' | 'suspected' | 'discovered' | 'revealed'
    structural: "intact",   // 'intact' | 'damaged' | 'critically_damaged' | 'breached' | 'destroyed'
    power: "unpowered"      // 'unpowered' | 'powered' | 'overloaded'
  },
  permeability: {
    movement: false,
    lineOfSight: true,      // Portcullis allows vision and ranged projectiles even when closed!
    light: true,
    sound: true,
    projectiles: true,
    magic: true
  },
  components: {
    durability: { hp: 85, maxHp: 85, armor: 8, threshold: 3, resistances: { slash: 0.5, crush: 1.2 } },
    lock: {
      lockType: "mechanical",
      keyTag: "key.starfall_iron",
      pickDifficulty: 14,
      forceDifficulty: 18,
      consumeKey: false
    },
    trap: null,
    traversal: {
      originRegionId: "room_2",
      destRegionId: "room_3",
      directionality: "bidirectional"
    }
  }
}
```

---

## 4. Phased Implementation Sequence

- **Phase 0**: Object Foundation (`ObjectDefinition`, `RuntimeObject`, `WorldObjectInstance`, Component & Tag registries, spatial floor lookup `getObjectsAt(floor, x, y)`, RLE/JSON serialization).
- **Phase 1**: Interaction Foundation (`InteractionRequest`, `InteractionResult`, boolean `Requirement` evaluator, `Cost` processor, `Effect` runner, and expanded `ENGINE_EVENTS`).
- **Phase 2**: Item System & Pickup Unification (`ItemDefinition`, `ItemInstance`, `ItemStack` compatibility engine, `KeyDefinition` credentials, `WorldItemPickupInstance`, and migrating Chests/Shrines/Traps onto `floor.objects`).
- **Phase 3**: Basic Door System (Wooden, Iron, and Portcullis doors placed at room-corridor choke points; Open/Close/Inspect/Unlock/Bash actions; dynamic permeability in `hasLineOfSight` and `updateFOV`).
- **Phase 4**: Advanced Doors (Secret doors with `DiscoveryState`, trapped doors, multi-lock vault doors, barricading, debris/breach states, and Lock-and-Key BFS reachability validation).
- **Phase 5 & 6**: Portals & `PortalNetwork` (Dungeon Entrance/Exit transitions, unstable floor rifts, multi-endpoint waypoint networks).
- **Phase 7 & 8**: World Topology Graph, Overworld/City integration, and authoritative transaction revisioning.
