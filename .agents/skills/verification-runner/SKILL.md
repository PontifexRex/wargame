---
name: verification-runner
description: >-
  Use this skill when running, diagnosing, or adding automated regression tests and static contract gates for Aethelgard. Covers headless CLI execution (chakra.dll / Node) and in-browser diagnostics.
---

# Verification & Test Runner Runbook (`v0.5.0-inc5`)

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
Validated HTML DOM contract (154 element IDs verified, 0 missing references)
Validated window.Aethelgard API contract (78 exports) & Golden Rule/ES2017 static gates
=== Aethelgard Automated Verification Suite ===
[PASS] 1. Schema v6 Save Migration (v1-v5 & Multi-Dungeon + Codex Compatibility)
...
[PASS] 20. Guild Bestiary Codex, Hall of Records & Hunter Mastery (+8% Damage)
[PASS] Headless UI, 6-Tab Guild Hub, Atlas Charter & Canvas Render Smoke Suite
--------------------------------------------------
Result: 20/20 Self-Tests + UI Smoke Suite Passed. Build is healthy!
```

---

## 2. Git Pre-Commit Hook & Fast Gate (`scripts/pre-commit.ps1`)

To ensure untested or broken code is never committed, Aethelgard includes an automated pre-commit hook:

1. **Installation** (one-time setup per clone/worktree):
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-git-hooks.ps1
   ```
2. **Behavior on `git commit`**:
   - Executes `scripts/pre-commit.ps1`.
   - Runs all static contract gates and the 20/20 self-test suite.
   - Automatically stages freshly compiled `dist/bundle.js` if `src/` or `index.html` was modified.
   - If verification fails, the commit is blocked with a clear failure report.

---

## 3. What Each Gate Verifies

1. **Module Graph & Top-Level Collision Gate (`scripts/build.ps1`)**:
   - Verifies all ES6 modules in `$moduleOrder`, checks for circular dependencies, detects duplicate top-level `const`/`let`/`var`/`function`/`class` identifiers across modules, and compiles `dist/bundle.js`.
2. **HTML DOM ID Contract Gate (`scripts/test.ps1`)**:
   - Ensures every static `getElementById('...')` call in `src/**/*.js` exists in `index.html`.
3. **`window.Aethelgard` API & Static Golden-Rule Gate (`scripts/test.ps1`)**:
   - Ensures every `Aethelgard.<fn>` referenced in `index.html` or `src/` is exported on `AethelgardAPI` in `src/main.js`.
   - Scans `src/**/*.js` to reject `alert()`, `confirm()`, `prompt()` (Golden Rule #7) and `?.` optional chaining (`ADR-0001` Chakra ES2017 compatibility).
4. **Headless Chakra ES2017 Self-Tests + UI Smoke Suite (`scripts/test.ps1`)**:
   - Executes `evaluateSelfTests()` and `runSelfTests(false)` in isolated sandboxes (`const sandbox = createDefaultGameState()`), then exercises all 7 Guild Hub tabs, Expedition Atlas chartering, dungeon descent, canvas rendering, and modals.

---

## 4. Adding New Unit Tests

1. Open `src/test/selfTest.js`.
2. Append your new test block to `evaluateSelfTests()` using an isolated sandbox state:
   ```javascript
   const s21 = createDefaultGameState();
   // Exercise feature logic strictly against s21
   results.push({
     name: '21. Feature Name & Invariant Check',
     pass: Boolean(condition),
     detail: 'Description of verified invariant'
   });
   ```
3. Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test.ps1` to confirm pass status.
     detail: 'Concise diagnostic summary'
   });
   ```
3. Run `./scripts/test.ps1` to rebuild `dist/bundle.js` and verify `18/18 PASS`.
