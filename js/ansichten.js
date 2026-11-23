// Was man sieht: baut aus S und D das HTML als Text. Ändert nichts.
// Jeder Knopf sagt mit data-a, welche Aktion er auslöst (siehe aktionen.js).
import { S, D, DEMO } from './zustand.js';
import { esc, bild, laufzeitText, sterneText, farbton, zahl, komma, I, STERN } from './hilfen.js';
import { liste, nachNeu, sortieren, genresVon, naechsteFolge, fortschritt, gesehenZahl, statistik, STATUS_NAME, folgenSchluessel } from './daten.js';
import { bereit, auswahlListe } from './tmdb.js';
import { farbeAngepasst } from './thema.js';

const TABS = [
  ['watchlist', 'Watchlist', I.merken],
  ['gesehen', 'Gesehen', I.hakenKreis],
  ['suche', 'Hinzufügen', I.plusKreis],
  ['statistik', 'Statistik', I.statistik],
];
const SEITEN = { watchlist, gesehen, suche, statistik: statistikSeite };

export function seite() {
  return `<div class="haupt">${SEITEN[S.tab]()}</div>${tabLeiste()}${S.ebenen.map(ebene).join('')}`;
}

const eintragVon = id => D.eintraege.get(id) || S.vorschau[id];

// ---------- Bausteine
function tabLeiste() {
  return `<nav class="tabs">${TABS.map(([k, name, icon]) =>
    `<button data-a="tab" data-k="${esc(k)}" class="${S.tab === k ? 'an' : ''}">${icon}<span>${name}</span></button>`).join('')}</nav>`;
}

const kopf = titel => `<header class="kopf"><h1>${titel}</h1><button class="rund" data-a="einstellungen" aria-label="Einstellungen">${I.zahnrad}</button></header>`;

function segment(feld, nFilme, nSerien) {
  const a = S.art[feld];
  const knopf = (k, name, n) => `<button data-a="art" data-f="${feld}" data-k="${esc(k)}" class="${a === k ? 'an' : ''}">${name}${n == null ? '' : ` <span>${n}</span>`}</button>`;
  return `<div class="segment">${knopf('film', 'Filme', nFilme)}${knopf('serie', 'Serien', nSerien)}</div>`;
}

function poster(e, groesse = 'w185') {
  const inhalt = e.poster
    ? `<img src="${bild(e.poster, groesse)}" alt="${esc(e.titel)}" loading="lazy" decoding="async">`
    : `<div class="platzhalter" style="--h:${farbton(e.titel)}">${esc(e.titel)}</div>`;
  return `<span class="poster">${inhalt}</span>`;
}

function kachel(e, bereich, unten = '') {
  return `<button class="kachel" id="k-${bereich}-${esc(e.id)}" data-a="oeffnen" data-id="${esc(e.id)}">${poster(e)}${unten}</button>`;
}
const bewertungKlein = e => `<span class="mini">${sterneText(e.sterne)}${e.herz ? I.herzVoll : ''}</span>`;

function fortschrittKlein(e) {
  const n = naechsteFolge(e);
  return `<span class="fortschritt">${n ? `S${esc(n.s)} · F${esc(n.f)}` : 'Alles gesehen'}<span class="balken"><i style="width:${Math.round(fortschritt(e) * 100)}%"></i></span></span>`;
}

const leer = (icon, titel, text) => `<div class="leer">${icon}<b>${titel}</b>${text}</div>`;

// ---------- Watchlist
function watchlist() {
  const art = S.art.watchlist;
  const alle = nachNeu(liste(art, 'watchlist'));
  const genres = genresVon(alle);
  const g = genres.includes(S.genre) ? S.genre : '';
  const zeigen = g ? alle.filter(e => (e.genres || []).includes(g)) : alle;
  const chips = genres.length > 1
    ? `<div class="chips">${['', ...genres].map(x => `<button class="chip ${x === g ? 'an' : ''}" data-a="genre" data-g="${esc(x)}">${x ? esc(x) : 'Alle'}</button>`).join('')}</div>`
    : '';
  const inhalt = zeigen.length
    ? `<div class="raster">${zeigen.map(e => kachel(e, 'w')).join('')}</div>`
    : leer(I.merken, art === 'film' ? 'Noch keine Filme auf der Watchlist' : 'Noch keine Serien auf der Watchlist', 'Unter „Hinzufügen“ findest du alles, was du noch schauen willst.');
  return `<div class="screen" id="s-watchlist">${kopf('Watchlist')}${backupHinweis()}${segment('watchlist', liste('film', 'watchlist').length, liste('serie', 'watchlist').length)}${chips}${inhalt}</div>`;
}

