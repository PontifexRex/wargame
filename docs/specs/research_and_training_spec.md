# Research and Training System — Functional Specification

- **Document Status**: Approved Functional Baseline (with Clarified Implementation Decisions §27)
- **Version**: 1.0
- **Date Archived**: 2026-11-20
- **Scope**: Shared research, training, progression, currency ledger, prerequisite, effects, and contribution systems
- **Game Context**: *Aethelgard: The Starfall Vaults* — Multiplayer strategy and war game with city development, guilds, alliances, heroes, dungeons, exploration, and a pantheon of gods.

---

## 1. Purpose and Overview

The Research and Training System provides a unified, data-driven framework for player progression, specialization, capability unlocks, and long-term investment across the game.

The system supports multiple forms of progression:
- **Personal research**: Knowledge and capabilities developed by an individual player.
- **Guild research**: Knowledge and capabilities associated with a player's guild and its specialization.
- **Alliance research**: Shared research funded by contributions from alliance members.
- **Hero training**: Development of skills, abilities, and mastery for individual heroes.
- **Other subject-specific training**: A framework that can eventually support development of cities, units, constructs, and other game entities.

The system must support a large number of research paths and progression opportunities without allowing a player to complete everything during a typical world lifecycle of approximately **12–18 months**. Research and training must create meaningful choices, specialization, cooperation, and opportunity costs across warfare, adventuring, city development, crafting, exploration, religion, and other play styles.

---

## 2. Design Principles

1. **Shared, Data-Driven Engine (§2.1)**: Research and training share a common underlying engine. Trees, items, levels, costs, prerequisites, durations, rewards, and benefits are defined through data wherever practical; adding a new tree or training path requires zero core engine changes.
2. **Distinct Progression Ownership (§2.2)**: Strictly distinguish Player-owned, Guild-owned, Alliance-owned, and Subject-specific (e.g. Hero instance) progression—governing who benefits, who contributes, and persistence across membership/alignment changes.
3. **Specialization & Opportunity Cost (§2.3)**: Total research depth must exceed what any single player can complete in a 12–18 month world, driving specialization and cooperation.
4. **Multiple Sources of Progression (§2.4)**: Earn points via passive time-based generation, gameplay activities, quests/objectives, events/discoveries, buildings/modifiers, guild/alliance activities, and special rewards—supporting both active and casual players without making inactivity optimal.
5. **Configurable Progression (§2.5)**: All costs, durations, accrual rates, queues, prerequisites, and modifiers are configurable for playtesting and ChronoSim balancing.
6. **Persistent Progress & History (§2.6)**: Durable progression, contribution, and achievement history immune to content/balance updates.
7. **Extensibility (§2.7)**: Accommodates shared projects, hidden discovery, advanced automation, cross-player cooperation, world events, expanded training subjects, and crafting/construction links.

---

## 3. Progression Categories and Ownership

### 3.1 Personal Research
Player-owned knowledge (adventuring, personal combat, exploration, general knowledge, religion, leadership, hero training unlocks, buildings/recipes). Persists for the remainder of the world regardless of guild, alliance, or divine alignment changes.

### 3.2 Guild Research
Guild-owned progression tied to a guild's specialization (e.g., *Adventurers Guild*, *War Guild*, *Artisan Guild*), funded by guild-type activities. Supports guild-specific RP currencies, multiple trees, prerequisites, levels, guild-wide benefits, progression history, and milestones. Distinct from personal research spent with guild-specific currencies.

### 3.3 Alliance Research
Alliance-owned progression funded by member contributions into a shared alliance pool (paid from the alliance account, not independently charged per member). Supports alliance-specific currencies, direct + activity-based member contributions with member attribution, alliance-wide benefits while a member, milestones, and explicit leave/dissolve lifecycle rules. *(No training at the alliance level.)*

### 3.4 Hero Training
Subject-specific progression developing an individual hero instance's skills, active/passive abilities, combat techniques, weapon/armor proficiency, roles, and mastery. Personal research *unlocks* the training option; each hero trains independently (training Hero A does not affect Hero B). Extensible to future subjects (cities, units, constructs).

