/**
 * Traitement reproductible des photos sélectionnées.
 *
 *   node scripts/traiter-photos.mjs
 *
 * - lit la sélection décrite dans SELECTION ci-dessous ;
 * - convertit (HEIC via `sips`, macOS), recadre selon la direction artistique,
 *   corrige légèrement l'exposition, encode en WebP ;
 * - supprime SYSTÉMATIQUEMENT toutes les métadonnées EXIF (dont GPS) :
 *   c'est le comportement par défaut de sharp, on ne le réactive jamais ;
 * - écrit un journal des retouches dans docs/journal-retouches.json.
 *
 * Les couleurs des fils et des tissus doivent rester fidèles : on se limite à
 * une correction d'exposition douce et à un accentuation de netteté légère.
 * Aucune saturation, aucune balance des blancs automatique agressive.
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RACINE = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(RACINE, 'photos-originales', '00-vrac-initial');
const SORTIE = path.join(RACINE, 'src', 'assets', 'creations');
const TEMPO = fs.mkdtempSync(path.join(os.tmpdir(), 'broderie-'));

/** Formats de sortie, d'après CLAUDE.md § Photos. */
const FORMATS = {
  'hero-large': { largeur: 1920, hauteur: 1080 }, // 16:9 ordinateur
  'hero-mobile': { largeur: 1000, hauteur: 1250 }, // 4:5 mobile
  galerie: { largeur: 1000, hauteur: 1250 }, // 4:5
  detail: { largeur: 1000, hauteur: 1000 }, // 1:1
  og: { largeur: 1200, hauteur: 630 }, // partage réseaux
};

/**
 * `position` suit la syntaxe de sharp : où garder le sujet quand on recadre.
 * `luminosite` : 1 = inchangé. On reste entre 0.95 et 1.15.
 * `extraire` (optionnel) : sous-cadre exprimé en fractions de l'image d'origine,
 *   appliqué AVANT le redimensionnement. Sert à isoler un sujet.
 */
const SELECTION = [
  {
    num: '007',
    fichier: 'Afficher les photos récentes.PNG',
    nom: 'emma-brodeuse-vitre-portrait',
    formats: ['hero-mobile', 'galerie', 'detail', 'og'],
    position: 'north',
    luminosite: 1.06,
    alt: "Emma, brodeuse à Vitré, souriante, cheveux longs et lunettes, devant un bord de mer",
    categorie: 'atelier',
  },
  {
    num: '011',
    fichier: 'IMG_0184.HEIC',
    nom: 'atelier-mur-bobines-fil-broderie-vitre',
    formats: ['hero-large', 'galerie', 'detail', 'og'],
    position: 'centre',
    luminosite: 1.08,
    // On isole le mur de bobines : la partie haute de la photo, sans la serviette.
    extraire: { gauche: 0, haut: 0, largeur: 1, hauteur: 0.155 },
    alt: "Mur de l'atelier couvert de centaines de bobines de fil à broder de toutes les couleurs, rangées sur des étagères",
    categorie: 'atelier',
  },
  {
    num: '036',
    fichier: 'IMG_3089.HEIC',
    nom: 'machine-a-broder-en-cours-atelier-vitre',
    formats: ['galerie', 'detail', 'hero-large'],
    position: 'centre',
    luminosite: 1.05,
    alt: "Broderie en cours sous la tête de la machine : un paysage de cerisiers en fleurs et un colibri en fil de couleur sur toile blanche",
    categorie: 'atelier',
  },
  {
    num: '003',
    fichier: '5E31CC2B-5EB9-4D53-A5EB-602E0ACC1485.PNG',
    nom: 'doudou-lapin-brode-prenom-naissance-vitre',
    formats: ['hero-large', 'hero-mobile', 'galerie', 'og'],
    position: 'north',
    luminosite: 1.02,
    alt: "Doudou lapin en peluche beige, brodé au prénom Aliza et à la date de naissance sur les oreilles, posé devant un bouquet de roses blanches",
    categorie: 'naissance',
  },
  {
    num: '048',
    fichier: 'IMG_3675.JPG',
    nom: 'cadre-naissance-brode-prenom-chambre-bebe',
    formats: ['galerie', 'detail'],
    position: 'centre',
    luminosite: 1.04,
    alt: "Cadre de naissance brodé au prénom Ambre avec date, taille et poids, accroché dans une chambre de bébé rose",
    categorie: 'naissance',
  },
  {
    num: '052',
    fichier: 'IMG_3763.HEIC',
    nom: 'arbre-de-vie-brode-dentelle-ajouree-fil-dore',
    formats: ['galerie', 'detail'],
    position: 'centre',
    luminosite: 1.06,
    alt: "Arbre de vie brodé en dentelle ajourée fil doré, pièce autoportante sans support tissu, sur fond noir",
    categorie: 'decoration',
  },
  {
    num: '079',
    fichier: 'IMG_6856.HEIC',
    nom: 'papillon-brode-dentelle-ajouree-coquelicots',
    formats: ['galerie', 'detail'],
    position: 'centre',
    luminosite: 1.0,
    alt: "Papillon brodé en relief aux ailes rouges et noires, surmonté de coquelicots brodés, posé sur un feuillage",
    categorie: 'decoration',
  },
  {
    num: '049',
    fichier: 'IMG_3679.HEIC',
    nom: 'sac-banane-cousu-main-broderie-chats',
    formats: ['galerie', 'detail'],
    position: 'centre',
    luminosite: 1.03,
    alt: "Sac banane en suédine jaune moutarde, cousu main, brodé de trois chats gris",
    categorie: 'couture',
  },
  {
    num: '084',
    fichier: 'IMG_7210.JPG',
    nom: 'sac-a-dos-enfant-brode-prenom-malo',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.03,
    alt: "Sac à dos d'enfant en simili bleu marine, brodé au prénom Malo entouré d'étoiles",
    categorie: 'enfant',
  },
  {
    num: '039',
    fichier: 'IMG_3203.HEIC',
    nom: 'serviette-brodee-prenom-alicia-rose',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.05,
    alt: "Drap de bain rose poudré brodé au prénom Alicia en lettres cursives violettes",
    categorie: 'linge',
  },
  {
    num: '092',
    fichier: 'IMG_9336.HEIC',
    nom: 'chaussette-de-noel-brodee-prenom',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.04,
    alt: "Chaussette de Noël rouge bordée de fourrure blanche, brodée au prénom Aïdan et à un motif de canne à sucre",
    categorie: 'noel',
  },
  {
    num: '100',
    fichier: 'IMG_9938.HEIC',
    nom: 'trousse-cousue-main-brodee-prenom-lisa',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.02,
    alt: "Trousse en tissu fleuri bleu et blanc, cousue main, brodée au prénom Lisa en fil doré",
    categorie: 'couture',
  },
  {
    num: '020',
    fichier: 'IMG_0845.HEIC',
    nom: 'tambour-decoratif-brode-fee-rouge',
    formats: ['galerie', 'detail'],
    position: 'centre',
    luminosite: 1.03,
    alt: "Tambour décoratif brodé d'une fée rouge tendant la main à un oiseau, posé sur une planche en bois à côté d'une plante grasse",
    categorie: 'decoration',
  },
  {
    num: '087',
    fichier: 'IMG_8652.HEIC',
    nom: 'doudou-plat-brode-prenom-keanu-naissance',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.04,
    alt: "Doudou plat blanc à tête d'ours gris, brodé au prénom Keanu",
    categorie: 'naissance',
  },
  {
    num: '018',
    fichier: 'IMG_0425.HEIC',
    nom: 'sac-de-sport-cousu-brode-baskets',
    formats: ['galerie'],
    position: 'centre',
    luminosite: 1.02,
    alt: "Grand sac de sport en jean et simili bleu, cousu main, brodé de plusieurs paires de baskets colorées",
    categorie: 'couture',
  },
];

