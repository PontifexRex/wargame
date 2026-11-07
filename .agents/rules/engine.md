# Game Engine Rules & Mathematical Invariants

## 1. Turn-Based Tick Cycle

1. **Player Turn**: The engine is strictly turn-based. Enemies do not act in real-time. An engine tick occurs only when the player:
   - Moves or bumps an enemy / mineral / chest (`handlePlayerAction`)
   - Uses an active skill (`executeClassSkill`)
   - Quaffs a potion or reads a recall scroll (`useHealingTonic`, `useRecallScroll`)
   - Waits (`waitTurn` via Spacebar)
2. **Enemy AI Tick**:
   - Only living monsters on the current floor within sensory range act on tick.
   - Slain monsters drop loot/XP and are immediately removed from active turns.
3. **Passive Regeneration**:
   - Health and mana regeneration ticks occur per turn based on equipped affix bonuses and class passives.

---

## 2. Combat Resolution Formulas

All damage calculations must adhere to the design specification:

- **Physical Damage**:
  $$\text{Damage} = \max(1, \text{Attacker Physical Power} - \lfloor \text{Defender Armor} \times 0.4 \rfloor)$$
- **Magical Damage**:
  $$\text{Damage} = \max(1, \text{Attacker Spell Power} - \lfloor \text{Defender Ward} \times 0.5 \rfloor)$$
- **Critical Strike**:
  - Chance: `critChance` (Base 5% + Agility/Affix bonus).
  - Multiplier: Flat 1.5x damage on crit, formatted with a gold exclamation mark in combat logs.
- **Evasion**:
  - Chance: $\min(40\%, \lfloor \text{Defender Agility} \times 0.5\% \rfloor)$. Evaded hits deal 0 damage.

---

## 3. Mining, Durability & Geology Gating

- **Geology Requirement**:
  - Copper: Geology Rank 0
  - Iron: Geology Rank 1
  - Mithril: Geology Rank 2
  - Geodes: Geology Rank 3
  - Star-Crystal: Geology Rank 4
  - Void Astralite: Geology Rank 5
- **Durability Consumption**:
  - Each mining action costs 1 Pickaxe Durability.
  - When durability reaches 0, the pickaxe is fractured and cannot mine until repaired at the Guild Hearth.
- **Ore Wall Conversion**:
  - Once mined, a mineral wall tile converts to `TILE_FLOOR` and the player receives the mineral in their `expeditionPack`.

---

## 4. Procedural Dungeon Generation & Pure-Floor BFS

- **Adjacency Rule for Mineral Veins**: Veins must **only** replace `TILE_WALL` tiles that have at least one adjacent orthogonal `TILE_FLOOR` neighbor. Never spawn a vein in the middle of a corridor.
- **Pure-Floor BFS Guarantee**:
  - Every generated floor must guarantee reachability from Player Entrance `(startX, startY)` to Descending Stairs `(stairsDownX, stairsDownY)` and all chests using **only walkable floor tiles** (`TILE_FLOOR`, `TILE_STAIRS_*`, `TILE_CHEST`).
  - Corridors must never be blocked by un-mined ore veins or impassable obstacles.

---

## 5. State Management & Save Migration

- **State Immutability in Pure Functions**: Math and combat calculation functions should avoid mutating global state directly when computing outcomes.
- **Save Migration Guarantee**:
  - Any new state properties must be initialized in `createDefaultGameState()` and handled in `migrateSaveData(rawSave)`.
  - Schema migration must always preserve existing player progress (gold, banked minerals, character level, equipped items).
