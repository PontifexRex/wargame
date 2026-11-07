# ADR-0002: Sandboxed State Injection (`state = gameState`) for Self-Tests

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.1.0-inc1` – `v0.4.5-atlas`

## Context & Problem Statement

Aethelgard runs its automated self-test suite (`runSelfTests()`) both headlessly in the CLI (`./scripts/test.ps1`) and live inside the browser on startup and via the **Verify Atlas** diagnostics modal. If self-tests mutated the global `gameState` singleton, running diagnostics in the browser would overwrite the player's active hero, inventory, or dungeon progress.

## Decision

All state-mutating engine functions in `src/engine/actions.js`, `src/engine/combat.js`, `src/engine/state.js`, and `src/ui/modals.js` accept `state = gameState` as their final parameter:

```javascript
export function mineTile(x, y, state = gameState) { ... }
export function executeClassSkill(state = gameState) { ... }
export function selectActiveDungeon(dungeonId, state = gameState) { ... }
export function handleHeroDefeat(killerName = 'Abyssal Guardian', state = gameState) { ... }
```

1. **Side-Effect Suppression**: Inside engine functions, DOM updates, floating text, Web Audio sound effects, and `saveGame()` are only triggered when `state === gameState`.
2. **Test Sandbox Rule**: Every test in `src/test/selfTest.js` must instantiate a fresh isolated state via `const sandbox = createDefaultGameState()` and pass `sandbox` explicitly into all tested functions.

## Consequences

- **Positive**: In-browser and CLI self-tests exercise the exact same production functions with zero risk of corrupting the player's live session or `localStorage` save.
- **Negative / Guardrails**: Any new gameplay action added in future increments must thread `state = gameState` through its signature and internal calls.
