// =============================================================================
// 2:1 ISOMETRIC BASTION CITY CANVAS RENDERER (ADR-0014 Step 2 — Art Bible §2.2)
// Handcrafted 2:1 isometric architectural models for every town structure
// (carved ashlar stone, half-timbering, terracotta/slate roofs, windmills,
// chimneys, crenellated keeps, stained-glass spires, crop rows & stone wells),
// with automatic Tier 2 AssetRegistry sprite override support.
// =============================================================================

import { createIsoGridAdapter } from '../../ui/shared/gridAdapters.js';
import { createMapViewport } from '../../ui/shared/mapViewport.js';
import { getCachedImage } from '../../ui/shared/assetRegistry.js';
import { CITY_BUILDINGS_CATALOG } from '../data/buildings.js';
import { getPrimaryCity } from '../engine/state.js';

let cityIsoAdapter = null;
let cityViewport = null;
let hoveredPlotCoord = null;
let attachedCanvas = null;

export function ensureCityIsoViewport(canvas) {
  if (!cityIsoAdapter) {
    cityIsoAdapter = createIsoGridAdapter({ tileWidth: 82, tileHeight: 41 });
  }
  const w = canvas ? canvas.width : 660;
  const h = canvas ? canvas.height : 400;
  if (!cityViewport) {
    cityViewport = createMapViewport({
      gridAdapter: cityIsoAdapter,
      viewportWidth: w,
      viewportHeight: h,
      minZoom: 0.65,
      maxZoom: 2.2,
      zoom: 0.96,
      bounds: { minX: -460, maxX: 460, minY: -90, maxY: 460 }
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
      if (!coord || coord.x < 0 || coord.x < 0 || coord.x >= 8 || coord.y < 0 || coord.y >= 8) return;
      const plotIndex = coord.y * 8 + coord.x;
      if (typeof cb.onSelectPlot === 'function') cb.onSelectPlot(plotIndex);
    },
    onCameraChange: function() {
      if (typeof cb.onRepaint === 'function') cb.onRepaint();
    }
  });
}

function drawPoly(ctx, pts, fill, stroke, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  for (let i = 1; i < pts.length; i++) {
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

// Helper: draw an isometric 3D rectangular prism anchored at screen center (cx, cy)
function drawIsoBox(ctx, cx, cy, rx, ry, h, colors) {
  const bTop = { sx: cx, sy: cy - ry };
  const bRight = { sx: cx + rx, sy: cy };
  const bBot = { sx: cx, sy: cy + ry };
  const bLeft = { sx: cx - rx, sy: cy };

  const tTop = { sx: cx, sy: cy - ry - h };
  const tRight = { sx: cx + rx, sy: cy - h };
  const tBot = { sx: cx, sy: cy + ry - h };
  const tLeft = { sx: cx - rx, sy: cy - h };

  // Left sunlit wall
  drawPoly(ctx, [bLeft, bBot, tBot, tLeft], colors.left, 'rgba(15,23,42,0.45)', 0.9);
  // Right shaded wall
  drawPoly(ctx, [bBot, bRight, tRight, tBot], colors.right, 'rgba(15,23,42,0.5)', 0.9);
  // Flat top (if provided)
  if (colors.top) {
    drawPoly(ctx, [tTop, tRight, tBot, tLeft], colors.top, 'rgba(15,23,42,0.35)', 0.8);
  }
  return { bTop: bTop, bRight: bRight, bBot: bBot, bLeft: bLeft, tTop: tTop, tRight: tRight, tBot: tBot, tLeft: tLeft };
}

// Helper: draw a pitched 4-facet roof on top of an IsoBox
function drawPitchedRoof(ctx, box, cx, cy, wallH, peakH, roofLight, roofDark) {
  const apex = { sx: cx, sy: cy - wallH - peakH };
  // Back facets
  drawPoly(ctx, [box.tTop, box.tLeft, apex], roofLight, 'rgba(15,23,42,0.35)', 0.8);
  drawPoly(ctx, [box.tTop, box.tRight, apex], roofDark, 'rgba(15,23,42,0.35)', 0.8);
  // Front facets
  drawPoly(ctx, [box.tLeft, box.tBot, apex], roofLight, 'rgba(255,244,214,0.22)', 0.9);
  drawPoly(ctx, [box.tBot, box.tRight, apex], roofDark, 'rgba(15,23,42,0.45)', 0.9);
  return apex;
}

// Helper: draw warm glowing lit window on left or right wall
function drawIsoWindow(ctx, x, y, w, h, glowColor) {
  ctx.fillStyle = glowColor || '#fde68a';
  ctx.fillRect(x - w * 0.5, y - h * 0.5, w, h);
  ctx.strokeStyle = '#3b2414';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x - w * 0.5, y - h * 0.5, w, h);
}

// Helper: draw fluttering heraldic banner
function drawBanner(ctx, x, y, z, color) {
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = Math.max(1, 1.4 * z);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 13 * z);
  ctx.stroke();

  ctx.fillStyle = color || '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x, y - 13 * z);
  ctx.lineTo(x + 9 * z, y - 10 * z);
  ctx.lineTo(x, y - 7 * z);
  ctx.closePath();
  ctx.fill();
}

