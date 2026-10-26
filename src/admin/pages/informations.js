/** Section « Mes informations » : coordonnées, délais, commandes, remise. */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { h, duo, tuiles, appelFinal, pied, cartesAccueil } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { validerInfos, normaliserTelephone, normaliserEmail, normaliserFacebook, estErreurSaisie } from '../../lib/regles-atelier.js';

const $ = (id) => document.getElementById(id);
const form = $('form');
let brouillon;

const CONTROLES = {
  telephone: (v) => { if (!String(v).trim()) throw new Error('Le numéro de téléphone ne peut pas être vide.'); return normaliserTelephone(v); },
  whatsapp: (v) => normaliserTelephone(v, 'Le numéro WhatsApp'),
  email: (v) => { if (!String(v).trim()) throw new Error('L’adresse e-mail ne peut pas être vide.'); return normaliserEmail(v); },
  facebook: normaliserFacebook,
};

/** Brouillon avec les numéros et adresses normalisés quand ils sont valides. */
function normalise(b) {
  const sortie = { ...b };
  for (const [cle, f] of Object.entries(CONTROLES)) {
    try { sortie[cle] = f(b[cle]); } catch { /* valeur brute gardée */ }
  }
  return sortie;
}
const identique = () => JSON.stringify(normalise(brouillon)) === JSON.stringify(normalise(etat.infosEnLigne()));

function prixMin() {
  const p = cartesAccueil(etat.creationsEnLigne()).map((c) => c.prix).filter((x) => x > 0);
  return p.length ? Math.min(...p) : null;
}
const blocs = (i) => h('div', { class: 'apercu__liste' }, tuiles(i, prixMin()), appelFinal(i), pied(i));

function remplir() {
  for (const el of form.querySelectorAll('[data-cle]')) {
    const v = brouillon[el.dataset.cle];
    if (el.type === 'checkbox') el.checked = Boolean(v);
    else el.value = v ?? '';
  }
  for (const r of form.elements.commandes) r.checked = r.value === brouillon.commandes;
  for (const e of form.querySelectorAll('[data-erreur]')) e.textContent = '';
  for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
}

function rendre() {
  $('champ-retour').hidden = brouillon.commandes !== 'conges';
  const egal = identique();
  $('apercu').replaceChildren(duo(blocs(etat.infosEnLigne()), blocs(normalise(brouillon)), { identique: egal }));
  barre.changement(!egal);
}

function controler(el) {
  const cle = el.dataset.cle;
  const zone = form.querySelector(`[data-erreur="${cle}"]`);
  if (!zone || !CONTROLES[cle]) return;
  try { CONTROLES[cle](el.value); zone.textContent = ''; el.removeAttribute('aria-invalid'); }
  catch (e) { zone.textContent = e.message; el.setAttribute('aria-invalid', 'true'); }
}

form.addEventListener('input', (e) => {
  const el = e.target;
  if (el.name === 'commandes') brouillon.commandes = el.value;
  else if (el.dataset.cle) brouillon[el.dataset.cle] = el.type === 'checkbox' ? el.checked : el.value;
  if (el.getAttribute('aria-invalid') === 'true') controler(el);
  rendre();
});
form.addEventListener('change', (e) => { if (e.target.dataset?.cle) controler(e.target); });
form.addEventListener('submit', (e) => e.preventDefault());

const barre = barreEnregistrement($('zone-enregistrer'), {
  async enregistrer() {
    let infos;
    try {
      infos = validerInfos({ ...brouillon, retourLe: brouillon.commandes === 'conges' ? brouillon.retourLe : '' });
    } catch (e) {
      if (estErreurSaisie(e)) for (const el of form.querySelectorAll('[data-cle]')) controler(el);
      form.querySelector('[aria-invalid="true"]')?.focus();
      throw e;
    }
    await etat.enregistrer({ infos });
    brouillon = etat.infosEnLigne();
    remplir();
    rendre();
  },
  abandonner() { brouillon = etat.infosEnLigne(); remplir(); rendre(); },
  apresAnnulation() { brouillon = etat.infosEnLigne(); remplir(); rendre(); },
});

(async () => {
  await atelierPret;
  try {
    await etat.charger();
    brouillon = etat.infosEnLigne();
    $('section').hidden = false;
    remplir();
    rendre();
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
