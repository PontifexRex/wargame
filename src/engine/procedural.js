// Multi-Style Sector-Grid Procedural Floor Generator, Fast O(W*H) BFS, Declarative Spawns & Socketed Gear

import {
  DEFAULT_MAP_W,
  DEFAULT_MAP_H,
  TILE_WALL,
  TILE_FLOOR,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN,
  TILE_CHEST,
  TILE_CHEST_OPEN,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_HIDDEN,
  TILE_TRAP_DISARMED,
  TILE_ORE_COPPER,
  RARITY
} from '../constants.js';
import { AFFIX_POOL, BASE_GEAR_NAMES, ELITE_AFFIXES } from '../data/items.js';
import { MONSTER_ARCHETYPES, BOSS_ARCHETYPES } from '../data/monsters.js';
import { normalizeDungeonConfig, resolveFloorBiome } from '../data/dungeons.js';
import { createSeededRng } from './rng.js';
import { createUint8Grid } from './compression.js';
import { nextItemUid } from './state.js';

export function rollSocketCountForRarity(rarityKey, slot) {
  if (slot === 'pickaxe') return 0;
  if (rarityKey === 'relic') return 2;
  if (rarityKey === 'epic') return Math.random() < 0.60 ? 2 : 1;
  if (rarityKey === 'rare') return Math.random() < 0.25 ? 2 : 1;
  return 0;
}

export function generateProceduralEquipment(depth = 1, forcedRarity = null, forcedSlot = null, rarityBonus = 0) {
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];

  let rarityKey = forcedRarity;
  if (!rarityKey) {
    const roll = Math.random() + (depth * 0.04) + (rarityBonus || 0);
    if (roll > 1.22) rarityKey = 'relic';
    else if (roll > 0.94) rarityKey = 'epic';
    else if (roll > 0.64) rarityKey = 'rare';
    else if (roll > 0.32) rarityKey = 'uncommon';
    else rarityKey = 'common';
  }

  const rDef = RARITY[rarityKey] || RARITY.common;
  const baseTitle = BASE_GEAR_NAMES[slot][Math.floor(Math.random() * BASE_GEAR_NAMES[slot].length)];
  const item = {
    uid: nextItemUid('gear'),
    slot,
    rarity: rarityKey,
    name: baseTitle,
    value: Math.round((18 + depth * 6) * rDef.mult),
    affixes: [],
    maxSockets: rollSocketCountForRarity(rarityKey, slot),
    sockets: []
  };

  // Primary stat by slot
  if (slot === 'weapon') {
    item.atk = Math.round((5 + depth * 2.2) * (rarityKey === 'relic' ? 1.35 : 1.0));
  } else if (slot === 'armor') {
    item.def = Math.round((4 + depth * 1.8) * (rarityKey === 'relic' ? 1.35 : 1.0));
  } else if (slot === 'helm') {
    item.def = Math.round(2 + depth * 0.9);
    item.maxHp = Math.round(8 + depth * 4);
  } else if (slot === 'boots') {
    item.def = Math.round(1 + depth * 0.8);
    item.dodge = Math.round(2 + depth * 1.1);
  } else if (slot === 'accessory') {
    item.crit = Math.round(3 + depth * 1.0);
    item.maxMp = Math.round(8 + depth * 3);
  }

  // Roll Affixes based on rarity
  const eligible = AFFIX_POOL.filter(a => a.slots.includes(slot));
  const picked = [];
  for (let i = 0; i < rDef.affixes && eligible.length > 0; i++) {
    const remaining = eligible.filter(a => !picked.some(p => p.id === a.id));
    if (remaining.length === 0) break;
    const aff = remaining[Math.floor(Math.random() * remaining.length)];
    const val = aff.min + Math.floor(Math.random() * (aff.max - aff.min + 1)) + Math.floor(depth * 0.4);
    item[aff.stat] = (item[aff.stat] || 0) + val;
    picked.push({ id: aff.id, label: aff.label, stat: aff.stat, val });
  }
  item.affixes = picked;
  if (picked.length > 0) {
    item.name = `${baseTitle} ${picked[0].label}`;
  }
  return item;
}

