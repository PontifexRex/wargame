// Game State Schema (Multi-Dungeon Atlas v5/v6), Save Migration, RLE Persistence & Derived Hero Stats

import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  DEFAULT_MAX_CHARTERED_DUNGEONS,
  CODEX_MASTERY_KILLS,
  CODEX_MASTERY_DMG_MULT
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { GEM_IDS, GEM_CATALOG } from '../data/gems.js';
import { normalizeEquipmentItem } from '../data/items.js';
import { buildProceduralBountySet } from '../data/bounties.js';
import {
  CURATED_DUNGEON_PROFILES,
  normalizeDungeonConfig,
  createDungeonInstance
} from '../data/dungeons.js';
import { hashSeedString } from './rng.js';
import { packFloorForStorage, hydrateFloorFromStorage } from './compression.js';
import { hydrateLegacyFloorObjects } from './objects.js';
import { CANONICAL_PLAYER_ID } from '../core/canonicalIdentity.js';
import { computeHeroDerivedStats, normalizeHeroBonusStats } from '../core/heroStats.js';
import { normalizeHeroKnowledge } from '../core/knowledge.js';
import { normalizeActorAbilityState } from '../core/abilityEngine.js';

let itemSeq = 1000;

export function nextItemUid(prefix = 'gear') {
  return `${prefix}_${Date.now()}_${itemSeq++}`;
}

export function normalizeEquipmentSockets(item) {
  return normalizeEquipmentItem(item);
}

export function createDefaultCodexState() {
  const kills = {};
  return {
    totalMonstersSlain: 0,
    totalBossesSlain: 0,
    totalElitesSlain: 0,
    totalOresMined: 0,
    totalGemsUnearthed: 0,
    totalChestsOpened: 0,
    totalShrinesActivated: 0,
    totalExtractions: 0,
    totalDefeats: 0,
    deepestFloorByDungeon: {},
    monsterKills: kills,
    killsByArchetype: kills,
    oreMinedById: {},
    relicsUnlocked: []
  };
}

export function ensureCodexState(state) {
  if (!state) return createDefaultCodexState();
  if (!state.codex || typeof state.codex !== 'object') {
    state.codex = createDefaultCodexState();
  } else {
    const c = state.codex;
    c.totalMonstersSlain = c.totalMonstersSlain || 0;
    c.totalBossesSlain = c.totalBossesSlain || 0;
    c.totalElitesSlain = c.totalElitesSlain || 0;
    c.totalOresMined = c.totalOresMined || 0;
    c.totalGemsUnearthed = c.totalGemsUnearthed || 0;
    c.totalChestsOpened = c.totalChestsOpened || 0;
    c.totalShrinesActivated = c.totalShrinesActivated || 0;
    c.totalExtractions = c.totalExtractions || 0;
    c.totalDefeats = c.totalDefeats || 0;
    if (!c.deepestFloorByDungeon || typeof c.deepestFloorByDungeon !== 'object') c.deepestFloorByDungeon = {};
    if (!c.monsterKills || typeof c.monsterKills !== 'object') {
      c.monsterKills = c.killsByArchetype || {};
    }
    if (!c.killsByArchetype || typeof c.killsByArchetype !== 'object') {
      c.killsByArchetype = c.monsterKills;
    }
    if (!c.oreMinedById || typeof c.oreMinedById !== 'object') c.oreMinedById = {};
    if (!Array.isArray(c.relicsUnlocked)) c.relicsUnlocked = [];
  }
  return state.codex;
}

export function getCodexMasteryMultiplier(monsterId, state) {
  const targetState = state || gameState;
  if (!targetState || !targetState.codex) return 1.0;
  const killsMap = targetState.codex.monsterKills || targetState.codex.killsByArchetype;
  if (!killsMap) return 1.0;
  const kills = killsMap[monsterId] || 0;
  const isBoss = typeof monsterId === 'string' && monsterId.indexOf('boss_') === 0;
  const req = isBoss ? 1 : CODEX_MASTERY_KILLS;
  return kills >= req ? CODEX_MASTERY_DMG_MULT : 1.0;
}

