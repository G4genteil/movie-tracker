// Hell/Dunkel und Lieblingsfarbe.
// Die Farbe färbt Schrift-Akzente, Pfeile, Häkchen und Sterne. Damit sie immer lesbar bleibt, wird sie gerade so weit
// abgedunkelt (hell) bzw. aufgehellt (dunkel), bis der Kontrast zu Hintergrund und Flächen mindestens 3,5 : 1 ist.
import { D } from './zustand.js';

const MIN_KONTRAST = 3.5;
const HINTERGRUND = { hell: [[255, 255, 255], [242, 242, 247]], dunkel: [[0, 0, 0], [28, 28, 30]] };
const dunkelMedien = matchMedia('(prefers-color-scheme: dark)');

export const istDunkel = () => D.einstellungen.thema === 'dunkel' || (D.einstellungen.thema === 'auto' && dunkelMedien.matches);

function hexZuRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = [...h].map(z => z + z).join('');
  const n = parseInt(h, 16);
  return Number.isNaN(n) ? [219, 58, 111] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbZuHex = rgb => '#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');

function luminanz([r, g, b]) {
  const k = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}
function kontrast(a, b) {
  const [x, y] = [luminanz(a), luminanz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function rgbZuHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslZuRgb([h, s, l]) {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

// Liefert die Farbe, wie sie angezeigt wird (unverändert, wenn sie schon lesbar ist).
export function lesbareFarbe(hex, dunkel) {
  const gruende = HINTERGRUND[dunkel ? 'dunkel' : 'hell'];
  let rgb = hexZuRgb(hex);
  const ok = c => gruende.every(g => kontrast(c, g) >= MIN_KONTRAST);
  if (ok(rgb)) return rgbZuHex(rgb);
  const [h, s, l0] = rgbZuHsl(rgb);
  for (let i = 1; i <= 100; i++) {
    const l = dunkel ? Math.min(1, l0 + i / 100) : Math.max(0, l0 - i / 100);
    rgb = hslZuRgb([h, s, l]);
    if (ok(rgb)) break;
  }
  return rgbZuHex(rgb);
}

export const farbeAngepasst = () => lesbareFarbe(D.einstellungen.farbe, istDunkel()).toLowerCase() !== String(D.einstellungen.farbe).toLowerCase();

export function farbeAnwenden() {
  document.documentElement.style.setProperty('--akzent', lesbareFarbe(D.einstellungen.farbe, istDunkel()));
}

export function themaAnwenden() {
  const t = D.einstellungen.thema, html = document.documentElement;
  if (t === 'auto') delete html.dataset.thema; else html.dataset.thema = t;
  document.getElementById('themaFarbe')?.setAttribute('content', istDunkel() ? '#000000' : '#FFFFFF');
  farbeAnwenden();
}

export function themaBeobachten(nachher) {
  dunkelMedien.addEventListener('change', () => { themaAnwenden(); nachher?.(); });
}
