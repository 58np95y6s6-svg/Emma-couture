/** POST /api/connexion — { motDePasse } → cookie de session (30 jours). */
import { json, erreur, origineAcceptee } from '../lib/reponses.mjs';
import { configurationPresente, hachageConfigure, verifierMotDePasse, creerJeton, cookieSession } from '../lib/session.mjs';
import { ipDe, attenteAvantEssai, noterEchec, effacerEchecs } from '../lib/tentatives.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') return erreur('Méthode non autorisée.', 405);
  if (!origineAcceptee(req)) return erreur('Requête refusée.', 403);
  if (!configurationPresente())
    return erreur("L'atelier n'est pas encore configuré : le mot de passe n'a pas été enregistré dans Netlify.", 503);

  const ip = ipDe(req, context);
  const attente = await attenteAvantEssai(ip);
  if (attente) {
    return erreur(`Trop d'essais. Par sécurité, attendez ${attente} minute${attente > 1 ? 's' : ''} avant de réessayer.`, 429, {
      'Retry-After': String(attente * 60),
    });
  }

  let motDePasse = '';
  try {
    motDePasse = String((await req.json())?.motDePasse ?? '');
  } catch {
    return erreur('Requête illisible.', 400);
  }
  if (!motDePasse || motDePasse.length > 200 || !verifierMotDePasse(motDePasse, hachageConfigure())) {
    const restants = await noterEchec(ip);
    const suite = restants
      ? `Il vous reste ${restants} essai${restants > 1 ? 's' : ''}.`
      : 'Par sécurité, attendez 15 minutes avant de réessayer.';
    return json({ erreur: `Ce n'est pas le bon mot de passe. ${suite}`, essaisRestants: restants }, restants ? 401 : 429);
  }

  await effacerEchecs(ip);
  return json({ connectee: true }, 200, { 'Set-Cookie': cookieSession(creerJeton()) });
};

export const config = { path: '/api/connexion', method: 'POST' };
