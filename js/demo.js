// Beispieldaten für ?demo: ein kleiner Katalog statt TMDB und eine Bibliothek zum Ausprobieren.
// Inhaltsangaben und Anbieter sind ausgedacht bzw. nur ungefähr, Bilder gibt es hier keine.

const staffeln = (anzahlen, laufzeit) => anzahlen.map((anz, i) => ({
  n: i + 1, name: `Staffel ${i + 1}`,
  folgen: Array.from({ length: anz }, (_, j) => ({ n: j + 1, titel: `Folge ${j + 1}`, laufzeit })),
}));
// Echte Logos von TMDB (Pfade aus /watch/providers, Region DE, Stand 23.11.2026).
const LOGOS = {
  'Netflix': '/rK1KljqmbvO9HQa1PBFLILWah72.png', 'Amazon Prime Video': '/gMZdpavHmxFNnLpMHwVxfqeux2g.png',
  'Disney Plus': '/5eZ872CghnHFLB1j8grszbrx0dx.png', 'WOW': '/2o26YwA7tXQ7I6CSrMvO9Rj4oNi.png',
  'Apple TV Store': '/qdEGArH3lKfFnAtYXMkSYk5wxuG.png', 'Amazon Video': '/jn6TLbtaTZntTRX9UYucHJvpQx1.png',
  'Crunchyroll': '/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png', 'Paramount Plus': '/pkx3klJlwW5JdtaulvDx6hDNtch.png',
  'Sky Go': '/1Yvl9eP3pmktqChitnFhHJHcBtX.png',
};
const NAMEN = { 'Prime Video': 'Amazon Prime Video', 'Disney+': 'Disney Plus', 'Apple TV': 'Apple TV Store', 'Paramount+': 'Paramount Plus' };
const A = (...namen) => namen.map(n => { const name = NAMEN[n] || n; return { name, logo: LOGOS[name] || '' }; });

