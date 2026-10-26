/**
 * Questionnaire Excel (scripts/questionnaire.py) → changements à appliquer.
 *
 * La CLÉ en colonne A de chaque onglet fait foi, jamais le libellé ni le
 * numéro de ligne. Une case vide = inchangé. Une valeur invalide est
 * signalée en clair et ignorée ; le reste s'applique quand même.
 */
import { dateExcel, heureExcel } from './xlsx.js';
import { telephoneLisible, dateLongue } from '../scripts/reglages-commun.js';
import {
  validerInfos, validerHoraires, validerAvis, normaliserSiret, JOURS, delai } from '../lib/regles-atelier.js';

const ONGLETS = { coord: 'Mes coordonnées', creations: 'Mes créations', avis: 'Mes avis', horaires: 'Mes horaires', questions: 'Questions' };

const CHAMPS_INFOS = {
  telephone: ['telephone', 'Téléphone'],
  whatsapp: ['whatsapp', 'WhatsApp'],
  email: ['email', 'E-mail'],
  facebook: ['facebook', 'Facebook'],
  ville: ['ville', 'Ville affichée'],
  delai_reponse: ['delaiReponse', 'Délai de réponse'],
  delai_actuel: ['delaiActuel', 'Délai de réalisation'],
  commandes: ['commandes', 'Commandes'],
  retour_le: ['retourLe', 'Date de retour de congés'],
  date_limite_noel: ['dateLimiteNoel', 'Date limite de Noël'],
  remise_vitre: ['remiseVitre', 'Remise à Vitré'],
  remise_rennes: ['remiseRennes', 'Remise à Rennes'],
  remise_autres: ['remiseAutres', 'Autres communes de remise'],
  envoi_france: ['envoiFrance', 'Envoi en France'],
  frais_envoi: ['fraisEnvoi', 'Frais d’envoi'],
  emballage_cadeau: ['emballageCadeau', 'Emballage cadeau'],
  paiement: ['paiement', 'Moyens de paiement'],
  acompte: ['acompte', 'Acompte'],
  marches: ['marches', 'Marchés et salons'],
};
const CHAMPS_PRIVES = {
  nom_legal: ['nomLegal', 'Nom légal'],
  siret: ['siret', 'SIRET'],
  adresse_pro: ['adressePro', 'Adresse de l’entreprise'],
  code_postal: ['codePostal', 'Code postal'],
  annee_debut: ['anneeDebut', 'Année de début'],
};
const BOOLEENS = new Set(['remiseVitre', 'remiseRennes', 'envoiFrance', 'emballageCadeau']);
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const COMMANDES = { ouvertes: 'Ouvertes', complet: 'Complet', conges: 'En congés' };

/* ------------------------------------------------------------ conversions */
const sansAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const texte = (v) => (typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v ?? '')).trim();

function ouiNon(v) {
  if (typeof v === 'boolean') return v;
  const s = sansAccent(v);
  if (['oui', 'o', 'yes', 'x', '1', 'vrai'].includes(s)) return true;
  if (['non', 'n', 'no', '0', 'faux'].includes(s)) return false;
  throw new Error(`« ${v} » : répondez Oui ou Non.`);
}

/** Date : nombre Excel, « 15/01/2027 », « 15/01/27 » ou « 2027-01-15 ». */
function date(v) {
  if (typeof v === 'number') return dateExcel(v);
  const s = texte(v);
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return m[0].slice(0, 10);
  throw new Error(`« ${s} » n’est pas une date (écrivez-la comme 15/01/2027).`);
}

/** Heure : fraction Excel, « 9:00 », « 9h », « 9h30 », « 09.15 ». */
function heure(v) {
  if (typeof v === 'number') return heureExcel(v);
  const m = /^(\d{1,2})\s*(?:[:hH.]\s*(\d{2})?)?$/.exec(texte(v));
  if (!m || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) throw new Error(`« ${v} » n’est pas une heure (écrivez 9:00).`);
  return `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`;
}

