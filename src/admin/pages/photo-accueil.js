/** Section « Photo d'accueil » : remplacer le portrait du haut de l'accueil. */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { duo, hautAccueil } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { preparerPhoto, envoyerPhoto } from '../photo.js';

const $ = (id) => document.getElementById(id);
const ALT_ORIGINE = etat.BUILD.accueil.portrait.alt;

let brouillon; // { portrait: réglé|null, preparee: photo locale|null, alt }

const enLigne = () => {
  const p = etat.portraitEnLigne();
  return { portrait: p, preparee: null, alt: p?.alt ?? ALT_ORIGINE };
};
const identique = () => {
  const l = enLigne();
  return !brouillon.preparee && (brouillon.portrait?.grande ?? null) === (l.portrait?.grande ?? null) && brouillon.alt.trim() === l.alt;
};

function rendre() {
  const l = enLigne();
  $('apercu').replaceChildren(
    duo(hautAccueil(l.portrait), hautAccueil(brouillon.portrait, { apercuLocal: brouillon.preparee?.apercu }), { identique: identique() }),
  );
  const personnalisee = Boolean(brouillon.portrait || brouillon.preparee);
  $('origine').hidden = !personnalisee;
  $('etat-photo').textContent = brouillon.preparee
    ? 'Nouvelle photo choisie. Elle sera envoyée quand vous appuierez sur « Enregistrer ».'
    : personnalisee ? 'Votre site affiche une photo que vous avez choisie.' : 'Votre site affiche la photo d’origine.';
  barre.changement(!identique());
}

const barre = barreEnregistrement($('zone-enregistrer'), {
  async enregistrer() {
    const alt = brouillon.alt.trim();
    if ((brouillon.portrait || brouillon.preparee) && alt.length < 5) {
      $('alt').focus();
      throw new Error('Décrivez la photo en quelques mots avant d’enregistrer.');
    }
    let portrait = brouillon.portrait;
    if (brouillon.preparee) {
      $('etat-photo').textContent = 'Envoi de la photo…';
      portrait = await envoyerPhoto(brouillon.preparee);
    }
    await etat.enregistrer({ accueil: { portrait: portrait ? { ...portrait, alt } : null } });
    brouillon = enLigne();
    $('alt').value = brouillon.alt;
    rendre();
  },
  abandonner() { brouillon = enLigne(); $('alt').value = brouillon.alt; rendre(); },
  apresAnnulation() { brouillon = enLigne(); $('alt').value = brouillon.alt; rendre(); },
});

$('fichier').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  $('erreur-photo').hidden = true;
  $('etat-photo').textContent = 'Préparation de la photo…';
  try {
    brouillon.preparee = await preparerPhoto(f);
    if (brouillon.alt === ALT_ORIGINE || brouillon.alt === enLigne().alt) {
      brouillon.alt = '';
      $('alt').value = '';
    }
  } catch (err) {
    $('erreur-photo').textContent = err.message;
    $('erreur-photo').hidden = false;
  }
  rendre();
});

$('origine').addEventListener('click', () => {
  brouillon = { portrait: null, preparee: null, alt: ALT_ORIGINE };
  $('alt').value = ALT_ORIGINE;
  rendre();
});
$('alt').addEventListener('input', (e) => { brouillon.alt = e.target.value; rendre(); });

(async () => {
await atelierPret;
  try {
    await etat.charger();
    brouillon = enLigne();
    $('alt').value = brouillon.alt;
    $('section').hidden = false;
    rendre();
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
