/** Section « Mes horaires » : fermé, ou une ou deux plages par jour. */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { h, duo, horairesTexte } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { validerHoraires, JOURS } from '../../lib/regles-atelier.js';

const $ = (id) => document.getElementById(id);
const HEURES = [];
for (let m = 7 * 60; m <= 21 * 60; m += 15) HEURES.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const lisible = (t) => t.replace(/^0/, '').replace(':', ' h ').replace(/ h 00$/, ' h');

const PAR_DEFAUT = () => ({
  mode: 'messages',
  jours: Object.fromEntries(JOURS.map((j, i) => [j, i < 5 ? { ferme: false, plages: [{ de: '09:00', a: '12:00' }, { de: '14:00', a: '18:00' }] } : { ferme: true, plages: [] }])),
});
let brouillon;
const enLigne = () => etat.horairesEnLigne();
const identique = () => JSON.stringify(brouillon) === JSON.stringify(enLigne() ?? PAR_DEFAUT()) && enLigne() !== null;

function selection(valeur, nom, surChoix) {
  const liste = HEURES.includes(valeur) ? HEURES : [...HEURES, valeur].sort();
  const s = h('select', { 'aria-label': nom }, liste.map((t) => h('option', { value: t, selected: t === valeur }, lisible(t))));
  s.addEventListener('change', () => surChoix(s.value));
  return s;
}

function jour(j) {
  const d = brouillon.jours[j];
  const nom = j.charAt(0).toUpperCase() + j.slice(1);
  const ferme = h('input', { type: 'checkbox', checked: d.ferme });
  ferme.addEventListener('change', () => {
    d.ferme = ferme.checked;
    if (!d.ferme && !d.plages.length) d.plages = [{ de: '09:00', a: '18:00' }];
    construire(); rendre();
  });
  const li = h('li', { class: 'jour' },
    h('div', { class: 'jour__tete' }, h('span', { class: 'jour__nom' }, nom), h('label', { class: 'at-coche' }, ferme, h('span', {}, 'Fermé'))));
  if (!d.ferme) {
    d.plages.forEach((p, n) => {
      li.append(h('div', { class: 'plage' },
        h('label', { class: 'at-champ' }, h('span', { class: 'at-champ__nom' }, n ? 'Puis de' : 'De'), selection(p.de, `${nom}, début`, (v) => { p.de = v; rendre(); })),
        h('span', { class: 'plage__a' }, 'à'),
        h('label', { class: 'at-champ' }, h('span', { class: 'at-champ__nom lu-seulement' }, 'à'), selection(p.a, `${nom}, fin`, (v) => { p.a = v; rendre(); })),
      ));
    });
    li.append(d.plages.length < 2
      ? h('button', { class: 'btn btn--creux btn--petit', type: 'button', onclick: () => { const fin = d.plages[0].a; d.plages.push({ de: fin < '14:00' ? '14:00' : fin, a: '18:00' > fin ? '18:00' : '21:00' }); construire(); rendre(); } }, 'Ajouter une plage (couper le midi)')
      : h('button', { class: 'btn btn--creux btn--petit', type: 'button', onclick: () => { d.plages.pop(); construire(); rendre(); } }, 'Retirer la deuxième plage'));
  }
  return li;
}

function construire() {
  $('jours').replaceChildren(...JOURS.map(jour));
  for (const r of document.getElementsByName('mode')) r.checked = r.value === brouillon.mode;
}

let erreurCourante = null;
function rendre() {
  try { validerHoraires(brouillon); erreurCourante = null; } catch (e) { erreurCourante = e.message; }
  $('apercu').replaceChildren(
    duo(horairesTexte(enLigne()), erreurCourante ? h('p', { class: 'at-erreur' }, erreurCourante) : horairesTexte(brouillon), { identique: identique() }),
  );
  barre.changement(!identique());
}

document.getElementById('mode').addEventListener('change', (e) => { brouillon.mode = e.target.value; rendre(); });
$('copier').addEventListener('click', () => {
  for (const j of JOURS.slice(1, 5)) brouillon.jours[j] = structuredClone(brouillon.jours.lundi);
  construire(); rendre();
});

const repartir = () => { brouillon = structuredClone(enLigne() ?? PAR_DEFAUT()); construire(); rendre(); };
const barre = barreEnregistrement($('zone-enregistrer'), {
  async enregistrer() {
    if (erreurCourante) throw new Error(erreurCourante);
    await etat.enregistrer({ horaires: validerHoraires(brouillon) });
    repartir();
  },
  abandonner: repartir,
  apresAnnulation: repartir,
});

(async () => {
  await atelierPret;
  try {
    await etat.charger();
    $('section').hidden = false;
    repartir();
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
