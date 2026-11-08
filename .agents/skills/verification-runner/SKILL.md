---
name: verification-runner
description: >-
  Use this skill when running, diagnosing, or adding automated regression tests and static contract gates for Aethelgard. Covers headless CLI execution (chakra.dll / Node) and in-browser diagnostics.
---

# Verification & Test Runner Runbook (`v0.4.6-arch`)

This skill outlines how to run, interpret, and extend the automated verification pipeline for **Aethelgard: The Starfall Vaults**.

---

## 1. Running the Full Verification Pipeline via CLI

Run the automated build, contract checker, self-test suite, and headless UI smoke runner from PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

### Expected Output Format
```text
Validated 24 ES6 modules (0 circular dependencies) -> dist/bundle.js
Validated HTML DOM contract (141 element IDs verified, 0 missing references)
Validated window.Aethelgard API contract (75 exports) & Golden Rule/ES2017 static gates
=== Aethelgard Automated Verification Suite ===
[PASS] 1. Schema v5 Save Migration (v1-v4 & Multi-Dungeon Compatibility)
...
[PASS] 17. Lossless RLE Compression, Wall LOS & Safe Auto-Walk Interrupt
[PASS] Headless UI, 6-Tab Guild Hub, Atlas Charter & Canvas Render Smoke Suite
--------------------------------------------------
Result: 17/17 Self-Tests + UI Smoke Suite Passed. Build is healthy!
```

---

## 2. What Each Gate Verifies

1. **Module Graph & Top-Level Collision Gate (`scripts/build.ps1`)**:
   - Verifies all ES6 modules in `$moduleOrder`, checks for circular dependencies, detects duplicate top-level `const`/`let`/`var`/`function`/`class` identifiers across modules, and compiles `dist/bundle.js`.
2. **HTML DOM ID Contract Gate (`scripts/test.ps1`)**:
   - Ensures every static `getElementById('...')` call in `src/**/*.js` exists in `index.html`.
3. **`window.Aethelgard` API & Static Golden-Rule Gate (`scripts/test.ps1`)**:
   - Ensures every `Aethelgard.<fn>` referenced in `index.html` or `src/` is exported on `AethelgardAPI` in `src/main.js`.
   - Scans `src/**/*.js` to reject `alert()`, `confirm()`, `prompt()` (Golden Rule #7) and `?.` optional chaining (`ADR-0001` Chakra ES2017 compatibility).
4. **Headless Chakra ES2017 Self-Tests + UI Smoke Suite (`scripts/test.ps1`)**:
   - Executes `evaluateSelfTests()` and `runSelfTests(false)` in isolated sandboxes (`const sandbox = createDefaultGameState()`), then exercises all 6 Guild Hub tabs, Expedition Atlas chartering, dungeon descent, canvas rendering, and modals.

---

## 3. Adding New Unit Tests

1. Open `src/test/selfTest.js`.
2. Append your new test block to `evaluateSelfTests()` using an isolated sandbox state:
   ```javascript
   const s18 = createDefaultGameState();
   // Exercise feature logic strictly against s18
   results.push({
     name: '18. Feature Name & Invariant Check',
     pass: Boolean(condition),
     detail: 'Concise diagnostic summary'
   });
   ```
3. Run `./scripts/test.ps1` to rebuild `dist/bundle.js` and verify `18/18 PASS`.
