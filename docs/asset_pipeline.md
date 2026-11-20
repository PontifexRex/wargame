# Aethelgard: The Starfall Vaults — Asset Taxonomy, Storage & Management Pipeline (Stage E.3)

- **Status**: Approved Baseline (`Stage E.3 Complete`)
- **Date**: 2026-11-19
- **Builds On**: [`docs/art_direction_brief.md`](art_direction_brief.md) (Stage E.1), [`docs/art_bible.md`](art_bible.md) & [`docs/ui_design_system.md`](ui_design_system.md) (Stage E.2)
- **Companion Registry**: [`assets/manifest.json`](../assets/manifest.json)
- **Feeds Into**: Stage E.4 (`ADR-0013` Graphics Engine Evaluation), Stage E.5 (Golden Slice), Stage E.6 (Scaled Production)

---

## 1. Studio Asset Governance Principles

1. **Semantic Lookup Only (Zero Hardcoded Paths)**:
   - Engine and UI code must **never** hardcode file paths like `assets/runtime/dungeon/chest.webp`.
   - Every visual or audio asset is referenced by its **Semantic Asset ID** (e.g. `dng_container_chest_gilded_closed`) resolved through [`assets/manifest.json`](../assets/manifest.json).
2. **Graceful Procedural Fallback**:
   - Every manifest entry tracks a `status` (`"procedural_fallback"`, `"placeholder"`, `"production"`). While an asset is in `"procedural_fallback"`, the renderer seamlessly falls back to Aethelgard's existing vector/Canvas 2D draw routines—guaranteeing **zero broken images** and **zero regressions** during incremental visual migration.
3. **Strict Separation of Authoring Masters vs. Runtime Exports**:
   - High-resolution layered authoring files live in `assets/raw/` (tracked via Git LFS or external studio storage, never shipped in runtime builds).
   - Game-ready compressed textures, packed sprite atlases, and audio files live in `assets/runtime/` (optimized for fast browser loading and WebGL2/WebGPU upload).
4. **Tiered Fidelity Budget Alignment**:
   - Asset resolutions, compression targets, and atlas packing strategies directly mirror the **3 Fidelity Tiers** established in [`docs/art_bible.md`](art_bible.md).

---

## 2. Directory Hierarchy

```text
assets/
├── manifest.json                 # Canonical semantic asset registry (checked into Git)
├── raw/                          # Authoring masters (Git LFS / external art vault; NEVER shipped)
│   ├── tier1_prestige/           # PSD/KRA/PNG 1024-1920px masters (portraits, paper-doll, interiors, bosses)
│   ├── tier2_tactical/           # City buildings (Lv 1-5), dungeon tiles, props, monsters, VFX
│   ├── tier3_cartography/        # Overworld tiles, POIs, heraldic banners, UI icons
│   └── audio/                    # Uncompressed 48kHz 24-bit WAV masters
└── runtime/                      # Game-ready optimized exports (served to browser/renderer)
    ├── atlases/                  # Packed TexturePacker / JSON-Hash sprite sheets (.webp + .json)
    │   ├── city_buildings_lv1_5.webp
    │   ├── dungeon_catacombs_kit.webp
    │   ├── dungeon_props_hazards.webp
    │   ├── overworld_cartography.webp
    │   └── ui_icons_master.webp
    ├── tier1/                    # Standalone high-res WebP assets (lazy-loaded on modal open)
    │   ├── portraits/            # Hero & Boss portraits (512x512 WebP)
    │   ├── paperdoll/            # Layered 1024x1024 transparent WebP equipment & cosmetics
    │   └── interiors/            # 1280x400 Guild & City Facility interior banners
    └── audio/                    # Runtime OGG/Opus + MP3/AAC SFX & ambient loops
```

---

## 3. Canonical Naming Convention

All asset IDs and filenames strictly follow lowercase `snake_case` using a 5-segment schema:

```text
<domain>_<category>_<entity>_<variant>_<state>
```

