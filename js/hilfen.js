// Kleine Helfer und die Symbole.

const ERSATZ = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, z => ERSATZ[z]);

export const zahl = n => Math.round(n).toLocaleString('de-DE');
export const komma = (n, stellen = 1) => n.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

// Fertig maskiert für src="…".
export const bild = (pfad, groesse = 'w342') => pfad ? esc(`https://image.tmdb.org/t/p/${groesse}${pfad}`) : '';

export function laufzeitText(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} Min.`;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

// 3.5 → „★★★½“
export function sterneText(n) {
  if (!n) return '';
  return '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '');
}

// Gleichbleibender Farbton aus dem Titel, für Poster ohne Bild.
export function farbton(text) {
  let h = 0;
  for (const z of String(text)) h = (h * 31 + z.codePointAt(0)) % 360;
  return h;
}

// Nur lateinische Schrift (plus Zahlen, Satzzeichen, Akzente)?
export const istLateinisch = s => /^[\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]*$/u.test(s || '');

export const heute = () => new Date().toISOString().slice(0, 10);

const svg = (inhalt, klasse = '') => `<svg class="ic ${klasse}" viewBox="0 0 24 24" aria-hidden="true">${inhalt}</svg>`;

export const I = {
  merken: svg('<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1z"/>'),
  haken: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  hakenKreis: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  plusKreis: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  statistik: svg('<path d="M6 20v-7M12 20V5M18 20v-10"/>'),
  zahnrad: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  zurueck: svg('<path d="M15 5l-7 7 7 7"/>'),
  weiter: svg('<path d="M9 5l7 7-7 7"/>'),
  herz: svg('<path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>'),
  herzVoll: svg('<path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>', 'voll'),
  lupe: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
  leeren: svg('<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".55"/><path d="M9 9l6 6M15 9l-6 6" stroke="var(--grund)" stroke-width="2"/>'),
  teilen: svg('<path d="M12 15V3.5M8 7.5l4-4 4 4M5.5 11v8.5h13V11"/>'),
  laden: svg('<path d="M12 3.5V15M8 11l4 4 4-4M5.5 14v5.5h13V14"/>'),
  film: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17M8 4.5 9.5 9M13 4.5 14.5 9"/>'),
};

export const STERN = '<path d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z"/>';
