// Filmdaten von TMDB. Im Demo-Modus kommen sie aus demo.js (ohne Netz, ohne Schlüssel).
// Ergebnis ist immer ein Eintrag ohne ihre Angaben (Status, Sterne …). Die fügt aktionen.js hinzu.
import { TMDB_SCHLUESSEL, SPRACHE, LAND } from './config.js';
import { DEMO } from './zustand.js';
import { istLateinisch, heute } from './hilfen.js';
import * as demo from './demo.js';
import { filmdatenPruefen } from './pruefen.js';

const BASIS = 'https://api.themoviedb.org/3';

export const bereit = () => DEMO || !!TMDB_SCHLUESSEL;

async function holen(pfad, werte = {}) {
  const url = new URL(BASIS + pfad);
  for (const [k, v] of Object.entries({ language: SPRACHE, ...werte })) url.searchParams.set(k, v);
  const kopf = { accept: 'application/json' };
  if (TMDB_SCHLUESSEL.length > 40) kopf.Authorization = `Bearer ${TMDB_SCHLUESSEL}`;
  else url.searchParams.set('api_key', TMDB_SCHLUESSEL);
  const antwort = await fetch(url, { headers: kopf });
  if (!antwort.ok) throw new Error(`TMDB ${antwort.status}`);
  return antwort.json();
}

// Originaltitel, wenn er lateinisch geschrieben ist. Sonst (Anime, Korea …) der englische Titel.
export function anzeigeTitel(original, deutsch, englisch) {
  if (original && istLateinisch(original)) return original;
  return englisch || deutsch || original || '';
}
// Den deutschen Titel klein darunter zeigen, wenn er anders heißt.
const deutschWennAnders = (titel, deutsch) => deutsch && deutsch.toLowerCase() !== titel.toLowerCase() ? deutsch : '';

const idVon = (art, tmdb) => `${art}:${tmdb}`;

// Was TMDB liefert, geht wie ein Backup durch den Türsteher (pruefen.js).
export async function suchen(text) {
  return (await suchenRoh(text)).map(filmdatenPruefen).filter(Boolean);
}
export async function details(art, tmdbId) {
  const e = filmdatenPruefen(await detailsRoh(art, tmdbId));
  if (!e) throw new Error('Unbrauchbare Antwort von TMDB');
  return e;
}

// Eine Liste zweimal holen (deutsch und englisch), damit Anime & Co. gleich mit englischem Titel erscheinen.
async function zweisprachig(pfad, werte) {
  const [d, en] = await Promise.all([
    holen(pfad, werte),
    holen(pfad, { ...werte, language: 'en-US' }).catch(() => ({ results: [] })),
  ]);
  // Filme und Serien haben eigene Nummernkreise, darum gehört die Art zum Schlüssel.
  const englisch = new Map((en.results || []).map(t => [schluessel(t), t.title || t.name]));
  return { d, englisch };
}
const schluessel = t => `${t.media_type || ''}:${t.id}`;

// Ein Treffer aus einer TMDB-Liste. artFest, wenn die Liste nur Filme oder nur Serien enthält.
function treffer(t, englisch, artFest) {
  const typ = artFest ? (artFest === 'film' ? 'movie' : 'tv') : t.media_type;
  if (typ !== 'movie' && typ !== 'tv') return null;
  const film = typ === 'movie', art = film ? 'film' : 'serie';
  const deutsch = film ? t.title : t.name;
  const titel = anzeigeTitel(film ? t.original_title : t.original_name, deutsch, englisch.get(schluessel(t)));
  return {
    id: idVon(art, t.id), art, tmdb: t.id, titel, titelDe: deutschWennAnders(titel || '', deutsch),
    jahr: ((film ? t.release_date : t.first_air_date) || '').slice(0, 4), poster: t.poster_path || '',
  };
}

async function suchenRoh(text) {
  if (DEMO) return demo.suchen(text);
  const { d, englisch } = await zweisprachig('/search/multi', { query: text, include_adult: 'false' });
  return (d.results || []).map(t => treffer(t, englisch)).filter(Boolean);
}

// ---------- Entdecken: zum Durchstöbern, seitenweise (20 pro Seite)
const GENRES = {
  film: [[35, 'Komödie'], [10749, 'Liebesfilm'], [18, 'Drama'], [16, 'Animation'], [28, 'Action'], [53, 'Thriller'], [27, 'Horror'],
    [80, 'Krimi'], [14, 'Fantasy'], [878, 'Science Fiction'], [12, 'Abenteuer'], [10751, 'Familie'], [10402, 'Musik'], [9648, 'Mystery'],
    [36, 'Historie'], [99, 'Dokumentarfilm']],
  serie: [[35, 'Komödie'], [18, 'Drama'], [80, 'Krimi'], [9648, 'Mystery'], [10765, 'Sci-Fi & Fantasy'], [10759, 'Action & Adventure'],
    [16, 'Animation'], [10764, 'Reality'], [10751, 'Familie'], [99, 'Dokumentarfilm'], [10766, 'Soap']],
};
// Die Chips: erst die festen, dann die Genres. Schlüssel 'g35' = Genre 35.
export function auswahlListe(art) {
  return [['angesagt', 'Angesagt'], ['beliebt', 'Beliebt'], ['anime', 'Anime'], ...GENRES[art].map(([id, name]) => [`g${id}`, name])];
}

