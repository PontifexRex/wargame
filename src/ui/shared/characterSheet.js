// Shared Cross-Engine Character Sheet, Anatomical Paper-Doll & Prestige Cosmetic Showcase
// Used natively by BOTH the Turn-Based Dungeon Engine (index.html) and Macro Wargame (wargame.html).

import { RARITY } from '../../constants.js';
import { CLASSES } from '../../data/classes.js';
import { computeHeroDerivedStats, formatAttributeDisplay } from '../../core/heroStats.js';
import { getItemTypeIcon } from '../../data/items.js';
import { getHeroPortraitAssetId, getCachedImage } from './assetRegistry.js';

export const SHARED_PAPER_DOLL_SLOTS = [
  // Row 1: Head & Neck
  { id: 'accessory', label: 'Trinket',  left: '10px',  top: '10px',  width: '84px', height: '64px', active: true },
  { id: 'helm',      label: 'Helm',     left: '128px', top: '10px',  width: '84px', height: '64px', active: true },
  { id: 'amulet',    label: 'Amulet',   right: '10px', top: '10px',  width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

  // Row 2: Torso & Weapons
  { id: 'weapon',    label: 'Weapon',   left: '10px',  top: '86px',  width: '84px', height: '70px', active: true },
  { id: 'armor',     label: 'Armor',    left: '128px', top: '86px',  width: '84px', height: '70px', active: true },
  { id: 'pickaxe',   label: 'Off-Hand', right: '10px', top: '86px',  width: '84px', height: '70px', active: true },

  // Row 3: Hands, Waist, Rings (Reserved for Track A Inc 8.7)
  { id: 'gloves',    label: 'Gloves',   left: '10px',  top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },
  { id: 'belt',      label: 'Belt',     left: '128px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 3 Expansion' },
  { id: 'ring',      label: 'Ring',     right: '10px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

  // Row 4: Feet
  { id: 'boots',     label: 'Boots',    left: '128px', top: '254px', width: '84px', height: '64px', active: true }
];

// Tier 1 Prestige Cosmetic Showcase Slots (Stage E.1 Art Direction — Fair Non-P2W Cosmetic System)
export const COSMETIC_SLOTS = [
  { id: 'cloak',        label: 'Mantle / Cloak',  icon: '🧣' },
  { id: 'aura',         label: 'Astral Aura',     icon: '✨' },
  { id: 'banner_crest', label: 'Heraldic Crest',  icon: '🛡️' },
  { id: 'weapon_glow',  label: 'Weapon Enchant',  icon: '⚔️' }
];

function drawSharedSafeEllipse(ctx, cx, cy, rx, ry) {
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
  }
}

export function normalizeSharedHeroProfile(hero) {
  const h = hero || {};
  const classId = h.classId || 'fighter';
  const cls = CLASSES[classId] || CLASSES.fighter;
  const st = h.stats || {};
  const derived = computeHeroDerivedStats(h);

  const str = formatAttributeDisplay(h.computedStr !== undefined ? h.computedStr : (derived ? derived.attributes.str : (st.str || (cls.baseStats && cls.baseStats.str) || 10)));
  const dex = formatAttributeDisplay(h.computedDex !== undefined ? h.computedDex : (derived ? derived.attributes.dex : (st.dex || (cls.baseStats && cls.baseStats.dex) || 10)));
  const intel = formatAttributeDisplay(h.computedInt !== undefined ? h.computedInt : (derived ? derived.attributes.int : (st.int || (cls.baseStats && cls.baseStats.int) || 10)));
  const vit = formatAttributeDisplay(h.computedVit !== undefined ? h.computedVit : (derived ? derived.attributes.vit : (st.vit || (cls.baseStats && cls.baseStats.vit) || 10)));
  const spi = formatAttributeDisplay(h.computedSpi !== undefined ? h.computedSpi : (derived ? derived.attributes.spi : (st.spi || (cls.baseStats && cls.baseStats.spi) || 10)));

  const eq = h.equipment || {};
  const hasCurrentVitals = typeof h.hp === 'number' && isFinite(h.hp);
  const baseMaxHp = derived ? derived.maxHp : (h.maxHp !== undefined ? h.maxHp : (st.maxHp || st.hp || 140));
  const baseMaxMp = derived ? derived.maxMp : (h.maxMp !== undefined ? h.maxMp : (st.maxMp || st.mp || 60));
  const atk = derived ? derived.atk : (h.atk !== undefined ? h.atk : (st.atk || 22));
  const magicPower = derived ? derived.magicPower : (h.magicPower !== undefined ? h.magicPower : (st.magicPower || 12));
  const def = derived ? derived.def : (h.def !== undefined ? h.def : (st.def || 10));
  const crit = derived ? derived.crit : (h.crit !== undefined ? h.crit : Math.min(60, 8 + Math.floor(dex * 0.6)));
  const dodge = derived ? derived.dodge : (h.dodge !== undefined ? h.dodge : Math.min(45, 5 + Math.floor(dex * 0.5)));

  return {
    id: h.id || 'hero_active',
    name: h.name || cls.name,
    classId: classId,
    className: h.className || cls.name,
    title: h.title || cls.title || 'Guild Vanguard',
    color: h.color || cls.color || '#fbbf24',
    level: h.level || 1,
    xp: h.xp || 0,
    hasCurrentVitals: hasCurrentVitals,
    hp: hasCurrentVitals ? h.hp : null,
    maxHp: baseMaxHp,
    mp: (typeof h.mp === 'number' && isFinite(h.mp)) ? h.mp : null,
    maxMp: baseMaxMp,
    stats: {
      str: str,
      dex: dex,
      int: intel,
      vit: vit,
      spi: spi,
      atk: atk,
      magicPower: magicPower,
      def: def,
      crit: crit,
      dodge: dodge
    },
    equipment: eq,
    cosmetics: h.cosmetics || { cloak: null, aura: null, banner_crest: null, weapon_glow: null },
    bagGear: Array.isArray(h.bagGear) ? h.bagGear : []
  };
}

export function renderSharedPaperDollMannequin(canvas, hero) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const classId = hero ? hero.classId : 'fighter';
  const cls = CLASSES[classId] || CLASSES.fighter;
  const cosmeticAura = hero && hero.cosmetics && hero.cosmetics.aura ? hero.cosmetics.aura.color : null;
  const themeColor = cosmeticAura || cls.color || '#fbbf24';

  ctx.save();

  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  // Radial celestial aura behind chest
  if (typeof ctx.createRadialGradient === 'function') {
    const grad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 120);
    if (grad && typeof grad.addColorStop === 'function') {
      grad.addColorStop(0, themeColor + '22');
      grad.addColorStop(0.6, themeColor + '08');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
    }
  } else {
    ctx.fillStyle = themeColor + '15';
  }
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 120, 0, Math.PI * 2);
  ctx.fill();

  // Stage E.5 Golden Slice: Tier 1 Prestige Realism Portrait Medallion (when production art exists)
  const portraitId = getHeroPortraitAssetId(classId);
  const portraitImg = getCachedImage(portraitId, function() {
    renderSharedPaperDollMannequin(canvas, hero);
  });
  if (portraitImg && typeof ctx.drawImage === 'function') {
    const rad = Math.min(Math.floor(w * 0.34), Math.floor(h * 0.34));
    const py = Math.floor(h * 0.46);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, py, rad, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(portraitImg, cx - rad, py - rad, rad * 2, rad * 2);
    ctx.restore();

    // Brushed Celestial Gold outer medallion bezel
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, py, rad + 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = themeColor + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, py, rad + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // Pedestal / Dais ellipse at feet
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 35, 75, 18);
  ctx.fill();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Runic floor circle rings
  ctx.strokeStyle = '#283347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 35, 60, 14);
  ctx.stroke();

  // Body shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  drawSharedSafeEllipse(ctx, cx, h - 34, 45, 10);
  ctx.fill();

  // Class-specific silhouette cape & back ornaments
  if (classId === 'fighter') {
    ctx.fillStyle = 'rgba(185, 28, 28, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 65, 235);
    ctx.lineTo(cx + 65, 235);
    ctx.lineTo(cx + 36, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'thief') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 72, 235);
    ctx.lineTo(cx - 15, 235);
    ctx.lineTo(cx - 20, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'paladin') {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 65, 235);
    ctx.lineTo(cx + 65, 235);
    ctx.lineTo(cx + 36, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 65, 230, 130, 5);
  } else if (classId === 'ranger') {
    ctx.fillStyle = 'rgba(22, 101, 52, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 100);
    ctx.lineTo(cx - 60, 225);
    ctx.lineTo(cx + 40, 225);
    ctx.lineTo(cx + 30, 100);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'mage') {
    ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 36, 105);
    ctx.lineTo(cx - 56, 265);
    ctx.lineTo(cx + 56, 265);
    ctx.lineTo(cx + 36, 105);
    ctx.closePath();
    ctx.fill();
  }

  // Legs & Boots
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(cx - 24, 185, 18, 90);
  ctx.strokeRect(cx - 24, 185, 18, 90);
  ctx.fillRect(cx + 6, 185, 18, 90);
  ctx.strokeRect(cx + 6, 185, 18, 90);

  // Arms
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 52, 108, 16, 75);
  ctx.strokeRect(cx - 52, 108, 16, 75);
  ctx.fillRect(cx + 36, 108, 16, 75);
  ctx.strokeRect(cx + 36, 108, 16, 75);

  // Torso / Cuirass
  ctx.fillStyle = '#253247';
  ctx.beginPath();
  ctx.moveTo(cx - 38, 100);
  ctx.lineTo(cx + 38, 100);
  ctx.lineTo(cx + 28, 186);
  ctx.lineTo(cx - 28, 186);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = themeColor + '66';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Class chest emblem
  if (classId === 'paladin') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 3, 114, 6, 36);
    ctx.fillRect(cx - 14, 126, 28, 6);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, 132, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head / Helm
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cx, 72, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Class head crest / visor
  if (classId === 'fighter') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 12, 70, 24, 4);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(cx, 26);
    ctx.lineTo(cx + 26, 62);
    ctx.lineTo(cx - 26, 62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
  } else if (classId === 'paladin') {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 38, 16, 0, Math.PI * 2);
    ctx.stroke();
  } else if (classId === 'thief') {
    ctx.fillStyle = '#34d399';
    ctx.fillRect(cx - 10, 68, 6, 3);
    ctx.fillRect(cx + 4, 68, 6, 3);
  } else if (classId === 'ranger') {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(cx - 10, 68, 6, 3);
    ctx.fillRect(cx + 4, 68, 6, 3);
  }

  ctx.restore();
}

