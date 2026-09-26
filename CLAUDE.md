# Projet : emma-broderie.fr

## Contexte
Site internet pour Emma, brodeuse auto-entrepreneuse (micro-entreprise, CA modeste), basée à **Vitré (35)**.
Emma travaille seule, n'est pas à l'aise avec la technologie ni avec le commerce en général.
Le site doit donc être **à la fois très beau et très utile** : il vend à sa place, et l'outil
d'administration doit être aussi simple qu'une appli de messagerie.

Contrainte principale : **coût minimal** (seul le nom de domaine est payant, ~10 €/an).
Aucun service tiers payant ou à abonnement. **Pas de Brevo** (ni autre outil d'emailing) pour ce projet.

Zone : **SEO local Vitré + Rennes + alentours (Ille-et-Vilaine)** en priorité, **toute la France** en second
(envoi postal des créations).

## Objectif n°1 : la CONVERSION
Chaque page doit amener la visiteuse à passer à l'action. Deux canaux prioritaires :
1. **WhatsApp** (canal le plus naturel sur mobile)
2. **Email** : formulaire de demande de projet (+ liste de contacts pour des envois ponctuels, voir « Mailing »)

Règles de conversion :
- Bouton WhatsApp flottant sur mobile (discret, toujours accessible), lien `https://wa.me/33XXXXXXXXX`
  avec **message pré-rempli** selon la page (ex. depuis une création : « Bonjour Emma, j'ai vu
  "[titre]" sur votre site et j'aimerais un modèle similaire »).
- Un appel à l'action clair par écran sur l'accueil, sans surcharger.
- Formulaire de demande **guidé en étapes courtes** (pas un long formulaire intimidant) :
  type de projet → occasion (naissance, mariage, anniversaire, Noël…) → date souhaitée →
  budget indicatif (fourchettes) → texte à broder → photo d'inspiration (optionnelle) → coordonnées
  → « Comment préférez-vous être recontacté·e ? » (WhatsApp / email / téléphone).
- Page de remerciement après envoi : délai de réponse annoncé + bouton WhatsApp.
- **Prix « à partir de »** visibles sur les créations et la page Sur-mesure : c'est la première question
  des client·es ; les sites d'artisans qui convertissent l'affichent.
- Preuve sociale : avis clients (saisis par Emma dans l'admin), nombre de créations réalisées.
- Réassurance : délai de fabrication actuel, « brodé à la main à Vitré », remise en main propre
  (Vitré / Rennes) ou envoi partout en France, emballage cadeau.

## Mailing (sans outil d'emailing)
- Inscription « Être prévenu·e des nouveautés et des dates de commande de Noël » via **Netlify Forms**
  (gratuit), case de consentement explicite non pré-cochée, lien vers la politique de confidentialité.
- Les inscrit·es apparaissent dans l'admin (liste + export CSV + désinscription en un geste).
- Envoi : Emma écrit depuis sa propre messagerie, **destinataires en Cci**, avec une phrase de
  désinscription (« répondez STOP »). Suffisant pour quelques envois par an à une petite liste.
  Au-delà d'environ 100 destinataires, la délivrabilité se dégrade : on rediscutera d'une solution.
- Alternative gratuite pour la clientèle locale : **listes de diffusion WhatsApp Business**
  (seules les personnes qui ont enregistré le numéro d'Emma reçoivent les messages).
- L'admin propose des **modèles de messages saisonniers** prêts à copier (Noël, fête des mères…).

## Périmètre
- Site vitrine + **espace d'administration secret en PWA**, **sans boutique en ligne** pour l'instant.
- Évolution possible plus tard : paiement via liens Stripe (Payment Links), sans backend.
  Si une boutique est ajoutée : prévoir CGV + médiateur de la consommation (obligatoire en B2C).

## Stack technique
- **Astro** (génération statique, zéro JS par défaut ; JS uniquement pour les animations et l'admin)
- **Contenu en Markdown / JSON** via les Content Collections d'Astro pour les créations et le journal
- **Images** dans le projet, optimisées avec `astro:assets` (WebP/AVIF, tailles responsives)
- **Hébergement : Netlify** (plan gratuit, usage commercial autorisé)
- **Formulaires : Netlify Forms** (demandes de projet + inscriptions, anti-spam honeypot)
- **Données dynamiques de l'admin : Netlify Functions + Netlify Blobs** (pas de base de données externe,
  pas de Supabase)
- **Nom de domaine** : emma-broderie.fr (registrar : [À COMPLÉTER]), pointé vers Netlify
- **Git en local** pour l'historique (pas de GitHub obligatoire)
- ⚠️ Ne pas utiliser Vercel : le plan gratuit interdit l'usage commercial.

### Budget Netlify (plan gratuit = 300 crédits/mois, limite stricte)
Vérifié en septembre 2026 :
- Un **déploiement en production coûte 15 crédits** → ~20 déploiements/mois au maximum, bande passante
  et appels de fonctions inclus dans le même budget.
- Les **soumissions de formulaires sont gratuites et illimitées**.
- Les **Deploy Previews sont gratuites**, les déploiements échoués aussi.
- Si les crédits sont épuisés, **le site est mis en pause** jusqu'au mois suivant.

Conséquences obligatoires :
- **Tout ce qu'Emma modifie depuis l'admin ne doit JAMAIS déclencher un rebuild.** Les réglages
  (bannière événement, téléphone, délais, avis…) sont stockés dans Netlify Blobs et lus à
  l'exécution (fonction avec cache CDN), pas intégrés au build.
- Le suivi statistique (voir Admin) doit rester très léger : un seul petit appel groupé par visite,
  jamais un appel par action.
- Valider les modifications de développement en **Deploy Preview** (`netlify deploy`), et regrouper
  les mises en production (`--prod`). Viser **10 déploiements prod/mois maximum**.
- Surveiller la consommation dans le tableau de bord Netlify (Usage & billing).

## Workflow de travail
Je travaille en local. Après chaque modification validée :
1. Vérifier que `npm run build` passe sans erreur.
2. Faire un commit Git avec un message clair.
3. Déployer une prévisualisation : `netlify deploy --dir=dist` et me donner l'URL de preview.
4. Quand je valide (ou en fin de lot de modifications) : `netlify deploy --prod --dir=dist`.
5. Me donner l'URL et un résumé de ce qui a changé, ainsi que le nombre de déploiements prod du mois.

Si le build échoue, ne pas déployer : corriger d'abord.

## Photos : tri, sélection, retouche
Emma va fournir une **grande base de photos** (téléphone, qualité variable). Claude est chargé de :
1. **Inventaire** : planches contact numérotées, détection des doublons, des photos floues,
   sous-exposées ou mal cadrées.
2. **Sélection** : proposer une présélection par usage (portrait d'Emma pour le hero, créations
   phares, détails macro du fil, étapes de fabrication, atelier/ambiance), **validée par Emma** avant
   utilisation.
3. **Recadrage** multi-formats avec direction artistique (`<picture>`) :
   - hero : 4:5 mobile et 16:9 ordinateur (le visage d'Emma jamais coupé) ;
   - galerie : 4:5 ; détail : 1:1 ; partage réseaux (Open Graph) : 1200×630.
4. **Retouche légère et fidèle** : redressement, exposition, balance des blancs, netteté, nettoyage
   de poussières. **Les couleurs des fils et des tissus doivent rester fidèles à la réalité** (la
   cliente doit recevoir ce qu'elle a vu). Aucune génération ni invention de broderie par IA.
   Détourage ou changement de fond uniquement sur demande.
5. **Confidentialité** : suppression systématique des métadonnées EXIF, **notamment la position GPS**
   (les photos prises à domicile révèlent l'adresse). Visages de clients ou d'enfants : pas de
   publication sans accord écrit, sinon flouter ou recadrer.
6. **Nommage SEO** des fichiers (`tambour-brode-prenom-naissance-vitre.jpg`) et proposition de texte
   alternatif descriptif pour chaque image retenue.

Organisation :
- Originaux dans `photos-originales/` (**hors Git**, ajouté au `.gitignore` : trop lourd) ;
  sélection retouchée (max ~2400 px de large) dans `src/assets/`, versionnée.
- Traitement par script (`sharp`) pour être reproductible ; journal des retouches par photo.
- Grosse volumétrie : travailler dossier par dossier (Claude Code en local), pas tout d'un coup.

## Stratégie SEO & plan de site
### Constat concurrentiel (recherche septembre 2026)
- **National** : les sites de broderie personnalisée les plus visibles sont des **boutiques de textile
  brodé à la machine** (peignoirs, doudous, serviettes au prénom), avec des centaines de fiches produit.
  Inutile de les attaquer frontalement sur « serviette brodée prénom ».
- Les **artisans de broderie main** qui se positionnent bien jouent sur la **pièce unique sur-mesure** :
  tambour brodé personnalisé, portrait brodé (y compris d'après un dessin d'enfant), cadre de naissance.
  Leurs pages qui convertissent ont toutes : format précis, délai, prix « à partir de », étapes de
  commande, formulaire de devis, ville d'origine mise en avant, emballage cadeau.
- **Local** : à Rennes et autour de Vitré, les résultats sont dominés par des **ateliers de marquage
  pour entreprises** (logos brodés sur vêtements de travail). La **broderie main cadeau pour
  particuliers** y est peu occupée → vraie opportunité. Certains concurrents créent une page dédiée
  « broderie personnalisée à Rennes » même situés loin : le format page locale fonctionne.
- Limite : les chiffres de trafic des concurrents ne sont pas publics ; ce constat repose sur qui se
  positionne et comment. À valider après lancement avec Google Search Console
  (+ Google Keyword Planner, gratuit, pour les volumes).

### Mots-clés (à ajuster selon les types de broderie confirmés)
- **Local** : brodeuse Vitré, broderie Vitré, broderie personnalisée Rennes, broderie main Rennes,
  cadeau personnalisé Vitré, cadeau fait main Rennes, cadeau naissance Rennes.
- **National (longue traîne, pièce unique)** : broderie main personnalisée, tambour brodé personnalisé,
  cadeau naissance brodé main, portrait brodé personnalisé, broderie d'après dessin d'enfant,
  prénom brodé à la main, cadeau brodé fête des mères, cadeau mariage brodé.
- Chaque page cible **une** intention principale ; pas de cannibalisation entre pages.

### Arborescence
```
/                                   Accueil
/creations/                         Galerie (filtres par catégorie)
/creations/[categorie]/             ex. tambours-brodes, naissance, linge, portraits
/creations/[slug]/                  Fiche création (photos, prix « à partir de », délai, CTA)
/cadeaux/naissance/                 Pages occasions (landing SEO + conversion)
/cadeaux/mariage/
/cadeaux/fete-des-meres/
/cadeaux/noel/
/sur-mesure/                        Comment commander : étapes, délais, prix, FAQ
/brodeuse-vitre/                    Page locale Vitré (atelier, remise en main propre, marchés)
/broderie-personnalisee-rennes/     Page locale Rennes (contenu réel : livraison, rendez-vous…)
/l-atelier/                         Histoire d'Emma, savoir-faire, fabrication
/journal/                           Articles (idées cadeaux, entretien d'une broderie…)
/contact/
/merci/                             (noindex)
/mentions-legales/
/politique-de-confidentialite/
```
- Démarrer avec **4 pages occasions** et **2 pages locales** au maximum, chacune avec un contenu
  réellement différent. Pas de pages « ville » en série pour chaque commune (considéré comme du spam
  par Google) : les communes alentours sont citées dans les pages locales et dans `areaServed`.
- Pages occasions mises en avant 4 à 6 semaines avant chaque fête (lien avec la bannière événement).
- Journal : 1 article par mois suffit, publié avant les temps forts (ex. « Quel cadeau brodé pour
  une naissance ? » en continu, « Commandes de Noël : jusqu'à quand ? » en octobre).

### Règles techniques SEO
- Titre et meta description uniques par page, URLs lisibles en français
- Balises Open Graph pour le partage (image OG soignée par page / par création)
- `@astrojs/sitemap` + `robots.txt`
- JSON-LD : `LocalBusiness` sur toutes les pages (adresse Vitré, `areaServed` : Vitré, Rennes,
  Ille-et-Vilaine, France ; horaires ; lien WhatsApp/tél) ; `CreativeWork` ou `Product` pour les
  créations ; `FAQPage` sur Sur-mesure (utile pour les moteurs IA, même sans extrait enrichi Google) ;
  `BreadcrumbList` ; `Review` / `AggregateRating` uniquement si les avis sont réels et affichés
- Textes alternatifs descriptifs sur toutes les images
- Structure de titres propre (un seul H1 par page)
- Maillage interne : chaque création renvoie vers son occasion et la page Sur-mesure
- Viser d'excellents scores Lighthouse (performance, accessibilité, SEO), **animations comprises**

### Hors site (le levier n°1 en local)
- **Fiche Google Business Profile** (catégorie « Brodeur » ou proche), photos régulières, et surtout
  **demande d'avis systématique** après chaque vente (modèle de message + lien direct dans l'admin).
- Google Search Console, lien du site dans Instagram/Facebook, annuaires locaux (mairie de Vitré,
  office de tourisme, créateurs d'Ille-et-Vilaine), marchés de créateurs.
- QR code vers le site (avec `?utm_source=marche` / `?utm_source=etiquette`) sur les étiquettes et le
  stand, pour mesurer ce qui marche.

## Pages : contenu
- **Accueil** :
  - En haut : **photo d'Emma** (portrait lumineux, en train de broder ou dans l'atelier) + accroche
    personnelle à la première personne. Montrer l'humain : ce n'est pas une usine.
  - Animation signature au scroll (voir « Animations »).
  - Plus belles créations, occasions, avis clients, « Comment ça marche » en 3 étapes
    (je vous écoute → je brode → vous offrez), appel à l'action WhatsApp + formulaire.
  - Bannière événement optionnelle (voir Admin).
- **Créations** : une entrée Markdown par création (titre, description, photos, catégorie, occasion(s),
  prix « à partir de » optionnel, délai). Boutons « Je veux la même » (WhatsApp pré-rempli) et
  « Demander un devis » (formulaire pré-rempli).
- **Sur-mesure** : étapes, délais, fourchettes de prix, entretien, livraison, FAQ.
- **L'atelier / À propos** : histoire d'Emma, savoir-faire, étapes de fabrication en images.
- **Contact** : formulaire guidé + WhatsApp + zone géographique + liens réseaux sociaux.

## Design
- Direction à définir ensemble. Je ne veux PAS d'un site au look « template artisanal » générique.
- Principes : moderne et élégant, beaucoup d'espace, les photos des broderies au centre,
  typographie soignée, **chaleur humaine** (photo d'Emma, textes à la première personne).
- Mobile first (la majorité des visites viendra du téléphone).
- Proposer 2 ou 3 pistes visuelles (palette + typographies + mise en page d'accueil + principe
  d'animation) **sous forme de maquettes visuelles**, avant de tout construire.

### Responsive : exigence non négociable
Le site doit être irréprochable sur **toutes** les tailles d'écran, pas seulement « acceptable »
sur téléphone. Aucune page ne part en production sans avoir été vérifiée aux largeurs suivantes.

- **320 px** (iPhone SE, vieux Android) : plus petit cas à supporter. Rien ne doit déborder.
- **390 px** (iPhone courant) : c'est la largeur de référence du design.
- **768 px** (tablette, portrait) : ne jamais laisser une mise en page téléphone s'étirer bêtement.
- **1024 px** (tablette paysage, petit portable).
- **1440 px et au-delà** : le contenu se cale sur une largeur maximale, il ne s'étale pas
  sur toute la dalle.

Règles :
- **Jamais de défilement horizontal du corps de page**, à aucune largeur. Les contenus larges
  (tableaux, galeries, blocs de code) défilent dans leur propre conteneur `overflow-x: auto`.
- Mise en page en **flex / grid avec `gap`**, unités relatives, `max-width: 100%` sur les images.
  Pas de largeur fixe en pixels sur un bloc de contenu.
- **Zones tactiles d'au moins 44 × 44 px** (boutons, liens du menu, champs de formulaire,
  bouton WhatsApp flottant), avec assez d'espace entre elles pour ne pas se tromper au pouce.
- Le texte reste lisible sans zoomer : 16 px minimum pour le texte courant sur téléphone
  (en dessous, iOS zoome automatiquement sur les champs de formulaire).
- Le site doit rester utilisable **jusqu'à 200 % de zoom navigateur** (critère d'accessibilité).
- **Direction artistique des images** selon la largeur (`<picture>`), pas un simple
  redimensionnement : le cadrage change entre téléphone et ordinateur.
- Tenir compte des **encoches et barres système** (`viewport-fit=cover` + `env(safe-area-inset-*)`)
  pour le bouton WhatsApp flottant et les barres fixes.
- **Orientation paysage** sur téléphone : vérifier que le haut de page ne mange pas tout l'écran.
- Vérifier aussi l'**administration PWA** aux mêmes largeurs : Emma s'en servira au téléphone,
  parfois d'une seule main.

Vérification : contrôler chaque page aux cinq largeurs ci-dessus avant tout déploiement en
production, et signaler tout point qui n'a pas pu être testé.

## Animations
Objectif : un site mémorable, qui donne envie de partager, sans sacrifier la performance.
- **Animation signature : un fil qui se brode au fil du scroll.** Un tracé SVG (point avant / point
  de tige) se dessine au fur et à mesure que l'on descend, avec une aiguille qui suit le tracé, et
  peut relier les sections entre elles ou former un motif (fleur, initiale « E »…).
  Technique : `stroke-dasharray` / `stroke-dashoffset` piloté par les **CSS scroll-driven animations**
  (`animation-timeline`), avec un petit script de repli pour les navigateurs non compatibles.
- Autres idées à proposer : apparitions douces des photos, effet « tambour à broder » (cercle) qui
  cadre les images, point de croix qui se remplit au survol/tap, curseur « aiguille » sur ordinateur.
- Contraintes :
  - Respecter `prefers-reduced-motion` (tracé affiché directement, sans mouvement).
  - Animer uniquement `transform`, `opacity` et les propriétés SVG (pas de reflow).
  - Pas de grosse librairie d'animation sans justification (le poids JS compte pour Lighthouse).
  - Les animations ne doivent jamais masquer le contenu ou retarder l'affichage du H1.

## Administration (PWA secrète) — pour Emma
Une petite application installable sur son téléphone (icône sur l'écran d'accueil), en français,
avec de gros boutons et zéro jargon.

### Secret et sécurité
- **Adresse non devinable** (ex. `/atelier-k7x2m9/`, valeur définie une fois et jamais publiée),
  aucun lien depuis le site public, absente du sitemap.
- **Ne PAS la mentionner dans `robots.txt`** (ce fichier est public et la révélerait) : utiliser
  l'en-tête `X-Robots-Tag: noindex, nofollow` sur ce chemin (`netlify.toml`) + balise meta noindex.
- Code de l'admin dans un bundle séparé, jamais chargé ni référencé par les pages publiques.
- La discrétion de l'adresse n'est qu'une couche en plus : **la vraie protection est côté serveur**.
  Toutes les fonctions de données exigent une session valide.
- Mot de passe stocké haché en variable d'environnement Netlify ; session via cookie `HttpOnly`,
  `Secure`, `SameSite=Strict` signé ; limitation des tentatives ; déconnexion en un geste.
- Jeton de l'API Netlify uniquement côté fonctions, jamais côté client.

### 1. Tableau de bord : indicateurs de succès
Page d'accueil de l'admin, lisible en 5 secondes (grands chiffres, flèches ↑↓ vs période précédente,
graphiques simples), filtre semaine / mois / année :
- **Contacts reçus**, total et **par canal** :
  - formulaire (email), clic WhatsApp, clic email (`mailto`), clic téléphone ;
  - saisie manuelle par Emma pour les contacts arrivés hors site : WhatsApp direct, Instagram,
    Facebook, marché, bouche-à-oreille.
  - ⚠️ Un clic WhatsApp n'est pas forcément une conversation : l'afficher comme « clics WhatsApp »,
    et Emma peut convertir un clic en contact réel quand la personne lui écrit.
- **Ventes** : nombre, **chiffre d'affaires**, panier moyen, **taux de conversion** (contacts → ventes)
  global et **par canal**, délai moyen entre demande et vente.
- **Ce qui marche** : top créations et occasions demandées, CA par occasion, provenance des visites
  (Google, Instagram, Facebook, QR code marché, direct), pages qui génèrent le plus de contacts.
- **Visites** : compteur simple et approximatif (pages vues, visiteurs du jour), sans cookie, sans
  donnée personnelle, agrégé par jour.
- **Objectif du mois** : Emma fixe un objectif de CA, barre de progression.
- Mesure technique : un petit `sendBeacon` groupé vers une fonction, compteurs agrégés dans Blobs,
  ni cookie ni identifiant (pas de bandeau nécessaire). Chiffres présentés comme indicatifs.

### 2. Demandes de contact (boîte de réception)
- Liste des demandes (depuis Netlify Forms, via l'API Netlify appelée par une fonction) + contacts
  ajoutés à la main.
- Statut simple : Nouveau → En discussion → Devis envoyé → En cours → **Vendu** / Perdu,
  + note libre.
- **Marquer comme vendu** : montant (€), date, création/occasion, mode de paiement ; plusieurs ventes
  possibles pour un même contact (clientèle fidèle).
- Boutons d'action en un geste : répondre sur **WhatsApp**, **appeler**, **envoyer un email**.
- **Réponses toutes prêtes** (modèles modifiables : accusé de réception, devis, relance,
  remerciement + demande d'avis Google) avec les champs de la demande insérés automatiquement.
- Pastille « à relancer » si une demande est sans réponse depuis plus de 3 jours.

### 3. Carnet de contacts
- Tous les contacts regroupés (dédoublonnés par email/téléphone), historique des demandes et achats,
  total dépensé.
- Inscrit·es au mailing (avec date du consentement), désinscription en un geste.
- Export CSV.
- **Suppression d'un contact** (droit à l'effacement RGPD).

### 4. Livre des recettes
- Obligatoire en micro-entreprise : liste chronologique des ventes (date, client, nature, montant,
  mode de règlement), générée automatiquement à partir des ventes saisies, export CSV/impression.
- Mention claire : c'est une aide, qui ne remplace ni la déclaration URSSAF ni un conseil comptable.

### 5. Réglages importants (modifiables sans rebuild)
- Numéro WhatsApp, email, zone d'intervention.
- Délai de fabrication actuel (affiché sur le site).
- Interrupteur « Commandes ouvertes / complet / en congés jusqu'au … ».
- Avis clients (ajouter, masquer).
- Prochains marchés / salons (date, lieu).

### 6. Bannière événement (Noël, Halloween, fête des mères, Saint-Valentin…)
- Texte + photo optionnelle + lien, date de début et date de fin (affichage automatique).
- Photo compressée dans le navigateur avant envoi (WebP, taille raisonnable), EXIF supprimées,
  stockée dans Blobs.
- Aperçu avant publication.
- **Calendrier des temps forts** qui suggère de préparer bannière, page occasion et message aux
  inscrit·es ~4 à 6 semaines avant (fête des mères, fête des pères, rentrée, Halloween, Noël…).

### 7. Aide intégrée
Une page « Comment faire ? » avec 5-6 fiches très courtes et illustrées.

### Technique
- Pages statiques Astro sous le chemin secret + manifest PWA + service worker minimal (coquille
  hors ligne ; les données ne sont jamais mises en cache hors ligne).
- API = Netlify Functions ; données = Netlify Blobs (réglages, statuts, ventes, notes, modèles, avis,
  compteurs, images).
- Le site public lit les réglages via une fonction `/api/reglages` mise en cache au CDN (quelques
  minutes) ; si elle échoue, le site s'affiche avec les valeurs par défaut du build.
- Sauvegarde : export complet JSON en un bouton (à faire une fois par mois, rappel dans l'admin).
- Pas de notification push au départ : Emma reçoit un **email Netlify** à chaque nouvelle demande
  (à configurer dans Netlify). Notifications push = évolution possible.

## Légal
- Mentions légales : nom, statut EI / micro-entreprise, SIRET, adresse, email, hébergeur (Netlify, Inc.)
- Pas de cookies de suivi → pas de bandeau cookies nécessaire. Le cookie de session de l'admin est
  strictement nécessaire (exempté). Les statistiques maison sont sans cookie ni identifiant.
- Politique de confidentialité à compléter pour :
  - les demandes de contact (finalité, durée de conservation : 3 ans après le dernier contact),
  - les données de vente (conservation comptable : 10 ans),
  - le mailing (consentement, désinscription à chaque envoi),
  - les statistiques de visite anonymes,
  - les sous-traitants : Netlify (hébergement, formulaires, stockage), WhatsApp (Meta) si utilisé.

## Livrables « bonus » utiles à Emma
- Guide d'aide : installer l'admin sur son téléphone, répondre à une demande, marquer une vente,
  changer la bannière.
- Modèles de messages WhatsApp / email prêts à l'emploi, dont la demande d'avis Google.
- Conseils photo : photographier ses broderies au téléphone (lumière, fond, cadrage, détail du fil).
- Checklist de lancement : Google Business Profile, Search Console, liens réseaux, QR codes.

## Informations à compléter
- Nom complet, SIRET, adresse pro : [À COMPLÉTER]
- Types de broderie (main, machine, personnalisation…) : [À COMPLÉTER] (conditionne les mots-clés)
- Numéro WhatsApp (idéalement WhatsApp Business, gratuit) : [À COMPLÉTER]
- Réseaux sociaux : [À COMPLÉTER]
- Remise en main propre possible à Rennes ? Marchés habituels ? : [À COMPLÉTER]
- Photo portrait d'Emma (haute qualité, lumière naturelle) : [À FOURNIR]
- Photos des créations : [À FOURNIR]
- Premiers avis clients : [À FOURNIR]
