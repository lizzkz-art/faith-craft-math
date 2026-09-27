// Pictures for math problems, drawn as SVG (works offline, crisp on iPad). vis(spec) -> SVG markup string.
import { iconURL } from '../icons.js';

const C = { ink: '#2d2a26', soft: '#8a8378', fill: '#4a90d9', fill2: '#f5b700', fill3: '#3aa76d', line: '#c9c1b3', paper: '#fffdf7', red: '#e25a5a' };
const svg = (w, h, body, label = 'Math picture') => `<svg class="mvis" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 16}" text-anchor="${o.anchor || 'middle'}" fill="${o.fill || C.ink}" font-family="Lexend, sans-serif" ${o.bold ? 'font-weight="700"' : ''}>${s}</text>`;
const rect = (x, y, w, h, f, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw == null ? 1.5 : o.sw}" rx="${o.rx || 0}"/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw || 2}" ${o.dash ? 'stroke-dasharray="5 4"' : ''} stroke-linecap="round"/>`;
const img = (name, x, y, s) => `<image href="${iconURL(name)}" x="${x}" y="${y}" width="${s}" height="${s}" style="image-rendering:pixelated"/>`;
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace('-', '−');
const COLORS = { red: '#e53935', blue: '#1e88e5', yellow: '#fdd835', green: '#43a047' };

function icons(n, icon, o = {}) {
  const per = o.frames ? 10 : Math.min(n, o.per || 5); const s = n > 10 ? 30 : 40, gap = 6; const rows = Math.ceil(n / per);
  const W = per * (s + gap) + gap + (o.split ? 20 : 0), H = rows * (s + gap) + gap; let b = '';
  for (let i = 0; i < n; i++) { const r = Math.floor(i / per), c = i % per; const x = gap + c * (s + gap) + (o.split && i >= o.split ? 20 : 0), y = gap + r * (s + gap);
    if (o.frames) b += rect(x - 2, y - 2, s + 4, s + 4, 'none', { stroke: C.line, sw: 1 });
    b += img(icon, x, y, s); if (o.cross && i >= n - o.cross) b += line(x, y, x + s, y + s, { stroke: C.red, sw: 3 }) + line(x + s, y, x, y + s, { stroke: C.red, sw: 3 });
    if (o.pairs && i % 2 === 1 && c > 0) b += `<rect x="${x - s - gap - 3}" y="${y - 3}" width="${2 * s + gap + 6}" height="${s + 6}" fill="none" stroke="${C.fill}" stroke-width="2" rx="8"/>`; }
  return svg(W, H, b, n + ' pictures');
}
function tenframe(n, max = 10) { const s = 34; let b = ''; const cols = max === 5 ? 5 : 5, rows = max === 5 ? 1 : 2;
  for (let i = 0; i < cols * rows; i++) { const x = 4 + (i % cols) * s, y = 4 + Math.floor(i / cols) * s; b += rect(x, y, s, s, '#fff'); if (i < n) b += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2 - 6}" fill="${C.red}"/>`; }
  return svg(cols * s + 8, rows * s + 8, b, 'ten frame'); }
function numline({ min, max, mark, marks = [], ticks }) {
  const W = 360, pad = 24, span = max - min || 1, X = v => pad + (v - min) / span * (W - 2 * pad); let b = line(pad - 10, 30, W - pad + 10, 30);
  const step = ticks || (span <= 20 ? 1 : span <= 100 ? 10 : Math.pow(10, Math.floor(Math.log10(span)) - 0));
  const labelEvery = span / step > 12 ? Math.ceil(span / step / 10) : 1; let k = 0;
  for (let v = min; v <= max + 1e-9; v += step, k++) { b += line(X(v), 22, X(v), 38, { sw: 1.5 }); if (k % labelEvery === 0 || v === max) b += txt(X(v), 58, fmt(Math.round(v * 1000) / 1000), { size: 13 }); }
  for (const m of [...(mark != null ? [mark] : []), ...marks]) b += `<circle cx="${X(m)}" cy="30" r="7" fill="${C.red}"/>` + (marks.length ? txt(X(m), 14, fmt(m), { size: 13, bold: true, fill: C.red }) : '');
  return svg(W, 66, b, 'number line'); }
