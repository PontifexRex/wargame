// In-Game Modals, Guild Controllers, Item Inspection, Class Selection & Save Sync

import { RARITY } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { TALENT_TREES } from '../data/talents.js';
import {
  gameState,
  setGameState,
  migrateSaveData,
  saveGame,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability
} from '../engine/state.js';
import { generateFloor } from '../engine/procedural.js';
import { playSound } from '../engine/audio.js';
import { sellArmoryItem } from '../engine/actions.js';
import { updateFOV } from './renderer.js';
import { updateAllUI, logChronicle } from './domSync.js';

let inspectedItemContext = null;

export function getInspectedItemContext() {
  return inspectedItemContext;
}

export function descendIntoDungeon() {
  gameState.inGuild = false;
  gameState.dungeon.currentFloor = 1;
  if (!gameState.dungeon.floors[1]) {
    gameState.dungeon.floors[1] = generateFloor(1);
  }
  const f1 = gameState.dungeon.floors[1];
  gameState.hero.x = f1.upPos.x;
  gameState.hero.y = f1.upPos.y;
  updateFOV();
  saveGame();
  updateAllUI();
  logChronicle(`Descended into Floor 1 of ${gameState.dungeon.seedCode}.`, 'gold');
}

export function showOutcomeModal(title, desc, details = [], isConfirmNewDungeon = false) {
  if (typeof document === 'undefined') return;
  document.getElementById('outcomeModalTitle').textContent = title;
  document.getElementById('outcomeModalDesc').textContent = desc;
  document.getElementById('outcomeModalDetails').innerHTML = details.map(d => `<div>• ${d}</div>`).join('');
  const btnBox = document.getElementById('outcomeModalButtons');
  if (isConfirmNewDungeon) {
    btnBox.innerHTML = `
      <button onclick="window.Aethelgard.closeOutcomeModal()" class="px-3 py-1.5 rounded bg-[#1a2232] text-xs font-mono-num text-[#8b949e]">Cancel</button>
      <button onclick="window.Aethelgard.confirmChartNewDungeon()" class="px-4 py-1.5 rounded bg-[#f87171] text-[#080b11] font-bold text-xs font-mono-num">Confirm New Chart</button>
    `;
  } else {
    btnBox.innerHTML = `<button onclick="window.Aethelgard.closeOutcomeModal()" class="px-4 py-1.5 rounded bg-[#fbbf24] text-[#080b11] font-bold text-xs">Continue</button>`;
  }
  document.getElementById('outcomeModal').classList.remove('hidden');
}

export function closeOutcomeModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('outcomeModal').classList.add('hidden');
}

export function openNewDungeonModal() {
  showOutcomeModal(
    'Chart New Subterranean Dungeon?',
    'Guild Cartographers will seal the current dungeon shaft and chart a fresh procedural layout across all floors. Your character level, Vault Gold, and minerals are preserved.',
    [`Current Chart: ${gameState.dungeon.seedCode}`, `Explored Floors to Reset: ${Object.keys(gameState.dungeon.floors).length}`],
    true
  );
}

export function closeNewDungeonModal() {
  closeOutcomeModal();
}

export function confirmChartNewDungeon() {
  gameState.dungeon.seedCode = 'STAR-' + (1000 + Math.floor(Math.random() * 8999));
  gameState.dungeon.currentFloor = 1;
  gameState.dungeon.floors = { 1: generateFloor(1) };
  closeOutcomeModal();
  playSound('lvl');
  logChronicle(`Charted new dungeon seed ${gameState.dungeon.seedCode}!`, 'gold');
  saveGame();
  updateAllUI();
}

export function restAtGuild() {
  recomputeHeroDerivedStats(true, gameState);
  gameState.hero.statuses = [];
  playSound('lvl');
  logChronicle('Rested at the Sanctuary Hearth. HP and MP restored to 100%!', 'good');
  saveGame();
  updateAllUI();
}

