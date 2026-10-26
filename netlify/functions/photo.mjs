/**
 * POST /api/admin/photo — réservé à une session valide.
 * Corps : FormData { grande: Blob (≤ 1600 px), petite: Blob (≤ 800 px) }.
 * Réponse : { grande, petite, largeur, hauteur } (URL /api/image/…).
 *
 * Chaque fichier est vérifié par sa signature binaire (WebP, ou JPEG pour
 * les iPhone), sans métadonnées EXIF/XMP, 1,5 Mo au plus. Le nom de stockage
 * contient l'empreinte du contenu : l'image peut être mise en cache un an.
 */
import { createHash } from 'node:crypto';
import { json, erreur, origineAcceptee } from '../lib/reponses.mjs';
import { sessionValide } from '../lib/session.mjs';
import { analyserImage, TAILLE_MAX } from '../lib/images.mjs';
import { MAGASINS, magasin } from '../lib/stockage.mjs';

export default async (req) => {
  if (!sessionValide(req)) return erreur('Votre session a expiré. Reconnectez-vous.', 401);
  if (req.method !== 'POST') return erreur('Méthode non autorisée.', 405);
  if (!origineAcceptee(req)) return erreur('Requête refusée.', 403);
  const longueur = Number(req.headers.get('content-length') || 0);
  if (longueur > 2 * TAILLE_MAX + 64 * 1024) return erreur('La photo est trop lourde (1,5 Mo au maximum).', 413);

  let formulaire;
  try { formulaire = await req.formData(); } catch { return erreur('Envoi illisible. Réessayez.', 400); }

  const fichiers = {};
  for (const champ of ['grande', 'petite']) {
    const f = formulaire.get(champ);
    if (!f || typeof f === 'string') return erreur('Il manque une des deux tailles de la photo.', 400);
    if (f.size > TAILLE_MAX) return erreur('La photo est trop lourde (1,5 Mo au maximum).', 413);
    const octets = Buffer.from(await f.arrayBuffer());
    let infos;
    try { infos = analyserImage(octets); } catch (e) { return erreur(e.message, 415); }
    if (f.type && f.type !== infos.type) return erreur('Le type du fichier ne correspond pas à son contenu.', 415);
    if (champ === 'petite' && infos.largeur > 800) return erreur('La petite version doit faire 800 px de large au plus.', 422);
    fichiers[champ] = { octets, ...infos };
  }
  const { grande, petite } = fichiers;
  if (petite.largeur > grande.largeur) return erreur('Les deux tailles de la photo ne correspondent pas.', 422);

  const store = magasin(MAGASINS.images);
  const urls = {};
  for (const [champ, f] of Object.entries(fichiers)) {
    const empreinte = createHash('sha256').update(f.octets).digest('hex').slice(0, 24);
    const cle = `${empreinte}-${champ === 'grande' ? 1600 : 800}.${f.type === 'image/webp' ? 'webp' : 'jpg'}`;
    await store.set(cle, f.octets, { metadata: { type: f.type, largeur: f.largeur, hauteur: f.hauteur } });
    urls[champ] = `/api/image/${cle}`;
  }
  return json({ grande: urls.grande, petite: urls.petite, largeur: grande.largeur, hauteur: grande.hauteur }, 201);
};

export const config = { path: '/api/admin/photo', method: 'POST' };
