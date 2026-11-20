// =============================================================================
// 2:1 ISOMETRIC BASTION CITY CANVAS RENDERER (ADR-0014 Step 2)
// Uses shared IsoGridAdapter + MapViewportEngine to render the 8x8 Bastion City
// in sunlit Golden-Hour 2:1 Isometric projection with Lv 1-5 3D height scaling,
// back-to-front painter's sort, drag-pan, wheel/pinch zoom, and exact diamond picking.
// =============================================================================

import { createIsoGridAdapter } from '../../ui/shared/gridAdapters.js';
import { createMapViewport } from '../../ui/shared/mapViewport.js';
import { CITY_BUILDINGS_CATALOG } from '../data/buildings.js';
import { getPrimaryCity } from '../engine/state.js';

let cityIsoAdapter = null;
let cityViewport = null;
let hoveredPlotCoord = null;
let attachedCanvas = null;

export function ensureCityIsoViewport(canvas) {
  if (!cityIsoAdapter) {
    cityIsoAdapter = createIsoGridAdapter({ tileWidth: 74, tileHeight: 37 });
  }
  const w = canvas ? canvas.width : 660;
  const h = canvas ? canvas.height : 400;
  if (!cityViewport) {
    cityViewport = createMapViewport({
      gridAdapter: cityIsoAdapter,
      viewportWidth: w,
      viewportHeight: h,
      minZoom: 0.65,
      maxZoom: 2.0,
      zoom: 1.0,
      bounds: { minX: -420, maxX: 420, minY: -80, maxY: 420 }
    });
    cityViewport.centerOnTile({ x: 3.5, y: 3.5 });
  } else if (canvas && (cityViewport.camera.width !== w || cityViewport.camera.height !== h)) {
    cityViewport.resize(w, h);
  }
  return cityViewport;
}

export function attachCityIsoControls(canvas, callbacks) {
  if (!canvas || attachedCanvas === canvas) return;
  attachedCanvas = canvas;
  const vp = ensureCityIsoViewport(canvas);
  const cb = callbacks || {};

  vp.attachPointerControls(canvas, {
    onHoverTile: function(coord) {
      if (coord && coord.x >= 0 && coord.x < 8 && coord.y >= 0 && coord.y < 8) {
        hoveredPlotCoord = coord;
      } else {
        hoveredPlotCoord = null;
      }
      if (typeof cb.onRepaint === 'function') cb.onRepaint();
    },
    onTapTile: function(coord) {
      if (!coord || coord.x < 0 || coord.x >= 8 || coord.y < 0 || coord.y >= 8) return;
      const plotIndex = coord.y * 8 + coord.x;
      if (typeof cb.onSelectPlot === 'function') cb.onSelectPlot(plotIndex);
    },
    onCameraChange: function() {
      if (typeof cb.onRepaint === 'function') cb.onRepaint();
    }
  });
}

