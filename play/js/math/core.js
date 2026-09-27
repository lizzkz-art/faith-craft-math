// Core helpers for the math engine: random numbers, spoken/displayed text builder, value types.
import { numPhrases, fracPhrases, mixedPhrases, decPhrases, centsPhrases, timePhrases } from './words.js';

// ---- random (replaceable with a seeded generator for the checker) ----
let rnd = Math.random;
export function setRandom(f) { rnd = f || Math.random; }
export function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)); // integer in [a, b]
export const pick = arr => arr[Math.floor(rnd() * arr.length)];
export const chance = p => rnd() < p;
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => a / gcd(a, b) * b;

// ---- display formatting ----
export const fmt = n => { const neg = n < 0; const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (neg ? '−' : '') + s; };
// decimal from an integer count of 1/10^places, e.g. dec(375, 2) = "3.75"
export function decStr(units, places) { const neg = units < 0; units = Math.abs(units); const p = 10 ** places; const w = Math.floor(units / p); let f = String(units % p).padStart(places, '0'); return (neg ? '-' : '') + w + (places ? '.' + f : ''); }
export const trimDec = s => s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
export const money = c => '$' + Math.floor(c / 100) + '.' + String(c % 100).padStart(2, '0');
export const clock = (h, m) => h + ':' + String(m).padStart(2, '0');

// ---- values: something that is shown one way and read aloud as clip phrases ----
// k: n (integer), fr (fraction), mx (mixed number), dec (decimal string), usd (cents), tm (time), qr (quotient+remainder), w (word)
export const N = v => ({ k: 'n', v, d: fmt(v), s: numPhrases(v).map(x => ({ v: x })) });
export const FR = (a, b) => ({ k: 'fr', a, b, d: (a < 0 ? '−' : '') + Math.abs(a) + '/' + b, s: fracPhrases(a, b).map(x => ({ v: x })) });
export const MX = (w, a, b) => ({ k: 'mx', w, a, b, d: w ? (a ? w + ' ' + a + '/' + b : String(w)) : a + '/' + b, s: (a ? mixedPhrases(w, a, b) : numPhrases(w)).map(x => ({ v: x })) });
export const DEC = s => ({ k: 'dec', v: s, d: s.replace('-', '−'), s: decPhrases(s).map(x => ({ v: x })) });
export const USD = c => ({ k: 'usd', v: c, d: c < 100 ? c + '¢' : money(c), s: centsPhrases(c).map(x => ({ v: x })) });
export const USD$ = c => ({ ...USD(c), d: money(c) }); // always $0.45 style
export const TM = (h, m) => ({ k: 'tm', h, m, d: clock(h, m), s: timePhrases(h, m).map(x => ({ v: x })) });
export const QR = (q, r) => ({ k: 'qr', q, r, d: r ? fmt(q) + ' R ' + r : fmt(q), s: [...numPhrases(q).map(x => ({ v: x })), ...(r ? [{ t: 'remainder' }, ...numPhrases(r).map(x => ({ v: x }))] : [])] });
export const W = (d, s) => ({ k: 'w', d, s: [{ t: s == null ? d : s }] }); // word answer, spoken as a phrase clip
export const SYM = { '×': 'times', '÷': 'divided by', '+': 'plus', '−': 'minus', '=': 'equals', '<': 'is less than', '>': 'is greater than', '?': 'what number', '≈': 'is about' };
export const S = d => ({ k: 'sym', d, s: [{ t: SYM[d] || d }] });      // a math symbol
export const DS = (d, s) => ({ k: 'ds', d, s: s ? [{ t: s }] : [] });  // shown as d, read as s (or silent)
export const SAY = s => ({ k: 'ds', d: '', s: [{ t: s }] });          // read, not shown
export const valKey = v => v.k === 'n' ? 'n:' + v.v : v.k === 'fr' ? 'fr:' + v.a + '/' + v.b : v.k === 'mx' ? 'mx:' + v.w + ' ' + v.a + '/' + v.b : v.k === 'dec' ? 'dec:' + trimDec(v.v) : v.k === 'usd' ? 'usd:' + v.v : v.k === 'tm' ? 'tm:' + v.h + ':' + v.m : v.k === 'qr' ? 'qr:' + v.q + 'r' + v.r : 'w:' + v.d;

// P(...) builds {text, say}. Strings are shown and read aloud as-is (each string is one voice clip).
// Values (N, FR, ...) are shown formatted and read as number phrases.
export function P(...parts) {
  let text = ''; const say = [];
  for (const p of parts.flat()) {
    if (p == null || p === false) continue;
    if (typeof p === 'string' || typeof p === 'number') {
      const s = String(p); text += s;
      const t = s.trim(); if (t && /[A-Za-z0-9]/.test(t)) say.push({ t });
    } else if (p.say && p.text != null) { text += p.text; say.push(...p.say); } // nested P
    else { text += p.d; say.push(...p.s); }
  }
  return { text: text.replace(/\s+/g, ' ').replace(/ ([?.!,:;])/g, '$1').trim(), say };
}
// problem helper
export function prob(o) { return { input: 'choice', steps: [], ...o }; }

// Distractors for a numeric answer (whole numbers). Always unique, never the answer, never negative unless allowed.
export function numChoices(ans, { n = 4, spread = null, neg = false, extra = [] } = {}) {
  const set = new Set([ans]); const out = [ans];
  const sp = spread || Math.max(2, Math.round(Math.abs(ans) * 0.12));
  const cands = [...extra, ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, ans + sp, ans - sp, ans + 100, ans - 100];
  for (const c of shuffle(cands.slice(extra.length)).concat()) { }
  const tryAdd = c => { if (out.length >= n) return; if (!Number.isInteger(c) || set.has(c) || (!neg && c < 0)) return; set.add(c); out.push(c); };
  extra.forEach(tryAdd); shuffle(cands.slice(extra.length)).forEach(tryAdd);
  let k = 3; while (out.length < n) { tryAdd(ans + k); tryAdd(ans - k); k++; }
  return shuffle(out).map(N);
}
