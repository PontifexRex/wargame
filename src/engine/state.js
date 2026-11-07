// Game State Schema, Save v4 Migration, Persistence, and Derived Hero Stats

import { SCHEMA_VERSION, STORAGE_KEY } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { GEM_IDS, GEM_CATALOG } from '../data/gems.js';
import { buildProceduralBountySet } from '../data/bounties.js';

let itemSeq = 1000;

export function nextItemUid(prefix = 'gear') {
  return `${prefix}_${Date.now()}_${itemSeq++}`;
}

export function normalizeEquipmentSockets(item) {
  if (!item) return null;
  if (item.slot === 'pickaxe') {
    item.maxSockets = 0;
    item.sockets = [];
    return item;
  }
  if (typeof item.maxSockets !== 'number') {
    if (item.rarity === 'relic') item.maxSockets = 2;
    else if (item.rarity === 'epic' || item.rarity === 'rare') item.maxSockets = 1;
    else item.maxSockets = 0;
  }
  if (!Array.isArray(item.sockets)) {
    item.sockets = [];
  }
  return item;
}

export function createDefaultGameState() {
  return {
    version: SCHEMA_VERSION,
    turn: 0,
    inGuild: true,
    audioEnabled: true,
    hero: null,
    dungeon: {
      seedCode: 'STAR-' + (1000 + Math.floor(Math.random() * 8999)),
      currentFloor: 1,
      floors: {}
    },
    guildVault: {
      gold: 35,
      copper: 0,
      iron: 0,
      mithril: 0,
      geode: 0,
      starcrystal: 0,
      astralite: 0,
      gems: {
        ruby: 0,
        emerald: 0,
        sapphire: 0,
        topaz: 0,
        void_diamond: 0
      },
      armory: []
    },
    guildResearch: {
      cartography: 0,
      geology: 0,
      toolsmithing: 0,
      assay: 0,
      quartermaster: 0,
      vanguard: 0
    },
    guildBounties: buildProceduralBountySet(0, 0)
  };
}

export const gameState = createDefaultGameState();

export function setGameState(nextState) {
  if (!nextState) return gameState;
  Object.keys(gameState).forEach(k => {
    delete gameState[k];
  });
  Object.assign(gameState, nextState);
  return gameState;
}