// Fast O(W * H) zero-allocation BFS guaranteeing a trap-free walkable path between upPos and downPos
export function verifyPureFloorBFS(floor) {
  if (!floor || !floor.tiles || !floor.upPos || !floor.downPos) return false;
  const fh = floor.height || floor.tiles.length;
  const fw = floor.width || (floor.tiles[0] ? floor.tiles[0].length : 0);
  if (fw <= 0 || fh <= 0) return false;

  const sx = floor.upPos.x;
  const sy = floor.upPos.y;
  const gx = floor.downPos.x;
  const gy = floor.downPos.y;
  if (sx < 0 || sx >= fw || sy < 0 || sy >= fh || gx < 0 || gx >= fw || gy < 0 || gy >= fh) {
    return false;
  }

  const total = fw * fh;
  const visited = new Uint8Array(total);
  const qx = new Int32Array(total);
  const qy = new Int32Array(total);

  let head = 0;
  let tail = 0;
  qx[tail] = sx;
  qy[tail] = sy;
  tail += 1;
  visited[sy * fw + sx] = 1;

  const dxs = [1, -1, 0, 0];
  const dys = [0, 0, 1, -1];

  while (head < tail) {
    const cx = qx[head];
    const cy = qy[head];
    head += 1;
    if (cx === gx && cy === gy) return true;

    for (let d = 0; d < 4; d++) {
      const nx = cx + dxs[d];
      const ny = cy + dys[d];
      if (nx >= 0 && nx < fw && ny >= 0 && ny < fh) {
        const idx = ny * fw + nx;
        if (visited[idx] === 0) {
          const t = floor.tiles[ny][nx];
          const isSafeWalkable = (
            t === TILE_FLOOR ||
            t === TILE_STAIRS_UP ||
            t === TILE_STAIRS_DOWN ||
            t === TILE_CHEST ||
            t === TILE_CHEST_OPEN ||
            t === TILE_SHRINE ||
            t === TILE_SHRINE_USED ||
            t === TILE_TRAP_DISARMED
          );
          if (isSafeWalkable) {
            visited[idx] = 1;
            qx[tail] = nx;
            qy[tail] = ny;
            tail += 1;
          }
        }
      }
    }
  }
  return false;
}

export function carveDirectFloorPath(floor) {
  let cx = floor.upPos.x;
  let cy = floor.upPos.y;
  while (cx !== floor.downPos.x) {
    cx += (floor.downPos.x > cx) ? 1 : -1;
    if (floor.tiles[cy][cx] !== TILE_STAIRS_UP && floor.tiles[cy][cx] !== TILE_STAIRS_DOWN) {
      floor.tiles[cy][cx] = TILE_FLOOR;
      if (floor.traps) delete floor.traps[`${cx},${cy}`];
    }
  }
  while (cy !== floor.downPos.y) {
    cy += (floor.downPos.y > cy) ? 1 : -1;
    if (floor.tiles[cy][cx] !== TILE_STAIRS_UP && floor.tiles[cy][cx] !== TILE_STAIRS_DOWN) {
      floor.tiles[cy][cx] = TILE_FLOOR;
      if (floor.traps) delete floor.traps[`${cx},${cy}`];
    }
  }
}

