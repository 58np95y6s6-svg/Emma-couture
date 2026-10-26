/**
 * Aperçus de l'atelier : de petites reproductions des blocs du site, avec
 * les vraies classes de global.css (.carte, .carte--<catégorie>, .tuile,
 * .btn…). Décoratifs pour les lecteurs d'écran (aria-hidden posé par
 * l'appelant) : le formulaire, lui, reste entièrement accessible.
 */
import { texteStatut, phraseZones, tuileRemise, telephoneLisible, srcsetPhoto } from '../scripts/reglages-commun.js';
import { BUILD } from './etat.js';

export const ACCUEIL_MAX = 6;

/** Fabrique d'éléments : h('p', { class: 'x' }, 'texte', autreElement). */
export function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const e of enfants.flat(Infinity)) if (e !== null && e !== undefined && e !== false) el.append(e);
  return el;
}

const CATEGORIES = {
  naissance: 'Naissance', 'linge-de-bain': 'Linge de bain', vetements: 'Vêtements',
  couture: 'Couture', 'decoration-ajouree': 'Dentelle libre', noel: 'Noël',
};

/** <img> d'après une photo réglée (admin) ou la photo du build. */
export function image(reglee, build, { sizes = '200px', alt = '', apercuLocal } = {}) {
  if (apercuLocal) return h('img', { src: apercuLocal, alt, decoding: 'async' });
  if (reglee) return h('img', { src: reglee.petite, srcset: srcsetPhoto(reglee), sizes, alt, width: reglee.largeur, height: reglee.hauteur, decoding: 'async' });
  return h('img', { src: build.src, srcset: build.srcset, sizes, alt, width: build.largeur, height: build.hauteur, decoding: 'async', loading: 'lazy' });
}

export function prix(p) {
  return h('span', { class: 'prix carte__prix' }, ...(p ? ['dès ', h('b', {}, `${p} €`)] : [h('b', {}, 'Sur devis')]));
}

/** Une carte de création, comme sur le site. `c.apercuLocal` : photo choisie, pas encore envoyée. */
export function carte(c, { marque } = {}) {
  return h('article', { class: `carte carte--${c.categorie}` },
    marque ? h('span', { class: 'apercu__marque' }, marque) : null,
    h('div', { class: 'carte__lien' },
      h('figure', { class: 'carte__img' }, image(c.photoReglee, c.photo, { sizes: '(max-width: 40rem) 45vw, 14rem', apercuLocal: c.apercuLocal })),
      h('div', { class: 'carte__txt' },
        h('p', { class: 'carte__cat mono' }, CATEGORIES[c.categorie] ?? ''),
        h('h3', { class: 'carte__titre' }, c.titre || 'Sans nom'),
        h('p', { class: 'carte__ligne' }, prix(c.prix), c.delai ? h('span', { class: 'carte__delai mono' }, `${c.delai} jours`) : null),
      ),
    ),
  );
}

/** Les cartes de l'accueil : les visibles, dans l'ordre, 6 au plus. */
export const cartesAccueil = (liste) => liste.filter((c) => c.visible).slice(0, ACCUEIL_MAX);

export function rangeeAccueil(liste, { modifiees = new Set() } = {}) {
  const affichees = cartesAccueil(liste);
  if (!affichees.length) return h('p', { class: 'apercu__vide' }, 'Aucune création visible : l’accueil garderait alors les créations d’origine.');
  return h('div', { class: 'apercu__rangee' }, affichees.map((c) => carte(c, { marque: modifiees.has(c.slug) ? 'Modifiée' : null })));
}

/** Le haut de l'accueil, en réduit : version téléphone et version ordinateur. */
export function hautAccueil(portrait, { apercuLocal } = {}) {
  const img = () => image(portrait, BUILD.accueil.portrait, { sizes: '320px', alt: '', apercuLocal });
  const texte = () =>
    h('div', { class: 'mini-haut__texte' },
      h('p', { class: 'mini-haut__lieu' }, 'Brodeuse et couturière à Vitré'),
      h('p', { class: 'mini-haut__h1' }, 'Broderie personnalisée et couture sur mesure'),
      h('p', { class: 'mini-haut__btn' }, h('span', {}, 'Écrire sur WhatsApp')),
    );
  return h('div', { class: 'mini-haut' },
    h('p', { class: 'apercu__ecran mono' }, 'Sur téléphone'),
    h('div', { class: 'mini-haut__tel' }, h('figure', { class: 'mini-haut__photo' }, img()), texte()),
    h('p', { class: 'apercu__ecran mono' }, 'Sur ordinateur'),
    h('div', { class: 'mini-haut__pc' }, texte(), h('figure', { class: 'mini-haut__photo' }, img())),
  );
}

