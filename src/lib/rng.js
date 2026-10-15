/**
 * Deterministic Pseudorandom Number Generator (Mulberry32)
 * Allows seeded, reproducible card shuffling, AI randomness, and test repeatability.
 */
export class SeededRNG {
  constructor(seed = Date.now()) {
    this.seed = typeof seed === 'number' ? seed : this.hashString(String(seed));
    this.state = this.seed >>> 0;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  /** Returns a float in [0, 1) */
  random() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  randInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /** In-place Fisher-Yates array shuffle */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export const defaultRNG = new SeededRNG();
