# ADR-0011: Macro Wargame Hierarchy — Universe, Real-Time Overworld, Cities, Guild Archetypes & Parties

- **Status**: Proposed / Strategic Architecture
- **Milestone**: `v0.9.0` – `v1.0.0+` Series
- **Related**: [ADR-0003](./ADR-0003-multi-dungeon-registry-and-rle-persistence.md), [ADR-0010](./ADR-0010-foundational-game-object-and-traversal-model.md)

---

## 1. Context & Strategic Vision

**Aethelgard** is evolving from a pure single-hero dungeon crawler into a hybrid **Grand Strategy Wargame, City Builder, and Tactical Dungeon RPG**.

Key strategic pillars:
1. **Definitive Campaign Arcs (~1+ Year Worlds)**: Worlds do not run aimlessly forever; Alliances compete toward an overarching world victory condition (with non-aligned/specialist guilds able to claim shared victory credit via milestone contributions such as forging endgame artifacts).
2. **Skill, Deception & Low-Consequence Honorable Warfare**:
   - Combat rewards tactical skill, timing, terrain defense, and fog-of-war deception (feints/low troop intel) over raw stat-checking.
   - **Divine War Reimbursement**: The gods reward honorable warfare—players are reimbursed/assisted in rapid rebuilding after battles, and rewards scale upward when fighting stronger adversaries rather than farming weaker ones.
3. **Playstyle-Aligned Guild Archetypes**:
   - **War Guilds**: High-activity, coordinated alliance warfare and territory control.
   - **Adventurers Guilds**: Solo and small-party focus, deep procedural dungeon exploration, relic hunting, and crafting.
   - **Social / Low-Pressure Guilds**: Cooperative city growth, trade, and relaxed progression without punitive activity quotas.
4. **Fair, Non-P2W Economy**: Subscription-centered model with cosmetics and optional guild/alliance pool contributions—never dependent on whales.
5. **Hybrid Time Model**:
   - **Overworld & Cities (Real-Time)**: Construction queues, resource production (`Wood`, `Stone`, `Food`, `Gold`, `Minerals`), and world-map party marching operate in real-time (e.g., ~30s initial building construction, ~10s/tile overworld travel) with idle/upgrade progression loops.
   - **Dungeons & Tactical Encounters (Turn-Based)**: Stepping into a dungeon entrance transitions the party into the tactical grid engine.

---

## 2. Macro Domain Hierarchy ("Start-With-One, Scale-To-Many")

Even while running 100% locally in single-player mode before multiplayer infrastructure is introduced, the state schema is structured to represent the full entity hierarchy, initialized at cardinality `1` (`1 Universe -> 1 World -> 1 Player -> 1 City -> 1 Party/Hero`) and expandable to `N`:

```text
Universe
└── Worlds[] (world_prime: Ruleset, Campaign Clock, Victory Conditions, Overworld Grid)
    ├── OverworldMap (Tiles, Fog-of-War, Resource Nodes, Dungeon Entrances, Roaming Threats)
    ├── Alliances[] & Guilds[] (Guild Type: 'adventurer' | 'war' | 'social', Shared Facilities)
    └── Players[] (player_local)
        ├── Cities[] (city_1: City Grid, Local Stockpile [Wood, Stone, Gold, Ores], Build Queue)
        │   └── Buildings[] (Adventurers Guild Hall, Sawmill, Quarry, Barracks, Temple, Forge, etc.)
        └── Parties[] / Units[]
            ├── Settler Units (Found new cities on valid unoccupied Overworld tiles)
            └── Hero-Led Parties (1..N class members with equipment, skills, and inventory)
```

---

## 3. Progressive Discovery & First-15-Minutes Onboarding State Machine

To prevent overwhelming new players, game systems unlock progressively through an optional **Guided Tutorial & Reward Task System**:

1. **Stage 1 — Overworld Settler Spawn**:
   - New game spawns the player on the **Overworld Map** controlling a **Settler** unit at a random valid unoccupied coordinate with local fog-of-war.
   - If the Settler is slain before settling, the player respawns at a new valid location.
   - **Task 1 (`Settle Your First City`)**: Player scouts nearby resource tiles (`Wood`, `Stone`) and activates `Settle City`.
   - **Reward**: Establishes **City #1** at that coordinate and grants starter construction materials (`50 Wood`, `50 Stone`).
2. **Stage 2 — City View & Real-Time Build Queue**:
   - Entering the City View shows the **City Building Grid** and a **Real-Time Build Queue** (1 active slot initially).
   - **Task 2 (`Build the Adventurers Guild Hall`)**: Costs `50 Wood`, `50 Stone` and takes ~`30 seconds` in the build queue.
3. **Stage 3 — Dungeon Discovery & Real-Time Overworld March**:
   - Completing the Adventurers Guild Hall unlocks hero recruitment and reveals the first **Dungeon Entrance** on the Overworld Map (`dungeon.worldCoords`).
   - Exiting the city places the Hero/Party on the Overworld Map. Clicking the Dungeon Entrance initiates a real-time march across the grid (~`10 seconds per tile`).
4. **Stage 4 — Dungeon Delve, Extraction & Return March**:
   - Reaching the entrance transitions into the turn-based **Dungeon View**.
   - **Normal Exit (`<` Stairs or Portal)**: Places the party outside the **Dungeon Entrance on the Overworld Map** and automatically queues the real-time march back to the City to bank loot.
   - **Dungeon Defeat**: Express-returns the party directly to the City's Adventurers Guild Hall (preserving levels, equipped gear, and banked resources per Golden Rule #2).
