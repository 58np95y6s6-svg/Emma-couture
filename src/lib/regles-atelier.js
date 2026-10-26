/**
 * Règles de validation des réglages de l'atelier.
 *
 * Module pur (aucune dépendance Node ni navigateur), partagé par :
 *  - les fonctions Netlify (netlify/lib/reglages.mjs), qui font foi ;
 *  - l'admin, pour signaler une erreur avant l'envoi (import du questionnaire).
 * Tous les messages s'adressent à Emmanuelle : français simple, vouvoiement.
 */

export class ErreurSaisie extends Error {}
const refuser = (message) => { throw new ErreurSaisie(message); };
export const estErreurSaisie = (e) => e instanceof ErreurSaisie;

/** Seules les images servies par /api/image/ sont acceptées. */
export const MOTIF_URL_IMAGE = /^\/api\/image\/[a-f0-9]{24}-(1600|800)\.(webp|jpg)$/;
export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/* ================================================================ briques */

/** Texte simple : espaces normalisés, aucun caractère de contrôle ni balise. */
export function texte(valeur, { min = 0, max, nom }) {
  if (valeur === null || valeur === undefined) valeur = '';
  if (typeof valeur !== 'string') refuser(`${nom} est illisible.`);
  // eslint-disable-next-line no-control-regex
  const propre = valeur.replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (propre.length < min) refuser(min === 1 ? `${nom} ne peut pas être vide.` : `${nom} est trop court (au moins ${min} caractères).`);
  if (propre.length > max) refuser(`${nom} est trop long (${max} caractères au maximum, vous en avez ${propre.length}).`);
  return propre;
}

/**
 * Délai de réalisation : un nombre de jours (10) ou un intervalle (« 8 à 15 »).
 * Accepte « 8-15 », « 8 a 15 jours », « 8 à 15 j ». Renvoie 10 ou « 8 à 15 ».
 */
export function delai(valeur, { nom = 'Le délai', vide = false } = {}) {
  if (vide && (valeur === null || valeur === '' || valeur === undefined)) return null;
  if (typeof valeur === 'number') return entier(valeur, { min: 1, max: 365, nom });
  if (typeof valeur !== 'string') refuser(`${nom} : écrivez un nombre de jours, ou deux nombres comme « 8 à 15 ».`);
  const v = valeur.trim().toLowerCase().replace(/\s*(jours?|j)\s*$/, '');
  if (vide && !v) return null;
  const m = v.match(/^(\d{1,3})(?:\s*(?:à|a|-|–|au)\s*(\d{1,3}))?$/);
  if (!m) refuser(`${nom} : écrivez un nombre de jours, ou deux nombres comme « 8 à 15 ».`);
  const a = Number(m[1]); const b = m[2] ? Number(m[2]) : null;
  if (a < 1 || (b ?? a) > 365) refuser(`${nom} doit être compris entre 1 et 365 jours.`);
  if (b === null || b === a) return a;
  if (b < a) refuser(`${nom} : le premier nombre doit être le plus petit (« 8 à 15 »).`);
  return `${a} à ${b}`;
}

export function entier(valeur, { min, max, nom, vide = false }) {
  if (vide && (valeur === null || valeur === '' || valeur === undefined)) return null;
  if (typeof valeur !== 'number' || !Number.isInteger(valeur)) refuser(`${nom} doit être un nombre entier, sans virgule.`);
  if (valeur < min) refuser(`${nom} doit être au moins ${min}.`);
  if (valeur > max) refuser(`${nom} ne peut pas dépasser ${max}.`);
  return valeur;
}

const booleen = (valeur, nom) => (typeof valeur === 'boolean' ? valeur : refuser(`${nom} : répondez oui ou non.`));

/**
 * Téléphone → format international « +33612345678 ».
 * Accepte « 06 12 34 56 78 », « +33 6… », « 0033 6… », et « 612345678 »
 * (Excel supprime le zéro de tête quand le numéro est saisi comme un nombre).
 */
export function normaliserTelephone(valeur, nom = 'Le numéro de téléphone') {
  const brut = String(valeur ?? '').trim();
  if (!brut) return '';
  let n = brut.replace(/[\s.\-()/]/g, '');
  if (n.startsWith('00')) n = `+${n.slice(2)}`;
  if (/^[1-9]\d{8}$/.test(n)) n = `0${n}`;
  if (/^0[1-9]\d{8}$/.test(n)) return `+33${n.slice(1)}`;
  if (/^\+33[1-9]\d{8}$/.test(n)) return n;
  if (/^\+[1-9]\d{7,14}$/.test(n) && !n.startsWith('+33')) return n;
  refuser(`${nom} « ${brut} » n'est pas valide. Écrivez-le comme ceci : 06 12 34 56 78.`);
}

export function normaliserEmail(valeur, nom = 'L’adresse e-mail') {
  const e = String(valeur ?? '').trim().toLowerCase();
  if (!e) return '';
  if (e.length > 120 || !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/.test(e)) refuser(`${nom} « ${valeur} » n'est pas valide.`);
  return e;
}

