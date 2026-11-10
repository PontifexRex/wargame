Game Systems & Mathematical Specifications

This document defines the exact formulas, class kits, equipment tables, mineral tiers, and Guild Research progressions implemented in Aethelgard: The Starfall Vaults (v0.3.1-inc3).

1. Core Attribute & Derived Stat Formulas

Each hero has four primary attributes: Strength ($\text{STR}$), Dexterity ($\text{DEX}$), Intelligence ($\text{INT}$), and Vitality ($\text{VIT}$).

For a hero at level $L$, each attribute before equipment is:


$$\text{Attr}_{\text{total}} = \text{Attr}_{\text{base}} + 2(L - 1) + \text{Attr}_{\text{bonus}} + \sum \text{Attr}_{\text{gear}}$$

Derived Vitals & Combat Ratings

Maximum Health ($\text{MaxHP}$):


$$\text{MaxHP} = \text{HP}_{\text{class}} + (4 \times \text{VIT}) + \text{HP}_{\text{passive}} + \text{HP}_{\text{talents}} + \sum \text{HP}_{\text{gear}}$$

Maximum Mana ($\text{MaxMP}$):


$$\text{MaxMP} = \text{MP}_{\text{class}} + (3 \times \text{INT}) + \text{MP}_{\text{talents}} + \sum \text{MP}_{\text{gear}}$$

Attack Power ($\text{ATK}$):

Fighter / Paladin: $\text{ATK} = \text{round}(0.95 \times \text{STR} + 0.35 \times \text{DEX}) + \text{ATK}_{\text{talents}} + \sum \text{ATK}_{\text{gear}}$

Thief / Ranger: $\text{ATK} = \text{round}(0.90 \times \text{DEX} + 0.40 \times \text{STR}) + \text{ATK}_{\text{talents}} + \sum \text{ATK}_{\text{gear}}$

Mage: $\text{ATK} = \text{round}(1.10 \times \text{INT} + 0.30 \times \text{STR}) + \text{ATK}_{\text{talents}} + \sum \text{ATK}_{\text{gear}}$

Physical Defense ($\text{DEF}$):


$$\text{DEF} = \text{round}(0.45 \times \text{VIT}) + \text{DEF}_{\text{passive}} + \text{DEF}_{\text{talents}} + \sum \text{DEF}_{\text{gear}}$$

Critical Strike Chance ($\text{CRIT}\%$, capped at $75\%$):


$$\text{CRIT}\% = \min\left(75, \; 5 + \text{round}(0.45 \times \text{DEX}) + \text{CRIT}_{\text{passive}} + \text{CRIT}_{\text{talents}} + \sum \text{CRIT}_{\text{gear}}\right)$$

Dodge Chance ($\text{DODGE}\%$, capped at $60\%$):


$$\text{DODGE}\% = \min\left(60, \; 4 + \text{round}(0.35 \times \text{DEX}) + \text{DODGE}_{\text{passive}} + \text{DODGE}_{\text{talents}} + \sum \text{DODGE}_{\text{gear}}\right)$$

Experience Curve: Level 1 requires $60\text{ XP}$. Each subsequent level scales by:


$$\text{MaxXP}_{L+1} = \text{round}(\text{MaxXP}_L \times 1.4)$$


Each level-up grants $+2\text{ Stat Points}$, $+1\text{ Talent Point}$, and a $100\%$ HP/MP restore.

2. Playable Classes Specification (5 Classes)

Class

Title

Base STR / DEX / INT / VIT

Base HP / MP

Vision

Class Passive

Active Skill [Q]

Fighter

Iron Vanguard

15 / 10 / 8 / 14

120 / 35

5

Unstoppable Stride: $+10\text{ Max HP}$ & $-15\%$ incoming physical damage

Whirlwind Cleave ($10\text{ MP}$): Cleaves all adjacent foes for $150\%$ ATK + 1-turn Stun

Thief

Shadow Strider

9 / 16 / 11 / 10

90 / 45

6

Opportunist: $+15\%\text{ Crit}$ & $+25\%$ Chest Gold

Shadowstep Strike ($12\text{ MP}$): Teleports to open tile adjacent to foe within $3.5$ tiles for $220\%$ Crit damage

Mage

Starweaver Adept

7 / 10 / 17 / 10

82 / 80

6

