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
  toggleItemLock,
  socketGemIntoItem,
  unsocketGemFromItem,
  ensureGuildBounties,
  selectActiveDungeon,
  chartCustomExpedition,
  resetOrAbandonDungeon,
  equipItem,
  unequipItem,
  dropItem
} from '../engine/actions.js';
import { cancelAutoWalk } from '../engine/combat.js';
import { updateFOV, renderMinimapCanvas, drawHeroSprite, drawPaperDollMannequin } from './renderer.js';
import { updateAllUI, logChronicle, formatSocketPipsHtml } from './domSync.js';
import { computeItemPowerScore, isItemUpgrade, getItemTypeIcon, SLOT_METADATA } from '../data/items.js';

let inspectedItemContext = null;
let pendingAtlasResetId = null;

export function getInspectedItemContext() {
  return inspectedItemContext;
}

export function descendIntoDungeon() {
  cancelAutoWalk();
  syncActiveDungeonAlias(gameState);
  gameState.inGuild = false;
  gameState.activeView = 'dungeon';
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
  const btnLock = document.getElementById('btnInspectLock');

  if (btnLock) {
    if (item.locked) {
      btnLock.textContent = '🔒 Locked (Keep)';
      btnLock.className = 'px-3 py-1.5 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] border border-[#fbbf24]/50 text-xs font-mono-num font-bold btn-tactical';
    } else {
      btnLock.textContent = '🔓 Unlocked (Sellable)';
      btnLock.className = 'px-3 py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#8b949e] hover:text-[#e6edf3] border border-[#283347] text-xs font-mono-num btn-tactical';
    }
  }

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
    if (!gameState.inGuild) {
      btnSell.classList.add('hidden');
      btnSell.onclick = null;
    } else {
      btnSell.classList.remove('hidden');
      const assayMult = 1 + (gameState.guildResearch.assay || 0) * 0.35;
      const saleVal = Math.round((item.value || 15) * assayMult);
      btnSell.textContent = `Sell (+${saleVal}g)`;

      if (item.locked) {
        btnSell.disabled = true;
        btnSell.className = 'px-3 py-1.5 rounded bg-[#1a2232] text-[#8b949e] border border-[#283347] text-xs font-mono-num opacity-50 cursor-not-allowed';
        btnSell.title = 'Item is locked. Unlock it first to sell.';
        btnSell.onclick = null;
      } else {
        btnSell.disabled = false;
        btnSell.className = 'px-3 py-1.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-mono-num font-bold btn-tactical';
        btnSell.title = '';
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
    }
  }

  document.getElementById('itemInspectModal').classList.remove('hidden');
}

