// Faith Craft Math: players, placement quiz, problem runner, practice modes, parent area, report card.
import { state, saveState, profiles, saveProfiles, activeProfile, addProfile, deleteProfile, setActive, LOOKS, MAX_PROFILES, freshMath, resetAll } from './save.js';
import { Speech } from './speech.js';
import { Sound } from './audio.js';
import { h, openScreen, closeScreen, readable, speakBtn, toast, confetti, sayLines, starBurst, recordWidget, today } from './ui.js';
import { valKey, setRandom } from './math/core.js';
import { SKILLS, SKILL, STRANDS, STRAND_ORDER, LEVELS, LEVEL_SHORT, gen, skillsNear, skillsFor } from './math/skills.js';
import { Placement, startLevel, gradeForAge } from './math/placement.js';
import { UNITS, plan, pickPlanned, TAG_WORDS, unitLabel, unitOnDate } from './math/curriculum.js';
import { themeSet, THEMES } from './math/themes.js';
import { vis } from './math/vis.js';

let G = null; export function initMath(api) { G = api; }
const tap = fn => e => { e && e.preventDefault && e.preventDefault(); Sound.unlock(); fn(e); };
const rpick = a => a[Math.floor(Math.random() * a.length)];
export const M = () => state.math;
export const prof = () => activeProfile() || { name: 'Player 1', age: 9, grade: 5, look: 'teal' };
export const band = (age = prof().age) => age <= 5 ? 'pre' : age <= 8 ? 'kid' : age <= 11 ? 'mid' : 'teen';
export const PRAISE = {
  pre: ['Yay! You did it!', 'Great job!', 'Wow, super!', 'You got it!'],
  kid: ['Yes! That’s right.', 'You got it!', 'Nice work!', 'Awesome!', 'Great job!'],
  mid: ['Nice work!', 'That’s it!', 'You nailed it.', 'Solid thinking!', 'Correct!'],
  teen: ['Correct.', 'That’s right.', 'Correct. Nice.', 'Right.'],
};
export const MISS1 = 'Not quite. Here’s a hint.';
export const MISS2 = 'Here’s how to solve it.';
export const QUIZ_ACK = ['Thanks!', 'Got it.', 'Okay, next one.'];
export const UI_LINES = { quizIntro: 'Let’s find your starting spot! Just do your best. Some questions may be easy and some may be tricky. It’s okay to not know an answer.', quizDone: 'All done! Thanks for doing your best.', setDone: 'Nice work! Set complete.', missionMath: 'Math solved! Great work.', pickPlayer: 'Who’s playing?', notSure: 'I’m not sure yet' };
// school grade (level index) for school order: parent setting, else from age
export const schoolGrade = () => { const p = prof(); return p.grade != null ? p.grade : gradeForAge(p.age || 9); };
export function levels() {
  const m = M(); if (m.levels) return m.levels;
  const L = startLevel(prof().age || 9); const out = {}; for (const s of STRAND_ORDER) out[s] = Math.max(STRANDS[s].min, Math.min(STRANDS[s].max, s === 'alg' && L < 7 ? 7 : L)); return out;
}
export function overallLevel() { const L = levels(); const v = STRAND_ORDER.filter(s => s !== 'alg' || L.alg > 7).map(s => L[s]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; }
export function curPlan() { const s = state.settings; return plan(schoolGrade(), { unit: s.unitOverride }); }
// school order: topics from lower grades are always fine; at the school grade, only units up to the next one
export function allowedSkill(id) {
  if (!state.settings.schoolOrder) return true; const sk = SKILL[id]; if (!sk) return false; const g = schoolGrade();
  if (sk.lv < g) return true; if (sk.lv > g) return false;
  const p = curPlan(); return UNITS[g].slice(0, p.cur + 2).some(u => u.skills.includes(id));
}
export function unitOf(id) { for (const lv in UNITS) { const i = UNITS[lv].findIndex(u => u.skills.includes(id)); if (i >= 0) return { lv: +lv, i, label: unitLabel(+lv, i), plain: UNITS[lv][i].plain }; } return null; }

// ---------- recording answers + gentle adaptive levels ----------
export function record(p, ok, tries, mode) {
  const m = M(); const sk = SKILL[p.id] || { s: p.strand, lv: p.lv, name: p.skillName };
  const r = (m.skills[p.id] ||= { n: 0, c: 0, first: today(), last: today(), lv: sk.lv, name: sk.name, strand: sk.s, hist: [] });
  r.n++; if (ok && tries === 1) r.c++; r.last = today(); r.hist.push(ok && tries === 1 ? 1 : 0); if (r.hist.length > 10) r.hist.shift();
  m.answered++; if (ok && tries === 1) m.correct++;
  if (p.fact) { const f = (m.facts[p.fact] ||= { n: 0, c: 0, kind: p.factKind }); f.n++; if (ok && tries === 1) f.c++; }
  let msg = null;
  if (mode !== 'quiz' && sk.s) msg = adapt(sk.s, ok && tries === 1, sk.lv);
  saveState(); return msg;
}
function adapt(strand, ok, lv) {
  const m = M(); if (state.settings.lockLevel) return null; if (!m.levels) m.levels = { ...levels() };
  const cur = m.levels[strand]; if (cur == null || lv < cur - 1) return null; // easy review items do not move the level
  const rec = (m.recent[strand] ||= []); rec.push(ok ? 1 : 0); if (rec.length > 10) rec.shift();
  const S = STRANDS[strand]; const last5 = rec.slice(-5); let msg = null;
  if (rec.length >= 10 && rec.reduce((a, b) => a + b, 0) >= 8 && cur < S.max) { m.levels[strand] = cur + 1; m.recent[strand] = []; msg = `Level up! ${S.short}: ${LEVELS[cur + 1]}`; }
  else if (last5.length === 5 && last5.filter(x => !x).length >= 3 && cur > S.min) { m.levels[strand] = cur - 1; m.recent[strand] = []; msg = null; }
  if (m.levels[strand] !== cur) m.hist.push({ d: today(), strand, from: cur, to: m.levels[strand], why: m.levels[strand] > cur ? 'mastered' : 'more practice' });
  return msg;
}

// ---------- speaking a problem ----------
export function sayP(pp, o = {}) { if (!pp || !Speech.available) return; Speech.speakSeq(pp.say, o); }
function sayVal(v) { if (v && v.s && Speech.available) Speech.speakSeq(v.s); }
function sayLine(t, then) { if (Speech.available) Speech.speakSeq([{ t }], { onEnd: then }); else if (then) then(); }
const autoSay = () => state.settings.autoRead && Speech.available;
const SPK = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const spk = (fn, cls = '') => h('button', { class: 'speak ' + cls, 'aria-label': 'Read aloud', html: SPK, onclick: tap(fn) });
const numpadOK = p => p.num && p.ans && p.ans.k === 'n' && state.settings.numpad && (prof().age || 9) >= 7 && (p.lv || 0) >= 4;

// ---------- the problem runner (used by practice, quiz, missions, and games) ----------
// o: { title, total, next(i) -> problem, mode: 'practice'|'quiz'|'mission'|'sprint', onDone(summary), onBack, tagOf(p), timer }
export function runSet(o) {
  const body = openScreen(o.title, { onBack: () => { Speech.cancel(); clearInterval(timerI); (o.onBack || closeScreen)(); }, cls: 'mathscreen' });
  let i = 0, right = 0, streak = 0, best = 0, timerI = 0, tLeft = o.timer || 0; const results = [];
  const head = h('div', { class: 'mhead' }); const card = h('div', { class: 'mcard' }); body.append(head, card);
  if (o.timer) { timerI = setInterval(() => { tLeft--; const t = head.querySelector('.mtimer'); if (t) t.textContent = '⏱ ' + tLeft + 's'; if (tLeft <= 0) { clearInterval(timerI); finish(); } }, 1000); }
  function finish() { clearInterval(timerI); Speech.cancel(); const s = { right, total: results.length, results, best }; if (o.onDone) o.onDone(s, body); }
  function show() {
    if (i >= o.total) return finish();
    const p = o.next(i); if (!p) return finish(); let tries = 0, done = false;
    
    const pct = Math.round(100 * i / o.total);
    const tag = o.tagOf ? o.tagOf(p) : null;
    head.innerHTML = '';
    head.append(h('div', { class: 'mprog' }, h('div', { style: `width:${o.mode === 'quiz' ? Math.round(100 * (o.progress ? o.progress() : i / o.total)) : pct}%` })),
      h('div', { class: 'mmeta' }, o.mode === 'quiz' ? h('span', {}, 'Finding your starting spot') : h('span', {}, `${i + 1} of ${o.total}`), tag ? h('span', { class: 'chip tag-' + tag.k }, tag.t) : null,
        o.mode !== 'quiz' && p.skillName ? h('span', { class: 'muted small' }, p.skillName) : null, o.mode === 'sprint' || o.streak ? h('span', { class: 'chip streak' }, '🔥 ' + streak) : null, o.timer ? h('span', { class: 'chip mtimer' }, '⏱ ' + tLeft + 's') : null));
    card.innerHTML = '';
    const qEl = h('div', { class: 'mq' }, spk(() => sayP(p.q), 'big'), h('div', { class: 'mqtext' }, p.q.text));
    const visEl = p.vis ? h('div', { class: 'mvisw', html: vis(p.vis) }) : null;
    const fb = h('div', { class: 'mfb', 'aria-live': 'polite' });
    const nextBtn = h('button', { class: 'btn primary big mnext hidden', onclick: tap(() => { Speech.cancel(); i++; show(); }) }, i + 1 >= o.total ? 'Finish' : 'Next ›');
    const ansWrap = h('div', { class: 'mans' });
    const choose = (val, btn) => {
      if (done) return; const ok = valKey(val) === valKey(p.ans); tries++;
      if (o.mode === 'quiz') { done = true; results.push({ p, ok, tries }); o.onAnswer && o.onAnswer(p, ok, tries); btn && btn.classList.add('picked'); ansWrap.querySelectorAll('button').forEach(b => b.disabled = true); Sound.click();
        const ack = rpick(QUIZ_ACK); fb.innerHTML = ''; fb.append(h('div', { class: 'fb neutral' }, ack)); setTimeout(() => { i++; show(); }, 650); return; }
      if (ok) {
        done = true; if (tries === 1) { right++; streak++; best = Math.max(best, streak); } else streak = 0;
        btn && btn.classList.add('right'); ansWrap.querySelectorAll('button').forEach(b => b.disabled = true); Sound.good();
        const msg = record(p, true, tries, o.mode); results.push({ p, ok: tries === 1, tries }); o.onAnswer && o.onAnswer(p, tries === 1, tries);
        const ph = rpick(PRAISE[band()]); fb.innerHTML = ''; fb.append(h('div', { class: 'fb good' }, '✓ ' + ph));
        if (msg) { fb.append(h('div', { class: 'levelup' }, msg)); }
        if (tries > 1 || band() === 'pre') fb.append(stepsEl(p));
        if (o.mode === 'sprint') { setTimeout(() => { i++; show(); }, 350); return; }
        nextBtn.classList.remove('hidden'); if (autoSay()) Speech.speakSeq([{ t: ph }]); starBurst(card);
        return;
      }
      btn && btn.classList.add('miss'); btn && (btn.disabled = true); Sound.gentle(); streak = 0;
      if (o.mode === 'sprint') { done = true; record(p, false, tries, o.mode); results.push({ p, ok: false, tries }); fb.innerHTML = ''; fb.append(h('div', { class: 'fb try' }, 'Answer: ', h('b', {}, p.ans.d))); setTimeout(() => { i++; show(); }, 900); return; }
      if (tries === 1) { fb.innerHTML = ''; fb.append(h('div', { class: 'fb try' }, MISS1), h('div', { class: 'mhint' }, spk(() => sayP(p.hint)), h('span', {}, p.hint.text)));
        if (autoSay()) Speech.speakSeq([{ t: MISS1 }, ...p.hint.say]); return; }
      done = true; record(p, false, tries, o.mode); results.push({ p, ok: false, tries }); o.onAnswer && o.onAnswer(p, false, tries);
      ansWrap.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.k === valKey(p.ans)) b.classList.add('right'); });
      fb.innerHTML = ''; fb.append(h('div', { class: 'fb try' }, MISS2), stepsEl(p), h('div', { class: 'mfinal' }, 'Answer: ', h('b', {}, p.ans.d)));
      if (autoSay()) Speech.speakSeq([{ t: MISS2 }, ...p.steps.flatMap(s => s.say)]);
      nextBtn.classList.remove('hidden');
    };
    const choicesEl = () => { const w = h('div', { class: 'mchoices n' + p.choices.length + (p.choices.some(c => c.d.length > 14) ? ' long' : '') });
      p.choices.forEach(c => { const b = h('button', { class: 'mchoice' + (p.colorChoices ? ' color c-' + c.d : ''), 'data-k': valKey(c), onclick: tap(() => choose(c, b)) }, p.colorChoices ? h('span', { class: 'swatch' }) : null, h('span', {}, c.d));
        const row = h('div', { class: 'mchoice-row' }, b, band() === 'pre' || band() === 'kid' ? spk(() => sayVal(c), 'small') : null); w.append(row); }); return w; };
    if (numpadOK(p) && !p.forceChoices) {
      let v = ''; const disp = h('div', { class: 'npdisp' }, '\u00a0');
      const upd = () => disp.textContent = v ? v.replace('-', '−') : '\u00a0';
      const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', p.neg ? '−' : '', '0', '⌫'];
      const pad = h('div', { class: 'numpad' }, keys.map(k => k ? h('button', { class: 'npk', onclick: tap(() => { if (done) return; if (k === '⌫') v = v.slice(0, -1); else if (k === '−') v = v.startsWith('-') ? v.slice(1) : '-' + v; else if (v.replace('-', '').length < 7) v += k; upd(); }) }, k) : h('span')));
      const okB = h('button', { class: 'btn primary big npok', onclick: tap(() => { if (done || !v || v === '-') return; const n = Number(v); const val = { k: 'n', v: n, d: String(n) }; if (n === p.ans.v) choose(p.ans, null); else { choose(val, null); v = ''; upd(); } }) }, 'Check');
      const sw = h('button', { class: 'btn small', onclick: tap(() => { ansWrap.innerHTML = ''; ansWrap.append(choicesEl()); }) }, 'Show choices');
      ansWrap.append(h('div', { class: 'npwrap' }, disp, pad, h('div', { class: 'row center' }, okB, sw)));
    } else ansWrap.append(choicesEl());
    card.append(...[qEl, visEl, ansWrap, fb, nextBtn].filter(Boolean));
    if (autoSay()) sayP(p.q);
  }
  function stepsEl(p) { return h('div', { class: 'msteps' }, h('div', { class: 'row' }, spk(() => Speech.speakSeq(p.steps.flatMap(s => s.say))), h('b', {}, 'How to solve it')), h('ol', {}, p.steps.map(s => h('li', {}, s.text)))); }
  show();
  return { body };
}
function summaryCard(body, s, { title, onAgain, onDone, extra }) {
  body.innerHTML = ''; const pct = s.total ? Math.round(100 * s.right / s.total) : 0; if (s.right) Sound.fanfare();
  body.append(h('div', { class: 'card results' }, h('h3', {}, title || 'Set complete!'), h('div', { class: 'bigscore' }, `${s.right} / ${s.total}`), h('div', { class: 'muted' }, 'correct on the first try'),
    s.best > 2 ? h('div', { class: 'chip streak' }, '🔥 Best streak: ' + s.best) : null, extra || null,
    h('div', { class: 'row center' }, onAgain ? h('button', { class: 'btn big', onclick: tap(onAgain) }, 'Play again') : null, h('button', { class: 'btn primary big', onclick: tap(onDone) }, 'Done'))));
  state.stars += Math.max(1, Math.round(pct / 34)); saveState(); if (autoSay()) Speech.speakSeq([{ t: UI_LINES.setDone }]);
}

