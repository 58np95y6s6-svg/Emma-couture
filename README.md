# emma-broderie.fr

Site vitrine d'**Emma Broderie** — broderie machine et couture sur mesure à Vitré (35).
Astro en génération statique, hébergé sur Netlify. 25 pages.

> ⚠️ **Projet en cours, rien n'est en production.** Les prix, délais, avis, numéro de
> téléphone et adresse e-mail affichés sont des **valeurs d'exemple** (voir `src/config.ts`),
> et les mentions légales sont incomplètes. Le site ne doit pas être mis en ligne en l'état.

## Démarrer

```bash
npm install
npm run dev
```

Le site tourne sur http://localhost:4321.

### Les photos ne sont pas dans le dépôt

Le dépôt est public, et les photos montrent le portrait d'Emma ainsi que des créations où
des **prénoms de clientes sont lisibles**. Elles sont donc hors Git, comme les originaux.

Elles se régénèrent depuis `photos-originales/` (fourni séparément) :

```bash
node scripts/traiter-photos.mjs
```

Le script recadre aux formats de la direction artistique, encode en WebP, **supprime toutes les
métadonnées EXIF** (position GPS comprise : les photos prises à domicile révèlent l'adresse) et
écrit un journal dans `docs/journal-retouches.json`. Il refuse tout recadrage qui demanderait
plus de 5 % d'agrandissement.

Sans ces fichiers, `npm run build` échoue sur les imports d'images.

## Structure

| Chemin | Rôle |
|---|---|
| `src/pages/` | les 25 pages |
| `src/content/creations/` | une création par fichier Markdown |
| `src/content.config.ts` | schéma des collections |
| `src/config.ts` | réglages du site — **toutes les valeurs sont provisoires** |
| `src/layouts/Base.astro` | SEO, données structurées, en-tête, pied |
| `src/styles/global.css` | la feuille partagée |
| `src/scripts/broderie.js` | le moteur d'animation (point de bourdon, fil au défilement, tambour) |
| `scripts/` | traitement des photos, planches contact |
| `docs/` | inventaire photos, pistes visuelles, maquette d'origine |
| `.claude/skills/direction-artistique/` | la direction artistique du projet |

## Avant de toucher au design

Lire `.claude/skills/direction-artistique/SKILL.md`. Il contient la palette, les typographies,
les règles de mise en page, le vocabulaire d'animation, **les pièges déjà rencontrés sur ce
projet** et la liste de vérification avant livraison.

Deux règles qui reviennent le plus souvent :

- ⚠️ **Ne jamais écrire « brodé à la main »** : Emma brode à la **machine**. Formulations
  justes : « brodé à Vitré », « brodé sur mesure », « personnalisé au prénom ». « Cousu main »
  n'est vrai que pour les sacs, trousses et tabliers.
- **Aucun chiffre inventé.** Prix, délais, nombre de pièces, avis : tout vient d'Emma.

## Déploiement

Netlify, plan gratuit — **300 crédits par mois, plafond strict** : au-delà, le site passe hors
ligne jusqu'au 1er du mois suivant.

```bash
npx netlify deploy --dir=dist          # prévisualisation, gratuite
npx netlify deploy --prod --dir=dist   # production, 15 crédits
```

Un déploiement en production coûte **5 % du budget mensuel**. Le poste de dépense n'est pas le
trafic mais les déploiements : regrouper les mises en production, viser 10 par mois au maximum.
Voir `CLAUDE.md` pour la grille tarifaire détaillée et le budget estimé.

## Reste à faire

- Remplacer les valeurs d'exemple de `src/config.ts` par les vraies
- Compléter les mentions légales (SIRET, et la question de l'adresse du siège)
- Refaire la photo du haut de page : c'est actuellement un portrait en extérieur
- Écrire l'enchaînement des prénoms brodés (spécifié dans le SKILL, pas implémenté)
- L'espace d'administration (PWA) — spécifié dans `CLAUDE.md`, pas commencé