export function migrateSaveData(raw) {
  if (!raw) return null;
  const data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));

  const migrated = createDefaultGameState();
  migrated.turn = data.turn || 0;
  migrated.inGuild = data.inGuild !== undefined ? data.inGuild : (data.location !== 'dungeon');
  migrated.audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;

  // Migrate Vault & Bank
  const srcVault = data.guildVault || data.bank || {};
  migrated.guildVault.gold = srcVault.gold !== undefined ? srcVault.gold : 35;
  migrated.guildVault.copper = srcVault.copper || 0;
  migrated.guildVault.iron = srcVault.iron || 0;
  migrated.guildVault.mithril = srcVault.mithril || 0;
  migrated.guildVault.geode = srcVault.geode || 0;
  migrated.guildVault.starcrystal = srcVault.starcrystal || 0;
  migrated.guildVault.astralite = srcVault.astralite || 0;

  const srcGems = srcVault.gems || {};
  GEM_IDS.forEach(gId => {
    migrated.guildVault.gems[gId] = srcGems[gId] || 0;
  });

  const rawArmory = Array.isArray(srcVault.armory)
    ? srcVault.armory
    : (Array.isArray(srcVault.equipment) ? srcVault.equipment : []);
  migrated.guildVault.armory = rawArmory.map(g => normalizeEquipmentSockets(g));

  // Migrate old v1/v2 bank items array into mineral/gem counts
  if (Array.isArray(srcVault.items)) {
    srcVault.items.forEach(it => {
      const cleanId = (it.id || '')
        .replace('_ore', '')
        .replace('relic_geode', 'geode')
        .replace('star', 'starcrystal')
        .replace('astral', 'astralite');
      if (migrated.guildVault.gems[cleanId] !== undefined) {
        migrated.guildVault.gems[cleanId] += (it.count || it.qty || 1);
      } else if (migrated.guildVault[cleanId] !== undefined && typeof migrated.guildVault[cleanId] === 'number') {
        migrated.guildVault[cleanId] += (it.count || it.qty || 1);
      }
    });
  }

  // Migrate Research
  const srcRes = data.guildResearch || data.research || {};
  migrated.guildResearch = {
    cartography:   srcRes.cartography !== undefined ? srcRes.cartography : (srcRes.vault_cartography || srcRes.max_depth || 0),
    geology:       srcRes.geology !== undefined ? srcRes.geology : (srcRes.metallurgy_geology || 0),
    toolsmithing:  srcRes.toolsmithing !== undefined ? srcRes.toolsmithing : (srcRes.pickaxe_temper || 0),
    assay:         srcRes.assay !== undefined ? srcRes.assay : (srcRes.appraisal || srcRes.ore_appraisal || 0),
    quartermaster: srcRes.quartermaster || 0,
    vanguard:      srcRes.vanguard !== undefined ? srcRes.vanguard : (srcRes.vanguard_insurance || 0)
  };

  // Migrate Bounties
  if (Array.isArray(data.guildBounties) && data.guildBounties.length > 0) {
    migrated.guildBounties = data.guildBounties.map(b => Object.assign({
      curQty: 0,
      reqQty: 1,
      completed: false
    }, b));
  } else {
    migrated.guildBounties = buildProceduralBountySet(
      migrated.guildResearch.geology,
      migrated.guildResearch.cartography
    );
  }

  // Migrate Hero
  if (data.hero) {
    const clsId = CLASSES[data.hero.classId] ? data.hero.classId : 'fighter';
    const cls = CLASSES[clsId];
    const eqSource = data.hero.equipment || data.hero.equipped || {};
    migrated.hero = {
      name: data.hero.name || cls.name,
      classId: clsId,
      level: data.hero.level || 1,
      xp: data.hero.xp || 0,
      maxXp: data.hero.maxXp || data.hero.xpNext || 60,
      statPoints: data.hero.statPoints || 0,
      bonusStats: data.hero.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 },
      hp: data.hero.hp || cls.hpBase,
      maxHp: data.hero.maxHp || cls.hpBase,
      mp: data.hero.mp || cls.mpBase,
      maxMp: data.hero.maxMp || cls.mpBase,
      atk: data.hero.atk || 12,
      def: data.hero.def || 6,
      crit: data.hero.crit || 5,
      dodge: data.hero.dodge || 5,
      talentPoints: data.hero.talentPoints !== undefined ? data.hero.talentPoints : (data.hero.talentPointsAvailable || 0),
      talentsAllocated: data.hero.talentsAllocated || {},
      consumables: {
        potions: (data.hero.consumables && data.hero.consumables.potions !== undefined)
          ? data.hero.consumables.potions
          : (srcVault.potions !== undefined ? srcVault.potions : 2),
        recalls: (data.hero.consumables && data.hero.consumables.recalls !== undefined)
          ? data.hero.consumables.recalls
          : (srcVault.recallScrolls !== undefined ? srcVault.recallScrolls : 1)
      },
      equipment: {
        weapon:    normalizeEquipmentSockets(eqSource.weapon    || JSON.parse(JSON.stringify(cls.starterGear.weapon))),
        armor:     normalizeEquipmentSockets(eqSource.armor     || JSON.parse(JSON.stringify(cls.starterGear.armor))),
        helm:      normalizeEquipmentSockets(eqSource.helm      || JSON.parse(JSON.stringify(cls.starterGear.helm))),
        boots:     normalizeEquipmentSockets(eqSource.boots     || JSON.parse(JSON.stringify(cls.starterGear.boots))),
        accessory: normalizeEquipmentSockets(eqSource.accessory || JSON.parse(JSON.stringify(cls.starterGear.accessory))),
        pickaxe:   normalizeEquipmentSockets(eqSource.pickaxe   || JSON.parse(JSON.stringify(cls.starterGear.pickaxe)))
      },
      expeditionPack: Array.isArray(data.hero.expeditionPack) ? data.hero.expeditionPack : [],
      expeditionGear: Array.isArray(data.hero.expeditionGear)
        ? data.hero.expeditionGear.map(g => normalizeEquipmentSockets(g))
        : [],
      statuses: Array.isArray(data.hero.statuses) ? data.hero.statuses : [],
      usedDivineIntervention: !!data.hero.usedDivineIntervention,
      x: data.hero.x || 1,
      y: data.hero.y || 1
    };
  }

  if (data.dungeon && data.dungeon.floors) {
    migrated.dungeon.seedCode = data.dungeon.seedCode || 'STAR-4812';
    migrated.dungeon.currentFloor = data.dungeon.currentFloor || data.dungeon.currentDepth || 1;
    migrated.dungeon.floors = data.dungeon.floors;
    Object.keys(migrated.dungeon.floors).forEach(fk => {
      const fl = migrated.dungeon.floors[fk];
      if (fl) {
        fl.shrines = fl.shrines || {};
        fl.traps = fl.traps || {};
      }
    });
  }

  migrated.version = SCHEMA_VERSION;
  return migrated;
}

export function getPickaxeMaxDurability(state = gameState) {
  const pick = state && state.hero && state.hero.equipment ? state.hero.equipment.pickaxe : null;
  if (!pick) return 25;
  const toolRank = (state && state.guildResearch && state.guildResearch.toolsmithing) || 0;
  return Math.round(pick.maxDur * (1 + toolRank * 0.5));
}