function pickWeightedEntry(entries, effDepth, rand) {
  const valid = entries.filter(e => effDepth >= (e.minFloor || 1));
  const pool = valid.length > 0 ? valid : entries;
  let totalWeight = 0;
  for (let i = 0; i < pool.length; i++) {
    totalWeight += (pool[i].weight || 10);
  }
  let r = rand() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= (pool[i].weight || 10);
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function carveRoomByStyle(tiles, w, h, room, layoutStyle, rand) {
  const { rx, ry, rw, rh, cx, cy } = room;

  if (layoutStyle === 'crystalline_caverns') {
    // Chamfered / organic cavern pocket
    const radX = rw * 0.54;
    const radY = rh * 0.54;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const nx = (x + 0.5 - (rx + rw * 0.5)) / radX;
        const ny = (y + 0.5 - (ry + rh * 0.5)) / radY;
        if (nx * nx + ny * ny <= 1.15 + (rand() * 0.28 - 0.1)) {
          tiles[y][x] = TILE_FLOOR;
        }
      }
    }
    tiles[cy][cx] = TILE_FLOOR;
    return;
  }

  // Carve base rectangular hall
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      tiles[y][x] = TILE_FLOOR;
    }
  }

  // Add architectural stone pillars in large plazas / grand ruins (always keeping >=2-tile walkways & room center clear)
  if ((layoutStyle === 'grand_ruins' || layoutStyle === 'masonry_vaults') && rw >= 8 && rh >= 7 && rand() < 0.65) {
    const px1 = rx + 2;
    const px2 = rx + rw - 3;
    const py1 = ry + 2;
    const py2 = ry + rh - 3;
    const pts = [[px1, py1], [px2, py1], [px1, py2], [px2, py2]];
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0];
      const py = pts[i][1];
      if (!(px === cx && py === cy)) {
        tiles[py][px] = TILE_WALL;
      }
    }
  } else if (layoutStyle === 'excavation_quarry' && rw >= 7 && rh >= 5 && rand() < 0.55) {
    // Quarry support pier off-center so ore veins can form along drift ribs
    const px = rx + 2;
    const py = ry + Math.floor(rh / 2);
    if (!(px === cx && py === cy)) {
      tiles[py][px] = TILE_WALL;
    }
  }
}

function carveCorridorBetweenRooms(tiles, w, h, rA, rB, wideAvenue, bendHorizontalFirst) {
  let cx = rA.cx;
  let cy = rA.cy;
  const tx = rB.cx;
  const ty = rB.cy;

  function stampFloor(x, y) {
    if (x >= 1 && x < w - 1 && y >= 1 && y < h - 1) {
      tiles[y][x] = TILE_FLOOR;
      if (wideAvenue) {
        if (x + 1 < w - 1) tiles[y][x + 1] = TILE_FLOOR;
        if (y + 1 < h - 1) tiles[y + 1][x] = TILE_FLOOR;
      }
    }
  }

  if (bendHorizontalFirst) {
    while (cx !== tx) {
      stampFloor(cx, cy);
      cx += (tx > cx) ? 1 : -1;
    }
    while (cy !== ty) {
      stampFloor(cx, cy);
      cy += (ty > cy) ? 1 : -1;
    }
  } else {
    while (cy !== ty) {
      stampFloor(cx, cy);
      cy += (ty > cy) ? 1 : -1;
    }
    while (cx !== tx) {
      stampFloor(cx, cy);
      cx += (tx > cx) ? 1 : -1;
    }
  }
  stampFloor(tx, ty);
}

export function createMonsterEntityFromArchetype(archId, effDepth, mx, my, isElite, rand, seqIdx) {
  const arch = MONSTER_ARCHETYPES[archId] || MONSTER_ARCHETYPES.vault_crawler;
  const affix = isElite ? ELITE_AFFIXES[Math.floor(rand() * ELITE_AFFIXES.length)] : null;
  const scaledDepth = effDepth > 20 ? 20 + Math.floor(Math.pow(effDepth - 20, 1.15)) : effDepth;
  const hpBase = (28 + scaledDepth * 8) * arch.hpMult * (isElite ? 1.65 : 1.0);
  const atkBase = (8 + scaledDepth * 2.2) * arch.atkMult * (isElite ? 1.25 : 1.0);
  const defBase = (2 + scaledDepth * 1.1) * arch.defMult * ((affix && affix.id === 'fortified') ? 1.35 : 1.0);
  const xpBase = (16 + scaledDepth * 6) * arch.xpMult * (isElite ? 2.0 : 1.0);

  return {
    uid: `m_${effDepth}_${seqIdx}_${Math.floor(rand() * 100000)}`,
    id: arch.id,
    bountyTag: arch.bountyTag || 'crawler',
    name: isElite ? `${affix.name} ${arch.name}` : arch.name,
    isElite: !!isElite,
    affix,
    isRanged: !!arch.isRanged,
    range: arch.range || 1,
    onHitStatus: arch.onHitStatus || null,
    x: mx,
    y: my,
    hp: Math.max(10, Math.round(hpBase)),
    maxHp: Math.max(10, Math.round(hpBase)),
    atk: Math.max(3, Math.round(atkBase)),
    def: Math.max(0, Math.round(defBase)),
    xp: Math.max(8, Math.round(xpBase)),
    color: isElite ? '#fbbf24' : arch.color,
    statuses: []
  };
}

