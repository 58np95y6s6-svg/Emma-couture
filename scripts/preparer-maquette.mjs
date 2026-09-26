/**
 * Recopie sous docs/img/ les visuels utilisés par docs/pistes-visuelles.html,
 * sous des noms courts. Ces fichiers sont dérivés de src/assets/creations/
 * (produit par scripts/traiter-photos.mjs) : ils ne sont donc pas versionnés.
 *
 *   node scripts/preparer-maquette.mjs
 *
 * À relancer après un `git clone` pour pouvoir ouvrir la maquette en local.
 */
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..');
const DEPUIS = path.join(RACINE, 'src', 'assets', 'creations');
const VERS = path.join(RACINE, 'docs', 'img');

/** nom court dans la maquette → chemin sous src/assets/creations/ */
const VISUELS = {
  'machine-large': 'hero-large/machine-a-broder-en-cours-atelier-vitre',
  bobines: 'hero-large/atelier-mur-bobines-fil-broderie-vitre',
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
