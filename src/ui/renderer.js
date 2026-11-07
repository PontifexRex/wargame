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
  TILE_TRAP_DISARMED
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG } from '../data/ores.js';
import { SHRINE_CATALOG, TRAP_CATALOG } from '../data/gems.js';
import { gameState, ensureDungeonFloorHydrated } from '../engine/state.js';
import { detectNearbyTraps } from '../engine/actions.js';
import { hasLineOfSight, getAutoWalkPath } from '../engine/combat.js';

export { hasLineOfSight };

const floatingTexts = [];
let hoverTile = null;
let visibleCoordMap = {};

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
        ctx.fillStyle = '#253247';
        ctx.fillRect(rx, ry, drawSize, drawSize);
      } else if (ORE_CATALOG[t]) {
        ctx.fillStyle = ORE_CATALOG[t].color;
        ctx.fillRect(rx, ry, Math.max(2, drawSize), Math.max(2, drawSize));
      } else {
        ctx.fillStyle = '#111a2b';
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
        // Walkable Floor Tile (including concealed traps)
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
        } else if (tile === TILE_SHRINE) {
          const sMeta = (floor.shrines && floor.shrines[`${x},${y}`]) || { type: 'sanctuary' };
          const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 8, py + 20, 16, 6);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 11, py + 14, 10, 6);
          ctx.fillStyle = sDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 4);
          ctx.lineTo(px + 22, py + 11);
          ctx.lineTo(px + 16, py + 18);
          ctx.lineTo(px + 10, py + 11);
          ctx.closePath();
          ctx.fill();
        } else if (tile === TILE_SHRINE_USED) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 8, py + 20, 16, 6);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 12, py + 14, 8, 6);
        } else if (tile === TILE_TRAP_VISIBLE) {
          const tMeta = (floor.traps && floor.traps[`${x},${y}`]) || { type: 'spike' };
          const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
          ctx.strokeStyle = tDef.color;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(px + 5, py + 5, 22, 22);
          ctx.fillStyle = tDef.color;
          ctx.beginPath();
          ctx.moveTo(px + 11, py + 21);
          ctx.lineTo(px + 14, py + 11);
          ctx.lineTo(px + 17, py + 21);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 21);
          ctx.lineTo(px + 19, py + 11);
          ctx.lineTo(px + 22, py + 21);
          ctx.fill();
        } else if (tile === TILE_TRAP_DISARMED) {
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 7, py + 7, 18, 18);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 11, py + 15, 10, 2);
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
  }

  // Draw Player Sprite relative to Camera Origin
  drawHeroSprite(ctx, (hx - camX) * TILE_SIZE, (hy - camY) * TILE_SIZE, gameState.hero.classId, TILE_SIZE);

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