// Helper: draw construction timber scaffolding
function drawConstructionScaffolding(ctx, cx, cy, z) {
  drawIsoBox(ctx, cx, cy, 24 * z, 12 * z, 11 * z, { left: '#9a6b3e', right: '#704925', top: '#b88b5a' });
  ctx.strokeStyle = '#d4a373';
  ctx.lineWidth = Math.max(1, 1.3 * z);
  ctx.beginPath();
  ctx.moveTo(cx - 22 * z, cy + 2 * z);
  ctx.lineTo(cx - 22 * z, cy - 22 * z);
  ctx.moveTo(cx + 22 * z, cy + 2 * z);
  ctx.lineTo(cx + 22 * z, cy - 22 * z);
  ctx.moveTo(cx - 22 * z, cy - 16 * z);
  ctx.lineTo(cx + 22 * z, cy - 16 * z);
  ctx.moveTo(cx - 22 * z, cy - 2 * z);
  ctx.lineTo(cx + 22 * z, cy - 16 * z);
  ctx.stroke();
}

// Bespoke Architectural Renderer for every Town Building
function drawArchitecturalBuilding(ctx, vp, coord, bDef, plot, onRepaint) {
  const lvl = plot.level || 1;
  const z = vp.camera.zoom;
  const c = vp.tileToScreen(coord);
  const cx = c.sx;
  const cy = c.sy;
  const id = bDef.id;

  // 0. Check AssetRegistry for future Tier 2 production isometric sprite override
  const spriteId = 'city_bldg_' + id + '_lv' + lvl + '_idle';
  const prodImg = getCachedImage(spriteId, onRepaint);
  if (prodImg && typeof ctx.drawImage === 'function') {
    const sw = 84 * z;
    const sh = 84 * z;
    ctx.drawImage(prodImg, cx - sw * 0.5, cy - sh * 0.72, sw, sh);
    return;
  }

  // Soft 135-degree sunlit contact shadow
  ctx.fillStyle = 'rgba(10, 16, 24, 0.34)';
  ctx.beginPath();
  ctx.ellipse(cx + 5 * z, cy + 4 * z, 28 * z, 13 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  if (plot.underConstruction) {
    drawConstructionScaffolding(ctx, cx, cy, z);
    return;
  }

  // 1. GARDEN / FARMSTEAD: Sunlit plowed earth crop furrows + fence + thatched toolshed
  if (id === 'garden' || id === 'farmstead') {
    const rx = 28 * z;
    const ry = 14 * z;
    // Rich dark soil bed
    drawPoly(ctx, [
      { sx: cx, sy: cy - ry * 0.85 },
      { sx: cx + rx * 0.85, sy: cy },
      { sx: cx, sy: cy + ry * 0.85 },
      { sx: cx - rx * 0.85, sy: cy }
    ], '#5c4028', '#3d2817', 1);

    // Lush green & golden crop rows
    for (let r = -2; r <= 2; r++) {
      const offX = r * 4.5 * z;
      const offY = r * 2.2 * z;
      ctx.strokeStyle = (r % 2 === 0) ? '#4ade80' : '#eab308';
      ctx.lineWidth = Math.max(1.5, 2.4 * z);
      ctx.beginPath();
      ctx.moveTo(cx - 11 * z + offX, cy - 5 * z + offY);
      ctx.lineTo(cx + 11 * z + offX, cy + 5 * z + offY);
      ctx.stroke();
    }
    // Small thatched toolshed at back-top corner
    const shed = drawIsoBox(ctx, cx - 10 * z, cy - 5 * z, 9 * z, 4.5 * z, 7 * z, { left: '#a47148', right: '#704925' });
    drawPitchedRoof(ctx, shed, cx - 10 * z, cy - 5 * z, 7 * z, 5 * z, '#d4a359', '#9c7133');
    return;
  }

  // 2. WELL: Carved stone circular wellhead + azure water + timber canopy
  if (id === 'well') {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2 * z, 13 * z, 7 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 13 * z, cy - 6 * z, 26 * z, 8 * z);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6 * z, 13 * z, 6.5 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();
    // Shimmering water inside
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6 * z, 9 * z, 4.2 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    // Timber posts & peaked shingle canopy
    ctx.strokeStyle = '#7c5233';
    ctx.lineWidth = Math.max(1.5, 2.2 * z);
    ctx.beginPath();
    ctx.moveTo(cx - 10 * z, cy - 6 * z);
    ctx.lineTo(cx - 10 * z, cy - 22 * z);
    ctx.moveTo(cx + 10 * z, cy - 6 * z);
    ctx.lineTo(cx + 10 * z, cy - 22 * z);
    ctx.stroke();
    drawPoly(ctx, [
      { sx: cx, sy: cy - 30 * z },
      { sx: cx + 15 * z, sy: cy - 20 * z },
      { sx: cx, sy: cy - 17 * z },
      { sx: cx - 15 * z, sy: cy - 20 * z }
    ], '#b85a3a', '#6b2c19', 1);
    return;
  }

  // 3. WINDMILL: Tapered stone/timber tower + 4 large wooden lattice sails
  if (id === 'windmill') {
    const base = drawIsoBox(ctx, cx, cy + 2 * z, 14 * z, 7 * z, (24 + lvl * 3) * z, { left: '#cfc7bc', right: '#9b9388' });
    const h = (24 + lvl * 3) * z;
    drawPitchedRoof(ctx, base, cx, cy + 2 * z, h, 10 * z, '#64748b', '#334155');
    // 4 Windmill lattice sails
    const hubX = cx + 6 * z;
    const hubY = cy - h + 4 * z;
    const angles = [0.45, 2.02, 3.59, 5.16];
    for (let a = 0; a < angles.length; a++) {
      const ang = angles[a];
      const ex = hubX + Math.cos(ang) * 20 * z;
      const ey = hubY + Math.sin(ang) * 20 * z;
      ctx.strokeStyle = '#f1e5d1';
      ctx.lineWidth = Math.max(2, 3.2 * z);
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = '#7c5233';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(hubX, hubY, 2.5 * z, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // 4. SILO: Cylindrical reinforced stone grain tower with conical terracotta roof
  if (id === 'silo') {
    const h = (22 + lvl * 3) * z;
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(cx - 12 * z, cy - h, 24 * z, h + 2 * z);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(cx, cy - h, 12 * z, h + 2 * z);
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2 * z, 12 * z, 6 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    // Conical roof
    drawPoly(ctx, [
      { sx: cx, sy: cy - h - 12 * z },
      { sx: cx + 14 * z, sy: cy - h + 1 * z },
      { sx: cx, sy: cy - h + 5 * z },
      { sx: cx - 14 * z, sy: cy - h + 1 * z }
    ], '#b85a3a', '#7c2d12', 1);
    return;
  }

  // 5. LUMBER CAMP / SAWMILL: Timber shed + stacked cut pine logs
  if (id === 'lumber_camp' || id === 'lumber_hut' || id === 'sawmill') {
    const shed = drawIsoBox(ctx, cx - 5 * z, cy - 2 * z, 16 * z, 8 * z, 11 * z, { left: '#a47148', right: '#6b4423' });
    drawPitchedRoof(ctx, shed, cx - 5 * z, cy - 2 * z, 11 * z, 7 * z, '#854d0e', '#573309');
    // Stacked logs in front yard
    for (let l = 0; l < 3; l++) {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(cx + (8 + l * 4) * z, cy + (4 - l * 1.5) * z, 5 * z, 2.5 * z, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5c3415';
      ctx.stroke();
    }
    return;
  }

  // 6. QUARRY / MINE: Stepped terraced stone excavation + timber hoist + ore glints
  if (id === 'quarry' || id === 'mine') {
    drawIsoBox(ctx, cx, cy + 3 * z, 24 * z, 12 * z, 5 * z, { left: '#64748b', right: '#475569', top: '#94a3b8' });
    drawIsoBox(ctx, cx - 4 * z, cy - 1 * z, 14 * z, 7 * z, 7 * z, { left: '#94a3b8', right: '#64748b', top: '#cbd5e1' });
    // Timber A-frame mine hoist
    ctx.strokeStyle = '#7c5233';
    ctx.lineWidth = Math.max(1.5, 2 * z);
    ctx.beginPath();
    ctx.moveTo(cx + 4 * z, cy + 2 * z);
    ctx.lineTo(cx + 10 * z, cy - 18 * z);
    ctx.lineTo(cx + 16 * z, cy + 1 * z);
    ctx.stroke();
    if (id === 'mine') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx - 8 * z, cy - 4 * z, 2.5 * z, 0, Math.PI * 2);
      ctx.arc(cx + 2 * z, cy + 4 * z, 2 * z, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // 7. HUT: Cozy half-timbered frontier cottage + terracotta roof + glowing window + chimney
  if (id === 'hut') {
    const h = (11 + lvl * 2) * z;
    const box = drawIsoBox(ctx, cx, cy + 2 * z, 19 * z, 9.5 * z, h, { left: '#e5dccb', right: '#b8ae9c' });
    // Timber corner beams
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = Math.max(1, 1.6 * z);
    ctx.beginPath();
    ctx.moveTo(box.bBot.sx, box.bBot.sy);
    ctx.lineTo(box.tBot.sx, box.tBot.sy);
    ctx.stroke();
    drawIsoWindow(ctx, cx - 9 * z, cy - h * 0.45 + 3 * z, 5 * z, 5 * z, '#fde68a');
    drawPitchedRoof(ctx, box, cx, cy + 2 * z, h, 10 * z, '#c2593a', '#8c3820');
    // Chimney
    drawIsoBox(ctx, cx + 6 * z, cy - h - 2 * z, 3.5 * z, 2 * z, 8 * z, { left: '#78716c', right: '#57534e', top: '#a8a29e' });
    return;
  }

  // 8. SMELTERY / BLACKSMITH / STAR-FORGE: Ashlar foundry + smoking chimney + glowing furnace
  if (id === 'smeltery' || id === 'blacksmith' || id === 'star_forge') {
    const h = (14 + lvl * 2.5) * z;
    const box = drawIsoBox(ctx, cx, cy + 2 * z, 23 * z, 11.5 * z, h, { left: '#57534e', right: '#3b3734' });
    drawPitchedRoof(ctx, box, cx, cy + 2 * z, h, 9 * z, '#334155', '#1e293b');
    // Tall blast chimney
    drawIsoBox(ctx, cx - 10 * z, cy - h + 1 * z, 5 * z, 2.5 * z, 15 * z, { left: '#78716c', right: '#44403c', top: '#292524' });
    // Glowing furnace arch
    const glow = id === 'star_forge' ? '#38bdf8' : '#f97316';
    drawIsoWindow(ctx, cx + 9 * z, cy - 3 * z, 7 * z, 8 * z, glow);
    // Smoke puff
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.beginPath();
    ctx.arc(cx - 10 * z, cy - h - 18 * z, 4 * z, 0, Math.PI * 2);
    ctx.arc(cx - 6 * z, cy - h - 23 * z, 5.5 * z, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // 9. GARRISON: Crenellated Ashlar Fortress Keep + Iron Portcullis + War Banner
  if (id === 'garrison' || id === 'barracks') {
    const h = (18 + lvl * 3) * z;
    drawIsoBox(ctx, cx, cy + 2 * z, 25 * z, 12.5 * z, h, { left: '#94a3b8', right: '#64748b', top: '#cbd5e1' });
    // Corner crenellated watch-turrets
    drawIsoBox(ctx, cx - 15 * z, cy - h + 4 * z, 6 * z, 3 * z, 7 * z, { left: '#cbd5e1', right: '#64748b', top: '#e2e8f0' });
    drawIsoBox(ctx, cx + 15 * z, cy - h + 4 * z, 6 * z, 3 * z, 7 * z, { left: '#cbd5e1', right: '#64748b', top: '#e2e8f0' });
    // Portcullis gate
    drawIsoWindow(ctx, cx - 10 * z, cy - 3 * z, 7 * z, 9 * z, '#1e293b');
    drawBanner(ctx, cx, cy - h - 2 * z, z, '#ef4444');
    return;
  }

  // 10. TEMPLE CHAPTERHOUSE / SHRINE: Pale limestone sanctuary + tall golden spire + stained glass
  if (id === 'temple_chapterhouse' || id === 'shrine') {
    const h = (16 + lvl * 3) * z;
    const nave = drawIsoBox(ctx, cx, cy + 2 * z, 23 * z, 11.5 * z, h, { left: '#f1f5f9', right: '#cbd5e1' });
    const apex = drawPitchedRoof(ctx, nave, cx, cy + 2 * z, h, 14 * z, '#e2e8f0', '#94a3b8');
    // Golden spire
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = Math.max(1.5, 2.2 * z);
    ctx.beginPath();
    ctx.moveTo(apex.sx, apex.sy);
    ctx.lineTo(apex.sx, apex.sy - 14 * z);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(apex.sx, apex.sy - 14 * z, 3 * z, 0, Math.PI * 2);
    ctx.fill();
    // Radiant stained-glass window
    drawIsoWindow(ctx, cx - 10 * z, cy - h * 0.45 + 2 * z, 6 * z, 8 * z, '#fef08a');
    return;
  }

  // 11. MEETING HALL / TOWN HALL: Grand Tiered Stone Citadel + Central Clock Turret + Gold Banner
  if (id === 'meeting_hall' || id === 'town_hall') {
    const h = (20 + lvl * 3.5) * z;
    const main = drawIsoBox(ctx, cx, cy + 2 * z, 27 * z, 13.5 * z, h, { left: '#d6cfc2', right: '#9b9388' });
    const apex = drawPitchedRoof(ctx, main, cx, cy + 2 * z, h, 12 * z, '#475569', '#1e293b');
    // Central gold-capped tower
    const tower = drawIsoBox(ctx, cx, apex.sy + 4 * z, 9 * z, 4.5 * z, 10 * z, { left: '#e2d9c8', right: '#a89f91' });
    const tApex = drawPitchedRoof(ctx, tower, cx, apex.sy + 4 * z, 10 * z, 8 * z, '#d97706', '#92400e');
    drawBanner(ctx, tApex.sx, tApex.sy, z, '#fbbf24');
    // Arched entrance & warm windows
    drawIsoWindow(ctx, cx - 12 * z, cy - 3 * z, 7 * z, 9 * z, '#78350f');
    drawIsoWindow(ctx, cx + 11 * z, cy - h * 0.5, 5 * z, 5 * z, '#fde68a');
    return;
  }

  // 12. ALL GUILDS, APOTHECARY, LAPIDARY & WAREHOUSE: Grand Two-Story Timber & Stone Hall + Domain Accent
  const h = (15 + lvl * 2.5) * z;
  const roofMap = {
    guild_hall:     ['#3b82f6', '#1d4ed8', '#fbbf24'],
    fighters_guild: ['#dc2626', '#991b1b', '#f87171'],
    thieves_guild:  ['#4c1d95', '#2e1065', '#c084fc'],
    mages_guild:    ['#4338ca', '#1e1b4b', '#38bdf8'],
    rangers_lodge:  ['#15803d', '#14532d', '#4ade80'],
    apothecary:     ['#0f766e', '#115e59', '#34d399'],
    lapidary:       ['#6d28d9', '#4c1d95', '#e879f9'],
    warehouse:      ['#64748b', '#334155', '#fbbf24']
  };
  const pal = roofMap[id] || ['#b85a3a', '#7c2d12', '#fbbf24'];
  const hall = drawIsoBox(ctx, cx, cy + 2 * z, 24 * z, 12 * z, h, { left: '#d6cfc2', right: '#9b9388' });
  const hallApex = drawPitchedRoof(ctx, hall, cx, cy + 2 * z, h, 11 * z, pal[0], pal[1]);

  // Warm glowing windows & timber doorway
  drawIsoWindow(ctx, cx - 11 * z, cy - h * 0.5 + 2 * z, 5.5 * z, 5.5 * z, '#fde68a');
  drawIsoWindow(ctx, cx + 11 * z, cy - h * 0.5 + 2 * z, 5.5 * z, 5.5 * z, id === 'mages_guild' ? '#38bdf8' : '#fde68a');
  drawBanner(ctx, hallApex.sx, hallApex.sy, z, pal[2]);
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
  const z = vp.camera.zoom;

  // 1. Sunlit Golden-Hour Meadow Backdrop (Art Bible §2.1 & §2.2)
  if (typeof ctx.createRadialGradient === 'function') {
    const bgGrad = ctx.createRadialGradient(w * 0.35, h * 0.25, 40, w * 0.5, h * 0.5, w * 0.78);
    bgGrad.addColorStop(0, '#5a8f5c');
    bgGrad.addColorStop(0.65, '#355c3c');
    bgGrad.addColorStop(1, '#182b20');
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = '#355c3c';
  }
  ctx.fillRect(0, 0, w, h);

  const selectedIdx = typeof simHost.state.selectedPlotIndex === 'number' ? simHost.state.selectedPlotIndex : 27;
  const moveSourceIdx = typeof simHost.state.moveSourcePlotIndex === 'number' ? simHost.state.moveSourcePlotIndex : null;

  // 2. Back-to-Front Painter's Order across all 64 (8x8) Spatial Plots
  const drawOrder = cityIsoAdapter.getDrawOrder(8, 8);
  const repaintFn = function() { renderCityIsoCanvas(simHost); };

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

    // Ground tile: carved cobblestone plaza if built, sunlit meadow turf if empty
    let tileFill = bDef ? '#8c857b' : (((cell.x + cell.y) % 2 === 0) ? '#5e8c59' : '#53804f');
    if (plot.underConstruction) tileFill = '#7c6a53';
    if (isHovered && !isSelected) tileFill = bDef ? '#a59e93' : '#74a86e';

    let strokeColor = bDef ? 'rgba(40, 36, 32, 0.45)' : 'rgba(20, 40, 24, 0.28)';
    let strokeW = 1;
    if (isSelected) {
      strokeColor = '#fbbf24';
      strokeW = 2.5;
    } else if (isMoveSource) {
      strokeColor = '#38bdf8';
      strokeW = 2.5;
    } else if (isHovered) {
      strokeColor = '#fef08a';
      strokeW = 1.6;
    }

    drawPoly(ctx, pts, tileFill, strokeColor, strokeW);

    if (isSelected) {
      drawPoly(ctx, pts, 'rgba(251, 191, 36, 0.22)', '#fbbf24', 2.5);
    }

    // Bespoke Architectural Isometric Building
    if (bDef) {
      drawArchitecturalBuilding(ctx, vp, cell, bDef, plot, repaintFn);

      // Subtle Level Pill on hover/select only (keeps cityscape clean & architectural!)
      if (isSelected || isHovered) {
        const center = vp.tileToScreen(cell);
        const label = bDef.name + ' Lv ' + (plot.level || 1);
        ctx.font = 'bold ' + Math.max(9, Math.round(10 * z)) + 'px monospace';
        const tw = Math.max(64, label.length * 6.2) * z;
        ctx.fillStyle = 'rgba(8, 11, 17, 0.88)';
        ctx.fillRect(center.sx - tw * 0.5, center.sy + 9 * z, tw, 14 * z);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.strokeRect(center.sx - tw * 0.5, center.sy + 9 * z, tw, 14 * z);
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, center.sx, center.sy + 16 * z);
      }
    }
  }
}