function fracbar(d, a, y = 4, W = 320, label) { const s = W / d; let b = ''; for (let i = 0; i < d; i++) b += rect(10 + i * s, y, s, 34, i < a ? C.fill : '#fff'); if (label) b += txt(W + 40, y + 23, label, { size: 14 }); return b; }
function clock(h, m) { const cx = 80, cy = 80, r = 70; let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`;
  for (let i = 1; i <= 12; i++) { const a = i / 12 * 2 * Math.PI; b += txt(cx + Math.sin(a) * (r - 14), cy - Math.cos(a) * (r - 14) + 5, i, { size: 14 }); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * Math.PI, r1 = i % 5 ? r - 4 : r - 7; b += line(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1, cx + Math.sin(a) * r, cy - Math.cos(a) * r, { sw: i % 5 ? 1 : 2 }); }
  const ha = ((h % 12) + m / 60) / 12 * 2 * Math.PI, ma = m / 60 * 2 * Math.PI;
  b += line(cx, cy, cx + Math.sin(ha) * 36, cy - Math.cos(ha) * 36, { sw: 6 }) + line(cx, cy, cx + Math.sin(ma) * 56, cy - Math.cos(ma) * 56, { sw: 3.5, stroke: C.fill }) + `<circle cx="${cx}" cy="${cy}" r="5" fill="${C.ink}"/>`;
  return svg(160, 160, b, 'clock'); }
const COIN = { 1: ['1¢', '#c77d3a', 15], 5: ['5¢', '#b8b8b8', 18], 10: ['10¢', '#cfcfcf', 13], 25: ['25¢', '#d8d8d8', 21], 100: ['$1', '#e6c55a', 22] };
function coins(list) { let x = 6, b = ''; const sorted = [...list].sort((p, q) => q - p); for (const c of sorted) { const [l, f, r] = COIN[c]; b += `<circle cx="${x + r}" cy="30" r="${r}" fill="${f}" stroke="${C.ink}" stroke-width="1.5"/>` + txt(x + r, 35, l, { size: r > 16 ? 12 : 10, bold: true }); x += 2 * r + 6; } return svg(Math.max(60, x), 60, b, 'coins'); }
function shape(name, sym) { const P = { triangle: '80,10 150,130 10,130', square: '20,10 140,10 140,130 20,130', rectangle: '5,30 175,30 175,120 5,120', pentagon: '80,8 152,60 124,135 36,135 8,60', hexagon: '45,10 115,10 150,70 115,130 45,130 10,70', octagon: '55,8 105,8 142,45 142,95 105,132 55,132 18,95 18,45', rhombus: '80,5 140,70 80,135 20,70', trapezoid: '45,20 115,20 155,125 5,125', circle: null };
  if (name === 'circle') return svg(180, 140, `<circle cx="90" cy="70" r="62" fill="${C.fill2}" stroke="${C.ink}" stroke-width="2"/>`, 'circle');
  let b = `<polygon points="${P[name] || P.square}" fill="${C.fill2}" stroke="${C.ink}" stroke-width="2"/>`; return svg(180, 140, b, name); }
function solid(name) { let b = '';
  if (name === 'cube') b = `<polygon points="30,50 90,50 90,120 30,120" fill="#f5c542" stroke="${C.ink}" stroke-width="2"/><polygon points="30,50 55,25 115,25 90,50" fill="#ffe08a" stroke="${C.ink}" stroke-width="2"/><polygon points="90,50 115,25 115,95 90,120" fill="#d9a520" stroke="${C.ink}" stroke-width="2"/>`;
  if (name === 'sphere') b = `<circle cx="72" cy="72" r="55" fill="#6aa8d8" stroke="${C.ink}" stroke-width="2"/><ellipse cx="55" cy="52" rx="16" ry="10" fill="#cfe6f7"/>`;
  if (name === 'cylinder') b = `<rect x="32" y="30" width="80" height="90" fill="#8ccf7e" stroke="none"/><line x1="32" y1="30" x2="32" y2="120" stroke="${C.ink}" stroke-width="2"/><line x1="112" y1="30" x2="112" y2="120" stroke="${C.ink}" stroke-width="2"/><ellipse cx="72" cy="120" rx="40" ry="12" fill="#6fb85f" stroke="${C.ink}" stroke-width="2"/><ellipse cx="72" cy="30" rx="40" ry="12" fill="#b7e3ad" stroke="${C.ink}" stroke-width="2"/>`;
  if (name === 'cone') b = `<polygon points="72,10 30,118 114,118" fill="#e8835a" stroke="${C.ink}" stroke-width="2"/><ellipse cx="72" cy="118" rx="42" ry="12" fill="#d0643b" stroke="${C.ink}" stroke-width="2"/>`;
  return svg(144, 140, b, name); }
function base10(n) { const h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), o = n % 10; let x = 4, b = '';
  for (let i = 0; i < h; i++) { b += rect(x, 4, 60, 60, '#9fc6ee'); for (let k = 1; k < 10; k++) b += line(x + k * 6, 4, x + k * 6, 64, { sw: 0.5 }) + line(x, 4 + k * 6, x + 60, 4 + k * 6, { sw: 0.5 }); x += 66; }
  for (let i = 0; i < t; i++) { b += rect(x, 4, 7, 60, '#f5c542'); for (let k = 1; k < 10; k++) b += line(x, 4 + k * 6, x + 7, 4 + k * 6, { sw: 0.5 }); x += 11; }
  x += 6; for (let i = 0; i < o; i++) b += rect(x + (i % 3) * 10, 4 + Math.floor(i / 3) * 10, 7, 7, '#e8835a'); x += 34;
  return svg(Math.max(x, 60), 68, b, 'base ten blocks'); }
function array(r, c, icon) { const s = Math.min(34, 300 / c), g = 4; let b = ''; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) b += icon ? img(icon, g + j * (s + g), g + i * (s + g), s) : `<circle cx="${g + j * (s + g) + s / 2}" cy="${g + i * (s + g) + s / 2}" r="${s / 2 - 2}" fill="${C.fill}"/>`; return svg(c * (s + g) + g, r * (s + g) + g, b, `${r} rows of ${c}`); }
function area({ w, h, grid, label, labels, hideH, hideW }) { const u = Math.min(300 / w, 150 / h, 34), W = w * u, H = h * u, x0 = 50, y0 = 10; let b = rect(x0, y0, W, H, '#cfe6f7', { sw: 2.5 });
  if (grid) for (let i = 1; i < w; i++) b += line(x0 + i * u, y0, x0 + i * u, y0 + H, { sw: 1 }); if (grid) for (let j = 1; j < h; j++) b += line(x0, y0 + j * u, x0 + W, y0 + j * u, { sw: 1 });
  const [lw, lh] = labels || [w, h]; if (!grid || label) { b += txt(x0 + W / 2, y0 + H + 22, hideW ? '?' : `${fmt(lw)} ${label || ''}`, { size: 15, bold: true }); b += txt(x0 - 8, y0 + H / 2 + 5, hideH ? '?' : `${fmt(lh)} ${label || ''}`, { size: 15, bold: true, anchor: 'end' }); }
  return svg(x0 + W + 60, y0 + H + 32, b, 'rectangle'); }
function tape(unit, times) { const u = Math.min(40, 300 / times); let b = txt(4, 24, 'A', { anchor: 'start', bold: true }) + rect(24, 8, u, 26, C.fill2) + txt(24 + u / 2, 26, unit, { size: 12 });
  b += txt(4, 70, 'B', { anchor: 'start', bold: true }); for (let i = 0; i < times; i++) b += rect(24 + i * u, 52, u, 26, C.fill2) + txt(24 + i * u + u / 2, 70, unit, { size: 12 });
  b += txt(24 + times * u / 2, 100, `${times} times as many`, { size: 13, fill: C.soft }); return svg(24 + times * u + 10, 108, b, 'tape diagram'); }
function areamodel(parts, bb) { const tot = parts.reduce((a, p) => a + p, 0); const Wt = 300; let x = 40, b = '';
  for (const p of parts) { const w = Math.max(50, Wt * p / tot); b += rect(x, 24, w, 70, '#e7f1fb') + txt(x + w / 2, 16, fmt(p), { size: 14, bold: true }) + txt(x + w / 2, 64, `${fmt(p)} × ${bb}`, { size: 12 }); x += w; }
  b += txt(26, 64, bb, { size: 15, bold: true }); return svg(x + 10, 104, b, 'area model'); }
function areamodel2(a, bb) { const A = a.filter(Boolean), B = bb.filter(Boolean); const cw = 300 / A.length, rh = 120 / B.length; let b = '';
  A.forEach((x, i) => { b += txt(50 + i * cw + cw / 2, 16, x, { size: 14, bold: true }); B.forEach((y, j) => { b += rect(50 + i * cw, 24 + j * rh, cw, rh, j % 2 === i % 2 ? '#e7f1fb' : '#fff4d6') + txt(50 + i * cw + cw / 2, 24 + j * rh + rh / 2 + 5, `${x} × ${y}`, { size: 12 }); }); });
  B.forEach((y, j) => b += txt(40, 24 + j * rh + rh / 2 + 5, y, { size: 14, bold: true, anchor: 'end' })); return svg(360, 150, b, 'area model'); }
function angle(deg, split) { const cx = 120, cy = 110, r = 90, R = d => [cx + Math.cos(-d * Math.PI / 180) * r, cy + Math.sin(-d * Math.PI / 180) * r];
  const [x2, y2] = R(deg); const big = deg > 180 ? 1 : 0; const [ax, ay] = [cx + Math.cos(-deg * Math.PI / 180) * 26, cy + Math.sin(-deg * Math.PI / 180) * 26];
  let b = `<path d="M${cx + 26},${cy} A26,26 0 ${big},0 ${ax},${ay}" fill="none" stroke="${C.fill2}" stroke-width="4"/>` + line(cx, cy, cx + r, cy, { sw: 3 }) + line(cx, cy, x2, y2, { sw: 3 });
  if (deg === 90) b = rect(cx, cy - 16, 16, 16, 'none', { stroke: C.fill2, sw: 3 }) + line(cx, cy, cx + r, cy, { sw: 3 }) + line(cx, cy, x2, y2, { sw: 3 });
  if (split) { const [sx, sy] = R(split); b += line(cx, cy, sx, sy, { sw: 2, dash: true, stroke: C.fill }); }
  return svg(240, 124, b + `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.ink}"/>`, 'angle'); }
