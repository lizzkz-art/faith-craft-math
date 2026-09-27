// The skill bank. Every problem is generated from random numbers, so there is always something new.
// Each problem carries `data` that the automated checker (tools/check_math.mjs) uses to re-compute the answer
// independently. Levels: 0 Pre-K, 1 K, 2 Grade 1 ... 9 Grade 8.
import { DENOMS } from './words.js';
import { P, N, FR, MX, DEC, USD, USD$, TM, QR, W, S, DS, SAY, ri, pick, chance, shuffle, gcd, lcm, fmt, decStr, trimDec, numChoices, prob } from './core.js';

export const LEVELS = ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
export const LEVEL_SHORT = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
export const STRANDS = {
  num: { name: 'Number sense and counting', short: 'Numbers', min: 0, max: 9 },
  add: { name: 'Addition and subtraction', short: 'Add & subtract', min: 0, max: 5 },
  mul: { name: 'Multiplication and division', short: 'Multiply & divide', min: 3, max: 7 },
  frac: { name: 'Fractions and decimals', short: 'Fractions & decimals', min: 2, max: 8 },
  meas: { name: 'Measurement, time, and money', short: 'Measure, time & money', min: 0, max: 9 },
  geo: { name: 'Geometry', short: 'Geometry', min: 0, max: 9 },
  alg: { name: 'Pre-algebra and algebra (grades 6–8)', short: 'Algebra', min: 7, max: 9 },
};
export const STRAND_ORDER = ['num', 'add', 'mul', 'frac', 'meas', 'geo', 'alg'];

const ICONS = ['sheep', 'cow', 'dove', 'fish', 'bread', 'stones'];
const ICON_WORD = { sheep: ['sheep', 'sheep'], cow: ['cow', 'cows'], dove: ['dove', 'doves'], fish: ['fish', 'fish'], bread: ['loaf', 'loaves'], stones: ['stone', 'stones'] };
const iw = (ic, n) => ICON_WORD[ic][n === 1 ? 0 : 1];
const E = { add: (a, b) => ['+', a, b], sub: (a, b) => ['-', a, b], mul: (a, b) => ['*', a, b], div: (a, b) => ['/', a, b] };
const uniq = (arr, key = x => x.join('/')) => { const seen = new Set(), out = []; for (const x of arr) { const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } } return out; };
const ratKey = ([a, b]) => { const g = gcd(a, b) || 1; return a / g + '/' + b / g; };
const redOK = ([a, b]) => { const g = gcd(a, b) || 1; const d = b / g; return d === 1 || DENOMS.includes(d); };
const redFR = ([a, b]) => { const g = gcd(a, b) || 1; return FR(a / g, b / g); };
const again = id => SKILL[id].gen();
const CMP = [W('<', 'less than'), W('=', 'equal to'), W('>', 'greater than')];
const cmpW = v => v > 0 ? W('>', 'greater than') : v < 0 ? W('<', 'less than') : W('=', 'equal to');
const eq = (...xs) => P(...xs);

function arith(a, op, b, steps, extra = []) {
  const r = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  const e = op === '+' ? E.add(a, b) : op === '−' ? E.sub(a, b) : op === '×' ? E.mul(a, b) : E.div(a, b);
  const ex = op === '×' ? [a * (b + 1), a * (b - 1), ...extra] : extra;
  return prob({ q: P('What is ', N(a), ' ', S(op), ' ', N(b), '?'), ans: N(r), choices: numChoices(r, { extra: ex.filter(x => x !== r && x >= 0) }), num: true, data: { e },
    steps: steps || [P(N(a), ' ', S(op), ' ', N(b), ' ', S('='), ' ', N(r))] });
}
const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];