function drawIsoDiamond(ctx, pts, fill, stroke, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  ctx.lineTo(pts[1].sx, pts[1].sy);
  ctx.lineTo(pts[2].sx, pts[2].sy);
  ctx.lineTo(pts[3].sx, pts[3].sy);
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

function getBuildingRoofColor(bDef) {
  if (!bDef) return '#b85a3a';
  if (bDef.id === 'meeting_hall' || bDef.id === 'town_hall') return '#d97706';
  if (bDef.category === 'military') return '#4a5568';
  if (bDef.category === 'arcane') return '#5b21b6';
  if (bDef.category === 'resource') return '#9a3412';
  if (bDef.category === 'storage') return '#64748b';
  return '#b85a3a';
}

function drawExtrudedIsoBuilding(ctx, vp, coord, bDef, plot) {
  const lvl = plot.level || 1;
  const z = vp.camera.zoom;
  const polyWorld = cityIsoAdapter.getTilePolygon(coord);
  const pts = polyWorld.map(function(p) { return vp.worldToScreen(p.wx, p.wy); });
  const center = vp.tileToScreen(coord);

  // Shrink footprint slightly inside tile for crisp streets/courtyards
  const inset = 0.78;
  const basePts = pts.map(function(p) {
    return {
      sx: center.sx + (p.sx - center.sx) * inset,
      sy: center.sy + (p.sy - center.sy) * inset
    };
  });

  // Soft 135-degree daylight contact shadow (bottom-right)
  ctx.fillStyle = 'rgba(10, 14, 22, 0.38)';
  ctx.beginPath();
  ctx.moveTo(basePts[0].sx + 6 * z, basePts[0].sy + 4 * z);
  ctx.lineTo(basePts[1].sx + 8 * z, basePts[1].sy + 5 * z);
  ctx.lineTo(basePts[2].sx + 6 * z, basePts[2].sy + 5 * z);
  ctx.lineTo(basePts[3].sx + 4 * z, basePts[3].sy + 4 * z);
  ctx.closePath();
  ctx.fill();

  // Height scales visibly with Level 1 -> 5
  const isCenterSeat = (bDef.id === 'meeting_hall' || bDef.id === 'town_hall');
  const wallH = ((isCenterSeat ? 22 : 12) + lvl * 5) * z;
  const roofPeakH = ((isCenterSeat ? 14 : 9) + lvl * 2) * z;

  const topPts = basePts.map(function(p) {
    return { sx: p.sx, sy: p.sy - wallH };
  });

  // Wall colors: sunlit top-left warm limestone/timber vs. cool shaded right face
  const leftWallFill = plot.underConstruction ? '#92623a' : (lvl >= 2 ? '#b8b0a4' : '#a47148');
  const rightWallFill = plot.underConstruction ? '#6b4423' : (lvl >= 2 ? '#7c756c' : '#7c5233');

  // Left visible face (pts[3] -> pts[2])
  ctx.beginPath();
  ctx.moveTo(basePts[3].sx, basePts[3].sy);
  ctx.lineTo(basePts[2].sx, basePts[2].sy);
  ctx.lineTo(topPts[2].sx, topPts[2].sy);
  ctx.lineTo(topPts[3].sx, topPts[3].sy);
  ctx.closePath();
  ctx.fillStyle = leftWallFill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right visible face (pts[2] -> pts[1])
  ctx.beginPath();
  ctx.moveTo(basePts[2].sx, basePts[2].sy);
  ctx.lineTo(basePts[1].sx, basePts[1].sy);
  ctx.lineTo(topPts[1].sx, topPts[1].sy);
  ctx.lineTo(topPts[2].sx, topPts[2].sy);
  ctx.closePath();
  ctx.fillStyle = rightWallFill;
  ctx.fill();
  ctx.stroke();

  // Pitched 4-facet isometric roof
  const roofBase = getBuildingRoofColor(bDef);
  const apex = { sx: center.sx, sy: center.sy - wallH - roofPeakH };

  // Sunlit front-left roof facet
  ctx.beginPath();
  ctx.moveTo(topPts[3].sx, topPts[3].sy);
  ctx.lineTo(topPts[2].sx, topPts[2].sy);
  ctx.lineTo(apex.sx, apex.sy);
  ctx.closePath();
  ctx.fillStyle = roofBase;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.25)';
  ctx.stroke();

  // Shaded front-right roof facet
  ctx.beginPath();
  ctx.moveTo(topPts[2].sx, topPts[2].sy);
  ctx.lineTo(topPts[1].sx, topPts[1].sy);
  ctx.lineTo(apex.sx, apex.sy);
  ctx.closePath();
  ctx.fillStyle = roofBase;
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 15, 30, 0.30)';
  ctx.fill();

  // Back roof facets for solid silhouette
  ctx.beginPath();
  ctx.moveTo(topPts[0].sx, topPts[0].sy);
  ctx.lineTo(topPts[3].sx, topPts[3].sy);
  ctx.lineTo(apex.sx, apex.sy);
  ctx.closePath();
  ctx.fillStyle = roofBase;
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(topPts[0].sx, topPts[0].sy);
  ctx.lineTo(topPts[1].sx, topPts[1].sy);
  ctx.lineTo(apex.sx, apex.sy);
  ctx.closePath();
  ctx.fillStyle = roofBase;
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 15, 30, 0.18)';
  ctx.fill();

  // Level 3+ Celestial Gold Finial / Crest
  if (lvl >= 3 || isCenterSeat) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(apex.sx, apex.sy - 2 * z, 2.5 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crisp building icon & Level pill floating cleanly above roof
  ctx.font = Math.max(10, Math.round(13 * z)) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(plot.underConstruction ? '🔨' : (bDef.icon || '🏛️'), apex.sx, apex.sy - 10 * z);

  ctx.font = 'bold ' + Math.max(8, Math.round(9 * z)) + 'px monospace';
  ctx.fillStyle = '#080b11';
  ctx.fillRect(apex.sx - 13 * z, basePts[2].sy - 9 * z, 26 * z, 11 * z);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('L' + lvl, apex.sx, basePts[2].sy - 3 * z);
}