export function recordRelicUnlock(item, floorDepth = 1, dungeonName = 'The Starfall Vaults', state) {
  const targetState = state || gameState;
  if (!item || item.rarity !== 'relic' || !targetState) return;
  const codex = ensureCodexState(targetState);
  const exists = codex.relicsUnlocked.some(r => r.name === item.name);
  if (!exists) {
    codex.relicsUnlocked.push({
      name: item.name,
      slot: item.slot,
      atk: item.atk || 0,
      def: item.def || 0,
      floor: floorDepth || 1,
      dungeonName: dungeonName || (targetState.dungeon && targetState.dungeon.name) || 'Subterranean Delve'
    });
    if (codex.relicsUnlocked.length > 50) {
      codex.relicsUnlocked.shift();
    }
  }
}

export function createDefaultDungeonsRegistry() {
  return {
    dng_starfall: createDungeonInstance('starfall_vaults', { id: 'dng_starfall', originType: 'curated' }),
    dng_quarry:   createDungeonInstance('sunken_quarry',   { id: 'dng_quarry',   originType: 'curated' }),
    dng_mycelium: createDungeonInstance('mycelium_labyrinth', { id: 'dng_mycelium', originType: 'curated' }),
    dng_citadel:  createDungeonInstance('citadel_ruins',   { id: 'dng_citadel',  originType: 'curated' }),
    dng_molten:   createDungeonInstance('molten_crucible', { id: 'dng_molten',   originType: 'curated' }),
    dng_abyss:    createDungeonInstance('abyssal_rift',    { id: 'dng_abyss',    originType: 'curated' })
  };
}

export function ensureDungeonFloorHydrated(dungeonObj, depth) {
  if (!dungeonObj || !dungeonObj.floors || !dungeonObj.floors[depth]) return null;
  dungeonObj.floors[depth] = hydrateFloorFromStorage(dungeonObj.floors[depth]);
  const fl = dungeonObj.floors[depth];
  if (fl) {
    hydrateLegacyFloorObjects(fl);
  }
  return fl;
}

export function syncActiveDungeonAlias(state) {
  if (!state) return null;
  if (!state.dungeons || Object.keys(state.dungeons).length === 0) {
    state.dungeons = createDefaultDungeonsRegistry();
  }
  if (!state.activeDungeonId || !state.dungeons[state.activeDungeonId]) {
    const firstKey = state.dungeons.dng_starfall ? 'dng_starfall' : Object.keys(state.dungeons)[0];
    state.activeDungeonId = firstKey;
  }

  // Keep inactive dungeons compactly RLE-packed in memory so hundreds of dungeons stay lightweight
  Object.keys(state.dungeons).forEach(dId => {
    const dng = state.dungeons[dId];
    if (!dng || !dng.floors) return;
    if (dId !== state.activeDungeonId) {
      Object.keys(dng.floors).forEach(fk => {
        if (dng.floors[fk] && !dng.floors[fk].packed) {
          dng.floors[fk] = packFloorForStorage(dng.floors[fk]);
        }
      });
    }
  });

  const active = state.dungeons[state.activeDungeonId];
  ensureDungeonFloorHydrated(active, active.currentFloor || 1);
  state.dungeon = active;
  return active;
}

export function createDefaultGameState() {
  const dungeons = createDefaultDungeonsRegistry();
  const activeId = 'dng_starfall';
  return {
    version: SCHEMA_VERSION,
    playerId: CANONICAL_PLAYER_ID,
    turn: 0,
    inGuild: true,
    audioEnabled: true,
    maxCharteredDungeons: DEFAULT_MAX_CHARTERED_DUNGEONS,
    hero: null,
    activeDungeonId: activeId,
    dungeons,
    dungeon: dungeons[activeId],
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
    guildBounties: buildProceduralBountySet(0, 0),
    codex: createDefaultCodexState(),
    wargameSession: null,
    uiSettings: {
      armorySortBy: 'slot'
    }
  };
}

export const gameState = createDefaultGameState();

export function setGameState(nextState) {
  if (!nextState) return gameState;
  Object.keys(gameState).forEach(k => {
    delete gameState[k];
  });
  Object.assign(gameState, nextState);
  syncActiveDungeonAlias(gameState);
  return gameState;
}

