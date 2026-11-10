# Architecture Decision Records (ADRs) — Aethelgard: The Starfall Vaults

This directory records the foundational architectural decisions, runtime constraints, and engineering trade-offs for **Aethelgard: The Starfall Vaults**.

## ADR Index

| ID | Title | Status | Milestone |
| :--- | :--- | :--- | :--- |
| [ADR-0001](./ADR-0001-dual-esm-and-zero-dep-bundle.md) | Dual ES6 Module Architecture & Zero-Dependency `file://` Bundler | **Accepted** | `v0.4.0-inc4` |
| [ADR-0002](./ADR-0002-sandboxed-state-injection-testing.md) | Sandboxed State Injection (`state = gameState`) for Self-Tests | **Accepted** | `v0.1.0` – `v0.4.5` |
| [ADR-0003](./ADR-0003-multi-dungeon-registry-and-rle-persistence.md) | Multi-Dungeon Registry, Live `state.dungeon` Alias & RLE Persistence | **Accepted** | `v0.4.5-atlas` |
| [ADR-0004](./ADR-0004-macro-sector-generation-and-typed-array-bfs.md) | Macro-Sector Procedural Generation, Wall-Only Veins & Typed-Array BFS | **Accepted** | `v0.4.5-atlas` |
| [ADR-0005](./ADR-0005-camera-frustum-wall-los-and-safe-autowalk.md) | Frustum-Culled `21x15` Camera, Bresenham Wall LOS & Safe Auto-Walk | **Accepted** | `v0.4.5-atlas` |
| [ADR-0006](./ADR-0006-domain-event-bus-and-telemetry.md) | Synchronous Domain Event Bus & Gameplay Telemetry Hooks | **Accepted** | `v0.4.6-arch` |
| [ADR-0007](./ADR-0007-inventory-intelligence-and-lock-protocols.md) | Inventory Intelligence, Power Score Heuristics & Lock Protocols | **Accepted** | `v0.5.0-inc5` |
| [ADR-0008](./ADR-0008-abyssal-modifiers-and-endless-delve.md) | Abyssal Elite Affixes, Combat Reactive Modifiers & Endless Strata Delve | **Accepted** | `v0.6.0-inc6` |
| [ADR-0009](./ADR-0009-developer-and-tester-console.md) | Developer & Tester Console Architecture & Isolation Protocols | **Accepted** | `v0.6.5-dev` |

## When to Add or Supersede an ADR

1. **New Subsystem or Persistence Change**: Any change to `gameState` serialization, module boundaries, or rendering pipelines should be recorded as a new `ADR-000X` document.
2. **Immutable History**: If a later milestone replaces an older decision, mark the older ADR's status as `Superseded by ADR-000Y` rather than deleting it.

## Related Workflow & Architecture Documents

- **[Agentic Development Workflow & Diagrams (`docs/agentic_workflow.md`)](../agentic_workflow.md)**: Living diagrams of the end-to-end SDLC loop, automated build/verification pipeline (`scripts/test.ps1`), and module DAG.
- **[Agentic Workflow Roadmap (`docs/agentic_workflow_roadmap.md`)](../agentic_workflow_roadmap.md)**: Staged maturity plan (`W1`–`W4`) for evolving toward high-autonomy development.
