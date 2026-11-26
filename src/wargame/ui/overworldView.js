// =============================================================================
// POINTY-TOP HEXAGONAL OVERWORLD CANVAS RENDERER (ADR-0014 Step 3)
// Powered by shared HexGridAdapter + MapViewportEngine (Tier 3 Strategic Cartography).
// Losslessly maps (x, y) Overworld coordinates via odd-r offset <-> axial (q, r)
// with 3-state Fog of War, A* route preview, Cities, Dungeon POIs, Hostiles & Units.
// =============================================================================

import {
  OVERWORLD_MAP_W,
  OVERWORLD_MAP_H,
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
import { getHexDistance } from '../engine/hexSpatial.js';
import { createHexGridAdapter } from '../../ui/shared/gridAdapters.js';
import { createMapViewport } from '../../ui/shared/mapViewport.js';

let wgHoverTile = null;
let wgPreviewPath = null;
let owHexAdapter = null;
let owViewport = null;
let owViewportInitialized = false;
let owAttachedCanvas = null;
let owUserPanned = false;
let owPointerScreenPos = null; // PF-02: { sx, sy } inside canvas for edge scrolling
let owPointerDragging = false;
let owFloatingCombatTexts = []; // CB-02: Presentation-only floating casualty numbers (never affects simulation!)

export const OVERWORLD_EDGE_SCROLL_ZONE_PX = 44;
export const OVERWORLD_EDGE_SCROLL_MAX_SPEED_PX = 360;
export const COMBAT_FLOATER_DURATION_MS = 1600;

// CB-02: Spawn floating casualty numbers strictly from authoritative round results (zero losses -> no floater)
export function spawnOverworldCasualtyFloaters(roundPayload, nowMs) {
  if (!roundPayload) return [];
  const t0 = typeof nowMs === 'number' ? nowMs : Date.now();
  const x = typeof roundPayload.x === 'number' ? roundPayload.x : 0;
  const y = typeof roundPayload.y === 'number' ? roundPayload.y : 0;
  const round = roundPayload.round || 1;
  const created = [];

  // Stagger vertical offset if other floaters are already active at this hex so numbers never overlap excessively
  const activeAtHex = owFloatingCombatTexts.filter(function(f) {
    return f.x === x && f.y === y && (t0 - f.createdAtMs) < f.durationMs;
  }).length;
  const staggerY = (activeAtHex % 3) * 14;

  if ((roundPayload.friendlyLosses || 0) > 0) {
    const fObj = {
      id: 'flt_f_' + round + '_' + t0 + '_' + Math.floor(Math.random() * 1000),
      side: 'friendly',
      x: x,
      y: y,
      ox: -18,
      oy: -10 - staggerY,
      text: '-' + roundPayload.friendlyLosses + ' Troops',
      color: '#fb923c',
      bg: 'rgba(69, 10, 10, 0.88)',
      createdAtMs: t0,
      durationMs: COMBAT_FLOATER_DURATION_MS
    };
    owFloatingCombatTexts.push(fObj);
    created.push(fObj);
  }

  if ((roundPayload.enemyPowerLost || 0) > 0) {
    const eObj = {
      id: 'flt_e_' + round + '_' + t0 + '_' + Math.floor(Math.random() * 1000),
      side: 'enemy',
      x: x,
      y: y,
      ox: 18,
      oy: -14 - staggerY,
      text: '-' + roundPayload.enemyPowerLost + ' Threat',
      color: '#fef08a',
      bg: 'rgba(127, 29, 29, 0.90)',
      createdAtMs: t0,
      durationMs: COMBAT_FLOATER_DURATION_MS
    };
    owFloatingCombatTexts.push(eObj);
    created.push(eObj);
  }

  if (owFloatingCombatTexts.length > 40) {
    owFloatingCombatTexts = owFloatingCombatTexts.slice(owFloatingCombatTexts.length - 40);
  }
  return created;
}

export function getActiveOverworldCasualtyFloaters(nowMs) {
  const t = typeof nowMs === 'number' ? nowMs : Date.now();
  owFloatingCombatTexts = owFloatingCombatTexts.filter(function(f) {
    return (t - f.createdAtMs) < f.durationMs;
  });
  return owFloatingCombatTexts.slice();
}

export function clearOverworldCasualtyFloaters() {
  owFloatingCombatTexts = [];
}

// Pure, testable edge-scroll velocity calculator (PF-02)
export function computeEdgeScrollVelocity(sx, sy, width, height, edgeZonePx, maxSpeedPxPerSec) {
  if (typeof sx !== 'number' || typeof sy !== 'number' || !isFinite(sx) || !isFinite(sy)) {
    return { vx: 0, vy: 0 };
  }
  const w = width > 0 ? width : 672;
  const h = height > 0 ? height : 480;
  const zone = typeof edgeZonePx === 'number' && edgeZonePx > 0 ? edgeZonePx : OVERWORLD_EDGE_SCROLL_ZONE_PX;
  const maxSpd = typeof maxSpeedPxPerSec === 'number' && maxSpeedPxPerSec > 0 ? maxSpeedPxPerSec : OVERWORLD_EDGE_SCROLL_MAX_SPEED_PX;

  if (sx < 0 || sy < 0 || sx > w || sy > h) {
    return { vx: 0, vy: 0 };
  }

  let vx = 0;
  let vy = 0;

  if (sx < zone) {
    const ratio = Math.min(1, Math.max(0, (zone - sx) / zone));
    vx = -ratio * maxSpd;
  } else if (sx > w - zone) {
    const ratio = Math.min(1, Math.max(0, (sx - (w - zone)) / zone));
    vx = ratio * maxSpd;
  }

  if (sy < zone) {
    const ratio = Math.min(1, Math.max(0, (zone - sy) / zone));
    vy = -ratio * maxSpd;
  } else if (sy > h - zone) {
    const ratio = Math.min(1, Math.max(0, (sy - (h - zone)) / zone));
    vy = ratio * maxSpd;
  }

  return { vx: vx, vy: vy };
}

export function clearOverworldEdgeScrollPointer() {
  owPointerScreenPos = null;
  owPointerDragging = false;
}

export function stepOverworldEdgeScroll(dtSec, state) {
  if (!owViewport || !owPointerScreenPos || owPointerDragging) return false;
  if (!state || state.activeView !== 'overworld') return false;
  // Never edge-scroll while interacting with modals or overlays
  if (state._deployArmyModalOpen || state._openFacilityId || state._researchHubOpen || state._trainingHubOpen || state._devPortalOpen) {
    return false;
  }
  const dt = Math.max(0, Math.min(0.1, Number(dtSec || 0)));
  if (dt <= 0) return false;

  const vel = computeEdgeScrollVelocity(
    owPointerScreenPos.sx,
    owPointerScreenPos.sy,
    owViewport.camera.width,
    owViewport.camera.height
  );
  if (vel.vx === 0 && vel.vy === 0) return false;

  const prevX = owViewport.camera.x;
  const prevY = owViewport.camera.y;
  // Moving viewport toward right edge pans camera +X (negative screen delta in panByScreenDelta)
  owViewport.panByScreenDelta(-vel.vx * dt, -vel.vy * dt);
  if (owViewport.camera.x !== prevX || owViewport.camera.y !== prevY) {
    owUserPanned = true;
    return true;
  }
  return false;
}

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
    const tl = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(0, 0));
    const br = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial((OVERWORLD_MAP_W || 56) - 1, (OVERWORLD_MAP_H || 40) - 1));
    owViewport = createMapViewport({
      gridAdapter: owHexAdapter,
      viewportWidth: w,
      viewportHeight: h,
      minZoom: 0.55,
      maxZoom: 2.1,
      zoom: 1.0,
      bounds: {
        minX: tl.wx,
        maxX: br.wx,
        minY: tl.wy,
        maxY: br.wy
      }
    });
  } else if (canvas && (owViewport.camera.width !== w || owViewport.camera.height !== h)) {
    owViewport.resize(w, h);
  }
  return owViewport;
}

