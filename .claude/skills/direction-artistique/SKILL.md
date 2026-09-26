---
name: direction-artistique
description: Direction artistique et vocabulaire technique du site emma-broderie.fr. À charger avant toute création ou modification d'interface, de page, de composant, de CSS ou d'animation sur ce projet — que la demande parle de design, de maquette, de mise en page, de style, d'animation, de typographie, de couleurs, ou simplement de « rendre ça plus beau ». Contient la palette, les typographies, les règles de mise en page pleine largeur, le vocabulaire d'animation lié à la broderie, la bibliothèque de techniques CSS modernes retenues, les pièges connus de ce projet et la liste de vérification avant livraison.
---

# Direction artistique — emma-broderie.fr

Site d'Emmanuelle Wagner, **broderie machine et couture** à Vitré (35). Micro-entreprise,
elle travaille seule. Le site vend à sa place.

Lire aussi `CLAUDE.md` (cahier des charges) et `docs/inventaire-photos.md` (ce qu'elle fait).

## Les trois mots du client

**Design. Chaleureux. Dynamique.** Plus une attente explicite de savoir-faire technique visible.

Deux propositions ont déjà été rejetées, dans ces termes :
> « Hyper fade, pas de design en full width, pas d'animation. »
> « Ça ne me plaisait pas du tout. Je veux quelque chose de design, chaleureux et dynamique,
> plein de technologie de webdesign. »

Si une maquette pourrait passer pour celle d'un autre artisan, elle est ratée.

## Retours du client, à respecter au mot

**Le nom affiché est « Emma Broderie »**, jamais « Emmanuelle Wagner ». C'est le nom commercial.
Le nom légal complet n'apparaît que dans les mentions légales, avec le SIRET.

**Le ton est moderne, direct et FUN.** Jamais kitsch, jamais solennel. Rejeté explicitement :
> « Un prénom brodé, et l'objet devient le sien » → « c'est kitsch, pas moderne ».
> Et la phrase de sous-titre : « pas fun non plus ».

À bannir : les tournures sentimentales à rallonge, les formules poétiques sur l'objet qui « prend
vie », « devient unique » ou « traverse le temps », les phrases qui **expliquent** l'émotion au
lieu de la provoquer, le vocabulaire de plaquette (« savoir-faire d'exception », « pièce unique
chargée de sens »).

Ce qu'on cherche : des phrases **courtes**, **concrètes**, à la **première personne**, avec un peu
de caractère. Le concret émeut, la poésie explicative non. Un trait d'humour discret vaut mieux
qu'une envolée. On vend un cadeau, pas un mausolée.

### ✅ Accroche retenue par le client

> **« Dites-moi le prénom. Je sors les bobines. »**

C'est le `<h1>` de la page d'accueil. Elle donne le ton de tout le reste du site : deux phrases
courtes, une action de la visiteuse puis une action d'Emmanuelle, un détail concret d'atelier.
Toute autre accroche de la page doit être écrite à cette hauteur-là.

⚠️ Elle ne contient aucun mot-clé : compenser juste en dessous par un paragraphe d'introduction
qui porte « broderie personnalisée », « couture sur mesure » et « Vitré », et par une balise
`<title>` explicite. Le H1 vend, le paragraphe qui suit référence.

Autres formules validées dans la même direction, réutilisables ailleurs dans le site :
- « Écrivez-moi un prénom. Je m'occupe du reste. »
- « Je brode des prénoms. Beaucoup de prénoms. »
- « Un prénom, cinq cents couleurs de fil, une seule pièce. »
- « Vous m'envoyez le prénom. Je brode. Vous offrez. »
- « Le cadeau qu'on ne peut offrir qu'une fois. »
- « Ça part de chez moi emballé. Vous n'avez plus qu'à sourire. »

### Formules rejetées, et pourquoi

| Rejeté | Le défaut |
|---|---|
| « Un prénom brodé, et l'objet devient le sien » | kitsch, explique l'émotion au lieu de la provoquer |
| « Je travaille seule, dans la pièce d'à côté » | ne veut rien dire : à côté de quoi ? Proximité invérifiable |
| « C'est plus lent qu'une commande sur une place de marché… » | **s'excuse d'être lente** : on ouvre sur le point faible. « Place de marché » est du jargon. « Ne ressemble à aucun autre » est invérifiable |

⚠️ **Ne jamais s'excuser du délai ni du prix.** Transformer la contrainte en avantage réel et
vérifiable. Ici l'avantage existe : **la validation du motif avant broderie**, que les grosses
boutiques ne proposent pas.
Remplacement retenu : « Je vous montre le motif avant de lancer la machine. Si quelque chose ne
va pas, on le change : tant que ce n'est pas piqué, tout est possible. »

Titre de la section atelier : **« Pas d'équipe. Moi, ma machine, et un mur de bobines. »**

### ⚠️ Règle des chiffres : la photo doit prouver la phrase
« Quatre cents bobines » a été rejeté parce qu'on n'en distingue qu'une soixantaine sur la photo :
le chiffre invite à vérifier, la vérification échoue, et l'image perd sa force. « Un mur de
bobines » est prouvé par l'image, donc plus efficace qu'un nombre.

Deux règles :
1. **Aucun chiffre inventé.** Nombre de pièces, d'années d'activité, de couleurs de fil, d'avis :
   tout vient d'Emmanuelle. Tant qu'elle n'a pas confirmé, marquer le chiffre comme exemple dans
   un commentaire HTML — au même titre que les prix, les délais et les avis.
2. **Un chiffre placé à côté d'une photo doit être cohérent avec ce qu'on y voit.** Sinon,
   préférer une formule qualitative que l'image démontre.

À garder tel quel, c'est le bon registre : « c'est moi qui lis vos messages, qui choisis la bobine
dans le rack derrière moi, qui lance la machine et qui ferme le paquet ».

Le défaut commun aux phrases rejetées : elles décrivent une **impression** au lieu d'énoncer un **fait**.
Remplacer par du vérifiable. Pour dire la petite structure et le travail à domicile :
- « Je travaille seule, chez moi, à Vitré. »
- « Pas d'équipe, pas d'usine : moi, ma machine et quatre cents bobines. »
- **« C'est moi qui réponds, qui brode et qui emballe. »** ← la meilleure : trois gestes concrets,
  et elle répond à la vraie question de la cliente, « à qui je parle ? ».

### Deux tests avant de garder une phrase
1. Est-ce qu'une femme de 35 ans qui cherche un cadeau de naissance la lirait à voix haute à une
   copine ? Si ça sonne comme un carton d'invitation de mariage, réécrire.
2. Est-ce que la phrase énonce un **fait vérifiable**, ou seulement une impression ? Si on ne peut
   ni la photographier ni la chiffrer, elle est probablement creuse.

**Le prénom en grand est un prénom de CLIENTE, et il défile** (Ambre, puis Malo, puis Lisa…),
avec une légende qui l'ancre dans une vraie commande (« brodé le 16 janvier, 3,85 kg »).
Jamais « Emma » en énorme : ça se lirait comme un logo et l'argument de vente disparaîtrait.
Un prénom de cliente est une démonstration — « votre prénom peut être là ». Sans le défilement
ni la légende, le visiteur ne comprend pas pourquoi un prénom inconnu s'étale à l'écran ;
c'est un reproche qui a déjà été fait.

**Points déjà jugés ratés, à refaire autrement :**
- la section « occasions » (naissance / mariage / fête des mères / Noël) — mise en page à revoir ;
- l'**arrière-plan du site** — jugé pas beau. Le fond doit être une vraie matière chaude, travaillée
  (grain de toile, lumière douce), pas un aplat ni une texture appuyée qui salit la lecture.

## ⚠️ « On voit que c'est fait par une IA » — les tics à éliminer

Reproche explicite du client sur la maquette. Les indices, du plus voyant au plus discret :

**1. Les sourcils numérotés (01, 02, 03…).** Le tell numéro un. Un numérotage n'a de sens que si
le contenu est une **vraie séquence**. « Les créations », « la dentelle libre », « les occasions »,
« l'atelier », « les avis » ne s'enchaînent dans aucun ordre : le numéro ne dit rien, il décore.
→ **Les supprimer partout**, sauf sur « Comment ça se passe », où les trois étapes se suivent
réellement. Remplacer par un simple libellé, ou par rien.

**2. Le gabarit de titre répété.** Sourcil en capitales espacées → grand titre coupé en trois
lignes par des `<br>` → dernier segment en italique dans la couleur d'accent → paragraphe.
Une fois c'est une signature, cinq fois c'est un moule.
→ **Varier** : une section sans sourcil, un titre sur une seule ligne, un titre sans italique,
un titre posé à droite. L'irrégularité est ce qui fait qu'une page semble composée par quelqu'un.

**3. Le rythme vertical identique.** Toutes les sections au même `padding-block`.
→ Serrer certaines sections, en aérer d'autres. Une page conçue a des respirations inégales.

**4. La famille chromatique suspecte.** Sable rosé + serif display + accent rouille est une porte
dérobée vers le combo crème/serif/terracotta déjà banni plus bas. Si la palette reste, il faut
qu'une couleur franche et inattendue prenne vraiment la parole quelque part.

**5. Fraunces avec `SOFT` et `WONK` exhibés** est devenu la police par défaut de l'artisanal
généré. À garder seulement si son usage est singulier ; sinon, en changer.

**6. Les tics de détail** : la flèche « → faites défiler » qui pulse, les puces d'icônes toutes
identiques, un `border-radius` unique partout, les listes de trois éléments systématiques,
les tirets cadratins en rafale.

Règle générale : **un dispositif structurel doit encoder une information vraie.** S'il est là
parce que « ça fait design », il trahit la machine. Le doute se tranche ainsi : *qu'est-ce que ce
numéro / cette icône / ce filet apprend au lecteur ?* Si la réponse est « rien », il saute.

## Vérité du métier — à ne jamais trahir

⚠️ **Emmanuelle brode à la MACHINE.** Ne jamais écrire « brodé à la main ».
Formulations justes : « brodé à Vitré », « brodé sur mesure », « personnalisé au prénom ».
« Cousu main » est vrai, mais **uniquement** pour les sacs, trousses et tabliers qu'elle confectionne.

Sa singularité : la **dentelle libre** — des pièces brodées sans support tissu, qui tiennent
toutes seules. Presque personne ne revendique cet angle en Ille-et-Vilaine.

Son monde matériel, à puiser pour toute décision visuelle : un mur de centaines de bobines de fil,
une machine à broder, un tapis de coupe vert quadrillé en centimètres, des cadres (tambours) en
millimètres, du fil polyester 40, des densités de points, des prénoms en lettres cursives.

## Couleur

Le fond blanc clinique est **banni** : c'est ce qui rendait les propositions froides.

| Rôle | Valeur | D'où ça vient |
|---|---|---|
| Encre | `#2A2320` | brun chaud, jamais du noir pur |
| Rose poudré | `#E8CFC6` | le drap de bain « Alicia » |
| Mauve profond | `#6B5560` | la broderie du prénom « Alicia » |
| Fil doré | `#B89355` | l'arbre de vie en dentelle |
| Gris doux | `#8A7E78` | texte secondaire |

À **enrichir** en puisant dans ses photos, c'est là qu'est la chaleur : ocre, rouille brûlée,
vert de tapis de coupe (`#2F4B3F`), bleu de jean, rouge de la fée (`#C2453B`).
Prévoir une couleur profonde pour les sections de rupture.

Le neutre doit être **choisi**, jamais un gris pur : le biaiser vers l'accent de la page.

⚠️ **Combinaison interdite**, parce qu'elle signe un site généré : crème `#F4F1EA` + serif display
+ accent terracotta. Également bannis : dégradé violet-bleu, Inter, Space Grotesk, emoji en puces
de section, tout centré, un seul `border-radius` partout, cartes à liseré coloré.

## Typographie

Google Fonts est le seul hébergeur autorisé (contrainte CSP des artefacts, et performance).

- **Titres** : `Instrument Serif` — choisie par le client en remplacement de Fraunces.
  Serif à très fort contraste, registre studio de design plutôt que boutique de créateur ;
  son italique porte les accents. ⚠️ Elle n'existe qu'en **une seule graisse (400)**, romain et
  italique : la hiérarchie se fait donc par la **taille et l'italique**, jamais par la graisse.
  Ne pas écrire de `font-weight` ni de `font-variation-settings` dessus.
  ⚠️ **Fraunces est abandonnée** : trop identifiable comme la police par défaut de l'artisanal
  généré, avec ses axes `SOFT` et `WONK` exhibés.
- **Texte courant** : `Jost`.
- **Chiffres techniques** (références de fil, tailles de cadre, nombre de points) : une chasse fixe.

Règles : texte courant proche de 65 caractères par ligne, échelle fluide en `clamp()` sans points
de rupture brutaux, `text-wrap: balance` sur les titres, interlettrage léger sur les capitales.
Les **ruptures d'échelle franches** font partie de la direction : un mot énorme contre un texte
minuscule.

## Mise en page : le plein écran est la norme

Le conteneur centré étroit est **réservé aux blocs de texte long**. Tout le reste — images, bandes
de couleur, galerie, hero, séparateurs — touche les deux bords de l'écran.

Rythme attendu : pleine largeur → colonne étroite → pleine largeur → section sombre en rupture.
C'est cette respiration qui distingue un vrai site d'une page de gabarit.

Prévoir au minimum : un hero full-bleed, une bande photo pleine largeur, une galerie qui déborde
du bord droit avec `scroll-snap`, une section sombre pleine largeur au milieu.

## Chaleur : quatre leviers, à utiliser ensemble

1. **La matière** — un grain de toile très léger en fond (SVG `feTurbulence`, opacité faible),
   ou une trame de tissage. On doit à peine le remarquer, mais la page cesse d'être plate.
2. **La lumière** — dégradés très doux et chauds, comme un atelier en fin de journée.
3. **Les photos** — grandes, qui respirent, jamais rognées à l'étouffée.
4. **Les mots** — première personne, concrets, qui sonnent comme quelqu'un qui parle.

## Animation : le vocabulaire est celui de la broderie

L'animation est **structurante, pas décorative**. Le moteur maison
(`docs/maquette-prenom/broderie.js`) s'active par attributs :

| Attribut | Effet |
|---|---|
| `data-broderie="prenom"` | le prénom s'écrit en point de bourdon, point par point |
| `data-broderie="fil"` | un fil continu traverse la page et se brode au défilement |
| `data-broderie="tambour"` | révélation d'image à travers un tambour à broder |
| `data-broderie="croix"` | grille de points de croix qui se remplit |
| `data-broderie="aiguille-curseur"` | traînée de points derrière le curseur natif, sur ordinateur |

Options : `data-fil="#6B5560"`, `data-duree="2600"`, `data-declencheur="visible|charge|survol"`.

### Le carrousel de prénoms du haut de page

Le prénom géant **s'enchaîne** : une fois brodé, il se **découd**, et le suivant se brode.
Découdre, c'est faire disparaître les points **dans l'ordre inverse** de leur apparition, comme
quand on tire le fil — c'est le geste réel de l'atelier, et c'est bien plus juste qu'un fondu.

Rythme, environ six secondes par prénom :
| Étape | Durée | Détail |
|---|---|---|
| Broderie | ~2,6 s | les points apparaissent un par un |
| Pause | ~2,2 s | assez long pour lire le prénom et sa légende |
| Découdre | ~0,8 s | ordre inverse, **plus rapide** : tirer un fil va vite |
| Respiration | ~0,4 s | le vide avant le suivant |

Règles :
- **La légende suit le prénom.** Chaque prénom a la sienne (« cadre de naissance brodé mardi :
  prénom, date, 3,85 kg »). Une légende figée pendant que le prénom change serait incohérente.
  Elle change pendant la respiration, jamais pendant la broderie.
- **Aucun décalage de mise en page** : les prénoms n'ont pas la même longueur. Réserver la hauteur
  et la largeur maximales dès le départ, sinon la page saute à chaque tour.
- **S'arrêter** après quatre ou cinq prénoms, sur le dernier, brodé. Une boucle infinie distrait,
  fatigue et consomme du processeur pour rien.
- **Suspendre** quand le haut de page sort de l'écran (`IntersectionObserver`), reprendre au retour.
- **Accessibilité** : le titre accessible reste stable, le carrousel est décoratif
  (`aria-hidden="true"` sur le SVG, texte accessible fixe à côté). Pas d'`aria-live` : annoncer
  un prénom toutes les six secondes rendrait un lecteur d'écran inutilisable.
- **`prefers-reduced-motion`** : un seul prénom, affiché brodé, sans enchaînement.
- Au survol ou au focus, **mettre en pause** — on laisse la visiteuse lire si elle veut.

Le **prénom brodé est le fil conducteur** : énorme sur ordinateur, il se brode dès l'arrivée et
revient plusieurs fois dans la page avec un prénom différent — c'est littéralement le produit.

Réglages du curseur « point avant » (le curseur natif est CONSERVÉ, on n'ajoute que la traînée) :
douze points maximum, opacité décroissante jusqu'à **zéro**
sur le dernier, dépôt tous les ~18 px parcourus (sinon les points s'agglutinent quand la souris
est lente), chaque point orienté dans le sens du déplacement, effacement automatique à l'arrêt.

## Bibliothèque de techniques CSS modernes

Le client attend qu'on voie le savoir-faire. En utiliser **au moins six**, et dire lesquelles.

- **`animation-timeline: view()` / `scroll()`** — animations pilotées par le défilement, en CSS pur.
  C'est l'outil naturel du fil qui se brode. Envelopper dans `@supports` avec un repli propre.
- **`position: sticky`** — une section épinglée pendant que le contenu défile par-dessus.
- **`clip-path`** animé — révélations d'images ; `circle()` pour l'effet tambour.
- **`mask-image`** — bords fondus, transitions de section douces.
- **`mix-blend-mode`** — du texte qui se fond dans une photo.
- **`scroll-snap`** — galerie horizontale qui déborde du bord droit.
- **Polices variables** — graisse ou axe optique animé.
- **`clamp()`** — échelle typographique entièrement fluide.
- **`color-mix()` / `oklch()`** — dégradés qui ne virent pas au gris.
- **`backdrop-filter`** — barre de navigation posée sur les photos.
- **Marquee CSS** — frise infinie de couleurs de fil ou de prénoms.
- **`content-visibility: auto`** — performance sur les sections basses.
- **`@container`** — une carte qui s'adapte à son conteneur, pas à l'écran.

## Pièges déjà rencontrés sur ce projet

- **Grilles CSS** : une piste `auto` ou `1fr` a pour minimum implicite `min-content`. Un seul enfant
  récalcitrant élargit toute la page. **Toujours `minmax(0, …)`.** Ce bug a déjà cassé une maquette
  (214 px de débordement).
- **`display` et `[hidden]`** : `.classe { display: grid }` écrase le `display: none` par défaut de
  l'attribut `hidden`. Ajouter explicitement `.classe[hidden] { display: none }`.
- **`width: 100vw`** inclut la barre de défilement et provoque un débordement horizontal.
  Préférer une grille avec une piste pleine largeur, ou `margin-inline: calc(50% - 50vw)`, et vérifier.
- **Agrandissement d'image** : les photos viennent d'un téléphone. `scripts/traiter-photos.mjs`
  refuse tout recadrage exigeant plus de 5 % d'agrandissement — ne pas contourner ce garde-fou,
  il a déjà révélé deux images agrandies de 73 % et 77 %.

## Contraintes non négociables

- **Mobile first.** Aucun défilement horizontal du corps de page à **320, 390, 768, 1024, 1440 px**.
  Une galerie qui défile horizontalement est un conteneur qui défile, pas la page.
- Zones tactiles ≥ 44 px. Texte courant ≥ 16 px sur mobile. Utilisable à 200 % de zoom.
- **Le H1 est lisible immédiatement.** Rien d'essentiel en `opacity: 0` en attente d'un observer.
  Le premier écran doit être beau à l'arrêt, sans défilement.
- `prefers-reduced-motion: reduce` : tout s'affiche dans son état final, sans mouvement.
- Un seul `<h1>`, hiérarchie propre, `alt` descriptif partout, focus clavier visible.
- N'animer que `transform`, `opacity`, `clip-path`, `filter`. Jamais de reflow dans une boucle.
- **Aucune bibliothèque JS d'animation.** Le poids compte pour Lighthouse.
- Images en `loading="lazy"` sauf le hero, avec `width`/`height` pour éviter les sauts de mise en page.

## Images disponibles

Produites par `scripts/traiter-photos.mjs` dans `src/assets/creations/`, EXIF supprimées,
noms SEO, journal dans `docs/journal-retouches.json`.

| Format | Dimensions | Usage |
|---|---|---|
| `plein-ecran/` | 2400×1350 | sections full-bleed |
| `bandeau/` | 2400×620 | bande pleine largeur entre deux sections |
| `hero-large/` | 1920×1080 | haut de page ordinateur |
| `hero-mobile/` | 1000×1250 | haut de page téléphone |
| `galerie/` | 1000×1250 | vignettes 4:5 |
| `detail/` | 1000×1000 | gros plans |
| `og/` | 1200×630 | partage — **obligatoire par création** |

L'image Open Graph n'est pas optionnelle : c'est elle qui porte la photo dans l'aperçu WhatsApp
quand une visiteuse clique « Je veux la même ».

## Budget de performance — chiffré, à tenir

Le cahier des charges exige d'excellents scores Lighthouse, **animations comprises**. Ce n'est pas
un vœu : la majorité des visites viendra d'un téléphone en 4G, et Google utilise ces signaux pour
le référencement local. La performance est donc un sujet de conversion, pas de confort technique.

| Indicateur | Cible | Pourquoi |
|---|---|---|
| Lighthouse performance, accessibilité, SEO | ≥ 95 | exigence du CDC |
| LCP | < 2,5 s | c'est la photo du haut de page |
| CLS | < 0,1 | le carrousel de prénoms est le principal suspect |
| INP | < 200 ms | les animations ne doivent pas bloquer le fil principal |
| JavaScript total (gzip) | < 50 Ko | dont **moins de 15 Ko** pour le moteur de broderie |
| CSS total (gzip) | < 30 Ko | une feuille de 45 Ko non compressée est à auditer |
| Familles de polices | 3 maximum | chaque famille coûte un aller-retour réseau |

Règles à vérifier à l'audit :
- Polices : `preconnect` vers Google Fonts, `display=swap`, sous-ensemble latin uniquement.
  Une police variable vaut mieux que quatre graisses statiques.
- Images : WebP, dimensions `width`/`height` sur **toutes** (sinon CLS), `loading="lazy"` partout
  **sauf** la photo du haut de page qui prend `fetchpriority="high"` et pas de `lazy`.
  Un `srcset` doit exister dès qu'une image est servie à des largeurs très différentes — envoyer
  un fichier de 2400 px à un téléphone de 390 px gaspille la bande passante, qui est **facturée
  sur les 300 crédits mensuels**.
- Animations : uniquement `transform`, `opacity`, `clip-path`, `filter`. Aucun reflow en boucle.
  Une seule boucle `requestAnimationFrame` partagée, arrêtée dès que plus rien n'est visible.
- `content-visibility: auto` sur les sections basses.
- Rien d'essentiel en `opacity: 0` en attente d'un observer : mauvais pour le LCP **et** risqué
  si le JavaScript échoue.
- Vérifier le rendu **JavaScript désactivé** : la page doit rester lisible et vendable.

## Revue finale par un regard neuf

Quand la page et le moteur sont terminés, les faire challenger par un agent qui n'a pas participé
à leur écriture. Sa mission : contester les choix, pas les valider. Axes imposés —
**direction artistique** (est-ce que ça pourrait être le site de n'importe quel artisan ?),
**conversion** (combien de gestes entre l'arrivée et le message à Emmanuelle ?),
**textes** (appliquer les deux tests de ton, traquer les impressions non vérifiables et les
chiffres inventés), **performance** (mesurer, pas supposer), **accessibilité** (navigation au
clavier, contrastes, lecteur d'écran), **responsive** aux cinq largeurs, et **robustesse**
(JavaScript coupé, réseau lent, `prefers-reduced-motion`).

## Avant de livrer — liste de vérification

1. Ouvrir la page **à 1440 px** et regarder. Si le verdict est « c'est correct », **ce n'est pas
   assez** : recommencer. Prévoir au moins trois cycles de correction.
2. Regarder **à 390 px**.
3. Vérifier aux cinq largeurs : `document.documentElement.scrollWidth > window.innerWidth`
   doit être `false` partout.
4. Tester `prefers-reduced-motion` pour de vrai.
5. Couper JavaScript : la page reste-t-elle lisible et belle ?
6. Relire les textes : aucune mention de « brodé à la main ».
7. Les prix, délais et avis sont-ils signalés comme des exemples non validés ?
