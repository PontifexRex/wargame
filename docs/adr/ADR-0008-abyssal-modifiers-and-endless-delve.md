# ADR-0008: Abyssal Elite Affixes, Combat Reactive Modifiers & Endless Strata Delve

- **Status**: Accepted
- **Date**: 2026-11-10
- **Milestone**: `v0.6.0-inc6`
- **Deciders**: AI Pair Programming & Antigravity Assistant

---

## 1. Context & Problem Statement

Prior to `v0.6.0-inc6`, elite monsters in Aethelgard possessed simple stat boosts and one of four status-inflicting affixes (`vampiric`, `molten`, `venomous`, `fortified`). While functional, these affixes provided limited tactical variance during melee and ranged encounters. Furthermore, dungeon exploration capped at Floor 20 (culminating in the Vespera encounter). Players seeking long-term progression had no endless challenge avenue with scaling difficulty, deep-delve telemetry, or recurring boss encounters beyond Floor 20.

We need:
1. **Reactive Combat Affixes**: Elite modifiers that react to player attacks dynamically (damage reflection, evasive phase-shifting, and on-death detonations).
2. **Tactical Hero Debuffs**: Status effects that impact action economy (such as increasing skill MP cost and reducing dodge).
3. **Endless Strata Scaling**: A permanent, unbounded delve dungeon (`abyssal_rift`, `dng_abyss`) that generates smoothly to arbitrary depths while maintaining Pure-Floor BFS guarantees, boss recurrence cycles, and Codex high-water mark records.

---

## 2. Decision & Architecture

### A. Four New Reactive Abyssal Elite Affixes

We extend the `ELITE_AFFIXES` catalog in `src/data/items.js` and engine combat hooks in `src/engine/combat.js`:

| Affix ID | Name | Color | Combat Trigger & Mechanical Effect |
| :--- | :--- | :--- | :--- |
| `reflective` | **Reflective** | `#ec4899` (Hot Pink) | **On-Hit Thorns**: When struck by player melee or skill damage, returns `Math.max(1, Math.round(dmg * 0.25))` back to the hero as Thorns damage (`⚠ REFLECT!`). |
| `chilling` | **Chilling** | `#38bdf8` (Ice Blue) | **Action Penalty**: On landing a melee attack, inflicts `chilled` on the hero (3 turns; reduces Dodge by 15% and increases all active Skill MP costs by +2). |
| `temporal` | **Temporal Warp** | `#a855f7` (Violet) | **Phase-Shift Escape**: When damaged and surviving, has a 40% chance to blink to an adjacent/nearby explored walkable floor tile, breaking immediate melee engagement. |
| `volatile` | **Volatile** | `#ef4444` (Crimson) | **On-Death Detonation**: Upon reaching 0 HP, immediately detonates in a 1-tile Chebyshev radius, dealing `Math.round(m.atk * 1.5)` damage to the hero and adjacent foes (`💥 VOLATILE BURST!`). |

### B. High-Tier Equipment Affixes

We expand `AFFIX_POOL` in `src/data/items.js` with deep abyssal affixes:
- `thorns`: **of Retaliation** (+Thorns damage returned to melee attackers).
- `leech`: **of the Blood Drinker** (+Life leech on melee strike).
- `ward`: **of the Astral Aegis** (+Flat physical & magical damage reduction).

### C. The Abyssal Rift (`dng_abyss`) & Endless Depth Scaling

We register a 6th Curated Regional Dungeon in `src/data/dungeons.js` and `createDefaultDungeonsRegistry()`:
- **Dungeon ID**: `dng_abyss` (`abyssal_rift`)
- **Map Dimensions**: 80x60, infinite floors (`maxDepth: 999`), base danger tier 3.
- **Visual Palette**: Cosmic void glass (`vespera_crater`).
- **Endless Scaling Curve**: Beyond Floor 20, monster stats scale according to `effDepth = depth + Math.floor(Math.pow(depth - 20, 1.15))`.
- **Boss Recurrence Cycle**: Every 5 floors beyond Floor 20 (Floors 25, 30, 35, 40...) an Abyssal Boss spawns (cycling through Ignis, Weaver, Colossus, Vespera), dropping guaranteed Relic equipment and Astralite.
- **Deepest Delve Tracking**: `gameState.codex.deepestFloorByDungeon.dng_abyss` is updated on floor entry and highlighted on the Guild Codex leaderboard.

---

## 3. Compliance with Golden Rules & System Invariants

1. **Non-Permanent Death**: Hero defeat caused by `reflective` thorns or `volatile` detonation follows standard `handleHeroDefeat`: player returns to the Guild Bastion at full HP/MP with equipped gear and vault intact.
2. **Pure-Floor BFS Guarantee**: Deep floor generation (Floors 25+) undergoes strict `verifyPureFloorBFS()` validation to guarantee staircase and boss chamber connectivity solely through floor tiles.
3. **No Optional Chaining or Object Spread**: All implementation code strictly adheres to Chakra ES2017 syntax (`ADR-0001`).
4. **Cumulative Self-Tests**: Expands automated test coverage from 21/21 to **22/22 PASS** without regression.
