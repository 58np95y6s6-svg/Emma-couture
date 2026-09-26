/**
 * Prépare les visuels des maquettes. Tout est dérivé de src/assets/creations/
 * (produit par scripts/traiter-photos.mjs) : rien n'est versionné.
 *
 *   node scripts/preparer-maquette.mjs
 *
 * À relancer après un `git clone` pour pouvoir ouvrir les maquettes en local.
 *
 * 1. docs/img/               — visuels de docs/pistes-visuelles.html
 * 2. docs/maquette-prenom/img/ — visuels de la page d'accueil, AVEC leurs
 *    déclinaisons responsives (`<nom>-320w.webp`, `-480w.webp`, …). Le srcset
 *    de docs/maquette-prenom/index.html pointe sur ces fichiers : sans eux, la
 *    page charge des images trop lourdes, voire n'en charge aucune.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RACINE = path.resolve(import.meta.dirname, '..');
const DEPUIS = path.join(RACINE, 'src', 'assets', 'creations');
const VERS = path.join(RACINE, 'docs', 'img');

/** nom court dans la maquette → chemin sous src/assets/creations/ */
const VISUELS = {
  'machine-large': 'hero-large/machine-a-broder-en-cours-atelier-vitre',
  bobines: 'bandeau/atelier-mur-bobines-fil-broderie-vitre',
  doudou: 'galerie/doudou-lapin-brode-prenom-naissance-vitre',
  'cadre-naissance': 'galerie/cadre-naissance-brode-prenom-chambre-bebe',
  serviette: 'galerie/serviette-brodee-prenom-alicia-rose',
  'arbre-de-vie': 'galerie/arbre-de-vie-brode-dentelle-ajouree-fil-dore',
  portrait: 'galerie/emma-brodeuse-vitre-portrait',
  trousse: 'galerie/trousse-cousue-main-brodee-prenom-lisa',
  tambour: 'galerie/tambour-decoratif-brode-fee-rouge',
  'sac-banane': 'galerie/sac-banane-cousu-main-broderie-chats',
  'arbre-detail': 'detail/arbre-de-vie-brode-dentelle-ajouree-fil-dore',
  'papillon-detail': 'detail/papillon-brode-dentelle-ajouree-coquelicots',
};

fs.mkdirSync(VERS, { recursive: true });

for (const [court, source] of Object.entries(VISUELS)) {
  const entree = path.join(DEPUIS, `${source}.webp`);
  if (!fs.existsSync(entree)) {
    console.error(`manquant : ${source}.webp — lancez d'abord scripts/traiter-photos.mjs`);
    process.exitCode = 1;
    continue;
  }
  fs.copyFileSync(entree, path.join(VERS, `${court}.webp`));
}

console.log(`${Object.keys(VISUELS).length} visuels copiés dans docs/img/`);


/* =============================================================================
   2. MAQUETTE PAGE D'ACCUEIL — visuels + déclinaisons responsives

   La bande passante est facturée sur les 300 crédits Netlify mensuels
   (20 crédits le Go) : servir un fichier de 2400 px à un téléphone de 390 px
   coûte de l'argent, pas seulement des millisecondes. Chaque visuel est donc
   décliné, et index.html choisit la bonne largeur via srcset/sizes.
============================================================================= */
const VERS_PRENOM = path.join(RACINE, 'docs', 'maquette-prenom', 'img');

