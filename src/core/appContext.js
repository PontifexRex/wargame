// Focused Application Context & Transition Lifecycle Controller (Task 02)
// Owns only application context ('title' | 'strategy' | 'dungeon'), validated in-process transitions,
// atomicity/rollback, duplicate-reward prevention, and single-initialization guards.

import { CAMPAIGN_PHASES, COMMAND_TYPES, WARGAME_VIEWS } from '../wargame/constants.js';
import {
  bindCanonicalHeroToDungeonState,
  applyDungeonOutcomeToStrategy
} from './entitySyncAdapter.js';

export const APP_CONTEXTS = {
  TITLE: 'title',
  STRATEGY: 'strategy',
  DUNGEON: 'dungeon'
};

export function createAppContextController(options) {
  const opts = options || {};
  const simHost = opts.simHost;
  const dungeonState = opts.dungeonState;
  const onEnsureDungeonInitialized = typeof opts.onEnsureDungeonInitialized === 'function' ? opts.onEnsureDungeonInitialized : null;
  const onContextChanged = typeof opts.onContextChanged === 'function' ? opts.onContextChanged : null;

  let activeContext = (simHost && simHost.state && simHost.state.campaignPhase === CAMPAIGN_PHASES.TITLE)
    ? APP_CONTEXTS.TITLE
    : APP_CONTEXTS.STRATEGY;
  let activeSession = null;
  let dungeonInitialized = false;
  let nextSessionSeq = 0;
  const resolvedSessionIds = {};

  function getActiveContext() {
    return activeContext;
  }

  function getActiveSession() {
    return activeSession;
  }

  function isDungeonInitialized() {
    return dungeonInitialized;
  }

  function syncFromCampaignPhase() {
    if (activeContext === APP_CONTEXTS.DUNGEON) return activeContext;
    const isTitle = !simHost || !simHost.state || simHost.state.campaignPhase === CAMPAIGN_PHASES.TITLE || !simHost.state.world;
    activeContext = isTitle ? APP_CONTEXTS.TITLE : APP_CONTEXTS.STRATEGY;
    return activeContext;
  }

  function setContext(nextContext) {
    if (nextContext !== APP_CONTEXTS.TITLE && nextContext !== APP_CONTEXTS.STRATEGY && nextContext !== APP_CONTEXTS.DUNGEON) {
      return activeContext;
    }
    activeContext = nextContext;
    if (onContextChanged) {
      onContextChanged(activeContext, activeSession);
    }
    return activeContext;
  }

  function enterDungeon(params) {
    const p = params || {};
    if (!simHost || !simHost.state || !simHost.state.world) {
      return { ok: false, reason: 'no_active_world' };
    }
    if (!dungeonState) {
      return { ok: false, reason: 'no_dungeon_state' };
    }
    if (activeContext === APP_CONTEXTS.DUNGEON && activeSession && !activeSession.exitResolved) {
      return { ok: false, reason: 'already_in_dungeon' };
    }

    const enterRes = simHost.dispatch({
      type: COMMAND_TYPES.ENTER_DUNGEON,
      payload: {
        unitId: p.unitId || null,
        poiId: p.poiId || null,
        skipStorageWrite: true
      }
    });

    if (!enterRes || !enterRes.ok) {
      return {
        ok: false,
        reason: (enterRes && enterRes.error) || 'enter_dungeon_rejected'
      };
    }

    const resData = enterRes.data || enterRes.result || {};
    const env = resData.envelope || null;
    const unitId = resData.unitId || p.unitId || null;
    const poiId = resData.poiId || p.poiId || null;
    const dungeonId = resData.dungeonId || 'dng_starfall';
    const heroId = (env && env.hero && env.hero.id) || null;
    const heroClassId = (env && env.hero && env.hero.classId) || 'fighter';

    nextSessionSeq += 1;
    const sessionId = 'dng_sess_' + nextSessionSeq;

    let syncRes = null;
    try {
      if (p.simulateSyncFailure) {
        throw new Error('simulated_sync_failure');
      }
      syncRes = bindCanonicalHeroToDungeonState(simHost, dungeonState, {
        sessionId: sessionId,
        partyUnitId: unitId,
        heroId: heroId,
        heroClassId: heroClassId,
        dungeon: env && env.dungeon ? env.dungeon : {
          poiId: poiId,
          dungeonId: dungeonId,
          profileId: 'starfall_vaults',
          name: 'The Starfall Vaults',
          coords: null
        }
      });
    } catch (err) {
      syncRes = { ok: false, reason: (err && err.message) || 'dungeon_sync_exception' };
    }

    if (!syncRes || !syncRes.ok) {
      // Atomic rollback: restore unit to idle on surface and stay in Strategy context
      simHost.dispatch({
        type: COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE,
        payload: { unitId: unitId }
      });
      activeSession = null;
      activeContext = APP_CONTEXTS.STRATEGY;
      if (onContextChanged) {
        onContextChanged(activeContext, null);
      }
      return { ok: false, reason: (syncRes && syncRes.reason) || 'dungeon_sync_failed', rolledBack: true };
    }

    if (!dungeonInitialized && onEnsureDungeonInitialized) {
      onEnsureDungeonInitialized();
      dungeonInitialized = true;
    }

    activeSession = {
      sessionId: sessionId,
      unitId: unitId,
      heroId: syncRes.heroId || heroId,
      poiId: poiId,
      dungeonId: syncRes.dungeonId || dungeonId,
      exitResolved: false
    };
    activeContext = APP_CONTEXTS.DUNGEON;

    if (onContextChanged) {
      onContextChanged(activeContext, activeSession);
    }

    return {
      ok: true,
      sessionId: sessionId,
      unitId: unitId,
      heroId: activeSession.heroId,
      dungeonId: activeSession.dungeonId
    };
  }

  function exitDungeon(outcomePayload) {
    const incomingSessionId = (outcomePayload && outcomePayload.sessionId)
      || (activeSession && activeSession.sessionId)
      || null;

    if (incomingSessionId && resolvedSessionIds[incomingSessionId]) {
      return { ok: false, reason: 'duplicate_session_exit', duplicate: true };
    }
    if (activeSession && activeSession.exitResolved) {
      return { ok: false, reason: 'already_resolved', duplicate: true };
    }

    if (incomingSessionId) {
      resolvedSessionIds[incomingSessionId] = true;
    }
    if (activeSession) {
      activeSession.exitResolved = true;
    }

    let applyRes = null;
    if (outcomePayload && typeof outcomePayload === 'object') {
      applyRes = applyDungeonOutcomeToStrategy(simHost, outcomePayload);
    } else if (activeSession && activeSession.unitId && simHost) {
      const surf = simHost.dispatch({
        type: COMMAND_TYPES.EXIT_DUNGEON_TO_SURFACE,
        payload: { unitId: activeSession.unitId }
      });
      applyRes = { ok: Boolean(surf && surf.ok), result: surf ? surf.result : null };
    } else {
      applyRes = { ok: true, result: null };
    }

    if (dungeonState && dungeonState.wargameSession) {
      dungeonState.wargameSession.active = false;
    }

    const finishedSession = activeSession;
    activeSession = null;
    activeContext = APP_CONTEXTS.STRATEGY;
    if (simHost && simHost.state) {
      simHost.state.activeView = WARGAME_VIEWS.OVERWORLD;
      simHost.state._openFacilityId = null;
      simHost.state._openHeroSheetId = null;
      simHost.state._dirty = true;
      simHost.save();
    }

    if (onContextChanged) {
      onContextChanged(activeContext, null);
    }

    return {
      ok: Boolean(applyRes && applyRes.ok),
      sessionId: incomingSessionId,
      outcome: outcomePayload ? outcomePayload.outcome : 'surfaced',
      session: finishedSession,
      strategyResult: applyRes ? applyRes.result : null
    };
  }

  return {
    getActiveContext: getActiveContext,
    getActiveSession: getActiveSession,
    isDungeonInitialized: isDungeonInitialized,
    syncFromCampaignPhase: syncFromCampaignPhase,
    setContext: setContext,
    enterDungeon: enterDungeon,
    exitDungeon: exitDungeon
  };
}