function backupHinweis() {
  const st = D.einstellungen, tag = 864e5;
  if (DEMO || D.eintraege.size < 5) return '';
  if (Date.now() - st.letztesBackup < 30 * tag || Date.now() - st.backupErinnert < 7 * tag) return '';
  return `<div class="hinweis"><p>Zeit für ein Backup, damit nichts verloren geht.</p><button class="leise" data-a="backupSpaeter">Später</button><button data-a="exportieren">Sichern</button></div>`;
}

// ---------- Gesehen
function gesehen() {
  const art = S.art.gesehen, film = art === 'film';
  const fertig = liste(art, 'gesehen');
  const mitten = film ? [] : sortieren(liste('serie', 'mittendrin'), 'neu');
  const lieblinge = sortieren([...fertig, ...mitten].filter(e => e.herz), 'neu');
  const { sortierung, alleOffen } = D.einstellungen;
  const nF = liste('film', 'gesehen').length, nS = liste('serie', 'gesehen', 'mittendrin').length;

  let html = '';
  if (mitten.length) {
    html += `<div class="abschnitt"><h3>Mittendrin</h3></div><div class="reihe">${mitten.map(e => kachel(e, 'm', fortschrittKlein(e))).join('')}</div>`;
  }
  if (lieblinge.length) {
    html += `<div class="abschnitt"><h3>${film ? 'Lieblingsfilme' : 'Lieblingsserien'}</h3></div><div class="reihe">${lieblinge.map(e => kachel(e, 'l', bewertungKlein(e))).join('')}</div>`;
  }
  if (fertig.length) {
    const wahl = [['neu', 'Zuletzt'], ['sterne', 'Bewertung'], ['titel', 'Titel']];
    html += `<div class="abschnitt">
      <button class="klapp ${alleOffen ? 'offen' : ''}" data-a="alleUmschalten">${I.weiter}Alle ${film ? 'Filme' : 'Serien'} <span>${fertig.length}</span></button>
      ${alleOffen ? `<select class="sortieren" id="sortierung" aria-label="Sortieren">${wahl.map(([k, n]) => `<option value="${k}" ${k === sortierung ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}
    </div>`;
    if (alleOffen) html += `<div class="raster">${sortieren(fertig, sortierung).map(e => kachel(e, 'a', bewertungKlein(e))).join('')}</div>`;
  }
  if (!html) html = leer(I.hakenKreis, film ? 'Noch keine Filme gesehen' : 'Noch keine Serien gesehen', 'Hake auf der Detailseite „Gesehen“ ab oder füge etwas direkt als gesehen hinzu.');
  return `<div class="screen" id="s-gesehen">${kopf('Gesehen')}${segment('gesehen', nF, nS)}${html}</div>`;
}

// ---------- Hinzufügen
function suche() {
  const q = S.suche;
  let inhalt;
  if (!bereit()) inhalt = `<p class="tipp">Es fehlt noch der TMDB-Schlüssel in <b>js/config.js</b>. Zum Ausprobieren die Adresse mit <b>?demo</b> öffnen.</p>`;
  else if (!q.text.trim()) inhalt = entdecken();
  else if (q.fehler) inhalt = `<p class="tipp">${esc(q.fehler)}</p>`;
  else if (q.laeuft && !q.treffer.length) inhalt = '<div class="laden"></div>';
  else if (!q.treffer.length) inhalt = `<p class="tipp">Nichts gefunden zu „${esc(q.text.trim())}“.</p>`;
  else inhalt = q.treffer.map(trefferZeile).join('');
  return `<div class="screen" id="s-suche">${kopf('Hinzufügen')}
    <label class="suchfeld">${I.lupe}<input id="suchtext" type="search" placeholder="Film oder Serie suchen" value="${esc(q.text)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">${q.text ? `<button class="leeren" data-a="sucheLeeren" aria-label="Suche leeren">${I.leeren}</button>` : ''}</label>
    ${inhalt}</div>`;
}

// Durchstöbern, solange nichts gesucht wird: Filme/Serien, Chips (Angesagt, Beliebt, Anime, Genres), Poster-Raster.
// Die Genres, die sie selbst am meisten hat, stehen vorne.
function entdecken() {
  const art = S.art.entdecken, gewaehlt = S.entdecken.auswahl[art];
  const lieblingsGenres = genresVon(liste(art, 'watchlist', 'mittendrin', 'gesehen'));
  const rang = name => { const i = lieblingsGenres.indexOf(name); return i < 0 ? 999 : i; };
  const alle = auswahlListe(art);
  const chips = [...alle.slice(0, 3), ...alle.slice(3).sort((a, b) => rang(a[1]) - rang(b[1]))]
    .map(([k, name]) => `<button class="chip ${k === gewaehlt ? 'an' : ''}" data-a="auswahl" data-k="${esc(k)}">${esc(name)}</button>`).join('');

  const l = S.entdecken.listen[`${art}:${gewaehlt}`];
  const kacheln = l?.treffer.length ? `<div class="raster">${l.treffer.map(t => kachel(t, 'd', marke(t.id))).join('')}</div>` : '';
  let unten = '';
  if (l?.fehler) unten = `<div class="nochmal"><span>${esc(l.fehler)}</span><button data-a="entdeckenNochmal">Nochmal</button></div>`;
  else if (!l || l.laedt) unten = '<div class="laden"></div>';
  else if (!l.treffer.length) unten = '<p class="tipp">Hier ist gerade nichts.</p>';
  return `${segment('entdecken', null, null)}<div class="chips">${chips}</div>${kacheln}${unten}`;
}

// Kleines Zeichen auf dem Poster, wenn es schon in ihrer App ist.
function marke(id) {
  const e = D.eintraege.get(id);
  if (!e) return '';
  return `<span class="marke" aria-label="${esc(STATUS_NAME[e.status])}">${e.status === 'watchlist' ? I.merken : I.haken}</span>`;
}

function trefferZeile(t) {
  const e = D.eintraege.get(t.id);
  const rechts = e
    ? `<span class="status-text">${I.haken}${STATUS_NAME[e.status].replace('Auf der ', '')}</span>`
    : `<button class="knopf-klein" data-a="schnell" data-id="${esc(t.id)}" data-s="watchlist" aria-label="Auf die Watchlist">${I.merken}</button>
       <button class="knopf-klein" data-a="schnell" data-id="${esc(t.id)}" data-s="gesehen" aria-label="Schon gesehen">${I.haken}</button>`;
  const unter = [t.art === 'film' ? 'Film' : 'Serie', t.jahr, t.titelDe].filter(Boolean).map(esc).join(' · ');
  return `<div class="zeile" id="t-${esc(t.id)}">
    <button class="zeile-haupt" data-a="oeffnen" data-id="${esc(t.id)}">${poster(t, 'w92')}<span class="zeile-text"><b>${esc(t.titel)}</b><span>${unter}</span></span></button>
    <div class="zeile-knoepfe">${rechts}</div></div>`;
}

// ---------- Statistik
function statistikSeite() {
  const s = statistik();
  const karte = (wert, name, neben = '', breit = false) =>
    `<div class="karte ${breit ? 'breit' : ''}"><span class="wert">${wert}</span><span class="name">${name}</span>${neben ? `<span class="neben">${neben}</span>` : ''}</div>`;
  return `<div class="screen" id="s-statistik">${kopf('Statistik')}<div class="karten">
    ${karte(zahl(s.stunden), 'Stunden geschaut', `Filme ${zahl(s.stundenFilme)} Std. · Serien ${zahl(s.stundenSerien)} Std.`, true)}
    ${karte(komma(s.tage), s.tage >= 0.95 && s.tage < 1.05 ? 'Tag am Stück' : 'Tage am Stück')}
    ${karte(zahl(s.folgen), s.folgen === 1 ? 'Folge' : 'Folgen')}
    ${karte(zahl(s.filme), s.filme === 1 ? 'Film gesehen' : 'Filme gesehen')}
    ${karte(zahl(s.serien), s.serien === 1 ? 'Serie gesehen' : 'Serien gesehen', s.mittendrin ? `dazu ${s.mittendrin} mittendrin` : '')}
  </div></div>`;
}

// ---------- Ebenen
function ebene(eb, i) {
  const klasse = [eb.raus ? 'raus' : '', eb.gerollt ? 'gerollt' : ''].join(' ');
  if (eb.typ === 'einstellungen') return `<section class="ebene ${klasse}" id="e-${i}-einst" data-i="${i}">${einstellungen()}${leiste('Einstellungen')}</section>`;
  const e = eintragVon(eb.id);
  if (!e) return '';
  const drin = D.eintraege.has(eb.id);
  // Liebling wird man erst, wenn man es gesehen hat (wie die Sterne).
  const herz = drin && e.status !== 'watchlist' ? `<button class="rund glas" data-a="herz" data-id="${esc(e.id)}" aria-label="${e.herz ? 'Kein Liebling mehr' : 'Als Liebling markieren'}">${e.herz ? I.herzVoll : I.herz}</button>` : '<span class="platz"></span>';
  return `<section class="ebene ${klasse}" id="e-${i}-${esc(e.id)}" data-i="${i}"><div class="screen">${detail(e, drin)}</div>${leiste(e.titel, herz)}</section>`;
}
// Oben: Zurück, beim Runterrollen erscheint der Titel auf einer Glasleiste (wie bei iOS).
const leiste = (titel, rechts = '<span class="platz"></span>') =>
  `<div class="leiste"><button class="rund glas" data-a="zurueck" aria-label="Zurück">${I.zurueck}</button><span class="leiste-titel">${esc(titel)}</span>${rechts}</div>`;

function detail(e, drin) {
  const film = e.art === 'film';
  const st = drin ? e.status : '';
  const laedt = S.laedt[e.id];
  const hinten = e.hintergrund
    ? `<div class="buehne"><img src="${bild(e.hintergrund, 'w780')}" alt=""></div>`
    : e.poster ? `<div class="buehne weich"><img src="${bild(e.poster, 'w185')}" alt=""></div>` : '<div class="buehne"></div>';
  const anzahlStaffeln = (e.staffeln || []).length;
  const meta = [e.jahr, film ? laufzeitText(e.laufzeit) : anzahlStaffeln ? `${anzahlStaffeln} ${anzahlStaffeln === 1 ? 'Staffel' : 'Staffeln'}` : '', film ? 'Film' : 'Serie'].filter(Boolean).join(' · ');

  const knopf = (s, icon, name, an) => `<button data-a="status" data-id="${esc(e.id)}" data-s="${s}" class="${an ? 'an' : ''}">${icon}${name}</button>`;
  const status = `<div class="status-knoepfe">${knopf('watchlist', I.merken, 'Watchlist', st === 'watchlist')}${knopf('gesehen', I.haken, film ? 'Gesehen' : 'Alles gesehen', st === 'gesehen')}</div>`;

  let html = `${hinten}<div class="titelblock">${poster(e, 'w342')}<div class="text"><h2>${esc(e.titel)}</h2>${e.titelDe ? `<p class="de">${esc(e.titelDe)}</p>` : ''}<p class="meta">${esc(meta)}</p></div></div>${status}`;
  if (st === 'gesehen' || st === 'mittendrin') html += sterneWahl(e);
  if (!film && st === 'mittendrin') html += naechsteKarte(e);
  if (e.genres?.length) html += `<div class="genres">${e.genres.map(g => `<span>${esc(g)}</span>`).join('')}</div>`;
  if (e.inhalt) html += `<p class="inhalt">${esc(e.inhalt)}</p>`;
  if (laedt && !e.aktualisiert) return html + '<div class="laden"></div>';
  if (e.aktualisiert) html += anbieterBlock(e);
  if (e.darsteller?.length) html += `<h3 class="titel3">Besetzung</h3><div class="besetzung">${e.darsteller.map(n => `<span>${esc(n)}</span>`).join('')}</div>`;
  if (!film) html += staffelnBlock(e);
  if (laedt) html += '<div class="laden"></div>';
  if (drin) html += `<button class="entfernen" data-a="entfernen" data-id="${esc(e.id)}">Aus der App entfernen</button>`;
  return html;
}

function sterneWahl(e) {
  const n = e.sterne || 0;
  const sterne = [1, 2, 3, 4, 5].map(i => {
    const fuellung = n >= i ? 100 : n >= i - 0.5 ? 50 : 0;
    return `<span class="stern"><svg viewBox="0 0 24 24">${STERN}</svg><span class="voll" style="width:${fuellung}%"><svg viewBox="0 0 24 24">${STERN}</svg></span>
      <button class="l" data-a="bewerten" data-id="${esc(e.id)}" data-w="${i - 0.5}" aria-label="${komma(i - 0.5)} Sterne"></button><button class="r" data-a="bewerten" data-id="${esc(e.id)}" data-w="${i}" aria-label="${i} ${i === 1 ? 'Stern' : 'Sterne'}"></button></span>`;
  }).join('');
  return `<div class="karte-zeile"><span class="klein">${n ? 'Deine Bewertung' : 'Bewerten'}</span><div class="sterne">${sterne}</div></div>`;
}

function naechsteKarte(e) {
  const n = naechsteFolge(e);
  if (!n) return '';
  return `<div class="naechste"><div class="text"><span class="klein">Als Nächstes · ${gesehenZahl(e)} von ${(e.staffeln || []).reduce((s, x) => s + x.folgen.length, 0)} Folgen</span>
    <b>S${esc(n.s)} · F${esc(n.f)}${n.titel && n.titel !== `Folge ${n.f}` ? ` – ${esc(n.titel)}` : ''}</b><span class="balken"><i style="width:${Math.round(fortschritt(e) * 100)}%"></i></span></div>
    <button class="haken" data-a="folge" data-id="${esc(e.id)}" data-k="${esc(n.k)}" aria-label="Diese Folge abhaken">${I.haken}</button></div>`;
}

function anbieterBlock(e) {
  const a = e.anbieter || {};
  const logos = liste => liste.map(p => p.logo
    ? `<img class="logo" src="${bild(p.logo, 'w92')}" alt="${esc(p.name)}" title="${esc(p.name)}" loading="lazy">`
    : `<span class="logo-text">${esc(p.name)}</span>`).join('');
  const zeilen = [['Im Abo', a.abo], ['Gratis', a.gratis], ['Leihen', a.leihen], ['Kaufen', a.kaufen]]
    .filter(([, l]) => l?.length)
    .map(([name, l]) => `<div class="anb-zeile"><span>${name}</span><div class="logos">${logos(l)}</div></div>`).join('');
  return `<h3 class="titel3">Wo schauen</h3>${zeilen ? `<div class="anbieter">${zeilen}</div>` : '<p class="tipp" style="padding:0">Gerade nirgends zum Streamen.</p>'}`;
}

function staffelnBlock(e) {
  if (!e.staffeln?.length) return '';
  const set = new Set(e.gesehenFolgen);
  const staffeln = e.staffeln.map(st => {
    const g = st.folgen.filter(f => set.has(folgenSchluessel(st.n, f.n))).length, alle = st.folgen.length;
    const offen = S.offen[`${esc(e.id)}:${st.n}`];
    const folgen = offen ? `<div class="folgen">${st.folgen.map(f => {
      const k = folgenSchluessel(st.n, f.n), an = set.has(k);
      return `<button class="folge ${an ? 'an' : ''}" data-a="folge" data-id="${esc(e.id)}" data-k="${esc(k)}"><span class="nr">${esc(f.n)}</span><span class="ft">${esc(f.titel || `Folge ${f.n}`)}</span><span class="haken">${I.haken}</span></button>`;
    }).join('')}</div>` : '';
    return `<div class="staffel"><div class="staffel-kopf">
      <button class="staffel-name ${offen ? 'offen' : ''}" data-a="staffelAuf" data-id="${esc(e.id)}" data-n="${esc(st.n)}">${I.weiter}<b>${esc(st.name)}</b><span>${g}/${alle}</span></button>
      <button class="haken ${g === alle ? 'an' : ''}" data-a="staffelHaken" data-id="${esc(e.id)}" data-n="${esc(st.n)}" aria-label="${g === alle ? 'Staffel zurücksetzen' : 'Ganze Staffel abhaken'}">${I.haken}</button>
    </div>${folgen}</div>`;
  }).join('');
  return `<h3 class="titel3">Staffeln</h3>${staffeln}`;
}

// ---------- Einstellungen
function einstellungen() {
  const st = D.einstellungen;
  const thema = [['auto', 'Automatisch'], ['hell', 'Hell'], ['dunkel', 'Dunkel']]
    .map(([k, n]) => `<button data-a="thema" data-k="${esc(k)}" class="${st.thema === k ? 'an' : ''}">${n}</button>`).join('');
  return `<div class="screen"><div class="ebene-kopf"><h1>Einstellungen</h1></div>
    <p class="gruppe-titel">Darstellung</p>
    <div class="gruppe"><div class="segment">${thema}</div></div>
    <p class="gruppe-titel">Lieblingsfarbe</p>
    <div class="gruppe">
      <label class="gruppe-zeile">Farbe wählen<span class="farbfeld" style="background:${esc(st.farbe)}"></span><input type="color" id="farbwahl" value="${esc(st.farbe)}" aria-label="Lieblingsfarbe"></label>
      <button class="gruppe-zeile" data-a="farbeZurueck">Standardfarbe</button>
    </div>
    ${farbeAngepasst() ? '<p class="gruppe-fuss">Die Farbe wird etwas angepasst, damit die Schrift gut lesbar bleibt.</p>' : ''}
    <p class="gruppe-titel">Backup</p>
    <div class="gruppe">
      <button class="gruppe-zeile" data-a="exportieren">Backup exportieren${I.teilen}</button>
      <label class="gruppe-zeile">Backup importieren${I.laden}<input type="file" id="importdatei" accept=".json,application/json"></label>
    </div>
  </div>`;
}
