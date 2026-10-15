/**
 * Réglages du site, intégrés au build.
 *
 * ⚠️ Ce sont des **valeurs de repli**. À terme, tout ce qui est marqué
 * « piloté par l'admin » est lu à l'exécution depuis Netlify Blobs via
 * /api/reglages (voir CLAUDE.md § 5). Si la fonction échoue, le site
 * s'affiche avec les valeurs ci-dessous : jamais de page cassée.
 *
 * ⚠️ TOUT CE QUI SUIT EST PROVISOIRE tant qu'Emma ne l'a pas confirmé.
 * Ne pas mettre le site en production avec ces valeurs.
 */

export const SITE = {
  nom: 'Emma Broderie',
  /** Nom légal, réservé aux mentions légales. */
  nomLegal: 'Emmanuelle Wagner', // [À CONFIRMER]
  baseline: 'Broderie machine & couture · Vitré',
  url: 'https://emma-broderie.fr',
  langue: 'fr',
  ville: 'Vitré',
  codePostal: '35500', // [À CONFIRMER]
  departement: 'Ille-et-Vilaine',
  /** L'adresse précise n'est PAS publiée : Emma travaille chez elle. */
  siret: '[À COMPLÉTER]',
} as const;

export const CONTACT = {
  /** Format international sans + ni espaces, pour wa.me. */
  whatsapp: '33600000000', // [À COMPLÉTER]
  telephone: '+33600000000', // [À COMPLÉTER]
  email: 'bonjour@emma-broderie.fr', // [À COMPLÉTER]
  instagram: 'emma_couture_broderie',
  instagramUrl: 'https://www.instagram.com/emma_couture_broderie/',
} as const;

/** Piloté par l'admin. */
export const ATELIER = {
  /** Affiché en réassurance sur tout le site. */
  delaiActuel: '2 semaines', // [À CONFIRMER]
  delaiReponse: 'Réponse dans la journée', // [À CONFIRMER]
  /** 'ouvertes' | 'complet' | 'conges' */
  commandes: 'ouvertes' as 'ouvertes' | 'complet' | 'conges',
  /** Rempli seulement si commandes === 'conges'. */
  retourLe: '',
  zones: 'Remise en main propre à Vitré et à Rennes, envoi partout en France',
} as const;

/**
 * Message WhatsApp pré-rempli.
 *
 * Depuis une création, on passe l'URL de la fiche : WhatsApp affiche alors
 * une carte d'aperçu avec l'image Open Graph. C'est le seul moyen d'y faire
 * apparaître la photo — le lien wa.me n'accepte aucune pièce jointe
 * (voir CLAUDE.md § « Depuis une création »).
 */
export function lienWhatsApp(message?: string, urlCreation?: string): string {
  const texte = [
    message ?? `Bonjour Emma, je souhaiterais un renseignement pour une broderie personnalisée.`,
    urlCreation,
  ]
    .filter(Boolean)
    .join(' ');
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(texte)}`;
}

/** Téléphone lisible : « 06 00 00 00 00 ». Le lien tel: garde le format international. */
export function telephoneLisible(tel: string = CONTACT.telephone): string {
  const n = tel.replace(/\D/g, '').replace(/^33/, '0');
  return n.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** Libellés uniques des appels à l'action, sur tout le site. */
export const LIBELLES = {
  whatsapp: 'Écrire sur WhatsApp',
  devis: 'Demander un devis',
  laMeme: 'Je veux la même',
  commander: 'Commander sur WhatsApp',
} as const;

/**
 * Le déroulement d'une commande, version canonique (3 étapes).
 * Seule la page Sur-mesure le détaille davantage.
 */
export const ETAPES_COMMANDE = [
  {
    titre: 'Votre demande',
    texte:
      'Précisez-moi le prénom, l’occasion et la date souhaitée, avec une photo d’inspiration si vous en avez une. Je reviens vers vous avec une proposition, un prix et un délai.',
  },
  {
    titre: 'La validation du motif',
    texte:
      'Avant toute réalisation, je vous adresse le motif. Il peut être ajusté autant que nécessaire : tant qu’il n’est pas brodé, tout reste modifiable.',
    cle: true,
  },
  {
    titre: 'La remise',
    texte:
      'Votre pièce est emballée, prête à offrir. Remise en main propre à Vitré ou à Rennes, ou envoi soigné partout en France.',
  },
];

/** Les quatre occasions mises en avant, dans l'ordre d'affichage. */
export const OCCASIONS = [
  { slug: 'naissance', nom: 'Une naissance', liste: 'Doudou, cadre de naissance, bavoir, cape de bain', fil: '#4A6047' },
  { slug: 'mariage', nom: 'Un mariage', liste: 'Pochettes des témoins, mouchoir, dentelle cousue sur la robe', fil: '#6B5560' },
  { slug: 'fete-des-meres', nom: 'La fête des mères', liste: 'Trousse, tablier, serviettes de plage, tambour décoratif', fil: '#A8492A' },
  { slug: 'noel', nom: 'Noël', liste: 'Chaussette de cheminée, pyjama, plaid, boule brodée', fil: '#B03A52' },
] as const;
