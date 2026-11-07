// Procedural Dungeon Generation, Non-Blocking Ore Veins, Shrines, Traps, Safe-Path BFS, and Socketed Equipment Rolling

import {
  GRID_W,
  GRID_H,
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
  TILE_ORE_IRON,
  TILE_ORE_MITHRIL,
  TILE_ORE_STAR,
  TILE_ORE_ASTRAL,
  TILE_ORE_GEODE,
  RARITY
} from '../constants.js';
import { AFFIX_POOL, BASE_GEAR_NAMES, ELITE_AFFIXES } from '../data/items.js';
import { nextItemUid } from './state.js';

export function rollSocketCountForRarity(rarityKey, slot) {
  if (slot === 'pickaxe') return 0;
  if (rarityKey === 'relic') return 2;
  if (rarityKey === 'epic') return Math.random() < 0.60 ? 2 : 1;
  if (rarityKey === 'rare') return Math.random() < 0.25 ? 2 : 1;
  return 0;
}

export function generateProceduralEquipment(depth = 1, forcedRarity = null, forcedSlot = null) {
  const slots = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];

  let rarityKey = forcedRarity;
  if (!rarityKey) {
    const roll = Math.random() + (depth * 0.04);
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

export function verifyPureFloorBFS(floor) {
  const start = floor.upPos;
  const goal = floor.downPos;
  const visited = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false));
  const queue = [{ x: start.x, y: start.y }];
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.x === goal.x && cur.y === goal.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !visited[ny][nx]) {
        const t = floor.tiles[ny][nx];
        // Live traps (TILE_TRAP_HIDDEN / TILE_TRAP_VISIBLE) are intentionally excluded so BFS guarantees a trap-free path
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
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
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

export function generateFloor(depth) {
  const tiles = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(TILE_WALL));
  const rooms = [];
  const targetRooms = 6;

  for (let attempt = 0; attempt < 30 && rooms.length < targetRooms; attempt++) {
    const rw = 3 + Math.floor(Math.random() * 3);
    const rh = 3 + Math.floor(Math.random() * 2);
    const rx = 1 + Math.floor(Math.random() * (GRID_W - rw - 2));
    const ry = 1 + Math.floor(Math.random() * (GRID_H - rh - 2));

    let overlap = false;
    for (const r of rooms) {
      if (rx <= r.rx + r.rw && rx + rw >= r.rx && ry <= r.ry + r.rh && ry + rh >= r.ry) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          tiles[y][x] = TILE_FLOOR;
        }
      }
      rooms.push({ rx, ry, rw, rh, cx: rx + Math.floor(rw / 2), cy: ry + Math.floor(rh / 2) });
    }
  }

  if (rooms.length < 2) {
    rooms.push({ rx: 2, ry: 2, rw: 4, rh: 4, cx: 4, cy: 4 });
    rooms.push({ rx: 14, ry: 9, rw: 4, rh: 4, cx: 16, cy: 11 });
    for (const r of rooms) {
      for (let y = r.ry; y < r.ry + r.rh; y++) {
        for (let x = r.rx; x < r.rx + r.rw; x++) tiles[y][x] = TILE_FLOOR;
      }
    }
  }

  // Carve L-corridors between rooms
  for (let i = 1; i < rooms.length; i++) {
    let cx = rooms[i - 1].cx;
    let cy = rooms[i - 1].cy;
    const tx = rooms[i].cx;
    const ty = rooms[i].cy;
    while (cx !== tx) {
      tiles[cy][cx] = TILE_FLOOR;
      cx += (tx > cx) ? 1 : -1;
    }
    while (cy !== ty) {
      tiles[cy][cx] = TILE_FLOOR;
      cy += (ty > cy) ? 1 : -1;
    }
    tiles[cy][cx] = TILE_FLOOR;
  }

  const upPos = { x: rooms[0].cx, y: rooms[0].cy };
  let downPos = { x: rooms[rooms.length - 1].cx, y: rooms[rooms.length - 1].cy };
  if (upPos.x === downPos.x && upPos.y === downPos.y) {
    downPos = { x: Math.min(GRID_W - 2, upPos.x + 3), y: upPos.y };
    for (let x = upPos.x; x <= downPos.x; x++) tiles[upPos.y][x] = TILE_FLOOR;
  }
  tiles[upPos.y][upPos.x] = TILE_STAIRS_UP;
  tiles[downPos.y][downPos.x] = TILE_STAIRS_DOWN;

  // Seed Ore Veins ONLY on WALL tiles bordering FLOOR tiles (never blocking corridors!)
  const candidateWalls = [];
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (tiles[y][x] === TILE_WALL) {
        const bordersFloor =
          tiles[y - 1][x] === TILE_FLOOR ||
          tiles[y + 1][x] === TILE_FLOOR ||
          tiles[y][x - 1] === TILE_FLOOR ||
          tiles[y][x + 1] === TILE_FLOOR;
        if (bordersFloor) candidateWalls.push({ x, y });
      }
    }
  }

  const veinGoal = 8 + Math.min(8, depth);
  for (let i = 0; i < veinGoal && candidateWalls.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidateWalls.length);
    const pos = candidateWalls.splice(idx, 1)[0];
    const roll = Math.random();
    if (depth >= 5 && roll < 0.16) tiles[pos.y][pos.x] = TILE_ORE_ASTRAL;
    else if (depth >= 3 && roll < 0.34) tiles[pos.y][pos.x] = TILE_ORE_STAR;
    else if (depth >= 2 && roll < 0.56) tiles[pos.y][pos.x] = (Math.random() < 0.5) ? TILE_ORE_MITHRIL : TILE_ORE_GEODE;
    else if (roll < 0.78) tiles[pos.y][pos.x] = TILE_ORE_IRON;
    else tiles[pos.y][pos.x] = TILE_ORE_COPPER;
  }

  // Place Chests inside rooms (not on stairs)
  for (let i = 1; i < rooms.length; i++) {
    if (Math.random() < 0.65) {
      const r = rooms[i];
      const cx = r.rx + Math.floor(Math.random() * r.rw);
      const cy = r.ry + Math.floor(Math.random() * r.rh);
      if (tiles[cy][cx] === TILE_FLOOR && !(cx === downPos.x && cy === downPos.y) && !(cx === upPos.x && cy === upPos.y)) {
        tiles[cy][cx] = TILE_CHEST;
      }
    }
  }

  // Place Astral Shrine in a tactical vault room (1 per floor)
  const shrines = {};
  const shrineTypes = ['sanctuary', 'starfire', 'aegis'];
  const midRoom = rooms[Math.min(rooms.length - 1, Math.max(1, Math.floor(rooms.length / 2)))];
  for (let sTry = 0; sTry < 12; sTry++) {
    const sx = midRoom.rx + Math.floor(Math.random() * midRoom.rw);
    const sy = midRoom.ry + Math.floor(Math.random() * midRoom.rh);
    if (tiles[sy][sx] === TILE_FLOOR && !(sx === upPos.x && sy === upPos.y) && !(sx === downPos.x && sy === downPos.y)) {
      tiles[sy][sx] = TILE_SHRINE;
      shrines[`${sx},${sy}`] = {
        type: shrineTypes[Math.floor(Math.random() * shrineTypes.length)]
      };
      break;
    }
  }

  // Place Concealed Runic Traps inside non-starting rooms (safe BFS enforced below)
  const traps = {};
  const trapGoal = 2 + Math.min(4, depth);
  let trapsPlaced = 0;
  for (let tTry = 0; tTry < 30 && trapsPlaced < trapGoal; tTry++) {
    const rm = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
    const tx = rm.rx + Math.floor(Math.random() * rm.rw);
    const ty = rm.ry + Math.floor(Math.random() * rm.rh);
    if (
      tiles[ty][tx] === TILE_FLOOR &&
      !(tx === upPos.x && ty === upPos.y) &&
      !(tx === downPos.x && ty === downPos.y) &&
      Math.hypot(tx - upPos.x, ty - upPos.y) >= 2.2
    ) {
      tiles[ty][tx] = TILE_TRAP_HIDDEN;
      traps[`${tx},${ty}`] = {
        type: Math.random() < 0.55 ? 'spike' : 'flame'
      };
      trapsPlaced += 1;
    }
  }

  const floorObj = {
    depth,
    tiles,
    upPos,
    downPos,
    shrines,
    traps,
    monsters: [],
    explored: Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false)),
    oresMined: 0
  };

  // Guarantee pure trap-free walkability between < and > stairs
  if (!verifyPureFloorBFS(floorObj)) {
    carveDirectFloorPath(floorObj);
  }

  // Spawn Monsters or Milestone Bosses (Floors 5 & 10)
  if (depth === 5) {
    const br = rooms[rooms.length - 1];
    floorObj.monsters.push({
      uid: `boss_5_${Date.now()}`,
      id: 'boss_colossus',
      name: 'Starfall Colossus',
      isBoss: true,
      isRanged: false,
      x: br.cx,
      y: br.cy,
      hp: 240,
      maxHp: 240,
      atk: 20,
      def: 10,
      xp: 260,
      color: '#f59e0b',
      statuses: []
    });
  } else if (depth === 10) {
    const br = rooms[rooms.length - 1];
    floorObj.monsters.push({
      uid: `boss_10_${Date.now()}`,
      id: 'boss_weaver',
      name: 'Void Weaver',
      isBoss: true,
      isRanged: true,
      range: 4,
      x: br.cx,
      y: br.cy,
      hp: 420,
      maxHp: 420,
      atk: 28,
      def: 14,
      xp: 520,
      color: '#ec4899',
      statuses: []
    });
  } else {
    const monsterGoal = 3 + Math.min(6, depth);
    for (let m = 0; m < monsterGoal; m++) {
      const rm = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
      const mx = rm.rx + Math.floor(Math.random() * rm.rw);
      const my = rm.ry + Math.floor(Math.random() * rm.rh);
      if (
        (tiles[my][mx] === TILE_FLOOR || tiles[my][mx] === TILE_STAIRS_DOWN) &&
        !(mx === upPos.x && my === upPos.y) &&
        !floorObj.monsters.some(other => other.x === mx && other.y === my)
      ) {
        const isElite = depth >= 2 && Math.random() < 0.22;
        const affix = isElite ? ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)] : null;
        const rollType = Math.random();
        const isRanged = rollType < 0.35;
        const baseName = isRanged ? (depth >= 3 ? 'Abyssal Cultist' : 'Starfall Archer') : 'Vault Crawler';
        const hpBase = (28 + depth * 8) * (isElite ? 1.6 : 1.0);

        floorObj.monsters.push({
          uid: `m_${depth}_${m}_${Date.now()}`,
          id: isRanged ? 'archer' : 'crawler',
          name: isElite ? `${affix.name} ${baseName}` : baseName,
          isElite,
          affix,
          isRanged,
          range: isRanged ? 3 : 1,
          x: mx,
          y: my,
          hp: Math.round(hpBase),
          maxHp: Math.round(hpBase),
          atk: Math.round((8 + depth * 2.2) * (isElite ? 1.25 : 1.0)),
          def: Math.round((2 + depth * 1.1) * ((affix && affix.id === 'fortified') ? 1.35 : 1.0)),
          xp: Math.round((16 + depth * 6) * (isElite ? 2.0 : 1.0)),
          color: isElite ? '#fbbf24' : (isRanged ? '#60a5fa' : '#f87171'),
          statuses: []
        });
      }
    }
  }

  return floorObj;
}
