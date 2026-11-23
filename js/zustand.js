// Die eine Stelle für den Zustand. Die Anzeige liest nur von hier.
// S: was gerade zu sehen ist (geht beim Schließen verloren). D: ihre Daten (liegen in IndexedDB).

export const DEMO = new URLSearchParams(location.search).has('demo');

export const S = {
  tab: 'watchlist',                          // watchlist | gesehen | suche | statistik
  art: { watchlist: 'film', gesehen: 'film', entdecken: 'film' },
  entdecken: {
    auswahl: { film: 'angesagt', serie: 'angesagt' },   // gewählter Chip je Art
    listen: {},                                         // 'film:angesagt' → { treffer, seite, ende, laedt, fehler }
  },
  genre: '',                                 // Filter auf der Watchlist
  ebenen: [],                                // Stapel über den Tabs: { typ: 'detail', id } | { typ: 'einstellungen' }
  suche: { text: '', laeuft: false, treffer: [], fehler: '' },
  vorschau: {},                              // Einträge aus der Suche, die noch nicht gespeichert sind
  offen: {},                                 // aufgeklappte Staffeln: 'serie:1:2' → true
  laedt: {},                                 // id → true, solange Details von TMDB kommen
};

export const D = {
  eintraege: new Map(),
  einstellungen: {
    thema: 'auto',          // auto | hell | dunkel
    farbe: '#DB3A6F',
    sortierung: 'neu',      // Gesehen: neu | sterne | titel
    alleOffen: true,        // „Alle“ unter Gesehen aufgeklappt
    letztesBackup: 0,
    backupErinnert: 0,
  },
  zaehler: 0,               // laufende Zahl fürs Sortieren (keine Uhrzeit)
};

// Ein Rosé, das hell wie dunkel ohne Anpassung lesbar ist.
export const STANDARD_FARBE = '#DB3A6F';