// ---------- choosing problems ----------
const strandLv = s => levels()[s];
function pickAtLevel(strands) {
  const L = levels(); const s = rpick(strands.filter(x => L[x] != null)); let pool = skillsNear(s, L[s]).filter(k => allowedSkill(k.id));
  if (!pool.length) pool = skillsNear(s, Math.min(L[s], schoolGrade())).filter(k => allowedSkill(k.id));
  if (!pool.length) pool = skillsNear(s, L[s]);
  return rpick(pool).id;
}
export function nextPlanned() {
  if (state.settings.schoolOrder) { const p = curPlan(); const r = pickPlanned(p, Math.random, strandLv, skillsNear); return { ...gen(r.id), tag: r.tag }; }
  const strands = STRAND_ORDER.filter(s => s !== 'alg' || levels().alg > 7 || overallLevel() >= 7); return { ...gen(pickAtLevel(strands)), tag: null };
}
const tagOf = p => p.tag ? { k: p.tag, t: TAG_WORDS[p.tag] } : null;
export function todaysMath(back) {
  const done = () => back ? back() : home();
  runSet({ title: 'Today’s Math', total: 10, mode: 'practice', next: () => nextPlanned(), tagOf, onBack: done,
    onDone: (s, body) => summaryCard(body, s, { title: 'Today’s Math: done!', onAgain: () => todaysMath(back), onDone: done }) });
}
export function numberGames() {
  const body = openScreen('Number Games', { onBack: home }); const L = levels();
  body.append(h('div', { class: 'muted center' }, 'Pick a kind of math. Problems match your level.'));
  const grid = h('div', { class: 'menu-grid wide' });
  for (const s of STRAND_ORDER) { if (s === 'alg' && overallLevel() < 7) continue; const lv = Math.max(STRANDS[s].min, Math.min(STRANDS[s].max, L[s]));
    grid.append(h('button', { class: 'btn big strandbtn s-' + s, onclick: tap(() => runSet({ title: STRANDS[s].short, total: 8, mode: 'practice', next: () => ({ ...gen(pickAtLevel([s])) }), onBack: numberGames, onDone: (r, b) => summaryCard(b, r, { onAgain: () => grid.querySelector('.s-' + s).click(), onDone: numberGames }) })) }, h('b', {}, STRANDS[s].short), h('span', { class: 'small' }, LEVELS[lv]))); }
  body.append(grid);
}
export function wordProblems() {
  const L = levels(); const pool = SKILLS.filter(k => k.wp && allowedSkill(k.id) && k.lv <= Math.max(...Object.values(L)) && k.lv >= Math.min(L[k.s] != null ? L[k.s] : 0, schoolGrade()) - 2);
  const near = pool.length ? pool : SKILLS.filter(k => k.wp && k.lv <= overallLevel() + 1);
  runSet({ title: 'Word Problems', total: 6, mode: 'practice', next: () => gen(rpick(near.filter(k => Math.abs(k.lv - Math.min(overallLevel(), schoolGrade())) <= 1).concat(near.slice(-2))).id), onBack: home,
    onDone: (s, b) => summaryCard(b, s, { onAgain: wordProblems, onDone: home }) });
}
// Times tables and facts
import { P, N, S, numChoices, prob, ri } from './math/core.js';
function factProb(a, b, op) {
  if (op === '×') { const r = a * b; return { ...prob({ q: P('What is ', N(a), ' ', S('×'), ' ', N(b), '?'), ans: N(r), choices: numChoices(r, { extra: [a * (b + 1), (a + 1) * b, a + b].filter(x => x !== r) }), num: true, data: { e: ['*', a, b] }, hint: P('Skip count by ', N(b), ', ', N(a), ' times.'), steps: [P(N(a), ' ', S('×'), ' ', N(b), ' ', S('='), ' ', N(r), '.')] }), id: 'g3.mulfact', strand: 'mul', lv: 4, skillName: 'Times tables', fact: 'm' + Math.min(a, b) + 'x' + Math.max(a, b), factKind: 'mul' }; }
  if (op === '÷') { const r = a; const t = a * b; return { ...prob({ q: P('What is ', N(t), ' ', S('÷'), ' ', N(b), '?'), ans: N(r), choices: numChoices(r, { spread: 1 }), num: true, data: { e: ['/', t, b] }, hint: P('What times ', N(b), ' makes ', N(t), '?'), steps: [P(N(b), ' ', S('×'), ' ', N(r), ' ', S('='), ' ', N(t), '.')] }), id: 'g3.divfact', strand: 'mul', lv: 4, skillName: 'Division facts' }; }
  const sub = op === '−'; const x = sub ? a + b : a; const r = sub ? a : a + b;
  return { ...prob({ q: P('What is ', N(x), ' ', S(op), ' ', N(b), '?'), ans: N(r), choices: numChoices(r, { spread: 1 }), num: true, data: { e: [sub ? '-' : '+', x, b] }, hint: P(sub ? 'Count back, or think of the addition fact.' : 'Make a ten, or use a double you know.'), steps: [P(N(x), ' ', S(op), ' ', N(b), ' ', S('='), ' ', N(r), '.')] }), id: sub ? 'g1.sub20' : 'g1.add20', strand: 'add', lv: 2, skillName: sub ? 'Subtraction facts' : 'Addition facts', fact: sub ? undefined : 'a' + Math.min(a, b) + '+' + Math.max(a, b), factKind: sub ? undefined : 'add' };
}
export function timesTables() {
  const body = openScreen('Times Tables', { onBack: home });
  body.append(h('div', { class: 'muted center' }, 'Pick a table. Build a streak by getting answers right on the first try!'));
  const grid = h('div', { class: 'ttgrid' });
  const go = t => runSet({ title: t ? `The ${t}s table` : 'Mixed tables', total: 12, mode: 'practice', streak: true, next: () => { const a = t || ri(2, 12), b = ri(0, 12); return chanceSwap(a, b); }, onBack: timesTables,
    onDone: (s, b) => { const m = M(); m.bestStreak = Math.max(m.bestStreak || 0, s.best); summaryCard(b, s, { onAgain: () => go(t), onDone: timesTables }); } });
  const chanceSwap = (a, b) => Math.random() < 0.5 ? factProb(a, b, '×') : factProb(b, a, '×');
  for (let t = 2; t <= 12; t++) { const f = M().facts; let n = 0, c = 0; for (let b = 0; b <= 12; b++) { const k = 'm' + Math.min(t, b) + 'x' + Math.max(t, b); if (f[k]) { n++; if (f[k].c >= 2 && f[k].c / f[k].n >= 0.8) c++; } }
    grid.append(h('button', { class: 'btn big ttbtn', onclick: tap(() => go(t)) }, h('b', {}, '× ' + t), h('span', { class: 'small' }, c ? `${c}/13 mastered` : ''))); }
  grid.append(h('button', { class: 'btn big primary ttbtn', onclick: tap(() => go(0)) }, h('b', {}, 'Mixed')));
  body.append(grid, h('div', { class: 'muted small center' }, `Best streak: ${M().bestStreak || 0}`));
}
export function factsSprint() {
  const lv = overallLevel(); const kinds = lv <= 2 ? ['+'] : lv === 3 ? ['+', '−'] : lv === 4 ? ['+', '−', '×'] : ['×', '÷'];
  const timer = state.settings.factsTimer ? 60 : 0;
  runSet({ title: 'Math Facts', total: timer ? 99 : 20, mode: 'sprint', timer, next: () => { const op = rpick(kinds); if (op === '×' || op === '÷') return factProb(ri(2, 10), ri(2, 10), op); const mx = lv <= 1 ? 5 : 10; return factProb(ri(0, mx), ri(0, mx), op); }, onBack: home,
    onDone: (s, b) => { const m = M(); if (!m.sprint || s.right > m.sprint.right) m.sprint = { right: s.right, total: s.total, d: today() }; summaryCard(b, s, { title: 'Math Facts', onAgain: factsSprint, onDone: home, extra: h('div', { class: 'muted small' }, `Your best: ${m.sprint.right}`) }); } });
}
// Mission math: themed set inside a Bible mission
export function missionMath(qid, onDone, onCancel) {
  const lv = Math.min(overallLevel(), state.settings.schoolOrder ? Math.max(overallLevel(), 0) : 9);
  const n = band() === 'pre' ? 2 : 3; const set = themeSet(qid, lv, n, allowedSkill); const th = THEMES[qid];
  if (!set.length) { onDone && onDone(); return; }
  runSet({ title: th.title, total: set.length, mode: 'mission', next: i => ({ ...set[i], skillName: th.title }), onBack: () => { closeScreen(true); onCancel && onCancel(); },
    onDone: (s, body) => { body.innerHTML = ''; Sound.fanfare(); confetti();
      body.append(h('div', { class: 'card results' }, h('h3', {}, UI_LINES.missionMath), h('div', { class: 'bigscore' }, `${s.right} / ${s.total}`), h('div', { class: 'muted' }, 'correct on the first try'),
        h('button', { class: 'btn primary huge', onclick: tap(() => { closeScreen(true); onDone && onDone(s); }) }, 'Back to the mission ›')));
      if (autoSay()) Speech.speakSeq([{ t: UI_LINES.missionMath }]); } });
}

