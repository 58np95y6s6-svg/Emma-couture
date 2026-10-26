/**
 * Banc d'essai des fonctions Netlify de l'atelier, sans compte Netlify.
 *
 *   npm run essai:fonctions
 *
 * Chaque fonction est importée et appelée avec de vraies `Request` ; Netlify
 * Blobs est remplacé par un magasin en mémoire (voir netlify/lib/stockage.mjs).
 * Ce banc ne vérifie PAS ce qui n'existe qu'une fois déployé : Blobs réel,
 * purge du cache CDN, cookie Secure sur HTTPS, IP réelle des visiteuses.
 */
import assert from 'node:assert/strict';
import sharp from 'sharp';

/* ------------------------------------------------ magasins en mémoire */
const magasins = new Map();
function magasinMemoire(nom) {
  if (!magasins.has(nom)) {
    const donnees = new Map();
    magasins.set(nom, {
      donnees,
      async get(cle, { type } = {}) {
        if (!donnees.has(cle)) return null;
        const { valeur } = donnees.get(cle);
        if (type === 'json') return JSON.parse(Buffer.from(valeur).toString());
        if (type === 'arrayBuffer') return Buffer.from(valeur).buffer;
        return Buffer.from(valeur).toString();
      },
      async getWithMetadata(cle, opts) {
        if (!donnees.has(cle)) return null;
        return { data: await this.get(cle, opts), metadata: donnees.get(cle).metadata };
      },
      async set(cle, valeur, { metadata } = {}) { donnees.set(cle, { valeur: Buffer.from(valeur), metadata }); },
      async setJSON(cle, valeur) { donnees.set(cle, { valeur: Buffer.from(JSON.stringify(valeur)) }); },
      async delete(cle) { donnees.delete(cle); },
    });
  }
  return magasins.get(nom);
}
globalThis.__magasinsEssai = magasinMemoire;

/* ------------------------------------------------ environnement */
const MOT_DE_PASSE = 'le fil rose de la bobine';
const { hacherMotDePasse } = await import('../netlify/lib/session.mjs');
process.env.ADMIN_MOT_DE_PASSE_HASH = hacherMotDePasse(MOT_DE_PASSE);
process.env.ADMIN_SECRET_SESSION = 'x'.repeat(48);

const f = async (nom) => (await import(`../netlify/functions/${nom}.mjs`)).default;
const connexion = await f('connexion');
const deconnexion = await f('deconnexion');
const session = await f('session');
const adminReglages = await f('admin-reglages');
const photo = await f('photo');
const image = await f('image');
const reglagesPublic = await f('reglages-public');

const BASE = 'https://atelier.example';
const req = (chemin, { methode = 'GET', corps, cookie, origine, entetes = {} } = {}) =>
  new Request(BASE + chemin, {
    method: methode,
    body: corps === undefined ? undefined : corps instanceof FormData ? corps : JSON.stringify(corps),
    headers: {
      ...(corps !== undefined && !(corps instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...(origine ? { origin: origine } : {}),
      ...entetes,
    },
  });
const ctx = (ip = '203.0.113.7', params = {}) => ({ ip, params });
const lire = async (r) => ({ statut: r.status, corps: await r.json().catch(() => null), r });

let n = 0;
const essai = async (nom, fn) => {
  await fn();
  n++;
  console.log(`  ✓ ${nom}`);
};

console.log('Connexion');
let cookie = '';
await essai('mauvais mot de passe → 401, 4 essais restants', async () => {
  const { statut, corps } = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: 'faux' } }), ctx()));
  assert.equal(statut, 401);
  assert.equal(corps.essaisRestants, 4);
  assert.match(corps.erreur, /Il vous reste 4 essais/);
});
await essai('bon mot de passe → cookie HttpOnly, Secure, SameSite=Strict, 30 jours', async () => {
  const { statut, r } = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: MOT_DE_PASSE } }), ctx()));
  assert.equal(statut, 200);
  const c = r.headers.get('set-cookie');
  assert.match(c, /^atelier_session=/);
  for (const attr of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=2592000']) assert.ok(c.includes(attr), attr);
  cookie = c.split(';')[0];
});
await essai('un succès efface les échecs précédents', async () => {
  const doc = await magasinMemoire('atelier-securite');
  assert.equal(doc.donnees.size, 0);
});
await essai('requête venue d’un autre site → 403', async () => {
  const { statut } = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: MOT_DE_PASSE }, origine: 'https://pirate.example' }), ctx()));
  assert.equal(statut, 403);
});
await essai('5 échecs → blocage 15 min, même avec le bon mot de passe', async () => {
  const ip = '198.51.100.9';
  for (let i = 0; i < 4; i++) await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: 'non' } }), ctx(ip));
  const cinquieme = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: 'non' } }), ctx(ip)));
  assert.equal(cinquieme.statut, 429);
  const bloque = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: MOT_DE_PASSE } }), ctx(ip)));
  assert.equal(bloque.statut, 429);
  assert.match(bloque.corps.erreur, /attendez 15 minutes/);
  assert.equal(bloque.r.headers.get('set-cookie'), null);
  const autreIp = await lire(await connexion(req('/api/connexion', { methode: 'POST', corps: { motDePasse: MOT_DE_PASSE } }), ctx('192.0.2.1')));
  assert.equal(autreIp.statut, 200, 'une autre IP n’est pas bloquée');
});
await essai('les IP ne sont pas stockées en clair', async () => {
  const cles = [...magasinMemoire('atelier-securite').donnees.keys()].join(' ');
  assert.ok(!cles.includes('198.51.100.9'));
});
await essai('session : connectée avec cookie, pas sans', async () => {
  assert.equal((await lire(await session(req('/api/session', { cookie })))).corps.connectee, true);
  assert.equal((await lire(await session(req('/api/session')))).corps.connectee, false);
});
await essai('déconnexion → cookie effacé (Max-Age=0)', async () => {
  const r = await deconnexion(req('/api/deconnexion', { methode: 'POST', cookie }));
  assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
});

