/**
 * Crée le mot de passe de l'atelier (l'espace d'administration).
 *
 *   npm run mot-de-passe
 *
 * Demande le mot de passe deux fois (il ne s'affiche pas à l'écran), puis
 * affiche les deux valeurs à coller dans Netlify :
 *   Site configuration → Environment variables → Add a variable
 *     ADMIN_MOT_DE_PASSE_HASH  (le mot de passe « haché » : illisible, sans danger)
 *     ADMIN_SECRET_SESSION     (une clé aléatoire qui signe les connexions)
 * Le mot de passe lui-même n'est enregistré nulle part.
 * Pour déconnecter tous les appareils : relancer le script et remplacer
 * ADMIN_SECRET_SESSION.
 */
import { randomBytes } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { hacherMotDePasse, verifierMotDePasse } from '../netlify/lib/session.mjs';

function demanderCache(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    let saisie = '';
    const brut = stdin.isTTY;
    if (brut) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const lire = (morceau) => {
      for (const c of morceau) {
        if (c === '\r' || c === '\n' || c === '\u0004') {
          if (brut) stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', lire);
          stdout.write('\n');
          return resolve(saisie);
        }
        if (c === '\u0003') { stdout.write('\n'); process.exit(1); }
        if (c === '\u007f' || c === '\b') { saisie = saisie.slice(0, -1); continue; }
        saisie += c;
      }
    };
    stdin.on('data', lire);
  });
}

const premier = process.env.MOT_DE_PASSE ?? (await demanderCache('Mot de passe de l’atelier (12 caractères au moins) : '));
if (premier.length < 12) {
  console.error('\nTrop court : choisissez au moins 12 caractères (une petite phrase convient très bien).');
  process.exit(1);
}
const second = process.env.MOT_DE_PASSE ?? (await demanderCache('Retapez-le pour confirmer : '));
if (premier !== second) {
  console.error('\nLes deux saisies sont différentes. Recommencez.');
  process.exit(1);
}

const hachage = hacherMotDePasse(premier);
if (!verifierMotDePasse(premier, hachage)) throw new Error('vérification du hachage impossible');

console.log(`
À coller dans Netlify → Site configuration → Environment variables
(cochez « Contains secret values » ; portée : Functions).

  ADMIN_MOT_DE_PASSE_HASH
  ${hachage}

  ADMIN_SECRET_SESSION
  ${randomBytes(32).toString('base64url')}

Ensuite : Deploys → Trigger deploy (une seule fois), pour que les fonctions
lisent les nouvelles valeurs. Notez le mot de passe en lieu sûr : il n'est
enregistré nulle part et ne peut pas être retrouvé, seulement remplacé.
`);