export function migrateSaveData(raw) {
  if (!raw) return null;
  const data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw));

  const migrated = createDefaultGameState();
  migrated.turn = data.turn || 0;
  migrated.inGuild = data.inGuild !== undefined ? data.inGuild : (data.location !== 'dungeon');
  migrated.audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;
  migrated.maxCharteredDungeons = typeof data.maxCharteredDungeons === 'number'
    ? data.maxCharteredDungeons
    : DEFAULT_MAX_CHARTERED_DUNGEONS;

  migrated.uiSettings = data.uiSettings || { armorySortBy: 'slot' };
  if (!migrated.uiSettings.armorySortBy) migrated.uiSettings.armorySortBy = 'slot';
  migrated.wargameSession = (data.wargameSession && typeof data.wargameSession === 'object')
    ? Object.assign({}, data.wargameSession)
    : null;

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
      bonusStats: normalizeHeroBonusStats(data.hero.bonusStats),
      knowledge: normalizeHeroKnowledge(data.hero.knowledge),
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
      abilityGrants: data.hero.abilityGrants ? JSON.parse(JSON.stringify(data.hero.abilityGrants)) : null,
      abilityCooldowns: data.hero.abilityCooldowns ? Object.assign({}, data.hero.abilityCooldowns) : {},
      activeAbilityId: data.hero.activeAbilityId || null,
      absorbShield: typeof data.hero.absorbShield === 'number' ? Math.max(0, data.hero.absorbShield) : 0,
      pendingCast: data.hero.pendingCast ? JSON.parse(JSON.stringify(data.hero.pendingCast)) : null,
      x: data.hero.x || 1,
      y: data.hero.y || 1
    };
    normalizeActorAbilityState(migrated.hero);
  }

  // Migrate Multi-Dungeon Registry OR Legacy Single Dungeon
  if (data.dungeons && typeof data.dungeons === 'object' && Object.keys(data.dungeons).length > 0) {
    Object.keys(data.dungeons).forEach(dId => {
      const rawDng = data.dungeons[dId];
      if (!rawDng) return;
      const baseProf = CURATED_DUNGEON_PROFILES[rawDng.profileId] || {};
      const normCfg = normalizeDungeonConfig(Object.assign({}, baseProf, rawDng.config || {}));
      const seedCode = rawDng.seedCode || 'STAR-4812';
      migrated.dungeons[dId] = {
        id: dId,
        name: rawDng.name || normCfg.name,
        profileId: rawDng.profileId || normCfg.profileId,
        originType: rawDng.originType || (CURATED_DUNGEON_PROFILES[normCfg.profileId] ? 'curated' : 'chartered'),
        worldCoords: rawDng.worldCoords || null,
        seedCode,
        numericSeed: rawDng.numericSeed || hashSeedString(seedCode, 0),
        config: normCfg,
        currentFloor: rawDng.currentFloor || 1,
        deepestFloor: rawDng.deepestFloor || rawDng.currentFloor || 1,
        isCleared: !!rawDng.isCleared,
        floors: rawDng.floors || {},
        waypoints: rawDng.waypoints || {}
      };
    });
    migrated.activeDungeonId = data.activeDungeonId && migrated.dungeons[data.activeDungeonId]
      ? data.activeDungeonId
      : Object.keys(migrated.dungeons)[0];

    const defaultDngs = createDefaultDungeonsRegistry();
    Object.keys(defaultDngs).forEach(defId => {
      if (!migrated.dungeons[defId]) {
        migrated.dungeons[defId] = defaultDngs[defId];
      }
    });
  } else if (data.dungeon && data.dungeon.floors) {
    const targetDng = migrated.dungeons.dng_starfall;
    targetDng.seedCode = data.dungeon.seedCode || 'STAR-4812';
    targetDng.numericSeed = hashSeedString(targetDng.seedCode, 0);
    targetDng.currentFloor = data.dungeon.currentFloor || data.dungeon.currentDepth || 1;
    targetDng.deepestFloor = Math.max(1, targetDng.currentFloor, Object.keys(data.dungeon.floors).length);
    targetDng.floors = {};
    targetDng.waypoints = data.dungeon.waypoints || {};
    Object.keys(data.dungeon.floors).forEach(fk => {
      targetDng.floors[fk] = hydrateFloorFromStorage(data.dungeon.floors[fk]);
    });
    migrated.activeDungeonId = 'dng_starfall';
  }

  syncActiveDungeonAlias(migrated);

  // Migrate Codex & Hall of Records
  migrated.codex = createDefaultCodexState();
  if (data.codex && typeof data.codex === 'object') {
    Object.assign(migrated.codex, data.codex);
    ensureCodexState(migrated);
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
  normalizeActorAbilityState(h);
  const derived = computeHeroDerivedStats(h);
  if (!derived) return;

  h.computedStr = derived.attributes.str;
  h.computedDex = derived.attributes.dex;
  h.computedInt = derived.attributes.int;
  h.computedVit = derived.attributes.vit;
  h.computedSpi = derived.attributes.spi;
  h.visionRadius = derived.visionRadius;

  h.maxHp = derived.maxHp;
  h.maxMp = derived.maxMp;
  h.thorns = derived.thorns;
  h.leech = derived.leech;
  h.ward = derived.ward;

  h.atk = derived.atk;
  h.magicPower = derived.magicPower;
  h.def = derived.def;
  h.crit = derived.crit;
  h.dodge = derived.dodge;

  if (fullRestore) {
    h.hp = h.maxHp;
    h.mp = h.maxMp;
  } else {
    h.hp = Math.min(h.hp, h.maxHp);
    h.mp = Math.min(h.mp, h.maxMp);
  }
}

