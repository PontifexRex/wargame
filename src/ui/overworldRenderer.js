// 2D Tactical Overworld Canvas Viewport Renderer, Frustum-Culled Terrain, Fog-of-War & Token Drawing

import {
  TILE_SIZE,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT
} from '../constants.js';
import {
  TERRAIN_PLAINS,
  TERRAIN_FOREST,
  TERRAIN_HILLS,
  TERRAIN_MOUNTAINS,
  TERRAIN_WATER,
  OVERWORLD_TERRAIN,
  OVERWORLD_POIS
} from '../data/overworld.js';
import { gameState } from '../engine/state.js';
import { getActiveOverworldParty, ensureOverworldHydrated } from '../engine/overworld.js';

let overworldHoverTile = null;

export function setOverworldHoverTile(tile) {
  overworldHoverTile = tile;
}

export function getOverworldHoverTile() {
  return overworldHoverTile;
}

export function getOverworldCameraOrigin(ow, centerX, centerY) {
  const fw = ow.width;
  const fh = ow.height;

  let camX = centerX - Math.floor(VIEWPORT_WIDTH / 2);
  let camY = centerY - Math.floor(VIEWPORT_HEIGHT / 2);

  if (camX < 0) camX = 0;
  if (camY < 0) camY = 0;
  if (camX + VIEWPORT_WIDTH > fw) camX = Math.max(0, fw - VIEWPORT_WIDTH);
  if (camY + VIEWPORT_HEIGHT > fh) camY = Math.max(0, fh - VIEWPORT_HEIGHT);

  return { camX: camX, camY: camY, fw: fw, fh: fh };
}

