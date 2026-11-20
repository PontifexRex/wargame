# Aethelgard: The Starfall Vaults — Formal Art Bible (Stage E.2)

- **Status**: Approved Baseline (`Stage E.2 Complete`)
- **Date**: 2026-11-19
- **Builds On**: [`docs/art_direction_brief.md`](art_direction_brief.md) (Stage E.1)
- **Companion Doc**: [`docs/ui_design_system.md`](ui_design_system.md) (UI Chrome & Component Tokens)
- **Feeds Into**: Stage E.3 (`docs/asset_pipeline.md`), Stage E.4 (`ADR-0012` Graphics Engine Evaluation), Stage E.5 (Golden Slice)

---

## 1. Visual North Star & Fidelity Tier Matrix

Aethelgard's visual identity is **Grounded High-Craft Fantasy Realism with Dynamic Emotional Tone and Tiered Visual Fidelity**. Every visual asset—whether a sunlit windmill in Bastion #1, a bioluminescent quartz wall on Floor 7, or a Star-Forged cloak in the Hero Showcase—must adhere to one of three explicit fidelity tiers:

| Tier | Name | Domains Covered | Target Resolution / Density | Visual Philosophy |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Prestige Realism** | Hero Portraits, Full-Body Paper-Doll Mannequins, Cosmetic Sets (Cloaks, Auras, Armor, Weapons), Milestone Boss Portraits, Guild/Facility Interior Banners, Star-Forged Relics | 1024×1024 to 1920×1080 painterly/rendered masters; crisp 2× UI exports | Highest emotional resonance; drives Hero attachment and fair cosmetic monetization. |
| **Tier 2** | **Modular Tactical Realism** | 8×8 City Buildings (Lv 1–5 evolutions), Procedural Dungeon Rooms (Walls, Floors, Doors, Mechanisms, Props, Containers, Hazards), Tactical Units & Monsters | 128×128 to 256×256 per tile/prop (2:1 isometric or 2.5D oblique) with optional normal/emissive maps | Authentic tactile materials built as reusable modular kits that scale to procedural dungeons and 64-plot cities. |
| **Tier 3** | **Elevated Strategic Cartography** | Macro Overworld Terrain, Territory Borders, Marching Army Banners, Dungeon POIs, Minimap, Resource & Status Icons | 64×64 to 128×128 illustrated map tiles; 32×32 to 64×64 crisp UI icons | Instant strategic legibility across massive multi-city maps and long-term campaigns. |

---

## 2. Master Color Theory & Biome Palettes

Aethelgard uses **Dynamic Light-to-Dark Tone**: warm, sunlit, inviting palettes on the surface; moody, high-contrast chiaroscuro underground.

### 2.1 Surface Overworld Biomes (Tier 3 — Golden-Hour Daylight)

Surface terrain uses low-to-medium saturation so cities, banners, marching armies, and Dungeon POIs read immediately at macro zoom.

| Biome | Primary Fill | Secondary / Detail | Highlight / Sunlit Edge | Shadow / Depth | Atmospheric Cue |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Emerald Plains** | `#4d7c4f` | `#3f6a44` | `#7da868` | `#2c4a32` | Golden-hour meadow warmth, wildflower flecks |
| **Whispering Forest** | `#2f5742` | `#234232` | `#4f7d5b` | `#182e23` | Layered pine canopies, dappled mist |
| **Highland Mountains** | `#64748b` | `#475569` | `#cbd5e1` (snow cap) | `#334155` | Slate crags, alpine waterfalls, cloud wisps |
| **River & Coastal Water** | `#2563eb` | `#1d4ed8` | `#7dd3fc` (foam/glint) | `#1e3a8a` | Reflective sky-blue tint, shoreline sand `#d6c29f` |
| **Arid Frontier / Badlands** | `#9a7b56` | `#7c5e3c` | `#c7a77b` | `#574028` | Sun-baked ochre cliffs, ancient ruin stones |

### 2.2 Bastion City Daylight Palette (Tier 2 — Warm & Whimsical Civic Life)

Cities must feel **rewarding, alive, and welcoming** to build and return to after dark subterranean delves.

| Material / Element | Base Hex | Lit Highlight | Occluded Shadow | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Cobblestone Plaza** | `#8c857b` | `#b5aea3` | `#59534b` | Ground plots, roads, central square |
| **Seasoned Timber** | `#7c5233` | `#a47148` | `#4a2e1b` | Huts, windmills, beams, scaffold frames |
| **Terracotta Roof** | `#b85a3a` | `#d97b59` | `#7a3520` | Residential huts, civic roofs, apothecary |
| **Dwarven Slate Roof** | `#4a5568` | `#718096` | `#2d3748` | Guild halls, garrison, blacksmith, fortress walls |
| **Heraldic Gold & Brass** | `#d97706` | `#fbbf24` | `#92400e` | Banner trim, guild crests, roof finials, Star-Forge accents |
| **Lush Garden Foliage** | `#3f8f4e` | `#6cc476` | `#23572e` | Gardens, hedgerows, courtyard trees |

