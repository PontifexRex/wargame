# ADR-0005: Frustum-Culled `21x15` Camera, Bresenham Wall LOS & Safe Auto-Walk

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.4.5-atlas`

## Context & Problem Statement

With floor dimensions expanding up to `192x144` (`27,648` tiles—88x larger than the original `21x15` grid), rendering the entire floor on `#dungeonCanvas`, using simple Euclidean distance for vision, or requiring hundreds of manual keypresses to backtrack across cleared chambers would degrade both performance and player experience.

## Decision

1. **Frustum-Culled `21x15` Camera Viewport (`getCameraOrigin` in `src/ui/renderer.js`)**:
   - `#dungeonCanvas` (`672x480`, `32px` tiles) always renders a `21x15` camera window centered on `(hero.x, hero.y)` and clamped to `[0 .. floor.width - 21]`, `[0 .. floor.height - 15]`.
   - Tile and monster draw loops iterate strictly over the `21x15` (`315` tiles) camera frustum (`O(1)` frame cost regardless of floor size).
2. **Bresenham Raycast Wall Line-of-Sight (`hasLineOfSight` in `src/engine/combat.js`)**:
   - `updateFOV()`, ranged combat skills, and monster sight checks trace integer Bresenham rays within `visionRadius` (`5`–`10` tiles). Solid walls (`TILE_WALL`) and unmined ore veins (`ORE_CATALOG[t]`) are visible themselves but block sight beyond them.
3. **Cartographer's Minimap, `[M]` Survey Map & Safe Auto-Walk**:
   - `#minimapCanvas` (Right Sidebar) and `#fullMapCanvas` (`[M]` modal) render the entire explored floor scaled to fit, highlighting stairs, chests, shrines, ore veins, visible hostiles, and the `21x15` camera box.
   - Clicking any distant explored tile on `#dungeonCanvas`, `#minimapCanvas`, or `#fullMapCanvas` invokes `startAutoWalkTo(tx, ty)` (`computeSafeExploredPath` + `stepAutoWalkOnce`), stepping along explored safe tiles and **halting immediately** if a hostile enters sight (`areHostilesInSight`), a trap is spotted, or the hero takes damage.

## Consequences

- **Positive**: Constant-time 60 FPS canvas rendering at any map scale; authentic dungeon room occlusion; effortless navigation across large multi-wing maps without violating Golden Rule 1 (no floor-skipping elevators).
- **Negative / Guardrails**: Mouse hover/click handlers in `src/ui/input.js` must always add `(cam.camX, cam.camY)` when converting `#dungeonCanvas` viewport coordinates to world grid coordinates.
