// 2D Graphical Canvas Renderer, Torchlight FOV, Hero Sprite, and Floating Combat Text

import {
  TILE_SIZE,
  GRID_W,
  GRID_H,
  TILE_WALL,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN,
  TILE_CHEST,
  TILE_CHEST_OPEN
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG } from '../data/ores.js';
import { gameState } from '../engine/state.js';

const floatingTexts = [];
let hoverTile = null;

export function setHoverTile(tile) {
  hoverTile = tile;
}

export function getHoverTile() {
  return hoverTile;
}

export function spawnFloatingText(gx, gy, text, color = '#fff') {
  floatingTexts.push({
    px: gx * TILE_SIZE + 16,
    py: gy * TILE_SIZE + 10,
    text,
    color,
    ticks: 28
  });
}

export function updateFOV() {
  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;
  const radius = gameState.hero.visionRadius || 5;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (Math.hypot(x - gameState.hero.x, y - gameState.hero.y) <= radius + 0.35) {
        floor.explored[y][x] = true;
      }
    }
  }
}

export function drawHeroSprite(ctx, px, py, classId, size = TILE_SIZE) {
  ctx.save();
  ctx.translate(px, py);
  const scale = size / 32;
  ctx.scale(scale, scale);

  const cls = CLASSES[classId] || CLASSES.fighter;
  // Base Cloak / Armor Silhouette
  ctx.fillStyle = cls.color;
  ctx.beginPath();
  ctx.arc(16, 17, 10, 0, Math.PI * 2);
  ctx.fill();

  // Head / Visor
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(11, 8, 10, 7);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(12, 10, 8, 2);

  // Class Weapon Accent
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.2;
  if (classId === 'fighter' || classId === 'paladin') {
    ctx.beginPath();
    ctx.moveTo(26, 7);
    ctx.lineTo(26, 25);
    ctx.stroke();
  } else if (classId === 'ranger') {
    ctx.beginPath();
    ctx.arc(24, 16, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (classId === 'mage') {
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(26, 9, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.lineTo(10, 22);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderDungeonCanvas() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('dungeonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.inGuild || !gameState.hero) return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor) return;

  const hx = gameState.hero.x;
  const hy = gameState.hero.y;
  const vision = gameState.hero.visionRadius || 5;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!floor.explored[y][x]) continue;

      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      const dist = Math.hypot(x - hx, y - hy);
      const inSight = dist <= vision + 0.35;
      const tile = floor.tiles[y][x];

      // Draw Wall or Ore Vein Wall
      if (tile === TILE_WALL || ORE_CATALOG[tile]) {
        ctx.fillStyle = '#1b2434';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#293548';
        ctx.fillRect(px, py, TILE_SIZE, 4);
        ctx.fillStyle = '#0d131d';
        ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 5);

        if (ORE_CATALOG[tile]) {
          const ore = ORE_CATALOG[tile];
          ctx.fillStyle = ore.color;
          ctx.fillRect(px + 6, py + 7, 7, 6);
          ctx.fillRect(px + 17, py + 10, 8, 6);
          ctx.fillRect(px + 10, py + 18, 9, 6);
          ctx.fillStyle = ore.sparkle;
          ctx.fillRect(px + 8, py + 8, 3, 3);
          ctx.fillRect(px + 19, py + 12, 3, 3);
        }
      } else {
        // Walkable Floor Tile
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0e1420' : '#111826';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#192234';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        if (tile === TILE_STAIRS_UP) {
          ctx.fillStyle = '#34d399';
          for (let s = 0; s < 4; s++) {
            ctx.fillRect(px + 5 + s * 3, py + 22 - s * 4, 20 - s * 3, 3);
          }
        } else if (tile === TILE_STAIRS_DOWN) {
          ctx.fillStyle = '#60a5fa';
          for (let s = 0; s < 4; s++) {
            ctx.fillRect(px + 6 + s * 3, py + 7 + s * 4, 20 - s * 3, 3);
          }
        } else if (tile === TILE_CHEST) {
          ctx.fillStyle = '#92400e';
          ctx.fillRect(px + 6, py + 10, 20, 14);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 6, py + 9, 20, 3);
          ctx.fillRect(px + 14, py + 14, 4, 5);
        } else if (tile === TILE_CHEST_OPEN) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 6, py + 15, 20, 9);
        }
      }

      // Torchlight Warmth or Fog Dimming
      if (!inSight) {
        ctx.fillStyle = 'rgba(4, 6, 10, 0.68)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else {
        const glow = Math.max(0, 0.13 - dist * 0.022);
        if (glow > 0) {
          ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // Draw Visible Monsters
  for (const m of floor.monsters) {
    if (Math.hypot(m.x - hx, m.y - hy) > vision + 0.35) continue;
    const mx = m.x * TILE_SIZE;
    const my = m.y * TILE_SIZE;

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
  }

  // Draw Player Sprite
  drawHeroSprite(ctx, hx * TILE_SIZE, hy * TILE_SIZE, gameState.hero.classId, TILE_SIZE);

  // Draw Hover Highlight
  if (hoverTile) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hoverTile.x * TILE_SIZE + 1, hoverTile.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  // Draw Floating Combat/Mining Numbers
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(ft.text, ft.px + 1, ft.py + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.px, ft.py);
    ft.py -= 0.45;
    ft.ticks -= 1;
    if (ft.ticks <= 0) floatingTexts.splice(i, 1);
  }
}
