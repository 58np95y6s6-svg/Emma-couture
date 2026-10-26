/**
 * Section « Créations mises en avant » : nom, prix, délai, présence sur
 * l'accueil, ordre et photo de chaque création, avec l'aperçu de la rangée
 * de cartes de l'accueil (actuelle / après), mis à jour à chaque frappe.
 */
import { atelierPret } from '../coquille.js';
import * as etat from '../etat.js';
import { h, duo, rangeeAccueil, image, carte, ACCUEIL_MAX } from '../apercus.js';
import { barreEnregistrement } from '../enregistrement.js';
import { preparerPhoto, envoyerPhoto } from '../photo.js';

const $ = (id) => document.getElementById(id);
const liste = $('liste');
let brouillon = []; // copie de etat.creationsEnLigne(), dans l'ordre choisi
const lignes = new Map(); // slug → { li, champs… }

const cle = (c) => JSON.stringify([c.slug, c.titre.trim(), c.prix, c.delai, c.visible, c.photoReglee?.grande ?? null, Boolean(c.preparee)]);
const modifiees = () => {
  const avant = new Map(etat.creationsEnLigne().map((c) => [c.slug, cle(c)]));
  return new Set(brouillon.filter((c) => avant.get(c.slug) !== cle(c)).map((c) => c.slug));
};
const identique = () =>
  modifiees().size === 0 && etat.creationsEnLigne().map((c) => c.slug).join() === brouillon.map((c) => c.slug).join();

/** « 32 » → 32 ; « » → null ; « 32,50 » → erreur. */
function lireEntier(valeur, { min, max }) {
  const v = valeur.trim().replace(/\s|€/g, '');
  if (!v) return { valeur: null };
  if (!/^\d+$/.test(v)) return { erreur: 'Écrivez un nombre entier, sans virgule ni symbole.' };
  const n = Number(v);
  if (n < min) return { erreur: `Au moins ${min}.` };
  if (n > max) return { erreur: `${max} au maximum.` };
  return { valeur: n };
}

function rendreApercu() {
  const pourApercu = brouillon.map((c) => ({ ...c, titre: c.titre.trim() || c.titreBuild, apercuLocal: c.preparee?.apercu }));
  $('apercu').replaceChildren(
    duo(rangeeAccueil(etat.creationsEnLigne()), rangeeAccueil(pourApercu, { modifiees: modifiees() }), { identique: identique() }),
  );
  const nbVisibles = brouillon.filter((c) => c.visible).length;
  $('compte').textContent = nbVisibles > ACCUEIL_MAX
    ? `${nbVisibles} créations cochées : seules les ${ACCUEIL_MAX} premières apparaissent sur l'accueil.`
    : `${nbVisibles} création${nbVisibles > 1 ? 's' : ''} sur l'accueil (${ACCUEIL_MAX} au maximum).`;
  let rang = 0;
  brouillon.forEach((c, i) => {
    const l = lignes.get(c.slug);
    if (c.visible) rang++;
    l.position.textContent = !c.visible ? 'Pas sur l’accueil' : rang <= ACCUEIL_MAX ? `${rang}${rang === 1 ? 're' : 'e'} sur l’accueil` : `${rang}e : n’apparaît pas`;
    l.position.classList.toggle('ed__position--hors', !c.visible || rang > ACCUEIL_MAX);
    l.monter.disabled = i === 0;
    l.descendre.disabled = i === brouillon.length - 1;
    l.resume.textContent = [c.prix ? `dès ${c.prix} €` : 'Sur devis', c.delai ? `${c.delai} jours` : null].filter(Boolean).join(' · ');
    l.nom.textContent = c.titre.trim() || c.titreBuild;
    l.vignette.replaceChildren(image(c.photoReglee, c.photo, { sizes: '64px', apercuLocal: c.preparee?.apercu }));
    l.origine.hidden = !(c.photoReglee || c.preparee);
    const modif = modifiees().has(c.slug);
    l.li.classList.toggle('ed--modifiee', modif);
    if (!l.apercuCarte.closest('[hidden]')) {
      const avant = etat.creationsEnLigne().find((x) => x.slug === c.slug);
      const apres = { ...c, titre: c.titre.trim() || c.titreBuild, apercuLocal: c.preparee?.apercu };
      l.apercuCarte.replaceChildren(duo(carte(avant), carte(apres), { identique: !modif }));
    }
  });
  const erreurs = brouillon.some((c) => c.erreurs && Object.keys(c.erreurs).length);
  barre.changement(!identique() || erreurs);
}

