# Testing & Quality Verification Rules

## 1. Sandboxed Test Isolation Pattern (`ADR-0002`)

> [!IMPORTANT]
> Automated tests must **NEVER** mutate the active `gameState` singleton.

Every unit test in `src/test/selfTest.js` must create its own isolated sandbox state:
```javascript
const sandbox = createDefaultGameState();
const outcome = handleHeroDefeat('Abyssal Guardian', sandbox);
```
Mutating global state inside a test corrupts player sessions, breaks save persistence, and introduces test order dependencies.

---

## 2. The 17 Baseline Self-Tests (`v0.4.5-atlas`)

All 17 tests must pass 100% of the time:

1. **Schema v5 Save Migration**: Migrates legacy `v0.1.0-inc1` save data into `v0.4.5-atlas` preserving player level, gold, ores, research ranks, and initializing the Multi-Dungeon registry.
2. **Complete 5-Class Registry**: Verifies Fighter, Thief, Mage, Ranger, and Paladin definitions, skills, passives, and starter gear.
3. **Pure-Floor BFS Staircase Reachability**: Generates 5 consecutive procedural floors and tests every one with `verifyPureFloorBFS()`.
4. **Procedural 6-Slot Equipment & Affixes**: Tests item generation across all 6 slots (`weapon`, `armor`, `helm`, `boots`, `accessory`, `pickaxe`) and rarity tiers.
5. **Interactive Mining, Geology Gating & Domain Event Bus**: Verifies pickaxe durability deduction, mineral extraction, geology gating, and `ENGINE_EVENTS.ORE_MINED` telemetry emission.
6. **Dual-Cost Guild Research Lab**: Verifies rank purchases require both Gold and specific mined minerals from `guildVault`.
7. **Quartermaster Consumables & Antiquarian Assay Multiplier**: Verifies tonic healing, recall scrolls, and assay gold multipliers on ore sales.
8. **Active Skill Validation (Zero Wasted MP)**: Verifies that skills fail safely without consuming MP or turns when no valid targets exist.
9. **Milestone Boss Spawns**: Confirms Floor 5 (`boss_colossus`) and Floor 10 (`boss_weaver`) spawn with milestone stats.
10. **Non-Permanent Defeat & Vanguard Salvage**: Verifies that defeat retains level, equipped gear, and banked vault while salvaging a percentage of pack value.
11. **Astral Gem Extraction & Lapidary Socketing**: Verifies socket rolling, gem socketing stat bonuses, and 25g unsocketing return.
12. **Guild Notice Board Bounties & Reward Claiming**: Verifies procedural bounty progress tracking and reward payouts.
13. **Subterranean Shrines, Runic Traps & Status Effects**: Verifies shrine blessings/repairs and floor trap triggers/disarming.
14. **Multi-Dungeon Atlas Switching & Independent Persistence**: Verifies chartering custom dungeons, switching active dungeons in the Guild, and independent floor persistence.
15. **Exploration-Scale Map Generation (`64x44` to `168x120`) & BFS**: Verifies small and colossal dungeon generation and Pure-Floor BFS connectivity.
16. **Biome-Specific Monster Archetypes, Ranged LOS & Ore Weighting**: Verifies custom monster pools, wall-blocking ranged LOS, and custom ore weight distributions.
17. **RLE Floor Compression & Round-Trip Hydration**: Verifies `compactFloorForStorage` and `hydrateFloorFromStorage` preserve 100% of tile and exploration state while cutting serialized size by >75%.

---

## 3. Cumulative Verification & Build Gate Rules

- **No Test Deletion**: Existing self-tests must never be removed or weakened.
- **Automated Architecture Gates (`./scripts/test.ps1`)**:
  1. `scripts/build.ps1` verifies zero circular dependencies and zero duplicate top-level declarations across all ES6 modules.
  2. `scripts/test.ps1` verifies that every static `document.getElementById('...')` in `src/` exists in `index.html`.
  3. `scripts/test.ps1` runs all self-tests headlessly via `chakra.dll` and requires `17/17 PASS`.
