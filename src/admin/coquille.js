/**
 * Coquille commune aux pages de l'atelier : vérification de la session,
 * écran de connexion, bandeau hors ligne, service worker.
 * Les scripts de page attendent `atelierPret` avant de charger les données.
 */
import { appel } from './api.js';

const $ = (id) => document.getElementById(id);
const chargement = $('at-chargement');
const ecran = $('at-connexion');
const contenu = $('at-contenu');
const form = $('at-connexion-form');
const erreur = $('at-connexion-erreur');

let pret;
export const atelierPret = new Promise((r) => { pret = r; });
let dejaPret = false;

function montrerConnexion(message) {
  chargement.hidden = true;
  ecran.hidden = false;
  /* Session expirée en cours de travail : le formulaire reste dessous, intact. */
  contenu.inert = true;
  contenu.classList.add('at-contenu--voile');
  if (dejaPret) contenu.hidden = false;
  if (message) $('at-connexion-intro').textContent = message;
  form.motDePasse.focus();
}

function montrerContenu() {
  chargement.hidden = true;
  ecran.hidden = true;
  contenu.hidden = false;
  contenu.inert = false;
  contenu.classList.remove('at-contenu--voile');
  if (!dejaPret) { dejaPret = true; pret(); }
}

$('at-voir-mdp').addEventListener('change', (e) => {
  form.motDePasse.type = e.target.checked ? 'text' : 'password';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erreur.hidden = true;
  const bouton = form.querySelector('button');
  if (!form.motDePasse.value) {
    erreur.textContent = 'Écrivez votre mot de passe.';
    erreur.hidden = false;
    return;
  }
  bouton.disabled = true;
  bouton.textContent = 'Vérification…';
  try {
    await appel('/api/connexion', { methode: 'POST', corps: { motDePasse: form.motDePasse.value } });
    form.reset();
    form.motDePasse.type = 'password';
    montrerContenu();
  } catch (err) {
    erreur.textContent = err.message;
    erreur.hidden = false;
    form.motDePasse.select();
  } finally {
    bouton.disabled = false;
    bouton.textContent = 'Entrer dans mon atelier';
  }
});

document.addEventListener('atelier:session-expiree', () =>
  montrerConnexion('Par sécurité, votre session a expiré. Entrez à nouveau votre mot de passe : vos modifications en cours sont conservées.'),
);

/* Bandeau hors ligne. */
const bandeau = $('at-hors-ligne');
const majReseau = () => { bandeau.hidden = navigator.onLine; };
addEventListener('online', majReseau);
addEventListener('offline', majReseau);
majReseau();

/* Déconnexion (bouton présent sur le menu). */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-deconnexion]');
  if (!b) return;
  b.disabled = true;
  try { await appel('/api/deconnexion', { methode: 'POST' }); } catch { /* on déconnecte quand même l'écran */ }
  dejaPret = false;
  contenu.hidden = true;
  montrerConnexion('Vous êtes déconnectée. À bientôt.');
  b.disabled = false;
});

/* Service worker : coquille hors ligne uniquement, jamais les données. */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/atelier-mqu3gf/sw.js', { scope: '/atelier-mqu3gf/' }).catch(() => {});
}

(async () => {
  try {
    const s = await appel('/api/session');
    if (s?.connectee) return montrerContenu();
    montrerConnexion(s?.configuree === false ? "L'atelier n'est pas encore configuré : le mot de passe doit d'abord être enregistré dans Netlify par la personne qui a créé votre site." : undefined);
  } catch (err) {
    chargement.textContent = err.message;
    chargement.classList.add('at-erreur');
  }
})();