| Segment | Allowed Values / Examples | Notes |
| :--- | :--- | :--- |
| `<domain>` | `ow` (Overworld), `city` (Bastion City), `dng` (Dungeon), `char` (Hero/Paper-Doll), `mon` (Monsters/Bosses), `ui` (Chrome/Icons), `vfx` (Particles/Telegraphs), `sfx` (Audio) | Mandatory 2–4 char domain prefix |
| `<category>` | `tile`, `bldg`, `interior`, `portrait`, `layer`, `cosmetic`, `prop`, `container`, `mech`, `hazard`, `unit`, `boss`, `icon`, `banner` | Functional classification |
| `<entity>` | `chest`, `blacksmith`, `paladin`, `colossus`, `lever`, `oil_barrel`, `catacombs_wall` | Specific game object / archetype |
| `<variant>` | `gilded`, `lv1`..`lv5`, `starfall`, `oak`, `crimson`, `default` | Biome, level tier, or cosmetic theme |
| `<state>` | `idle`, `closed`, `open`, `damaged`, `active`, `lit`, `static` | Visual/animation state |

### Concrete Examples
- `char_portrait_paladin_default_idle`
- `char_cosmetic_cloak_starfall_idle`
- `city_bldg_blacksmith_lv3_idle`
- `city_interior_adventurers_guild_default_static`
- `dng_container_chest_gilded_closed` / `dng_container_chest_gilded_open`
- `dng_prop_oil_barrel_default_intact` / `dng_prop_oil_barrel_default_ignited`
- `dng_tile_wall_catacombs_ashlar_static`
- `ow_poi_dungeon_starfall_idle`
- `mon_boss_colossus_starfall_idle`

---

## 4. Complete Asset Catalog & Production Spec

### 4.1 Tier 1 — Prestige Realism (Lazy-Loaded Standalone WebP)
| Category | Asset Count (Target) | Master Size | Runtime Export | Max File Size | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Class Portraits** | 6 classes × 2 variants (12) | `1024×1024` PNG | `512×512` WebP (q88) | `≤ 65 KB` | Fighter, Thief, Mage, Ranger, Cleric, Paladin |
| **Paper-Doll Base Mannequins** | 6 classes | `1024×1024` PNG | `768×768` WebP (q90) | `≤ 90 KB` | Shared `(50%, 88%)` foot anchor |
| **Paper-Doll Equipment & Cosmetic Layers** | 40+ modular pieces (6 equip + 4 cosmetic slots) | `1024×1024` PNG | `768×768` WebP (q90) | `≤ 45 KB` | Transparent alpha, strict 10-layer z-order |
| **Guild & City Facility Interiors** | 12 buildings | `1920×600` PNG | `1280×400` WebP (q85) | `≤ 110 KB` | Header banners for `#wgFacilityModal` & Guilds |
| **Milestone Boss Portraits** | 4 bosses (Floors 5, 10, 15, 20) | `1024×1024` PNG | `512×512` WebP (q88) | `≤ 70 KB` | Colossus, Weaver, Ignis, Vespera |

### 4.2 Tier 2 — Modular Tactical Realism (Atlas-Packed WebP + Optional Normal Maps)
| Category | Asset Count (Target) | Tile / Cell Size | Atlas Packing | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **City Buildings (Lv 1–5)** | 18 building types × 5 levels (90) | `256×256` (2:1 iso footprint) | `2048×2048` atlas pages | Visible progression from Frontier Timber → Star-Forged |
| **Dungeon Biome Kits** | 4 biomes × ~18 modular wall/floor/door tiles (72) | `128×128` per tile | 1 atlas per biome (`1024×1024`) | `dwarven_catacombs`, `crystalline_caverns`, `molten_forgeworks`, `vespera_crater` |
| **Interactive Props, Containers, Mechanisms & Hazards** | ~28 objects × 2–3 states (~65) | `128×128` per prop | Shared `dungeon_props_hazards` atlas | Single-tile gilded chests, crates, barrels, levers, plates, oil/slag/spore hazards, ore veins |
| **Tactical Actors (Heroes & Monsters)** | 6 Heroes + ~20 Monsters + 4 Bosses | `128×128` (bosses `256×256`) | `actors_tactical` atlas | Idle + attack + hit/telegraph frames |

### 4.3 Tier 3 — Elevated Strategic Cartography & UI Icons
| Category | Asset Count (Target) | Cell Size | Atlas Packing | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Overworld Terrain & Transitions** | 5 biomes + coastlines/rivers (~40) | `128×128` | `overworld_cartography` atlas | Low-saturation illustrated map tiles |
| **Overworld POIs & Army Banners** | 4 Dungeon POIs + City tiers + Hostiles + Banners (~25) | `128×128` | `overworld_cartography` atlas | High silhouette contrast against terrain |
| **UI & Resource Icons** | Resources, stats, skills, rarity frames, consumables (~80) | `64×64` (SVG or 2× WebP) | `ui_icons_master` atlas | Crisp at `16px–32px` HUD scale |

