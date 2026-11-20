// =============================================================================
// UNIFIED GRID ADAPTERS (ADR-0014 — Path A: Best-in-Class Domain Projections)
// Pure, deterministic, zero-DOM ES2017 coordinate & topology math shared across:
//   1. OrthoGridAdapter (Dungeon 2.5D Oblique Square Grid)
//   2. IsoGridAdapter   (Bastion City 2:1 Rotated Square Isometric Diamond Grid)
//   3. HexGridAdapter   (Overworld Pointy-Top Hexagonal Axial/Cube Grid)
// =============================================================================

const SQRT3 = Math.sqrt(3);

export const GRID_TYPES = {
  ORTHO: 'ortho',
  ISO: 'iso',
  HEX_POINTY: 'hex_pointy'
};

// ---------------------------------------------------------------------------
// 1. ORTHOGONAL SQUARE GRID ADAPTER (Starfall Vaults — 2.5D Oblique Dungeon)
// ---------------------------------------------------------------------------
export function createOrthoGridAdapter(options) {
  const opts = options || {};
  const tw = opts.tileWidth || 32;
  const th = opts.tileHeight || 32;

  return {
    type: GRID_TYPES.ORTHO,
    tileWidth: tw,
    tileHeight: th,

    tileToWorld: function(coord) {
      return {
        wx: (coord.x + 0.5) * tw,
        wy: (coord.y + 0.5) * th
      };
    },

    worldToTile: function(wx, wy) {
      return {
        x: Math.floor(wx / tw),
        y: Math.floor(wy / th)
      };
    },

    getNeighbors: function(coord, includeDiagonals) {
      const x = coord.x;
      const y = coord.y;
      const list = [
        { x: x, y: y - 1 },
        { x: x + 1, y: y },
        { x: x, y: y + 1 },
        { x: x - 1, y: y }
      ];
      if (includeDiagonals) {
        list.push(
          { x: x + 1, y: y - 1 },
          { x: x + 1, y: y + 1 },
          { x: x - 1, y: y + 1 },
          { x: x - 1, y: y - 1 }
        );
      }
      return list;
    },

    getDistance: function(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    },

    getTilePolygon: function(coord) {
      const x0 = coord.x * tw;
      const y0 = coord.y * th;
      return [
        { wx: x0, wy: y0 },
        { wx: x0 + tw, wy: y0 },
        { wx: x0 + tw, wy: y0 + th },
        { wx: x0, wy: y0 + th }
      ];
    }
  };
}

// ---------------------------------------------------------------------------
// 2. ROTATED SQUARE (2:1 ISOMETRIC DIAMOND) ADAPTER (Bastion City 8x8 Plots)
// ---------------------------------------------------------------------------
export function createIsoGridAdapter(options) {
  const opts = options || {};
  const tw = opts.tileWidth || 96;
  const th = opts.tileHeight || 48;
  const halfW = tw / 2;
  const halfH = th / 2;

  return {
    type: GRID_TYPES.ISO,
    tileWidth: tw,
    tileHeight: th,

    tileToWorld: function(coord) {
      return {
        wx: (coord.x - coord.y) * halfW,
        wy: (coord.x + coord.y) * halfH
      };
    },

    worldToTile: function(wx, wy) {
      const fx = (wx / halfW + wy / halfH) * 0.5;
      const fy = (wy / halfH - wx / halfW) * 0.5;
      return {
        x: Math.round(fx),
        y: Math.round(fy)
      };
    },

    getNeighbors: function(coord) {
      const x = coord.x;
      const y = coord.y;
      return [
        { x: x, y: y - 1 },
        { x: x + 1, y: y },
        { x: x, y: y + 1 },
        { x: x - 1, y: y }
      ];
    },

    getDistance: function(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    },

    getTilePolygon: function(coord) {
      const c = this.tileToWorld(coord);
      return [
        { wx: c.wx, wy: c.wy - halfH },
        { wx: c.wx + halfW, wy: c.wy },
        { wx: c.wx, wy: c.wy + halfH },
        { wx: c.wx - halfW, wy: c.wy }
      ];
    },

    // Back-to-front painter's sort order for isometric 3D building overlap
    getDrawOrder: function(cols, rows) {
      const order = [];
      for (let sum = 0; sum <= (cols - 1) + (rows - 1); sum++) {
        for (let x = 0; x < cols; x++) {
          const y = sum - x;
          if (y >= 0 && y < rows) {
            order.push({ x: x, y: y, plotIndex: y * cols + x });
          }
        }
      }
      return order;
    }
  };
}

