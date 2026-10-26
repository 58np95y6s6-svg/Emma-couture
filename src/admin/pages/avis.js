/** Section « Avis de clientes » : ajouter, masquer, supprimer. */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { h, duo, avis as carteAvis } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { validerAvis } from '../../lib/regles-atelier.js';

const $ = (id) => document.getElementById(id);
const form = $('ajout');
let brouillon = [];
const identifiant = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0');
const identique = () => JSON.stringify(brouillon) === JSON.stringify(etat.avisEnLigne());

const affiches = (liste) => {
  const v = liste.filter((a) => a.visible);
  return v.length ? h('div', { class: 'apercu__liste' }, v.map((a) => carteAvis(a, etat.TITRES_BUILD))) : h('p', { class: 'apercu__vide' }, 'Aucun avis affiché.');
};

function rendre() {
  $('liste').replaceChildren(...(brouillon.length ? brouillon.map((a, i) =>
    h('li', { class: `avis-ligne${a.visible ? '' : ' avis-ligne--masque'}` },
      h('p', { class: 'avis-ligne__texte' }, `« ${a.texte} »`),
      h('p', { class: 'avis-ligne__meta' }, [a.prenom, a.ville, a.date, etat.TITRES_BUILD[a.creation], a.visible ? 'affiché' : 'masqué'].filter(Boolean).join(' · ')),
      h('div', { class: 'at-boutons' },
        h('button', { class: 'btn btn--creux btn--petit', type: 'button', onclick: () => { a.visible = !a.visible; rendre(); } }, a.visible ? 'Masquer' : 'Afficher'),
        h('button', { class: 'btn btn--creux btn--petit', type: 'button', onclick: () => {
          if (confirm(`Supprimer définitivement l’avis de ${a.prenom} ?`)) { brouillon.splice(i, 1); rendre(); }
        } }, 'Supprimer'),
      ),
    )) : [h('li', { class: 'apercu__vide' }, 'Aucun avis pour l’instant.')]));
  $('apercu').replaceChildren(duo(affiches(etat.avisEnLigne()), affiches(brouillon), { identique: identique() }));
  barre.changement(!identique());
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const erreur = $('erreur-ajout');
  erreur.hidden = true;
  const d = Object.fromEntries(new FormData(form));
  const nouveau = { id: identifiant(), prenom: d.prenom, ville: d.ville, date: d.date, texte: d.texte, creation: d.creation, visible: true, accord: d.accord === 'on' };
  try {
    if (!nouveau.accord) throw new Error('Cochez la case d’accord : sans l’accord de la cliente, l’avis ne peut pas être publié.');
    const [propre] = validerAvis([nouveau], etat.TITRES_BUILD);
    brouillon.unshift(propre);
    form.reset();
    rendre();
  } catch (err) {
    erreur.textContent = err.message.replace(/^L’avis n° 1(, | : )/, '').replace(/^./, (c) => c.toUpperCase());
    erreur.hidden = false;
  }
});

const repartir = () => { brouillon = structuredClone(etat.avisEnLigne()); rendre(); };
const barre = barreEnregistrement($('zone-enregistrer'), {
  async enregistrer() { await etat.enregistrer({ avis: brouillon }); repartir(); },
  abandonner: repartir,
  apresAnnulation: repartir,
});

(async () => {
  await atelierPret;
  for (const c of etat.BUILD.creations) $('choix-creation').append(h('option', { value: c.slug }, c.titre));
  try {
    await etat.charger();
    $('section').hidden = false;
    repartir();
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