export function recomputeHeroDerivedStats(fullRestore = false, state = gameState) {
  const h = state.hero;
  if (!h) return;
  const cls = CLASSES[h.classId] || CLASSES.fighter;
  const bonus = h.bonusStats || { str: 0, dex: 0, int: 0, vit: 0 };

  let str = cls.baseStats.str + (h.level - 1) * 2 + (bonus.str || 0);
  let dex = cls.baseStats.dex + (h.level - 1) * 2 + (bonus.dex || 0);
  let int = cls.baseStats.int + (h.level - 1) * 2 + (bonus.int || 0);
  let vit = cls.baseStats.vit + (h.level - 1) * 2 + (bonus.vit || 0);

  let flatAtk = 0, flatDef = 0, flatCrit = 0, flatDodge = 0, flatHp = 0, flatMp = 0, visionBonus = 0;

  // Passive Class Bonuses
  if (h.classId === 'fighter') flatHp += 10;
  if (h.classId === 'thief')   flatCrit += 15;
  if (h.classId === 'ranger')  flatDodge += 15;
  if (h.classId === 'paladin') flatDef += 10;

  // Talent Bonuses
  const t = h.talentsAllocated || {};
  if (t.f_a1) flatHp += t.f_a1 * 12;
  if (t.f_a2) flatAtk += t.f_a2 * 3;
  if (t.t_b1) flatCrit += t.t_b1 * 5;
  if (t.t_b3) flatDodge += t.t_b3 * 10;
  if (t.m_c1) flatMp += t.m_c1 * 15;
  if (t.r_d1) { flatDodge += t.r_d1 * 4; visionBonus += t.r_d1; }
  if (t.p_e1) { flatDef += t.p_e1 * 4; flatHp += t.p_e1 * 8; }
  if (t.p_e2) flatAtk += t.p_e2 * 4;

  // Sum 6-Slot Equipment & Socketed Astral Gems
  for (const slot of ['weapon', 'armor', 'helm', 'boots', 'accessory']) {
    const it = h.equipment[slot];
    if (!it) continue;
    if (it.str) str += it.str;
    if (it.dex) dex += it.dex;
    if (it.int) int += it.int;
    if (it.vit) vit += it.vit;
    if (it.atk) flatAtk += it.atk;
    if (it.def) flatDef += it.def;
    if (it.crit) flatCrit += it.crit;
    if (it.dodge) flatDodge += it.dodge;
    if (it.maxHp) flatHp += it.maxHp;
    if (it.maxMp) flatMp += it.maxMp;
    if (it.visionBonus) visionBonus += it.visionBonus;

    if (Array.isArray(it.sockets)) {
      for (let sIdx = 0; sIdx < it.sockets.length; sIdx++) {
        const gem = GEM_CATALOG[it.sockets[sIdx]];
        if (!gem || !gem.bonuses) continue;
        const gb = gem.bonuses;
        if (gb.str) str += gb.str;
        if (gb.dex) dex += gb.dex;
        if (gb.int) int += gb.int;
        if (gb.vit) vit += gb.vit;
        if (gb.atk) flatAtk += gb.atk;
        if (gb.def) flatDef += gb.def;
        if (gb.crit) flatCrit += gb.crit;
        if (gb.dodge) flatDodge += gb.dodge;
        if (gb.maxHp) flatHp += gb.maxHp;
        if (gb.maxMp) flatMp += gb.maxMp;
        if (gb.visionBonus) visionBonus += gb.visionBonus;
      }
    }
  }

  // Active Astral Shrine Status Buffs
  if (Array.isArray(h.statuses)) {
    for (let i = 0; i < h.statuses.length; i++) {
      const st = h.statuses[i];
      if (st.id === 'shrine_starfire') {
        flatAtk += 6;
        flatCrit += 12;
      } else if (st.id === 'shrine_aegis') {
        flatDef += 6;
        visionBonus += 1;
      }
    }
  }

  h.computedStr = str;
  h.computedDex = dex;
  h.computedInt = int;
  h.computedVit = vit;
  h.visionRadius = (cls.vision || 5) + visionBonus;

  h.maxHp = cls.hpBase + (vit * 4) + flatHp;
  h.maxMp = cls.mpBase + (int * 3) + flatMp;

  const primaryOffensive = h.classId === 'mage'
    ? Math.round(int * 1.1 + str * 0.3)
    : h.classId === 'ranger' || h.classId === 'thief'
      ? Math.round(dex * 0.9 + str * 0.4)
      : Math.round(str * 0.95 + dex * 0.35);

  h.atk = primaryOffensive + flatAtk;
  h.def = Math.round(vit * 0.45) + flatDef;
  h.crit = Math.min(75, 5 + Math.round(dex * 0.45) + flatCrit);
  h.dodge = Math.min(60, 4 + Math.round(dex * 0.35) + flatDodge);

  if (fullRestore) {
    h.hp = h.maxHp;
    h.mp = h.maxMp;
  } else {
    h.hp = Math.min(h.hp, h.maxHp);
    h.mp = Math.min(h.mp, h.maxMp);
  }
}

export function saveGame(state = gameState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // Ignore storage quota or sandbox errors
  }
}

export function loadGame() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('aethelgard_save_v3') ||
        localStorage.getItem('aethelgard_save_v2') ||
        localStorage.getItem('aethelgard_save');
      if (raw) {
        const migrated = migrateSaveData(raw);
        setGameState(migrated);
        if (gameState.hero) {
          recomputeHeroDerivedStats(false, gameState);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Save load warning:', e);
  }
  return false;
}