export function buildSharedPaperDollGridHtml(hero, options = {}) {
  const eq = (hero && hero.equipment) ? hero.equipment : {};
  const mode = options.mode || 'wargame';
  const heroId = (hero && hero.id) || '';

  return SHARED_PAPER_DOLL_SLOTS.map(function(cfg) {
    const posStyle = 'top:' + cfg.top + ';width:' + cfg.width + ';height:' + cfg.height + ';' +
      (cfg.left ? ('left:' + cfg.left + ';') : ('right:' + cfg.right + ';'));

    if (!cfg.active) {
      const icon = getItemTypeIcon(cfg.id);
      return `
        <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#05080e]/80 backdrop-blur-sm border border-[#1e293b]/60 flex flex-col justify-between items-center text-center opacity-60 cursor-not-allowed select-none"
             style="${posStyle}"
             title="${cfg.label} Slot (${cfg.tier}) — Reserved for Track A Inc 8.7">
          <div class="w-full flex items-center justify-between text-[9px] text-[#475569]">
            <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
            <span>🔒</span>
          </div>
          <div class="text-base opacity-30">${icon}</div>
          <div class="text-[8px] font-mono text-[#475569]">Locked</div>
        </div>
      `;
    }

    const it = eq[cfg.id] || null;
    const typeIcon = getItemTypeIcon(cfg.id);

    if (!it) {
      return `
        <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#080b11]/75 backdrop-blur-sm border border-dashed border-[#283347]/80 flex flex-col justify-between items-center text-center select-none"
             style="${posStyle}">
          <div class="w-full flex items-center justify-between text-[9px] text-[#64748b]">
            <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
          </div>
          <div class="text-base opacity-25">${typeIcon}</div>
          <div class="text-[8px] font-mono text-[#475569]">Empty</div>
        </div>
      `;
    }

    const rInfo = RARITY[it.rarity] || RARITY.common;
    const statTag = it.atk ? ('+' + it.atk + ' ATK') : (it.def ? ('+' + it.def + ' DEF') : (it.maxDurability ? ('Tier ' + (it.tier || 1)) : 'Equipped'));
    const canUnequip = cfg.id !== 'pickaxe';
    const unequipAction = mode === 'wargame'
      ? `window.WargameApp.handleUnequipHeroItem('${heroId}', '${cfg.id}')`
      : `window.Aethelgard.handleInventoryUnequip('${cfg.id}')`;

    return `
      <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#0e1524]/90 backdrop-blur-sm border flex flex-col justify-between text-left select-none shadow-md"
           style="${posStyle}border-color:${rInfo.color}88;"
           title="${it.name} (${rInfo.label})">
        <div class="w-full flex items-center justify-between text-[9px]">
          <span class="uppercase tracking-wider font-semibold text-[#8b949e]">${cfg.label}</span>
          ${canUnequip ? `<button onclick="${unequipAction}" class="text-[#f87171] hover:text-white font-bold text-[10px] leading-none cursor-pointer" title="Unequip">✕</button>` : ''}
        </div>
        <div class="text-[10px] font-bold truncate" style="color:${rInfo.color}">${typeIcon} ${it.name}</div>
        <div class="text-[9px] font-mono text-[#34d399]">${statTag}</div>
      </div>
    `;
  }).join('');
}

