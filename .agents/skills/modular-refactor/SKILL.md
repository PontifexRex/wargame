---
name: modular-refactor
description: >-
  Use this skill when refactoring or extracting code from monolithic index.html into modular ES6 files in src/. Provides step-by-step extraction order, dependency checks, and regression safeguards.
---

# Modular Refactor Runbook

This skill guides the safe extraction of monolithic `index.html` code into clean, modular ES6 files in `src/` without breaking gameplay or failing self-tests.

---

## 1. Safe Extraction Sequence

Follow this strict topological dependency order to avoid import errors:

```text
Step 1: src/constants.js           (Tile types, dimensions, schema version)
Step 2: src/data/                  (Pure data: classes.js, ores.js, items.js, research.js, talents.js)
Step 3: src/engine/state.js        (gameState schema, createDefaultGameState, migrateSaveData)
Step 4: src/engine/procedural.js   (Dungeon generator, BFS reachability, equipment roll)
Step 5: src/engine/actions.js      (Mining, town actions, merchant, defeat recovery)
Step 6: src/engine/combat.js       (Turn cycle, bump attack, skill execution)
Step 7: src/engine/audio.js        (Web Audio synthesizers)
Step 8: src/ui/renderer.js         (Canvas 2D renderer, FOV, floating text)
Step 9: src/ui/domSync.js          (DOM sync, chronicle log, inventory rendering)
Step 10: src/ui/modals.js          (Modal dialogs, popups)
Step 11: src/ui/input.js           (Keyboard & mouse input dispatch)
Step 12: src/main.js               (Bootstrap, lifecycle events, window.Aethelgard)
Step 13: index.html update         (Switch to <script type="module" src="./src/main.js"></script>)
```

---

## 2. Extraction Checkpoints

After extracting each module:
1. Ensure all exports match what callers expect.
2. Check that no circular imports are introduced.
3. Verify syntax and run tests:
   ```powershell
   ./scripts/test.ps1
   ```
4. Only commit or move to the next file when all tests pass.

---

## 3. Preserving Global Window Bindings

The HTML layout in `index.html` uses inline `onclick="window.Aethelgard.someAction()"` handlers.
`src/main.js` must expose all interactive functions to `window.Aethelgard`:

```javascript
window.Aethelgard = {
  toggleAudio,
  openSaveSyncModal,
  closeSaveSyncModal,
  copySaveJson,
  downloadSaveJson,
  importSaveJson,
  openNewDungeonModal,
  closeNewDungeonModal,
  confirmChartNewDungeon,
  descendIntoDungeon,
  restAtGuild,
  repairPickaxeAtGuild,
  spendStatPoint,
  allocateTalent,
  respecTalents,
  openClassSelectModal,
  closeClassSelectModal,
  selectAdventurerClass,
  openItemInspectModal,
  closeItemInspectModal,
  showOutcomeModal,
  closeOutcomeModal,
  switchGuildTab,
  runSelfTests,
  openDiagnosticsModal,
  closeDiagnosticsModal
};
```
