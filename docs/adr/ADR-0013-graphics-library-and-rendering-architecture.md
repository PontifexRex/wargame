# ADR-0013: Graphics Library & Rendering Engine Architecture (Stage E.4)

- **Status**: Accepted
- **Date**: 2026-11-19
- **Milestone**: Track E — Stage E.4 (`Visual Foundation`)
- **Related**: [`docs/art_direction_brief.md`](../art_direction_brief.md) (E.1), [`docs/art_bible.md`](../art_bible.md) & [`docs/ui_design_system.md`](../ui_design_system.md) (E.2), [`docs/asset_pipeline.md`](../asset_pipeline.md) (E.3), [ADR-0001](./ADR-0001-dual-esm-and-zero-dep-bundle.md), [ADR-0005](./ADR-0005-camera-frustum-wall-los-and-safe-autowalk.md)

---

## 1. Context

Stages E.1–E.3 locked in Aethelgard's visual identity (**Grounded High-Craft Fantasy Realism**, **Dynamic Light-to-Dark Tone**, **3-Tier Visual Fidelity**) and semantic asset pipeline (`assets/manifest.json`). Before investing in scaled art production (Stages E.5–E.6), we must select the runtime graphics library and rendering architecture that meets all technical and business requirements without compromising our decoupled simulation-first codebase.

### Architectural & Visual Requirements
1. **Decoupled Simulation-First Boundary (Non-Negotiable)**:
   - Core simulation modules (`src/engine/*`, `src/wargame/engine/*`) and all 43 automated self-tests (31 Roguelike + 12 Wargame) must remain **100% renderer-agnostic** and execute headlessly in `< 1s`.
2. **Tier 1 Prestige Realism (Hero Profiles, Cosmetics & Guild Interiors)**:
   - Support crisp 10-layer composited Hero Paper-Doll mannequins, luminous cosmetic weapon/aura VFX, and 1280×400 Guild/Facility interior art banners inside our Carved Obsidian Slate & Celestial Gold UI chrome.
3. **Tier 2 Modular Tactical Realism (8×8 Cities & Procedural Dungeons)**:
   - 60fps rendering of 2:1 isometric City buildings (Lv 1–5) and procedural Dungeon chambers using packed `.webp` texture atlases, dynamic radial torchlight/flicker, biome color grading, additive VFX (oil fire, spores, starlight), and smooth camera pan/zoom.
4. **Tier 3 Elevated Strategic Cartography (Macro Overworld)**:
   - Smooth pan/zoom over large multi-city Overworld maps with layered Fog of War, animated water/clouds, and dozens of marching armies/POIs.
5. **Web-First Accessibility & Instant Boot**:
   - Lightweight browser delivery (`≤ 1.5 MB` initial shell payload), zero heavyweight WASM downloads, and graceful fallback when WebGL2 is unavailable or assets are still in `"procedural_fallback"`.

---

## 2. Candidate Evaluation Matrix

| Criterion | **PixiJS v8 (WebGL2/WebGPU)** | **Phaser 3** | **Three.js (WebGL2 3D/HD-2D)** | **Godot 4 (WASM Export)** | **Pure Canvas 2D (Status Quo)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Decoupled Simulation Fit** | **Excellent** — pure renderer; zero opinionated game loop or state lock-in | Moderate — opinionated Scene/Input/Physics framework duplicates our CommandBus | Good — pure 3D renderer, requires scene-sync bridge | Poor — requires rewriting JS simulation & tests in GDScript/C# | Excellent — already integrated |
| **Tier 2 Isometric & Dungeon Lighting** | **Excellent** — GPU sprite batching, custom GLSL/WGSL torchlight & normal-map filters | Good — WebGL2 pipelines available, heavier abstraction | Excellent — true 3D lighting & shadows | Excellent | Limited — CPU-bound for dynamic lighting, bloom & large atlases |
| **Tier 1 Paper-Doll & HTML/Tailwind UI** | **Excellent** — pairs seamlessly with DOM/Tailwind modals + optional shader overlay | Moderate — DOM overlay integration is clunkier | Good — DOM overlays work, heavier GPU overhead | Poor — discards HTML/Tailwind UI completely | Good — DOM-native |
| **Asset Authoring Cost** | **Low–Moderate** — 2D/2.5D sprites & TexturePacker `.webp` atlases | Low–Moderate — 2D sprites & atlases | High — 3D meshes, UVs, PBR textures for 90+ buildings & 72+ tiles | Moderate–High | Low (procedural) |
| **Bundle & Boot Footprint** | **~150 KB gzipped** (instant web boot) | ~350 KB gzipped | ~170 KB gzipped | 20–40 MB WASM (slow web boot) | **0 KB** |
| **Fallback / Offline Resilience** | Automatic WebGPU → WebGL2 → Canvas fallback | WebGL → Canvas | WebGL2 only | WebGL2/WASM only | Universal |

