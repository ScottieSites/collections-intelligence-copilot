// Mulberry32 seeded PRNG — fast, high-quality distribution, fully deterministic
export class SeededRNG {
  constructor(seed = 42) {
    this.seed = seed >>> 0
  }

  next() {
    this.seed |= 0
    this.seed = (this.seed + 0x6D2B79F5) | 0
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  float(min, max) {
    return this.next() * (max - min) + min
  }

  pick(arr) {
    return arr[this.int(0, arr.length - 1)]
  }

  pickN(arr, n) {
    const copy = [...arr]
    const result = []
    for (let i = 0; i < Math.min(n, copy.length); i++) {
      const idx = this.int(0, copy.length - 1 - i)
      result.push(copy[idx])
      copy[idx] = copy[copy.length - 1 - i]
    }
    return result
  }

  // Weighted pick: [{value, weight}, ...]
  pickWeighted(options) {
    const total = options.reduce((s, o) => s + o.weight, 0)
    let r = this.next() * total
    for (const o of options) {
      r -= o.weight
      if (r <= 0) return o.value
    }
    return options[options.length - 1].value
  }

  chance(prob) {
    return this.next() < prob
  }

  // Integer that looks like a date day for the given month
  day(month) {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return this.int(1, days[month - 1])
  }
}
