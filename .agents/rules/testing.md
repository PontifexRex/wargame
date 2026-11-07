# Testing & Quality Verification Rules

## 1. Sandboxed Test Isolation Pattern

> [!CRITICAL]
> Automated tests must **NEVER** mutate the active `gameState` singleton.

Every unit test must create its own isolated sandbox state:
```javascript
const sandbox = createDefaultGameState();
// Pass sandbox explicitly into engine functions
const outcome = handleHeroDefeat(sandbox);
```
Mutating global state inside a test corrupts player sessions, breaks save persistence, and leads to transient test order dependencies.

---

## 2. The 10 Baseline Self-Tests (v0.3.1-inc3)

All 10 tests must pass 100% of the time:

1. **Schema v3 Save Migration**: Migrates legacy `v0.1.0-inc1` save data into modern schema format preserving player level, gold, ores, and research ranks.
2. **Complete 5-Class Registry**: Verifies that Fighter, Thief, Mage, Ranger, and Paladin are present with skill names, passives, and starter pickaxes.
3. **Pure-Floor BFS Reachability**: Generates 5 consecutive procedural floors and tests every one with `verifyPureFloorBFS()` to guarantee path connectivity.
4. **Procedural 6-Slot Equipment & Affixes**: Tests item generation across slots (`weapon`, `offhand`, `armor`, `helm`, `boots`, `amulet`) with valid prefix/suffix affixes.
5. **Interactive Mining & Durability**: Verifies pickaxe durability deduction, mineral deposit extraction, and geology rank gating.
6. **Dual-Cost Guild Research Lab**: Verifies rank purchases require both Gold and specific mined minerals from the Vault.
7. **Consumables & Antiquarian Multiplier**: Verifies tonic healing, recall scrolls, and gold multipliers on ore sales.
8. **Active Skill Validation (Zero Wasted MP)**: Verifies that skills fail safely without consuming MP or turns when no valid targets exist.
9. **Milestone Boss Spawns**: Confirms Floor 5 (Colossus) and Floor 10 (Weaver) spawn with correct boss stats and phases.
10. **Non-Permanent Defeat & Vanguard Salvage**: Verifies that player defeat retains level, equipped gear, and banked vault while clearing expedition pack.

---

## 3. Cumulative Verification Rule

- **No Test Deletion**: Under no circumstances should existing tests be removed or commented out.
- **Milestone Expansion**: When implementing Increment 4, append tests 11, 12, etc. (target: 13/13 PASS).

---

## 4. Test Execution Methods

- **CLI Runner**: Execute `npm test` or `./scripts/test.ps1` in PowerShell to run all self-tests headlessly.
- **In-Browser Diagnostics**: Click **Verify Inc-X** in the UI header to run `runSelfTests(true)` and display the pass/fail report in the diagnostics modal.
