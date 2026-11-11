// A* Terrain-Weighted Pathfinding & Overworld Procedural Generation Engine

import {
  OVERWORLD_MAP_W,
  OVERWORLD_MAP_H
} from '../constants.js';
import {
  OW_TERRAIN_PLAINS,
  OW_TERRAIN_FOREST,
  OW_TERRAIN_HILLS,
  OW_TERRAIN_MOUNTAINS,
  OW_TERRAIN_WATER,
  OW_TERRAIN_FERTILE_VALE,
  OVERWORLD_TERRAIN_DEFS,
  UNIT_ARCHETYPES
} from '../data/terrain.js';
import { createSeededRng, hashSeedString } from '../../engine/rng.js';

export function generateOverworldMap(width = OVERWORLD_MAP_W, height = OVERWORLD_MAP_H, seedCode = 'STAR-7777') {
  const numSeed = typeof seedCode === 'number' ? seedCode : hashSeedString(String(seedCode), 404);
  const rng = createSeededRng(numSeed);

  const tiles = [];
  const explored = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    const expRow = [];
    for (let x = 0; x < width; x++) {
      expRow.push(false);

      // Outer border is impassable Star-Spire Mountains
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push(OW_TERRAIN_MOUNTAINS);
        continue;
      }

      const nx = x / width;
      const ny = y / height;
      const distCenter = Math.hypot(nx - 0.5, ny - 0.5);
      const r = rng();

      if (distCenter > 0.43 && r < 0.65) {
        row.push(r < 0.35 ? OW_TERRAIN_MOUNTAINS : OW_TERRAIN_HILLS);
      } else if (distCenter > 0.30 && r < 0.32) {
        row.push(OW_TERRAIN_HILLS);
      } else if (r < 0.22) {
        row.push(OW_TERRAIN_FOREST);
      } else if (r < 0.28) {
        row.push(OW_TERRAIN_HILLS);
      } else if (r < 0.33 && ny > 0.58) {
        row.push(OW_TERRAIN_WATER);
      } else if (r > 0.90) {
        row.push(OW_TERRAIN_FERTILE_VALE);
      } else {
        row.push(OW_TERRAIN_PLAINS);
      }
    }
    tiles.push(row);
    explored.push(expRow);
  }

  // Carve fertile pioneer starting valley near center
  const spawnX = Math.floor(width / 2);
  const spawnY = Math.floor(height / 2);

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const ty = spawnY + dy;
      const tx = spawnX + dx;
      if (ty > 0 && ty < height - 1 && tx > 0 && tx < width - 1) {
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          tiles[ty][tx] = OW_TERRAIN_FERTILE_VALE;
        } else {
          tiles[ty][tx] = OW_TERRAIN_PLAINS;
        }
      }
    }
  }

  // Guarantee accessible forest & hills near starting basin
  tiles[spawnY - 2][spawnX - 2] = OW_TERRAIN_FOREST;
  tiles[spawnY - 2][spawnX - 1] = OW_TERRAIN_FOREST;
  tiles[spawnY + 2][spawnX + 2] = OW_TERRAIN_HILLS;
  tiles[spawnY + 2][spawnX + 1] = OW_TERRAIN_HILLS;

  // Points of Interest (Resource Caches, Timber Camps, Quarries, and Dungeon Entrances)
  const pois = [
    {
      id: 'poi_cache_1',
      type: 'resource_cache',
      name: 'Pioneer Supply Cache',
      x: spawnX - 2,
      y: spawnY,
      depleted: false,
      yield: { wood: 35, stone: 25, food: 20 }
    },
    {
      id: 'poi_timber_1',
      type: 'timber_camp',
      name: 'Elderwood Timber Grove',
      x: spawnX - 3,
      y: spawnY - 2,
      depleted: false,
      yield: { wood: 45 }
    },
    {
      id: 'poi_quarry_1',
      type: 'stone_outcrop',
      name: 'Dwarven Mason Quarry',
      x: spawnX + 3,
      y: spawnY + 2,
      depleted: false,
      yield: { stone: 45 }
    },
    {
      id: 'poi_dungeon_starfall',
      type: 'dungeon_entrance',
      name: 'The Starfall Vaults',
      dungeonId: 'dng_starfall',
      x: spawnX + 5,
      y: spawnY - 3,
      depleted: false
    }
  ];

  // Ensure all POIs sit on passable terrain and have a clear path from spawn
  for (let i = 0; i < pois.length; i++) {
    const p = pois[i];
    if (tiles[p.y] && (tiles[p.y][p.x] === OW_TERRAIN_MOUNTAINS || tiles[p.y][p.x] === OW_TERRAIN_WATER)) {
      tiles[p.y][p.x] = OW_TERRAIN_PLAINS;
    }
  }

  // Spawn ONLY the Pioneer Settler unit initially (NO Dungeon Hero exists yet!)
  const settlerArch = UNIT_ARCHETYPES.settler;
  const settlerUnit = {
    id: 'unit_settler_1',
    name: settlerArch.name,
    shortName: settlerArch.shortName,
    unitType: 'settler',
    x: spawnX,
    y: spawnY,
    hp: settlerArch.maxHp,
    maxHp: settlerArch.maxHp,
    visionRadius: settlerArch.visionRadius,
    canFoundCity: true,
    canEnterDungeon: false,
    alive: true,
    status: 'idle', // 'idle' | 'marching' | 'settled'
    marchPlan: null
  };

  const ow = {
    width: width,
    height: height,
    seedCode: String(seedCode),
    spawnX: spawnX,
    spawnY: spawnY,
    tiles: tiles,
    explored: explored,
    pois: pois,
    units: [settlerUnit],
    selectedUnitId: settlerUnit.id
  };

  revealOverworldVision(ow, spawnX, spawnY, settlerUnit.visionRadius);

  return ow;
}