// ---------- players ----------
const lookOf = id => LOOKS.find(l => l.id === id) || LOOKS[0];
export function avatar(look, size = 72) {
  const L = lookOf(look); return h('div', { class: 'avatar', style: `width:${size}px;height:${size}px`, html: `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges"><rect x="3" y="2" width="10" height="9" fill="${L.skin}"/><rect x="3" y="1" width="10" height="3" fill="${L.hair}"/>${L.long ? `<rect x="2" y="2" width="2" height="9" fill="${L.hair}"/><rect x="12" y="2" width="2" height="9" fill="${L.hair}"/>` : `<rect x="2" y="2" width="1" height="4" fill="${L.hair}"/><rect x="13" y="2" width="1" height="4" fill="${L.hair}"/>`}<rect x="5" y="6" width="2" height="2" fill="#fff"/><rect x="9" y="6" width="2" height="2" fill="#fff"/><rect x="6" y="6" width="1" height="2" fill="#2a4a8a"/><rect x="10" y="6" width="1" height="2" fill="#2a4a8a"/><rect x="6" y="9" width="4" height="1" fill="#b04a3e"/><rect x="2" y="11" width="12" height="5" fill="${L.shirt}"/><rect x="7" y="12" width="2" height="2" fill="#ffd84a"/></svg>` });
}
export function whoIsPlaying() {
  closeScreen(true); if (G) G.setUIOpen(true);
  const scr = h('div', { class: 'screen title who', id: 'screen' });
  scr.append(h('div', { class: 'logo' }, h('div', { class: 'logo-main' }, 'Faith Craft Math'), h('div', { class: 'logo-sub' }, 'Build, explore, and grow in math')),
    h('h2', { class: 'center' }, UI_LINES.pickPlayer, spk(() => sayLine(UI_LINES.pickPlayer))));
  const grid = h('div', { class: 'profiles' });
  for (const p of profiles.list) grid.append(h('button', { class: 'profile' + (p.id === profiles.active ? ' on' : ''), onclick: tap(() => choosePlayer(p.id)) }, avatar(p.look, 84), h('b', {}, p.name), h('span', { class: 'small muted' }, `Age ${p.age}`)));
  if (profiles.list.length < MAX_PROFILES) grid.append(h('button', { class: 'profile add', onclick: tap(() => newPlayer()) }, h('div', { class: 'plus' }, '+'), h('b', {}, 'Add player')));
  scr.append(grid, h('div', { class: 'row center' }, profiles.list.length ? h('button', { class: 'btn', onclick: tap(() => parentGate(parentArea)) }, '🔒 Parent area') : null),
    h('div', { class: 'muted small foot' }, 'Works offline. No account. Progress stays on this iPad.'));
  document.querySelector('#overlay').append(scr); document.querySelector('#overlay').classList.remove('hidden');
}
export function choosePlayer(id) {
  if (id === profiles.active && state.math) { home(); return; }
  setActive(id); saveState(true); try { sessionStorage.setItem('fcmath.skipWho', '1'); } catch (e) { } location.reload();
}
export function newPlayer() {
  const body = openScreen('New player', { onBack: () => profiles.list.length ? whoIsPlaying() : newPlayer() });
  let age = 9, look = LOOKS[profiles.list.length % LOOKS.length].id;
  const name = h('input', { type: 'text', maxlength: '20', class: 'nameinput', value: 'Player ' + (profiles.list.length + 1), 'aria-label': 'First name or nickname' });
  const ages = h('div', { class: 'agegrid' }); const agesUpd = () => ages.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.a === age));
  for (let a = 3; a <= 14; a++) ages.append(h('button', { class: 'btn agebtn', 'data-a': a, onclick: tap(() => { age = a; agesUpd(); }) }, String(a)));
  const looks = h('div', { class: 'looks' }); const looksUpd = () => looks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.l === look));
  LOOKS.forEach(L => looks.append(h('button', { class: 'lookbtn', 'data-l': L.id, 'aria-label': L.name, onclick: tap(() => { look = L.id; looksUpd(); }) }, avatar(L.id, 64))));
  body.append(h('div', { class: 'card' }, h('label', { class: 'set' }, h('span', {}, 'Name or nickname'), name), h('div', { class: 'muted small' }, 'Tip: a nickname works great. It stays on this iPad.'),
    h('h3', {}, 'How old is the player?'), ages, h('h3', {}, 'Pick a character'), looks,
    h('button', { class: 'btn primary huge', onclick: tap(() => { const p = addProfile({ name: name.value, age, look, grade: gradeForAge(age) }); if (!p) return toast('You can have up to 6 players.'); setActive(p.id); try { sessionStorage.setItem('fcmath.skipWho', '1'); sessionStorage.setItem('fcmath.new', '1'); } catch (e) { } location.reload(); }) }, 'Create player')));
  agesUpd(); looksUpd();
}
// First run for a player: quiz or pick a level
export function startChoice() {
  const body = openScreen('Let’s get started', { onBack: home }); const p = prof();
  body.append(h('div', { class: 'card center' }, h('h3', {}, `Hi, ${p.name}! How should we start?`),
    h('div', { class: 'menu-grid' }, h('button', { class: 'btn primary huge', onclick: tap(placementQuiz) }, '🧭 Take the quick quiz'), h('button', { class: 'btn huge', onclick: tap(pickLevel) }, '📚 Pick a level')),
    h('div', { class: 'muted small' }, 'The quiz takes about 5 minutes and finds a good starting spot for each kind of math.')));
}
export function pickLevel() {
  const body = openScreen('Pick a level', { onBack: startChoice });
  body.append(h('div', { class: 'muted center' }, 'Choose the grade level to practice. You can change it later in the Parent area.'));
  const grid = h('div', { class: 'menu-grid wide' });
  LEVELS.forEach((nm, lv) => grid.append(h('button', { class: 'btn big', onclick: tap(() => { const m = M(); m.levels = {}; for (const s of STRAND_ORDER) m.levels[s] = Math.max(STRANDS[s].min, Math.min(STRANDS[s].max, lv)); m.placed = true; m.placedHow = 'manual'; m.placedAt = today(); m.hist.push({ d: today(), strand: 'all', from: null, to: lv, why: 'picked a level' }); saveState(true); toast('Level set: ' + nm); home(); }) }, nm)));
  body.append(grid);
}
export function placementQuiz() {
  const pl = new Placement(prof().age || 9); let cur = null;
  const intro = openScreen('Let’s find your starting spot!', { onBack: home });
  intro.append(h('div', { class: 'card center' }, h('div', { class: 'bigico' }, '🧭'), h('h3', {}, 'Let’s find your starting spot!'), h('p', {}, 'Just do your best. Some questions may be easy and some may be tricky. It’s okay not to know an answer.'),
    h('button', { class: 'btn primary huge', onclick: tap(go) }, 'Start')));
  if (autoSay()) sayLine(UI_LINES.quizIntro);
  function go() {
    runSet({ title: 'Starting spot quiz', total: 40, mode: 'quiz', progress: () => pl.progress, next: () => { if (pl.finished) return null; cur = pl.next(); if (!cur) return null; const p = gen(cur.id); p.lv = cur.lv; p.forceChoices = true; return p; },
      onAnswer: (p, ok) => pl.answer(ok, cur.lv), onBack: home,
      onDone: () => { const res = pl.result(); const m = M(); m.levels = { ...levels(), ...res }; m.placement = { res, d: today(), items: pl.total }; m.placed = true; m.placedHow = 'quiz'; m.placedAt = today(); m.hist.push({ d: today(), strand: 'all', from: null, to: overallLevel(), why: 'placement quiz' }); saveState(true);
        const b = openScreen('All done!', { onBack: home }); b.append(h('div', { class: 'card center' }, h('div', { class: 'bigico' }, '🎉'), h('h3', {}, UI_LINES.quizDone), h('p', {}, 'Your starting spot is ready. A grown-up can see the details in the Parent area.'),
          h('div', { class: 'row center' }, h('button', { class: 'btn primary huge', onclick: tap(home) }, 'Let’s play!'), h('button', { class: 'btn big', onclick: tap(() => parentGate(placementResult)) }, '🔒 See results (parent)'))));
        if (autoSay()) sayLine(UI_LINES.quizDone); } });
  }
}
export function placementResult() {
  const body = openScreen('Placement result', { onBack: parentArea }); const m = M(); const L = { ...levels() };
  body.append(h('div', { class: 'note' }, 'The placement quiz is a quick starting-point estimate, not a formal assessment.'));
  const tbl = h('table', { class: 'rc' }, h('tr', {}, h('th', {}, 'Kind of math'), h('th', {}, 'Starting level'), h('th', {}, 'Adjust')));
  for (const s of STRAND_ORDER) { if (L[s] == null) continue; const cell = h('td', { class: 'lvcell' }, LEVELS[L[s]]);
    const adj = d => { const S = STRANDS[s]; L[s] = Math.max(S.min, Math.min(S.max, L[s] + d)); cell.textContent = LEVELS[L[s]]; };
    tbl.append(h('tr', {}, h('td', {}, STRANDS[s].name), cell, h('td', {}, h('button', { class: 'btn small', 'aria-label': 'Lower', onclick: tap(() => adj(-1)) }, '−'), h('button', { class: 'btn small', 'aria-label': 'Higher', onclick: tap(() => adj(1)) }, '+')))); }
  body.append(h('div', { class: 'tablewrap' }, tbl), m.placement ? h('div', { class: 'muted small' }, `Quiz taken ${m.placement.d} (${m.placement.items} questions).`) : null,
    h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: tap(() => { m.levels = L; m.hist.push({ d: today(), strand: 'all', from: null, to: overallLevel(), why: 'parent adjusted' }); saveState(true); toast('Levels saved.'); parentArea(); }) }, 'Save levels'),
      h('button', { class: 'btn big', onclick: tap(placementQuiz) }, 'Retake the quiz')));
}

