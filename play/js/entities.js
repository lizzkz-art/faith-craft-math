import * as THREE from '../lib/three.module.js';

export const entMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const tmpC = new THREE.Color();
// Each later part is grown by a hair (DETAIL_EPS per list position) so a detail listed after its base
// (eyes on a face, beard on a head, patch on a body) never shares a plane with it: no z-fighting flicker.
const DETAIL_EPS = 0.0012;
export function mergeBoxes(parts) {
  const pos = [], nor = [], col = [], idx = [];
  parts.forEach((p, k) => {
    const e = k * DETAIL_EPS;
    const g = new THREE.BoxGeometry(p[0] + e, p[1] + e, p[2] + e); g.translate(p[3], p[4], p[5]);
    const base = pos.length / 3; tmpC.set(p[6]);
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) col.push(tmpC.r, tmpC.g, tmpC.b);
    for (const i of g.index.array) idx.push(base + i);
    g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, entMat); mesh.userData.parts = parts; return mesh;
}

export function makeLabel(text, opts = {}) {
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  const fs = 44; g.font = `bold ${fs}px Lexend, sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + 36; c.width = w; c.height = 64;
  g.font = `bold ${fs}px Lexend, sans-serif`;
  g.fillStyle = opts.bg || 'rgba(255,250,235,0.92)'; roundRect(g, 0, 0, w, 64, 18); g.fill();
  g.fillStyle = opts.fg || '#3a2a14'; g.textBaseline = 'middle'; g.fillText(text, 18, 34);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  const h = opts.h || 0.42; s.scale.set(h * w / 64, h, 1); return s;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export function makeMarker(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const colors = { '!': '#f5b700', '?': '#3fb0ff', '★': '#8fd16a', 'bread': '#e89a3c', 'grain': '#d9b35a' };
  g.fillStyle = colors[kind] || '#f5b700'; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill();
  g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (kind === 'bread' || kind === 'grain') { g.fillStyle = '#fff3d6'; g.beginPath(); g.ellipse(64, 70, 36, 24, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#a0612a'; g.lineWidth = 5; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(64 + i * 16 - 6, 56); g.lineTo(64 + i * 16 + 6, 84); g.stroke(); } }
  else { g.font = 'bold 84px sans-serif'; g.fillText(kind, 64, 70); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); s.scale.set(0.7, 0.7, 1); return s;
}

// ---------- NPC ----------
// Rig: grp > rig > body, head (turns), arms and legs (swing when walking)
export function buildNPC(def) {
  const L = def.look, grp = new THREE.Group(), rig = new THREE.Group(); grp.add(rig);
  const body = [
    [0.64, 0.8, 0.4, 0, 0.92, 0, L.robe],           // robe (upper)
    [0.66, 0.12, 0.42, 0, 1.0, 0, L.sash],          // sash
  ];
  if (L.collar) body.push([0.66, 0.1, 0.42, 0, 1.28, 0, L.collar]);
  const NY = 1.31; // neck pivot
  const head = [
    [0.5, 0.5, 0.5, 0, 1.56 - NY, 0, L.skin],
    [0.09, 0.09, 0.02, -0.11, 1.6 - NY, 0.255, '#1b1b1b'], [0.09, 0.09, 0.02, 0.11, 1.6 - NY, 0.255, '#1b1b1b'],
    [0.04, 0.04, 0.021, -0.09, 1.62 - NY, 0.262, '#ffffff'], [0.04, 0.04, 0.021, 0.13, 1.62 - NY, 0.262, '#ffffff'],
    [0.16, 0.04, 0.02, 0, 1.44 - NY, L.beard ? 0.29 : 0.255, '#9a4a3a'],   // mouth sits on top of the beard when there is one
  ];
  if (L.hair) head.push([0.52, 0.12, 0.52, 0, 1.84 - NY, 0, L.hair], [0.51, 0.36, 0.08, 0, 1.64 - NY, -0.235, L.hair]);
  if (L.wrap) head.push([0.57, 0.18, 0.57, 0, 1.86 - NY, 0, L.wrap], [0.55, 0.44, 0.08, 0, 1.62 - NY, -0.265, L.wrap]);
  if (L.beard) head.push([0.54, 0.19, 0.08, 0, 1.355 - NY, 0.237, L.beard], [0.08, 0.2, 0.3, -0.252, 1.44 - NY, 0.108, L.beard], [0.08, 0.2, 0.3, 0.252, 1.44 - NY, 0.108, L.beard]);  // beard sits clearly outside the face planes
  const bodyM = mergeBoxes(body), headM = mergeBoxes(head); headM.position.y = NY;
  const legGeo = [[0.29, 0.46, 0.38, 0, -0.23, 0, L.robe], [0.22, 0.1, 0.3, 0, -0.5, 0.04, '#5b3b22']];
  const legL = mergeBoxes(legGeo), legR = mergeBoxes(legGeo); legL.position.set(-0.165, 0.55, 0); legR.position.set(0.165, 0.55, 0);
  const armGeo = [[0.18, 0.62, 0.2, 0, -0.28, 0, L.robe], [0.16, 0.12, 0.18, 0, -0.64, 0, L.skin]];
  const armL = mergeBoxes(armGeo), armR = mergeBoxes(armGeo);
  armL.position.set(-0.42, 1.28, 0); armR.position.set(0.42, 1.28, 0);
  if (L.staff) { const st = mergeBoxes([[0.07, 2.0, 0.07, 0, -0.35, 0.12, '#6b4a2a']]); armR.add(st); }
  rig.add(bodyM, headM, armL, armR, legL, legR);
  grp.userData = { rig, head: headM, armL, armR, legL, legR };
  return grp;
}
// Speech-bubble hello
export function makeBubble(text) { return makeLabel(text, { bg: 'rgba(255,255,255,0.96)', fg: '#2a4a6a', h: 0.3 }); }

// ---------- Animals ----------
export const SPECIES = {
  sheep: { name: 'Sheep', parts: [[0.8, 0.6, 1.1, 0, 0.72, 0, '#f4f4ee'], [0.4, 0.4, 0.4, 0, 0.95, 0.66, '#3b3b3b'], [0.44, 0.14, 0.3, 0, 1.18, 0.6, '#f4f4ee'], [0.07, 0.07, 0.02, -0.12, 1.0, 0.865, '#fff'], [0.07, 0.07, 0.02, 0.12, 1.0, 0.865, '#fff'], ...legs(0.28, 0.4, '#3b3b3b', 0.45)], speed: 1.3, h: 1.2 },
  cow: { name: 'Cow', parts: [[0.9, 0.75, 1.35, 0, 0.9, 0, '#6b4226'], [0.52, 0.3, 0.5, 0.2, 1.05, 0.2, '#f2f2f2'], [0.5, 0.5, 0.45, 0, 1.12, 0.85, '#6b4226'], [0.3, 0.2, 0.06, 0, 0.98, 1.08, '#f0b8b0'], [0.08, 0.16, 0.08, -0.2, 1.42, 0.8, '#eee'], [0.08, 0.16, 0.08, 0.2, 1.42, 0.8, '#eee'], [0.07, 0.07, 0.02, -0.14, 1.2, 1.08, '#111'], [0.07, 0.07, 0.02, 0.14, 1.2, 1.08, '#111'], ...legs(0.32, 0.5, '#4a2d1a', 0.52)], speed: 1.1, h: 1.5 },
  lion: { name: 'Lion', parts: [[0.75, 0.6, 1.2, 0, 0.75, 0, '#d9a441'], [0.72, 0.72, 0.32, 0, 1.0, 0.62, '#9a5a1e'], [0.44, 0.42, 0.34, 0, 1.0, 0.82, '#e0b050'], [0.18, 0.12, 0.06, 0, 0.9, 1.0, '#6b3b1b'], [0.07, 0.07, 0.03, -0.11, 1.08, 1.0, '#111'], [0.07, 0.07, 0.03, 0.11, 1.08, 1.0, '#111'], [0.1, 0.1, 0.5, 0, 0.9, -0.8, '#d9a441'], [0.16, 0.16, 0.16, 0, 0.9, -1.08, '#9a5a1e'], ...legs(0.26, 0.45, '#c8923a', 0.45)], speed: 0.9, h: 1.3 },
  camel: { name: 'Camel', parts: [[0.75, 0.7, 1.4, 0, 1.45, 0, '#c9a36b'], [0.5, 0.45, 0.6, 0, 1.95, 0, '#b8925a'], [0.25, 0.8, 0.25, 0, 1.9, 0.75, '#c9a36b'], [0.3, 0.3, 0.5, 0, 2.3, 0.95, '#c9a36b'], [0.06, 0.06, 0.02, -0.1, 2.36, 1.2, '#111'], [0.06, 0.06, 0.02, 0.1, 2.36, 1.2, '#111'], ...legs(0.28, 1.1, '#b8925a', 0.52)], speed: 0.9, h: 2.5 },
  donkey: { name: 'Donkey', parts: [[0.65, 0.6, 1.1, 0, 0.9, 0, '#8a8a8a'], [0.36, 0.4, 0.5, 0, 1.25, 0.7, '#8a8a8a'], [0.1, 0.35, 0.08, -0.1, 1.6, 0.62, '#6a6a6a'], [0.1, 0.35, 0.08, 0.1, 1.6, 0.62, '#6a6a6a'], [0.3, 0.2, 0.08, 0, 1.12, 0.96, '#ddd'], [0.06, 0.06, 0.03, -0.1, 1.33, 0.96, '#111'], [0.06, 0.06, 0.03, 0.1, 1.33, 0.96, '#111'], ...legs(0.24, 0.6, '#6a6a6a', 0.42)], speed: 1.0, h: 1.6 },
  dove: { name: 'Dove', parts: [[0.26, 0.24, 0.42, 0, 0, 0, '#fafafa'], [0.2, 0.2, 0.2, 0, 0.12, 0.26, '#fafafa'], [0.08, 0.05, 0.1, 0, 0.1, 0.4, '#f0a040'], [0.6, 0.04, 0.26, 0, 0.08, -0.02, '#e8e8f0'], [0.2, 0.04, 0.2, 0, 0.04, -0.28, '#e0e0e8'], [0.04, 0.04, 0.02, -0.07, 0.16, 0.365, '#111'], [0.04, 0.04, 0.02, 0.07, 0.16, 0.365, '#111']], speed: 2.5, h: 0.4, fly: true },
};
function legs(sx, h, col, sz) { const w = 0.18; return [[w, h, w, -sx, h / 2, sz, col], [w, h, w, sx, h / 2, sz, col], [w, h, w, -sx, h / 2, -sz, col], [w, h, w, sx, h / 2, -sz, col]]; }
export function buildAnimal(sp) {
  const S = SPECIES[sp], g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  if (S.fly) {
    const bodyParts = S.parts.filter((p, i) => i !== 3); rig.add(mergeBoxes(bodyParts));
    const wl = mergeBoxes([[0.3, 0.04, 0.26, -0.15, 0, 0, '#e8e8f0']]), wr = mergeBoxes([[0.3, 0.04, 0.26, 0.15, 0, 0, '#e8e8f0']]);
    wl.position.set(-0.1, 0.08, -0.02); wr.position.set(0.1, 0.08, -0.02); rig.add(wl, wr); g.userData = { rig, wingL: wl, wingR: wr }; return g;
  }
  const body = S.parts.slice(0, -4), legs = S.parts.slice(-4).map(p => { const m = mergeBoxes([[p[0], p[1], p[2], 0, -p[1] / 2, 0, p[6]]]); m.position.set(p[3], p[1], p[5]); return m; });
  rig.add(mergeBoxes(body), ...legs); g.userData = { rig, legs };
  return g;
}
// Little songbirds that fly in loops high up, and butterflies near the ground
export function buildBird(color = '#5b6b8a') {
  const g = new THREE.Group(); const body = mergeBoxes([[0.14, 0.12, 0.3, 0, 0, 0, color], [0.1, 0.1, 0.1, 0, 0.05, 0.18, color], [0.05, 0.03, 0.06, 0, 0.04, 0.26, '#f0a040']]);
  const wl = mergeBoxes([[0.32, 0.03, 0.16, -0.16, 0, 0, color]]), wr = mergeBoxes([[0.32, 0.03, 0.16, 0.16, 0, 0, color]]);
  wl.position.x = -0.06; wr.position.x = 0.06; g.add(body, wl, wr); g.userData = { wingL: wl, wingR: wr }; return g;
}
const bflyGeo = new THREE.PlaneGeometry(0.16, 0.2); bflyGeo.translate(0.08, 0, 0); bflyGeo.rotateX(-Math.PI / 2);
export function buildButterfly(color) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const wl = new THREE.Mesh(bflyGeo, m), wr = new THREE.Mesh(bflyGeo, m); wl.scale.x = -1; g.add(wl, wr); g.userData = { wingL: wl, wingR: wr }; return g;
}

// ---------- Items ----------
const ITEM_PARTS = {
  pebble: [[0.34, 0.16, 0.28, 0, 0.08, 0, '#b8bcc4'], [0.26, 0.06, 0.2, 0, 0.18, 0, '#d0d4dc']],
  tablets: [[0.36, 0.56, 0.1, -0.2, 0.28, 0, '#dcd6c6'], [0.36, 0.56, 0.1, 0.2, 0.28, 0, '#dcd6c6'], [0.24, 0.04, 0.02, -0.2, 0.4, 0.055, '#8a8272'], [0.24, 0.04, 0.02, -0.2, 0.3, 0.055, '#8a8272'], [0.24, 0.04, 0.02, 0.2, 0.4, 0.055, '#8a8272'], [0.24, 0.04, 0.02, 0.2, 0.3, 0.055, '#8a8272']],
  water: [[0.34, 0.4, 0.34, 0, 0.2, 0, '#b5653a'], [0.2, 0.12, 0.2, 0, 0.46, 0, '#b5653a'], [0.16, 0.02, 0.16, 0, 0.53, 0, '#4aa3f0']],
  bandage: [[0.36, 0.2, 0.2, 0, 0.1, 0, '#fbfbf6'], [0.37, 0.22, 0.04, 0, 0.11, 0.1, '#e6e6de'], [0.1, 0.1, 0.24, 0.24, 0.05, 0, '#fbfbf6']],
  grain: [[0.4, 0.46, 0.36, 0, 0.23, 0, '#d8b86a'], [0.22, 0.12, 0.2, 0, 0.52, 0, '#c2a255'], [0.24, 0.04, 0.22, 0, 0.46, 0, '#8b5a2b']],
};
export function buildItem(type) { const g = new THREE.Group(); g.add(mergeBoxes(ITEM_PARTS[type])); return g; }

export function buildBeacon() {
  const geo = new THREE.CylinderGeometry(0.35, 0.35, 40, 12, 1, true); geo.translate(0, 20, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = 5; return m;
}
export function buildZone(x0, y0, z0, x1, y1, z1, color = 0xffd84a) {
  const g = new THREE.Group();
  const m = 0.015; x0 -= m; z0 -= m; x1 += m; z1 += m; y1 += m; if (Math.abs(y0 - Math.round(y0)) < 0.005) y0 += 0.012; // sit just off the block faces
  const box = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const mesh = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color }));
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); edges.position.copy(mesh.position);
  g.add(mesh, edges); g.userData.mesh = mesh; return g;
}
export function buildRainbow() {
  const g = new THREE.Group(); const cols = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x3949ab, 0x8e24aa];
  cols.forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(70 - i * 2.2, 1.1, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, fog: false, depthWrite: false })); g.add(t); });
  return g;
}

// ---------- The player's own character (seen in the behind and front views) ----------
// Blocky kid in the chosen look: hair style (short, long, ponytail, pigtails, braids, curly puffs), optional bow or
// headband, and shirt and pants or a knee-length dress. Faces +z like the NPCs.
const BOW_COLOR = '#ff5c9a'; // same pink as the bow on the face icons (save.js)
const darker = (hex, k = 0.78) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');
// Hair that hangs below the head rides on the body (so it never swings into the back when the head tilts). It overlaps
// the head's own hair a little, so it is drawn with a depth offset: the head's hair always wins, no flicker.
const hairBackMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 });
// look = the resolved look from lookColors() in save.js: preset colors (skin, hair, shirt, shirt2, jeans) plus hairStyle, acc, outfit
export function buildPlayer(look = {}) {
  const L = look, st = L.hairStyle || 'short', dress = L.outfit === 'dress';
  const skin = L.skin || '#e3a97e', hair = L.hair || '#5a3818', shirt = L.shirt || '#2bb3a3', shirt2 = L.shirt2 || darker(shirt), jeans = L.jeans || '#3a5da8', shoe = '#3b2d24';
  const hair2 = darker(hair, 0.72), tie = L.acc === 'bow' ? BOW_COLOR : darker(hair, 0.5), bow2 = darker(BOW_COLOR, 0.72);
  const grp = new THREE.Group(), rig = new THREE.Group(); grp.add(rig);
  const NY = 1.37;
  // ---- body ----
  const bodyParts = [
    [0.54, 0.66, 0.3, 0, 1.04, 0, shirt],             // shirt (the top of the dress)
    dress ? [0.55, 0.06, 0.31, 0, 0.8, 0, shirt2] : [0.55, 0.08, 0.31, 0, 0.72, 0, shirt2], // waist band / shirt hem
    [0.2, 0.06, 0.02, 0, 1.34, 0.152, skin],          // neckline (front)
    [0.2, 0.2, 0.02, 0, 1.05, 0.155, '#ffd84a'],      // little star on the front
  ];
  if (dress) bodyParts.push(
    [0.56, 0.14, 0.36, 0, 0.68, 0, shirt],            // skirt, upper
    [0.64, 0.23, 0.44, 0, 0.52, 0, shirt],            // skirt, lower (flares out; ends at the knee)
    [0.65, 0.05, 0.45, 0, 0.43, 0, shirt2],           // hem
    [0.08, 0.05, 0.02, -0.14, 1.33, 0.157, '#ffffff'], [0.08, 0.05, 0.02, 0.14, 1.33, 0.157, '#ffffff']); // little collar
  const back = []; // hair below the head (on the body)
  // ---- head ----
  const head = [[0.5, 0.5, 0.5, 0, 0.25, 0, skin]];
  const face = [
    [0.1, 0.1, 0.02, -0.11, 0.27, 0.255, '#ffffff'], [0.1, 0.1, 0.02, 0.11, 0.27, 0.255, '#ffffff'],
    [0.06, 0.07, 0.021, -0.1, 0.26, 0.262, '#2a4a8a'], [0.06, 0.07, 0.021, 0.12, 0.26, 0.262, '#2a4a8a'],
    [0.06, 0.05, 0.03, 0, 0.19, 0.262, '#d9976f'],      // nose
    [0.14, 0.035, 0.02, 0, 0.1, 0.255, '#b04a3e'], [0.035, 0.035, 0.02, -0.085, 0.118, 0.255, '#b04a3e'], [0.035, 0.035, 0.02, 0.085, 0.118, 0.255, '#b04a3e'], // smile
  ];
  const top = [0.52, 0.14, 0.52, 0, 0.47, 0, hair], fringe = [0.5, 0.08, 0.06, 0, 0.42, 0.24, hair];
  const sides = (y0, y1, z0 = -0.26, z1 = 0.18) => [[0.08, y1 - y0, z1 - z0, -0.235, (y0 + y1) / 2, (z0 + z1) / 2, hair], [0.08, y1 - y0, z1 - z0, 0.235, (y0 + y1) / 2, (z0 + z1) / 2, hair]];
  const backPanel = y0 => [0.52, 0.52 - y0, 0.08, 0, (y0 + 0.52) / 2, -0.235, hair];
  const locks = () => [[0.075, 0.36, 0.03, -0.2175, 0.22, 0.255, hair], [0.075, 0.36, 0.03, 0.2175, 0.22, 0.255, hair]]; // hair framing the face
  if (st === 'long') {
    head.push(top, fringe, backPanel(0.02), ...sides(0.02, 0.5, -0.26, 0.24), ...locks());
    back.push([0.5, 0.42, 0.09, 0, 1.2, -0.225, hair], [0.3, 0.06, 0.09, 0, 0.965, -0.225, hair], // down the back, past the shoulders
      [0.02, 0.3, 0.004, -0.12, 1.15, -0.271, hair2], [0.02, 0.3, 0.004, 0.12, 1.15, -0.271, hair2]); // soft strand lines
    bodyParts.push([0.1, 0.22, 0.04, -0.2, 1.27, 0.175, hair], [0.1, 0.22, 0.04, 0.2, 1.27, 0.175, hair]); // over the shoulders in front
  } else if (st === 'ponytail') {
    head.push(top, fringe, backPanel(0.1), ...sides(0.16, 0.5),
      [0.16, 0.12, 0.12, 0, 0.5, -0.3, tie],            // hair tie, high on the back of the head
      [0.14, 0.12, 0.14, 0, 0.56, -0.38, hair],         // the ponytail springs up and back (peeks over the head from the front)
      [0.13, 0.52, 0.12, 0, 0.26, -0.42, hair],         // then hangs down
      [0.1, 0.08, 0.09, 0, -0.03, -0.42, hair2]);       // tip
  } else if (st === 'pigtails') {
    head.push(top, fringe, backPanel(0.14), ...sides(0.2, 0.5), [0.02, 0.14, 0.02, 0, 0.47, 0.262, hair2]); // center part
    for (const s of [-1, 1]) head.push( // high pigtails that stand out from the head (and stay clear of the shoulders)
      [0.1, 0.1, 0.13, s * 0.32, 0.45, -0.08, tie],
      [0.11, 0.12, 0.13, s * 0.36, 0.36, -0.08, hair], [0.14, 0.16, 0.15, s * 0.385, 0.22, -0.08, hair], [0.1, 0.08, 0.11, s * 0.395, 0.1, -0.08, hair2]);
  } else if (st === 'braids') {
    head.push(top, fringe, backPanel(0.06), ...sides(0.02, 0.5, -0.26, 0.24), ...locks(), [0.02, 0.14, 0.02, 0, 0.47, 0.262, hair2]);
    for (const s of [-1, 1]) bodyParts.push( // two braids resting on the front of the shoulders
      [0.1, 0.08, 0.04, s * 0.2, 1.33, 0.175, hair], [0.1, 0.08, 0.04, s * 0.21, 1.25, 0.175, hair2], [0.1, 0.08, 0.04, s * 0.2, 1.17, 0.175, hair],
      [0.09, 0.04, 0.045, s * 0.2, 1.11, 0.175, tie], [0.07, 0.05, 0.035, s * 0.2, 1.065, 0.175, hair]);
  } else if (st === 'puffs') {
    head.push([0.52, 0.12, 0.52, 0, 0.46, 0, hair], [0.5, 0.06, 0.06, 0, 0.43, 0.24, hair], backPanel(0.1), ...sides(0.26, 0.5),
      [0.26, 0.24, 0.26, -0.2, 0.6, -0.02, hair], [0.26, 0.24, 0.26, 0.2, 0.6, -0.02, hair]); // two round puffs
    for (const s of [-1, 1]) head.push( // curly texture
      [0.05, 0.05, 0.02, s * 0.14, 0.64, 0.115, hair2], [0.05, 0.05, 0.02, s * 0.26, 0.55, 0.115, hair2], [0.06, 0.02, 0.06, s * 0.2, 0.725, 0.0, hair2],
      [0.02, 0.05, 0.05, s * 0.335, 0.62, -0.06, hair2], [0.05, 0.05, 0.02, s * 0.2, 0.52, -0.155, hair2]);
  } else {
    head.push(top, [0.52, 0.44, 0.08, 0, 0.29, -0.23, hair], [0.08, 0.26, 0.44, -0.235, 0.35, -0.03, hair], [0.08, 0.26, 0.44, 0.235, 0.35, -0.03, hair], fringe);
  }
  // ---- accessory ----
  const bowAt = (x, y, z, s = 1) => head.push([0.12 * s, 0.12 * s, 0.06, x - 0.09 * s, y, z, BOW_COLOR], [0.12 * s, 0.12 * s, 0.06, x + 0.09 * s, y, z, BOW_COLOR], [0.06 * s, 0.08 * s, 0.075, x, y, z, bow2]);
  if (L.acc === 'headband') {
    const hb = darker(shirt, 1.12), z = st === 'puffs' ? 0.17 : 0.08;
    head.push([0.56, 0.03, 0.1, 0, 0.557, z, hb], [0.03, 0.26, 0.1, -0.283, 0.43, z, hb], [0.03, 0.26, 0.1, 0.283, 0.43, z, hb]);
  } else if (L.acc === 'bow') {
    if (st === 'puffs') bowAt(0, 0.6, 0.145, 0.8);
    else if (st === 'ponytail') head.push([0.14, 0.13, 0.06, -0.12, 0.5, -0.365, BOW_COLOR], [0.14, 0.13, 0.06, 0.12, 0.5, -0.365, BOW_COLOR], [0.08, 0.09, 0.07, 0, 0.5, -0.365, bow2]);
    else if (st === 'pigtails') for (const s of [-1, 1]) head.push([0.08, 0.11, 0.11, s * 0.335, 0.45, 0.025, BOW_COLOR], [0.08, 0.11, 0.11, s * 0.335, 0.45, -0.185, BOW_COLOR], [0.1, 0.08, 0.08, s * 0.335, 0.45, -0.08, bow2]);
    else bowAt(0.15, 0.605, 0.05);
  }
  head.push(...face); // face details last, so they sit on top (see DETAIL_EPS)
  const body = mergeBoxes(bodyParts);
  const headM = mergeBoxes(head); headM.position.y = NY;
  rig.add(body, headM);
  if (back.length) { const hb = mergeBoxes(back); hb.material = hairBackMat; rig.add(hb); }
  const armGeo = [[0.18, 0.24, 0.2, 0, -0.1, 0, shirt], [0.16, 0.42, 0.18, 0, -0.42, 0, skin]];
  const armL = mergeBoxes(armGeo), armR = mergeBoxes(armGeo); armL.position.set(-0.36, 1.34, 0); armR.position.set(0.36, 1.34, 0);
  const legGeo = dress ? [[0.24, 0.58, 0.26, 0, -0.29, 0, skin], [0.245, 0.1, 0.265, 0, -0.53, 0, '#ffffff'], [0.25, 0.12, 0.32, 0, -0.64, 0.03, shoe]]
    : [[0.24, 0.58, 0.26, 0, -0.29, 0, jeans], [0.25, 0.12, 0.32, 0, -0.64, 0.03, shoe]];
  const legL = mergeBoxes(legGeo), legR = mergeBoxes(legGeo); legL.position.set(-0.13, 0.7, 0); legR.position.set(0.13, 0.7, 0);
  rig.add(armL, armR, legL, legR);
  grp.userData = { rig, head: headM, armL, armR, legL, legR, legSwing: dress ? 0.6 : 1 }; // smaller steps keep legs inside the skirt
  return grp;
}
