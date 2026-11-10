# ADR-0009: Developer & Tester Console Architecture & Isolation Protocols

- **Status**: Accepted
- **Date**: 2026-11-10
- **Milestone**: `v0.6.5-dev`
- **Deciders**: AI Pair Programming & Antigravity Assistant

---

## 1. Context & Problem Statement

As **Aethelgard: The Starfall Vaults** grows in procedural complexity—featuring 6 regional dungeons, infinite abyssal strata, 16 monster archetypes, multi-tier boss schedules, and intricate talent systems—manual playtesting to verify deep game states (e.g. testing boss drops on Floor 25 or checking high-level talent balance) requires significant gameplay time.

We need a dedicated **Developer & Tester Console** that allows developers, designers, and testers to:
1. Instantly warp to any dungeon floor depth (1–999) across any dungeon profile.
2. Directly set character level and talent allocation points with automatic stat recomputations.
3. Rapidly test game systems without altering legitimate player save games unless desired.
4. Eventually spawn arbitrary entities, inject inventory items, toggle God Mode, and inspect live state properties.

Crucially, this system must:
- Be accessible via intuitive hotkeys (backtick `` ` `` or `Ctrl+Shift+D`) and browser DevTools (`window.Aethelgard.dev`).
- Be structured so it can be completely gated or stripped in production release builds.
- Not violate any of the Golden Rules or ES2017 syntax constraints (`ADR-0001`).

---

## 2. Architecture & Design Decisions

### A. Access Control & Production Isolation

The developer console is gated through a multi-tier activation check:
- **Shortcut Hook**: Listening on `keydown` for the backtick key (`` ` ``) or `Ctrl+Shift+D`.
- **Query Parameter**: URL containing `?dev=true` or localStorage key `aethelgard_dev_mode = 'true'`.
- **Production Guard**: In production builds, the DOM elements and shortcut bindings are conditionally omitted or deactivated.

### B. Dual-Interface Design

The console provides two complementary workflows:
1. **Quick-Action GUI Toolbar**:
   - Floor selector (Dungeon dropdown + Depth number input + `Teleport` button).
   - Character level setter (Level input + `Apply Level` button).
   - Quick utility toggles (`Full Heal`, `God Mode`, `Reveal Map`).
2. **Interactive Terminal REPL**:
   - Command text prompt with auto-complete and command history (Up/Down arrow keys).
   - Commands:
     - `goto <depth> [dungeonId]` — Teleports hero to specified floor.
     - `level <lvl>` — Sets hero level, calculates XP curve, and awards talent points.
     - `heal` — Full HP/MP restoration.
     - `gold <amt>` / `ores <amt>` / `gems <amt>` — Resource grants.
     - `god` — Toggles invulnerability and 1-hit kills.
     - `reveal` — Explores the entire floor.
     - `spawn <mobId> [count]` — Spawns entities adjacent to hero.

### C. Programmatic API Contract (`window.Aethelgard.dev`)

All developer actions are exposed on a namespaced `window.Aethelgard.dev` object for direct console invocation and automated test verification:

```javascript
window.Aethelgard.dev = {
  gotoFloor: function(depth, dungeonId = null, state = gameState) { ... },
  setLevel: function(targetLevel, state = gameState) { ... },
  fullHeal: function(state = gameState) { ... },
  toggleGodMode: function(state = gameState) { ... },
  revealMap: function(state = gameState) { ... },
  toggleConsole: function() { ... },
  executeCommand: function(cmdString, state = gameState) { ... }
};
```

### D. Sandboxed Teleportation Protocol

When `gotoFloor(depth, dungeonId, state)` is invoked:
1. Validates that `state.dungeon` is hydrated for the target dungeon.
2. If the floor does not yet exist, invokes `generateFloor(depth, dungeon.config, dungeon.numericSeed)`.
3. Sets `state.dungeon.currentFloor = depth`.
4. Safely positions the hero on the ascending staircase `<` (`floor.upPos`) or nearest walkable floor tile.
5. In live mode (`state === gameState`):
   - Refreshes camera viewport around hero `(hero.x, hero.y)`.
   - Recomputes FOV shadowcasting.
   - Refreshes sidebar and survey minimaps.
   - Updates HUD depth badges and location labels.

### E. Character Level Calibration Protocol

When `setLevel(targetLevel, state)` is invoked:
1. Clamps `targetLevel` between `1` and `100`.
2. Computes the cumulative base experience and new `maxXp` curve.
3. Calculates earned talent points: `(targetLevel - 1) * 1` minus already allocated talent points.
4. Calculates earned stat points: `(targetLevel - 1) * 2`.
5. Recalculates all derived statistics via `recomputeHeroDerivedStats(true, state)`.
6. Refills `hero.hp = hero.maxHp` and `hero.mp = hero.maxMp`.

---

## 3. Compliance & Verification Gate

- Added sandboxed **Test 23** in `src/test/selfTest.js` verifying:
  - `dev.gotoFloor(15)` safely hydrates Floor 15 and places the hero on a valid walkable tile.
  - `dev.setLevel(10)` sets level, awards +9 Talent Points and +18 Stat Points, and restores full HP/MP.
  - Safe execution in isolated `sandbox` states without side effects on global `gameState`.
- Preserves all 22 existing self-tests, bringing the baseline to **23/23 PASS**.
