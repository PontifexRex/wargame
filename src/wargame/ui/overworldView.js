// =============================================================================
// POINTY-TOP HEXAGONAL OVERWORLD CANVAS RENDERER (ADR-0014 Step 3)
// Powered by shared HexGridAdapter + MapViewportEngine (Tier 3 Strategic Cartography).
// Losslessly maps (x, y) Overworld coordinates via odd-r offset <-> axial (q, r)
// with 3-state Fog of War, A* route preview, Cities, Dungeon POIs, Hostiles & Units.
// =============================================================================

import {
  OVERWORLD_VIEWPORT_W,
  OVERWORLD_VIEWPORT_H
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
import { createHexGridAdapter } from '../../ui/shared/gridAdapters.js';
import { createMapViewport } from '../../ui/shared/mapViewport.js';

let wgHoverTile = null;
let wgPreviewPath = null;
let owHexAdapter = null;
let owViewport = null;
let owViewportInitialized = false;
let owAttachedCanvas = null;
let owUserPanned = false;

// Tier 3 Strategic Cartography Daylight Palette (Art Bible §2.1)
const HEX_TERRAIN_FILL = {
  [OW_TERRAIN_PLAINS]:       { fill: '#4d7c4f', stroke: '#3a623d', dim: '#182820' },
  [OW_TERRAIN_FERTILE_VALE]: { fill: '#659954', stroke: '#4a773e', dim: '#1e3123' },
  [OW_TERRAIN_FOREST]:       { fill: '#2f5742', stroke: '#213f30', dim: '#12241d' },
  [OW_TERRAIN_HILLS]:        { fill: '#6c7a89', stroke: '#4e5b68', dim: '#1e2733' },
  [OW_TERRAIN_MOUNTAINS]:    { fill: '#475569', stroke: '#334155', dim: '#17202e' },
  [OW_TERRAIN_WATER]:        { fill: '#2563eb', stroke: '#1d4ed8', dim: '#0f2347' }
};

export function ensureOverworldHexViewport(canvas) {
  if (!owHexAdapter) {
    owHexAdapter = createHexGridAdapter({ hexSize: 22 });
  }
  const w = canvas ? canvas.width : 672;
  const h = canvas ? canvas.height : 480;
  if (!owViewport) {
    owViewport = createMapViewport({
      gridAdapter: owHexAdapter,
      viewportWidth: w,
      viewportHeight: h,
      minZoom: 0.55,
      maxZoom: 2.1,
      zoom: 1.0
    });
  } else if (canvas && (owViewport.camera.width !== w || owViewport.camera.height !== h)) {
    owViewport.resize(w, h);
  }
  return owViewport;
}

export function offsetToWorldInterpolated(fx, fy) {
  ensureOverworldHexViewport(null);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  if (tx === 0 && ty === 0) {
    const ax = owHexAdapter.offsetToAxial(x0, y0);
    return owHexAdapter.tileToWorld(ax);
  }
  const x1 = Math.ceil(fx);
  const y1 = Math.ceil(fy);
  const w0 = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(x0, y0));
  const w1 = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(x1, y1));
  const t = Math.max(tx, ty);
  return {
    wx: w0.wx + (w1.wx - w0.wx) * t,
    wy: w0.wy + (w1.wy - w0.wy) * t
  };
}

export function centerOverworldOnOffset(col, row) {
  const vp = ensureOverworldHexViewport(null);
  const ax = owHexAdapter.offsetToAxial(Math.round(col), Math.round(row));
  vp.centerOnTile(ax);
  owUserPanned = false;
  owViewportInitialized = true;
}

export function attachOverworldHexControls(canvas, handlers) {
  if (!canvas || owAttachedCanvas === canvas) return;
  owAttachedCanvas = canvas;
  const vp = ensureOverworldHexViewport(canvas);
  const cb = handlers || {};

  vp.attachPointerControls(canvas, {
    onHoverTile: function(axial) {
      if (!axial) {
        if (typeof cb.onHoverOffset === 'function') cb.onHoverOffset(null);
        return;
      }
      const off = owHexAdapter.axialToOffset(axial.q, axial.r);
      if (typeof cb.onHoverOffset === 'function') cb.onHoverOffset({ x: off.col, y: off.row });
    },
    onTapTile: function(axial) {
      if (!axial) return;
      const off = owHexAdapter.axialToOffset(axial.q, axial.r);
      if (typeof cb.onTapOffset === 'function') cb.onTapOffset({ x: off.col, y: off.row });
    },
    onCameraChange: function() {
      owUserPanned = true;
      if (typeof cb.onRepaint === 'function') cb.onRepaint();
    }
  });
}

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

function drawHexPolygon(ctx, pts, fill, stroke, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(pts[i].sx, pts[i].sy);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }
}

