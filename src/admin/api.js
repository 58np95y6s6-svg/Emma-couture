/**
 * Appels aux fonctions de l'atelier, avec des messages d'erreur lisibles.
 * Une session expirée ne fait rien perdre : on réaffiche l'écran de
 * connexion par-dessus la page, puis Emmanuelle relance son enregistrement.
 */
export class ErreurAtelier extends Error {
  constructor(message, statut = 0) {
    super(message);
    this.statut = statut;
  }
}

export const HORS_LIGNE = 'Pas de connexion internet : vos modifications ne sont pas enregistrées. Réessayez quand la connexion sera revenue.';

export async function appel(chemin, { methode = 'GET', corps, formulaire } = {}) {
  if (!navigator.onLine) throw new ErreurAtelier(HORS_LIGNE);
  let rep;
  try {
    rep = await fetch(chemin, {
      method: methode,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: corps !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: formulaire ?? (corps !== undefined ? JSON.stringify(corps) : undefined),
    });
  } catch {
    throw new ErreurAtelier(navigator.onLine ? 'Le site ne répond pas. Réessayez dans un instant.' : HORS_LIGNE);
  }
  let donnees = null;
  try { donnees = await rep.json(); } catch { /* réponse vide */ }
  if (rep.status === 401 && chemin !== '/api/connexion') {
    document.dispatchEvent(new CustomEvent('atelier:session-expiree'));
  }
  if (!rep.ok) {
    throw new ErreurAtelier(donnees?.erreur ?? `Un problème est survenu (code ${rep.status}). Réessayez dans un instant.`, rep.status);
  }
  return donnees;
}
