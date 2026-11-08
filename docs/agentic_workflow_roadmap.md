# Agentic Development Workflow Roadmap & Plan

This roadmap defines a pragmatic, incremental path to evolve Aethelgard's AI development workflow from **guided pair-programming** into a **high-autonomy, self-verifying engineering pipeline**—building each layer only when its value outweighs its complexity.

- **Current Workflow Architecture & Diagrams**: See [`docs/agentic_workflow.md`](./agentic_workflow.md) for the detailed diagrams of our active `v0.4.6-arch` workflow.

---

## 1. Current Workflow Audit (`v0.4.6-arch`)

| Capability Layer | Current State (`v0.4.6-arch`) | Gap / Opportunity for Higher Autonomy |
| :--- | :--- | :--- |
| **Rules & Architecture Memory** | `GEMINI.md`, `AGENTS.md`, `.agents/rules/*.md`, `docs/adr/ADR-0001..0006`, and `docs/agentic_workflow.md` are aligned to `v0.4.6-arch`. | `.agents/skills/*` (`increment-delivery`, `verification-runner`, `modular-refactor`) still reference `v0.3.1` (`10/10` tests) and omit ADR/DOM/UI-smoke steps. |
| **Build & Static Analysis Gates** | `scripts/build.ps1` checks circular imports & top-level declaration collisions; `scripts/test.ps1` checks `getElementById` IDs. | No static gate for: (1) `window.Aethelgard` `onclick` contract in `index.html`, (2) banned browser dialogs (`alert`/`confirm`/`prompt`), or (3) explicit ES2017 syntax checks (`?.`, `{...}`). |
| **Automated Runtime Verification** | `17/17` deterministic headless engine self-tests via `chakra.dll` (`~1.2s`). | Engine tests don't automatically exercise DOM rendering (`updateAllUI`, all 6 Guild tabs) or randomized multi-turn gameplay fuzzing unless we run a scratch script. |
| **Closed-Loop Enforcement (Hooks)** | Agent runs `./scripts/test.ps1` by instruction. | No automated lifecycle hook (`.agents/hooks.json` `Stop` hook) or Git `pre-commit` hook to guarantee `dist/bundle.js` is never stale and tests are never skipped. |
| **Autonomous Multi-Step Delivery** | Single agent plans, implements, and tests in one context. | For larger milestones, having a dedicated **QA & Invariant Auditor subagent** review diffs and try to break new features catches subtle balance/UI edge cases before human review. |

---

## 2. Staged Maturity Model (Develop as It Makes Sense)

```mermaid
flowchart LR
  W0["Current Baseline (v0.4.6-arch)\n24 Modules + ADRs + DOM ID Gate + 17/17 Self-Tests"] --> W1["Stage W1: Immediate Foundation\n(Static Contracts + Headless UI Smoke + Modernized Skills)"]
  W1 --> W2["Stage W2: Closed-Loop Guardrails\n(Stop Hook + Git Pre-Commit + Deterministic Seed Fuzzer)"]
  W2 --> W3["Stage W3: Autonomous Increment Pipeline\n(Spec-First TDD + Implementer/Auditor Subagent Loop)"]
  W3 --> W4["Stage W4: Telemetry & Balance Simulation\n(1,000-Turn Headless Combat/Economy Monte Carlo)"]
```

---

## 3. Detailed Stage Breakdown & Priority Backlog

### Stage W1 — Immediate Foundation: Static Contracts, Headless UI Smoke & Skill Sync *(Completed)*
**Status**: **Implemented & Active in `scripts/test.ps1` and `.agents/skills/`**
**Goal**: Eliminate every class of error we previously had to catch manually or with one-off scratch scripts, and bring `.agents/skills/` up to `v0.4.6-arch`.

1. **Expand `scripts/test.ps1` Static Contract Gates**:
   - **`window.Aethelgard` HTML Handler Contract**: Parse every `window.Aethelgard.<fnName>(` in `index.html` and `src/ui/` and verify `<fnName>` is exported on `AethelgardAPI` in `src/main.js`.
   - **Golden Rule Static Assertions**: Scan `src/` to block `window.alert(`, `window.confirm(`, `window.prompt(`, and flag ES2020+ tokens (`?.` optional chaining, `{ ...` object spread) with exact file and line numbers before `chakra.dll` even runs.
