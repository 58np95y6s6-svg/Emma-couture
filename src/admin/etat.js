/**
 * État de l'atelier : valeurs du build + réglages enregistrés = ce qui est
 * en ligne. Chaque page part de là pour son brouillon et ses aperçus.
 */
import { appel } from './api.js';

export const BUILD = JSON.parse(document.getElementById('donnees-build').textContent);
export const TITRES_BUILD = Object.fromEntries(BUILD.creations.map((c) => [c.slug, c.titre]));

let serveur = null; // { reglages, prive, versionsPrecedentes }

export async function charger() {
  serveur = await appel('/api/admin/reglages');
  return serveur;
}
export const version = () => serveur?.reglages?.version ?? 0;
export const prive = () => serveur?.prive ?? null;

/** Créations telles qu'elles sont en ligne, dans l'ordre de l'accueil. */
export function creationsEnLigne() {
  const r = serveur?.reglages?.creations ?? {};
  return BUILD.creations.map((b) => {
    const o = r[b.slug];
    return {
      ...b,
      titre: o?.titre ?? b.titre,
      prix: o ? o.prix : b.prix,
      delai: o ? o.delai : b.delai,
      visible: o ? o.visible : b.visible,
      ordre: o ? o.ordre : 1000 + b.ordre,
      photoReglee: o?.photo ?? null,
    };
  }).sort((a, b) => a.ordre - b.ordre);
}

export const portraitEnLigne = () => serveur?.reglages?.accueil?.portrait ?? null;
export const infosEnLigne = () => ({ ...BUILD.infos, ...(serveur?.reglages?.infos ?? {}) });
export const horairesEnLigne = () => serveur?.reglages?.horaires ?? null;
export const avisEnLigne = () => serveur?.reglages?.avis ?? [];

/** Enregistre des sections ; renvoie le nouvel état serveur. */
export async function enregistrer(changements, donneesPrivees) {
  const corps = { base: version(), changements };
  if (donneesPrivees !== undefined) corps.prive = donneesPrivees;
  serveur = await appel('/api/admin/reglages', { methode: 'PUT', corps });
  return serveur;
}

export async function annuler() {
  serveur = await appel('/api/admin/reglages', { methode: 'POST', corps: { action: 'annuler', base: version() } });
  return serveur;
}

/** Créations → map de réglages complète (le format du serveur). */
export function versReglages(liste) {
  return Object.fromEntries(
    liste.map((c, i) => [c.slug, { titre: c.titre, prix: c.prix, delai: c.delai, visible: c.visible, ordre: i, photo: c.photoReglee ?? null }]),
  );
}
