# ADR-0014: Unified Map Viewport Architecture & Best-in-Class Domain Grid Projections

- **Status**: Accepted
- **Date**: 2026-11-20
- **Milestone**: Track E — Map Architecture Foundation
- **Related**: [ADR-0005](./ADR-0005-camera-frustum-wall-los-and-safe-autowalk.md), [ADR-0011](./ADR-0011-macro-world-city-party-hierarchy.md), [ADR-0013](./ADR-0013-graphics-library-and-rendering-architecture.md), [`docs/art_bible.md`](../art_bible.md)

---

## 1. Context

Before investing in scaled main-screen tilesets (Overworld terrain, 8×8 City plots, and Dungeon chambers), Aethelgard must lock in both its **shared map engine architecture** and the **coordinate geometry / visual projection** for each of its three playable map domains.

Guiding principle: **Always choose the architecture that delivers the best possible player experience**, rather than forcing one compromise geometry across incompatible gameplay modes.

---

## 2. Decision: One Shared `MapViewportEngine` + Three Best-in-Class Grid Adapters (Path A)

All three spatial views share **one unified `MapViewportEngine`** for camera physics, mobile touch ergonomics, frustum culling, layered rendering, and pointer picking—while each gameplay domain plugs in the exact **Grid Adapter** that optimizes player readability and feel:

| Domain | Grid Topology | Visual Projection | Fidelity Tier | Player-Experience Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Overworld (Macro Strategy)** | **Hexagonal** (Pointy-Top Axial `(q, r)`) | Illustrated Strategic Cartography | Tier 3 | All 6 neighbors are equidistant (zero diagonal march distortion), organic coastlines & kingdom borders, industry standard (*Civ VI*, *Age of Wonders 4*). |
| **Bastion City (8×8 Builder)** | **Square** `(x, y)` | **Rotated Square (2:1 Isometric Diamond)** | Tier 2 | Buildings have true 3D height, pitched roofs, and Lv 1–5 silhouettes while `90°` streets and 64 spatial plots align naturally (*Anno 1800*, *Clash of Clans*). |
| **Starfall Vaults (Dungeon)** | **Square** `(x, y)` | **2.5D Oblique Top-Down** | Tier 2 | Crystal-clear `90°` dwarven masonry, doors, levers, traps, Bresenham wall LOS, and effortless desktop/mobile tap-to-move (*Shattered Pixel Dungeon*, *Caves of Qud*). |

---

## 3. Shared `MapViewportEngine` Contract & Library Stack

Built cleanly on top of **PixiJS v8** (`ADR-0013`) with our zero-dependency Canvas 2D fallback preserved:

1. **Unified 6-Layer Render Stack** (enforcing `docs/art_bible.md` §3 contrast separation):
   - `Layer 0`: Ground Terrain & Water (GPU-batched)
   - `Layer 1`: Roads, Decals, Floor Stamping & Hazard Puddles
   - `Layer 2`: Interactive Props, Ore Veins, Chests, Doors & Mechanisms
   - `Layer 3`: Y-Sorted Standing Structures (City Buildings) & Actors (Heroes, Parties, Monsters)
   - `Layer 4`: Dynamic Lighting & 3-State Fog of War
   - `Layer 5`: Selection Reticles, March Paths, Threat Telegraphs & Floating Combat VFX
2. **Pluggable `GridAdapter` Interface** (Pure JS, zero DOM dependencies):
   - `tileToWorld(coord)` / `worldToTile(wx, wy)`
   - `getNeighbors(coord)` / `getDistance(a, b)`
   - `getVisibleBounds(cameraRect)` (frustum culling)
3. **Recommended Open-Source Libraries (Strictly Behind `RenderAdapter`)**:
   - **`pixi-viewport`**: Native desktop wheel-zoom/drag-pan + **mobile pinch-to-zoom, momentum deceleration, bounds clamping, and tap-vs-drag disambiguation**.
   - **`@pixi/tilemap`**: GPU-batched tilemap rendering (1–2 draw calls at locked 60fps on mobile).
   - **`honeycomb-grid`** (or equivalent pure-ES2017 Axial/Cube hex module): Red Blob Games standard hex math for Overworld rings, spirals, distance, and pixel↔hex picking.
   - **Tiled (`.tmj` JSON)**: Optional authoring format for curated Overworld/City regions and Wang/blob auto-tiling terrain transitions.

---

## 4. Migration Strategy & Guardrails

1. **Zero Simulation Coupling**: `src/engine/*` and `src/wargame/engine/*` never import PixiJS or `pixi-viewport`. Hex math for Overworld marching lives in a pure deterministic JS module (`src/wargame/engine/hexGrid.js`) so all headless self-tests remain fast and deterministic.
2. **Incremental Migration Order**:
   - *Step 1*: Build the shared `GridAdapter` contract (`OrthoGridAdapter`, `IsoGridAdapter`, `HexGridAdapter`) + `MapViewportEngine` prototype.
   - *Step 2*: Migrate **City View** to 2:1 Isometric projection (same `8×8` plot state, zero save-schema breaking changes!).
   - *Step 3*: Migrate **Overworld** to Pointy-Top Hexagonal grid with clean save-migration mapping for legacy `(x, y)` coordinates.
   - *Step 4*: Upgrade **Dungeon View** to the shared GPU viewport with radial torchlight & biome shaders while preserving 2.5D Oblique readability.
3. **Golden Rule Preservation**: All 32 Roguelike + 15 Wargame self-tests must remain green at every migration step.