// ---------- home menu ----------
import { pinPad, settings as settingsScreen, practice, howTo } from './ui.js';
export function home() {
  closeScreen(true); if (G) G.setUIOpen(true); const p = prof(); const b = band();
  document.body.classList.remove('band-pre', 'band-kid', 'band-mid', 'band-teen'); document.body.classList.add('band-' + b);
  const scr = h('div', { class: 'screen title home', id: 'screen' });
  const pl = state.settings.schoolOrder ? curPlan() : null;
  scr.append(h('div', { class: 'homehead' }, avatar(p.look, 64), h('div', {}, h('div', { class: 'welcome' }, `Hi, ${p.name}!`), h('div', { class: 'muted small' }, pl ? `Now: ${pl.unit.plain}` : `Level: ${LEVELS[overallLevel()]}`)),
    h('button', { class: 'btn switchbtn', onclick: tap(whoIsPlaying) }, 'Switch player')));
  const big = (t, sub, fn, cls = '') => h('button', { class: 'btn tile ' + cls, onclick: tap(fn) }, h('b', {}, t), sub ? h('span', { class: 'small' }, sub) : null);
  scr.append(h('div', { class: 'menu' },
    h('div', { class: 'tiles' }, big('▶ ' + (state.started ? 'Continue adventure' : 'Play adventure'), 'Bible missions with math', () => { closeScreen(true); G.startPlay(); }, 'primary playtile'),
      big('⭐ Today’s Math', pl ? 'This unit, review, and a peek ahead' : 'Practice at your level', () => todaysMath(), 'today')),
    h('div', { class: 'menu-grid' }, big('✖ Times Tables', null, timesTables), big('⚡ Math Facts', null, factsSprint), big('📖 Word Problems', null, wordProblems), big('🔢 Number Games', null, numberGames),
      big('🗣 Say It With Me', null, () => practice()), big('🧭 Starting spot quiz', null, placementQuiz), big('❓ How to Play', null, () => howTo()), big('🔒 Parent area', null, () => parentGate(parentArea)))),
    h('div', { class: 'muted small foot' }, 'Works offline. Not a medical or therapy product.'));
  document.querySelector('#overlay').append(scr); document.querySelector('#overlay').classList.remove('hidden');
  if (!M().placed) { try { if (sessionStorage.getItem('fcmath.new')) { sessionStorage.removeItem('fcmath.new'); startChoice(); } } catch (e) { } }
}
// ---------- parent area ----------
export function parentGate(then) {
  if (!profiles.pin) return pinPad('Create a 4-digit parent PIN', v => pinPad('Type it again', v2 => { if (v === v2) { profiles.pin = v; saveProfiles(); toast('Parent PIN saved.'); then(); } else toast('The PINs did not match.'); }));
  pinPad('Parent PIN', v => { if (v === profiles.pin) then(); else toast('That PIN did not match.'); });
}
export function parentArea() {
  const body = openScreen('Parent area', { onBack: () => profiles.active ? home() : whoIsPlaying() }); const p = activeProfile();
  if (p) body.append(h('div', { class: 'card' }, h('div', { class: 'row' }, avatar(p.look, 56), h('h3', {}, p.name)),
    h('div', { class: 'menu-grid' }, h('button', { class: 'btn big', onclick: tap(reportCard) }, '📊 Report card'), h('button', { class: 'btn big', onclick: tap(settingsScreen) }, '⚙ Settings'),
      h('button', { class: 'btn big', onclick: tap(placementResult) }, '🧭 Levels and placement'), h('button', { class: 'btn big', onclick: tap(pickLevelParent) }, '📚 Set one level for all math'))));
  const list = h('div', { class: 'card' }, h('h3', {}, 'Players on this iPad'));
  for (const q of profiles.list) {
    const nm = h('input', { type: 'text', maxlength: '20', value: q.name, class: 'nameinput small' }); nm.addEventListener('change', () => { q.name = nm.value.trim().slice(0, 20) || q.name; saveProfiles(); if (q.id === profiles.active) state.settings.name = q.name; });
    const age = h('select', {}, Array.from({ length: 12 }, (_, k) => { const o = h('option', { value: k + 3 }, 'Age ' + (k + 3)); if (q.age === k + 3) o.selected = true; return o; })); age.addEventListener('change', () => { q.age = +age.value; saveProfiles(); });
    list.append(h('div', { class: 'prow' }, avatar(q.look, 44), nm, age, q.id === profiles.active ? h('span', { class: 'chip' }, 'Playing now') : h('button', { class: 'btn small', onclick: tap(() => choosePlayer(q.id)) }, 'Switch'),
      h('button', { class: 'btn small danger', onclick: tap(() => { if (confirm(`Delete ${q.name} and all of their progress? This cannot be undone.`)) { deleteProfile(q.id); toast('Player deleted.'); if (!profiles.list.length) { location.reload(); return; } if (q.id === p?.id) { try { sessionStorage.removeItem('fcmath.skipWho'); } catch (e) { } location.reload(); return; } parentArea(); } }) }, 'Delete')));
  }
  body.append(list, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: tap(() => pinPad('New 4-digit PIN', v => pinPad('Type it again', v2 => { if (v === v2) { profiles.pin = v; saveProfiles(); toast('Parent PIN saved.'); } else toast('The PINs did not match.'); }))) }, 'Change parent PIN')),
    h('div', { class: 'muted small' }, 'Everything is saved only on this iPad. Nothing is sent anywhere. Faith Craft Math practices math skills. Not a medical or therapy product.'));
}
function pickLevelParent() {
  const body = openScreen('Set one level', { onBack: parentArea }); const grid = h('div', { class: 'menu-grid wide' });
  LEVELS.forEach((nm, lv) => grid.append(h('button', { class: 'btn big', onclick: tap(() => { const m = M(); m.levels = {}; for (const s of STRAND_ORDER) m.levels[s] = Math.max(STRANDS[s].min, Math.min(STRANDS[s].max, lv)); m.placed = true; m.placedHow = 'manual'; m.hist.push({ d: today(), strand: 'all', from: null, to: lv, why: 'parent set level' }); saveState(true); toast('Level set: ' + nm); parentArea(); }) }, nm)));
  body.append(grid);
}
// Math part of Settings (shown inside the Settings screen)
export function mathSettings(tog, sel) {
  const s = state.settings; const p = activeProfile(); const g = schoolGrade(); const auto = unitOnDate(g);
  const gradeSel = h('label', { class: 'set' }, h('span', {}, 'School grade'), (() => { const e = h('select', {}, LEVELS.map((nm, lv) => { const o = h('option', { value: lv }, nm); if (lv === g) o.selected = true; return o; })); e.addEventListener('change', () => { if (p) { p.grade = +e.value; saveProfiles(); } s.unitOverride = -1; saveState(); settingsScreen(); }); return e; })());
  const unitSel = h('label', { class: 'set' }, h('span', {}, 'Current unit'), (() => { const e = h('select', {}, [h('option', { value: -1 }, `Automatic by date (now ${unitLabel(g, auto)})`), ...UNITS[g].map((u, i) => h('option', { value: i }, unitLabel(g, i)))]); e.value = String(s.unitOverride == null ? -1 : Math.min(s.unitOverride, UNITS[g].length - 1)); e.addEventListener('change', () => { s.unitOverride = +e.value; saveState(); }); return e; })());
  return [h('h3', {}, 'Math'), tog('Follow school order (MCPS)', 'schoolOrder', () => settingsScreen()),
    h('div', { class: 'muted small' }, 'On: new topics come in the same order as the MCPS math units for the school grade (about half this unit, a quarter review, and some preview of the next unit). Off: practice follows each skill level only.'),
    gradeSel, s.schoolOrder ? unitSel : null,
    tog('Lock levels (no automatic level changes)', 'lockLevel'), tog('Number pad for typed answers (grade 3 and up)', 'numpad'), tog('Timer in Math Facts (60 seconds)', 'factsTimer')];
}