function chargerEnJpeg(fichier) {
  const entree = path.join(SOURCE, fichier);
  if (!fs.existsSync(entree)) throw new Error(`introuvable : ${entree}`);
  // sharp ne décode pas le HEIC : on passe par sips (fourni avec macOS).
  if (/\.heic$/i.test(fichier)) {
    const sortie = path.join(TEMPO, `${path.parse(fichier).name}.jpg`);
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', entree, '--out', sortie], {
      stdio: 'ignore',
    });
    return sortie;
  }
  return entree;
}

const journal = [];

for (const photo of SELECTION) {
  const source = chargerEnJpeg(photo.fichier);
  const meta = await sharp(source).metadata();

  for (const nomFormat of photo.formats) {
    const { largeur, hauteur } = FORMATS[nomFormat];
    const destination = path.join(SORTIE, nomFormat);
    fs.mkdirSync(destination, { recursive: true });
    const fichierSortie = path.join(destination, `${photo.nom}.webp`);

    let image = sharp(source).rotate(); // redresse selon l'EXIF, qui est ensuite abandonné

    if (photo.extraire) {
      // On matérialise la rotation avant de mesurer : sinon `metadata()` rend
      // les dimensions d'avant redressement et le sous-cadre tombe à côté.
      const redresse = await image.toBuffer();
      const { width, height } = await sharp(redresse).metadata();
      image = sharp(redresse);
      const e = photo.extraire;
      image = image.extract({
        left: Math.round(e.gauche * width),
        top: Math.round(e.haut * height),
        width: Math.round(e.largeur * width),
        height: Math.round(e.hauteur * height),
      });
    }

    await image
      .resize(largeur, hauteur, {
        fit: 'cover',
        position: photo.position === 'centre' ? 'centre' : photo.position,
      })
      .modulate({ brightness: photo.luminosite })
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 82, effort: 5 })
      .toFile(fichierSortie);

    journal.push({
      numero: photo.num,
      original: photo.fichier,
      dimensionsOrigine: `${meta.width}x${meta.height}`,
      format: nomFormat,
      sortie: path.relative(RACINE, fichierSortie),
      retouches: {
        recadrage: `${largeur}x${hauteur} (${photo.position})`,
        luminosite: photo.luminosite,
        nettete: 'sigma 0.6',
        metadonnees: 'supprimées (EXIF et GPS compris)',
      },
      alt: photo.alt,
      categorie: photo.categorie,
    });
  }
  console.log(`✓ ${photo.num} → ${photo.nom}`);
}

fs.mkdirSync(path.join(RACINE, 'docs'), { recursive: true });
fs.writeFileSync(
  path.join(RACINE, 'docs', 'journal-retouches.json'),
  JSON.stringify(journal, null, 2) + '\n',
);
fs.rmSync(TEMPO, { recursive: true, force: true });
console.log(`\n${journal.length} fichiers écrits dans src/assets/creations/`);
console.log('Journal : docs/journal-retouches.json');