2. **Built-in Headless UI & Guild Tab Smoke Runner (`src/test/cliRunner.js`)**:
   - Promote our scratch DOM smoke check into `src/test/cliRunner.js` as a standard verification phase after `runSelfTests()`:
     - Bootstraps `updateAllUI()`, iterates through all 6 Guild tabs (`shop`, `assay`, `lapidary`, `research`, `bounties`, `atlas`), enters a dungeon (`descendIntoDungeon()`), executes a turn (`handlePlayerAction(1, 0)`), toggles Map Overview (`toggleMapOverview()`), and opens/closes modals—asserting zero uncaught exceptions.
3. **Modernize `.agents/skills/`**:
   - Update `.agents/skills/increment-delivery/SKILL.md`, `verification-runner/SKILL.md`, and `modular-refactor/SKILL.md` to match `v0.4.6-arch` (`17/17` tests, ADR updates, DOM contracts, and `docs/agentic_workflow.md` maintenance).

---

### Stage W2 — Closed-Loop Guardrails: Lifecycle Hooks & Chaos Seed Fuzzer
**When to Execute**: When transitioning to longer, more autonomous sessions.
**Goal**: Make quality self-enforcing so an agent *cannot* stop on a broken build or commit untested code.

1. **Antigravity `Stop` Hook (`.agents/hooks.json` + `scripts/hook-verify-on-stop.ps1`)**:
   - Configures a lightweight `Stop` hook in `.agents/hooks.json`:
     - When the agent finishes a turn (`terminationReason == "NO_TOOL_CALL"`), the script checks if any file in `src/` or `index.html` is newer than `dist/bundle.js` or if `scripts/test.ps1` fails.
     - If out-of-sync or failing, it returns `{"decision": "continue", "reason": "src/ was modified without passing ./scripts/test.ps1. Run verification and fix any failures before finishing."}`.
     - If clean (or no code changed), it returns `{"decision": "allow"}` in `<100ms`.
2. **Git Pre-Commit Hook (`scripts/install-git-hooks.ps1`)**:
   - Installs `.git/hooks/pre-commit` that runs `./scripts/test.ps1` automatically before any commit is recorded.
3. **Deterministic Chaos / Seed Fuzzer (`scripts/fuzz.ps1`)**:
   - Generates 25 random dungeon configurations across all 4 size tiers (`small` through `colossal`) and all 4 layout styles, simulating 100 random valid player actions (move, mine, attack, skill, shrine, trap, recall, RLE pack/unpack) per seed to guarantee zero runtime crashes across thousands of edge cases.

---

### Stage W3 — High-Autonomy Subagent Delivery Loop
**When to Execute**: For large, multi-system milestones or `/goal` autonomous runs.
**Goal**: Enable "hands-off" delivery of entire feature increments using structured multi-agent verification.

1. **Spec-First Test Skeleton Pattern**:
   - Before writing feature code in `src/engine/` or `src/ui/`, the agent first writes the new sandboxed tests (`Test N+1..N+k`) and contract assertions, confirming they fail for the expected reason, then implements until green.
2. **Dual-Agent Implementer + QA Auditor Protocol (`.agents/skills/autonomous-increment/SKILL.md`)**:
   - **Primary Agent (Architect/Implementer)**: Designs the plan, implements `src/data/`, `src/engine/`, `src/ui/`, and unit tests.
   - **Subagent (Independent QA & Golden-Rule Auditor via `invoke_subagent`)**: Given only the spec, `AGENTS.md`, and the `git diff`, audits the implementation for Golden Rule violations, save-migration edge cases, Chakra compatibility, and missing tests, reporting findings back to the primary agent before the user reviews.

---

### Stage W4 — Automated Balance & Telemetry Monte Carlo
**When to Execute**: Post-Increment 5 endgame tuning & polish.
**Goal**: Use the Domain Event Bus (`src/engine/events.js`) to validate game balance autonomously.

1. **Headless Combat & Economy Simulator (`scripts/sim-balance.ps1`)**:
   - Subscribes to `ENGINE_EVENTS` (`MONSTER_SLAIN`, `ORE_MINED`, `HERO_DEFEATED`, `EXTRACTED`) over 500 simulated descents across all 5 classes (`fighter`, `thief`, `mage`, `ranger`, `paladin`).
   - Outputs survival rates per floor, average Gold/Minerals per run, and TTK (Time-To-Kill) ratios so new monsters, bosses, or items never accidentally break progression curves.
