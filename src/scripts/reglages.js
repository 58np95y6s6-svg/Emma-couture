/**
 * Réglages vivants : ce qu'Emmanuelle modifie dans l'atelier, appliqué sans
 * redéploiement.
 *
 * Un seul appel à /api/reglages par page (mis en cache au CDN), puis on
 * fusionne avec ce que le build a déjà affiché. Règles :
 *  - si l'appel échoue ou dépasse 3 secondes, on ne touche à rien : la page
 *    garde les valeurs du build, rien n'a jamais été masqué en attendant ;
 *  - une photo n'est remplacée qu'une fois la nouvelle chargée (pas de trou) ;
 *  - le H1 et les textes de fond ne passent jamais par ici (référencement).
 *
 * Points d'accroche (attributs posés par les composants) :
 *   [data-creation="<slug>"]       carte de création (CarteCreation.astro)
 *     [data-champ="titre|prix|delai"], .carte__img img
 *   [data-reglage="accueil-creations"]  rangée des cartes de l'accueil
 *   [data-reglage="portrait"]      photo du haut de l'accueil
 *   [data-reglage="statut"], .statut   état des commandes (en-tête)
 *   [data-reglage="telephone|email|facebook|ville|zones|delai-reponse|
 *                  delai-actuel|prix-min|remise-titre|remise-texte"]
 *   liens wa.me, tel: et mailto: de toute la page
 */
import { texteStatut, phraseZones, tuileRemise, telephoneLisible, numeroWhatsapp, srcsetPhoto } from './reglages-commun.js';

const DELAI_MAX_MS = 3000;
const ACCUEIL_MAX = 6;

const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];
const texte = (sel, valeur) => {
  if (valeur) for (const el of $$(sel)) el.textContent = valeur;
};

/** Remplace la photo d'un <img> une fois la nouvelle prête. */
function changerPhoto(img, p, alt) {
  if (!img || !p) return;
  const essai = new Image();
  essai.sizes = img.sizes;
  essai.srcset = srcsetPhoto(p);
  essai.src = p.petite;
  const poser = () => {
    img.srcset = essai.srcset;
    img.src = p.petite;
    img.width = p.largeur;
    img.height = p.hauteur;
    if (alt) img.alt = alt;
  };
  (essai.decode ? essai.decode() : Promise.resolve()).then(poser, () => {});
}

function prixHtml(el, prix) {
  el.replaceChildren();
  if (prix) {
    const b = document.createElement('b');
    b.textContent = `${prix} €`;
    el.append('dès ', b);
  } else {
    const b = document.createElement('b');
    b.textContent = 'Sur devis';
    el.append(b);
  }
}

