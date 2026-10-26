# Audit des contenus et du référencement — octobre 2026

Demande : « Challenge les contenus. Emmanuelle aimerait être visible sur Google sur les thématiques
couture et broderie, sur Rennes, Vitré, Pocé-les-Bois, Châteaubourg… »

Périmètre : toutes les pages de `src/pages/`, les 6 fiches de `src/content/creations/`, le JSON-LD,
le sitemap et le `robots.txt`, relus le 26 octobre 2026 sur la branche `refonte-design`.

---

## 1. Ce qu'il faut retenir

| # | Constat | Gravité | État |
|---|---|---|---|
| 1 | `public/robots.txt` contient `Disallow: /` : **aucune page ne peut être indexée** aujourd'hui | bloquant au lancement | à changer le jour de la mise en ligne sur emma-broderie.fr |
| 2 | **Aucune preuve sociale** : zéro avis, zéro chiffre, zéro photo de cliente. C'est le premier frein à la conversion et au classement local | majeur | dépend d'Emma (avis Google, accords) |
| 3 | **Catalogue trop mince** : 6 créations, une par catégorie. 5 pages catégorie sur 6 sont en `noindex`, les pages Mariage et Noël décrivent des pièces sans aucune photo | majeur | photos disponibles (≈ 100 dans l'inventaire), à traiter |
| 4 | **La couture était presque invisible** pour Google (aucune page indexée ne la portait) | majeur | ✅ corrigé : `/creations/couture/` devient une page d'atterrissage indexée |
| 5 | **Titres et descriptions trop longs** sur 13 pages (jusqu'à 85 caractères de titre, 206 de description) : Google les tronque et les réécrit | moyen | textes de remplacement au § 6 |
| 6 | **Promesses non prouvées** répétées sur tout le site (réponse dans la journée, emballage compris, « demande fréquente »…) | moyen | à faire confirmer, liste au § 3 |
| 7 | Le **nom légal** « Emmanuelle Wagner » et « SIRET [À COMPLÉTER] » s'affichent dans le pied de **chaque page** | moyen | à retirer du pied (§ 6) |
| 8 | Les pages catégorie en `noindex` portent aussi `nofollow` : les liens vers les fiches ne transmettent rien | faible | `noindex, follow` dans `Base.astro` |

Le site seul ne suffira pas à se placer à Vitré ou à Rennes : la fiche Google Business Profile et les
avis pèseront davantage (§ 9). Le site doit surtout **convertir** les visites que la fiche lui envoie.

---

## 2. Ce que j'ai modifié (pages locales, couture, données structurées)

| Fichier | Changement |
|---|---|
| `src/pages/creations/[categorie].astro` | `/creations/couture/` devient « **Couture sur mesure à Vitré** » : H1, title (59 car.), meta (152), chapô réel, boutons, « Ce que je couds » (trousses, sacs, tabliers, bavoirs), « Votre tissu ou le mien » + bouton WhatsApp « Envoyer une photo de mon tissu », déroulement en 3 étapes, FAQ couture (JSON-LD `FAQPage`), liens vers Vitré, Rennes, sur-mesure, fête des mères. Indexée même avec une seule pièce. Titres de toutes les catégories ramenés sous 60 caractères, H1 Naissance et Noël renommés (ils reprenaient mot pour mot ceux des pages occasions). Haut de page coloré selon la catégorie |
| `src/pages/brodeuse-vitre.astro` | H1 « **Brodeuse et couturière à Vitré** », section « Deux métiers, un seul atelier », communes autour de Vitré citées en phrases, solution claire pour elles (rendez-vous à Vitré ou envoi suivi), FAQ propre à Vitré dont une question couture. **Retrait** de la phrase non confirmée « Je participe à des marchés de créateurs du pays de Vitré » |
| `src/pages/broderie-personnalisee-rennes.astro` | H1 « **Broderie et couture personnalisées à Rennes** », nouvelle section « Entre Vitré et Rennes » (Châteaubourg, Servon-sur-Vilaine, Noyal-sur-Vilaine, Cesson-Sévigné), couture intégrée au texte et à la FAQ, bloc prune « Une pièce à l'unité » |
| `src/config.ts` | `COMMUNES` : une seule liste pour les pages et le JSON-LD |
| `src/layouts/Base.astro` | JSON-LD `LocalBusiness` : description broderie **et** couture, sans « logos » ; `knowsAbout` ; `areaServed` avec les 14 communes en `City`. Toujours sans adresse de rue ni `AggregateRating` |
| `astro.config.mjs` | `couture` retirée de `CATEGORIES_NOINDEX` (présente dans le sitemap) |

---

## 3. Promesses à prouver ou à retirer

Chaque phrase ci-dessous est affichée comme un fait, sans que rien sur le site ni dans le cahier des
charges ne le confirme.

| Affirmation | Où | Risque |
|---|---|---|
| « Réponse dans la journée » | tuile de l'accueil (écrite en dur, pas lue depuis `ATELIER.delaiReponse`), haut de page Vitré, appel final de toutes les pages | promesse tenue 4 jours sur 5 = avis négatif |
| « Emballage cadeau compris » | sur-mesure, 4 pages occasions, fiches | coût à intégrer au prix |
| « Lavable à 30 °C », « fil polyester 40 », « ne déteint pas » | naissance, Noël, atelier, catégorie naissance | plausible, à confirmer |
| « C'est une demande fréquente » / « la demande la plus fréquente » / « la commande la plus fréquente » | sur-mesure, fête des mères, mariage, Noël | fréquence inventée : retirer ou faire confirmer |
| « Je vous adresse sur demande des photographies des pièces déjà réalisées » (pochettes, mouchoirs, pyjamas, plaids, boules, gigoteuses) | mariage, Noël, naissance | si ces pièces n'existent pas, la cliente le découvre au premier message |
| « Je reste à côté de la machine pendant toute la réalisation » | atelier | invérifiable, sans intérêt pour la cliente : à retirer |
| « Je peux vous indiquer à tout moment où en est la vôtre » | sur-mesure | à confirmer |
| « Le paiement se fait après validation du motif » | fiches | modalité à confirmer (acompte ?) |
| Dates limites (mi-novembre, 21 jours avant la fête des mères, 2-3 mois avant un mariage) | Noël, fête des mères, mariage | déjà signalées en commentaire, à valider **avant le 1er novembre** pour Noël |
| « Une technique encore rare en Ille-et-Vilaine » (dentelle libre) | accueil, dentelle | issu de la recherche concurrentielle : défendable, à garder prudent |

## 4. Textes flous, génériques ou répétitifs

- **La même phrase de clôture partout** : « Je vous réponds avec un prix, un délai et une proposition
  de motif, sans engagement » figure dans une dizaine d'appels finaux. Elle est juste, mais une
  phrase liée à l'intention de la page convertit mieux (ex. Noël : « Envoyez-moi la liste des
  prénoms, même incomplète »). Les pages occasions le font déjà ; la galerie, l'atelier et le
  sur-mesure non.
- **Titres des fiches sans mot-clé** : « Le doudou de naissance », « La chaussette de Noël »
  commencent par un article et ne disent ni « brodé », ni « prénom », ni « personnalisé ».
- **Textes alternatifs inexacts** (relevés en regardant les photos) :
  - `trousse-cousue-brodee.md` : « tissu fleuri bleu et blanc » → le tissu est blanc matelassé à
    motif de feuillage, prénom en fil doré (la page fête des mères le décrit correctement) ;
  - le fichier `sac-de-sport-cousu-brode-baskets.webp` montre des **escarpins**, pas des baskets
    (nom de fichier SEO à corriger dans `scripts/traiter-photos.mjs`) ;
  - fête des mères : « un semis de petits chats » → trois têtes de chats ;
  - `doudou-plat-brode-prenom-keanu-naissance.webp` : le prénom brodé visible semble être
    « Florian », pas « Keanu » (à vérifier) ;
  - la machine en cours brode aussi une silhouette de bouddha, absente de l'alt.
- **Photo du cadre de naissance « Ambre »** : la mise en scène (chambre rose, bougies, fleurs) est
  très léchée. Vérifier qu'il s'agit bien d'une photo réelle d'Emma : le cahier des charges exclut
  toute image générée.
- **« Vêtements » sur la page sur-mesure** : « polo, sweat, doudoune » évoque les clubs et les
  entreprises, alors que le site cible les particuliers. Préférer « pyjama, sweat, veste en jean ».

## 5. Les manques

| Manque | Pourquoi c'est important | Ce qu'il faut |
|---|---|---|
| Avis clients | preuve sociale, et premier critère de classement local (via Google) | 5 avis Google réels avant le lancement, affichés sur l'accueil et en `Review` seulement ensuite |
| Photos de pièces | 6 fiches pour ≈ 100 photos dans l'inventaire (≈ 19 linge, 15 vêtements, 12 couture, 9 déco, 4 Noël, 4 tabliers) | 15 à 20 fiches de plus, en priorité couture (tabliers, tote bags, sac banane, sac de sport), linge de bain, Noël (avant mi-novembre) |
| Portrait d'Emma de qualité | l'inventaire signale un seul selfie ; le haut de l'accueil repose dessus | une séance photo en lumière naturelle |
| Journal | la collection existe, aucune page ni article | 4 articles ci-dessous |
| Ancienneté et volume | « depuis combien de temps » et « combien de pièces » sont les meilleures réassurances | à demander à Emma |
| Pages catégorie indexables | 5 sur 6 en `noindex` faute de 3 pièces | se débloque seul avec les nouvelles fiches (penser à `astro.config.mjs`) |

Articles proposés pour le journal (un par mois, publiés avant les temps forts) :
1. « Commandes de Noël : jusqu'à quand commander une pièce brodée ? » (à publier **maintenant**).
2. « Quel cadeau de naissance brodé choisir ? » (permanent, renvoie vers `/cadeaux/naissance/`).
3. « Dentelle libre : comment une broderie tient sans tissu » (angle peu concurrencé).
4. « Faire coudre une trousse ou un sac dans son propre tissu » (couture, renvoie vers `/creations/couture/`).

---

## 6. Ce que je propose de changer sur les autres pages

Ces fichiers sont modifiés par un autre agent : rien n'a été appliqué. Les textes sont prêts à
coller ; les longueurs sont comptées avec « | Emma Broderie » (16 caractères).

### Stratégie mots-clés : une intention par page

| Page | Intention principale | Secondaires | À ne pas viser (appartient à) |
|---|---|---|---|
| `/` | Emma Broderie, broderie personnalisée et couture (marque + offre) | Ille-et-Vilaine | « brodeuse Vitré » (`/brodeuse-vitre/`) |
| `/brodeuse-vitre/` | brodeuse Vitré, couturière Vitré | broderie Vitré, cadeau personnalisé Vitré, communes du pays de Vitré | couture sur mesure (`/creations/couture/`) |
| `/broderie-personnalisee-rennes/` | broderie personnalisée Rennes | couture personnalisée Rennes, cadeau personnalisé Rennes, Châteaubourg, Cesson-Sévigné | — |
| `/creations/couture/` | couture sur mesure Vitré | trousse personnalisée prénom, sac personnalisé brodé, tablier brodé prénom | — |
| `/creations/decoration-ajouree/` | dentelle libre brodée | broderie ajourée, arbre de vie brodé | — |
| `/creations/linge-de-bain/` | drap de bain brodé prénom | serviette brodée prénom | — |
| `/cadeaux/naissance/` | cadeau de naissance personnalisé brodé | doudou brodé prénom, cadre de naissance brodé | catalogue (`/creations/naissance/`) |
| `/cadeaux/mariage/` | cadeau de mariage brodé | pochette témoin brodée | dentelle libre en général |
| `/cadeaux/fete-des-meres/` | cadeau fête des mères brodé | trousse brodée prénom maman | — |
| `/cadeaux/noel/` | chaussette de Noël brodée prénom | cadeau de Noël personnalisé brodé | — |
| `/sur-mesure/` | commander une broderie personnalisée (prix, délais) | FAQ entretien | — |
| `/l-atelier/` | qui brode (confiance) | machine à broder, dentelle libre | — |
| fiches `/creations/<slug>/` | la pièce + « brodé(e) au prénom » | — | l'occasion |

Point d'attention : l'accueil et `/brodeuse-vitre/` partagent forcément Vitré. Google classera
probablement l'accueil sur « brodeuse Vitré » au début, surtout si la fiche Google pointe vers lui.
C'est acceptable ; l'essentiel est que les deux pages n'aient ni le même titre ni le même H1.

### Titres et descriptions de remplacement

| Page | Title proposé | Meta description proposée |
|---|---|---|
| `/` (76 → 53) | `Emma Broderie : broderie et couture sur mesure, Vitré` | Broderie au prénom et couture sur mesure en Ille-et-Vilaine : naissance, linge de bain, dentelle libre, sacs et trousses. Motif validé avant broderie. |
| `/creations/` (76 → 44) | `Créations brodées et cousues \| Emma Broderie` | Doudous et cadres de naissance, linge de bain au prénom, dentelle libre, sacs et trousses cousus : toutes mes créations, avec leur prix de départ. |
| `/sur-mesure/` (73 → 58) | `Broderie sur mesure : prix, délais, étapes \| Emma Broderie` | Le déroulement d'une commande de broderie ou de couture sur mesure : étapes, prix de départ, délais, entretien et livraison, avec validation du motif. |
| `/l-atelier/` (68 → 55) | `L'atelier : machine à broder et couture \| Emma Broderie` | Qui réalise vos pièces, avec quel matériel et selon quelles étapes : broderie machine, dentelle libre et couture, dans mon atelier de Vitré. |
| `/contact/` (65 → 32) | `Contact et devis \| Emma Broderie` | Décrivez votre projet de broderie ou de couture en quatre étapes courtes, ou écrivez-moi sur WhatsApp. Je vous réponds avec un prix et un délai. |
| `/cadeaux/naissance/` (81 → 51) | `Cadeau de naissance brodé au prénom \| Emma Broderie` | Doudou, cadre de naissance, bavoir, cape de bain brodés au prénom avec la date, le poids et la taille. Motif validé avant broderie, envoi en France. |
| `/cadeaux/mariage/` (71 → 55) | `Cadeau de mariage brodé, dentelle libre \| Emma Broderie` | Pochettes des témoins, mouchoirs au prénom, dentelle libre à coudre sur la robe : un motif validé une fois, puis brodé pour tout le cortège. |
| `/cadeaux/fete-des-meres/` (72 → 53) | `Cadeau fête des mères brodé au prénom \| Emma Broderie` | `` `Trousse cousue main, drap de bain, tablier brodés à son prénom. Fête des mères le ${dateFeteCourte} : commande conseillée avant le ${fmtCourt.format(dateLimite)}.` `` |
| `/cadeaux/noel/` (85 → 51) | `Chaussette de Noël brodée au prénom \| Emma Broderie` | `` `Chaussettes de cheminée, pyjamas et plaids brodés au prénom, une pièce par personne. Pour Noël, commande conseillée avant le ${dateLimite}.` `` |

Fiches création : ajouter un champ facultatif `titreSeo` au schéma (`src/content.config.ts`) et
l'utiliser dans `[...slug].astro` à la place de `${data.titre} — brodé à Vitré (35)` :

| Fiche | `titreSeo` proposé |
|---|---|
| doudou-lapin-brode-prenom | Doudou lapin brodé au prénom |
| cadre-naissance-brode | Cadre de naissance brodé au prénom |
| drap-de-bain-brode-prenom | Drap de bain brodé au prénom |
| trousse-cousue-brodee | Trousse cousue main brodée au prénom |
| chaussette-noel-brodee | Chaussette de Noël brodée au prénom |
| arbre-de-vie-dentelle | Arbre de vie en dentelle libre brodée |

Les descriptions des fiches doivent aussi passer sous 155 caractères : retirer « en Ille-et-Vilaine »
de la phrase générée suffit.

### Pied de page (`src/components/Pied.astro`)

Remplacer `{SITE.nomLegal} · micro-entreprise · SIRET {SITE.siret}` par :

```astro
<span>© {SITE.nom}, {SITE.ville}</span>
```

Le nom légal et le SIRET restent dans les mentions légales, comme le demande la direction artistique.

### Accueil (`src/pages/index.astro`)

- Tuile « Dans la journée » écrite en dur : la lire depuis `ATELIER.delaiReponse`, comme le reste
  du site, sinon l'admin ne pourra pas la modifier.
- Section atelier, phrase des communes : lier les deux pages locales dans la phrase elle-même.
  > Je travaille pour les particuliers de Vitré, de Rennes et des communes voisines&nbsp;:
  > Pocé-les-Bois, Étrelles, Argentré-du-Plessis, Châteaubourg, Cesson-Sévigné. Remise en main
  > propre à <a href="/brodeuse-vitre/">Vitré</a> et à <a href="/broderie-personnalisee-rennes/">Rennes</a>,
  > envoi soigné partout en France.
- Ajouter la couture dans la rangée « Pour chaque occasion » ou sous les créations :
  > <a class="lien-fleche" href="/creations/couture/">La couture sur mesure</a>

### Mariage, Noël, naissance : pièces sans photo

Tant qu'Emma n'a pas confirmé avoir réalisé ces pièces, remplacer la promesse de photos :
> ~~Les pochettes et les mouchoirs ne sont pas encore photographiés sur le site ; je vous adresse sur
> demande des photographies des pièces déjà réalisées.~~
> Les pochettes et les mouchoirs se réalisent sur commande : décrivez-moi votre projet, je vous
> soumets le motif avant toute réalisation.

Même correction pour « pyjamas, plaids et boules » (Noël) et « bavoirs, capes de bain et
gigoteuses » (naissance).

### Fréquences inventées

Supprimer « c'est une demande fréquente » (sur-mesure, fête des mères), « c'est la demande la plus
fréquente » (mariage, Noël FAQ) et « c'est la commande de Noël la plus fréquente » (Noël) :
> Oui : un même motif, un même fil, et un prénom différent sur chaque pièce.

### `Base.astro` (hors JSON-LD)

`<meta name="robots" content="noindex, nofollow">` → `noindex, follow` : les pages catégorie
minces restent hors de l'index mais transmettent leurs liens vers les fiches.

### Navigation

`/creations/couture/` n'est accessible que depuis le pied (« Sacs & trousses ») et l'atelier.
Ajouter « Couture » dans `Entete.astro`, à côté de « Dentelle libre » : c'est la deuxième offre,
pas une sous-catégorie.

---

## 7. Questions à poser à Emmanuelle

**Prestations (conditionne ce qu'on peut écrire)**
1. Faites-vous des **retouches** (ourlets, fermetures, ajustements) ou des **vêtements sur
   mesure** ? Si oui, c'est une intention de recherche locale forte (« couturière Vitré ») et une
   catégorie Google Business supplémentaire ; si non, on ne l'écrit nulle part.
2. Faites-vous la **dentelle libre sur commande**, ou seulement pour vous ?
3. Les **pochettes de témoins, mouchoirs, pyjamas, plaids, boules, gigoteuses** cités sur le site :
   en avez-vous déjà réalisé ? Avez-vous des photos ?
4. Les doudous et bavoirs : les cousez-vous, ou brodez-vous des modèles achetés ?

**Zone et remise**
5. Remise en main propre **à Rennes** : réellement possible ? Où (lieu public), à quelle fréquence ?
6. Pour **Châteaubourg, Pocé-les-Bois, Étrelles, Argentré**… : acceptez-vous de vous déplacer, ou
   uniquement rendez-vous à Vitré et envoi ? Jusqu'où ?
7. Quels **marchés de créateurs** fréquentez-vous (lieu, période) ?

**Réassurance**
8. **Depuis combien de temps** brodez-vous et cousez-vous ? Combien de pièces environ par an ?
9. Délai de réponse réaliste (dans la journée ? sous 48 h ?), emballage cadeau compris ou non,
   frais d'envoi, acompte ou paiement après validation ?
10. Date limite de commande pour **Noël 2026** (à publier avant le 1er novembre).
11. Les pièces se lavent-elles toutes à 30 °C ? Quel fil utilisez-vous ?

**Photos et accords**
12. Accord des clientes pour les prénoms visibles (Ambre, Lisa, Malo, Alicia…) ?
13. La photo du cadre « Ambre » est-elle une photo que vous avez prise ?
14. Pouvez-vous nous transmettre **5 clientes satisfaites** à qui demander un avis Google ?

---

## 8. Ce qui n'a pas pu être vérifié

- Les distances affichées sur la page Rennes (≈ 38 km, ≈ 30 min en train, ≈ 40 min par la N157)
  sont des ordres de grandeur, signalés en commentaire.
- La géographie des communes (nord, sud, axe Vitré-Rennes) est citée sans distance précise.
- Les volumes de recherche : à mesurer après lancement (Search Console, Keyword Planner).

---

## 9. Hors site : ce qui pèsera plus que le site

Pour une requête comme « brodeuse Vitré » ou « couturière Châteaubourg », Google affiche d'abord
la **carte (pack local)**, alimentée par les fiches Google Business Profile, pas par les sites.
Le site aide (pertinence, liens), mais sans fiche ni avis il restera sous les ateliers de marquage.

| Action | Pourquoi | Détail |
|---|---|---|
| **Créer la fiche Google Business Profile** | c'est elle qui apparaît sur la carte | entreprise **sans adresse affichée** (« zone desservie ») : Vitré, Rennes, et les communes de `config.COMMUNES`. Catégorie principale : « Service de broderie » ou l'intitulé le plus proche proposé par Google ; secondaire : « Couturière » / « Couturier » ; « Retouches » **seulement** si elle en fait |
| **Avis** | premier facteur de classement local, et preuve sociale | demander un avis après chaque remise (modèle prévu dans l'admin), répondre à chacun. Objectif : 10 avis la première année |
| **Photos sur la fiche** | les fiches actives sont mieux classées | une à deux photos par semaine (le flux Instagram s'y prête), sans visages sans accord |
| **NAP identique partout** | Google recoupe nom, téléphone et site | « Emma Broderie », même numéro, `https://emma-broderie.fr/` : fiche Google, Instagram, Facebook, annuaires. Pas d'adresse de rue publiée nulle part |
| **Annuaires locaux** | liens et citations locales | annuaire des entreprises de la ville de Vitré, office de tourisme (Destination Vitré), Chambre de métiers et de l'artisanat d'Ille-et-Vilaine si elle y est immatriculée, Pages Jaunes (fiche gratuite), associations de créateurs d'Ille-et-Vilaine |
| **Instagram @emma_couture_broderie** | 468 publications, compte professionnel | lien du site en bio avec `?utm_source=instagram`, ville dans la bio (« Vitré · broderie et couture ») |
| **Marchés et étiquettes** | clientèle locale réelle | QR code vers le site (`?utm_source=marche`, `?utm_source=etiquette`) |
| **Search Console** | savoir sur quoi le site sort vraiment | dès la mise en ligne, avec envoi du sitemap ; revoir les mots-clés de ce document après 3 mois |

Ordre conseillé : fiche Google et premiers avis **avant** le lancement du site, puis Search Console
le jour du lancement (en retirant `Disallow: /` de `robots.txt`).