export function renderCityIsoCanvas(simHost) {
  if (typeof document === 'undefined' || !simHost || !simHost.state || !simHost.state.world) return;
  const canvas = document.getElementById('wgCityIsoCanvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const city = getPrimaryCity(simHost.state);
  if (!city || !Array.isArray(city.plots)) return;

  const vp = ensureCityIsoViewport(canvas);
  const w = canvas.width;
  const h = canvas.height;

  // 1. Sunlit Golden-Hour Meadow Backdrop (Art Bible §2.1 & §2.2)
  if (typeof ctx.createRadialGradient === 'function') {
    const bgGrad = ctx.createRadialGradient(w * 0.35, h * 0.25, 40, w * 0.5, h * 0.5, w * 0.75);
    bgGrad.addColorStop(0, '#4f7d52');
    bgGrad.addColorStop(0.65, '#335739');
    bgGrad.addColorStop(1, '#182b20');
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = '#335739';
  }
  ctx.fillRect(0, 0, w, h);

  const selectedIdx = typeof simHost.state.selectedPlotIndex === 'number' ? simHost.state.selectedPlotIndex : 27;
  const moveSourceIdx = typeof simHost.state.moveSourcePlotIndex === 'number' ? simHost.state.moveSourcePlotIndex : null;

  // 2. Back-to-Front Painter's Order across all 64 (8x8) Spatial Plots
  const drawOrder = cityIsoAdapter.getDrawOrder(8, 8);
  for (let i = 0; i < drawOrder.length; i++) {
    const cell = drawOrder[i];
    const plot = city.plots[cell.plotIndex];
    if (!plot) continue;

    const polyWorld = cityIsoAdapter.getTilePolygon(cell);
    const pts = polyWorld.map(function(p) { return vp.worldToScreen(p.wx, p.wy); });

    const isSelected = plot.plotIndex === selectedIdx;
    const isMoveSource = plot.plotIndex === moveSourceIdx;
    const isHovered = Boolean(hoveredPlotCoord && hoveredPlotCoord.x === cell.x && hoveredPlotCoord.y === cell.y);
    const bDef = plot.buildingId ? CITY_BUILDINGS_CATALOG[plot.buildingId] : null;

    // Ground tile fill: cobblestone plaza if built, sunlit meadow turf if empty
    let tileFill = bDef ? '#8c857b' : (((cell.x + cell.y) % 2 === 0) ? '#5a8756' : '#4f7a4c');
    if (plot.underConstruction) tileFill = '#786852';
    if (isHovered && !isSelected) tileFill = bDef ? '#a59e93' : '#6ea069';

    let strokeColor = 'rgba(15, 23, 42, 0.35)';
    let strokeW = 1;
    if (isSelected) {
      strokeColor = '#fbbf24';
      strokeW = 2.5;
    } else if (isMoveSource) {
      strokeColor = '#38bdf8';
      strokeW = 2.5;
    } else if (isHovered) {
      strokeColor = '#e2e8f0';
      strokeW = 1.5;
    }

    drawIsoDiamond(ctx, pts, tileFill, strokeColor, strokeW);

    // Subtle highlight overlay on selected plot
    if (isSelected) {
      drawIsoDiamond(ctx, pts, 'rgba(251, 191, 36, 0.22)', '#fbbf24', 2.5);
    }

    // 3D Extruded Isometric Building
    if (bDef) {
      drawExtrudedIsoBuilding(ctx, vp, cell, bDef, plot);
    }
  }
}
