# Aethelgard: The Starfall Vaults — UI/UX Design System (Stage E.2)

- **Status**: Approved Baseline (`Stage E.2 Complete`)
- **Date**: 2026-11-19
- **Builds On**: [`docs/art_direction_brief.md`](art_direction_brief.md) (Stage E.1)
- **Companion Doc**: [`docs/art_bible.md`](art_bible.md) (Color, Material & Lighting Bible)
- **Scope**: Unified UI language across both `wargame.html` (Overworld & City Management) and `index.html` (Tactical Dungeon Roguelike).

---

## 1. UI Chrome Philosophy: Carved Obsidian Slate & Brushed Celestial Gold

Aethelgard's interface acts as a **refined, quiet architectural frame** around vibrant gameplay canvases and Tier 1 Prestige character art:

- **Obsidian Slate Surfaces**: Deep charcoal-navy panels (`#080b11` → `#131a26`) provide high contrast without competing with sunlit cities, fiery forges, or luminous starlight cosmetics.
- **Brushed Celestial Gold Accents**: Fine `1px` gold/brass borders (`#fbbf24` / `rgba(251, 191, 36, 0.35)`) highlight active selections, primary actions, prestige headers, and milestone achievements.
- **Zero Visual Clutter**: Show primary actions immediately; place deep stats, crafting recipes, and lore into structured tabs or progressive-disclosure tooltips.
- **Strict Custom Modal Policy (Golden Rule #7)**: Never use `window.alert()`, `window.confirm()`, or `window.prompt()`. Every confirmation, outcome summary, inspection, and facility screen uses styled in-game modals.

---

## 2. Design Tokens

All new UI modules and Tailwind utility classes must align with these canonical tokens (ready for direct CSS custom property adoption in Stage E.5):

### 2.1 Surface & Border Tokens

| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--surface-void` | `#05080f` | Deepest backdrop behind canvases and modal overlays |
| `--surface-base` | `#080b11` | Primary application shell & header/footer bars |
| `--surface-panel` | `#0f1520` | Sidebar cards, modal containers, HUD boxes |
| `--surface-elevated` | `#161e2e` | Interactive cards, hover states, active tabs |
| `--surface-inset` | `#0a0f18` | Stat wells, inventory slots, log/chronicle feeds, inputs |
| `--border-subtle` | `#1e293b` | Default `1px` divider between panels and slots |
| `--border-interactive` | `#334155` | Hoverable cards, secondary buttons, input borders |
| `--border-gold` | `rgba(251, 191, 36, 0.45)` | Active selections, prestige modals, guild headers |
| `--border-sky` | `rgba(56, 189, 248, 0.45)` | Tactical / Overworld / Astral focus states |

### 2.2 Text & Hierarchy Tokens

| Token Name | Hex | Contrast on `#0f1520` | Usage |
| :--- | :--- | :--- | :--- |
| `--text-primary` | `#e6edf3` | `15.2:1` (AAA) | Headings, item names, primary body copy |
| `--text-secondary` | `#94a3b8` | `6.4:1` (AA) | Descriptions, sub-labels, metadata |
| `--text-muted` | `#64748b` | `3.8:1` | Disabled labels, timestamps, subtle hints |
| `--text-gold` | `#fbbf24` | `10.8:1` (AAA) | Titles, currency values, prestige highlights |
| `--text-sky` | `#38bdf8` | `9.2:1` (AAA) | Astral actions, Overworld links, MP / Recall |

### 2.3 Semantic Status & Resource Tokens

| Domain | Token | Hex | Pairing / Icon Cue |
| :--- | :--- | :--- | :--- |
| **Gold / Currency** | `--res-gold` | `#fbbf24` | Coin icon `🪙` |
| **Wood / Timber** | `--res-wood` | `#d97706` | Timber icon `🪵` |
| **Stone / Masonry** | `--res-stone` | `#94a3b8` | Stone icon `🪨` |
| **Food / Harvest** | `--res-food` | `#4ade80` | Grain icon `🌾` |
| **Water / Wells** | `--res-water` | `#38bdf8` | Droplet icon `💧` |
| **Ore / Minerals** | `--res-ore` | `#f59e0b` | Crystal/Ore icon `⛏️` |
| **Health (HP)** | `--stat-hp` | `#ef4444` (fill) / `#f87171` (text) | Heart/Cross icon; shifts to pulsing crimson `< 25%` |
| **Mana (MP)** | `--stat-mp` | `#3b82f6` (fill) / `#60a5fa` (text) | Spark/Droplet icon |
| **Experience (XP)** | `--stat-xp` | `#a855f7` (fill) / `#c084fc` (text) | Star icon |
| **Success / Positive** | `--state-success` | `#34d399` | Checkmark / upward arrow |
| **Warning / Caution** | `--state-warning` | `#fbbf24` | Alert triangle |
| **Danger / Destructive** | `--state-danger` | `#f87171` | Skull / shield-break / crimson border |

### 2.4 Equipment Rarity Tokens (Exact Engine Parity)

Matches [`RARITY`](../src/constants.js) across both Character Sheet, Inventory, Crafting, and Loot Tooltips:

| Rarity ID | Label | Accent Hex | Slot Background Tint | Visual Treatment |
| :--- | :--- | :--- | :--- | :--- |
| `common` | Common | `#94a3b8` | `rgba(148, 163, 184, 0.08)` | Clean `1px` slate border |
| `uncommon` | Uncommon | `#4ade80` | `rgba(74, 222, 128, 0.10)` | Crisp emerald border |
| `rare` | Rare | `#60a5fa` | `rgba(96, 165, 250, 0.12)` | Cobalt border + subtle inner sheen |
| `epic` | Epic | `#c084fc` | `rgba(192, 132, 252, 0.14)` | Violet border + soft outer glow |
| `relic` | Star-Forged Relic | `#fbbf24` | `rgba(251, 191, 36, 0.16)` | Gold border + animated shimmer edge |

---

## 3. Typography System

| Role | Font Stack | Size / Line-Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Title** | `'Cinzel', Georgia, serif` | `20px–28px` / `1.2` | `700` | Campaign Start, Modal Headers, Guild & City Names |
| **Section Heading** | `'Cinzel', Georgia, serif` | `13px–16px` / `1.3` | `700` | Panel titles, Building names, Milestone Boss banners |
| **UI Body / Copy** | `'Inter', system-ui, sans-serif` | `12px–14px` / `1.45` | `400–600` | Descriptions, quest text, tooltips, Chronicle entries |
| **Micro Label / Badge** | `'Inter', system-ui, sans-serif` | `10px–11px` / `1.2` | `700` (`uppercase`, `tracking-wider`) | Slot headers, status pills, tab labels |
| **Tabular Data / Mono** | `'JetBrains Mono', ui-monospace, monospace` | `11px–13px` / `1.3` | `500–700` (`tabular-nums`) | Resource counts, HP/MP/ATK/DEF, timers, `(x, y)` coordinates |

> **Numeric Stability Rule**: Every live-updating counter (stockpiles, build countdowns, march ETAs, HP/MP bars) must use `font-variant-numeric: tabular-nums` (or monospace) so digits never jitter horizontally as values tick.

---

## 4. Layout Grid & Spatial Ergonomics

### 4.1 Spacing Scale
Strict **4px base rhythm**: `4px` (`gap-1`), `8px` (`gap-2`), `12px` (`gap-3`), `16px` (`gap-4`), `24px` (`gap-6`).

### 4.2 Primary Shell Architecture (Both Views)
- **Top Header Bar (`48px–56px` fixed height)**:
  - Left: Brand Crest + Active Location / City Name + Mode Switcher (Overworld ↔ City ↔ Dungeon).
  - Center: Compact Resource Strip (Gold, Wood, Stone, Food, Water, Ore, Pop) or Dungeon Depth/Biome Badge.
  - Right: Utility Actions (Character Sheet, Save/Sync, Audio Toggle, Verify/Dev Tools).
- **Main Workspace (Fluid 3-Zone Layout)**:
  - **Left Command Sidebar (`260px–300px`)**: Selected Unit / Hero status, immediate tactical or marching actions, active queues.
  - **Center Tactical / Strategic Canvas (Flexible `1fr`)**: Unobstructed viewport for the Overworld map, 8×8 City grid, or 21×15 Dungeon viewport.
  - **Right Intel & Chronicle Sidebar (`280px–320px`)**: Active Tasks/Quests, City Vault/Pack quick-view, scrollable Chronicle / Event Feed.

### 4.3 Modal Sizing Tiers (Desktop Popups ↔ Mobile Bottom Sheets)
| Modal Tier | Desktop Max Width | Mobile Behavior (`< 768px`) | Backdrop | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Compact** | `440px` | Centered card or compact bottom sheet | `rgba(5, 8, 15, 0.78)` + `blur(4px)` | Extraction/Defeat Outcome, Confirmations, Inspect Tile |
| **Standard** | `680px–780px` | Full-width **Bottom Sheet Drawer** (`max-h-[85vh]`, drag/tap-out close) | `rgba(5, 8, 15, 0.82)` + `blur(6px)` | Sub-action popups (Forge Blueprints, Tempering, Recruit Confirm, Save Sync) |
| **Prestige Showcase** | `960px–1080px` | Full-Screen stacked view with Back bar | `rgba(5, 8, 15, 0.88)` + `blur(8px)` | Shared Character Sheet & Paper-Doll, Cosmetic Wardrobe |

### 4.4 Cross-Platform Navigation Taxonomy (Full Screens vs. Popups & Mobile-First UX)
Because Aethelgard is a **cross-platform game with Mobile as a first-class target**, every view is strictly classified to prevent screen clutter and awkward nested modals:

| Surface Type | Role & Navigation Behavior | Examples | Mobile-First Ergonomics |
| :--- | :--- | :--- | :--- |
| **Full Screen** | Primary gameplay destination with a clear top Back/Breadcrumb bar and uncluttered viewport. Never opens as a tiny popup. | Overworld Map, City View, Dungeon Tactical View, **Enterable Building Interior Scenes** (all Guilds, Smithy, Smeltery, Apothecary, Garrison, Temple), Character Profile & Wardrobe | Full-bleed viewport (`100dvh`), bottom thumb-zone nav bar (`≥ 44×44px` touch targets), collapsible HUD drawers |
| **Contextual Popup / Bottom Sheet** | Focused single-purpose interaction triggered *from* a Full Screen (or by tapping an in-scene hotspot). Always dismissible in 1 tap. | Forge Weapon Picker, Tempering Anvil, Gem Socketing Bench, Hero Recruit Confirmation, Quest Contract Detail, Extraction Outcome | Slides up as a **Bottom Sheet** on mobile (`< 768px`) or compact centered modal on desktop |
| **Minimal Persistent HUD** | Glanceable resources & primary mode switcher; hides secondary stats/logs behind drawers on smaller screens. | Top compact resource strip, collapsible Tasks/Chronicle drawer, Dungeon quick-action bar | Never obscures `> 20%` of the playable canvas or interior scene |

---

## 5. Core Component Specifications

### 5.1 Buttons
Every interactive button has explicit `default`, `hover`, `active`, `focus-visible`, and `disabled` states:
- **Primary Gold (`btn-primary`)**: `#fbbf24` fill, `#080b11` bold text. Reserved for **one primary CTA per card/modal** (e.g., *Enter Dungeon*, *Forge Item*, *Recruit Hero*).
- **Astral / Navigation (`btn-sky`)**: `#38bdf8` fill, `#080b11` bold text. Used for Overworld movement, Recall/Surface return, and Map transitions.
- **Secondary Slate (`btn-secondary`)**: `#161e2e` fill, `#e6edf3` text, `1px solid #334155`. Used for auxiliary actions (*Inspect*, *Auto-Equip*, *Dump Bag*).
- **Danger / Destructive (`btn-danger`)**: `rgba(127, 29, 29, 0.45)` fill, `#f87171` text, `1px solid rgba(248, 113, 113, 0.5)`. Used for *Dismiss Hero*, *Demolish Building*, *Cancel Queue*.
- **Disabled / Locked**: `opacity: 0.45`, `cursor: not-allowed`, paired with an explicit inline reason (e.g., *"Requires Meeting Hall Lv 2"* or *"Need 25g, 5 Ore"*).

### 5.2 Guild & City Facility Interior Stage Anatomy (Immersive On-Scene Actions)
All enterable City buildings and Guilds use a **Full-Bleed Interactive Interior Stage** (`min-h-[460px]` to `min-h-[560px]`):
1. **Full-Bleed Tier 1 Interior Backdrop**: The building's atmospheric interior illustration (see [`docs/art_bible.md` §2.4](art_bible.md#24-guild--city-building-interior-artwork-tier-1-banner-illustrations)) fills the entire stage (`object-cover`) with a balanced vertical vignette scrim (`from-[#080b11]/60 via-[#080b11]/25 to-[#080b11]/90`) that keeps the central architectural focal point (hearth, anvil, altar, quest board) open and unobstructed.
2. **Floating Scene Header Overlay**: Translucent frosted-obsidian title badge (`bg-[#080b11]/70 backdrop-blur-md border border-[#fbbf24]/40`) and navigation/close actions anchored at the top edge of the scene.
3. **On-Scene Interactive Action Controls (Two-Phase Evolution)**:
   - *Phase 1 (Feature Build-Out)*: Minimal frosted-obsidian glass controls (`bg-[#080b11]/75 backdrop-blur-md`) overlaid cleanly over the interior artwork while building mechanics are still being finalized.
   - *Phase 2 (Post-Feature-Freeze Diegetic Scene Hotspots)*: Once all building features are locked, replace on-screen button grids with **clickable/tappable architectural hotspots** directly on the interior artwork (e.g., tap the **Forge** in the Smithy → Forging popup; tap the **Anvil** → Tempering popup; tap the **Quest Board** → Guild Contracts; tap the **Oath Table** → Hero Recruitment), keeping the interior artwork uncluttered and effortlessly playable on mobile touchscreens.

### 5.3 Shared Character Sheet & Paper-Doll Layout
Consistent across both `wargame.html` and `index.html`:
- **Left Column (`42%` width — Tier 1 Prestige Stage)**:
  - Hero Name, Class & Level Badge, Leader Crown toggle, HP/MP/XP bars.
  - Central Full-Body Paper-Doll Mannequin flanked by **6 Functional Equipment Slots** (`Weapon`, `Armor`, `Helm`, `Boots`, `Accessory`, `Pickaxe`) and a dedicated **4-Slot Cosmetic Strip** (`Cloak`, `Helm/Aura`, `Armor Transmog`, `Weapon Glow`).
  - Bottom action bar: **Auto-Equip Best**, **Dump Bag to City Vault** (when in city).
- **Right Column (`58%` width — Tabbed Management)**:
  - **Stats & Talents Tab**: Core attributes (`ATK`, `DEF`, `CRIT`, `EVA`, `Speed`) + derived bonuses.
  - **Hero Bag Tab**: Expedition gear & trade items with instant *Equip*, *Deposit to City Vault*, and comparison deltas (`+4 ATK`, `-2 DEF`).
  - **City Vault Tab** (when in city): 200+ slot shared storage with category filters (`All`, `Gear`, `Ore`, `Gems`, `Consumables`) and *Withdraw* / *Equip* actions.
  - **Cosmetics Tab**: Previewable Prestige cosmetic wardrobe.

### 5.4 Status Pills & Progress Bars
- **Status Pills**: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase` with matching tinted background and `1px` border (e.g., `IDLE` emerald, `MARCHING` sky, `IN DUNGEON` crimson, `TRAINING` amber).
- **Progress Bars**: `6px–10px` rounded tracks on `#0a0f18` inset background with smooth CSS width transition (`transition: width 150ms ease-out`) and right-aligned tabular numeric readout (`74 / 100` or `00:42`).

### 5.5 Chronicle & Event Feed
- Reverse-chronological (newest on top) or auto-scrolling log with **category filter chips** (`All`, `Combat`, `Loot`, `City`, `System`).
- Left `2px` color accent bar per entry (`gold` for loot/milestones, `good` emerald for gains, `bad` crimson for damage/alerts, `sys` sky for system/navigation) so players can scan history visually without reading every word.

---

## 6. Interaction, Feedback & Accessibility Standards

1. **Zero-Wasted-Action Feedback**:
   - Invalid clicks (insufficient resources, out-of-range skills, locked prerequisites) never fail silently: display concise inline reason text or floating feedback without consuming MP/turns.
2. **Colorblind-Safe Redundancy**:
   - Never rely on color alone to convey state. Always pair color with an icon, border pattern, or label (e.g., rarity names + color; affordability checkmarks/crosses + green/red; hostile diamond markers vs. friendly shield markers).
3. **Keyboard & Focus Ergonomics**:
   - `ESC` closes the topmost open modal cleanly.
   - All interactive buttons and slots maintain a clear `2px solid #fbbf24` `focus-visible` outline.
   - Dungeon controls retain crisp single-key bindings (`WASD`/Arrows, `1–3` skills, `R` Recall, `I` Character Sheet, `G` Interact/Pickup) with visible keycap badges (`[R]`, `[I]`) on HUD buttons.
4. **Reduced Motion Respect**:
   - Non-essential decorative animations (shimmer, torch flicker, ambient float) respect `@media (prefers-reduced-motion: reduce)`.