Arcane Surge: $+2\text{ MP/turn}$ & INT attack scaling

Starfall Nova ($16\text{ MP}$): Hits all foes within $4.2$ tiles for $200\%$ spell damage + 3-turn Burn

Ranger

Deepwood Pathfinder

12 / 15 / 11 / 11

95 / 45

7

Eagle Eye: $7$-tile vision & $+15\%\text{ Dodge}$

Starfall Volley ($14\text{ MP}$): Hits up to $3$ (or $5$) foes within $5.2$ tiles for $180\%$ ATK

Paladin

Dawn Warden

14 / 9 / 12 / 15

125 / 50

5

Aura of Radiance: $+10\text{ DEF}$ & $+1\text{ HP}$ every 3 turns

Holy Smite ($16\text{ MP}$): Strikes adjacent foe for $240\%$ holy damage & heals $15\%\text{ Max HP}$

Class Talent Trees (TALENT_TREES)

Fighter: f_a1 Juggernaut Plating ($+12\text{ HP/rank}$, max 3) • f_a2 Heavy Cleaver ($+3\text{ ATK/rank}$, max 3) • f_a3 Titan Resurgence ($35\%$ chance to counter-attack adjacent attacker for $50\%\text{ ATK}$, max 1).

Thief: t_b1 Lethal Precision ($+5\%\text{ Crit/rank}$, max 3) • t_b2 Mineral Vein Sense ($25\%\text{/rank}$ free mining strike, max 2) • t_b3 Shadow Dance ($+10\%\text{ Dodge}$ & $+6\text{ MP}$ on kill, max 1).

Mage: m_c1 Astral Reservoir ($+15\text{ MP/rank}$, max 3) • m_c2 Arcane Amplification ($+15\%\text{ Nova damage/rank}$, max 3) • m_c3 Supernova Echo (Nova hits a second time for $+50\%$ damage, max 1).

Ranger: r_d1 Pathfinder Agility ($+4\%\text{ Dodge}$ & $+1\text{ Vision/rank}$, max 3) • r_d2 Piercing Shafts (Ignores $30\%\text{ enemy DEF/rank}$, max 2) • r_d3 Rain of Needles (Volley targets up to $5$ foes, max 1).

Paladin: p_e1 Aegis of Dawn ($+4\text{ DEF}$ & $+8\text{ HP/rank}$, max 3) • p_e2 Consecrated Arms ($+4\text{ ATK/rank}$, max 3) • p_e3 Divine Intervention (Once per descent, fatal damage heals to $40\%\text{ Max HP}$, max 1).

3. Equipment & Rarity System

6 Equipment Slots

weapon, armor, helm, boots, accessory, pickaxe

5 Rarity Tiers (RARITY)

Rarity ID

Display Name

Color Hex

Value Multiplier

Rolled Affixes

common

Common

#94a3b8

$1.0\times$

0

uncommon

Uncommon

#4ade80

$1.4\times$

1

rare

Rare

#60a5fa

$2.0\times$

2

epic

Epic

#c084fc

$3.2\times$

3

relic

Star-Forged Relic

#fbbf24

$5.5\times$

4

4. Subterranean Mining & Mineral Catalog (ORE_CATALOG)

When mined, wall ore tiles convert into walkable TILE_FLOOR (1) tiles.

Tile ID

Mineral Key

Name

Base Value

Required Geology Rank

XP Gain

Special Effect

10

copper

Copper Ore

$10\text{g}$

Rank 0

$10\text{ XP}$

Early research & smelting

11

iron

Iron Ore

$20\text{g}$

Rank 1

$18\text{ XP}$

Mid-tier research & tools

12

mithril

Mithril Ore

$42\text{g}$

Rank 2

$35\text{ XP}$

High-tier research

15

geode

Relic Geode

$60\text{g}$

Rank 2

$45\text{ XP}$

$45\%$ chance to drop bonus rare gear

13

starcrystal

Star-Crystal

$90\text{g}$

Rank 3

$70\text{ XP}$

Endgame research & Relic unlocks

14

astralite

Void Astralite

$150\text{g}$

Rank 3

$110\text{ XP}$

Abyssal infinity research

Pickaxe Durability & Free-Strike Probability

Effective Max Durability:


$$\text{Dur}_{\text{max}} = \text{round}\left(\text{Dur}_{\text{base}} \times (1 + 0.50 \times \text{Rank}_{\text{toolsmithing}})\right)$$

