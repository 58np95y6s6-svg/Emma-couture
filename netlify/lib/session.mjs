/**
 * Mot de passe et session de l'admin.
 *
 * - Mot de passe : hachage scrypt stocké dans la variable d'environnement
 *   ADMIN_MOT_DE_PASSE_HASH, au format « scrypt$N$r$p$sel$empreinte »
 *   (sel et empreinte en base64url). Produit par `npm run mot-de-passe`.
 * - Session : cookie « atelier_session » = « expiration.nonce.signature »,
 *   signé HMAC-SHA256 avec ADMIN_SECRET_SESSION. HttpOnly, Secure,
 *   SameSite=Strict, Path=/, 30 jours. Changer ADMIN_SECRET_SESSION dans
 *   Netlify déconnecte tous les appareils d'un coup.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const NOM_COOKIE = 'atelier_session';
export const DUREE_SESSION_S = 30 * 24 * 3600;

const env = (nom) => (globalThis.Netlify?.env?.get?.(nom) ?? process.env[nom] ?? '').trim();

/* ------------------------------------------------------------------ hachage */
export function hacherMotDePasse(motDePasse, { N = 16384, r = 8, p = 1 } = {}) {
  const sel = randomBytes(16);
  const empreinte = scryptSync(motDePasse.normalize('NFC'), sel, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', N, r, p, sel.toString('base64url'), empreinte.toString('base64url')].join('$');
}

export function verifierMotDePasse(motDePasse, hachage) {
  const morceaux = String(hachage || '').split('$');
  if (morceaux.length !== 6 || morceaux[0] !== 'scrypt') return false;
  const [, N, r, p, selB64, empreinteB64] = morceaux;
  const attendue = Buffer.from(empreinteB64, 'base64url');
  if (attendue.length < 32) return false;
  let calculee;
  try {
    calculee = scryptSync(String(motDePasse).normalize('NFC'), Buffer.from(selB64, 'base64url'), attendue.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
  } catch {
    return false;
  }
  return timingSafeEqual(calculee, attendue);
}

export function configurationPresente() {
  return Boolean(env('ADMIN_MOT_DE_PASSE_HASH')) && env('ADMIN_SECRET_SESSION').length >= 32;
}
export const hachageConfigure = () => env('ADMIN_MOT_DE_PASSE_HASH');

/* ------------------------------------------------------------------ session */
const signer = (texte) => createHmac('sha256', env('ADMIN_SECRET_SESSION')).update(texte).digest('base64url');

export function creerJeton(maintenant = Date.now()) {
  const expiration = Math.floor(maintenant / 1000) + DUREE_SESSION_S;
  const corps = `${expiration}.${randomBytes(12).toString('base64url')}`;
  return `${corps}.${signer(corps)}`;
}

export function jetonValide(jeton, maintenant = Date.now()) {
  if (!jeton || env('ADMIN_SECRET_SESSION').length < 32) return false;
  const morceaux = jeton.split('.');
  if (morceaux.length !== 3) return false;
  const [expiration, nonce, signature] = morceaux;
  if (!/^\d{9,11}$/.test(expiration) || !nonce) return false;
  const attendue = Buffer.from(signer(`${expiration}.${nonce}`));
  const recue = Buffer.from(signature);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return false;
  return Number(expiration) * 1000 > maintenant;
}

export function lireCookie(req, nom = NOM_COOKIE) {
  const brut = req.headers.get('cookie') || '';
  for (const morceau of brut.split(';')) {
    const i = morceau.indexOf('=');
    if (i > -1 && morceau.slice(0, i).trim() === nom) return decodeURIComponent(morceau.slice(i + 1).trim());
  }
  return '';
}

export const sessionValide = (req) => jetonValide(lireCookie(req));

export const cookieSession = (jeton) =>
  `${NOM_COOKIE}=${jeton}; Path=/; Max-Age=${DUREE_SESSION_S}; HttpOnly; Secure; SameSite=Strict`;

export const cookieEffacement = () => `${NOM_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
