// Deterministic Seeded PRNG (Mulberry32) & Seed String Hashing

export function hashSeedString(seedStr, salt = 0) {
  const str = String(seedStr || 'STAR-1000') + ':' + String(salt);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

export function createSeededRng(numericSeed) {
  let state = (numericSeed >>> 0) || 1;
  return function nextRand() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeedCode(prefix = 'STAR') {
  const num = 1000 + Math.floor(Math.random() * 8999);
  return `${prefix}-${num}`;
}
