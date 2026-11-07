# ADR-0003: Multi-Dungeon Registry, Live `state.dungeon` Alias & RLE Persistence

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.4.5-atlas`

## Context & Problem Statement

Prior to `v0.4.5-atlas`, `gameState.dungeon` held a single fixed `21x15` dungeon. Expanding the game to support multiple simultaneous dungeons of much larger dimensions (`48x36` up to `192x144`+ and custom `Width x Height` up to `500x500`), while preparing for a future Overland World Map with potentially hundreds of persistent dungeons, posed two major architectural challenges:
1. **API Compatibility**: Dozens of existing combat, mining, rendering, and test functions read `state.dungeon.currentFloor` and `state.dungeon.floors[depth]`.
2. **Memory & Storage Footprint**: Storing raw 2D JSON arrays for multiple `192x144` (`27,648` tiles/floor) dungeons would quickly exceed the ~5 MB browser `localStorage` quota.

## Decision

1. **Unbounded Multi-Dungeon Registry (`state.dungeons`)**:
   - `state.dungeons` is a dictionary keyed by `dungeonId` containing both curated regional profiles (`dng_starfall`, `dng_quarry`, `dng_mycelium`, `dng_citadel`) and player-created custom charters (`originType: 'chartered'`).
   - Each `DungeonInstance` includes `worldCoords: null` (`{ x, y, regionId }`) so a future World Map layer can position any dungeon without a schema rewrite.
   - `DEFAULT_MAX_CHARTERED_DUNGEONS` (`12`) is strictly a soft UI configuration cap (`state.maxCharteredDungeons`), not a structural slot limit.
2. **Live Alias Contract (`syncActiveDungeonAlias`)**:
   - `state.dungeon` is always maintained as a direct reference to `state.dungeons[state.activeDungeonId]`. Existing code reading `state.dungeon` continues to work seamlessly.
3. **Typed-Array Grids & Lossless RLE Compression (`src/engine/compression.js`)**:
   - Active hydrated floors store `tiles` and `explored` as rows of `Uint8Array(width)`.
   - When switching dungeons (`syncActiveDungeonAlias`) or serializing to `localStorage` (`serializeStateForStorage`), inactive/stored floors are automatically compressed via `packFloorForStorage(floor)` into compact run-length encoded strings (`tilesRle`, `exploredRle`), achieving ~15x–30x size reduction with 100% lossless round-trip hydration (`hydrateFloorFromStorage`).

## Consequences

- **Positive**: Hundreds of persistent exploration-scale dungeons fit comfortably in RAM and `localStorage`; backward-compatible with `v1`–`v4` saves via `migrateSaveData()`.
- **Negative / Guardrails**: Code accessing a floor must call `ensureDungeonFloorHydrated(state.dungeon, depth)` (or access the active floor after `syncActiveDungeonAlias`) so packed floors are hydrated on demand.