export function renderOverworldCanvas() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('overworldCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#080b11';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameState) return;
  ensureOverworldHydrated(gameState);
  const ow = gameState.overworld;
  if (!ow || !ow.tiles) return;

  const party = getActiveOverworldParty(gameState);
  let focusX = party && party.alive ? party.x : ow.spawnX || Math.floor(ow.width / 2);
  let focusY = party && party.alive ? party.y : ow.spawnY || Math.floor(ow.height / 2);

  // If settler has founded a city and is dead, focus on the first city
  if ((!party || !party.alive) && gameState.cities && Object.keys(gameState.cities).length > 0) {
    const firstCity = gameState.cities[Object.keys(gameState.cities)[0]];
    if (firstCity) {
      focusX = firstCity.x;
      focusY = firstCity.y;
    }
  }

  const cam = getOverworldCameraOrigin(ow, focusX, focusY);
  const camX = cam.camX;
  const camY = cam.camY;
  const vision = 3;

  // Frustum-culled 21x15 loop
  for (let vy = 0; vy < VIEWPORT_HEIGHT; vy++) {
    const y = camY + vy;
    if (y < 0 || y >= ow.height) continue;
    const expRow = ow.explored[y];
    if (!expRow) continue;

    for (let vx = 0; vx < VIEWPORT_WIDTH; vx++) {
      const x = camX + vx;
      if (x < 0 || x >= ow.width) continue;

      const px = vx * TILE_SIZE;
      const py = vy * TILE_SIZE;
      const isExplored = expRow[x];

      if (!isExplored) {
        // Unexplored black void
        ctx.fillStyle = '#06080e';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        continue;
      }

      const dist = Math.hypot(x - focusX, y - focusY);
      const inVision = dist <= vision + 0.35;
      const tId = ow.tiles[y][x];
      const tDef = OVERWORLD_TERRAIN[tId] || OVERWORLD_TERRAIN[TERRAIN_PLAINS];

      // Draw base terrain cell
      ctx.fillStyle = inVision ? tDef.bgColor : '#0e1724';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Grid line border
      ctx.strokeStyle = inVision ? tDef.borderColor : '#182436';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      // Decorative terrain icons / accents
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;

      if (tId === TERRAIN_FOREST) {
        ctx.fillStyle = inVision ? '#22c55e' : '#15803d';
        ctx.fillText('♠', cx - 4, cy - 2);
        ctx.fillText('♠', cx + 4, cy + 3);
      } else if (tId === TERRAIN_HILLS) {
        ctx.fillStyle = inVision ? '#cbd5e1' : '#64748b';
        ctx.fillText('▲', cx, cy);
      } else if (tId === TERRAIN_MOUNTAINS) {
        ctx.fillStyle = inVision ? '#f1f5f9' : '#94a3b8';
        ctx.fillText('▲', cx - 3, cy);
        ctx.font = '11px sans-serif';
        ctx.fillText('▲', cx + 5, cy + 2);
      } else if (tId === TERRAIN_WATER) {
        ctx.fillStyle = inVision ? '#38bdf8' : '#0284c7';
        ctx.fillText('~', cx, cy);
      } else {
        // Subtle plains dot
        if (inVision) {
          ctx.fillStyle = '#4d7c0f';
          ctx.beginPath();
          ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Atmospheric fog dimming for explored but out of vision tiles
      if (!inVision) {
        ctx.fillStyle = 'rgba(6, 10, 18, 0.55)';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Draw Points of Interest
  if (Array.isArray(ow.pois)) {
    for (let i = 0; i < ow.pois.length; i++) {
      const poi = ow.pois[i];
      if (poi.x >= camX && poi.x < camX + VIEWPORT_WIDTH && poi.y >= camY && poi.y < camY + VIEWPORT_HEIGHT) {
        if (!ow.explored[poi.y] || !ow.explored[poi.y][poi.x]) continue;

        const vx = poi.x - camX;
        const vy = poi.y - camY;
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;
        const cx = px + TILE_SIZE / 2;
        const cy = py + TILE_SIZE / 2;

        const pDef = OVERWORLD_POIS[poi.type] || OVERWORLD_POIS.dungeon_entrance;

        // Glowing POI base
        ctx.fillStyle = pDef.bgColor || '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pDef.color || '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = pDef.color || '#fbbf24';
        ctx.fillText(pDef.symbol || 'Ω', cx, cy);

        // Name badge
        ctx.font = '9px monospace';
        ctx.fillStyle = '#e6edf3';
        ctx.fillText(poi.name, cx, py - 3);
      }
    }
  }

  // Draw Founded Cities
  if (gameState.cities) {
    const cityKeys = Object.keys(gameState.cities);
    for (let ci = 0; ci < cityKeys.length; ci++) {
      const city = gameState.cities[cityKeys[ci]];
      if (city.x >= camX && city.x < camX + VIEWPORT_WIDTH && city.y >= camY && city.y < camY + VIEWPORT_HEIGHT) {
        const vx = city.x - camX;
        const vy = city.y - camY;
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;
        const cx = px + TILE_SIZE / 2;
        const cy = py + TILE_SIZE / 2;

        // Bastion Citadel Base
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏰', cx, cy);

        // City Banner
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(city.name, cx, py - 4);
      }
    }
  }

  // Draw Settler / Roaming Parties
  if (Array.isArray(ow.parties)) {
    for (let pi = 0; pi < ow.parties.length; pi++) {
      const p = ow.parties[pi];
      if (!p.alive) continue;
      if (p.x >= camX && p.x < camX + VIEWPORT_WIDTH && p.y >= camY && p.y < camY + VIEWPORT_HEIGHT) {
        const vx = p.x - camX;
        const vy = p.y - camY;
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;
        const cx = px + TILE_SIZE / 2;
        const cy = py + TILE_SIZE / 2;

        // Selection Aura
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Unit Token
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.unitType === 'settler' ? '🏛️' : '⚔️', cx, cy);

        // Unit Name Label
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(p.name, cx, py + TILE_SIZE + 8);
      }
    }
  }

  // Hover cursor highlight
  if (overworldHoverTile) {
    const hx = overworldHoverTile.x;
    const hy = overworldHoverTile.y;
    if (hx >= camX && hx < camX + VIEWPORT_WIDTH && hy >= camY && hy < camY + VIEWPORT_HEIGHT) {
      const hpx = (hx - camX) * TILE_SIZE;
      const hpy = (hy - camY) * TILE_SIZE;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hpx + 1, hpy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }
}