export function repairPickaxeAtGuild() {
  const pick = gameState.hero.equipment.pickaxe;
  if (!pick) return;
  const maxDur = getPickaxeMaxDurability();
  if (pick.curDur >= maxDur) {
    logChronicle('Your pickaxe is already at full durability.', 'info');
    return;
  }
  if (gameState.guildVault.gold < 10) {
    logChronicle('Need 10 Vault Gold to repair your pickaxe.', 'bad');
    return;
  }
  gameState.guildVault.gold -= 10;
  pick.curDur = maxDur;
  playSound('mine');
  logChronicle(`Blacksmith repaired ${pick.name} to ${maxDur}/${maxDur} durability.`, 'good');
  saveGame();
  updateAllUI();
}

export function spendStatPoint(stat) {
  const h = gameState.hero;
  if ((h.statPoints || 0) <= 0) return;
  h.bonusStats = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 };
  h.bonusStats[stat] = (h.bonusStats[stat] || 0) + 1;
  h.statPoints -= 1;
  recomputeHeroDerivedStats(false, gameState);
  saveGame();
  updateAllUI();
}

export function allocateTalent(tId) {
  const h = gameState.hero;
  const talents = TALENT_TREES[h.classId] || [];
  const tDef = talents.find(t => t.id === tId);
  if (!tDef || (h.talentPoints || 0) <= 0) return;
  const cur = h.talentsAllocated[tId] || 0;
  if (cur >= tDef.max) return;
  h.talentsAllocated[tId] = cur + 1;
  h.talentPoints -= 1;
  playSound('lvl');
  recomputeHeroDerivedStats(false, gameState);
  logChronicle(`Trained ${tDef.name} (Rank ${cur + 1}/${tDef.max})!`, 'good');
  saveGame();
  updateAllUI();
}

export function respecTalents() {
  const h = gameState.hero;
  if (gameState.guildVault.gold < 25) {
    logChronicle('Need 25 Vault Gold to reset talents.', 'bad');
    return;
  }
  let refunded = 0;
  Object.values(h.talentsAllocated).forEach(v => { refunded += v; });
  if (refunded === 0) return;
  gameState.guildVault.gold -= 25;
  h.talentPoints = (h.talentPoints || 0) + refunded;
  h.talentsAllocated = {};
  recomputeHeroDerivedStats(false, gameState);
  logChronicle(`Reset talents! Refunded ${refunded} Talent Points.`, 'gold');
  saveGame();
  updateAllUI();
}

export function closeItemInspectModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('itemInspectModal').classList.add('hidden');
}

