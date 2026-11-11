// DOM Synchronization, Guild Hub Views (including Notice Board & Lapidary), Dungeon HUD & Chronicle Log

import {
  RARITY,
  LAPIDARY_UNSOCKET_COST,
  CODEX_MASTERY_KILLS,
  CODEX_MASTERY_DMG_MULT
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG, MINERAL_DISPLAY } from '../data/ores.js';
import { GEM_IDS, GEM_CATALOG, GEM_DISPLAY } from '../data/gems.js';
import { TALENT_TREES } from '../data/talents.js';
import { RESEARCH_PROJECTS } from '../data/research.js';
import { SHOP_ITEMS, computeItemPowerScore, isItemUpgrade, getItemTypeIcon } from '../data/items.js';
import { MONSTER_ARCHETYPES, BOSS_ARCHETYPES } from '../data/monsters.js';
import { BIOME_PALETTES, resolveFloorBiome, CURATED_DUNGEON_PROFILES } from '../data/dungeons.js';
import {
  gameState,
  normalizeEquipmentSockets,
  ensureDungeonFloorHydrated,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability,
  ensureCodexState,
  getCodexMasteryMultiplier
} from '../engine/state.js';
import { ensureGuildBounties } from '../engine/actions.js';
import { drawHeroSprite, renderMinimapCanvas } from './renderer.js';
import { OVERWORLD_TERRAIN, OVERWORLD_POIS } from '../data/overworld.js';
import { getActiveOverworldParty, evaluateGuidedTasks, ensureOverworldHydrated } from '../engine/overworld.js';
import { renderOverworldCanvas } from './overworldRenderer.js';

export function formatSocketPipsHtml(item) {
  if (!item || !item.maxSockets || item.maxSockets <= 0) return '';
  const sockets = Array.isArray(item.sockets) ? item.sockets : [];
  const pips = [];
  for (let i = 0; i < item.maxSockets; i++) {
    const gId = sockets[i];
    if (gId && GEM_CATALOG[gId]) {
      pips.push(`<span style="color:${GEM_CATALOG[gId].color}" title="${GEM_CATALOG[gId].name}">◆</span>`);
    } else {
      pips.push(`<span class="text-[#64748b]" title="Empty Socket">◇</span>`);
    }
  }
  return `<span class="ml-1 tracking-tighter">${pips.join('')}</span>`;
}

