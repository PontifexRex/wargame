# ADR-0004: Macro-Sector Procedural Generation, Wall-Only Veins & Typed-Array BFS

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.4.5-atlas`

## Context & Problem Statement

A random rejection-sampling room generator that worked on a `21x15` grid does not scale cleanly to `80x60`, `128x96`, `192x144`, or `400x300` floors, and standard `Array.shift()` + string-key `Set` BFS validation becomes slow on tens of thousands of tiles. Furthermore, map surface dimensions (`width x height`) needed to be completely decoupled from dungeon floor depth (`maxDepth`) so both shallow colossal ruins (1–2 floors) and deep narrow delves work naturally.

## Decision

1. **Macro-Sector Multi-Wing Generation (`src/engine/procedural.js`)**:
   - `generateFloor(depth, dungeonConfig, dungeonSeed)` divides any `W x H` floor into a grid of ~`16x12` macro-sectors using a deterministic seeded PRNG (`mulberry32` in `src/engine/rng.js`).
   - Supports 4 architectural styles (`masonry_vaults`, `excavation_quarry`, `crystalline_caverns`, `grand_ruins`), spanning-tree + loop corridors (`loopRatio`), 2-tile main avenues, Guarded Treasure Vaults (`floor.vaults`), and Motherlode mineral seam clusters.
   - `width`, `height`, and `maxDepth` are independent parameters in `DungeonConfig`. On the final floor (`depth >= cfg.maxDepth`), `hasDownStairs` is `false` and the distant sanctum houses a Grand Relic Chest and/or scheduled Boss.
2. **Non-Blocking Wall Vein Invariant**:
   - Mineral veins (`TILE_ORE_*`) are only placed on `TILE_WALL` cells orthogonally bordering at least one walkable `TILE_FLOOR` cell—never inside walkable corridors where an unresearched vein could block movement.
3. **Zero-Allocation Typed-Array BFS (`verifyPureFloorBFS`)**:
   - Reachability validation uses pre-allocated `Uint8Array(w * h)` visited bitmaps and `Int32Array(w * h)` ring queues with integer indices (`idx = y * w + x`), verifying connectivity across `27,648+` tiles in `< 1 ms`.

## Consequences

- **Positive**: Deterministic, multi-wing exploration layouts across any map scale (`15x15` to `500x500`); guaranteed trap-free and ore-free path reachability.
- **Negative / Guardrails**: Any new interactive floor hazard must either be excluded from `isSafeWalkableTile` in `verifyPureFloorBFS` or verified not to sever the path between `<` and `>`.
