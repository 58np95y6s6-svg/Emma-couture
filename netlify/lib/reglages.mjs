/**
 * Le document de réglages piloté par Emmanuelle et son historique.
 *
 * Magasin « atelier-reglages » :
 *  - « actuel »     : le document en ligne ;
 *  - « historique » : les 5 versions précédentes, la plus récente d'abord ;
 *  - « prive »      : mentions légales et réponses du questionnaire
 *                     (jamais servies au public, hors historique).
 *
 * Forme du document (chaque section absente ou null = valeurs du build) :
 * {
 *   version, majLe,
 *   accueil:  { portrait: null | { grande, petite, largeur, hauteur, alt } },
 *   creations: { '<slug>': { titre, prix|null, delai|null, visible, ordre, photo|null } },
 *   infos:    null | { telephone, whatsapp, email, facebook, ville, delaiReponse, … },
 *   horaires: null | { mode, jours: { lundi: { ferme, plages: [{ de, a }] } … } },
 *   avis:     null | [{ id, prenom, ville, date, texte, creation, visible, accord }]
 * }
 */
import catalogue from './catalogue.json' with { type: 'json' };
import { MAGASINS, magasin } from './stockage.mjs';
import {
  validerAccueil, validerCreations, validerInfos, validerHoraires, validerAvis, validerPrive,
} from '../../src/lib/regles-atelier.js';

export { estErreurSaisie } from '../../src/lib/regles-atelier.js';

export const TAILLE_HISTORIQUE = 5;
export const TITRES = Object.fromEntries(catalogue.creations.map((c) => [c.slug, c.titre]));
export const SECTIONS = ['accueil', 'creations', 'infos', 'horaires', 'avis'];

export const documentVide = () => ({
  version: 0, majLe: null, accueil: { portrait: null }, creations: {}, infos: null, horaires: null, avis: null,
});

export async function lireActuel() {
  const doc = await magasin(MAGASINS.reglages).get('actuel', { type: 'json' });
  return { ...documentVide(), ...(doc ?? {}) };
}

export async function lireHistorique() {
  return (await magasin(MAGASINS.reglages).get('historique', { type: 'json' })) ?? [];
}

export async function lirePrive() {
  return (await magasin(MAGASINS.reglages).get('prive', { type: 'json' })) ?? null;
}

/** Valide les sections modifiées et renvoie le nouveau document (non enregistré). */
export function appliquerChangements(actuel, changements) {
  if (!changements || typeof changements !== 'object') throw new TypeError('changements');
  const suivant = structuredClone(actuel);
  for (const [section, valeur] of Object.entries(changements)) {
    if (!SECTIONS.includes(section)) continue;
    if (valeur === null && section !== 'accueil' && section !== 'creations') { suivant[section] = null; continue; }
    suivant[section] = {
      accueil: () => validerAccueil(valeur),
      creations: () => validerCreations(valeur, TITRES),
      infos: () => validerInfos(valeur),
      horaires: () => validerHoraires(valeur),
      avis: () => validerAvis(valeur, TITRES),
    }[section]();
  }
  return suivant;
}

export const validerDonneesPrivees = (v) => validerPrive(v);

/** Enregistre `suivant` ; l'ancien document part en tête de l'historique. */
export async function enregistrer(actuel, suivant) {
  const m = magasin(MAGASINS.reglages);
  const historique = await lireHistorique();
  if (actuel.version > 0) historique.unshift(actuel);
  const doc = { ...suivant, version: actuel.version + 1, majLe: new Date().toISOString() };
  await m.setJSON('historique', historique.slice(0, TAILLE_HISTORIQUE));
  await m.setJSON('actuel', doc);
  return doc;
}

export async function enregistrerPrive(prive) {
  await magasin(MAGASINS.reglages).setJSON('prive', { ...prive, majLe: new Date().toISOString() });
}

/** Revient à la version précédente. Renvoie null s'il n'y en a pas. */
export async function annulerDernier(actuel) {
  const m = magasin(MAGASINS.reglages);
  const historique = await lireHistorique();
  if (!historique.length && actuel.version === 0) return null;
  const restaure = historique.shift() ?? documentVide();
  const doc = { ...documentVide(), ...restaure, version: actuel.version + 1, majLe: new Date().toISOString() };
  await m.setJSON('historique', historique);
  await m.setJSON('actuel', doc);
  return doc;
}

/**
 * Ce que voient les visiteuses : uniquement l'affichage. Pas de nom légal,
 * de SIRET ni d'adresse (ils ne sont pas dans ce document), pas d'avis
 * masqué, pas de date de mise à jour.
 */
export function versionPublique(doc) {
  const creations = {};
  for (const [slug, c] of Object.entries(doc.creations ?? {})) {
    if (!Object.hasOwn(TITRES, slug)) continue;
    creations[slug] = {
      titre: c.titre, prix: c.prix, delai: c.delai, visible: c.visible, ordre: c.ordre,
      photo: c.photo ? { grande: c.photo.grande, petite: c.photo.petite, largeur: c.photo.largeur, hauteur: c.photo.hauteur } : null,
    };
  }
  const p = doc.accueil?.portrait;
  const i = doc.infos;
  return {
    version: doc.version ?? 0,
    accueil: { portrait: p ? { grande: p.grande, petite: p.petite, largeur: p.largeur, hauteur: p.hauteur, alt: p.alt } : null },
    creations,
    infos: i
      ? {
          telephone: i.telephone, whatsapp: i.whatsapp, email: i.email, facebook: i.facebook, ville: i.ville,
          delaiReponse: i.delaiReponse, delaiActuel: i.delaiActuel, commandes: i.commandes, retourLe: i.retourLe,
          dateLimiteNoel: i.dateLimiteNoel, remiseVitre: i.remiseVitre, remiseRennes: i.remiseRennes,
          remiseAutres: i.remiseAutres, envoiFrance: i.envoiFrance, fraisEnvoi: i.fraisEnvoi,
          emballageCadeau: i.emballageCadeau, paiement: i.paiement, acompte: i.acompte, marches: i.marches,
        }
      : null,
    horaires: doc.horaires ?? null,
    avis: Array.isArray(doc.avis)
      ? doc.avis.filter((a) => a.visible && a.accord).map(({ prenom, ville, date, texte, creation }) => ({ prenom, ville, date, texte, creation }))
      : null,
  };
}
