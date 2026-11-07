# Agent Operational Playbook — Antigravity & AI Pair Programming

This document defines the working standards, safety protocols, and operational guardrails for AI agents working on **Aethelgard: The Starfall Vaults**.

---

## 1. Operating Mindset: Zero Regressions

Aethelgard has reached milestone `v0.3.1-inc3` with 10 automated self-tests ensuring rock-solid game stability. 
When executing changes:
1. **Never break existing mechanics**: If a refactor breaks any of the 10 baseline self-tests, the refactor is considered invalid and must be corrected immediately.
2. **Never leave partial or placeholder code**: Avoid `// TODO: rest of implementation`. Every extracted module must be fully functional and syntactically valid.
3. **Preserve save compatibility**: Any schema additions must have default values in `createDefaultGameState()` and automatic back-filling in `migrateSaveData(raw)`.

---

## 2. Refactoring Phase Protocols

During the ongoing migration from monolithic `index.html` to modular `src/`:
1. **Module Parity**: Extracted modules must expose the exact same API and side effects expected by callers.
2. **Global Export Bridge**: Keep `window.Aethelgard` exposed in `main.js` so that HTML `onclick` attributes and diagnostics modals continue to work seamlessly without rewrite.
3. **Run Verification After Every Module Extraction**:
   - Run tests via CLI (`./scripts/test.ps1`) or headless runner.
   - Verify that test output states 10/10 PASS before proceeding to the next file extraction.

---

## 3. Historical Regression Traps to Avoid

- **Trap 1 — Unclosed Object/Class Braces**: In data catalogs (`CLASSES`, `ORE_CATALOG`, `TALENT_TREES`), ensure all items are exported and closed cleanly.
- **Trap 2 — Corrupting Live State in Tests**: Tests must always use `const sandbox = createDefaultGameState()` and pass that sandbox into tested functions. Never mutate the global `gameState` during tests.
- **Trap 3 — Breaking Legacy Saves**: When introducing new state keys, verify `migrateSaveData()` supports saves starting from `v0.1.0-inc1`.
- **Trap 4 — Blocking Wall Ore Generation**: Always ensure procedural generation checks adjacency so that veins only replace walls bordering walkable floors.

---

## 4. Git & Milestone Commit Conventions

- Use clean, conventional commit messages:
  - `refactor(module): extract procedural generation into src/engine/procedural.js`
  - `test(runner): add headless CLI verification runner`
  - `feat(inc4): implement tier 1 talent tree allocations`
- Tag official increment releases:
  - `git tag -a v0.4.0-inc4 -m "Verified 13/13 self-tests passing"`
