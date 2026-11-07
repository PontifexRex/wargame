---
name: increment-delivery
description: >-
  Use this skill when implementing a new milestone increment from roadmap.md (such as Increment 4 or 5). Outlines planning, implementation, unit testing expansion, and tagging workflow.
---

# Increment Delivery Workflow

Follow this procedure when developing a new milestone from `roadmap.md`.

---

## 1. Specification Review

1. Open `roadmap.md` and read the detailed feature specification for the target increment (e.g. Increment 4).
2. Cross-reference formulas and values with `game_design_spec.md`.
3. Check `architecture.md` for any required state schema modifications.

---

## 2. Implementation Protocol

1. **Schema Migration First**:
   - If new state properties are needed (e.g. `talentsSpent`, `activeAffixPool`), update `createDefaultGameState()` in `src/engine/state.js`.
   - Update `migrateSaveData()` so older saves seamlessly gain default values for the new properties.
2. **Domain Logic Implementation**:
   - Implement pure mechanics in `src/engine/` or `src/data/`.
   - Implement DOM and canvas elements in `src/ui/`.
3. **Append Self-Tests**:
   - Never overwrite existing tests.
   - Append new tests to `src/test/selfTest.js` and `src/test/cliRunner.js`.

---

## 3. Verification & Milestone Release

1. Run the test suite:
   ```powershell
   ./scripts/test.ps1
   ```
2. Verify visual appearance and manual interactions in `index.html`.
3. Update `readme.md` build version badge.
4. Update `roadmap.md` marking the increment completed.
5. Create a tagged Git commit:
   ```bash
   git add .
   git commit -m "Release v0.4.0-inc4: Implemented Increment 4 with 13/13 verified tests"
   git tag -a v0.4.0-inc4 -m "Verified 13/13 self-tests passing"
   ```