export function buildSharedHeroStatsHtml(profile) {
  const s = profile.stats;
  const hpCell = profile.hasCurrentVitals
    ? { label: 'HP', val: profile.hp + '/' + profile.maxHp, color: '#34d399' }
    : { label: 'MAX HP', val: profile.maxHp, color: '#34d399' };
  const mpCell = (profile.hasCurrentVitals && typeof profile.mp === 'number')
    ? { label: 'MP', val: profile.mp + '/' + profile.maxMp, color: '#60a5fa' }
    : { label: 'MAX MP', val: profile.maxMp, color: '#60a5fa' };
  const cells = [
    hpCell,
    mpCell,
    { label: 'ATK', val: s.atk, color: '#fb923c' },
    { label: 'MAG', val: s.magicPower || 0, color: '#c084fc' },
    { label: 'DEF', val: s.def, color: '#38bdf8' },
    { label: 'CRIT', val: s.crit + '%', color: '#facc15' },
    { label: 'DODGE', val: s.dodge + '%', color: '#a78bfa' },
    { label: 'SPI', val: s.spi || 0, color: '#fef08a' },
    { label: 'STR', val: s.str, color: '#f87171' },
    { label: 'DEX', val: s.dex, color: '#34d399' },
    { label: 'INT', val: s.int, color: '#60a5fa' },
    { label: 'VIT', val: s.vit, color: '#fbbf24' }
  ];
  return cells.map(function(c) {
    return `
      <div class="p-1.5 rounded bg-[#080b11] border border-[#283347] text-center">
        <div class="text-[9px] font-mono text-[#8b949e] uppercase">${c.label}</div>
        <div class="text-xs font-mono font-bold" style="color:${c.color}">${c.val}</div>
      </div>
    `;
  }).join('');
}

export function buildSharedCosmeticsPreviewHtml(profile) {
  const cos = profile.cosmetics || {};
  return COSMETIC_SLOTS.map(function(slot) {
    const equipped = cos[slot.id];
    return `
      <div class="p-2 rounded bg-[#080b11] border border-[#fbbf24]/30 flex items-center justify-between text-[10px] font-mono">
        <span class="text-[#8b949e]">${slot.icon} ${slot.label}</span>
        <span class="${equipped ? 'text-[#fbbf24] font-bold' : 'text-[#475569]'}">${equipped ? equipped.name : 'Default'}</span>
      </div>
    `;
  }).join('');
}