// ---------- report card ----------
const pctOf = r => r && r.n ? Math.round(100 * r.c / r.n) : null;
function reportData() {
  const m = M(), p = prof(), L = levels(); const g = schoolGrade(); const pl = curPlan();
  const strands = STRAND_ORDER.filter(s => L[s] != null && (s !== 'alg' || Object.values(m.skills).some(r => r.strand === 'alg') || L.alg > 7)).map(s => { const rs = Object.values(m.skills).filter(r => r.strand === s); const n = rs.reduce((a, r) => a + r.n, 0), c = rs.reduce((a, r) => a + r.c, 0); return { s, name: STRANDS[s].name, lv: L[s], n, pct: n ? Math.round(100 * c / n) : null }; });
  const skills = Object.entries(m.skills).map(([id, r]) => ({ id, name: (SKILL[id] || r).name, lv: (SKILL[id] || r).lv, unit: unitOf(id), n: r.n, pct: pctOf(r), recent: r.hist.length ? Math.round(100 * r.hist.reduce((a, b) => a + b, 0) / r.hist.length) : null, first: r.first, last: r.last })).sort((a, b) => a.lv - b.lv || (a.unit?.i ?? 0) - (b.unit?.i ?? 0));
  const facts = Object.entries(m.facts); const mastered = facts.filter(([, f]) => f.c >= 2 && f.c / f.n >= 0.8);
  const units = UNITS[g].map((u, i) => { const rs = u.skills.map(id => m.skills[id]).filter(Boolean); const n = rs.reduce((a, r) => a + r.n, 0), c = rs.reduce((a, r) => a + r.c, 0); return { i, label: unitLabel(g, i), plain: u.plain, n, pct: n ? Math.round(100 * c / n) : null, status: i < pl.cur ? 'Done in class (review)' : i === pl.cur ? 'Current unit' : i === pl.cur + 1 ? 'Coming up next' : 'Later this year' }; });
  return { m, p, L, g, pl, strands, skills, facts, mastered, units };
}
export function reportCard() {
  const d = reportData(); const body = openScreen('Report Card', { onBack: parentArea, right: h('button', { class: 'btn', onclick: tap(exportMath) }, 'Print / save') });
  const acc = d.m.answered ? Math.round(100 * d.m.correct / d.m.answered) : 0;
  body.append(h('div', { class: 'card rc-top' }, h('div', { class: 'row' }, avatar(d.p.look, 56), h('h3', {}, `${d.p.name}’s Math Report`)),
    h('div', { class: 'rc-stats' }, stat('School grade', LEVELS[d.g]), stat('Practice level', LEVELS[overallLevel()]), stat('Problems', d.m.answered), stat('First-try correct', acc + '%'), stat('Facts mastered', d.mastered.length), stat('Stars', state.stars)),
    h('div', { class: 'muted small' }, d.m.placed ? (d.m.placedHow === 'quiz' ? `Starting spot from the quiz on ${d.m.placedAt}. ` : `Level picked by hand on ${d.m.placedAt}. `) + 'The placement quiz is a quick starting-point estimate, not a formal assessment.' : 'No starting spot yet. Try the quick quiz.')));
  if (state.settings.schoolOrder) body.append(h('div', { class: 'card' }, h('h3', {}, 'School order (MCPS): ' + LEVELS[d.g]), h('div', {}, h('b', {}, 'Now: '), `${d.pl.label} — ${d.pl.unit.plain}`), d.pl.next ? h('div', { class: 'muted' }, 'Next: ' + d.pl.next) : null,
    h('div', { class: 'tablewrap' }, h('table', { class: 'rc' }, h('tr', {}, ['Unit', 'In plain words', 'Status', 'Practiced', 'First-try correct'].map(t => h('th', {}, t))), d.units.map(u => h('tr', { class: u.i === d.pl.cur ? 'curunit' : '' }, h('td', {}, u.label), h('td', {}, u.plain), h('td', {}, u.status), h('td', {}, u.n || '–'), h('td', {}, u.pct == null ? '–' : u.pct + '%'))))),
    h('div', { class: 'muted small' }, 'Unit order: MCPS uses Amplify Desmos Math starting in 2026–27. The current unit is estimated from the school calendar; a parent can set it in Settings.')));
  else body.append(h('div', { class: 'card muted' }, 'School order is off. Practice follows each skill level.'));
  body.append(h('h3', {}, 'Kinds of math'), h('div', { class: 'tablewrap' }, h('table', { class: 'rc' }, h('tr', {}, ['Kind of math', 'Level now', 'Problems', 'First-try correct'].map(t => h('th', {}, t))), d.strands.map(s => h('tr', {}, h('td', {}, s.name), h('td', {}, LEVELS[s.lv]), h('td', {}, s.n || '–'), h('td', {}, s.pct == null ? '–' : s.pct + '%'))))));
  body.append(h('h3', {}, 'Skills practiced'), d.skills.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'rc' }, h('tr', {}, ['Skill', 'Grade', 'Matches', 'Tries', 'First-try', 'Last 10', 'Last practiced'].map(t => h('th', {}, t))),
    d.skills.map(s => h('tr', {}, h('td', {}, s.name), h('td', {}, LEVEL_SHORT[s.lv]), h('td', { class: 'small' }, s.unit ? `${LEVELS[s.unit.lv]} ${s.unit.label}` : '–'), h('td', {}, s.n), h('td', {}, s.pct + '%'), h('td', { class: s.recent >= 80 ? 'met' : '' }, s.recent == null ? '–' : s.recent + '%'), h('td', {}, s.last))))) : h('div', { class: 'muted' }, 'No problems yet.'));
  const lh = d.m.hist.slice(-12).reverse();
  body.append(h('h3', {}, 'Level history'), lh.length ? h('ul', { class: 'lvhist' }, lh.map(x => h('li', {}, `${x.d}: ${x.strand === 'all' ? 'All math' : STRANDS[x.strand].short} ${x.from != null ? LEVELS[x.from] + ' → ' : ''}${LEVELS[x.to]} (${x.why})`))) : h('div', { class: 'muted' }, 'No level changes yet.'));
  const qd = Object.entries(state.quests).filter(([, q]) => q.done).length;
  body.append(h('div', { class: 'card' }, h('div', {}, `Missions finished: ${qd} of 7 · Math facts mastered: ${d.mastered.length}${d.m.sprint ? ` · Best Math Facts score: ${d.m.sprint.right}` : ''}${d.m.bestStreak ? ` · Best times-table streak: ${d.m.bestStreak}` : ''}`)));
}
function stat(l, v) { return h('div', { class: 'stat' }, h('div', { class: 'sv' }, String(v)), h('div', { class: 'sl' }, l)); }
function exportMath() {
  const d = reportData(); const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const rows = d.skills.map(s => `<tr><td>${esc(s.name)}</td><td>${LEVEL_SHORT[s.lv]}</td><td>${s.unit ? esc(LEVELS[s.unit.lv] + ' ' + s.unit.label) : '–'}</td><td>${s.n}</td><td>${s.pct}%</td><td>${s.recent == null ? '–' : s.recent + '%'}</td><td>${esc(s.last)}</td></tr>`).join('');
  const urows = d.units.map(u => `<tr><td>${esc(u.label)}</td><td>${esc(u.plain)}</td><td>${esc(u.status)}</td><td>${u.n || '–'}</td><td>${u.pct == null ? '–' : u.pct + '%'}</td></tr>`).join('');
  const srows = d.strands.map(s => `<tr><td>${esc(s.name)}</td><td>${LEVELS[s.lv]}</td><td>${s.n || '–'}</td><td>${s.pct == null ? '–' : s.pct + '%'}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Faith Craft Math Report</title><style>body{font-family:Lexend,Arial,sans-serif;margin:24px;color:#222;line-height:1.5}table{border-collapse:collapse;width:100%;margin:8px 0 20px}td,th{border:1px solid #999;padding:6px 8px;text-align:left;font-size:14px}th{background:#eee}h1{font-size:22px}h2{font-size:18px;margin-top:20px}</style></head><body>
<h1>Faith Craft Math Report: ${esc(d.p.name)}</h1><p>Report date: ${today()}<br>School grade: ${LEVELS[d.g]} · Practice level: ${LEVELS[overallLevel()]} · Problems: ${d.m.answered} · Facts mastered: ${d.mastered.length}</p>
${state.settings.schoolOrder ? `<h2>School order (MCPS)</h2><p>Now: ${esc(d.pl.label)} (${esc(d.pl.unit.plain)})</p><table><tr><th>Unit</th><th>In plain words</th><th>Status</th><th>Practiced</th><th>First-try correct</th></tr>${urows}</table>` : ''}
<h2>Kinds of math</h2><table><tr><th>Kind of math</th><th>Level</th><th>Problems</th><th>First-try correct</th></tr>${srows}</table>
<h2>Skills</h2><table><tr><th>Skill</th><th>Grade</th><th>Matches unit</th><th>Tries</th><th>First-try</th><th>Last 10</th><th>Last practiced</th></tr>${rows}</table>
<p style="font-size:12px;color:#666">The placement quiz is a quick starting-point estimate, not a formal assessment. Faith Craft Math practices math skills. Not a medical or therapy product. Generated on this device.</p></body></html>`;
  const body = openScreen('Print or save', { onBack: reportCard });
  const frame = h('iframe', { class: 'printframe', title: 'Report preview' }); frame.srcdoc = html; const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  body.append(h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: tap(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { window.print(); } }) }, 'Print'), h('a', { class: 'btn big', href: url, download: `faith-craft-math-report-${new Date().toISOString().slice(0, 10)}.html` }, 'Save as file')), frame);
}
// ---------- math words for Say It With Me (our own kid-friendly definitions) ----------
export const MATH_WORDS = [
  ['equal', 'e-qual', 'The same amount.'], ['fraction', 'frac-tion', 'A number that names part of a whole.'], ['numerator', 'nu-mer-a-tor', 'The top number of a fraction. It tells how many parts.'],
  ['denominator', 'de-nom-i-na-tor', 'The bottom number of a fraction. It tells how many equal parts make a whole.'], ['perimeter', 'pe-rim-e-ter', 'The distance all the way around a shape.'],
  ['area', 'ar-e-a', 'How much flat space a shape covers.'], ['factor', 'fac-tor', 'A number you multiply by another number to get a product.'], ['multiple', 'mul-ti-ple', 'What you get when you multiply a number by a whole number.'],
  ['product', 'prod-uct', 'The answer to a multiplication problem.'], ['quotient', 'quo-tient', 'The answer to a division problem.'], ['remainder', 're-main-der', 'What is left over after dividing.'],
  ['decimal', 'dec-i-mal', 'A number with a point that shows parts of a whole, like tenths and hundredths.'], ['equivalent', 'e-quiv-a-lent', 'Equal in value.'], ['angle', 'an-gle', 'The space between two lines that meet at a point.'],
  ['parallel', 'par-al-lel', 'Lines that never meet.'], ['perpendicular', 'per-pen-dic-u-lar', 'Lines that meet to make a square corner.'], ['symmetry', 'sym-me-try', 'When a shape has two matching halves.'], ['estimate', 'es-ti-mate', 'A close guess using numbers you know.'],
];