export function interpolateHexSegment(fromX, fromY, toX, toY, progress) {
  ensureOverworldHexViewport(null);
  const t = Math.max(0, Math.min(1, typeof progress === 'number' ? progress : 0));
  const w0 = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(fromX, fromY));
  if (t === 0 || (fromX === toX && fromY === toY)) {
    return w0;
  }
  const w1 = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(toX, toY));
  return {
    wx: w0.wx + (w1.wx - w0.wx) * t,
    wy: w0.wy + (w1.wy - w0.wy) * t
  };
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
    onHoverTile: function(axial, pos) {
      owPointerScreenPos = pos ? { sx: pos.sx, sy: pos.sy } : null;
      owPointerDragging = false;
      if (!axial) {
        if (typeof cb.onHoverOffset === 'function') cb.onHoverOffset(null, pos);
        return;
      }
      const off = owHexAdapter.axialToOffset(axial.q, axial.r);
      if (typeof cb.onHoverOffset === 'function') cb.onHoverOffset({ x: off.col, y: off.row }, pos);
    },
    onTapTile: function(axial, pos) {
      owPointerDragging = false;
      if (!axial) return;
      const off = owHexAdapter.axialToOffset(axial.q, axial.r);
      if (typeof cb.onTapOffset === 'function') cb.onTapOffset({ x: off.col, y: off.row }, pos);
    },
    onCameraChange: function() {
      owUserPanned = true;
      if (typeof cb.onRepaint === 'function') cb.onRepaint();
    }
  });

  if (typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('mousedown', function() { owPointerDragging = true; });
    canvas.addEventListener('mouseup', function() { owPointerDragging = false; });
    canvas.addEventListener('mouseleave', function() {
      clearOverworldEdgeScrollPointer();
    });
  }
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