const KATALOG = [
  // Filme
  { tmdb: 278, art: 'film', titel: 'The Shawshank Redemption', titelDe: 'Die Verurteilten', jahr: '1994', laufzeit: 142, genres: ['Drama', 'Krimi'], darsteller: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'], inhalt: 'Ein Bankier wird unschuldig zu lebenslanger Haft verurteilt und findet im Gefängnis eine Freundschaft, die Jahrzehnte überdauert.', anbieter: { abo: A('Netflix'), leihen: A('Apple TV', 'Amazon Video') } },
  { tmdb: 129, art: 'film', titel: 'Spirited Away', titelDe: 'Chihiros Reise ins Zauberland', jahr: '2001', laufzeit: 125, genres: ['Animation', 'Familie', 'Fantasy'], darsteller: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'], inhalt: 'Auf dem Weg ins neue Zuhause gerät die zehnjährige Chihiro in eine Welt voller Geister und muss ihre Eltern retten.', anbieter: { abo: A('Netflix') } },
  { tmdb: 496243, art: 'film', titel: 'Parasite', titelDe: '', jahr: '2019', laufzeit: 133, genres: ['Komödie', 'Thriller', 'Drama'], darsteller: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'], inhalt: 'Eine arme Familie schleicht sich nach und nach in den Haushalt einer reichen Familie ein, bis alles außer Kontrolle gerät.', anbieter: { abo: A('Prime Video'), leihen: A('Apple TV') } },
  { tmdb: 313369, art: 'film', titel: 'La La Land', titelDe: '', jahr: '2016', laufzeit: 128, genres: ['Komödie', 'Drama', 'Liebesfilm', 'Musik'], darsteller: ['Ryan Gosling', 'Emma Stone', 'John Legend'], inhalt: 'Ein Jazzpianist und eine Schauspielerin verlieben sich in Los Angeles, während beide um ihre Träume kämpfen.', anbieter: { abo: A('Netflix'), kaufen: A('Apple TV') } },
  { tmdb: 27205, art: 'film', titel: 'Inception', titelDe: '', jahr: '2010', laufzeit: 148, genres: ['Action', 'Science Fiction', 'Abenteuer'], darsteller: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], inhalt: 'Ein Dieb, der Geheimnisse aus Träumen stiehlt, soll zum ersten Mal einen Gedanken einpflanzen.', anbieter: { abo: A('Netflix', 'WOW'), leihen: A('Apple TV') } },
  { tmdb: 194, art: 'film', titel: "Le Fabuleux Destin d'Amélie Poulain", titelDe: 'Die fabelhafte Welt der Amélie', jahr: '2001', laufzeit: 122, genres: ['Komödie', 'Liebesfilm'], darsteller: ['Audrey Tautou', 'Mathieu Kassovitz'], inhalt: 'Eine schüchterne Kellnerin in Paris beschließt, heimlich das Leben der Menschen um sie herum schöner zu machen.', anbieter: { leihen: A('Apple TV', 'Amazon Video') } },
  { tmdb: 372058, art: 'film', titel: 'Your Name.', titelDe: 'Your Name. – Gestern, heute und für immer', jahr: '2016', laufzeit: 106, genres: ['Animation', 'Liebesfilm', 'Drama'], darsteller: ['Ryūnosuke Kamiki', 'Mone Kamishiraishi'], inhalt: 'Ein Junge aus Tokio und ein Mädchen vom Land tauschen im Schlaf die Körper und suchen einander.', anbieter: { abo: A('Crunchyroll'), leihen: A('Apple TV') } },
  { tmdb: 120467, art: 'film', titel: 'The Grand Budapest Hotel', titelDe: '', jahr: '2014', laufzeit: 100, genres: ['Komödie', 'Drama'], darsteller: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan'], inhalt: 'Ein legendärer Concierge und sein Lobby-Boy geraten in einen Streit um ein wertvolles Gemälde.', anbieter: { abo: A('Disney+') } },
  { tmdb: 4348, art: 'film', titel: 'Pride & Prejudice', titelDe: 'Stolz & Vorurteil', jahr: '2005', laufzeit: 129, genres: ['Drama', 'Liebesfilm'], darsteller: ['Keira Knightley', 'Matthew Macfadyen'], inhalt: 'Elizabeth Bennet und der stolze Mr. Darcy können sich nicht ausstehen – oder doch?', anbieter: { abo: A('Netflix'), leihen: A('Apple TV') } },
  { tmdb: 157336, art: 'film', titel: 'Interstellar', titelDe: '', jahr: '2014', laufzeit: 169, genres: ['Abenteuer', 'Drama', 'Science Fiction'], darsteller: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], inhalt: 'Eine Gruppe Raumfahrer reist durch ein Wurmloch, um eine neue Heimat für die Menschheit zu finden.', anbieter: { abo: A('Paramount+'), leihen: A('Apple TV') } },
  { tmdb: 346698, art: 'film', titel: 'Barbie', titelDe: '', jahr: '2023', laufzeit: 114, genres: ['Komödie', 'Abenteuer'], darsteller: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera'], inhalt: 'Barbie bekommt Zweifel am perfekten Leben im Barbieland und macht sich auf in die echte Welt.', anbieter: { abo: A('WOW'), leihen: A('Apple TV') } },
  { tmdb: 11631, art: 'film', titel: 'Mamma Mia!', titelDe: '', jahr: '2008', laufzeit: 108, genres: ['Komödie', 'Liebesfilm', 'Musik'], darsteller: ['Meryl Streep', 'Amanda Seyfried', 'Pierce Brosnan'], inhalt: 'Kurz vor ihrer Hochzeit lädt Sophie drei Männer auf die griechische Insel ein – einer von ihnen ist ihr Vater.', anbieter: { abo: A('Netflix') } },
  { tmdb: 693134, art: 'film', titel: 'Dune: Part Two', titelDe: 'Dune: Teil Zwei', jahr: '2024', laufzeit: 167, genres: ['Science Fiction', 'Abenteuer'], darsteller: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], inhalt: 'Paul Atreides verbündet sich mit den Fremen und sinnt auf Rache an den Verschwörern, die seine Familie zerstört haben.', anbieter: { abo: A('Sky Go'), leihen: A('Apple TV') } },
  { tmdb: 666277, art: 'film', titel: 'Past Lives', titelDe: 'Past Lives – In einem anderen Leben', jahr: '2023', laufzeit: 106, genres: ['Drama', 'Liebesfilm'], darsteller: ['Greta Lee', 'Teo Yoo', 'John Magaro'], inhalt: 'Zwei Kindheitsfreunde aus Seoul treffen sich nach Jahrzehnten in New York wieder.', anbieter: { leihen: A('Apple TV') } },
  { tmdb: 331482, art: 'film', titel: 'Little Women', titelDe: '', jahr: '2019', laufzeit: 135, genres: ['Drama', 'Liebesfilm'], darsteller: ['Saoirse Ronan', 'Florence Pugh', 'Emma Watson'], inhalt: 'Vier Schwestern wachsen im Amerika des 19. Jahrhunderts auf und gehen jede ihren eigenen Weg.', anbieter: { abo: A('Netflix') } },
  { tmdb: 545611, art: 'film', titel: 'Everything Everywhere All at Once', titelDe: '', jahr: '2022', laufzeit: 140, genres: ['Action', 'Abenteuer', 'Science Fiction'], darsteller: ['Michelle Yeoh', 'Ke Huy Quan', 'Jamie Lee Curtis'], inhalt: 'Eine Waschsalon-Besitzerin muss in unzähligen Paralleluniversen die Welt retten.', anbieter: { abo: A('Prime Video') } },
  // Serien
  { tmdb: 4586, art: 'serie', titel: 'Gilmore Girls', titelDe: '', jahr: '2000', folgenLaufzeit: 44, staffeln: staffeln([21, 22, 22, 22, 22, 22, 22], 44), genres: ['Komödie', 'Drama'], darsteller: ['Lauren Graham', 'Alexis Bledel', 'Scott Patterson'], inhalt: 'Lorelai und ihre Tochter Rory sind beste Freundinnen und leben im kleinen Städtchen Stars Hollow.', anbieter: { abo: A('Netflix') } },
  { tmdb: 1668, art: 'serie', titel: 'Friends', titelDe: '', jahr: '1994', folgenLaufzeit: 22, staffeln: staffeln([24, 24, 25, 24, 24, 25, 24, 24, 24, 18], 22), genres: ['Komödie'], darsteller: ['Jennifer Aniston', 'Courteney Cox', 'Lisa Kudrow', 'Matt LeBlanc', 'Matthew Perry', 'David Schwimmer'], inhalt: 'Sechs Freunde meistern in New York Liebe, Job und das Erwachsenwerden.', anbieter: { abo: A('Netflix', 'WOW') } },
  { tmdb: 70523, art: 'serie', titel: 'Dark', titelDe: '', jahr: '2017', folgenLaufzeit: 55, staffeln: staffeln([10, 8, 8], 55), genres: ['Krimi', 'Drama', 'Sci-Fi & Fantasy', 'Mystery'], darsteller: ['Louis Hofmann', 'Lisa Vicari', 'Oliver Masucci'], inhalt: 'Das Verschwinden eines Jungen bringt in einer deutschen Kleinstadt ein Geheimnis über vier Familien und die Zeit ans Licht.', anbieter: { abo: A('Netflix') } },
  { tmdb: 1429, art: 'serie', titel: 'Attack on Titan', titelDe: '', jahr: '2013', folgenLaufzeit: 24, staffeln: staffeln([25, 12, 22, 30], 24), genres: ['Animation', 'Sci-Fi & Fantasy', 'Action & Adventure'], darsteller: ['Yūki Kaji', 'Yui Ishikawa', 'Marina Inoue'], inhalt: 'Hinter riesigen Mauern lebt die Menschheit in Angst vor Titanen, bis Eren beschließt zurückzuschlagen.', anbieter: { abo: A('Crunchyroll', 'Prime Video') } },
  { tmdb: 66732, art: 'serie', titel: 'Stranger Things', titelDe: '', jahr: '2016', folgenLaufzeit: 50, staffeln: staffeln([8, 9, 8, 9], 50), genres: ['Sci-Fi & Fantasy', 'Mystery', 'Action & Adventure'], darsteller: ['Millie Bobby Brown', 'Finn Wolfhard', 'Winona Ryder'], inhalt: 'In einer Kleinstadt verschwindet ein Junge, und seine Freunde stoßen auf ein unheimliches Geheimnis.', anbieter: { abo: A('Netflix') } },
  { tmdb: 136315, art: 'serie', titel: 'The Bear', titelDe: '', jahr: '2022', folgenLaufzeit: 30, staffeln: staffeln([8, 10, 10], 30), genres: ['Drama', 'Komödie'], darsteller: ['Jeremy Allen White', 'Ayo Edebiri', 'Ebon Moss-Bachrach'], inhalt: 'Ein Spitzenkoch übernimmt den chaotischen Sandwichladen seiner Familie in Chicago.', anbieter: { abo: A('Disney+') } },
  { tmdb: 89905, art: 'serie', titel: 'Normal People', titelDe: '', jahr: '2020', folgenLaufzeit: 30, staffeln: staffeln([12], 30), genres: ['Drama'], darsteller: ['Daisy Edgar-Jones', 'Paul Mescal'], inhalt: 'Marianne und Connell finden in einer irischen Kleinstadt zueinander und verlieren sich immer wieder.', anbieter: { abo: A('WOW') } },
  { tmdb: 119051, art: 'serie', titel: 'Wednesday', titelDe: '', jahr: '2022', folgenLaufzeit: 50, staffeln: staffeln([8], 50), genres: ['Sci-Fi & Fantasy', 'Mystery', 'Komödie'], darsteller: ['Jenna Ortega', 'Gwendoline Christie', 'Emma Myers'], inhalt: 'Wednesday Addams kommt auf die Nevermore Academy und stößt dort auf eine Mordserie.', anbieter: { abo: A('Netflix') } },
];

const voll = k => ({
  id: `${k.art}:${k.tmdb}`, poster: '', hintergrund: '', aktualisiert: Date.now(),
  ...k, anbieter: { abo: [], gratis: [], leihen: [], kaufen: [], link: '', ...k.anbieter },
});
const warten = ms => new Promise(r => setTimeout(r, ms));

export async function suchen(text) {
  await warten(250);
  const q = text.toLowerCase();
  return KATALOG.filter(k => k.titel.toLowerCase().includes(q) || (k.titelDe || '').toLowerCase().includes(q))
    .map(k => ({ id: `${k.art}:${k.tmdb}`, art: k.art, tmdb: k.tmdb, titel: k.titel, titelDe: k.titelDe, jahr: k.jahr, poster: '' }));
}

// Entdecken in der Demo: der Katalog, nach Genre gefiltert. Nur eine Seite.
export async function entdecken(art, auswahl, genreName) {
  await warten(300);
  const passt = k => k.art === art && (
    auswahl === 'angesagt' || auswahl === 'beliebt' ? true
      : auswahl === 'anime' ? k.genres.includes('Animation')
        : k.genres.includes(genreName));
  const treffer = KATALOG.filter(passt).map(k => ({ id: `${k.art}:${k.tmdb}`, art: k.art, tmdb: k.tmdb, titel: k.titel, titelDe: k.titelDe, jahr: k.jahr, poster: '' }));
  return { treffer, ende: true };
}

export async function details(art, tmdb) {
  await warten(400);
  const k = KATALOG.find(x => x.art === art && x.tmdb === tmdb);
  if (!k) throw new Error('Nicht im Demo-Katalog');
  return structuredClone(voll(k));
}

// Bibliothek zum Ausprobieren.
export function bibliothek() {
  let nr = 0;
  const neu = (tmdb, status, extra = {}) => {
    const k = KATALOG.find(x => x.tmdb === tmdb);
    const e = { ...structuredClone(voll(k)), status, sterne: 0, herz: false, gesehenFolgen: [], nr: ++nr, geaendert: nr, ...extra };
    return e;
  };
  const bisFolge = (tmdb, s, f) => {
    const k = KATALOG.find(x => x.tmdb === tmdb);
    return k.staffeln.flatMap(st => st.folgen.filter(fo => st.n < s || (st.n === s && fo.n <= f)).map(fo => `${st.n}:${fo.n}`));
  };
  const alle = tmdb => KATALOG.find(x => x.tmdb === tmdb).staffeln.flatMap(st => st.folgen.map(fo => `${st.n}:${fo.n}`));
  return [
    neu(278, 'gesehen', { sterne: 5, herz: true }),
    neu(4348, 'gesehen', { sterne: 5, herz: true }),
    neu(1668, 'gesehen', { sterne: 4.5, herz: true, gesehenFolgen: alle(1668) }),
    neu(70523, 'gesehen', { sterne: 5, gesehenFolgen: alle(70523) }),
    neu(194, 'gesehen', { sterne: 3.5 }),
    neu(27205, 'gesehen', { sterne: 4 }),
    neu(346698, 'gesehen', { sterne: 3 }),
    neu(11631, 'gesehen', { sterne: 4.5 }),
    neu(313369, 'gesehen', { sterne: 4 }),
    neu(129, 'gesehen', { sterne: 4.5, herz: true }),
    neu(1429, 'mittendrin', { sterne: 4, gesehenFolgen: bisFolge(1429, 2, 2) }),
    neu(4586, 'mittendrin', { herz: true, gesehenFolgen: bisFolge(4586, 3, 6) }),
    neu(136315, 'watchlist'),
    neu(119051, 'watchlist'),
    neu(545611, 'watchlist'),
    neu(331482, 'watchlist'),
    neu(693134, 'watchlist'),
    neu(666277, 'watchlist'),
    neu(157336, 'watchlist'),
  ];
}