#### City Building Visual Evolution (Levels 1 → 5)
Every constructible building on the 8×8 grid must visibly communicate its upgrade level without requiring text labels:
- **Level 1 (Frontier Timber)**: Rough-hewn wood, thatch or simple shingle roofs, dirt/gravel yard.
- **Level 2 (Reinforced Stone)**: Carved ashlar foundations, terracotta/slate roofing, cobblestone courtyard.
- **Level 3 (Guild Craftsmanship)**: Second story or tower additions, brass trim, fluttering cloth banners, warm window glow.
- **Level 4 (Grand Masonry)**: Buttressed stonework, stained glass or forge chimneys, sculpted heraldic emblems.
- **Level 5 (Star-Forged Masterwork)**: Celestial gold inlay, luminous astral lanterns/runes, banner pennants, monumental silhouette.

### 2.3 Subterranean Dungeon Biomes (Tier 2 — Chiaroscuro & Emissive Accents)

Exact alignment with [`BIOME_PALETTES`](../src/data/dungeons.js) in the simulation engine:

| Biome ID | Name | Wall Fill / Cap / Base | Floor 1 / Floor 2 / Border | Emissive Accent | Torch / Key Light RGB | Mood & Material Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dwarven_catacombs` | **Dwarven Catacombs** | `#1b2434` / `#293548` / `#0d131d` | `#0e1420` / `#111826` / `#192234` | `#fbbf24` (Warm Torch) | `(251, 191, 36)` | Carved blue-slate ashlar blocks, iron sconces, ancient masonry seams |
| `crystalline_caverns` | **Crystalline Caverns** | `#1e1b4b` / `#3730a3` / `#0f0c29` | `#0c1226` / `#101730` / `#1e2942` | `#38bdf8` (Quartz Cyan) | `(56, 189, 248)` | Wet indigo cavern rock, translucent quartz clusters, cold bioluminescence |
| `molten_forgeworks` | **Molten Forgeworks** | `#2a1612` / `#451a03` / `#150906` | `#160c0a` / `#1d100d` / `#2d1814` | `#f97316` (Molten Slag) | `(249, 115, 22)` | Charred basalt, iron grates, glowing magma vents and slag fissures |
| `vespera_crater` | **The Vespera Crater** | `#1e1033` / `#4c1d95` / `#0d0617` | `#0d0818` / `#130c24` / `#261545` | `#c084fc` (Abyssal Violet) | `(192, 132, 252)` | Fractured obsidian void-glass, suspended astral dust, eerie eldritch glow |

### 2.4 Guild & City Building Interior Artwork (Tier 1 Banner Illustrations)

Each enterable Guild and City Facility modal (`#wgFacilityModal` and Guild screens) features a wide atmospheric interior header illustration (**16:5 or 21:9 aspect ratio**, e.g. `1280×400` master) depicting the living interior of that building:

| Building / Guild | Lighting & Emotional Tone | Focal Props & Storytelling Details |
| :--- | :--- | :--- |
| **Adventurers Guild** | Warm golden hearthlight + sunlit oak rafters | Pinned parchment quest board, cartography table with Starfall Vault maps, lantern-lit tavern hall |
| **Fighters Guild** | Crisp daylight clerestory + forged iron shadows | Weapon racks, sparring dummies, scarred oak shields, banner of crossed greatswords |
| **Thieves Guild** | Moody amber lanternlight + shadowy stone arches | Hidden ledger desk, lockpicking bench, velvet-draped relic table, hooded silhouettes |
| **Mages Guild** | Cool astral cyan + warm brass candlelight | Floating starlight astrolabe, towering leather-bound tomes, runic chalk circle |
| **Rangers Lodge** | Dappled forest sunlight through timber windows | Yew longbows, fletching table, mounted antlers, weathered frontier trail maps |
| **Temple Chapterhouse** | Radiant stained-glass sunbeams + serene candle glow | Carved marble altar, sunlit golden sunburst emblem, prayer alcove, silver reliquaries |
| **City Garrison** | Disciplined torchlit stone + iron portcullis | Tactical war-table with miniature party banners, armored mannequins, formation rosters |
| **Dwarven Smeltery** | Intense orange furnace glow + dark soot stone | Pouring crucibles, stacked iron/mithril/astral ingot molds, roaring bellows |
| **Alchemist Apothecary** | Warm whimsical emerald & amber glass refraction | Bubbling copper alembics, dried herb rafters, glowing crimson tonics & blue Recall Scrolls |
| **Blacksmith & Star-Forge** | Blazing forge coals + astral cyan sparks | Massive runed anvil, glowing star-steel blade being tempered, hanging masterwork hammers |
| **Lapidary Workshop** | Focused jewel-lamp spotlight + velvet darkness | Magnifying brass loupes, cut ruby/sapphire/topaz/amethyst trays, precision socket chisels |
| **Warehouse / City Vault** | Warm sunlit timber rafters + iron-bound chests | Stacked ore crates, labeled merchant barrels, reinforced vault doors, ledger counter |

