// In-Game Modals, Expedition Atlas & Custom Charter Builder, Full-Floor Survey Map, Item Inspect & Save Sync

import {
  RARITY,
  LAPIDARY_UNSOCKET_COST,
  MAP_SIZE_PRESETS,
  DEFAULT_MAX_CHARTERED_DUNGEONS
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { TALENT_TREES } from '../data/talents.js';
import { GEM_IDS, GEM_CATALOG } from '../data/gems.js';
import { LAYOUT_STYLES } from '../data/dungeons.js';
import {
  gameState,
  setGameState,
  migrateSaveData,
  serializeStateForStorage,
  saveGame,
  normalizeEquipmentSockets,
  ensureDungeonFloorHydrated,
  syncActiveDungeonAlias,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability
} from '../engine/state.js';
import { generateFloor } from '../engine/procedural.js';
import { playSound } from '../engine/audio.js';
import {
  sellArmoryItem,
  socketGemIntoItem,
  unsocketGemFromItem,
  ensureGuildBounties,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon
} from '../engine/actions.js';
import { cancelAutoWalk } from '../engine/combat.js';
import { updateFOV, renderMinimapCanvas } from './renderer.js';
import { updateAllUI, logChronicle } from './domSync.js';

let inspectedItemContext = null;
let pendingAtlasResetId = null;

export function getInspectedItemContext() {
  return inspectedItemContext;
}

export function descendIntoDungeon() {
  cancelAutoWalk();
  syncActiveDungeonAlias(gameState);
  gameState.inGuild = false;
  gameState.dungeon.currentFloor = 1;
  if (!gameState.dungeon.floors[1]) {
    gameState.dungeon.floors[1] = generateFloor(
      1,
      gameState.dungeon.config,
      gameState.dungeon.numericSeed
    );
  }
  const f1 = ensureDungeonFloorHydrated(gameState.dungeon, 1);
  gameState.hero.x = f1.upPos.x;
  gameState.hero.y = f1.upPos.y;
  updateFOV();
  saveGame();
  updateAllUI();
  logChronicle(
    `Descended into Floor 1 of ${gameState.dungeon.name} (${f1.width}x${f1.height} • ${gameState.dungeon.seedCode}).`,
    'gold'
  );
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
      <button onclick="window.Aethelgard.confirmChartNewDungeon()" class="px-4 py-1.5 rounded bg-[#f87171] text-[#080b11] font-bold text-xs font-mono-num">Confirm Re-Chart</button>
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

// ============================================================================
// MULTI-DUNGEON EXPEDITION ATLAS & CUSTOM CHARTER MODAL
// ============================================================================

const FAMILY_LABELS = {
  balanced: 'Mixed Vault Host',
  beasts: 'Subterranean Beasts',
  dwarven_forge: 'Dwarven Forge Constructs',
  astral_cult: 'Astral Void Cult',
  ancient_crypt: 'Ancient Undead Crypt'
};

const ORE_LABELS = {
  balanced: 'Balanced Seams',
  copper_iron: 'Copper & Iron Heavy',
  mithril_geode: 'Mithril & Relic Geodes',
  astral_crystal: 'Star-Crystal & Astralite'
};

export function renderExpeditionAtlasContents() {
  if (typeof document === 'undefined') return;
  const listEl = document.getElementById('atlasDungeonsList');
  if (!listEl) return;

  const allIds = Object.keys(gameState.dungeons || {});
  const sortedIds = allIds.slice().sort((a, b) => {
    const da = gameState.dungeons[a];
    const db = gameState.dungeons[b];
    if (da.originType !== db.originType) {
      return da.originType === 'curated' ? -1 : 1;
    }
    return 0;
  });

  const charteredCount = sortedIds.filter(
    id => gameState.dungeons[id] && gameState.dungeons[id].originType === 'chartered'
  ).length;
  const cap = gameState.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS;
  const badgeEl = document.getElementById('uiAtlasCharterCountBadge');
  if (badgeEl) {
    badgeEl.textContent = `${charteredCount} / ${cap} Chartered`;
  }

  const curCart = (gameState.guildResearch && gameState.guildResearch.cartography) || 0;

  listEl.innerHTML = sortedIds.map(id => {
    const dng = gameState.dungeons[id];
    const cfg = dng.config || {};
    const isActive = id === gameState.activeDungeonId;
    const reqCart = cfg.reqCartography || 0;
    const locked = curCart < reqCart;
    const chartedCount = Object.keys(dng.floors || {}).length;
    const maxDepthText = cfg.maxDepth >= 999 ? '∞ Floors' : `Max Fl ${cfg.maxDepth}`;
    const styleDef = LAYOUT_STYLES[cfg.layoutStyle] || LAYOUT_STYLES.masonry_vaults;
    const famLabel = FAMILY_LABELS[cfg.monsterFamily] || cfg.monsterFamily;
    const oreLabel = ORE_LABELS[cfg.oreFocus] || cfg.oreFocus;
    const isConfirmingReset = pendingAtlasResetId === id;

    let actionButtons = '';
    if (locked) {
      actionButtons = `
        <span class="px-2.5 py-1 rounded bg-[#1a2232] text-[#f87171] border border-[#f87171]/40 text-[11px] font-mono-num">
          🔒 Req Vault Cartography R${reqCart}
        </span>
      `;
    } else if (isConfirmingReset) {
      actionButtons = `
        <span class="text-[11px] text-[#f87171] font-bold mr-1">${dng.originType === 'chartered' ? 'Abandon charter?' : 'Seal & re-chart floors?'}</span>
        <button onclick="window.Aethelgard.handleResetDungeonFromAtlas('${id}')" class="px-2.5 py-1 rounded bg-[#f87171] text-[#080b11] text-[11px] font-mono-num font-bold btn-tactical">Confirm</button>
        <button onclick="window.Aethelgard.cancelResetDungeonFromAtlas()" class="px-2 py-1 rounded bg-[#1a2232] text-[#8b949e] text-[11px] font-mono-num">Cancel</button>
      `;
    } else {
      actionButtons = `
        ${isActive
          ? `<span class="px-2.5 py-1 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/50 text-[11px] font-mono-num font-bold">✓ Selected</span>`
          : `<button onclick="window.Aethelgard.handleSelectDungeonFromAtlas('${id}', false)" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#e6edf3] border border-[#283347] text-[11px] font-mono-num font-bold btn-tactical">Select</button>`
        }
        <button onclick="window.Aethelgard.handleSelectDungeonFromAtlas('${id}', true)" class="px-3 py-1 rounded bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] text-[11px] font-mono-num font-bold btn-tactical">
          ⚔️ Descend
        </button>
        <button onclick="window.Aethelgard.promptResetDungeonFromAtlas('${id}')" class="px-2 py-1 rounded bg-[#111722] hover:bg-[#1a2232] text-[#8b949e] hover:text-[#f87171] border border-[#283347] text-[11px] font-mono-num btn-tactical">
          ${dng.originType === 'chartered' ? '✕ Abandon' : '↻ Re-Chart'}
        </button>
      `;
    }

    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isActive ? 'border-[#fbbf24]' : 'border-[#283347]'} space-y-2">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-display font-bold text-sm" style="color:${cfg.themeColor || '#e6edf3'}">${dng.name}</span>
              <span class="text-[9px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-[#1a2232] text-[#8b949e] border border-[#283347]">
                ${dng.originType === 'curated' ? 'Regional' : 'Charter'}
              </span>
              ${dng.isCleared ? `<span class="text-[9px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] font-bold">★ Cleared</span>` : ''}
            </div>
            <div class="text-[11px] text-[#8b949e] mt-0.5">${cfg.subtitle || ''}</div>
          </div>
          <span class="text-[11px] font-mono-num text-[#60a5fa] font-bold">${dng.seedCode}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono-num">
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347]">
            <span class="text-[#8b949e]">Scale:</span> <strong class="text-[#fbbf24]">${cfg.width}x${cfg.height}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347]">
            <span class="text-[#8b949e]">Depth:</span> <strong class="text-[#e6edf3]">${chartedCount} charted / ${maxDepthText}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347] truncate" title="${famLabel}">
            <span class="text-[#8b949e]">Foes:</span> <strong class="text-[#f87171]">${famLabel}</strong>
          </div>
          <div class="bg-[#111722] px-2 py-1 rounded border border-[#283347] truncate" title="${oreLabel}">
            <span class="text-[#8b949e]">Veins:</span> <strong class="text-[#34d399]">${oreLabel}</strong>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#192234]">
          <span class="text-[10px] text-[#8b949e]">Architecture: <strong class="text-[#e6edf3]">${styleDef.name}</strong></span>
          <div class="flex flex-wrap items-center gap-1.5">${actionButtons}</div>
        </div>
      </div>
    `;
  }).join('');
}

export function openExpeditionAtlasModal() {
  if (typeof document === 'undefined') return;
  pendingAtlasResetId = null;
  const msgEl = document.getElementById('charterStatusMsg');
  if (msgEl) msgEl.textContent = '';
  renderExpeditionAtlasContents();
  const modal = document.getElementById('expeditionAtlasModal');
  if (modal) modal.classList.remove('hidden');
}

export function closeExpeditionAtlasModal() {
  if (typeof document === 'undefined') return;
  pendingAtlasResetId = null;
  const modal = document.getElementById('expeditionAtlasModal');
  if (modal) modal.classList.add('hidden');
}

export function handleSelectDungeonFromAtlas(dungeonId, descendImmediately = false) {
  const res = selectActiveDungeon(dungeonId, gameState);
  if (!res.ok) return;
  renderExpeditionAtlasContents();
  if (descendImmediately) {
    closeExpeditionAtlasModal();
    descendIntoDungeon();
  }
}

export function promptResetDungeonFromAtlas(dungeonId) {
  pendingAtlasResetId = dungeonId;
  renderExpeditionAtlasContents();
}

export function cancelResetDungeonFromAtlas() {
  pendingAtlasResetId = null;
  renderExpeditionAtlasContents();
}

export function handleResetDungeonFromAtlas(dungeonId) {
  pendingAtlasResetId = null;
  resetOrAbandonDungeon(dungeonId, gameState);
  renderExpeditionAtlasContents();
}

export function onCharterSizePresetChange() {
  if (typeof document === 'undefined') return;
  const sel = document.getElementById('charterSizeSelect');
  const wIn = document.getElementById('charterWidthInput');
  const hIn = document.getElementById('charterHeightInput');
  if (!sel || !wIn || !hIn) return;
  const preset = MAP_SIZE_PRESETS[sel.value];
  if (preset) {
    wIn.value = preset.width;
    hIn.value = preset.height;
  }
}

export function submitCharterForm(randomize = false) {
  if (typeof document === 'undefined') return;
  const nameEl = document.getElementById('charterNameInput');
  const sizeEl = document.getElementById('charterSizeSelect');
  const wEl = document.getElementById('charterWidthInput');
  const hEl = document.getElementById('charterHeightInput');
  const depthEl = document.getElementById('charterDepthInput');
  const styleEl = document.getElementById('charterStyleSelect');
  const monEl = document.getElementById('charterMonsterSelect');
  const oreEl = document.getElementById('charterOreSelect');
  const richEl = document.getElementById('charterRichnessSelect');
  const statusEl = document.getElementById('charterStatusMsg');

  let opts = {};
  if (randomize) {
    const sizeKeys = ['small', 'standard', 'sprawling', 'colossal'];
    const pickedSize = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
    const preset = MAP_SIZE_PRESETS[pickedSize];
    const randDepths = [1, 2, 3, 5, 8, 12];
    const richKeys = ['standard', 'rich', 'jackpot'];
    opts = {
      randomize: true,
      sizePreset: pickedSize,
      width: preset.width,
      height: preset.height,
      maxDepth: randDepths[Math.floor(Math.random() * randDepths.length)],
      richness: richKeys[Math.floor(Math.random() * richKeys.length)]
    };
  } else {
    const rawW = Math.max(36, Math.min(400, Math.round(Number(wEl && wEl.value) || 80)));
    const rawH = Math.max(28, Math.min(300, Math.round(Number(hEl && hEl.value) || 60)));
    const rawD = Math.max(1, Math.min(999, Math.round(Number(depthEl && depthEl.value) || 5)));
    if (wEl) wEl.value = rawW;
    if (hEl) hEl.value = rawH;
    if (depthEl) depthEl.value = rawD;

    opts = {
      name: nameEl && nameEl.value ? nameEl.value.trim() : '',
      sizePreset: sizeEl ? sizeEl.value : 'custom',
      width: rawW,
      height: rawH,
      maxDepth: rawD,
      layoutStyle: styleEl ? styleEl.value : 'masonry_vaults',
      monsterFamily: monEl ? monEl.value : 'balanced',
      oreFocus: oreEl ? oreEl.value : 'balanced',
      richness: richEl ? richEl.value : 'standard'
    };
  }

  const res = chartCustomExpedition(opts, gameState);
  if (statusEl) {
    if (res.ok) {
      statusEl.style.color = '#34d399';
      statusEl.textContent = `✓ Chartered "${res.dungeon.name}" (${res.dungeon.config.width}x${res.dungeon.config.height}, Max Fl ${res.dungeon.config.maxDepth})!`;
      if (nameEl && !randomize) nameEl.value = '';
    } else {
      statusEl.style.color = '#f87171';
      statusEl.textContent = res.reason === 'charter_cap_reached'
        ? `✕ Charter cap reached (${res.cap}). Abandon an existing charter first.`
        : '✕ Return to Guild Bastion before charting.';
    }
  }
  renderExpeditionAtlasContents();
}

export function openNewDungeonModal() {
  openExpeditionAtlasModal();
}

export function closeNewDungeonModal() {
  closeExpeditionAtlasModal();
  closeOutcomeModal();
}

export function confirmChartNewDungeon() {
  resetOrAbandonDungeon(gameState.activeDungeonId, gameState);
  gameState.dungeon.floors = {
    1: generateFloor(1, gameState.dungeon.config, gameState.dungeon.numericSeed)
  };
  closeOutcomeModal();
  saveGame();
  updateAllUI();
}

// ============================================================================
// FULL-FLOOR CARTOGRAPHER'S SURVEY MAP MODAL ([M])
// ============================================================================

export function openFullMapModal() {
  if (typeof document === 'undefined') return;
  if (gameState.inGuild) {
    openExpeditionAtlasModal();
    return;
  }
  const modal = document.getElementById('fullMapModal');
  if (!modal) return;

  const dng = gameState.dungeon;
  const floor = ensureDungeonFloorHydrated(dng, dng.currentFloor);
  const fw = floor ? floor.width : (dng.config.width || 80);
  const fh = floor ? floor.height : (dng.config.height || 60);

  const titleEl = document.getElementById('fullMapModalTitle');
  if (titleEl) {
    titleEl.textContent = `${dng.name} — Floor ${dng.currentFloor} (${fw}x${fh})`;
  }
  const subEl = document.getElementById('fullMapModalSubtitle');
  if (subEl) {
    subEl.textContent = `Seed ${dng.seedCode} • Position (${gameState.hero.x}, ${gameState.hero.y}) • Click any explored chamber or corridor to Auto-Walk`;
  }

  modal.classList.remove('hidden');
  renderMinimapCanvas('fullMapCanvas');
}

export function closeFullMapModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('fullMapModal');
  if (modal) modal.classList.add('hidden');
}

export function toggleFullMapModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('fullMapModal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) {
    openFullMapModal();
  } else {
    closeFullMapModal();
  }
}