export function normaliserFacebook(valeur) {
  const v = String(valeur ?? '').trim();
  if (!v) return '';
  let url;
  try { url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); } catch { refuser(`L’adresse Facebook « ${v} » n'est pas valide.`); }
  if (!/(^|\.)(facebook\.com|fb\.com)$/i.test(url.hostname) || v.length > 200)
    refuser(`L’adresse Facebook doit commencer par https://www.facebook.com/`);
  url.protocol = 'https:';
  return url.href;
}

export function normaliserSiret(valeur) {
  const s = String(valeur ?? '').replace(/\s/g, '');
  if (!s) return '';
  if (!/^\d{14}$/.test(s)) refuser(`Le SIRET doit compter 14 chiffres (vous en avez saisi ${s.replace(/\D/g, '').length}).`);
  return s;
}

/** 'AAAA-MM-JJ' ou vide. */
export function dateIso(valeur, nom) {
  const v = String(valeur ?? '').trim();
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || d.getUTCDate() !== +m[3] || d.getUTCMonth() !== +m[2] - 1) refuser(`${nom} n'est pas une date valide.`);
  return v;
}

/* ================================================================ photo */
function photo(valeur, nom, avecAlt = false) {
  if (valeur === null || valeur === undefined) return null;
  if (typeof valeur !== 'object') refuser(`La photo de ${nom} est illisible.`);
  const { grande, petite } = valeur;
  if (!MOTIF_URL_IMAGE.test(grande ?? '') || !MOTIF_URL_IMAGE.test(petite ?? ''))
    refuser(`La photo de ${nom} ne vient pas de votre atelier. Envoyez-la à nouveau.`);
  const sortie = {
    grande, petite,
    largeur: entier(valeur.largeur, { min: 200, max: 1600, nom: `La largeur de la photo de ${nom}` }),
    hauteur: entier(valeur.hauteur, { min: 200, max: 4000, nom: `La hauteur de la photo de ${nom}` }),
  };
  if (avecAlt) sortie.alt = texte(valeur.alt, { min: 5, max: 200, nom: 'La description de la photo' });
  return sortie;
}

/* ================================================================ sections */

export function validerAccueil(valeur) {
  if (!valeur || typeof valeur !== 'object') refuser('Réglages de l’accueil illisibles.');
  return { portrait: photo(valeur.portrait, 'l’accueil', true) };
}

/** `titres` : { slug: titre du build } — sert à nommer la création dans les messages. */
export function validerCreations(valeur, titres) {
  if (!valeur || typeof valeur !== 'object' || Array.isArray(valeur)) refuser('Liste des créations illisible.');
  const sortie = {};
  for (const [slug, c] of Object.entries(valeur)) {
    if (!Object.hasOwn(titres, slug)) refuser(`La création « ${slug} » n'existe pas sur le site.`);
    if (!c || typeof c !== 'object') refuser(`Réglages de « ${titres[slug]} » illisibles.`);
    const nom = `« ${typeof c.titre === 'string' && c.titre.trim() ? c.titre.trim().slice(0, 60) : titres[slug]} »`;
    sortie[slug] = {
      titre: texte(c.titre, { min: 2, max: 70, nom: `Le nom de ${nom}` }),
      prix: entier(c.prix, { min: 1, max: 5000, nom: `Le prix de ${nom}`, vide: true }),
      delai: delai(c.delai, { nom: `Le délai de ${nom}`, vide: true }),
      visible: booleen(c.visible, `${nom} visible sur l'accueil`),
      ordre: entier(c.ordre, { min: 0, max: 999, nom: `L'ordre de ${nom}` }),
      photo: photo(c.photo, nom),
    };
  }
  return sortie;
}

