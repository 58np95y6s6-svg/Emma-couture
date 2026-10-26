/** Import du questionnaire Excel : lecture, vérification, « Tout appliquer ». */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { h } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { lireXlsx } from '../xlsx.js';
import { lireQuestionnaire } from '../lecture-questionnaire.js';

const $ = (id) => document.getElementById(id);
let plan = null;

function afficher(p) {
  $('verification').hidden = false;
  const morceaux = [`${p.nbChangements} changement${p.nbChangements > 1 ? 's' : ''}`];
  if (p.nbErreurs) morceaux.push(`${p.nbErreurs} valeur${p.nbErreurs > 1 ? 's' : ''} à corriger`);
  if (p.nbAvertissements) morceaux.push(`${p.nbAvertissements} remarque${p.nbAvertissements > 1 ? 's' : ''}`);
  $('bilan').textContent = p.nbChangements || p.nbErreurs || p.nbAvertissements
    ? morceaux.join(' · ')
    : 'Aucun changement : le questionnaire correspond déjà à votre site.';
  $('diff').replaceChildren(...p.groupes.flatMap((g) => [
    h('h3', { class: 'diff__groupe' }, g.titre),
    h('ul', { class: 'diff' }, g.lignes.map((l) => h('li', { class: l.statut === 'erreur' ? 'diff--erreur' : l.statut === 'avert' ? 'diff--avert' : '' },
      h('span', { class: 'diff__champ' }, l.statut === 'erreur' ? `À corriger · ${l.champ}` : l.champ),
      l.message
        ? h('span', {}, l.message)
        : h('span', { class: 'diff__valeurs' }, h('span', { class: `diff__avant${/^\(.*\)$/.test(l.avant) ? ' diff__avant--vide' : ''}` }, l.avant), h('span', { 'aria-hidden': 'true' }, '→'), h('span', { class: 'lu-seulement' }, 'devient'), h('span', { class: 'diff__apres' }, l.apres)),
    ))),
  ]));
}

$('fichier').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  $('erreur-fichier').hidden = true;
  $('verification').hidden = true;
  $('nom-fichier').textContent = `Lecture de « ${f.name} »…`;
  try {
    if (f.size > 5 * 1024 * 1024) throw new Error('Ce fichier est trop lourd pour être le questionnaire.');
    const classeur = await lireXlsx(f);
    await etat.charger(); // repartir de la toute dernière version en ligne
    plan = lireQuestionnaire(classeur, {
      infos: etat.infosEnLigne(), creations: etat.creationsEnLigne(), avis: etat.avisEnLigne(),
      horaires: etat.horairesEnLigne(), prive: etat.prive(),
    }, etat.TITRES_BUILD);
    $('nom-fichier').textContent = `Fichier lu : « ${f.name} ».`;
    afficher(plan);
    barre.changement(Object.keys(plan.changements).length > 0 || Boolean(plan.prive));
    $('verification').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    plan = null;
    barre.changement(false);
    $('nom-fichier').textContent = '';
    $('erreur-fichier').textContent = err.message;
    $('erreur-fichier').hidden = false;
  }
});

const barre = barreEnregistrement($('zone-enregistrer'), {
  libelle: 'Tout appliquer',
  async enregistrer() {
    const c = { ...plan.changements };
    if (c.creations) c.creations = etat.versReglages(c.creations);
    await etat.enregistrer(c, plan.prive);
    $('verification').hidden = true;
    plan = null;
  },
  abandonner() { plan = null; $('verification').hidden = true; $('nom-fichier').textContent = ''; },
  apresAnnulation() { $('nom-fichier').textContent = ''; },
});

(async () => {
  await atelierPret;
  try {
    await etat.charger();
    $('section').hidden = false;
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