console.log('Protection des données');
await essai('réglages sans cookie → 401', async () => {
  assert.equal((await adminReglages(req('/api/admin/reglages'))).status, 401);
});
await essai('cookie falsifié (signature modifiée) → 401', async () => {
  const [exp, nonce] = cookie.split('=')[1].split('.');
  const faux = `atelier_session=${exp}.${nonce}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
  assert.equal((await adminReglages(req('/api/admin/reglages', { cookie: faux }))).status, 401);
});
await essai('cookie à l’expiration rallongée → 401', async () => {
  const [, nonce, sig] = cookie.split('=')[1].split('.');
  const faux = `atelier_session=${Math.floor(Date.now() / 1000) + 9e7}.${nonce}.${sig}`;
  assert.equal((await adminReglages(req('/api/admin/reglages', { cookie: faux }))).status, 401);
});
await essai('cookie signé avec un autre secret → 401', async () => {
  const { creerJeton } = await import('../netlify/lib/session.mjs');
  process.env.ADMIN_SECRET_SESSION = 'y'.repeat(48);
  const autre = creerJeton();
  process.env.ADMIN_SECRET_SESSION = 'x'.repeat(48);
  assert.equal((await adminReglages(req('/api/admin/reglages', { cookie: `atelier_session=${autre}` }))).status, 401);
});
await essai('envoi de photo sans cookie → 401', async () => {
  assert.equal((await photo(req('/api/admin/photo', { methode: 'POST', corps: new FormData() }))).status, 401);
});

console.log('Réglages');
const put = (corps, c = cookie) => adminReglages(req('/api/admin/reglages', { methode: 'PUT', corps, cookie: c }));
const creationValide = { titre: 'Le doudou lapin', prix: 35, delai: 12, visible: true, ordre: 1, photo: null };
await essai('GET avec cookie → document vide, version 0', async () => {
  const { statut, corps } = await lire(await adminReglages(req('/api/admin/reglages', { cookie })));
  assert.equal(statut, 200);
  assert.equal(corps.reglages.version, 0);
});
await essai('PUT valide → version 1', async () => {
  const { statut, corps } = await lire(await put({ base: 0, changements: { creations: { 'doudou-lapin-brode-prenom': creationValide } } }));
  assert.equal(statut, 200, JSON.stringify(corps));
  assert.equal(corps.reglages.version, 1);
  assert.equal(corps.reglages.creations['doudou-lapin-brode-prenom'].prix, 35);
});
const refus = async (nom, changements, motif) =>
  essai(nom, async () => {
    const { statut, corps } = await lire(await put({ base: 1, changements }));
    assert.equal(statut, 422, JSON.stringify(corps));
    assert.match(corps.erreur, motif);
  });
await refus('prix négatif → 422', { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, prix: -5 } } }, /prix.*au moins 1/);
await refus('prix à virgule → 422', { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, prix: 12.5 } } }, /entier/);
await refus('nom trop long → 422', { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, titre: 'a'.repeat(71) } } }, /trop long/);
await refus('création inconnue → 422', { creations: { 'tapis-volant': creationValide } }, /n'existe pas/);
await refus('photo qui ne vient pas de l’atelier → 422', { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, photo: { grande: 'https://pirate.example/x.webp', petite: 'https://pirate.example/y.webp', largeur: 1600, hauteur: 2000 } } } }, /ne vient pas/);
await refus('téléphone invalide → 422', { infos: { ...infosValides(), telephone: '12' } }, /n'est pas valide/);
await refus('avis sans accord → 422', { avis: [{ id: 'abc123', prenom: 'Lou', ville: '', date: '', texte: 'Très belle pièce, merci.', creation: '', visible: true, accord: false }] }, /accord/);
await refus('horaires incohérents → 422', { horaires: { mode: 'messages', jours: { lundi: { ferme: false, plages: [{ de: '12:00', a: '09:00' }] } } } }, /après/);
await essai('balises HTML neutralisées dans les textes', async () => {
  const { corps } = await lire(await put({ base: 1, changements: { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, titre: '<img src=x onerror=alert(1)>Doudou' } } } }));
  assert.ok(!corps.reglages.creations['doudou-lapin-brode-prenom'].titre.includes('<'));
});
await essai('version de base périmée → 409 (pas d’écrasement)', async () => {
  assert.equal((await put({ base: 0, changements: {} })).status, 409);
});
await essai('infos, horaires et avis valides → enregistrés ; téléphone normalisé', async () => {
  const { statut, corps } = await lire(
    await put({
      base: 2,
      changements: {
        infos: infosValides(),
        horaires: { mode: 'messages', jours: { lundi: { ferme: false, plages: [{ de: '09:00', a: '12:00' }, { de: '14:00', a: '18:00' }] } } },
        avis: [
          { id: 'avis000001', prenom: 'Claire', ville: 'Vitré', date: '2026-09-12', texte: 'Un doudou magnifique, très soigné.', creation: 'doudou-lapin-brode-prenom', visible: true, accord: true },
          { id: 'avis000002', prenom: 'Masqué', ville: '', date: '', texte: 'Cet avis est masqué sur le site.', creation: '', visible: false, accord: true },
        ],
      },
      prive: { nomLegal: 'Emmanuelle Wagner', siret: '123 456 789 00012', adressePro: '1 rue Secrète', codePostal: '35500', questions: { logos: { reponse: 'Oui', precision: '' } } },
    }),
  );
  assert.equal(statut, 200, JSON.stringify(corps));
  assert.equal(corps.reglages.infos.telephone, '+33612345678');
  assert.equal(corps.prive.siret, '12345678900012');
});
await essai('SIRET invalide → 422', async () => {
  const { statut, corps } = await lire(await put({ base: 3, changements: {}, prive: { siret: '1234' } }));
  assert.equal(statut, 422);
  assert.match(corps.erreur, /14 chiffres/);
});

console.log('Réglages publics');
await essai('/api/reglages : cache CDN 5 min + tag, aucune donnée privée', async () => {
  const r = await reglagesPublic(req('/api/reglages'));
  assert.equal(r.headers.get('netlify-cdn-cache-control'), 'public, s-maxage=300, stale-while-revalidate=86400');
  assert.equal(r.headers.get('netlify-cache-tag'), 'reglages');
  const texte = await r.text();
  for (const interdit of ['Wagner', '12345678900012', 'Secrète', 'siret', 'prive', 'majLe', 'Masqué', 'accord'])
    assert.ok(!texte.includes(interdit), `« ${interdit} » ne doit pas être public`);
  const doc = JSON.parse(texte);
  assert.equal(doc.avis.length, 1, 'seuls les avis visibles');
  assert.equal(doc.infos.telephone, '+33612345678');
});
await essai('/api/reglages : Blobs en panne → 503 non mis en cache', async () => {
  const sauve = globalThis.__magasinsEssai;
  globalThis.__magasinsEssai = () => ({ get: async () => { throw new Error('panne'); } });
  const r = await reglagesPublic(req('/api/reglages'));
  globalThis.__magasinsEssai = sauve;
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

console.log('Annulation');
await essai('« Annuler ce changement » revient à la version précédente', async () => {
  const { corps } = await lire(await adminReglages(req('/api/admin/reglages', { methode: 'POST', corps: { action: 'annuler', base: 3 }, cookie })));
  assert.equal(corps.reglages.version, 4);
  assert.equal(corps.reglages.infos, null, 'les infos ajoutées en version 3 disparaissent');
  assert.ok(corps.reglages.creations['doudou-lapin-brode-prenom'], 'la version 2 est restaurée');
});
await essai('historique limité à 5 versions', async () => {
  let base = 4;
  for (let i = 0; i < 8; i++) {
    const { corps } = await lire(await put({ base, changements: { creations: { 'doudou-lapin-brode-prenom': { ...creationValide, prix: 40 + i } } } }));
    base = corps.reglages.version;
  }
  const { corps } = await lire(await adminReglages(req('/api/admin/reglages', { cookie })));
  assert.equal(corps.versionsPrecedentes, 5);
});

console.log('Photos');
const webp = (l, h, opts = {}) => sharp({ create: { width: l, height: h, channels: 3, background: '#F4C3CF' } }).webp(opts).toBuffer();
const envoi = (grande, petite, types = ['image/webp', 'image/webp']) => {
  const fd = new FormData();
  fd.set('grande', new Blob([grande], { type: types[0] }), 'grande');
  fd.set('petite', new Blob([petite], { type: types[1] }), 'petite');
  return photo(req('/api/admin/photo', { methode: 'POST', corps: fd, cookie }));
};
let urlPhoto = '';
await essai('WebP 1600 + 800 → 201, deux URL /api/image/', async () => {
  const { statut, corps } = await lire(await envoi(await webp(1600, 2000), await webp(800, 1000)));
  assert.equal(statut, 201, JSON.stringify(corps));
  assert.match(corps.grande, /^\/api\/image\/[a-f0-9]{24}-1600\.webp$/);
  assert.equal(corps.largeur, 1600);
  assert.equal(corps.hauteur, 2000);
  urlPhoto = corps.grande;
});
await essai('JPEG sans EXIF (repli iPhone) → 201', async () => {
  const j = (l, h) => sharp({ create: { width: l, height: h, channels: 3, background: '#ADCBEB' } }).jpeg().toBuffer();
  const { statut } = await lire(await envoi(await j(1200, 900), await j(800, 600), ['image/jpeg', 'image/jpeg']));
  assert.equal(statut, 201);
});
await essai('PNG → 415', async () => {
  const png = await sharp({ create: { width: 800, height: 800, channels: 3, background: '#fff' } }).png().toBuffer();
  assert.equal((await envoi(png, png, ['image/png', 'image/png'])).status, 415);
});
await essai('faux WebP (texte renommé) → 415', async () => {
  const faux = Buffer.from('<?php echo "pirate"; ?>'.padEnd(64, ' '));
  assert.equal((await envoi(faux, faux)).status, 415);
});
await essai('photo encore porteuse de GPS (EXIF) → 415', async () => {
  const avecExif = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#fff' } })
    .withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '48/1 7/1 0/1' } }).webp().toBuffer();
  const { statut, corps } = await lire(await envoi(avecExif, avecExif));
  assert.equal(statut, 415, JSON.stringify(corps));
  assert.match(corps.erreur, /informations cachées/);
});
await essai('trop grande (2400 px) → 415', async () => {
  const { statut, corps } = await lire(await envoi(await webp(2400, 1600), await webp(800, 533)));
  assert.equal(statut, 415);
  assert.match(corps.erreur, /trop grande/);
});
await essai('trop lourde (> 1,5 Mo) → 413', async () => {
  const lourd = await sharp(Buffer.from(Array.from({ length: 1600 * 1600 * 3 }, () => Math.floor(Math.random() * 256))), { raw: { width: 1600, height: 1600, channels: 3 } }).webp({ quality: 100, lossless: true }).toBuffer();
  assert.ok(lourd.length > 1.5 * 1024 * 1024, `fichier d’essai de ${lourd.length} octets`);
  assert.equal((await envoi(lourd, await webp(800, 800))).status, 413);
});
await essai('/api/image/ sert la photo, cache d’un an, type correct', async () => {
  const cle = urlPhoto.split('/').pop();
  const r = await image(req(urlPhoto), ctx(undefined, { cle }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/webp');
  assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
});
await essai('/api/image/ refuse un nom hors motif (../)', async () => {
  assert.equal((await image(req('/api/image/x'), ctx(undefined, { cle: '../reglages/actuel' }))).status, 404);
});
await essai('photo d’accueil enregistrée puis publique', async () => {
  const { corps: c0 } = await lire(await adminReglages(req('/api/admin/reglages', { cookie })));
  const portrait = { grande: urlPhoto, petite: urlPhoto.replace('-1600', '-800'), largeur: 1600, hauteur: 2000, alt: 'Emma dans son atelier' };
  const { statut } = await lire(await put({ base: c0.reglages.version, changements: { accueil: { portrait } } }));
  assert.equal(statut, 200);
  const pub = await (await reglagesPublic(req('/api/reglages'))).json();
  assert.equal(pub.accueil.portrait.grande, urlPhoto);
});

console.log(`\n${n} essais réussis.`);

function infosValides() {
  return {
    telephone: '06 12 34 56 78', whatsapp: '', email: 'Bonjour@Emma-Broderie.fr', facebook: '', ville: 'Vitré',
    delaiReponse: 'Dans la journée', delaiActuel: '2 semaines', commandes: 'ouvertes', retourLe: '', dateLimiteNoel: '1er décembre',
    remiseVitre: true, remiseRennes: true, remiseAutres: '', envoiFrance: true, fraisEnvoi: '', emballageCadeau: true,
    paiement: '', acompte: '', marches: '',
  };
}
