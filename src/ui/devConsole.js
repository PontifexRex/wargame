// Developer & Tester Console UI Component (Overlay, Command REPL & Quick Toolbar)

import { gameState } from '../engine/state.js';
import {
  gotoFloor,
  setHeroLevel,
  fullHeal,
  revealMap,
  toggleGodMode,
  executeDevCommand
} from '../engine/dev.js';

let commandHistory = [];
let historyIndex = -1;

export function isDevConsoleOpen() {
  if (typeof document === 'undefined') return false;
  const modal = document.getElementById('devConsoleModal');
  return modal && !modal.classList.contains('hidden');
}

export function openDevConsole() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('devConsoleModal');
  if (!modal) return;

  // Populate dungeon select options if empty
  const dngSelect = document.getElementById('devDungeonSelect');
  if (dngSelect && dngSelect.children.length === 0 && gameState.dungeons) {
    const dKeys = Object.keys(gameState.dungeons);
    dngSelect.innerHTML = dKeys.map(k => {
      const d = gameState.dungeons[k];
      const isCur = k === gameState.activeDungeonId;
      return `<option value="${k}" ${isCur ? 'selected' : ''}>${d.name || k}</option>`;
    }).join('');
  }

  // Pre-fill current floor depth & level
  const depthInput = document.getElementById('devFloorDepthInput');
  if (depthInput && gameState.dungeon) {
    depthInput.value = gameState.dungeon.currentFloor || 1;
  }
  const levelInput = document.getElementById('devHeroLevelInput');
  if (levelInput && gameState.hero) {
    levelInput.value = gameState.hero.level || 1;
  }

  modal.classList.remove('hidden');

  const inputEl = document.getElementById('devConsoleInput');
  if (inputEl) {
    inputEl.focus();
  }
}

export function closeDevConsole() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('devConsoleModal');
  if (modal) modal.classList.add('hidden');
}

export function toggleDevConsole() {
  if (isDevConsoleOpen()) {
    closeDevConsole();
  } else {
    openDevConsole();
  }
}

export function logDevConsole(text, tone = 'info') {
  if (typeof document === 'undefined') return;
  const outBox = document.getElementById('devConsoleOutput');
  if (!outBox) return;

  const colors = {
    gold: '#fbbf24',
    good: '#34d399',
    bad:  '#f87171',
    info: '#94a3b8'
  };

  const line = document.createElement('div');
  line.style.color = colors[tone] || colors.info;
  line.textContent = `> ${text}`;
  outBox.appendChild(line);

  while (outBox.children.length > 80) {
    outBox.removeChild(outBox.firstChild);
  }
  outBox.scrollTop = outBox.scrollHeight;
}

export function handleDevWarpClick() {
  if (typeof document === 'undefined') return;
  const dngSelect = document.getElementById('devDungeonSelect');
  const depthInput = document.getElementById('devFloorDepthInput');
  const dId = dngSelect ? dngSelect.value : null;
  const depth = depthInput ? Number(depthInput.value) : 1;

  const res = gotoFloor(depth, dId);
  if (res.ok) {
    logDevConsole(`Warped to ${res.dungeonName} Floor ${res.depth} at (${res.x}, ${res.y})`, 'gold');
  } else {
    logDevConsole(`Failed to warp: ${res.reason}`, 'bad');
  }
}

export function handleDevSetLevelClick() {
  if (typeof document === 'undefined') return;
  const levelInput = document.getElementById('devHeroLevelInput');
  const targetLevel = levelInput ? Number(levelInput.value) : 1;

  const res = setHeroLevel(targetLevel);
  if (res.ok) {
    logDevConsole(`Hero level set to ${res.level} (${res.talentPoints} Talents, ${res.statPoints} Stat Pts)`, 'gold');
  } else {
    logDevConsole(`Failed to set level: ${res.reason}`, 'bad');
  }
}

export function handleDevFullHealClick() {
  const res = fullHeal();
  if (res.ok) {
    logDevConsole(`Restored full HP (${res.hp}) & MP (${res.mp})`, 'good');
  }
}

export function handleDevRevealMapClick() {
  const res = revealMap();
  if (res.ok) {
    logDevConsole(`Revealed full chart for Floor ${res.depth}`, 'gold');
  }
}

export function handleDevGodModeClick() {
  const res = toggleGodMode();
  if (res.ok) {
    logDevConsole(`God Mode is now ${res.godMode ? 'ACTIVE' : 'OFF'}`, res.godMode ? 'gold' : 'info');
  }
}

export function handleDevTerminalSubmit() {
  if (typeof document === 'undefined') return;
  const inputEl = document.getElementById('devConsoleInput');
  if (!inputEl) return;

  const cmd = inputEl.value.trim();
  if (!cmd) return;

  commandHistory.push(cmd);
  historyIndex = commandHistory.length;
  inputEl.value = '';

  logDevConsole(`$ ${cmd}`, 'info');

  const res = executeDevCommand(cmd);
  logDevConsole(res.output, res.ok ? 'good' : 'bad');
}

export function handleDevTerminalKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleDevTerminalSubmit();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (commandHistory.length === 0) return;
    if (historyIndex > 0) historyIndex--;
    const inputEl = document.getElementById('devConsoleInput');
    if (inputEl) inputEl.value = commandHistory[historyIndex] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (commandHistory.length === 0) return;
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      const inputEl = document.getElementById('devConsoleInput');
      if (inputEl) inputEl.value = commandHistory[historyIndex] || '';
    } else {
      historyIndex = commandHistory.length;
      const inputEl = document.getElementById('devConsoleInput');
      if (inputEl) inputEl.value = '';
    }
  }
}
