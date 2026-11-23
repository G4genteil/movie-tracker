// Speichert alles in IndexedDB auf dem Gerät. Im Demo-Modus wird nichts gespeichert.
// Tabellen: 'eintraege' (ein Datensatz pro Film/Serie, Schlüssel id) und 'werte' (Einstellungen).
import { DEMO } from './zustand.js';

let db = null;
let fehlerMelden = () => {};
export const beiFehler = f => { fehlerMelden = f; };

function oeffnen() {
  return new Promise((ok, fehler) => {
    const r = indexedDB.open('movie-tracker', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('eintraege', { keyPath: 'id' });
      r.result.createObjectStore('werte');
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fehler(r.error);
  });
}

async function vorgang(tabellen, modus, arbeit) {
  db ||= await oeffnen();
  return new Promise((ok, fehler) => {
    const t = db.transaction(tabellen, modus);
    let ergebnis;
    t.oncomplete = () => ok(ergebnis);
    t.onerror = t.onabort = () => fehler(t.error);
    ergebnis = arbeit(t);
  });
}
const anfrage = r => new Promise((ok, fehler) => { r.onsuccess = () => ok(r.result); r.onerror = () => fehler(r.error); });

export async function laden() {
  if (DEMO) return { eintraege: [], einstellungen: null };
  db ||= await oeffnen();
  const t = db.transaction(['eintraege', 'werte']);
  const [eintraege, einstellungen] = await Promise.all([
    anfrage(t.objectStore('eintraege').getAll()),
    anfrage(t.objectStore('werte').get('einstellungen')),
  ]);
  return { eintraege, einstellungen };
}

function schreiben(arbeit) {
  if (DEMO) return Promise.resolve();
  return arbeit().catch(err => { console.error(err); fehlerMelden(); });
}

export const eintragSpeichern = e => schreiben(() => vorgang('eintraege', 'readwrite', t => { t.objectStore('eintraege').put(e); }));
export const eintragLoeschen = id => schreiben(() => vorgang('eintraege', 'readwrite', t => { t.objectStore('eintraege').delete(id); }));
export const einstellungenSpeichern = werte => schreiben(() => vorgang('werte', 'readwrite', t => { t.objectStore('werte').put(werte, 'einstellungen'); }));

// Backup einspielen: alles in einem Rutsch ersetzen (klappt ganz oder gar nicht).
export const allesErsetzen = (eintraege, einstellungen) => schreiben(() => vorgang(['eintraege', 'werte'], 'readwrite', t => {
  const tab = t.objectStore('eintraege');
  tab.clear();
  for (const e of eintraege) tab.put(e);
  t.objectStore('werte').put(einstellungen, 'einstellungen');
}));

// Bittet Safari, die Daten nie von selbst zu löschen.
export function dauerhaftMachen() {
  if (!DEMO) navigator.storage?.persist?.().catch(() => {});
}
