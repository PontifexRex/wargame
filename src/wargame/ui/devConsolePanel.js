// Visual Developer Control Panel & Structured Help UI (HR-15 Usability Correction)
// Renders tabbed inspection, direct value controls, common activity presets,
// secondary command terminal, and searchable categorized help inside #wgDevConsoleDrawer.

import { DEV_CONSOLE_TABS } from '../../core/devConsole.js';

let dcpRetireArmedHeroId = null;
let dcpListenersWired = false;

function dcpEscapeHtml(str) {
  return String(str === undefined || str === null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dcpRenderKvRow(label, value, toneClass) {
  return (
    '<div class="flex items-center justify-between gap-2 py-1 border-b border-[#1e293b]/70 last:border-b-0">' +
      '<span class="text-[#94a3b8]">' + dcpEscapeHtml(label) + '</span>' +
      '<span class="font-bold ' + (toneClass || 'text-[#e6edf3]') + '">' + dcpEscapeHtml(value) + '</span>' +
    '</div>'
  );
}

function dcpRenderOverviewTab(snap) {
  const h = snap.activeHero;
  const w = snap.world;
  const d = snap.dungeon;
  const isDng = snap.context === 'dungeon';

  const heroCard = h
    ? (
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-1.5">' +
        '<div class="flex items-center justify-between border-b border-[#283347] pb-1">' +
          '<span class="text-[11px] font-bold uppercase tracking-wider text-[#fbbf24]">Active Hero</span>' +
          '<span class="text-[10px] text-[#38bdf8]">' + dcpEscapeHtml(h.className + ' Lv ' + h.level) + '</span>' +
        '</div>' +
        dcpRenderKvRow('Name', h.name + ' [' + h.id + ']') +
        dcpRenderKvRow('XP', h.xp + ' / ' + h.maxXp, 'text-[#a855f7]') +
        dcpRenderKvRow('HP / MP', h.hp + '/' + h.maxHp + ' HP  •  ' + h.mp + '/' + h.maxMp + ' MP', 'text-[#34d399]') +
        dcpRenderKvRow('Attributes', 'STR ' + h.attributes.str.display + ' • DEX ' + h.attributes.dex.display + ' • INT ' + h.attributes.int.display + ' • VIT ' + h.attributes.vit.display + ' • SPI ' + h.attributes.spi.display) +
        dcpRenderKvRow('Derived', 'ATK ' + h.derived.atk + ' • MAG ' + h.derived.magicPower + ' • DEF ' + h.derived.def + ' • CRIT ' + h.derived.crit + '% • DODGE ' + h.derived.dodge + '%') +
        dcpRenderKvRow('Points / Mode', 'StatPts ' + h.statPoints + ' • TalentPts ' + h.talentPoints + (h.godMode ? ' • GOD MODE' : ''), h.godMode ? 'text-[#fbbf24]' : 'text-[#cbd5e1]') +
      '</div>'
    )
    : '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No active hero yet. Recruit a hero in the Heroes tab or start a campaign.</div>';

  const worldCard =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-1.5">' +
      '<div class="flex items-center justify-between border-b border-[#283347] pb-1">' +
        '<span class="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8]">World &amp; Dungeon Context</span>' +
        '<span class="text-[10px] text-[#c084fc]">' + dcpEscapeHtml(snap.viewLabel) + '</span>' +
      '</div>' +
      dcpRenderKvRow('Campaign', w ? (w.worldName + ' (Seed ' + w.seedCode + ')') : 'Title / Inactive') +
      dcpRenderKvRow('City', (w && w.city) ? (w.city.name + ' (' + w.city.x + ',' + w.city.y + ') • Gold ' + w.city.stockpile.gold) : 'Not Founded') +
      dcpRenderKvRow('Roster / Hostiles', (w ? w.heroCount : 0) + ' Heroes • ' + (w ? w.hostileCount : 0) + ' Overworld Hostiles') +
      dcpRenderKvRow('Dungeon', d.active ? (d.name + ' • Floor ' + d.depth + ' • Turn ' + d.turn) : 'Surface (Not in Dungeon)', d.active ? 'text-[#c084fc]' : 'text-[#94a3b8]') +
      dcpRenderKvRow('Floor Entities', d.monsterCount + ' Monsters • ' + d.objectCount + ' Objects' + (d.heroPos ? (' • Hero (' + d.heroPos.x + ',' + d.heroPos.y + ')') : '')) +
    '</div>';

  const quickBar =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#a855f7]/30 space-y-2">' +
      '<div class="text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">Quick Playtest Actions</div>' +
      '<div class="flex flex-wrap gap-1.5">' +
        '<button type="button" data-dev-act="xp-add" data-val="60" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#a855f7]/40 text-[#c084fc] cursor-pointer">+60 XP</button>' +
        '<button type="button" data-dev-act="level-delta" data-val="1" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fbbf24]/40 text-[#fbbf24] cursor-pointer">Level +1</button>' +
        '<button type="button" data-dev-act="spawn-quick" data-val="vault_crawler" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#f87171]/40 text-[#f87171] cursor-pointer">+ Spawn Crawler</button>' +
        '<button type="button" data-dev-act="resource-delta" data-key="gold" data-val="500" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fbbf24]/40 text-[#fde68a] cursor-pointer">+500 Gold</button>' +
        (isDng
          ? (
            '<button type="button" data-dev-act="heal" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#34d399]/40 text-[#34d399] cursor-pointer">Full Heal</button>' +
            '<button type="button" data-dev-act="reveal" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#38bdf8]/40 text-[#38bdf8] cursor-pointer">Reveal Floor</button>' +
            '<button type="button" data-dev-act="god-toggle" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fbbf24]/40 text-[#fbbf24] cursor-pointer">' + (h && h.godMode ? 'Disable God Mode' : 'Enable God Mode') + '</button>' +
            '<button type="button" data-dev-act="dungeon-exit" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#94a3b8]/40 text-[#e6edf3] cursor-pointer">Exit Dungeon</button>'
          )
          : '<button type="button" data-dev-act="dungeon-enter" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#c084fc]/40 text-[#c084fc] cursor-pointer">Enter Dungeon</button>'
        ) +
      '</div>' +
    '</div>';

  return '<div class="space-y-3"><div class="grid grid-cols-1 md:grid-cols-2 gap-3">' + heroCard + worldCard + '</div>' + quickBar + '</div>';
}

function dcpRenderHeroesTab(snap) {
  const h = snap.activeHero;
  const isDng = snap.context === 'dungeon';

  const heroOptions = snap.heroes.length > 0
    ? snap.heroes.map(function(item) {
      return '<option value="' + dcpEscapeHtml(item.id) + '"' + (item.selected ? ' selected' : '') + '>' + dcpEscapeHtml(item.name + ' (' + item.className + ' Lv ' + item.level + ')') + '</option>';
    }).join('')
    : '<option value="">No heroes in roster</option>';

  const classOptions = snap.recruitableClasses.map(function(cls) {
    return '<option value="' + dcpEscapeHtml(cls.id) + '">' + dcpEscapeHtml(cls.name + ' — ' + cls.title) + '</option>';
  }).join('');

  const selectorRow =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] grid grid-cols-1 md:grid-cols-2 gap-3">' +
      '<div class="space-y-1.5">' +
        '<div class="text-[11px] font-bold uppercase text-[#38bdf8]">Active Hero Selector</div>' +
        '<div class="flex flex-wrap items-center gap-1.5">' +
          '<select data-dev-field="heroSelect" class="flex-1 min-w-[160px] px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]"' + (isDng ? ' disabled' : '') + '>' + heroOptions + '</select>' +
          (!isDng && h ? '<button type="button" data-dev-act="select-party" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#38bdf8]/40 text-[#38bdf8] cursor-pointer">Focus Party</button>' : '') +
          (!isDng && h
            ? (dcpRetireArmedHeroId === h.id
              ? '<button type="button" data-dev-act="retire-confirm" data-hero-id="' + dcpEscapeHtml(h.id) + '" class="px-2 py-1 rounded bg-[#7f1d1d] hover:bg-[#991b1b] border border-[#f87171] text-white font-bold cursor-pointer">Confirm Retire?</button>'
              : '<button type="button" data-dev-act="retire-arm" data-hero-id="' + dcpEscapeHtml(h.id) + '" class="px-2 py-1 rounded bg-[#1a2232] hover:bg-[#450a0a] border border-[#f87171]/40 text-[#f87171] cursor-pointer">Retire</button>')
            : '') +
        '</div>' +
        (isDng ? '<div class="text-[10px] text-[#64748b]">Locked to current Dungeon delving hero.</div>' : '') +
      '</div>' +
      '<div class="space-y-1.5">' +
        '<div class="text-[11px] font-bold uppercase text-[#34d399]">Recruit Adventuring Hero</div>' +
        '<div class="flex flex-wrap items-center gap-1.5">' +
          '<select data-dev-field="recruitClass" class="px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]"' + (isDng ? ' disabled' : '') + '>' + classOptions + '</select>' +
          '<input data-dev-field="recruitName" type="text" placeholder="Optional Name" class="w-28 px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]"' + (isDng ? ' disabled' : '') + ' />' +
          '<button type="button" data-dev-act="recruit-hero" class="px-2.5 py-1 rounded bg-[#34d399]/20 hover:bg-[#34d399]/30 border border-[#34d399]/50 text-[#34d399] font-bold cursor-pointer"' + (isDng ? ' disabled' : '') + '>+ Recruit</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (!h) return '<div class="space-y-3">' + selectorRow + '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No hero selected.</div></div>';

  const attrKeys = ['str', 'dex', 'int', 'vit', 'spi'];
  const attrRows = attrKeys.map(function(k) {
    const a = h.attributes[k];
    return (
      '<div class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-[#1e293b]/70 last:border-b-0">' +
        '<div class="flex items-center gap-2 min-w-[160px]">' +
          '<span class="w-9 font-bold text-[#fbbf24]">' + k.toUpperCase() + '</span>' +
          '<span class="text-[#e6edf3] font-bold">' + a.display + '</span>' +
          '<span class="text-[10px] text-[#64748b]">(int ' + a.internal + ' • bonus ' + a.bonus + ')</span>' +
        '</div>' +
        '<div class="flex items-center gap-1">' +
          '<button type="button" data-dev-act="attr-delta" data-key="' + k + '" data-val="-1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#334155] text-[#f87171] cursor-pointer">-1</button>' +
          '<button type="button" data-dev-act="attr-delta" data-key="' + k + '" data-val="1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#334155] text-[#34d399] cursor-pointer">+1</button>' +
          '<button type="button" data-dev-act="attr-delta" data-key="' + k + '" data-val="5" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#334155] text-[#34d399] cursor-pointer">+5</button>' +
          '<input data-dev-field="attrSet_' + k + '" type="number" min="0" max="999" step="1" value="' + a.bonus + '" class="w-16 px-1.5 py-0.5 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3] text-right" />' +
          '<button type="button" data-dev-act="attr-set" data-key="' + k + '" class="px-2 py-0.5 rounded bg-[#2563eb]/30 hover:bg-[#2563eb]/50 border border-[#60a5fa]/40 text-[#93c5fd] cursor-pointer">Set Bonus</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  const vitalsBox = isDng
    ? (
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2">' +
        '<div class="text-[11px] font-bold uppercase text-[#34d399]">Direct Vitals (Dungeon)</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<span>HP: <strong class="text-[#34d399]">' + h.hp + ' / ' + h.maxHp + '</strong></span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-dev-act="vital-delta" data-key="hp" data-val="-25" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f87171] cursor-pointer">-25</button>' +
            '<button type="button" data-dev-act="vital-delta" data-key="hp" data-val="25" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+25</button>' +
            '<button type="button" data-dev-act="heal" class="px-2 py-0.5 rounded bg-[#34d399]/20 hover:bg-[#34d399]/30 text-[#34d399] font-bold cursor-pointer">Full Heal</button>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<span>MP: <strong class="text-[#60a5fa]">' + h.mp + ' / ' + h.maxMp + '</strong></span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-dev-act="vital-delta" data-key="mp" data-val="-10" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f87171] cursor-pointer">-10</button>' +
            '<button type="button" data-dev-act="vital-delta" data-key="mp" data-val="10" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#60a5fa] cursor-pointer">+10</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    )
    : '';

  const knowledgeBox =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] flex flex-wrap items-center justify-between gap-2 text-[11px]">' +
      '<span class="font-bold uppercase text-[#c084fc]">Knowledge Ranks</span>' +
      '<span class="text-[#cbd5e1]">Monster ' + h.knowledge.monster_knowledge + ' • Item ' + h.knowledge.object_item_knowledge + ' • Flora ' + h.knowledge.flora_knowledge + ' • Fauna ' + h.knowledge.fauna_knowledge + '</span>' +
    '</div>';

  return (
    '<div class="space-y-3">' +
      selectorRow +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347]">' +
        '<div class="flex items-center justify-between border-b border-[#283347] pb-1.5 mb-1">' +
          '<span class="text-[11px] font-bold uppercase text-[#fbbf24]">Foundational Attributes (Bonus Calibration)</span>' +
          '<span class="text-[10px] text-[#94a3b8]">Display = floor(internal)</span>' +
        '</div>' +
        attrRows +
      '</div>' +
      vitalsBox +
      knowledgeBox +
    '</div>'
  );
}

function dcpRenderProgressionTab(snap) {
  const h = snap.activeHero;
  if (!h) return '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No active hero to adjust progression.</div>';

  return (
    '<div class="space-y-3">' +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2.5">' +
        '<div class="flex items-center justify-between border-b border-[#283347] pb-1.5">' +
          '<span class="text-[11px] font-bold uppercase text-[#fbbf24]">Level &amp; Experience Controls</span>' +
          '<span class="text-[11px] text-[#38bdf8]">' + dcpEscapeHtml(h.name + ' • ' + h.className) + '</span>' +
        '</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<span>Level: <strong class="text-[#fbbf24]">' + h.level + '</strong> <span class="text-[#64748b]">(1–100)</span></span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-dev-act="level-delta" data-val="-1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f87171] cursor-pointer">-1</button>' +
            '<button type="button" data-dev-act="level-delta" data-val="1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+1</button>' +
            '<button type="button" data-dev-act="level-delta" data-val="5" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+5</button>' +
            '<input data-dev-field="levelSet" type="number" min="1" max="100" value="' + h.level + '" class="w-16 px-1.5 py-0.5 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3] text-right" />' +
            '<button type="button" data-dev-act="level-set" class="px-2.5 py-0.5 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24]/50 text-[#fbbf24] font-bold cursor-pointer">Set Level</button>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<span>XP: <strong class="text-[#c084fc]">' + h.xp + ' / ' + h.maxXp + '</strong></span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-dev-act="xp-add" data-val="25" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#c084fc] cursor-pointer">+25</button>' +
            '<button type="button" data-dev-act="xp-add" data-val="60" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#c084fc] cursor-pointer">+60</button>' +
            '<button type="button" data-dev-act="xp-add" data-val="200" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#c084fc] cursor-pointer">+200</button>' +
            '<input data-dev-field="xpSet" type="number" min="0" value="' + h.xp + '" class="w-20 px-1.5 py-0.5 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3] text-right" />' +
            '<button type="button" data-dev-act="xp-set" class="px-2.5 py-0.5 rounded bg-[#a855f7]/20 hover:bg-[#a855f7]/30 border border-[#a855f7]/50 text-[#c084fc] font-bold cursor-pointer">Set XP</button>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2">' +
          '<span>Stat Points: <strong class="text-[#34d399]">' + h.statPoints + '</strong> • Talent Points: <strong class="text-[#60a5fa]">' + h.talentPoints + '</strong></span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-dev-act="statpts-delta" data-val="-1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f87171] cursor-pointer">-1</button>' +
            '<button type="button" data-dev-act="statpts-delta" data-val="1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+1</button>' +
            '<button type="button" data-dev-act="statpts-delta" data-val="5" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+5</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">' +
        '<div class="p-2 rounded bg-[#070b12] border border-[#1e293b]"><div class="text-[10px] text-[#94a3b8]">MAX HP</div><div class="text-sm font-bold text-[#34d399]">' + h.derived.maxHp + '</div></div>' +
        '<div class="p-2 rounded bg-[#070b12] border border-[#1e293b]"><div class="text-[10px] text-[#94a3b8]">MAX MP</div><div class="text-sm font-bold text-[#60a5fa]">' + h.derived.maxMp + '</div></div>' +
        '<div class="p-2 rounded bg-[#070b12] border border-[#1e293b]"><div class="text-[10px] text-[#94a3b8]">ATK / MAG</div><div class="text-sm font-bold text-[#fbbf24]">' + h.derived.atk + ' / ' + h.derived.magicPower + '</div></div>' +
        '<div class="p-2 rounded bg-[#070b12] border border-[#1e293b]"><div class="text-[10px] text-[#94a3b8]">DEF / CRIT / DODGE</div><div class="text-sm font-bold text-[#e6edf3]">' + h.derived.def + ' / ' + h.derived.crit + '% / ' + h.derived.dodge + '%</div></div>' +
      '</div>' +
    '</div>'
  );
}

function dcpRenderCombatTab(snap) {
  const isDng = snap.context === 'dungeon';
  const h = snap.activeHero;
  const regOpts = snap.combat.regularArchetypes.map(function(a) {
    return '<option value="' + dcpEscapeHtml(a.id) + '">' + dcpEscapeHtml(a.name + ' (' + a.id + ')') + '</option>';
  }).join('');
  const bossOpts = snap.combat.bossArchetypes.map(function(a) {
    return '<option value="' + dcpEscapeHtml(a.id) + '">' + dcpEscapeHtml('[BOSS] ' + a.name + ' (' + a.id + ')') + '</option>';
  }).join('');

  const spawnerBox =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2">' +
      '<div class="text-[11px] font-bold uppercase text-[#f87171]">' + (isDng ? 'Dungeon Monster &amp; Boss Spawner' : 'Overworld Hostile Spawner') + '</div>' +
      '<div class="flex flex-wrap items-center gap-1.5">' +
        '<select data-dev-field="spawnArch" class="flex-1 min-w-[180px] px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]">' +
          '<optgroup label="Regular Monsters">' + regOpts + '</optgroup>' +
          (isDng ? '<optgroup label="Bosses">' + bossOpts + '</optgroup>' : '') +
        '</select>' +
        '<input data-dev-field="spawnX" type="number" placeholder="X (auto)" class="w-20 px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]" />' +
        '<input data-dev-field="spawnY" type="number" placeholder="Y (auto)" class="w-20 px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]" />' +
        '<button type="button" data-dev-act="spawn-selected" class="px-3 py-1 rounded bg-[#f87171]/20 hover:bg-[#f87171]/30 border border-[#f87171]/50 text-[#f87171] font-bold cursor-pointer">+ Spawn</button>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-1.5 text-[10px]">' +
        '<span class="text-[#94a3b8]">Quick Presets:</span>' +
        '<button type="button" data-dev-act="spawn-quick" data-val="vault_crawler" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fca5a5] cursor-pointer">+ Vault Crawler</button>' +
        '<button type="button" data-dev-act="spawn-quick" data-val="starfall_archer" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fca5a5] cursor-pointer">+ Starfall Archer</button>' +
        '<button type="button" data-dev-act="spawn-quick" data-val="bone_warden" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fca5a5] cursor-pointer">+ Bone Warden</button>' +
        (isDng ? '<button type="button" data-dev-act="spawn-quick" data-val="boss_colossus" class="px-2 py-0.5 rounded bg-[#450a0a] hover:bg-[#7f1d1d] border border-[#f87171]/50 text-[#fecaca] cursor-pointer">+ Colossus Boss</button>' : '') +
      '</div>' +
    '</div>';

  const skillBox = (h && h.skill)
    ? (
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] flex flex-wrap items-center justify-between gap-2">' +
        '<div class="space-y-0.5">' +
          '<div class="text-[11px] font-bold text-[#60a5fa]">⚡ ' + dcpEscapeHtml(h.skill.name) + ' (' + h.skill.cost + ' MP • Rng ' + h.skill.range + ')</div>' +
          '<div class="text-[10px] text-[#94a3b8]">' + dcpEscapeHtml(h.skill.desc) + '</div>' +
          (isDng && h.skill.targeting
            ? '<div class="text-[10px] ' + (h.skill.targeting.valid ? 'text-[#34d399]' : 'text-[#fbbf24]') + '">Targeting: ' + (h.skill.targeting.valid ? ('READY (' + h.skill.targeting.targets.length + ' target(s))') : (h.skill.targeting.canAfford ? 'No target in range' : 'Insufficient MP')) + '</div>'
            : '') +
        '</div>' +
        (isDng
          ? '<button type="button" data-dev-act="trigger-skill" class="px-3 py-1 rounded bg-[#60a5fa]/20 hover:bg-[#60a5fa]/30 border border-[#60a5fa]/50 text-[#60a5fa] font-bold cursor-pointer">⚡ Cast Skill</button>'
          : '<span class="text-[10px] text-[#64748b]">Castable in Dungeon</span>') +
      '</div>'
    )
    : '';

  const entityList = isDng ? snap.combat.monsters : snap.combat.hostiles;
  const listHtml = entityList.length === 0
    ? '<div class="text-[#64748b] py-1">No active ' + (isDng ? 'monsters on this floor.' : 'wandering hostiles on the Overworld.') + '</div>'
    : entityList.slice(0, 15).map(function(m) {
      return (
        '<div class="flex items-center justify-between gap-2 py-1 border-b border-[#1e293b]/60 last:border-b-0">' +
          '<span class="' + (m.isBoss ? 'text-[#fbbf24] font-bold' : 'text-[#e6edf3]') + '">' + dcpEscapeHtml(m.name) + ' <span class="text-[#64748b]">(' + m.x + ',' + m.y + ')</span></span>' +
          '<span class="text-[#94a3b8]">HP ' + m.hp + (m.maxHp ? ('/' + m.maxHp) : '') + (m.atk !== undefined ? (' • ATK ' + m.atk + ' • DEF ' + m.def) : (' • PWR ' + m.power)) + '</span>' +
        '</div>'
      );
    }).join('');

  const abSnap = snap.abilities || { catalog: [], granted: [], absorbShield: 0, pendingCast: null, statuses: [] };
  const abOpts = abSnap.catalog.map(function(a) {
    return '<option value="' + dcpEscapeHtml(a.id) + '">' + dcpEscapeHtml(a.name + ' [' + a.domain + ' ' + a.kind + ']') + '</option>';
  }).join('');
  const grantedChips = abSnap.granted.length === 0
    ? '<span class="text-[#64748b]">None</span>'
    : abSnap.granted.map(function(g) {
      return '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#070b12] border border-[#283347] text-[10px]">' +
        '<strong class="text-[#e6edf3]">' + dcpEscapeHtml(g.name) + '</strong>' +
        '<span class="text-[#64748b]">(' + dcpEscapeHtml(g.sources.join('+')) + ')</span>' +
        (g.cooldownRemaining > 0 ? '<span class="text-[#f87171]">CD:' + g.cooldownRemaining + 't</span>' : '') +
      '</span>';
    }).join(' ');
  const statusChips = abSnap.statuses.length === 0
    ? '<span class="text-[#64748b]">None</span>'
    : abSnap.statuses.map(function(s) {
      return '<span class="px-1.5 py-0.5 rounded bg-[#070b12] border border-[#283347] text-[10px] ' + (s.isBuff ? 'text-[#34d399]' : 'text-[#f87171]') + '">' + dcpEscapeHtml(s.name) + ' (' + s.duration + 't)</span>';
    }).join(' ');

  const abilityBox =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2">' +
      '<div class="flex flex-wrap items-center justify-between gap-2">' +
        '<div class="text-[11px] font-bold uppercase text-[#818cf8]">✨ Spells, Prayers &amp; Skills (MG-01A)</div>' +
        '<div class="flex items-center gap-1.5">' +
          '<span class="text-[10px] text-[#c7d2fe]">Shield: <strong>' + (abSnap.absorbShield || 0) + '</strong></span>' +
          '<button type="button" data-dev-act="reset-cds" class="px-2 py-0.5 rounded bg-[#34d399]/20 hover:bg-[#34d399]/30 border border-[#34d399]/50 text-[10px] text-[#34d399] font-bold cursor-pointer">Reset CDs + Full MP</button>' +
        '</div>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-1.5">' +
        '<select data-dev-field="devAbilityId" class="flex-1 min-w-[180px] px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]">' + abOpts + '</select>' +
        '<select data-dev-field="devAbilitySrc" class="px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]">' +
          '<option value="learned">learned</option>' +
          '<option value="item">item</option>' +
          '<option value="temporary">temporary</option>' +
          '<option value="class">class</option>' +
        '</select>' +
        '<button type="button" data-dev-act="grant-ability" class="px-2.5 py-1 rounded bg-[#818cf8]/20 hover:bg-[#818cf8]/30 border border-[#818cf8]/50 text-[#c7d2fe] font-bold cursor-pointer">+ Grant</button>' +
        '<button type="button" data-dev-act="revoke-ability" class="px-2.5 py-1 rounded bg-[#f87171]/20 hover:bg-[#f87171]/30 border border-[#f87171]/50 text-[#fca5a5] font-bold cursor-pointer">Revoke</button>' +
      '</div>' +
      '<div class="flex flex-wrap gap-1 items-center text-[10px]"><span class="text-[#94a3b8]">Granted:</span> ' + grantedChips + '</div>' +
      '<div class="flex flex-wrap gap-1 items-center text-[10px]"><span class="text-[#94a3b8]">Active Statuses:</span> ' + statusChips + '</div>' +
      '<div class="flex flex-wrap items-center gap-1 text-[10px]">' +
        '<span class="text-[#94a3b8]">Test Status:</span>' +
        '<button type="button" data-dev-act="apply-status" data-val="silence" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#e879f9] cursor-pointer">+ Silence</button>' +
        '<button type="button" data-dev-act="apply-status" data-val="chilled" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] cursor-pointer">+ Chilled</button>' +
        '<button type="button" data-dev-act="apply-status" data-val="burn" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#fb923c] cursor-pointer">+ Burn</button>' +
        '<button type="button" data-dev-act="apply-status" data-val="slow" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] cursor-pointer">+ Slow</button>' +
      '</div>' +
    '</div>';

  return (
    '<div class="space-y-3">' +
      spawnerBox +
      abilityBox +
      skillBox +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347]">' +
        '<div class="text-[11px] font-bold uppercase text-[#94a3b8] border-b border-[#283347] pb-1 mb-1">' +
          (isDng ? ('Living Floor Monsters (' + entityList.length + ')') : ('Living Overworld Hostiles (' + entityList.length + ')')) +
        '</div>' +
        listHtml +
      '</div>' +
    '</div>'
  );
}

function dcpRenderDungeonTab(snap) {
  const isDng = snap.context === 'dungeon';
  const d = snap.dungeon;
  const h = snap.activeHero;

  return (
    '<div class="space-y-3">' +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2.5">' +
        '<div class="flex items-center justify-between border-b border-[#283347] pb-1.5">' +
          '<span class="text-[11px] font-bold uppercase text-[#c084fc]">Dungeon Lifecycle &amp; Floor Controls</span>' +
          '<span class="text-[10px] text-[#38bdf8]">' + dcpEscapeHtml(d.active ? (d.name + ' • Floor ' + d.depth) : 'Currently on Surface') + '</span>' +
        '</div>' +
        '<div class="flex flex-wrap items-center gap-2">' +
          (!isDng
            ? '<button type="button" data-dev-act="dungeon-enter" class="px-3 py-1.5 rounded bg-[#a855f7]/25 hover:bg-[#a855f7]/40 border border-[#c084fc]/60 text-[#e9d5ff] font-bold cursor-pointer">🏰 Enter Dungeon (Lifecycle)</button>'
            : (
              '<button type="button" data-dev-act="dungeon-exit" class="px-3 py-1.5 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24]/50 text-[#fbbf24] font-bold cursor-pointer">🗺 Exit to Overworld</button>' +
              '<button type="button" data-dev-act="reveal" class="px-2.5 py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#38bdf8]/40 text-[#38bdf8] cursor-pointer">👁 Reveal Floor</button>' +
              '<button type="button" data-dev-act="god-toggle" class="px-2.5 py-1.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fbbf24]/40 text-[#fbbf24] cursor-pointer">' + (h && h.godMode ? '🛡️ God Mode: ON' : '🛡️ God Mode: OFF') + '</button>'
            )) +
        '</div>' +
        (isDng
          ? (
            '<div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e293b]">' +
              '<span>Floor Warp (Debug): <strong class="text-[#60a5fa]">Floor ' + d.depth + '</strong></span>' +
              '<div class="flex items-center gap-1">' +
                '<button type="button" data-dev-act="floor-delta" data-val="-1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] cursor-pointer">-1</button>' +
                '<button type="button" data-dev-act="floor-delta" data-val="1" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#38bdf8] cursor-pointer">+1</button>' +
                '<input data-dev-field="floorSet" type="number" min="1" max="999" value="' + d.depth + '" class="w-16 px-1.5 py-0.5 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3] text-right" />' +
                '<button type="button" data-dev-act="floor-set" class="px-2.5 py-0.5 rounded bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/50 text-[#38bdf8] font-bold cursor-pointer">Warp</button>' +
              '</div>' +
            '</div>'
          )
          : '<div class="text-[10px] text-[#94a3b8]">Enter a dungeon (party standing at a discovered dungeon entrance) to enable floor warp, map reveal, and object spawning.</div>') +
      '</div>' +
      (isDng
        ? (
          '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2">' +
            '<div class="text-[11px] font-bold uppercase text-[#34d399]">Quick Dungeon Object Spawner (Adjacent Tile)</div>' +
            '<div class="flex flex-wrap gap-1.5">' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="portal" data-sub="waypoint_portal" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#38bdf8]/40 text-[#38bdf8] cursor-pointer">+ Waypoint Portal</button>' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="portal" data-sub="return_rift" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#c084fc]/40 text-[#c084fc] cursor-pointer">+ Return Rift</button>' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="door" data-sub="iron_door" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#94a3b8]/40 text-[#e6edf3] cursor-pointer">+ Iron Door</button>' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="container" data-sub="chest" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fbbf24]/40 text-[#fbbf24] cursor-pointer">+ Treasure Chest</button>' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="key" data-sub="iron_key" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#fde68a]/40 text-[#fde68a] cursor-pointer">+ Dungeon Key</button>' +
              '<button type="button" data-dev-act="spawn-obj" data-otype="mechanism" data-sub="lever" class="px-2.5 py-1 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#34d399]/40 text-[#34d399] cursor-pointer">+ Lever</button>' +
            '</div>' +
          '</div>'
        )
        : '') +
    '</div>'
  );
}

function dcpRenderItemsTab(snap) {
  const h = snap.activeHero;
  const shopOpts = snap.items.shopItems.map(function(it) {
    return '<option value="' + dcpEscapeHtml(it.id) + '">' + dcpEscapeHtml(it.name + ' [' + it.slot + ']') + '</option>';
  }).join('');

  const grantBox =
    '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] space-y-2">' +
      '<div class="text-[11px] font-bold uppercase text-[#fbbf24]">Grant Canonical Item (No Raw ID Needed)</div>' +
      '<div class="flex flex-wrap items-center gap-1.5">' +
        '<select data-dev-field="grantItem" class="flex-1 min-w-[200px] px-2 py-1 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3]">' + shopOpts + '</select>' +
        '<button type="button" data-dev-act="grant-item" class="px-3 py-1 rounded bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24]/50 text-[#fbbf24] font-bold cursor-pointer">+ Grant Item</button>' +
      '</div>' +
    '</div>';

  if (!h) return '<div class="space-y-3">' + grantBox + '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No active hero.</div></div>';

  const eqRows = h.equipment.map(function(slot) {
    return dcpRenderKvRow(slot.slot.toUpperCase(), slot.name || '— Empty —', slot.name ? 'text-[#e6edf3]' : 'text-[#64748b]');
  }).join('');

  const packRows = h.packItems.length === 0
    ? '<div class="text-[#64748b] py-1">No unequipped gear in pack. Grant an item above to test equipping.</div>'
    : h.packItems.map(function(it) {
      return (
        '<div class="flex items-center justify-between gap-2 py-1 border-b border-[#1e293b]/60 last:border-b-0">' +
          '<span class="text-[#e6edf3]">' + dcpEscapeHtml(it.name) + ' <span class="text-[10px] text-[#64748b]">[' + dcpEscapeHtml(it.slot) + ']</span></span>' +
          '<button type="button" data-dev-act="equip-item" data-uid="' + dcpEscapeHtml(it.uid) + '" class="px-2 py-0.5 rounded bg-[#34d399]/20 hover:bg-[#34d399]/30 border border-[#34d399]/40 text-[#34d399] font-bold cursor-pointer">Equip</button>' +
        '</div>'
      );
    }).join('');

  return (
    '<div class="space-y-3">' +
      grantBox +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' +
        '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347]">' +
          '<div class="text-[11px] font-bold uppercase text-[#38bdf8] border-b border-[#283347] pb-1 mb-1">Equipped 6-Slot Loadout</div>' +
          eqRows +
          '<div class="mt-2 pt-1.5 border-t border-[#1e293b] text-[10px] text-[#94a3b8]">Consumables: 🧪 Tonics ' + (h.consumables.potions || 0) + ' • 📜 Recalls ' + (h.consumables.recalls || 0) + '</div>' +
        '</div>' +
        '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347]">' +
          '<div class="text-[11px] font-bold uppercase text-[#34d399] border-b border-[#283347] pb-1 mb-1">Pack / Bag Gear (' + h.packItems.length + ')</div>' +
          packRows +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function dcpRenderWorldTab(snap) {
  const w = snap.world;
  if (!w || !w.city) {
    return '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No founded city in the current campaign yet. Found a city to edit stockpiles and inspect world state.</div>';
  }
  const c = w.city;
  const resKeys = ['gold', 'wood', 'stone', 'food', 'water', 'ore', 'ingots'];
  const rows = resKeys.map(function(k) {
    const val = c.stockpile[k] || 0;
    return (
      '<div class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-[#1e293b]/70 last:border-b-0">' +
        '<div class="flex items-center gap-2 min-w-[130px]">' +
          '<span class="w-16 font-bold uppercase text-[#fbbf24]">' + k + '</span>' +
          '<span class="text-[#e6edf3] font-bold">' + val + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-1">' +
          '<button type="button" data-dev-act="resource-delta" data-key="' + k + '" data-val="-100" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#f87171] cursor-pointer">-100</button>' +
          '<button type="button" data-dev-act="resource-delta" data-key="' + k + '" data-val="100" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+100</button>' +
          '<button type="button" data-dev-act="resource-delta" data-key="' + k + '" data-val="500" class="px-2 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] text-[#34d399] cursor-pointer">+500</button>' +
          '<input data-dev-field="resSet_' + k + '" type="number" min="0" value="' + val + '" class="w-20 px-1.5 py-0.5 rounded bg-[#05080f] border border-[#334155] text-[#e6edf3] text-right" />' +
          '<button type="button" data-dev-act="resource-set" data-key="' + k + '" class="px-2 py-0.5 rounded bg-[#2563eb]/30 hover:bg-[#2563eb]/50 border border-[#60a5fa]/40 text-[#93c5fd] cursor-pointer">Set</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  return (
    '<div class="space-y-3">' +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#fb923c]/40 flex flex-wrap items-center justify-between gap-2">' +
        '<div>' +
          '<div class="text-[11px] font-bold uppercase text-[#fb923c]">City Workshop Playtest Setup</div>' +
          '<div class="text-[10px] text-[#94a3b8]">Unlocks Quarry, Smeltery, Blacksmith &amp; Lapidary on empty plots + ensures 20 Ingots &amp; 200g (non-destructive).</div>' +
        '</div>' +
        '<button type="button" data-dev-act="setup-forge" class="px-3 py-1.5 rounded bg-[#fb923c]/20 hover:bg-[#fb923c]/35 border border-[#fb923c]/60 text-[#fb923c] font-bold cursor-pointer">🔨 Setup Blacksmith &amp; 20 Ingots</button>' +
      '</div>' +
      '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347]">' +
        '<div class="flex items-center justify-between border-b border-[#283347] pb-1.5 mb-1">' +
          '<span class="text-[11px] font-bold uppercase text-[#fbbf24]">' + dcpEscapeHtml(c.name) + ' Stockpiles</span>' +
          '<span class="text-[10px] text-[#94a3b8]">(' + c.x + ', ' + c.y + ') • ' + c.buildingCount + ' Buildings • ' + w.hostileCount + ' Hostiles</span>' +
        '</div>' +
        rows +
      '</div>' +
    '</div>'
  );
}

function dcpRenderHelpListHtml(catalog) {
  if (!catalog.categories || catalog.categories.length === 0) {
    return '<div class="p-3 rounded-lg bg-[#0b111e] border border-[#283347] text-[#94a3b8]">No help entries matched "' + dcpEscapeHtml(catalog.query) + '". Try clearing the filter.</div>';
  }
  return catalog.categories.map(function(cat) {
    const items = cat.entries.map(function(entry) {
      const exHtml = (entry.examples && entry.examples.length > 0)
        ? '<div class="flex flex-wrap items-center gap-1 pt-1">' +
            '<span class="text-[10px] text-[#64748b]">Examples:</span>' +
            entry.examples.map(function(ex) {
              return '<button type="button" data-dev-act="run-example" data-cmd="' + dcpEscapeHtml(ex) + '" class="px-1.5 py-0.5 rounded bg-[#1a2232] hover:bg-[#283347] border border-[#a855f7]/30 text-[10px] text-[#c084fc] cursor-pointer" title="Load in Commands tab">' + dcpEscapeHtml(ex) + '</button>';
            }).join('') +
          '</div>'
        : '';
      return (
        '<div class="p-2.5 rounded bg-[#070b12] border border-[#1e293b] space-y-1">' +
          '<div class="flex flex-wrap items-center justify-between gap-2">' +
            '<code class="text-[#38bdf8] font-bold">' + dcpEscapeHtml(entry.usage) + '</code>' +
            '<span class="px-1.5 py-0.5 rounded bg-[#1a2232] text-[10px] text-[#94a3b8] uppercase">' + dcpEscapeHtml(entry.contexts.join(' / ')) + '</span>' +
          '</div>' +
          '<div class="text-[#cbd5e1]">' + dcpEscapeHtml(entry.desc) + '</div>' +
          exHtml +
        '</div>'
      );
    }).join('');
    return (
      '<div class="space-y-1.5">' +
        '<div class="text-[11px] font-bold uppercase tracking-wider text-[#fbbf24] pt-1">' + dcpEscapeHtml(cat.name) + ' (' + cat.entries.length + ')</div>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">' + items + '</div>' +
      '</div>'
    );
  }).join('');
}

function dcpRenderHelpTab(devConsole) {
  const q = devConsole.getHelpFilter();
  const catalog = devConsole.getHelpCatalog(q);
  return (
    '<div class="space-y-3">' +
      '<div class="p-2.5 rounded-lg bg-[#0b111e] border border-[#283347] flex flex-wrap items-center justify-between gap-2">' +
        '<div class="flex-1 min-w-[200px] flex items-center gap-2">' +
          '<span class="text-[#94a3b8]">🔎</span>' +
          '<input data-dev-help-filter="1" type="text" value="' + dcpEscapeHtml(q) + '" placeholder="Filter commands, categories, or examples (e.g. spawn, hero, floor)..." class="flex-1 px-2.5 py-1 rounded bg-[#05080f] border border-[#334155] focus:border-[#a855f7] focus:outline-none text-[#e6edf3]" />' +
        '</div>' +
        '<span data-dev-help-count="1" class="text-[10px] text-[#94a3b8]">Showing ' + catalog.matchedCount + ' / ' + catalog.totalCount + ' commands</span>' +
      '</div>' +
      '<div data-dev-help-list="1" class="space-y-2.5">' + dcpRenderHelpListHtml(catalog) + '</div>' +
    '</div>'
  );
}

export function renderDevConsolePanel(devConsole) {
  if (typeof document === 'undefined' || !devConsole) return;
  const drawer = document.getElementById('wgDevConsoleDrawer');
  if (!drawer) return;

  if (!devConsole.isOpen()) {
    drawer.classList.add('hidden');
    dcpRetireArmedHeroId = null;
    return;
  }
  drawer.classList.remove('hidden');

  const snap = devConsole.getInspectorSnapshot();
  const tabId = devConsole.getTab();

  const badge = document.getElementById('wgDevConsoleContextBadge');
  if (badge) {
    badge.textContent = snap.viewLabel;
  }

  const tabsEl = document.getElementById('wgDevConsoleTabs');
  if (tabsEl) {
    tabsEl.innerHTML = DEV_CONSOLE_TABS.map(function(t) {
      const active = t.id === tabId;
      return (
        '<button type="button" data-dev-tab="' + t.id + '" class="px-2.5 py-1 rounded-t text-[11px] font-mono whitespace-nowrap cursor-pointer border-b-2 ' +
        (active
          ? 'bg-[#0b111e] text-[#fbbf24] border-[#fbbf24] font-bold'
          : 'bg-transparent text-[#94a3b8] hover:text-[#e6edf3] border-transparent') +
        '">' + t.icon + ' ' + dcpEscapeHtml(t.label) + '</button>'
      );
    }).join('');
  }

  const bodyEl = document.getElementById('wgDevConsolePanelBody');
  const termSec = document.getElementById('wgDevConsoleTerminalSection');

  if (tabId === 'commands') {
    if (bodyEl) bodyEl.classList.add('hidden');
    if (termSec) termSec.classList.remove('hidden');
    const outEl = document.getElementById('wgDevConsoleOutput');
    if (outEl) {
      const lines = devConsole.getOutput();
      outEl.innerHTML = lines.map(function(entry) {
        const col = entry.tone === 'err' ? 'text-[#f87171]' : (entry.tone === 'ok' ? 'text-[#34d399]' : (entry.tone === 'cmd' ? 'text-[#c084fc] font-bold' : 'text-[#94a3b8]'));
        return '<div class="' + col + ' whitespace-pre-wrap break-words">' + dcpEscapeHtml(entry.text) + '</div>';
      }).join('');
      outEl.scrollTop = outEl.scrollHeight;
    }
  } else {
    if (termSec) termSec.classList.add('hidden');
    if (bodyEl) {
      bodyEl.classList.remove('hidden');
      if (tabId === 'overview') bodyEl.innerHTML = dcpRenderOverviewTab(snap);
      else if (tabId === 'heroes') bodyEl.innerHTML = dcpRenderHeroesTab(snap);
      else if (tabId === 'progression') bodyEl.innerHTML = dcpRenderProgressionTab(snap);
      else if (tabId === 'combat') bodyEl.innerHTML = dcpRenderCombatTab(snap);
      else if (tabId === 'dungeon') bodyEl.innerHTML = dcpRenderDungeonTab(snap);
      else if (tabId === 'items') bodyEl.innerHTML = dcpRenderItemsTab(snap);
      else if (tabId === 'world') bodyEl.innerHTML = dcpRenderWorldTab(snap);
      else if (tabId === 'help') bodyEl.innerHTML = dcpRenderHelpTab(devConsole);
    }
  }

  const fbEl = document.getElementById('wgDevConsoleFeedback');
  if (fbEl) {
    const fb = devConsole.getLastFeedback();
    if (!fb) {
      fbEl.innerHTML = '<span class="text-[#64748b]">Ready — use visual controls above or switch to Commands / Help.</span>';
    } else {
      fbEl.innerHTML = '<span class="' + (fb.ok ? 'text-[#34d399]' : 'text-[#f87171]') + '">' + (fb.ok ? '✓ ' : '✕ ') + dcpEscapeHtml(fb.text) + '</span>';
    }
  }
}

export function attachDevConsolePanelListeners(devConsole, onRender) {
  if (typeof document === 'undefined' || dcpListenersWired) return;
  const drawer = document.getElementById('wgDevConsoleDrawer');
  if (!drawer) return;
  dcpListenersWired = true;

  function fieldVal(name) {
    const el = drawer.querySelector('[data-dev-field="' + name + '"]');
    return el ? el.value : '';
  }

  drawer.addEventListener('change', function(e) {
    const t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-dev-field') === 'heroSelect') {
      devConsole.setSelectedHeroId(t.value || null);
      dcpRetireArmedHeroId = null;
      if (typeof onRender === 'function') onRender();
    }
  });

  drawer.addEventListener('input', function(e) {
    const t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-dev-help-filter') === '1') {
      devConsole.setHelpFilter(t.value || '');
      const catalog = devConsole.getHelpCatalog();
      const listEl = drawer.querySelector('[data-dev-help-list="1"]');
      const countEl = drawer.querySelector('[data-dev-help-count="1"]');
      if (listEl) listEl.innerHTML = dcpRenderHelpListHtml(catalog);
      if (countEl) countEl.textContent = 'Showing ' + catalog.matchedCount + ' / ' + catalog.totalCount + ' commands';
    }
  });

  drawer.addEventListener('click', function(e) {
    if (!e.target || !e.target.closest) return;

    const tabBtn = e.target.closest('button[data-dev-tab]');
    if (tabBtn) {
      devConsole.setTab(tabBtn.getAttribute('data-dev-tab'));
      dcpRetireArmedHeroId = null;
      if (typeof onRender === 'function') onRender();
      if (devConsole.getTab() === 'commands') {
        const inp = document.getElementById('wgDevConsoleInput');
        if (inp) inp.focus();
      }
      return;
    }

    const actBtn = e.target.closest('button[data-dev-act]');
    if (!actBtn) return;
    const act = actBtn.getAttribute('data-dev-act');

    if (act === 'xp-add') {
      devConsole.adjustHeroXp(Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'xp-set') {
      devConsole.adjustHeroXp(0, fieldVal('xpSet'));
    } else if (act === 'level-delta') {
      devConsole.adjustHeroLevel(Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'level-set') {
      devConsole.adjustHeroLevel(0, fieldVal('levelSet'));
    } else if (act === 'statpts-delta') {
      devConsole.adjustHeroStatPoints(Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'attr-delta') {
      devConsole.adjustHeroAttribute(actBtn.getAttribute('data-key'), Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'attr-set') {
      const k = actBtn.getAttribute('data-key');
      devConsole.adjustHeroAttribute(k, 0, fieldVal('attrSet_' + k));
    } else if (act === 'vital-delta') {
      devConsole.adjustHeroVitals(actBtn.getAttribute('data-key'), Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'heal') {
      devConsole.execute('heal');
    } else if (act === 'reveal') {
      devConsole.execute('reveal');
    } else if (act === 'god-toggle') {
      devConsole.toggleHeroGodMode();
    } else if (act === 'dungeon-enter') {
      devConsole.execute('dungeon enter');
    } else if (act === 'dungeon-exit') {
      devConsole.execute('dungeon exit');
    } else if (act === 'floor-delta') {
      const snap = devConsole.getInspectorSnapshot();
      const target = Math.max(1, (snap.dungeon.depth || 1) + Number(actBtn.getAttribute('data-val')));
      devConsole.execute('floor ' + target);
    } else if (act === 'floor-set') {
      devConsole.execute('floor ' + fieldVal('floorSet'));
    } else if (act === 'spawn-selected') {
      const arch = fieldVal('spawnArch') || 'vault_crawler';
      const sx = fieldVal('spawnX');
      const sy = fieldVal('spawnY');
      devConsole.spawnObject('monster', arch, sx, sy);
    } else if (act === 'spawn-quick') {
      devConsole.spawnObject('monster', actBtn.getAttribute('data-val') || 'vault_crawler', null, null);
    } else if (act === 'spawn-obj') {
      devConsole.spawnObject(actBtn.getAttribute('data-otype'), actBtn.getAttribute('data-sub'), null, null);
    } else if (act === 'trigger-skill') {
      devConsole.triggerHeroSkill();
    } else if (act === 'grant-ability') {
      devConsole.grantHeroAbility(fieldVal('devAbilityId'), fieldVal('devAbilitySrc') || 'learned');
    } else if (act === 'revoke-ability') {
      devConsole.revokeHeroAbility(fieldVal('devAbilityId'), fieldVal('devAbilitySrc') || 'learned');
    } else if (act === 'reset-cds') {
      devConsole.resetHeroCooldownsAndMp();
    } else if (act === 'apply-status') {
      devConsole.applyTestStatusToHero(actBtn.getAttribute('data-val') || 'burn', 3);
    } else if (act === 'recruit-hero') {
      const clsId = fieldVal('recruitClass') || 'fighter';
      const rName = String(fieldVal('recruitName') || '').trim();
      devConsole.execute(rName ? ('recruit ' + clsId + ' "' + rName.replace(/"/g, '') + '"') : ('recruit ' + clsId));
    } else if (act === 'select-party') {
      const hid = fieldVal('heroSelect');
      if (hid) devConsole.execute('select ' + hid);
    } else if (act === 'retire-arm') {
      dcpRetireArmedHeroId = actBtn.getAttribute('data-hero-id');
    } else if (act === 'retire-confirm') {
      const hid = actBtn.getAttribute('data-hero-id');
      dcpRetireArmedHeroId = null;
      if (hid) devConsole.execute('retire ' + hid + ' confirm');
    } else if (act === 'grant-item') {
      devConsole.grantShopItem(fieldVal('grantItem'));
    } else if (act === 'equip-item') {
      const uid = actBtn.getAttribute('data-uid');
      if (uid) devConsole.execute('equip ' + uid);
    } else if (act === 'setup-forge') {
      devConsole.setupCityForgeWorkflow();
    } else if (act === 'resource-delta') {
      devConsole.adjustCityResource(actBtn.getAttribute('data-key'), Number(actBtn.getAttribute('data-val')), null);
    } else if (act === 'resource-set') {
      const rk = actBtn.getAttribute('data-key');
      devConsole.adjustCityResource(rk, 0, fieldVal('resSet_' + rk));
    } else if (act === 'run-example') {
      const cmd = actBtn.getAttribute('data-cmd') || '';
      devConsole.setTab('commands');
      if (typeof onRender === 'function') onRender();
      const inp = document.getElementById('wgDevConsoleInput');
      if (inp) {
        inp.value = cmd;
        inp.focus();
      }
      return;
    }

    if (typeof onRender === 'function') onRender();
  });
}