export function revealOverworldVision(overworld, cx, cy, radius = 4) {
  if (!overworld || !overworld.explored) return;
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const y = cy + dy;
      const x = cx + dx;
      if (y >= 0 && y < overworld.height && x >= 0 && x < overworld.width) {
        if (Math.hypot(dx, dy) <= radius + 0.35) {
          overworld.explored[y][x] = true;
        }
      }
    }
  }
}

export function isOverworldTilePassable(overworld, x, y) {
  if (!overworld || !overworld.tiles) return false;
  if (x < 0 || x >= overworld.width || y < 0 || y >= overworld.height) return false;
  const tId = overworld.tiles[y][x];
  const tDef = OVERWORLD_TERRAIN_DEFS[tId];
  return Boolean(tDef && tDef.passable);
}

export function getOverworldTileMarchCostMs(overworld, x, y) {
  if (!overworld || !overworld.tiles) return 3000;
  if (x < 0 || x >= overworld.width || y < 0 || y >= overworld.height) return Infinity;
  const tId = overworld.tiles[y][x];
  const tDef = OVERWORLD_TERRAIN_DEFS[tId];
  return tDef ? tDef.marchTimeMs : 3000;
}

// Terrain-weighted A* Pathfinding on the Overworld Grid
export function findOverworldPath(overworld, startX, startY, targetX, targetY, maxNodes = 2500) {
  if (!overworld || !overworld.tiles) return null;
  if (startX === targetX && startY === targetY) return [];
  if (!isOverworldTilePassable(overworld, targetX, targetY)) return null;

  const w = overworld.width;
  const h = overworld.height;
  const startKey = startY * w + startX;
  const targetKey = targetY * w + targetX;

  const gScore = {};
  const fScore = {};
  const cameFrom = {};
  const closed = {};

  gScore[startKey] = 0;
  fScore[startKey] = (Math.abs(targetX - startX) + Math.abs(targetY - startY)) * 3000;

  const openList = [startKey];
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
  ];

  let visited = 0;
  while (openList.length > 0 && visited < maxNodes) {
    visited++;

    // Find node with lowest fScore
    let bestIdx = 0;
    let bestKey = openList[0];
    let bestF = fScore[bestKey] !== undefined ? fScore[bestKey] : Infinity;
    for (let i = 1; i < openList.length; i++) {
      const k = openList[i];
      const fk = fScore[k] !== undefined ? fScore[k] : Infinity;
      if (fk < bestF) {
        bestF = fk;
        bestKey = k;
        bestIdx = i;
      }
    }

    openList.splice(bestIdx, 1);

    if (bestKey === targetKey) {
      // Reconstruct path (excluding start tile)
      const path = [];
      let curr = targetKey;
      while (curr !== startKey) {
        const px = curr % w;
        const py = Math.floor(curr / w);
        path.push({
          x: px,
          y: py,
          stepDurationMs: getOverworldTileMarchCostMs(overworld, px, py)
        });
        curr = cameFrom[curr];
      }
      path.reverse();
      return path;
    }

    closed[bestKey] = true;
    const cx = bestKey % w;
    const cy = Math.floor(bestKey / w);
    const curG = gScore[bestKey];

    for (let d = 0; d < dirs.length; d++) {
      const nx = cx + dirs[d].dx;
      const ny = cy + dirs[d].dy;
      if (!isOverworldTilePassable(overworld, nx, ny)) continue;

      const nKey = ny * w + nx;
      if (closed[nKey]) continue;

      const stepCost = getOverworldTileMarchCostMs(overworld, nx, ny);
      const tentativeG = curG + stepCost;

      if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
        cameFrom[nKey] = bestKey;
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + (Math.abs(targetX - nx) + Math.abs(targetY - ny)) * 3000;
        if (openList.indexOf(nKey) === -1) {
          openList.push(nKey);
        }
      }
    }
  }

  return null;
}