export function toggleLockFromInspect() {
  if (!inspectedItemContext || !inspectedItemContext.item) return;
  toggleItemLock(inspectedItemContext.item.uid);
  openItemInspectModal(inspectedItemContext.refId, inspectedItemContext.isEquippedSlot, inspectedItemContext.fromExpedition);
  updateAllUI();
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
  const classList = Object.values(CLASSES);
  for (let i = 0; i < classList.length; i++) {
    const c = classList[i];
    const cardCanvas = document.getElementById('classCardCanvas_' + c.id);
    if (cardCanvas && typeof cardCanvas.getContext === 'function') {
      const cardCtx = cardCanvas.getContext('2d');
      if (cardCtx) {
        cardCtx.clearRect(0, 0, 48, 48);
        drawHeroSprite(cardCtx, 4, 4, c.id, 40);
      }
    }
  }
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

// ============================================================================
// CHARACTER & INVENTORY MANAGEMENT MODAL & FLOATING COMPARISON TOOLTIP
// ============================================================================

let currentInventoryFilter = 'all';

export function isInventoryModalOpen() {
  if (typeof document === 'undefined') return false;
  const modal = document.getElementById('inventoryModal');
  return !!(modal && !modal.classList.contains('hidden'));
}

export function openInventoryModal() {
  if (typeof document === 'undefined') return;
  renderInventoryModal();
  const modal = document.getElementById('inventoryModal');
  if (modal) modal.classList.remove('hidden');
}

export function closeInventoryModal() {
  if (typeof document === 'undefined') return;
  hideFloatingItemTooltip();
  const modal = document.getElementById('inventoryModal');
  if (modal) modal.classList.add('hidden');
}

export function toggleInventoryModal() {
  if (isInventoryModalOpen()) {
    closeInventoryModal();
  } else {
    openInventoryModal();
  }
}

export function setInventoryFilter(filterCategory) {
  currentInventoryFilter = filterCategory || 'all';
  if (typeof document !== 'undefined') {
    const filters = ['all', 'weapon', 'armor', 'other'];
    for (let i = 0; i < filters.length; i++) {
      const f = filters[i];
      const btn = document.getElementById('inventoryFilter_' + f);
      if (btn) {
        if (f === currentInventoryFilter) {
          btn.className = 'px-2.5 py-1 rounded text-xs font-bold bg-[#fbbf24] text-[#080b11] border border-[#fbbf24]';
        } else {
          btn.className = 'px-2.5 py-1 rounded text-xs font-bold bg-[#111722] text-[#8b949e] border border-[#283347] hover:text-[#e6edf3]';
        }
      }
    }
  }
  renderInventoryModal();
}

export function handleInventoryEquip(uid) {
  equipItem(uid, gameState);
  renderInventoryModal();
  updateAllUI();
}

export function handleInventoryUnequip(slot) {
  unequipItem(slot, gameState);
  renderInventoryModal();
  updateAllUI();
}

export function handleInventoryDrop(uidOrId, isGear = true) {
  dropItem(uidOrId, isGear, gameState);
  renderInventoryModal();
  updateAllUI();
}

export function toggleLockFromInventory(uid) {
  toggleItemLock(uid, gameState);
  renderInventoryModal();
  updateAllUI();
}

export function renderInventoryModal() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  if (!h) return;
  const cls = CLASSES[h.classId] || CLASSES.fighter;

  // Portrait Canvas
  const pCanvas = document.getElementById('inventoryHeroPortraitCanvas');
  if (pCanvas) {
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 48, 48);
    drawHeroSprite(pCtx, 4, 4, h.classId, 40);
  }

  // Hero identity
  const nameEl = document.getElementById('inventoryHeroName');
  if (nameEl) nameEl.textContent = h.name;
  const titleEl = document.getElementById('inventoryHeroTitleBadge');
  if (titleEl) titleEl.textContent = cls.title;
  const lvlEl = document.getElementById('inventoryHeroLevel');
  if (lvlEl) lvlEl.textContent = h.level;
  const xpEl = document.getElementById('inventoryHeroXp');
  if (xpEl) xpEl.textContent = `${h.xp} / ${h.maxXp}`;

  // Vitals
  const hpText = document.getElementById('inventoryHpText');
  if (hpText) hpText.textContent = `${h.hp} / ${h.maxHp}`;
  const hpBar = document.getElementById('inventoryHpBar');
  if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100))}%`;

  const mpText = document.getElementById('inventoryMpText');
  if (mpText) mpText.textContent = `${h.mp} / ${h.maxMp}`;
  const mpBar = document.getElementById('inventoryMpBar');
  if (mpBar) mpBar.style.width = `${Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100))}%`;

  const pick = h.equipment ? h.equipment.pickaxe : null;
  const maxDur = getPickaxeMaxDurability();
  const curDur = pick ? pick.curDur : 0;
  const pickText = document.getElementById('inventoryPickaxeText');
  if (pickText) pickText.textContent = `${curDur} / ${maxDur}`;
  const pickBar = document.getElementById('inventoryPickaxeBar');
  if (pickBar) pickBar.style.width = `${Math.max(0, Math.min(100, (curDur / maxDur) * 100))}%`;

  // Stats
  const statIds = [
    ['inventoryStatStr', h.computedStr],
    ['inventoryStatDex', h.computedDex],
    ['inventoryStatInt', h.computedInt],
    ['inventoryStatVit', h.computedVit],
    ['inventoryStatAtk', h.atk],
    ['inventoryStatDef', h.def],
    ['inventoryStatCrit', `${h.crit}%`],
    ['inventoryStatDodge', `${h.dodge}%`]
  ];
  for (let i = 0; i < statIds.length; i++) {
    const el = document.getElementById(statIds[i][0]);
    if (el) el.textContent = statIds[i][1];
  }

  // Mannequin Canvas & Anatomical Paper-Doll Slots
  const dollCanvas = document.getElementById('inventoryPaperDollCanvas');
  if (dollCanvas) {
    drawPaperDollMannequin(dollCanvas, h);
  }

  const dollGrid = document.getElementById('inventoryPaperDollGrid');
  if (dollGrid) {
    const PAPER_DOLL_SLOTS = [
      // Row 1: Head & Neck
      { id: 'accessory', label: 'Trinket',  left: '10px',  top: '10px',  width: '84px', height: '64px', active: true },
      { id: 'helm',      label: 'Helm',     left: '128px', top: '10px',  width: '84px', height: '64px', active: true },
      { id: 'amulet',    label: 'Amulet',   right: '10px', top: '10px',  width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

      // Row 2: Torso & Weapons
      { id: 'weapon',    label: 'Weapon',   left: '10px',  top: '86px',  width: '84px', height: '70px', active: true },
      { id: 'armor',     label: 'Armor',    left: '128px', top: '86px',  width: '84px', height: '70px', active: true },
      { id: 'pickaxe',   label: 'Off-Hand', right: '10px', top: '86px',  width: '84px', height: '70px', active: true },

      // Row 3: Hands, Waist, Rings (Reserved)
      { id: 'gloves',    label: 'Gloves',   left: '10px',  top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },
      { id: 'belt',      label: 'Belt',     left: '128px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 3 Expansion' },
      { id: 'ring',      label: 'Ring',     right: '10px', top: '168px', width: '84px', height: '64px', active: false, tier: 'Tier 2 Expansion' },

      // Row 4: Feet
      { id: 'boots',     label: 'Boots',    left: '128px', top: '254px', width: '84px', height: '64px', active: true }
    ];

    dollGrid.innerHTML = PAPER_DOLL_SLOTS.map(cfg => {
      const posStyle = `top:${cfg.top};width:${cfg.width};height:${cfg.height};` +
        (cfg.left ? `left:${cfg.left};` : `right:${cfg.right};`);

      if (!cfg.active) {
        const icon = getItemTypeIcon(cfg.id);
        return `
          <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#05080e]/80 backdrop-blur-sm border border-[#1e293b]/60 flex flex-col justify-between items-center text-center opacity-60 cursor-not-allowed select-none group"
               style="${posStyle}"
               title="${cfg.label} Slot (${cfg.tier}) — Reserved for upcoming content expansion">
            <div class="w-full flex items-center justify-between text-[9px] text-[#475569]">
              <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
              <span>🔒</span>
            </div>
            <div class="text-base opacity-30 group-hover:opacity-50 transition-opacity">
              ${icon}
            </div>
            <div class="text-[8px] font-mono-num text-[#475569]">
              Locked
            </div>
          </div>
        `;
      }

      const it = h.equipment ? h.equipment[cfg.id] : null;
      const typeIcon = getItemTypeIcon(cfg.id);

      if (!it) {
        return `
          <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#080b11]/70 backdrop-blur-sm border border-dashed border-[#283347]/80 hover:border-[#fbbf24]/50 flex flex-col justify-between items-center text-center transition-colors group cursor-default select-none"
               style="${posStyle}">
            <div class="w-full flex items-center justify-between text-[9px] text-[#64748b]">
              <span class="uppercase tracking-wider font-semibold">${cfg.label}</span>
              <span>${typeIcon}</span>
            </div>
            <div class="text-lg opacity-40 group-hover:opacity-75 transition-opacity">
              ${typeIcon}
            </div>
            <div class="text-[9px] text-[#64748b] italic">
              (Empty)
            </div>
          </div>
        `;
      }

      const r = RARITY[it.rarity] || RARITY.common;
      const pwr = computeItemPowerScore(it);
      let statSummary = '—';
      if (cfg.id === 'weapon') statSummary = `+${it.atk || 0} ATK`;
      else if (cfg.id === 'armor') statSummary = `+${it.def || 0} DEF`;
      else if (cfg.id === 'helm') statSummary = `+${it.def || 0} DEF`;
      else if (cfg.id === 'boots') statSummary = `+${it.dodge || 0}% Ddg`;
      else if (cfg.id === 'accessory') statSummary = `+${it.crit || 0}% Crt`;
      else if (cfg.id === 'pickaxe') statSummary = `${it.curDur || 0}/${maxDur} Dur`;

      const unequipBtn = (cfg.id !== 'pickaxe')
        ? `<button onclick="event.stopPropagation(); window.Aethelgard.handleInventoryUnequip('${cfg.id}')"
                   class="text-[9px] font-bold text-[#8b949e] hover:text-[#f87171] px-1 rounded bg-[#1a2232]/80 hover:bg-[#283347] transition-colors"
                   title="Unequip to Bag">✕</button>`
        : '';

      return `
        <div class="pointer-events-auto absolute p-1.5 rounded-lg bg-[#080b11]/90 backdrop-blur-sm border border-[#283347] hover:border-[#60a5fa] hover:bg-[#111722]/95 cursor-pointer flex flex-col justify-between transition-colors shadow-lg select-none group"
             style="${posStyle}"
             onclick="window.Aethelgard.openItemInspectModal('${cfg.id}', true)"
             onmouseenter="window.Aethelgard.showFloatingItemTooltip(event, '${cfg.id}', true)"
             onmouseleave="window.Aethelgard.hideFloatingItemTooltip()">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold text-[#8b949e] flex items-center gap-1">
              <span>${typeIcon}</span>
              <span class="uppercase tracking-wider">${cfg.label}</span>
            </span>
            ${unequipBtn}
          </div>
          <div class="font-bold text-[11px] truncate leading-tight" style="color:${r.color}">
            ${it.name}
          </div>
          <div class="flex items-center justify-between text-[10px] text-[#8b949e]">
            <span class="truncate">${statSummary}</span>
            <div class="flex items-center gap-0.5 shrink-0">
              <span class="text-[#60a5fa] font-mono-num font-bold">P${pwr}</span>
              ${formatSocketPipsHtml(it)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Location Badge & Pack Value
  const locEl = document.getElementById('inventoryLocationBadge');
  if (locEl) {
    if (gameState.inGuild) {
      locEl.textContent = 'Safe at Oakhaven Guild Bastion';
      locEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/40';
    } else {
      locEl.textContent = `At Risk • Floor ${gameState.dungeon.currentFloor} (Selling Disabled)`;
      locEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/40';
    }
  }

  let totalPackGold = 0;
  (h.expeditionPack || []).forEach(p => { totalPackGold += (p.val || 0) * (p.qty || 1); });
  (h.expeditionGear || []).forEach(g => { totalPackGold += (g.value || 20); });
  const packValEl = document.getElementById('inventoryPackValue');
  if (packValEl) {
    packValEl.textContent = `${totalPackGold}g Total Value`;
  }

  // Bag Gear Items List
  const bagListEl = document.getElementById('inventoryBagList');
  if (bagListEl) {
    let items = [];
    if (Array.isArray(h.expeditionGear)) {
      items = items.concat(h.expeditionGear.map(g => ({ item: g, source: 'pack' })));
    }
    if (gameState.inGuild && gameState.guildVault && Array.isArray(gameState.guildVault.armory)) {
      items = items.concat(gameState.guildVault.armory.map(g => ({ item: g, source: 'armory' })));
    }

    if (currentInventoryFilter === 'weapon') {
      items = items.filter(e => e.item.slot === 'weapon' || e.item.slot === 'pickaxe');
    } else if (currentInventoryFilter === 'armor') {
      items = items.filter(e => e.item.slot === 'armor' || e.item.slot === 'helm' || e.item.slot === 'boots');
    } else if (currentInventoryFilter === 'other') {
      items = items.filter(e => e.item.slot === 'accessory');
    }

    if (items.length === 0) {
      bagListEl.innerHTML = `<div class="text-xs text-[#8b949e] italic py-6 text-center">No gear matching filter in your pack.</div>`;
    } else {
      const assayMult = 1 + (gameState.guildResearch.assay || 0) * 0.35;
      bagListEl.innerHTML = items.map(entry => {
        const it = entry.item;
        const r = RARITY[it.rarity] || RARITY.common;
        const pwr = computeItemPowerScore(it);
        const isUp = isItemUpgrade(it, h.equipment);
        const lockIcon = it.locked ? '🔒' : '🔓';
        const lockTitle = it.locked ? 'Locked (Protected from sale)' : 'Unlocked';

        const sellBtn = (gameState.inGuild && !it.locked)
          ? `<button onclick="window.Aethelgard.sellArmoryItem('${it.uid}')" class="px-2 py-0.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-mono-num font-bold btn-tactical">Sell (${Math.round((it.value || 15) * assayMult)}g)</button>`
          : '';

        let statDetail = '';
        if (it.atk) statDetail += `+${it.atk} ATK `;
        if (it.def) statDetail += `+${it.def} DEF `;
        if (it.dodge) statDetail += `+${it.dodge}% Dodge `;
        if (it.crit) statDetail += `+${it.crit}% Crit `;

        const typeIcon = getItemTypeIcon(it);

        return `
          <div onmouseenter="window.Aethelgard.showFloatingItemTooltip(event, '${it.uid}', false)" onmouseleave="window.Aethelgard.hideFloatingItemTooltip()" class="p-2.5 rounded-lg bg-[#080b11] border ${isUp ? 'border-[#34d399]/60 bg-[#06140d]/40' : 'border-[#283347]'} hover:border-[#60a5fa] flex items-center justify-between gap-2.5 transition-colors">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-base shrink-0 select-none" title="${it.slot}">${typeIcon}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-xs truncate" style="color:${r.color}">${it.name}</span>
                  ${formatSocketPipsHtml(it)}
                  ${isUp ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40">▲ UPGRADE</span>' : ''}
                  <span class="text-[9px] font-mono-num uppercase px-1 py-0.2 rounded bg-[#111722] text-[#8b949e] border border-[#283347]">${it.slot}</span>
                </div>
                <div class="text-[11px] text-[#8b949e] truncate mt-0.5">
                  <span class="text-[#e6edf3] font-semibold">${statDetail || 'Standard frame'}</span>
                  • <span class="text-[#60a5fa]">Power ${pwr}</span>
                  ${entry.source === 'armory' ? '• <span class="text-[#fbbf24]">Vault Stored</span>' : ''}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="window.Aethelgard.toggleLockFromInventory('${it.uid}')" class="p-1 rounded bg-[#111722] hover:bg-[#1a2232] border border-[#283347] text-xs" title="${lockTitle}">${lockIcon}</button>
              <button onclick="window.Aethelgard.handleInventoryEquip('${it.uid}')" class="px-2.5 py-1 rounded bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-mono-num font-bold btn-tactical">Equip</button>
              <button onclick="window.Aethelgard.handleInventoryDrop('${it.uid}', true)" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#8b949e] hover:text-[#f87171] border border-[#283347] text-xs font-mono-num btn-tactical" title="Drop / Discard">Drop</button>
              ${sellBtn}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Pack Consumables & Minerals List
  const conListEl = document.getElementById('inventoryPackConsumablesList');
  if (conListEl) {
    const pack = h.expeditionPack || [];
    if (pack.length === 0) {
      conListEl.innerHTML = `<div class="text-xs text-[#8b949e] italic py-2 text-center">No minerals or gems in pack.</div>`;
    } else {
      conListEl.innerHTML = pack.map(item => {
        const isGem = item.type === 'Gem' && GEM_CATALOG[item.id];
        const col = isGem ? GEM_CATALOG[item.id].color : '#e6edf3';
        const typeIcon = getItemTypeIcon(item);
        const totalVal = (item.val || 0) * (item.qty || 1);
        return `
          <div class="p-2 rounded bg-[#080b11] border border-[#283347] flex items-center justify-between text-xs font-mono-num">
            <div class="flex items-center gap-2 truncate">
              <span class="text-sm shrink-0 select-none">${typeIcon}</span>
              <span class="font-bold truncate" style="color:${col}">${item.name}</span>
              <span class="text-[#8b949e] ml-1 shrink-0">x${item.qty} (${item.val}g each)</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[#fbbf24] font-bold">${totalVal}g</span>
              <button onclick="window.Aethelgard.handleInventoryDrop('${item.id}', false)" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#8b949e] hover:text-[#f87171] border border-[#283347] text-[10px]" title="Drop 1">Drop 1</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

export function showFloatingItemTooltip(event, refKey, isEquipped = false) {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('floatingItemTooltip');
  if (!tip) return;

  const h = gameState.hero;
  if (!h) return;

  let item = null;
  if (isEquipped) {
    item = h.equipment ? h.equipment[refKey] : null;
  } else {
    if (Array.isArray(h.expeditionGear)) {
      item = h.expeditionGear.find(g => g && g.uid === refKey);
    }
    if (!item && gameState.guildVault && Array.isArray(gameState.guildVault.armory)) {
      item = gameState.guildVault.armory.find(g => g && g.uid === refKey);
    }
  }

  if (!item) {
    tip.classList.add('hidden');
    return;
  }

  const r = RARITY[item.rarity] || RARITY.common;
  const curEq = (isEquipped || !item.slot) ? null : (h.equipment ? h.equipment[item.slot] : null);
  const power = computeItemPowerScore(item);
  const curPower = curEq ? computeItemPowerScore(curEq) : 0;
  const powerDiff = power - curPower;

  const statKeys = [
    { k: 'atk', label: 'Attack' },
    { k: 'def', label: 'Defense' },
    { k: 'crit', label: 'Crit %' },
    { k: 'dodge', label: 'Dodge %' },
    { k: 'str', label: 'Strength' },
    { k: 'dex', label: 'Dexterity' },
    { k: 'int', label: 'Intelligence' },
    { k: 'vit', label: 'Vitality' },
    { k: 'maxHp', label: 'Max HP' },
    { k: 'maxMp', label: 'Max MP' }
  ];

  const statLines = [];
  for (let i = 0; i < statKeys.length; i++) {
    const k = statKeys[i].k;
    const label = statKeys[i].label;
    const val = item[k] || 0;
    const oldVal = curEq ? (curEq[k] || 0) : 0;
    if (val > 0 || oldVal > 0) {
      if (!isEquipped && curEq) {
        const diff = val - oldVal;
        const diffText = diff > 0
          ? `<span class="text-[#34d399] font-bold">▲ +${diff}</span>`
          : diff < 0
            ? `<span class="text-[#f87171] font-bold">▼ ${diff}</span>`
            : `<span class="text-[#8b949e]">=</span>`;
        statLines.push(`<div class="flex justify-between gap-2"><span>${label}:</span><span>${val} (${diffText})</span></div>`);
      } else {
        statLines.push(`<div class="flex justify-between gap-2"><span>${label}:</span><span class="text-[#e6edf3] font-bold">+${val}</span></div>`);
      }
    }
  }

  const affLines = [];
  if (Array.isArray(item.affixes) && item.affixes.length > 0) {
    for (let i = 0; i < item.affixes.length; i++) {
      const a = item.affixes[i];
      affLines.push(`<div class="text-[#fbbf24] text-[10px]">★ +${a.val} ${String(a.stat).toUpperCase()} (${a.label})</div>`);
    }
  }

  const socketLines = [];
  if ((item.maxSockets || 0) > 0) {
    const sockets = Array.isArray(item.sockets) ? item.sockets : [];
    for (let i = 0; i < item.maxSockets; i++) {
      const gId = sockets[i];
      if (gId && GEM_CATALOG[gId]) {
        const gd = GEM_CATALOG[gId];
        socketLines.push(`<div class="text-[10px]" style="color:${gd.color}">◆ ${gd.name} (${gd.desc})</div>`);
      } else {
        socketLines.push(`<div class="text-[10px] text-[#64748b]">◇ Empty Socket</div>`);
      }
    }
  }

  let powerDiffBadge = '';
  if (!isEquipped && curEq) {
    if (powerDiff > 0) {
      powerDiffBadge = `<span class="px-1.5 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] font-bold text-[10px]">▲ UPGRADE (+${powerDiff} Pwr)</span>`;
    } else if (powerDiff < 0) {
      powerDiffBadge = `<span class="px-1.5 py-0.5 rounded bg-[#f87171]/20 text-[#f87171] font-bold text-[10px]">▼ ${powerDiff} Pwr</span>`;
    }
  }

  tip.innerHTML = `
    <div class="flex items-center justify-between border-b border-[#283347] pb-1 mb-1">
      <div class="flex items-center gap-2">
        <span class="text-lg shrink-0 select-none">${getItemTypeIcon(item)}</span>
        <div>
          <div class="font-bold text-xs" style="color:${r.color}">${item.name}</div>
          <div class="text-[10px] text-[#8b949e] uppercase">${r.name} • ${item.slot || 'Item'}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-[#60a5fa] font-bold text-xs">Pwr ${power}</div>
        ${powerDiffBadge}
      </div>
    </div>
    <div class="space-y-0.5 text-[11px]">${statLines.join('') || '<div class="text-[#8b949e]">Basic gear piece</div>'}</div>
    ${affLines.length > 0 ? `<div class="pt-1 border-t border-[#283347]/60 space-y-0.5">${affLines.join('')}</div>` : ''}
    ${socketLines.length > 0 ? `<div class="pt-1 border-t border-[#283347]/60 space-y-0.5">${socketLines.join('')}</div>` : ''}
  `;

  tip.classList.remove('hidden');

  const tipWidth = 260;
  const tipHeight = 180;
  let left = (event.clientX || 0) + 16;
  let top = (event.clientY || 0) + 16;

  if (typeof window !== 'undefined') {
    if (left + tipWidth > window.innerWidth - 10) {
      left = Math.max(10, (event.clientX || 0) - tipWidth - 16);
    }
    if (top + tipHeight > window.innerHeight - 10) {
      top = Math.max(10, window.innerHeight - tipHeight - 10);
    }
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

export function hideFloatingItemTooltip() {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('floatingItemTooltip');
  if (tip) tip.classList.add('hidden');
}
