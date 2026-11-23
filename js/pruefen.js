// Türsteher: Alles, was von außen kommt (Backup-Datei, Gerätespeicher, TMDB), läuft hier durch.
// Nur bekannte Felder mit dem richtigen Typ kommen durch, Texte und Listen werden gekürzt, Zahlen begrenzt
// (kein NaN, kein Unendlich). So kann eine manipulierte Datei weder HTML einschleusen noch die App lahmlegen.
import { STANDARD_FARBE } from './zustand.js';

const text = (v, max = 500) => typeof v === 'string' ? v.slice(0, max) : '';
const ganz = (v, min, max) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
};
const bildPfad = v => typeof v === 'string' && /^\/[\w.-]{1,100}$/.test(v) ? v : '';
const liste = (v, max, f) => Array.isArray(v) ? v.slice(0, max).map(f).filter(x => x !== null && x !== '') : [];
const objekt = v => v && typeof v === 'object' && !Array.isArray(v) ? v : null;

const ID = /^(film|serie):(\d{1,10})$/;
const FOLGE = /^\d{1,3}:\d{1,4}$/;
const STATUS = { film: ['watchlist', 'gesehen'], serie: ['watchlist', 'mittendrin', 'gesehen'] };
const ZEIT_MAX = 8.64e15;

// Filminfos (ohne ihre Angaben). Liefert null, wenn es kein gültiger Film/keine gültige Serie ist.
export function filmdatenPruefen(roh) {
  const r = objekt(roh);
  const m = r && typeof r.id === 'string' ? ID.exec(r.id) : null;
  if (!m || r.art !== m[1]) return null;
  const titel = text(r.titel, 300).trim();
  if (!titel) return null;

  const anb = objekt(r.anbieter) || {};
  const dienst = p => {
    const d = objekt(p), name = d ? text(d.name, 80).trim() : '';
    return name ? { name, logo: bildPfad(d.logo) } : null;
  };
  const e = {
    id: r.id, art: m[1], tmdb: Number(m[2]), titel,
    titelDe: text(r.titelDe, 300), jahr: typeof r.jahr === 'string' && /^\d{4}$/.test(r.jahr) ? r.jahr : '',
    poster: bildPfad(r.poster), hintergrund: bildPfad(r.hintergrund), inhalt: text(r.inhalt, 5000),
    genres: liste(r.genres, 20, g => text(g, 60)), darsteller: liste(r.darsteller, 20, n => text(n, 100)),
    anbieter: { abo: liste(anb.abo, 30, dienst), gratis: liste(anb.gratis, 30, dienst), leihen: liste(anb.leihen, 30, dienst), kaufen: liste(anb.kaufen, 30, dienst) },
    aktualisiert: ganz(r.aktualisiert, 0, ZEIT_MAX),
  };
  if (e.art === 'film') {
    e.laufzeit = ganz(r.laufzeit, 0, 1500);
  } else {
    e.folgenLaufzeit = ganz(r.folgenLaufzeit, 0, 600);
    const folge = f => objekt(f) ? { n: ganz(f.n, 0, 9999), titel: text(f.titel, 200), laufzeit: ganz(f.laufzeit, 0, 600) } : null;
    const staffel = s => {
      if (!objekt(s)) return null;
      const n = ganz(s.n, 0, 999);
      return { n, name: text(s.name, 100) || `Staffel ${n}`, folgen: liste(s.folgen, 2000, folge) };
    };
    e.staffeln = liste(r.staffeln, 200, staffel);
  }
  return e;
}

// Ein ganzer Eintrag: Filminfos plus ihre Angaben.
export function eintragPruefen(roh) {
  const e = filmdatenPruefen(roh);
  if (!e) return null;
  const r = roh;
  e.status = STATUS[e.art].includes(r.status) ? r.status : 'watchlist';
  const sterne = typeof r.sterne === 'number' && Number.isFinite(r.sterne) ? r.sterne : 0;
  e.sterne = Math.min(5, Math.max(0, Math.round(sterne * 2) / 2));
  e.herz = r.herz === true;
  e.gesehenFolgen = e.art === 'serie'
    ? [...new Set(liste(r.gesehenFolgen, 20000, k => typeof k === 'string' && FOLGE.test(k) ? k : null))]
    : [];
  e.nr = ganz(r.nr, 0, 1e9);
  e.geaendert = ganz(r.geaendert, 0, 1e9);
  if (r.unvollstaendig === true) e.unvollstaendig = true;
  return e;
}

// Einstellungen: nur bekannte Schlüssel. Kein Object.assign mit fremden Daten (sonst ließe sich __proto__ verbiegen).
export function einstellungenPruefen(roh) {
  const s = objekt(roh) || {};
  return {
    thema: ['auto', 'hell', 'dunkel'].includes(s.thema) ? s.thema : 'auto',
    farbe: typeof s.farbe === 'string' && /^#[0-9a-f]{6}$/i.test(s.farbe) ? s.farbe : STANDARD_FARBE,
    sortierung: ['neu', 'sterne', 'titel'].includes(s.sortierung) ? s.sortierung : 'neu',
    alleOffen: s.alleOffen !== false,
    letztesBackup: ganz(s.letztesBackup, 0, ZEIT_MAX),
    backupErinnert: ganz(s.backupErinnert, 0, ZEIT_MAX),
    backupGemacht: s.backupGemacht === true,
  };
}
