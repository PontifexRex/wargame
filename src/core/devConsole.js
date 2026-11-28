// Shared Developer Console Engine & Control Panel State (HR-15)
// Works consistently across Wargame (Overworld/City) and Integrated Dungeon contexts.
// No arbitrary JS execution or eval; all mutations route through canonical game services.

import { CLASSES } from '../data/classes.js';
import { MONSTER_ARCHETYPES, BOSS_ARCHETYPES } from '../data/monsters.js';
import { SHOP_ITEMS, normalizeEquipmentItem } from '../data/items.js';
import { ABILITIES, ABILITY_IDS, getAbilityDefinition } from '../data/abilities.js';
import {
  normalizeActorAbilityState,
  getGrantedAbilityIds,
  getGrantedAbilitySources,
  grantAbilityAccess,
  revokeAbilityAccess,
  getAbilityCooldownRemaining,
  resetActorAbilityCooldowns
} from './abilityEngine.js';
import { computeHeroDerivedStats, formatAttributeDisplay, normalizeHeroBonusStats } from './heroStats.js';
import { normalizeHeroKnowledge } from './knowledge.js';
import { COMMAND_TYPES } from '../wargame/constants.js';
import { getPrimaryCity, getSelectedOverworldUnit, refreshHeroDerivedStats } from '../wargame/engine/state.js';
import { isOverworldTilePassable } from '../wargame/engine/pathfinding.js';
import { ensureDungeonFloorHydrated, nextItemUid, recomputeHeroDerivedStats } from '../engine/state.js';
import { gainExperience, equipItem, applyStatusEffect } from '../engine/actions.js';
import { getSkillTargetingInfo } from '../engine/combat.js';
import { spawnEntity, setHeroLevel, fullHeal, gotoFloor, revealMap, toggleGodMode } from '../engine/dev.js';

const MAX_CONSOLE_OUTPUT_LINES = 80;
const MAX_CONSOLE_HISTORY = 40;

export const DEV_CONSOLE_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'heroes', label: 'Heroes', icon: '🛡️' },
  { id: 'progression', label: 'Progression', icon: '✨' },
  { id: 'combat', label: 'Combat / Monsters', icon: '⚔️' },
  { id: 'dungeon', label: 'Dungeon', icon: '🏰' },
  { id: 'items', label: 'Items', icon: '🎒' },
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'commands', label: 'Commands', icon: '💻' },
  { id: 'help', label: 'Help', icon: '❓' }
];

const HELP_CATEGORY_ORDER = [
  'Inspection & Navigation',
  'Heroes & Progression',
  'Combat & Spawning',
  'Dungeon Controls',
  'Items & Resources',
  'Console Utilities'
];

// Parses a command line into { verb, args, raw } supporting single & double quoted strings.
export function parseConsoleCommandLine(input) {
  const raw = String(input || '').trim();
  if (!raw) return { verb: '', args: [], raw: '' };

  const tokens = [];
  let cur = '';
  let quoteChar = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (quoteChar) {
      if (ch === quoteChar) {
        quoteChar = null;
      } else {
        cur += ch;
      }
    } else if (ch === '"' || ch === '\'') {
      quoteChar = ch;
    } else if (/\s/.test(ch)) {
      if (cur.length > 0) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) tokens.push(cur);
  if (tokens.length === 0) return { verb: '', args: [], raw: raw };

  return {
    verb: tokens[0].toLowerCase(),
    args: tokens.slice(1),
    raw: raw
  };
}

function formatHeroSummaryLines(hero, isDungeon) {
  if (!hero) return ['No hero selected or active.'];
  const derived = computeHeroDerivedStats(hero);
  const attrs = derived ? derived.attributes : { str: 0, dex: 0, int: 0, vit: 0, spi: 0 };
  const kn = normalizeHeroKnowledge(hero.knowledge);
  const eq = hero.equipment || {};
  const eqList = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe']
    .map(function(sl) { return sl + ':' + (eq[sl] ? eq[sl].name : '—'); })
    .join(', ');
  const cls = (hero.classId && CLASSES[hero.classId]) ? CLASSES[hero.classId] : null;
  const lines = [
    'Hero: ' + (hero.name || 'Unnamed') + ' [' + (hero.id || 'no_id') + '] • Class: ' + (cls ? cls.name : (hero.classId || 'unknown')) + ' • Lv ' + (hero.level || 1) + ' (XP ' + (hero.xp || 0) + '/' + (hero.maxXp || 60) + ')',
    'Attrs (display/internal): STR ' + formatAttributeDisplay(attrs.str) + '(' + attrs.str + ') DEX ' + formatAttributeDisplay(attrs.dex) + '(' + attrs.dex + ') INT ' + formatAttributeDisplay(attrs.int) + '(' + attrs.int + ') VIT ' + formatAttributeDisplay(attrs.vit) + '(' + attrs.vit + ') SPI ' + formatAttributeDisplay(attrs.spi) + '(' + attrs.spi + ')',
    'Derived: HP ' + (isDungeon ? ((hero.hp || 0) + '/' + (hero.maxHp || (derived ? derived.maxHp : 0))) : (derived ? derived.maxHp : 0)) +
      ' • MP ' + (isDungeon ? ((hero.mp || 0) + '/' + (hero.maxMp || (derived ? derived.maxMp : 0))) : (derived ? derived.maxMp : 0)) +
      ' • ATK ' + (derived ? derived.atk : 0) + ' • MAG ' + (derived ? derived.magicPower : 0) + ' • DEF ' + (derived ? derived.def : 0) +
      ' • CRIT ' + (derived ? derived.crit : 0) + '% • DODGE ' + (derived ? derived.dodge : 0) + '%',
    'Points: StatPts=' + (hero.statPoints || 0) + ' TalentPts=' + (hero.talentPoints || 0) + ' • DungeonEligible=' + (hero.canEnterDungeon !== false),
    'Knowledge: monster=' + kn.monster_knowledge + ' item=' + kn.object_item_knowledge + ' flora=' + kn.flora_knowledge + ' fauna=' + kn.fauna_knowledge,
    'Equip: ' + eqList
  ];
  if (cls) {
    lines.push('Skill: ' + cls.skillName + ' (' + cls.skillCost + ' MP, Rng ' + (cls.skillRange || 1) + ') — ' + cls.skillDesc);
  }
  return lines;
}

