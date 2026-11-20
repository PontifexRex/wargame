# Aethelgard: The Starfall Vaults — Art Direction Brief (Stage E.1)

- **Status**: Approved Baseline (`Stage E.1 Complete`)
- **Date**: 2026-11-19
- **Feeds Into**: Stage E.2 (`docs/art_bible.md` & `docs/ui_design_system.md`), Stage E.3 (`docs/asset_pipeline.md`), Stage E.4 (`ADR-0012` Graphics Engine Evaluation)

---

## 1. Visual Identity Statement

**Aethelgard** embraces **Grounded High-Craft Fantasy Realism with Dynamic Emotional Tone and Tiered Visual Fidelity**.

It deliberately rejects generic cartoony pixel-art tropes, pure storybook illustration, and bland toy-like 3D minimalism. Instead, it anchors on authentic, tactile materials—carved ashlar stone, seasoned timber, brushed brass, forged steel, woven cloaks, and luminous starlight crystal—while shifting lighting and mood dynamically between **warm, sunlit, whimsical frontier life** on the surface and **dramatic, mysterious chiaroscuro** deep inside the Starfall Vaults.

---

## 2. Core Visual Pillars

1. **Grounded Material Craft**:
   - Stone has weight and mortar; steel catches warm torchlight and cold astral sheen; timber shows grain; banners and foliage feel alive.
   - Surface benchmarks: *Anno 1800*, *Age of Wonders 4*.
   - Subterranean benchmarks: *Pillars of Eternity*, *Diablo II: Resurrected*.
   - Character & Cosmetic benchmarks: *Baldur's Gate 3*, *Path of Exile*, *Magic: The Gathering* illustration craft.
2. **Dynamic Light-to-Dark Tone ("Light & Whimsical Where Earned, Dark Where Atmospheric")**:
   - **Sunlit Frontier Overworld**: Golden-hour sunlight, emerald river vales, alpine waterfalls, misty mountain passes, inviting curiosity and adventure.
   - **Thriving Bastion Cities**: Bright daylight cobblestone plazas, spinning wooden windmills, blooming gardens, terracotta/slate roofs, fluttering heraldic banners—warm, welcoming, and rewarding to grow.
   - **Subterranean Starfall Vaults**: Deep obsidian shadows, warm flickering torchlight, glowing cyan/violet/amber star-ore seams, ancient dwarven mechanisms—tense, tactile, and awe-inspiring.
3. **Readability First in Tactical Play**:
   - High-craft detail must never muddy gameplay clarity. Value/contrast separation strictly distinguishes:
     1. *Background Terrain* (lower contrast, grounded earth/stone values)
     2. *Interactive Props & Mechanisms* (clear silhouettes, subtle highlight rims)
     3. *Units, Heroes & Monsters* (highest silhouette contrast + subtle ground contact shadows)
     4. *Telegraphs & VFX* (luminous, saturated, unmistakably readable)
4. **Emotional Resonance in Character Identity (Cosmetic Economy Pillar)**:
   - Because Aethelgard is funded via a fair, non-P2W subscription + cosmetic model, **Hero Profiles, Portraits, Paper-Doll Mannequins, and Cosmetic Items** (cloaks, armor sets, weapon glows, heraldic crests, auras) are our **highest-fidelity showcase**. Players must feel genuine pride and emotional connection when dressing and inspecting their Heroes.

---

## 3. Tiered Visual Fidelity Strategy (Studio Budget & Scalability)

Rather than forcing one uniform asset cost across every screen, Aethelgard intentionally allocates visual fidelity across **three structured tiers**:

| Fidelity Tier | Target Domains | Purpose & Design Rationale | Production & Runtime Strategy |
| :--- | :--- | :--- | :--- |
| **Tier 1: Prestige Realism** | Hero Profiles & Portraits, Paper-Doll Mannequin & Cosmetic Showcase, Milestone Boss Portraits, Star-Forged Relics, City Wonders | Drives emotional attachment, identity, and fair cosmetic monetization. | High-resolution bespoke painted/rendered art, layered paper-doll equipment/cosmetic overlays, subtle shader/aura VFX. |
| **Tier 2: Modular Tactical Realism** | 8x8 City Constructs (Lv 1–5 evolutions) & Procedural Dungeon Rooms (Walls, Floors, Doors, Mechanisms, Props, Monsters) | Scales cleanly to procedural generation and 64-plot city layouts while maintaining grounded realism. | 2:1 Isometric / 2.5D modular kits, normal-mapped sprite atlases, runtime lighting & biome color grading. |
| **Tier 3: Elevated Strategic Cartography** | Macro Overworld Map, Territory Borders, Marching Army Banners, Minimap, Resource Icons | Instant strategic readability across massive 1-year worlds with many cities and armies. | Crisp illustrated cartographic tiles, atmospheric cloud/fog-of-war layers, lightweight vector/atlas icons. |

---

## 4. Camera Projection & UI Chrome Language

- **Camera Projection**:
  - **Overworld**: Elevated illustrated cartographic grid (Tier 3) with atmospheric clouds and clear terrain readability.
  - **City View**: Sunlit 2:1 Isometric modular city layout (Tier 2) showcasing building tiers and lively civic detail.
  - **Dungeon View**: 2:1 Isometric or 2.5D Oblique tactical grid (Tier 2) prioritizing crisp tile boundaries, line-of-sight, and interactive object readability.
  - **Character Profile & Cosmetics**: Full-bleed Prestige Showcase modal (Tier 1) shared seamlessly across both Overworld/City and Dungeon views.
- **UI & HUD Chrome**:
  - **Carved Obsidian Slate & Brushed Celestial Gold**: Clean dark-slate surfaces with fine gold/brass filigree accents and crisp modern typography, letting sunlit cities, moody vaults, and luminous Prestige character cosmetics stand out cleanly.

---

## 5. Handoff Criteria for Upcoming Track E Stages

- **Stage E.2 (`docs/art_bible.md` & `docs/ui_design_system.md`)**: Translate these pillars into exact color hex palettes per biome/time-of-day, value contrast budgets, lighting/shadow angles, typography scale, and reusable UI component tokens.
- **Stage E.3 (`docs/asset_pipeline.md`)**: Define the full asset inventory, `assets/raw/` vs. `assets/runtime/` structure, canonical naming (`<domain>_<category>_<entity>_<variant>_<state>`), Git LFS / external storage rules, atlas specs, and `assets/manifest.json`.
- **Stage E.4 (`ADR-0012`)**: Benchmark candidate WebGL2/WebGPU renderers (**PixiJS**, **Phaser 3**, **Three.js**, **Godot**) specifically against Tier 1 layered cosmetics + Tier 2 modular normal-mapped lighting + Tier 3 large-map performance, while strictly preserving our decoupled simulation engine.
