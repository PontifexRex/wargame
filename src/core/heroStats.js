// Shared Authoritative Hero Derived-Stat Calculator (HR-13)
// Used by BOTH the Turn-Based Dungeon Engine and Macro Wargame Engine.
// Preserves fractional internal attribute values during calculation;
// presentation layers display whole numbers via formatAttributeDisplay (Math.floor).

import { CLASSES, HERO_ATTRIBUTE_KEYS, DEFAULT_HERO_SPI, DEFAULT_LEVEL_GROWTH, normalizeHeroClassId } from '../data/classes.js';
import { GEM_CATALOG } from '../data/gems.js';

function roundFrac(val) {
  return Math.round(val * 10000) / 10000;
}

export function getClassLevelGrowth(classId) {
  const normId = normalizeHeroClassId(classId);
  const cls = (normId && CLASSES[normId]) ? CLASSES[normId] : null;
  const src = (cls && cls.levelGrowth && typeof cls.levelGrowth === 'object') ? cls.levelGrowth : DEFAULT_LEVEL_GROWTH;
  return {
    str: typeof src.str === 'number' && isFinite(src.str) ? src.str : DEFAULT_LEVEL_GROWTH.str,
    dex: typeof src.dex === 'number' && isFinite(src.dex) ? src.dex : DEFAULT_LEVEL_GROWTH.dex,
    int: typeof src.int === 'number' && isFinite(src.int) ? src.int : DEFAULT_LEVEL_GROWTH.int,
    vit: typeof src.vit === 'number' && isFinite(src.vit) ? src.vit : DEFAULT_LEVEL_GROWTH.vit,
    spi: typeof src.spi === 'number' && isFinite(src.spi) ? src.spi : DEFAULT_LEVEL_GROWTH.spi
  };
}

export function computeAutoLevelGrowthDelta(classId, levelsGained) {
  const lvls = Math.max(0, Number(levelsGained) || 0);
  const g = getClassLevelGrowth(classId);
  return {
    str: roundFrac(g.str * lvls),
    dex: roundFrac(g.dex * lvls),
    int: roundFrac(g.int * lvls),
    vit: roundFrac(g.vit * lvls),
    spi: roundFrac(g.spi * lvls)
  };
}

export function formatAttributeDisplay(value) {
  const num = Number(value);
  if (!isFinite(num)) return 0;
  return Math.floor(num);
}

export function createDefaultBonusStats() {
  return { str: 0, dex: 0, int: 0, vit: 0, spi: 0 };
}

export function normalizeHeroBonusStats(rawBonus) {
  const out = createDefaultBonusStats();
  if (!rawBonus || typeof rawBonus !== 'object' || Array.isArray(rawBonus)) {
    return out;
  }
  for (let i = 0; i < HERO_ATTRIBUTE_KEYS.length; i++) {
    const k = HERO_ATTRIBUTE_KEYS[i];
    const v = rawBonus[k];
    if (typeof v === 'number' && isFinite(v)) {
      out[k] = v; // Preserve fractional values!
    }
  }
  return out;
}