export function generateFloor(depth, dungeonConfig = null, dungeonSeed = null) {
  const cfg = normalizeDungeonConfig(dungeonConfig);
  const w = cfg.width || DEFAULT_MAP_W;
  const h = cfg.height || DEFAULT_MAP_H;
  const effDepth = Math.max(1, depth + (cfg.baseDangerDepth || 0));
  const rand = dungeonSeed
    ? createSeededRng(((dungeonSeed >>> 0) + depth * 7919) >>> 0)
    : Math.random;

  const tiles = createUint8Grid(w, h, TILE_WALL);
  const explored = createUint8Grid(w, h, 0);
  const rooms = [];

  // Macro-Sector Partitioning for O(Sectors) multi-wing generation at any size (21x15 up to 400x300+)
  const usableW = w - 2;
  const usableH = h - 2;
  const secCols = Math.max(2, Math.round(usableW / 13));
  const secRows = Math.max(2, Math.round(usableH / 10));
  const cellW = usableW / secCols;
  const cellH = usableH / secRows;

  const sectorRoomGrid = Array.from({ length: secRows }, () => Array(secCols).fill(null));
  const keepChance = (secCols * secRows <= 6) ? 1.0 : 0.82;

  for (let sr = 0; sr < secRows; sr++) {
    for (let sc = 0; sc < secCols; sc++) {
      if (rand() > keepChance && rooms.length >= 2) continue;

      const sLeft = 1 + Math.floor(sc * cellW);
      const sTop = 1 + Math.floor(sr * cellH);
      const sRight = Math.min(w - 2, Math.floor((sc + 1) * cellW));
      const sBottom = Math.min(h - 2, Math.floor((sr + 1) * cellH));
      const maxRW = Math.max(3, sRight - sLeft - 1);
      const maxRH = Math.max(3, sBottom - sTop - 1);

      let minRW = Math.min(maxRW, cfg.layoutStyle === 'grand_ruins' ? 6 : 5);
      let minRH = Math.min(maxRH, cfg.layoutStyle === 'excavation_quarry' ? 4 : 5);
      if (maxRW <= 4) minRW = 3;
      if (maxRH <= 4) minRH = 3;

      const rw = minRW + Math.floor(rand() * (maxRW - minRW + 1));
      const rh = minRH + Math.floor(rand() * (maxRH - minRH + 1));
      const slackX = Math.max(0, (sRight - sLeft) - rw);
      const slackY = Math.max(0, (sBottom - sTop) - rh);
      const rx = Math.min(w - rw - 1, sLeft + Math.floor(rand() * (slackX + 1)));
      const ry = Math.min(h - rh - 1, sTop + Math.floor(rand() * (slackY + 1)));

      const room = {
        id: rooms.length,
        sc,
        sr,
        rx,
        ry,
        rw,
        rh,
        cx: rx + Math.floor(rw / 2),
        cy: ry + Math.floor(rh / 2)
      };

      carveRoomByStyle(tiles, w, h, room, cfg.layoutStyle, rand);
      rooms.push(room);
      sectorRoomGrid[sr][sc] = room;
    }
  }

  // Fallback guarantee if tiny custom dimensions were passed
  if (rooms.length < 2) {
    const r1 = { id: 0, sc: 0, sr: 0, rx: 2, ry: 2, rw: 4, rh: 4, cx: 4, cy: 4 };
    const r2 = { id: 1, sc: 1, sr: 1, rx: Math.max(6, w - 6), ry: Math.max(6, h - 6), rw: 4, rh: 4, cx: Math.max(7, w - 4), cy: Math.max(7, h - 4) };
    carveRoomByStyle(tiles, w, h, r1, 'masonry_vaults', rand);
    carveRoomByStyle(tiles, w, h, r2, 'masonry_vaults', rand);
    rooms.length = 0;
    rooms.push(r1, r2);
  }

  // Build nearest-neighbor Spanning Tree across rooms so corridors form natural local wings
  const connected = new Uint8Array(rooms.length);
  const edgeSet = {};
  connected[0] = 1;
  let connectedCount = 1;

  while (connectedCount < rooms.length) {
    let bestA = -1;
    let bestB = -1;
    let bestDist = Infinity;

    for (let i = 0; i < rooms.length; i++) {
      if (!connected[i]) continue;
      for (let j = 0; j < rooms.length; j++) {
        if (connected[j]) continue;
        const d = Math.abs(rooms[i].cx - rooms[j].cx) + Math.abs(rooms[i].cy - rooms[j].cy);
        if (d < bestDist) {
          bestDist = d;
          bestA = i;
          bestB = j;
        }
      }
    }

    if (bestA === -1 || bestB === -1) break;
    connected[bestB] = 1;
    connectedCount += 1;
    const eKey = bestA < bestB ? `${bestA}:${bestB}` : `${bestB}:${bestA}`;
    edgeSet[eKey] = true;

    const wideAve = w >= 48 && (cfg.layoutStyle === 'masonry_vaults' || cfg.layoutStyle === 'grand_ruins') && rand() < 0.30;
    carveCorridorBetweenRooms(tiles, w, h, rooms[bestA], rooms[bestB], wideAve, rand() < 0.5);
  }

  // Add Loop Passages between nearby sector neighbors so players have flanking loops & exploration choices
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const ds = Math.abs(rooms[i].sc - rooms[j].sc) + Math.abs(rooms[i].sr - rooms[j].sr);
      if (ds > 2) continue;
      const eKey = `${i}:${j}`;
      if (edgeSet[eKey]) continue;
      if (rand() < cfg.loopRatio) {
        edgeSet[eKey] = true;
        carveCorridorBetweenRooms(tiles, w, h, rooms[i], rooms[j], false, rand() < 0.5);
      }
    }
  }

  // Choose well-separated Entrance (upRoom) and Goal/Exit (downRoom) across opposite wings
  const startIdx = Math.min(rooms.length - 1, Math.floor(rand() * Math.max(1, Math.ceil(rooms.length * 0.2))));
  const upRoom = rooms[startIdx];
  let downRoom = rooms[rooms.length - 1];
  let maxStairDist = -1;
  for (let i = 0; i < rooms.length; i++) {
    if (i === startIdx) continue;
    const d = Math.hypot(rooms[i].cx - upRoom.cx, rooms[i].cy - upRoom.cy);
    if (d > maxStairDist) {
      maxStairDist = d;
      downRoom = rooms[i];
    }
  }

  const upPos = { x: upRoom.cx, y: upRoom.cy };
  let downPos = { x: downRoom.cx, y: downRoom.cy };
  if (upPos.x === downPos.x && upPos.y === downPos.y) {
    downPos = { x: Math.min(w - 2, upPos.x + 3), y: upPos.y };
    for (let x = upPos.x; x <= downPos.x; x++) tiles[upPos.y][x] = TILE_FLOOR;
  }

  const hasDownStairs = depth < cfg.maxDepth;
  tiles[upPos.y][upPos.x] = TILE_STAIRS_UP;
  if (hasDownStairs) {
    tiles[downPos.y][downPos.x] = TILE_STAIRS_DOWN;
  } else {
    // Final floor of a finite-depth dungeon: sanctum floor / reward chest instead of deeper stairs
    tiles[downPos.y][downPos.x] = TILE_CHEST;
  }

  // Area scaling ratio relative to legacy 21x15 (315 tiles)
  const areaRatio = Math.max(1, (w * h) / 315);

  // Designate Guarded Treasure Vault Chambers in remote sectors
  const vaults = [];
  const candidateVaultRooms = rooms.filter(r => r !== upRoom && r !== downRoom);
  const desiredVaults = Math.min(candidateVaultRooms.length, cfg.vaultRoomCount || 0);
  for (let v = 0; v < desiredVaults; v++) {
    const pickIdx = Math.floor(rand() * candidateVaultRooms.length);
    const vr = candidateVaultRooms.splice(pickIdx, 1)[0];
    if (!vr) break;
    if (tiles[vr.cy][vr.cx] === TILE_FLOOR) {
      tiles[vr.cy][vr.cx] = TILE_CHEST;
    }
    vaults.push({ roomId: vr.id, cx: vr.cx, cy: vr.cy, rx: vr.rx, ry: vr.ry, rw: vr.rw, rh: vr.rh });
  }

  // Seed Ore Veins ONLY on WALL tiles bordering FLOOR tiles (Golden Rule #4), including Motherlode Seams!
  const candidateWalls = [];
  const wallIndexMap = new Int32Array(w * h);
  wallIndexMap.fill(-1);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (tiles[y][x] === TILE_WALL) {
        const bordersFloor =
          tiles[y - 1][x] === TILE_FLOOR ||
          tiles[y + 1][x] === TILE_FLOOR ||
          tiles[y][x - 1] === TILE_FLOOR ||
          tiles[y][x + 1] === TILE_FLOOR;
        if (bordersFloor) {
          wallIndexMap[y * w + x] = 1;
          candidateWalls.push({ x, y });
        }
      }
    }
  }

  const veinGoal = Math.round((9 + Math.min(8, effDepth)) * Math.pow(areaRatio, 0.78) * cfg.veinDensityMult);
  let veinsPlaced = 0;
  let safetyVeinIter = 0;

  while (veinsPlaced < veinGoal && candidateWalls.length > 0 && safetyVeinIter < veinGoal * 3) {
    safetyVeinIter += 1;
    const idx = Math.floor(rand() * candidateWalls.length);
    const pos = candidateWalls[idx];
    // O(1) swap-remove
    candidateWalls[idx] = candidateWalls[candidateWalls.length - 1];
    candidateWalls.pop();

    if (tiles[pos.y][pos.x] !== TILE_WALL) continue;
    const pickedOre = pickWeightedEntry(cfg.oreTable, effDepth, rand);
    const oreTile = pickedOre ? pickedOre.tile : TILE_ORE_COPPER;
    tiles[pos.y][pos.x] = oreTile;
    veinsPlaced += 1;

    // Motherlode seam expansion onto adjacent eligible border walls
    if (veinsPlaced < veinGoal && rand() < cfg.motherlodeChance) {
      const clusterSize = 2 + Math.floor(rand() * 3);
      let cx = pos.x;
      let cy = pos.y;
      for (let c = 0; c < clusterSize && veinsPlaced < veinGoal; c++) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]];
        const d = dirs[Math.floor(rand() * dirs.length)];
        const nx = cx + d[0];
        const ny = cy + d[1];
        if (nx >= 1 && nx < w - 1 && ny >= 1 && ny < h - 1 && tiles[ny][nx] === TILE_WALL && wallIndexMap[ny * w + nx] === 1) {
          tiles[ny][nx] = oreTile;
          veinsPlaced += 1;
          cx = nx;
          cy = ny;
        }
      }
    }
  }

  // Place Chests inside rooms (scaled by room count & chestDensityMult)
  const chestChance = Math.min(0.85, 0.38 * cfg.chestDensityMult);
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    if (r === upRoom) continue;
    if (rand() < chestChance) {
      const cx = r.rx + Math.floor(rand() * r.rw);
      const cy = r.ry + Math.floor(rand() * r.rh);
      if (tiles[cy][cx] === TILE_FLOOR && !(cx === downPos.x && cy === downPos.y) && !(cx === upPos.x && cy === upPos.y)) {
        tiles[cy][cx] = TILE_CHEST;
      }
    }
  }

  // Place Subterranean Astral Shrines across wings
  const shrines = {};
  const shrineTypes = ['sanctuary', 'starfire', 'aegis'];
  const shrineGoal = Math.max(1, Math.round(Math.pow(areaRatio, 0.52) * cfg.shrineDensityMult * 0.75));
  let shrinesPlaced = 0;
  for (let sTry = 0; sTry < shrineGoal * 14 && shrinesPlaced < shrineGoal; sTry++) {
    const rm = rooms[Math.floor(rand() * rooms.length)];
    if (rm === upRoom && rooms.length > 2) continue;
    const sx = rm.rx + Math.floor(rand() * rm.rw);
    const sy = rm.ry + Math.floor(rand() * rm.rh);
    if (tiles[sy][sx] === TILE_FLOOR && !(sx === upPos.x && sy === upPos.y) && !(sx === downPos.x && sy === downPos.y)) {
      tiles[sy][sx] = TILE_SHRINE;
      shrines[`${sx},${sy}`] = {
        type: shrineTypes[Math.floor(rand() * shrineTypes.length)]
      };
      shrinesPlaced += 1;
    }
  }

  // Place Concealed Runic Traps inside non-starting rooms (safe BFS enforced below)
  const traps = {};
  const trapGoal = Math.round((2 + Math.min(4, effDepth)) * Math.pow(areaRatio, 0.65) * cfg.trapDensityMult);
  let trapsPlaced = 0;
  for (let tTry = 0; tTry < trapGoal * 10 && trapsPlaced < trapGoal; tTry++) {
    const rm = rooms[Math.floor(rand() * rooms.length)];
    if (rm === upRoom) continue;
    const tx = rm.rx + Math.floor(rand() * rm.rw);
    const ty = rm.ry + Math.floor(rand() * rm.rh);
    if (
      tiles[ty][tx] === TILE_FLOOR &&
      !(tx === upPos.x && ty === upPos.y) &&
      !(tx === downPos.x && ty === downPos.y) &&
      Math.hypot(tx - upPos.x, ty - upPos.y) >= 3.0
    ) {
      tiles[ty][tx] = TILE_TRAP_HIDDEN;
      const tType = cfg.allowedTraps[Math.floor(rand() * cfg.allowedTraps.length)] || 'spike';
      traps[`${tx},${ty}`] = { type: tType };
      trapsPlaced += 1;
    }
  }

  const floorObj = {
    packed: false,
    depth,
    biomeId: resolveFloorBiome(cfg, depth),
    width: w,
    height: h,
    roomCount: rooms.length,
    tiles,
    explored,
    upPos,
    downPos,
    hasDownStairs,
    shrines,
    traps,
    vaults,
    monsters: [],
    oresMined: 0
  };

  // Guarantee pure trap-free walkability between < and > (or final sanctum)
  if (!verifyPureFloorBFS(floorObj)) {
    carveDirectFloorPath(floorObj);
  }

  // Occupancy bitmap for fast O(1) monster placement collision checks on huge floors
  const occupied = new Uint8Array(w * h);
  occupied[upPos.y * w + upPos.x] = 1;

  // 1. Spawn Scheduled Boss (if configured for this floor depth or recurring in endless mode)
  let scheduledBossId = cfg.bossSchedule && cfg.bossSchedule[depth];
  if (!scheduledBossId && cfg.maxDepth >= 999 && depth % 5 === 0 && depth > 20) {
    const bossKeys = ['boss_weaver', 'boss_ignis', 'boss_colossus', 'boss_vespera'];
    scheduledBossId = bossKeys[(Math.floor(depth / 5) - 1) % bossKeys.length];
  }
  if (scheduledBossId && BOSS_ARCHETYPES[scheduledBossId]) {
    const bDef = BOSS_ARCHETYPES[scheduledBossId];
    const bossScale = depth > 20 ? (1 + (depth - 20) * 0.08) : 1.0;
    let bx = downRoom.cx;
    let by = downRoom.cy;
    if (!hasDownStairs && tiles[by][bx] === TILE_CHEST) {
      // Place boss adjacent to the final sanctum chest if possible
      const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (let a = 0; a < adj.length; a++) {
        const nx = bx + adj[a][0];
        const ny = by + adj[a][1];
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && tiles[ny][nx] === TILE_FLOOR) {
          bx = nx;
          by = ny;
          break;
        }
      }
    }
    occupied[by * w + bx] = 1;
    floorObj.monsters.push({
      uid: `boss_${depth}_${Date.now()}`,
      id: bDef.id,
      bountyTag: 'boss',
      name: depth > 20 ? `Abyssal ${bDef.name}` : bDef.name,
      isBoss: true,
      dropRarity: bDef.dropRarity || 'epic',
      isRanged: !!bDef.isRanged,
      range: bDef.range || 1,
      onHitStatus: bDef.onHitStatus || null,
      x: bx,
      y: by,
      hp: Math.round(bDef.hp * bossScale),
      maxHp: Math.round(bDef.hp * bossScale),
      atk: Math.round(bDef.atk * (depth > 20 ? (1 + (depth - 20) * 0.05) : 1.0)),
      def: Math.round(bDef.def * (depth > 20 ? (1 + (depth - 20) * 0.04) : 1.0)),
      xp: Math.round(bDef.xp * bossScale),
      color: bDef.color,
      statuses: []
    });
  }

  // 2. Spawn Elite Vault Wardens inside Guarded Treasure Vaults
  let mSeq = 1;
  for (let v = 0; v < vaults.length; v++) {
    const vr = vaults[v];
    for (let tries = 0; tries < 10; tries++) {
      const mx = vr.rx + Math.floor(rand() * vr.rw);
      const my = vr.ry + Math.floor(rand() * vr.rh);
      if (tiles[my][mx] === TILE_FLOOR && occupied[my * w + mx] === 0 && Math.hypot(mx - upPos.x, my - upPos.y) > 5) {
        occupied[my * w + mx] = 1;
        const pickedM = pickWeightedEntry(cfg.monsterPool, effDepth, rand);
        floorObj.monsters.push(createMonsterEntityFromArchetype(pickedM.id, effDepth, mx, my, true, rand, mSeq++));
        break;
      }
    }
  }

  // 3. Spawn Sector Monster Roster across rooms (scaled smoothly by floor area)
  const spawnRegularPack = !scheduledBossId || areaRatio >= 2.5;
  if (spawnRegularPack) {
    const baseCount = scheduledBossId ? 2 + Math.min(4, effDepth) : 4 + Math.min(6, effDepth);
    const monsterGoal = Math.round(baseCount * Math.pow(areaRatio, 0.70) * cfg.monsterDensityMult);
    let spawned = 0;

    for (let attempt = 0; attempt < monsterGoal * 6 && spawned < monsterGoal; attempt++) {
      const rm = rooms[Math.floor(rand() * rooms.length)];
      if (rm === upRoom) continue;
      if (scheduledBossId && rm === downRoom) continue;

      const mx = rm.rx + Math.floor(rand() * rm.rw);
      const my = rm.ry + Math.floor(rand() * rm.rh);
      if (
        (tiles[my][mx] === TILE_FLOOR || tiles[my][mx] === TILE_STAIRS_DOWN) &&
        occupied[my * w + mx] === 0 &&
        Math.hypot(mx - upPos.x, my - upPos.y) >= 5.0
      ) {
        occupied[my * w + mx] = 1;
        const isElite = effDepth >= 2 && rand() < cfg.eliteChance;
        const pickedM = pickWeightedEntry(cfg.monsterPool, effDepth, rand);
        floorObj.monsters.push(createMonsterEntityFromArchetype(pickedM.id, effDepth, mx, my, isElite, rand, mSeq++));
        spawned += 1;
      }
    }
  }

  return floorObj;
}