/** Les quatre tuiles du haut de l'accueil. */
export function tuiles(i, prixMin) {
  const remise = tuileRemise(i);
  const d = (i.delaiReponse || '').trim();
  const t = (c, fort, faible, cls = '') => h('li', { class: `tuile ${cls}`, style: `--c:var(--${c})` }, h('strong', {}, fort), h('span', {}, faible));
  return h('ul', { class: 'tuiles apercu__tuiles' },
    t('menthe', d.charAt(0).toUpperCase() + d.slice(1), 'Réponse à votre message'),
    t('beurre', i.delaiActuel, 'Délai de réalisation actuel'),
    t('bleu', prixMin ? `Dès ${prixMin} €` : 'Sur devis', 'Pièce personnalisée au prénom'),
    t('prune', remise.titre, remise.texte, 'tuile--prune'),
  );
}

/** L'appel final (bloc beurre) et la ligne de contact. */
export function appelFinal(i) {
  const d = (i.delaiReponse || '').trim();
  return h('div', { class: 'mini-final' },
    h('p', { class: 'mini-final__titre' }, 'Parlons de votre projet'),
    h('p', { class: 'mini-final__coord mono' },
      h('span', {}, telephoneLisible(i.telephone)), h('span', {}, i.email), h('span', {}, `Réponse ${d.charAt(0).toLowerCase()}${d.slice(1)}`)),
    h('p', { class: 'mini-final__btns' }, h('span', { class: 'btn btn--wa btn--petit' }, 'Écrire sur WhatsApp'), h('span', { class: 'btn btn--creux btn--petit' }, 'Demander un devis')),
    h('p', { class: 'mini-final__wa mono' }, `Le bouton WhatsApp écrit au ${telephoneLisible(i.whatsapp || i.telephone)}`),
  );
}

/** Le pied de page et le statut de l'en-tête. */
export function pied(i) {
  const s = texteStatut(i.commandes, i.retourLe);
  const zones = phraseZones(i);
  return h('div', { class: 'mini-pied' },
    h('p', { class: `statut ${s.classe}` }, s.texte),
    h('p', {}, `Broderie machine et couture sur mesure, à ${i.ville} (${BUILD.departement}).`),
    h('p', { class: 'mini-pied__lien' }, i.email),
    h('p', { class: 'mini-pied__lien' }, `Instagram @${BUILD.instagram}`),
    i.facebook ? h('p', { class: 'mini-pied__lien' }, 'Facebook') : null,
    zones ? h('p', {}, `${zones}.`) : h('p', { class: 'at-erreur' }, 'Ni remise en main propre ni envoi : les visiteuses ne sauront pas comment recevoir leur commande.'),
  );
}

/** Horaires lisibles : « lundi : 9 h – 12 h, 14 h – 18 h ». */
export function horairesTexte(hor) {
  if (!hor) return h('p', { class: 'apercu__vide' }, 'Aucun horaire n’est affiché pour l’instant.');
  const heure = (t) => t.replace(/^0/, '').replace(':00', ' h').replace(':', ' h ');
  return h('div', { class: 'mini-horaires' },
    h('p', { class: 'mini-horaires__mode' }, hor.mode === 'rendez-vous' ? 'Retrait sur rendez-vous' : 'Je réponds aux messages'),
    h('dl', {}, Object.entries(hor.jours).map(([j, d]) => [
      h('dt', {}, j.charAt(0).toUpperCase() + j.slice(1)),
      h('dd', {}, d.ferme ? 'Fermé' : d.plages.map((p) => `${heure(p.de)} – ${heure(p.a)}`).join(', ')),
    ])),
  );
}

/** Un avis tel qu'il serait affiché. */
export function avis(a, titres) {
  return h('figure', { class: 'mini-avis' },
    h('blockquote', {}, h('p', {}, `« ${a.texte} »`)),
    h('figcaption', { class: 'mono' }, [a.prenom, a.ville, titres[a.creation]].filter(Boolean).join(' · ')),
  );
}

/** Le cadre « Actuellement / Après » : deux colonnes sur grand écran, l'une sous l'autre sinon. */
export function duo(avant, apres, { identique = false } = {}) {
  /* Rien n'a changé : un seul aperçu, inutile de montrer deux fois la même chose. */
  if (identique) {
    return h('div', { class: 'duo duo--seul' },
      h('section', { class: 'duo__cote', 'aria-hidden': 'true' },
        h('p', { class: 'duo__titre' }, 'Actuellement sur le site · modifiez un champ pour voir le résultat'), avant));
  }
  return h('div', { class: 'duo' },
    h('section', { class: 'duo__cote', 'aria-hidden': 'true' },
      h('p', { class: 'duo__titre' }, 'Actuellement sur le site'), avant),
    h('section', { class: 'duo__cote duo__cote--apres duo__cote--change', 'aria-hidden': 'true' },
      h('p', { class: 'duo__titre' }, 'Après votre modification'), apres),
  );
}