function bars({ labels, values, scale }) { const max = Math.max(...values, scale * 4); const top = Math.ceil(max / scale) * scale; const H = 150, y0 = 10, x0 = 44; const Y = v => y0 + H - v / top * H; let b = '';
  for (let v = 0; v <= top; v += scale) b += line(x0, Y(v), x0 + 280, Y(v), { sw: 0.7, stroke: C.line }) + txt(x0 - 6, Y(v) + 4, v, { size: 11, anchor: 'end' });
  values.forEach((v, i) => { b += rect(x0 + 20 + i * 90, Y(v), 56, H + y0 - Y(v), [C.fill, C.fill2, C.fill3][i % 3]) + txt(x0 + 48 + i * 90, H + y0 + 18, labels[i], { size: 12 }); });
  return svg(340, H + 36, b, 'bar graph'); }
function coord({ pts, neg }) { const n = neg ? 6 : 10, u = neg ? 13 : 16, W = neg ? 2 * n * u : n * u, x0 = neg ? W / 2 + 14 : 24, y0 = neg ? W / 2 + 6 : n * u + 6; let b = '';
  for (let i = neg ? -n : 0; i <= n; i++) { b += line(x0 + i * u, y0 - (neg ? n : n) * u, x0 + i * u, y0 + (neg ? n * u : 0), { sw: i ? 0.6 : 2, stroke: i ? C.line : C.ink }); b += line(x0 + (neg ? -n : 0) * u, y0 - i * u, x0 + n * u, y0 - i * u, { sw: i ? 0.6 : 2, stroke: i ? C.line : C.ink }); if (i % (neg ? 2 : 1) === 0 && i) { b += txt(x0 + i * u, y0 + 14, i, { size: 10 }); b += txt(x0 - 8, y0 - i * u + 4, i, { size: 10, anchor: 'end' }); } }
  for (const [x, y] of pts) b += `<circle cx="${x0 + x * u}" cy="${y0 - y * u}" r="6" fill="${C.red}"/>`;
  return svg(x0 + n * u + 16, y0 + (neg ? n * u : 0) + 20, b, 'coordinate grid'); }
