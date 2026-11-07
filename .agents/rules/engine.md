# Game Engine Rules & Mathematical Invariants

## 1. Turn-Based Tick Cycle

1. **Player Turn**: The engine is strictly turn-based. Enemies do not act in real-time. An engine tick occurs only when the player:
   - Moves or bumps an enemy / mineral / chest / shrine / visible trap (`handlePlayerAction`)
   - Uses an active skill (`executeClassSkill`)
   - Quaffs a potion or reads a recall scroll (`useHealingTonic`, `useRecallScroll`)
   - Waits (`waitTurn` via Spacebar)
2. **Enemy AI Tick (`processTurn`)**:
   - Only living monsters on the current floor within sensory range (`14` tiles Manhattan distance) act on tick.
   - Ranged and caster monsters must verify unobstructed wall Line-of-Sight (`hasLineOfSight(floor, mx, my, hx, hy)`) before firing projectiles or hexes (`ADR-0005`).
   - Slain monsters drop loot/XP, emit `ENGINE_EVENTS.MONSTER_SLAIN`, and are immediately removed from active turns.

---

## 2. Mining, Durability, Geology Gating & Astral Gems

- **Geology Requirement**:
  - Copper: Geology Rank 0
  - Iron: Geology Rank 1
  - Mithril & Relic Geodes: Geology Rank 2
  - Star-Crystal & Void Astralite: Geology Rank 3
- **Durability Consumption**:
  - Each mining action costs 1 Pickaxe Durability unless a Free-Strike procs (`Thief Mineral Vein Sense` or `Dwarven Toolsmithing`).
  - When durability reaches 0, the pickaxe cannot mine until repaired at the Guild or via a Shrine of the Earthbreaker.
- **Ore Wall Conversion & Gem Drops**:
  - Once mined, a mineral wall tile converts to `TILE_FLOOR`, emits `ENGINE_EVENTS.ORE_MINED`, and adds the ore (plus any rolled uncut Astral Gem on Geode/Star-Crystal/Astralite veins) to `expeditionPack`.

---

## 3. Procedural Dungeon Generation & Pure-Floor BFS (`ADR-0004`)

- **Dynamic Exploration-Scale Grids**: Map dimensions (`floor.width`, `floor.height`) are determined by the active dungeon's `DungeonConfig` (`64x44` to `168x120`, with legacy `21x15` saves supported). Never hardcode `21` or `15` in engine loops.
- **Adjacency Rule for Mineral Veins & Shrines**: Veins (`TILE_ORE_*`) and Shrines (`TILE_SHRINE`) must **only** replace `TILE_WALL` tiles that have at least one adjacent orthogonal `TILE_FLOOR` neighbor. Never spawn a vein or shrine on a corridor floor tile.
- **Pure-Floor BFS Guarantee (`verifyPureFloorBFS`)**:
  - Every generated floor must guarantee reachability from `upPos` (`<`) to `downPos` (`>`) and all chests using a zero-allocation `Int32Array` BFS over walkable floor tiles (`TILE_FLOOR`, `TILE_STAIRS_*`, `TILE_CHEST*`, `TILE_TRAP_*`).

---

## 4. State Management, Save Migration & RLE Persistence (`ADR-0002`, `ADR-0003`)

- **Sandboxed State Injection**: Every state-mutating function accepts `state = gameState` as its final parameter and suppresses DOM/audio/localStorage side effects when `state !== gameState`.
- **Save Migration Guarantee**: Any new state properties must be initialized in `createDefaultGameState()` and back-filled in `migrateSaveData(rawSave)`.
- **RLE Floor Compaction**: Inactive floors are RLE-packed via `compactFloorForStorage(floor)` on save and transparently hydrated via `ensureDungeonFloorHydrated(dungeon, depth)` on access.
