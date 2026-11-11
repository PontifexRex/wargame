// Overworld 2D Canvas Renderer — Frustum-Culled Terrain, Fog of War, A* Route Preview & Smooth Unit Interpolation

import {
  OVERWORLD_VIEWPORT_W,
  OVERWORLD_VIEWPORT_H,
  OVERWORLD_TILE_SIZE
} from '../constants.js';
import {
  OW_TERRAIN_PLAINS,
  OW_TERRAIN_FOREST,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_MOUNTAINS,
  OW_TERRAIN_WATER,
  OW_TERRAIN_FERTILE_VALE,
  OVERWORLD_TERRAIN_DEFS,
  OVERWORLD_POI_DEFS
} from '../data/terrain.js';
import { getSelectedOverworldUnit, getPrimaryCity } from '../engine/state.js';
import { getUnitInterpolatedPosition } from '../engine/queues.js';

let wgHoverTile = null;
let wgPreviewPath = null;

export function setWargameHoverTile(tile, previewPath = null) {
  wgHoverTile = tile;
  wgPreviewPath = previewPath;
}

export function getWargameHoverTile() {
  return wgHoverTile;
}

export function getWargameCameraOrigin(ow, centerX, centerY) {
  const fw = ow.width;
  const fh = ow.height;

  let camX = Math.round(centerX) - Math.floor(OVERWORLD_VIEWPORT_W / 2);
  let camY = Math.round(centerY) - Math.floor(OVERWORLD_VIEWPORT_H / 2);

  if (camX < 0) camX = 0;
  if (camY < 0) camY = 0;
  if (camX + OVERWORLD_VIEWPORT_W > fw) camX = Math.max(0, fw - OVERWORLD_VIEWPORT_W);
  if (camY + OVERWORLD_VIEWPORT_H > fh) camY = Math.max(0, fh - OVERWORLD_VIEWPORT_H);

  return { camX: camX, camY: camY };
}