function prism(l, w, h) { const u = Math.min(16, 170 / (l + w * 0.5)), dx = w * u * 0.5, dy = w * u * 0.4, x0 = 30, y0 = 20 + dy, L = l * u, Hh = h * u;
  let b = `<polygon points="${x0},${y0} ${x0 + L},${y0} ${x0 + L},${y0 + Hh} ${x0},${y0 + Hh}" fill="#cfe6f7" stroke="${C.ink}" stroke-width="2"/><polygon points="${x0},${y0} ${x0 + dx},${y0 - dy} ${x0 + L + dx},${y0 - dy} ${x0 + L},${y0}" fill="#e7f1fb" stroke="${C.ink}" stroke-width="2"/><polygon points="${x0 + L},${y0} ${x0 + L + dx},${y0 - dy} ${x0 + L + dx},${y0 + Hh - dy} ${x0 + L},${y0 + Hh}" fill="#a9cfee" stroke="${C.ink}" stroke-width="2"/>`;
  b += txt(x0 + L / 2, y0 + Hh + 18, l, { size: 14, bold: true }) + txt(x0 + L + dx + 12, y0 + Hh / 2 - dy / 2, h, { size: 14, bold: true, anchor: 'start' }) + txt(x0 + L + dx / 2 + 12, y0 - dy / 2 - 2, w, { size: 14, bold: true, anchor: 'start' });
  return svg(x0 + L + dx + 40, y0 + Hh + 26, b, 'box'); }