---

## 3. Decision

We adopt **PixiJS v8 (WebGL2 with WebGPU auto-upgrade)** as Aethelgard's **Production GPU Canvas Renderer**, isolated behind a clean **`RenderAdapter` boundary**, while retaining:
1. **HTML5 + Tailwind CSS** (governed by [`docs/ui_design_system.md`](../ui_design_system.md)) for all Tier 1 UI chrome, Guild/Facility modals (with Tier 1 interior art banners), and the Shared Character Sheet shell.
2. **Existing Canvas 2D Renderers** (`src/ui/renderer.js` and `src/wargame/ui/wargameCanvas.js`) as our permanent **Zero-Dependency Fallback & Headless Smoke-Test Backend**.

### Why PixiJS v8 Wins for Aethelgard
- **Surgical Fit**: PixiJS is a dedicated GPU rendering engine—not a competing game framework. Our existing Event Bus, Command Bus, Binary Min-Heap Scheduler, RLE Dungeon Persistence, and 43 self-tests remain untouched.
- **Native Atlas & Shader Power**: Directly consumes the `assets/runtime/atlases/*.webp` + `.json` sheets specified in [`docs/asset_pipeline.md`](../asset_pipeline.md), while unlocking GPU shaders for dynamic radial torchlight, subterranean biome grading, water shimmer, and Tier 1 cosmetic aura/weapon glow VFX at locked 60fps.
- **Incremental, Zero-Regression Rollout**: Because `assets/manifest.json` marks unproduced assets as `"procedural_fallback"`, we can migrate one domain at a time (starting with the Stage E.5 Golden Slice) without ever breaking the live playable game.

---

## 4. Architectural Boundary & Adapter Contract

```text
  Simulation Layer (Pure JS, 0 Renderer Imports)
    src/engine/*  &  src/wargame/engine/*
                      │
                      ▼ (Immutable View Snapshot + Domain Events)
  Asset & Render Adapter Layer
    src/ui/assetRegistry.js  ──▶  reads assets/manifest.json
    src/ui/renderAdapter.js  ──▶  selects backend:
                                    ├── PixiRendererBackend (WebGL2/WebGPU GPU path)
                                    └── Canvas2DFallbackBackend (headless / zero-dep fallback)
```

### Mandatory Guardrails
1. **Zero Renderer Imports in Engine**: No file under `src/engine/`, `src/data/`, `src/wargame/engine/`, or `src/wargame/data/` may import PixiJS or touch `window`/`document`.
2. **Manifest-Only Asset Resolution**: Both `PixiRendererBackend` and DOM UI components resolve image URLs strictly via `AssetRegistry.resolve(assetId)` backed by `assets/manifest.json`.
3. **Self-Contained Local Vendor Bundle**: When integrating PixiJS in Stage E.5, vendor the pinned minified ESM build locally under `vendor/pixi.min.mjs` (or bundle cleanly) so `file://` and offline play remain supported per `ADR-0001`.
4. **ES2017 Compliance**: All Aethelgard adapter code continues to respect the `ADR-0001` syntax gate (no `?.` or `??`).

---

## 5. Consequences & Next Steps

- **Positive**: Unlocks 60fps GPU sprite batching, real-time torchlight/normal-map shaders, and prestige cosmetic aura VFX while preserving 100% of our existing simulation code, HTML/Tailwind UI, and 43 automated tests.
- **Trade-off**: Adds one pinned third-party rendering library (`pixi.js` ~150 KB gzipped) strictly inside the UI/renderer layer; mitigated by keeping the zero-dependency Canvas 2D fallback intact.
- **Immediate Next Milestone (Stage E.5 — "Golden Slice")**:
  1. Implement `src/ui/assetRegistry.js` + `src/ui/renderAdapter.js` with PixiJS v8 integration and automatic Canvas 2D fallback.
  2. Produce and wire one complete **Golden Slice** vertical showcase:
     - 1 Overworld biome chunk + Starfall Vault POI (Tier 3)
     - 1 Sunlit City building cluster + 1 Guild Interior Banner (Tier 2 + Tier 1)
     - 1 Subterranean Dwarven Catacombs chamber with radial torchlight, single gilded chest, 1 Hero, and 1 Monster (Tier 2)
     - 1 Tier 1 Hero Portrait & Paper-Doll Showcase
  3. Benchmark 60fps frame stability, grayscale 4-layer contrast readability, and manifest validation gate before scaling to Stage E.6.