export function openItemInspectModal(refId, isEquippedSlot = false, fromExpedition = false) {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  let item = null;
  if (isEquippedSlot) {
    item = h.equipment[refId];
  } else if (fromExpedition) {
    item = h.expeditionGear.find(g => g.uid === refId);
  } else {
    item = gameState.guildVault.armory.find(g => g.uid === refId);
  }
  if (!item) return;

  inspectedItemContext = { item, isEquippedSlot, fromExpedition };
  const r = RARITY[item.rarity] || RARITY.common;
  const badge = document.getElementById('inspectRarityBadge');
  badge.textContent = `${r.name} • ${item.slot.toUpperCase()}`;
  badge.style.backgroundColor = `${r.color}25`;
  badge.style.color = r.color;

  const title = document.getElementById('inspectItemTitle');
  title.textContent = item.name;
  title.style.color = r.color;

  const curEq = h.equipment[item.slot];
  const statKeys = [
    { k: 'atk',    label: 'Attack' },
    { k: 'def',    label: 'Defense' },
    { k: 'str',    label: 'Strength' },
    { k: 'dex',    label: 'Dexterity' },
    { k: 'int',    label: 'Intelligence' },
    { k: 'vit',    label: 'Vitality' },
    { k: 'crit',   label: 'Crit Chance %' },
    { k: 'dodge',  label: 'Dodge %' },
    { k: 'maxHp',  label: 'Max HP' },
    { k: 'maxMp',  label: 'Max MP' },
    { k: 'maxDur', label: 'Base Durability' }
  ];

  const rows = [];
  statKeys.forEach(({ k, label }) => {
    const newVal = item[k] || 0;
    const oldVal = curEq ? (curEq[k] || 0) : 0;
    if (newVal > 0 || oldVal > 0) {
      const diff = newVal - oldVal;
      const diffBadge = isEquippedSlot
        ? `<span class="text-[#8b949e]">(Equipped)</span>`
        : diff > 0
          ? `<span class="text-[#34d399] font-bold">(+${diff})</span>`
          : diff < 0
            ? `<span class="text-[#f87171] font-bold">(${diff})</span>`
            : `<span class="text-[#8b949e]">(0)</span>`;
      rows.push(`<div class="flex justify-between"><span>${label}:</span><span><strong>${newVal}</strong> ${diffBadge}</span></div>`);
    }
  });
  document.getElementById('inspectComparisonBody').innerHTML = rows.join('') || `<div class="text-[#8b949e]">Standard equipment piece</div>`;

  const affEl = document.getElementById('inspectAffixesBody');
  if (item.affixes && item.affixes.length > 0) {
    affEl.innerHTML = item.affixes.map(a => `<div class="text-[#fbbf24]">★ +${a.val} ${a.stat.toUpperCase()} (${a.label})</div>`).join('');
  } else {
    affEl.innerHTML = '';
  }

  const btnEquip = document.getElementById('btnInspectEquip');
  const btnSell = document.getElementById('btnInspectSell');

  if (isEquippedSlot) {
    btnEquip.textContent = 'Unequip';
    btnEquip.onclick = () => {
      if (item.slot === 'pickaxe') {
        logChronicle('Pickaxe cannot be unequipped directly; buy or equip a replacement.', 'info');
      } else {
        h.equipment[item.slot] = null;
        gameState.guildVault.armory.push(item);
        recomputeHeroDerivedStats(false, gameState);
        saveGame();
        updateAllUI();
      }
      closeItemInspectModal();
    };
    btnSell.classList.add('hidden');
  } else {
    btnEquip.textContent = 'Equip Now';
    btnEquip.onclick = () => {
      const prev = h.equipment[item.slot];
      h.equipment[item.slot] = item;
      if (fromExpedition) {
        h.expeditionGear = h.expeditionGear.filter(g => g.uid !== item.uid);
        if (prev) h.expeditionGear.push(prev);
      } else {
        gameState.guildVault.armory = gameState.guildVault.armory.filter(g => g.uid !== item.uid);
        if (prev) gameState.guildVault.armory.push(prev);
      }
      playSound('lvl');
      recomputeHeroDerivedStats(false, gameState);
      saveGame();
      updateAllUI();
      closeItemInspectModal();
    };
    btnSell.classList.remove('hidden');
    const assayMult = 1 + (gameState.guildResearch.assay || 0) * 0.35;
    const saleVal = Math.round((item.value || 15) * assayMult);
    btnSell.textContent = `Sell (+${saleVal}g)`;
    btnSell.onclick = () => {
      if (fromExpedition) {
        h.expeditionGear = h.expeditionGear.filter(g => g.uid !== item.uid);
        gameState.guildVault.gold += saleVal;
      } else {
        sellArmoryItem(item.uid);
      }
      saveGame();
      updateAllUI();
      closeItemInspectModal();
    };
  }

  document.getElementById('itemInspectModal').classList.remove('hidden');
}

