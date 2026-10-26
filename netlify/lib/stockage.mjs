/**
 * Accès aux magasins Netlify Blobs.
 *
 * Trois magasins :
 *  - « atelier-reglages » : le document de réglages et son historique ;
 *  - « atelier-images »   : les photos envoyées depuis l'admin ;
 *  - « atelier-securite » : les compteurs d'essais de connexion.
 *
 * Le banc d'essai (scripts/banc-essai-fonctions.mjs) remplace ces magasins
 * par des magasins en mémoire via globalThis.__magasinsEssai. En production,
 * cette variable n'existe pas : on utilise toujours @netlify/blobs.
 */
import { getStore } from '@netlify/blobs';

export const MAGASINS = {
  reglages: 'atelier-reglages',
  images: 'atelier-images',
  securite: 'atelier-securite',
};

export function magasin(nom, { fort = true } = {}) {
  const essai = globalThis.__magasinsEssai;
  if (essai) return essai(nom);
  return getStore({ name: nom, consistency: fort ? 'strong' : 'eventual' });
}
