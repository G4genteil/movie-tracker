// Die Regeln: Listen, Status einer Serie, nächste Folge, Statistik. Liest nur aus D, zeichnet nichts.
import { D } from './zustand.js';

export const STATUS_NAME = { watchlist: 'Auf der Watchlist', mittendrin: 'Mittendrin', gesehen: 'Gesehen' };
const FOLGE_STANDARD = 40;   // Minuten, wenn TMDB keine Länge kennt

export const liste = (art, ...status) => [...D.eintraege.values()].filter(e => e.art === art && status.includes(e.status));

export const nachNeu = es => [...es].sort((a, b) => (b.nr || 0) - (a.nr || 0));

export function sortieren(es, wie) {
  const titel = (a, b) => a.titel.localeCompare(b.titel, 'de', { sensitivity: 'base' });
  if (wie === 'titel') return [...es].sort(titel);
  if (wie === 'sterne') return [...es].sort((a, b) => (b.sterne || 0) - (a.sterne || 0) || titel(a, b));
  return [...es].sort((a, b) => (b.geaendert || 0) - (a.geaendert || 0));
}

// Genres nach Häufigkeit.
export function genresVon(es) {
  const z = new Map();
  for (const e of es) for (const g of e.genres || []) z.set(g, (z.get(g) || 0) + 1);
  return [...z].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).map(x => x[0]);
}

// ---------- Serien
export const folgenSchluessel = (s, f) => `${s}:${f}`;

export function folgenListe(e) {
  return (e.staffeln || []).flatMap(st => st.folgen.map(f => ({ s: st.n, f: f.n, titel: f.titel, k: folgenSchluessel(st.n, f.n) })));
}
export const alleFolgen = e => folgenListe(e).map(x => x.k);

export function gesehenZahl(e) {
  const set = new Set(e.gesehenFolgen);
  return alleFolgen(e).filter(k => set.has(k)).length;
}

export function fortschritt(e) {
  const alle = alleFolgen(e).length;
  return alle ? gesehenZahl(e) / alle : 0;
}

// Nichts abgehakt = Watchlist, ein Teil = Mittendrin, alles = Gesehen.
export function statusAusFolgen(e) {
  const n = gesehenZahl(e), alle = alleFolgen(e).length;
  if (!n) return 'watchlist';
  return n >= alle ? 'gesehen' : 'mittendrin';
}

// Die Folge nach der zuletzt abgehakten (wer mittendrin eingestiegen ist, soll dort weitermachen).
export function naechsteFolge(e) {
  const liste = folgenListe(e), set = new Set(e.gesehenFolgen);
  let letzte = -1;
  liste.forEach((x, i) => { if (set.has(x.k)) letzte = i; });
  for (let i = letzte + 1; i < liste.length; i++) if (!set.has(liste[i].k)) return liste[i];
  return liste.find(x => !set.has(x.k)) || null;
}

// Offene Folgen vor dieser einen (für „Vorherige auch abhaken?“).
export function offeneDavor(e, k) {
  const liste = folgenListe(e), set = new Set(e.gesehenFolgen);
  const i = liste.findIndex(x => x.k === k);
  return liste.slice(0, Math.max(0, i)).filter(x => !set.has(x.k)).map(x => x.k);
}

// ---------- Statistik
export function statistik() {
  let minFilme = 0, minSerien = 0, filme = 0, serien = 0, mittendrin = 0, folgen = 0;
  for (const e of D.eintraege.values()) {
    if (e.art === 'film') {
      if (e.status === 'gesehen') { filme++; minFilme += e.laufzeit || 0; }
      continue;
    }
    if (e.status === 'gesehen') serien++;
    if (e.status === 'mittendrin') mittendrin++;
    const set = new Set(e.gesehenFolgen);
    for (const st of e.staffeln || []) for (const f of st.folgen) {
      if (!set.has(folgenSchluessel(st.n, f.n))) continue;
      folgen++;
      minSerien += f.laufzeit || e.folgenLaufzeit || FOLGE_STANDARD;
    }
  }
  const minuten = minFilme + minSerien;
  return { minuten, stunden: minuten / 60, tage: minuten / 1440, stundenFilme: minFilme / 60, stundenSerien: minSerien / 60, filme, serien, mittendrin, folgen };
}
