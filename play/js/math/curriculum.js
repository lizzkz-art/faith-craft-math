// School-order plan ("Follow school order (MCPS)").
// Unit order and suggested day counts: Amplify Desmos Math scope and sequence, the program MCPS uses starting in 2026–27
// (sources in CURRICULUM_SOURCES.md). Only the order, the unit titles, and our own plain-words topic summaries are used here.
// The link between each unit and the game's practice skills is our own alignment, based on the unit titles and the
// Maryland College and Career Ready Standards for that grade.
import { SKILL } from './skills.js';

const U = (title, days, plain, skills) => ({ title, days, plain, skills });
export const UNITS = {
  0: [U('Math All Around Us', 20, 'counting small groups', ['pk.count5', 'pk.more']), U('Exploring Flat Shapes', 20, 'circles, squares, triangles', ['pk.shape']),
    U('Counting and Finding Patterns', 20, 'counting and color patterns', ['pk.count5', 'pk.pattern']), U('Adding, Subtracting, and Sharing', 20, 'putting groups together', ['pk.join', 'pk.more']),
    U('Measuring and Comparing', 20, 'longer and shorter, more and fewer', ['pk.bigger', 'pk.more']), U('Composing, Decomposing, and Sharing', 20, 'making and breaking small groups', ['pk.join', 'pk.count5']),
    U('Data and Solid Shapes', 20, 'sorting and comparing groups', ['pk.more', 'pk.shape'])],
  1: [U('Math in Our World', 20, 'counting and comparing', ['k.count20', 'k.compare']), U('Numbers 1–10', 26, 'counting to 10 and what comes next', ['k.count20', 'k.after', 'k.compare']),
    U('Flat Shapes All Around Us', 18, 'naming flat shapes and their sides', ['k.shapes']), U('Understanding Addition and Subtraction', 22, 'adding and taking away within 10', ['k.add10', 'k.sub10']),
    U('Make and Break Apart Numbers Within 10', 18, 'ways to make 10', ['k.make10', 'k.add10']), U('Numbers 0–20', 13, 'counting to 20', ['k.count20', 'k.after']),
    U('Solid Shapes All Around Us', 17, 'solid shapes and comparing lengths', ['k.solid', 'k.compareLen'])],
  2: [U('Adding, Subtracting, and Working With Data', 19, 'adding and subtracting within 10', ['k.add10', 'k.sub10', 'k.make10']), U('Addition and Subtraction Story Problems', 25, 'story problems within 20', ['g1.add20', 'g1.sub20', 'g1.missing']),
    U('Adding and Subtracting Within 20', 24, 'facts within 20 and missing numbers', ['g1.add20', 'g1.sub20', 'g1.missing']), U('Numbers to 99', 27, 'tens and ones, comparing to 100', ['g1.tens', 'g1.compare100']),
    U('Adding Within 100', 18, 'adding tens and ones', ['g1.tensAdd']), U('Measuring Lengths of Up to 120 Length Units', 19, 'measuring length', ['g1.length']),
    U('Geometry and Time', 20, 'telling time and halves', ['g1.time', 'g1.halves'])],
  3: [U('Working With Data and Solving Comparison Problems', 20, 'comparing numbers and "how many more"', ['g2.sub100', 'g2.add100']), U('Adding and Subtracting Within 100', 26, 'adding and subtracting within 100', ['g2.add100', 'g2.sub100', 'g2.coins']),
    U('Measuring Length', 19, 'measuring length', ['g2.length']), U('Addition and Subtraction on the Number Line', 16, 'number-line adding and subtracting', ['g2.add100', 'g2.sub100', 'g2.length']),
    U('Numbers to 1,000', 15, 'place value to 1,000 and skip counting', ['g2.place', 'g2.skip']), U('Geometry and Time', 20, 'shapes, equal shares, time, and coins', ['g2.sides', 'g2.shares', 'g2.time5', 'g2.coins']),
    U('Adding and Subtracting Within 1,000', 23, 'adding and subtracting within 1,000', ['g2.add1000']), U('Equal Groups', 16, 'equal groups and even or odd', ['g2.groups', 'g2.evenodd'])],
  4: [U('Introducing Multiplication', 22, 'equal groups, arrays, and bar graphs', ['g3.mulfact', 'g3.bargraph']), U('Area and Multiplication', 17, 'area with square units', ['g3.area', 'g3.mulfact']),
    U('Wrapping Up Addition and Subtraction Within 1,000', 26, 'adding, subtracting, and rounding to 1,000', ['g3.add1000', 'g3.round']), U('Relating Multiplication to Division', 26, 'division facts and two-step problems', ['g3.divfact', 'g3.unknown', 'g3.x10', 'g3.twostep']),
    U('Fractions as Numbers', 19, 'fractions of a whole and on a number line', ['g3.frac', 'g3.fracline', 'g3.fraceq', 'g3.fraccmp']), U('Measuring Length, Time, Liquid Volume, and Weight', 23, 'time and measurement problems', ['g3.elapsed', 'g3.liquid']),
    U('Two-Dimensional Shapes and Perimeter', 16, 'shapes and perimeter', ['g3.quads', 'g3.perim'])],
  5: [U('Factors and Multiples', 15, 'factor pairs, multiples, prime and composite', ['g4.factors', 'g4.multiple', 'g4.prime']), U('Fraction Equivalence and Comparison', 21, 'equal fractions and comparing fractions', ['g4.fraceq', 'g4.fraccmp']),
    U('Extending Operations to Fractions', 21, 'adding and subtracting fractions, mixed numbers, whole number × fraction', ['g4.fracadd', 'g4.mixed', 'g4.fracwhole']), U('From Hundredths to Hundred Thousands', 26, 'decimals to hundredths, big numbers, rounding, adding and subtracting', ['g4.decimal', 'g4.deccmp', 'g4.placebig', 'g4.cmpbig', 'g4.addsub']),
    U('Multiplicative Comparison and Measurement', 21, '"times as many", measurement conversions, area and perimeter', ['g4.times', 'g4.convert', 'g4.areaperim']), U('Multiplying and Dividing Multi-Digit Numbers', 25, 'multi-digit multiplication, long division, multi-step word problems', ['g4.mul1', 'g4.mul2', 'g4.div', 'g4.remwp', 'g4.multistep']),
    U('Angles and Properties of Shapes', 24, 'angles, lines, symmetry, and triangles', ['g4.angletype', 'g4.anglemeas', 'g4.lines'])],
  6: [U('Volume', 18, 'volume of boxes', ['g5.volume']), U('Fractions as Quotients and Fraction Multiplication', 19, 'sharing as fractions, multiplying fractions', ['g5.fracquot', 'g5.fracmul']),
    U('Multiplying and Dividing Fractions', 20, 'multiplying and dividing with fractions', ['g5.fracmul', 'g5.fracdiv']), U('Wrapping Up Multiplication and Division With Multi-Digit Numbers', 25, 'multi-digit multiplication and division', ['g5.mulstd', 'g5.div2', 'g5.wp']),
    U('Place Value Patterns and Decimal Operations', 29, 'decimals to thousandths, powers of 10', ['g5.pow10', 'g5.decplace', 'g5.decop']), U('More Decimal and Fraction Operations', 25, 'unlike fractions, decimal operations, conversions', ['g5.fracunlike', 'g5.decop', 'g5.custom']),
    U('Shapes on the Coordinate Plane', 16, 'coordinate plane, shape families, order of operations', ['g5.coord', 'g5.classify', 'g5.expo'])],
  7: [U('Area and Surface Area', 16, 'area of triangles', ['g6.triarea']), U('Introducing Ratios', 19, 'ratios', ['g6.ratio']), U('Unit Rates and Percentages', 17, 'unit rates and percents', ['g6.rate', 'g6.percent']),
    U('Dividing Fractions', 18, 'dividing fractions', ['g6.divfrac']), U('Decimal Arithmetic', 17, 'decimal operations', ['g5.decop', 'g5.pow10']), U('Expressions and Equations', 20, 'expressions and one-step equations', ['g6.onestep', 'g6.expr']),
    U('Positive and Negative Numbers', 17, 'negative numbers and absolute value', ['g6.integers']), U('Describing Data', 18, 'mean of a data set', ['g6.mean'])],
  8: [U('Scale Drawings', 14, 'scale and maps', ['g7.scale']), U('Introducing Proportional Relationships', 17, 'proportional relationships', ['g7.prop']), U('Measuring Circles', 11, 'circumference and area of circles', ['g7.circle']),
    U('Proportional Relationships and Percentages', 16, 'percent increase and decrease', ['g7.pctchange']), U('Operations With Positive and Negative Numbers', 19, 'negative number operations', ['g7.intops']),
    U('Expressions, Equations, and Inequalities', 20, 'two-step equations', ['g7.twostep']), U('Angles, Triangles, and Prisms', 14, 'angle pairs', ['g7.angles']), U('Probability and Sampling', 14, 'probability', ['g7.prob'])],
  9: [U('Rigid Transformation and Congruence', 16, 'moving shapes on a grid', ['g8.transform']), U('Dilations, Similarity, and Slope', 14, 'slope', ['g8.slope']), U('Proportional and Linear Relationships', 16, 'slope and linear rules', ['g8.slope', 'g8.func']),
    U('Linear Equations and Linear Systems', 17, 'equations with x on both sides', ['g8.bothsides']), U('Functions and Volume', 18, 'functions and cylinder volume', ['g8.func', 'g8.volcyl']), U('Associations in Data', 15, 'linear patterns in data', ['g8.func']),
    U('Exponents and Scientific Notation', 17, 'exponents and scientific notation', ['g8.expo', 'g8.sci']), U('The Pythagorean Theorem and Irrational Numbers', 18, 'Pythagorean theorem and square roots', ['g8.pyth', 'g8.sqrt'])],
};
// MCPS 2026–27 calendar (verified dates only): first day Aug 25, 2026; last day Jun 16, 2027;
// winter break Dec 23, 2026 – Jan 3, 2027; spring break Mar 26 – Apr 4, 2027; Labor Day Sep 7, 2026.
// Other closures are not included, so this is an estimate. Parents can pick the current unit by hand.
const d = s => new Date(s + 'T12:00:00');
export const YEAR = { first: d('2026-08-25'), last: d('2027-06-16'), off: [['2026-09-07', '2026-09-07'], ['2026-12-23', '2027-01-03'], ['2027-03-26', '2027-04-04']].map(([a, b]) => [d(a), d(b)]) };
export function schoolDaysBetween(a, b) {
  let n = 0; const x = new Date(a); x.setHours(12, 0, 0, 0); const end = new Date(b); end.setHours(12, 0, 0, 0);
  while (x < end) { const wd = x.getDay(); if (wd && wd < 6 && !YEAR.off.some(([p, q]) => x >= p && x <= q)) n++; x.setDate(x.getDate() + 1); }
  return n;
}
export const TOTAL_DAYS = schoolDaysBetween(YEAR.first, new Date(YEAR.last.getTime() + 864e5));
// Which unit a class following the published order would be in on this date (0-based index).
export function unitOnDate(lv, date = new Date()) {
  const units = UNITS[lv]; if (!units) return 0;
  if (date < YEAR.first) return 0; if (date > YEAR.last) return units.length - 1;
  const total = units.reduce((a, u) => a + u.days, 0); const pos = schoolDaysBetween(YEAR.first, date) / TOTAL_DAYS * total;
  let acc = 0; for (let i = 0; i < units.length; i++) { acc += units[i].days; if (pos < acc) return i; }
  return units.length - 1;
}
export const unitLabel = (lv, i) => { const u = UNITS[lv][i]; return `Unit ${i + 1}: ${u.title}`; };
// Build the practice plan for a school grade (level index), optional unit override (-1/undefined = by date).
export function plan(lv, { date = new Date(), unit } = {}) {
  lv = Math.max(0, Math.min(9, lv)); const units = UNITS[lv];
  const cur = unit != null && unit >= 0 ? Math.min(unit, units.length - 1) : unitOnDate(lv, date);
  const current = units[cur].skills;
  const earlier = units.slice(0, cur).flatMap(u => u.skills);
  const prevGrade = lv > 0 ? UNITS[lv - 1].flatMap(u => u.skills) : [];
  const preview = cur + 1 < units.length ? units[cur + 1].skills : (lv < 9 ? UNITS[lv + 1][0].skills : []);
  return { lv, cur, unit: units[cur], label: unitLabel(lv, cur), current, review: [...new Set([...earlier, ...prevGrade])].filter(s => !current.includes(s)), earlier, prevGrade,
    preview: preview.filter(s => !current.includes(s)), next: cur + 1 < units.length ? unitLabel(lv, cur + 1) : (lv < 9 ? 'Next grade, ' + unitLabel(lv + 1, 0) : '') };
}
// Pick the next skill: about 55% current unit, 25% review (earlier units this year and last grade), 20% preview.
// If the child's placed level in a strand is below the school grade, an easier skill from the same strand stands in.
export function pickPlanned(p, rnd = Math.random, strandLevel = null, near = null) {
  const r = rnd(); let pool, tag;
  if (r < 0.55 || (!p.review.length && r < 0.8) || (!p.preview.length && r >= 0.8 && !p.review.length)) { pool = p.current; tag = 'unit'; }
  else if (r < 0.8 && p.review.length) { pool = rnd() < 0.5 && p.earlier.length ? p.earlier : (p.prevGrade.length ? p.prevGrade : p.review); tag = 'review'; }
  else if (p.preview.length) { pool = p.preview; tag = 'preview'; } else { pool = p.current; tag = 'unit'; }
  pool = pool.filter(id => SKILL[id]); let id = pool[Math.floor(rnd() * pool.length)];
  if (strandLevel && near) { const sk = SKILL[id]; const pl = strandLevel(sk.s); if (pl != null && pl < sk.lv - 1) { const alt = near(sk.s, pl + 1); if (alt.length) { id = alt[Math.floor(rnd() * alt.length)].id; tag = 'bridge'; } } }
  return { id, tag };
}
export const TAG_WORDS = { unit: 'This unit', review: 'Review', preview: 'Coming up', bridge: 'Building up' };