// ---------------------------------------------------------------------------
// 3. POINTY-TOP HEXAGONAL GRID ADAPTER (Overworld Macro Strategy — Axial/Cube)
// Implements Red Blob Games canonical axial (q, r) & cube (q, r, s) math.
// ---------------------------------------------------------------------------
const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

function cubeRound(fq, fr) {
  const fs = -fq - fr;
  let rq = Math.round(fq);
  let rr = Math.round(fr);
  const rs = Math.round(fs);

  const qDiff = Math.abs(rq - fq);
  const rDiff = Math.abs(rr - fr);
  const sDiff = Math.abs(rs - fs);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq === 0 ? 0 : rq, r: rr === 0 ? 0 : rr };
}

export function createHexGridAdapter(options) {
  const opts = options || {};
  const size = opts.hexSize || 28;

  return {
    type: GRID_TYPES.HEX_POINTY,
    hexSize: size,
    tileWidth: SQRT3 * size,
    tileHeight: 2 * size,

    tileToWorld: function(coord) {
      const q = coord.q;
      const r = coord.r;
      return {
        wx: size * (SQRT3 * q + (SQRT3 * 0.5) * r),
        wy: size * (1.5 * r)
      };
    },

    worldToTile: function(wx, wy) {
      const fq = ((SQRT3 / 3) * wx - (1 / 3) * wy) / size;
      const fr = ((2 / 3) * wy) / size;
      return cubeRound(fq, fr);
    },

    getNeighbors: function(coord) {
      const out = [];
      for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
        out.push({
          q: coord.q + HEX_DIRECTIONS[i].q,
          r: coord.r + HEX_DIRECTIONS[i].r
        });
      }
      return out;
    },

    getDistance: function(a, b) {
      const dq = a.q - b.q;
      const dr = a.r - b.r;
      return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) * 0.5;
    },

    getRing: function(center, radius) {
      if (radius <= 0) return [{ q: center.q, r: center.r }];
      const results = [];
      let curQ = center.q + HEX_DIRECTIONS[4].q * radius;
      let curR = center.r + HEX_DIRECTIONS[4].r * radius;
      for (let side = 0; side < 6; side++) {
        for (let step = 0; step < radius; step++) {
          results.push({ q: curQ, r: curR });
          curQ += HEX_DIRECTIONS[side].q;
          curR += HEX_DIRECTIONS[side].r;
        }
      }
      return results;
    },

    getSpiral: function(center, maxRadius) {
      const results = [{ q: center.q, r: center.r }];
      for (let rad = 1; rad <= maxRadius; rad++) {
        const ring = this.getRing(center, rad);
        for (let i = 0; i < ring.length; i++) {
          results.push(ring[i]);
        }
      }
      return results;
    },

    // Odd-r offset (col, row) <-> Axial (q, r) for lossless legacy Overworld coordinate migration
    offsetToAxial: function(col, row) {
      const q = col - Math.floor((row - (row & 1)) / 2);
      return { q: q, r: row };
    },

    axialToOffset: function(q, r) {
      const col = q + Math.floor((r - (r & 1)) / 2);
      return { col: col, row: r };
    },

    getTilePolygon: function(coord) {
      const c = this.tileToWorld(coord);
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angleRad = (Math.PI / 180) * (60 * i - 30);
        pts.push({
          wx: c.wx + size * Math.cos(angleRad),
          wy: c.wy + size * Math.sin(angleRad)
        });
      }
      return pts;
    }
  };
}
