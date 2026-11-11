// WorldEventStream — Replayable Ring-Buffer Event Stream & Pub/Sub Dispatcher
// Designed for real-time strategy event streaming, late-joining client replay, and reactive Task DAG evaluation.

export function createWorldEventStream(maxBufferSize = 500) {
  let nextSeqId = 1;
  const ringBuffer = [];
  const topicListeners = {};
  const wildcardListeners = [];

  function publish(topic, payload = {}, simTimeMs = 0) {
    const eventEnvelope = {
      seqId: nextSeqId++,
      topic: String(topic),
      timestamp: Date.now(),
      simTimeMs: typeof simTimeMs === 'number' ? simTimeMs : 0,
      payload: payload || {}
    };

    ringBuffer.push(eventEnvelope);
    if (ringBuffer.length > maxBufferSize) {
      ringBuffer.shift();
    }

    // Notify specific topic subscribers
    const subs = topicListeners[eventEnvelope.topic];
    if (subs && subs.length > 0) {
      const snapshot = subs.slice();
      for (let i = 0; i < snapshot.length; i++) {
        snapshot[i](eventEnvelope);
      }
    }

    // Notify wildcard ('*') subscribers
    if (wildcardListeners.length > 0) {
      const wildSnap = wildcardListeners.slice();
      for (let w = 0; w < wildSnap.length; w++) {
        wildSnap[w](eventEnvelope);
      }
    }

    return eventEnvelope;
  }

  function subscribe(topicOrTopics, handler) {
    if (typeof handler !== 'function') return function noop() {};

    if (topicOrTopics === '*') {
      if (wildcardListeners.indexOf(handler) === -1) {
        wildcardListeners.push(handler);
      }
      return function unsubscribeWild() {
        const idx = wildcardListeners.indexOf(handler);
        if (idx !== -1) wildcardListeners.splice(idx, 1);
      };
    }

    const topics = Array.isArray(topicOrTopics) ? topicOrTopics : [topicOrTopics];
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      if (!topicListeners[t]) topicListeners[t] = [];
      if (topicListeners[t].indexOf(handler) === -1) {
        topicListeners[t].push(handler);
      }
    }

    return function unsubscribeTopics() {
      for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        const list = topicListeners[t];
        if (list) {
          const idx = list.indexOf(handler);
          if (idx !== -1) list.splice(idx, 1);
        }
      }
    };
  }

  function getEventsSince(lastSeqId = 0, filterTopic = null) {
    const result = [];
    for (let i = 0; i < ringBuffer.length; i++) {
      const ev = ringBuffer[i];
      if (ev.seqId > lastSeqId) {
        if (!filterTopic || ev.topic === filterTopic || ev.topic.indexOf(filterTopic) === 0) {
          result.push(ev);
        }
      }
    }
    return result;
  }

  function getRecentEvents(limit = 50, filterPrefix = null) {
    const matched = [];
    for (let i = ringBuffer.length - 1; i >= 0; i--) {
      const ev = ringBuffer[i];
      if (!filterPrefix || ev.topic.indexOf(filterPrefix) === 0) {
        matched.push(ev);
        if (matched.length >= limit) break;
      }
    }
    return matched.reverse();
  }

  function getCursor() {
    return nextSeqId - 1;
  }

  function clear() {
    ringBuffer.length = 0;
  }

  return {
    publish: publish,
    subscribe: subscribe,
    getEventsSince: getEventsSince,
    getRecentEvents: getRecentEvents,
    getCursor: getCursor,
    clear: clear
  };
}