// ============================================================================
// GUILD SERVICES, STATS, TALENTS, ITEM INSPECT, CLASS SELECT & SAVE SYNC
// ============================================================================

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
  normalizeEquipmentSockets(item);

  inspectedItemContext = { item, refId, isEquippedSlot, fromExpedition };
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
  const affHtml = [];
  if (item.affixes && item.affixes.length > 0) {
    item.affixes.forEach(a => {
      affHtml.push(`<div class="text-[#fbbf24]">★ +${a.val} ${a.stat.toUpperCase()} (${a.label})</div>`);
    });
  }

  // Render Astral Gem Sockets & Inline Lapidary Actions (when in Guild & banked/equipped)
  if ((item.maxSockets || 0) > 0) {
    const canModifySockets = gameState.inGuild && !fromExpedition;
    const targetRefKey = isEquippedSlot ? refId : item.uid;
    affHtml.push(`<div class="pt-2 mt-2 border-t border-[#283347] text-[11px] font-bold uppercase tracking-wider text-[#60a5fa]">Astral Sockets (${item.sockets.length}/${item.maxSockets})</div>`);

    for (let sIdx = 0; sIdx < item.maxSockets; sIdx++) {
      const gId = item.sockets[sIdx];
      if (gId && GEM_CATALOG[gId]) {
        const gDef = GEM_CATALOG[gId];
        const unsocketBtn = canModifySockets
          ? `<button onclick="window.Aethelgard.unsocketFromInspect('${targetRefKey}', ${sIdx}, ${isEquippedSlot})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px]">Extract (${LAPIDARY_UNSOCKET_COST}g)</button>`
          : '';
        affHtml.push(`
          <div class="flex items-center justify-between bg-[#080b11] p-1.5 rounded border border-[#283347]">
            <span style="color:${gDef.color}">◆ ${gDef.name} <span class="text-[#8b949e]">(${gDef.desc})</span></span>
            ${unsocketBtn}
          </div>
        `);
      } else {
        let gemButtons = '';
        if (canModifySockets && gameState.guildVault.gems) {
          const avail = GEM_IDS.filter(k => (gameState.guildVault.gems[k] || 0) > 0);
          if (avail.length > 0) {
            gemButtons = avail.map(k => {
              const gd = GEM_CATALOG[k];
              return `<button onclick="window.Aethelgard.socketFromInspect('${targetRefKey}', '${k}', ${isEquippedSlot})" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#283347] text-[10px]" style="color:${gd.color}">+${gd.shortName}</button>`;
            }).join(' ');
          } else {
            gemButtons = `<span class="text-[10px] text-[#8b949e]">No banked gems</span>`;
          }
        }
        affHtml.push(`
          <div class="flex flex-wrap items-center justify-between gap-1 bg-[#080b11] p-1.5 rounded border border-[#283347]">
            <span class="text-[#8b949e]">◇ Empty Socket</span>
            <div class="flex flex-wrap gap-1">${gemButtons}</div>
          </div>
        `);
      }
    }
  }

  affEl.innerHTML = affHtml.join('');

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

