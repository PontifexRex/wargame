// Shared Spellbook & Skill Browser Data & HTML Renderer (MG-01C)
// Reusable across Wargame Hero Sheet, Integrated Dungeon, and Standalone Roguelike.
// Derives all costs, cooldowns, requirements, and numeric estimates from authoritative services.

import { getAbilityDefinition } from '../../data/abilities.js';
import {
  normalizeActorAbilityState,
  getGrantedAbilityIds,
  getGrantedAbilitySources,
  getHeroQuickSlots,
  getEffectiveAbilityCost,
  getAbilityCooldownRemaining,
  getStrategicAbilityCooldownRemainingMs,
  validateAbilityActivation,
  computeAbilityDamage,
  computeAbilityHealAmount,
  computeAbilityShieldAmount,
  QUICK_SLOT_COUNT
} from '../../core/abilityEngine.js';

function sbEscapeHtml(str) {
  return String(str === undefined || str === null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatKindLabel(kind) {
  if (kind === 'spell') return 'Spell';
  if (kind === 'prayer') return 'Prayer';
  if (kind === 'technique') return 'Technique';
  if (kind === 'power') return 'Power';
  return 'Skill';
}

function formatTargetingLabel(tgt) {
  if (!tgt) return 'Self';
  if (tgt.mode === 'self') return 'Self';
  const rng = typeof tgt.range === 'number' && tgt.range > 0 ? ('Rng ' + Math.round(tgt.range)) : 'Adj';
  if (tgt.mode === 'manual_enemy') return 'Target Enemy (' + rng + ')';
  if (tgt.mode === 'auto_enemy') return 'Auto Enemy (' + rng + ')';
  if (tgt.mode === 'auto_area') return 'Area (' + rng + ')';
  if (tgt.mode === 'manual_location') {
    const rad = tgt.radius > 0 ? (' • ' + (tgt.radius * 2 + 1) + 'x' + (tgt.radius * 2 + 1)) : '';
    return 'Target Tile (' + rng + rad + ')';
  }
  if (tgt.mode === 'directional') return 'Line (' + rng + ')';
  return rng;
}

function formatUnavailableReason(reason, cdRem, cdSec) {
  if (!reason) return 'Ready';
  if (reason === 'no_mp') return 'Insufficient MP';
  if (reason === 'on_cooldown') return cdSec > 0 ? ('Cooldown (' + cdSec + 's)') : ('Cooldown (' + cdRem + 't)');
  if (reason === 'silenced') return 'Silenced';
  if (reason === 'requires_ranged_weapon') return 'Requires Ranged Weapon';
  if (reason === 'already_casting') return 'Channeling Another Cast';
  if (reason === 'invalid_context') return 'Not Usable in This Context';
  if (reason === 'not_active_ability') return 'Reactive / Passive';
  return String(reason).replace(/_/g, ' ');
}

function buildAuthoritativeEffectEstimate(actor, def) {
  if (!actor || !def || !Array.isArray(def.effects)) return '';
  const parts = [];
  for (let i = 0; i < def.effects.length; i++) {
    const eff = def.effects[i];
    if (!eff) continue;
    if (eff.type === 'damage') {
      const est = computeAbilityDamage(actor, eff, null, 1.0);
      parts.push('~' + est.raw + ' ' + est.damageType + ' dmg');
    } else if (eff.type === 'heal') {
      const hAmt = computeAbilityHealAmount(actor, eff);
      parts.push('~' + hAmt + ' HP heal');
    } else if (eff.type === 'shield') {
      const sAmt = computeAbilityShieldAmount(actor, eff);
      parts.push('~' + sAmt + ' Shield');
    }
  }
  return parts.join(' • ');
}

export function buildHeroSpellbookEntries(hero, opts) {
  if (!hero) return [];
  normalizeActorAbilityState(hero);
  const currentContext = (opts && opts.context) ? opts.context : 'tactical_dungeon';
  const nowSimTimeMs = (opts && typeof opts.nowSimTimeMs === 'number') ? opts.nowSimTimeMs : 0;
  const quickSlots = getHeroQuickSlots(hero, currentContext);
  const slotMap = {};
  for (let s = 0; s < quickSlots.length; s++) {
    if (quickSlots[s] && quickSlots[s].abilityId) {
      slotMap[quickSlots[s].abilityId] = quickSlots[s].slotIndex;
    }
  }

  const allIds = getGrantedAbilityIds(hero);
  const entries = [];
  for (let i = 0; i < allIds.length; i++) {
    const id = allIds[i];
    const def = getAbilityDefinition(id);
    if (!def) continue;

    const sources = getGrantedAbilitySources(hero, id);
    const contexts = Array.isArray(def.contexts) ? def.contexts.slice() : ['tactical_dungeon'];
    const inCurrentContext = contexts.indexOf(currentContext) !== -1;
    const costInfo = getEffectiveAbilityCost(hero, def);
    const cdTurn = getAbilityCooldownRemaining(hero, id);
    const cdMs = getStrategicAbilityCooldownRemainingMs(hero, id, nowSimTimeMs);
    const cdSec = Math.ceil(cdMs / 1000);

    let usableNow = false;
    let reason = null;
    if (def.activation !== 'active') {
      usableNow = false;
      reason = 'not_active_ability';
    } else if (!inCurrentContext) {
      usableNow = false;
      reason = 'invalid_context';
    } else if (currentContext === 'overworld') {
      usableNow = cdMs <= 0;
      reason = usableNow ? null : 'on_cooldown';
    } else {
      const val = validateAbilityActivation(hero, def, { context: currentContext });
      usableNow = Boolean(val.ok);
      reason = val.ok ? null : val.reason;
    }

    entries.push({
      id: id,
      name: def.name,
      icon: def.icon || '✦',
      kind: def.kind,
      kindLabel: formatKindLabel(def.kind),
      domain: def.domain,
      activation: def.activation,
      timing: def.timing,
      windupTurns: def.windupTurns || 0,
      sources: sources,
      contexts: contexts,
      inCurrentContext: inCurrentContext,
      effectiveMp: costInfo.mp,
      baseMp: costInfo.baseMp,
      chilledPenalty: costInfo.chilledPenalty,
      cooldownTurns: costInfo.cooldown,
      cooldownRemainingTurns: cdTurn,
      strategicCooldownSec: def.strategicCooldownMs ? Math.ceil(def.strategicCooldownMs / 1000) : 0,
      cooldownRemainingSec: cdSec,
      targetingLabel: formatTargetingLabel(def.targeting),
      requiresRangedWeapon: Boolean(def.requiresRangedWeapon),
      estimateText: buildAuthoritativeEffectEstimate(hero, def),
      desc: def.desc || '',
      usableNow: usableNow,
      unavailableReason: reason,
      statusLabel: formatUnavailableReason(reason, cdTurn, cdSec),
      assignedSlotIndex: slotMap[id] !== undefined ? slotMap[id] : -1
    });
  }
  // Stable deterministic ordering independent of quick-slot assignments, casting, or cooldowns
  entries.sort(function(a, b) {
    const na = String(a.name || '').toLowerCase();
    const nb = String(b.name || '').toLowerCase();
    if (na < nb) return -1;
    if (na > nb) return 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
  return entries;
}

export function renderHeroSpellbookHtml(hero, opts) {
  if (!hero) {
    return '<div class="text-xs text-[#64748b] p-2">No hero selected.</div>';
  }
  const currentContext = (opts && opts.context) ? opts.context : 'tactical_dungeon';
  const contextFilter = (opts && opts.contextFilter) ? opts.contextFilter : 'all';
  const kindFilter = (opts && opts.kindFilter) ? opts.kindFilter : 'all';
  const actionPrefix = (opts && opts.actionPrefix) ? opts.actionPrefix : 'window.WargameApp';
  const allowCast = Boolean(opts && opts.allowCast);

  const entries = buildHeroSpellbookEntries(hero, opts);
  const quickSlots = getHeroQuickSlots(hero, currentContext);

  const filtered = entries.filter(function(e) {
    if (contextFilter !== 'all' && e.contexts.indexOf(contextFilter) === -1) return false;
    if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
    return true;
  });

  // 1. Configurable Quick-Access Slot Strip
  const slotCards = quickSlots.map(function(sl) {
    const def = sl.abilityId ? getAbilityDefinition(sl.abilityId) : null;
    const isMissing = Boolean(sl.abilityId && (!sl.granted || !sl.availableInContext));
    const missingLabel = !sl.granted ? 'No Access' : (!sl.availableInContext ? 'Wrong Context' : '');
    return (
      '<div class="p-1.5 rounded bg-[#080b11] border ' + (isMissing ? 'border-[#f87171]/60 opacity-75' : 'border-[#283347]') + ' flex flex-col justify-between gap-1 text-[10px] font-mono">' +
        '<div class="flex items-center justify-between gap-1">' +
          '<span class="text-[#fbbf24] font-bold">[' + sl.hotkey + '] Slot ' + (sl.slotIndex + 1) + '</span>' +
          (sl.abilityId
            ? '<div class="flex items-center gap-0.5">' +
                (sl.slotIndex > 0 ? '<button type="button" onclick="' + actionPrefix + '.handleSwapQuickSlots(\'' + currentContext + '\',' + sl.slotIndex + ',' + (sl.slotIndex - 1) + ')" class="px-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#94a3b8] cursor-pointer" title="Move Left">◀</button>' : '') +
                (sl.slotIndex < QUICK_SLOT_COUNT - 1 ? '<button type="button" onclick="' + actionPrefix + '.handleSwapQuickSlots(\'' + currentContext + '\',' + sl.slotIndex + ',' + (sl.slotIndex + 1) + ')" class="px-1 rounded bg-[#1a2232] hover:bg-[#283347] text-[#94a3b8] cursor-pointer" title="Move Right">▶</button>' : '') +
                '<button type="button" onclick="' + actionPrefix + '.handleClearQuickSlot(\'' + currentContext + '\',' + sl.slotIndex + ')" class="px-1 rounded bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] cursor-pointer" title="Clear Slot">✕</button>' +
              '</div>'
            : '') +
        '</div>' +
        '<div class="truncate ' + (def ? (isMissing ? 'text-[#94a3b8] line-through' : 'text-[#e6edf3] font-bold') : 'text-[#64748b] italic') + '">' +
          (def ? (def.icon + ' ' + sbEscapeHtml(def.name)) : 'Empty Slot') +
        '</div>' +
        (isMissing ? '<div class="text-[9px] text-[#f87171]">' + missingLabel + '</div>' : '') +
      '</div>'
    );
  }).join('');

  // 2. Context & Kind Filter Controls
  const ctxBtns = [
    { id: 'all', label: 'All Contexts' },
    { id: 'tactical_dungeon', label: 'Tactical' },
    { id: 'overworld', label: 'Overworld' }
  ].map(function(b) {
    const active = contextFilter === b.id;
    return '<button type="button" onclick="' + actionPrefix + '.handleSpellbookFilter(\'' + b.id + '\',\'' + kindFilter + '\')" class="px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ' +
      (active ? 'bg-[#60a5fa]/20 border-[#60a5fa] text-[#93c5fd] font-bold' : 'bg-[#0b111e] border-[#283347] text-[#94a3b8] hover:text-[#e6edf3]') + '">' + b.label + '</button>';
  }).join('');

  const kindBtns = [
    { id: 'all', label: 'All Kinds' },
    { id: 'spell', label: 'Spells' },
    { id: 'prayer', label: 'Prayers' },
    { id: 'technique', label: 'Techniques' },
    { id: 'skill', label: 'Skills' }
  ].map(function(b) {
    const active = kindFilter === b.id;
    return '<button type="button" onclick="' + actionPrefix + '.handleSpellbookFilter(\'' + contextFilter + '\',\'' + b.id + '\')" class="px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ' +
      (active ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#d8b4fe] font-bold' : 'bg-[#0b111e] border-[#283347] text-[#94a3b8] hover:text-[#e6edf3]') + '">' + b.label + '</button>';
  }).join('');

  // 3. Full Known Entries List
  const rowsHtml = filtered.length === 0
    ? '<div class="text-[11px] text-[#64748b] py-2">No known spells, prayers, or skills match the selected filter.</div>'
    : filtered.map(function(e) {
      const costText = e.effectiveMp > 0
        ? (e.effectiveMp + ' MP' + (e.chilledPenalty > 0 ? ' (Chilled +2)' : ''))
        : (e.cooldownTurns > 0 ? (e.cooldownTurns + 't CD') : (e.strategicCooldownSec > 0 ? (e.strategicCooldownSec + 's CD') : 'Free'));
      const ctxTags = e.contexts.map(function(c) {
        return '<span class="px-1 py-0.5 rounded bg-[#0f172a] border border-[#334155] text-[9px] text-[#94a3b8]">' + (c === 'overworld' ? 'Overworld' : 'Tactical') + '</span>';
      }).join(' ');
      const srcTags = e.sources.map(function(s) {
        return '<span class="px-1 py-0.5 rounded bg-[#1e293b] text-[9px] text-[#cbd5e1] uppercase">' + sbEscapeHtml(s) + '</span>';
      }).join(' ');
      const assignBtns = (e.activation === 'active' && e.inCurrentContext)
        ? [0, 1, 2, 3].map(function(si) {
          const isHere = e.assignedSlotIndex === si;
          return '<button type="button" onclick="' + actionPrefix + '.handleAssignQuickSlot(\'' + currentContext + '\',' + si + ',\'' + e.id + '\')" class="px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer ' +
            (isHere ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24] font-bold' : 'bg-[#1a2232] hover:bg-[#283347] border-[#334155] text-[#cbd5e1]') + '">' +
            (isHere ? ('★S' + (si + 1)) : ('S' + (si + 1))) + '</button>';
        }).join('')
        : '';
      const castBtn = (allowCast && e.activation === 'active' && e.inCurrentContext)
        ? '<button type="button" onclick="' + actionPrefix + '.handleSpellbookCast(\'' + e.id + '\',\'' + currentContext + '\')" ' + (!e.usableNow ? 'disabled' : '') + ' class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ' +
          (e.usableNow ? 'bg-[#34d399]/20 hover:bg-[#34d399]/30 border-[#34d399]/60 text-[#34d399] cursor-pointer' : 'bg-[#0f141e] border-[#283347] text-[#64748b] cursor-not-allowed') + '">Use</button>'
        : '';

      return (
        '<div class="p-2 rounded bg-[#080b11] border ' + (e.usableNow ? 'border-[#283347]' : 'border-[#1e293b] opacity-85') + ' space-y-1">' +
          '<div class="flex flex-wrap items-center justify-between gap-1">' +
            '<div class="flex items-center gap-1.5">' +
              '<span class="text-sm">' + e.icon + '</span>' +
              '<strong class="text-xs text-[#e6edf3]">' + sbEscapeHtml(e.name) + '</strong>' +
              '<span class="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-[#1a2232] text-[#60a5fa]">' + sbEscapeHtml(e.kindLabel) + '</span>' +
              srcTags +
            '</div>' +
            '<div class="flex items-center gap-1.5 text-[10px] font-mono">' +
              '<span class="text-[#fbbf24]">' + sbEscapeHtml(costText) + '</span>' +
              '<span class="' + (e.usableNow ? 'text-[#34d399]' : 'text-[#f87171]') + '">' + sbEscapeHtml(e.statusLabel) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="text-[11px] text-[#94a3b8]">' + sbEscapeHtml(e.desc) + '</div>' +
          '<div class="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#cbd5e1]">' +
            '<div class="flex flex-wrap items-center gap-1.5">' +
              '<span>' + sbEscapeHtml(e.targetingLabel) + '</span>' +
              (e.estimateText ? ('<span class="text-[#34d399]">• ' + sbEscapeHtml(e.estimateText) + '</span>') : '') +
              (e.requiresRangedWeapon ? '<span class="text-[#fb923c]">• Needs Ranged Weapon</span>' : '') +
              ctxTags +
            '</div>' +
            '<div class="flex items-center gap-1">' + assignBtns + castBtn + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

  return (
    '<div class="space-y-2.5">' +
      '<div class="space-y-1">' +
        '<div class="text-[10px] font-mono uppercase tracking-wider text-[#fbbf24]">Quick-Access Slots (' + (currentContext === 'overworld' ? 'Overworld' : 'Tactical') + ')</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">' + slotCards + '</div>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-1 pt-1 border-t border-[#283347]/70">' + ctxBtns + ' <span class="text-[#334155]">|</span> ' + kindBtns + '</div>' +
      '<div class="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">' + rowsHtml + '</div>' +
    '</div>'
  );
}