function appliquerCreations(creations) {
  for (const carte of $$('[data-creation]')) {
    const r = creations[carte.dataset.creation];
    if (!r) continue;
    const titre = carte.querySelector('[data-champ="titre"]');
    if (titre && r.titre) titre.textContent = r.titre.replace(/'/g, '’');
    const prix = carte.querySelector('[data-champ="prix"]');
    if (prix) { prixHtml(prix, r.prix); carte.dataset.prix = r.prix ?? ''; }
    const delai = carte.querySelector('[data-champ="delai"]');
    if (delai) {
      delai.textContent = r.delai ? `${r.delai} jours` : '';
      delai.hidden = !r.delai;
    }
    if (r.photo) changerPhoto(carte.querySelector('.carte__img img'), r.photo);
  }

  /* Accueil : ordre et visibilité. Les cartes sans réglage gardent leur
     place du build, derrière celles qu'Emmanuelle a rangées. */
  const rangee = document.querySelector('[data-reglage="accueil-creations"]');
  if (!rangee) return;
  const cartes = $$(':scope > [data-creation]', rangee).map((el, i) => {
    const r = creations[el.dataset.creation];
    return { el, visible: r ? r.visible : !el.hidden, ordre: r ? r.ordre : 1000 + i };
  });
  const affichees = cartes.filter((c) => c.visible).sort((a, b) => a.ordre - b.ordre).slice(0, ACCUEIL_MAX);
  if (!affichees.length) return; // jamais une rangée vide
  for (const c of cartes) c.el.hidden = !affichees.includes(c);
  for (const c of affichees) rangee.append(c.el);
  /* La première carte visible est la plus probable à l'écran : pas différée. */
  affichees[0].el.querySelector('img')?.setAttribute('loading', 'eager');

  const prix = affichees.map((c) => Number(c.el.dataset.prix ?? NaN)).filter((p) => p > 0);
  texte('[data-reglage="prix-min"]', prix.length ? `Dès ${Math.min(...prix)} €` : '');
}

function appliquerInfos(i) {
  const tel = i.telephone;
  if (tel) {
    for (const a of $$('a[href^="tel:"]')) a.href = `tel:${tel}`;
    texte('[data-reglage="telephone"]', telephoneLisible(tel));
  }
  if (i.email) {
    for (const a of $$('a[href^="mailto:"]')) {
      const suite = a.href.indexOf('?');
      a.href = `mailto:${i.email}${suite > -1 ? a.href.slice(suite) : ''}`;
    }
    texte('[data-reglage="email"]', i.email);
  }
  const wa = numeroWhatsapp(i);
  if (wa) {
    for (const a of $$('a[href^="https://wa.me/"]')) {
      const u = new URL(a.href);
      u.pathname = `/${wa}`;
      a.href = u.href;
    }
  }
  for (const a of $$('[data-reglage="facebook"]')) {
    if (i.facebook) a.href = i.facebook;
    a.hidden = !i.facebook;
  }
  texte('[data-reglage="ville"]', i.ville);
  if (i.delaiReponse) {
    const d = i.delaiReponse.trim();
    texte('[data-reglage="delai-reponse"]', d.charAt(0).toUpperCase() + d.slice(1));
    texte('[data-reglage="delai-reponse-phrase"]', `Réponse ${d.charAt(0).toLowerCase()}${d.slice(1)}`);
  }
  texte('[data-reglage="delai-actuel"]', i.delaiActuel);
  texte('[data-reglage="zones"]', phraseZones(i));
  const remise = tuileRemise(i);
  texte('[data-reglage="remise-titre"]', remise.titre);
  texte('[data-reglage="remise-texte"]', remise.texte);

  const statut = texteStatut(i.commandes, i.retourLe);
  for (const el of $$('.statut')) {
    el.textContent = statut.texte;
    el.classList.remove('statut--complet', 'statut--conges');
    if (statut.classe) el.classList.add(statut.classe);
  }
}

async function charger() {
  if (!document.querySelector('[data-creation], [data-reglage], a[href^="https://wa.me/"]')) return;
  const arret = new AbortController();
  const minuterie = setTimeout(() => arret.abort(), DELAI_MAX_MS);
  let r;
  try {
    const rep = await fetch('/api/reglages', { signal: arret.signal, credentials: 'omit' });
    if (!rep.ok) return;
    r = await rep.json();
  } catch {
    return; // hors ligne, lent ou fonction en panne : valeurs du build
  } finally {
    clearTimeout(minuterie);
  }
  if (!r || typeof r !== 'object') return;
  /* Chaque bloc isolé : une erreur dans l'un ne prive pas les autres. */
  try { if (r.infos) appliquerInfos(r.infos); } catch (e) { console.warn('réglages (infos)', e); }
  try { if (r.creations) appliquerCreations(r.creations); } catch (e) { console.warn('réglages (créations)', e); }
  try {
    const p = r.accueil?.portrait;
    if (p) changerPhoto(document.querySelector('[data-reglage="portrait"] img'), p, p.alt);
  } catch (e) { console.warn('réglages (portrait)', e); }
}

charger();
