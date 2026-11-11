// 2D Frustum-Culled Camera Renderer, Bresenham Torchlight FOV, Minimap / Cartographer's Map & Floating Text

import {
  TILE_SIZE,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  TILE_WALL,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN,
  TILE_CHEST,
  TILE_CHEST_OPEN,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED,
  RARITY
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG } from '../data/ores.js';
import { getItemTypeIcon } from '../data/items.js';
import { SHRINE_CATALOG, TRAP_CATALOG } from '../data/gems.js';
import { BIOME_PALETTES, resolveFloorBiome } from '../data/dungeons.js';
import { gameState, ensureDungeonFloorHydrated } from '../engine/state.js';
import { detectNearbyTraps } from '../engine/actions.js';
import { hasLineOfSight, getAutoWalkPath, getSkillTargetingInfo } from '../engine/combat.js';

export { hasLineOfSight };

const floatingTexts = [];
let hoverTile = null;
let visibleCoordMap = {};
let skillHoverActive = false;
const combatAnimations = [];
let heroLungeOffset = { x: 0, y: 0, ticks: 0 };

export function setSkillHover(active) {
  skillHoverActive = !!active;
}

export function getSkillHover() {
  return skillHoverActive;
}

export function triggerCombatAnimation(gx, gy, type = 'slash', color = '#f87171') {
  combatAnimations.push({
    gx: gx,
    gy: gy,
    type: type,
    color: color,
    ticks: 14,
    maxTicks: 14
  });
}

export function triggerHeroLunge(dx, dy) {
  heroLungeOffset = { x: (dx || 0) * 8, y: (dy || 0) * 8, ticks: 6 };
}

export function setHoverTile(tile) {
  hoverTile = tile;
}

export function getHoverTile() {
  return hoverTile;
}

export function getCameraOrigin(floor, hx, hy) {
  const fw = (floor && floor.width) || (floor && floor.tiles && floor.tiles[0] ? floor.tiles[0].length : VIEWPORT_WIDTH);
  const fh = (floor && floor.height) || (floor && floor.tiles ? floor.tiles.length : VIEWPORT_HEIGHT);
  const maxCamX = Math.max(0, fw - VIEWPORT_WIDTH);
  const maxCamY = Math.max(0, fh - VIEWPORT_HEIGHT);
  const camX = Math.max(0, Math.min(maxCamX, Math.round(hx) - Math.floor(VIEWPORT_WIDTH / 2)));
  const camY = Math.max(0, Math.min(maxCamY, Math.round(hy) - Math.floor(VIEWPORT_HEIGHT / 2)));
  return { camX, camY, fw, fh };
}

export function spawnFloatingText(gx, gy, text, color = '#fff') {
  floatingTexts.push({
    gx,
    gy,
    riseOffset: 0,
    text,
    color,
    ticks: 28
  });
}

export function updateFOV(state = gameState) {
  visibleCoordMap = {};
  if (!state || state.inGuild || !state.hero) return;
  const floor = ensureDungeonFloorHydrated(state.dungeon, state.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const hx = state.hero.x;
  const hy = state.hero.y;
  const radius = state.hero.visionRadius || 5;

  const minY = Math.max(0, Math.floor(hy - radius - 1));
  const maxY = Math.min(fh - 1, Math.ceil(hy + radius + 1));
  const minX = Math.max(0, Math.floor(hx - radius - 1));
  const maxX = Math.min(fw - 1, Math.ceil(hx + radius + 1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (Math.hypot(x - hx, y - hy) <= radius + 0.35 && hasLineOfSight(floor, hx, hy, x, y)) {
        floor.explored[y][x] = 1;
        visibleCoordMap[`${x},${y}`] = true;
      }
    }
  }

  detectNearbyTraps(floor, state);

  if (state === gameState && typeof document !== 'undefined') {
    renderMinimapCanvas('minimapCanvas');
    const fullModal = document.getElementById('fullMapModal');
    if (fullModal && !fullModal.classList.contains('hidden')) {
      renderMinimapCanvas('fullMapCanvas');
    }
  }
}

function isTileVisibleNow(floor, hx, hy, vision, x, y) {
  if (visibleCoordMap[`${x},${y}`]) return true;
  if (Math.abs(x - hx) > vision + 1 || Math.abs(y - hy) > vision + 1) return false;
  return Math.hypot(x - hx, y - hy) <= vision + 0.35 && hasLineOfSight(floor, hx, hy, x, y);
}

export function drawSafeEllipse(ctx, ex, ey, rx, ry) {
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  } else {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(1, rx > 0 ? ry / rx : 1);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.restore();
  }
}

export function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return '255, 255, 255';
  var c = hex.slice(1);
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  var num = parseInt(c, 16);
  if (isNaN(num)) return '255, 255, 255';
  return ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255);
}

