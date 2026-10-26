/**
 * Petites règles d'affichage partagées par le site public (reglages.js) et
 * l'admin (aperçus). Aucune dépendance : ce fichier part dans le bundle public.
 */

/** « Commandes ouvertes », « Carnet complet », « En congés jusqu'au 15 janvier ». */
export function texteStatut(commandes, retourLe) {
  if (commandes === 'complet') return { texte: 'Carnet complet', classe: 'statut--complet' };
  if (commandes === 'conges') {
    return { texte: `En congés${retourLe ? ` jusqu'au ${dateLongue(retourLe)}` : ''}`, classe: 'statut--conges' };
  }
  return { texte: 'Commandes ouvertes', classe: '' };
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** '2027-01-15' → '15 janvier' (l'année seulement si ce n'est pas l'année en cours). */
export function dateLongue(iso, aujourdhui = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  const jour = Number(m[3]);
  const texte = `${jour === 1 ? '1er' : jour} ${MOIS[Number(m[2]) - 1]}`;
  return Number(m[1]) === aujourdhui.getFullYear() ? texte : `${texte} ${m[1]}`;
}

/** Liste lisible : « Vitré, Rennes et Châteaubourg ». */
function enumeration(noms) {
  if (noms.length < 2) return noms.join('');
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

function lieuxRemise(i) {
  const lieux = [];
  if (i.remiseVitre) lieux.push('Vitré');
  if (i.remiseRennes) lieux.push('Rennes');
  for (const n of String(i.remiseAutres || '').split(/[,;\n]/)) if (n.trim()) lieux.push(n.trim());
  return lieux;
}

/** Phrase du pied de page : « Remise en main propre à Vitré et à Rennes, envoi partout en France ». */
export function phraseZones(i) {
  const lieux = lieuxRemise(i);
  const remise = lieux.length ? `Remise en main propre à ${enumeration(lieux.map((l, n) => (n ? `à ${l}` : l)))}` : '';
  const envoi = i.envoiFrance ? 'envoi partout en France' : '';
  if (remise && envoi) return `${remise}, ${envoi}`;
  if (remise) return remise;
  return envoi ? 'Envoi partout en France' : '';
}

/**
 * Tuile de l'accueil : titre court + précision. Le titre ne reprend que Vitré
 * et Rennes (deux mots courts) : un nom de commune plus long déborderait du
 * bloc ; les autres communes passent dans la précision.
 */
export function tuileRemise(i) {
  const principales = [i.remiseVitre && 'Vitré', i.remiseRennes && 'Rennes'].filter(Boolean);
  const autres = lieuxRemise(i).filter((l) => !principales.includes(l));
  if (principales.length) {
    return { titre: principales.join(', '), texte: i.envoiFrance ? 'En main propre, ou envoi en France' : 'Remise en main propre' };
  }
  if (autres.length) return { titre: 'En main propre', texte: `${enumeration(autres)}${i.envoiFrance ? ', ou envoi en France' : ''}` };
  return { titre: 'Partout en France', texte: 'Envoi soigné par la poste' };
}

/** '+33612345678' → '06 12 34 56 78' ; autres pays : inchangé. */
export function telephoneLisible(tel) {
  const n = String(tel || '');
  if (!n.startsWith('+33')) return n;
  return `0${n.slice(3)}`.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** Numéro pour wa.me : chiffres seuls, indicatif compris. */
export const numeroWhatsapp = (i) => String(i.whatsapp || i.telephone || '').replace(/\D/g, '');

/** URL d'image en srcset (deux tailles enregistrées par l'admin). */
export const srcsetPhoto = (p) => `${p.petite} ${Math.min(800, p.largeur)}w, ${p.grande} ${p.largeur}w`;