---

## 4. Currency and Resource Framework

- **Generic Currency Engine (§4.1)**: Research points, gold, and other fungible currencies are defined as data-driven currencies (physical goods/equipment remain in inventory/stockpile systems). Both currencies and inventory resources share a **common atomic payment interface**.
- **Currency Definition (§4.2)**: `CurrencyID`, `Name`, `Description`, `Icon`, `Category`, `DecimalPrecision`, `Tradable`, `Transferable`, `MaximumBalance`, `ExpirationPolicy`, `Enabled`, `Version`. Must use **fixed decimal precision / scaled integers** (never raw floating-point math for balances/transactions).
- **Currency Accounts (§4.3)**: `AccountID`, `OwnerID`, `OwnerType` (`Player`, `Guild`, `Alliance`, future entities), `CurrencyID`, `AvailableBalance`, `ReservedBalance`, `LastUpdated`, `Status`.
- **Currency Transaction Ledger (§4.4)**: Auditable ledger recording `TransactionID`, `OwnerID`, `OwnerType`, `CurrencyID`, `Amount`, `TransactionType`, `Source`, `ReferenceID`, `Timestamp`, `IdempotencyKey`, and related transactions. Supports awards, spending, transfers, refunds, adjustments, and full balance reconstruction.
- **Data-Driven Award Rules (§4.5)**: Source activity/event, currency, base amount, eligibility, multipliers, caps, frequency limits, cooldowns, diminishing returns, and rule version.

---

## 5. Research Point Accrual

- **Passive Accrual (§5.1)**: General RP accrues continuously (including offline) using authoritative time (illustrative base: `0.00001/sec`), boosted by buildings/techs/modifiers.
- **Activity-Based Accrual (§5.2)**: Fractional awards for frequent qualifying actions and larger awards for milestones (illustrative Adventurer RP: `0.001` meaningful dungeon movement, `0.005` monster defeated, `0.002` chest opened, `0.010` location discovered, `0.050` dungeon completed, `0.100` major expedition, `5.000` research quest).
- **Guild & Alliance Accrual (§5.3–5.4)**: Guild activities generate guild RP by guild type (an activity may award multiple categories if configured); Alliance RP via direct member contributions, objectives, events, warfare, and shared projects—every contribution records contributor + source.
- **Anti-Abuse Controls (§5.5)**: Duplicate event detection, idempotency, minimum qualifying activity, per-target limits, frequency limits, cooldowns, diminishing returns, daily/time caps, and eligibility validation (configurable per source).
- **Accrual Modifiers (§5.6)**: Strictly separates **RP generation modifiers** from **research/training speed modifiers**, with explicit additive and multiplicative stacking rules.

---

## 6. Research Hierarchy & Organization

- **6-Level Hierarchy (§6.1)**: `Domain` → `Research Tree` → `Branch` → `Research Item` → `Research Level` → `Milestone`.
- **15 Initial Domains (§6.2)**: `Adventuring`, `Dungeon`, `Warrior`, `Military`, `City`, `Economy`, `Influence`, `Constructs`, `Religion`, `Priesthood`, `Exploration`, `Magic`, `Crafting`, `Logistics`, `General Knowledge`.
- **Tree Guidelines (§6.3–6.4)**: ~8–20 items/tree, 2–5 branches/tree, 1–5 levels/item, milestones every 3–6 completions; completed trees archive cleanly without deleting history.
- **Tree Lifecycle & Visibility (§6.5)**: `Unavailable`, `Hidden`, `Discovered`, `Available`, `In Progress`, `Completed`, `Archived` — cleanly separating *discovery* from *eligibility*.

---

## 7. Core Data Objects (Definitions vs. Instances)

