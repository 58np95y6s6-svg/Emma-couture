/**
 * La barre « Enregistrer » commune à toutes les sections, et le message de
 * confirmation avec « Annuler ce changement ».
 *
 *   const barre = barreEnregistrement(conteneur, {
 *     enregistrer: async () => { … },   // envoie, lève une ErreurAtelier si refus
 *     abandonner: () => { … },          // remet le brouillon à l'état en ligne
 *     apresAnnulation: () => { … },     // recharge l'écran après un retour arrière
 *   });
 *   barre.changement(true | false);
 */
import { h } from './apercus.js';
import { annuler } from './etat.js';

export function barreEnregistrement(parent, { enregistrer, abandonner, apresAnnulation, libelle = 'Enregistrer' }) {
  const etat = h('p', { class: 'barre__etat', role: 'status' }, 'Aucune modification pour l’instant.');
  const bouton = h('button', { class: 'btn btn--wa btn--grand', type: 'button', disabled: true }, libelle);
  const abandon = h('button', { class: 'btn btn--creux', type: 'button', hidden: true }, 'Abandonner mes changements');
  const barre = h('div', { class: 'barre' }, etat, h('div', { class: 'barre__boutons' }, bouton, abandon));

  const annulerBtn = h('button', { class: 'btn btn--creux', type: 'button' }, 'Annuler ce changement');
  const succes = h('div', { class: 'succes', role: 'status', tabindex: '-1', hidden: true },
    h('p', { class: 'succes__titre' }, 'C’est en ligne.'),
    h('p', {}, 'Les visiteuses verront le changement d’ici une minute.'),
    h('p', { class: 'succes__actions' }, annulerBtn, h('a', { class: 'lien-fleche', href: '/', target: '_blank', rel: 'noopener' }, 'Voir mon site')),
  );
  const erreur = h('p', { class: 'at-erreur barre__erreur', role: 'alert', hidden: true });
  parent.append(erreur, succes, barre);

  let modifie = false;
  const majEtat = () => {
    bouton.disabled = !modifie;
    abandon.hidden = !modifie;
    etat.textContent = modifie ? 'Modifications pas encore enregistrées.' : 'Aucune modification pour l’instant.';
    barre.classList.toggle('barre--active', modifie);
  };

  /* Quitter la page avec un brouillon : le navigateur demande confirmation. */
  addEventListener('beforeunload', (e) => {
    if (modifie) { e.preventDefault(); e.returnValue = ''; }
  });

  bouton.addEventListener('click', async () => {
    erreur.hidden = true;
    bouton.disabled = true;
    bouton.textContent = 'Enregistrement…';
    try {
      await enregistrer();
      modifie = false;
      succes.hidden = false;
      annulerBtn.disabled = false;
      annulerBtn.textContent = 'Annuler ce changement';
      succes.focus();
    } catch (e) {
      erreur.textContent = e.message;
      erreur.hidden = false;
      erreur.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } finally {
      bouton.textContent = libelle;
      majEtat();
    }
  });

  abandon.addEventListener('click', () => {
    if (!confirm('Abandonner vos changements ? Le site reste tel qu’il est.')) return;
    abandonner();
    modifie = false;
    erreur.hidden = true;
    majEtat();
  });

  annulerBtn.addEventListener('click', async () => {
    annulerBtn.disabled = true;
    annulerBtn.textContent = 'Retour en arrière…';
    try {
      await annuler();
      succes.hidden = true;
      apresAnnulation();
      etat.textContent = 'Changement annulé : le site est revenu à la version précédente.';
    } catch (e) {
      erreur.textContent = e.message;
      erreur.hidden = false;
      annulerBtn.disabled = false;
      annulerBtn.textContent = 'Annuler ce changement';
    }
  });

  return {
    changement(v) {
      modifie = v;
      if (v) succes.hidden = true;
      majEtat();
    },
  };
}
