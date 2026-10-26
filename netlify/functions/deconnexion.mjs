/** POST /api/deconnexion — efface le cookie de session. */
import { json, erreur, origineAcceptee } from '../lib/reponses.mjs';
import { cookieEffacement } from '../lib/session.mjs';

export default async (req) => {
  if (req.method !== 'POST') return erreur('Méthode non autorisée.', 405);
  if (!origineAcceptee(req)) return erreur('Requête refusée.', 403);
  return json({ connectee: false }, 200, { 'Set-Cookie': cookieEffacement() });
};

export const config = { path: '/api/deconnexion', method: 'POST' };