- **Definitions**: `ResearchDomainDefinition`, `ResearchTreeDefinition` (with `OwnershipType`), `ResearchItemDefinition` (with `SubjectType`, `LevelDefinitions`, `VisibilityRules`, `Repeatability`, `QueueType`, `Version`), `ResearchLevelDefinition` (`Duration`, `Costs`, `Prerequisites`, `Benefits`, `CompletionRewards`).
- **Runtime Instances**: `ResearchProgressInstance` (tracks `OwnerID`, `OwnerType`, `CurrentLevel`, `TargetLevel`, `Status`, `StartedAt`, `CompletedAt`, `TotalTimeSpent`, `TotalCost`, `CompletionCount`, `DefinitionVersion`), `ResearchContributionInstance` (tracks `ContributorPlayerID`, `TargetOwnerID`, `TargetOwnerType`, `CurrencyID`, `Amount`, `Source`, `ReferenceID`, `Timestamp`, `TransactionID`), `TrainingDefinition`, and `TrainingInstance` (scoped to `SubjectID` + `SubjectType`).

---

## 8. Prerequisite & Eligibility Engine

- **Generic Nested Condition Engine (§8.1–8.5)**: Supports `AND`, `OR`, `NOT`, nested groups, comparison operators, numeric thresholds, existence/membership/ownership/time/event checks.
- **20+ Condition Types**: Research item/level, tree/branch completion, player/hero/skill/city level, building ownership, item/resource possession, currency balance, quest/achievement completion, activity history, discovery status, guild membership/reputation, alliance membership/type/progression, divine alignment/favor, world events/milestones.
- **5 Prerequisite Categories**: `Visibility`, `Eligibility`, `Start`, `Completion`, `Bonus`.
- **Rich Evaluation Results**: `Available`, `Locked`, `Hidden`, `Unaffordable`, `Queue full`, `In progress`, `Completed`, `Maximum level reached`, `Temporarily unavailable`, `Restricted by guild`, `Restricted by alliance`, `Restricted by alignment`, `Subject unavailable` — always returning exact unmet conditions for UI & admin tools.

---

## 9. Guild, Alliance & Divine Alignment Rules

- **Guild & Alliance Restrictions (§9.1–9.2)**: Membership, type, rank, guild/alliance progression, reputation, objectives.
- **Pantheon & Divine Alignment (§9.3)**: Gods support **multiple tags/categories** (no single hardcoded category). Alignment can gate exclusivity or modify RP generation, speed, costs, paths, and unique rewards via the generic eligibility & modifier frameworks.
- **Membership/Alignment Changes (§9.4)**: Completed personal research persists; in-progress behavior is configurable (`Continue`, `Pause`, `Cancel`). Guild & alliance research remains owned by the organization.

---

## 10. Queues, Costs, Payments & Effects (§10–14)

- **Configurable Queues (§10)**: Initial baseline: 1 free queue + 1 subscriber queue (configurable); supports add, remove pending, pause, resume, cancel (configurable refund policies), reorder, auto-start next, ETA, and atomic start with **definition version snapshots** so updates never corrupt active projects. Authoritative offline progress.
- **Unified Atomic Payments (§11)**: Supports currencies (general/specialized/guild/alliance RP, gold) + physical inventory resources/goods/artifacts + non-currency conditions, consumed or possession-only, all-or-nothing validation.
- **Generic Benefits & Effects Engine (§12)**: `Capability unlock`, `Attribute/Skill/Production/Capacity/Probability/Limit modifier`, `Ability/Access/Content/Recipe unlock`, `Behavior modification`, `Special effect`. Operations: `Additive`, `Multiplicative`, `Set`, `Minimum`, `Maximum`, `Unlock/Enable`, `Disable`, `Replace`, `Controlled custom handler`. Explicitly distinguishes **Unlocks** from **Modifiers**.
- **Reference Item (§14)**: `WAR_WEAPON_HEAVY_001` (*Wield Heavier Weapons*, 3 levels: `60s / 5 Adv RP / 50g` → `600s / 10 Adv RP / 250g` → `6000s / 25 Adv RP / 2000g`) unlocking heavy weapon training for individual heroes.

---

## 11. Milestones, Achievements, Provenance Titles, Quests & Analytics (§15–21)