/** Prix : entier ≥ 0 ; 0 ou « sur devis » = « Sur devis ». */
function prix(v) {
  if (typeof v === 'number') {
    if (!Number.isInteger(v) || v < 0) throw new Error(`« ${v} » : le prix doit être un nombre entier positif, sans centimes.`);
    return v === 0 ? null : v;
  }
  const s = sansAccent(v).replace(/€|eur(os?)?/g, '').replace(/\s/g, '');
  if (s === 'surdevis' || s === '') return null;
  if (!/^\d+$/.test(s)) throw new Error(`« ${v} » : le prix doit être un nombre entier positif, sans centimes.`);
  return Number(s) || null;
}

function entierPositif(v, nom) {
  const n = typeof v === 'number' ? v : Number(texte(v).replace(/\s|jours?|j/gi, ''));
  if (!Number.isInteger(n) || n < 1) throw new Error(`« ${v} » : ${nom} doit être un nombre entier.`);
  return n;
}

/** Valeur d'information telle qu'Emmanuelle la reconnaît. */
function lisible(champ, v) {
  if (champ === 'commandes') return COMMANDES[v];
  if ((champ === 'telephone' || champ === 'whatsapp') && v) return telephoneLisible(v);
  if (champ === 'retourLe' && v) return dateLongue(v);
  return affiche(v);
}
const affiche = (v) => (v === true ? 'Oui' : v === false ? 'Non' : v === null || v === undefined || v === '' ? '(vide)' : String(v));

/** Lignes d'un onglet indexées par clé (colonne A). */
function parCle(lignes = []) {
  const m = new Map();
  for (const l of lignes) if (l?.A !== undefined) m.set(texte(l.A), l);
  return m;
}

/* ------------------------------------------------------------ lecture */
/**
 * @param classeur  résultat de lireXlsx()
 * @param actuel    { infos, creations (liste en ligne), avis, horaires, prive }
 * @param titres    { slug: titre du build }
 */