Free-Strike Trigger: A mining swing consumes $0$ durability if either Thief's Mineral Vein Sense ($25\% \times \text{Rank}_{t\_b2}$) or Guild Dwarven Toolsmithing ($20\% \times \text{Rank}_{\text{toolsmithing}}$) procs.

5. Dual-Cost Guild Research Trees (RESEARCH_PROJECTS)

Vault Cartography & Shoring (cartography):

Rank 0: Permit Floor 5

Rank 1 ($90\text{g} + 3\text{ Copper}$): Permit Floor 10

Rank 2 ($220\text{g} + 4\text{ Iron} + 4\text{ Copper}$): Permit Floor 20

Rank 3 ($520\text{g} + 5\text{ Mithril} + 2\text{ Star-Crystal}$): Permit Floor 50

Rank 4 ($1200\text{g} + 3\text{ Astralite} + 5\text{ Star-Crystal}$): Permit Floor 999

Subterranean Geology (geology):

Rank 0: Copper • Rank 1 ($70\text{g} + 4\text{ Copper}$): Iron • Rank 2 ($180\text{g} + 5\text{ Iron}$): Mithril & Geodes • Rank 3 ($420\text{g} + 5\text{ Mithril} + 2\text{ Geode}$): Star-Crystal & Void Astralite.

Dwarven Toolsmithing (toolsmithing):

Rank 1 ($60\text{g} + 2\text{ Copper}$): $+50\%$ Dur, $20\%$ Free Strike • Rank 2 ($150\text{g} + 4\text{ Iron}$): $+100\%$ Dur, $40\%$ Free Strike • Rank 3 ($340\text{g} + 4\text{ Mithril}$): $+150\%$ Dur, $60\%$ Free Strike.

Antiquarian Assay & Smelting (assay):

Increases sale value of all ores, relics, and spare armory gear by $+35\%$ per rank:


$$\text{Value}_{\text{sale}} = \text{round}\left(\text{Value}_{\text{base}} \times (1 + 0.35 \times \text{Rank}_{\text{assay}})\right)$$

Quartermaster Requisitions (quartermaster):

Unlocks higher-tier equipment and pickaxes (reqQM: 0..3) in the Quartermaster shop.

Vanguard Recovery Pact (vanguard):

Recovers $20\% \times \text{Rank}_{\text{vanguard}}$ (up to $80\%$ at Rank 4) of unbanked pack value as Vault Gold if defeated in the dungeon.

6. Milestone Boss Encounters

Floor 5 Boss — Starfall Colossus (boss_colossus): $240\text{ HP}$, $20\text{ ATK}$, $10\text{ DEF}$, $260\text{ XP}$. Guaranteed epic equipment drop + $2\times\text{ Star-Crystal}$.

Floor 10 Boss — Void Weaver (boss_weaver): $420\text{ HP}$, $28\text{ ATK}$, $14\text{ DEF}$, Ranged ($4$ tiles), $520\text{ XP}$. Guaranteed relic equipment drop + $2\times\text{ Star-Crystal}$.


---

## 7. Increment 4 Systems — Astral Gems, Lapidary Forge, Bounties, Shrines & Traps

### Astral Gems & Lapidary Socketing (`src/data/gems.js`)
- **Gem Extraction**: Mining Relic Geodes (`28%`), Star-Crystal (`35%`), and Void Astralite (`50%`) yields uncut Astral Gems into the `expeditionPack`, banking into `guildVault.gems` on extraction.
- **Socket Rolling**: Procedural equipment rolls sockets by rarity (`common: 0`, `uncommon: 0–1`, `rare: 1`, `epic: 1–2`, `relic: 2`).
- **5 Gem Types (`GEM_CATALOG`)**:
  - **Crimson Star-Ruby (`ruby`)**: Weapon `+5 ATK` | Armor/Helm/Boots `+22 Max HP` | Accessory/Pickaxe `+4% Crit`
  - **Azure Star-Sapphire (`sapphire`)**: Weapon `+4 ATK, +8 Max MP` | Armor/Helm/Boots `+16 Max MP, +2 DEF` | Accessory/Pickaxe `+15 Max MP`
  - **Verdant Star-Emerald (`emerald`)**: Weapon `+5% Crit` | Armor/Helm/Boots `+4% Dodge` | Accessory/Pickaxe `+4% Dodge, +3% Crit`
  - **Solar Topaz (`topaz`)**: Weapon `+3 ATK, +3 DEF` | Armor/Helm/Boots `+4 DEF` | Accessory/Pickaxe `+12 Max Durability, +1 Vision`
  - **Abyssal Voidstone (`voidstone`)**: Weapon `+8 ATK` | Armor/Helm/Boots `+4 DEF, +18 Max HP` | Accessory/Pickaxe `+5% Crit, +4% Dodge`