- **Milestones, Achievements & Titles (§16)**: Tree/branch/world-first/contribution milestones; Common, Rare, Unique, World-First, Guild/Alliance, and Humorous/Unusual titles with provenance, world association, and player display selection; completed tree archiving.
- **Tutorial & Quest Integration (§17)**: 12-step incremental onboarding and recurring quest hooks.
- **Required Prototype UI Views (§18)**: Research Overview, Visual Research Tree, Research Detail, Research Queue, Hero Training, and Research History & Analytics.
- **Analytics & Domain Events (§19–20)**: 12 logical services (`ResearchCatalogService`, `TrainingCatalogService`, `ResearchEligibilityService`, `CurrencyService`, `ResearchAccrualService`, `ResearchContributionService`, `ResearchQueueService`, `ResearchProgressService`, `ResearchCompletionService`, `BenefitService`, `ResearchDiscoveryService`, `ResearchAnalyticsService`), 17+ idempotent domain events, and 12–18 month world balance simulation.

---

## 12. Initial Prototype Scope, Acceptance Criteria & Longer-Term Backlog (§22–26)

- **5 Representative Prototype Trees (§22.1)**:
  1. **General Knowledge** (passive accrual & general research)
  2. **Adventurer Basics** (activity-based fractional accrual)
  3. **Weapon Proficiency** (multilevel research & hero-specific training unlocks)
  4. **City Development** (building unlocks & production modifiers)
  5. **Divine Knowledge** (multi-tag alignment eligibility & benefits)
- **5 Implementation Phases (§22.3)**: Phase 1 Foundation → Phase 2 Progression → Phase 3 Ownership & Contributions → Phase 4 Benefits & Training → Phase 5 UI, Milestones, Analytics & Simulation.
- **Longer-Term Backlog (§23)**: Clue-based/hidden Research Discovery, Multi-Stage Cooperative Alliance/World-Wonder Projects, Conditional/Template Queue Automation, Expanded Training Subjects (Cities, Units, Constructs), Repeatable Mastery/Prestige, Full-World Archetype Forecasting, and Visual Research Tree Admin Editor.

---

## 27. Clarified Implementation Decisions (Approved 2026-11-20)

The following five architectural decisions were explicitly confirmed to govern roadmap integration and prototype implementation:

1. **Organization vs. City Building Distinction & Naming Clarity**:
   - **Player Guilds** (multiplayer specialized organizations: Adventurers, War, Artisan) own **Guild Research**, and **Alliances** own **Alliance Research** *(Alliance level has research only—no Alliance training)*.
   - **City Structures** recruit Heroes and host local training/services. We will establish clear, non-overlapping naming between local City Class Halls/Chapters and multiplayer Player Guilds/Alliances so players never confuse the two.
2. **Separate Research & Hero Training Queues**:
   - **Personal Research** uses the configurable 1-free / 2-subscriber Research Queue.
   - **Hero Training** uses a separate, independent Training Queue so hero skill training does not block player research.
3. **Local Simulation-First Prototype with Server-Ready Interfaces**:
   - Build all 12 logical services, scaled-integer currency ledger, idempotency keys, offline elapsed-time catch-up, and simulated multi-member Alliance contributions inside our decoupled pure-JS engine first; migrate to an authoritative live multiplayer backend server in a dedicated multiplayer track.
4. **Dual UI Entry Points (Global Hub + Contextual Building Deep Links)**:
   - Provide top-level **Research & Training Hub** screens (Overview, Visual Trees, Detail, Queue, Hero Training, History/Analytics) accessible from primary navigation, PLUS direct contextual shortcuts from inside relevant town buildings (Guilds/Halls, Academy, Temple).
5. **Immediate Priority Promotion**:
   - Promote **Track F (Phases 1–5 of the Unified Currency, Prerequisite, Effects, Research & Training Engine)** ahead of Increment 9.8+ so Market, Pantheon/Divine Alignment, Quests, Achievements/Titles, and Multi-City build cleanly on top of these shared foundational services.