export function renderWargameOverworldCanvas(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const canvas = document.getElementById('wgOverworldCanvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#06090f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const state = simHost.state;
  const world = state.world;
  const ow = world.overworld;
  if (!ow || !ow.tiles) return;

  const vp = ensureOverworldHexViewport(canvas);
  const z = vp.camera.zoom;
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

  // Keep camera centered on active unit until user manually drags/pans
  if (!owViewportInitialized || !owUserPanned) {
    const focusW = offsetToWorldInterpolated(focusX, focusY);
    vp.centerOnWorld(focusW.wx, focusW.wy);
    owViewportInitialized = true;
  }

  const visionRadius = selUnit ? (selUnit.visionRadius || 4) : 5;
  const visRect = vp.getVisibleWorldRect(48);

  // 1. Render Frustum-Culled Pointy-Top Hexagonal Terrain Grid
  for (let y = 0; y < ow.height; y++) {
    const expRow = ow.explored[y];
    for (let x = 0; x < ow.width; x++) {
      const ax = owHexAdapter.offsetToAxial(x, y);
      const centerW = owHexAdapter.tileToWorld(ax);
      if (centerW.wx < visRect.minX || centerW.wx > visRect.maxX || centerW.wy < visRect.minY || centerW.wy > visRect.maxY) {
        continue;
      }

      const polyW = owHexAdapter.getTilePolygon(ax);
      const pts = polyW.map(function(p) { return vp.worldToScreen(p.wx, p.wy); });
      const centerS = vp.worldToScreen(centerW.wx, centerW.wy);
      const isExplored = expRow && expRow[x];

      if (!isExplored) {
        drawHexPolygon(ctx, pts, '#070b12', '#111a28', 0.8);
        continue;
      }

      const dist = Math.hypot(x - focusX, y - focusY);
      const inSight = dist <= visionRadius + 0.45;
      const tId = ow.tiles[y][x];
      const pal = HEX_TERRAIN_FILL[tId] || HEX_TERRAIN_FILL[OW_TERRAIN_PLAINS];
      const tDef = OVERWORLD_TERRAIN_DEFS[tId] || OVERWORLD_TERRAIN_DEFS[OW_TERRAIN_PLAINS];

      drawHexPolygon(
        ctx,
        pts,
        inSight ? pal.fill : pal.dim,
        inSight ? pal.stroke : '#182538',
        1
      );

      // Crisp Tier 3 cartographic detail cue
      if (tId === OW_TERRAIN_MOUNTAINS) {
        ctx.fillStyle = inSight ? '#cbd5e1' : '#334155';
        ctx.beginPath();
        ctx.moveTo(centerS.sx, centerS.sy - 8 * z);
        ctx.lineTo(centerS.sx + 7 * z, centerS.sy + 5 * z);
        ctx.lineTo(centerS.sx - 7 * z, centerS.sy + 5 * z);
        ctx.closePath();
        ctx.fill();
      } else if (tId === OW_TERRAIN_FOREST) {
        ctx.fillStyle = inSight ? '#1e3f2d' : '#0f2018';
        ctx.beginPath();
        ctx.arc(centerS.sx - 4 * z, centerS.sy, 4 * z, 0, Math.PI * 2);
        ctx.arc(centerS.sx + 4 * z, centerS.sy + 1 * z, 3.5 * z, 0, Math.PI * 2);
        ctx.arc(centerS.sx, centerS.sy - 4 * z, 4 * z, 0, Math.PI * 2);
        ctx.fill();
      } else if (tId === OW_TERRAIN_WATER) {
        ctx.strokeStyle = inSight ? 'rgba(186, 230, 253, 0.45)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerS.sx - 6 * z, centerS.sy);
        ctx.lineTo(centerS.sx + 6 * z, centerS.sy);
        ctx.stroke();
      } else if (tId === OW_TERRAIN_FERTILE_VALE && inSight) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.beginPath();
        ctx.arc(centerS.sx, centerS.sy, 2.2 * z, 0, Math.PI * 2);
        ctx.fill();
      } else if (tDef && tDef.symbol && z >= 0.85 && tId === OW_TERRAIN_HILLS) {
        ctx.fillStyle = inSight ? '#cbd5e1' : '#475569';
        ctx.font = Math.round(10 * z) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲', centerS.sx, centerS.sy);
      }
    }
  }

  // 2. Render Hover Hex & A* Route Preview
  if (wgPreviewPath && wgPreviewPath.length > 1) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = Math.max(2, 2.5 * z);
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let pi = 0; pi < wgPreviewPath.length; pi++) {
      const node = wgPreviewPath[pi];
      const w = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(node.x, node.y));
      const s = vp.worldToScreen(w.wx, w.wy);
      if (pi === 0) ctx.moveTo(s.sx, s.sy);
      else ctx.lineTo(s.sx, s.sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (wgHoverTile && wgHoverTile.x >= 0 && wgHoverTile.x < ow.width && wgHoverTile.y >= 0 && wgHoverTile.y < ow.height) {
    const hAx = owHexAdapter.offsetToAxial(wgHoverTile.x, wgHoverTile.y);
    const hPts = owHexAdapter.getTilePolygon(hAx).map(function(p) { return vp.worldToScreen(p.wx, p.wy); });
    drawHexPolygon(ctx, hPts, 'rgba(251, 191, 36, 0.22)', '#fbbf24', 2);
  }

  // 3. Render Active March Path for Selected Unit
  if (selUnit && selUnit.status === 'marching' && selUnit.marchPlan && Array.isArray(selUnit.marchPlan.path)) {
    const path = selUnit.marchPlan.path;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = Math.max(2, 2.5 * z);
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let mi = 0; mi < path.length; mi++) {
      const w = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(path[mi].x, path[mi].y));
      const s = vp.worldToScreen(w.wx, w.wy);
      if (mi === 0) ctx.moveTo(s.sx, s.sy);
      else ctx.lineTo(s.sx, s.sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Render Discovered Points of Interest (Dungeons, Resource Caches, etc.)
  const pois = ow.pois || [];
  for (let i = 0; i < pois.length; i++) {
    const poi = pois[i];
    if (poi.collected) continue;
    const isExp = (ow.explored[poi.y] && ow.explored[poi.y][poi.x]) || poi.discovered;
    if (!isExp) continue;

    const ax = owHexAdapter.offsetToAxial(poi.x, poi.y);
    const w = owHexAdapter.tileToWorld(ax);
    if (w.wx < visRect.minX || w.wx > visRect.maxX || w.wy < visRect.minY || w.wy > visRect.maxY) continue;
    const s = vp.worldToScreen(w.wx, w.wy);
    const pDef = OVERWORLD_POI_DEFS[poi.type] || { symbol: '★', color: '#fbbf24', bgColor: '#1e293b' };

    ctx.fillStyle = pDef.bgColor || '#1e293b';
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 11 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = poi.accentColor || pDef.color || '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = poi.accentColor || pDef.color || '#fbbf24';
    ctx.font = 'bold ' + Math.round(12 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pDef.symbol || 'Ω', s.sx, s.sy);
  }

  // 5. Render Bastion Cities
  const cities = world.cities || [];
  for (let c = 0; c < cities.length; c++) {
    const city = cities[c];
    const ax = owHexAdapter.offsetToAxial(city.x, city.y);
    const w = owHexAdapter.tileToWorld(ax);
    if (w.wx < visRect.minX || w.wx > visRect.maxX || w.wy < visRect.minY || w.wy > visRect.maxY) continue;
    const s = vp.worldToScreen(w.wx, w.wy);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 14 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = Math.round(14 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰', s.sx, s.sy - 1 * z);

    ctx.font = 'bold ' + Math.max(9, Math.round(10 * z)) + 'px monospace';
    ctx.fillStyle = '#080b11';
    const labelW = Math.max(54, city.name.length * 6.5) * z;
    ctx.fillRect(s.sx - labelW * 0.5, s.sy + 12 * z, labelW, 13 * z);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(city.name, s.sx, s.sy + 18.5 * z);
  }

  // 6. Render Wandering Hostiles (In Active Vision)
  const hostiles = ow.hostiles || [];
  for (let hi = 0; hi < hostiles.length; hi++) {
    const hos = hostiles[hi];
    if (!hos.alive) continue;
    if (Math.hypot(hos.x - focusX, hos.y - focusY) > visionRadius + 1.2) continue;

    const w = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(hos.x, hos.y));
    const s = vp.worldToScreen(w.wx, w.wy);

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(s.sx, s.sy - 10 * z);
    ctx.lineTo(s.sx + 10 * z, s.sy);
    ctx.lineTo(s.sx, s.sy + 10 * z);
    ctx.lineTo(s.sx - 10 * z, s.sy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fecaca';
    ctx.font = 'bold ' + Math.round(10 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☠', s.sx, s.sy);
  }

  // 7. Render Player Units (Settlers & Hero Vanguard Parties)
  const units = ow.units || [];
  for (let ui = 0; ui < units.length; ui++) {
    const u = units[ui];
    if (!u.alive) continue;

    const interp = getUnitInterpolatedPosition(u, simTimeMs);
    const w = offsetToWorldInterpolated(interp.x, interp.y);
    const s = vp.worldToScreen(w.wx, w.wy);
    const isSel = selUnit && selUnit.id === u.id;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(s.sx, s.sy + 5 * z, 9 * z, 0, Math.PI * 2);
    ctx.fill();

    // Unit Heraldic Shield Medallion
    ctx.fillStyle = u.unitType === 'hero_party' ? '#1e3a8a' : '#065f46';
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 11 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#fbbf24' : '#e2e8f0';
    ctx.lineWidth = isSel ? 2.5 : 1.5;
    ctx.stroke();

    ctx.font = Math.round(12 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.unitType === 'hero_party' ? '⚔️' : '🚩', s.sx, s.sy);
  }
}
