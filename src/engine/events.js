// Synchronous Domain Event Bus & Gameplay Telemetry Dispatcher (ADR-0006)
// Decouples engine state mutations from UI/Audio side effects and provides telemetry hooks for Bestiary/Codex tracking.

export const ENGINE_EVENTS = {
  LOG:              'log',
  FLOATING_TEXT:    'floatingText',
  OUTCOME_MODAL:    'outcomeModal',
  UI_SYNC:          'uiSync',
  FOV_SYNC:         'fovSync',
  TURN_END:         'turnEnd',
  MONSTER_SLAIN:    'monsterSlain',
  ORE_MINED:        'oreMined',
  CHEST_OPENED:     'chestOpened',
  SHRINE_ACTIVATED: 'shrineActivated',
  TRAP_RESOLVED:    'trapResolved',
  EXTRACTED:        'extracted',
  HERO_DEFEATED:    'heroDefeated',
  OBJECT_INTERACTION:  'objectInteraction',
  OBJECT_STATE_CHANGED:'objectStateChanged',
  ITEM_PICKED_UP:      'itemPickedUp',
  ITEM_DROPPED:        'itemDropped',
  PORTAL_TRAVERSED:    'portalTraversed',
  WAYPOINT_DISCOVERED: 'waypointDiscovered'
};

const eventListenersMap = {};

export function onEngineEvent(eventName, handler) {
  if (!eventName || typeof handler !== 'function') {
    return () => {};
  }
  if (!eventListenersMap[eventName]) {
    eventListenersMap[eventName] = [];
  }
  if (eventListenersMap[eventName].indexOf(handler) === -1) {
    eventListenersMap[eventName].push(handler);
  }
  return function unsubscribe() {
    offEngineEvent(eventName, handler);
  };
}

export function offEngineEvent(eventName, handler) {
  const list = eventListenersMap[eventName];
  if (!list) return;
  const idx = list.indexOf(handler);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
}

export function emitEngineEvent(eventName, payload, state = null) {
  const list = eventListenersMap[eventName];
  if (!list || list.length === 0) return 0;
  const snapshot = list.slice();
  for (let i = 0; i < snapshot.length; i++) {
    snapshot[i](payload, state);
  }
  return snapshot.length;
}

export function clearEngineEventListeners(eventName = null) {
  if (eventName) {
    delete eventListenersMap[eventName];
    return;
  }
  Object.keys(eventListenersMap).forEach(k => {
    delete eventListenersMap[k];
  });
}