---

## 3. The 4-Layer Value & Contrast Separation Budget

To guarantee **Readability First in Tactical Play**, every gameplay canvas enforces strict luminance (Value `V` in HSV/HSL) and saturation (`S`) separation across four visual layers:

| Layer | Role | Luminance Range (Dungeon) | Luminance Range (Daylight City) | Saturation Cap | Shadow / Outline Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Layer 1: Terrain** | Walkable floors, background walls, water, grass | `8% – 24%` (dark, low-contrast) | `40% – 65%` (muted natural tones) | `≤ 35%` | Subtle mortar/tile seams only; never sharp black outlines |
| **Layer 2: Props & Mechanisms** | Chests, crates, oil barrels, doors, levers, pressure plates, ore veins | `25% – 55%` | `35% – 70%` | `≤ 60%` | Ground contact shadow + subtle top-edge specular highlight |
| **Layer 3: Actors (Heroes & Monsters)** | Player Hero, Party Members, Monsters, Bosses | `45% – 85%` (highest figure-ground contrast) | `30% – 85%` (strong silhouette) | `45% – 75%` | Soft elliptical drop-shadow underneath + rim light facing key light |
| **Layer 4: Telegraphs & VFX** | Skill ranges, enemy threat zones, oil fire, floating combat numbers, crits | `65% – 100%` (luminous / additive) | `65% – 100%` | `75% – 100%` | Crisp emissive glow; never obscured by terrain geometry |

> **Golden Readability Test (Squint / Grayscale Check)**: Converting any dungeon or city screenshot to 100% grayscale must still allow a player to instantly distinguish (1) walkable floor vs. solid wall, (2) interactive chests/levers vs. decorative masonry, and (3) Hero vs. hostile monsters within 0.5 seconds.

---

## 4. Lighting, Shadow & Atmospheric Grammar

1. **Surface Key Light (Overworld & City)**:
   - **Angle**: Top-left directional sunlight (`315°` azimuth, `45°` elevation), casting consistent soft shadows toward the **bottom-right (`135°`)**.
   - **Color Temperature**: Warm golden-hour key (`#fff4d6`) paired with cool sky-blue shadow fill (`#3b5998` at `18%–25%` opacity) so shadows stay rich and never muddy gray.
2. **Subterranean Lighting (Starfall Vaults)**:
   - **Primary Source**: Radial warm torchlight centered on the Hero (subtle flicker amplitude `±3%` radius) combined with static environmental light emitters (wall sconces, magma vents, astral crystal veins).
   - **Fog of War (3 States)**:
     - *Unexplored*: Solid obsidian void (`#05080f`).
     - *Explored (Out of LOS)*: Desaturated, darkened memory tint (`35%` brightness, cool slate overlay) showing static architecture and discovered POIs, hiding live monster positions.
     - *Active Vision (In LOS)*: Full biome color, active torch falloff, animated dust/embers, live entities.
3. **Contact Shadows (Ambient Occlusion)**:
   - Every standing entity, chest, barrel, tree, and building sits on an elliptical soft contact shadow (`rgba(4, 7, 15, 0.55)`) grounding it firmly to the tile plane so nothing ever looks "pasted on."

---

## 5. Material Language Library

Artists, procedural shaders, and AI-assisted concept generation must maintain consistent material response across all assets:

- **Carved Ashlar Stone**: Beveled top edges catching cool/warm specular highlights, recessed dark mortar joints, subtle moss (surface) or mineral flecks (underground).
- **Seasoned Timber**: Visible plank seams, warm mid-brown grain, darker knot accents, iron corner brackets on crates/barrels/doors.
- **Forged Steel & Iron**: High contrast between dark metallic troughs (`#1e293b`) and sharp bright specular edges (`#e2e8f0`); warm orange reflection near torches, cold cyan near starlight.
- **Celestial Gold & Brass**: Rich amber midtones (`#d97706`) with bright cream-gold specular peaks (`#fef08a`) and warm chestnut shadows (`#78350f`). Used sparingly to signal **value, prestige, or interactivity** (chests, relics, guild emblems).
- **Starlight Crystal & Ore**: Faceted geometric silhouettes with internal bright core, colored emissive halo, and subtle twinkling specular star-glints.
- **Cloth, Leather & Cloaks**: Soft matte diffuse shading (no plastic specular sheen), folded drape silhouettes, woven trim borders for heraldic distinction.

---

## 6. Character, Paper-Doll & Cosmetic Economy Standards (Tier 1)

Because **Hero Profiles & Cosmetics** are central to player pride and Aethelgard's fair monetization model, all character art adheres to strict structural rules:

### 6.1 Portrait & Mannequin Framing
- **Hero Portrait (Avatar)**: Chest-up 3/4 view (`512×512` master, rendered cleanly at `64×64` to `256×256`), lit with a dramatic key light + rim light matching their class archetype.
- **Full-Body Paper-Doll Mannequin**: Centered heroic stance (`1024×1024` master), consistent anchor origin (`50% X, 88% Y` feet plane) across all 6 classes so modular armor, weapons, and cosmetics align pixel-accurately.

### 6.2 Paper-Doll Render Layering Order (Back → Front)
To support mix-and-match **6 Functional Equipment Slots** + **4 Prestige Cosmetic Slots** (`SHARED_PAPER_DOLL_SLOTS`) without clipping:
1. `layer_00_aura_back` — Cosmetic Aura / Starlight Halo backdrop
2. `layer_01_cloak_back` — Cosmetic Cloak / Cape flowing behind shoulders
3. `layer_02_base_body` — Class silhouette & base tunic/undersuit
4. `layer_03_boots` — Equipped Boots / Greaves
5. `layer_04_armor` — Equipped Chest Armor (or Cosmetic Armor Transmog override)
6. `layer_05_cloak_collar` — Cloak clasp / shoulder mantle overlapping armor
7. `layer_06_helm` — Equipped Helm / Hood / Crown (or Cosmetic Helm/Aura override)
8. `layer_07_weapon_main` — Equipped Weapon (sword, daggers, staff, bow, mace, greatsword)
9. `layer_08_weapon_vfx` — Cosmetic Weapon Glow / Enchantment particle overlay
10. `layer_09_accessory_badge` — Equipped Ring/Amulet/Pickaxe emblem (displayed in slot frame)

### 6.3 Class Silhouette Signatures
Every class must be recognizable in silhouette even at 32×32 tactical scale:
- **Fighter**: Broad pauldrons, heater shield or greatsword, sturdy plate stance.
- **Thief**: Asymmetric hooded cloak, lean forward crouch, twin curved daggers.
- **Mage**: Tall flowing mantle, luminous crystal-topped staff, floating arcane sigil.
- **Ranger**: Fur-trimmed shoulder cape, recurve longbow, quiver slung across back.
- **Cleric**: Vestment tabard, radiant censer/mace, warm golden halo accent.
- **Paladin**: Crested winged/plumed helm, heavy gilded breastplate, kite shield & radiant blade.

---

## 7. Interactive Objects, Containers & Hazards Grammar (Tier 2)

- **Dungeon Chests (`container_dungeon_chest`)**: Single-tile, **non-stackable, non-carryable** 3D oak-and-gilded-brass chest with riveted bands, prominent keyhole plate, and warm specular lid highlight. Opened state shows hinged lid swung back with empty/dimmed interior.
- **Destructible Props**:
  - *Supply Crate / Wooden Barrel*: Warm banded oak timber, crack overlays when damaged, subtle loot-glint particle if intact.
  - *Volatile Oil Barrel*: Dark tar-stained iron-hooped cask with unmistakable crimson/amber hazard banding and subtle flammable sheen.
  - *Wooden Barricade*: Crossed splintered planks spanning the tile width clearly signaling impassability until smashed.
- **Mechanisms**:
  - *Wall Lever*: Contrasting brass handle on stone mount; distinct left (off/amber) vs. right (on/emerald) throw angle.
  - *Pressure Plate*: Slightly raised carved stone slab with glowing rune seam that depresses flush when weighted.
- **Hazards**:
  - *Oil Slick*: Iridescent dark puddle with specular sheen (ignites into bright orange/yellow roaring flames when triggered).
  - *Slag Vent*: Cracked molten floor grate pulsing orange before venting.
  - *Spore Cloud*: Translucent emerald/chartreuse drifting mist clearly distinct from walkable clear floor.