export function lireQuestionnaire(classeur, actuel, titres) {
  const f = classeur.feuilles;
  if (!f[ONGLETS.coord] && !f[ONGLETS.creations])
    throw new Error('Ce fichier n’est pas le questionnaire Emma Broderie (onglets « Mes coordonnées » et « Mes créations » introuvables).');

  const groupes = [];
  const changements = {};
  let prive;
  const groupe = (titre) => { const g = { titre, lignes: [] }; groupes.push(g); return g; };

  /* ---------- Mes coordonnées : informations publiques ---------- */
  const coord = parCle(f[ONGLETS.coord]);
  const gInfos = groupe('Mes informations');
  let infos = { ...actuel.infos };
  for (const [cle, [champ, nom]] of Object.entries(CHAMPS_INFOS)) {
    const brut = coord.get(cle)?.C;
    if (brut === undefined || texte(brut) === '') continue;
    let valeur;
    try {
      if (BOOLEENS.has(champ)) valeur = ouiNon(brut);
      else if (champ === 'commandes') {
        const s = sansAccent(brut);
        valeur = s.startsWith('ouvert') ? 'ouvertes' : s.startsWith('complet') ? 'complet' : s.includes('conge') ? 'conges' : null;
        if (!valeur) throw new Error(`« ${brut} » : choisissez Ouvertes, Complet ou En congés.`);
      } else if (champ === 'retourLe') valeur = date(brut);
      else if (champ === 'dateLimiteNoel' && typeof brut === 'number') {
        const [, mo, j] = dateExcel(brut).split('-').map(Number);
        valeur = `${j === 1 ? '1er' : j} ${MOIS[mo - 1]}`;
      } else valeur = texte(brut);
      /* Le validateur complet, appliqué à ce seul champ : même règle que le serveur.
         La date de retour n'existe qu'en congés : on la contrôle dans ce cas. */
      const candidat = validerInfos({ ...infos, ...(champ === 'retourLe' ? { commandes: 'conges' } : {}), [champ]: valeur });
      valeur = candidat[champ];
    } catch (e) {
      gInfos.lignes.push({ champ: nom, statut: 'erreur', message: `${e.message} Ce champ n’est pas importé.` });
      continue;
    }
    const avant = infos[champ];
    if (avant === valeur) continue;
    infos = { ...infos, [champ]: valeur };
    gInfos.lignes.push({
      champ: nom, statut: 'change',
      avant: lisible(champ, avant),
      apres: lisible(champ, valeur),
    });
  }
  if (infos.retourLe && infos.commandes !== 'conges') {
    const i = gInfos.lignes.findIndex((l) => l.champ === CHAMPS_INFOS.retour_le[1]);
    if (i > -1) gInfos.lignes[i] = { champ: CHAMPS_INFOS.retour_le[1], statut: 'avert', message: 'Une date de retour est indiquée, mais les commandes ne sont pas « En congés » : elle est ignorée.' };
    infos = { ...infos, retourLe: '' };
  }
  if (gInfos.lignes.some((l) => l.statut === 'change')) changements.infos = validerInfos(infos);

  /* ---------- Mes coordonnées : données légales (jamais publiques) ---------- */
  const gPrive = groupe('Mentions légales (visibles seulement dans votre atelier)');
  const nouveauPrive = { nomLegal: '', siret: '', adressePro: '', codePostal: '', anneeDebut: '', questions: {}, remarquesCreations: {}, ...(actuel.prive ?? {}) };
  delete nouveauPrive.majLe;
  let priveModifie = false;
  for (const [cle, [champ, nom]] of Object.entries(CHAMPS_PRIVES)) {
    const brut = coord.get(cle)?.C;
    if (brut === undefined || texte(brut) === '') continue;
    let valeur;
    try {
      valeur = champ === 'siret' ? normaliserSiret(typeof brut === 'number' ? brut.toFixed(0) : brut) : texte(brut);
      if (champ === 'codePostal' && !/^\d{5}$/.test(valeur)) throw new Error(`« ${valeur} » : le code postal doit compter 5 chiffres.`);
      if (valeur.length > (champ === 'adressePro' ? 200 : 100)) throw new Error('Texte trop long.');
    } catch (e) {
      gPrive.lignes.push({ champ: nom, statut: 'erreur', message: `${e.message} Ce champ n’est pas importé.` });
      continue;
    }
    if (nouveauPrive[champ] === valeur) continue;
    gPrive.lignes.push({ champ: nom, statut: 'change', avant: affiche(nouveauPrive[champ]), apres: valeur });
    nouveauPrive[champ] = valeur;
    priveModifie = true;
  }

  /* ---------- Mes créations ---------- */
  const gCrea = groupe('Créations');
  const liste = actuel.creations.map((c) => ({ ...c }));
  const parSlug = new Map(liste.map((c) => [c.slug, c]));
  const ordres = new Map();
  let creaModifiee = false;
  for (const l of f[ONGLETS.creations] ?? []) {
    if (!l?.A || texte(l.A) === 'clé') continue;
    const slug = texte(l.A);
    const c = parSlug.get(slug);
    if (!c) {
      if ([l.C, l.D, l.E, l.F, l.G].some((v) => v !== undefined))
        gCrea.lignes.push({ champ: slug, statut: 'avert', message: `La création « ${slug} » n’existe pas sur le site : ligne ignorée.` });
      continue;
    }
    const nomC = c.titre;
    const essai = (nom, fn) => { try { return fn(); } catch (e) { gCrea.lignes.push({ champ: `${nomC} · ${nom}`, statut: 'erreur', message: `${e.message} Non importé.` }); return undefined; } };
    const changer = (cle, nom, v) => {
      if (v === undefined || c[cle] === v) return;
      gCrea.lignes.push({ champ: `${nomC} · ${nom}`, statut: 'change', avant: affiche(c[cle]), apres: affiche(v) });
      c[cle] = v;
      creaModifiee = true;
    };
    if (l.C !== undefined) changer('titre', 'nom', essai('nom', () => {
      const t = texte(l.C).replace(/'/g, '’');
      if (t.length < 2 || t.length > 70) throw new Error('Le nom doit faire entre 2 et 70 caractères.');
      return t;
    }));
    if (l.D !== undefined) changer('prix', 'prix', essai('prix', () => prix(l.D)));
    if (l.E !== undefined) changer('delai', 'délai (jours)', essai('délai', () => delai(typeof l.E === 'number' ? l.E : texte(l.E), { nom: 'Le délai' })));
    if (l.F !== undefined) changer('visible', 'sur l’accueil', essai('accueil', () => ouiNon(l.F)));
    if (l.G !== undefined) { const o = essai('ordre', () => entierPositif(l.G, 'l’ordre')); if (o !== undefined) ordres.set(slug, o); }
    if (l.H !== undefined && texte(l.H)) {
      nouveauPrive.remarquesCreations = { ...nouveauPrive.remarquesCreations, [slug]: texte(l.H).slice(0, 600) };
      priveModifie = true;
    }
  }
  if (ordres.size) {
    const avant = liste.map((c) => c.titre).join(' → ');
    const rang = new Map(liste.map((c, i) => [c.slug, i]));
    liste.sort((a, b) => (ordres.get(a.slug) ?? Infinity) - (ordres.get(b.slug) ?? Infinity) || rang.get(a.slug) - rang.get(b.slug));
    const apres = liste.map((c) => c.titre).join(' → ');
    if (avant !== apres) {
      gCrea.lignes.push({ champ: 'Ordre sur l’accueil', statut: 'change', avant, apres });
      creaModifiee = true;
    }
  }
  if (creaModifiee) changements.creations = liste;

  /* ---------- Mes avis ---------- */
  const gAvis = groupe('Avis de clientes');
  const avis = [...(actuel.avis ?? [])];
  const dejaLa = new Set(avis.map((a) => sansAccent(a.texte)));
  const trouverCreation = (v) => {
    if (!v) return '';
    const s = sansAccent(v);
    if (s.length < 4) return null;
    for (const [slug, t] of Object.entries(titres)) if (s === slug || sansAccent(t) === s || sansAccent(t).includes(s) || s.includes(sansAccent(t).replace(/^(le|la|les|l’|l')\s*/, ''))) return slug;
    return null;
  };
  for (const l of f[ONGLETS.avis] ?? []) {
    if (!l?.A || !/^avis_\d+$/.test(texte(l.A))) continue;
    if (!l.E && !l.B) continue;
    const qui = texte(l.B) || texte(l.A);
    let accord;
    try { accord = l.G === undefined ? false : ouiNon(l.G); } catch { accord = false; }
    if (!accord) { gAvis.lignes.push({ champ: `Avis de ${qui}`, statut: 'avert', message: 'Pas d’accord « Oui » pour publier : avis ignoré.' }); continue; }
    if (dejaLa.has(sansAccent(l.E ?? ''))) continue;
    let creation = trouverCreation(texte(l.F));
    if (creation === null) {
      gAvis.lignes.push({ champ: `Avis de ${qui}`, statut: 'avert', message: `Création « ${texte(l.F)} » non reconnue : l’avis est importé sans lien vers une création.` });
      creation = '';
    }
    try {
      const [a] = validerAvis([{
        id: Math.random().toString(36).slice(2, 12).padEnd(10, '0'),
        prenom: texte(l.B), ville: texte(l.C), date: l.D !== undefined ? date(l.D) : '', texte: texte(l.E),
        creation, visible: true, accord: true,
      }], titres);
      avis.push(a);
      dejaLa.add(sansAccent(a.texte));
      gAvis.lignes.push({ champ: `Avis de ${a.prenom}`, statut: 'change', avant: '(nouveau)', apres: `« ${a.texte} »` });
    } catch (e) {
      gAvis.lignes.push({ champ: `Avis de ${qui}`, statut: 'erreur', message: `${e.message.replace(/^L’avis n° 1(, | : )/, '')} Avis non importé.` });
    }
  }
  if (avis.length !== (actuel.avis ?? []).length) changements.avis = avis;

  /* ---------- Mes horaires ---------- */
  const gHor = groupe('Horaires');
  const hor = parCle(f[ONGLETS.horaires]);
  const base = structuredClone(actuel.horaires ?? { mode: 'messages', jours: Object.fromEntries(JOURS.map((j) => [j, { ferme: true, plages: [] }])) });
  let horModif = false;
  try {
    const mode = hor.get('horaires_mode')?.C;
    if (mode !== undefined && texte(mode)) {
      const m = sansAccent(mode).includes('rendez') ? 'rendez-vous' : sansAccent(mode).includes('message') ? 'messages' : null;
      if (!m) throw new Error(`« ${mode} » : choisissez « Je réponds aux messages » ou « Retrait sur rendez-vous ».`);
      if (m !== base.mode) { base.mode = m; horModif = true; }
    }
    for (const j of JOURS) {
      const l = hor.get(j);
      if (!l || [l.C, l.D, l.E, l.F, l.G].every((v) => v === undefined)) continue;
      const nom = j.charAt(0).toUpperCase() + j.slice(1);
      const ferme = l.C !== undefined ? ouiNon(l.C) : false;
      const plages = [];
      if (!ferme) {
        if (l.D === undefined || l.E === undefined) throw new Error(`${nom} : indiquez l’heure de début et de fin, ou « Fermé : Oui ».`);
        plages.push({ de: heure(l.D), a: heure(l.E) });
        if (l.F !== undefined && l.G !== undefined) plages.push({ de: heure(l.F), a: heure(l.G) });
      }
      base.jours[j] = { ferme, plages };
      horModif = true;
    }
    if (horModif) {
      const propre = validerHoraires(base);
      if (JSON.stringify(propre) !== JSON.stringify(actuel.horaires)) {
        changements.horaires = propre;
        gHor.lignes.push({ champ: 'Horaires', statut: 'change', avant: resumeHoraires(actuel.horaires), apres: resumeHoraires(propre) });
      }
    }
  } catch (e) {
    gHor.lignes.push({ champ: 'Horaires', statut: 'erreur', message: `${e.message} Les horaires ne sont pas importés.` });
  }

  /* ---------- Questions (pour le développeur) ---------- */
  const gQ = groupe('Réponses aux questions (pour ajuster les textes du site)');
  for (const l of f[ONGLETS.questions] ?? []) {
    if (!l?.A || !/^[a-z_]{2,40}$/.test(texte(l.A))) continue;
    if (l.C === undefined && l.D === undefined) continue;
    const q = { reponse: texte(l.C).slice(0, 20), precision: texte(l.D).slice(0, 600) };
    const avant = nouveauPrive.questions?.[texte(l.A)];
    if (avant && avant.reponse === q.reponse && avant.precision === q.precision) continue;
    nouveauPrive.questions = { ...nouveauPrive.questions, [texte(l.A)]: q };
    priveModifie = true;
    gQ.lignes.push({ champ: texte(l.A), statut: 'change', avant: avant ? `${avant.reponse} ${avant.precision}`.trim() : '(sans réponse)', apres: `${q.reponse} ${q.precision}`.trim() });
  }

  if (priveModifie) prive = nouveauPrive;
  const toutes = groupes.flatMap((g) => g.lignes);
  return {
    groupes: groupes.filter((g) => g.lignes.length),
    changements,
    prive,
    nbChangements: toutes.filter((l) => l.statut === 'change').length,
    nbErreurs: toutes.filter((l) => l.statut === 'erreur').length,
    nbAvertissements: toutes.filter((l) => l.statut === 'avert').length,
  };
}

function resumeHoraires(h) {
  if (!h) return '(aucun)';
  return JOURS.map((j) => {
    const d = h.jours[j];
    return `${j.slice(0, 3)}. ${d.ferme ? 'fermé' : d.plages.map((p) => `${p.de}–${p.a}`).join(', ')}`;
  }).join(' · ');
}