function grid100(a, x0 = 4, lab) { let b = ''; const s = 12; for (let i = 0; i < 100; i++) b += rect(x0 + (i % 10) * s, 4 + Math.floor(i / 10) * s, s, s, i < a ? C.fill : '#fff', { sw: 0.6 }); if (lab) b += txt(x0 + 60, 140, lab, { size: 13 }); return b; }
function fracshape(parts, shaded) { const cx = 70, cy = 70, r = 60; let b = '';
  if (parts === 2 || parts === 4) { const s = 120; for (let i = 0; i < parts; i++) { const w = parts === 2 ? s / 2 : s / 2, h = parts === 2 ? s : s / 2; const x = 10 + (parts === 2 ? i * w : (i % 2) * w), y = 10 + (parts === 2 ? 0 : Math.floor(i / 2) * h); b += rect(x, y, w, h, i < shaded ? C.fill : '#fff', { sw: 2 }); } return svg(140, 140, b, 'shape in equal parts'); }
  for (let i = 0; i < parts; i++) { const a1 = i / parts * 2 * Math.PI - Math.PI / 2, a2 = (i + 1) / parts * 2 * Math.PI - Math.PI / 2; b += `<path d="M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 0,1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z" fill="${i < shaded ? C.fill : '#fff'}" stroke="${C.ink}" stroke-width="2"/>`; }
  return svg(140, 140, b, 'circle in equal parts'); }

