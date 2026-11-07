// Unified Keyboard, Mouse & Tactical Tile Scanner Input Listeners

import {
  TILE_SIZE,
  GRID_W,
  GRID_H,
  TILE_CHEST,
  TILE_STAIRS_UP,
  TILE_STAIRS_DOWN
} from '../constants.js';
import { ORE_CATALOG } from '../data/ores.js';
import { gameState } from '../engine/state.js';
import { useHealingTonic, useRecallScroll } from '../engine/actions.js';
import {
  handlePlayerAction,
  executeClassSkill,
  useStairsAtPlayer,
  waitTurn
} from '../engine/combat.js';
import { setHoverTile } from './renderer.js';

export function updateScannerOnHover(gx, gy) {
  if (typeof document === 'undefined') return;
  const floor = gameState.dungeon.floors[gameState.dungeon.currentFloor];
  if (!floor || !floor.explored[gy][gx]) return;
  const box = document.getElementById('uiScannerContent');
  if (!box) return;

  const monster = floor.monsters.find(m => m.x === gx && m.y === gy);
  if (monster) {
    box.innerHTML = `
      <div class="font-bold" style="color:${monster.color}">${monster.name} ${monster.isBoss ? '👑' : ''}</div>
      <div class="text-[11px] text-[#e6edf3]">HP: ${monster.hp}/${monster.maxHp} • ATK: ${monster.atk} • DEF: ${monster.def}</div>
      <div class="text-[10px] text-[#8b949e]">${monster.affix ? monster.affix.desc : (monster.isRanged ? 'Ranged Attacker (3 tiles)' : 'Melee Guardian')}</div>
    `;
    return;
  }

  const t = floor.tiles[gy][gx];
  if (ORE_CATALOG[t]) {
    const ore = ORE_CATALOG[t];
    box.innerHTML = `
      <div class="font-bold" style="color:${ore.color}">${ore.name} Vein</div>
      <div class="text-[11px] text-[#e6edf3]">Base Value: ${ore.baseValue}g • Requires Geology Rank ${ore.minGeology}</div>
      <div class="text-[10px] text-[#8b949e]">Step into this wall to swing your pickaxe.</div>
    `;
  } else if (t === TILE_CHEST) {
    box.innerHTML = `<div class="font-bold text-[#fbbf24]">Gilded Vault Chest</div><div class="text-[11px] text-[#8b949e]">Contains relics and procedural equipment.</div>`;
  } else if (t === TILE_STAIRS_UP) {
    box.innerHTML = `<div class="font-bold text-[#34d399]">Ascending Stairs (&lt;)</div><div class="text-[11px] text-[#8b949e]">Stand on stairs and press [E] to ascend or extract to the Guild.</div>`;
  } else if (t === TILE_STAIRS_DOWN) {
    box.innerHTML = `<div class="font-bold text-[#60a5fa]">Descending Stairs (&gt;)</div><div class="text-[11px] text-[#8b949e]">Stand on stairs and press [E] to descend deeper.</div>`;
  } else {
    box.innerHTML = `<div class="font-semibold text-[#8b949e]">Vault Masonry (${gx}, ${gy})</div><div class="text-[11px] text-[#8b949e]">Click adjacent tiles or use WASD/Arrows to move.</div>`;
  }
}

export function setupInputs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.addEventListener('keydown', e => {
    const classModal = document.getElementById('classSelectModal');
    const saveModal = document.getElementById('saveSyncModal');
    if (classModal && !classModal.classList.contains('hidden')) return;
    if (saveModal && !saveModal.classList.contains('hidden')) return;
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
  if (!canvas) return;

  canvas.addEventListener('mousemove', e => {
    if (gameState.inGuild || !gameState.hero) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
      setHoverTile({ x: gx, y: gy });
      updateScannerOnHover(gx, gy);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    setHoverTile(null);
  });

  canvas.addEventListener('click', e => {
    if (gameState.inGuild || !gameState.hero) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - rect.left) * (canvas.width / rect.width)) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * (canvas.height / rect.height)) / TILE_SIZE);
    const dx = gx - gameState.hero.x;
    const dy = gy - gameState.hero.y;
    if (dx === 0 && dy === 0) {
      useStairsAtPlayer();
    } else if (Math.abs(dx) + Math.abs(dy) === 1) {
      handlePlayerAction(dx, dy);
    }
  });
}
