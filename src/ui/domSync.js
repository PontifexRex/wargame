// DOM Synchronization, Guild Hub Views, Dungeon HUD, and Tactical Chronicle Log

import { RARITY } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { ORE_CATALOG, MINERAL_DISPLAY } from '../data/ores.js';
import { TALENT_TREES } from '../data/talents.js';
import { RESEARCH_PROJECTS } from '../data/research.js';
import { SHOP_ITEMS } from '../data/items.js';
import {
  gameState,
  recomputeHeroDerivedStats,
  getPickaxeMaxDurability
} from '../engine/state.js';
import { drawHeroSprite } from './renderer.js';

export function renderGuildHub() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  document.getElementById('uiGuildSeed').textContent = gameState.dungeon.seedCode;
  document.getElementById('uiChartedFloors').textContent = Object.keys(gameState.dungeon.floors).length;
  document.getElementById('uiDepthPermit').textContent = `Floor ${permit}`;
  document.getElementById('uiForgeMaxDur').textContent = getPickaxeMaxDurability();
  document.getElementById('uiTavernGold').textContent = gameState.guildVault.gold;
  document.getElementById('uiArmoryCountBadge').textContent = gameState.guildVault.armory.length;
  document.getElementById('uiTalentCountBadge').textContent = h.talentPoints || 0;

  // Mineral Vault Grid
  const minGrid = document.getElementById('uiVaultMineralsGrid');
  minGrid.innerHTML = MINERAL_DISPLAY.map(m => `
    <div class="bg-[#111722] p-2 rounded border border-[#283347]">
      <div class="text-[9px] text-[#8b949e] uppercase">${m.name}</div>
      <div class="font-bold text-sm mt-0.5" style="color:${m.color}">${gameState.guildVault[m.id] || 0}</div>
    </div>
  `).join('');

  // Quartermaster Buy Catalog
  const qmRank = gameState.guildResearch.quartermaster || 0;
  document.getElementById('uiShopTierLabel').textContent = `Requisition Rank ${qmRank}`;
  const shopEl = document.getElementById('shop-catalog');
  shopEl.innerHTML = SHOP_ITEMS.map(s => {
    const unlocked = qmRank >= s.reqQM;
    const canBuy = unlocked && gameState.guildVault.gold >= s.cost;
    const rColor = s.rarity ? RARITY[s.rarity].color : '#e6edf3';
    return `
      <div class="p-2.5 rounded bg-[#111722] border border-[#283347] flex items-center justify-between gap-2 ${!unlocked ? 'opacity-50' : ''}">
        <div>
          <div class="text-xs font-bold" style="color:${rColor}">${s.name}</div>
          <div class="text-[11px] text-[#8b949e]">${s.desc}</div>
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

  gameState.guildVault.armory.forEach(g => {
    const r = RARITY[g.rarity] || RARITY.common;
    const salePrice = Math.round((g.value || 15) * mult);
    sellRows.push(`
      <div class="p-2 rounded bg-[#111722] border border-[#283347] flex items-center justify-between">
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="cursor-pointer hover:underline">
          <span class="font-bold" style="color:${r.color}">${g.name}</span>
          <span class="text-[10px] text-[#8b949e] uppercase ml-1">[${g.slot}]</span>
        </div>
        <button onclick="window.Aethelgard.sellArmoryItem('${g.uid}')" class="px-2.5 py-0.5 rounded bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 text-[#fbbf24] border border-[#fbbf24]/40 font-bold">
          Sell (+${salePrice}g)
        </button>
      </div>
    `);
  });

  sellEl.innerHTML = sellRows.length > 0
    ? sellRows.join('')
    : `<div class="text-[#8b949e] italic py-4 text-center">No banked minerals or spare equipment to appraise. Mine veins & extract from the dungeon!</div>`;

  // Vault Armory Tab
  const armoryGrid = document.getElementById('uiArmoryGrid');
  if (gameState.guildVault.armory.length === 0) {
    armoryGrid.innerHTML = `<div class="col-span-2 text-xs text-[#8b949e] italic py-4 text-center">Your Vault Armory is empty. Defeat monsters, open chests, or buy gear from the Quartermaster.</div>`;
  } else {
    armoryGrid.innerHTML = gameState.guildVault.armory.map(g => {
      const r = RARITY[g.rarity] || RARITY.common;
      return `
        <div onclick="window.Aethelgard.openItemInspectModal('${g.uid}', false, false)" class="p-2.5 rounded bg-[#080b11] border border-[#283347] hover:border-[#60a5fa] cursor-pointer flex items-center justify-between">
          <div>
            <div class="text-xs font-bold" style="color:${r.color}">${g.name}</div>
            <div class="text-[10px] text-[#8b949e] uppercase">${r.name} • ${g.slot}</div>
          </div>
          <span class="text-xs font-mono-num text-[#fbbf24]">${g.value}g</span>
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
}

export function renderDungeonHud() {
  if (typeof document === 'undefined') return;
  const h = gameState.hero;
  const cls = CLASSES[h.classId];
  const depth = gameState.dungeon.currentFloor;
  const permit = RESEARCH_PROJECTS.cartography.levels[gameState.guildResearch.cartography || 0].depthPermit;
  const floor = gameState.dungeon.floors[depth];

  document.getElementById('uiFloorBadge').textContent = `FLOOR ${depth} / ${permit}`;
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
  const cls = CLASSES[h.classId];

  // Header
  document.getElementById('headerSeedText').textContent = gameState.dungeon.seedCode;
  document.getElementById('headerTurnText').textContent = gameState.turn;
  document.getElementById('headerLocationText').textContent = gameState.inGuild
    ? 'Oakhaven Guild Bastion'
    : `Starfall Vaults • Floor ${gameState.dungeon.currentFloor}`;
  document.getElementById('headerLocationDot').className = gameState.inGuild
    ? 'w-2.5 h-2.5 rounded-full bg-[#34d399]'
    : 'w-2.5 h-2.5 rounded-full bg-[#f87171] animate-pulse';

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

  // Statuses
  const stRow = document.getElementById('uiStatusEffectsRow');
  if (h.statuses && h.statuses.length > 0) {
    stRow.innerHTML = h.statuses.map(s => `
      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold" style="background:${s.color}25; color:${s.color}; border:1px solid ${s.color}50">
        ${s.name} (${s.duration})
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

  // Paper Doll 6 Slots
  const dollGrid = document.getElementById('uiPaperDollGrid');
  dollGrid.innerHTML = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'].map(slot => {
    const it = h.equipment[slot];
    const r = it ? (RARITY[it.rarity] || RARITY.common) : RARITY.common;
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
        <div class="text-[9px] text-[#8b949e] uppercase">${slot}</div>
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
    packHtml.push(`
      <div class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347]">
        <span class="text-[#e6edf3]">${item.name} x${item.qty}</span>
        <span class="text-[#fbbf24]">${v}g</span>
      </div>
    `);
  });
  h.expeditionGear.forEach(gear => {
    totalRiskVal += (gear.value || 20);
    const r = RARITY[gear.rarity] || RARITY.common;
    packHtml.push(`
      <div onclick="window.Aethelgard.openItemInspectModal('${gear.uid}', false, true)" class="flex justify-between bg-[#111722] px-2 py-1 rounded border border-[#283347] cursor-pointer hover:border-[#60a5fa]">
        <span style="color:${r.color}">★ ${gear.name}</span>
        <span class="text-[#fbbf24]">${gear.value}g</span>
      </div>
    `);
  });
  packList.innerHTML = packHtml.length > 0
    ? packHtml.join('')
    : `<div class="text-[#8b949e] italic text-[11px] py-1">Pack is empty. Mine veins & open chests.</div>`;
  document.getElementById('uiPackTotalValue').textContent = `${totalRiskVal}g Value`;

  // View Toggle
  if (gameState.inGuild) {
    document.getElementById('guildViewPanel').classList.remove('hidden');
    document.getElementById('dungeonViewPanel').classList.add('hidden');
    renderGuildHub();
  } else {
    document.getElementById('guildViewPanel').classList.add('hidden');
    document.getElementById('dungeonViewPanel').classList.remove('hidden');
    renderDungeonHud();
  }
}

export function switchGuildTab(tabId) {
  if (typeof document === 'undefined') return;
  ['tavern', 'shop', 'armory', 'talents', 'research'].forEach(t => {
    document.getElementById(`guildTab_${t}`).classList.toggle('hidden', t !== tabId);
    const btn = document.getElementById(`tabBtn_${t}`);
    if (t === tabId) {
      btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-[#fbbf24] text-[#fbbf24] whitespace-nowrap';
    } else {
      btn.className = 'px-3 py-1.5 text-xs font-semibold border-b-2 border-transparent text-[#8b949e] hover:text-[#e6edf3] whitespace-nowrap';
    }
  });
}

export function logChronicle(msg, tone = 'info') {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('chronicle-log');
  if (!box) return;
  const colors = {
    gold: '#fbbf24',
    good: '#34d399',
    bad:  '#f87171',
    info: '#94a3b8'
  };
  const div = document.createElement('div');
  div.style.color = colors[tone] || colors.info;
  div.textContent = `[T${gameState.turn}] ${msg}`;
  box.appendChild(div);
  while (box.children.length > 100) {
    box.removeChild(box.firstChild);
  }
  box.scrollTop = box.scrollHeight;
}

export function clearChronicle() {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('chronicle-log');
  if (box) box.innerHTML = '';
}