const VISUELS_PRENOM = {
  portrait: 'hero-mobile/emma-brodeuse-vitre-portrait',
  'portrait-carre': 'detail/emma-brodeuse-vitre-portrait',
  doudou: 'galerie/doudou-lapin-brode-prenom-naissance-vitre',
  'doudou-plat': 'galerie/doudou-plat-brode-prenom-keanu-naissance',
  serviette: 'galerie/serviette-brodee-prenom-alicia-rose',
  'cadre-naissance': 'galerie/cadre-naissance-brode-prenom-chambre-bebe',
  trousse: 'galerie/trousse-cousue-main-brodee-prenom-lisa',
  'sac-a-dos': 'galerie/sac-a-dos-enfant-brode-prenom-malo',
  'sac-banane': 'galerie/sac-banane-cousu-main-broderie-chats',
  'chaussette-noel': 'galerie/chaussette-de-noel-brodee-prenom',
  tambour: 'galerie/tambour-decoratif-brode-fee-rouge',
  'arbre-de-vie': 'galerie/arbre-de-vie-brode-dentelle-ajouree-fil-dore',
  papillon: 'galerie/papillon-brode-dentelle-ajouree-coquelicots',
  bobines: 'bandeau/atelier-mur-bobines-fil-broderie-vitre',
  'bobines-bandeau': 'bandeau/atelier-mur-bobines-fil-broderie-vitre',
  'machine-carre': 'detail/machine-a-broder-en-cours-atelier-vitre',
  'machine-large': 'hero-large/machine-a-broder-en-cours-atelier-vitre',
  'machine-plein-ecran': 'plein-ecran/machine-a-broder-en-cours-atelier-vitre',
  'papillon-detail': 'detail/papillon-brode-dentelle-ajouree-coquelicots',
  'arbre-detail': 'detail/arbre-de-vie-brode-dentelle-ajouree-fil-dore',
  'papillon-plein-ecran': 'plein-ecran/papillon-brode-dentelle-ajouree-coquelicots',
  'arbre-plein-ecran': 'plein-ecran/arbre-de-vie-brode-dentelle-ajouree-fil-dore',
  'sac-banane-plein-ecran': 'plein-ecran/sac-banane-cousu-main-broderie-chats',
  'tambour-plein-ecran': 'plein-ecran/tambour-decoratif-brode-fee-rouge',
};

/** Échelle de largeurs. Une déclinaison n'est produite que si elle est
 *  nettement plus petite que l'original : jamais d'agrandissement, jamais de
 *  quasi-doublon. Doit rester alignée sur les srcset de index.html. */
const ECHELLE = [320, 480, 620, 800, 1000, 1400, 2000];

/** Au-delà, un fichier mérite d'être réencodé ou recadré : une photo de
 *  1000 px qui pèse 600 Ko est un accident d'encodage, pas une fatalité. */
const BUDGET_OCTETS = 260 * 1024;

fs.mkdirSync(VERS_PRENOM, { recursive: true });
let produits = 0;
const trop_lourds = [];

for (const [court, source] of Object.entries(VISUELS_PRENOM)) {
  const entree = path.join(DEPUIS, `${source}.webp`);
  if (!fs.existsSync(entree)) {
    console.error(`manquant : ${source}.webp — lancez d'abord scripts/traiter-photos.mjs`);
    process.exitCode = 1;
    continue;
  }
  fs.copyFileSync(entree, path.join(VERS_PRENOM, `${court}.webp`));

  const meta = await sharp(entree).metadata();
  const poids = fs.statSync(entree).size;
  if (poids > BUDGET_OCTETS) trop_lourds.push([court, meta.width, Math.round(poids / 1024)]);

  for (const largeur of ECHELLE) {
    if (largeur >= meta.width * 0.9) continue;
    const sortie = path.join(VERS_PRENOM, `${court}-${largeur}w.webp`);
    await sharp(entree).resize({ width: largeur }).webp({ quality: 78, effort: 5 }).toFile(sortie);
    produits++;
  }
}

console.log(`${Object.keys(VISUELS_PRENOM).length} visuels + ${produits} déclinaisons dans docs/maquette-prenom/img/`);
if (trop_lourds.length) {
  console.warn(`\n⚠ ${trop_lourds.length} fichiers dépassent ${Math.round(BUDGET_OCTETS / 1024)} Ko :`);
  for (const [n, w, ko] of trop_lourds) console.warn(`   ${n} — ${w} px, ${ko} Ko`);
  console.warn('   Réencoder ou recadrer : c\'est de la bande passante facturée.');
}