export function computeOverworldCameraFollow(camera, targetWorld, options) {
  const opts = options || {};
  const initialized = Boolean(opts.initialized);
  const userPanned = Boolean(opts.userPanned);
  const marginRatio = typeof opts.marginRatio === 'number' ? opts.marginRatio : 0.18;
  const smoothFactor = typeof opts.smoothFactor === 'number' ? opts.smoothFactor : 0.12;

  if (!camera || !targetWorld) {
    return { shouldMove: false, wx: 0, wy: 0 };
  }
  // Initial placement: center once on the starting unit/city
  if (!initialized) {
    return { shouldMove: true, wx: targetWorld.wx, wy: targetWorld.wy };
  }
  // Respect manual user pan/drag completely
  if (userPanned) {
    return { shouldMove: false, wx: camera.x, wy: camera.y };
  }

  // Keep map completely steady while unit stays inside the central safe zone of the viewport
  const halfW = (camera.width / (2 * (camera.zoom || 1))) * (1 - marginRatio * 2);
  const halfH = (camera.height / (2 * (camera.zoom || 1))) * (1 - marginRatio * 2);
  const dx = targetWorld.wx - camera.x;
  const dy = targetWorld.wy - camera.y;

  if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
    return { shouldMove: false, wx: camera.x, wy: camera.y };
  }

  // Unit approached viewport edge: ease smoothly toward unit without snapping
  return {
    shouldMove: true,
    wx: camera.x + dx * smoothFactor,
    wy: camera.y + dy * smoothFactor
  };
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

  // Authoritative integer tile focus for hex sight/visibility checks (never fractional!)
  let focusX = ow.spawnX;
  let focusY = ow.spawnY;
  // Exact world-space focus for camera initialization / smooth edge follow
  let focusWorld = interpolateHexSegment(ow.spawnX, ow.spawnY, ow.spawnX, ow.spawnY, 0);

  if (selUnit && selUnit.alive) {
    focusX = selUnit.x;
    focusY = selUnit.y;
    const interp = getUnitInterpolatedPosition(selUnit, simTimeMs);
    focusWorld = (selUnit.status === 'marching' && selUnit.marchPlan)
      ? interpolateHexSegment(selUnit.marchPlan.fromX, selUnit.marchPlan.fromY, selUnit.marchPlan.toX, selUnit.marchPlan.toY, interp.progress)
      : interpolateHexSegment(selUnit.x, selUnit.y, selUnit.x, selUnit.y, 0);
  } else if (primaryCity) {
    focusX = primaryCity.x;
    focusY = primaryCity.y;
    focusWorld = interpolateHexSegment(primaryCity.x, primaryCity.y, primaryCity.x, primaryCity.y, 0);
  }

  // Center once on boot; keep viewport rock-steady during normal movement and ease smoothly only near viewport edges
  const camStep = computeOverworldCameraFollow(vp.camera, focusWorld, {
    initialized: owViewportInitialized,
    userPanned: owUserPanned
  });
  if (camStep.shouldMove) {
    vp.centerOnWorld(camStep.wx, camStep.wy);
  }
  owViewportInitialized = true;

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

      const dist = getHexDistance(x, y, focusX, focusY);
      const inSight = dist <= visionRadius;
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

  // 3. Render Active March Path for Selected Unit (Task 05B-2: use authoritative remainingPath)
  if (selUnit && (selUnit.status === 'marching' || selUnit.status === 'returning') && selUnit.marchPlan && Array.isArray(selUnit.marchPlan.remainingPath) && selUnit.marchPlan.remainingPath.length > 0) {
    const path = selUnit.marchPlan.remainingPath;
    ctx.save();
    ctx.strokeStyle = selUnit.unitType === 'army' ? '#f87171' : '#fbbf24';
    ctx.lineWidth = Math.max(2, 2.5 * z);
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const startW = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(selUnit.x, selUnit.y));
    const startS = vp.worldToScreen(startW.wx, startW.wy);
    ctx.moveTo(startS.sx, startS.sy);
    for (let mi = 0; mi < path.length; mi++) {
      const w = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(path[mi].x, path[mi].y));
      const s = vp.worldToScreen(w.wx, w.wy);
      ctx.lineTo(s.sx, s.sy);
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

  // 4b. Render Discovered Military Targets (Task 05B-2 — distinct from adventure POIs & hostiles)
  const militaryTargets = ow.militaryTargets || [];
  const selectedTargetId = state._selectedMilitaryTargetId || null;
  for (let mi = 0; mi < militaryTargets.length; mi++) {
    const mt = militaryTargets[mi];
    if (!mt) continue;
    const isDisc = Boolean(mt.discovered || (ow.explored[mt.y] && ow.explored[mt.y][mt.x]));
    if (!isDisc) continue;

    const ax = owHexAdapter.offsetToAxial(mt.x, mt.y);
    const w = owHexAdapter.tileToWorld(ax);
    if (w.wx < visRect.minX || w.wx > visRect.maxX || w.wy < visRect.minY || w.wy > visRect.maxY) continue;
    const s = vp.worldToScreen(w.wx, w.wy);
    const isCleared = mt.status === 'cleared';
    const isSelectedTarget = selectedTargetId === mt.id;

    // Distinct octagonal/square bastion plaque for military-scale positions
    const r = 12 * z;
    ctx.fillStyle = isCleared ? '#064e3b' : '#450a0a';
    ctx.beginPath();
    ctx.rect(s.sx - r, s.sy - r, r * 2, r * 2);
    ctx.fill();
    ctx.strokeStyle = isSelectedTarget ? '#fbbf24' : (isCleared ? '#34d399' : '#ef4444');
    ctx.lineWidth = isSelectedTarget ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = isCleared ? '#6ee7b7' : '#fecaca';
    ctx.font = 'bold ' + Math.round(12 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCleared ? '✓' : '⚔', s.sx, s.sy);

    // PF-01: Crisp target label pill so combat target is unmistakably identifiable on the map
    if (z >= 0.75) {
      const tagText = isCleared ? 'Cleared' : ('⚔ Pwr ' + (mt.enemyPower || 100));
      ctx.font = 'bold ' + Math.max(8, Math.round(9 * z)) + 'px monospace';
      const tagW = Math.max(46, tagText.length * 5.8) * z;
      ctx.fillStyle = isCleared ? 'rgba(6, 78, 59, 0.90)' : 'rgba(69, 10, 10, 0.92)';
      ctx.fillRect(s.sx - tagW * 0.5, s.sy + 12 * z, tagW, 12 * z);
      ctx.fillStyle = isCleared ? '#6ee7b7' : '#fca5a5';
      ctx.fillText(tagText, s.sx, s.sy + 18 * z);
    }
  }

  // 5. Render Bastion Cities (PF-01: support canonical world.cities object map as well as arrays)
  const cities = Array.isArray(world.cities) ? world.cities : Object.values(world.cities || {});
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
    if (getHexDistance(hos.x, hos.y, focusX, focusY) > visionRadius + 1) continue;

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

  // 7. Render Player Units (Settlers, Hero Vanguard Parties & Deployed Field Armies)
  const units = ow.units || [];
  for (let ui = 0; ui < units.length; ui++) {
    const u = units[ui];
    if (!u.alive) continue;

    const interp = getUnitInterpolatedPosition(u, simTimeMs);
    const isMoving = (u.status === 'marching' || u.status === 'returning') && u.marchPlan;
    const w = isMoving
      ? interpolateHexSegment(u.marchPlan.fromX, u.marchPlan.fromY, u.marchPlan.toX, u.marchPlan.toY, interp.progress)
      : interpolateHexSegment(u.x, u.y, u.x, u.y, 0);
    const s = vp.worldToScreen(w.wx, w.wy);
    const isSel = selUnit && selUnit.id === u.id;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(s.sx, s.sy + 5 * z, 9 * z, 0, Math.PI * 2);
    ctx.fill();

    // Unit Heraldic Shield Medallion
    ctx.fillStyle = u.unitType === 'army' ? '#991b1b' : (u.unitType === 'hero_party' ? '#1e3a8a' : '#065f46');
    ctx.beginPath();
    ctx.arc(s.sx, s.sy, 11 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#fbbf24' : '#e2e8f0';
    ctx.lineWidth = isSel ? 2.5 : 1.5;
    ctx.stroke();

    ctx.font = Math.round(12 * z) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.unitType === 'army' ? '🛡️' : (u.unitType === 'hero_party' ? '⚔️' : '🚩'), s.sx, s.sy);
  }

  // 8. Render Floating Combat Casualty Numbers (CB-02 — presentation-only, rises upward & fades smoothly)
  const nowFloatMs = Date.now();
  const activeFloaters = getActiveOverworldCasualtyFloaters(nowFloatMs);
  for (let fi = 0; fi < activeFloaters.length; fi++) {
    const fl = activeFloaters[fi];
    const progress = Math.max(0, Math.min(1, (nowFloatMs - fl.createdAtMs) / Math.max(1, fl.durationMs)));
    const alpha = Math.max(0, 1 - progress * progress);
    const wPos = owHexAdapter.tileToWorld(owHexAdapter.offsetToAxial(fl.x, fl.y));
    const sPos = vp.worldToScreen(wPos.wx, wPos.wy);
    const drawX = sPos.sx + fl.ox * z;
    const drawY = sPos.sy + (fl.oy - progress * 38) * z;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold ' + Math.max(10, Math.round(11 * z)) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const boxW = Math.max(58, fl.text.length * 6.8) * z;
    const boxH = 15 * z;
    ctx.fillStyle = fl.bg || 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(drawX - boxW * 0.5, drawY - boxH * 0.5, boxW, boxH);
    ctx.fillStyle = fl.color || '#f87171';
    ctx.fillText(fl.text, drawX, drawY);
    ctx.restore();
  }
}