export function openClassSelectModal(allowCancel = false) {
  if (typeof document === 'undefined') return;
  document.getElementById('btnCloseClassModal').classList.toggle('hidden', !allowCancel);
  const container = document.getElementById('classCardsContainer');
  container.innerHTML = Object.values(CLASSES).map(c => `
    <div class="p-3.5 rounded-lg bg-[#080b11] border border-[#283347] hover:border-[#fbbf24] flex flex-col justify-between gap-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-display font-bold text-base" style="color:${c.color}">${c.name} — ${c.title}</span>
          <span class="text-[10px] font-mono-num px-2 py-0.5 rounded bg-[#1a2232] text-[#e6edf3]">HP ${c.hpBase} | MP ${c.mpBase}</span>
        </div>
        <div class="text-xs text-[#34d399] font-semibold mt-1.5">Passive: ${c.passiveName}</div>
        <p class="text-[11px] text-[#8b949e]">${c.passiveDesc}</p>
        <div class="text-xs text-[#60a5fa] font-semibold mt-1.5">Skill [Q]: ${c.skillName} (${c.skillCost} MP)</div>
        <p class="text-[11px] text-[#8b949e]">${c.skillDesc}</p>
      </div>
      <button onclick="window.Aethelgard.selectAdventurerClass('${c.id}')" class="w-full py-2 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase tracking-wider btn-tactical">
        Begin as ${c.name}
      </button>
    </div>
  `).join('');
  document.getElementById('classSelectModal').classList.remove('hidden');
}

export function closeClassSelectModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('classSelectModal').classList.add('hidden');
}

export function selectAdventurerClass(classId, targetState = gameState) {
  const cls = CLASSES[classId] || CLASSES.fighter;
  targetState.hero = {
    name: cls.name,
    classId: cls.id,
    level: 1,
    xp: 0,
    maxXp: 60,
    statPoints: 0,
    bonusStats: { str: 0, dex: 0, int: 0, vit: 0 },
    hp: cls.hpBase,
    maxHp: cls.hpBase,
    mp: cls.mpBase,
    maxMp: cls.mpBase,
    atk: 12,
    def: 6,
    crit: 5,
    dodge: 5,
    talentPoints: 1,
    talentsAllocated: {},
    consumables: { potions: 2, recalls: 1 },
    equipment: JSON.parse(JSON.stringify(cls.starterGear)),
    expeditionPack: [],
    expeditionGear: [],
    statuses: [],
    usedDivineIntervention: false,
    x: 1,
    y: 1
  };
  targetState.inGuild = true;
  targetState.dungeon.currentFloor = 1;
  targetState.dungeon.floors = { 1: generateFloor(1) };

  recomputeHeroDerivedStats(true, targetState);

  if (targetState === gameState) {
    closeClassSelectModal();
    logChronicle(`Sworn into the Oakhaven Guild as a ${cls.name} (${cls.title})!`, 'gold');
    saveGame();
    updateAllUI();
  }
}

export function openSaveSyncModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('saveJsonTextarea').value = JSON.stringify(gameState, null, 2);
  document.getElementById('saveSyncStatusMsg').textContent = '';
  document.getElementById('saveSyncModal').classList.remove('hidden');
}

export function closeSaveSyncModal() {
  if (typeof document === 'undefined') return;
  document.getElementById('saveSyncModal').classList.add('hidden');
}

export function copySaveJson() {
  if (typeof document === 'undefined') return;
  const area = document.getElementById('saveJsonTextarea');
  area.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(area.value).catch(() => {
      document.execCommand('copy');
    });
  } else {
    document.execCommand('copy');
  }
  document.getElementById('saveSyncStatusMsg').textContent = '✓ Copied save JSON to clipboard!';
}

export function downloadSaveJson() {
  if (typeof document === 'undefined') return;
  const blob = new Blob([document.getElementById('saveJsonTextarea').value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `aethelgard_${gameState.dungeon.seedCode}.json`;
  a.click();
}

export function importSaveJson() {
  if (typeof document === 'undefined') return;
  try {
    const raw = document.getElementById('saveJsonTextarea').value;
    const migrated = migrateSaveData(raw);
    setGameState(migrated);
    recomputeHeroDerivedStats(false, gameState);
    saveGame();
    updateAllUI();
    closeSaveSyncModal();
    logChronicle('Imported & migrated save state to Schema v3!', 'good');
  } catch (e) {
    document.getElementById('saveSyncStatusMsg').textContent = '✕ Invalid JSON format.';
  }
}
