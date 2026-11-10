# ADR-0007: Inventory Intelligence, Power Score Heuristics & Lock Protocols

- **Status**: Accepted
- **Date**: 2026-11-10
- **Context**: Increment 5 (`v0.5.0-inc5`)
- **Deciders**: AI Pair Programming Team & Human Architect

---

## Context & Problem Statement

As players descend deeper into multi-dungeon vaults and harvest rare/epic loot from bosses and chests, the Vault Armory fills with dozens of equipment pieces across 6 slots. Players need:
1. Fast ways to sort gear by slot, rarity, value, name, or power.
2. Immediate visual clarity on whether an armory piece outperforms their currently equipped item.
3. A single action to equip the highest-performing gear without manually inspecting 6 slots.
4. Protection against accidentally liquidating prized gear during Antiquarian Assay bulk sales.
5. The ability to bulk-sell specific low-tier equipment (e.g. all spare Commons/Uncommons) while keeping higher-tier gear.

---

## Decision Drivers

- **Zero Regressions**: Cannot break existing equipment schemas, save migration, or the 20/20 baseline self-test suite.
- **Save Backward Compatibility**: Saves from `v0.1.0-inc1` through `v0.5.0-inc5` must migrate seamlessly with default `locked = false`.
- **Chakra ES2017 Compatibility**: Pure ES2017 syntax without `?.` or object spread (`{ ...obj }`).
- **Idempotent Sandboxing**: All new engine actions (`autoEquipBestGear`, `toggleItemLock`, `sellAllSpareGear`) must accept `state = gameState` to allow pure unit testing in isolated sandboxes.

---

## Considered Options

1. **Option A (Dynamic Recalculation & Modular Extensions)**: Implement `computeItemPowerScore` and `isItemUpgrade` as pure calculation helpers in `src/data/items.js`. Add `locked` flag to item objects, wire `autoEquipBestGear` in `src/engine/actions.js`, and support sorting & filtering in `src/ui/domSync.js`.
2. **Option B (Separate Inventory Sub-Database)**: Create a secondary inventory index tracking stats in a separate lookup table. *(Rejected: Unnecessarily complex and breaks simple JSON save serialization)*.

---

## Decision Outcome

Chosen: **Option A**.

### 1. Item Power Score Heuristic
```javascript
export function computeItemPowerScore(item) {
  if (!item) return 0;
  var atk = (item.atk || 0) * 2;
  var def = (item.def || 0) * 2;
  var hp = (item.maxHp || 0) * 0.25;
  var mp = (item.maxMp || 0) * 0.25;
  var crit = (item.crit || 0) * 1.5;
  var dodge = (item.dodge || 0) * 1.5;
  var stats = ((item.str || 0) + (item.dex || 0) + (item.int || 0) + (item.vit || 0)) * 1.2;
  var sockets = ((item.maxSockets || 0) * 4) + (Array.isArray(item.sockets) ? item.sockets.length * 4 : 0);
  var dur = (item.maxDur || 0) * 0.5;
  return Math.round(atk + def + hp + mp + crit + dodge + stats + sockets + dur);
}
```

### 2. Upgrade Evaluation
`isItemUpgrade(candidateItem, equipment)` returns `true` if `equipment[candidateItem.slot]` is empty or its power score is strictly less than `candidateItem`'s power score.

### 3. Keep / Lock Contract
`item.locked = Boolean(item.locked)`. Any item with `item.locked === true` is immune to all bulk liquidation routines (`sellAllSpareGear` with or without rarity filters).

### 4. Rarity Bulk Sell
`sellAllSpareGear(rarityFilter = null, state = gameState)` sells only items matching `rarityFilter` (e.g. `'common'`, `'uncommon'`, `'rare'`) if provided, or all spare items if `null`, always preserving locked items and auto-banking socketed gems into `guildVault.gems`.

---

## Consequences

- **Positive**: Massively streamlined inventory UX; players can optimize loadouts in one click and safely liquidate unwanted commons.
- **Negative**: Adds new UI controls to `#guildTab_armory`, requiring DOM ID registration and static contract verification.
