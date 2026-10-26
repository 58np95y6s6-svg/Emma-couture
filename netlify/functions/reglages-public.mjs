/**
 * GET /api/reglages — public, lu une fois par page par src/scripts/reglages.js.
 * Mis en cache au CDN 5 minutes (purgé à chaque enregistrement par le tag
 * « reglages »), servi périmé jusqu'à un jour si Blobs ne répond pas.
 * Ne contient que ce qui s'affiche : aucune donnée privée.
 */
import { lireActuel, versionPublique } from '../lib/reglages.mjs';

const CDN = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
  'Netlify-Cache-Tag': 'reglages',
  'X-Robots-Tag': 'noindex',
};

export default async () => {
  try {
    return new Response(JSON.stringify(versionPublique(await lireActuel())), { headers: CDN });
  } catch (e) {
    console.error('lecture des réglages impossible :', e?.message);
    // Le site retombe sur les valeurs du build ; on ne met pas l'erreur en cache.
    return new Response('{"erreur":"indisponible"}', { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/reglages', method: 'GET' };
