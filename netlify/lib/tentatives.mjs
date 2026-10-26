/**
 * Limitation des essais de connexion : 5 échecs par tranche de 15 minutes
 * et par adresse IP. L'adresse n'est jamais stockée en clair (empreinte
 * SHA-256 salée par le secret de session), et les compteurs s'effacent
 * d'eux-mêmes : on ne garde que les échecs des 15 dernières minutes.
 */
import { createHash } from 'node:crypto';
import { MAGASINS, magasin } from './stockage.mjs';

export const ECHECS_MAX = 5;
export const FENETRE_MS = 15 * 60 * 1000;

export function ipDe(req, context) {
  return context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'inconnue';
}

const cle = (ip) =>
  `ip-${createHash('sha256').update(`${process.env.ADMIN_SECRET_SESSION ?? ''}|${ip}`).digest('hex').slice(0, 32)}`;

async function echecsRecents(ip, maintenant) {
  const doc = await magasin(MAGASINS.securite).get(cle(ip), { type: 'json' });
  return (doc?.echecs ?? []).filter((t) => maintenant - t < FENETRE_MS);
}

/** Renvoie le nombre de minutes d'attente, ou 0 si l'essai est permis. */
export async function attenteAvantEssai(ip, maintenant = Date.now()) {
  const echecs = await echecsRecents(ip, maintenant);
  if (echecs.length < ECHECS_MAX) return 0;
  return Math.max(1, Math.ceil((Math.min(...echecs) + FENETRE_MS - maintenant) / 60000));
}

/** Enregistre un échec ; renvoie le nombre d'essais restants. */
export async function noterEchec(ip, maintenant = Date.now()) {
  const echecs = [...(await echecsRecents(ip, maintenant)), maintenant];
  await magasin(MAGASINS.securite).setJSON(cle(ip), { echecs });
  return Math.max(0, ECHECS_MAX - echecs.length);
}

export const effacerEchecs = (ip) => magasin(MAGASINS.securite).delete(cle(ip));
