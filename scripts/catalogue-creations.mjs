/**
 * Liste des créations pour les fonctions Netlify (netlify/lib/catalogue.json).
 *
 * Les fonctions de l'admin refusent tout réglage visant une création qui
 * n'existe pas. Elles n'ont pas accès aux Content Collections d'Astro : ce
 * script, lancé automatiquement avant chaque build (« prebuild »), leur
 * fournit la liste des identifiants et des titres.
 *
 * Usage : node scripts/catalogue-creations.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dossier = path.join(racine, 'src/content/creations');
const sortie = path.join(racine, 'netlify/lib/catalogue.json');

const fichiers = (await readdir(dossier)).filter((f) => f.endsWith('.md')).sort();
const creations = [];
for (const f of fichiers) {
  const texte = await readFile(path.join(dossier, f), 'utf8');
  const entete = texte.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const titre = entete.match(/^titre:\s*["']?(.*?)["']?\s*$/m)?.[1] ?? '';
  creations.push({ slug: f.replace(/\.md$/, ''), titre });
}
await writeFile(sortie, JSON.stringify({ creations }, null, 2) + '\n');
console.log(`catalogue : ${creations.length} créations → ${path.relative(racine, sortie)}`);
