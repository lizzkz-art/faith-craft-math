// Saved progress, one save per player profile (up to 6 players on one iPad). Everything stays on this device.
const PKEY = 'fcmath.profiles.v1';
export const MAX_PROFILES = 6;
export const LOOKS = [
  { id: 'teal', name: 'Teal star', skin: '#e3a97e', hair: '#5a3818', shirt: '#2bb3a3', shirt2: '#1f8f82', jeans: '#3a5da8' },
  { id: 'purple', name: 'Purple', skin: '#c68b59', hair: '#1e140c', shirt: '#8e5cc7', shirt2: '#6f3fa8', jeans: '#2f3f6e', long: true },
  { id: 'coral', name: 'Coral', skin: '#f0c8a0', hair: '#b5651d', shirt: '#e8735a', shirt2: '#c9553d', jeans: '#3a5da8', long: true },
  { id: 'gold', name: 'Sunny', skin: '#8d5a3b', hair: '#1b120b', shirt: '#f5b700', shirt2: '#d49b00', jeans: '#44507a' },
  { id: 'green', name: 'Forest', skin: '#d8a47a', hair: '#3b2a1a', shirt: '#3aa76d', shirt2: '#2c8454', jeans: '#5a4632' },
  { id: 'sky', name: 'Sky', skin: '#e8b98a', hair: '#e0c068', shirt: '#4a90d9', shirt2: '#2f6fb3', jeans: '#2d3a55', long: true },
];
// Hair style, accessory, and outfit choices. A profile's look (inside fcmath.profiles.v1) is either an old preset id
// such as 'teal' or { id, hairStyle, acc, outfit }. Missing fields fall back to the original look: short hair
// (long for the presets that always had long hair), no accessory, shirt and pants.
export const HAIR_STYLES = [['short', 'Short'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['pigtails', 'Pigtails'], ['braids', 'Braids'], ['puffs', 'Curly puffs']];
export const ACCESSORIES = [['none', 'None'], ['bow', 'Bow'], ['headband', 'Headband']];
export const OUTFITS = [['pants', 'Shirt and pants'], ['dress', 'Dress']];
export const BOW_COLOR = '#ff5c9a';
const pickOpt = (v, list, dflt) => (list.find(o => o[0] === v) || list.find(o => o[0] === dflt) || list[0])[0];
const presetOf = id => LOOKS.find(l => l.id === id) || LOOKS[0];
export function normLook(look) {
  const o = look && typeof look === 'object' ? look : { id: look }, base = presetOf(o.id);
  return { id: base.id, hairStyle: pickOpt(o.hairStyle, HAIR_STYLES, base.long ? 'long' : 'short'), acc: pickOpt(o.acc, ACCESSORIES), outfit: pickOpt(o.outfit, OUTFITS) };
}
// Everything needed to draw the look: the preset's colors plus the style choices
export function lookColors(look) { const L = normLook(look), b = presetOf(L.id); return { skin: b.skin, hair: b.hair, shirt: b.shirt, shirt2: b.shirt2, jeans: b.jeans, ...L }; }
export function loadProfiles() {
  try { const p = JSON.parse(localStorage.getItem(PKEY) || 'null'); if (p && Array.isArray(p.list)) return { pin: null, ...p }; } catch (e) { }
  return { list: [], active: null, pin: null };
}
export let profiles = loadProfiles();
export function saveProfiles() { try { localStorage.setItem(PKEY, JSON.stringify(profiles)); } catch (e) { } }
export const activeProfile = () => profiles.list.find(p => p.id === profiles.active) || null;
export function addProfile({ name, age, look, grade }) {
  if (profiles.list.length >= MAX_PROFILES) return null;
  const id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const p = { id, name: (name || '').trim().slice(0, 20) || 'Player ' + (profiles.list.length + 1), age, look: look || LOOKS[profiles.list.length % LOOKS.length].id, grade };
  profiles.list.push(p); saveProfiles(); return p;
}
export function deleteProfile(id) {
  profiles.list = profiles.list.filter(p => p.id !== id);
  try { localStorage.removeItem(`fcmath.p.${id}.state`); localStorage.removeItem(`fcmath.p.${id}.world`); } catch (e) { }
  if (profiles.active === id) profiles.active = profiles.list[0] ? profiles.list[0].id : null;
  saveProfiles();
}
export function setActive(id) { profiles.active = id; saveProfiles(); }
// Saves always go to the player whose data is loaded in memory (owner), even after the active player is switched
// and before the page reloads, so one player's progress can never overwrite another's.
let owner = profiles.active;
const KEY = () => `fcmath.p.${owner || 'none'}.state`, WKEY = () => `fcmath.p.${owner || 'none'}.world`;
export const DEFAULT_SETTINGS = { name: 'Player 1', music: true, musicVol: 0.4, bob: true, calm: false, sound: true, rate: 0.9, autoRead: true, sens: 1, font: 'lexend', textSize: 1, spacing: true, cream: true, autoJump: true, view: 'back', zoom: 'normal',
  schoolOrder: true, unitOverride: -1, lockLevel: false, factsTimer: false, numpad: true };
export const freshMath = () => ({ levels: null, placed: false, placedHow: null, placedAt: null, placement: null, recent: {}, skills: {}, facts: {}, hist: [], answered: 0, correct: 0, bestStreak: 0, sprint: null });
function fresh() { return { v: 1, settings: { ...DEFAULT_SETTINGS }, stars: 0, xp: 0, quests: {}, active: null, badges: {}, words: {}, quiz: {}, practice: {}, player: null, hotbar: 0, started: false, math: freshMath() }; }
export let state = fresh();
export function loadState() {
  owner = profiles.active; state = fresh();
  try { const s = JSON.parse(localStorage.getItem(KEY()) || 'null'); if (s && s.v === 1) { state = Object.assign(fresh(), s); state.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) }; state.math = { ...freshMath(), ...(s.math || {}) }; } } catch (e) { }
  const p = activeProfile(); if (p) state.settings.name = p.name;
  return state;
}
let t = null;
export function saveState(now) { clearTimeout(t); const key = KEY(); const f = () => { if (!owner || !profiles.list.some(p => p.id === owner)) return; try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { } }; if (now) f(); else t = setTimeout(f, 800); }
export function loadWorldEdits() { try { return JSON.parse(localStorage.getItem(WKEY()) || '{}'); } catch (e) { return {}; } }
let wt = null;
export function saveWorld(edits, now) { clearTimeout(wt); const key = WKEY(); const f = () => { if (!owner || !profiles.list.some(p => p.id === owner)) return; try { localStorage.setItem(key, JSON.stringify(edits)); } catch (e) { } }; if (now) f(); else wt = setTimeout(f, 1500); }
export function resetAll() { localStorage.removeItem(KEY()); localStorage.removeItem(WKEY()); state = fresh(); const p = activeProfile(); if (p) state.settings.name = p.name; saveState(true); }
