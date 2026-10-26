/**
 * Contrôle des photos envoyées depuis l'admin.
 *
 * Le navigateur d'Emmanuelle recompresse chaque photo (canvas → WebP, ou
 * JPEG sur les iPhone dont Safari ne sait pas produire de WebP). Cette
 * recompression supprime toutes les métadonnées, dont la position GPS.
 * Ici, on vérifie que c'est bien le cas : le fichier doit être un vrai WebP
 * ou JPEG (signature binaire, pas seulement l'extension), sans bloc EXIF ni
 * XMP, d'au plus 1600 px de large et 1,5 Mo.
 */
export const TAILLE_MAX = 1.5 * 1024 * 1024;
export const LARGEUR_MAX = 1600;

/** Renvoie { type, largeur, hauteur } ou lève une erreur en français. */
export function analyserImage(octets) {
  const b = Buffer.from(octets);
  if (b.length < 32) throw new Error('Le fichier est vide ou abîmé.');
  if (b.length > TAILLE_MAX) throw new Error('La photo est trop lourde (1,5 Mo au maximum).');

  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return analyserWebp(b);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return analyserJpeg(b);
  throw new Error('Ce fichier n’est pas une photo au bon format. Choisissez une photo depuis votre téléphone.');
}

function analyserWebp(b) {
  let largeur = 0, hauteur = 0;
  let pos = 12;
  while (pos + 8 <= b.length) {
    const id = b.toString('latin1', pos, pos + 4);
    const taille = b.readUInt32LE(pos + 4);
    const d = pos + 8;
    if (id === 'EXIF' || id === 'XMP ') throw new Error('La photo contient encore des informations cachées (position, appareil). Envoyez-la à nouveau depuis l’atelier.');
    if (id === 'VP8X' && !largeur) {
      largeur = 1 + b.readUIntLE(d + 4, 3);
      hauteur = 1 + b.readUIntLE(d + 7, 3);
    } else if (id === 'VP8 ' && !largeur) {
      largeur = b.readUInt16LE(d + 6) & 0x3fff;
      hauteur = b.readUInt16LE(d + 8) & 0x3fff;
    } else if (id === 'VP8L' && !largeur) {
      const bits = b.readUInt32LE(d + 1);
      largeur = (bits & 0x3fff) + 1;
      hauteur = ((bits >> 14) & 0x3fff) + 1;
    }
    pos = d + taille + (taille % 2);
  }
  return verifierDimensions('image/webp', largeur, hauteur);
}

function analyserJpeg(b) {
  let largeur = 0, hauteur = 0;
  let pos = 2;
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) { pos++; continue; }
    const marqueur = b[pos + 1];
    if (marqueur === 0xd8 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) { pos += 2; continue; }
    if (marqueur === 0xda || marqueur === 0xd9) break; // début des données d'image
    const longueur = b.readUInt16BE(pos + 2);
    if (marqueur === 0xe1) {
      const entete = b.toString('latin1', pos + 4, pos + 4 + 29);
      if (entete.startsWith('Exif') || entete.startsWith('http://ns.adobe.com/xap'))
        throw new Error('La photo contient encore des informations cachées (position, appareil). Envoyez-la à nouveau depuis l’atelier.');
    }
    if ([0xc0, 0xc1, 0xc2].includes(marqueur)) {
      hauteur = b.readUInt16BE(pos + 5);
      largeur = b.readUInt16BE(pos + 7);
    }
    pos += 2 + longueur;
  }
  return verifierDimensions('image/jpeg', largeur, hauteur);
}

function verifierDimensions(type, largeur, hauteur) {
  if (!largeur || !hauteur) throw new Error('Impossible de lire les dimensions de la photo.');
  if (largeur > LARGEUR_MAX) throw new Error(`La photo est trop grande (${largeur} px de large, ${LARGEUR_MAX} au maximum).`);
  if (largeur < 200 || hauteur < 200) throw new Error('La photo est trop petite pour être affichée sur le site.');
  return { type, largeur, hauteur };
}