export async function entdecken(art, auswahl, seite) {
  const roh = await entdeckenRoh(art, auswahl, seite);
  return { treffer: roh.treffer.map(filmdatenPruefen).filter(Boolean), ende: roh.ende };
}

async function entdeckenRoh(art, auswahl, seite) {
  const name = auswahlListe(art).find(([k]) => k === auswahl)?.[1] || '';
  if (DEMO) return demo.entdecken(art, auswahl, name);
  const film = art === 'film', typ = film ? 'movie' : 'tv';
  const genre = /^g(\d{1,6})$/.exec(auswahl);
  const stoebern = { sort_by: 'popularity.desc', include_adult: 'false' };
  const [pfad, werte] =
    auswahl === 'angesagt' ? [`/trending/${typ}/week`, {}]
    : auswahl === 'beliebt' ? [`/${typ}/popular`, film ? { region: LAND } : {}]
    : auswahl === 'anime' ? [`/discover/${typ}`, { ...stoebern, with_genres: '16', with_original_language: 'ja' }]
    : genre ? [`/discover/${typ}`, { ...stoebern, with_genres: genre[1], 'vote_count.gte': film ? '150' : '50' }]
    : [null, null];
  if (!pfad) return { treffer: [], ende: true };
  const { d, englisch } = await zweisprachig(pfad, { ...werte, page: String(seite) });
  const liste = (d.results || []).filter(t => t.poster_path).map(t => treffer(t, englisch, art)).filter(Boolean);
  return { treffer: liste, ende: seite >= Math.min(d.total_pages || 1, 500) };
}

async function detailsRoh(art, tmdbId) {
  if (DEMO) return demo.details(art, tmdbId);
  const film = art === 'film';
  const d = await holen(`/${film ? 'movie' : 'tv'}/${tmdbId}`, { append_to_response: 'credits,watch/providers,translations' });

  const uebersetzungen = d.translations?.translations || [];
  const en = uebersetzungen.find(t => t.iso_639_1 === 'en' && t.iso_3166_1 === 'US') || uebersetzungen.find(t => t.iso_639_1 === 'en');
  const deutsch = film ? d.title : d.name;
  const titel = anzeigeTitel(film ? d.original_title : d.original_name, deutsch, film ? en?.data?.title : en?.data?.name);

  const anb = d['watch/providers']?.results?.[LAND] || {};
  const logo = p => ({ name: p.provider_name, logo: p.logo_path || '' });
  // Nur die Hauptdienste: Kanäle in Amazon/Apple und „mit Werbung“-Varianten weglassen, keine Doppelten.
  const sauber = liste => {
    const gesehen = new Set();
    return liste.filter(p => !/channel|with ads|kids/i.test(p.provider_name))
      .filter(p => !gesehen.has(p.provider_name) && gesehen.add(p.provider_name))
      .map(logo);
  };
  const e = {
    id: idVon(art, tmdbId), art, tmdb: tmdbId, titel, titelDe: deutschWennAnders(titel, deutsch),
    jahr: ((film ? d.release_date : d.first_air_date) || '').slice(0, 4),
    poster: d.poster_path || '', hintergrund: d.backdrop_path || '',
    inhalt: d.overview || en?.data?.overview || '',
    genres: (d.genres || []).map(g => g.name),
    darsteller: (d.credits?.cast || []).slice(0, 12).map(c => c.name),
    anbieter: {
      abo: sauber(anb.flatrate || []),
      gratis: sauber([...(anb.free || []), ...(anb.ads || [])]),
      leihen: sauber(anb.rent || []),
      kaufen: sauber(anb.buy || []),
      link: anb.link || '',
    },
    aktualisiert: Date.now(),
  };
  if (film) e.laufzeit = d.runtime || 0;
  else {
    e.folgenLaufzeit = d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || 0;
    e.staffeln = await staffelnHolen(tmdbId, d.seasons || []);
  }
  return e;
}

// Alle Staffeln mit ihren schon erschienenen Folgen. TMDB erlaubt 20 Anhänge pro Anfrage.
async function staffelnHolen(tmdbId, staffeln) {
  const nummern = staffeln.map(s => s.season_number).filter(n => n > 0);
  const tag = heute(), ergebnis = [];
  for (let i = 0; i < nummern.length; i += 20) {
    const gruppe = nummern.slice(i, i + 20);
    const d = await holen(`/tv/${tmdbId}`, { append_to_response: gruppe.map(n => `season/${n}`).join(',') });
    for (const n of gruppe) {
      const st = d[`season/${n}`];
      if (!st) continue;
      const folgen = (st.episodes || [])
        .filter(f => f.air_date && f.air_date <= tag)
        .map(f => ({ n: f.episode_number, titel: f.name || '', laufzeit: f.runtime || 0 }));
      if (folgen.length) ergebnis.push({ n, name: st.name || `Staffel ${n}`, folgen });
    }
  }
  return ergebnis;
}
