---
name: increment-delivery
description: >-
  Use this skill when implementing a new milestone increment from roadmap.md (such as Increment 5 or 6). Outlines planning, ADR evaluation, topological implementation, unit testing expansion, and release tagging workflow.
---

# Increment Delivery Workflow (`v0.5.0-inc5`)

Follow this procedure when developing a new milestone increment from `docs/roadmap.md`.

---

## 1. Specification & Architectural Review

1. Open `docs/roadmap.md` and read the detailed feature specification for the target increment.
2. Cross-reference formulas and values with `docs/game_design_spec.md`.
3. Check `docs/architecture.md` and `docs/adr/README.md` (`ADR-0001` through `ADR-0006`) for state schema, event bus, or persistence contracts.
4. If the increment introduces a new architectural pattern or persistence change, plan a new `docs/adr/ADR-000X-*.md` record.

---

## 2. Topological Implementation Protocol

1. **Constants & Schema Migration First (`src/constants.js`, `src/engine/state.js`)**:
   - Bump `SCHEMA_VERSION` if needed.
   - Add default state properties in `createDefaultGameState()`.
   - Back-fill missing properties in `migrateSaveData(raw)` preserving saves from `v0.1.0-inc1` onward (`ADR-0003`).
2. **Pure Data Registries (`src/data/*.js`)**:
   - Add static catalogs in `src/data/` with zero imports from `engine/` or `ui/`.
   - Register any new module in `scripts/build.ps1` (`$moduleOrder`).
3. **Sandboxed Engine & Event Emissions (`src/engine/*.js`)**:
   - Accept `state = gameState` as the final parameter on all state-mutating functions (`ADR-0002`).
   - Emit domain events via `emitEngineEvent(ENGINE_EVENTS.*, payload, state)` (`ADR-0006`).
   - Use strictly ES2017-compatible syntax (`ADR-0001`: no `?.` or `{ ...obj }`).
4. **UI, Modals & `window.Aethelgard` Bridge (`src/ui/*.js`, `src/main.js`, `index.html`)**:
   - Ensure every `getElementById('...')` in `src/` has a matching `id="..."` in `index.html`.
   - Ensure every `window.Aethelgard.<fn>` in `index.html` is exported on `AethelgardAPI` in `src/main.js`.
5. **Append Cumulative Self-Tests (`src/test/selfTest.js`)**:
   - Never delete or weaken existing tests (`Tests 1..20`).
   - Append new sandboxed unit tests verifying the new increment's mechanics.

---

## 3. Automated Verification & Milestone Release

1. Run the full verification pipeline:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test.ps1
   ```
   Confirm all 4 gates pass:
   - `Validated N ES6 modules (0 circular dependencies) -> dist/bundle.js`
   - `Validated HTML DOM contract (... element IDs verified, 0 missing references)`
   - `Validated window.Aethelgard API contract (... exports) & Golden Rule/ES2017 static gates`
   - `Result: X/X Self-Tests + UI Smoke Suite Passed. Build is healthy!`
2. Update living documentation (`docs/architecture.md`, `docs/game_design_spec.md`, `docs/adr/`, `docs/agentic_workflow.md`, `docs/roadmap.md`).
3. Create a conventional commit and annotated Git tag:
   ```powershell
   git add -A
   git commit -m "feat(incX): implement <Increment Name> with X/X verified tests"
   git tag -a v0.X.0-incX -m "Verified X/X self-tests + UI smoke passing"
   ```
