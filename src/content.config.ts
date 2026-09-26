import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Les créations et les articles du journal sont du contenu de fond : ils sont
 * intégrés au build, pour le référencement et la performance.
 *
 * ⚠️ Les champs qu'Emma pilote depuis l'admin — prix, ordre d'affichage, mise
 * en avant, visibilité, photos ajoutées — ne sont PAS ici. Ils vivent dans
 * Netlify Blobs et sont fusionnés à l'exécution (voir CLAUDE.md § 5 bis).
 * Les valeurs ci-dessous servent de repli si la fonction échoue.
 */

const CATEGORIES = [
  'naissance',
  'linge-de-bain',
  'vetements',
  'couture',
  'decoration-ajouree',
  'noel',
] as const;

const OCCASIONS = [
  'naissance',
  'mariage',
  'fete-des-meres',
  'noel',
  'anniversaire',
  'bapteme',
  'retraite',
] as const;

const creations = defineCollection({
  loader: glob({ base: './src/content/creations', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      /** Phrase courte affichée sous le titre en galerie. */
      accroche: z.string(),
      categorie: z.enum(CATEGORIES),
      occasions: z.array(z.enum(OCCASIONS)).default([]),

      /** Photo principale. Les suivantes alimentent la fiche. */
      photo: image(),
      photos: z.array(image()).default([]),
      /** Texte alternatif de la photo principale : obligatoire, jamais deviné. */
      alt: z.string(),

      /** Repli si l'admin ne répond pas. En euros, « à partir de ». */
      prixDepart: z.number().optional(),
      /** Repli. Exprimé en jours ouvrés. */
      delaiJours: z.number().optional(),

      /** Vrai si la pièce est cousue par Emma, pas seulement brodée. */
      cousuMain: z.boolean().default(false),

      /** Ordre de repli ; l'admin peut le remplacer. */
      ordre: z.number().default(100),
      enAvant: z.boolean().default(false),
      /** Retirée de la vitrine sans être supprimée. */
      masquee: z.boolean().default(false),

      /** Accord écrit de la cliente pour afficher son prénom ou son enfant. */
      accordClient: z.boolean().default(false),
    }),
});

const journal = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      photo: image().optional(),
      alt: z.string().optional(),
      brouillon: z.boolean().default(false),
    }),
});

export const collections = { creations, journal };