export function vis(v) {
  if (!v) return '';
  switch (v.t) {
    case 'count': return icons(v.n, v.icon || 'sheep', { split: v.split, cross: v.cross, frames: v.frames, pairs: v.pairs });
    case 'pairs': return icons(v.n, 'sheep', { pairs: true, per: 10 });
    case 'two': { const a = icons(v.a, v.icon, {}), b = icons(v.b, v.icon, {}); return `<div class="vis-two"><div><b>Group A</b>${a}</div><div><b>Group B</b>${b}</div></div>`; }
    case 'count2': return `<div class="vis-two">${icons(v.a, v.icons[0])}${icons(v.b, v.icons[1])}</div>`;
    case 'share': { const e = v.n / v.groups; let s = ''; for (let g = 0; g < v.groups; g++) s += `<div class="vis-group">${icons(e, v.icon, { per: 6 })}</div>`; return `<div class="vis-two wrap">${s}</div>`; }
    case 'tenframe': return tenframe(v.n, v.max);
    case 'tenframes': return `<div class="vis-two">${tenframe(v.a)}${tenframe(v.b)}</div>`;
    case 'numline': return numline(v);
    case 'pattern': { let b = ''; v.seq.forEach((c, i) => b += `<rect x="${6 + i * 50}" y="6" width="40" height="40" rx="8" fill="${COLORS[c]}" stroke="${C.ink}" stroke-width="1.5"/>`); b += `<rect x="${6 + v.seq.length * 50}" y="6" width="40" height="40" rx="8" fill="#fff" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="5 4"/>` + txt(26 + v.seq.length * 50, 33, '?', { size: 22, bold: true }); return svg(56 + v.seq.length * 50, 52, b, 'color pattern'); }
    case 'sticks': { const u = 30; let b = txt(10, 30, 'A', { anchor: 'start', bold: true }) + rect(34, 12, v.a * u, 24, '#b07a45', { rx: 4 }) + txt(10, 76, 'B', { anchor: 'start', bold: true }) + rect(34, 58, v.b * u, 24, '#8b5a2b', { rx: 4 }); if (v.blocks) { for (let i = 1; i < v.a; i++) b += line(34 + i * u, 12, 34 + i * u, 36, { sw: 1 }); for (let i = 1; i < v.b; i++) b += line(34 + i * u, 58, 34 + i * u, 82, { sw: 1 }); } return svg(44 + Math.max(v.a, v.b) * u, 92, b, 'two sticks'); }
    case 'ruler': { const u = 30; let b = rect(10, 10, v.n * u, 22, '#b07a45', { rx: 4 }); for (let i = 0; i <= 12; i++) b += rect(10 + i * u, 44, u, 16, i % 2 ? '#f5e7c8' : '#fff', { sw: 1 }); return svg(20 + 12 * u, 66, b, 'stick and blocks'); }
    case 'shape': return shape(v.name, v.symmetry);
    case 'shapes4': return `<div class="vis-two wrap">${['square', 'rectangle', 'rhombus', 'trapezoid'].map(n => `<div class="vis-lab">${shape(n)}<span>${n}</span></div>`).join('')}</div>`;
    case 'solid': return solid(v.name);
    case 'base10': return base10(v.n);
    case 'array': return array(v.r, v.c, v.icon);
    case 'fracbar': return svg(340, 42, fracbar(v.d, v.a), 'fraction bar');
    case 'fracbars': { let b = ''; v.bars.forEach(([a, d], i) => b += fracbar(d, a, 4 + i * 44, 300, `${a}/${d}`)); return svg(370, v.bars.length * 44 + 4, b, 'fraction bars'); }
    case 'fracline': { const W = 320; let b = line(20, 30, W + 20, 30); for (let i = 0; i <= v.d; i++) b += line(20 + i * W / v.d, 22, 20 + i * W / v.d, 38, { sw: 1.5 }); b += txt(20, 58, 0, { size: 13 }) + txt(W + 20, 58, 1, { size: 13 }) + `<circle cx="${20 + v.a * W / v.d}" cy="30" r="7" fill="${C.red}"/>`; return svg(W + 40, 64, b, 'fraction number line'); }
    case 'fracshape': return fracshape(v.parts, v.shaded);
    case 'clock': return clock(v.h, v.m);
    case 'coins': return coins(v.coins);
    case 'bars': return bars(v);
    case 'area': return area(v);
    case 'tape': return tape(v.unit, v.times);
    case 'areamodel': return areamodel(v.parts, v.b);
    case 'areamodel2': return areamodel2(v.a, v.b);
    case 'angle': return angle(v.deg, v.split);
    case 'lines': return svg(200, 110, v.kind === 'parallel' ? line(20, 30, 180, 30, { sw: 4 }) + line(20, 80, 180, 80, { sw: 4 }) : line(20, 55, 180, 55, { sw: 4 }) + line(100, 8, 100, 102, { sw: 4 }) + rect(100, 39, 16, 16, 'none', { stroke: C.fill2, sw: 3 }), v.kind + ' lines');
    case 'grid100': return svg(128, 128, grid100(v.a), 'hundred grid');
    case 'grid100s': return svg(270, 148, grid100(v.a, 4, 'first') + grid100(v.b, 140, 'second'), 'two hundred grids');
    case 'prism': return prism(v.l, v.w, v.h);
    case 'coord': return coord(v);
    case 'tri': { const u = Math.min(14, 260 / v.b, 120 / v.h); const B = v.b * u, Hh = v.h * u; let b = `<polygon points="30,${Hh + 10} ${30 + B},${Hh + 10} ${v.right ? 30 : 30 + B * 0.35},10" fill="#cfe6f7" stroke="${C.ink}" stroke-width="2"/>` + (v.right ? '' : line(30 + B * 0.35, 10, 30 + B * 0.35, Hh + 10, { dash: true, sw: 1.5 })) + txt(30 + B / 2, Hh + 30, v.b, { size: 14, bold: true }) + txt(v.right ? 22 : 30 + B * 0.35 - 6, Hh / 2 + 14, v.h, { size: 14, bold: true, anchor: 'end' }); return svg(B + 60, Hh + 40, b, 'triangle'); }
    case 'circle': return svg(160, 150, `<circle cx="80" cy="75" r="64" fill="#e7f1fb" stroke="${C.ink}" stroke-width="2"/>` + line(80, 75, 144, 75, { sw: 2.5, stroke: C.red }) + txt(112, 68, `r = ${v.r}`, { size: 14, bold: true }) + `<circle cx="80" cy="75" r="4" fill="${C.ink}"/>`, 'circle');
    case 'ratiotbl': { let b = rect(4, 4, 90, 30, '#eee') + txt(49, 24, 'white', { size: 13 }) + rect(94, 4, 60, 30, '#fff') + txt(124, 24, v.a, { size: 14, bold: true }) + rect(154, 4, 60, 30, '#fff') + txt(184, 24, v.a * v.k, { size: 14, bold: true }); b += rect(4, 34, 90, 30, '#eee') + txt(49, 54, 'brown', { size: 13 }) + rect(94, 34, 60, 30, '#fff') + txt(124, 54, v.b, { size: 14, bold: true }) + rect(154, 34, 60, 30, '#fff') + txt(184, 54, '?', { size: 16, bold: true }); return svg(220, 70, b, 'ratio table'); }
    case 'rows': { let b = ''; for (let r = 0; r < v.n; r++) for (let c = 0; c < v.k * (r + 1); c++) b += img('stones', 40 + c * 16, 4 + r * 22, 18); for (let r = 0; r < v.n; r++) b += txt(16, 20 + r * 22, 'Row ' + (r + 1), { size: 10 }); return svg(60 + v.k * v.n * 16, v.n * 22 + 8, b, 'rows of stones'); }
    default: return '';
  }
}