export function validerInfos(v) {
  if (!v || typeof v !== 'object') refuser('Informations illisibles.');
  const commandes = ['ouvertes', 'complet', 'conges'].includes(v.commandes) ? v.commandes : refuser('Choisissez l’état des commandes : ouvertes, complet ou en congés.');
  const telephone = normaliserTelephone(v.telephone);
  if (!telephone) refuser('Le numéro de téléphone ne peut pas être vide : il sert aux boutons « Appeler ».');
  const email = normaliserEmail(v.email);
  if (!email) refuser('L’adresse e-mail ne peut pas être vide : elle reçoit les demandes.');
  return {
    telephone,
    whatsapp: normaliserTelephone(v.whatsapp, 'Le numéro WhatsApp'),
    email,
    facebook: normaliserFacebook(v.facebook),
    ville: texte(v.ville, { min: 2, max: 60, nom: 'La ville' }),
    delaiReponse: texte(v.delaiReponse, { min: 2, max: 40, nom: 'Le délai de réponse' }),
    delaiActuel: texte(v.delaiActuel, { min: 2, max: 40, nom: 'Le délai de réalisation' }),
    commandes,
    retourLe: commandes === 'conges' ? dateIso(v.retourLe, 'La date de retour') : '',
    dateLimiteNoel: texte(v.dateLimiteNoel, { max: 40, nom: 'La date limite de Noël' }),
    remiseVitre: booleen(v.remiseVitre, 'Remise en main propre à Vitré'),
    remiseRennes: booleen(v.remiseRennes, 'Remise en main propre à Rennes'),
    remiseAutres: texte(v.remiseAutres, { max: 200, nom: 'Les autres communes' }),
    envoiFrance: booleen(v.envoiFrance, 'Envoi en France'),
    fraisEnvoi: texte(v.fraisEnvoi, { max: 160, nom: 'Les frais d’envoi' }),
    emballageCadeau: booleen(v.emballageCadeau, 'Emballage cadeau'),
    paiement: texte(v.paiement, { max: 160, nom: 'Les moyens de paiement' }),
    acompte: texte(v.acompte, { max: 160, nom: 'L’acompte' }),
    marches: texte(v.marches, { max: 300, nom: 'Les marchés' }),
  };
}

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validerHoraires(v) {
  if (!v || typeof v !== 'object' || !v.jours) refuser('Horaires illisibles.');
  const mode = ['messages', 'rendez-vous'].includes(v.mode) ? v.mode : refuser('Choisissez ce que signifient vos horaires.');
  const jours = {};
  for (const j of JOURS) {
    const d = v.jours[j] ?? { ferme: true, plages: [] };
    const ferme = booleen(d.ferme, `Le ${j}, fermé`);
    const plages = ferme ? [] : (Array.isArray(d.plages) ? d.plages : []).slice(0, 3);
    if (plages.length > 2) refuser(`Le ${j} : deux plages au maximum.`);
    if (!ferme && !plages.length) refuser(`Le ${j} : indiquez au moins une plage, ou cochez « Fermé ».`);
    let fin = '00:00';
    for (const p of plages) {
      if (!HEURE.test(p?.de ?? '') || !HEURE.test(p?.a ?? '')) refuser(`Le ${j} : heure illisible.`);
      if (p.de >= p.a) refuser(`Le ${j} : l'heure de fin (${p.a}) doit venir après l'heure de début (${p.de}).`);
      if (p.de < fin) refuser(`Le ${j} : la deuxième plage doit commencer après la fin de la première.`);
      fin = p.a;
    }
    jours[j] = { ferme, plages: plages.map((p) => ({ de: p.de, a: p.a })) };
  }
  return { mode, jours };
}

export function validerAvis(liste, titres) {
  if (!Array.isArray(liste)) refuser('Liste des avis illisible.');
  if (liste.length > 40) refuser('40 avis au maximum.');
  const vus = new Set();
  return liste.map((a, n) => {
    const nom = `L’avis n° ${n + 1}`;
    if (!a || typeof a !== 'object') refuser(`${nom} est illisible.`);
    if (a.accord !== true) refuser(`${nom} : sans l’accord de la cliente, il ne peut pas être enregistré.`);
    const id = /^[a-z0-9]{6,20}$/.test(a.id ?? '') && !vus.has(a.id) ? a.id : refuser(`${nom} : identifiant illisible.`);
    vus.add(id);
    const creation = String(a.creation ?? '');
    if (creation && !Object.hasOwn(titres, creation)) refuser(`${nom} : la création « ${creation} » n'existe pas.`);
    return {
      id,
      prenom: texte(a.prenom, { min: 1, max: 40, nom: `${nom}, le prénom` }),
      ville: texte(a.ville, { max: 40, nom: `${nom}, la ville` }),
      date: dateIso(a.date, `${nom}, la date`),
      texte: texte(a.texte, { min: 10, max: 600, nom: `${nom}, le texte` }),
      creation,
      visible: booleen(a.visible, `${nom}, visible`),
      accord: true,
    };
  });
}

/** Données privées : mentions légales et réponses aux questions. Jamais publiques. */
export function validerPrive(v) {
  if (!v || typeof v !== 'object') refuser('Données privées illisibles.');
  const questions = {};
  for (const [cle, q] of Object.entries(v.questions ?? {})) {
    if (!/^[a-z_]{2,40}$/.test(cle)) continue;
    questions[cle] = {
      reponse: texte(q?.reponse, { max: 20, nom: `La réponse « ${cle} »` }),
      precision: texte(q?.precision, { max: 600, nom: `La précision « ${cle} »` }),
    };
  }
  const remarques = {};
  for (const [cle, r] of Object.entries(v.remarquesCreations ?? {})) {
    if (/^[a-z0-9-]{2,80}$/.test(cle)) remarques[cle] = texte(r, { max: 600, nom: `La remarque « ${cle} »` });
  }
  return {
    nomLegal: texte(v.nomLegal, { max: 100, nom: 'Le nom légal' }),
    siret: normaliserSiret(v.siret),
    adressePro: texte(v.adressePro, { max: 200, nom: 'L’adresse de l’entreprise' }),
    codePostal: /^\d{5}$|^$/.test(String(v.codePostal ?? '').trim()) ? String(v.codePostal ?? '').trim() : refuser('Le code postal doit compter 5 chiffres.'),
    anneeDebut: texte(String(v.anneeDebut ?? ''), { max: 10, nom: 'L’année de début' }),
    questions,
    remarquesCreations: remarques,
  };
}