export const SKILLS = [];
const add = (id, s, lv, name, gen, o = {}) => SKILLS.push({ id, s, lv, name, gen, ...o });
// ===== Pre-K =====
add('pk.count5', 'num', 0, 'Count up to 5 things', () => {
  const n = ri(1, 5), ic = pick(ICONS);
  return prob({ q: P('How many ', iw(ic, 2), ' do you see? Count them.'), vis: { t: 'count', n, icon: ic }, ans: N(n), choices: numChoices(n, { n: 3, spread: 1 }), data: { count: n }, dots: true,
    hint: P('Touch each one as you count them.'), steps: [P('Count them one at a time. There are ', N(n), '.')] });
});
add('pk.more', 'num', 0, 'Which group has more', () => {
  let a = ri(1, 5), b = ri(1, 5); while (a === b) b = ri(1, 5); const ic = pick(ICONS);
  return prob({ q: P('Which group has more ', iw(ic, 2), '?'), vis: { t: 'two', a, b, icon: ic }, ans: W(a > b ? 'Group A' : 'Group B'), choices: [W('Group A'), W('Group B')], data: { more: [a, b] },
    hint: P('Count each group. Which number is bigger?'), steps: [P('Group A has ', N(a), '. Group B has ', N(b), '.'), P(a > b ? 'Group A' : 'Group B', ' has more.')] });
});
add('pk.join', 'add', 0, 'Put together small groups', () => {
  const a = ri(1, 3), b = ri(1, 2), ic = pick(['sheep', 'dove', 'fish']);
  return prob({ q: P('There ', a === 1 ? 'is' : 'are', ' ', N(a), ' ', iw(ic, a), '. ', N(b), ' more ', b === 1 ? 'comes.' : 'come.', ' How many now?'), vis: { t: 'count', n: a + b, icon: ic, split: a }, ans: N(a + b), choices: numChoices(a + b, { n: 3, spread: 1 }), data: { e: E.add(a, b) }, dots: true,
    hint: P('Count all of them together.'), steps: [P(N(a), ' and ', N(b), ' more make ', N(a + b), '.')] });
});
const SHAPES0 = ['circle', 'square', 'triangle', 'rectangle'];
const SHAPE_HINT = { circle: 'A circle is round.', triangle: 'A triangle has 3 sides.', square: 'A square has 4 sides that are all the same.', rectangle: 'A rectangle has 4 sides. Two are long and two are short.' };
add('pk.shape', 'geo', 0, 'Name basic shapes', () => {
  const sh = pick(SHAPES0); const ch = shuffle([sh, ...shuffle(SHAPES0.filter(x => x !== sh)).slice(0, 2)]);
  return prob({ q: P('Tap the ', sh, '.'), ans: W(sh), choices: ch.map(x => W(x)), shapeChoices: true, data: { tbl: 'shapeName', key: sh },
    hint: P(SHAPE_HINT[sh]), steps: [P('This is the ', sh, '.')] });
});
add('pk.pattern', 'geo', 0, 'What comes next in a pattern', () => {
  const [x, y] = shuffle(['red', 'blue', 'yellow', 'green']).slice(0, 2); const len = ri(4, 5); const seq = Array.from({ length: len }, (_, i) => i % 2 ? y : x); const nx = len % 2 ? y : x;
  return prob({ q: P('What color comes next?'), vis: { t: 'pattern', seq }, ans: W(nx), choices: [W(x), W(y)], colorChoices: true, data: { pattern: seq },
    hint: P('Say the colors out loud. What color is always after ', seq[len - 1], '?'), steps: [P('The pattern goes ', x, ', ', y, ', ', x, ', ', y, '.'), P('Next is ', nx, '.')] });
});
add('pk.bigger', 'meas', 0, 'Longer and shorter', () => {
  const which = pick(['longer', 'shorter']); let a = ri(2, 9), b = ri(2, 9); while (Math.abs(a - b) < 3) b = ri(2, 9);
  const good = which === 'longer' ? (a > b ? 'Stick A' : 'Stick B') : (a < b ? 'Stick A' : 'Stick B');
  return prob({ q: P('Which stick is ', which, '?'), vis: { t: 'sticks', a, b }, ans: W(good), choices: [W('Stick A'), W('Stick B')], data: { stick: [a, b, which] },
    hint: P('Look at where each stick ends.'), steps: [P(good, ' is ', which, '.')] });
});
// ===== Kindergarten =====
add('k.count20', 'num', 1, 'Count up to 20', () => {
  const n = ri(6, 20), ic = pick(ICONS);
  return prob({ q: P('How many ', iw(ic, 2), '? Count them.'), vis: { t: 'count', n, icon: ic, frames: true }, ans: N(n), choices: numChoices(n, { spread: 1 }), data: { count: n }, dots: n <= 10,
    hint: P('Count one full row of ten first, then keep going.'), steps: [n > 10 ? P('Ten and ', N(n - 10), ' more make ', N(n), '.') : P('There are ', N(n), '.')] });
});
add('k.after', 'num', 1, 'What number comes next', () => {
  const n = ri(1, 19);
  return prob({ q: P('What number comes right after ', N(n), '?'), vis: { t: 'numline', min: Math.max(0, n - 3), max: n + 3, mark: n }, ans: N(n + 1), choices: numChoices(n + 1, { spread: 1, extra: [n - 1] }), data: { e: E.add(n, 1) },
    hint: P('Count up from ', N(n), '.'), steps: [P('After ', N(n), ' comes ', N(n + 1), '.')] });
});
add('k.compare', 'num', 1, 'Which number is bigger', () => {
  let a = ri(0, 10), b = ri(0, 10); while (a === b) b = ri(0, 10);
  return prob({ q: P('Which number is bigger?'), ans: N(Math.max(a, b)), choices: [N(a), N(b)], data: { max: [a, b] },
    hint: P('Which number comes later when you count?'), steps: [P(N(Math.max(a, b)), ' is bigger than ', N(Math.min(a, b)), '.')] });
});
add('k.add10', 'add', 1, 'Add within 10', () => {
  const a = ri(0, 7), b = ri(1, 10 - a), ic = pick(ICONS);
  return prob({ q: P('What is ', N(a), ' ', S('+'), ' ', N(b), '?'), vis: { t: 'count', n: a + b, icon: ic, split: a }, ans: N(a + b), choices: numChoices(a + b, { spread: 1 }), data: { e: E.add(a, b) }, fact: 'a' + Math.min(a, b) + '+' + Math.max(a, b),
    hint: P('Start at ', N(a), ' and count on ', N(b), ' more.'), steps: [P(N(a), ' ', S('+'), ' ', N(b), ' ', S('='), ' ', N(a + b))] });
}, { factKind: 'add' });
add('k.sub10', 'add', 1, 'Subtract within 10', () => {
  const a = ri(2, 10), b = ri(1, a), ic = pick(ICONS);
  return prob({ q: P('What is ', N(a), ' ', S('−'), ' ', N(b), '?'), vis: { t: 'count', n: a, icon: ic, cross: b }, ans: N(a - b), choices: numChoices(a - b, { spread: 1 }), data: { e: E.sub(a, b) },
    hint: P('Start with ', N(a), '. Take away ', N(b), '. How many are left?'), steps: [P(N(a), ' ', S('−'), ' ', N(b), ' ', S('='), ' ', N(a - b))] });
});
add('k.make10', 'add', 1, 'Make 10', () => {
  const a = ri(1, 9);
  return prob({ q: P(N(a), ' and what number make ten?'), vis: { t: 'tenframe', n: a }, ans: N(10 - a), choices: numChoices(10 - a, { spread: 1 }), data: { e: E.sub(10, a) },
    hint: P('Count the empty boxes in the ten-frame.'), steps: [P(N(a), ' ', S('+'), ' ', N(10 - a), ' ', S('='), ' ', N(10))] });
});
const SIDES = { triangle: 3, square: 4, rectangle: 4, quadrilateral: 4, pentagon: 5, hexagon: 6, octagon: 8 };
add('k.shapes', 'geo', 1, 'Shapes and their sides', () => {
  const sh = pick(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']); const n = SIDES[sh];
  return prob({ q: P('How many sides does a ', sh, ' have?'), vis: { t: 'shape', name: sh }, ans: N(n), choices: numChoices(n, { spread: 1 }), data: { tbl: 'sides', key: sh },
    hint: P('Count the straight sides with your finger.'), steps: [P('A ', sh, ' has ', N(n), ' sides.')] });
});
add('k.solid', 'geo', 1, 'Solid shapes', () => {
  const all = ['cube', 'sphere', 'cylinder', 'cone']; const sh = pick(all); const ch = shuffle([sh, ...shuffle(all.filter(x => x !== sh)).slice(0, 2)]);
  const hint = { sphere: 'It is round like a ball.', cube: 'It looks like a block.', cone: 'It has a point on top.', cylinder: 'It looks like a can.' }[sh];
  return prob({ q: P('Which solid shape is this?'), vis: { t: 'solid', name: sh }, ans: W(sh), choices: ch.map(x => W(x)), data: { tbl: 'solid', key: sh },
    hint: P(hint), steps: [P('This is a ', sh, '.')] });
});
add('k.compareLen', 'meas', 1, 'Compare lengths', () => {
  let a = ri(2, 10), b = ri(2, 10); while (a === b) b = ri(2, 10);
  return prob({ q: P('Stick A is ', N(a), ' blocks long. Stick B is ', N(b), ' blocks long. Which is longer?'), vis: { t: 'sticks', a, b, blocks: true }, ans: W(a > b ? 'Stick A' : 'Stick B'), choices: [W('Stick A'), W('Stick B')], data: { stick: [a, b, 'longer'] },
    hint: P('The longer stick has more blocks.'), steps: [P(N(Math.max(a, b)), ' is more than ', N(Math.min(a, b)), '.'), P(a > b ? 'Stick A' : 'Stick B', ' is longer.')] });
});
// ===== Grade 1 =====
add('g1.tens', 'num', 2, 'Tens and ones', () => {
  const t = ri(1, 9), o = ri(0, 9), n = t * 10 + o;
  const lab = ([a, b]) => W(a + ' tens and ' + b + ' ones');
  const ch = uniq([[t, o], [o, t], [t, (o + 1) % 10], [(t % 9) + 1, o]].filter(x => x[0] > 0)).slice(0, 3);
  return prob({ q: P('How many tens and ones are in ', N(n), '?'), vis: { t: 'base10', n }, ans: lab([t, o]), choices: shuffle(ch).map(lab), data: { tensOnes: [n, t, o] },
    hint: P('The first digit tells the tens. The last digit tells the ones.'), steps: [P(N(n), ' is ', N(t), ' tens and ', N(o), ' ones.')] });
});
add('g1.compare100', 'num', 2, 'Compare numbers to 100', () => {
  let a = ri(10, 99), b = ri(10, 99); if (chance(0.15)) b = a;
  return prob({ q: P('Which sign goes in the box? ', N(a), ' ', DS('☐', 'box'), ' ', N(b)), ans: cmpW(a - b), choices: CMP, data: { cmp: [a, b] },
    hint: P('Compare the tens first. If they are the same, compare the ones.'), steps: [P(N(a), ' ', S(a > b ? '>' : a < b ? '<' : '='), ' ', N(b))] });
});
add('g1.add20', 'add', 2, 'Add within 20', () => {
  const a = ri(2, 10), b = ri(2, 10);
  return { ...arith(a, '+', b), vis: { t: 'tenframes', a, b }, fact: 'a' + Math.min(a, b) + '+' + Math.max(a, b), hint: P('Make a ten first, then add what is left.') };
}, { factKind: 'add' });
add('g1.sub20', 'add', 2, 'Subtract within 20', () => {
  const a = ri(11, 20), b = ri(2, 9);
  return { ...arith(a, '−', b), vis: { t: 'numline', min: a - b - 2, max: a + 1, jumpFrom: a, jump: -b }, hint: P('Count back ', N(b), ' from ', N(a), ' on the number line.') };
});
add('g1.missing', 'add', 2, 'Find the missing number', () => {
  const a = ri(2, 10), c = ri(a + 1, a + 10), b = c - a;
  return prob({ q: P(N(a), ' ', S('+'), ' ', DS('?', 'what number'), ' ', S('='), ' ', N(c)), ans: N(b), choices: numChoices(b, { spread: 1, extra: [c] }), num: true, data: { solve: [['+', a, 'x'], c] },
    hint: P('Count up from ', N(a), ' to ', N(c), '.'), steps: [P(N(c), ' ', S('−'), ' ', N(a), ' ', S('='), ' ', N(b)), P('So ', N(a), ' ', S('+'), ' ', N(b), ' ', S('='), ' ', N(c), '.')] });
});
add('g1.tensAdd', 'add', 2, 'Add tens', () => {
  const a = ri(1, 8) * 10 + ri(0, 9), b = ri(1, 9 - Math.floor(a / 10)) * 10;
  return { ...arith(a, '+', b), hint: P('Only the tens change. Count up by tens.') };
});
add('g1.time', 'meas', 2, 'Time to the hour and half hour', () => {
  const h = ri(1, 12), m = pick([0, 30]); const opts = uniq([[h, m], [h, 30 - m], [(h % 12) + 1, m], [((h + 10) % 12) + 1, m]]);
  return prob({ q: P('What time does the clock show?'), vis: { t: 'clock', h, m }, ans: TM(h, m), choices: shuffle(opts).map(([a, b]) => TM(a, b)), data: { clock: [h, m] },
    hint: P(m ? 'The long hand points at the 6. That means half past.' : 'The long hand points at the 12. That means o’clock.'), steps: [P('The short hand shows the hour. The long hand shows the minutes.'), P('It is ', TM(h, m), '.')] });
});
const FRW = { '1/2': 'one half', '1/4': 'one fourth', '2/4': 'two fourths', '3/4': 'three fourths' };
add('g1.halves', 'frac', 2, 'Halves and fourths', () => {
  const d = pick([2, 4]); const a = d === 2 ? 1 : ri(1, 3);
  const lab = ([x, y]) => W(FRW[x + '/' + y]);
  const opts = shuffle([[1, 2], [1, 4], [3, 4], ...(d === 4 ? [[2, 4]] : [])].filter(([x, y]) => !(x === a && y === d))).slice(0, 2);
  return prob({ q: P('How much of the shape is shaded?'), vis: { t: 'fracshape', parts: d, shaded: a }, ans: lab([a, d]), choices: shuffle([[a, d], ...opts]).map(lab), data: { shade: [a, d], words: true },
    hint: P('Count the equal parts. Then count the shaded parts.'), steps: [P('There are ', N(d), ' equal parts and ', N(a), ' ', a === 1 ? 'is' : 'are', ' shaded.'), P('That is ', FRW[a + '/' + d], '.')] });
});
add('g1.length', 'meas', 2, 'Measure with units', () => {
  const n = ri(3, 12);
  return prob({ q: P('How many blocks long is the stick?'), vis: { t: 'ruler', n }, ans: N(n), choices: numChoices(n, { spread: 1 }), data: { count: n },
    hint: P('Count the blocks under the stick.'), steps: [P('The stick is ', N(n), ' blocks long.')] });
});
// ===== Grade 2 =====
add('g2.place', 'num', 3, 'Place value to 1,000', () => {
  const n = ri(100, 999); const pos = ri(0, 2); const dgt = Math.floor(n / 10 ** pos) % 10; if (!dgt) return again('g2.place'); const val = dgt * 10 ** pos;
  const choices = uniq([val, dgt, dgt * 10 ** ((pos + 1) % 3), dgt * 10 ** ((pos + 2) % 3)], x => x).map(N);
  return prob({ q: P('In ', N(n), ', what is the value of the digit in the ', PLACE[pos], ' place?'), vis: { t: 'base10', n }, ans: N(val), choices: shuffle(choices), data: { placeVal: [n, pos] },
    hint: P('The ', PLACE[pos], ' digit is ', N(dgt), '. How much is it worth?'), steps: [P(N(n), ' ', S('='), ' ', N(n - n % 100), ' ', S('+'), ' ', N(n % 100 - n % 10), ' ', S('+'), ' ', N(n % 10)), P('The value is ', N(val), '.')] });
});
add('g2.evenodd', 'num', 3, 'Even and odd', () => {
  const n = ri(1, 30); const ev = n % 2 === 0;
  return prob({ q: P('Is ', N(n), ' even or odd?'), vis: n <= 20 ? { t: 'pairs', n } : null, ans: W(ev ? 'even' : 'odd'), choices: [W('even'), W('odd')], data: { parity: n },
    hint: P('Put the things in pairs. Is one left over?'), steps: [P(N(n), ev ? ' makes pairs with none left over, so it is even.' : ' has one left over after making pairs, so it is odd.')] });
});
add('g2.skip', 'num', 3, 'Skip count', () => {
  const by = pick([2, 5, 10, 100]); const start = by * ri(0, by === 100 ? 5 : 8); const seq = [0, 1, 2, 3].map(i => start + i * by); const nx = start + 4 * by;
  return prob({ q: P('Skip count by ', N(by), '. What comes next? ', ...seq.flatMap((x, i) => [N(x), i < 3 ? ', ' : ', ']), DS('?', 'what number')), ans: N(nx), choices: numChoices(nx, { spread: by, extra: [nx + by, nx - 1] }), num: true, data: { e: E.add(seq[3], by) },
    hint: P('Add ', N(by), ' to the last number.'), steps: [P(N(seq[3]), ' ', S('+'), ' ', N(by), ' ', S('='), ' ', N(nx))] });
});
add('g2.add100', 'add', 3, 'Add within 100', () => {
  const a = ri(15, 69), b = ri(12, 99 - a); const t = b - b % 10, o = b % 10;
  return { ...arith(a, '+', b, [P(N(a), ' ', S('+'), ' ', N(t), ' ', S('='), ' ', N(a + t)), P(N(a + t), ' ', S('+'), ' ', N(o), ' ', S('='), ' ', N(a + b))]), hint: P('Add the tens first, then the ones.') };
});
add('g2.sub100', 'add', 3, 'Subtract within 100', () => {
  const a = ri(31, 99), b = ri(11, a - 5); const t = b - b % 10, o = b % 10;
  return { ...arith(a, '−', b, [P(N(a), ' ', S('−'), ' ', N(t), ' ', S('='), ' ', N(a - t)), P(N(a - t), ' ', S('−'), ' ', N(o), ' ', S('='), ' ', N(a - b))]), hint: P('Take away the tens first, then the ones.') };
});
add('g2.add1000', 'add', 3, 'Add and subtract within 1,000', () => {
  if (chance(0.5)) { const a = ri(100, 700), b = ri(100, 999 - a); return { ...arith(a, '+', b), hint: P('Add hundreds, then tens, then ones.') }; }
  const a = ri(300, 999), b = ri(100, a - 50); return { ...arith(a, '−', b), hint: P('Line up the places. Subtract ones, then tens, then hundreds. Regroup if you need to.') };
});
add('g2.groups', 'mul', 3, 'Equal groups and arrays', () => {
  const r = ri(2, 5), c = ri(2, 5), ic = pick(['sheep', 'fish', 'bread', 'dove']);
  return prob({ q: P('There are ', N(r), ' rows with ', N(c), ' in each row. How many in all?'), vis: { t: 'array', r, c, icon: ic }, ans: N(r * c), choices: numChoices(r * c, { extra: [r + c] }), num: true, data: { e: E.mul(r, c) },
    hint: P('Add ', N(c), ' again and again, ', N(r), ' times.'), steps: [P(...Array(r).fill(0).flatMap((_, i) => [N(c), i < r - 1 ? ' + ' : '']), ' ', S('='), ' ', N(r * c))] });
});
add('g2.time5', 'meas', 3, 'Time to 5 minutes', () => {
  const h = ri(1, 12), m = ri(1, 11) * 5; const opts = uniq([[h, m], [h, (m + 30) % 60], [(h % 12) + 1, m], [h, (m + 5) % 60]]);
  return prob({ q: P('What time does the clock show?'), vis: { t: 'clock', h, m }, ans: TM(h, m), choices: shuffle(opts).map(([a, b]) => TM(a, b)), data: { clock: [h, m] },
    hint: P('Count by fives around the clock to where the long hand points.'), steps: [P('The short hand is just past the ', N(h), '.'), P('The long hand points at the ', N(m / 5), ', which is ', N(m), ' minutes.'), P('It is ', TM(h, m), '.')] });
});
add('g2.coins', 'meas', 3, 'Count coins (US money)', () => {
  const q = ri(0, 3), d = ri(0, 4), nk = ri(0, 3), p = ri(0, 4); const coins = [...Array(q).fill(25), ...Array(d).fill(10), ...Array(nk).fill(5), ...Array(p).fill(1)]; if (!coins.length) coins.push(10);
  const tot = coins.reduce((a, b) => a + b, 0);
  return prob({ q: P('How much money is this?'), vis: { t: 'coins', coins }, ans: USD(tot), choices: shuffle(uniq([tot, tot + 5, tot - 1, tot + 10, tot + 1].filter(x => x > 0), x => x).slice(0, 4)).map(USD), data: { coins },
    hint: P('A quarter is 25 cents, a dime is 10, a nickel is 5, and a penny is 1. Count the big coins first.'), steps: [P('Add them up.'), P(...coins.flatMap((c, i) => [USD(c), i < coins.length - 1 ? ' + ' : '']), ' ', S('='), ' ', USD(tot))] });
});
add('g2.length', 'meas', 3, 'Length word problems', () => {
  const a = ri(8, 40), b = ri(2, a - 2), [obj, unit] = pick([['rope', 'inches'], ['ribbon', 'centimeters'], ['board', 'inches']]);
  return prob({ q: P('A ', obj, ' is ', N(a), ' ', unit, ' long. You cut off ', N(b), ' ', unit, '. How long is it now?'), ans: N(a - b), choices: numChoices(a - b), num: true, data: { e: E.sub(a, b) }, unit,
    hint: P('Cutting off means take away. Subtract.'), steps: [P(N(a), ' ', S('−'), ' ', N(b), ' ', S('='), ' ', N(a - b), ' ', unit, '.')] });
}, { wp: true });
add('g2.sides', 'geo', 3, 'Shape attributes', () => {
  const sh = pick(['triangle', 'quadrilateral', 'pentagon', 'hexagon', 'octagon']); const n = SIDES[sh]; const what = pick(['sides', 'corners']);
  return prob({ q: P('How many ', what, ' does a ', sh, ' have?'), vis: { t: 'shape', name: sh }, ans: N(n), choices: numChoices(n, { spread: 1 }), data: { tbl: 'sides', key: sh },
    hint: P('A flat shape has the same number of corners as sides.'), steps: [P('A ', sh, ' has ', N(n), ' sides and ', N(n), ' corners.')] });
});
add('g2.shares', 'frac', 3, 'Equal shares: halves, thirds, fourths', () => {
  const d = pick([2, 3, 4]); const nm = { 2: 'halves', 3: 'thirds', 4: 'fourths' };
  return prob({ q: P('The shape is cut into equal parts. What are the parts called?'), vis: { t: 'fracshape', parts: d, shaded: 0 }, ans: W(nm[d]), choices: [W('halves'), W('thirds'), W('fourths')], data: { shareName: d },
    hint: P('Count the equal parts.'), steps: [P('There are ', N(d), ' equal parts, so they are called ', nm[d], '.')] });
});
// ===== Grade 3 =====
add('g3.mulfact', 'mul', 4, 'Multiplication facts (0–10)', () => {
  const a = ri(2, 10), b = ri(0, 10);
  return { ...arith(a, '×', b, [P(N(a), ' groups of ', N(b), ' is ', N(a * b), '.')]), vis: b > 0 && a * b <= 50 ? { t: 'array', r: a, c: b } : null, fact: 'm' + Math.min(a, b) + 'x' + Math.max(a, b), hint: P('Skip count by ', N(b), ', ', N(a), ' times. Or use a fact you know.') };
}, { factKind: 'mul' });
add('g3.divfact', 'mul', 4, 'Division facts', () => {
  const b = ri(2, 10), q = ri(1, 10), a = b * q;
  return { ...arith(a, '÷', b, [P('Think: ', N(b), ' ', S('×'), ' ', DS('?', 'what number'), ' ', S('='), ' ', N(a)), P(N(b), ' ', S('×'), ' ', N(q), ' ', S('='), ' ', N(a), ', so ', N(a), ' ', S('÷'), ' ', N(b), ' ', S('='), ' ', N(q), '.')]), hint: P('Use multiplication. What times ', N(b), ' makes ', N(a), '?') };
});
add('g3.unknown', 'mul', 4, 'Unknown factor', () => {
  const a = ri(2, 10), b = ri(2, 10);
  return prob({ q: P(N(a), ' ', S('×'), ' ', DS('?', 'what number'), ' ', S('='), ' ', N(a * b)), ans: N(b), choices: numChoices(b, { spread: 1 }), num: true, data: { solve: [['*', a, 'x'], a * b] },
    hint: P('Divide: ', N(a * b), ' ', S('÷'), ' ', N(a), '.'), steps: [P(N(a * b), ' ', S('÷'), ' ', N(a), ' ', S('='), ' ', N(b), '.')] });
});
add('g3.x10', 'mul', 4, 'Multiply by multiples of 10', () => {
  const a = ri(2, 9), b = ri(2, 9) * 10;
  return { ...arith(a, '×', b, [P(N(a), ' ', S('×'), ' ', N(b / 10), ' ', S('='), ' ', N(a * b / 10), '.'), P(N(a * b / 10), ' tens is ', N(a * b), '.')]), hint: P('Multiply ', N(a), ' by ', N(b / 10), '. Then it is that many tens.') };
});
add('g3.twostep', 'mul', 4, 'Two-step word problems', () => {
  const g = ri(3, 8), per = ri(3, 9), more = ri(2, 15);
  return prob({ q: P('David has ', N(g), ' bags. Each bag holds ', N(per), ' stones. Then he finds ', N(more), ' more stones. How many stones does he have now?'), ans: N(g * per + more), choices: numChoices(g * per + more, { extra: [g * per, g + per + more] }), num: true, data: { e: ['+', ['*', g, per], more] },
    hint: P('First find the stones in the bags. Then add the new stones.'), steps: [P(N(g), ' ', S('×'), ' ', N(per), ' ', S('='), ' ', N(g * per)), P(N(g * per), ' ', S('+'), ' ', N(more), ' ', S('='), ' ', N(g * per + more), ' stones.')] });
}, { wp: true });
add('g3.round', 'num', 4, 'Round to the nearest 10 or 100', () => {
  const to = pick([10, 100]); let n = to === 10 ? ri(11, 989) : ri(101, 989); if (n % to === 0) n++; if (n % to === to / 2) n++;
  const r = Math.round(n / to) * to; const lo = n - n % to;
  return prob({ q: P('Round ', N(n), ' to the nearest ', N(to), '.'), vis: { t: 'numline', min: lo, max: lo + to, mark: n, ticks: to / 10 }, ans: N(r), choices: shuffle(uniq([lo, lo + to, lo - to, lo + 2 * to].filter(x => x >= 0), x => x).slice(0, 4)).map(N), data: { round: [n, to] },
    hint: P('Is ', N(n), ' closer to ', N(lo), ' or to ', N(lo + to), '?'), steps: [P(N(n), ' is between ', N(lo), ' and ', N(lo + to), '.'), P('It is closer to ', N(r), '.')] });
});
add('g3.add1000', 'add', 4, 'Add and subtract within 1,000', () => {
  if (chance(0.5)) { const a = ri(120, 780), b = ri(110, 999 - a); return { ...arith(a, '+', b), hint: P('Line up the places and add ones, tens, then hundreds.') }; }
  const a = ri(301, 999), b = ri(105, a - 10); return { ...arith(a, '−', b), hint: P('Subtract ones, tens, then hundreds. Regroup when the top digit is smaller.') };
});
add('g3.frac', 'frac', 4, 'Fractions as numbers', () => {
  const d = pick([2, 3, 4, 6, 8]), a = ri(1, d - 1);
  const opts = uniq([[a, d], [d - a, d], [a, d === 8 ? 6 : d + 2], [a + 1, d]].filter(([x, y]) => x < y), ratKey).slice(0, 4);
  return prob({ q: P('What fraction of the bar is shaded?'), vis: { t: 'fracbar', d, a }, ans: FR(a, d), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { shade: [a, d] },
    hint: P('The bottom number is how many equal parts. The top number is how many are shaded.'), steps: [P(N(a), ' of the ', N(d), ' equal parts are shaded: ', FR(a, d), '.')] });
});
add('g3.fracline', 'frac', 4, 'Fractions on a number line', () => {
  const d = pick([2, 3, 4, 6, 8]), a = ri(1, d);
  const opts = uniq([[a, d], [a + 1, d], [a > 1 ? a - 1 : a + 2, d], [d, a]].filter(([x, y]) => y > 0 && x > 0), ratKey).slice(0, 4);
  return prob({ q: P('What fraction is at the dot?'), vis: { t: 'fracline', d, a }, ans: FR(a, d), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { e: ['/', a, d] },
    hint: P('Count the equal jumps from 0 to 1. Then count the jumps to the dot.'), steps: [P('From 0 to 1 there are ', N(d), ' equal parts.'), P('The dot is ', N(a), ' parts from 0, so it is at ', FR(a, d), '.')] });
});
add('g3.fraceq', 'frac', 4, 'Simple equivalent fractions', () => {
  const d = pick([2, 3, 4]), a = ri(1, d - 1), k = pick([2, 3].filter(x => d * x <= 8)); const D = d * k;
  const opts = uniq([a * k, a + k, a * k + 1, a], x => x).filter(x => x > 0 && x < D).slice(0, 4);
  return prob({ q: P('Find the missing number. ', FR(a, d), ' ', S('='), ' ', DS('?/' + D, 'what number over ' + D)), vis: { t: 'fracbars', bars: [[a, d], [a * k, D]] }, ans: N(a * k), choices: shuffle(opts).map(N), data: { solve: [['/', 'x', D], ['/', a, d]] },
    hint: P('Look at the bars. Each part is cut into ', N(k), ' smaller parts.'), steps: [P('Each ', FR(1, d), ' is ', N(k), ' of the ', FR(1, D), ' parts.'), P(FR(a, d), ' ', S('='), ' ', FR(a * k, D))] });
});
add('g3.fraccmp', 'frac', 4, 'Compare fractions (same top or bottom)', () => {
  let a, b, c, d;
  if (chance(0.5)) { b = d = pick([3, 4, 6, 8]); a = ri(1, b - 1); c = ri(1, d - 1); } else { a = c = ri(1, 3); const dens = [2, 3, 4, 6, 8].filter(x => x > a); b = pick(dens); d = pick(dens); }
  const v = a * d - c * b;
  return prob({ q: P('Which sign makes it true? ', FR(a, b), ' ', DS('☐', 'box'), ' ', FR(c, d)), vis: { t: 'fracbars', bars: [[a, b], [c, d]] }, ans: cmpW(v), choices: CMP, data: { cmp: [['/', a, b], ['/', c, d]] },
    hint: P(b === d ? 'The parts are the same size. More parts is more.' : 'The same number of parts: fewer pieces in the whole means bigger pieces.'), steps: [P(FR(a, b), ' ', S(v > 0 ? '>' : v < 0 ? '<' : '='), ' ', FR(c, d))] });
});
add('g3.area', 'meas', 4, 'Area of rectangles', () => {
  const w = ri(2, 9), h = ri(2, 8);
  return prob({ q: P('Each square is 1 square unit. What is the area of the rectangle?'), vis: { t: 'area', w, h, grid: true }, ans: N(w * h), choices: numChoices(w * h, { extra: [2 * (w + h), w + h] }), num: true, data: { e: E.mul(w, h) }, unit: 'square units',
    hint: P('Count the squares in one row. Then multiply by the number of rows.'), steps: [P(N(h), ' rows of ', N(w), '.'), P(N(h), ' ', S('×'), ' ', N(w), ' ', S('='), ' ', N(w * h), ' square units.')] });
});
add('g3.perim', 'meas', 4, 'Perimeter', () => {
  const w = ri(2, 12), h = ri(2, 10);
  return prob({ q: P('A rectangle is ', N(w), ' feet long and ', N(h), ' feet wide. What is its perimeter?'), vis: { t: 'area', w, h, grid: false, label: 'ft' }, ans: N(2 * (w + h)), choices: numChoices(2 * (w + h), { extra: [w * h, w + h] }), num: true, data: { e: ['*', 2, ['+', w, h]] }, unit: 'feet',
    hint: P('Perimeter is the distance all the way around. Add all 4 sides.'), steps: [P(N(w), ' ', S('+'), ' ', N(h), ' ', S('+'), ' ', N(w), ' ', S('+'), ' ', N(h), ' ', S('='), ' ', N(2 * (w + h)), ' feet.')] });
});
add('g3.elapsed', 'meas', 4, 'Elapsed time', () => {
  const h = ri(1, 10), m = ri(0, 11) * 5, dm = ri(2, 11) * 5; let m2 = m + dm, h2 = h; if (m2 >= 60) { m2 -= 60; h2 += 1; }
  const opts = uniq([[h2, m2], [h2, (m2 + 5) % 60], [h2, (m2 + 55) % 60], [h2 % 12 + 1, m2]]);
  return prob({ q: P('A lesson starts at ', TM(h, m), '. It lasts ', N(dm), ' minutes. What time does it end?'), vis: { t: 'clock', h, m }, ans: TM(h2, m2), choices: shuffle(opts).map(([a, b]) => TM(a, b)), data: { addTime: [h, m, dm] },
    hint: P('Count on by fives from ', TM(h, m), '.'), steps: [P(TM(h, m), ' plus ', N(dm), ' minutes is ', TM(h2, m2), '.')] });
}, { wp: true });
add('g3.liquid', 'meas', 4, 'Liquid volume and mass problems', () => {
  const a = ri(3, 9), n = ri(2, 6), unit = pick(['liters', 'kilograms']); const thing = unit === 'liters' ? 'jar of water holds' : 'sack of grain weighs';
  return prob({ q: P('Each ', thing, ' ', N(a), ' ', unit, '. How many ', unit, ' are in ', N(n), ' of them?'), ans: N(a * n), choices: numChoices(a * n, { extra: [a + n] }), num: true, data: { e: E.mul(a, n) }, unit,
    hint: P('Equal groups: multiply.'), steps: [P(N(n), ' ', S('×'), ' ', N(a), ' ', S('='), ' ', N(a * n), ' ', unit, '.')] });
}, { wp: true });
add('g3.bargraph', 'meas', 4, 'Read a scaled bar graph', () => {
  const scale = pick([2, 5, 10]); const vals = [ri(1, 8), ri(1, 8), ri(1, 8)].map(x => x * scale); const labels = ['Year 1', 'Year 2', 'Year 3'];
  const i = ri(0, 2); let j = ri(0, 2); while (j === i) j = ri(0, 2);
  if (chance(0.5)) return prob({ q: P('The graph shows sacks of grain stored. Each line on the graph is ', N(scale), ' sacks. How many sacks were stored in ', labels[i], '?'), vis: { t: 'bars', labels, values: vals, scale }, ans: N(vals[i]), choices: numChoices(vals[i], { spread: scale, extra: [vals[i] / scale] }), num: true, data: { e: vals[i], bars: vals, bar: i },
    hint: P('Find the top of the bar. Count by ', N(scale), 's.'), steps: [P('The ', labels[i], ' bar reaches ', N(vals[i]), '.')] });
  const dd = Math.abs(vals[i] - vals[j]); if (!dd) return again('g3.bargraph');
  return prob({ q: P('Look at ', labels[i], ' and ', labels[j], '. How many more sacks were stored in the year with more?'), vis: { t: 'bars', labels, values: vals, scale }, ans: N(dd), choices: numChoices(dd, { spread: scale }), num: true, data: { e: ['abs', ['-', vals[i], vals[j]]], bars: vals },
    hint: P('Read both bars. Subtract the smaller number from the bigger one.'), steps: [P(labels[i], ': ', N(vals[i]), '. ', labels[j], ': ', N(vals[j]), '.'), P('The difference is ', N(dd), '.')] });
});
const QUAD = { square: '4 equal sides and 4 right angles', rectangle: '4 right angles, but not all 4 sides are equal', rhombus: '4 equal sides, but no right angles', trapezoid: 'exactly one pair of parallel sides' };
add('g3.quads', 'geo', 4, 'Quadrilaterals', () => {
  const sh = pick(Object.keys(QUAD));
  return prob({ q: P('Which shape has ', QUAD[sh], '?'), vis: { t: 'shapes4' }, ans: W(sh), choices: Object.keys(QUAD).map(x => W(x)), data: { tbl: 'quad', key: sh, clue: QUAD[sh] },
    hint: P('Look at the sides and the corners of each shape.'), steps: [P('A ', sh, ' has ', QUAD[sh], '.')] });
});
// ===== Grade 4 (MCPS 2026–27 order: factors & multiples, fraction equivalence & comparison, operations with fractions,
// hundredths to hundred thousands, multiplicative comparison & measurement, multi-digit multiplication & division, angles & shapes) =====
const factorPairs = n => { const r = []; for (let a = 1; a * a <= n; a++) if (n % a === 0) r.push([a, n / a]); return r; };
const isPrime = n => { if (n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
const pairsText = fp => fp.map(([a, b]) => a + ' × ' + b).join(', ');
add('g4.factors', 'num', 5, 'Factor pairs', () => {
  const n = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 80, 84, 90, 96, 100]); const fp = factorPairs(n); const [a, b] = pick(fp);
  const wrong = []; for (let t = 0; wrong.length < 3 && t < 80; t++) { const x = ri(2, 12), y = Math.round(n / x) + pick([-1, 1]); if (y > 1 && x * y !== n && !wrong.some(w => (w[0] === x && w[1] === y) || (w[0] === y && w[1] === x))) wrong.push([x, y]); }
  const lab = ([x, y]) => W(x + ' and ' + y);
  return prob({ q: P('Which pair of numbers is a factor pair of ', N(n), '?'), ans: lab([a, b]), choices: shuffle([[a, b], ...wrong]).map(lab), data: { factorPair: n },
    hint: P('A factor pair multiplies to make ', N(n), '.'), steps: [P(N(a), ' ', S('×'), ' ', N(b), ' ', S('='), ' ', N(n), '.'), P(DS('All factor pairs of ' + n + ': ' + pairsText(fp) + '.', ''))] });
});
add('g4.multiple', 'num', 5, 'Multiples', () => {
  const k = ri(3, 9), yes = chance(0.5); let n = k * ri(3, 12); if (!yes) n += ri(1, k - 1);
  return prob({ q: P('Is ', N(n), ' a multiple of ', N(k), '?'), ans: W(yes ? 'Yes' : 'No'), choices: [W('Yes'), W('No')], data: { isMultiple: [n, k] },
    hint: P('Skip count by ', N(k), '. Do you land on ', N(n), '?'), steps: [yes ? P(N(k), ' ', S('×'), ' ', N(n / k), ' ', S('='), ' ', N(n), ', so yes.') : P(N(n), ' ', S('÷'), ' ', N(k), ' has a remainder of ', N(n % k), ', so no.')] });
});
add('g4.prime', 'num', 5, 'Prime and composite numbers', () => {
  const n = ri(2, 60); const pr = isPrime(n); const fp = factorPairs(n);
  return prob({ q: P('Is ', N(n), ' prime or composite?'), ans: W(pr ? 'prime' : 'composite'), choices: [W('prime'), W('composite')], data: { prime: n },
    hint: P('A prime number has exactly one factor pair: 1 and itself.'), steps: [P(DS('Factor pairs of ' + n + ': ' + pairsText(fp) + '.', '')), P(pr ? 'It has only one factor pair, so it is prime.' : 'It has more than one factor pair, so it is composite.')] });
});
add('g4.fraceq', 'frac', 5, 'Equivalent fractions', () => {
  const d = pick([2, 3, 4, 5, 6]), a = ri(1, d - 1); if (gcd(a, d) > 1) return again('g4.fraceq');
  const k = pick([2, 3, 4, 5].filter(x => d * x <= 12 || (d === 5 && x === 4))); const D = d * k;
  const opts = uniq([a * k, a + k, a * k + 1, a * k - 1, a], x => x).filter(x => x > 0 && x < D).slice(0, 4);
  return prob({ q: P('Find the missing number. ', FR(a, d), ' ', S('='), ' ', DS('?/' + D, 'what number over ' + D)), vis: { t: 'fracbars', bars: [[a, d], [a * k, D]] }, ans: N(a * k), choices: shuffle(opts).map(N), num: true, data: { solve: [['/', 'x', D], ['/', a, d]] },
    hint: P(N(d), ' times what number is ', N(D), '? Multiply the top by the same number.'), steps: [P(N(d), ' ', S('×'), ' ', N(k), ' ', S('='), ' ', N(D), ', so ', N(a), ' ', S('×'), ' ', N(k), ' ', S('='), ' ', N(a * k), '.'), P(FR(a, d), ' ', S('='), ' ', FR(a * k, D))] });
});
const DEN4 = [2, 3, 4, 5, 6, 8, 10, 12];
add('g4.fraccmp', 'frac', 5, 'Compare fractions', () => {
  const b = pick(DEN4); let d = pick(DEN4); while (d === b) d = pick(DEN4); const a = ri(1, b - 1), c = ri(1, d - 1);
  const v = a * d - c * b; const L = lcm(b, d);
  return prob({ q: P('Which sign makes it true? ', FR(a, b), ' ', DS('☐', 'box'), ' ', FR(c, d)), vis: { t: 'fracbars', bars: [[a, b], [c, d]] }, ans: cmpW(v), choices: CMP, data: { cmp: [['/', a, b], ['/', c, d]] },
    hint: P('Rename both fractions with the same denominator, ', N(L), '. Or compare each one to one half.'), steps: [P(FR(a, b), ' ', S('='), ' ', FR(a * L / b, L), ' and ', FR(c, d), ' ', S('='), ' ', FR(c * L / d, L), '.'), P(FR(a, b), ' ', S(v > 0 ? '>' : v < 0 ? '<' : '='), ' ', FR(c, d))] });
});
add('g4.fracadd', 'frac', 5, 'Add and subtract fractions (same denominator)', () => {
  const d = pick([3, 4, 5, 6, 8, 10, 12]); const sub = chance(0.4); let a = ri(1, d - 1), b = ri(1, d - 1); if (sub && b >= a) { if (a === b) return again('g4.fracadd'); [a, b] = [b, a]; }
  const r = sub ? a - b : a + b;
  const opts = uniq([[r, d], [sub ? r : a + b, sub ? d * 2 : d * 2], [r + 1, d], [r - 1, d]].filter(([x]) => x > 0), x => x.join('/')).slice(0, 4);
  return prob({ q: P('What is ', FR(a, d), ' ', S(sub ? '−' : '+'), ' ', FR(b, d), '?'), vis: { t: 'fracbars', bars: [[a, d], [b, d]] }, ans: FR(r, d), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { e: [sub ? '-' : '+', ['/', a, d], ['/', b, d]], exactForm: true },
    hint: P('The denominator stays the same. Just ', sub ? 'subtract' : 'add', ' the numerators.'), steps: [P(N(a), ' ', S(sub ? '−' : '+'), ' ', N(b), ' ', S('='), ' ', N(r), ', so the answer is ', FR(r, d), '.'), ...(r > d ? [P('That is the same as ', MX(Math.floor(r / d), r % d, d), '.')] : [])] });
});
add('g4.mixed', 'frac', 5, 'Add mixed numbers', () => {
  const d = pick([2, 3, 4, 5, 6, 8]); const w1 = ri(1, 4), w2 = ri(1, 4), a = ri(1, d - 1), b = ri(1, d - 1); let s = a + b, carry = 0; if (s >= d) { carry = 1; s -= d; }
  const tot = w1 + w2 + carry;
  const opts = uniq([[tot, s], [w1 + w2, s], [tot + 1, s], [tot, (s + 1) % d]], x => x.join(',')).slice(0, 4);
  return prob({ q: P('What is ', MX(w1, a, d), ' ', S('+'), ' ', MX(w2, b, d), '?'), ans: MX(tot, s, d), choices: shuffle(opts).map(([x, y]) => MX(x, y, d)), data: { e: ['+', ['+', w1, ['/', a, d]], ['+', w2, ['/', b, d]]] },
    hint: P('Add the whole numbers. Then add the fractions. If the fractions make a whole, carry it.'), steps: [P('Wholes: ', N(w1), ' ', S('+'), ' ', N(w2), ' ', S('='), ' ', N(w1 + w2), '.'), P('Fractions: ', FR(a, d), ' ', S('+'), ' ', FR(b, d), ' ', S('='), ' ', FR(a + b, d), carry ? ', which is one whole and ' : '.', ...(carry ? [FR(s, d), '.'] : [])), P('Answer: ', MX(tot, s, d), '.')] });
});
add('g4.fracwhole', 'frac', 5, 'Multiply a fraction by a whole number', () => {
  const d = pick([3, 4, 5, 6, 8, 10]), a = ri(1, d - 1), n = ri(2, 6); const r = n * a;
  const opts = uniq([[r, d], [r, n * d], [a, n * d], [r + 1, d]], x => x.join('/')).slice(0, 4);
  return prob({ q: P('What is ', N(n), ' ', S('×'), ' ', FR(a, d), '?'), vis: { t: 'fracbars', bars: Array(Math.min(n, 4)).fill([a, d]) }, ans: FR(r, d), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { e: ['*', n, ['/', a, d]], exactForm: true },
    hint: P('It is ', N(n), ' groups of ', FR(a, d), '. Multiply only the top number.'), steps: [P(N(n), ' ', S('×'), ' ', N(a), ' ', S('='), ' ', N(r), ', so ', N(n), ' ', S('×'), ' ', FR(a, d), ' ', S('='), ' ', FR(r, d), '.')] });
});
add('g4.decimal', 'frac', 5, 'Tenths and hundredths as decimals', () => {
  const tenths = chance(0.35); const d = tenths ? 10 : 100; const a = tenths ? ri(1, 9) : ri(1, 99); const s = decStr(a, tenths ? 1 : 2);
  const alt = tenths ? [decStr(a, 2), decStr(a * 10, 1), String(a)] : [decStr(a, 3), decStr(a, 1), String(a)];
  const opts = uniq([s, ...alt], x => String(Number(x))).slice(0, 4);
  return prob({ q: P('Write ', FR(a, d), ' as a decimal.'), vis: tenths ? { t: 'fracbar', d: 10, a } : { t: 'grid100', a }, ans: DEC(s), choices: shuffle(opts).map(DEC), data: { e: ['/', a, d] }, dec: true,
    hint: P(tenths ? 'Tenths go in the first place after the decimal point.' : 'Hundredths use two places after the decimal point.'), steps: [P(FR(a, d), ' ', S('='), ' ', DEC(s))] });
});
add('g4.deccmp', 'frac', 5, 'Compare decimals to hundredths', () => {
  const a = ri(1, 99); let b = chance(0.35) ? (Math.round(a / 10) * 10 || 10) : ri(1, 99); if (chance(0.12)) b = a;
  const A = decStr(a, 2), B = trimDec(decStr(b, 2));
  return prob({ q: P('Which sign makes it true? ', DEC(A), ' ', DS('☐', 'box'), ' ', DEC(B)), vis: { t: 'grid100s', a, b }, ans: cmpW(a - b), choices: CMP, data: { cmp: [['/', a, 100], ['/', b, 100]] },
    hint: P('Think of both as hundredths. Then compare.'), steps: [P(DEC(A), ' is ', N(a), ' hundredths. ', DEC(B), ' is ', N(b), ' hundredths.'), P(DEC(A), ' ', S(a > b ? '>' : a < b ? '<' : '='), ' ', DEC(B))] });
});
add('g4.placebig', 'num', 5, 'Place value to 1,000,000', () => {
  const n = ri(10000, 999999); const pos = ri(1, 5); const dgt = Math.floor(n / 10 ** pos) % 10; if (!dgt) return again('g4.placebig'); const val = dgt * 10 ** pos;
  const opts = uniq([val, val / 10, pos < 5 ? val * 10 : dgt, dgt], x => x);
  return prob({ q: P('What is the value of the digit in the ', PLACE[pos], ' place of ', N(n), '?'), ans: N(val), choices: shuffle(opts).map(N), data: { placeVal: [n, pos] },
    hint: P('Each place is worth ten times the place to its right.'), steps: [P('The ', PLACE[pos], ' digit is ', N(dgt), '.'), P(N(dgt), ' ', S('×'), ' ', N(10 ** pos), ' ', S('='), ' ', N(val), '.')] });
});
add('g4.cmpbig', 'num', 5, 'Compare and round big numbers', () => {
  if (chance(0.5)) { const to = pick([1000, 10000, 100000]); let n = ri(to + 1, 999999 - to); if (n % to === 0) n++; if (n % to === to / 2) n++; const r = Math.round(n / to) * to; const lo = n - n % to;
    return prob({ q: P('Round ', N(n), ' to the nearest ', N(to), '.'), ans: N(r), choices: shuffle(uniq([lo, lo + to, lo + 2 * to, Math.round(n / (to / 10)) * (to / 10)], x => x).slice(0, 4)).map(N), data: { round: [n, to] },
      hint: P('Look at the digit to the right of the ', PLACE[Math.log10(to)], ' place. 5 or more rounds up.'), steps: [P(N(n), ' is between ', N(lo), ' and ', N(lo + to), '.'), P('It rounds to ', N(r), '.')] }); }
  const a = ri(10000, 989999), b = a + pick([-1, 1]) * pick([1, 10, 100, 1000, 10000]);
  return prob({ q: P('Which sign makes it true? ', N(a), ' ', DS('☐', 'box'), ' ', N(b)), ans: cmpW(a - b), choices: CMP, data: { cmp: [a, b] },
    hint: P('Compare the digits from the left. The first place that is different decides.'), steps: [P(N(a), ' ', S(a > b ? '>' : '<'), ' ', N(b))] });
});
add('g4.addsub', 'add', 5, 'Add and subtract multi-digit numbers', () => {
  if (chance(0.5)) { const a = ri(1000, 60000), b = ri(1000, 39999); return { ...arith(a, '+', b), hint: P('Line up the places. Add from right to left and regroup.') }; }
  const a = ri(3000, 99999), b = ri(1000, a - 100); return { ...arith(a, '−', b), hint: P('Line up the places. Subtract from right to left. Regroup when the top digit is smaller.') };
});
const TIMES_WHO = [['Joseph’s helper stored', 'sacks of grain', 'Joseph stored'], ['Shem counted', 'birds', 'Noah counted'], ['Philip saw', 'fish', 'Andrew saw']];
add('g4.times', 'mul', 5, 'Multiplicative comparison', () => {
  const b = ri(3, 12), k = ri(2, 9); const [x, things, y] = pick(TIMES_WHO);
  return prob({ q: P(x, ' ', N(b), ' ', things, '. ', y, ' ', N(k), ' times as many. How many ', things, ' is that?'), ans: N(b * k), choices: numChoices(b * k, { extra: [b + k] }), num: true, data: { e: E.mul(b, k) },
    vis: { t: 'tape', unit: b, times: k }, hint: P(N(k), ' times as many means multiply by ', N(k), '. It does not mean add.'), steps: [P(N(b), ' ', S('×'), ' ', N(k), ' ', S('='), ' ', N(b * k), '.')] });
}, { wp: true });
const CONV = [['kilometers', 'meters', 1000, 'kilometer'], ['meters', 'centimeters', 100, 'meter'], ['kilograms', 'grams', 1000, 'kilogram'], ['liters', 'milliliters', 1000, 'liter'], ['hours', 'minutes', 60, 'hour'], ['minutes', 'seconds', 60, 'minute'], ['feet', 'inches', 12, 'foot'], ['yards', 'feet', 3, 'yard'], ['pounds', 'ounces', 16, 'pound'], ['days', 'hours', 24, 'day'], ['weeks', 'days', 7, 'week']];
add('g4.convert', 'meas', 5, 'Measurement conversions', () => {
  const [big, small, f, one] = pick(CONV); const n = ri(2, f >= 1000 ? 9 : 12);
  return prob({ q: P('How many ', small, ' are in ', N(n), ' ', big, '?'), ans: N(n * f), choices: numChoices(n * f, { extra: [n * f / 10, n + f].filter(Number.isInteger) }), num: true, data: { e: E.mul(n, f), conv: [big, small, f] }, unit: small,
    hint: P('1 ', one, ' is ', N(f), ' ', small, '. Multiply.'), steps: [P('1 ', one, ' ', S('='), ' ', N(f), ' ', small, '.'), P(N(n), ' ', S('×'), ' ', N(f), ' ', S('='), ' ', N(n * f), ' ', small, '.')] });
});
add('g4.areaperim', 'meas', 5, 'Area and perimeter formulas', () => {
  const w = ri(4, 25), h = ri(3, 15); const kind = pick(['area', 'perimeter', 'side']);
  if (kind === 'side') { const A = w * h; return prob({ q: P('A rectangle has an area of ', N(A), ' square meters. One side is ', N(w), ' meters long. How long is the other side?'), vis: { t: 'area', w, h, grid: false, label: 'm', hideH: true }, ans: N(h), choices: numChoices(h, { extra: [A - w] }), num: true, data: { solve: [['*', w, 'x'], A] }, unit: 'meters',
    hint: P('Area is length times width. What times ', N(w), ' is ', N(A), '?'), steps: [P(N(A), ' ', S('÷'), ' ', N(w), ' ', S('='), ' ', N(h), ' meters.')] }); }
  const r = kind === 'area' ? w * h : 2 * (w + h);
  return prob({ q: P('A garden is ', N(w), ' meters long and ', N(h), ' meters wide. What is its ', kind, '?'), vis: { t: 'area', w, h, grid: false, label: 'm' }, ans: N(r), choices: numChoices(r, { extra: [kind === 'area' ? 2 * (w + h) : w * h] }), num: true, data: { e: kind === 'area' ? E.mul(w, h) : ['*', 2, ['+', w, h]] }, unit: kind === 'area' ? 'square meters' : 'meters',
    hint: P(kind === 'area' ? 'Area equals length times width.' : 'Perimeter equals 2 times the length plus 2 times the width.'), steps: [kind === 'area' ? P(N(w), ' ', S('×'), ' ', N(h), ' ', S('='), ' ', N(r), ' square meters.') : P(N(2), ' ', S('×'), ' ', N(w), ' ', S('+'), ' ', N(2), ' ', S('×'), ' ', N(h), ' ', S('='), ' ', N(2 * w), ' ', S('+'), ' ', N(2 * h), ' ', S('='), ' ', N(r), ' meters.')] });
});
add('g4.mul1', 'mul', 5, 'Multiply up to 4 digits by 1 digit', () => {
  const a = pick([ri(12, 99), ri(100, 999), ri(1000, 9999)]), b = ri(2, 9); const parts = String(a).split('').map((d, i, arr) => +d * 10 ** (arr.length - 1 - i)).filter(Boolean);
  return { ...arith(a, '×', b, [P('Break apart ', N(a), ': ', ...parts.flatMap((p, i) => [N(p), i < parts.length - 1 ? ' + ' : '']), '.'), ...parts.map(p => P(N(p), ' ', S('×'), ' ', N(b), ' ', S('='), ' ', N(p * b))), P('Add the partial products: ', N(a * b), '.')]), vis: { t: 'areamodel', parts, b }, hint: P('Multiply each place by ', N(b), '. Then add the partial products.') };
});
add('g4.mul2', 'mul', 5, 'Multiply 2 digits by 2 digits', () => {
  const a = ri(11, 99), b = ri(11, 99); const [at, ao, bt, bo] = [a - a % 10, a % 10, b - b % 10, b % 10]; const pp = [at * bt, at * bo, ao * bt, ao * bo];
  const st = [[at, bt], [at, bo], [ao, bt], [ao, bo]].filter(([x, y]) => x && y).map(([x, y]) => P(N(x), ' ', S('×'), ' ', N(y), ' ', S('='), ' ', N(x * y)));
  const nz = pp.filter(Boolean);
  return { ...arith(a, '×', b, [P('Split into tens and ones: ', N(a), ' ', S('='), ' ', N(at), ao ? ' + ' : '', ao ? N(ao) : '', ' and ', N(b), ' ', S('='), ' ', N(bt), bo ? ' + ' : '', bo ? N(bo) : '', '.'), ...st, P('Add: ', ...nz.flatMap((p, i) => [N(p), i < nz.length - 1 ? ' + ' : '']), ' ', S('='), ' ', N(a * b), '.')]), vis: { t: 'areamodel2', a: [at, ao], b: [bt, bo] }, hint: P('Split both numbers into tens and ones. Multiply each part, then add.') };
});
add('g4.div', 'mul', 5, 'Divide with remainders', () => {
  const b = ri(2, 9); const q = pick([ri(11, 99), ri(100, 999)]); const r = ri(0, b - 1); const a = b * q + r;
  const opts = uniq([[q, r], [q + 1, r], [q, (r + 1) % b], [q - 1, r]], x => x.join('r'));
  return prob({ q: P('What is ', N(a), ' ', S('÷'), ' ', N(b), '?'), ans: QR(q, r), choices: shuffle(opts).map(([x, y]) => QR(x, y)), data: { divrem: [a, b] },
    hint: P('How many groups of ', N(b), ' fit into ', N(a), '? What is left over?'), steps: [P(N(b), ' ', S('×'), ' ', N(q), ' ', S('='), ' ', N(b * q), '.'), P(N(a), ' ', S('−'), ' ', N(b * q), ' ', S('='), ' ', N(r), ' left over.'), P('Answer: ', QR(q, r), '.')] });
});
add('g4.remwp', 'mul', 5, 'Interpret remainders', () => {
  const b = pick([4, 5, 6, 8]), a = b * ri(3, 12) + ri(1, b - 1); const q = Math.floor(a / b);
  return prob({ q: P(N(a), ' people need to cross the river. Each boat carries ', N(b), ' people. How many boats are needed so everyone can go?'), ans: N(q + 1), choices: numChoices(q + 1, { spread: 1, extra: [q] }), num: true, data: { ceilDiv: [a, b] },
    hint: P('Divide. If some people are left over, they need one more boat.'), steps: [P(N(a), ' ', S('÷'), ' ', N(b), ' ', S('='), ' ', N(q), ' remainder ', N(a % b), '.'), P('The ', N(a % b), ' left over need one more boat, so ', N(q + 1), ' boats.')] });
}, { wp: true });
add('g4.multistep', 'mul', 5, 'Multi-step word problems', () => {
  const baskets = ri(3, 9), loaves = ri(6, 15), people = pick([2, 3, 4, 5]); const total = baskets * loaves; const left = people * ri(1, Math.floor((total - 5) / people)); const eaten = total - left; if (eaten < 3) return again('g4.multistep');
  return prob({ q: P('There are ', N(baskets), ' baskets with ', N(loaves), ' loaves in each basket. The crowd eats ', N(eaten), ' loaves. The rest are shared equally by ', N(people), ' families. How many loaves does each family get?'), ans: N(left / people), choices: numChoices(left / people, { extra: [left] }), num: true, data: { e: ['/', ['-', ['*', baskets, loaves], eaten], people] },
    hint: P('Step 1: find all the loaves. Step 2: take away what was eaten. Step 3: share equally.'), steps: [P(N(baskets), ' ', S('×'), ' ', N(loaves), ' ', S('='), ' ', N(total), ' loaves.'), P(N(total), ' ', S('−'), ' ', N(eaten), ' ', S('='), ' ', N(left), ' left.'), P(N(left), ' ', S('÷'), ' ', N(people), ' ', S('='), ' ', N(left / people), ' loaves for each family.')] });
}, { wp: true });
add('g4.angletype', 'geo', 5, 'Kinds of angles', () => {
  const deg = pick([ri(3, 16) * 5, 90, ri(20, 34) * 5, 180]); const t = deg < 90 ? 'acute' : deg === 90 ? 'right' : deg < 180 ? 'obtuse' : 'straight';
  return prob({ q: P('What kind of angle is this? It measures ', N(deg), ' degrees.'), vis: { t: 'angle', deg }, ans: W(t), choices: ['acute', 'right', 'obtuse', 'straight'].map(x => W(x)), data: { angleType: deg },
    hint: P('A right angle is 90 degrees. Acute is less than 90. Obtuse is between 90 and 180. Straight is 180.'), steps: [P(N(deg), ' degrees is ', t === 'acute' ? 'an acute' : t === 'obtuse' ? 'an obtuse' : 'a ' + t, ' angle.')] });
});
add('g4.anglemeas', 'geo', 5, 'Angle measure', () => {
  const kind = pick(['add', 'turn', 'miss']);
  if (kind === 'turn') { const [f, d, nm] = pick([[1, 4, 'quarter'], [1, 2, 'half'], [3, 4, 'three-quarter'], [1, 1, 'full']]); const r = 360 * f / d;
    return prob({ q: P('How many degrees is a ', nm, ' turn?'), vis: { t: 'angle', deg: Math.min(r, 359) }, ans: N(r), choices: shuffle([90, 180, 270, 360]).map(N), data: { e: ['*', 360, ['/', f, d]] },
      hint: P('A full turn is 360 degrees.'), steps: [P('A ', nm, ' turn is ', d === 1 ? 'all' : '', d === 1 ? '' : FR(f, d), ' of 360 degrees, which is ', N(r), ' degrees.')] }); }
  const a = ri(2, 12) * 5, b = ri(2, 12) * 5;
  if (kind === 'add') return prob({ q: P('Two angles sit side by side. One is ', N(a), ' degrees and the other is ', N(b), ' degrees. What is the whole angle?'), vis: { t: 'angle', deg: a + b, split: a }, ans: N(a + b), choices: numChoices(a + b, { spread: 5 }), num: true, data: { e: E.add(a, b) },
    hint: P('Angle measures add. Add the two parts.'), steps: [P(N(a), ' ', S('+'), ' ', N(b), ' ', S('='), ' ', N(a + b), ' degrees.')] });
  const tot = pick([90, 180]); const p = ri(3, tot / 5 - 3) * 5;
  return prob({ q: P('A ', tot === 90 ? 'right angle' : 'straight angle', ' is split into two parts. One part is ', N(p), ' degrees. What is the other part?'), vis: { t: 'angle', deg: tot, split: p }, ans: N(tot - p), choices: numChoices(tot - p, { spread: 5 }), num: true, data: { e: E.sub(tot, p) },
    hint: P(tot === 90 ? 'A right angle is 90 degrees.' : 'A straight angle is 180 degrees.', ' Subtract.'), steps: [P(N(tot), ' ', S('−'), ' ', N(p), ' ', S('='), ' ', N(tot - p), ' degrees.')] });
});
const SYM = { square: 4, rectangle: 2, 'equilateral triangle': 3, 'regular hexagon': 6 };
add('g4.lines', 'geo', 5, 'Lines, symmetry, and triangles', () => {
  const kind = pick(['sym', 'par', 'tri']);
  if (kind === 'sym') { const sh = pick(Object.keys(SYM)); const n = SYM[sh];
    return prob({ q: P('How many lines of symmetry does a ', sh, ' have?'), vis: { t: 'shape', name: sh.split(' ').pop(), symmetry: true }, ans: N(n), choices: numChoices(n, { spread: 1 }), data: { tbl: 'symmetry', key: sh },
      hint: P('A line of symmetry folds the shape into two matching halves.'), steps: [P('A ', sh, ' has ', N(n), ' lines of symmetry.')] }); }
  if (kind === 'par') { const t = pick(['parallel', 'perpendicular']);
    return prob({ q: P('Lines that ', t === 'parallel' ? 'never meet and stay the same distance apart' : 'cross to make square corners', ' are called what?'), vis: { t: 'lines', kind: t }, ans: W(t), choices: [W('parallel'), W('perpendicular'), W('curved')], data: { tbl: 'lines', key: t },
      hint: P('Think of train tracks, and the corner of a book.'), steps: [P('They are called ', t, ' lines.')] }); }
  const t = pick(['right', 'acute', 'obtuse']); const angs = t === 'right' ? [90, 50, 40] : t === 'acute' ? [60, 70, 50] : [110, 40, 30];
  return prob({ q: P('A triangle has angles of ', N(angs[0]), ', ', N(angs[1]), ', and ', N(angs[2]), ' degrees. What kind of triangle is it?'), ans: W(t), choices: [W('right'), W('acute'), W('obtuse')], data: { triType: angs },
    hint: P('Look at the biggest angle.'), steps: [P('The biggest angle is ', N(Math.max(...angs)), ' degrees, so it is ', t === 'right' ? 'a right' : t === 'acute' ? 'an acute' : 'an obtuse', ' triangle.')] });
});
// ===== Grade 5 =====
add('g5.volume', 'meas', 6, 'Volume of rectangular prisms', () => {
  const l = ri(2, 10), w = ri(2, 8), h = ri(2, 6);
  return prob({ q: P('A box is ', N(l), ' units long, ', N(w), ' units wide, and ', N(h), ' units tall. What is its volume in cubic units?'), vis: { t: 'prism', l, w, h }, ans: N(l * w * h), choices: numChoices(l * w * h, { extra: [l + w + h, l * w] }), num: true, data: { e: ['*', ['*', l, w], h] }, unit: 'cubic units',
    hint: P('Volume is length times width times height.'), steps: [P(N(l), ' ', S('×'), ' ', N(w), ' ', S('='), ' ', N(l * w), ' cubes in each layer.'), P(N(l * w), ' ', S('×'), ' ', N(h), ' layers ', S('='), ' ', N(l * w * h), ' cubic units.')] });
});
add('g5.fracquot', 'frac', 6, 'Fractions as division', () => {
  const a = ri(2, 9), b = ri(2, 9); if (a % b === 0) return again('g5.fracquot');
  const opts = uniq([[a, b], [b, a], [a, a + b], [a + 1, b]], ratKey).slice(0, 4);
  return prob({ q: P(N(a), ' loaves are shared equally by ', N(b), ' people. How much bread does each person get?'), ans: FR(a, b), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { e: ['/', a, b] },
    hint: P('Sharing is dividing. ', N(a), ' ', S('÷'), ' ', N(b), ' can be written as a fraction.'), steps: [P(N(a), ' ', S('÷'), ' ', N(b), ' ', S('='), ' ', FR(a, b), ' of a loaf each.'), ...(a > b ? [P('That is ', MX(Math.floor(a / b), a % b, b), ' loaves.')] : [])] });
}, { wp: true });
add('g5.fracmul', 'frac', 6, 'Multiply fractions', () => {
  const a = ri(1, 5), b = ri(a + 1, 8), c = ri(1, 5), d = ri(c + 1, 8); const n = a * c, m = b * d; if (!redOK([n, m])) return again('g5.fracmul');
  const opts = uniq([[n, m], [a + c, b + d], [a * d, b * c], [n + 1, m], [n, m + 1], [n + 2, m]].filter(redOK), ratKey).slice(0, 4);
  return prob({ q: P('What is ', FR(a, b), ' ', S('×'), ' ', FR(c, d), '?'), ans: redFR([n, m]), choices: shuffle(opts).map(redFR), data: { e: ['*', ['/', a, b], ['/', c, d]] },
    hint: P('Multiply the tops. Multiply the bottoms.'), steps: [P(N(a), ' ', S('×'), ' ', N(c), ' ', S('='), ' ', N(n), ' and ', N(b), ' ', S('×'), ' ', N(d), ' ', S('='), ' ', N(m), '.'), P('The answer is ', FR(n, m), '.'), ...(gcd(n, m) > 1 ? [P('That simplifies to ', redFR([n, m]), '.')] : [])] });
});
add('g5.fracdiv', 'frac', 6, 'Divide with unit fractions', () => {
  const n = ri(2, 9), d = ri(2, 6); const whole = chance(0.5);
  if (whole) return prob({ q: P('How many ', FR(1, d), ' pieces are in ', N(n), ' wholes? What is ', N(n), ' ', S('÷'), ' ', FR(1, d), '?'), ans: N(n * d), choices: numChoices(n * d, { extra: [n + d] }), num: true, data: { e: ['/', n, ['/', 1, d]] },
    hint: P('Each whole has ', N(d), ' pieces.'), steps: [P(N(n), ' ', S('×'), ' ', N(d), ' ', S('='), ' ', N(n * d), ' pieces.')] });
  const opts = uniq([[1, d * n], [n, d], [d, n], [1, d + n]], ratKey).slice(0, 4);
  return prob({ q: P('What is ', FR(1, d), ' ', S('÷'), ' ', N(n), '?'), ans: FR(1, d * n), choices: shuffle(opts).map(([x, y]) => FR(x, y)), data: { e: ['/', ['/', 1, d], n] },
    hint: P('Split ', FR(1, d), ' into ', N(n), ' equal parts.'), steps: [P(FR(1, d), ' ', S('÷'), ' ', N(n), ' ', S('='), ' ', FR(1, d * n), '.')] });
});
add('g5.fracunlike', 'frac', 6, 'Add and subtract unlike fractions', () => {
  const b = pick([2, 3, 4, 5, 6, 8]); let d = pick([2, 3, 4, 5, 6, 8, 10, 12]); if (d === b) return again('g5.fracunlike'); const a = ri(1, b - 1), c = ri(1, d - 1);
  const sub = a * d > c * b && chance(0.4); const L = lcm(b, d); const n = sub ? a * L / b - c * L / d : a * L / b + c * L / d; const g = gcd(n, L);
  if (!redOK([n, L])) return again('g5.fracunlike');
  const opts = uniq([[n, L], [sub ? a - c : a + c, b + d], [n + 1, L], [n, L * 2], [n + 2, L]].filter(([x, y]) => x > 0 && y > 0).filter(redOK), ratKey).slice(0, 4);
  return prob({ q: P('What is ', FR(a, b), ' ', S(sub ? '−' : '+'), ' ', FR(c, d), '?'), ans: FR(n / g, L / g), choices: shuffle(opts).map(([x, y]) => { const k = gcd(x, y); return FR(x / k, y / k); }), data: { e: [sub ? '-' : '+', ['/', a, b], ['/', c, d]] },
    hint: P('Find a common denominator, like ', N(L), '.'), steps: [P(FR(a, b), ' ', S('='), ' ', FR(a * L / b, L), ' and ', FR(c, d), ' ', S('='), ' ', FR(c * L / d, L), '.'), P('So the answer is ', FR(n, L), g > 1 ? ', which simplifies to ' : '.', ...(g > 1 ? [FR(n / g, L / g), '.'] : []))] });
});
add('g5.decop', 'frac', 6, 'Add, subtract, and multiply decimals', () => {
  const op = pick(['+', '−', '×']); let a = ri(11, 999), b = ri(11, 999); let r, s;
  if (op === '×') { b = ri(2, 9); r = a * b; s = decStr(r, 2); } else { if (op === '−' && b > a) [a, b] = [b, a]; r = op === '+' ? a + b : a - b; s = decStr(r, 2); }
  const A = decStr(a, 2), B = op === '×' ? String(b) : decStr(b, 2); const cands = [s, decStr(r, 1), decStr(r + 10, 2), decStr(r + 1, 2), decStr(Math.max(r - 1, 1), 2)];
  const opts = uniq(cands, x => String(Number(x))).slice(0, 4);
  return prob({ q: P('What is ', DEC(A), ' ', S(op), ' ', op === '×' ? N(b) : DEC(B), '?'), ans: DEC(s), choices: shuffle(opts).map(DEC), data: { e: op === '×' ? ['*', ['/', a, 100], b] : [op === '+' ? '+' : '-', ['/', a, 100], ['/', b, 100]] }, dec: true,
    hint: P(op === '×' ? 'Multiply as whole numbers, then place the decimal point: two places.' : 'Line up the decimal points.'), steps: [P(DEC(A), ' ', S(op), ' ', op === '×' ? N(b) : DEC(B), ' ', S('='), ' ', DEC(s))] });
});
add('g5.pow10', 'num', 6, 'Multiply and divide by powers of 10', () => {
  const a = ri(12, 999), k = pick([10, 100, 1000]); const mul = chance(0.5); const places = Math.log10(k);
  const r = mul ? decStr(a * k, 2) : decStr(a, 2 + places); const A = decStr(a, 2);
  const opts = uniq([r, mul ? decStr(a * k / 10, 2) : decStr(a, 1 + places), mul ? decStr(a * k * 10, 2) : decStr(a, 3 + places), decStr(a, 2)], x => String(Number(x))).slice(0, 4);
  return prob({ q: P('What is ', DEC(A), ' ', S(mul ? '×' : '÷'), ' ', N(k), '?'), ans: DEC(trimDec(r)), choices: shuffle(opts).map(x => DEC(trimDec(x))), data: { e: [mul ? '*' : '/', ['/', a, 100], k] }, dec: true,
    hint: P('Each 10 moves the digits one place ', mul ? 'to the left, making the number bigger.' : 'to the right, making the number smaller.'), steps: [P(DEC(A), ' ', S(mul ? '×' : '÷'), ' ', N(k), ' ', S('='), ' ', DEC(trimDec(r)))] });
});
add('g5.decplace', 'frac', 6, 'Decimals to thousandths', () => {
  const a = ri(1, 999); const to = pick([1, 2]); const f = 10 ** (3 - to); const r = Math.round(a / f) * f; if (a % f === f / 2 || a % f === 0) return again('g5.decplace');
  const A = decStr(a, 3), R = trimDec(decStr(r / f, to)) ;
  const opts = uniq([R, trimDec(decStr(Math.floor(a / f), to)), trimDec(decStr(Math.floor(a / f) + 1, to)), trimDec(decStr(a, 3))], x => String(Number(x))).slice(0, 4);
  return prob({ q: P('Round ', DEC(A), ' to the nearest ', to === 1 ? 'tenth' : 'hundredth', '.'), ans: DEC(R), choices: shuffle(opts).map(DEC), data: { roundDec: [a, 3, to] }, dec: true,
    hint: P('Look at the next digit to the right. 5 or more rounds up.'), steps: [P(DEC(A), ' rounds to ', DEC(R), '.')] });
});
add('g5.mulstd', 'mul', 6, 'Multi-digit multiplication', () => {
  const a = ri(101, 999), b = ri(12, 99);
  return { ...arith(a, '×', b, [P(N(a), ' ', S('×'), ' ', N(b % 10), ' ', S('='), ' ', N(a * (b % 10))), P(N(a), ' ', S('×'), ' ', N(b - b % 10), ' ', S('='), ' ', N(a * (b - b % 10))), P('Add: ', N(a * b), '.')]), hint: P('Multiply by the ones, then by the tens, then add.') };
});
add('g5.div2', 'mul', 6, 'Divide by 2-digit numbers', () => {
  const b = ri(11, 45), q = ri(12, 99), a = b * q;
  return { ...arith(a, '÷', b, [P('Estimate: about how many ', N(b), 's are in ', N(a), '?'), P(N(b), ' ', S('×'), ' ', N(q), ' ', S('='), ' ', N(a), ', so the answer is ', N(q), '.')]), hint: P('Round ', N(b), ' to estimate, then check by multiplying.') };
});
add('g5.expo', 'alg', 6, 'Order of operations', () => {
  const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(1, 9); const form = pick([0, 1]);
  const e = form ? ['+', ['*', a, ['+', b, c]], d] : ['-', ['*', ['+', a, b], c], d]; const r = form ? a * (b + c) + d : (a + b) * c - d; const txt = form ? `${a} × (${b} + ${c}) + ${d}` : `(${a} + ${b}) × ${c} − ${d}`;
  return prob({ q: P('What is ', DS(txt, ''), SAY(form ? `${a} times the sum of ${b} and ${c}, plus ${d}` : `the sum of ${a} and ${b}, times ${c}, minus ${d}`), '?'), ans: N(r), choices: numChoices(r, { extra: [form ? a * b + c + d : a + b * c - d] }), num: true, data: { e },
    hint: P('Do the parentheses first. Then multiply. Then add or subtract.'), steps: form ? [P(N(b), ' ', S('+'), ' ', N(c), ' ', S('='), ' ', N(b + c)), P(N(a), ' ', S('×'), ' ', N(b + c), ' ', S('='), ' ', N(a * (b + c))), P(N(a * (b + c)), ' ', S('+'), ' ', N(d), ' ', S('='), ' ', N(r))] : [P(N(a), ' ', S('+'), ' ', N(b), ' ', S('='), ' ', N(a + b)), P(N(a + b), ' ', S('×'), ' ', N(c), ' ', S('='), ' ', N((a + b) * c)), P(N((a + b) * c), ' ', S('−'), ' ', N(d), ' ', S('='), ' ', N(r))] });
});
add('g5.coord', 'geo', 6, 'The coordinate plane', () => {
  const x = ri(0, 9), y = ri(0, 9); if (x === y) return again('g5.coord'); const lab = ([a, b]) => W('(' + a + ', ' + b + ')', a + ' comma ' + b);
  return prob({ q: P('What are the coordinates of the point?'), vis: { t: 'coord', pts: [[x, y]] }, ans: lab([x, y]), choices: shuffle(uniq([[x, y], [y, x], [x + 1, y], [x, y + 1]])).map(lab), data: { point: [x, y] },
    hint: P('Go across first to find x. Then go up to find y.'), steps: [P('Across ', N(x), ', up ', N(y), '.')] });
});
add('g5.custom', 'meas', 6, 'Convert and solve with measurements', () => {
  const ft = ri(2, 9), inch = ri(1, 11);
  return prob({ q: P('A rope is ', N(ft), ' feet ', N(inch), ' inches long. How many inches long is it?'), ans: N(ft * 12 + inch), choices: numChoices(ft * 12 + inch, { extra: [ft * 10 + inch, ft + inch] }), num: true, data: { e: ['+', ['*', ft, 12], inch] }, unit: 'inches',
    hint: P('1 foot is 12 inches.'), steps: [P(N(ft), ' ', S('×'), ' ', N(12), ' ', S('='), ' ', N(ft * 12), ' inches.'), P(N(ft * 12), ' ', S('+'), ' ', N(inch), ' ', S('='), ' ', N(ft * 12 + inch), ' inches.')] });
}, { wp: true });
const CLASS = [['square', 'rectangle', 'yes'], ['rectangle', 'square', 'not always'], ['square', 'rhombus', 'yes'], ['rhombus', 'square', 'not always'], ['rectangle', 'parallelogram', 'yes'], ['parallelogram', 'rectangle', 'not always']];
add('g5.classify', 'geo', 6, 'Classify shapes', () => {
  const [a, b, r] = pick(CLASS);
  return prob({ q: P('Is every ', a, ' also a ', b, '?'), ans: W(r === 'yes' ? 'Yes' : 'Not always'), choices: [W('Yes'), W('Not always')], data: { tbl: 'classify', key: a + '>' + b },
    hint: P('Think about what a ', b, ' must have.'), steps: [P(r === 'yes' ? 'Yes. Every ' : 'Not always. Some ', a, r === 'yes' ? ' has everything a ' : 's are not ', b, r === 'yes' ? ' needs.' : 's.')] });
});
add('g5.wp', 'mul', 6, 'Multi-step problems with grain', () => {
  const per = ri(120, 480), years = 7, eat = ri(50, 110);
  return prob({ q: P('For ', N(years), ' good years, Joseph stored ', N(per), ' sacks of grain each year. In each hungry year, people used ', N(eat), ' sacks. How many sacks were left after ', N(years), ' hungry years?'), ans: N(years * (per - eat)), choices: numChoices(years * (per - eat), { extra: [years * per] }), num: true, data: { e: ['-', ['*', years, per], ['*', years, eat]] },
    hint: P('Find the total stored, then the total used.'), steps: [P(N(years), ' ', S('×'), ' ', N(per), ' ', S('='), ' ', N(years * per), ' stored.'), P(N(years), ' ', S('×'), ' ', N(eat), ' ', S('='), ' ', N(years * eat), ' used.'), P(N(years * per), ' ', S('−'), ' ', N(years * eat), ' ', S('='), ' ', N(years * (per - eat)), ' left.')] });
}, { wp: true });
// ===== Grade 6 =====
add('g6.ratio', 'alg', 7, 'Ratios', () => {
  const a = ri(1, 6), b = ri(1, 6), k = ri(2, 8); if (a === b) return again('g6.ratio');
  return prob({ q: P('In a flock there are ', N(a), ' white sheep for every ', N(b), ' brown sheep. If there are ', N(a * k), ' white sheep, how many brown sheep are there?'), vis: { t: 'ratiotbl', a, b, k }, ans: N(b * k), choices: numChoices(b * k, { extra: [a * k + b - a].filter(x => x > 0) }), num: true, data: { e: ['*', ['/', a * k, a], b] },
    hint: P(N(a * k), ' is ', N(a), ' times ', N(k), '. Multiply ', N(b), ' by the same number.'), steps: [P(N(a * k), ' ', S('÷'), ' ', N(a), ' ', S('='), ' ', N(k), '.'), P(N(b), ' ', S('×'), ' ', N(k), ' ', S('='), ' ', N(b * k), ' brown sheep.')] });
}, { wp: true });
add('g6.rate', 'alg', 7, 'Unit rates', () => {
  const u = ri(2, 12), n = ri(3, 9);
  return prob({ q: P('A caravan walks ', N(u * n), ' miles in ', N(n), ' days. How many miles is that per day?'), ans: N(u), choices: numChoices(u, { spread: 1 }), num: true, data: { e: ['/', u * n, n] },
    hint: P('Divide the miles by the days.'), steps: [P(N(u * n), ' ', S('÷'), ' ', N(n), ' ', S('='), ' ', N(u), ' miles per day.')] });
}, { wp: true });
add('g6.percent', 'alg', 7, 'Percent of a number', () => {
  const p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80]), base = pick([20, 40, 60, 80, 100, 120, 200, 300]); const r = p * base / 100; if (!Number.isInteger(r)) return again('g6.percent');
  return prob({ q: P('What is ', N(p), ' percent of ', N(base), '?'), ans: N(r), choices: numChoices(r, { extra: [p, base - r].filter(x => x !== r) }), num: true, data: { e: ['*', ['/', p, 100], base] },
    hint: P('Percent means out of 100. Find ', N(p), ' hundredths of ', N(base), '.'), steps: [P(FR(p, 100), ' ', S('×'), ' ', N(base), ' ', S('='), ' ', N(r), '.')] });
});
add('g6.divfrac', 'frac', 7, 'Divide fractions', () => {
  const a = ri(1, 5), b = ri(a + 1, 8), c = ri(1, 5), d = ri(c + 1, 8); const n = a * d, m = b * c; const g = gcd(n, m);
  if (!redOK([n, m])) return again('g6.divfrac');
  const opts = uniq([[n, m], [a * c, b * d], [m, n], [n + 1, m], [n + 2, m], [n, m + 1]].filter(redOK), ratKey).slice(0, 4);
  const show = ([x, y]) => { const k = gcd(x, y); return FR(x / k, y / k); };
  return prob({ q: P('What is ', FR(a, b), ' ', S('÷'), ' ', FR(c, d), '?'), ans: FR(n / g, m / g), choices: shuffle(opts).map(show), data: { e: ['/', ['/', a, b], ['/', c, d]] },
    hint: P('Multiply by the reciprocal: flip the second fraction.'), steps: [P(FR(a, b), ' ', S('×'), ' ', FR(d, c), ' ', S('='), ' ', FR(n, m), g > 1 ? ', which simplifies to ' : '.', ...(g > 1 ? [FR(n / g, m / g), '.'] : []))] });
});
add('g6.onestep', 'alg', 7, 'One-step equations', () => {
  const x = ri(2, 20), a = ri(2, 12); const f = pick(['+', '*']); const rhs = f === '+' ? x + a : x * a;
  return prob({ q: P('Solve for x. ', DS(f === '+' ? `x + ${a} = ${rhs}` : `${a}x = ${rhs}`, ''), SAY(f === '+' ? `x plus ${a} equals ${rhs}` : `${a} x equals ${rhs}`)), ans: N(x), choices: numChoices(x, { extra: [f === '+' ? rhs + a : rhs - a].filter(v => v > 0 && v !== x) }), num: true, data: { solve: [[f, f === '+' ? 'x' : a, f === '+' ? a : 'x'], rhs] },
    hint: P(f === '+' ? 'Subtract ' : 'Divide by ', N(a), ' on both sides.'), steps: [P('x ', S('='), ' ', N(rhs), ' ', S(f === '+' ? '−' : '÷'), ' ', N(a), ' ', S('='), ' ', N(x))] });
});
add('g6.expr', 'alg', 7, 'Evaluate expressions', () => {
  const a = ri(2, 9), b = ri(1, 20), x = ri(2, 10);
  return prob({ q: P('What is ', DS(`${a}x + ${b}`, ''), SAY(`${a} x plus ${b}`), ' when x ', S('='), ' ', N(x), '?'), ans: N(a * x + b), choices: numChoices(a * x + b, { extra: [a + x + b, a * (x + b)] }), num: true, data: { e: ['+', ['*', a, x], b] },
    hint: P('Replace x with ', N(x), '. Multiply first, then add.'), steps: [P(N(a), ' ', S('×'), ' ', N(x), ' ', S('='), ' ', N(a * x)), P(N(a * x), ' ', S('+'), ' ', N(b), ' ', S('='), ' ', N(a * x + b))] });
});
add('g6.integers', 'num', 7, 'Negative numbers and absolute value', () => {
  if (chance(0.5)) { const n = -ri(1, 50); return prob({ q: P('What is the absolute value of ', N(n), '?'), ans: N(-n), choices: shuffle([N(-n), N(n), N(0), N(-n + 1)]), data: { e: ['abs', n] },
    hint: P('Absolute value is the distance from zero.'), steps: [P(N(n), ' is ', N(-n), ' units from zero.')] }); }
  const a = ri(-20, 20), b = ri(-20, 20); if (a === b) return again('g6.integers');
  return prob({ q: P('Which sign makes it true? ', N(a), ' ', DS('☐', 'box'), ' ', N(b)), vis: { t: 'numline', min: Math.min(a, b) - 2, max: Math.max(a, b) + 2, marks: [a, b] }, ans: cmpW(a - b), choices: CMP, data: { cmp: [a, b] },
    hint: P('On a number line, numbers to the right are greater.'), steps: [P(N(a), ' ', S(a > b ? '>' : '<'), ' ', N(b))] });
});
add('g6.triarea', 'geo', 7, 'Area of triangles', () => {
  const b = ri(2, 20), h = ri(2, 16); if ((b * h) % 2) return again('g6.triarea');
  return prob({ q: P('A triangle has a base of ', N(b), ' cm and a height of ', N(h), ' cm. What is its area?'), vis: { t: 'tri', b, h }, ans: N(b * h / 2), choices: numChoices(b * h / 2, { extra: [b * h] }), num: true, data: { e: ['/', ['*', b, h], 2] }, unit: 'square centimeters',
    hint: P('Area of a triangle is one half times base times height.'), steps: [P(N(b), ' ', S('×'), ' ', N(h), ' ', S('='), ' ', N(b * h)), P(N(b * h), ' ', S('÷'), ' ', N(2), ' ', S('='), ' ', N(b * h / 2), ' square centimeters.')] });
});
add('g6.mean', 'meas', 7, 'Mean of a data set', () => {
  const n = ri(3, 5), m = ri(4, 20); const xs = Array.from({ length: n }, () => m); for (let i = 0; i < n - 1; i++) { const d = ri(0, 3); xs[i] += d; xs[n - 1] -= d; } if (xs.some(x => x < 0)) return again('g6.mean');
  const sh = shuffle(xs); const sum = sh.reduce((a, b) => a + b, 0);
  return prob({ q: P('Find the mean of these numbers: ', ...sh.flatMap((x, i) => [N(x), i < n - 1 ? ', ' : '']), '.'), ans: N(m), choices: numChoices(m, { spread: 1, extra: [sum] }), num: true, data: { e: ['/', sum, n] },
    hint: P('Add them all, then divide by how many numbers there are.'), steps: [P('The sum is ', N(sum), '.'), P(N(sum), ' ', S('÷'), ' ', N(n), ' ', S('='), ' ', N(m), '.')] });
});
// ===== Grade 7 =====
add('g7.intops', 'num', 8, 'Add, subtract, and multiply negative numbers', () => {
  const op = pick(['+', '−', '×']); const a = ri(-12, 12) || 3, b = ri(-12, 12) || -4; const r = op === '+' ? a + b : op === '−' ? a - b : a * b;
  return prob({ q: P('What is ', N(a), ' ', S(op), ' ', b < 0 ? '(' : '', N(b), b < 0 ? ')' : '', '?'), ans: N(r), choices: numChoices(r, { neg: true, extra: [-r, op === '−' ? a + b : op === '+' ? a - b : -a * b].filter(x => x !== r) }), num: true, neg: true, data: { e: [op === '×' ? '*' : op === '+' ? '+' : '-', a, b] },
    hint: P(op === '×' ? 'Same signs give a positive product. Different signs give a negative product.' : op === '−' ? 'Subtracting a number is the same as adding its opposite.' : 'Think of moving on a number line.'), steps: [P(N(a), ' ', S(op), ' ', N(b), ' ', S('='), ' ', N(r))] });
});
add('g7.twostep', 'alg', 8, 'Two-step equations', () => {
  const x = ri(-9, 12), a = ri(2, 9), b = ri(1, 20); const rhs = a * x + b;
  return prob({ q: P('Solve for x. ', DS(`${a}x + ${b} = `, ''), SAY(`${a} x plus ${b} equals`), N(rhs)), ans: N(x), choices: numChoices(x, { neg: true, spread: 1, extra: [(rhs + b) / a].filter(Number.isInteger) }), num: true, neg: true, data: { solve: [['+', ['*', a, 'x'], b], rhs] },
    hint: P('First subtract ', N(b), ' from both sides. Then divide by ', N(a), '.'), steps: [P(N(a), 'x ', S('='), ' ', N(rhs - b)), P('x ', S('='), ' ', N(x))] });
});
add('g7.prop', 'alg', 8, 'Proportional relationships', () => {
  const k = ri(2, 12), x1 = ri(2, 6), x2 = ri(7, 15);
  return prob({ q: P(N(x1), ' jars hold ', N(k * x1), ' cups of oil. At the same rate, how many cups do ', N(x2), ' jars hold?'), ans: N(k * x2), choices: numChoices(k * x2, { extra: [k * x1 + x2 - x1] }), num: true, data: { e: ['*', ['/', k * x1, x1], x2] },
    hint: P('Find the cups in one jar first.'), steps: [P(N(k * x1), ' ', S('÷'), ' ', N(x1), ' ', S('='), ' ', N(k), ' cups per jar.'), P(N(k), ' ', S('×'), ' ', N(x2), ' ', S('='), ' ', N(k * x2), ' cups.')] });
}, { wp: true });
add('g7.pctchange', 'alg', 8, 'Percent increase and decrease', () => {
  const base = pick([20, 40, 50, 60, 80, 100, 200]), p = pick([10, 20, 25, 50]); const up = chance(0.5); const ch = base * p / 100; if (!Number.isInteger(ch)) return again('g7.pctchange'); const r = up ? base + ch : base - ch;
  return prob({ q: P('A price of ', USD$(base * 100), ' goes ', up ? 'up' : 'down', ' by ', N(p), ' percent. What is the new price in dollars?'), ans: N(r), choices: numChoices(r, { extra: [up ? base - ch : base + ch, ch] }), num: true, data: { e: [up ? '+' : '-', base, ['*', base, ['/', p, 100]]] }, unit: 'dollars',
    hint: P('Find ', N(p), ' percent of ', N(base), ', then ', up ? 'add it.' : 'subtract it.'), steps: [P(N(p), ' percent of ', N(base), ' is ', N(ch), '.'), P('The new price is ', N(r), ' dollars.')] });
}, { wp: true });
add('g7.circle', 'geo', 8, 'Circles (use 3.14 for pi)', () => {
  const r = ri(1, 10); const area = chance(0.5); const val = area ? 314 * r * r : 628 * r; const s = trimDec(decStr(val, 2));
  const opts = uniq([s, trimDec(decStr(area ? 628 * r : 314 * r * r, 2)), trimDec(decStr(314 * r, 2)), trimDec(decStr(val + 314, 2))], x => x).slice(0, 4);
  return prob({ q: P('A circle has a radius of ', N(r), ' meters. Using 3.14 for pi, what is its ', area ? 'area' : 'circumference', '?'), vis: { t: 'circle', r }, ans: DEC(s), choices: shuffle(opts).map(DEC), data: { e: area ? ['*', ['/', 314, 100], ['*', r, r]] : ['*', ['*', 2, ['/', 314, 100]], r] }, dec: true,
    hint: P(area ? 'Area is pi times the radius times the radius.' : 'Circumference is 2 times pi times the radius.'), steps: [P(area ? 'Area' : 'Circumference', ' ', S('='), ' ', DEC(s), area ? ' square meters.' : ' meters.')] });
});
add('g7.angles', 'geo', 8, 'Supplementary and complementary angles', () => {
  const sup = chance(0.5); const tot = sup ? 180 : 90; const a = ri(3, tot / 5 - 3) * 5;
  return prob({ q: P('Two angles are ', sup ? 'supplementary' : 'complementary', '. One is ', N(a), ' degrees. What is the other?'), ans: N(tot - a), choices: numChoices(tot - a, { spread: 5, extra: [(sup ? 90 : 180) - a].filter(x => x > 0) }), num: true, data: { e: E.sub(tot, a) },
    hint: P(sup ? 'Supplementary angles add to 180 degrees.' : 'Complementary angles add to 90 degrees.'), steps: [P(N(tot), ' ', S('−'), ' ', N(a), ' ', S('='), ' ', N(tot - a), ' degrees.')] });
});
add('g7.prob', 'meas', 8, 'Probability', () => {
  const r = ri(1, 6), b = ri(1, 6), g = ri(0, 4); const t = r + b + g; const k = gcd(r, t);
  if (t < 4 || !redOK([r, t])) return again('g7.prob');
  const opts = uniq([[r, t], [r, b + g], [b, t], [r + 1, t], [g + 1, t], [t - r, t], [r - 1, t], [r + 2, t]].filter(([x, y]) => y > 0 && x > 0 && x < y).filter(redOK), ratKey).slice(0, 4);
  return prob({ q: P('A bag has ', N(r), ' red, ', N(b), ' blue, and ', N(g), ' green stones. You pick one without looking. What is the probability it is red?'), ans: FR(r / k, t / k), choices: shuffle(opts).map(([x, y]) => { const z = gcd(x, y); return FR(x / z, y / z); }), data: { e: ['/', r, t] },
    hint: P('Probability is the number of red stones over the total number of stones.'), steps: [P('There are ', N(t), ' stones and ', N(r), ' are red: ', FR(r, t), k > 1 ? ', which simplifies to ' : '.', ...(k > 1 ? [FR(r / k, t / k), '.'] : []))] });
});
add('g7.scale', 'geo', 8, 'Scale drawings', () => {
  const s = pick([2, 5, 10, 20, 50]), cm = ri(2, 15);
  return prob({ q: P('On a map, 1 centimeter stands for ', N(s), ' kilometers. Two towns are ', N(cm), ' centimeters apart on the map. How far apart are they really?'), ans: N(s * cm), choices: numChoices(s * cm, { extra: [s + cm] }), num: true, data: { e: E.mul(s, cm) }, unit: 'kilometers',
    hint: P('Each centimeter is ', N(s), ' kilometers. Multiply.'), steps: [P(N(cm), ' ', S('×'), ' ', N(s), ' ', S('='), ' ', N(s * cm), ' kilometers.')] });
}, { wp: true });
// ===== Grade 8 =====
add('g8.bothsides', 'alg', 9, 'Equations with x on both sides', () => {
  const x = ri(-8, 10), a = ri(3, 9), c = ri(1, a - 1), b = ri(-10, 15); const d = a * x + b - c * x;
  const bs = b < 0 ? ` − ${-b}` : ` + ${b}`, ds = d < 0 ? ` − ${-d}` : ` + ${d}`;
  return prob({ q: P('Solve for x. ', DS(`${a}x${bs} = ${c}x${ds}`, ''), SAY(`${a} x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} equals ${c} x ${d < 0 ? 'minus' : 'plus'} ${Math.abs(d)}`)), ans: N(x), choices: numChoices(x, { neg: true, spread: 1 }), num: true, neg: true, data: { solve: [['+', ['*', a, 'x'], b], ['+', ['*', c, 'x'], d]] },
    hint: P('Get the x terms on one side and the numbers on the other.'), steps: [P(N(a - c), 'x ', S('='), ' ', N(d - b)), P('x ', S('='), ' ', N(x))] });
});
add('g8.slope', 'alg', 9, 'Slope', () => {
  const x1 = ri(-5, 5), y1 = ri(-5, 5), dx = ri(1, 6), m = ri(-4, 4); const x2 = x1 + dx, y2 = y1 + m * dx;
  return prob({ q: P('What is the slope of the line through ', DS(`(${x1}, ${y1})`, `${x1} comma ${y1}`), ' and ', DS(`(${x2}, ${y2})`, `${x2} comma ${y2}`), '?'), ans: N(m), choices: numChoices(m, { neg: true, spread: 1, extra: [-m].filter(v => v !== m) }), num: true, neg: true, data: { e: ['/', ['-', y2, y1], ['-', x2, x1]] },
    hint: P('Slope is the change in y divided by the change in x.'), steps: [P('Change in y: ', N(y2 - y1), '. Change in x: ', N(dx), '.'), P(N(y2 - y1), ' ', S('÷'), ' ', N(dx), ' ', S('='), ' ', N(m))] });
});
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];
add('g8.pyth', 'geo', 9, 'The Pythagorean theorem', () => {
  const [a, b, c] = pick(TRIPLES);
  return prob({ q: P('A right triangle has legs of ', N(a), ' and ', N(b), '. How long is the hypotenuse?'), vis: { t: 'tri', b: a, h: b, right: true }, ans: N(c), choices: numChoices(c, { extra: [a + b] }), num: true, data: { hyp: [a, b] },
    hint: P('a squared plus b squared equals c squared.'), steps: [P(N(a * a), ' ', S('+'), ' ', N(b * b), ' ', S('='), ' ', N(c * c), '.'), P('The square root of ', N(c * c), ' is ', N(c), '.')] });
});
add('g8.expo', 'alg', 9, 'Exponents', () => {
  const b = ri(2, 5), m = ri(1, 3), n = ri(1, 3); const r = b ** (m + n);
  return prob({ q: P('What is ', DS(`${b}^${m} × ${b}^${n}`, ''), SAY(`${b} to the power ${m}, times ${b} to the power ${n}`), '?'), ans: N(r), choices: numChoices(r, { extra: [b ** (m * n), (b * b) ** (m + n)].filter(x => x !== r && x < 1e6) }), num: true, data: { e: ['*', ['pow', b, m], ['pow', b, n]] },
    hint: P('When you multiply powers with the same base, add the exponents.'), steps: [P(N(b), ' to the power ', N(m + n), ' ', S('='), ' ', N(r))] });
});
add('g8.sqrt', 'num', 9, 'Square roots and estimates', () => {
  const n = ri(2, 15); const exact = chance(0.5); const v = exact ? n * n : n * n + ri(1, 2 * n);
  if (exact) return prob({ q: P('What is the square root of ', N(v), '?'), ans: N(n), choices: numChoices(n, { spread: 1, extra: [v / 2].filter(Number.isInteger) }), num: true, data: { sqrt: v },
    hint: P('What number times itself is ', N(v), '?'), steps: [P(N(n), ' ', S('×'), ' ', N(n), ' ', S('='), ' ', N(v), '.')] });
  const lab = k => W(k + ' and ' + (k + 1)); const opts = uniq([n - 1, n, n + 1, n + 2].filter(k => k > 0), x => x);
  return prob({ q: P('The square root of ', N(v), ' is between which two whole numbers?'), ans: lab(n), choices: opts.map(lab), data: { sqrtBetween: [v, n] },
    hint: P('Find the perfect squares just below and just above ', N(v), '.'), steps: [P(N(n * n), ' ', S('<'), ' ', N(v), ' ', S('<'), ' ', N((n + 1) ** 2), ', so it is between ', N(n), ' and ', N(n + 1), '.')] });
});
add('g8.func', 'alg', 9, 'Linear functions', () => {
  const m = ri(-5, 6) || 2, b = ri(-10, 10), x = ri(-5, 8);
  const bs = b < 0 ? ` − ${-b}` : ` + ${b}`;
  return prob({ q: P('If ', DS(`y = ${m}x${bs}`, ''), SAY(`y equals ${m} x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)}`), ', what is y when x ', S('='), ' ', N(x), '?'), ans: N(m * x + b), choices: numChoices(m * x + b, { neg: true, extra: [m + x + b, m * x - b].filter(v => v !== m * x + b) }), num: true, neg: true, data: { e: ['+', ['*', m, x], b] },
    hint: P('Replace x with ', N(x), '.'), steps: [P(N(m), ' ', S('×'), ' ', N(x), ' ', S('='), ' ', N(m * x)), P(N(m * x), ' ', S(b < 0 ? '−' : '+'), ' ', N(Math.abs(b)), ' ', S('='), ' ', N(m * x + b))] });
});
add('g8.volcyl', 'geo', 9, 'Volume of cylinders (use 3.14)', () => {
  const r = ri(1, 6), h = ri(2, 10); const val = 314 * r * r * h; const s = trimDec(decStr(val, 2));
  const opts = uniq([s, trimDec(decStr(314 * r * h, 2)), trimDec(decStr(628 * r * h, 2)), trimDec(decStr(val + 314, 2))], x => x).slice(0, 4);
  return prob({ q: P('A cylinder jar has a radius of ', N(r), ' and a height of ', N(h), '. Using 3.14 for pi, what is its volume?'), ans: DEC(s), choices: shuffle(opts).map(DEC), data: { e: ['*', ['/', 314, 100], ['*', ['*', r, r], h]] }, dec: true,
    hint: P('Volume is pi times radius squared times height.'), steps: [P(DEC('3.14'), ' ', S('×'), ' ', N(r * r), ' ', S('×'), ' ', N(h), ' ', S('='), ' ', DEC(s))] });
});
add('g8.sci', 'num', 9, 'Scientific notation', () => {
  const m = ri(11, 99), e = ri(3, 6); const n = m * 10 ** (e - 1);
  const lab = (a, k) => W(`${decStr(a, 1)} × 10^${k}`, `${decStr(a, 1).replace('.', ' point ')} times ten to the ${k}`);
  return prob({ q: P('Write ', N(n), ' in scientific notation.'), ans: lab(m, e), choices: shuffle([lab(m, e), lab(m, e - 1), lab(m, e + 1), lab(m, e - 2)]), data: { sci: [n, m, e] },
    hint: P('Move the decimal point so there is one digit before it. Count the moves.'), steps: [P(N(n), ' ', S('='), ' ', DS(`${decStr(m, 1)} × 10^${e}`, ''), SAY(`${decStr(m, 1).replace('.', ' point ')} times ten to the ${e}`))] });
});
add('g8.transform', 'geo', 9, 'Transformations', () => {
  const x = ri(-5, 5), y = ri(-5, 5), dx = ri(-4, 4) || 3, dy = ri(-4, 4) || -2; const lab = ([a, b]) => W(`(${a}, ${b})`, `${a} comma ${b}`);
  const r = [x + dx, y + dy];
  return prob({ q: P('Point ', DS(`(${x}, ${y})`, `${x} comma ${y}`), ' moves ', N(Math.abs(dx)), dx > 0 ? ' right' : ' left', ' and ', N(Math.abs(dy)), dy > 0 ? ' up.' : ' down.', ' Where does it land?'), vis: { t: 'coord', pts: [[x, y]], neg: true }, ans: lab(r), choices: shuffle(uniq([r, [x - dx, y + dy], [x + dx, y - dy], [x + dy, y + dx]])).map(lab), data: { translate: [x, y, dx, dy] },
    hint: P('Right and left change x. Up and down change y.'), steps: [P('x: ', N(x), ' ', S(dx > 0 ? '+' : '−'), ' ', N(Math.abs(dx)), ' ', S('='), ' ', N(r[0]), '. y: ', N(y), ' ', S(dy > 0 ? '+' : '−'), ' ', N(Math.abs(dy)), ' ', S('='), ' ', N(r[1]), '.')] });
});

// ===== index and generation =====
export const SKILL = Object.fromEntries(SKILLS.map(s => [s.id, s]));
export const skillsFor = (strand, lv) => SKILLS.filter(s => s.s === strand && s.lv === lv);
// nearest level that has skills in this strand
export function skillsNear(strand, lv) {
  for (let d = 0; d <= 9; d++) { for (const l of [lv - d, lv + d]) { if (l < 0 || l > 9) continue; const r = skillsFor(strand, l); if (r.length) return r; } }
  return [];
}
export function gen(id) {
  const sk = SKILL[id]; let p = null;
  for (let t = 0; t < 20 && !p; t++) { try { p = sk.gen(); } catch (e) { if (t === 19) throw e; } }
  return { ...p, id, strand: sk.s, lv: sk.lv, skillName: sk.name, wp: !!sk.wp, factKind: sk.factKind };
}
