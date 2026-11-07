---
name: verification-runner
description: >-
  Use this skill when running, diagnosing, or adding automated regression tests for Aethelgard. Covers both headless CLI execution and in-browser diagnostics.
---

# Verification & Test Runner Runbook

This skill outlines how to run and interpret the automated verification suite for Aethelgard.

---

## 1. Running Tests via CLI

Run the automated test suite directly from PowerShell:

```powershell
./scripts/test.ps1
```

If Node.js is installed on the machine:
```bash
node src/test/cliRunner.js
```

### Expected Output Format
```text
=== Aethelgard Automated Verification Suite ===
[PASS] 1. Schema v3 Save Migration (v1/v2 Compatibility)
[PASS] 2. Complete 5-Class Registry (Fighter, Thief, Mage, Ranger, Paladin)
[PASS] 3. Pure-Floor BFS Staircase Reachability
[PASS] 4. Procedural 6-Slot Equipment & Rarity Affix Engine
[PASS] 5. Interactive Mining, Geology Gating & Durability Math
[PASS] 6. Dual-Cost Guild Research Lab (Gold + Vault Minerals)
[PASS] 7. Quartermaster Consumables & Antiquarian Assay Multiplier
[PASS] 8. Active Skill Target & Walkable Tile Validation (Zero Wasted MP)
[PASS] 9. Milestone Boss Spawns (Floor 5 Colossus & Floor 10 Weaver)
[PASS] 10. Non-Permanent Defeat & Vanguard Recovery Salvage
--------------------------------------------------
Result: 10/10 Tests Passed. Build is healthy!
```

---

## 2. Running In-Browser Diagnostics

1. Launch `index.html` in Microsoft Edge or any modern browser:
   ```powershell
   Start-Process msedge.exe "file:///$((Get-Location).Path -replace '\\','/')/index.html"
   ```
2. Click the **Verify Inc-X** button located in the top-right header.
3. The diagnostics modal opens, runs all tests with clean sandboxes, and displays formatted status indicators.

---

## 3. Adding New Unit Tests for Future Increments

When adding tests (e.g. Test 11 for Increment 4):
1. Open `src/test/selfTest.js`.
2. Append the test logic to the `results` array using an isolated sandbox state:
   ```javascript
   const sandbox = createDefaultGameState();
   // Exercise feature logic on sandbox
   results.push({
     name: '11. Talent Tree Node Allocation & Prerequisite Gating',
     pass: t11Pass,
     detail: `Fighter Iron Skin allocated (+4 Armor confirmed)`
   });
   ```
3. Update both `src/test/selfTest.js` and `src/test/cliRunner.js`.
4. Run `./scripts/test.ps1` to confirm `11/11 PASS`.