export function drawHeroSprite(ctx, px, py, classId, size = TILE_SIZE) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(px, py);
  const scale = size / 32;
  ctx.scale(scale, scale);

  // Ground drop shadow common to all hero classes
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  drawSafeEllipse(ctx, 16, 29, 9, 3);
  ctx.fill();

  if (classId === 'fighter') {
    // 1. FIGHTER: Ironclad Vanguard with Crimson Cape, Horned Helm, Heater Shield & Broadsword
    // Flowing crimson cape behind
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(9, 13);
    ctx.lineTo(5, 28);
    ctx.lineTo(27, 28);
    ctx.lineTo(23, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(11, 13);
    ctx.lineTo(8, 27);
    ctx.lineTo(15, 27);
    ctx.lineTo(13, 13);
    ctx.closePath();
    ctx.fill();

    // Greaves & Sabatons
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 23, 4, 6);
    ctx.fillRect(18, 23, 4, 6);
    ctx.fillStyle = '#475569';
    ctx.fillRect(9, 27, 5, 2.5);
    ctx.fillRect(18, 27, 5, 2.5);

    // Steel Cuirass (Torso)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(10, 13);
    ctx.lineTo(22, 13);
    ctx.lineTo(20, 23);
    ctx.lineTo(12, 23);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(16, 22);
    ctx.stroke();

    // Gold belt & buckle
    ctx.fillStyle = '#b45309';
    ctx.fillRect(12, 21, 8, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(14, 20.5, 4, 3);

    // Steel Pauldrons
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(9, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(23, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Horned Greathelm
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 11, 4, 3);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(16, 8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(11.5, 6, 9, 6.5);

    // Iron horns
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.lineTo(6, 1.5);
    ctx.lineTo(9.5, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 6);
    ctx.lineTo(26, 1.5);
    ctx.lineTo(22.5, 7.5);
    ctx.closePath();
    ctx.fill();

    // Glowing amber visor slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(13, 8, 6, 2.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(14, 8.5, 4, 1.5);

    // Left Arm: Iron Heater Shield
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(3.5, 12);
    ctx.lineTo(10.5, 12);
    ctx.lineTo(9.5, 21);
    ctx.lineTo(7, 24.5);
    ctx.lineTo(4.5, 21);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(6, 15, 2, 4);

    // Right Arm: Steel Broadsword
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(23, 15, 6, 1.5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(25, 16.5, 2, 2.5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(25, 19, 2, 1.5);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(25, 15);
    ctx.lineTo(25, 2);
    ctx.lineTo(26, 0.5);
    ctx.lineTo(27, 2);
    ctx.lineTo(27, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(25.7, 3, 0.6, 11);

  } else if (classId === 'thief') {
    // 2. THIEF: Shadowblade with Midnight Shroud Cowl, Emerald Eyes & Dual Daggers
    // Midnight shadow shroud cape
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(11, 13);
    ctx.lineTo(5, 27);
    ctx.lineTo(8, 25.5);
    ctx.lineTo(12, 28);
    ctx.lineTo(17, 25.5);
    ctx.lineTo(22, 27);
    ctx.lineTo(21, 13);
    ctx.closePath();
    ctx.fill();

    // Dark trousers & silent boots
    ctx.fillStyle = '#111827';
    ctx.fillRect(11, 22, 3.5, 6);
    ctx.fillRect(17.5, 22, 3.5, 6);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(10, 26, 4.5, 3.5);
    ctx.fillRect(17.5, 26, 4.5, 3.5);

    // Studded Leather Doublet
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(11, 13);
    ctx.lineTo(21, 13);
    ctx.lineTo(19, 22);
    ctx.lineTo(13, 22);
    ctx.closePath();
    ctx.fill();

    // Emerald harness straps & rivets
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 13);
    ctx.lineTo(18, 22);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.fillRect(13, 15, 1.5, 1.5);
    ctx.fillRect(17, 18, 1.5, 1.5);

    // Leather belt with green poison vial pouch
    ctx.fillStyle = '#374151';
    ctx.fillRect(12, 20, 8, 2);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(18.5, 20, 2.5, 3);

    // Rogue Cowl & Mask
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(16, 8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, 4);
    ctx.lineTo(16, 1.5);
    ctx.lineTo(19, 4);
    ctx.fill();

    // Face shadow cavity & mask
    ctx.fillStyle = '#020617';
    ctx.fillRect(13, 6, 6, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(13, 9, 6, 2.5);

    // Piercing glowing emerald rogue eyes
    ctx.fillStyle = '#34d399';
    ctx.fillRect(13.8, 7.2, 1.6, 1.3);
    ctx.fillRect(16.6, 7.2, 1.6, 1.3);

    // Left Hand: Reverse-grip poison stiletto
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(7, 14, 4, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(7.5, 17);
    ctx.lineTo(5, 26);
    ctx.lineTo(8.5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.fillRect(4.5, 26, 2, 2);

    // Right Hand: Forward-grip curved dagger
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(21, 14, 4, 3);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(24.5, 15, 3, 1.5);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(25.5, 15);
    ctx.lineTo(28.5, 6.5);
    ctx.lineTo(27, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(27.8, 8, 1.2, 1.2);

  } else if (classId === 'mage') {
    // 3. MAGE: Astral Elementalist with Cobalt Robes, Wizard Hat, Spell-Flame & Starlit Staff
    // Flowing Astral Cobalt Robes
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(11, 12);
    ctx.lineTo(6.5, 28);
    ctx.lineTo(25.5, 28);
    ctx.lineTo(21, 12);
    ctx.closePath();
    ctx.fill();

    // Mystical stole / central tabard
    ctx.fillStyle = '#312e81';
    ctx.fillRect(13, 13, 6, 15);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(8, 26.5, 16, 1.5);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(12, 18, 8, 2);

    // Wizard Cowl & Pointed Hat
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.arc(16, 9, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(11.5, 6);
    ctx.lineTo(13, 0.5);
    ctx.lineTo(20.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(12.5, 5, 7, 1.5);

    // Shadow face cavity & glowing sapphire eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(13, 7, 6, 4.5);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(13.8, 8.2, 1.6, 1.4);
    ctx.fillRect(16.6, 8.2, 1.6, 1.4);

    // Left Hand: Channeling active azure spell-flame
    ctx.fillStyle = '#312e81';
    ctx.fillRect(6, 14, 5, 5);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(6, 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(6, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5.5, 11.5, 1.5, 1.5);

    // Right Hand: Arcane Gnarled Rowan Staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(25, 4, 2, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(24, 3, 4, 2);
    // Floating Diamond Star Crystal Prism
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(26, -0.5);
    ctx.lineTo(28.5, 2.5);
    ctx.lineTo(26, 5.5);
    ctx.lineTo(23.5, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(25.5, 1.5, 1.2, 1.2);

  } else if (classId === 'ranger') {
    // 4. RANGER: Hawkeye Scout with Woodland Camo Cloak, Quiver, Recurve Bow & Arrow
    // Woodland camo cloak draped on left
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(10, 13);
    ctx.lineTo(5.5, 27);
    ctx.lineTo(13, 27);
    ctx.lineTo(13, 14);
    ctx.closePath();
    ctx.fill();

    // Diagonal leather quiver over shoulder with arrow fletchings
    ctx.fillStyle = '#78350f';
    ctx.fillRect(20, 8.5, 3.5, 11);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(20.5, 5.5, 1.2, 3.5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(22.5, 4.5, 1.2, 4.5);

    // Hunter leggings & boots
    ctx.fillStyle = '#27272a';
    ctx.fillRect(11, 22, 3.5, 6);
    ctx.fillRect(17.5, 22, 3.5, 6);
    ctx.fillStyle = '#523d29';
    ctx.fillRect(10, 26, 4.5, 3.5);
    ctx.fillRect(17.5, 26, 4.5, 3.5);

    // Boiled Leather Tunic & Leaf Green Trim
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(11, 13);
    ctx.lineTo(21, 13);
    ctx.lineTo(19, 22);
    ctx.lineTo(13, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.fillRect(14, 13, 4, 8);
    // Belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(12, 20, 8, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(15, 19.5, 2, 3);

    // Archer's Peaked Cowl & Hawk Eyes
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(16, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, 4);
    ctx.lineTo(16, 1.5);
    ctx.lineTo(19, 4);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(18.5, 2, 1.5, 4);

    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(13, 6.5, 6, 4);
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(13.8, 7.5, 1.5, 1.2);
    ctx.fillRect(16.7, 7.5, 1.5, 1.2);

    // Left Hand: Curved Recurve Bow
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(6, 16, 9.5, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(5, 7);
    ctx.lineTo(5, 25);
    ctx.stroke();

    // Right Hand: Notched Arrow
    ctx.fillStyle = '#523d29';
    ctx.fillRect(19, 14, 4, 3);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(9, 15.5, 12, 1);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(9, 14.5);
    ctx.lineTo(6, 16);
    ctx.lineTo(9, 17.5);
    ctx.closePath();
    ctx.fill();

  } else {
    // 5. PALADIN: Radiant Crusader with Winged Helm, Sun Tabard, Sun Halo & Warhammer
    // Radiant Sunburst Halo above head
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(16, 4, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(15.5, -2, 1, 2);
    ctx.fillRect(15.5, 10, 1, 2);
    ctx.fillRect(8.5, 3.5, 2, 1);
    ctx.fillRect(21.5, 3.5, 2, 1);

    // Flowing White & Gold Crusader Cape
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(9, 13);
    ctx.lineTo(5.5, 28);
    ctx.lineTo(26.5, 28);
    ctx.lineTo(23, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(5.5, 26, 21, 2);

    // Greaves & Torso Plate
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(10, 23, 4, 6);
    ctx.fillRect(18, 23, 4, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(10, 13);
    ctx.lineTo(22, 13);
    ctx.lineTo(20, 23);
    ctx.lineTo(12, 23);
    ctx.closePath();
    ctx.fill();

    // White Tabard with Golden Sun Cross
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(13, 13, 6, 10.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(15, 14, 2, 8);
    ctx.fillRect(13.5, 16, 5, 2);

    // Golden Pauldrons
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(9, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(23, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Winged Greathelm
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(16, 8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(11, 7);
    ctx.lineTo(7, 2);
    ctx.lineTo(11, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(21, 7);
    ctx.lineTo(25, 2);
    ctx.lineTo(21, 4.5);
    ctx.closePath();
    ctx.fill();
    // Visor cross
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 7.5, 8, 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(13, 8, 6, 1.5);

    // Left Hand: Towering Sun Kite Shield
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(3.5, 11);
    ctx.lineTo(10.5, 11);
    ctx.lineTo(9.5, 22);
    ctx.lineTo(7, 26);
    ctx.lineTo(4.5, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(7, 17, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Hand: Righteous Warhammer
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(24, 6, 2, 17);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 5, 6, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(21, 6, 2, 2);
    ctx.fillRect(27, 6, 2, 2);
  }

  ctx.restore();
}

export function drawPaperDollMannequin(canvas, hero) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const classId = hero ? hero.classId : 'fighter';
  const cls = CLASSES[classId] || CLASSES.fighter;
  const themeColor = cls.color || '#fbbf24';

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

  // Pedestal / Dais ellipse at feet
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  drawSafeEllipse(ctx, cx, h - 35, 75, 18);
  ctx.fill();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Runic floor circle rings
  ctx.strokeStyle = '#283347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawSafeEllipse(ctx, cx, h - 35, 60, 14);
  ctx.stroke();

  // Body shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  drawSafeEllipse(ctx, cx, h - 34, 45, 10);
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

    // Radiant Sun Halo above helm
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, 38, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 2, 10, 4, 6);
    ctx.fillRect(cx - 2, 60, 4, 6);
    ctx.fillRect(cx - 28, 36, 6, 4);
    ctx.fillRect(cx + 22, 36, 6, 4);
  } else if (classId === 'ranger') {
    ctx.fillStyle = 'rgba(20, 83, 45, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx + 20, 100);
    ctx.lineTo(cx + 68, 235);
    ctx.lineTo(cx + 10, 235);
    ctx.lineTo(cx + 10, 100);
    ctx.closePath();
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = themeColor + '66';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, 68, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Class Headwear Silhouettes
  if (classId === 'fighter') {
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx - 15, 62);
    ctx.lineTo(cx - 32, 44);
    ctx.lineTo(cx - 15, 52);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 15, 62);
    ctx.lineTo(cx + 32, 44);
    ctx.lineTo(cx + 15, 52);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'thief') {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx - 14, 54);
    ctx.lineTo(cx, 34);
    ctx.lineTo(cx + 14, 54);
    ctx.closePath();
    ctx.fill();
  } else if (classId === 'mage') {
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(cx - 16, 54);
    ctx.lineTo(cx - 8, 18);
    ctx.lineTo(cx + 16, 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 15, 51, 30, 4);
  } else if (classId === 'ranger') {
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(cx - 14, 54);
    ctx.lineTo(cx, 36);
    ctx.lineTo(cx + 14, 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cx + 10, 30, 3, 18);
  } else if (classId === 'paladin') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx - 14, 64);
    ctx.lineTo(cx - 30, 42);
    ctx.lineTo(cx - 14, 54);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 14, 64);
    ctx.lineTo(cx + 30, 42);
    ctx.lineTo(cx + 14, 54);
    ctx.closePath();
    ctx.fill();
  }

  // Helm Visor Slit
  ctx.fillStyle = classId === 'thief' ? '#34d399' : themeColor;
  ctx.fillRect(cx - 9, 66, 18, 3.5);

  // Neck
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 6, 84, 12, 10);

  // Torso / Chest & Abdomen
  ctx.fillStyle = '#182234';
  ctx.beginPath();
  ctx.moveTo(cx - 36, 94);
  ctx.lineTo(cx + 36, 94);
  ctx.lineTo(cx + 22, 175);
  ctx.lineTo(cx - 22, 175);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = themeColor + '55';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Breastplate contour lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, 98);
  ctx.lineTo(cx, 165);
  ctx.moveTo(cx - 24, 118);
  ctx.lineTo(cx, 134);
  ctx.lineTo(cx + 24, 118);
  ctx.stroke();

  // Class Chest Emblems
  if (classId === 'paladin') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 3, 115, 6, 32);
    ctx.fillRect(cx - 16, 126, 32, 6);
  } else if (classId === 'thief') {
    ctx.fillStyle = '#34d399';
    ctx.fillRect(cx - 18, 118, 4, 4);
    ctx.fillRect(cx + 14, 118, 4, 4);
    ctx.fillRect(cx - 10, 142, 4, 4);
    ctx.fillRect(cx + 6, 142, 4, 4);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#312e81';
    ctx.fillRect(cx - 10, 96, 20, 78);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(cx - 8, 168, 16, 4);
  } else if (classId === 'ranger') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - 8, 96, 16, 78);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 24, 100);
    ctx.lineTo(cx + 20, 165);
    ctx.stroke();
  }

  // Shoulders / Pauldrons
  ctx.fillStyle = '#223048';
  ctx.strokeStyle = themeColor + '77';
  ctx.beginPath();
  ctx.arc(cx - 38, 98, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 38, 98, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left Arm (holding weapon position)
  ctx.strokeStyle = '#182234';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 38, 106);
  ctx.lineTo(cx - 62, 150);
  ctx.lineTo(cx - 58, 180);
  ctx.stroke();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Active Mana Flame Orbit on Mage Left Hand
  if (classId === 'mage') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - 58, 180, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx - 58, 180, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Right Arm (holding offhand/pickaxe position)
  ctx.strokeStyle = '#182234';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(cx + 38, 106);
  ctx.lineTo(cx + 62, 150);
  ctx.lineTo(cx + 58, 180);
  ctx.stroke();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Belt & Tassets
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(cx - 24, 174, 48, 8);
  ctx.fillStyle = themeColor;
  ctx.fillRect(cx - 4, 173, 8, 10);

  // Left Leg
  ctx.strokeStyle = '#182234';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(cx - 14, 185);
  ctx.lineTo(cx - 18, 240);
  ctx.lineTo(cx - 20, 280);
  ctx.stroke();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Right Leg
  ctx.strokeStyle = '#182234';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(cx + 14, 185);
  ctx.lineTo(cx + 18, 240);
  ctx.lineTo(cx + 20, 280);
  ctx.stroke();
  ctx.strokeStyle = themeColor + '44';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Boots
  ctx.fillStyle = '#223048';
  ctx.strokeStyle = themeColor + '66';
  ctx.lineWidth = 1.2;
  ctx.fillRect(cx - 28, 275, 17, 18);
  ctx.strokeRect(cx - 28, 275, 17, 18);
  ctx.fillRect(cx + 11, 275, 17, 18);
  ctx.strokeRect(cx + 11, 275, 17, 18);

  ctx.restore();
}

export function minimapPixelToGrid(canvas, clientX, clientY, floor) {
  if (!canvas || !floor || !floor.tiles) return null;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const rect = canvas.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;

  const px = (clientX - rect.left) * (canvas.width / rect.width);
  const py = (clientY - rect.top) * (canvas.height / rect.height);
  const scale = Math.min(canvas.width / fw, canvas.height / fh);
  const offX = Math.floor((canvas.width - fw * scale) / 2);
  const offY = Math.floor((canvas.height - fh * scale) / 2);

  const gx = Math.floor((px - offX) / scale);
  const gy = Math.floor((py - offY) / scale);
  if (gx < 0 || gx >= fw || gy < 0 || gy >= fh) return null;
  return { x: gx, y: gy };
}

export function renderMinimapCanvas(targetCanvasId = 'minimapCanvas') {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(targetCanvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) {
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Descend to chart subterranean floors', Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
    return;
  }

  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const biomeId = floor.biomeId || resolveFloorBiome(gameState.dungeon, floor.depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;

  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);
  const fh = floor.height || floor.tiles.length || DEFAULT_MAP_H;
  const scale = Math.min(canvas.width / fw, canvas.height / fh);
  const offX = Math.floor((canvas.width - fw * scale) / 2);
  const offY = Math.floor((canvas.height - fh * scale) / 2);
  const drawSize = Math.max(1, Math.ceil(scale));

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;
  const poiMarkers = [];

  for (let y = 0; y < fh; y++) {
    const expRow = floor.explored[y];
    if (!expRow) continue;
    const tileRow = floor.tiles[y];
    for (let x = 0; x < fw; x++) {
      if (!expRow[x]) continue;
      const t = tileRow[x];
      const rx = Math.floor(offX + x * scale);
      const ry = Math.floor(offY + y * scale);

      if (t === TILE_WALL) {
        ctx.fillStyle = biome.minimapWall;
        ctx.fillRect(rx, ry, drawSize, drawSize);
      } else if (ORE_CATALOG[t]) {
        ctx.fillStyle = ORE_CATALOG[t].color;
        ctx.fillRect(rx, ry, Math.max(2, drawSize), Math.max(2, drawSize));
      } else {
        ctx.fillStyle = biome.minimapFloor;
        ctx.fillRect(rx, ry, drawSize, drawSize);
        if (t === TILE_STAIRS_UP) {
          poiMarkers.push({ x: rx, y: ry, color: '#10b981', size: Math.max(3, drawSize + 1) });
        } else if (t === TILE_STAIRS_DOWN) {
          poiMarkers.push({ x: rx, y: ry, color: '#60a5fa', size: Math.max(3, drawSize + 1) });
        } else if (t === TILE_CHEST) {
          poiMarkers.push({ x: rx, y: ry, color: '#fbbf24', size: Math.max(2, drawSize) });
        } else if (t === TILE_SHRINE) {
          poiMarkers.push({ x: rx, y: ry, color: '#34d399', size: Math.max(2, drawSize) });
        } else if (t === TILE_TRAP_VISIBLE) {
          poiMarkers.push({ x: rx, y: ry, color: '#fb923c', size: Math.max(2, drawSize) });
        }
      }
    }
  }

  // Explored Doors & Portals on Minimap
  if (floor.objects && floor.objects.length > 0) {
    for (let oi = 0; oi < floor.objects.length; oi++) {
      const obj = floor.objects[oi];
      if (!obj || !floor.explored[obj.y] || !floor.explored[obj.y][obj.x]) continue;

      if (obj.objectType === 'door') {
        const disc = obj.runtimeState && obj.runtimeState.discovery;
        if (disc !== 'unknown') {
          const rx = Math.floor(offX + obj.x * scale);
          const ry = Math.floor(offY + obj.y * scale);
          const sec = obj.runtimeState && obj.runtimeState.security;
          const color = sec === 'locked' ? '#fbbf24' : '#d97706';
          poiMarkers.push({ x: rx, y: ry, color: color, size: Math.max(2, drawSize) });
        }
      } else if (obj.objectType === 'portal') {
        const rx = Math.floor(offX + obj.x * scale);
        const ry = Math.floor(offY + obj.y * scale);
        const pDefId = obj.definitionId || '';
        const color = pDefId === 'portal_astral_rift' ? '#c084fc' : (pDefId === 'portal_boss_extraction' ? '#fbbf24' : '#38bdf8');
        poiMarkers.push({ x: rx, y: ry, color: color, size: Math.max(3, drawSize + 1) });
      }
    }
  }

  for (let i = 0; i < poiMarkers.length; i++) {
    const p = poiMarkers[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  // Visible Monsters on Minimap
  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    if (!isTileVisibleNow(floor, hx, hy, vision, m.x, m.y)) continue;
    ctx.fillStyle = m.isBoss ? '#fbbf24' : '#f87171';
    const mx = Math.floor(offX + m.x * scale);
    const my = Math.floor(offY + m.y * scale);
    ctx.fillRect(mx, my, Math.max(2, drawSize), Math.max(2, drawSize));
  }

  // Camera Viewport Outline
  const cam = getCameraOrigin(floor, hx, hy);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    Math.floor(offX + cam.camX * scale) + 0.5,
    Math.floor(offY + cam.camY * scale) + 0.5,
    Math.min(fw, VIEWPORT_WIDTH) * scale,
    Math.min(fh, VIEWPORT_HEIGHT) * scale
  );

  // Hero Beacon
  const heroPx = Math.floor(offX + hx * scale);
  const heroPy = Math.floor(offY + hy * scale);
  const beacon = Math.max(3, drawSize + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(heroPx - 1, heroPy - 1, beacon, beacon);
}

export function renderDoorTile(ctx, px, py, door, biome, inSight) {
  if (!ctx || !door) return;
  const defId = door.definitionId || '';
  const rState = door.runtimeState || {};
  const mech = rState.mechanical || 'closed';
  const sec = rState.security || 'unlocked';
  const struct = rState.structural || 'intact';
  const disc = rState.discovery || 'revealed';

  // Unknown secret door renders as standard biome wall masonry
  if (disc === 'unknown') {
    ctx.fillStyle = biome.wallBase;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = biome.wallShadow;
    ctx.fillRect(px, py + 22, TILE_SIZE, 10);
    ctx.strokeStyle = biome.wallBorder;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    return;
  }

  // Destroyed / Breached Door Rubble
  if (struct === 'destroyed') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(px + 4, py + 8, 24, 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 6, py + 12, 8, 3);
    ctx.fillRect(px + 18, py + 16, 7, 3);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 12, py + 10, 6, 4);
    ctx.fillRect(px + 14, py + 20, 9, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px + 9, py + 18, 4, 4);
    return;
  }

  // Open Door (any type)
  if (mech === 'open') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 2, py + 2, 4, 28);
    ctx.fillRect(px + 26, py + 2, 4, 28);
    ctx.fillRect(px + 2, py + 2, 28, 3);

    if (defId === 'door_iron_portcullis') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 6, py + 3, 20, 6);
      ctx.fillStyle = '#94a3b8';
      for (let bx = 8; bx <= 24; bx += 4) {
        ctx.fillRect(px + bx, py + 9, 2, 4);
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px + 4, py + 3, 1, 14);
      ctx.fillRect(px + 27, py + 3, 1, 14);
    } else if (defId === 'door_secret_stone') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 4);
      ctx.lineTo(px + 12, py + 2);
      ctx.lineTo(px + 12, py + 28);
      ctx.lineTo(px + 6, py + 28);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = defId === 'door_iron_reinforced' ? '#334155' : '#78350f';
      ctx.fillRect(px + 6, py + 4, 4, 24);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 4, py + 8, 3, 3);
      ctx.fillRect(px + 4, py + 22, 3, 3);
    }
    return;
  }

  // CLOSED DOORS:
  if (defId === 'door_secret_stone') {
    ctx.fillStyle = biome.wallBase;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = biome.wallShadow;
    ctx.fillRect(px, py + 22, TILE_SIZE, 10);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 4, py + 4, 24, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ᚱ', px + 16, py + 18);
    return;
  }

  if (defId === 'door_iron_portcullis') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 1, py + 1, 5, 30);
    ctx.fillRect(px + 26, py + 1, 5, 30);
    ctx.fillRect(px + 1, py + 1, 30, 4);

    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 6, py + 10, 20, 2.5);
    ctx.fillRect(px + 6, py + 20, 20, 2.5);

    for (let bx = 8; bx <= 24; bx += 4) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px + bx, py + 4, 2.5, 22);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(px + bx, py + 26);
      ctx.lineTo(px + bx + 1.25, py + 29);
      ctx.lineTo(px + bx + 2.5, py + 26);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (defId === 'door_vault_ancient') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 2, py + 2, 28, 28);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 4, py + 4, 24, 24);

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = sec === 'locked' ? '#ef4444' : '#10b981';
    ctx.fillRect(px + 14.5, py + 14.5, 3, 3);
    return;
  }

  if (defId === 'door_iron_reinforced') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 2, py + 2, 28, 28);
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 4, py + 4, 24, 24);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 5); ctx.lineTo(px + 27, py + 27);
    ctx.moveTo(px + 27, py + 5); ctx.lineTo(px + 5, py + 27);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px + 5, py + 5, 2, 2);
    ctx.fillRect(px + 25, py + 5, 2, 2);
    ctx.fillRect(px + 5, py + 25, 2, 2);
    ctx.fillRect(px + 25, py + 25, 2, 2);

    ctx.fillStyle = sec === 'locked' ? '#fbbf24' : '#64748b';
    ctx.fillRect(px + 14, py + 13, 4, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 15, py + 15, 2, 2);
    return;
  }

  // Standard Wooden Hinged Door (door_wood_hinged)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 2, py + 2, 28, 28);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(px + 4, py + 4, 24, 24);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(px + 10, py + 4, 1, 24);
  ctx.fillRect(px + 16, py + 4, 1, 24);
  ctx.fillRect(px + 22, py + 4, 1, 24);

  ctx.fillStyle = '#334155';
  ctx.fillRect(px + 4, py + 8, 24, 3);
  ctx.fillRect(px + 4, py + 20, 24, 3);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(px + 6, py + 9, 1.5, 1.5);
  ctx.fillRect(px + 18, py + 9, 1.5, 1.5);
  ctx.fillRect(px + 6, py + 21, 1.5, 1.5);
  ctx.fillRect(px + 18, py + 21, 1.5, 1.5);

  if (sec === 'locked') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(px + 22, py + 14, 3, 4);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 23, py + 15, 1, 2);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px + 23, py + 16, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function renderPortalTile(ctx, px, py, portal, biome, inSight) {
  if (!ctx || !portal) return;
  const defId = portal.definitionId || '';
  const rState = portal.runtimeState || {};
  const isCollapsed = rState.mechanical === 'collapsed';

  // Base circular shadow dais
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(px + 16, py + 22, 12, 6, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(px + 16, py + 20, 10, 0, Math.PI * 2);
  }
  ctx.fill();

  if (isCollapsed) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 8, py + 14, 16, 6);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 8, py + 14, 16, 6);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(px + 12, py + 16, 8, 2);
    return;
  }

  if (defId === 'portal_astral_rift') {
    const trav = portal.components && portal.components.traversal;
    const charges = trav && typeof trav.charges === 'number' ? trav.charges : 2;

    ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 8, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 5, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 15, py + 15, 2, 2);

    for (let c = 0; c < charges; c++) {
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(px + 12 + c * 5, py + 4, 3, 3);
    }
    return;
  }

  if (defId === 'portal_boss_extraction') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.fillRect(px + 15, py + 2, 2, 8);
    ctx.fillRect(px + 10, py + 5, 2, 6);
    ctx.fillRect(px + 20, py + 5, 2, 6);
    return;
  }

  // Ancient Celestial Waypoint (portal_ancient_waypoint)
  const isAttuned = rState.discovery === 'revealed';

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 6, py + 18, 20, 8);
  ctx.fillStyle = '#334155';
  ctx.fillRect(px + 9, py + 14, 14, 6);

  ctx.fillStyle = '#475569';
  ctx.fillRect(px + 5, py + 12, 3, 10);
  ctx.fillRect(px + 24, py + 12, 3, 10);
  ctx.fillRect(px + 5, py + 10, 3, 2);
  ctx.fillRect(px + 24, py + 10, 3, 2);

  const auraColor = isAttuned ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.20)';
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(px + 16, py + 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isAttuned ? '#38bdf8' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(px + 16, py + 4);
  ctx.lineTo(px + 20, py + 10);
  ctx.lineTo(px + 16, py + 16);
  ctx.lineTo(px + 12, py + 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isAttuned ? '#ffffff' : '#cbd5e1';
  ctx.fillRect(px + 15, py + 9, 2, 2);
}

export function renderDungeonCanvas() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('dungeonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) return;
  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;

  const biomeId = floor.biomeId || resolveFloorBiome(gameState.dungeon, floor.depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;
  const cam = getCameraOrigin(floor, hx, hy);
  const camX = cam.camX;
  const camY = cam.camY;
  const fw = cam.fw;
  const fh = cam.fh;

  // Frustum-culled O(21*15) tile render loop
  for (let vy = 0; vy < VIEWPORT_HEIGHT; vy++) {
    const y = camY + vy;
    if (y < 0 || y >= fh) continue;
    const expRow = floor.explored[y];
    if (!expRow) continue;

    for (let vx = 0; vx < VIEWPORT_WIDTH; vx++) {
      const x = camX + vx;
      if (x < 0 || x >= fw) continue;
      if (!expRow[x]) continue;

      const px = vx * TILE_SIZE;
      const py = vy * TILE_SIZE;
      const dist = Math.hypot(x - hx, y - hy);
      const inSight = isTileVisibleNow(floor, hx, hy, vision, x, y);
      const tile = floor.tiles[y][x];

      // Draw Wall or Ore Vein Wall
      if (tile === TILE_WALL || ORE_CATALOG[tile]) {
        // Base Wall Fill
        ctx.fillStyle = biome.wallFill;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // 2.5D Top Wall Ledge (Cap) - 8px high top surface seen from above
        ctx.fillStyle = biome.wallCap;
        ctx.fillRect(px, py, TILE_SIZE, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(px, py + 7, TILE_SIZE, 1);

        // 2.5D Vertical Wall Face - Ashlar Brickwork (24px height)
        // Two 11px high masonry courses with 1px horizontal mortar groove at py + 19
        ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
        ctx.fillRect(px, py + 19, TILE_SIZE, 1);
        ctx.fillStyle = biome.wallBase;
        ctx.fillRect(px, py + 31, TILE_SIZE, 1);

        // Staggered vertical mortar joints (running-bond masonry)
        const stagger = (x + y) % 2 === 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        if (stagger) {
          ctx.fillRect(px + 16, py + 8, 1, 11);
          ctx.fillRect(px + 8, py + 20, 1, 11);
          ctx.fillRect(px + 24, py + 20, 1, 11);
        } else {
          ctx.fillRect(px + 8, py + 8, 1, 11);
          ctx.fillRect(px + 24, py + 8, 1, 11);
          ctx.fillRect(px + 16, py + 20, 1, 11);
        }

        // Course bevel highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(px, py + 8, TILE_SIZE, 1);
        ctx.fillRect(px, py + 20, TILE_SIZE, 1);

        // Distinct Biome Masonry Accents
        if (!ORE_CATALOG[tile]) {
          if (biome.id === 'dwarven_catacombs' && (x * 17 + y * 11) % 5 === 0) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
            ctx.fillRect(px + 12, py + 12, 3, 1);
            ctx.fillRect(px + 13, py + 11, 1, 3);
          } else if (biome.id === 'crystalline_caverns' && (x * 13 + y * 7) % 4 === 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(px + 15, py + 18, 2, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 15, py + 18, 1, 1);
          } else if (biome.id === 'molten_forgeworks' && (x * 13 + y * 7) % 3 === 0) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(px + 6, py + 19, 6, 1);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(px + 8, py + 19, 2, 1);
          } else if (biome.id === 'vespera_crater' && (x * 13 + y * 7) % 4 === 0) {
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(px + 14, py + 12, 3, 3);
            ctx.fillStyle = '#f3e8ff';
            ctx.fillRect(px + 15, py + 13, 1, 1);
          }
        }

        // Ore Vein Faceted Crystal Geodes
        if (ORE_CATALOG[tile]) {
          const ore = ORE_CATALOG[tile];
          // Shard 1 (Left)
          ctx.fillStyle = ore.color;
          ctx.beginPath();
          ctx.moveTo(px + 6, py + 19);
          ctx.lineTo(px + 9, py + 12);
          ctx.lineTo(px + 13, py + 15);
          ctx.lineTo(px + 10, py + 22);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.moveTo(px + 10, py + 22);
          ctx.lineTo(px + 13, py + 15);
          ctx.lineTo(px + 9, py + 12);
          ctx.closePath();
          ctx.fill();

          // Shard 2 (Center High)
          ctx.fillStyle = ore.color;
          ctx.beginPath();
          ctx.moveTo(px + 14, py + 17);
          ctx.lineTo(px + 18, py + 8);
          ctx.lineTo(px + 22, py + 13);
          ctx.lineTo(px + 18, py + 21);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.moveTo(px + 18, py + 21);
          ctx.lineTo(px + 22, py + 13);
          ctx.lineTo(px + 18, py + 8);
          ctx.closePath();
          ctx.fill();

          // Shard 3 (Right Low)
          ctx.fillStyle = ore.color;
          ctx.beginPath();
          ctx.moveTo(px + 20, py + 24);
          ctx.lineTo(px + 24, py + 16);
          ctx.lineTo(px + 27, py + 19);
          ctx.lineTo(px + 23, py + 27);
          ctx.closePath();
          ctx.fill();

          // Specular sparkles
          ctx.fillStyle = ore.sparkle || '#ffffff';
          ctx.fillRect(px + 9, py + 12, 2, 2);
          ctx.fillRect(px + 18, py + 8, 2, 2);
          ctx.fillRect(px + 24, py + 16, 2, 2);
        }
      } else {
        // Walkable Floor Tile (including concealed traps)
        // 1. Base 2x2 Flagstone Pavers
        ctx.fillStyle = (x + y) % 2 === 0 ? biome.floor1 : biome.floor2;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Recessed mortar lines between 4 flagstone pavers
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(px, py + 15, TILE_SIZE, 1);
        ctx.fillRect(px + 15, py, 1, TILE_SIZE);

        // Subtle paver edge bevel highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(px + 1, py + 1, 14, 1);
        ctx.fillRect(px + 1, py + 1, 1, 14);
        ctx.fillRect(px + 16, py + 1, 14, 1);
        ctx.fillRect(px + 16, py + 1, 1, 14);
        ctx.fillRect(px + 1, py + 16, 14, 1);
        ctx.fillRect(px + 1, py + 16, 1, 14);
        ctx.fillRect(px + 16, py + 16, 14, 1);
        ctx.fillRect(px + 16, py + 16, 1, 14);

        // Tile border outline
        ctx.strokeStyle = biome.floorBorder;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        // Deterministic stone fissure on occasional pavers
        if ((x * 19 + y * 23) % 7 === 0) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 5);
          ctx.lineTo(px + 8, py + 9);
          ctx.lineTo(px + 12, py + 11);
          ctx.stroke();
        }

        // 2. Ambient Occlusion Drop-Shadows cast by adjacent walls
        const hasNorthWall = y > 0 && floor.tiles[y - 1] && (floor.tiles[y - 1][x] === TILE_WALL || !!ORE_CATALOG[floor.tiles[y - 1][x]]);
        if (hasNorthWall) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(px, py, TILE_SIZE, 3);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.fillRect(px, py + 3, TILE_SIZE, 3);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(px, py + 6, TILE_SIZE, 2);
        }
        const hasWestWall = x > 0 && (floor.tiles[y][x - 1] === TILE_WALL || !!ORE_CATALOG[floor.tiles[y][x - 1]]);
        if (hasWestWall) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.fillRect(px, py, 2, TILE_SIZE);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
          ctx.fillRect(px + 2, py, 2, TILE_SIZE);
        }

        // 3. 3D Landmark Props
        if (tile === TILE_STAIRS_UP) {
          // Ascending Stairs: 4-tier beveled stone staircase with emerald guide runes
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 4, py + 24, 24, 5);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + 4, py + 24, 24, 1.2);

          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 6, py + 18, 20, 5);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(px + 6, py + 18, 20, 1.2);

          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 8, py + 12, 16, 5);
          ctx.fillStyle = '#6ee7b7';
          ctx.fillRect(px + 8, py + 12, 16, 1.2);

          // Top portal arch
          ctx.fillStyle = '#065f46';
          ctx.fillRect(px + 10, py + 5, 12, 6);
          // Ascending upward beacon chevron
          ctx.fillStyle = '#a7f3d0';
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 5);
          ctx.lineTo(px + 20, py + 9);
          ctx.lineTo(px + 18, py + 9);
          ctx.lineTo(px + 18, py + 13);
          ctx.lineTo(px + 14, py + 13);
          ctx.lineTo(px + 14, py + 9);
          ctx.lineTo(px + 12, py + 9);
          ctx.closePath();
          ctx.fill();

        } else if (tile === TILE_STAIRS_DOWN) {
          // Descending Stairs: 4-tier dark abyss staircase receding into the depths
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 4, py + 4, 24, 4);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 6, py + 8, 20, 4);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 8, py + 12, 16, 4);
          ctx.fillStyle = '#050b14';
          ctx.fillRect(px + 10, py + 16, 12, 12);

          // Deep cyan abyss glow
          ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.fillRect(px + 11, py + 21, 10, 4);
          // Descending chevron pointing into the abyss
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 26);
          ctx.lineTo(px + 12, py + 21);
          ctx.lineTo(px + 14, py + 21);
          ctx.lineTo(px + 14, py + 17);
          ctx.lineTo(px + 18, py + 17);
          ctx.lineTo(px + 18, py + 21);
          ctx.lineTo(px + 20, py + 21);
          ctx.closePath();
          ctx.fill();

        } else if (tile === TILE_CHEST) {
          // 3D Banded Gilded Vault Chest (Closed)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(px + 5, py + 24, 22, 4);

          // Domed oak chest body
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px + 6, py + 13, 20, 11);
          // Domed lid
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.moveTo(px + 6, py + 13);
          if (typeof ctx.quadraticCurveTo === 'function') {
            ctx.quadraticCurveTo(px + 16, py + 7, px + 26, py + 13);
          } else {
            ctx.lineTo(px + 16, py + 8);
            ctx.lineTo(px + 26, py + 13);
          }
          ctx.closePath();
          ctx.fill();

          // Gilded iron straps with rivets
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(px + 8, py + 10, 3, 14);
          ctx.fillRect(px + 21, py + 10, 3, 14);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 6, py + 13, 20, 2);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + 9, py + 11, 1, 1);
          ctx.fillRect(px + 9, py + 17, 1, 1);
          ctx.fillRect(px + 22, py + 11, 1, 1);
          ctx.fillRect(px + 22, py + 17, 1, 1);

          // Golden padlock with keyhole
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 14, py + 13, 4, 5);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 15, py + 15, 2, 2);

        } else if (tile === TILE_CHEST_OPEN) {
          // Looted Vault Chest with glittering spoils
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(px + 5, py + 24, 22, 4);

          // Tilted open lid thrown back
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 6, py + 6, 20, 6);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px + 6, py + 12, 20, 12);

          // Open interior cavity
          ctx.fillStyle = '#1c0a00';
          ctx.fillRect(px + 8, py + 14, 16, 8);
          // Gleaming coin and gem sparkles
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 9, py + 18, 3, 2);
          ctx.fillRect(px + 14, py + 19, 3, 2);
          ctx.fillRect(px + 18, py + 17, 2, 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px + 12, py + 17, 2, 2);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + 16, py + 18, 2, 2);

        } else if (tile === TILE_SHRINE) {
          // Active Astral Shrine with Stepped Dais & Hovering Crystal Prism
          const sMeta = (floor.shrines && floor.shrines[`${x},${y}`]) || { type: 'sanctuary' };
          const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;

          // Stepped stone dais
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 6, py + 22, 20, 6);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 9, py + 16, 14, 6);
          ctx.fillStyle = sDef.color;
          ctx.fillRect(px + 11, py + 19, 3, 1);
          ctx.fillRect(px + 18, py + 19, 3, 1);

          // Hovering Celestial Diamond Prism
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.arc(px + 16, py + 9, 6.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = sDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 3);
          ctx.lineTo(px + 21, py + 9);
          ctx.lineTo(px + 16, py + 15);
          ctx.lineTo(px + 11, py + 9);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 15, py + 7, 2, 2);

        } else if (tile === TILE_SHRINE_USED) {
          // Dormant stone pedestal
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px + 6, py + 22, 20, 6);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 9, py + 16, 14, 6);
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 12);
          ctx.lineTo(px + 19, py + 16);
          ctx.lineTo(px + 13, py + 16);
          ctx.closePath();
          ctx.fill();

        } else if (tile === TILE_TRAP_VISIBLE) {
          // Warning Metal Grate with Jutting Spikes
          const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
          const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
          ctx.strokeStyle = tDef.color;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(px + 5, py + 5, 22, 22);

          // Diagonal cross grate bars
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 5, py + 5);
          ctx.lineTo(px + 27, py + 27);
          ctx.moveTo(px + 27, py + 5);
          ctx.lineTo(px + 5, py + 27);
          ctx.stroke();

          // Steel spike teeth
          ctx.fillStyle = tDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 9, py + 21);
          ctx.lineTo(px + 12, py + 10);
          ctx.lineTo(px + 15, py + 21);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px + 17, py + 21);
          ctx.lineTo(px + 20, py + 10);
          ctx.lineTo(px + 23, py + 21);
          ctx.fill();

        } else if (tile === TILE_TRAP_DISARMED) {
          // Deactivated Grate with sheared spikes
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 7, py + 7, 18, 18);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 10, py + 15, 12, 2);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 13, py + 12, 6, 2);
        }
      }

      // 4. World Objects on Tile (Doors & Portals)
      if (floor.objects && floor.objects.length > 0) {
        for (let oi = 0; oi < floor.objects.length; oi++) {
          const obj = floor.objects[oi];
          if (obj && obj.x === x && obj.y === y) {
            if (obj.objectType === 'door') {
              renderDoorTile(ctx, px, py, obj, biome, inSight);
              break;
            } else if (obj.objectType === 'portal') {
              renderPortalTile(ctx, px, py, obj, biome, inSight);
              break;
            }
          }
        }
      }

      // Torchlight Warmth or Fog Dimming
      if (!inSight) {
        ctx.fillStyle = 'rgba(4, 6, 10, 0.68)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else {
        const glow = Math.max(0, 0.13 - dist * 0.022);
        if (glow > 0) {
          ctx.fillStyle = `rgba(${biome.torchR}, ${biome.torchG}, ${biome.torchB}, ${glow})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // Draw Auto-Walk Breadcrumb Trail (if active)
  const walkPath = getAutoWalkPath();
  if (walkPath.length > 0) {
    ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
    for (let i = 0; i < walkPath.length; i++) {
      const st = walkPath[i];
      const vx = st.x - camX;
      const vy = st.y - camY;
      if (vx >= 0 && vx < VIEWPORT_WIDTH && vy >= 0 && vy < VIEWPORT_HEIGHT) {
        ctx.beginPath();
        ctx.arc(vx * TILE_SIZE + 16, vy * TILE_SIZE + 16, i === walkPath.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw Visible Ground Pickups (floor.objects with objectType === 'pickup')
  const floorObjs = floor.objects || [];
  for (let i = 0; i < floorObjs.length; i++) {
    const o = floorObjs[i];
    if (!o || o.objectType !== 'pickup' || !o.components || !o.components.pickup) continue;
    const it = o.components.pickup.item;
    if (!it) continue;

    const vx = o.x - camX;
    const vy = o.y - camY;
    if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) continue;
    if (!isTileVisibleNow(floor, hx, hy, vision, o.x, o.y)) continue;

    const ox = vx * TILE_SIZE;
    const oy = vy * TILE_SIZE;

    // Glowing drop aura
    const rKey = it.rarity || 'common';
    const rDef = RARITY[rKey];
    const rColor = (rDef && rDef.color) || '#94a3b8';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(ox + 16, oy + 24, 9, 4, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(ox + 16, oy + 24, 6, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = rColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 11, 0, Math.PI * 2);
    ctx.stroke();

    // Upfront item type icon
    const icon = getItemTypeIcon(it) || '📦';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, ox + 16, oy + 16);
  }

  // Draw Visible Monsters inside Camera Frustum
  for (let i = 0; i < floor.monsters.length; i++) {
    const m = floor.monsters[i];
    if (!m || m.hp <= 0) continue;
    const vx = m.x - camX;
    const vy = m.y - camY;
    if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) continue;
    if (!isTileVisibleNow(floor, hx, hy, vision, m.x, m.y)) continue;

    const mx = vx * TILE_SIZE;
    const my = vy * TILE_SIZE;

    if (m.isBoss) {
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 2, my + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    } else if (m.isElite) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(mx + 16, my + 16, 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = m.color;
    ctx.fillRect(mx + 8, my + 7, 16, 16);
    ctx.fillStyle = '#080b11';
    ctx.fillRect(mx + 11, my + 11, 3, 3);
    ctx.fillRect(mx + 18, my + 11, 3, 3);

    // Monster Health Bar
    const pct = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = '#04060a';
    ctx.fillRect(mx + 4, my + 26, 24, 4);
    ctx.fillStyle = m.isBoss || m.isElite ? '#fbbf24' : '#f87171';
    ctx.fillRect(mx + 4, my + 26, Math.round(24 * pct), 4);

    // Overhead Status Effect Badges
    if (m.statuses && m.statuses.length > 0) {
      const statusColors = {
        burn:     '#fb923c',
        bleed:    '#f87171',
        poison:   '#4ade80',
        stun:     '#fbbf24',
        chilled:  '#38bdf8',
        weakened: '#c084fc'
      };
      for (let sIdx = 0; sIdx < m.statuses.length; sIdx++) {
        const st = m.statuses[sIdx];
        const sc = statusColors[st.id] || '#94a3b8';
        const bx = mx + 4 + sIdx * 7;
        ctx.fillStyle = sc;
        ctx.fillRect(bx, my - 4, 6, 4);
      }
    }

    // Threat / Aggro Telegraphs
    const distToHero = Math.hypot(m.x - hx, m.y - hy);
    if (distToHero <= 1.5) {
      // Melee threat alert: red chevron pulse above monster
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(mx + 16, my - 3);
      ctx.lineTo(mx + 13, my + 1);
      ctx.lineTo(mx + 19, my + 1);
      ctx.closePath();
      ctx.fill();
    } else if (
      (m.isRanged || m.id === 'starfall_archer' || m.id === 'ember_pyromancer' || m.id === 'void_hexer') &&
      distToHero <= 6 &&
      hasLineOfSight(floor, m.x, m.y, hx, hy)
    ) {
      // Ranged aim indicator: red dashed laser line targeting player
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.40)';
      ctx.lineWidth = 1;
      if (typeof ctx.setLineDash === 'function') ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(mx + 16, my + 16);
      ctx.lineTo((hx - camX) * TILE_SIZE + 16, (hy - camY) * TILE_SIZE + 16);
      ctx.stroke();
      if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);
    }
  }

  // Draw Player Sprite relative to Camera Origin (incorporating lunge displacement)
  const lx = heroLungeOffset.ticks > 0 ? heroLungeOffset.x * (heroLungeOffset.ticks / 6) : 0;
  const ly = heroLungeOffset.ticks > 0 ? heroLungeOffset.y * (heroLungeOffset.ticks / 6) : 0;
  drawHeroSprite(ctx, (hx - camX) * TILE_SIZE + lx, (hy - camY) * TILE_SIZE + ly, gameState.hero.classId, TILE_SIZE);
  if (heroLungeOffset.ticks > 0) heroLungeOffset.ticks--;

  // Draw Tactical Skill Range & Target Preview (if skill hovered / targeting active)
  if (skillHoverActive) {
    const targeting = getSkillTargetingInfo(gameState);
    if (targeting && targeting.reachRadius > 0) {
      const pCenterX = (hx - camX) * TILE_SIZE + 16;
      const pCenterY = (hy - camY) * TILE_SIZE + 16;
      const reachPx = targeting.reachRadius * TILE_SIZE;

      // Circular reach boundary
      ctx.strokeStyle = targeting.canAfford ? 'rgba(96, 165, 250, 0.75)' : 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 1.5;
      if (typeof ctx.setLineDash === 'function') ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(pCenterX, pCenterY, reachPx, 0, Math.PI * 2);
      ctx.fillStyle = targeting.canAfford ? 'rgba(96, 165, 250, 0.08)' : 'rgba(239, 68, 68, 0.06)';
      ctx.fill();
      ctx.stroke();
      if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);

      // Tactical reticles over eligible targets
      for (let tIdx = 0; tIdx < targeting.targets.length; tIdx++) {
        const tg = targeting.targets[tIdx];
        const tvx = tg.x - camX;
        const tvy = tg.y - camY;
        if (tvx >= 0 && tvx < VIEWPORT_WIDTH && tvy >= 0 && tvy < VIEWPORT_HEIGHT) {
          const tpx = tvx * TILE_SIZE;
          const tpy = tvy * TILE_SIZE;

          // Corner brackets
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(tpx + 2, tpy + 8); ctx.lineTo(tpx + 2, tpy + 2); ctx.lineTo(tpx + 8, tpy + 2);
          // Top-right
          ctx.moveTo(tpx + 30, tpy + 8); ctx.lineTo(tpx + 30, tpy + 2); ctx.lineTo(tpx + 24, tpy + 2);
          // Bottom-left
          ctx.moveTo(tpx + 2, tpy + 24); ctx.lineTo(tpx + 2, tpy + 30); ctx.lineTo(tpx + 8, tpy + 30);
          // Bottom-right
          ctx.moveTo(tpx + 30, tpy + 24); ctx.lineTo(tpx + 30, tpy + 30); ctx.lineTo(tpx + 24, tpy + 30);
          ctx.stroke();

          // Center crosshair / diamond
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(tpx + 11, tpy + 11, 10, 10);

          // Overhead TARGET label
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('TARGET', tpx + 16, tpy - 4);
        }
      }

      // Leap destination marker for Thief
      if (targeting.destTile) {
        const dvx = targeting.destTile.x - camX;
        const dvy = targeting.destTile.y - camY;
        if (dvx >= 0 && dvx < VIEWPORT_WIDTH && dvy >= 0 && dvy < VIEWPORT_HEIGHT) {
          const dpx = dvx * TILE_SIZE;
          const dpy = dvy * TILE_SIZE;
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(dpx + 3, dpy + 3, 26, 26);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.20)';
          ctx.fillRect(dpx + 3, dpy + 3, 26, 26);
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#c084fc';
          ctx.fillText('LEAP', dpx + 16, dpy + 17);
        }
      }
    }
  }

  // Draw Active Combat Animations (slashes, crit bursts, spell impacts)
  for (let aIdx = combatAnimations.length - 1; aIdx >= 0; aIdx--) {
    const anim = combatAnimations[aIdx];
    const cpx = (anim.gx - camX) * TILE_SIZE + 16;
    const cpy = (anim.gy - camY) * TILE_SIZE + 16;
    const prog = 1 - (anim.ticks / anim.maxTicks);

    if (cpx >= -32 && cpx <= canvas.width + 32 && cpy >= -32 && cpy <= canvas.height + 32) {
      if (anim.type === 'slash') {
        ctx.strokeStyle = anim.color || '#f87171';
        ctx.lineWidth = Math.max(1, 3.5 - prog * 2.5);
        ctx.beginPath();
        ctx.moveTo(cpx - 14 + prog * 6, cpy - 14 + prog * 6);
        ctx.lineTo(cpx + 14, cpy + 14);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cpx - 10 + prog * 6, cpy - 10 + prog * 6);
        ctx.lineTo(cpx + 10, cpy + 10);
        ctx.stroke();
      } else if (anim.type === 'crit_slash') {
        ctx.strokeStyle = anim.color || '#fbbf24';
        ctx.lineWidth = Math.max(1, 4 - prog * 3);
        const radius = 6 + prog * 14;
        ctx.beginPath();
        ctx.moveTo(cpx - radius, cpy); ctx.lineTo(cpx + radius, cpy);
        ctx.moveTo(cpx, cpy - radius); ctx.lineTo(cpx, cpy + radius);
        ctx.moveTo(cpx - radius * 0.7, cpy - radius * 0.7); ctx.lineTo(cpx + radius * 0.7, cpy + radius * 0.7);
        ctx.moveTo(cpx + radius * 0.7, cpy - radius * 0.7); ctx.lineTo(cpx - radius * 0.7, cpy + radius * 0.7);
        ctx.stroke();
      } else if (anim.type === 'spell') {
        ctx.strokeStyle = anim.color || '#60a5fa';
        ctx.lineWidth = Math.max(1, 3 - prog * 2);
        ctx.beginPath();
        ctx.arc(cpx, cpy, 4 + prog * 18, 0, Math.PI * 2);
        ctx.stroke();
      } else if (anim.type === 'projectile') {
        ctx.fillStyle = anim.color || '#f87171';
        ctx.beginPath();
        ctx.arc(cpx, cpy, Math.max(1, 5 - prog * 4), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = anim.color || '#f87171';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cpx - 8, cpy - 8); ctx.lineTo(cpx - 4, cpy + 8);
        ctx.moveTo(cpx, cpy - 8); ctx.lineTo(cpx + 4, cpy + 8);
        ctx.stroke();
      }
    }

    anim.ticks--;
    if (anim.ticks <= 0) {
      combatAnimations.splice(aIdx, 1);
    }
  }

  // Draw Hover Highlight relative to Camera Origin
  if (hoverTile) {
    const hvx = hoverTile.x - camX;
    const hvy = hoverTile.y - camY;
    if (hvx >= 0 && hvx < VIEWPORT_WIDTH && hvy >= 0 && hvy < VIEWPORT_HEIGHT) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hvx * TILE_SIZE + 1, hvy * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }

  // Draw Floating Combat/Mining Numbers projected into Camera Space
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const px = (ft.gx - camX) * TILE_SIZE + 16;
    const py = (ft.gy - camY) * TILE_SIZE + 10 - ft.riseOffset;
    if (px >= -40 && px <= canvas.width + 40 && py >= -20 && py <= canvas.height + 20) {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(ft.text, px + 1, py + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, px, py);
    }
    ft.riseOffset += 0.45;
    ft.ticks -= 1;
    if (ft.ticks <= 0) floatingTexts.splice(i, 1);
  }
}
