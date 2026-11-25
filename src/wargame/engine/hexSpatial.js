// Overworld Hex Spatial Primitives — Single Source of Truth (Task 03)
// Delegates all axial/cube/odd-r hex math to the canonical createHexGridAdapter() in src/ui/shared/gridAdapters.js.
// Preserves odd-r offset (x = col, y = row) storage for 100% compatibility with existing Overworld maps & saves.

import { createHexGridAdapter } from '../../ui/shared/gridAdapters.js';

// Matches HEX_DIRECTIONS order in src/ui/shared/gridAdapters.js:
// 0: E (+1, 0), 1: NE (+1, -1), 2: NW (0, -1), 3: W (-1, 0), 4: SW (-1, +1), 5: SE (0, +1)
export const HEX_DIR_NAMES = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];

const overworldHexAdapter = createHexGridAdapter({ hexSize: 22 });

export function getOverworldHexAdapter() {
  return overworldHexAdapter;
}

export function isInOverworldBounds(overworld, x, y) {
  if (!overworld || typeof overworld.width !== 'number' || typeof overworld.height !== 'number') return false;
  return x >= 0 && x < overworld.width && y >= 0 && y < overworld.height;
}

export function resolveHexDirectionIndex(dirIndexOrName) {
  if (typeof dirIndexOrName === 'number' && Number.isInteger(dirIndexOrName)) {
    return (dirIndexOrName >= 0 && dirIndexOrName < 6) ? dirIndexOrName : -1;
  }
  if (typeof dirIndexOrName === 'string') {
    const upper = dirIndexOrName.trim().toUpperCase();
    for (let i = 0; i < HEX_DIR_NAMES.length; i++) {
      if (HEX_DIR_NAMES[i] === upper) return i;
    }
  }
  return -1;
}

export function getHexNeighbors(x, y, overworld) {
  const axial = overworldHexAdapter.offsetToAxial(x, y);
  const rawNeighbors = overworldHexAdapter.getNeighbors(axial);
  const results = [];
  for (let i = 0; i < rawNeighbors.length; i++) {
    const off = overworldHexAdapter.axialToOffset(rawNeighbors[i].q, rawNeighbors[i].r);
    if (overworld && !isInOverworldBounds(overworld, off.col, off.row)) {
      continue;
    }
    results.push({
      x: off.col,
      y: off.row,
      dirIndex: i,
      dirName: HEX_DIR_NAMES[i]
    });
  }
  return results;
}

export function getHexNeighborInDirection(x, y, dirIndexOrName, overworld) {
  const dirIdx = resolveHexDirectionIndex(dirIndexOrName);
  if (dirIdx === -1) return null;
  const axial = overworldHexAdapter.offsetToAxial(x, y);
  const rawNeighbors = overworldHexAdapter.getNeighbors(axial);
  const n = rawNeighbors[dirIdx];
  if (!n) return null;
  const off = overworldHexAdapter.axialToOffset(n.q, n.r);
  if (overworld && !isInOverworldBounds(overworld, off.col, off.row)) {
    return null;
  }
  return {
    x: off.col,
    y: off.row,
    dirIndex: dirIdx,
    dirName: HEX_DIR_NAMES[dirIdx]
  };
}

export function getHexDistance(x1, y1, x2, y2) {
  if (x1 === x2 && y1 === y2) return 0;
  const a = overworldHexAdapter.offsetToAxial(x1, y1);
  const b = overworldHexAdapter.offsetToAxial(x2, y2);
  return overworldHexAdapter.getDistance(a, b);
}

export function areHexesAdjacent(x1, y1, x2, y2) {
  return getHexDistance(x1, y1, x2, y2) === 1;
}

export function getHexesInRange(cx, cy, radius, overworld) {
  const r = Math.max(0, Math.floor(typeof radius === 'number' ? radius : 0));
  const centerAxial = overworldHexAdapter.offsetToAxial(cx, cy);
  const spiral = overworldHexAdapter.getSpiral(centerAxial, r);
  const results = [];
  for (let i = 0; i < spiral.length; i++) {
    const off = overworldHexAdapter.axialToOffset(spiral[i].q, spiral[i].r);
    if (overworld && !isInOverworldBounds(overworld, off.col, off.row)) {
      continue;
    }
    results.push({ x: off.col, y: off.row });
  }
  return results;
}
