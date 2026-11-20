# ADR-0015: Unified Progression Core — Fixed-Precision Currency Ledger, Nested Prerequisites & Versioned Research/Training Engine

- **Status**: Accepted
- **Date**: 2026-11-20
- **Milestone**: Track F — Increment 10.1 (`v0.10.1-prog-foundation`)
- **Related**: [`docs/specs/research_and_training_spec.md`](../specs/research_and_training_spec.md), [ADR-0001](./ADR-0001-dual-esm-and-zero-dep-bundle.md), [ADR-0011](./ADR-0011-macro-world-city-party-hierarchy.md), [ADR-0012](./ADR-0012-modular-guilds-garrison-containers-and-loot-tables.md)

---

## 1. Context

Aethelgard's long-term progression spans **12–18 month multiplayer worlds** across four distinct ownership models (**Personal**, **Player Guild**, **Alliance**, and **Subject-Specific Hero/Entity Training**), fractional research point accrual (`0.00001/sec` passive and `0.001` per action), nested eligibility rules, and a multi-tag Pantheon of Gods. Building bespoke hardcoded trees per building or feature would quickly fragment and break save compatibility.

---

## 2. Decision

We establish a shared, pure-JS, zero-DOM **`src/progression/`** core consumed by both the Wargame (`src/wargame/`) and Dungeon (`src/`) engines:

1. **Scaled-Integer Fixed-Precision Currency & Auditable Transaction Ledger (`currencyService.js`)**:
   - Every fungible currency (`rp_general`, `rp_adventurer`, `rp_guild_*`, `rp_alliance`, `gold`, `divine_favor`) is defined declaratively with `decimalPrecision` (`0..5`).
   - All balances and ledger transactions are stored as **scaled integers** (`Math.round(amount * 10^decimalPrecision)`) to guarantee zero floating-point drift.
   - Every mutation records an auditable `CurrencyTransaction` with an `idempotencyKey` preventing duplicate awards/debits, and supports full balance reconstruction from the ledger.
   - **Unified Atomic Payment Interface (`executeAtomicPayment`)** validates and deducts both fungible currencies and physical stockpiles (`city.stockpile.*`) in an all-or-nothing transaction.
2. **Generic Nested Prerequisite & Eligibility Engine (`eligibilityService.js`)**:
   - Evaluates arbitrary recursive `AND` / `OR` / `NOT` condition trees across `Visibility`, `Eligibility`, `Start`, `Completion`, and `Bonus` categories.
   - Always returns rich diagnostic status codes (`AVAILABLE`, `LOCKED`, `HIDDEN`, `UNAFFORDABLE`, `RESTRICTED_GUILD`, `RESTRICTED_ALLIANCE`, `RESTRICTED_ALIGNMENT`, `SUBJECT_UNAVAILABLE`) plus exact unmet conditions.
3. **Versioned Definitions vs. Runtime Instances (`researchCatalog.js`)**:
   - Strictly separates immutable content definitions (`Domain -> Tree -> Branch -> Item -> Level -> Milestone` and `TrainingDefinition`) from mutable runtime instances (`ResearchProgressInstance`, `TrainingInstance`, `ResearchContributionInstance`).
   - Active queue items snapshot their definition version, costs, duration, and benefits on start so content updates never corrupt in-flight progression.
4. **Separate Research & Hero Training Queues**:
   - Personal Research uses a configurable queue (1 free / 2 subscriber baseline), while Hero Training uses a separate Training Queue scoped per Hero instance (`SubjectID`).
   - Alliance progression supports shared research pools and attributed member contributions (no training at the alliance level).
5. **Local Simulation-First with Server-Ready Contracts**:
   - All logical services accept explicit `nowMs` timestamps and `idempotencyKey` parameters so the exact same pure-JS core can execute locally in-browser today and migrate cleanly to an authoritative multiplayer server in Track C.
