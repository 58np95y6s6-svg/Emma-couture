/** Réponses JSON, toujours en français, jamais mises en cache. */
export function json(donnees, statut = 200, entetes = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...entetes,
    },
  });
}

export const erreur = (message, statut = 400, entetes = {}) => json({ erreur: message }, statut, entetes);

/**
 * Refuse une requête d'écriture venue d'un autre site. Le cookie est déjà en
 * SameSite=Strict ; ce contrôle de l'origine est une seconde ceinture.
 */
export function origineAcceptee(req) {
  const origine = req.headers.get('origin');
  if (!origine) return true; // navigateurs anciens, outils : le cookie Strict suffit
  try {
    return new URL(origine).host === new URL(req.url).host;
  } catch {
    return false;
  }
}
