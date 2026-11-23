// Start: Daten laden, Thema setzen, zeichnen, auf Antippen hören.
import { S, D, DEMO } from './zustand.js';
import * as speicher from './speicher.js';
import { zeichne, toast } from './kern.js';
import { A, sucheEingabe, nachladen, entdeckenWeiter, importieren, farbeEingabe, farbeFertig, sortierungWaehlen, speicherFehler } from './aktionen.js';
import { themaAnwenden, themaBeobachten } from './thema.js';
import { bibliothek } from './demo.js';
import { bereit } from './tmdb.js';
import { eintragPruefen, einstellungenPruefen } from './pruefen.js';

async function start() {
  speicher.beiFehler(speicherFehler);
  if (DEMO) {
    for (const e of bibliothek()) D.eintraege.set(e.id, e);
  } else {
    try {
      const { eintraege, einstellungen } = await speicher.laden();
      for (const roh of eintraege) {
        const e = eintragPruefen(roh);
        if (e) D.eintraege.set(e.id, e);
      }
      if (einstellungen) D.einstellungen = einstellungenPruefen(einstellungen);
    } catch (err) {
      console.error(err);
      toast('Die gespeicherten Daten konnten nicht geladen werden');
    }
    speicher.dauerhaftMachen();
    // Ab dem ersten Start zählt die Zeit bis zur Backup-Erinnerung.
    if (!D.einstellungen.letztesBackup) {
      D.einstellungen.letztesBackup = Date.now();
      speicher.einstellungenSpeichern(D.einstellungen);
    }
  }
  D.zaehler = Math.max(0, ...[...D.eintraege.values()].flatMap(e => [e.nr || 0, e.geaendert || 0]));

  themaAnwenden();
  themaBeobachten(zeichne);
  zeichne();
  zuhoeren();

  if ('serviceWorker' in navigator && !DEMO) navigator.serviceWorker.register('sw.js').catch(() => {});

  // Was beim Hinzufügen ohne Netz unvollständig blieb, jetzt nachholen.
  if (bereit() && navigator.onLine) {
    for (const e of [...D.eintraege.values()].filter(x => x.unvollstaendig)) await nachladen(e.id);
  }
}

function zuhoeren() {
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-a]');
    if (!el || !A[el.dataset.a]) return;
    ev.preventDefault();
    A[el.dataset.a](el.dataset, el);
  });
  document.addEventListener('input', ev => {
    if (ev.target.id === 'suchtext') sucheEingabe(ev.target.value);
    if (ev.target.id === 'farbwahl') farbeEingabe(ev.target.value);
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'farbwahl') farbeFertig(t.value);
    if (t.id === 'sortierung') sortierungWaehlen(t.value);
    if (t.id === 'importdatei' && t.files?.[0]) { importieren(t.files[0]); t.value = ''; }
  });
  // Ebenen: ab etwas Rollen erscheint oben die Glasleiste mit Titel. Gezeichnet wird nur beim Wechsel.
  document.addEventListener('scroll', ev => {
    const sc = ev.target;
    if (!(sc instanceof Element)) return;
    if (sc.id === 's-suche') { entdeckenWeiter(); return; }
    if (!sc.matches('.ebene > .screen')) return;
    const eb = S.ebenen[Number(sc.parentElement.dataset.i)];
    const gerollt = sc.scrollTop > (sc.parentElement.querySelector('.buehne') ? 190 : 40);
    if (eb && !!eb.gerollt !== gerollt) { eb.gerollt = gerollt; zeichne(); }
  }, { capture: true, passive: true });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target.id === 'suchtext') ev.target.blur();
  });
}

start();
