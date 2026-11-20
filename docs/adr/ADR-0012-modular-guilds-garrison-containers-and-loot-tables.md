# ADR-0012: Modular Guild Facilities, Garrison Parties, Unified Inventory Containers & Declarative Loot Tables

- **Status**: Accepted
- **Milestone**: `v0.8.3.1` & `v0.9.5+`
- **Related**: [ADR-0010](./ADR-0010-foundational-game-object-and-traversal-model.md), [ADR-0011](./ADR-0011-macro-world-city-party-hierarchy.md)

---

## 1. Context

As Aethelgard expands from a single Adventurers Guild and single Hero into a full multi-guild city builder and tactical dungeon RPG, four architectural abstractions are needed so future content (new guilds, religious classes, multi-hero parties, city storage, breakable props, and spawnable chests) is purely declarative data rather than hardcoded conditionals:

1. **Modular Building `facilities`**: Every enterable City Construct declares composable capabilities (`recruitment`, `questBoard`, `training`, `research`, `shop`, `partyManagement`, `storage`, `crafting`).
2. **Hero Roster Cap, Dismissal & Overall Leader**: Global hero cap starting at `3` (`world.roster.maxHeroes`), safe dismissal (`CMD_DISMISS_HERO`), and a player-designated **Overall Leader** (`world.roster.overallLeaderHeroId`) changeable at any time.
3. **Garrison & Party Formation**: Decoupled `world.parties[]` where solo 1-hero parties work pre-Garrison, and building/upgrading the **Garrison** scales `maxPartySize = 1 + garrisonLevel` and unlocks multi-hero party management.
4. **Unified `InventoryContainer` & Declarative `LOOT_TABLES`**:
   - Standardized container model (`{ id, name, capacity, items[] }`) powering Hero Personal Packs (compact, portable) and the **City Storage Vault** (200+ slots available while in a City, supporting one-click bag dumping and cross-hero gear sharing).
   - Weighted `LOOT_TABLES` + `components.lootable` (`{ dropChance, lootTableId, rolls }`) on any dungeon `ObjectDefinition` so wooden barrels can roll low-value/trash loot at a percentage chance, oil barrels have `lootable: null` (0% treasure), and spawnable dungeon chests roll real treasure cleanly.

---

## 2. City Guild & Construct Ownership Matrix

| City Construct | Role & Facilities |
| :--- | :--- |
| **Adventurers Guild** | Dedicated to Adventurer/Delver class & dungeon exploration quests, training, research, and delve-gear shop. |
| **Fighters Guild** | Recruits **Fighter**; martial quests, training, research, and class-exclusive arms shop. |
| **Thieves Guild** | Recruits **Thief**; stealth quests, training, research, and rogue gear shop. |
| **Mages Guild** | Recruits **Mage**; arcane quests, training, research, and spellcraft shop. |
| **Rangers Lodge** | Recruits **Ranger**; scouting quests, training, research, and pathfinder shop. |
| **Temple Chapterhouse** | Recruits **Cleric** (Lv 1) → **Paladin** (Lv 2+) and future religious classes; sacred quests, training, research, and holy relics shop. |
| **Garrison** | Party Formation & multi-hero party size scaling (`1 + garrisonLevel`). |
| **City Vault / Warehouse** | Large City Inventory Container (200+ slots) accessible whenever a hero is in the City. |
| **Smeltery / Blacksmith / Lapidary / Apothecary / Market** | Dedicated ore smelting, weapon/armor forging, gem socketing, potion/scroll brewing, and general trade. |