export function renderWargameOverworldCanvas(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const canvas = document.getElementById('wgOverworldCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#06090f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const state = simHost.state;
  const world = state.world;
  const ow = world.overworld;
  if (!ow || !ow.tiles) return;

  const simTimeMs = world.clock ? world.clock.simTimeMs : 0;
  const selUnit = getSelectedOverworldUnit(state);
  const primaryCity = getPrimaryCity(state);

  let focusX = ow.spawnX;
  let focusY = ow.spawnY;

  if (selUnit && selUnit.alive) {
    const interp = getUnitInterpolatedPosition(selUnit, simTimeMs);
    focusX = interp.x;
    focusY = interp.y;
  } else if (primaryCity) {
    focusX = primaryCity.x;
    focusY = primaryCity.y;
  }

  const cam = getWargameCameraOrigin(ow, focusX, focusY);
  const camX = cam.camX;
  const camY = cam.camY;
  const visionRadius = selUnit ? (selUnit.visionRadius || 4) : 5;

  // 1. Render Terrain Grid
  for (let vy = 0; vy < OVERWORLD_VIEWPORT_H; vy++) {
    const y = camY + vy;
    if (y < 0 || y >= ow.height) continue;
    const expRow = ow.explored[y];

    for (let vx = 0; vx < OVERWORLD_VIEWPORT_W; vx++) {
      const x = camX + vx;
      if (x < 0 || x >= ow.width) continue;

      const px = vx * OVERWORLD_TILE_SIZE;
      const py = vy * OVERWORLD_TILE_SIZE;
      const isExplored = expRow && expRow[x];

      if (!isExplored) {
        ctx.fillStyle = '#05070c';
        ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);
        ctx.strokeStyle = '#0c121e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, OVERWORLD_TILE_SIZE - 1, OVERWORLD_TILE_SIZE - 1);
        continue;
      }

      const dist = Math.hypot(x - focusX, y - focusY);
      const inSight = dist <= visionRadius + 0.45;
      const tId = ow.tiles[y][x];
      const tDef = OVERWORLD_TERRAIN_DEFS[tId] || OVERWORLD_TERRAIN_DEFS[OW_TERRAIN_PLAINS];

      ctx.fillStyle = inSight ? tDef.bgColor : '#0c1420';
      ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);

      ctx.strokeStyle = inSight ? tDef.borderColor : '#162234';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, OVERWORLD_TILE_SIZE - 1, OVERWORLD_TILE_SIZE - 1);

      const cx = px + OVERWORLD_TILE_SIZE / 2;
      const cy = py + OVERWORLD_TILE_SIZE / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (tId === OW_TERRAIN_FERTILE_VALE) {
        ctx.fillStyle = inSight ? '#4ade80' : '#15803d';
        ctx.font = '12px sans-serif';
        ctx.fillText('❀', cx, cy);
      } else if (tId === OW_TERRAIN_FOREST) {
        ctx.fillStyle = inSight ? '#22c55e' : '#166534';
        ctx.font = '13px sans-serif';
        ctx.fillText('♠', cx - 4, cy - 2);
        ctx.fillText('♠', cx + 4, cy + 3);
      } else if (tId === OW_TERRAIN_HILLS) {
        ctx.fillStyle = inSight ? '#cbd5e1' : '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('▲', cx, cy);
      } else if (tId === OW_TERRAIN_MOUNTAINS) {
        ctx.fillStyle = inSight ? '#f1f5f9' : '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('▲', cx - 3, cy);
        ctx.font = '11px sans-serif';
        ctx.fillText('▲', cx + 5, cy + 2);
      } else if (tId === OW_TERRAIN_WATER) {
        ctx.fillStyle = inSight ? '#38bdf8' : '#0284c7';
        ctx.font = '13px sans-serif';
        ctx.fillText('≈', cx, cy);
      } else if (inSight) {
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!inSight) {
        ctx.fillStyle = 'rgba(5, 8, 15, 0.52)';
        ctx.fillRect(px, py, OVERWORLD_TILE_SIZE, OVERWORLD_TILE_SIZE);
      }
    }
  }

  // 2. Render Points of Interest (Resource Caches, Groves, Quarries, Dungeon Entrances)
  if (Array.isArray(ow.pois)) {
    for (let i = 0; i < ow.pois.length; i++) {
      const poi = ow.pois[i];
      if (poi.depleted) continue;
      if (poi.x < camX || poi.x >= camX + OVERWORLD_VIEWPORT_W || poi.y < camY || poi.y >= camY + OVERWORLD_VIEWPORT_H) continue;
      if (!ow.explored[poi.y] || !ow.explored[poi.y][poi.x]) continue;

      const px = (poi.x - camX) * OVERWORLD_TILE_SIZE;
      const py = (poi.y - camY) * OVERWORLD_TILE_SIZE;
      const cx = px + OVERWORLD_TILE_SIZE / 2;
      const cy = py + OVERWORLD_TILE_SIZE / 2;
      const pDef = OVERWORLD_POI_DEFS[poi.type] || OVERWORLD_POI_DEFS.dungeon_entrance;

      ctx.fillStyle = pDef.bgColor || '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pDef.color || '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pDef.color || '#fbbf24';
      ctx.fillText(pDef.symbol || 'Ω', cx, cy);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(poi.name, cx, py - 3);
    }
  }

  // 3. Render Founded Cities
  const cityKeys = Object.keys(world.cities || {});
  for (let i = 0; i < cityKeys.length; i++) {
    const city = world.cities[cityKeys[i]];
    if (city.x < camX || city.x >= camX + OVERWORLD_VIEWPORT_W || city.y < camY || city.y >= camY + OVERWORLD_VIEWPORT_H) continue;

    const px = (city.x - camX) * OVERWORLD_TILE_SIZE;
    const py = (city.y - camY) * OVERWORLD_TILE_SIZE;
    const cx = px + OVERWORLD_TILE_SIZE / 2;
    const cy = py + OVERWORLD_TILE_SIZE / 2;

    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
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

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(city.name, cx, py - 4);
  }

  // 4. Render Active March Waypoint Path & Hover Preview Path
  if (selUnit && selUnit.alive && selUnit.marchPlan && Array.isArray(selUnit.marchPlan.remainingPath)) {
    const rem = selUnit.marchPlan.remainingPath;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const interp = getUnitInterpolatedPosition(selUnit, simTimeMs);
    ctx.moveTo((interp.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (interp.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    for (let i = 0; i < rem.length; i++) {
      const st = rem[i];
      ctx.lineTo((st.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (st.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (wgPreviewPath && wgPreviewPath.length > 0 && selUnit && selUnit.alive) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo((selUnit.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (selUnit.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    for (let i = 0; i < wgPreviewPath.length; i++) {
      const st = wgPreviewPath[i];
      ctx.lineTo((st.x - camX + 0.5) * OVERWORLD_TILE_SIZE, (st.y - camY + 0.5) * OVERWORLD_TILE_SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Render Overworld Units (Settlers & Hero Parties) with Smooth Real-Time Interpolation
  const units = ow.units || [];
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.alive) continue;
    const interp = getUnitInterpolatedPosition(u, simTimeMs);
    if (interp.x < camX - 1 || interp.x >= camX + OVERWORLD_VIEWPORT_W + 1 ||
        interp.y < camY - 1 || interp.y >= camY + OVERWORLD_VIEWPORT_H + 1) {
      continue;
    }

    const cx = (interp.x - camX + 0.5) * OVERWORLD_TILE_SIZE;
    const cy = (interp.y - camY + 0.5) * OVERWORLD_TILE_SIZE;
    const isSelected = selUnit && selUnit.id === u.id;

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = u.unitType === 'settler' ? '#fbbf24' : '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.unitType === 'settler' ? '🚩' : '⚔️', cx, cy);

    // Step Progress Bar above marching unit
    if (u.status === 'marching') {
      const barW = 24;
      const barH = 4;
      const bx = cx - barW / 2;
      const by = cy - 18;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx, by, Math.round(barW * interp.progress), barH);
    }

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = isSelected ? '#38bdf8' : '#e6edf3';
    ctx.fillText(u.shortName || u.name, cx, cy + 19);
  }

  // 6. Hover Tile Reticle
  if (wgHoverTile) {
    const hx = wgHoverTile.x;
    const hy = wgHoverTile.y;
    if (hx >= camX && hx < camX + OVERWORLD_VIEWPORT_W && hy >= camY && hy < camY + OVERWORLD_VIEWPORT_H) {
      const hpx = (hx - camX) * OVERWORLD_TILE_SIZE;
      const hpy = (hy - camY) * OVERWORLD_TILE_SIZE;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hpx + 1, hpy + 1, OVERWORLD_TILE_SIZE - 2, OVERWORLD_TILE_SIZE - 2);
    }
  }
}
