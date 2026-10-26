/**
 * /api/admin/reglages — réservé à une session valide.
 *   GET  → { reglages, prive, versionsPrecedentes }
 *   PUT  → { base, changements: { accueil?, creations?, infos?, horaires?, avis? }, prive? }
 *   POST → { action: 'annuler', base }  (revient à la version précédente)
 *
 * `base` est la version sur laquelle Emmanuelle a travaillé : si le document
 * a changé entre-temps (autre appareil), on refuse plutôt que d'écraser.
 * Aucun déploiement n'est déclenché : on purge seulement le cache CDN de
 * /api/reglages, et les visiteuses voient le changement à la page suivante.
 */
import { purgeCache } from '@netlify/functions';
import { json, erreur, origineAcceptee } from '../lib/reponses.mjs';
import { sessionValide } from '../lib/session.mjs';
import {
  lireActuel, lireHistorique, lirePrive, appliquerChangements, enregistrer, enregistrerPrive,
  annulerDernier, validerDonneesPrivees, estErreurSaisie,
} from '../lib/reglages.mjs';

const TAILLE_MAX = 200 * 1024;

async function purger() {
  try {
    await purgeCache({ tags: ['reglages'] });
    return true;
  } catch (e) {
    // Hors Netlify (essais locaux) : pas de cache à purger. En production,
    // le cache expire de lui-même en 5 minutes au plus.
    console.warn('purge du cache impossible :', e?.message);
    return false;
  }
}

async function etat(doc) {
  return { reglages: doc ?? (await lireActuel()), prive: await lirePrive(), versionsPrecedentes: (await lireHistorique()).length };
}

export default async (req) => {
  if (!sessionValide(req)) return erreur('Votre session a expiré. Reconnectez-vous.', 401);
  if (req.method === 'GET') return json(await etat());
  if (!origineAcceptee(req)) return erreur('Requête refusée.', 403);
  if (req.method !== 'PUT' && req.method !== 'POST') return erreur('Méthode non autorisée.', 405);

  const brut = await req.text();
  if (brut.length > TAILLE_MAX) return erreur('Trop de données envoyées d’un coup.', 413);
  let corps;
  try { corps = JSON.parse(brut); } catch { return erreur('Requête illisible.', 400); }

  const actuel = await lireActuel();
  if (corps?.base !== actuel.version) {
    return erreur('Vos réglages ont été modifiés depuis un autre appareil. Rechargez la page pour repartir de la dernière version.', 409);
  }

  if (req.method === 'POST') {
    if (corps.action !== 'annuler') return erreur('Action inconnue.', 400);
    const doc = await annulerDernier(actuel);
    if (!doc) return erreur('Il n’y a aucune modification à annuler.', 409);
    const purge = await purger();
    return json({ ...(await etat(doc)), purge });
  }

  let suivant, prive;
  try {
    suivant = appliquerChangements(actuel, corps.changements ?? {});
    if (corps.prive !== undefined) prive = validerDonneesPrivees(corps.prive);
  } catch (e) {
    if (estErreurSaisie(e)) return erreur(e.message, 422);
    return erreur('Requête illisible.', 400);
  }
  if (prive) await enregistrerPrive(prive);
  const doc = await enregistrer(actuel, suivant);
  const purge = await purger();
  return json({ ...(await etat(doc)), purge });
};

export const config = { path: '/api/admin/reglages', method: ['GET', 'PUT', 'POST'] };
