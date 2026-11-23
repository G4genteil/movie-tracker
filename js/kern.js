// Zeichnen und kurze Hinweise unten.
// Die Seite wird nicht ersetzt, sondern angeglichen (Idiomorph): Eingabefelder behalten Fokus und Text,
// Bilder flackern nicht, und die Rollposition unter einer offenen Detailseite bleibt erhalten.
import { seite } from './ansichten.js';
import { esc } from './hilfen.js';

export function zeichne() {
  // Ein angetippter Knopf behält sonst den Fokus, und Idiomorph lässt den Inhalt fokussierter Elemente aus
  // (z. B. bliebe das Herz leer). Eingabefelder behalten ihren Fokus.
  const aktiv = document.activeElement;
  if (aktiv && aktiv.tagName === 'BUTTON') aktiv.blur();
  window.Idiomorph.morph(document.getElementById('app'), seite(), { morphStyle: 'innerHTML', ignoreActiveValue: true });
}

let uhr;
export function toast(text, knopf, aktion) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${esc(text)}</span>${knopf ? `<button type="button">${esc(knopf)}</button>` : ''}`;
  if (knopf) t.querySelector('button').onclick = () => { t.classList.remove('an'); aktion(); };
  t.classList.add('an');
  clearTimeout(uhr);
  uhr = setTimeout(() => t.classList.remove('an'), knopf ? 7000 : 2600);
}

export const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
