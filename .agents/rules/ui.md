# UI, Canvas & Presentation Rules

## 1. Canvas 2D Camera Frustum & Exploration Overview (`ADR-0005`)

- **Viewport Size**: Fixed `21` columns by `15` rows of `32x32` tiles (`672x480` canvas) scrolling smoothly over exploration-scale maps (`64x44` to `168x120`+).
- **Camera Clamping (`getCameraOrigin`)**: Centers on `(hero.x, hero.y)` and clamps to `[0, floor.width - 21]` and `[0, floor.height - 15]`.
- **Full-Map Exploration Overview (`[M]`)**:
  - Toggled via key `M` or the HUD Map button (`toggleMapOverview()`).
  - Auto-scales explored tiles to fit the `672x480` canvas and highlights Stairs (`<`/`>`), Chests, Shrines, visible monsters, and the Hero beacon.
- **Shadowcasting Field-of-View (FOV)**:
  - Unexplored tiles: Hidden in deep fog (`#0a0a0f`).
  - Explored out-of-sight tiles: Rendered with a desaturated memory tint.
  - Visible tiles: Rendered in full color with entity highlights and floating combat text.

---

## 2. In-Game Modals (No Native Dialogs)

> [!WARNING]
> Never call `window.alert()`, `window.confirm()`, or `window.prompt()`.

All dialogs and user confirmations must use custom in-game modal components:
- **`#outcomeModal`**: Descent outcomes, extraction summaries, defeat salvage reports, and dungeon charter confirmations.
- **`#classSelectModal`**: Class selection modal.
- **`#itemInspectModal`**: Detailed tooltips and stat/socket comparisons for equipped items vs. armory items.
- **`#saveSyncModal`**: Export/import of JSON save strings.
- **`#diagnosticsModal`**: In-game display of the 17/17 automated self-test suite results.

---

## 3. DOM Sync & HTML Contract Gate

- **DOM ID Contract**: Every `document.getElementById('...')` in `src/` is automatically verified against `index.html` by `./scripts/test.ps1`. Never reference a DOM ID in `src/` without ensuring the element exists in `index.html`.
- **Guild Hub Tabs**:
  1. Quartermaster & Mercenary Shop
  2. Antiquarian Assay & Ore Smelting
  3. Astral Lapidary & Gem Socketing
  4. Guild Research Lab
  5. Vanguard Notice Board (Bounties)
  6. Expedition Atlas (Multi-Dungeon Selector & Custom Charter Builder)

---

## 4. Input Handling & Safe Click-to-Autowalk (`ADR-0005`)

- **Keyboard Controls**:
  - Movement: `W`, `A`, `S`, `D` or Arrow Keys
  - Class Tactical Skill: `Q`
  - Quaff Healing Tonic: `H`
  - Read Astral Recall Scroll: `R`
  - Stairs: `E`
  - Full-Map Exploration Overview: `M`
  - Wait: `Space`
- **Mouse & Safe A* Click-to-Autowalk**:
  - Translates canvas pixel coordinates via `cameraX`/`cameraY` into world tile coordinates `(tx, ty)`.
  - Clicking an adjacent tile executes a context-sensitive action; clicking a distant explored walkable tile steps along a bounded A* path (`findSafeExplorePath`) and halts immediately if a monster, shrine, chest, visible trap, or damage interrupt occurs.
