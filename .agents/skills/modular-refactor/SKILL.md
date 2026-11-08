---
name: modular-refactor
description: >-
  Use this skill when adding new ES6 modules to src/ or refactoring existing modules. Provides topological dependency order, scripts/build.ps1 registration, and regression safeguards.
---

# Modular Architecture & Module Addition Runbook (`v0.4.6-arch`)

This skill guides adding or refactoring ES6 modules in `src/` while maintaining dual-boot (`<script type="module">` + `dist/bundle.js`) and headless Chakra (`ES2017`) compatibility (`ADR-0001`).

---

## 1. Layered Topological Order (`scripts/build.ps1`)

All modules in `src/` must follow a strict Directed Acyclic Graph (DAG) registered in `$moduleOrder` inside `scripts/build.ps1`:

```text
Layer 1: src/constants.js           (Tile IDs, dimensions, schema version — zero imports)
Layer 2: src/data/*.js              (Pure static registries — imports only from constants.js or data/)
Layer 3: src/engine/rng.js          (Deterministic PRNG)
         src/engine/compression.js  (RLE 2D grid packing)
         src/engine/events.js       (Synchronous Domain Event Bus — ADR-0006)
         src/engine/state.js        (gameState, createDefaultGameState, migrateSaveData)
         src/engine/audio.js        (Web Audio API synthesizer)
         src/engine/procedural.js   (Macro-sector generator, Int32Array BFS, equipment rolls)
         src/engine/actions.js      (Mining, Lapidary, Bounties, Atlas, Shrines/Traps, Defeat)
         src/engine/combat.js       (Turn loop, Bresenham wall LOS, Monster AI, Skills)
Layer 4: src/ui/renderer.js         (21x15 Camera Frustum, FOV, [M] Overview)
         src/ui/domSync.js          (Guild Hub tabs, HUD, Chronicle)
         src/ui/modals.js           (Backdrop modals)
         src/ui/input.js            (Keyboard, hover scanner, Safe A* Autowalk)
Layer 5: src/test/selfTest.js       (Sandboxed self-test suite)
Layer 6: src/main.js                (Bootstrap & window.Aethelgard / AethelgardAPI export bridge)
```

---

## 2. Module Hygiene Checklist

When adding or splitting a module in `src/`:
1. **Register in `scripts/build.ps1`**: Add the relative path in topological order to `$moduleOrder` in `scripts/build.ps1`.
2. **Unique Top-Level Identifiers**: Because `scripts/build.ps1` concatenates all modules into a single IIFE for `dist/bundle.js`, top-level `const`/`let`/`var`/`function`/`class` names must be globally unique across all 24+ modules (`scripts/build.ps1` enforces this automatically).
3. **ES2017 Syntax Only (`ADR-0001`)**: Do not use optional chaining (`?.`) or object rest/spread (`{ ...obj }`). Use `Object.assign({}, obj)` and explicit null checks.
4. **Verify Immediately**:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test.ps1
   ```