- **Unsocketing**: Costs `25g` (`LAPIDARY_UNSOCKET_COST`) at the Lapidary Forge and returns all socketed gems intact to `guildVault.gems`.

### Guild Notice Board Bounties (`src/data/bounties.js`)
- **3 Active Contracts**: Generated deterministically (`slay_monster`, `mine_ore`, `clear_floor`), tracking `progress / target` during descents and awarding Gold, XP, and bonus Minerals/Gems when claimed in the Guild. Refreshing the board costs `25g`.

### Subterranean Shrines & Runic Traps (`src/data/gems.js`)
- **Astral Shrines (`TILE_SHRINE = 16`)**:
  - *Shrine of Starfire*: Grants `Starfire Blessing` (`+25% ATK` for 30 turns).
  - *Shrine of the Deep Aegis*: Grants `Astral Aegis` (`+25% DEF` for 30 turns) and restores `30% Max HP`.
  - *Shrine of the Earthbreaker*: Repairs `+15` Pickaxe Durability and restores `40% Max MP`.
- **Runic Floor Traps (`TILE_TRAP_HIDDEN = 18`, `TILE_TRAP_VISIBLE = 19`)**:
  - Stepping onto a trap triggers `Seismic Spike Trap` (`14% Max HP` physical + `Bleed`) or `Abyssal Miasma Vent` (`10% Max HP` + `Poison`).
  - High Vision/DEX heroes passively spot adjacent hidden traps; interacting with a visible trap (`TILE_TRAP_VISIBLE`) attempts a DEX-based disarm (`15 XP` on success).

---

## 8. Multi-Dungeon Expedition Atlas & Exploration-Scale Maps (`v0.4.5-atlas`)

### 4 Regional Dungeon Profiles (`src/data/dungeons.js`)
1. **Starfall Crater (`starfall_crater`)**: Medium (`84x60`), Balanced Halls & Caverns (`standard`), Difficulty Tier `1`, balanced ore distribution.
2. **Sunken Reliquary (`sunken_reliquary`)**: Large (`128x90`), Ancient Vault Network (`labyrinth`), Difficulty Tier `2`, rich in Mithril, Relic Geodes, and treasure chests.
3. **Pyroclast Fissure (`pyroclast_fissure`)**: Large (`128x90`), Winding Subterranean Caverns (`cavernous`), Difficulty Tier `3`, dense Iron, Mithril, and Star-Crystal seams.
4. **The Abyssal Citadel (`abyssal_citadel`)**: Colossal (`168x120`), Grand Pillared Halls (`cathedral`), Difficulty Tier `4`, endgame Void Astralite & Star-Crystal stronghold.

### Custom Expedition Chartering
- Players can maintain up to **6 concurrent chartered dungeons** (`maxCharteredDungeons = 6`), choosing a Regional Profile, Map Size Tier (`small: 64x44`, `medium: 84x60`, `large: 128x90`, `colossal: 168x120`), Layout Style (`standard`, `cavernous`, `labyrinth`, `cathedral`), Difficulty Tier (`1–5`), and custom Seed Code.

### Expanded Bestiary (`src/data/monsters.js`)
- **12 Monster Archetypes**: Scavenger Imp, Cavern Crawler, Kobold Sapper, Star-Cult Acolyte, Ironclad Automaton, Void Stalker, Sunken Specter, Reliquary Guardian, Magma Hound, Cinder Drake, Abyssal Templar, and Star-Eater Mindflayer across 4 AI behavior patterns (`melee`, `ranged_kite`, `caster_debuff`, `skirmisher`, `tank`).
- **4 Milestone Bosses**: Starfall Colossus (Floor 5), Void Weaver (Floor 10), Magma Behemoth (Floor 15), and Astral Archon (Floor 20+).
