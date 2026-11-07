# UI, Canvas & Presentation Rules

## 1. Canvas 2D Rendering Pipeline

- **Viewport Size**: Exactly 21 columns by 15 rows of tiles.
- **Centering & Camera**: The camera centers on the player coordinates, clamping smoothly at dungeon boundaries.
- **Shadowcasting Field-of-View (FOV)**:
  - Radius: 6 tiles.
  - Unexplored tiles: Hidden in deep fog (`#0a0a0f`).
  - Previously explored but out-of-sight tiles: Rendered with a desaturated memory tint (`rgba(20, 25, 35, 0.65)`).
  - Visible tiles: Rendered in full color with dynamic entity highlights.
- **Floating Combat Text**:
  - Damage numbers, critical hits, heal numbers, and mineral pickups float upward for 800ms before fading.

---

## 2. In-Game Modals (No Native Dialogs)

> [!WARNING]
> Never call `window.alert()`, `window.confirm()`, or `window.prompt()`.

All dialogs and user confirmations must use in-game modal components:
- **`#outcomeModal`**: Displays descent outcomes, victory summaries, or defeat salvage reports.
- **`#classSelectModal`**: Class selection modal at run start.
- **`#inspectModal`**: Detailed tooltips and stat comparisons for equipped items vs. armory items.
- **`#saveSyncModal`**: Export/import of base64/JSON save strings.
- **`#newDungeonModal`**: Confirmation modal before resetting persistent dungeon floors.
- **`#diagnosticsModal`**: In-game display of the automated self-test suite results.

---

## 3. DOM Sync & Tactical Chronicle

- **State Syncing (`updateAllUI`)**:
  - Always call `updateAllUI()` after state mutations that impact health, inventory, equipped gear, or gold.
  - Keep DOM manipulations targeted to avoid unnecessary full-page repaints.
- **Chronicle Combat Log**:
  - Messages must use semantic color tags:
    - Damage dealt / critical: `#eab308` (Yellow/Gold)
    - Damage taken: `#ef4444` (Red)
    - Minerals mined / items found: `#38bdf8` (Cyan/Sky)
    - Lore / recovery events: `#a855f7` (Purple)
  - Limit chronicle history to the most recent 100 entries to prevent memory leaks.

---

## 4. Input Handling & Tactical Scanner

- **Keyboard Controls**:
  - Movement: `W`, `A`, `S`, `D` or Arrow Keys
  - Class Tactical Skill: `Q`
  - Quaff Healing Tonic: `H`
  - Read Astral Recall Scroll: `R`
  - Stairs: `E`
  - Wait: `Space`
- **Mouse & Tactical Scanner**:
  - Hovering over a tile displays target info in the tactical scanner HUD (monster stats, mineral tier, wall type).
  - Clicking an adjacent tile triggers context-sensitive action (move, attack, mine, open chest, ascend/descend stairs).