function champ({ nom, aide, valeur, attrs = {}, surSaisie }) {
  const id = `c${Math.random().toString(36).slice(2, 9)}`;
  const input = h('input', { id, value: valeur ?? '', 'aria-describedby': `${id}-a ${id}-e`, ...attrs });
  const erreur = h('span', { class: 'at-champ__erreur', id: `${id}-e`, role: 'alert' });
  input.addEventListener('input', () => {
    const msg = surSaisie(input.value);
    erreur.textContent = msg ?? '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  });
  return h('label', { class: 'at-champ', for: id },
    h('span', { class: 'at-champ__nom' }, nom),
    aide ? h('span', { class: 'at-champ__aide', id: `${id}-a` }, aide) : null,
    input, erreur);
}

function ligne(c) {
  c.erreurs = {};
  const nom = h('span', { class: 'ed__nom' });
  const resume = h('span', { class: 'ed__resume mono' });
  const position = h('span', { class: 'ed__position' });
  const vignette = h('span', { class: 'ed__vignette' });
  const monter = h('button', { class: 'btn btn--creux ed__bouge', type: 'button', 'aria-label': `Monter « ${c.titre} »` }, '↑', h('span', {}, 'Monter'));
  const descendre = h('button', { class: 'btn btn--creux ed__bouge', type: 'button', 'aria-label': `Descendre « ${c.titre} »` }, '↓', h('span', {}, 'Descendre'));
  const ouvrir = h('button', { class: 'ed__ouvrir', type: 'button', 'aria-expanded': 'false' }, 'Modifier');
  const corps = h('div', { class: 'ed__corps', hidden: true });

  const fichier = h('input', { type: 'file', accept: 'image/*' });
  const erreurPhoto = h('p', { class: 'at-erreur', role: 'alert', hidden: true });
  const origine = h('button', { class: 'btn btn--creux', type: 'button', hidden: true }, 'Revenir à la photo d’origine');
  const visible = h('input', { type: 'checkbox', checked: c.visible });
  const apercuCarte = h('div', { class: 'ed__apercu' });

  corps.append(
    champ({
      nom: 'Nom affiché', valeur: c.titre, attrs: { maxlength: 70, autocomplete: 'off' },
      surSaisie: (v) => {
        c.titre = v;
        const msg = v.trim().length < 2 ? 'Le nom ne peut pas être vide.' : null;
        if (msg) c.erreurs.titre = msg; else delete c.erreurs.titre;
        rendreApercu();
        return msg;
      },
    }),
    h('div', { class: 'ed__deux' },
      champ({
        nom: 'Prix à partir de (en euros)', aide: 'Laissez vide pour afficher « Sur devis ».', valeur: c.prix,
        attrs: { inputmode: 'numeric', autocomplete: 'off', placeholder: 'Sur devis' },
        surSaisie: (v) => {
          const r = lireEntier(v, { min: 1, max: 5000 });
          if (r.erreur) c.erreurs.prix = r.erreur; else { delete c.erreurs.prix; c.prix = r.valeur; }
          rendreApercu();
          return r.erreur;
        },
      }),
      champ({
        nom: 'Délai de réalisation (en jours)', aide: 'Laissez vide pour ne rien afficher.', valeur: c.delai,
        attrs: { inputmode: 'numeric', autocomplete: 'off' },
        surSaisie: (v) => {
          const r = lireEntier(v, { min: 1, max: 365 });
          if (r.erreur) c.erreurs.delai = r.erreur; else { delete c.erreurs.delai; c.delai = r.valeur; }
          rendreApercu();
          return r.erreur;
        },
      }),
    ),
    apercuCarte,
    h('label', { class: 'at-coche at-coche--grande' }, visible, h('span', {}, 'Afficher sur la page d’accueil')),
    h('div', { class: 'ed__photo' },
      h('p', { class: 'at-champ__nom' }, 'Photo principale'),
      h('div', { class: 'at-boutons' }, h('label', { class: 'btn btn--creux at-fichier' }, fichier, 'Remplacer la photo'), origine),
      erreurPhoto,
    ),
  );

  visible.addEventListener('change', () => { c.visible = visible.checked; rendreApercu(); });
  fichier.addEventListener('change', async () => {
    const f = fichier.files?.[0];
    fichier.value = '';
    if (!f) return;
    erreurPhoto.hidden = true;
    try { c.preparee = await preparerPhoto(f); } catch (e) { erreurPhoto.textContent = e.message; erreurPhoto.hidden = false; }
    rendreApercu();
  });
  origine.addEventListener('click', () => { c.photoReglee = null; c.preparee = null; rendreApercu(); });
  ouvrir.addEventListener('click', () => {
    const ouvert = ouvrir.getAttribute('aria-expanded') !== 'true';
    ouvrir.setAttribute('aria-expanded', String(ouvert));
    ouvrir.textContent = ouvert ? 'Fermer' : 'Modifier';
    corps.hidden = !ouvert;
    if (ouvert) rendreApercu();
  });
  const bouger = (sens, bouton) => {
    const i = brouillon.indexOf(c);
    const j = i + sens;
    if (j < 0 || j >= brouillon.length) return;
    [brouillon[i], brouillon[j]] = [brouillon[j], brouillon[i]];
    const li = lignes.get(c.slug).li;
    if (sens < 0) liste.insertBefore(li, li.previousElementSibling);
    else liste.insertBefore(li.nextElementSibling, li);
    rendreApercu();
    (bouton.disabled ? (sens < 0 ? descendre : monter) : bouton).focus();
  };
  monter.addEventListener('click', () => bouger(-1, monter));
  descendre.addEventListener('click', () => bouger(1, descendre));

  const li = h('li', { class: `ed carte--${c.categorie}` },
    h('div', { class: 'ed__tete' },
      vignette,
      h('div', { class: 'ed__infos' }, nom, resume, position),
      h('div', { class: 'ed__actions' }, monter, descendre, ouvrir),
    ),
    corps,
  );
  lignes.set(c.slug, { li, nom, resume, position, vignette, monter, descendre, origine, apercuCarte });
  return li;
}

function construire() {
  brouillon = etat.creationsEnLigne().map((c) => ({ ...c, titreBuild: etat.TITRES_BUILD[c.slug], preparee: null }));
  lignes.clear();
  liste.replaceChildren(...brouillon.map(ligne));
  rendreApercu();
}

const barre = barreEnregistrement($('zone-enregistrer'), {
  async enregistrer() {
    const fautive = brouillon.find((c) => Object.keys(c.erreurs).length);
    if (fautive) {
      const l = lignes.get(fautive.slug);
      if (l.li.querySelector('.ed__corps').hidden) l.li.querySelector('.ed__ouvrir').click();
      l.li.querySelector('[aria-invalid="true"]')?.focus();
      throw new Error(`Corrigez d’abord « ${fautive.titre.trim() || fautive.titreBuild} » : ${Object.values(fautive.erreurs)[0]}`);
    }
    for (const c of brouillon) {
      if (c.preparee) {
        c.photoReglee = await envoyerPhoto(c.preparee);
        c.preparee = null;
      }
    }
    await etat.enregistrer({ creations: etat.versReglages(brouillon.map((c) => ({ ...c, titre: c.titre.trim() }))) });
    construire();
  },
  abandonner: construire,
  apresAnnulation: construire,
});

(async () => {
  await atelierPret;
  try {
    await etat.charger();
    $('section').hidden = false;
    construire();
  } catch (e) {
    $('erreur-chargement').textContent = e.message;
    $('erreur-chargement').hidden = false;
  }
})();