export function socketFromInspect(targetRef, gemId, isEquippedSlot) {
  const res = socketGemIntoItem(targetRef, gemId, isEquippedSlot, gameState);
  if (res.ok) {
    openItemInspectModal(targetRef, isEquippedSlot, false);
  }
}

export function unsocketFromInspect(targetRef, socketIdx, isEquippedSlot) {
  const res = unsocketGemFromItem(targetRef, socketIdx, isEquippedSlot, gameState);
  if (res.ok) {
    openItemInspectModal(targetRef, isEquippedSlot, false);
  }
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
  syncActiveDungeonAlias(targetState);
  const cls = CLASSES[classId] || CLASSES.fighter;
  const eqCopy = JSON.parse(JSON.stringify(cls.starterGear));
  Object.keys(eqCopy).forEach(k => {
    normalizeEquipmentSockets(eqCopy[k]);
  });

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
    equipment: eqCopy,
    expeditionPack: [],
    expeditionGear: [],
    statuses: [],
    usedDivineIntervention: false,
    x: 1,
    y: 1
  };
  targetState.inGuild = true;
  targetState.dungeon.currentFloor = 1;
  const f1 = generateFloor(1, targetState.dungeon.config, targetState.dungeon.numericSeed);
  targetState.dungeon.floors = { 1: f1 };
  targetState.hero.x = f1.upPos.x;
  targetState.hero.y = f1.upPos.y;
  ensureGuildBounties(false, targetState);

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
  document.getElementById('saveJsonTextarea').value = JSON.stringify(serializeStateForStorage(gameState), null, 2);
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
  document.getElementById('saveSyncStatusMsg').textContent = '✓ Copied compact RLE save JSON to clipboard!';
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
    logChronicle('Imported & migrated save state to Multi-Dungeon Atlas Schema v5!', 'good');
  } catch (e) {
    document.getElementById('saveSyncStatusMsg').textContent = '✕ Invalid JSON format.';
  }
}
