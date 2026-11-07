// Compact Run-Length Encoding (RLE) & Lazy Floor Hydration for Large Multi-Dungeon Saves

import { DEFAULT_MAP_W, DEFAULT_MAP_H } from '../constants.js';

export function createUint8Grid(width, height, fillVal = 0) {
  const rows = new Array(height);
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(width);
    if (fillVal !== 0) row.fill(fillVal);
    rows[y] = row;
  }
  return rows;
}

export function encodeGridToRle(grid, width, height, boolMode = false) {
  if (!grid || height <= 0 || width <= 0) return '';
  const parts = [];
  let curVal = -1;
  let runLen = 0;

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const raw = row ? row[x] : 0;
      const v = boolMode ? (raw ? 1 : 0) : (raw | 0);
      if (v === curVal) {
        runLen += 1;
      } else {
        if (runLen > 0) {
          parts.push(runLen > 1 ? `${curVal}:${runLen}` : `${curVal}`);
        }
        curVal = v;
        runLen = 1;
      }
    }
  }
  if (runLen > 0) {
    parts.push(runLen > 1 ? `${curVal}:${runLen}` : `${curVal}`);
  }
  return parts.join(',');
}

export function decodeRleToGrid(rleStr, width, height) {
  const rows = createUint8Grid(width, height, 0);
  if (!rleStr || typeof rleStr !== 'string') return rows;

  const total = width * height;
  let cellIdx = 0;
  let i = 0;
  const len = rleStr.length;

  while (i < len && cellIdx < total) {
    let val = 0;
    while (i < len) {
      const c = rleStr.charCodeAt(i);
      if (c >= 48 && c <= 57) {
        val = val * 10 + (c - 48);
        i += 1;
      } else {
        break;
      }
    }

    let count = 1;
    if (i < len && rleStr.charCodeAt(i) === 58) { // ':'
      i += 1;
      count = 0;
      while (i < len) {
        const c = rleStr.charCodeAt(i);
        if (c >= 48 && c <= 57) {
          count = count * 10 + (c - 48);
          i += 1;
        } else {
          break;
        }
      }
      if (count <= 0) count = 1;
    }

    if (i < len && rleStr.charCodeAt(i) === 44) { // ','
      i += 1;
    }

    const endIdx = Math.min(total, cellIdx + count);
    if (val !== 0) {
      while (cellIdx < endIdx) {
        const r = (cellIdx / width) | 0;
        const col = cellIdx - r * width;
        rows[r][col] = val;
        cellIdx += 1;
      }
    } else {
      cellIdx = endIdx;
    }
  }

  return rows;
}

export function packFloorForStorage(floor) {
  if (!floor) return null;
  if (floor.packed && typeof floor.tilesRle === 'string') {
    return floor;
  }
  const h = floor.height || (floor.tiles ? floor.tiles.length : DEFAULT_MAP_H);
  const w = floor.width || (floor.tiles && floor.tiles[0] ? floor.tiles[0].length : DEFAULT_MAP_W);

  return {
    packed: true,
    depth: floor.depth || 1,
    width: w,
    height: h,
    roomCount: floor.roomCount || 0,
    upPos: floor.upPos || { x: 2, y: 2 },
    downPos: floor.downPos || { x: w - 3, y: h - 3 },
    hasDownStairs: floor.hasDownStairs !== undefined ? !!floor.hasDownStairs : true,
    shrines: floor.shrines || {},
    traps: floor.traps || {},
    vaults: floor.vaults || [],
    monsters: Array.isArray(floor.monsters) ? floor.monsters : [],
    oresMined: floor.oresMined || 0,
    tilesRle: encodeGridToRle(floor.tiles, w, h, false),
    exploredRle: encodeGridToRle(floor.explored, w, h, true)
  };
}

export function hydrateFloorFromStorage(rawFloor) {
  if (!rawFloor) return null;
  if (!rawFloor.packed && rawFloor.tiles && rawFloor.tiles.length > 0) {
    const h = rawFloor.height || rawFloor.tiles.length;
    const w = rawFloor.width || rawFloor.tiles[0].length;
    rawFloor.packed = false;
    rawFloor.width = w;
    rawFloor.height = h;
    rawFloor.shrines = rawFloor.shrines || {};
    rawFloor.traps = rawFloor.traps || {};
    rawFloor.vaults = rawFloor.vaults || [];
    if (rawFloor.hasDownStairs === undefined) rawFloor.hasDownStairs = true;
    return rawFloor;
  }

  const w = rawFloor.width || DEFAULT_MAP_W;
  const h = rawFloor.height || DEFAULT_MAP_H;
  return {
    packed: false,
    depth: rawFloor.depth || 1,
    width: w,
    height: h,
    roomCount: rawFloor.roomCount || 0,
    tiles: decodeRleToGrid(rawFloor.tilesRle || '', w, h),
    explored: decodeRleToGrid(rawFloor.exploredRle || '', w, h),
    upPos: rawFloor.upPos || { x: 2, y: 2 },
    downPos: rawFloor.downPos || { x: w - 3, y: h - 3 },
    hasDownStairs: rawFloor.hasDownStairs !== undefined ? !!rawFloor.hasDownStairs : true,
    shrines: rawFloor.shrines || {},
    traps: rawFloor.traps || {},
    vaults: rawFloor.vaults || [],
    monsters: Array.isArray(rawFloor.monsters) ? rawFloor.monsters : [],
    oresMined: rawFloor.oresMined || 0
  };
}
