// "Let's find your starting spot!" A short adaptive quiz. It is a quick starting-point estimate, not a formal assessment.
// Each strand is a small staircase: start near the age-expected level, go up after a correct answer, down after a miss.
// A strand stops when it is bracketed (a pass at L and a miss at L+1) plus one confirming item, or after 4 items.
import { STRANDS, STRAND_ORDER, skillsNear } from './skills.js';

// Typical school grade by age: 5 -> K (level 1), 6 -> Grade 1 (level 2) ... 9 -> Grade 4 (level 5).
export const gradeForAge = age => Math.max(0, Math.min(9, Math.round(age) - 4));
// The quiz starts one level below the typical grade so the first questions feel easy: age 9 starts at Grade 3 (level 4).
export const startLevel = age => Math.max(0, Math.min(9, Math.round(age) - 5));
export function strandsFor(age, maxLv) {
  return STRAND_ORDER.filter(s => { const st = STRANDS[s]; if (s === 'alg') return age >= 11 || maxLv >= 7; return st.min <= Math.max(maxLv, 0) + 1; });
}
export class Placement {
  constructor(age, rnd = Math.random, o = {}) {
    this.age = age; this.rnd = rnd; this.maxItems = o.maxItems || 4;
    const L0 = startLevel(age); this.base = L0; // age 9 -> 4 (Grade 3)
    this.strands = strandsFor(age, L0).map(s => ({ s, lv: Math.max(STRANDS[s].min, Math.min(STRANDS[s].max, L0)), passed: -1, failed: 99, n: 0, done: false, log: [] }));
    this.i = 0; this.total = 0;
  }
  // the next item {strand, skillId} or null when finished
  next() {
    const open = this.strands.filter(x => !x.done); if (!open.length) return null;
    const st = open[this.i++ % open.length]; this.cur = st;
    const pool = skillsNear(st.s, st.lv); const sk = pool[Math.floor(this.rnd() * pool.length)];
    return { strand: st.s, lv: sk.lv, id: sk.id };
  }
  answer(ok, lv = this.cur.lv) {
    const st = this.cur; st.n++; this.total++; st.log.push({ lv, ok });
    const S = STRANDS[st.s];
    if (ok) { st.passed = Math.max(st.passed, lv); if (lv >= S.max) st.done = st.log.filter(x => x.ok && x.lv >= S.max).length >= 1 && st.n >= 2 || st.n >= this.maxItems; st.lv = Math.min(S.max, lv + 1); }
    else { st.failed = Math.min(st.failed, lv); if (lv <= S.min) st.done = st.n >= 2 || st.log.filter(x => !x.ok && x.lv <= S.min).length >= 2; st.lv = Math.max(S.min, lv - 1); }
    // bracketed (pass at L, miss at L+1) and at least one confirming item
    if (st.failed === st.passed + 1 && st.n >= 3) st.done = true;
    if (st.n >= this.maxItems) st.done = true;
  }
  get finished() { return this.strands.every(x => x.done); }
  get progress() { const est = this.strands.length * 3; return Math.min(1, this.total / est); }
  // placement per strand = highest level passed (or one below the lowest miss / strand minimum)
  result() {
    const out = {};
    for (const st of this.strands) { const S = STRANDS[st.s]; let p = st.passed >= 0 ? st.passed : Math.max(S.min, Math.min(st.failed, st.lv) - 1); if (st.failed <= p) p = Math.max(S.min, st.failed - 1); out[st.s] = Math.max(0, Math.min(S.max, p)); }
    return out;
  }
}
