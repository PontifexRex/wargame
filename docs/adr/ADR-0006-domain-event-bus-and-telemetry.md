# ADR-0006: Synchronous Domain Event Bus & Gameplay Telemetry Hooks

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.4.6-arch` (Pre-Increment 5 Architecture Pass)

## Context & Problem Statement

In `v0.4.0` – `v0.4.5`, `src/engine/actions.js` and `src/engine/combat.js` communicated with `src/ui/` via a fixed `actionCallbacks` object (`log`, `updateUI`, `floatingText`, `outcomeModal`, `updateFOV`, `onTurnEnd`). As we prepare for **Increment 5** (which introduces the **Guild Bestiary & Hall of Records** tracking lifetime monsters slain, bosses vanquished, ores mined, chests opened, and deepest floors reached), adding more ad-hoc callbacks or hardcoding statistics mutations inside combat/mining functions would increase coupling between core mechanics and peripheral trackers.

## Decision

We introduce `src/engine/events.js` providing a synchronous, zero-dependency **Domain Event Bus**:
- `ENGINE_EVENTS`: Canonical dictionary of UI presentation events (`LOG`, `FLOATING_TEXT`, `OUTCOME_MODAL`, `UI_SYNC`, `FOV_SYNC`, `TURN_END`) and structured gameplay telemetry events (`MONSTER_SLAIN`, `ORE_MINED`, `CHEST_OPENED`, `SHRINE_ACTIVATED`, `TRAP_RESOLVED`, `EXTRACTED`, `HERO_DEFEATED`).
- `onEngineEvent(eventName, handler)` / `offEngineEvent(eventName, handler)` / `emitEngineEvent(eventName, payload, state)`:
  - `registerActionCallbacks` bridges existing UI/FOV callbacks onto the event bus for 100% backward compatibility.
  - Gameplay actions (`mineTile`, `killMonster`, chest opening, `activateAstralShrine`, `extractToGuild`, `handleHeroDefeat`) emit structured telemetry payloads alongside `(payload, state)` so Bestiary/Codex listeners, achievement trackers, or test assertions can subscribe cleanly without modifying `combat.js` or `actions.js`.

## Consequences

- **Positive**: Complete decoupling between `src/engine/` and `src/ui/`; plug-and-play telemetry for Increment 5's Bestiary & Hall of Records; directly testable event emissions in `src/test/selfTest.js`.
- **Negative / Guardrails**: Listeners receiving `(payload, state)` must check `state === gameState` if they perform global DOM/audio side effects, or mutate `state` directly if updating per-save codex counters.
