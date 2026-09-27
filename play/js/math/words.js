// Number and math-value words used for read-aloud. Every spoken value is split into short phrases that
// each have a pre-made voice clip (see tools/collect_math.mjs), so math is read aloud fully offline.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
// 0..999 as words (US style, no "and")
export function words999(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error('words999 ' + n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words999(n % 100) : '');
}
// Whole number -> list of spoken phrases. 0..1000 is one phrase; bigger numbers are "<n> thousand" + rest.
export function numPhrases(n) {
  if (!Number.isInteger(n)) throw new Error('numPhrases needs an integer: ' + n);
  if (n < 0) return ['negative', ...numPhrases(-n)];
  if (n <= 999) return [words999(n)];
  if (n === 1000) return ['one thousand'];
  if (n === 1000000) return ['one million'];
  if (n > 999999) throw new Error('numPhrases too big ' + n);
  const th = Math.floor(n / 1000), r = n % 1000;
  return [words999(th) + ' thousand', ...(r ? [words999(r)] : [])];
}
export function numWords(n) { return numPhrases(n).join(' '); }
const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
function ordinal(n) { const w = words999(n); const m = w.match(/^(.*?)([a-z]+)$/); const last = m[2]; const o = n === 2 ? 'half' : ORD[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th'); return m[1] + o; }
const DEN1 = { 100: 'hundredth', 1000: 'thousandth' };
for (let d = 2; d <= 64; d++) DEN1[d] = ordinal(d);
const DENP = { 2: 'halves' };
export const DENOMS = Object.keys(DEN1).map(Number);
export function denWord(d, plural) { if (!DEN1[d]) throw new Error('no denominator word ' + d); return plural ? (DENP[d] || DEN1[d] + 's') : DEN1[d]; }
// a/b -> ["three", "fourths"]; 1/b -> ["one", "fourth"]; negative -> ["negative", ...]
export function fracPhrases(a, b) {
  if (a < 0) return ['negative', ...fracPhrases(-a, b)];
  if (b === 1) return numPhrases(a);
  return [...numPhrases(a), denWord(b, a !== 1)];
}
// whole and a/b -> ["two", "and", "one", "third"]
export function mixedPhrases(w, a, b) { return w ? [...numPhrases(w), 'and', ...fracPhrases(a, b)] : fracPhrases(a, b); }
// decimal string "3.25" -> ["three", "point", "two", "five"]
export function decPhrases(s) {
  s = String(s); let neg = false; if (s[0] === '-') { neg = true; s = s.slice(1); }
  const [w, f] = s.split('.'); const out = neg ? ['negative'] : [];
  out.push(...numPhrases(Number(w)));
  if (f) { out.push('point'); for (const c of f) out.push(ONES[+c]); }
  return out;
}
export function centsPhrases(c) {
  if (c < 100) return [...numPhrases(c), c === 1 ? 'cent' : 'cents'];
  const d = Math.floor(c / 100), r = c % 100;
  return [...numPhrases(d), d === 1 ? 'dollar' : 'dollars', ...(r ? ['and', ...numPhrases(r), r === 1 ? 'cent' : 'cents'] : [])];
}
export function timePhrases(h, m) { return m === 0 ? [...numPhrases(h), 'o’clock'] : m < 10 ? [...numPhrases(h), 'oh', ...numPhrases(m)] : [...numPhrases(h), ...numPhrases(m)]; }
// every value phrase the game can say (for clip generation)
export function allValuePhrases() {
  const s = new Set();
  for (let n = 0; n <= 1000; n++) s.add(numPhrases(n)[0]);
  for (let t = 1; t <= 999; t++) s.add(words999(t) + ' thousand');
  s.add('one million'); s.add('negative'); s.add('point'); s.add('and'); s.add('cent'); s.add('cents'); s.add('dollar'); s.add('dollars'); s.add('o’clock'); s.add('oh');
  for (const d of DENOMS) { s.add(denWord(d, false)); s.add(denWord(d, true)); }
  return [...s];
}
