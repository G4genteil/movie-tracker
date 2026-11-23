// Was beim Antippen passiert. Jede Änderung: erst D anpassen, sofort speichern, dann neu zeichnen.
import { S, D, DEMO, STANDARD_FARBE } from './zustand.js';
import { zeichne, toast, ruhig } from './kern.js';
import * as speicher from './speicher.js';
import * as tmdb from './tmdb.js';
import { alleFolgen, statusAusFolgen, naechsteFolge, offeneDavor, folgenSchluessel } from './daten.js';
import { themaAnwenden, farbeAnwenden } from './thema.js';
import { heute } from './hilfen.js';
import { eintragPruefen, einstellungenPruefen } from './pruefen.js';

const neueNr = () => ++D.zaehler;
const kopie = id => D.eintraege.has(id) ? structuredClone(D.eintraege.get(id)) : null;

function sichern(e) {
  D.eintraege.set(e.id, e);
  speicher.eintragSpeichern(e);
}
function wegnehmen(id) {
  D.eintraege.delete(id);
  speicher.eintragLoeschen(id);
}
const einstellungenSichern = () => speicher.einstellungenSpeichern(D.einstellungen);

// Mit „Rückgängig“ kommt der vorherige Stand zurück (oder der Eintrag verschwindet, wenn er neu war).
function mitRueckgaengig(text, id, vorher) {
  toast(text, 'Rückgängig', () => {
    if (vorher) sichern(vorher); else wegnehmen(id);
    zeichne();
  });
}

// Ein Treffer aus der Suche oder aus Entdecken.
function trefferFinden(id) {
  return S.suche.treffer.find(t => t.id === id)
    || Object.values(S.entdecken.listen).flatMap(l => l.treffer).find(t => t.id === id);
}

// Neuer Eintrag aus der Suche oder einer Vorschau. Fehlen noch Details, kommen sie im Hintergrund nach.
function neuerEintrag(id, status) {
  const q = S.vorschau[id] || trefferFinden(id);
  if (!q) return null;
  const e = { ...structuredClone(q), status, sterne: 0, herz: false, gesehenFolgen: [], nr: neueNr() };
  e.geaendert = e.nr;
  if (!q.aktualisiert) e.unvollstaendig = true;
  if (e.art === 'serie' && status === 'gesehen') e.gesehenFolgen = alleFolgen(e);
  return e;
}

const kurzTitel = e => e.titel.length > 28 ? e.titel.slice(0, 27) + '…' : e.titel;

// ---------- Details von TMDB holen und mit ihren Angaben zusammenführen
export async function nachladen(id) {
  if (S.laedt[id] || !tmdb.bereit()) return;
  S.laedt[id] = true;
  zeichne();
  try {
    const [art, nummer] = id.split(':');
    const neu = await tmdb.details(art, Number(nummer));
    const e = D.eintraege.get(id);
    if (e) {
      const { status, sterne, herz, gesehenFolgen, nr, geaendert } = e;
      const z = { ...e, ...neu, status, sterne, herz, gesehenFolgen, nr, geaendert };
      delete z.unvollstaendig;
      // Als gesehen hinzugefügt, bevor die Folgen bekannt waren: jetzt alle abhaken.
      if (z.art === 'serie' && z.status === 'gesehen' && !z.gesehenFolgen.length) z.gesehenFolgen = alleFolgen(z);
      if (z.art === 'serie' && z.status === 'mittendrin') {
        const nf = naechsteFolge(z);
        if (nf) S.offen[`${id}:${nf.s}`] ??= true;
      }
      sichern(z);
    } else {
      S.vorschau[id] = { ...S.vorschau[id], ...neu };
    }
  } catch (err) {
    console.warn(err);
    if (S.ebenen.some(eb => eb.id === id)) toast(navigator.onLine ? 'TMDB antwortet gerade nicht' : 'Keine Internetverbindung');
  } finally {
    delete S.laedt[id];
    zeichne();
  }
}

function vorbereiten(id) {
  const e = D.eintraege.get(id);
  if (e) {
    if (e.art === 'serie') {
      const nf = e.status === 'mittendrin' ? naechsteFolge(e) : null;
      if (nf) S.offen[`${id}:${nf.s}`] = true;
    }
    if (e.unvollstaendig || Date.now() - (e.aktualisiert || 0) > 7 * 864e5) nachladen(id);
    return;
  }
  S.vorschau[id] ||= trefferFinden(id);
  if (S.vorschau[id] && !S.vorschau[id].aktualisiert) nachladen(id);
}