export function serializeStateForStorage(state = gameState) {
  const packedDungeons = {};
  const srcDungeons = state.dungeons || {};
  Object.keys(srcDungeons).forEach(dId => {
    const dng = srcDungeons[dId];
    if (!dng) return;
    const packedFloors = {};
    if (dng.floors) {
      Object.keys(dng.floors).forEach(fk => {
        packedFloors[fk] = packFloorForStorage(dng.floors[fk]);
      });
    }
    packedDungeons[dId] = {
      id: dng.id,
      name: dng.name,
      profileId: dng.profileId,
      originType: dng.originType,
      worldCoords: dng.worldCoords || null,
      seedCode: dng.seedCode,
      numericSeed: dng.numericSeed,
      config: dng.config,
      currentFloor: dng.currentFloor,
      deepestFloor: dng.deepestFloor || dng.currentFloor || 1,
      isCleared: !!dng.isCleared,
      waypoints: dng.waypoints ? JSON.parse(JSON.stringify(dng.waypoints)) : {},
      floors: packedFloors
    };
  });

  return {
    version: state.version || SCHEMA_VERSION,
    playerId: state.playerId || CANONICAL_PLAYER_ID,
    turn: state.turn || 0,
    inGuild: state.inGuild !== false,
    audioEnabled: state.audioEnabled !== false,
    maxCharteredDungeons: state.maxCharteredDungeons || DEFAULT_MAX_CHARTERED_DUNGEONS,
    activeDungeonId: state.activeDungeonId,
    dungeons: packedDungeons,
    hero: state.hero,
    guildVault: state.guildVault,
    guildResearch: state.guildResearch,
    guildBounties: state.guildBounties,
    codex: state.codex ? JSON.parse(JSON.stringify(state.codex)) : createDefaultCodexState(),
    wargameSession: state.wargameSession ? JSON.parse(JSON.stringify(state.wargameSession)) : null,
    uiSettings: state.uiSettings ? JSON.parse(JSON.stringify(state.uiSettings)) : { armorySortBy: 'slot' }
  };
}

