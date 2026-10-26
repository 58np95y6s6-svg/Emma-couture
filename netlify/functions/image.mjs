/**
 * GET /api/image/<empreinte>-<taille>.<webp|jpg> — public.
 * Sert une photo envoyée depuis l'admin. Le nom contient l'empreinte du
 * contenu : il ne change jamais, d'où un cache d'un an (navigateur et CDN).
 */
import { MAGASINS, magasin } from '../lib/stockage.mjs';

const MOTIF = /^[a-f0-9]{24}-(1600|800)\.(webp|jpg)$/;

export default async (req, context) => {
  const cle = context?.params?.cle ?? new URL(req.url).pathname.split('/').pop();
  if (!MOTIF.test(cle)) return new Response('Introuvable', { status: 404 });
  const resultat = await magasin(MAGASINS.images, { fort: false }).getWithMetadata(cle, { type: 'arrayBuffer' });
  if (!resultat) return new Response('Introuvable', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  const longue = 'public, max-age=31536000, immutable';
  return new Response(resultat.data, {
    headers: {
      'Content-Type': resultat.metadata?.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp',
      'Cache-Control': longue,
      'Netlify-CDN-Cache-Control': longue,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export const config = { path: '/api/image/:cle', method: 'GET' };