// ---------- Suche
let suchUhr, suchLauf = 0;
export function sucheEingabe(text) {
  S.suche.text = text;
  clearTimeout(suchUhr);
  if (!text.trim()) {
    Object.assign(S.suche, { treffer: [], fehler: '', laeuft: false });
    zeichne();
    entdeckenWeiter();
    return;
  }
  S.suche.laeuft = true;
  zeichne();
  suchUhr = setTimeout(async () => {
    const meiner = ++suchLauf;
    try {
      const treffer = await tmdb.suchen(text.trim());
      if (meiner !== suchLauf) return;
      Object.assign(S.suche, { treffer, fehler: '' });
    } catch (err) {
      if (meiner !== suchLauf) return;
      console.warn(err);
      S.suche.fehler = navigator.onLine ? 'TMDB antwortet gerade nicht. Versuch es gleich nochmal.' : 'Keine Internetverbindung. Suchen geht nur online.';
    }
    S.suche.laeuft = false;
    zeichne();
  }, 350);
}

// ---------- Entdecken: seitenweise nachladen, solange unten nicht genug zum Scrollen da ist
const entdeckenSchluessel = () => `${S.art.entdecken}:${S.entdecken.auswahl[S.art.entdecken]}`;
const entdeckenSichtbar = () => S.tab === 'suche' && !S.suche.text.trim() && tmdb.bereit();

async function entdeckenLaden() {
  const art = S.art.entdecken, auswahl = S.entdecken.auswahl[art], schluessel = entdeckenSchluessel();
  const l = (S.entdecken.listen[schluessel] ||= { treffer: [], seite: 0, ende: false, laedt: false, fehler: '' });
  if (l.laedt || l.ende || l.fehler) return;
  l.laedt = true;
  zeichne();
  try {
    const { treffer, ende } = await tmdb.entdecken(art, auswahl, l.seite + 1);
    const da = new Set(l.treffer.map(t => t.id));
    l.treffer.push(...treffer.filter(t => !da.has(t.id)));
    l.seite++;
    l.ende = ende || !treffer.length;
  } catch (err) {
    console.warn(err);
    l.fehler = navigator.onLine ? 'TMDB antwortet gerade nicht.' : 'Keine Internetverbindung.';
  } finally {
    l.laedt = false;
    zeichne();
  }
  if (schluessel === entdeckenSchluessel()) entdeckenWeiter();
}

// Lädt die nächste Seite, wenn Entdecken zu sehen ist und weniger als gut eine Bildschirmhöhe übrig ist.
export function entdeckenWeiter() {
  if (!entdeckenSichtbar()) return;
  const sc = document.getElementById('s-suche');
  const l = S.entdecken.listen[entdeckenSchluessel()];
  if (!l || !l.seite || (sc && sc.scrollHeight - sc.scrollTop - sc.clientHeight < sc.clientHeight * 1.5)) entdeckenLaden();
}

// ---------- Ebenen
function schliessen() {
  const oben = S.ebenen.at(-1);
  if (!oben || oben.raus) return;
  oben.raus = true;
  zeichne();
  setTimeout(() => { S.ebenen.splice(S.ebenen.indexOf(oben), 1); zeichne(); }, ruhig() ? 0 : 210);
}

// ---------- Folgen abhaken
function folgenSetzen(e, neueFolgen, vorher) {
  const z = { ...e, gesehenFolgen: neueFolgen };
  const status = statusAusFolgen(z);
  if (status !== e.status) { z.status = status; z.geaendert = neueNr(); }
  sichern(z);
  if (status !== e.status && D.eintraege.has(e.id)) {
    const text = status === 'gesehen' ? `„${kurzTitel(z)}“ fertig gesehen` : status === 'mittendrin' ? `„${kurzTitel(z)}“ ist jetzt mittendrin` : '';
    if (text) mitRueckgaengig(text, e.id, vorher);
  }
  return z;
}