export function saveGame(state = gameState) {
  try {
    if (typeof localStorage !== 'undefined') {
      const payload = serializeStateForStorage(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
        localStorage.getItem('aethelgard_save_v5') ||
        localStorage.getItem('aethelgard_save_v4') ||
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


export function packDungeonWorldSnapshot(state = gameState) {
  if (!state || typeof state !== 'object') return null;
  const serialized = serializeStateForStorage(state);
  const hasActiveSession = Boolean(
    state.wargameSession &&
    state.wargameSession.active &&
    state.wargameSession.inProcess &&
    !state.inGuild &&
    state.hero
  );
  let activeSession = null;
  if (hasActiveSession) {
    const h = state.hero;
    activeSession = {
      sessionId: state.wargameSession.sessionId || null,
      playerId: state.wargameSession.playerId || state.playerId || CANONICAL_PLAYER_ID,
      campaignId: state.wargameSession.campaignId || null,
      unitId: state.wargameSession.partyUnitId || null,
      heroId: state.wargameSession.heroId || h.id || null,
      poiId: state.wargameSession.dungeonPoiId || null,
      dungeonId: state.activeDungeonId || state.wargameSession.dungeonId || 'dng_starfall',
      dungeonName: state.wargameSession.dungeonName || (state.dungeon && state.dungeon.name) || 'The Starfall Vaults',
      dungeonCoords: state.wargameSession.dungeonCoords ? { x: state.wargameSession.dungeonCoords.x, y: state.wargameSession.dungeonCoords.y } : null,
      currentFloor: (state.dungeon && state.dungeon.currentFloor) || 1,
      wargameSession: JSON.parse(JSON.stringify(state.wargameSession)),
      hero: JSON.parse(JSON.stringify(h))
    };
  }
  return {
    version: 1,
    campaignId: (state.wargameSession && state.wargameSession.campaignId) || null,
    activeDungeonId: serialized.activeDungeonId,
    turn: serialized.turn || 0,
    dungeons: serialized.dungeons,
    codex: serialized.codex,
    activeSession: activeSession
  };
}

export function hydrateDungeonWorldSnapshot(snapshot, targetState = gameState) {
  if (!snapshot || typeof snapshot !== 'object' || !targetState) return { ok: false, hasActiveSession: false };
  if (!snapshot.dungeons || typeof snapshot.dungeons !== 'object') return { ok: false, hasActiveSession: false };

  const clonedDungeons = JSON.parse(JSON.stringify(snapshot.dungeons));
  const dIds = Object.keys(clonedDungeons);
  if (dIds.length === 0) return { ok: false, hasActiveSession: false };

  for (let i = 0; i < dIds.length; i++) {
    const dng = clonedDungeons[dIds[i]];
    if (!dng) continue;
    if (!dng.waypoints || typeof dng.waypoints !== 'object') dng.waypoints = {};
    if (!dng.floors || typeof dng.floors !== 'object') dng.floors = {};
  }

  targetState.dungeons = clonedDungeons;
  targetState.activeDungeonId = (snapshot.activeDungeonId && clonedDungeons[snapshot.activeDungeonId])
    ? snapshot.activeDungeonId
    : dIds[0];
  targetState.turn = typeof snapshot.turn === 'number' ? snapshot.turn : 0;
  targetState.codex = snapshot.codex ? JSON.parse(JSON.stringify(snapshot.codex)) : createDefaultCodexState();
  syncActiveDungeonAlias(targetState);

  const sess = snapshot.activeSession;
  const sessionValid = Boolean(
    sess &&
    typeof sess === 'object' &&
    sess.hero &&
    sess.unitId &&
    sess.dungeonId &&
    clonedDungeons[sess.dungeonId]
  );

  if (sessionValid) {
    targetState.activeDungeonId = sess.dungeonId;
    syncActiveDungeonAlias(targetState);
    if (targetState.dungeon && typeof sess.currentFloor === 'number' && sess.currentFloor >= 1) {
      targetState.dungeon.currentFloor = sess.currentFloor;
      if (targetState.dungeon.floors && targetState.dungeon.floors[sess.currentFloor]) {
        ensureDungeonFloorHydrated(targetState.dungeon, sess.currentFloor);
      }
    }
    targetState.hero = JSON.parse(JSON.stringify(sess.hero));
    if (targetState.hero && targetState.hero.equipment) {
      const eqKeys = ['weapon', 'armor', 'helm', 'boots', 'accessory', 'pickaxe'];
      for (let i = 0; i < eqKeys.length; i++) {
        if (targetState.hero.equipment[eqKeys[i]]) {
          normalizeEquipmentSockets(targetState.hero.equipment[eqKeys[i]]);
        }
      }
    }
    targetState.wargameSession = sess.wargameSession
      ? JSON.parse(JSON.stringify(sess.wargameSession))
      : {
          active: true,
          inProcess: true,
          sessionId: sess.sessionId || null,
          playerId: sess.playerId || CANONICAL_PLAYER_ID,
          campaignId: sess.campaignId || null,
          partyUnitId: sess.unitId,
          heroId: sess.heroId || targetState.hero.id,
          dungeonPoiId: sess.poiId || null,
          dungeonId: sess.dungeonId,
          dungeonName: sess.dungeonName || 'The Starfall Vaults',
          dungeonCoords: sess.dungeonCoords || null
        };
    targetState.wargameSession.active = true;
    targetState.wargameSession.inProcess = true;
    targetState.inGuild = false;
    recomputeHeroDerivedStats(false, targetState);
    return { ok: true, hasActiveSession: true, session: sess };
  }

  targetState.inGuild = true;
  if (targetState.wargameSession) {
    targetState.wargameSession.active = false;
    if (!targetState.wargameSession.campaignId && snapshot.campaignId) {
      targetState.wargameSession.campaignId = snapshot.campaignId;
    }
  } else if (snapshot.campaignId) {
    // HR-14 Issue B: Preserve campaignId when surfacing/saving on Overworld so re-entering
    // the same dungeon after save/reload restores explored floors instead of resetting!
    targetState.wargameSession = {
      active: false,
      inProcess: true,
      campaignId: snapshot.campaignId
    };
  }
  return { ok: true, hasActiveSession: false, session: null };
}