export function renderGuildHub() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  ensureGuildBounties(false, gameState);
  const vaultGems = gameState.guildVault.gems || { ruby: 0, emerald: 0, sapphire: 0, topaz: 0, void_diamond: 0 };

  const totalBankedGems = GEM_IDS.reduce((sum, gId) => sum + (vaultGems[gId] || 0), 0);
  const readyBounties = (gameState.guildBounties || []).filter(b => b && b.completed).length;

  const dng = gameState.dungeon;
  const cfg = dng.config || {};
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;

  const activeNameEl = document.getElementById('uiActiveDungeonName');
  if (activeNameEl) activeNameEl.textContent = dng.name;
  const mapSizeEl = document.getElementById('uiGuildMapSize');
  if (mapSizeEl) mapSizeEl.textContent = `${cfg.width || 80}x${cfg.height || 60}`;

  document.getElementById('uiGuildSeed').textContent = dng.seedCode;
  document.getElementById('uiChartedFloors').textContent = cfg.maxDepth >= 999
    ? `${Object.keys(dng.floors || {}).length}`
    : `${Object.keys(dng.floors || {}).length} / ${cfg.maxDepth}`;
  document.getElementById('uiDepthPermit').textContent = cfg.respectsCartographyPermit !== false
    ? `Permit Fl ${permit}`
    : `Max Fl ${cfg.maxDepth}`;
  document.getElementById('uiForgeMaxDur').textContent = getPickaxeMaxDurability();
  document.getElementById('uiTavernGold').textContent = gameState.guildVault.gold;
  document.getElementById('uiArmoryCountBadge').textContent = gameState.guildVault.armory.length;
  document.getElementById('uiTalentCountBadge').textContent = h.talentPoints || 0;

  const gemBadgeEl = document.getElementById('uiGemCountBadge');
  if (gemBadgeEl) gemBadgeEl.textContent = totalBankedGems;
  const btyBadgeEl = document.getElementById('uiBountyReadyBadge');
  if (btyBadgeEl) btyBadgeEl.textContent = readyBounties;

  // Mineral Vault Grid
  const minGrid = document.getElementById('uiVaultMineralsGrid');
  minGrid.innerHTML = MINERAL_DISPLAY.map(m => `
    <div class="bg-[#111722] p-2 rounded border border-[#283347]">
      <div class="text-[9px] text-[#8b949e] uppercase">${m.name}</div>
      <div class="font-bold text-sm mt-0.5" style="color:${m.color}">${gameState.guildVault[m.id] || 0}</div>
    </div>
  `).join('');

  // Astral Gem Vault Grid (Tavern + Lapidary Header)
  const gemCardsHtml = GEM_DISPLAY.map(g => {
    const gd = GEM_CATALOG[g.id];
    return `
      <div class="bg-[#111722] p-2 rounded border border-[#283347]" title="${gd ? gd.desc : ''}">
        <div class="text-[9px] text-[#8b949e] uppercase truncate">${g.name}</div>
        <div class="font-bold text-sm mt-0.5" style="color:${g.color}">${vaultGems[g.id] || 0}</div>
      </div>
    `;
  }).join('');

  const vaultGemsEl = document.getElementById('uiVaultGemsGrid');
  if (vaultGemsEl) vaultGemsEl.innerHTML = gemCardsHtml;
  const lapGemsEl = document.getElementById('uiLapidaryGemsBar');
  if (lapGemsEl) lapGemsEl.innerHTML = gemCardsHtml;

  // Guild Notice Board Tab (#uiBountiesGrid)
  const btyGrid = document.getElementById('uiBountiesGrid');
  if (btyGrid) {
    btyGrid.innerHTML = (gameState.guildBounties || []).map(b => {
      const pct = Math.min(100, Math.round(((b.curQty || 0) / Math.max(1, b.reqQty)) * 100));
      return `
        <div class="p-3 rounded-lg bg-[#080b11] border ${b.completed ? 'border-[#34d399]/60' : 'border-[#283347]'} flex flex-col justify-between gap-2.5">
          <div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold ${b.completed ? 'text-[#34d399]' : 'text-[#fbbf24]'}">${b.title}</span>
              <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#e6edf3]">${b.curQty || 0}/${b.reqQty}</span>
            </div>
            <p class="text-[11px] text-[#8b949e] mt-1">${b.desc}</p>
            <div class="w-full h-1.5 bg-[#111722] rounded-full overflow-hidden border border-[#283347] mt-2">
              <div class="h-full ${b.completed ? 'bg-[#34d399]' : 'bg-[#fbbf24]'}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="text-[11px] font-mono-num text-[#60a5fa]">Reward: <strong>${b.rewardLabel}</strong></div>
            ${b.completed
              ? `<button onclick="window.Aethelgard.claimBountyAtGuild('${b.id}')" class="w-full py-1.5 rounded bg-[#34d399] hover:bg-[#10b981] text-[#080b11] text-xs font-mono-num font-bold btn-tactical">✓ Claim Reward</button>`
              : `<div class="w-full py-1 rounded bg-[#111722] text-center text-[10px] font-mono-num text-[#8b949e] border border-[#283347]">Active on Descent</div>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // Astral Lapidary Bench Tab (#uiLapidaryItemsGrid)
  const lapGrid = document.getElementById('uiLapidaryItemsGrid');
  if (lapGrid) {
    const socketableEntries = [];
    ['weapon', 'armor', 'helm', 'boots', 'accessory'].forEach(slot => {
      const eq = h.equipment[slot];
      if (eq) {
        normalizeEquipmentSockets(eq);
        if ((eq.maxSockets || 0) > 0) {
          socketableEntries.push({ item: eq, refKey: slot, isEquipped: true, locLabel: `Equipped • ${slot.toUpperCase()}` });
        }
      }
    });
    gameState.guildVault.armory.forEach(arm => {
      normalizeEquipmentSockets(arm);
      if ((arm.maxSockets || 0) > 0) {
        socketableEntries.push({ item: arm, refKey: arm.uid, isEquipped: false, locLabel: `Vault Armory • ${arm.slot.toUpperCase()}` });
      }
    });

    if (socketableEntries.length === 0) {
      lapGrid.innerHTML = `
        <div class="p-4 rounded bg-[#080b11] border border-[#283347] text-xs text-[#8b949e] italic text-center">
          No socketed equipment owned yet. Rare, Epic, and Star-Forged Relic gear (from Gilded Chests, Elites, Bosses, or Quartermaster Rank 1+) roll 1 to 2 Astral Sockets!
        </div>
      `;
    } else {
      const availGemIds = GEM_IDS.filter(k => (vaultGems[k] || 0) > 0);
      lapGrid.innerHTML = socketableEntries.map(entry => {
        const it = entry.item;
        const r = RARITY[it.rarity] || RARITY.common;
        const socketRows = [];
        for (let sIdx = 0; sIdx < it.maxSockets; sIdx++) {
          const gId = it.sockets[sIdx];
          if (gId && GEM_CATALOG[gId]) {
            const gd = GEM_CATALOG[gId];
            socketRows.push(`
              <div class="flex items-center justify-between bg-[#111722] px-2.5 py-1.5 rounded border border-[#283347] text-xs font-mono-num">
                <span style="color:${gd.color}">◆ ${gd.name} <span class="text-[#8b949e] text-[10px]">(${gd.desc})</span></span>
                <button onclick="window.Aethelgard.unsocketGemFromItem('${entry.refKey}', ${sIdx}, ${entry.isEquipped})" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#fbbf24]/40 text-[10px] font-bold btn-tactical">
                  Extract (${LAPIDARY_UNSOCKET_COST}g)
                </button>
              </div>
            `);
          } else {
            const btns = availGemIds.length > 0
              ? availGemIds.map(k => {
                  const gd = GEM_CATALOG[k];
                  return `<button onclick="window.Aethelgard.socketGemIntoItem('${entry.refKey}', '${k}', ${entry.isEquipped})" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#283347] text-[10px] font-bold btn-tactical" style="color:${gd.color}" title="${gd.desc}">+ Socket ${gd.shortName}</button>`;
                }).join(' ')
              : `<span class="text-[10px] text-[#8b949e]">Mine high-tier veins for uncut gems</span>`;
            socketRows.push(`
              <div class="flex flex-wrap items-center justify-between gap-1.5 bg-[#111722] px-2.5 py-1.5 rounded border border-[#283347] text-xs font-mono-num">
                <span class="text-[#8b949e]">◇ Empty Socket #${sIdx + 1}</span>
                <div class="flex flex-wrap gap-1">${btns}</div>
              </div>
            `);
          }
        }

        return `
          <div class="p-3 rounded-lg bg-[#080b11] border border-[#283347] space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold" style="color:${r.color}">${it.name}</span>
                <span class="text-[10px] font-mono-num text-[#8b949e] ml-1.5">[${entry.locLabel}]</span>
              </div>
              <span class="text-[10px] font-mono-num text-[#60a5fa]">${it.sockets.length}/${it.maxSockets} Sockets</span>
            </div>
            <div class="space-y-1.5">${socketRows.join('')}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Quartermaster Buy Catalog
  const qmRank = gameState.guildResearch.quartermaster || 0;
  document.getElementById('uiShopTierLabel').textContent = `Requisition Rank ${qmRank}`;
  const shopEl = document.getElementById('shop-catalog');
  shopEl.innerHTML = SHOP_ITEMS.map(s => {
    const unlocked = qmRank >= s.reqQM;
    const canBuy = unlocked && gameState.guildVault.gold >= s.cost;
    const rColor = s.rarity ? RARITY[s.rarity].color : '#e6edf3';
    const typeIcon = getItemTypeIcon(s);
    return `
      <div class="p-2.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 ${!unlocked ? 'opacity-50' : ''}">
        <div class="flex items-center gap-2">
          <span class="text-base shrink-0 select-none">${typeIcon}</span>
          <div>
            <div class="text-xs font-bold" style="color:${rColor}">${s.name}</div>
            <div class="text-[11px] text-[#8b949e]">${s.desc}</div>
          </div>
        </div>
        <button onclick="window.Aethelgard.buyShopItem('${s.id}')" ${!canBuy ? 'disabled' : ''} class="px-3 py-1.5 rounded text-xs font-mono-num font-bold whitespace-nowrap btn-tactical ${canBuy ? 'bg-[#fbbf24] text-[#080b11] hover:bg-[#f59e0b]' : 'bg-[#1a2232] text-[#8b949e] cursor-not-allowed'}">
          ${!unlocked ? `Req QM ${s.reqQM}` : `Buy (${s.cost}g)`}
        </button>
      </div>
    `;
  }).join('');

  // Antiquarian Assay Sell Counter (#sell-catalog)
  const assayRank = gameState.guildResearch.assay || 0;
  const mult = 1 + assayRank * 0.35;
  document.getElementById('uiAssayBonusLabel').textContent = `Appraisal Multiplier: ${Math.round(mult * 100)}% (Rank ${assayRank})`;

  const sellEl = document.getElementById('sell-catalog');
  const sellRows = [];
  MINERAL_DISPLAY.forEach(m => {
    const cnt = gameState.guildVault[m.id] || 0;
    if (cnt > 0) {
      const oreDef = Object.values(ORE_CATALOG).find(o => o.id === m.id);
      const unitVal = Math.round((oreDef ? oreDef.baseValue : 10) * mult);
      sellRows.push(`
        <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
          <div>
            <span class="font-bold" style="color:${m.color}">${m.name}</span>
            <span class="text-[#8b949e]"> x${cnt} (${unitVal}g each)</span>
          </div>
          <div class="flex gap-1">
            <button onclick="window.Aethelgard.sellMineralUnit('${m.id}', false)" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#283347]">Sell 1</button>
            <button onclick="window.Aethelgard.sellMineralUnit('${m.id}', true)" class="px-2 py-0.5 rounded bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/40">All (+${unitVal * cnt}g)</button>
          </div>
        </div>
      `);
    }
  });

  GEM_DISPLAY.forEach(g => {
    const cnt = vaultGems[g.id] || 0;
    if (cnt > 0) {
      const gDef = GEM_CATALOG[g.id];
      const unitVal = Math.round((gDef ? gDef.baseValue : 65) * mult);
      sellRows.push(`
        <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
          <div>
            <span class="font-bold" style="color:${g.color}">◆ ${g.name}</span>
            <span class="text-[#8b949e]"> x${cnt} (${unitVal}g each)</span>
          </div>
          <div class="flex gap-1">
            <button onclick="window.Aethelgard.sellGemUnit('${g.id}', false)" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fbbf24] border border-[#283347]">Sell 1</button>
            <button onclick="window.Aethelgard.sellGemUnit('${g.id}', true)" class="px-2 py-0.5 rounded bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/40">All (+${unitVal * cnt}g)</button>
          </div>
        </div>
      `);
    }
  });

  gameState.guildVault.armory.forEach(g => {
    const r = RARITY[g.rarity] || RARITY.common;
    const salePrice = Math.round((g.value || 15) * mult);
    const isLocked = Boolean(g.locked);
    const sellBtnHtml = isLocked
      ? `<span class="px-2 py-0.5 rounded bg-[#1a2232] text-[#fbbf24] text-[10px] border border-[#fbbf24]/30">🔒 Locked</span>`
      : `<button onclick="window.Aethelgard.sellArmoryItem('${g.uid}')" class="px-2.5 py-0.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">Sell (+${salePrice}g)</button>`;

    sellRows.push(`
      <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="cursor-pointer hover:underline">
          <span class="font-bold" style="color:${r.color}">${g.name}</span>${formatSocketPipsHtml(g)}
          <span class="text-[10px] text-[#8b949e] uppercase ml-1">[${g.slot}]</span>
        </div>
        ${sellBtnHtml}
      </div>
    `);
  });

  sellEl.innerHTML = sellRows.length > 0
    ? sellRows.join('')
    : `<div class="text-[#8b949e] italic py-4 text-center">No banked minerals, gems, or spare equipment to appraise. Mine veins & extract from the dungeon!</div>`;

  // Vault Armory Tab
  const sortBy = (gameState.uiSettings && gameState.uiSettings.armorySortBy) || 'slot';
  ['slot', 'rarity', 'power', 'value', 'name'].forEach(k => {
    const btn = document.getElementById(`btnSort_${k}`);
    if (btn) {
      if (k === sortBy) {
        btn.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-[#1a2232] text-[#fbbf24] border border-[#fbbf24]/50';
      } else {
        btn.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-[#111722] text-[#8b949e] border border-[#283347] hover:text-[#e6edf3]';
      }
    }
  });

  const slotWeights = { weapon: 1, armor: 2, helm: 3, boots: 4, accessory: 5, pickaxe: 6 };
  const rarityWeights = { relic: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

  const rawArmory = gameState.guildVault.armory || [];
  const displayArmory = rawArmory.slice();

  displayArmory.sort((a, b) => {
    if (sortBy === 'slot') {
      const swA = slotWeights[a.slot] || 99;
      const swB = slotWeights[b.slot] || 99;
      if (swA !== swB) return swA - swB;
      return computeItemPowerScore(b) - computeItemPowerScore(a);
    } else if (sortBy === 'rarity') {
      const rwA = rarityWeights[a.rarity] || 0;
      const rwB = rarityWeights[b.rarity] || 0;
      if (rwA !== rwB) return rwB - rwA;
      return (b.value || 0) - (a.value || 0);
    } else if (sortBy === 'power') {
      return computeItemPowerScore(b) - computeItemPowerScore(a);
    } else if (sortBy === 'value') {
      return (b.value || 0) - (a.value || 0);
    } else if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  let upgradeCount = 0;
  rawArmory.forEach(g => {
    if (isItemUpgrade(g, h.equipment)) upgradeCount++;
  });

  const upgradeBadgeEl = document.getElementById('uiArmoryUpgradeCountBadge');
  if (upgradeBadgeEl) {
    if (upgradeCount > 0) {
      upgradeBadgeEl.textContent = `▲ ${upgradeCount} Upgrade${upgradeCount > 1 ? 's' : ''}`;
      upgradeBadgeEl.classList.remove('hidden');
    } else {
      upgradeBadgeEl.classList.add('hidden');
    }
  }

  const armoryGrid = document.getElementById('uiArmoryGrid');
  if (displayArmory.length === 0) {
    armoryGrid.innerHTML = `<div class="col-span-2 text-xs text-[#8b949e] italic py-4 text-center">Your Vault Armory is empty. Defeat monsters, open chests, or buy gear from the Quartermaster.</div>`;
  } else {
    armoryGrid.innerHTML = displayArmory.map(g => {
      const r = RARITY[g.rarity] || RARITY.common;
      const isUpgrade = isItemUpgrade(g, h.equipment);
      const pwr = computeItemPowerScore(g);
      const isLocked = Boolean(g.locked);
      const borderClass = isUpgrade
        ? 'border-[#34d399]/60 bg-[#07130f]'
        : (isLocked ? 'border-[#fbbf24]/40 bg-[#080b11]' : 'border-[#283347] bg-[#080b11]');

      const upgradeBadgeHtml = isUpgrade
        ? `<span class="px-1.5 py-0.2 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40 text-[9px] font-bold">▲ UPGRADE</span>`
        : '';

      const lockBtnHtml = `
        <button onclick="event.stopPropagation(); window.Aethelgard.toggleItemLock('${g.uid}')" class="px-1 py-0.5 rounded text-[11px] ${isLocked ? 'text-[#fbbf24]' : 'text-[#64748b] hover:text-[#e6edf3]'}" title="${isLocked ? 'Locked (Protected from sale)' : 'Unlocked (Click to Lock)'}">
          ${isLocked ? '🔒' : '🔓'}
        </button>
      `;

      const typeIcon = getItemTypeIcon(g);

      return `
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="p-2.5 rounded ${borderClass} hover:border-[#60a5fa] cursor-pointer flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 truncate flex-1 min-w-0">
            <span class="text-base shrink-0 select-none">${typeIcon}</span>
            <div class="truncate flex-1 min-w-0">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-xs font-bold truncate" style="color:${r.color}">${g.name}${formatSocketPipsHtml(g)}</span>
                ${upgradeBadgeHtml}
              </div>
              <div class="text-[10px] text-[#8b949e] uppercase mt-0.5">
                <span>${r.name} • ${g.slot}</span>
                <span class="text-[#60a5fa] font-mono-num ml-1">PWR ${pwr}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-xs font-mono-num text-[#fbbf24]">${g.value}g</span>
            ${lockBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Training Hall Talents Tab
  document.getElementById('uiTalentClassTitle').textContent = CLASSES[h.classId].name;
  document.getElementById('uiTalentPointsText').textContent = h.talentPoints || 0;
  const talents = TALENT_TREES[h.classId] || [];
  document.getElementById('uiTalentsGrid').innerHTML = talents.map(t => {
    const cur = h.talentsAllocated[t.id] || 0;
    const isMax = cur >= t.max;
    const canSpend = (h.talentPoints || 0) > 0 && !isMax;
    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isMax ? 'border-[#34d399]/50' : 'border-[#283347]'} flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#60a5fa]">${t.name}</span>
            <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#fbbf24]">${cur} / ${t.max}</span>
          </div>
          <p class="text-[11px] text-[#8b949e] mt-1.5">${t.desc}</p>
        </div>
        <button onclick="window.Aethelgard.allocateTalent('${t.id}')" ${!canSpend ? 'disabled' : ''} class="w-full py-1.5 rounded text-xs font-mono-num font-bold btn-tactical ${isMax ? 'bg-[#111722] text-[#34d399]' : canSpend ? 'bg-[#2563eb] hover:bg-[#3b82f6] text-white' : 'bg-[#1a2232] text-[#8b949e] opacity-50 cursor-not-allowed'}">
          ${isMax ? '★ Mastered' : 'Train Rank'}
        </button>
      </div>
    `;
  }).join('');

  // Research Lab Tab
  const resGrid = document.getElementById('uiResearchGrid');
  resGrid.innerHTML = Object.values(RESEARCH_PROJECTS).map(proj => {
    const curRank = gameState.guildResearch[proj.id] || 0;
    const isMax = curRank >= proj.levels.length - 1;
    const nxt = proj.levels[curRank + 1];

    let costPills = '';
    let canAfford = !isMax;
    if (!isMax && nxt) {
      const hasGold = gameState.guildVault.gold >= nxt.costGold;
      if (!hasGold) canAfford = false;
      costPills += `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num ${hasGold ? 'bg-[#fbbf24]/15 text-[#fbbf24]' : 'bg-[#f87171]/15 text-[#f87171]'}">${nxt.costGold}g</span>`;
      for (const [oreId, qty] of Object.entries(nxt.costOre)) {
        const have = gameState.guildVault[oreId] || 0;
        const ok = have >= qty;
        if (!ok) canAfford = false;
        costPills += `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num ${ok ? 'bg-[#34d399]/15 text-[#34d399]' : 'bg-[#f87171]/15 text-[#f87171]'}">${qty} ${oreId} (${have})</span>`;
      }
    }

    return `
      <div class="p-3 rounded-lg bg-[#080b11] border ${isMax ? 'border-[#34d399]/50' : 'border-[#283347]'} flex flex-col justify-between gap-2.5">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#e6edf3]">${proj.name}</span>
            <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#1a2232] text-[#60a5fa]">Rank ${curRank}/${proj.levels.length - 1}</span>
          </div>
          <p class="text-[11px] text-[#8b949e] mt-1">${proj.desc}</p>
          <div class="text-[11px] font-mono-num text-[#34d399] mt-1">Current: ${proj.levels[curRank].desc}</div>
        </div>
        <div>
          <div class="flex flex-wrap gap-1 mb-2">${costPills}</div>
          <button onclick="window.Aethelgard.purchaseResearchRank('${proj.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-1.5 rounded text-xs font-mono-num font-bold btn-tactical ${isMax ? 'bg-[#111722] text-[#34d399]' : canAfford ? 'bg-[#fbbf24] text-[#080b11] hover:bg-[#f59e0b]' : 'bg-[#1a2232] text-[#8b949e] opacity-50 cursor-not-allowed'}">
            ${isMax ? '★ Completed' : `Research Rank ${curRank + 1}`}
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderCodexTab();
}

export function renderCodexTab() {
  if (typeof document === 'undefined') return;
  const codex = ensureCodexState(gameState);

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('uiCodexMonstersSlain', codex.totalMonstersSlain || 0);
  setTxt('uiCodexBossesSlain', codex.totalBossesSlain || 0);
  setTxt('uiCodexOresMined', codex.totalOresMined || 0);
  setTxt('uiCodexGemsUnearthed', codex.totalGemsUnearthed || 0);
  setTxt('uiCodexExtractions', codex.totalExtractions || 0);

  const allMonsters = Object.values(MONSTER_ARCHETYPES).concat(Object.values(BOSS_ARCHETYPES));
  let masteredCount = 0;

  for (let i = 0; i < allMonsters.length; i++) {
    const m = allMonsters[i];
    const kills = (codex.killsByArchetype && codex.killsByArchetype[m.id]) || 0;
    const req = m.isBoss ? 1 : CODEX_MASTERY_KILLS;
    if (kills >= req) {
      masteredCount++;
    }
  }

  setTxt('uiCodexMasteredCount', masteredCount);
  setTxt('uiCodexMasteryBadge', masteredCount);

  // Deepest Floor Grid
  const deepestGrid = document.getElementById('uiCodexDeepestGrid');
  if (deepestGrid) {
    const depths = codex.deepestFloorByDungeon || {};
    const dngKeys = Object.keys(depths);
    if (dngKeys.length === 0) {
      deepestGrid.innerHTML = '<div class="col-span-full text-xs text-[#8b949e] italic py-2 text-center">No expeditions recorded yet. Descend the stairs to chart records!</div>';
    } else {
      deepestGrid.innerHTML = dngKeys.map(dKey => {
        const val = depths[dKey];
        const maxF = typeof val === 'object' && val ? (val.deepestFloor || 1) : (Number(val) || 0);
        const dProf = CURATED_DUNGEON_PROFILES[dKey];
        const dName = (val && val.name) || (dProf && dProf.name) || dKey;
        return `
          <div class="bg-[#111722] p-2.5 rounded border border-[#283347] flex items-center justify-between">
            <span class="text-xs text-[#e6edf3] font-bold truncate">${dName}</span>
            <span class="text-xs font-mono-num text-[#34d399] font-bold ml-2">Fl ${maxF}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Star-Forged Relics Grid
  const relicsGrid = document.getElementById('uiCodexRelicsGrid');
  if (relicsGrid) {
    const relics = Array.isArray(codex.relicsUnlocked) ? codex.relicsUnlocked : [];
    if (relics.length === 0) {
      relicsGrid.innerHTML = '<div class="col-span-full text-xs text-[#8b949e] italic py-2 text-center">No relics unearthed yet. Challenge deep Vault bosses (Floors 10, 15, 20) or rare chests!</div>';
    } else {
      relicsGrid.innerHTML = relics.map(r => {
        const rar = RARITY[r.rarity] || RARITY.relic;
        return `
          <div class="bg-[#111722] p-2.5 rounded border border-[#fbbf24]/40 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold" style="color:${rar.color}">★ ${r.name}</div>
              <div class="text-[10px] text-[#8b949e] uppercase">${r.slot} • Fl ${r.floorDepth || 1}</div>
            </div>
            <span class="text-[10px] font-mono-num text-[#fbbf24] px-1.5 py-0.5 rounded bg-[#080b11]">Relic</span>
          </div>
        `;
      }).join('');
    }
  }

  // Bestiary & Hunter Mastery Grid
  const bestiaryGrid = document.getElementById('uiBestiaryGrid');
  if (bestiaryGrid) {
    bestiaryGrid.innerHTML = allMonsters.map(m => {
      const kills = (codex.killsByArchetype && codex.killsByArchetype[m.id]) || 0;
      const req = m.isBoss ? 1 : CODEX_MASTERY_KILLS;
      const isMastered = kills >= req;
      const borderCol = isMastered ? 'border-[#fbbf24]/50' : 'border-[#283347]';
      const bgCol = isMastered ? 'bg-[#181308]' : 'bg-[#111722]';
      const sym = m.isBoss ? '👑' : (m.isRanged ? '🏹' : '⚔️');
      const badgeText = m.isBoss ? 'BOSS' : (m.bountyTag ? m.bountyTag.toUpperCase() : 'FOE');
      const statLine = m.isBoss ? `HP: ${m.hp} | ATK: ${m.atk} | DEF: ${m.def}` : (m.desc || '');
      const statRight = m.isBoss ? `+${m.xp} XP` : (m.family ? m.family.replace('_', ' ').toUpperCase() : '');

      return `
        <div class="${bgCol} p-2.5 rounded border ${borderCol} flex flex-col justify-between gap-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-sm font-bold font-mono" style="color:${m.color}">${sym}</span>
              <span class="text-xs font-bold truncate ${m.isBoss ? 'text-[#f87171]' : 'text-[#e6edf3]'}">${m.name}</span>
            </div>
            <span class="text-[10px] font-mono-num px-1 rounded bg-[#080b11] ${m.isBoss ? 'text-[#f87171]' : 'text-[#8b949e]'}">
              ${badgeText}
            </span>
          </div>
          <div class="text-[10px] font-mono-num text-[#8b949e] flex justify-between gap-1">
            <span class="truncate">${statLine}</span>
            <span class="shrink-0 text-[#60a5fa]">${statRight}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-[#283347]/50 text-[11px] font-mono-num">
            <span class="text-[#8b949e]">Kills: <strong class="${kills > 0 ? 'text-[#e6edf3]' : 'text-[#8b949e]'}">${kills}</strong>/${req}</span>
            ${isMastered
              ? '<span class="text-[#fbbf24] font-bold">★ +8% DMG</span>'
              : `<span class="text-[#64748b]">${req - kills} more</span>`
            }
          </div>
        </div>
      `;
    }).join('');
  }
}

export function renderDungeonHud() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  const cls = CLASSES[h.classId];
  const dng = gameState.dungeon;
  const cfg = dng.config || {};
  const depth = dng.currentFloor;
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  const capLabel = cfg.respectsCartographyPermit !== false ? permit : cfg.maxDepth;
  const floor = ensureDungeonFloorHydrated(dng, depth);
  const fw = floor ? floor.width : (cfg.width || 80);
  const fh = floor ? floor.height : (cfg.height || 60);

  document.getElementById('uiFloorBadge').textContent = `FLOOR ${depth} / ${capLabel >= 999 ? '∞' : capLabel}`;
  const biomeId = resolveFloorBiome(cfg, depth);
  const biome = BIOME_PALETTES[biomeId] || BIOME_PALETTES.dwarven_catacombs;
  const biomeBadge = document.getElementById('uiFloorBiomeBadge');
  if (biomeBadge && biome) {
    biomeBadge.textContent = biome.name;
    biomeBadge.style.color = biome.badgeColor || '#38bdf8';
    biomeBadge.style.borderColor = (biome.badgeColor || '#38bdf8') + '55';
  }
  const zoneLabelEl = document.getElementById('uiZoneDangerLabel');
  if (zoneLabelEl) {
    zoneLabelEl.textContent = `${dng.name} • ${fw}x${fh}`;
  }
  const coordEl = document.getElementById('uiCoordBadge');
  if (coordEl) {
    coordEl.textContent = `(${h.x}, ${h.y})`;
  }
  document.getElementById('uiHostilesCount').textContent = floor ? floor.monsters.length : 0;
  document.getElementById('uiVisionRadiusText').textContent = h.visionRadius || 5;

  document.getElementById('btnSkillLabel').textContent = cls.skillName;
  document.getElementById('btnSkillMpCost').textContent = `${cls.skillCost} MP`;
  document.getElementById('btnPotionCount').textContent = h.consumables.potions;
  document.getElementById('btnRecallCount').textContent = h.consumables.recalls;

  // Boss HUD Check
  const boss = floor ? floor.monsters.find(m => m.isBoss) : null;
  const bossBar = document.getElementById('bossHudBar');
  if (boss) {
    bossBar.classList.remove('hidden');
    document.getElementById('uiBossName').textContent = boss.name.toUpperCase();
    document.getElementById('uiBossHpText').textContent = `${boss.hp} / ${boss.maxHp} HP`;
    document.getElementById('uiBossHpFill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
  } else {
    bossBar.classList.add('hidden');
  }
}

export function updateAllUI() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  if (!h) return;
  recomputeHeroDerivedStats(false, gameState);
  ensureGuildBounties(false, gameState);
  const cls = CLASSES[h.classId];

  // Header
  document.getElementById('headerSeedText').textContent = gameState.dungeon.seedCode;
  document.getElementById('headerTurnText').textContent = gameState.turn;
  document.getElementById('headerLocationText').textContent = gameState.inGuild
    ? 'Oakhaven Guild Bastion'
    : `${gameState.dungeon.name} • Floor ${gameState.dungeon.currentFloor}`;
  document.getElementById('headerLocationDot').className = gameState.inGuild
    ? 'w-2.5 h-2.5 rounded-full bg-[#34d399]'
    : 'w-2.5 h-2.5 rounded-full bg-[#f87171] animate-pulse';

  const mmScaleEl = document.getElementById('uiMinimapScaleLabel');
  if (mmScaleEl) {
    const dCfg = gameState.dungeon && gameState.dungeon.config ? gameState.dungeon.config : { width: 80, height: 60 };
    mmScaleEl.textContent = gameState.inGuild
      ? `${dCfg.width}x${dCfg.height} Chart`
      : `Fl ${gameState.dungeon.currentFloor} • ${dCfg.width}x${dCfg.height}`;
  }

  // Portrait
  const pCanvas = document.getElementById('heroPortraitCanvas');
  if (pCanvas) {
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 42, 42);
    drawHeroSprite(pCtx, 3, 3, h.classId, 36);
  }

  // Hero Sheet
  document.getElementById('uiHeroName').textContent = h.name;
  document.getElementById('uiHeroTitleBadge').textContent = cls.title;
  document.getElementById('uiHeroLevel').textContent = h.level;
  document.getElementById('uiHeroXp').textContent = `${h.xp} / ${h.maxXp}`;

  document.getElementById('uiHpText').textContent = `${h.hp} / ${h.maxHp}`;
  document.getElementById('uiHpBar').style.width = `${Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100))}%`;
  document.getElementById('uiMpText').textContent = `${h.mp} / ${h.maxMp}`;
  document.getElementById('uiMpBar').style.width = `${Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100))}%`;

  const pick = h.equipment.pickaxe;
  const maxDur = getPickaxeMaxDurability();
  const curDur = pick ? pick.curDur : 0;
  document.getElementById('uiPickaxeLabel').textContent = pick ? pick.name : 'No Pickaxe';
  document.getElementById('uiPickaxeText').textContent = `${curDur} / ${maxDur}`;
  document.getElementById('uiPickaxeBar').style.width = `${Math.max(0, Math.min(100, (curDur / maxDur) * 100))}%`;

  // Statuses & Shrine Blessings
  const stRow = document.getElementById('uiStatusEffectsRow');
  if (h.statuses && h.statuses.length > 0) {
    stRow.innerHTML = h.statuses.map(s => `
      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold" style="background:${s.color}25; color:${s.color}; border:1px solid ${s.color}50">
        ${s.isBuff ? '✨ ' : s.id === 'chilled' ? '❄ ' : ''}${s.name} (${s.duration})
      </span>
    `).join('');
  } else {
    stRow.innerHTML = `<span class="text-[10px] text-[#8b949e] italic">No active status effects</span>`;
  }

  // Stats
  document.getElementById('uiStatStr').textContent = h.computedStr;
  document.getElementById('uiStatDex').textContent = h.computedDex;
  document.getElementById('uiStatInt').textContent = h.computedInt;
  document.getElementById('uiStatVit').textContent = h.computedVit;
  document.getElementById('uiStatAtk').textContent = h.atk;
  document.getElementById('uiStatDef').textContent = h.def;
  document.getElementById('uiStatCrit').textContent = `${h.crit}%`;
  document.getElementById('uiStatDodge').textContent = `${h.dodge}%`;

  const spBox = document.getElementById('uiStatPointsBox');
  if ((h.statPoints || 0) > 0) {
    spBox.classList.remove('hidden');
    document.getElementById('uiStatPointsCount').textContent = h.statPoints;
  } else {
    spBox.classList.add('hidden');
  }

  // Paper Doll 6 Slots (with Gem Socket pips & Upfront Icons)
  const dollGrid = document.getElementById('uiPaperDollGrid');
  dollGrid.innerHTML = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'].map(slot => {
    const it = h.equipment[slot];
    const r = it ? (RARITY[it.rarity] || RARITY.common) : RARITY.common;
    const typeIcon = getItemTypeIcon(it || slot);
    let sub = '—';
    if (it) {
      if (slot === 'weapon') sub = `+${it.atk} ATK`;
      else if (slot === 'armor') sub = `+${it.def} DEF`;
      else if (slot === 'helm') sub = `+${it.def || 0} DEF`;
      else if (slot === 'boots') sub = `+${it.dodge || 0}% Dodge`;
      else if (slot === 'accessory') sub = `+${it.crit || 0}% Crit`;
      else if (slot === 'pickaxe') sub = `${it.curDur}/${maxDur} Dur`;
    }
    return `
      <div onclick="window.Aethelgard.openItemInspectModal('${slot}', true)" class="p-2 rounded bg-[#080b11] border border-[#283347] hover:border-[#60a5fa] cursor-pointer">
        <div class="flex items-center justify-between text-[9px] text-[#8b949e] uppercase">
          <span class="flex items-center gap-1"><span>${typeIcon}</span><span>${slot}</span></span>
          ${formatSocketPipsHtml(it)}
        </div>
        <div class="font-bold truncate" style="color:${it ? r.color : '#64748b'}">${it ? it.name : 'Empty'}</div>
        <div class="text-[10px] text-[#8b949e]">${sub}</div>
      </div>
    `;
  }).join('');

  // Class Kit
  document.getElementById('uiPassiveBadge').textContent = cls.passiveName;
  document.getElementById('uiPassiveDesc').textContent = cls.passiveDesc;
  document.getElementById('uiSkillTitle').textContent = `${cls.skillName} [Q]`;
  document.getElementById('uiSkillMpBadge').textContent = `${cls.skillCost} MP`;
  document.getElementById('uiSkillDesc').textContent = cls.skillDesc;

  // Right Sidebar Economy & Pack
  document.getElementById('uiVaultGoldBadge').textContent = `${gameState.guildVault.gold}g`;
  document.getElementById('uiConsumablePotions').textContent = h.consumables.potions;
  document.getElementById('uiConsumableRecalls').textContent = h.consumables.recalls;

  const packList = document.getElementById('uiExpeditionPackList');
  let totalRiskVal = 0;
  const packHtml = [];
  h.expeditionPack.forEach(item => {
    const v = item.val * item.qty;
    totalRiskVal += v;
    const isGem = item.type === 'Gem' && GEM_CATALOG[item.id];
    const nameColor = isGem ? GEM_CATALOG[item.id].color : '#e6edf3';
    const typeIcon = getItemTypeIcon(item);
    packHtml.push(`
      <div class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347] text-xs">
        <span class="flex items-center gap-1.5 truncate" style="color:${nameColor}">
          <span class="text-xs shrink-0 select-none">${typeIcon}</span>
          <span class="truncate">${item.name} x${item.qty}</span>
        </span>
        <span class="text-[#fbbf24] shrink-0 ml-1 font-mono-num">${v}g</span>
      </div>
    `);
  });
  h.expeditionGear.forEach(gear => {
    totalRiskVal += (gear.value || 20);
    const r = RARITY[gear.rarity] || RARITY.common;
    const typeIcon = getItemTypeIcon(gear);
    packHtml.push(`
      <div onclick="window.Aethelgard.openItemInspectModal('${gear.uid}', false, true)" class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347] cursor-pointer hover:border-[#60a5fa] text-xs">
        <span class="flex items-center gap-1.5 truncate" style="color:${r.color}">
          <span class="text-xs shrink-0 select-none">${typeIcon}</span>
          <span class="truncate">${gear.name}</span>
          ${formatSocketPipsHtml(gear)}
        </span>
        <span class="text-[#fbbf24] shrink-0 ml-1 font-mono-num">${gear.value}g</span>
      </div>
    `);
  });
  packList.innerHTML = packHtml.length > 0
    ? packHtml.join('')
    : `<div class="text-[#8b949e] italic text-[11px] py-1">Pack is empty. Mine veins & open chests.</div>`;
  document.getElementById('uiPackTotalValue').textContent = `${totalRiskVal}g Value`;

  // Sidebar Live Bounties Tracker
  const sbBounties = document.getElementById('uiSidebarBountiesList');
  if (sbBounties) {
    sbBounties.innerHTML = (gameState.guildBounties || []).map(b => `
      <div class="p-1.5 rounded bg-[#080b11] border ${b.completed ? 'border-[#34d399]/50' : 'border-[#283347]'} flex items-center justify-between gap-2">
        <div class="truncate">
          <span class="${b.completed ? 'text-[#34d399] font-bold' : 'text-[#e6edf3]'}">${b.completed ? '✓ ' : ''}${b.title}</span>
          <div class="text-[10px] text-[#8b949e] truncate">${b.rewardLabel}</div>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-[#111722] text-[10px] ${b.completed ? 'text-[#34d399] font-bold' : 'text-[#fbbf24]'} whitespace-nowrap">${b.curQty || 0}/${b.reqQty}</span>
      </div>
    `).join('');
  }

  // View Toggle: Overworld, Guild Bastion, or Subterranean Dungeon
  const curView = gameState.activeView || (gameState.inGuild ? 'guild' : 'dungeon');
  const owPanel = document.getElementById('overworldViewPanel');
  const guildPanel = document.getElementById('guildViewPanel');
  const dngPanel = document.getElementById('dungeonViewPanel');

  if (curView === 'overworld') {
    if (owPanel) owPanel.classList.remove('hidden');
    if (guildPanel) guildPanel.classList.add('hidden');
    if (dngPanel) dngPanel.classList.add('hidden');
    renderOverworldHud();
    renderGuidedTasksWidget();
  } else if (curView === 'guild') {
    if (owPanel) owPanel.classList.add('hidden');
    if (guildPanel) guildPanel.classList.remove('hidden');
    if (dngPanel) dngPanel.classList.add('hidden');
    renderGuildHub();
    renderGuidedTasksWidget();
  } else {
    if (owPanel) owPanel.classList.add('hidden');
    if (guildPanel) guildPanel.classList.add('hidden');
    if (dngPanel) dngPanel.classList.remove('hidden');
    renderDungeonHud();
  }

  // Update top view buttons
  const btnOw = document.getElementById('btnViewOverworld');
  const btnGld = document.getElementById('btnViewGuild');
  const btnDng = document.getElementById('btnViewDungeon');
  if (btnOw) {
    btnOw.className = curView === 'overworld'
      ? 'px-3 py-1 text-xs font-bold rounded bg-[#fbbf24] text-[#080b11] shadow'
      : 'px-3 py-1 text-xs font-semibold rounded bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3]';
  }
  if (btnGld) {
    btnGld.className = curView === 'guild'
      ? 'px-3 py-1 text-xs font-bold rounded bg-[#fbbf24] text-[#080b11] shadow'
      : 'px-3 py-1 text-xs font-semibold rounded bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3]';
  }
  if (btnDng) {
    btnDng.className = curView === 'dungeon'
      ? 'px-3 py-1 text-xs font-bold rounded bg-[#f87171] text-[#080b11] shadow'
      : 'px-3 py-1 text-xs font-semibold rounded bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3]';
  }

  renderMinimapCanvas('minimapCanvas');
}

export function renderOverworldHud() {
  if (typeof document === 'undefined') return;
  ensureOverworldHydrated(gameState);
  const ow = gameState.overworld;
  if (!ow) return;

  const party = getActiveOverworldParty(gameState);
  const px = party ? party.x : ow.spawnX;
  const py = party ? party.y : ow.spawnY;
  const tId = (ow.tiles && ow.tiles[py]) ? ow.tiles[py][px] : 1;
  const tDef = OVERWORLD_TERRAIN[tId];

  const coordEl = document.getElementById('uiOverworldCoord');
  if (coordEl) coordEl.textContent = `(${px}, ${py})`;

  const terrainEl = document.getElementById('uiOverworldTerrain');
  if (terrainEl) terrainEl.textContent = tDef ? tDef.name : 'Unknown';

  const statusEl = document.getElementById('uiOverworldPartyStatus');
  if (statusEl) {
    if (party && party.alive) {
      statusEl.textContent = `${party.name} • Ready`;
      statusEl.className = 'text-[#34d399] font-bold';
    } else {
      statusEl.textContent = 'Settled (Civilization Active)';
      statusEl.className = 'text-[#fbbf24] font-bold';
    }
  }

  // Stockpile resources
  let wood = 0, stone = 0, gold = (gameState.guildVault && gameState.guildVault.gold) || 0, food = 0;
  if (gameState.cities && Object.keys(gameState.cities).length > 0) {
    const firstCity = gameState.cities[Object.keys(gameState.cities)[0]];
    if (firstCity && firstCity.stockpile) {
      wood = firstCity.stockpile.wood || 0;
      stone = firstCity.stockpile.stone || 0;
      gold = firstCity.stockpile.gold || gold;
      food = firstCity.stockpile.food || 0;
    }
  }

  const wEl = document.getElementById('uiOverworldWoodStockpile');
  if (wEl) wEl.textContent = wood;
  const sEl = document.getElementById('uiOverworldStoneStockpile');
  if (sEl) sEl.textContent = stone;
  const gEl = document.getElementById('uiOverworldGoldStockpile');
  if (gEl) gEl.textContent = gold;
  const fEl = document.getElementById('uiOverworldFoodStockpile');
  if (fEl) fEl.textContent = food;

  // Found city button state
  const foundBtn = document.getElementById('btnFoundCity');
  if (foundBtn) {
    const canFound = Boolean(party && party.alive && party.canFoundCity && tDef && tDef.buildable);
    foundBtn.disabled = !canFound;
    if (canFound) {
      foundBtn.className = 'px-3 py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-[#080b11] font-bold text-xs uppercase shadow btn-tactical cursor-pointer';
    } else {
      foundBtn.className = 'px-3 py-1.5 rounded-lg bg-[#1a2232] text-[#64748b] font-bold text-xs uppercase border border-[#283347] cursor-not-allowed';
    }
  }

  // Enter Dungeon button state (if standing on or adjacent to dungeon entrance)
  const dngBtn = document.getElementById('btnEnterOverworldDungeon');
  if (dngBtn) {
    let nearDungeon = false;
    if (ow.pois) {
      for (let i = 0; i < ow.pois.length; i++) {
        const poi = ow.pois[i];
        if (poi.type === 'dungeon_entrance' && Math.hypot(poi.x - px, poi.y - py) <= 1.5) {
          nearDungeon = true;
          break;
        }
      }
    }
    dngBtn.disabled = !nearDungeon;
    if (nearDungeon) {
      dngBtn.className = 'px-3 py-1.5 rounded-lg bg-[#f87171] hover:bg-[#ef4444] text-[#080b11] font-bold text-xs uppercase shadow btn-tactical cursor-pointer';
    } else {
      dngBtn.className = 'px-3 py-1.5 rounded-lg bg-[#1a2232] text-[#64748b] font-bold text-xs uppercase border border-[#283347] cursor-not-allowed';
    }
  }

  renderOverworldCanvas();
}

export function renderGuidedTasksWidget() {
  if (typeof document === 'undefined') return;
  ensureOverworldHydrated(gameState);
  const tasks = evaluateGuidedTasks(gameState);
  if (!tasks || tasks.length === 0) return;

  // Find first active task that is ready to claim, or first active incomplete task
  let currentTask = tasks.find(t => t.readyToClaim);
  if (!currentTask) {
    currentTask = tasks.find(t => !t.claimed) || tasks[0];
  }

  const titleEl = document.getElementById('uiGuidedTaskTitle');
  if (titleEl) titleEl.textContent = currentTask.title;

  const descEl = document.getElementById('uiGuidedTaskDesc');
  if (descEl) descEl.textContent = currentTask.desc;

  const rewardEl = document.getElementById('uiGuidedTaskReward');
  if (rewardEl) rewardEl.textContent = `Reward: ${currentTask.rewardLabel}`;

  const claimBtn = document.getElementById('btnClaimTaskReward');
  if (claimBtn) {
    if (!claimBtn.dataset) claimBtn.dataset = {};
    claimBtn.dataset.taskId = currentTask.id;
    if (currentTask.readyToClaim) {
      claimBtn.classList.remove('hidden');
      claimBtn.textContent = '✨ Claim Reward';
      claimBtn.className = 'px-3 py-1 rounded bg-[#34d399] hover:bg-[#10b981] text-[#080b11] font-bold text-xs uppercase shadow btn-tactical animate-pulse';
    } else if (currentTask.claimed) {
      claimBtn.classList.remove('hidden');
      claimBtn.textContent = '✓ Completed';
      claimBtn.className = 'px-3 py-1 rounded bg-[#1a2232] text-[#34d399] font-bold text-xs uppercase border border-[#34d399]/40 cursor-default';
    } else {
      claimBtn.classList.add('hidden');
    }
  }
}

export function switchGuildTab(tabId) {
  if (typeof document === 'undefined') return;
  ['tavern', 'bounties', 'lapidary', 'shop', 'armory', 'talents', 'research', 'codex'].forEach(t => {
    const panel = document.getElementById(`guildTab_${t}`);
    if (panel) panel.classList.toggle('hidden', t !== tabId);
    const btn = document.getElementById(`tabBtn_${t}`);
    if (btn) {
      if (t === tabId) {
        btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-[#fbbf24] text-[#fbbf24] whitespace-nowrap';
      } else {
        btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-transparent text-[#8b949e] hover:text-[#e6edf3] whitespace-nowrap';
      }
    }
  });
}

export function setArmorySortBy(sortKey) {
  if (!gameState.uiSettings) {
    gameState.uiSettings = {};
  }
  gameState.uiSettings.armorySortBy = sortKey;
  updateAllUI();
}

let chronicleFilter = 'all';
const chronicleHistory = [];

export function getChronicleFilter() {
  return chronicleFilter;
}

export function setChronicleFilter(filter) {
  chronicleFilter = filter || 'all';
  renderChronicleLog();
}

export function inferChronicleCategory(msg, tone) {
  const m = String(msg).toLowerCase();
  if (
    /\b(strike|strikes|damage|hit|hits|attacks?|killed|slain|miss|crit(ical)?|stun(ned)?|bleed(ing)?|burn(ing)?|poison(ed)?|whirlwind|nova|volley|smite|shadowstep|defeat)\b/i.test(m)
  ) {
    return 'combat';
  }
  if (
    /\b(found|chests?|unearths?|looted?|loot|gold|ores?|gems?|socket(ed)?|trade|salvage|bought|sold|pickaxe)\b/i.test(m) ||
    m.indexOf('equipped') !== -1
  ) {
    return 'loot';
  }
  return 'system';
}

export function logChronicle(msg, tone = 'info', explicitCategory = null) {
  const cat = explicitCategory || inferChronicleCategory(msg, tone);
  const currentTurn = (gameState && gameState.turn) || 1;

  if (chronicleHistory.length > 0) {
    const last = chronicleHistory[chronicleHistory.length - 1];
    if (last.text === msg && last.tone === tone && last.category === cat) {
      last.count = (last.count || 1) + 1;
      last.turn = currentTurn;
      renderChronicleLog();
      return;
    }
  }

  chronicleHistory.push({
    id: Date.now() + Math.random(),
    turn: currentTurn,
    text: msg,
    tone: tone,
    category: cat,
    count: 1
  });

  if (chronicleHistory.length > 150) {
    chronicleHistory.shift();
  }

  renderChronicleLog();
}

export function clearChronicle() {
  chronicleHistory.length = 0;
  renderChronicleLog();
}

export function renderChronicleLog() {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('chronicle-log');
  if (!box) return;

  const tabs = ['all', 'combat', 'loot', 'system'];
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    const btn = document.getElementById('chronicleTab_' + t);
    if (btn) {
      const active = (chronicleFilter === t);
      btn.className = active
        ? 'px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#fbbf24] text-[#080b11] transition-colors'
        : 'px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#1a2232] text-[#8b949e] hover:text-[#e6edf3] transition-colors';
    }
  }

  const colors = {
    gold: '#fbbf24',
    good: '#34d399',
    bad:  '#f87171',
    info: '#94a3b8'
  };

  const icons = {
    combat: '⚔️',
    loot: '💎',
    system: '📜'
  };

  const filtered = chronicleHistory.filter(item => {
    if (chronicleFilter === 'all') return true;
    return item.category === chronicleFilter;
  });

  box.innerHTML = filtered.map(item => {
    const countBadge = item.count > 1 ? ` <span class="px-1 py-0.2 rounded bg-[#1e293b] text-[#fbbf24] font-bold text-[9px]">(x${item.count})</span>` : '';
    const icon = icons[item.category] || '•';
    const col = colors[item.tone] || colors.info;
    return `<div class="leading-relaxed py-0.5 border-b border-[#1a2232]/40" style="color:${col}">
      <span class="text-[#64748b] text-[10px]">[T${item.turn}]</span>
      <span class="text-[10px] opacity-80 mr-1">${icon}</span>
      <span>${item.text}</span>${countBadge}
    </div>`;
  }).join('');

  box.scrollTop = box.scrollHeight;
}