export function createDevConsoleController(options) {
  const opts = options || {};
  const outputLog = [];
  const commandHistory = [];
  let historyCursor = -1;
  let isOpen = false;
  let activeTab = 'overview';
  let selectedHeroId = null;
  let helpFilter = '';
  let lastFeedback = null;

  function getContext() {
    if (typeof opts.getContext === 'function') return opts.getContext();
    return 'strategy';
  }

  function getSimHost() {
    return opts.simHost || null;
  }

  function getDungeonState() {
    return opts.dungeonState || null;
  }

  function pushOutput(text, tone) {
    const lines = String(text || '').split('\n');
    for (let i = 0; i < lines.length; i++) {
      outputLog.push({ text: lines[i], tone: tone || 'info' });
    }
    while (outputLog.length > MAX_CONSOLE_OUTPUT_LINES) {
      outputLog.shift();
    }
  }

  function recordFeedback(res, label) {
    const ok = Boolean(res && res.ok);
    const text = (res && res.text) ? String(res.text) : (ok ? 'Done.' : 'Action failed.');
    lastFeedback = { ok: ok, text: text };
    if (label) {
      pushOutput('[UI] ' + label + ' -> ' + text, ok ? 'ok' : 'err');
    }
    return res;
  }

  function resolveStrategyHero(simHost, heroIdArg) {
    const heroes = (simHost && simHost.state && simHost.state.world && Array.isArray(simHost.state.world.heroes))
      ? simHost.state.world.heroes
      : [];
    const targetId = heroIdArg || selectedHeroId;
    if (targetId) {
      const match = heroes.find(function(h) { return h && h.id === targetId; });
      if (match) return match;
    }
    const selUnit = simHost ? getSelectedOverworldUnit(simHost.state) : null;
    if (selUnit && selUnit.leaderHeroId) {
      const h = heroes.find(function(it) { return it && it.id === selUnit.leaderHeroId; });
      if (h) return h;
    }
    return heroes[0] || null;
  }

  function resolveActiveHero(heroIdArg) {
    if (getContext() === 'dungeon') {
      const dng = getDungeonState();
      return (dng && dng.hero) ? dng.hero : null;
    }
    return resolveStrategyHero(getSimHost(), heroIdArg || null);
  }

  function notifyMutated() {
    if (typeof opts.onStateMutated === 'function') {
      opts.onStateMutated();
    }
  }

  // Canonical direct-control helpers (shared by visual panel controls and commands)
  function adjustHeroAttribute(attrKey, delta, explicitBonusValue) {
    const key = String(attrKey || '').toLowerCase();
    if (key !== 'str' && key !== 'dex' && key !== 'int' && key !== 'vit' && key !== 'spi') {
      return recordFeedback({ ok: false, text: 'Invalid attribute "' + attrKey + '". Expected str, dex, int, vit, or spi.' }, 'Attr');
    }
    const ctx = getContext();
    const hero = resolveActiveHero(null);
    if (!hero) {
      return recordFeedback({ ok: false, text: 'No active hero available.' }, 'Attr');
    }
    hero.bonusStats = normalizeHeroBonusStats(hero.bonusStats);
    const prevBonus = hero.bonusStats[key] || 0;
    let nextBonus;
    if (explicitBonusValue !== undefined && explicitBonusValue !== null && explicitBonusValue !== '') {
      const parsed = Number(explicitBonusValue);
      if (!isFinite(parsed)) return recordFeedback({ ok: false, text: 'Invalid attribute bonus value.' }, 'Attr');
      nextBonus = Math.max(0, Math.min(999, Math.round(parsed * 100) / 100));
    } else {
      const d = Number(delta);
      if (!isFinite(d)) return recordFeedback({ ok: false, text: 'Invalid attribute delta.' }, 'Attr');
      nextBonus = Math.max(0, Math.min(999, Math.round((prevBonus + d) * 100) / 100));
    }
    hero.bonusStats[key] = nextBonus;
    if (ctx === 'dungeon') {
      recomputeHeroDerivedStats(false, getDungeonState());
    } else {
      refreshHeroDerivedStats(hero);
    }
    notifyMutated();
    const derived = computeHeroDerivedStats(hero);
    const totalVal = derived && derived.attributes ? derived.attributes[key] : nextBonus;
    return recordFeedback({
      ok: true,
      attrKey: key,
      bonus: nextBonus,
      total: totalVal,
      display: formatAttributeDisplay(totalVal),
      text: hero.name + ' ' + key.toUpperCase() + ' bonus ' + prevBonus + ' -> ' + nextBonus + ' (Total ' + formatAttributeDisplay(totalVal) + ' [' + totalVal + ']).'
    }, 'Set ' + key.toUpperCase());
  }

  function adjustHeroVitals(kind, delta, explicitValue) {
    const k = String(kind || '').toLowerCase();
    if (k !== 'hp' && k !== 'mp') {
      return recordFeedback({ ok: false, text: 'Invalid vital kind (expected hp or mp).' }, 'Vitals');
    }
    if (getContext() !== 'dungeon') {
      return recordFeedback({ ok: false, text: 'Direct HP/MP adjustment is active in Dungeon context.' }, 'Vitals');
    }
    const dng = getDungeonState();
    if (!dng || !dng.hero) return recordFeedback({ ok: false, text: 'No active dungeon hero.' }, 'Vitals');
    const h = dng.hero;
    const maxVal = k === 'hp' ? (h.maxHp || 1) : (h.maxMp || 0);
    const minVal = k === 'hp' ? 1 : 0;
    const prevVal = h[k] || 0;
    let nextVal;
    if (explicitValue !== undefined && explicitValue !== null && explicitValue !== '') {
      const parsed = Math.round(Number(explicitValue));
      if (!isFinite(parsed)) return recordFeedback({ ok: false, text: 'Invalid ' + k.toUpperCase() + ' value.' }, 'Vitals');
      nextVal = Math.max(minVal, Math.min(maxVal, parsed));
    } else {
      const d = Math.round(Number(delta));
      if (!isFinite(d)) return recordFeedback({ ok: false, text: 'Invalid ' + k.toUpperCase() + ' delta.' }, 'Vitals');
      nextVal = Math.max(minVal, Math.min(maxVal, prevVal + d));
    }
    h[k] = nextVal;
    notifyMutated();
    return recordFeedback({
      ok: true,
      kind: k,
      value: nextVal,
      max: maxVal,
      text: h.name + ' ' + k.toUpperCase() + ' ' + prevVal + ' -> ' + nextVal + '/' + maxVal + '.'
    }, 'Adjust ' + k.toUpperCase());
  }

  function adjustHeroXp(delta, explicitValue) {
    const ctx = getContext();
    if (explicitValue !== undefined && explicitValue !== null && explicitValue !== '') {
      const parsed = Math.round(Number(explicitValue));
      if (!isFinite(parsed) || parsed < 0) {
        return recordFeedback({ ok: false, text: 'XP value must be a non-negative number.' }, 'Set XP');
      }
      const h = resolveActiveHero(null);
      if (!h) return recordFeedback({ ok: false, text: 'No active hero.' }, 'Set XP');
      const prevXp = h.xp || 0;
      const cap = Math.max(0, (h.maxXp || 60) - 1);
      h.xp = Math.min(cap, parsed);
      notifyMutated();
      return recordFeedback({
        ok: true,
        xp: h.xp,
        maxXp: h.maxXp || 60,
        text: h.name + ' XP set ' + prevXp + ' -> ' + h.xp + '/' + (h.maxXp || 60) + '.'
      }, 'Set XP');
    }
    const amt = Math.round(Number(delta));
    if (!isFinite(amt) || amt <= 0) {
      return recordFeedback({ ok: false, text: 'XP increment must be a positive number.' }, 'Add XP');
    }
    if (ctx === 'dungeon') {
      const dng = getDungeonState();
      if (!dng || !dng.hero) return recordFeedback({ ok: false, text: 'No active dungeon hero.' }, 'Add XP');
      const prevLvl = dng.hero.level || 1;
      const prevXp = dng.hero.xp || 0;
      const res = gainExperience(amt, dng);
      notifyMutated();
      return recordFeedback({
        ok: true,
        leveledUp: Boolean(res && res.leveledUp),
        levelsGained: (res && res.levelsGained) || 0,
        text: 'Granted +' + amt + ' XP to ' + dng.hero.name + ' (Lv ' + prevLvl + ' XP ' + prevXp + ' -> Lv ' + dng.hero.level + ' XP ' + dng.hero.xp + '/' + dng.hero.maxXp + (res && res.leveledUp ? ', +' + res.levelsGained + ' Level!' : '') + ').'
      }, 'Add XP');
    }
    const h = resolveStrategyHero(getSimHost(), null);
    if (!h) return recordFeedback({ ok: false, text: 'No active strategy hero.' }, 'Add XP');
    const prevXpS = h.xp || 0;
    h.xp = prevXpS + amt;
    notifyMutated();
    return recordFeedback({
      ok: true,
      xp: h.xp,
      text: 'Granted +' + amt + ' XP to ' + h.name + ' (' + prevXpS + ' -> ' + h.xp + '/' + (h.maxXp || 60) + ').'
    }, 'Add XP');
  }

  function adjustHeroLevel(delta, explicitLevel) {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero.' }, 'Set Level');
    const curLvl = hero.level || 1;
    const rawTarget = (explicitLevel !== undefined && explicitLevel !== null && explicitLevel !== '')
      ? Number(explicitLevel)
      : (curLvl + Number(delta || 0));
    if (!isFinite(rawTarget)) return recordFeedback({ ok: false, text: 'Invalid target level.' }, 'Set Level');
    const targetLvl = Math.max(1, Math.min(100, Math.round(rawTarget)));

    if (getContext() === 'dungeon') {
      const dng = getDungeonState();
      const res = setHeroLevel(targetLvl, dng);
      if (!res || !res.ok) return recordFeedback({ ok: false, text: 'Failed to set level: ' + (res && res.reason) }, 'Set Level');
      notifyMutated();
      return recordFeedback({
        ok: true,
        level: res.level,
        maxHp: res.maxHp,
        maxMp: res.maxMp,
        text: hero.name + ' level ' + curLvl + ' -> ' + res.level + ' (MaxHP ' + res.maxHp + ', MaxMP ' + res.maxMp + ', StatPts ' + res.statPoints + ', TalentPts ' + res.talentPoints + ').'
      }, 'Set Level');
    }
    hero.level = targetLvl;
    let newMaxXp = 60;
    for (let l = 2; l <= targetLvl; l++) newMaxXp = Math.round(newMaxXp * 1.4);
    hero.maxXp = newMaxXp;
    const totalEarned = (targetLvl - 1) * 2;
    const b = normalizeHeroBonusStats(hero.bonusStats);
    const spent = Math.floor((b.str || 0) + (b.dex || 0) + (b.int || 0) + (b.vit || 0) + (b.spi || 0));
    hero.statPoints = Math.max(0, totalEarned - spent);
    refreshHeroDerivedStats(hero);
    notifyMutated();
    return recordFeedback({
      ok: true,
      level: hero.level,
      text: hero.name + ' level ' + curLvl + ' -> ' + hero.level + ' (MaxHP ' + hero.stats.maxHp + ', ATK ' + hero.stats.atk + ', DEF ' + hero.stats.def + ').'
    }, 'Set Level');
  }

  function adjustHeroStatPoints(delta, explicitValue) {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero.' }, 'Stat Points');
    const prev = hero.statPoints || 0;
    const rawNext = (explicitValue !== undefined && explicitValue !== null && explicitValue !== '')
      ? Number(explicitValue)
      : (prev + Number(delta || 0));
    if (!isFinite(rawNext)) return recordFeedback({ ok: false, text: 'Invalid stat points value.' }, 'Stat Points');
    hero.statPoints = Math.max(0, Math.min(500, Math.round(rawNext)));
    notifyMutated();
    return recordFeedback({
      ok: true,
      statPoints: hero.statPoints,
      text: hero.name + ' Stat Points ' + prev + ' -> ' + hero.statPoints + '.'
    }, 'Stat Points');
  }

  function toggleHeroGodMode() {
    if (getContext() !== 'dungeon') {
      return recordFeedback({ ok: false, text: 'God Mode toggle is available while inside a Dungeon.' }, 'God Mode');
    }
    const res = toggleGodMode(getDungeonState());
    if (!res || !res.ok) return recordFeedback({ ok: false, text: 'Failed to toggle God Mode.' }, 'God Mode');
    notifyMutated();
    return recordFeedback({
      ok: true,
      godMode: res.godMode,
      text: 'God Mode ' + (res.godMode ? 'ACTIVATED' : 'DEACTIVATED') + '.'
    }, 'God Mode');
  }

  function spawnObject(entityType, subId, xArg, yArg) {
    const ctx = getContext();
    if (ctx !== 'dungeon') {
      if (entityType === 'monster' || entityType === 'boss') {
        return recordFeedback(commands.spawn.run([subId || 'vault_crawler', xArg, yArg]), 'Spawn');
      }
      return recordFeedback({ ok: false, text: 'Spawning dungeon objects (' + entityType + ') requires Dungeon context.' }, 'Spawn');
    }
    const dng = getDungeonState();
    const hasExplicit = xArg !== null && xArg !== undefined && xArg !== '' && yArg !== null && yArg !== undefined && yArg !== '';
    const nx = hasExplicit ? Number(xArg) : null;
    const ny = hasExplicit ? Number(yArg) : null;
    if (hasExplicit && (!isFinite(nx) || !isFinite(ny))) {
      return recordFeedback({ ok: false, text: 'Invalid spawn coordinates.' }, 'Spawn');
    }
    const res = spawnEntity(entityType || 'monster', subId || 'vault_crawler', nx, ny, dng, hasExplicit ? { strictCoords: true } : null);
    if (!res || !res.ok) {
      return recordFeedback({ ok: false, text: 'Spawn failed: ' + ((res && res.reason) || 'unknown_error') }, 'Spawn');
    }
    notifyMutated();
    const label = (res.entity && (res.entity.name || res.entity.id)) || (subId || entityType);
    return recordFeedback({
      ok: true,
      entity: res.entity,
      x: res.x,
      y: res.y,
      text: 'Spawned ' + label + ' at (' + res.x + ', ' + res.y + ').'
    }, 'Spawn');
  }

  function triggerHeroSkill() {
    if (getContext() !== 'dungeon') {
      return recordFeedback({ ok: false, text: 'Class skills can be triggered while inside a Dungeon.' }, 'Trigger Skill');
    }
    if (typeof opts.onTriggerSkill !== 'function') {
      return recordFeedback({ ok: false, text: 'Skill trigger handler unavailable.' }, 'Trigger Skill');
    }
    const info = getSkillTargetingInfo(getDungeonState());
    if (!info || !info.canAfford) {
      return recordFeedback({ ok: false, text: 'Insufficient MP to cast class skill.' }, 'Trigger Skill');
    }
    if (!info.valid) {
      return recordFeedback({ ok: false, text: 'No valid skill target in range.' }, 'Trigger Skill');
    }
    opts.onTriggerSkill();
    return recordFeedback({ ok: true, text: 'Triggered active class skill.' }, 'Trigger Skill');
  }

  function setupCityForgeWorkflow() {
    const simHost = getSimHost();
    const city = simHost && simHost.state ? getPrimaryCity(simHost.state) : null;
    if (!city) {
      return recordFeedback({ ok: false, text: 'Found a city first before setting up Blacksmith & Star-Forge.' }, 'Setup Forge');
    }
    if (!city.buildings) city.buildings = {};
    if (!city.stockpile) city.stockpile = {};
    const needed = ['quarry', 'smeltery', 'blacksmith', 'lapidary'];
    const placed = [];
    for (let i = 0; i < needed.length; i++) {
      const bId = needed[i];
      if ((city.buildings[bId] || 0) >= 1) continue;
      city.buildings[bId] = 1;
      if (Array.isArray(city.plots)) {
        const hasPlot = city.plots.some(function(p) { return p && p.buildingId === bId; });
        if (!hasPlot) {
          const emptyPlot = city.plots.find(function(p) { return p && !p.buildingId && !p.underConstruction; });
          if (emptyPlot) {
            emptyPlot.buildingId = bId;
            emptyPlot.level = 1;
            emptyPlot.underConstruction = false;
          }
        }
      }
      placed.push(bId);
    }
    city.stockpile.ingots = Math.max(city.stockpile.ingots || 0, 20);
    city.stockpile.gold = Math.max(city.stockpile.gold || 0, 200);
    notifyMutated();
    return recordFeedback({
      ok: true,
      placed: placed,
      text: 'Blacksmith & Star-Forge ready in ' + city.name + ' (Ingots: ' + city.stockpile.ingots + ', Gold: ' + city.stockpile.gold + '). Open City view and click the Blacksmith plot to forge!'
    }, 'Setup Forge');
  }

  function adjustCityResource(resourceKey, delta, explicitValue) {
    const simHost = getSimHost();
    const city = simHost && simHost.state ? getPrimaryCity(simHost.state) : null;
    if (!city || !city.stockpile) {
      return recordFeedback({ ok: false, text: 'No founded city available yet.' }, 'Resource');
    }
    const validKeys = ['gold', 'wood', 'stone', 'food', 'water', 'ore', 'ingots'];
    const key = String(resourceKey || '').toLowerCase();
    if (validKeys.indexOf(key) === -1) {
      return recordFeedback({ ok: false, text: 'Unknown resource "' + resourceKey + '". Valid: ' + validKeys.join(', ') }, 'Resource');
    }
    const prev = Number(city.stockpile[key] || 0);
    const rawNext = (explicitValue !== undefined && explicitValue !== null && explicitValue !== '')
      ? Number(explicitValue)
      : (prev + Number(delta || 0));
    if (!isFinite(rawNext)) return recordFeedback({ ok: false, text: 'Invalid resource value.' }, 'Resource');
    const nextVal = Math.max(0, Math.min(9999999, Math.round(rawNext)));
    city.stockpile[key] = nextVal;
    notifyMutated();
    return recordFeedback({
      ok: true,
      resource: key,
      value: nextVal,
      text: city.name + ' ' + key.toUpperCase() + ': ' + prev + ' -> ' + nextVal + '.'
    }, 'Resource');
  }

  function grantShopItem(shopItemId) {
    const id = String(shopItemId || '');
    if (!id) return recordFeedback({ ok: false, text: 'Select an item to grant.' }, 'Grant Item');
    const tpl = SHOP_ITEMS.find(function(it) { return it.id === id; });
    if (!tpl) {
      return recordFeedback({ ok: false, text: 'Unknown item "' + id + '".' }, 'Grant Item');
    }
    if (getContext() === 'dungeon') {
      return recordFeedback(commands.grant.run([id]), 'Grant Item');
    }
    // Strategy context: grant gear directly into selected hero's bag so testing works in Overworld/City too
    const hero = resolveStrategyHero(getSimHost(), null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active strategy hero to receive item.' }, 'Grant Item');
    if (tpl.type === 'consumable') {
      if (!hero.consumables) hero.consumables = { potions: 0, recalls: 0 };
      if (tpl.id === 'buy_heal') hero.consumables.potions = (hero.consumables.potions || 0) + 1;
      else if (tpl.id === 'buy_recall') hero.consumables.recalls = (hero.consumables.recalls || 0) + 1;
      notifyMutated();
      return recordFeedback({ ok: true, text: 'Granted consumable "' + tpl.name + '" to ' + hero.name + '.' }, 'Grant Item');
    }
    const item = normalizeEquipmentItem(Object.assign({}, tpl, {
      uid: nextItemUid('dev_grant'),
      affixes: [],
      sockets: [],
      maxSockets: tpl.slot === 'pickaxe' ? 0 : 1
    }));
    if (!Array.isArray(hero.bagGear)) hero.bagGear = [];
    hero.bagGear.push(item);
    notifyMutated();
    return recordFeedback({
      ok: true,
      item: item,
      text: 'Granted "' + item.name + '" [' + item.uid + '] into ' + hero.name + '\'s pack.'
    }, 'Grant Item');
  }

  const commands = {
    help: {
      category: 'Console Utilities',
      usage: 'help [command]',
      params: [{ name: 'command', required: false, desc: 'Optional command name for detailed usage.' }],
      examples: ['help', 'help spawn'],
      aliases: [],
      contexts: ['any'],
      desc: 'List available commands or show usage for a specific command.',
      run: function(args) {
        if (args[0]) {
          const k = args[0].toLowerCase();
          const c = commands[k];
          if (!c) return { ok: false, text: 'Unknown command "' + k + '". Open the Help tab or type "help".' };
          return { ok: true, text: k + ' [' + c.contexts.join('/') + '] — ' + c.desc + '\nUsage: ' + c.usage + (c.examples && c.examples.length ? ('\nExamples: ' + c.examples.join(' | ')) : '') };
        }
        const names = Object.keys(commands).sort();
        const lines = ['Developer Commands (' + names.length + ') — Tip: open the Help tab for categorized search:'];
        for (let i = 0; i < names.length; i++) {
          const n = names[i];
          const c = commands[n];
          lines.push('  ' + c.usage + '  [' + c.contexts.join('/') + '] — ' + c.desc);
        }
        return { ok: true, text: lines.join('\n') };
      }
    },
    clear: {
      category: 'Console Utilities',
      usage: 'clear',
      params: [],
      examples: ['clear'],
      aliases: [],
      contexts: ['any'],
      desc: 'Clear command terminal output log.',
      run: function() {
        outputLog.length = 0;
        return { ok: true, text: 'Console cleared.', silentEcho: true };
      }
    },
    state: {
      category: 'Inspection & Navigation',
      usage: 'state',
      params: [],
      examples: ['state'],
      aliases: [],
      contexts: ['any'],
      desc: 'Inspect active context, world/city summary, and dungeon floor status.',
      run: function() {
        const ctx = getContext();
        const simHost = getSimHost();
        const dng = getDungeonState();
        const lines = ['Context: ' + ctx.toUpperCase()];
        if (simHost && simHost.state && simHost.state.world) {
          const w = simHost.state.world;
          const city = getPrimaryCity(simHost.state);
          const ow = w.overworld;
          const aliveHostiles = (ow && Array.isArray(ow.hostiles)) ? ow.hostiles.filter(function(h) { return h && h.alive; }).length : 0;
          lines.push('Campaign: ' + (w.worldName || w.id) + ' • Seed: ' + (w.seedCode || '—') + ' • SimTime: ' + Math.round(((w.clock && w.clock.simTimeMs) || 0) / 1000) + 's');
          lines.push('City: ' + (city ? (city.name + ' (' + city.x + ',' + city.y + ') Gold:' + (city.stockpile.gold || 0) + ' Food:' + (city.stockpile.food || 0)) : 'None'));
          lines.push('Heroes: ' + (w.heroes ? w.heroes.length : 0) + ' • Overworld Hostiles: ' + aliveHostiles);
        }
        if (dng && dng.dungeon) {
          const fl = ensureDungeonFloorHydrated(dng.dungeon, dng.dungeon.currentFloor);
          const monCount = (fl && Array.isArray(fl.monsters)) ? fl.monsters.filter(function(m) { return m && m.hp > 0; }).length : 0;
          lines.push('Dungeon: ' + (dng.dungeon.name || dng.activeDungeonId) + ' • Floor ' + (dng.dungeon.currentFloor || 1) + ' • Turn ' + (dng.turn || 0) + ' • Monsters: ' + monCount);
        }
        return { ok: true, text: lines.join('\n') };
      }
    },
    hero: {
      category: 'Inspection & Navigation',
      usage: 'hero [heroId]',
      params: [{ name: 'heroId', required: false, desc: 'Optional hero ID in strategy mode.' }],
      examples: ['hero', 'hero hero_1'],
      aliases: [],
      contexts: ['any'],
      desc: 'Inspect active dungeon hero or selected/specified strategy hero.',
      run: function(args) {
        const ctx = getContext();
        if (ctx === 'dungeon') {
          const dng = getDungeonState();
          if (!dng || !dng.hero) return { ok: false, text: 'No active dungeon hero.' };
          return { ok: true, text: formatHeroSummaryLines(dng.hero, true).join('\n') };
        }
        const simHost = getSimHost();
        const h = resolveStrategyHero(simHost, args[0] || null);
        if (!h) return { ok: false, text: args[0] ? ('Hero not found: ' + args[0]) : 'No heroes in roster.' };
        return { ok: true, text: formatHeroSummaryLines(h, false).join('\n') };
      }
    },
    heroes: {
      category: 'Inspection & Navigation',
      usage: 'heroes',
      params: [],
      examples: ['heroes'],
      aliases: [],
      contexts: ['any'],
      desc: 'List all active heroes in the campaign roster.',
      run: function() {
        const simHost = getSimHost();
        const heroes = (simHost && simHost.state && simHost.state.world && Array.isArray(simHost.state.world.heroes))
          ? simHost.state.world.heroes
          : [];
        if (heroes.length === 0) return { ok: true, text: 'No heroes recruited yet.' };
        const lines = ['Active Heroes (' + heroes.length + '):'];
        for (let i = 0; i < heroes.length; i++) {
          const h = heroes[i];
          lines.push('  ' + h.id + ' — ' + h.name + ' (' + h.classId + ' Lv ' + (h.level || 1) + ', XP ' + (h.xp || 0) + '/' + (h.maxXp || 60) + ')');
        }
        return { ok: true, text: lines.join('\n') };
      }
    },
    skills: {
      category: 'Inspection & Navigation',
      usage: 'skills',
      params: [],
      examples: ['skills'],
      aliases: [],
      contexts: ['any'],
      desc: 'Inspect active hero class passive, active skill, cost, range, and readiness.',
      run: function() {
        const ctx = getContext();
        const dng = getDungeonState();
        const simHost = getSimHost();
        const h = ctx === 'dungeon' ? (dng && dng.hero) : resolveStrategyHero(simHost, null);
        if (!h) return { ok: false, text: 'No active hero to inspect.' };
        const cls = (h.classId && CLASSES[h.classId]) ? CLASSES[h.classId] : null;
        if (!cls) return { ok: false, text: 'Unknown class: ' + h.classId };
        const lines = [
          'Class: ' + cls.name + ' (' + cls.title + ')',
          'Passive: ' + cls.passiveName + ' — ' + cls.passiveDesc,
          'Active Skill: ' + cls.skillName + ' (' + cls.skillCost + ' MP, Range ' + (cls.skillRange || 1) + ') — ' + cls.skillDesc
        ];
        if (ctx === 'dungeon' && dng) {
          const info = getSkillTargetingInfo(dng);
          lines.push('Targeting Status: ' + (info.valid ? 'READY (' + info.targets.length + ' target(s))' : (info.canAfford ? 'No valid target in range' : 'Insufficient MP')));
        }
        return { ok: true, text: lines.join('\n') };
      }
    },
    archetypes: {
      category: 'Combat & Spawning',
      usage: 'archetypes',
      params: [],
      examples: ['archetypes'],
      aliases: [],
      contexts: ['any'],
      desc: 'List valid dungeon monster and boss archetype IDs for spawn.',
      run: function() {
        const reg = Object.keys(MONSTER_ARCHETYPES).join(', ');
        const bosses = Object.keys(BOSS_ARCHETYPES).join(', ');
        return { ok: true, text: 'Regular Monsters: ' + reg + '\nBosses: ' + bosses };
      }
    },
    monsters: {
      category: 'Combat & Spawning',
      usage: 'monsters',
      params: [],
      examples: ['monsters'],
      aliases: [],
      contexts: ['any'],
      desc: 'List active monsters on current dungeon floor or wandering hostiles on Overworld.',
      run: function() {
        const ctx = getContext();
        if (ctx === 'dungeon') {
          const dng = getDungeonState();
          const fl = dng && dng.dungeon ? ensureDungeonFloorHydrated(dng.dungeon, dng.dungeon.currentFloor) : null;
          const mons = (fl && Array.isArray(fl.monsters)) ? fl.monsters.filter(function(m) { return m && m.hp > 0; }) : [];
          if (mons.length === 0) return { ok: true, text: 'No living monsters on Floor ' + ((dng && dng.dungeon && dng.dungeon.currentFloor) || 1) + '.' };
          const lines = ['Dungeon Floor ' + dng.dungeon.currentFloor + ' Monsters (' + mons.length + '):'];
          for (let i = 0; i < Math.min(20, mons.length); i++) {
            const m = mons[i];
            lines.push('  ' + (m.uid || m.id) + ' — ' + m.name + ' (' + m.id + ') at (' + m.x + ',' + m.y + ') HP ' + m.hp + '/' + m.maxHp + ' ATK ' + m.atk + ' DEF ' + (m.def || 0));
          }
          if (mons.length > 20) lines.push('  ...and ' + (mons.length - 20) + ' more.');
          return { ok: true, text: lines.join('\n') };
        }
        const simHost = getSimHost();
        const ow = simHost && simHost.state && simHost.state.world ? simHost.state.world.overworld : null;
        const hostiles = (ow && Array.isArray(ow.hostiles)) ? ow.hostiles.filter(function(h) { return h && h.alive; }) : [];
        if (hostiles.length === 0) return { ok: true, text: 'No living Overworld wandering hostiles.' };
        const lines = ['Overworld Wandering Hostiles (' + hostiles.length + '):'];
        for (let i = 0; i < hostiles.length; i++) {
          const h = hostiles[i];
          lines.push('  ' + h.id + ' — ' + h.name + ' at (' + h.x + ',' + h.y + ') HP ' + h.hp + ' PWR ' + h.power);
        }
        return { ok: true, text: lines.join('\n') };
      }
    },
    recruit: {
      category: 'Heroes & Progression',
      usage: 'recruit <classId> ["Hero Name"]',
      params: [
        { name: 'classId', required: true, desc: 'Adventuring class ID (fighter, thief, mage, ranger, paladin).' },
        { name: 'Hero Name', required: false, desc: 'Optional custom name (quote if it has spaces).' }
      ],
      examples: ['recruit fighter', 'recruit mage "Lyra Star"'],
      aliases: [],
      contexts: ['strategy'],
      desc: 'Queue hero recruitment through canonical RECRUIT_HERO command.',
      run: function(args) {
        const simHost = getSimHost();
        if (!simHost) return { ok: false, text: 'SimHost unavailable.' };
        const classId = args[0] ? args[0].toLowerCase() : '';
        if (!classId) return { ok: false, text: 'Usage: recruit <classId> ["Hero Name"]' };
        const res = simHost.dispatch({
          type: COMMAND_TYPES.RECRUIT_HERO,
          payload: { classId: classId, heroName: args[1] || null }
        });
        if ((!res || !res.ok) && classId === 'scout' && CLASSES.scout && simHost.state && simHost.state.world) {
          // Safe Dev Console recruitment path for Scout while Rangers Lodge building is deferred (MG-01B §3)
          const w = simHost.state.world;
          const city = getPrimaryCity(simHost.state);
          const heroId = 'hero_scout_' + Date.now() + '_' + ((w.heroes && w.heroes.length) || 0);
          const sCls = CLASSES.scout;
          const startEq = {};
          const eqKeys = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
          for (let i = 0; i < eqKeys.length; i++) {
            const k = eqKeys[i];
            startEq[k] = sCls.starterGear[k] ? normalizeEquipmentItem(JSON.parse(JSON.stringify(sCls.starterGear[k]))) : null;
          }
          const newHero = {
            id: heroId,
            ownerPlayerId: (w.player && w.player.id) || 'player_1',
            classId: 'scout',
            name: args[1] || 'Frontier Scout',
            level: 1,
            xp: 0,
            maxXp: 60,
            statPoints: 0,
            talentPoints: 0,
            talentsAllocated: {},
            bonusStats: normalizeHeroBonusStats(null),
            knowledge: normalizeHeroKnowledge(null),
            equipment: startEq,
            bagGear: [],
            canEnterDungeon: true,
            statuses: []
          };
          normalizeActorAbilityState(newHero);
          refreshHeroDerivedStats(newHero);
          if (!Array.isArray(w.heroes)) w.heroes = [];
          w.heroes.push(newHero);
          if (w.overworld && Array.isArray(w.overworld.units)) {
            const sx = city ? city.x : Math.floor((w.overworld.width || 40) / 2);
            const sy = city ? city.y : Math.floor((w.overworld.height || 30) / 2);
            const unitId = 'unit_scout_' + Date.now() + '_' + w.overworld.units.length;
            w.overworld.units.push({
              id: unitId,
              unitType: 'hero_party',
              leaderHeroId: heroId,
              heroId: heroId,
              heroClassId: 'scout',
              name: newHero.name + ' (Scout)',
              shortName: newHero.name,
              x: sx,
              y: sy,
              hp: newHero.stats ? newHero.stats.maxHp : 94,
              maxHp: newHero.stats ? newHero.stats.maxHp : 94,
              vision: 7,
              visionRadius: 7,
              alive: true,
              canEnterDungeon: true,
              status: 'idle'
            });
            w.overworld.selectedUnitId = unitId;
          }
          selectedHeroId = heroId;
          notifyMutated();
          return { ok: true, text: 'Recruited Scout "' + newHero.name + '" via Dev Console (normal recruitment awaits Rangers Lodge).' };
        }
        if (!res || !res.ok) return { ok: false, text: 'Recruit failed: ' + ((res && (res.reason || res.error)) || 'rejected') };
        notifyMutated();
        const q = res.data && res.data.queueItem ? res.data.queueItem : null;
        return { ok: true, text: 'Queued recruitment for ' + (q ? (q.heroName + ' (' + q.className + ')') : classId) + '.' };
      }
    },
    select: {
      category: 'Heroes & Progression',
      usage: 'select <heroId>',
      params: [{ name: 'heroId', required: true, desc: 'ID of the hero whose Overworld party should be selected.' }],
      examples: ['select hero_1'],
      aliases: [],
      contexts: ['strategy'],
      desc: 'Select the Overworld party unit led by the given heroId.',
      run: function(args) {
        const simHost = getSimHost();
        if (!simHost || !simHost.state || !simHost.state.world) return { ok: false, text: 'No active campaign.' };
        const heroId = args[0];
        if (!heroId) return { ok: false, text: 'Usage: select <heroId>' };
        const ow = simHost.state.world.overworld;
        const unit = (ow && Array.isArray(ow.units))
          ? ow.units.find(function(u) { return u && u.alive && u.leaderHeroId === heroId; })
          : null;
        if (!unit) return { ok: false, text: 'No active Overworld party led by "' + heroId + '".' };
        ow.selectedUnitId = unit.id;
        selectedHeroId = heroId;
        notifyMutated();
        return { ok: true, text: 'Selected party ' + unit.id + ' (' + unit.name + ').' };
      }
    },
    retire: {
      category: 'Heroes & Progression',
      usage: 'retire <heroId> confirm',
      params: [
        { name: 'heroId', required: true, desc: 'ID of the hero to retire.' },
        { name: 'confirm', required: true, desc: 'Literal word "confirm" to approve destructive action.' }
      ],
      examples: ['retire hero_2 confirm'],
      aliases: [],
      contexts: ['strategy'],
      desc: 'Permanently retire a hero via canonical DISMISS_HERO (requires "confirm").',
      run: function(args) {
        const simHost = getSimHost();
        if (!simHost) return { ok: false, text: 'SimHost unavailable.' };
        const heroId = args[0];
        if (!heroId) return { ok: false, text: 'Usage: retire <heroId> confirm' };
        if (args[1] !== 'confirm') {
          return { ok: false, text: 'Destructive action: run "retire ' + heroId + ' confirm" to permanently retire this hero.' };
        }
        const res = simHost.dispatch({
          type: COMMAND_TYPES.DISMISS_HERO,
          payload: { heroId: heroId }
        });
        if (!res || !res.ok) return { ok: false, text: 'Retire failed: ' + ((res && (res.reason || res.error)) || 'rejected') };
        if (selectedHeroId === heroId) selectedHeroId = null;
        notifyMutated();
        return { ok: true, text: 'Retired hero ' + heroId + ' (gear moved safely to City Vault).' };
      }
    },
    xp: {
      category: 'Heroes & Progression',
      usage: 'xp <amount>',
      params: [{ name: 'amount', required: true, desc: 'Positive XP amount to award.' }],
      examples: ['xp 60', 'xp 250'],
      aliases: [],
      contexts: ['any'],
      desc: 'Grant XP through canonical progression logic (triggers level-up & notifications in Dungeon).',
      run: function(args) {
        const amt = Number(args[0]);
        if (!isFinite(amt) || amt <= 0) return { ok: false, text: 'Usage: xp <positive number>' };
        return adjustHeroXp(amt, null);
      }
    },
    level: {
      category: 'Heroes & Progression',
      usage: 'level <1-100>',
      params: [{ name: '1-100', required: true, desc: 'Target hero level between 1 and 100.' }],
      examples: ['level 5', 'level 12'],
      aliases: [],
      contexts: ['any'],
      desc: 'Set hero level via canonical level setter and refresh derived stats.',
      run: function(args) {
        const targetLvl = Math.round(Number(args[0]));
        if (!isFinite(targetLvl) || targetLvl < 1 || targetLvl > 100) {
          return { ok: false, text: 'Usage: level <1-100>' };
        }
        return adjustHeroLevel(0, targetLvl);
      }
    },
    heal: {
      category: 'Dungeon Controls',
      usage: 'heal',
      params: [],
      examples: ['heal'],
      aliases: [],
      contexts: ['dungeon'],
      desc: 'Restore full HP/MP and cleanse negative statuses in Dungeon.',
      run: function() {
        const dng = getDungeonState();
        const res = fullHeal(dng);
        if (!res || !res.ok) return { ok: false, text: 'Heal failed (no active dungeon hero).' };
        notifyMutated();
        return { ok: true, text: 'Restored full HP (' + res.hp + ') & MP (' + res.mp + ').' };
      }
    },
    god: {
      category: 'Dungeon Controls',
      usage: 'god',
      params: [],
      examples: ['god'],
      aliases: [],
      contexts: ['dungeon'],
      desc: 'Toggle invulnerability (God Mode) for the active dungeon hero.',
      run: function() {
        return toggleHeroGodMode();
      }
    },
    spawn: {
      category: 'Combat & Spawning',
      usage: 'spawn <archetypeId> [x] [y]',
      params: [
        { name: 'archetypeId', required: true, desc: 'Monster/boss archetype ID (see Combat tab dropdown or "archetypes").' },
        { name: 'x', required: false, desc: 'Optional tile X coordinate.' },
        { name: 'y', required: false, desc: 'Optional tile Y coordinate.' }
      ],
      examples: ['spawn vault_crawler', 'spawn bone_warden', 'spawn starfall_colossus'],
      aliases: [],
      contexts: ['any'],
      desc: 'Spawn a regular/boss monster in Dungeon (canonical spawnEntity) or wandering hostile on Overworld.',
      run: function(args) {
        const ctx = getContext();
        const archId = args[0] || 'vault_crawler';
        const xArg = (args[1] !== undefined && args[1] !== null && args[1] !== '') ? Number(args[1]) : null;
        const yArg = (args[2] !== undefined && args[2] !== null && args[2] !== '') ? Number(args[2]) : null;
        if ((xArg !== null && isNaN(xArg)) || (yArg !== null && isNaN(yArg))) {
          return { ok: false, text: 'Invalid coordinates. Usage: spawn <archetypeId> [x] [y]' };
        }

        if (ctx === 'dungeon') {
          const dng = getDungeonState();
          const hasExplicit = xArg !== null && yArg !== null;
          const res = spawnEntity('monster', archId, xArg, yArg, dng, hasExplicit ? { strictCoords: true } : null);
          if (!res || !res.ok) return { ok: false, text: 'Spawn failed: ' + ((res && res.reason) || 'unknown_error') };
          notifyMutated();
          return {
            ok: true,
            text: 'Spawned ' + res.entity.name + ' (' + res.entity.id + ') at (' + res.x + ', ' + res.y + ') — HP ' + res.entity.hp + ', ATK ' + res.entity.atk + ', DEF ' + (res.entity.def || 0) + '.'
          };
        }

        // Strategy / Overworld: spawn a valid wandering hostile on a passable tile
        const simHost = getSimHost();
        const ow = simHost && simHost.state && simHost.state.world ? simHost.state.world.overworld : null;
        if (!ow) return { ok: false, text: 'No Overworld map active.' };
        const selUnit = getSelectedOverworldUnit(simHost.state);
        const city = getPrimaryCity(simHost.state);
        const anchorX = selUnit ? selUnit.x : (city ? city.x : ow.spawnX);
        const anchorY = selUnit ? selUnit.y : (city ? city.y : ow.spawnY);
        let hx = xArg !== null ? xArg : anchorX + 1;
        let hy = yArg !== null ? yArg : anchorY;

        if (!isOverworldTilePassable(ow, hx, hy) || (selUnit && selUnit.x === hx && selUnit.y === hy)) {
          let found = null;
          for (let rad = 1; rad <= 4 && !found; rad++) {
            for (let dy = -rad; dy <= rad && !found; dy++) {
              for (let dx = -rad; dx <= rad && !found; dx++) {
                const cx = anchorX + dx;
                const cy = anchorY + dy;
                if (selUnit && selUnit.x === cx && selUnit.y === cy) continue;
                if (isOverworldTilePassable(ow, cx, cy)) found = { x: cx, y: cy };
              }
            }
          }
          if (!found) return { ok: false, text: 'No passable Overworld tile found near (' + anchorX + ', ' + anchorY + ').' };
          hx = found.x;
          hy = found.y;
        }
        if (!Array.isArray(ow.hostiles)) ow.hostiles = [];
        const arch = MONSTER_ARCHETYPES[archId] || null;
        const hostile = {
          id: 'hostile_dev_' + Date.now() + '_' + ow.hostiles.length,
          name: arch ? ('Wandering ' + arch.name) : ('Wandering ' + archId),
          x: hx,
          y: hy,
          hp: arch ? Math.round(55 * (arch.hpMult || 1)) : 55,
          power: arch ? Math.round(16 * (arch.atkMult || 1)) : 16,
          alive: true,
          rewardGold: 22,
          rewardOre: 4,
          rewardXp: 25
        };
        ow.hostiles.push(hostile);
        if (ow.explored && ow.explored[hy]) ow.explored[hy][hx] = 1;
        notifyMutated();
        return { ok: true, text: 'Spawned Overworld hostile "' + hostile.name + '" [' + hostile.id + '] at (' + hx + ', ' + hy + ') — HP ' + hostile.hp + ', PWR ' + hostile.power + '.' };
      }
    },
    floor: {
      category: 'Dungeon Controls',
      usage: 'floor <depth>',
      params: [{ name: 'depth', required: true, desc: 'Target floor depth (1-999).' }],
      examples: ['floor 2', 'floor 5'],
      aliases: [],
      contexts: ['dungeon'],
      desc: 'Warp to a specific floor depth inside the current dungeon.',
      run: function(args) {
        const depth = Math.round(Number(args[0]));
        if (!isFinite(depth) || depth < 1 || depth > 999) return { ok: false, text: 'Usage: floor <1-999>' };
        const dng = getDungeonState();
        const res = gotoFloor(depth, null, dng);
        if (!res || !res.ok) return { ok: false, text: 'Floor warp failed: ' + (res && res.reason) };
        notifyMutated();
        return { ok: true, text: 'Warped to ' + res.dungeonName + ' Floor ' + res.depth + ' at (' + res.x + ', ' + res.y + ').' };
      }
    },
    reveal: {
      category: 'Dungeon Controls',
      usage: 'reveal',
      params: [],
      examples: ['reveal'],
      aliases: [],
      contexts: ['dungeon'],
      desc: 'Reveal the entire current dungeon floor chart.',
      run: function() {
        const dng = getDungeonState();
        const res = revealMap(dng);
        if (!res || !res.ok) return { ok: false, text: 'Reveal failed (not in dungeon).' };
        notifyMutated();
        return { ok: true, text: 'Revealed full chart for Floor ' + res.depth + '.' };
      }
    },
    dungeon: {
      category: 'Dungeon Controls',
      usage: 'dungeon <enter|exit> [poiId]',
      params: [
        { name: 'enter|exit', required: true, desc: 'Lifecycle transition direction.' },
        { name: 'poiId', required: false, desc: 'Optional dungeon POI ID when entering.' }
      ],
      examples: ['dungeon enter', 'dungeon exit'],
      aliases: [],
      contexts: ['any'],
      desc: 'Enter or exit dungeon through legitimate lifecycle services.',
      run: function(args) {
        const sub = args[0] ? args[0].toLowerCase() : '';
        if (sub === 'enter') {
          if (getContext() === 'dungeon') return { ok: false, text: 'Already inside a dungeon.' };
          if (typeof opts.onEnterDungeon !== 'function') return { ok: false, text: 'Dungeon entry handler unavailable.' };
          const res = opts.onEnterDungeon(args[1] || null);
          return res && res.ok
            ? { ok: true, text: 'Entered dungeon (' + (res.dungeonId || 'active') + ').' }
            : { ok: false, text: 'Enter dungeon failed: ' + ((res && res.reason) || 'party must be at a discovered dungeon entrance') };
        }
        if (sub === 'exit') {
          if (getContext() !== 'dungeon') return { ok: false, text: 'Not currently inside a dungeon.' };
          if (typeof opts.onExitDungeon !== 'function') return { ok: false, text: 'Dungeon exit handler unavailable.' };
          opts.onExitDungeon();
          return { ok: true, text: 'Exited dungeon to Overworld.' };
        }
        return { ok: false, text: 'Usage: dungeon <enter|exit> [poiId]' };
      }
    },
    grant: {
      category: 'Items & Resources',
      usage: 'grant <shopItemId>',
      params: [{ name: 'shopItemId', required: true, desc: 'Item ID from SHOP_ITEMS (or use Items tab dropdown).' }],
      examples: ['grant buy_wep_1', 'grant buy_heal', 'grant buy_recall'],
      aliases: [],
      contexts: ['dungeon'],
      desc: 'Grant a canonical item from SHOP_ITEMS (e.g. buy_wep_1, buy_heal, buy_recall).',
      run: function(args) {
        const dng = getDungeonState();
        if (!dng || !dng.hero) return { ok: false, text: 'No active dungeon hero.' };
        const id = args[0];
        if (!id) {
          return { ok: false, text: 'Usage: grant <shopItemId>. Valid: ' + SHOP_ITEMS.map(function(it) { return it.id; }).join(', ') };
        }
        const tpl = SHOP_ITEMS.find(function(it) { return it.id === id; });
        if (!tpl) {
          return { ok: false, text: 'Unknown item "' + id + '". Valid: ' + SHOP_ITEMS.map(function(it) { return it.id; }).join(', ') };
        }
        if (tpl.type === 'consumable') {
          if (!dng.hero.consumables) dng.hero.consumables = { potions: 0, recalls: 0 };
          if (tpl.id === 'buy_heal') dng.hero.consumables.potions += 1;
          else if (tpl.id === 'buy_recall') dng.hero.consumables.recalls += 1;
          notifyMutated();
          return { ok: true, text: 'Granted consumable: ' + tpl.name + '.' };
        }
        const item = Object.assign({}, tpl, {
          uid: nextItemUid('dev_grant'),
          affixes: [],
          sockets: [],
          maxSockets: 1
        });
        if (item.slot === 'pickaxe') {
          item.curDur = item.maxDur || 50;
        }
        if (!Array.isArray(dng.hero.expeditionGear)) dng.hero.expeditionGear = [];
        dng.hero.expeditionGear.push(item);
        notifyMutated();
        return { ok: true, text: 'Granted gear: ' + item.name + ' [' + item.uid + '] into expedition pack.' };
      }
    },
    equip: {
      category: 'Items & Resources',
      usage: 'equip <itemUid>',
      params: [{ name: 'itemUid', required: true, desc: 'UID of an item in expedition pack or hero bag.' }],
      examples: ['equip dev_grant_1'],
      aliases: [],
      contexts: ['any'],
      desc: 'Equip an item by UID through canonical equip APIs and refresh derived stats.',
      run: function(args) {
        const uid = args[0];
        if (!uid) return { ok: false, text: 'Usage: equip <itemUid>' };
        if (getContext() === 'dungeon') {
          const dng = getDungeonState();
          if (!dng || !dng.hero) return { ok: false, text: 'No active dungeon hero.' };
          const res = equipItem(uid, dng);
          recomputeHeroDerivedStats(false, dng);
          notifyMutated();
          return res && res.ok !== false
            ? { ok: true, text: 'Equipped item ' + uid + ' (ATK ' + dng.hero.atk + ', DEF ' + dng.hero.def + ').' }
            : { ok: false, text: 'Equip failed for UID "' + uid + '".' };
        }
        const simHost = getSimHost();
        const h = resolveStrategyHero(simHost, null);
        if (!h) return { ok: false, text: 'No active strategy hero.' };
        const resS = simHost.dispatch({
          type: COMMAND_TYPES.EQUIP_HERO_ITEM,
          payload: { heroId: h.id, itemUid: uid }
        });
        if (!resS || !resS.ok) return { ok: false, text: 'Equip failed: ' + ((resS && (resS.reason || resS.error)) || 'rejected') };
        notifyMutated();
        return { ok: true, text: 'Equipped ' + uid + ' on ' + h.name + ' (ATK ' + h.stats.atk + ', DEF ' + h.stats.def + ').' };
      }
    },
    resource: {
      category: 'Items & Resources',
      usage: 'resource <gold|wood|stone|food|water|ore|ingots> <delta>',
      params: [
        { name: 'resourceKey', required: true, desc: 'City stockpile resource key.' },
        { name: 'delta', required: true, desc: 'Signed integer delta (clamped >= 0).' }
      ],
      examples: ['resource gold 500', 'resource wood 200'],
      aliases: [],
      contexts: ['any'],
      desc: 'Adjust a primary city stockpile resource by a signed delta.',
      run: function(args) {
        if (!args[0] || args[1] === undefined) {
          return { ok: false, text: 'Usage: resource <gold|wood|stone|food|water|ore|ingots> <delta>' };
        }
        return adjustCityResource(args[0], Number(args[1]), null);
      }
    }
  };

  function execute(commandLine) {
    const parsed = parseConsoleCommandLine(commandLine);
    if (!parsed.verb) {
      return { ok: false, text: 'Empty command. Open the Help tab or type "help".' };
    }
    commandHistory.push(parsed.raw);
    if (commandHistory.length > MAX_CONSOLE_HISTORY) commandHistory.shift();
    historyCursor = commandHistory.length;

    const cmd = commands[parsed.verb];
    if (!cmd) {
      pushOutput('> ' + parsed.raw, 'cmd');
      const msg = 'Unknown command "' + parsed.verb + '". Open the Help tab or type "help".';
      pushOutput(msg, 'err');
      lastFeedback = { ok: false, text: msg };
      return { ok: false, text: msg };
    }

    const ctx = getContext();
    const ctxAllowed = cmd.contexts.indexOf('any') !== -1 || cmd.contexts.indexOf(ctx) !== -1;
    if (!ctxAllowed) {
      pushOutput('> ' + parsed.raw, 'cmd');
      const msg = 'Command "' + parsed.verb + '" is only available in [' + cmd.contexts.join('/') + '] context (current: ' + ctx + ').';
      pushOutput(msg, 'err');
      lastFeedback = { ok: false, text: msg };
      return { ok: false, text: msg };
    }

    let result;
    try {
      result = cmd.run(parsed.args);
    } catch (err) {
      result = { ok: false, text: 'Command error: ' + ((err && err.message) || String(err)) };
    }

    if (!result.silentEcho) {
      pushOutput('> ' + parsed.raw, 'cmd');
    }
    pushOutput(result.text, result.ok ? 'ok' : 'err');
    lastFeedback = { ok: Boolean(result.ok), text: result.text };
    return result;
  }

  function getHelpCatalog(filterOverride) {
    const q = String(filterOverride !== undefined ? filterOverride : helpFilter || '').trim().toLowerCase();
    const byCat = {};
    const names = Object.keys(commands).sort();
    let totalCount = 0;
    let matchedCount = 0;

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const c = commands[name];
      totalCount += 1;
      const haystack = (
        name + ' ' +
        (c.category || '') + ' ' +
        (c.usage || '') + ' ' +
        (c.desc || '') + ' ' +
        (c.examples || []).join(' ') + ' ' +
        (c.contexts || []).join(' ')
      ).toLowerCase();
      if (q && haystack.indexOf(q) === -1) continue;
      matchedCount += 1;
      const cat = c.category || 'Other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push({
        name: name,
        category: cat,
        usage: c.usage,
        desc: c.desc,
        params: c.params || [],
        examples: c.examples || [],
        aliases: c.aliases || [],
        contexts: c.contexts || ['any']
      });
    }

    const categories = [];
    for (let i = 0; i < HELP_CATEGORY_ORDER.length; i++) {
      const catName = HELP_CATEGORY_ORDER[i];
      if (byCat[catName] && byCat[catName].length > 0) {
        categories.push({ name: catName, entries: byCat[catName] });
      }
    }
    const extraCats = Object.keys(byCat);
    for (let i = 0; i < extraCats.length; i++) {
      if (HELP_CATEGORY_ORDER.indexOf(extraCats[i]) === -1) {
        categories.push({ name: extraCats[i], entries: byCat[extraCats[i]] });
      }
    }

    return {
      query: q,
      totalCount: totalCount,
      matchedCount: matchedCount,
      categories: categories
    };
  }

  function getInspectorSnapshot() {
    const ctx = getContext();
    const simHost = getSimHost();
    const dng = getDungeonState();
    const w = (simHost && simHost.state && simHost.state.world) ? simHost.state.world : null;
    const city = (simHost && simHost.state) ? getPrimaryCity(simHost.state) : null;
    const ow = w ? w.overworld : null;
    const selUnit = (simHost && simHost.state) ? getSelectedOverworldUnit(simHost.state) : null;
    const viewLabel = ctx === 'dungeon'
      ? 'DUNGEON'
      : ((simHost && simHost.state && simHost.state.activeView === 'city') ? 'CITY' : 'OVERWORLD');

    const worldHeroes = (w && Array.isArray(w.heroes)) ? w.heroes : [];
    const activeHero = resolveActiveHero(null);

    let heroSnap = null;
    if (activeHero) {
      const derived = computeHeroDerivedStats(activeHero);
      const attrs = derived && derived.attributes ? derived.attributes : { str: 0, dex: 0, int: 0, vit: 0, spi: 0 };
      const bonus = normalizeHeroBonusStats(activeHero.bonusStats);
      const cls = (activeHero.classId && CLASSES[activeHero.classId]) ? CLASSES[activeHero.classId] : null;
      const kn = normalizeHeroKnowledge(activeHero.knowledge);
      const eq = activeHero.equipment || {};
      const packItems = ctx === 'dungeon'
        ? (Array.isArray(activeHero.expeditionGear) ? activeHero.expeditionGear : [])
        : (Array.isArray(activeHero.bagGear) ? activeHero.bagGear : []);
      let skillTargeting = null;
      if (ctx === 'dungeon' && dng) {
        skillTargeting = getSkillTargetingInfo(dng);
      }
      heroSnap = {
        id: activeHero.id || 'dungeon_hero',
        name: activeHero.name || 'Unnamed Hero',
        classId: activeHero.classId || 'unknown',
        className: cls ? cls.name : (activeHero.classId || 'Unknown'),
        title: cls ? cls.title : '',
        level: activeHero.level || 1,
        xp: activeHero.xp || 0,
        maxXp: activeHero.maxXp || 60,
        hp: ctx === 'dungeon' ? (activeHero.hp || 0) : (derived ? derived.maxHp : 0),
        maxHp: ctx === 'dungeon' ? (activeHero.maxHp || (derived ? derived.maxHp : 0)) : (derived ? derived.maxHp : 0),
        mp: ctx === 'dungeon' ? (activeHero.mp || 0) : (derived ? derived.maxMp : 0),
        maxMp: ctx === 'dungeon' ? (activeHero.maxMp || (derived ? derived.maxMp : 0)) : (derived ? derived.maxMp : 0),
        statPoints: activeHero.statPoints || 0,
        talentPoints: activeHero.talentPoints || 0,
        godMode: Boolean(activeHero.godMode),
        canEnterDungeon: activeHero.canEnterDungeon !== false,
        attributes: {
          str: { internal: attrs.str, display: formatAttributeDisplay(attrs.str), bonus: bonus.str || 0 },
          dex: { internal: attrs.dex, display: formatAttributeDisplay(attrs.dex), bonus: bonus.dex || 0 },
          int: { internal: attrs.int, display: formatAttributeDisplay(attrs.int), bonus: bonus.int || 0 },
          vit: { internal: attrs.vit, display: formatAttributeDisplay(attrs.vit), bonus: bonus.vit || 0 },
          spi: { internal: attrs.spi, display: formatAttributeDisplay(attrs.spi), bonus: bonus.spi || 0 }
        },
        derived: derived ? {
          maxHp: derived.maxHp,
          maxMp: derived.maxMp,
          atk: derived.atk,
          magicPower: derived.magicPower,
          def: derived.def,
          crit: derived.crit,
          dodge: derived.dodge
        } : { maxHp: 0, maxMp: 0, atk: 0, magicPower: 0, def: 0, crit: 0, dodge: 0 },
        knowledge: kn,
        skill: cls ? {
          name: cls.skillName,
          cost: cls.skillCost,
          range: cls.skillRange || 1,
          desc: cls.skillDesc,
          passiveName: cls.passiveName,
          passiveDesc: cls.passiveDesc,
          targeting: skillTargeting
        } : null,
        equipment: ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'].map(function(slot) {
          const it = eq[slot] || null;
          return { slot: slot, name: it ? it.name : null, uid: it ? it.uid : null };
        }),
        packItems: packItems.map(function(it) {
          return { uid: it.uid, name: it.name, slot: it.slot || 'gear', atk: it.atk || 0, def: it.def || 0 };
        }),
        consumables: activeHero.consumables || { potions: 0, recalls: 0 },
        statuses: Array.isArray(activeHero.statuses) ? activeHero.statuses.map(function(s) { return s.name || s.id || 'status'; }) : []
      };
    }

    const fl = (dng && dng.dungeon) ? ensureDungeonFloorHydrated(dng.dungeon, dng.dungeon.currentFloor) : null;
    const livingMonsters = (fl && Array.isArray(fl.monsters))
      ? fl.monsters.filter(function(m) { return m && m.hp > 0; }).map(function(m) {
        return { uid: m.uid || m.id, id: m.id, name: m.name, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, atk: m.atk, def: m.def || 0, isBoss: Boolean(m.isBoss) };
      })
      : [];
    const livingHostiles = (ow && Array.isArray(ow.hostiles))
      ? ow.hostiles.filter(function(h) { return h && h.alive; }).map(function(h) {
        return { id: h.id, name: h.name, x: h.x, y: h.y, hp: h.hp, power: h.power };
      })
      : [];

    const recruitableClasses = Object.keys(CLASSES).filter(function(cid) {
      return CLASSES[cid] && CLASSES[cid].canEnterDungeon !== false;
    }).map(function(cid) {
      return { id: cid, name: CLASSES[cid].name, title: CLASSES[cid].title };
    });

    const regularArchetypes = Object.keys(MONSTER_ARCHETYPES).map(function(id) {
      return { id: id, name: MONSTER_ARCHETYPES[id].name, isBoss: false };
    });
    const bossArchetypes = Object.keys(BOSS_ARCHETYPES).map(function(id) {
      return { id: id, name: BOSS_ARCHETYPES[id].name, isBoss: true };
    });

    const buildingCount = (city && Array.isArray(city.plots))
      ? city.plots.filter(function(p) { return p && p.buildingId; }).length
      : 0;

    return {
      context: ctx,
      viewLabel: viewLabel,
      activeTab: activeTab,
      lastFeedback: lastFeedback,
      world: w ? {
        worldName: w.worldName || w.id || 'Campaign',
        seedCode: w.seedCode || '—',
        simTimeSec: Math.round(((w.clock && w.clock.simTimeMs) || 0) / 1000),
        heroCount: worldHeroes.length,
        hostileCount: livingHostiles.length,
        selectedUnitName: selUnit ? selUnit.name : null,
        city: city ? {
          name: city.name,
          x: city.x,
          y: city.y,
          buildingCount: buildingCount,
          stockpile: Object.assign({ gold: 0, wood: 0, stone: 0, food: 0, water: 0, ore: 0, ingots: 0 }, city.stockpile || {})
        } : null
      } : null,
      heroes: worldHeroes.map(function(h) {
        return {
          id: h.id,
          name: h.name,
          classId: h.classId,
          className: (CLASSES[h.classId] && CLASSES[h.classId].name) || h.classId,
          level: h.level || 1,
          xp: h.xp || 0,
          maxXp: h.maxXp || 60,
          selected: Boolean(heroSnap && heroSnap.id === h.id)
        };
      }),
      recruitableClasses: recruitableClasses,
      activeHero: heroSnap,
      combat: {
        monsters: livingMonsters,
        hostiles: livingHostiles,
        regularArchetypes: regularArchetypes,
        bossArchetypes: bossArchetypes
      },
      dungeon: (dng && dng.dungeon) ? {
        active: ctx === 'dungeon',
        name: dng.dungeon.name || dng.activeDungeonId || 'Dungeon',
        depth: dng.dungeon.currentFloor || 1,
        turn: dng.turn || 0,
        monsterCount: livingMonsters.length,
        objectCount: (fl && Array.isArray(fl.objects)) ? fl.objects.length : 0,
        heroPos: (dng.hero) ? { x: dng.hero.x || 0, y: dng.hero.y || 0 } : null
      } : {
        active: false,
        name: 'Not Entered',
        depth: 1,
        turn: 0,
        monsterCount: 0,
        objectCount: 0,
        heroPos: null
      },
      items: {
        shopItems: SHOP_ITEMS.map(function(it) {
          return { id: it.id, name: it.name, slot: it.slot || it.type || 'item', cost: it.cost || 0 };
        })
      },
      abilities: (function() {
        const targetHero = activeHero || null;
        if (targetHero) normalizeActorAbilityState(targetHero);
        const grantedIds = targetHero ? getGrantedAbilityIds(targetHero) : [];
        return {
          catalog: ABILITY_IDS.map(function(id) {
            const d = ABILITIES[id];
            return { id: d.id, name: d.name, domain: d.domain, kind: d.kind, activation: d.activation };
          }),
          granted: grantedIds.map(function(id) {
            const d = getAbilityDefinition(id);
            return {
              id: id,
              name: d ? d.name : id,
              domain: d ? d.domain : 'martial',
              kind: d ? d.kind : 'skill',
              sources: targetHero ? getGrantedAbilitySources(targetHero, id) : [],
              cooldownRemaining: targetHero ? getAbilityCooldownRemaining(targetHero, id) : 0
            };
          }),
          absorbShield: targetHero ? (targetHero.absorbShield || 0) : 0,
          pendingCast: targetHero ? (targetHero.pendingCast || null) : null,
          statuses: (targetHero && Array.isArray(targetHero.statuses)) ? targetHero.statuses.map(function(s) {
            return { id: s.id, name: s.name || s.id, duration: s.duration || 1, isBuff: Boolean(s.isBuff) };
          }) : []
        };
      })()
    };
  }

  function grantHeroAbility(abilityId, sourceType) {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero available.' }, 'Abilities');
    const res = grantAbilityAccess(hero, abilityId, sourceType || 'learned');
    if (!res.ok) return recordFeedback({ ok: false, text: 'Grant ability failed: ' + res.reason }, 'Abilities');
    notifyMutated();
    return recordFeedback({ ok: true, text: 'Granted ' + abilityId + ' (' + res.source + ') to ' + hero.name + '.' }, 'Abilities');
  }

  function revokeHeroAbility(abilityId, sourceType) {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero available.' }, 'Abilities');
    const res = revokeAbilityAccess(hero, abilityId, sourceType || 'learned');
    if (!res.ok) return recordFeedback({ ok: false, text: 'Revoke ability failed: ' + res.reason }, 'Abilities');
    notifyMutated();
    return recordFeedback({
      ok: true,
      stillGranted: res.stillGranted,
      text: 'Revoked ' + abilityId + ' (' + res.source + ')' + (res.stillGranted ? ' — still granted via another source.' : '.')
    }, 'Abilities');
  }

  function resetHeroCooldownsAndMp() {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero available.' }, 'Abilities');
    resetActorAbilityCooldowns(hero);
    hero.mp = hero.maxMp || hero.mp || 40;
    hero.pendingCast = null;
    notifyMutated();
    return recordFeedback({ ok: true, text: 'Reset all ability cooldowns & restored full MP for ' + hero.name + '.' }, 'Abilities');
  }

  function applyTestStatusToHero(statusId, duration) {
    const hero = resolveActiveHero(null);
    if (!hero) return recordFeedback({ ok: false, text: 'No active hero available.' }, 'Abilities');
    applyStatusEffect(hero, statusId, duration || 3, { sourceId: 'dev_console' });
    if (getContext() === 'dungeon') {
      recomputeHeroDerivedStats(false, getDungeonState());
    }
    notifyMutated();
    return recordFeedback({ ok: true, text: 'Applied status "' + statusId + '" (' + (duration || 3) + 't) to ' + hero.name + '.' }, 'Abilities');
  }

  function setOpen(nextOpen) {
    isOpen = Boolean(nextOpen);
    return isOpen;
  }

  function toggle() {
    isOpen = !isOpen;
    return isOpen;
  }

  function setTab(tabId) {
    const valid = DEV_CONSOLE_TABS.some(function(t) { return t.id === tabId; });
    if (valid) activeTab = tabId;
    return activeTab;
  }

  function setSelectedHeroId(heroId) {
    selectedHeroId = heroId || null;
    return selectedHeroId;
  }

  function setHelpFilter(text) {
    helpFilter = String(text || '');
    return helpFilter;
  }

  function getHistoryPrev() {
    if (commandHistory.length === 0) return '';
    historyCursor = Math.max(0, historyCursor - 1);
    return commandHistory[historyCursor] || '';
  }

  function getHistoryNext() {
    if (commandHistory.length === 0) return '';
    historyCursor = Math.min(commandHistory.length, historyCursor + 1);
    return historyCursor < commandHistory.length ? commandHistory[historyCursor] : '';
  }

  pushOutput('Aethelgard Developer Console ready. Use visual tabs above or type a command.', 'info');

  return {
    execute: execute,
    toggle: toggle,
    setOpen: setOpen,
    isOpen: function() { return isOpen; },
    getContext: getContext,
    getTab: function() { return activeTab; },
    setTab: setTab,
    getSelectedHeroId: function() { return selectedHeroId; },
    setSelectedHeroId: setSelectedHeroId,
    getHelpFilter: function() { return helpFilter; },
    setHelpFilter: setHelpFilter,
    getLastFeedback: function() { return lastFeedback; },
    getHelpCatalog: getHelpCatalog,
    getInspectorSnapshot: getInspectorSnapshot,
    adjustHeroAttribute: adjustHeroAttribute,
    adjustHeroVitals: adjustHeroVitals,
    adjustHeroXp: adjustHeroXp,
    adjustHeroLevel: adjustHeroLevel,
    adjustHeroStatPoints: adjustHeroStatPoints,
    toggleHeroGodMode: toggleHeroGodMode,
    spawnObject: spawnObject,
    triggerHeroSkill: triggerHeroSkill,
    grantHeroAbility: grantHeroAbility,
    revokeHeroAbility: revokeHeroAbility,
    resetHeroCooldownsAndMp: resetHeroCooldownsAndMp,
    applyTestStatusToHero: applyTestStatusToHero,
    setupCityForgeWorkflow: setupCityForgeWorkflow,
    adjustCityResource: adjustCityResource,
    grantShopItem: grantShopItem,
    getOutput: function() { return outputLog.slice(); },
    getHistory: function() { return commandHistory.slice(); },
    getHistoryPrev: getHistoryPrev,
    getHistoryNext: getHistoryNext,
    getCommandNames: function() { return Object.keys(commands).sort(); }
  };
}
