/**
 * Préparation d'une photo dans le navigateur, avant envoi.
 *
 * La photo est redessinée sur un canvas puis réencodée : cela supprime
 * TOUTES les métadonnées (position GPS du domicile, modèle du téléphone…).
 * Deux tailles : 1600 px et 800 px de large au plus, WebP qualité 0,82.
 * Safari (iPhone) ne sait pas produire de WebP : on bascule alors en JPEG,
 * sans métadonnées non plus. Le serveur revérifie tout.
 */
import { appel, ErreurAtelier } from './api.js';

const QUALITE = 0.82;
const POIDS_MAX = 1.5 * 1024 * 1024;

async function decoder(fichier) {
  if (!/^image\//.test(fichier.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(fichier.name))
    throw new ErreurAtelier('Ce fichier n’est pas une photo. Choisissez une photo dans votre galerie.');
  try {
    return await createImageBitmap(fichier, { imageOrientation: 'from-image' });
  } catch {
    // Repli : certains navigateurs refusent createImageBitmap sur des JPEG d'iPhone.
    const url = URL.createObjectURL(fichier);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new ErreurAtelier('Cette photo ne peut pas être ouverte. Essayez-en une autre, ou faites une capture d’écran de la photo.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function encoder(source, largeurMax) {
  const l0 = source.width, h0 = source.height;
  const largeur = Math.min(largeurMax, l0);
  const hauteur = Math.round((h0 * largeur) / l0);
  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, largeur, hauteur);
  const versBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
  return (async () => {
    for (const q of [QUALITE, 0.72, 0.62]) {
      let blob = await versBlob('image/webp', q);
      if (!blob || blob.type !== 'image/webp') blob = await versBlob('image/jpeg', q + 0.04);
      if (blob && blob.size <= POIDS_MAX) return { blob, largeur, hauteur };
    }
    throw new ErreurAtelier('Cette photo est trop lourde, même compressée. Essayez-en une autre.');
  })();
}

/** Fichier choisi → { grande, petite, largeur, hauteur, apercu (URL locale) } */
export async function preparerPhoto(fichier) {
  const source = await decoder(fichier);
  if (source.width < 400 || source.height < 400)
    throw new ErreurAtelier('Cette photo est trop petite pour le site (400 pixels au minimum). Choisissez l’original plutôt qu’une miniature.');
  const grande = await encoder(source, 1600);
  const petite = await encoder(source, 800);
  source.close?.();
  return { ...grande, grande: grande.blob, petite: petite.blob, apercu: URL.createObjectURL(petite.blob) };
}

/** Envoie les deux tailles ; renvoie { grande, petite, largeur, hauteur } (URL /api/image/…). */
export async function envoyerPhoto(preparee) {
  const ext = preparee.grande.type === 'image/webp' ? 'webp' : 'jpg';
  const fd = new FormData();
  fd.set('grande', preparee.grande, `grande.${ext}`);
  fd.set('petite', preparee.petite, `petite.${ext}`);
  return appel('/api/admin/photo', { methode: 'POST', formulaire: fd });
}