### 4.4 Audio Assets
| Category | Format (Runtime) | Target Loudness | Max Size |
| :--- | :--- | :--- | :--- |
| **UI & Tactical SFX** (mining, anvil forge, chest open, sword hit, spell cast, recall chime) | OGG/Opus (48kHz, 96kbps) | `-14 LUFS` normalized | `≤ 25 KB` per clip |
| **Ambient Loops** (sunlit city birds/windmills, subterranean vault drips/rumble) | OGG/Opus (48kHz, 64kbps, seamless loop) | `-22 LUFS` subtle bed | `≤ 250 KB` per loop |

---

## 5. Storage, Versioning & Runtime Performance Budgets

### 5.1 Repository & Storage Strategy
- **Small Text & Manifests** (`assets/manifest.json`, atlas `.json` descriptors, SVG icons): Committed directly to Git.
- **Runtime Binary Exports** (`assets/runtime/**/*.webp`, `.ogg`): Tracked via **Git LFS** (or synced from an external S3/Cloudflare R2 CDN bucket when the asset catalog exceeds 250 MB) so `git clone` stays fast.
- **Raw Authoring Masters** (`assets/raw/**`): Stored in Git LFS with `.gitattributes` rules (`assets/raw/** filter=lfs diff=lfs merge=lfs -text`) or external cloud art archive; excluded from production web deployments.

### 5.2 Runtime Memory & Network Budgets
- **Initial Shell Boot Payload**: `≤ 1.5 MB` compressed (core UI icons + active Overworld/City atlas only).
- **Dungeon Entry Load Budget**: `≤ 1.0 MB` per biome (lazy-load only the active dungeon's biome atlas + shared props/actors).
- **Modal Lazy-Loading**: Tier 1 Guild interior banners (`≤ 110 KB`) and Hero Paper-Doll cosmetics (`≤ 45 KB` per layer) load on demand when the modal opens and cache in browser memory.
- **GPU Texture Memory Ceiling**: `≤ 128 MB` total active VRAM (max `2048×2048` per atlas page for universal desktop/mobile WebGL2 compatibility).

---

## 6. Semantic Manifest Registry (`assets/manifest.json`)

Engine code resolves all assets via [`assets/manifest.json`](../assets/manifest.json). Each entry conforms to:

```json
{
  "id": "dng_container_chest_gilded_closed",
  "tier": 2,
  "domain": "dng",
  "category": "container",
  "status": "procedural_fallback",
  "src": "assets/runtime/atlases/dungeon_props_hazards.webp",
  "atlasFrame": "dng_container_chest_gilded_closed",
  "width": 128,
  "height": 128,
  "anchor": [0.5, 0.85],
  "fallback": "drawGildedChestProp"
}
```

### Field Contract
- `id` *(string, required)*: Canonical 5-segment semantic ID.
- `tier` *(1 | 2 | 3, required)*: Visual fidelity tier from `docs/art_bible.md`.
- `status` *(`"procedural_fallback"` | `"placeholder"` | `"production"`, required)*: Controls whether the renderer draws the raster asset or falls back to procedural Canvas 2D.
- `src` *(string, required)*: Relative runtime path (resolved against CDN base URL if configured).
- `atlasFrame` *(string | null)*: Frame key inside a packed texture atlas, or `null` for standalone Tier 1 images.
- `anchor` *(`[x, y]` normalized `0..1`)*: Pivot point for ground-plane alignment (default `[0.5, 0.85]` for standing objects/units; `[0.5, 0.5]` for flat tiles/UI).
- `fallback` *(string | null)*: Name of the procedural renderer helper or CSS token used when `status === "procedural_fallback"`.

---

## 7. Automated Pipeline & QA Gates (Planned for Stage E.5)

When runtime assets begin landing in Stage E.5:
1. **Manifest Integrity Gate** (in `./scripts/test.ps1` and `./scripts/test-wargame.ps1`):
   - Validates `assets/manifest.json` JSON syntax and schema version.
   - Verifies every `id` matches the canonical regex `^[a-z]+_[a-z]+_[a-z0-9_]+_[a-z0-9_]+_[a-z0-9_]+$`.
   - Verifies that any entry with `status === "production"` points to an existing file on disk within its tier's byte-size budget.
2. **Visual Contrast & Anchor Check**:
   - Golden Slice scenes tested in both color and 100% grayscale to verify the 4-layer value separation budget (`docs/art_bible.md` §3).