// ---------- Die Aktionen (Name = data-a)
export const A = {
  tab({ k }) {
    if (S.tab === k) document.querySelector('.haupt .screen')?.scrollTo({ top: 0, behavior: ruhig() ? 'auto' : 'smooth' });
    else { S.tab = k; S.genre = ''; }
    zeichne();
    entdeckenWeiter();
  },
  art({ f, k }) {
    S.art[f] = k;
    if (f === 'watchlist') S.genre = '';
    zeichne();
    if (f === 'entdecken') entdeckenWeiter();
  },
  auswahl({ k }) {
    S.entdecken.auswahl[S.art.entdecken] = k;
    zeichne();
    entdeckenWeiter();
  },
  entdeckenNochmal() {
    const l = S.entdecken.listen[entdeckenSchluessel()];
    if (l) l.fehler = '';
    entdeckenWeiter();
  },
  genre({ g }) { S.genre = S.genre === g ? '' : g; zeichne(); },
  alleUmschalten() {
    D.einstellungen.alleOffen = !D.einstellungen.alleOffen;
    einstellungenSichern();
    zeichne();
  },

  oeffnen({ id }) {
    document.activeElement?.blur?.();
    S.ebenen.push({ typ: 'detail', id });
    vorbereiten(id);
    zeichne();
  },
  einstellungen() { S.ebenen.push({ typ: 'einstellungen' }); zeichne(); },
  zurueck: schliessen,

  schnell({ id, s }) {
    const e = neuerEintrag(id, s);
    if (!e) return;
    sichern(e);
    zeichne();
    mitRueckgaengig(`„${kurzTitel(e)}“ ${s === 'watchlist' ? 'auf der Watchlist' : 'als gesehen gespeichert'}`, id, null);
    if (e.unvollstaendig) nachladen(id);
  },

  status({ id, s }) {
    const vorher = kopie(id);
    let e = D.eintraege.get(id);
    if (!e) {
      e = neuerEintrag(id, s);
      if (!e) return;
    } else {
      if (e.status === s) return;
      e = { ...e, status: s, geaendert: neueNr() };
      if (e.art === 'serie' && s === 'gesehen') e.gesehenFolgen = alleFolgen(e);
      if (e.art === 'serie' && s === 'watchlist' && e.gesehenFolgen.length) {
        if (!confirm('Alle abgehakten Folgen zurücksetzen und die Serie zurück auf die Watchlist legen?')) return;
        e.gesehenFolgen = [];
      }
    }
    sichern(e);
    zeichne();
    mitRueckgaengig(s === 'watchlist' ? 'Auf der Watchlist' : `„${kurzTitel(e)}“ als gesehen gespeichert`, id, vorher);
    if (e.unvollstaendig) nachladen(id);
  },

  bewerten({ id, w }) {
    const e = D.eintraege.get(id);
    if (!e) return;
    const wert = Number(w);
    sichern({ ...e, sterne: e.sterne === wert ? 0 : wert });
    zeichne();
  },

  herz({ id }) {
    const e = D.eintraege.get(id);
    if (!e) return;
    sichern({ ...e, herz: !e.herz });
    zeichne();
  },

  folge({ id, k }) {
    const vorher = kopie(id);
    let e = D.eintraege.get(id);
    if (!e) { e = neuerEintrag(id, 'watchlist'); if (!e) return; }
    const set = new Set(e.gesehenFolgen);
    const abhaken = !set.has(k);
    if (abhaken) set.add(k); else set.delete(k);
    const z = folgenSetzen(e, [...set], vorher);
    zeichne();
    // Mitten eingestiegen? Dann anbieten, die Folgen davor auch abzuhaken.
    const davor = abhaken ? offeneDavor(z, k) : [];
    if (davor.length) {
      toast(`Die ${davor.length === 1 ? 'Folge' : `${davor.length} Folgen`} davor auch abhaken?`, 'Abhaken', () => {
        const aktuell = D.eintraege.get(id);
        if (!aktuell) return;
        folgenSetzen(aktuell, [...new Set([...aktuell.gesehenFolgen, ...davor])], kopie(id));
        zeichne();
      });
    }
  },

  staffelHaken({ id, n }) {
    const vorher = kopie(id);
    let e = D.eintraege.get(id);
    if (!e) { e = neuerEintrag(id, 'watchlist'); if (!e) return; }
    const st = e.staffeln.find(x => x.n === Number(n));
    const schluessel = st.folgen.map(f => folgenSchluessel(st.n, f.n));
    const set = new Set(e.gesehenFolgen);
    const alleDa = schluessel.every(k => set.has(k));
    for (const k of schluessel) alleDa ? set.delete(k) : set.add(k);
    folgenSetzen(e, [...set], vorher);
    zeichne();
  },

  staffelAuf({ id, n }) {
    const k = `${id}:${n}`;
    S.offen[k] = !S.offen[k];
    zeichne();
  },

  entfernen({ id }) {
    const e = D.eintraege.get(id);
    if (!e || !confirm(`„${e.titel}“ aus der App entfernen? Bewertung und abgehakte Folgen gehen dabei verloren.`)) return;
    const vorher = kopie(id);
    wegnehmen(id);
    schliessen();
    mitRueckgaengig('Entfernt', id, vorher);
  },

  sucheLeeren() {
    sucheEingabe('');
    document.getElementById('suchtext')?.focus();
  },

  // ---------- Einstellungen
  thema({ k }) {
    D.einstellungen.thema = k;
    einstellungenSichern();
    themaAnwenden();
    zeichne();
  },
  farbeZurueck() {
    D.einstellungen.farbe = STANDARD_FARBE;
    einstellungenSichern();
    farbeAnwenden();
    zeichne();
  },
  backupSpaeter() {
    D.einstellungen.backupErinnert = Date.now();
    einstellungenSichern();
    zeichne();
  },
  exportieren() {
    const daten = { app: 'movie-tracker', version: 1, eintraege: [...D.eintraege.values()], einstellungen: D.einstellungen };
    const name = `movie-tracker-backup-${heute()}.json`;
    const datei = new File([JSON.stringify(daten)], name, { type: 'application/json' });
    const fertig = () => {
      D.einstellungen.letztesBackup = Date.now();
      D.einstellungen.backupGemacht = true;
      einstellungenSichern();
      zeichne();
      toast('Backup gespeichert');
    };
    const herunterladen = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(datei);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      fertig();
    };
    if (navigator.canShare?.({ files: [datei] })) {
      navigator.share({ files: [datei] }).then(fertig).catch(err => { if (err.name !== 'AbortError') herunterladen(); });
    } else herunterladen();
  },
};