// Pure, authoritative derived-stat calculation from canonical class baselines, level,
// fractional bonusStats, 6-slot equipment + socketed Astral Gems, talents, active statuses,
// and optional externalModifiers (e.g. future Track F training / civic modifiers).
// Returns null if hero or classId is invalid (no silent Fighter substitution).
export function computeHeroDerivedStats(hero, externalModifiers) {
  if (!hero || typeof hero !== 'object') return null;
  const classId = normalizeHeroClassId(hero.classId);
  const cls = (classId && CLASSES[classId]) ? CLASSES[classId] : null;
  if (!cls) return null;

  const level = (typeof hero.level === 'number' && isFinite(hero.level) && hero.level >= 1) ? hero.level : 1;
  const bonus = normalizeHeroBonusStats(hero.bonusStats);
  const clsBase = cls.baseStats || { str: 10, dex: 10, int: 10, vit: 10, spi: DEFAULT_HERO_SPI };
  const ext = (externalModifiers && typeof externalModifiers === 'object') ? externalModifiers : {};

  const growth = getClassLevelGrowth(classId);
  const autoLvls = level - 1;

  // Fractional internal attribute totals (never floored prior to derived calculations; HR-14.1)
  let str = roundFrac((typeof clsBase.str === 'number' ? clsBase.str : 10) + (autoLvls * growth.str) + bonus.str + (ext.str || 0));
  let dex = roundFrac((typeof clsBase.dex === 'number' ? clsBase.dex : 10) + (autoLvls * growth.dex) + bonus.dex + (ext.dex || 0));
  let intel = roundFrac((typeof clsBase.int === 'number' ? clsBase.int : 10) + (autoLvls * growth.int) + bonus.int + (ext.int || 0));
  let vit = roundFrac((typeof clsBase.vit === 'number' ? clsBase.vit : 10) + (autoLvls * growth.vit) + bonus.vit + (ext.vit || 0));
  let spi = roundFrac((typeof clsBase.spi === 'number' ? clsBase.spi : DEFAULT_HERO_SPI) + (autoLvls * growth.spi) + bonus.spi + (ext.spi || 0));

  let flatAtk = ext.atk || 0;
  let flatDef = ext.def || 0;
  let flatCrit = ext.crit || 0;
  let flatDodge = ext.dodge || 0;
  let flatHp = ext.maxHp || 0;
  let flatMp = ext.maxMp || 0;
  let flatMagic = ext.magicPower || 0;
  let visionBonus = ext.visionBonus || 0;
  let flatThorns = ext.thorns || 0;
  let flatLeech = ext.leech || 0;
  let flatWard = ext.ward || 0;

  // Passive Class Bonuses
  if (classId === 'bruiser') flatHp += 10;
  if (classId === 'thief')   flatCrit += 15;
  if (classId === 'ranger')  flatDodge += 15;
  if (classId === 'paladin') flatDef += 10;
  if (classId === 'acolyte') flatDef += 5;

  // Talent Bonuses
  const t = (hero.talentsAllocated && typeof hero.talentsAllocated === 'object') ? hero.talentsAllocated : {};
  if (t.f_a1) flatHp += t.f_a1 * 12;
  if (t.f_a2) flatAtk += t.f_a2 * 3;
  if (t.t_b1) flatCrit += t.t_b1 * 5;
  if (t.t_b3) flatDodge += t.t_b3 * 10;
  if (t.m_c1) flatMp += t.m_c1 * 15;
  if (t.r_d1) { flatDodge += t.r_d1 * 4; visionBonus += t.r_d1; }
  if (t.p_e1) { flatDef += t.p_e1 * 4; flatHp += t.p_e1 * 8; }
  if (t.p_e2) flatAtk += t.p_e2 * 4;

  // Sum 6-Slot Equipment & Socketed Astral Gems
  const eq = (hero.equipment && typeof hero.equipment === 'object') ? hero.equipment : {};
  const equipSlots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
  for (let si = 0; si < equipSlots.length; si++) {
    const it = eq[equipSlots[si]];
    if (!it) continue;
    if (it.str) str += it.str;
    if (it.dex) dex += it.dex;
    if (it.int) intel += it.int;
    if (it.vit) vit += it.vit;
    if (it.spi) spi += it.spi;
    if (it.atk) flatAtk += it.atk;
    if (it.def) flatDef += it.def;
    if (it.crit) flatCrit += it.crit;
    if (it.dodge) flatDodge += it.dodge;
    if (it.maxHp) flatHp += it.maxHp;
    if (it.maxMp) flatMp += it.maxMp;
    if (it.magicPower) flatMagic += it.magicPower;
    if (it.visionBonus) visionBonus += it.visionBonus;
    if (it.thorns) flatThorns += it.thorns;
    if (it.leech) flatLeech += it.leech;
    if (it.ward) flatWard += it.ward;

    if (Array.isArray(it.sockets)) {
      for (let gIdx = 0; gIdx < it.sockets.length; gIdx++) {
        const gem = GEM_CATALOG[it.sockets[gIdx]];
        if (!gem || !gem.bonuses) continue;
        const gb = gem.bonuses;
        if (gb.str) str += gb.str;
        if (gb.dex) dex += gb.dex;
        if (gb.int) intel += gb.int;
        if (gb.vit) vit += gb.vit;
        if (gb.spi) spi += gb.spi;
        if (gb.atk) flatAtk += gb.atk;
        if (gb.def) flatDef += gb.def;
        if (gb.crit) flatCrit += gb.crit;
        if (gb.dodge) flatDodge += gb.dodge;
        if (gb.maxHp) flatHp += gb.maxHp;
        if (gb.maxMp) flatMp += gb.maxMp;
        if (gb.magicPower) flatMagic += gb.magicPower;
        if (gb.visionBonus) visionBonus += gb.visionBonus;
      }
    }
  }

  // Active Status & Shrine Buffs
  let heroGuarding = false;
  if (Array.isArray(hero.statuses)) {
    for (let i = 0; i < hero.statuses.length; i++) {
      const st = hero.statuses[i];
      if (!st) continue;
      if (st.id === 'shrine_starfire') {
        flatAtk += 6;
        flatCrit += 12;
      } else if (st.id === 'shrine_aegis') {
        flatDef += 6;
        visionBonus += 1;
      } else if (st.id === 'chilled') {
        flatDodge -= 15;
      } else if (st.id === 'slow') {
        flatDodge -= 10;
      } else if (st.id === 'ward_buff') {
        flatWard += 4;
      } else if (st.id === 'sanctuary_ward') {
        flatWard += 4;
        flatDef += 3;
      } else if (st.id === 'battle_cry') {
        flatAtk += 4;
        flatCrit += 10;
      } else if (st.id === 'blessed') {
        flatAtk += 3;
        flatMagic += 3;
        flatDef += 3;
        flatWard += 3;
      } else if (st.id === 'disengaged') {
        flatDodge += 25;
      } else if (st.id === 'disrupted') {
        flatAtk -= 4;
      } else if (st.id === 'guarding') {
        heroGuarding = true;
      }
    }
  }

  // Provisional SPI contributions (justified for divine/spiritual & arcane classes;
  // fractional attributes are preserved until final rounding)
  const spiMpBonus = classId === 'acolyte'
    ? (spi * 1.5)
    : classId === 'paladin'
      ? (spi * 1.0)
      : classId === 'mage'
        ? (spi * 0.5)
        : 0;

  const maxHp = Math.round((cls.hpBase || 100) + (vit * 4) + flatHp);
  const maxMp = Math.round((cls.mpBase || 40) + (intel * 3) + spiMpBonus + flatMp);

  const primaryOffensive = classId === 'mage'
    ? (intel * 1.1 + str * 0.3)
    : (classId === 'ranger' || classId === 'thief' || classId === 'scout')
      ? (dex * 0.9 + str * 0.4)
      : classId === 'acolyte'
        ? (str * 0.65 + spi * 0.55)
        : (str * 0.95 + dex * 0.35);

  const magicBase = (classId === 'acolyte' || classId === 'paladin')
    ? (spi * 1.35 + intel * 0.65)
    : (intel * 1.2 + spi * 0.35);

  const atk = Math.round(primaryOffensive + flatAtk);
  const magicPower = Math.round(magicBase + flatMagic);
  const baseDef = Math.round(vit * 0.45) + flatDef;
  const def = heroGuarding ? Math.round(baseDef * 1.6) : baseDef;
  const crit = Math.min(75, Math.round(5 + (dex * 0.45) + flatCrit));
  const dodge = Math.max(0, Math.min(60, Math.round(4 + (dex * 0.35) + flatDodge)));
  const visionRadius = (cls.vision || 5) + visionBonus;

  return {
    attributes: {
      str: str,
      dex: dex,
      int: intel,
      vit: vit,
      spi: spi
    },
    displayAttributes: {
      str: formatAttributeDisplay(str),
      dex: formatAttributeDisplay(dex),
      int: formatAttributeDisplay(intel),
      vit: formatAttributeDisplay(vit),
      spi: formatAttributeDisplay(spi)
    },
    maxHp: maxHp,
    maxMp: maxMp,
    atk: atk,
    magicPower: magicPower,
    def: def,
    crit: crit,
    dodge: dodge,
    visionRadius: visionRadius,
    thorns: flatThorns,
    leech: flatLeech,
    ward: flatWard
  };
}
