// Unified Keyboard, Camera-Translated Mouse, Minimap / Full-Map Click-to-Travel & Tactical Scanner Listeners

import {
  TILE_SIZE,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  TILE_CHEST,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED
} from '../constants.js';
import { ORE_CATALOG } from '../data/ores.js';
import { SHRINE_CATALOG, TRAP_CATALOG } from '../data/gems.js';
import { gameState, ensureDungeonFloorHydrated } from '../engine/state.js';
import { useHealingTonic, useRecallScroll } from '../engine/actions.js';
import {
  handlePlayerAction,
  executeClassSkill,
  useStairsAtPlayer,
  waitTurn,
  startAutoWalkTo,
  cancelAutoWalk,
  isAutoWalking
} from '../engine/combat.js';
import {
  setHoverTile,
  getCameraOrigin,
  minimapPixelToGrid,
  hasLineOfSight
} from './renderer.js';
import {
  toggleFullMapModal,
  closeFullMapModal,
  closeExpeditionAtlasModal,
  closeItemInspectModal
} from './modals.js';

export function updateScannerOnHover(gx, gy) {
  if (typeof document === 'undefined') return;
  const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
  if (!floor || !floor.tiles) return;
  if (gy < 0 || gy >= floor.tiles.length || gx < 0 || gx >= floor.tiles[0].length) return;
  if (!floor.explored[gy] || !floor.explored[gy][gx]) return;

  const box = document.getElementById('uiScannerContent');
  if (!box) return;

  const h = gameState.hero;
  const vision = (h && h.visionRadius) || 5;
  const inSight = h && Math.hypot(gx - h.x, gy - h.y) <= vision + 0.35 && hasLineOfSight(floor, h.x, h.y, gx, gy);

  const monster = inSight ? floor.monsters.find(m => m.x === gx && m.y === gy) : null;
  if (monster) {
    box.innerHTML = `
      <div class="font-bold" style="color:${monster.color}">${monster.name} ${monster.isBoss ? '👑' : ''}</div>
      <div class="text-[11px] text-[#e6edf3]">HP: ${monster.hp}/${monster.maxHp} • ATK: ${monster.atk} • DEF: ${monster.def}</div>
      <div class="text-[10px] text-[#8b949e]">${monster.affix ? monster.affix.desc : (monster.isRanged ? `Ranged Attacker (${monster.range || 3} tiles)` : 'Melee Guardian')}</div>
    `;
    return;
  }

  const t = floor.tiles[gy][gx];
  if (ORE_CATALOG[t]) {
    const ore = ORE_CATALOG[t];
    box.innerHTML = `
      <div class="font-bold" style="color:${ore.color}">${ore.name} Vein (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">Base Value: ${ore.baseValue}g • Requires Geology Rank ${ore.minGeology}</div>
      <div class="text-[10px] text-[#8b949e]">Step into or click vein to swing your pickaxe.</div>
    `;
  } else if (t === TILE_CHEST) {
    box.innerHTML = `<div class="font-bold text-[#fbbf24]">Gilded Vault Chest (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Contains relics and procedural equipment. Click to travel & open.</div>`;
  } else if (t === TILE_SHRINE) {
    const sMeta = (floor.shrines && floor.shrines[`${gx},${gy}`]) || { type: 'sanctuary' };
    const sDef = SHRINE_CATALOG[sMeta.type] || SHRINE_CATALOG.sanctuary;
    box.innerHTML = `
      <div class="font-bold" style="color:${sDef.color}">✨ ${sDef.name} (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">${sDef.desc}</div>
      <div class="text-[10px] text-[#8b949e]">Step onto or click this altar to claim its astral blessing.</div>
    `;
  } else if (t === TILE_SHRINE_USED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Dormant Astral Altar (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Its celestial energy has already been channeled.</div>`;
  } else if (t === TILE_TRAP_VISIBLE) {
    const tMeta = (floor.traps && floor.traps[`${gx},${gy}`]) || { type: 'spike' };
    const tDef = TRAP_CATALOG[tMeta.type] || TRAP_CATALOG.spike;
    const isScout = h && (h.classId === 'thief' || h.classId === 'ranger');
    box.innerHTML = `
      <div class="font-bold" style="color:${tDef.color}">⚠ ${tDef.name} (${gx}, ${gy})</div>
      <div class="text-[11px] text-[#e6edf3]">${tDef.desc}</div>
      <div class="text-[10px] text-[#34d399]">${isScout ? 'Step onto tile to safely DISARM for bonus XP!' : 'Auto-walk routes around spotted traps automatically.'}</div>
    `;
  } else if (t === TILE_TRAP_DISARMED) {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Disarmed Runic Plate (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Mechanism neutralized; safe to walk across.</div>`;
  } else if (t === TILE_STAIRS_UP) {
    box.innerHTML = `<div class="font-bold text-[#34d399]">Ascending Stairs (&lt;) (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click to Auto-Walk here, then press [E] to ascend or extract.</div>`;
  } else if (t === TILE_STAIRS_DOWN) {
    box.innerHTML = `<div class="font-bold text-[#60a5fa]">Descending Stairs (&gt;) (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click to Auto-Walk here, then press [E] to descend deeper.</div>`;
  } else {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Vault Masonry (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click any explored tile to safely Auto-Walk, or press [M] for full map.</div>`;
  }
}

export function setupInputs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
      return;
    }

    if (isAutoWalking()) {
      cancelAutoWalk();
    }

    if (e.code === 'Escape') {
      closeFullMapModal();
      closeExpeditionAtlasModal();
      closeItemInspectModal();
      return;
    }

    const classModal = document.getElementById('classSelectModal');
    const saveModal = document.getElementById('saveSyncModal');
    const atlasModal = document.getElementById('expeditionAtlasModal');
    const fullMapModal = document.getElementById('fullMapModal');
    if (classModal && !classModal.classList.contains('hidden')) return;
    if (saveModal && !saveModal.classList.contains('hidden')) return;
    if (atlasModal && !atlasModal.classList.contains('hidden')) return;

    if (e.code === 'KeyM') {
      e.preventDefault();
      toggleFullMapModal();
      return;
    }

    if (fullMapModal && !fullMapModal.classList.contains('hidden')) return;
    if (gameState.inGuild) return;

    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); handlePlayerAction(0, -1); }
    else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); handlePlayerAction(0, 1); }
    else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); handlePlayerAction(-1, 0); }
    else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); handlePlayerAction(1, 0); }
    else if (e.code === 'KeyQ') { e.preventDefault(); executeClassSkill(); }
    else if (e.code === 'KeyH') { e.preventDefault(); useHealingTonic(); }
    else if (e.code === 'KeyR') { e.preventDefault(); useRecallScroll(); }
    else if (e.code === 'KeyE') { e.preventDefault(); useStairsAtPlayer(); }
    else if (e.code === 'Space') { e.preventDefault(); waitTurn(); }
  });

  const canvas = document.getElementById('dungeonCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const vx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
      const vy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

      if (vx >= 0 && vx < VIEWPORT_WIDTH && vy >= 0 && vy < VIEWPORT_HEIGHT) {
        const gx = cam.camX + vx;
        const gy = cam.camY + vy;
        if (gx >= 0 && gx < cam.fw && gy >= 0 && gy < cam.fh) {
          setHoverTile({ x: gx, y: gy });
          updateScannerOnHover(gx, gy);
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      setHoverTile(null);
    });

    canvas.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const cam = getCameraOrigin(floor, gameState.hero.x, gameState.hero.y);
      const rect = canvas.getBoundingClientRect();
      const vx = Math.floor(((e.clientX - rect.left) * (canvas.width / rect.width)) / TILE_SIZE);
      const vy = Math.floor(((e.clientY - rect.top) * (canvas.height / rect.height)) / TILE_SIZE);
      if (vx < 0 || vx >= VIEWPORT_WIDTH || vy < 0 || vy >= VIEWPORT_HEIGHT) return;

      const gx = cam.camX + vx;
      const gy = cam.camY + vy;
      const dx = gx - gameState.hero.x;
      const dy = gy - gameState.hero.y;

      if (dx === 0 && dy === 0) {
        if (isAutoWalking()) {
          cancelAutoWalk();
        } else {
          useStairsAtPlayer();
        }
      } else if (Math.abs(dx) + Math.abs(dy) === 1) {
        cancelAutoWalk();
        handlePlayerAction(dx, dy);
      } else if (gx >= 0 && gx < cam.fw && gy >= 0 && gy < cam.fh) {
        startAutoWalkTo(gx, gy);
      }
    });
  }

  // Sidebar Minimap Click-to-Travel
  const minimap = document.getElementById('minimapCanvas');
  if (minimap) {
    minimap.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const pt = minimapPixelToGrid(minimap, e.clientX, e.clientY, floor);
      if (pt && floor.explored[pt.y] && floor.explored[pt.y][pt.x]) {
        startAutoWalkTo(pt.x, pt.y);
      }
    });
  }

  // Full-Floor Survey Map Hover & Click-to-Travel
  const fullMap = document.getElementById('fullMapCanvas');
  if (fullMap) {
    fullMap.addEventListener('mousemove', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const lbl = document.getElementById('fullMapHoverLabel');
      if (!lbl) return;
      const pt = minimapPixelToGrid(fullMap, e.clientX, e.clientY, floor);
      if (!pt || !floor.explored[pt.y] || !floor.explored[pt.y][pt.x]) {
        lbl.textContent = 'Unexplored Shadow';
        return;
      }
      const t = floor.tiles[pt.y][pt.x];
      if (ORE_CATALOG[t]) lbl.textContent = `(${pt.x}, ${pt.y}) • ${ORE_CATALOG[t].name} Vein — Click to Auto-Walk`;
      else if (t === TILE_STAIRS_UP) lbl.textContent = `(${pt.x}, ${pt.y}) • Ascending Stairs (<) — Click to Auto-Walk`;
      else if (t === TILE_STAIRS_DOWN) lbl.textContent = `(${pt.x}, ${pt.y}) • Descending Stairs (>) — Click to Auto-Walk`;
      else if (t === TILE_CHEST) lbl.textContent = `(${pt.x}, ${pt.y}) • Gilded Vault Chest — Click to Auto-Walk`;
      else if (t === TILE_SHRINE) lbl.textContent = `(${pt.x}, ${pt.y}) • Astral Shrine — Click to Auto-Walk`;
      else lbl.textContent = `(${pt.x}, ${pt.y}) • Explored Tile — Click to Auto-Walk`;
    });

    fullMap.addEventListener('click', e => {
      if (gameState.inGuild || !gameState.hero) return;
      const floor = ensureDungeonFloorHydrated(gameState.dungeon, gameState.dungeon.currentFloor);
      if (!floor) return;
      const pt = minimapPixelToGrid(fullMap, e.clientX, e.clientY, floor);
      if (pt && floor.explored[pt.y] && floor.explored[pt.y][pt.x]) {
        closeFullMapModal();
        startAutoWalkTo(pt.x, pt.y);
      }
    });
  }
}
