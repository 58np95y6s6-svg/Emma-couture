// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://emma-broderie.fr';

// Chemin secret de l'espace d'administration : jamais dans le sitemap.
const ADMIN_PATH = process.env.ADMIN_PATH ?? 'atelier-mqu3gf';

/**
 * Pages catégorie en `noindex` (moins de 3 pièces) : hors du sitemap.
 * ⚠️ À tenir à jour avec la règle de src/pages/creations/[categorie].astro :
 * retirer une catégorie de cette liste dès qu'elle compte 3 pièces.
 * « couture » n'y figure pas : c'est une page d'atterrissage rédigée
 * (« couture sur mesure à Vitré »), indexée quel que soit le nombre de pièces.
 */
const CATEGORIES_NOINDEX = ['naissance', 'linge-de-bain', 'vetements', 'decoration-ajouree', 'noel'];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /merci/ et l'admin ne doivent jamais être indexés
      filter: (page) =>
        !page.includes(`/${ADMIN_PATH}/`) &&
        !page.endsWith('/merci/') &&
        !CATEGORIES_NOINDEX.some((c) => page.endsWith(`/creations/${c}/`)),
    }),
  ],
  image: {
    // Formats modernes, générés au build (astro:assets)
    responsiveStyles: true,
  },
});