// Farbe live beim Drehen am Farbrad, gespeichert beim Loslassen.
export function farbeEingabe(wert) {
  D.einstellungen.farbe = wert;
  farbeAnwenden();
}
export function farbeFertig(wert) {
  D.einstellungen.farbe = wert;
  einstellungenSichern();
  farbeAnwenden();
  zeichne();
}

export function sortierungWaehlen(wert) {
  D.einstellungen.sortierung = einstellungenPruefen({ sortierung: wert }).sortierung;
  einstellungenSichern();
  zeichne();
}

// Backup einspielen. Die Datei ist fremd: jeder Eintrag geht durch eintragPruefen, Unbrauchbares fällt weg.
const BACKUP_MAX = 50 * 1024 * 1024;
export async function importieren(datei) {
  if (datei.size > BACKUP_MAX) { toast('Die Datei ist zu groß für ein Backup'); return; }
  let daten;
  try { daten = JSON.parse(await datei.text()); } catch { toast('Das ist keine Backup-Datei'); return; }
  if (daten?.app !== 'movie-tracker' || !Array.isArray(daten.eintraege)) { toast('Das ist keine Backup-Datei vom Movie-Tracker'); return; }

  const eintraege = new Map();
  for (const roh of daten.eintraege.slice(0, 100000)) {
    const e = eintragPruefen(roh);
    if (e) eintraege.set(e.id, e);
  }
  const kaputt = daten.eintraege.length - eintraege.size;
  if (!eintraege.size) { toast('In der Datei ist nichts Brauchbares'); return; }
  const frage = `Backup mit ${eintraege.size} ${eintraege.size === 1 ? 'Eintrag' : 'Einträgen'} laden?${kaputt ? ` (${kaputt} unlesbare werden übersprungen.)` : ''} Alles, was gerade in der App ist, wird dabei ersetzt.`;
  if (!confirm(frage)) return;

  const einstellungen = { ...einstellungenPruefen(daten.einstellungen), letztesBackup: Date.now(), backupGemacht: true };
  await speicher.allesErsetzen([...eintraege.values()], einstellungen);
  D.eintraege = eintraege;
  D.einstellungen = einstellungen;
  D.zaehler = Math.max(0, ...[...eintraege.values()].flatMap(e => [e.nr, e.geaendert]));
  themaAnwenden();
  zeichne();
  toast(eintraege.size === 1 ? '1 Eintrag geladen' : `${eintraege.size} Einträge geladen`);
}

export function speicherFehler() {
  toast(DEMO ? 'Demo: nichts gespeichert' : 'Konnte nicht speichern. Ist der Speicher voll?');
}
