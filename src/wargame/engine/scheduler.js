// Binary Min-Heap Priority Queue Scheduler & Real-Time Simulation Clock
// Provides O(log N) scheduling for thousands of concurrent timers (building completions, unit march steps, resource ticks).

export function createMinHeapPriorityQueue() {
  const heap = [];

  function compare(a, b) {
    if (a.dueSimTimeMs !== b.dueSimTimeMs) {
      return a.dueSimTimeMs - b.dueSimTimeMs;
    }
    return a.seq - b.seq;
  }

  function siftUp(idx) {
    let i = idx;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (compare(heap[i], heap[parent]) < 0) {
        const tmp = heap[i];
        heap[i] = heap[parent];
        heap[parent] = tmp;
        i = parent;
      } else {
        break;
      }
    }
  }

  function siftDown(idx) {
    let i = idx;
    const len = heap.length;
    while (true) {
      const left = (i << 1) + 1;
      const right = left + 1;
      let smallest = i;

      if (left < len && compare(heap[left], heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && compare(heap[right], heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== i) {
        const tmp = heap[i];
        heap[i] = heap[smallest];
        heap[smallest] = tmp;
        i = smallest;
      } else {
        break;
      }
    }
  }

  function push(item) {
    heap.push(item);
    siftUp(heap.length - 1);
  }

  function peek() {
    return heap.length > 0 ? heap[0] : null;
  }

  function pop() {
    if (heap.length === 0) return null;
    const top = heap[0];
    const bottom = heap.pop();
    if (heap.length > 0) {
      heap[0] = bottom;
      siftDown(0);
    }
    return top;
  }

  function removeById(jobId) {
    for (let i = 0; i < heap.length; i++) {
      if (heap[i].jobId === jobId) {
        const removed = heap[i];
        const bottom = heap.pop();
        if (i < heap.length) {
          heap[i] = bottom;
          siftUp(i);
          siftDown(i);
        }
        return removed;
      }
    }
    return null;
  }

  function toArray() {
    return heap.slice().sort(compare);
  }

  function size() {
    return heap.length;
  }

  function clear() {
    heap.length = 0;
  }

  return {
    push: push,
    peek: peek,
    pop: pop,
    removeById: removeById,
    toArray: toArray,
    size: size,
    clear: clear
  };
}

export function createSimulationScheduler() {
  const pq = createMinHeapPriorityQueue();
  let jobSeq = 1;

  function scheduleJob(jobConfig) {
    const job = {
      jobId: jobConfig.jobId || ('job_' + jobSeq),
      seq: jobSeq++,
      jobType: jobConfig.jobType || 'generic',
      ownerId: jobConfig.ownerId || null,
      startSimTimeMs: jobConfig.startSimTimeMs || 0,
      dueSimTimeMs: jobConfig.dueSimTimeMs || 0,
      durationMs: Math.max(1, (jobConfig.dueSimTimeMs || 0) - (jobConfig.startSimTimeMs || 0)),
      payload: jobConfig.payload || {}
    };
    pq.push(job);
    return job;
  }

  function cancelJob(jobId) {
    return pq.removeById(jobId);
  }

  function popDueJobs(currentSimTimeMs) {
    const due = [];
    while (pq.size() > 0) {
      const next = pq.peek();
      if (next.dueSimTimeMs <= currentSimTimeMs) {
        due.push(pq.pop());
      } else {
        break;
      }
    }
    return due;
  }

  function getJobsForOwner(ownerId, jobType = null) {
    const all = pq.toArray();
    return all.filter(function(j) {
      if (ownerId && j.ownerId !== ownerId) return false;
      if (jobType && j.jobType !== jobType) return false;
      return true;
    });
  }

  function serializeJobs() {
    return pq.toArray();
  }

  function hydrateJobs(jobsArray) {
    pq.clear();
    if (!Array.isArray(jobsArray)) return;
    for (let i = 0; i < jobsArray.length; i++) {
      const j = jobsArray[i];
      if (j && typeof j.dueSimTimeMs === 'number') {
        if (typeof j.seq === 'number' && j.seq >= jobSeq) {
          jobSeq = j.seq + 1;
        }
        pq.push(j);
      }
    }
  }

  return {
    scheduleJob: scheduleJob,
    cancelJob: cancelJob,
    popDueJobs: popDueJobs,
    getJobsForOwner: getJobsForOwner,
    serializeJobs: serializeJobs,
    hydrateJobs: hydrateJobs,
    size: pq.size,
    clear: pq.clear
  };
}
